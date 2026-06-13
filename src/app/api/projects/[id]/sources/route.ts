import { NextRequest, NextResponse } from "next/server";
import {
  createRawSource,
  listRawSources,
} from "@/lib/obsidian/sources";
import type { RawSourceType } from "@/lib/obsidian/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const sources = await listRawSources(id);
  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const input = await parseSourceInput(request);
    const source = await createRawSource({
      projectId: id,
      ...input,
    });
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

async function parseSourceInput(request: NextRequest): Promise<{
  title: string;
  sourceType: RawSourceType;
  content: string;
  sourceUrl?: string;
  uploadedBy?: string;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const sourceType = String(form.get("sourceType") ?? "file") as RawSourceType;
    const uploadedBy = String(form.get("uploadedBy") ?? "user");

    if (sourceType === "file") {
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("file is required");
      const content = await file.text();
      return {
        title: String(form.get("title") ?? file.name),
        sourceType: "file",
        content,
        uploadedBy,
      };
    }

    if (sourceType === "url") {
      const sourceUrl = String(form.get("sourceUrl") ?? "");
      const fetched = await fetchUrlContent(sourceUrl);
      return {
        title: String(form.get("title") ?? fetched.title),
        sourceType: "url",
        sourceUrl,
        content: fetched.content,
        uploadedBy,
      };
    }

    return {
      title: String(form.get("title") ?? "Text Source"),
      sourceType: "text",
      content: String(form.get("content") ?? ""),
      uploadedBy,
    };
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    sourceType?: RawSourceType;
    content?: string;
    sourceUrl?: string;
    uploadedBy?: string;
  };
  const sourceType = body.sourceType ?? (body.sourceUrl ? "url" : "text");

  if (sourceType === "url") {
    const fetched = await fetchUrlContent(body.sourceUrl ?? "");
    return {
      title: body.title ?? fetched.title,
      sourceType: "url",
      sourceUrl: body.sourceUrl,
      content: fetched.content,
      uploadedBy: body.uploadedBy,
    };
  }

  return {
    title: body.title ?? "Text Source",
    sourceType,
    content: body.content ?? "",
    uploadedBy: body.uploadedBy,
  };
}

async function fetchUrlContent(sourceUrl: string) {
  if (!sourceUrl) throw new Error("sourceUrl is required");
  const url = new URL(sourceUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are supported");
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`URL fetch failed: ${response.status}`);
  }

  const raw = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const title = extractTitle(raw) ?? url.hostname;
  const content = contentType.includes("html") ? htmlToText(raw) : raw;
  return {
    title,
    content: content.replace(/\s+/g, " ").trim().slice(0, 16000),
  };
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

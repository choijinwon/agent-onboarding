import { NextResponse } from "next/server";
import {
  createWikiUpdateRequest,
  listWikiUpdateRequests,
} from "@/lib/obsidian/writer";
import { WikiWriteRequest } from "@/lib/obsidian/types";

export async function GET() {
  const requests = await listWikiUpdateRequests();
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const body = (await request.json()) as WikiWriteRequest;
  if (!body.projectId || !body.folder || !body.title || !body.markdown) {
    return NextResponse.json(
      { error: "projectId, folder, title, and markdown are required" },
      { status: 400 },
    );
  }

  try {
    const stored = await createWikiUpdateRequest(body);
    return NextResponse.json({ request: stored }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

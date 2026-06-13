import { NextResponse } from "next/server";
import { queryVault } from "@/lib/obsidian/query";
import { WikiQueryRequest } from "@/lib/obsidian/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as WikiQueryRequest;
  if (!body.query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const result = await queryVault(id, body);
  return NextResponse.json(result);
}

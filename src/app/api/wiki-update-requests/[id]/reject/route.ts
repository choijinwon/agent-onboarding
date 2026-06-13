import { NextResponse } from "next/server";
import { rejectWikiUpdateRequest } from "@/lib/obsidian/writer";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { reason?: string };

  try {
    const rejected = await rejectWikiUpdateRequest(id, body.reason);
    return NextResponse.json({ request: rejected });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

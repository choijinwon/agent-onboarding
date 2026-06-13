import { NextResponse } from "next/server";
import { approveWikiUpdateRequest } from "@/lib/obsidian/writer";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const approved = await approveWikiUpdateRequest(id);
    return NextResponse.json({ request: approved });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

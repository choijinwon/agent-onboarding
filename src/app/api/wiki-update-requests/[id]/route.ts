import { NextResponse } from "next/server";
import { updateWikiUpdateRequest } from "@/lib/obsidian/writer";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const updated = await updateWikiUpdateRequest(id, body);
    return NextResponse.json({ request: updated });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

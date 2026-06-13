import { NextResponse } from "next/server";
import { searchVaultDocuments } from "@/lib/obsidian/search";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { query?: string };
  const documents = await searchVaultDocuments(body.query ?? "", id);
  return NextResponse.json({ documents });
}

import { NextResponse } from "next/server";
import { listVaultDocuments } from "@/lib/obsidian/vault";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const documents = await listVaultDocuments();
  return NextResponse.json({
    documents: documents.filter((doc) => doc.frontmatter.projectId === id),
  });
}

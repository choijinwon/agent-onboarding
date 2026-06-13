import { NextResponse } from "next/server";
import { readVaultDocument } from "@/lib/obsidian/vault";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentPath = searchParams.get("path");
  if (!documentPath) {
    return NextResponse.json({ error: "Missing path query" }, { status: 400 });
  }

  try {
    const document = await readVaultDocument(documentPath);
    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 404 },
    );
  }
}

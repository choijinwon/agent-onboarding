import { NextRequest, NextResponse } from "next/server";
import { ingestRawSourceToWorkflow } from "@/lib/obsidian/sources";

type RouteContext = {
  params: Promise<{ id: string; sourceId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id, sourceId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    instruction?: string;
  };

  try {
    const result = await ingestRawSourceToWorkflow(
      id,
      sourceId,
      body.instruction,
    );
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

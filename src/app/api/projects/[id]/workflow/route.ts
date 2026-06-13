import { NextRequest, NextResponse } from "next/server";
import { getProjectWorkflow } from "@/lib/projects/workflow";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const workflow = await getProjectWorkflow(id);
  return NextResponse.json({ workflow });
}

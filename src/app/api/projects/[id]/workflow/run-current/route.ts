import { NextRequest, NextResponse } from "next/server";
import { runCurrentWorkflowStep } from "@/lib/projects/workflow";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const result = await runCurrentWorkflowStep(id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

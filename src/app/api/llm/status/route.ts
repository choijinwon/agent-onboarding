import { NextResponse } from "next/server";
import { getLlmStatus } from "@/lib/llm";

export async function GET() {
  return NextResponse.json({ status: getLlmStatus() });
}

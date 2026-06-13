import { NextResponse } from "next/server";
import { getCurrentProject } from "@/lib/projects/registry";

export async function GET() {
  const current = await getCurrentProject();
  return NextResponse.json(current);
}

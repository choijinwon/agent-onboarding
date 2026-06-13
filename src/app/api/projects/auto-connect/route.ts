import { NextResponse } from "next/server";
import { autoConnectCurrentProject } from "@/lib/projects/registry";

export async function POST() {
  const project = await autoConnectCurrentProject();
  return NextResponse.json({ project }, { status: 201 });
}

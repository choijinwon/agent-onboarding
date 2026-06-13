import { redirect } from "next/navigation";
import { autoConnectCurrentProject } from "@/lib/projects/registry";

export const dynamic = "force-dynamic";

export default async function Home() {
  const project = await autoConnectCurrentProject();
  redirect(`/projects/${project.projectId}/obsidian`);
}

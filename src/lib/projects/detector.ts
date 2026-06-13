import path from "path";
import { getVaultRoot } from "@/lib/obsidian/vault";
import packageJson from "../../../package.json";
import { DetectedProject } from "./types";

const WORKSPACE_ROOT = process.cwd();

type PackageJson = {
  name?: string;
  version?: string;
  description?: string;
};

export async function detectCurrentProject(): Promise<DetectedProject> {
  const packageInfo = packageJson as PackageJson;
  const folderName = path.basename(WORKSPACE_ROOT);
  const projectId = slugifyProjectId(folderName || packageInfo.name || "project");
  const name = humanizeProjectName(folderName || packageInfo.name || projectId);

  return {
    projectId,
    name,
    rootPath: WORKSPACE_ROOT,
    vaultPath: getVaultRoot(),
    packageName: packageInfo.name,
    packageVersion: packageInfo.version,
    description: packageInfo.description,
  };
}

function slugifyProjectId(value: string): string {
  return (
    value
      .replace(/^@/, "")
      .replace(/\//g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "project"
  );
}

function humanizeProjectName(value: string): string {
  return value
    .replace(/^@[^/]+\//, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

import { promises as fs } from "fs";
import path from "path";
import { ensureVaultStructure, slugifyTitle, toVaultPath } from "@/lib/obsidian/vault";
import { detectCurrentProject } from "./detector";
import { DetectedProject, ProjectRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

export async function listProjects(): Promise<ProjectRecord[]> {
  return readProjects();
}

export async function getProject(projectId: string): Promise<ProjectRecord | undefined> {
  const projects = await readProjects();
  return projects.find((project) => project.projectId === projectId);
}

export async function getCurrentProject() {
  const detected = await detectCurrentProject();
  const projects = await readProjects();
  const registered = projects.find(
    (project) =>
      project.projectId === detected.projectId || project.rootPath === detected.rootPath,
  );

  return { detected, registered };
}

export async function autoConnectCurrentProject(): Promise<ProjectRecord> {
  const detected = await detectCurrentProject();
  return upsertDetectedProject(detected);
}

async function upsertDetectedProject(detected: DetectedProject): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  const projects = await readProjects();
  const index = projects.findIndex(
    (project) =>
      project.projectId === detected.projectId || project.rootPath === detected.rootPath,
  );
  const existing = index >= 0 ? projects[index] : undefined;
  const project: ProjectRecord = {
    ...existing,
    ...detected,
    status: existing?.status ?? "active",
    connectedAt: existing?.connectedAt ?? now,
    updatedAt: now,
  };

  project.projectDocumentPath = await ensureProjectDocument(project);

  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }

  await writeProjects(projects);
  return project;
}

async function readProjects(): Promise<ProjectRecord[]> {
  try {
    const raw = await fs.readFile(PROJECTS_FILE, "utf8");
    return JSON.parse(raw) as ProjectRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeProjects(projects: ProjectRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf8");
}

async function ensureProjectDocument(project: ProjectRecord): Promise<string> {
  await ensureVaultStructure();
  const relativePath = path.join("01_projects", `${slugifyTitle(project.name)}.md`);
  const fullPath = toVaultPath(relativePath);

  try {
    await fs.access(fullPath);
    return relativePath;
  } catch {
    // Create a new human-readable project map.
  }

  const body = `---
type: wiki
projectId: ${project.projectId}
category: projects
status: approved
confidence: HIGH
source: auto-connect
updatedBy: ProjectConnector
updatedAt: ${new Date().toISOString().slice(0, 10)}
---

# ${project.name}

## Summary

이 문서는 현재 작업 폴더를 Obsidian AI 업무 Wiki 프로젝트로 자동 연결한 프로젝트 개요다.

## Context

- Project ID: \`${project.projectId}\`
- Root path: \`${project.rootPath}\`
- Vault path: \`${project.vaultPath}\`
- Package: ${project.packageName ? `\`${project.packageName}\`` : "N/A"}
- Version: ${project.packageVersion ? `\`${project.packageVersion}\`` : "N/A"}
- Git remote: ${project.gitRemote ? `\`${project.gitRemote}\`` : "N/A"}

## Decision

이 프로젝트는 현재 Vault와 연결된 active 프로젝트로 등록한다. 이후 Agent 수집, 승인 요청, Vault 문서 필터링은 \`${project.projectId}\`를 기준으로 수행한다.

## Details

${project.description ?? "자동 감지된 설명이 없습니다. ProjectAgent가 프로젝트 목표와 범위를 보강해야 합니다."}

## Related Links

- [[Agent 수집 프로필]]
- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
`;

  await fs.writeFile(fullPath, body, "utf8");
  return relativePath;
}

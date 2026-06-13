import { promises as fs } from "fs";
import path from "path";
import { assertAgentCanWrite } from "./agents";
import { ensureWikiFrontmatter } from "./frontmatter";
import { extractObsidianLinks } from "./links";
import {
  Confidence,
  StoredWikiUpdateRequest,
  VaultFolder,
  WikiUpdateStatus,
  WikiWriteRequest,
} from "./types";
import {
  assertVaultFolder,
  ensureVaultStructure,
  getVaultRoot,
  slugifyTitle,
  toVaultPath,
} from "./vault";

const DATA_DIR = path.join(process.cwd(), "data");
const REQUESTS_FILE = path.join(DATA_DIR, "wiki-update-requests.json");
const RAW_SOURCE_FOLDER = "00_raw_sources";

async function readRequests(): Promise<StoredWikiUpdateRequest[]> {
  try {
    const raw = await fs.readFile(REQUESTS_FILE, "utf8");
    return JSON.parse(raw) as StoredWikiUpdateRequest[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeRequests(requests: StoredWikiUpdateRequest[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf8");
}

export async function listWikiUpdateRequests() {
  return readRequests();
}

export async function updateWikiUpdateRequest(
  id: string,
  updates: Partial<{
    folder: VaultFolder;
    title: string;
    markdown: string;
    agentRole: string;
    confidence: Confidence;
    status: WikiUpdateStatus;
  }>,
): Promise<StoredWikiUpdateRequest> {
  const requests = await readRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Wiki update request not found");
  if (request.status === "approved" || request.status === "rejected") {
    throw new Error("Approved or rejected requests cannot be edited");
  }

  if (updates.folder) {
    assertVaultFolder(updates.folder);
    assertWritableTargetFolder(updates.folder);
  }

  const nextFolder = updates.folder ?? request.folder;
  const nextAgentRole = updates.agentRole ?? request.agentRole;
  if (updates.folder || updates.agentRole) {
    assertAgentCanWrite(nextAgentRole, nextFolder);
  }

  if (updates.folder) request.folder = updates.folder;
  if (updates.title !== undefined) request.title = updates.title;
  if (updates.markdown !== undefined) request.markdown = updates.markdown;
  if (updates.agentRole !== undefined) request.agentRole = updates.agentRole;
  if (updates.confidence !== undefined) {
    request.confidence = updates.confidence;
    request.markdown = ensureWikiFrontmatter(request.markdown, {
      confidence: updates.confidence,
    });
  }
  if (updates.status !== undefined) {
    if (!["pending", "needs_revision"].includes(updates.status)) {
      throw new Error("PATCH can only set status to pending or needs_revision");
    }
    request.status = updates.status;
  }

  await writeRequests(requests);
  return request;
}

export async function rejectWikiUpdateRequest(
  id: string,
  reason?: string,
): Promise<StoredWikiUpdateRequest> {
  const requests = await readRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Wiki update request not found");
  if (request.status === "approved") {
    throw new Error("Approved requests cannot be rejected");
  }

  request.status = "rejected";
  request.rejectedAt = new Date().toISOString();
  request.rejectionReason = reason;
  await writeRequests(requests);
  return request;
}

export async function createWikiUpdateRequest(
  request: WikiWriteRequest,
): Promise<StoredWikiUpdateRequest> {
  assertVaultFolder(request.folder);
  assertWritableTargetFolder(request.folder);
  assertAgentCanWrite(request.agentRole, request.folder);
  const stored: StoredWikiUpdateRequest = {
    ...request,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const requests = await readRequests();
  requests.unshift(stored);
  await writeRequests(requests);
  return stored;
}

export async function approveWikiUpdateRequest(
  id: string,
): Promise<StoredWikiUpdateRequest> {
  await ensureVaultStructure();
  const requests = await readRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Wiki update request not found");
  if (request.status !== "pending") throw new Error("Request is not pending");
  assertWritableTargetFolder(request.folder);
  assertAgentCanWrite(request.agentRole, request.folder);
  if (request.confidence !== "HIGH") {
    throw new Error("Only HIGH confidence markdown can be approved to the vault");
  }

  const now = new Date().toISOString();
  const relativePath = path.join(
    request.folder,
    `${slugifyTitle(request.title)}.md`,
  );
  const markdown = ensureWikiFrontmatter(request.markdown, {
    type: "wiki",
    projectId: request.projectId,
    category: request.folder.replace(/^\d+_/, ""),
    status: "approved",
    confidence: request.confidence,
    updatedBy: request.agentRole,
    updatedAt: now.slice(0, 10),
    ...(request.workflowStepId ? { workflowStepId: request.workflowStepId } : {}),
  });

  await fs.writeFile(toVaultPath(relativePath), markdown, "utf8");
  await writeAgentLog(request, relativePath, now, markdown);
  await appendVaultTimeline(request, relativePath, now);
  await appendVaultIndexEntry(request, relativePath);

  request.status = "approved";
  request.approvedAt = now;
  request.vaultPath = relativePath;
  await writeRequests(requests);
  return request;
}

function assertWritableTargetFolder(folder: string): void {
  if (folder === RAW_SOURCE_FOLDER) {
    throw new Error(
      "00_raw_sources is read-only. Put raw source files there manually, then ingest summaries into wiki folders.",
    );
  }
}

async function writeAgentLog(
  request: StoredWikiUpdateRequest,
  vaultPath: string,
  timestamp: string,
  markdown: string,
) {
  const logPath = path.join(
    getVaultRoot(),
    "99_logs",
    `${timestamp.replace(/[:.]/g, "-")}-${slugifyTitle(request.agentRole)}.md`,
  );
  const links = extractObsidianLinks(markdown)
    .map((link) => `- [[${link}]]`)
    .join("\n");
  const body = `---
type: agent-log
projectId: ${request.projectId}
status: approved
confidence: ${request.confidence}
updatedBy: ${request.agentRole}
updatedAt: ${timestamp.slice(0, 10)}
---

# ${request.agentRole} Vault Update

## Summary

- Approved request: ${request.id}
- Vault path: ${vaultPath}
- Target document: [[${request.title}]]

## Related Links

${links || "- No Obsidian links found."}
`;

  await fs.writeFile(logPath, body, "utf8");
}

async function appendVaultTimeline(
  request: StoredWikiUpdateRequest,
  vaultPath: string,
  timestamp: string,
) {
  const logPath = toVaultPath("log.md");
  const entry = `\n## [${timestamp.slice(0, 10)}] approve | ${request.title}\n\n- Agent: ${request.agentRole}\n- Confidence: ${request.confidence}\n- Vault path: ${vaultPath}\n- Document: [[${request.title}]]\n`;

  await fs.appendFile(logPath, entry, "utf8");
}

async function appendVaultIndexEntry(
  request: StoredWikiUpdateRequest,
  vaultPath: string,
) {
  const indexPath = toVaultPath("index.md");
  const current = await fs.readFile(indexPath, "utf8").catch(() => "");
  const link = `[[${request.title}]]`;
  if (current.includes(link)) return;

  const header = "## Recently Approved";
  const entry = `\n\n- ${link}: approved by ${request.agentRole} into \`${vaultPath}\``;
  const next = current.includes(header)
    ? current.replace(header, `${header}${entry}`)
    : `${current.trim()}\n\n${header}${entry}\n`;

  await fs.writeFile(indexPath, next, "utf8");
}

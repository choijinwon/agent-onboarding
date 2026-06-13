export const VAULT_FOLDERS = [
  "00_raw_sources",
  "01_projects",
  "02_agents",
  "03_decisions",
  "04_requirements",
  "05_architecture",
  "06_design",
  "07_frontend",
  "08_backend",
  "09_database",
  "10_qa",
  "99_logs",
] as const;

export type VaultFolder = (typeof VAULT_FOLDERS)[number];

export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type WikiUpdateStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_revision";

export type VaultDocument = {
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, string>;
  links: string[];
};

export type WikiWriteRequest = {
  projectId: string;
  folder: VaultFolder;
  title: string;
  markdown: string;
  agentRole: string;
  confidence: Confidence;
  workflowStepId?: string;
};

export type StoredWikiUpdateRequest = WikiWriteRequest & {
  id: string;
  status: WikiUpdateStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  vaultPath?: string;
};

export type LintIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
  link?: string;
};

export type WikiQueryRequest = {
  query: string;
  includeLogs?: boolean;
  maxDocuments?: number;
};

export type WikiQueryResponse = {
  answer: string;
  citations: { title: string; path: string }[];
  usedDocuments: VaultDocument[];
  mode: "llm" | "fallback";
};

export type RawSourceType = "text" | "file" | "url";
export type RawSourceIngestStatus = "collected" | "ingested" | "failed";

export type RawSource = {
  id: string;
  projectId: string;
  path: string;
  title: string;
  sourceType: RawSourceType;
  sourceUrl?: string;
  uploadedBy: string;
  collectedAt: string;
  hash: string;
  ingestStatus: RawSourceIngestStatus;
  content: string;
  preview: string;
};

export type IngestRequest = {
  sourceId: string;
  instruction?: string;
};

export type IngestResult = {
  source: RawSource;
  summaryMarkdown: string;
  relatedWorkflowStepId?: string;
  targetRequestId?: string;
  updatedRequest?: StoredWikiUpdateRequest;
  mode: "llm" | "fallback";
};

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AGENT_ROLE_DEFINITIONS,
  canAgentWriteFolder,
  getAgentRoleDefinition,
} from "@/lib/obsidian/agents";
import type { AgentRoleDefinition } from "@/lib/obsidian/agents";

type VaultDocument = {
  path: string;
  title: string;
  content: string;
  frontmatter: Record<string, string>;
  links: string[];
};

type StoredWikiUpdateRequest = {
  id: string;
  projectId: string;
  folder: string;
  title: string;
  markdown: string;
  agentRole: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  status: "pending" | "approved" | "rejected" | "needs_revision";
  createdAt: string;
  approvedAt?: string;
  vaultPath?: string;
};

type Confidence = StoredWikiUpdateRequest["confidence"];

type LintIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
  link?: string;
};

type WikiQueryResponse = {
  answer: string;
  citations: { title: string; path: string }[];
  usedDocuments: VaultDocument[];
  mode: "llm" | "fallback";
};

type LlmStatus = {
  provider: "openai" | "qwen" | "ollama" | "fallback";
  configured: boolean;
  mode: "llm" | "fallback";
  model: string;
  reason: string;
  baseUrl?: string;
};

type ProjectRecord = {
  projectId: string;
  name: string;
  rootPath: string;
  vaultPath: string;
  status: "active" | "archived";
  connectedAt: string;
  updatedAt: string;
  projectDocumentPath?: string;
  packageName?: string;
  packageVersion?: string;
  gitRemote?: string;
  description?: string;
};

type ProjectWorkflowStepStatus = "locked" | "ready" | "review" | "approved";

type ProjectWorkflowStep = {
  id: string;
  order: number;
  title: string;
  agentRole: string;
  folder: string;
  outputTitle: string;
  goal: string;
  requiredInputs: string[];
  requiredOutputs: string[];
  status: ProjectWorkflowStepStatus;
  requestId?: string;
  vaultPath?: string;
  approvedAt?: string;
};

type ProjectWorkflow = {
  projectId: string;
  activeStepId?: string;
  status: "not_started" | "in_progress" | "complete";
  steps: ProjectWorkflowStep[];
};

type RawSource = {
  id: string;
  projectId: string;
  path: string;
  title: string;
  sourceType: "text" | "file" | "url";
  sourceUrl?: string;
  uploadedBy: string;
  collectedAt: string;
  hash: string;
  ingestStatus: "collected" | "ingested" | "failed";
  preview: string;
};

type SourceMode = RawSource["sourceType"];

type LintFilter = "all" | LintIssue["severity"];

const FOLDER_LABELS: Record<string, string> = {
  "00_raw_sources": "Raw",
  "01_projects": "Projects",
  "02_agents": "Agents",
  "03_decisions": "Decisions",
  "04_requirements": "Reqs",
  "05_architecture": "Arch",
  "06_design": "Design",
  "07_frontend": "Frontend",
  "08_backend": "Backend",
  "09_database": "DB",
  "10_qa": "QA",
  "99_logs": "Logs",
};

function getFolder(path: string) {
  return path.split("/")[0] ?? "vault";
}

function normalizeLinkTitle(value: string) {
  return value
    .split("|")[0]
    .split("#")[0]
    .replace(/\.md$/i, "")
    .trim();
}

function filterDocuments(
  documents: VaultDocument[],
  query: string,
  folderFilter: string,
) {
  const needle = query.trim().toLowerCase();

  return documents.filter((doc) => {
    if (folderFilter !== "all" && getFolder(doc.path) !== folderFilter) {
      return false;
    }

    if (!needle) {
      return true;
    }

    return [
      doc.title,
      doc.path,
      doc.content,
      doc.frontmatter.category,
      doc.frontmatter.status,
      doc.frontmatter.confidence,
      doc.frontmatter.updatedBy,
    ].some((value) => value?.toLowerCase().includes(needle));
  });
}

function agentReadFolderLabels(profile: AgentRoleDefinition) {
  return profile.readFolders === "all" ? ["all"] : [...profile.readFolders];
}

function buildCollectionQuestion(profile: AgentRoleDefinition) {
  return `${profile.agentRole} 역할로 Obsidian Vault를 참조해서 다음 항목을 수집해줘: ${profile.collects.join(", ")}. 근거는 ${profile.requiredEvidence.join(", ")} 기준으로 표시하고, 추측은 LOW confidence로 분리해줘.`;
}

function workflowStatusLabel(status: ProjectWorkflowStepStatus) {
  const labels: Record<ProjectWorkflowStepStatus, string> = {
    approved: "approved",
    locked: "locked",
    ready: "ready",
    review: "review",
  };
  return labels[status];
}

export function ObsidianVaultClient({ projectId }: { projectId: string }) {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [selected, setSelected] = useState<VaultDocument | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [requests, setRequests] = useState<StoredWikiUpdateRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [wikiQuestion, setWikiQuestion] = useState("");
  const [wikiAnswer, setWikiAnswer] = useState<WikiQueryResponse | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [workflow, setWorkflow] = useState<ProjectWorkflow | null>(null);
  const [sources, setSources] = useState<RawSource[]>([]);
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([]);
  const [lintFilter, setLintFilter] = useState<LintFilter>("all");
  const [lintHasRun, setLintHasRun] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectConnecting, setProjectConnecting] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourceSubmitting, setSourceSubmitting] = useState(false);
  const [sourceIngestingId, setSourceIngestingId] = useState<string | null>(null);
  const [llmStatusLoading, setLlmStatusLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [lintLoading, setLintLoading] = useState(false);
  const [selectedCollectionRole, setSelectedCollectionRole] =
    useState("RequirementsAgent");
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceInstruction, setSourceInstruction] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadCurrentProject();
    void loadDocuments();
    void loadRequests();
    void loadLlmStatus();
    void loadWorkflow();
    void loadSources();
  }, [projectId]);

  async function loadSources() {
    setSourcesLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/sources`);
      const data = (await response.json()) as { sources: RawSource[] };
      setSources(data.sources);
    } catch {
      setMessage("수집 자료 목록을 불러오지 못했습니다.");
    } finally {
      setSourcesLoading(false);
    }
  }

  async function loadWorkflow() {
    setWorkflowLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/workflow`);
      const data = (await response.json()) as { workflow: ProjectWorkflow };
      setWorkflow(data.workflow);
    } catch {
      setMessage("프로젝트 워크플로우를 불러오지 못했습니다.");
    } finally {
      setWorkflowLoading(false);
    }
  }

  async function loadLlmStatus() {
    setLlmStatusLoading(true);
    try {
      const response = await fetch("/api/llm/status");
      const data = (await response.json()) as { status: LlmStatus };
      setLlmStatus(data.status);
    } catch {
      setLlmStatus({
        provider: "fallback",
        configured: false,
        mode: "fallback",
        model: "unknown",
        reason: "LLM 상태를 확인하지 못했습니다.",
      });
    } finally {
      setLlmStatusLoading(false);
    }
  }

  async function loadCurrentProject() {
    setProjectLoading(true);
    try {
      const response = await fetch("/api/projects/current");
      const data = (await response.json()) as {
        detected: ProjectRecord;
        registered?: ProjectRecord;
      };
      setProject(data.registered ?? data.detected);
    } catch {
      setMessage("현재 프로젝트를 감지하지 못했습니다.");
    } finally {
      setProjectLoading(false);
    }
  }

  async function autoConnectProject() {
    setProjectConnecting(true);
    setMessage("");
    try {
      const response = await fetch("/api/projects/auto-connect", {
        method: "POST",
      });
      const data = (await response.json()) as { project?: ProjectRecord; error?: string };
      if (!response.ok || !data.project) {
        setMessage(data.error ?? "프로젝트 자동 연결에 실패했습니다.");
        return;
      }

      setProject(data.project);
      setMessage(`프로젝트 연결 완료: ${data.project.projectId}`);
      await loadDocuments();
      await loadRequests();
      await loadWorkflow();
      await loadSources();

      if (data.project.projectId !== projectId) {
        window.location.href = `/projects/${data.project.projectId}/obsidian`;
      }
    } finally {
      setProjectConnecting(false);
    }
  }

  async function loadDocuments() {
    setDocumentsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/obsidian/documents`);
      const data = (await response.json()) as { documents: VaultDocument[] };
      setDocuments(data.documents);
      setSelected((current) => {
        if (!current) {
          return data.documents[0] ?? null;
        }
        return (
          data.documents.find((doc) => doc.path === current.path) ??
          data.documents[0] ??
          null
        );
      });
    } catch {
      setMessage("Vault 문서를 불러오지 못했습니다.");
    } finally {
      setDocumentsLoading(false);
    }
  }

  async function loadRequests() {
    setRequestsLoading(true);
    try {
      const response = await fetch("/api/wiki-update-requests");
      const data = (await response.json()) as { requests: StoredWikiUpdateRequest[] };
      const projectRequests = data.requests.filter((item) => item.projectId === projectId);
      setRequests(projectRequests);
      setDrafts((current) => {
        const next = { ...current };
        for (const request of projectRequests) {
          next[request.id] ??= request.markdown;
        }
        return next;
      });
    } catch {
      setMessage("승인 대기 목록을 불러오지 못했습니다.");
    } finally {
      setRequestsLoading(false);
    }
  }

  function search() {
    const firstResult = filterDocuments(documents, query, folderFilter)[0] ?? null;
    setSelected(firstResult);
    setMessage(firstResult ? "" : "검색 결과가 없습니다.");
  }

  function selectDocument(doc: VaultDocument) {
    setSelected(doc);
    setMessage("");
  }

  function selectDocumentByPath(path?: string) {
    if (!path) return;
    const normalizedPath = path.replace(/^\/?vault\//, "");
    const doc = documents.find(
      (item) => item.path === normalizedPath || item.path.endsWith(normalizedPath),
    );

    if (!doc) {
      setMessage(`문서를 찾을 수 없습니다: ${path}`);
      return;
    }

    selectDocument(doc);
  }

  function selectDocumentByLink(link: string) {
    const title = normalizeLinkTitle(link);
    const doc = documents.find((item) => {
      const fileTitle = normalizeLinkTitle(item.path.split("/").pop() ?? item.title);
      return item.title === title || fileTitle === title;
    });

    if (!doc) {
      setMessage(`연결 문서를 찾을 수 없습니다: [[${title}]]`);
      return;
    }

    selectDocument(doc);
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} 복사 완료`);
    } catch {
      setMessage(`${label} 복사에 실패했습니다.`);
    }
  }

  async function approve(id: string) {
    setMessage("");
    const response = await fetch(`/api/wiki-update-requests/${id}/approve-to-vault`, {
      method: "POST",
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "승인 처리에 실패했습니다.");
      return;
    }
    setMessage(`Vault 저장 완료: ${data.request.vaultPath}`);
    await loadRequests();
    await loadDocuments();
    await loadWorkflow();
  }

  async function saveDraft(request: StoredWikiUpdateRequest) {
    setMessage("");
    const response = await fetch(`/api/wiki-update-requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: drafts[request.id] ?? request.markdown,
        status: "pending",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "수정본 저장에 실패했습니다.");
      return;
    }
    setMessage(`수정본 저장 완료: ${data.request.title}`);
    await loadRequests();
  }

  async function updateRequestConfidence(id: string, confidence: Confidence) {
    setMessage("");
    const response = await fetch(`/api/wiki-update-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confidence }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Confidence 변경에 실패했습니다.");
      return;
    }
    setMessage(`Confidence 변경 완료: ${data.request.confidence}`);
    await loadRequests();
    await loadWorkflow();
  }

  async function markNeedsRevision(id: string) {
    setMessage("");
    const response = await fetch(`/api/wiki-update-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "needs_revision" }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "수정 필요 처리에 실패했습니다.");
      return;
    }
    setMessage(`수정 필요로 표시했습니다: ${data.request.title}`);
    await loadRequests();
  }

  async function reject(id: string) {
    setMessage("");
    const response = await fetch(`/api/wiki-update-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Rejected from Obsidian Vault UI" }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "거절 처리에 실패했습니다.");
      return;
    }
    setMessage(`거절 완료: ${data.request.title}`);
    await loadRequests();
    await loadWorkflow();
  }

  async function runCurrentWorkflowStep() {
    setWorkflowRunning(true);
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/workflow/run-current`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        request?: StoredWikiUpdateRequest;
        workflow?: ProjectWorkflow;
        error?: string;
      };
      if (!response.ok || !data.request || !data.workflow) {
        setMessage(data.error ?? "현재 단계 산출물 생성에 실패했습니다.");
        return;
      }

      setWorkflow(data.workflow);
      await loadRequests();
      setSelectedRequestId(data.request.id);
      setMessage(`승인 대기 생성 완료: ${data.request.title}`);
    } finally {
      setWorkflowRunning(false);
    }
  }

  async function submitSource(autoIngest: boolean) {
    setSourceSubmitting(true);
    setMessage("");
    try {
      let response: Response;
      if (sourceMode === "file") {
        if (!sourceFile) {
          setMessage("업로드할 Markdown/TXT 파일을 선택하세요.");
          return;
        }
        const form = new FormData();
        form.set("sourceType", "file");
        form.set("title", sourceTitle || sourceFile.name);
        form.set("file", sourceFile);
        response = await fetch(`/api/projects/${projectId}/sources`, {
          method: "POST",
          body: form,
        });
      } else {
        response = await fetch(`/api/projects/${projectId}/sources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: sourceMode,
            title: sourceTitle,
            content: sourceText,
            sourceUrl,
          }),
        });
      }

      const data = (await response.json()) as { source?: RawSource; error?: string };
      if (!response.ok || !data.source) {
        setMessage(data.error ?? "자료 저장에 실패했습니다.");
        return;
      }

      setSourceTitle("");
      setSourceText("");
      setSourceUrl("");
      setSourceFile(null);
      await loadSources();
      await loadDocuments();
      setMessage(`Raw source 저장 완료: ${data.source.title}`);
      if (autoIngest) {
        await ingestSource(data.source.id);
      }
    } finally {
      setSourceSubmitting(false);
    }
  }

  async function ingestSource(sourceId: string) {
    setSourceIngestingId(sourceId);
    setMessage("");
    try {
      const response = await fetch(
        `/api/projects/${projectId}/sources/${sourceId}/ingest`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ instruction: sourceInstruction }),
        },
      );
      const data = (await response.json()) as {
        result?: {
          targetRequestId?: string;
          updatedRequest?: StoredWikiUpdateRequest;
          mode: "llm" | "fallback";
        };
        error?: string;
      };
      if (!response.ok || !data.result) {
        setMessage(data.error ?? "자료 반영에 실패했습니다.");
        return;
      }

      await loadSources();
      await loadRequests();
      await loadDocuments();
      await loadWorkflow();
      if (data.result.targetRequestId) {
        setSelectedRequestId(data.result.targetRequestId);
      }
      setMessage(
        `현재 workflow draft에 반영했습니다. mode: ${data.result.mode}`,
      );
    } finally {
      setSourceIngestingId(null);
    }
  }

  async function runLint() {
    setLintLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/obsidian/lint`, {
        method: "POST",
      });
      const data = (await response.json()) as { issues: LintIssue[] };
      setLintIssues(data.issues);
      setLintHasRun(true);
    } finally {
      setLintLoading(false);
    }
  }

  async function runWikiQuery() {
    if (!wikiQuestion.trim()) return;
    setQueryLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/projects/${projectId}/obsidian/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: wikiQuestion,
          includeLogs: true,
          maxDocuments: 6,
        }),
      });
      const data = (await response.json()) as WikiQueryResponse | { error: string };
      if (!response.ok || "error" in data) {
        setWikiAnswer(null);
        setMessage("error" in data ? data.error : "질의 처리에 실패했습니다.");
        return;
      }
      setWikiAnswer(data);
      if (data.mode === "fallback") {
        setMessage(
          "LLM API 키가 없어 Vault 문서 검색 기반 fallback 답변을 표시했습니다.",
        );
      }
    } finally {
      setQueryLoading(false);
    }
  }

  const actionableRequests = useMemo(
    () =>
      requests.filter(
        (item) => item.status === "pending" || item.status === "needs_revision",
      ),
    [requests],
  );

  useEffect(() => {
    setSelectedRequestId((current) => {
      if (current && actionableRequests.some((request) => request.id === current)) {
        return current;
      }
      return actionableRequests[0]?.id ?? null;
    });
  }, [actionableRequests]);

  const selectedRequest = useMemo(
    () =>
      actionableRequests.find((request) => request.id === selectedRequestId) ??
      actionableRequests[0] ??
      null,
    [actionableRequests, selectedRequestId],
  );

  const selectedRequestDraft = selectedRequest
    ? drafts[selectedRequest.id] ?? selectedRequest.markdown
    : "";

  const selectedRequestChanged = Boolean(
    selectedRequest && selectedRequestDraft !== selectedRequest.markdown,
  );

  const selectedAgentRole = selectedRequest
    ? getAgentRoleDefinition(selectedRequest.agentRole)
    : undefined;

  const selectedRequestCanWrite = Boolean(
    selectedRequest && canAgentWriteFolder(selectedRequest.agentRole, selectedRequest.folder),
  );

  const selectedCollectionProfile = useMemo(
    () =>
      getAgentRoleDefinition(selectedCollectionRole) ??
      getAgentRoleDefinition("RequirementsAgent") ??
      AGENT_ROLE_DEFINITIONS[0],
    [selectedCollectionRole],
  );

  const collectionDocumentCount = useMemo(() => {
    if (selectedCollectionProfile.readFolders === "all") {
      return documents.length;
    }

    const readFolders = selectedCollectionProfile.readFolders as readonly string[];
    return documents.filter((doc) => readFolders.includes(getFolder(doc.path))).length;
  }, [documents, selectedCollectionProfile]);

  function applyCollectionProfile(profile: AgentRoleDefinition) {
    const firstReadFolder =
      profile.readFolders === "all" ? "all" : profile.readFolders[0] ?? "all";
    setFolderFilter(firstReadFolder);
    setQuery("");
    setWikiQuestion(buildCollectionQuestion(profile));
    setMessage(`${profile.title} 수집 프로필을 적용했습니다.`);
  }

  const folderOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of documents) {
      const folder = getFolder(doc.path);
      counts.set(folder, (counts.get(folder) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([folder, count]) => ({
        count,
        folder,
        label: FOLDER_LABELS[folder] ?? folder,
      }))
      .sort((a, b) => a.folder.localeCompare(b.folder));
  }, [documents]);

  const filteredDocuments = useMemo(
    () => filterDocuments(documents, query, folderFilter),
    [documents, folderFilter, query],
  );

  const documentStats = useMemo(
    () => ({
      approved: documents.filter((doc) => doc.frontmatter.status === "approved").length,
      highConfidence: documents.filter((doc) => doc.frontmatter.confidence === "HIGH")
        .length,
      linked: documents.filter((doc) => doc.links.length > 0).length,
      total: documents.length,
      visible: filteredDocuments.length,
    }),
    [documents, filteredDocuments.length],
  );

  const reviewStats = useMemo(
    () => ({
      pending: actionableRequests.filter((request) => request.status === "pending").length,
      needsRevision: actionableRequests.filter(
        (request) => request.status === "needs_revision",
      ).length,
      highConfidence: actionableRequests.filter(
        (request) => request.confidence === "HIGH",
      ).length,
    }),
    [actionableRequests],
  );

  const lintStats = useMemo(
    () => ({
      error: lintIssues.filter((issue) => issue.severity === "error").length,
      warning: lintIssues.filter((issue) => issue.severity === "warning").length,
      info: lintIssues.filter((issue) => issue.severity === "info").length,
    }),
    [lintIssues],
  );

  const filteredLintIssues = useMemo(
    () =>
      lintFilter === "all"
        ? lintIssues
        : lintIssues.filter((issue) => issue.severity === lintFilter),
    [lintFilter, lintIssues],
  );

  const visibleLintIssues = filteredLintIssues.slice(0, 8);
  const activeWorkflowStep = workflow?.steps.find(
    (step) => step.id === workflow.activeStepId,
  );
  const workflowApprovedCount =
    workflow?.steps.filter((step) => step.status === "approved").length ?? 0;
  const workflowProgress = workflow
    ? `${workflowApprovedCount}/${workflow.steps.length}`
    : "0/0";
  const collectedSourceCount = sources.filter(
    (source) => source.ingestStatus === "collected",
  ).length;

  return (
    <main className="page">
      <aside className="sidebar">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Vault</div>
            <h2>Obsidian Vault</h2>
          </div>
          <span className="metric-pill">
            {documentStats.visible}/{documentStats.total}
          </span>
        </div>
        <div className="sidebar-subtitle">
          Project <code>{projectId}</code>
        </div>
        <input
          className="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void search();
          }}
          aria-label="Vault 문서 검색"
          placeholder="제목, 경로, 본문 검색"
        />
        <div className="actions compact">
          <button onClick={() => void search()}>검색</button>
          <button
            onClick={() => {
              setQuery("");
              setFolderFilter("all");
              setMessage("");
            }}
          >
            전체
          </button>
        </div>
        <div className="folder-tabs" role="tablist" aria-label="Vault 폴더 필터">
          <button
            className={`folder-tab ${folderFilter === "all" ? "active" : ""}`}
            onClick={() => setFolderFilter("all")}
            role="tab"
            aria-selected={folderFilter === "all"}
          >
            전체 <span>{documents.length}</span>
          </button>
          {folderOptions.map((option) => (
            <button
              className={`folder-tab ${folderFilter === option.folder ? "active" : ""}`}
              key={option.folder}
              onClick={() => setFolderFilter(option.folder)}
              role="tab"
              aria-selected={folderFilter === option.folder}
              title={option.folder}
            >
              {option.label} <span>{option.count}</span>
            </button>
          ))}
        </div>
        <div className="vault-quick-stats">
          <span>Approved {documentStats.approved}</span>
          <span>HIGH {documentStats.highConfidence}</span>
          <span>Linked {documentStats.linked}</span>
        </div>
        <div className="list">
          {documentsLoading ? (
            <div className="empty">Vault 문서를 불러오는 중입니다.</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="empty">아직 승인된 Vault 문서가 없습니다.</div>
          ) : (
            filteredDocuments.map((doc) => (
              <button
                key={doc.path}
                className={`doc-row ${selected?.path === doc.path ? "active" : ""}`}
                onClick={() => selectDocument(doc)}
              >
                <h3>{doc.title}</h3>
                <div className="path">{doc.path}</div>
                <div className="chips">
                  <span className="chip">{doc.frontmatter.category ?? "wiki"}</span>
                  <span
                    className={`chip confidence-${(doc.frontmatter.confidence ?? "na").toLowerCase()}`}
                  >
                    {doc.frontmatter.confidence ?? "N/A"}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="main">
        <header className="workspace-hero">
          <div>
            <div className="eyebrow">AI 업무 Wiki</div>
            <h1>Obsidian 운영 콘솔</h1>
            <p className="muted">
              승인된 Markdown만 Vault에 반영하고, Agent 결과는 검토 큐에서 관리합니다.
            </p>
          </div>
          <div className="metrics">
            <div className="metric">
              <span>문서</span>
              <strong>{documentStats.visible}</strong>
            </div>
            <div className="metric">
              <span>승인 대기</span>
              <strong>{reviewStats.pending}</strong>
            </div>
            <div className="metric">
              <span>Lint 오류</span>
              <strong>{lintStats.error}</strong>
            </div>
            <div className="metric">
              <span>Query</span>
              <strong>{wikiAnswer?.mode ?? "ready"}</strong>
            </div>
          </div>
        </header>

        <section className="project-connect-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Project Connector</div>
              <h2>{projectLoading ? "프로젝트 감지 중" : project?.name ?? projectId}</h2>
              <p className="muted">
                현재 작업 폴더를 프로젝트로 등록하고 Agent 수집/승인 흐름에 연결합니다.
              </p>
            </div>
            <span
              className={`chip ${
                project?.projectId === projectId ? "confidence-high" : "confidence-medium"
              }`}
            >
              {project?.projectId === projectId ? "connected" : "needs connect"}
            </span>
          </div>
          <div className="project-connect-grid">
            <div>
              <span className="muted">Project ID</span>
              <code>{project?.projectId ?? projectId}</code>
            </div>
            <div>
              <span className="muted">Root</span>
              <code>{project?.rootPath ?? "N/A"}</code>
            </div>
            <div>
              <span className="muted">Vault</span>
              <code>{project?.vaultPath ?? "N/A"}</code>
            </div>
            <div>
              <span className="muted">Package</span>
              <code>{project?.packageName ?? "N/A"}</code>
            </div>
          </div>
          <div className="actions">
            <button
              className="primary"
              disabled={projectConnecting}
              onClick={() => void autoConnectProject()}
              type="button"
            >
              {projectConnecting ? "연결 중" : "현재 폴더 자동 연결"}
            </button>
            {project?.projectDocumentPath ? (
              <button
                onClick={() => selectDocumentByPath(project.projectDocumentPath)}
                type="button"
              >
                프로젝트 문서 열기
              </button>
            ) : null}
          </div>
        </section>

        <section className="workflow-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Project Workflow</div>
              <h2>
                {workflowLoading
                  ? "프로세스 불러오는 중"
                  : workflow?.status === "complete"
                    ? "프로젝트 프로세스 완료"
                    : activeWorkflowStep?.title ?? "프로젝트 프로세스"}
              </h2>
              <p className="muted">
                한 프로젝트 안에서 이전 산출물이 승인되어야 다음 Agent 단계가 열립니다.
              </p>
            </div>
            <span className="metric-pill">{workflowProgress}</span>
          </div>
          {workflowLoading ? (
            <div className="empty">프로젝트 진행 순서를 불러오는 중입니다.</div>
          ) : workflow ? (
            <>
              <div className="workflow-steps" aria-label="프로젝트 순차 진행 단계">
                {workflow.steps.map((step) => (
                  <button
                    className={`workflow-step ${step.status}`}
                    disabled={step.status === "locked"}
                    key={step.id}
                    onClick={() => {
                      if (step.vaultPath) {
                        selectDocumentByPath(step.vaultPath);
                      } else if (step.requestId) {
                        setSelectedRequestId(step.requestId);
                        setMessage(`승인 큐에서 열었습니다: ${step.title}`);
                      }
                    }}
                    type="button"
                  >
                    <span>{step.order}</span>
                    <strong>{step.title}</strong>
                    <small>{workflowStatusLabel(step.status)}</small>
                  </button>
                ))}
              </div>
              {activeWorkflowStep ? (
                <div className="workflow-current">
                  <div>
                    <div className="eyebrow">Current Step</div>
                    <h3>{activeWorkflowStep.title}</h3>
                    <p className="muted">{activeWorkflowStep.goal}</p>
                  </div>
                  <div className="workflow-meta">
                    <span className="chip">{activeWorkflowStep.agentRole}</span>
                    <span className="chip mode-chip">{activeWorkflowStep.folder}</span>
                    <span
                      className={`chip ${
                        activeWorkflowStep.status === "review"
                          ? "confidence-medium"
                          : "confidence-high"
                      }`}
                    >
                      {workflowStatusLabel(activeWorkflowStep.status)}
                    </span>
                  </div>
                  <div className="workflow-columns">
                    <div>
                      <div className="eyebrow">입력 기준</div>
                      <ul className="check-list">
                        {activeWorkflowStep.requiredInputs.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="eyebrow">산출물</div>
                      <ul className="check-list">
                        {activeWorkflowStep.requiredOutputs.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="primary"
                      disabled={
                        workflowRunning ||
                        activeWorkflowStep.status !== "ready" ||
                        llmStatus?.mode !== "llm"
                      }
                      onClick={() => void runCurrentWorkflowStep()}
                      type="button"
                    >
                      {workflowRunning ? "생성 중" : "현재 단계 산출물 생성"}
                    </button>
                    {activeWorkflowStep.requestId ? (
                      <button
                        onClick={() => {
                          setSelectedRequestId(activeWorkflowStep.requestId ?? null);
                          setMessage(`승인 큐에서 열었습니다: ${activeWorkflowStep.title}`);
                        }}
                        type="button"
                      >
                        승인 큐 열기
                      </button>
                    ) : null}
                    <button onClick={() => void loadWorkflow()} type="button">
                      진행 상태 새로고침
                    </button>
                    {llmStatus?.mode !== "llm" ? (
                      <span className="muted">LLM provider가 연결되어야 산출물을 생성합니다.</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="empty">모든 단계가 승인되었습니다.</div>
              )}
            </>
          ) : (
            <div className="empty">프로젝트 진행 순서를 사용할 수 없습니다.</div>
          )}
        </section>

        <section className="source-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Source Intake</div>
              <h2>자료수집</h2>
              <p className="muted">
                원본 자료는 `00_raw_sources`에 저장하고, ingest 결과만 승인 대기
                Markdown에 반영합니다.
              </p>
            </div>
            <span className="metric-pill">
              {collectedSourceCount}/{sources.length}
            </span>
          </div>
          <div className="segmented" role="tablist" aria-label="자료 입력 방식">
            {(["text", "file", "url"] as const).map((mode) => (
              <button
                className={sourceMode === mode ? "active" : ""}
                key={mode}
                onClick={() => setSourceMode(mode)}
                role="tab"
                aria-selected={sourceMode === mode}
                type="button"
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="source-form">
            <label className="field-row">
              <span>Title</span>
              <input
                className="search"
                value={sourceTitle}
                onChange={(event) => setSourceTitle(event.target.value)}
                placeholder="자료 제목"
              />
            </label>
            {sourceMode === "text" ? (
              <label className="field-row">
                <span>Text</span>
                <textarea
                  value={sourceText}
                  onChange={(event) => setSourceText(event.target.value)}
                  placeholder="수집할 원본 텍스트"
                  rows={5}
                />
              </label>
            ) : null}
            {sourceMode === "file" ? (
              <label className="field-row">
                <span>Markdown/TXT File</span>
                <input
                  className="file-input"
                  type="file"
                  accept=".md,.markdown,.txt,text/markdown,text/plain"
                  onChange={(event) =>
                    setSourceFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            ) : null}
            {sourceMode === "url" ? (
              <label className="field-row">
                <span>URL</span>
                <input
                  className="search"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                />
              </label>
            ) : null}
            <label className="field-row">
              <span>Ingest Instruction</span>
              <input
                className="search"
                value={sourceInstruction}
                onChange={(event) => setSourceInstruction(event.target.value)}
                placeholder="현재 단계에 반영할 때 중점적으로 볼 내용"
              />
            </label>
            <div className="actions">
              <button
                disabled={sourceSubmitting}
                onClick={() => void submitSource(false)}
                type="button"
              >
                {sourceSubmitting ? "저장 중" : "자료 저장"}
              </button>
              <button
                className="primary"
                disabled={sourceSubmitting || llmStatus?.mode !== "llm"}
                onClick={() => void submitSource(true)}
                type="button"
              >
                {sourceSubmitting ? "반영 중" : "수집 후 현재 단계에 반영"}
              </button>
            </div>
          </div>
          <div className="source-list">
            {sourcesLoading ? (
              <div className="empty">수집 자료를 불러오는 중입니다.</div>
            ) : sources.length === 0 ? (
              <div className="empty">아직 수집된 raw 자료가 없습니다.</div>
            ) : (
              sources.slice(0, 6).map((source) => (
                <div className="source-row" key={source.id}>
                  <div>
                    <h3>{source.title}</h3>
                    <div className="path">{source.path}</div>
                    <p className="muted">{source.preview}</p>
                  </div>
                  <div className="source-actions">
                    <div className="chips">
                      <span className="chip">{source.sourceType}</span>
                      <span
                        className={`chip ${
                          source.ingestStatus === "ingested"
                            ? "confidence-high"
                            : "confidence-medium"
                        }`}
                      >
                        {source.ingestStatus}
                      </span>
                    </div>
                    <button
                      disabled={
                        sourceIngestingId === source.id || llmStatus?.mode !== "llm"
                      }
                      onClick={() => void ingestSource(source.id)}
                      type="button"
                    >
                      {sourceIngestingId === source.id ? "반영 중" : "현재 단계 반영"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="ops">
          <div className="tool-panel query-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Query</div>
                <h2>옵시디언 참조</h2>
              </div>
              {wikiAnswer ? <span className="chip mode-chip">{wikiAnswer.mode}</span> : null}
            </div>
            <div className="llm-status" aria-live="polite">
              <div className="llm-status-main">
                <span
                  className={`chip ${
                    llmStatus?.mode === "llm" ? "confidence-high" : "confidence-medium"
                  }`}
                >
                  {llmStatusLoading ? "checking" : llmStatus?.provider ?? "fallback"}
                </span>
                <span className="chip">{llmStatus?.model ?? "unknown"}</span>
                <span className="muted">
                  {llmStatusLoading
                    ? "LLM 상태 확인 중입니다."
                    : llmStatus?.reason ?? "LLM 상태를 확인하지 못했습니다."}
                </span>
              </div>
              <button
                className="secondary"
                disabled={llmStatusLoading}
                onClick={() => void loadLlmStatus()}
                type="button"
              >
                새로고침
              </button>
            </div>
            <textarea
              value={wikiQuestion}
              onChange={(event) => setWikiQuestion(event.target.value)}
              aria-label="옵시디언 참조 질문"
              placeholder="옵시디언 참조 질문"
              rows={3}
            />
            <div className="actions">
              <button
                className="primary"
                disabled={queryLoading || !wikiQuestion.trim()}
                onClick={() => void runWikiQuery()}
              >
                {queryLoading ? "질의 중" : "질의"}
              </button>
              <span className="muted">index.md, log.md, 관련 문서를 함께 사용합니다.</span>
            </div>
            {wikiAnswer ? (
              <div className="result">
                <div className="result-title">Answer</div>
                <pre>{wikiAnswer.answer}</pre>
                {wikiAnswer.citations.length > 0 ? (
                  <div className="citation-strip">
                    {wikiAnswer.citations.map((citation) => (
                      <button
                        className="chip chip-button"
                        key={citation.path}
                        onClick={() => selectDocumentByPath(citation.path)}
                        type="button"
                      >
                        [[{citation.title}]]
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="tool-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Lint</div>
                <h2>Vault 점검</h2>
              </div>
              <button
                className="primary"
                disabled={lintLoading}
                onClick={() => void runLint()}
              >
                {lintLoading ? "점검 중" : "점검"}
              </button>
            </div>
            <div className="lint-summary">
              <span className="lint-count error">Error {lintStats.error}</span>
              <span className="lint-count warning">Warning {lintStats.warning}</span>
              <span className="lint-count info">Info {lintStats.info}</span>
            </div>
            <div className="segmented" role="tablist" aria-label="Lint 결과 필터">
              {(["all", "error", "warning", "info"] as const).map((severity) => (
                <button
                  className={lintFilter === severity ? "active" : ""}
                  key={severity}
                  onClick={() => setLintFilter(severity)}
                  role="tab"
                  aria-selected={lintFilter === severity}
                >
                  {severity}
                </button>
              ))}
            </div>
            <div className="lint-list">
              {lintLoading ? (
                <div className="empty">Vault를 점검하는 중입니다.</div>
              ) : !lintHasRun ? (
                <div className="muted">아직 점검 결과가 없습니다.</div>
              ) : filteredLintIssues.length === 0 ? (
                <div className="empty">선택한 조건의 점검 이슈가 없습니다.</div>
              ) : (
                visibleLintIssues.map((issue, index) => (
                  <div className={`lint ${issue.severity}`} key={`${issue.code}-${index}`}>
                    <strong>{issue.severity} · {issue.code}</strong>
                    <span>{issue.message}</span>
                    {issue.path ? (
                      <button
                        className="path-button"
                        onClick={() => selectDocumentByPath(issue.path)}
                        type="button"
                      >
                        {issue.path}
                      </button>
                    ) : null}
                    {issue.link ? (
                      <button
                        className="inline-link-button"
                        onClick={() => selectDocumentByLink(issue.link ?? "")}
                        type="button"
                      >
                        [[{issue.link}]]
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            {filteredLintIssues.length > visibleLintIssues.length ? (
              <div className="muted">+{filteredLintIssues.length - visibleLintIssues.length}개 더 있음</div>
            ) : null}
          </div>
        </section>

        <section className="collection-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Collect</div>
              <h2>Agent별 수집 프로필</h2>
            </div>
            <span className="metric-pill">{collectionDocumentCount} docs</span>
          </div>
          <div className="collection-tabs" role="tablist" aria-label="Agent 수집 역할">
            {AGENT_ROLE_DEFINITIONS.map((role) => (
              <button
                className={selectedCollectionRole === role.agentRole ? "active" : ""}
                key={role.agentRole}
                onClick={() => setSelectedCollectionRole(role.agentRole)}
                role="tab"
                aria-selected={selectedCollectionRole === role.agentRole}
                type="button"
              >
                {role.agentRole}
              </button>
            ))}
          </div>
          <div className="collection-profile">
            <div>
              <h3>{selectedCollectionProfile.title}</h3>
              <p className="muted">{selectedCollectionProfile.mission}</p>
            </div>
            <div className="collection-grid">
              <div>
                <div className="eyebrow">수집 항목</div>
                <ul className="check-list">
                  {selectedCollectionProfile.collects.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="eyebrow">필수 근거</div>
                <ul className="check-list">
                  {selectedCollectionProfile.requiredEvidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="eyebrow">Confidence 규칙</div>
                <ul className="check-list">
                  {selectedCollectionProfile.confidenceRules.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="collection-meta">
              <div>
                <span className="muted">Read</span>
                <div className="chips">
                  {agentReadFolderLabels(selectedCollectionProfile).map((folder) => (
                    <span className="chip" key={folder}>
                      {folder}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="muted">Write</span>
                <div className="chips">
                  {selectedCollectionProfile.writeFolders.length > 0 ? (
                    selectedCollectionProfile.writeFolders.map((folder) => (
                      <span className="chip mode-chip" key={folder}>
                        {folder}
                      </span>
                    ))
                  ) : (
                    <span className="chip confidence-low">read-only</span>
                  )}
                </div>
              </div>
            </div>
            <div className="actions">
              <button
                className="primary"
                onClick={() => applyCollectionProfile(selectedCollectionProfile)}
                type="button"
              >
                수집 프로필 적용
              </button>
              <button
                onClick={() =>
                  void copyText(
                    buildCollectionQuestion(selectedCollectionProfile),
                    "수집 질문",
                  )
                }
                type="button"
              >
                질문 복사
              </button>
            </div>
          </div>
        </section>

        <article className="preview">
          {selected ? (
            <>
              <div className="preview-head">
                <div>
                  <div className="eyebrow">Markdown Preview</div>
                  <h2>{selected.title}</h2>
                  <div className="path">{selected.path}</div>
                </div>
                <div className="preview-actions">
                  <div className="chips">
                    <span className="chip">{selected.frontmatter.status ?? "unknown"}</span>
                    <span
                      className={`chip confidence-${(selected.frontmatter.confidence ?? "na").toLowerCase()}`}
                    >
                      {selected.frontmatter.confidence ?? "N/A"}
                    </span>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => void copyText(`/vault/${selected.path}`, "Vault 경로")}
                    type="button"
                  >
                    경로 복사
                  </button>
                </div>
              </div>
              <div className="frontmatter">
                {Object.entries(selected.frontmatter).length > 0 ? (
                  Object.entries(selected.frontmatter).map(([key, value]) => (
                    <div className="frontmatter-item" key={key}>
                      <div className="muted">{key}</div>
                      <div>{value}</div>
                    </div>
                  ))
                ) : (
                  <div className="muted">Frontmatter 없음</div>
                )}
              </div>
              <div className="markdown">
                <pre>{selected.content}</pre>
                <div className="link-panel">
                  <div>
                    <div className="eyebrow">Links</div>
                    <h2>문서 간 링크</h2>
                  </div>
                  <div className="chips">
                    {selected.links.length > 0 ? (
                      selected.links.map((link) => (
                        <button
                          className="chip chip-button"
                          key={link}
                          onClick={() => selectDocumentByLink(link)}
                          type="button"
                        >
                          [[{link}]]
                        </button>
                      ))
                    ) : (
                      <span className="muted">링크 없음</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="markdown">
              <div className="empty">왼쪽에서 Vault 문서를 선택하세요.</div>
            </div>
          )}
        </article>
      </section>

      <aside className="queue">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Review</div>
            <h2>승인 대기 Markdown</h2>
          </div>
          <span className="metric-pill">{actionableRequests.length}</span>
        </div>
        <div className="review-summary">
          <span>Pending {reviewStats.pending}</span>
          <span>Revision {reviewStats.needsRevision}</span>
          <span>HIGH {reviewStats.highConfidence}</span>
        </div>
        {message ? <p className="status-message">{message}</p> : null}
        {requestsLoading ? (
          <div className="empty">승인 대기 목록을 불러오는 중입니다.</div>
        ) : actionableRequests.length === 0 ? (
          <div className="empty">승인 대기 중인 Agent 결과가 없습니다.</div>
        ) : (
          <>
            <div className="request-selector" aria-label="승인 대기 문서 선택">
              {actionableRequests.map((request) => (
                <button
                  className={`request-tab ${
                    selectedRequest?.id === request.id ? "active" : ""
                  } confidence-${request.confidence.toLowerCase()}`}
                  key={request.id}
                  onClick={() => setSelectedRequestId(request.id)}
                  type="button"
                >
                  <span>{request.title}</span>
                  <small>
                    {request.confidence} · {request.status}
                  </small>
                </button>
              ))}
            </div>
            <section className="agent-policy-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">Agent Role</div>
                  <h3>{selectedAgentRole?.title ?? selectedRequest?.agentRole}</h3>
                </div>
                {selectedRequest ? (
                  <span
                    className={`chip ${
                      selectedRequestCanWrite ? "confidence-high" : "confidence-low"
                    }`}
                  >
                    {selectedRequestCanWrite ? "allowed" : "blocked"}
                  </span>
                ) : null}
              </div>
              {selectedAgentRole ? (
                <>
                  <p className="muted">{selectedAgentRole.mission}</p>
                  <div className="chips">
                    {selectedAgentRole.writeFolders.length > 0 ? (
                      selectedAgentRole.writeFolders.map((folder) => (
                        <span
                          className={`chip ${
                            selectedRequest?.folder === folder ? "mode-chip" : ""
                          }`}
                          key={folder}
                        >
                          {folder}
                        </span>
                      ))
                    ) : (
                      <span className="chip confidence-low">read-only</span>
                    )}
                  </div>
                  <p className="muted">{selectedAgentRole.approvalPolicy}</p>
                </>
              ) : (
                <p className="muted">
                  등록되지 않은 Agent입니다. 승인 전에 `vault/02_agents` 역할 문서를
                  먼저 추가해야 합니다.
                </p>
              )}
            </section>
            {selectedRequest ? (
            <section
              key={selectedRequest.id}
              className={`request confidence-${selectedRequest.confidence.toLowerCase()}`}
            >
              <div className="request-head">
                <div>
                  <h3>{selectedRequest.title}</h3>
                  <div className="path">
                    /vault/{selectedRequest.folder}/{selectedRequest.title}.md
                  </div>
                </div>
                <div className="chips">
                  {selectedRequestChanged ? <span className="chip dirty">edited</span> : null}
                  <span
                    className={`chip confidence-${selectedRequest.confidence.toLowerCase()}`}
                  >
                    {selectedRequest.confidence}
                  </span>
                </div>
              </div>
              <div className="chips">
                <span className="chip">{selectedRequest.agentRole}</span>
                <span className="chip">{selectedRequest.status}</span>
              </div>
              <label className="field-row">
                <span>Confidence</span>
                <select
                  value={selectedRequest.confidence}
                  onChange={(event) =>
                    void updateRequestConfidence(
                      selectedRequest.id,
                      event.target.value as Confidence,
                    )
                  }
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </label>
              <textarea
                value={selectedRequestDraft}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [selectedRequest.id]: event.target.value,
                  }))
                }
                rows={12}
              />
              <div className="actions">
                <button
                  disabled={!selectedRequestChanged}
                  onClick={() => void saveDraft(selectedRequest)}
                >
                  수정본 저장
                </button>
                <button
                  className="primary"
                  disabled={
                    selectedRequest.confidence !== "HIGH" ||
                    selectedRequest.status !== "pending" ||
                    !selectedRequestCanWrite
                  }
                  onClick={() => void approve(selectedRequest.id)}
                >
                  Vault에 승인 저장
                </button>
              </div>
              <div className="actions">
                <button
                  onClick={() =>
                    void copyText(
                      `/vault/${selectedRequest.folder}/${selectedRequest.title}.md`,
                      "저장 경로",
                    )
                  }
                >
                  경로 복사
                </button>
                <button onClick={() => void markNeedsRevision(selectedRequest.id)}>
                  수정 필요
                </button>
                <button onClick={() => void reject(selectedRequest.id)}>거절</button>
              </div>
              {selectedRequest.confidence !== "HIGH" ? (
                <div className="muted">
                  LOW/MEDIUM confidence 문서는 자동 Vault 반영 대상이 아닙니다.
                </div>
              ) : null}
              {!selectedRequestCanWrite ? (
                <div className="muted">
                  이 Agent는 현재 저장 경로에 쓸 권한이 없어 승인할 수 없습니다.
                </div>
              ) : null}
            </section>
            ) : null}
            <details className="agent-directory">
              <summary>Agent 역할 전체 보기</summary>
              <div className="agent-directory-list">
                {AGENT_ROLE_DEFINITIONS.map((role) => (
                  <div className="agent-directory-row" key={role.agentRole}>
                    <strong>{role.agentRole}</strong>
                    <span>{role.writeFolders.length > 0 ? role.writeFolders.join(", ") : "read-only"}</span>
                  </div>
                ))}
              </div>
            </details>
          </>
        )}
      </aside>
    </main>
  );
}

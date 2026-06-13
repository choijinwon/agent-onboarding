import { getDefaultLlmClient } from "@/lib/llm";
import { createWikiUpdateRequest, listWikiUpdateRequests } from "@/lib/obsidian/writer";
import { VaultDocument, VaultFolder } from "@/lib/obsidian/types";
import { listVaultDocuments } from "@/lib/obsidian/vault";
import { getProject } from "./registry";

export type ProjectWorkflowStepStatus =
  | "locked"
  | "ready"
  | "review"
  | "approved";

export type ProjectWorkflowStepDefinition = {
  id: string;
  order: number;
  title: string;
  agentRole: string;
  folder: VaultFolder;
  outputTitle: string;
  goal: string;
  requiredInputs: string[];
  requiredOutputs: string[];
};

export type ProjectWorkflowStep = ProjectWorkflowStepDefinition & {
  status: ProjectWorkflowStepStatus;
  requestId?: string;
  vaultPath?: string;
  approvedAt?: string;
};

export type ProjectWorkflow = {
  projectId: string;
  activeStepId?: string;
  status: "not_started" | "in_progress" | "complete";
  steps: ProjectWorkflowStep[];
};

export const PROJECT_WORKFLOW_STEPS = [
  {
    id: "project-brief",
    order: 1,
    title: "프로젝트 개요",
    agentRole: "ProjectAgent",
    folder: "01_projects",
    outputTitle: "프로젝트 개요",
    goal: "프로젝트 목표, 범위, 대상 사용자, 제외 범위를 확정한다.",
    requiredInputs: ["사용자 요청", "기존 프로젝트 문서", "관련 결정"],
    requiredOutputs: ["목표", "범위", "대상 사용자", "현재 상태", "제외 범위"],
  },
  {
    id: "requirements",
    order: 2,
    title: "요구사항 정의",
    agentRole: "RequirementsAgent",
    folder: "04_requirements",
    outputTitle: "요구사항 정의",
    goal: "기능 요구사항, 비기능 요구사항, 수용 기준을 정리한다.",
    requiredInputs: ["프로젝트 개요", "사용자 요청", "관련 결정"],
    requiredOutputs: ["기능 요구사항", "비기능 요구사항", "유저스토리", "수용 기준"],
  },
  {
    id: "architecture",
    order: 3,
    title: "아키텍처 설계",
    agentRole: "ArchitectAgent",
    folder: "05_architecture",
    outputTitle: "시스템 아키텍처",
    goal: "시스템 경계, Agent 흐름, BFF/API/RAG 구조를 설계한다.",
    requiredInputs: ["프로젝트 개요", "요구사항 정의", "관련 결정"],
    requiredOutputs: ["컴포넌트", "데이터 흐름", "Agent 흐름", "주요 트레이드오프"],
  },
  {
    id: "decision-record",
    order: 4,
    title: "핵심 의사결정",
    agentRole: "DecisionAgent",
    folder: "03_decisions",
    outputTitle: "핵심 의사결정 기록",
    goal: "아키텍처와 운영 방식의 주요 결정을 ADR 형태로 남긴다.",
    requiredInputs: ["요구사항 정의", "아키텍처 설계", "대안과 근거"],
    requiredOutputs: ["결정", "배경", "선택지", "트레이드오프", "결정자"],
  },
  {
    id: "design",
    order: 5,
    title: "UI/UX 설계",
    agentRole: "DesignAgent",
    folder: "06_design",
    outputTitle: "UI UX 설계",
    goal: "화면 흐름, 정보 구조, 상태/오류/빈 상태를 설계한다.",
    requiredInputs: ["요구사항 정의", "아키텍처 설계", "핵심 의사결정"],
    requiredOutputs: ["사용자 흐름", "화면 정보 구조", "상태 설계", "접근성 고려"],
  },
  {
    id: "frontend",
    order: 6,
    title: "프론트엔드 설계",
    agentRole: "FrontendAgent",
    folder: "07_frontend",
    outputTitle: "프론트엔드 구현 설계",
    goal: "화면, 컴포넌트, 상태관리, API 연동 지점을 정리한다.",
    requiredInputs: ["요구사항 정의", "UI/UX 설계", "API 계약"],
    requiredOutputs: ["화면 목록", "컴포넌트 책임", "상태관리", "라우팅", "API 연동"],
  },
  {
    id: "backend",
    order: 7,
    title: "백엔드 설계",
    agentRole: "BackendAgent",
    folder: "08_backend",
    outputTitle: "백엔드 API 설계",
    goal: "API, 서비스 책임, 권한, 오류 처리를 설계한다.",
    requiredInputs: ["요구사항 정의", "아키텍처 설계", "프론트엔드 계약"],
    requiredOutputs: ["API 엔드포인트", "서비스 책임", "권한 정책", "에러 처리"],
  },
  {
    id: "database",
    order: 8,
    title: "데이터베이스 설계",
    agentRole: "DatabaseAgent",
    folder: "09_database",
    outputTitle: "데이터베이스 설계",
    goal: "엔티티, 테이블, 관계, 인덱스와 데이터 정책을 정리한다.",
    requiredInputs: ["요구사항 정의", "백엔드 API 설계"],
    requiredOutputs: ["엔티티", "테이블", "관계", "인덱스", "마이그레이션 정책"],
  },
  {
    id: "qa",
    order: 9,
    title: "QA 검증",
    agentRole: "QAAgent",
    folder: "10_qa",
    outputTitle: "QA 테스트 계획",
    goal: "수용 기준과 주요 리스크에 맞춘 검증 계획을 정리한다.",
    requiredInputs: ["요구사항", "설계 문서", "구현 계약"],
    requiredOutputs: ["테스트 시나리오", "수용 기준 매핑", "리스크", "회귀 범위"],
  },
] as const satisfies ProjectWorkflowStepDefinition[];

const MAX_CONTEXT_DOCS = 9;
const MAX_CONTEXT_CHARS = 1800;

export async function getProjectWorkflow(projectId: string): Promise<ProjectWorkflow> {
  const requests = await listWikiUpdateRequests();
  const documents = await listVaultDocuments();

  function approvedRequestFor(stepId: string) {
    return requests.find(
      (request) =>
        request.projectId === projectId &&
        request.workflowStepId === stepId &&
        request.status === "approved",
    );
  }

  function approvedDocumentFor(definition: ProjectWorkflowStepDefinition) {
    return documents.find(
      (doc) =>
        doc.frontmatter.projectId === projectId &&
        doc.frontmatter.status === "approved" &&
        doc.path.startsWith(`${definition.folder}/`) &&
        (!doc.frontmatter.workflowStepId ||
          doc.frontmatter.workflowStepId === definition.id),
    );
  }

  function isApproved(definition: ProjectWorkflowStepDefinition) {
    return Boolean(approvedRequestFor(definition.id) || approvedDocumentFor(definition));
  }

  const steps = PROJECT_WORKFLOW_STEPS.map((definition, index) => {
    const relatedRequests = requests
      .filter(
        (request) =>
          request.projectId === projectId && request.workflowStepId === definition.id,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const approved = relatedRequests.find((request) => request.status === "approved");
    const approvedDocument = approvedDocumentFor(definition);
    const pending = relatedRequests.find(
      (request) =>
        request.status === "pending" || request.status === "needs_revision",
    );

    if (approved || approvedDocument) {
      return {
        ...definition,
        status: "approved" as const,
        requestId: approved?.id,
        vaultPath: approved?.vaultPath ?? approvedDocument?.path,
        approvedAt: approved?.approvedAt,
      };
    }

    if (pending) {
      return {
        ...definition,
        status: "review" as const,
        requestId: pending.id,
      };
    }

    const previousApproved = PROJECT_WORKFLOW_STEPS.slice(0, index).every((step) =>
      isApproved(step),
    );

    return {
      ...definition,
      status: (previousApproved ? "ready" : "locked") as ProjectWorkflowStepStatus,
    };
  });

  const activeStep = steps.find((step) => step.status !== "approved");
  return {
    projectId,
    activeStepId: activeStep?.id,
    status: activeStep ? "in_progress" : "complete",
    steps,
  };
}

export async function runCurrentWorkflowStep(projectId: string) {
  const workflow = await getProjectWorkflow(projectId);
  const step = workflow.steps.find((item) => item.id === workflow.activeStepId);

  if (!step) {
    throw new Error("Project workflow is already complete");
  }

  if (step.status === "locked") {
    throw new Error("Previous workflow steps must be approved first");
  }

  if (step.status === "review") {
    throw new Error("Current workflow step already has a pending review request");
  }

  const project = await getProject(projectId);
  const projectName = project?.name ?? projectId;
  const title = `${projectName} ${step.outputTitle}`;
  const documents = await collectWorkflowContext(projectId, step);
  const markdown = await generateStepMarkdown(projectId, projectName, step, documents);
  const confidence = hasUnverifiedContent(markdown) ? "MEDIUM" : "HIGH";
  const request = await createWikiUpdateRequest({
    projectId,
    folder: step.folder,
    title,
    markdown,
    agentRole: step.agentRole,
    confidence,
    workflowStepId: step.id,
  });

  return {
    request,
    workflow: await getProjectWorkflow(projectId),
  };
}

async function collectWorkflowContext(
  projectId: string,
  step: ProjectWorkflowStepDefinition,
) {
  const documents = await listVaultDocuments();
  const readFolders = new Set<string>([
    "index.md",
    "log.md",
    "00_raw_sources",
    "01_projects",
    ...PROJECT_WORKFLOW_STEPS.slice(0, step.order - 1).map((item) => item.folder),
  ]);

  const candidates = documents.filter((doc) => {
    if (doc.path === "index.md" || doc.path === "log.md") return true;
    const folder = doc.path.split("/")[0];
    if (!readFolders.has(folder)) return false;
    return doc.frontmatter.projectId === projectId || folder === "02_agents";
  });

  return candidates
    .sort((a, b) => {
      const projectScore = scoreContextDocument(projectId, b) - scoreContextDocument(projectId, a);
      return projectScore || a.path.localeCompare(b.path);
    })
    .slice(0, MAX_CONTEXT_DOCS);
}

function scoreContextDocument(projectId: string, doc: VaultDocument) {
  let score = 0;
  if (doc.frontmatter.projectId === projectId) score += 4;
  if (doc.path.startsWith("01_projects/")) score += 3;
  if (doc.path === "index.md" || doc.path === "log.md") score += 2;
  if (doc.frontmatter.status === "approved") score += 1;
  return score;
}

async function generateStepMarkdown(
  projectId: string,
  projectName: string,
  step: ProjectWorkflowStepDefinition,
  documents: VaultDocument[],
) {
  const fallbackMarkdown = buildManualTemplate(projectId, projectName, step, documents);
  const llm = getDefaultLlmClient();
  if (!llm) return fallbackMarkdown;

  try {
    const result = await llm.generateText({
      instructions: [
        "You are a project workflow agent for an Obsidian business wiki.",
        "Answer only with Markdown.",
        "Write in Korean.",
        "Use only the provided Vault context.",
        "Do not invent facts. If evidence is missing, write TBD or 검증 필요.",
        "Keep YAML frontmatter intact and valid.",
        "Use Obsidian links with [[문서명]] when related documents exist.",
      ].join(" "),
      input: buildGenerationPrompt(projectId, projectName, step, documents),
    });

    return normalizeGeneratedMarkdown(result.text);
  } catch {
    return fallbackMarkdown;
  }
}

function normalizeGeneratedMarkdown(markdown: string) {
  const trimmed = markdown.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function hasUnverifiedContent(markdown: string) {
  return /\bTBD\b|검증 필요|추가 .*필요|Open Questions/i.test(markdown);
}

function buildGenerationPrompt(
  projectId: string,
  projectName: string,
  step: ProjectWorkflowStepDefinition,
  documents: VaultDocument[],
) {
  const today = new Date().toISOString().slice(0, 10);
  const context = documents
    .map(
      (doc) => `# ${doc.title}
Path: ${doc.path}
Frontmatter: ${JSON.stringify(doc.frontmatter)}

${doc.content.slice(0, MAX_CONTEXT_CHARS)}`,
    )
    .join("\n\n---\n\n");

  return `Create the next approved-candidate wiki document for this project workflow step.

Project ID: ${projectId}
Project name: ${projectName}
Step: ${step.title}
Agent role: ${step.agentRole}
Target folder: ${step.folder}
Goal: ${step.goal}
Required inputs: ${step.requiredInputs.join(", ")}
Required outputs: ${step.requiredOutputs.join(", ")}

Return this Markdown structure:

---
type: wiki
projectId: ${projectId}
category: ${step.folder.replace(/^\d+_/, "")}
status: proposed
confidence: HIGH
source: project-workflow:${step.id}
updatedBy: ${step.agentRole}
updatedAt: ${today}
workflowStepId: ${step.id}
---

# ${projectName} ${step.outputTitle}

## Summary

## Context

## Decision

## Details

## Open Questions

## Related Links

Vault context:
${context}`;
}

function buildManualTemplate(
  projectId: string,
  projectName: string,
  step: ProjectWorkflowStepDefinition,
  documents: VaultDocument[],
) {
  const today = new Date().toISOString().slice(0, 10);
  const relatedLinks = documents
    .filter((doc) => doc.title)
    .slice(0, 6)
    .map((doc) => `- [[${doc.title}]]`)
    .join("\n");

  return `---
type: wiki
projectId: ${projectId}
category: ${step.folder.replace(/^\d+_/, "")}
status: proposed
confidence: HIGH
source: project-workflow:${step.id}
updatedBy: ${step.agentRole}
updatedAt: ${today}
workflowStepId: ${step.id}
---

# ${projectName} ${step.outputTitle}

## Summary

${step.goal}

## Context

- Workflow step: ${step.title}
- Agent role: ${step.agentRole}
- Required inputs: ${step.requiredInputs.join(", ")}

## Decision

검증 필요.

## Details

${step.requiredOutputs.map((item) => `### ${item}\n\n검증 필요.`).join("\n\n")}

## Open Questions

- 추가 원본 자료 또는 승인된 이전 단계 문서가 필요합니다.

## Related Links

${relatedLinks || "- 관련 문서 없음"}
`;
}

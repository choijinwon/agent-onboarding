import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getDefaultLlmClient } from "@/lib/llm";
import {
  getProjectWorkflow,
  runCurrentWorkflowStep,
} from "@/lib/projects/workflow";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter";
import {
  Confidence,
  IngestResult,
  RawSource,
  RawSourceIngestStatus,
  RawSourceType,
  StoredWikiUpdateRequest,
} from "./types";
import {
  ensureVaultStructure,
  listVaultDocuments,
  slugifyTitle,
  toVaultPath,
} from "./vault";
import {
  listWikiUpdateRequests,
  updateWikiUpdateRequest,
} from "./writer";

type CreateRawSourceInput = {
  projectId: string;
  title: string;
  sourceType: RawSourceType;
  content: string;
  sourceUrl?: string;
  uploadedBy?: string;
};

const RAW_FOLDER = "00_raw_sources";
const MAX_RAW_CHARS = 30000;
const MAX_PROMPT_CHARS = 12000;

export async function listRawSources(projectId: string): Promise<RawSource[]> {
  const documents = await listVaultDocuments();
  return documents
    .filter(
      (doc) =>
        doc.path.startsWith(`${RAW_FOLDER}/`) &&
        doc.frontmatter.type === "raw-source" &&
        doc.frontmatter.projectId === projectId,
    )
    .map((doc) => rawSourceFromMarkdown(doc.path, doc.content))
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
}

export async function createRawSource(
  input: CreateRawSourceInput,
): Promise<RawSource> {
  const now = new Date().toISOString();
  const limitedContent = input.content.trim().slice(0, MAX_RAW_CHARS);
  if (!limitedContent) {
    throw new Error("Raw source content is required");
  }

  const hash = createHash("sha256").update(limitedContent).digest("hex");
  const safeTitle = input.title.trim() || `${input.sourceType} source`;
  const sourceId = `${slugifyTitle(safeTitle).toLowerCase()}-${hash.slice(0, 8)}`;
  const relativePath = path.join(RAW_FOLDER, `${sourceId}.md`);
  const frontmatter: Record<string, string> = {
    type: "raw-source",
    rawSourceId: sourceId,
    projectId: input.projectId,
    sourceType: input.sourceType,
    sourceUrl: input.sourceUrl ?? "",
    uploadedBy: input.uploadedBy ?? "user",
    collectedAt: now,
    hash,
    ingestStatus: "collected",
    updatedBy: "SourceIntake",
    updatedAt: now.slice(0, 10),
  };
  const body = `# ${safeTitle}

## Summary

원본 자료입니다. Agent는 이 문서를 읽기만 하고, Wiki 반영은 ingest 결과와 승인 큐를 통해 진행합니다.

## Source Metadata

- Source type: ${input.sourceType}
- Source URL: ${input.sourceUrl ?? "N/A"}
- Hash: ${hash}

## Raw Content

${limitedContent}
`;

  const markdown = serializeFrontmatter(frontmatter, body);
  await ensureVaultStructure();
  await fs.writeFile(toVaultPath(relativePath), markdown, "utf8");
  return rawSourceFromMarkdown(relativePath, markdown);
}

export async function getRawSource(
  projectId: string,
  sourceId: string,
): Promise<RawSource> {
  const sources = await listRawSources(projectId);
  const source = sources.find((item) => item.id === sourceId);
  if (!source) throw new Error("Raw source not found");
  return source;
}

export async function ingestRawSourceToWorkflow(
  projectId: string,
  sourceId: string,
  instruction?: string,
): Promise<IngestResult> {
  const source = await getRawSource(projectId, sourceId);
  try {
    const workflow = await getProjectWorkflow(projectId);
    const activeStep = workflow.steps.find(
      (step) => step.id === workflow.activeStepId,
    );
    if (!activeStep) throw new Error("Project workflow is already complete");
    if (activeStep.status === "locked") {
      throw new Error("Previous workflow steps must be approved first");
    }

    const targetRequest =
      activeStep.status === "review"
        ? await getPendingWorkflowRequest(projectId, activeStep.id)
        : (await runCurrentWorkflowStep(projectId)).request;

    const summary = await summarizeRawSource(source, activeStep.id, instruction);
    const updatedMarkdown = await mergeSourceIntoDraft({
      source,
      summaryMarkdown: summary.markdown,
      draft: targetRequest.markdown,
      workflowStepTitle: activeStep.title,
      workflowStepId: activeStep.id,
      instruction,
    });
    const confidence: Confidence = "MEDIUM";
    const updatedRequest = await updateWikiUpdateRequest(targetRequest.id, {
      markdown: updatedMarkdown,
      confidence: confidence satisfies Confidence,
      status: "pending",
    });

    await updateRawSourceStatus(source, "ingested");

    return {
      source: await getRawSource(projectId, sourceId),
      summaryMarkdown: summary.markdown,
      relatedWorkflowStepId: activeStep.id,
      targetRequestId: updatedRequest.id,
      updatedRequest,
      mode: summary.mode,
    };
  } catch (error) {
    await updateRawSourceStatus(source, "failed");
    throw error;
  }
}

async function getPendingWorkflowRequest(projectId: string, workflowStepId: string) {
  const requests = await listWikiUpdateRequests();
  const request = requests.find(
    (item) =>
      item.projectId === projectId &&
      item.workflowStepId === workflowStepId &&
      (item.status === "pending" || item.status === "needs_revision"),
  );
  if (!request) throw new Error("Current workflow step has no pending request");
  return request;
}

async function summarizeRawSource(
  source: RawSource,
  workflowStepId: string,
  instruction?: string,
) {
  const fallback = buildFallbackSummary(source, workflowStepId);
  const llm = getDefaultLlmClient();
  if (!llm) return { markdown: fallback, mode: "fallback" as const };

  try {
    const result = await llm.generateText({
      instructions: [
        "You summarize raw source material for an Obsidian business wiki.",
        "Write in Korean.",
        "Use only the raw source content.",
        "Return Markdown only.",
        "Separate facts from open questions.",
      ].join(" "),
      input: `Workflow step: ${workflowStepId}
Instruction: ${instruction ?? "N/A"}
Source title: ${source.title}
Source type: ${source.sourceType}
Source URL: ${source.sourceUrl ?? "N/A"}

Return this structure:

## Summary

## Key Facts

## Requirements Candidates

## Open Questions

## Related Workflow Step

Raw source:
${source.content.slice(0, MAX_PROMPT_CHARS)}`,
    });
    return {
      markdown: normalizeGeneratedMarkdown(result.text),
      mode: "llm" as const,
    };
  } catch {
    return { markdown: fallback, mode: "fallback" as const };
  }
}

async function mergeSourceIntoDraft(input: {
  source: RawSource;
  summaryMarkdown: string;
  draft: string;
  workflowStepTitle: string;
  workflowStepId: string;
  instruction?: string;
}) {
  return appendSourceSummary(input);
}

async function updateRawSourceStatus(
  source: RawSource,
  ingestStatus: RawSourceIngestStatus,
) {
  const fullPath = toVaultPath(source.path);
  const markdown = await fs.readFile(fullPath, "utf8");
  const parsed = parseFrontmatter(markdown);
  const next = serializeFrontmatter(
    {
      ...parsed.frontmatter,
      ingestStatus,
      updatedAt: new Date().toISOString().slice(0, 10),
    },
    parsed.body,
  );
  await fs.writeFile(fullPath, next, "utf8");
}

function rawSourceFromMarkdown(relativePath: string, markdown: string): RawSource {
  const parsed = parseFrontmatter(markdown);
  const title =
    parsed.body.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
    parsed.frontmatter.rawSourceId ??
    path.basename(relativePath, ".md");
  const content = extractRawContent(parsed.body);
  return {
    id: parsed.frontmatter.rawSourceId ?? path.basename(relativePath, ".md"),
    projectId: parsed.frontmatter.projectId ?? "",
    path: relativePath,
    title,
    sourceType: (parsed.frontmatter.sourceType as RawSourceType) ?? "text",
    sourceUrl: parsed.frontmatter.sourceUrl || undefined,
    uploadedBy: parsed.frontmatter.uploadedBy ?? "user",
    collectedAt: parsed.frontmatter.collectedAt ?? "",
    hash: parsed.frontmatter.hash ?? "",
    ingestStatus:
      (parsed.frontmatter.ingestStatus as RawSourceIngestStatus) ?? "collected",
    content,
    preview: content.replace(/\s+/g, " ").trim().slice(0, 220),
  };
}

function extractRawContent(body: string) {
  const match = body.match(/## Raw Content\s*\n([\s\S]*)$/);
  return (match?.[1] ?? body).trim();
}

function buildFallbackSummary(source: RawSource, workflowStepId: string) {
  return `## Summary

${source.preview || "요약할 원본 내용이 없습니다."}

## Key Facts

- 원본 자료 제목: ${source.title}
- 원본 자료 경로: ${source.path}
- 원본 자료 유형: ${source.sourceType}

## Requirements Candidates

- 검증 필요.

## Open Questions

- 원본 자료를 기반으로 현재 workflow 단계에 반영할 항목을 확인해야 합니다.

## Related Workflow Step

${workflowStepId}
`;
}

function appendSourceSummary(input: {
  source: RawSource;
  summaryMarkdown: string;
  draft: string;
  workflowStepId: string;
}) {
  const summary = demoteMarkdownHeadings(input.summaryMarkdown);
  const addition = `\n\n## Raw Source Ingest\n\n### ${input.source.title}\n\n- Source: [[${input.source.title}]]\n- Source path: \`${input.source.path}\`\n- Workflow step: ${input.workflowStepId}\n\n${summary}\n`;
  return input.draft.includes("## Raw Source Ingest")
    ? `${input.draft.trim()}\n${addition}`
    : `${input.draft.trim()}${addition}`;
}

function demoteMarkdownHeadings(markdown: string) {
  return markdown.replace(/^(#{1,5})\s+/gm, (_match, hashes: string) => {
    return `${hashes}# `;
  });
}

function normalizeGeneratedMarkdown(markdown: string) {
  const trimmed = markdown.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

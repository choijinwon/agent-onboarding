import path from "path";
import { LintIssue } from "./types";
import { listVaultDocuments } from "./vault";

const REQUIRED_WIKI_FIELDS = [
  "type",
  "projectId",
  "category",
  "status",
  "confidence",
  "updatedBy",
  "updatedAt",
];

const REQUIRED_LOG_FIELDS = [
  "type",
  "projectId",
  "status",
  "confidence",
  "updatedBy",
  "updatedAt",
];

export async function lintVault(projectId: string): Promise<LintIssue[]> {
  const documents = await listVaultDocuments();
  const issues: LintIssue[] = [];
  const titles = new Set<string>();
  const inboundLinks = new Map<string, number>();

  for (const doc of documents) {
    titles.add(doc.title);
    titles.add(path.basename(doc.path, ".md"));
    inboundLinks.set(doc.title, 0);
  }

  for (const doc of documents) {
    const type = doc.frontmatter.type;
    const requiredFields = type === "agent-log" ? REQUIRED_LOG_FIELDS : REQUIRED_WIKI_FIELDS;

    if (Object.keys(doc.frontmatter).length === 0) {
      issues.push({
        severity: "error",
        code: "missing_frontmatter",
        message: "YAML Frontmatter가 없습니다.",
        path: doc.path,
      });
    }

    for (const field of requiredFields) {
      if (!doc.frontmatter[field]) {
        issues.push({
          severity: "error",
          code: "missing_frontmatter_field",
          message: `필수 frontmatter 필드가 없습니다: ${field}`,
          path: doc.path,
        });
      }
    }

    if (type === "wiki" && !doc.frontmatter.source) {
      issues.push({
        severity: "warning",
        code: "missing_source",
        message: "검증 추적을 위한 source 필드가 없습니다.",
        path: doc.path,
      });
    }

    if (
      doc.frontmatter.status === "approved" &&
      ["LOW", "MEDIUM"].includes(doc.frontmatter.confidence)
    ) {
      issues.push({
        severity: "error",
        code: "low_confidence_approved",
        message: "LOW/MEDIUM confidence 문서가 approved 상태입니다.",
        path: doc.path,
      });
    }

    if (doc.path.startsWith("00_raw_sources/")) {
      issues.push({
        severity: "warning",
        code: "raw_markdown_candidate",
        message:
          "raw 폴더의 Markdown은 원본 자료로만 사용하고 Wiki 승인 문서로 쓰지 않아야 합니다.",
        path: doc.path,
      });
    }

    for (const link of doc.links) {
      inboundLinks.set(link, (inboundLinks.get(link) ?? 0) + 1);
      if (!titles.has(link)) {
        issues.push({
          severity: "error",
          code: "broken_link",
          message: `대상 문서를 찾을 수 없는 Obsidian 링크입니다: [[${link}]]`,
          path: doc.path,
          link,
        });
      }
    }
  }

  for (const doc of documents) {
    if (doc.path === "index.md" || doc.path === "log.md") continue;
    if (doc.path.startsWith("99_logs/")) continue;
    if (doc.frontmatter.projectId && doc.frontmatter.projectId !== projectId) continue;

    if ((inboundLinks.get(doc.title) ?? 0) === 0) {
      issues.push({
        severity: "info",
        code: "orphan_document",
        message: "다른 문서에서 링크되지 않은 고립 문서입니다.",
        path: doc.path,
      });
    }
  }

  return issues.sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      (a.path ?? "").localeCompare(b.path ?? "") ||
      a.code.localeCompare(b.code),
  );
}

function severityRank(severity: LintIssue["severity"]) {
  if (severity === "error") return 0;
  if (severity === "warning") return 1;
  return 2;
}

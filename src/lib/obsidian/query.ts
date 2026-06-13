import { getDefaultLlmClient } from "@/lib/llm";
import {
  VaultDocument,
  WikiQueryRequest,
  WikiQueryResponse,
} from "./types";
import { readVaultDocument } from "./vault";
import { searchVaultDocuments } from "./search";

const DEFAULT_MAX_DOCUMENTS = 6;
const MAX_CONTENT_CHARS = 2200;

export async function queryVault(
  projectId: string,
  request: WikiQueryRequest,
): Promise<WikiQueryResponse> {
  const query = request.query.trim();
  const maxDocuments = Math.max(
    1,
    Math.min(request.maxDocuments ?? DEFAULT_MAX_DOCUMENTS, 12),
  );
  const includeLogs = request.includeLogs ?? true;

  const searched = query
    ? await searchVaultDocuments(query, projectId)
    : await searchVaultDocuments("", projectId);

  const priorityDocs = await readPriorityDocuments(includeLogs);
  const usedDocuments = uniqueDocuments([
    ...priorityDocs,
    ...searched.slice(0, maxDocuments),
  ]).slice(0, maxDocuments + priorityDocs.length);

  const citations = usedDocuments.map((doc) => ({
    title: doc.title,
    path: doc.path,
  }));

  const fallback = buildFallbackResponse(query, usedDocuments);
  const llm = getDefaultLlmClient();
  if (!llm) {
    return {
      answer: fallback,
      citations,
      usedDocuments,
      mode: "fallback",
    };
  }

  try {
    const result = await llm.generateText({
      instructions:
        "You answer in Korean. Use only the provided Obsidian Vault context. Cite document titles inline when useful. If evidence is missing, say so clearly.",
      input: buildLlmPrompt(query, usedDocuments),
    });

    return {
      answer: result.text,
      citations,
      usedDocuments,
      mode: "llm",
    };
  } catch (error) {
    return {
      answer: `${fallback}\n\nLLM 호출에 실패해 fallback mode로 응답했습니다: ${
        (error as Error).message
      }`,
      citations,
      usedDocuments,
      mode: "fallback",
    };
  }
}

async function readPriorityDocuments(includeLogs: boolean) {
  const paths = includeLogs ? ["index.md", "log.md"] : ["index.md"];
  const documents: VaultDocument[] = [];

  for (const documentPath of paths) {
    try {
      documents.push(await readVaultDocument(documentPath));
    } catch {
      // Priority documents are helpful but not mandatory for query fallback.
    }
  }

  return documents;
}

function uniqueDocuments(documents: VaultDocument[]) {
  const seen = new Set<string>();
  const unique: VaultDocument[] = [];
  for (const doc of documents) {
    if (seen.has(doc.path)) continue;
    seen.add(doc.path);
    unique.push(doc);
  }
  return unique;
}

function buildFallbackResponse(query: string, documents: VaultDocument[]) {
  const lines = documents.map((doc) => {
    const summary = extractSection(doc.content, "Summary") ?? doc.content;
    return `- [[${doc.title}]] (${doc.path}): ${summary
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180)}`;
  });

  return [
    "LLM 설정이 없어서 관련 Vault 문서 기반 fallback 결과를 반환합니다.",
    query ? `질문: ${query}` : "질문이 비어 있어 Vault 지도 중심으로 반환합니다.",
    "",
    "참조 후보:",
    ...lines,
  ].join("\n");
}

function buildLlmPrompt(query: string, documents: VaultDocument[]) {
  const context = documents
    .map(
      (doc) => `# ${doc.title}
Path: ${doc.path}
Frontmatter: ${JSON.stringify(doc.frontmatter)}

${doc.content.slice(0, MAX_CONTENT_CHARS)}`,
    )
    .join("\n\n---\n\n");

  return `User query:
${query}

Obsidian Vault context:
${context}`;
}

function extractSection(markdown: string, heading: string) {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(\\n## |$)`);
  const match = markdown.match(pattern);
  return match?.[1]?.trim();
}

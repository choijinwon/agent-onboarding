import { listVaultDocuments } from "./vault";

export async function searchVaultDocuments(query: string, projectId?: string) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const documents = await listVaultDocuments();
  return documents
    .filter((doc) => !projectId || doc.frontmatter.projectId === projectId)
    .map((doc) => {
      const haystack = `${doc.title}\n${doc.path}\n${doc.content}`.toLowerCase();
      const score = terms.reduce(
        (sum, term) => sum + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { ...doc, score };
    })
    .filter((doc) => terms.length === 0 || doc.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}

export type ParsedMarkdown = {
  frontmatter: Record<string, string>;
  body: string;
};

export function parseFrontmatter(markdown: string): ParsedMarkdown {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: {}, body: normalized };
  }

  const end = normalized.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: {}, body: normalized };
  }

  const raw = normalized.slice(4, end).trim();
  const body = normalized.slice(end + 4).replace(/^\n/, "");
  const frontmatter: Record<string, string> = {};

  for (const line of raw.split("\n")) {
    const index = line.indexOf(":");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

export function serializeFrontmatter(
  frontmatter: Record<string, string>,
  body: string,
): string {
  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `---\n${yaml}\n---\n\n${body.trim()}\n`;
}

export function ensureWikiFrontmatter(
  markdown: string,
  defaults: Record<string, string>,
): string {
  const parsed = parseFrontmatter(markdown);
  const frontmatter = { ...parsed.frontmatter, ...defaults };
  return serializeFrontmatter(frontmatter, parsed.body);
}

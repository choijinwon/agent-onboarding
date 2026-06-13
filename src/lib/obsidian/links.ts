const OBSIDIAN_LINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

export function extractObsidianLinks(markdown: string): string[] {
  const searchable = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]+`/g, "");
  const links = new Set<string>();
  for (const match of searchable.matchAll(OBSIDIAN_LINK_RE)) {
    const title = match[1]?.trim();
    if (title) links.add(title);
  }
  return [...links];
}

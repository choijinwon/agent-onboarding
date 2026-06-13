import { promises as fs } from "fs";
import path from "path";
import { parseFrontmatter } from "./frontmatter";
import { extractObsidianLinks } from "./links";
import { VAULT_FOLDERS, VaultDocument, VaultFolder } from "./types";

const WORKSPACE_ROOT = process.cwd();

export function getVaultRoot(): string {
  return process.env.OBSIDIAN_VAULT_PATH
    ? path.resolve(process.env.OBSIDIAN_VAULT_PATH)
    : path.join(WORKSPACE_ROOT, "vault");
}

export function assertVaultFolder(folder: string): asserts folder is VaultFolder {
  if (!VAULT_FOLDERS.includes(folder as VaultFolder)) {
    throw new Error(`Invalid vault folder: ${folder}`);
  }
}

export function toVaultPath(relativePath: string): string {
  const vaultRoot = getVaultRoot();
  const fullPath = path.resolve(vaultRoot, relativePath);
  if (fullPath !== vaultRoot && !fullPath.startsWith(`${vaultRoot}${path.sep}`)) {
    throw new Error("Path escapes the configured Obsidian vault");
  }
  return fullPath;
}

export async function ensureVaultStructure(): Promise<void> {
  await Promise.all(
    VAULT_FOLDERS.map((folder) =>
      fs.mkdir(path.join(getVaultRoot(), folder), { recursive: true }),
    ),
  );
}

export async function readVaultDocument(relativePath: string): Promise<VaultDocument> {
  const fullPath = toVaultPath(relativePath);
  const markdown = await fs.readFile(fullPath, "utf8");
  const parsed = parseFrontmatter(markdown);
  const title =
    parsed.body.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
    path.basename(relativePath, ".md");

  return {
    path: relativePath,
    title,
    content: markdown,
    frontmatter: parsed.frontmatter,
    links: extractObsidianLinks(markdown),
  };
}

export async function listVaultDocuments(): Promise<VaultDocument[]> {
  await ensureVaultStructure();
  const documents: VaultDocument[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const relativePath = path.relative(getVaultRoot(), fullPath);
        documents.push(await readVaultDocument(relativePath));
      }
    }
  }

  await walk(getVaultRoot());
  return documents.sort((a, b) => a.path.localeCompare(b.path));
}

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

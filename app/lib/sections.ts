import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type Component = {
  id: string;
  type: string;
  label: string;
  sourceUrl: string;
  html: string;
  createdAt: string;
};

/** Everything but the HTML — what list views need. */
export type ComponentMeta = Omit<Component, "html">;

export type ParsedSection = { type: string; label: string; html: string };

const COMPONENTS_DIR = path.join(process.cwd(), "data", "components");
// Sections saved before the move to data/ (and any committed there) live next to
// the UI code. They're read, listed and deletable, but new ones go to COMPONENTS_DIR.
const LEGACY_COMPONENTS_DIR = path.join(process.cwd(), "components");
const READ_DIRS = [COMPONENTS_DIR, LEGACY_COMPONENTS_DIR];

const SECTION_RE =
  /<!--\s*SECTION\s+type="([^"]*)"\s+label="([^"]*)"\s*-->([\s\S]*?)<!--\s*\/SECTION\s*-->/gi;

/** Split Claude's output into labeled section blocks. */
export function parseSections(raw: string): ParsedSection[] {
  const out: ParsedSection[] = [];
  let m: RegExpExecArray | null;
  SECTION_RE.lastIndex = 0;
  while ((m = SECTION_RE.exec(raw)) !== null) {
    const html = m[3].trim();
    if (html) out.push({ type: m[1].trim() || "section", label: m[2].trim() || "Section", html });
  }
  return out;
}

/** Concatenated section HTML, for assembling a full page body. */
export function joinSections(sections: { html: string }[]): string {
  return sections.map((s) => s.html).join("\n");
}

export async function saveComponents(sections: ParsedSection[], sourceUrl: string): Promise<Component[]> {
  await mkdir(COMPONENTS_DIR, { recursive: true });
  const now = new Date().toISOString();
  const comps = sections.map((s): Component => ({ id: randomUUID().slice(0, 8), ...s, sourceUrl, createdAt: now }));
  await Promise.all(
    comps.map((c) => writeFile(path.join(COMPONENTS_DIR, `${c.id}.json`), JSON.stringify(c), "utf8")),
  );
  return comps;
}

export function safeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

export async function getComponent(id: string): Promise<Component | null> {
  if (!safeId(id)) return null;
  for (const dir of READ_DIRS) {
    try {
      return JSON.parse(await readFile(path.join(dir, `${id}.json`), "utf8")) as Component;
    } catch {
      // not in this dir — try the next
    }
  }
  return null;
}

/** Components in the picked order (skips missing ids). */
export async function getComponents(ids: string[]): Promise<Component[]> {
  const found = await Promise.all(ids.map(getComponent));
  return found.filter((c): c is Component => c !== null);
}

/** All saved components, newest first. */
export async function listComponents(): Promise<Component[]> {
  const listings = await Promise.all(READ_DIRS.map((dir) => readdir(dir).catch(() => [] as string[])));
  const ids = new Set(listings.flat().filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
  const comps = await Promise.all([...ids].map(getComponent));
  return comps
    .filter((c): c is Component => c !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function toMeta({ html: _html, ...meta }: Component): ComponentMeta {
  return meta;
}

export async function deleteComponent(id: string): Promise<boolean> {
  if (!safeId(id)) return false;
  for (const dir of READ_DIRS) {
    try {
      await rm(path.join(dir, `${id}.json`));
      return true;
    } catch {
      // not in this dir — try the next
    }
  }
  return false;
}

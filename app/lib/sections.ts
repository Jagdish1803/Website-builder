import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type Component = {
  id: string;
  type: string;
  label: string;
  sourceUrl: string;
  html: string;
  createdAt: string;
};

const COMPONENTS_DIR = path.join(process.cwd(), "components");

const SECTION_RE =
  /<!--\s*SECTION\s+type="([^"]*)"\s+label="([^"]*)"\s*-->([\s\S]*?)<!--\s*\/SECTION\s*-->/gi;

/** Split Claude's output into labeled section blocks. */
export function parseSections(raw: string): { type: string; label: string; html: string }[] {
  const out: { type: string; label: string; html: string }[] = [];
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

export async function saveComponents(
  sections: { type: string; label: string; html: string }[],
  sourceUrl: string,
): Promise<number> {
  await mkdir(COMPONENTS_DIR, { recursive: true });
  const now = new Date().toISOString();
  await Promise.all(
    sections.map((s) => {
      const comp: Component = { id: randomUUID().slice(0, 8), ...s, sourceUrl, createdAt: now };
      return writeFile(path.join(COMPONENTS_DIR, `${comp.id}.json`), JSON.stringify(comp), "utf8");
    }),
  );
  return sections.length;
}

function safeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

export async function getComponent(id: string): Promise<Component | null> {
  if (!safeId(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(COMPONENTS_DIR, `${id}.json`), "utf8")) as Component;
  } catch {
    return null;
  }
}

/** Components in the picked order (skips missing ids). */
export async function getComponents(ids: string[]): Promise<Component[]> {
  const found = await Promise.all(ids.map(getComponent));
  return found.filter((c): c is Component => c !== null);
}

/** All saved components, newest first. */
export async function listComponents(): Promise<Component[]> {
  try {
    const files = await readdir(COMPONENTS_DIR);
    const comps = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => getComponent(f.replace(/\.json$/, ""))),
    );
    return comps
      .filter((c): c is Component => c !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

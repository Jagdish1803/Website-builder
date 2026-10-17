import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pageSkeleton } from "./design-system";
import { getComponents, joinSections, safeId } from "./sections";

// A site is just an ordered list of saved section ids plus metadata. The HTML is
// assembled from the sections on every request, so edits to the library (or the
// design system) show up everywhere and nothing is duplicated on disk.
export type Site = {
  id: string;
  title: string;
  kind: "rebuild" | "compose";
  sourceUrl: string | null;
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
};

const SITES_DIR = path.join(process.cwd(), "data", "sites");
// Pages built before sites became records were stored as raw HTML here.
const LEGACY_SITES_DIR = path.join(process.cwd(), "sites");

async function writeSite(site: Site): Promise<void> {
  await mkdir(SITES_DIR, { recursive: true });
  await writeFile(path.join(SITES_DIR, `${site.id}.json`), JSON.stringify(site), "utf8");
}

export async function createSite(input: Pick<Site, "title" | "kind" | "sourceUrl" | "componentIds">): Promise<Site> {
  const now = new Date().toISOString();
  const site: Site = { id: randomUUID().slice(0, 8), ...input, createdAt: now, updatedAt: now };
  await writeSite(site);
  return site;
}

export async function getSite(id: string): Promise<Site | null> {
  if (!safeId(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(SITES_DIR, `${id}.json`), "utf8")) as Site;
  } catch {
    return null;
  }
}

export async function updateSite(
  id: string,
  patch: Partial<Pick<Site, "title" | "componentIds">>,
): Promise<Site | null> {
  const site = await getSite(id);
  if (!site) return null;
  const next: Site = { ...site, ...patch, updatedAt: new Date().toISOString() };
  await writeSite(next);
  return next;
}

export async function deleteSite(id: string): Promise<boolean> {
  if (!safeId(id)) return false;
  try {
    await rm(path.join(SITES_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

/** All sites, newest first. */
export async function listSites(): Promise<Site[]> {
  try {
    const files = await readdir(SITES_DIR);
    const sites = await Promise.all(
      files.filter((f) => f.endsWith(".json")).map((f) => getSite(f.replace(/\.json$/, ""))),
    );
    return sites
      .filter((s): s is Site => s !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

/** Full HTML for a page made of these section ids, in order. */
export async function renderSections(ids: string[], title: string): Promise<string> {
  const sections = await getComponents(ids);
  return pageSkeleton(joinSections(sections), title);
}

/** Full HTML for a site, or null if it doesn't exist. */
export async function renderSite(id: string): Promise<string | null> {
  const site = await getSite(id);
  if (site) return renderSections(site.componentIds, site.title);
  if (!safeId(id)) return null;
  try {
    return await readFile(path.join(LEGACY_SITES_DIR, `${id}.html`), "utf8");
  } catch {
    return null;
  }
}

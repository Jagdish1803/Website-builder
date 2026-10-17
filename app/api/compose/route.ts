import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pageSkeleton } from "../../lib/design-system";
import { getComponents } from "../../lib/sections";

export const runtime = "nodejs";

const SITES_DIR = path.join(process.cwd(), "sites");

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { ids?: unknown; title?: unknown };
    if (!Array.isArray(body.ids) || body.ids.some((x) => typeof x !== "string")) {
      return Response.json({ error: "ids must be an array of strings" }, { status: 400 });
    }
    const sections = await getComponents(body.ids as string[]);
    if (sections.length === 0) {
      return Response.json({ error: "No valid sections selected" }, { status: 400 });
    }

    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Composed page";
    const full = pageSkeleton(sections.map((s) => s.html).join("\n"), title);

    const id = randomUUID().slice(0, 8);
    await mkdir(SITES_DIR, { recursive: true });
    await writeFile(path.join(SITES_DIR, `${id}.html`), full, "utf8");

    return Response.json({ id, url: `/s/${id}`, sections: sections.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

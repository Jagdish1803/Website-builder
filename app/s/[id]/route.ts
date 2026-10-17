import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const SITES_DIR = path.join(process.cwd(), "sites");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const html = await readFile(path.join(SITES_DIR, `${id}.html`), "utf8");
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

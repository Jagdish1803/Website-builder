import { renderSite } from "../../lib/sites";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const html = await renderSite(id);
  if (html === null) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = { "content-type": "text/html; charset=utf-8" };
  if (new URL(req.url).searchParams.has("download")) {
    headers["content-disposition"] = `attachment; filename="site-${id}.html"`;
  }
  return new Response(html, { headers });
}

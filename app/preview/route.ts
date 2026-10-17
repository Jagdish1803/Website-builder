import { renderSections } from "../lib/sites";

export const runtime = "nodejs";

/** Live preview of an unsaved composition: /preview?ids=a,b,c */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const ids = (params.get("ids") || "").split(",").filter(Boolean);
  return new Response(await renderSections(ids, params.get("title") || "Preview"), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

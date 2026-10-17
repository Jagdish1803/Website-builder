import { pageSkeleton } from "../../lib/design-system";
import { getComponent } from "../../lib/sections";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comp = await getComponent(id);
  if (!comp) return new Response("Not found", { status: 404 });
  return new Response(pageSkeleton(comp.html, comp.label), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

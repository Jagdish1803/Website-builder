import { listComponents, toMeta } from "../../lib/sections";

export const runtime = "nodejs";

export async function GET() {
  const comps = await listComponents();
  return Response.json({ components: comps.map(toMeta) });
}

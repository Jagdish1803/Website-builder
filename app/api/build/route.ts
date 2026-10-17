import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pageSkeleton } from "../../lib/design-system";
import { joinSections, parseSections, saveComponents } from "../../lib/sections";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-opus-5-5";
const SITES_DIR = path.join(process.cwd(), "sites");

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const u = new URL(withProto); // throws on garbage
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) URLs");
  if (!u.hostname.includes(".")) throw new Error("Invalid hostname");
  return u.href;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; SiteRebuilder/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("html")) throw new Error(`Not an HTML page (${ct || "unknown type"})`);
  return res.text();
}

function extract(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  $("script,style,noscript,svg,template,iframe").remove();

  const title = ($("title").first().text() || $("h1").first().text()).trim();
  const description = ($('meta[name="description"]').attr("content") || "").trim();

  const parts: string[] = [];
  $("h1,h2,h3,h4,h5,p,li,a,button,blockquote,figcaption,label").each((_, el) => {
    const tag = String($(el).prop("tagName") || "").toLowerCase();
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (tag && text && text.length <= 2000) parts.push(`[${tag}] ${text}`);
  });

  const seen = new Set<string>();
  const images: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    let abs: string;
    try {
      abs = new URL(src, baseUrl).href;
    } catch {
      return;
    }
    if (seen.has(abs)) return;
    seen.add(abs);
    const alt = ($(el).attr("alt") || "").trim();
    images.push(alt ? `${abs} (alt: ${alt})` : abs);
  });

  return {
    title,
    description,
    content: parts.join("\n").slice(0, 40000),
    images: images.slice(0, 40),
  };
}

const SYSTEM = `You are a senior UI/UX and motion designer and front-end engineer. You rebuild a website as a set of modern, reusable page SECTIONS — with tasteful, production-grade motion — that get assembled into one page. A shared design system (CSS variables + helper + MOTION classes) is ALREADY loaded on the page — you only output section bodies that use it.

OUTPUT FORMAT — output ONLY a sequence of section blocks, nothing else (no markdown, no code fences, no <html>/<head>/<body>, no commentary). Each section looks exactly like:

<!--SECTION type="hero" label="Short human label"-->
<section class="cmp cmp-hero section">
  <div class="container"> ...content... </div>
  <style>/* optional extra CSS; EVERY selector scoped under .cmp-hero */</style>
</section>
<!--/SECTION-->

- "type" is a lowercase slug: hero, services, pricing, works, about, testimonials, stats, faq, cta, contact, footer, etc.
- "label" is a short human description. Emit one block per logical section, in order.

USE THE DESIGN SYSTEM (never redefine it):
- Colors: var(--bg), var(--surface), var(--border), var(--fg), var(--muted), var(--accent), var(--accent-contrast)
- Shape/size: var(--radius), var(--radius-sm), var(--container)
- Classes: .container (wrap each section's content in one), .section (padding — already on the <section>), .eyebrow, .h1 .h2 .h3 .lead .muted, .btn and .btn.accent, .card, .tag, .grid-2 .grid-3
- Extra CSS allowed only inside the section's <style>, every selector scoped under .cmp-<type> so sections never clash.

RENDERING (critical — never ship hidden content):
- Fully static. No <script>, no JavaScript, no CSS frameworks.
- The page must be completely visible with JavaScript disabled. NEVER use opacity:0, visibility:hidden, display:none, or off-screen transforms as a default state. No scroll-reveal patterns. Any animation must be pure CSS that auto-plays to a fully visible end state.

CONTENT:
- Reuse the original image URLs provided; do not invent image paths (use CSS/gradients/inline SVG for decoration).
- Keep all real content: headings, copy, links, prices, contact info. Improve hierarchy, spacing, typography and layout. Elevate the UI — do not merely copy the original.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.trim()) {
      return Response.json({ error: "Missing url" }, { status: 400 });
    }

    const target = normalizeUrl(body.url);
    const html = await fetchHtml(target);
    const site = extract(html, target);

    const client = new Anthropic({
      defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
        ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
        : undefined,
    });

    const userContent = `Rebuild this website as reusable sections.

URL: ${target}
Title: ${site.title}
Description: ${site.description}

Content (tagged by source element):
${site.content}

Original image URLs (reuse these where they fit):
${site.images.join("\n") || "(none found)"}`;

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userContent, cache_control: { type: "ephemeral" } }],
        },
      ],
    });
    const msg = await stream.finalMessage();

    if (msg.stop_reason === "refusal") {
      return Response.json({ error: "The model declined to rebuild this site." }, { status: 422 });
    }

    const raw = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim()
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let sections = parseSections(raw);
    if (sections.length === 0) {
      // Model didn't use markers — keep the output as one section so we still ship a page.
      sections = [{ type: "page", label: "Full page", html: raw }];
    }

    const full = pageSkeleton(joinSections(sections), site.title);

    const id = randomUUID().slice(0, 8);
    await mkdir(SITES_DIR, { recursive: true });
    await writeFile(path.join(SITES_DIR, `${id}.html`), full, "utf8");
    const saved = await saveComponents(sections, target);

    return Response.json({
      id,
      url: `/s/${id}`,
      html: full,
      meta: { title: site.title, images: site.images.length, sections: saved },
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "No valid ANTHROPIC_API_KEY set on the server." }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

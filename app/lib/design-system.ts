// The single shared design system. The SERVER owns this CSS and injects it into
// every page (rebuilt or composed), so sections generated from different sites
// all use the same tokens and mix together cleanly. Claude only emits section
// bodies that reference these tokens/classes — never its own design system.

export const DESIGN_SYSTEM_CSS = `
:root {
  --bg: #ffffff;
  --surface: #f6f6f7;
  --border: #e4e4e7;
  --fg: #141417;
  --muted: #6b7280;
  --accent: #4f46e5;
  --accent-contrast: #ffffff;
  --radius: 18px;
  --radius-sm: 10px;
  --container: 1120px;
  --font: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0c10;
    --surface: #17171d;
    --border: #2a2a33;
    --fg: #f2f2f4;
    --muted: #a1a1ab;
    --accent: #8b87f5;
    --accent-contrast: #0c0c10;
  }
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.container { width: 100%; max-width: var(--container); margin: 0 auto; padding: 0 20px; }
.section { padding: clamp(48px, 8vw, 104px) 0; }

.eyebrow {
  font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted); margin: 0 0 12px;
}
.h1 { font-size: clamp(2.2rem, 6vw, 4rem); line-height: 1.05; letter-spacing: -0.03em; font-weight: 800; margin: 0 0 20px; }
.h2 { font-size: clamp(1.7rem, 4vw, 2.7rem); line-height: 1.1; letter-spacing: -0.02em; font-weight: 700; margin: 0 0 16px; }
.h3 { font-size: clamp(1.15rem, 2.2vw, 1.5rem); line-height: 1.2; font-weight: 700; margin: 0 0 10px; }
.lead { font-size: clamp(1.05rem, 1.6vw, 1.3rem); color: var(--muted); margin: 0 0 24px; }
.muted { color: var(--muted); }

.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 22px; border-radius: 999px; font-weight: 600; font-size: 1rem;
  text-decoration: none; border: 1px solid var(--border); background: var(--surface);
  color: var(--fg); cursor: pointer; transition: transform .15s ease, opacity .15s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn.accent { background: var(--accent); color: var(--accent-contrast); border-color: transparent; }

.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; }
.tag {
  display: inline-block; padding: 6px 12px; border-radius: 999px;
  background: var(--surface); border: 1px solid var(--border); font-size: 0.85rem; color: var(--muted);
}
.grid-2 { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.grid-3 { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

/* ---- Motion system (senior UI/UX). Everything is VISIBLE by default; motion only
   enhances. No JavaScript. Entrance animations auto-play to a fully visible end
   state; scroll reveal uses CSS scroll-driven animations where supported and falls
   back to fully-visible content elsewhere. All of it is off under
   prefers-reduced-motion — content can never be hidden by motion. ---- */
@keyframes dsUp { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
@keyframes dsDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: none; } }
@keyframes dsLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: none; } }
@keyframes dsRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
@keyframes dsFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dsScale { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
@keyframes dsZoom { from { opacity: 0; transform: scale(.82); } to { opacity: 1; transform: none; } }
@keyframes dsBlur { from { opacity: 0; filter: blur(14px); transform: translateY(14px); } to { opacity: 1; filter: none; transform: none; } }
@keyframes dsFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes dsSpin { to { transform: rotate(360deg); } }
@keyframes dsGradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes dsMarquee { to { transform: translateX(-50%); } }
@keyframes dsShine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(220%) skewX(-20deg); } }
@keyframes dsPulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent); } 50% { box-shadow: 0 0 0 12px transparent; } }
@keyframes dsTextShimmer { to { background-position: 200% center; } }

/* Hover / focus micro-interactions (always on, pure CSS) */
.hover-lift { transition: transform .25s cubic-bezier(.22,.61,.36,1), box-shadow .25s ease; }
.hover-lift:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgb(0 0 0 / .14); }
.hover-tilt { transition: transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s ease; transform-style: preserve-3d; }
.hover-tilt:hover { transform: perspective(900px) rotateX(4deg) rotateY(-5deg) translateY(-4px); box-shadow: 0 22px 44px rgb(0 0 0 / .16); }
.hover-glow { transition: box-shadow .3s ease, border-color .3s ease; }
.hover-glow:hover { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 14px 40px color-mix(in srgb, var(--accent) 28%, transparent); }
.hover-zoom { overflow: hidden; }
.hover-zoom img { transition: transform .6s cubic-bezier(.22,.61,.36,1); }
.hover-zoom:hover img { transform: scale(1.07); }
.hover-arrow .arrow { display: inline-block; transition: transform .25s ease; }
.hover-arrow:hover .arrow { transform: translateX(4px); }
.link-underline { position: relative; text-decoration: none; }
.link-underline::after {
  content: ""; position: absolute; left: 0; bottom: -2px; height: 2px; width: 100%;
  background: currentColor; transform: scaleX(0); transform-origin: right; transition: transform .3s ease;
}
.link-underline:hover::after { transform: scaleX(1); transform-origin: left; }
.btn { transition: transform .15s ease, box-shadow .25s ease, opacity .15s ease; position: relative; overflow: hidden; }
.btn:active { transform: translateY(0) scale(.97); }
.btn.accent:hover { box-shadow: 0 10px 28px color-mix(in srgb, var(--accent) 40%, transparent); }
/* Light sweep across a button on hover */
.btn.shine::after {
  content: ""; position: absolute; inset: 0; width: 40%;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / .35), transparent);
  transform: translateX(-120%) skewX(-20deg); pointer-events: none;
}
.btn.shine:hover::after { animation: dsShine .8s ease; }

/* Static helpers that motion classes pair with */
.text-gradient {
  background: linear-gradient(90deg, var(--fg), var(--accent), #ec4899, var(--accent), var(--fg));
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
}
.bg-gradient-animated {
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent) 18%, var(--bg)), var(--bg), color-mix(in srgb, #ec4899 14%, var(--bg)), var(--bg));
  background-size: 300% 300%;
}
.marquee { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.marquee-track { display: flex; gap: 48px; width: max-content; }
.blob { position: absolute; border-radius: 999px; filter: blur(60px); opacity: .35; pointer-events: none; z-index: 0; }

@media (prefers-reduced-motion: no-preference) {
  /* On-load entrance — use for above-the-fold / hero */
  .anim-up { animation: dsUp .7s cubic-bezier(.22,.61,.36,1) both; }
  .anim-down { animation: dsDown .6s cubic-bezier(.22,.61,.36,1) both; }
  .anim-left { animation: dsLeft .8s cubic-bezier(.22,.61,.36,1) both; }
  .anim-right { animation: dsRight .8s cubic-bezier(.22,.61,.36,1) both; }
  .anim-fade { animation: dsFade .8s ease both; }
  .anim-scale { animation: dsScale .6s cubic-bezier(.22,.61,.36,1) both; }
  .anim-zoom { animation: dsZoom .8s cubic-bezier(.22,.61,.36,1) both; }
  .anim-blur { animation: dsBlur .9s cubic-bezier(.22,.61,.36,1) both; }
  .delay-1 { animation-delay: .1s; } .delay-2 { animation-delay: .2s; } .delay-3 { animation-delay: .3s; }
  .delay-4 { animation-delay: .45s; } .delay-5 { animation-delay: .6s; }
  .stagger > * { animation: dsUp .6s cubic-bezier(.22,.61,.36,1) both; }
  .stagger > *:nth-child(1) { animation-delay: .04s; }
  .stagger > *:nth-child(2) { animation-delay: .10s; }
  .stagger > *:nth-child(3) { animation-delay: .16s; }
  .stagger > *:nth-child(4) { animation-delay: .22s; }
  .stagger > *:nth-child(5) { animation-delay: .28s; }
  .stagger > *:nth-child(6) { animation-delay: .34s; }
  .stagger > *:nth-child(7) { animation-delay: .40s; }
  .stagger > *:nth-child(8) { animation-delay: .46s; }
  .stagger > *:nth-child(n+9) { animation-delay: .52s; }

  /* Ambient, looping — decoration only, never on text people need to read */
  .float { animation: dsFloat 6s ease-in-out infinite; }
  .float-slow { animation: dsFloat 9s ease-in-out infinite; }
  .spin-slow { animation: dsSpin 24s linear infinite; }
  .text-gradient.animated { animation: dsTextShimmer 6s linear infinite; }
  .bg-gradient-animated { animation: dsGradient 14s ease infinite; }
  .pulse-ring { animation: dsPulse 2.4s ease-in-out infinite; }
  .marquee-track { animation: dsMarquee 32s linear infinite; }
  .marquee:hover .marquee-track { animation-play-state: paused; }

  /* Scroll reveal — use for below-the-fold sections. CSS scroll-driven, no JS.
     animation-timeline MUST come after the shorthand (the shorthand resets it to auto).
     Ranges end within "entry", so anything fully on screen (even at the very bottom
     of the page, where it can't scroll further) has finished revealing. */
  @supports (animation-timeline: view()) {
    .reveal { animation: dsUp 1s both; animation-timeline: view(); animation-range: entry 0% entry 80%; }
    .reveal-fade { animation: dsFade 1s both; animation-timeline: view(); animation-range: entry 0% entry 80%; }
    .reveal-left { animation: dsLeft 1s both; animation-timeline: view(); animation-range: entry 0% entry 80%; }
    .reveal-right { animation: dsRight 1s both; animation-timeline: view(); animation-range: entry 0% entry 80%; }
    .reveal-zoom { animation: dsZoom 1s both; animation-timeline: view(); animation-range: entry 0% entry 80%; }
    .reveal-blur { animation: dsBlur 1s both; animation-timeline: view(); animation-range: entry 0% entry 80%; }
    .reveal-stagger > * { animation: dsUp 1s both; animation-timeline: view(); animation-range: entry 0% entry 70%; }
    .reveal-stagger > *:nth-child(2) { animation-range: entry 10% entry 80%; }
    .reveal-stagger > *:nth-child(3) { animation-range: entry 20% entry 90%; }
    .reveal-stagger > *:nth-child(4) { animation-range: entry 30% entry 100%; }
  }
}
`.trim();

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export function pageSkeleton(bodyHtml: string, title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title || "Rebuilt site")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${DESIGN_SYSTEM_CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

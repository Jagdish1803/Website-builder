# Site Rebuilder

Paste any URL → it crawls the page, extracts the real content, and has Claude
rebuild it as modern, reusable sections with a better UI. Sections land in a
library you can mix & match into new pages in the Composer.

## Setup

```bash
npm install
# set your key (PowerShell):
$env:ANTHROPIC_API_KEY = "sk-ant-..."
npm run dev
```

Open http://localhost:3000, paste a URL (e.g. `logicloomweb.com`), hit Rebuild.

## Pages

- **Builder** (`/`) — paste a URL, watch progress, preview the result at desktop /
  tablet / mobile widths, copy the live link, download, or open it in the Composer.
- **Sites** (`/sites`) — every rebuilt and composed page, with search, type, source
  and sort filters. Rename, delete, download or edit any site.
- **Composer** (`/compose`) — the section library (filter by text, type and source;
  "Add all" adds every filtered section), an ordered page outline, a live preview,
  and save / update. `/compose?site=<id>` edits an existing site.

The UI uses [shadcn/ui](https://ui.shadcn.com) components (`components/ui`, config in
`components.json`) on Tailwind CSS v4, with light/dark themes. Animation uses
[Motion](https://motion.dev) (Framer Motion); reusable effects live in `components/fx`
(text reveal, magnetic button, spotlight/tilt card, number ticker, marquee, scroll
progress, segmented filter, parallax background), plus drag-to-reorder in the
Composer. Everything respects the OS "reduce motion" setting.

Generated pages get their motion from the CSS-only system in
`app/lib/design-system.ts` (entrance, scroll-reveal, hover, ambient and marquee
classes), which the build prompt tells Claude to use on every section.

## How it works

1. `POST /api/build` fetches the URL's HTML and `cheerio` pulls out the title,
   headings, copy, links and absolute image URLs.
2. That content goes to Claude (`claude-opus-5-5`, adaptive thinking), which
   returns the page as labelled section blocks built on the shared design system
   in `app/lib/design-system.ts`.
3. Each section is saved to `data/components/<id>.json`; the site itself is a small
   record in `data/sites/<id>.json` that lists its section ids in order.
4. Pages are **rendered on request** from those sections: `/s/<id>` (add
   `?download` to save it as a file), `/c/<id>` for a single section and
   `/preview?ids=a,b,c` for an unsaved composition. No HTML is stored, so a
   change to a section or the design system shows up on every site that uses it.

Pages built before this change (`sites/<id>.html`) still open at `/s/<id>`, and
sections stored the old way as `components/<id>.json` still show up in the library.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/build` | Rebuild a URL → new site + sections |
| GET / POST | `/api/sites` | List sites / create a composed site (`{ ids, title }`) |
| GET / PATCH / DELETE | `/api/sites/:id` | Read, update (`{ ids?, title? }`) or delete a site |
| GET | `/api/components` | List library sections (metadata only) |
| DELETE | `/api/components/:id` | Remove a section from the library |

## Current limits

- **Single page only.** Multi-page crawling (following internal links) isn't built yet.
- **No screenshot.** Claude works from the extracted content, not a visual snapshot.
- **Static HTML only.** JS-rendered SPAs return little content via `fetch`.
- **Not SSRF-safe.** Fine as a local tool. Before exposing it publicly, block
  internal IPs / metadata endpoints and add auth and rate limiting.

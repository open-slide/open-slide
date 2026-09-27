---
name: create-image
description: Build a new open-slide marketing image in apps/marketing, such as an OG card, social post, README or GitHub banner, launch announcement, or blog hero. Researches the subject in the repo, scaffolds images/<id>, picks the output sizes, designs one page that serves every size, and verifies it with rendered PNGs. Use when asked for an image, graphic, card, banner, cover, thumbnail, or social post for open-slide or one of its features. For motion (videos, trailers), use create-video.
---

# Create image

The user names what they need ("an OG image for comments", "a tweet card for the 2.0 launch"). You deliver `apps/marketing/images/<id>/`. It previews in the marketing workspace and renders to one PNG per output size. Work autonomously. Ask only if the subject or its destination can't be inferred.

`images/cover/` is the reference image: a cinematic wall of real slides with copy on the left. It is one page that renders at both 1200 × 630 and 1280 × 640. Read `images/cover/index.html` before designing.

## 1. Brief

Find out the message and where the image goes.

- For a feature: `git log --oneline -i --grep "<keyword>"`, `.changeset/*.md`, `packages/core/CHANGELOG.md`, and `packages/core/src/locale/` for the exact product wording. `apps/web` has existing marketing copy.
- Write down a headline (2–6 words), an optional supporting line, an optional CTA (usually `npx @open-slide/cli init` or `open-slide.dev`), and the one visual that proves the claim.

## 2. Pick outputs

List every size the image is used at. Common ones:

| Use | Size |
| --- | --- |
| Open Graph / link preview | 1200 × 630 |
| X post | 1600 × 900 |
| LinkedIn post | 1200 × 627 |
| Square (Instagram, X) | 1080 × 1080 |
| Portrait feed | 1080 × 1350 |
| Story / vertical | 1080 × 1920 |
| GitHub README banner, repo social preview | 1280 × 640 |

Name each output for its use (`og`, `x`, `square`, `readme`). Add `publish: '<repo path>'` only when the user asked to replace a file in the repo. For example, the site's OG image is `apps/web/app/opengraph-image.png`.

## 3. Scaffold

```bash
pnpm marketing new:image <id> --title "<Headline>"
```

`<id>` is short kebab-case (`comments-og`, `v2-social`). It must not match a film id, because films and images share `out/<id>/`. This copies `templates/image` into `images/<id>/`: `image.js` (title and outputs) and `index.html` (the page). Nothing needs registering.

## 4. Build

Set the outputs in `image.js`, then design `index.html`.

### Page rules

- **The viewport is the canvas.** The render opens the page once per output at exactly `width × height`. Lay out from `innerWidth`/`innerHeight`, or with `vw`/`vh`, `clamp()`, and `@media (aspect-ratio …)`. That way one page serves landscape, square, and portrait. When a layout is tuned at one size, anchor it the way the cover does: design at a base size and offset by the difference.
- **Deterministic.** No `Math.random`, `Date`, animations, or transitions. For scatter (dust, noise), use a seeded generator like the cover's `rnd()`.
- **Local assets only.** No network at render time.
  - Fonts: `<link rel="stylesheet" href="/out/fonts/_base/fonts.css">` gives Geist and Geist Mono. Extra Google Fonts go in `fonts: [{ family, weight, italic? }]` in `image.js`, served at `/out/fonts/<id>/fonts.css`.
  - Real slides: `<img src="/@deck/<deck>/<page>.png">` is a 1920 × 1080 screenshot of page `<page>` (1-based) of a deck in `packages/cli/template/slides/` or `apps/demo/slides/`. Read the deck's `index.tsx` to find the page you want. The first request builds the deck (about 40 s), and later requests hit the `out/.cache/decks` cache.
  - Repo files: `/@repo/<path>`, e.g. `/@repo/apps/web/public/open-slide.png` for the app icon. Image-only files go in `images/<id>/assets/` (served as `/images/<id>/assets/…`).
- **Async pages.** The render waits for fonts and every `<img>`. If the page builds itself in script after load, set `window.__ready = false` at the top and `true` when done.
- Don't import `src/ui/*` film mocks into an image page. They need the film engine's `update` pass to lay out. Show the product with `/@deck` screenshots instead, or build a small static mock in the page.

### Visual language

Match the existing brand; the cover is the benchmark.

- Dark stage `#030304`–`#0a0a0a`. Headline in Geist 600, tight tracking (`-0.05em`), near-white `#f5f5f6`. Secondary text is white at ~55% opacity. Commands go in Geist Mono with a vermillion `$` (`#e5484a`).
- One accent: open-slide vermillion, `oklch(0.6 0.2 25)`. Use it sparingly: a glow, a prompt, a badge.
- Show the real product (deck screenshots) rather than abstract shapes. Depth comes from perspective, light (haze, bloom, a beam), and falloff, not from outlines.
- Legibility at thumbnail size: link previews render ~500 px wide. At 1200 px wide, keep the headline ≥ 64 px, supporting text ≥ 24 px, and nothing essential below 15 px. Leave ~80 px of safe margin, and keep copy away from edges that feeds may crop.

## 5. Verify

```bash
pnpm marketing render <id> --no-publish
```

Read every PNG in `out/<id>/renders/`, one per output. Check each size on its own: text overflow or collisions, the headline's readability when scaled down, cropped or empty regions, the right deck pages, and whether the image reads in about one second. A missing image fails the render and names its URL. Iterate until every output is clean. `--only <name>` re-renders just one output while tuning.

## 6. Finish

- Run `pnpm check` from the repo root (Biome). No changeset: `apps/*` doesn't need one.
- Don't start the workspace yourself. Tell the user:
  - Preview: `pnpm dev:marketing` → `http://127.0.0.1:5180/#/<id>/preview`
  - Render: `pnpm marketing render <id>`, plus which outputs `publish` to repo paths.
- Report the outputs (name, size, use) and any copy you had to guess.

---
name: ui-screenshots
description: Shoot polished, framed screenshots of the open-slide dev UI (editor, inspector, Arrange tab, comment mode, agent panel, assets manager, svgl search, themes, presenter, ⌘K menu, slide overview, export menu) as cropped webp images — the app as a rounded, shadowed window on a soft gray stage, with padding where the window edge shows and bleed where the crop cuts through. This is the house style for docs pages, the changelog, the landing site, and READMEs. Use it whenever the user asks for UI screenshots, docs or changelog images, "nice"/"framed"/"cropped" screenshots, or wants images under apps/web/public/assets refreshed because the UI changed — even if they don't name this skill or describe the style.
---

# Framed UI screenshots

The output is a webp like a product-page detail shot: a crop of the real dev
UI, rendered as a window with rounded corners and a layered shadow on a warm
gray gradient. Window edges that fall inside the crop get 56px of padding;
edges where the crop cuts through the UI bleed off the stage. That contrast is
what makes a crop read as "a detail of a real app" instead of a pasted
rectangle, so choose crops with it in mind.

Everything is captured from a real `open-slide dev` server running on a
throwaway scratch project, so the shots show the current UI, not a mock.

All scripts live in `.claude/skills/ui-screenshots/scripts/` and are run from
the repo root with `node`.

## Before you start

- **Ask before starting a dev server.** The user prefers to start dev
  servers themselves. The inspector, comment mode, Design panel, and agent
  panel only exist under `open-slide dev`, so screenshots need one. Explain
  that and propose the throwaway scratch server below. Approval doesn't carry
  over from an earlier session.
- **Never drive a server that's already running.** Port 5173 is often the
  user's own slides project in another folder, and clicking around a real
  workspace writes `@slide-comment` markers and edits into it.
- Use a scratchpad directory for shot lists and outputs until images are
  final.

## Workflow

1. **Pick the shots.** One image per idea. Show the state that explains the
   feature: a selected element with the panel open, a dialog with real
   results, pins already posted. For docs, the page's hero image usually goes
   right under the frontmatter, with section images under the heading they
   illustrate. For the changelog, only releases worth a picture get one.

2. **Build the scratch project.**
   ```bash
   node .claude/skills/ui-screenshots/scripts/setup-scratch.mjs
   ```
   This creates `packages/core/e2e/.scratch/docs-shots` (gitignored) with
   eight demo decks, the getting-started template deck, a `q2-launch` deck
   containing an `<ImagePlaceholder>`, the demo themes, brand-logo and
   generated-gradient assets, and per-entry `node_modules` symlinks to
   `apps/demo`. The symlinks are per entry so the dev server's
   `node_modules/.open-slide` state stays inside the scratch copy.

3. **Start the server in the background** (`run_in_background`), then read
   its output for the ready line:
   ```bash
   cd packages/core/e2e/.scratch/docs-shots && OPEN_SLIDE_DEV_SUPERVISED=1 node ../../../bin.js dev --no-skills-check --host 127.0.0.1 --port 43219
   ```
   If it dies with `Cannot find package …`, `node_modules` has drifted from
   the lockfile (common right after pulling a dependency bump). Run
   `pnpm install --frozen-lockfile` from the repo root and start again. The
   core `dist/` must be built too (`pnpm core build`) if `packages/core/src`
   changed since the last build.

4. **Write a shots file** in the scratchpad. Start from
   `scripts/shots.example.mjs`, which has a working recipe for every state
   listed in the description, plus the field reference at the top. Copy the
   entries you need and adjust crops. Selectors there use the app's real
   accessible names, so prefer them over guessing.

5. **Shoot.**
   ```bash
   node .claude/skills/ui-screenshots/scripts/shoot.mjs <shots.mjs> --out <dir> [--only a,b]
   ```
   Each shot is captured at 3× device scale and composed at 2×, giving a
   2000px-wide webp (q86, usually 40–100 KB). Raw captures are kept in
   `<scratch>/.raw/` for debugging.

6. **Look at every image** before using it. The Read tool can open webp
   files. To review a batch at once:
   ```bash
   node .claude/skills/ui-screenshots/scripts/contact-sheet.mjs <sheet.png> a.webp b.webp c.webp d.webp
   ```
   Check for: a crop that slices through a label or pill, empty canvas
   dominating the frame, text too small to read, a stray hover state, a loading
   state, odd search matches, the wrong page. Fix and reshoot with `--only`.

7. **Place the images.**
   - Docs: `apps/web/public/assets/screenshots/<name>.webp`, referenced from
     MDX as `![alt](/assets/screenshots/<name>.webp)`. The docs map `img` to
     fumadocs' `ImageZoom`, so they zoom on click automatically.
   - Changelog or other landing pages: `apps/web/public/assets/<area>/`, and
     render them with `ImageZoom` from `fumadocs-ui/components/image-zoom`
     (same props as `next/image`) so they zoom like the docs.
   - Alt text describes what the image shows ("The Arrange tab showing
     position, size, rotation, align, and layer controls for a selected
     headline"), not that it is a screenshot.
   - When replacing an image, update alt text that no longer matches, and
     delete files nothing references any more (`git grep` the name first).

8. **Check them in context** without a dev server:
   ```bash
   node .claude/skills/ui-screenshots/scripts/preview-web.mjs --route /changelog --out <dir> [--width 1440] [--dark] [--click "figure img"]
   ```
   This builds a static export of `apps/web` in a scratch copy, then
   full-page-shoots the route and slices it into 2200px sections. Pass
   `--keep-docs` to include `/docs` routes (slower build), `--skip-build` to
   reuse the last export, and `--click` to confirm click-to-zoom.

9. **Clean up.** Stop the server by port and remove the scratch copies:
   ```bash
   kill $(lsof -tiTCP:43219 -sTCP:LISTEN)
   rm -rf packages/core/e2e/.scratch/docs-shots packages/core/e2e/.scratch/web-preview
   ```
   An exit code of 143 from the background server task just means it was
   killed.

## Choosing crops

- **Viewport:** 1280×720 for editor shots, so the slide canvas fills its
  area instead of floating in whitespace. 1280×800 for home, themes, and
  full-window views. The presenter looks best at 1280×760.
- **Width:** the docs column shows images at roughly 700 css px. A crop much
  narrower than ~900 UI px gets blown up, and one wider than 1280 shrinks the
  text to unreadable. Panels and dialogs read well at 950–1100 wide.
- **Which edges show:** an edge is padded when the crop touches that side of
  the viewport, and bleeds otherwise. A crop like `{ x: 300, y: 0, w: 980,
  h: 600 }` shows the window's top and right edges and bleeds left and
  bottom, which suits right-side panels. Make every crop touch at least one
  viewport edge, or nothing in the frame shows a window edge.
- **Height:** bleed the bottom (h ≈ 560–620 at 720 tall) rather than showing
  a tall strip of empty panel. Aim for roughly 1.5–1.8 : 1 output.
- **Full window:** omit `crop` for an overview shot (editor, slide overview,
  presenter). All four edges get padding.
- **Consistency:** keep the stage, padding, and radius as the script sets
  them, so new shots match the existing ones. `stage: 'dark'` is only for
  UIs that are dark themselves, like the presenter.

## Gotchas

- **Agent panel:** a scratch server has no real session, so mock
  `/__agent/sessions`, `/__agent/sessions/<id>`, and `/__agent/events`, and
  seed `open-slide:agent-session` / `open-slide:agent-dock` in localStorage.
  Delay the mocked responses ~4s and open the deck with `?p=1`. If a running
  session is known before the deck loads, the follow-along logic jumps to the
  last page.
- **Comment pins:** posting comments writes `@slide-comment` markers into
  the scratch deck. That's fine, but shots taken later in the same run show a
  comment badge on the toolbar. Run `setup-scratch.mjs` again for a clean
  slate.
- **⌘K menu:** shoot it with no query. Fuzzy search matches unrelated
  "Language: …" rows.
- **svgl search:** type into the `Search by brand…` placeholder (focus
  starts on the svgl.app link). Wait for `networkidle`. Pick a colourful
  brand like Figma, because monochrome logos render as an empty tile.
- **Presenter:** open it from **Present options → Presenter mode** and catch
  the popup with `context.waitForEvent('page')`, so it shows as linked to
  the main window.
- **Arrange tab:** `page.getByTitle('Arrange')`. The Text/Image tab is the
  default.
- **Content:** use the demo decks and generated assets only. Never use real
  people's photos or avatars as sample content. Don't copy the user's
  untracked or modified decks into the scratch project.
- **Dark docs:** the shots are light-only. They read fine as light cards on
  the dark docs theme. Don't produce dark variants unless asked.

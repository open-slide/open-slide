# marketing

Every marketing asset for open-slide lives here: launch films in `films/<id>/` and images (OG cards, README banners, social posts) in `images/<id>/`. Both are plain HTML/CSS rendered by headless Chromium, and both show up in one workspace.

## Workspace

```bash
pnpm dev:marketing                        # or: pnpm marketing dev → http://127.0.0.1:5180
```

**Overview** shows every video and image with its latest render. Pick a project in the sidebar to see its **Renders**, newest first, with the settings each was made with (resolution, render time, git commit; motion blur and encode for films; publish target for images). A render in progress shows live progress. **Preview** is the live source: the scrubbable film (`/film.html?film=<id>`), or the image page at every output size.

## New project

```bash
pnpm marketing new:film comments-launch --feature "Comments" --tagline "Feedback, pinned to the slide."
pnpm marketing new:image comments-og --title "Comments are here"
```

`new:film` copies `templates/film`: a 20-second intro, feature demo, and outro that renders as-is. `new:image` copies `templates/image`: a manifest and a page. The `create-video` and `create-image` skills (`.claude/skills/`) walk an agent through a whole film or image from just a feature name. Films and images share one id space, since both render to `out/<id>/`.

## Render

```bash
pnpm marketing render <id>                # a film → MP4, an image → one PNG per output
```

Each render is written to `out/<id>/renders/<name>-<timestamp>.{mp4,png}`, with a `.json` sidecar recording how it was made. Nothing is overwritten. The first run downloads Google Fonts into `out/fonts/<id>`.

### Films

1920 × 1080 at 60 fps, with a synthesized soundtrack. Every frame is driven by a deterministic timeline. Scenes are pure functions of time, so frames render out of order across parallel workers, and ffmpeg encodes them.

```bash
pnpm marketing render <id> --scale 2      # 3840 × 2160
pnpm marketing render:draft <id>          # 30 fps, 960 × 540, no motion blur
pnpm marketing soundtrack <id>            # just out/<id>/soundtrack.wav
pnpm marketing stills <id> 12.5,30        # PNG stills at the given seconds → out/<id>/stills/
pnpm marketing snapshot [--save]          # guard shared src/ and audio/ changes against every film
```

With a single film, `<id>` can be left out. Rendering needs `ffmpeg` built with libx264 on `PATH`, or set `FFMPEG`. It uses Playwright's Chromium, or set `CHROMIUM_PATH`. The soundtrack is re-synthesized on every render.

Useful flags: `--name`, `--out`, `--from/--to` (seconds), `--fps`, `--samples` (motion-blur sub-frames), `--shutter`, `--workers`, `--scale`, `--crf`, `--grain`, `--no-audio`. They override `--draft`.

### Images

`images/<id>/image.js` lists the outputs. The page (`index.html`) is rendered once per output at that viewport size, so one layout can serve several aspect ratios.

```js
export default defineImage({
  title: 'Cover',
  outputs: [
    { name: 'og', width: 1200, height: 630, publish: 'apps/web/app/opengraph-image.png' },
    { name: 'readme', width: 1280, height: 640 },
  ],
});
```

`publish` copies the render to that repo path. Flags: `--only og,readme`, `--scale 2` (2× pixel density), `--no-publish`.

Pages can use:

| URL | What |
| --- | --- |
| `/out/fonts/_base/fonts.css` | Geist and Geist Mono. Extra Google Fonts go in the manifest's `fonts`, served at `/out/fonts/<id>/fonts.css`. |
| `/@deck/<deck>/<page>.png` | A real slide: page `<page>` of a deck in `packages/cli/template/slides` or `apps/demo/slides`, built with the local core and screenshotted at 1920 × 1080. Cached in `out/.cache/decks` until the deck's sources change. Run `pnpm core build` first if core's dist is stale. |
| `/@repo/<path>` | Any file in the monorepo, such as `/@repo/apps/web/public/open-slide.png`. |

The render waits for fonts and every `<img>`. A page that builds itself asynchronously sets `window.__ready = false` up front and `true` when done.

## Layout

| Path | What |
| --- | --- |
| `films/<id>/film.js` | The manifest: title, duration, BPM, poster time, extra fonts, scenes, transitions, hits. |
| `films/<id>/timeline.js` | Chapters (via `sequence`), card hand-offs, and the big hits that drive camera shake. |
| `films/<id>/scenes/*` | One file per chapter. Each exports `build(root)`, `update(state, t, T)`, and its `sfx` cues. |
| `films/<id>/score.js` | The film's music, played on the shared kit. |
| `images/<id>/image.js`, `index.html` | An image's outputs, and the page they render. |
| `src/engine.js`, `src/main.js`, `film.html` | Mounts a film's scenes, card hand-offs, shake/flash post layer, preview scrubber. |
| `src/lib/*` | Timing, easing, DOM, text effects, cursor routes, `defineScene`, `defineFilm`/`sequence`, `defineImage`. |
| `src/ui/*` | Recreations of the open-slide viewer, editor, home, and export UI, built from core's tokens and Lucide icons. |
| `audio/kit.mjs`, `audio/sfx.mjs` | Instruments, the house groove, and the sound-effect library scenes cue by name. |
| `audio/synth.mjs` | Plays a film's score and cues, then mixes and masters its soundtrack. |
| `scripts/render.mjs` | Routes `render <id>` to `render-film.mjs` (frame capture, motion blur, grain, encode, audio mux) or `render-image.mjs`. |
| `scripts/decks.mjs` | Builds and screenshots decks for `/@deck`. |
| `scripts/serve.mjs`, `studio.html`, `src/studio/*` | The workspace: projects and renders API, byte-range video serving, and the UI. |
| `templates/film`, `templates/image` | What `new:film` and `new:image` copy. |

Film code imports shared modules as `#lib/…`, `#ui/…`, and `#theme`. `package.json` `imports` resolves them in Node, and the import maps in `film.html` and `studio.html` resolve them in the browser.

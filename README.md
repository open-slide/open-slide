<img width="1280" height="640" alt="open-slide" src="https://github.com/user-attachments/assets/da535284-f7a9-4834-b281-f9ac6fe416e8" />

# open-slide

The slide framework built for agents. Describe a deck, and your coding agent writes it as React or Svelte. open-slide handles the canvas, scaling, navigation, hot reload, editing, and present mode.

Every page is a React or Svelte component rendered on a fixed 1920 × 1080 canvas.

```bash
npx @open-slide/cli init my-deck
# For Svelte: npx @open-slide/cli init my-deck --framework svelte
cd my-deck
npm run dev
```

[Documentation](https://open-slide.dev/docs) · [Changelog](https://open-slide.dev/changelog)

## Agent panel

In the React runtime, connect the Claude Code or Codex CLI you already use and drive it from the browser. Press `A` on any slide to open the panel.

![The agent panel beside the canvas while Claude Code edits the open deck](.github/assets/agent-panel.webp)

- **Draft a deck.** Click New deck on the home page and describe it. The agent writes it page by page while the canvas follows along.
- **Edit what you see.** The current slide, page, and selected element go along with every message, so "make this bigger" just works.
- **Apply comments** with one click from the comment bar.
- **Uses your existing login.** The SDK installs into the workspace the first time you open the panel. No API keys to configure.

Prefer the terminal? The bundled skills (`/create-slide`, `/apply-comments`, `/create-theme`) work with any coding agent, including Claude Code, Codex, Cursor, and others.

## Comment mode

Press `C`, click an element or drag across a region, and leave a note. Notes are saved as `@slide-comment` markers in the source, and the agent applies them all in one pass.

![Comment mode with pinned notes beside the slide](.github/assets/comment-mode.webp)

## Present mode

Fullscreen playback with keyboard navigation, and a presenter view with the next slide, speaker notes, and a timer.

![Presenter view with the current slide, next slide, speaker notes, and timer](.github/assets/presenter.webp)

## Also included

- Visual editor with drag, resize, alignment guides, and inline text editing
- Themes, page transitions, step-by-step reveals, and shared-element morphs
- Assets manager with brand logo search via [svgl](https://svgl.app) and Google Fonts
- Export to static HTML, PDF, and PPTX
- Static build that deploys to Vercel, Cloudflare Pages, Netlify, or any static host

## Repository

| Path | Description |
| --- | --- |
| [packages/core](packages/core) | `@open-slide/core` — compatibility package that automatically routes existing installations to the React runtime. |
| [packages/shared](packages/shared) | `@open-slide/shared` — framework-neutral config, types, slide discovery, virtual modules, filesystem helpers, and shared runtime utilities. |
| [packages/react](packages/react) | `@open-slide/react` — the existing React viewer, presenter, inspector, Vite integration, and runtime CLI. |
| [packages/svelte](packages/svelte) | `@open-slide/svelte` — native Svelte viewer, presenter, inspector, Vite integration, and runtime CLI. |
| [packages/cli](packages/cli) | `@open-slide/cli` — framework-selecting workspace scaffolder. |
| [apps/demo](apps/demo) | React dogfood workspace that consumes `@open-slide/react` via `workspace:*`. |
| [apps/svelte-demo](apps/svelte-demo) | Svelte dogfood workspace that validates the native runtime in the Turbo graph. |


```bash
pnpm install
pnpm dev         # run the demo against local core
pnpm build       # build all packages
pnpm typecheck
pnpm check       # biome
pnpm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Support

<a href="https://vercel.com/open-source-program"><img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge-2026.svg" /></a>

If open-slide is useful to you, consider supporting development:

<a href="https://buymeacoffee.com/1weiho"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="40"></a>

## License

MIT © [Yiwei Ho](https://github.com/1weiho)

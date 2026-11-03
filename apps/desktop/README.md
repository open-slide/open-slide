# open-slide desktop

Electron shell around `@open-slide/core`. It runs the open workspace's own core dev server (on Electron's Node runtime), shows Home and each deck in their own tab, and ships the Claude Code and Codex SDKs so the agent panel connects without installing anything.

```bash
pnpm dev:desktop      # from the repo root: builds the CLI, then starts electron-vite
pnpm --filter desktop package   # unpacked app in apps/desktop/release
pnpm --filter desktop dist      # installers
```

- `src/main` — window, tabs (one `WebContentsView` each), dev server supervisor, workspace init/install, agent sign-in.
- `src/preload/view.ts` — the `window.openSlideDesktop` bridge core reads in `packages/core/src/app/lib/desktop.ts`.
- `src/renderer` — tab strip, welcome, and settings, built from core's own UI primitives and tokens.

Translucency needs core's desktop bridge, so workspaces on an older `@open-slide/core` open with solid chrome.

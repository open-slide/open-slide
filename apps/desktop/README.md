# open-slide desktop

Electron shell around `@open-slide/core`. It ships its own core and runs its dev server against the open workspace (on Electron's Node runtime), so a workspace only supplies slides, themes, assets, and its config — no install needed unless its slides import packages of their own. It shows Home and each deck in their own tab, and ships the Claude Code and Codex SDKs so the agent panel connects without installing anything.

```bash
pnpm dev:desktop      # from the repo root: builds the CLI, then starts electron-vite
pnpm --filter desktop package   # unpacked app in apps/desktop/release
pnpm --filter desktop dist      # installers
```

- `src/main` — window, tabs (one `WebContentsView` each), dev server supervisor, workspace init/install, skills sync, agent sign-in.
- `src/preload/view.ts` — the `window.openSlideDesktop` bridge core reads in `packages/core/src/app/lib/desktop.ts`.
- `src/renderer` — tab strip, welcome, and settings, built from core's own UI primitives and tokens.

The bundled core keeps its Vite cache under the app's user data, syncs its built-in skills into a workspace once per app version, and hides the in-app core update — updating the app updates core.

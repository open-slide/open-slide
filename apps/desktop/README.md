# open-slide desktop

Electron shell around `@open-slide/core`. It ships its own core and runs its dev server against the open workspace (on Electron's Node runtime), so a workspace only supplies slides, themes, assets, and its config — no install needed unless its slides import packages of their own. It shows Home and each deck in their own tab, and ships the Claude Code and Codex SDKs. Their native CLIs are not bundled: one already on PATH is used, and otherwise the first sign-in downloads the build the SDK pins from npm into the app's user data.

```bash
pnpm dev:desktop      # from the repo root: builds the CLI, then starts electron-vite
pnpm --filter desktop package   # unpacked app in apps/desktop/release
pnpm --filter desktop dist      # installers
```

- `src/main` — window, tabs (one `WebContentsView` each), dev server supervisor, workspace init/install, skills sync, agent sign-in.
- `src/preload/view.ts` — the `window.openSlideDesktop` bridge core reads in `packages/core/src/app/lib/desktop.ts`.
- `src/renderer` — tab strip, welcome, and settings, built from core's own UI primitives and tokens.
- First launch plays a full-screen intro in its own clear window over the display, which folds into the main window, then a three-step tour. **Help → Welcome to open-slide** replays both.

The bundled core keeps its Vite cache under the app's user data, syncs its built-in skills into a workspace once per app version, and hides the in-app core update — updating the app updates core.

## Telemetry

Packaged builds send anonymous usage events and crash reports to PostHog from the main process (`src/main/telemetry.ts`); renderers forward their errors over IPC. Settings → Privacy turns it off, and `OPEN_SLIDE_TELEMETRY=0` or `DO_NOT_TRACK=1` disables it outright. Unpackaged runs send nothing unless `OPEN_SLIDE_TELEMETRY=1`.

- `MAIN_VITE_POSTHOG_TOKEN` — the desktop project's token, read at build time (env or `apps/desktop/.env.local`). Without it telemetry is compiled out to no-ops.
- `POSTHOG_CLI_API_KEY`, `POSTHOG_CLI_PROJECT_ID` — when set, `pnpm --filter desktop dist` uploads source maps after building and deletes them before packaging.

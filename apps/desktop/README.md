# open-slide desktop

Electron shell around `@open-slide/core`. Each workspace runs on the core the app ships, served by its dev server on Electron's Node runtime, so a workspace only supplies slides, themes, assets, and config; it needs an install only when its slides import packages of their own. Home and each deck get their own tab.

The Claude Code and Codex SDKs ship with the app, but their native CLIs do not: one on PATH wins, otherwise the first sign-in downloads the build the SDK pins into the app's user data.

```bash
pnpm dev:desktop                # from the repo root: builds core and cli, then starts the app
pnpm --filter desktop package   # unpacked app in apps/desktop/release
pnpm --filter desktop dist      # installers
```

- `src/main`: window, tabs (one `WebContentsView` each), dev server supervisor, workspace init/install, skills sync, agent sign-in, telemetry.
- `src/preload/view.ts`: the `window.openSlideDesktop` bridge read by `packages/core/src/app/lib/desktop.ts`.
- `src/renderer`: tab strip, welcome, and settings, built from core's UI primitives and tokens.
- Closing or reloading a tab, switching workspaces, and quitting first ask each tab to save or discard unsaved work (`src/main/unsaved.ts`).
- First launch plays a full-screen intro, then a short tour. **Help → Welcome to open-slide** replays both.
- Core's Vite cache lives under the app's user data, built-in skills sync into a workspace once per app version, and core's in-app update is hidden: updating the app updates core.
- Opening a workspace runs its code. A workspace the app just created is trusted; any other folder is confirmed once with a native prompt and remembered in `settings.json`.

## Telemetry

Packaged builds send anonymous usage events and crash reports to PostHog from the main process (`src/main/telemetry.ts`). Nothing is sent before the first-run tour ends, Settings → Privacy turns it off (dropping anything unsent), and `OPEN_SLIDE_TELEMETRY=0` or `DO_NOT_TRACK=1` disables it outright. Unpackaged runs send nothing unless `OPEN_SLIDE_TELEMETRY=1`.

- `MAIN_VITE_POSTHOG_TOKEN`: the project token, read at build time (env or `apps/desktop/.env.local`). Without it, telemetry is off.
- `POSTHOG_CLI_API_KEY`, `POSTHOG_CLI_PROJECT_ID`: when set, `pnpm --filter desktop dist` uploads source maps and deletes them before packaging.

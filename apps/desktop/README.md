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
- Core's Vite cache lives under the app's user data, built-in skills sync into a workspace once per bundled core version, and core's in-app update is hidden: updating the app updates core.
- Opening a workspace runs its code. A workspace the app just created is trusted; any other folder is confirmed once with a native prompt and remembered in `settings.json`.

## Updates and releases

The app has its own version in `package.json`, independent of `@open-slide/core`, and is versioned by changesets like the packages (`pnpm changeset`, pick `desktop`). Merging the release PR that bumps it runs `.github/workflows/desktop.yml`, which builds every platform and publishes a `desktop-v<version>` GitHub release. The same workflow builds pull requests that touch the app, so their installers can be downloaded from the run.

Installed apps check for updates on launch and every few hours with `electron-updater`, download in the background, and install on restart (**Restart to update** in the tab bar, Settings → About, or the app menu). The feed is the `latest*.yml` files on the `desktop-latest` release, which `scripts/release.mjs` points at the newest version's assets. It is a separate release because core's releases take GitHub's "latest" slot. Development builds never check; `OPEN_SLIDE_UPDATES=0` turns checks off in a packaged build.

macOS installs updates only into an app signed with a Developer ID. Release builds sign and notarize when these repository secrets are set; without them the macOS builds are unsigned and can't update themselves:

- `CSC_LINK`, `CSC_KEY_PASSWORD`: the Developer ID Application certificate as a base64 `.p12`, and its password.
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`: notarization.
- `MAIN_VITE_POSTHOG_TOKEN`, `POSTHOG_CLI_API_KEY`, `POSTHOG_CLI_PROJECT_ID`: telemetry and source maps, as below.

## Telemetry

Packaged builds send anonymous usage events and crash reports to PostHog from the main process (`src/main/telemetry.ts`). Nothing is sent before the first-run tour ends, Settings → Privacy turns it off (dropping anything unsent), and `OPEN_SLIDE_TELEMETRY=0` or `DO_NOT_TRACK=1` disables it outright. Unpackaged runs send nothing unless `OPEN_SLIDE_TELEMETRY=1`.

- `MAIN_VITE_POSTHOG_TOKEN`: the project token, read at build time (env or `apps/desktop/.env.local`). Without it, telemetry is off.
- `POSTHOG_CLI_API_KEY`, `POSTHOG_CLI_PROJECT_ID`: when set, `pnpm --filter desktop dist` uploads source maps and deletes them before packaging.

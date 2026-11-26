# Contributing to open-slide

Thanks for your interest in improving open-slide! This guide covers the workflow for contributing to the framework itself — the `@open-slide/core` runtime, the `@open-slide/cli` scaffolder, and the supporting apps.

If you're authoring slides inside a scaffolded project, you don't need this file — drive your deck through your coding agent or edit `slides/<id>/index.tsx` directly.

## Ways to contribute

- **Report a bug** via the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.yml). Include a minimal reproduction.
- **Propose a feature** via the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.yml). Describe the problem before the solution.
- **Ask a question or share what you're building** in [GitHub Discussions](https://github.com/open-slide/open-slide/discussions).
- **Send a pull request** — see below.

## What we accept

Review time is the scarcest resource on this project, so we're picky about what we take in.

**Open a PR directly for:**

- Bug fixes, including crashes, regressions, and real performance problems.
- Small, focused polish: typos, docs fixes, missing translations, an obviously wrong style.
- Tests for behavior that already exists.

**Open an issue or discussion first, and wait for a maintainer to agree, before working on:**

- New features or new public API in `@open-slide/core` or `@open-slide/cli`.
- UI redesigns or changes to how an existing workflow behaves.
- New dependencies.
- Refactors, renames, or moves that don't fix a bug.

A PR in the second group without a linked, agreed-upon issue will most likely be closed, however good the code is. Link the issue or discussion where a maintainer said yes.

**One problem per PR.** Include everything that fix needs — code, tests, docs, changeset — and nothing else. Drive-by cleanups and a second fix belong in their own PRs. If a PR grows past `size:L` (see [PR size labels](#pr-size-labels)), consider whether it can be split.

## Repo layout

pnpm + Turbo monorepo.

| Path | Package | Role |
| --- | --- | --- |
| [`packages/core`](packages/core) | `@open-slide/core` | Runtime (viewer, present mode, inspector), Vite plugin, `open-slide` dev/build CLI. |
| [`packages/cli`](packages/cli) | `@open-slide/cli` | `npx @open-slide/cli init` scaffolder + project template. |
| [`apps/demo`](apps/demo) | private | Local consumer of `@open-slide/core` via `workspace:*`. The dogfood target for the framework. |
| [`apps/web`](apps/web) | private | Marketing site (Next.js). |

## Prerequisites

- **Node.js 22+** (matches CI).
- **pnpm 10.17.0+** — `corepack enable` will pick up the version pinned in `package.json`.
- A Unix-y shell. Windows works via WSL.

## Getting set up

```bash
git clone https://github.com/open-slide/open-slide.git
cd open-slide
pnpm install
```

Then run the demo against the local `@open-slide/core`:

```bash
pnpm dev
```

`apps/demo` is the fastest way to exercise framework changes — edit `packages/core`, the demo hot-reloads.

## Useful scripts

```bash
pnpm dev          # turbo: runs demo against local core
pnpm build        # build all packages
pnpm typecheck    # tsc across the graph
pnpm check        # biome (format + lint + organize imports)
pnpm check:fix    # auto-fix what biome can
pnpm test         # vitest
```

Filter to one package:

```bash
pnpm core <script>   # e.g. pnpm core build
pnpm cli <script>
```

## Pull request workflow

1. **Fork & branch.** Branch off `main`. Keep branches focused — [one problem per PR](#what-we-accept).
2. **Make your change.** Match the surrounding style. Don't reformat unrelated code.
3. **Run the checks before pushing:**
   ```bash
   pnpm check       # must pass — CI enforces it
   pnpm typecheck
   pnpm test
   ```
   `pnpm check:fix` will auto-fix most formatting and lint issues.
4. **Add a changeset if you touched `packages/core` or `packages/cli`:**
   ```bash
   pnpm changeset
   ```
   Pick the affected package(s) and the right bump:
   - `patch` — bug fixes, internal refactors, polish.
   - `minor` — new public API, additive features.
   - `major` — breaking changes.

   Apps (`apps/demo`, `apps/web`) and root tooling do **not** need a changeset.

   Keep the description **short and direct** — one line, present-tense, what changed from a user's perspective. Match the tone of existing `.changeset/*.md` files. No paragraphs, no rationale, no "this PR…".

   > Good: `Replace spinner with a hairline + sliding bar for slide and presenter loading states.`
   >
   > Bad: `This change introduces a new loading indicator because the previous spinner felt heavy…`

   Don't bump versions or edit `CHANGELOG.md` by hand — `changeset version` owns that.
5. **Open the PR.** Use a [conventional commit](https://www.conventionalcommits.org/) title, such as `fix(core): keep speaker notes when duplicating a slide`. Fill in the PR template: the problem, the change, the linked issue, and how you verified it.
6. **Address review feedback** by pushing follow-up commits. We'll squash on merge.

### Show that it works

Every PR needs a **Verification** section that says what you did and what you saw. "CI passes" or "tests pass" on its own isn't verification — CI already tells us that.

- **Bug fixes:** how to reproduce the bug, and what happens before and after your change. A test that fails without the fix is the best evidence.
- **UI changes:** before and after screenshots. Add a short clip when the change is about motion, timing, or interaction.
- **Runtime changes:** what you exercised in `apps/demo` (which deck, which mode — editor, present, inspector).
- **Anything you couldn't check:** say so, e.g. "not tested on Windows".

Upload screenshots and clips to the PR description. Don't commit them to the repo.

### PR size labels

A bot labels every PR from `size:XS` to `size:XL` by changed lines. Tests, lockfiles, changesets, and generated files don't count, so adding tests never makes a PR look bigger. The label is a hint for reviewers, not a gate — but smaller PRs get reviewed sooner.

| Label | Changed lines |
| --- | --- |
| `size:XS` | 0–9 |
| `size:S` | 10–49 |
| `size:M` | 50–199 |
| `size:L` | 200–499 |
| `size:XL` | 500+ |

## Style & conventions

- **Biome must pass.** Formatting, lint, and import organisation are all enforced by `pnpm check`.
- **No casual dependencies.** The `core` runtime ships to users — every dep inflates install size. Prefer a small piece of inline code over a new package.
- **Default to writing no comments.** Only add one when the *why* is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug. Don't explain *what* the code does; well-named identifiers handle that.
- **Leave `packages/core/src/app/components/ui` alone.** It's shadcn-generated and biome-ignored unless you're regenerating it.

## Testing

- Unit tests run via `pnpm test` (Vitest). Add tests next to the code (`*.test.ts`) when fixing a bug or adding logic that warrants it.
- For runtime/UI changes, please verify the change in `apps/demo` and describe what you exercised in the PR.

## Releases

Releases are cut by the maintainer via `pnpm release`, which builds `@open-slide/core` + `@open-slide/cli` and runs `changeset publish`. Contributors don't need to publish anything — just land the changeset alongside your code.

## Questions

Open a [discussion](https://github.com/open-slide/open-slide/discussions) — happy to help.

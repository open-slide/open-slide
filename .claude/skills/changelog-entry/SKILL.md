---
name: changelog-entry
description: Write the hand-curated entries for open-slide's /changelog page (apps/web/lib/changelog.ts) from new @open-slide/core releases — turn CHANGELOG.md line items into a titled entry with a summary, highlights, patch notes, contributor credits, docs links, and a framed screenshot when the release earns one. Use this whenever a new version of @open-slide/core is released or about to be (a "chore: release packages" PR), when apps/web/lib/changelog.test.ts fails with "Missing from apps/web/lib/changelog.ts", or when the user asks to update, add to, or fix the changelog page — even if they only say "update the changelog".
---

# Changelog entries

`/changelog` on the landing site is written by hand on purpose. It is not a
list of PR titles. Each minor version line (2.3, 2.2, …) is one entry with a
human title and summary, and patch releases fold into it. The raw line items
live in `packages/core/CHANGELOG.md`, written by Changesets. This skill turns
those into page copy.

- Data: `apps/web/lib/changelog.ts` (types `Era`, `Release`, `Patch`, `Shot`).
- Rendering: `apps/web/components/changelog/timeline.tsx`. You shouldn't need
  to touch it.
- Guard: `apps/web/lib/changelog.test.ts` (runs in `pnpm test:changelog`, its own CI job). It fails when
  a stable core version in `CHANGELOG.md` is missing from the page, when the
  page lists a version that was never published, or when the latest page
  version doesn't match `packages/core/package.json`.
- The release count and latest version on the page are computed. Don't
  hard-code numbers.

## When to run it

Changesets opens `chore: release packages` (branch `changeset-release/main`),
which bumps `packages/core/package.json` and prepends to `CHANGELOG.md`.
GitHub Actions does not run on that bot PR, so nothing fails there. If it
merges without a page entry, the test fails on `main` and on every PR after
it, until the entry lands.

Preferred: add the entry as the **last commit on the release PR, right before
merging it**. The Changesets action force-pushes that branch whenever another
PR merges to `main`, which would drop an earlier commit. If the release has
already merged, open a follow-up PR to `main` instead. Before merging, check
the release PR's `CHANGELOG.md` diff: it is the source of truth for what
shipped.

## Steps

1. **Find what's missing.** Run `pnpm test:changelog`. The
   failure lists the versions. Read their sections in
   `packages/core/CHANGELOG.md`, and the same-date sections of
   `packages/cli/CHANGELOG.md`: CLI changes fold into the core entry they
   shipped with.

2. **Place each version.**
   - **Patch** (`x.y.z`, z > 0): add a `Patch` to the `patches` array of the
     `x.y` entry, in version order.
   - **Minor** (`x.y.0`): add a new `Release` at the top of the current era's
     `releases`, with `line: 'x.y'`.
   - **Major** (`x.0.0`): add a new `Era` at the top of `eras` (`id: 'vX'`,
     `label`, `title: 'open-slide X'`, a one-line `blurb`, `span`), with a
     `kind: 'major'` release as its first entry. If the major shipped through
     betas, fold them into its summary or a callout. Prereleases never get
     their own line.
   - Extend the era's `span` when a release lands in a new month
     (`'Sep – Oct 2026'` → `'Sep – Nov 2026'`).
   - `date` is the release date (`YYYY-MM-DD`). On a release PR that's the
     day you merge it. For a version already on `main`, take the date of its
     `chore: release packages` commit.

3. **Write the copy.** Read two or three neighbouring entries first and
   match them.
   - **Title**: what a user can now do, in a few words, sentence case, no
     trailing period. "Comment mode", "Press ⌘K", "Switch decks without
     leaving the stage". Never a PR title or a component name.
   - **Summary** (feature and major releases): one to three sentences,
     present tense, about what changes for the person using open-slide.
     Lead with the headline change. Polish releases can skip the summary and
     go straight to highlights.
   - **Highlights**: one sentence each, user-facing, most important first.
     Merge related line items. Leave out internal refactors, dependency
     bumps, test infrastructure, and repo housekeeping unless a user would
     notice them.
   - **Patches**: one sentence per patch version describing the fix from the
     user's side. Combine several fixes into one sentence.
   - **kind**: `'feature'` when there is a new user-visible capability,
     `'polish'` for improvements and fixes only, `'major'` for x.0.0.
   - **Formatting**: backticks are the only markup the renderer supports, for
     code, file names, flags, and keys like `C`. No bold, links, or emoji in
     copy. Use curly quotes and apostrophes (’ “ ”) like the rest of the
     file, and spell "colour" the way the existing copy does.
   - **contributors**: GitHub handles from the "Thanks [@handle]" credits in
     those CHANGELOG sections, deduplicated, excluding the maintainer
     (`1weiho`).
   - **docs**: link the matching docs page when one exists
     (`{ label: 'Comments docs', href: '/docs/core-feature/inspector#comments' }`).
     Use `callout` only for something a reader must act on, like a migration
     guide.

4. **Add a screenshot when the release earns one.** Majors and releases that
   add a new panel, mode, dialog, or view get a picture. Fixes and polish
   releases don't. Use the `ui-screenshots` skill to shoot it in the house
   style, save it to `apps/web/public/assets/changelog/<name>.webp`, and add
   `shot: shot('<name>', <output height>, '<alt text>')`. The script prints
   the height (outputs are 2000px wide). Write alt text about what is shown.

5. **Verify.**
   ```bash
   pnpm test:changelog
   pnpm --filter web typecheck
   pnpm check
   ```
   To see the result, use the `ui-screenshots` skill's `preview-web.mjs`
   with `--route /changelog`. No dev server needed.

## Example

`CHANGELOG.md` gains:

```md
## 2.4.0
### Minor Changes
- [#590] … Thanks [@someone]! - Add a slide sorter view with drag-to-reorder across sections.
### Patch Changes
- [#588] … - Keep the presenter timer running after a hot reload.
```

Becomes, at the top of the v2 era:

```ts
{
  line: '2.4',
  version: '2.4.0',
  date: '2026-11-02',
  kind: 'feature',
  title: 'Reorder a whole deck at once',
  summary:
    'A slide sorter lays every page out in sections, and you drag pages between them to restructure a deck without touching the code.',
  highlights: ['The presenter timer keeps running through a hot reload.'],
  shot: shot('slide-sorter', 1210, 'The slide sorter with pages grouped into three sections'),
  contributors: ['someone'],
},
```

import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseSource } from '../editing/babel-walk.ts';
import {
  countDefaultExportPages,
  createBlankSlideDir,
  duplicateNotesElementInSource,
  duplicatePageInDefaultExportInSource,
  readMetaTitleInSource,
  removeNotesElementInSource,
  removePageFromDefaultExportInSource,
  renameSlideDir,
  reorderDefaultExportPagesInSource,
  reorderNotesArrayInSource,
  resolveSlideEntry,
  rmSlideDir,
  SLIDE_ID_RE,
  slugifyTitle,
  updateMetaTitleInSource,
  validateSlideName,
} from '../editing/slide-ops.ts';
import {
  ASSET_MAX_BYTES,
  GLOBAL_SCOPE,
  resolveScopedAssetFile,
  resolveScopedAssetsDir,
} from '../files/assets.ts';
import { foldersManifestPath, readManifest, writeManifest } from '../files/folders.ts';
import { parseFrontmatter } from '../vite/themes-plugin.ts';
import { screenshotPreview } from './preview.ts';
import { type Tool, ToolError } from './protocol.ts';

export type McpProject = {
  userCwd: string;
  slidesRoot: string;
  themesRoot: string;
  globalAssetsRoot: string;
  builtinSkillsDir: string;
};

const GUIDES = ['slide-authoring', 'create-slide', 'apply-comments', 'create-theme'] as const;
const GUIDE_REFERENCES = [
  'assets',
  'design-system',
  'morph',
  'page-numbers',
  'steps',
  'transitions',
  'webfonts',
] as const;
const GUIDE_NAMES = [...GUIDES, ...GUIDE_REFERENCES.map((r) => `slide-authoring/${r}`)];

const THEME_ID_RE = /^[a-z0-9_-]+$/i;

function str(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || v.length === 0) throw new ToolError(`\`${key}\` must be a string.`);
  return v;
}

function optStr(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new ToolError(`\`${key}\` must be a string.`);
  return v;
}

function int(args: Record<string, unknown>, key: string): number {
  const v = args[key];
  if (!Number.isInteger(v) || (v as number) < 0) {
    throw new ToolError(`\`${key}\` must be a non-negative integer.`);
  }
  return v as number;
}

const relPath = (project: McpProject, file: string) =>
  path.relative(project.userCwd, file).split(path.sep).join('/');

function deckEntry(project: McpProject, args: Record<string, unknown>): string {
  const slideId = str(args, 'slideId');
  const entry = SLIDE_ID_RE.test(slideId) ? resolveSlideEntry(project.slidesRoot, slideId) : null;
  if (!entry) throw new ToolError(`Invalid slideId "${slideId}".`);
  return entry;
}

async function readDeckSource(project: McpProject, args: Record<string, unknown>) {
  const file = deckEntry(project, args);
  try {
    return { file, source: await fs.readFile(file, 'utf8') };
  } catch {
    throw new ToolError(
      `Deck "${String(args.slideId)}" not found. Call list_decks for the available ids.`,
    );
  }
}

function assertParses(source: string): void {
  if (!parseSource(source)) {
    throw new ToolError(
      'The source does not parse as TSX, so nothing was written. Fix the syntax and try again.',
    );
  }
}

async function devServerUrl(project: McpProject): Promise<string | null> {
  try {
    const raw = await fs.readFile(
      path.join(project.userCwd, 'node_modules', '.open-slide', 'server.json'),
      'utf8',
    );
    const info = JSON.parse(raw) as { url?: unknown; pid?: unknown };
    if (typeof info.url !== 'string') return null;
    if (typeof info.pid === 'number') {
      try {
        process.kill(info.pid, 0);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ESRCH') return null;
      }
    }
    return info.url;
  } catch {
    return null;
  }
}

async function previewLine(project: McpProject, slideId: string): Promise<string> {
  const url = await devServerUrl(project);
  return url
    ? `Preview: ${url}s/${slideId}`
    : 'The dev server is not running; start it with `open-slide dev` to preview.';
}

function summarizeDeck(slideId: string, source: string) {
  const title = readMetaTitleInSource(source);
  return {
    slideId,
    title: title.kind === 'found' ? title.title : null,
    pages: countDefaultExportPages(source),
  };
}

async function readGuide(project: McpProject, name: string): Promise<string> {
  if (!GUIDE_NAMES.includes(name)) {
    throw new ToolError(`Unknown guide "${name}". Available: ${GUIDE_NAMES.join(', ')}.`);
  }
  const [skill, ref] = name.split('/');
  const rel = ref ? path.join(skill, 'references', `${ref}.md`) : path.join(skill, 'SKILL.md');
  // A workspace may have edited its synced copy; that copy wins over the bundled one.
  for (const root of [path.join(project.userCwd, '.agents', 'skills'), project.builtinSkillsDir]) {
    try {
      return await fs.readFile(path.join(root, rel), 'utf8');
    } catch {}
  }
  throw new ToolError(`Guide "${name}" is missing from this install.`);
}

async function listDecks(project: McpProject) {
  let entries: string[];
  try {
    entries = await fs.readdir(project.slidesRoot);
  } catch {
    return [];
  }
  const decks = [];
  for (const id of entries.sort()) {
    if (!SLIDE_ID_RE.test(id)) continue;
    let source: string;
    try {
      source = await fs.readFile(path.join(project.slidesRoot, id, 'index.tsx'), 'utf8');
    } catch {
      continue;
    }
    decks.push(summarizeDeck(id, source));
  }
  return decks;
}

async function listThemes(project: McpProject) {
  let entries: string[];
  try {
    entries = await fs.readdir(project.themesRoot);
  } catch {
    return [];
  }
  const themes = [];
  for (const file of entries.sort()) {
    if (!file.endsWith('.md')) continue;
    const id = file.slice(0, -3);
    const raw = await fs.readFile(path.join(project.themesRoot, file), 'utf8');
    const { fm } = parseFrontmatter(raw, id);
    themes.push({ id, name: fm.name, description: fm.description });
  }
  return themes;
}

async function readAssetBytes(args: Record<string, unknown>): Promise<Buffer> {
  const sourcePath = optStr(args, 'sourcePath');
  const base64 = optStr(args, 'base64');
  if (Boolean(sourcePath) === Boolean(base64)) {
    throw new ToolError('Pass exactly one of `sourcePath` or `base64`.');
  }
  if (sourcePath) {
    if (!path.isAbsolute(sourcePath)) throw new ToolError('`sourcePath` must be absolute.');
    const stat = await fs.stat(sourcePath).catch(() => null);
    if (!stat?.isFile()) throw new ToolError(`No file at ${sourcePath}.`);
    if (stat.size > ASSET_MAX_BYTES) throw new ToolError('Assets are limited to 25 MB.');
    return fs.readFile(sourcePath);
  }
  const bytes = Buffer.from(base64 as string, 'base64');
  if (bytes.length === 0) throw new ToolError('`base64` decoded to an empty file.');
  if (bytes.length > ASSET_MAX_BYTES) throw new ToolError('Assets are limited to 25 MB.');
  return bytes;
}

const slideIdProp = {
  type: 'string',
  description: 'Deck id: the folder name under slides/, as returned by list_decks.',
};
const scopeProp = {
  type: 'string',
  description: `A deck id for slides/<id>/assets/, or "${GLOBAL_SCOPE}" for the project-wide assets/ folder.`,
};
const json = (value: unknown) => JSON.stringify(value, null, 2);

export function buildTools(project: McpProject): Tool[] {
  return [
    {
      name: 'read_guide',
      description:
        'Read an open-slide authoring guide. Read "slide-authoring" before writing or editing any deck, and "create-slide" before drafting a new one. The guides were written for coding agents with file access: use this server\'s tools wherever they say to read or write files.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', enum: GUIDE_NAMES } },
        required: ['name'],
      },
      annotations: { readOnlyHint: true },
      handler: (args) => readGuide(project, str(args, 'name')),
    },
    {
      name: 'list_themes',
      description: 'List the themes in themes/ that a deck can follow.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      handler: async () => json(await listThemes(project)),
    },
    {
      name: 'read_theme',
      description:
        "Read a theme's guide (themes/<id>.md) and its demo deck source, to match its palette, type and components.",
      inputSchema: {
        type: 'object',
        properties: { themeId: { type: 'string' } },
        required: ['themeId'],
      },
      annotations: { readOnlyHint: true },
      handler: async (args) => {
        const themeId = str(args, 'themeId');
        if (!THEME_ID_RE.test(themeId)) throw new ToolError(`Invalid themeId "${themeId}".`);
        let md: string;
        try {
          md = await fs.readFile(path.join(project.themesRoot, `${themeId}.md`), 'utf8');
        } catch {
          throw new ToolError(`Theme "${themeId}" not found. Call list_themes.`);
        }
        const demo = await fs
          .readFile(path.join(project.themesRoot, `${themeId}.demo.tsx`), 'utf8')
          .catch(() => null);
        return demo
          ? `${md}\n\n## Demo deck (${themeId}.demo.tsx)\n\n\`\`\`tsx\n${demo}\n\`\`\``
          : md;
      },
    },
    {
      name: 'list_decks',
      description: 'List the decks in this open-slide project with their titles and page counts.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      handler: async () => {
        const decks = await listDecks(project);
        const url = await devServerUrl(project);
        return json({ devServer: url, decks });
      },
    },
    {
      name: 'read_deck',
      description:
        "Read a deck's source (slides/<id>/index.tsx). The default export is the array of pages, in order.",
      inputSchema: {
        type: 'object',
        properties: { slideId: slideIdProp },
        required: ['slideId'],
      },
      annotations: { readOnlyHint: true },
      handler: async (args) => {
        const { file, source } = await readDeckSource(project, args);
        return `// ${relPath(project, file)}\n${source}`;
      },
    },
    {
      name: 'create_deck',
      description:
        'Create a new deck folder under slides/. Without `source` it starts as one blank page. To let the user follow along in the browser, pass a source with the imports, meta, design and the cover page only, then add each remaining page with edit_deck.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Deck title, written to meta.title.' },
          slug: {
            type: 'string',
            description:
              'Short kebab-case English folder name. Defaults to one derived from the title.',
          },
          source: {
            type: 'string',
            description: 'Full index.tsx source. It must parse as TSX.',
          },
        },
      },
      handler: async (args) => {
        const title = optStr(args, 'title');
        const source = optStr(args, 'source');
        if (title !== undefined && !validateSlideName(title)) {
          throw new ToolError('`title` must be 1 to 80 characters.');
        }
        if (source !== undefined) assertParses(source);
        const slug = slugifyTitle(optStr(args, 'slug') ?? title ?? '');

        const created = await createBlankSlideDir(project.slidesRoot);
        if (!created.ok) throw new ToolError(created.error);
        let slideId = created.slideId;
        if (slug && slug !== slideId) {
          const renamed = await renameSlideDir(project.slidesRoot, slideId, slug);
          if (renamed.ok) slideId = renamed.slideId;
        }
        const file = resolveSlideEntry(project.slidesRoot, slideId) as string;
        let next = source ?? (await fs.readFile(file, 'utf8'));
        if (title) next = updateMetaTitleInSource(next, title) ?? next;
        await fs.writeFile(file, next, 'utf8');
        return [
          `Created ${relPath(project, file)} (slideId "${slideId}").`,
          await previewLine(project, slideId),
        ].join('\n');
      },
    },
    {
      name: 'write_deck',
      description:
        "Replace a deck's whole index.tsx. Prefer edit_deck for changes to part of a deck. The source must parse as TSX.",
      inputSchema: {
        type: 'object',
        properties: { slideId: slideIdProp, source: { type: 'string' } },
        required: ['slideId', 'source'],
      },
      annotations: { destructiveHint: true, idempotentHint: true },
      handler: async (args) => {
        const { file } = await readDeckSource(project, args);
        const source = str(args, 'source');
        assertParses(source);
        await fs.writeFile(file, source, 'utf8');
        return `Wrote ${relPath(project, file)}.`;
      },
    },
    {
      name: 'edit_deck',
      description:
        "Replace an exact snippet of a deck's source with new text, for adding a page or changing one. `oldString` must appear exactly once unless `replaceAll` is true. The result must still parse as TSX.",
      inputSchema: {
        type: 'object',
        properties: {
          slideId: slideIdProp,
          oldString: { type: 'string' },
          newString: { type: 'string' },
          replaceAll: { type: 'boolean' },
        },
        required: ['slideId', 'oldString', 'newString'],
      },
      handler: async (args) => {
        const { file, source } = await readDeckSource(project, args);
        const oldString = str(args, 'oldString');
        const newString = typeof args.newString === 'string' ? args.newString : null;
        if (newString === null) throw new ToolError('`newString` must be a string.');
        const count = source.split(oldString).length - 1;
        if (count === 0) throw new ToolError('`oldString` was not found. Call read_deck first.');
        if (count > 1 && args.replaceAll !== true) {
          throw new ToolError(
            `\`oldString\` appears ${count} times. Add surrounding context or set replaceAll.`,
          );
        }
        const next =
          args.replaceAll === true
            ? source.split(oldString).join(newString)
            : source.replace(oldString, () => newString);
        assertParses(next);
        await fs.writeFile(file, next, 'utf8');
        return `Edited ${relPath(project, file)} (${count} replacement${count === 1 ? '' : 's'}).`;
      },
    },
    {
      name: 'set_deck_title',
      description: "Set a deck's meta.title.",
      inputSchema: {
        type: 'object',
        properties: { slideId: slideIdProp, title: { type: 'string' } },
        required: ['slideId', 'title'],
      },
      annotations: { idempotentHint: true },
      handler: async (args) => {
        const { file, source } = await readDeckSource(project, args);
        const title = validateSlideName(args.title);
        if (!title) throw new ToolError('`title` must be 1 to 80 characters.');
        const next = updateMetaTitleInSource(source, title);
        if (next === null) throw new ToolError('Could not find a safe place to write meta.title.');
        if (next !== source) await fs.writeFile(file, next, 'utf8');
        return `Title set to "${title}".`;
      },
    },
    {
      name: 'reorder_pages',
      description:
        "Reorder a deck's pages. `order[i]` is the current 0-based index of the page that moves to position i. Speaker notes move with their pages.",
      inputSchema: {
        type: 'object',
        properties: {
          slideId: slideIdProp,
          order: { type: 'array', items: { type: 'integer', minimum: 0 } },
        },
        required: ['slideId', 'order'],
      },
      handler: async (args) => {
        const { file, source } = await readDeckSource(project, args);
        const order = args.order;
        if (!Array.isArray(order) || !order.every((n) => Number.isInteger(n))) {
          throw new ToolError('`order` must be an array of integers.');
        }
        const reordered = reorderDefaultExportPagesInSource(source, order as number[]);
        if (reordered === null) {
          throw new ToolError(
            '`order` must be a permutation of the current page indexes, and the default export must be an array literal.',
          );
        }
        const next = reorderNotesArrayInSource(reordered, order as number[]);
        if (next === null) throw new ToolError('The `notes` export has an unexpected shape.');
        if (next !== source) await fs.writeFile(file, next, 'utf8');
        return 'Pages reordered.';
      },
    },
    {
      name: 'duplicate_page',
      description: 'Duplicate a page (0-based index) in place, with its speaker notes.',
      inputSchema: {
        type: 'object',
        properties: { slideId: slideIdProp, index: { type: 'integer', minimum: 0 } },
        required: ['slideId', 'index'],
      },
      handler: async (args) => {
        const { file, source } = await readDeckSource(project, args);
        const index = int(args, 'index');
        const dup = duplicatePageInDefaultExportInSource(source, index);
        const next = dup === null ? null : duplicateNotesElementInSource(dup, index);
        if (next === null) throw new ToolError('Index out of range or unexpected deck shape.');
        await fs.writeFile(file, next, 'utf8');
        return `Page ${index} duplicated.`;
      },
    },
    {
      name: 'delete_page',
      description: 'Remove a page (0-based index) and its speaker notes from a deck.',
      inputSchema: {
        type: 'object',
        properties: { slideId: slideIdProp, index: { type: 'integer', minimum: 0 } },
        required: ['slideId', 'index'],
      },
      annotations: { destructiveHint: true },
      handler: async (args) => {
        const { file, source } = await readDeckSource(project, args);
        const index = int(args, 'index');
        const removed = removePageFromDefaultExportInSource(source, index);
        const next = removed === null ? null : removeNotesElementInSource(removed, index);
        if (next === null) throw new ToolError('Index out of range or unexpected deck shape.');
        await fs.writeFile(file, next, 'utf8');
        return `Page ${index} deleted.`;
      },
    },
    {
      name: 'delete_deck',
      description: 'Delete a deck folder and everything in it. This cannot be undone.',
      inputSchema: {
        type: 'object',
        properties: { slideId: slideIdProp },
        required: ['slideId'],
      },
      annotations: { destructiveHint: true },
      handler: async (args) => {
        await readDeckSource(project, args);
        const slideId = str(args, 'slideId');
        if (!(await rmSlideDir(project.slidesRoot, slideId))) {
          throw new ToolError(`Could not delete "${slideId}".`);
        }
        const manifestPath = foldersManifestPath(project.slidesRoot);
        if (existsSync(manifestPath)) {
          const manifest = await readManifest(manifestPath);
          if (manifest.assignments[slideId]) {
            delete manifest.assignments[slideId];
            await writeManifest(manifestPath, manifest);
          }
        }
        return `Deleted slides/${slideId}.`;
      },
    },
    {
      name: 'list_assets',
      description: 'List the asset files of a deck or of the project-wide assets/ folder.',
      inputSchema: {
        type: 'object',
        properties: { scope: scopeProp },
        required: ['scope'],
      },
      annotations: { readOnlyHint: true },
      handler: async (args) => {
        const scope = str(args, 'scope');
        const dir = resolveScopedAssetsDir(project.slidesRoot, project.globalAssetsRoot, scope);
        if (!dir) throw new ToolError(`Invalid scope "${scope}".`);
        const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
        return json(
          entries
            .filter((e) => e.isFile() && !e.name.startsWith('.'))
            .map((e) => e.name)
            .sort(),
        );
      },
    },
    {
      name: 'add_asset',
      description: `Add an image, video or font to a deck's assets/ folder (import it as './assets/<filename>') or to the project-wide assets/ folder with scope "${GLOBAL_SCOPE}" (import it as '@assets/<filename>'). Pass a local file path or base64 bytes.`,
      inputSchema: {
        type: 'object',
        properties: {
          scope: scopeProp,
          filename: { type: 'string', description: 'File name with an extension, e.g. hero.png.' },
          sourcePath: { type: 'string', description: 'Absolute path of a local file to copy.' },
          base64: { type: 'string', description: 'The file bytes, base64 encoded.' },
          overwrite: { type: 'boolean' },
        },
        required: ['scope', 'filename'],
      },
      handler: async (args) => {
        const scope = str(args, 'scope');
        const filename = str(args, 'filename');
        if (scope !== GLOBAL_SCOPE) await readDeckSource(project, { slideId: scope });
        const file = resolveScopedAssetFile(
          project.slidesRoot,
          project.globalAssetsRoot,
          scope,
          filename,
        );
        if (!file) throw new ToolError(`Invalid scope or filename.`);
        if (existsSync(file) && args.overwrite !== true) {
          throw new ToolError(`${filename} already exists. Set overwrite to replace it.`);
        }
        const bytes = await readAssetBytes(args);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, bytes);
        const importPath = scope === GLOBAL_SCOPE ? `@assets/${filename}` : `./assets/${filename}`;
        return `Saved ${relPath(project, file)}. Import it with: import asset from '${importPath}';`;
      },
    },
    {
      name: 'preview_page',
      description:
        'Render one page of a deck in the running dev server and return a screenshot, so you can check the layout after writing it. Needs `open-slide dev` running and Playwright on the machine; otherwise it returns the preview URL.',
      inputSchema: {
        type: 'object',
        properties: {
          slideId: slideIdProp,
          page: { type: 'integer', minimum: 1, description: '1-based page number.' },
          step: {
            type: 'integer',
            minimum: 0,
            description: 'Show only the first n <Step>s of a stepped page. Defaults to all.',
          },
        },
        required: ['slideId', 'page'],
      },
      annotations: { readOnlyHint: true },
      handler: async (args) => {
        await readDeckSource(project, args);
        const slideId = str(args, 'slideId');
        const page = int(args, 'page');
        const base = await devServerUrl(project);
        if (!base) {
          throw new ToolError(
            'The dev server is not running. Ask the user to run `open-slide dev`.',
          );
        }
        const step = args.step === undefined ? '' : `&step=${int(args, 'step')}`;
        const url = `${base}s/${slideId}/preview?p=${page}${step}`;
        const shot = await screenshotPreview(project.userCwd, url);
        if (shot.ok) {
          return {
            content: [
              { type: 'image', data: shot.jpeg.toString('base64'), mimeType: 'image/jpeg' },
              { type: 'text', text: `Page ${page} of ${slideId}, rendered at half of 1920×1080.` },
            ],
          };
        }
        if (shot.reason === 'error') throw new ToolError(`Page ${page} failed: ${shot.message}`);
        return `No browser is available to take a screenshot here. The page is at ${url}`;
      },
    },
    {
      name: 'get_current_view',
      description:
        'Read which deck, page and selected element the user is looking at in the open-slide dev server. Call it again whenever the user says "this page" or "this slide": they move between turns.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { readOnlyHint: true },
      handler: async () => {
        try {
          return await fs.readFile(
            path.join(project.userCwd, 'node_modules', '.open-slide', 'current.json'),
            'utf8',
          );
        } catch {
          throw new ToolError(
            'No current view yet. The dev server writes it once the user opens a deck in the browser.',
          );
        }
      },
    },
  ];
}

export const SERVER_INSTRUCTIONS = [
  'This server edits an open-slide project: each deck is a React module at slides/<id>/index.tsx that the open-slide dev server hot-reloads as you write.',
  'Before writing or editing a deck, call read_guide with "slide-authoring"; before drafting a new deck, also read "create-slide" and follow its workflow.',
  'The guides were written for coding agents with file access: use list_decks, read_deck, create_deck, edit_deck and write_deck in place of reading or writing files, and ask the user directly where a guide says to use a question tool.',
  'Write a new deck page by page so the user can follow along: create_deck with the imports, meta, design and the cover page only, then add each remaining page with its own edit_deck call.',
  'After writing a page, check it with preview_page when the dev server is running, and fix what looks off.',
  'When the user says "this page" or "this element", call get_current_view first.',
].join(' ');

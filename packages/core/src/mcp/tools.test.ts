import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ToolError } from './protocol.ts';
import { buildTools, type McpProject } from './tools.ts';

let project: McpProject;

beforeEach(async () => {
  const userCwd = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-mcp-'));
  project = {
    userCwd,
    slidesRoot: path.join(userCwd, 'slides'),
    themesRoot: path.join(userCwd, 'themes'),
    globalAssetsRoot: path.join(userCwd, 'assets'),
    builtinSkillsDir: path.resolve(import.meta.dirname, '..', '..', 'skills'),
  };
});

afterEach(async () => {
  await fs.rm(project.userCwd, { recursive: true, force: true });
});

async function call(name: string, args: Record<string, unknown> = {}): Promise<string> {
  const tool = buildTools(project).find((t) => t.name === name);
  if (!tool) throw new Error(`no tool ${name}`);
  const out = await tool.handler(args);
  if (typeof out === 'string') return out;
  const first = out.content[0];
  return first.type === 'text' ? first.text : first.data;
}

const DECK = `import type { Page, SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = { title: 'Launch' };

const Cover: Page = () => <h1>Cover</h1>;
const Agenda: Page = () => <h1>Agenda</h1>;

export default [Cover, Agenda] satisfies Page[];
`;

describe('mcp tools', () => {
  it('creates a deck from a title and lists it', async () => {
    const created = await call('create_deck', { title: 'Q3 Roadmap Review' });
    expect(created).toContain('slideId "q3-roadmap-review"');
    expect(created).toContain('open-slide dev');
    const listed = JSON.parse(await call('list_decks'));
    expect(listed.decks).toEqual([
      { slideId: 'q3-roadmap-review', title: 'Q3 Roadmap Review', pages: 1 },
    ]);
  });

  it('creates a deck from source and edits it page by page', async () => {
    await call('create_deck', { slug: 'launch', source: DECK });
    await call('edit_deck', {
      slideId: 'launch',
      oldString: '[Cover, Agenda]',
      newString: '[Cover, Agenda, Agenda]',
    });
    expect(JSON.parse(await call('list_decks')).decks[0]).toMatchObject({ pages: 3 });
    await call('delete_page', { slideId: 'launch', index: 2 });
    await call('reorder_pages', { slideId: 'launch', order: [1, 0] });
    expect(await call('read_deck', { slideId: 'launch' })).toContain('[Agenda, Cover]');
  });

  it('refuses writes that do not parse', async () => {
    await call('create_deck', { slug: 'launch', source: DECK });
    await expect(
      call('edit_deck', { slideId: 'launch', oldString: '<h1>Cover</h1>', newString: '<h1>' }),
    ).rejects.toThrow(ToolError);
    await expect(
      call('write_deck', { slideId: 'launch', source: 'export default [' }),
    ).rejects.toThrow(/does not parse/);
    expect(await call('read_deck', { slideId: 'launch' })).toContain('<h1>Cover</h1>');
  });

  it('rejects ambiguous edits and paths outside slides/', async () => {
    await call('create_deck', { slug: 'launch', source: DECK });
    await expect(
      call('edit_deck', { slideId: 'launch', oldString: 'Page', newString: 'X' }),
    ).rejects.toThrow(/appears/);
    await expect(call('read_deck', { slideId: '../etc' })).rejects.toThrow(/Invalid slideId/);
    await expect(
      call('add_asset', { scope: 'launch', filename: '../x.png', base64: 'AA==' }),
    ).rejects.toThrow(ToolError);
  });

  it('adds assets to a deck', async () => {
    await call('create_deck', { slug: 'launch' });
    const out = await call('add_asset', {
      scope: 'launch',
      filename: 'dot.png',
      base64: 'iVBORw==',
    });
    expect(out).toContain("'./assets/dot.png'");
    expect(JSON.parse(await call('list_assets', { scope: 'launch' }))).toEqual(['dot.png']);
    await expect(
      call('add_asset', { scope: 'launch', filename: 'dot.png', base64: 'iVBORw==' }),
    ).rejects.toThrow(/already exists/);
  });

  it('deletes a deck and its folder assignment', async () => {
    await call('create_deck', { slug: 'launch' });
    await fs.writeFile(
      path.join(project.slidesRoot, '.folders.json'),
      JSON.stringify({ folders: [], assignments: { launch: 'f-00000000' } }),
    );
    await call('delete_deck', { slideId: 'launch' });
    expect(JSON.parse(await call('list_decks')).decks).toEqual([]);
    const manifest = JSON.parse(
      await fs.readFile(path.join(project.slidesRoot, '.folders.json'), 'utf8'),
    );
    expect(manifest.assignments).toEqual({});
  });

  it('asks for the dev server before previewing', async () => {
    await call('create_deck', { slug: 'launch' });
    await expect(call('preview_page', { slideId: 'launch', page: 1 })).rejects.toThrow(
      /open-slide dev/,
    );
  });

  it('reads guides and themes', async () => {
    expect(await call('read_guide', { name: 'slide-authoring' })).toContain('1920');
    await expect(call('read_guide', { name: '../../package.json' })).rejects.toThrow(
      /Unknown guide/,
    );
    await fs.mkdir(project.themesRoot);
    await fs.writeFile(
      path.join(project.themesRoot, 'mono.md'),
      '---\nname: Mono\ndescription: Black and white\n---\n# Mono',
    );
    expect(JSON.parse(await call('list_themes'))).toEqual([
      { id: 'mono', name: 'Mono', description: 'Black and white' },
    ]);
    expect(await call('read_theme', { themeId: 'mono' })).toContain('# Mono');
  });
});

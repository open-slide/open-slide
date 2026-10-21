import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { registerCommentRoutes } from './comments.ts';
import { makeContext } from './context.ts';
import { captureRoute } from './route-harness.ts';

const pageSource = [
  'export const Team = () => (',
  '  <div>',
  '    <p>team</p>',
  '  </div>',
  ');',
  '',
].join('\n');
const indexSource = [
  'export default [() => (',
  '  <section>',
  '    <h1>hi</h1>',
  '  </section>',
  ')];',
  '',
].join('\n');

async function setup() {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-comments-'));
  const deck = path.join(cwd, 'slides', 'demo');
  await fs.mkdir(path.join(deck, 'pages'), { recursive: true });
  await fs.writeFile(path.join(deck, 'index.tsx'), indexSource);
  await fs.writeFile(path.join(deck, 'pages', '03-team.tsx'), pageSource);
  await fs.writeFile(path.join(cwd, 'outside.tsx'), pageSource);
  const ctx = makeContext({ userCwd: cwd, coreVersion: '0.0.0' });
  const call = captureRoute((server) => registerCommentRoutes(server, ctx));
  const read = (rel: string) => fs.readFile(path.join(deck, rel), 'utf8');
  return { cwd, call, read };
}

type ListBody = { comments: { id: string; file: string; note: string; target: unknown }[] };

describe('comment routes', () => {
  it('adds comment to page file', async () => {
    const { call, read } = await setup();
    const out = await call('POST', '/add', {
      slideId: 'demo',
      file: 'pages/03-team.tsx',
      line: 3,
      column: 4,
      text: 'note',
    });
    expect(out.statusCode).toBe(200);
    expect(await read('pages/03-team.tsx')).toContain('@slide-comment');
    expect(await read('index.tsx')).toBe(indexSource);
  });

  it('lists comments across files', async () => {
    const { call } = await setup();
    await call('POST', '/add', { slideId: 'demo', file: 'pages/03-team.tsx', line: 3, text: 'a' });
    await call('POST', '/add', { slideId: 'demo', line: 3, text: 'b' });
    const out = await call('GET', '/?slideId=demo');
    const { comments } = out.body as ListBody;
    expect(comments.map((c) => [c.file, c.note]).sort()).toEqual([
      ['index.tsx', 'b'],
      ['pages/03-team.tsx', 'a'],
    ]);
    const page = comments.find((c) => c.file === 'pages/03-team.tsx');
    expect(page?.target).toMatchObject({ file: 'pages/03-team.tsx' });
  });

  it('edits and deletes in page file', async () => {
    const { call, read } = await setup();
    const added = await call('POST', '/add', {
      slideId: 'demo',
      file: 'pages/03-team.tsx',
      line: 3,
      text: 'first',
    });
    const { id } = added.body as { id: string };
    const put = await call('PUT', `/${id}`, {
      slideId: 'demo',
      file: 'pages/03-team.tsx',
      text: 'second',
    });
    expect(put.statusCode).toBe(200);
    const list = (await call('GET', '/?slideId=demo')).body as ListBody;
    expect(list.comments[0].note).toBe('second');
    const del = await call('DELETE', `/${id}?slideId=demo&file=pages/03-team.tsx`);
    expect(del.statusCode).toBe(200);
    expect(await read('pages/03-team.tsx')).toBe(pageSource);
  });

  it('defaults to index.tsx', async () => {
    const { call, read } = await setup();
    const out = await call('POST', '/add', { slideId: 'demo', line: 3, text: 'x' });
    expect(out.statusCode).toBe(200);
    expect(await read('index.tsx')).toContain('@slide-comment');
    expect(await read('pages/03-team.tsx')).toBe(pageSource);
  });

  it('rejects outside file with 400', async () => {
    const { cwd, call, read } = await setup();
    const out = await call('POST', '/add', {
      slideId: 'demo',
      file: '../../outside.tsx',
      line: 3,
      text: 'x',
    });
    expect(out.statusCode).toBe(400);
    expect(out.body).toMatchObject({ error: expect.any(String), failed: expect.any(String) });
    expect((out.body as { fixes: string[] }).fixes.length).toBeGreaterThan(0);
    expect(out.body).toHaveProperty('verify');
    expect(await fs.readFile(path.join(cwd, 'outside.tsx'), 'utf8')).toBe(pageSource);
    expect(await read('index.tsx')).toBe(indexSource);
    expect(await read('pages/03-team.tsx')).toBe(pageSource);
  });
});

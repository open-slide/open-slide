import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeContext } from './context.ts';
import { registerEditRoutes } from './edit.ts';
import { captureRoute } from './route-harness.ts';

const pageSource = [
  'export const Team = () => (',
  '  <div>',
  '    <p>team</p>',
  '  </div>',
  ');',
  '',
].join('\n');
const indexSource = 'export default [];\n';

describe('edit routes', () => {
  it('inline edit and arrange in page file', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-edit-'));
    const deck = path.join(cwd, 'slides', 'demo');
    await fs.mkdir(path.join(deck, 'pages'), { recursive: true });
    await fs.writeFile(path.join(deck, 'index.tsx'), indexSource);
    await fs.writeFile(path.join(deck, 'pages', '03-team.tsx'), pageSource);
    const ctx = makeContext({ userCwd: cwd, coreVersion: '0.0.0' });
    const call = captureRoute((server) => registerEditRoutes(server, ctx));
    const read = (rel: string) => fs.readFile(path.join(deck, rel), 'utf8');

    const edit = await call('POST', '/', {
      slideId: 'demo',
      file: 'pages/03-team.tsx',
      line: 3,
      column: 4,
      ops: [{ kind: 'set-text', value: 'crew' }],
    });
    expect(edit.statusCode).toBe(200);
    expect(await read('pages/03-team.tsx')).toContain('<p>crew</p>');

    const batch = await call('POST', '/batch', {
      slideId: 'demo',
      file: 'pages/03-team.tsx',
      edits: [
        { line: 3, column: 4, ops: [{ kind: 'set-text', value: 'squad' }] },
        { line: 2, column: 2, ops: [{ kind: 'set-style', key: 'left', value: '10px' }] },
      ],
    });
    expect(batch.statusCode).toBe(200);
    expect(await read('pages/03-team.tsx')).toContain('<p>squad</p>');
    expect(await read('pages/03-team.tsx')).toContain('10px');
    expect(await read('index.tsx')).toBe(indexSource);
  });
});

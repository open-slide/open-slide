import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { expect, it } from 'vitest';
import { createSessionStore } from '../agent/store.ts';
import { createViteConfig } from './config.ts';

it('preserves agent sessions saved after the export server starts', async () => {
  const userCwd = await mkdtemp(path.join(tmpdir(), 'open-slide-export-server-'));
  try {
    const file = path.join(userCwd, 'node_modules', '.open-slide', 'agent-sessions.json');
    const devStore = createSessionStore({ file });
    const config = await createViteConfig({
      userCwd,
      config: { agent: { enabled: true } },
      cliExport: true,
    });
    const exportServer = await createServer({
      ...config,
      logLevel: 'silent',
      cacheDir: path.join(userCwd, 'vite-cache'),
      optimizeDeps: { noDiscovery: true },
      server: { ...config.server, middlewareMode: true, ws: false, watch: null },
    });
    const session = devStore.create('codex', 'alpha');
    try {
      await devStore.close();
    } finally {
      await exportServer.close();
    }
    expect(JSON.parse(await readFile(file, 'utf8'))).toMatchObject({
      sessions: [{ id: session.id, slideId: 'alpha' }],
    });
  } finally {
    await rm(userCwd, { recursive: true, force: true });
  }
});

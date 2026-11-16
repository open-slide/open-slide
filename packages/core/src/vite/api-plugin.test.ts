import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiPlugin } from './api-plugin.ts';

const fixture = vi.hoisted(() => ({ events: [] as string[], generation: 0 }));

vi.mock('./routes/agent.ts', () => ({
  registerAgentRoutes: () => {
    const generation = ++fixture.generation;
    fixture.events.push(`register ${generation}`);
    return async () => {
      fixture.events.push(`close ${generation}`);
    };
  },
}));

let dir: string;
let server: ViteDevServer | undefined;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'open-slide-api-'));
  fixture.events = [];
  fixture.generation = 0;
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  await rm(dir, { recursive: true, force: true });
});

describe('apiPlugin agent lifecycle', () => {
  const start = () =>
    createServer({
      root: dir,
      configFile: false,
      logLevel: 'silent',
      server: { middlewareMode: true, ws: false, watch: null },
      plugins: [apiPlugin({ userCwd: dir, coreVersion: '0.0.0', agentEnabled: true })],
    });

  it('closes the agent of the server that is closing', async () => {
    server = await start();
    await server.close();
    server = undefined;

    expect(fixture.events.filter((e) => e !== 'close 1')).toEqual(['register 1']);
    expect(fixture.events).toContain('close 1');
  });

  it('closes the outgoing agent on a restart, before the replacement starts', async () => {
    server = await start();
    await server.restart();

    expect(fixture.events.slice(0, 3)).toEqual(['register 1', 'close 1', 'register 2']);
    expect(fixture.events).not.toContain('close 2');

    await server.close();
    server = undefined;
    expect(fixture.events).toContain('close 2');
  });
});

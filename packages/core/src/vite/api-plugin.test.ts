import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer, type ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiPlugin } from './api-plugin.ts';

const fixture = vi.hoisted(() => ({
  events: [] as string[],
  generation: 0,
  // What a close waits on; a test swaps in a promise it settles itself.
  cleanup: Promise.resolve(),
}));

vi.mock('./routes/agent.ts', () => ({
  registerAgentRoutes: () => {
    const generation = ++fixture.generation;
    fixture.events.push(`register ${generation}`);
    // Once only, like the real one: Vite asks once per environment.
    let closed: Promise<void> | undefined;
    return () => {
      closed ??= (async () => {
        fixture.events.push(`closing ${generation}`);
        await fixture.cleanup;
        fixture.events.push(`closed ${generation}`);
      })();
      return closed;
    };
  },
}));

function holdCleanup(): () => void {
  let release = () => {};
  fixture.cleanup = new Promise<void>((resolve) => {
    release = resolve;
  });
  return release;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

let dir: string;
let server: ViteDevServer | undefined;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'open-slide-api-'));
  fixture.events = [];
  fixture.generation = 0;
  fixture.cleanup = Promise.resolve();
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

  it('holds the close of a server until its agent has closed', async () => {
    server = await start();
    const release = holdCleanup();
    let closed = false;
    const closing = server.close().then(() => {
      closed = true;
    });
    server = undefined;

    await vi.waitFor(() => expect(fixture.events).toContain('closing 1'));
    await tick();
    expect(closed).toBe(false);

    release();
    await closing;
    expect(fixture.events).toEqual(['register 1', 'closing 1', 'closed 1']);
  });

  it('starts the replacement on a restart only once the outgoing agent has closed', async () => {
    server = await start();
    const release = holdCleanup();
    const restarting = server.restart();

    await vi.waitFor(() => expect(fixture.events).toContain('closing 1'));
    await tick();
    expect(fixture.events).toEqual(['register 1', 'closing 1']);

    release();
    await restarting;
    expect(fixture.events).toEqual(['register 1', 'closing 1', 'closed 1', 'register 2']);

    await server.close();
    server = undefined;
    expect(fixture.events.slice(4)).toEqual(['closing 2', 'closed 2']);
  });
});

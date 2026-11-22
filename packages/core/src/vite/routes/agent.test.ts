import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import type { Connect, ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentProvider } from '../../agent/provider.ts';
import type { AgentSession } from '../../agent/types.ts';
import { registerAgentRoutes } from './agent.ts';
import { makeContext } from './context.ts';

const fixture = vi.hoisted(() => ({ run: (async () => {}) as AgentProvider['run'] }));

vi.mock('../../agent/providers/index.ts', () => {
  const provider: AgentProvider = {
    id: 'claude',
    name: 'Fake',
    sdkPackage: 'fake',
    cliCommand: 'fake',
    askInstruction: '',
    canRewind: false,
    models: async () => [],
    run: (opts) => fixture.run(opts),
  };
  return { createProviders: () => ({ claude: provider, codex: provider }) };
});

type Handler = (req: Connect.IncomingMessage, res: ServerResponse, next: () => void) => unknown;

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'open-slide-agent-'));
});

afterEach(async () => {
  vi.useRealTimers();
  await rm(dir, { recursive: true, force: true });
});

function setup() {
  let handler: Handler | undefined;
  const server = {
    middlewares: {
      use: (_route: string, h: Handler) => {
        handler = h;
      },
    },
    ws: { on: () => {} },
  } as unknown as ViteDevServer;
  const close = registerAgentRoutes(
    server,
    makeContext({ userCwd: dir, coreVersion: '0.0.0', agentEnabled: true }),
  );

  // The body is sent by `end`, so a test can hold a request open mid-upload.
  const request = (method: string, url: string) => {
    const req = Object.assign(new PassThrough(), {
      method,
      url,
      headers: { 'content-type': 'application/json' },
      socket: { remoteAddress: '127.0.0.1' },
    });
    const response = { status: 0, body: {} as Record<string, unknown> };
    const res = {
      setHeader: () => {},
      end: (raw: string) => {
        response.status = res.statusCode;
        response.body = JSON.parse(raw);
      },
      statusCode: 200,
    };
    const done = Promise.resolve(
      handler?.(
        req as unknown as Connect.IncomingMessage,
        res as unknown as ServerResponse,
        () => {},
      ),
    ).then(() => response);
    return { req, end: (body: unknown) => req.end(JSON.stringify(body)), done };
  };

  const post = (url: string, body: unknown) => {
    const sent = request('POST', url);
    sent.end(body);
    return sent.done;
  };

  const saved = async () => {
    const file = path.join(dir, 'node_modules', '.open-slide', 'agent-sessions.json');
    return (JSON.parse(await readFile(file, 'utf8')) as { sessions: AgentSession[] }).sessions;
  };

  return { close, request, post, saved };
}

describe('agent routes on close', () => {
  it('refuses a message whose body arrives after the close began', async () => {
    const run = vi.fn<AgentProvider['run']>(async () => {});
    fixture.run = run;
    const { close, request, post } = setup();
    const session = (await post('/sessions', { provider: 'claude' })).body;

    const message = request('POST', `/sessions/${session.id}/messages`);
    const closing = close();
    message.end({ text: 'go' });

    expect((await message.done).status).toBe(503);
    expect(run).not.toHaveBeenCalled();
    expect((await post('/sessions', { provider: 'claude' })).status).toBe(503);
    await closing;
  });

  // The close lands a different number of microtasks after the body each time,
  // so one of these falls between reading the body and admitting the turn.
  it.each([0, 1, 2, 3])(
    'leaves no turn running when the close begins %i ticks after the body',
    async (ticks) => {
      const signals: AbortSignal[] = [];
      fixture.run = async (opts) => {
        signals.push(opts.signal);
        await new Promise<void>((resolve) =>
          opts.signal.addEventListener('abort', () => resolve()),
        );
      };
      const { close, request, post } = setup();
      const session = (await post('/sessions', { provider: 'claude' })).body;

      const message = request('POST', `/sessions/${session.id}/messages`);
      const closing = new Promise<void>((resolve) => {
        message.req.on('end', () => {
          let left = ticks;
          const step = () => {
            if (left-- > 0) queueMicrotask(step);
            else resolve(close());
          };
          queueMicrotask(step);
        });
      });
      message.end({ text: 'go' });
      const { status } = await message.done;
      await closing;

      expect(signals).toHaveLength(status === 202 ? 1 : 0);
      expect(signals.every((signal) => signal.aborted)).toBe(true);
    },
  );

  it('waits for a stopped turn to end before the final save', async () => {
    fixture.run = async (opts) => {
      await new Promise<void>((resolve) => opts.signal.addEventListener('abort', () => resolve()));
      await new Promise((resolve) => setTimeout(resolve, 20));
    };
    const { close, post, saved } = setup();
    const session = (await post('/sessions', { provider: 'claude' })).body;
    expect((await post(`/sessions/${session.id}/messages`, { text: 'go' })).status).toBe(202);

    await close();

    const [stored] = await saved();
    expect(stored?.items.at(-1)).toMatchObject({ kind: 'result', aborted: true });
  });

  it('leaves a placeholder deck where its session says it is when the turn outlives the close', async () => {
    let end = () => {};
    fixture.run = () =>
      new Promise<void>((resolve) => {
        end = resolve;
      });
    const deck = path.join(dir, 'slides', 'untitled');
    await mkdir(deck, { recursive: true });
    await writeFile(
      path.join(deck, 'index.tsx'),
      "export const meta = { title: 'Quarterly Review' };\n",
    );
    const { close, post, saved } = setup();
    const session = (await post('/sessions', { provider: 'claude', slideId: 'untitled' })).body;
    await post(`/sessions/${session.id}/messages`, { text: 'go' });

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const closing = close();
    await vi.advanceTimersByTimeAsync(2000);
    vi.useRealTimers();
    await closing;

    end();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const [stored] = await saved();
    expect(stored?.slideId).toBe('untitled');
    expect(existsSync(deck)).toBe(true);
  });
});

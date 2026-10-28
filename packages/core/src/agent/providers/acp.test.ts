import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ProviderEvent, ProviderRunOptions } from '../provider.ts';
import { createAcpProvider, windowsShimCommand } from './acp.ts';

const tempDirs: string[] = [];

const FAKE_AGENT = `
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
const lines = createInterface({ input: process.stdin });
const cancelMarker = process.argv[2];
const send = (message) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...message }) + '\\n');
let promptRequest = null;
let activeSession = 'fake-session';
lines.on('line', (line) => {
  const message = JSON.parse(line);
  if (message.method === 'initialize') {
    send({ id: message.id, result: { protocolVersion: 1, agentCapabilities: { loadSession: true } } });
  } else if (message.method === 'session/new') {
    send({ id: message.id, result: { sessionId: activeSession } });
  } else if (message.method === 'session/load') {
    if (message.params.sessionId === 'rejected-session') {
      send({ id: message.id, error: { code: -32000, message: 'Unknown session' } });
      return;
    }
    activeSession = message.params.sessionId;
    send({ method: 'session/update', params: { sessionId: activeSession, update: {
      sessionUpdate: 'agent_message_chunk', messageId: 'replay', content: { type: 'text', text: 'old reply' }
    } } });
    send({ id: message.id, result: {} });
  } else if (message.method === 'session/prompt') {
    promptRequest = message.id;
    const text = message.params.prompt[0].text;
    if (text.includes('WAIT')) return;
    if (text.includes('MALFORMED')) {
      send({ method: 'session/update', params: { sessionId: activeSession, update: {
        sessionUpdate: 'plan', entries: [null]
      } } });
      return;
    }
    send({ method: 'session/update', params: { sessionId: activeSession, update: {
      sessionUpdate: 'agent_message_chunk', messageId: 'answer', content: { type: 'text', text: text.includes('SYSTEM') ? 'Hel' : 'New' }
    } } });
    send({ method: 'session/update', params: { sessionId: activeSession, update: {
      sessionUpdate: 'agent_message_chunk', messageId: 'answer', content: { type: 'text', text: text.includes('SYSTEM') ? 'lo' : ' turn' }
    } } });
    send({ method: 'session/update', params: { sessionId: activeSession, update: {
      sessionUpdate: 'plan', entries: [{ content: 'Edit the deck', status: 'pending' }]
    } } });
    send({ method: 'session/update', params: { sessionId: activeSession, update: {
      sessionUpdate: 'tool_call', toolCallId: 'tool-1', name: 'write_file', title: 'Write slide', status: 'pending', rawInput: { path: 'slides/demo/index.tsx' }
    } } });
    send({ id: 'permission-1', method: 'session/request_permission', params: {
      sessionId: activeSession,
      toolCall: { toolCallId: 'tool-1', name: 'write_file', title: 'Write slide', rawInput: { path: 'slides/demo/index.tsx' } },
      options: [
        { optionId: 'allow-once', name: 'Allow once', kind: 'allow_once' },
        { optionId: 'reject-once', name: 'Reject', kind: 'reject_once' }
      ]
    } });
  } else if (message.id === 'permission-1') {
    const allowed = message.result.outcome.optionId === 'allow-once';
    send({ method: 'session/update', params: { sessionId: activeSession, update: {
      sessionUpdate: 'tool_call_update', toolCallId: 'tool-1', status: allowed ? 'completed' : 'failed'
    } } });
    send({ method: 'session/update', params: { sessionId: activeSession, update: {
      sessionUpdate: 'plan', entries: [{ content: 'Edit the deck', status: 'completed' }]
    } } });
    send({ id: promptRequest, result: { stopReason: 'end_turn' } });
  } else if (message.method === 'session/cancel') {
    writeFileSync(cancelMarker, message.params.sessionId);
    send({ id: promptRequest, result: { stopReason: 'cancelled' } });
  }
});
`;

async function setup() {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'open-slide-acp-'));
  tempDirs.push(cwd);
  const script = path.join(cwd, 'fake-acp-agent.mjs');
  const cancelMarker = path.join(cwd, 'cancelled');
  await fs.writeFile(script, FAKE_AGENT);
  const provider = createAcpProvider(
    {
      id: 'fake',
      name: 'Fake ACP',
      type: 'acp',
      command: process.execPath,
      args: [script, cancelMarker],
    },
    '2.3.1',
  );
  return { cancelMarker, cwd, provider };
}

function options(
  cwd: string,
  events: ProviderEvent[],
  resume: string | null,
  requestPermission: ProviderRunOptions['requestPermission'],
): ProviderRunOptions {
  return {
    cwd,
    writableRoots: [path.join(cwd, 'slides')],
    prompt: resume ? 'Continue' : 'Make a slide',
    systemPromptAppend: 'SYSTEM',
    resume,
    resumeAt: null,
    model: null,
    effort: null,
    signal: new AbortController().signal,
    emit: (event) => events.push(event),
    askUser: async () => null,
    requestPermission,
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('ACP provider', () => {
  it('quotes Windows command shims without exposing arguments to cmd.exe', () => {
    expect(
      windowsShimCommand(
        'C:\\Program Files\\100%TEMP%\\agent.cmd',
        ['--name', 'A&B', '100%', 'say "hi"'],
        'cmd.exe',
        {},
      ),
    ).toEqual({
      command: 'cmd.exe',
      args: [
        '/d',
        '/s',
        '/c',
        '""%OPEN_SLIDE_ACP_COMMAND%" ^^^"--name^^^" ^^^"A^^^&B^^^" ^^^"100^^^%^^^" ^^^"say^^^ \\^^^"hi\\^^^"^^^""',
      ],
      env: { OPEN_SLIDE_ACP_COMMAND: 'C:\\Program Files\\100%TEMP%\\agent.cmd' },
    });
  });

  it('maps messages, plans, tools and permission requests into panel events', async () => {
    const { cwd, provider } = await setup();
    const events: ProviderEvent[] = [];
    const permissions: unknown[] = [];

    await provider.run(
      options(cwd, events, null, async (request) => {
        permissions.push(request);
        return true;
      }),
    );

    expect(events[0]).toEqual({ type: 'session-id', id: 'fake-session' });
    expect(events.filter((event) => event.type === 'text-delta')).toEqual([
      expect.objectContaining({ text: 'Hel' }),
      expect.objectContaining({ text: 'lo' }),
    ]);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'tool-start', name: 'plan', title: 'Plan' }),
        expect.objectContaining({ type: 'tool-start', name: 'write_file', title: 'Write slide' }),
        expect.objectContaining({ type: 'tool-end', ok: true }),
        { type: 'result', durationMs: null, costUsd: null },
      ]),
    );
    expect(permissions).toEqual([
      {
        tool: 'write_file',
        title: 'Write slide',
        detail: '{"path":"slides/demo/index.tsx"}',
      },
    ]);
  });

  it('loads an advertised session without replaying its transcript', async () => {
    const { cwd, provider } = await setup();
    const events: ProviderEvent[] = [];

    await provider.run(options(cwd, events, 'fake-session', async () => false));

    const deltas = events
      .filter(
        (event): event is Extract<ProviderEvent, { type: 'text-delta' }> =>
          event.type === 'text-delta',
      )
      .map((event) => event.text);
    expect(deltas).toEqual(['New', ' turn']);
    expect(events).toContainEqual({ type: 'session-id', id: 'fake-session' });
    expect(events).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'tool-end', ok: false })]),
    );
  });

  it('starts a new session when loading the saved session fails', async () => {
    const { cwd, provider } = await setup();
    const events: ProviderEvent[] = [];

    await provider.run(options(cwd, events, 'rejected-session', async () => false));

    expect(events[0]).toEqual({ type: 'session-id', id: 'fake-session' });
    expect(events.filter((event) => event.type === 'text-delta')).toEqual([
      expect.objectContaining({ text: 'Hel' }),
      expect.objectContaining({ text: 'lo' }),
    ]);
  });

  it('fails the run when the agent sends a malformed update', async () => {
    const { cwd, provider } = await setup();
    const runOptions = options(cwd, [], null, async () => false);
    runOptions.prompt = 'MALFORMED';

    await expect(provider.run(runOptions)).rejects.toThrow(TypeError);
  });

  it('sends session/cancel when the panel stops a turn', async () => {
    const { cancelMarker, cwd, provider } = await setup();
    const controller = new AbortController();
    const runOptions = options(cwd, [], null, async () => false);
    runOptions.prompt = 'WAIT';
    runOptions.signal = controller.signal;
    const ready = new Promise<void>((resolve) => {
      runOptions.emit = (event) => {
        if (event.type === 'session-id') resolve();
      };
    });

    const run = provider.run(runOptions);
    await ready;
    controller.abort();
    await run;

    expect(await fs.readFile(cancelMarker, 'utf8')).toBe('fake-session');
  });
});

import { describe, expect, it } from 'vitest';
import type { AgentProvider, ProviderEvent } from '../provider.ts';
import { createAgentRunner } from '../runner.ts';
import { createSessionStore } from '../store.ts';
import { createCodexMapper, parseCodexModelsCache } from './codex.ts';
import type { CodexThreadEvent } from './sdk-types.ts';

function collect() {
  const events: ProviderEvent[] = [];
  const mapper = createCodexMapper((e) => events.push(e));
  return { events, mapper };
}

function startIds(events: ProviderEvent[]): string[] {
  return events.flatMap((e) => (e.type === 'text-start' || e.type === 'tool-start' ? [e.id] : []));
}

async function settle() {
  await new Promise((r) => setTimeout(r, 0));
}

describe('createCodexMapper', () => {
  it('maps a full turn into provider events', () => {
    const { events, mapper } = collect();
    const stream: CodexThreadEvent[] = [
      { type: 'thread.started', thread_id: 'th-1' },
      { type: 'turn.started' },
      {
        type: 'item.started',
        item: { type: 'command_execution', id: 'c1', command: 'ls slides', status: 'in_progress' },
      },
      {
        type: 'item.completed',
        item: {
          type: 'command_execution',
          id: 'c1',
          command: 'ls slides',
          status: 'completed',
          exit_code: 0,
        },
      },
      { type: 'item.completed', item: { type: 'reasoning', id: 'r1', text: 'thinking' } },
      {
        type: 'item.completed',
        item: {
          type: 'file_change',
          id: 'f1',
          status: 'completed',
          changes: [{ path: 'slides/deck/index.tsx', kind: 'update' }],
        },
      },
      {
        type: 'item.completed',
        item: { type: 'agent_message', id: 'm1', text: 'Updated the deck.' },
      },
      { type: 'turn.completed', usage: {} },
    ];
    for (const e of stream) mapper.handle(e);

    const ids = startIds(events);
    expect(events).toEqual([
      { type: 'session-id', id: 'th-1' },
      {
        type: 'tool-start',
        id: ids[0],
        name: 'command',
        title: 'Run command',
        detail: 'ls slides',
      },
      { type: 'tool-end', id: ids[0], ok: true },
      {
        type: 'tool-start',
        id: ids[1],
        name: 'file_change',
        title: 'Edit',
        detail: 'slides/deck/index.tsx',
      },
      { type: 'tool-end', id: ids[1], ok: true },
      { type: 'text-start', id: ids[2] },
      { type: 'text-end', id: ids[2], text: 'Updated the deck.' },
      { type: 'result', durationMs: null, costUsd: null },
    ]);
    expect(new Set(ids).size).toBe(3);
    expect(mapper.resultSeen).toBe(true);
  });

  it('reports failures', () => {
    const { events, mapper } = collect();
    mapper.handle({ type: 'item.completed', item: { type: 'error', id: 'e1', message: 'nope' } });
    mapper.handle({ type: 'turn.failed', error: { message: 'turn failed' } });
    expect(events).toEqual([
      { type: 'error', text: 'nope' },
      { type: 'error', text: 'turn failed' },
      { type: 'result', durationMs: null, costUsd: null },
    ]);
  });
});

describe('createCodexMapper questions', () => {
  it('turns a questions block into a question event and keeps the prose', () => {
    const { events, mapper } = collect();
    const block = JSON.stringify([
      {
        header: 'Pages',
        question: 'How many pages?',
        options: [{ label: '3-5', description: 'Short' }, { label: '6-10' }],
      },
    ]);
    mapper.handle({
      type: 'item.completed',
      item: {
        type: 'agent_message',
        id: 'm1',
        text: `A few questions first.\n<open-slide-questions>\n${block}\n</open-slide-questions>`,
      },
    });
    const [id] = startIds(events);
    expect(events).toEqual([
      { type: 'text-start', id },
      { type: 'text-end', id, text: 'A few questions first.' },
      {
        type: 'questions',
        questions: [
          {
            header: 'Pages',
            question: 'How many pages?',
            options: [
              { label: '3-5', description: 'Short' },
              { label: '6-10', description: undefined },
            ],
            multiSelect: false,
          },
        ],
      },
    ]);
  });

  it('leaves a malformed block as plain text', () => {
    const { events, mapper } = collect();
    const text = '<open-slide-questions>not json</open-slide-questions>';
    mapper.handle({ type: 'item.completed', item: { type: 'agent_message', id: 'm1', text } });
    const [id] = startIds(events);
    expect(events).toEqual([
      { type: 'text-start', id },
      { type: 'text-end', id, text },
    ]);
  });
});

describe('createCodexMapper item ids', () => {
  const turn = (text: string): CodexThreadEvent[] => [
    {
      type: 'item.started',
      item: { type: 'command_execution', id: 'item_0', command: 'ls', status: 'in_progress' },
    },
    {
      type: 'item.completed',
      item: {
        type: 'command_execution',
        id: 'item_0',
        command: 'ls',
        status: 'completed',
        exit_code: 0,
      },
    },
    { type: 'item.completed', item: { type: 'agent_message', id: 'item_1', text } },
    { type: 'turn.completed', usage: {} },
  ];

  it('keeps one id per item within a turn and never repeats it in a later turn', () => {
    const first = collect();
    for (const e of turn('reply 1')) first.mapper.handle(e);
    const second = collect();
    for (const e of turn('reply 2')) second.mapper.handle(e);

    const [toolStart, toolEnd, textStart, textEnd] = first.events;
    expect(toolStart).toMatchObject({ type: 'tool-start' });
    expect(toolEnd).toMatchObject({ type: 'tool-end', id: (toolStart as { id: string }).id });
    expect(textStart).toMatchObject({ type: 'text-start' });
    expect(textEnd).toMatchObject({ type: 'text-end', id: (textStart as { id: string }).id });

    const ids = [...startIds(first.events), ...startIds(second.events)];
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it("keeps each turn's reply and tool when Codex reuses item ids across turns", async () => {
    const store = createSessionStore({ file: null });
    const replies = ['reply 1', 'reply 2'];
    const provider: AgentProvider = {
      id: 'codex',
      name: 'Codex',
      sdkPackage: 'fake',
      cliCommand: 'fake',
      askInstruction: '',
      canRewind: false,
      models: async () => [],
      run: async (opts) => {
        const mapper = createCodexMapper(opts.emit);
        for (const e of turn(replies.shift() ?? '')) mapper.handle(e);
      },
    };
    const runner = createAgentRunner({
      userCwd: '/ws',
      writableRoots: ['/ws/slides'],
      store,
      providers: { claude: provider, codex: provider },
    });
    const session = store.create('codex', null);
    await runner.send(session.id, { text: 'first' });
    await settle();
    await runner.send(session.id, { text: 'second' });
    await settle();

    const items = store.get(session.id)?.items ?? [];
    expect(items.map((i) => i.kind)).toEqual([
      'user',
      'tool',
      'assistant',
      'result',
      'user',
      'tool',
      'assistant',
      'result',
    ]);
    const assistants = items.filter((i) => i.kind === 'assistant');
    expect(assistants.map((i) => i.text)).toEqual(['reply 1', 'reply 2']);
    expect(assistants.map((i) => i.streaming)).toEqual([false, false]);
    expect(items.filter((i) => i.kind === 'tool').map((i) => i.status)).toEqual(['done', 'done']);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

describe('parseCodexModelsCache', () => {
  it('lists the models the Codex picker shows, in its order', () => {
    const models = parseCodexModelsCache({
      models: [
        {
          slug: 'gpt-b',
          display_name: 'GPT B',
          priority: 2,
          supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }, { effort: 'bogus' }],
        },
        { slug: 'gpt-hidden', visibility: 'hide', priority: 0 },
        { slug: 'gpt-a', priority: 1, supported_reasoning_levels: ['medium'] },
        { display_name: 'no slug' },
      ],
    });
    expect(models).toEqual([
      { id: 'gpt-a', label: 'gpt-a', efforts: ['medium'] },
      { id: 'gpt-b', label: 'GPT B', efforts: ['low', 'high'] },
    ]);
    expect(parseCodexModelsCache(null)).toEqual([]);
    expect(parseCodexModelsCache({ models: 'x' })).toEqual([]);
  });
});

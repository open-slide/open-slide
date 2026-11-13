import { describe, expect, it } from 'vitest';
import type { ProviderEvent } from '../provider.ts';
import { createCodexMapper, parseCodexModelsCache } from './codex.ts';
import type { CodexThreadEvent } from './sdk-types.ts';

function collect() {
  const events: ProviderEvent[] = [];
  const mapper = createCodexMapper((e) => events.push(e));
  return { events, mapper };
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

    expect(events).toEqual([
      { type: 'session-id', id: 'th-1' },
      { type: 'tool-start', id: 'c1', name: 'command', title: 'Run command', detail: 'ls slides' },
      { type: 'tool-end', id: 'c1', ok: true },
      {
        type: 'tool-start',
        id: 'f1',
        name: 'file_change',
        title: 'Edit',
        detail: 'slides/deck/index.tsx',
      },
      { type: 'tool-end', id: 'f1', ok: true },
      { type: 'text-start', id: 'm1' },
      { type: 'text-end', id: 'm1', text: 'Updated the deck.' },
      { type: 'result', durationMs: null, costUsd: null },
    ]);
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
    expect(events).toEqual([
      { type: 'text-start', id: 'm1' },
      { type: 'text-end', id: 'm1', text: 'A few questions first.' },
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
    expect(events).toEqual([
      { type: 'text-start', id: 'm1' },
      { type: 'text-end', id: 'm1', text },
    ]);
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

import { describe, expect, it } from 'vitest';
import type { ProviderEvent } from '../provider.ts';
import { isInsideRoots, parseQuestions } from '../provider.ts';
import { createClaudeMapper, describeClaudeTool } from './claude.ts';
import type { ClaudeSdkMessage } from './sdk-types.ts';

const CWD = '/ws/project';

function collect() {
  const events: ProviderEvent[] = [];
  const mapper = createClaudeMapper((e) => events.push(e), CWD);
  return { events, mapper };
}

describe('describeClaudeTool', () => {
  it('summarises common tools with workspace-relative paths', () => {
    expect(describeClaudeTool('Edit', { file_path: `${CWD}/slides/deck/index.tsx` }, CWD)).toEqual({
      title: 'Edit',
      detail: 'slides/deck/index.tsx',
    });
    expect(describeClaudeTool('Bash', { command: 'pnpm   typecheck' }, CWD)).toEqual({
      title: 'Run command',
      detail: 'pnpm typecheck',
    });
    expect(describeClaudeTool('Skill', { skill: 'create-slide' }, CWD).detail).toBe('create-slide');
    expect(describeClaudeTool('Mystery', { a: 1 }, CWD)).toEqual({
      title: 'Mystery',
      detail: '{"a":1}',
    });
  });
});

describe('isInsideRoots', () => {
  const roots = [`${CWD}/slides`, `${CWD}/assets`];

  it('accepts files inside the deck and asset folders', () => {
    expect(isInsideRoots(CWD, `${CWD}/slides/deck/index.tsx`, roots)).toBe(true);
    expect(isInsideRoots(CWD, 'assets/logo.svg', roots)).toBe(true);
  });

  it('rejects files outside them, including traversal and lookalike prefixes', () => {
    expect(isInsideRoots(CWD, `${CWD}/package.json`, roots)).toBe(false);
    expect(isInsideRoots(CWD, `${CWD}/slides/../vite.config.ts`, roots)).toBe(false);
    expect(isInsideRoots(CWD, `${CWD}/slides-backup/x.tsx`, roots)).toBe(false);
    expect(isInsideRoots(CWD, undefined, roots)).toBe(false);
  });
});

describe('parseQuestions', () => {
  it('keeps only well-formed questions', () => {
    const questions = parseQuestions({
      questions: [
        {
          header: 'Style',
          question: 'Which look?',
          multiSelect: false,
          options: [{ label: 'Bold', description: 'big type' }, { nope: true }, { label: 'Calm' }],
        },
        { header: 'bad' },
        'junk',
      ],
    });
    expect(questions).toEqual([
      {
        header: 'Style',
        question: 'Which look?',
        multiSelect: false,
        options: [
          { label: 'Bold', description: 'big type' },
          { label: 'Calm', description: undefined },
        ],
      },
    ]);
  });
});

describe('createClaudeMapper', () => {
  it('streams text via partial messages and reconciles on the full message', () => {
    const { events, mapper } = collect();
    const msgs: ClaudeSdkMessage[] = [
      { type: 'system', subtype: 'init', session_id: 'sess-1' },
      {
        type: 'stream_event',
        session_id: 'sess-1',
        parent_tool_use_id: null,
        event: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      },
      {
        type: 'stream_event',
        session_id: 'sess-1',
        parent_tool_use_id: null,
        event: {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'Hel' },
        },
      },
      {
        type: 'stream_event',
        session_id: 'sess-1',
        parent_tool_use_id: null,
        event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo' } },
      },
      {
        type: 'assistant',
        session_id: 'sess-1',
        parent_tool_use_id: null,
        message: {
          content: [
            { type: 'text', text: 'Hello' },
            { type: 'tool_use', id: 'tu1', name: 'Read', input: { file_path: `${CWD}/a.ts` } },
          ],
        },
      },
      {
        type: 'user',
        parent_tool_use_id: null,
        message: { content: [{ type: 'tool_result', tool_use_id: 'tu1' }] },
      },
      {
        type: 'result',
        subtype: 'success',
        session_id: 'sess-1',
        duration_ms: 1200,
        total_cost_usd: 0.02,
      },
    ];
    for (const m of msgs) mapper.handle(m);

    expect(events[0]).toEqual({ type: 'session-id', id: 'sess-1' });
    expect(events[1].type).toBe('text-start');
    const textId = (events[1] as { id: string }).id;
    expect(events.slice(2, 4)).toEqual([
      { type: 'text-delta', id: textId, text: 'Hel' },
      { type: 'text-delta', id: textId, text: 'lo' },
    ]);
    expect(events[4]).toEqual({ type: 'text-end', id: textId, text: 'Hello' });
    expect(events[5]).toEqual({
      type: 'tool-start',
      id: 'tu1',
      name: 'Read',
      title: 'Read',
      detail: 'a.ts',
    });
    expect(events[6]).toEqual({ type: 'tool-end', id: 'tu1', ok: true });
    expect(events.at(-1)).toEqual({ type: 'result', durationMs: 1200, costUsd: 0.02 });
    expect(mapper.resultSeen).toBe(true);
  });

  it('emits whole text blocks when no partial messages arrived and skips subagents', () => {
    const { events, mapper } = collect();
    mapper.handle({
      type: 'assistant',
      session_id: 's',
      parent_tool_use_id: 'parent',
      message: { content: [{ type: 'text', text: 'from subagent' }] },
    });
    mapper.handle({
      type: 'assistant',
      session_id: 's',
      parent_tool_use_id: null,
      message: { content: [{ type: 'text', text: 'Done.' }] },
    });
    expect(events.map((e) => e.type)).toEqual(['text-start', 'text-end']);
    expect((events[1] as { text: string }).text).toBe('Done.');
  });

  it('marks top-level history entries as rewind checkpoints', () => {
    const { events, mapper } = collect();
    mapper.handle({
      type: 'assistant',
      uuid: 'a-1',
      session_id: 's',
      parent_tool_use_id: null,
      message: { content: [{ type: 'tool_use', id: 'tool-1', name: 'Read', input: {} }] },
    });
    mapper.handle({
      type: 'user',
      uuid: 'u-1',
      parent_tool_use_id: null,
      message: { content: [{ type: 'tool_result', tool_use_id: 'tool-1' }] },
    });
    mapper.handle({
      type: 'assistant',
      uuid: 'sub-1',
      session_id: 's',
      parent_tool_use_id: 'tool-1',
      message: { content: [] },
    });
    expect(events.filter((e) => e.type === 'checkpoint')).toEqual([
      { type: 'checkpoint', id: 'a-1' },
      { type: 'checkpoint', id: 'u-1' },
    ]);
  });

  it('surfaces error results', () => {
    const { events, mapper } = collect();
    mapper.handle({
      type: 'result',
      subtype: 'error_during_execution',
      session_id: 's',
      is_error: true,
      errors: ['boom'],
    });
    expect(events.map((e) => e.type)).toEqual(['session-id', 'error', 'result']);
    expect(events[1]).toEqual({ type: 'error', text: 'boom' });
  });
});

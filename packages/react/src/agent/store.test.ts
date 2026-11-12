import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSessionStore, titleFromPrompt } from './store.ts';
import type { AgentStreamEvent } from './types.ts';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'open-slide-agent-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('titleFromPrompt', () => {
  it('uses the first non-empty line, clipped', () => {
    expect(titleFromPrompt('\n\n  Make a deck about Rust  \nmore')).toBe('Make a deck about Rust');
    expect(titleFromPrompt('')).toBe('Untitled');
    expect(titleFromPrompt('x'.repeat(80))).toHaveLength(60);
  });
});

describe('createSessionStore', () => {
  it('creates, lists newest-first and streams events', () => {
    const store = createSessionStore({ file: null });
    const events: AgentStreamEvent[] = [];
    store.subscribe((e) => events.push(e));

    const a = store.create('claude', null);
    const b = store.create('codex', 'deck');
    expect(store.list().map((s) => s.id)).toEqual([b.id, a.id]);
    expect(store.list()[0]).not.toHaveProperty('items');

    store.appendItem(a.id, { kind: 'user', id: 'u1', ts: 't', text: 'hi' });
    expect(store.list()[0].id).toBe(a.id);

    const item = store.appendItem(a.id, {
      kind: 'assistant',
      id: 'a1',
      ts: 't',
      text: '',
      streaming: true,
    });
    store.appendDelta(a.id, item.id, 'Hel');
    store.appendDelta(a.id, item.id, 'lo');
    store.updateItem(a.id, item.id, 'assistant', { streaming: false });
    expect(store.get(a.id)?.items[1]).toMatchObject({ text: 'Hello', streaming: false });

    expect(events.map((e) => e.type)).toEqual([
      'session',
      'session',
      'item',
      'session',
      'item',
      'session',
      'delta',
      'delta',
      'item',
      'session',
    ]);
  });

  it('ignores deltas for non-assistant items and unknown ids', () => {
    const store = createSessionStore({ file: null });
    const s = store.create('claude', null);
    store.appendItem(s.id, { kind: 'user', id: 'u1', ts: 't', text: 'hi' });
    store.appendDelta(s.id, 'u1', 'nope');
    store.appendDelta(s.id, 'missing', 'nope');
    expect(store.get(s.id)?.items[0]).toMatchObject({ text: 'hi' });
    expect(store.updateItem(s.id, 'u1', 'assistant', { streaming: false })).toBeNull();
  });

  it('persists to disk and reloads with pending prompts closed out', async () => {
    const file = path.join(dir, 'sessions.json');
    const store = createSessionStore({ file });
    const s = store.create('claude', 'deck');
    store.patch(s.id, { status: 'running', providerSessionId: 'sess-1', title: 'Deck' });
    store.appendItem(s.id, {
      kind: 'question',
      id: 'q1',
      ts: 't',
      questions: [],
      answers: null,
      status: 'pending',
    });
    store.appendItem(s.id, {
      kind: 'permission',
      id: 'p1',
      ts: 't',
      tool: 'Bash',
      title: 'Run command',
      detail: 'ls',
      status: 'pending',
    });
    store.appendItem(s.id, { kind: 'assistant', id: 'a1', ts: 't', text: 'x', streaming: true });
    await store.flush();

    const raw = JSON.parse(await readFile(file, 'utf8')) as { version: number };
    expect(raw.version).toBe(1);

    const reloaded = createSessionStore({ file });
    const again = reloaded.get(s.id);
    expect(again).toMatchObject({
      status: 'idle',
      providerSessionId: 'sess-1',
      title: 'Deck',
      slideId: 'deck',
    });
    expect(again?.items.map((i) => ('status' in i ? i.status : i.kind))).toEqual([
      'cancelled',
      'denied',
      'assistant',
    ]);
    expect(again?.items[2]).toMatchObject({ streaming: false });
  });

  it('keeps the latest snapshot when saves overlap', async () => {
    const file = path.join(dir, 'sessions.json');
    const store = createSessionStore({ file });
    const s = store.create('claude', 'deck');
    const first = store.flush();
    store.patch(s.id, { title: 'Latest' });
    await Promise.all([first, store.flush(), store.flush()]);

    expect(createSessionStore({ file }).get(s.id)?.title).toBe('Latest');
  });

  it('removes sessions and caps the idle backlog', () => {
    const store = createSessionStore({ file: null });
    for (let i = 0; i < 35; i++) store.create('claude', null);
    expect(store.list().length).toBe(30);
    const [first] = store.list();
    expect(store.remove(first.id)).toBe(true);
    expect(store.remove(first.id)).toBe(false);
    expect(store.get(first.id)).toBeNull();
  });

  it('drops the oldest items past the cap and marks the session trimmed', () => {
    const store = createSessionStore({ file: null });
    const s = store.create('claude', null);
    for (let i = 0; i < 401; i++) {
      store.appendItem(s.id, { kind: 'error', id: `e${i}`, ts: '', text: String(i) });
    }
    const after = store.get(s.id);
    expect(after?.items).toHaveLength(400);
    expect(after?.items[0]?.id).toBe('e1');
    expect(after?.trimmed).toBe(true);
    expect(store.list()[0]).not.toHaveProperty('trimmed');
  });
});

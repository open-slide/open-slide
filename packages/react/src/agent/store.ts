import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type AgentItem,
  type AgentProviderId,
  type AgentSession,
  type AgentSessionSummary,
  type AgentStreamEvent,
  sessionSummary,
} from './types.ts';

const MAX_SESSIONS = 30;
const MAX_ITEMS_PER_SESSION = 400;
const SAVE_DEBOUNCE_MS = 150;
const TITLE_MAX = 60;

export function newId(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString('hex')}`;
}

export function titleFromPrompt(text: string): string {
  const line = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) return 'Untitled';
  return line.length > TITLE_MAX ? `${line.slice(0, TITLE_MAX - 1)}…` : line;
}

type Listener = (event: AgentStreamEvent) => void;

type PersistedShape = { version: 1; sessions: AgentSession[] };

function readPersisted(file: string): AgentSession[] {
  if (!existsSync(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<PersistedShape>;
    if (parsed?.version !== 1 || !Array.isArray(parsed.sessions)) return [];
    // A dev-server restart mid-turn leaves no process to finish it; every
    // reloaded session starts idle and pending prompts are closed out.
    return parsed.sessions.map((s) => ({
      ...s,
      status: 'idle',
      items: s.items.map(closePending),
    }));
  } catch {
    return [];
  }
}

function closePending(item: AgentItem): AgentItem {
  if (item.kind === 'assistant' && item.streaming) return { ...item, streaming: false };
  if (item.kind === 'tool' && item.status === 'running') return { ...item, status: 'error' };
  if (item.kind === 'question' && item.status === 'pending')
    return { ...item, status: 'cancelled' };
  if (item.kind === 'permission' && item.status === 'pending') return { ...item, status: 'denied' };
  return item;
}

export type SessionStore = ReturnType<typeof createSessionStore>;

export function createSessionStore(opts: { file: string | null }) {
  const sessions = new Map<string, AgentSession>();
  const listeners = new Set<Listener>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  // Touch order breaks ties between sessions updated in the same millisecond.
  let seq = 0;
  const order = new Map<string, number>();

  if (opts.file) {
    for (const s of readPersisted(opts.file)) {
      sessions.set(s.id, s);
      order.set(s.id, seq++);
    }
  }

  const emit = (event: AgentStreamEvent) => {
    for (const l of listeners) l(event);
  };

  const scheduleSave = () => {
    if (!opts.file) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void save();
    }, SAVE_DEBOUNCE_MS);
  };

  const writeSnapshot = async (file: string) => {
    const body: PersistedShape = {
      version: 1,
      sessions: list().flatMap((s) => sessions.get(s.id) ?? []),
    };
    const tmp = `${file}.tmp`;
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(tmp, JSON.stringify(body), { encoding: 'utf8', mode: 0o600 });
      await fs.rename(tmp, file);
    } catch (err) {
      console.error('[open-slide] failed to save agent sessions:', err);
      await fs.rm(tmp, { force: true }).catch(() => {});
    }
  };

  // Saves share one temp file, so a flush racing a debounced save must wait
  // for it rather than interleave writes and renames.
  let saving: Promise<void> = Promise.resolve();
  const save = () => {
    const file = opts.file;
    if (!file) return saving;
    saving = saving.then(() => writeSnapshot(file));
    return saving;
  };

  const touch = (session: AgentSession) => {
    session.updatedAt = new Date().toISOString();
    order.set(session.id, seq++);
    emit({ type: 'session', session: sessionSummary(session) });
    scheduleSave();
  };

  const require = (id: string): AgentSession => {
    const session = sessions.get(id);
    if (!session) throw new Error(`unknown agent session: ${id}`);
    return session;
  };

  function list(): AgentSessionSummary[] {
    return Array.from(sessions.values())
      .sort((a, b) => {
        if (a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1;
        return (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0);
      })
      .map(sessionSummary);
  }

  function get(id: string): AgentSession | null {
    return sessions.get(id) ?? null;
  }

  function create(provider: AgentProviderId, slideId: string | null): AgentSession {
    const now = new Date().toISOString();
    const session: AgentSession = {
      id: newId('s'),
      provider,
      title: 'New session',
      createdAt: now,
      updatedAt: now,
      status: 'idle',
      slideId,
      providerSessionId: null,
      items: [],
    };
    sessions.set(session.id, session);
    order.set(session.id, seq++);
    const idle = list().filter((s) => s.status === 'idle');
    for (const stale of idle.slice(MAX_SESSIONS)) {
      sessions.delete(stale.id);
      order.delete(stale.id);
      emit({ type: 'session-removed', sessionId: stale.id });
    }
    touch(session);
    return session;
  }

  function remove(id: string): boolean {
    if (!sessions.delete(id)) return false;
    order.delete(id);
    emit({ type: 'session-removed', sessionId: id });
    scheduleSave();
    return true;
  }

  function patch(
    id: string,
    changes: Partial<
      Pick<
        AgentSession,
        'title' | 'status' | 'providerSessionId' | 'providerCheckpoint' | 'slideId'
      >
    >,
  ): AgentSession {
    const session = require(id);
    Object.assign(session, changes);
    touch(session);
    return session;
  }

  function appendItem<T extends AgentItem>(sessionId: string, item: T): T {
    const session = require(sessionId);
    session.items.push(item);
    if (session.items.length > MAX_ITEMS_PER_SESSION) {
      session.items.splice(0, session.items.length - MAX_ITEMS_PER_SESSION);
      session.trimmed = true;
    }
    emit({ type: 'item', sessionId, item });
    touch(session);
    return item;
  }

  function updateItem<K extends AgentItem['kind']>(
    sessionId: string,
    itemId: string,
    kind: K,
    changes: Partial<Extract<AgentItem, { kind: K }>>,
  ): Extract<AgentItem, { kind: K }> | null {
    const session = require(sessionId);
    const index = session.items.findIndex((i) => i.id === itemId && i.kind === kind);
    if (index === -1) return null;
    const next = { ...session.items[index], ...changes } as Extract<AgentItem, { kind: K }>;
    session.items[index] = next;
    emit({ type: 'item', sessionId, item: next });
    touch(session);
    return next;
  }

  function truncateFrom(sessionId: string, itemId: string): boolean {
    const session = require(sessionId);
    const index = session.items.findIndex((i) => i.id === itemId);
    if (index === -1) return false;
    session.items.splice(index);
    emit({ type: 'truncate', sessionId, itemId });
    touch(session);
    return true;
  }

  function appendDelta(sessionId: string, itemId: string, text: string): void {
    if (!text) return;
    const session = require(sessionId);
    const item = session.items.find((i) => i.id === itemId);
    if (item?.kind !== 'assistant') return;
    item.text += text;
    emit({ type: 'delta', sessionId, itemId, text });
    scheduleSave();
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  async function flush(): Promise<void> {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await save();
  }

  return {
    list,
    get,
    create,
    remove,
    patch,
    appendItem,
    updateItem,
    truncateFrom,
    appendDelta,
    subscribe,
    flush,
  };
}

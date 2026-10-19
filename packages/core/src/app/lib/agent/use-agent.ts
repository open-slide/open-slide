import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  AGENT_WS_EVENT,
  type AgentItem,
  type AgentProviderId,
  type AgentSession,
  type AgentSessionSummary,
  type AgentStatus,
  type AgentTurnContext,
  type AgentWsEvent,
} from '../../../agent/types';

export type { AgentItem, AgentProviderId, AgentSession, AgentSessionSummary, AgentStatus };

export type AgentRequest = {
  text: string;
  send: boolean;
  newSession?: boolean;
};

export type RespondPayload =
  | { answers: Record<string, string> }
  | { allow: boolean }
  | { cancel: true };

type State = {
  status: AgentStatus | null;
  statusError: boolean;
  sessions: AgentSessionSummary[];
  sessionsLoaded: boolean;
  full: Record<string, AgentSession>;
  activeId: string | null;
  provider: AgentProviderId;
  autoApprove: boolean;
  dockOpen: boolean;
  request: AgentRequest | null;
  installing: AgentProviderId | null;
  newDeck: string | null;
};

const ACTIVE_KEY = 'open-slide:agent-session';
const PROVIDER_KEY = 'open-slide:agent-provider';
const AUTO_APPROVE_KEY = 'open-slide:agent-auto-approve';
const DOCK_KEY = 'open-slide:agent-dock';
const NEW_DECK_KEY = 'open-slide:agent-new-deck';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
}

function isProviderId(value: string | null): value is AgentProviderId {
  return value === 'claude' || value === 'codex';
}

const available = import.meta.env.DEV && typeof window !== 'undefined';

let state: State = {
  status: null,
  statusError: false,
  sessions: [],
  sessionsLoaded: false,
  full: {},
  activeId: readStorage(ACTIVE_KEY),
  provider: (() => {
    const stored = readStorage(PROVIDER_KEY);
    return isProviderId(stored) ? stored : 'claude';
  })(),
  autoApprove: readStorage(AUTO_APPROVE_KEY) === '1',
  dockOpen: readStorage(DOCK_KEY) === '1',
  request: null,
  installing: null,
  newDeck: readStorage(NEW_DECK_KEY),
};

const listeners = new Set<() => void>();

function setState(patch: Partial<State> | ((prev: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureSocket();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): State {
  return state;
}

export function useAgentState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let socketBound = false;

function ensureSocket() {
  if (socketBound || !available || !import.meta.hot) return;
  socketBound = true;
  import.meta.hot.on(AGENT_WS_EVENT, (event: AgentWsEvent) => applyEvent(event));
  import.meta.hot.on('vite:ws:connect', () => {
    void refreshStatus();
    if (state.sessionsLoaded) void loadSessions();
    for (const id of Object.keys(state.full)) void loadSession(id);
  });
}

function upsertSummary(list: AgentSessionSummary[], summary: AgentSessionSummary) {
  const rest = list.filter((s) => s.id !== summary.id);
  return [summary, ...rest].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0,
  );
}

function applyEvent(event: AgentWsEvent) {
  switch (event.type) {
    case 'session':
      setState((prev) => {
        const current = prev.full[event.session.id];
        return {
          sessions: upsertSummary(prev.sessions, event.session),
          full: current
            ? { ...prev.full, [event.session.id]: { ...current, ...event.session } }
            : prev.full,
        };
      });
      return;
    case 'session-removed':
      setState((prev) => {
        const { [event.sessionId]: _gone, ...full } = prev.full;
        return {
          sessions: prev.sessions.filter((s) => s.id !== event.sessionId),
          full,
          activeId: prev.activeId === event.sessionId ? null : prev.activeId,
        };
      });
      return;
    case 'item':
      setState((prev) => {
        const current = prev.full[event.sessionId];
        if (!current) return {};
        const index = current.items.findIndex((i) => i.id === event.item.id);
        const items =
          index === -1
            ? [...current.items, event.item]
            : current.items.map((i, n) => (n === index ? event.item : i));
        return { full: { ...prev.full, [event.sessionId]: { ...current, items } } };
      });
      return;
    case 'delta':
      setState((prev) => {
        const current = prev.full[event.sessionId];
        if (!current) return {};
        const items = current.items.map((i): AgentItem => {
          if (i.id !== event.itemId || i.kind !== 'assistant') return i;
          return { ...i, text: i.text + event.text };
        });
        return { full: { ...prev.full, [event.sessionId]: { ...current, items } } };
      });
      return;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `${init?.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

function post(body?: unknown): RequestInit {
  return body === undefined
    ? { method: 'POST' }
    : {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      };
}

export async function refreshStatus(): Promise<void> {
  if (!available) return;
  try {
    const status = await request<AgentStatus>('/__agent/status');
    setState({ status, statusError: false });
  } catch {
    setState({ statusError: true });
  }
}

export async function loadSessions(): Promise<void> {
  if (!available) return;
  try {
    const { sessions } = await request<{ sessions: AgentSessionSummary[] }>('/__agent/sessions');
    setState((prev) => ({
      sessions,
      sessionsLoaded: true,
      activeId:
        prev.activeId && !sessions.some((s) => s.id === prev.activeId) ? null : prev.activeId,
    }));
  } catch {
    setState({ sessionsLoaded: true });
  }
}

export async function loadSession(id: string): Promise<AgentSession | null> {
  if (!available) return null;
  try {
    const session = await request<AgentSession>(`/__agent/sessions/${encodeURIComponent(id)}`);
    setState((prev) => ({ full: { ...prev.full, [id]: session } }));
    return session;
  } catch {
    setState((prev) => {
      const { [id]: _gone, ...full } = prev.full;
      return { full, activeId: prev.activeId === id ? null : prev.activeId };
    });
    return null;
  }
}

export async function createSession(
  provider: AgentProviderId,
  slideId: string | null,
): Promise<AgentSession> {
  const session = await request<AgentSession>('/__agent/sessions', post({ provider, slideId }));
  setState((prev) => ({
    full: { ...prev.full, [session.id]: session },
    sessions: upsertSummary(prev.sessions, session),
  }));
  setActiveSession(session.id);
  return session;
}

export async function deleteSession(id: string): Promise<void> {
  await request(`/__agent/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  applyEvent({ type: 'session-removed', sessionId: id });
}

export async function sendMessage(
  id: string,
  text: string,
  context: AgentTurnContext | undefined,
): Promise<void> {
  await request(
    `/__agent/sessions/${encodeURIComponent(id)}/messages`,
    post({ text, context, autoApprove: state.autoApprove }),
  );
}

export async function stopSession(id: string): Promise<void> {
  await request(`/__agent/sessions/${encodeURIComponent(id)}/stop`, post());
}

export async function respond(id: string, itemId: string, payload: RespondPayload): Promise<void> {
  await request(
    `/__agent/sessions/${encodeURIComponent(id)}/respond`,
    post({ itemId, ...payload }),
  );
}

export async function installProvider(provider: AgentProviderId): Promise<void> {
  setState({ installing: provider });
  try {
    await request('/__agent/install', post({ provider }));
    await refreshStatus();
  } finally {
    setState({ installing: null });
  }
}

export function setActiveSession(id: string | null): void {
  writeStorage(ACTIVE_KEY, id);
  setState({ activeId: id });
}

export function setPreferredProvider(provider: AgentProviderId): void {
  writeStorage(PROVIDER_KEY, provider);
  setState({ provider });
}

export function setAutoApprove(value: boolean): void {
  writeStorage(AUTO_APPROVE_KEY, value ? '1' : null);
  setState({ autoApprove: value });
}

export function setDockOpen(open: boolean): void {
  writeStorage(DOCK_KEY, open ? '1' : null);
  setState({ dockOpen: open });
}

export function requestAgent(req: AgentRequest): void {
  setState({ request: req, dockOpen: true });
  writeStorage(DOCK_KEY, '1');
}

// The blank deck is created up front and the user lands in it with the dock
// open; their first message there becomes the brief the agent drafts from.
export async function startBlankDeck(): Promise<void> {
  const { slideId } = await request<{ slideId: string }>('/__slides', post());
  writeStorage(NEW_DECK_KEY, slideId);
  setActiveSession(null);
  setDockOpen(true);
  window.location.assign(
    `${import.meta.env.BASE_URL.replace(/\/$/, '')}/s/${encodeURIComponent(slideId)}`,
  );
}

export function clearNewDeck(): void {
  writeStorage(NEW_DECK_KEY, null);
  setState({ newDeck: null });
}

export function consumeRequest(): AgentRequest | null {
  const req = state.request;
  if (req) setState({ request: null });
  return req;
}

export function readyProviders(status: AgentStatus | null) {
  return status?.enabled ? status.providers.filter((p) => p.ready) : [];
}

// Picks the provider the panel should talk to: the remembered choice when
// it's connected, else the first connected one.
export function resolveProvider(status: AgentStatus | null, preferred: AgentProviderId) {
  const ready = readyProviders(status);
  return ready.find((p) => p.id === preferred) ?? ready[0] ?? null;
}

export function useAgentStatus() {
  const s = useAgentState();
  useEffect(() => {
    if (!available || s.status) return;
    void refreshStatus();
  }, [s.status]);
  const provider = resolveProvider(s.status, s.provider);
  return {
    status: s.status,
    loading: s.status === null && !s.statusError,
    error: s.statusError,
    enabled: s.status?.enabled ?? false,
    connected: provider !== null,
    provider,
    providerName: provider?.name ?? null,
  };
}

export function useAgentConnected(): boolean {
  return useAgentStatus().connected;
}

export function useAgentSessions() {
  const s = useAgentState();
  useEffect(() => {
    if (!available || s.sessionsLoaded) return;
    void loadSessions();
  }, [s.sessionsLoaded]);
  return { sessions: s.sessions, loaded: s.sessionsLoaded, activeId: s.activeId };
}

export function useAgentSession(id: string | null): AgentSession | null {
  const s = useAgentState();
  const session = id ? (s.full[id] ?? null) : null;
  useEffect(() => {
    if (!available || !id || session) return;
    void loadSession(id);
  }, [id, session]);
  return session;
}

export function useAgentWriting(slideId: string): boolean {
  const { sessions } = useAgentSessions();
  return sessions.some((s) => s.slideId === slideId && s.status === 'running');
}

export function useAgentDock() {
  const s = useAgentState();
  const toggle = useCallback(() => setDockOpen(!state.dockOpen), []);
  return { open: s.dockOpen, setOpen: setDockOpen, toggle };
}

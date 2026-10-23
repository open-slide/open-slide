import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/lib/use-locale';
import {
  type AgentEffort,
  type AgentItem,
  type AgentModelOption,
  type AgentProviderId,
  type AgentSession,
  type AgentSessionSummary,
  type AgentStatus,
  type AgentStreamEvent,
  type AgentTurnContext,
  isAgentEffort,
  isAgentProviderId,
  type RespondPayload,
} from '../../../agent/types';

type ModelChoice = { model: string; effort: AgentEffort | null };

type AgentRequest = { text: string };

type State = {
  status: AgentStatus | null;
  statusError: boolean;
  sessions: AgentSessionSummary[];
  sessionsLoaded: boolean;
  full: Record<string, AgentSession>;
  activeId: string | null;
  provider: AgentProviderId;
  modelChoices: Partial<Record<AgentProviderId, ModelChoice>>;
  autoApprove: boolean;
  dockOpen: boolean;
  request: AgentRequest | null;
  installing: AgentProviderId | null;
  connectErrors: Partial<Record<AgentProviderId, string>>;
  newDeck: string | null;
};

const ACTIVE_KEY = 'open-slide:agent-session';
const PROVIDER_KEY = 'open-slide:agent-provider';
const MODEL_KEY = 'open-slide:agent-model';
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

function basePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function readModelChoices(): Partial<Record<AgentProviderId, ModelChoice>> {
  const choices: Partial<Record<AgentProviderId, ModelChoice>> = {};
  try {
    const raw = JSON.parse(readStorage(MODEL_KEY) ?? '{}') as Record<string, unknown>;
    for (const [provider, value] of Object.entries(raw)) {
      if (!isAgentProviderId(provider) || !value || typeof value !== 'object') continue;
      const v = value as Record<string, unknown>;
      if (typeof v.model !== 'string') continue;
      choices[provider] = { model: v.model, effort: isAgentEffort(v.effort) ? v.effort : null };
    }
  } catch {}
  return choices;
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
    return isAgentProviderId(stored) ? stored : 'claude';
  })(),
  modelChoices: readModelChoices(),
  autoApprove: readStorage(AUTO_APPROVE_KEY) === '1',
  dockOpen: readStorage(DOCK_KEY) === '1',
  request: null,
  installing: null,
  connectErrors: {},
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

let stream: EventSource | null = null;
let streamOpened = false;

function syncStream(enabled: boolean) {
  if (!enabled) {
    stream?.close();
    stream = null;
    return;
  }
  if (stream) return;
  stream = new EventSource('/__agent/events');
  stream.onmessage = (message) => applyEvent(JSON.parse(message.data) as AgentStreamEvent);
  stream.onopen = () => {
    // Anything streamed while disconnected is gone, so reload what is on screen.
    if (!streamOpened) {
      streamOpened = true;
      return;
    }
    void refreshStatus();
    if (state.sessionsLoaded) void loadSessions();
    for (const id of Object.keys(state.full)) void loadSession(id);
  };
}

function upsertSummary(list: AgentSessionSummary[], summary: AgentSessionSummary) {
  const rest = list.filter((s) => s.id !== summary.id);
  return [summary, ...rest].sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0,
  );
}

function applyEvent(event: AgentStreamEvent) {
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
    case 'truncate':
      setState((prev) => {
        const current = prev.full[event.sessionId];
        const index = current?.items.findIndex((i) => i.id === event.itemId) ?? -1;
        if (!current || index === -1) return {};
        const items = current.items.slice(0, index);
        return { full: { ...prev.full, [event.sessionId]: { ...current, items } } };
      });
      return;
    case 'slide-renamed':
      followSlideRename(event.from, event.to);
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

function followSlideRename(from: string, to: string) {
  const base = basePath();
  const prefix = `${base}/s/${encodeURIComponent(from)}`;
  const { pathname, search, hash } = window.location;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const rest = pathname.slice(prefix.length);
    window.location.replace(`${base}/s/${encodeURIComponent(to)}${rest}${search}${hash}`);
  } else if (!pathname.startsWith(`${base}/s/`)) {
    // The slide list is baked into the bundle, so pages listing decks reload
    // to pick up the new id. Another deck's page may hold unsaved edits, so it
    // is left alone and catches up on its next load.
    window.location.reload();
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
    syncStream(status.enabled);
  } catch {
    setState({ statusError: true });
  }
}

async function loadSessions(): Promise<void> {
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

async function loadSession(id: string): Promise<AgentSession | null> {
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

function turnSettings(id: string) {
  const provider = state.full[id]?.provider ?? state.provider;
  const status = state.status?.providers.find((p) => p.id === provider);
  const choice = status ? resolveModelChoice(status.models, state.modelChoices[provider]) : null;
  return {
    autoApprove: state.autoApprove,
    model: choice?.model.id || null,
    effort: choice?.effort ?? null,
  };
}

export async function sendMessage(
  id: string,
  text: string,
  context: AgentTurnContext | undefined,
  edit?: string,
): Promise<void> {
  await request(
    `/__agent/sessions/${encodeURIComponent(id)}/messages`,
    post({ text, context, ...turnSettings(id), edit }),
  );
}

export async function stopSession(id: string): Promise<void> {
  await request(`/__agent/sessions/${encodeURIComponent(id)}/stop`, post());
}

// Answers to questions that ended the turn start the next one, so they carry
// the same settings and context a new message would.
export async function respond(
  id: string,
  itemId: string,
  payload: RespondPayload,
  context: AgentTurnContext | undefined,
): Promise<void> {
  await request(
    `/__agent/sessions/${encodeURIComponent(id)}/respond`,
    post({ itemId, ...payload, context, ...turnSettings(id) }),
  );
}

export async function installProvider(provider: AgentProviderId): Promise<void> {
  setState((prev) => ({
    installing: provider,
    connectErrors: { ...prev.connectErrors, [provider]: undefined },
  }));
  try {
    await request('/__agent/install', post({ provider }));
    await refreshStatus();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setState((prev) => ({ connectErrors: { ...prev.connectErrors, [provider]: message } }));
    throw err;
  } finally {
    setState({ installing: null });
  }
}

let autoConnecting: Promise<void> | null = null;

export function autoConnect(): Promise<void> {
  if (autoConnecting) return autoConnecting;
  const status = state.status;
  if (!status?.enabled) return Promise.resolve();
  const pending = status.providers.filter(
    (p) => p.cliFound && !p.ready && !state.connectErrors[p.id],
  );
  if (pending.length === 0) return Promise.resolve();
  autoConnecting = (async () => {
    for (const p of pending) {
      await installProvider(p.id).catch(() => {});
    }
  })().finally(() => {
    autoConnecting = null;
  });
  return autoConnecting;
}

export function setActiveSession(id: string | null): void {
  writeStorage(ACTIVE_KEY, id);
  setState({ activeId: id });
}

export function setModelChoice(provider: AgentProviderId, choice: ModelChoice): void {
  const modelChoices = { ...state.modelChoices, [provider]: choice };
  writeStorage(MODEL_KEY, JSON.stringify(modelChoices));
  writeStorage(PROVIDER_KEY, provider);
  setState({ modelChoices, provider });
}

export function resolveModelChoice(
  models: AgentModelOption[],
  choice: ModelChoice | undefined,
): { model: AgentModelOption; effort: AgentEffort | null } | null {
  const model = models.find((m) => m.id === choice?.model) ?? models[0];
  if (!model) return null;
  const effort = choice?.effort && model.efforts.includes(choice.effort) ? choice.effort : null;
  return { model, effort };
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
let creatingDeck: Promise<void> | null = null;

function startBlankDeck(): Promise<void> {
  creatingDeck ??= (async () => {
    const { slideId } = await request<{ slideId: string }>('/__slides', post());
    writeStorage(NEW_DECK_KEY, slideId);
    setActiveSession(null);
    setDockOpen(true);
    window.location.assign(`${basePath()}/s/${encodeURIComponent(slideId)}`);
  })().finally(() => {
    creatingDeck = null;
  });
  return creatingDeck;
}

export function useCreateDeck(): () => Promise<void> {
  const t = useLocale();
  return useCallback(async () => {
    try {
      await startBlankDeck();
    } catch (err) {
      toast.error(t.agent.toastCreateDeckFailed, {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }, [t]);
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

function resolveProvider(status: AgentStatus | null, preferred: AgentProviderId) {
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
  const choice = provider ? resolveModelChoice(provider.models, s.modelChoices[provider.id]) : null;
  return {
    status: s.status,
    loading: s.status === null && !s.statusError,
    enabled: s.status?.enabled ?? false,
    connected: provider !== null,
    provider,
    providerName: provider?.name ?? null,
    model: choice?.model ?? null,
    effort: choice?.effort ?? null,
    modelChoices: s.modelChoices,
  };
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

export type AgentActivity = {
  provider: AgentProviderId;
  phase: 'thinking' | 'tool' | 'waiting';
  title: string | null;
  detail: string | null;
};

export function useAgentActivity(slideId: string): AgentActivity | null {
  const { sessions } = useAgentSessions();
  const summary = sessions.find((s) => s.slideId === slideId && s.status === 'running') ?? null;
  const session = useAgentSession(summary?.id ?? null);
  if (!summary) return null;
  const items = session?.items ?? [];
  const waiting = items.some(
    (i) => (i.kind === 'question' || i.kind === 'permission') && i.status === 'pending',
  );
  if (waiting) return { provider: summary.provider, phase: 'waiting', title: null, detail: null };
  const last = items.at(-1);
  if (last?.kind === 'tool' && last.status === 'running') {
    return { provider: summary.provider, phase: 'tool', title: last.title, detail: last.detail };
  }
  return { provider: summary.provider, phase: 'thinking', title: null, detail: null };
}

export function useAgentDock() {
  const s = useAgentState();
  const toggle = useCallback(() => setDockOpen(!state.dockOpen), []);
  return { open: s.dockOpen, setOpen: setDockOpen, toggle };
}

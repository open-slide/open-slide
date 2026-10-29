import config from 'virtual:open-slide/config';
import { useSyncExternalStore } from 'react';

export type ReleasePatch = { version: string; note: string };

export type ReleaseCover = { url: string; width: number; height: number; alt: string };

export type Release = {
  version: string;
  title: string;
  summary: string | null;
  highlights: string[];
  image: ReleaseCover | null;
  url: string | null;
  patches: ReleasePatch[];
};

export type UpdatePhase = 'idle' | 'installing' | 'syncing' | 'restarting' | 'done' | 'error';
export type WhatsNewMode = 'available' | 'updated' | 'current';

type UpdateStatus = {
  executionId: string;
  canRestart: boolean;
  phase: UpdatePhase;
  target: string | null;
  error: string | null;
};

type UpdateState = {
  latest: string | null;
  dismissed: boolean;
  phase: UpdatePhase;
  failure: 'update' | 'restart' | null;
  error: string | null;
  dialog: { open: boolean; mode: WhatsNewMode; from: string | null; to: string };
  // undefined while loading, null when the notes could not be fetched
  notes: Record<string, Release[] | null | undefined>;
};

const LAST_SEEN_KEY = 'open-slide:last-seen-version';
const DISMISSED_KEY = 'open-slide:update-dismissed';
const POLL_MS = 800;
const RESTART_TIMEOUT_MS = 90_000;
const BUSY: ReadonlySet<UpdatePhase> = new Set(['installing', 'syncing', 'restarting']);

// Module scope: the sidebar card, footer, dialog and command menu all read
// the same update, and only one poll loop may drive it.
let state: UpdateState = {
  latest: null,
  dismissed: false,
  phase: 'idle',
  failure: null,
  error: null,
  dialog: { open: false, mode: 'current', from: null, to: config.version },
  notes: {},
};
let initialized = false;
let polling = false;
const listeners = new Set<() => void>();

function setState(next: Partial<UpdateState>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): UpdateState {
  return state;
}

export function compareVersions(a: string, b: string): number {
  const x = a.split(/[.-]/, 3).map(Number);
  const y = b.split(/[.-]/, 3).map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (x[i] || 0) - (y[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function notesKey(from: string | null, to: string): string {
  return `${from ?? ''}..${to}`;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

const notesRequests = new Map<string, Promise<Release[] | null>>();

async function fetchNotes(from: string | null, to: string): Promise<Release[] | null> {
  const params = new URLSearchParams({ to });
  if (from) params.set('from', from);
  try {
    const res = await fetch(`/__release-notes?${params}`);
    if (!res.ok) return null;
    return ((await res.json()) as { releases: Release[] | null }).releases;
  } catch {
    return null;
  }
}

function loadNotes(from: string | null, to: string): Promise<Release[] | null> {
  const key = notesKey(from, to);
  let request = notesRequests.get(key);
  if (!request) {
    setState({ notes: { ...state.notes, [key]: undefined } });
    request = fetchNotes(from, to).then((releases) => {
      // forget failures so reopening the dialog retries
      if (!releases) notesRequests.delete(key);
      setState({ notes: { ...state.notes, [key]: releases } });
      return releases;
    });
    notesRequests.set(key, request);
  }
  return request;
}

async function fetchStatus(): Promise<UpdateStatus | null> {
  try {
    const res = await fetch('/__update-package', { cache: 'no-store' });
    return res.ok ? ((await res.json()) as UpdateStatus) : null;
  } catch {
    return null;
  }
}

function openDialog(mode: WhatsNewMode, from: string | null, to: string): void {
  setState({ dialog: { open: true, mode, from, to } });
  void loadNotes(from, to);
}

async function poll(beforeId: string): Promise<void> {
  if (polling) return;
  polling = true;
  let downSince: number | null = null;
  try {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      const status = await fetchStatus();
      if (status && status.executionId !== beforeId) {
        window.location.reload();
        return;
      }
      if (!status) {
        downSince ??= Date.now();
        if (Date.now() - downSince > RESTART_TIMEOUT_MS) {
          setState({ phase: 'error', failure: 'restart', error: null });
          return;
        }
        setState({ phase: 'restarting' });
        continue;
      }
      downSince = null;
      setState({
        phase: status.phase,
        failure: status.phase === 'error' ? 'update' : null,
        error: status.error,
        latest: status.target ?? state.latest,
      });
      if (!BUSY.has(status.phase)) return;
    }
  } finally {
    polling = false;
  }
}

async function showWhatsNewAfterUpdate(): Promise<void> {
  const seen = readStorage(LAST_SEEN_KEY);
  writeStorage(LAST_SEEN_KEY, config.version);
  if (!seen || compareVersions(config.version, seen) <= 0) return;
  const releases = await loadNotes(seen, config.version);
  if (releases?.length && !state.dialog.open) openDialog('updated', seen, config.version);
}

async function checkForUpdate(): Promise<void> {
  try {
    const res = await fetch('/__update-check');
    if (!res.ok) return;
    const check = (await res.json()) as { latest: string | null; outdated: boolean };
    if (!check.outdated || !check.latest) return;
    setState({ latest: check.latest, dismissed: readStorage(DISMISSED_KEY) === check.latest });
    void loadNotes(config.version, check.latest);
  } catch {}
}

// A reload mid-update (the user's, or Vite reacting to node_modules churn)
// lands back on a locked dialog instead of a page that looks idle.
async function resumeRunningUpdate(): Promise<void> {
  const status = await fetchStatus();
  if (!status || !BUSY.has(status.phase)) return;
  const target = status.target ?? state.latest ?? config.version;
  setState({ phase: status.phase, latest: target });
  openDialog('available', config.version, target);
  void poll(status.executionId);
}

export function initUpdates(): void {
  if (!import.meta.env.DEV || initialized) return;
  initialized = true;
  void showWhatsNewAfterUpdate();
  void checkForUpdate();
  void resumeRunningUpdate();
}

export function isUpdateLocked(): boolean {
  return BUSY.has(state.phase);
}

export function openWhatsNew(): void {
  if (state.latest) openDialog('available', config.version, state.latest);
  else openDialog('current', null, config.version);
}

export function closeWhatsNew(): void {
  if (isUpdateLocked()) return;
  setState({
    dialog: { ...state.dialog, open: false },
    ...(state.phase === 'error' ? { phase: 'idle', failure: null, error: null } : {}),
  });
}

export function dismissUpdate(): void {
  if (state.latest) writeStorage(DISMISSED_KEY, state.latest);
  setState({ dismissed: true });
}

export async function startUpdate(): Promise<void> {
  if (isUpdateLocked() || !state.latest) return;
  openDialog('available', config.version, state.latest);
  setState({ phase: 'installing', failure: null, error: null });
  let status: UpdateStatus | null = null;
  try {
    const res = await fetch('/__update-package', { method: 'POST' });
    if (res.ok) status = (await res.json()) as UpdateStatus;
  } catch {}
  if (!status) {
    setState({ phase: 'error', failure: 'update', error: null });
    return;
  }
  setState({ phase: status.phase });
  void poll(status.executionId);
}

export function useUpdate(): UpdateState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { forgetWrite, onAbandon, trackWrite, useUnsavedSource } from '@/lib/unsaved';

export type NoteSaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

const DEBOUNCE_MS = 600;

type Target = { slideId: string; index: number };
type Detached = Target & { text: string; seq: number };
type Editor = { target: { current: Target }; drop: () => void };
type WriteResult = { kind: 'saved' } | { kind: 'skipped' } | { kind: 'error'; message: string };

// HMR is suppressed for our writes, so the cached slide module's `notes`
// stays stale across navigation. Cache last-saved text per target so
// switching slides and back doesn't surface the old value.
const sessionCache = new Map<string, string>();
// Text left on a page whose write is still landing or failed, shown on return
// instead of the older text on disk. Each entry is also its tracked write's key,
// so a retry follows its page when pages move.
const detached = new Set<Detached>();
onAbandon(() => detached.clear());
// Shared by every editor, so a newer write cancels an older one to the same
// notes even when the editor that started it has unmounted.
const inflight = new Map<string, { ctl: AbortController }>();
// Every write from its start, including ones still waiting to send, so a page
// change can wait for those not held back by another page change.
const pending = new Set<{ slideId: string; settled: Promise<unknown> }>();
// Targets of writes held back by a page change; moved with the pages before they send.
const waiting = new Set<Target>();
const editors = new Set<Editor>();
const pageChanges = new Map<string, Promise<void>>();
// The server's fingerprint of each deck's page list that note indices currently
// refer to. Saves carry it, so one that reaches the server after the pages
// moved, such as an aborted request, is refused instead of hitting another page.
const layouts = new Map<string, string>();
let pageChangeCount = 0;
let seq = 0;

const cacheKey = (slideId: string, index: number) => `${slideId}:${index}`;
const sameTarget = (a: Target, b: Target) => a.slideId === b.slideId && a.index === b.index;

function findDetached(target: Target): Detached | undefined {
  for (const entry of detached) if (sameTarget(entry, target)) return entry;
  return undefined;
}

function writing(target: Target): boolean {
  if (inflight.has(cacheKey(target.slideId, target.index))) return true;
  for (const slot of waiting) if (sameTarget(slot, target)) return true;
  return false;
}

export function cachedNotes(slideId: string, index: number): string | undefined {
  return findDetached({ slideId, index })?.text ?? sessionCache.get(cacheKey(slideId, index));
}

const errorMessage = (err: unknown) => String((err as Error).message ?? err);

async function fetchLayout(slideId: string): Promise<string> {
  const res = await fetch(`/__notes?slideId=${encodeURIComponent(slideId)}`);
  const body = (await res.json().catch(() => ({}))) as { layout?: unknown; error?: string };
  if (!res.ok || typeof body.layout !== 'string') {
    throw new Error(body.error ?? `GET /__notes → ${res.status}`);
  }
  return body.layout;
}

async function settledLayout(slideId: string): Promise<string> {
  for (;;) {
    const change = pageChanges.get(slideId);
    if (change) {
      await change;
      continue;
    }
    const known = layouts.get(slideId);
    if (known !== undefined) return known;
    const count = pageChangeCount;
    const layout = await fetchLayout(slideId);
    if (pageChangeCount === count) layouts.set(slideId, layout);
  }
}

// Resolves to the failure, or a skip once a newer write to the same notes took
// over or the page was deleted; writes to other notes are never cut off.
function writeNotes(target: Target, text: string): Promise<WriteResult> {
  const write = { slideId: target.slideId, settled: sendNotes(target, text) };
  pending.add(write);
  void write.settled.then(() => pending.delete(write));
  return write.settled;
}

async function sendNotes(target: Target, text: string): Promise<WriteResult> {
  const slot = { ...target };
  waiting.add(slot);
  let layout: string;
  try {
    layout = await settledLayout(slot.slideId);
  } catch (err) {
    return { kind: 'error', message: errorMessage(err) };
  } finally {
    waiting.delete(slot);
  }
  if (slot.index < 0) return { kind: 'skipped' };

  const key = cacheKey(slot.slideId, slot.index);
  const startSeq = seq;
  inflight.get(key)?.ctl.abort();
  const ctl = new AbortController();
  const entry = { ctl };
  inflight.set(key, entry);
  try {
    const res = await fetch('/__notes', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slideId: slot.slideId, index: slot.index, text, layout }),
      signal: ctl.signal,
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; layout?: unknown };
    if (inflight.get(key) !== entry) return { kind: 'skipped' };
    // Refused because the page list changed on disk outside a page change made
    // here; the text stays unsaved and its next save targets the list now on disk.
    if (res.status === 409 && typeof body.layout === 'string') {
      if (layouts.get(slot.slideId) === layout) layouts.set(slot.slideId, body.layout);
    }
    if (!res.ok) throw new Error(body.error ?? `PUT /__notes → ${res.status}`);
    sessionCache.set(key, text);
    for (const left of detached) {
      if (!sameTarget(left, slot) || left.seq > startSeq) continue;
      detached.delete(left);
      forgetWrite(left);
    }
    return { kind: 'saved' };
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') return { kind: 'skipped' };
    return { kind: 'error', message: errorMessage(err) };
  } finally {
    if (inflight.get(key) === entry) inflight.delete(key);
  }
}

// For text whose editor has moved on; a failed write is retried until it lands.
export function detachNotes(target: Target, text: string): void {
  let entry = findDetached(target);
  if (entry) {
    entry.text = text;
    entry.seq = ++seq;
  } else {
    entry = { ...target, text, seq: ++seq };
    detached.add(entry);
  }
  const owned = entry;
  trackWrite(owned, async () => {
    const result = await writeNotes(owned, owned.text);
    if (result.kind === 'error') throw new Error(result.message);
  });
}

// `order[i]` is the original page index that lands at new position `i`; a
// duplicated page appears twice and a deleted one not at all.
function movePages(slideId: string, order: number[]) {
  const moved = new Map<number, number>();
  order.forEach((from, to) => {
    if (!moved.has(from)) moved.set(from, to);
  });

  for (const editor of editors) {
    const target = editor.target.current;
    if (target.slideId === slideId && !moved.has(target.index)) editor.drop();
  }

  const prefix = `${slideId}:`;
  const cached = new Map<number, string>();
  for (const [key, text] of sessionCache) {
    if (!key.startsWith(prefix)) continue;
    cached.set(Number(key.slice(prefix.length)), text);
    sessionCache.delete(key);
  }
  order.forEach((from, to) => {
    const text = cached.get(from);
    if (text !== undefined) sessionCache.set(cacheKey(slideId, to), text);
  });

  const targets = [...[...editors].map((editor) => editor.target.current), ...detached, ...waiting];
  const removed: [Target, number][] = [];
  for (const target of targets) {
    if (target.slideId !== slideId || target.index < 0) continue;
    const to = moved.get(target.index);
    if (to === undefined) removed.push([target, target.index]);
    target.index = to ?? -1;
  }

  return {
    commit() {
      for (const entry of detached) {
        if (entry.slideId !== slideId || entry.index >= 0) continue;
        detached.delete(entry);
        forgetWrite(entry);
      }
    },
    rollback() {
      for (const [key] of sessionCache) if (key.startsWith(prefix)) sessionCache.delete(key);
      for (const [index, text] of cached) sessionCache.set(cacheKey(slideId, index), text);
      const current = [
        ...[...editors].map((editor) => editor.target.current),
        ...detached,
        ...waiting,
      ];
      for (const target of current) {
        if (target.slideId === slideId && target.index >= 0) target.index = order[target.index];
      }
      for (const [target, index] of removed) target.index = index;
    },
  };
}

export type NotesPageChange = {
  order: number[];
  // Resolves to the server's page-list fingerprint after the change.
  apply: () => Promise<string | undefined>;
  revert: () => void;
};

// Note writes are bound to a page index, so a page change waits for the ones in
// flight, holds back new ones until it settles, and moves cached text, unsaved
// editors and failed retries along with their pages. `plan` runs once nothing is
// in flight; its `apply` makes the change, and if it throws, the notes and
// `revert` roll back unless the server's page list shows the change landed.
export async function changeNotesPages(
  slideId: string,
  plan: () => NotesPageChange | null,
): Promise<boolean> {
  for (;;) {
    const change = pageChanges.get(slideId);
    if (change) {
      await change;
      continue;
    }
    const writes = [...pending].filter((write) => write.slideId === slideId);
    if (writes.length === 0) break;
    await Promise.all(writes.map((write) => write.settled));
  }

  let done = () => {};
  pageChanges.set(slideId, new Promise<void>((resolve) => (done = resolve)));
  pageChangeCount++;
  try {
    const before = await fetchLayout(slideId);
    layouts.set(slideId, before);
    const next = plan();
    if (!next) return false;
    const moved = movePages(slideId, next.order);
    let after: string | undefined;
    try {
      after = await next.apply();
    } catch (err) {
      after = await fetchLayout(slideId).catch(() => before);
      if (after === before) {
        moved.rollback();
        next.revert();
        throw err;
      }
    }
    moved.commit();
    if (after === undefined) layouts.delete(slideId);
    else layouts.set(slideId, after);
    return true;
  } finally {
    pageChanges.delete(slideId);
    done();
  }
}

export function useNotes(slideId: string, index: number, initial: string | undefined) {
  const initialText = cachedNotes(slideId, index) ?? initial ?? '';
  const [value, setValueState] = useState(initialText);
  const [status, setStatus] = useState<NoteSaveStatus>({ kind: 'idle' });
  const [dropped, setDropped] = useState(0);

  const lastSavedRef = useRef(initialText);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<Target>({ slideId, index });
  const valueRef = useRef(value);
  valueRef.current = value;

  const cancelTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persist = useCallback(async (target: Target, text: string): Promise<string | null> => {
    const showing = () => sameTarget(targetRef.current, target);
    if (showing()) setStatus({ kind: 'saving' });
    const result = await writeNotes(target, text);
    if (result.kind === 'skipped') return null;
    if (result.kind === 'error') {
      if (showing()) setStatus({ kind: 'error', message: result.message });
      return result.message;
    }
    if (!showing()) return null;
    lastSavedRef.current = text;
    // Text typed while this was in flight still waits on its own save.
    dirtyRef.current = valueRef.current !== text;
    setStatus({ kind: 'saved' });
    return null;
  }, []);

  const persistOrThrow = useCallback(
    async (target: Target, text: string) => {
      const error = await persist(target, text);
      if (error) throw new Error(error);
    },
    [persist],
  );

  // Even text put back to the last save goes out, since a write still in flight may
  // land something else.
  const detachDirty = useCallback(() => {
    cancelTimer();
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    detachNotes(targetRef.current, valueRef.current);
  }, [cancelTimer]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `dropped` re-runs this when the page under this editor is deleted, since its props may not change
  useEffect(() => {
    const targetChanged = !sameTarget(targetRef.current, { slideId, index });
    if (targetChanged) {
      detachDirty();
      targetRef.current = { slideId, index };
    } else if (initialText === lastSavedRef.current) {
      // A save updates the cache `initialText` reads; adopting that echo would
      // drop text typed while the save was in flight.
      return;
    }
    cancelTimer();
    setValueState(initialText);
    lastSavedRef.current = initialText;
    dirtyRef.current = false;
    setStatus({ kind: 'idle' });
  }, [slideId, index, initialText, dropped, detachDirty, cancelTimer]);

  useEffect(() => {
    const editor: Editor = {
      target: targetRef,
      drop: () => {
        detachDirty();
        setDropped((n) => n + 1);
      },
    };
    editors.add(editor);
    return () => {
      editors.delete(editor);
      detachDirty();
    };
  }, [detachDirty]);

  const flush = useCallback(async () => {
    cancelTimer();
    if (!dirtyRef.current) return;
    await persist(targetRef.current, valueRef.current);
  }, [cancelTimer, persist]);

  useUnsavedSource({
    kind: 'autosave',
    dirty: () => dirtyRef.current || writing(targetRef.current),
    save: () => {
      cancelTimer();
      return persistOrThrow(targetRef.current, valueRef.current);
    },
    discard: () => {
      cancelTimer();
      const { slideId: id, index: at } = targetRef.current;
      inflight.get(cacheKey(id, at))?.ctl.abort();
      dirtyRef.current = false;
      setValueState(lastSavedRef.current);
      setStatus({ kind: 'idle' });
    },
  });

  const setValue = useCallback(
    (next: string) => {
      setValueState(next);
      valueRef.current = next;
      // Text put back to the last save still goes out after a write in flight lands.
      dirtyRef.current = next !== lastSavedRef.current || writing(targetRef.current);
      cancelTimer();
      if (!dirtyRef.current) {
        setStatus({ kind: 'idle' });
        return;
      }
      const target = targetRef.current;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void persist(target, next);
      }, DEBOUNCE_MS);
    },
    [persist, cancelTimer],
  );

  return { value, setValue, status, flush };
}

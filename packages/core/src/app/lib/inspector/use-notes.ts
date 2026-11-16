import { useCallback, useEffect, useRef, useState } from 'react';
import { forgetWrite, onAbandon, trackWrite, useUnsavedSource } from '@/lib/unsaved';

export type NoteSaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

const DEBOUNCE_MS = 600;

type Target = { slideId: string; index: number };

// HMR is suppressed for our writes, so the cached slide module's `notes`
// stays stale across navigation. Cache last-saved text per target so
// switching slides and back doesn't surface the old value.
const sessionCache = new Map<string, string>();
// Text left behind on a slide whose write is still landing or failed. Coming
// back shows it instead of the older text on disk, which a later save would
// otherwise write over it.
const detachedText = new Map<string, string>();
onAbandon(() => detachedText.clear());
const cacheKey = (slideId: string, index: number) => `${slideId}:${index}`;
const writeKey = (key: string) => `notes:${key}`;

function remapCache(cache: Map<string, string>, slideId: string, order: number[]): void {
  const prev = new Map<number, string>();
  for (let i = 0; i < order.length; i++) {
    const cached = cache.get(cacheKey(slideId, i));
    if (cached !== undefined) prev.set(i, cached);
    cache.delete(cacheKey(slideId, i));
  }
  for (let newIdx = 0; newIdx < order.length; newIdx++) {
    const oldIdx = order[newIdx];
    const text = prev.get(oldIdx);
    if (text !== undefined) cache.set(cacheKey(slideId, newIdx), text);
  }
}

// Remap the per-target cache after a reorder. `order[i]` is the original
// page index that lands at new position `i`, matching the contract used by
// the `/__slides/:id/reorder` endpoint.
export function remapNotesSessionCacheAfterReorder(slideId: string, order: number[]): void {
  remapCache(sessionCache, slideId, order);
  remapCache(detachedText, slideId, order);
}

export function useNotes(slideId: string, index: number, initial: string | undefined) {
  const key = cacheKey(slideId, index);
  const initialText = detachedText.get(key) ?? sessionCache.get(key) ?? initial ?? '';
  const [value, setValueState] = useState(initialText);
  const [status, setStatus] = useState<NoteSaveStatus>({ kind: 'idle' });

  const lastSavedRef = useRef(initialText);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(new Map<string, AbortController>());
  const targetRef = useRef<Target>({ slideId, index });
  const valueRef = useRef(value);
  valueRef.current = value;

  const cancelTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Resolves to the failure, or null once the text is on disk or a newer
  // write to the same notes has taken over. Only that cancels a write: one
  // still landing for the slide just left is not cut off by typing on the next.
  const persist = useCallback(async (target: Target, text: string): Promise<string | null> => {
    const key = cacheKey(target.slideId, target.index);
    const inflight = inflightRef.current;
    inflight.get(key)?.abort();
    const ctl = new AbortController();
    inflight.set(key, ctl);
    const showing = () => cacheKey(targetRef.current.slideId, targetRef.current.index) === key;
    if (showing()) setStatus({ kind: 'saving' });
    try {
      const res = await fetch('/__notes', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId: target.slideId, index: target.index, text }),
        signal: ctl.signal,
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? `PUT /__notes → ${res.status}`);
      sessionCache.set(key, text);
      // Writes to one key never overlap, so this one is the newest text.
      detachedText.delete(key);
      forgetWrite(writeKey(key));
      if (!showing()) return null;
      lastSavedRef.current = text;
      if (inflight.get(key) !== ctl) return null;
      // Text typed while this was in flight still waits on its own save.
      dirtyRef.current = valueRef.current !== text;
      setStatus({ kind: 'saved' });
      return null;
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return null;
      const message = String((err as Error).message ?? err);
      if (showing()) setStatus({ kind: 'error', message });
      return message;
    } finally {
      if (inflight.get(key) === ctl) inflight.delete(key);
    }
  }, []);

  // For a write nothing here will wait on: the page still counts as unsaved
  // until it lands, and a failure is retried with the page's other work.
  const persistDetached = useCallback(
    (target: Target, text: string) => {
      const key = cacheKey(target.slideId, target.index);
      detachedText.set(key, text);
      trackWrite(writeKey(key), async () => {
        const error = await persist(target, text);
        if (error) throw new Error(error);
      });
    },
    [persist],
  );

  const flush = useCallback(async () => {
    cancelTimer();
    if (!dirtyRef.current) return;
    const target = targetRef.current;
    await persist(target, valueRef.current);
  }, [cancelTimer, persist]);

  // When the (slideId, index) target changes, flush pending edits for the
  // previous target before adopting the new initial text.
  useEffect(() => {
    const prev = targetRef.current;
    const targetChanged = prev.slideId !== slideId || prev.index !== index;
    if (targetChanged && dirtyRef.current) {
      cancelTimer();
      const pending = valueRef.current;
      if (lastSavedRef.current !== pending) persistDetached(prev, pending);
    }
    targetRef.current = { slideId, index };
    // A save here updates the cache `initialText` reads from. That is this
    // editor's own text coming back, not new text to adopt: taking it would
    // drop whatever was typed while the save was in flight.
    if (!targetChanged && initialText === lastSavedRef.current) return;
    cancelTimer();
    setValueState(initialText);
    lastSavedRef.current = initialText;
    dirtyRef.current = false;
    setStatus({ kind: 'idle' });
  }, [slideId, index, initialText, persistDetached, cancelTimer]);

  // Unmounting mid-edit writes what was typed instead of dropping it.
  useEffect(() => {
    return () => {
      cancelTimer();
      if (dirtyRef.current) persistDetached(targetRef.current, valueRef.current);
    };
  }, [cancelTimer, persistDetached]);

  useUnsavedSource({
    kind: 'autosave',
    dirty: () => dirtyRef.current,
    save: async () => {
      cancelTimer();
      const error = await persist(targetRef.current, valueRef.current);
      if (error) throw new Error(error);
    },
    discard: () => {
      cancelTimer();
      const { slideId: id, index: at } = targetRef.current;
      inflightRef.current.get(cacheKey(id, at))?.abort();
      dirtyRef.current = false;
      setValueState(lastSavedRef.current);
      setStatus({ kind: 'idle' });
    },
  });

  const setValue = useCallback(
    (next: string) => {
      setValueState(next);
      valueRef.current = next;
      dirtyRef.current = next !== lastSavedRef.current;
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

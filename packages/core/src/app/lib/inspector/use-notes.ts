import { useCallback, useEffect, useRef, useState } from 'react';

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
const cacheKey = (slideId: string, index: number) => `${slideId}:${index}`;

// Remap the per-target cache after a reorder. `order[i]` is the original
// page index that lands at new position `i`, matching the contract used by
// the `/__slides/:id/reorder` endpoint.
export function remapNotesSessionCacheAfterReorder(slideId: string, order: number[]): void {
  const prev = new Map<number, string>();
  for (let i = 0; i < order.length; i++) {
    const cached = sessionCache.get(cacheKey(slideId, i));
    if (cached !== undefined) prev.set(i, cached);
    sessionCache.delete(cacheKey(slideId, i));
  }
  for (let newIdx = 0; newIdx < order.length; newIdx++) {
    const oldIdx = order[newIdx];
    const text = prev.get(oldIdx);
    if (text !== undefined) sessionCache.set(cacheKey(slideId, newIdx), text);
  }
}

/**
 * Saves must survive navigation to other pages so their responses can refresh
 * the session cache while note-write HMR is suppressed.
 */
export function useNotes(slideId: string, index: number, initial: string | undefined) {
  const initialText = sessionCache.get(cacheKey(slideId, index)) ?? initial ?? '';
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

  const persist = useCallback(
    async (target: Target, text: string) => {
      const key = cacheKey(target.slideId, target.index);
      inflightRef.current.get(key)?.abort();
      const ctl = new AbortController();
      inflightRef.current.set(key, ctl);
      const isCurrentTarget = () =>
        targetRef.current.slideId === target.slideId && targetRef.current.index === target.index;
      if (isCurrentTarget()) setStatus({ kind: 'saving' });
      try {
        const res = await fetch('/__notes', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slideId: target.slideId, index: target.index, text }),
          signal: ctl.signal,
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(body.error ?? `PUT /__notes → ${res.status}`);
        if (inflightRef.current.get(key) !== ctl || ctl.signal.aborted) return;
        sessionCache.set(key, text);
        if (!isCurrentTarget()) return;
        lastSavedRef.current = text;
        dirtyRef.current = valueRef.current !== text;
        if (!dirtyRef.current) cancelTimer();
        setStatus({ kind: dirtyRef.current ? 'idle' : 'saved' });
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        if (inflightRef.current.get(key) !== ctl || ctl.signal.aborted || !isCurrentTarget())
          return;
        setStatus({ kind: 'error', message: String((err as Error).message ?? err) });
      } finally {
        if (inflightRef.current.get(key) === ctl) inflightRef.current.delete(key);
      }
    },
    [cancelTimer],
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
    if (!targetChanged) return;
    if (dirtyRef.current) {
      cancelTimer();
      const pending = valueRef.current;
      void persist(prev, pending);
    }
    targetRef.current = { slideId, index };
    cancelTimer();
    setValueState(initialText);
    valueRef.current = initialText;
    lastSavedRef.current = initialText;
    dirtyRef.current = false;
    setStatus({ kind: 'idle' });
  }, [slideId, index, initialText, persist, cancelTimer]);

  useEffect(() => {
    return () => {
      cancelTimer();
      for (const ctl of inflightRef.current.values()) ctl.abort();
      inflightRef.current.clear();
    };
  }, [cancelTimer]);

  const setValue = useCallback(
    (next: string) => {
      setValueState(next);
      valueRef.current = next;
      const target = targetRef.current;
      dirtyRef.current =
        next !== lastSavedRef.current ||
        inflightRef.current.has(cacheKey(target.slideId, target.index));
      cancelTimer();
      if (!dirtyRef.current) {
        setStatus({ kind: 'idle' });
        return;
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void persist(target, next);
      }, DEBOUNCE_MS);
    },
    [persist, cancelTimer],
  );

  return { value, setValue, status, flush };
}

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type HistoryEntry = {
  undo: () => void;
  redo: () => void;
  coalesceKey?: string;
  pageIndex?: number;
  // Set on entries whose change only lives in a provider's in-memory buffer.
  // When that buffer is written to disk the owner `settle`s them, replacing
  // them with one entry that undoes the write itself.
  bufferedBy?: string;
  ts: number;
  seq: number;
};

type NewEntry = Omit<HistoryEntry, 'ts' | 'seq'>;

type HistoryCtx = {
  canUndo: boolean;
  canRedo: boolean;
  record: (entry: NewEntry) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  // Sequence number of the newest entry; pass it to `settle` to cover only
  // the entries that existed when a write started.
  mark: () => number;
  settle: (owner: string, upTo: number, entry: NewEntry | null) => void;
};

const COALESCE_WINDOW_MS = 500;

const Ctx = createContext<HistoryCtx | null>(null);

export function useHistory(): HistoryCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHistory must be used inside <HistoryProvider>');
  return v;
}

export function HistoryProvider({
  pageIndex,
  onPageChange,
  children,
}: {
  pageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  children: ReactNode;
}) {
  const stacksRef = useRef<{ past: HistoryEntry[]; future: HistoryEntry[] }>({
    past: [],
    future: [],
  });
  const [availability, setAvailability] = useState({ canUndo: false, canRedo: false });
  // Set while invoking an entry's undo/redo so providers can skip
  // re-recording the resulting state mutation.
  const suppressedRef = useRef(false);
  const pageRef = useRef({ pageIndex, onPageChange });
  pageRef.current = { pageIndex, onPageChange };

  // An entry made on another page changes DOM the user can't see, so bring
  // its page into view; the page's remount replays the restored buffer.
  const revealPage = useCallback((entry: HistoryEntry) => {
    const { pageIndex: current, onPageChange: goTo } = pageRef.current;
    if (entry.pageIndex !== undefined && entry.pageIndex !== current) goTo?.(entry.pageIndex);
  }, []);

  const seqRef = useRef(0);

  const syncAvailability = useCallback(() => {
    const canUndo = stacksRef.current.past.length > 0;
    const canRedo = stacksRef.current.future.length > 0;
    setAvailability((previous) =>
      previous.canUndo === canUndo && previous.canRedo === canRedo
        ? previous
        : { canUndo, canRedo },
    );
  }, []);

  const record = useCallback(
    (entry: NewEntry) => {
      if (suppressedRef.current) return;
      const ts = Date.now();
      const seq = ++seqRef.current;
      const { past } = stacksRef.current;
      const top = past.at(-1);
      if (
        top &&
        entry.coalesceKey !== undefined &&
        top.coalesceKey === entry.coalesceKey &&
        top.pageIndex === entry.pageIndex &&
        top.bufferedBy === entry.bufferedBy &&
        ts - top.ts < COALESCE_WINDOW_MS
      ) {
        const merged: HistoryEntry = {
          undo: top.undo,
          redo: entry.redo,
          coalesceKey: entry.coalesceKey,
          pageIndex: entry.pageIndex,
          bufferedBy: entry.bufferedBy,
          ts,
          seq,
        };
        stacksRef.current = { past: [...past.slice(0, -1), merged], future: [] };
      } else {
        stacksRef.current = { past: [...past, { ...entry, ts, seq }], future: [] };
      }
      syncAvailability();
    },
    [syncAvailability],
  );

  const undo = useCallback(() => {
    if (suppressedRef.current) return;
    const previous = stacksRef.current;
    const top = previous.past.at(-1);
    if (!top) return;
    const next = { past: previous.past.slice(0, -1), future: [...previous.future, top] };
    stacksRef.current = next;
    suppressedRef.current = true;
    try {
      top.undo();
    } catch (error) {
      if (stacksRef.current === next) stacksRef.current = previous;
      throw error;
    } finally {
      suppressedRef.current = false;
      syncAvailability();
    }
    revealPage(top);
  }, [syncAvailability, revealPage]);

  const redo = useCallback(() => {
    if (suppressedRef.current) return;
    const previous = stacksRef.current;
    const top = previous.future.at(-1);
    if (!top) return;
    const next = { past: [...previous.past, top], future: previous.future.slice(0, -1) };
    stacksRef.current = next;
    suppressedRef.current = true;
    try {
      top.redo();
    } catch (error) {
      if (stacksRef.current === next) stacksRef.current = previous;
      throw error;
    } finally {
      suppressedRef.current = false;
      syncAvailability();
    }
    revealPage(top);
  }, [syncAvailability, revealPage]);

  const clear = useCallback(() => {
    stacksRef.current = { past: [], future: [] };
    syncAvailability();
  }, [syncAvailability]);

  const mark = useCallback(() => seqRef.current, []);

  const settle = useCallback(
    (owner: string, upTo: number, entry: NewEntry | null) => {
      const settled = (item: HistoryEntry) => item.bufferedBy === owner && item.seq <= upTo;
      const { past, future } = stacksRef.current;
      const kept = past.filter((item) => !settled(item));
      // Anything recorded after the write started is still buffered and stays
      // above the entry that stands in for the write.
      const later = kept.filter((item) => item.bufferedBy && item.seq > upTo);
      const earlier = kept.filter((item) => !later.includes(item));
      const replacement = entry ? [{ ...entry, ts: Date.now(), seq: upTo }] : [];
      stacksRef.current = {
        past: [...earlier, ...replacement, ...later],
        future: future.filter((item) => !settled(item) && !entry),
      };
      syncAvailability();
    },
    [syncAvailability],
  );

  const value = useMemo<HistoryCtx>(
    () => ({
      canUndo: availability.canUndo,
      canRedo: availability.canRedo,
      record,
      undo,
      redo,
      clear,
      mark,
      settle,
    }),
    [availability.canUndo, availability.canRedo, record, undo, redo, clear, mark, settle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

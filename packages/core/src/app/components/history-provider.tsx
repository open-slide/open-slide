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
  ts: number;
};

type HistoryCtx = {
  canUndo: boolean;
  canRedo: boolean;
  record: (entry: Omit<HistoryEntry, 'ts'>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
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
    (entry: Omit<HistoryEntry, 'ts'>) => {
      if (suppressedRef.current) return;
      const ts = Date.now();
      const { past } = stacksRef.current;
      const top = past.at(-1);
      if (
        top &&
        entry.coalesceKey !== undefined &&
        top.coalesceKey === entry.coalesceKey &&
        top.pageIndex === entry.pageIndex &&
        ts - top.ts < COALESCE_WINDOW_MS
      ) {
        const merged: HistoryEntry = {
          undo: top.undo,
          redo: entry.redo,
          coalesceKey: entry.coalesceKey,
          pageIndex: entry.pageIndex,
          ts,
        };
        stacksRef.current = { past: [...past.slice(0, -1), merged], future: [] };
      } else {
        stacksRef.current = { past: [...past, { ...entry, ts }], future: [] };
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

  const value = useMemo<HistoryCtx>(
    () => ({
      canUndo: availability.canUndo,
      canRedo: availability.canRedo,
      record,
      undo,
      redo,
      clear,
    }),
    [availability.canUndo, availability.canRedo, record, undo, redo, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useHistory } from '@/components/history-provider';
import { type DesignSystem, designToCssVars } from '../../lib/design';
import { shuffleDesign } from '../../lib/design-presets';
import { createSaveQueue, useUnsavedSource } from '../../lib/unsaved';
import { useDesign as useDesignFetch } from './use-design';

type DesignCtx = {
  slideId: string;
  loaded: boolean;
  exists: boolean;
  warning: string | null;
  design: DesignSystem | null;
  draft: DesignSystem | null;
  dirty: boolean;
  committing: boolean;
  update: (mut: (next: DesignSystem) => void, coalesceKey?: string) => void;
  commit: () => Promise<void>;
  discard: () => void;
  shuffle: () => void;
};

const Ctx = createContext<DesignCtx | null>(null);

export function useDesignPanelState(): DesignCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDesignPanelState must be used inside <DesignProvider>');
  return v;
}

function clone<T>(d: T): T {
  return JSON.parse(JSON.stringify(d)) as T;
}

export function DesignProvider({ slideId, children }: { slideId: string; children: ReactNode }) {
  const { design, exists, warning, loaded, save } = useDesignFetch(slideId);
  const [draft, setDraft] = useState<DesignSystem | null>(null);
  const [committing, setCommitting] = useState(false);
  const history = useHistory();
  const draftRef = useRef<DesignSystem | null>(null);
  draftRef.current = draft;
  // A save or discard only reaches `dirty` on the next render; this answers in between.
  const settledDraftRef = useRef<DesignSystem | null>(null);
  const [saveQueue] = useState(createSaveQueue);
  // When a save's response arrives as the new design, edits made since it was sent stay.
  const sentRef = useRef<DesignSystem | null>(null);

  useEffect(() => {
    const sent = sentRef.current;
    sentRef.current = null;
    if (!design || (sent && draftRef.current !== sent)) return;
    setDraft(clone(design));
  }, [design]);

  const dirty = useMemo(() => {
    if (!draft || !design) return false;
    return JSON.stringify(draft) !== JSON.stringify(design);
  }, [draft, design]);

  const update = useCallback(
    (mut: (d: DesignSystem) => void, coalesceKey?: string) => {
      const prev = draftRef.current;
      if (!prev) return;
      const next = clone(prev);
      mut(next);
      setDraft(next);
      history.record({
        coalesceKey,
        undo: () => setDraft(prev),
        redo: () => setDraft(next),
      });
    },
    [history],
  );

  // Each save sends the draft as it stands when its turn comes: two in flight
  // could answer out of order and put an older design back over the draft.
  const write = useCallback((): Promise<string | null> => {
    if (!draftRef.current) return Promise.resolve(null);
    setCommitting(true);
    return saveQueue.run(
      async () => {
        const saving = draftRef.current;
        if (!saving || saving === settledDraftRef.current) return null;
        sentRef.current = saving;
        const r = await save(saving);
        if (draftRef.current === saving) history.clear();
        if (r.ok) {
          settledDraftRef.current = saving;
          return null;
        }
        sentRef.current = null;
        const error = r.error ?? 'Failed to save';
        toast.error(error);
        return error;
      },
      () => setCommitting(false),
    );
  }, [saveQueue, save, history]);

  const commit = useCallback(async () => {
    await write();
  }, [write]);

  const discard = useCallback(() => {
    settledDraftRef.current = draftRef.current;
    if (design) setDraft(clone(design));
    history.clear();
  }, [design, history]);

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useUnsavedSource({
    kind: 'draft',
    dirty: () =>
      saveQueue.busy() || (dirtyRef.current && draftRef.current !== settledDraftRef.current),
    save: async () => {
      const error = await write();
      if (error) throw new Error(error);
    },
    discard,
  });

  const shuffle = useCallback(() => {
    const prev = draftRef.current;
    const next = clone(shuffleDesign(prev));
    setDraft(next);
    history.record({
      undo: () => setDraft(prev),
      redo: () => setDraft(next),
    });
  }, [history]);

  // SlideCanvas emits its design vars inline on the canvas root, so a draft
  // overlay must use `!important` to outrank those inline styles.
  const previewCss = useMemo(() => {
    if (!dirty || !draft) return '';
    const lines = Object.entries(designToCssVars(draft))
      .map(([k, v]) => `  ${k}: ${v} !important;`)
      .join('\n');
    return `[data-osd-canvas] {\n${lines}\n}`;
  }, [dirty, draft]);

  const value: DesignCtx = {
    slideId,
    loaded,
    exists,
    warning,
    design,
    draft,
    dirty,
    committing,
    update,
    commit,
    discard,
    shuffle,
  };

  return (
    <Ctx.Provider value={value}>
      {previewCss && (
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted local css from draft state.
        <style dangerouslySetInnerHTML={{ __html: previewCss }} />
      )}
      {children}
    </Ctx.Provider>
  );
}

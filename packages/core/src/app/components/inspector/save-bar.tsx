import { useEffect, useRef } from 'react';
import { useHistory } from '@/components/history-provider';
import { SaveCard } from '@/components/panel/save-card';
import { useDesignPanelState } from '@/components/style-panel/design-provider';
import { isTypingTarget } from '@/lib/keys';
import { format, plural, useLocale } from '@/lib/use-locale';
import { useInspector } from './inspector-provider';

export function SaveBar() {
  const insp = useInspector();
  const design = useDesignPanelState();
  const history = useHistory();
  const t = useLocale();

  // Inspector edits autosave; only the design panel still has a draft to save.
  const designCount = design.dirty ? 1 : 0;
  const committing = insp.committing || design.committing;

  const onSave = async () => {
    await Promise.resolve(design.commit()).catch(() => {});
  };

  // An undo pressed while a structural write is landing would hit whatever
  // entry sits on top right now, not the write in flight. Hold it until the
  // write has recorded its own entry.
  const heldRef = useRef<'undo' | 'redo' | null>(null);
  useEffect(() => {
    if (committing || !heldRef.current) return;
    const held = heldRef.current;
    heldRef.current = null;
    if (held === 'undo') history.undo();
    else history.redo();
  }, [committing, history]);

  useEffect(() => {
    if (!insp.active) return;
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (isTypingTarget(event.target) && event.key.toLowerCase() !== 's') return;
      if (document.querySelector('[data-visual-gesture]')) return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"], [role="menu"], [role="listbox"]')
      )
        return;
      const key = event.key.toLowerCase();
      if (key === 'z' || (key === 'y' && event.ctrlKey)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const action = event.shiftKey || key === 'y' ? 'redo' : 'undo';
        if (committing) heldRef.current = action;
        else if (action === 'redo') history.redo();
        else history.undo();
      } else if (key === 's') {
        if (committing) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (
          document.activeElement instanceof HTMLElement &&
          !document.activeElement.isContentEditable
        ) {
          document.activeElement.blur();
        }
        void insp.commitEdits().catch(() => {});
        if (design.dirty) void Promise.resolve(design.commit()).catch(() => {});
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [insp.active, insp.commitEdits, committing, history, design.dirty, design.commit]);

  return (
    <SaveCard
      uiAttr="inspector"
      dirty={designCount > 0}
      committing={design.committing}
      autosaving={insp.saving}
      onSave={onSave}
      onDiscard={design.discard}
      unsavedLabel={format(plural(designCount, t.inspector.unsavedChanges), {
        count: designCount,
      })}
      onUndo={history.undo}
      onRedo={history.redo}
      canUndo={history.canUndo}
      canRedo={history.canRedo}
    />
  );
}

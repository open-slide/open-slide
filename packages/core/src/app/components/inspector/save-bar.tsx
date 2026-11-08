import { useEffect } from 'react';
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

  useEffect(() => {
    if (!insp.active || committing) return;
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
        if (event.shiftKey || key === 'y') history.redo();
        else history.undo();
      } else if (key === 's') {
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

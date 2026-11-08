import { useEffect, useRef, useState } from 'react';
import { desktopHost, type EditorCommand } from '@/lib/desktop';
import { PAGE_LAYOUTS, type PageLayout, SHAPE_KINDS, type ShapeKind } from '@/lib/structure';
import { useLocale } from '@/lib/use-locale';
import { AssetPickerDialog } from './asset-picker-dialog';
import { useInsertKind } from './insert-toolbar';
import { useInspector } from './inspector-provider';

// Runs the desktop app's Insert and Arrange menu items against this deck.
export function DesktopEditorCommands({
  onPageInserted,
}: {
  onPageInserted: (index: number) => void;
}) {
  const t = useLocale();
  const insp = useInspector();
  const insertKind = useInsertKind();
  const [picking, setPicking] = useState(false);

  const run = (command: EditorCommand) => {
    if (insp.committing) return;
    if (!insp.active) insp.setMode('edit');
    switch (command.type) {
      case 'insert-text':
        insertKind('text');
        break;
      case 'insert-shape':
        if (SHAPE_KINDS.includes(command.kind as ShapeKind)) insertKind(command.kind as ShapeKind);
        break;
      case 'insert-image':
        setPicking(true);
        break;
      case 'new-slide': {
        if (!PAGE_LAYOUTS.includes(command.layout as PageLayout)) break;
        void insp
          .addPage(insp.pageIndex, command.layout as PageLayout, {
            title: t.inspector.pageCopyTitle,
            subtitle: t.inspector.pageCopySubtitle,
            body: t.inspector.pageCopyBody,
            quote: t.inspector.pageCopyQuote,
            attribution: t.inspector.pageCopyAttribution,
            imageHint: t.inspector.insertImage,
          })
          .then((index) => {
            if (index !== null) onPageInserted(index);
          });
        break;
      }
      case 'duplicate':
        void insp.objects.duplicate();
        break;
      case 'group':
        void insp.objects.group();
        break;
      case 'ungroup':
        void insp.objects.ungroup();
        break;
      case 'lock':
        void insp.objects.toggleLock();
        break;
      case 'arrange':
        insp.visual.arrange(command.direction);
        break;
    }
  };
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => desktopHost?.onEditorCommand?.((command) => runRef.current(command)), []);

  if (!picking) return null;
  return (
    <AssetPickerDialog
      slideId={insp.slideId}
      onClose={() => setPicking(false)}
      onPick={(asset, scope) => {
        setPicking(false);
        const assetPath = scope === 'global' ? `@assets/${asset.name}` : `./assets/${asset.name}`;
        void insp.objects.insertImage(assetPath, asset.url);
      }}
    />
  );
}

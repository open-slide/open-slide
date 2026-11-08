import { ImagePlus, Shapes, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IconTooltip, MenuTooltipTrigger } from '@/components/icon-tooltip';
import { Shape } from '@/components/shape';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { dragHasFiles } from '@/lib/dom';
import { defaultInsertFrame, insertSpec } from '@/lib/inspector/use-object-commands';
import { readCanvas } from '@/lib/inspector/visual-dom';
import { SHAPE_KINDS, type ShapeKind } from '@/lib/structure';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { AssetPickerDialog } from './asset-picker-dialog';
import { useInspector } from './inspector-provider';

const SHAPE_MENU: readonly ShapeKind[] = SHAPE_KINDS;

function ShapeGlyph({ kind }: { kind: ShapeKind }) {
  const isLine = kind === 'line' || kind === 'line-arrow';
  return (
    <Shape
      kind={kind}
      fill={isLine ? undefined : 'currentColor'}
      stroke={isLine ? 'currentColor' : undefined}
      strokeWidth={isLine ? 2 : undefined}
      radius={kind === 'rect' ? 3 : undefined}
      style={{ width: 28, height: isLine ? 12 : 22, color: 'inherit' }}
    />
  );
}

export function InsertToolbar() {
  const t = useLocale();
  const insp = useInspector();
  const [picking, setPicking] = useState(false);
  const disabled = insp.committing;

  useCanvasImageDrop();

  if (import.meta.env.PROD || !insp.active) return null;

  const insertKind = (kind: 'text' | ShapeKind) => {
    const canvas = readCanvas();
    if (!canvas) return;
    const frame = defaultInsertFrame(kind, canvas);
    void insp.objects.insert(insertSpec(kind, frame, t.inspector.newText), frame);
  };

  const button = buttonVariants({ variant: 'ghost', size: 'icon-sm' });

  return (
    <div data-inspector-ui className="flex items-center gap-0.5">
      <IconTooltip label={t.inspector.insertText}>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={button}
              aria-label={t.inspector.insertText}
              disabled={disabled}
              onClick={() => insertKind('text')}
            />
          }
        >
          <Type className="size-4" />
        </TooltipTrigger>
      </IconTooltip>
      <DropdownMenu>
        <IconTooltip label={t.inspector.insertShape}>
          <DropdownMenuTrigger
            disabled={disabled}
            render={
              <MenuTooltipTrigger
                type="button"
                aria-label={t.inspector.insertShape}
                className={button}
              />
            }
          >
            <Shapes className="size-4" />
          </DropdownMenuTrigger>
        </IconTooltip>
        <DropdownMenuContent align="end" className="grid w-[188px] grid-cols-4 gap-0.5 p-1.5">
          {SHAPE_MENU.map((kind) => (
            <DropdownMenuItem
              key={kind}
              aria-label={t.inspector.shapeNames[kind]}
              title={t.inspector.shapeNames[kind]}
              data-shape-kind={kind}
              className="flex h-10 items-center justify-center p-0 text-muted-foreground data-highlighted:text-foreground [&_svg]:size-auto!"
              onClick={() => insertKind(kind)}
            >
              <ShapeGlyph kind={kind} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <IconTooltip label={t.inspector.insertImage}>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(button)}
              aria-label={t.inspector.insertImage}
              disabled={disabled}
              onClick={() => setPicking(true)}
            />
          }
        >
          <ImagePlus className="size-4" />
        </TooltipTrigger>
      </IconTooltip>
      {picking && (
        <AssetPickerDialog
          slideId={insp.slideId}
          onClose={() => setPicking(false)}
          onPick={(asset, scope) => {
            setPicking(false);
            const assetPath =
              scope === 'global' ? `@assets/${asset.name}` : `./assets/${asset.name}`;
            void insp.objects.insertImage(assetPath, asset.url);
          }}
        />
      )}
    </div>
  );
}

// Dropping an image file anywhere on the canvas (outside an image
// placeholder, which takes the drop itself) adds it centered on the cursor.
function useCanvasImageDrop() {
  const insp = useInspector();
  const { active, committing, objects } = insp;

  useEffect(() => {
    if (import.meta.env.PROD || !active || committing) return;
    const withinCanvas = (event: DragEvent) =>
      event.target instanceof Element && !!event.target.closest('[data-inspector-root]');
    const onDragOver = (event: DragEvent) => {
      if (event.defaultPrevented || !withinCanvas(event) || !dragHasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };
    // Registered on window so React's handlers (the placeholder's) run first.
    const onDrop = (event: DragEvent) => {
      if (event.defaultPrevented || !withinCanvas(event)) return;
      const file = Array.from(event.dataTransfer?.files ?? []).find((f) =>
        f.type.startsWith('image/'),
      );
      const canvas = readCanvas();
      if (!file || !canvas) return;
      event.preventDefault();
      const point = {
        x: (event.clientX - canvas.rect.left) / canvas.scale,
        y: (event.clientY - canvas.rect.top) / canvas.scale,
      };
      void objects.insertImageFile(file, point);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [active, committing, objects]);
}

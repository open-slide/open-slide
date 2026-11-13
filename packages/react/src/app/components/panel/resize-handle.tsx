import { useEffect, useRef, useState } from 'react';
import { clamp, cn } from '@/lib/utils';

export function useStoredWidth(key: string, fallback: number, min: number, max: number) {
  const [width, setWidth] = useState<number>(() => {
    try {
      const parsed = Number(window.localStorage.getItem(key) ?? Number.NaN);
      return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, String(width));
    } catch {}
  }, [key, width]);
  return [width, setWidth] as const;
}

// A vertical splitter on one edge of a panel. `edge` is the side of the panel
// it sits on, so dragging away from the panel always makes it wider.
export function ResizeHandle({
  width,
  min,
  max,
  defaultWidth,
  edge,
  label,
  onResize,
  onResizingChange,
  className,
}: {
  width: number;
  min: number;
  max: number;
  defaultWidth: number;
  edge: 'left' | 'right';
  label: string;
  onResize: (width: number) => void;
  onResizingChange?: (resizing: boolean) => void;
  className?: string;
}) {
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const direction = edge === 'right' ? 1 : -1;

  useEffect(() => {
    onResizingChange?.(resizing);
    if (!resizing) return;
    const prev = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.cursor = prev.cursor;
      document.body.style.userSelect = prev.userSelect;
    };
  }, [resizing, onResizingChange]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startWidth: width };
    setResizing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta = (e.clientX - dragRef.current.startX) * direction;
    onResize(clamp(dragRef.current.startWidth + delta, min, max));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setResizing(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = (e.shiftKey ? 32 : 8) * direction;
    let next: number | null = null;
    if (e.key === 'ArrowLeft') next = width - step;
    else if (e.key === 'ArrowRight') next = width + step;
    else if (e.key === 'Home') next = defaultWidth;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    onResize(clamp(next, min, max));
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: focusable resize handle (splitter pattern), not a static <hr>
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onDoubleClick={() => onResize(defaultWidth)}
      className={cn(
        'group/resize absolute inset-y-0 z-20 w-1.5 cursor-col-resize touch-none outline-none',
        'focus-visible:bg-brand/20',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 w-px bg-brand opacity-0 transition-opacity duration-150',
          edge === 'right' ? 'left-1/2 -translate-x-1/2' : 'left-0',
          'group-hover/resize:opacity-100 group-focus-visible/resize:opacity-100',
          resizing && 'opacity-100',
        )}
      />
    </div>
  );
}

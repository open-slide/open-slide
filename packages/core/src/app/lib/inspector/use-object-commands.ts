import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import type { SelectedTarget, StructureOptions } from '@/components/inspector/inspector-provider';
import { uploadWithAutoRename } from '@/lib/assets';
import { isTypingTarget } from '@/lib/keys';
import type { ElementLoc, ElementSpec, StructureOp } from '@/lib/structure';
import { useLocale } from '@/lib/use-locale';
import { findSlideSource } from './fiber';
import { type Rect, unionRects } from './geometry';
import type { EditOp } from './use-editor';
import {
  type Canvas,
  captureTransform,
  independentTargets,
  isLocked,
  moveOps,
  readCanvas,
  readFrame,
} from './visual-dom';

const PASTE_OFFSET = 24;

type ClipboardItem = { snippet: string; frame: Rect };
type Clipboard = { slideId: string; pageIndex: number; items: ClipboardItem[]; text: string };

// One clipboard per window: copying in one deck tab and pasting in another
// goes through the system clipboard text instead.
let clipboard: Clipboard | null = null;

type Options = {
  active: boolean;
  inlineEditing: boolean;
  busy: boolean;
  slideId: string;
  pageIndex: number;
  selection: SelectedTarget[];
  setSelection: (targets: SelectedTarget[]) => void;
  runStructure: (op: StructureOp, options?: StructureOptions) => Promise<SelectedTarget[] | null>;
  copyElements: (targets: ElementLoc[]) => Promise<string[]>;
  applyEdit: (line: number, column: number, ops: EditOp[]) => Promise<void>;
};

export type InsertKind = 'text' | 'image' | Extract<ElementSpec, { type: 'shape' }>['kind'];

function loc(target: SelectedTarget): ElementLoc {
  return { line: target.line, column: target.column };
}

// A shared component renders one JSX node many times, so a structural change
// to it would hit every copy. Only uniquely rendered nodes qualify.
export function canRestructure(target: SelectedTarget, canvas: Canvas): boolean {
  return (
    target.anchor.isConnected &&
    canvas.root.contains(target.anchor) &&
    canvas.root.querySelectorAll(`[data-slide-loc="${target.line}:${target.column}"]`).length === 1
  );
}

// Moves each freshly created element so its canvas frame starts at `frames[i]`.
export function placeAt(frames: Array<Rect | null>): StructureOptions['place'] {
  return (created) => {
    const canvas = readCanvas();
    if (!canvas) return [];
    return created.flatMap((target, index) => {
      const frame = frames[index];
      if (!frame) return [];
      const current = readFrame(target.anchor, canvas);
      const delta = { x: frame.x - current.x, y: frame.y - current.y };
      if (Math.abs(delta.x) < 0.5 && Math.abs(delta.y) < 0.5) return [];
      return [{ ...target, ops: moveOps(captureTransform(target, canvas), delta, canvas) }];
    });
  };
}

// Menus hand focus back to their trigger on close; leaving it there would
// route arrow keys and Delete to the toolbar instead of the new element.
function releaseToolbarFocus() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.closest('[data-inspector-ui]')) active.blur();
}

function readImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 800, height: 600 });
    image.src = url;
  });
}

function fitInside(size: { width: number; height: number }, canvas: Canvas): Rect {
  const scale = Math.min(1, (canvas.width * 0.6) / size.width, (canvas.height * 0.6) / size.height);
  const width = Math.round(size.width * scale);
  const height = Math.round(size.height * scale);
  return {
    x: Math.round((canvas.width - width) / 2),
    y: Math.round((canvas.height - height) / 2),
    width,
    height,
  };
}

function looksLikeJsx(text: string): boolean {
  return /^<[A-Za-z]/.test(text.trim()) && /\/?>\s*$/.test(text.trim());
}

export function defaultInsertFrame(kind: InsertKind, canvas: Canvas): Rect {
  const size =
    kind === 'text'
      ? { width: 720, height: 80 }
      : kind === 'line' || kind === 'line-arrow'
        ? { width: 480, height: 24 }
        : { width: 360, height: 360 };
  return {
    x: Math.round((canvas.width - size.width) / 2),
    y: Math.round((canvas.height - size.height) / 2),
    ...size,
  };
}

export function insertSpec(
  kind: Exclude<InsertKind, 'image'>,
  frame: Rect,
  text: string,
): ElementSpec {
  const box = {
    position: 'absolute',
    left: Math.round(frame.x),
    top: Math.round(frame.y),
    width: Math.round(frame.width),
  };
  if (kind === 'text') {
    return {
      type: 'text',
      text,
      style: {
        ...box,
        margin: 0,
        fontFamily: 'var(--osd-font-body, inherit)',
        fontSize: 48,
        lineHeight: 1.25,
        color: 'var(--osd-text, inherit)',
      },
    };
  }
  const isLine = kind === 'line' || kind === 'line-arrow';
  return {
    type: 'shape',
    kind,
    ...(isLine
      ? { stroke: 'var(--osd-text, currentColor)', strokeWidth: 4 }
      : { fill: 'var(--osd-accent, #3b82f6)' }),
    style: { ...box, height: Math.round(frame.height) },
  };
}

export function useObjectCommands({
  active,
  inlineEditing,
  busy,
  slideId,
  pageIndex,
  selection,
  setSelection,
  runStructure,
  copyElements,
  applyEdit,
}: Options) {
  const t = useLocale();
  const pasteCountRef = useRef(0);

  const restructurable = useCallback(
    (targets: SelectedTarget[]): SelectedTarget[] | null => {
      const canvas = readCanvas();
      // A write may have remounted the canvas since the selection was made.
      const live = targets.flatMap((target) => {
        if (target.anchor.isConnected) return [target];
        const anchor = canvas?.root.querySelector<HTMLElement>(
          `[data-slide-loc="${target.line}:${target.column}"]`,
        );
        return anchor ? [{ ...target, anchor }] : [];
      });
      const independent = independentTargets(live);
      if (!canvas || independent.length === 0) return null;
      if (independent.some((target) => isLocked(target.anchor))) {
        toast.error(t.inspector.lockedHint);
        return null;
      }
      if (!independent.every((target) => canRestructure(target, canvas))) {
        toast.error(t.inspector.sharedStructureHint);
        return null;
      }
      return independent;
    },
    [t],
  );

  const remove = useCallback(async () => {
    const targets = restructurable(selection);
    if (!targets) return;
    if (await runStructure({ kind: 'delete', targets: targets.map(loc) })) setSelection([]);
  }, [selection, restructurable, setSelection, runStructure]);

  const duplicate = useCallback(async () => {
    const canvas = readCanvas();
    const targets = restructurable(selection);
    if (!canvas || !targets) return;
    const frames = targets.map((target) => {
      const frame = readFrame(target.anchor, canvas);
      return { ...frame, x: frame.x + PASTE_OFFSET, y: frame.y + PASTE_OFFSET };
    });
    const created = await runStructure(
      { kind: 'duplicate', targets: targets.map(loc) },
      { place: placeAt(frames) },
    );
    if (created?.length) setSelection(created);
  }, [selection, restructurable, runStructure, setSelection]);

  const copy = useCallback(async (): Promise<boolean> => {
    const canvas = readCanvas();
    const targets = independentTargets(selection);
    if (!canvas || targets.length === 0) return false;
    try {
      const snippets = await copyElements(targets.map(loc));
      const items = targets.map((target, index) => ({
        snippet: snippets[index] ?? '',
        frame: readFrame(target.anchor, canvas),
      }));
      const text = snippets.join('\n');
      clipboard = { slideId, pageIndex, items, text };
      pasteCountRef.current = 0;
      await navigator.clipboard?.writeText(text).catch(() => {});
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [selection, copyElements, slideId, pageIndex]);

  const cut = useCallback(async () => {
    if (await copy()) await remove();
  }, [copy, remove]);

  const insert = useCallback(
    async (spec: ElementSpec, frame: Rect | null) => {
      const created = await runStructure(
        { kind: 'insert', pageIndex, element: spec },
        { place: placeAt([frame]) },
      );
      if (created?.length) {
        setSelection(created);
        releaseToolbarFocus();
      }
      return created ?? [];
    },
    [runStructure, pageIndex, setSelection],
  );

  const pasteInternal = useCallback(async () => {
    const current = clipboard;
    if (!current) return;
    const samePage = current.slideId === slideId && current.pageIndex === pageIndex;
    const step = samePage ? ++pasteCountRef.current * PASTE_OFFSET : 0;
    const created: SelectedTarget[] = [];
    for (const item of current.items) {
      const frame = { ...item.frame, x: item.frame.x + step, y: item.frame.y + step };
      created.push(...(await insert({ type: 'jsx', code: item.snippet }, frame)));
    }
    if (created?.length) setSelection(created);
  }, [slideId, pageIndex, insert, setSelection]);

  const insertImage = useCallback(
    async (assetPath: string, url: string, frame?: Rect | null) => {
      const canvas = readCanvas();
      if (!canvas) return;
      const size = await readImageSize(url);
      const fitted = fitInside(size, canvas);
      // A drop point centers the image there instead of on the slide.
      const target = frame
        ? { ...fitted, x: frame.x - fitted.width / 2, y: frame.y - fitted.height / 2 }
        : fitted;
      await insert(
        {
          type: 'image',
          assetPath,
          alt: '',
          style: {
            position: 'absolute',
            left: Math.round(target.x),
            top: Math.round(target.y),
            width: Math.round(target.width),
            height: Math.round(target.height),
            objectFit: 'cover',
          },
        },
        target,
      );
    },
    [insert],
  );

  const insertImageFile = useCallback(
    async (file: File, point?: { x: number; y: number } | null) => {
      const { ok, entry } = await uploadWithAutoRename(slideId, file);
      if (!ok || !entry) {
        toast.error(t.imagePlaceholder.uploadFailed);
        return;
      }
      await insertImage(
        `./assets/${entry.name}`,
        entry.url,
        point ? { ...point, width: 0, height: 0 } : null,
      );
    },
    [slideId, insertImage, t],
  );

  const pasteText = useCallback(
    async (text: string) => {
      const canvas = readCanvas();
      if (!canvas) return;
      if (clipboard && text === clipboard.text) {
        await pasteInternal();
        return;
      }
      if (looksLikeJsx(text)) {
        await insert({ type: 'jsx', code: text }, null);
        return;
      }
      const frame = defaultInsertFrame('text', canvas);
      await insert(insertSpec('text', frame, text.trim()), frame);
    },
    [pasteInternal, insert],
  );

  const group = useCallback(async () => {
    const canvas = readCanvas();
    const targets = restructurable(selection);
    if (!canvas || !targets) return;
    if (targets.length < 2) return;
    if (targets.some((target) => getComputedStyle(target.anchor).position !== 'absolute')) {
      toast.error(t.inspector.groupLayoutHint);
      return;
    }
    // Source order matches DOM order among siblings, which is how the server
    // lays the children out inside the new group.
    const ordered = [...targets].sort((a, b) =>
      a.anchor.compareDocumentPosition(b.anchor) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
    const frames = ordered.map((target) => readFrame(target.anchor, canvas));
    const bounds = unionRects(frames);
    if (!bounds) return;
    const created = await runStructure(
      {
        kind: 'group',
        targets: ordered.map(loc),
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
        },
      },
      {
        place: ([groupTarget]) => {
          const live = readCanvas();
          if (!live || !groupTarget) return [];
          const current = readFrame(groupTarget.anchor, live);
          const shift = { x: bounds.x - current.x, y: bounds.y - current.y };
          const children = Array.from(groupTarget.anchor.children).flatMap((child) => {
            const hit =
              child instanceof HTMLElement
                ? findSlideSource(child, slideId, { hostOnly: true })
                : null;
            return hit && hit.anchor === child ? [hit] : [];
          });
          const edits = [
            { ...groupTarget, ops: moveOps(captureTransform(groupTarget, live), shift, live) },
          ];
          children.forEach((child, index) => {
            const frame = frames[index];
            if (!frame) return;
            const now = readFrame(child.anchor, live);
            const delta = { x: frame.x - now.x - shift.x, y: frame.y - now.y - shift.y };
            if (Math.abs(delta.x) < 0.5 && Math.abs(delta.y) < 0.5) return;
            edits.push({ ...child, ops: moveOps(captureTransform(child, live), delta, live) });
          });
          return edits;
        },
      },
    );
    if (created?.length) setSelection(created);
  }, [selection, restructurable, runStructure, setSelection, slideId, t]);

  const ungroup = useCallback(async () => {
    const canvas = readCanvas();
    const [target] = restructurable(selection) ?? [];
    if (!canvas || !target || target.anchor.dataset.slideGroup === undefined) return;
    const frames = Array.from(target.anchor.children).map((child) =>
      child instanceof HTMLElement ? readFrame(child, canvas) : null,
    );
    const created = await runStructure(
      { kind: 'ungroup', target: loc(target) },
      { place: placeAt(frames) },
    );
    if (created?.length) setSelection(created);
  }, [selection, restructurable, runStructure, setSelection]);

  const toggleLock = useCallback(async () => {
    const targets = independentTargets(selection);
    if (targets.length === 0) return;
    const lock = !targets.every((target) => target.anchor.hasAttribute('data-locked'));
    for (const target of targets) {
      await applyEdit(target.line, target.column, [
        { kind: 'set-prop', name: 'data-locked', value: lock },
      ]).catch((err) => toast.error(err instanceof Error ? err.message : String(err)));
    }
  }, [selection, applyEdit]);

  const actionsRef = useRef({
    remove,
    duplicate,
    copy,
    cut,
    pasteText,
    insertImageFile,
    group,
    ungroup,
    toggleLock,
  });
  actionsRef.current = {
    remove,
    duplicate,
    copy,
    cut,
    pasteText,
    insertImageFile,
    group,
    ungroup,
    toggleLock,
  };

  useEffect(() => {
    if (!active || inlineEditing || busy) return;
    const editorOwnsEvent = (event: Event) => {
      const target = event.target;
      if (isTypingTarget(target)) return false;
      if (
        target instanceof Element &&
        target.closest('[role="dialog"], [role="menu"], [role="listbox"], [data-inspector-ui]')
      )
        return false;
      if (document.querySelector('[data-visual-gesture]')) return false;
      // A text selection on the page means the user is copying words, not objects.
      const selected = window.getSelection();
      return !selected || selected.isCollapsed;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || !editorOwnsEvent(event)) return;
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (!mod && !event.altKey && (event.key === 'Delete' || event.key === 'Backspace')) {
        if (selection.length === 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void actionsRef.current.remove();
      } else if (mod && !event.shiftKey && !event.altKey && key === 'd') {
        if (selection.length === 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void actionsRef.current.duplicate();
      } else if (mod && event.altKey && event.code === 'KeyG') {
        if (selection.length === 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void (event.shiftKey ? actionsRef.current.ungroup() : actionsRef.current.group());
      } else if (mod && !event.shiftKey && !event.altKey && key === 'l') {
        if (selection.length === 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void actionsRef.current.toggleLock();
      }
    };
    const onCopy = (event: ClipboardEvent) => {
      if (selection.length === 0 || !editorOwnsEvent(event)) return;
      event.preventDefault();
      void actionsRef.current.copy();
    };
    const onCut = (event: ClipboardEvent) => {
      if (selection.length === 0 || !editorOwnsEvent(event)) return;
      event.preventDefault();
      void actionsRef.current.cut();
    };
    const onPaste = (event: ClipboardEvent) => {
      if (!editorOwnsEvent(event)) return;
      const data = event.clipboardData;
      const image = Array.from(data?.files ?? []).find((file) => file.type.startsWith('image/'));
      const text = data?.getData('text/plain') ?? '';
      if (!image && !text.trim()) return;
      event.preventDefault();
      if (image) void actionsRef.current.insertImageFile(image);
      else void actionsRef.current.pasteText(text);
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
    };
  }, [active, inlineEditing, busy, selection.length]);

  return useMemo(
    () => ({
      remove,
      duplicate,
      copy,
      cut,
      insert,
      insertImage,
      insertImageFile,
      pasteText,
      group,
      ungroup,
      toggleLock,
    }),
    [
      remove,
      duplicate,
      copy,
      cut,
      insert,
      insertImage,
      insertImageFile,
      pasteText,
      group,
      ungroup,
      toggleLock,
    ],
  );
}

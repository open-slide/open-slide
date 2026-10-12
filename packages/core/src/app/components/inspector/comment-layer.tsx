import { MessageSquare, Trash2 } from 'lucide-react';
import {
  type ComponentProps,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { findSlideSource } from '@/lib/inspector/fiber';
import { useFreezeSlideMotion } from '@/lib/inspector/freeze-motion';
import { type Point, type Rect, rectContains } from '@/lib/inspector/geometry';
import {
  isInspectableEventTarget,
  pickElement,
  pickInspectorTarget,
} from '@/lib/inspector/pick-target';
import type { CommentRect, SlideComment } from '@/lib/inspector/use-comments';
import { type Canvas, readCanvas, readFrame } from '@/lib/inspector/visual-dom';
import { isTypingTarget } from '@/lib/keys';
import { format, plural, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { type SelectedTarget, useInspector } from './inspector-provider';

type ScreenRect = { left: number; top: number; width: number; height: number };
type Size = { width: number; height: number };

type Draft =
  | { kind: 'element'; target: SelectedTarget }
  | { kind: 'region'; rect: Rect; target: SelectedTarget };

type Gesture = {
  pointerId: number;
  start: Point;
  hit: SelectedTarget | null;
  canvas: Canvas;
  moved: boolean;
};

type PinLayout = { frame: ScreenRect; region: boolean };

type Layout = {
  width: number;
  height: number;
  canvas: ScreenRect | null;
  scale: number;
  pins: Record<string, PinLayout>;
  hoverFrame: ScreenRect | null;
  draftFrame: ScreenRect | null;
};

const EMPTY_LAYOUT: Layout = {
  width: 0,
  height: 0,
  canvas: null,
  scale: 1,
  pins: {},
  hoverFrame: null,
  draftFrame: null,
};

// A freshly written marker shifts source lines, so a comment's `target`
// can point at a loc the canvas only picks up once HMR re-renders — and
// that reload can remount this layer. Remember each pin's last frame
// across mounts so it doesn't jump to the fallback corner in between.
const rememberedFrames = new Map<string, PinLayout>();

const PIN = 24;
const GAP = 8;
const MIN_REGION = 6;

function pinRect(frame: ScreenRect): ScreenRect {
  return { left: frame.left + frame.width - 3, top: frame.top - PIN + 3, width: PIN, height: PIN };
}

function placeBeside(anchor: ScreenRect, size: Size, bounds: Size): { left: number; top: number } {
  let left = anchor.left + anchor.width + GAP;
  if (left + size.width > bounds.width - GAP) left = anchor.left - size.width - GAP;
  if (left < GAP) left = Math.max(GAP, Math.min(anchor.left, bounds.width - size.width - GAP));
  const top = Math.max(GAP, Math.min(anchor.top, bounds.height - size.height - GAP));
  return { left, top };
}

function fallbackFrame(canvas: Canvas): Rect {
  return { x: canvas.width - 72, y: 24, width: 48, height: 48 };
}

// Deepest host element whose box fully contains the drawn region; falls
// back to the largest host element (usually the page wrapper) so the
// marker always has a JSX container to live in.
function containerFor(rect: Rect, canvas: Canvas, slideId: string): SelectedTarget | null {
  const tolerance = {
    x: rect.x - 1,
    y: rect.y - 1,
    width: rect.width + 2,
    height: rect.height + 2,
  };
  let best: { target: SelectedTarget; area: number } | null = null;
  let largest: { target: SelectedTarget; area: number } | null = null;
  const seen = new Set<HTMLElement>();
  for (const element of canvas.root.querySelectorAll<HTMLElement>('[data-slide-loc]')) {
    const hit = findSlideSource(element, slideId, { hostOnly: true });
    if (!hit || seen.has(hit.anchor)) continue;
    seen.add(hit.anchor);
    const frame = readFrame(hit.anchor, canvas);
    const area = frame.width * frame.height;
    if (!area) continue;
    if (!largest || area > largest.area) largest = { target: hit, area };
    if (rectContains(frame, tolerance) && (!best || area < best.area)) best = { target: hit, area };
  }
  return best?.target ?? largest?.target ?? null;
}

export function CommentLayer() {
  const { commentMode, exitCommentMode, slideId, pageIndex, comments, add, update, remove, error } =
    useInspector();
  const t = useLocale();
  useFreezeSlideMotion(commentMode ? 'comment' : null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const [hover, setHover] = useState<HTMLElement | null>(null);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>(EMPTY_LAYOUT);

  useEffect(() => {
    if (commentMode) return;
    gestureRef.current = null;
    setHover(null);
    setMarquee(null);
    setDraft(null);
    setOpenId(null);
    setHoverId(null);
  }, [commentMode]);

  useEffect(() => {
    void pageIndex;
    setDraft(null);
    setOpenId(null);
  }, [pageIndex]);

  useLayoutEffect(() => {
    if (!commentMode) return;
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    let raf = 0;
    const measure = () => {
      const overlay = overlayRef.current;
      const canvas = readCanvas();
      if (!overlay || !canvas) return;
      const origin = overlay.getBoundingClientRect();
      const screen = (rect: Rect): ScreenRect => ({
        left: canvas.rect.left - origin.left + rect.x * canvas.scale,
        top: canvas.rect.top - origin.top + rect.y * canvas.scale,
        width: rect.width * canvas.scale,
        height: rect.height * canvas.scale,
      });
      const element = (anchor: HTMLElement): ScreenRect => {
        const box = anchor.getBoundingClientRect();
        return {
          left: box.left - origin.left,
          top: box.top - origin.top,
          width: box.width,
          height: box.height,
        };
      };
      const region = (rect: CommentRect): ScreenRect =>
        screen({ x: rect.x, y: rect.y, width: rect.w, height: rect.h });
      const pins: Record<string, PinLayout> = {};
      for (const comment of comments) {
        const memoryKey = `${slideId}:${comment.id}`;
        // Pages often share a wrapper component, so the target loc alone
        // would match on every page; the stored page index decides.
        if (comment.page !== undefined && comment.page !== pageIndex) continue;
        const anchor = comment.target
          ? canvas.root.querySelector<HTMLElement>(
              `[data-slide-loc="${comment.target.line}:${comment.target.column}"]`,
            )
          : null;
        if (anchor) {
          pins[comment.id] = {
            frame: comment.rect ? region(comment.rect) : element(anchor),
            region: !!comment.rect,
          };
          rememberedFrames.set(memoryKey, pins[comment.id]);
        } else if (comment.page === pageIndex) {
          pins[comment.id] = comment.rect
            ? { frame: region(comment.rect), region: true }
            : (rememberedFrames.get(memoryKey) ?? {
                frame: screen(fallbackFrame(canvas)),
                region: false,
              });
        }
      }
      const draftFrame = !draft
        ? null
        : draft.kind === 'region'
          ? screen(draft.rect)
          : draft.target.anchor.isConnected
            ? element(draft.target.anchor)
            : null;
      const next: Layout = {
        width: origin.width,
        height: origin.height,
        canvas: screen({ x: 0, y: 0, width: canvas.width, height: canvas.height }),
        scale: canvas.scale,
        pins,
        hoverFrame: hover?.isConnected ? element(hover) : null,
        draftFrame,
      };
      setLayout((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };
    const stopAt = performance.now() + 420;
    const track = () => {
      measure();
      if (performance.now() < stopAt) raf = requestAnimationFrame(track);
      else raf = 0;
    };
    track();
    const resize = new ResizeObserver(schedule);
    if (overlayRef.current) resize.observe(overlayRef.current);
    const mutations = root ? new MutationObserver(schedule) : null;
    mutations?.observe(root as HTMLElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-slide-loc', 'style', 'class'],
    });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      mutations?.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [commentMode, comments, pageIndex, hover, draft, slideId]);

  useEffect(() => {
    if (!commentMode) return;
    const targetAt = (event: PointerEvent): SelectedTarget | null => {
      const element = pickInspectorTarget(pickElement(event.clientX, event.clientY));
      return element ? findSlideSource(element, slideId, { hostOnly: true }) : null;
    };
    const point = (event: PointerEvent, canvas: Canvas): Point => ({
      x: (event.clientX - canvas.rect.left) / canvas.scale,
      y: (event.clientY - canvas.rect.top) / canvas.scale,
    });
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || gestureRef.current) return;
      if (!isInspectableEventTarget(event.target)) return;
      const canvas = readCanvas();
      if (!canvas) return;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      setDraft(null);
      setOpenId(null);
      gestureRef.current = {
        pointerId: event.pointerId,
        start: point(event, canvas),
        hit: targetAt(event),
        canvas,
        moved: false,
      };
      event.preventDefault();
      event.stopPropagation();
    };
    const onMove = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (gesture) {
        if (gesture.pointerId !== event.pointerId) return;
        const current = point(event, gesture.canvas);
        const delta = { x: current.x - gesture.start.x, y: current.y - gesture.start.y };
        if (!gesture.moved && Math.hypot(delta.x, delta.y) * gesture.canvas.scale < 3) return;
        gesture.moved = true;
        setHover(null);
        setMarquee({
          x: Math.min(gesture.start.x, current.x),
          y: Math.min(gesture.start.y, current.y),
          width: Math.abs(delta.x),
          height: Math.abs(delta.y),
        });
        return;
      }
      if (!isInspectableEventTarget(event.target)) {
        setHover(null);
        return;
      }
      setHover(targetAt(event)?.anchor ?? null);
    };
    const finish = (event: PointerEvent, cancelled: boolean) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gestureRef.current = null;
      setMarquee(null);
      if (cancelled) return;
      if (gesture.moved) {
        const current = point(event, gesture.canvas);
        const rect = {
          x: Math.min(gesture.start.x, current.x),
          y: Math.min(gesture.start.y, current.y),
          width: Math.abs(current.x - gesture.start.x),
          height: Math.abs(current.y - gesture.start.y),
        };
        if (
          rect.width * gesture.canvas.scale < MIN_REGION ||
          rect.height * gesture.canvas.scale < MIN_REGION
        )
          return;
        const target = containerFor(rect, gesture.canvas, slideId);
        if (!target) {
          toast.error(t.inspector.commentRegionNoTarget);
          return;
        }
        setDraft({ kind: 'region', rect, target });
        return;
      }
      if (gesture.hit) setDraft({ kind: 'element', target: gesture.hit });
    };
    const onUp = (event: PointerEvent) => finish(event, false);
    const onCancel = (event: Event) => {
      if (event instanceof PointerEvent) finish(event, true);
      else {
        gestureRef.current = null;
        setMarquee(null);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!isInspectableEventTarget(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing || event.keyCode === 229) return;
      if (isTypingTarget(event.target) && !overlayRef.current?.contains(event.target as Node))
        return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"], [role="menu"], [role="listbox"]')
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (gestureRef.current) {
        gestureRef.current = null;
        setMarquee(null);
      } else if (draft) setDraft(null);
      else if (openId) setOpenId(null);
      else exitCommentMode();
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onCancel, true);
    window.addEventListener('blur', onCancel);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onCancel, true);
      window.removeEventListener('blur', onCancel);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [commentMode, slideId, draft, openId, exitCommentMode, t]);

  const submit = useCallback(
    async (text: string) => {
      if (!draft) return;
      const { target } = draft;
      const rect =
        draft.kind === 'region'
          ? {
              x: Math.round(draft.rect.x),
              y: Math.round(draft.rect.y),
              w: Math.round(draft.rect.width),
              h: Math.round(draft.rect.height),
            }
          : undefined;
      try {
        await add({ line: target.line, column: target.column, text, rect, page: pageIndex });
        setDraft(null);
      } catch (err) {
        toast.error(`${t.inspector.commentAddFailed} ${String((err as Error).message ?? err)}`);
      }
    },
    [draft, add, pageIndex, t],
  );

  const handleUpdate = useCallback(
    async (id: string, text: string) => {
      try {
        await update(id, text);
        setOpenId(null);
      } catch (err) {
        toast.error(`${t.inspector.commentUpdateFailed} ${String((err as Error).message ?? err)}`);
      }
    },
    [update, t],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        setOpenId((current) => (current === id ? null : current));
      } catch (err) {
        toast.error(String((err as Error).message ?? err));
      }
    },
    [remove],
  );

  if (!commentMode) return null;

  const bounds = { width: layout.width, height: layout.height };
  const toScreen = (rect: Rect): ScreenRect => ({
    left: (layout.canvas?.left ?? 0) + rect.x * layout.scale,
    top: (layout.canvas?.top ?? 0) + rect.y * layout.scale,
    width: rect.width * layout.scale,
    height: rect.height * layout.scale,
  });
  const count = comments.length;

  return (
    <div
      ref={overlayRef}
      data-inspector-ui
      data-comment-layer
      className="pointer-events-none absolute inset-0 z-30 select-none"
    >
      {layout.hoverFrame && !gestureRef.current && !draft && (
        <div className="absolute border border-dashed border-brand/70" style={layout.hoverFrame} />
      )}
      {marquee && (
        <div className="absolute border border-brand bg-brand/10" style={toScreen(marquee)} />
      )}
      {comments.map((comment) => {
        const pin = layout.pins[comment.id];
        if (!pin) return null;
        const open = openId === comment.id;
        return (
          <CommentPin
            key={comment.id}
            comment={comment}
            frame={pin.frame}
            region={pin.region}
            anchor={pinRect(pin.frame)}
            bounds={bounds}
            open={open}
            hovered={hoverId === comment.id}
            onToggle={() => {
              setDraft(null);
              setOpenId(open ? null : comment.id);
            }}
            onHover={(hovering) => setHoverId(hovering ? comment.id : null)}
            onSave={(text) => handleUpdate(comment.id, text)}
            onRemove={() => handleRemove(comment.id)}
          />
        );
      })}
      {draft && layout.draftFrame && (
        <Composer
          frame={layout.draftFrame}
          region={draft.kind === 'region'}
          anchor={pinRect(layout.draftFrame)}
          bounds={bounds}
          onCancel={() => setDraft(null)}
          onSubmit={submit}
        />
      )}
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <div
          className={cn(
            'max-w-[calc(100%-2rem)] truncate rounded-full border bg-card/95 px-3 py-1.5 text-[11px] text-muted-foreground shadow-floating backdrop-blur',
            error && 'text-destructive',
          )}
        >
          {error ? (
            error
          ) : count === 0 ? (
            t.inspector.commentEmptyHint
          ) : (
            <>
              <span className="font-medium text-foreground nums">
                {format(plural(count, t.inspector.commentsCount), { count })}
              </span>
              <span aria-hidden className="mx-1.5">
                ·
              </span>
              {t.inspector.commentsApplyHintPrefix}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
                /apply-comments
              </code>
              {t.inspector.commentsApplyHintSuffix}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function useMeasuredSize(fallback: Size): [RefObject<HTMLDivElement | null>, Size] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>(fallback);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const next = { width: node.offsetWidth, height: node.offsetHeight };
      setSize((previous) =>
        previous.width === next.width && previous.height === next.height ? previous : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}

function Pin({
  anchor,
  lit,
  children,
  ...props
}: ComponentProps<'button'> & { anchor: ScreenRect; lit: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'pointer-events-auto absolute flex size-6 items-center justify-center rounded-full rounded-bl-[3px] bg-brand font-mono text-[10px] font-semibold text-brand-foreground ring-2 ring-background shadow-floating nums',
        'transition-[scale,box-shadow] duration-150 ease-swift hover:scale-110 focus-visible:outline-none focus-visible:ring-ring/60',
        lit && 'scale-110',
        props.className,
      )}
      style={{ left: anchor.left, top: anchor.top }}
    >
      {children}
    </button>
  );
}

function CommentPin({
  comment,
  frame,
  region,
  anchor,
  bounds,
  open,
  hovered,
  onToggle,
  onHover,
  onSave,
  onRemove,
}: {
  comment: SlideComment;
  frame: ScreenRect;
  region: boolean;
  anchor: ScreenRect;
  bounds: Size;
  open: boolean;
  hovered: boolean;
  onToggle: () => void;
  onHover: (hovering: boolean) => void;
  onSave: (text: string) => Promise<void>;
  onRemove: () => void;
}) {
  const t = useLocale();
  const lit = open || hovered;
  const [cardRef, cardSize] = useMeasuredSize({ width: 272, height: 120 });
  const card = placeBeside(anchor, cardSize, bounds);
  const meta = `${format(t.inspector.commentLineLabel, { n: comment.line })}${
    region ? ` · ${t.inspector.commentRegionLabel}` : ''
  }`;
  return (
    <>
      {(lit || region) && (
        <div
          className={cn(
            'absolute border border-brand',
            region && !lit && 'border-dashed border-brand/50',
          )}
          style={frame}
        />
      )}
      <Pin
        anchor={anchor}
        lit={lit}
        aria-label={comment.note}
        aria-expanded={open}
        onClick={onToggle}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
      >
        <MessageSquare className="size-3" />
      </Pin>
      {open ? (
        <CommentEditor
          key={comment.id}
          cardRef={cardRef}
          style={card}
          meta={meta}
          note={comment.note}
          onSave={onSave}
          onRemove={onRemove}
        />
      ) : (
        hovered && (
          <div
            ref={cardRef}
            data-comment-preview
            className="pointer-events-none absolute w-68 rounded-[8px] border bg-card text-[12px] shadow-overlay"
            style={card}
          >
            <div className="truncate px-3 pt-2 font-mono text-[10px] text-muted-foreground">
              {meta}
            </div>
            <p className="px-3 pt-1 pb-3 leading-relaxed break-words whitespace-pre-wrap">
              {comment.note}
            </p>
          </div>
        )
      )}
    </>
  );
}

function CommentEditor({
  cardRef,
  style,
  meta,
  note,
  onSave,
  onRemove,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  style: { left: number; top: number };
  meta: string;
  note: string;
  onSave: (text: string) => Promise<void>;
  onRemove: () => void;
}) {
  const t = useLocale();
  const [text, setText] = useState(note);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = text.trim() !== note && text.trim() !== '';

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.setSelectionRange(node.value.length, node.value.length);
  }, []);

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(text.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={cardRef}
      data-comment-editor
      className="pointer-events-auto absolute w-72 rounded-[8px] border bg-card p-2 shadow-overlay"
      style={style}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
        <span className="truncate font-mono text-[10px] text-muted-foreground">{meta}</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="-mr-1 shrink-0 rounded-[5px] p-1 text-muted-foreground transition-[color,background-color,scale] duration-150 hover:bg-muted hover:text-destructive active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label={t.inspector.commentDeleteAria}
          title={t.inspector.commentDeleteAria}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <Textarea
        ref={textareaRef}
        value={text}
        disabled={saving}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            save();
          }
        }}
        className="min-h-14 resize-none text-[12px]"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate font-mono text-[10.5px] text-muted-foreground/70">
          {t.inspector.commentEditorHint}
        </span>
        <Button size="sm" variant="brand" onClick={save} disabled={saving || !dirty}>
          {t.common.save}
        </Button>
      </div>
    </div>
  );
}

function Composer({
  frame,
  region,
  anchor,
  bounds,
  onCancel,
  onSubmit,
}: {
  frame: ScreenRect;
  region: boolean;
  anchor: ScreenRect;
  bounds: Size;
  onCancel: () => void;
  onSubmit: (text: string) => Promise<void>;
}) {
  const t = useLocale();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cardRef, cardSize] = useMeasuredSize({ width: 288, height: 128 });
  const card = placeBeside(anchor, cardSize, bounds);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  const post = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={cn('absolute border border-brand', region && 'bg-brand/5')} style={frame} />
      <Pin anchor={anchor} lit aria-hidden tabIndex={-1}>
        <MessageSquare className="size-3" />
      </Pin>
      <div
        ref={cardRef}
        className="pointer-events-auto absolute w-72 rounded-[8px] border bg-card p-2 shadow-overlay"
        style={card}
      >
        <Textarea
          ref={textareaRef}
          value={text}
          disabled={submitting}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              post();
            }
          }}
          placeholder={t.inspector.commentPlaceholder}
          className="min-h-14 resize-none text-[12px]"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10.5px] text-muted-foreground/70">
            {t.inspector.commentComposerHint}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button size="sm" variant="brand" onClick={post} disabled={submitting || !text.trim()}>
              {t.inspector.commentPost}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

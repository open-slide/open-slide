import { ArrowUp, Check, MessageSquare, Trash2 } from 'lucide-react';
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
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
import { IS_APPLE, isTypingTarget } from '@/lib/keys';
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
          onSubmit={submit}
        />
      )}
      <div className="absolute inset-x-0 bottom-3 flex justify-center">
        <IslandHint
          contentKey={error ? 'error' : count === 0 ? 'empty' : 'count'}
          tone={error ? 'error' : 'default'}
        >
          {error ? (
            error
          ) : count === 0 ? (
            t.inspector.commentEmptyHint
          ) : (
            <>
              <CommentCountLabel count={count} />
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
        </IslandHint>
      </div>
    </div>
  );
}

const ISLAND_SWAP_MS = 320;
const SUBMIT_SHORTCUT = IS_APPLE ? '⌘↵' : 'Ctrl ↵';

// Only the digits roll when the count changes; the surrounding words
// stay put so the pill reads as a counter ticking, not a text swap.
function CommentCountLabel({ count }: { count: number }) {
  const t = useLocale();
  const [prefix, suffix] = plural(count, t.inspector.commentsCount).split('{count}');
  return (
    <span className="font-medium text-foreground nums">
      {prefix}
      <RollingNumber value={count} />
      {suffix}
    </span>
  );
}

function RollingNumber({ value }: { value: number }) {
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const lastRef = useRef(value);
  useLayoutEffect(() => {
    const previous = lastRef.current;
    if (previous === value) return;
    lastRef.current = value;
    setOutgoing(previous);
    const timer = setTimeout(() => setOutgoing(null), ISLAND_SWAP_MS);
    return () => clearTimeout(timer);
  }, [value]);
  const direction = outgoing !== null && value < outgoing ? -1 : 1;
  return (
    <span
      className="inline-grid overflow-hidden align-bottom"
      style={{ '--roll': direction } as CSSProperties}
    >
      {outgoing !== null && (
        <span key={`out-${outgoing}`} aria-hidden className="roll-leave col-start-1 row-start-1">
          {outgoing}
        </span>
      )}
      <span
        key={`in-${value}`}
        className={cn('col-start-1 row-start-1', outgoing !== null && 'roll-arrive')}
      >
        {value}
      </span>
    </span>
  );
}

// The pill resizes to whatever it says, Dynamic Island style: the shell
// animates its width while the outgoing text blurs out and the new text
// blurs in. The shell's width is driven by the incoming content alone so
// it never waits for the old text to unmount.
function IslandHint({
  contentKey,
  tone,
  children,
}: {
  contentKey: string;
  tone: 'default' | 'error';
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [outgoing, setOutgoing] = useState<{ key: string; node: ReactNode } | null>(null);
  const lastRef = useRef<{ key: string; node: ReactNode }>({ key: contentKey, node: children });

  useLayoutEffect(() => {
    const previous = lastRef.current;
    lastRef.current = { key: contentKey, node: children };
    if (previous.key === contentKey) return;
    setOutgoing(previous);
    const timer = setTimeout(() => setOutgoing(null), ISLAND_SWAP_MS);
    return () => clearTimeout(timer);
  }, [contentKey, children]);

  // The content span remounts per key, and its entrance scales it, so
  // re-attach per key and read the unscaled layout width.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-observe the remounted span
  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const update = () => setWidth(node.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [contentKey]);

  return (
    <div
      data-comment-hint
      className={cn(
        'island-enter grid max-w-[calc(100%-2rem)] justify-items-start overflow-hidden rounded-full border bg-card/95 px-3 py-1.5 text-[11px] text-muted-foreground shadow-floating backdrop-blur',
        'motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)]',
        tone === 'error' && 'text-destructive',
      )}
      style={width === null ? undefined : { width: width + 26 }}
    >
      {outgoing && (
        <span
          key={outgoing.key}
          aria-hidden
          className="island-leave col-start-1 row-start-1 truncate whitespace-nowrap"
        >
          {outgoing.node}
        </span>
      )}
      <span
        key={contentKey}
        ref={contentRef}
        className={cn(
          'col-start-1 row-start-1 w-max whitespace-nowrap',
          outgoing && 'island-arrive',
        )}
      >
        {children}
      </span>
    </div>
  );
}

// `mountKey` re-attaches the observer when the measured card mounts later
// than the hook's owner (the pin's cards only exist while open or hovered).
function useMeasuredSize(
  fallback: Size,
  mountKey: unknown = null,
): [RefObject<HTMLDivElement | null>, Size] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>(fallback);
  // biome-ignore lint/correctness/useExhaustiveDependencies: mountKey only triggers re-observation
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
  }, [mountKey]);
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
  const [cardRef, cardSize] = useMeasuredSize(
    { width: 288, height: 120 },
    open ? 'editor' : hovered ? 'preview' : null,
  );
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
            className="island-arrive pointer-events-none absolute w-72 origin-top-left rounded-[10px] border border-border/80 bg-card text-[12.5px] shadow-overlay"
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
    <CommentCard ref={cardRef} style={style} data-comment-editor>
      <div className="flex h-8 items-center justify-between gap-2 pr-1.5 pl-3">
        <span className="truncate font-mono text-[10px] text-muted-foreground">{meta}</span>
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-[color,background-color,scale] duration-150 hover:bg-muted hover:text-destructive active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label={t.inspector.commentDeleteAria}
          title={t.inspector.commentDeleteAria}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <CommentTextarea
        ref={textareaRef}
        value={text}
        disabled={saving}
        onChange={(event) => setText(event.target.value)}
        onSubmit={save}
        className="pt-0"
      />
      <CommentCardFooter>
        <SendButton icon={Check} label={t.common.save} onClick={save} disabled={saving || !dirty} />
      </CommentCardFooter>
    </CommentCard>
  );
}

function Composer({
  frame,
  region,
  anchor,
  bounds,
  onSubmit,
}: {
  frame: ScreenRect;
  region: boolean;
  anchor: ScreenRect;
  bounds: Size;
  onSubmit: (text: string) => Promise<void>;
}) {
  const t = useLocale();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cardRef, cardSize] = useMeasuredSize({ width: 288, height: 112 });
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
      <CommentCard ref={cardRef} style={card} data-comment-composer>
        <CommentTextarea
          ref={textareaRef}
          value={text}
          disabled={submitting}
          onChange={(event) => setText(event.target.value)}
          onSubmit={post}
          placeholder={t.inspector.commentPlaceholder}
        />
        <CommentCardFooter>
          <SendButton
            icon={ArrowUp}
            label={t.inspector.commentPost}
            onClick={post}
            disabled={submitting || !text.trim()}
          />
        </CommentCardFooter>
      </CommentCard>
    </>
  );
}

// One quiet surface: the text sits directly on the card instead of inside
// a second framed box, and the only strong element is the send button.
function CommentCard({
  className,
  ...props
}: ComponentProps<'div'> & { ref: RefObject<HTMLDivElement | null> }) {
  return (
    <div
      {...props}
      className={cn(
        'island-arrive pointer-events-auto absolute w-72 origin-top-left rounded-[10px] border border-border/80 bg-card shadow-overlay',
        className,
      )}
    />
  );
}

function CommentTextarea({
  onSubmit,
  className,
  ...props
}: Omit<ComponentProps<'textarea'>, 'onSubmit'> & {
  ref: RefObject<HTMLTextAreaElement | null>;
  onSubmit: () => void;
}) {
  return (
    <textarea
      rows={2}
      {...props}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          onSubmit();
        }
      }}
      className={cn(
        'field-sizing-content block max-h-40 min-h-[3.25rem] w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-[12.5px] leading-[1.5] text-foreground outline-none',
        'placeholder:text-muted-foreground/60 disabled:opacity-60',
        className,
      )}
    />
  );
}

function CommentCardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 pt-0.5 pb-2 pl-3">
      <kbd className="rounded-[4px] border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.04em] text-muted-foreground">
        {SUBMIT_SHORTCUT}
      </kbd>
      {children}
    </div>
  );
}

function SendButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof ArrowUp;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale,opacity] duration-150 ease-swift',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        disabled
          ? 'bg-muted text-muted-foreground/50'
          : 'bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),0_1px_0_oklch(0_0_0/0.16)] hover:brightness-105 active:scale-90',
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
    </button>
  );
}

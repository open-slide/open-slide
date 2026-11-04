import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowUp,
  Bold,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  FolderClosed,
  Image,
  Italic,
  Layers,
  MessageSquare,
  MousePointerClick,
  Palette,
  PanelRight,
  Pencil,
  Play,
  Shuffle,
  Sparkles,
  Type,
  X,
} from 'lucide-react';
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ProviderLogo } from '@/components/agent/provider-logo';
import { cn } from '@/lib/utils';
import { type SketchVariant, SlideSketch } from './slide-sketch';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Milliseconds since mount, in ~30ms steps, frozen at `until`. Scenes are
// scripted off this one clock, and reduced motion lands on the final frame.
function useElapsed(until: number): number {
  const [elapsed, setElapsed] = useState(() => (prefersReducedMotion() ? until : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const next = Math.min(performance.now() - start, until);
      setElapsed(Math.floor(next / 30) * 30);
      if (next < until) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [until]);
  return elapsed;
}

const typed = (text: string, elapsed: number, start: number, speed: number) =>
  text.slice(0, Math.max(0, Math.floor((elapsed - start) / speed)));

const reveal = (shown: boolean) =>
  cn(
    'transition-[opacity,transform,filter] duration-700 ease-[var(--ease-swift)]',
    shown ? 'opacity-100 blur-[0px]' : 'translate-y-[0.6cqw] opacity-0 blur-[3px]',
  );

type Look = { bg: string; ink: string; accent: string; font: string };

const GEIST = 'var(--font-heading)';
const SERIF = 'Georgia, "Times New Roman", serif';
const EMBER: Look = { bg: '#fdfaf6', ink: '#1c1917', accent: '#fe5226', font: GEIST };
const MIDNIGHT: Look = { bg: '#12151d', ink: '#f3f1ec', accent: '#8fb3ff', font: GEIST };
const SAGE: Look = { bg: '#edf2ea', ink: '#1d2b22', accent: '#2f8a5b', font: GEIST };

function lookStyle(look: Look): React.CSSProperties {
  return {
    '--s-bg': look.bg,
    '--s-ink': look.ink,
    '--s-accent': look.accent,
    '--sk-bg': look.bg,
    '--sk-ink': `color-mix(in srgb, ${look.ink} 82%, transparent)`,
    '--sk-faint': `color-mix(in srgb, ${look.ink} 13%, transparent)`,
    '--sk-accent': look.accent,
    '--sk-photo': `linear-gradient(150deg, color-mix(in srgb, ${look.accent} 45%, white) 0%, ${look.accent} 65%)`,
    color: 'var(--s-ink)',
    fontFamily: look.font,
  } as React.CSSProperties;
}

const TITLE = 'Ship it beautifully.';
const CHART_TITLE = 'Up and to the right.';
const BARS = [28, 36, 33, 48, 57, 72, 92];
const STATS = [
  { value: '+38%', label: 'Activation' },
  { value: '12k', label: 'Teams' },
  { value: '4.9', label: 'Rating' },
];

type Part = 'title' | 'chart' | 'stats';

type SlideProps = {
  look?: Look;
  page?: 'cover' | 'chart';
  title?: string;
  eyebrow?: boolean;
  stats?: boolean;
  titleAccent?: boolean;
  titleScale?: number;
  barAccent?: boolean;
  mini?: boolean;
  marks?: Partial<Record<Part, ReactNode>>;
  className?: string;
};

// Sized in its own container units, so the same slide reads right as a
// thumbnail in the rail and full size on the canvas.
function Slide({
  look = EMBER,
  page = 'cover',
  title = page === 'cover' ? TITLE : CHART_TITLE,
  eyebrow = true,
  stats = true,
  titleAccent = false,
  titleScale = 1,
  barAccent = false,
  mini = false,
  marks,
  className,
}: SlideProps) {
  const target = (part: Part) => (mini ? undefined : part);
  const cover = page === 'cover';
  return (
    <div
      className={cn(
        '@container relative aspect-video w-full transition-colors duration-700',
        className,
      )}
      style={lookStyle(look)}
    >
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 overflow-hidden rounded-[1.4cqw] transition-colors duration-700',
          mini
            ? 'shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)]'
            : 'shadow-[0_0_0_0.5px_rgb(0_0_0/0.1),0_1.6cqw_3.6cqw_-1.6cqw_rgb(0_0_0/0.3)]',
        )}
        style={{ backgroundColor: 'var(--s-bg)' }}
      >
        <span
          className="absolute aspect-square rounded-full transition-colors duration-700"
          style={{
            width: cover ? '44%' : '26%',
            top: cover ? '-26%' : '-16%',
            right: cover ? '-12%' : '-8%',
            backgroundColor: 'var(--s-accent)',
            opacity: cover ? 0.92 : 0.18,
          }}
        />
      </div>
      <div className={cn('absolute left-[8%] w-[66%]', cover ? 'top-[21%]' : 'top-[13%]')}>
        <p
          className={cn(
            'text-[2.1cqw] font-semibold tracking-[0.16em] uppercase transition-colors duration-700',
            reveal(eyebrow),
          )}
          style={{ color: 'var(--s-accent)' }}
        >
          {cover ? 'Q4 launch' : 'Growth'}
        </p>
        <div className={cn('mt-[1.4cqw]', cover && 'min-h-[11cqw]')}>
          <span
            data-target={target('title')}
            className="relative inline-block leading-[1.04] font-semibold tracking-[-0.035em] transition-[color,font-size] duration-500 ease-[var(--ease-swift)]"
            style={{
              fontSize: `${(cover ? 5.4 : 4.4) * titleScale}cqw`,
              color: titleAccent ? 'var(--s-accent)' : undefined,
            }}
          >
            {title}
            {!mini && marks?.title}
          </span>
        </div>
      </div>
      {cover ? (
        <div
          data-target={target('stats')}
          className="absolute bottom-[13%] left-[8%] flex gap-[5cqw]"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={reveal(stats)}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <p className="text-[3.5cqw] leading-none font-semibold tracking-[-0.03em]">
                {stat.value}
              </p>
              <p className="mt-[0.9cqw] text-[1.5cqw] opacity-50">{stat.label}</p>
            </div>
          ))}
          {!mini && marks?.stats}
        </div>
      ) : (
        <div
          data-target={target('chart')}
          className="absolute right-[8%] bottom-[12%] left-[8%] h-[46%]"
        >
          <div className="flex h-full items-end gap-[1.8%]">
            {BARS.map((h, i) => {
              const last = i === BARS.length - 1;
              return (
                <span
                  key={h}
                  className={cn(
                    'relative flex-1 rounded-t-[0.7cqw] transition-colors duration-700',
                    !mini && 'ob-grow',
                  )}
                  style={
                    {
                      height: `${h}%`,
                      '--i': i,
                      backgroundColor: last
                        ? barAccent
                          ? 'var(--s-accent)'
                          : 'color-mix(in srgb, var(--s-ink) 30%, transparent)'
                        : 'color-mix(in srgb, var(--s-ink) 11%, transparent)',
                    } as React.CSSProperties
                  }
                >
                  {last && barAccent && (
                    <span
                      className="ob-pop absolute -top-[4.2cqw] left-1/2 -translate-x-1/2 text-[2.4cqw] font-semibold"
                      style={{ color: 'var(--s-accent)' }}
                    >
                      +38%
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          {!mini && marks?.chart}
        </div>
      )}
    </div>
  );
}

type Move = { at: number; to: string; ax?: number; ay?: number; dur?: number };

function offsetWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

// A scripted pointer that glides between `data-target` elements. It measures
// layout offsets rather than client rects so the stage's tilt can't skew it.
function Cursor({
  scene,
  elapsed,
  moves,
  clicks = [],
  laser = false,
}: {
  scene: RefObject<HTMLDivElement | null>;
  elapsed: number;
  moves: Move[];
  clicks?: number[];
  laser?: boolean;
}) {
  let index = -1;
  for (const [i, move] of moves.entries()) if (elapsed >= move.at) index = i;
  const move = moves[Math.max(0, index)];
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const host = scene.current;
    if (!host || !move) return;
    const place = () => {
      const el = host.querySelector<HTMLElement>(`[data-target="${move.to}"]`);
      if (!el) return;
      const box = offsetWithin(el, host);
      setPoint({ x: box.x + box.w * (move.ax ?? 0.5), y: box.y + box.h * (move.ay ?? 0.5) });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(host);
    return () => observer.disconnect();
  }, [scene, move]);

  if (!point) return null;
  const pressed = clicks.some((at) => elapsed >= at && elapsed < at + 180);
  const ripple = clicks.find((at) => elapsed >= at && elapsed < at + 600);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-0 left-0 z-30 motion-reduce:hidden',
        index < 0 && 'opacity-0',
      )}
      style={{
        transform: `translate(${point.x}px, ${point.y}px)`,
        transition: `transform ${move?.dur ?? 800}ms cubic-bezier(0.65, 0, 0.35, 1), opacity 300ms ease-out`,
      }}
    >
      {ripple !== undefined && (
        <span
          key={ripple}
          className="ob-ripple absolute top-0 left-0 size-[4.4cqw] rounded-full border-[0.2cqw] border-brand"
        />
      )}
      {laser ? (
        <span className="absolute size-[1.3cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff3b30] shadow-[0_0_1.6cqw_0.5cqw_rgb(255_59_48/0.65)]" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 22"
          className={cn(
            'relative w-[1.7cqw] origin-top-left -translate-x-[10%] -translate-y-[6%] drop-shadow-[0_0.3cqw_0.5cqw_rgb(0_0_0/0.35)] transition-[scale] duration-150',
            pressed && 'scale-[0.84]',
          )}
        >
          <path
            d="M1.5 1.5v16.2l4.1-3.9 2.7 6.2 2.9-1.3-2.7-6.1h5.7z"
            fill="#fff"
            stroke="#111"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

const MODES = [
  { id: 'view', icon: Eye },
  { id: 'edit', icon: Pencil },
  { id: 'comment', icon: MessageSquare },
] as const;

type PanelKind = 'agent' | 'design' | 'format' | 'comments';

const MORE_PAGES: SketchVariant[] = ['image', 'quote', 'grid', 'title'];

function EditorFrame({
  mode,
  panel,
  look = EMBER,
  pageCount = 6,
  cover,
  chart,
  canvas,
  children,
}: {
  mode: (typeof MODES)[number]['id'];
  panel: PanelKind;
  look?: Look;
  pageCount?: number;
  cover?: SlideProps;
  chart?: SlideProps;
  canvas: ReactNode;
  children: ReactNode;
}) {
  const pages: { id: string; node: ReactNode }[] = [
    { id: 'cover', node: <Slide mini look={look} {...cover} /> },
    { id: 'chart', node: <Slide mini look={look} page="chart" {...chart} /> },
    ...MORE_PAGES.map((variant) => ({
      id: variant,
      node: (
        <SlideSketch
          variant={variant}
          className="rounded-[0.35cqw] shadow-[0_0_0_0.5px_rgb(0_0_0/0.12)]"
          style={lookStyle(look)}
        />
      ),
    })),
  ];

  return (
    <div className="flex h-full flex-col bg-card text-[1.1cqw]">
      <div className="flex h-[4.4cqw] shrink-0 items-center gap-[0.9cqw] border-b border-hairline px-[1.4cqw]">
        <div className="flex rounded-[0.7cqw] bg-foreground/[0.05] p-[0.25cqw] text-[1.02cqw] font-medium">
          <span className="rounded-[0.5cqw] bg-card px-[0.9cqw] py-[0.3cqw] shadow-edge">
            Slides
          </span>
          <span className="px-[0.9cqw] py-[0.3cqw] text-muted-foreground">Assets</span>
        </div>
        <span className="flex-1" />
        <div className="flex rounded-[0.7cqw] bg-foreground/[0.05] p-[0.25cqw]">
          {MODES.map(({ id, icon: Icon }) => (
            <span
              key={id}
              className={cn(
                'flex size-[2.3cqw] items-center justify-center rounded-[0.5cqw] text-muted-foreground transition-colors duration-300',
                mode === id && 'bg-card text-foreground shadow-edge',
              )}
            >
              <Icon className="size-[1.2cqw]" />
            </span>
          ))}
        </div>
        <span className="h-[1.8cqw] w-px bg-hairline" />
        {(
          [
            { id: 'agent', label: 'Agent', icon: <ProviderLogo provider="claude" /> },
            { id: 'design', label: 'Design', icon: <Palette /> },
            { id: 'format', label: 'Format', icon: <PanelRight /> },
          ] as const
        ).map((tool) => (
          <span
            key={tool.id}
            className={cn(
              'flex items-center gap-[0.5cqw] rounded-[0.6cqw] px-[0.8cqw] py-[0.5cqw] font-medium text-foreground/80 [&_svg]:size-[1.15cqw]',
              panel === tool.id && 'bg-foreground/[0.07] text-foreground',
            )}
          >
            {tool.icon}
            {tool.label}
          </span>
        ))}
        <span className="flex items-center gap-[0.5cqw] rounded-[0.6cqw] bg-brand px-[1cqw] py-[0.5cqw] font-medium text-brand-foreground">
          <Play className="size-[0.95cqw] fill-current" />
          Present
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[12.5%] shrink-0 flex-col gap-[1cqw] overflow-hidden border-r border-hairline px-[1cqw] py-[1.3cqw]">
          <p className="flex justify-between text-[0.8cqw] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Pages
            <span className="nums tracking-normal">{pageCount}</span>
          </p>
          {pages.slice(0, pageCount).map((page, i) => (
            <div key={page.id} className="ob-pop flex gap-[0.5cqw]">
              <span
                className={cn(
                  'nums w-[1.2cqw] shrink-0 text-[0.75cqw] text-muted-foreground',
                  i === 0 && 'text-brand',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div
                className={cn(
                  'min-w-0 flex-1 rounded-[0.5cqw]',
                  i === 0 && 'shadow-[0_0_0_0.15cqw_var(--brand)]',
                )}
              >
                {page.node}
              </div>
            </div>
          ))}
        </div>
        <div className="relative flex min-w-0 flex-1 items-center justify-center bg-canvas px-[2.8cqw]">
          {canvas}
        </div>
        <div className="flex w-[27%] shrink-0 flex-col border-l border-hairline bg-card">
          {children}
        </div>
      </div>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  meta,
  action,
}: {
  icon: ReactNode;
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-[3.6cqw] shrink-0 items-center gap-[0.7cqw] border-b border-hairline px-[1.6cqw] text-[1.15cqw] font-semibold [&>svg]:size-[1.3cqw]">
      {icon}
      {title}
      {meta && <span className="font-normal text-muted-foreground">{meta}</span>}
      <span className="flex-1" />
      {action}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[0.8cqw] border-b border-hairline px-[1.6cqw] py-[1.4cqw]">
      <p className="text-[0.8cqw] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function Field({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-[2.6cqw] items-center gap-[0.6cqw] rounded-[0.6cqw] border border-border bg-card px-[0.9cqw] text-[1.02cqw]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function Swatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn(
        'size-[1.5cqw] shrink-0 rounded-[0.35cqw] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] transition-colors duration-700',
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function PanelEmpty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[1cqw] px-[3cqw] text-center text-[1.05cqw] leading-relaxed text-muted-foreground [&>svg]:size-[2cqw] [&>svg]:text-foreground/30">
      {icon}
      {children}
    </div>
  );
}

function Composer() {
  return (
    <div className="m-[1.4cqw] flex items-center justify-between rounded-[1cqw] border border-border px-[1.3cqw] py-[1cqw] text-[1.05cqw] text-muted-foreground">
      Ask for a change…
      <span className="flex size-[2cqw] items-center justify-center rounded-full bg-brand text-brand-foreground">
        <ArrowUp className="size-[1.1cqw]" />
      </span>
    </div>
  );
}

function LogLine({ label }: { label: string }) {
  return (
    <div className="ob-pop flex items-center gap-[0.8cqw]">
      <span className="flex size-[1.6cqw] shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        <Check className="size-[1cqw]" strokeWidth={3} />
      </span>
      <span className="truncate text-[1.02cqw] text-muted-foreground">{label}</span>
    </div>
  );
}

const ASK = 'Make a kickoff deck for our Q4 launch.';
const CREATE_LOG = [
  { at: 2300, label: 'Planned 6 slides' },
  { at: 3000, label: 'Wrote the cover' },
  { at: 3700, label: 'Charted Q4 growth' },
  { at: 4400, label: 'Added speaker notes' },
];

export function CreateScene() {
  const elapsed = useElapsed(5400);
  const prompt = typed(ASK, elapsed, 300, 28);
  const pageCount = Math.max(0, Math.min(6, Math.floor((elapsed - 2500) / 320) + 1));
  const thinking = elapsed >= 1500 && elapsed < (CREATE_LOG[0]?.at ?? 0);

  return (
    <EditorFrame
      mode="edit"
      panel="agent"
      pageCount={pageCount}
      canvas={
        elapsed >= 2700 ? (
          <Slide
            className="ob-pop"
            eyebrow={elapsed >= 2900}
            title={typed(TITLE, elapsed, 3000, 35)}
            stats={elapsed >= 3700}
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-[1cqw] rounded-[1cqw] border-[0.12cqw] border-dashed border-foreground/15 text-[1.1cqw] text-muted-foreground">
            <Sparkles className={cn('size-[2.2cqw] text-brand/70', thinking && 'animate-pulse')} />
            Your deck will appear here
          </div>
        )
      }
    >
      <PanelHeader icon={<ProviderLogo provider="claude" />} title="Agent" meta="Claude Code" />
      <div className="flex flex-1 flex-col gap-[1.3cqw] overflow-hidden px-[1.6cqw] py-[1.8cqw] text-[1.1cqw] leading-[1.45]">
        {prompt && (
          <div className="max-w-[90%] self-end rounded-[1.1cqw] rounded-br-[0.3cqw] bg-foreground px-[1.3cqw] py-[0.9cqw] text-background">
            {prompt}
          </div>
        )}
        {thinking && <span className="ob-shimmer self-start font-medium">Thinking…</span>}
        <div className="flex flex-col gap-[0.8cqw]">
          {CREATE_LOG.filter((step) => elapsed >= step.at).map((step) => (
            <LogLine key={step.label} label={step.label} />
          ))}
        </div>
        {elapsed >= 4900 && (
          <p className="ob-pop text-foreground/85">Done — six slides, ready for your edits.</p>
        )}
      </div>
      <Composer />
    </EditorFrame>
  );
}

const HANDLES = [
  [0, 0],
  [50, 0],
  [100, 0],
  [0, 50],
  [100, 50],
  [0, 100],
  [50, 100],
  [100, 100],
];

function Selection() {
  return (
    <span
      aria-hidden
      className="ob-pop pointer-events-none absolute -inset-[1cqw] border-[0.18cqw] border-[#3b82f6]"
    >
      {HANDLES.map(([x, y]) => (
        <span
          key={`${x}-${y}`}
          className="absolute size-[1.2cqw] -translate-x-1/2 -translate-y-1/2 rounded-[0.2cqw] border-[0.18cqw] border-[#3b82f6] bg-white"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
    </span>
  );
}

const SWATCHES = ['#1c1917', '#fe5226', '#3b82f6', '#16a34a', '#a8a29e'];

const EDIT_MOVES: Move[] = [
  { at: 0, to: 'stats', ax: 1.2, ay: 2 },
  { at: 450, to: 'title', ax: 0.55, ay: 0.6, dur: 850 },
  { at: 2000, to: 'swatch', dur: 900 },
  { at: 3300, to: 'size-up', dur: 800 },
];
const EDIT_CLICKS = [1400, 2950, 4150, 4500];

export function EditScene() {
  const scene = useRef<HTMLDivElement>(null);
  const elapsed = useElapsed(5200);
  const selected = elapsed >= 1400;
  const accent = elapsed >= 2950;
  const size = elapsed >= 4500 ? 80 : elapsed >= 4150 ? 72 : 64;
  const color = accent ? '#fe5226' : '#1c1917';

  return (
    <div ref={scene} className="relative h-full">
      <EditorFrame
        mode="edit"
        panel="format"
        cover={{ titleAccent: accent }}
        canvas={
          <Slide
            titleAccent={accent}
            titleScale={size / 64}
            marks={{ title: selected && <Selection /> }}
          />
        }
      >
        <PanelHeader
          icon={<PanelRight />}
          title="Format"
          action={<X className="size-[1.2cqw]" />}
        />
        {selected ? (
          <div className="ob-pop flex flex-col">
            <div className="flex items-center gap-[0.7cqw] border-b border-hairline px-[1.6cqw] py-[1.2cqw] text-[1.05cqw] font-medium">
              <Type className="size-[1.2cqw]" />
              Text
              <span className="font-normal text-muted-foreground">· Title</span>
            </div>
            <Section title="Typography">
              <div className="flex gap-[0.6cqw]">
                <Field className="flex-1 justify-between">
                  Geist
                  <ChevronDown className="size-[1cqw] text-muted-foreground" />
                </Field>
                <Field className="gap-0 px-0">
                  <span className="px-[0.7cqw] text-muted-foreground">−</span>
                  <span className="nums w-[2.4cqw] text-center">{size}</span>
                  <span data-target="size-up" className="px-[0.7cqw] text-muted-foreground">
                    +
                  </span>
                </Field>
              </div>
              <div className="flex gap-[0.6cqw] [&_svg]:size-[1.1cqw]">
                {[
                  { id: 'bold', Icon: Bold },
                  { id: 'italic', Icon: Italic },
                ].map(({ id, Icon }, i) => (
                  <span
                    key={id}
                    className={cn(
                      'flex size-[2.4cqw] items-center justify-center rounded-[0.5cqw] border border-border',
                      i === 0 && 'border-foreground bg-foreground text-background',
                    )}
                  >
                    <Icon />
                  </span>
                ))}
                <span className="flex-1" />
                {[
                  { id: 'left', Icon: AlignLeft },
                  { id: 'center', Icon: AlignCenter },
                  { id: 'right', Icon: AlignRight },
                ].map(({ id, Icon }, i) => (
                  <span
                    key={id}
                    className={cn(
                      'flex size-[2.4cqw] items-center justify-center rounded-[0.5cqw] text-muted-foreground',
                      i === 0 && 'bg-foreground/[0.07] text-foreground',
                    )}
                  >
                    <Icon />
                  </span>
                ))}
              </div>
            </Section>
            <Section title="Color">
              <div className="flex items-center gap-[0.7cqw]">
                {SWATCHES.map((swatch, i) => (
                  <span
                    key={swatch}
                    data-target={i === 1 ? 'swatch' : undefined}
                    className={cn(
                      'size-[2cqw] rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] transition-shadow duration-300',
                      swatch === color &&
                        'shadow-[0_0_0_0.18cqw_var(--card),0_0_0_0.36cqw_var(--foreground)]',
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
              <Field>
                <Swatch color={color} />
                <span className="nums uppercase">{color}</span>
              </Field>
            </Section>
            <Section title="Content">
              <div className="rounded-[0.6cqw] border border-border px-[0.9cqw] py-[0.7cqw] text-[1.02cqw]">
                {TITLE}
              </div>
            </Section>
          </div>
        ) : (
          <PanelEmpty icon={<MousePointerClick />}>
            Select anything on the slide to change it.
          </PanelEmpty>
        )}
      </EditorFrame>
      <Cursor scene={scene} elapsed={elapsed} moves={EDIT_MOVES} clicks={EDIT_CLICKS} />
    </div>
  );
}

function CommentPin({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={cn(
        'ob-pop absolute -top-[2.6cqw] -right-[2.6cqw] z-10 flex size-[3.6cqw] items-center justify-center rounded-full rounded-bl-[0.6cqw] text-[1.7cqw] font-semibold text-white shadow-[0_0.6cqw_1.4cqw_-0.4cqw_rgb(0_0_0/0.4)] transition-colors duration-500',
        done ? 'bg-emerald-500' : 'bg-brand',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {done ? <Check className="size-[1.9cqw]" strokeWidth={3} /> : n}
    </span>
  );
}

function CommentDraft({ text, className }: { text: string; className: string }) {
  return (
    <div
      className={cn(
        'ob-pop absolute z-20 w-[42cqw] rounded-[1.4cqw] bg-popover p-[1.6cqw] text-left leading-normal font-normal tracking-normal text-popover-foreground shadow-[0_0_0_0.5px_rgb(0_0_0/0.14),0_2cqw_5cqw_-1.5cqw_rgb(0_0_0/0.4)]',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <p className="min-h-[2.8cqw] text-[2.1cqw] leading-snug">
        {text}
        <span className="ob-caret ml-px inline-block h-[1.1em] w-[0.18cqw] translate-y-[0.2em] bg-brand" />
      </p>
      <div className="mt-[1.4cqw] flex items-center justify-between">
        <span className="rounded-[0.5cqw] bg-foreground/[0.06] px-[0.8cqw] py-[0.3cqw] text-[1.3cqw] text-muted-foreground">
          ⌘↵
        </span>
        <span
          data-target="send"
          className="flex size-[3.6cqw] items-center justify-center rounded-full bg-brand text-white"
        >
          <ArrowUp className="size-[1.9cqw]" />
        </span>
      </div>
    </div>
  );
}

function Outline() {
  return (
    <span className="ob-pop pointer-events-none absolute -inset-[1cqw] rounded-[0.6cqw] border-[0.2cqw] border-brand" />
  );
}

const NOTE_ONE = 'Make the last bar pop.';
const NOTE_TWO = 'Lead with the number.';
const COMMENT_MOVES: Move[] = [
  { at: 0, to: 'chart', ax: 0.3, ay: 1.2 },
  { at: 450, to: 'chart', ax: 0.93, ay: 0.5, dur: 850 },
  { at: 2350, to: 'send', dur: 500 },
  { at: 3150, to: 'title', ax: 0.45, ay: 0.55, dur: 800 },
  { at: 4800, to: 'send', dur: 500 },
  { at: 5550, to: 'apply', dur: 800 },
];
const COMMENT_CLICKS = [1400, 2900, 3950, 5350, 6350];

export function CommentScene() {
  const scene = useRef<HTMLDivElement>(null);
  const elapsed = useElapsed(7900);
  const draftOne = elapsed >= 1400 && elapsed < 2900;
  const draftTwo = elapsed >= 3950 && elapsed < 5350;
  const savedOne = elapsed >= 2900;
  const savedTwo = elapsed >= 5350;
  const applying = elapsed >= 6350;
  const doneOne = elapsed >= 6900;
  const doneTwo = elapsed >= 7450;

  const notes = [
    { n: 1, text: NOTE_ONE, where: 'On the chart', saved: savedOne, done: doneOne },
    { n: 2, text: NOTE_TWO, where: 'On the title', saved: savedTwo, done: doneTwo },
  ].filter((note) => note.saved);

  return (
    <div ref={scene} className="relative h-full">
      <EditorFrame
        mode="comment"
        panel="comments"
        chart={{ barAccent: doneOne, title: doneTwo ? 'Up 38% this quarter.' : CHART_TITLE }}
        canvas={
          <>
            <Slide
              page="chart"
              barAccent={doneOne}
              title={doneTwo ? 'Up 38% this quarter.' : CHART_TITLE}
              marks={{
                chart: (
                  <>
                    {draftOne && <Outline />}
                    {draftOne && (
                      <CommentDraft
                        text={typed(NOTE_ONE, elapsed, 1550, 32)}
                        className="right-0 bottom-[calc(100%+2cqw)]"
                      />
                    )}
                    {savedOne && <CommentPin n={1} done={doneOne} />}
                  </>
                ),
                title: (
                  <>
                    {draftTwo && <Outline />}
                    {draftTwo && (
                      <CommentDraft
                        text={typed(NOTE_TWO, elapsed, 4100, 32)}
                        className="top-[calc(100%+2cqw)] left-0"
                      />
                    )}
                    {savedTwo && <CommentPin n={2} done={doneTwo} />}
                  </>
                ),
              }}
            />
            {elapsed < 1400 && (
              <span className="ob-fade absolute bottom-[2.2cqw] left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-[1.3cqw] py-[0.5cqw] text-[1cqw] whitespace-nowrap text-muted-foreground shadow-edge">
                Click anything to leave a comment
              </span>
            )}
          </>
        }
      >
        <PanelHeader
          icon={<MessageSquare />}
          title="Comments"
          meta={notes.length ? String(notes.length) : undefined}
        />
        {notes.length ? (
          <div className="flex flex-1 flex-col gap-[0.9cqw] px-[1.4cqw] py-[1.4cqw]">
            {notes.map((note) => (
              <div
                key={note.n}
                className="ob-pop flex gap-[0.9cqw] rounded-[0.8cqw] border border-border p-[1cqw]"
              >
                <span
                  className={cn(
                    'flex size-[1.9cqw] shrink-0 items-center justify-center rounded-full rounded-bl-[0.3cqw] text-[0.95cqw] font-semibold text-white transition-colors duration-500',
                    note.done ? 'bg-emerald-500' : 'bg-brand',
                  )}
                >
                  {note.done ? <Check className="size-[1cqw]" strokeWidth={3} /> : note.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.05cqw] leading-snug">{note.text}</p>
                  <p className="mt-[0.3cqw] text-[0.9cqw] text-muted-foreground">
                    {note.done ? (
                      'Applied'
                    ) : applying ? (
                      <span className="ob-shimmer">Applying…</span>
                    ) : (
                      note.where
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PanelEmpty icon={<MessageSquare />}>
            Pin notes to anything on the slide, then hand them all to your agent.
          </PanelEmpty>
        )}
        <div
          data-target="apply"
          className={cn(
            'm-[1.4cqw] flex items-center justify-center gap-[0.6cqw] rounded-[0.8cqw] py-[1cqw] text-[1.05cqw] font-medium transition-[opacity,background-color] duration-500',
            doneTwo
              ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
              : 'bg-foreground text-background',
            !savedTwo && 'opacity-35',
          )}
        >
          {doneTwo ? (
            <>
              <Check className="size-[1.1cqw]" strokeWidth={3} />
              All applied
            </>
          ) : (
            <>
              <Sparkles className="size-[1.1cqw]" />
              {applying ? 'Applying…' : `Apply ${notes.length} with agent`}
            </>
          )}
        </div>
      </EditorFrame>
      <Cursor scene={scene} elapsed={elapsed} moves={COMMENT_MOVES} clicks={COMMENT_CLICKS} />
    </div>
  );
}

const FONTS = ['Geist', 'Georgia', 'Helvetica', 'SF Mono'];

const DESIGN_MOVES: Move[] = [
  { at: 0, to: 'title', ax: 0.8, ay: 2.6 },
  { at: 400, to: 'shuffle', dur: 900 },
  { at: 3000, to: 'font', ax: 0.35, dur: 800 },
  { at: 4300, to: 'font-serif', ax: 0.3, dur: 600 },
];
const DESIGN_CLICKS = [1400, 2300, 3900, 5000];

export function DesignScene() {
  const scene = useRef<HTMLDivElement>(null);
  const elapsed = useElapsed(5800);
  const base = elapsed >= 2300 ? SAGE : elapsed >= 1400 ? MIDNIGHT : EMBER;
  const serif = elapsed >= 5000;
  const look = { ...base, font: serif ? SERIF : GEIST };
  const open = elapsed >= 3900 && elapsed < 5000;

  return (
    <div ref={scene} className="relative h-full">
      <EditorFrame mode="edit" panel="design" look={look} canvas={<Slide look={look} />}>
        <PanelHeader
          icon={<Palette />}
          title="Design"
          action={
            <span
              data-target="shuffle"
              className="flex size-[2.3cqw] items-center justify-center rounded-[0.5cqw] border border-border text-foreground/80"
            >
              <Shuffle className="size-[1.1cqw]" />
            </span>
          }
        />
        <Section title="Colors">
          {(
            [
              ['Background', look.bg],
              ['Text', look.ink],
              ['Accent', look.accent],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between text-[1.02cqw]">
              <span className="text-muted-foreground">{label}</span>
              <Field className="w-[58%]">
                <Swatch color={value} />
                <span className="nums uppercase">{value}</span>
              </Field>
            </div>
          ))}
        </Section>
        <Section title="Typography">
          <div className="flex items-center justify-between text-[1.02cqw]">
            <span className="text-muted-foreground">Display</span>
            <div className="relative w-[58%]">
              <Field data-target="font" className="justify-between">
                <span style={{ fontFamily: look.font }}>{serif ? 'Georgia' : 'Geist'}</span>
                <ChevronDown className="size-[1cqw] text-muted-foreground" />
              </Field>
              {open && (
                <div className="ob-pop absolute top-[calc(100%+0.4cqw)] right-0 left-0 z-10 rounded-[0.7cqw] border border-border bg-popover p-[0.4cqw] shadow-floating">
                  {FONTS.map((font) => (
                    <div
                      key={font}
                      data-target={font === 'Georgia' ? 'font-serif' : undefined}
                      className={cn(
                        'flex items-center justify-between rounded-[0.45cqw] px-[0.7cqw] py-[0.5cqw]',
                        font === 'Georgia' && elapsed >= 4800 && 'bg-foreground/[0.07]',
                      )}
                    >
                      {font}
                      {font === 'Geist' && <Check className="size-[1cqw]" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-[1.02cqw]">
            <span className="text-muted-foreground">Body</span>
            <Field className="w-[58%] justify-between">
              Geist
              <ChevronDown className="size-[1cqw] text-muted-foreground" />
            </Field>
          </div>
        </Section>
        <Section title="Shape">
          <div className="flex items-center justify-between text-[1.02cqw]">
            <span className="text-muted-foreground">Radius</span>
            <span className="relative h-[0.4cqw] w-[58%] rounded-full bg-foreground/10">
              <span className="absolute inset-y-0 left-0 w-[40%] rounded-full bg-foreground/60" />
              <span className="absolute top-1/2 left-[40%] size-[1.4cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card shadow-edge" />
            </span>
          </div>
        </Section>
      </EditorFrame>
      <Cursor scene={scene} elapsed={elapsed} moves={DESIGN_MOVES} clicks={DESIGN_CLICKS} />
    </div>
  );
}

const NOTES = [
  'Open on the headline and let it land. Pause on the numbers — 38% is the story.',
  'Walk the bars left to right, then stop on Q4. That jump is the whole talk.',
];

const LASER_MOVES: Move[] = [
  { at: 700, to: 'title', ax: 0.08, ay: 0.55 },
  { at: 900, to: 'title', ax: 0.9, ay: 0.55, dur: 1000 },
  { at: 1950, to: 'stats', ax: 0.12, ay: 0.3, dur: 600 },
  { at: 3300, to: 'chart', ax: 0.95, ay: 0.15, dur: 900 },
];

export function PresentScene() {
  const scene = useRef<HTMLDivElement>(null);
  const elapsed = useElapsed(5800);
  const index = elapsed >= 2600 ? 1 : 0;
  const exporting = elapsed >= 4200 && elapsed < 4400;
  const seconds = Math.floor(elapsed / 1000) + 4;

  return (
    <div
      ref={scene}
      className="relative flex h-full flex-col bg-[#0c0c0d] text-[1.1cqw] text-white"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex h-[4.2cqw] shrink-0 items-center gap-[1cqw] border-b border-white/[0.07] px-[1.8cqw]">
        <span className="text-[0.85cqw] font-semibold tracking-[0.14em] text-white/40 uppercase">
          Presenter
        </span>
        <span className="font-medium">Q4 launch</span>
        <span className="flex-1" />
        <span className="font-mono text-[1.05cqw] text-white/40">10:03 AM</span>
        <span className="font-mono text-[1.5cqw] font-medium">
          00:{String(seconds).padStart(2, '0')}
        </span>
        <span className="font-mono text-[1.5cqw]">
          0{index + 1}
          <span className="text-white/35"> / 06</span>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 gap-[1.8cqw] px-[1.8cqw] py-[1.4cqw]">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="mb-[0.8cqw] text-[0.8cqw] font-semibold tracking-[0.14em] text-white/40 uppercase">
            Now showing
          </p>
          <div className="flex flex-1 items-center justify-center rounded-[0.8cqw] bg-black px-[1.6cqw]">
            <div key={index} className="ob-scene-in w-full">
              {index === 0 ? (
                <Slide />
              ) : (
                <Slide page="chart" barAccent title="Up 38% this quarter." />
              )}
            </div>
          </div>
        </div>
        <div className="flex w-[32%] shrink-0 flex-col">
          <p className="mb-[0.8cqw] text-[0.8cqw] font-semibold tracking-[0.14em] text-white/40 uppercase">
            Up next
          </p>
          <div key={index} className="ob-scene-in">
            {index === 0 ? (
              <Slide mini page="chart" barAccent title="Up 38% this quarter." />
            ) : (
              <SlideSketch variant="quote" className="rounded-[0.6cqw]" />
            )}
          </div>
          <p className="mt-[1.6cqw] mb-[0.8cqw] text-[0.8cqw] font-semibold tracking-[0.14em] text-white/40 uppercase">
            Speaker notes
          </p>
          <p
            key={`notes-${index}`}
            className="ob-fade flex-1 rounded-[0.8cqw] border border-white/[0.08] p-[1.2cqw] text-[1.1cqw] leading-relaxed text-white/85"
          >
            {NOTES[index]}
          </p>
        </div>
      </div>
      <div className="flex h-[4.4cqw] shrink-0 items-center gap-[0.7cqw] border-t border-white/[0.07] px-[1.8cqw]">
        <span className="flex items-center gap-[0.3cqw] rounded-[0.6cqw] border border-white/10 px-[0.9cqw] py-[0.45cqw] text-white/35">
          <ChevronLeft className="size-[1.1cqw]" />
          Prev
        </span>
        <span
          className={cn(
            'flex items-center gap-[0.3cqw] rounded-[0.6cqw] border border-white/15 px-[0.9cqw] py-[0.45cqw] transition-colors duration-200',
            elapsed >= 2450 && elapsed < 2650 && 'bg-white/15',
          )}
        >
          Next
          <ChevronRight className="size-[1.1cqw]" />
        </span>
        <span className="flex-1" />
        <span
          className={cn(
            'flex items-center gap-[0.5cqw] rounded-[0.6cqw] bg-white px-[1cqw] py-[0.45cqw] font-medium text-black transition-[scale] duration-150',
            exporting && 'scale-95',
          )}
        >
          <FileDown className="size-[1.1cqw]" />
          Export PDF
        </span>
      </div>
      {elapsed >= 4400 && (
        <div className="ob-pop absolute right-[1.8cqw] bottom-[5.6cqw] flex items-center gap-[0.9cqw] rounded-[1cqw] border border-white/10 bg-[#1c1c1e] px-[1.3cqw] py-[1cqw] shadow-[0_1.6cqw_3cqw_-1cqw_rgb(0_0_0/0.6)]">
          <span className="flex size-[2.2cqw] items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="size-[1.2cqw]" strokeWidth={3} />
          </span>
          <span>
            <span className="block font-medium">Exported</span>
            <span className="block text-[0.95cqw] text-white/50">Q4 launch.pdf · 6 pages</span>
          </span>
        </div>
      )}
      <Cursor scene={scene} elapsed={elapsed} moves={LASER_MOVES} laser />
    </div>
  );
}

const AGENT_NODES = [
  { provider: 'claude', name: 'Claude Code', x: 22 },
  { provider: 'codex', name: 'Codex', x: 78 },
] as const;

export function AgentsScene() {
  return (
    <div className="relative h-full overflow-hidden bg-canvas">
      <div
        aria-hidden
        className="ob-fade absolute top-[42%] left-1/2 aspect-square w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.7 0.18 38 / 0.22), oklch(0.62 0.2 25 / 0.06) 60%, transparent)',
        }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 100 56.25"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        {[
          [29, 43],
          [57, 71],
        ].map(([from, to]) => (
          <line
            key={from}
            x1={from}
            x2={to}
            y1={23.5}
            y2={23.5}
            className="ob-dash text-brand"
            stroke="currentColor"
            strokeOpacity={0.55}
            strokeWidth={0.32}
            strokeDasharray="1 1.4"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div
        className="ob-pop absolute top-[23.5cqw] left-1/2 size-[12cqw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[23.3%]"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #efebe6 100%)',
          boxShadow:
            'inset 0 1px 0 rgb(255 255 255 / 0.9), 0 0 0 0.5px rgb(0 0 0 / 0.08), 0 3cqw 6cqw -1.6cqw rgb(254 82 38 / 0.55)',
        }}
      >
        <span
          className="absolute top-1/2 left-1/2 h-[35%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-[11.8%/20.2%]"
          style={{
            background:
              'radial-gradient(120% 90% at 30% 10%, rgb(255 255 255 / 0.28), transparent 60%), linear-gradient(180deg, #ff8a5e 0%, #fe5226 45%, #ee4316 100%)',
          }}
        />
      </div>
      {AGENT_NODES.map((node, i) => (
        <div
          key={node.provider}
          className="ob-pop absolute top-[23.5cqw] flex -translate-x-1/2 -translate-y-[4.5cqw] flex-col items-center"
          style={{ left: `${node.x}%`, animationDelay: `${180 + i * 120}ms` }}
        >
          <span className="flex size-[9cqw] items-center justify-center rounded-[2.2cqw] border border-border bg-card shadow-floating">
            <ProviderLogo provider={node.provider} className="size-[4cqw]" />
          </span>
          <span className="mt-[1.4cqw] text-[1.6cqw] font-semibold tracking-tight">
            {node.name}
          </span>
          <span className="mt-[0.4cqw] flex items-center gap-[0.4cqw] text-[1.15cqw] text-muted-foreground">
            <Check className="size-[1.1cqw] text-emerald-500" strokeWidth={3} />
            Built in
          </span>
        </div>
      ))}
      <div
        className="ob-pop absolute bottom-[5cqw] left-1/2 flex w-[52%] -translate-x-1/2 items-center gap-[1cqw] rounded-[1.4cqw] border border-border bg-card px-[1.4cqw] py-[1.1cqw] text-[1.3cqw] text-muted-foreground shadow-floating"
        style={{ animationDelay: '480ms' }}
      >
        <span className="flex-1">Add a closing slide with next steps…</span>
        <span className="flex items-center gap-[0.5cqw] rounded-full bg-foreground/[0.06] px-[0.9cqw] py-[0.35cqw] text-[1.1cqw] font-medium text-foreground">
          <ProviderLogo provider="claude" className="size-[1.1cqw]" />
          Claude Code
          <ChevronDown className="size-[0.9cqw]" />
        </span>
        <span className="flex size-[2.6cqw] items-center justify-center rounded-full bg-brand text-brand-foreground">
          <ArrowUp className="size-[1.4cqw]" />
        </span>
      </div>
    </div>
  );
}

const DECKS: { variant: SketchVariant; title: string }[] = [
  { variant: 'cover', title: 'Q4 launch' },
  { variant: 'chart', title: 'Board update' },
  { variant: 'image', title: 'Field notes' },
  { variant: 'quote', title: 'Keynote' },
  { variant: 'grid', title: 'Roadmap' },
  { variant: 'title', title: 'Onboarding' },
];

export function WorkspaceScene() {
  const elapsed = useElapsed(1800);
  return (
    <div className="flex h-full">
      <div className="flex w-[24%] flex-col gap-[0.4cqw] border-r border-hairline px-[1.6cqw] py-[2.2cqw] text-[1.15cqw]">
        <div className="mb-[1.4cqw] flex items-center gap-[0.8cqw] px-[0.8cqw] font-semibold">
          <FolderClosed className="size-[1.5cqw] text-brand" />
          my-slides
        </div>
        {[
          { icon: Layers, label: 'Decks' },
          { icon: Palette, label: 'Themes' },
          { icon: Image, label: 'Assets' },
        ].map(({ icon: Icon, label }, i) => (
          <div
            key={label}
            className={cn(
              'flex items-center gap-[0.8cqw] rounded-[0.6cqw] px-[0.8cqw] py-[0.6cqw]',
              i === 0 ? 'bg-foreground/[0.06] font-medium' : 'text-muted-foreground',
            )}
          >
            <Icon className="size-[1.3cqw]" />
            {label}
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col justify-center bg-canvas px-[3cqw] py-[2.4cqw]">
        <div className="mb-[1.8cqw] flex items-baseline gap-[0.8cqw]">
          <span className="text-[1.5cqw] font-semibold tracking-[-0.02em]">Decks</span>
          <span className="folio text-[0.95cqw]">06</span>
        </div>
        <div className="grid grid-cols-3 gap-x-[2cqw] gap-y-[1.8cqw]">
          {DECKS.map((deck, i) => (
            <div
              key={deck.title}
              className="ob-pop"
              style={{ animationDelay: `${150 + i * 85}ms` }}
            >
              <SlideSketch
                variant={deck.variant}
                className={cn(
                  'rounded-[0.7cqw] shadow-[0_0_0_0.5px_rgb(0_0_0/0.1),0_0.4cqw_1.2cqw_-0.4cqw_rgb(0_0_0/0.2)] transition-shadow duration-500',
                  i === 0 &&
                    elapsed >= 1500 &&
                    'shadow-[0_0_0_0.18cqw_var(--brand),0_0.8cqw_2cqw_-0.6cqw_rgb(254_82_38/0.45)]',
                )}
              />
              <p className="mt-[0.7cqw] truncate text-[1.05cqw] font-medium">{deck.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

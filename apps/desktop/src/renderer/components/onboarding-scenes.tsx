import { Check, FolderClosed, Image, Layers, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const reveal = (shown: boolean) =>
  cn(
    'transition-[opacity,transform,filter] duration-700 ease-[var(--ease-swift)]',
    shown ? 'opacity-100 blur-[0px]' : 'translate-y-[0.6cqw] opacity-0 blur-[3px]',
  );

type TokenKind = 'kw' | 'fn' | 'tag' | 'attr' | 'str' | 'text' | 'p';
type Token = { text: string; kind: TokenKind; mark?: 'title' };

const TOKEN_COLOR: Record<TokenKind, string> = {
  kw: '#ff8a5e',
  fn: '#f6c58f',
  tag: '#ffb38a',
  attr: '#a9c7ff',
  str: '#b5e3a8',
  text: 'rgb(255 255 255 / 0.92)',
  p: 'rgb(255 255 255 / 0.42)',
};

const t = (text: string, kind: TokenKind, mark?: 'title'): Token => ({ text, kind, mark });

const CODE: Token[][] = [
  [t('export default function ', 'kw'), t('Cover', 'fn'), t('() {', 'p')],
  [t('  return', 'kw'), t(' (', 'p')],
  [
    t('    <', 'p'),
    t('Slide', 'tag'),
    t(' tone', 'attr'),
    t('=', 'p'),
    t('"warm"', 'str'),
    t('>', 'p'),
  ],
  [
    t('      <', 'p'),
    t('Eyebrow', 'tag'),
    t('>', 'p'),
    t('Q4 launch', 'text'),
    t('</', 'p'),
    t('Eyebrow', 'tag'),
    t('>', 'p'),
  ],
  [
    t('      <', 'p'),
    t('Title', 'tag'),
    t('>', 'p'),
    t('Ship it beautifully.', 'text', 'title'),
    t('</', 'p'),
    t('Title', 'tag'),
    t('>', 'p'),
  ],
  [
    t('      <', 'p'),
    t('Stats', 'tag'),
    t(' data', 'attr'),
    t('={', 'p'),
    t('metrics', 'fn'),
    t('} />', 'p'),
  ],
  [t('    </', 'p'), t('Slide', 'tag'), t('>', 'p')],
  [t('  );', 'p')],
  [t('}', 'p')],
];

const LINE_ENDS = CODE.reduce<number[]>((ends, line, i) => {
  const length = line.reduce((sum, token) => sum + token.text.length, 0);
  ends.push((i ? (ends[i - 1] ?? 0) + 1 : 0) + length);
  return ends;
}, []);
const TOTAL_CHARS = LINE_ENDS[LINE_ENDS.length - 1] ?? 0;
const TITLE_START = (() => {
  let offset = 0;
  for (const [i, line] of CODE.entries()) {
    for (const token of line) {
      if (token.mark === 'title') return offset;
      offset += token.text.length;
    }
    if (i < CODE.length - 1) offset += 1;
  }
  return 0;
})();
const TITLE = 'Ship it beautifully.';
const TYPE_DELAY = 600;
const TYPE_SPEED = 22;

const lineEnd = (i: number) => LINE_ENDS[i] ?? 0;

export function CodeScene() {
  const elapsed = useElapsed(TYPE_DELAY + TOTAL_CHARS * TYPE_SPEED + 200);
  const typed = Math.max(0, Math.floor((elapsed - TYPE_DELAY) / TYPE_SPEED));

  return (
    <div className="flex h-full">
      <div
        className="flex w-[50%] flex-col justify-center px-[3.4cqw] font-mono text-[1.42cqw] leading-[1.75] whitespace-pre"
        style={{ background: '#141211', color: TOKEN_COLOR.text }}
      >
        {CODE.map((line, i) => {
          const start = i ? lineEnd(i - 1) + 1 : 0;
          const typing = typed >= start && typed <= lineEnd(i);
          let remaining = Math.max(0, Math.min(typed - start, lineEnd(i) - start));
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed listing
            <div key={i} className="flex min-h-[1.75em]">
              <span className="w-[2.2em] shrink-0 text-right text-white/20 select-none">
                {i + 1}
              </span>
              <span className="pl-[1.2em]">
                {line.map((token, j) => {
                  const shown = token.text.slice(0, remaining);
                  remaining -= shown.length;
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed tokens
                    <span key={j} style={{ color: TOKEN_COLOR[token.kind] }}>
                      {shown}
                    </span>
                  );
                })}
                {(typing || (i === CODE.length - 1 && typed > TOTAL_CHARS)) && (
                  <span className="ob-caret ml-px inline-block h-[1.15em] w-[0.5ch] translate-y-[0.2em] bg-[#ff8a5e]" />
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-1 items-center justify-center bg-canvas p-[3cqw]">
        <CoverSlide
          className={reveal(typed >= lineEnd(2))}
          eyebrow={typed >= lineEnd(3)}
          title={TITLE.slice(0, Math.max(0, typed - TITLE_START))}
          stats={typed >= lineEnd(5)}
        />
      </div>
    </div>
  );
}

const STATS = [
  { value: '+38%', label: 'Activation' },
  { value: '12k', label: 'Teams' },
  { value: '4.9', label: 'Rating' },
];

const BARS = [28, 36, 33, 48, 57, 72, 92];

function CoverSlide({
  className,
  eyebrow,
  title,
  stats,
  chart = false,
  warm = false,
}: {
  className?: string;
  eyebrow: boolean;
  title: string;
  stats: boolean;
  chart?: boolean;
  warm?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-[1cqw] text-[#1c1917] shadow-[0_0_0_0.5px_rgb(0_0_0/0.08),0_1.2cqw_3cqw_-1cqw_rgb(0_0_0/0.22)]',
        className,
      )}
      style={{ background: '#fdfaf6' }}
    >
      <span
        aria-hidden
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: warm ? 1 : 0,
          background: 'linear-gradient(135deg, #fff1e8 0%, #ffd9c4 100%)',
        }}
      />
      <span
        aria-hidden
        className="absolute aspect-square rounded-full transition-[width,top,right] duration-1000 ease-[var(--ease-swift)]"
        style={{
          width: warm ? '50%' : '44%',
          top: warm ? '-36%' : '-26%',
          right: warm ? '-10%' : '-14%',
          background: 'linear-gradient(200deg, #ff8a5e 0%, #fe5226 60%, #ee4316 100%)',
        }}
      />
      <div className="absolute top-[20%] left-[8%] w-[58%]">
        <p
          className={cn(
            'text-[1.05cqw] font-semibold tracking-[0.16em] text-[#ee4316] uppercase',
            reveal(eyebrow),
          )}
        >
          Q4 launch
        </p>
        <p className="mt-[0.8cqw] min-h-[2.2em] text-[2.5cqw] leading-[1.04] font-semibold tracking-[-0.035em]">
          {title}
        </p>
      </div>
      <div
        className={cn(
          'absolute bottom-[13%] left-[8%] flex gap-[2.6cqw] transition-opacity duration-500',
          chart && 'opacity-0',
        )}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={reveal(stats)}
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <p className="text-[1.75cqw] leading-none font-semibold tracking-[-0.03em]">
              {stat.value}
            </p>
            <p className="mt-[0.5cqw] text-[0.8cqw] text-black/45">{stat.label}</p>
          </div>
        ))}
      </div>
      {chart && (
        <div className="absolute right-[8%] bottom-[13%] left-[8%] flex h-[30%] items-end gap-[1.1%]">
          {BARS.map((h, i) => (
            <span
              key={h}
              className="ob-grow flex-1 rounded-t-[0.35cqw]"
              style={
                {
                  height: `${h}%`,
                  '--i': i,
                  background: i === BARS.length - 1 ? '#fe5226' : 'rgb(28 25 23 / 0.13)',
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

const PROMPT = 'Add a growth chart and warm up the palette.';
const STEPS = [
  { at: 2700, label: 'Read slides/launch/index.tsx' },
  { at: 3350, label: 'Added <GrowthChart />' },
  { at: 4000, label: 'Warmed the palette' },
];

export function AgentScene() {
  const elapsed = useElapsed(5200);
  const typed = Math.max(0, Math.floor((elapsed - 350) / 26));
  const thinking = elapsed >= 1700 && elapsed < (STEPS[0]?.at ?? 0);
  const done = elapsed >= 4700;

  return (
    <div className="flex h-full">
      <div className="flex flex-1 items-center justify-center bg-canvas p-[3cqw]">
        <CoverSlide
          eyebrow
          stats
          title={TITLE}
          chart={elapsed >= (STEPS[1]?.at ?? 0)}
          warm={elapsed >= (STEPS[2]?.at ?? 0)}
        />
      </div>
      <div className="flex w-[36%] flex-col border-l border-hairline bg-card">
        <div className="flex items-center gap-[0.8cqw] border-b border-hairline px-[2cqw] py-[1.3cqw]">
          <ProviderLogo provider="claude" className="size-[1.6cqw]" />
          <span className="text-[1.2cqw] font-semibold">Agent</span>
          <span className="text-[1.05cqw] text-muted-foreground">Claude Code</span>
        </div>
        <div className="flex flex-1 flex-col gap-[1.4cqw] overflow-hidden px-[2cqw] py-[2cqw] text-[1.15cqw] leading-[1.45]">
          {typed > 0 && (
            <div className="self-end rounded-[1.1cqw] rounded-br-[0.3cqw] bg-foreground px-[1.3cqw] py-[0.9cqw] text-background">
              {PROMPT.slice(0, typed)}
            </div>
          )}
          {thinking && (
            <span className="ob-shimmer self-start text-[1.1cqw] font-medium">Thinking…</span>
          )}
          <div className="flex flex-col gap-[0.8cqw]">
            {STEPS.filter((step) => elapsed >= step.at).map((step) => (
              <div key={step.label} className="ob-pop flex items-center gap-[0.8cqw]">
                <span className="flex size-[1.6cqw] shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-[1cqw]" strokeWidth={3} />
                </span>
                <span className="truncate font-mono text-[1cqw] text-muted-foreground">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          {done && (
            <p className="ob-pop text-foreground/85">Done — the cover now leads with growth.</p>
          )}
        </div>
        <div className="m-[1.6cqw] flex items-center justify-between rounded-[1cqw] border border-border px-[1.3cqw] py-[1cqw] text-[1.1cqw] text-muted-foreground">
          Ask for a change…
          <span className="flex size-[2cqw] items-center justify-center rounded-full bg-brand text-[1.1cqw] text-brand-foreground">
            ↑
          </span>
        </div>
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

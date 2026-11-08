'use client';

import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { type SketchVariant, SlideSketch } from './slide-sketch';

type DeckId = 'launch' | 'review' | 'offsite';

const DECKS: Record<DeckId, { title: string; slides: SketchVariant[] }> = {
  launch: { title: 'Q4 launch', slides: ['cover', 'title', 'chart', 'image', 'quote', 'grid'] },
  review: { title: 'Design review', slides: ['image', 'grid', 'quote', 'title', 'chart'] },
  offsite: { title: 'Team offsite', slides: ['title', 'quote', 'image', 'chart', 'grid'] },
};

type Beat = { tabs: DeckId[]; active: DeckId; slide: number; keys?: string[]; label?: string };

const BEATS: Beat[] = [
  { tabs: ['launch'], active: 'launch', slide: 0 },
  { tabs: ['launch'], active: 'launch', slide: 2, keys: ['↓'], label: 'Next slide' },
  { tabs: ['launch', 'review'], active: 'review', slide: 0, label: 'Open deck' },
  { tabs: ['launch', 'review', 'offsite'], active: 'offsite', slide: 0, label: 'Open deck' },
  {
    tabs: ['launch', 'review', 'offsite'],
    active: 'launch',
    slide: 2,
    keys: ['⌘', '2'],
    label: 'Jump to tab',
  },
  {
    tabs: ['launch', 'review', 'offsite'],
    active: 'review',
    slide: 1,
    keys: ['⌘', '⇧', ']'],
    label: 'Next tab',
  },
  {
    tabs: ['launch', 'offsite'],
    active: 'offsite',
    slide: 0,
    keys: ['⌘', 'W'],
    label: 'Close tab',
  },
  { tabs: ['launch'], active: 'launch', slide: 0, keys: ['⌘', 'W'], label: 'Close tab' },
];
const BEAT_MS = 2600;
const SNAP = { type: 'spring', bounce: 0.18, duration: 0.5 } as const;
const SOFT = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

export function WindowMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setBeat((b) => (b + 1) % BEATS.length), BEAT_MS);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  const { tabs, active, slide, keys, label } = BEATS[beat];
  const deck = DECKS[active];

  return (
    <div ref={ref} className="relative">
      <div className="glass relative overflow-hidden rounded-[14px] shadow-[0_0_0_0.5px_rgb(255_255_255/0.16),inset_0_1px_0_rgb(255_255_255/0.08),0_50px_100px_-30px_rgb(0_0_0/0.9),0_30px_80px_-40px_rgb(254_82_38/0.35)]">
        <TabStrip tabs={tabs} active={active} />

        <div className="grid grid-cols-[clamp(84px,17%,168px)_1fr]">
          <Rail deck={active} slide={slide} />
          <div className="relative m-[6px] ml-0 overflow-hidden rounded-[10px] bg-[#111013] shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.08)]">
            <StageBar title={deck.title} slide={slide} total={deck.slides.length} />
            <div className="relative flex items-center justify-center px-[6%] pt-[3%] pb-[6%]">
              <div className="relative w-full max-w-[760px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={`${active}-${slide}`}
                    initial={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.01, filter: 'blur(4px)' }}
                    transition={SOFT}
                  >
                    <SlideSketch
                      variant={deck.slides[slide]}
                      className="rounded-[6px] shadow-[0_0_0_0.5px_rgb(255_255_255/0.1),0_24px_48px_-20px_rgb(0_0_0/0.9)]"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 -bottom-14 left-0 flex justify-center sm:-bottom-16">
        <AnimatePresence mode="wait">
          {label ? (
            <motion.div
              key={beat}
              initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2.5 text-[12.5px] text-[color:var(--color-muted)]"
            >
              {keys ? (
                <span className="flex items-center gap-1">
                  {keys.map((k, i) => (
                    <KeyPress key={`${beat}-${k}`} delay={i * 0.06}>
                      {k}
                    </KeyPress>
                  ))}
                </span>
              ) : null}
              <span>{label}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function KeyPress({ children, delay }: { children: string; delay: number }) {
  const [down, setDown] = useState(false);
  useEffect(() => {
    const press = window.setTimeout(() => setDown(true), 180 + delay * 1000);
    const lift = window.setTimeout(() => setDown(false), 520 + delay * 1000);
    return () => {
      window.clearTimeout(press);
      window.clearTimeout(lift);
    };
  }, [delay]);
  return (
    <span className="keycap !h-[24px] !min-w-[24px] !px-1.5 !text-[11px]" data-down={down}>
      {children}
    </span>
  );
}

function TabStrip({ tabs, active }: { tabs: DeckId[]; active: DeckId }) {
  return (
    <div className="flex h-10 items-center gap-1 pr-2 pl-3">
      <div className="mr-3 flex shrink-0 items-center gap-2" aria-hidden>
        <span className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.25)]" />
        <span className="size-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.25)]" />
        <span className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.25)]" />
      </div>

      <span className="flex h-7 w-8 shrink-0 items-center justify-center rounded-[7px] text-white/55">
        <GridIcon />
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-1">
        <AnimatePresence initial={false}>
          {tabs.map((id) => {
            const on = id === active;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={SNAP}
                className="relative h-7 shrink-0 overflow-hidden"
              >
                {on ? (
                  <motion.span
                    layoutId="window-mock-tab"
                    transition={SNAP}
                    className="absolute inset-0 rounded-[7px] bg-white/[0.09] shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.1),0_1px_2px_rgb(0_0_0/0.4)]"
                  />
                ) : null}
                <span
                  className={`relative flex h-full items-center gap-1.5 px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-200 ${
                    on ? 'text-white/90' : 'text-white/45'
                  }`}
                >
                  <PresentIcon />
                  <span className="hidden sm:inline">{DECKS[id].title}</span>
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <span className="hidden h-7 shrink-0 items-center gap-1.5 rounded-[7px] px-2 text-[12px] font-medium text-white/45 md:flex">
        <FolderIcon />
        Talks
      </span>
      <span className="flex size-7 shrink-0 items-center justify-center text-white/45">
        <GearIcon />
      </span>
    </div>
  );
}

function Rail({ deck, slide }: { deck: DeckId; slide: number }) {
  const slides = DECKS[deck].slides;
  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden px-2.5 pt-1.5 pb-3 [mask-image:linear-gradient(180deg,#000_80%,transparent)]">
        <div className="mb-2 hidden items-center justify-between px-1 text-[10.5px] font-medium tracking-[0.06em] text-white/35 uppercase sm:flex">
          <span>Slides</span>
          <span className="nums">{slides.length}</span>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.ol
            key={deck}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={SOFT}
            className="flex flex-col gap-2"
          >
            {slides.map((variant, i) => (
              <li key={`${variant}-${i}`} className="relative flex items-start gap-1.5">
                <span
                  className={`nums hidden w-3 pt-0.5 text-right font-[family-name:var(--font-mono)] text-[9px] transition-colors sm:block ${
                    i === slide ? 'text-white/80' : 'text-white/30'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="relative block flex-1">
                  {i === slide ? (
                    <motion.span
                      layoutId="window-mock-thumb"
                      transition={SNAP}
                      className="absolute -inset-[3px] rounded-[6px] shadow-[0_0_0_1.5px_#fe5226]"
                    />
                  ) : null}
                  <SlideSketch
                    variant={variant}
                    className="rounded-[3px] shadow-[0_0_0_0.5px_rgb(255_255_255/0.12)]"
                  />
                </span>
              </li>
            ))}
          </motion.ol>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StageBar({ title, slide, total }: { title: string; slide: number; total: number }) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-white/[0.06] px-3.5">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={title}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[12.5px] font-medium text-white/80"
        >
          {title}
        </motion.span>
      </AnimatePresence>
      <div className="flex items-center gap-2.5">
        <span className="nums hidden font-[family-name:var(--font-mono)] text-[10.5px] text-white/35 sm:inline">
          {String(slide + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="flex h-6 items-center gap-1.5 rounded-full bg-white px-2.5 text-[11px] font-medium text-[#0b0a0c]">
          <svg viewBox="0 0 24 24" className="size-2.5" fill="currentColor" aria-hidden>
            <path d="M7 4.5v15l12.5-7.5z" />
          </svg>
          Present
        </span>
      </div>
    </div>
  );
}

const icon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function GridIcon() {
  return (
    <svg {...icon} className="size-3.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function PresentIcon() {
  return (
    <svg {...icon} className="size-3.5 shrink-0 opacity-60">
      <path d="M2 3h20" />
      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
      <path d="m7 21 5-5 5 5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg {...icon} className="size-3.5">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg {...icon} className="size-4">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

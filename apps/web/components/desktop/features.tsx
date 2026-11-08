'use client';

import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { SlideSketch } from './slide-sketch';

const SWIFT = [0.22, 1, 0.36, 1] as const;
const SNAP = { type: 'spring', bounce: 0.2, duration: 0.55 } as const;

function useTicker(count: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % count), ms);
    return () => window.clearInterval(id);
  }, [inView, reduced, count, ms]);
  return { ref, tick, still: !!reduced };
}

function trackPointer(e: PointerEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

function Card({
  title,
  body,
  className = '',
  children,
}: {
  title: ReactNode;
  body: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article onPointerMove={trackPointer} className={`card flex flex-col ${className}`}>
      <div className="relative flex h-[260px] items-center justify-center overflow-hidden px-6 sm:h-[280px]">
        {children}
      </div>
      <div className="px-7 pt-1 pb-7">
        <h3 className="serif text-[24px] leading-[1.2] text-[color:var(--color-text)]">{title}</h3>
        <p className="mt-2 max-w-[44ch] text-pretty text-[14.5px] leading-[1.6] text-[color:var(--color-muted)]">
          {body}
        </p>
      </div>
    </article>
  );
}

export function Features() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 pt-4 pb-24 sm:px-8 sm:pt-8 sm:pb-32">
      <div
        data-reveal="stagger"
        className="mx-auto mb-14 flex max-w-[760px] flex-col items-center gap-5 text-center sm:mb-20"
      >
        <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] text-[color:var(--ember-soft)] uppercase">
          What's inside
        </span>
        <h2 className="serif text-balance text-[38px] leading-[1.05] text-[color:var(--color-text)] sm:text-[56px]">
          The studio you know,{' '}
          <em className="text-[color:var(--color-text-soft)]">with a place to live.</em>
        </h2>
      </div>

      <div data-reveal="stagger" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card
          className="lg:col-span-7"
          title="A tab for every deck."
          body="Home stays pinned and each deck opens beside it. Drag to reorder, jump with the keyboard, and pick up where you left off."
        >
          <TabsVisual />
        </Card>
        <Card
          className="lg:col-span-5"
          title="Window material, not a web page."
          body="Translucent chrome lets your desktop show through on macOS and Windows 11. Prefer it solid? One switch in Settings."
        >
          <VibrancyVisual />
        </Card>
        <Card
          className="lg:col-span-5"
          title="Your agent, one sign-in away."
          body="Claude Code and Codex come built in. Sign in with the account you already use, and the app fetches the rest."
        >
          <AgentsVisual />
        </Card>
        <Card
          className="lg:col-span-7"
          title="Nothing to install."
          body="The app carries its own open-slide. Open the folder you already work in, or just start a deck — no Node, no terminal."
        >
          <SetupVisual />
        </Card>
      </div>
    </section>
  );
}

const TAB_ORDERS = [
  ['Q4 launch', 'Design review', 'Team offsite'],
  ['Design review', 'Q4 launch', 'Team offsite'],
  ['Design review', 'Team offsite', 'Q4 launch'],
  ['Q4 launch', 'Design review', 'Team offsite'],
];
const SHORTCUTS = [
  { keys: ['⌘', '1–9'], label: 'Jump' },
  { keys: ['⌘', '⇧', '[ ]'], label: 'Cycle' },
  { keys: ['⌘', 'W'], label: 'Close' },
];

function TabsVisual() {
  const { ref, tick, still } = useTicker(TAB_ORDERS.length * 3, 1100);
  const order = TAB_ORDERS[Math.floor(tick / 3) % TAB_ORDERS.length];
  const pressed = still ? -1 : tick % 3;
  const dragging = order[0] === 'Design review' && tick % 3 === 0 ? order[0] : null;

  return (
    <div ref={ref} className="flex w-full max-w-[460px] flex-col items-center gap-9">
      <div className="glass flex h-11 w-full items-center gap-1 rounded-xl px-2 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.12),0_20px_40px_-20px_rgb(0_0_0/0.8)]">
        <span className="flex h-7 w-8 shrink-0 items-center justify-center rounded-[7px] text-white/50">
          <svg
            viewBox="0 0 24 24"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </span>
        {order.map((title, i) => (
          <motion.span
            key={title}
            layout
            transition={SNAP}
            animate={{
              scale: dragging === title ? 1.04 : 1,
              y: dragging === title ? -2 : 0,
            }}
            className={`relative flex h-7 min-w-0 flex-1 items-center rounded-[7px] px-2.5 text-[12px] font-medium whitespace-nowrap ${
              i === 0
                ? 'bg-white/[0.09] text-white/90 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.1)]'
                : 'text-white/45'
            } ${dragging === title ? 'z-10 shadow-[0_8px_20px_-6px_rgb(0_0_0/0.8),inset_0_0_0_0.5px_rgb(255_255_255/0.16)]' : ''}`}
          >
            <span className="truncate">{title}</span>
          </motion.span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {SHORTCUTS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="flex gap-1">
              {s.keys.map((k) => (
                <span key={k} className="keycap" data-down={pressed === i}>
                  {k}
                </span>
              ))}
            </span>
            <span
              className={`text-[12px] transition-colors duration-300 ${
                pressed === i
                  ? 'text-[color:var(--color-text-soft)]'
                  : 'text-[color:var(--color-dim)]'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VibrancyVisual() {
  const { ref, tick, still } = useTicker(2, 2800);
  const solid = !still && tick === 1;

  return (
    <div ref={ref} className="absolute inset-0">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 70% at 18% 30%, rgb(254 82 38 / 0.55), transparent 60%), radial-gradient(50% 60% at 85% 75%, rgb(255 180 120 / 0.35), transparent 60%), radial-gradient(40% 50% at 70% 10%, rgb(120 70 160 / 0.35), transparent 60%), #120d10',
        }}
      />
      <div className="absolute inset-x-6 top-8 bottom-0 overflow-hidden rounded-t-[12px] shadow-[0_0_0_0.5px_rgb(255_255_255/0.16),0_30px_60px_-20px_rgb(0_0_0/0.9)] sm:inset-x-10">
        <div
          className="absolute inset-0 transition-[background-color,backdrop-filter] duration-700"
          style={{
            backgroundColor: solid ? 'rgb(28 26 30 / 1)' : 'rgb(28 24 28 / 0.42)',
            backdropFilter: 'blur(28px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          }}
        />
        <div className="relative flex h-8 items-center gap-1.5 px-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="relative grid h-full grid-cols-[30%_1fr] gap-1.5 px-1.5">
          <div className="flex flex-col gap-1.5 px-1 pt-1">
            {(['cover', 'chart', 'quote'] as const).map((v, i) => (
              <SlideSketch
                key={v}
                variant={v}
                className={`rounded-[3px] ${i === 0 ? 'shadow-[0_0_0_1.5px_#fe5226]' : 'shadow-[0_0_0_0.5px_rgb(255_255_255/0.1)]'}`}
              />
            ))}
          </div>
          <div className="rounded-t-[8px] bg-[#121114] p-3 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.08)]">
            <SlideSketch variant="cover" className="rounded-[4px]" />
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-black/45 py-1 pr-1 pl-3 text-[11px] font-medium text-white/70 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.12)] backdrop-blur-md">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={solid ? 'solid' : 'clear'}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18 }}
          >
            {solid ? 'Solid' : 'Translucent'}
          </motion.span>
        </AnimatePresence>
        <span
          className={`relative flex h-[18px] w-[30px] items-center rounded-full p-[2px] transition-colors duration-300 ${
            solid ? 'bg-white/15' : 'bg-[#fe5226]'
          }`}
        >
          <motion.span
            layout
            transition={SNAP}
            className={`size-[14px] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.4)] ${solid ? '' : 'ml-auto'}`}
          />
        </span>
      </div>
    </div>
  );
}

const AGENT_STEPS = ['idle', 'waiting', 'done', 'done'] as const;

function AgentsVisual() {
  const { ref, tick, still } = useTicker(AGENT_STEPS.length, 1500);
  const codex = still ? 'done' : AGENT_STEPS[tick];

  return (
    <div ref={ref} className="flex w-full max-w-[360px] flex-col gap-2.5">
      <AgentRow icon="/assets/claude.svg" name="Claude Code" state="done" />
      <AgentRow icon="/assets/codex-dark.svg" name="Codex" state={codex} />
    </div>
  );
}

function AgentRow({
  icon,
  name,
  state,
}: {
  icon: string;
  name: string;
  state: (typeof AGENT_STEPS)[number];
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-xl bg-white/[0.035] px-3.5 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.1)]">
      <span className="flex size-8 items-center justify-center rounded-lg bg-white/[0.06] shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.1)]">
        <img src={icon} alt="" className="size-4" />
      </span>
      <span className="flex-1 text-[13.5px] font-medium text-white/85">{name}</span>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' ? (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: SWIFT }}
            className="flex h-7 items-center rounded-full bg-white px-3 text-[11.5px] font-medium text-[#0b0a0c]"
          >
            Sign in
          </motion.span>
        ) : state === 'waiting' ? (
          <motion.span
            key="waiting"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: SWIFT }}
            className="flex items-center gap-2 text-[11.5px] text-white/50"
          >
            <span className="size-3 animate-spin rounded-full border-[1.5px] border-white/20 border-t-white/70" />
            Opening browser
          </motion.span>
        ) : (
          <motion.span
            key="done"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: SWIFT }}
            className="flex items-center gap-1.5 text-[11.5px] text-white/60"
          >
            <svg viewBox="0 0 16 16" className="size-3.5 text-[#4ade80]" fill="none" aria-hidden>
              <motion.path
                d="M3.5 8.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: SWIFT, delay: 0.05 }}
              />
            </svg>
            Signed in
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

const SETUP_LINES = ['brew install node', 'npx @open-slide/cli init', 'pnpm install', 'pnpm dev'];

function SetupVisual() {
  const { ref, tick, still } = useTicker(SETUP_LINES.length + 3, 700);
  const struck = still ? SETUP_LINES.length : Math.min(tick, SETUP_LINES.length);
  const done = still || tick >= SETUP_LINES.length + 1;

  return (
    <div
      ref={ref}
      className="w-full max-w-[460px] font-[family-name:var(--font-mono)] text-[12.5px]"
    >
      <div className="overflow-hidden rounded-xl bg-black/40 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.1)]">
        <div className="flex h-8 items-center gap-1.5 border-b border-white/[0.06] px-3">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="ml-2 text-[11px] text-white/30">Terminal</span>
        </div>
        <ul className="flex flex-col gap-2 px-4 py-4">
          {SETUP_LINES.map((line, i) => {
            const off = i < struck;
            return (
              <li key={line} className="relative w-fit">
                <span
                  className={`transition-colors duration-500 ${off ? 'text-white/25' : 'text-white/70'}`}
                >
                  <span className="text-[color:var(--ember)]/70">$ </span>
                  {line}
                </span>
                <motion.span
                  aria-hidden
                  className="absolute top-1/2 right-0 left-0 h-px origin-left bg-white/40"
                  initial={false}
                  animate={{ scaleX: off ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: SWIFT }}
                />
              </li>
            );
          })}
        </ul>
      </div>
      <motion.div
        initial={false}
        animate={{
          opacity: done ? 1 : 0,
          y: done ? 0 : 6,
          filter: done ? 'blur(0px)' : 'blur(4px)',
        }}
        transition={{ duration: 0.5, ease: SWIFT }}
        className="mt-4 flex items-center justify-center gap-2.5 font-[family-name:var(--font-sans)] text-[13px] text-white/75"
      >
        <span className="relative block size-5 overflow-hidden rounded-[5px] bg-gradient-to-b from-white to-[#efebe6]">
          <span className="absolute top-[32%] left-[20%] h-[36%] w-[60%] rounded-[2px] bg-gradient-to-b from-[#ff8a5e] to-[#ee4316]" />
        </span>
        Just open the app.
      </motion.div>
    </div>
  );
}

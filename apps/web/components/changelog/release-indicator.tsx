'use client';

import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export type IndicatorEntry = {
  id: string;
  version: string;
  date: string;
};

const STICKY_TOP = 92;
const EASE = [0.23, 1, 0.32, 1] as const;

const roll: Variants = {
  enter: (dir: number) => ({ y: dir > 0 ? '105%' : '-105%', opacity: 0, filter: 'blur(4px)' }),
  center: { y: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: (dir: number) => ({ y: dir > 0 ? '-105%' : '105%', opacity: 0, filter: 'blur(4px)' }),
};

// Numbers roll as whole units, so 1.9 → 1.10 reads as one tick of the minor
// version rather than digits shuffling independently.
const tokenize = (text: string) => text.split(/(\d+|\s+|[^\d\s]+)/).filter(Boolean);

export function ReleaseIndicator({ entries }: { entries: IndicatorEntry[] }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(-1);
  const [dir, setDir] = useState(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    const articles = entries.map((entry) => document.getElementById(entry.id));
    let frame = 0;
    let current = -1;

    const update = () => {
      frame = 0;
      // An entry takes over once its own label touches the bottom of this
      // one, so the incoming label folds into it instead of overlapping.
      const height = ref.current?.offsetHeight ?? 0;
      let next = -1;
      articles.forEach((article, i) => {
        if (!article || article.offsetParent === null) return;
        if (article.getBoundingClientRect().top <= STICKY_TOP + height) next = i;
      });
      articles.forEach((article, i) => {
        if (!article) return;
        if (next >= 0 && i <= next) article.dataset.passed = 'true';
        else delete article.dataset.passed;
      });
      if (next !== current) {
        setDir(next > current ? 1 : -1);
        current = next;
        setActive(next);
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // The Highlights filter hides entries without scrolling the page.
    document.addEventListener('change', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('change', schedule);
      for (const article of articles) if (article) delete article.dataset.passed;
    };
  }, [entries]);

  const entry = active >= 0 ? entries[active] : null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-full mr-10 hidden w-[160px] min-[1200px]:block"
    >
      <a
        ref={ref}
        href={entry ? `#${entry.id}` : undefined}
        tabIndex={-1}
        className={`pointer-events-auto sticky top-[92px] flex flex-col items-end gap-1.5 pt-[3px] text-right transition-opacity duration-300 ${
          entry ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <RollingText
          text={entry?.version ?? ''}
          dir={dir}
          reduced={!!reduced}
          className="nums font-[family-name:var(--font-mono)] text-[15px] font-medium text-[color:var(--color-text)]"
        />
        <RollingText
          text={entry?.date ?? ''}
          dir={dir}
          reduced={!!reduced}
          delay={0.04}
          className="nums text-[13px] text-[color:var(--color-muted)]"
        />
      </a>
    </div>
  );
}

function RollingText({
  text,
  dir,
  reduced,
  delay = 0,
  className,
}: {
  text: string;
  dir: number;
  reduced: boolean;
  delay?: number;
  className: string;
}) {
  const tokens = tokenize(text);
  return (
    <span className={`flex justify-end whitespace-pre leading-[1.35] ${className}`}>
      {tokens.map((token, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional; the token inside is keyed by value
          key={i}
          layout={reduced ? false : 'position'}
          transition={{ layout: { duration: 0.45, ease: EASE } }}
          className="relative inline-flex overflow-hidden"
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.span
              key={token}
              custom={dir}
              variants={reduced ? undefined : roll}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: EASE, delay: delay + i * 0.035 }}
              className="inline-block"
            >
              {token}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      ))}
    </span>
  );
}

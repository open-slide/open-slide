'use client';

import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { type CSSProperties, Fragment, useRef } from 'react';
import { AppIcon } from './app-icon';
import { CtaRow } from './cta';
import { EmberField } from './ember-field';
import { useReducedMotion } from './use-reduced-motion';
import { WindowMock } from './window-mock';

const HEADLINE = ['Your', 'decks,'];
const HEADLINE_EM = ['going', 'native.'];
const ICON_RISE = {
  animationDuration: '1600ms',
  '--rise-y': '24px',
  '--rise-blur': '12px',
} as CSSProperties;
const wordDelay = (i: number) => `${320 + i * 70}ms`;

export function DesktopHero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'start 0.2'],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const rotateX = useTransform(progress, [0, 1], reduced ? [0, 0] : [26, 0]);
  const scale = useTransform(progress, [0, 1], reduced ? [1, 1] : [0.9, 1]);
  const y = useTransform(progress, [0, 1], reduced ? [0, 0] : [-40, 0]);

  return (
    <section className="relative overflow-hidden">
      <EmberField className="inset-x-0 top-0 h-[1200px] sm:h-[1400px]" />

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 pt-16 text-center sm:px-8 sm:pt-24">
        <div className="rise" style={ICON_RISE}>
          <AppIcon size={96} />
        </div>

        <div
          className="rise badge-ring mt-10 inline-flex h-8 items-center gap-2.5 px-3.5 text-[12.5px] font-medium text-[color:var(--color-text-soft)]"
          style={{ animationDelay: '200ms' }}
        >
          <span className="relative flex size-1.5">
            <span className="live-dot absolute inset-0 rounded-full bg-[color:var(--ember)]" />
          </span>
          <span className="text-[color:var(--color-text)]">Coming soon</span>
          <span aria-hidden className="h-3 w-px bg-white/15" />
          <span>open-slide for desktop</span>
        </div>

        <h1 className="serif mt-7 text-balance text-[52px] leading-[0.98] text-[color:var(--color-text)] sm:text-[88px] lg:text-[108px]">
          <span className="block">
            {HEADLINE.map((w, i) => (
              <Fragment key={w}>
                {i > 0 ? ' ' : null}
                <span className="rise rise-word" style={{ animationDelay: wordDelay(i) }}>
                  {w}
                </span>
              </Fragment>
            ))}
          </span>{' '}
          <em className="block">
            {HEADLINE_EM.map((w, i) => (
              <Fragment key={w}>
                {i > 0 ? ' ' : null}
                <span
                  className="rise rise-word ember-ink"
                  style={{ animationDelay: wordDelay(HEADLINE.length + i) }}
                >
                  {w}
                </span>
              </Fragment>
            ))}
          </em>
        </h1>

        <p
          className="rise mt-7 max-w-[34rem] text-balance text-[16.5px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[18px]"
          style={{ animationDelay: '720ms' }}
        >
          open-slide is moving into a window of its own. Every deck in its own tab, your agent one
          sign‑in away, and nothing to install — not even Node.
        </p>

        <div className="rise mt-9" style={{ animationDelay: '840ms' }}>
          <CtaRow />
        </div>

        <p
          className="rise mt-6 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] text-[color:var(--color-dim)] uppercase"
          style={{ animationDelay: '960ms' }}
        >
          macOS · Windows
        </p>
      </div>

      <div
        ref={stageRef}
        className="rise-frame relative mx-auto mt-16 w-full max-w-[1120px] px-4 pb-28 sm:mt-24 sm:px-8 sm:pb-36"
        style={{ animationDelay: '1000ms', perspective: '2200px' }}
      >
        <motion.div style={{ rotateX, scale, y, transformOrigin: '50% 0%' }}>
          <WindowMock />
        </motion.div>
      </div>
    </section>
  );
}

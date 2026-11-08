'use client';

import { type MotionValue, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

const TEXT =
  'Same canvas. Same inspector. Same agent drafting your slides from a sentence. It just finally has a window of its own — one you can keep in the dock, flip between decks in, and present from without a browser in sight.';

export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = TEXT.split(' ');

  return (
    <section className="hairline-top mx-auto w-full max-w-[1200px] px-6 py-28 sm:px-8 sm:py-40">
      <p
        ref={ref}
        className="serif mx-auto max-w-[980px] text-balance text-center text-[28px] leading-[1.2] text-[color:var(--color-text)] sm:text-[40px] lg:text-[48px]"
      >
        {words.map((w, i) => (
          <Word
            key={i}
            progress={scrollYProgress}
            range={[i / words.length, (i + 1) / words.length]}
            still={!!reduced}
          >
            {w}
          </Word>
        ))}
      </p>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
  still,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  still: boolean;
}) {
  const opacity = useTransform(progress, range, still ? [1, 1] : [0.16, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{' '}
    </>
  );
}

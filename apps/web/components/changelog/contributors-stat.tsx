'use client';

import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import type { Contributor } from '@/lib/changelog';

const EASE = [0.23, 1, 0.32, 1] as const;
const SHOWN = 4;
const SIZE = 20;
const STEP = 12;
const STAGGER = 0.018;

const avatarSrc = (handle: string) => `https://github.com/${handle}.png?size=64`;

const stacked: Variants = {
  rest: (i: number) => ({
    x: 0,
    opacity: i < SHOWN ? 1 : 0,
    transition: { x: { type: 'spring', bounce: 0.3, duration: 0.4 }, opacity: { delay: 0.35 } },
  }),
  fan: (i: number) => ({
    x: Math.min(i, SHOWN - 1) * 4,
    opacity: i < SHOWN ? 1 : 0,
    transition: { type: 'spring', bounce: 0.3, duration: 0.4 },
  }),
};

export function ContributorsStat({ contributors }: { contributors: Contributor[] }) {
  const [open, setOpen] = useState(false);
  const toggled = useRef(false);
  const reduced = !!useReducedMotion();

  const fly = (i: number) =>
    reduced
      ? { duration: 0 }
      : { type: 'spring' as const, bounce: 0.22, duration: 0.65, delay: i * STAGGER };
  const gather = (i: number) =>
    reduced
      ? { duration: 0 }
      : { type: 'spring' as const, bounce: 0.12, duration: 0.45, delay: i * 0.006 };

  const toggle = () => {
    toggled.current = true;
    setOpen((value) => !value);
  };

  return (
    <>
      <motion.div
        initial="rest"
        animate="rest"
        whileHover={open || reduced ? undefined : 'fan'}
        className="group relative flex flex-col gap-1 bg-[color:var(--color-panel)] px-4 py-4"
      >
        <dt className="caption order-2 flex items-center gap-1 transition-colors group-hover:text-[color:var(--color-text-soft)]">
          Contributors
          <ChevronDown
            aria-hidden
            strokeWidth={1.8}
            className={`size-3 transition-transform duration-300 ease-[var(--ease-out-strong)] ${open ? 'rotate-180' : ''}`}
          />
        </dt>
        <dd className="order-1 flex items-center gap-3">
          <span className="nums font-[family-name:var(--font-mono)] text-[17px] font-medium text-[color:var(--color-text)]">
            {contributors.length}
          </span>
          <span
            aria-hidden
            className="relative block h-[20px]"
            style={{ width: SIZE + (SHOWN - 1) * STEP }}
          >
            {open
              ? null
              : contributors.map((contributor, i) => (
                  <motion.span
                    key={contributor.handle}
                    layoutId={`cl-avatar-${contributor.handle}`}
                    custom={i}
                    variants={stacked}
                    initial={toggled.current ? { opacity: 1 } : false}
                    transition={{ layout: gather(i) }}
                    className="absolute top-0 block size-[20px] rounded-full ring-2 ring-[color:var(--color-panel)]"
                    style={{
                      left: Math.min(i, SHOWN - 1) * STEP,
                      zIndex: contributors.length - i,
                    }}
                  >
                    <Avatar handle={contributor.handle} size={SIZE} />
                  </motion.span>
                ))}
          </span>
        </dd>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="cl-contributors"
          aria-label={open ? 'Hide contributors' : `Show all ${contributors.length} contributors`}
          onClick={toggle}
          className="absolute inset-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--color-accent)]"
        />
      </motion.div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="crowd"
            id="cl-contributors"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0, transition: { duration: reduced ? 0 : 0.4, ease: EASE } }}
            transition={{ duration: reduced ? 0 : 0.5, ease: EASE }}
            className="order-last col-span-full bg-[color:var(--color-panel)]"
          >
            <div className="px-4 pt-4 pb-5">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.3, delay: reduced ? 0 : 0.15 }}
                className="caption"
              >
                In order of their first release
              </motion.p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3 md:grid-cols-4">
                {contributors.map((contributor, i) => (
                  <li key={contributor.handle} className="min-w-0">
                    <a
                      href={`https://github.com/${contributor.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-w-0 items-center gap-2.5"
                    >
                      <motion.span
                        layoutId={`cl-avatar-${contributor.handle}`}
                        initial={i < SHOWN ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0 } }}
                        transition={{
                          layout: fly(i),
                          opacity: { duration: 0.2, delay: i * STAGGER },
                        }}
                        className="relative block size-7 shrink-0 rounded-full ring-2 ring-[color:var(--color-panel)] transition-shadow duration-200 group-hover:ring-[color:var(--color-rule)]"
                        style={{ zIndex: contributors.length - i }}
                      >
                        <Avatar handle={contributor.handle} size={28} />
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, x: -6, filter: 'blur(3px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{
                          duration: reduced ? 0 : 0.35,
                          ease: EASE,
                          delay: reduced ? 0 : 0.22 + i * STAGGER,
                        }}
                        className="flex min-w-0 flex-col"
                      >
                        <span className="truncate text-[13px] text-[color:var(--color-text-soft)] transition-colors group-hover:text-[color:var(--color-text)]">
                          @{contributor.handle}
                        </span>
                        <span className="nums font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-muted)]">
                          since {contributor.since}
                        </span>
                      </motion.span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Avatar({ handle, size }: { handle: string; size: number }) {
  return (
    <Image
      src={avatarSrc(handle)}
      alt=""
      width={size}
      height={size}
      unoptimized
      draggable={false}
      className="block size-full rounded-full bg-[color:var(--color-panel-hi)]"
    />
  );
}

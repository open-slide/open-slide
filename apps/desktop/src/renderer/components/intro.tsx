import { useEffect, useMemo, useRef } from 'react';
import type { IntroTarget } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { SKETCH_VARIANTS, type SketchVariant, SlideSketch } from './slide-sketch';

const SWIFT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SOFT_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const ACCELERATE = 'cubic-bezier(0.6, 0, 0.85, 0.35)';
// The veil stays translucent so the desktop shows through, dimming a touch
// further once the mark forms to pull focus to it.
const VEIL = 'rgb(11 9 8 / 0.58)';
const VEIL_DEEP = 'rgb(11 9 8 / 0.72)';
const WORDMARK = 'open-slide';
const TAGLINE = 'Beautiful decks, drafted with your agent.';
const CARD_COUNT = 18;
const PLAIN = SKETCH_VARIANTS.filter((variant) => variant !== 'cover');
const PARTICLE_COUNT = 30;

const at = {
  glow: 150,
  deck: 450,
  converge: 2850,
  ignite: 3450,
  tile: 3620,
  lift: 4100,
  word: 4250,
  tagline: 5000,
  sheen: 4400,
  exit: 7300,
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

function random(seed: number) {
  let t = seed;
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296;
    return t / 4294967296;
  };
}

// A damped spring sampled into a CSS linear() easing, so a two-keyframe
// animation overshoots and settles like a physical object.
function springEasing(duration: number, damping = 0.58, stiffness = 13): string {
  const omega = stiffness;
  const damped = omega * Math.sqrt(1 - damping * damping);
  const points: string[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (duration / 1000);
    const decay = Math.exp(-damping * omega * t);
    const x =
      1 - decay * (Math.cos(damped * t) + ((damping * omega) / damped) * Math.sin(damped * t));
    points.push((i === steps ? 1 : x).toFixed(4));
  }
  return `linear(${points.join(', ')})`;
}

type Card = {
  variant: SketchVariant;
  order: number;
  pose: string;
  from: string;
  width: number;
};

function layoutDeck(width: number, height: number): Card[] {
  const rand = random(7);
  const cardWidth = Math.min(300, Math.max(150, width * 0.15));
  const orders = Array.from({ length: CARD_COUNT }, (_, i) => i).sort(() => rand() - 0.5);
  return Array.from({ length: CARD_COUNT }, (_, i) => {
    const outer = i < 11;
    const ringIndex = outer ? i : i - 11;
    const ringSize = outer ? 11 : CARD_COUNT - 11;
    const angle = (ringIndex / ringSize) * Math.PI * 2 + (outer ? 0.2 : 0.62) + rand() * 0.18;
    const rx = (outer ? 0.41 : 0.23) * width;
    const ry = (outer ? 0.36 : 0.2) * height;
    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;
    const z = outer ? -80 + rand() * 220 : -520 + rand() * 180;
    const rotateY = Math.cos(angle) * -22;
    const rotateX = Math.sin(angle) * 14;
    const rotateZ = (rand() - 0.5) * 16;
    const variant: SketchVariant =
      i === 3 || i === 13 ? 'cover' : (PLAIN[i % PLAIN.length] ?? 'title');
    return {
      variant,
      order: orders[i] ?? i,
      width: cardWidth * (outer ? 1 : 0.82),
      pose: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
      from: `translate3d(${x * 0.12}px, ${y * 0.12}px, -2800px) rotateX(${rotateX * 3}deg) rotateY(${rotateY * 3}deg) rotateZ(${rotateZ * 4}deg)`,
    };
  });
}

function layoutParticles() {
  const rand = random(19);
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = rand() * Math.PI * 2;
    const distance = 140 + rand() * 360;
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 2 + rand() * 3,
      warm: rand() > 0.45,
      duration: 1300 + rand() * 900,
      delay: rand() * 160,
    };
  });
}

export function Intro() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const cards = useMemo(() => layoutDeck(window.innerWidth, window.innerHeight), []);
  const particles = useMemo(layoutParticles, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const content = contentRef.current;
    if (!scene || !content) return;

    let cancelled = false;
    let exiting = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    let target: IntroTarget | null = null;

    const animate = (
      el: Element | null | undefined,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => el?.animate(keyframes, { fill: 'both', easing: SWIFT, ...options });

    const finish = () => {
      if (!cancelled) desktop.intro.done();
    };

    const exit = (fast: boolean) => {
      if (exiting || cancelled) return;
      exiting = true;
      for (const timer of timers) clearTimeout(timer);
      const fadeOut = animate(
        content,
        [{ opacity: 0, filter: 'blur(12px)', transform: 'scale(0.985)' }],
        { duration: fast ? 300 : 620, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      );
      const dissolve = () => {
        if (cancelled) return;
        desktop.intro.reveal();
        later(170, () => {
          const fade = animate(scene, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 420,
            easing: 'ease-out',
            fill: 'forwards',
          });
          fade?.finished.then(finish, finish);
        });
      };
      fadeOut?.finished.then(() => {
        if (cancelled) return;
        if (!target) {
          dissolve();
          return;
        }
        const { innerWidth: w, innerHeight: h } = window;
        const { x, y, width, height, radius, dark } = target;
        const frame = frameRef.current;
        if (frame) {
          Object.assign(frame.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${radius}px`,
            color: dark ? '#fff' : '#000',
          });
          animate(frame, [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], {
            duration: fast ? 760 : 1050,
            easing: 'ease-out',
          });
        }
        const fold = animate(
          scene,
          [
            { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
            {
              clipPath: `inset(${y}px ${w - x - width}px ${h - y - height}px ${x}px round ${radius}px)`,
              backgroundColor: dark ? '#0d0d0d' : '#f4f3f2',
            },
          ],
          { duration: fast ? 760 : 1050, easing: IN_OUT, fill: 'forwards' },
        );
        fold?.finished.then(dissolve, dissolve);
      }, finish);
    };

    const run = () => {
      const h = window.innerHeight;
      const icon = iconRef.current;
      const iconBox = icon?.getBoundingClientRect();
      const lift = iconBox ? h / 2 - (iconBox.top + iconBox.height / 2) : 0;

      animate(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
      animate(scene, [{ backgroundColor: VEIL }, { backgroundColor: VEIL_DEEP }], {
        delay: at.ignite - 300,
        duration: 1400,
        easing: IN_OUT,
      });
      animate(
        glowRef.current,
        [
          { opacity: 0, transform: 'translate(-50%, -50%) scale(0.25)' },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        ],
        { delay: at.glow, duration: 2600 },
      );
      animate(
        glowRef.current,
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1, offset: 0.25 },
          { transform: 'translate(-50%, -50%) scale(0.92)', opacity: 0.85 },
        ],
        { delay: at.ignite, duration: 3200, fill: 'forwards' },
      );

      animate(
        deckRef.current,
        [
          { transform: 'rotateZ(-5deg) rotateX(6deg) scale(0.96)' },
          { transform: 'rotateZ(3deg) rotateX(-2deg) scale(1.04)' },
        ],
        { delay: at.deck, duration: at.converge - at.deck + 600, easing: IN_OUT },
      );

      const cardEls = deckRef.current?.children ?? [];
      cards.forEach((card, i) => {
        const el = cardEls[i];
        animate(
          el,
          [
            { transform: card.from, opacity: 0 },
            { opacity: 1, offset: 0.35 },
            { transform: card.pose, opacity: 1 },
          ],
          { delay: at.deck + card.order * 45, duration: 1500, easing: SOFT_OUT },
        );
        animate(
          el,
          [
            { transform: card.pose, opacity: 1 },
            { opacity: 1, offset: 0.6 },
            { transform: 'translate3d(0px, 0px, -160px) scale(0.32)', opacity: 0 },
          ],
          {
            delay: at.converge + (CARD_COUNT - card.order) * 22,
            duration: 640,
            easing: ACCELERATE,
            fill: 'forwards',
          },
        );
      });

      animate(icon, [{ transform: `translateY(${lift}px)` }, { transform: 'translateY(0px)' }], {
        delay: at.lift,
        duration: 1150,
        easing: SWIFT,
      });
      animate(
        heroRef.current,
        [
          { transform: 'translate(-50%, -50%) scale(0.18)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        ],
        { delay: at.ignite, duration: 900, easing: springEasing(900, 0.5, 15) },
      );
      animate(
        flashRef.current,
        [
          { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.18 },
          { transform: 'translate(-50%, -50%) scale(2.8)', opacity: 0 },
        ],
        { delay: at.ignite - 40, duration: 1300, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
      );
      for (const ring of icon?.querySelectorAll('[data-ring]') ?? []) {
        const i = Number((ring as HTMLElement).dataset.ring);
        animate(
          ring,
          [
            { transform: 'translate(-50%, -50%) scale(0.35)', opacity: 0 },
            { opacity: 0.75, offset: 0.12 },
            { transform: `translate(-50%, -50%) scale(${2.4 + i * 0.7})`, opacity: 0 },
          ],
          { delay: at.ignite + i * 170, duration: 2000 + i * 300, easing: SOFT_OUT },
        );
      }
      const particleEls = icon?.querySelectorAll('[data-particle]') ?? [];
      particles.forEach((p, i) => {
        animate(
          particleEls[i],
          [
            { transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1)', opacity: 0 },
            { opacity: 1, offset: 0.1 },
            {
              transform: `translate(-50%, -50%) translate(${p.dx}px, ${p.dy}px) scale(0.3)`,
              opacity: 0,
            },
          ],
          { delay: at.ignite + p.delay, duration: p.duration, easing: SOFT_OUT },
        );
      });
      animate(tileRef.current, [{ transform: 'scale(0.5)' }, { transform: 'scale(1)' }], {
        delay: at.tile,
        duration: 1000,
        easing: springEasing(1000, 0.62, 12),
      });
      animate(tileRef.current, [{ opacity: 0 }, { opacity: 1 }], {
        delay: at.tile,
        duration: 260,
        easing: 'ease-out',
      });
      animate(
        sheenRef.current,
        [
          { transform: 'translateX(-130%) skewX(-18deg)' },
          { transform: 'translateX(230%) skewX(-18deg)' },
        ],
        { delay: at.sheen, duration: 1100, easing: IN_OUT },
      );

      const letters = wordRef.current?.children ?? [];
      Array.from(letters).forEach((letter, i) => {
        animate(
          letter,
          [
            { opacity: 0, transform: 'translateY(0.38em) scale(0.96)', filter: 'blur(14px)' },
            { opacity: 1, transform: 'none', filter: 'blur(0px)' },
          ],
          { delay: at.word + i * 46, duration: 1100 },
        );
      });
      const words = taglineRef.current?.children ?? [];
      Array.from(words).forEach((word, i) => {
        animate(
          word,
          [
            { opacity: 0, transform: 'translateY(10px)', filter: 'blur(6px)' },
            { opacity: 1, transform: 'none', filter: 'blur(0px)' },
          ],
          { delay: at.tagline + i * 65, duration: 950 },
        );
      });
      animate(hintRef.current, [{ opacity: 0 }, { opacity: 1 }], {
        delay: 1600,
        duration: 900,
        easing: 'ease-out',
      });

      // Keep a held frame from reading as stalled: everything breathes a touch.
      animate(content, [{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }], {
        delay: at.word,
        duration: at.exit - at.word,
        easing: 'ease-in-out',
      });

      later(at.exit, () => exit(false));
    };

    const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]);
    void Promise.all([desktop.intro.target().catch(() => null), fonts]).then(([t]) => {
      if (cancelled) return;
      target = t as IntroTarget | null;
      run();
    });

    const skip = (e: Event) => {
      e.preventDefault();
      exit(true);
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
      for (const animation of scene.getAnimations({ subtree: true })) animation.cancel();
    };
  }, [cards, particles]);

  return (
    <div
      ref={sceneRef}
      className="fixed inset-0 overflow-hidden text-white opacity-0"
      style={{ backgroundColor: VEIL }}
    >
      <div ref={contentRef} className="absolute inset-0">
        <div
          ref={glowRef}
          aria-hidden
          className="absolute top-1/2 left-1/2 aspect-square w-[130vmax] rounded-full opacity-0"
          style={{
            background:
              'radial-gradient(closest-side, rgb(255 160 110 / 0.34), rgb(254 82 38 / 0.26) 22%, rgb(238 67 22 / 0.1) 48%, transparent 72%)',
          }}
        />

        <div className="absolute inset-0" style={{ perspective: '1500px' }}>
          <div ref={deckRef} className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
            {cards.map((card, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: the deck is a fixed layout
                key={i}
                className="absolute top-1/2 left-1/2 opacity-0"
                style={{
                  width: card.width,
                  marginLeft: -card.width / 2,
                  marginTop: (-card.width * 9) / 32,
                  willChange: 'transform, opacity',
                }}
              >
                <SlideSketch
                  variant={card.variant}
                  tone="glass"
                  className="rounded-[10px]"
                  style={{
                    boxShadow:
                      'inset 0 0 0 1px rgb(255 255 255 / 0.14), 0 30px 60px -24px rgb(0 0 0 / 0.7)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            ref={iconRef}
            className="relative"
            style={{ width: 'clamp(92px, 15vmin, 164px)', aspectRatio: '1' }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                data-ring={i}
                aria-hidden
                className="absolute top-1/2 left-1/2 aspect-square w-[120%] rounded-full opacity-0"
                style={{ boxShadow: 'inset 0 0 0 1px rgb(255 170 130 / 0.45)' }}
              />
            ))}
            <span
              ref={flashRef}
              aria-hidden
              className="absolute top-1/2 left-1/2 aspect-square w-[260%] rounded-full opacity-0"
              style={{
                background:
                  'radial-gradient(closest-side, rgb(255 236 224 / 0.75), rgb(255 138 94 / 0.4) 35%, transparent 70%)',
              }}
            />
            {particles.map((p, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed burst
                key={i}
                data-particle
                aria-hidden
                className="absolute top-1/2 left-1/2 rounded-full opacity-0"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.warm ? '#ff9a70' : '#fff4ec',
                  boxShadow: p.warm
                    ? '0 0 10px rgb(254 82 38 / 0.9)'
                    : '0 0 8px rgb(255 255 255 / 0.7)',
                }}
              />
            ))}
            <div
              ref={tileRef}
              className="absolute inset-0 overflow-hidden rounded-[23.3%] opacity-0"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #efebe6 100%)',
                boxShadow:
                  'inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 -2px 0 rgb(0 0 0 / 0.06), 0 40px 90px -24px rgb(254 82 38 / 0.55), 0 18px 40px -12px rgb(0 0 0 / 0.6)',
              }}
            >
              <span
                ref={sheenRef}
                aria-hidden
                className="absolute inset-y-[-20%] left-0 w-[45%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgb(255 255 255 / 0.85) 50%, transparent)',
                  mixBlendMode: 'soft-light',
                }}
              />
            </div>
            <div
              ref={heroRef}
              className="absolute top-1/2 left-1/2 h-[35%] w-[60%] rounded-[11.8%/20.2%] opacity-0"
              style={{
                background:
                  'radial-gradient(120% 90% at 30% 10%, rgb(255 255 255 / 0.28), transparent 60%), linear-gradient(180deg, #ff8a5e 0%, #fe5226 45%, #ee4316 100%)',
                boxShadow:
                  'inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 -1.5px 0 rgb(184 48 12 / 0.45), 0 10px 24px -6px rgb(254 82 38 / 0.7)',
              }}
            />
          </div>

          <h1
            ref={wordRef}
            aria-label={WORDMARK}
            className="mt-[4.2vmin] flex font-heading font-semibold"
            style={{
              fontSize: 'clamp(40px, 7.4vmin, 92px)',
              letterSpacing: '-0.045em',
              lineHeight: 1,
            }}
          >
            {WORDMARK.split('').map((char, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: letters of a fixed word
                key={i}
                aria-hidden
                className="inline-block opacity-0"
                style={{ color: char === '-' ? '#ff8a5e' : undefined }}
              >
                {char}
              </span>
            ))}
          </h1>
          <p
            ref={taglineRef}
            className="mt-[2.2vmin] font-serif text-white/60 italic"
            style={{ fontSize: 'clamp(16px, 2.3vmin, 26px)', letterSpacing: '-0.005em' }}
          >
            {TAGLINE.split(' ').map((word, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: words of a fixed line
                key={i}
                className="inline-block whitespace-pre opacity-0"
              >
                {i ? ` ${word}` : word}
              </span>
            ))}
          </p>
        </div>

        <div
          ref={hintRef}
          className="absolute inset-x-0 bottom-[5vh] text-center text-[11px] font-medium tracking-[0.18em] text-white/35 uppercase opacity-0"
        >
          Press any key to skip
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 50%, rgb(0 0 0 / 0.4) 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{ backgroundImage: GRAIN }}
        />
      </div>

      <div
        ref={frameRef}
        aria-hidden
        className="pointer-events-none absolute opacity-0"
        style={{ boxShadow: 'inset 0 0 0 1px color-mix(in oklab, currentColor 10%, transparent)' }}
      >
        <span
          className="absolute inset-x-0 top-10 h-px"
          style={{ background: 'color-mix(in oklab, currentColor 7%, transparent)' }}
        />
      </div>
    </div>
  );
}

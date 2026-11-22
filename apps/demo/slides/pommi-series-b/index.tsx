import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useEffect, useId, useState } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#FFF3DF', text: '#151313', accent: '#FF5A2C' },
  fonts: {
    display: '"Gabarito", system-ui, sans-serif',
    body: '"Gabarito", system-ui, sans-serif',
  },
  typeScale: { hero: 300, body: 30 },
  radius: 28,
};

const CREAM = 'var(--osd-bg)';
const INK = 'var(--osd-text)';
const TOMATO = 'var(--osd-accent)';
const BUTTER = '#FFD23F';
const MINT = '#7EDDB0';
const PERI = '#98A6FF';
const PINK = '#FFB0D0';
const PAPER = '#FFFCF6';
const MUTED = 'rgba(21, 19, 19, 0.6)';
const FAINT = 'rgba(21, 19, 19, 0.16)';

const SLIDE_ID = 'pommi-series-b';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=Gabarito:wght@500;700;800;900&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;

const springAt = (t: number, zeta: number, omega: number) => {
  if (t >= 1) return 1;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const decay = Math.exp(-zeta * omega * t);
  return 1 - decay * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
};

// Gravity drop with two shrinking bounces; never passes the floor, unlike a spring.
const dropAt = (t: number) => {
  const e = 0.3;
  const segs = [1, 2 * e, 2 * e * e];
  const total = segs[0] + segs[1] + segs[2];
  let u = t * total;
  if (u <= 1) return u * u;
  u -= 1;
  for (let k = 1; k < segs.length; k++) {
    if (u <= segs[k]) {
      const x = u / segs[k];
      return 1 - e ** (2 * k) * 4 * x * (1 - x);
    }
    u -= segs[k];
  }
  return 1;
};
const DROP_LAND = 1 / (1 + 0.6 + 0.18);

const toLinear = (f: (t: number) => number, n: number) =>
  `linear(${Array.from({ length: n + 1 }, (_, i) => Number(f(i / n).toFixed(4))).join(', ')})`;

const BOUNCY = toLinear((t) => springAt(t, 0.38, 15), 64);
const SNAPPY = toLinear((t) => springAt(t, 0.62, 10.5), 48);
const DEAL = toLinear((t) => springAt(t, 0.5, 13), 56);
const DROP = toLinear(dropAt, 72);
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const SLAP = 'cubic-bezier(0.2, 0.8, 0.3, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 850;

const STOPS: [number, number][] = [
  [220, 720],
  [600, 580],
  [980, 720],
  [1360, 580],
  [1700, 720],
];
const HOP_START = 1100;
const HOP_MOVE = 620;
const HOP_GAP = 1150;
const HOP_TOTAL = HOP_GAP * 3 + HOP_MOVE + 260;
const hopLand = (i: number) => HOP_START + (i - 1) * HOP_GAP + HOP_MOVE;

const hopKeyframes = () => {
  const pct = (ms: number) => `${((ms / HOP_TOTAL) * 100).toFixed(3)}%`;
  let move = '';
  let jump = '';
  for (let i = 0; i < 4; i++) {
    const t0 = i * HOP_GAP;
    const t1 = t0 + HOP_MOVE;
    const ax = STOPS[i][0] - STOPS[0][0];
    const ay = STOPS[i][1] - STOPS[0][1];
    const bx = STOPS[i + 1][0] - STOPS[0][0];
    const by = STOPS[i + 1][1] - STOPS[0][1];
    move += `${pct(t0)} { transform: translate(${ax}px, ${ay}px); animation-timing-function: cubic-bezier(0.45, 0, 0.4, 1) } ${pct(t1)} { transform: translate(${bx}px, ${by}px) } `;
    jump += `${pct(t0)} { transform: translateY(0) scale(1, 1); animation-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1) } ${pct(t0 + HOP_MOVE / 2)} { transform: translateY(-84px) scale(0.96, 1.05); animation-timing-function: cubic-bezier(0.6, 0, 0.85, 0.4) } ${pct(t1)} { transform: translateY(0) scale(1.2, 0.78); animation-timing-function: ease-out } ${pct(t1 + 240)} { transform: translateY(0) scale(1, 1) } `;
  }
  return `@keyframes pm-hop-move { ${move}} @keyframes pm-hop-jump { ${jump}}`;
};

const CSS = `
@keyframes pm-rise { from { opacity: 0; transform: translateY(var(--pm-rise, 32px)) } to { opacity: 1; transform: translateY(0) } }
@keyframes pm-in-l { from { opacity: 0; transform: translateX(-90px) } to { opacity: 1; transform: translateX(0) } }
@keyframes pm-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes pm-drop { from { transform: translateY(var(--pm-from, -320px)) } to { transform: translateY(0) } }
@keyframes pm-pop { from { opacity: 0; transform: scale(0) } to { opacity: 1; transform: scale(1) } }
@keyframes pm-pop-b { from { opacity: 0; transform: translateY(20px) scale(0.55) } to { opacity: 1; transform: translateY(0) scale(1) } }
@keyframes pm-grow-y { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes pm-grow-x { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes pm-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes pm-squash { 0% { transform: scale(1, 1) } 26% { transform: scale(1.14, 0.82) } 56% { transform: scale(0.96, 1.05) } 100% { transform: scale(1, 1) } }
@keyframes pm-slap {
  0% { opacity: 0; transform: rotate(calc(var(--r) - 24deg)) scale(1.9) }
  42% { opacity: 1; transform: rotate(calc(var(--r) + 4deg)) scale(0.88, 0.84) }
  70% { opacity: 1; transform: rotate(calc(var(--r) - 1.5deg)) scale(1.04) }
  100% { opacity: 1; transform: rotate(var(--r)) scale(1) }
}
@keyframes pm-wobble { 0%, 100% { transform: rotate(0deg) } 50% { transform: rotate(2.6deg) } }
@keyframes pm-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
@keyframes pm-twinkle { 0%, 100% { transform: scale(1) rotate(0deg) } 50% { transform: scale(0.7) rotate(25deg) } }
@keyframes pm-thunk { 0% { transform: scale(1) } 24% { transform: scale(1.07) rotate(-1.4deg) } 58% { transform: scale(0.985) rotate(0.4deg) } 100% { transform: scale(1) } }
@keyframes pm-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.35 } 30% { transform: translateY(-6px); opacity: 1 } }
@keyframes pm-blip { 0% { opacity: 0; transform: scale(0.5) } 22% { opacity: 1; transform: scale(1) } 84% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(0.7) } }
@keyframes pm-toast {
  0% { opacity: 0; transform: translateY(-150px); animation-timing-function: ${BOUNCY} }
  8% { opacity: 1; transform: translateY(0) }
  27% { opacity: 1; transform: translateY(0); animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.4) }
  31%, 100% { opacity: 0; transform: translateY(-150px) }
}
@keyframes pm-toast-once {
  0% { opacity: 0; transform: translateY(-150px); animation-timing-function: ${BOUNCY} }
  22% { opacity: 1; transform: translateY(0) }
  82% { opacity: 1; transform: translateY(0); animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.4) }
  100% { opacity: 0; transform: translateY(-150px) }
}
@keyframes pm-tip { from { transform: rotate(0deg) } to { transform: rotate(var(--pm-tip)) } }
@keyframes pm-nudge { 0% { transform: rotate(0deg) } 28% { transform: rotate(1.8deg) } 62% { transform: rotate(-0.5deg) } 100% { transform: rotate(0deg) } }
@keyframes pm-stamp {
  0%, 30% { opacity: 0; transform: rotate(-20deg) scale(1.9) }
  38% { opacity: 1; transform: rotate(-6deg) scale(0.9) }
  44%, 88% { opacity: 1; transform: rotate(-9deg) scale(1) }
  96%, 100% { opacity: 0; transform: rotate(-9deg) scale(1) }
}
@keyframes pm-fill { 0%, 16% { transform: scaleX(0) } 30%, 90% { transform: scaleX(1) } 100% { transform: scaleX(0) } }
@keyframes pm-tick {
  0%, 10% { opacity: 0; transform: scale(0.3) }
  15% { opacity: 1; transform: scale(1.25) }
  20%, 82% { opacity: 1; transform: scale(1) }
  88%, 100% { opacity: 0; transform: scale(1) }
}
@keyframes pm-strike { 0%, 12% { transform: scaleX(0) } 20%, 82% { transform: scaleX(1) } 88%, 100% { transform: scaleX(0) } }
@keyframes pm-spin3 { 0%, 24% { transform: rotate(0deg) } 33%, 57% { transform: rotate(120deg) } 66%, 90% { transform: rotate(240deg) } 100% { transform: rotate(360deg) } }
@keyframes pm-spin3-rev { 0%, 24% { transform: rotate(0deg) } 33%, 57% { transform: rotate(-120deg) } 66%, 90% { transform: rotate(-240deg) } 100% { transform: rotate(-360deg) } }
@keyframes pm-glow-row { 0%, 3% { background: transparent } 8%, 30% { background: rgba(255, 210, 63, 0.6) } 35%, 100% { background: transparent } }
${hopKeyframes()}

.pm-deal { transform: translate(0, 0) rotate(var(--r)); transition: transform 980ms ${DEAL}; }
[data-osd-step="pending"] .pm-deal { transform: translate(var(--dx), 820px) rotate(calc(var(--r) - 22deg)); }
.pm-seg { clip-path: inset(-24px -24px -24px -24px); transition: clip-path 900ms ${SNAPPY}; }
[data-osd-step="pending"] .pm-seg { clip-path: inset(-24px 100% -24px -24px); }
.pm-col { opacity: 1; transform: translateY(0); transition: transform 900ms ${BOUNCY} 140ms, opacity 260ms ease-out 140ms; }
[data-osd-step="pending"] .pm-col { opacity: 0; transform: translateY(70px); }
.pm-block { transform: translateY(0) rotate(var(--r)); transition: transform 1150ms ${DROP}; }
[data-osd-step="pending"] .pm-block { transform: translateY(-1100px) rotate(var(--r0)); }
.pm-tag-in { opacity: 1; transform: translateX(0); transition: transform 760ms ${BOUNCY} 520ms, opacity 200ms ease-out 520ms; }
[data-osd-step="pending"] .pm-tag-in { opacity: 0; transform: translateX(-60px); }

/* Returning from page 2 the phone arrives by morph; a rise here would shift the measured morph target. */
[data-osd-dir="backward"] .pm-cover-phone { animation: none !important; }

@media (prefers-reduced-motion: reduce) {
  .pm-root *, .pm-root *::before, .pm-root *::after { animation: none !important; transition: none !important; }
}
`;

if (typeof document !== 'undefined') {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== FONT_HREF) link.href = FONT_HREF;

  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== CSS) style.textContent = CSS;
}

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const morphTransition: SlideTransition = {
  duration: 320,
  exit: { duration: 320, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 320, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: SNAPPY },
};

const BORDER = `4px solid ${INK}`;
const shadow = (n = 8) => `${n}px ${n}px 0 ${INK}`;

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 900,
  letterSpacing: '-0.035em',
  lineHeight: 1,
  margin: 0,
};

const MONO: CSSProperties = {
  fontFamily: '"DM Mono", ui-monospace, monospace',
  fontWeight: 500,
  fontSize: 17,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const BODY: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontWeight: 500,
  fontSize: 'var(--osd-size-body)',
  lineHeight: 1.32,
  margin: 0,
  textWrap: 'pretty',
};

const NUM: CSSProperties = { ...DISPLAY, fontVariantNumeric: 'tabular-nums' };

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const pad = (n: number) => String(n).padStart(2, '0');

// Gabarito's heavy € has almost no right bearing; under negative tracking it collides with the digit.
const Money = ({ v }: { v: string }) =>
  v.startsWith('€') ? (
    <>
      <span style={{ marginRight: '0.06em' }}>€</span>
      {v.slice(1)}
    </>
  ) : (
    <>{v}</>
  );

const anim = (live: boolean, value: string): CSSProperties => (live ? { animation: value } : {});

const rise = (live: boolean, delay = 0, dist = 32): CSSProperties =>
  live
    ? ({
        animation: `pm-rise 820ms ${SNAPPY} ${delay}ms both`,
        '--pm-rise': `${dist}px`,
      } as CSSProperties)
    : {};

const useLive = () => {
  const active = useIsActivePage();
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return active && !reduced;
};

const useCount = (target: number, live: boolean, delay: number, dur = 1700) => {
  const [value, setValue] = useState(live ? 0 : target);
  useEffect(() => {
    if (!live) {
      setValue(target);
      return;
    }
    setValue(0);
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / dur));
      setValue(target * (1 - (1 - p) ** 4));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, target, delay, dur]);
  return value;
};

const useBeats = (live: boolean, times: readonly number[]) => {
  const [beat, setBeat] = useState(live ? 0 : times.length);
  useEffect(() => {
    if (!live) {
      setBeat(times.length);
      return;
    }
    setBeat(0);
    const ids = times.map((t, i) => window.setTimeout(() => setBeat(i + 1), t));
    return () => {
      for (const id of ids) window.clearTimeout(id);
    };
  }, [live, times]);
  return beat;
};

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, '');

const Mark = ({ size = 56 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    aria-hidden="true"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M36.5 13.5 C 38.5 6, 46.5 2.5, 55 4.5 C 53 12, 45 16, 36.5 13.5 Z"
      style={{ fill: MINT, stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' }}
    />
    <path
      d="M32 19 C 32 13, 33 9, 36 6"
      style={{ fill: 'none', stroke: INK, strokeWidth: 4, strokeLinecap: 'round' }}
    />
    <path
      d="M32 19 C 23 13, 6 15, 6 34 C 6 50, 17 60, 25 60 C 28 60, 30 58.5, 32 58.5 C 34 58.5, 36 60, 39 60 C 47 60, 58 50, 58 34 C 58 15, 41 13, 32 19 Z"
      style={{ fill: TOMATO, stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' }}
    />
    <path
      d="M26.5 58.6 V 47 A 5.5 5.5 0 0 1 37.5 47 V 58.6"
      style={{ fill: CREAM, stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' }}
    />
    <path
      d="M15 30 C 15.5 25.5, 18.5 22.5, 22.5 21.5"
      style={{ fill: 'none', stroke: PAPER, strokeWidth: 3.5, strokeLinecap: 'round' }}
    />
  </svg>
);

const Letter = ({
  ch,
  i,
  live,
  delay,
  children,
}: {
  ch: string;
  i: number;
  live: boolean;
  delay: number;
  children?: ReactNode;
}) => {
  const d = delay + i * 85;
  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        ...(live
          ? ({
              animation: `pm-drop 940ms ${DROP} ${d}ms both`,
              '--pm-from': '-1.6em',
            } as CSSProperties)
          : {}),
      }}
    >
      <span
        style={{
          display: 'inline-block',
          transformOrigin: '50% 88%',
          ...anim(live, `pm-squash 560ms ease-out ${d + Math.round(940 * DROP_LAND)}ms both`),
        }}
      >
        {ch}
      </span>
      {children}
    </span>
  );
};

const Wordmark = ({ size, live, delay = 0 }: { size: number; live: boolean; delay?: number }) => (
  <div
    style={{
      ...DISPLAY,
      fontSize: size,
      letterSpacing: '-0.055em',
      lineHeight: 1,
      display: 'flex',
      whiteSpace: 'nowrap',
    }}
  >
    <Letter ch="p" i={0} live={live} delay={delay} />
    <Letter ch="o" i={1} live={live} delay={delay} />
    <Letter ch="m" i={2} live={live} delay={delay} />
    <Letter ch="m" i={3} live={live} delay={delay} />
    <Letter ch="ı" i={4} live={live} delay={delay}>
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '0.02em',
          width: '0.3em',
          height: '0.3em',
          marginLeft: '-0.13em',
        }}
      >
        <span
          style={{
            display: 'block',
            transformOrigin: '50% 90%',
            ...anim(live, `pm-pop 760ms ${BOUNCY} ${delay + 4 * 85 + 620}ms both`),
          }}
        >
          <Mark size={size * 0.3} />
        </span>
      </span>
    </Letter>
  </div>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={abs(120, 996, {
        width: 1680,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        zIndex: 8,
      })}
    >
      <Mark size={34} />
      <span style={{ ...DISPLAY, fontSize: 30, letterSpacing: '-0.04em' }}>pommi</span>
      <span style={{ ...MONO, color: MUTED, marginLeft: 18 }}>Series B · October 2026</span>
      <span style={{ ...MONO, color: MUTED, marginLeft: 'auto', marginRight: 10 }}>
        Confidential
      </span>
      <span
        style={{
          ...MONO,
          height: 38,
          padding: '0 16px',
          borderRadius: 999,
          background: INK,
          color: CREAM,
          display: 'inline-flex',
          alignItems: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pad(current)} / {pad(total)}
      </span>
    </div>
  );
};

const Stage = ({ footer = true, children }: { footer?: boolean; children: ReactNode }) => (
  <div
    className="pm-root"
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: CREAM,
      color: INK,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    {footer && <Footer />}
  </div>
);

const Tag = ({
  n,
  children,
  live,
  x = 120,
  y = 96,
  color = BUTTER,
}: {
  n: string;
  children: ReactNode;
  live: boolean;
  x?: number;
  y?: number;
  color?: string;
}) => (
  <div
    style={abs(x, y, {
      display: 'flex',
      alignItems: 'stretch',
      height: 46,
      border: `3px solid ${INK}`,
      borderRadius: 999,
      background: color,
      boxShadow: shadow(4),
      overflow: 'hidden',
      ...rise(live, 0, 20),
    })}
  >
    <span
      style={{
        ...MONO,
        fontSize: 18,
        padding: '0 14px 0 16px',
        display: 'flex',
        alignItems: 'center',
        background: INK,
        color: CREAM,
      }}
    >
      {n}
    </span>
    <span
      style={{
        ...MONO,
        fontSize: 18,
        padding: '0 20px 0 16px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </span>
  </div>
);

const Title = ({
  children,
  live,
  x = 120,
  y = 168,
  size = 88,
  width = 1680,
  delay = 70,
}: {
  children: ReactNode;
  live: boolean;
  x?: number;
  y?: number;
  size?: number;
  width?: number;
  delay?: number;
}) => (
  <h2 style={{ ...DISPLAY, ...abs(x, y), width, fontSize: size, ...rise(live, delay, 40) }}>
    {children}
  </h2>
);

const Footnote = ({
  x = 120,
  y,
  width = 1680,
  children,
}: {
  x?: number;
  y: number;
  width?: number;
  children: ReactNode;
}) => (
  <p style={{ ...BODY, ...abs(x, y), width, fontSize: 18, lineHeight: 1.4, color: MUTED }}>
    {children}
  </p>
);

const Sticker = ({
  x,
  y,
  r,
  live,
  delay,
  bg,
  children,
  round,
  pad: padding = '14px 26px',
  z = 6,
}: {
  x: number;
  y: number;
  r: number;
  live: boolean;
  delay: number;
  bg: string;
  children: ReactNode;
  round?: number;
  pad?: string;
  z?: number;
}) => (
  <div
    style={
      {
        ...abs(x, y),
        '--r': `${r}deg`,
        transform: `rotate(${r}deg)`,
        zIndex: z,
        ...anim(live, `pm-slap 760ms ${SLAP} ${delay}ms both`),
      } as CSSProperties
    }
  >
    <div
      style={{
        ...anim(live, `pm-wobble 5.2s ease-in-out ${delay + 900}ms infinite`),
        background: bg,
        border: BORDER,
        boxShadow: shadow(6),
        borderRadius: round ? '50%' : 22,
        width: round,
        height: round,
        padding: round ? 0 : padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  </div>
);

const Sparkle = ({
  x,
  y,
  size,
  color = BUTTER,
  live,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color?: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      ...abs(x, y),
      width: size,
      height: size,
      ...anim(live, `pm-pop 700ms ${BOUNCY} ${delay}ms both`),
    }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      style={{
        display: 'block',
        overflow: 'visible',
        ...anim(live, `pm-twinkle 2.8s ease-in-out ${delay + 700}ms infinite`),
      }}
    >
      <path
        d="M20 2 C 22 14, 26 18, 38 20 C 26 22, 22 26, 20 38 C 18 26, 14 22, 2 20 C 14 18, 18 14, 20 2 Z"
        style={{ fill: color, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' }}
      />
    </svg>
  </div>
);

const Avatar = ({
  initial,
  color,
  size = 40,
  border = 3,
  style,
}: {
  initial: string;
  color: string;
  size?: number;
  border?: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      width: size,
      height: size,
      flex: 'none',
      borderRadius: '50%',
      background: color,
      border: `${border}px solid ${INK}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--osd-font-display)',
      fontWeight: 800,
      fontSize: Math.round(size * 0.42),
      lineHeight: 1,
      color: INK,
      ...style,
    }}
  >
    {initial}
  </div>
);

const PHONE_W = 424;
const PHONE_H = 860;
const SCREEN_W = PHONE_W - 8;
const SCREEN_H = PHONE_H - 8;

const PhoneShell = ({ x, y, children }: { x: number; y: number; children?: ReactNode }) => (
  <MorphElement id="pm-phone">
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 64,
        border: BORDER,
        background: PAPER,
        boxShadow: shadow(12),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: (SCREEN_W - 116) / 2,
          top: 14,
          width: 116,
          height: 32,
          borderRadius: 999,
          background: INK,
        }}
      />
      {children}
    </div>
  </MorphElement>
);

const ScreenLayer = ({
  x,
  y,
  live,
  delay = 0,
  children,
}: {
  x: number;
  y: number;
  live: boolean;
  delay?: number;
  children: ReactNode;
}) => (
  <div
    style={abs(x + 4, y + 4, {
      width: SCREEN_W,
      height: SCREEN_H,
      borderRadius: 60,
      overflow: 'hidden',
      ...anim(live, `pm-fade 360ms ease-out ${delay}ms both`),
    })}
  >
    {children}
  </div>
);

const StatusBar = () => (
  <div
    style={abs(0, 16, {
      width: SCREEN_W,
      height: 30,
      padding: '0 38px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'var(--osd-font-body)',
      fontWeight: 800,
      fontSize: 18,
    })}
  >
    <span>9:41</span>
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
      <span style={{ width: 4, height: 7, background: INK, borderRadius: 1 }} />
      <span style={{ width: 4, height: 10, background: INK, borderRadius: 1 }} />
      <span style={{ width: 4, height: 13, background: INK, borderRadius: 1 }} />
      <span
        style={{
          width: 26,
          height: 13,
          marginLeft: 6,
          border: `2px solid ${INK}`,
          borderRadius: 4,
          padding: 1.5,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            display: 'block',
            width: '70%',
            height: '100%',
            background: INK,
            borderRadius: 1,
          }}
        />
      </span>
    </span>
  </div>
);

const Toast = ({
  who,
  color,
  children,
  live,
  delay,
  shown = false,
}: {
  who: string;
  color: string;
  children: ReactNode;
  live: boolean;
  delay: number;
  shown?: boolean;
}) => (
  <div
    style={abs(14, 54, {
      width: SCREEN_W - 28,
      height: 74,
      boxSizing: 'border-box',
      padding: '0 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      background: INK,
      color: CREAM,
      borderRadius: 24,
      boxShadow: `0 6px 0 ${TOMATO}`,
      opacity: live || shown ? undefined : 0,
      ...anim(live, `pm-toast 12s linear ${delay}ms infinite`),
      ...(live ? { opacity: 0 } : {}),
      zIndex: 4,
    })}
  >
    <Avatar initial={who} color={color} size={40} border={2.5} />
    <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>{children}</div>
  </div>
);

const HomeRow = ({
  y,
  icon,
  title,
  sub,
  right,
}: {
  y: number;
  icon: string;
  title: string;
  sub: string;
  right: ReactNode;
}) => (
  <div
    style={abs(22, y, {
      width: SCREEN_W - 44,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    })}
  >
    <div
      style={{
        width: 48,
        height: 48,
        flex: 'none',
        borderRadius: 14,
        border: `3px solid ${INK}`,
        background: icon,
      }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: MUTED, lineHeight: 1.3 }}>{sub}</div>
    </div>
    <div style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{right}</div>
  </div>
);

const HomeScreen = ({ live }: { live: boolean }) => (
  <>
    <StatusBar />
    <div style={abs(24, 70, { display: 'flex', alignItems: 'center', width: SCREEN_W - 48 })}>
      <div>
        <div style={{ ...DISPLAY, fontSize: 34 }}>Flat 3B</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: MUTED, marginTop: 4 }}>
          Weserstraße 14 · 4 people
        </div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex' }}>
        <Avatar initial="M" color={MINT} size={40} />
        <Avatar initial="J" color={PERI} size={40} style={{ marginLeft: -12 }} />
        <Avatar initial="S" color={PINK} size={40} style={{ marginLeft: -12 }} />
      </div>
    </div>
    <div
      style={abs(22, 150, {
        width: SCREEN_W - 44,
        height: 128,
        boxSizing: 'border-box',
        padding: '18px 22px',
        background: BUTTER,
        border: `3px solid ${INK}`,
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
      })}
    >
      <div>
        <div style={{ ...MONO, fontSize: 16 }}>You're owed</div>
        <div style={{ ...NUM, fontSize: 54, marginTop: 6 }}>
          <Money v="€42.50" />
        </div>
      </div>
      <div
        style={{
          marginLeft: 'auto',
          height: 44,
          padding: '0 18px',
          borderRadius: 999,
          background: INK,
          color: CREAM,
          display: 'flex',
          alignItems: 'center',
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        Settle up
      </div>
    </div>
    <div style={{ ...MONO, fontSize: 16, ...abs(24, 304), color: MUTED }}>This week</div>
    <HomeRow y={334} icon={MINT} title="Rewe groceries" sub="Split 3 ways" right="€63.20" />
    <HomeRow y={410} icon={PERI} title="Internet, October" sub="Sami paid" right="€39.99" />
    <HomeRow y={486} icon={PINK} title="Bathroom" sub="Jonas · due Sunday" right="Chore" />
    <Toast who="M" color={MINT} live={live} delay={2200}>
      Mira added oat milk
      <br />
      to the shared list
    </Toast>
    <Toast who="J" color={PERI} live={live} delay={6200}>
      Jonas finished
      <br />
      Kitchen, week 41
    </Toast>
    <Toast who="S" color={PINK} live={live} delay={10200}>
      Sami paid you back
      <br />
      €13.00 for internet
    </Toast>
  </>
);

const Cover: Page = () => {
  const live = useLive();
  return (
    <Stage footer={false}>
      <div
        style={abs(120, 92, {
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          ...rise(live, 0, 16),
        })}
      >
        <Mark size={50} />
        <span style={{ ...MONO, fontSize: 18 }}>Investor presentation · October 2026</span>
      </div>

      <div
        style={abs(1160, 96, {
          width: 640,
          height: 1100,
          background: PERI,
          border: BORDER,
          borderRadius: 48,
          ...rise(live, 40, 120),
        })}
      />
      <div
        className="pm-cover-phone"
        style={abs(1268, 520, {
          width: PHONE_W,
          height: PHONE_H,
          ...(live
            ? ({
                animation: `pm-rise 1100ms ${SNAPPY} 360ms both`,
                '--pm-rise': '420px',
              } as CSSProperties)
            : {}),
        })}
      >
        <PhoneShell x={0} y={0} />
        <ScreenLayer x={0} y={0} live={false}>
          <HomeScreen live={live} />
        </ScreenLayer>
      </div>

      <div style={abs(104, 236)}>
        <Wordmark size={300} live={live} delay={220} />
      </div>

      <p
        style={{
          ...DISPLAY,
          ...abs(120, 600),
          width: 960,
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          ...rise(live, 900, 30),
        }}
      >
        The app for everyone
        <br />
        who shares a home.
      </p>
      <div
        style={abs(120, 800, {
          display: 'flex',
          gap: 12,
          ...rise(live, 1040, 24),
        })}
      >
        <CoverChip>412,000 households</CoverChip>
        <CoverChip>9 markets</CoverChip>
        <CoverChip>Est. 2022</CoverChip>
      </div>
      <div style={{ ...MONO, ...abs(120, 984), color: MUTED, ...rise(live, 1160, 12) }}>
        Confidential · Prepared for Series B investors
      </div>

      <Sticker x={1440} y={226} r={7} live={live} delay={1250} bg={BUTTER}>
        <span style={{ ...DISPLAY, fontSize: 52, letterSpacing: '-0.03em' }}>Series B</span>
      </Sticker>
      <Sticker x={1092} y={372} r={-10} live={live} delay={1450} bg={TOMATO} round={232}>
        <span style={{ ...MONO, fontSize: 18 }}>Raising</span>
        <span style={{ ...NUM, fontSize: 74, marginTop: 4 }}>
          <Money v="€38M" />
        </span>
      </Sticker>
      <Sticker x={1560} y={760} r={-6} live={live} delay={1650} bg={MINT} pad="12px 24px">
        <span style={{ ...DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Made in Berlin
        </span>
      </Sticker>
      <Sparkle x={1360} y={170} size={46} live={live} delay={1800} />
      <Sparkle x={1716} y={150} size={30} color={PINK} live={live} delay={1900} />
      <Sparkle x={1210} y={640} size={34} color={PAPER} live={live} delay={2000} />
    </Stage>
  );
};

const CoverChip = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      height: 52,
      padding: '0 22px',
      border: `3px solid ${INK}`,
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 700,
      background: PAPER,
    }}
  >
    {children}
  </span>
);

const PainStat = ({
  y,
  n,
  color,
  live,
  delay,
  children,
}: {
  y: number;
  n: string;
  color: string;
  live: boolean;
  delay: number;
  children: ReactNode;
}) => (
  <div
    style={abs(120, y, {
      width: 1000,
      height: 132,
      display: 'flex',
      border: BORDER,
      borderRadius: 28,
      background: PAPER,
      boxShadow: shadow(8),
      overflow: 'hidden',
      boxSizing: 'border-box',
      ...anim(live, `pm-in-l 900ms ${SNAPPY} ${delay}ms both`),
    })}
  >
    <div
      style={{
        width: 250,
        flex: 'none',
        background: color,
        borderRight: BORDER,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 30,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ ...NUM, fontSize: 76, letterSpacing: '-0.045em' }}>
        <Money v={n} />
      </span>
    </div>
    <p style={{ ...BODY, padding: '0 36px', alignSelf: 'center' }}>{children}</p>
  </div>
);

const CHAT_T0 = MORPH_MS + 300;
const CHAT_GAP = 880;

const Bubble = ({
  who,
  color,
  name,
  i,
  live,
  children,
}: {
  who: string;
  color: string;
  name: string;
  i: number;
  live: boolean;
  children: ReactNode;
}) => {
  const t = CHAT_T0 + i * CHAT_GAP;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, position: 'relative' }}>
      <div style={{ ...anim(live, `pm-pop 520ms ${BOUNCY} ${t - 560}ms both`) }}>
        <Avatar initial={who} color={color} size={34} border={2.5} />
      </div>
      {live && (
        <div
          style={{
            position: 'absolute',
            left: 42,
            bottom: 0,
            opacity: 0,
            transformOrigin: '0% 100%',
            animation: `pm-blip 560ms ease-out ${t - 560}ms`,
          }}
        >
          <TypingBubble />
        </div>
      )}
      <div
        style={{
          maxWidth: 290,
          padding: '8px 14px 9px',
          background: '#FFFFFF',
          border: `3px solid ${INK}`,
          borderRadius: '20px 20px 20px 6px',
          transformOrigin: '0% 100%',
          ...anim(live, `pm-pop-b 640ms ${BOUNCY} ${t}ms both`),
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2, marginBottom: 2 }}>
          {name}
        </div>
        <div style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.3 }}>{children}</div>
      </div>
    </div>
  );
};

const MyBubble = ({ i, live, children }: { i: number; live: boolean; children: ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    <div
      style={{
        maxWidth: 280,
        padding: '8px 16px 9px',
        background: TOMATO,
        border: `3px solid ${INK}`,
        borderRadius: '20px 20px 6px 20px',
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1.3,
        transformOrigin: '100% 100%',
        ...anim(live, `pm-pop-b 640ms ${BOUNCY} ${CHAT_T0 + i * CHAT_GAP}ms both`),
      }}
    >
      {children}
    </div>
  </div>
);

const TypingDot = ({ live, delay }: { live: boolean; delay: number }) => (
  <span
    style={{
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: INK,
      opacity: live ? undefined : 0.5,
      ...anim(live, `pm-dot 1.1s ease-in-out ${delay}ms infinite`),
    }}
  />
);

const TypingBubble = ({ live = true }: { live?: boolean }) => (
  <div
    style={{
      height: 40,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: '#FFFFFF',
      border: `3px solid ${INK}`,
      borderRadius: '20px 20px 20px 6px',
      boxSizing: 'border-box',
    }}
  >
    <TypingDot live={live} delay={0} />
    <TypingDot live={live} delay={160} />
    <TypingDot live={live} delay={320} />
  </div>
);

const ChatScreen = ({ live }: { live: boolean }) => {
  const typingAt = CHAT_T0 + 6 * CHAT_GAP - 200;
  return (
    <>
      <StatusBar />
      <div
        style={abs(0, 58, {
          width: SCREEN_W,
          height: 84,
          boxSizing: 'border-box',
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `3px solid ${INK}`,
        })}
      >
        <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, marginTop: -6 }}>‹</span>
        <div style={{ display: 'flex' }}>
          <Avatar initial="M" color={MINT} size={34} border={2.5} />
          <Avatar initial="J" color={PERI} size={34} border={2.5} style={{ marginLeft: -12 }} />
          <Avatar initial="S" color={PINK} size={34} border={2.5} style={{ marginLeft: -12 }} />
        </div>
        <div style={{ marginLeft: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>Flat 3B</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: MUTED }}>Mira, Jonas, Sami, you</div>
        </div>
      </div>
      <div
        style={abs(0, 154, {
          width: SCREEN_W,
          boxSizing: 'border-box',
          padding: '0 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
        })}
      >
        <Bubble who="J" color={PERI} name="Jonas" i={0} live={live}>
          Who bought six oat milks? We now own nine.
        </Bubble>
        <Bubble who="M" color={MINT} name="Mira" i={1} live={live}>
          Me. They were on offer.
        </Bubble>
        <Bubble who="S" color={PINK} name="Sami" i={2} live={live}>
          Also, who owes who for internet? I paid September and October.
        </Bubble>
        <Bubble who="M" color={MINT} name="Mira" i={3} live={live}>
          I sent you €13 in August?
        </Bubble>
        <Bubble who="S" color={PINK} name="Sami" i={4} live={live}>
          That was for the plunger.
        </Bubble>
        <MyBubble i={5} live={live}>
          Fine. Spreadsheet tonight. Again.
        </MyBubble>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            transformOrigin: '0% 100%',
            ...anim(live, `pm-pop-b 600ms ${BOUNCY} ${typingAt}ms both`),
          }}
        >
          <Avatar initial="J" color={PERI} size={34} border={2.5} />
          <TypingBubble live={live} />
        </div>
      </div>
      <div
        style={abs(18, 778, {
          width: SCREEN_W - 36,
          height: 54,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        })}
      >
        <div
          style={{
            flex: 1,
            height: 50,
            borderRadius: 999,
            border: `3px solid ${INK}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            fontSize: 18,
            color: MUTED,
            boxSizing: 'border-box',
          }}
        >
          Message
        </div>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: TOMATO,
            border: `3px solid ${INK}`,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M10 16 V 4 M 4.5 9.5 L 10 4 L 15.5 9.5"
              style={{
                fill: 'none',
                stroke: INK,
                strokeWidth: 3,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              }}
            />
          </svg>
        </div>
      </div>
    </>
  );
};

const Problem: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Tag n="01" live={live}>
        The problem
      </Tag>
      <Title live={live} size={96} width={1100}>
        Living together is
        <br />a group project.
      </Title>
      <PainStat y={420} n="3.4" color={TOMATO} live={live} delay={260}>
        apps the average shared home uses for money, shopping lists and chores
      </PainStat>
      <PainStat y={576} n="61%" color={BUTTER} live={live} delay={380}>
        of flatmates argued about money with each other in the last twelve months
      </PainStat>
      <PainStat y={732} n="€318" color={PERI} live={live} delay={500}>
        owed between flatmates at any given moment, on average
      </PainStat>
      <Footnote y={898} width={1000}>
        Source: Pommi Shared Living Survey, n = 4,212 adults in shared homes, DE · FR · NL · ES,
        June 2026.
      </Footnote>
      <PhoneShell x={1268} y={100}>
        <ChatScreen live={live} />
      </PhoneShell>
    </Stage>
  );
};

const PRODUCT_BEATS = [MORPH_MS + 1000, MORPH_MS + 1800, MORPH_MS + 2800] as const;

const Toggle = ({ on }: { on: boolean }) => (
  <div
    style={{
      width: 62,
      height: 36,
      flex: 'none',
      borderRadius: 999,
      border: `3px solid ${INK}`,
      background: on ? MINT : '#EFE6D6',
      position: 'relative',
      boxSizing: 'border-box',
      transition: 'background-color 200ms ease-out',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 3,
        left: 3,
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: on ? INK : PAPER,
        border: `2.5px solid ${INK}`,
        boxSizing: 'border-box',
        transform: on ? 'translateX(26px)' : 'translateX(0)',
        transition: `transform 620ms ${BOUNCY}, background-color 200ms ease-out`,
      }}
    />
  </div>
);

const SplitRow = ({
  y,
  who,
  color,
  name,
  on,
  amount,
  live,
}: {
  y: number;
  who: string;
  color: string;
  name: string;
  on: boolean;
  amount: string;
  live: boolean;
}) => (
  <div
    style={abs(22, y, {
      width: SCREEN_W - 44,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    })}
  >
    <Avatar initial={who} color={color} size={42} />
    <div style={{ flex: 1, fontSize: 21, fontWeight: 700 }}>{name}</div>
    <span
      key={amount}
      style={{
        display: 'inline-block',
        fontSize: 21,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        color: on ? INK : MUTED,
        ...anim(live, `pm-pop-b 520ms ${BOUNCY} both`),
      }}
    >
      {amount}
    </span>
    <Toggle on={on} />
  </div>
);

const splitAmounts = (n: number) => {
  const cents = 6320;
  const base = Math.floor(cents / n);
  const extra = cents - base * n;
  const fmt = (c: number) => `€${(c / 100).toFixed(2)}`;
  return Array.from({ length: n }, (_, i) => fmt(base + (i > 0 && i <= extra ? 1 : 0)));
};

const ExpenseScreen = ({ beat, live }: { beat: number; live: boolean }) => {
  const n = 1 + (beat >= 1 ? 1 : 0) + (beat >= 2 ? 1 : 0);
  const shares = splitAmounts(n);
  const sent = beat >= 3;
  return (
    <>
      <StatusBar />
      <div
        style={abs(22, 70, {
          width: SCREEN_W - 44,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        })}
      >
        <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, marginTop: -6 }}>‹</span>
        <span style={{ fontSize: 26, fontWeight: 800 }}>New expense</span>
        <span
          style={{
            ...MONO,
            fontSize: 16,
            marginLeft: 'auto',
            height: 34,
            padding: '0 12px',
            borderRadius: 999,
            border: `2.5px solid ${INK}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Flat 3B
        </span>
      </div>
      <div
        style={abs(22, 140, {
          width: SCREEN_W - 44,
          height: 96,
          boxSizing: 'border-box',
          padding: '0 18px',
          background: BUTTER,
          border: `3px solid ${INK}`,
          borderRadius: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        })}
      >
        <div
          style={{
            width: 46,
            height: 62,
            flex: 'none',
            background: PAPER,
            border: `2.5px solid ${INK}`,
            borderRadius: 6,
            boxSizing: 'border-box',
            padding: '8px 7px',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <span style={{ height: 3, background: INK, borderRadius: 2 }} />
          <span style={{ height: 3, width: '70%', background: INK, borderRadius: 2 }} />
          <span style={{ height: 3, background: INK, borderRadius: 2 }} />
          <span style={{ height: 3, width: '55%', background: INK, borderRadius: 2 }} />
          <span style={{ height: 3, background: INK, borderRadius: 2 }} />
        </div>
        <div>
          <div style={{ fontSize: 21, fontWeight: 800 }}>Rewe, Weserstraße</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: MUTED, marginTop: 2 }}>
            Today 18:42 · 14 items scanned
          </div>
        </div>
      </div>
      <div style={abs(0, 266, { width: SCREEN_W, textAlign: 'center' })}>
        <div style={{ ...MONO, fontSize: 16, color: MUTED }}>Total</div>
        <div style={{ ...NUM, fontSize: 84, marginTop: 4, letterSpacing: '-0.045em' }}>
          <Money v="€63.20" />
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 32,
            padding: '0 14px',
            marginTop: 8,
            borderRadius: 999,
            background: MINT,
            border: `2.5px solid ${INK}`,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Groceries
        </span>
      </div>
      <div style={{ ...MONO, fontSize: 16, color: MUTED, ...abs(24, 444) }}>
        Split between · {n}
      </div>
      <SplitRow y={474} who="Y" color={TOMATO} name="You" on amount={shares[0]} live={live} />
      <SplitRow
        y={538}
        who="M"
        color={MINT}
        name="Mira"
        on={n >= 2}
        amount={n >= 2 ? shares[1] : '—'}
        live={live}
      />
      <SplitRow
        y={602}
        who="J"
        color={PERI}
        name="Jonas"
        on={n >= 3}
        amount={n >= 3 ? shares[2] : '—'}
        live={live}
      />
      <div
        key={sent ? 'sent' : 'idle'}
        style={abs(22, 716, {
          width: SCREEN_W - 44,
          height: 64,
          borderRadius: 999,
          border: `3px solid ${INK}`,
          background: sent ? MINT : INK,
          color: sent ? INK : CREAM,
          boxShadow: `0 5px 0 ${INK}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 800,
          boxSizing: 'border-box',
          ...anim(live && sent, `pm-thunk 520ms ease-out both`),
        })}
      >
        {sent ? 'Requests sent' : 'Split €63.20'}
      </div>
      <div
        style={abs(0, 798, {
          width: SCREEN_W,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 500,
          color: MUTED,
        })}
      >
        Mira and Jonas can pay back by SEPA.
      </div>
      {live && sent && (
        <div
          style={abs(14, 54, {
            width: SCREEN_W - 28,
            height: 74,
            boxSizing: 'border-box',
            padding: '0 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: INK,
            color: CREAM,
            borderRadius: 24,
            boxShadow: `0 6px 0 ${TOMATO}`,
            animation: 'pm-toast-once 2800ms linear 200ms both',
          })}
        >
          <Avatar initial="M" color={MINT} size={40} border={2.5} />
          <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.25 }}>
            Mira paid €21.07
            <br />
            Settled in 38 seconds
          </div>
        </div>
      )}
    </>
  );
};

const Callout = ({
  y,
  n,
  title,
  color,
  live,
  delay,
  stat,
  statLabel,
  children,
}: {
  y: number;
  n: string;
  title: string;
  color: string;
  live: boolean;
  delay: number;
  stat: string;
  statLabel: string;
  children: ReactNode;
}) => (
  <>
    <svg
      width={156}
      height={28}
      viewBox="0 0 156 28"
      aria-hidden="true"
      style={{ ...abs(634, y + 46), overflow: 'visible' }}
    >
      <path
        d="M 6 14 H 150"
        pathLength={1}
        style={{
          fill: 'none',
          stroke: INK,
          strokeWidth: 4,
          strokeDasharray: 1,
          strokeDashoffset: 0,
          ...anim(live, `pm-draw 420ms ${EASE_OUT} ${delay - 260}ms both`),
        }}
      />
      <circle
        cx={6}
        cy={14}
        r={9}
        style={{
          fill: TOMATO,
          stroke: INK,
          strokeWidth: 3.5,
          transformOrigin: '6px 14px',
          ...anim(live, `pm-pop 520ms ${BOUNCY} ${delay - 380}ms both`),
        }}
      />
    </svg>
    <div
      style={abs(790, y, {
        width: 1010,
        height: 120,
        boxSizing: 'border-box',
        padding: '0 30px 0 26px',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        background: PAPER,
        border: BORDER,
        borderRadius: 28,
        boxShadow: shadow(8),
        transformOrigin: '0% 50%',
        ...anim(live, `pm-pop 760ms ${SNAPPY} ${delay}ms both`),
      })}
    >
      <div
        style={{
          width: 62,
          height: 62,
          flex: 'none',
          borderRadius: '50%',
          background: color,
          border: BORDER,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...NUM,
          fontSize: 30,
        }}
      >
        {n}
      </div>
      <div style={{ ...DISPLAY, fontSize: 46, width: 156, flex: 'none' }}>{title}</div>
      <p style={{ ...BODY, fontSize: 28, lineHeight: 1.3, textWrap: 'balance', flex: 1 }}>
        {children}
      </p>
      <div
        style={{
          width: 190,
          flex: 'none',
          alignSelf: 'stretch',
          borderLeft: `3px dashed ${FAINT}`,
          paddingLeft: 26,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <span style={{ ...NUM, fontSize: 44, letterSpacing: '-0.03em' }}>{stat}</span>
        <span style={{ ...MONO, fontSize: 16, color: MUTED, marginTop: 6 }}>{statLabel}</span>
      </div>
    </div>
  </>
);

const Product: Page = () => {
  const live = useLive();
  const beat = useBeats(live, PRODUCT_BEATS);
  return (
    <Stage>
      <PhoneShell x={200} y={100} />
      <ScreenLayer x={200} y={100} live={live} delay={MORPH_MS - 320}>
        <ExpenseScreen beat={beat} live={live} />
      </ScreenLayer>
      <Tag n="02" live={live} x={790}>
        The product
      </Tag>
      <Title live={live} x={790} width={1010} size={80}>
        A shared expense,
        <br />
        logged in 4 seconds.
      </Title>
      <Callout
        y={384}
        n="1"
        title="Scan"
        color={BUTTER}
        live={live}
        delay={MORPH_MS + 420}
        stat="98.6%"
        statLabel="Read accuracy"
      >
        Snap the receipt. Total, shop and items fill in on their own.
      </Callout>
      <Callout
        y={616}
        n="2"
        title="Split"
        color={MINT}
        live={live}
        delay={MORPH_MS + 1250}
        stat="2.8"
        statLabel="Avg. flatmates"
      >
        Toggle who's in. Pommi splits it down to the cent.
      </Callout>
      <Callout
        y={792}
        n="3"
        title="Settle"
        color={PERI}
        live={live}
        delay={MORPH_MS + 2950}
        stat="71%"
        statLabel="Paid in 24 h"
      >
        Requests go out at once. Flatmates pay back in one tap.
      </Callout>
    </Stage>
  );
};

const SplitIllus = ({ live }: { live: boolean }) => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: '20px 22px',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 22, fontWeight: 800 }}>Rent, October</span>
      <span style={{ ...NUM, fontSize: 30 }}>
        <Money v="€1,650" />
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
      <ShareLine who="M" color={MINT} live={live} delay={0} />
      <ShareLine who="J" color={PERI} live={live} delay={180} />
      <ShareLine who="Y" color={TOMATO} live={live} delay={360} />
    </div>
    <div
      style={{
        position: 'absolute',
        right: 18,
        bottom: 20,
        padding: '6px 14px',
        border: `3.5px solid ${INK}`,
        borderRadius: 10,
        background: MINT,
        ...MONO,
        fontSize: 20,
        transform: 'rotate(-9deg)',
        ...anim(live, 'pm-stamp 5s ease-out 400ms infinite'),
      }}
    >
      Settled
    </div>
  </div>
);

const ShareLine = ({
  who,
  color,
  live,
  delay,
}: {
  who: string;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Avatar initial={who} color={color} size={36} border={2.5} />
    <div
      style={{
        flex: 1,
        height: 18,
        borderRadius: 999,
        border: `2.5px solid ${INK}`,
        overflow: 'hidden',
        background: PAPER,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: color,
          transformOrigin: '0% 50%',
          ...anim(live, `pm-fill 5s ${SNAPPY} ${delay}ms infinite`),
        }}
      />
    </div>
    <span
      style={{
        fontSize: 20,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        width: 54,
        textAlign: 'right',
      }}
    >
      €550
    </span>
  </div>
);

const ListItem = ({
  label,
  live,
  delay,
  checked,
}: {
  label: string;
  live: boolean;
  delay: number;
  checked: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 36 }}>
    <div
      style={{
        width: 30,
        height: 30,
        flex: 'none',
        borderRadius: 9,
        border: `3px solid ${INK}`,
        background: PAPER,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: 9,
          background: BUTTER,
          border: `3px solid ${INK}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: live || checked ? undefined : 0,
          ...anim(live, `pm-tick 6s ease-out ${delay}ms infinite`),
          ...(live ? { opacity: 0 } : {}),
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M3 8.5 L 6.5 12 L 13 4.5"
            style={{
              fill: 'none',
              stroke: INK,
              strokeWidth: 3,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
          />
        </svg>
      </div>
    </div>
    <span style={{ position: 'relative', fontSize: 22, fontWeight: 700 }}>
      {label}
      <span
        style={{
          position: 'absolute',
          left: -2,
          right: -2,
          top: '54%',
          height: 3,
          background: INK,
          transformOrigin: '0% 50%',
          transform: live || checked ? undefined : 'scaleX(0)',
          ...anim(live, `pm-strike 6s ease-out ${delay}ms infinite`),
        }}
      />
    </span>
  </div>
);

const ShopIllus = ({ live }: { live: boolean }) => (
  <div style={{ width: '100%', height: '100%', padding: '18px 22px', boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 22, fontWeight: 800 }}>Rewe run</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, ...MONO, fontSize: 16 }}>
        <Avatar initial="M" color={MINT} size={28} border={2.5} />
        Mira is shopping
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
      <ListItem label="Oat milk ×2" live={live} delay={0} checked />
      <ListItem label="Dish soap" live={live} delay={700} checked />
      <ListItem label="Basmati rice" live={live} delay={1400} checked={false} />
      <ListItem label="Bin bags, 60 L" live={live} delay={2100} checked={false} />
    </div>
  </div>
);

const ChoreLine = ({
  chore,
  who,
  color,
  live,
  delay,
}: {
  chore: string;
  who: string;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 44,
      padding: '0 10px',
      borderRadius: 12,
      ...anim(live, `pm-glow-row 6s ease-out ${delay}ms infinite`),
    }}
  >
    <Avatar initial={who} color={color} size={30} border={2.5} />
    <span style={{ fontSize: 21, fontWeight: 700 }}>{chore}</span>
  </div>
);

const RingAvatar = ({
  initial,
  color,
  angle,
  live,
}: {
  initial: string;
  color: string;
  angle: number;
  live: boolean;
}) => (
  <div
    style={{
      position: 'absolute',
      left: 80 + 64 * Math.cos((angle * Math.PI) / 180) - 22,
      top: 80 + 64 * Math.sin((angle * Math.PI) / 180) - 22,
    }}
  >
    <div style={{ ...anim(live, `pm-spin3-rev 6s ${SNAPPY} infinite`) }}>
      <Avatar initial={initial} color={color} size={44} />
    </div>
  </div>
);

const RotateIllus = ({ live }: { live: boolean }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '0 22px',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ position: 'relative', width: 160, height: 160, flex: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 16,
          borderRadius: '50%',
          border: `3px dashed ${INK}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 58,
          top: 58,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: BUTTER,
          border: `3px solid ${INK}`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...MONO,
          fontSize: 16,
        }}
      >
        41
      </div>
      <div
        style={{ position: 'absolute', inset: 0, ...anim(live, `pm-spin3 6s ${SNAPPY} infinite`) }}
      >
        <RingAvatar initial="M" color={MINT} angle={-90} live={live} />
        <RingAvatar initial="J" color={PERI} angle={30} live={live} />
        <RingAvatar initial="Y" color={TOMATO} angle={150} live={live} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <ChoreLine chore="Kitchen" who="M" color={MINT} live={live} delay={0} />
      <ChoreLine chore="Bins" who="J" color={PERI} live={live} delay={2000} />
      <ChoreLine chore="Bathroom" who="Y" color={TOMATO} live={live} delay={4000} />
    </div>
  </div>
);

const DealCard = ({
  x,
  y,
  r,
  color,
  n,
  title,
  stat,
  illus,
  children,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  n: string;
  title: string;
  stat: string;
  illus: ReactNode;
  children: ReactNode;
}) => (
  <div
    className="pm-deal"
    style={
      {
        ...abs(x, y),
        '--r': `${r}deg`,
        '--dx': `${960 - (x + 250)}px`,
        width: 500,
        height: 580,
        boxSizing: 'border-box',
        padding: 28,
        background: color,
        border: BORDER,
        borderRadius: 34,
        boxShadow: shadow(10),
        display: 'flex',
        flexDirection: 'column',
      } as CSSProperties
    }
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span
        style={{
          ...MONO,
          fontSize: 18,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: INK,
          color: CREAM,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n}
      </span>
      <span style={{ ...DISPLAY, fontSize: 64 }}>{title}</span>
    </div>
    <div
      style={{
        height: 240,
        marginTop: 22,
        background: PAPER,
        border: `3px solid ${INK}`,
        borderRadius: 22,
        overflow: 'hidden',
      }}
    >
      {illus}
    </div>
    <p style={{ ...BODY, fontSize: 28, marginTop: 24, lineHeight: 1.3 }}>{children}</p>
    <div
      style={{
        ...MONO,
        fontSize: 16,
        marginTop: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: INK }} />
      {stat}
    </div>
  </div>
);

const How: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Tag n="03" live={live}>
        How it works
      </Tag>
      <Title live={live}>Three jobs every shared home has.</Title>
      <Steps>
        <Step duration={120}>
          <DealCard
            x={150}
            y={348}
            r={-4}
            color={TOMATO}
            n="01"
            title="Split"
            stat="Used weekly by 91% of homes"
            illus={<SplitIllus live={live} />}
          >
            Rent, bills and receipts split by who's in. Settle in one tap.
          </DealCard>
        </Step>
        <Step duration={120}>
          <DealCard
            x={710}
            y={332}
            r={1}
            color={BUTTER}
            n="02"
            title="Shop"
            stat="Used weekly by 74% of homes"
            illus={<ShopIllus live={live} />}
          >
            One live list, sorted by aisle, for whoever is at the shop.
          </DealCard>
        </Step>
        <Step duration={120}>
          <DealCard
            x={1270}
            y={348}
            r={4}
            color={MINT}
            n="03"
            title="Rotate"
            stat="Used weekly by 52% of homes"
            illus={<RotateIllus live={live} />}
          >
            Chores rotate fairly, with a nudge before anything slips.
          </DealCard>
        </Step>
      </Steps>
    </Stage>
  );
};

const BAR_BASE = 900;
const BAR_MAX = 440;
const BAR_X = 120;
const BAR_PITCH = 70;
const BAR_W = 50;
const barH = (v: number) => Math.round((v / 412) * BAR_MAX);

const Bar = ({ i, v, live }: { i: number; v: number; live: boolean }) => {
  const h = barH(v);
  const color = i === 23 ? TOMATO : i >= 12 ? BUTTER : PAPER;
  return (
    <div
      style={abs(BAR_X + i * BAR_PITCH, BAR_BASE - h, {
        width: BAR_W,
        height: h,
        boxSizing: 'border-box',
        background: color,
        border: `3px solid ${INK}`,
        borderBottom: 'none',
        borderRadius: '12px 12px 0 0',
        transformOrigin: '50% 100%',
        ...anim(live, `pm-grow-y 950ms ${BOUNCY} ${260 + i * 46}ms both`),
      })}
    />
  );
};

const BarLabel = ({ i, v, text, live }: { i: number; v: number; text: string; live: boolean }) => (
  <div
    style={abs(BAR_X + i * BAR_PITCH + BAR_W / 2 - 60, BAR_BASE - barH(v) - 40, {
      width: 120,
      textAlign: 'center',
      fontSize: 24,
      fontWeight: 800,
      fontVariantNumeric: 'tabular-nums',
      ...anim(live, `pm-pop-b 600ms ${BOUNCY} ${260 + i * 46 + 600}ms both`),
    })}
  >
    {text}
  </div>
);

const GridLine = ({ v }: { v: number }) => (
  <div
    style={abs(BAR_X, BAR_BASE - barH(v), {
      width: 1680,
      height: 0,
      borderTop: `2px dashed ${FAINT}`,
    })}
  >
    <span style={{ ...MONO, fontSize: 16, color: MUTED, position: 'absolute', left: 0, top: -26 }}>
      {v}k
    </span>
  </div>
);

const AxisLabel = ({ i, children }: { i: number; children: ReactNode }) => (
  <div
    style={{
      ...MONO,
      ...abs(BAR_X + i * BAR_PITCH + BAR_W / 2 - 60, BAR_BASE + 16),
      width: 120,
      textAlign: 'center',
      color: MUTED,
    }}
  >
    {children}
  </div>
);

const Traction: Page = () => {
  const live = useLive();
  const count = useCount(412000, live, 260, 1900);
  return (
    <Stage>
      <Tag n="04" live={live}>
        Traction
      </Tag>
      <div
        style={{
          ...NUM,
          ...abs(108, 160),
          fontSize: 200,
          lineHeight: 0.86,
          letterSpacing: '-0.05em',
          transformOrigin: '0% 80%',
          ...anim(live, `pm-thunk 620ms ease-out 2160ms both`),
        }}
      >
        {Math.round(count).toLocaleString('en-US')}
      </div>
      <div style={abs(1000, 172, { width: 520, ...rise(live, 160, 24) })}>
        <div
          style={{
            ...DISPLAY,
            fontSize: 50,
            fontWeight: 800,
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            textWrap: 'balance',
          }}
        >
          homes use Pommi every month.
        </div>
        <div style={{ ...MONO, color: MUTED, marginTop: 18 }}>
          Monthly active households · Sep 2026
        </div>
      </div>
      <Sticker x={1590} y={150} r={6} live={live} delay={2300} bg={BUTTER} pad="12px 22px">
        <span style={{ ...NUM, fontSize: 44 }}>3.1×</span>
        <span style={{ ...MONO, fontSize: 16, marginTop: 4 }}>Year on year</span>
      </Sticker>
      <Sticker x={1574} y={292} r={-4} live={live} delay={2450} bg={MINT} pad="10px 20px">
        <span style={{ fontSize: 24, fontWeight: 800 }}>64% organic</span>
      </Sticker>

      <GridLine v={100} />
      <GridLine v={200} />
      <GridLine v={300} />
      <GridLine v={400} />
      <div
        style={abs(BAR_X - 20, BAR_BASE, {
          width: 1720,
          height: 4,
          background: INK,
          borderRadius: 2,
        })}
      />
      <Bar i={0} v={46} live={live} />
      <Bar i={1} v={51} live={live} />
      <Bar i={2} v={55} live={live} />
      <Bar i={3} v={63} live={live} />
      <Bar i={4} v={70} live={live} />
      <Bar i={5} v={76} live={live} />
      <Bar i={6} v={83} live={live} />
      <Bar i={7} v={90} live={live} />
      <Bar i={8} v={94} live={live} />
      <Bar i={9} v={97} live={live} />
      <Bar i={10} v={108} live={live} />
      <Bar i={11} v={133} live={live} />
      <Bar i={12} v={152} live={live} />
      <Bar i={13} v={166} live={live} />
      <Bar i={14} v={172} live={live} />
      <Bar i={15} v={196} live={live} />
      <Bar i={16} v={214} live={live} />
      <Bar i={17} v={233} live={live} />
      <Bar i={18} v={251} live={live} />
      <Bar i={19} v={268} live={live} />
      <Bar i={20} v={290} live={live} />
      <Bar i={21} v={312} live={live} />
      <Bar i={22} v={348} live={live} />
      <Bar i={23} v={412} live={live} />
      <BarLabel i={0} v={46} text="46k" live={live} />
      <BarLabel i={11} v={133} text="133k" live={live} />
      <BarLabel i={23} v={412} text="412k" live={live} />
      <AxisLabel i={0}>Oct '24</AxisLabel>
      <AxisLabel i={6}>Apr '25</AxisLabel>
      <AxisLabel i={12}>Oct '25</AxisLabel>
      <AxisLabel i={18}>Apr '26</AxisLabel>
      <AxisLabel i={23}>Sep '26</AxisLabel>
      <Footnote y={950} width={1680}>
        A monthly active household logged at least one shared expense, list item or chore that
        month. Source: Pommi internal data.
      </Footnote>
    </Stage>
  );
};

const retention = (c: number, m: number) => {
  if (m === 0) return 100;
  const floor = 67.8 + c * 0.6;
  return Math.round(floor + (100 - floor) * Math.exp(-m / 2.4));
};

const HEAT_X = 270;
const HEAT_Y = 340;
const HEAT_PX = 72;
const HEAT_PY = 47;

const HeatTile = ({ c, m, live }: { c: number; m: number; live: boolean }) => {
  const v = retention(c, m);
  const a = Math.min(1, Math.max(0.1, (v - 62) / 38));
  const hero = c === 0 && m === 12;
  return (
    <div
      style={abs(HEAT_X + m * HEAT_PX, HEAT_Y + c * HEAT_PY, {
        width: HEAT_PX - 7,
        height: HEAT_PY - 7,
        boxSizing: 'border-box',
        borderRadius: 10,
        border: hero ? BORDER : `2.5px solid ${INK}`,
        background: hero ? BUTTER : `rgba(255, 90, 44, ${a.toFixed(2)})`,
        boxShadow: hero ? shadow(5) : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: hero ? 900 : 700,
        fontVariantNumeric: 'tabular-nums',
        zIndex: hero ? 2 : 1,
        ...anim(live, `pm-pop 620ms ${BOUNCY} ${hero ? 1900 : 200 + (c + m) * 42}ms both`),
      })}
    >
      {v}
    </div>
  );
};

const CohortRow = ({ c, label, live }: { c: number; label: string; live: boolean }) => (
  <>
    <div
      style={{
        ...MONO,
        ...abs(120, HEAT_Y + c * HEAT_PY + 10),
        width: 130,
        color: MUTED,
        ...anim(live, `pm-fade 300ms ease-out ${150 + c * 42}ms both`),
      }}
    >
      {label}
    </div>
    {Array.from({ length: 13 - c }, (_, m) => (
      <HeatTile key={m} c={c} m={m} live={live} />
    ))}
  </>
);

const HeatHead = ({ m }: { m: number }) => (
  <div
    style={{
      ...MONO,
      ...abs(HEAT_X + m * HEAT_PX, HEAT_Y - 34),
      width: HEAT_PX - 7,
      textAlign: 'center',
      fontSize: 16,
      color: m === 12 ? INK : MUTED,
    }}
  >
    M{m}
  </div>
);

const Retention: Page = () => {
  const live = useLive();
  const r12 = useCount(68, live, 2000, 1100);
  return (
    <Stage>
      <Tag n="05" live={live}>
        Retention
      </Tag>
      <Title live={live}>They move in, and they stay.</Title>
      <HeatHead m={0} />
      <HeatHead m={1} />
      <HeatHead m={2} />
      <HeatHead m={3} />
      <HeatHead m={4} />
      <HeatHead m={5} />
      <HeatHead m={6} />
      <HeatHead m={7} />
      <HeatHead m={8} />
      <HeatHead m={9} />
      <HeatHead m={10} />
      <HeatHead m={11} />
      <HeatHead m={12} />
      <CohortRow c={0} label="Sep '25" live={live} />
      <CohortRow c={1} label="Oct '25" live={live} />
      <CohortRow c={2} label="Nov '25" live={live} />
      <CohortRow c={3} label="Dec '25" live={live} />
      <CohortRow c={4} label="Jan '26" live={live} />
      <CohortRow c={5} label="Feb '26" live={live} />
      <CohortRow c={6} label="Mar '26" live={live} />
      <CohortRow c={7} label="Apr '26" live={live} />
      <CohortRow c={8} label="May '26" live={live} />
      <CohortRow c={9} label="Jun '26" live={live} />
      <CohortRow c={10} label="Jul '26" live={live} />
      <CohortRow c={11} label="Aug '26" live={live} />
      <svg
        width={110}
        height={20}
        viewBox="0 0 110 20"
        aria-hidden="true"
        style={{ ...abs(HEAT_X + 12 * HEAT_PX + 65, HEAT_Y + 10), overflow: 'visible' }}
      >
        <path
          d="M 4 10 H 104"
          pathLength={1}
          style={{
            fill: 'none',
            stroke: INK,
            strokeWidth: 4,
            strokeDasharray: 1,
            strokeDashoffset: 0,
            ...anim(live, `pm-draw 380ms ${EASE_OUT} 2250ms both`),
          }}
        />
      </svg>
      <div style={abs(1340, 300, { width: 460 })}>
        <div style={rise(live, 1900, 30)}>
          <div
            style={{
              ...NUM,
              fontSize: 210,
              lineHeight: 0.86,
              letterSpacing: '-0.05em',
              transformOrigin: '0% 80%',
              ...anim(live, `pm-thunk 620ms ease-out 3100ms both`),
            }}
          >
            {Math.round(r12)}%
          </div>
        </div>
        <p
          style={{
            ...BODY,
            fontSize: 32,
            fontWeight: 700,
            marginTop: 22,
            ...rise(live, 2300, 20),
          }}
        >
          of households are still active twelve months after they join.
        </p>
        <div
          style={{
            marginTop: 40,
            paddingTop: 30,
            borderTop: BORDER,
            display: 'flex',
            alignItems: 'baseline',
            gap: 18,
            ...rise(live, 2500, 20),
          }}
        >
          <span style={{ ...NUM, fontSize: 72, letterSpacing: '-0.04em' }}>+4 pts</span>
        </div>
        <p
          style={{
            ...BODY,
            fontSize: 28,
            marginTop: 10,
            textWrap: 'balance',
            ...rise(live, 2560, 20),
          }}
        >
          higher month-3 retention, Jun '26 cohort vs Sep '25.
        </p>
      </div>
      <Footnote y={936} width={1100}>
        Share of each monthly sign-up cohort still active, by month since joining. Source: Pommi
        internal data, Sep 2026.
      </Footnote>
    </Stage>
  );
};

const RevSegment = ({
  x,
  w,
  color,
  name,
  pct,
  first,
  last,
}: {
  x: number;
  w: number;
  color: string;
  name: string;
  pct: string;
  first?: boolean;
  last?: boolean;
}) => (
  <div
    className="pm-seg"
    style={abs(x, 324, {
      width: w,
      height: 168,
      boxSizing: 'border-box',
      padding: '18px 24px',
      background: color,
      border: BORDER,
      borderRadius: `${first ? 30 : 0}px ${last ? 30 : 0}px ${last ? 30 : 0}px ${first ? 30 : 0}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    })}
  >
    <span style={{ fontSize: 28, fontWeight: 800 }}>{name}</span>
    <span style={{ ...NUM, fontSize: 72, letterSpacing: '-0.04em' }}>{pct}</span>
  </div>
);

const RevColumn = ({
  x,
  color,
  name,
  metric,
  unit,
  stat,
  children,
}: {
  x: number;
  color: string;
  name: string;
  metric: string;
  unit: string;
  stat: string;
  children: ReactNode;
}) => (
  <div className="pm-col" style={abs(x, 560, { width: 500 })}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: color,
          border: `3px solid ${INK}`,
          boxSizing: 'border-box',
        }}
      />
      <span style={{ fontSize: 30, fontWeight: 800 }}>{name}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 20 }}>
      <span style={{ ...NUM, fontSize: 68, letterSpacing: '-0.04em' }}>
        <Money v={metric} />
      </span>
      <span style={{ fontSize: 26, fontWeight: 700 }}>{unit}</span>
    </div>
    <p style={{ ...BODY, fontSize: 28, marginTop: 16 }}>{children}</p>
    <div style={{ ...MONO, color: MUTED, marginTop: 18 }}>{stat}</div>
  </div>
);

const Model: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Tag n="06" live={live}>
        Business model
      </Tag>
      <Title live={live} width={1400}>
        <Money v="€9.7M" /> ARR, 64% of it subscription.
      </Title>
      <Sticker x={1600} y={180} r={7} live={live} delay={700} bg={BUTTER} pad="12px 22px">
        <span style={{ ...NUM, fontSize: 44 }}>2.8×</span>
        <span style={{ ...MONO, fontSize: 16, marginTop: 4 }}>ARR year on year</span>
      </Sticker>
      <div
        style={abs(120, 324, {
          width: 1680,
          height: 168,
          boxSizing: 'border-box',
          border: `4px dashed ${FAINT}`,
          borderRadius: 30,
        })}
      />
      <Steps>
        <Step duration={120}>
          <RevSegment x={120} w={1075} color={TOMATO} name="Pommi Plus" pct="64%" first />
          <RevColumn
            x={120}
            color={TOMATO}
            name="Pommi Plus"
            metric="€5.99"
            unit="per home / month"
            stat="86,400 paying homes · €6.2M ARR"
          >
            Unlimited splits, receipt scan and rent autopay, shared by the whole flat.
          </RevColumn>
        </Step>
        <Step duration={120}>
          <RevSegment x={1191} w={290} color={PERI} name="Card" pct="17%" />
          <RevColumn
            x={710}
            color={PERI}
            name="Pommi Card"
            metric="€852M"
            unit="yearly spend"
            stat="96,000 active cards · €1.7M ARR"
          >
            One shared card for groceries and bills. We keep the interchange.
          </RevColumn>
        </Step>
        <Step duration={120}>
          <RevSegment x={1477} w={323} color={MINT} name="Partners" pct="19%" last />
          <RevColumn
            x={1300}
            color={MINT}
            name="Partner offers"
            metric="€58"
            unit="per switch"
            stat="31,200 switches · €1.8M ARR"
          >
            Energy, internet and insurance, switched once for the whole home.
          </RevColumn>
        </Step>
      </Steps>
      <Footnote y={936}>
        ARR = September 2026 revenue × 12. Card revenue shown net of the issuing bank's share.
        Source: Pommi finance.
      </Footnote>
    </Stage>
  );
};

const SEE_PIVOT_X = 800;
const SEE_PIVOT_Y = 780;
const SEE_LEFT = 250;
const SEE_TOP = 516;
const LTV_DROP = 300;
const CAC_DROP = 1900;

const UnitStat = ({
  value,
  label,
  color,
  live,
  delay,
}: {
  value: string;
  label: string;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      height: 112,
      boxSizing: 'border-box',
      padding: '0 26px',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      background: color,
      border: BORDER,
      borderRadius: 26,
      boxShadow: shadow(6),
      ...anim(live, `pm-in-l 860ms ${SNAPPY} ${delay}ms both`),
    }}
  >
    <span style={{ ...NUM, fontSize: 54, letterSpacing: '-0.04em', width: 112, flex: 'none' }}>
      {value}
    </span>
    <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15 }}>{label}</span>
  </div>
);

const Unit: Page = () => {
  const live = useLive();
  const ratio = useCount(6.2, live, CAC_DROP + 600, 1000);
  const ltvLand = LTV_DROP + Math.round(900 * DROP_LAND);
  const cacLand = CAC_DROP + Math.round(800 * DROP_LAND);
  return (
    <Stage>
      <Tag n="07" live={live}>
        Unit economics
      </Tag>
      <Title live={live} width={1200}>
        Every paying home
        <br />
        pays back in 4 months.
      </Title>

      <div style={abs(170, 940, { width: 1240, height: 4, background: INK, borderRadius: 2 })} />
      <svg
        width={240}
        height={160}
        viewBox="0 0 240 160"
        aria-hidden="true"
        style={{ ...abs(SEE_PIVOT_X - 120, 782), overflow: 'visible' }}
      >
        <path
          d="M 120 8 L 226 156 L 14 156 Z"
          style={{ fill: BUTTER, stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' }}
        />
        <circle cx={120} cy={10} r={10} style={{ fill: INK }} />
      </svg>
      <div
        style={
          {
            ...abs(SEE_LEFT, SEE_TOP),
            width: 1100,
            height: 278,
            transformOrigin: `${SEE_PIVOT_X - SEE_LEFT}px ${SEE_PIVOT_Y - SEE_TOP}px`,
            transform: 'rotate(-7deg)',
            '--pm-tip': '-7deg',
            ...anim(live, `pm-tip 1300ms ${BOUNCY} ${ltvLand}ms both`),
          } as CSSProperties
        }
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: `${SEE_PIVOT_X - SEE_LEFT}px ${SEE_PIVOT_Y - SEE_TOP}px`,
            ...anim(live, `pm-nudge 900ms ease-out ${cacLand}ms both`),
          }}
        >
          <div
            style={abs(0, 250, {
              width: 1100,
              height: 28,
              boxSizing: 'border-box',
              background: PAPER,
              border: BORDER,
              borderRadius: 14,
            })}
          />
          <div
            style={
              {
                ...abs(24, 0),
                width: 340,
                height: 250,
                '--pm-from': '-760px',
                ...anim(live, `pm-drop 900ms ${DROP} ${LTV_DROP}ms both`),
              } as CSSProperties
            }
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                padding: '24px 28px',
                background: TOMATO,
                border: BORDER,
                borderRadius: 26,
                boxShadow: shadow(8),
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transformOrigin: '50% 100%',
                ...anim(live, `pm-squash 520ms ease-out ${ltvLand}ms both`),
              }}
            >
              <span style={{ ...MONO, fontSize: 18 }}>Lifetime value</span>
              <span style={{ ...NUM, fontSize: 124, letterSpacing: '-0.05em' }}>
                <Money v="€148" />
              </span>
            </div>
          </div>
          <div
            style={
              {
                ...abs(890, 118),
                width: 186,
                height: 132,
                '--pm-from': '-980px',
                ...anim(live, `pm-drop 800ms ${DROP} ${CAC_DROP}ms both`),
              } as CSSProperties
            }
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                padding: '16px 20px',
                background: MINT,
                border: BORDER,
                borderRadius: 22,
                boxShadow: shadow(6),
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transformOrigin: '50% 100%',
                ...anim(live, `pm-squash 480ms ease-out ${cacLand}ms both`),
              }}
            >
              <span style={{ ...MONO, fontSize: 16 }}>CAC</span>
              <span style={{ ...NUM, fontSize: 64, letterSpacing: '-0.045em' }}>
                <Money v="€24" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={abs(1440, 330, { width: 360 })}>
        <div style={{ ...MONO, color: MUTED, ...rise(live, CAC_DROP + 500, 16) }}>LTV : CAC</div>
        <div style={rise(live, CAC_DROP + 500, 30)}>
          <div
            style={{
              ...NUM,
              fontSize: 180,
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              marginTop: 8,
              transformOrigin: '0% 80%',
              ...anim(live, `pm-thunk 620ms ease-out ${CAC_DROP + 1600}ms both`),
            }}
          >
            {ratio.toFixed(1)}×
          </div>
        </div>
      </div>
      <div
        style={abs(1440, 600, { width: 360, display: 'flex', flexDirection: 'column', gap: 22 })}
      >
        <UnitStat
          value="3.9"
          label="months to pay back CAC"
          color={BUTTER}
          live={live}
          delay={CAC_DROP + 1300}
        />
        <UnitStat
          value="78%"
          label="gross margin per home"
          color={PAPER}
          live={live}
          delay={CAC_DROP + 1450}
        />
      </div>
      <Footnote y={956} width={1300}>
        Paying homes, Q3 2026. LTV = monthly gross profit (€6.08) ÷ monthly churn (4.1%). CAC is
        blended across paid and organic.
      </Footnote>
    </Stage>
  );
};

const MAP_X = 1010;
const MAP_Y = 290;
const MAP_P = 100;
const MAP_T = 88;

const Country = ({
  code,
  c,
  r,
  live,
  count,
  color = MINT,
  order = 0,
}: {
  code: string;
  c: number;
  r: number;
  live: boolean;
  count?: string;
  color?: string;
  order?: number;
}) => {
  const on = Boolean(count);
  return (
    <div
      style={abs(MAP_X + c * MAP_P, MAP_Y + r * MAP_P, {
        width: MAP_T,
        height: MAP_T,
        boxSizing: 'border-box',
        borderRadius: 20,
        border: on ? BORDER : `3px solid ${FAINT}`,
        background: on ? color : 'transparent',
        boxShadow: on ? shadow(5) : undefined,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...anim(
          live,
          `pm-pop 620ms ${BOUNCY} ${on ? 700 + order * 170 : 120 + (c + r) * 40}ms both`,
        ),
      })}
    >
      <span
        style={{
          ...MONO,
          fontSize: on ? 22 : 17,
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: on ? INK : 'rgba(21, 19, 19, 0.38)',
        }}
      >
        {code}
      </span>
      {on && (
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
};

const Pin = ({
  c,
  r,
  live,
  order,
  color = TOMATO,
}: {
  c: number;
  r: number;
  live: boolean;
  order: number;
  color?: string;
}) => {
  const delay = 1000 + order * 170;
  const land = delay + Math.round(820 * DROP_LAND);
  const x = MAP_X + c * MAP_P + MAP_T - 30;
  const y = MAP_Y + r * MAP_P - 34;
  return (
    <>
      <div
        style={
          {
            ...abs(x, y),
            width: 38,
            height: 52,
            zIndex: 4,
            '--pm-from': '-420px',
            ...anim(
              live,
              `pm-drop 820ms ${DROP} ${delay}ms both, pm-fade 140ms linear ${delay}ms both`,
            ),
          } as CSSProperties
        }
      >
        <div
          style={{
            transformOrigin: '50% 100%',
            ...anim(live, `pm-squash 460ms ease-out ${land}ms both`),
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              marginLeft: 2,
              marginTop: 2,
              boxSizing: 'border-box',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              background: color,
              border: `3.5px solid ${INK}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: PAPER,
                border: `2.5px solid ${INK}`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const MarketStat = ({
  value,
  live,
  delay,
  children,
}: {
  value: string;
  live: boolean;
  delay: number;
  children: ReactNode;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      ...anim(live, `pm-in-l 860ms ${SNAPPY} ${delay}ms both`),
    }}
  >
    <span style={{ ...NUM, fontSize: 76, letterSpacing: '-0.045em', width: 230, flex: 'none' }}>
      {value}
    </span>
    <p style={{ ...BODY, fontSize: 28, width: 480 }}>{children}</p>
  </div>
);

const Market: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Tag n="08" live={live}>
        Market
      </Tag>
      <Title live={live} width={820}>
        Nine markets.
        <br />
        One playbook.
      </Title>
      <div style={abs(120, 410, { display: 'flex', flexDirection: 'column', gap: 44 })}>
        <MarketStat value="21M" live={live} delay={300}>
          renters sharing a home across our nine live markets
        </MarketStat>
        <MarketStat value="2.0%" live={live} delay={430}>
          of them use Pommi today. Plenty of room before we go wide.
        </MarketStat>
        <MarketStat value="11 wks" live={live} delay={560}>
          median time to 10,000 homes in a new market, down from 30
        </MarketStat>
      </div>
      <div style={abs(MAP_X, MAP_Y + 6, { width: 380, ...rise(live, 200, 12) })}>
        <div style={{ ...MONO, color: MUTED }}>Monthly active homes</div>
        <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
          <MapKey color={TOMATO} label="HQ" />
          <MapKey color={MINT} label="Live" />
          <MapKey color="transparent" label="Next" faint />
        </div>
      </div>

      <Country code="NO" c={4} r={0} live={live} />
      <Country code="SE" c={5} r={0} live={live} />
      <Country code="FI" c={6} r={0} live={live} />
      <Country code="IE" c={1} r={1} live={live} count="12k" order={7} />
      <Country code="GB" c={2} r={1} live={live} />
      <Country code="DK" c={4} r={1} live={live} />
      <Country code="EE" c={6} r={1} live={live} />
      <Country code="NL" c={3} r={2} live={live} count="52k" order={2} />
      <Country code="DE" c={4} r={2} live={live} count="141k" color={TOMATO} order={0} />
      <Country code="PL" c={5} r={2} live={live} />
      <Country code="LT" c={6} r={2} live={live} />
      <Country code="BE" c={3} r={3} live={live} count="19k" order={4} />
      <Country code="CZ" c={4} r={3} live={live} />
      <Country code="SK" c={5} r={3} live={live} />
      <Country code="FR" c={2} r={4} live={live} count="68k" order={3} />
      <Country code="CH" c={3} r={4} live={live} count="16k" order={5} />
      <Country code="AT" c={4} r={4} live={live} count="26k" order={1} />
      <Country code="HU" c={5} r={4} live={live} />
      <Country code="RO" c={6} r={4} live={live} />
      <Country code="PT" c={0} r={5} live={live} />
      <Country code="ES" c={1} r={5} live={live} count="47k" order={6} />
      <Country code="IT" c={3} r={5} live={live} count="31k" order={8} />
      <Country code="SI" c={4} r={5} live={live} />
      <Country code="HR" c={5} r={5} live={live} />
      <Country code="BG" c={6} r={5} live={live} />

      <Pin c={4} r={2} live={live} order={0} color={BUTTER} />
      <Pin c={4} r={4} live={live} order={1} />
      <Pin c={3} r={2} live={live} order={2} />
      <Pin c={2} r={4} live={live} order={3} />
      <Pin c={3} r={3} live={live} order={4} />
      <Pin c={3} r={4} live={live} order={5} />
      <Pin c={1} r={5} live={live} order={6} />
      <Pin c={1} r={1} live={live} order={7} />
      <Pin c={3} r={5} live={live} order={8} />

      <Footnote y={936} width={860}>
        Shared homes: 2+ adults renting together. Source: Eurostat EU-SILC 2025, Pommi analysis.
      </Footnote>
    </Stage>
  );
};

const MapKey = ({ color, label, faint }: { color: string; label: string; faint?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...MONO, fontSize: 16 }}>
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        background: color,
        border: faint ? `3px solid ${FAINT}` : `3px solid ${INK}`,
        boxSizing: 'border-box',
      }}
    />
    {label}
  </div>
);

const trackPath = () => {
  let d = `M ${STOPS[0][0] - 100} ${STOPS[0][1]} L ${STOPS[0][0]} ${STOPS[0][1]}`;
  for (let i = 1; i < STOPS.length; i++) {
    const [ax, ay] = STOPS[i - 1];
    const [bx, by] = STOPS[i];
    const h = (bx - ax) / 2;
    d += ` C ${ax + h} ${ay}, ${bx - h} ${by}, ${bx} ${by}`;
  }
  return d;
};
const TRACK = trackPath();

const RoadStop = ({ i, color, live }: { i: number; color: string; live: boolean }) => {
  const [x, y] = STOPS[i];
  const delay = i === 0 ? 300 : hopLand(i) - 60;
  return (
    <div
      style={abs(x - 30, y - 30, {
        width: 60,
        height: 60,
        boxSizing: 'border-box',
        borderRadius: '50%',
        background: color,
        border: BORDER,
        boxShadow: shadow(4),
        ...anim(live, `pm-pop 620ms ${BOUNCY} ${delay}ms both`),
      })}
    />
  );
};

const Milestone = ({
  i,
  above,
  q,
  title,
  sub,
  color,
  live,
  align = 'center',
}: {
  i: number;
  above?: boolean;
  q: string;
  title: string;
  sub: string;
  color: string;
  live: boolean;
  align?: 'center' | 'right';
}) => {
  const [x, y] = STOPS[i];
  const w = 440;
  const left = align === 'right' ? 1800 - w : x - w / 2;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        ...(above ? { bottom: 1080 - (y - 64) } : { top: y + 64 }),
        width: w,
        boxSizing: 'border-box',
        padding: '20px 24px',
        background: PAPER,
        border: BORDER,
        borderRadius: 26,
        boxShadow: shadow(8),
        transformOrigin: above ? '50% 100%' : '50% 0%',
        ...anim(live, `pm-pop 720ms ${BOUNCY} ${hopLand(i) + 40}ms both`),
      }}
    >
      <span
        style={{
          ...MONO,
          fontSize: 16,
          display: 'inline-flex',
          alignItems: 'center',
          height: 32,
          padding: '0 12px',
          borderRadius: 999,
          background: color,
          border: `2.5px solid ${INK}`,
        }}
      >
        {q}
      </span>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          lineHeight: 1.12,
          textWrap: 'balance',
          marginTop: 12,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, color: MUTED, marginTop: 8 }}>{sub}</div>
    </div>
  );
};

const Roadmap: Page = () => {
  const live = useLive();
  const maskId = `pm-road-${svgId(useId())}`;
  const [x0, y0] = STOPS[0];
  const [x4, y4] = STOPS[4];
  return (
    <Stage>
      <Tag n="09" live={live}>
        Roadmap
      </Tag>
      <Title live={live}>2027: from 412k to 1M homes.</Title>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        aria-hidden="true"
        style={{ ...abs(0, 0), pointerEvents: 'none' }}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            <path
              d={TRACK}
              pathLength={1}
              style={{
                fill: 'none',
                stroke: '#fff',
                strokeWidth: 40,
                strokeLinecap: 'round',
                strokeDasharray: 1,
                strokeDashoffset: 0,
                ...anim(live, `pm-draw 1100ms cubic-bezier(0.45, 0, 0.3, 1) 200ms both`),
              }}
            />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <path
            d={TRACK}
            style={{ fill: 'none', stroke: INK, strokeWidth: 26, strokeLinecap: 'round' }}
          />
          <path
            d={TRACK}
            style={{
              fill: 'none',
              stroke: CREAM,
              strokeWidth: 5,
              strokeLinecap: 'round',
              strokeDasharray: '14 18',
            }}
          />
        </g>
      </svg>
      <RoadStop i={0} color={INK} live={live} />
      <RoadStop i={1} color={BUTTER} live={live} />
      <RoadStop i={2} color={PERI} live={live} />
      <RoadStop i={3} color={PINK} live={live} />
      <RoadStop i={4} color={TOMATO} live={live} />

      <div
        style={abs(x0 - 100, y0 + 64, {
          width: 260,
          ...rise(live, 500, 16),
        })}
      >
        <div style={{ ...MONO, fontSize: 16, color: MUTED }}>Today · Oct 2026</div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8, lineHeight: 1.12 }}>
          412k homes,
          <br />9 markets
        </div>
      </div>
      <Milestone
        i={1}
        above
        q="Q1 2027"
        title="Pommi Card in all 9 markets"
        sub="Live today in DE, NL and FR"
        color={BUTTER}
        live={live}
      />
      <Milestone
        i={2}
        q="Q2 2027"
        title="Direct landlord payouts"
        sub="Pilot with 40 Berlin landlords"
        color={PERI}
        live={live}
      />
      <Milestone
        i={3}
        above
        q="Q3 2027"
        title="Launch UK, Sweden, Denmark"
        sub="+9.4M renters in shared homes"
        color={PINK}
        live={live}
      />
      <Milestone
        i={4}
        q="Q4 2027"
        title="1M monthly active homes"
        sub="€18M ARR run-rate"
        color={TOMATO}
        live={live}
        align="right"
      />

      <div
        style={{
          ...abs(x0 - 46, y0 - 46),
          width: 92,
          height: 92,
          zIndex: 5,
          transform: `translate(${x4 - x0}px, ${y4 - y0}px)`,
          ...anim(live, `pm-hop-move ${HOP_TOTAL}ms linear ${HOP_START}ms both`),
        }}
      >
        <div
          style={{
            width: 92,
            height: 92,
            transformOrigin: '50% 90%',
            ...anim(live, `pm-hop-jump ${HOP_TOTAL}ms linear ${HOP_START}ms both`),
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              boxSizing: 'border-box',
              borderRadius: '50%',
              background: PAPER,
              border: BORDER,
              boxShadow: shadow(5),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Mark size={56} />
          </div>
        </div>
      </div>
    </Stage>
  );
};

const FundBlock = ({
  x,
  y,
  w,
  h,
  r,
  r0,
  color,
  name,
  amount,
  pct,
  big,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  r0: number;
  color: string;
  name: string;
  amount: string;
  pct: string;
  big?: boolean;
}) => (
  <div
    className="pm-block"
    style={
      {
        ...abs(x, y),
        '--r': `${r}deg`,
        '--r0': `${r0}deg`,
        width: w,
        height: h,
        boxSizing: 'border-box',
        padding: big ? '24px 30px' : '0 26px',
        background: color,
        border: BORDER,
        borderRadius: big ? 28 : 20,
        boxShadow: shadow(8),
        display: 'flex',
        flexDirection: big ? 'column' : 'row',
        justifyContent: big ? 'space-between' : 'flex-start',
        alignItems: big ? 'stretch' : 'center',
        gap: big ? 0 : 16,
      } as CSSProperties
    }
  >
    {big ? (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 34, fontWeight: 800 }}>{name}</span>
          <span style={{ ...NUM, fontSize: 40 }}>{pct}</span>
        </div>
        <span style={{ ...NUM, fontSize: 96, letterSpacing: '-0.05em' }}>
          <Money v={amount} />
        </span>
      </>
    ) : (
      <>
        <span style={{ fontSize: 28, fontWeight: 800 }}>{name}</span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginLeft: 'auto',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {amount}
        </span>
        <span style={{ ...NUM, fontSize: 34, width: 74, textAlign: 'right' }}>{pct}</span>
      </>
    )}
  </div>
);

const AskPoint = ({ children, color }: { children: ReactNode; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
    <span
      style={{
        width: 22,
        height: 22,
        flex: 'none',
        borderRadius: 7,
        background: color,
        border: `3px solid ${INK}`,
        boxSizing: 'border-box',
        transform: 'rotate(45deg)',
      }}
    />
    <span style={{ fontSize: 30, fontWeight: 600 }}>{children}</span>
  </div>
);

const Ask: Page = () => {
  const live = useLive();
  const raise = useCount(38, live, 200, 1400);
  return (
    <Stage>
      <Tag n="10" live={live} color={TOMATO}>
        The ask
      </Tag>
      <div
        style={{
          ...NUM,
          ...abs(104, 176),
          fontSize: 280,
          lineHeight: 0.86,
          letterSpacing: '-0.05em',
          transformOrigin: '0% 80%',
          ...anim(live, `pm-thunk 620ms ease-out 1620ms both`),
        }}
      >
        <Money v={`€${Math.round(raise)}M`} />
      </div>
      <p
        style={{
          ...DISPLAY,
          ...abs(120, 452),
          width: 780,
          fontSize: 48,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          ...rise(live, 300, 24),
        }}
      >
        Series B to take Pommi to one million homes and profitability.
      </p>
      <div
        style={abs(120, 640, {
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          ...rise(live, 450, 24),
        })}
      >
        <AskPoint color={BUTTER}>30 months of runway</AskPoint>
        <AskPoint color={MINT}>1M monthly active homes by Q4 2027</AskPoint>
        <AskPoint color={PERI}>EBITDA positive in Q3 2028</AskPoint>
      </div>

      <div style={{ ...MONO, ...abs(1080, 252), color: MUTED }}>Use of funds</div>
      <div style={abs(1040, 944, { width: 760, height: 4, background: INK, borderRadius: 2 })} />
      <Steps>
        <Step duration={100}>
          <FundBlock
            x={1080}
            y={692}
            w={680}
            h={252}
            r={0}
            r0={-8}
            color={TOMATO}
            name="Product & engineering"
            amount="€15.2M"
            pct="40%"
            big
          />
        </Step>
        <Step duration={100}>
          <FundBlock
            x={1100}
            y={472}
            w={640}
            h={220}
            r={-0.8}
            r0={7}
            color={BUTTER}
            name="Growth & brand"
            amount="€13.3M"
            pct="35%"
            big
          />
        </Step>
        <Step duration={100}>
          <FundBlock
            x={1092}
            y={376}
            w={600}
            h={96}
            r={1}
            r0={-9}
            color={MINT}
            name="New markets"
            amount="€5.7M"
            pct="15%"
          />
        </Step>
        <Step duration={100}>
          <FundBlock
            x={1130}
            y={306}
            w={540}
            h={70}
            r={-1.4}
            r0={10}
            color={PERI}
            name="Ops & G&A"
            amount="€3.8M"
            pct="10%"
          />
        </Step>
      </Steps>
    </Stage>
  );
};

const Founder = ({
  initial,
  color,
  name,
  jobTitle,
  email,
  live,
  delay,
}: {
  initial: string;
  color: string;
  name: string;
  jobTitle: string;
  email: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      width: 470,
      height: 150,
      boxSizing: 'border-box',
      padding: '0 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      background: PAPER,
      border: BORDER,
      borderRadius: 28,
      boxShadow: shadow(8),
      ...anim(live, `pm-pop-b 760ms ${BOUNCY} ${delay}ms both`),
    }}
  >
    <Avatar initial={initial} color={color} size={84} border={4} />
    <div>
      <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>{name}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: MUTED, marginTop: 4 }}>{jobTitle}</div>
      <div
        style={{
          ...MONO,
          fontSize: 17,
          marginTop: 10,
          textTransform: 'none',
          letterSpacing: '0.01em',
        }}
      >
        {email}
      </div>
    </div>
  </div>
);

const Close: Page = () => {
  const live = useLive();
  return (
    <Stage footer={false}>
      <div style={abs(104, 150)}>
        <Wordmark size={250} live={live} delay={150} />
      </div>
      <p
        style={{
          ...DISPLAY,
          ...abs(120, 470),
          width: 1000,
          fontSize: 72,
          fontWeight: 800,
          lineHeight: 1.06,
          letterSpacing: '-0.035em',
          ...rise(live, 800, 30),
        }}
      >
        Sharing a home should be
        <br />
        the easy part.
      </p>
      <div style={abs(120, 720, { display: 'flex', gap: 32 })}>
        <Founder
          initial="A"
          color={BUTTER}
          name="Anouk de Vries"
          jobTitle="Co-founder & CEO"
          email="anouk@pommi.app"
          live={live}
          delay={1100}
        />
        <Founder
          initial="F"
          color={PERI}
          name="Felix Brandt"
          jobTitle="Co-founder & CTO"
          email="felix@pommi.app"
          live={live}
          delay={1240}
        />
      </div>
      <div style={{ ...MONO, ...abs(120, 984), color: MUTED, ...rise(live, 1500, 12) }}>
        Pommi GmbH · Oranienstraße 185 · 10999 Berlin
      </div>

      <div
        style={abs(1180, 96, {
          width: 620,
          height: 888,
          background: BUTTER,
          border: BORDER,
          borderRadius: 48,
          boxShadow: shadow(12),
          ...rise(live, 60, 80),
        })}
      />
      <div
        style={abs(1290, 250, {
          width: 400,
          height: 400,
          ...anim(live, `pm-pop 900ms ${BOUNCY} 500ms both`),
        })}
      >
        <div style={{ ...anim(live, 'pm-bob 3.6s ease-in-out 1400ms infinite') }}>
          <Mark size={400} />
        </div>
      </div>
      <div
        style={abs(1230, 740, {
          width: 520,
          textAlign: 'center',
          ...rise(live, 900, 20),
        })}
      >
        <div style={{ ...MONO, fontSize: 18 }}>Data room</div>
        <div style={{ ...DISPLAY, fontSize: 54, marginTop: 10, letterSpacing: '-0.03em' }}>
          pommi.app/investors
        </div>
      </div>
      <Sticker x={1110} y={150} r={-9} live={live} delay={1500} bg={TOMATO} pad="12px 26px">
        <span style={{ ...DISPLAY, fontSize: 50, letterSpacing: '-0.03em' }}>Danke!</span>
      </Sticker>
      <Sticker x={1560} y={600} r={8} live={live} delay={1700} bg={MINT} pad="10px 22px">
        <span style={{ fontSize: 28, fontWeight: 800 }}>€38M Series B</span>
      </Sticker>
      <Sparkle x={1700} y={170} size={44} color={PAPER} live={live} delay={1850} />
      <Sparkle x={1250} y={620} size={32} color={PINK} live={live} delay={1950} />
    </Stage>
  );
};

Cover.transition = morphTransition;
Problem.transition = morphTransition;
Product.transition = morphTransition;

export const meta: SlideMeta = {
  title: 'Pommi — Series B',
  createdAt: '2026-10-11T12:54:25.584Z',
};

export const notes: (string | undefined)[] = [
  `Let the wordmark land and the stickers slap on before you speak.
"Hi, I'm Anouk, co-founder and CEO of Pommi. Pommi is the app for everyone who shares a home."
"We're in Berlin, we're live in nine markets, and today we're raising a thirty-eight million euro Series B." Click.`,
  `Let the phone rise and the group chat play out. Don't talk over the first three messages.
"Every shared home has this chat. Oat milk, internet, the plunger."
"In our survey of four thousand two hundred people: three point four apps per home, sixty-one percent argued about money last year, and three hundred eighteen euros floating between flatmates at any moment." Click.`,
  `The phone glides over and the expense splits itself. Point at the toggles as they flip.
"This is Pommi. Snap the receipt, toggle who's in, and the cents are handled."
"Median time to log a shared expense is four seconds. Requests go out instantly, and people pay back by SEPA in one tap." Click.`,
  `Three clicks, one card per click.
"Split: rent, bills and receipts. Ninety-one percent of homes use it every week."
"Shop: one live list. Seventy-four percent weekly."
"Rotate: chores on a fair rotation. Fifty-two percent weekly, and it's the feature people tell their friends about." Click.`,
  `Let the number count up and the bars spring in.
"Four hundred twelve thousand homes use Pommi every month. That's three point one times a year ago."
"Sixty-four percent of new homes come in organically, mostly a flatmate inviting the others. Note the September jumps: moving season is our Black Friday." Click.`,
  `Watch the wave fill in, then land on the yellow tile.
"Sixty-eight percent of households are still active twelve months after they join."
"And it's getting better: month-three retention is four points higher for our June cohort than for last September's." Click.`,
  `Three clicks: subscription, card, partners.
"Nine point seven million ARR, two point eight times last year."
"Sixty-four percent is Pommi Plus at five ninety-nine per home per month, shared by the whole flat."
"The card adds seventeen percent from eight hundred fifty million euros of yearly spend, and partner switching adds nineteen." Click.`,
  `Let the blocks drop and the seesaw tip.
"For a paying home, lifetime value is one hundred forty-eight euros. Blended CAC is twenty-four. That's six point two to one."
"Payback in three point nine months, at seventy-eight percent gross margin." Click.`,
  `Pins drop in launch order, Berlin first.
"Nine markets, one playbook. Twenty-one million renters share a home across them, and we have two percent."
"We now reach ten thousand homes in a new market in eleven weeks, down from thirty in Germany." Click.`,
  `Let the token hop all four stops before you sum up.
"Q1: the card in all nine markets. Q2: rent split with direct landlord payout, piloting with forty Berlin landlords."
"Q3: UK, Sweden and Denmark. Q4: one million monthly active homes and an eighteen million euro run-rate." Click.`,
  `Four clicks, one block per click, bottom up.
"We're raising thirty-eight million euros."
"Forty percent into product and engineering, thirty-five into growth, fifteen into new markets, ten into operations."
"Thirty months of runway, one million homes by end of 2027, EBITDA positive in Q3 2028." Click.`,
  `"Sharing a home should be the easy part. That's the whole company."
"I'm Anouk, this is my co-founder Felix. The data room is at pommi.app slash investors."
"Danke. Happy to take questions."`,
];

export default [
  Cover,
  Problem,
  Product,
  How,
  Traction,
  Retention,
  Model,
  Unit,
  Market,
  Roadmap,
  Ask,
  Close,
] satisfies Page[];

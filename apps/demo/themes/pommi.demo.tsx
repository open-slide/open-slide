import {
  type DesignSystem,
  type Page,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

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
const DROP = toLinear(dropAt, 72);
const SLAP = 'cubic-bezier(0.2, 0.8, 0.3, 1)';

const SLIDE_ID = 'theme-pommi';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=Gabarito:wght@500;700;800;900&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;

const CSS = `
@keyframes pm-rise { from { opacity: 0; transform: translateY(var(--pm-rise, 32px)) } to { opacity: 1; transform: translateY(0) } }
@keyframes pm-in-l { from { opacity: 0; transform: translateX(-90px) } to { opacity: 1; transform: translateX(0) } }
@keyframes pm-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes pm-drop { from { transform: translateY(var(--pm-from, -320px)) } to { transform: translateY(0) } }
@keyframes pm-pop { from { opacity: 0; transform: scale(0) } to { opacity: 1; transform: scale(1) } }
@keyframes pm-pop-b { from { opacity: 0; transform: translateY(20px) scale(0.55) } to { opacity: 1; transform: translateY(0) scale(1) } }
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

const Footer = ({
  brand = 'pommi',
  label = 'Company update · 2026',
  note = 'Confidential',
}: {
  brand?: string;
  label?: string;
  note?: string;
}) => {
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
      <span style={{ ...DISPLAY, fontSize: 30, letterSpacing: '-0.04em' }}>{brand}</span>
      <span style={{ ...MONO, color: MUTED, marginLeft: 18 }}>{label}</span>
      <span style={{ ...MONO, color: MUTED, marginLeft: 'auto', marginRight: 10 }}>{note}</span>
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

const Eyebrow = ({
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

const Chip = ({ children }: { children: ReactNode }) => (
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

const StatRow = ({
  x = 120,
  y,
  n,
  color,
  live,
  delay,
  children,
}: {
  x?: number;
  y: number;
  n: string;
  color: string;
  live: boolean;
  delay: number;
  children: ReactNode;
}) => (
  <div
    style={abs(x, y, {
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
      <span style={{ ...NUM, fontSize: 76, letterSpacing: '-0.045em' }}>{n}</span>
    </div>
    <p style={{ ...BODY, padding: '0 36px', alignSelf: 'center' }}>{children}</p>
  </div>
);

const TiltCard = ({
  x,
  y,
  r,
  color,
  n,
  title,
  live,
  delay,
  width = 360,
  height = 420,
  children,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  n: string;
  title: string;
  live: boolean;
  delay: number;
  width?: number;
  height?: number;
  children: ReactNode;
}) => (
  <div
    style={
      {
        ...abs(x, y),
        '--r': `${r}deg`,
        transform: `rotate(${r}deg)`,
        width,
        height,
        boxSizing: 'border-box',
        padding: 28,
        background: color,
        border: BORDER,
        borderRadius: 34,
        boxShadow: shadow(10),
        display: 'flex',
        flexDirection: 'column',
        ...anim(live, `pm-slap 760ms ${SLAP} ${delay}ms both`),
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
          flex: 'none',
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
    <p style={{ ...BODY, fontSize: 28, marginTop: 24, lineHeight: 1.3 }}>{children}</p>
  </div>
);

const DropWord = ({
  text,
  size,
  live,
  delay = 0,
}: {
  text: string;
  size: number;
  live: boolean;
  delay?: number;
}) => {
  const letters = Array.from(text, (ch, i) => ({ ch, id: `${i}-${ch}` }));
  return (
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
      {letters.map((l, i) => {
        const d = delay + i * 85;
        return (
          <span
            key={l.id}
            style={{
              display: 'inline-block',
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
              {l.ch}
            </span>
          </span>
        );
      })}
    </div>
  );
};

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
        <span style={{ ...MONO, fontSize: 18 }}>Company update · October 2026</span>
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
      <TiltCard
        x={1220}
        y={290}
        r={-4}
        width={480}
        height={210}
        color={TOMATO}
        n="01"
        title="Bold"
        live={live}
        delay={700}
      >
        Huge type that takes up the whole room.
      </TiltCard>
      <TiltCard
        x={1270}
        y={500}
        r={3}
        width={480}
        height={210}
        color={BUTTER}
        n="02"
        title="Bright"
        live={live}
        delay={850}
      >
        Cream paper, ink lines, five loud fills.
      </TiltCard>
      <TiltCard
        x={1200}
        y={710}
        r={-2}
        width={480}
        height={210}
        color={MINT}
        n="03"
        title="Bouncy"
        live={live}
        delay={1000}
      >
        Things drop, squash and slap into place.
      </TiltCard>

      <div style={abs(104, 236)}>
        <DropWord text="hello" size={300} live={live} delay={220} />
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
        A loud, happy theme
        <br />
        for consumer brands.
      </p>
      <div
        style={abs(120, 800, {
          display: 'flex',
          gap: 12,
          ...rise(live, 1040, 24),
        })}
      >
        <Chip>Gabarito + DM Mono</Chip>
        <Chip>Seven colours</Chip>
        <Chip>Hard shadows</Chip>
      </div>
      <div style={{ ...MONO, ...abs(120, 984), color: MUTED, ...rise(live, 1160, 12) }}>
        Theme preview · Cream, ink and tomato
      </div>

      <Sticker x={1440} y={200} r={7} live={live} delay={1250} bg={BUTTER}>
        <span style={{ ...DISPLAY, fontSize: 52, letterSpacing: '-0.03em' }}>New theme</span>
      </Sticker>
      <Sticker x={1380} y={950} r={-6} live={live} delay={1650} bg={PAPER} pad="12px 24px">
        <span style={{ ...DISPLAY, fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Made to be shown
        </span>
      </Sticker>
      <Sparkle x={1360} y={170} size={46} live={live} delay={1800} />
      <Sparkle x={1716} y={150} size={30} color={PINK} live={live} delay={1900} />
      <Sparkle x={1770} y={470} size={34} color={PAPER} live={live} delay={2000} />
    </Stage>
  );
};

const Content: Page = () => {
  const live = useLive();
  const count = useCount(412, live, 600, 1600);
  return (
    <Stage>
      <Eyebrow n="01" live={live}>
        Highlights
      </Eyebrow>
      <Title live={live} size={96} width={1100}>
        This quarter,
        <br />
        in three numbers.
      </Title>
      <StatRow y={420} n="3.4×" color={TOMATO} live={live} delay={260}>
        more weekly active users than at the same point last year
      </StatRow>
      <StatRow y={576} n="61%" color={BUTTER} live={live} delay={380}>
        of new sign-ups arrived through a friend's invite link
      </StatRow>
      <StatRow y={732} n="4 s" color={PERI} live={live} delay={500}>
        median time to finish the core action, down from eleven
      </StatRow>
      <Footnote y={898} width={1000}>
        Illustrative figures for the theme preview. Swap in your own numbers and sources.
      </Footnote>

      <div
        style={abs(1220, 330, {
          width: 580,
          height: 520,
          boxSizing: 'border-box',
          padding: '40px 44px',
          background: PAPER,
          border: BORDER,
          borderRadius: 34,
          boxShadow: shadow(10),
          display: 'flex',
          flexDirection: 'column',
          ...rise(live, 160, 60),
        })}
      >
        <span style={{ ...MONO, color: MUTED }}>Monthly active homes</span>
        <span
          style={{
            ...NUM,
            fontSize: 200,
            lineHeight: 0.86,
            letterSpacing: '-0.05em',
            marginTop: 24,
            transformOrigin: '0% 80%',
            ...anim(live, 'pm-thunk 620ms ease-out 2200ms both'),
          }}
        >
          {Math.round(count)}k
        </span>
        <p style={{ ...BODY, fontWeight: 700, marginTop: 26 }}>
          households open the app at least once a month.
        </p>
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 22,
            borderTop: `3px dashed ${FAINT}`,
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
          }}
        >
          <span style={{ ...NUM, fontSize: 44, letterSpacing: '-0.03em' }}>+3.1×</span>
          <span style={{ ...MONO, fontSize: 16, color: MUTED }}>Year on year</span>
        </div>
      </div>
      <Sticker x={1600} y={286} r={6} live={live} delay={2300} bg={MINT} pad="10px 20px">
        <span style={{ fontSize: 24, fontWeight: 800 }}>64% organic</span>
      </Sticker>
      <Sparkle x={1180} y={296} size={40} live={live} delay={2450} />
    </Stage>
  );
};

const Closer: Page = () => {
  const live = useLive();
  return (
    <Stage footer={false}>
      <div style={abs(104, 150)}>
        <DropWord text="thanks" size={250} live={live} delay={150} />
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
        Questions, ideas and
        <br />
        high fives welcome.
      </p>
      <div style={abs(120, 720, { display: 'flex', gap: 12, ...rise(live, 1000, 24) })}>
        <Chip>hello@example.com</Chip>
        <Chip>example.com/deck</Chip>
      </div>
      <div style={{ ...MONO, ...abs(120, 984), color: MUTED, ...rise(live, 1500, 12) }}>
        Pommi theme · open-slide
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
        <div style={{ ...MONO, fontSize: 18 }}>Find us at</div>
        <div style={{ ...DISPLAY, fontSize: 54, marginTop: 10, letterSpacing: '-0.03em' }}>
          example.com
        </div>
      </div>
      <Sticker x={1110} y={150} r={-9} live={live} delay={1500} bg={TOMATO} pad="12px 26px">
        <span style={{ ...DISPLAY, fontSize: 50, letterSpacing: '-0.03em' }}>Thank you!</span>
      </Sticker>
      <Sticker x={1560} y={600} r={8} live={live} delay={1700} bg={MINT} pad="10px 22px">
        <span style={{ fontSize: 28, fontWeight: 800 }}>See you soon</span>
      </Sticker>
      <Sparkle x={1700} y={170} size={44} color={PAPER} live={live} delay={1850} />
      <Sparkle x={1250} y={620} size={32} color={PINK} live={live} delay={1950} />
    </Stage>
  );
};

export default [Cover, Content, Closer] satisfies Page[];

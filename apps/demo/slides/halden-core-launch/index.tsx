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
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#08090B', text: '#F4F3EF', accent: '#FF7A2F' },
  fonts: {
    display: '"Inter Tight", "Inter", system-ui, sans-serif',
    body: '"Inter Tight", "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 200, body: 34 },
  radius: 28,
};

const MUTED = '#8C8F96';
const DIM = '#4A4D53';
const HAIRLINE = 'rgba(255,255,255,0.10)';
const DEEP = '#C2410C';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const SLIDE_ID = 'halden-core-launch';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes hc-breathe { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
@keyframes hc-fill { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes hc-flow { to { stroke-dashoffset: -24 } }
@keyframes hc-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes hc-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes hc-rise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
@keyframes hc-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
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
  if (style.textContent !== KEYFRAMES) style.textContent = KEYFRAMES;
}

const em = (pct: number) =>
  `color-mix(in srgb, var(--osd-accent) ${Math.max(0, Math.min(100, pct))}%, transparent)`;
const deep = (pct: number) =>
  `color-mix(in srgb, ${DEEP} ${Math.max(0, Math.min(100, pct))}%, transparent)`;

const noise = (w: number, h: number, freq: string, alpha: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${alpha} 0 0 0 0'/></filter><rect width='${w}' height='${h}' filter='url(#n)'/></svg>`,
  )}")`;

const GRAIN = noise(240, 240, '0.85', 1);
const BRUSHED = noise(320, 320, '0.9 0.008', 1);

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 900;

export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const settle: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

const morphTransition: SlideTransition = {
  duration: 300,
  exit: { duration: 320, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 320, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const HEAD: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 600,
  letterSpacing: '-0.045em',
  lineHeight: 0.95,
  margin: 0,
};

const LABEL: CSSProperties = {
  fontSize: 20,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: MUTED,
};

const GRADIENT_TEXT: CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, var(--osd-text) 25%, #A8A39B 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  paddingBottom: '0.08em',
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

function smoothPath(pts: [number, number][]): string {
  const n = pts.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    slopes.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  }
  const t: number[] = [slopes[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2);
  }
  t.push(slopes[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / slopes[i];
    const b = t[i + 1] / slopes[i];
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      t[i] = k * a * slopes[i];
      t[i + 1] = k * b * slopes[i];
    }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = (x1 - x0) / 3;
    d += ` C${(x0 + dx).toFixed(1)},${(y0 + t[i] * dx).toFixed(1)} ${(x1 - dx).toFixed(1)},${(y1 - t[i + 1] * dx).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 20,
        color: MUTED,
        letterSpacing: '0.01em',
        zIndex: 3,
      }}
    >
      <span style={{ fontWeight: 600, letterSpacing: '-0.01em', color: '#B4B2AC' }}>Halden</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {String(current).padStart(2, '0')}
        <span style={{ color: DIM }}> / {String(total).padStart(2, '0')}</span>
      </span>
    </div>
  );
};

const Stage = ({ children, footer = true }: { children: ReactNode; footer?: boolean }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 80% 75% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)',
        zIndex: 2,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: GRAIN,
        backgroundSize: '240px 240px',
        opacity: 0.045,
        zIndex: 2,
      }}
    />
    {footer && <Footer />}
  </div>
);

type UnitBodyProps = { s: number; charge: number; live: boolean; intro: boolean; glow: boolean };

const UnitBody = ({ s, charge, live, intro, glow }: UnitBodyProps) => {
  const W = 300 * s;
  const H = 720 * s;
  const R = 28 * s;
  const lip = 2.5 * s;
  const slotTop = 72 * s;
  const slotH = H - slotTop - 160 * s;
  const fillH = slotH * charge;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: W,
        height: H,
        borderRadius: R,
        background: [
          `linear-gradient(90deg, ${em(20)} 0%, rgba(0,0,0,0) 3%, rgba(0,0,0,0) 97%, ${em(28)} 100%)`,
          'linear-gradient(162deg, #D9D2CA 0%, #8E8882 7%, #4B4744 20%, #2B2927 48%, #2A2725 76%, #5A4637 100%)',
        ].join(', '),
        boxShadow: `0 0 0 ${0.8 * s}px rgba(0,0,0,0.75), 0 ${24 * s}px ${50 * s}px rgba(0,0,0,0.45)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: lip,
          borderRadius: R - lip,
          overflow: 'hidden',
          background: [
            'radial-gradient(130% 50% at 12% 2%, rgba(255,244,232,0.12) 0%, rgba(255,244,232,0.03) 40%, rgba(255,244,232,0) 70%)',
            'linear-gradient(90deg, rgba(255,248,240,0) 6%, rgba(255,248,240,0.045) 21%, rgba(255,248,240,0) 40%)',
            'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 18%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.12) 78%, rgba(0,0,0,0.3) 100%)',
            'linear-gradient(180deg, #3A3734 0%, #2E2C29 28%, #262422 62%, #1E1D1B 100%)',
          ].join(', '),
          boxShadow: [
            `inset ${1.2 * s}px 0 0 rgba(255,240,226,0.10)`,
            `inset 0 ${1.2 * s}px 0 rgba(255,244,234,0.16)`,
            `inset 0 -${1.6 * s}px 0 rgba(0,0,0,0.55)`,
            `inset -${1.2 * s}px 0 0 rgba(0,0,0,0.4)`,
            `inset 0 0 ${18 * s}px rgba(0,0,0,0.35)`,
          ].join(', '),
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: BRUSHED,
            backgroundSize: `${320 * s}px ${320 * s}px`,
            opacity: 0.05,
            mixBlendMode: 'screen',
          }}
        />
        {glow && (
          <div
            style={{
              position: 'absolute',
              right: -70 * s,
              top: slotTop + slotH - fillH - 60 * s,
              width: 200 * s,
              height: fillH + 120 * s,
              background: `radial-gradient(closest-side, ${em(16)} 0%, ${em(6)} 55%, rgba(0,0,0,0) 100%)`,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 112 * s,
            height: 1.4 * s,
            background: 'rgba(0,0,0,0.6)',
            boxShadow: `0 ${1.2 * s}px 0 rgba(255,255,255,0.05)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 50 * s,
            textAlign: 'center',
            fontFamily: 'var(--osd-font-display)',
            fontSize: 11 * s,
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: '0.52em',
            paddingLeft: '0.52em',
            color: 'rgba(236,230,222,0.26)',
            textShadow: `0 -${0.7 * s}px 0 rgba(0,0,0,0.75), 0 ${0.7 * s}px 0 rgba(255,255,255,0.07)`,
          }}
        >
          HALDEN
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 26 * s,
          top: slotTop,
          width: 5 * s,
          height: slotH,
          borderRadius: 3 * s,
          background: '#060606',
          boxShadow: `inset 0 ${1.2 * s}px ${2 * s}px rgba(0,0,0,0.95), 0 0 0 ${0.7 * s}px rgba(255,255,255,0.07)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: fillH,
            borderRadius: 3 * s,
            transformOrigin: '50% 100%',
            background: `linear-gradient(180deg, #FFE7D3 0px, var(--osd-accent) ${14 * s}px, var(--osd-accent) 100%)`,
            animation:
              intro && live ? 'hc-fill 1.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.35s both' : undefined,
          }}
        >
          {glow && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 3 * s,
                boxShadow: `0 0 ${3 * s}px ${0.6 * s}px ${em(95)}, 0 0 ${14 * s}px ${2 * s}px ${em(55)}, 0 0 ${46 * s}px ${6 * s}px ${em(20)}`,
                animation: live
                  ? `hc-breathe 5.6s ease-in-out ${intro ? '2.3s' : '0.4s'} infinite`
                  : undefined,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

type CoreUnitProps = {
  x: number;
  y: number;
  scale?: number;
  charge?: number;
  wash?: number;
  floor?: boolean;
  intro?: boolean;
};

const CoreUnit = ({
  x,
  y,
  scale = 1,
  charge = 0.76,
  wash = 1,
  floor = true,
  intro = false,
}: CoreUnitProps) => {
  const live = useIsActivePage();
  const s = scale;
  const W = 300 * s;
  const H = 720 * s;
  const R = 28 * s;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: W, height: H }}>
      <div style={{ position: 'absolute', inset: 0, opacity: wash }}>
        <div
          style={{
            position: 'absolute',
            left: W / 2 - 2.7 * W,
            top: H * 0.44 - 0.98 * H,
            width: 5.4 * W,
            height: 1.96 * H,
            background: `radial-gradient(closest-side, ${em(34)} 0%, ${em(26)} 14%, ${deep(17)} 32%, ${deep(9)} 50%, ${deep(4)} 68%, ${deep(1.2)} 86%, rgba(0,0,0,0) 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -4 * s,
            top: -2 * s,
            width: W + 8 * s,
            height: H - 2 * s,
            borderRadius: R + 4 * s,
            background: em(90),
            filter: `blur(${52 * s}px)`,
            opacity: 0.42,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: W / 2 - 1.7 * W,
            top: H - 0.07 * H,
            width: 3.4 * W,
            height: 0.22 * H,
            background: `radial-gradient(closest-side, ${em(20)} 0%, ${deep(8)} 50%, rgba(0,0,0,0) 100%)`,
          }}
        />
      </div>
      {floor && (
        <>
          <div
            style={{
              position: 'absolute',
              left: 3 * s,
              top: H + 3 * s,
              width: W - 6 * s,
              height: 0.46 * H,
              overflow: 'hidden',
              opacity: 0.5,
              filter: `blur(${1.6 * s}px)`,
              WebkitMaskImage:
                'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0) 72%)',
              maskImage:
                'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0) 72%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -3 * s,
                top: 0,
                width: W,
                height: H,
                transform: 'scaleY(-1)',
              }}
            >
              <UnitBody s={s} charge={charge} live={false} intro={false} glow={false} />
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: -0.05 * W,
              top: H - 7 * s,
              width: 1.1 * W,
              height: 16 * s,
              background:
                'radial-gradient(closest-side, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 100%)',
            }}
          />
        </>
      )}
      <UnitBody s={s} charge={charge} live={live} intro={intro} glow />
    </div>
  );
};

const MorphCore = ({
  x,
  y,
  scale,
  wash,
}: {
  x: number;
  y: number;
  scale: number;
  wash: number;
}) => (
  <MorphElement id="core-unit">
    <div style={{ position: 'absolute', left: x, top: y, width: 300 * scale, height: 720 * scale }}>
      <CoreUnit x={0} y={0} scale={scale} charge={0.76} wash={wash} />
    </div>
  </MorphElement>
);

const Cover: Page = () => {
  const live = useIsActivePage();
  const rise = (delay: number): CSSProperties =>
    live ? { animation: `hc-rise 1s ${EASE_OUT} ${delay}s both` } : {};
  return (
    <Stage footer={false}>
      <CoreUnit x={1214} y={176} scale={1} charge={0.82} wash={1.15} intro />
      <div style={abs(120, 112, { ...LABEL, color: '#B4B2AC', letterSpacing: '0.16em' })}>
        Launch event · October 2026
      </div>
      <div style={abs(120, 408, { width: 1040 })}>
        <h1 style={{ ...HEAD, ...GRADIENT_TEXT, fontSize: 196, ...rise(0.15) }}>Halden Core</h1>
        <p
          style={{
            margin: '40px 0 0',
            fontSize: 44,
            fontWeight: 400,
            letterSpacing: '-0.015em',
            color: '#C9C6C0',
            ...rise(0.35),
          }}
        >
          Your home, on its own power.
        </p>
      </div>
      <div
        style={abs(120, 1002, {
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: '#B4B2AC',
          zIndex: 3,
        })}
      >
        Halden
      </div>
    </Stage>
  );
};

const TARIFF = [
  1.0, 1.0, 1.0, 1.0, 1.0, 1.05, 1.3, 1.7, 1.8, 1.6, 1.4, 1.3, 1.25, 1.25, 1.3, 1.5, 2.1, 2.9, 3.0,
  3.0, 3.0, 2.6, 1.6, 1.15, 1.0,
];
const P2 = { x0: 96, x1: 1664, top: 60, bottom: 360 };
const p2x = (h: number) => P2.x0 + (h / 24) * (P2.x1 - P2.x0);
const p2y = (v: number) => P2.bottom - ((v - 0.6) / (3.2 - 0.6)) * (P2.bottom - P2.top);
const TARIFF_PATH = smoothPath(TARIFF.map((v, h) => [p2x(h), p2y(v)] as [number, number]));
const TARIFF_AREA = `${TARIFF_PATH} L${p2x(24)},${P2.bottom} L${p2x(0)},${P2.bottom} Z`;

const AxisHour = ({ x, y, label }: { x: number; y: number; label: string }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    style={{
      fill: MUTED,
      fontSize: 20,
      fontFamily: 'var(--osd-font-body)',
      letterSpacing: '0.04em',
    }}
  >
    {label}
  </text>
);

const Problem: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage>
      <div style={abs(120, 120, LABEL)}>The price of a day</div>
      <h2 style={{ ...HEAD, ...abs(120, 176), fontSize: 112, width: 1500 }}>
        Electricity is cheapest
        <br />
        <span style={{ color: MUTED }}>when you don't need it.</span>
      </h2>
      <svg
        width={1680}
        height={420}
        viewBox="0 0 1680 420"
        style={abs(120, 478, { overflow: 'visible' })}
        role="img"
        aria-label="Relative electricity price over 24 hours"
      >
        <defs>
          <linearGradient id="hc-p2-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: '#F4F3EF', stopOpacity: 0.07 }} />
            <stop offset="1" style={{ stopColor: '#F4F3EF', stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id="hc-p2-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--osd-accent)', stopOpacity: 0.11 }} />
            <stop offset="1" style={{ stopColor: 'var(--osd-accent)', stopOpacity: 0.015 }} />
          </linearGradient>
          <linearGradient
            id="hc-p2-stroke"
            gradientUnits="userSpaceOnUse"
            x1={P2.x0}
            x2={P2.x1}
            y1={0}
            y2={0}
          >
            <stop offset={16 / 24} style={{ stopColor: '#F4F3EF', stopOpacity: 0.82 }} />
            <stop offset={16.9 / 24} style={{ stopColor: 'var(--osd-accent)' }} />
            <stop offset={21.1 / 24} style={{ stopColor: 'var(--osd-accent)' }} />
            <stop offset={22 / 24} style={{ stopColor: '#F4F3EF', stopOpacity: 0.82 }} />
          </linearGradient>
          <linearGradient
            id="hc-p2-glow"
            gradientUnits="userSpaceOnUse"
            x1={P2.x0}
            x2={P2.x1}
            y1={0}
            y2={0}
          >
            <stop offset={16 / 24} style={{ stopColor: 'var(--osd-accent)', stopOpacity: 0 }} />
            <stop offset={17.2 / 24} style={{ stopColor: 'var(--osd-accent)', stopOpacity: 0.7 }} />
            <stop offset={20.8 / 24} style={{ stopColor: 'var(--osd-accent)', stopOpacity: 0.7 }} />
            <stop offset={22 / 24} style={{ stopColor: 'var(--osd-accent)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <rect
          x={p2x(17)}
          y={P2.top - 44}
          width={p2x(21) - p2x(17)}
          height={P2.bottom - P2.top + 44}
          fill="url(#hc-p2-band)"
          style={live ? { animation: 'hc-fade 0.8s ease-out 1.2s both' } : undefined}
        />
        <line
          x1={p2x(17)}
          x2={p2x(17)}
          y1={P2.top - 44}
          y2={P2.bottom}
          style={{ stroke: em(28), strokeWidth: 1 }}
        />
        <line
          x1={p2x(21)}
          x2={p2x(21)}
          y1={P2.top - 44}
          y2={P2.bottom}
          style={{ stroke: em(28), strokeWidth: 1 }}
        />
        <text
          x={p2x(17) + 16}
          y={P2.top - 12}
          style={{
            fill: 'var(--osd-accent)',
            fontSize: 22,
            fontWeight: 500,
            fontFamily: 'var(--osd-font-body)',
            letterSpacing: '0.02em',
          }}
        >
          Peak: 5–9 pm
        </text>
        <line
          x1={P2.x0}
          x2={P2.x1}
          y1={p2y(1)}
          y2={p2y(1)}
          style={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1, strokeDasharray: '2 6' }}
        />
        <line
          x1={P2.x0}
          x2={P2.x1}
          y1={p2y(3)}
          y2={p2y(3)}
          style={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1, strokeDasharray: '2 6' }}
        />
        <text
          x={0}
          y={p2y(1) + 7}
          style={{ fill: MUTED, fontSize: 22, fontFamily: 'var(--osd-font-body)' }}
        >
          1.0×
        </text>
        <text
          x={0}
          y={p2y(3) + 7}
          style={{ fill: MUTED, fontSize: 22, fontFamily: 'var(--osd-font-body)' }}
        >
          3.0×
        </text>
        <text
          x={0}
          y={P2.top - 12}
          style={{
            fill: DIM,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: '0.14em',
            fontFamily: 'var(--osd-font-body)',
          }}
        >
          RELATIVE PRICE · TIME-OF-USE TARIFF
        </text>
        <path
          d={TARIFF_AREA}
          fill="url(#hc-p2-area)"
          style={live ? { animation: 'hc-fade 1s ease-out 0.9s both' } : undefined}
        />
        <path
          d={TARIFF_PATH}
          style={{
            fill: 'none',
            stroke: 'url(#hc-p2-glow)',
            strokeWidth: 14,
            filter: 'blur(10px)',
            animation: live ? 'hc-fade 0.8s ease-out 1.3s both' : undefined,
          }}
        />
        <path
          d={TARIFF_PATH}
          pathLength={1}
          style={{
            fill: 'none',
            stroke: 'url(#hc-p2-stroke)',
            strokeWidth: 3.5,
            strokeLinecap: 'round',
            strokeDasharray: 1,
            animation: live ? `hc-draw 1.6s ${EASE_OUT} 0.2s both` : undefined,
          }}
        />
        <circle
          cx={p2x(19)}
          cy={p2y(3)}
          r={7}
          style={{
            fill: 'var(--osd-accent)',
            filter: `drop-shadow(0 0 10px ${em(80)})`,
            animation: live ? 'hc-fade 0.5s ease-out 1.6s both' : undefined,
          }}
        />
        <line
          x1={P2.x0}
          x2={P2.x1}
          y1={P2.bottom}
          y2={P2.bottom}
          style={{ stroke: 'rgba(255,255,255,0.22)', strokeWidth: 1 }}
        />
        <AxisHour x={p2x(0)} y={P2.bottom + 40} label="00:00" />
        <AxisHour x={p2x(6)} y={P2.bottom + 40} label="06:00" />
        <AxisHour x={p2x(12)} y={P2.bottom + 40} label="12:00" />
        <AxisHour x={p2x(18)} y={P2.bottom + 40} label="18:00" />
        <AxisHour x={p2x(24)} y={P2.bottom + 40} label="24:00" />
      </svg>
    </Stage>
  );
};

const Reveal: Page = () => (
  <Stage>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(520px 820px at 50% 8%, rgba(255,236,220,0.06) 0%, rgba(255,236,220,0.025) 45%, rgba(255,236,220,0) 100%)',
      }}
    />
    <h2
      style={{
        ...HEAD,
        ...GRADIENT_TEXT,
        ...abs(0, 104),
        width: 1920,
        textAlign: 'center',
        fontSize: 120,
      }}
    >
      Meet Core.
    </h2>
    <MorphCore x={843} y={268} scale={0.78} wash={1.25} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 904,
        width: 1920,
        display: 'flex',
        justifyContent: 'center',
        gap: 0,
        zIndex: 3,
      }}
    >
      <RevealSpec value="14.2" unit="kWh" label="Capacity" />
      <RevealSpec value="10" unit="kW" label="Continuous power" divider />
      <RevealSpec value="14" unit="cm" label="Depth" divider />
    </div>
  </Stage>
);

const RevealSpec = ({
  value,
  unit,
  label,
  divider = false,
}: {
  value: string;
  unit: string;
  label: string;
  divider?: boolean;
}) => (
  <div
    style={{
      width: 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      borderLeft: divider ? `1px solid ${HAIRLINE}` : '1px solid transparent',
    }}
  >
    <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1 }}>
      {value}
      <span style={{ fontSize: 26, color: MUTED, marginLeft: 6, letterSpacing: '-0.01em' }}>
        {unit}
      </span>
    </div>
    <div style={{ ...LABEL, fontSize: 18 }}>{label}</div>
  </div>
);

const D = { wall: 150, top: 100, floor: 568, breakA: 262, breakB: 308, k: 11 };
const coreFront = D.wall + 14 * D.k;
const h1Front = D.wall + 20.5 * D.k;

const BreakMark = ({ x0, x1, y }: { x0: number; x1: number; y: number }) => {
  const mid = (x0 + x1) / 2;
  return (
    <path
      d={`M${x0 - 10},${y} L${mid - 9},${y} L${mid - 3},${y - 9} L${mid + 3},${y + 9} L${mid + 9},${y} L${x1 + 10},${y}`}
      style={{ fill: 'none', stroke: 'rgba(244,243,239,0.55)', strokeWidth: 1.2 }}
    />
  );
};

const DimH = ({
  x0,
  x1,
  y,
  label,
  color,
}: {
  x0: number;
  x1: number;
  y: number;
  label: string;
  color: string;
}) => (
  <g>
    <line
      x1={x0}
      x2={x0}
      y1={y - 10}
      y2={D.top - 6}
      style={{ stroke: color, strokeWidth: 1, opacity: 0.6 }}
    />
    <line
      x1={x1}
      x2={x1}
      y1={y - 10}
      y2={D.top - 6}
      style={{ stroke: color, strokeWidth: 1, opacity: 0.6 }}
    />
    <line
      x1={x0}
      x2={x1}
      y1={y}
      y2={y}
      markerStart="url(#hc-arrow)"
      markerEnd="url(#hc-arrow)"
      style={{ stroke: color, strokeWidth: 1.2 }}
    />
    <text
      x={x1 + 14}
      y={y + 7}
      style={{ fill: color, fontSize: 20, fontFamily: MONO, letterSpacing: '0.02em' }}
    >
      {label}
    </text>
  </g>
);

const SideDrawing = () => {
  const live = useIsActivePage();
  return (
    <svg
      width={1240}
      height={620}
      viewBox="0 0 1240 620"
      style={abs(560, 340, {
        overflow: 'visible',
        animation: live ? `hc-fade 0.7s ease-out ${MORPH_MS / 1000 - 0.2}s both` : undefined,
      })}
      role="img"
      aria-label="Side elevation of Halden Core compared with H1"
    >
      <defs>
        <pattern
          id="hc-hatch"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="12"
            style={{ stroke: 'rgba(244,243,239,0.22)', strokeWidth: 1 }}
          />
        </pattern>
        <linearGradient id="hc-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: '#1F1E1C' }} />
          <stop offset="0.7" style={{ stopColor: '#36332F' }} />
          <stop offset="1" style={{ stopColor: '#4A4540' }} />
        </linearGradient>
        <marker
          id="hc-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M0,1.5 L9,5 L0,8.5 z" style={{ fill: 'context-stroke' }} />
        </marker>
      </defs>
      <rect x={D.wall - 40} y={40} width={40} height={D.floor - 40} fill="url(#hc-hatch)" />
      <line
        x1={D.wall}
        x2={D.wall}
        y1={40}
        y2={D.floor}
        style={{ stroke: 'rgba(244,243,239,0.6)', strokeWidth: 1.4 }}
      />
      <line
        x1={-420}
        x2={1240}
        y1={D.floor}
        y2={D.floor}
        style={{ stroke: 'rgba(244,243,239,0.35)', strokeWidth: 1 }}
      />
      <rect
        x={D.wall - 40}
        y={D.floor}
        width={420}
        height={16}
        fill="url(#hc-hatch)"
        opacity={0.6}
      />

      <path
        d={`M${D.wall},${D.breakA} L${D.wall},${D.top} L${h1Front - 10},${D.top} Q${h1Front},${D.top} ${h1Front},${D.top + 10} L${h1Front},${D.breakA}`}
        style={{ fill: 'none', stroke: MUTED, strokeWidth: 1.2, strokeDasharray: '7 6' }}
      />
      <path
        d={`M${D.wall},${D.breakB} L${h1Front},${D.breakB} L${h1Front},${D.floor - 10} Q${h1Front},${D.floor} ${h1Front - 10},${D.floor}`}
        style={{ fill: 'none', stroke: MUTED, strokeWidth: 1.2, strokeDasharray: '7 6' }}
      />

      <path
        d={`M${D.wall},${D.breakA} L${D.wall},${D.top} L${coreFront - 10},${D.top} Q${coreFront},${D.top} ${coreFront},${D.top + 10} L${coreFront},${D.breakA} Z`}
        style={{ fill: 'url(#hc-side)', stroke: 'rgba(244,243,239,0.85)', strokeWidth: 1.4 }}
      />
      <path
        d={`M${D.wall},${D.breakB} L${coreFront},${D.breakB} L${coreFront},${D.floor - 10} Q${coreFront},${D.floor} ${coreFront - 10},${D.floor} L${D.wall},${D.floor} Z`}
        style={{ fill: 'url(#hc-side)', stroke: 'rgba(244,243,239,0.85)', strokeWidth: 1.4 }}
      />
      <rect
        x={D.wall + 2}
        y={D.top + 40}
        width={14}
        height={70}
        style={{
          fill: 'none',
          stroke: 'rgba(244,243,239,0.4)',
          strokeWidth: 1,
          strokeDasharray: '4 4',
        }}
      />
      <line
        x1={coreFront}
        x2={coreFront}
        y1={D.top + 64}
        y2={D.breakA}
        style={{
          stroke: 'var(--osd-accent)',
          strokeWidth: 3,
          filter: `drop-shadow(0 0 6px ${em(90)})`,
        }}
      />
      <rect
        x={D.wall - 2}
        y={D.breakA + 1}
        width={h1Front - D.wall + 14}
        height={D.breakB - D.breakA - 2}
        style={{ fill: 'var(--osd-bg)' }}
      />
      <BreakMark x0={D.wall} x1={h1Front} y={D.breakA} />
      <BreakMark x0={D.wall} x1={h1Front} y={D.breakB} />

      <DimH x0={D.wall} x1={coreFront} y={70} label="14 cm" color="var(--osd-text)" />
      <DimH x0={D.wall} x1={h1Front} y={30} label="20.5 cm · H1" color={MUTED} />

      <line
        x1={h1Front + 60}
        x2={h1Front + 60}
        y1={D.top}
        y2={D.floor}
        markerStart="url(#hc-arrow)"
        markerEnd="url(#hc-arrow)"
        style={{ stroke: MUTED, strokeWidth: 1.2 }}
      />
      <line
        x1={coreFront + 8}
        x2={h1Front + 72}
        y1={D.top}
        y2={D.top}
        style={{ stroke: MUTED, strokeWidth: 1, opacity: 0.5 }}
      />
      <line
        x1={coreFront + 8}
        x2={h1Front + 72}
        y1={D.floor}
        y2={D.floor}
        style={{ stroke: MUTED, strokeWidth: 1, opacity: 0.5 }}
      />
      <rect
        x={h1Front + 44}
        y={(D.breakA + D.breakB) / 2 - 18}
        width={32}
        height={36}
        style={{ fill: 'var(--osd-bg)' }}
      />
      <text
        x={h1Front + 60}
        y={(D.breakA + D.breakB) / 2 + 7}
        textAnchor="middle"
        style={{ fill: MUTED, fontSize: 20, fontFamily: MONO }}
      >
        168
      </text>

      <g style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.08em' }}>
        <rect
          x={900}
          y={470}
          width={340}
          height={98}
          style={{ fill: 'none', stroke: 'rgba(244,243,239,0.3)', strokeWidth: 1 }}
        />
        <line
          x1={900}
          x2={1240}
          y1={504}
          y2={504}
          style={{ stroke: 'rgba(244,243,239,0.2)', strokeWidth: 1 }}
        />
        <line
          x1={900}
          x2={1240}
          y1={536}
          y2={536}
          style={{ stroke: 'rgba(244,243,239,0.2)', strokeWidth: 1 }}
        />
        <line
          x1={1090}
          x2={1090}
          y1={504}
          y2={568}
          style={{ stroke: 'rgba(244,243,239,0.2)', strokeWidth: 1 }}
        />
        <text x={914} y={493} style={{ fill: 'var(--osd-text)' }}>
          HALDEN CORE · SIDE ELEVATION
        </text>
        <text x={914} y={526} style={{ fill: MUTED }}>
          DIMENSIONS CM
        </text>
        <text x={1104} y={526} style={{ fill: MUTED }}>
          DETAIL 2.5:1
        </text>
        <text x={914} y={558} style={{ fill: MUTED }}>
          DWG HC-104
        </text>
        <text x={1104} y={558} style={{ fill: MUTED }}>
          REV A
        </text>
      </g>
    </svg>
  );
};

const Thin: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage>
      <div style={abs(120, 120, LABEL)}>Design</div>
      <h2 style={{ ...HEAD, ...abs(120, 168), fontSize: 104 }}>Fourteen centimetres.</h2>
      <p
        style={abs(122, 286, {
          margin: 0,
          fontSize: 32,
          color: MUTED,
          letterSpacing: '-0.01em',
          animation: live ? `hc-fade 0.6s ease-out ${MORPH_MS / 1000 - 0.3}s both` : undefined,
        })}
      >
        A third thinner than H1, with 38% more energy inside.
      </p>
      <MorphCore x={210} y={440} scale={0.65} wash={0.7} />
      <SideDrawing />
      <div
        style={abs(1460, 440, {
          width: 340,
          animation: live ? `hc-fade 0.7s ease-out ${MORPH_MS / 1000}s both` : undefined,
        })}
      >
        <div style={{ ...HEAD, ...GRADIENT_TEXT, fontSize: 132 }}>−32%</div>
        <div style={{ marginTop: 18, fontSize: 28, color: MUTED, lineHeight: 1.35 }}>
          depth versus
          <br />
          Halden H1
        </div>
      </div>
    </Stage>
  );
};

const HOME_LOAD = [
  0.5, 0.42, 0.38, 0.36, 0.38, 0.5, 0.9, 1.4, 1.2, 0.85, 0.75, 0.85, 0.95, 0.85, 0.75, 0.85, 1.1,
  1.6, 2.1, 2.2, 1.8, 1.3, 0.9, 0.65, 0.5,
];
const homeAt = (t: number) => {
  const i = Math.min(23, Math.floor(t));
  const f = t - i;
  return HOME_LOAD[i] * (1 - f) + HOME_LOAD[i + 1] * f;
};
const solarAt = (t: number) =>
  Math.max(0, 3.8 * Math.exp(-((t - 12.5) ** 2) / (2 * 2.6 * 2.6)) - 0.04);

type DayRow = { t: number; solar: number; home: number; soc: number; grid: number };
const DAY: DayRow[] = (() => {
  const cap = 14.2;
  const reserve = 0.1;
  const dt = 0.25;
  let soc = 0.35;
  const rows: DayRow[] = [];
  for (let k = 0; k <= 96; k++) {
    const t = k * dt;
    const solar = solarAt(t);
    const home = homeAt(t);
    let energy = soc * cap + (solar - home) * dt;
    let grid = 0;
    if (energy > cap) energy = cap;
    if (energy < reserve * cap) {
      grid = (reserve * cap - energy) / dt;
      energy = reserve * cap;
    }
    rows.push({ t, solar, home, soc, grid });
    soc = energy / cap;
  }
  return rows;
})();

const P5 = { x0: 64, x1: 1600, base: 470, kwTop: 4.6 };
const p5x = (t: number) => P5.x0 + (t / 24) * (P5.x1 - P5.x0);
const p5y = (kw: number) => P5.base - (kw / P5.kwTop) * 400;
const SOLAR_PATH = smoothPath(DAY.map((r) => [p5x(r.t), p5y(r.solar)] as [number, number]));
const SOLAR_AREA = `${SOLAR_PATH} L${p5x(24)},${P5.base} L${p5x(0)},${P5.base} Z`;
const HOME_PATH = smoothPath(HOME_LOAD.map((kw, h) => [p5x(h), p5y(kw)] as [number, number]));
const SOC_PATH = smoothPath(DAY.map((r) => [p5x(r.t), p5y(r.soc * 4)] as [number, number]));
const GRID_ROWS = DAY.filter((r) => r.t >= 6 && r.t <= 9.25);
const GRID_AREA = `${smoothPath(GRID_ROWS.map((r) => [p5x(r.t), p5y(r.grid)] as [number, number]))} L${p5x(9.25)},${P5.base} L${p5x(6)},${P5.base} Z`;

const ChartText = ({
  x,
  y,
  children,
  anchor = 'start',
  color = MUTED,
  size = 20,
  weight = 400,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  size?: number;
  weight?: number;
}) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    style={{ fill: color, fontSize: size, fontWeight: weight, fontFamily: 'var(--osd-font-body)' }}
  >
    {children}
  </text>
);

const LegendKey = ({
  x,
  y,
  label,
  kind,
}: {
  x: number;
  y: number;
  label: string;
  kind: 'solar' | 'home' | 'battery' | 'grid';
}) => (
  <g>
    {kind === 'grid' ? (
      <rect
        x={x}
        y={y - 8}
        width={28}
        height={12}
        rx={2}
        style={{ fill: 'rgba(140,143,150,0.42)', stroke: MUTED, strokeWidth: 1 }}
      />
    ) : (
      <line
        x1={x}
        x2={x + 28}
        y1={y - 2}
        y2={y - 2}
        style={{
          stroke:
            kind === 'solar' ? 'var(--osd-accent)' : kind === 'home' ? 'var(--osd-text)' : MUTED,
          strokeWidth: 3,
          strokeDasharray: kind === 'battery' ? '6 5' : undefined,
        }}
      />
    )}
    <ChartText x={x + 42} y={y + 5} color="#C9C6C0" size={20}>
      {label}
    </ChartText>
  </g>
);

const Bracket = ({ t0, t1, y, label }: { t0: number; t1: number; y: number; label: string }) => (
  <g>
    <path
      d={`M${p5x(t0)},${y + 10} L${p5x(t0)},${y} L${p5x(t1)},${y} L${p5x(t1)},${y + 10}`}
      style={{ fill: 'none', stroke: 'rgba(244,243,239,0.45)', strokeWidth: 1.2 }}
    />
    <ChartText x={(p5x(t0) + p5x(t1)) / 2} y={y - 16} anchor="middle" color="#D9D6D0" size={22}>
      {label}
    </ChartText>
  </g>
);

const Day: Page = () => {
  const live = useIsActivePage();
  const draw = (delay: number): CSSProperties =>
    live ? { animation: `hc-draw 1.6s ${EASE_OUT} ${delay}s both` } : {};
  const fade = (delay: number): CSSProperties =>
    live ? { animation: `hc-fade 0.8s ease-out ${delay}s both` } : {};
  return (
    <Stage>
      <div style={abs(120, 120, LABEL)}>A day with Core</div>
      <h2 style={{ ...HEAD, ...abs(120, 168), fontSize: 96, width: 1100 }}>
        Sun by day.
        <br />
        <span style={{ color: MUTED }}>Core by night.</span>
      </h2>
      <div style={abs(1380, 128, { width: 420, textAlign: 'right' })}>
        <div style={{ ...HEAD, fontSize: 168, color: 'var(--osd-accent)' }}>94%</div>
        <div
          style={{
            marginTop: 14,
            fontSize: 30,
            color: 'var(--osd-text)',
            letterSpacing: '-0.01em',
          }}
        >
          of the day off-grid
        </div>
        <div style={{ ...LABEL, fontSize: 18, marginTop: 10, color: DIM }}>Typical spring day</div>
      </div>
      <svg
        width={1680}
        height={530}
        viewBox="0 0 1680 530"
        style={abs(120, 410, { overflow: 'visible' })}
        role="img"
        aria-label="Solar production, home consumption, battery charge and grid import over one day"
      >
        <defs>
          <linearGradient id="hc-solar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--osd-accent)', stopOpacity: 0.5 }} />
            <stop offset="0.55" style={{ stopColor: DEEP, stopOpacity: 0.18 }} />
            <stop offset="1" style={{ stopColor: DEEP, stopOpacity: 0.02 }} />
          </linearGradient>
        </defs>
        <line
          x1={P5.x0}
          x2={P5.x1}
          y1={p5y(4)}
          y2={p5y(4)}
          style={{ stroke: 'rgba(255,255,255,0.07)', strokeDasharray: '2 6' }}
        />
        <line
          x1={P5.x0}
          x2={P5.x1}
          y1={p5y(2)}
          y2={p5y(2)}
          style={{ stroke: 'rgba(255,255,255,0.07)', strokeDasharray: '2 6' }}
        />
        <ChartText x={P5.x0 - 18} y={p5y(4) + 7} anchor="end" color={DIM}>
          4 kW
        </ChartText>
        <ChartText x={P5.x0 - 18} y={p5y(2) + 7} anchor="end" color={DIM}>
          2
        </ChartText>
        <ChartText x={P5.x0 - 18} y={p5y(0) + 7} anchor="end" color={DIM}>
          0
        </ChartText>
        <ChartText x={P5.x1 + 18} y={p5y(4) + 7} color={DIM}>
          100%
        </ChartText>
        <ChartText x={P5.x1 + 18} y={p5y(2) + 7} color={DIM}>
          50%
        </ChartText>

        <path d={SOLAR_AREA} fill="url(#hc-solar)" style={fade(0.2)} />
        <path
          d={SOLAR_PATH}
          pathLength={1}
          style={{
            fill: 'none',
            stroke: 'var(--osd-accent)',
            strokeWidth: 3,
            strokeDasharray: 1,
            filter: `drop-shadow(0 0 8px ${em(55)})`,
            ...draw(0.1),
          }}
        />
        <path
          d={GRID_AREA}
          style={{ fill: 'rgba(140,143,150,0.42)', stroke: MUTED, strokeWidth: 1.2, ...fade(1.4) }}
        />
        <path
          d={SOC_PATH}
          style={{
            fill: 'none',
            stroke: MUTED,
            strokeWidth: 2.5,
            strokeDasharray: '9 9',
            ...fade(0.9),
          }}
        />
        <path
          d={HOME_PATH}
          pathLength={1}
          style={{
            fill: 'none',
            stroke: 'var(--osd-text)',
            strokeWidth: 3,
            strokeDasharray: 1,
            ...draw(0.5),
          }}
        />

        <line
          x1={P5.x0}
          x2={P5.x1}
          y1={P5.base}
          y2={P5.base}
          style={{ stroke: 'rgba(255,255,255,0.22)' }}
        />

        <g style={fade(1.6)}>
          <LegendKey x={P5.x0} y={p5y(4.5) - 22} label="Solar" kind="solar" />
          <LegendKey x={P5.x0 + 128} y={p5y(4.5) - 22} label="Home" kind="home" />
          <LegendKey x={P5.x0 + 262} y={p5y(4.5) - 22} label="Battery" kind="battery" />
          <LegendKey x={P5.x0 + 412} y={p5y(4.5) - 22} label="Grid" kind="grid" />
          <Bracket t0={9} t1={15} y={p5y(4.5)} label="Charges from solar 9:00–15:00" />
          <Bracket t0={17} t1={21} y={p5y(4.5)} label="Runs the house through the evening peak" />
        </g>

        <AxisHour x={p5x(0)} y={P5.base + 42} label="00:00" />
        <AxisHour x={p5x(6)} y={P5.base + 42} label="06:00" />
        <AxisHour x={p5x(12)} y={P5.base + 42} label="12:00" />
        <AxisHour x={p5x(18)} y={P5.base + 42} label="18:00" />
        <AxisHour x={p5x(24)} y={P5.base + 42} label="24:00" />
      </svg>
    </Stage>
  );
};

const WAVE = { x0: 0, x1: 1680, mid: 80, amp: 52, cycle: 112, gap0: 896, gap1: 1008 };
const wavePath = (from: number, to: number) => {
  const pts: string[] = [];
  for (let x = from; x <= to; x += 4) {
    const y = WAVE.mid - Math.sin(((x - WAVE.x0) / WAVE.cycle) * Math.PI * 2) * WAVE.amp;
    pts.push(`${pts.length ? 'L' : 'M'}${x},${y.toFixed(1)}`);
  }
  return pts.join(' ');
};
const GRID_WAVE = wavePath(0, WAVE.gap0);
const CORE_WAVE = wavePath(WAVE.gap1, WAVE.x1);

const Switchover: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage>
      <div style={abs(120, 120, LABEL)}>Backup</div>
      <div
        style={{
          ...HEAD,
          ...GRADIENT_TEXT,
          ...abs(100, 150),
          fontSize: 380,
          letterSpacing: '-0.06em',
          lineHeight: 0.9,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: DIM, fontWeight: 400 }}>{'<'}</span>
        20
        <span style={{ fontSize: 168, letterSpacing: '-0.04em', marginLeft: 30 }}>ms</span>
      </div>
      <p
        style={abs(122, 572, {
          margin: 0,
          fontSize: 48,
          fontWeight: 500,
          letterSpacing: '-0.025em',
          lineHeight: 1.2,
          color: 'var(--osd-text)',
        })}
      >
        The lights don't flicker.
        <span style={{ color: MUTED }}> The router stays up.</span>
      </p>
      <svg
        width={1680}
        height={200}
        viewBox="0 0 1680 200"
        style={abs(120, 740, { overflow: 'visible' })}
        role="img"
        aria-label="Grid waveform drops out and Core takes over within one cycle"
      >
        <path
          d={GRID_WAVE}
          style={{ fill: 'none', stroke: 'rgba(140,143,150,0.75)', strokeWidth: 2.5 }}
        />
        <line
          x1={WAVE.gap0}
          x2={WAVE.gap1}
          y1={WAVE.mid}
          y2={WAVE.mid}
          style={{ stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1.5, strokeDasharray: '3 6' }}
        />
        <path
          d={CORE_WAVE}
          style={{
            fill: 'none',
            stroke: 'var(--osd-accent)',
            strokeWidth: 3,
            filter: `drop-shadow(0 0 10px ${em(60)})`,
            animation: live ? 'hc-fade 0.6s ease-out 0.5s both' : undefined,
          }}
        />
        <path
          d={`M${WAVE.gap0},${WAVE.mid - 78} L${WAVE.gap0},${WAVE.mid - 90} L${WAVE.gap1},${WAVE.mid - 90} L${WAVE.gap1},${WAVE.mid - 78}`}
          style={{ fill: 'none', stroke: 'rgba(244,243,239,0.6)', strokeWidth: 1.2 }}
        />
        <ChartText
          x={(WAVE.gap0 + WAVE.gap1) / 2}
          y={WAVE.mid - 106}
          anchor="middle"
          color="var(--osd-text)"
          size={22}
          weight={500}
        >
          {'< 20 ms'}
        </ChartText>
        <ChartText x={0} y={WAVE.mid + 104} color={MUTED} size={22}>
          Grid
        </ChartText>
        <ChartText x={WAVE.gap0} y={WAVE.mid + 104} anchor="middle" color={MUTED} size={22}>
          Outage
        </ChartText>
        <ChartText
          x={WAVE.x1}
          y={WAVE.mid + 104}
          anchor="end"
          color="var(--osd-accent)"
          size={22}
          weight={500}
        >
          Core
        </ChartText>
      </svg>
    </Stage>
  );
};

const FlowLine = ({
  d,
  color,
  live,
  idle = false,
}: {
  d: string;
  color: string;
  live: boolean;
  idle?: boolean;
}) => (
  <g>
    <path d={d} style={{ fill: 'none', stroke: 'rgba(255,255,255,0.09)', strokeWidth: 2 }} />
    {!idle && (
      <path
        d={d}
        style={{
          fill: 'none',
          stroke: color,
          strokeWidth: 2.6,
          strokeLinecap: 'round',
          strokeDasharray: '2 10',
          animation: live ? 'hc-flow 1.1s linear infinite' : undefined,
        }}
      />
    )}
  </g>
);

const FlowNode = ({
  cx,
  cy,
  children,
  ring = 'rgba(255,255,255,0.14)',
}: {
  cx: number;
  cy: number;
  children: ReactNode;
  ring?: string;
}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <circle r={27} style={{ fill: '#141518', stroke: ring, strokeWidth: 1.4 }} />
    <g
      style={{
        fill: 'none',
        stroke: '#E9E6E0',
        strokeWidth: 1.6,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      {children}
    </g>
  </g>
);

const NodeLabel = ({
  x,
  y,
  label,
  value,
  anchor = 'middle',
  accent = false,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  anchor?: 'start' | 'middle' | 'end';
  accent?: boolean;
}) => (
  <g>
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{
        fill: MUTED,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.08em',
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      {label}
    </text>
    <text
      x={x}
      y={y + 22}
      textAnchor={anchor}
      style={{
        fill: accent ? 'var(--osd-accent)' : '#F4F3EF',
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      {value}
    </text>
  </g>
);

const AppScreen = () => {
  const live = useIsActivePage();
  const hub = { x: 173, y: 168 };
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0B0C0E', color: '#F4F3EF' }}>
      <div style={abs(42, 16, { fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' })}>
        9:41
      </div>
      <div style={abs(282, 20, { display: 'flex', alignItems: 'flex-end', gap: 2 })}>
        <div style={{ width: 3, height: 4, borderRadius: 1, background: '#F4F3EF' }} />
        <div style={{ width: 3, height: 6, borderRadius: 1, background: '#F4F3EF' }} />
        <div style={{ width: 3, height: 8, borderRadius: 1, background: '#F4F3EF' }} />
        <div style={{ width: 3, height: 10, borderRadius: 1, background: '#F4F3EF' }} />
      </div>
      <div
        style={abs(310, 19, {
          width: 25,
          height: 12,
          borderRadius: 4,
          border: '1.2px solid rgba(244,243,239,0.45)',
          padding: 1.5,
          boxSizing: 'border-box',
        })}
      >
        <div style={{ width: '82%', height: '100%', borderRadius: 2, background: '#F4F3EF' }} />
      </div>
      <div
        style={abs(337, 23, {
          width: 2,
          height: 4,
          borderRadius: 1,
          background: 'rgba(244,243,239,0.45)',
        })}
      />

      <div
        style={abs(22, 70, {
          fontSize: 13,
          fontWeight: 500,
          color: MUTED,
          letterSpacing: '0.06em',
        })}
      >
        HALDEN · OAK STREET
      </div>
      <div style={abs(22, 90, { fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em' })}>
        Energy
      </div>
      <div
        style={abs(270, 100, {
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 11px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          fontSize: 13,
          fontWeight: 500,
        })}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: 'var(--osd-accent)',
            boxShadow: `0 0 8px ${em(80)}`,
            animation: live ? 'hc-dot 2.4s ease-in-out infinite' : undefined,
          }}
        />
        Live
      </div>

      <svg
        width={346}
        height={350}
        viewBox="0 0 346 350"
        style={abs(22, 150, { overflow: 'visible' })}
      >
        <FlowLine
          d={`M${hub.x},68 L${hub.x},${hub.y - 18}`}
          color="var(--osd-accent)"
          live={live}
        />
        <FlowLine d={`M${hub.x + 18},${hub.y} L278,${hub.y}`} color="#F4F3EF" live={live} />
        <FlowLine
          d={`M${hub.x},${hub.y + 18} L${hub.x},268`}
          color="var(--osd-accent)"
          live={live}
        />
        <FlowLine d={`M68,${hub.y} L${hub.x - 18},${hub.y}`} color={MUTED} live={live} idle />
        <circle
          cx={hub.x}
          cy={hub.y}
          r={18}
          style={{ fill: '#141518', stroke: 'var(--osd-accent)', strokeWidth: 1.6 }}
        />
        <rect
          x={hub.x - 4}
          y={hub.y - 10}
          width={8}
          height={20}
          rx={2}
          style={{ fill: 'none', stroke: '#E9E6E0', strokeWidth: 1.4 }}
        />
        <line
          x1={hub.x + 2}
          x2={hub.x + 2}
          y1={hub.y - 6}
          y2={hub.y + 6}
          style={{ stroke: 'var(--osd-accent)', strokeWidth: 1.4 }}
        />

        <FlowNode cx={hub.x} cy={40} ring={em(55)}>
          <circle r={6} />
          <path d="M0,-12 L0,-9.5 M0,12 L0,9.5 M-12,0 L-9.5,0 M12,0 L9.5,0 M-8.5,-8.5 L-6.7,-6.7 M8.5,8.5 L6.7,6.7 M-8.5,8.5 L-6.7,6.7 M8.5,-8.5 L6.7,-6.7" />
        </FlowNode>
        <FlowNode cx={306} cy={hub.y}>
          <path d="M-10,-1 L0,-10 L10,-1 M-7,-3 L-7,9 L7,9 L7,-3" />
          <path d="M-2,9 L-2,3 L2,3 L2,9" />
        </FlowNode>
        <FlowNode cx={hub.x} cy={296} ring={em(55)}>
          <rect x={-6} y={-11} width={12} height={22} rx={2.5} />
          <path d="M-2.5,-13.5 L2.5,-13.5" />
          <rect
            x={-3}
            y={-2}
            width={6}
            height={10}
            rx={1}
            style={{ fill: 'var(--osd-accent)', stroke: 'none' }}
          />
        </FlowNode>
        <FlowNode cx={40} cy={hub.y}>
          <path d="M-6,11 L0,-11 L6,11 M-3.8,3 L3.8,3 M-2.4,-3 L2.4,-3 M-9,-6 L9,-6" />
        </FlowNode>

        <NodeLabel x={hub.x + 42} y={36} label="SOLAR" value="4.2 kW" anchor="start" />
        <NodeLabel x={306} y={hub.y + 50} label="HOME" value="1.8 kW" />
        <NodeLabel x={hub.x + 42} y={292} label="BATTERY" value="+2.4 kW" anchor="start" accent />
        <NodeLabel x={40} y={hub.y + 50} label="GRID" value="0.0 kW" />
      </svg>

      <div
        style={abs(16, 520, {
          width: 358,
          height: 132,
          borderRadius: 24,
          background: '#141518',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
        })}
      >
        <div
          style={abs(20, 18, {
            fontSize: 13,
            fontWeight: 500,
            color: MUTED,
            letterSpacing: '0.06em',
          })}
        >
          CORE
        </div>
        <div
          style={abs(250, 18, {
            width: 88,
            textAlign: 'right',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--osd-accent)',
          })}
        >
          Charging
        </div>
        <div style={abs(18, 38, { fontSize: 44, fontWeight: 600, letterSpacing: '-0.04em' })}>
          76<span style={{ fontSize: 24, color: MUTED, marginLeft: 2 }}>%</span>
        </div>
        <div
          style={abs(20, 98, {
            width: 318,
            height: 6,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.08)',
          })}
        >
          <div
            style={{
              width: '76%',
              height: '100%',
              borderRadius: 3,
              background: `linear-gradient(90deg, ${DEEP}, var(--osd-accent))`,
              boxShadow: `0 0 10px ${em(50)}`,
            }}
          />
        </div>
        <div
          style={abs(200, 58, {
            width: 138,
            textAlign: 'right',
            fontSize: 13,
            color: MUTED,
            lineHeight: 1.35,
          })}
        >
          10.8 of 14.2 kWh
          <br />
          Full by 11:10 am
        </div>
      </div>

      <div
        style={abs(16, 664, {
          width: 358,
          height: 70,
          borderRadius: 22,
          background: '#141518',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
        })}
      >
        <div style={abs(20, 15, { fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' })}>
          Storm Watch
        </div>
        <div style={abs(20, 38, { fontSize: 13, color: MUTED })}>
          Charges to full before severe weather
        </div>
        <div
          style={abs(292, 21, {
            width: 48,
            height: 28,
            borderRadius: 999,
            background: 'var(--osd-accent)',
          })}
        >
          <div
            style={abs(22, 2, {
              width: 24,
              height: 24,
              borderRadius: 999,
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            })}
          />
        </div>
      </div>

      <div
        style={abs(0, 754, {
          width: 390,
          height: 84,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(11,12,14,0.96)',
          display: 'flex',
          justifyContent: 'space-around',
          paddingTop: 12,
          boxSizing: 'border-box',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.02em',
        })}
      >
        <TabItem label="Energy" active />
        <TabItem label="Backup" />
        <TabItem label="History" />
        <TabItem label="Settings" />
      </div>
      <div
        style={abs(128, 824, {
          width: 134,
          height: 5,
          borderRadius: 3,
          background: 'rgba(244,243,239,0.85)',
        })}
      />
    </div>
  );
};

const TabItem = ({ label, active = false }: { label: string; active?: boolean }) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 70 }}
  >
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        border: `1.6px solid ${active ? 'var(--osd-accent)' : 'rgba(244,243,239,0.35)'}`,
        boxSizing: 'border-box',
      }}
    />
    <span style={{ color: active ? 'var(--osd-accent)' : 'rgba(244,243,239,0.45)' }}>{label}</span>
  </div>
);

const Phone = ({ x, y }: { x: number; y: number }) => (
  <div style={abs(x, y, { width: 420, height: 868 })}>
    <div
      style={{
        position: 'absolute',
        left: 60,
        top: 120,
        width: 300,
        height: 700,
        borderRadius: 120,
        background: em(40),
        filter: 'blur(110px)',
        opacity: 0.45,
      }}
    />
    <div
      style={abs(-3, 196, {
        width: 5,
        height: 34,
        borderRadius: 2,
        background: 'linear-gradient(90deg, #2A2927, #5B5753)',
      })}
    />
    <div
      style={abs(-3, 262, {
        width: 5,
        height: 66,
        borderRadius: 2,
        background: 'linear-gradient(90deg, #2A2927, #5B5753)',
      })}
    />
    <div
      style={abs(-3, 344, {
        width: 5,
        height: 66,
        borderRadius: 2,
        background: 'linear-gradient(90deg, #2A2927, #5B5753)',
      })}
    />
    <div
      style={abs(418, 290, {
        width: 5,
        height: 104,
        borderRadius: 2,
        background: 'linear-gradient(90deg, #5B5753, #2A2927)',
      })}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 68,
        background:
          'linear-gradient(140deg, #8E8780 0%, #3D3A37 14%, #232120 40%, #2F2C29 70%, #6A5446 100%)',
        boxShadow: '0 50px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.8)',
      }}
    />
    <div style={{ position: 'absolute', inset: 4, borderRadius: 64, background: '#030303' }} />
    <div style={{ position: 'absolute', inset: 15, borderRadius: 54, overflow: 'hidden' }}>
      <AppScreen />
      <div style={abs(134, 11, { width: 122, height: 35, borderRadius: 20, background: '#000' })} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 54,
          background: 'linear-gradient(125deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 32%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  </div>
);

const Feature = ({ title, body }: { title: string; body: string }) => (
  <div style={{ padding: '30px 0', borderTop: `1px solid ${HAIRLINE}` }}>
    <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
      {title}
    </div>
    <div
      style={{
        marginTop: 10,
        fontSize: 28,
        color: MUTED,
        letterSpacing: '-0.005em',
        lineHeight: 1.4,
      }}
    >
      {body}
    </div>
  </div>
);

const App: Page = () => (
  <Stage>
    <Phone x={270} y={96} />
    <div style={abs(900, 196, { width: 860 })}>
      <div style={LABEL}>The Halden app</div>
      <h2 style={{ ...HEAD, fontSize: 96, marginTop: 28 }}>
        Every watt,
        <br />
        <span style={{ color: MUTED }}>accounted for.</span>
      </h2>
      <div style={{ marginTop: 64, borderBottom: `1px solid ${HAIRLINE}` }}>
        <Feature title="Storm Watch" body="Charges to full before severe weather arrives." />
        <Feature
          title="Tariff-aware scheduling"
          body="Stores cheap energy. Spends it when prices peak."
        />
        <Feature
          title="Per-circuit backup priorities"
          body="You choose what stays on in an outage."
        />
      </div>
    </div>
  </Stage>
);

const UNIT_S = 0.34;
const UNIT_W = 300 * UNIT_S;
const UNIT_GAP = 14;
const GROUP_GAP = 116;
const FLOOR_Y = 742;
const groupWidth = (n: number) => n * UNIT_W + (n - 1) * UNIT_GAP;
const groupX = (n: number) => {
  const total = groupWidth(1) + groupWidth(2) + groupWidth(3) + groupWidth(4) + 3 * GROUP_GAP;
  let x = (1920 - total) / 2;
  for (let i = 1; i < n; i++) x += groupWidth(i) + GROUP_GAP;
  return x;
};

const UnitGroup = ({ count, kwh, caption }: { count: number; kwh: string; caption: string }) => {
  const x = groupX(count);
  const w = groupWidth(count);
  const y = FLOOR_Y - 720 * UNIT_S;
  return (
    <>
      {count >= 1 && <CoreUnit x={x} y={y} scale={UNIT_S} charge={0.76} wash={0.32} />}
      {count >= 2 && (
        <CoreUnit x={x + (UNIT_W + UNIT_GAP)} y={y} scale={UNIT_S} charge={0.76} wash={0.32} />
      )}
      {count >= 3 && (
        <CoreUnit x={x + 2 * (UNIT_W + UNIT_GAP)} y={y} scale={UNIT_S} charge={0.76} wash={0.32} />
      )}
      {count >= 4 && (
        <CoreUnit x={x + 3 * (UNIT_W + UNIT_GAP)} y={y} scale={UNIT_S} charge={0.76} wash={0.32} />
      )}
      <div
        style={abs(x + w / 2 - 160, FLOOR_Y + 92, { width: 320, textAlign: 'center', zIndex: 3 })}
      >
        <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1 }}>
          {kwh}
          <span
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: MUTED,
              marginLeft: 8,
              letterSpacing: '-0.01em',
            }}
          >
            kWh
          </span>
        </div>
        <div style={{ ...LABEL, fontSize: 18, marginTop: 16 }}>{caption}</div>
      </div>
    </>
  );
};

const Modular: Page = () => (
  <Stage>
    <div style={abs(120, 120, LABEL)}>Expandable</div>
    <h2 style={{ ...HEAD, ...abs(120, 168), fontSize: 104 }}>
      Starts at one. <span style={{ color: MUTED }}>Grows to four.</span>
    </h2>
    <p style={abs(122, 300, { margin: 0, fontSize: 32, color: MUTED, letterSpacing: '-0.01em' })}>
      Add a unit whenever your home needs more. Up to 56.8 kWh on one wall.
    </p>
    <div
      style={abs(120, FLOOR_Y, {
        width: 1680,
        height: 1,
        background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 12%, rgba(255,255,255,0.22) 88%, rgba(255,255,255,0) 100%)`,
        zIndex: 1,
      })}
    />
    <UnitGroup count={1} kwh="14.2" caption="One unit" />
    <UnitGroup count={2} kwh="28.4" caption="Two units" />
    <UnitGroup count={3} kwh="42.6" caption="Three units" />
    <UnitGroup count={4} kwh="56.8" caption="Four units" />
  </Stage>
);

const CompareBar = ({
  label,
  value,
  pct,
  core = false,
}: {
  label: string;
  value: string;
  pct: number;
  core?: boolean;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '56px 1fr',
      alignItems: 'center',
      columnGap: 14,
    }}
  >
    <div style={{ fontSize: 20, fontWeight: 500, color: core ? 'var(--osd-text)' : MUTED }}>
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 150 * pct,
          height: 8,
          borderRadius: 4,
          background: core ? 'linear-gradient(90deg, #CFCBC4, var(--osd-text))' : DIM,
        }}
      />
      <div
        style={{
          fontSize: 20,
          color: core ? 'var(--osd-text)' : MUTED,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

const CompareColumn = ({
  big,
  caption,
  children,
  first = false,
}: {
  big: string;
  caption: string;
  children: ReactNode;
  first?: boolean;
}) => (
  <div
    style={{
      flex: 1,
      padding: first ? '0 40px 0 0' : '0 40px',
      borderLeft: first ? 'none' : `1px solid ${HAIRLINE}`,
    }}
  >
    <div style={{ ...HEAD, ...GRADIENT_TEXT, fontSize: 140, letterSpacing: '-0.05em' }}>{big}</div>
    <div
      style={{ marginTop: 18, fontSize: 30, color: 'var(--osd-text)', letterSpacing: '-0.01em' }}
    >
      {caption}
    </div>
    <div style={{ marginTop: 72, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {children}
    </div>
  </div>
);

const Generations: Page = () => (
  <Stage>
    <div style={abs(120, 120, LABEL)}>Core versus Halden H1</div>
    <h2 style={{ ...HEAD, ...abs(120, 168), fontSize: 104 }}>
      More inside. <span style={{ color: MUTED }}>Less on the wall.</span>
    </h2>
    <div style={abs(120, 460, { width: 1680, display: 'flex' })}>
      <CompareColumn big="+38%" caption="more capacity" first>
        <CompareBar label="Core" value="14.2 kWh" pct={1} core />
        <CompareBar label="H1" value="10.3 kWh" pct={10.3 / 14.2} />
      </CompareColumn>
      <CompareColumn big="−32%" caption="less depth">
        <CompareBar label="Core" value="14 cm" pct={14 / 20.5} core />
        <CompareBar label="H1" value="20.5 cm" pct={1} />
      </CompareColumn>
      <CompareColumn big="92%" caption="round-trip efficiency">
        <CompareBar label="Core" value="92%" pct={0.92} core />
        <CompareBar label="H1" value="89%" pct={0.89} />
      </CompareColumn>
      <CompareColumn big="15" caption="year warranty">
        <CompareBar label="Core" value="15 years" pct={1} core />
        <CompareBar label="H1" value="10 years" pct={10 / 15} />
      </CompareColumn>
    </div>
  </Stage>
);

const SpecRow = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      height: 76,
      paddingTop: 22,
      boxSizing: 'border-box',
      borderTop: `1px solid ${HAIRLINE}`,
    }}
  >
    <div style={{ fontSize: 26, color: MUTED, letterSpacing: '-0.005em' }}>{label}</div>
    <div
      style={{
        fontSize: 30,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
      {note && (
        <span style={{ color: MUTED, fontWeight: 400, marginLeft: 10, fontSize: 24 }}>{note}</span>
      )}
    </div>
  </div>
);

const Specs: Page = () => (
  <Stage>
    <div style={abs(120, 120, LABEL)}>Tech specs</div>
    <h2 style={{ ...HEAD, ...abs(120, 168), fontSize: 96 }}>Halden Core</h2>
    <div style={abs(120, 330, { width: 790 })}>
      <div style={{ ...LABEL, fontSize: 18, color: DIM, marginBottom: 18 }}>Electrical</div>
      <SpecRow label="Capacity" value="14.2 kWh" />
      <SpecRow label="Continuous power" value="10 kW" />
      <SpecRow label="Peak power" value="18 kW" note="10 s" />
      <SpecRow label="Round-trip efficiency" value="92%" />
      <SpecRow label="Backup switchover" value="< 20 ms" />
      <SpecRow label="Chemistry" value="LFP" note="lithium iron phosphate" />
      <SpecRow label="Expandable" value="Up to 4 units" note="56.8 kWh" />
      <div style={{ borderTop: `1px solid ${HAIRLINE}` }} />
    </div>
    <div style={abs(1010, 330, { width: 790 })}>
      <div style={{ ...LABEL, fontSize: 18, color: DIM, marginBottom: 18 }}>Physical</div>
      <SpecRow label="Dimensions" value="168 × 70 × 14 cm" />
      <SpecRow label="Weight" value="96 kg" />
      <SpecRow label="Ingress protection" value="IP67" />
      <SpecRow label="Operating temperature" value="−20 °C to 50 °C" />
      <SpecRow label="Warranty" value="15 years" note="8,000 cycles" />
      <SpecRow label="Installation" value="One day" />
      <SpecRow label="Backup gateway" value="Optional" note="whole-home" />
      <div style={{ borderTop: `1px solid ${HAIRLINE}` }} />
    </div>
  </Stage>
);

const Gateway = ({ x, y }: { x: number; y: number }) => (
  <div
    style={abs(x, y, {
      width: 64,
      height: 82,
      borderRadius: 9,
      background: 'linear-gradient(162deg, #8E8780 0%, #3C3936 22%, #252321 60%, #2E2A26 100%)',
      boxShadow: '0 0 0 0.6px rgba(0,0,0,0.7), 0 12px 24px rgba(0,0,0,0.5)',
    })}
  >
    <div
      style={{
        position: 'absolute',
        inset: 1.5,
        borderRadius: 7.5,
        background: 'linear-gradient(180deg, #34322F 0%, #24221F 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,244,234,0.14)',
      }}
    />
    <div
      style={abs(29, 14, {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: 'var(--osd-accent)',
        boxShadow: `0 0 8px ${em(90)}`,
      })}
    />
  </div>
);

const PriceColumn = ({
  name,
  config,
  price,
  body,
  children,
  first = false,
}: {
  name: string;
  config: string;
  price: string;
  body: string;
  children: ReactNode;
  first?: boolean;
}) => (
  <div
    style={{
      width: 560,
      height: 560,
      position: 'relative',
      padding: first ? '0 48px 0 0' : '0 48px',
      boxSizing: 'border-box',
      borderLeft: first ? 'none' : `1px solid ${HAIRLINE}`,
    }}
  >
    <div style={{ position: 'relative', height: 176 }}>{children}</div>
    <div style={{ marginTop: 40, fontSize: 40, fontWeight: 600, letterSpacing: '-0.03em' }}>
      {name}
    </div>
    <div style={{ marginTop: 8, fontSize: 24, color: MUTED }}>{config}</div>
    <div
      style={{
        ...HEAD,
        marginTop: 36,
        fontSize: 104,
        letterSpacing: '-0.05em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {price}
    </div>
    <div style={{ marginTop: 26, fontSize: 26, lineHeight: 1.4, color: '#B4B2AC', width: 460 }}>
      {body}
    </div>
  </div>
);

const Pricing: Page = () => (
  <Stage>
    <div style={abs(120, 120, LABEL)}>Pricing</div>
    <h2 style={{ ...HEAD, ...abs(120, 168), fontSize: 96 }}>Choose your Core.</h2>
    <div style={abs(120, 336, { width: 1680 })}>
      <div style={{ display: 'flex' }}>
        <Steps>
          <Step duration={420}>
            <PriceColumn
              name="Core"
              config="One unit · 14.2 kWh"
              price="$8,900"
              body="Your solar, saved for the evening."
              first
            >
              <CoreUnit x={0} y={0} scale={0.24} charge={0.76} wash={0.3} floor={false} />
            </PriceColumn>
          </Step>
          <Step duration={420}>
            <PriceColumn
              name="Core Duo"
              config="Two units · 28.4 kWh"
              price="$16,400"
              body="Twice the storage, for larger homes."
            >
              <CoreUnit x={0} y={0} scale={0.24} charge={0.76} wash={0.3} floor={false} />
              <CoreUnit x={72 + 12} y={0} scale={0.24} charge={0.76} wash={0.3} floor={false} />
            </PriceColumn>
          </Step>
          <Step duration={420}>
            <PriceColumn
              name="Core + Gateway"
              config="One unit · whole-home backup"
              price="$10,600"
              body="Every circuit stays on in an outage."
            >
              <CoreUnit x={0} y={0} scale={0.24} charge={0.76} wash={0.3} floor={false} />
              <Gateway x={72 + 22} y={91} />
            </PriceColumn>
          </Step>
        </Steps>
      </div>
    </div>
    <div style={abs(120, 942, { fontSize: 20, color: DIM, letterSpacing: '0.01em' })}>
      Prices in USD. Eligible incentives vary by region.
    </div>
  </Stage>
);

const Close: Page = () => {
  const live = useIsActivePage();
  const rise = (delay: number): CSSProperties =>
    live ? { animation: `hc-rise 1s ${EASE_OUT} ${delay}s both` } : {};
  return (
    <Stage footer={false}>
      <CoreUnit x={1250} y={168} scale={1} charge={1} wash={1.2} intro />
      <div style={abs(120, 120, { ...LABEL, color: '#B4B2AC' })}>Halden Core</div>
      <div style={abs(120, 360, { width: 1060 })}>
        <h2 style={{ ...HEAD, ...GRADIENT_TEXT, fontSize: 150, ...rise(0.1) }}>
          Reservations
          <br />
          open today.
        </h2>
        <p
          style={{
            margin: '48px 0 0',
            fontSize: 34,
            color: '#C9C6C0',
            letterSpacing: '-0.01em',
            ...rise(0.3),
          }}
        >
          Deliveries from December 2026
          <span style={{ color: DIM }}> · </span>
          United States and Australia
        </p>
      </div>
      <div
        style={abs(120, 1002, {
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: '#B4B2AC',
          zIndex: 3,
        })}
      >
        Halden
      </div>
    </Stage>
  );
};

Cover.transition = settle;
Reveal.transition = morphTransition;
Thin.transition = morphTransition;

export const meta: SlideMeta = {
  title: 'Halden Core — Launch keynote',
  createdAt: '2026-10-11T10:39:42.737Z',
};

export const notes: (string | undefined)[] = [
  `Walk on in the dark. Let the light bar finish filling before you speak.
"Good morning. For ten years Halden has built one thing: energy you keep at home."
Pause. "Today we're showing you the most important thing we've made."
Click.`,
  `"Here's the problem with the grid. This is what a day of electricity costs."
Trace the line with your hand: flat and cheap overnight, a bump in the morning, then the peak.
"Between five and nine in the evening, the same kilowatt-hour costs three times as much. That's exactly when you get home, cook, and turn everything on."
Beat. "Electricity is cheapest when you don't need it." Click.`,
  `Say nothing for two seconds. Let the room see it.
"Meet Core."
"Fourteen point two kilowatt-hours. Ten kilowatts continuous. And it's fourteen centimetres deep."
Click on the word "deep".`,
  `The product glides left into the drawing. Wait for it to land.
"Fourteen centimetres. H1 was twenty and a half. That's a third thinner."
Point to the dashed outline. "That ghost is the battery you might already own. Core gives you thirty-eight percent more energy in less space."
"It fits in a hallway. It fits beside the car." Click.`,
  `"Let's spend a day with Core."
Start left: "Overnight, Core runs the house. Around seven the grid tops it up for an hour or so. That grey sliver is the only grid power you buy."
Middle: "From nine to three, the sun charges Core while it runs the house."
Right: "Then the evening peak, when power is most expensive. Core carries the whole house through it."
Land the number: "Ninety-four percent of the day, off the grid." Click.`,
  `"And when the grid goes down?"
Pause.
"Core takes over in under twenty milliseconds. Faster than a single cycle of the power line."
"The lights don't flicker. The router stays up. Your video call doesn't drop." Click.`,
  `"All of it lives in the Halden app."
"Live energy flow, to the watt. Right now: four point two kilowatts from the roof, one point eight into the house, two point four into Core."
Then the three features, one breath each: Storm Watch, tariff-aware scheduling, per-circuit priorities.
"You set it once. Core makes the decisions every hour after that." Click.`,
  `"Core is modular."
Move left to right across the row: "One unit, fourteen point two. Two, twenty-eight point four. Three. Four units, fifty-six point eight kilowatt-hours."
"Start with what you need today. Add a unit when your home changes." Click.`,
  `"For those of you with an H1 on the wall, here's what's changed."
Read the four numbers, slowly: "Thirty-eight percent more capacity. Thirty-two percent thinner. Ninety-two percent round-trip efficiency, up from eighty-nine. And a fifteen-year warranty, up from ten." Click.`,
  `Don't read this page. "Here's everything, for the spec sheet people."
Call out two lines only: "IP67, so it lives outside. And it installs in one day."
Click.`,
  `"Three ways to bring Core home."
Click: "Core, eight thousand nine hundred dollars."
Click: "Core Duo, two units, sixteen thousand four hundred."
Click: "Core with Gateway, for whole-home backup, ten thousand six hundred."
Mention the footnote: "Incentives vary by region, and our team will walk you through yours." Click.`,
  `Let the light bar fill to full.
"Halden Core. Reservations open today."
"Deliveries begin in December, in the United States and Australia."
"Thank you." Hold on this page for questions.`,
];

export default [
  Cover,
  Problem,
  Reveal,
  Thin,
  Day,
  Switchover,
  App,
  Modular,
  Generations,
  Specs,
  Pricing,
  Close,
] satisfies Page[];

import {
  type DesignSystem,
  type Page,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#4B1DFF', text: '#FFFFFF', accent: '#D8FF2E' },
  fonts: {
    display: '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif',
    body: '"Barlow", system-ui, sans-serif',
  },
  typeScale: { hero: 620, body: 30 },
  radius: 0,
};

const INK = '#0B0A14';
const CORAL = '#FF4A3D';
const DEEP = '#2A0FA3';
const LAV = '#D3CAFF';
const WHITE_A = (a: number) => `rgba(255,255,255,${a})`;

const THEME_ID = 'theme-aero';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;1,700;1,800;1,900&family=Barlow:wght@400;500;600;700&display=swap';
const FONT_LINK_ID = `osd-webfont-${THEME_ID}`;
const STYLE_ID = `osd-styles-${THEME_ID}`;
const KEYFRAMES = `
@keyframes ae-run { from { transform: translateX(0) } to { transform: translateX(calc(var(--tile) * -1)) } }
@keyframes ae-in { from { opacity: 0; transform: translateX(-56px) } to { opacity: 1; transform: none } }
@keyframes ae-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ae-pace { to { stroke-dashoffset: -1000 } }
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

const ANGLE = 12;
const T = Math.tan((ANGLE * Math.PI) / 180);
const SKEW = `skewX(-${ANGLE}deg)`;

const cut = (h: number) => {
  const d = (h * T).toFixed(2);
  return `polygon(${d}px 0, 100% 0, calc(100% - ${d}px) 100%, 0 100%)`;
};

const BAND_RATIO = 12;
const BAND_PCT = ((T / BAND_RATIO) * 100).toFixed(4);
const BAND_CLIP = `polygon(${BAND_PCT}% 0, 100% 0, ${(100 - Number(BAND_PCT)).toFixed(4)}% 100%, 0 100%)`;

const SNAP = 'cubic-bezier(0.16, 1, 0.3, 1)';

type Tone = 'uv' | 'volt' | 'ink';

const TONES: Record<Tone, { bg: string; fg: string; dim: string; hi: string; hiFg: string }> = {
  uv: { bg: 'var(--osd-bg)', fg: 'var(--osd-text)', dim: LAV, hi: 'var(--osd-accent)', hiFg: INK },
  volt: {
    bg: 'var(--osd-accent)',
    fg: INK,
    dim: 'rgba(11,10,20,0.66)',
    hi: INK,
    hiFg: 'var(--osd-accent)',
  },
  ink: {
    bg: INK,
    fg: 'var(--osd-text)',
    dim: 'rgba(255,255,255,0.6)',
    hi: 'var(--osd-accent)',
    hiFg: INK,
  },
};

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontStyle: 'italic',
  fontWeight: 900,
  textTransform: 'uppercase',
  lineHeight: 0.84,
  letterSpacing: '-0.012em',
  margin: 0,
};

const NUM: CSSProperties = {
  ...DISPLAY,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.015em',
};

const LABEL: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const BODY: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 30,
  fontWeight: 500,
  lineHeight: 1.4,
  margin: 0,
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const pad = (n: number) => String(n).padStart(2, '0');

const Title = ({
  children,
  size = 132,
  x = 116,
  y = 160,
  style,
}: {
  children: ReactNode;
  size?: number;
  x?: number;
  y?: number;
  style?: CSSProperties;
}) => <h2 style={{ ...DISPLAY, ...abs(x, y), fontSize: size, ...style }}>{children}</h2>;

const Footer = ({
  tone,
  brand = 'Tempo',
  title = 'Season plan',
  meta = '2027 · Confidential',
}: {
  tone: Tone;
  brand?: string;
  title?: string;
  meta?: string;
}) => {
  const { current, total } = useSlidePageNumber();
  const t = TONES[tone];
  return (
    <div
      style={{
        ...LABEL,
        position: 'absolute',
        left: 120,
        right: 120,
        top: 1004,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        fontSize: 17,
        color: t.dim,
        zIndex: 5,
      }}
    >
      <span
        style={{
          ...NUM,
          width: 64,
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: t.hi,
          color: t.hiFg,
          clipPath: cut(32),
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: 0,
        }}
      >
        {pad(current)}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums', marginLeft: -8 }}>/ {pad(total)}</span>
      <span style={{ color: t.fg, marginLeft: 14 }}>{brand}</span>
      <span>{title}</span>
      <span style={{ marginLeft: 'auto' }}>{meta}</span>
    </div>
  );
};

const Stage = ({
  tone = 'uv',
  footer = true,
  children,
}: {
  tone?: Tone;
  footer?: boolean;
  children: ReactNode;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: TONES[tone].bg,
      color: TONES[tone].fg,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    {footer && <Footer tone={tone} />}
  </div>
);

const Kicker = ({
  tag,
  children,
  tone = 'uv',
  x = 120,
  y = 104,
}: {
  tag: string;
  children: ReactNode;
  tone?: Tone;
  x?: number;
  y?: number;
}) => {
  const t = TONES[tone];
  return (
    <div
      style={abs(x, y, { ...LABEL, display: 'flex', alignItems: 'center', gap: 18, color: t.fg })}
    >
      <span
        style={{
          ...LABEL,
          height: 32,
          padding: '0 18px',
          display: 'inline-flex',
          alignItems: 'center',
          background: t.hi,
          color: t.hiFg,
          clipPath: cut(32),
          fontWeight: 700,
          fontSize: 17,
        }}
      >
        {tag}
      </span>
      {children}
    </div>
  );
};

const Mark = ({ color, h = 34 }: { color: string; h?: number }) => (
  <div style={{ display: 'flex', gap: h * 0.16 }}>
    <div style={{ width: h * 0.3, height: h, background: color, transform: SKEW }} />
    <div style={{ width: h * 0.3, height: h, background: color, transform: SKEW, opacity: 0.7 }} />
    <div style={{ width: h * 0.3, height: h, background: color, transform: SKEW, opacity: 0.4 }} />
  </div>
);

const Wordmark = ({
  x,
  y,
  brand = 'Tempo',
  color = 'var(--osd-text)',
  mark = 'var(--osd-accent)',
}: {
  x: number;
  y: number;
  brand?: string;
  color?: string;
  mark?: string;
}) => (
  <div style={abs(x, y, { display: 'flex', alignItems: 'center', gap: 18, zIndex: 4 })}>
    <Mark color={mark} />
    <span style={{ ...DISPLAY, fontSize: 46, letterSpacing: '0.02em', color, lineHeight: 1 }}>
      {brand}
    </span>
  </div>
);

const Streak = ({
  y,
  h,
  tile,
  dash,
  color,
  dur,
  shift = 0,
  live,
}: {
  y: number;
  h: number;
  tile: number;
  dash: number;
  color: string;
  dur: number;
  shift?: number;
  live: boolean;
}) => (
  <div
    style={{
      position: 'absolute',
      left: -80,
      top: y,
      width: 2080,
      height: h,
      overflow: 'hidden',
      transform: SKEW,
    }}
  >
    <div
      style={
        {
          '--tile': `${tile}px`,
          width: 2080 + tile,
          height: h,
          backgroundImage: `linear-gradient(90deg, ${color} 0 ${dash}px, transparent ${dash}px)`,
          backgroundSize: `${tile}px ${h}px`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: `${shift}px 0`,
          animation: live ? `ae-run ${dur}s linear infinite` : undefined,
        } as CSSProperties
      }
    />
  </div>
);

const VoltBand = ({ x, y, w }: { x: number; y: number; w: number }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: w / BAND_RATIO,
      background: 'var(--osd-accent)',
      clipPath: BAND_CLIP,
    }}
  />
);

const CutBar = ({
  x,
  y,
  w,
  h,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: color,
      clipPath: cut(h),
    }}
  />
);

const SkewRule = ({
  x,
  y,
  h,
  w = 6,
  color = 'var(--osd-accent)',
}: {
  x: number;
  y: number;
  h: number;
  w?: number;
  color?: string;
}) => (
  <div
    style={abs(x, y, {
      width: w,
      height: h,
      background: color,
      transform: SKEW,
      transformOrigin: '0 100%',
    })}
  />
);

const Chip = ({
  children,
  bg = CORAL,
  fg = INK,
  h = 34,
}: {
  children: ReactNode;
  bg?: string;
  fg?: string;
  h?: number;
}) => (
  <span
    style={{
      ...LABEL,
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '0.14em',
      height: h,
      padding: '0 16px',
      display: 'inline-flex',
      alignItems: 'center',
      background: bg,
      color: fg,
      clipPath: cut(h),
    }}
  >
    {children}
  </span>
);

const SpecChip = ({ children }: { children: ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 22 }}>
    <span style={{ width: 4, height: 22, background: 'var(--osd-accent)', transform: SKEW }} />
    {children}
  </span>
);

const COVER_STREAKS = [
  { y: 152, h: 6, tile: 560, dash: 300, color: DEEP, dur: 2.6, shift: 0 },
  { y: 184, h: 2, tile: 380, dash: 140, color: WHITE_A(0.3), dur: 1.7, shift: -90 },
  { y: 236, h: 16, tile: 920, dash: 560, color: DEEP, dur: 3.4, shift: -300 },
  { y: 310, h: 3, tile: 460, dash: 180, color: WHITE_A(0.22), dur: 2.1, shift: -200 },
  { y: 372, h: 28, tile: 1180, dash: 720, color: DEEP, dur: 4.2, shift: -520 },
  { y: 462, h: 3, tile: 340, dash: 120, color: WHITE_A(0.3), dur: 1.5, shift: -40 },
  { y: 512, h: 10, tile: 760, dash: 380, color: DEEP, dur: 3, shift: -610 },
  { y: 590, h: 2, tile: 300, dash: 90, color: WHITE_A(0.36), dur: 1.3, shift: -150 },
  { y: 628, h: 20, tile: 980, dash: 520, color: DEEP, dur: 3.8, shift: -120 },
  { y: 880, h: 8, tile: 640, dash: 260, color: DEEP, dur: 2.4, shift: -330 },
  { y: 958, h: 14, tile: 840, dash: 420, color: DEEP, dur: 3.2, shift: -700 },
];

const Cover: Page = () => {
  const live = useIsActivePage();
  const enter = (delay: number): CSSProperties =>
    live ? { animation: `ae-in 0.8s ${SNAP} ${delay}s both` } : {};
  return (
    <Stage footer={false}>
      {COVER_STREAKS.map((s) => (
        <Streak key={s.y} {...s} live={live} />
      ))}

      <Wordmark x={120} y={92} />
      <div style={abs(1100, 104, { ...LABEL, width: 700, textAlign: 'right', color: LAV })}>
        Partners + leadership
      </div>

      <h1
        style={{
          ...DISPLAY,
          ...abs(96, 156),
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 0.8,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          ...enter(0.05),
        }}
      >
        Run <span style={{ color: 'var(--osd-accent)' }}>27</span>
      </h1>

      <VoltBand x={60} y={700} w={1800} />
      <div
        style={abs(196, 700, {
          height: 150,
          width: 1528,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: INK,
          ...enter(0.18),
        })}
      >
        <span style={{ ...DISPLAY, fontSize: 92, lineHeight: 1 }}>Season plan</span>
        <Mark color={INK} h={64} />
        <span style={{ ...NUM, fontSize: 92, lineHeight: 1 }}>Spring 2027</span>
      </div>

      <div
        style={abs(120, 920, {
          ...LABEL,
          fontSize: 22,
          display: 'flex',
          gap: 40,
          color: 'var(--osd-text)',
          fontVariantNumeric: 'tabular-nums',
        })}
      >
        <span>4 drops</span>
        <SpecChip>6 race cities</SpecChip>
        <SpecChip>38 markets</SpecChip>
        <SpecChip>1 line</SpecChip>
      </div>
      <div style={abs(1380, 896, { width: 420, textAlign: 'right' })}>
        <div style={{ ...LABEL, fontSize: 17, color: LAV }}>Kick-off</div>
        <div style={{ ...NUM, fontSize: 64, fontWeight: 800, marginTop: 6 }}>09·04·27</div>
      </div>
    </Stage>
  );
};

const Content: Page = () => (
  <Stage>
    <Kicker tag="Market">Where we stand</Kicker>
    <div style={abs(1300, 102, { width: 500, display: 'flex', justifyContent: 'flex-end' })}>
      <Chip>Ahead of plan</Chip>
    </div>

    <div style={abs(120, 176)}>
      <div style={{ ...NUM, fontSize: 300 }}>2.6×</div>
      <p style={{ ...BODY, marginTop: 26, color: LAV, width: 560 }}>
        Category growth in three seasons.
      </p>
    </div>
    <SkewRule x={830} y={176} h={300} />
    <div style={abs(980, 176)}>
      <div style={{ ...NUM, fontSize: 300 }}>€1.8B</div>
      <p style={{ ...BODY, marginTop: 26, color: LAV, width: 640 }}>
        Retail value this season. Still accelerating.
      </p>
    </div>

    <div style={abs(120, 604, { ...LABEL, color: LAV })}>Our share of category</div>

    <div style={abs(120, 650, { height: 115, display: 'flex', alignItems: 'center' })}>
      <div>
        <div style={{ ...NUM, fontSize: 52, fontWeight: 800 }}>2026</div>
        <div style={{ ...LABEL, fontSize: 15, color: LAV, marginTop: 4 }}>Today</div>
      </div>
    </div>
    <CutBar x={300} y={650} w={753} h={115} color={DEEP} />
    <div style={abs(1088, 650, { height: 115, display: 'flex', alignItems: 'center' })}>
      <span style={{ ...NUM, fontSize: 104 }}>6%</span>
    </div>

    <div style={abs(120, 795, { height: 115, display: 'flex', alignItems: 'center' })}>
      <div>
        <div style={{ ...NUM, fontSize: 52, fontWeight: 800, color: 'var(--osd-accent)' }}>
          2027
        </div>
        <div style={{ ...LABEL, fontSize: 15, color: LAV, marginTop: 4 }}>Target</div>
      </div>
    </div>
    <VoltBand x={300} y={795} w={1380} />
    <div
      style={abs(340, 795, {
        height: 115,
        width: 1290,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: INK,
      })}
    >
      <span style={{ ...LABEL, fontSize: 18, fontWeight: 700 }}>+5 pts · end of 2027</span>
      <span style={{ ...NUM, fontSize: 104 }}>11%</span>
    </div>
  </Stage>
);

const StartLane = ({ i }: { i: number }) => (
  <div
    style={abs(i * 240, 800, {
      width: 3,
      height: 300,
      background: WHITE_A(0.45),
      transform: SKEW,
      transformOrigin: '0 0',
    })}
  />
);

const StartNum = ({ n }: { n: number }) => (
  <div
    style={abs((n - 1) * 240 + 60, 880, {
      ...NUM,
      width: 120,
      textAlign: 'center',
      fontSize: 120,
      color: n === 4 ? 'var(--osd-accent)' : WHITE_A(0.9),
    })}
  >
    {n}
  </div>
);

const LANES = [1, 2, 3, 4, 5, 6, 7, 8];

const Closer: Page = () => {
  const live = useIsActivePage();
  const enter = (delay: number): CSSProperties =>
    live ? { animation: `ae-in 0.8s ${SNAP} ${delay}s both` } : {};
  return (
    <Stage footer={false}>
      <Wordmark x={120} y={92} />
      <Title size={196} x={112} y={186} style={enter(0.05)}>
        See you at
        <br />
        the start line.
      </Title>
      <div style={abs(120, 560, { ...enter(0.18) })}>
        <div style={{ ...DISPLAY, fontSize: 48, lineHeight: 1 }}>Sam Rivera</div>
        <div style={{ ...BODY, color: LAV, marginTop: 12 }}>
          Head of Marketing · sam@example.com
        </div>
      </div>
      <div style={abs(1380, 560, { width: 420, textAlign: 'right' })}>
        <div style={{ ...LABEL, fontSize: 17, color: LAV }}>Kick-off</div>
        <div
          style={{
            ...NUM,
            fontSize: 72,
            fontWeight: 800,
            marginTop: 6,
            color: 'var(--osd-accent)',
          }}
        >
          09·04·27
        </div>
      </div>

      <div style={abs(0, 800, { width: 1920, height: 280, background: DEEP })} />
      {LANES.map((n) => (
        <StartLane key={n} i={n} />
      ))}
      {LANES.map((n) => (
        <StartNum key={n} n={n} />
      ))}
      <div style={abs(-40, 770, { width: 2000, height: 34, background: 'var(--osd-accent)' })} />
    </Stage>
  );
};

export default [Cover, Content, Closer] satisfies Page[];

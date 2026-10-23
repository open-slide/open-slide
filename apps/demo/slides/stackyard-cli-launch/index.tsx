import {
  type DesignSystem,
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
  palette: { bg: '#FBF3E2', text: '#0B0B0B', accent: '#FFE14D' },
  fonts: {
    display: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
    body: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
  },
  typeScale: { hero: 220, body: 30 },
  radius: 14,
};

const INK = 'var(--osd-text)';
const PAPER = 'var(--osd-bg)';
const YELLOW = 'var(--osd-accent)';
const PINK = '#FF6FB5';
const BLUE = '#3D5AFE';
const MINT = '#5CF2B4';
const WHITE = '#FFFFFF';
const TERM = '#141414';
const CREAM = '#F7F0DF';
const DIM = '#6B6559';
const TDIM = '#8F897A';
const CODE_PINK = '#C8187A';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const DISPLAY = 'var(--osd-font-display)';
const B = 5;

const SLIDE_ID = 'stackyard-cli-launch';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@500;700&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const SNAP = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const KEYFRAMES = `
@keyframes sy-stamp {
  0% { opacity: 0; transform: translate(calc(var(--sy-s) * -1.4), calc(var(--sy-s) * -1.8)); box-shadow: calc(var(--sy-s) * 2.4) calc(var(--sy-s) * 2.8) 0 0 var(--osd-text); }
  14% { opacity: 1; }
  64% { opacity: 1; transform: translate(calc(var(--sy-s) * 0.6), calc(var(--sy-s) * 0.6)); box-shadow: calc(var(--sy-s) * 0.4) calc(var(--sy-s) * 0.4) 0 0 var(--osd-text); }
  100% { opacity: 1; transform: translate(0, 0); box-shadow: var(--sy-s) var(--sy-s) 0 0 var(--osd-text); }
}
@keyframes sy-slap {
  0% { opacity: 0; transform: rotate(calc(var(--sy-r) + 14deg)) scale(1.6); }
  12% { opacity: 1; }
  62% { opacity: 1; transform: rotate(calc(var(--sy-r) - 3deg)) scale(0.92); }
  100% { opacity: 1; transform: rotate(var(--sy-r)) scale(1); }
}
@keyframes sy-growx { 0% { transform: scaleX(0) } 70% { transform: scaleX(1.015) } 100% { transform: scaleX(1) } }
@keyframes sy-growy { 0% { transform: scaleY(0) } 70% { transform: scaleY(1.05) } 100% { transform: scaleY(1) } }
@keyframes sy-type { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes sy-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes sy-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
[data-osd-step="revealed"] > .sy-stp { animation: sy-stamp 400ms ${SNAP} both; }
@media (prefers-reduced-motion: reduce) {
  .sy-anim, .sy-stp, .sy-blink { animation: none !important; }
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
  if (style.textContent !== KEYFRAMES) style.textContent = KEYFRAMES;
}

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 220,
  exit: { duration: 220, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 220,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translate(-8px, -8px)' },
      { opacity: 1, transform: 'translate(0, 0)' },
    ],
  },
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const vars = (v: Record<string, string>) => v as CSSProperties;

const GRID = [
  'linear-gradient(rgba(11,11,11,0.06) 2px, transparent 2px) -1px -1px / 60px 60px',
  'linear-gradient(90deg, rgba(11,11,11,0.06) 2px, transparent 2px) -1px -1px / 60px 60px',
].join(', ');

const HATCH = `repeating-linear-gradient(-45deg, rgba(11,11,11,0.16) 0 4px, transparent 4px 16px), ${WHITE}`;

const LABEL: CSSProperties = {
  fontFamily: MONO,
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  lineHeight: 1,
};

const LogoMark = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <rect
      x="3"
      y="3"
      width="28"
      height="9"
      rx="2"
      style={{ fill: PINK, stroke: INK, strokeWidth: 3 }}
    />
    <rect
      x="9"
      y="15.5"
      width="28"
      height="9"
      rx="2"
      style={{ fill: YELLOW, stroke: INK, strokeWidth: 3 }}
    />
    <rect
      x="3"
      y="28"
      width="28"
      height="9"
      rx="2"
      style={{ fill: BLUE, stroke: INK, strokeWidth: 3 }}
    />
  </svg>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        ...abs(120, 990),
        width: 1680,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        zIndex: 8,
      }}
    >
      <LogoMark size={34} />
      <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Stackyard</span>
      <span style={{ ...LABEL, fontSize: 18, color: DIM, marginLeft: 6 }}>
        CLI 2.0 · Launch week
      </span>
      <span
        style={{
          marginLeft: 'auto',
          fontFamily: MONO,
          fontSize: 20,
          fontWeight: 700,
          background: WHITE,
          border: `4px solid ${INK}`,
          borderRadius: 8,
          boxShadow: `4px 4px 0 0 ${INK}`,
          padding: '5px 12px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(current).padStart(2, '0')}/{String(total).padStart(2, '0')}
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
      background: `${GRID}, ${PAPER}`,
      color: INK,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    {footer && <Footer />}
  </div>
);

type BoxProps = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  fill?: string;
  color?: string;
  sh?: number;
  delay?: number;
  step?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
};

const Box = ({
  x,
  y,
  w,
  h,
  fill = WHITE,
  color,
  sh = 10,
  delay = 0,
  step = false,
  style,
  children,
}: BoxProps) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? (step ? 'sy-stp' : 'sy-anim') : undefined}
      style={{
        ...abs(x, y),
        width: w,
        height: h,
        boxSizing: 'border-box',
        background: fill,
        color,
        border: `${B}px solid ${INK}`,
        borderRadius: 'var(--osd-radius)',
        boxShadow: `${sh}px ${sh}px 0 0 ${INK}`,
        ...vars({ '--sy-s': `${sh}px` }),
        animation: live && !step ? `sy-stamp 440ms ${SNAP} ${delay}ms both` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Knob = () => (
  <span
    style={{
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: WHITE,
      border: `4px solid ${INK}`,
      boxSizing: 'border-box',
      flex: 'none',
    }}
  />
);

type WinProps = BoxProps & {
  title: string;
  bar?: string;
  right?: ReactNode;
  pad?: number | string;
  bodyStyle?: CSSProperties;
};

const Win = ({
  title,
  bar = YELLOW,
  right,
  pad = 32,
  bodyStyle,
  children,
  style,
  ...rest
}: WinProps) => (
  <Box {...rest} style={{ display: 'flex', flexDirection: 'column', ...style }}>
    <div
      style={{
        height: 64,
        flex: 'none',
        boxSizing: 'border-box',
        borderBottom: `${B}px solid ${INK}`,
        borderRadius: 'calc(var(--osd-radius) - 5px) calc(var(--osd-radius) - 5px) 0 0',
        background: bar,
        color: INK,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 22px',
      }}
    >
      <Knob />
      <Knob />
      <Knob />
      <span
        style={{
          marginLeft: 14,
          fontFamily: MONO,
          fontSize: 21,
          fontWeight: 700,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
      <span style={{ marginLeft: 'auto', ...LABEL, fontSize: 18 }}>{right}</span>
    </div>
    <div style={{ flex: 1, padding: pad, position: 'relative', ...bodyStyle }}>{children}</div>
  </Box>
);

const Sticker = ({
  x,
  y,
  rot = -4,
  fill = PINK,
  color = INK,
  size = 22,
  delay = 320,
  children,
}: {
  x: number;
  y: number;
  rot?: number;
  fill?: string;
  color?: string;
  size?: number;
  delay?: number;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'sy-anim' : undefined}
      style={{
        ...abs(x, y),
        zIndex: 6,
        transform: `rotate(${rot}deg)`,
        ...vars({ '--sy-r': `${rot}deg` }),
        background: fill,
        color,
        border: `4px solid ${INK}`,
        borderRadius: 10,
        boxShadow: `6px 6px 0 0 ${INK}`,
        padding: '10px 18px',
        fontFamily: MONO,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        animation: live ? `sy-slap 420ms ${SNAP} ${delay}ms both` : undefined,
      }}
    >
      {children}
    </div>
  );
};

const burstPoints = (spikes: number, outer: number, inner: number, c: number) => {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};

const BURST = burstPoints(14, 96, 80, 100);

const Burst = ({
  x,
  y,
  size,
  rot = 10,
  fill = PINK,
  color = INK,
  delay = 420,
  children,
}: {
  x: number;
  y: number;
  size: number;
  rot?: number;
  fill?: string;
  color?: string;
  delay?: number;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'sy-anim' : undefined}
      style={{
        ...abs(x, y),
        width: size,
        height: size,
        zIndex: 7,
        color,
        transform: `rotate(${rot}deg)`,
        ...vars({ '--sy-r': `${rot}deg` }),
        animation: live ? `sy-slap 440ms ${SNAP} ${delay}ms both` : undefined,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <polygon points={BURST} transform="translate(7 7)" style={{ fill: INK }} />
        <polygon
          points={BURST}
          style={{ fill, stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
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
};

const Tag = ({
  children,
  fill = INK,
  color = YELLOW,
}: {
  children: ReactNode;
  fill?: string;
  color?: string;
}) => (
  <div
    style={{
      ...abs(120, 108),
      ...LABEL,
      background: fill,
      color,
      padding: '9px 14px',
      border: `4px solid ${INK}`,
      borderRadius: 8,
    }}
  >
    {children}
  </div>
);

const Head = ({ tag, children }: { tag: string; children: ReactNode }) => (
  <>
    <Tag>{tag}</Tag>
    <h2
      style={{
        ...abs(120, 172),
        width: 1680,
        margin: 0,
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 84,
        lineHeight: 1.08,
        letterSpacing: '-0.035em',
      }}
    >
      {children}
    </h2>
  </>
);

const Mark = ({
  children,
  fill = YELLOW,
  color = INK,
  rot = -1.5,
  mono = false,
}: {
  children: ReactNode;
  fill?: string;
  color?: string;
  rot?: number;
  mono?: boolean;
}) => (
  <span
    style={{
      display: 'inline-block',
      background: fill,
      color,
      border: `${B}px solid ${INK}`,
      borderRadius: 12,
      padding: '0 0.16em 0.06em',
      boxShadow: `6px 6px 0 0 ${INK}`,
      transform: `rotate(${rot}deg)`,
      lineHeight: 1.0,
      fontFamily: mono ? MONO : undefined,
      letterSpacing: mono ? '-0.04em' : undefined,
    }}
  >
    {children}
  </span>
);

const Cursor = ({ color = YELLOW }: { color?: string }) => {
  const live = useIsActivePage();
  return (
    <span
      className={live ? 'sy-blink' : undefined}
      style={{
        display: 'inline-block',
        width: '0.58em',
        height: '1em',
        verticalAlign: '-0.14em',
        background: color,
        marginLeft: '0.12em',
        animation: live ? 'sy-blink 1s steps(1) infinite' : undefined,
      }}
    />
  );
};

const TL = ({
  g = '',
  gc = TDIM,
  a,
  ac = CREAM,
  b = '',
  c = '',
  cc = TDIM,
  aw = 19,
  bw = 13,
  delay = 0,
}: {
  g?: string;
  gc?: string;
  a: ReactNode;
  ac?: string;
  b?: string;
  c?: ReactNode;
  cc?: string;
  aw?: number;
  bw?: number;
  delay?: number;
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'sy-anim' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 46,
        whiteSpace: 'pre',
        animation: live ? `sy-type 300ms steps(16, end) ${delay}ms both` : undefined,
      }}
    >
      <span style={{ width: '2ch', flex: 'none', color: gc, fontWeight: 700 }}>{g}</span>
      <span style={{ width: `${aw}ch`, flex: 'none', color: ac }}>{a}</span>
      <span style={{ width: `${bw}ch`, flex: 'none', color: TDIM }}>{b}</span>
      <span style={{ color: cc }}>{c}</span>
    </div>
  );
};

const StackBlock = ({
  x,
  y,
  fill,
  color = INK,
  name,
  meta,
  port,
  delay,
}: {
  x: number;
  y: number;
  fill: string;
  color?: string;
  name: string;
  meta: string;
  port: string;
  delay: number;
}) => (
  <Box
    x={x}
    y={y}
    w={460}
    h={132}
    fill={fill}
    color={color}
    sh={12}
    delay={delay}
    style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px' }}
  >
    <span
      style={{
        width: 28,
        height: 28,
        flex: 'none',
        background: MINT,
        border: `4px solid ${INK}`,
        borderRadius: 6,
        boxSizing: 'border-box',
      }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{name}</span>
      <span style={{ ...LABEL, fontSize: 18, fontWeight: 500, opacity: 0.8 }}>{meta}</span>
    </div>
    <span
      style={{
        marginLeft: 'auto',
        fontFamily: MONO,
        fontSize: 24,
        fontWeight: 700,
        color: INK,
        background: WHITE,
        border: `4px solid ${INK}`,
        borderRadius: 8,
        padding: '6px 12px',
      }}
    >
      {port}
    </span>
  </Box>
);

const Cover: Page = () => (
  <Stage footer={false}>
    <Sticker x={120} y={118} rot={-3} fill={PINK} delay={560}>
      Launch week · Day 1
    </Sticker>
    <h1
      style={{
        ...abs(110, 196),
        margin: 0,
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 0.92,
        letterSpacing: '-0.055em',
      }}
    >
      Stackyard
    </h1>
    <Box
      x={120}
      y={432}
      fill={YELLOW}
      sh={16}
      delay={80}
      style={{
        padding: '4px 40px 18px',
        fontFamily: DISPLAY,
        fontSize: 168,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      CLI 2.0
    </Box>
    <p
      style={{
        ...abs(120, 704),
        width: 1060,
        margin: 0,
        fontSize: 42,
        fontWeight: 500,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      }}
    >
      Full-stack preview environments on your laptop. Cold boot in{' '}
      <b style={{ fontWeight: 700, background: MINT, padding: '0 6px' }}>2.8 seconds</b>.
    </p>
    <Box
      x={120}
      y={850}
      fill={TERM}
      color={CREAM}
      sh={8}
      delay={240}
      style={{
        padding: '16px 26px',
        fontFamily: MONO,
        fontSize: 28,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: PINK, fontWeight: 700 }}>$</span> brew install stackyard/tap/yard
      <Cursor />
    </Box>

    <StackBlock
      x={1280}
      y={790}
      fill={YELLOW}
      name="redis"
      meta="asleep · lazy"
      port=":6379"
      delay={0}
    />
    <StackBlock
      x={1340}
      y={620}
      fill={MINT}
      name="postgres"
      meta="seeded · 0.4s"
      port=":5432"
      delay={110}
    />
    <StackBlock
      x={1280}
      y={450}
      fill={BLUE}
      color={WHITE}
      name="api"
      meta="healthy · 1.1s"
      port=":8080"
      delay={220}
    />
    <StackBlock
      x={1340}
      y={280}
      fill={PINK}
      name="web"
      meta="ready · 0.5s"
      port=":3000"
      delay={330}
    />
    <Burst x={1560} y={92} size={230} rot={12} fill={YELLOW} delay={560}>
      <span
        style={{
          fontFamily: DISPLAY,
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
        }}
      >
        2.8s
      </span>
      <span style={{ ...LABEL, fontSize: 18, marginTop: 8 }}>cold boot</span>
    </Burst>
  </Stage>
);

const Seg = ({
  w,
  fill,
  color = INK,
  secs,
  label,
  delay,
  round,
}: {
  w: number;
  fill: string;
  color?: string;
  secs: string;
  label: string;
  delay: number;
  round?: 'l' | 'r';
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'sy-anim' : undefined}
      style={{
        width: w,
        height: '100%',
        flex: 'none',
        boxSizing: 'border-box',
        background: fill,
        color,
        borderRight: round === 'r' ? 'none' : `${B}px solid ${INK}`,
        borderRadius: round === 'l' ? '8px 0 0 8px' : round === 'r' ? '0 8px 8px 0' : 0,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transformOrigin: 'left center',
        animation: live ? `sy-growx 360ms ${SNAP} ${delay}ms both` : undefined,
      }}
    >
      <span style={{ fontSize: 58, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {secs}
      </span>
      <span style={{ ...LABEL, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
};

const Tick = ({ x, label }: { x: number; label: string }) => (
  <div style={{ ...abs(x, 0), display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <span style={{ width: 4, height: 14, background: INK }} />
    <span style={{ ...LABEL, fontWeight: 500, marginTop: 8, color: DIM }}>{label}</span>
  </div>
);

const Problem: Page = () => (
  <Stage>
    <Head tag="01 · The problem">
      Your preview env takes{' '}
      <Mark fill={PINK} mono>
        4m 12s
      </Mark>{' '}
      to boot.
    </Head>
    <Win
      x={120}
      y={380}
      w={1680}
      h={460}
      bar={PINK}
      title="~/shop-api — yard up (v1.9)"
      right="cold boot"
      pad="28px 40px"
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Where the four minutes actually go
        </span>
        <span style={{ fontFamily: MONO, fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
          04:12
        </span>
      </div>
      <div
        style={{
          marginTop: 30,
          width: 1590,
          height: 160,
          boxSizing: 'border-box',
          display: 'flex',
          border: `${B}px solid ${INK}`,
          borderRadius: 13,
          boxShadow: `8px 8px 0 0 ${INK}`,
          background: WHITE,
        }}
      >
        <Seg w={602} fill={PINK} secs="96s" label="Pull images" delay={120} round="l" />
        <Seg w={445} fill={YELLOW} secs="71s" label="Install deps" delay={420} />
        <Seg w={364} fill={BLUE} color={WHITE} secs="58s" label="Seed database" delay={720} />
        <Seg w={169} fill={MINT} secs="27s" label="DNS + TLS" delay={1020} round="r" />
      </div>
      <div style={{ position: 'relative', height: 44, marginTop: 14 }}>
        <Tick x={3} label="0" />
        <Tick x={379} label="1m" />
        <Tick x={755} label="2m" />
        <Tick x={1131} label="3m" />
        <Tick x={1507} label="4m" />
      </div>
      <div
        style={{ ...LABEL, fontWeight: 500, color: DIM, marginTop: 20, letterSpacing: '0.04em' }}
      >
        median of 1,240 cold boots · 6 services · Stackyard 1.9 opt-in telemetry, Q2 2026
      </div>
    </Win>
  </Stage>
);

const EqBox = ({
  x,
  fill,
  color = INK,
  big,
  cap,
  delay,
}: {
  x: number;
  fill: string;
  color?: string;
  big: string;
  cap: string;
  delay: number;
}) => (
  <Box
    x={x}
    y={420}
    w={480}
    h={300}
    fill={fill}
    color={color}
    sh={12}
    delay={delay}
    style={{
      padding: '30px 34px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <span
      style={{
        fontFamily: MONO,
        fontSize: 140,
        fontWeight: 700,
        lineHeight: 0.9,
        letterSpacing: '-0.06em',
      }}
    >
      {big}
    </span>
    <span style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.25 }}>{cap}</span>
  </Box>
);

const Op = ({ x, children }: { x: number; children: string }) => (
  <span
    style={{
      ...abs(x, 500),
      width: 120,
      textAlign: 'center',
      fontSize: 120,
      fontWeight: 700,
      lineHeight: 1,
    }}
  >
    {children}
  </span>
);

const TheMath: Page = () => (
  <Stage>
    <Head tag="02 · The math">
      An hour a day, per developer, <Mark fill={MINT}>spent waiting.</Mark>
    </Head>
    <EqBox x={120} fill={YELLOW} big="14" cap="boots per dev, per day" delay={0} />
    <Op x={600}>×</Op>
    <EqBox x={720} fill={PINK} big="4:12" cap="minutes per cold boot" delay={160} />
    <Op x={1200}>=</Op>
    <EqBox x={1320} fill={BLUE} color={WHITE} big="59m" cap="gone, every single day" delay={320} />
    <Box
      x={120}
      y={790}
      w={1680}
      h={140}
      delay={520}
      sh={8}
      style={{ padding: '22px 36px', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        A 40-person team burns 39 hours a day watching spinners.
      </span>
      <span style={{ ...LABEL, fontWeight: 500, color: DIM, letterSpacing: '0.04em' }}>
        boot counts from 1,200 opted-in Stackyard 1.x teams · April–June 2026
      </span>
    </Box>
  </Stage>
);

const IconSnap = () => (
  <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
    <rect
      x="6"
      y="6"
      width="66"
      height="66"
      rx="10"
      style={{ fill: BLUE, stroke: INK, strokeWidth: 5 }}
    />
    <rect
      x="34"
      y="34"
      width="66"
      height="66"
      rx="10"
      style={{ fill: YELLOW, stroke: INK, strokeWidth: 5 }}
    />
    <polygon
      points="72,44 52,70 66,70 60,92 82,62 68,62"
      style={{ fill: INK, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' }}
    />
  </svg>
);

const IconLazy = () => (
  <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
    <path
      d="M58 14 A42 42 0 1 0 96 70 A34 34 0 1 1 58 14 Z"
      style={{ fill: PINK, stroke: INK, strokeWidth: 5, strokeLinejoin: 'round' }}
    />
    <text x="70" y="40" style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, fill: INK }}>
      z
    </text>
    <text x="86" y="22" style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, fill: INK }}>
      z
    </text>
  </svg>
);

const IconCache = () => (
  <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
    <path
      d="M14 24 V86 A41 14 0 0 0 96 86 V24"
      style={{ fill: MINT, stroke: INK, strokeWidth: 5 }}
    />
    <path d="M14 45 A41 14 0 0 0 96 45" style={{ fill: 'none', stroke: INK, strokeWidth: 5 }} />
    <path d="M14 66 A41 14 0 0 0 96 66" style={{ fill: 'none', stroke: INK, strokeWidth: 5 }} />
    <ellipse cx="55" cy="24" rx="41" ry="14" style={{ fill: WHITE, stroke: INK, strokeWidth: 5 }} />
  </svg>
);

const IconShare = () => (
  <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
    <rect
      x="6"
      y="30"
      width="72"
      height="72"
      rx="10"
      style={{ fill: WHITE, stroke: INK, strokeWidth: 5 }}
    />
    <path
      d="M42 66 L94 14"
      style={{ fill: 'none', stroke: INK, strokeWidth: 9, strokeLinecap: 'square' }}
    />
    <polygon points="62,8 102,8 102,48" style={{ fill: INK }} />
  </svg>
);

const FeatureCard = ({
  x,
  num,
  bar,
  icon,
  title,
  chip,
  delay,
  children,
}: {
  x: number;
  num: string;
  bar: string;
  icon: ReactNode;
  title: string;
  chip: string;
  delay: number;
  children: ReactNode;
}) => (
  <Win x={x} y={350} w={396} h={560} bar={bar} title={num} right="new" delay={delay} pad={28}>
    {icon}
    <div
      style={{
        marginTop: 24,
        fontSize: 42,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1.05,
      }}
    >
      {title}
    </div>
    <p style={{ margin: '12px 0 0', fontSize: 28, fontWeight: 500, lineHeight: 1.4 }}>{children}</p>
    <span
      style={{
        ...abs(28, 404),
        fontFamily: MONO,
        fontSize: 22,
        fontWeight: 700,
        background: INK,
        color: WHITE,
        borderRadius: 8,
        padding: '8px 14px',
      }}
    >
      {chip}
    </span>
  </Win>
);

const WhatsNew: Page = () => (
  <Stage>
    <Head tag="03 · What's new">
      2.0, in <Mark>four moves.</Mark>
    </Head>
    <FeatureCard
      x={120}
      num="01 / snapshot"
      bar={YELLOW}
      icon={<IconSnap />}
      title="Snapshot boot"
      chip="2.8s cold boot"
      delay={0}
    >
      Fork a warm, pre-seeded env instead of building a new one.
    </FeatureCard>
    <FeatureCard
      x={548}
      num="02 / lazy"
      bar={PINK}
      icon={<IconLazy />}
      title="Lazy services"
      chip="−61% idle RAM"
      delay={110}
    >
      Services sleep until the first request hits them. Idle costs nothing.
    </FeatureCard>
    <FeatureCard
      x={976}
      num="03 / cache"
      bar={MINT}
      icon={<IconCache />}
      title="Shared cache"
      chip="1.2 GB saved / repo"
      delay={220}
    >
      Images and layers dedupe across every repo you own.
    </FeatureCard>
    <FeatureCard
      x={1404}
      num="04 / share"
      bar={BLUE}
      icon={<IconShare />}
      title="Share links"
      chip="1 command"
      delay={330}
    >
      Put any local env on a public HTTPS URL. No deploy, no CI.
    </FeatureCard>
  </Stage>
);

const COL_OLD = 540;
const COL_ARROW = 840;
const COL_NEW = 940;

const SpeedRow = ({
  y,
  task,
  old,
  neu,
  gain,
}: {
  y: number;
  task: string;
  old: string;
  neu: string;
  gain: string;
}) => (
  <Box
    x={120}
    y={y}
    w={1680}
    h={96}
    sh={8}
    step
    style={{ display: 'flex', alignItems: 'center', padding: '0 34px', position: 'absolute' }}
  >
    <span
      style={{
        ...abs(34, 20),
        fontSize: 38,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: '46px',
      }}
    >
      {task}
    </span>
    <span
      style={{
        ...abs(COL_OLD, 22),
        fontFamily: MONO,
        fontSize: 36,
        fontWeight: 500,
        color: '#57524A',
        lineHeight: '42px',
      }}
    >
      {old}
      <span
        style={{
          position: 'absolute',
          left: -8,
          right: -8,
          top: 25,
          height: 6,
          background: PINK,
          border: `2px solid ${INK}`,
          transform: 'rotate(-3deg)',
        }}
      />
    </span>
    <span style={{ ...abs(COL_ARROW, 14), fontSize: 52, fontWeight: 700, lineHeight: 1 }}>→</span>
    <span
      style={{
        ...abs(COL_NEW, 12),
        fontFamily: MONO,
        fontSize: 40,
        fontWeight: 700,
        lineHeight: 1,
        background: YELLOW,
        border: `4px solid ${INK}`,
        borderRadius: 10,
        padding: '8px 18px',
      }}
    >
      {neu}
    </span>
    <span
      style={{
        position: 'absolute',
        right: 34,
        top: 16,
        fontSize: 52,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}
    >
      {gain}
    </span>
  </Box>
);

const ColLabel = ({ x, children, right }: { x: number; children: string; right?: boolean }) => (
  <span
    style={{
      ...abs(x, 374),
      ...LABEL,
      color: DIM,
      ...(right ? { left: undefined, right: 159 } : {}),
    }}
  >
    {children}
  </span>
);

const BeforeAfter: Page = () => (
  <Stage>
    <Head tag="04 · Before / after">
      Same repo. Same laptop. <Mark fill={YELLOW}>90× faster.</Mark>
    </Head>
    <ColLabel x={159}>task</ColLabel>
    <ColLabel x={125 + COL_OLD}>v1.9</ColLabel>
    <ColLabel x={125 + COL_NEW}>v2.0</ColLabel>
    <ColLabel x={0} right>
      speedup
    </ColLabel>
    <Steps>
      <Step duration={60}>
        <SpeedRow y={412} task="Cold boot" old="4m 12s" neu="2.8s" gain="90×" />
      </Step>
      <Step duration={60}>
        <SpeedRow y={532} task="Warm restart" old="48s" neu="0.9s" gain="53×" />
      </Step>
      <Step duration={60}>
        <SpeedRow y={652} task="Reseed database" old="1m 11s" neu="1.4s" gain="51×" />
      </Step>
      <Step duration={60}>
        <SpeedRow y={772} task="Switch branch" old="2m 05s" neu="3.6s" gain="35×" />
      </Step>
    </Steps>
  </Stage>
);

const Elbow = ({ d, hx, hy, delay }: { d: string; hx: number; hy: number; delay: number }) => {
  const live = useIsActivePage();
  return (
    <g>
      <path
        d={d}
        pathLength={1}
        className={live ? 'sy-anim' : undefined}
        style={{
          fill: 'none',
          stroke: INK,
          strokeWidth: 8,
          strokeLinejoin: 'round',
          strokeDasharray: 1,
          animation: live ? `sy-draw 320ms ${SNAP} ${delay}ms both` : undefined,
        }}
      />
      <polygon
        points={`${hx},${hy - 17} ${hx + 26},${hy} ${hx},${hy + 17}`}
        style={{ fill: INK }}
      />
    </g>
  );
};

const LayerBar = ({ fill, label }: { fill: string; label: string }) => (
  <div
    style={{
      height: 34,
      boxSizing: 'border-box',
      background: fill,
      color: INK,
      border: `4px solid ${INK}`,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      ...LABEL,
      fontSize: 18,
    }}
  >
    {label}
  </div>
);

const ForkBox = ({
  y,
  fill,
  name,
  time,
  delay,
}: {
  y: number;
  fill: string;
  name: string;
  time: string;
  delay: number;
}) => (
  <Box
    x={1300}
    y={y}
    w={500}
    h={140}
    fill={fill}
    sh={10}
    delay={delay}
    style={{
      padding: '22px 28px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{name}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 26,
          fontWeight: 700,
          background: INK,
          color: YELLOW,
          borderRadius: 8,
          padding: '6px 12px',
        }}
      >
        {time}
      </span>
    </div>
    <span style={{ ...LABEL, fontWeight: 500 }}>copy-on-write · 38 MB own</span>
  </Box>
);

const TomlLine = ({ children }: { children: ReactNode }) => (
  <div style={{ height: 40, whiteSpace: 'pre' }}>{children}</div>
);

const UnderTheHood: Page = () => (
  <Stage>
    <Head tag="05 · Under the hood">
      Build once. <Mark fill={MINT}>Fork forever.</Mark>
    </Head>
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      aria-hidden
    >
      <Elbow d="M592 620 H654" hx={652} hy={620} delay={320} />
      <Elbow d="M1162 620 H1222 V470 H1272" hx={1270} hy={470} delay={700} />
      <Elbow d="M1162 620 H1272" hx={1270} hy={620} delay={760} />
      <Elbow d="M1162 620 H1222 V770 H1272" hx={1270} hy={770} delay={820} />
    </svg>
    <Win
      x={120}
      y={410}
      w={460}
      h={420}
      bar={YELLOW}
      title="yard.toml"
      pad="26px 30px"
      bodyStyle={{ fontFamily: MONO, fontSize: 25, fontWeight: 500 }}
      style={{ zIndex: 2 }}
    >
      <TomlLine>
        <span style={{ color: BLUE, fontWeight: 700 }}>[stack]</span>
      </TomlLine>
      <TomlLine>
        name = <span style={{ color: CODE_PINK }}>"shop"</span>
      </TomlLine>
      <TomlLine>
        compose = <span style={{ color: CODE_PINK }}>"./compose.yml"</span>
      </TomlLine>
      <TomlLine> </TomlLine>
      <TomlLine>
        <span style={{ color: BLUE, fontWeight: 700 }}>[snapshot]</span>
      </TomlLine>
      <TomlLine>
        seed = <span style={{ color: CODE_PINK }}>"make seed"</span>
      </TomlLine>
      <TomlLine>
        rebuild = <span style={{ color: CODE_PINK }}>"nightly"</span>
      </TomlLine>
    </Win>
    <Box
      x={680}
      y={430}
      w={470}
      h={380}
      fill={BLUE}
      color={WHITE}
      sh={12}
      delay={420}
      style={{ padding: '26px 30px', zIndex: 2 }}
    >
      <div style={{ ...LABEL, color: YELLOW }}>snapshot · main@a91f3c</div>
      <div
        style={{
          marginTop: 14,
          fontSize: 54,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        Built once, in CI
      </div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 500 }}>nightly + on merge · 41s</div>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <LayerBar fill={WHITE} label="app build" />
        <LayerBar fill={PINK} label="seed data · 1.4 GB" />
        <LayerBar fill={YELLOW} label="deps" />
        <LayerBar fill={MINT} label="base images" />
      </div>
    </Box>
    <ForkBox y={400} fill={YELLOW} name="main" time="2.8s" delay={900} />
    <ForkBox y={550} fill={PINK} name="pr-482" time="2.7s" delay={980} />
    <ForkBox y={700} fill={WHITE} name="pr-490" time="2.9s" delay={1060} />
    <p
      style={{
        ...abs(120, 878),
        margin: 0,
        fontSize: 32,
        fontWeight: 500,
        letterSpacing: '-0.01em',
      }}
    >
      Forks share <b style={{ fontWeight: 700, background: YELLOW, padding: '0 6px' }}>94%</b> of
      their disk with the snapshot. Ten envs cost about as much as one.
    </p>
  </Stage>
);

const Callout = ({
  y,
  n,
  fill,
  children,
}: {
  y: number;
  n: string;
  fill: string;
  children: ReactNode;
}) => (
  <Box
    x={1260}
    y={y}
    w={540}
    h={166}
    sh={8}
    step
    style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px' }}
  >
    <span
      style={{
        width: 64,
        height: 64,
        flex: 'none',
        boxSizing: 'border-box',
        borderRadius: '50%',
        background: fill,
        border: `4px solid ${INK}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontSize: 28,
        fontWeight: 700,
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 29, fontWeight: 500, lineHeight: 1.32 }}>{children}</span>
  </Box>
);

const Code = ({ children, bg = YELLOW }: { children: ReactNode; bg?: string }) => (
  <code
    style={{
      fontFamily: MONO,
      fontSize: '0.9em',
      fontWeight: 700,
      background: bg,
      padding: '0 6px',
      borderRadius: 4,
    }}
  >
    {children}
  </code>
);

const WalkUp: Page = () => (
  <Stage>
    <Head tag="06 · Walkthrough">
      <Mark mono fill={YELLOW}>
        yard up
      </Mark>{' '}
      boots the whole stack.
    </Head>
    <Win
      x={120}
      y={330}
      w={1080}
      h={560}
      fill={TERM}
      bar={YELLOW}
      title="zsh — ~/shop"
      right="2.0.0"
      pad="30px 40px"
      bodyStyle={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: CREAM }}
    >
      <TL g="$" gc={PINK} a="yard up" ac={WHITE} delay={100} />
      <TL g="▸" gc={YELLOW} a="reading yard.toml" b="" c="4 services" delay={420} />
      <TL g="▸" gc={YELLOW} a="forking snapshot" b="main@a91f3c" c="0.6s" delay={700} />
      <TL g="✓" gc={MINT} a="postgres 16" b=":5432" c="0.4s" delay={980} />
      <TL g="✓" gc={MINT} a="redis 7" b=":6379" c="asleep" cc={PINK} delay={1160} />
      <TL g="✓" gc={MINT} a="api" b=":8080" c="1.1s" delay={1340} />
      <TL g="✓" gc={MINT} a="web" b=":3000" c="0.5s" delay={1520} />
      <TL
        g="●"
        gc={YELLOW}
        a={<b style={{ color: YELLOW }}>ready in 2.8s</b>}
        b=""
        c=""
        delay={1800}
      />
      <TL
        g=""
        a={
          <span>
            <span style={{ color: TDIM }}>→ </span>
            <span style={{ color: MINT, textDecoration: 'underline' }}>
              https://shop.yard.local
            </span>
            <Cursor />
          </span>
        }
        aw={40}
        bw={0}
        delay={2000}
      />
    </Win>
    <Steps>
      <Step duration={60}>
        <Callout y={330} n="1" fill={YELLOW}>
          Reads your existing <Code>compose.yml</Code>. Nothing to migrate.
        </Callout>
      </Step>
      <Step duration={60}>
        <Callout y={527} n="2" fill={PINK}>
          Services you never hit stay asleep and cost zero RAM.
        </Callout>
      </Step>
      <Step duration={60}>
        <Callout y={724} n="3" fill={MINT}>
          Every env gets its own <Code bg={MINT}>.local</Code> hostname with TLS.
        </Callout>
      </Step>
    </Steps>
  </Stage>
);

const Lock = () => (
  <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden>
    <path
      d="M5 12 V8 A6 6 0 0 1 17 8 V12"
      style={{ fill: 'none', stroke: INK, strokeWidth: 3.5 }}
    />
    <rect
      x="2"
      y="11"
      width="18"
      height="13"
      rx="2"
      style={{ fill: MINT, stroke: INK, strokeWidth: 3 }}
    />
  </svg>
);

const Product = ({ fill }: { fill: string }) => (
  <div
    style={{
      flex: 1,
      height: 130,
      boxSizing: 'border-box',
      border: `4px solid ${INK}`,
      borderRadius: 10,
      background: WHITE,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div style={{ height: 62, background: fill, border: `3px solid ${INK}`, borderRadius: 6 }} />
    <div style={{ height: 10, width: '80%', background: INK, borderRadius: 4 }} />
    <div style={{ height: 10, width: '45%', background: '#C9C1B0', borderRadius: 4 }} />
  </div>
);

const MiniStat = ({
  x,
  value,
  label,
  fill,
  delay,
}: {
  x: number;
  value: string;
  label: string;
  fill: string;
  delay: number;
}) => (
  <Box
    x={x}
    y={800}
    w={420}
    h={110}
    fill={fill}
    sh={8}
    delay={delay}
    style={{
      padding: '0 26px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
    }}
  >
    <span style={{ fontSize: 54, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
      {value}
    </span>
    <span style={{ ...LABEL, lineHeight: 1.3 }}>{label}</span>
  </Box>
);

const WalkShare: Page = () => (
  <Stage>
    <Head tag="07 · Walkthrough">
      Send a preview, <Mark fill={PINK}>not a screenshot.</Mark>
    </Head>
    <Win
      x={120}
      y={420}
      w={880}
      h={330}
      fill={TERM}
      bar={MINT}
      title="zsh — ~/shop"
      right="pr-482"
      pad="28px 36px"
      bodyStyle={{ fontFamily: MONO, fontSize: 28, fontWeight: 500, color: CREAM }}
    >
      <TL g="$" gc={PINK} a="yard share --expires 24h" ac={WHITE} aw={30} bw={0} delay={100} />
      <TL g="▸" gc={YELLOW} a="tunnel" aw={9} b="eu-central" c="31ms" delay={460} />
      <TL
        g="✓"
        gc={MINT}
        a={<span style={{ color: MINT }}>https://pr-482-mika.yard.dev</span>}
        aw={34}
        bw={0}
        delay={760}
      />
      <TL g="" a="auth" aw={9} b="team only" c="expires in 24h" delay={1000} />
    </Win>
    <MiniStat x={120} value="31ms" label={'median tunnel\nlatency'} fill={WHITE} delay={1200} />
    <MiniStat x={580} value="0" label={'deploys or\nCI runs needed'} fill={YELLOW} delay={1300} />

    <Win
      x={1080}
      y={400}
      w={720}
      h={520}
      bar={BLUE}
      title="Preview — shop"
      delay={300}
      pad={0}
      sh={14}
    >
      <div
        style={{
          height: 60,
          boxSizing: 'border-box',
          borderBottom: `${B}px solid ${INK}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 22px',
          background: '#F2ECDD',
        }}
      >
        <Lock />
        <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700 }}>
          pr-482-mika.yard.dev
        </span>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 120, height: 26, background: INK, borderRadius: 6 }} />
          <div
            style={{
              marginLeft: 'auto',
              width: 70,
              height: 16,
              background: '#C9C1B0',
              borderRadius: 8,
            }}
          />
          <div style={{ width: 70, height: 16, background: '#C9C1B0', borderRadius: 8 }} />
          <div style={{ width: 70, height: 16, background: '#C9C1B0', borderRadius: 8 }} />
        </div>
        <div
          style={{
            height: 120,
            boxSizing: 'border-box',
            background: PINK,
            border: `4px solid ${INK}`,
            borderRadius: 10,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ width: '62%', height: 22, background: INK, borderRadius: 4 }} />
          <div style={{ width: '40%', height: 14, background: WHITE, borderRadius: 4 }} />
          <div
            style={{
              width: 130,
              height: 26,
              background: YELLOW,
              border: `3px solid ${INK}`,
              borderRadius: 6,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Product fill={MINT} />
          <Product fill={YELLOW} />
          <Product fill={BLUE} />
        </div>
      </div>
    </Win>
    <svg
      width="56"
      height="64"
      viewBox="0 0 56 64"
      style={{ ...abs(1580, 690), zIndex: 9 }}
      aria-hidden
    >
      <path
        d="M4 4 L4 52 L18 40 L28 60 L38 55 L28 36 L46 36 Z"
        style={{ fill: WHITE, stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' }}
      />
    </svg>
    <Sticker x={1390} y={346} rot={5} fill={YELLOW} size={22} delay={900}>
      "Ship it!" — Priya, design
    </Sticker>
  </Stage>
);

const PluginTile = ({
  x,
  y,
  fill,
  color = INK,
  name,
  cat,
  installs,
  delay,
}: {
  x: number;
  y: number;
  fill: string;
  color?: string;
  name: string;
  cat: string;
  installs: string;
  delay: number;
}) => (
  <Box
    x={x}
    y={y}
    w={396}
    h={140}
    fill={fill}
    color={color}
    sh={8}
    delay={delay}
    style={{
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{name}</span>
      <span
        style={{
          ...LABEL,
          fontSize: 18,
          color: INK,
          background: WHITE,
          border: `3px solid ${INK}`,
          borderRadius: 6,
          padding: '5px 8px',
        }}
      >
        {cat}
      </span>
    </div>
    <span style={{ ...LABEL, fontWeight: 500, letterSpacing: '0.04em' }}>{installs}</span>
  </Box>
);

const Plugins: Page = () => (
  <Stage>
    <Head tag="08 · Ecosystem">
      140 plugins. <Mark fill={PINK}>Zero glue code.</Mark>
    </Head>
    <p
      style={{
        ...abs(120, 296),
        margin: 0,
        fontSize: 30,
        fontWeight: 500,
        letterSpacing: '-0.01em',
      }}
    >
      <Code>yard add kafka</Code> wires config, ports and health checks for you.
    </p>
    <PluginTile
      x={120}
      y={380}
      fill={BLUE}
      color={WHITE}
      name="postgres"
      cat="data"
      installs="212k installs · official"
      delay={0}
    />
    <PluginTile
      x={548}
      y={380}
      fill={PINK}
      name="kafka"
      cat="queue"
      installs="96k installs · official"
      delay={70}
    />
    <PluginTile
      x={976}
      y={380}
      fill={MINT}
      name="s3-local"
      cat="mock"
      installs="121k installs"
      delay={140}
    />
    <PluginTile
      x={1404}
      y={380}
      fill={YELLOW}
      name="tls-local"
      cat="infra"
      installs="140k installs · official"
      delay={210}
    />
    <PluginTile
      x={120}
      y={548}
      fill={MINT}
      name="mail-catch"
      cat="mock"
      installs="87k installs"
      delay={70}
    />
    <PluginTile
      x={548}
      y={548}
      fill={BLUE}
      color={WHITE}
      name="redis"
      cat="data"
      installs="188k installs · official"
      delay={140}
    />
    <PluginTile
      x={976}
      y={548}
      fill={YELLOW}
      name="cron"
      cat="infra"
      installs="52k installs"
      delay={210}
    />
    <PluginTile
      x={1404}
      y={548}
      fill={PINK}
      name="nats"
      cat="queue"
      installs="33k installs"
      delay={280}
    />
    <PluginTile
      x={120}
      y={716}
      fill={YELLOW}
      name="temporal"
      cat="infra"
      installs="29k installs"
      delay={140}
    />
    <PluginTile
      x={548}
      y={716}
      fill={MINT}
      name="oauth-mock"
      cat="mock"
      installs="64k installs"
      delay={210}
    />
    <PluginTile
      x={976}
      y={716}
      fill={PINK}
      name="rabbitmq"
      cat="queue"
      installs="58k installs"
      delay={280}
    />
    <PluginTile
      x={1404}
      y={716}
      fill={BLUE}
      color={WHITE}
      name="clickhouse"
      cat="data"
      installs="41k installs"
      delay={350}
    />
    <Sticker x={600} y={686} rot={-5} fill={YELLOW} size={20} delay={700}>
      New in 2.0
    </Sticker>
    <Sticker x={1560} y={884} rot={3} fill={WHITE} size={20} delay={800}>
      + 128 more
    </Sticker>
  </Stage>
);

const PX_PER_S = 2.95;
const CHART_X = 600;

const BenchRow = ({
  y,
  name,
  meta,
  secs,
  value,
  fill,
  color = INK,
  delay,
}: {
  y: number;
  name: string;
  meta: string;
  secs: number;
  value: string;
  fill: string;
  color?: string;
  delay: number;
}) => {
  const live = useIsActivePage();
  const w = Math.max(18, Math.round(secs * PX_PER_S));
  const inside = w > 300;
  return (
    <>
      <div style={{ ...abs(120, y + 10), width: 450 }}>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {name}
        </div>
        <div style={{ ...LABEL, fontWeight: 500, color: DIM, marginTop: 10 }}>{meta}</div>
      </div>
      <div
        className={live ? 'sy-anim' : undefined}
        style={{
          ...abs(CHART_X, y),
          width: w,
          height: 96,
          boxSizing: 'border-box',
          background: fill,
          color,
          border: `${B}px solid ${INK}`,
          borderRadius: 10,
          boxShadow: `8px 8px 0 0 ${INK}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: inside ? '0 22px' : 0,
          zIndex: 2,
          transformOrigin: 'left center',
          animation: live ? `sy-growx 420ms ${SNAP} ${delay}ms both` : undefined,
        }}
      >
        {inside && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 38,
              fontWeight: 700,
              background: WHITE,
              color: INK,
              border: `4px solid ${INK}`,
              borderRadius: 8,
              padding: '4px 12px',
            }}
          >
            {value}
          </span>
        )}
      </div>
      {!inside && (
        <span
          style={{
            ...abs(CHART_X + w + 32, y + 14),
            fontFamily: MONO,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1,
            background: YELLOW,
            border: `${B}px solid ${INK}`,
            borderRadius: 10,
            boxShadow: `6px 6px 0 0 ${INK}`,
            padding: '6px 16px',
            zIndex: 3,
          }}
        >
          {value}
        </span>
      )}
    </>
  );
};

const GridLine = ({ min }: { min: number }) => (
  <>
    <div
      style={{
        ...abs(CHART_X + min * 60 * PX_PER_S - 1, 350),
        width: 2,
        height: 500,
        background:
          'repeating-linear-gradient(180deg, rgba(11,11,11,0.28) 0 8px, transparent 8px 16px)',
        zIndex: 1,
      }}
    />
    <span
      style={{
        ...abs(CHART_X + min * 60 * PX_PER_S - 30, 866),
        width: 60,
        textAlign: 'center',
        ...LABEL,
        fontWeight: 500,
        color: DIM,
      }}
    >
      {min === 0 ? '0' : `${min}m`}
    </span>
  </>
);

const Benchmark: Page = () => (
  <Stage>
    <Head tag="09 · Benchmark">
      Cold boot, <Mark fill={YELLOW}>head to head.</Mark>
    </Head>
    <p
      style={{
        ...abs(120, 296),
        margin: 0,
        ...LABEL,
        fontWeight: 500,
        color: DIM,
        letterSpacing: '0.04em',
      }}
    >
      shop-demo · 6 services · 2.1 GB of images · M3 Pro, 36 GB · cache cold · median of 50 runs
    </p>
    <GridLine min={0} />
    <GridLine min={1} />
    <GridLine min={2} />
    <GridLine min={3} />
    <GridLine min={4} />
    <GridLine min={5} />
    <GridLine min={6} />
    <div style={{ ...abs(CHART_X, 850), width: 1180, height: 5, background: INK }} />
    <BenchRow
      y={370}
      name="Hosted PR previews"
      meta="avg of 3 vendors"
      secs={400}
      value="6m 40s"
      fill={HATCH}
      delay={100}
    />
    <BenchRow
      y={490}
      name="Raw containers"
      meta="compose up, no cache"
      secs={291}
      value="4m 51s"
      fill={HATCH}
      delay={220}
    />
    <BenchRow
      y={610}
      name="Stackyard 1.9"
      meta="last year's release"
      secs={252}
      value="4m 12s"
      fill={PINK}
      delay={340}
    />
    <BenchRow
      y={730}
      name="Stackyard 2.0"
      meta="snapshot boot"
      secs={2.8}
      value="2.8s"
      fill={YELLOW}
      delay={460}
    />
    <Burst x={1500} y={640} size={200} rot={-8} fill={BLUE} color={WHITE} delay={760}>
      <span style={{ fontSize: 62, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.04em' }}>
        90×
      </span>
      <span style={{ ...LABEL, fontSize: 18, marginTop: 6 }}>vs 1.9</span>
    </Burst>
  </Stage>
);

const Feature = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 44 }}>
    <span
      style={{
        width: 18,
        height: 18,
        flex: 'none',
        background: INK,
        borderRadius: 3,
      }}
    />
    <span style={{ fontSize: 28, fontWeight: 500, whiteSpace: 'nowrap' }}>{children}</span>
  </div>
);

const PriceCard = ({
  x,
  y,
  tier,
  bar,
  price,
  per,
  cta,
  ctaFill,
  ctaColor = INK,
  sh = 10,
  delay,
  children,
}: {
  x: number;
  y: number;
  tier: string;
  bar: string;
  price: string;
  per: string;
  cta: string;
  ctaFill: string;
  ctaColor?: string;
  sh?: number;
  delay: number;
  children: ReactNode;
}) => (
  <Win x={x} y={y} w={520} h={580} bar={bar} title={tier} sh={sh} delay={delay} pad="26px 34px">
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
      <span style={{ fontSize: 96, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1 }}>
        {price}
      </span>
      <span style={{ ...LABEL, fontWeight: 500, color: DIM }}>{per}</span>
    </div>
    <div
      style={{
        marginTop: 22,
        paddingTop: 18,
        borderTop: `4px solid ${INK}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {children}
    </div>
    <div
      style={{
        ...abs(34, 392),
        width: 442,
        height: 72,
        boxSizing: 'border-box',
        background: ctaFill,
        color: ctaColor,
        border: `4px solid ${INK}`,
        borderRadius: 10,
        boxShadow: `6px 6px 0 0 ${INK}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}
    >
      {cta}
    </div>
  </Win>
);

const Pricing: Page = () => (
  <Stage>
    <Head tag="10 · Pricing">
      Free for you. <Mark fill={MINT}>Fair for teams.</Mark>
    </Head>
    <PriceCard
      x={120}
      y={330}
      tier="hobby"
      bar={WHITE}
      price="$0"
      per="forever"
      cta="brew install yard"
      ctaFill={WHITE}
      delay={0}
    >
      <Feature>Unlimited local envs</Feature>
      <Feature>All 140 plugins</Feature>
      <Feature>Share links up to 2 hours</Feature>
      <Feature>Community Discord</Feature>
    </PriceCard>
    <PriceCard
      x={700}
      y={314}
      tier="team"
      bar={PINK}
      price="$18"
      per="seat / month"
      cta="Start a 30-day trial"
      ctaFill={INK}
      ctaColor={YELLOW}
      sh={18}
      delay={140}
    >
      <Feature>Everything in Hobby</Feature>
      <Feature>Shared snapshot cache</Feature>
      <Feature>Share links up to 30 days</Feature>
      <Feature>SSO, roles &amp; audit log</Feature>
    </PriceCard>
    <PriceCard
      x={1280}
      y={330}
      tier="enterprise"
      bar={BLUE}
      price="Custom"
      per="annual"
      cta="Book a call"
      ctaFill={WHITE}
      delay={280}
    >
      <Feature>Private plugin registry</Feature>
      <Feature>Self-hosted share relay</Feature>
      <Feature>99.9% uptime SLA</Feature>
      <Feature>Named support engineer</Feature>
    </PriceCard>
    <Sticker x={1036} y={284} rot={7} fill={YELLOW} delay={520}>
      Most picked
    </Sticker>
  </Stage>
);

const RoadCard = ({
  x,
  q,
  fill,
  color = INK,
  status,
  title,
  pct,
  children,
}: {
  x: number;
  q: string;
  fill: string;
  color?: string;
  status: string;
  title: string;
  pct: number;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <>
      <div
        className={live ? 'sy-stp' : undefined}
        style={{
          ...abs(x, 383),
          boxSizing: 'border-box',
          background: fill,
          color,
          border: `4px solid ${INK}`,
          borderRadius: 10,
          boxShadow: `6px 6px 0 0 ${INK}`,
          ...vars({ '--sy-s': '6px' }),
          padding: '10px 16px',
          fontFamily: MONO,
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        {q}
      </div>
      <Box
        x={x}
        y={480}
        w={384}
        h={420}
        sh={10}
        step
        style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column' }}
      >
        <span
          style={{
            ...LABEL,
            fontSize: 18,
            alignSelf: 'flex-start',
            background: fill,
            color,
            border: `3px solid ${INK}`,
            borderRadius: 6,
            padding: '6px 10px',
          }}
        >
          {status}
        </span>
        <span
          style={{
            marginTop: 22,
            fontSize: 42,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </span>
        <span style={{ marginTop: 16, fontSize: 28, fontWeight: 500, lineHeight: 1.4 }}>
          {children}
        </span>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...LABEL, fontSize: 18, color: DIM }}>progress</span>
          <span style={{ ...LABEL, fontSize: 18 }}>{pct}%</span>
        </div>
        <div
          style={{
            marginTop: 10,
            height: 30,
            boxSizing: 'border-box',
            border: `4px solid ${INK}`,
            borderRadius: 7,
            background: `repeating-linear-gradient(90deg, transparent 0 28px, rgba(11,11,11,0.12) 28px 31px), ${WHITE}`,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              boxSizing: 'border-box',
              background: fill,
              borderRight: pct < 100 ? `4px solid ${INK}` : undefined,
              borderRadius: 3,
            }}
          />
        </div>
      </Box>
    </>
  );
};

const Roadmap: Page = () => (
  <Stage>
    <Head tag="11 · Roadmap">
      What ships <Mark fill={YELLOW}>next.</Mark>
    </Head>
    <div
      style={{
        ...abs(120, 402),
        width: 1680,
        height: 14,
        background: INK,
        borderRadius: 7,
      }}
    />
    <Steps>
      <Step duration={60}>
        <RoadCard
          x={120}
          q="Q4 '26"
          fill={YELLOW}
          status="beta · Nov 18"
          title="Native Windows"
          pct={80}
        >
          Snapshot boot without WSL. Same 2.8s, same yard.toml.
        </RoadCard>
      </Step>
      <Step duration={60}>
        <RoadCard
          x={552}
          q="Q1 '27"
          fill={PINK}
          status="building"
          title="Multi-repo stacks"
          pct={45}
        >
          Boot frontend, API and workers from three repos as one env.
        </RoadCard>
      </Step>
      <Step duration={60}>
        <RoadCard x={984} q="Q2 '27" fill={MINT} status="in design" title="GPU previews" pct={20}>
          Attach a local or remote GPU to any service for ML features.
        </RoadCard>
      </Step>
      <Step duration={60}>
        <RoadCard
          x={1416}
          q="Q3 '27"
          fill={BLUE}
          color={WHITE}
          status="exploring"
          title="Snapshot sync"
          pct={5}
        >
          Pull a teammate's exact env state, data included.
        </RoadCard>
      </Step>
    </Steps>
  </Stage>
);

const MiniBar = ({ x, h, delay }: { x: number; h: number; delay: number }) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'sy-anim' : undefined}
      style={{
        ...abs(x, 200 - h),
        width: 28,
        height: h,
        boxSizing: 'border-box',
        background: YELLOW,
        border: `4px solid ${INK}`,
        borderRadius: 5,
        transformOrigin: 'bottom center',
        animation: live ? `sy-growy 320ms ${SNAP} ${delay}ms both` : undefined,
      }}
    />
  );
};

const StarShape = () => (
  <svg width="210" height="210" viewBox="0 0 200 200" aria-hidden>
    <polygon
      points={burstPoints(5, 92, 40, 100)}
      transform="translate(8 8)"
      style={{ fill: INK }}
    />
    <polygon
      points={burstPoints(5, 92, 40, 100)}
      style={{ fill: PINK, stroke: INK, strokeWidth: 6, strokeLinejoin: 'round' }}
    />
  </svg>
);

const BigStat = ({ value, label, size = 110 }: { value: string; label: string; size?: number }) => (
  <>
    <div
      style={{
        fontSize: size,
        fontWeight: 700,
        lineHeight: 0.9,
        letterSpacing: '-0.05em',
      }}
    >
      {value}
    </div>
    <div style={{ marginTop: 16, fontSize: 30, fontWeight: 500, lineHeight: 1.25 }}>{label}</div>
  </>
);

const Community: Page = () => (
  <Stage>
    <Head tag="12 · Community">
      Built <Mark fill={PINK}>in the open.</Mark>
    </Head>
    <Box
      x={120}
      y={330}
      w={640}
      h={570}
      fill={YELLOW}
      sh={14}
      delay={0}
      style={{ padding: '36px 40px' }}
    >
      <div style={{ ...LABEL }}>github stars</div>
      <div style={{ marginTop: 26 }}>
        <BigStat value="48.2k" label="+11.4k since 1.0 shipped in March." size={180} />
      </div>
      <div style={{ ...abs(370, 290), transform: 'rotate(14deg)' }}>
        <StarShape />
      </div>
    </Box>
    <Box
      x={800}
      y={330}
      w={480}
      h={260}
      fill={PINK}
      sh={10}
      delay={120}
      style={{ padding: '30px 34px' }}
    >
      <BigStat value="1,940" label="contributors in 61 countries" />
    </Box>
    <Box
      x={1320}
      y={330}
      w={480}
      h={260}
      fill={MINT}
      sh={10}
      delay={200}
      style={{ padding: '30px 34px' }}
    >
      <BigStat value="31k" label="builders on Discord" />
    </Box>
    <Box
      x={800}
      y={630}
      w={1000}
      h={270}
      fill={BLUE}
      color={WHITE}
      sh={10}
      delay={280}
      style={{ padding: '30px 34px' }}
    >
      <div style={{ width: 430 }}>
        <BigStat value="2.1M" label="envs booted last week" size={120} />
      </div>
      <div style={{ ...abs(500, 20), width: 450, height: 200 }}>
        <span style={{ ...abs(0, -2), ...LABEL, fontSize: 18, color: YELLOW }}>12 weeks</span>
        <MiniBar x={0} h={46} delay={420} />
        <MiniBar x={38} h={52} delay={450} />
        <MiniBar x={76} h={50} delay={480} />
        <MiniBar x={114} h={62} delay={510} />
        <MiniBar x={152} h={70} delay={540} />
        <MiniBar x={190} h={68} delay={570} />
        <MiniBar x={228} h={84} delay={600} />
        <MiniBar x={266} h={96} delay={630} />
        <MiniBar x={304} h={104} delay={660} />
        <MiniBar x={342} h={122} delay={690} />
        <MiniBar x={380} h={150} delay={720} />
        <MiniBar x={418} h={172} delay={750} />
      </div>
    </Box>
    <Sticker x={470} y={312} rot={-6} fill={WHITE} delay={600}>
      Thank you!
    </Sticker>
  </Stage>
);

const InstallRow = ({
  y,
  os,
  fill,
  color = INK,
  cmd,
  delay,
}: {
  y: number;
  os: string;
  fill: string;
  color?: string;
  cmd: string;
  delay: number;
}) => (
  <>
    <Box
      x={120}
      y={y}
      w={300}
      h={96}
      fill={fill}
      color={color}
      sh={8}
      delay={delay}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        fontWeight: 700,
        letterSpacing: '-0.02em',
      }}
    >
      {os}
    </Box>
    <Box
      x={460}
      y={y}
      w={1340}
      h={96}
      fill={TERM}
      color={CREAM}
      sh={8}
      delay={delay + 80}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px 0 34px',
        fontFamily: MONO,
        fontSize: 34,
        fontWeight: 500,
        whiteSpace: 'pre',
      }}
    >
      <span style={{ color: PINK, fontWeight: 700 }}>$ </span>
      {cmd}
      <span
        style={{
          marginLeft: 'auto',
          ...LABEL,
          fontSize: 18,
          color: INK,
          background: YELLOW,
          border: `3px solid ${CREAM}`,
          borderRadius: 6,
          padding: '8px 12px',
        }}
      >
        copy
      </span>
    </Box>
  </>
);

const Install: Page = () => (
  <Stage>
    <Head tag="13 · Get it">
      Install in <Mark fill={YELLOW}>one line.</Mark>
    </Head>
    <Sticker x={1500} y={196} rot={4} fill={MINT} size={24} delay={500}>
      v2.0.0 · MIT
    </Sticker>
    <InstallRow y={330} os="macOS" fill={YELLOW} cmd="brew install stackyard/tap/yard" delay={0} />
    <InstallRow
      y={450}
      os="Linux"
      fill={MINT}
      cmd="curl -fsSL get.stackyard.dev | sh"
      delay={100}
    />
    <InstallRow y={570} os="Node" fill={PINK} cmd="npm i -g @stackyard/cli" delay={200} />
    <InstallRow y={720} os="then →" fill={WHITE} cmd="yard init && yard up" delay={360} />
    <p
      style={{
        ...abs(120, 866),
        margin: 0,
        fontSize: 32,
        fontWeight: 500,
        letterSpacing: '-0.01em',
      }}
    >
      Already on 1.x? <Code>yard migrate</Code> converts your config in place.
    </p>
  </Stage>
);

const LinkBox = ({
  x,
  fill,
  label,
  value,
  delay,
}: {
  x: number;
  fill: string;
  label: string;
  value: string;
  delay: number;
}) => (
  <Box
    x={x}
    y={790}
    w={520}
    h={120}
    fill={fill}
    sh={10}
    delay={delay}
    style={{
      padding: '20px 28px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <span style={{ ...LABEL }}>{label}</span>
    <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
      {value}
    </span>
  </Box>
);

const Close: Page = () => (
  <Stage footer={false}>
    <Sticker x={120} y={118} rot={-3} fill={PINK} delay={600}>
      Thanks, launch week
    </Sticker>
    <Box
      x={120}
      y={222}
      fill={YELLOW}
      sh={22}
      delay={60}
      style={{
        padding: '24px 56px 34px',
        fontFamily: MONO,
        fontSize: 200,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: PINK, WebkitTextStroke: `6px ${INK}`, paintOrder: 'stroke fill' }}>
        $
      </span>{' '}
      yard up
      <Cursor color={INK} />
    </Box>
    <Burst x={1500} y={170} size={290} rot={10} fill={BLUE} color={WHITE} delay={460}>
      <span style={{ fontSize: 100, fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.05em' }}>
        2.0
      </span>
      <span style={{ ...LABEL, fontSize: 22, marginTop: 10, color: YELLOW }}>out now</span>
    </Burst>
    <h2
      style={{
        ...abs(120, 590),
        margin: 0,
        fontFamily: DISPLAY,
        fontSize: 96,
        fontWeight: 700,
        lineHeight: 1.08,
        letterSpacing: '-0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      Stop waiting. <Mark fill={MINT}>Start shipping.</Mark>
    </h2>
    <LinkBox x={120} fill={MINT} label="docs" value="stackyard.dev/2" delay={300} />
    <LinkBox x={700} fill={WHITE} label="source" value="gh: stackyard/yard" delay={380} />
    <LinkBox x={1280} fill={PINK} label="find us" value="Booth B12 · stickers" delay={460} />
  </Stage>
);

export const notes: (string | undefined)[] = [
  `Hi everyone. I'm going to spend twelve minutes on one number: two point eight seconds.
That's how long it now takes Stackyard to boot a full preview environment on your laptop, cold.
Stackyard CLI 2.0 is out today — you can install it before I finish talking.`,
  `Let's start with where we were. On a real six-service app, our own 1.9 took four minutes and twelve seconds to cold boot.
Walk the bar left to right: ninety-six seconds pulling images, seventy-one installing deps, almost a minute seeding the database, and the rest on DNS and certificates.
None of that is your code. It's all ceremony.`,
  `Here's why that matters. Our opted-in teams cold-boot about fourteen times a day per developer — new branches, broken states, reviewing someone's PR.
Fourteen times four-twelve is fifty-nine minutes. An hour a day.
Pause here. Then: for a forty-person team, that's thirty-nine hours a day of people watching spinners.`,
  `So 2.0 makes four moves. Quick tour, one breath each.
Snapshot boot: we fork a warm environment instead of building one.
Lazy services: nothing runs until something calls it.
Shared cache: layers dedupe across every repo on your machine.
Share links: your local env, on a public URL, in one command.`,
  `Same repo, same laptop — before and after. Click through each row.
Cold boot: four-twelve to two-point-eight. Warm restart: under a second.
Reseeding the database used to be a coffee break; it's now one point four seconds.
Switching branches is the one people feel most — two minutes down to three and a half seconds.`,
  `How is this possible? Build once, fork forever.
Your yard.toml points at the compose file you already have. CI builds a snapshot — base images, deps, seed data — once a night and on every merge. Forty-one seconds, but you never wait for it.
Your laptop just forks that snapshot copy-on-write. Each fork only owns the bytes it changes, which is why ten environments cost about as much disk as one.`,
  `Let me show you what it feels like. One command: yard up.
It reads your config, forks the snapshot, and services come up in parallel. Notice redis says "asleep" — it hasn't been called yet, so it isn't running.
Click: it reads your existing compose file. Click: idle services cost nothing. Click: every env gets a real hostname with TLS, so cookies and OAuth redirects just work.`,
  `Second command: yard share.
You get a public HTTPS URL that tunnels straight to the env on your laptop. Thirty-one milliseconds median from our EU edge.
No deploy, no CI run. Your designer opens the link, clicks around, and tells you to ship it — which is exactly what Priya did on this PR.`,
  `None of this works if you have to hand-wire every service, so 2.0 ships with a hundred and forty plugins.
yard add kafka gives you the broker, the ports, the health check and the env vars.
Postgres and redis are the big ones, but the mocks are the sleeper hits — s3-local and the new oauth-mock save people from real cloud credentials in dev.`,
  `Now the head-to-head. Same app, same machine, cache cold, median of fifty runs.
Hosted PR previews average six minutes forty. Raw containers, nearly five minutes. Our own 1.9, four-twelve.
And 2.0 is that sliver at the bottom. I had to put a sticker on it because the bar is barely visible.`,
  `Pricing stays simple. Hobby is free forever — everything local, every plugin.
Team is eighteen dollars a seat and adds the shared snapshot cache, which is where the two-second boots really pay off across a team, plus SSO and audit log.
Enterprise is for people who need a private plugin registry or want to run the share relay themselves.`,
  `What's next. Click through.
Native Windows goes to beta on November eighteenth — no WSL.
Then multi-repo stacks in Q1, GPU previews in Q2, and in Q3 we're exploring snapshot sync — pulling a teammate's exact environment, data and all.
Tell us at the booth which of these you want first.`,
  `And none of this happens alone. Forty-eight thousand stars, nearly two thousand contributors in sixty-one countries.
The number I care about most is the blue one: two point one million environments booted last week — and that chart is the last twelve weeks of beta.
Thank you, genuinely.`,
  `Getting it is one line. brew, curl, or npm.
Then yard init and yard up. If you're on 1.x, yard migrate converts your config in place — you don't lose anything.`,
  `That's it. Two words: yard up.
Docs are at stackyard.dev slash two, the source is on GitHub, and we're at booth B12 with stickers until they run out.
Stop waiting. Start shipping. Thank you.`,
];

export const meta: SlideMeta = {
  title: 'Stackyard CLI 2.0 — Launch',
  createdAt: '2026-10-12T12:14:24.167Z',
};

export default [
  Cover,
  Problem,
  TheMath,
  WhatsNew,
  BeforeAfter,
  UnderTheHood,
  WalkUp,
  WalkShare,
  Plugins,
  Benchmark,
  Pricing,
  Roadmap,
  Community,
  Install,
  Close,
] satisfies Page[];

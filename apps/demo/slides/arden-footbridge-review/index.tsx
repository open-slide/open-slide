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
import { type CSSProperties, type ReactNode, useId } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0F3B6E', text: '#EEF5FF', accent: '#8FD8FF' },
  fonts: {
    display: '"Saira Semi Condensed", "Arial Narrow", sans-serif',
    body: '"Saira Semi Condensed", "Arial Narrow", sans-serif',
  },
  typeScale: { hero: 124, body: 30 },
  radius: 0,
};

const BG = '#0F3B6E';
const BG_DEEP = '#0C3360';
const INK = '#EEF5FF';
const CY = '#8FD8FF';
const MUTE = '#9DBEE0';
const FAINT = 'rgba(238,245,255,0.42)';
const GHOST = 'rgba(214,236,255,0.2)';
const AMBER = '#FFD27A';
const MONO = '"Share Tech Mono", ui-monospace, Menlo, monospace';
const HAND = '"Architects Daughter", "Comic Sans MS", cursive';

const SLIDE_ID = 'arden-footbridge-review';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Saira+Semi+Condensed:wght@400;500;600&family=Share+Tech+Mono&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const SHAPES = 'path,line,polyline,polygon,rect,circle,ellipse';
const DRAW_EASE = 'cubic-bezier(0.55, 0, 0.25, 1)';
const KEYFRAMES = `
@keyframes ab-draw { from { stroke-dashoffset: 4000 } to { stroke-dashoffset: 0 } }
@keyframes ab-fill { from { fill-opacity: 0 } }
@keyframes ab-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ab-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes ab-sway { 0%, 100% { transform: scaleY(1) } 50% { transform: scaleY(-1) } }
.ab-on .ab-ink :is(${SHAPES}):not([stroke-dasharray]) { stroke-dasharray: 4000; animation: ab-draw 2.2s ${DRAW_EASE} var(--d, 0s) both; }
.ab-on .ab-ink :is(path,polygon,rect,circle,ellipse):not([stroke-dasharray]):not([fill="none"]) { animation: ab-draw 2.2s ${DRAW_EASE} var(--d, 0s) both, ab-fill 0.9s ease-out calc(var(--d, 0s) + 1.1s) both; }
.ab-on .ab-ink [stroke-dasharray] { animation: ab-fade 1s ease-out calc(var(--d, 0s) + 0.5s) both; }
.ab-on .ab-ink text { animation: ab-fade 0.8s ease-out calc(var(--d, 0s) + 0.8s) both; }
.ab-on .ab-in { animation: ab-rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) var(--d, 0s) both; }
.ab-on [data-osd-step="pending"] :is(.ab-ink *, .ab-in) { animation: none !important; }
.ab-on .ab-sway { animation: ab-sway 2.6s ease-in-out 2.4s infinite; }
@media (prefers-reduced-motion: reduce) {
  .ab-on .ab-ink *, .ab-on .ab-in, .ab-on .ab-sway { animation: none !important; }
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
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 240, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const d = (sec: number) => ({ '--d': `${sec}s` }) as CSSProperties;

const uidOf = (raw: string) => `ab${raw.replace(/[^a-zA-Z0-9]/g, '')}`;

const LABEL: CSSProperties = {
  fontFamily: MONO,
  fontSize: 20,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: CY,
};

const SMALL: CSSProperties = {
  fontFamily: MONO,
  fontSize: 18,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: MUTE,
};

const H2: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontSize: 64,
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: '0.01em',
  textTransform: 'uppercase',
  margin: 0,
  color: 'var(--osd-text)',
};

const tx = (size: number, fill = INK, family = MONO, extra?: CSSProperties): CSSProperties => ({
  fontFamily: family,
  fontSize: size,
  fill,
  letterSpacing: family === MONO ? '0.06em' : undefined,
  ...extra,
});

const HALO: CSSProperties = {
  paintOrder: 'stroke',
  stroke: BG,
  strokeWidth: 7,
  strokeLinejoin: 'round',
};

const noise = (w: number, h: number, freq: string, alpha: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.85 0 0 0 0 0.93 0 0 0 0 1 ${alpha} 0 0 0 0'/></filter><rect width='${w}' height='${h}' filter='url(#n)'/></svg>`,
  )}")`;

const MOTTLE = noise(420, 420, '0.012', 1);
const TOOTH = noise(220, 220, '0.9', 1);

const SHEET_BG: CSSProperties = {
  backgroundColor: 'var(--osd-bg)',
  backgroundImage: [
    'radial-gradient(ellipse 90% 85% at 50% 45%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 55%, rgba(3,16,40,0.38) 100%)',
    'linear-gradient(rgba(214,236,255,0.085) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(214,236,255,0.085) 1px, transparent 1px)',
    'linear-gradient(rgba(214,236,255,0.035) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(214,236,255,0.035) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '100% 100%, 112px 112px, 112px 112px, 22.4px 22.4px, 22.4px 22.4px',
  backgroundPosition: '0 0, 64px 64px, 64px 64px, 64px 64px, 64px 64px',
};

const Svg = ({ children, className = 'ab-ink' }: { children: ReactNode; className?: string }) => (
  <svg
    width={1920}
    height={1080}
    viewBox="0 0 1920 1080"
    className={className}
    style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
  >
    {children}
  </svg>
);

const ZoneCol = ({ k, n }: { k: number; n: string }) => {
  const x = 64 + k * 224;
  return (
    <g>
      {k > 0 && <line x1={x} y1={32} x2={x} y2={64} stroke={FAINT} strokeWidth={1.2} />}
      {k > 0 && <line x1={x} y1={1016} x2={x} y2={1048} stroke={FAINT} strokeWidth={1.2} />}
      <text x={x + 112} y={55} textAnchor="middle" style={tx(18, MUTE)}>
        {n}
      </text>
      <text x={x + 112} y={1039} textAnchor="middle" style={tx(18, MUTE)}>
        {n}
      </text>
    </g>
  );
};

const ZoneRow = ({ k, n }: { k: number; n: string }) => {
  const y = 64 + k * (952 / 6);
  return (
    <g>
      {k > 0 && <line x1={32} y1={y} x2={64} y2={y} stroke={FAINT} strokeWidth={1.2} />}
      {k > 0 && <line x1={1856} y1={y} x2={1888} y2={y} stroke={FAINT} strokeWidth={1.2} />}
      <text x={48} y={y + 952 / 12 + 6} textAnchor="middle" style={tx(18, MUTE)}>
        {n}
      </text>
      <text x={1872} y={y + 952 / 12 + 6} textAnchor="middle" style={tx(18, MUTE)}>
        {n}
      </text>
    </g>
  );
};

const Frame = () => (
  <svg
    width={1920}
    height={1080}
    viewBox="0 0 1920 1080"
    style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
  >
    <rect x={32} y={32} width={1856} height={1016} fill="none" stroke={FAINT} strokeWidth={1.4} />
    <rect x={64} y={64} width={1792} height={952} fill="none" stroke={INK} strokeWidth={2.6} />
    <ZoneCol k={0} n="1" />
    <ZoneCol k={1} n="2" />
    <ZoneCol k={2} n="3" />
    <ZoneCol k={3} n="4" />
    <ZoneCol k={4} n="5" />
    <ZoneCol k={5} n="6" />
    <ZoneCol k={6} n="7" />
    <ZoneCol k={7} n="8" />
    <ZoneRow k={0} n="A" />
    <ZoneRow k={1} n="B" />
    <ZoneRow k={2} n="C" />
    <ZoneRow k={3} n="D" />
    <ZoneRow k={4} n="E" />
    <ZoneRow k={5} n="F" />
    <polygon points="960,64 950,46 970,46" fill={INK} />
    <polygon points="960,1016 950,1034 970,1034" fill={INK} />
    <polygon points="64,540 46,530 46,550" fill={INK} />
    <polygon points="1856,540 1874,530 1874,550" fill={INK} />
  </svg>
);

const Cell = ({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div
    style={{
      borderRight: `1.2px solid ${FAINT}`,
      borderBottom: `1.2px solid ${FAINT}`,
      padding: '6px 12px 0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      minWidth: 0,
      ...style,
    }}
  >
    <span style={{ ...SMALL, lineHeight: 1.2 }}>{label}</span>
    {children}
  </div>
);

const TitleBlock = ({ title, scale }: { title: string; scale: string }) => {
  const { current, total } = useSlidePageNumber();
  const n = String(current).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 1216,
        top: 848,
        width: 640,
        height: 168,
        boxSizing: 'border-box',
        borderTop: `2.6px solid ${INK}`,
        borderLeft: `2.6px solid ${INK}`,
        background: BG_DEEP,
        display: 'grid',
        gridTemplateColumns: '1fr 150px',
        gridTemplateRows: '46px 61px 1fr',
        color: INK,
      }}
    >
      <div
        style={{
          gridColumn: '1 / 3',
          borderBottom: `1.2px solid ${FAINT}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Kestrel &amp; Vane Engineers
        </span>
        <span style={SMALL}>For City of Halbrook</span>
      </div>
      <Cell label={`Drawing · KV-2417-S-${100 + current}`}>
        <span
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 600,
            fontSize: 23,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      </Cell>
      <div
        style={{
          gridRow: '2 / 4',
          gridColumn: '2',
          borderBottom: `1.2px solid ${FAINT}`,
          padding: '8px 12px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span style={SMALL}>Sheet</span>
        <span
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 600,
            fontSize: 54,
            lineHeight: 1.05,
            color: CY,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {n}
        </span>
        <span style={SMALL}>of {String(total).padStart(2, '0')}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.9fr 0.9fr' }}>
        <Cell label="Scale">
          <span style={{ fontFamily: MONO, fontSize: 22, lineHeight: 1.3 }}>{scale}</span>
        </Cell>
        <Cell label="Rev">
          <span style={{ fontFamily: MONO, fontSize: 22, lineHeight: 1.3, color: AMBER }}>C</span>
        </Cell>
        <Cell label="Drn">
          <span style={{ fontFamily: MONO, fontSize: 22, lineHeight: 1.3 }}>R.O.</span>
        </Cell>
        <Cell label="Chk">
          <span style={{ fontFamily: MONO, fontSize: 22, lineHeight: 1.3 }}>M.L.</span>
        </Cell>
      </div>
    </div>
  );
};

const Sheet = ({
  title,
  scale = 'NTS',
  label,
  heading,
  children,
}: {
  title: string;
  scale?: string;
  label?: string;
  heading?: string;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'ab-on' : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate',
        color: 'var(--osd-text)',
        fontFamily: 'var(--osd-font-body)',
        ...SHEET_BG,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: MOTTLE,
          backgroundSize: '840px 840px',
          opacity: 0.09,
          mixBlendMode: 'soft-light',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: TOOTH,
          backgroundSize: '220px 220px',
          opacity: 0.05,
        }}
      />
      {label && (
        <div className="ab-in" style={abs(120, 104, LABEL)}>
          {label}
        </div>
      )}
      {heading && (
        <h2 className="ab-in" style={{ ...abs(120, 140), ...H2, ...d(0.08) }}>
          {heading}
        </h2>
      )}
      {children}
      <TitleBlock title={title} scale={scale} />
      <Frame />
    </div>
  );
};

const Head = ({
  x,
  y,
  ang,
  c = CY,
  l = 13,
  w = 4.2,
}: {
  x: number;
  y: number;
  ang: number;
  c?: string;
  l?: number;
  w?: number;
}) => {
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const bx = x - ca * l;
  const by = y - sa * l;
  return (
    <polygon
      points={`${x},${y} ${bx - sa * w},${by + ca * w} ${bx + sa * w},${by - ca * w}`}
      fill={c}
    />
  );
};

const DimH = ({
  x1,
  x2,
  y,
  text,
  from1,
  from2,
  c = CY,
  tick = false,
  below = false,
  fs = 20,
}: {
  x1: number;
  x2: number;
  y: number;
  text: string;
  from1?: number;
  from2?: number;
  c?: string;
  tick?: boolean;
  below?: boolean;
  fs?: number;
}) => {
  const ext = (x: number, from?: number) =>
    from === undefined ? null : (
      <line
        x1={x}
        y1={from + (from > y ? -6 : 6)}
        x2={x}
        y2={y + (from > y ? -10 : 10)}
        stroke={c}
        strokeWidth={1.1}
      />
    );
  return (
    <g>
      {ext(x1, from1)}
      {ext(x2, from2)}
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={1.3} />
      {tick ? (
        <>
          <line x1={x1 - 7} y1={y + 7} x2={x1 + 7} y2={y - 7} stroke={c} strokeWidth={2.2} />
          <line x1={x2 - 7} y1={y + 7} x2={x2 + 7} y2={y - 7} stroke={c} strokeWidth={2.2} />
        </>
      ) : (
        <>
          <Head x={x1} y={y} ang={Math.PI} c={c} />
          <Head x={x2} y={y} ang={0} c={c} />
        </>
      )}
      <text
        x={(x1 + x2) / 2}
        y={below ? y + fs + 6 : y - 8}
        textAnchor="middle"
        style={{ ...tx(fs, c), ...HALO }}
      >
        {text}
      </text>
    </g>
  );
};

const DimV = ({
  y1,
  y2,
  x,
  text,
  from1,
  from2,
  c = CY,
  right = false,
  fs = 20,
}: {
  y1: number;
  y2: number;
  x: number;
  text: string;
  from1?: number;
  from2?: number;
  c?: string;
  right?: boolean;
  fs?: number;
}) => {
  const ext = (y: number, from?: number) =>
    from === undefined ? null : (
      <line
        x1={from + (from > x ? -6 : 6)}
        y1={y}
        x2={x + (from > x ? -10 : 10)}
        y2={y}
        stroke={c}
        strokeWidth={1.1}
      />
    );
  const ty = (y1 + y2) / 2;
  const tx0 = right ? x + 10 + fs * 0.4 : x - 8;
  return (
    <g>
      {ext(y1, from1)}
      {ext(y2, from2)}
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={c} strokeWidth={1.3} />
      <Head x={x} y={Math.min(y1, y2)} ang={-Math.PI / 2} c={c} />
      <Head x={x} y={Math.max(y1, y2)} ang={Math.PI / 2} c={c} />
      <text
        transform={`translate(${tx0},${ty}) rotate(-90)`}
        textAnchor="middle"
        style={{ ...tx(fs, c), ...HALO }}
      >
        {text}
      </text>
    </g>
  );
};

const Level = ({
  x1,
  x2,
  y,
  text,
  c = INK,
  right = false,
}: {
  x1: number;
  x2: number;
  y: number;
  text: string;
  c?: string;
  right?: boolean;
}) => {
  const tri = right ? x2 - 30 : x1 + 30;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={1.1} />
      <polygon
        points={`${tri},${y} ${tri - 8},${y - 13} ${tri + 8},${y - 13}`}
        fill="none"
        stroke={c}
        strokeWidth={1.4}
      />
      <text
        x={right ? x2 - 46 : x1 + 46}
        y={y - 7}
        textAnchor={right ? 'end' : 'start'}
        style={{ ...tx(18, c), ...HALO }}
      >
        {text}
      </text>
    </g>
  );
};

const Leader = ({
  pts,
  text,
  sub,
  c = INK,
  tc,
  fs = 20,
  end = false,
}: {
  pts: number[];
  text: string;
  sub?: string;
  c?: string;
  tc?: string;
  fs?: number;
  end?: boolean;
}) => {
  const n = pts.length;
  const lx = pts[n - 2];
  const ly = pts[n - 1];
  const pairs: string[] = [];
  for (let i = 0; i < n; i += 2) pairs.push(`${pts[i]},${pts[i + 1]}`);
  return (
    <g>
      <circle cx={pts[0]} cy={pts[1]} r={3.6} fill={c} />
      <polyline points={pairs.join(' ')} fill="none" stroke={c} strokeWidth={1.2} />
      <text
        x={end ? lx - 8 : lx + 8}
        y={ly + fs * 0.34}
        textAnchor={end ? 'end' : 'start'}
        style={{ ...tx(fs, tc ?? c), ...HALO }}
      >
        {text}
      </text>
      {sub && (
        <text
          x={end ? lx - 8 : lx + 8}
          y={ly + fs * 0.34 + fs + 4}
          textAnchor={end ? 'end' : 'start'}
          style={{ ...tx(18, MUTE), ...HALO }}
        >
          {sub}
        </text>
      )}
    </g>
  );
};

const Tag = ({
  x,
  y,
  n,
  c = CY,
  r = 16,
}: {
  x: number;
  y: number;
  n: string;
  c?: string;
  r?: number;
}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={BG} stroke={c} strokeWidth={1.6} />
    <text x={x} y={y + 6.5} textAnchor="middle" style={tx(18, c)}>
      {n}
    </text>
  </g>
);

const GridBubble = ({ x, y, n, to }: { x: number; y: number; n: string; to: number }) => (
  <g>
    <line
      x1={x}
      y1={y + 20}
      x2={x}
      y2={to}
      stroke={FAINT}
      strokeWidth={1}
      strokeDasharray="22 6 4 6"
    />
    <circle cx={x} cy={y} r={20} fill={BG} stroke={INK} strokeWidth={1.6} />
    <text x={x} y={y + 6.5} textAnchor="middle" style={tx(18, INK)}>
      {n}
    </text>
  </g>
);

const SectionCut = ({
  x,
  y1,
  y2,
  n,
  dir = 1,
}: {
  x: number;
  y1: number;
  y2: number;
  n: string;
  dir?: 1 | -1;
}) => (
  <g>
    <line x1={x} y1={y1} x2={x} y2={y2} stroke={CY} strokeWidth={1.2} strokeDasharray="26 6 4 6" />
    <line x1={x} y1={y1} x2={x} y2={y1 + 26} stroke={CY} strokeWidth={4} />
    <line x1={x} y1={y2 - 26} x2={x} y2={y2} stroke={CY} strokeWidth={4} />
    <line x1={x} y1={y1} x2={x + dir * 26} y2={y1} stroke={CY} strokeWidth={1.6} />
    <Head x={x + dir * 30} y={y1} ang={dir > 0 ? 0 : Math.PI} />
    <line x1={x} y1={y2} x2={x + dir * 26} y2={y2} stroke={CY} strokeWidth={1.6} />
    <Head x={x + dir * 30} y={y2} ang={dir > 0 ? 0 : Math.PI} />
    <circle cx={x} cy={y1 - 20} r={17} fill={BG} stroke={CY} strokeWidth={1.6} />
    <text x={x} y={y1 - 13.5} textAnchor="middle" style={tx(20, CY)}>
      {n}
    </text>
    <circle cx={x} cy={y2 + 20} r={17} fill={BG} stroke={CY} strokeWidth={1.6} />
    <text x={x} y={y2 + 26.5} textAnchor="middle" style={tx(20, CY)}>
      {n}
    </text>
  </g>
);

const SectionCutH = ({ y, x1, x2, n }: { y: number; x1: number; x2: number; n: string }) => (
  <g>
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={CY} strokeWidth={1.2} strokeDasharray="10 4 3 4" />
    <line x1={x1} y1={y} x2={x1 + 12} y2={y} stroke={CY} strokeWidth={4} />
    <line x1={x2 - 12} y1={y} x2={x2} y2={y} stroke={CY} strokeWidth={4} />
    <line x1={x1} y1={y} x2={x1} y2={y + 20} stroke={CY} strokeWidth={1.6} />
    <Head x={x1} y={y + 26} ang={Math.PI / 2} />
    <line x1={x2} y1={y} x2={x2} y2={y + 20} stroke={CY} strokeWidth={1.6} />
    <Head x={x2} y={y + 26} ang={Math.PI / 2} />
    <circle cx={x1 - 20} cy={y} r={17} fill={BG} stroke={CY} strokeWidth={1.6} />
    <text x={x1 - 20} y={y + 6.5} textAnchor="middle" style={tx(20, CY)}>
      {n}
    </text>
    <circle cx={x2 + 20} cy={y} r={17} fill={BG} stroke={CY} strokeWidth={1.6} />
    <text x={x2 + 20} y={y + 6.5} textAnchor="middle" style={tx(20, CY)}>
      {n}
    </text>
  </g>
);

const NorthArrow = ({ x, y, r = 34 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={1.4} />
    <circle cx={x} cy={y} r={r - 6} fill="none" stroke={FAINT} strokeWidth={1} />
    <polygon points={`${x},${y - r + 2} ${x + 10},${y + 8} ${x},${y + 2}`} fill={INK} />
    <polygon
      points={`${x},${y - r + 2} ${x - 10},${y + 8} ${x},${y + 2}`}
      fill="none"
      stroke={INK}
      strokeWidth={1.2}
    />
    <text x={x} y={y - r - 10} textAnchor="middle" style={tx(22, INK)}>
      N
    </text>
  </g>
);

const ScaleBar = ({ x, y, ppm, label }: { x: number; y: number; ppm: number; label: string }) => {
  const u = 5 * ppm;
  return (
    <g>
      <rect x={x} y={y} width={u} height={10} fill={INK} stroke={INK} strokeWidth={1.2} />
      <rect x={x + u} y={y} width={u} height={10} fill="none" stroke={INK} strokeWidth={1.2} />
      <rect
        x={x + 2 * u}
        y={y}
        width={2 * u}
        height={10}
        fill={INK}
        stroke={INK}
        strokeWidth={1.2}
      />
      <rect
        x={x + 4 * u}
        y={y}
        width={2 * u}
        height={10}
        fill="none"
        stroke={INK}
        strokeWidth={1.2}
      />
      <text x={x} y={y + 34} textAnchor="middle" style={tx(18, MUTE)}>
        0
      </text>
      <text x={x + 2 * u} y={y + 34} textAnchor="middle" style={tx(18, MUTE)}>
        10
      </text>
      <text x={x + 4 * u} y={y + 34} textAnchor="middle" style={tx(18, MUTE)}>
        20
      </text>
      <text x={x + 6 * u} y={y + 34} textAnchor="middle" style={tx(18, MUTE)}>
        30 m
      </text>
      <text x={x} y={y - 12} style={tx(18, MUTE)}>
        {label}
      </text>
    </g>
  );
};

type Geo = { s: number; X: (ch: number) => number; Y: (z: number) => number };

const geo = (s: number, ox: number, yTop: number, zTop = 50.5, sz = s): Geo => ({
  s,
  X: (ch) => ox + ch * s,
  Y: (z) => yTop + (zTop - z) * sz,
});

const cloudPath = (cx: number, cy: number, rx: number, ry: number, n: number) => {
  let p = '';
  let px = cx + rx;
  let py = cy;
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = cx + rx * Math.cos(a);
    const y = cy + ry * Math.sin(a);
    const r = Math.hypot(x - px, y - py) * 0.62;
    p += `${i === 1 ? `M${px.toFixed(1)},${py.toFixed(1)} ` : ''}A${r.toFixed(1)},${r.toFixed(1)} 0 0 1 ${x.toFixed(1)},${y.toFixed(1)} `;
    px = x;
    py = y;
  }
  return `${p}Z`;
};

const pts = (g: Geo, p: number[][]) =>
  p.map(([c, z]) => `${g.X(c).toFixed(1)},${g.Y(z).toFixed(1)}`).join(' ');

const deckZ = (ch: number) => 17.7 + 0.04 * ch;
const PY_TOP = 49.54;
const pyHalf = (z: number) => 0.8 - (0.3 * (z - 15.4)) / (PY_TOP - 15.4);

const GROUND = [
  [-8, 16.2],
  [1, 16.2],
  [4, 14.0],
  [8, 10.2],
  [10, 9.8],
  [30, 9.8],
  [34, 12.0],
  [38, 16.0],
  [49.6, 16.0],
  [49.6, 12.4],
  [61, 12.4],
  [61, 17.8],
  [72, 17.8],
];

const WATER = [
  [5.68, 12.4],
  [8, 10.2],
  [10, 9.8],
  [30, 9.8],
  [34, 12.0],
  [34.4, 12.4],
];

type Part = 'sub' | 'pyLo' | 'pyHi' | 'back' | 'main' | 'bstays' | 'mstays' | 'trestles';
const ALL_PARTS: Part[] = ['sub', 'pyLo', 'pyHi', 'back', 'main', 'bstays', 'mstays'];

const Track = ({ g, c }: { g: Geo; c: number }) => (
  <g>
    <polygon
      points={pts(g, [
        [c - 2.4, 12.4],
        [c - 1.6, 12.75],
        [c + 1.6, 12.75],
        [c + 2.4, 12.4],
      ])}
      fill="none"
      stroke={FAINT}
      strokeWidth={1}
    />
    <rect
      x={g.X(c - 1.3)}
      y={g.Y(12.82)}
      width={2.6 * g.s}
      height={Math.max(2, 0.1 * g.s)}
      fill={MUTE}
    />
    <rect
      x={g.X(c - 0.76)}
      y={g.Y(12.95)}
      width={Math.max(2, 0.08 * g.s)}
      height={Math.max(2, 0.13 * g.s)}
      fill={INK}
    />
    <rect
      x={g.X(c + 0.68)}
      y={g.Y(12.95)}
      width={Math.max(2, 0.08 * g.s)}
      height={Math.max(2, 0.13 * g.s)}
      fill={INK}
    />
  </g>
);

const OleMast = ({ g, ch, to }: { g: Geo; ch: number; to: number }) => (
  <g>
    <line x1={g.X(ch)} y1={g.Y(12.4)} x2={g.X(ch)} y2={g.Y(18.4)} stroke={MUTE} strokeWidth={1.4} />
    <line x1={g.X(ch)} y1={g.Y(18.2)} x2={g.X(to)} y2={g.Y(18.2)} stroke={MUTE} strokeWidth={1.1} />
    <line x1={g.X(ch)} y1={g.Y(17.7)} x2={g.X(to)} y2={g.Y(18.2)} stroke={MUTE} strokeWidth={1} />
    <line x1={g.X(to)} y1={g.Y(18.2)} x2={g.X(to)} y2={g.Y(17.6)} stroke={MUTE} strokeWidth={1} />
    <circle cx={g.X(to)} cy={g.Y(17.6)} r={Math.max(2, g.s * 0.12)} fill={MUTE} />
  </g>
);

const Pile = ({
  g,
  ch,
  top,
  bot,
  w,
  c,
}: {
  g: Geo;
  ch: number;
  top: number;
  bot: number;
  w: number;
  c: string;
}) => {
  const x0 = g.X(ch - w / 2);
  const x1 = g.X(ch + w / 2);
  const yt = g.Y(top);
  const yb = g.Y(bot);
  const xm = (x0 + x1) / 2;
  return (
    <path
      d={`M${x0},${yt} L${x0},${yb} L${(x0 + xm) / 2},${yb - 4} L${(xm + x1) / 2},${yb + 4} L${x1},${yb} L${x1},${yt}`}
      fill="none"
      stroke={c}
      strokeWidth={1.3}
    />
  );
};

const StayLine = ({
  g,
  a,
  zp,
  side,
  c,
  sw,
}: {
  g: Geo;
  a: number;
  zp: number;
  side: -1 | 1;
  c: string;
  sw: number;
}) => {
  const az = a === 64 ? 20.0 : deckZ(a) + 0.05;
  return (
    <g>
      <line
        x1={g.X(a)}
        y1={g.Y(az)}
        x2={g.X(46 + side * pyHalf(zp) * 0.9)}
        y2={g.Y(zp)}
        stroke={c}
        strokeWidth={sw}
      />
      <circle cx={g.X(a)} cy={g.Y(az)} r={Math.max(2, g.s * 0.16)} fill={c} />
    </g>
  );
};

const Trestle = ({ g, ch, c }: { g: Geo; ch: number; c: string }) => {
  const top = deckZ(ch) - 0.75;
  const xl = g.X(ch - 1.2);
  const xr = g.X(ch + 1.2);
  const yt = g.Y(top);
  const yb = g.Y(9.8);
  const ym = (yt + yb) / 2;
  return (
    <g>
      <line x1={xl} y1={yt} x2={xl} y2={yb} stroke={c} strokeWidth={1.4} strokeDasharray="6 4" />
      <line x1={xr} y1={yt} x2={xr} y2={yb} stroke={c} strokeWidth={1.4} strokeDasharray="6 4" />
      <line x1={xl} y1={yt} x2={xr} y2={ym} stroke={c} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={xr} y1={yt} x2={xl} y2={ym} stroke={c} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={xl} y1={ym} x2={xr} y2={yb} stroke={c} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={xr} y1={ym} x2={xl} y2={yb} stroke={c} strokeWidth={1} strokeDasharray="4 3" />
    </g>
  );
};

const Crane = ({ g, tipCh, tipZ }: { g: Geo; tipCh: number; tipZ: number }) => (
  <g>
    <rect
      x={g.X(66.4)}
      y={g.Y(18.6)}
      width={5 * g.s}
      height={0.8 * g.s}
      fill="none"
      stroke={AMBER}
      strokeWidth={1.3}
    />
    <rect
      x={g.X(67.4)}
      y={g.Y(20.6)}
      width={3 * g.s}
      height={2 * g.s}
      fill="none"
      stroke={AMBER}
      strokeWidth={1.3}
    />
    <line
      x1={g.X(68)}
      y1={g.Y(20.6)}
      x2={g.X(tipCh)}
      y2={g.Y(tipZ)}
      stroke={AMBER}
      strokeWidth={1.8}
    />
    <line
      x1={g.X(tipCh)}
      y1={g.Y(tipZ)}
      x2={g.X(tipCh)}
      y2={g.Y(tipZ - 6)}
      stroke={AMBER}
      strokeWidth={1}
      strokeDasharray="4 3"
    />
  </g>
);

const Elevation = ({
  g,
  zBot = 8,
  show = ALL_PARTS,
  hl,
  crane,
  lite = false,
}: {
  g: Geo;
  zBot?: number;
  show?: Part[];
  hl?: Part[];
  crane?: [number, number];
  lite?: boolean;
}) => {
  const uid = uidOf(useId());
  const { X, Y, s } = g;
  const has = (p: Part) => show.includes(p);
  const col = (p: Part) => (!hl ? INK : hl.includes(p) ? CY : FAINT);
  const sw = s >= 10 ? 2 : 1.4;
  const earth = [...GROUND, [72, zBot], [-8, zBot]];
  const deckPoly = (a: number, b: number) =>
    pts(g, [
      [a, deckZ(a)],
      [b, deckZ(b)],
      [b, deckZ(b) - 0.75],
      [a, deckZ(a) - 0.75],
    ]);
  const pyPoly = (z0: number, z1: number) =>
    pts(g, [
      [46 - pyHalf(z0), z0],
      [46 + pyHalf(z0), z0],
      [46 + pyHalf(z1), z1],
      [46 - pyHalf(z1), z1],
    ]);
  return (
    <g>
      <defs>
        <pattern
          id={`${uid}e`}
          width={9}
          height={9}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={9} stroke={GHOST} strokeWidth={1.2} />
        </pattern>
      </defs>
      <polygon points={pts(g, earth)} fill={`url(#${uid}e)`} stroke="none" />
      <polygon points={pts(g, WATER)} fill={CY} fillOpacity={0.13} stroke="none" />
      <polyline
        points={pts(g, [
          [5.68, 12.4],
          [34.4, 12.4],
        ])}
        fill="none"
        stroke={CY}
        strokeWidth={1.3}
      />
      {!lite && (
        <>
          <line
            x1={X(10)}
            y1={Y(11.6)}
            x2={X(28)}
            y2={Y(11.6)}
            stroke={CY}
            strokeOpacity={0.5}
            strokeWidth={1}
            strokeDasharray="18 10"
          />
          <line
            x1={X(13)}
            y1={Y(10.8)}
            x2={X(26)}
            y2={Y(10.8)}
            stroke={CY}
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="12 12"
          />
        </>
      )}
      <line
        x1={X(1.48)}
        y1={Y(15.85)}
        x2={X(37.85)}
        y2={Y(15.85)}
        stroke={CY}
        strokeWidth={1.2}
        strokeDasharray="12 5 3 5"
      />
      <polyline points={pts(g, GROUND)} fill="none" stroke={INK} strokeWidth={sw} />
      <Track g={g} c={53} />
      <Track g={g} c={57.5} />
      <OleMast g={g} ch={50.5} to={53} />
      <OleMast g={g} ch={60.1} to={57.5} />
      {has('sub') && (
        <g>
          <polygon
            points={pts(g, [
              [-1.5, 14.6],
              [0.5, 14.6],
              [0.5, 16.95],
              [-0.2, 16.95],
              [-0.2, 17.7],
              [-1.5, 17.7],
            ])}
            fill={BG}
            stroke={col('sub')}
            strokeWidth={sw * 0.8}
          />
          <rect
            x={X(-2.5)}
            y={Y(14.6)}
            width={4 * s}
            height={1 * s}
            fill={BG}
            stroke={col('sub')}
            strokeWidth={sw * 0.8}
          />
          <Pile g={g} ch={-1.6} top={13.6} bot={zBot} w={0.75} c={col('sub')} />
          <Pile g={g} ch={0.6} top={13.6} bot={zBot} w={0.75} c={col('sub')} />
          <polygon
            points={pts(g, [
              [63.6, 16.8],
              [66, 16.8],
              [66, 20.26],
              [64.3, 20.26],
              [64.3, 19.51],
              [63.6, 19.51],
            ])}
            fill={BG}
            stroke={col('sub')}
            strokeWidth={sw * 0.8}
          />
          <rect
            x={X(62.6)}
            y={Y(16.8)}
            width={5 * s}
            height={1 * s}
            fill={BG}
            stroke={col('sub')}
            strokeWidth={sw * 0.8}
          />
          <Pile g={g} ch={63.4} top={15.8} bot={zBot} w={0.75} c={col('sub')} />
          <Pile g={g} ch={66.8} top={15.8} bot={zBot} w={0.75} c={col('sub')} />
          <rect
            x={X(43.5)}
            y={Y(15.4)}
            width={5 * s}
            height={2 * s}
            fill={BG}
            stroke={col('sub')}
            strokeWidth={sw * 0.8}
          />
          <Pile g={g} ch={44.3} top={13.4} bot={zBot} w={0.9} c={col('sub')} />
          <Pile g={g} ch={46} top={13.4} bot={zBot} w={0.9} c={col('sub')} />
          <Pile g={g} ch={47.7} top={13.4} bot={zBot} w={0.9} c={col('sub')} />
        </g>
      )}
      {has('trestles') && (
        <g>
          <Trestle g={g} ch={17} c={col('trestles')} />
          <Trestle g={g} ch={30} c={col('trestles')} />
        </g>
      )}
      {has('pyLo') && (
        <polygon points={pyPoly(15.4, 21)} fill={BG} stroke={col('pyLo')} strokeWidth={sw} />
      )}
      {has('pyHi') && (
        <g>
          <polygon points={pyPoly(21, PY_TOP)} fill={BG} stroke={col('pyHi')} strokeWidth={sw} />
          <line
            x1={X(46)}
            y1={Y(PY_TOP)}
            x2={X(46)}
            y2={Y(PY_TOP + 1.1)}
            stroke={col('pyHi')}
            strokeWidth={sw * 0.7}
          />
        </g>
      )}
      {has('mstays') && (
        <g>
          <StayLine g={g} a={10} zp={48.4} side={-1} c={col('mstays')} sw={sw * 0.6} />
          <StayLine g={g} a={16} zp={47.2} side={-1} c={col('mstays')} sw={sw * 0.6} />
          <StayLine g={g} a={22} zp={46.0} side={-1} c={col('mstays')} sw={sw * 0.6} />
          <StayLine g={g} a={28} zp={44.8} side={-1} c={col('mstays')} sw={sw * 0.6} />
          <StayLine g={g} a={34} zp={43.6} side={-1} c={col('mstays')} sw={sw * 0.6} />
          <StayLine g={g} a={40} zp={42.4} side={-1} c={col('mstays')} sw={sw * 0.6} />
        </g>
      )}
      {has('bstays') && (
        <g>
          <StayLine g={g} a={52} zp={42.4} side={1} c={col('bstays')} sw={sw * 0.75} />
          <StayLine g={g} a={58} zp={45.4} side={1} c={col('bstays')} sw={sw * 0.75} />
          <StayLine g={g} a={64} zp={48.4} side={1} c={col('bstays')} sw={sw * 0.9} />
        </g>
      )}
      {has('main') && (
        <g>
          <polygon points={deckPoly(0, 46)} fill={BG} stroke={col('main')} strokeWidth={sw} />
          <polyline
            points={pts(g, [
              [0, deckZ(0) + 1.4],
              [46, deckZ(46) + 1.4],
            ])}
            fill="none"
            stroke={col('main')}
            strokeOpacity={0.6}
            strokeWidth={1}
          />
        </g>
      )}
      {has('back') && (
        <g>
          <polygon points={deckPoly(46, 64)} fill={BG} stroke={col('back')} strokeWidth={sw} />
          <polyline
            points={pts(g, [
              [46, deckZ(46) + 1.4],
              [49, deckZ(49) + 1.4],
              [49, deckZ(49) + 1.8],
              [62, deckZ(62) + 1.8],
              [62, deckZ(62) + 1.4],
              [64, deckZ(64) + 1.4],
            ])}
            fill="none"
            stroke={col('back')}
            strokeOpacity={0.6}
            strokeWidth={1}
          />
        </g>
      )}
      {crane && <Crane g={g} tipCh={crane[0]} tipZ={crane[1]} />}
    </g>
  );
};

const CoverPage: Page = () => {
  const g = geo(11, 998, 176);
  return (
    <Sheet title="Cover sheet" scale="1:500">
      <div className="ab-in" style={abs(120, 104, LABEL)}>
        City of Halbrook · Design Review Panel · 14 Oct 2026
      </div>
      <div className="ab-in" style={{ ...abs(120, 250), ...d(0.15) }}>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: '0.005em',
            textTransform: 'uppercase',
          }}
        >
          Arden Street
          <br />
          Footbridge
        </div>
      </div>
      <div className="ab-in" style={{ ...abs(124, 528, { width: 800 }), ...d(0.35) }}>
        <div style={{ ...LABEL, fontSize: 24, color: AMBER }}>60% design review · Rev C</div>
        <p
          style={{
            margin: '18px 0 0',
            fontSize: 'var(--osd-size-body)',
            lineHeight: 1.45,
            color: MUTE,
          }}
        >
          A 64 m cable-stayed walking and cycling bridge over the River Kell and the Carrow line,
          linking Kell Meadows to Arden Street.
        </p>
      </div>
      <Svg>
        <g style={d(0.2)}>
          <Elevation g={g} lite />
        </g>
        <g style={d(1.2)}>
          <ScaleBar x={1010} y={700} ppm={11} label="SCALE 1:500" />
          <path
            d="M1412,772 C1430,740 1452,694 1480,664"
            fill="none"
            stroke={AMBER}
            strokeWidth={1.8}
          />
          <Head x={1484} y={657} ang={-1.05} c={AMBER} />
          <text x={1392} y={800} textAnchor="middle" style={tx(26, AMBER, HAND)}>
            pylon on the embankment —
          </text>
          <text x={1392} y={832} textAnchor="middle" style={tx(26, AMBER, HAND)}>
            no piers in the river
          </text>
        </g>
      </Svg>
      <div className="ab-in" style={{ ...abs(120, 862), ...d(0.6) }}>
        <div style={SMALL}>Presented by</div>
        <div style={{ fontSize: 30, marginTop: 8, lineHeight: 1.35 }}>
          Ruth Okafor, Project Engineer · Magnus Lindqvist, Design Lead
        </div>
      </div>
    </Sheet>
  );
};

const PlanStayPair = ({ x }: { x: number }) => (
  <g>
    <line x1={x} y1={578.4} x2={768} y2={600} stroke={FAINT} strokeWidth={1} />
    <line x1={x} y1={621.6} x2={768} y2={600} stroke={FAINT} strokeWidth={1} />
  </g>
);

const Tree = ({ x, y, r = 22 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="none" stroke={MUTE} strokeWidth={1.2} />
    <circle cx={x} cy={y} r={r * 0.55} fill="none" stroke={GHOST} strokeWidth={1} />
    <line x1={x - 5} y1={y} x2={x + 5} y2={y} stroke={MUTE} strokeWidth={1} />
    <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke={MUTE} strokeWidth={1} />
  </g>
);

const PlanTrack = ({ x, id }: { x: number; id: string }) => (
  <g>
    <rect x={x - 10} y={250} width={20} height={710} fill={`url(#${id})`} stroke="none" />
    <line x1={x - 5.7} y1={250} x2={x - 5.7} y2={960} stroke={INK} strokeWidth={1.3} />
    <line x1={x + 5.7} y1={250} x2={x + 5.7} y2={960} stroke={INK} strokeWidth={1.3} />
  </g>
);

const Stat = ({
  top,
  value,
  label,
  note,
  delay,
}: {
  top: number;
  value: string;
  label: string;
  note: string;
  delay: number;
}) => (
  <div className="ab-in" style={{ ...abs(1250, top, { width: 560 }), ...d(delay) }}>
    <div style={{ ...SMALL, color: CY }}>{label}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 600,
        fontSize: 80,
        lineHeight: 1.05,
        marginTop: 6,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 28, color: MUTE, lineHeight: 1.35, marginTop: 4 }}>{note}</div>
  </div>
);

const SitePage: Page = () => {
  const uid = uidOf(useId());
  return (
    <Sheet title="Site plan" scale="1:1000" label="Site context · plan" heading="Where it lands">
      <Svg>
        <defs>
          <pattern id={`${uid}w`} width={26} height={14} patternUnits="userSpaceOnUse">
            <line x1={2} y1={7} x2={14} y2={7} stroke={CY} strokeOpacity={0.45} strokeWidth={1.1} />
          </pattern>
          <pattern id={`${uid}s`} width={20} height={9} patternUnits="userSpaceOnUse">
            <line
              x1={0}
              y1={4}
              x2={20}
              y2={4}
              stroke={MUTE}
              strokeOpacity={0.55}
              strokeWidth={2.4}
            />
          </pattern>
          <pattern
            id={`${uid}b`}
            width={10}
            height={10}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={10} stroke={GHOST} strokeWidth={1.4} />
          </pattern>
        </defs>
        <g style={d(0.1)}>
          <path
            d="M452,250 C418,380 408,520 432,600 C452,668 478,800 444,960 L690,960 C724,800 690,668 672,600 C650,520 664,390 700,250 Z"
            fill={CY}
            fillOpacity={0.1}
            stroke="none"
          />
          <path
            d="M452,250 C418,380 408,520 432,600 C452,668 478,800 444,960 L690,960 C724,800 690,668 672,600 C650,520 664,390 700,250 Z"
            fill={`url(#${uid}w)`}
            stroke="none"
          />
          <path
            d="M452,250 C418,380 408,520 432,600 C452,668 478,800 444,960"
            fill="none"
            stroke={INK}
            strokeWidth={1.8}
          />
          <path
            d="M700,250 C664,390 650,520 672,600 C690,668 724,800 690,960"
            fill="none"
            stroke={INK}
            strokeWidth={1.8}
          />
          <line x1={566} y1={790} x2={566} y2={862} stroke={CY} strokeWidth={1.4} />
          <Head x={566} y={868} ang={Math.PI / 2} />
          <text x={580} y={832} style={tx(18, CY)}>
            FLOW
          </text>
        </g>
        <g style={d(0.3)}>
          <rect x={797} y={250} width={5} height={710} fill={BG} stroke={INK} strokeWidth={1.2} />
          <rect x={883} y={250} width={5} height={710} fill={BG} stroke={INK} strokeWidth={1.2} />
          <PlanTrack x={824} id={`${uid}s`} />
          <PlanTrack x={860} id={`${uid}s`} />
          <text
            transform="translate(848,420) rotate(-90)"
            textAnchor="middle"
            style={{ ...tx(18, MUTE), ...HALO }}
          >
            CARROW LINE · 25 kV
          </text>
        </g>
        <g style={d(0.4)}>
          <line x1={920} y1={250} x2={920} y2={960} stroke={FAINT} strokeWidth={1} />
          <line x1={940} y1={250} x2={940} y2={960} stroke={INK} strokeWidth={1.6} />
          <line x1={1030} y1={250} x2={1030} y2={960} stroke={INK} strokeWidth={1.6} />
          <line x1={1050} y1={250} x2={1050} y2={960} stroke={FAINT} strokeWidth={1} />
          <line
            x1={985}
            y1={250}
            x2={985}
            y2={960}
            stroke={MUTE}
            strokeWidth={1.2}
            strokeDasharray="22 16"
          />
          <text
            transform="translate(1004,820) rotate(-90)"
            textAnchor="middle"
            style={{ ...tx(18, MUTE), ...HALO }}
          >
            ARDEN STREET
          </text>
          <rect
            x={1070}
            y={262}
            width={80}
            height={180}
            fill={`url(#${uid}b)`}
            stroke={INK}
            strokeWidth={1.3}
          />
          <rect
            x={1070}
            y={700}
            width={80}
            height={250}
            fill={`url(#${uid}b)`}
            stroke={INK}
            strokeWidth={1.3}
          />
        </g>
        <g style={d(0.5)}>
          <path
            d="M130,330 C260,420 330,560 400,600 C360,680 300,820 262,960"
            fill="none"
            stroke={FAINT}
            strokeWidth={24}
          />
          <path
            d="M130,330 C260,420 330,560 400,600 C360,680 300,820 262,960"
            fill="none"
            stroke={BG}
            strokeWidth={20}
          />
          <path
            d="M130,330 C260,420 330,560 400,600 C360,680 300,820 262,960"
            fill="none"
            stroke={MUTE}
            strokeWidth={1}
            strokeDasharray="10 10"
          />
          <Tree x={262} y={344} r={18} />
          <Tree x={346} y={326} r={18} />
          <Tree x={370} y={392} r={18} />
          <Tree x={176} y={520} />
          <Tree x={252} y={566} r={18} />
          <Tree x={160} y={760} />
          <Tree x={228} y={846} r={18} />
          <Tree x={150} y={880} r={18} />
        </g>
        <g style={d(0.7)}>
          <rect x={888} y={566} width={52} height={68} fill={BG} stroke={MUTE} strokeWidth={1.2} />
          <rect
            x={748}
            y={555}
            width={40}
            height={90}
            fill="none"
            stroke={MUTE}
            strokeWidth={1}
            strokeDasharray="5 4"
          />
          <rect
            x={400}
            y={578.4}
            width={512}
            height={43.2}
            fill={BG}
            stroke={INK}
            strokeWidth={2.2}
          />
          <line x1={400} y1={583} x2={912} y2={583} stroke={FAINT} strokeWidth={1} />
          <line x1={400} y1={617} x2={912} y2={617} stroke={FAINT} strokeWidth={1} />
          <PlanStayPair x={480} />
          <PlanStayPair x={528} />
          <PlanStayPair x={576} />
          <PlanStayPair x={624} />
          <PlanStayPair x={672} />
          <PlanStayPair x={720} />
          <PlanStayPair x={816} />
          <PlanStayPair x={864} />
          <PlanStayPair x={912} />
          <rect x={761} y={559} width={14} height={10} fill={CY} stroke={CY} strokeWidth={1} />
          <rect x={761} y={631} width={14} height={10} fill={CY} stroke={CY} strokeWidth={1} />
          <circle cx={768} cy={600} r={5} fill={CY} />
        </g>
        <g style={d(1.0)}>
          <SectionCut x={624} y1={548} y2={652} n="A" />
          <Leader pts={[398, 612, 360, 668, 330, 668]} text="A1 · GREENWAY" end />
          <Leader pts={[768, 645, 740, 730, 720, 730]} text="P1 · ON FLOOD EMBANKMENT" end />
          <Leader pts={[912, 578, 950, 520, 962, 520]} text="A2 · ARDEN ST" />
          <NorthArrow x={1110} y={604} />
          <ScaleBar x={150} y={262} ppm={8} label="" />
          <path
            d="M262,930 C250,946 246,956 244,968"
            fill="none"
            stroke={AMBER}
            strokeWidth={1.6}
            strokeDasharray="6 5"
          />
          <text x={300} y={906} style={tx(24, AMBER, HAND)}>
            detour today:
          </text>
          <text x={300} y={936} style={{ ...tx(20, AMBER), ...HALO }}>
            1.1 KM ↓
          </text>
          <text x={150} y={440} style={{ ...tx(18, MUTE), ...HALO }}>
            KELL MEADOWS
          </text>
        </g>
      </Svg>
      <Stat
        top={262}
        value="1.1 km → 64 m"
        label="Crossing length"
        note="Today’s detour via the Carrow Road bridge."
        delay={0.5}
      />
      <Stat
        top={462}
        value="2,400 / day"
        label="Forecast trips, 2030"
        note="60% on foot, 40% by bike."
        delay={0.7}
      />
      <Stat
        top={662}
        value="13 min"
        label="Saved per walking trip"
        note="Meadows to Halbrook Central."
        delay={0.9}
      />
    </Sheet>
  );
};

const ConstraintRow = ({
  top,
  n,
  title,
  req,
  prov,
  delay,
}: {
  top: number;
  n: string;
  title: string;
  req: string;
  prov: string;
  delay: number;
}) => (
  <div className="ab-in" style={{ ...abs(1220, top, { width: 590 }), ...d(delay) }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: `1.6px solid ${CY}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 18,
          color: CY,
          flex: 'none',
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 600,
          fontSize: 32,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </span>
    </div>
    <div style={{ marginLeft: 50, marginTop: 6, fontFamily: MONO, fontSize: 22, lineHeight: 1.45 }}>
      <div style={{ color: MUTE }}>REQ&nbsp;&nbsp;{req}</div>
      <div style={{ color: CY }}>PROV&nbsp;{prov}</div>
    </div>
  </div>
);

const ChTick = ({ x, label }: { x: number; label: string }) => (
  <g>
    <line x1={x} y1={752} x2={x} y2={768} stroke={MUTE} strokeWidth={1.2} />
    <text x={x} y={794} textAnchor="middle" style={tx(18, MUTE)}>
      {label}
    </text>
  </g>
);

const ConstraintsPage: Page = () => {
  const g = geo(13, 224, 280, 24, 26);
  const { X, Y } = g;
  const uid = uidOf(useId());
  const earth = [...GROUND, [72, 7], [-8, 7]];
  const soffit = (ch: number) => deckZ(ch) - 0.75;
  return (
    <Sheet
      title="Constraints · long section"
      scale="1:500 V×2"
      label="Constraints · long section · vertical ×2"
      heading="What fixes the levels"
    >
      <Svg>
        <defs>
          <pattern
            id={`${uid}e`}
            width={9}
            height={9}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={9} stroke={GHOST} strokeWidth={1.2} />
          </pattern>
        </defs>
        <g style={d(0.1)}>
          <polygon points={pts(g, earth)} fill={`url(#${uid}e)`} stroke="none" />
          <polygon points={pts(g, WATER)} fill={CY} fillOpacity={0.13} stroke="none" />
          <polyline points={pts(g, GROUND)} fill="none" stroke={INK} strokeWidth={2} />
          <line x1={X(5.68)} y1={Y(12.4)} x2={X(34.4)} y2={Y(12.4)} stroke={CY} strokeWidth={1.3} />
          <Track g={g} c={53} />
          <Track g={g} c={57.5} />
          <OleMast g={g} ch={50.5} to={53} />
          <OleMast g={g} ch={60.1} to={57.5} />
        </g>
        <g style={d(0.4)}>
          <polygon
            points={pts(g, [
              [0, deckZ(0)],
              [64, deckZ(64)],
              [64, soffit(64)],
              [0, soffit(0)],
            ])}
            fill={BG}
            stroke={INK}
            strokeWidth={2.2}
          />
          <rect
            x={X(43.5)}
            y={Y(15.4)}
            width={5 * 13}
            height={2 * 26}
            fill={BG}
            stroke={INK}
            strokeWidth={1.4}
          />
          <polygon
            points={pts(g, [
              [45.2, 15.4],
              [46.8, 15.4],
              [46.75, 23.6],
              [45.25, 23.6],
            ])}
            fill={BG}
            stroke={INK}
            strokeWidth={1.6}
          />
          <path
            d={`M${X(45.25)},${Y(23.6)} L${X(45.7)},${Y(23.6) - 6} L${X(46.3)},${Y(23.6) + 6} L${X(46.75)},${Y(23.6)}`}
            fill="none"
            stroke={INK}
            strokeWidth={1.4}
          />
          <polygon
            points={pts(g, [
              [-1.5, 14.6],
              [0.5, 14.6],
              [0.5, soffit(0)],
              [-1.5, soffit(0)],
            ])}
            fill={BG}
            stroke={INK}
            strokeWidth={1.4}
          />
          <polygon
            points={pts(g, [
              [63.6, 16.8],
              [66, 16.8],
              [66, deckZ(64)],
              [64.3, deckZ(64)],
              [64.3, soffit(64)],
              [63.6, soffit(64)],
            ])}
            fill={BG}
            stroke={INK}
            strokeWidth={1.4}
          />
        </g>
        <g style={d(0.8)}>
          <line
            x1={X(1.48)}
            y1={Y(15.85)}
            x2={X(37.85)}
            y2={Y(15.85)}
            stroke={CY}
            strokeWidth={1.4}
            strokeDasharray="12 5 3 5"
          />
          <text x={X(12)} y={Y(15.85) + 26} style={{ ...tx(18, CY), ...HALO }}>
            1% AEP + 40% CC · +15.850
          </text>
          <text x={X(12)} y={Y(12.4) + 26} style={{ ...tx(18, CY), ...HALO }}>
            NWL +12.400
          </text>
          <rect
            x={X(50.4)}
            y={Y(18.7)}
            width={10.2 * 13}
            height={(18.7 - 12.9) * 26}
            fill="none"
            stroke={AMBER}
            strokeWidth={1.3}
            strokeDasharray="8 5"
          />
          <text
            x={X(55.8)}
            y={Y(12.4) + 34}
            textAnchor="middle"
            style={{ ...tx(18, AMBER), ...HALO }}
          >
            OLE ENVELOPE
          </text>
          <line
            x1={X(49.6)}
            y1={Y(12.9)}
            x2={X(61)}
            y2={Y(12.9)}
            stroke={MUTE}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        </g>
        <g style={d(1.2)}>
          <DimV x={X(3)} y1={Y(soffit(3))} y2={Y(15.85)} text="" c={CY} />
          <Tag x={X(3) + 30} y={(Y(soffit(3)) + Y(15.85)) / 2} n="1" />
          <DimV x={X(51)} y1={Y(soffit(51))} y2={Y(12.9)} text="" c={AMBER} />
          <Tag x={X(51) + 28} y={Y(16)} n="2" c={AMBER} />
          <path
            d={`M${X(20)},${Y(deckZ(20)) - 26} L${X(32)},${Y(deckZ(32)) - 26} L${X(32)},${Y(deckZ(20)) - 26} Z`}
            fill="none"
            stroke={CY}
            strokeWidth={1.3}
          />
          <text x={X(32) + 10} y={Y(deckZ(26)) - 34} style={{ ...tx(20, CY), ...HALO }}>
            1:25
          </text>
          <Tag x={X(26)} y={Y(deckZ(26)) - 72} n="3" />
          <DimH x1={X(46.8)} x2={X(52.28)} y={Y(21.4)} text="" c={CY} from2={Y(12.9)} />
          <Tag x={X(49.54)} y={Y(21.4) - 26} n="4" />
          <path
            d={cloudPath(X(52.8), Y(19.5), 64, 36, 14)}
            fill="none"
            stroke={AMBER}
            strokeWidth={1.6}
          />
          <text x={X(52)} y={262} style={tx(26, AMBER, HAND)}>
            Rev C: deck +250 mm
          </text>
          <line
            x1={X(60)}
            y1={272}
            x2={X(52.8) + 56}
            y2={Y(19.5) - 20}
            stroke={AMBER}
            strokeWidth={1.3}
          />
          <ChTick x={X(0)} label="CH 0" />
          <ChTick x={X(10)} label="10" />
          <ChTick x={X(20)} label="20" />
          <ChTick x={X(30)} label="30" />
          <ChTick x={X(40)} label="40" />
          <ChTick x={X(50)} label="50" />
          <ChTick x={X(64)} label="64 m" />
          <line x1={X(0)} y1={760} x2={X(64)} y2={760} stroke={MUTE} strokeWidth={1.2} />
          <text x={X(-6)} y={Y(deckZ(0)) - 14} style={{ ...tx(18, INK), ...HALO }}>
            +17.700
          </text>
          <text x={X(66.6)} y={Y(deckZ(64)) + 30} style={{ ...tx(18, INK), ...HALO }}>
            +20.260
          </text>
        </g>
      </Svg>
      <ConstraintRow
        top={268}
        n="1"
        title="Flood freeboard"
        req="600 mm over +15.850"
        prov="1,160 mm at west bank"
        delay={0.4}
      />
      <ConstraintRow
        top={410}
        n="2"
        title="Rail · OLE clearance"
        req="5.80 m above rail"
        prov="6.07 m — governs profile"
        delay={0.6}
      />
      <ConstraintRow
        top={552}
        n="3"
        title="Gradient"
        req="1:20 max, landings at 1:20"
        prov="1:25 — no landings"
        delay={0.8}
      />
      <ConstraintRow
        top={694}
        n="4"
        title="Pylon set-back"
        req="4.5 m from nearest rail"
        prov="5.48 m · no river piers"
        delay={1.0}
      />
    </Sheet>
  );
};

const Metric = ({ k, v, good }: { k: string; v: string; good?: boolean }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      borderTop: `1px solid ${GHOST}`,
      padding: '8px 0 6px',
    }}
  >
    <span style={SMALL}>{k}</span>
    <span style={{ fontFamily: MONO, fontSize: 28, color: good ? CY : INK }}>{v}</span>
  </div>
);

const OptionCard = ({
  x,
  tag,
  title,
  chosen,
  sketch,
  children,
}: {
  x: number;
  tag: string;
  title: string;
  chosen?: boolean;
  sketch: ReactNode;
  children: ReactNode;
}) => (
  <div
    style={abs(x, 262, {
      width: 520,
      height: 556,
      boxSizing: 'border-box',
      border: `${chosen ? 2 : 1.2}px solid ${chosen ? CY : FAINT}`,
      background: chosen ? 'rgba(143,216,255,0.06)' : 'rgba(12,51,96,0.5)',
      padding: '24px 28px',
    })}
  >
    <div style={{ ...LABEL, color: chosen ? CY : MUTE }}>{tag}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 600,
        fontSize: 40,
        textTransform: 'uppercase',
        marginTop: 6,
        lineHeight: 1.1,
      }}
    >
      {title}
    </div>
    <svg
      width={464}
      height={180}
      viewBox="0 0 464 180"
      className="ab-ink"
      style={{ marginTop: 12 }}
    >
      <path
        d="M0,130 L46,130 L58,152 L218,152 L232,130 L340,130 L346,146 L408,146 L414,130 L464,130"
        fill="none"
        stroke={MUTE}
        strokeWidth={1.4}
      />
      <line
        x1={70}
        y1={146}
        x2={208}
        y2={146}
        stroke={CY}
        strokeOpacity={0.6}
        strokeWidth={1}
        strokeDasharray="10 6"
      />
      <line
        x1={352}
        y1={143}
        x2={402}
        y2={143}
        stroke={MUTE}
        strokeWidth={2}
        strokeDasharray="3 3"
      />
      {sketch}
    </svg>
    <div style={{ marginTop: 14 }}>{children}</div>
  </div>
);

const trussPath = () => {
  let p = '';
  for (let i = 0; i < 16; i++) {
    const x0 = 32 + i * 25;
    p += `M${x0},112 L${x0 + 12.5},84 L${x0 + 25},112 `;
  }
  return p;
};

const archPath = () => {
  let p = '';
  for (let i = 1; i < 16; i++) {
    const x = 32 + i * 25;
    const t = (x - 232) / 200;
    const y = 108 - 88 * (1 - t * t);
    p += `M${x},108 L${x},${y.toFixed(1)} `;
  }
  return p;
};

const fanPath = () => {
  const top = 22;
  let p = '';
  const main = [70, 108, 146, 184, 222, 260];
  const back = [336, 370, 432];
  for (const x of main) p += `M${x},106 L318,${top + (x - 70) * 0.06} `;
  for (const x of back) p += `M${x},104 L326,${top + (432 - x) * 0.08} `;
  return p;
};

const TrussSketch = () => (
  <g>
    <rect x={32} y={84} width={400} height={28} fill="none" stroke={INK} strokeWidth={1.8} />
    <path d={trussPath()} fill="none" stroke={INK} strokeWidth={1.1} />
    <line x1={150} y1={112} x2={150} y2={150} stroke={AMBER} strokeWidth={4} />
    <line x1={320} y1={112} x2={320} y2={130} stroke={INK} strokeWidth={4} />
  </g>
);

const ArchSketch = () => (
  <g>
    <path d="M32,108 Q232,-68 432,108" fill="none" stroke={INK} strokeWidth={2} />
    <path d={archPath()} fill="none" stroke={INK} strokeWidth={1} />
    <line x1={32} y1={108} x2={432} y2={108} stroke={INK} strokeWidth={2.4} />
  </g>
);

const StaySketch = () => (
  <g>
    <line x1={32} y1={108} x2={432} y2={102} stroke={INK} strokeWidth={2.4} />
    <path d={fanPath()} fill="none" stroke={CY} strokeWidth={1.1} />
    <polygon points="314,130 330,130 326,14 318,14" fill={BG} stroke={INK} strokeWidth={1.8} />
  </g>
);

const ConceptPage: Page = () => (
  <Sheet title="Structural options" label="Structural concept · options" heading="Why cable-stayed">
    <Steps>
      <Step>
        <OptionCard x={120} tag="Option A" title="Through truss" sketch={<TrussSketch />}>
          <Metric k="Cost P50" v="£8.1 M" good />
          <Metric k="Rail possessions" v="2 × 54 h" />
          <Metric k="Piers in channel" v="1" />
          <Metric k="Truss height" v="4.1 m" />
        </OptionCard>
      </Step>
      <Step>
        <OptionCard x={700} tag="Option B" title="Tied arch, 64 m" sketch={<ArchSketch />}>
          <Metric k="Cost P50" v="£10.4 M" />
          <Metric k="Rail possessions" v="1 × 72 h" />
          <Metric k="Piers in channel" v="0" good />
          <Metric k="Crane for lift" v="1,200 t" />
        </OptionCard>
      </Step>
      <Step>
        <OptionCard
          x={1280}
          tag="Option C · preferred"
          title="Cable-stayed"
          chosen
          sketch={<StaySketch />}
        >
          <Metric k="Cost P50" v="£8.9 M" />
          <Metric k="Rail possessions" v="1 × 54 h" good />
          <Metric k="Piers in channel" v="0" good />
          <Metric k="Deck depth" v="0.75 m" good />
        </OptionCard>
      </Step>
      <Step>
        <Svg>
          <path
            d="M1296,358 C1278,328 1420,320 1566,326 C1642,330 1626,384 1488,388 C1376,392 1280,384 1294,342"
            fill="none"
            stroke={AMBER}
            strokeWidth={2}
          />
          <text x={1300} y={206} style={tx(28, AMBER, HAND)}>
            only option with no river pier
          </text>
          <text x={1300} y={240} style={tx(28, AMBER, HAND)}>
            and a single possession
          </text>
          <line x1={1690} y1={238} x2={1640} y2={300} stroke={AMBER} strokeWidth={1.4} />
          <Head x={1634} y={307} ang={2.25} c={AMBER} />
          <text x={130} y={866} style={tx(26, AMBER, HAND)}>
            A: EA objects to a pier in the channel
          </text>
        </Svg>
      </Step>
    </Steps>
  </Sheet>
);

const KeyFig = ({ top, k, v }: { top: number; k: string; v: string }) => (
  <div style={abs(120, top, { width: 400 })}>
    <div style={SMALL}>{k}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 500,
        fontSize: 34,
        lineHeight: 1.2,
        marginTop: 2,
      }}
    >
      {v}
    </div>
  </div>
);

const ElevationPage: Page = () => {
  const g = geo(13, 658, 238);
  const { X, Y } = g;
  return (
    <Sheet
      title="General arrangement"
      scale="1:400"
      label="General arrangement · elevation looking north"
      heading="Elevation"
    >
      <div className="ab-in" style={d(0.6)}>
        <KeyFig top={300} k="Spans" v="46.0 m + 18.0 m" />
        <KeyFig top={390} k="Pylon" v="30.0 m above deck" />
        <KeyFig top={480} k="Stays" v="9 pairs, locked coil" />
        <KeyFig top={570} k="Deck" v="Steel, 750 mm deep" />
        <KeyFig top={660} k="Gradient" v="1:25 rising east" />
      </div>
      <Svg>
        <g style={d(0)}>
          <GridBubble x={X(0)} y={262} n="A1" to={Y(13.6)} />
          <GridBubble x={X(64)} y={262} n="A2" to={Y(15.8)} />
        </g>
        <g style={d(0.15)}>
          <Elevation g={g} zBot={9} />
        </g>
        <g style={d(1.0)}>
          <Level x1={X(46) + 10} x2={X(46) + 200} y={Y(PY_TOP)} text="+49.540 PYLON" right />
          <Level x1={X(-8)} x2={X(0)} y={Y(17.7)} text="+17.700" />
          <Level x1={X(64)} x2={X(72)} y={Y(20.26)} text="+20.260" right />
          <text x={X(10)} y={Y(15.85) + 22} style={{ ...tx(18, CY), ...HALO }}>
            1% AEP+CC +15.850
          </text>
          <text x={X(12)} y={Y(12.4) + 22} style={{ ...tx(18, CY), ...HALO }}>
            NWL +12.400 · RIVER KELL
          </text>
          <Leader
            pts={[X(34.6), Y(31.5), X(30), Y(36), X(26), Y(36)]}
            text="6 MAIN STAYS · Ø40"
            end
          />
          <Leader pts={[X(56), Y(33.4), X(60), Y(38), X(63), Y(38)]} text="3 BACKSTAYS · Ø60" />
          <Leader pts={[X(46.4), Y(28), X(52), Y(28), X(54), Y(28)]} text="P1 · A-FRAME S460" />
          <Leader
            pts={[X(55.5), Y(16.8), X(62), Y(14.5), X(64), Y(14.5)]}
            text="CARROW LINE"
            sub="2 TRACKS · OLE"
          />
          <SectionCut x={X(28)} y1={Y(deckZ(28)) - 44} y2={Y(deckZ(28)) + 36} n="A" />
          <DimV
            x={X(50.4)}
            y1={Y(deckZ(50.4) - 0.75)}
            y2={Y(12.9)}
            text="6 066"
            c={AMBER}
            fs={18}
            right
          />
        </g>
        <g style={d(1.4)}>
          <DimH x1={X(0)} x2={X(46)} y={806} text="46 000" from1={Y(13.6)} from2={Y(9)} tick />
          <DimH x1={X(46)} x2={X(64)} y={806} text="18 000" from2={Y(15.8)} tick />
          <DimH x1={X(0)} x2={X(64)} y={838} text="64 000 OVERALL" tick />
        </g>
      </Svg>
    </Sheet>
  );
};

const Trough = ({
  xc,
  X,
  Y,
}: {
  xc: number;
  X: (m: number) => number;
  Y: (m: number) => number;
}) => {
  const top = -0.025 * Math.abs(xc) - 0.014;
  return (
    <polyline
      points={`${X(xc - 0.15)},${Y(top)} ${X(xc - 0.06)},${Y(top - 0.28)} ${X(xc + 0.06)},${Y(top - 0.28)} ${X(xc + 0.15)},${Y(top)}`}
      fill="none"
      stroke={INK}
      strokeWidth={2.4}
    />
  );
};

const EdgeBox = ({
  side,
  X,
  Y,
}: {
  side: -1 | 1;
  X: (m: number) => number;
  Y: (m: number) => number;
}) => {
  const o = side * 2.7;
  const i = side * 2.1;
  const zt = -0.0525;
  const outer = `M${X(o)},${Y(zt)} L${X(i)},${Y(zt)} L${X(i)},${Y(-0.75)} L${X(o)},${Y(-0.75)} Z`;
  const inner = `M${X(o - side * 0.022)},${Y(zt - 0.014)} L${X(i + side * 0.022)},${Y(zt - 0.014)} L${X(i + side * 0.022)},${Y(-0.72)} L${X(o - side * 0.022)},${Y(-0.72)} Z`;
  return (
    <g>
      <path
        d={`${outer} ${inner}`}
        fillRule="evenodd"
        fill={CY}
        fillOpacity={0.55}
        stroke={INK}
        strokeWidth={1.6}
      />
      <line
        x1={X(side * 2.4)}
        y1={Y(-0.72)}
        x2={X(side * 2.4)}
        y2={Y(-0.6)}
        stroke={INK}
        strokeWidth={2.4}
      />
      <line
        x1={X(i + side * 0.022)}
        y1={Y(-0.38)}
        x2={X(o - side * 0.022)}
        y2={Y(-0.38)}
        stroke={FAINT}
        strokeWidth={1}
        strokeDasharray="6 4"
      />
      <polygon
        points={`${X(o)},${Y(-0.12)} ${X(o + side * 0.26)},${Y(-0.02)} ${X(o + side * 0.26)},${Y(0.22)} ${X(o)},${Y(0.12)}`}
        fill={BG}
        stroke={INK}
        strokeWidth={1.6}
      />
      <circle
        cx={X(o + side * 0.17)}
        cy={Y(0.08)}
        r={7}
        fill="none"
        stroke={CY}
        strokeWidth={1.8}
      />
      <line
        x1={X(o + side * 0.17)}
        y1={Y(0.08)}
        x2={X(o - side * 0.14)}
        y2={Y(2.15)}
        stroke={CY}
        strokeWidth={3}
      />
      <path
        d={`M${X(o - side * 0.08) - 12},${Y(1.75)} l8,-6 l8,12 l8,-6`}
        fill="none"
        stroke={CY}
        strokeWidth={1.4}
      />
    </g>
  );
};

const Parapet = ({
  side,
  X,
  Y,
}: {
  side: -1 | 1;
  X: (m: number) => number;
  Y: (m: number) => number;
}) => {
  const post = side * 2.36;
  return (
    <g>
      <polygon
        points={`${X(post - 0.04)},${Y(-0.0525)} ${X(post + 0.04)},${Y(-0.0525)} ${X(post + 0.025)},${Y(1.4)} ${X(post - 0.025)},${Y(1.4)}`}
        fill={BG}
        stroke={INK}
        strokeWidth={1.4}
      />
      <rect
        x={Math.min(X(post - side * 0.05), X(post - side * 0.08))}
        y={Y(1.3)}
        width={Math.abs(X(0.03) - X(0))}
        height={Y(0.1) - Y(1.3)}
        fill="none"
        stroke={MUTE}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={X(post)}
        y1={Y(1.37)}
        x2={X(side * 2.03)}
        y2={Y(1.37)}
        stroke={INK}
        strokeWidth={2}
      />
      <circle cx={X(side * 2.03)} cy={Y(1.37)} r={6} fill={BG} stroke={INK} strokeWidth={1.8} />
      <line
        x1={X(post)}
        y1={Y(0.9)}
        x2={X(side * 2.03)}
        y2={Y(0.9)}
        stroke={INK}
        strokeWidth={1.6}
      />
      <circle cx={X(side * 2.03)} cy={Y(0.9)} r={5} fill={BG} stroke={INK} strokeWidth={1.6} />
      <rect x={X(side * 2.03) - 4} y={Y(1.37) + 7} width={8} height={5} fill={AMBER} />
    </g>
  );
};

const KeyNote = ({ top, n, text }: { top: number; n: string; text: string }) => (
  <div style={abs(1400, top, { display: 'flex', alignItems: 'center', gap: 16, width: 420 })}>
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: `1.6px solid ${CY}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontSize: 18,
        color: CY,
        flex: 'none',
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 28, lineHeight: 1.2 }}>{text}</span>
  </div>
);

const SectionPage: Page = () => {
  const cx = 770;
  const dy = 640;
  const k = 180;
  const X = (m: number) => cx + m * k;
  const Y = (m: number) => dy - m * k;
  const deckTop = `M${X(-2.1)},${Y(-0.0525)} L${X(0)},${Y(0)} L${X(2.1)},${Y(-0.0525)}`;
  const deckBot = `L${X(2.1)},${Y(-0.0665)} L${X(0)},${Y(-0.014)} L${X(-2.1)},${Y(-0.0665)} Z`;
  return (
    <Sheet
      title="Deck section A–A"
      scale="1:25"
      label="Section A–A · typical deck"
      heading="Deck cross-section"
    >
      <Svg>
        <g style={d(0.1)}>
          <path
            d={`${deckTop} ${deckBot}`}
            fill={CY}
            fillOpacity={0.55}
            stroke={INK}
            strokeWidth={1.6}
          />
          <path
            d={`M${X(-2.1)},${Y(-0.0525) - 5} L${X(0)},${Y(0) - 5} L${X(2.1)},${Y(-0.0525) - 5}`}
            fill="none"
            stroke={AMBER}
            strokeWidth={1.2}
            strokeDasharray="2 3"
          />
          <Trough xc={-1.8} X={X} Y={Y} />
          <Trough xc={-1.2} X={X} Y={Y} />
          <Trough xc={-0.6} X={X} Y={Y} />
          <Trough xc={0} X={X} Y={Y} />
          <Trough xc={0.6} X={X} Y={Y} />
          <Trough xc={1.2} X={X} Y={Y} />
          <Trough xc={1.8} X={X} Y={Y} />
          <path
            d={`M${X(-2.1)},${Y(-0.08)} L${X(-1.9)},${Y(-0.55)} L${X(1.9)},${Y(-0.55)} L${X(2.1)},${Y(-0.08)}`}
            fill="none"
            stroke={MUTE}
            strokeWidth={1.2}
            strokeDasharray="10 6"
          />
        </g>
        <g style={d(0.4)}>
          <EdgeBox side={-1} X={X} Y={Y} />
          <EdgeBox side={1} X={X} Y={Y} />
        </g>
        <g style={d(0.7)}>
          <Parapet side={-1} X={X} Y={Y} />
          <Parapet side={1} X={X} Y={Y} />
          <polyline
            points={`${X(2.36)},${Y(1.4)} ${X(2.36)},${Y(1.8)} ${X(2.33)},${Y(1.8)}`}
            fill="none"
            stroke={MUTE}
            strokeWidth={1.4}
            strokeDasharray="6 4"
          />
          <line
            x1={X(0)}
            y1={Y(1.95)}
            x2={X(0)}
            y2={Y(-0.95)}
            stroke={MUTE}
            strokeWidth={1}
            strokeDasharray="30 6 6 6"
          />
          <text x={X(0)} y={Y(1.95) - 10} textAnchor="middle" style={tx(20, MUTE)}>
            ℄ DECK
          </text>
        </g>
        <g style={d(1.1)}>
          <DimH x1={X(-2.0)} x2={X(2.0)} y={Y(0.62)} text="4 000 CLEAR" />
          <DimH
            x1={X(-2.7)}
            x2={X(2.7)}
            y={Y(-0.75) + 52}
            text="5 400 OVERALL"
            from1={Y(-0.75)}
            from2={Y(-0.75)}
          />
          <DimV
            x={X(-2.7) - 70}
            y1={Y(-0.0525)}
            y2={Y(-0.75)}
            text="750"
            from1={X(-2.7)}
            from2={X(-2.7)}
          />
          <DimV
            x={X(2.36) + 150}
            y1={Y(-0.0525)}
            y2={Y(1.4)}
            text="1 400"
            from1={X(2.36)}
            from2={X(2.36)}
            right
          />
          <text x={X(-1.05)} y={Y(0.15)} textAnchor="middle" style={{ ...tx(18, CY), ...HALO }}>
            ← 2.5%
          </text>
          <text x={X(1.05)} y={Y(0.15)} textAnchor="middle" style={{ ...tx(18, CY), ...HALO }}>
            2.5% →
          </text>
          <text x={X(0)} y={Y(-0.55) + 26} textAnchor="middle" style={{ ...tx(18, MUTE), ...HALO }}>
            CROSS-BEAM @ 3.0 m (BEYOND)
          </text>
          <text
            x={X(2.3) - 14}
            y={Y(1.8) + 6}
            textAnchor="end"
            style={{ ...tx(18, MUTE), ...HALO }}
          >
            1.8 m OVER RAIL
          </text>
          <Tag x={X(-1.5)} y={Y(-0.42)} n="1" />
          <Tag x={X(-2.4)} y={Y(-0.95)} n="2" />
          <line
            x1={X(-2.4)}
            y1={Y(-0.95) - 16}
            x2={X(-2.4)}
            y2={Y(-0.75)}
            stroke={CY}
            strokeWidth={1.2}
          />
          <Tag x={X(-3.15)} y={Y(0.32)} n="3" />
          <Tag x={X(-1.72)} y={Y(1.05)} n="4" />
          <line
            x1={X(-1.72) - 16}
            y1={Y(1.05)}
            x2={X(-2.3)}
            y2={Y(1.05)}
            stroke={CY}
            strokeWidth={1.2}
          />
          <Tag x={X(-1.72)} y={Y(1.62)} n="5" />
          <line
            x1={X(-1.72) - 12}
            y1={Y(1.62) + 11}
            x2={X(-2.0)}
            y2={Y(1.3)}
            stroke={CY}
            strokeWidth={1.2}
          />
          <Tag x={X(0.5)} y={Y(0.32)} n="6" />
          <line
            x1={X(0.5)}
            y1={Y(0.32) + 16}
            x2={X(0.5)}
            y2={Y(-0.0125) - 6}
            stroke={CY}
            strokeWidth={1.2}
          />
        </g>
      </Svg>
      <div className="ab-in" style={d(0.8)}>
        <div style={abs(1400, 262, SMALL)}>Key</div>
        <KeyNote top={300} n="1" text="14 mm deck plate + troughs" />
        <KeyNote top={360} n="2" text="Edge box 600 × 750, S355" />
        <KeyNote top={420} n="3" text="Pinned stay anchor bracket" />
        <KeyNote top={480} n="4" text="1.4 m parapet, 316L mesh" />
        <KeyNote top={540} n="5" text="LED handrail lighting" />
        <KeyNote top={600} n="6" text="8 mm epoxy-bauxite surfacing" />
      </div>
      <div className="ab-in" style={{ ...abs(1400, 680, { width: 420 }), ...d(1.1) }}>
        <div style={{ fontFamily: HAND, fontSize: 28, color: AMBER, lineHeight: 1.35 }}>
          4.0 m clear = two cyclists passing a pushchair
        </div>
      </div>
    </Sheet>
  );
};

const HeadStay = ({
  cx,
  Y,
  zp,
  side,
  dch,
  dz,
}: {
  cx: number;
  Y: (z: number) => number;
  zp: number;
  side: -1 | 1;
  dch: number;
  dz: number;
}) => {
  const len = Math.hypot(dch, dz);
  const ux = (dch / len) * 40;
  const uy = (-dz / len) * 40;
  const x0 = cx + side * 0.55 * 40;
  const y0 = Y(zp);
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  return (
    <g>
      <line x1={x0} y1={y0} x2={x0 + ux * 2.7} y2={y0 + uy * 2.7} stroke={CY} strokeWidth={2.2} />
      <rect
        x={x0 - 2}
        y={y0 - 4}
        width={22}
        height={8}
        transform={`rotate(${ang.toFixed(2)} ${x0} ${y0})`}
        fill={BG}
        stroke={INK}
        strokeWidth={1.4}
      />
      <line
        x1={cx - 22}
        y1={y0}
        x2={cx + 22}
        y2={y0}
        stroke={FAINT}
        strokeWidth={1}
        strokeDasharray="4 3"
      />
    </g>
  );
};

const PylonFig = ({ left, k, v }: { left: number; k: string; v: string }) => (
  <div style={abs(left, 712, { width: 240 })}>
    <div style={SMALL}>{k}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 500,
        fontSize: 34,
        lineHeight: 1.2,
        marginTop: 4,
      }}
    >
      {v}
    </div>
  </div>
);

const PylonPage: Page = () => {
  const uid = uidOf(useId());
  const cx = 470;
  const s = 12;
  const X = (t: number) => cx + t * s;
  const Y = (z: number) => 262 + (50.5 - z) * s;
  const leg = (sd: -1 | 1) =>
    `${X(sd * 5.05)},${Y(15.4)} ${X(sd * 3.95)},${Y(15.4)} ${X(sd * 0.1)},${Y(41)} ${X(sd * 0.9)},${Y(41)}`;
  const hx = 790;
  const HY = (z: number) => 300 + (49.8 - z) * 40;
  const bx = 1090;
  const by = 330;
  return (
    <Sheet
      title="Pylon P1"
      scale="AS SHOWN"
      label="Pylon P1 · transverse elevation + details"
      heading="A-frame pylon"
    >
      <Svg>
        <defs>
          <pattern
            id={`${uid}e`}
            width={9}
            height={9}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={9} stroke={GHOST} strokeWidth={1.2} />
          </pattern>
        </defs>
        <g style={d(0.1)}>
          <rect
            x={X(-9)}
            y={Y(16)}
            width={18 * s}
            height={Y(6) - Y(16)}
            fill={`url(#${uid}e)`}
            stroke="none"
          />
          <line x1={X(-9)} y1={Y(16)} x2={X(9)} y2={Y(16)} stroke={INK} strokeWidth={1.6} />
          <rect
            x={X(-5.6)}
            y={Y(15.4)}
            width={11.2 * s}
            height={2 * s}
            fill={BG}
            stroke={INK}
            strokeWidth={1.6}
          />
          <Pile g={{ s, X, Y }} ch={-4.5} top={13.4} bot={6.2} w={0.9} c={INK} />
          <Pile g={{ s, X, Y }} ch={-1.5} top={13.4} bot={6.2} w={0.9} c={INK} />
          <Pile g={{ s, X, Y }} ch={1.5} top={13.4} bot={6.2} w={0.9} c={INK} />
          <Pile g={{ s, X, Y }} ch={4.5} top={13.4} bot={6.2} w={0.9} c={INK} />
        </g>
        <g style={d(0.3)}>
          <rect
            x={X(-3.6)}
            y={Y(18.79)}
            width={7.2 * s}
            height={0.9 * s}
            fill={BG}
            stroke={INK}
            strokeWidth={1.6}
          />
          <rect
            x={X(-2.7)}
            y={Y(19.54)}
            width={5.4 * s}
            height={0.75 * s}
            fill={CY}
            fillOpacity={0.45}
            stroke={INK}
            strokeWidth={1.4}
          />
          <line
            x1={X(-2.36)}
            y1={Y(19.54)}
            x2={X(-2.36)}
            y2={Y(20.94)}
            stroke={FAINT}
            strokeWidth={1.2}
          />
          <line
            x1={X(2.36)}
            y1={Y(19.54)}
            x2={X(2.36)}
            y2={Y(20.94)}
            stroke={FAINT}
            strokeWidth={1.2}
          />
          <polygon points={leg(-1)} fill={BG} stroke={INK} strokeWidth={2} />
          <polygon points={leg(1)} fill={BG} stroke={INK} strokeWidth={2} />
          <polygon
            points={`${X(-1)},${Y(41)} ${X(1)},${Y(41)} ${X(1)},${Y(49)} ${X(0.6)},${Y(49.54)} ${X(-0.6)},${Y(49.54)} ${X(-1)},${Y(49)}`}
            fill={BG}
            stroke={INK}
            strokeWidth={2}
          />
          <line x1={X(-1)} y1={Y(48.4)} x2={X(-2.85)} y2={Y(19.6)} stroke={CY} strokeWidth={1.2} />
          <line x1={X(-1)} y1={Y(45.4)} x2={X(-2.85)} y2={Y(19.6)} stroke={CY} strokeWidth={1.2} />
          <line x1={X(-1)} y1={Y(42.4)} x2={X(-2.85)} y2={Y(19.6)} stroke={CY} strokeWidth={1.2} />
          <line x1={X(1)} y1={Y(48.4)} x2={X(2.85)} y2={Y(19.6)} stroke={CY} strokeWidth={1.2} />
          <line x1={X(1)} y1={Y(45.4)} x2={X(2.85)} y2={Y(19.6)} stroke={CY} strokeWidth={1.2} />
          <line x1={X(1)} y1={Y(42.4)} x2={X(2.85)} y2={Y(19.6)} stroke={CY} strokeWidth={1.2} />
        </g>
        <g style={d(0.9)}>
          <Level x1={140} x2={X(-1.2)} y={Y(PY_TOP)} text="+49.540 TOP" />
          <Level x1={140} x2={X(-1.2)} y={Y(41)} text="+41.000 ANCHOR ZONE" />
          <Level x1={140} x2={X(-3.6)} y={Y(19.54)} text="+19.540 DECK" />
          <Level x1={140} x2={X(-5.6)} y={Y(15.4)} text="+15.400 CAP" />
          <SectionCutH y={Y(25)} x1={X(-5.4)} x2={X(-1.2)} n="B" />
          <circle
            cx={X(0)}
            cy={Y(45.4)}
            r={70}
            fill="none"
            stroke={AMBER}
            strokeWidth={1.4}
            strokeDasharray="8 5"
          />
          <line
            x1={X(0) + 64}
            y1={Y(45.4) - 30}
            x2={hx - 90}
            y2={330}
            stroke={AMBER}
            strokeWidth={1.2}
          />
          <Tag x={hx - 106} y={326} n="1" c={AMBER} />
          <Leader
            pts={[X(3.2), Y(9), X(7), Y(4.5), X(9), Y(4.5)]}
            text="8 × Ø900 CFA PILES"
            sub="TOE −8.0 m AOD"
          />
        </g>
        <g style={d(0.5)}>
          <rect
            x={hx - 22}
            y={HY(49.0)}
            width={44}
            height={HY(41) - HY(49.0)}
            fill="none"
            stroke={INK}
            strokeWidth={2}
          />
          <polyline
            points={`${hx - 22},${HY(49)} ${hx - 14},${HY(49.54)} ${hx + 14},${HY(49.54)} ${hx + 22},${HY(49)}`}
            fill="none"
            stroke={INK}
            strokeWidth={2}
          />
          <line x1={hx - 32} y1={HY(41)} x2={hx - 32} y2={HY(39.6)} stroke={INK} strokeWidth={2} />
          <line x1={hx + 32} y1={HY(41)} x2={hx + 32} y2={HY(39.6)} stroke={INK} strokeWidth={2} />
          <HeadStay cx={hx} Y={HY} zp={48.4} side={-1} dch={-35.7} dz={-30.3} />
          <HeadStay cx={hx} Y={HY} zp={47.2} side={-1} dch={-29.7} dz={-28.8} />
          <HeadStay cx={hx} Y={HY} zp={46.0} side={-1} dch={-23.7} dz={-27.4} />
          <HeadStay cx={hx} Y={HY} zp={44.8} side={-1} dch={-17.7} dz={-25.9} />
          <HeadStay cx={hx} Y={HY} zp={43.6} side={-1} dch={-11.7} dz={-24.5} />
          <HeadStay cx={hx} Y={HY} zp={42.4} side={-1} dch={-5.7} dz={-23.0} />
          <HeadStay cx={hx} Y={HY} zp={42.4} side={1} dch={5.7} dz={-22.6} />
          <HeadStay cx={hx} Y={HY} zp={45.4} side={1} dch={11.7} dz={-25.4} />
          <HeadStay cx={hx} Y={HY} zp={48.4} side={1} dch={17.7} dz={-28.4} />
        </g>
        <g style={d(1.2)}>
          <DimV
            x={hx + 160}
            y1={HY(48.4)}
            y2={HY(42.4)}
            text="5 @ 1 200"
            from1={hx + 30}
            from2={hx + 30}
            right
          />
          <text x={hx - 60} y={752} style={tx(20, INK)}>
            DETAIL 1 · HEAD · 1:50
          </text>
          <line x1={hx - 60} y1={760} x2={hx + 200} y2={760} stroke={INK} strokeWidth={1.2} />
        </g>
        <g style={d(0.7)}>
          <path
            d={`M${bx},${by} h300 v225 h-300 Z M${bx + 10},${by + 10} h280 v205 h-280 Z`}
            fillRule="evenodd"
            fill={CY}
            fillOpacity={0.55}
            stroke={INK}
            strokeWidth={1.6}
          />
          <rect x={bx + 90} y={by + 10} width={6} height={50} fill={INK} />
          <rect x={bx + 204} y={by + 10} width={6} height={50} fill={INK} />
          <rect x={bx + 90} y={by + 165} width={6} height={50} fill={INK} />
          <rect x={bx + 204} y={by + 165} width={6} height={50} fill={INK} />
          <rect x={bx + 10} y={by + 109} width={50} height={6} fill={INK} />
          <rect x={bx + 240} y={by + 109} width={50} height={6} fill={INK} />
          <line
            x1={bx + 150}
            y1={by - 16}
            x2={bx + 150}
            y2={by + 241}
            stroke={MUTE}
            strokeWidth={1}
            strokeDasharray="20 5 4 5"
          />
          <line
            x1={bx - 16}
            y1={by + 112}
            x2={bx + 316}
            y2={by + 112}
            stroke={MUTE}
            strokeWidth={1}
            strokeDasharray="20 5 4 5"
          />
          <DimH x1={bx} x2={bx + 300} y={by + 270} text="1 200" from1={by + 225} from2={by + 225} />
          <Leader
            pts={[bx + 296, by + 40, bx + 360, by + 40, bx + 372, by + 40]}
            text="40 PLATE S460ML"
          />
          <Leader
            pts={[bx + 209, by + 50, bx + 260, by + 92, bx + 372, by + 92]}
            text="FLAT 200 × 25"
          />
          <Leader
            pts={[bx + 300, by + 225, bx + 360, by + 190, bx + 372, by + 190]}
            text="900 DEEP"
          />
          <text x={bx} y={by + 340} style={tx(20, INK)}>
            SECTION B–B · LEG · 1:20
          </text>
          <line x1={bx} y1={by + 348} x2={bx + 290} y2={by + 348} stroke={INK} strokeWidth={1.2} />
        </g>
      </Svg>
      <div className="ab-in" style={d(1.2)}>
        <PylonFig left={1090} k="Height" v="34.1 m above cap" />
        <PylonFig left={1370} k="Steel" v="S460ML · 96 t" />
        <PylonFig left={1610} k="Erection" v="2 lifts" />
      </div>
    </Sheet>
  );
};

const UdlIcon = ({ n, big }: { n: number; big?: boolean }) => {
  let p = '';
  const step = 96 / (n - 1);
  for (let i = 0; i < n; i++) {
    const x = 12 + i * step;
    p += `M${x},${big ? 6 : 16} L${x},36 `;
  }
  return (
    <g>
      <line x1={8} y1={big ? 6 : 16} x2={112} y2={big ? 6 : 16} stroke={CY} strokeWidth={1.2} />
      <path d={p} fill="none" stroke={CY} strokeWidth={1.2} />
    </g>
  );
};

const Beam = () => (
  <g>
    <line x1={6} y1={42} x2={114} y2={42} stroke={INK} strokeWidth={2.6} />
    <polygon points="12,44 4,56 20,56" fill="none" stroke={INK} strokeWidth={1.2} />
    <polygon points="108,44 100,56 116,56" fill="none" stroke={INK} strokeWidth={1.2} />
  </g>
);

const LoadIcon = ({ kind }: { kind: 'g' | 'q' | 'v' | 'w' | 't' | 'x' }) => (
  <svg width={120} height={60} viewBox="0 0 120 60" className="ab-ink" style={{ flex: 'none' }}>
    <Beam />
    {kind === 'g' && <UdlIcon n={5} />}
    {kind === 'q' && <UdlIcon n={11} big />}
    {kind === 'v' && (
      <g>
        <line x1={44} y1={6} x2={44} y2={36} stroke={CY} strokeWidth={2.2} />
        <line x1={76} y1={6} x2={76} y2={36} stroke={CY} strokeWidth={2.2} />
        <Head x={44} y={40} ang={Math.PI / 2} l={9} w={4} />
        <Head x={76} y={40} ang={Math.PI / 2} l={9} w={4} />
      </g>
    )}
    {kind === 'w' && (
      <g>
        <path
          d="M6,18 C26,10 40,26 60,18 M6,30 C26,22 40,38 60,30"
          fill="none"
          stroke={CY}
          strokeWidth={1.4}
        />
        <line x1={60} y1={24} x2={90} y2={24} stroke={CY} strokeWidth={1.6} />
        <Head x={98} y={24} ang={0} l={10} w={4} />
      </g>
    )}
    {kind === 't' && (
      <g>
        <line x1={20} y1={22} x2={100} y2={22} stroke={CY} strokeWidth={1.4} />
        <Head x={14} y={22} ang={Math.PI} l={10} w={4} />
        <Head x={106} y={22} ang={0} l={10} w={4} />
        <circle cx={60} cy={10} r={4} fill="none" stroke={AMBER} strokeWidth={1.4} />
      </g>
    )}
    {kind === 'x' && (
      <g>
        <line x1={20} y1={42} x2={60} y2={4} stroke={FAINT} strokeWidth={1.2} />
        <line x1={46} y1={42} x2={60} y2={4} stroke={CY} strokeWidth={1.4} />
        <line x1={84} y1={42} x2={60} y2={4} stroke={CY} strokeWidth={1.4} />
        <line x1={26} y1={16} x2={44} y2={32} stroke={AMBER} strokeWidth={2.2} />
        <line x1={44} y1={16} x2={26} y2={32} stroke={AMBER} strokeWidth={2.2} />
      </g>
    )}
  </svg>
);

const LoadRow = ({
  top,
  code,
  title,
  basis,
  value,
  kind,
}: {
  top: number;
  code: string;
  title: string;
  basis: string;
  value: string;
  kind: 'g' | 'q' | 'v' | 'w' | 't' | 'x';
}) => (
  <div
    style={abs(120, top, {
      width: 1020,
      height: 82,
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      borderBottom: `1px solid ${GHOST}`,
      boxSizing: 'border-box',
    })}
  >
    <LoadIcon kind={kind} />
    <div style={{ width: 260 }}>
      <div style={{ ...SMALL, color: CY }}>{code}</div>
      <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15 }}>{title}</div>
    </div>
    <div
      style={{ ...SMALL, width: 300, textTransform: 'none', letterSpacing: '0.04em', fontSize: 20 }}
    >
      {basis}
    </div>
    <div style={{ fontFamily: MONO, fontSize: 28, marginLeft: 'auto', color: INK }}>{value}</div>
  </div>
);

const UtilBar = ({
  top,
  label,
  sub,
  u,
  val,
}: {
  top: number;
  label: string;
  sub: string;
  u: number;
  val: string;
}) => (
  <div style={abs(1230, top, { width: 570 })}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 28, fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 28, color: u > 0.75 ? AMBER : CY }}>{val}</span>
    </div>
    <div style={{ ...SMALL, marginTop: 2 }}>{sub}</div>
    <svg width={570} height={30} viewBox="0 0 570 30" className="ab-ink" style={{ marginTop: 8 }}>
      <rect x={0} y={6} width={540} height={18} fill="none" stroke={FAINT} strokeWidth={1} />
      <rect
        x={0}
        y={6}
        width={540 * u}
        height={18}
        fill={u > 0.75 ? AMBER : CY}
        fillOpacity={u > 0.75 ? 1 : 0.75}
        stroke="none"
      />
      <line x1={135} y1={2} x2={135} y2={28} stroke={GHOST} strokeWidth={1} />
      <line x1={270} y1={2} x2={270} y2={28} stroke={GHOST} strokeWidth={1} />
      <line x1={405} y1={2} x2={405} y2={28} stroke={GHOST} strokeWidth={1} />
      <line x1={540} y1={0} x2={540} y2={30} stroke={INK} strokeWidth={2} />
    </svg>
  </div>
);

const LoadsPage: Page = () => (
  <Sheet
    title="Load cases + checks"
    label="Design basis · EN 1990–1993 + UK NA"
    heading="Load cases"
  >
    <div className="ab-in" style={d(0.2)}>
      <div style={abs(264, 266, SMALL)}>Case</div>
      <div style={abs(548, 266, SMALL)}>Basis</div>
      <div style={abs(940, 266, { ...SMALL, width: 200, textAlign: 'right' })}>Value</div>
      <LoadRow
        top={300}
        code="LC1"
        title="Permanent"
        basis="Self-weight + finishes"
        value="34 kN/m"
        kind="g"
      />
      <LoadRow
        top={382}
        code="LC2"
        title="Crowd"
        basis="EN 1991-2 §5.3.2.1"
        value="5.0 kN/m²"
        kind="q"
      />
      <LoadRow
        top={464}
        code="LC3"
        title="Service vehicle"
        basis="EN 1991-2 §5.6.3"
        value="12 t"
        kind="v"
      />
      <LoadRow
        top={546}
        code="LC4"
        title="Wind"
        basis="Basic wind 22.5 m/s"
        value="1.05 kN/m²"
        kind="w"
      />
      <LoadRow
        top={628}
        code="LC5"
        title="Temperature"
        basis="EN 1991-1-5"
        value="−17 / +38 °C"
        kind="t"
      />
      <LoadRow
        top={710}
        code="LC6"
        title="Stay loss"
        basis="Any one stay · DAF 2.0"
        value="1 stay"
        kind="x"
      />
    </div>
    <div style={abs(1230, 266, LABEL)}>Governing checks</div>
    <div className="ab-in" style={d(0.6)}>
      <UtilBar top={312} label="Edge girder, bending" sub="ULS · LC1 + LC2" u={0.78} val="0.78" />
      <UtilBar
        top={438}
        label="Pylon leg, axial + bending"
        sub="ULS · LC1 + LC2 + LC4"
        u={0.71}
        val="0.71"
      />
      <UtilBar top={564} label="Stays, after stay loss" sub="ALS · LC6" u={0.62} val="0.62" />
      <UtilBar
        top={690}
        label="Mid-span deflection"
        sub="SLS · 74 mm vs L/400"
        u={0.64}
        val="L/622"
      />
    </div>
    <div className="ab-in" style={{ ...abs(120, 840), ...d(1.2) }}>
      <span style={{ fontFamily: HAND, fontSize: 30, color: AMBER }}>
        every check under 0.80 — headroom for 90% design
      </span>
    </div>
  </Sheet>
);

const SteelSwatch = () => {
  const uid = uidOf(useId());
  return (
    <svg width={140} height={140} viewBox="0 0 140 140" className="ab-ink" style={{ flex: 'none' }}>
      <defs>
        <pattern
          id={uid}
          width={10}
          height={10}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={10} stroke={CY} strokeWidth={2} />
        </pattern>
      </defs>
      <path
        d="M10,10 H130 V34 H82 V106 H130 V130 H10 V106 H58 V34 H10 Z"
        fill={`url(#${uid})`}
        stroke={INK}
        strokeWidth={1.8}
      />
    </svg>
  );
};

const StrandSwatch = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" className="ab-ink" style={{ flex: 'none' }}>
    <circle cx={70} cy={70} r={60} fill="none" stroke={INK} strokeWidth={2} />
    <circle cx={70} cy={70} r={50} fill="none" stroke={CY} strokeWidth={8} strokeDasharray="10 3" />
    <circle cx={70} cy={70} r={36} fill="none" stroke={CY} strokeWidth={8} strokeDasharray="8 3" />
    <circle
      cx={70}
      cy={70}
      r={22}
      fill="none"
      stroke={MUTE}
      strokeWidth={7}
      strokeDasharray="6 3"
    />
    <circle cx={70} cy={70} r={9} fill={MUTE} />
  </svg>
);

const ConcreteSwatch = () => {
  const uid = uidOf(useId());
  return (
    <svg width={140} height={140} viewBox="0 0 140 140" className="ab-ink" style={{ flex: 'none' }}>
      <defs>
        <pattern id={uid} width={34} height={34} patternUnits="userSpaceOnUse">
          <circle cx={6} cy={8} r={1.6} fill={CY} />
          <circle cx={22} cy={4} r={1.2} fill={CY} />
          <circle cx={28} cy={22} r={1.8} fill={CY} />
          <circle cx={12} cy={26} r={1.2} fill={CY} />
          <polygon points="14,12 20,14 15,18" fill="none" stroke={CY} strokeWidth={1.1} />
          <polygon points="2,20 7,18 6,24" fill="none" stroke={CY} strokeWidth={1.1} />
        </pattern>
      </defs>
      <rect
        x={10}
        y={10}
        width={120}
        height={120}
        fill={`url(#${uid})`}
        stroke={INK}
        strokeWidth={1.8}
      />
    </svg>
  );
};

const PaintSwatch = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" className="ab-ink" style={{ flex: 'none' }}>
    <rect
      x={10}
      y={88}
      width={120}
      height={42}
      fill={MUTE}
      fillOpacity={0.35}
      stroke={INK}
      strokeWidth={1.6}
    />
    <rect
      x={10}
      y={70}
      width={120}
      height={18}
      fill={CY}
      fillOpacity={0.25}
      stroke={INK}
      strokeWidth={1.2}
    />
    <rect
      x={10}
      y={48}
      width={120}
      height={22}
      fill={CY}
      fillOpacity={0.45}
      stroke={INK}
      strokeWidth={1.2}
    />
    <rect
      x={10}
      y={30}
      width={120}
      height={18}
      fill={CY}
      fillOpacity={0.65}
      stroke={INK}
      strokeWidth={1.2}
    />
    <rect
      x={10}
      y={16}
      width={120}
      height={14}
      fill={INK}
      fillOpacity={0.85}
      stroke={INK}
      strokeWidth={1.2}
    />
  </svg>
);

const MeshSwatch = () => {
  const uid = uidOf(useId());
  return (
    <svg width={140} height={140} viewBox="0 0 140 140" className="ab-ink" style={{ flex: 'none' }}>
      <defs>
        <pattern
          id={uid}
          width={16}
          height={16}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect x={0} y={0} width={16} height={16} fill="none" stroke={CY} strokeWidth={1.4} />
        </pattern>
      </defs>
      <rect
        x={10}
        y={10}
        width={120}
        height={120}
        fill={`url(#${uid})`}
        stroke={INK}
        strokeWidth={1.8}
      />
      <line x1={10} y1={18} x2={130} y2={18} stroke={INK} strokeWidth={3} />
      <line x1={10} y1={122} x2={130} y2={122} stroke={INK} strokeWidth={3} />
    </svg>
  );
};

const GritSwatch = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" className="ab-ink" style={{ flex: 'none' }}>
    <rect x={10} y={56} width={120} height={74} fill="none" stroke={INK} strokeWidth={1.8} />
    <path
      d="M10,56 L18,48 L24,54 L31,46 L39,53 L46,45 L54,52 L61,47 L69,54 L77,46 L85,52 L92,45 L100,53 L108,47 L115,54 L123,46 L130,56"
      fill={AMBER}
      fillOpacity={0.4}
      stroke={AMBER}
      strokeWidth={1.4}
    />
    <line x1={10} y1={58} x2={130} y2={58} stroke={CY} strokeWidth={3} />
    <text x={70} y={102} textAnchor="middle" style={tx(18, MUTE)}>
      DECK PLATE
    </text>
  </svg>
);

const MatCard = ({
  x,
  y,
  swatch,
  name,
  spec,
  qty,
  note,
}: {
  x: number;
  y: number;
  swatch: ReactNode;
  name: string;
  spec: string;
  qty: string;
  note: string;
}) => (
  <div
    style={abs(x, y, {
      width: 532,
      height: 262,
      boxSizing: 'border-box',
      borderTop: `1.2px solid ${FAINT}`,
      padding: '26px 0 0',
      display: 'flex',
      gap: 26,
    })}
  >
    {swatch}
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 600,
          fontSize: 32,
          textTransform: 'uppercase',
          lineHeight: 1.1,
        }}
      >
        {name}
      </div>
      <div
        style={{
          ...SMALL,
          marginTop: 10,
          lineHeight: 1.45,
          textTransform: 'none',
          fontSize: 20,
          letterSpacing: '0.04em',
        }}
      >
        {spec}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 28, color: CY, marginTop: 10 }}>{qty}</div>
      <div style={{ fontSize: 28, color: MUTE, marginTop: 10, lineHeight: 1.3 }}>{note}</div>
    </div>
  </div>
);

const MaterialsPage: Page = () => (
  <Sheet title="Materials schedule" label="Materials · hatch legend + schedule" heading="Materials">
    <div className="ab-in" style={d(0.2)}>
      <MatCard
        x={120}
        y={262}
        swatch={<SteelSwatch />}
        name="Structural steel"
        spec="S355 deck · S460 pylon"
        qty="412 t"
        note="Shop-welded, nine segments"
      />
      <MatCard
        x={694}
        y={262}
        swatch={<StrandSwatch />}
        name="Stays"
        spec="Locked coil · Ø40 / Ø60"
        qty="18 no."
        note="Replaceable one at a time"
      />
      <MatCard
        x={1268}
        y={262}
        swatch={<ConcreteSwatch />}
        name="Concrete"
        spec="C40/50 · piles + abutments"
        qty="640 m³"
        note="30% GGBS cement swap"
      />
    </div>
    <div className="ab-in" style={d(0.5)}>
      <MatCard
        x={120}
        y={558}
        swatch={<PaintSwatch />}
        name="Paint system"
        spec="ISO 12944 C4 · 4 coats"
        qty="320 µm DFT"
        note="25 years to first repaint"
      />
      <MatCard
        x={694}
        y={558}
        swatch={<MeshSwatch />}
        name="Parapet infill"
        spec="316L mesh · rail screens"
        qty="1.4 m / 1.8 m"
        note="Climb-proof over the rail"
      />
      <MatCard
        x={1268}
        y={558}
        swatch={<GritSwatch />}
        name="Surfacing"
        spec="Epoxy + calcined bauxite"
        qty="PTV ≥ 45 wet"
        note="Grips when wet"
      />
    </div>
    <div className="ab-in" style={{ ...abs(120, 872, { width: 1060 }), ...d(0.9) }}>
      <div style={SMALL}>Embodied carbon · A1–A5</div>
      <div style={{ fontSize: 30, marginTop: 6 }}>
        1,140 tCO₂e — <span style={{ color: CY }}>31% below</span> our 2019 footbridge baseline
      </div>
    </div>
  </Sheet>
);

const fx = (f: number) => 236 + f * 166;

const Band = ({
  f0,
  f1,
  y,
  h,
  lvl,
  pat,
}: {
  f0: number;
  f1: number;
  y: number;
  h: number;
  lvl: 1 | 2 | 3;
  pat?: string;
}) => (
  <rect
    x={fx(f0)}
    y={y}
    width={fx(f1) - fx(f0)}
    height={h}
    fill={lvl === 1 && pat ? `url(#${pat})` : CY}
    fillOpacity={lvl === 1 ? 1 : lvl === 2 ? 0.28 : 0.09}
    stroke={lvl === 1 ? AMBER : CY}
    strokeOpacity={0.6}
    strokeWidth={1}
  />
);

const ModeMark = ({
  f,
  y: y0,
  h,
  n,
  lift = 0,
}: {
  f: number;
  y: number;
  h: number;
  n: string;
  lift?: number;
}) => {
  const y = y0 - lift;
  return (
    <g>
      <line x1={fx(f)} y1={y - 14} x2={fx(f)} y2={y0 + h + 6} stroke={INK} strokeWidth={2.4} />
      <rect
        x={fx(f) - 52}
        y={y - 46}
        width={104}
        height={30}
        fill={BG}
        stroke={INK}
        strokeWidth={1.2}
      />
      <text x={fx(f)} y={y - 24} textAnchor="middle" style={tx(18, INK)}>
        {n} {f.toFixed(2)}
      </text>
    </g>
  );
};

const AccBar = ({
  y,
  v,
  max,
  label,
  after,
}: {
  y: number;
  v: number;
  max: number;
  label: string;
  after?: boolean;
}) => (
  <g>
    <text x={1170} y={y + 20} style={tx(18, after ? CY : MUTE)}>
      {label}
    </text>
    <rect
      x={1360}
      y={y}
      width={(v / max) * 420}
      height={28}
      fill={after ? CY : MUTE}
      fillOpacity={after ? 0.8 : 0.4}
      stroke="none"
    />
    <text x={1360 + (v / max) * 420 + 10} y={y + 21} style={tx(20, after ? CY : INK)}>
      {v.toFixed(2)}
    </text>
  </g>
);

const VibrationPage: Page = () => {
  const uid = uidOf(useId());
  return (
    <Sheet
      title="Dynamics + comfort"
      label="Pedestrian dynamics · Sétra class II"
      heading="Vibration + comfort"
    >
      <Svg>
        <defs>
          <pattern
            id={`${uid}h`}
            width={8}
            height={8}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={8} stroke={AMBER} strokeWidth={2.2} />
          </pattern>
        </defs>
        <g style={d(0.1)}>
          <text x={120} y={348} style={tx(20, INK)}>
            VERTICAL
          </text>
          <text x={120} y={478} style={tx(20, INK)}>
            LATERAL
          </text>
          <Band f0={1.0} f1={1.7} y={318} h={54} lvl={2} />
          <Band f0={1.7} f1={2.1} y={318} h={54} lvl={1} pat={`${uid}h`} />
          <Band f0={2.1} f1={2.6} y={318} h={54} lvl={2} />
          <Band f0={2.6} f1={5.0} y={318} h={54} lvl={3} />
          <Band f0={0.3} f1={0.5} y={448} h={54} lvl={2} />
          <Band f0={0.5} f1={1.1} y={448} h={54} lvl={1} pat={`${uid}h`} />
          <Band f0={1.1} f1={1.3} y={448} h={54} lvl={2} />
          <Band f0={1.3} f1={2.5} y={448} h={54} lvl={3} />
          <line x1={fx(0)} y1={540} x2={fx(5)} y2={540} stroke={INK} strokeWidth={1.4} />
          <line x1={fx(0)} y1={300} x2={fx(0)} y2={540} stroke={FAINT} strokeWidth={1} />
          <text x={fx(0)} y={572} textAnchor="middle" style={tx(18, MUTE)}>
            0
          </text>
          <text x={fx(1)} y={572} textAnchor="middle" style={tx(18, MUTE)}>
            1
          </text>
          <text x={fx(2)} y={572} textAnchor="middle" style={tx(18, MUTE)}>
            2
          </text>
          <text x={fx(3)} y={572} textAnchor="middle" style={tx(18, MUTE)}>
            3
          </text>
          <text x={fx(4)} y={572} textAnchor="middle" style={tx(18, MUTE)}>
            4
          </text>
          <text x={fx(5)} y={572} textAnchor="middle" style={tx(18, MUTE)}>
            5 Hz
          </text>
          <line x1={fx(1)} y1={536} x2={fx(1)} y2={546} stroke={INK} strokeWidth={1.2} />
          <line x1={fx(2)} y1={536} x2={fx(2)} y2={546} stroke={INK} strokeWidth={1.2} />
          <line x1={fx(3)} y1={536} x2={fx(3)} y2={546} stroke={INK} strokeWidth={1.2} />
          <line x1={fx(4)} y1={536} x2={fx(4)} y2={546} stroke={INK} strokeWidth={1.2} />
          <line x1={fx(5)} y1={536} x2={fx(5)} y2={546} stroke={INK} strokeWidth={1.2} />
        </g>
        <g style={d(0.7)}>
          <ModeMark f={2.31} y={318} h={54} n="V1" />
          <ModeMark f={2.95} y={318} h={54} n="T1" lift={34} />
          <ModeMark f={3.84} y={318} h={54} n="V2" />
          <ModeMark f={1.12} y={448} h={54} n="L1" />
          <rect
            x={236}
            y={600}
            width={26}
            height={18}
            fill={`url(#${uid}h)`}
            stroke={AMBER}
            strokeWidth={1}
          />
          <text x={272} y={615} style={tx(18, MUTE)}>
            RANGE 1 · MAX RISK
          </text>
          <rect
            x={520}
            y={600}
            width={26}
            height={18}
            fill={CY}
            fillOpacity={0.28}
            stroke={CY}
            strokeWidth={1}
          />
          <text x={556} y={615} style={tx(18, MUTE)}>
            RANGE 2 · MEDIUM
          </text>
          <rect
            x={790}
            y={600}
            width={26}
            height={18}
            fill={CY}
            fillOpacity={0.09}
            stroke={CY}
            strokeWidth={1}
          />
          <text x={826} y={615} style={tx(18, MUTE)}>
            RANGE 3 · LOW
          </text>
        </g>
        <g style={d(1.0)}>
          <text x={120} y={688} style={tx(20, INK)}>
            MODE V1 · 2.31 Hz · MAIN SPAN
          </text>
          <line x1={200} y1={770} x2={1040} y2={770} stroke={FAINT} strokeWidth={1.2} />
          <polygon points="200,772 190,790 210,790" fill="none" stroke={INK} strokeWidth={1.4} />
          <polygon points="804,772 794,790 814,790" fill="none" stroke={INK} strokeWidth={1.4} />
          <polygon points="1040,772 1030,790 1050,790" fill="none" stroke={INK} strokeWidth={1.4} />
          <line x1={804} y1={770} x2={804} y2={712} stroke={INK} strokeWidth={3} />
          <path
            className="ab-sway"
            style={{ transformOrigin: '0px 770px' }}
            d="M200,770 C300,722 420,716 500,722 C600,730 720,772 804,770 C870,768 940,782 1040,770"
            fill="none"
            stroke={CY}
            strokeWidth={2.6}
          />
        </g>
      </Svg>
      <Svg>
        <g style={d(0.4)}>
          <text x={1170} y={286} style={tx(20, CY)}>
            PEAK ACCEL. m/s² · 0.8 P/m²
          </text>
          <text x={1170} y={336} style={tx(18, INK)}>
            VERTICAL
          </text>
          <AccBar y={352} v={0.71} max={1.0} label="NO TMD" />
          <AccBar y={392} v={0.32} max={1.0} label="WITH TMD" after />
          <line
            x1={1360 + 0.5 * 420}
            y1={344}
            x2={1360 + 0.5 * 420}
            y2={430}
            stroke={AMBER}
            strokeWidth={1.6}
            strokeDasharray="5 4"
          />
          <text x={1360 + 0.5 * 420} y={448} textAnchor="middle" style={tx(18, AMBER)}>
            LIMIT 0.50
          </text>
          <text x={1170} y={498} style={tx(18, INK)}>
            LATERAL
          </text>
          <AccBar y={514} v={0.19} max={0.25} label="NO TMD" />
          <AccBar y={554} v={0.06} max={0.25} label="WITH TMD" after />
          <line
            x1={1360 + 0.4 * 420}
            y1={506}
            x2={1360 + 0.4 * 420}
            y2={592}
            stroke={AMBER}
            strokeWidth={1.6}
            strokeDasharray="5 4"
          />
          <text x={1360 + 0.4 * 420} y={610} textAnchor="middle" style={tx(18, AMBER)}>
            LIMIT 0.10
          </text>
        </g>
        <g style={d(0.9)}>
          <line x1={1170} y1={668} x2={1460} y2={668} stroke={INK} strokeWidth={3} />
          <line x1={1270} y1={668} x2={1270} y2={690} stroke={INK} strokeWidth={1.4} />
          <path
            d="M1270,690 l-10,5 l20,10 l-20,10 l20,10 l-10,5"
            fill="none"
            stroke={CY}
            strokeWidth={1.6}
          />
          <line x1={1270} y1={730} x2={1270} y2={744} stroke={INK} strokeWidth={1.4} />
          <line x1={1340} y1={668} x2={1340} y2={696} stroke={INK} strokeWidth={1.4} />
          <rect x={1330} y={696} width={20} height={26} fill="none" stroke={CY} strokeWidth={1.6} />
          <line x1={1340} y1={710} x2={1340} y2={744} stroke={INK} strokeWidth={1.4} />
          <line x1={1324} y1={710} x2={1356} y2={710} stroke={CY} strokeWidth={1.6} />
          <rect
            x={1236}
            y={744}
            width={140}
            height={52}
            fill={CY}
            fillOpacity={0.4}
            stroke={INK}
            strokeWidth={1.6}
          />
          <text x={1306} y={777} textAnchor="middle" style={tx(18, INK)}>
            1.2 t
          </text>
          <text x={1476} y={700} style={tx(20, INK)}>
            3 TMDs
          </text>
          <text x={1476} y={730} style={tx(18, MUTE)}>
            2 × 1.2 t VERT
          </text>
          <text x={1476} y={758} style={tx(18, MUTE)}>
            1 × 0.8 t LAT
          </text>
          <text x={1476} y={792} style={tx(20, AMBER)}>
            £180k PROV.
          </text>
        </g>
      </Svg>
    </Sheet>
  );
};

const StageCol = ({
  x,
  y,
  n,
  title,
  when,
  body,
  children,
}: {
  x: number;
  y: number;
  n: string;
  title: string;
  when: string;
  body: string;
  children: ReactNode;
}) => (
  <div style={abs(x, y, { width: 820 })}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: `1.2px solid ${FAINT}`,
        paddingBottom: 6,
      }}
    >
      <span style={LABEL}>Stage {n}</span>
      <span style={{ ...SMALL, color: AMBER }}>{when}</span>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
      <svg
        width={500}
        height={246}
        viewBox="0 0 500 246"
        className="ab-ink"
        style={{ display: 'block', flex: 'none' }}
      >
        {children}
      </svg>
      <div style={{ paddingTop: 20 }}>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 600,
            fontSize: 34,
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        <p style={{ fontSize: 28, lineHeight: 1.38, color: MUTE, margin: '12px 0 0' }}>{body}</p>
      </div>
    </div>
  </div>
);

const ConstructionPage: Page = () => {
  const sg = geo(6, 58, 3, 52);
  return (
    <Sheet
      title="Construction sequence"
      label="Construction sequence · 4 stages"
      heading="How it gets built"
    >
      <Steps>
        <Step>
          <StageCol
            x={120}
            y={256}
            n="1"
            title="Substructure"
            when="Aug–Dec 2027"
            body="Piles, pile cap and abutments, then the lower pylon to deck level."
          >
            <Elevation g={sg} zBot={11.5} lite show={['sub', 'pyLo']} hl={['sub', 'pyLo']} />
          </StageCol>
        </Step>
        <Step>
          <StageCol
            x={980}
            y={256}
            n="2"
            title="Back span"
            when="Easter 2028 · 54 h"
            body="18 m span lifted over the railway in one piece, in a single possession."
          >
            <Elevation
              g={sg}
              zBot={11.5}
              lite
              show={['sub', 'pyLo', 'back']}
              hl={['back']}
              crane={[55, 31]}
            />
          </StageCol>
        </Step>
        <Step>
          <StageCol
            x={120}
            y={556}
            n="3"
            title="Upper pylon"
            when="May 2028"
            body="Pylon head lifted in two pieces; backstays fitted and part-stressed."
          >
            <Elevation
              g={sg}
              zBot={11.5}
              lite
              show={['sub', 'pyLo', 'back', 'pyHi', 'bstays']}
              hl={['pyHi', 'bstays']}
              crane={[47, 51.5]}
            />
          </StageCol>
        </Step>
        <Step>
          <StageCol
            x={980}
            y={556}
            n="4"
            title="Main span"
            when="Jun–Sep 2028"
            body="Three segments on two river trestles; stays stressed, trestles out."
          >
            <Elevation
              g={sg}
              zBot={11.5}
              lite
              show={['sub', 'pyLo', 'back', 'pyHi', 'bstays', 'main', 'mstays', 'trestles']}
              hl={['main', 'mstays', 'trestles']}
            />
          </StageCol>
        </Step>
      </Steps>
    </Sheet>
  );
};

const CostSeg = ({
  x0,
  v,
  letter,
  hatch,
}: {
  x0: number;
  v: number;
  letter: string;
  hatch?: string;
}) => {
  const w = v * 160;
  return (
    <g>
      <rect
        x={120 + x0 * 160}
        y={470}
        width={w}
        height={56}
        fill={hatch ?? CY}
        fillOpacity={hatch ? 1 : 0.16}
        stroke={INK}
        strokeWidth={1.4}
      />
      <text
        x={120 + x0 * 160 + w / 2}
        y={505}
        textAnchor="middle"
        style={{ ...tx(20, INK), ...HALO }}
      >
        {letter}
      </text>
      <line
        x1={120 + x0 * 160}
        y1={442}
        x2={120 + x0 * 160}
        y2={462}
        stroke={CY}
        strokeWidth={1.1}
      />
      <line
        x1={120 + x0 * 160 - 6}
        y1={456}
        x2={120 + x0 * 160 + 6}
        y2={448}
        stroke={CY}
        strokeWidth={2}
      />
      <text x={120 + x0 * 160 + w / 2} y={446} textAnchor="middle" style={tx(18, CY)}>
        {v.toFixed(2)}
      </text>
    </g>
  );
};

const CostLine = ({
  x,
  y,
  letter,
  name,
  v,
}: {
  x: number;
  y: number;
  letter: string;
  name: string;
  v: string;
}) => (
  <div
    style={abs(x, y, {
      width: 470,
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      borderBottom: `1px solid ${GHOST}`,
      paddingBottom: 6,
    })}
  >
    <span style={{ fontFamily: MONO, fontSize: 20, color: CY, width: 22 }}>{letter}</span>
    <span style={{ fontSize: 28 }}>{name}</span>
    <span style={{ fontFamily: MONO, fontSize: 26, marginLeft: 'auto' }}>{v}</span>
  </div>
);

const BigStat = ({ x, k, v, accent }: { x: number; k: string; v: string; accent?: boolean }) => (
  <div style={abs(x, 262)}>
    <div style={{ ...SMALL, color: accent ? CY : MUTE }}>{k}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 600,
        fontSize: 84,
        lineHeight: 1.05,
        color: accent ? CY : INK,
      }}
    >
      {v}
    </div>
  </div>
);

const CostPage: Page = () => {
  const uid = uidOf(useId());
  return (
    <Sheet title="Cost plan" label="Cost plan · 60% estimate · Q3 2026 prices" heading="Cost">
      <div className="ab-in" style={d(0.1)}>
        <BigStat x={120} k="P50 estimate" v="£8.90 M" accent />
        <BigStat x={540} k="Approved envelope" v="£9.40 M" />
        <BigStat x={960} k="P90" v="£9.62 M" />
      </div>
      <Svg>
        <defs>
          <pattern
            id={uid}
            width={8}
            height={8}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={8}
              stroke={AMBER}
              strokeOpacity={0.7}
              strokeWidth={1.6}
            />
          </pattern>
        </defs>
        <g style={d(0.3)}>
          <CostSeg x0={0} v={1.42} letter="A" />
          <CostSeg x0={1.42} v={2.18} letter="B" />
          <CostSeg x0={3.6} v={0.96} letter="C" />
          <CostSeg x0={4.56} v={0.64} letter="D" />
          <CostSeg x0={5.2} v={0.88} letter="E" />
          <CostSeg x0={6.08} v={0.46} letter="F" />
          <CostSeg x0={6.54} v={0.71} letter="G" />
          <CostSeg x0={7.25} v={0.95} letter="H" />
          <CostSeg x0={8.2} v={0.7} letter="I" hatch={`url(#${uid})`} />
          <line x1={1544} y1={442} x2={1544} y2={462} stroke={CY} strokeWidth={1.1} />
          <line x1={1538} y1={456} x2={1550} y2={448} stroke={CY} strokeWidth={2} />
        </g>
        <g style={d(0.9)}>
          <line x1={120} y1={548} x2={1720} y2={548} stroke={FAINT} strokeWidth={1} />
          <line x1={120} y1={542} x2={120} y2={554} stroke={MUTE} strokeWidth={1.2} />
          <line x1={440} y1={542} x2={440} y2={554} stroke={MUTE} strokeWidth={1.2} />
          <line x1={760} y1={542} x2={760} y2={554} stroke={MUTE} strokeWidth={1.2} />
          <line x1={1080} y1={542} x2={1080} y2={554} stroke={MUTE} strokeWidth={1.2} />
          <line x1={1400} y1={542} x2={1400} y2={554} stroke={MUTE} strokeWidth={1.2} />
          <line x1={1720} y1={542} x2={1720} y2={554} stroke={MUTE} strokeWidth={1.2} />
          <text x={120} y={578} textAnchor="middle" style={tx(18, MUTE)}>
            £0
          </text>
          <text x={440} y={578} textAnchor="middle" style={tx(18, MUTE)}>
            2
          </text>
          <text x={760} y={578} textAnchor="middle" style={tx(18, MUTE)}>
            4
          </text>
          <text x={1080} y={578} textAnchor="middle" style={tx(18, MUTE)}>
            6
          </text>
          <text x={1400} y={578} textAnchor="middle" style={tx(18, MUTE)}>
            8
          </text>
          <text x={1720} y={578} textAnchor="middle" style={tx(18, MUTE)}>
            £10 M
          </text>
          <line
            x1={1624}
            y1={400}
            x2={1624}
            y2={540}
            stroke={INK}
            strokeWidth={1.6}
            strokeDasharray="6 4"
          />
          <text x={1616} y={414} textAnchor="end" style={tx(18, INK)}>
            ENVELOPE 9.40
          </text>
          <line
            x1={1659}
            y1={380}
            x2={1659}
            y2={540}
            stroke={MUTE}
            strokeWidth={1.4}
            strokeDasharray="3 4"
          />
          <text x={1667} y={394} style={tx(18, MUTE)}>
            P90
          </text>
          <path d="M1546,534 q39,22 78,0" fill="none" stroke={AMBER} strokeWidth={1.6} />
          <text x={1586} y={616} textAnchor="middle" style={tx(24, AMBER, HAND)}>
            £0.5 M headroom
          </text>
        </g>
      </Svg>
      <div className="ab-in" style={d(0.7)}>
        <CostLine x={120} y={620} letter="A" name="Piling + substructure" v="1.42" />
        <CostLine x={120} y={672} letter="B" name="Deck steelwork" v="2.18" />
        <CostLine x={120} y={724} letter="C" name="Pylon" v="0.96" />
        <CostLine x={120} y={776} letter="D" name="Stays + anchorages" v="0.64" />
        <CostLine x={120} y={828} letter="E" name="Rail interface + possession" v="0.88" />
        <CostLine x={650} y={620} letter="F" name="River works + ecology" v="0.46" />
        <CostLine x={650} y={672} letter="G" name="Parapets, surfacing, lighting" v="0.71" />
        <CostLine x={650} y={724} letter="H" name="Preliminaries" v="0.95" />
        <CostLine x={650} y={776} letter="I" name="Quantified risk (P50)" v="0.70" />
      </div>
      <div className="ab-in" style={{ ...abs(1250, 680, { width: 550 }), ...d(1.0) }}>
        <div style={{ ...SMALL, color: CY }}>Deck area rate</div>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 600,
            fontSize: 56,
            lineHeight: 1.1,
            marginTop: 4,
          }}
        >
          £25.8k / m²
        </div>
        <div style={{ fontSize: 28, color: MUTE, marginTop: 2 }}>
          UK footbridges 2019–25: £18–32k
        </div>
      </div>
    </Sheet>
  );
};

const mx = (m: number) => 560 + m * 45;
const rowY = (r: number) => 330 + r * 46;

const GBar = ({ r, m0, m1, crit }: { r: number; m0: number; m1: number; crit?: boolean }) => (
  <rect
    x={mx(m0)}
    y={rowY(r) - 10}
    width={mx(m1) - mx(m0)}
    height={20}
    fill={crit ? CY : 'none'}
    fillOpacity={crit ? 0.75 : 1}
    stroke={crit ? CY : INK}
    strokeWidth={1.4}
  />
);

const GMile = ({
  r,
  m,
  label,
  crit,
  lm,
  end,
}: {
  r: number;
  m: number;
  label: string;
  crit?: boolean;
  lm?: number;
  end?: boolean;
}) => (
  <g>
    <polygon
      points={`${mx(m)},${rowY(r) - 13} ${mx(m) + 13},${rowY(r)} ${mx(m)},${rowY(r) + 13} ${mx(m) - 13},${rowY(r)}`}
      fill={crit ? AMBER : BG}
      stroke={crit ? AMBER : INK}
      strokeWidth={1.6}
    />
    <text
      x={end ? mx(m) - 22 : mx(lm ?? m) + 22}
      y={rowY(r) + 6}
      textAnchor={end ? 'end' : 'start'}
      style={{ ...tx(18, crit ? AMBER : INK), ...HALO }}
    >
      {label}
    </text>
  </g>
);

const GRow = ({ r, text }: { r: number; text: string }) => (
  <div
    style={abs(120, rowY(r) - 20, {
      fontSize: 28,
      lineHeight: '40px',
      width: 420,
      whiteSpace: 'nowrap',
    })}
  >
    {text}
  </div>
);

const MonthTick = ({ m, t }: { m: number; t: string }) => (
  <text x={mx(m) + 22.5} y={316 - 14} textAnchor="middle" style={tx(18, MUTE)}>
    {t}
  </text>
);

const ProgrammePage: Page = () => {
  const uid = uidOf(useId());
  return (
    <Sheet title="Programme" label="Programme · Oct 2026 – Dec 2028" heading="Programme">
      <Svg>
        <defs>
          <pattern
            id={uid}
            width={10}
            height={10}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={10} stroke={CY} strokeOpacity={0.3} strokeWidth={2} />
          </pattern>
        </defs>
        <g style={d(0.1)}>
          <rect x={mx(8)} y={310} width={45 * 4} height={520} fill={`url(#${uid})`} stroke="none" />
          <rect
            x={mx(20)}
            y={310}
            width={45 * 4}
            height={520}
            fill={`url(#${uid})`}
            stroke="none"
          />
          <text x={mx(10)} y={822} textAnchor="middle" style={{ ...tx(18, CY), ...HALO }}>
            RIVER WINDOW
          </text>
          <text x={mx(22)} y={822} textAnchor="middle" style={{ ...tx(18, CY), ...HALO }}>
            RIVER WINDOW
          </text>
          <line x1={mx(0)} y1={252} x2={mx(27)} y2={252} stroke={INK} strokeWidth={1.4} />
          <line x1={mx(0)} y1={310} x2={mx(27)} y2={310} stroke={INK} strokeWidth={1.4} />
          <line x1={mx(0)} y1={252} x2={mx(0)} y2={830} stroke={FAINT} strokeWidth={1} />
          <line x1={mx(3)} y1={252} x2={mx(3)} y2={830} stroke={FAINT} strokeWidth={1} />
          <line x1={mx(15)} y1={252} x2={mx(15)} y2={830} stroke={FAINT} strokeWidth={1} />
          <line x1={mx(27)} y1={252} x2={mx(27)} y2={830} stroke={FAINT} strokeWidth={1} />
          <text x={mx(1.5)} y={276} textAnchor="middle" style={tx(18, INK)}>
            2026
          </text>
          <text x={mx(9)} y={276} textAnchor="middle" style={tx(18, INK)}>
            2027
          </text>
          <text x={mx(21)} y={276} textAnchor="middle" style={tx(18, INK)}>
            2028
          </text>
          <MonthTick m={0} t="O" />
          <MonthTick m={1} t="N" />
          <MonthTick m={2} t="D" />
          <MonthTick m={3} t="J" />
          <MonthTick m={4} t="F" />
          <MonthTick m={5} t="M" />
          <MonthTick m={6} t="A" />
          <MonthTick m={7} t="M" />
          <MonthTick m={8} t="J" />
          <MonthTick m={9} t="J" />
          <MonthTick m={10} t="A" />
          <MonthTick m={11} t="S" />
          <MonthTick m={12} t="O" />
          <MonthTick m={13} t="N" />
          <MonthTick m={14} t="D" />
          <MonthTick m={15} t="J" />
          <MonthTick m={16} t="F" />
          <MonthTick m={17} t="M" />
          <MonthTick m={18} t="A" />
          <MonthTick m={19} t="M" />
          <MonthTick m={20} t="J" />
          <MonthTick m={21} t="J" />
          <MonthTick m={22} t="A" />
          <MonthTick m={23} t="S" />
          <MonthTick m={24} t="O" />
          <MonthTick m={25} t="N" />
          <MonthTick m={26} t="D" />
        </g>
        <g style={d(0.5)}>
          <GBar r={0} m0={0} m1={6.5} crit />
          <GBar r={1} m0={0} m1={7} />
          <GMile r={2} m={3.9} label="29 JAN 2027" crit />
          <GBar r={3} m0={7} m1={10} crit />
          <GBar r={4} m0={11} m1={18} />
          <GBar r={5} m0={10} m1={15} crit />
          <GMile r={6} m={18.5} label="15–17 APR · 54 h" crit />
          <GBar r={7} m0={18.6} m1={20} crit />
          <GBar r={8} m0={20} m1={24} crit />
          <GBar r={9} m0={24} m1={26.4} crit />
          <GMile r={10} m={26.6} label="DEC 2028" crit end />
          <GMile r={0} m={4.3} label="90% REVIEW · 9 FEB" lm={6.5} />
        </g>
        <g style={d(1.1)}>
          <line
            x1={mx(0.4)}
            y1={240}
            x2={mx(0.4)}
            y2={830}
            stroke={AMBER}
            strokeWidth={1.6}
            strokeDasharray="6 5"
          />
          <text x={mx(0.4) + 10} y={238} style={tx(24, AMBER, HAND)}>
            today
          </text>
        </g>
        <g style={d(1.3)}>
          <rect
            x={120}
            y={880}
            width={46}
            height={18}
            fill={CY}
            fillOpacity={0.75}
            stroke={CY}
            strokeWidth={1.4}
          />
          <text x={180} y={896} style={tx(18, MUTE)}>
            CRITICAL PATH
          </text>
          <rect x={400} y={880} width={46} height={18} fill="none" stroke={INK} strokeWidth={1.4} />
          <text x={460} y={896} style={tx(18, MUTE)}>
            FLOAT
          </text>
          <polygon
            points="620,876 633,889 620,902 607,889"
            fill={AMBER}
            stroke={AMBER}
            strokeWidth={1.4}
          />
          <text x={646} y={896} style={tx(18, MUTE)}>
            KEY DATE
          </text>
        </g>
      </Svg>
      <div className="ab-in" style={d(0.3)}>
        <GRow r={0} text="Detailed design" />
        <GRow r={1} text="Consents + rail approvals" />
        <GRow r={2} text="Possession request lodged" />
        <GRow r={3} text="Tender + award" />
        <GRow r={4} text="Steel fabrication" />
        <GRow r={5} text="Substructure" />
        <GRow r={6} text="Back span lift" />
        <GRow r={7} text="Upper pylon + backstays" />
        <GRow r={8} text="Main span + stays" />
        <GRow r={9} text="Finishes, TMDs, load test" />
        <GRow r={10} text="Open to the public" />
      </div>
    </Sheet>
  );
};

const RiskDot = ({
  l,
  i,
  n,
  dx = 0,
  dy = 0,
}: {
  l: number;
  i: number;
  n: string;
  dx?: number;
  dy?: number;
}) => {
  const x = 220 + (l - 0.5) * 84 + dx;
  const y = 710 - (i - 0.5) * 84 + dy;
  return (
    <g>
      <circle cx={x} cy={y} r={22} fill={BG} stroke={INK} strokeWidth={1.8} />
      <text x={x} y={y + 6.5} textAnchor="middle" style={tx(18, INK)}>
        {n}
      </text>
    </g>
  );
};

const RiskRow = ({
  top,
  n,
  title,
  mit,
  rating,
}: {
  top: number;
  n: string;
  title: string;
  mit: string;
  rating: 'HIGH' | 'MED' | 'LOW';
}) => (
  <div style={abs(760, top, { width: 1040, display: 'flex', gap: 22, alignItems: 'flex-start' })}>
    <span
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `1.8px solid ${INK}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontSize: 18,
        flex: 'none',
      }}
    >
      {n}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 31, fontWeight: 600, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 28, color: MUTE, lineHeight: 1.35, marginTop: 2 }}>{mit}</div>
    </div>
    <span
      style={{
        ...SMALL,
        color: rating === 'HIGH' ? AMBER : rating === 'MED' ? CY : MUTE,
        border: `1.2px solid ${rating === 'HIGH' ? AMBER : rating === 'MED' ? CY : FAINT}`,
        padding: '4px 10px',
        marginTop: 6,
        flex: 'none',
        width: 60,
        textAlign: 'center',
      }}
    >
      {rating}
    </span>
  </div>
);

const RisksPage: Page = () => {
  const uid = uidOf(useId());
  return (
    <Sheet title="Risk register" label="Risk register · top five, residual" heading="Risks">
      <Svg>
        <defs>
          <pattern
            id={uid}
            width={9}
            height={9}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={9}
              stroke={AMBER}
              strokeOpacity={0.8}
              strokeWidth={2.2}
            />
          </pattern>
        </defs>
        <g style={d(0.1)}>
          <polygon
            points="304,290 640,290 640,626 472,626 472,542 388,542 388,458 304,458"
            fill={CY}
            fillOpacity={0.18}
            stroke="none"
          />
          <polygon
            points="388,290 640,290 640,542 556,542 556,458 472,458 472,374 388,374"
            fill={`url(#${uid})`}
            stroke="none"
          />
          <path
            d="M220,290 V710 M304,290 V710 M388,290 V710 M472,290 V710 M556,290 V710 M640,290 V710 M220,290 H640 M220,374 H640 M220,458 H640 M220,542 H640 M220,626 H640 M220,710 H640"
            fill="none"
            stroke={INK}
            strokeOpacity={0.55}
            strokeWidth={1.2}
          />
          <text x={262} y={738} textAnchor="middle" style={tx(18, MUTE)}>
            1
          </text>
          <text x={346} y={738} textAnchor="middle" style={tx(18, MUTE)}>
            2
          </text>
          <text x={430} y={738} textAnchor="middle" style={tx(18, MUTE)}>
            3
          </text>
          <text x={514} y={738} textAnchor="middle" style={tx(18, MUTE)}>
            4
          </text>
          <text x={598} y={738} textAnchor="middle" style={tx(18, MUTE)}>
            5
          </text>
          <text x={204} y={338} textAnchor="end" style={tx(18, MUTE)}>
            5
          </text>
          <text x={204} y={422} textAnchor="end" style={tx(18, MUTE)}>
            4
          </text>
          <text x={204} y={506} textAnchor="end" style={tx(18, MUTE)}>
            3
          </text>
          <text x={204} y={590} textAnchor="end" style={tx(18, MUTE)}>
            2
          </text>
          <text x={204} y={674} textAnchor="end" style={tx(18, MUTE)}>
            1
          </text>
          <text x={430} y={772} textAnchor="middle" style={tx(18, INK)}>
            LIKELIHOOD →
          </text>
          <text transform="translate(162,500) rotate(-90)" textAnchor="middle" style={tx(18, INK)}>
            IMPACT →
          </text>
        </g>
        <g style={d(0.7)}>
          <RiskDot l={3} i={5} n="R1" />
          <RiskDot l={3} i={3} n="R2" />
          <RiskDot l={2} i={4} n="R3" />
          <RiskDot l={4} i={2} n="R4" />
          <RiskDot l={2} i={2} n="R5" />
          <line x1={452} y1={262} x2={438} y2={300} stroke={AMBER} strokeWidth={1.4} />
          <Head x={436} y={306} ang={1.9} c={AMBER} />
          <text x={420} y={256} style={tx(26, AMBER, HAND)}>
            R1 sets the programme
          </text>
        </g>
      </Svg>
      <div className="ab-in" style={d(0.4)}>
        <RiskRow
          top={290}
          n="R1"
          title="Easter 2028 rail possession not granted"
          mit="Request lodged Jan 2027; Christmas 2028 fallback agreed"
          rating="HIGH"
        />
        <RiskRow
          top={398}
          n="R2"
          title="Rockhead deeper than BH-04 at the pylon"
          mit="Two extra boreholes in Nov 2026; +4 m pile allowance"
          rating="MED"
        />
        <RiskRow
          top={506}
          n="R3"
          title="Summer flood closes the river window"
          mit="Trestles sized for a 1-in-10 summer flow; 3 weeks float"
          rating="MED"
        />
        <RiskRow
          top={614}
          n="R4"
          title="Steel price rises more than 8%"
          mit="Early mill order at 90% design; indexed tender clause"
          rating="MED"
        />
        <RiskRow
          top={722}
          n="R5"
          title="Lateral lock-in under dense crowds"
          mit="Lateral TMD fitted; crowd test before opening"
          rating="LOW"
        />
      </div>
    </Sheet>
  );
};

const Decision = ({
  top,
  n,
  title,
  detail,
  verb,
  note,
}: {
  top: number;
  n: string;
  title: string;
  detail: string;
  verb: string;
  note?: string;
}) => (
  <div
    style={abs(120, top, {
      width: 1680,
      height: 120,
      display: 'flex',
      gap: 34,
      alignItems: 'flex-start',
    })}
  >
    {note && (
      <span style={abs(1090, 24, { fontFamily: HAND, fontSize: 28, color: AMBER })}>{note}</span>
    )}
    <svg
      width={64}
      height={58}
      viewBox="0 0 64 58"
      className="ab-ink"
      style={{ flex: 'none', marginTop: 4 }}
    >
      <polygon points="32,3 61,55 3,55" fill="none" stroke={CY} strokeWidth={2} />
      <text x={32} y={46} textAnchor="middle" style={tx(18, CY)}>
        {n}
      </text>
    </svg>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 600,
          fontSize: 38,
          lineHeight: 1.15,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 28, color: MUTE, lineHeight: 1.35, marginTop: 6 }}>{detail}</div>
    </div>
    <div
      style={{
        width: 150,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        flex: 'none',
      }}
    >
      <span style={{ ...SMALL, color: CY }}>{verb}</span>
      <span
        style={{ width: 52, height: 52, border: `2px solid ${INK}`, boxSizing: 'border-box' }}
      />
    </div>
  </div>
);

const DecisionsPage: Page = () => (
  <Sheet title="Decisions requested" label="For the panel · today" heading="Decisions requested">
    <Steps>
      <Step>
        <Decision
          top={272}
          n="D1"
          title="Endorse the cable-stayed A-frame as the basis for 90% design"
          detail="Option C: no river pier, one rail possession, 750 mm deck."
          verb="Approve"
        />
      </Step>
      <Step>
        <Decision
          top={412}
          n="D2"
          title="Confirm 4.0 m clear width and the 1:25 profile"
          detail="Fixes the deck section and both landing levels."
          verb="Approve"
        />
      </Step>
      <Step>
        <Decision
          top={552}
          n="D3"
          title="Authorise the Easter 2028 possession request"
          detail="Must be lodged with the rail operator by 29 January 2027."
          note="← the one with a deadline"
          verb="Approve"
        />
      </Step>
      <Step>
        <Decision
          top={692}
          n="D4"
          title="Note the £8.90 M P50 estimate within the £9.40 M envelope"
          detail="Includes the £180k provisional sum for tuned mass dampers."
          verb="Note"
        />
      </Step>
    </Steps>
  </Sheet>
);

const NextStep = ({ top, date, text }: { top: number; date: string; text: string }) => (
  <div style={abs(120, top, { display: 'flex', gap: 30, alignItems: 'baseline', width: 1000 })}>
    <span style={{ fontFamily: MONO, fontSize: 24, color: CY, width: 190, flex: 'none' }}>
      {date}
    </span>
    <span style={{ fontSize: 32 }}>{text}</span>
  </div>
);

const ClosePage: Page = () => {
  const uid = uidOf(useId());
  const cx = 1500;
  const cy = 470;
  return (
    <Sheet title="Questions + next steps" label="End of sheet set · Rev C">
      <div className="ab-in" style={{ ...abs(120, 220), ...d(0.1) }}>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            fontWeight: 600,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          Questions
        </div>
        <div style={{ fontFamily: HAND, fontSize: 40, color: AMBER, marginTop: 14 }}>
          …and mark-ups welcome on any sheet
        </div>
      </div>
      <div className="ab-in" style={d(0.5)}>
        <div style={abs(120, 560, SMALL)}>Next</div>
        <NextStep top={600} date="28 OCT 2026" text="Panel comments back to Kestrel & Vane" />
        <NextStep top={664} date="29 JAN 2027" text="Easter 2028 possession request lodged" />
        <NextStep top={728} date="09 FEB 2027" text="90% design review with this panel" />
      </div>
      <Svg>
        <defs>
          <path
            id={`${uid}c`}
            d={`M${cx - 196},${cy} a196,196 0 1,1 392,0 a196,196 0 1,1 -392,0`}
          />
        </defs>
        <g style={d(0.3)} transform={`rotate(-9 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={236} fill="none" stroke={AMBER} strokeWidth={3} />
          <circle cx={cx} cy={cy} r={160} fill="none" stroke={AMBER} strokeWidth={1.6} />
          <text style={tx(26, AMBER, MONO, { letterSpacing: '0.3em' })}>
            <textPath href={`#${uid}c`}>
              KESTREL & VANE ENGINEERS · ARDEN STREET FOOTBRIDGE ·
            </textPath>
          </text>
          <text x={cx} y={cy - 42} textAnchor="middle" style={tx(22, AMBER)}>
            ISSUED FOR
          </text>
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            style={tx(64, AMBER, 'var(--osd-font-display)', { fontWeight: 600 })}
          >
            60%
          </text>
          <text x={cx} y={cy + 60} textAnchor="middle" style={tx(22, AMBER)}>
            REVIEW · REV C
          </text>
          <text x={cx} y={cy + 100} textAnchor="middle" style={tx(18, AMBER)}>
            14.10.2026
          </text>
        </g>
      </Svg>
      <div className="ab-in" style={{ ...abs(120, 880, { width: 1000 }), ...d(0.8) }}>
        <div style={SMALL}>Contact</div>
        <div style={{ fontSize: 30, marginTop: 6 }}>Ruth Okafor · r.okafor@kestrelvane.co.uk</div>
      </div>
    </Sheet>
  );
};

export const notes: (string | undefined)[] = [
  `Good morning, panel. I'm Ruth Okafor, project engineer; Magnus Lindqvist leads the design.
This is the 60% review of the Arden Street Footbridge — revision C of the drawing set.
Everything you'll see is laid out as drawing sheets, so you can refer to any sheet number when you comment.
Point at the pylon: the headline is one pylon, on the flood embankment, and nothing standing in the river.`,
  `Start with why this bridge exists.
Today, someone walking from Kell Meadows to Arden Street goes 1.1 kilometres round by the Carrow Road bridge.
The bridge cuts that to 64 metres. We forecast about 2,400 trips a day by 2030, roughly sixty-forty walking to cycling.
For a walker that's thirteen minutes saved each way.
Show the three fixed points: A1 on the greenway, P1 on the embankment between the river and the railway, A2 on Arden Street.`,
  `This long section is drawn with vertical exaggeration, so the levels are easy to read.
Four things fix the profile. Flood: 600 mm freeboard over the 1% plus climate change level. We have 1,160 at the west bank.
Rail: 5.80 metres above the rail for the overhead line. We have 6.07. That margin is the tightest, and it sets the whole profile.
Gradient: 1:25, so we don't need landings.
Pylon: 5.48 metres from the nearest rail, which keeps it out of the derailment zone without extra protection.
Mention the revision cloud: since 30% we raised the deck 250 mm to protect the OLE clearance.`,
  `We looked at three structural forms.
Click: the truss is cheapest, but it needs a pier in the channel, which the Environment Agency has already told us it will object to.
Click: the tied arch clears the river entirely, but lifting 64 metres in one go needs a 1,200-tonne crane and a 72-hour possession.
Click: cable-stayed. £8.9 million, no river pier, one 54-hour possession, and the shallowest deck.
Click: that's why it's our preferred option.`,
  `This is the general arrangement.
Two spans: 46 metres over the river, 18 over the railway. The pylon stands 30 metres above the deck.
Six main stays carry the river span; three heavier backstays tie the pylon back to the east abutment.
Note the 6,066 dimension in amber. That's the rail clearance at the tightest point.
Section A–A, cut through the main span, is the next sheet.`,
  `Section A–A.
Two steel edge boxes, 600 by 750, with an orthotropic deck plate between them. That's what gets us a 750 mm deck.
The stays pin onto brackets outside the boxes, so they don't take any of the walking width.
Clear width is 4 metres between handrails. In practice that's two cyclists passing a pushchair.
The parapet is 1.4 metres with stainless mesh, rising to 1.8-metre solid screens over the railway, which the rail operator requires.`,
  `The pylon is an A-frame, seen here along the bridge.
The legs are steel boxes, 1,200 by 900, in S460, 40 mm plate. Section B–B shows the stiffeners.
All 18 stays anchor in the head, in Detail 1, at 1.2-metre spacing.
Foundations are eight 900 mm CFA piles to the mudstone.
96 tonnes of steel, erected in two lifts.`,
  `Design basis: Eurocodes with the UK National Annex.
Six load cases. The two to point out: crowd loading at 5 kN per square metre, and losing any single stay with a dynamic factor of 2.
On the right are the governing checks. Nothing is above 0.78 at this stage, so there's headroom for design development.
Deflection under crowd load is L over 622, against a limit of L over 400.`,
  `Six materials, each with its drawing hatch, so you'll recognise them on every sheet.
412 tonnes of steel, 18 locked-coil stays, 640 cubic metres of concrete.
The paint system is rated for 25 years to first major maintenance.
Embodied carbon is 1,140 tonnes, 31% below our 2019 baseline, mainly because there's no river pier.`,
  `This is the sheet the panel asked about at 30%.
The first vertical mode is 2.31 hertz, just outside the worst range for footfall. The first lateral mode, 1.12, sits right at the edge of the lock-in range.
Without damping, a dense crowd gives 0.71 metres per second squared vertically, above the 0.5 comfort limit.
With three tuned mass dampers we get 0.32 vertical and 0.06 lateral.
We've carried £180k as a provisional sum, which we'll confirm by testing after erection.`,
  `Four stages.
Click: substructure, from August to December 2027.
Click: the back span goes over the railway in one lift, during the Easter 2028 possession: 54 hours.
Click: the upper pylon in May, with the backstays holding the back span.
Click: the main span in the June-to-September river window, on two temporary trestles that come out once the stays are stressed.`,
  `The 60% estimate is £8.90 million at P50, inside the £9.40 million envelope, with P90 at £9.62 million.
The bar is a dimension chain. Each segment is one cost element, and the hatched one is quantified risk.
The biggest items are deck steelwork and substructure.
Headroom to the envelope is about half a million.`,
  `Twenty-seven months from today to opening.
The critical path runs through the possession. The request has to be lodged by 29 January 2027.
The hatched bands are the river windows. The main span has to land in the 2028 one.
If everything holds, we open to the public in December 2028.`,
  `Five residual risks.
R1 is the one that matters: if the Easter possession isn't granted, the next suitable block is Christmas 2028, which costs about eight months.
That's why the request goes in early and the fallback is agreed now.
The other four are medium or low, and each has a named mitigation.`,
  `Four decisions today.
Click: D1, endorse the cable-stayed A-frame.
Click: D2, confirm the 4-metre width and the 1:25 profile.
Click: D3, the one with a deadline: authorise the possession request.
Click: D4, note the estimate and the damper provision.`,
  `Thank you. We'll take questions now.
We'd like written comments by 28 October so they feed into 90% design.
We'll be back with you on 9 February.`,
];

export const meta: SlideMeta = {
  title: 'Arden Street Footbridge — 60% Design Review',
  createdAt: '2026-10-12T12:21:16.830Z',
};

export default [
  CoverPage,
  SitePage,
  ConstraintsPage,
  ConceptPage,
  ElevationPage,
  SectionPage,
  PylonPage,
  LoadsPage,
  MaterialsPage,
  VibrationPage,
  ConstructionPage,
  CostPage,
  ProgrammePage,
  RisksPage,
  DecisionsPage,
  ClosePage,
] satisfies Page[];

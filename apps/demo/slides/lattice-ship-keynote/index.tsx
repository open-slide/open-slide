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
import { type CSSProperties, type ReactNode, useId } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#000000', text: '#EDEDED', accent: '#52A8FF' },
  fonts: {
    display: '"Geist", system-ui, -apple-system, sans-serif',
    body: '"Geist", system-ui, -apple-system, sans-serif',
  },
  typeScale: { hero: 200, body: 28 },
  radius: 12,
};

const SEC = '#A1A1A1';
const TER = '#8F8F8F';
const DIM = '#707070';
const FAINT = '#454545';
const SURF = '#0A0A0A';
const SURF2 = '#111111';
const LINE = '#1F1F1F';
const EDGE = '#2E2E2E';
const CROSS = '#5C5C5C';
const BLUE = '#0A72EF';
const GREEN = '#45A557';
const GREEN_TEXT = '#62C073';
const PINK = '#F75F8F';
const MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const SLIDE_ID = 'lattice-ship-keynote';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes lt-flow { to { stroke-dashoffset: -24 } }
@keyframes lt-blink { 0%, 50% { opacity: 1 } 50.01%, 100% { opacity: 0 } }
@keyframes lt-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
@keyframes lt-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes lt-ping { 0% { transform: scale(1); opacity: 0.6 } 70%, 100% { transform: scale(2.8); opacity: 0 } }
@keyframes lt-breathe { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
@keyframes lt-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes lt-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
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
const MORPH_MS = 860;

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
      { opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

const morphTransition: SlideTransition = {
  duration: 300,
  exit: { duration: 300, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 300, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const FL = 96;
const FR = 1824;
const FT = 96;
const FB = 984;
const col = (n: number) => FL + n * 144;
const BAND = 336;
const TALL_BAND = 392;

const HEAD: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 600,
  letterSpacing: '-0.045em',
  lineHeight: 1.04,
  margin: 0,
};

const LABEL: CSSProperties = {
  fontFamily: MONO,
  fontSize: 18,
  fontWeight: 400,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1,
  color: TER,
};

const BODY: CSSProperties = {
  fontSize: 'var(--osd-size-body)',
  lineHeight: 1.45,
  letterSpacing: '-0.012em',
  color: SEC,
  margin: 0,
};

const NUM: CSSProperties = { fontVariantNumeric: 'tabular-nums' };

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const useEnter = (delay: number, dur = 0.5, name = 'lt-in'): CSSProperties | undefined => {
  const live = useIsActivePage();
  return live ? { animation: `${name} ${dur}s ${EASE_OUT} ${delay}s both` } : undefined;
};

const useLoop = (value: string): string | undefined => {
  const live = useIsActivePage();
  return live ? value : undefined;
};

const HLine = ({
  y,
  x1 = 0,
  x2 = 1920,
  dashed = false,
}: {
  y: number;
  x1?: number;
  x2?: number;
  dashed?: boolean;
}) => (
  <div
    style={abs(x1, y, {
      width: x2 - x1,
      height: 1,
      background: dashed
        ? `repeating-linear-gradient(90deg, ${EDGE} 0 4px, transparent 4px 10px)`
        : LINE,
    })}
  />
);

const VLine = ({
  x,
  y1 = 0,
  y2 = 1080,
  dashed = false,
}: {
  x: number;
  y1?: number;
  y2?: number;
  dashed?: boolean;
}) => (
  <div
    style={abs(x, y1, {
      width: 1,
      height: y2 - y1,
      background: dashed
        ? `repeating-linear-gradient(180deg, ${EDGE} 0 4px, transparent 4px 10px)`
        : LINE,
    })}
  />
);

const Cross = ({ x, y }: { x: number; y: number }) => (
  <svg width={21} height={21} style={abs(x - 10, y - 10, { overflow: 'visible' })}>
    <path d="M10.5 0V21M0 10.5H21" stroke={CROSS} strokeWidth={1} />
  </svg>
);

const Mark = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
    <circle cx={4} cy={4} r={1.5} fill={DIM} />
    <circle cx={12} cy={4} r={1.5} fill={DIM} />
    <circle cx={4} cy={12} r={1.5} fill={DIM} />
    <circle cx={20} cy={12} r={1.5} fill={DIM} />
    <circle cx={12} cy={20} r={1.5} fill={DIM} />
    <circle cx={20} cy={20} r={1.5} fill={DIM} />
    <path d="M4 20L20 4" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
    <circle cx={4} cy={20} r={3} fill="currentColor" />
    <circle cx={12} cy={12} r={3} fill="currentColor" />
    <circle cx={20} cy={4} r={3} fill="currentColor" />
  </svg>
);

const Header = ({ section }: { section: string }) => (
  <>
    <div
      style={abs(144, 0, {
        height: 96,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        color: 'var(--osd-text)',
      })}
    >
      <Mark size={26} />
      <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.035em' }}>Lattice</span>
      <svg width={14} height={28} viewBox="0 0 14 28" style={{ margin: '0 2px' }}>
        <path d="M11 3L3 25" stroke={FAINT} strokeWidth={1.2} />
      </svg>
      <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', color: SEC }}>
        Ship ’26
      </span>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 144,
        top: 0,
        height: 96,
        display: 'flex',
        alignItems: 'center',
        ...LABEL,
        lineHeight: '96px',
      }}
    >
      {section}
    </div>
  </>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <div
        style={abs(144, FB, {
          height: 96,
          display: 'flex',
          alignItems: 'center',
          ...LABEL,
          lineHeight: '96px',
          textTransform: 'none',
          letterSpacing: '0',
          color: DIM,
        })}
      >
        lattice.dev/ship
      </div>
      <div
        style={{
          position: 'absolute',
          right: 144,
          top: FB,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          ...LABEL,
          ...NUM,
          lineHeight: '96px',
          color: 'var(--osd-text)',
        }}
      >
        {String(current).padStart(2, '0')}
        <span style={{ color: DIM, whiteSpace: 'pre' }}> / {String(total).padStart(2, '0')}</span>
      </div>
    </>
  );
};

const Frame = () => (
  <>
    <HLine y={FT} />
    <HLine y={FB} />
    <VLine x={FL} />
    <VLine x={FR} />
    <Cross x={FL} y={FT} />
    <Cross x={FR} y={FT} />
    <Cross x={FL} y={FB} />
    <Cross x={FR} y={FB} />
  </>
);

const Stage = ({ section, children }: { section: string; children: ReactNode }) => (
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
      WebkitFontSmoothing: 'antialiased',
    }}
  >
    <Frame />
    {children}
    <Header section={section} />
    <Footer />
  </div>
);

const Eyebrow = ({
  x,
  y,
  children,
  color = TER,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
}) => <div style={abs(x, y, { ...LABEL, color })}>{children}</div>;

const TitleBand = ({
  eyebrow,
  title,
  body,
  bodyWidth = 528,
  line = BAND,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  bodyWidth?: number;
  line?: number;
}) => (
  <>
    <Eyebrow x={144} y={144}>
      {eyebrow}
    </Eyebrow>
    <h2 style={abs(144, 184, { ...HEAD, fontSize: 72, width: 1040 })}>{title}</h2>
    {body && (
      <div
        style={abs(1776 - bodyWidth, 144, {
          width: bodyWidth,
          height: line - 220,
          display: 'flex',
          alignItems: 'flex-end',
        })}
      >
        <p style={BODY}>{body}</p>
      </div>
    )}
    <HLine y={line} />
    <Cross x={FL} y={line} />
    <Cross x={FR} y={line} />
  </>
);

const Dot = ({
  color,
  size = 8,
  glow = false,
}: {
  color: string;
  size?: number;
  glow?: boolean;
}) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: 999,
      background: color,
      boxShadow: glow ? `0 0 0 3px color-mix(in srgb, ${color} 22%, transparent)` : undefined,
      flexShrink: 0,
    }}
  />
);

const Pill = ({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'live' | 'accent';
}) => {
  const border =
    tone === 'live' ? 'rgba(69,165,87,0.45)' : tone === 'accent' ? 'rgba(82,168,255,0.4)' : EDGE;
  const bg =
    tone === 'live' ? 'rgba(69,165,87,0.10)' : tone === 'accent' ? 'rgba(10,114,239,0.14)' : SURF;
  const color = tone === 'live' ? GREEN_TEXT : tone === 'accent' ? 'var(--osd-accent)' : SEC;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        height: 36,
        padding: '0 16px',
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        fontFamily: MONO,
        fontSize: 16,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};

const Kbd = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 38,
      height: 38,
      padding: '0 10px',
      boxSizing: 'border-box',
      borderRadius: 8,
      border: `1px solid ${EDGE}`,
      boxShadow: `inset 0 -2px 0 ${LINE}`,
      background: SURF2,
      fontFamily: 'var(--osd-font-body)',
      fontSize: 20,
      fontWeight: 500,
      color: 'var(--osd-text)',
    }}
  >
    {children}
  </span>
);

type IconKind = 'user' | 'edge' | 'fn' | 'db' | 'route';

const Icon = ({ kind, size = 18 }: { kind: IconKind; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.3}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {kind === 'user' && (
      <>
        <circle cx={8} cy={5.5} r={2.8} />
        <path d="M2.6 14.2c0-2.9 2.4-4.7 5.4-4.7s5.4 1.8 5.4 4.7" />
      </>
    )}
    {kind === 'edge' && (
      <>
        <circle cx={8} cy={8} r={6.2} />
        <ellipse cx={8} cy={8} rx={2.6} ry={6.2} />
        <path d="M1.8 8h12.4" />
      </>
    )}
    {kind === 'fn' && <path d="M5.5 4L1.8 8l3.7 4M10.5 4l3.7 4-3.7 4" />}
    {kind === 'db' && (
      <>
        <ellipse cx={8} cy={3.6} rx={5.4} ry={2} />
        <path d="M2.6 3.6v8.8c0 1.1 2.4 2 5.4 2s5.4-.9 5.4-2V3.6" />
        <path d="M2.6 8c0 1.1 2.4 2 5.4 2s5.4-.9 5.4-2" />
      </>
    )}
    {kind === 'route' && (
      <>
        <circle cx={3} cy={8} r={1.6} />
        <path d="M4.6 8h3.2l4-4.2M7.8 8l4 4.2" />
        <circle cx={13} cy={3.4} r={1.4} />
        <circle cx={13} cy={12.6} r={1.4} />
      </>
    )}
  </svg>
);

const Beam = ({ cx = 960 }: { cx?: number }) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 820px 560px at ${cx}px ${FT}px, rgba(255,255,255,0.085), rgba(255,255,255,0.025) 48%, transparent 72%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `conic-gradient(from 180deg at ${cx}px ${FT}px, rgba(255,255,255,0.10) 0deg, rgba(255,255,255,0.035) 13deg, transparent 24deg, transparent 336deg, rgba(255,255,255,0.035) 347deg, rgba(255,255,255,0.10) 360deg)`,
        WebkitMaskImage: 'linear-gradient(180deg, #000 12%, rgba(0,0,0,0.5) 46%, transparent 74%)',
        maskImage: 'linear-gradient(180deg, #000 12%, rgba(0,0,0,0.5) 46%, transparent 74%)',
      }}
    />
    <div
      style={abs(cx - 420, FT, {
        width: 840,
        height: 1,
        background:
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.35) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.35) 70%, transparent)',
      })}
    />
    <div
      style={abs(cx - 90, FT - 14, {
        width: 180,
        height: 28,
        background: 'radial-gradient(closest-side, rgba(255,255,255,0.55), transparent)',
        filter: 'blur(6px)',
      })}
    />
  </>
);

const MetaCell = ({ x, label, value }: { x: number; label: string; value: string }) => (
  <div
    style={abs(x, 744, {
      width: 576,
      height: 240,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 18,
    })}
  >
    <span style={{ ...LABEL, color: DIM }}>{label}</span>
    <span style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.025em' }}>{value}</span>
  </div>
);

const GRADIENT_TEXT: CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, #FFFFFF 30%, #9A9A9A 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  padding: '0 0.1em 0.1em',
};

const Cover: Page = () => (
  <Stage section="Opening keynote">
    <Beam />
    <HLine y={336} />
    <HLine y={744} />
    <VLine x={col(2)} y1={336} y2={744} />
    <VLine x={col(10)} y1={336} y2={744} />
    <VLine x={col(4)} y1={744} y2={FB} />
    <VLine x={col(8)} y1={744} y2={FB} />
    <Cross x={FL} y={336} />
    <Cross x={col(2)} y={336} />
    <Cross x={col(10)} y={336} />
    <Cross x={FR} y={336} />
    <Cross x={FL} y={744} />
    <Cross x={col(2)} y={744} />
    <Cross x={col(4)} y={744} />
    <Cross x={col(8)} y={744} />
    <Cross x={col(10)} y={744} />
    <Cross x={FR} y={744} />
    <Cross x={col(4)} y={FB} />
    <Cross x={col(8)} y={FB} />
    <div
      style={abs(col(2), 336, {
        width: col(10) - col(2),
        height: 408,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <h1
        style={{
          ...HEAD,
          ...GRADIENT_TEXT,
          fontSize: 'var(--osd-size-hero)',
          letterSpacing: '-0.06em',
          lineHeight: 1,
        }}
      >
        Ship ’26
      </h1>
      <p style={{ ...BODY, fontSize: 30, marginTop: 20 }}>The opening keynote</p>
    </div>
    <MetaCell x={FL} label="City" value="San Francisco" />
    <MetaCell x={col(4)} label="Venue" value="Pier 48" />
    <MetaCell x={col(8)} label="Date" value="Oct 21, 2026 · 9:30 PT" />
  </Stage>
);

const Spark = ({ data, step = false }: { data: number[]; step?: boolean }) => {
  const gid = `lt-spark-${useId().replace(/:/g, '')}`;
  const W = 336;
  const H = 136;
  const P = 10;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const xs = (i: number) => (i / (data.length - 1)) * W;
  const ys = (v: number) => P + (1 - (v - min) / (max - min)) * (H - 2 * P);
  let d = `M0,${ys(data[0]).toFixed(1)}`;
  for (let i = 1; i < data.length; i++) {
    d += step
      ? ` H${xs(i).toFixed(1)} V${ys(data[i]).toFixed(1)}`
      : ` L${xs(i).toFixed(1)},${ys(data[i]).toFixed(1)}`;
  }
  const lastY = ys(data[data.length - 1]);
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EDEDED" stopOpacity={0.12} />
          <stop offset="1" stopColor="#EDEDED" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} V${H} H0 Z`} fill={`url(#${gid})`} />
      <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} stroke={EDGE} />
      <path d={d} fill="none" stroke={SEC} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={W} cy={lastY} r={9} fill="none" stroke="#EDEDED" strokeOpacity={0.22} />
      <circle cx={W} cy={lastY} r={3.6} fill="#EDEDED" />
    </svg>
  );
};

const Metric = ({
  x,
  label,
  value,
  unit,
  delta,
  data,
  step,
}: {
  x: number;
  label: string;
  value: string;
  unit?: string;
  delta: string;
  data: number[];
  step?: boolean;
}) => (
  <div style={abs(x, 336, { width: 432, height: 648 })}>
    <div style={abs(48, 48, { ...LABEL })}>{label}</div>
    <div
      style={abs(44, 104, {
        ...HEAD,
        ...NUM,
        fontSize: 120,
        lineHeight: 1,
        letterSpacing: '-0.055em',
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
      })}
    >
      {value}
      {unit && (
        <span style={{ fontSize: 40, color: TER, letterSpacing: '-0.02em', fontWeight: 500 }}>
          {unit}
        </span>
      )}
    </div>
    <div style={abs(48, 256, { ...LABEL, textTransform: 'none', color: SEC, fontSize: 20 })}>
      {delta}
    </div>
    <div style={abs(48, 404)}>
      <Spark data={data} step={step} />
    </div>
    <div
      style={abs(48, 572, {
        width: 336,
        display: 'flex',
        justifyContent: 'space-between',
        ...LABEL,
        fontSize: 15,
        color: DIM,
      })}
    >
      <span>Oct ’25</span>
      <span>Sep ’26</span>
    </div>
  </div>
);

const Year: Page = () => (
  <Stage section="The year">
    <TitleBand
      eyebrow="Oct 2025 – Sep 2026"
      title="A year on Lattice."
      body="Twelve months, measured across every team on the platform."
    />
    <VLine x={col(3)} y1={336} y2={FB} />
    <VLine x={col(6)} y1={336} y2={FB} />
    <VLine x={col(9)} y1={336} y2={FB} />
    <Cross x={col(3)} y={336} />
    <Cross x={col(6)} y={336} />
    <Cross x={col(9)} y={336} />
    <Cross x={col(3)} y={FB} />
    <Cross x={col(6)} y={FB} />
    <Cross x={col(9)} y={FB} />
    <Metric
      x={col(0)}
      label="Deployments / week"
      value="4.8M"
      delta="↑ 62% year over year"
      data={[2.96, 3.05, 3.18, 3.3, 3.42, 3.61, 3.78, 3.95, 4.12, 4.36, 4.58, 4.8]}
    />
    <Metric
      x={col(3)}
      label="Requests served"
      value="1.2T"
      delta="↑ 2× year over year"
      data={[68, 72, 79, 84, 88, 95, 101, 108, 112, 121, 128, 136]}
    />
    <Metric
      x={col(6)}
      label="Compute regions"
      value="18"
      delta="+6 opened this year"
      data={[12, 12, 13, 13, 14, 14, 15, 16, 16, 17, 18, 18]}
      step
    />
    <Metric
      x={col(9)}
      label="Cold start · p50"
      value="210"
      unit="ms"
      delta="↓ 34% from 318 ms"
      data={[318, 309, 301, 288, 270, 262, 251, 240, 233, 224, 216, 210]}
    />
  </Stage>
);

const NODE_Y = 536;
const NODE_W = 192;
const NODE_H = 112;
const NODE_MID = NODE_Y + NODE_H / 2;

const RouteNode = ({
  id,
  x,
  kind,
  label,
  value,
  lit = false,
}: {
  id: string;
  x: number;
  kind: IconKind;
  label: string;
  value: string;
  lit?: boolean;
}) => (
  <MorphElement id={id}>
    <div
      style={abs(x, NODE_Y, {
        width: NODE_W,
        height: NODE_H,
        boxSizing: 'border-box',
        padding: '20px 22px',
        borderRadius: 12,
        background: lit ? '#06101D' : SURF,
        border: `1px solid ${lit ? 'rgba(82,168,255,0.55)' : EDGE}`,
        boxShadow: lit ? '0 0 0 4px rgba(10,114,239,0.12), 0 0 48px rgba(10,114,239,0.18)' : 'none',
      })}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          ...LABEL,
          fontSize: 15,
          color: lit ? 'var(--osd-accent)' : DIM,
        }}
      >
        <Icon kind={kind} size={16} />
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.025em', marginTop: 18 }}>
        {value}
      </div>
    </div>
  </MorphElement>
);

const Link = ({
  x1,
  x2,
  y = NODE_MID,
  live,
}: {
  x1: number;
  x2: number;
  y?: number;
  live: boolean;
}) => (
  <svg width={x2 - x1} height={12} style={abs(x1, y - 6, { overflow: 'visible' })}>
    <line x1={0} x2={x2 - x1 - 7} y1={6} y2={6} stroke={EDGE} strokeWidth={1.5} />
    <line
      x1={0}
      x2={x2 - x1 - 7}
      y1={6}
      y2={6}
      stroke={SEC}
      strokeWidth={1.5}
      strokeDasharray="4 8"
      style={{ animation: live ? 'lt-flow 1.2s linear infinite' : undefined }}
    />
    <path
      d={`M${x2 - x1 - 8},1.5 L${x2 - x1 - 1},6 L${x2 - x1 - 8},10.5`}
      fill="none"
      stroke={SEC}
      strokeWidth={1.5}
    />
  </svg>
);

const HopLabel = ({
  cx,
  y,
  top,
  value,
}: {
  cx: number;
  y: number;
  top?: string;
  value: string;
}) => (
  <div
    style={abs(cx - 160, y, {
      width: 320,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center',
    })}
  >
    {top && <span style={{ ...LABEL, fontSize: 15, color: DIM }}>{top}</span>}
    <span style={{ fontFamily: MONO, fontSize: 20, color: 'var(--osd-text)', ...NUM }}>
      {value}
    </span>
  </div>
);

const PX = 1.65;
const BAR_X = 144;
const BAR_Y = 852;
const BAR_H = 28;

const NETWORK: CSSProperties = { background: '#EDEDED' };
const COLD: CSSProperties = {
  background: `repeating-linear-gradient(-45deg, ${TER} 0 2px, transparent 2px 6px)`,
  boxShadow: `inset 0 0 0 1px ${TER}`,
};
const COMPUTE: CSSProperties = { background: FAINT };

const Seg = ({
  id,
  from,
  ms,
  look,
}: {
  id: string;
  from: number;
  ms: number;
  look: CSSProperties;
}) => (
  <MorphElement id={id}>
    <div
      style={abs(BAR_X + from * PX, BAR_Y, {
        width: Math.max(3, ms * PX - 2),
        height: BAR_H,
        borderRadius: 3,
        ...look,
      })}
    />
  </MorphElement>
);

const LegendItem = ({ look, label }: { look: CSSProperties; label: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <span style={{ width: 14, height: 14, borderRadius: 3, ...look }} />
    {label}
  </span>
);

const Tick = ({ ms }: { ms: number }) => (
  <div style={abs(BAR_X + ms * PX, BAR_Y + BAR_H + 12, { width: 1, height: 6, background: FAINT })}>
    <span
      style={abs(ms === 0 ? 0 : -40, 14, {
        width: ms === 0 ? 80 : 80,
        textAlign: ms === 0 ? 'left' : 'center',
        fontFamily: MONO,
        fontSize: 15,
        color: DIM,
        ...NUM,
      })}
    >
      {ms}
    </span>
  </div>
);

const RouteScene = ({ fabric }: { fabric: boolean }) => {
  const live = useIsActivePage();
  const after =
    fabric && live ? { animation: `lt-fade 0.5s ease-out ${MORPH_MS / 1000}s both` } : undefined;
  const fnX = fabric ? 1152 : 656;
  return (
    <>
      <VLine x={col(7)} y1={TALL_BAND} y2={744} />
      <HLine y={744} />
      <Cross x={col(7)} y={TALL_BAND} />
      <Cross x={col(7)} y={744} />
      <Cross x={FL} y={744} />
      <Cross x={FR} y={744} />
      <Eyebrow x={144} y={432}>
        Singapore · sin1
      </Eyebrow>
      <Eyebrow x={col(7) + 48} y={432}>
        Washington, D.C. · iad1
      </Eyebrow>

      <RouteNode id="rt-user" x={144} kind="user" label="User" value="Singapore" />
      <RouteNode id="rt-edge" x={400} kind="edge" label="Edge" value="sin1" />
      <RouteNode id="rt-fn" x={fnX} kind="fn" label="Function" value="/checkout" lit={fabric} />
      <RouteNode id="rt-db" x={1584} kind="db" label="Database" value="Postgres" />

      <Link x1={336} x2={400} live={live} />
      <HopLabel cx={368} y={476} value="4 ms" />

      {!fabric && (
        <>
          <Link x1={592} x2={656} live={live} />
          <svg width={1920} height={1080} style={abs(0, 0, { pointerEvents: 'none' })}>
            <path
              d={`M848,${NODE_MID} Q1216,${NODE_MID - 72} 1584,${NODE_MID}`}
              fill="none"
              stroke={EDGE}
              strokeWidth={1.5}
            />
            <path
              d={`M848,${NODE_MID} Q1216,${NODE_MID - 136} 1584,${NODE_MID}`}
              fill="none"
              stroke={EDGE}
              strokeWidth={1.5}
            />
            <path
              d={`M848,${NODE_MID} Q1216,${NODE_MID - 200} 1584,${NODE_MID}`}
              fill="none"
              stroke={EDGE}
              strokeWidth={1.5}
            />
            <path
              d={`M848,${NODE_MID} Q1216,${NODE_MID - 72} 1584,${NODE_MID}`}
              fill="none"
              stroke={SEC}
              strokeWidth={1.5}
              strokeDasharray="4 8"
              style={{ animation: live ? 'lt-flow 1.4s linear infinite' : undefined }}
            />
            <path
              d={`M848,${NODE_MID} Q1216,${NODE_MID - 136} 1584,${NODE_MID}`}
              fill="none"
              stroke={SEC}
              strokeWidth={1.5}
              strokeDasharray="4 8"
              style={{ animation: live ? 'lt-flow 1.4s linear infinite 0.2s' : undefined }}
            />
            <path
              d={`M848,${NODE_MID} Q1216,${NODE_MID - 200} 1584,${NODE_MID}`}
              fill="none"
              stroke={SEC}
              strokeWidth={1.5}
              strokeDasharray="4 8"
              style={{ animation: live ? 'lt-flow 1.4s linear infinite 0.4s' : undefined }}
            />
          </svg>
          <HopLabel cx={976} y={NODE_MID + 20} top="3 queries" value="3 × 212 ms" />
          <div style={abs(656, NODE_Y + NODE_H + 20, { ...LABEL, fontSize: 15, color: TER })}>
            Cold start · <span style={{ color: 'var(--osd-text)' }}>210 ms</span>
          </div>
        </>
      )}

      {fabric && (
        <div style={after}>
          <Link x1={592} x2={1152} live={live} />
          <HopLabel cx={848} y={476} top="1 round trip" value="212 ms" />
          <Link x1={1344} x2={1584} live={live} />
          <HopLabel cx={1464} y={476} top="3 queries" value="3 × 1.3 ms" />
          <div style={abs(1152, NODE_Y + NODE_H + 20, { ...LABEL, fontSize: 15, color: TER })}>
            Snapshot · <span style={{ color: 'var(--osd-accent)' }}>18 ms</span>
          </div>
        </div>
      )}

      <Eyebrow x={144} y={792}>
        Time to first byte · /checkout
      </Eyebrow>
      <div
        style={{
          position: 'absolute',
          right: 144,
          top: 792,
          display: 'flex',
          gap: 32,
          ...LABEL,
          fontSize: 15,
          color: SEC,
        }}
      >
        <LegendItem look={NETWORK} label="Network" />
        <LegendItem look={COLD} label="Cold start" />
        <LegendItem look={COMPUTE} label="Compute" />
      </div>

      {fabric ? (
        <>
          <Seg id="wf-edge" from={0} ms={4} look={NETWORK} />
          <Seg id="wf-route" from={4} ms={212} look={NETWORK} />
          <Seg id="wf-cold" from={216} ms={18} look={COLD} />
          <Seg id="wf-q1" from={234} ms={1.3} look={NETWORK} />
          <Seg id="wf-q2" from={235.3} ms={1.3} look={NETWORK} />
          <Seg id="wf-q3" from={236.6} ms={1.3} look={NETWORK} />
          <Seg id="wf-render" from={238} ms={12} look={COMPUTE} />
        </>
      ) : (
        <>
          <Seg id="wf-edge" from={0} ms={4} look={NETWORK} />
          <Seg id="wf-cold" from={4} ms={210} look={COLD} />
          <Seg id="wf-q1" from={214} ms={212} look={NETWORK} />
          <Seg id="wf-q2" from={426} ms={212} look={NETWORK} />
          <Seg id="wf-q3" from={638} ms={212} look={NETWORK} />
          <Seg id="wf-render" from={850} ms={12} look={COMPUTE} />
        </>
      )}
      <Tick ms={0} />
      <Tick ms={200} />
      <Tick ms={400} />
      <Tick ms={600} />
      <Tick ms={800} />
      <div
        style={{
          position: 'absolute',
          right: 144,
          top: BAR_Y - 14,
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          ...HEAD,
          ...NUM,
          fontSize: 56,
          letterSpacing: '-0.05em',
          color: fabric ? 'var(--osd-accent)' : 'var(--osd-text)',
        }}
      >
        {fabric ? '250' : '862'}
        <span style={{ fontSize: 24, color: TER, letterSpacing: '-0.01em', fontWeight: 500 }}>
          ms
        </span>
      </div>
    </>
  );
};

const Problem: Page = () => (
  <Stage section="The problem">
    <TitleBand
      eyebrow="Anatomy of a request"
      title={
        <>
          Your users are everywhere.
          <br />
          <span style={{ color: TER }}>Your data isn’t.</span>
        </>
      }
      body="A page that runs three queries crosses the Pacific six times before it sends a byte."
      bodyWidth={480}
      line={TALL_BAND}
    />
    <RouteScene fabric={false} />
  </Stage>
);

const WithFabric: Page = () => (
  <Stage section="The fix">
    <TitleBand
      eyebrow="With Lattice Fabric"
      title={
        <>
          Same page.
          <br />
          <span style={{ color: TER }}>Two crossings, not six.</span>
        </>
      }
      body="Fabric runs /checkout beside Postgres. The three queries now take 4 ms."
      bodyWidth={480}
      line={TALL_BAND}
    />
    <RouteScene fabric />
  </Stage>
);

const ISO_CX = (col(7) + FR) / 2;
const ISO_TOP = 262;
const ISO_GAP = 296;
const ISO_N = 5;
const isoX = (i: number, j: number) => ISO_CX + (i - j) * 46;
const isoY = (i: number, j: number, layer: number) => ISO_TOP + (i + j) * 26.56 + layer * ISO_GAP;

const planePath = (layer: number) => {
  let d = '';
  for (let k = 0; k <= ISO_N; k++) {
    d += `M${isoX(k, 0)},${isoY(k, 0, layer)} L${isoX(k, ISO_N)},${isoY(k, ISO_N, layer)} `;
    d += `M${isoX(0, k)},${isoY(0, k, layer)} L${isoX(ISO_N, k)},${isoY(ISO_N, k, layer)} `;
  }
  return d;
};

const planeFill = (layer: number) =>
  `M${isoX(0, 0)},${isoY(0, 0, layer)} L${isoX(ISO_N, 0)},${isoY(ISO_N, 0, layer)} L${isoX(ISO_N, ISO_N)},${isoY(ISO_N, ISO_N, layer)} L${isoX(0, ISO_N)},${isoY(0, ISO_N, layer)} Z`;

const nodesPath = (layer: number, r: number) => {
  let d = '';
  for (let i = 0; i <= ISO_N; i++) {
    for (let j = 0; j <= ISO_N; j++) {
      const x = isoX(i, j);
      const y = isoY(i, j, layer);
      d += `M${x - r},${y} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 `;
    }
  }
  return d;
};

const pillarsPath = (pairs: [number, number][]) => {
  let d = '';
  for (const [i, j] of pairs) {
    d += `M${isoX(i, j)},${isoY(i, j, 0)} L${isoX(i, j)},${isoY(i, j, 1)} `;
  }
  return d;
};

const HALO: CSSProperties = { paintOrder: 'stroke', stroke: '#000', strokeWidth: 8 };

const LIT_I = 3;
const LIT_J = 1;

const PairNode = ({ i, j }: { i: number; j: number }) => (
  <g>
    <circle
      cx={isoX(i, j)}
      cy={isoY(i, j, 0)}
      r={4.5}
      fill="#000"
      stroke={SEC}
      strokeWidth={1.25}
    />
    <circle
      cx={isoX(i, j)}
      cy={isoY(i, j, 1)}
      r={4.5}
      fill="#000"
      stroke={DIM}
      strokeWidth={1.25}
    />
  </g>
);

const Weave = () => {
  const breathe = useLoop('lt-breathe 3.2s ease-in-out infinite');
  const ping = useLoop('lt-ping 2.4s ease-out infinite');
  const flow = useLoop('lt-flow 1.4s linear infinite');
  const tx = isoX(LIT_I, LIT_J);
  const ty = isoY(LIT_I, LIT_J, 0);
  const by = isoY(LIT_I, LIT_J, 1);
  const lx = isoX(0, ISO_N) - 22;
  return (
    <svg width={1920} height={1080} style={abs(0, 0, { pointerEvents: 'none' })}>
      <defs>
        <radialGradient id="lt-weave-halo">
          <stop offset="0" stopColor="#52A8FF" stopOpacity={0.5} />
          <stop offset="0.45" stopColor={BLUE} stopOpacity={0.12} />
          <stop offset="1" stopColor={BLUE} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="lt-weave-floor">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.06} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="lt-weave-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#52A8FF" />
        </linearGradient>
      </defs>
      <ellipse cx={ISO_CX} cy={isoY(2.5, 2.5, 0.5)} rx={440} ry={340} fill="url(#lt-weave-floor)" />
      <path d={planeFill(1)} fill="#050505" />
      <path d={planePath(1)} stroke="#1F1F1F" strokeWidth={1} fill="none" />
      <path d={nodesPath(1, 1.8)} fill="#333" />
      <path
        d={pillarsPath([
          [0, 0],
          [ISO_N, 0],
          [0, ISO_N],
          [ISO_N, ISO_N],
        ])}
        stroke="#2A2A2A"
        strokeWidth={1}
        strokeDasharray="3 5"
      />
      <path
        d={pillarsPath([
          [1, 3],
          [4, 4],
        ])}
        stroke={FAINT}
        strokeWidth={1}
        strokeDasharray="3 5"
      />
      <path d={planeFill(0)} fill="#0A0A0A" fillOpacity={0.7} />
      <path d={planePath(0)} stroke="#2E2E2E" strokeWidth={1} fill="none" />
      <path d={nodesPath(0, 2.2)} fill="#525252" />
      <PairNode i={1} j={3} />
      <PairNode i={4} j={4} />
      <circle cx={tx} cy={ty} r={130} fill="url(#lt-weave-halo)" style={{ animation: breathe }} />
      <line x1={tx} x2={tx} y1={ty} y2={by} stroke="url(#lt-weave-beam)" strokeWidth={2} />
      <line
        x1={tx}
        x2={tx}
        y1={ty}
        y2={by}
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeDasharray="4 8"
        strokeOpacity={0.9}
        style={{ animation: flow }}
      />
      <circle cx={tx} cy={by} r={44} fill="url(#lt-weave-halo)" />
      <circle cx={tx} cy={by} r={9} fill="#000" stroke="#52A8FF" strokeWidth={1.5} />
      <circle cx={tx} cy={by} r={3.5} fill="#52A8FF" />
      <circle
        cx={tx}
        cy={ty}
        r={10}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.6}
        style={{ animation: ping, transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <circle cx={tx} cy={ty} r={7} fill="#FFFFFF" />
      <text x={tx + 22} y={ty - 14} fill="#EDEDED" fontFamily={MONO} fontSize={18} style={HALO}>
        /checkout
      </text>
      <text x={tx + 22} y={by + 32} fill={SEC} fontFamily={MONO} fontSize={18} style={HALO}>
        postgres · iad1
      </text>
      <text
        x={lx}
        y={isoY(0, ISO_N, 0) + 6}
        textAnchor="end"
        fill={DIM}
        fontFamily={MONO}
        fontSize={15}
        letterSpacing="0.6"
      >
        COMPUTE
      </text>
      <text
        x={lx}
        y={isoY(0, ISO_N, 1) + 6}
        textAnchor="end"
        fill={DIM}
        fontFamily={MONO}
        fontSize={15}
        letterSpacing="0.6"
      >
        DATA
      </text>
    </svg>
  );
};

const Fact = ({ x, label, value }: { x: number; label: string; value: string }) => (
  <div
    style={abs(x, 840, { width: 336, height: 144, boxSizing: 'border-box', padding: '40px 48px' })}
  >
    <div style={{ ...LABEL, fontSize: 15, color: DIM }}>{label}</div>
    <div
      style={{
        fontSize: 34,
        fontWeight: 500,
        letterSpacing: '-0.03em',
        marginTop: 16,
        ...NUM,
      }}
    >
      {value}
    </div>
  </div>
);

const Announce: Page = () => {
  const rise = useEnter(0.15, 0.7);
  return (
    <Stage section="Introducing">
      <VLine x={col(7)} y1={FT} y2={FB} />
      <HLine y={840} x1={FL} x2={col(7)} />
      <VLine x={FL + 336} y1={840} y2={FB} />
      <VLine x={FL + 672} y1={840} y2={FB} />
      <Cross x={col(7)} y={FT} />
      <Cross x={col(7)} y={FB} />
      <Cross x={FL} y={840} />
      <Cross x={col(7)} y={840} />
      <Cross x={FL + 336} y={840} />
      <Cross x={FL + 672} y={840} />
      <Cross x={FL + 336} y={FB} />
      <Cross x={FL + 672} y={FB} />
      <Weave />
      <div style={abs(144, 236, { width: 912, ...rise })}>
        <Pill tone="accent">
          <Dot color="#52A8FF" size={7} />
          Public beta · today
        </Pill>
        <h1
          style={{ ...HEAD, fontSize: 112, marginTop: 44, letterSpacing: '-0.05em', lineHeight: 1 }}
        >
          <span style={{ color: DIM }}>Introducing</span>
          <br />
          <span style={{ ...GRADIENT_TEXT, padding: '0 0.1em 0.1em 0' }}>Lattice Fabric.</span>
        </h1>
        <p style={{ ...BODY, fontSize: 32, marginTop: 40, maxWidth: 760 }}>
          A compute layer that runs every function next to the data it reads.{' '}
          <span style={{ color: 'var(--osd-text)' }}>Automatically.</span>
        </p>
      </div>
      <Fact x={FL} label="Cold start · p50" value="18 ms" />
      <Fact x={FL + 336} label="Time to first byte" value="3.4× faster" />
      <Fact x={FL + 672} label="Config" value="1 line" />
    </Stage>
  );
};

const Flow = ({
  d,
  live,
  accent = false,
  delay = 0,
}: {
  d: string;
  live: boolean;
  accent?: boolean;
  delay?: number;
}) => (
  <g>
    <path d={d} fill="none" stroke={EDGE} strokeWidth={1.25} />
    <path
      d={d}
      fill="none"
      stroke={accent ? '#52A8FF' : SEC}
      strokeWidth={1.5}
      strokeDasharray="4 8"
      style={{ animation: live ? `lt-flow 1.2s linear ${delay}s infinite` : undefined }}
    />
  </g>
);

const CityPill = ({ y, city }: { y: number; city: string }) => (
  <div
    style={abs(144, y, {
      width: 192,
      height: 56,
      boxSizing: 'border-box',
      borderRadius: 999,
      border: `1px solid ${EDGE}`,
      background: SURF,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      fontSize: 22,
      color: 'var(--osd-text)',
      letterSpacing: '-0.015em',
    })}
  >
    <span style={{ color: DIM }}>
      <Icon kind="user" size={16} />
    </span>
    {city}
  </div>
);

const RegionBox = ({
  y,
  code,
  city,
  fns,
}: {
  y: number;
  code: string;
  city: string;
  fns: string;
}) => (
  <div
    style={abs(1104, y, {
      width: 288,
      height: 72,
      boxSizing: 'border-box',
      borderRadius: 10,
      border: `1px solid ${EDGE}`,
      background: SURF,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 14,
    })}
  >
    <span style={{ fontFamily: MONO, fontSize: 22, color: 'var(--osd-text)' }}>{code}</span>
    <span style={{ fontSize: 18, color: TER, flex: 1 }}>{city}</span>
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: MONO,
        fontSize: 15,
        color: SEC,
      }}
    >
      <Dot color={GREEN} size={7} />
      {fns}
    </span>
  </div>
);

const DataBox = ({ y, name, code }: { y: number; name: string; code: string }) => (
  <div
    style={abs(1488, y, {
      width: 288,
      height: 72,
      boxSizing: 'border-box',
      borderRadius: 10,
      border: `1px dashed ${EDGE}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 14,
    })}
  >
    <span style={{ color: TER }}>
      <Icon kind="db" size={18} />
    </span>
    <span style={{ fontSize: 22, color: 'var(--osd-text)', flex: 1, letterSpacing: '-0.015em' }}>
      {name}
    </span>
    <span style={{ fontFamily: MONO, fontSize: 16, color: DIM }}>{code}</span>
  </div>
);

const Explain = ({ x, n, title, body }: { x: number; n: string; title: string; body: string }) => (
  <div
    style={abs(x, 744, { width: 576, height: 240, boxSizing: 'border-box', padding: '44px 48px' })}
  >
    <div style={{ ...LABEL, color: 'var(--osd-accent)' }}>{n}</div>
    <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.035em', marginTop: 18 }}>
      {title}
    </div>
    <p style={{ ...BODY, fontSize: 26, marginTop: 10, lineHeight: 1.4 }}>{body}</p>
  </div>
);

const ColHead = ({ x, children }: { x: number; children: ReactNode }) => (
  <div style={abs(x, 384, { ...LABEL, fontSize: 15, color: DIM })}>{children}</div>
);

const Architecture: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage section="How it works">
      <TitleBand
        eyebrow="Architecture"
        title="How Fabric works."
        body="Three steps between a request and your data, all before your code runs."
      />
      <HLine y={744} />
      <VLine x={col(4)} y1={744} y2={FB} />
      <VLine x={col(8)} y1={744} y2={FB} />
      <Cross x={FL} y={744} />
      <Cross x={FR} y={744} />
      <Cross x={col(4)} y={744} />
      <Cross x={col(8)} y={744} />
      <Cross x={col(4)} y={FB} />
      <Cross x={col(8)} y={FB} />

      <ColHead x={144}>Users</ColHead>
      <ColHead x={432}>Edge network</ColHead>
      <ColHead x={744}>Fabric router</ColHead>
      <ColHead x={1104}>Regional compute</ColHead>
      <ColHead x={1488}>Your data</ColHead>

      <svg width={1920} height={1080} style={abs(0, 0, { pointerEvents: 'none' })}>
        <Flow d="M336,474 C384,474 384,572 432,572" live={live} />
        <Flow d="M336,572 L432,572" live={live} delay={0.3} />
        <Flow d="M336,670 C384,670 384,572 432,572" live={live} delay={0.6} />
        <Flow d="M648,572 L744,572" live={live} />
        <Flow d="M1008,572 C1056,572 1056,476 1104,476" live={live} accent />
        <Flow d="M1008,572 L1104,572" live={live} accent delay={0.3} />
        <Flow d="M1008,572 C1056,572 1056,668 1104,668" live={live} accent delay={0.6} />
        <Flow d="M1392,476 L1488,476" live={live} />
        <Flow d="M1392,572 L1488,572" live={live} />
        <Flow d="M1392,668 L1488,668" live={live} />
      </svg>

      <CityPill y={446} city="Singapore" />
      <CityPill y={544} city="São Paulo" />
      <CityPill y={642} city="Berlin" />

      <div
        style={abs(432, 440, {
          width: 216,
          height: 264,
          boxSizing: 'border-box',
          borderRadius: 12,
          border: `1px solid ${EDGE}`,
          background: SURF,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        <span style={{ color: TER }}>
          <Icon kind="edge" size={22} />
        </span>
        <span
          style={{ ...HEAD, ...NUM, fontSize: 64, marginTop: 'auto', letterSpacing: '-0.05em' }}
        >
          126
        </span>
        <span style={{ fontSize: 20, color: SEC, marginTop: 4 }}>locations</span>
        <span style={{ ...LABEL, fontSize: 13, color: DIM, marginTop: 20 }}>TLS · cache · WAF</span>
      </div>

      <div
        style={abs(744, 440, {
          width: 264,
          height: 264,
          boxSizing: 'border-box',
          borderRadius: 12,
          border: '1px solid rgba(82,168,255,0.5)',
          background: '#050B14',
          boxShadow: '0 0 0 4px rgba(10,114,239,0.10), 0 0 60px rgba(10,114,239,0.16)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        <span style={{ color: 'var(--osd-accent)' }}>
          <Icon kind="route" size={22} />
        </span>
        <div
          style={{
            marginTop: 'auto',
            fontFamily: MONO,
            fontSize: 16,
            lineHeight: '30px',
            color: SEC,
          }}
        >
          <div>
            /api/cart <span style={{ color: DIM }}>→</span>{' '}
            <span style={{ color: 'var(--osd-text)' }}>iad1</span>
          </div>
          <div>
            /api/recs <span style={{ color: DIM }}>→</span>{' '}
            <span style={{ color: 'var(--osd-text)' }}>fra1</span>
          </div>
          <div>
            /api/stock <span style={{ color: DIM }}>→</span>{' '}
            <span style={{ color: 'var(--osd-text)' }}>hnd1</span>
          </div>
        </div>
        <span style={{ ...LABEL, fontSize: 13, color: 'var(--osd-accent)', marginTop: 20 }}>
          Placement table
        </span>
      </div>

      <RegionBox y={440} code="iad1" city="Washington" fns="warm" />
      <RegionBox y={536} code="fra1" city="Frankfurt" fns="warm" />
      <RegionBox y={632} code="hnd1" city="Tokyo" fns="warm" />

      <DataBox y={440} name="Postgres" code="iad1" />
      <DataBox y={536} name="Redis" code="fra1" />
      <DataBox y={632} name="Blob store" code="hnd1" />

      <Steps>
        <Step duration={260}>
          <Explain
            x={FL}
            n="01 · Route"
            title="Terminate at the edge."
            body="The nearest of 126 locations handles TLS and hands off to the router."
          />
        </Step>
        <Step duration={260}>
          <Explain
            x={col(4)}
            n="02 · Place"
            title="Run next to the data."
            body="Each route runs in the region that holds the data it reads."
          />
        </Step>
        <Step duration={260}>
          <Explain
            x={col(8)}
            n="03 · Warm"
            title="Start from a snapshot."
            body="A ready snapshot waits in that region and boots in 18 ms."
          />
        </Step>
      </Steps>
    </Stage>
  );
};

const TLine = ({
  at,
  children,
  t,
  indent = false,
}: {
  at: number;
  children: ReactNode;
  t?: string;
  indent?: boolean;
}) => {
  const enter = useEnter(at, 0.24);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        height: 31,
        paddingLeft: indent ? 24 : 0,
        whiteSpace: 'pre',
        ...enter,
      }}
    >
      <span>{children}</span>
      {t && <span style={{ color: DIM, ...NUM }}>{t}</span>}
    </div>
  );
};

const Cursor = () => {
  const blink = useLoop('lt-blink 1.1s steps(1) infinite');
  return (
    <span
      style={{
        display: 'inline-block',
        width: 11,
        height: 22,
        background: '#EDEDED',
        verticalAlign: '-4px',
        animation: blink,
      }}
    />
  );
};

const Window = ({
  x,
  y,
  w,
  h,
  title,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: ReactNode;
  children: ReactNode;
}) => (
  <div
    style={abs(x, y, {
      width: w,
      height: h,
      boxSizing: 'border-box',
      borderRadius: 12,
      border: `1px solid ${EDGE}`,
      background: SURF,
      boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
      overflow: 'hidden',
    })}
  >
    <div
      style={{
        height: 48,
        borderBottom: `1px solid ${LINE}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        position: 'relative',
      }}
    >
      <span style={{ display: 'flex', gap: 8 }}>
        <Dot color={EDGE} size={12} />
        <Dot color={EDGE} size={12} />
        <Dot color={EDGE} size={12} />
      </span>
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: MONO,
          fontSize: 15,
          color: DIM,
        }}
      >
        {title}
      </span>
    </div>
    {children}
  </div>
);

const Field = ({
  x,
  y,
  label,
  children,
}: {
  x: number;
  y: number;
  label: string;
  children: ReactNode;
}) => (
  <div style={abs(x, y)}>
    <div style={{ ...LABEL, fontSize: 14, color: DIM }}>{label}</div>
    <div
      style={{
        fontSize: 22,
        marginTop: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        letterSpacing: '-0.015em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  </div>
);

const Block = ({
  x,
  y,
  w,
  h,
  c = '#1A1A1A',
  r = 3,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  c?: string;
  r?: number;
}) => <div style={abs(x, y, { width: w, height: h, background: c, borderRadius: r })} />;

const Thumb = () => (
  <div
    style={abs(20, 20, {
      width: 582,
      height: 228,
      borderRadius: 8,
      border: `1px solid ${LINE}`,
      background: 'linear-gradient(180deg, #0E0E0E, #080808)',
      overflow: 'hidden',
    })}
  >
    <Block x={24} y={20} w={72} h={10} c="#3A3A3A" />
    <Block x={392} y={22} w={36} h={6} c="#262626" />
    <Block x={440} y={22} w={36} h={6} c="#262626" />
    <Block x={488} y={22} w={36} h={6} c="#262626" />
    <div style={abs(0, 48, { width: 582, height: 1, background: LINE })} />
    <Block x={24} y={78} w={230} h={16} c="#3A3A3A" />
    <Block x={24} y={102} w={180} h={16} c="#3A3A3A" />
    <Block x={24} y={132} w={210} h={6} c="#222" />
    <Block x={24} y={146} w={160} h={6} c="#222" />
    <Block x={24} y={168} w={84} h={24} c="#D6D6D6" r={5} />
    <Block x={116} y={168} w={84} h={24} c="transparent" r={5} />
    <div
      style={abs(304, 70, {
        width: 254,
        height: 130,
        borderRadius: 6,
        background:
          'radial-gradient(120px 90px at 70% 30%, rgba(255,255,255,0.10), transparent), linear-gradient(135deg, #1C1C1C, #121212)',
        border: `1px solid ${LINE}`,
      })}
    />
    <Block x={24} y={210} w={124} h={30} c="#151515" />
    <Block x={156} y={210} w={124} h={30} c="#151515" />
    <Block x={304} y={210} w={124} h={30} c="#151515" />
    <Block x={436} y={210} w={124} h={30} c="#151515" />
  </div>
);

const BranchIcon = () => (
  <svg
    width={18}
    height={18}
    viewBox="0 0 16 16"
    fill="none"
    stroke={TER}
    strokeWidth={1.3}
    strokeLinecap="round"
  >
    <circle cx={4} cy={3.5} r={1.6} />
    <circle cx={4} cy={12.5} r={1.6} />
    <circle cx={12} cy={5} r={1.6} />
    <path d="M4 5.1v5.8M12 6.6c0 3-3.2 3.4-6.6 4.6" />
  </svg>
);

const DeployCard = () => (
  <div
    style={abs(col(7) + 48, 384, {
      width: 624,
      height: 552,
      boxSizing: 'border-box',
      borderRadius: 12,
      border: `1px solid ${EDGE}`,
      background: SURF,
    })}
  >
    <Thumb />
    <Field x={24} y={276} label="Status">
      <Dot color={GREEN} size={10} glow />
      Ready
    </Field>
    <Field x={324} y={276} label="Duration">
      <span style={NUM}>23s</span>
      <span style={{ color: DIM, fontSize: 18 }}>· just now</span>
    </Field>
    <Field x={24} y={354} label="Domains">
      halyard.com
      <span
        style={{
          fontFamily: MONO,
          fontSize: 14,
          color: SEC,
          border: `1px solid ${EDGE}`,
          borderRadius: 999,
          padding: '2px 8px',
        }}
      >
        +2
      </span>
    </Field>
    <Field x={324} y={354} label="Environment">
      Production
    </Field>
    <Field x={24} y={432} label="Source">
      <BranchIcon />
      <span>main</span>
      <span style={{ fontFamily: MONO, fontSize: 18, color: SEC, marginLeft: 10 }}>a41f9c2</span>
      <span style={{ color: SEC }}>Enable Fabric</span>
    </Field>
    <div
      style={abs(0, 500, {
        width: 622,
        height: 50,
        borderTop: `1px solid ${LINE}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        boxSizing: 'border-box',
        gap: 12,
        fontFamily: MONO,
        fontSize: 15,
        color: SEC,
      })}
    >
      <span
        style={{ color: 'var(--osd-accent)', display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <Icon kind="route" size={15} />
        FABRIC
      </span>
      <span>12 functions · 3 regions</span>
    </div>
  </div>
);

const Deploy: Page = () => (
  <Stage section="Deploy">
    <TitleBand
      eyebrow="Developer experience"
      title="Deploy the way you already do."
      body="Fabric runs during the build. Same command, same Git flow."
      bodyWidth={480}
    />
    <VLine x={col(7)} y1={336} y2={FB} />
    <Cross x={col(7)} y={336} />
    <Cross x={col(7)} y={FB} />
    <Window x={144} y={384} w={912} h={552} title="~/halyard/storefront — zsh">
      <div
        style={{
          padding: '22px 28px',
          fontFamily: MONO,
          fontSize: 19,
          color: SEC,
          ...NUM,
        }}
      >
        <TLine at={0.1}>
          <span style={{ color: 'var(--osd-accent)' }}>❯ </span>
          <span style={{ color: 'var(--osd-text)' }}>lattice deploy --prod</span>
        </TLine>
        <TLine at={0.35} t="1.1s">
          <span style={{ color: DIM }}>› </span>Uploaded 1,284 files{' '}
          <span style={{ color: DIM }}>(6.2 MB)</span>
        </TLine>
        <TLine at={0.55}>
          <span style={{ color: DIM }}>› </span>Building{' '}
          <span style={{ color: DIM }}>next build</span>
        </TLine>
        <TLine at={0.8} t="14.8s" indent>
          <span style={{ color: GREEN_TEXT }}>✓</span> Compiled successfully
        </TLine>
        <TLine at={0.95} indent>
          <span style={{ color: GREEN_TEXT }}>✓</span> 46 routes · 12 functions
        </TLine>
        <TLine at={1.15} t="0.9s">
          <span style={{ color: DIM }}>› </span>
          <span style={{ color: 'var(--osd-accent)' }}>Fabric</span> placing functions
        </TLine>
        <TLine at={1.3} indent>
          /api/cart{'      '}
          <span style={{ color: DIM }}>→</span>{' '}
          <span style={{ color: 'var(--osd-text)' }}>iad1</span>
          <span style={{ color: DIM }}>{'  '}next to postgres-main</span>
        </TLine>
        <TLine at={1.4} indent>
          /api/checkout{'  '}
          <span style={{ color: DIM }}>→</span>{' '}
          <span style={{ color: 'var(--osd-text)' }}>iad1</span>
          <span style={{ color: DIM }}>{'  '}next to postgres-main</span>
        </TLine>
        <TLine at={1.5} indent>
          /api/recs{'      '}
          <span style={{ color: DIM }}>→</span>{' '}
          <span style={{ color: 'var(--osd-text)' }}>fra1</span>
          <span style={{ color: DIM }}>{'  '}next to redis-eu</span>
        </TLine>
        <TLine at={1.6} indent>
          /api/stock{'     '}
          <span style={{ color: DIM }}>→</span>{' '}
          <span style={{ color: 'var(--osd-text)' }}>hnd1</span>
          <span style={{ color: DIM }}>{'  '}next to blob-apac</span>
        </TLine>
        <TLine at={1.85} t="2.3s">
          <span style={{ color: DIM }}>› </span>Snapshotting 12 functions
        </TLine>
        <TLine at={2.15} t="23s">
          <span style={{ color: GREEN_TEXT }}>✓ Ready</span>
          <span style={{ color: 'var(--osd-text)' }}>{'  '}https://halyard.com</span>
        </TLine>
        <TLine at={2.3}> </TLine>
        <TLine at={2.4}>
          <span style={{ color: 'var(--osd-accent)' }}>❯ </span>
          <Cursor />
        </TLine>
      </div>
    </Window>
    <DeployCard />
  </Stage>
);

const K = ({ children }: { children: ReactNode }) => (
  <span style={{ color: PINK }}>{children}</span>
);
const S = ({ children }: { children: ReactNode }) => (
  <span style={{ color: 'var(--osd-accent)' }}>{children}</span>
);
const P = ({ children }: { children: ReactNode }) => <span style={{ color: DIM }}>{children}</span>;

const CodeLine = ({
  n,
  children,
  added = false,
}: {
  n: number;
  children?: ReactNode;
  added?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      height: 46,
      alignItems: 'center',
      background: added ? 'rgba(10,114,239,0.12)' : undefined,
      boxShadow: added ? 'inset 2px 0 0 #52A8FF' : undefined,
      whiteSpace: 'pre',
    }}
  >
    <span
      style={{
        width: 72,
        textAlign: 'right',
        color: added ? 'var(--osd-accent)' : FAINT,
        paddingRight: 16,
      }}
    >
      {added ? '+' : n}
    </span>
    <span style={{ paddingLeft: 16, color: 'var(--osd-text)' }}>{children}</span>
  </div>
);

const Callout = ({ y, n, title, body }: { y: number; n: string; title: string; body: string }) => (
  <div
    style={abs(col(7), y, {
      width: 720,
      height: 216,
      boxSizing: 'border-box',
      padding: '44px 48px',
    })}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
      <span style={{ ...LABEL, color: 'var(--osd-accent)' }}>{n}</span>
      <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.035em' }}>{title}</span>
    </div>
    <p style={{ ...BODY, fontSize: 26, marginTop: 16, lineHeight: 1.4, paddingLeft: 42 }}>{body}</p>
  </div>
);

const Config: Page = () => (
  <Stage section="Configuration">
    <TitleBand
      eyebrow="lattice.config.ts"
      title="One line to turn it on."
      body="No region lists. No new SDK. Fabric reads what your code already does."
      bodyWidth={480}
    />
    <VLine x={col(7)} y1={336} y2={FB} />
    <HLine y={552} x1={col(7)} x2={FR} />
    <HLine y={768} x1={col(7)} x2={FR} />
    <Cross x={col(7)} y={336} />
    <Cross x={col(7)} y={552} />
    <Cross x={col(7)} y={768} />
    <Cross x={FR} y={552} />
    <Cross x={FR} y={768} />
    <Cross x={col(7)} y={FB} />
    <div
      style={abs(144, 416, {
        width: 912,
        height: 412,
        boxSizing: 'border-box',
        borderRadius: 12,
        border: `1px solid ${EDGE}`,
        background: SURF,
        overflow: 'hidden',
      })}
    >
      <div
        style={{
          height: 56,
          borderBottom: `1px solid ${LINE}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 12,
          fontFamily: MONO,
          fontSize: 17,
          color: SEC,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#000',
            background: '#52A8FF',
            borderRadius: 3,
            padding: '2px 4px',
            letterSpacing: '0.02em',
          }}
        >
          TS
        </span>
        lattice.config.ts
        <span style={{ marginLeft: 'auto', color: DIM, fontSize: 15 }}>+1 −0</span>
      </div>
      <div style={{ padding: '26px 0', fontFamily: MONO, fontSize: 24 }}>
        <CodeLine n={1}>
          <K>import</K> <P>{'{'}</P> defineConfig <P>{'}'}</P> <K>from</K> <S>'@lattice/config'</S>
          <P>;</P>
        </CodeLine>
        <CodeLine n={2} />
        <CodeLine n={3}>
          <K>export default</K> defineConfig<P>({'{'}</P>
        </CodeLine>
        <CodeLine n={4}>
          {'  '}framework<P>:</P> <S>'nextjs'</S>
          <P>,</P>
        </CodeLine>
        <CodeLine n={5}>
          {'  '}buildCommand<P>:</P> <S>'pnpm build'</S>
          <P>,</P>
        </CodeLine>
        <CodeLine n={6} added>
          {'  '}fabric<P>:</P> <K>true</K>
          <P>,</P>
        </CodeLine>
        <CodeLine n={7}>
          <P>{'});'}</P>
        </CodeLine>
      </div>
    </div>
    <div
      style={abs(144, 868, {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 22,
        color: TER,
        letterSpacing: '-0.01em',
      })}
    >
      <span style={{ marginRight: 8 }}>Or from the dashboard</span>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
      <span style={{ margin: '0 6px', color: DIM }}>→</span>
      <span style={{ color: 'var(--osd-text)' }}>Enable Fabric</span>
    </div>
    <Callout
      y={336}
      n="01"
      title="Reads your bindings"
      body="At build time, Fabric maps each route to the databases it queries."
    />
    <Callout
      y={552}
      n="02"
      title="Places every function"
      body="Each route runs in the region that holds its data. Nothing to tune."
    />
    <Callout
      y={768}
      n="03"
      title="Keeps snapshots warm"
      body="A ready snapshot waits in every placed region. Cold starts take 18 ms."
    />
  </Stage>
);

type LL = [number, number];

const parsePolys = (src: string[]): LL[][] =>
  src.map((poly) =>
    poly.split(' ').map((pt) => {
      const [lon, lat] = pt.split(',');
      return [Number(lon), Number(lat)] as LL;
    }),
  );

const LAND = parsePolys([
  '-168,65.6 -166,68.9 -163,70 -157,71.3 -152,70.8 -145,70.1 -141,69.7 -136,69 -130,70 -124,69.5 -120,69 -115,68 -110,68 -105,68.5 -98,67.8 -95,68 -90,68.5 -85,69.5 -82,67 -86,65.5 -88,64 -90.7,63.3 -93,61.5 -94.2,58.8 -92.5,57 -88,56 -85,55.2 -82.3,52.9 -80,51.3 -79.3,53.5 -79,55 -77.5,58 -78,60.5 -77,62.4 -74,62.3 -72,61.7 -69.5,61 -68,58.5 -65,60.3 -64,59 -61.5,56 -57.5,54 -56,52 -57.5,51.4 -60,50.2 -64,50.2 -66.5,49.6 -68.5,48.5 -70,47.5 -69,48.2 -66,49 -64.5,48.8 -65,47 -64.5,46.2 -61,45.6 -60,45.9 -63.5,44.5 -65.8,43.6 -66,45 -67,44.7 -68.5,44.2 -70,43.7 -70.6,42.6 -70,41.8 -71.5,41.3 -74,40.6 -74.1,39.8 -75,38.8 -76,37.2 -75.6,35.5 -77,34.6 -79,33.3 -81,31.8 -81.4,30.3 -80.6,28.5 -80.1,26.5 -80.4,25.2 -81.1,25.1 -81.8,26.5 -82.7,28 -82.8,29.2 -84,30 -85.4,29.7 -87,30.4 -89,30.3 -89.4,29 -90.5,29.1 -92,29.6 -94,29.6 -95.2,28.8 -97,27.8 -97.4,26 -97.7,24 -97.6,22 -97.2,20.6 -96.2,19.2 -95,18.6 -94.3,18.2 -92.5,18.6 -91,19 -90.3,21 -88,21.5 -87,21.5 -87.4,20 -87.8,18.4 -88.3,17.5 -88.5,16 -87.5,15.8 -85,15.9 -83.4,15.2 -83.5,13 -83.7,11 -82.5,9.7 -81,8.9 -79.5,9.6 -77.8,8.9 -77.4,8.3 -77.9,7.2 -79,8.5 -80,7.3 -81,7.8 -82.5,8.2 -84,9.5 -85.7,10 -85.8,11.2 -87.5,12.9 -89,13.4 -91,13.9 -92.3,14.5 -94,16 -96.5,15.7 -98.5,16.3 -101,17.4 -103.5,18.3 -105.5,20.3 -105.3,21.8 -106.4,23.2 -108.6,25.5 -111,27.9 -112.7,29.9 -114.8,31.8 -114.3,30 -112.7,27.6 -111,25.3 -109.5,23.2 -110.3,23.6 -112.1,24.8 -114.2,27.6 -115.7,29.7 -117.1,32.5 -118.4,34 -120.6,34.6 -121.9,36.6 -122.5,37.8 -123.8,39.8 -124.4,42 -124,46.2 -124.7,48.4 -123,49 -125.5,50.3 -127.8,51.7 -130,54.5 -132,56.5 -135.3,58 -137.5,58.8 -140,59.8 -144,60 -146.6,60.8 -149,59.8 -151.8,59.2 -154,58.4 -156.5,57 -158.5,56 -161.8,55.2 -163.5,54.6 -160,56.4 -157,58.7 -160,58.6 -162,59.9 -164.5,60.8 -165.4,62.3 -164.8,63.2 -161,63.5 -161,64.5 -163,64.6 -166,64.6',
  '-62,66.6 -64,65 -65,62.5 -68,62.6 -72,64 -77.5,64.3 -74,67 -80,69.6 -84,70.2 -88,71 -81,73.7 -76,72.6 -71,71 -68,70.5 -66.5,68',
  '-118,73 -117,70.5 -113,68.6 -105,68.8 -101,70 -102,72.8 -110,73.3',
  '-125.5,71.9 -121,74.5 -115.5,73.5 -119,71 -123,71',
  '-90,76.5 -78,76 -75,78.5 -68,80.5 -62,82.2 -75,83 -90,81.5 -92,79',
  '-92,74.5 -80,74.5 -82,76.4 -90,76.5',
  '-86.5,64.5 -82,63.5 -80.5,64.5 -84,66 -87,65.5',
  '-59.4,47.6 -56,47.6 -53,46.7 -52.7,47.7 -53.5,49.3 -55.5,49.7 -56,51.6 -57.4,50.7 -59.2,48.5',
  '-84.9,21.9 -83,23 -81,23.2 -79,22.5 -77,21.3 -74.2,20.3 -75.8,19.9 -77.7,19.9 -78.5,21.5 -81.5,22.2 -83.5,22',
  '-74.4,18.4 -72.8,19.9 -70,19.7 -68.4,18.6 -70,18.2 -71.5,17.6 -74,18.1',
  '-43.5,59.8 -41,61 -39.5,64.5 -35,66 -29.5,68.3 -23,70 -21.8,71.5 -22,73 -19.5,74.6 -18.5,77 -20,79.8 -16,81.5 -12,81.6 -20,82.5 -31,83.6 -45,82.7 -55,82.2 -60,81.6 -65,80 -71,78.8 -73,77.8 -68,76.2 -58,75.6 -57,74 -55.5,71.5 -54,70.5 -51,69 -53.5,67.5 -53,66 -51.5,64 -50,62 -48,60.8 -45.5,60.2',
  '-22.6,63.8 -20,63.5 -18,63.4 -15,64.3 -13.6,65.1 -14.6,66.2 -16.5,66.5 -19,66.1 -22,66.4 -24,65.6 -22,65 -24,64.8 -22,64',
  '-77.4,8.3 -76,9.3 -75.5,10.5 -74.3,11.1 -72.5,11.8 -71.6,12.4 -71.3,11.8 -70.2,11.5 -68.3,10.5 -66,10.6 -64,10.6 -62,10.7 -61,9.8 -60.5,8.5 -58.5,7 -57,6 -55,5.9 -53,5.6 -51.5,4.3 -50,1.8 -50.5,0.2 -49,-0.5 -48,-1 -44.5,-2.4 -41.5,-2.9 -38.5,-3.7 -35.3,-5.2 -34.8,-7.5 -35.3,-9.4 -37,-11 -38.6,-13.2 -39,-15.5 -39.3,-17.8 -40.6,-20.5 -41.8,-22.5 -43.2,-23 -45,-23.6 -47.5,-25 -48.6,-26.5 -48.7,-28.5 -50.3,-30.5 -52.2,-32.5 -53.4,-33.8 -55,-34.9 -56.7,-34.6 -58.4,-34.3 -57.3,-35.5 -56.7,-36.5 -57.6,-38.2 -60,-38.9 -62.3,-38.8 -62.2,-40.5 -65,-41 -64,-42.4 -65.2,-44.7 -67.5,-46 -65.8,-47.8 -68.3,-50.2 -69.2,-51.6 -68.4,-52.4 -68.6,-54.8 -66.5,-55 -70,-55.2 -73,-53.5 -74.6,-51.5 -75.5,-48.5 -74,-46.5 -74.5,-44 -73.8,-41.8 -73.5,-39 -73.3,-37 -72.2,-35 -71.6,-33 -71.5,-30 -71.1,-27.5 -70.5,-25 -70.2,-21.5 -70.3,-18.4 -71.4,-17.6 -73.2,-16.4 -75.2,-15 -76.3,-13.6 -77.3,-11.8 -78.9,-8.6 -79.9,-6.8 -81.2,-5.8 -81.3,-4.3 -80.4,-3.4 -80,-2.2 -80.9,-1 -80,0.8 -79,1.6 -78.6,2.6 -77.5,3.9 -77.3,6.2 -77.9,7.2',
  '-5.6,36 -6.3,36.8 -7.4,37.2 -8.9,37 -8.8,38.7 -9.5,38.8 -8.9,40.2 -8.8,42 -9.3,43 -8,43.7 -5.8,43.6 -3.8,43.4 -1.8,43.4 -1.3,44.5 -1.2,46 -2.2,47.1 -4.5,47.9 -4.7,48.6 -3,48.8 -1.6,48.7 -1.9,49.7 -1.2,49.3 0.2,49.6 1.6,50.2 1.8,51 3,51.3 4.2,52 4.8,53.1 5.5,53.4 7,53.6 8.5,53.9 8.6,55.4 8.1,56.6 8.6,57.1 10.6,57.7 10.3,56.4 10.9,56.4 10,55.6 10.5,54.4 11,54 12.5,54.4 14.2,53.9 16,54.3 18.5,54.8 19.8,54.4 21.2,55.2 21,56.5 21.6,57.4 23.5,57 24.3,57.8 23.5,58.6 23.4,59.3 25,59.6 28,59.5 29.9,60 27,60.5 24,60 22.5,60.2 21.4,61 21.5,62.8 22.3,63.5 24.5,64.8 25.4,65.3 24.2,65.8 22.3,65.7 21,64.6 19,63.5 17.6,62.5 17.3,61 18.5,60.2 19,59.8 18.6,59.4 16.6,57.9 16.4,56.6 15.5,56.1 14.2,55.4 12.9,55.4 12.8,56.6 11.9,57.6 11.2,59 10.6,59.9 9.6,59 8,58.1 6.6,58.1 5.6,58.9 5,60.5 5,61.8 6.3,62.6 8,63.3 10,64 11.3,65 12.5,66.2 14,67.3 15.5,68.3 17,69 19,69.8 22,70.3 25.8,71.1 28.5,70.9 31,70.3 33,69.4 36,69 41,66.5 44,66 44,68.2 46,68 50,68 53.5,68.5 57,68.6 60,69.6 65,69.3 68,68.5 69,72.8 72,72.8 75,72.5 80,73.5 90,75.5 100,77 110,76.6 120,73 140,72 160,70 175,67 165,60 155,52 140,46 130,40 122,32 115,22 108,15 105,10 100,14 98,8 95,16 90,22 85,20 80,14 77,8 74,15 72,21 67,24.5 62,25.2 58,25.6 57,27 56.5,27.2 54,26.7 51.5,27.9 50.3,29.8 48.5,30 48,29 49.5,27.2 50.5,25.5 51.5,25.8 51.6,24.3 54,24.2 56,25.6 56.4,26.4 56.3,24.7 57.5,23.7 59.5,22.5 58.8,20.5 57.8,19 55.5,17.6 52.3,16.2 49,14.5 45.5,13 43.5,12.7 42.8,15 42.5,16.5 41,19 39.2,21.5 38.4,23.8 37.2,25.2 35.5,27.5 34.9,29.5 34.2,31.3 35,32.9 35.9,34.6 35.9,35.9 36.2,36.6 34.6,36.8 32.6,36.1 30.6,36.7 29,36.6 27.3,37 26.3,38.3 26.6,39.5 26.2,40.3 26,40.8 24,40.7 22.6,40.5 22.9,39.3 24,38.2 23,37.4 22.8,36.5 21.7,36.8 21.1,37.8 21.3,38.4 20.7,39.1 20,39.7 19.4,40.4 19.5,41.8 18.5,42.5 17,43.2 15.5,44.1 14.5,45.2 13.7,45.6 12.3,45.3 12.4,44.5 13.6,43.5 14.8,42.1 16,41.4 18,40.6 18.5,40.1 17.2,40.4 16.6,39.4 17.1,39 16.5,38.4 15.6,38 15.7,39.2 15.6,40.1 14.5,40.6 13.7,41.2 12.2,41.8 11,42.5 10.5,43.3 9.8,44.1 8.8,44.4 7.5,43.8 6,43.1 4.8,43.4 3.2,43.2 3.2,42 2.2,41.4 0.9,41 0,39.8 -0.4,38.6 -0.8,37.6 -2,36.8 -4.4,36.7',
  '-5.9,35.8 -2,35.1 1,36.5 3,36.8 6.5,37 8.6,36.9 10.2,37.2 11,36.8 10.5,36.1 11.1,35.2 10.1,34.3 11.2,33.2 13,32.9 15.2,32.3 17.5,31 19,30.3 20,32.1 21.6,32.9 23.2,32.2 25,31.6 27.5,31.3 29.9,31.3 32.3,31.3 34.2,31.3 34.9,29.5 34.3,27.8 33.5,28.6 32.6,29.9 33.8,27 35.5,24 36.9,22 37.3,19.5 38.5,18 39.5,15.5 41.2,14.2 42.4,12.9 43.3,11.9 44.5,10.4 47,11.1 49.5,11.3 51.3,11.8 51,10.4 50.8,8.5 49.5,6.8 48,4.5 46,2 44,1 42.5,-0.5 41,-2 39.7,-4.5 39.2,-6.5 39.4,-8 40.4,-10.5 40.6,-14 40,-16 37,-17.7 35.3,-19 35.5,-22 35.5,-24 33,-25.8 32.9,-26.9 32.4,-28.5 31,-29.9 30,-31.2 28.5,-32.5 27,-33.6 25.7,-33.8 23.6,-33.9 22,-34.3 20,-34.8 18.5,-34.2 18.4,-33 17.8,-31.5 16.5,-28.6 15.2,-27 14.5,-23 13.4,-20.9 12,-18 11.8,-16.5 12.2,-14 13.6,-12 13.2,-9.4 12.3,-6 12,-5 11.1,-3.9 9.5,-1.5 9.3,0 9.6,2.3 9.8,3.8 8.5,4.6 7,4.4 5.5,4.4 4.4,6.3 2,6.3 0,5.6 -2,4.8 -4,5.2 -7.5,4.4 -9.4,5.4 -11.4,6.9 -13.2,8.5 -14.5,10.5 -15.5,11.5 -16.7,12.5 -17.2,14.7 -16.5,16.2 -16.2,19.6 -17,21 -16.5,23.5 -15,24.6 -14.5,26.1 -13.2,27.6 -11.5,28.3 -9.8,29.6 -9.6,31.5 -8.5,33.3 -6.8,34',
  '49.3,-12 50.4,-15.3 49.6,-17 48.8,-20 47.8,-23.3 47,-25 45.2,-25.5 44,-24.8 43.3,-22 44.3,-20 44.1,-17 46.3,-15.7 47.8,-14.5 48.8,-13.3',
  '-5.7,50.1 -4,50.4 -3,50.7 -1,50.8 1.4,51.2 1.6,52.6 0.3,53.1 0,53.6 -0.5,54.5 -1.6,55.6 -2.5,56.1 -1.8,57.5 -3,57.7 -4,57.8 -3,58.6 -5,58.6 -5.7,57.5 -6,56.6 -5.5,55.3 -4.8,54.8 -3.4,54.9 -3,53.9 -3,53.3 -4.6,53.3 -4.2,52.8 -4.9,52 -5.2,51.7 -3,51.4 -4.3,51.2',
  '-6,52.2 -6.2,53.4 -5.7,54.7 -7.3,55.3 -8.5,54.6 -10,54.2 -9.9,53.3 -10.3,51.9 -9.5,51.5 -8,51.8 -6.4,52.1',
  '12.4,37.9 15.6,38.3 15.1,36.7 12.4,37.6',
  '8.4,39 9.6,39.2 9.8,41 8.2,41 8.4,40',
  '8.6,41.4 9.4,41.4 9.5,43 8.7,42.6',
  '129.5,33 131,31 132,34 135.5,33.5 140,35 141,38.5 141.5,41.5 141.8,45.5 145.5,44 143.5,42 141,40.5 140,38 139,36.5 136,36 132.5,35.5',
  '114,-22 114,-34 118,-35 124,-33 132,-31 138,-35 141,-38 147,-39 150,-37 153,-30 153,-25 146,-19 142,-11 141,-17 136,-12 130,-12 126,-14 122,-18',
]);

const WATER = parsePolys([
  '28,41.3 29.1,41.2 31.3,41.1 33.3,42 35,42 36.5,41.3 38.3,40.9 40,41 41.5,41.5 41.7,42.6 40,43.4 38.3,44.3 37.5,44.7 36.6,45.2 35,45 33.6,44.5 32.5,45.4 33.5,46 31.6,46.6 30.8,46.5 29.7,45.3 28.7,44.2 28,43',
  '47,44.5 49,46.6 51.5,47 53,46 51.2,44.5 52.5,42 53,40 53.9,37.3 51,36.7 49,37.8 49.5,40.3 48.5,41.8 47.4,43',
  '35,45.3 37.5,45.3 39.2,47.2 38,47.1 35.3,46.3',
]);

const inPoly = (lon: number, lat: number, poly: LL[]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const isLand = (lon: number, lat: number) => {
  for (const p of WATER) if (inPoly(lon, lat, p)) return false;
  for (const p of LAND) if (inPoly(lon, lat, p)) return true;
  return false;
};

const G_CX = 528;
const G_CY = 540;
const G_R = 372;
const G_LON0 = -30;
const G_LAT0 = 30;
const RAD = Math.PI / 180;

const project = (lon: number, lat: number) => {
  const l = (lon - G_LON0) * RAD;
  const p = lat * RAD;
  const p0 = G_LAT0 * RAD;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
  const x = G_CX + G_R * Math.cos(p) * Math.sin(l);
  const y = G_CY - G_R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
  return { x, y, cosc };
};

const dot = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;

let globeCache: { ocean: string; land: string[] } | null = null;

const globeDots = () => {
  if (globeCache) return globeCache;
  const land = ['', '', '', ''];
  let ocean = '';
  const STEP = 1.75;
  let row = 0;
  for (let lat = -78; lat <= 84; lat += STEP, row++) {
    const n = Math.max(1, Math.round((360 / STEP) * Math.cos(lat * RAD)));
    for (let k = 0; k < n; k++) {
      const lon = -180 + ((k + (row % 2) * 0.5) * 360) / n;
      const { x, y, cosc } = project(lon, lat);
      if (cosc < 0.04) continue;
      if (isLand(lon, lat)) {
        const b = Math.min(3, Math.floor(Math.sqrt(cosc) * 4));
        land[b] += dot(x, y, 1.9);
      } else {
        ocean += dot(x, y, 0.9);
      }
    }
  }
  globeCache = { ocean, land };
  return globeCache;
};

const RegionPin = ({
  lon,
  lat,
  code,
  dx = 16,
  dy = 6,
  anchor = 'start',
  delay = 0,
}: {
  lon: number;
  lat: number;
  code: string;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'end';
  delay?: number;
}) => {
  const ping = useLoop(`lt-ping 2.8s ease-out ${delay}s infinite`);
  const { x, y } = project(lon, lat);
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={6}
        fill="none"
        stroke="#52A8FF"
        strokeOpacity={0.7}
        style={{ animation: ping, transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <circle cx={x} cy={y} r={11} fill="rgba(10,114,239,0.18)" />
      <circle cx={x} cy={y} r={5} fill="#52A8FF" stroke="#000" strokeWidth={2} />
      <text
        x={x + dx}
        y={y + dy}
        textAnchor={anchor}
        fill="#EDEDED"
        fontFamily={MONO}
        fontSize={17}
        style={{ paintOrder: 'stroke', stroke: '#000', strokeWidth: 6 }}
      >
        {code}
      </text>
    </g>
  );
};

const Globe = () => {
  const { ocean, land } = globeDots();
  return (
    <svg width={1920} height={1080} style={abs(0, 0, { pointerEvents: 'none' })}>
      <defs>
        <radialGradient id="lt-globe-body" cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#141414" />
          <stop offset="0.7" stopColor="#060606" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <linearGradient id="lt-globe-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.06} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <circle cx={G_CX} cy={G_CY} r={G_R} fill="url(#lt-globe-body)" />
      <path d={ocean} fill="#232323" />
      <path d={land[0]} fill="#505050" />
      <path d={land[1]} fill="#737373" />
      <path d={land[2]} fill="#969696" />
      <path d={land[3]} fill="#B8B8B8" />
      <circle
        cx={G_CX}
        cy={G_CY}
        r={G_R + 0.5}
        fill="none"
        stroke="url(#lt-globe-rim)"
        strokeWidth={1}
      />
      <RegionPin lon={-122.4} lat={37.6} code="sfo1" dx={-16} anchor="end" delay={0.4} />
      <RegionPin lon={-77.4} lat={38.9} code="iad1" />
      <RegionPin lon={-46.5} lat={-23.4} code="gru1" delay={0.8} />
      <RegionPin lon={-0.1} lat={51.5} code="lhr1" dx={-16} anchor="end" delay={1.2} />
      <RegionPin lon={8.7} lat={50.1} code="fra1" delay={1.6} />
    </svg>
  );
};

const RegionRow = ({
  y,
  name,
  code,
  p50,
  p99,
}: {
  y: number;
  name: string;
  code: string;
  p50: number;
  p99: number;
}) => (
  <div
    style={abs(col(6) + 48, y, {
      width: 768,
      height: 52,
      display: 'flex',
      alignItems: 'center',
      borderBottom: `1px solid ${LINE}`,
      ...NUM,
    })}
  >
    <span style={{ width: 300, fontSize: 24, letterSpacing: '-0.015em' }}>{name}</span>
    <span style={{ width: 140, fontFamily: MONO, fontSize: 19, color: TER }}>{code}</span>
    <span style={{ flex: 1, position: 'relative', height: 4 }}>
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 4,
          width: p99 * 1.2,
          background: EDGE,
          borderRadius: 2,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 4,
          width: p50 * 1.2,
          background: '#52A8FF',
          borderRadius: 2,
        }}
      />
    </span>
    <span style={{ width: 84, textAlign: 'right', fontFamily: MONO, fontSize: 21 }}>{p50}</span>
    <span style={{ width: 84, textAlign: 'right', fontFamily: MONO, fontSize: 21, color: TER }}>
      {p99}
    </span>
  </div>
);

const Regions: Page = () => (
  <Stage section="Regions">
    <VLine x={col(6)} y1={FT} y2={FB} />
    <HLine y={408} x1={col(6)} x2={FR} />
    <Cross x={col(6)} y={FT} />
    <Cross x={col(6)} y={FB} />
    <Cross x={col(6)} y={408} />
    <Cross x={FR} y={408} />
    <div
      style={{
        position: 'absolute',
        left: FL + 1,
        top: FT + 1,
        width: col(6) - FL - 1,
        height: FB - FT - 1,
        background:
          'radial-gradient(560px 480px at 44% 42%, rgba(255,255,255,0.045), transparent 70%)',
      }}
    />
    <Globe />
    <Eyebrow x={144} y={144}>
      Fabric regions
    </Eyebrow>
    <div style={abs(144, 936, { ...LABEL, fontSize: 15, color: DIM })}>
      Orthographic · 30°W 30°N
    </div>
    <Eyebrow x={col(6) + 48} y={144}>
      18 of 18 regions
    </Eyebrow>
    <h2 style={abs(col(6) + 48, 184, { ...HEAD, fontSize: 64 })}>Every region, day one.</h2>
    <p style={abs(col(6) + 48, 270, { ...BODY, width: 720 })}>
      Fabric is live in all 18 compute regions. Cold start by region, in milliseconds.
    </p>
    <div
      style={abs(col(6) + 48, 440, {
        width: 768,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${EDGE}`,
        ...LABEL,
        fontSize: 14,
        color: DIM,
      })}
    >
      <span style={{ width: 300 }}>Region</span>
      <span style={{ width: 140 }}>Code</span>
      <span style={{ flex: 1 }}>
        <span style={{ color: 'var(--osd-accent)' }}>■</span> p50{' '}
        <span style={{ color: FAINT }}>■</span> p99
      </span>
      <span style={{ width: 84, textAlign: 'right' }}>p50</span>
      <span style={{ width: 84, textAlign: 'right' }}>p99</span>
    </div>
    <RegionRow y={472} name="Washington, D.C." code="iad1" p50={16} p99={84} />
    <RegionRow y={524} name="San Francisco" code="sfo1" p50={17} p99={88} />
    <RegionRow y={576} name="São Paulo" code="gru1" p50={19} p99={97} />
    <RegionRow y={628} name="London" code="lhr1" p50={17} p99={86} />
    <RegionRow y={680} name="Frankfurt" code="fra1" p50={16} p99={83} />
    <RegionRow y={732} name="Mumbai" code="bom1" p50={21} p99={104} />
    <RegionRow y={784} name="Singapore" code="sin1" p50={18} p99={92} />
    <RegionRow y={836} name="Tokyo" code="hnd1" p50={18} p99={90} />
    <RegionRow y={888} name="Sydney" code="syd1" p50={20} p99={99} />
  </Stage>
);

const erf = (x: number) => {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
};

const CX0 = 224;
const CX1 = 1040;
const CY0 = 456;
const CY1 = 792;
const CMAX = 2000;
const cxs = (ms: number) => CX0 + (ms / CMAX) * (CX1 - CX0);
const cys = (p: number) => CY1 - p * (CY1 - CY0);

const cdfPath = (median: number, sigma: number) => {
  let d = '';
  for (let i = 0; i <= 160; i++) {
    const ms = (i / 160) * CMAX;
    const p =
      ms <= 0 ? 0 : 0.5 * (1 + erf((Math.log(ms) - Math.log(median)) / (sigma * Math.SQRT2)));
    d += `${i === 0 ? 'M' : 'L'}${cxs(ms).toFixed(1)},${cys(p).toFixed(1)} `;
  }
  return d;
};

const AxisX = ({ ms }: { ms: number }) => (
  <g>
    <line x1={cxs(ms)} x2={cxs(ms)} y1={CY1} y2={CY1 + 6} stroke={FAINT} />
    <text x={cxs(ms)} y={CY1 + 30} textAnchor="middle" fill={DIM} fontFamily={MONO} fontSize={15}>
      {ms === 0 ? '0' : ms.toLocaleString('en-US')}
    </text>
  </g>
);

const AxisY = ({ p, label }: { p: number; label: string }) => (
  <g>
    <line x1={CX0} x2={CX1} y1={cys(p) + 0.5} y2={cys(p) + 0.5} stroke={p === 0 ? EDGE : LINE} />
    <text x={CX0 - 16} y={cys(p) + 5} textAnchor="end" fill={DIM} fontFamily={MONO} fontSize={15}>
      {label}
    </text>
  </g>
);

const CdfChart = () => {
  const draw = useEnter(0.2, 1.4, 'lt-draw');
  const late = useEnter(1.2, 0.5, 'lt-fade');
  const y50 = cys(0.5);
  return (
    <svg width={1920} height={1080} style={abs(0, 0, { pointerEvents: 'none' })}>
      <AxisY p={0} label="0%" />
      <AxisY p={0.5} label="50%" />
      <AxisY p={1} label="100%" />
      <AxisX ms={0} />
      <AxisX ms={500} />
      <AxisX ms={1000} />
      <AxisX ms={1500} />
      <AxisX ms={2000} />
      <text x={CX1} y={CY1 + 58} textAnchor="end" fill={FAINT} fontFamily={MONO} fontSize={14}>
        MS
      </text>
      <path
        d={cdfPath(862, 0.35)}
        fill="none"
        stroke={TER}
        strokeWidth={2}
        pathLength={1}
        strokeDasharray="1"
        style={draw}
      />
      <path
        d={cdfPath(250, 0.3)}
        fill="none"
        stroke="#52A8FF"
        strokeWidth={2.5}
        pathLength={1}
        strokeDasharray="1"
        style={draw}
      />
      <g style={late}>
        <line
          x1={cxs(250)}
          x2={cxs(862)}
          y1={y50}
          y2={y50}
          stroke="#52A8FF"
          strokeOpacity={0.6}
          strokeDasharray="3 5"
        />
        <line
          x1={cxs(250)}
          x2={cxs(250)}
          y1={y50}
          y2={CY1}
          stroke="#52A8FF"
          strokeOpacity={0.35}
          strokeDasharray="3 5"
        />
        <line
          x1={cxs(862)}
          x2={cxs(862)}
          y1={y50}
          y2={CY1}
          stroke={TER}
          strokeOpacity={0.35}
          strokeDasharray="3 5"
        />
        <circle cx={cxs(250)} cy={y50} r={5.5} fill="#000" stroke="#52A8FF" strokeWidth={2} />
        <circle cx={cxs(862)} cy={y50} r={5.5} fill="#000" stroke={TER} strokeWidth={2} />
        <text
          x={cxs(250) - 14}
          y={y50 - 16}
          textAnchor="end"
          fill="#52A8FF"
          fontFamily={MONO}
          fontSize={18}
        >
          250 ms
        </text>
        <text x={cxs(862) + 14} y={y50 + 30} fill={SEC} fontFamily={MONO} fontSize={18}>
          862 ms
        </text>
        <text
          x={(cxs(250) + cxs(862)) / 2}
          y={y50 - 14}
          textAnchor="middle"
          fill="#EDEDED"
          fontFamily={MONO}
          fontSize={18}
        >
          3.4× faster at p50
        </text>
      </g>
    </svg>
  );
};

const BarPair = ({
  y,
  label,
  before,
  after,
}: {
  y: number;
  label: string;
  before: number;
  after: number;
}) => {
  const grow = useEnter(0.3, 0.9, 'lt-grow');
  const scale = 0.4;
  return (
    <div style={abs(col(7) + 48, y, { width: 624, height: 64 })}>
      <div style={abs(0, 20, { ...LABEL, fontSize: 17, color: SEC })}>{label}</div>
      <div
        style={abs(80, 0, {
          width: before * scale,
          height: 22,
          background: '#3A3A3A',
          borderRadius: 3,
          transformOrigin: 'left',
          ...grow,
        })}
      />
      <div
        style={abs(80 + before * scale + 12, 0, {
          fontFamily: MONO,
          fontSize: 17,
          lineHeight: '22px',
          color: TER,
          ...NUM,
        })}
      >
        {before.toLocaleString('en-US')}
      </div>
      <div
        style={abs(80, 32, {
          width: Math.max(4, after * scale),
          height: 22,
          background: '#52A8FF',
          borderRadius: 3,
          transformOrigin: 'left',
          ...grow,
        })}
      />
      <div
        style={abs(80 + Math.max(4, after * scale) + 12, 32, {
          fontFamily: MONO,
          fontSize: 17,
          lineHeight: '22px',
          color: 'var(--osd-accent)',
          ...NUM,
        })}
      >
        {after}
      </div>
    </div>
  );
};

const ChartLegend = ({ x, y }: { x: number; y: number }) => (
  <div style={abs(x, y, { display: 'flex', gap: 28, ...LABEL, fontSize: 15, color: SEC })}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 18, height: 3, background: '#52A8FF', borderRadius: 2 }} />
      Fabric
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 18, height: 3, background: TER, borderRadius: 2 }} />
      Functions
    </span>
  </div>
);

const Benchmarks: Page = () => (
  <Stage section="Benchmarks">
    <TitleBand
      eyebrow="Production-shaped test"
      title="3.4× faster to first byte."
      body="Same app, same database, same traffic. One change in the config."
      bodyWidth={480}
    />
    <VLine x={col(7)} y1={336} y2={912} />
    <HLine y={912} />
    <Cross x={col(7)} y={336} />
    <Cross x={col(7)} y={912} />
    <Cross x={FL} y={912} />
    <Cross x={FR} y={912} />
    <Eyebrow x={144} y={384}>
      Time to first byte · CDF
    </Eyebrow>
    <ChartLegend x={col(7) - 48 - 290} y={384} />
    <CdfChart />
    <Eyebrow x={col(7) + 48} y={384}>
      Cold start · ms
    </Eyebrow>
    <BarPair y={448} label="p50" before={210} after={18} />
    <BarPair y={544} label="p95" before={640} after={52} />
    <BarPair y={640} label="p99" before={1140} after={96} />
    <div style={abs(col(7) + 48, 760, { display: 'flex', alignItems: 'baseline', gap: 20 })}>
      <span
        style={{
          ...HEAD,
          ...NUM,
          fontSize: 64,
          letterSpacing: '-0.05em',
          color: 'var(--osd-accent)',
        }}
      >
        11.7×
      </span>
      <span style={{ ...BODY, fontSize: 24 }}>faster cold starts at p50</span>
    </div>
    <div
      style={abs(144, 936, { fontSize: 18, color: DIM, letterSpacing: '-0.005em', width: 1632 })}
    >
      Method: Next.js 16 storefront, three sequential Postgres queries per request, database in
      iad1. Traffic from 9 regions, 14.2M requests, Sep 8–28, 2026.
    </div>
  </Stage>
);

const HalyardMark = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <svg width={34} height={34} viewBox="0 0 34 34" fill="none">
      <circle cx={17} cy={17} r={15.5} stroke="#EDEDED" strokeWidth={1.5} />
      <path
        d="M17 5v24M17 9c4 3 7 8 7 14H17"
        stroke="#EDEDED"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
    <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '0.16em' }}>HALYARD</span>
  </div>
);

const KV = ({ y, k, v }: { y: number; k: string; v: string }) => (
  <div
    style={abs(col(9) + 48, y, {
      width: 336,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: `1px solid ${LINE}`,
    })}
  >
    <span style={{ ...LABEL, fontSize: 14, color: DIM }}>{k}</span>
    <span style={{ fontSize: 21, letterSpacing: '-0.015em' }}>{v}</span>
  </div>
);

const Result = ({ x, value, caption }: { x: number; value: string; caption: ReactNode }) => (
  <div
    style={abs(x, 744, { width: 576, height: 240, boxSizing: 'border-box', padding: '48px 48px' })}
  >
    <div style={{ ...HEAD, ...NUM, fontSize: 88, letterSpacing: '-0.055em', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ ...BODY, fontSize: 24, marginTop: 22 }}>{caption}</div>
  </div>
);

const Customer: Page = () => (
  <Stage section="Customers">
    <VLine x={col(9)} y1={FT} y2={744} />
    <HLine y={744} />
    <VLine x={col(4)} y1={744} y2={FB} />
    <VLine x={col(8)} y1={744} y2={FB} />
    <Cross x={col(9)} y={FT} />
    <Cross x={col(9)} y={744} />
    <Cross x={FL} y={744} />
    <Cross x={FR} y={744} />
    <Cross x={col(4)} y={744} />
    <Cross x={col(8)} y={744} />
    <Cross x={col(4)} y={FB} />
    <Cross x={col(8)} y={FB} />
    <Eyebrow x={144} y={144}>
      Customer story · Halyard
    </Eyebrow>
    <blockquote
      style={abs(144, 216, {
        ...HEAD,
        fontSize: 68,
        fontWeight: 500,
        letterSpacing: '-0.045em',
        lineHeight: 1.12,
        width: 1180,
        textIndent: -30,
        textWrap: 'balance',
      })}
    >
      “We changed one line of config. Checkout got 472 ms faster
      <span style={{ color: TER }}>, and we didn’t touch a single query.”</span>
    </blockquote>
    <div style={abs(144, 584, { display: 'flex', alignItems: 'center', gap: 20 })}>
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 999,
          border: `1px solid ${EDGE}`,
          background: 'linear-gradient(135deg, #2A2A2A, #111)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 500,
          color: SEC,
        }}
      >
        PR
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>Priya Raman</div>
        <div style={{ fontSize: 21, color: TER, marginTop: 4 }}>VP Engineering, Halyard</div>
      </div>
    </div>
    <div style={abs(col(9) + 48, 144)}>
      <HalyardMark />
    </div>
    <div style={abs(col(9) + 48, 220, { ...BODY, fontSize: 22, width: 336, lineHeight: 1.5 })}>
      Outdoor gear, sold direct in 14 countries. 2.1M shoppers a month.
    </div>
    <KV y={488} k="Industry" v="Retail" />
    <KV y={552} k="Stack" v="Next.js · Postgres" />
    <KV y={616} k="Database" v="iad1" />
    <KV y={680} k="On Lattice" v="Since 2023" />
    <Result
      x={FL}
      value="−64%"
      caption={
        <>
          Checkout TTFB, p50 <span style={{ color: DIM }}>· 740 → 268 ms</span>
        </>
      }
    />
    <Result x={col(4)} value="+4.2%" caption="Checkout conversion, first 30 days" />
    <Result
      x={col(8)}
      value="1 line"
      caption={
        <>
          Config changed{' '}
          <span style={{ fontFamily: MONO, fontSize: 21, color: 'var(--osd-accent)' }}>
            fabric: true
          </span>
        </>
      }
    />
  </Stage>
);

const Milestone = ({
  x,
  date,
  title,
  body,
  live = false,
}: {
  x: number;
  date: string;
  title: string;
  body: string;
  live?: boolean;
}) => (
  <div style={abs(x, 336, { width: 576, height: 408 })}>
    <div
      style={abs(48, 128, {
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      })}
    >
      <span style={{ ...LABEL, color: live ? 'var(--osd-text)' : TER }}>{date}</span>
      {live ? (
        <Pill tone="live">
          <Dot color={GREEN} size={7} />
          Live
        </Pill>
      ) : (
        <Pill>Planned</Pill>
      )}
    </div>
    <div
      style={abs(48, 190, {
        fontSize: 44,
        fontWeight: 600,
        letterSpacing: '-0.04em',
        lineHeight: 1.1,
      })}
    >
      {title}
    </div>
    <p style={abs(48, 258, { ...BODY, fontSize: 26, lineHeight: 1.45, width: 470 })}>{body}</p>
  </div>
);

const Price = ({ x, label, body }: { x: number; label: string; body: ReactNode }) => (
  <div
    style={abs(x, 744, { width: 576, height: 240, boxSizing: 'border-box', padding: '52px 48px' })}
  >
    <div style={{ ...LABEL, color: DIM }}>{label}</div>
    <div
      style={{
        fontSize: 32,
        fontWeight: 500,
        letterSpacing: '-0.03em',
        lineHeight: 1.3,
        marginTop: 20,
        width: 470,
      }}
    >
      {body}
    </div>
  </div>
);

const Availability: Page = () => {
  const ping = useLoop('lt-ping 2.4s ease-out infinite');
  return (
    <Stage section="Availability">
      <TitleBand
        eyebrow="Rollout"
        title="Public beta starts today."
        body="On for every Pro and Enterprise team, in all 18 regions."
        bodyWidth={480}
      />
      <HLine y={744} />
      <VLine x={col(4)} y1={336} y2={FB} />
      <VLine x={col(8)} y1={336} y2={FB} />
      <Cross x={col(4)} y={336} />
      <Cross x={col(8)} y={336} />
      <Cross x={FL} y={744} />
      <Cross x={col(4)} y={744} />
      <Cross x={col(8)} y={744} />
      <Cross x={FR} y={744} />
      <Cross x={col(4)} y={FB} />
      <Cross x={col(8)} y={FB} />
      <svg width={1920} height={1080} style={abs(0, 0, { pointerEvents: 'none' })}>
        <defs>
          <linearGradient id="lt-track" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={GREEN} stopOpacity={0.9} />
            <stop offset="1" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <line x1={150} x2={1776} y1={416.5} y2={416.5} stroke={EDGE} strokeDasharray="4 6" />
        <rect x={150} y={415.5} width={420} height={2} fill="url(#lt-track)" />
        <circle
          cx={150}
          cy={416.5}
          r={8}
          fill="none"
          stroke={GREEN}
          style={{ animation: ping, transformBox: 'fill-box', transformOrigin: 'center' }}
        />
        <circle cx={150} cy={416.5} r={7} fill={GREEN} />
        <circle cx={col(4) + 54} cy={416.5} r={6.5} fill="#000" stroke={SEC} strokeWidth={1.5} />
        <circle cx={col(8) + 54} cy={416.5} r={6.5} fill="#000" stroke={SEC} strokeWidth={1.5} />
      </svg>
      <Milestone
        x={FL}
        date="Oct 21, 2026"
        title="Public beta"
        body="Pro and Enterprise teams. Turn it on with one line, or from the dashboard."
        live
      />
      <Milestone
        x={col(4)}
        date="Dec 2026"
        title="Placement policies"
        body="Pin routes to regions, set allowlists, and audit every placement."
      />
      <Milestone
        x={col(8)}
        date="Feb 2027"
        title="General availability"
        body="Backed by the 99.99% compute SLA. Hobby plans included."
      />
      <Price x={FL} label="During beta" body="No added cost. Fabric usage is free until GA." />
      <Price
        x={col(4)}
        label="At GA"
        body="Billed as standard function compute. Snapshots included."
      />
      <Price
        x={col(8)}
        label="Hobby"
        body={
          <>
            Waitlist opens today at{' '}
            <span style={{ color: 'var(--osd-accent)' }}>lattice.dev/fabric</span>
          </>
        }
      />
    </Stage>
  );
};

const CopyIcon = () => (
  <svg width={22} height={22} viewBox="0 0 16 16" fill="none" stroke={TER} strokeWidth={1.2}>
    <rect x={5} y={5} width={9} height={9} rx={2} />
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
  </svg>
);

const Close: Page = () => {
  const rise = useEnter(0.1, 0.7);
  return (
    <Stage section="Get started">
      <Beam />
      <HLine y={336} />
      <HLine y={744} />
      <VLine x={col(1)} y1={336} y2={744} />
      <VLine x={col(11)} y1={336} y2={744} />
      <VLine x={col(4)} y1={744} y2={FB} />
      <VLine x={col(8)} y1={744} y2={FB} />
      <Cross x={FL} y={336} />
      <Cross x={col(1)} y={336} />
      <Cross x={col(11)} y={336} />
      <Cross x={FR} y={336} />
      <Cross x={FL} y={744} />
      <Cross x={col(1)} y={744} />
      <Cross x={col(4)} y={744} />
      <Cross x={col(8)} y={744} />
      <Cross x={col(11)} y={744} />
      <Cross x={FR} y={744} />
      <Cross x={col(4)} y={FB} />
      <Cross x={col(8)} y={FB} />
      <div
        style={abs(col(1), 336, {
          width: col(11) - col(1),
          height: 408,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...rise,
        })}
      >
        <h2
          style={{
            ...HEAD,
            ...GRADIENT_TEXT,
            fontSize: 168,
            letterSpacing: '-0.06em',
            lineHeight: 1,
          }}
        >
          Ship something.
        </h2>
        <div
          style={{
            marginTop: 40,
            width: 620,
            height: 76,
            boxSizing: 'border-box',
            borderRadius: 12,
            border: `1px solid ${EDGE}`,
            background: SURF,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px 0 28px',
            fontFamily: MONO,
            fontSize: 27,
          }}
        >
          <span style={{ color: DIM, marginRight: 18 }}>$</span>
          <span>npx lattice@latest init</span>
          <span style={{ marginLeft: 'auto', display: 'flex' }}>
            <CopyIcon />
          </span>
        </div>
      </div>
      <MetaCell x={FL} label="Docs" value="lattice.dev/fabric" />
      <MetaCell x={col(4)} label="Beta" value="Pro & Enterprise, today" />
      <MetaCell x={col(8)} label="Next" value="Breakouts · 11:00, Hall B" />
    </Stage>
  );
};

Cover.transition = settle;
Problem.transition = morphTransition;
WithFabric.transition = morphTransition;
Announce.transition = settle;
Close.transition = settle;

export const meta: SlideMeta = {
  title: 'Lattice — Ship ’26 keynote',
  createdAt: '2026-10-12T05:18:06.665Z',
};

export const notes: (string | undefined)[] = [
  `Walk on while the room settles. Wait for quiet.
"Good morning, San Francisco. Welcome to Pier 48, and welcome to Ship '26."
"We have a lot to show you today, and one thing we've been building for two years."
Click.`,
  `"First, a look back at the year."
Left to right: "Four point eight million deployments every week, up sixty-two percent. One point two trillion requests served. Six new compute regions, eighteen in total."
Land on the last cell: "And the median cold start is down a third, to two hundred and ten milliseconds."
Beat. "We're proud of that number. But it's not the one that hurts most." Click.`,
  `"Here's the one that hurts."
"Your users are everywhere. Your data usually lives in one place."
Trace the diagram: "A shopper in Singapore. The edge is four milliseconds away. The function runs right there. Then it needs Postgres, in Virginia."
"Three queries. Three trips across the Pacific and back. Six hundred and thirty-six milliseconds of waiting."
Point at the bar: "Eight hundred and sixty-two milliseconds before the first byte. Most of it is the ocean." Click.`,
  `Let the function glide across before you speak.
"Now move the function instead."
"One trip across. The three queries now happen inside the same data center: one point three milliseconds each."
"The cold start drops from two-ten to eighteen, because there's a snapshot waiting."
"Same page. Two hundred and fifty milliseconds." Pause. Click.`,
  `Say the name slowly.
"This is Lattice Fabric."
"A compute layer that runs every function next to the data it reads. You don't choose the region. Fabric does."
Read the three facts: "Eighteen-millisecond cold starts. Three point four times faster to first byte. One line of config."
"It's in public beta, starting today." Click.`,
  `"Here's how it works. Three steps."
Click: "Route. The nearest of our one hundred twenty-six edge locations takes the request and hands it to the Fabric router."
Click: "Place. The router knows which data each route reads, so it sends the request to that region. Cart goes to Virginia, recommendations to Frankfurt, stock to Tokyo."
Click: "Warm. A snapshot is already waiting there. It boots in eighteen milliseconds."
"All of this happens before your code runs." Click.`,
  `"And you deploy exactly the way you do today."
Walk the log: "Upload, build, and then one new step: Fabric places each function next to its data, and snapshots it."
"Twenty-three seconds, and Halyard's storefront is live with Fabric."
Point at the card: "Ready. Twelve functions, three regions. Same Git flow." Click.`,
  `"How do you turn it on?"
Point at the highlighted line. "That's it. fabric: true."
"Fabric reads your database bindings at build time. It places every route next to the data it queries. And it keeps a warm snapshot in each of those regions."
"If you prefer, Command K, Enable Fabric, from the dashboard." Click.`,
  `"Fabric isn't rolling out region by region. It's live everywhere, today."
"All eighteen compute regions."
Gesture at the table: "Median cold starts between sixteen and twenty-one milliseconds, wherever you are. p99 stays under one hundred and five." Click.`,
  `"We ran the benchmark the boring way."
"Same Next.js storefront, same database in Virginia, traffic from nine regions. Fourteen million requests over three weeks."
Left chart: "Median time to first byte goes from eight sixty-two to two-fifty. Three point four times faster, and the whole curve moves, not just the median."
Right chart: "Cold starts: two-ten down to eighteen at p50. Eleven-hundred-forty down to ninety-six at p99." Click.`,
  `"Halyard was one of our first design partners."
Read the quote in full. Let it land.
"Checkout time to first byte down sixty-four percent, seven-forty to two sixty-eight. A four point two percent lift in checkout conversion in the first thirty days."
"And one line changed in their config." Click.`,
  `"So, when can you use it?"
"Right now. Public beta starts today for every Pro and Enterprise team, in all eighteen regions."
"In December, placement policies: pin routes, set allowlists, audit placements."
"General availability in February, with the compute SLA, and Hobby plans included."
"No added cost during the beta." Click.`,
  `"One command to start."
Pause on the command. "npx lattice at latest init."
"Docs are live at lattice.dev slash fabric. Breakouts start at eleven in Hall B, and the team that built Fabric will be there."
"Thank you. Go ship something."`,
];

export default [
  Cover,
  Year,
  Problem,
  WithFabric,
  Announce,
  Architecture,
  Deploy,
  Config,
  Regions,
  Benchmarks,
  Customer,
  Availability,
  Close,
] satisfies Page[];

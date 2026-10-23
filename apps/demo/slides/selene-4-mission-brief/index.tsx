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
  palette: { bg: '#EFE6D2', text: '#3A2414', accent: '#D4601C' },
  fonts: {
    display: '"Saira", "Eurostile Extended", "Microgramma D Extended", sans-serif',
    body: '"Courier Prime", "Courier New", monospace',
  },
  typeScale: { hero: 176, body: 30 },
  radius: 6,
};

const INK = 'var(--osd-text)';
const ACCENT = 'var(--osd-accent)';
const BG = 'var(--osd-bg)';
const RUST = '#A63B1C';
const MUSTARD = '#D9A022';
const BROWN = '#5B3920';
const AVOCADO = '#6E7D2C';
const MUTED = '#86705A';
const SHEET = '#F7F1E3';
const PANEL = '#E3D6BA';
const PALE_MUSTARD = '#EACB80';
const RULE = 'rgba(58,36,20,0.22)';
const SPACE = '#2B1A0F';
const CONSOLE = '#2E1D12';
const LAMP_GO = '#B4CF4A';
const LAMP_AMBER = '#F2AE3E';

const SLIDE_ID = 'selene-4-mission-brief';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Saira:wdth,wght@125,500;125,700;125,800&family=Courier+Prime:wght@400;700&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes se-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes se-fillin { from { fill-opacity: 0 } to { fill-opacity: 1 } }
@keyframes se-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes se-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
@keyframes se-growx { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes se-growy { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes se-lamp { 0% { opacity: 0 } 28% { opacity: 0.95 } 44% { opacity: 0.2 } 62% { opacity: 1 } 76% { opacity: 0.6 } 100% { opacity: 1 } }
@keyframes se-pop { 0% { opacity: 0; transform: scale(0.3) } 70% { opacity: 1; transform: scale(1.12) } 100% { opacity: 1; transform: scale(1) } }
@keyframes se-pulse { 0% { opacity: 0.8; transform: scale(1) } 100% { opacity: 0; transform: scale(3.2) } }
@keyframes se-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
@keyframes se-stamp { 0% { opacity: 0; transform: rotate(-9deg) scale(1.7) } 55% { opacity: 0.85; transform: rotate(-9deg) scale(0.97) } 100% { opacity: 0.8; transform: rotate(-9deg) scale(1) } }
@media (prefers-reduced-motion: reduce) { .se-m { animation: none !important; } }
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
const EASE_IO = 'cubic-bezier(0.45, 0, 0.25, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

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

const noise = (size: number, freq: string, matrix: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='${matrix}'/></filter><rect width='${size}' height='${size}' filter='url(#n)'/></svg>`,
  )}")`;

const GRAIN = noise(220, '0.85', '0 0 0 0 0.24 0 0 0 0 0.15 0 0 0 0 0.08 0 0 0 1.7 -0.62');
const MOTTLE = noise(640, '0.006', '0 0 0 0 0.45 0 0 0 0 0.32 0 0 0 0 0.16 0 0 0 1.4 -0.45');

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontStretch: '125%',
};

const LABEL: CSSProperties = {
  ...DISPLAY,
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const svgDisplay = (size: number, weight = 700, extra?: CSSProperties): CSSProperties => ({
  fontFamily: 'var(--osd-font-display)',
  fontStretch: '125%',
  fontWeight: weight,
  fontSize: size,
  ...extra,
});

const svgMono = (size: number, extra?: CSSProperties): CSSProperties => ({
  fontFamily: 'var(--osd-font-body)',
  fontSize: size,
  ...extra,
});

const KNOCK: CSSProperties = {
  paintOrder: 'stroke',
  stroke: BG,
  strokeWidth: 9,
  strokeLinejoin: 'round',
};

const two = (n: number) => String(n).padStart(2, '0');

const useUid = () => `se${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

const anim = (live: boolean, value: string): CSSProperties => (live ? { animation: value } : {});

const drawStyle = (live: boolean, delay: number, dur = 900): CSSProperties =>
  live
    ? {
        strokeDasharray: 1,
        animation: `se-draw ${dur}ms ${EASE_IO} ${delay}ms both, se-fillin ${Math.round(dur * 0.6)}ms ${EASE_OUT} ${delay + Math.round(dur * 0.5)}ms both`,
      }
    : {};

const rectD = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y} H${x + w} V${y + h} H${x} Z`;

const starD = (r: number, inner = 0.42) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    d += `${i === 0 ? 'M' : 'L'}${(Math.cos(a) * rr).toFixed(2)} ${(Math.sin(a) * rr).toFixed(2)} `;
  }
  return `${d}Z`;
};

const curveD = (pts: [number, number][]) => {
  const n = pts.length;
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    m.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = a * a + b * b;
    if (h > 9) {
      const k = 3 / Math.sqrt(h);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = (x1 - x0) / 3;
    d += ` C${(x0 + dx).toFixed(1)} ${(y0 + t[i] * dx).toFixed(1)} ${(x1 - dx).toFixed(1)} ${(y1 - t[i + 1] * dx).toFixed(1)} ${x1} ${y1}`;
  }
  return d;
};

const PaperTexture = () => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: MOTTLE,
        backgroundSize: '640px 640px',
        opacity: 0.16,
        mixBlendMode: 'multiply',
        zIndex: 20,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: GRAIN,
        backgroundSize: '220px 220px',
        opacity: 0.32,
        mixBlendMode: 'multiply',
        zIndex: 20,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 75% 70% at 50% 48%, rgba(120,78,36,0) 62%, rgba(120,78,36,0.13) 100%)',
        zIndex: 20,
      }}
    />
  </>
);

const TopBand = () => (
  <>
    <div
      style={abs(0, 46, {
        width: 1560,
        height: 40,
        clipPath: 'polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%)',
      })}
    >
      <div style={{ height: 7, background: MUSTARD }} />
      <div style={{ height: 4 }} />
      <div style={{ height: 7, background: ACCENT }} />
      <div style={{ height: 4 }} />
      <div style={{ height: 7, background: RUST }} />
      <div style={{ height: 4 }} />
      <div style={{ height: 7, background: BROWN }} />
    </div>
    <div
      style={abs(1560, 50, {
        width: 240,
        textAlign: 'right',
        ...DISPLAY,
        fontWeight: 800,
        fontSize: 26,
        lineHeight: 1,
        letterSpacing: '0.04em',
      })}
    >
      SELENE-4
    </div>
  </>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={abs(120, 984, {
        width: 1680,
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: `1.5px solid ${RULE}`,
        paddingTop: 14,
        fontSize: 19,
        color: MUTED,
        letterSpacing: '0.02em',
      })}
    >
      <span>MERIDIAN LUNAR SYSTEMS · PROGRAM INTERNAL</span>
      <span>MLS-S4-FRR-001 · REV C</span>
      <span>
        SHEET {two(current)} OF {two(total)}
      </span>
    </div>
  );
};

const Sheet = ({ children, chrome = true }: { children: ReactNode; chrome?: boolean }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: BG,
      color: INK,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {chrome && <TopBand />}
    {children}
    {chrome && <Footer />}
    <PaperTexture />
  </div>
);

const Header = ({
  n,
  kicker,
  title,
  aside,
}: {
  n: string;
  kicker: string;
  title: ReactNode;
  aside?: ReactNode;
}) => (
  <>
    <div style={abs(120, 128, { ...LABEL, color: ACCENT })}>
      {n} — {kicker}
    </div>
    <h2
      style={abs(116, 160, {
        ...DISPLAY,
        fontWeight: 700,
        fontSize: 62,
        lineHeight: 1.08,
        letterSpacing: '-0.01em',
        margin: 0,
        whiteSpace: 'nowrap',
      })}
    >
      {title}
    </h2>
    {aside && (
      <div
        style={abs(1300, 132, {
          width: 500,
          textAlign: 'right',
          fontSize: 22,
          lineHeight: 1.45,
          color: MUTED,
        })}
      >
        {aside}
      </div>
    )}
  </>
);

const Lamp = ({
  size = 34,
  color = LAMP_GO,
  live,
  delay = 0,
  bezel = BROWN,
}: {
  size?: number;
  color?: string;
  live: boolean;
  delay?: number;
  bezel?: string;
}) => (
  <div
    style={{
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: '50%',
      background: `radial-gradient(circle at 40% 36%, #4A4326 0%, #1F1B0E 100%)`,
      boxShadow: `0 0 0 ${Math.round(size * 0.13)}px ${bezel}, inset 0 2px 4px rgba(0,0,0,0.6)`,
    }}
  >
    <div
      className="se-m"
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: `radial-gradient(circle at 38% 32%, #FFF8DA 0%, ${color} 34%, ${color} 68%, color-mix(in srgb, ${color} 62%, #000) 100%)`,
        boxShadow: `0 0 ${Math.round(size * 0.45)}px ${color}, 0 0 ${size}px color-mix(in srgb, ${color} 40%, transparent)`,
        ...anim(live, `se-lamp 620ms linear ${delay}ms both`),
      }}
    />
  </div>
);

const Patch = ({ size }: { size: number }) => {
  const uid = useUid();
  const top = `${uid}top`;
  const bot = `${uid}bot`;
  const clip = `${uid}clip`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="-300 -300 600 600"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <path id={top} d="M -222 0 A 222 222 0 0 1 222 0" />
        <path id={bot} d="M -252 0 A 252 252 0 0 0 252 0" />
        <clipPath id={clip}>
          <circle r="200" />
        </clipPath>
      </defs>
      <circle r="299" fill={BROWN} />
      <circle r="290" style={{ fill: BG }} />
      <circle r="283" fill={RUST} />
      <circle r="207" fill={MUSTARD} />
      <g clipPath={`url(#${clip})`}>
        <circle r="200" fill={SPACE} />
        <circle cx="-150" cy="-30" r="2.4" fill={SHEET} />
        <circle cx="-60" cy="-160" r="2" fill={SHEET} />
        <circle cx="20" cy="-120" r="1.6" fill={SHEET} />
        <circle cx="110" cy="-150" r="2.6" fill={SHEET} />
        <circle cx="150" cy="-60" r="1.8" fill={SHEET} />
        <circle cx="-30" cy="-60" r="1.6" fill={SHEET} />
        <circle cx="170" cy="40" r="2" fill={SHEET} />
        <circle cx="-170" cy="60" r="1.6" fill={SHEET} />
        <circle cx="80" cy="-40" r="1.4" fill={SHEET} />
        <path d={starD(9, 0.3)} transform="translate(60 -170)" fill={PALE_MUSTARD} />
        <path d={starD(7, 0.3)} transform="translate(-130 -130)" fill={PALE_MUSTARD} />
        <path
          d="M -230 120 C -170 -40, 40 -150, 196 -60"
          fill="none"
          stroke={MUSTARD}
          strokeWidth="11"
        />
        <path
          d="M -230 136 C -170 -24, 40 -134, 196 -44"
          fill="none"
          stroke="#D4601C"
          strokeWidth="11"
        />
        <path
          d="M -230 152 C -170 -8, 40 -118, 196 -28"
          fill="none"
          stroke={RUST}
          strokeWidth="11"
        />
        <circle cx="-104" cy="-92" r="34" fill="#7A5634" />
        <path d="M-104 -126 A34 34 0 0 0 -104 -58 A20 34 0 0 1 -104 -126 Z" fill={MUSTARD} />
        <circle cx="0" cy="520" r="380" fill="#E7DABD" />
        <ellipse cx="-90" cy="176" rx="34" ry="7" fill="none" stroke="#B9A47E" strokeWidth="3" />
        <ellipse cx="120" cy="188" rx="44" ry="9" fill="none" stroke="#B9A47E" strokeWidth="3" />
        <ellipse cx="-10" cy="226" rx="56" ry="12" fill="none" stroke="#B9A47E" strokeWidth="3" />
        <path d="M60 104 V140" stroke={MUSTARD} strokeWidth="3" strokeDasharray="5 6" />
        <g transform="translate(60 52) scale(1.5)">
          <path d="M-6 20 L6 20 L0 38 Z" fill="#D4601C" />
          <path d="M-4 10 L4 10 L8 20 L-8 20 Z" fill={MUSTARD} />
          <path d="M-12 8 L-24 26 M12 8 L24 26" stroke={SHEET} strokeWidth="2.4" />
          <path d="M-29 26 H-19 M19 26 H29" stroke={SHEET} strokeWidth="2.4" />
          <path d={rectD(-14, -8, 28, 18)} fill={SHEET} />
          <path d={rectD(-8, -16, 16, 8)} fill={MUSTARD} />
          <path d={rectD(-25, -14, 8, 22)} fill={PALE_MUSTARD} />
          <path d="M-17 -3 H-14" stroke={SHEET} strokeWidth="2" />
        </g>
      </g>
      <circle r="200" fill="none" stroke={BROWN} strokeWidth="3" />
      <text style={svgDisplay(46, 800, { letterSpacing: 10, fill: SHEET })}>
        <textPath href={`#${top}`} startOffset="50%" textAnchor="middle">
          SELENE-4
        </textPath>
      </text>
      <text style={svgDisplay(23, 700, { letterSpacing: 4, fill: SHEET })}>
        <textPath href={`#${bot}`} startOffset="50%" textAnchor="middle">
          MERIDIAN LUNAR · MMXXVI
        </textPath>
      </text>
      <path d={starD(11)} transform="translate(-244 6)" fill={MUSTARD} />
      <path d={starD(11)} transform="translate(244 6)" fill={MUSTARD} />
    </svg>
  );
};

const SweepStripe = ({
  r,
  color,
  delay,
  live,
  cx,
  cy,
}: {
  r: number;
  color: string;
  delay: number;
  live: boolean;
  cx: number;
  cy: number;
}) => (
  <path
    d={`M-20 ${cy - r} H${cx} A${r} ${r} 0 0 1 ${cx + r} ${cy} V1100`}
    pathLength={1}
    className="se-m"
    style={{
      fill: 'none',
      stroke: color,
      strokeWidth: 22,
      ...(live
        ? { strokeDasharray: 1, animation: `se-draw 1500ms ${EASE_IO} ${delay}ms both` }
        : {}),
    }}
  />
);

const MetaItem = ({ x, label, children }: { x: number; label: string; children: ReactNode }) => (
  <div style={abs(x, 896)}>
    <div style={{ ...LABEL, fontSize: 18, color: MUTED }}>{label}</div>
    <div style={{ fontSize: 26, marginTop: 10, lineHeight: 1.2 }}>{children}</div>
  </div>
);

const Cover: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet chrome={false}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={abs(0, 0)} aria-hidden="true">
        <SweepStripe r={250} color={MUSTARD} delay={100} live={live} cx={1440} cy={1010} />
        <SweepStripe r={222} color="#D4601C" delay={190} live={live} cx={1440} cy={1010} />
        <SweepStripe r={194} color={RUST} delay={280} live={live} cx={1440} cy={1010} />
        <SweepStripe r={166} color={BROWN} delay={370} live={live} cx={1440} cy={1010} />
      </svg>
      <div style={abs(120, 120, { fontSize: 24, letterSpacing: '0.06em', color: MUTED })}>
        MERIDIAN LUNAR SYSTEMS — FLIGHT READINESS REVIEW
      </div>
      <h1
        style={abs(112, 186, {
          ...DISPLAY,
          margin: 0,
          fontWeight: 800,
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 0.92,
          letterSpacing: '-0.01em',
          textShadow: '5px 3px 0 rgba(217,160,34,0.5)',
        })}
      >
        SELENE-4
      </h1>
      <div
        style={abs(120, 384, {
          ...DISPLAY,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.1,
          color: ACCENT,
        })}
      >
        Flight Readiness Briefing
      </div>
      <div style={abs(120, 476, { fontSize: 'var(--osd-size-body)', lineHeight: 1.5 })}>
        KESTREL lander to the lunar south pole.
        <br />
        Launch 04 Nov 2026 · Perseus 2 · LC-2.
      </div>
      <div
        className="se-m"
        style={abs(1250, 110, {
          width: 520,
          height: 520,
          ...anim(live, `se-rise 900ms ${EASE_OUT} 300ms both`),
        })}
      >
        <Patch size={520} />
      </div>
      <MetaItem x={120} label="Document">
        MLS-S4-FRR-001 Rev C
      </MetaItem>
      <MetaItem x={560} label="Briefing">
        12 Oct 2026 · 12:00 UTC
      </MetaItem>
      <MetaItem x={1000} label="Presented by">
        R. Okafor, Mission Director
      </MetaItem>
    </Sheet>
  );
};
Cover.transition = settle;

const MemoLine = ({ k, children }: { k: string; children: ReactNode }) => (
  <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.5 }}>
    <span style={{ width: 130, fontWeight: 700, flexShrink: 0 }}>{k}</span>
    <span>{children}</span>
  </div>
);

const MemoStat = ({ value, unit, label }: { value: string; unit: string; label: string }) => (
  <div style={{ borderTop: `3px solid ${INK}`, paddingTop: 16 }}>
    <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 64, lineHeight: 1 }}>
      {value}
      <span style={{ fontSize: 30, fontWeight: 700, marginLeft: 12, color: ACCENT }}>{unit}</span>
    </div>
    <div style={{ fontSize: 24, marginTop: 10, color: MUTED }}>{label}</div>
  </div>
);

const Memo: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet>
      <Header n="01" kicker="Purpose" title="One decision on the table." />
      <div
        style={abs(120, 300, {
          width: 1040,
          height: 620,
          boxSizing: 'border-box',
          padding: '44px 52px',
          background: SHEET,
          transform: 'rotate(-0.6deg)',
          boxShadow: '0 2px 0 rgba(58,36,20,0.08), 0 18px 40px -18px rgba(58,36,20,0.35)',
          borderLeft: `10px solid ${ACCENT}`,
        })}
      >
        <div style={{ ...LABEL, fontSize: 18, color: MUTED, marginBottom: 18 }}>
          Memorandum · MLS-S4-FRR-001
        </div>
        <MemoLine k="TO:">SELENE-4 Flight Readiness Board</MemoLine>
        <MemoLine k="FROM:">R. Okafor, Mission Director</MemoLine>
        <MemoLine k="DATE:">12 October 2026</MemoLine>
        <MemoLine k="SUBJ:">Launch readiness, 04 November 2026</MemoLine>
        <div style={{ height: 2, background: INK, opacity: 0.5, margin: '22px 0 24px' }} />
        <p style={{ margin: 0, fontSize: 'var(--osd-size-body)', lineHeight: 1.5 }}>
          The board is asked for one decision: commit{' '}
          <span style={{ whiteSpace: 'nowrap' }}>SELENE-4</span> to launch on 04 November. All
          twelve consoles have closed their items. Two risks stay open, carried with mitigations,
          not waivers.
        </p>
        <div style={{ fontSize: 28, marginTop: 22 }}>
          — R.O.
          <span
            className="se-m"
            style={{
              display: 'inline-block',
              width: 16,
              height: 30,
              marginLeft: 10,
              verticalAlign: 'text-bottom',
              background: INK,
              ...anim(live, 'se-blink 1.1s steps(1) 1.4s infinite'),
            }}
          />
        </div>
        <div
          className="se-m"
          style={{
            position: 'absolute',
            right: 56,
            bottom: 52,
            padding: '10px 22px',
            border: `5px solid ${RUST}`,
            color: RUST,
            ...DISPLAY,
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: '0.08em',
            transform: 'rotate(-9deg)',
            opacity: 0.8,
            mixBlendMode: 'multiply',
            ...anim(live, `se-stamp 520ms ${EASE_OUT} 700ms both`),
          }}
        >
          FOR DECISION
        </div>
      </div>
      <div
        style={abs(1260, 300, {
          width: 540,
          display: 'flex',
          flexDirection: 'column',
          gap: 34,
        })}
      >
        <MemoStat value="1,840" unit="kg" label="KESTREL wet mass at separation" />
        <MemoStat value="4.6" unit="days" label="Earth–Moon transfer, direct" />
        <MemoStat value="11.5" unit="min" label="Powered descent to touchdown" />
        <MemoStat value="10" unit="days" label="Surface operations, minimum" />
      </div>
    </Sheet>
  );
};

const Objective = ({
  n,
  tier,
  title,
  detail,
  metric,
}: {
  n: string;
  tier: 'Primary' | 'Secondary';
  title: string;
  detail: string;
  metric: string;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 40,
      height: 150,
      borderTop: `2px solid ${RULE}`,
    }}
  >
    <div
      style={{
        ...DISPLAY,
        width: 120,
        fontWeight: 800,
        fontSize: 64,
        color: tier === 'Primary' ? ACCENT : MUSTARD,
        lineHeight: 1,
      }}
    >
      {n}
    </div>
    <div style={{ flex: 1 }}>
      <div
        style={{
          ...LABEL,
          fontSize: 18,
          display: 'inline-block',
          padding: '3px 10px',
          border: `2px solid ${INK}`,
          background: tier === 'Primary' ? INK : 'transparent',
          color: tier === 'Primary' ? BG : INK,
        }}
      >
        {tier}
      </div>
      <div style={{ ...DISPLAY, fontWeight: 700, fontSize: 34, marginTop: 10, lineHeight: 1.15 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, marginTop: 6, lineHeight: 1.3, color: MUTED }}>{detail}</div>
    </div>
    <div style={{ width: 300, textAlign: 'right' }}>
      <div style={{ ...LABEL, fontSize: 18, color: MUTED }}>Min. success</div>
      <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 52, lineHeight: 1.1, marginTop: 4 }}>
        {metric}
      </div>
    </div>
  </div>
);

const Objectives: Page = () => (
  <Sheet>
    <Header n="02" kicker="Objectives" title="What success looks like." />
    <div style={abs(120, 300, { width: 1680, borderBottom: `2px solid ${RULE}` })}>
      <Steps>
        <Step>
          <Objective
            n="01"
            tier="Primary"
            title="Precision soft landing at Site 04"
            detail="Touchdown within 100 m of target, below 2 m/s vertical."
            metric="≤ 100 m"
          />
        </Step>
        <Step>
          <Objective
            n="02"
            tier="Primary"
            title="Deliver and power seven payloads"
            detail="412 kg on the surface, powered through ten Earth days."
            metric="10 days"
          />
        </Step>
        <Step>
          <Objective
            n="03"
            tier="Secondary"
            title="Measure ice in the top metre"
            detail="PRISM drill samples regolith in 10 cm steps to 1 m depth."
            metric="1.0 m"
          />
        </Step>
        <Step>
          <Objective
            n="04"
            tier="Secondary"
            title="Drive PIKA into permanent shadow"
            detail="A 400 m traverse from the ramp to the de Gerlache rim PSR."
            metric="400 m"
          />
        </Step>
      </Steps>
    </div>
  </Sheet>
);

const ConsoleCard = ({
  pos,
  call,
  duty,
  lead,
  staff,
  stripe,
  live,
  delay,
}: {
  pos: string;
  call: string;
  duty: string;
  lead: string;
  staff: string;
  stripe: string;
  live: boolean;
  delay: number;
}) => (
  <div
    className="se-m"
    style={{
      position: 'relative',
      height: 290,
      boxSizing: 'border-box',
      padding: '30px 30px 26px',
      background: SHEET,
      borderTop: `10px solid ${stripe}`,
      boxShadow: `inset 0 0 0 2px ${RULE}`,
      ...anim(live, `se-rise 600ms ${EASE_OUT} ${delay}ms both`),
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 20, color: MUTED, letterSpacing: '0.06em' }}>{pos}</span>
      <Lamp size={22} live={live} delay={delay + 500} />
    </div>
    <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 44, lineHeight: 1.1, marginTop: 14 }}>
      {call}
    </div>
    <div style={{ fontSize: 22, color: MUTED, marginTop: 4 }}>{duty}</div>
    <div style={{ height: 2, background: RULE, margin: '22px 0 18px' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 28, fontWeight: 700 }}>{lead}</span>
      <span style={{ fontSize: 20, color: MUTED }}>{staff}</span>
    </div>
  </div>
);

const Teams: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet>
      <Header
        n="03"
        kicker="Flight teams"
        title="Eight consoles, one room."
        aside={
          <>
            Mission Operations Center, Tucson AZ
            <br />3 shifts · 112 staff on rotation
          </>
        }
      />
      <div
        style={abs(120, 300, {
          width: 1680,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 36,
        })}
      >
        <ConsoleCard
          pos="C-01"
          call="FLIGHT"
          duty="Flight Director"
          lead="T. Ibarra"
          staff="9 staff"
          stripe={ACCENT}
          live={live}
          delay={0}
        />
        <ConsoleCard
          pos="C-02"
          call="FDO"
          duty="Flight Dynamics"
          lead="K. Nakamura"
          staff="14 staff"
          stripe={RUST}
          live={live}
          delay={90}
        />
        <ConsoleCard
          pos="C-03"
          call="GNC"
          duty="Guidance, Nav & Control"
          lead="S. Adeyemi"
          staff="18 staff"
          stripe={MUSTARD}
          live={live}
          delay={180}
        />
        <ConsoleCard
          pos="C-04"
          call="PROP"
          duty="Propulsion"
          lead="L. Varga"
          staff="12 staff"
          stripe={BROWN}
          live={live}
          delay={270}
        />
        <ConsoleCard
          pos="C-05"
          call="POWER"
          duty="Power & Thermal"
          lead="M. Duarte"
          staff="15 staff"
          stripe={MUSTARD}
          live={live}
          delay={360}
        />
        <ConsoleCard
          pos="C-06"
          call="COMM"
          duty="Comms & Ground Stations"
          lead="J. Whitfield"
          staff="16 staff"
          stripe={BROWN}
          live={live}
          delay={450}
        />
        <ConsoleCard
          pos="C-07"
          call="PAYLOAD"
          duty="Payload Operations"
          lead="A. Rahimi"
          staff="17 staff"
          stripe={ACCENT}
          live={live}
          delay={540}
        />
        <ConsoleCard
          pos="C-08"
          call="SURFACE"
          duty="Surface & Rover Ops"
          lead="E. Lindqvist"
          staff="11 staff"
          stripe={RUST}
          live={live}
          delay={630}
        />
      </div>
    </Sheet>
  );
};

const Callout = ({
  x,
  y,
  toY,
  title,
  detail,
  align = 'left',
  live,
  delay,
}: {
  x: number;
  y: number;
  toY: number;
  title: string;
  detail: string;
  align?: 'left' | 'right';
  live: boolean;
  delay: number;
}) => (
  <g className="se-m" style={anim(live, `se-fade 500ms ${EASE_OUT} ${delay}ms both`)}>
    <path d={`M${x} ${y - 30} V${toY}`} style={{ stroke: INK, strokeWidth: 2 }} />
    <circle cx={x} cy={toY} r={5} style={{ fill: ACCENT }} />
    <text
      x={align === 'left' ? x + 14 : x - 14}
      y={y - 10}
      textAnchor={align === 'left' ? 'start' : 'end'}
      style={svgDisplay(20, 700, { letterSpacing: 3, fill: ACCENT })}
    >
      {title}
    </text>
    <text
      x={align === 'left' ? x + 14 : x - 14}
      y={y + 22}
      textAnchor={align === 'left' ? 'start' : 'end'}
      style={svgMono(24, { fill: INK })}
    >
      {detail}
    </text>
  </g>
);

const DimSeg = ({
  x1,
  x2,
  y,
  label,
  live,
  delay,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  live: boolean;
  delay: number;
}) => (
  <g>
    <path
      d={`M${x1} ${y} H${x2}`}
      pathLength={1}
      className="se-m"
      style={{ stroke: INK, strokeWidth: 2, fill: 'none', ...drawStyle(live, delay, 600) }}
    />
    <path
      d={`M${x1} ${y - 12} V${y + 12} M${x2} ${y - 12} V${y + 12}`}
      style={{ stroke: INK, strokeWidth: 2 }}
    />
    <text
      x={(x1 + x2) / 2}
      y={y - 12}
      textAnchor="middle"
      className="se-m"
      style={{
        ...svgMono(22, { fill: INK, fontWeight: 700 }),
        ...anim(live, `se-fade 400ms ${EASE_OUT} ${delay + 400}ms both`),
      }}
    >
      {label}
    </text>
  </g>
);

const VehicleStat = ({ value, label }: { value: string; label: string }) => (
  <div style={{ borderLeft: `6px solid ${ACCENT}`, paddingLeft: 22 }}>
    <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 56, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 22, color: MUTED, marginTop: 10 }}>{label}</div>
  </div>
);

const Vehicle: Page = () => {
  const live = useIsActivePage();
  const C = 590;
  return (
    <Sheet>
      <Header
        n="04"
        kicker="Launch vehicle"
        title="Perseus 2, block B."
        aside={
          <>
            Side elevation, nose to the right
            <br />
            Scale 1 : 140 · flight 12 of the type
          </>
        }
      />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={abs(0, 0)} aria-hidden="true">
        <g className="se-m" style={anim(live, `se-rise 700ms ${EASE_OUT} 0ms both`)}>
          <path
            d={`M193 ${C - 40} L148 ${C - 52} Q142 ${C - 34} 148 ${C - 16} L193 ${C - 24} Z`}
            style={{ fill: PANEL, stroke: INK, strokeWidth: 2.5 }}
          />
          <path
            d={`M193 ${C - 9} L146 ${C - 20} Q140 ${C} 146 ${C + 20} L193 ${C + 9} Z`}
            style={{ fill: PANEL, stroke: INK, strokeWidth: 2.5 }}
          />
          <path
            d={`M193 ${C + 24} L148 ${C + 16} Q142 ${C + 34} 148 ${C + 52} L193 ${C + 40} Z`}
            style={{ fill: PANEL, stroke: INK, strokeWidth: 2.5 }}
          />
          <path
            d={rectD(193, C - 49, 901, 98)}
            style={{ fill: SHEET, stroke: INK, strokeWidth: 3 }}
          />
          <path d={rectD(193, C - 49, 30, 49)} style={{ fill: INK }} />
          <path d={rectD(223, C, 30, 49)} style={{ fill: INK }} />
          <path d={rectD(193, C, 30, 49)} style={{ fill: 'none', stroke: INK, strokeWidth: 3 }} />
          <path d={`M270 ${C + 20} H1070`} style={{ stroke: MUSTARD, strokeWidth: 7 }} />
          <path d={`M270 ${C + 29} H1070`} style={{ stroke: ACCENT, strokeWidth: 7 }} />
          <path d={`M270 ${C + 38} H1070`} style={{ stroke: RUST, strokeWidth: 7 }} />
          <text x={300} y={C + 6} style={svgDisplay(48, 800, { fill: RUST, letterSpacing: 8 })}>
            PERSEUS
          </text>
          <path
            d={`M760 ${C - 49} V${C + 49} M960 ${C - 49} V${C + 49}`}
            style={{ stroke: INK, strokeWidth: 1.5, opacity: 0.5 }}
          />
          <path
            d={rectD(1094, C - 49, 106, 98)}
            style={{ fill: BROWN, stroke: INK, strokeWidth: 3 }}
          />
          <path
            d={`M1120 ${C - 49} V${C + 49} M1147 ${C - 49} V${C + 49} M1174 ${C - 49} V${C + 49}`}
            style={{ stroke: SHEET, strokeWidth: 1.5, opacity: 0.4 }}
          />
          <path
            d={rectD(1200, C - 49, 245, 98)}
            style={{ fill: SHEET, stroke: INK, strokeWidth: 3 }}
          />
          <path d={rectD(1380, C - 49, 24, 98)} style={{ fill: MUSTARD }} />
          <text x={1222} y={C + 10} style={svgDisplay(26, 800, { fill: INK, letterSpacing: 4 })}>
            S-II
          </text>
          <path
            d={`M1445 ${C - 49} L1465 ${C - 66} H1600 C1690 ${C - 66} 1750 ${C - 30} 1778 ${C} C1750 ${C + 30} 1690 ${C + 66} 1600 ${C + 66} H1465 L1445 ${C + 49} Z`}
            style={{ fill: SHEET, stroke: INK, strokeWidth: 3 }}
          />
          <path
            d={rectD(1490, C - 50, 180, 100)}
            style={{ fill: PANEL, stroke: INK, strokeWidth: 2, strokeDasharray: '8 6' }}
          />
          <path
            d={rectD(1556, C - 30, 70, 60)}
            style={{ fill: SHEET, stroke: INK, strokeWidth: 2.5 }}
          />
          <path
            d={`M1556 ${C - 18} L1520 ${C - 10} L1520 ${C + 10} L1556 ${C + 18} Z`}
            style={{ fill: MUSTARD, stroke: INK, strokeWidth: 2 }}
          />
          <path
            d={`M1626 ${C - 24} L1652 ${C - 40} M1626 ${C + 24} L1652 ${C + 40}`}
            style={{ stroke: INK, strokeWidth: 2.5 }}
          />
          <path
            d={rectD(1626, C - 14, 18, 28)}
            style={{ fill: MUSTARD, stroke: INK, strokeWidth: 2 }}
          />
        </g>
        <Callout
          x={640}
          y={440}
          toY={C - 49}
          title="STAGE 1"
          detail="7 × VR-1 · 4,120 kN"
          live={live}
          delay={500}
        />
        <Callout
          x={1147}
          y={290}
          toY={C - 49}
          title="INTERSTAGE"
          detail="Separation ring"
          live={live}
          delay={650}
        />
        <Callout
          x={1322}
          y={440}
          toY={C - 49}
          title="STAGE 2"
          detail="1 × VR-2 Vac · 118 kN"
          live={live}
          delay={800}
        />
        <Callout
          x={1700}
          y={362}
          toY={C - 50}
          title="FAIRING + KESTREL"
          detail="5.0 m Ø · lander 1,840 kg"
          align="right"
          live={live}
          delay={950}
        />
        <path
          d={`M140 ${C + 60} V${C + 136} M1778 ${C} V${C + 196}`}
          style={{ stroke: INK, strokeWidth: 1, strokeDasharray: '4 5', opacity: 0.6 }}
        />
        <DimSeg x1={140} x2={1094} y={700} label="36.0 m" live={live} delay={900} />
        <DimSeg x1={1094} x2={1200} y={700} label="4.0" live={live} delay={1100} />
        <DimSeg x1={1200} x2={1445} y={700} label="9.2 m" live={live} delay={1250} />
        <DimSeg x1={1445} x2={1778} y={700} label="12.6 m" live={live} delay={1400} />
        <DimSeg x1={140} x2={1778} y={770} label="61.8 m overall" live={live} delay={1600} />
      </svg>
      <div
        style={abs(120, 840, {
          width: 1680,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 40,
        })}
      >
        <VehicleStat value="412 t" label="Liftoff mass" />
        <VehicleStat value="8.6 t" label="Payload to LEO" />
        <VehicleStat value="2.3 t" label="Payload to TLI" />
        <VehicleStat value="11 / 11" label="Flights, all successful" />
      </div>
    </Sheet>
  );
};

const Bubble = ({
  n,
  bx,
  by,
  tx,
  ty,
  live,
  delay,
}: {
  n: number;
  bx: number;
  by: number;
  tx: number;
  ty: number;
  live: boolean;
  delay: number;
}) => (
  <g className="se-m" style={anim(live, `se-fade 400ms ${EASE_OUT} ${delay}ms both`)}>
    <path d={`M${tx} ${ty} L${bx} ${by}`} style={{ stroke: ACCENT, strokeWidth: 2 }} />
    <circle cx={tx} cy={ty} r={4} style={{ fill: ACCENT }} />
    <circle cx={bx} cy={by} r={19} style={{ fill: ACCENT }} />
    <text x={bx} y={by + 7} textAnchor="middle" style={svgDisplay(20, 800, { fill: SHEET })}>
      {n}
    </text>
  </g>
);

const Ink = ({
  d,
  live,
  delay,
  fill = 'none',
  w = 3,
  dur = 900,
}: {
  d: string;
  live: boolean;
  delay: number;
  fill?: string;
  w?: number;
  dur?: number;
}) => (
  <path
    d={d}
    pathLength={1}
    className="se-m"
    style={{
      fill,
      stroke: INK,
      strokeWidth: w,
      strokeLinejoin: 'round',
      strokeLinecap: 'round',
      ...drawStyle(live, delay, dur),
    }}
  />
);

const Hidden = ({ d, live, delay }: { d: string; live: boolean; delay: number }) => (
  <path
    d={d}
    className="se-m"
    style={{
      fill: 'none',
      stroke: INK,
      strokeWidth: 2,
      strokeDasharray: '9 7',
      opacity: 0.7,
      ...anim(live, `se-fade 500ms ${EASE_OUT} ${delay}ms both`),
    }}
  />
);

const LegendItem = ({ n, name, spec }: { n: number; name: string; spec: string }) => (
  <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
    <div
      style={{
        ...DISPLAY,
        width: 38,
        height: 38,
        flexShrink: 0,
        borderRadius: '50%',
        background: ACCENT,
        color: SHEET,
        fontWeight: 800,
        fontSize: 19,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ ...LABEL, fontSize: 19, letterSpacing: '0.12em' }}>{name}</div>
      <div style={{ fontSize: 26, color: MUTED, marginTop: 4 }}>{spec}</div>
    </div>
  </div>
);

const Lander: Page = () => {
  const live = useIsActivePage();
  const uid = useUid();
  return (
    <Sheet>
      <Header n="05" kicker="The lander" title="KESTREL, front elevation." />
      <svg
        width={1000}
        height={700}
        viewBox="0 0 1000 700"
        style={abs(120, 262)}
        aria-hidden="true"
      >
        <defs>
          <pattern id={`${uid}dots`} width="25" height="25" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(58,36,20,0.16)" />
          </pattern>
        </defs>
        <rect x="0" y="40" width="1000" height="560" fill={`url(#${uid}dots)`} />
        <path d="M30 600 H970" style={{ stroke: INK, strokeWidth: 3 }} />
        <path
          d={Array.from({ length: 47 }, (_, i) => `M${40 + i * 20} 602 l-12 14`).join(' ')}
          style={{ stroke: INK, strokeWidth: 1.5, opacity: 0.5 }}
        />
        <Ink d={rectD(176, 170, 120, 260)} fill={PALE_MUSTARD} live={live} delay={500} />
        <path
          d="M206 170 V430 M236 170 V430 M266 170 V430 M176 202.5 H296 M176 235 H296 M176 267.5 H296 M176 300 H296 M176 332.5 H296 M176 365 H296 M176 397.5 H296"
          className="se-m"
          style={{
            stroke: INK,
            strokeWidth: 1.2,
            opacity: 0.55,
            ...anim(live, `se-fade 500ms ${EASE_OUT} 1200ms both`),
          }}
        />
        <Ink d="M296 350 H350" w={6} live={live} delay={400} dur={300} />
        <Ink d="M350 410 L290 478" w={7} live={live} delay={300} dur={400} />
        <Ink d="M290 478 L196 584 M372 470 L196 584" live={live} delay={500} dur={500} />
        <Ink d="M650 410 L710 478" w={7} live={live} delay={300} dur={400} />
        <Ink d="M710 478 L804 584 M628 470 L804 584" live={live} delay={500} dur={500} />
        <Ink
          d="M150 590 A40 9 0 1 0 230 590 A40 9 0 1 0 150 590 Z"
          fill={PANEL}
          live={live}
          delay={900}
          dur={400}
        />
        <Ink
          d="M770 590 A40 9 0 1 0 850 590 A40 9 0 1 0 770 590 Z"
          fill={PANEL}
          live={live}
          delay={900}
          dur={400}
        />
        <Ink
          d="M370 300 H630 L650 320 V450 L630 470 H370 L350 450 V320 Z"
          fill={SHEET}
          live={live}
          delay={0}
          dur={1000}
        />
        <g className="se-m" style={anim(live, `se-fade 500ms ${EASE_OUT} 900ms both`)}>
          <path d="M350 336 H650" style={{ stroke: MUSTARD, strokeWidth: 6 }} />
          <path d="M350 344 H650" style={{ stroke: ACCENT, strokeWidth: 6 }} />
          <path d="M350 352 H650" style={{ stroke: RUST, strokeWidth: 6 }} />
          <path
            d="M450 360 V470 M550 360 V470"
            style={{ stroke: INK, strokeWidth: 1.2, opacity: 0.5 }}
          />
          <path
            d="M346 312 L332 304 M346 312 L332 320 M654 312 L668 304 M654 312 L668 320"
            style={{ stroke: INK, strokeWidth: 2.5 }}
          />
        </g>
        <Hidden d="M482 395 A52 52 0 1 0 378 395 A52 52 0 1 0 482 395 Z" live={live} delay={1300} />
        <Hidden d="M622 395 A52 52 0 1 0 518 395 A52 52 0 1 0 622 395 Z" live={live} delay={1350} />
        <Hidden d="M600 300 V560" live={live} delay={1400} />
        <Ink d="M470 470 H530 L524 486 H476 Z" fill={PANEL} live={live} delay={600} dur={300} />
        <Ink
          d="M482 486 C480 516 466 536 452 556 L548 556 C534 536 520 516 518 486 Z"
          fill={PANEL}
          live={live}
          delay={700}
          dur={600}
        />
        <Ink d={rectD(388, 258, 80, 28)} fill={PANEL} live={live} delay={800} dur={400} />
        <Ink
          d="M393 292 A9 9 0 1 0 411 292 A9 9 0 1 0 393 292 Z M445 292 A9 9 0 1 0 463 292 A9 9 0 1 0 445 292 Z"
          fill={INK}
          live={live}
          delay={900}
          dur={300}
        />
        <Ink d="M456 258 V244 M450 244 H462 V236 H450 Z" live={live} delay={1000} dur={300} />
        <Ink d={rectD(480, 244, 80, 56)} fill={SHEET} live={live} delay={800} dur={400} />
        <Ink d={rectD(500, 222, 40, 22)} fill={MUSTARD} live={live} delay={900} dur={300} />
        <Ink
          d="M513 233 A7 7 0 1 0 527 233 A7 7 0 1 0 513 233 Z"
          fill={INK}
          live={live}
          delay={1000}
          dur={200}
        />
        <Ink d={rectD(592, 150, 16, 150)} fill={SHEET} live={live} delay={800} dur={500} />
        <Ink d={rectD(580, 124, 40, 28)} fill={MUSTARD} live={live} delay={1000} dur={300} />
        <Ink d="M370 300 V196" w={4} live={live} delay={800} dur={300} />
        <Ink d="M332 166 Q 360 214 410 190" w={5} live={live} delay={1000} dur={400} />
        <Ink d="M370 192 L350 158" w={2} live={live} delay={1100} dur={200} />
        <circle cx="350" cy="156" r="5" style={{ fill: INK }} />
        <g className="se-m" style={anim(live, `se-fade 600ms ${EASE_OUT} 1500ms both`)}>
          <path
            d="M628 124 H944 M860 600 H944"
            style={{ stroke: INK, strokeWidth: 1, strokeDasharray: '4 5', opacity: 0.7 }}
          />
          <path d="M930 128 V596" style={{ stroke: INK, strokeWidth: 2 }} />
          <path d="M930 124 l-7 16 h14 Z M930 600 l-7 -16 h14 Z" style={{ fill: INK }} />
          <text
            x={918}
            y={362}
            textAnchor="middle"
            transform="rotate(-90 918 362)"
            style={{ ...svgMono(22, { fill: INK, fontWeight: 700 }), ...KNOCK }}
          >
            3.92 m
          </text>
          <path
            d="M150 600 V662 M850 600 V662"
            style={{ stroke: INK, strokeWidth: 1, strokeDasharray: '4 5', opacity: 0.7 }}
          />
          <path d="M154 648 H846" style={{ stroke: INK, strokeWidth: 2 }} />
          <path d="M150 648 l16 -7 v14 Z M850 648 l-16 -7 v14 Z" style={{ fill: INK }} />
          <text
            x={500}
            y={636}
            textAnchor="middle"
            style={svgMono(22, { fill: INK, fontWeight: 700 })}
          >
            4.60 m footprint
          </text>
          <text x={0} y={694} style={svgMono(18, { fill: MUTED })}>
            DWG KS-100-A · FRONT ELEVATION · SCALE 1:40 · DIMS IN METRES
          </text>
        </g>
        <Bubble n={1} bx={650} by={545} tx={528} ty={530} live={live} delay={1700} />
        <Bubble n={2} bx={740} by={420} tx={600} ty={425} live={live} delay={1800} />
        <Bubble n={3} bx={110} by={140} tx={220} ty={240} live={live} delay={1900} />
        <Bubble n={4} bx={280} by={100} tx={350} ty={156} live={live} delay={2000} />
        <Bubble n={5} bx={730} by={170} tx={620} ty={140} live={live} delay={2100} />
        <Bubble n={6} bx={450} by={110} tx={430} ty={258} live={live} delay={2200} />
        <Bubble n={7} bx={110} by={540} tx={250} ty={522} live={live} delay={2300} />
        <Bubble n={8} bx={560} by={80} tx={526} ty={222} live={live} delay={2400} />
      </svg>
      <div
        style={abs(1190, 296, {
          width: 610,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        })}
      >
        <LegendItem n={1} name="Main engine" spec="VR-L, throttle 4.4–22 kN" />
        <LegendItem n={2} name="Propellant tanks" spec="MMH / MON-3 · 1,230 kg" />
        <LegendItem n={3} name="Vertical solar array" spec="1.6 kW at 1.5° sun" />
        <LegendItem n={4} name="High-gain antenna" spec="Ka-band, 20 Mbps to Earth" />
        <LegendItem n={5} name="PRISM drill" spec="Rotary-percussive, 1.0 m" />
        <LegendItem n={6} name="PIKA rover" spec="22 kg, egress by ramp" />
        <LegendItem n={7} name="Landing legs" spec="4 × crushable honeycomb" />
        <LegendItem n={8} name="Hazard LIDAR" spec="40 cm hazards from 250 m" />
      </div>
    </Sheet>
  );
};

const Trace = ({
  d,
  dash,
  color,
  w,
  live,
  delay,
  dur,
}: {
  d: string;
  dash?: string;
  color: string;
  w: number;
  live: boolean;
  delay: number;
  dur: number;
}) => {
  const uid = useUid();
  return (
    <g>
      <defs>
        <mask id={uid} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
          <path
            d={d}
            pathLength={1}
            className="se-m"
            style={{
              fill: 'none',
              stroke: '#fff',
              strokeWidth: w + 10,
              ...(live
                ? { strokeDasharray: 1, animation: `se-draw ${dur}ms ${EASE_IO} ${delay}ms both` }
                : {}),
            }}
          />
        </mask>
      </defs>
      <path
        d={d}
        mask={`url(#${uid})`}
        style={{
          fill: 'none',
          stroke: color,
          strokeWidth: w,
          strokeDasharray: dash,
          strokeLinecap: 'round',
        }}
      />
    </g>
  );
};

const Marker = ({
  x,
  y,
  live,
  delay,
  children,
}: {
  x: number;
  y: number;
  live: boolean;
  delay: number;
  children?: ReactNode;
}) => (
  <g className="se-m" style={anim(live, `se-fade 400ms ${EASE_OUT} ${delay}ms both`)}>
    <circle cx={x} cy={y} r={13} style={{ fill: BG, stroke: INK, strokeWidth: 3 }} />
    <circle cx={x} cy={y} r={6} style={{ fill: ACCENT }} />
    {children}
  </g>
);

const EventTile = ({
  t,
  title,
  detail,
  live,
  delay,
}: {
  t: string;
  title: string;
  detail: string;
  live: boolean;
  delay: number;
}) => (
  <div
    className="se-m"
    style={{
      borderTop: `4px solid ${INK}`,
      paddingTop: 14,
      ...anim(live, `se-rise 500ms ${EASE_OUT} ${delay}ms both`),
    }}
  >
    <div style={{ ...LABEL, color: ACCENT, fontSize: 20, letterSpacing: '0.1em' }}>{t}</div>
    <div style={{ ...DISPLAY, fontWeight: 700, fontSize: 30, marginTop: 6, lineHeight: 1.15 }}>
      {title}
    </div>
    <div style={{ fontSize: 22, color: MUTED, marginTop: 6 }}>{detail}</div>
  </div>
);

const Trajectory: Page = () => {
  const live = useIsActivePage();
  const lab = (size: number, extra?: CSSProperties) => ({
    ...svgDisplay(size, 700, { fill: INK, letterSpacing: 3, ...extra }),
    ...KNOCK,
  });
  const mono = (size: number, extra?: CSSProperties) => ({
    ...svgMono(size, { fill: MUTED, ...extra }),
    ...KNOCK,
  });
  return (
    <Sheet>
      <Header n="06" kicker="Flight profile" title="Four and a half days out." />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={abs(0, 0)} aria-hidden="true">
        <g className="se-m" style={anim(live, `se-fade 500ms ${EASE_OUT} 0ms both`)}>
          <path d="M360 318 H1540" style={{ stroke: INK, strokeWidth: 1.5 }} />
          <path d="M360 306 V330 M1540 306 V330" style={{ stroke: INK, strokeWidth: 1.5 }} />
          <text
            x={950}
            y={304}
            textAnchor="middle"
            style={svgMono(22, { fill: INK, fontWeight: 700 })}
          >
            384,400 km · 4.6 days coast
          </text>
        </g>
        <circle cx={360} cy={560} r={78} style={{ fill: SHEET, stroke: INK, strokeWidth: 3 }} />
        <g style={{ fill: 'none', stroke: INK, strokeWidth: 1.4, opacity: 0.55 }}>
          <ellipse cx={360} cy={560} rx={28} ry={78} />
          <ellipse cx={360} cy={560} rx={58} ry={78} />
          <path d="M282 560 H438 M292 524 H428 M292 596 H428 M312 498 H408 M312 622 H408" />
        </g>
        <path
          d="M360 482 A78 78 0 0 1 360 638 A40 78 0 0 0 360 482 Z"
          style={{ fill: INK, opacity: 0.12 }}
        />
        <circle cx={330} cy={528} r={6} style={{ fill: ACCENT }} />
        <Trace
          d="M360 442 A118 118 0 1 1 359.9 442"
          dash="6 8"
          color={INK}
          w={2}
          live={live}
          delay={0}
          dur={800}
        />
        <circle
          cx={1540}
          cy={520}
          r={58}
          style={{ fill: '#E2D5B8', stroke: INK, strokeWidth: 3 }}
        />
        <path
          d="M1540 462 A58 58 0 0 1 1540 578 A26 58 0 0 0 1540 462 Z"
          style={{ fill: INK, opacity: 0.16 }}
        />
        <circle
          cx={1520}
          cy={500}
          r={9}
          style={{ fill: 'none', stroke: INK, strokeWidth: 1.5, opacity: 0.5 }}
        />
        <circle
          cx={1550}
          cy={540}
          r={6}
          style={{ fill: 'none', stroke: INK, strokeWidth: 1.5, opacity: 0.5 }}
        />
        <circle
          cx={1530}
          cy={552}
          r={4}
          style={{ fill: 'none', stroke: INK, strokeWidth: 1.5, opacity: 0.5 }}
        />
        <Trace
          d="M360 678 C700 820 1250 760 1540 616"
          dash="14 10"
          color={ACCENT}
          w={5}
          live={live}
          delay={700}
          dur={2400}
        />
        <Trace
          d="M1540 616 A26 96 0 1 1 1540 424 A26 96 0 1 1 1540 616"
          dash="8 7"
          color={RUST}
          w={3}
          live={live}
          delay={3100}
          dur={900}
        />
        <text x={360} y={410} textAnchor="middle" style={lab(24)}>
          EARTH
        </text>
        <text x={360} y={438} textAnchor="middle" style={mono(22)}>
          185 km parking orbit
        </text>
        <text x={1540} y={376} textAnchor="middle" style={lab(24)}>
          MOON
        </text>
        <text x={1540} y={404} textAnchor="middle" style={mono(22)}>
          100 km polar orbit
        </text>
        <Marker x={360} y={678} live={live} delay={650}>
          <text x={336} y={712} textAnchor="end" style={lab(20, { fill: ACCENT })}>
            TLI BURN
          </text>
          <text x={336} y={740} textAnchor="end" style={mono(22)}>
            Δv 3.15 km/s
          </text>
        </Marker>
        <Marker x={647} y={748} live={live} delay={1300}>
          <text x={647} y={700} textAnchor="middle" style={lab(20, { fill: ACCENT })}>
            TCM-1
          </text>
          <text x={647} y={726} textAnchor="middle" style={mono(22)}>
            L+1 d · 2.1 m/s
          </text>
        </Marker>
        <Marker x={1281} y={706} live={live} delay={2500}>
          <text x={1281} y={756} textAnchor="middle" style={lab(20, { fill: ACCENT })}>
            TCM-2
          </text>
          <text x={1281} y={782} textAnchor="middle" style={mono(22)}>
            L+3 d · 0.8 m/s
          </text>
        </Marker>
        <Marker x={1540} y={616} live={live} delay={3100}>
          <text x={1600} y={690} textAnchor="middle" style={lab(20, { fill: ACCENT })}>
            LOI
          </text>
          <text x={1600} y={716} textAnchor="middle" style={mono(22)}>
            Δv 850 m/s
          </text>
        </Marker>
      </svg>
      <div
        style={abs(120, 812, {
          width: 1680,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 28,
        })}
      >
        <EventTile t="L+00:00" title="Liftoff" detail="Perseus 2 · LC-2" live={live} delay={300} />
        <EventTile t="L+00:42" title="TLI burn" detail="Stage 2 restart" live={live} delay={900} />
        <EventTile
          t="L+1 d / 3 d"
          title="Two TCMs"
          detail="Under 4 m/s each"
          live={live}
          delay={1700}
        />
        <EventTile
          t="L+4.6 d"
          title="Lunar orbit"
          detail="100 km, polar"
          live={live}
          delay={3100}
        />
        <EventTile
          t="L+7.2 d"
          title="Descent"
          detail="After 2.6 d checkout"
          live={live}
          delay={3600}
        />
      </div>
    </Sheet>
  );
};

const Crater = ({
  x,
  y,
  r,
  name,
  hatch,
  labelDx = 0,
  labelDy = 0,
}: {
  x: number;
  y: number;
  r: number;
  name: string;
  hatch: string;
  labelDx?: number;
  labelDy?: number;
}) => (
  <g>
    <circle
      cx={x}
      cy={y}
      r={r * 1.22}
      style={{ fill: 'none', stroke: INK, strokeWidth: 1, opacity: 0.35 }}
    />
    <circle cx={x} cy={y} r={r} style={{ fill: PANEL, stroke: INK, strokeWidth: 2.2 }} />
    <circle
      cx={x}
      cy={y}
      r={r * 0.72}
      style={{ fill: `url(#${hatch})`, stroke: INK, strokeWidth: 1, strokeDasharray: '3 4' }}
    />
    <circle
      cx={x}
      cy={y}
      r={r * 0.4}
      style={{ fill: 'none', stroke: INK, strokeWidth: 1, opacity: 0.4 }}
    />
    <text
      x={x + labelDx}
      y={y + labelDy + 7}
      textAnchor="middle"
      style={{ ...svgMono(22, { fill: INK, fontWeight: 700 }), ...KNOCK, strokeWidth: 6 }}
    >
      {name}
    </text>
  </g>
);

const SiteMetric = ({
  label,
  value,
  pct,
  live,
  delay,
}: {
  label: string;
  value: string;
  pct?: number;
  live: boolean;
  delay: number;
}) => (
  <div style={{ borderTop: `2px solid ${RULE}`, paddingTop: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ ...LABEL, fontSize: 19, color: MUTED }}>{label}</span>
      <span style={{ ...DISPLAY, fontWeight: 800, fontSize: 44 }}>{value}</span>
    </div>
    {pct !== undefined && (
      <div style={{ height: 14, background: PANEL, marginTop: 10, position: 'relative' }}>
        <div
          className="se-m"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: `repeating-linear-gradient(90deg, ${ACCENT} 0 18px, transparent 18px 22px)`,
            transformOrigin: 'left',
            ...anim(live, `se-growx 900ms ${EASE_OUT} ${delay}ms both`),
          }}
        />
      </div>
    )}
  </div>
);

const SiteMap: Page = () => {
  const live = useIsActivePage();
  const uid = useUid();
  const hatch = `${uid}h`;
  const clip = `${uid}c`;
  return (
    <Sheet>
      <Header n="07" kicker="Landing site" title="Site 04, de Gerlache rim." />
      <svg
        width={640}
        height={640}
        viewBox="-360 -360 720 720"
        style={abs(240, 268, { overflow: 'visible' })}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={hatch}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="#CDBB98" />
            <path d="M0 0 V8" stroke={BROWN} strokeWidth="2.4" opacity="0.55" />
          </pattern>
          <clipPath id={clip}>
            <circle r="330" />
          </clipPath>
        </defs>
        <circle r="346" style={{ fill: 'none', stroke: INK, strokeWidth: 1.5 }} />
        <g clipPath={`url(#${clip})`}>
          <circle r="330" fill="#EADFC7" />
          <Crater x={-23} y={-267} r={87} name="HAWORTH" hatch={hatch} />
          <Crater x={138} y={-139} r={87} name="SHOEMAKER" hatch={hatch} />
          <Crater x={271} y={-62} r={66} name="FAUSTINI" hatch={hatch} labelDx={-10} />
          <Crater x={-82} y={155} r={54} name="SVERDRUP" hatch={hatch} />
          <Crater x={-154} y={-8} r={54} name="DE GERLACHE" hatch={hatch} labelDy={-70} />
          <Crater x={26} y={22} r={36} name="SHACKLETON" hatch={hatch} labelDx={34} labelDy={58} />
          <g
            style={{
              fill: 'none',
              stroke: INK,
              strokeWidth: 1.2,
              strokeDasharray: '4 6',
              opacity: 0.5,
            }}
          >
            <circle r="103" />
            <circle r="206" />
            <circle r="309" />
            <path d="M0 -330 V330 M-330 0 H330 M-233 -233 L233 233 M-233 233 L233 -233" />
          </g>
        </g>
        <text x={6} y={-110} style={{ ...svgMono(21, { fill: INK }), ...KNOCK, strokeWidth: 5 }}>
          89°
        </text>
        <text x={6} y={-213} style={{ ...svgMono(21, { fill: INK }), ...KNOCK, strokeWidth: 5 }}>
          88°
        </text>
        <text x={6} y={-316} style={{ ...svgMono(21, { fill: INK }), ...KNOCK, strokeWidth: 5 }}>
          87°
        </text>
        <text
          x={0}
          y={-356}
          textAnchor="middle"
          style={svgDisplay(21, 700, { fill: INK, letterSpacing: 2 })}
        >
          0° · TO EARTH
        </text>
        <text
          x={360}
          y={6}
          textAnchor="start"
          style={svgDisplay(21, 700, { fill: INK, letterSpacing: 2 })}
        >
          90°E
        </text>
        <text
          x={-360}
          y={6}
          textAnchor="end"
          style={svgDisplay(21, 700, { fill: INK, letterSpacing: 2 })}
        >
          90°W
        </text>
        <text
          x={0}
          y={374}
          textAnchor="middle"
          style={svgDisplay(21, 700, { fill: INK, letterSpacing: 2 })}
        >
          180°
        </text>
        <g>
          <circle cx={70} cy={-60} r={9} style={{ fill: BG, stroke: INK, strokeWidth: 3 }} />
          <text
            x={70}
            y={-26}
            textAnchor="middle"
            style={{
              ...svgDisplay(21, 700, { fill: INK, letterSpacing: 2 }),
              ...KNOCK,
              strokeWidth: 6,
            }}
          >
            SITE 07 · BACKUP
          </text>
        </g>
        <g>
          <circle
            cx={-100}
            cy={6}
            r={14}
            className="se-m"
            style={{
              fill: 'none',
              stroke: ACCENT,
              strokeWidth: 3,
              transformBox: 'fill-box',
              transformOrigin: 'center',
              ...anim(live, `se-pulse 2.4s ${EASE_OUT} 1.2s infinite`),
            }}
          />
          <path
            d="M-100 -26 V-12 M-100 24 V38 M-132 6 H-118 M-82 6 H-68"
            style={{ stroke: ACCENT, strokeWidth: 3 }}
          />
          <ellipse
            cx={-100}
            cy={6}
            rx={14}
            ry={9}
            style={{ fill: ACCENT, stroke: INK, strokeWidth: 2 }}
          />
          <text
            x={-100}
            y={68}
            textAnchor="middle"
            style={{ ...svgDisplay(22, 800, { fill: ACCENT, letterSpacing: 2 }), ...KNOCK }}
          >
            SITE 04
          </text>
        </g>
        <g transform="translate(-150 300)">
          <path d="M0 0 H68" style={{ stroke: INK, strokeWidth: 5 }} />
          <path d="M0 0 H34" style={{ stroke: BG, strokeWidth: 3 }} />
          <text
            x={80}
            y={7}
            style={{ ...svgMono(21, { fill: INK, fontWeight: 700 }), ...KNOCK, strokeWidth: 5 }}
          >
            20 km
          </text>
        </g>
      </svg>
      <div style={abs(1060, 300, { width: 740 })}>
        <div style={{ ...LABEL, fontSize: 19, color: ACCENT }}>Primary · connecting ridge</div>
        <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 46, marginTop: 10, lineHeight: 1.1 }}>
          89.03° S · 93.4° W
        </div>
        <div style={{ fontSize: 28, marginTop: 14, lineHeight: 1.4, color: MUTED }}>
          A sunlit ridge on the de Gerlache rim,
          <br />
          1.4 km from permanent shadow.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 34 }}>
          <SiteMetric label="Sunlight, lunar year" value="81%" pct={81} live={live} delay={300} />
          <SiteMetric label="Earth in view" value="54%" pct={54} live={live} delay={450} />
          <SiteMetric label="Slope in ellipse" value="≤ 6°" live={live} delay={0} />
          <SiteMetric label="Landing ellipse" value="100 × 60 m" live={live} delay={0} />
        </div>
      </div>
    </Sheet>
  );
};

const Gate = ({
  x,
  y,
  fx,
  fy,
  name,
  data,
  align = 'start',
  live,
  delay,
}: {
  x: number;
  y: number;
  fx: number;
  fy: number;
  name: string;
  data: string;
  align?: 'start' | 'end';
  live: boolean;
  delay: number;
}) => {
  const tx = align === 'start' ? fx + 12 : fx - 12;
  const top = fy - 26;
  const bottom = fy + 40;
  const leaderFrom = y < fy ? y : y;
  const leaderTo = y < fy ? top - 6 : bottom - 2;
  return (
    <g className="se-m" style={anim(live, `se-fade 450ms ${EASE_OUT} ${delay}ms both`)}>
      <path
        d={`M${fx} ${leaderFrom} V${leaderTo} M${fx} ${top - 6} V${bottom - 2}`}
        style={{ stroke: INK, strokeWidth: 1.6, strokeDasharray: '3 4' }}
      />
      <text
        x={tx}
        y={fy}
        textAnchor={align}
        style={{ ...svgDisplay(21, 700, { fill: ACCENT, letterSpacing: 3 }), ...KNOCK }}
      >
        {name}
      </text>
      <text
        x={tx}
        y={fy + 30}
        textAnchor={align}
        style={{ ...svgMono(23, { fill: INK }), ...KNOCK }}
      >
        {data}
      </text>
      <circle cx={x} cy={y} r={10} style={{ fill: BG, stroke: INK, strokeWidth: 3 }} />
      <circle cx={x} cy={y} r={5} style={{ fill: ACCENT }} />
    </g>
  );
};

const Descent: Page = () => {
  const live = useIsActivePage();
  const profile = curveD([
    [260, 340],
    [401, 366],
    [541, 401],
    [682, 446],
    [823, 506],
    [921, 591],
    [1020, 683],
    [1337, 781],
    [1587, 856],
    [1700, 880],
  ]);
  const axisLab = (extra?: CSSProperties) => svgMono(20, { fill: MUTED, ...extra });
  return (
    <Sheet>
      <Header n="08" kicker="Powered descent" title="Eleven minutes to the surface." />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={abs(0, 0)} aria-hidden="true">
        <rect x={260} y={320} width={760} height={560} style={{ fill: MUSTARD, opacity: 0.13 }} />
        <rect x={1020} y={320} width={453} height={560} style={{ fill: ACCENT, opacity: 0.11 }} />
        <rect x={1473} y={320} width={227} height={560} style={{ fill: RUST, opacity: 0.15 }} />
        <g style={{ stroke: INK, strokeWidth: 1, strokeDasharray: '3 7', opacity: 0.35 }}>
          <path d="M260 439 H1700 M260 568 H1700 M260 683 H1700 M260 781 H1700" />
        </g>
        <path d="M260 320 V880 H1700" style={{ fill: 'none', stroke: INK, strokeWidth: 2.5 }} />
        <path d="M1012 872 l10 -16 M1022 872 l10 -16" style={{ stroke: INK, strokeWidth: 2.5 }} />
        <text x={244} y={346} textAnchor="end" style={axisLab()}>
          15 km
        </text>
        <text x={244} y={445} textAnchor="end" style={axisLab()}>
          10
        </text>
        <text x={244} y={574} textAnchor="end" style={axisLab()}>
          5
        </text>
        <text x={244} y={689} textAnchor="end" style={axisLab()}>
          2
        </text>
        <text x={244} y={787} textAnchor="end" style={axisLab()}>
          0.5
        </text>
        <text x={244} y={886} textAnchor="end" style={axisLab()}>
          0
        </text>
        <text x={260} y={912} textAnchor="middle" style={axisLab()}>
          0:00
        </text>
        <text x={429} y={912} textAnchor="middle" style={axisLab()}>
          2:00
        </text>
        <text x={598} y={912} textAnchor="middle" style={axisLab()}>
          4:00
        </text>
        <text x={767} y={912} textAnchor="middle" style={axisLab()}>
          6:00
        </text>
        <text x={936} y={912} textAnchor="middle" style={axisLab()}>
          8:00
        </text>
        <text x={1292} y={912} textAnchor="middle" style={axisLab()}>
          10:00
        </text>
        <text x={1564} y={912} textAnchor="middle" style={axisLab()}>
          11:00
        </text>
        <text x={1700} y={912} textAnchor="middle" style={axisLab({ fill: INK, fontWeight: 700 })}>
          11:30
        </text>
        <text
          x={640}
          y={952}
          textAnchor="middle"
          style={svgDisplay(19, 700, { fill: INK, letterSpacing: 3 })}
        >
          BRAKING · 9 MIN
        </text>
        <text
          x={1246}
          y={952}
          textAnchor="middle"
          style={svgDisplay(19, 700, { fill: INK, letterSpacing: 3 })}
        >
          APPROACH · 100 S
        </text>
        <text
          x={1586}
          y={952}
          textAnchor="middle"
          style={svgDisplay(19, 700, { fill: INK, letterSpacing: 3 })}
        >
          TERMINAL · 50 S
        </text>
        <text x={1030} y={940} style={svgMono(18, { fill: MUTED })}>
          ×3.6
        </text>
        <Trace d={profile} color={INK} w={5} live={live} delay={200} dur={2600} />
        <Gate
          x={260}
          y={340}
          fx={260}
          fy={470}
          name="PDI"
          data="15.0 km · 1,690 m/s"
          live={live}
          delay={200}
        />
        <Gate
          x={823}
          y={506}
          fx={823}
          fy={412}
          name="THROTTLE DOWN"
          data="7.2 km · T+6:40"
          live={live}
          delay={1300}
        />
        <Gate
          x={1020}
          y={683}
          fx={1020}
          fy={560}
          name="HIGH GATE"
          data="2.0 km · T+9:00"
          live={live}
          delay={1800}
        />
        <Gate
          x={1337}
          y={781}
          fx={1337}
          fy={664}
          name="HAZARD SCAN"
          data="500 m · T+10:10"
          live={live}
          delay={2200}
        />
        <Gate
          x={1587}
          y={856}
          fx={1587}
          fy={752}
          name="LOW GATE"
          data="30 m · T+11:05"
          align="end"
          live={live}
          delay={2500}
        />
        <Gate
          x={1700}
          y={880}
          fx={1700}
          fy={600}
          name="TOUCHDOWN"
          data="T+11:30 · 1.2 m/s"
          align="end"
          live={live}
          delay={2800}
        />
      </svg>
      <div
        className="se-m"
        style={abs(1300, 300, {
          width: 500,
          padding: '20px 26px',
          boxSizing: 'border-box',
          background: SHEET,
          boxShadow: `inset 0 0 0 2px ${RULE}`,
          ...anim(live, `se-fade 500ms ${EASE_OUT} 3000ms both`),
        })}
      >
        <div style={{ ...LABEL, fontSize: 18, color: MUTED }}>Descent budget</div>
        <div style={{ fontSize: 26, lineHeight: 1.5, marginTop: 8 }}>
          Δv used ....... 1,960 m/s
          <br />
          Propellant .... 1,090 kg
          <br />
          Hover margin .. 45 s
        </div>
      </div>
    </Sheet>
  );
};

const ManifestRow = ({
  id,
  name,
  owner,
  kg,
  power,
  color,
  live,
  delay,
}: {
  id: string;
  name: string;
  owner: string;
  kg: number;
  power: string;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '120px 520px 380px 1fr 140px',
      alignItems: 'center',
      height: 70,
      borderBottom: `1.5px dashed ${RULE}`,
    }}
  >
    <span style={{ fontSize: 24, color: MUTED }}>{id}</span>
    <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 27 }}>{name}</span>
    <span style={{ fontSize: 24, color: MUTED }}>{owner}</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span
        className="se-m"
        style={{
          display: 'block',
          width: Math.max(4, kg * 1.6),
          height: 24,
          background: color,
          transformOrigin: 'left',
          ...anim(live, `se-growx 800ms ${EASE_OUT} ${delay}ms both`),
        }}
      />
      <span style={{ fontSize: 28, fontWeight: 700 }}>{kg} kg</span>
    </span>
    <span style={{ fontSize: 26, textAlign: 'right' }}>{power}</span>
  </div>
);

const Manifest: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet>
      <Header
        n="09"
        kicker="Payload manifest"
        title="Seven payloads, 412 kilograms."
        aside={
          <>
            <span style={{ color: MUSTARD }}>■</span> science{' '}
            <span style={{ color: ACCENT }}>■</span> mobility <span style={{ color: RUST }}>■</span>{' '}
            relay <span style={{ color: BROWN }}>■</span> cargo
          </>
        }
      />
      <div style={abs(120, 292, { width: 1680 })}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 520px 380px 1fr 140px',
            ...LABEL,
            fontSize: 18,
            color: MUTED,
            paddingBottom: 12,
            borderBottom: `3px solid ${INK}`,
          }}
        >
          <span>ID</span>
          <span>Payload</span>
          <span>Customer</span>
          <span>Mass</span>
          <span style={{ textAlign: 'right' }}>Peak</span>
        </div>
        <ManifestRow
          id="P-01"
          name="PRISM ice drill"
          owner="Lunar Volatiles Cons."
          kg={94}
          power="310 W"
          color={MUSTARD}
          live={live}
          delay={100}
        />
        <ManifestRow
          id="P-02"
          name="PIKA micro-rover"
          owner="Meridian Robotics"
          kg={22}
          power="40 W"
          color={ACCENT}
          live={live}
          delay={200}
        />
        <ManifestRow
          id="P-03"
          name="Neutron spectrometer"
          owner="Arcadia University"
          kg={6}
          power="9 W"
          color={MUSTARD}
          live={live}
          delay={300}
        />
        <ManifestRow
          id="P-04"
          name="VOLTA mass spec."
          owner="Halvard Institute"
          kg={14}
          power="60 W"
          color={MUSTARD}
          live={live}
          delay={400}
        />
        <ManifestRow
          id="P-05"
          name="Laser retroreflector"
          owner="Bracken Observatory"
          kg={1}
          power="—"
          color={MUSTARD}
          live={live}
          delay={500}
        />
        <ManifestRow
          id="P-06"
          name="LUNET relay smallsat"
          owner="Cislune Comms"
          kg={196}
          power="in orbit"
          color={RUST}
          live={live}
          delay={600}
        />
        <ManifestRow
          id="P-07"
          name="Cargo locker"
          owner="6 commercial clients"
          kg={79}
          power="15 W"
          color={BROWN}
          live={live}
          delay={700}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 520px 380px 1fr 140px',
            alignItems: 'center',
            height: 84,
            borderTop: `3px solid ${INK}`,
            marginTop: -1.5,
          }}
        >
          <span />
          <span style={{ ...DISPLAY, fontWeight: 800, fontSize: 30 }}>Total</span>
          <span style={{ fontSize: 24, color: MUTED }}>Capacity 450 kg</span>
          <span style={{ fontSize: 28, fontWeight: 700 }}>
            412 kg <span style={{ color: AVOCADO }}>· margin 38 kg</span>
          </span>
          <span style={{ fontSize: 26, textAlign: 'right', fontWeight: 700 }}>434 W</span>
        </div>
      </div>
    </Sheet>
  );
};

const RISK_GREEN = 'rgba(110,125,44,0.26)';
const RISK_YELLOW = 'rgba(217,160,34,0.42)';
const RISK_RED = 'rgba(166,59,28,0.42)';

const riskFill = (l: number, c: number) => {
  const s = l * c;
  if (s >= 15) return RISK_RED;
  if (s >= 8) return RISK_YELLOW;
  return RISK_GREEN;
};

const Cell = ({ l, c }: { l: number; c: number }) => (
  <div style={{ background: riskFill(l, c), boxShadow: `inset 0 0 0 1px ${RULE}` }} />
);

const RiskDot = ({
  id,
  l,
  c,
  dx = 0,
  dy = 0,
  open,
  live,
  delay,
}: {
  id: string;
  l: number;
  c: number;
  dx?: number;
  dy?: number;
  open?: boolean;
  live: boolean;
  delay: number;
}) => (
  <div
    className="se-m"
    style={abs(300 + (c - 1) * 104 + 52 - 26 + dx, 300 + (5 - l) * 104 + 52 - 26 + dy, {
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: open ? INK : SHEET,
      color: open ? SHEET : INK,
      border: `3px solid ${INK}`,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...DISPLAY,
      fontWeight: 800,
      fontSize: 19,
      ...anim(live, `se-pop 500ms ${EASE_OUT} ${delay}ms both`),
    })}
  >
    {id}
  </div>
);

const RiskItem = ({
  id,
  title,
  status,
  open,
}: {
  id: string;
  title: string;
  status: string;
  open?: boolean;
}) => (
  <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
    <div
      style={{
        ...DISPLAY,
        width: 48,
        height: 48,
        flexShrink: 0,
        borderRadius: '50%',
        border: `3px solid ${INK}`,
        boxSizing: 'border-box',
        background: open ? INK : 'transparent',
        color: open ? SHEET : INK,
        fontWeight: 800,
        fontSize: 17,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {id}
    </div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
      <div
        style={{
          ...LABEL,
          fontSize: 18,
          letterSpacing: '0.1em',
          marginTop: 6,
          color: open ? RUST : AVOCADO,
        }}
      >
        {status}
      </div>
    </div>
  </div>
);

const Risks: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet>
      <Header n="10" kicker="Risk posture" title="Two yellows. No reds." />
      <div
        style={abs(300, 300, {
          width: 520,
          height: 520,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          outline: `3px solid ${INK}`,
        })}
      >
        <Cell l={5} c={1} />
        <Cell l={5} c={2} />
        <Cell l={5} c={3} />
        <Cell l={5} c={4} />
        <Cell l={5} c={5} />
        <Cell l={4} c={1} />
        <Cell l={4} c={2} />
        <Cell l={4} c={3} />
        <Cell l={4} c={4} />
        <Cell l={4} c={5} />
        <Cell l={3} c={1} />
        <Cell l={3} c={2} />
        <Cell l={3} c={3} />
        <Cell l={3} c={4} />
        <Cell l={3} c={5} />
        <Cell l={2} c={1} />
        <Cell l={2} c={2} />
        <Cell l={2} c={3} />
        <Cell l={2} c={4} />
        <Cell l={2} c={5} />
        <Cell l={1} c={1} />
        <Cell l={1} c={2} />
        <Cell l={1} c={3} />
        <Cell l={1} c={4} />
        <Cell l={1} c={5} />
      </div>
      <div
        style={abs(256, 300, {
          width: 30,
          height: 520,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          ...DISPLAY,
          fontWeight: 700,
          fontSize: 22,
        })}
      >
        <span>5</span>
        <span>4</span>
        <span>3</span>
        <span>2</span>
        <span>1</span>
      </div>
      <div
        style={abs(300, 834, {
          width: 520,
          display: 'flex',
          justifyContent: 'space-around',
          ...DISPLAY,
          fontWeight: 700,
          fontSize: 22,
        })}
      >
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
      <div
        style={abs(300, 884, {
          ...LABEL,
          fontSize: 18,
          color: MUTED,
          width: 520,
          textAlign: 'center',
        })}
      >
        Consequence →
      </div>
      <div
        style={abs(150, 560, {
          ...LABEL,
          fontSize: 18,
          color: MUTED,
          width: 0,
          whiteSpace: 'nowrap',
          transform: 'rotate(-90deg)',
          transformOrigin: '0 0',
          display: 'flex',
          justifyContent: 'center',
        })}
      >
        Likelihood →
      </div>
      <RiskDot id="R1" l={3} c={4} open live={live} delay={300} />
      <RiskDot id="R2" l={3} c={3} open live={live} delay={450} />
      <RiskDot id="R3" l={2} c={3} live={live} delay={600} />
      <RiskDot id="R4" l={1} c={5} live={live} delay={750} />
      <RiskDot id="R5" l={2} c={2} dx={-22} dy={-14} live={live} delay={900} />
      <RiskDot id="R6" l={2} c={2} dx={22} dy={16} live={live} delay={1050} />
      <div
        style={abs(960, 296, {
          width: 840,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        })}
      >
        <Steps>
          <Step>
            <RiskItem
              id="R1"
              open
              title="LIDAR false hazards in low-sun shadow"
              status="Open · TRN fallback proven in 212 sims"
            />
          </Step>
          <Step>
            <RiskItem
              id="R2"
              open
              title="Ka-band dropouts while Earth is hidden"
              status="Open · LUNET relay covers 92% of gaps"
            />
          </Step>
          <Step>
            <RiskItem
              id="R3"
              title="Rover thermal at −200 °C in shadow"
              status="Closed · heater soak test, 06 Oct"
            />
          </Step>
          <Step>
            <RiskItem
              id="R4"
              title="Engine roughness below 25% throttle"
              status="Closed · 41 hot-fires, all stable"
            />
          </Step>
          <Step>
            <RiskItem
              id="R5"
              title="Late delivery of the VOLTA payload"
              status="Closed · integrated 22 Sep"
            />
          </Step>
          <Step>
            <RiskItem
              id="R6"
              title="Range conflict on 04 November"
              status="Closed · range slot confirmed"
            />
          </Step>
        </Steps>
      </div>
    </Sheet>
  );
};

const PollRow = ({
  call,
  duty,
  status = 'GO',
  note,
  live,
  delay,
}: {
  call: string;
  duty: string;
  status?: string;
  note?: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      height: 68,
      padding: '0 24px',
      background: 'rgba(255,240,210,0.04)',
      boxShadow: 'inset 0 0 0 1.5px rgba(239,230,210,0.12)',
    }}
  >
    <Lamp size={34} live={live} delay={delay} bezel="#7A6650" />
    <span
      style={{
        ...DISPLAY,
        fontWeight: 700,
        fontSize: 26,
        width: 230,
        color: SHEET,
        letterSpacing: '0.04em',
      }}
    >
      {call}
    </span>
    <span style={{ fontSize: 22, color: '#B8A68C', flex: 1 }}>{duty}</span>
    {note && <span style={{ fontSize: 20, color: LAMP_AMBER }}>{note}</span>}
    <span
      className="se-m"
      style={{
        ...DISPLAY,
        fontWeight: 800,
        fontSize: 28,
        color: LAMP_GO,
        width: 64,
        textAlign: 'right',
        textShadow: `0 0 12px color-mix(in srgb, ${LAMP_GO} 60%, transparent)`,
        ...anim(live, `se-fade 200ms linear ${delay + 300}ms both`),
      }}
    >
      {status}
    </span>
  </div>
);

const Screw = ({ x, y }: { x: number; y: number }) => (
  <div
    style={abs(x, y, {
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #9A866C, #4A3828)',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.4)',
    })}
  >
    <div
      style={abs(2, 7, {
        width: 12,
        height: 2,
        background: 'rgba(0,0,0,0.5)',
        transform: 'rotate(35deg)',
      })}
    />
  </div>
);

const Poll: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet>
      <Header
        n="11"
        kicker="Readiness poll"
        title="Twelve consoles, twelve GOs."
        aside={
          <>
            Poll FRR-2 · closed 11:52 UTC
            <br />
            Flight Director T. Ibarra, polling
          </>
        }
      />
      <div
        style={abs(120, 296, {
          width: 1680,
          height: 640,
          boxSizing: 'border-box',
          padding: '34px 40px',
          background: `linear-gradient(180deg, #34211A 0%, ${CONSOLE} 100%)`,
          borderRadius: 'var(--osd-radius)',
          boxShadow: `0 0 0 6px ${BROWN}, 0 20px 40px -20px rgba(0,0,0,0.6)`,
        })}
      >
        <Screw x={14} y={14} />
        <Screw x={1650} y={14} />
        <Screw x={14} y={610} />
        <Screw x={1650} y={610} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 32, rowGap: 10 }}>
          <PollRow call="FLIGHT" duty="Flight Director" live={live} delay={300} />
          <PollRow call="COMM" duty="Comms & Ground" note="R2 open" live={live} delay={1800} />
          <PollRow call="FDO" duty="Flight Dynamics" live={live} delay={550} />
          <PollRow call="PAYLOAD" duty="Payload Ops" live={live} delay={2050} />
          <PollRow call="GNC" duty="Guidance & Nav" note="R1 open" live={live} delay={800} />
          <PollRow call="SURFACE" duty="Surface & Rover" live={live} delay={2300} />
          <PollRow call="PROP" duty="Propulsion" live={live} delay={1050} />
          <PollRow call="LAUNCH VEH." duty="Perseus 2 team" live={live} delay={2550} />
          <PollRow call="POWER" duty="Power & Thermal" live={live} delay={1300} />
          <PollRow call="RANGE" duty="Range Safety" live={live} delay={2800} />
          <PollRow call="THERMAL" duty="Thermal Control" live={live} delay={1550} />
          <PollRow call="WEATHER" duty="Forecast" note="80% favourable" live={live} delay={3050} />
        </div>
        <div
          style={{
            marginTop: 26,
            height: 76,
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            padding: '0 24px',
            background: 'rgba(180,207,74,0.08)',
            boxShadow: 'inset 0 0 0 2px rgba(180,207,74,0.35)',
          }}
        >
          <Lamp size={44} live={live} delay={3500} bezel="#7A6650" />
          <span
            style={{
              ...DISPLAY,
              fontWeight: 800,
              fontSize: 30,
              color: SHEET,
              letterSpacing: '0.08em',
            }}
          >
            BOARD STATUS
          </span>
          <span style={{ fontSize: 24, color: '#B8A68C', flex: 1 }}>
            12 of 12 consoles · 2 risks carried
          </span>
          <span
            className="se-m"
            style={{
              ...DISPLAY,
              fontWeight: 800,
              fontSize: 40,
              color: LAMP_GO,
              letterSpacing: '0.1em',
              textShadow: `0 0 16px color-mix(in srgb, ${LAMP_GO} 70%, transparent)`,
              ...anim(live, `se-fade 240ms linear 3800ms both`),
            }}
          >
            GO
          </span>
        </div>
      </div>
    </Sheet>
  );
};

const FlipDigit = ({ d }: { d: string }) => (
  <div
    style={{
      position: 'relative',
      width: 92,
      height: 132,
      borderRadius: 8,
      background: `linear-gradient(180deg, #3D2819 0%, #3D2819 50%, ${CONSOLE} 50%, ${CONSOLE} 100%)`,
      color: SHEET,
      ...DISPLAY,
      fontWeight: 800,
      fontSize: 92,
      lineHeight: '132px',
      textAlign: 'center',
      boxShadow: '0 6px 0 rgba(58,36,20,0.25)',
    }}
  >
    {d}
    <div style={abs(0, 65, { width: 92, height: 2, background: 'rgba(0,0,0,0.55)' })} />
  </div>
);

const DigitGroup = ({ a, b, label }: { a: string; b: string; label: string }) => (
  <div>
    <div style={{ display: 'flex', gap: 8 }}>
      <FlipDigit d={a} />
      <FlipDigit d={b} />
    </div>
    <div style={{ ...LABEL, fontSize: 18, color: MUTED, marginTop: 14, textAlign: 'center' }}>
      {label}
    </div>
  </div>
);

const Colon = () => (
  <div
    style={{
      ...DISPLAY,
      fontWeight: 800,
      fontSize: 80,
      color: ACCENT,
      lineHeight: '132px',
      padding: '0 14px',
    }}
  >
    :
  </div>
);

const WindowDay = ({
  day,
  minutes,
  kind,
  live,
  delay,
}: {
  day: string;
  minutes: number;
  kind: 'primary' | 'backup' | 'closed';
  live: boolean;
  delay: number;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div
      style={{
        height: 150,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 8,
          color: kind === 'closed' ? MUTED : INK,
        }}
      >
        {kind === 'closed' ? 'closed' : `${minutes} min`}
      </div>
      {kind === 'closed' ? (
        <div
          style={{
            width: 120,
            height: 10,
            background: `repeating-linear-gradient(45deg, ${MUTED} 0 3px, transparent 3px 8px)`,
          }}
        />
      ) : (
        <div
          className="se-m"
          style={{
            width: 120,
            height: minutes * 2.7,
            background: kind === 'primary' ? ACCENT : MUSTARD,
            transformOrigin: 'bottom',
            ...anim(live, `se-growy 700ms ${EASE_OUT} ${delay}ms both`),
          }}
        />
      )}
    </div>
    <div style={{ height: 3, width: '100%', background: INK }} />
    <div
      style={{
        ...LABEL,
        fontSize: 19,
        letterSpacing: '0.1em',
        marginTop: 12,
        color: kind === 'primary' ? ACCENT : INK,
      }}
    >
      {day}
    </div>
  </div>
);

const CountStep = ({
  t,
  label,
  live,
  delay,
  last,
}: {
  t: string;
  label: string;
  live: boolean;
  delay: number;
  last?: boolean;
}) => (
  <div style={{ position: 'relative', paddingTop: 44 }}>
    <div style={abs(0, 0)}>
      <Lamp size={26} color={last ? LAMP_GO : LAMP_AMBER} live={live} delay={delay} />
    </div>
    <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 28, color: last ? ACCENT : INK }}>{t}</div>
    <div style={{ fontSize: 24, color: MUTED, marginTop: 6 }}>{label}</div>
  </div>
);

const Window: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet>
      <Header n="12" kicker="Launch window" title="Window opens 04 November." />
      <div style={abs(120, 296, { ...LABEL, fontSize: 18, color: MUTED })}>
        Time to T-0, from this briefing
      </div>
      <div style={abs(120, 336, { display: 'flex', alignItems: 'flex-start' })}>
        <DigitGroup a="2" b="2" label="Days" />
        <Colon />
        <DigitGroup a="1" b="8" label="Hours" />
        <Colon />
        <DigitGroup a="4" b="2" label="Min" />
      </div>
      <div style={abs(1000, 300, { width: 800 })}>
        <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 40, lineHeight: 1.15 }}>
          T-0 · 06:42:00 UTC
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.5, marginTop: 14 }}>
          Wed 04 Nov 2026 · LC-2, Halcyon Point
          <br />A 38-minute daily window, five days long.
          <br />
          <span style={{ color: MUTED }}>Next window if we slip: 03 December.</span>
        </div>
      </div>
      <div
        style={abs(120, 556, {
          width: 1680,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 20,
        })}
      >
        <WindowDay day="Wed 04" minutes={38} kind="primary" live={live} delay={200} />
        <WindowDay day="Thu 05" minutes={34} kind="backup" live={live} delay={300} />
        <WindowDay day="Fri 06" minutes={29} kind="backup" live={live} delay={400} />
        <WindowDay day="Sat 07" minutes={22} kind="backup" live={live} delay={500} />
        <WindowDay day="Sun 08" minutes={14} kind="backup" live={live} delay={600} />
        <WindowDay day="Mon 09" minutes={0} kind="closed" live={live} delay={0} />
        <WindowDay day="Tue 10" minutes={0} kind="closed" live={live} delay={0} />
      </div>
      <div style={abs(120, 812, { width: 1680, height: 3, background: RULE })} />
      <div
        style={abs(120, 800, {
          width: 1680,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 24,
        })}
      >
        <CountStep t="L–3 d" label="Readiness review" live={live} delay={900} />
        <CountStep t="L–1 d" label="Rollout, vertical" live={live} delay={1200} />
        <CountStep t="T–6 h" label="Propellant load" live={live} delay={1500} />
        <CountStep t="T–40 m" label="Final poll · hold" live={live} delay={1800} />
        <CountStep t="T–4 m" label="Terminal count" live={live} delay={2100} />
        <CountStep t="T–0" label="Liftoff" last live={live} delay={2500} />
      </div>
    </Sheet>
  );
};

const SignBlock = ({ duty, name }: { duty: string; name: string }) => (
  <div style={{ width: 460 }}>
    <div style={{ height: 64, borderBottom: `2px solid ${INK}` }} />
    <div style={{ fontSize: 26, fontWeight: 700, marginTop: 12 }}>{name}</div>
    <div style={{ ...LABEL, fontSize: 18, color: MUTED, marginTop: 6 }}>{duty}</div>
  </div>
);

const Close: Page = () => {
  const live = useIsActivePage();
  return (
    <Sheet chrome={false}>
      <div style={abs(120, 120, { ...LABEL, color: ACCENT })}>Board recommendation</div>
      <h2
        style={abs(112, 168, {
          ...DISPLAY,
          margin: 0,
          fontWeight: 800,
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 0.95,
          letterSpacing: '-0.01em',
          textShadow: '5px 3px 0 rgba(217,160,34,0.5)',
        })}
      >
        GO for launch.
      </h2>
      <div style={abs(120, 352, { fontSize: 32, lineHeight: 1.5 })}>
        SELENE-4 · Perseus 2 · LC-2 · 04 Nov 2026, 06:42 UTC
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={abs(0, 0)} aria-hidden="true">
        <path
          d="M-20 500 H1940"
          pathLength={1}
          className="se-m"
          style={{ stroke: MUSTARD, strokeWidth: 22, ...drawStyle(live, 100, 1300) }}
        />
        <path
          d="M-20 526 H1940"
          pathLength={1}
          className="se-m"
          style={{ stroke: '#D4601C', strokeWidth: 22, ...drawStyle(live, 180, 1300) }}
        />
        <path
          d="M-20 552 H1940"
          pathLength={1}
          className="se-m"
          style={{ stroke: RUST, strokeWidth: 22, ...drawStyle(live, 260, 1300) }}
        />
        <path
          d="M-20 578 H1940"
          pathLength={1}
          className="se-m"
          style={{ stroke: BROWN, strokeWidth: 22, ...drawStyle(live, 340, 1300) }}
        />
      </svg>
      <div
        className="se-m"
        style={abs(1380, 330, {
          width: 420,
          height: 420,
          ...anim(live, `se-rise 800ms ${EASE_OUT} 700ms both`),
        })}
      >
        <Patch size={420} />
      </div>
      <div style={abs(120, 690, { fontSize: 28, color: MUTED })}>
        Submitted for the board's vote —
      </div>
      <div style={abs(120, 740, { display: 'flex', gap: 80 })}>
        <SignBlock duty="Mission Director" name="Ruth Okafor" />
        <SignBlock duty="Flight Director" name="Tomás Ibarra" />
      </div>
      <div
        className="se-m"
        style={abs(1240, 800, {
          padding: '10px 22px',
          border: `5px solid ${AVOCADO}`,
          color: AVOCADO,
          ...DISPLAY,
          fontWeight: 800,
          fontSize: 36,
          letterSpacing: '0.08em',
          transform: 'rotate(-9deg)',
          opacity: 0.8,
          mixBlendMode: 'multiply',
          ...anim(live, `se-stamp 520ms ${EASE_OUT} 1300ms both`),
        })}
      >
        RECOMMEND GO
      </div>
      <div
        style={abs(120, 1000, {
          width: 1680,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 19,
          color: MUTED,
        })}
      >
        <span>MERIDIAN LUNAR SYSTEMS · PROGRAM INTERNAL</span>
        <span>MLS-S4-FRR-001 · REV C · END OF BRIEFING</span>
      </div>
    </Sheet>
  );
};
Close.transition = settle;

export const meta: SlideMeta = {
  title: 'SELENE-4 Flight Readiness Briefing',
  createdAt: '2026-10-12T12:18:11.692Z',
};

export const notes: (string | undefined)[] = [
  `Good afternoon. This is the flight readiness review for SELENE-4.
I'm Ruth Okafor, mission director. In the next twenty minutes I'll walk the board through where we are, and at the end I'll ask for one vote.
The patch on the right was designed by the GNC team. The three stripes are our trajectory; the little figure at the end of it is KESTREL.`,
  `Here's the memo that went out on Friday, so nothing in this room should be a surprise.
One decision: commit to the 04 November launch.
Numbers to keep in your head: 1,840 kilograms at separation, four and a half days to the Moon, eleven and a half minutes of powered descent, ten days on the surface.
The stamp says "for decision", not "for discussion". We've had the discussions.`,
  `Four objectives, ranked. The first two are the mission; the second two are the science bonus.
Click through: precision landing within 100 metres. Then seven payloads, powered for ten Earth days.
Then the drill: ice measurements in 10-centimetre steps to one metre.
Last, PIKA into permanent shadow. If we only hit the first two, the mission is a success, and our customers have agreed to that definition in writing.`,
  `Eight consoles, one room in Tucson. Three shifts, 112 people on rotation.
Every lead you see here has run at least two full mission simulations as prime.
Tomás Ibarra is flight director for launch and landing; he'll run the poll you'll see in a few minutes.`,
  `Perseus 2, block B. Eleven flights, eleven successes, and this is the twelfth vehicle off the line.
Stage 1 has seven VR-1 engines, 4,120 kilonewtons at liftoff. Stage 2 restarts once, for the translunar burn.
KESTREL rides in the five-metre fairing; you can see it in the cutaway on the right.
The vehicle is the least of our worries: the lander is integrated, and the stack was signed off last Tuesday.`,
  `This is KESTREL from the front, at 1 to 40.
Walk the numbers: throttleable main engine, 4.4 to 22 kilonewtons, which is what gives us the hover margin.
Point out the solar array: it's vertical because at 89 degrees south the Sun never gets more than a degree and a half above the horizon.
The drill on the right, PIKA on its ramp on the left, LIDAR in the middle looking down.`,
  `How we get there. Liftoff, forty-two minutes in a parking orbit, then the translunar burn: 3.15 kilometres per second.
Two small correction burns, one on day 1, one on day 3, each a few metres per second.
Lunar orbit insertion at four point six days, 850 metres per second, into a 100-kilometre polar orbit.
Then two and a half days of checkout before we commit to descent.`,
  `This is the south pole looking straight down. Earth is at the top.
Site 04 is on the ridge that connects de Gerlache to Shackleton: sunlit 81 percent of the year, Earth in view 54 percent.
Permanent shadow is 1.4 kilometres away; that's where PIKA goes.
Site 07, near Shoemaker, is our backup if the hazard map changes before descent.`,
  `Eleven and a half minutes, fifteen kilometres to zero.
Note the time axis expands after high gate; most of the drama is in the last two and a half minutes.
Throttle-down at six forty, high gate at nine minutes, hazard scan at 500 metres, low gate at 30 metres, touchdown at 1.2 metres per second.
We carry 45 seconds of hover margin. That's the number GNC fought hardest for.`,
  `Seven payloads, 412 kilograms, against a 450-kilogram capacity: 38 kilograms of margin.
The big one is LUNET, the relay smallsat. It deploys in lunar orbit, before descent, and it's the answer to risk R2.
PRISM is the main science; the cargo locker carries six commercial customers.`,
  `Six risks were on the board at the last review. Four are closed.
Click through: R1, LIDAR false hazards in low-sun shadow. Open, mitigated by terrain-relative navigation, proven in 212 simulations.
R2, comms dropouts when Earth is below the horizon. Open, and the relay covers 92 percent of those gaps.
The other four are closed; I'll take questions on any of them.`,
  `This is the poll Tomás ran at eleven fifty-two this morning.
Twelve consoles, twelve GOs. GNC and COMM each voted GO with their open risk noted, and weather is 80 percent favourable for the fourth.
Let the lamps finish before you move on.`,
  `The window opens Wednesday the fourth at 06:42 UTC. It's 38 minutes a day and gets shorter each day: five opportunities, then it closes until December.
The countdown has a planned 30-minute hold at T-minus-40 for the final poll.
From this briefing that's twenty-two days, eighteen hours, forty-two minutes.`,
  `So the recommendation is GO.
Tomás and I have signed. We're asking the board to vote now.
Pause and hold this page through the vote.`,
];

export default [
  Cover,
  Memo,
  Objectives,
  Teams,
  Vehicle,
  Lander,
  Trajectory,
  SiteMap,
  Descent,
  Manifest,
  Risks,
  Poll,
  Window,
  Close,
] satisfies Page[];

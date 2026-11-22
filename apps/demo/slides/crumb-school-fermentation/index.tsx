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
  palette: { bg: '#1E332B', text: '#EEEDE6', accent: '#F4DE84' },
  fonts: {
    display: '"Caveat", "Segoe Print", "Comic Sans MS", cursive',
    body: '"Kalam", "Segoe Print", "Comic Sans MS", cursive',
  },
  typeScale: { hero: 250, body: 34 },
  radius: 6,
};

const CHALK = 'var(--osd-text)';
const YELLOW = 'var(--osd-accent)';
const PINK = '#F4AFC0';
const BLUE = '#A3D4EA';
const DIM = 'rgba(238, 237, 230, 0.62)';
const SLATE = 'var(--osd-bg)';

const SLIDE_ID = 'crumb-school-fermentation';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Kalam:wght@400;700&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const DEFS_ID = `osd-defs-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes cs-draw { 0% { stroke-dashoffset: 1; stroke-opacity: 0 } 2% { stroke-opacity: 1 } 100% { stroke-dashoffset: 0; stroke-opacity: 1 } }
@keyframes cs-sfade { from { stroke-opacity: 0; fill-opacity: 0 } to { stroke-opacity: 1; fill-opacity: 1 } }
@keyframes cs-write { from { clip-path: inset(-40% 100% -40% -6%) } to { clip-path: inset(-40% -6% -40% -6%) } }
@keyframes cs-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes cs-steam { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
[data-osd-step="revealed"] .cs-w { animation: cs-write 0.7s cubic-bezier(0.3, 0, 0.2, 1) both }
[data-osd-step="revealed"] .cs-ds { animation: cs-draw 0.7s cubic-bezier(0.3, 0, 0.2, 1) 0.15s both }
@media (prefers-reduced-motion: reduce) {
  .cs-steam, .cs-w, .cs-ds { animation: none !important }
}
`;
const DEFS = `<defs>
<filter id="cs-chalk" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" result="edge"/>
<feDisplacementMap in="SourceGraphic" in2="edge" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="ragged"/>
<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="9" result="grain"/>
<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -0.82" result="mask"/>
<feComposite in="ragged" in2="mask" operator="in"/>
</filter>
<filter id="cs-rough" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.024" numOctaves="2" seed="2" result="w"/>
<feDisplacementMap in="SourceGraphic" in2="w" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter>
</defs>`;

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

  if (document.body) {
    let defs: Element | null = document.getElementById(DEFS_ID);
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defs.id = DEFS_ID;
      defs.setAttribute('aria-hidden', 'true');
      defs.setAttribute(
        'style',
        'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none',
      );
      document.body.appendChild(defs);
    }
    if (defs.getAttribute('data-src') !== DEFS) {
      defs.innerHTML = DEFS;
      defs.setAttribute('data-src', DEFS);
    }
  }
}

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const EASE_DRAW = 'cubic-bezier(0.35, 0, 0.25, 1)';
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

const writeIn = (live: boolean, delay: number, dur = 0.8): CSSProperties =>
  live ? { animation: `cs-write ${dur}s ${EASE_DRAW} ${delay}s both` } : {};

const fadeIn = (live: boolean, delay: number, dur = 0.6): CSSProperties =>
  live ? { animation: `cs-fade ${dur}s ease-out ${delay}s both` } : {};

const SCRIPT: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 700,
  lineHeight: 1,
  margin: 0,
  whiteSpace: 'nowrap',
};

const HAND: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontWeight: 400,
  lineHeight: 1.35,
  margin: 0,
};

const SVG_TEXT: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fill: CHALK,
};

const SVG_SCRIPT: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 700,
  fill: CHALK,
};

type Pt = [number, number];

const f1 = (n: number) => Math.round(n * 10) / 10;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const smooth = (pts: Pt[]) => {
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q${f1(x)} ${f1(y)} ${f1((x + nx) / 2)} ${f1((y + ny) / 2)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${f1(last[0])} ${f1(last[1])}`;
};

const wobble = (x1: number, y1: number, x2: number, y2: number, seed = 1, amp = 2.5, n = 8) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = amp * (0.6 * Math.sin(t * 7.1 + seed) + 0.4 * Math.sin(t * 15.3 + seed * 2.3));
    pts.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]);
  }
  return smooth(pts);
};

const scribble = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed = 1,
  turns = 1.12,
  n = 36,
) => {
  const pts: Pt[] = [];
  const total = Math.round(n * turns);
  const a0 = -2.5 + seed * 0.37;
  for (let i = 0; i <= total; i++) {
    const a = a0 + (i / n) * Math.PI * 2;
    const k =
      1 +
      0.04 * Math.sin(a * 2 + seed) +
      0.025 * Math.sin(a * 5 + seed * 3) +
      (i / total - 0.5) * 0.07;
    pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
  }
  return smooth(pts);
};

const sketchRect = (x: number, y: number, w: number, h: number, seed = 1, over = 10) =>
  [
    wobble(x - over, y + 2, x + w + over * 0.6, y - 1, seed, 2),
    wobble(x + w - 1, y - over * 0.8, x + w + 2, y + h + over * 0.5, seed + 1, 2),
    wobble(x + w + over * 0.7, y + h + 1, x - over * 0.4, y + h - 2, seed + 2, 2),
    wobble(x + 1, y + h + over * 0.6, x - 2, y - over * 0.5, seed + 3, 2),
  ].join(' ');

const arrow = (
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  head = 18,
) => {
  const ang = Math.atan2(y2 - cy, x2 - cx);
  const h1x = x2 - head * Math.cos(ang - 0.5);
  const h1y = y2 - head * Math.sin(ang - 0.5);
  const h2x = x2 - head * Math.cos(ang + 0.5);
  const h2y = y2 - head * Math.sin(ang + 0.5);
  return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2} M${f1(h1x)} ${f1(h1y)} L${x2} ${y2} L${f1(h2x)} ${f1(h2y)}`;
};

const circle = (cx: number, cy: number, r: number, ry = r) =>
  `M${f1(cx - r)} ${f1(cy)} a${f1(r)} ${f1(ry)} 0 1 0 ${f1(2 * r)} 0 a${f1(r)} ${f1(ry)} 0 1 0 ${f1(-2 * r)} 0 `;

const blobs = (
  x0: number,
  y0: number,
  w: number,
  h: number,
  count: number,
  seed: number,
  rmin: number,
  rmax: number,
  keep?: (x: number, y: number) => boolean,
) => {
  let d = '';
  let made = 0;
  for (let i = 0; made < count && i < count * 10; i++) {
    const x = x0 + hash(seed + i * 3.1) * w;
    const y = y0 + hash(seed * 1.7 + i * 5.3) * h;
    if (keep && !keep(x, y)) continue;
    const r = rmin + hash(seed * 2.9 + i * 7.7) * (rmax - rmin);
    d += circle(x, y, r, r * (0.7 + hash(i + seed) * 0.3));
    made++;
  }
  return d;
};

const inDome =
  (cx: number, base: number, rx: number, ry: number, k = 0.78) =>
  (x: number, y: number) =>
    ((x - cx) / rx) ** 2 + ((y - base) / ry) ** 2 < k && y < base - 12;

const catmull = (pts: Pt[]) => {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(
      p2[0] - (p3[0] - p1[0]) / 6,
    )} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
};

const coil = (x: number, y: number, len: number, ang: number, seed: number, r = 9) => {
  const loops = Math.max(2, Math.round(len / 24));
  const n = loops * 10;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const th = t * loops * Math.PI * 2;
    const lx = t * len + r * 1.1 * Math.sin(th);
    const ly = r - r * Math.cos(th) + Math.sin(t * 5 + seed) * 3;
    pts.push([x + lx * ca - ly * sa, y + lx * sa + ly * ca]);
  }
  return smooth(pts);
};

const wave = (x1: number, x2: number, y: number, amp: number, freq: number, seed: number) => {
  const pts: Pt[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      x1 + (x2 - x1) * t,
      y + amp * Math.sin(t * freq + seed) + 3 * Math.sin(t * 19 + seed),
    ]);
  }
  return smooth(pts);
};

const wheat = (x: number, y: number, s = 1) => {
  let d = `M${x} ${y + 78 * s} C${x} ${y + 50 * s} ${x + 2 * s} ${y + 30 * s} ${x} ${y + 4 * s}`;
  for (let i = 0; i < 4; i++) {
    const ky = y + (16 + i * 14) * s;
    d += ` M${x} ${ky} q${-16 * s} ${-4 * s} ${-13 * s} ${-17 * s} q${13 * s} ${4 * s} ${13 * s} ${17 * s}`;
    d += ` M${x} ${ky + 6 * s} q${16 * s} ${-4 * s} ${13 * s} ${-17 * s} q${-13 * s} ${4 * s} ${-13 * s} ${17 * s}`;
  }
  return d;
};

const star = (cx: number, cy: number, r: number) => {
  let d = '';
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + ((i * 2) % 5) * ((Math.PI * 2) / 5);
    d += `${i === 0 ? 'M' : 'L'}${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))} `;
  }
  return d;
};

const Chalk = ({
  d,
  color = CHALK,
  w = 5,
  live = false,
  delay = 0,
  dur = 0.9,
  opacity = 0.95,
  dash,
  fill = 'none',
  cls,
  ns,
}: {
  d: string;
  color?: string;
  w?: number;
  live?: boolean;
  delay?: number;
  dur?: number;
  opacity?: number;
  dash?: string;
  fill?: string;
  cls?: string;
  ns?: boolean;
}) => {
  const anim =
    !live || cls || ns
      ? undefined
      : dash
        ? `cs-sfade 0.6s ease-out ${delay}s both`
        : `cs-draw ${dur}s ${EASE_DRAW} ${delay}s both`;
  return (
    <path
      d={d}
      pathLength={dash || ns ? undefined : 1}
      className={live ? cls : undefined}
      vectorEffect={ns ? 'non-scaling-stroke' : undefined}
      style={{
        fill,
        stroke: color,
        strokeWidth: w,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        opacity,
        strokeDasharray: ns ? undefined : (dash ?? 1),
        strokeDashoffset: 0,
        animation: anim,
      }}
    />
  );
};

const Fill = ({
  d,
  color,
  live = false,
  delay = 0,
}: {
  d: string;
  color: string;
  live?: boolean;
  delay?: number;
}) => (
  <path
    d={d}
    style={{
      fill: color,
      stroke: 'none',
      animation: live ? `cs-sfade 0.8s ease-out ${delay}s both` : undefined,
    }}
  />
);

const ROUGH: CSSProperties = { overflow: 'visible', filter: 'url(#cs-rough)' };

const DUST = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='d' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 5 -2.55'/></filter><rect width='320' height='320' filter='url(#d)'/></svg>`,
)}")`;

const CLOUD = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='900'><filter id='c' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.009' numOctaves='4' seed='11' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.5 -0.62'/></filter><rect width='900' height='900' filter='url(#c)'/></svg>`,
)}")`;

const WOOD_H =
  'repeating-linear-gradient(0deg, rgba(40,20,8,0.22) 0 1px, transparent 1px 5px, rgba(255,220,170,0.06) 5px 6px, transparent 6px 11px), linear-gradient(180deg, #8C5D37 0%, #74492A 50%, #5E3A20 100%)';
const WOOD_V =
  'repeating-linear-gradient(90deg, rgba(40,20,8,0.22) 0 1px, transparent 1px 5px, rgba(255,220,170,0.06) 5px 6px, transparent 6px 11px), linear-gradient(90deg, #8C5D37 0%, #74492A 50%, #5E3A20 100%)';

const SMUDGES = [
  'radial-gradient(ellipse 640px 240px at 24% 30%, rgba(255,255,255,0.055), transparent 70%), radial-gradient(ellipse 760px 260px at 74% 72%, rgba(255,255,255,0.05), transparent 70%), radial-gradient(ellipse 420px 160px at 88% 16%, rgba(255,255,255,0.04), transparent 70%)',
  'radial-gradient(ellipse 820px 260px at 66% 26%, rgba(255,255,255,0.055), transparent 70%), radial-gradient(ellipse 600px 240px at 20% 76%, rgba(255,255,255,0.05), transparent 70%), radial-gradient(ellipse 380px 150px at 48% 54%, rgba(255,255,255,0.03), transparent 70%)',
  'radial-gradient(ellipse 560px 220px at 40% 18%, rgba(255,255,255,0.05), transparent 70%), radial-gradient(ellipse 900px 280px at 56% 82%, rgba(255,255,255,0.055), transparent 70%), radial-gradient(ellipse 420px 200px at 8% 52%, rgba(255,255,255,0.04), transparent 70%)',
];

const VIGNETTE =
  'radial-gradient(ellipse 120% 110% at 50% 45%, transparent 52%, rgba(0,0,0,0.42) 100%)';

const Swipe = ({
  left,
  top,
  w,
  h,
  rot,
}: {
  left: number;
  top: number;
  w: number;
  h: number;
  rot: number;
}) => (
  <div
    style={abs(left, top, {
      width: w,
      height: h,
      borderRadius: '50%',
      border: '70px solid rgba(255,255,255,0.03)',
      borderBottomColor: 'transparent',
      borderLeftColor: 'rgba(255,255,255,0.018)',
      filter: 'blur(14px)',
      transform: `rotate(${rot}deg)`,
    })}
  />
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <div style={abs(120, 1000, { ...HAND, fontSize: 20, color: DIM, letterSpacing: '0.05em' })}>
        Crumb School · Bread 101 · Lesson 4
      </div>
      <div
        style={{
          ...SCRIPT,
          position: 'absolute',
          right: 120,
          top: 990,
          fontSize: 34,
          color: DIM,
        }}
      >
        p. {current} of {total}
      </div>
    </>
  );
};

const ChalkStick = ({
  left,
  w,
  color,
  rot = 0,
}: {
  left: number;
  w: number;
  color: string;
  rot?: number;
}) => (
  <div
    style={abs(left, 1006, {
      width: w,
      height: 17,
      borderRadius: 8,
      background: `linear-gradient(180deg, ${color} 0%, ${color} 45%, rgba(0,0,0,0.25) 100%), ${color}`,
      boxShadow: '0 3px 4px rgba(0,0,0,0.35)',
      transform: `rotate(${rot}deg)`,
    })}
  />
);

const Ledge = () => (
  <>
    <div
      style={abs(0, 1020, {
        width: 1920,
        height: 60,
        background: WOOD_H,
        boxShadow: '0 -10px 18px rgba(0,0,0,0.45), inset 0 3px 0 rgba(255,220,170,0.18)',
      })}
    />
    <div
      style={abs(380, 1016, {
        width: 900,
        height: 10,
        background:
          'radial-gradient(ellipse 50% 100% at 50% 100%, rgba(238,237,230,0.35), transparent 70%)',
      })}
    />
    <ChalkStick left={430} w={120} color="#F2F0E8" rot={-2} />
    <ChalkStick left={590} w={74} color="#F6E08A" rot={3} />
    <ChalkStick left={700} w={96} color="#F6B9C7" rot={-1} />
    <ChalkStick left={830} w={56} color="#AEDAEE" rot={6} />
    <div
      style={abs(1460, 978, {
        width: 220,
        height: 46,
        borderRadius: 6,
        background: 'linear-gradient(180deg, #A7744A 0 46%, #3B3B3B 46% 100%)',
        boxShadow:
          '0 6px 10px rgba(0,0,0,0.45), inset 0 -10px 0 rgba(220,220,214,0.45), inset 0 2px 0 rgba(255,230,190,0.35)',
        transform: 'rotate(-1.5deg)',
      })}
    />
  </>
);

const Board = ({
  children,
  variant = 0,
  ledge = false,
  footer = true,
}: {
  children: ReactNode;
  variant?: 0 | 1 | 2;
  ledge?: boolean;
  footer?: boolean;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: WOOD_H,
      fontFamily: 'var(--osd-font-body)',
      color: CHALK,
    }}
  >
    <div style={abs(0, 0, { width: 22, height: 1080, background: WOOD_V })} />
    <div style={abs(1898, 0, { width: 22, height: 1080, background: WOOD_V })} />
    <div
      style={abs(22, 22, {
        width: 1876,
        height: 1036,
        overflow: 'hidden',
        background: `${SMUDGES[variant]}, ${VIGNETTE}, ${SLATE}`,
        boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.4), inset 0 6px 24px rgba(0,0,0,0.55)',
      })}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: CLOUD,
          backgroundSize: '900px 900px',
          backgroundPosition: `${variant * 310}px ${variant * 170}px`,
          opacity: 0.3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: DUST,
          backgroundSize: '320px 320px',
          opacity: 0.14,
        }}
      />
      {variant === 0 && (
        <>
          <Swipe left={980} top={520} w={900} h={520} rot={-8} />
          <Swipe left={-200} top={-120} w={760} h={420} rot={12} />
        </>
      )}
      {variant === 1 && (
        <>
          <Swipe left={200} top={560} w={1000} h={560} rot={6} />
          <Swipe left={1300} top={-160} w={700} h={440} rot={-14} />
        </>
      )}
      {variant === 2 && (
        <>
          <Swipe left={620} top={-200} w={980} h={520} rot={4} />
          <Swipe left={-160} top={600} w={720} h={420} rot={-10} />
        </>
      )}
    </div>
    <div style={{ position: 'absolute', inset: 0, filter: 'url(#cs-chalk)' }}>
      {children}
      {footer && <Footer />}
    </div>
    {ledge && <Ledge />}
  </div>
);

const Title = ({
  eyebrow,
  children,
  color = CHALK,
  line = YELLOW,
}: {
  eyebrow: string;
  children: ReactNode;
  color?: string;
  line?: string;
}) => {
  const live = useIsActivePage();
  return (
    <>
      <div
        style={abs(130, 84, {
          ...HAND,
          fontSize: 26,
          color: BLUE,
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          ...fadeIn(live, 0),
        })}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          ...SCRIPT,
          ...abs(128, 116),
          fontSize: 104,
          color,
          ...writeIn(live, 0.1, 0.9),
        }}
      >
        <span style={{ position: 'relative', display: 'inline-block' }}>
          {children}
          <svg
            viewBox="0 0 100 12"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: -8,
              bottom: -12,
              width: 'calc(100% + 16px)',
              height: 16,
              overflow: 'visible',
              ...writeIn(live, 0.95, 0.7),
            }}
          >
            <Chalk
              d="M1 8 C 20 4, 38 9, 56 6 S 86 3, 99 6"
              color={line}
              w={5}
              ns
              live={live}
              delay={0.95}
              dur={0.6}
            />
          </svg>
        </span>
      </h2>
    </>
  );
};

const Sub = ({ children }: { children: ReactNode }) => (
  <span style={{ fontSize: '0.52em', position: 'relative', top: '0.3em' }}>{children}</span>
);

const Doodle = ({
  left,
  top,
  w,
  h,
  d,
  color = CHALK,
  sw = 4,
  opacity = 0.75,
  delay = 0,
}: {
  left: number;
  top: number;
  w: number;
  h: number;
  d: string;
  color?: string;
  sw?: number;
  opacity?: number;
  delay?: number;
}) => {
  const live = useIsActivePage();
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ ...abs(left, top), ...ROUGH }}>
      <Chalk d={d} color={color} w={sw} opacity={opacity} live={live} delay={delay} dur={1} />
    </svg>
  );
};

const LOAF_OUTLINE =
  'M86 440 C 52 360, 92 272, 196 228 C 290 188, 430 184, 530 222 C 622 258, 664 350, 618 440';
const LOAF_BODY =
  'M86 440 C 52 360, 92 272, 196 228 C 290 188, 430 184, 530 222 C 622 258, 664 350, 618 440 C 480 452, 220 452, 86 440 Z';
const LOAF_BASE = 'M66 442 C 220 458, 480 458, 640 440';
const LOAF_SCORE = 'M196 306 C 286 252, 408 238, 540 268';
const LOAF_EAR = 'M212 290 C 298 236, 420 224, 548 250';
const LOAF_FLOUR = blobs(150, 220, 420, 110, 22, 3, 1.5, 3, inDome(352, 440, 280, 240, 0.86));
const STEAM =
  'M262 186 C 238 158, 286 134, 260 104 C 238 78, 278 58, 264 32 M362 172 C 338 142, 388 118, 362 86 C 340 58, 380 36, 366 10 M462 188 C 440 160, 486 138, 462 108 C 442 84, 480 64, 468 40';

const HappyLoaf = ({ live, face = false }: { live: boolean; face?: boolean }) => (
  <svg viewBox="0 0 700 560" style={{ width: '100%', height: '100%', ...ROUGH }}>
    <Fill d={LOAF_BODY} color="rgba(244,222,132,0.10)" live={live} delay={1.2} />
    <Chalk d={LOAF_OUTLINE} w={8} live={live} delay={0.3} dur={1.3} />
    <Chalk d={LOAF_BASE} w={6} live={live} delay={1.4} dur={0.6} opacity={0.8} />
    <Chalk d={LOAF_SCORE} color={YELLOW} w={7} live={live} delay={1.7} dur={0.6} />
    <Chalk d={LOAF_EAR} color={YELLOW} w={4} live={live} delay={2} dur={0.5} opacity={0.6} />
    <Chalk d={LOAF_FLOUR} w={3} live={live} delay={2.2} dur={0.8} opacity={0.55} />
    <Chalk d="M120 478 L590 478" dash="12 16" w={4} opacity={0.35} live={live} delay={2.2} />
    <g
      className="cs-steam"
      style={{ animation: live ? 'cs-steam 3.4s ease-in-out 3s infinite' : undefined }}
    >
      <Chalk d={STEAM} w={5} live={live} delay={2.4} dur={1} opacity={0.6} />
    </g>
    {face && (
      <>
        <Chalk
          d="M286 336 q14 -18 28 0 M392 336 q14 -18 28 0"
          w={6}
          live={live}
          delay={2.6}
          dur={0.4}
        />
        <Chalk d="M318 372 Q 354 410 392 372" w={6} live={live} delay={2.9} dur={0.4} />
        <Fill
          d={`${circle(268, 372, 20, 12)}${circle(440, 372, 20, 12)}`}
          color="rgba(244,175,192,0.45)"
          live={live}
          delay={3.1}
        />
      </>
    )}
  </svg>
);

const Cover: Page = () => {
  const live = useIsActivePage();
  return (
    <Board ledge footer={false}>
      <Doodle left={124} top={84} w={60} h={90} d={wheat(30, 4)} color={YELLOW} sw={3.5} />
      <div style={abs(190, 92, { ...SCRIPT, fontSize: 60, color: YELLOW, ...writeIn(live, 0.1) })}>
        Crumb School
      </div>
      <div
        style={abs(194, 156, {
          ...HAND,
          fontSize: 28,
          color: DIM,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 0.5),
        })}
      >
        Bread 101 · Lesson 4 of 8
      </div>
      <div
        style={abs(1460, 100, {
          ...HAND,
          fontSize: 26,
          color: PINK,
          whiteSpace: 'nowrap',
          transform: 'rotate(-4deg)',
          ...fadeIn(live, 3.2),
        })}
      >
        phones in aprons, please :)
      </div>
      <h1
        style={{
          ...SCRIPT,
          ...abs(118, 250),
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 0.92,
          ...writeIn(live, 0.4, 1.2),
        }}
      >
        Why bread
        <br />
        <span style={{ position: 'relative', display: 'inline-block' }}>
          rises.
          <svg
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: -10,
              bottom: 4,
              width: 'calc(100% + 30px)',
              height: 30,
              overflow: 'visible',
              ...writeIn(live, 1.7, 0.7),
            }}
          >
            <Chalk
              d="M2 12 C 22 6, 46 14, 70 8 S 94 6, 99 9 M8 18 C 30 13, 60 17, 92 13"
              color={PINK}
              w={6}
              ns
              live={live}
              delay={1.7}
              dur={0.8}
            />
          </svg>
        </span>
      </h1>
      <div
        style={abs(130, 772, {
          ...HAND,
          fontSize: 40,
          whiteSpace: 'nowrap',
          ...writeIn(live, 2.1, 1),
        })}
      >
        Yeast, gluten, warmth — and a little patience.
      </div>
      <div
        style={abs(130, 848, {
          ...HAND,
          fontSize: 27,
          color: DIM,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 2.8),
        })}
      >
        Tue 14 Oct · 6:30 pm · Kitchen 2 · with Chef Mara Okafor
      </div>
      <div style={abs(1150, 250, { width: 640, height: 512 })}>
        <HappyLoaf live={live} />
      </div>
      <svg width={220} height={170} viewBox="0 0 220 170" style={{ ...abs(1580, 290), ...ROUGH }}>
        <Chalk
          d={arrow(150, 66, 160, 120, 108, 152, 16)}
          color={PINK}
          w={4}
          live={live}
          delay={3}
        />
      </svg>
      <div
        style={abs(1640, 300, {
          ...HAND,
          fontSize: 28,
          color: PINK,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 3),
        })}
      >
        the ear!
      </div>
      <div
        style={abs(1310, 790, {
          ...HAND,
          fontSize: 24,
          color: DIM,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 2.6),
        })}
      >
        fig. 1 — a happy loaf
      </div>
    </Board>
  );
};

const AgendaItem = ({
  n,
  label,
  left,
  top,
  color,
  delay,
}: {
  n: number;
  label: string;
  left: number;
  top: number;
  color: string;
  delay: number;
}) => {
  const live = useIsActivePage();
  return (
    <div
      style={abs(left, top, {
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        ...writeIn(live, delay, 0.6),
      })}
    >
      <div style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
        <svg
          viewBox="0 0 72 72"
          style={{ position: 'absolute', inset: 0, width: 72, height: 72, overflow: 'visible' }}
        >
          <Chalk d={scribble(36, 36, 31, 29, n)} color={color} w={3.5} />
        </svg>
        <div
          style={{
            ...SCRIPT,
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            color,
          }}
        >
          {n}
        </div>
      </div>
      <div style={{ ...HAND, fontSize: 40, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
};

const CLOCK = `${scribble(50, 50, 40, 40, 4, 1.05)} M50 50 L50 24 M50 50 L68 58 M50 12 L50 18 M88 50 L82 50 M50 88 L50 82 M12 50 L18 50`;

const Agenda: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={1}>
      <Title eyebrow="Lesson 4 · Tue 14 Oct">Tonight on the board</Title>
      <AgendaItem n={1} label="Meet the yeast" left={130} top={300} color={YELLOW} delay={0.5} />
      <AgendaItem
        n={2}
        label="The fermentation sum"
        left={130}
        top={400}
        color={YELLOW}
        delay={0.65}
      />
      <AgendaItem n={3} label="The gluten net" left={130} top={500} color={YELLOW} delay={0.8} />
      <AgendaItem n={4} label="Warmth vs. time" left={130} top={600} color={BLUE} delay={0.95} />
      <AgendaItem n={5} label="Baker's maths" left={130} top={700} color={BLUE} delay={1.1} />
      <AgendaItem n={6} label="A sourdough day" left={740} top={300} color={BLUE} delay={1.25} />
      <AgendaItem n={7} label="Feeding the starter" left={740} top={400} color={PINK} delay={1.4} />
      <AgendaItem n={8} label="Oven spring" left={740} top={500} color={PINK} delay={1.55} />
      <AgendaItem n={9} label="What went wrong?" left={740} top={600} color={PINK} delay={1.7} />
      <AgendaItem n={10} label="Pop quiz!" left={740} top={700} color={CHALK} delay={1.85} />
      <div style={abs(1380, 300, { width: 400, height: 440, transform: 'rotate(-2deg)' })}>
        <svg
          viewBox="0 0 400 440"
          style={{ position: 'absolute', inset: 0, width: 400, height: 440, ...ROUGH }}
        >
          <Chalk
            d={sketchRect(10, 10, 380, 420, 3)}
            dash="16 12"
            w={4}
            color={YELLOW}
            opacity={0.7}
            live={live}
            delay={2.1}
          />
          <g transform="translate(150 40)">
            <Chalk d={CLOCK} w={4} live={live} delay={2.3} dur={1} />
          </g>
        </svg>
        <div
          style={abs(0, 160, {
            width: 400,
            textAlign: 'center',
            ...SCRIPT,
            fontSize: 76,
            color: YELLOW,
            ...writeIn(live, 2.6),
          })}
        >
          7:45 pm
        </div>
        <div
          style={abs(0, 250, {
            width: 400,
            textAlign: 'center',
            ...HAND,
            fontSize: 36,
            ...fadeIn(live, 2.9),
          })}
        >
          tasting break
        </div>
        <div
          style={abs(0, 310, {
            width: 400,
            textAlign: 'center',
            ...HAND,
            fontSize: 28,
            color: DIM,
            ...fadeIn(live, 3.1),
          })}
        >
          warm focaccia
          <br />& good butter
        </div>
      </div>
      <div style={abs(130, 840, { ...HAND, fontSize: 28, color: DIM, ...fadeIn(live, 2.2) })}>
        About two hours · aprons on · bring your notebook to the bench
      </div>
    </Board>
  );
};

const Circled = ({
  children,
  color,
  live,
  delay,
}: {
  children: ReactNode;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <span style={{ position: 'relative', display: 'inline-block', marginLeft: 18 }}>
    {children}
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        left: -30,
        top: -10,
        width: 'calc(100% + 60px)',
        height: 'calc(100% + 28px)',
        overflow: 'visible',
        ...writeIn(live, delay, 0.7),
      }}
    >
      <Chalk
        d={scribble(50, 50, 49, 46, 3, 1.12, 40)}
        color={color}
        w={5}
        ns
        live={live}
        delay={delay}
        dur={0.8}
      />
    </svg>
  </span>
);

const Underlined = ({
  children,
  color,
  live,
  delay,
}: {
  children: ReactNode;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <span style={{ position: 'relative', display: 'inline-block' }}>
    {children}
    <svg
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        left: -6,
        bottom: -6,
        width: 'calc(100% + 12px)',
        height: 26,
        overflow: 'visible',
        ...writeIn(live, delay, 0.7),
      }}
    >
      <Chalk
        d="M1 6 C 24 3, 52 8, 99 4 M4 16 C 30 12, 66 17, 96 13"
        color={color}
        w={5}
        ns
        live={live}
        delay={delay}
        dur={0.7}
      />
    </svg>
  </span>
);

const Boxed = ({
  children,
  color,
  live,
  delay,
}: {
  children: ReactNode;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <span style={{ position: 'relative', display: 'inline-block', margin: '0 12px' }}>
    {children}
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: 'absolute',
        left: -18,
        top: -2,
        width: 'calc(100% + 44px)',
        height: 'calc(100% + 18px)',
        overflow: 'visible',
        ...writeIn(live, delay, 0.7),
      }}
    >
      <Chalk
        d="M-2 4 L 101 2 M99 -3 L 98 100 M102 97 L 1 99 M2 103 L 0 0"
        color={color}
        w={5}
        ns
        live={live}
        delay={delay}
        dur={0.8}
      />
    </svg>
  </span>
);

const KeyTag = ({
  left,
  glyph,
  color,
  word,
  meaning,
  delay,
}: {
  left: number;
  glyph: string;
  color: string;
  word: string;
  meaning: string;
  delay: number;
}) => {
  const live = useIsActivePage();
  return (
    <div
      style={abs(left, 800, {
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        whiteSpace: 'nowrap',
        ...fadeIn(live, delay),
      })}
    >
      <svg width={70} height={50} viewBox="0 0 70 50" style={ROUGH}>
        <Chalk d={glyph} color={color} w={4} />
      </svg>
      <span style={{ ...SCRIPT, fontSize: 56, color }}>{word}</span>
      <span style={{ ...HAND, fontSize: 30, color: DIM }}>{meaning}</span>
    </div>
  );
};

const BUBBLES = `${scribble(80, 70, 46, 46, 2, 1.05)} ${scribble(170, 120, 30, 30, 5, 1.05)} ${scribble(110, 170, 22, 22, 7, 1.05)} ${scribble(210, 50, 18, 18, 9, 1.05)} ${scribble(190, 190, 12, 12, 4, 1.05)}`;

const BigIdea: Page = () => {
  const live = useIsActivePage();
  const line: CSSProperties = { ...SCRIPT, fontSize: 108, lineHeight: 1 };
  return (
    <Board variant={2}>
      <div
        style={abs(130, 120, {
          ...HAND,
          fontSize: 30,
          color: BLUE,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 0),
        })}
      >
        The big idea — copy this into your notebook
      </div>
      <Doodle
        left={1520}
        top={90}
        w={240}
        h={220}
        d={BUBBLES}
        color={BLUE}
        opacity={0.6}
        delay={3.6}
      />
      <div style={{ ...line, ...abs(130, 250), ...writeIn(live, 0.2, 1.1) }}>
        Bread rises because{' '}
        <Circled color={YELLOW} live={live} delay={1.2}>
          tiny living things
        </Circled>
      </div>
      <div style={{ ...line, ...abs(130, 410), ...writeIn(live, 1.6, 0.9) }}>
        <Underlined color={PINK} live={live} delay={2.3}>
          breathe out gas
        </Underlined>{' '}
        —
      </div>
      <div style={{ ...line, ...abs(130, 570), ...writeIn(live, 2.6, 1.1) }}>
        and a{' '}
        <Boxed color={BLUE} live={live} delay={3.5}>
          stretchy net
        </Boxed>{' '}
        catches it.
      </div>
      <KeyTag
        left={130}
        glyph={scribble(35, 25, 28, 18, 2)}
        color={YELLOW}
        word="yeast"
        meaning="a living fungus"
        delay={3.9}
      />
      <KeyTag
        left={680}
        glyph="M4 22 C 24 18, 44 24, 66 20 M8 34 C 30 30, 50 34, 62 31"
        color={PINK}
        word="CO₂"
        meaning="the gas"
        delay={4.1}
      />
      <KeyTag
        left={1160}
        glyph="M6 6 L 64 5 M63 3 L 64 46 M66 44 L 5 45 M6 48 L 5 4"
        color={BLUE}
        word="gluten"
        meaning="the net, from wheat"
        delay={4.3}
      />
    </Board>
  );
};

const CELL_WALL = scribble(400, 360, 240, 200, 1, 1.08, 44);
const CELL_INNER = scribble(400, 360, 220, 182, 6, 1.02, 44);
const BUD = scribble(652, 196, 100, 88, 3, 1.08, 32);
const NUCLEUS = scribble(326, 392, 66, 62, 2, 1.1, 30);
const VACUOLE = scribble(476, 296, 84, 62, 8, 1.1, 30);
const GRANULES = `${circle(278, 262, 9, 6)}${circle(232, 338, 7, 5)}${circle(540, 428, 10, 7)}${circle(430, 482, 8, 6)}${circle(574, 356, 7, 5)}${circle(372, 238, 6, 5)}${circle(250, 448, 8, 6)}${circle(488, 400, 6, 5)}`;

const LabelLine = ({ d, live, delay }: { d: string; live: boolean; delay: number }) => (
  <Chalk d={d} w={2.5} opacity={0.7} live={live} delay={delay} dur={0.4} />
);

const YeastCell = ({ live }: { live: boolean }) => (
  <svg width={900} height={660} viewBox="0 0 900 660" style={{ ...abs(100, 270), ...ROUGH }}>
    <Fill d={CELL_WALL} color="rgba(238,237,230,0.06)" live={live} delay={1} />
    <Chalk d={CELL_WALL} w={7} live={live} delay={0.3} dur={1.2} />
    <Chalk d={CELL_INNER} w={3} opacity={0.5} live={live} delay={0.9} dur={1} />
    <Fill d={BUD} color="rgba(244,222,132,0.08)" live={live} delay={1.5} />
    <Chalk d={BUD} color={YELLOW} w={6} live={live} delay={1.2} dur={0.8} />
    <Chalk d={circle(664, 192, 22, 20)} color={BLUE} w={4} live={live} delay={1.8} dur={0.5} />
    <Chalk d={NUCLEUS} color={BLUE} w={5} live={live} delay={1.6} dur={0.7} />
    <Fill d={circle(342, 380, 18, 15)} color="rgba(163,212,234,0.55)" live={live} delay={2} />
    <Chalk d={VACUOLE} color={PINK} w={4} live={live} delay={1.9} dur={0.7} />
    <Chalk d={GRANULES} w={3} opacity={0.6} live={live} delay={2.2} dur={0.6} />
    <LabelLine d="M150 150 C 180 170, 200 190, 228 216" live={live} delay={2.5} />
    <text x={40} y={140} style={{ ...SVG_TEXT, fontSize: 32 }}>
      cell wall
    </text>
    <LabelLine d="M180 560 C 220 520, 250 470, 278 440" live={live} delay={2.6} />
    <text x={40} y={600} style={{ ...SVG_TEXT, fontSize: 32, fill: BLUE }}>
      nucleus (the recipe)
    </text>
    <LabelLine d="M420 92 C 440 140, 456 190, 466 236" live={live} delay={2.7} />
    <text x={330} y={78} style={{ ...SVG_TEXT, fontSize: 32, fill: PINK }}>
      vacuole (the pantry)
    </text>
    <LabelLine d="M806 128 C 790 150, 770 168, 748 180" live={live} delay={2.8} />
    <text x={720} y={112} style={{ ...SVG_TEXT, fontSize: 32, fill: YELLOW }}>
      a new bud!
    </text>
    <Chalk d="M520 620 L 780 620 M520 606 L 520 634 M780 606 L 780 634" w={3} opacity={0.8} />
    <text x={650} y={596} textAnchor="middle" style={{ ...SVG_TEXT, fontSize: 26, fill: DIM }}>
      about 7 µm across
    </text>
  </svg>
);

const Fact = ({
  left,
  top,
  big,
  color,
  children,
  delay,
}: {
  left: number;
  top: number;
  big: string;
  color: string;
  children: ReactNode;
  delay: number;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(left, top, { width: 340 })}>
      <div style={{ ...SCRIPT, fontSize: 80, color, ...writeIn(live, delay, 0.7) }}>{big}</div>
      <div
        style={{
          ...HAND,
          fontSize: 28,
          marginTop: 10,
          color: CHALK,
          ...fadeIn(live, delay + 0.4),
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Yeast: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={0}>
      <Title eyebrow="Part 1 · the living bit">Meet the yeast</Title>
      <YeastCell live={live} />
      <Fact left={1070} top={300} big="10 billion" color={YELLOW} delay={3}>
        cells in a single gram
        <br />
        of fresh yeast
      </Fact>
      <Fact left={1450} top={300} big="~7 µm" color={BLUE} delay={3.3}>
        across — ten side by
        <br />
        side span one hair
      </Fact>
      <Fact left={1070} top={580} big="90 min" color={PINK} delay={3.6}>
        to bud a brand-new
        <br />
        cell when it's cosy
      </Fact>
      <Fact left={1450} top={580} big="60 °C" color={CHALK} delay={3.9}>
        where yeast
        <br />
        stops for good
      </Fact>
      <div
        style={abs(1070, 846, {
          ...HAND,
          fontSize: 28,
          color: DIM,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 4.3),
        })}
      >
        <span style={{ fontStyle: 'italic', color: CHALK }}>Saccharomyces cerevisiae</span> — “sugar
        fungus”
      </div>
    </Board>
  );
};

const LabelBelow = ({
  cx,
  color,
  word,
  children,
}: {
  cx: number;
  color: string;
  word: string;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(cx - 260, 510, { width: 520, textAlign: 'center' })}>
      <svg
        width={40}
        height={70}
        viewBox="0 0 40 70"
        style={{ display: 'block', margin: '0 auto', ...ROUGH }}
      >
        <Chalk d={arrow(20, 66, 16, 36, 20, 6, 14)} color={color} w={4} live={live} cls="cs-ds" />
      </svg>
      <div
        className={live ? 'cs-w' : undefined}
        style={{ ...SCRIPT, fontSize: 64, color, marginTop: 6 }}
      >
        {word}
      </div>
      <div style={{ ...HAND, fontSize: 30, color: DIM, marginTop: 8 }}>{children}</div>
    </div>
  );
};

const Term = ({
  left,
  width,
  children,
  delay,
  size = 136,
}: {
  left: number;
  width: number;
  children: ReactNode;
  delay: number;
  size?: number;
}) => {
  const live = useIsActivePage();
  return (
    <div
      style={abs(left, 320, {
        ...SCRIPT,
        width,
        textAlign: 'center',
        fontSize: size,
        ...writeIn(live, delay, 0.7),
      })}
    >
      {children}
    </div>
  );
};

const Equation: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={1}>
      <Title eyebrow="Part 1 · fermentation">What yeast actually does</Title>
      <Term left={130} width={500} delay={0.4}>
        C<Sub>6</Sub>H<Sub>12</Sub>O<Sub>6</Sub>
      </Term>
      <svg width={190} height={80} viewBox="0 0 190 80" style={{ ...abs(640, 360), ...ROUGH }}>
        <Chalk d={arrow(16, 42, 90, 34, 170, 42, 22)} w={7} live={live} delay={1} dur={0.5} />
      </svg>
      <Term left={850} width={330} delay={1.3}>
        2 CO<Sub>2</Sub>
      </Term>
      <Term left={1180} width={110} delay={1.8} size={110}>
        +
      </Term>
      <Term left={1290} width={500} delay={2}>
        2 C<Sub>2</Sub>H<Sub>5</Sub>OH
      </Term>
      <Steps>
        <Step>
          <LabelBelow cx={380} color={YELLOW} word="sugar">
            from the flour's starch
          </LabelBelow>
        </Step>
        <Step>
          <div>
            <svg
              width={380}
              height={220}
              viewBox="0 0 380 220"
              style={{ ...abs(826, 290), ...ROUGH }}
            >
              <Chalk
                d={scribble(190, 110, 172, 92, 4, 1.12, 40)}
                color={PINK}
                w={6}
                live={live}
                cls="cs-ds"
              />
            </svg>
            <LabelBelow cx={1015} color={PINK} word="carbon dioxide">
              the bubbles = the rise!
            </LabelBelow>
          </div>
        </Step>
        <Step>
          <div>
            <svg
              width={460}
              height={30}
              viewBox="0 0 460 30"
              style={{ ...abs(1310, 470), ...ROUGH }}
            >
              <Chalk d={wobble(6, 14, 454, 12, 3, 3)} color={BLUE} w={6} live={live} cls="cs-ds" />
            </svg>
            <LabelBelow cx={1540} color={BLUE} word="alcohol">
              flavour & aroma — bakes off
            </LabelBelow>
          </div>
        </Step>
        <Step>
          <div style={abs(250, 790, { width: 1420, height: 150 })}>
            <svg
              width={1420}
              height={150}
              viewBox="0 0 1420 150"
              style={{ position: 'absolute', inset: 0, ...ROUGH }}
            >
              <Chalk
                d={sketchRect(8, 8, 1404, 134, 5, 14)}
                w={4}
                opacity={0.75}
                live={live}
                cls="cs-ds"
              />
            </svg>
            <div
              className={live ? 'cs-w' : undefined}
              style={abs(0, 22, {
                width: 1420,
                textAlign: 'center',
                ...HAND,
                fontSize: 38,
                whiteSpace: 'nowrap',
              })}
            >
              In grams: 180 g sugar → 88 g CO₂ + 92 g alcohol (+ a little warmth)
            </div>
            <div
              style={abs(0, 82, {
                width: 1420,
                textAlign: 'center',
                ...SCRIPT,
                fontSize: 48,
                color: YELLOW,
              })}
            >
              The yeast keeps the energy — we keep the bubbles.
            </div>
          </div>
        </Step>
      </Steps>
    </Board>
  );
};

const TANGLE = [
  coil(50, 70, 110, 0.4, 1),
  coil(240, 50, 90, -0.3, 2),
  coil(420, 70, 120, 0.9, 3),
  coil(560, 50, 80, 0.2, 4),
  coil(70, 210, 100, -0.7, 5),
  coil(250, 190, 130, 0.1, 6),
  coil(470, 230, 100, -0.5, 7),
  coil(100, 320, 120, 0.25, 8),
  coil(330, 300, 90, 0.9, 9),
  coil(520, 330, 110, -0.2, 10),
].join(' ');
const GLIADIN_LOOSE = blobs(30, 30, 620, 370, 28, 4, 4, 7);

const NET_BUBBLES: [number, number, number][] = [
  [150, 130, 52],
  [340, 100, 38],
  [510, 160, 60],
  [250, 290, 64],
  [440, 320, 46],
  [600, 320, 32],
  [96, 330, 30],
];

const netStrands = () => {
  let d = '';
  for (let i = 0; i < 6; i++) d += `${wave(24, 656, 46 + i * 66, 9, 9 + i, i * 1.7)} `;
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 150;
    d += `${wobble(x, 20, x + 150, 410, i + 3, 6)} ${wobble(x + 150, 20, x, 410, i + 9, 6)} `;
  }
  return d;
};
const NET = netStrands();
const NET_HOLES = NET_BUBBLES.map(([x, y, r]) => circle(x, y, r)).join('');
const NET_RINGS = NET_BUBBLES.map(([x, y, r], i) =>
  scribble(x, y, r + 7, r + 6, i + 2, 1.06, 28),
).join(' ');
const GLIADIN_NET = blobs(30, 30, 620, 370, 16, 12, 3, 5);
const PANEL = sketchRect(6, 6, 668, 418, 2, 12);

const Gluten: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={2}>
      <Title eyebrow="Part 2 · the stretchy bit">The gluten net</Title>
      <svg width={680} height={430} viewBox="0 0 680 430" style={{ ...abs(130, 290), ...ROUGH }}>
        <Chalk d={PANEL} w={3} opacity={0.45} live={live} delay={0.4} dur={0.8} />
        <Chalk d={TANGLE} color={YELLOW} w={3.5} live={live} delay={0.8} dur={1.6} />
        <Chalk d={GLIADIN_LOOSE} color={PINK} w={3.5} live={live} delay={1.4} dur={1} />
      </svg>
      <div
        style={abs(130, 740, {
          width: 680,
          textAlign: 'center',
          ...SCRIPT,
          fontSize: 52,
          ...writeIn(live, 1.6),
        })}
      >
        just mixed: a tangle
      </div>
      <div
        style={abs(820, 410, {
          width: 280,
          textAlign: 'center',
          ...SCRIPT,
          fontSize: 52,
          color: YELLOW,
          ...writeIn(live, 2),
        })}
      >
        knead!
      </div>
      <svg width={260} height={80} viewBox="0 0 260 80" style={{ ...abs(830, 470), ...ROUGH }}>
        <Chalk d={arrow(16, 46, 130, 20, 240, 44, 22)} w={6} live={live} delay={2.1} dur={0.6} />
      </svg>
      <div
        style={abs(820, 560, {
          width: 280,
          textAlign: 'center',
          ...HAND,
          fontSize: 28,
          color: DIM,
          ...fadeIn(live, 2.4),
        })}
      >
        10 minutes, or
        <br />
        rest + 4 folds
      </div>
      <svg width={680} height={430} viewBox="0 0 680 430" style={{ ...abs(1110, 290), ...ROUGH }}>
        <Chalk d={PANEL} w={3} opacity={0.45} live={live} delay={2.4} dur={0.8} />
        <Chalk d={NET} color={YELLOW} w={3} opacity={0.85} live={live} delay={2.7} dur={1.8} />
        <Chalk d={GLIADIN_NET} color={PINK} w={3} opacity={0.8} live={live} delay={3.4} dur={0.8} />
        <Fill d={NET_HOLES} color="#22392F" live={live} delay={3.8} />
        <Chalk d={NET_RINGS} color={BLUE} w={4.5} live={live} delay={3.9} dur={1.2} />
        <text
          x={150}
          y={142}
          textAnchor="middle"
          style={{ ...SVG_SCRIPT, fontSize: 36, fill: BLUE }}
        >
          CO₂
        </text>
        <text
          x={510}
          y={172}
          textAnchor="middle"
          style={{ ...SVG_SCRIPT, fontSize: 40, fill: BLUE }}
        >
          CO₂
        </text>
        <text
          x={250}
          y={302}
          textAnchor="middle"
          style={{ ...SVG_SCRIPT, fontSize: 42, fill: BLUE }}
        >
          CO₂
        </text>
      </svg>
      <div
        style={abs(1110, 740, {
          width: 680,
          textAlign: 'center',
          ...SCRIPT,
          fontSize: 52,
          ...writeIn(live, 4.4),
        })}
      >
        kneaded: a net that traps gas
      </div>
      <GlutenKey left={130} glyph={coil(4, 14, 58, 0, 1, 7)} color={YELLOW} delay={4.6}>
        glutenin — springy strength
      </GlutenKey>
      <GlutenKey
        left={720}
        glyph={`${circle(14, 24, 6)}${circle(36, 18, 5)}${circle(56, 28, 6)}`}
        color={PINK}
        delay={4.8}
      >
        gliadin — lets it stretch
      </GlutenKey>
      <GlutenKey left={1290} glyph={scribble(34, 24, 22, 20, 3, 1.05)} color={BLUE} delay={5}>
        CO₂ bubbles, trapped
      </GlutenKey>
    </Board>
  );
};

const GlutenKey = ({
  left,
  glyph,
  color,
  delay,
  children,
}: {
  left: number;
  glyph: string;
  color: string;
  delay: number;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div
      style={abs(left, 862, {
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        whiteSpace: 'nowrap',
        ...fadeIn(live, delay),
      })}
    >
      <svg width={70} height={48} viewBox="0 0 70 48" style={ROUGH}>
        <Chalk d={glyph} color={color} w={3.5} />
      </svg>
      <span style={{ ...HAND, fontSize: 32 }}>{children}</span>
    </div>
  );
};

const tx = (t: number) => 130 + (t - 16) * 62;
const hy = (h: number) => 560 - h * 54;
const RISE_PTS: Pt[] = [
  [tx(17), hy(9)],
  [tx(18), hy(8)],
  [tx(21), hy(6)],
  [tx(24), hy(4.5)],
  [tx(27), hy(3.5)],
  [tx(30), hy(2.75)],
  [tx(31.5), hy(2.45)],
];
const RISE_CURVE = catmull(RISE_PTS);
const POINT_MARKS = [
  [18, 8],
  [21, 6],
  [24, 4.5],
  [27, 3.5],
  [30, 2.75],
]
  .map(([t, h]) => {
    const x = tx(t);
    const y = hy(h);
    return `M${x - 10} ${y - 10} L${x + 10} ${y + 10} M${x + 10} ${y - 10} L${x - 10} ${y + 10}`;
  })
  .join(' ');
const hatch = () => {
  let d = '';
  for (let x = tx(24) - 120; x < tx(27); x += 22) {
    const x0 = Math.max(x, tx(24));
    const y0 = 560 - (x0 - x) * 2.2;
    const x1 = Math.min(x + 220, tx(27));
    const y1 = 560 - (x1 - x) * 2.2;
    if (y1 < 156) {
      const xc = x + (560 - 156) / 2.2;
      d += `M${f1(x0)} ${f1(y0)} L${f1(Math.min(xc, tx(27)))} ${f1(Math.max(156, y1))} `;
    } else d += `M${f1(x0)} ${f1(y0)} L${f1(x1)} ${f1(y1)} `;
  }
  return d;
};
const HATCH = hatch();
const AXES = `${wobble(130, 566, 1110, 560, 2, 2.5)} M1090 548 L1112 560 L1090 572 ${wobble(126, 566, 130, 50, 5, 2.5)} M118 72 L130 48 L142 72`;
const X_TICKS = [18, 21, 24, 27, 30].map((t) => `M${tx(t)} 552 L${tx(t)} 572`).join(' ');
const Y_TICKS = [2, 4, 6, 8].map((h) => `M120 ${hy(h)} L140 ${hy(h)}`).join(' ');

const AxisLabel = ({
  x,
  y,
  children,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
}) => (
  <text x={x} y={y} textAnchor={anchor} style={{ ...SVG_TEXT, fontSize: 28, fill: DIM }}>
    {children}
  </text>
);

const RiseChart = ({ live }: { live: boolean }) => (
  <svg width={1160} height={660} viewBox="0 0 1160 660" style={{ ...abs(100, 280), ...ROUGH }}>
    <Chalk d={HATCH} color={YELLOW} w={3} opacity={0.35} live={live} delay={1.2} dur={0.8} />
    <Chalk d={AXES} w={5} live={live} delay={0.3} dur={1} />
    <Chalk d={`${X_TICKS} ${Y_TICKS}`} w={3} opacity={0.7} live={live} delay={0.9} dur={0.5} />
    <AxisLabel x={tx(18)} y={612}>
      18°
    </AxisLabel>
    <AxisLabel x={tx(21)} y={612}>
      21°
    </AxisLabel>
    <AxisLabel x={tx(24)} y={612}>
      24°
    </AxisLabel>
    <AxisLabel x={tx(27)} y={612}>
      27°
    </AxisLabel>
    <AxisLabel x={tx(30)} y={612}>
      30°
    </AxisLabel>
    <AxisLabel x={104} y={hy(2) + 10} anchor="end">
      2 h
    </AxisLabel>
    <AxisLabel x={104} y={hy(4) + 10} anchor="end">
      4 h
    </AxisLabel>
    <AxisLabel x={104} y={hy(6) + 10} anchor="end">
      6 h
    </AxisLabel>
    <AxisLabel x={104} y={hy(8) + 10} anchor="end">
      8 h
    </AxisLabel>
    <AxisLabel x={1110} y={652} anchor="end">
      dough temperature (°C)
    </AxisLabel>
    <text x={160} y={46} style={{ ...SVG_TEXT, fontSize: 28, fill: DIM }}>
      hours for the bulk to rise +50%
    </text>
    <text
      x={(tx(24) + tx(27)) / 2}
      y={120}
      textAnchor="middle"
      style={{ ...SVG_SCRIPT, fontSize: 46, fill: YELLOW }}
    >
      sweet spot
    </text>
    <Chalk
      d={`M${tx(22)} 550 L${tx(22)} 290`}
      dash="10 12"
      color={PINK}
      w={4}
      live={live}
      delay={2.6}
    />
    <text
      x={tx(22) - 16}
      y={526}
      textAnchor="end"
      style={{ ...SVG_TEXT, fontSize: 28, fill: PINK }}
    >
      our kitchen tonight: 22 °C
    </text>
    <Chalk d={RISE_CURVE} color={CHALK} w={6} live={live} delay={1.6} dur={1.4} />
    <Chalk d={POINT_MARKS} color={YELLOW} w={4} live={live} delay={2.4} dur={0.6} />
    <text x={tx(18) + 22} y={hy(8) - 18} style={{ ...SVG_SCRIPT, fontSize: 42 }}>
      8 h
    </text>
    <text x={tx(30) + 6} y={hy(2.75) - 28} style={{ ...SVG_SCRIPT, fontSize: 42 }}>
      2¾ h
    </text>
  </svg>
);

const Note = ({
  top,
  head,
  color,
  children,
  delay,
  size = 48,
}: {
  top: number;
  head: string;
  color: string;
  children: ReactNode;
  delay: number;
  size?: number;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(1330, top, { width: 470 })}>
      <div style={{ ...SCRIPT, fontSize: size, color, ...writeIn(live, delay, 0.6) }}>{head}</div>
      <div
        style={{ ...HAND, fontSize: 28, color: CHALK, marginTop: 8, ...fadeIn(live, delay + 0.3) }}
      >
        {children}
      </div>
    </div>
  );
};

const Temperature: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={0}>
      <Title eyebrow="Part 3 · temperature & time">Warmth = speed</Title>
      <RiseChart live={live} />
      <Note top={300} head="+3 °C" color={YELLOW} delay={3} size={84}>
        ≈ a quarter quicker
        <br />
        rise, every time
      </Note>
      <Note top={530} head="too warm: 30 °C +" color={PINK} delay={3.4}>
        slack, sour and boozy —
        <br />
        it rises before it tastes
      </Note>
      <Note top={720} head="too cold: under 18 °C" color={BLUE} delay={3.8}>
        slow, but so tasty.
        <br />
        Hello, fridge!
      </Note>
    </Board>
  );
};

const PctRow = ({
  top,
  name,
  grams,
  pct,
  color = CHALK,
  bold,
  delay,
}: {
  top: number;
  name: string;
  grams: string;
  pct: string;
  color?: string;
  bold?: boolean;
  delay: number;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(130, top, { width: 860, height: 56, ...writeIn(live, delay, 0.55) })}>
      <div
        style={abs(0, 0, {
          ...HAND,
          fontSize: 36,
          fontWeight: bold ? 700 : 400,
          whiteSpace: 'nowrap',
        })}
      >
        {name}
      </div>
      <div
        style={{
          ...HAND,
          position: 'absolute',
          right: 220,
          top: 0,
          fontSize: 36,
          fontWeight: bold ? 700 : 400,
          whiteSpace: 'nowrap',
        }}
      >
        {grams}
      </div>
      <div style={{ ...SCRIPT, position: 'absolute', right: 20, top: -2, fontSize: 54, color }}>
        {pct}
      </div>
    </div>
  );
};

const MathRow = ({
  top,
  label,
  color = CHALK,
  children,
  note,
}: {
  top: number;
  label: string;
  color?: string;
  children: ReactNode;
  note?: string;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(1170, top, { width: 630 })}>
      <div style={abs(0, 18, { ...HAND, fontSize: 26, color: DIM, width: 110 })}>{label}</div>
      <div
        className={live ? 'cs-w' : undefined}
        style={abs(110, 0, { ...SCRIPT, fontSize: 62, color })}
      >
        {children}
      </div>
      {note && (
        <div style={abs(112, 70, { ...HAND, fontSize: 24, color: DIM, whiteSpace: 'nowrap' })}>
          {note}
        </div>
      )}
    </div>
  );
};

const Bakers: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={1}>
      <Title eyebrow="Part 4 · the recipe as percentages">Baker's maths</Title>
      <div
        style={abs(130, 276, {
          ...SCRIPT,
          fontSize: 50,
          color: YELLOW,
          ...writeIn(live, 0.5, 0.9),
        })}
      >
        Flour = 100%. Everything else is a % of flour.
      </div>
      <div
        style={abs(130, 362, {
          width: 860,
          ...HAND,
          fontSize: 24,
          color: DIM,
          ...fadeIn(live, 0.9),
        })}
      >
        <span>ingredient</span>
        <span style={{ position: 'absolute', right: 220 }}>grams</span>
        <span style={{ position: 'absolute', right: 20 }}>baker's %</span>
      </div>
      <PctRow top={410} name="Strong white flour" grams="900 g" pct="90%" delay={1} />
      <PctRow top={476} name="Wholemeal flour" grams="100 g" pct="10%" delay={1.15} />
      <PctRow top={542} name="Water" grams="720 g" pct="72%" color={BLUE} delay={1.3} />
      <PctRow top={608} name="Starter" grams="200 g" pct="20%" color={PINK} delay={1.45} />
      <PctRow top={674} name="Salt" grams="20 g" pct="2%" delay={1.6} />
      <svg
        width={1000}
        height={160}
        viewBox="0 0 1000 160"
        style={{ ...abs(110, 380), ...ROUGH, pointerEvents: 'none' }}
      >
        <Chalk
          d="M882 40 C 898 40, 894 64, 902 72 C 894 80, 898 104, 882 104"
          color={YELLOW}
          w={4}
          live={live}
          delay={1.8}
          dur={0.5}
        />
      </svg>
      <div style={abs(1018, 438, { ...SCRIPT, fontSize: 40, color: YELLOW, ...fadeIn(live, 2) })}>
        100%
      </div>
      <svg width={880} height={20} viewBox="0 0 880 20" style={{ ...abs(120, 742), ...ROUGH }}>
        <Chalk d={wobble(4, 10, 876, 8, 4, 2)} w={4} live={live} delay={1.8} dur={0.6} />
      </svg>
      <PctRow top={764} name="Dough total" grams="1940 g" pct="194%" bold delay={2} />
      <div
        style={abs(130, 860, {
          ...HAND,
          fontSize: 28,
          color: BLUE,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 2.3),
        })}
      >
        72% water = a friendly dough: soft, not too sticky.
      </div>
      <svg width={20} height={620} viewBox="0 0 20 620" style={{ ...abs(1124, 290), ...ROUGH }}>
        <Chalk
          d={wobble(10, 4, 10, 616, 7, 3)}
          w={3}
          opacity={0.35}
          live={live}
          delay={0.6}
          dur={0.8}
        />
      </svg>
      <div style={abs(1170, 286, { ...SCRIPT, fontSize: 60, color: PINK, ...writeIn(live, 2.4) })}>
        Scale it up:
      </div>
      <Steps>
        <Step>
          <MathRow top={390} label="want">
            2 × 900 g = 1800 g
          </MathRow>
        </Step>
        <Step>
          <MathRow top={510} label="flour" color={YELLOW} note="(the whole recipe is 194%)">
            1800 ÷ 1.94 = 928 g
          </MathRow>
        </Step>
        <Step>
          <MathRow top={650} label="water" color={BLUE}>
            928 × 0.72 = 668 g
          </MathRow>
        </Step>
        <Step>
          <MathRow top={770} label="salt">
            928 × 0.02 = 19 g
          </MathRow>
        </Step>
      </Steps>
    </Board>
  );
};

const TimeEvent = ({
  x,
  above,
  time,
  title,
  sub,
  color = YELLOW,
  width = 360,
  delay,
}: {
  x: number;
  above: boolean;
  time: string;
  title: string;
  sub: string;
  color?: string;
  width?: number;
  delay: number;
}) => {
  const live = useIsActivePage();
  const top = above ? 400 : 650;
  return (
    <>
      <svg
        width={20}
        height={50}
        viewBox="0 0 20 50"
        style={{ ...abs(x - 10, above ? 552 : 604), ...ROUGH }}
      >
        <Chalk d="M10 4 L10 46" w={4} live={live} delay={delay} dur={0.3} />
      </svg>
      <div
        style={abs(x - width / 2, top, {
          width,
          textAlign: 'center',
          ...fadeIn(live, delay + 0.1, 0.5),
        })}
      >
        <div style={{ ...SCRIPT, fontSize: 54, color }}>{time}</div>
        <div style={{ ...HAND, fontSize: 32, whiteSpace: 'nowrap', marginTop: 4 }}>{title}</div>
        <div style={{ ...HAND, fontSize: 28, color: DIM, whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
    </>
  );
};

const MOON =
  'M1556 578 C 1530 584, 1520 616, 1544 628 C 1520 630, 1508 600, 1524 584 C 1532 576, 1546 574, 1556 578';
const SUN = `${scribble(1730, 330, 24, 24, 2, 1.05)} M1730 288 L1730 296 M1730 364 L1730 372 M1688 330 L1696 330 M1764 330 L1772 330 M1700 300 L1706 306 M1754 354 L1760 360 M1760 300 L1754 306 M1700 360 L1706 354`;

const SourdoughDay: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={2}>
      <Title eyebrow="Part 5 · Saturday morning → Sunday morning">A sourdough day</Title>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ ...abs(0, 0), ...ROUGH, pointerEvents: 'none' }}
      >
        <Chalk d={wobble(150, 602, 1460, 598, 3, 3, 14)} w={6} live={live} delay={0.3} dur={1.4} />
        <Chalk d="M1460 600 L1640 600" dash="12 14" w={5} live={live} delay={1.5} />
        <Chalk d={wobble(1640, 600, 1770, 602, 5, 2)} w={6} live={live} delay={1.6} dur={0.4} />
        <Fill d={MOON} color="rgba(244,222,132,0.25)" live={live} delay={2} />
        <Chalk d={MOON} color={YELLOW} w={4} live={live} delay={1.9} dur={0.6} />
        <Chalk d={SUN} color={YELLOW} w={4} opacity={0.7} live={live} delay={0.4} dur={0.8} />
      </svg>
      <div style={abs(1576, 538, { ...SCRIPT, fontSize: 34, color: YELLOW, ...fadeIn(live, 2.2) })}>
        z z z
      </div>
      <TimeEvent x={210} above time="9:00" title="Feed the starter" sub="1 : 5 : 5" delay={0.6} />
      <TimeEvent
        x={420}
        above={false}
        time="13:00"
        title="Mix flour + water"
        sub="then rest 45 min"
        delay={0.8}
      />
      <TimeEvent
        x={630}
        above
        time="13:45"
        title="Add starter + salt"
        sub="squish it all in"
        delay={1}
      />
      <TimeEvent
        x={840}
        above={false}
        time="14:15"
        title="Stretch & fold"
        sub="4 sets, every 30 min"
        delay={1.2}
      />
      <TimeEvent
        x={1050}
        above
        time="16:30"
        title="Bulk rise done"
        sub="+50%, domed, jiggly"
        color={PINK}
        delay={1.4}
      />
      <TimeEvent
        x={1260}
        above={false}
        time="17:00"
        title="Shape"
        sub="into a floured basket"
        delay={1.6}
      />
      <TimeEvent
        x={1460}
        above
        time="17:30"
        title="Into the fridge"
        sub="12–14 h, cold & slow"
        color={BLUE}
        delay={1.8}
      />
      <TimeEvent
        x={1650}
        above={false}
        time="Sun 8:00"
        title="Bake!"
        sub="250 °C · 45 min"
        color={PINK}
        width={280}
        delay={2.2}
      />
      <div
        style={abs(130, 870, {
          ...SCRIPT,
          fontSize: 50,
          color: CHALK,
          whiteSpace: 'nowrap',
          ...writeIn(live, 2.6, 1),
        })}
      >
        ≈ 23 hours, start to finish ·{' '}
        <span style={{ color: YELLOW }}>about 40 minutes of actual work</span>
      </div>
    </Board>
  );
};

const JAR_BODY =
  'M50 62 L210 62 Q232 62 232 86 L232 344 Q232 372 204 372 L56 372 Q28 372 28 344 L28 86 Q28 62 50 62 Z';
const JAR_LID =
  'M40 22 L220 22 L220 60 L40 60 Z M64 22 L64 60 M96 22 L96 60 M128 22 L128 60 M160 22 L160 60 M192 22 L192 60';

const Jar = ({
  left,
  level,
  dome,
  bubbles,
  seed,
  streak,
  time,
  state,
  color = CHALK,
  delay,
}: {
  left: number;
  level: number;
  dome: number;
  bubbles: number;
  seed: number;
  streak?: number;
  time: string;
  state: string;
  color?: string;
  delay: number;
}) => {
  const live = useIsActivePage();
  const surface = `M34 ${level} Q130 ${level - dome * 2} 226 ${level}`;
  const body = `${surface} L226 346 Q226 366 204 366 L56 366 Q34 366 34 346 Z`;
  const holes = blobs(
    44,
    level,
    172,
    360 - level,
    bubbles,
    seed,
    3,
    8,
    (_x, y) => y > level + 8 && y < 356,
  );
  const streaks = streak
    ? `${wobble(70, streak, 74, level - 10, seed, 1.5, 4)} ${wobble(120, streak + 6, 118, level - 16, seed + 1, 1.5, 4)} ${wobble(176, streak - 4, 180, level - 8, seed + 2, 1.5, 4)}`
    : '';
  return (
    <>
      <svg width={260} height={390} viewBox="0 0 260 390" style={{ ...abs(left, 340), ...ROUGH }}>
        <Fill d={body} color="rgba(238,237,230,0.13)" live={live} delay={delay + 0.6} />
        <Chalk d={surface} w={4} live={live} delay={delay + 0.5} dur={0.4} />
        <Chalk d={holes} w={2.5} opacity={0.75} live={live} delay={delay + 0.8} dur={0.6} />
        {streak && (
          <Chalk d={streaks} w={3} opacity={0.5} live={live} delay={delay + 0.8} dur={0.5} />
        )}
        <Chalk d={JAR_BODY} w={6} live={live} delay={delay} dur={0.8} />
        <Chalk d={JAR_LID} w={4} opacity={0.8} live={live} delay={delay + 0.3} dur={0.5} />
        <Chalk
          d="M22 282 C 90 290, 170 276, 238 284"
          color={PINK}
          w={8}
          opacity={0.9}
          live={live}
          delay={delay + 0.4}
          dur={0.4}
        />
      </svg>
      <div
        style={abs(left - 20, 744, {
          width: 300,
          textAlign: 'center',
          ...fadeIn(live, delay + 0.6),
        })}
      >
        <div style={{ ...SCRIPT, fontSize: 56, color }}>{time}</div>
        <div style={{ ...HAND, fontSize: 30, whiteSpace: 'nowrap', marginTop: 4 }}>{state}</div>
      </div>
    </>
  );
};

const Starter: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={0}>
      <Title eyebrow="Part 6 · a pet that lives in a jar">Feeding the starter</Title>
      <div
        style={abs(130, 264, {
          display: 'flex',
          alignItems: 'baseline',
          gap: 24,
          whiteSpace: 'nowrap',
          ...writeIn(live, 0.5, 1),
        })}
      >
        <span style={{ ...SCRIPT, fontSize: 66, color: YELLOW }}>1 : 5 : 5</span>
        <span style={{ ...HAND, fontSize: 32 }}>20 g starter + 100 g flour + 100 g water</span>
      </div>
      <div
        style={abs(1340, 252, {
          ...HAND,
          fontSize: 28,
          color: PINK,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          transform: 'rotate(-2deg)',
          ...fadeIn(live, 4),
        })}
      >
        smells like yoghurt = happy
        <br />
        smells like nail polish = hungry!
      </div>
      <Jar
        left={170}
        level={282}
        dome={2}
        bubbles={4}
        seed={3}
        time="0 h"
        state="just fed"
        delay={0.8}
      />
      <Jar
        left={580}
        level={200}
        dome={8}
        bubbles={12}
        seed={7}
        time="3 h"
        state="bubbly & rising"
        delay={1.4}
      />
      <Jar
        left={990}
        level={112}
        dome={20}
        bubbles={22}
        seed={11}
        time="6 h"
        state="peak! use it now"
        color={YELLOW}
        delay={2}
      />
      <Jar
        left={1400}
        level={232}
        dome={-6}
        bubbles={6}
        seed={5}
        streak={118}
        time="10 h"
        state="collapsed: feed me"
        color={PINK}
        delay={2.6}
      />
      <svg
        width={1920}
        height={200}
        viewBox="0 0 1920 200"
        style={{ ...abs(0, 440), ...ROUGH, pointerEvents: 'none' }}
      >
        <Chalk
          d={arrow(456, 100, 500, 84, 556, 100, 16)}
          w={4}
          opacity={0.7}
          live={live}
          delay={1.3}
          dur={0.4}
        />
        <Chalk
          d={arrow(866, 100, 910, 84, 966, 100, 16)}
          w={4}
          opacity={0.7}
          live={live}
          delay={1.9}
          dur={0.4}
        />
        <Chalk
          d={arrow(1276, 100, 1320, 84, 1376, 100, 16)}
          w={4}
          opacity={0.7}
          live={live}
          delay={2.5}
          dur={0.4}
        />
      </svg>
      <Doodle
        left={1236}
        top={318}
        w={80}
        h={80}
        d={star(40, 40, 30)}
        color={YELLOW}
        sw={4}
        delay={3}
      />
      <div
        style={abs(130, 880, {
          ...HAND,
          fontSize: 28,
          color: DIM,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 3.4),
        })}
      >
        Pink line = the rubber band you put on right after feeding. At 24 °C it peaks in about 6
        hours.
      </div>
    </Board>
  );
};

const SMALL_LOAF = 'M40 420 C 30 350, 120 300, 200 300 C 280 300, 370 350, 360 420 Z';
const BIG_LOAF = 'M430 420 C 410 320, 510 196, 640 190 C 770 196, 870 320, 850 420 Z';
const GHOST_LOAF = 'M480 420 C 470 350, 560 300, 640 300 C 720 300, 810 350, 800 420';
const SMALL_CRUMB = blobs(50, 300, 300, 120, 26, 5, 3, 7, inDome(200, 420, 160, 120, 0.72));
const BIG_CRUMB = blobs(450, 190, 380, 230, 32, 9, 4, 13, inDome(640, 420, 205, 230, 0.7));

const SpringRow = ({
  top,
  temp,
  color,
  children,
}: {
  top: number;
  temp: string;
  color: string;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(1020, top, { width: 780, height: 100 })}>
      <svg width={40} height={40} viewBox="0 0 40 40" style={{ ...abs(0, 14), ...ROUGH }}>
        <Chalk
          d={scribble(20, 20, 13, 13, 3, 1.1, 24)}
          color={color}
          w={4}
          live={live}
          cls="cs-ds"
        />
      </svg>
      <div
        className={live ? 'cs-w' : undefined}
        style={abs(60, 0, { ...SCRIPT, fontSize: 50, color })}
      >
        {temp}
      </div>
      <div style={abs(62, 54, { ...HAND, fontSize: 30, whiteSpace: 'nowrap' })}>{children}</div>
    </div>
  );
};

const OvenSpring: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={1}>
      <Title eyebrow="Part 7 · the last big push">Oven spring</Title>
      <svg width={880} height={500} viewBox="0 0 880 500" style={{ ...abs(100, 300), ...ROUGH }}>
        <Fill d={SMALL_LOAF} color="rgba(244,222,132,0.08)" live={live} delay={0.8} />
        <Chalk d={SMALL_LOAF} w={6} live={live} delay={0.3} dur={0.9} />
        <Chalk d={SMALL_CRUMB} w={2.5} opacity={0.7} live={live} delay={0.9} dur={0.6} />
        <Chalk
          d={arrow(250, 268, 340, 196, 450, 226, 18)}
          color={YELLOW}
          w={5}
          live={live}
          delay={1.3}
          dur={0.6}
        />
        <text
          x={340}
          y={170}
          textAnchor="middle"
          style={{ ...SVG_SCRIPT, fontSize: 40, fill: YELLOW }}
        >
          250 °C, lid on
        </text>
        <Fill d={BIG_LOAF} color="rgba(244,222,132,0.1)" live={live} delay={2.2} />
        <Chalk d={BIG_LOAF} w={7} live={live} delay={1.8} dur={1} />
        <Chalk d={BIG_CRUMB} w={3} opacity={0.75} live={live} delay={2.4} dur={0.8} />
        <Chalk
          d="M576 214 C 620 192, 690 186, 744 206 M592 204 C 636 178, 700 174, 752 194"
          color={YELLOW}
          w={6}
          live={live}
          delay={2.7}
          dur={0.4}
        />
        <Chalk d={GHOST_LOAF} dash="10 12" color={PINK} w={4} live={live} delay={3} />
        <text x={872} y={168} textAnchor="end" style={{ ...SVG_SCRIPT, fontSize: 52, fill: PINK }}>
          +25%
        </text>
        <text x={200} y={476} textAnchor="middle" style={{ ...SVG_TEXT, fontSize: 30 }}>
          into the oven
        </text>
        <text x={640} y={476} textAnchor="middle" style={{ ...SVG_TEXT, fontSize: 30 }}>
          20 minutes later
        </text>
      </svg>
      <div style={abs(130, 830, { ...HAND, fontSize: 30, color: DIM, ...fadeIn(live, 3.3) })}>
        Lid on for the first 20 min: the steam keeps
        <br />
        the crust soft, so the loaf can keep stretching.
      </div>
      <svg width={40} height={600} viewBox="0 0 40 600" style={{ ...abs(1020, 300), ...ROUGH }}>
        <Chalk
          d={wobble(20, 30, 20, 560, 4, 2.5)}
          w={3}
          opacity={0.35}
          live={live}
          delay={0.4}
          dur={1}
        />
      </svg>
      <Steps>
        <Step>
          <SpringRow top={290} temp="30 → 50 °C" color={YELLOW}>
            the yeast's last frenzy of gas
          </SpringRow>
        </Step>
        <Step>
          <SpringRow top={410} temp="~60 °C" color={CHALK}>
            yeast is done; water turns to steam
          </SpringRow>
        </Step>
        <Step>
          <SpringRow top={530} temp="~75 °C" color={BLUE}>
            gluten firms up: the shape is locked
          </SpringRow>
        </Step>
        <Step>
          <SpringRow top={650} temp="150 °C + on the crust" color={PINK}>
            browning — that toasty flavour
          </SpringRow>
        </Step>
        <Step>
          <SpringRow top={770} temp="96 °C in the middle" color={YELLOW}>
            done! now wait an hour to slice
          </SpringRow>
        </Step>
      </Steps>
    </Board>
  );
};

const FLAT_LOAF = 'M40 210 C 36 168, 120 146, 260 144 C 400 146, 484 168, 480 210 Z';
const FLAT_CRUMB = blobs(
  70,
  146,
  380,
  60,
  10,
  4,
  6,
  16,
  (x, y) => y < 200 && y > 156 && x > 80 && x < 440,
);
const FLAT_SPREAD = `${arrow(60, 236, 30, 236, 6, 236, 12)} ${arrow(460, 236, 490, 236, 514, 236, 12)}`;
const DENSE_LOAF = 'M140 210 C 130 130, 196 96, 260 96 C 324 96, 390 130, 380 210 Z';
const DENSE_CRUMB = blobs(150, 100, 220, 110, 46, 2, 1.5, 3, inDome(260, 210, 120, 114, 0.7));
const DENSE_GUM = wave(160, 360, 192, 3, 14, 2);
const SOUR_LOAF = 'M90 210 C 80 124, 170 70, 260 70 C 350 70, 440 124, 430 210 Z';
const SOUR_FACE =
  'M206 130 L226 142 L206 152 M314 130 L294 142 L314 152 M222 184 C 236 172, 250 192, 262 180 C 274 170, 288 190, 300 180';
const SOUR_ZING = 'M70 80 L54 64 M60 112 L36 108 M450 80 L466 64 M460 112 L484 108 M260 40 L260 18';

const Fault = ({
  left,
  name,
  color,
  drawing,
  likely,
  fix,
  delay,
}: {
  left: number;
  name: string;
  color: string;
  drawing: ReactNode;
  likely: ReactNode;
  fix: ReactNode;
  delay: number;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(left, 280, { width: 520, height: 640 })}>
      <svg width={520} height={260} viewBox="0 0 520 260" style={{ ...abs(0, 0), ...ROUGH }}>
        {drawing}
      </svg>
      <div style={abs(0, 270, { ...SCRIPT, fontSize: 70, color, ...writeIn(live, delay, 0.6) })}>
        {name}
      </div>
      <div style={abs(0, 358, { ...fadeIn(live, delay + 0.3) })}>
        <div style={{ ...HAND, fontSize: 22, color: DIM, letterSpacing: '0.08em' }}>LIKELY</div>
        <div style={{ ...HAND, fontSize: 28, whiteSpace: 'nowrap' }}>{likely}</div>
        <div style={{ ...HAND, fontSize: 22, color: DIM, letterSpacing: '0.08em', marginTop: 16 }}>
          TRY
        </div>
        <div style={{ ...HAND, fontSize: 28, whiteSpace: 'nowrap', color }}>{fix}</div>
      </div>
    </div>
  );
};

const Faults: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={2}>
      <Title eyebrow="Part 8 · the loaf doctor is in">What went wrong?</Title>
      <Doodle
        left={655}
        top={300}
        w={20}
        h={580}
        d={wobble(10, 10, 9, 570, 3, 2.5)}
        sw={3}
        opacity={0.28}
        delay={0.3}
      />
      <Doodle
        left={1225}
        top={300}
        w={20}
        h={580}
        d={wobble(10, 10, 11, 570, 8, 2.5)}
        sw={3}
        opacity={0.28}
        delay={0.5}
      />
      <Fault
        left={130}
        name="Flat"
        color={PINK}
        delay={1}
        drawing={
          <>
            <Chalk d={FLAT_LOAF} w={6} live={live} delay={0.4} dur={0.8} />
            <Chalk d={FLAT_CRUMB} w={2.5} opacity={0.75} live={live} delay={0.9} dur={0.5} />
            <Chalk d={FLAT_SPREAD} color={PINK} w={4} live={live} delay={1.1} dur={0.4} />
          </>
        }
        likely={
          <>
            overproofed, weak gluten,
            <br />
            too much water
          </>
        }
        fix={
          <>
            shorter bulk, one more fold,
            <br />
            drop to 70% water
          </>
        }
      />
      <Fault
        left={700}
        name="Dense"
        color={BLUE}
        delay={1.6}
        drawing={
          <>
            <Chalk d={DENSE_LOAF} w={6} live={live} delay={1} dur={0.8} />
            <Chalk d={DENSE_CRUMB} w={2} opacity={0.7} live={live} delay={1.5} dur={0.5} />
            <Chalk d={DENSE_GUM} color={BLUE} w={4} live={live} delay={1.7} dur={0.4} />
          </>
        }
        likely={
          <>
            underproofed, cold kitchen,
            <br />a sleepy starter
          </>
        }
        fix={
          <>
            a warmer spot (25 °C),
            <br />
            use starter at its peak
          </>
        }
      />
      <Fault
        left={1270}
        name="Too sour"
        color={YELLOW}
        delay={2.2}
        drawing={
          <>
            <Chalk d={SOUR_LOAF} w={6} live={live} delay={1.6} dur={0.8} />
            <Chalk d={SOUR_FACE} w={5} live={live} delay={2.1} dur={0.5} />
            <Chalk d={SOUR_ZING} color={YELLOW} w={4} live={live} delay={2.3} dur={0.4} />
          </>
        }
        likely={
          <>
            a long, warm ferment,
            <br />
            starter past its peak
          </>
        }
        fix={
          <>
            feed 1:5:5 the night before,
            <br />
            shorter time in the fridge
          </>
        }
      />
    </Board>
  );
};

const Question = ({
  left,
  top,
  n,
  children,
}: {
  left: number;
  top: number;
  n: number;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(left, top, { width: 800, ...writeIn(live, 0.3 + n * 0.25, 0.6) })}>
      <div style={abs(0, 0, { width: 64, height: 64 })}>
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ overflow: 'visible' }}>
          <Chalk d={scribble(32, 32, 28, 26, n + 2)} color={YELLOW} w={3.5} />
        </svg>
        <div
          style={{
            ...SCRIPT,
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: YELLOW,
          }}
        >
          {n}
        </div>
      </div>
      <div style={abs(90, 4, { ...HAND, fontSize: 34, width: 700 })}>{children}</div>
    </div>
  );
};

const Answer = ({ left, top, children }: { left: number; top: number; children: ReactNode }) => {
  const live = useIsActivePage();
  return (
    <div style={abs(left + 90, top, { display: 'flex', alignItems: 'center', gap: 16 })}>
      <svg width={50} height={44} viewBox="0 0 50 44" style={ROUGH}>
        <Chalk d="M6 24 L20 38 L46 6" color={PINK} w={6} live={live} cls="cs-ds" />
      </svg>
      <div className={live ? 'cs-w' : undefined} style={{ ...SCRIPT, fontSize: 58, color: PINK }}>
        {children}
      </div>
    </div>
  );
};

const Quiz: Page = () => (
  <Board variant={0}>
    <Title eyebrow="No phones, no notes — just shout it out">Pop quiz!</Title>
    <Doodle left={470} top={120} w={90} h={90} d={star(45, 45, 32)} color={YELLOW} delay={1} />
    <Doodle left={556} top={168} w={60} h={60} d={star(30, 30, 20)} color={PINK} delay={1.2} />
    <Doodle
      left={120}
      top={560}
      w={1680}
      h={20}
      d={wobble(10, 10, 1670, 9, 6, 2.5, 16)}
      sw={3}
      opacity={0.3}
      delay={0.4}
    />
    <Doodle
      left={930}
      top={290}
      w={20}
      h={580}
      d={wobble(10, 10, 9, 570, 2, 2.5)}
      sw={3}
      opacity={0.3}
      delay={0.6}
    />
    <Question left={130} top={300} n={1}>
      Which gas makes the bubbles in bread?
    </Question>
    <Question left={990} top={300} n={2}>
      Dough at 20 °C or at 26 °C:
      <br />
      which one rises first?
    </Question>
    <Question left={130} top={620} n={3}>
      500 g of flour at 75% hydration.
      <br />
      How much water?
    </Question>
    <Question left={990} top={620} n={4}>
      It spreads like a pancake and
      <br />
      smells boozy. What happened?
    </Question>
    <Steps>
      <Step>
        <Answer left={130} top={430}>
          CO₂ — carbon dioxide
        </Answer>
      </Step>
      <Step>
        <Answer left={990} top={430}>
          26 °C, about twice as fast
        </Answer>
      </Step>
      <Step>
        <Answer left={130} top={750}>
          375 g (500 × 0.75)
        </Answer>
      </Step>
      <Step>
        <Answer left={990} top={750}>
          Overproofed: shorter bulk
        </Answer>
      </Step>
    </Steps>
  </Board>
);

const Task = ({
  top,
  title,
  sub,
  delay,
  seed,
}: {
  top: number;
  title: string;
  sub: string;
  delay: number;
  seed: number;
}) => {
  const live = useIsActivePage();
  return (
    <div style={abs(130, top, { width: 960, ...writeIn(live, delay, 0.7) })}>
      <svg width={52} height={52} viewBox="0 0 52 52" style={{ ...abs(0, 6), ...ROUGH }}>
        <Chalk d={sketchRect(6, 6, 40, 40, seed, 5)} w={4} />
      </svg>
      <div style={abs(80, 0, { ...HAND, fontSize: 38, whiteSpace: 'nowrap' })}>{title}</div>
      <div style={abs(80, 54, { ...HAND, fontSize: 28, color: DIM, whiteSpace: 'nowrap' })}>
        {sub}
      </div>
    </div>
  );
};

const DiaryRow = ({
  top,
  time,
  temp,
  note,
}: {
  top: number;
  time: string;
  temp: string;
  note: string;
}) => (
  <>
    <div style={abs(30, top, { ...SCRIPT, fontSize: 40, color: BLUE })}>{time}</div>
    <div style={abs(150, top, { ...SCRIPT, fontSize: 40, color: BLUE })}>{temp}</div>
    <div style={abs(260, top, { ...SCRIPT, fontSize: 40, color: BLUE, whiteSpace: 'nowrap' })}>
      {note}
    </div>
  </>
);

const DIARY_LINES = [176, 236, 296, 356, 416, 476]
  .map((y, i) => wobble(20, y, 620, y + 1, i + 2, 1.5))
  .join(' ');

const Homework: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={1}>
      <Title eyebrow="Due Tuesday 21 October">Homework (the tasty kind)</Title>
      <Task
        top={300}
        seed={1}
        title="Bake one loaf on the Saturday plan"
        sub="a half batch is fine: 464 g of flour"
        delay={0.6}
      />
      <Task
        top={430}
        seed={5}
        title="Keep a dough diary"
        sub="room temp, dough temp, every time you touch it"
        delay={0.9}
      />
      <Task
        top={560}
        seed={9}
        title="Photograph the crumb"
        sub="slice it only once it's cool: give it an hour!"
        delay={1.2}
      />
      <Task
        top={690}
        seed={13}
        title="Bring one slice next week"
        sub="for the crumb clinic: we'll read them together"
        delay={1.5}
      />
      <div
        style={abs(1150, 290, {
          width: 640,
          height: 520,
          transform: 'rotate(1.5deg)',
          ...fadeIn(live, 1.8, 0.8),
        })}
      >
        <svg
          width={640}
          height={520}
          viewBox="0 0 640 520"
          style={{ position: 'absolute', inset: 0, ...ROUGH }}
        >
          <Chalk d={sketchRect(8, 8, 624, 504, 7, 12)} w={4} opacity={0.8} />
          <Chalk d={DIARY_LINES} w={2} opacity={0.35} />
          <Chalk d="M136 120 L136 496 M244 120 L244 496" w={2} opacity={0.35} />
        </svg>
        <div style={abs(30, 26, { ...SCRIPT, fontSize: 54 })}>Dough diary — Sat</div>
        <div style={abs(30, 128, { ...HAND, fontSize: 22, color: DIM, letterSpacing: '0.06em' })}>
          TIME
        </div>
        <div style={abs(150, 128, { ...HAND, fontSize: 22, color: DIM, letterSpacing: '0.06em' })}>
          TEMP
        </div>
        <div style={abs(260, 128, { ...HAND, fontSize: 22, color: DIM, letterSpacing: '0.06em' })}>
          NOTES
        </div>
        <DiaryRow top={186} time="9:00" temp="23°" note="fed Clint, 1:5:5" />
        <DiaryRow top={246} time="13:45" temp="25°" note="mixed. sticky!!" />
        <DiaryRow top={306} time="16:30" temp="26°" note="+50%, jiggly :)" />
        <DiaryRow top={366} time="17:30" temp="—" note="shaped, fridge" />
      </div>
      <div
        style={abs(130, 860, { ...HAND, fontSize: 32, whiteSpace: 'nowrap', ...fadeIn(live, 2.4) })}
      >
        Bonus point: name your starter. Class favourite so far:{' '}
        <span style={{ ...SCRIPT, fontSize: 48, color: YELLOW }}>Clint Yeastwood</span>
      </div>
    </Board>
  );
};

const Close: Page = () => {
  const live = useIsActivePage();
  return (
    <Board variant={2} ledge footer={false}>
      <div style={abs(130, 110, { ...HAND, fontSize: 30, color: BLUE, ...fadeIn(live, 0) })}>
        That's Lesson 4 — well done!
      </div>
      <h2
        style={{
          ...SCRIPT,
          ...abs(118, 180),
          fontSize: 200,
          lineHeight: 0.95,
          ...writeIn(live, 0.2, 1.2),
        }}
      >
        Thank you,
        <br />
        bakers!
      </h2>
      <div
        style={abs(130, 600, {
          ...SCRIPT,
          fontSize: 64,
          color: YELLOW,
          whiteSpace: 'nowrap',
          ...writeIn(live, 1.4, 0.9),
        })}
      >
        Next week · Lesson 5: Shaping & Scoring
      </div>
      <div
        style={abs(130, 700, { ...HAND, fontSize: 34, whiteSpace: 'nowrap', ...fadeIn(live, 2) })}
      >
        Bring: an apron, a sharp blade, your dough diary and one slice.
      </div>
      <div
        style={abs(130, 770, {
          ...HAND,
          fontSize: 30,
          color: DIM,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 2.3),
        })}
      >
        Questions? I'll be by the proofing cabinet.
      </div>
      <div
        style={abs(130, 850, {
          ...HAND,
          fontSize: 26,
          color: PINK,
          whiteSpace: 'nowrap',
          ...fadeIn(live, 2.6),
        })}
      >
        crumbschool.co · @crumbschool · Chef Mara Okafor
      </div>
      <div style={abs(1220, 200, { width: 580, height: 464 })}>
        <HappyLoaf live={live} face />
      </div>
      <Doodle left={1650} top={90} w={90} h={90} d={star(45, 45, 30)} color={YELLOW} delay={3.2} />
      <Doodle
        left={1225}
        top={630}
        w={60}
        h={90}
        d={wheat(30, 4)}
        color={YELLOW}
        sw={3.5}
        delay={3.4}
      />
      <Doodle
        left={1735}
        top={630}
        w={60}
        h={90}
        d={wheat(30, 4)}
        color={YELLOW}
        sw={3.5}
        delay={3.5}
      />
    </Board>
  );
};

export const meta: SlideMeta = {
  title: 'Crumb School — Why Bread Rises',
  createdAt: '2026-10-12T12:10:50.467Z',
};

export const notes: (string | undefined)[] = [
  `Welcome everyone, aprons on, grab a stool. Quick show of hands: who's had a loaf come out flat? Good — that's tonight.
Lesson 4 is the "why" lesson. Weeks 1 to 3 were technique; tonight is what's actually happening inside the dough, so the technique starts to make sense.`,
  `Here's the plan for the next two hours. First three: the science — the yeast, the sum it does, and the gluten net.
Then timing: temperature, baker's maths, a full sourdough day.
Then troubleshooting, and a quiz at the end — yes, a real one.
Focaccia break around 7:45. It's already proofing in the back, you'll smell it.`,
  `If you only write down one sentence tonight, it's this one. Read it out loud with me.
Tiny living things — that's yeast. Breathe out gas — that's carbon dioxide. A stretchy net — that's gluten.
Every bread problem you'll ever have is one of those three going wrong. Too little life, too little gas, or a weak net.`,
  `This is our hero. One cell, about seven microns across — you'd need ten of them to cross a single hair.
A gram of fresh yeast is about ten billion of them. That block in the fridge is a city.
Point at the bud: this is how yeast multiplies. In a warm dough a new cell buds off roughly every ninety minutes.
And remember sixty degrees — above that, they're gone. That number comes back when we get to the oven.`,
  `Don't panic about the chemistry; it's one line. Sugar in, gas and alcohol out.
Click: the sugar comes from the flour — enzymes break the starch down so the yeast can eat it.
Click: carbon dioxide. That's the rise. Every hole in your crumb was made by this.
Click: alcohol. It's flavour and smell, and nearly all of it bakes off — sorry.
Click: in grams, 180 of sugar gives you 88 of gas and 92 of alcohol. The yeast keeps the energy; we keep the bubbles.`,
  `Gas on its own just escapes. So we need a net.
Flour has two proteins: glutenin, these springy coils, and gliadin, these little beads that let things slide and stretch.
Add water and they're a tangle. Knead — or rest and fold — and they line up into a net.
Now the bubbles from the yeast get trapped and the dough inflates like a balloon. At the bench later, we'll do the windowpane test to check the net.`,
  `This is the one chart I want you to take home. Warmer dough, faster rise.
At 18 degrees, a sourdough bulk takes about 8 hours to grow by half. At 30, under 3.
Rule of thumb: every 3 degrees is about a quarter quicker.
Our kitchen tonight is 22 — a little cool, which is why we'll use warm water.
Aim for the sweet spot, 24 to 27. Warmer than 30 and it rises before it tastes of anything.`,
  `Baker's maths. It sounds scary; it's the friendliest thing in baking.
Flour is always 100 percent, even if it's two flours. Everything else is a percentage of the flour.
So 72 percent water means 720 grams for every kilo of flour.
Click through the scaling: we want two 900-gram loaves, 1800 grams. The recipe adds up to 194 percent, so divide by 1.94: 928 grams of flour. Water is 928 times 0.72, 668. Salt, 19.
Once it's in percentages, any size batch is one division.`,
  `Here's a real Saturday, the one you'll bake for homework.
Feed the starter at 9 in the morning. Mix flour and water at 1 and let it rest.
Add starter and salt, then four sets of stretch and folds.
Bulk ends around 4:30 when it's grown by half and jiggles. Shape at 5, fridge by 5:30, bake Sunday morning straight from cold.
Twenty-three hours start to finish, and about forty minutes of actual work. Most of baking is waiting.`,
  `The starter is a pet. Feed it 1:5:5 — 20 grams of starter, 100 flour, 100 water.
Put a rubber band on the jar right after feeding. Then watch: bubbly at 3 hours, peak at about 6 at 24 degrees — domed, doubled-plus, smells like yoghurt.
Use it at the peak. By 10 hours it's collapsed — see the streaks on the glass — and it smells like nail-polish remover. That means hungry, not dead.`,
  `The last big push happens in the first twenty minutes of the bake.
Click through: up to about 50 degrees, the yeast goes into a final frenzy. Gas expands, water turns to steam.
Around 60 the yeast dies — remember that number. Around 75 the gluten sets and the shape is locked.
The crust browns above 150. And the middle is done at 96.
That's why the lid stays on for twenty minutes: steam keeps the crust soft so the loaf can keep growing. Expect about a quarter more volume.`,
  `The loaf doctor is in. Three loaves I see every single week.
Flat: usually overproofed or a weak net. The gas has worn the gluten out. Shorter bulk, one more fold, a little less water.
Dense: the opposite — underproofed. Cold kitchen, sleepy starter. Find a warmer spot.
Too sour: fermentation went long and warm, or the starter was past its peak. Feed it the night before.
Ask: which of these have you baked? No shame — I've made all three this year.`,
  `Pop quiz. Shout it out, no phones.
Give them five seconds per question, then click to reveal each answer.
One: carbon dioxide. Two: 26 degrees, roughly twice as fast — back to the chart.
Three: 375 grams — 500 times 0.75. Four: overproofed — the net gave up. Cut the bulk shorter.
Anyone who got all four gets the first slice of focaccia.`,
  `Homework, the tasty kind. Due next Tuesday.
Bake one loaf using the Saturday plan — half a batch is fine, that's 464 grams of flour.
Keep a dough diary like this one: time, temperature, what you saw. It's how you learn your own kitchen.
Don't slice it hot — give it an hour. Photograph the crumb, and bring a slice next week for the crumb clinic.
And name your starter. Clint Yeastwood is the one to beat.`,
  `That's it for tonight — thank you, bakers.
Next week is Lesson 5, shaping and scoring, which is where that ear on the loaf comes from.
Bring your apron, a sharp blade, your dough diary and one slice.
I'll hang around by the proofing cabinet for questions. Now — focaccia.`,
];

export default [
  Cover,
  Agenda,
  BigIdea,
  Yeast,
  Equation,
  Gluten,
  Temperature,
  Bakers,
  SourdoughDay,
  Starter,
  OvenSpring,
  Faults,
  Quiz,
  Homework,
  Close,
] satisfies Page[];

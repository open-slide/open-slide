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
  palette: { bg: '#F3EDE0', text: '#0078BF', accent: '#FF48B0' },
  fonts: {
    display: '"Bricolage Grotesque", "Arial Narrow", sans-serif',
    body: '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif',
  },
  typeScale: { hero: 300, body: 34 },
  radius: 0,
};

const PAPER = 'var(--osd-bg)';
const BLUE = 'var(--osd-text)';
const PINK = 'var(--osd-accent)';
const SHEET = '#FBF8F1';
const MONO = '"Courier Prime", "Courier New", monospace';
const STAMP = '"Rubik Mono One", "Arial Black", sans-serif';

const SLIDE_ID = 'papercut-zine-fest';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,500..800&family=Courier+Prime:wght@400;700&family=Rubik+Mono+One&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes pc-reg-p {
  0% { opacity: 0; transform: translate(-18px, 11px) }
  30% { opacity: 1 }
  55% { transform: translate(5px, -3px) }
  78% { transform: translate(-2px, 1px) }
  100% { opacity: 1; transform: none }
}
@keyframes pc-reg-b {
  0% { opacity: 0; transform: translate(11px, -8px) }
  30% { opacity: 1 }
  58% { transform: translate(-3px, 2px) }
  82% { transform: translate(1px, -1px) }
  100% { opacity: 1; transform: none }
}
@keyframes pc-press {
  0% { opacity: 0; transform: translate(6px, -8px) }
  60% { opacity: 1 }
  100% { opacity: 1; transform: none }
}
@media (prefers-reduced-motion: reduce) {
  .pc-anim { animation: none !important; }
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

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const GRAIN = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42  0 0 0 0 0.34  0 0 0 0 0.22  0 0 0 1.3 -0.52'/></filter><rect width='300' height='300' filter='url(#g)'/></svg>`,
);

const SPECKLE = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='4'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 4.75'/></filter><rect width='240' height='240' filter='url(#n)'/></svg>`,
);

const WORN = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='w' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.06 0.5' numOctaves='3' stitchTiles='stitch' seed='9'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5 0 0 0 3.85'/></filter><rect width='200' height='200' filter='url(#w)'/></svg>`,
);

const COPY_NOISE = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='c' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch' seed='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0.47  0 0 0 0 0.75  9 0 0 0 -5.6'/></filter><rect width='220' height='220' filter='url(#c)'/></svg>`,
);

const inked: CSSProperties = {
  WebkitMaskImage: SPECKLE,
  maskImage: SPECKLE,
  WebkitMaskSize: '240px 240px',
  maskSize: '240px 240px',
};

const worn: CSSProperties = {
  WebkitMaskImage: WORN,
  maskImage: WORN,
  WebkitMaskSize: '200px 200px',
  maskSize: '200px 200px',
};

const dots = (c: string, step = 12, r = 3) =>
  `radial-gradient(circle, ${c} ${r}px, transparent ${r + 0.8}px) 0 0 / ${step}px ${step}px`;

const dotsDiag = (c: string, step = 12, r = 2.4) =>
  `radial-gradient(circle, ${c} ${r}px, transparent ${r + 0.8}px) 0 0 / ${step}px ${step}px, radial-gradient(circle, ${c} ${r}px, transparent ${r + 0.8}px) ${step / 2}px ${step / 2}px / ${step}px ${step}px`;

const hatch = (c: string, gap = 10, w = 3, angle = -45) =>
  `repeating-linear-gradient(${angle}deg, ${c} 0 ${w}px, transparent ${w}px ${gap}px)`;

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const torn = (w: number, h: number, seed: number, amp = 6, step = 16) => {
  const r = rng(seed);
  const pts: string[] = [];
  const p = (x: number, y: number) => pts.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
  for (let x = 0; x < w; x += step) p(x, r() * amp);
  for (let y = 0; y < h; y += step) p(w - r() * amp, y);
  for (let x = w; x > 0; x -= step) p(x, h - r() * amp);
  for (let y = h; y > 0; y -= step) p(r() * amp, y);
  return `polygon(${pts.join(', ')})`;
};

const tapeClip = (w: number, h: number) => {
  const teeth = 5;
  const t = h / teeth;
  const pts: string[] = [];
  for (let i = 0; i <= teeth; i++) pts.push(`${i % 2 ? 6 : 0}px ${(i * t).toFixed(1)}px`);
  for (let i = teeth; i >= 0; i--) pts.push(`${w - (i % 2 ? 0 : 6)}px ${(i * t).toFixed(1)}px`);
  return `polygon(${pts.join(', ')})`;
};

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const SETTLE = 'cubic-bezier(0.3, 0.7, 0.3, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translate(5px, -4px)' },
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

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 800,
  fontStretch: '75%',
  letterSpacing: '-0.01em',
  textTransform: 'uppercase',
  margin: 0,
};

const MONO_LABEL: CSSProperties = {
  fontFamily: MONO,
  fontWeight: 700,
  fontSize: 20,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const BODY: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 'var(--osd-size-body)',
  fontWeight: 500,
  lineHeight: 1.45,
  fontStretch: '100%',
  margin: 0,
};

const NUM: CSSProperties = { fontVariantNumeric: 'tabular-nums' };

const useReg = (layer: 'p' | 'b', delay = 0): CSSProperties => {
  const live = useIsActivePage();
  return live ? { animation: `pc-reg-${layer} 0.8s ${SETTLE} ${delay}s both` } : {};
};

const usePress = (delay = 0): CSSProperties => {
  const live = useIsActivePage();
  return live ? { animation: `pc-press 0.55s ${EASE_OUT} ${delay}s both` } : {};
};

const Folio = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <div style={abs(120, 1012, { ...MONO_LABEL, fontSize: 18, color: BLUE, zIndex: 21 })}>
        Papercut Zine Fest 2027 · funding proposal
      </div>
      <div
        style={{
          ...MONO_LABEL,
          ...NUM,
          fontSize: 18,
          position: 'absolute',
          right: 120,
          top: 1012,
          color: BLUE,
          zIndex: 21,
        }}
      >
        pg. {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </>
  );
};

const Sheet = ({ children, folio = true }: { children: ReactNode; folio?: boolean }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: PAPER,
      color: BLUE,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: GRAIN,
        backgroundSize: '300px 300px',
        mixBlendMode: 'multiply',
        opacity: 0.55,
        zIndex: 20,
      }}
    />
    {folio && <Folio />}
  </div>
);

const RisoText = ({
  left,
  top,
  size,
  width,
  children,
  lh = 0.86,
  dx = 6,
  dy = -4,
  delay = 0,
  flip = false,
  align = 'left',
  style,
}: {
  left: number;
  top: number;
  size: number | string;
  width?: number;
  children: ReactNode;
  lh?: number;
  dx?: number;
  dy?: number;
  delay?: number;
  flip?: boolean;
  align?: 'left' | 'center' | 'right';
  style?: CSSProperties;
}) => {
  const under = useReg('p', delay);
  const over = useReg('b', delay);
  const layer: CSSProperties = {
    ...DISPLAY,
    fontSize: size,
    lineHeight: lh,
    textAlign: align,
    mixBlendMode: 'multiply',
    ...inked,
    ...style,
  };
  return (
    <div style={abs(left, top, { width, zIndex: 4 })}>
      <div
        aria-hidden
        className="pc-anim"
        style={{
          ...layer,
          ...under,
          position: 'absolute',
          left: dx,
          top: dy,
          width: '100%',
          color: flip ? BLUE : PINK,
        }}
      >
        {children}
      </div>
      <div
        className="pc-anim"
        style={{ ...layer, ...over, position: 'relative', color: flip ? PINK : BLUE }}
      >
        {children}
      </div>
    </div>
  );
};

const Kicker = ({ n, children }: { n: string; children: ReactNode }) => (
  <div
    style={abs(120, 96, {
      ...MONO_LABEL,
      fontSize: 22,
      color: BLUE,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      zIndex: 5,
    })}
  >
    <span
      style={{
        background: PINK,
        color: SHEET,
        padding: '6px 12px 4px',
        mixBlendMode: 'multiply',
        ...inked,
        ...NUM,
      }}
    >
      Nº {n}
    </span>
    <span>{children}</span>
  </div>
);

const Title = ({
  children,
  top = 150,
  size = 92,
  width,
}: {
  children: ReactNode;
  top?: number;
  size?: number;
  width?: number;
}) => (
  <RisoText left={116} top={top} size={size} width={width} lh={0.9} dx={5} dy={-3}>
    {children}
  </RisoText>
);

type Tone = 'sheet' | 'pinkTint' | 'blueTint' | 'pink' | 'blue' | 'copy';

const toneBg = (tone: Tone) => {
  if (tone === 'pinkTint') return `${dots(PINK, 9, 1.45)}, ${SHEET}`;
  if (tone === 'blueTint') return `${dotsDiag(BLUE, 12, 1.25)}, ${SHEET}`;
  if (tone === 'pink') return PINK;
  if (tone === 'blue') return BLUE;
  if (tone === 'copy') return `${COPY_NOISE} 0 0 / 220px 220px, ${SHEET}`;
  return SHEET;
};

const Scrap = ({
  left,
  top,
  w,
  h,
  rot = 0,
  seed = 1,
  tone = 'sheet',
  amp = 6,
  shadow = true,
  delay,
  children,
}: {
  left: number;
  top: number;
  w: number;
  h: number;
  rot?: number;
  seed?: number;
  tone?: Tone;
  amp?: number;
  shadow?: boolean;
  delay?: number;
  children?: ReactNode;
}) => {
  const clip = torn(w, h, seed, amp);
  const solid = tone === 'pink' || tone === 'blue';
  const press = usePress(delay ?? 0);
  return (
    <div
      className="pc-anim"
      style={abs(left, top, {
        width: w,
        height: h,
        rotate: `${rot}deg`,
        zIndex: 2,
        ...(delay === undefined ? {} : press),
      })}
    >
      {shadow && !solid && (
        <div
          style={abs(9, 11, {
            width: w,
            height: h,
            clipPath: clip,
            background: dots(BLUE, 6, 1.5),
            mixBlendMode: 'multiply',
            opacity: 0.55,
          })}
        />
      )}
      <div
        style={abs(0, 0, {
          width: w,
          height: h,
          clipPath: clip,
          background: toneBg(tone),
          ...(solid ? { mixBlendMode: 'multiply', ...inked } : {}),
        })}
      />
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div>
    </div>
  );
};

const Tape = ({
  left,
  top,
  w = 150,
  rot = 0,
  tone = 'pink',
}: {
  left: number;
  top: number;
  w?: number;
  rot?: number;
  tone?: 'pink' | 'blue';
}) => (
  <div
    style={abs(left, top, {
      width: w,
      height: 40,
      rotate: `${rot}deg`,
      clipPath: tapeClip(w, 40),
      background:
        tone === 'pink'
          ? `${dots(PINK, 6, 2)}, rgba(255,255,255,0.35)`
          : `${dots(BLUE, 6, 1.6)}, rgba(255,255,255,0.35)`,
      mixBlendMode: 'multiply',
      zIndex: 6,
    })}
  />
);

const RectStamp = ({
  left,
  top,
  rot = -6,
  size = 28,
  color = PINK,
  children,
}: {
  left: number;
  top: number;
  rot?: number;
  size?: number;
  color?: string;
  children: ReactNode;
}) => (
  <div
    style={abs(left, top, {
      rotate: `${rot}deg`,
      border: `5px solid ${color}`,
      outline: `2px solid ${color}`,
      outlineOffset: 5,
      padding: '14px 22px 12px',
      fontFamily: STAMP,
      fontSize: size,
      lineHeight: 1.15,
      color,
      textTransform: 'uppercase',
      textAlign: 'center',
      mixBlendMode: 'multiply',
      zIndex: 7,
      ...worn,
    })}
  >
    {children}
  </div>
);

const RoundStamp = ({
  left,
  top,
  size = 260,
  rot = -12,
  ring,
  center,
  sub,
  color = PINK,
}: {
  left: number;
  top: number;
  size?: number;
  rot?: number;
  ring: string;
  center: string;
  sub?: string;
  color?: string;
}) => {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 260 260"
      style={abs(left, top, {
        rotate: `${rot}deg`,
        color,
        mixBlendMode: 'multiply',
        zIndex: 7,
        ...worn,
      })}
    >
      <defs>
        <path id={id} d="M130,130 m-98,0 a98,98 0 1,1 196,0 a98,98 0 1,1 -196,0" />
      </defs>
      <circle cx="130" cy="130" r="124" fill="none" stroke="currentColor" strokeWidth="7" />
      <circle cx="130" cy="130" r="80" fill="none" stroke="currentColor" strokeWidth="3" />
      <text fill="currentColor" style={{ fontFamily: STAMP, fontSize: 20 }}>
        <textPath href={`#${id}`} textLength="604" lengthAdjust="spacing">
          {ring}
        </textPath>
      </text>
      <text
        x="130"
        y={sub ? 134 : 146}
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: STAMP, fontSize: 42 }}
      >
        {center}
      </text>
      {sub && (
        <text
          x="130"
          y="168"
          textAnchor="middle"
          fill="currentColor"
          style={{ fontFamily: STAMP, fontSize: 14 }}
        >
          {sub}
        </text>
      )}
    </svg>
  );
};

const Scribble = ({
  left,
  top,
  w,
  h,
  d,
  head,
  color = PINK,
  sw = 5,
}: {
  left: number;
  top: number;
  w: number;
  h: number;
  d: string;
  head?: string;
  color?: string;
  sw?: number;
}) => (
  <svg
    width={w}
    height={h}
    viewBox={`0 0 ${w} ${h}`}
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={abs(left, top, { overflow: 'visible', color, mixBlendMode: 'multiply', zIndex: 8 })}
  >
    <path d={d} />
    {head && <path d={head} />}
  </svg>
);

const HalftoneDisc = ({
  left,
  top,
  size,
  step = 18,
  lx = 0.28,
  ly = 0.26,
  color = PINK,
  delay = 0,
}: {
  left: number;
  top: number;
  size: number;
  step?: number;
  lx?: number;
  ly?: number;
  color?: string;
  delay?: number;
}) => {
  const reg = useReg('p', delay);
  const R = size / 2;
  const n = Math.floor(size / step);
  const circles: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = (i + 0.5) * step;
      const y = (j + 0.5) * step;
      if (Math.hypot(x - R, y - R) > R - step * 0.3) continue;
      const t = Math.hypot(x - lx * size, y - ly * size) / size;
      const r = (step / 2) * Math.min(1, 0.1 + t * 1.05);
      circles.push(<circle key={`${i}-${j}`} cx={x} cy={y} r={r.toFixed(2)} />);
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pc-anim"
      style={abs(left, top, { fill: color, mixBlendMode: 'multiply', zIndex: 1, ...inked, ...reg })}
    >
      {circles}
    </svg>
  );
};

const CutLine = ({ top, color = BLUE }: { top: number; color?: string }) => (
  <>
    <div
      style={abs(0, top, {
        width: 1920,
        height: 0,
        borderTop: `3px dashed ${color}`,
        mixBlendMode: 'multiply',
        zIndex: 3,
      })}
    />
    <svg
      width="64"
      height="40"
      viewBox="0 0 64 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      style={abs(150, top - 20, { color, background: PAPER, zIndex: 4, padding: '0 8px' })}
    >
      <circle cx="10" cy="9" r="7" />
      <circle cx="10" cy="31" r="7" />
      <path d="M16 13 L58 30" />
      <path d="M16 27 L58 10" />
    </svg>
  </>
);

const Cover: Page = () => (
  <Sheet folio={false}>
    <HalftoneDisc left={1080} top={60} size={720} />
    <div
      style={abs(120, 104, { ...MONO_LABEL, fontSize: 22, color: BLUE, display: 'flex', gap: 18 })}
    >
      <span>Issue Nº 7</span>
      <span style={{ color: PINK }}>✂</span>
      <span>A proposal to the Port Ardley Arts Fund &amp; venue partners</span>
    </div>
    <RisoText left={112} top={196} size="var(--osd-size-hero)" dx={9} dy={-6}>
      Papercut
    </RisoText>
    <RisoText left={112} top={452} size="var(--osd-size-hero)" dx={9} dy={-6} delay={0.1}>
      Zine Fest
    </RisoText>
    <div style={abs(120, 760, { ...BODY, fontSize: 46, fontWeight: 700, lineHeight: 1.15 })}>
      A free weekend of zines, comics
      <br />
      &amp; risograph prints.
    </div>
    <div style={abs(120, 902, { ...MONO_LABEL, fontSize: 24, letterSpacing: '0.06em' })}>
      12–13 June 2027 · The Old Tram Depot, Port Ardley
    </div>
    <Scrap left={1230} top={700} w={500} h={220} rot={4} tone="blue" seed={7} amp={8}>
      <div
        style={{
          ...DISPLAY,
          ...NUM,
          position: 'absolute',
          left: 40,
          top: 26,
          fontSize: 190,
          lineHeight: 0.9,
          color: PAPER,
        }}
      >
        2027
      </div>
    </Scrap>
    <Tape left={1196} top={706} w={140} rot={-38} />
    <Tape left={1640} top={872} w={140} rot={-32} />
    <RoundStamp
      left={1560}
      top={430}
      size={250}
      rot={-14}
      ring="FREE ENTRY · ALL WELCOME · "
      center="Nº 7"
      sub="PORT ARDLEY"
      color={BLUE}
    />
    <CutLine top={990} color={PINK} />
  </Sheet>
);

const TagChip = ({
  rot,
  tone = 'blue',
  children,
}: {
  rot: number;
  tone?: 'blue' | 'pink';
  children: ReactNode;
}) => (
  <div
    style={{
      ...MONO_LABEL,
      fontSize: 22,
      padding: '10px 18px 8px',
      border: `3px solid ${tone === 'blue' ? BLUE : PINK}`,
      color: tone === 'blue' ? BLUE : PINK,
      rotate: `${rot}deg`,
      mixBlendMode: 'multiply',
      ...inked,
    }}
  >
    {children}
  </div>
);

const FactScrap = ({
  left,
  top,
  rot,
  seed,
  tone,
  big,
  label,
  delay,
}: {
  left: number;
  top: number;
  rot: number;
  seed: number;
  tone: Tone;
  big: string;
  label: string;
  delay: number;
}) => (
  <Scrap left={left} top={top} w={500} h={190} rot={rot} seed={seed} tone={tone} delay={delay}>
    <RisoText left={36} top={30} size={110} dx={4} dy={-3} delay={delay}>
      {big}
    </RisoText>
    <div
      style={abs(28, 134, { ...MONO_LABEL, fontSize: 22, background: SHEET, padding: '4px 8px' })}
    >
      {label}
    </div>
  </Scrap>
);

const WhatItIs: Page = () => (
  <Sheet>
    <Kicker n="01">What it is</Kicker>
    <Title width={1060}>A weekend for things people made by hand</Title>
    <p style={abs(120, 400, { ...BODY, width: 900 })}>
      Papercut is Port Ardley’s free, two-day festival of independent publishing: 140 tables of
      makers, a free risograph print lab, and twenty hands-on workshops, all under one tram-shed
      roof.
    </p>
    <div style={abs(120, 680, { ...MONO_LABEL, fontSize: 20, color: PINK })}>On the tables</div>
    <div
      style={abs(120, 724, {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 18,
        width: 900,
        alignItems: 'center',
      })}
    >
      <TagChip rot={-2}>Zines</TagChip>
      <TagChip rot={1.5} tone="pink">
        Comics
      </TagChip>
      <TagChip rot={-1}>Riso prints</TagChip>
      <TagChip rot={2}>Artist books</TagChip>
      <TagChip rot={-2.5} tone="pink">
        Poetry pamphlets
      </TagChip>
      <TagChip rot={1}>Tiny presses</TagChip>
    </div>
    <FactScrap
      left={1220}
      top={250}
      rot={-3}
      seed={11}
      tone="sheet"
      big="2 days"
      label="Sat + Sun, 10:00–18:00"
      delay={0.1}
    />
    <FactScrap
      left={1290}
      top={488}
      rot={2.5}
      seed={12}
      tone="pinkTint"
      big="140 tables"
      label="Up from 132 in 2026"
      delay={0.2}
    />
    <FactScrap
      left={1200}
      top={726}
      rot={-1.5}
      seed={13}
      tone="copy"
      big="£0 entry"
      label="Since the first one in 2021"
      delay={0.3}
    />
    <Tape left={1400} top={234} w={130} rot={4} tone="blue" />
    <Tape left={1660} top={478} w={120} rot={-8} />
    <Scribble
      left={1010}
      top={500}
      w={200}
      h={200}
      d="M8 160 C 50 190, 120 170, 150 110 C 168 74, 176 50, 186 24"
      head="M160 40 L186 22 L192 54"
    />
  </Sheet>
);

const NumScrap = ({
  left,
  top,
  rot,
  seed,
  tone,
  value,
  label,
  note,
  delay,
}: {
  left: number;
  top: number;
  rot: number;
  seed: number;
  tone: Tone;
  value: string;
  label: string;
  note: string;
  delay: number;
}) => (
  <Scrap left={left} top={top} w={520} h={290} rot={rot} seed={seed} tone={tone} delay={delay}>
    <RisoText left={40} top={38} size={124} dx={5} dy={-4} delay={delay} style={NUM}>
      {value}
    </RisoText>
    <div
      style={abs(30, 166, {
        background: SHEET,
        padding: '6px 10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      })}
    >
      <div style={{ ...BODY, fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>{label}</div>
      <div style={{ ...MONO_LABEL, fontSize: 20, letterSpacing: '0.04em' }}>{note}</div>
    </div>
  </Scrap>
);

const Numbers: Page = () => (
  <Sheet>
    <Kicker n="02">Last year</Kicker>
    <Title>Issue Nº 6, in numbers</Title>
    <RectStamp left={1430} top={128} rot={5} size={24}>
      June 2026
      <br />
      door count
    </RectStamp>
    <NumScrap
      left={120}
      top={290}
      rot={-1.5}
      seed={21}
      tone="sheet"
      value="6,800"
      label="visitors through the door"
      note="2,400 more than 2024"
      delay={0.05}
    />
    <NumScrap
      left={690}
      top={300}
      rot={1}
      seed={22}
      tone="pinkTint"
      value="132"
      label="exhibitor tables"
      note="Sold out in nine days"
      delay={0.12}
    />
    <NumScrap
      left={1260}
      top={286}
      rot={-0.5}
      seed={23}
      tone="copy"
      value="31,400"
      label="zines & prints sold"
      note="Average price: £4"
      delay={0.19}
    />
    <NumScrap
      left={120}
      top={630}
      rot={0.8}
      seed={24}
      tone="blueTint"
      value="£96k"
      label="kept by exhibitors"
      note="We take 0% commission"
      delay={0.26}
    />
    <NumScrap
      left={690}
      top={622}
      rot={-1.2}
      seed={25}
      tone="sheet"
      value="412"
      label="workshop places"
      note="18 sessions, every one full"
      delay={0.33}
    />
    <NumScrap
      left={1260}
      top={634}
      rot={1.6}
      seed={26}
      tone="pinkTint"
      value="2,950"
      label="people printed in the lab"
      note="Most for the first time"
      delay={0.4}
    />
    <Tape left={590} top={276} w={150} rot={-6} />
    <Tape left={1170} top={612} w={150} rot={8} tone="blue" />
  </Sheet>
);

const BAR_BASE = 900;
const BAR_SCALE = 0.0635;

const Bar = ({
  x,
  year,
  value,
  target = false,
  delay = 0,
}: {
  x: number;
  year: string;
  value: number;
  target?: boolean;
  delay?: number;
}) => {
  const h = Math.round(value * BAR_SCALE);
  const top = BAR_BASE - h;
  const under = useReg('p', delay);
  const over = useReg('b', delay);
  return (
    <>
      <div
        className="pc-anim"
        style={abs(x, top, {
          width: 150,
          height: h,
          background: target ? hatch(PINK, 14, 4) : dots(PINK, 11, 4.2),
          mixBlendMode: 'multiply',
          ...inked,
          ...under,
        })}
      />
      <div
        className="pc-anim"
        style={abs(x - 6, top + 5, {
          width: 150,
          height: h,
          boxSizing: 'border-box',
          border: `5px ${target ? 'dashed' : 'solid'} ${BLUE}`,
          borderBottom: 'none',
          mixBlendMode: 'multiply',
          ...over,
        })}
      />
      <div
        style={abs(x - 20, top - 70, {
          ...DISPLAY,
          ...NUM,
          width: 190,
          textAlign: 'center',
          fontSize: 52,
          lineHeight: 1,
          color: target ? PINK : BLUE,
        })}
      >
        {value.toLocaleString('en-GB')}
      </div>
      <div
        style={abs(x - 20, BAR_BASE + 22, {
          ...MONO_LABEL,
          ...NUM,
          width: 190,
          textAlign: 'center',
          fontSize: 24,
          color: target ? PINK : BLUE,
        })}
      >
        {year}
      </div>
    </>
  );
};

const Growth: Page = () => (
  <Sheet>
    <Kicker n="03">Growth</Kicker>
    <Title width={1100}>The queue keeps getting longer</Title>
    <div style={abs(120, 252, { ...MONO_LABEL, fontSize: 22, letterSpacing: '0.04em' })}>
      Visitors through the door, both days combined
    </div>
    <div
      style={abs(120, BAR_BASE, {
        width: 1680,
        height: 5,
        background: BLUE,
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <Bar x={220} year="2021" value={1150} delay={0} />
    <Bar x={450} year="2022" value={2400} delay={0.06} />
    <Bar x={680} year="2023" value={3700} delay={0.12} />
    <Bar x={910} year="2024" value={4900} delay={0.18} />
    <Bar x={1140} year="2025" value={5900} delay={0.24} />
    <Bar x={1370} year="2026" value={6800} delay={0.3} />
    <Bar x={1600} year="2027 goal" value={8500} target delay={0.36} />
    <Scribble
      left={300}
      top={380}
      w={1000}
      h={330}
      d="M10 300 C 160 220, 420 120, 640 70 C 800 40, 940 30, 1050 34"
      head="M1022 10 L1054 34 L1020 56"
    />
    <div
      style={abs(500, 344, {
        ...MONO_LABEL,
        fontSize: 30,
        color: PINK,
        rotate: '-7deg',
        letterSpacing: '0.02em',
      })}
    >
      ×6 in six years
    </div>
  </Sheet>
);

const PctStat = ({
  top,
  value,
  label,
  delay,
}: {
  top: number;
  value: string;
  label: ReactNode;
  delay: number;
}) => (
  <>
    <RisoText left={120} top={top} size={112} dx={5} dy={-4} delay={delay} style={NUM}>
      {value}
    </RisoText>
    <div style={abs(380, top + 14, { ...BODY, fontSize: 32, lineHeight: 1.2, width: 480 })}>
      {label}
    </div>
  </>
);

const AgeBar = ({ top, label, pct }: { top: number; label: string; pct: number }) => (
  <>
    <div style={abs(1040, top + 10, { ...MONO_LABEL, ...NUM, fontSize: 24, width: 150 })}>
      {label}
    </div>
    <div
      style={abs(1190, top, {
        width: Math.round(pct * 15.5),
        height: 48,
        background: pct >= 30 ? PINK : dots(PINK, 9, 3.3),
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <div
      style={abs(1186, top + 4, {
        width: Math.round(pct * 15.5),
        height: 48,
        border: `4px solid ${BLUE}`,
        boxSizing: 'border-box',
        mixBlendMode: 'multiply',
      })}
    />
    <div
      style={abs(1190 + Math.round(pct * 15.5) + 18, top + 2, {
        ...DISPLAY,
        ...NUM,
        fontSize: 46,
        lineHeight: 1,
      })}
    >
      {pct}%
    </div>
  </>
);

const WhoComes: Page = () => (
  <Sheet>
    <Kicker n="04">Who comes</Kicker>
    <Title width={1500}>Brand-new makers, curious readers</Title>
    <div style={abs(120, 330, { ...MONO_LABEL, fontSize: 22, color: PINK })}>
      At the tables · 132 exhibitors
    </div>
    <PctStat
      top={400}
      value="41%"
      label={
        <>
          selling their own work
          <br />
          for the very first time
        </>
      }
      delay={0.05}
    />
    <PctStat
      top={580}
      value="68%"
      label={
        <>
          based within 30 miles
          <br />
          of the depot
        </>
      }
      delay={0.15}
    />
    <PctStat
      top={760}
      value="22"
      label={
        <>
          bursary tables for
          <br />
          low-income makers
        </>
      }
      delay={0.25}
    />
    <div
      style={abs(940, 330, {
        width: 0,
        height: 600,
        borderLeft: `3px dashed ${BLUE}`,
        opacity: 0.8,
      })}
    />
    <div style={abs(1040, 330, { ...MONO_LABEL, fontSize: 22, color: PINK })}>
      In the aisles · visitors by age
    </div>
    <AgeBar top={410} label="Under 18" pct={14} />
    <AgeBar top={500} label="18–24" pct={22} />
    <AgeBar top={590} label="25–34" pct={31} />
    <AgeBar top={680} label="35–49" pct={21} />
    <AgeBar top={770} label="50 +" pct={12} />
    <RectStamp left={1460} top={800} rot={-7} size={24} color={BLUE}>
      1 in 3 at their
      <br />
      first zine fair
    </RectStamp>
  </Sheet>
);

const Voices: Page = () => (
  <Sheet>
    <Kicker n="05">In their words</Kicker>
    <Scrap left={250} top={230} w={1340} h={560} rot={-1.4} seed={41} tone="sheet" amp={8}>
      <p
        style={abs(110, 90, {
          ...BODY,
          fontSize: 70,
          fontWeight: 700,
          lineHeight: 1.18,
          width: 1130,
          letterSpacing: '-0.01em',
        })}
      >
        I printed forty copies of my first zine in the lab on Saturday morning. By four o’clock they
        were all gone.
      </p>
      <div
        style={abs(110, 420, { ...MONO_LABEL, fontSize: 24, letterSpacing: '0.06em', color: PINK })}
      >
        — Amara Osei, first-time exhibitor, Papercut Nº 6
      </div>
    </Scrap>
    <RisoText left={190} top={150} size={300} dx={8} dy={-6} style={{ fontStretch: '100%' }}>
      “
    </RisoText>
    <Tape left={220} top={236} w={170} rot={-28} />
    <Tape left={1460} top={226} w={170} rot={24} tone="blue" />
    <Scrap left={1150} top={760} w={640} h={190} rot={2.4} seed={42} tone="sheet" amp={5}>
      <p
        style={abs(40, 32, {
          ...BODY,
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1.25,
          width: 560,
        })}
      >
        “The only weekend the depot is louder than the trams ever were.”
      </p>
      <div style={abs(40, 128, { ...MONO_LABEL, fontSize: 19, letterSpacing: '0.04em' })}>
        — Glen Whitlow, depot caretaker
      </div>
    </Scrap>
    <Tape left={1430} top={744} w={120} rot={-4} tone="blue" />
  </Sheet>
);

const PLAN_X = 120;
const PLAN_Y = 250;

const Room = ({
  x,
  y,
  w,
  h,
  fill,
  name,
  note,
  lx = 24,
  ly = 22,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  name: string;
  note?: string;
  lx?: number;
  ly?: number;
}) => (
  <>
    <div
      style={abs(PLAN_X + x, PLAN_Y + y, {
        width: w,
        height: h,
        background: fill,
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <div
      style={abs(PLAN_X + x + lx, PLAN_Y + y + ly, {
        background: SHEET,
        padding: '8px 14px 6px',
        zIndex: 3,
      })}
    >
      <div style={{ ...DISPLAY, fontSize: 32, lineHeight: 1 }}>{name}</div>
      {note && (
        <div style={{ ...MONO_LABEL, fontSize: 18, letterSpacing: '0.04em', marginTop: 6 }}>
          {note}
        </div>
      )}
    </div>
  </>
);

const TableRow = ({ x, y, w }: { x: number; y: number; w: number }) => (
  <div
    style={abs(PLAN_X + x, PLAN_Y + y, {
      width: w,
      height: 26,
      background: `repeating-linear-gradient(90deg, ${BLUE} 0 44px, transparent 44px 52px)`,
      mixBlendMode: 'multiply',
      ...inked,
    })}
  />
);

const FloorPlan: Page = () => (
  <Sheet>
    <Kicker n="06">The venue</Kicker>
    <Title>The Old Tram Depot, mapped</Title>
    <div
      style={abs(PLAN_X - 8, PLAN_Y - 8, {
        width: 1696,
        height: 640,
        border: `10px solid ${BLUE}`,
        boxSizing: 'border-box',
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <div
      style={abs(PLAN_X + 30, PLAN_Y + 120, {
        width: 1000,
        height: 420,
        background: `repeating-linear-gradient(0deg, transparent 0 66px, ${BLUE} 66px 68px, transparent 68px 82px, ${BLUE} 82px 84px, transparent 84px 140px)`,
        opacity: 0.22,
      })}
    />
    <TableRow x={60} y={150} w={780} />
    <TableRow x={60} y={232} w={780} />
    <TableRow x={60} y={314} w={780} />
    <TableRow x={60} y={396} w={780} />
    <TableRow x={60} y={478} w={780} />
    <div
      style={abs(PLAN_X + 40, PLAN_Y + 30, {
        background: SHEET,
        padding: '8px 14px 6px',
        zIndex: 3,
      })}
    >
      <div style={{ ...DISPLAY, fontSize: 40, lineHeight: 1 }}>Main shed</div>
      <div style={{ ...MONO_LABEL, fontSize: 18, letterSpacing: '0.04em', marginTop: 6 }}>
        140 tables · 5 aisles along the old rails
      </div>
    </div>
    <Room
      x={880}
      y={130}
      w={190}
      h={180}
      fill={dots(PINK, 10, 2.6)}
      name="Kids"
      note="zine table"
      lx={18}
    />
    <Room
      x={880}
      y={350}
      w={190}
      h={200}
      fill={dots(BLUE, 10, 2.4)}
      name="Library"
      note="read + swap"
      lx={18}
    />
    <div
      style={abs(PLAN_X + 1100, PLAN_Y, {
        width: 10,
        height: 624,
        background: BLUE,
        mixBlendMode: 'multiply',
      })}
    />
    <Room
      x={1110}
      y={0}
      w={570}
      h={240}
      fill={PINK}
      name="Print lab"
      note="2 riso duplicators · free"
    />
    <Room
      x={1110}
      y={248}
      w={281}
      h={200}
      fill={dotsDiag(BLUE, 12, 2.6)}
      name="Room A"
      note="workshops"
    />
    <Room
      x={1399}
      y={248}
      w={281}
      h={200}
      fill={dotsDiag(BLUE, 12, 2.6)}
      name="Room B"
      note="workshops"
    />
    <Room
      x={1110}
      y={456}
      w={330}
      h={168}
      fill={hatch(PINK, 12, 3)}
      name="Café + bar"
      note="run by Tram Stop Coffee"
    />
    <Room x={1448} y={456} w={232} h={168} fill={dots(PINK, 8, 1.6)} name="Quiet" note="room" />
    <div
      style={abs(PLAN_X + 140, PLAN_Y + 612, {
        width: 150,
        height: 24,
        background: PAPER,
        zIndex: 2,
      })}
    />
    <Scribble
      left={PLAN_X + 60}
      top={PLAN_Y + 510}
      w={980}
      h={120}
      d="M155 110 C 160 70, 200 40, 300 36 L 960 30"
      color={PINK}
      sw={5}
    />
    <div
      style={abs(PLAN_X + 330, PLAN_Y + 562, {
        ...MONO_LABEL,
        fontSize: 20,
        color: PINK,
        letterSpacing: '0.04em',
        zIndex: 3,
      })}
    >
      step-free route, door to every room
    </div>
    <RectStamp left={PLAN_X + 330} top={PLAN_Y + 652} rot={-4} size={22}>
      ← Way in
    </RectStamp>
  </Sheet>
);

const Ticket = ({
  left,
  top,
  time,
  title,
  who,
  hot = false,
}: {
  left: number;
  top: number;
  time: string;
  title: string;
  who: string;
  hot?: boolean;
}) => (
  <Scrap left={left} top={top} w={800} h={112} amp={2} seed={left + top}>
    {hot && (
      <div
        style={abs(4, 4, {
          width: 154,
          height: 104,
          background: PINK,
          mixBlendMode: 'multiply',
          ...inked,
        })}
      />
    )}
    <div
      style={abs(0, 0, {
        width: 160,
        height: 112,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: `3px dashed ${BLUE}`,
        ...DISPLAY,
        ...NUM,
        fontSize: 44,
        color: hot ? SHEET : PINK,
      })}
    >
      {time}
    </div>
    <div
      style={abs(190, 18, { ...BODY, fontSize: 34, fontWeight: 700, lineHeight: 1.1, width: 590 })}
    >
      {title}
    </div>
    <div style={abs(190, 68, { ...MONO_LABEL, fontSize: 20, letterSpacing: '0.04em' })}>{who}</div>
  </Scrap>
);

const Workshops: Page = () => (
  <Sheet>
    <Kicker n="07">Workshop programme</Kicker>
    <Title width={1600}>20 workshops. Free. Hands-on.</Title>
    <RectStamp left={120} top={276} rot={-3} size={26} color={BLUE}>
      Sat 12 June
    </RectStamp>
    <RectStamp left={1000} top={276} rot={2} size={26} color={BLUE}>
      Sun 13 June
    </RectStamp>
    <Ticket
      left={120}
      top={384}
      time="10:30"
      title="Make a zine in 60 minutes"
      who="w/ Dee Okafor"
    />
    <Ticket
      left={120}
      top={514}
      time="12:00"
      title="Two-colour riso basics"
      who="w/ the print lab crew"
      hot
    />
    <Ticket
      left={120}
      top={644}
      time="14:00"
      title="Comics jam for beginners"
      who="w/ Sol Brannigan"
    />
    <Ticket
      left={120}
      top={774}
      time="15:30"
      title="Saddle-stitch & stab binding"
      who="w/ Hester Kim"
    />
    <Ticket
      left={1000}
      top={384}
      time="10:30"
      title="Collage if you “can’t draw”"
      who="w/ Priya Lund"
    />
    <Ticket left={1000} top={514} time="12:00" title="Lettering by hand" who="w/ Marco Teale" />
    <Ticket
      left={1000}
      top={644}
      time="14:00"
      title="Pricing your work, calmly"
      who="w/ Ruth Adeyemi"
      hot
    />
    <Ticket
      left={1000}
      top={774}
      time="15:30"
      title="Start a zine library"
      who="w/ Port Ardley Libraries"
    />
    <div
      style={abs(120, 930, { ...MONO_LABEL, fontSize: 20, letterSpacing: '0.04em', color: PINK })}
    >
      + 12 drop-in sessions · ~22 places each · BSL at 8 sessions · book at the lab desk on the day
    </div>
  </Sheet>
);

const Pin = ({ left, top, n }: { left: number; top: number; n: string }) => (
  <div
    style={abs(left, top, {
      width: 54,
      height: 54,
      borderRadius: '50%',
      background: SHEET,
      border: `4px solid ${PINK}`,
      boxSizing: 'border-box',
      color: PINK,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: STAMP,
      fontSize: 24,
      zIndex: 9,
    })}
  >
    {n}
  </div>
);

const Drum = ({ left, top, color }: { left: number; top: number; color: string }) => (
  <>
    <div
      style={abs(left, top, {
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: color,
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <div
      style={abs(left + 45, top + 45, {
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: SHEET,
        border: `5px solid ${BLUE}`,
        boxSizing: 'border-box',
      })}
    />
  </>
);

const RisoMachine = () => {
  const ox = 120;
  const oy = 360;
  return (
    <>
      <div
        style={abs(ox + 150, oy + 40, {
          width: 600,
          height: 70,
          border: `6px solid ${BLUE}`,
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          background: SHEET,
          boxSizing: 'border-box',
          mixBlendMode: 'multiply',
        })}
      />
      <div
        style={abs(ox + 590, oy + 58, {
          width: 120,
          height: 30,
          background: `${dots(PINK, 15, 5)}`,
          mixBlendMode: 'multiply',
        })}
      />
      <div
        style={abs(ox + 110, oy + 104, {
          width: 680,
          height: 320,
          border: `6px solid ${BLUE}`,
          borderRadius: 22,
          background: dotsDiag(BLUE, 10, 1.7),
          boxSizing: 'border-box',
          mixBlendMode: 'multiply',
          ...inked,
        })}
      />
      <div
        style={abs(ox + 180, oy + 150, {
          width: 540,
          height: 210,
          background: SHEET,
          border: `5px solid ${BLUE}`,
          borderRadius: 14,
          boxSizing: 'border-box',
        })}
      />
      <Drum left={ox + 230} top={oy + 170} color={PINK} />
      <Drum left={ox + 520} top={oy + 170} color={BLUE} />
      <svg
        width="940"
        height="560"
        viewBox="0 0 940 560"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={abs(ox, oy, { color: BLUE, mixBlendMode: 'multiply', zIndex: 3 })}
      >
        <path d="M402 236 a 70 70 0 0 0 -70 -70" strokeWidth="5" />
        <path d="M322 156 L334 166 L320 176" strokeWidth="5" />
        <path d="M692 236 a 70 70 0 0 0 -70 -70" strokeWidth="5" />
        <path d="M612 156 L624 166 L610 176" strokeWidth="5" />
        <path d="M10 372 L 140 330" strokeWidth="6" />
        <path d="M14 352 L 140 312" strokeWidth="3" />
        <path d="M18 334 L 140 296" strokeWidth="3" />
        <path d="M22 316 L 140 280" strokeWidth="3" />
        <path d="M180 346 L 720 346" strokeWidth="4" strokeDasharray="12 10" />
        <path d="M150 430 L 150 470 M 750 430 L 750 470" strokeWidth="8" />
        <path d="M110 476 L 790 476" strokeWidth="6" />
      </svg>
      <div
        style={abs(ox + 790, oy + 300, {
          width: 170,
          height: 220,
          rotate: '9deg',
          background: SHEET,
          border: `3px solid ${BLUE}`,
          boxSizing: 'border-box',
          zIndex: 4,
        })}
      >
        <div
          style={abs(22, 30, {
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: PINK,
            mixBlendMode: 'multiply',
            ...inked,
          })}
        />
        <div
          style={abs(52, 72, {
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: BLUE,
            mixBlendMode: 'multiply',
            ...inked,
          })}
        />
        <div style={abs(18, 180, { ...MONO_LABEL, fontSize: 18 })}>×50</div>
      </div>
      <Pin left={ox - 6} top={oy + 220} n="1" />
      <Pin left={ox + 410} top={oy + 10} n="2" />
      <Pin left={ox + 422} top={oy + 236} n="3" />
      <Pin left={ox + 860} top={oy + 236} n="4" />
      <div
        style={abs(ox + 185, oy + 500, {
          ...MONO_LABEL,
          fontSize: 19,
          color: PINK,
          width: 240,
          textAlign: 'center',
        })}
      >
        drum 1 · pink
      </div>
      <div
        style={abs(ox + 475, oy + 500, {
          ...MONO_LABEL,
          fontSize: 19,
          width: 240,
          textAlign: 'center',
        })}
      >
        drum 2 · blue
      </div>
    </>
  );
};

const LabStep = ({ n, title, body }: { n: string; title: string; body: string }) => (
  <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', height: 136 }}>
    <div
      style={{
        flex: '0 0 auto',
        width: 54,
        height: 54,
        borderRadius: '50%',
        border: `4px solid ${PINK}`,
        boxSizing: 'border-box',
        color: PINK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: STAMP,
        fontSize: 24,
        marginTop: 2,
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ ...BODY, fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
      <div
        style={{
          ...MONO_LABEL,
          fontSize: 22,
          textTransform: 'none',
          letterSpacing: '0.01em',
          fontWeight: 400,
          marginTop: 10,
          lineHeight: 1.3,
          width: 600,
        }}
      >
        {body}
      </div>
    </div>
  </div>
);

const PrintLab: Page = () => (
  <Sheet>
    <Kicker n="08">The print lab</Kicker>
    <Title width={1200}>Walk in with a drawing</Title>
    <div style={abs(120, 252, { ...MONO_LABEL, fontSize: 22, letterSpacing: '0.04em' })}>
      Walk out with fifty two-colour prints. Free, both days.
    </div>
    <RectStamp left={1460} top={120} rot={6} size={24}>
      2,950 people
      <br />
      printed in 2026
    </RectStamp>
    <RisoMachine />
    <div style={abs(1180, 370, { zIndex: 5 })}>
      <Steps>
        <Step>
          <LabStep n="1" title="Bring a drawing" body="Pen, pencil, collage. Black on white." />
        </Step>
        <Step>
          <LabStep n="2" title="We burn two masters" body="One stencil per ink, cut in seconds." />
        </Step>
        <Step>
          <LabStep
            n="3"
            title="Pink pass, then blue"
            body="One colour per drum. Overlaps go purple."
          />
        </Step>
        <Step>
          <LabStep n="4" title="Take fifty home" body="100gsm recycled. Costs us 4p a sheet." />
        </Step>
      </Steps>
    </div>
  </Sheet>
);

const Check = ({ top, children }: { top: number; children: ReactNode }) => (
  <>
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={abs(120, top, { color: BLUE, mixBlendMode: 'multiply' })}
    >
      <path d="M5 8 L49 5 L51 50 L7 52 Z" strokeWidth="4" />
    </svg>
    <svg
      width="70"
      height="70"
      viewBox="0 0 70 70"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={abs(128, top - 22, { color: PINK, mixBlendMode: 'multiply' })}
    >
      <path d="M8 40 C 16 46, 22 54, 26 60 C 36 38, 50 18, 64 6" strokeWidth="8" />
    </svg>
    <div style={abs(220, top + 4, { ...BODY, width: 1000 })}>{children}</div>
  </>
);

const Access: Page = () => (
  <Sheet>
    <Kicker n="09">Free &amp; open</Kicker>
    <Title width={1300}>Free to enter. Built to be reachable.</Title>
    <Check top={380}>
      <b>30 bursary tables</b> with £150 for travel &amp; materials
    </Check>
    <Check top={510}>
      <b>BSL interpreters</b> at 8 of the 20 workshops
    </Check>
    <Check top={640}>
      <b>Step-free throughout,</b> a quiet room and a sensory map
    </Check>
    <Check top={770}>
      <b>A kids’ zine table,</b> run with Port Ardley Libraries
    </Check>
    <Scrap left={1290} top={380} w={480} h={300} rot={-6} seed={91} tone="pink" amp={4}>
      <div
        style={abs(36, 28, {
          ...MONO_LABEL,
          fontSize: 20,
          color: SHEET,
        })}
      >
        Nº 000 001 · Papercut
      </div>
      <div style={abs(36, 76, { ...DISPLAY, fontSize: 104, lineHeight: 0.88, color: SHEET })}>
        Admit
        <br />
        anyone
      </div>
      <div
        style={abs(36, 252, {
          width: 408,
          height: 0,
          borderTop: `3px dashed ${SHEET}`,
        })}
      />
    </Scrap>
    <Tape left={1250} top={400} w={130} rot={-50} tone="blue" />
    <RoundStamp
      left={1540}
      top={640}
      size={230}
      rot={10}
      ring="NO TICKET · NO FEE · NO QUEUE · "
      center="£0"
      sub="SINCE 2021"
      color={BLUE}
    />
  </Sheet>
);

const Slice = ({ from, to, fill }: { from: number; to: number; fill: string }) => {
  const mask = `conic-gradient(transparent 0deg ${from}deg, #000 ${from}deg ${to - 0.8}deg, transparent ${to - 0.8}deg)`;
  return (
    <div
      style={abs(0, 0, {
        width: 620,
        height: 620,
        borderRadius: '50%',
        background: fill,
        WebkitMaskImage: mask,
        maskImage: mask,
        mixBlendMode: 'multiply',
      })}
    />
  );
};

const Legend = ({
  top,
  fill,
  label,
  amount,
  pct,
}: {
  top: number;
  fill: string;
  label: string;
  amount: string;
  pct: string;
}) => (
  <>
    <div
      style={abs(900, top + 4, {
        width: 64,
        height: 44,
        background: fill,
        border: `3px solid ${BLUE}`,
        boxSizing: 'border-box',
        mixBlendMode: 'multiply',
      })}
    />
    <div style={abs(996, top + 4, { ...BODY, fontSize: 32, fontWeight: 600, lineHeight: 1.2 })}>
      {label}
    </div>
    <div
      style={abs(1460, top, {
        ...DISPLAY,
        ...NUM,
        width: 210,
        textAlign: 'right',
        fontSize: 48,
        lineHeight: 1,
      })}
    >
      {amount}
    </div>
    <div style={abs(1690, top + 14, { ...MONO_LABEL, ...NUM, fontSize: 22, color: PINK })}>
      {pct}
    </div>
  </>
);

const FILL_VENUE = BLUE;
const FILL_FEES = PINK;
const FILL_STAFF = dots(BLUE, 12, 4.2);
const FILL_ACCESS = `${dots(BLUE, 10, 3)}, ${PINK}`;
const FILL_LAB = dots(PINK, 12, 4.4);
const FILL_PROMO = hatch(BLUE, 12, 4);
const FILL_SPARE = hatch(PINK, 12, 4, 45);

const Budget: Page = () => (
  <Sheet>
    <Kicker n="10">Budget</Kicker>
    <Title width={1600}>Where £168,400 goes</Title>
    <div style={abs(130, 300, { width: 620, height: 620, ...inked })}>
      <Slice from={0} to={88.1} fill={FILL_VENUE} />
      <Slice from={88.1} to={152.9} fill={FILL_FEES} />
      <Slice from={152.9} to={214} fill={FILL_STAFF} />
      <Slice from={214} to={271.5} fill={FILL_ACCESS} />
      <Slice from={271.5} to={318.3} fill={FILL_LAB} />
      <Slice from={318.3} to={343.5} fill={FILL_PROMO} />
      <Slice from={343.5} to={360.8} fill={FILL_SPARE} />
    </div>
    <div
      style={abs(330, 500, {
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: PAPER,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
      })}
    >
      <div style={{ ...MONO_LABEL, fontSize: 18 }}>Total</div>
      <div style={{ ...DISPLAY, ...NUM, fontSize: 64, lineHeight: 1 }}>£168k</div>
      <div style={{ ...MONO_LABEL, fontSize: 18, color: PINK }}>2027</div>
    </div>
    <Legend
      top={310}
      fill={FILL_VENUE}
      label="Venue, power & production"
      amount="£41.2k"
      pct="24%"
    />
    <Legend top={398} fill={FILL_FEES} label="Workshop & artist fees" amount="£30.3k" pct="18%" />
    <Legend
      top={486}
      fill={FILL_STAFF}
      label="Three part-time coordinators"
      amount="£28.6k"
      pct="17%"
    />
    <Legend top={574} fill={FILL_ACCESS} label="Bursaries & access" amount="£26.9k" pct="16%" />
    <Legend
      top={662}
      fill={FILL_LAB}
      label="Print lab: ink, masters, paper"
      amount="£21.9k"
      pct="13%"
    />
    <Legend top={750} fill={FILL_PROMO} label="Printed promotion" amount="£11.8k" pct="7%" />
    <Legend top={838} fill={FILL_SPARE} label="Contingency" amount="£7.7k" pct="5%" />
  </Sheet>
);

const Income = ({
  x,
  w,
  label,
  amount,
  ask = false,
}: {
  x: number;
  w: number;
  label: string;
  amount: string;
  ask?: boolean;
}) => (
  <>
    <div
      style={abs(x, 470, {
        width: w - 6,
        height: 170,
        background: ask ? PINK : dotsDiag(BLUE, 11, 2.2),
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <div
      style={abs(x + 20, 492, {
        ...MONO_LABEL,
        fontSize: 20,
        letterSpacing: '0.02em',
        width: w - 40,
        color: ask ? SHEET : BLUE,
        background: ask ? 'transparent' : SHEET,
        padding: ask ? 0 : '4px 6px 2px',
        zIndex: 3,
        alignSelf: 'flex-start',
        boxSizing: 'border-box',
      })}
    >
      {label}
    </div>
    <div
      style={abs(x + 20, 568, {
        ...DISPLAY,
        ...NUM,
        fontSize: ask ? 64 : 46,
        lineHeight: 1,
        color: ask ? SHEET : BLUE,
        background: ask ? 'transparent' : SHEET,
        padding: ask ? 0 : '4px 6px 0',
        top: ask ? 552 : 572,
        zIndex: 3,
      })}
    >
      {amount}
    </div>
  </>
);

const Buys = ({ left, title, note }: { left: number; title: string; note: string }) => (
  <div style={abs(left, 0, { width: 520 })}>
    <div style={{ ...BODY, fontSize: 36, fontWeight: 800, lineHeight: 1.15 }}>{title}</div>
    <div style={{ ...MONO_LABEL, fontSize: 20, letterSpacing: '0.03em', marginTop: 12 }}>
      {note}
    </div>
  </div>
);

const Ask: Page = () => (
  <Sheet>
    <Kicker n="11">The ask</Kicker>
    <RisoText left={114} top={146} size={170} dx={7} dy={-5} style={NUM}>
      £60,000
    </RisoText>
    <div style={abs(120, 316, { ...BODY, fontSize: 40, fontWeight: 700 })}>
      from the Arts Fund: 36% of the budget. We raise the rest.
    </div>
    <Income x={120} w={339} label="Exhibitor tables" amount="£34k" />
    <Income x={459} w={180} label="Bar + café" amount="£18k" />
    <Income x={639} w={259} label="Partners" amount="£26k" />
    <Income x={898} w={303} label="Trusts + foundations" amount="£30.4k" />
    <Income x={1201} w={605} label="Port Ardley Arts Fund" amount="£60,000" ask />
    <Scribble
      left={1470}
      top={640}
      w={200}
      h={110}
      d="M150 100 C 120 90, 80 70, 60 20"
      head="M44 40 L58 14 L82 34"
      color={BLUE}
    />
    <div
      style={abs(1640, 700, {
        ...MONO_LABEL,
        fontSize: 22,
        color: BLUE,
        rotate: '-4deg',
      })}
    >
      this bit
    </div>
    <div style={abs(120, 700, { ...MONO_LABEL, fontSize: 20, color: PINK })}>What £60k buys</div>
    <div style={abs(120, 750, { width: 1680, height: 200 })}>
      <Steps>
        <Step>
          <Buys left={0} title="Free entry for 8,500 people" note="About £7 per visitor" />
        </Step>
        <Step>
          <Buys left={580} title="All 30 bursary tables" note="Pitch, travel & materials" />
        </Step>
        <Step>
          <Buys left={1160} title="A fair fee for every tutor" note="£350 a day, 20 workshops" />
        </Step>
      </Steps>
    </div>
  </Sheet>
);

const TierIcon = ({ kind }: { kind: 'staple' | 'fold' | 'spread' | 'centre' }) => (
  <svg
    width="120"
    height="80"
    viewBox="0 0 120 80"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="5"
    style={{ color: BLUE, mixBlendMode: 'multiply', display: 'block' }}
  >
    {kind === 'staple' && <path d="M24 56 L24 26 L96 26 L96 56" strokeWidth="8" />}
    {kind === 'fold' && (
      <>
        <path d="M20 10 L80 10 L100 30 L100 72 L20 72 Z" />
        <path d="M80 10 L80 30 L100 30" />
      </>
    )}
    {kind === 'spread' && (
      <>
        <path d="M60 18 C 44 10, 22 10, 8 16 L8 70 C 22 64, 44 64, 60 72 C 76 64, 98 64, 112 70 L112 16 C 98 10, 76 10, 60 18 Z" />
        <path d="M60 18 L60 72" />
      </>
    )}
    {kind === 'centre' && (
      <>
        <path d="M60 18 C 44 10, 22 10, 8 16 L8 70 C 22 64, 44 64, 60 72 C 76 64, 98 64, 112 70 L112 16 C 98 10, 76 10, 60 18 Z" />
        <path d="M60 18 L60 72" strokeWidth="9" stroke="var(--osd-accent)" />
        <path d="M60 30 L60 34 M60 54 L60 58" strokeWidth="5" />
      </>
    )}
  </svg>
);

const Tier = ({
  left,
  rot,
  seed,
  name,
  price,
  kind,
  perks,
  hot = false,
}: {
  left: number;
  rot: number;
  seed: number;
  name: string;
  price: string;
  kind: 'staple' | 'fold' | 'spread' | 'centre';
  perks: ReactNode;
  hot?: boolean;
}) => (
  <Scrap left={left} top={340} w={390} h={520} rot={rot} seed={seed} tone="sheet" amp={4}>
    {hot && (
      <div
        style={abs(0, 0, {
          width: 390,
          height: 22,
          background: PINK,
          mixBlendMode: 'multiply',
          ...inked,
        })}
      />
    )}
    <div style={abs(34, 34)}>
      <TierIcon kind={kind} />
    </div>
    <div
      style={abs(34, 140, {
        fontFamily: STAMP,
        fontSize: 30,
        color: PINK,
        textTransform: 'uppercase',
        mixBlendMode: 'multiply',
        ...worn,
      })}
    >
      {name}
    </div>
    <div style={abs(34, 194, { ...DISPLAY, ...NUM, fontSize: 82, lineHeight: 1 })}>{price}</div>
    <div
      style={abs(34, 300, {
        width: 322,
        height: 0,
        borderTop: `3px dashed ${BLUE}`,
      })}
    />
    <div style={abs(34, 326, { ...BODY, fontSize: 28, lineHeight: 1.55, width: 330 })}>{perks}</div>
  </Scrap>
);

const Tiers: Page = () => (
  <Sheet>
    <Kicker n="12">Venue &amp; partner tiers</Kicker>
    <Title width={1600}>Sized like the things we print</Title>
    <div style={abs(120, 252, { ...MONO_LABEL, fontSize: 22, letterSpacing: '0.04em' })}>
      Partner target £26,000 · in-kind space, power &amp; storage count at face value
    </div>
    <Tier
      left={120}
      rot={-1.5}
      seed={61}
      name="Staple"
      price="£1,500"
      kind="staple"
      perks={
        <>
          Logo on the fest map
          <br />
          Team print-lab session
          <br />
          Thanks on every door
        </>
      }
    />
    <Tier
      left={550}
      rot={1}
      seed={62}
      name="Fold"
      price="£4,000"
      kind="fold"
      perks={
        <>
          Name a workshop room
          <br />
          Staff zine-making day
          <br />
          Everything in Staple
        </>
      }
    />
    <Tier
      left={980}
      rot={-0.8}
      seed={63}
      name="Spread"
      price="£8,000"
      kind="spread"
      perks={
        <>
          Name the print lab
          <br />
          Co-branded riso poster
          <br />
          Everything in Fold
        </>
      }
    />
    <Tier
      left={1410}
      rot={1.8}
      seed={64}
      name="Centrefold"
      price="£15,000"
      kind="centre"
      hot
      perks={
        <>
          Presenting credit
          <br />
          Host the launch night
          <br />
          Everything in Spread
        </>
      }
    />
    <RectStamp left={1630} top={306} rot={12} size={24}>
      Only 1
    </RectStamp>
  </Sheet>
);

const Badge = ({
  left,
  top,
  rot,
  crew,
  count,
  job,
  pink = false,
}: {
  left: number;
  top: number;
  rot: number;
  crew: string;
  count: string;
  job: string;
  pink?: boolean;
}) => (
  <Scrap left={left} top={top} w={500} h={250} rot={rot} seed={left + top} amp={2} tone="sheet">
    <div
      style={abs(0, 0, {
        width: 500,
        height: 64,
        background: pink ? PINK : BLUE,
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <div
      style={abs(220, 18, {
        width: 60,
        height: 14,
        borderRadius: 7,
        background: PAPER,
        zIndex: 2,
      })}
    />
    <div
      style={abs(30, 76, {
        fontFamily: STAMP,
        fontSize: 26,
        textTransform: 'uppercase',
        lineHeight: 1.1,
        width: 300,
      })}
    >
      {crew}
    </div>
    <RisoText left={340} top={84} size={110} dx={4} dy={-3} align="right" width={130} style={NUM}>
      {count}
    </RisoText>
    <div style={abs(30, 192, { ...BODY, fontSize: 28, lineHeight: 1.1, width: 440 })}>{job}</div>
  </Scrap>
);

const Crew: Page = () => (
  <Sheet>
    <Kicker n="13">Volunteer crew</Kicker>
    <Title width={1600}>90 volunteers, six crews</Title>
    <div style={abs(120, 252, { ...MONO_LABEL, fontSize: 22, letterSpacing: '0.04em' })}>
      360 shifts · every volunteer gets lunch, a crew zine &amp; first pick of next year’s tables
    </div>
    <Badge
      left={120}
      top={340}
      rot={-1.2}
      crew="Door & count"
      count="16"
      job="Clickers, maps, first hellos"
    />
    <Badge
      left={710}
      top={350}
      rot={1}
      crew="Table runners"
      count="22"
      job="Load-in, break cover, tape"
      pink
    />
    <Badge
      left={1300}
      top={336}
      rot={-0.6}
      crew="Lab techs"
      count="14"
      job="Drums, masters, paper jams"
    />
    <Badge
      left={120}
      top={650}
      rot={0.8}
      crew="Access stewards"
      count="14"
      job="Quiet room, BSL, step-free"
      pink
    />
    <Badge
      left={710}
      top={640}
      rot={-1.4}
      crew="Workshop hosts"
      count="12"
      job="Rooms, timings, glue sticks"
    />
    <Badge
      left={1300}
      top={654}
      rot={1.3}
      crew="Build & strike"
      count="12"
      job="Tables up Fri, down Sun"
      pink
    />
  </Sheet>
);

const TL_Y = 620;

const Milestone = ({
  x,
  above,
  when,
  what,
  big = false,
  w = 300,
}: {
  x: number;
  above: boolean;
  when: string;
  what: string;
  big?: boolean;
  w?: number;
}) => (
  <>
    <div
      style={abs(x - 13, TL_Y + 7, {
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: big ? PINK : SHEET,
        border: `5px solid ${BLUE}`,
        boxSizing: 'border-box',
        zIndex: 4,
      })}
    />
    <div
      style={abs(x - 1.5, above ? TL_Y - 110 : TL_Y + 34, {
        width: 3,
        height: 116,
        background: BLUE,
        mixBlendMode: 'multiply',
      })}
    />
    <div
      style={abs(x - 16, above ? TL_Y - 280 : TL_Y + 162, {
        width: w,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: above ? 'flex-end' : 'flex-start',
        height: 160,
      })}
    >
      <div style={{ ...MONO_LABEL, fontSize: 22, color: PINK }}>{when}</div>
      <div
        style={{
          ...BODY,
          fontSize: big ? 40 : 30,
          fontWeight: big ? 800 : 600,
          lineHeight: 1.15,
          marginTop: 8,
        }}
      >
        {what}
      </div>
    </div>
  </>
);

const Timeline: Page = () => (
  <Sheet>
    <Kicker n="14">Timeline</Kicker>
    <Title width={1600}>From yes to doors open</Title>
    <div
      style={abs(120, TL_Y, {
        width: 1680,
        height: 40,
        clipPath: tapeClip(1680, 40),
        background: `${dots(PINK, 7, 2.4)}`,
        mixBlendMode: 'multiply',
        ...inked,
      })}
    />
    <Milestone x={170} above when="Dec 2026" what="Arts Fund decision" />
    <Milestone x={375} above={false} when="Jan 2027" what="Exhibitor call opens" />
    <Milestone x={580} above when="Feb" what="Bursary panel picks 30 makers" />
    <Milestone x={785} above={false} when="Mar" what="Line-up announced" />
    <Milestone x={990} above when="Apr" what="Volunteer call + lab training" />
    <Milestone x={1195} above={false} when="May" what="Four pre-fest print nights" />
    <Milestone x={1400} above when="12–13 Jun" what="Papercut Nº 7" big w={340} />
    <Milestone x={1605} above={false} when="Jul" what="Report + fest zine" w={200} />
    <RoundStamp
      left={1600}
      top={190}
      size={170}
      rot={-10}
      ring="DOORS OPEN · SAT + SUN · "
      center="10am"
    />
  </Sheet>
);

const Close: Page = () => (
  <Sheet folio={false}>
    <HalftoneDisc left={-180} top={430} size={760} lx={0.7} ly={0.2} color={BLUE} />
    <div style={abs(120, 104, { ...MONO_LABEL, fontSize: 22 })}>
      Papercut Zine Fest · Issue Nº 7 · 12–13 June 2027
    </div>
    <RisoText left={112} top={190} size={230} dx={8} dy={-6}>
      Help us keep
    </RisoText>
    <RisoText left={112} top={392} size={230} dx={8} dy={-6} delay={0.1}>
      it free.
    </RisoText>
    <Scrap left={900} top={640} w={880} h={260} rot={-1.5} seed={81} tone="sheet" amp={6}>
      <div style={abs(50, 40, { ...BODY, fontSize: 40, fontWeight: 800, lineHeight: 1.1 })}>
        Jo Marchetti, festival director
      </div>
      <div
        style={abs(50, 108, {
          ...MONO_LABEL,
          fontSize: 26,
          letterSpacing: '0.02em',
          textTransform: 'none',
          lineHeight: 1.5,
        })}
      >
        jo@papercutfest.org
        <br />
        07700 900 418 · papercutfest.org
      </div>
    </Scrap>
    <Tape left={860} top={640} w={150} rot={-30} tone="blue" />
    <Tape left={1680} top={620} w={140} rot={26} />
    <RectStamp left={1290} top={250} rot={-8} size={40}>
      See you in
      <br />
      the depot
    </RectStamp>
    <div
      style={abs(900, 940, {
        ...MONO_LABEL,
        fontSize: 22,
        color: PINK,
        letterSpacing: '0.2em',
      })}
    >
      Cut · fold · staple · repeat
    </div>
    <CutLine top={1000} color={PINK} />
  </Sheet>
);

export const notes: (string | undefined)[] = [
  `Hold on the cover for a second. "Thank you for having us. I'm Jo Marchetti, and I run Papercut."
"Next June is our seventh festival: two days, the Old Tram Depot, free to walk in."
"In the next ten minutes I'll show you who comes, what it costs, and the one big ask."`,
  `"If you've never been: picture a tram shed full of folding tables, and on every one, something a person made at their kitchen table."
"Zines, comics, risograph prints, poetry pamphlets. One hundred and forty tables next year."
"And it has been free to enter since the very first one in 2021. That's the bit we want to protect."`,
  `"This is last June, issue six." Point at the numbers in order.
"Sixty-eight hundred people through the door. Tables sold out in nine days."
"Exhibitors took ninety-six thousand pounds, and kept all of it, because we take no commission."
"And nearly three thousand people made a print in the lab. For most of them it was their first."`,
  `"The line has gone one way." Trace the arrow with your hand.
"Eleven hundred in our first year, sixty-eight hundred last year. Six times over."
"Our goal for 2027 is eighty-five hundred, and the depot holds that comfortably across two days."`,
  `"Who's actually in the room? Two groups."
"At the tables: four in ten are selling their work for the first time ever. Most live within thirty miles."
"In the aisles: it skews young, twenty-five to thirty-four is the biggest group, but look at the under-eighteens."
"And one in three visitors had never been to a zine fair before. That's new audience, not the usual crowd."`,
  `Read the main quote slowly, then stop. Let it land.
"Amara had never sold anything before. She made the zine on Friday night and printed it in our lab on Saturday."
Optional laugh line: the caretaker's quote. "Glen has worked at the depot for twenty-two years."`,
  `"Here's the building." Start at the entrance, bottom left.
"Five long aisles of tables run along the old tram rails in the main shed."
"Off to the right: the print lab, two workshop rooms, the café, and a quiet room."
"The pink line is our step-free route. Every room is on it, and that's a design rule, not an afterthought."`,
  `"Twenty workshops over two days. All free, all hands-on, nothing where you sit and listen."
Pick two to describe: "Make a zine in sixty minutes is the one that always has a queue. Pricing your work is the one exhibitors thank us for."
"Every tutor is paid. Eight sessions have BSL interpretation."`,
  `"The thing people remember most is the print lab." Click through the four steps.
"You bring a drawing." Click. "We burn two masters, one per colour." Click.
"The paper goes through pink, then blue. Where they overlap, you get this purple." Click.
"And you leave with fifty copies. It costs us four pence a sheet. Last year, twenty-nine hundred and fifty people did it."`,
  `"For a city fund, this is probably the page that matters most."
"Thirty bursary tables, with a hundred and fifty pounds for travel and materials."
"BSL at eight workshops, step-free everywhere, a quiet room, and a kids' table with the library service."
"No ticket, ever. That's the promise on the stamp."`,
  `"Here's the whole budget: a hundred and sixty-eight thousand four hundred pounds."
"The biggest piece is the venue and production, about a quarter."
"Then people: tutors, artists, and our three part-time coordinators."
"Bursaries and access are sixteen percent of everything we spend. We'd like to keep that number."`,
  `"So, the ask. Sixty thousand pounds from the Arts Fund."
"That's thirty-six percent of the budget. The rest we raise ourselves, from tables, the bar, partners and trusts."
Click: "It keeps entry free for eighty-five hundred people, about seven pounds a head."
Click: "It funds all thirty bursary tables." Click: "And it pays every tutor properly."`,
  `"For venue and business partners, we've sized the tiers like the things we print."
"Staple, Fold, Spread and Centrefold, from fifteen hundred pounds to fifteen thousand."
"There's only one Centrefold. And if you'd rather give space, power or storage, we count it at face value."`,
  `"None of this works without the crew. Ninety volunteers, six crews, three hundred and sixty shifts."
"Lab techs are the hardest to find. We train them in April."
"Every volunteer gets lunch, a crew zine, and first pick of next year's tables, which is why many of them come back as exhibitors."`,
  `"Here's how we get from a yes to the doors opening."
"A decision in December lets us open the exhibitor call in January and pick bursary makers in February."
"Doors open at ten on the twelfth of June. In July you get a full report, and a zine of the festival."`,
  `"Papercut works because it's free. We'd like your help to keep it that way."
"Thank you. I'm happy to take questions, and you're all invited to print something in June."
Leave this page up during questions.`,
];

export const meta: SlideMeta = {
  title: 'Papercut Zine Fest 2027',
  createdAt: '2026-10-12T12:07:13.565Z',
};

export default [
  Cover,
  WhatItIs,
  Numbers,
  Growth,
  WhoComes,
  Voices,
  FloorPlan,
  Workshops,
  PrintLab,
  Access,
  Budget,
  Ask,
  Tiers,
  Crew,
  Timeline,
  Close,
] satisfies Page[];

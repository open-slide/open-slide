import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useIsActivePage,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useId } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#FFFFFF', text: '#1D1D1F', accent: '#0071E3' },
  fonts: {
    display:
      '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif',
    body: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", sans-serif',
  },
  typeScale: { hero: 200, body: 36 },
  radius: 32,
};

const MIST = '#F5F5F7';
const INK = '#1D1D1F';
const SECOND = '#6E6E73';
const TERT = '#86868B';
const HAIR = '#D2D2D7';
const EMBER = '#B6531C';
const PAPER = '#EFEDE7';
const PEN_INK = '#29292B';
const HAND = '"Caveat", "Bradley Hand", cursive';
const SERIF = '"Iowan Old Style", Charter, Georgia, serif';

const SLIDE_ID = 'quire-slate-keynote';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Inter:wght@400;500;600&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes qs-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes qs-rise { from { opacity: 0; transform: translateY(28px); filter: blur(10px) } to { opacity: 1; transform: none; filter: blur(0) } }
@keyframes qs-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes qs-glide { from { offset-distance: 0% } to { offset-distance: 100% } }
@keyframes qs-fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes qs-loupe { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
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

const noise = (w: number, h: number, freq: string, alpha: number, dark: boolean) => {
  const c = dark ? 0 : 1;
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 ${c} 0 0 0 0 ${c} 0 0 0 0 ${c} ${alpha} 0 0 0 0'/></filter><rect width='${w}' height='${h}' filter='url(#n)'/></svg>`,
  )}")`;
};

const GRAIN = noise(220, 220, '0.9', 0.55, true);
const BRUSHED = noise(360, 360, '0.012 0.9', 1, false);

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 900;

export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 260, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
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
  exit: { duration: 320, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 320, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.45, 0, 0.15, 1)' },
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const HEAD: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 600,
  letterSpacing: '-0.025em',
  lineHeight: 1.05,
  margin: 0,
  color: 'var(--osd-text)',
};

const EYEBROW: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontSize: 30,
  fontWeight: 600,
  letterSpacing: '-0.005em',
  color: EMBER,
  margin: 0,
};

const COPY: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 'var(--osd-size-body)',
  fontWeight: 500,
  lineHeight: 1.42,
  letterSpacing: '-0.012em',
  color: TERT,
  margin: 0,
};

const CAPTION: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 24,
  fontWeight: 500,
  letterSpacing: '-0.005em',
  color: TERT,
};

const GRAPHITE_TEXT: CSSProperties = {
  backgroundImage: 'linear-gradient(180deg, #1D1D1F 18%, #5E5E63 62%, #A7A7AD 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  paddingBottom: '0.06em',
};

const WARM_TEXT: CSSProperties = {
  backgroundImage: 'linear-gradient(96deg, #9C3F12 0%, #C8652A 42%, #D99A61 78%, #C9A988 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  paddingBottom: '0.06em',
};

const Em = ({ children }: { children: ReactNode }) => (
  <span style={{ color: 'var(--osd-text)' }}>{children}</span>
);

const Stage = ({ bg, children }: { bg: string; children: ReactNode }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: bg,
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
      WebkitFontSmoothing: 'antialiased',
    }}
  >
    {children}
  </div>
);

type PenTone = {
  hi: string;
  base: string;
  mid: string;
  lo: string;
  rim: string;
  cap: string;
  capLo: string;
};

type Finish = {
  name: string;
  rim: string;
  bezel: string;
  bezelSheen: number;
  dot: string;
  pen: PenTone;
  side: string[];
};

const GRAPHITE: Finish = {
  name: 'Graphite',
  rim: 'linear-gradient(135deg, #A4A5A9 0%, #4A4B4F 14%, #77787C 34%, #2D2E31 58%, #5B5C60 80%, #2A2B2E 100%)',
  bezel: '#1E1F21',
  bezelSheen: 0.07,
  dot: 'linear-gradient(135deg, #6E6F73 0%, #2C2D30 100%)',
  pen: {
    hi: '#8D8E92',
    base: '#5C5D61',
    mid: '#3A3B3E',
    lo: '#1B1C1E',
    rim: '#525357',
    cap: '#45464A',
    capLo: '#1E1F21',
  },
  side: [
    '#A6A7AB',
    '#1C1D1F',
    '#18191B',
    '#8C8D91',
    '#5D5E62',
    '#46474B',
    '#2F3033',
    '#6D6E72',
    '#262729',
  ],
};

const CHALK: Finish = {
  name: 'Chalk',
  rim: 'linear-gradient(135deg, #FFFFFF 0%, #CFCECB 16%, #F4F3F0 36%, #ADACA8 60%, #E2E1DD 82%, #B9B8B4 100%)',
  bezel: '#ECEAE5',
  bezelSheen: 0.18,
  dot: 'linear-gradient(135deg, #FBFAF7 0%, #D9D7D2 100%)',
  pen: {
    hi: '#FFFFFF',
    base: '#F2F1EE',
    mid: '#DAD9D5',
    lo: '#ADACA8',
    rim: '#CFCECA',
    cap: '#E6E5E1',
    capLo: '#B5B4B0',
  },
  side: [
    '#FFFFFF',
    '#D8D6D1',
    '#E2E0DB',
    '#FFFFFF',
    '#E3E2DF',
    '#D3D2CE',
    '#BDBCB8',
    '#E8E7E4',
    '#A9A8A4',
  ],
};

const SAGE: Finish = {
  name: 'Sage',
  rim: 'linear-gradient(135deg, #EEF2EA 0%, #95A08F 16%, #C7CFC1 36%, #76816F 60%, #B0B9A9 82%, #838E7D 100%)',
  bezel: '#AEB8A7',
  bezelSheen: 0.14,
  dot: 'linear-gradient(135deg, #C9D1C2 0%, #8D9886 100%)',
  pen: {
    hi: '#DCE3D6',
    base: '#BCC5B5',
    mid: '#A0AA98',
    lo: '#727C6B',
    rim: '#98A28F',
    cap: '#AAB4A2',
    capLo: '#7C8676',
  },
  side: [
    '#E8EDE4',
    '#9AA593',
    '#A3AD9B',
    '#E2E8DD',
    '#B8C1B1',
    '#A6B09E',
    '#8D9886',
    '#C3CBBC',
    '#737D6C',
  ],
};

const SCREEN_W = 1570;
const SCREEN_H = 2093;

const slateSize = (u: number, landscape = false) => ({
  w: (landscape ? 246 : 188) * u,
  h: (landscape ? 188 : 246) * u,
});

const slateScreen = (u: number, landscape = false) => {
  const { w, h } = slateSize(u, landscape);
  const bx = (landscape ? 18.35 : 15.5) * u;
  const by = (landscape ? 15.5 : 18.35) * u;
  return {
    x: bx,
    y: by,
    w: w - 2 * bx,
    h: h - 2 * by,
    k: (w - 2 * bx) / (landscape ? SCREEN_H : SCREEN_W),
  };
};

const Slate = ({
  u,
  finish = GRAPHITE,
  landscape = false,
  shadow = true,
  children,
}: {
  u: number;
  finish?: Finish;
  landscape?: boolean;
  shadow?: boolean;
  children?: ReactNode;
}) => {
  const { w, h } = slateSize(u, landscape);
  const R = 9 * u;
  const rim = Math.max(1.6, 0.75 * u);
  const scr = slateScreen(u, landscape);
  const cw = landscape ? SCREEN_H : SCREEN_W;
  const ch = landscape ? SCREEN_W : SCREEN_H;
  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      {shadow && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: R,
            boxShadow: [
              `0 ${0.3 * u}px ${0.6 * u}px rgba(0,0,0,0.12)`,
              `0 ${3 * u}px ${8 * u}px rgba(0,0,0,0.07)`,
              `0 ${14 * u}px ${34 * u}px rgba(0,0,0,0.11)`,
            ].join(', '),
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: R,
          background: finish.rim,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: BRUSHED,
            backgroundSize: '360px 360px',
            opacity: 0.22,
            mixBlendMode: 'overlay',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: rim,
          borderRadius: R - rim,
          background: finish.bezel,
          overflow: 'hidden',
          boxShadow: `inset 0 0 0 ${Math.max(0.6, 0.18 * u)}px rgba(0,0,0,0.28)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: scr.x - rim,
            top: scr.y - rim,
            width: scr.w,
            height: scr.h,
            borderRadius: 0.6 * u,
            background: PAPER,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: cw,
              height: ch,
              transform: `scale(${scr.k})`,
              transformOrigin: '0 0',
            }}
          >
            {children}
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: GRAIN,
              backgroundSize: '220px 220px',
              opacity: 0.08,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.035) 100%)',
              boxShadow: `inset 0 ${0.4 * u}px ${1.1 * u}px rgba(0,0,0,0.16), inset 0 0 0 ${Math.max(0.5, 0.12 * u)}px rgba(0,0,0,0.14)`,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(118deg, rgba(255,255,255,${finish.bezelSheen}) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 56%, rgba(255,255,255,${finish.bezelSheen * 0.6}) 66%, rgba(255,255,255,0) 80%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

const Pen = ({ length, tone }: { length: number; tone: PenTone }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const D = (length * 86) / 1620;
  return (
    <svg
      width={length}
      height={D}
      viewBox="0 0 1620 86"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone.base} />
          <stop offset="0.06" stopColor={tone.hi} />
          <stop offset="0.235" stopColor={tone.hi} />
          <stop offset="0.25" stopColor={tone.mid} />
          <stop offset="0.3" stopColor={tone.hi} />
          <stop offset="0.52" stopColor={tone.base} />
          <stop offset="0.78" stopColor={tone.mid} />
          <stop offset="0.92" stopColor={tone.lo} />
          <stop offset="1" stopColor={tone.rim} />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,0.10)" />
          <stop offset="0.08" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.3" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="0.46" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.78" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.06)" />
        </linearGradient>
        <filter id={`${id}f`} x="-5%" y="-200%" width="110%" height="500%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone.base} />
          <stop offset="0.28" stopColor={tone.hi} />
          <stop offset="0.55" stopColor={tone.base} />
          <stop offset="0.85" stopColor={tone.lo} />
          <stop offset="1" stopColor={tone.rim} />
        </linearGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone.cap} />
          <stop offset="0.3" stopColor={tone.cap} />
          <stop offset="0.75" stopColor={tone.capLo} />
          <stop offset="1" stopColor={tone.cap} />
        </linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9E9EB" />
          <stop offset="0.22" stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#A9A9AD" />
          <stop offset="0.62" stopColor="#E4E4E6" />
          <stop offset="0.86" stopColor="#6E6E72" />
          <stop offset="1" stopColor="#B4B4B8" />
        </linearGradient>
        <linearGradient id={`${id}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F4F5" />
          <stop offset="0.4" stopColor="#D6D6D9" />
          <stop offset="1" stopColor="#8E8E93" />
        </linearGradient>
      </defs>
      <path d="M152 0 H40 C15 0 0 19 0 43 C0 67 15 86 40 86 H152 Z" fill={`url(#${id}e)`} />
      <rect x="150" y="0" width="1152" height="86" fill={`url(#${id}b)`} />
      <rect x="150" y="0" width="1152" height="86" fill={`url(#${id}h)`} />
      <rect
        x="150"
        y="29"
        width="1152"
        height="5"
        fill="rgba(255,255,255,0.22)"
        filter={`url(#${id}f)`}
      />
      <path
        d="M1338 0 C1426 9 1508 26 1566 34 L1566 52 C1508 60 1426 77 1338 86 Z"
        fill={`url(#${id}c)`}
      />
      <path
        d="M1564 34 C1590 37 1610 40 1619 43 C1610 46 1590 49 1564 52 Z"
        fill={`url(#${id}n)`}
      />
      <rect x="1300" y="0" width="40" height="86" fill={`url(#${id}m)`} />
      <rect x="150" y="0" width="2.2" height="86" fill="rgba(0,0,0,0.28)" />
      <rect x="152.4" y="0" width="1.6" height="86" fill="rgba(255,255,255,0.35)" />
      <rect x="1298.6" y="0" width="1.4" height="86" fill="rgba(0,0,0,0.25)" />
      <rect x="1340" y="0" width="1.4" height="86" fill="rgba(0,0,0,0.2)" />
      <text
        x="760"
        y="15"
        textAnchor="middle"
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 4,
          fill: 'rgba(0,0,0,0.22)',
        }}
      >
        QUIRE
      </text>
    </svg>
  );
};

const penDiameter = (length: number) => (length * 86) / 1620;

const StandingPen = ({
  x,
  y,
  length,
  tone,
  tipUp = false,
}: {
  x: number;
  y: number;
  length: number;
  tone: PenTone;
  tipUp?: boolean;
}) => {
  const D = penDiameter(length);
  return (
    <div
      style={abs(x, y, {
        width: D,
        height: length,
        filter: `drop-shadow(0 ${D * 0.5}px ${D * 0.8}px rgba(0,0,0,0.14)) drop-shadow(0 ${D * 0.08}px ${D * 0.12}px rgba(0,0,0,0.18))`,
      })}
    >
      <div
        style={{
          position: 'absolute',
          left: D / 2 - length / 2,
          top: length / 2 - D / 2,
          width: length,
          height: D,
          transform: tipUp ? 'rotate(-90deg)' : 'rotate(90deg) scaleY(-1)',
          transformOrigin: '50% 50%',
        }}
      >
        <Pen length={length} tone={tone} />
      </div>
    </div>
  );
};

const RULES_P = (() => {
  let d = '';
  for (let y = 380; y <= 1980; y += 100) d += `M110 ${y}H1460`;
  return d;
})();

const RULES_L = (() => {
  let d = '';
  for (let y = 300; y <= 1480; y += 100) d += `M120 ${y}H1980`;
  return d;
})();

const SCREEN_BOX = (w: number, h: number): CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: w,
  height: h,
  color: PEN_INK,
});

const Hand = ({
  x,
  y,
  size = 78,
  rotate = 0,
  children,
}: {
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  children: ReactNode;
}) => (
  <div
    style={abs(x, y + 24, {
      fontFamily: HAND,
      fontWeight: 500,
      fontSize: size,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      color: PEN_INK,
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      transformOrigin: '0 100%',
    })}
  >
    {children}
  </div>
);

const Mark = ({ on, children }: { on: boolean; children: ReactNode }) => (
  <span
    style={
      on
        ? {
            background: 'rgba(40,40,40,0.16)',
            borderRadius: 10,
            padding: '0 10px',
            margin: '0 -10px',
            boxShadow: 'inset 0 -6px 0 rgba(40,40,40,0.18)',
          }
        : undefined
    }
  >
    {children}
  </span>
);

const INK_STROKE: CSSProperties = {
  fill: 'none',
  stroke: PEN_INK,
  strokeWidth: 5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const LampSketch = ({ x, y, w }: { x: number; y: number; w: number }) => (
  <svg
    width={w}
    height={w}
    viewBox="0 0 760 760"
    style={abs(x, y, { overflow: 'visible' })}
    aria-hidden="true"
  >
    <g style={INK_STROKE}>
      <path d="M150 676 C150 650 410 648 412 674 C414 700 154 704 150 676" />
      <path d="M150 678 L151 700 C156 726 408 728 412 702 L412 676" />
      <path d="M268 664 C254 590 228 482 196 390" />
      <path d="M292 662 C277 588 250 482 218 388" />
      <circle cx="281" cy="664" r="14" />
      <circle cx="207" cy="378" r="23" />
      <circle cx="207" cy="378" r="6" />
      <path d="M222 360 C322 300 420 244 518 190" />
      <path d="M230 386 C332 326 432 268 532 212" />
      <circle cx="530" cy="198" r="17" />
      <path d="M520 216 C504 262 478 308 452 356" />
      <path d="M548 210 C592 240 636 278 680 316" />
      <path d="M452 356 C486 404 646 380 680 316" />
      <path d="M452 356 C478 318 640 290 680 316" style={{ strokeWidth: 3.5, opacity: 0.6 }} />
    </g>
    <g style={{ ...INK_STROKE, strokeWidth: 3, opacity: 0.75 }}>
      <path d="M492 306 L520 252" />
      <path d="M514 300 L540 246" />
      <path d="M538 296 L564 248" />
      <path d="M562 294 L588 258" />
      <path d="M586 294 L610 272" />
    </g>
    <g style={{ ...INK_STROKE, strokeWidth: 4, strokeDasharray: '2 16' }}>
      <path d="M482 410 L436 520" />
      <path d="M562 404 L560 540" />
      <path d="M648 380 L702 492" />
    </g>
    <g style={{ ...INK_STROKE, strokeWidth: 3.5 }}>
      <path d="M70 200 L72 700" />
      <path d="M54 200 L88 200" />
      <path d="M56 700 L90 700" />
      <path d="M392 476 C330 470 262 440 232 400" />
      <path d="M244 404 L232 400 L236 414" />
    </g>
    <text
      x="-70"
      y="470"
      transform="rotate(-90 40 470)"
      style={{ fontFamily: HAND, fontWeight: 500, fontSize: 48, fill: PEN_INK }}
    >
      45 cm
    </text>
    <text
      x="402"
      y="492"
      style={{ fontFamily: HAND, fontWeight: 500, fontSize: 52, fill: PEN_INK }}
    >
      brass pivot
    </text>
    <text
      x="470"
      y="606"
      style={{ fontFamily: HAND, fontWeight: 500, fontSize: 52, fill: PEN_INK }}
    >
      2700 K, warm
    </text>
  </svg>
);

const CheckBox = ({ x, y, done }: { x: number; y: number; done: boolean }) => (
  <svg width={56} height={56} viewBox="0 0 56 56" style={abs(x, y, { overflow: 'visible' })}>
    <path
      d="M6 8 C20 6 38 5 50 7 C52 22 51 38 50 50 C36 52 20 51 6 50 C5 36 5 20 6 8"
      style={{ ...INK_STROKE, strokeWidth: 4 }}
    />
    {done && <path d="M12 28 L24 42 L56 -6" style={{ ...INK_STROKE, strokeWidth: 5.5 }} />}
  </svg>
);

const ScreenChrome = ({ w, h, page }: { w: number; h: number; page: string }) => (
  <>
    <svg width={64} height={64} viewBox="0 0 64 64" style={abs(56, 44)} aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="none" stroke="#8E8E8E" strokeWidth="3" />
      <path
        d="M20 25 H44 M20 32 H44 M20 39 H44"
        stroke="#8E8E8E"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
    <div
      style={abs(0, h - 78, {
        width: w,
        textAlign: 'center',
        fontFamily: 'var(--osd-font-body)',
        fontSize: 30,
        fontWeight: 500,
        color: '#9A9A9A',
        letterSpacing: '0.02em',
      })}
    >
      {page}
    </div>
  </>
);

const NotesScreen = ({ search = false }: { search?: boolean }) => (
  <div style={SCREEN_BOX(SCREEN_W, SCREEN_H)}>
    <svg width={SCREEN_W} height={SCREEN_H} style={abs(0, 0)} aria-hidden="true">
      <path d={RULES_P} stroke="rgba(40,40,40,0.085)" strokeWidth={2} />
    </svg>
    {!search && <ScreenChrome w={SCREEN_W} h={SCREEN_H} page="12 / 40" />}
    {search && (
      <div
        style={abs(200, 40, {
          width: 1170,
          height: 92,
          borderRadius: 46,
          border: '3px solid #7C7C7C',
          background: '#F7F6F2',
          display: 'flex',
          alignItems: 'center',
          padding: '0 40px',
          boxSizing: 'border-box',
          fontFamily: 'var(--osd-font-body)',
          fontSize: 44,
          color: '#2A2A2A',
          gap: 22,
        })}
      >
        <svg width={40} height={40} viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="17" cy="17" r="12" fill="none" stroke="#2A2A2A" strokeWidth="4" />
          <path d="M26 26 L36 36" stroke="#2A2A2A" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span style={{ fontWeight: 500 }}>hinge</span>
        <span style={{ marginLeft: 'auto', fontSize: 34, color: '#6A6A6A' }}>
          4 results · 3 notebooks
        </span>
      </div>
    )}
    <Hand x={140} y={176} size={120}>
      Desk lamp, v3
    </Hand>
    <svg width={700} height={40} viewBox="0 0 700 40" style={abs(136, 318)} aria-hidden="true">
      <path d="M6 22 C150 12 380 10 640 18" style={{ ...INK_STROKE, strokeWidth: 5 }} />
    </svg>
    <Hand x={1130} y={204} size={64}>
      Thu, Oct 8
    </Hand>
    <Hand x={140} y={318}>
      Fewer parts. One <Mark on={search}>hinge</Mark>, not two.
    </Hand>
    <Hand x={140} y={418}>
      Arm folds flat, fits in a drawer.
    </Hand>
    <LampSketch x={110} y={500} w={760} />
    <Hand x={140} y={1318} size={84}>
      To do
    </Hand>
    <svg width={260} height={30} viewBox="0 0 260 30" style={abs(136, 1414)} aria-hidden="true">
      <path d="M6 16 C80 10 160 10 210 14" style={{ ...INK_STROKE, strokeWidth: 4.5 }} />
    </svg>
    <CheckBox x={150} y={1446} done={false} />
    <Hand x={240} y={1418}>
      Call Mira about the <Mark on={search}>hinge</Mark>
    </Hand>
    <CheckBox x={150} y={1546} done />
    <Hand x={240} y={1518}>
      Walnut samples
    </Hand>
    <CheckBox x={150} y={1646} done={false} />
    <Hand x={240} y={1618}>
      Light test at dusk
    </Hand>
    <svg width={560} height={220} viewBox="0 0 560 220" style={abs(860, 1722)} aria-hidden="true">
      <path
        d="M70 52 C190 10 450 18 520 82 C570 134 470 196 280 198 C110 200 20 160 30 110 C38 72 110 44 200 36"
        style={{ ...INK_STROKE, strokeWidth: 4.5 }}
      />
    </svg>
    <Hand x={940} y={1770} size={80}>
      Prototype Fri!
    </Hand>
    <svg width={200} height={200} viewBox="0 0 200 200" style={abs(700, 1540)} aria-hidden="true">
      <path d="M20 30 C70 40 130 90 160 170" style={{ ...INK_STROKE, strokeWidth: 4 }} />
      <path d="M138 156 L160 172 L166 146" style={{ ...INK_STROKE, strokeWidth: 4 }} />
    </svg>
  </div>
);

const SketchLandscape = () => (
  <div style={SCREEN_BOX(SCREEN_H, SCREEN_W)}>
    <svg width={SCREEN_H} height={SCREEN_W} style={abs(0, 0)} aria-hidden="true">
      <path d={RULES_L} stroke="rgba(40,40,40,0.085)" strokeWidth={2} />
    </svg>
    <ScreenChrome w={SCREEN_H} h={SCREEN_W} page="12 / 40" />
    <Hand x={150} y={150} size={124}>
      Desk lamp, v3
    </Hand>
    <svg width={720} height={40} viewBox="0 0 700 40" style={abs(146, 298)} aria-hidden="true">
      <path d="M6 22 C150 12 380 10 640 18" style={{ ...INK_STROKE, strokeWidth: 5 }} />
    </svg>
    <Hand x={150} y={336}>
      Fewer parts. One hinge, not two.
    </Hand>
    <Hand x={150} y={436}>
      Arm folds flat, fits in a drawer.
    </Hand>
    <Hand x={150} y={536}>
      Shade: spun aluminum, matte.
    </Hand>
    <Hand x={150} y={736} size={84}>
      To do
    </Hand>
    <CheckBox x={160} y={864} done={false} />
    <Hand x={250} y={836}>
      Call Mira about the hinge
    </Hand>
    <CheckBox x={160} y={964} done />
    <Hand x={250} y={936}>
      Walnut samples
    </Hand>
    <LampSketch x={1180} y={130} w={820} />
    <Hand x={1560} y={150} size={64}>
      Thu, Oct 8
    </Hand>
  </div>
);

const BookScreen = () => (
  <div
    style={{
      ...SCREEN_BOX(SCREEN_W, SCREEN_H),
      padding: '210px 170px 0',
      boxSizing: 'border-box',
      fontFamily: SERIF,
      color: '#202020',
    }}
  >
    <div
      style={{
        fontSize: 32,
        letterSpacing: '0.24em',
        textAlign: 'center',
        color: '#5C5C5C',
      }}
    >
      CHAPTER THREE
    </div>
    <div
      style={{
        fontSize: 92,
        fontStyle: 'italic',
        textAlign: 'center',
        margin: '40px 0 110px',
        letterSpacing: '-0.01em',
      }}
    >
      Low Tide
    </div>
    <p
      style={{
        fontSize: 50,
        lineHeight: 1.56,
        textAlign: 'justify',
        hyphens: 'auto',
        margin: 0,
        textIndent: 0,
      }}
    >
      <span style={{ fontSize: 150, float: 'left', lineHeight: 0.84, margin: '12px 18px 0 0' }}>
        T
      </span>
      he harbour emptied twice a day, and twice a day the town walked out across it. Children went
      first, then the dogs, then the old men with their buckets and their opinions about the
      weather.{' '}
      <span
        style={{
          textDecoration: 'underline',
          textDecorationColor: '#3A3A3A',
          textDecorationThickness: 4,
          textUnderlineOffset: 12,
        }}
      >
        Nobody hurried. The sea always came back, and everyone knew it.
      </span>
    </p>
    <p
      style={{
        fontSize: 50,
        lineHeight: 1.56,
        textAlign: 'justify',
        hyphens: 'auto',
        margin: '0',
        textIndent: 70,
      }}
    >
      Nell kept a notebook in her coat for the things she found: a blue crab no bigger than a
      thumbnail, a bottle with no message, a word her grandmother used for the smell of wet rope.
      She wrote quickly and badly, and later, by the stove, she wrote it all again.
    </p>
    <p
      style={{
        fontSize: 50,
        lineHeight: 1.56,
        textAlign: 'justify',
        hyphens: 'auto',
        margin: '0',
        textIndent: 70,
      }}
    >
      The second copy was always better. It knew where it was going. But she kept the first one too,
      folded inside the cover, because it still smelled faintly of salt and because the handwriting
      reminded her how cold her fingers had been.
    </p>
    <div
      style={abs(0, SCREEN_H - 120, {
        width: SCREEN_W,
        textAlign: 'center',
        fontSize: 32,
        color: '#7A7A7A',
      })}
    >
      41
    </div>
  </div>
);

const SketchScreen = () => (
  <div style={SCREEN_BOX(SCREEN_W, SCREEN_H)}>
    <ScreenChrome w={SCREEN_W} h={SCREEN_H} page="3 / 18" />
    <Hand x={150} y={190} size={110}>
      Elevation, side
    </Hand>
    <svg width={600} height={40} viewBox="0 0 700 40" style={abs(146, 324)} aria-hidden="true">
      <path d="M6 22 C150 12 380 10 640 18" style={{ ...INK_STROKE, strokeWidth: 6 }} />
    </svg>
    <LampSketch x={150} y={520} w={1260} />
    <Hand x={150} y={1760} size={70}>
      Base weight: 1.2 kg
    </Hand>
  </div>
);

const BlankScreen = () => (
  <div style={SCREEN_BOX(SCREEN_W, SCREEN_H)}>
    <svg width={SCREEN_W} height={SCREEN_H} style={abs(0, 0)} aria-hidden="true">
      <path d={RULES_P} stroke="rgba(40,40,40,0.085)" strokeWidth={2} />
    </svg>
    <ScreenChrome w={SCREEN_W} h={SCREEN_H} page="13 / 40" />
  </div>
);

const QuireMark = ({ size = 34, color = INK }: { size?: number; color?: string }) => (
  <svg width={size * 0.78} height={size} viewBox="0 0 28 36" aria-hidden="true">
    <path
      d="M2 4 C2 2.9 2.9 2 4 2 H18 L26 10 V32 C26 33.1 25.1 34 24 34 H4 C2.9 34 2 33.1 2 32 Z"
      fill={color}
    />
    <path d="M18 2 V8 C18 9.1 18.9 10 20 10 H26" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
  </svg>
);

const Wordmark = ({ size = 34 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.32 }}>
    <QuireMark size={size} />
    <span
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: size,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: INK,
        lineHeight: 1,
      }}
    >
      Quire
    </span>
  </div>
);

const COVER_U = 4.7;
const COVER_Y = 488;

const Cover: Page = () => {
  const live = useIsActivePage();
  const reveal = (delay: number): CSSProperties =>
    live ? { animation: `qs-rise 1.4s ${EASE_OUT} ${delay}s both` } : {};
  const size = slateSize(COVER_U, true);
  const penLen = 162 * COVER_U;
  const penD = penDiameter(penLen);
  return (
    <Stage bg="var(--osd-bg)">
      <div style={abs(0, 96, { width: 1920, display: 'flex', justifyContent: 'center' })}>
        <Wordmark size={34} />
      </div>
      <h1
        style={{
          ...HEAD,
          ...GRAPHITE_TEXT,
          ...abs(0, 160, { width: 1920, textAlign: 'center' }),
          fontSize: 'var(--osd-size-hero)',
          letterSpacing: '-0.035em',
          ...reveal(0.2),
        }}
      >
        Slate
      </h1>
      <div
        style={abs(0, 0, {
          width: 1920,
          height: 1080,
          ...(live ? { animation: `qs-fade 1.6s ${EASE_OUT} 0.7s both` } : {}),
        })}
      >
        <div style={abs((1920 - size.w) / 2, COVER_Y)}>
          <Slate u={COVER_U} landscape>
            <SketchLandscape />
          </Slate>
        </div>
        <div
          style={abs((1920 - penLen) / 2, COVER_Y - penD + 1, {
            filter: `drop-shadow(0 ${penD * 0.12}px ${penD * 0.15}px rgba(0,0,0,0.22))`,
          })}
        >
          <Pen length={penLen} tone={GRAPHITE.pen} />
        </div>
      </div>
    </Stage>
  );
};

const Statement: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage bg={MIST}>
      <div
        style={abs(0, 0, {
          width: 1920,
          height: 1080,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <h2 style={{ ...HEAD, fontSize: 132, textAlign: 'center', position: 'relative' }}>
          We think better on{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            paper.
            <svg
              width={372}
              height={40}
              viewBox="0 0 420 44"
              preserveAspectRatio="none"
              style={abs(-4, 132, { overflow: 'visible' })}
              aria-hidden="true"
            >
              <path
                d="M6 30 C90 18 210 10 330 14 C362 15 392 18 412 22"
                pathLength={1}
                style={{
                  fill: 'none',
                  stroke: EMBER,
                  strokeWidth: 7,
                  strokeLinecap: 'round',
                  strokeDasharray: 1,
                  strokeDashoffset: 0,
                  animation: live ? `qs-draw 0.9s ${EASE_OUT} 0.5s both` : undefined,
                }}
              />
            </svg>
          </span>
        </h2>
        <p style={{ ...COPY, fontSize: 40, maxWidth: 1260, textAlign: 'center', marginTop: 96 }}>
          Paper never pings. It never asks for a password, a charge, or your attention.{' '}
          <Em>It simply holds the thought.</Em> So we set out to make something that feels exactly
          like paper — <Em>and remembers everything you put on it.</Em>
        </p>
      </div>
    </Stage>
  );
};

const INTRO_U = 2.44;
const INTRO_POS = { x: 700, y: 404 };
const DISPLAY_U = 5.6;
const DISPLAY_POS = { x: 900, y: 150 };

const MorphSlate = ({ u, x, y }: { u: number; x: number; y: number }) => {
  const { w, h } = slateSize(u);
  return (
    <MorphElement id="quire-slate">
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
        <Slate u={u}>
          <NotesScreen />
        </Slate>
      </div>
    </MorphElement>
  );
};

const Introducing: Page = () => {
  const { w, h } = slateSize(INTRO_U);
  const penLen = 162 * INTRO_U;
  return (
    <Stage bg="var(--osd-bg)">
      <div
        style={abs(0, 100, {
          width: 1920,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        })}
      >
        <p style={EYEBROW}>New</p>
        <h1 style={{ ...HEAD, fontSize: 120, marginTop: 14 }}>Quire Slate</h1>
        <p
          style={{
            ...COPY,
            fontSize: 44,
            color: INK,
            fontWeight: 500,
            marginTop: 22,
            letterSpacing: '-0.015em',
          }}
        >
          Paper, with a memory.
        </p>
      </div>
      <MorphSlate u={INTRO_U} x={INTRO_POS.x} y={INTRO_POS.y} />
      <StandingPen
        x={INTRO_POS.x + w + 44}
        y={INTRO_POS.y + (h - penLen) / 2}
        length={penLen}
        tone={GRAPHITE.pen}
      />
    </Stage>
  );
};

const LOUPE = { fx: 1252, fy: 263, d: 360, zoom: 2.4 };

const Loupe = ({ live }: { live: boolean }) => {
  const scr = slateScreen(DISPLAY_U);
  const k = scr.k;
  const cx = DISPLAY_POS.x + scr.x + LOUPE.fx * k;
  const cy = DISPLAY_POS.y + scr.y + LOUPE.fy * k;
  const D = LOUPE.d;
  return (
    <div
      data-loupe=""
      style={abs(cx - D / 2, cy - D / 2, {
        width: D,
        height: D,
        borderRadius: '50%',
        animation: live ? `qs-loupe 0.7s ${EASE_OUT} ${MORPH_MS / 1000 + 0.1}s both` : undefined,
      })}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          background: PAPER,
          boxShadow:
            '0 0 0 7px #FFFFFF, 0 0 0 8px rgba(0,0,0,0.06), 0 24px 60px rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `scale(${LOUPE.zoom})`,
            transformOrigin: `${D / 2}px ${D / 2}px`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: D / 2 - LOUPE.fx * k,
              top: D / 2 - LOUPE.fy * k,
              width: SCREEN_W,
              height: SCREEN_H,
              transform: `scale(${k})`,
              transformOrigin: '0 0',
            }}
          >
            <NotesScreen />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            backgroundSize: `${220 * LOUPE.zoom}px ${220 * LOUPE.zoom}px`,
            opacity: 0.08,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 42%)',
            boxShadow: 'inset 0 0 18px rgba(0,0,0,0.12)',
          }}
        />
      </div>
    </div>
  );
};

const Display: Page = () => {
  const live = useIsActivePage();
  const after = (extra = 0): CSSProperties =>
    live ? { animation: `qs-fade 0.6s ${EASE_OUT} ${MORPH_MS / 1000 + extra}s both` } : {};
  return (
    <Stage bg="var(--osd-bg)">
      <MorphSlate u={DISPLAY_U} x={DISPLAY_POS.x} y={DISPLAY_POS.y} />
      <Loupe live={live} />
      <div style={abs(140, 170, { width: 680, ...after(-0.3) })}>
        <p style={EYEBROW}>Canvas display</p>
        <h2 style={{ ...HEAD, fontSize: 88, marginTop: 20 }}>
          Crisp as print.
          <br />
          Calm as paper.
        </h2>
        <p style={{ ...COPY, marginTop: 44 }}>
          A 10.3-inch e-paper display at <Em>300 pixels per inch.</Em> Etched glass gives every
          stroke <Em>the gentle drag of paper.</Em> No glare. No flicker.
        </p>
        <div style={{ display: 'flex', gap: 72, marginTop: 64, alignItems: 'flex-end' }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontWeight: 600,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 112 }}>300</span>
              <span style={{ fontSize: 40, letterSpacing: '-0.01em' }}>ppi</span>
            </div>
            <div style={{ ...CAPTION, marginTop: 14 }}>Pixel density</div>
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div
              style={{
                width: 260,
                height: 12,
                borderRadius: 6,
                background: 'linear-gradient(90deg, #EAF0F8 0%, #F6F1E6 50%, #F4C98C 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 172,
                  top: -9,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow:
                    '0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.12)',
                }}
              />
            </div>
            <div style={{ ...CAPTION, marginTop: 30 }}>Warm front light</div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

const SlateEdge = ({ length, finish }: { length: number; finish: Finish }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = finish.side;
  return (
    <svg
      width={length}
      height={(length * 49) / 2460}
      viewBox="0 0 2460 49"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s[0]} />
          <stop offset="0.05" stopColor={s[1]} />
          <stop offset="0.17" stopColor={s[2]} />
          <stop offset="0.21" stopColor={s[3]} />
          <stop offset="0.36" stopColor={s[4]} />
          <stop offset="0.66" stopColor={s[5]} />
          <stop offset="0.88" stopColor={s[6]} />
          <stop offset="0.95" stopColor={s[7]} />
          <stop offset="1" stopColor={s[8]} />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="0.012" stopColor="rgba(0,0,0,0)" />
          <stop offset="0.3" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="0.45" stopColor="rgba(255,255,255,0)" />
          <stop offset="0.988" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="2460" height="49" rx="18" fill={`url(#${id}v)`} />
      <rect x="0" y="0" width="2460" height="49" rx="18" fill={`url(#${id}h)`} />
    </svg>
  );
};

const Pencil = ({ length }: { length: number }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg
      width={length}
      height={(length * 70) / 1750}
      viewBox="0 0 1750 70"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F1F1F3" />
          <stop offset="0.228" stopColor="#E6E6E9" />
          <stop offset="0.232" stopColor="#D9D9DD" />
          <stop offset="0.5" stopColor="#D2D2D6" />
          <stop offset="0.768" stopColor="#C6C6CB" />
          <stop offset="0.772" stopColor="#B6B6BB" />
          <stop offset="1" stopColor="#ADADB2" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2EDE4" />
          <stop offset="0.5" stopColor="#E4DCCF" />
          <stop offset="1" stopColor="#CFC6B7" />
        </linearGradient>
      </defs>
      <path d="M1480 0 L1698 29.4 L1698 40.6 L1480 70 Z" fill={`url(#${id}w)`} />
      <path d="M1694 29 L1750 35 L1694 41 Z" fill="#6E6E73" />
      <path
        d="M0 0 H1502 Q1514 8 1530 16 Q1498 35 1530 54 Q1514 62 1502 70 H0 Z"
        fill={`url(#${id}p)`}
      />
    </svg>
  );
};

const THIN_EDGE = { x: 210, y: 770, length: 1400 };

const Thin: Page = () => {
  const u = THIN_EDGE.length / 246;
  const t = 4.9 * u;
  const pencilLen = 175 * u;
  const pencilH = 7 * u;
  const pencilY = 616;
  const dimX = THIN_EDGE.x + THIN_EDGE.length + 40;
  return (
    <Stage bg={MIST}>
      <div style={abs(210, 140, { width: 1100 })}>
        <p style={EYEBROW}>Design</p>
        <h2
          style={{
            ...HEAD,
            ...GRAPHITE_TEXT,
            fontSize: 220,
            letterSpacing: '-0.04em',
            marginTop: 8,
            lineHeight: 1,
          }}
        >
          4.9 mm
        </h2>
      </div>
      <p style={{ ...COPY, ...abs(1080, 236, { width: 720 }) }}>
        <Em>Thinner than a pencil.</Em> At 340 grams, lighter than most notebooks. Machined from a
        single block of <Em>recycled aluminum.</Em>
      </p>
      <Steps>
        <Step duration={420}>
          <div style={abs(THIN_EDGE.x, pencilY)}>
            <Pencil length={pencilLen} />
          </div>
          <div
            style={abs(THIN_EDGE.x + pencilLen + 40, pencilY + pencilH / 2 - 16, {
              ...CAPTION,
              fontSize: 26,
            })}
          >
            Pencil, 7 mm
          </div>
        </Step>
      </Steps>
      <div
        style={abs(THIN_EDGE.x + 40, THIN_EDGE.y + t + 6, {
          width: THIN_EDGE.length - 80,
          height: 40,
          background:
            'radial-gradient(closest-side, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0) 100%)',
          filter: 'blur(4px)',
        })}
      />
      <div style={abs(THIN_EDGE.x, THIN_EDGE.y)}>
        <SlateEdge length={THIN_EDGE.length} finish={GRAPHITE} />
      </div>
      <svg
        width={200}
        height={t + 120}
        viewBox={`0 0 200 ${t + 120}`}
        style={abs(dimX - 30, THIN_EDGE.y - 60, { overflow: 'visible' })}
        aria-hidden="true"
      >
        <g stroke={SECOND} strokeWidth={1.5} fill="none">
          <path d={`M0 60 H70 M0 ${60 + t} H70`} />
          <path d={`M50 4 V60 M50 ${60 + t} V${t + 116}`} />
          <path d="M44 48 L50 60 L56 48" />
          <path d={`M44 ${72 + t} L50 ${60 + t} L56 ${72 + t}`} />
        </g>
      </svg>
      <div
        style={abs(dimX + 44, THIN_EDGE.y + t / 2 - 20, {
          fontFamily: 'var(--osd-font-display)',
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: INK,
        })}
      >
        4.9 mm
      </div>
      <div style={abs(THIN_EDGE.x, THIN_EDGE.y + t + 56, { ...CAPTION, fontSize: 26 })}>
        Quire Slate, shown at actual proportion
      </div>
    </Stage>
  );
};

const loopStroke = (() => {
  const x0 = 1190;
  const y0 = 618;
  const a = 17;
  const b = 30;
  const start = -0.55 * Math.PI;
  const end = 5 * 2 * Math.PI + 0.42 * Math.PI;
  const N = 600;
  let d = '';
  for (let i = 0; i <= N; i++) {
    const t = start + ((end - start) * i) / N;
    const c = Math.cos(t);
    const yy = -(c > 0 ? 1.75 : 0.62) * b * c;
    const x = x0 + a * t - b * Math.sin(t) * 0.92 - yy * 0.34;
    const y = y0 + yy - t * 0.5;
    d += `${i === 0 ? 'M' : ' L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
})();

const INK_U = 7.2;
const INK_POS = { x: 1012, y: 150 };
const DRAW_S = 2.4;

const WritingPen = ({ live }: { live: boolean }) => {
  const L = 162 * INK_U * 0.92;
  const D = penDiameter(L);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        offsetPath: `path('${loopStroke}')`,
        offsetRotate: '0deg',
        offsetAnchor: 'left top',
        offsetDistance: '100%',
        animation: live ? `qs-glide ${DRAW_S}s cubic-bezier(0.3, 0, 0.3, 1) 0.5s both` : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: 'rotate(45deg)',
          transformOrigin: '0 0',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: -D * 0.5,
            width: L,
            height: D,
            borderRadius: D,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.12) 25%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.02) 100%)',
            clipPath: 'polygon(0 46%, 14% 22%, 100% 12%, 100% 88%, 14% 78%, 0 54%)',
            filter: 'blur(7px)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: 'rotate(220deg) scaleY(-1)',
          transformOrigin: '0 0',
        }}
      >
        <div style={{ position: 'absolute', left: -L, top: -D / 2 }}>
          <Pen length={L} tone={GRAPHITE.pen} />
        </div>
      </div>
    </div>
  );
};

const LatencyBar = ({
  value,
  label,
  width,
  strong,
}: {
  value: string;
  label: string;
  width: number;
  strong: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
    <div
      style={{
        width,
        height: 14,
        borderRadius: 7,
        background: strong ? INK : HAIR,
      }}
    />
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 30,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: strong ? INK : TERT,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <span style={{ fontWeight: 500, color: TERT, marginLeft: 14 }}>{value}</span>
    </div>
  </div>
);

const Ink: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage bg="var(--osd-bg)">
      <div style={abs(INK_POS.x, INK_POS.y)}>
        <Slate u={INK_U}>
          <BlankScreen />
        </Slate>
      </div>
      <svg width={1920} height={1080} style={abs(0, 0)} aria-hidden="true">
        <path
          d={loopStroke}
          pathLength={1}
          style={{
            fill: 'none',
            stroke: PEN_INK,
            strokeWidth: 4.2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeDasharray: 1,
            strokeDashoffset: 0,
            animation: live
              ? `qs-draw ${DRAW_S}s cubic-bezier(0.3, 0, 0.3, 1) 0.5s both`
              : undefined,
          }}
        />
      </svg>
      <WritingPen live={live} />
      <div style={abs(140, 170, { width: 740 })}>
        <p style={EYEBROW}>Latency</p>
        <h2 style={{ ...HEAD, fontSize: 88, marginTop: 20 }}>
          Ink that
          <br />
          keeps up.
        </h2>
        <p style={{ ...COPY, marginTop: 44, width: 700 }}>
          Every stroke lands in <Em>9 milliseconds</Em>, less than half the wait on Quire Folio.
          Fast enough that ink seems to <Em>flow straight from the tip.</Em>
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            marginTop: 60,
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: 120 }}>9</span>
          <span style={{ fontSize: 44, letterSpacing: '-0.01em' }}>ms</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 32 }}>
          <LatencyBar value="9 ms" label="Quire Slate" width={9 * 17} strong />
          <LatencyBar value="21 ms" label="Quire Folio" width={21 * 17} strong={false} />
        </div>
      </div>
    </Stage>
  );
};

const PEN_HERO = { x: 260, y: 596, length: 1400 };

const Callout = ({
  x,
  above,
  title,
  body,
  at,
}: {
  x: number;
  above: boolean;
  title: string;
  body: string;
  at?: number;
}) => {
  const D = penDiameter(PEN_HERO.length);
  const top = PEN_HERO.y;
  const dotY = top + D * (at ?? (above ? 0.18 : 0.82));
  const end = above ? top - 84 : top + D + 84;
  const lineTop = above ? end : dotY + 6;
  const lineLen = above ? dotY - 6 - end : end - lineTop;
  return (
    <>
      <div
        style={abs(x - 6, dotY - 6, {
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 0 0 1.5px rgba(29,29,31,0.55), 0 1px 3px rgba(0,0,0,0.2)',
        })}
      />
      <div
        style={abs(x - 0.75, lineTop, {
          width: 1.5,
          height: lineLen,
          background: 'rgba(29,29,31,0.35)',
        })}
      />
      <div
        style={abs(x - 260, above ? end - 112 : end + 22, {
          width: 520,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        })}
      >
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '-0.015em',
            color: INK,
          }}
        >
          {title}
        </div>
        <div style={{ ...CAPTION, fontSize: 26, marginTop: 10, lineHeight: 1.35 }}>{body}</div>
      </div>
    </>
  );
};

const PenPage: Page = () => (
  <Stage bg={MIST}>
    <div
      style={abs(0, 116, {
        width: 1920,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      })}
    >
      <p style={EYEBROW}>Quire Pen</p>
      <h2 style={{ ...HEAD, fontSize: 88, marginTop: 14 }}>Balanced. Weighted. Ready.</h2>
    </div>
    <div
      style={abs(PEN_HERO.x + 20, PEN_HERO.y + penDiameter(PEN_HERO.length) + 26, {
        width: PEN_HERO.length - 40,
        height: 36,
        background:
          'radial-gradient(closest-side, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.07) 55%, rgba(0,0,0,0) 100%)',
        filter: 'blur(6px)',
      })}
    />
    <div style={abs(PEN_HERO.x, PEN_HERO.y)}>
      <Pen length={PEN_HERO.length} tone={GRAPHITE.pen} />
    </div>
    <Steps>
      <Step duration={320}>
        <Callout
          x={PEN_HERO.x + 70}
          above
          title="Eraser end"
          body="Flip it over to erase, like a pencil."
        />
      </Step>
      <Step duration={320}>
        <Callout
          x={PEN_HERO.x + 520}
          above
          at={0.12}
          title="Flat side"
          body="Snaps to Slate. Never rolls away."
        />
      </Step>
      <Step duration={320}>
        <Callout
          x={PEN_HERO.x + 860}
          above={false}
          title="No charging. Ever."
          body="Powered by the display beneath it."
        />
      </Step>
      <Step duration={320}>
        <Callout
          x={PEN_HERO.x + 1330}
          above={false}
          at={0.56}
          title="4,096 pressure levels"
          body="With tilt, for shading like graphite."
        />
      </Step>
    </Steps>
  </Stage>
);

const SEARCH_U = 2.9;
const SEARCH_POS = { x: 1080, y: 182 };

const Software: Page = () => {
  const { w, h } = slateSize(SEARCH_U);
  return (
    <Stage bg="var(--osd-bg)">
      <div style={abs(140, 250, { width: 760 })}>
        <p style={EYEBROW}>Quire OS</p>
        <h2 style={{ ...HEAD, fontSize: 88, marginTop: 20 }}>
          Your handwriting.
          <br />
          Searchable.
        </h2>
        <p style={{ ...COPY, marginTop: 44, width: 720 }}>
          Slate reads your handwriting as you write, in <Em>{'34\u00a0languages.'}</Em> Find any
          note in an instant, or <Em>turn a page into typed text</Em> with a tap.
        </p>
        <p
          style={{
            ...COPY,
            marginTop: 40,
            fontSize: 30,
            color: 'var(--osd-accent)',
            fontWeight: 500,
          }}
        >
          Learn more about Quire OS ›
        </p>
      </div>
      <div style={abs(SEARCH_POS.x, SEARCH_POS.y, { width: w, height: h })}>
        <Slate u={SEARCH_U}>
          <NotesScreen search />
        </Slate>
      </div>
      <div
        style={abs(SEARCH_POS.x - 150, SEARCH_POS.y + h - 330, {
          width: 470,
          padding: '28px 32px 30px',
          boxSizing: 'border-box',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.74)',
          backdropFilter: 'blur(22px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.5)',
          boxShadow:
            '0 0 0 0.5px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06), 0 22px 56px rgba(0,0,0,0.16)',
        })}
      >
        <div
          style={{
            ...CAPTION,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: TERT,
            textTransform: 'uppercase',
          }}
        >
          Converted to text
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 28,
            lineHeight: 1.4,
            fontWeight: 500,
            color: INK,
            letterSpacing: '-0.01em',
          }}
        >
          Fewer parts. One hinge, not two.
          <br />
          Arm folds flat, fits in a drawer.
        </div>
      </div>
    </Stage>
  );
};

const WeekLabel = ({ x, label }: { x: number; label: string }) => (
  <div style={abs(x, 0, { width: 190, textAlign: 'center', ...CAPTION })}>{label}</div>
);

const BATTERY = { x: 360, y: 700, seg: 190, gap: 12 };

const dayTicks = (() => {
  let d = '';
  for (let w = 0; w < 6; w++) {
    for (let i = 0; i < 7; i++) {
      const x = w * (BATTERY.seg + BATTERY.gap) + 8 + (i * (BATTERY.seg - 16)) / 6;
      d += `M${x.toFixed(1)} 0 V10`;
    }
  }
  return d;
})();

const Battery: Page = () => {
  const live = useIsActivePage();
  const s = BATTERY.seg;
  const g = BATTERY.gap;
  const total = 6 * s + 5 * g;
  return (
    <Stage bg={MIST}>
      <div
        style={abs(0, 150, {
          width: 1920,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        })}
      >
        <p style={EYEBROW}>Battery</p>
        <h2
          style={{
            ...HEAD,
            ...WARM_TEXT,
            fontSize: 200,
            letterSpacing: '-0.04em',
            marginTop: 10,
            lineHeight: 1,
          }}
        >
          Six weeks.
        </h2>
        <p style={{ ...COPY, fontSize: 40, marginTop: 40, textAlign: 'center', maxWidth: 1180 }}>
          <Em>Up to six weeks on a single charge.¹</Em> And when you do plug in, fifteen minutes
          over USB‑C gives you another week.
        </p>
      </div>
      <div style={abs(BATTERY.x, BATTERY.y, { width: total, height: 120 })}>
        <svg width={total} height={10} style={abs(0, 0)} aria-hidden="true">
          <path d={dayTicks} stroke={HAIR} strokeWidth={2} />
        </svg>
        <div style={abs(0, 26, { width: total, height: 14 })}>
          <svg width={total} height={14} style={abs(0, 0)} aria-hidden="true">
            <defs>
              <linearGradient
                id="qs-battery"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2={total}
                y2="0"
              >
                <stop offset="0" stopColor="#9C3F12" />
                <stop offset="0.5" stopColor="#C8652A" />
                <stop offset="1" stopColor="#D99A61" />
              </linearGradient>
            </defs>
          </svg>
          <div
            style={abs(0, 0, {
              width: total,
              height: 14,
              transformOrigin: '0 50%',
              animation: live ? 'qs-fill 2.4s cubic-bezier(0.25, 0, 0.2, 1) 0.4s both' : undefined,
            })}
          >
            <svg width={total} height={14} style={abs(0, 0)} aria-hidden="true">
              <rect x={0} y={0} width={s} height={14} rx={7} fill="url(#qs-battery)" />
              <rect x={s + g} y={0} width={s} height={14} rx={7} fill="url(#qs-battery)" />
              <rect x={2 * (s + g)} y={0} width={s} height={14} rx={7} fill="url(#qs-battery)" />
              <rect x={3 * (s + g)} y={0} width={s} height={14} rx={7} fill="url(#qs-battery)" />
              <rect x={4 * (s + g)} y={0} width={s} height={14} rx={7} fill="url(#qs-battery)" />
              <rect x={5 * (s + g)} y={0} width={s} height={14} rx={7} fill="url(#qs-battery)" />
            </svg>
          </div>
        </div>
        <div style={abs(0, 64, { width: total, height: 40 })}>
          <WeekLabel x={0} label="Week 1" />
          <WeekLabel x={s + g} label="Week 2" />
          <WeekLabel x={2 * (s + g)} label="Week 3" />
          <WeekLabel x={3 * (s + g)} label="Week 4" />
          <WeekLabel x={4 * (s + g)} label="Week 5" />
          <WeekLabel x={5 * (s + g)} label="Week 6" />
        </div>
      </div>
      <p
        style={{
          ...abs(360, 960, { width: 1200, textAlign: 'center' }),
          ...CAPTION,
          fontSize: 20,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        1. Tested with 30 minutes of writing a day, front light off and wireless off. Battery life
        varies with use and settings.
      </p>
    </Stage>
  );
};

const FINISH_U = 2.08;

const FinishCard = ({
  x,
  finish,
  children,
}: {
  x: number;
  finish: Finish;
  children: ReactNode;
}) => {
  const { w, h } = slateSize(FINISH_U);
  const penLen = 162 * FINISH_U;
  const top = 330;
  return (
    <>
      <div style={abs(x, top)}>
        <Slate u={FINISH_U} finish={finish}>
          {children}
        </Slate>
      </div>
      <StandingPen
        x={x + w + 2}
        y={top + (h - penLen) / 2}
        length={penLen}
        tone={finish.pen}
        tipUp
      />
      <div
        style={abs(x, top + h + 64, {
          width: w,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        })}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: finish.dot,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
          }}
        />
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: INK,
          }}
        >
          {finish.name}
        </div>
      </div>
    </>
  );
};

const Finishes: Page = () => {
  const w = slateSize(FINISH_U).w;
  const gap = 150;
  const group = 3 * w + 2 * gap;
  const x0 = (1920 - group) / 2;
  return (
    <Stage bg="var(--osd-bg)">
      <div
        style={abs(0, 110, {
          width: 1920,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        })}
      >
        <p style={EYEBROW}>Finishes</p>
        <h2 style={{ ...HEAD, fontSize: 96, marginTop: 14 }}>Chalk. Graphite. Sage.</h2>
      </div>
      <FinishCard x={x0} finish={CHALK}>
        <BookScreen />
      </FinishCard>
      <FinishCard x={x0 + w + gap} finish={GRAPHITE}>
        <NotesScreen />
      </FinishCard>
      <FinishCard x={x0 + 2 * (w + gap)} finish={SAGE}>
        <SketchScreen />
      </FinishCard>
    </Stage>
  );
};

const Tile = ({
  x,
  y,
  w,
  h,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children: ReactNode;
}) => (
  <div
    style={abs(x, y, {
      width: w,
      height: h,
      borderRadius: 'var(--osd-radius)',
      background: '#FFFFFF',
      overflow: 'hidden',
    })}
  >
    {children}
  </div>
);

const BigStat = ({
  value,
  unit,
  label,
  pre,
}: {
  value: string;
  unit?: string;
  label: string;
  pre?: string;
}) => (
  <div style={abs(44, 0, { bottom: 40, top: 'auto' })}>
    {pre && <div style={{ ...CAPTION, fontSize: 24, color: INK, fontWeight: 600 }}>{pre}</div>}
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 600,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        color: INK,
      }}
    >
      <span style={{ fontSize: 96 }}>{value}</span>
      {unit && <span style={{ fontSize: 36, letterSpacing: '-0.01em' }}>{unit}</span>}
    </div>
    <div style={{ ...CAPTION, fontSize: 26, marginTop: 12 }}>{label}</div>
  </div>
);

const miniLoop = (() => {
  const pts: string[] = [];
  const N = 260;
  for (let i = 0; i <= N; i++) {
    const t = -0.5 * Math.PI + ((4 * 2 * Math.PI + 0.8 * Math.PI) * i) / N;
    const yy = -26 * Math.cos(t);
    const x = 20 + 11 * t - 14 * Math.sin(t) - yy * 0.3;
    const y = 60 + yy;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

const BENTO = { x: 120, y: 236, w: 1680, h: 744, gap: 24 };

const Bento: Page = () => {
  const cw = (BENTO.w - 3 * BENTO.gap) / 4;
  const rh = (BENTO.h - BENTO.gap) / 2;
  const c3 = BENTO.x + 2 * (cw + BENTO.gap);
  const c4 = BENTO.x + 3 * (cw + BENTO.gap);
  const r2 = BENTO.y + rh + BENTO.gap;
  const bigW = 2 * cw + BENTO.gap;
  const pu = 1.86;
  const ps = slateSize(pu);
  const penLen = 162 * pu;
  return (
    <Stage bg={MIST}>
      <h2 style={{ ...HEAD, ...abs(120, 108), fontSize: 72 }}>Quire Slate. At a glance.</h2>
      <Tile x={BENTO.x} y={BENTO.y} w={bigW} h={BENTO.h}>
        <div style={abs(56, 52)}>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: INK,
            }}
          >
            Quire Slate
          </div>
          <div style={{ ...CAPTION, fontSize: 26, marginTop: 8 }}>
            10.3-inch Canvas display. 340 grams.
          </div>
        </div>
        <div style={abs((bigW - ps.w - 60) / 2, BENTO.h - ps.h - 56)}>
          <Slate u={pu}>
            <NotesScreen />
          </Slate>
        </div>
        <StandingPen
          x={(bigW - ps.w - 60) / 2 + ps.w + 40}
          y={BENTO.h - 56 - (ps.h + penLen) / 2}
          length={penLen}
          tone={GRAPHITE.pen}
        />
      </Tile>
      <Tile x={c3} y={BENTO.y} w={cw} h={rh}>
        <div style={abs(44, 92)}>
          <SlateEdge length={cw - 88} finish={GRAPHITE} />
        </div>
        <BigStat value="4.9" unit="mm" label="Thinner than a pencil" />
      </Tile>
      <Tile x={c4} y={BENTO.y} w={cw} h={rh}>
        <div
          style={abs(cw - 44 - 120, 40, {
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: PAPER,
            boxShadow:
              '0 0 0 4px #FFFFFF, 0 0 0 5px rgba(0,0,0,0.08), 0 10px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: SERIF,
            fontSize: 64,
            color: '#202020',
          })}
        >
          Aa
        </div>
        <BigStat value="300" unit="ppi" label="Canvas display" />
      </Tile>
      <Tile x={c3} y={r2} w={cw} h={rh}>
        <svg width={260} height={110} viewBox="0 0 260 110" style={abs(40, 34)} aria-hidden="true">
          <path
            d={miniLoop}
            style={{
              fill: 'none',
              stroke: INK,
              strokeWidth: 3,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
          />
        </svg>
        <BigStat value="9" unit="ms" label="Pen latency" />
      </Tile>
      <Tile x={c4} y={r2} w={cw} h={rh}>
        <div
          style={abs(44, 64, {
            width: cw - 88,
            height: 12,
            borderRadius: 6,
            background: 'linear-gradient(90deg, #9C3F12 0%, #C8652A 50%, #D99A61 100%)',
          })}
        />
        <BigStat pre="Up to" value="6" unit="weeks" label="Battery life" />
      </Tile>
    </Stage>
  );
};

const PRICE_U = 2.5;

const Price: Page = () => {
  const { w, h } = slateSize(PRICE_U);
  const penLen = 162 * PRICE_U;
  const sx = 330;
  const sy = (1080 - h) / 2;
  return (
    <Stage bg="var(--osd-bg)">
      <div style={abs(sx, sy)}>
        <Slate u={PRICE_U}>
          <NotesScreen />
        </Slate>
      </div>
      <StandingPen x={sx + w + 44} y={sy + (h - penLen) / 2} length={penLen} tone={GRAPHITE.pen} />
      <div style={abs(1080, 300, { width: 720 })}>
        <p
          style={{
            ...HEAD,
            fontSize: 40,
            letterSpacing: '-0.015em',
          }}
        >
          Quire Slate
        </p>
        <h2 style={{ ...HEAD, fontSize: 140, letterSpacing: '-0.035em', marginTop: 18 }}>
          From $499.
        </h2>
        <p style={{ ...COPY, marginTop: 30, fontSize: 36 }}>
          <Em>Quire Pen included.</Em> Order today.
          <br />
          Available Friday, November 6.²
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 44, marginTop: 56 }}>
          <div
            style={{
              background: 'var(--osd-accent)',
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              padding: '16px 34px',
              borderRadius: 999,
            }}
          >
            Buy
          </div>
          <div
            style={{
              color: 'var(--osd-accent)',
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            Learn more ›
          </div>
        </div>
      </div>
      <p style={{ ...abs(1080, 980, { width: 720 }), ...CAPTION, fontSize: 20, margin: 0 }}>
        2. In the U.S., Canada, the U.K., Germany, France and Japan.
      </p>
    </Stage>
  );
};

Cover.transition = settle;
Introducing.transition = morphTransition;
Display.transition = morphTransition;

export const meta: SlideMeta = {
  title: 'Quire Slate — Keynote',
  createdAt: '2026-10-12T05:14:59.412Z',
};

export const notes: (string | undefined)[] = [
  `Walk out to a white stage. Let "Slate" settle before you say anything.
"Good morning. Thank you for being here."
"Today we want to talk about something very old, and something very new."
Click.`,
  `Read the headline slowly. "We think better on paper."
"Paper never pings. It never needs a password or a charger. It just holds the thought."
"So two years ago we asked a simple question: what if paper could remember everything you put on it?"
Pause. Click.`,
  `"This is Quire Slate."
Let it sit for a beat — don't fill the silence.
"Paper, with a memory. A ten-point-three-inch e-paper tablet you write on with Quire Pen, and it's in the box."
Click — the Slate glides forward into the next page.`,
  `"Let's start with the display."
"Three hundred pixels per inch. That's sharper than most printed books."
Point at the loupe: "Look at the edges of the ink. No jaggies, no shimmer."
"And the glass is etched, so the pen has a little bite, just like paper."
"There's a warm front light too, from daylight white all the way down to candlelight." Click.`,
  `"Now pick it up."
Pause for the number. "Four point nine millimetres."
Click to bring in the pencil. "That's thinner than a pencil. And at three hundred and forty grams, it weighs less than most paper notebooks."
"One piece of recycled aluminum." Click.`,
  `"Of course, a writing tablet is only as good as its ink."
Let the stroke draw itself.
"Nine milliseconds from the tip to the screen. On Quire Folio it was twenty-one."
"At nine, your brain stops noticing. It just feels like ink." Click.`,
  `"And this is Quire Pen."
Click through the four callouts, left to right:
"An eraser on the end — flip it, like a pencil."
"A flat side that snaps to Slate, so it never rolls away."
"No battery. It's powered by the display itself, so it's always ready."
"And four thousand ninety-six levels of pressure, with tilt, for shading." Click.`,
  `"Writing it down is half the job. Finding it again is the other half."
"Slate reads your handwriting as you write — thirty-four languages."
"Search 'hinge' and it finds every page, across every notebook."
"And when you need to send it, one tap turns your page into typed text." Click.`,
  `"Battery."
Let the bar fill. "Up to six weeks on a single charge."
"Six weeks. You'll forget where you put the cable."
"And fifteen minutes on USB-C buys you another week."
Point to the footnote only if asked: thirty minutes of writing a day, light and wireless off. Click.`,
  `"Slate comes in three finishes."
Left to right: "Chalk. Graphite. And Sage."
"Each one with a matching Quire Pen, which snaps right to the side."
Beat. Click.`,
  `"So here it is, at a glance."
Tap the tiles in order: "Four point nine millimetres. Three hundred ppi. Nine milliseconds. Up to six weeks."
"All in three hundred and forty grams." Click.`,
  `"Quire Slate starts at four hundred and ninety-nine dollars, with Quire Pen included."
"You can order it today, and it's in stores Friday, November sixth, in six countries."
Pause. "We can't wait to see what you write on it."
"Thank you." Hold here for Q&A.`,
];

export default [
  Cover,
  Statement,
  Introducing,
  Display,
  Thin,
  Ink,
  PenPage,
  Software,
  Battery,
  Finishes,
  Bento,
  Price,
] satisfies Page[];

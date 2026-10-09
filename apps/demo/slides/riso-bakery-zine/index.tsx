import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useId } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#f2eadb', text: '#1d3285', accent: '#ff48b0' },
  fonts: {
    display: 'Anton, "Arial Narrow", Impact, sans-serif',
    body: '"Courier Prime", "Courier New", Courier, monospace',
  },
  typeScale: { hero: 330, body: 30 },
  radius: 4,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@700&family=Courier+Prime:wght@400;700&display=swap';
const FONT_LINK_ID = 'osd-webfont-riso-bakery-zine';
if (typeof document !== 'undefined') {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== FONT_HREF) link.href = FONT_HREF;
}

const STYLE_ID = 'osd-styles-riso-bakery-zine';
const css = `
@keyframes crumb-wobble { 0%, 100% { transform: rotate(12deg) } 50% { transform: rotate(5deg) } }
@keyframes crumb-steam { 0% { opacity: 0; transform: translateY(10px) } 40% { opacity: .9 } 100% { opacity: 0; transform: translateY(-26px) } }
`;
if (typeof document !== 'undefined') {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

const pink = '#ff48b0';
const blue = '#0078bf';
const yellow = '#ffe14d';
const teal = '#00a19a';
const paper = '#fbf7ee';
const hand = 'Caveat, "Comic Sans MS", cursive';

const EASE_OUT = 'cubic-bezier(0.2, 0.9, 0.3, 1.15)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: 'cubic-bezier(0.4, 0, 1, 1)', keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translate(0, -10px) rotate(-0.6deg) scale(1.015)' },
      { opacity: 1, transform: 'translate(0, 0) rotate(0deg) scale(1)' },
    ],
  },
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.16  0 0 0 0 0.13  0 0 0 0 0.24  2.6 0 0 0 -1.1'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

const dots = (color: string, size = 14, r = 38): CSSProperties => ({
  backgroundImage: `radial-gradient(circle at center, ${color} 0 ${r}%, transparent ${r + 2}%)`,
  backgroundSize: `${size}px ${size}px`,
});

const usePid = () => `crumb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

const Folio = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 44,
        textAlign: 'center',
        fontFamily: 'var(--osd-font-body)',
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'var(--osd-text)',
      }}
    >
      CRUMB &amp; CO. · YEAR ONE ·{' '}
      <span style={{ background: yellow, padding: '2px 8px', mixBlendMode: 'multiply' }}>
        p. {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const Sheet = ({ children, folio = true }: { children: ReactNode; folio?: boolean }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    {folio && <Folio />}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: GRAIN,
        mixBlendMode: 'multiply',
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    />
  </div>
);

const Ink = ({
  children,
  size,
  back = pink,
  front = blue,
  dx = 7,
  dy = 5,
  lh = 0.86,
  backDots,
  style,
}: {
  children: ReactNode;
  size: number;
  back?: string;
  front?: string;
  dx?: number;
  dy?: number;
  lh?: number;
  backDots?: boolean;
  style?: CSSProperties;
}) => (
  <div
    style={{
      position: 'relative',
      fontFamily: 'var(--osd-font-display)',
      fontSize: size,
      lineHeight: lh,
      textTransform: 'uppercase',
      letterSpacing: '0.005em',
      whiteSpace: 'nowrap',
      isolation: 'isolate',
      ...style,
    }}
  >
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: dx,
        top: dy,
        color: back,
        mixBlendMode: 'multiply',
        ...(backDots
          ? {
              ...dots(back, 12, 46),
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }
          : {}),
      }}
    >
      {children}
    </div>
    <div style={{ position: 'relative', color: front, mixBlendMode: 'multiply' }}>{children}</div>
  </div>
);

const Tape = ({ style }: { style: CSSProperties }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      width: 170,
      height: 46,
      background: 'rgba(255, 225, 77, 0.78)',
      mixBlendMode: 'multiply',
      clipPath: 'polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 95%, 0 45%)',
      ...style,
    }}
  />
);

const Staple = ({ top }: { top: number }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      left: 40,
      top,
      width: 9,
      height: 74,
      borderRadius: 3,
      background: 'linear-gradient(90deg, #8d8a84, #e7e4dc 45%, #77746e)',
      boxShadow: '2px 2px 0 rgba(0,0,0,0.12)',
    }}
  />
);

const Eyebrow = ({ children, bg = yellow }: { children: ReactNode; bg?: string }) => (
  <span
    style={{
      display: 'inline-block',
      fontFamily: 'var(--osd-font-body)',
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: '0.16em',
      padding: '6px 14px',
      background: bg,
      mixBlendMode: 'multiply',
      color: 'var(--osd-text)',
    }}
  >
    {children}
  </span>
);

const Loaf = ({ w }: { w: number }) => {
  const id = usePid();
  const body =
    'M60 300 C60 160 180 82 300 82 C420 82 540 160 540 300 C540 342 492 360 300 360 C108 360 60 342 60 300 Z';
  return (
    <svg
      viewBox="0 0 600 420"
      width={w}
      height={w * 0.7}
      aria-hidden
      style={{ overflow: 'visible' }}
    >
      <defs>
        <pattern
          id={`${id}b`}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <circle cx="6" cy="6" r="2.8" fill={blue} />
        </pattern>
      </defs>
      <g style={{ mixBlendMode: 'multiply' }}>
        <path
          d="M30 352 H560 Q574 352 574 366 V380 Q574 394 560 394 H30 Q16 394 16 380 V366 Q16 352 30 352 Z"
          fill={teal}
        />
        <rect x="560" y="362" width="52" height="22" rx="11" fill={teal} />
        <path d={body} fill={pink} />
        <path
          d="M66 282 C150 336 450 336 534 282 C540 338 492 360 300 360 C108 360 58 338 66 282 Z"
          fill={`url(#${id}b)`}
        />
        <path
          d="M170 150 C230 190 250 250 240 320"
          stroke={yellow}
          strokeWidth={22}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M300 106 C330 170 335 250 310 335"
          stroke={yellow}
          strokeWidth={22}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M430 150 C390 200 380 260 385 320"
          stroke={yellow}
          strokeWidth={22}
          fill="none"
          strokeLinecap="round"
        />
      </g>
      <g
        transform="translate(10 -8)"
        fill="none"
        stroke={blue}
        strokeWidth={6}
        strokeLinecap="round"
        style={{ mixBlendMode: 'multiply' }}
      >
        <path d={body} />
        <path d="M170 150 C230 190 250 250 240 320" />
        <path d="M300 106 C330 170 335 250 310 335" />
        <path d="M430 150 C390 200 380 260 385 320" />
        <path
          d="M120 230 l6 4 M200 120 l5 -3 M470 220 l4 6 M360 130 l6 2 M150 290 l5 3 M450 290 l-4 4"
          strokeWidth={5}
        />
      </g>
      <g
        stroke={blue}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        style={{ mixBlendMode: 'multiply' }}
      >
        <path
          d="M250 40 c-14 -14 14 -24 0 -38"
          style={{ animation: 'crumb-steam 2.6s ease-out infinite' }}
        />
        <path
          d="M310 30 c-14 -14 14 -24 0 -38"
          style={{ animation: 'crumb-steam 2.6s ease-out 0.8s infinite' }}
        />
        <path
          d="M370 40 c-14 -14 14 -24 0 -38"
          style={{ animation: 'crumb-steam 2.6s ease-out 1.6s infinite' }}
        />
      </g>
    </svg>
  );
};

const Grain = ({ y, side }: { y: number; side: 1 | -1 }) => (
  <ellipse
    cx={40 + side * 13}
    cy={y}
    rx={9}
    ry={20}
    transform={`rotate(${side * 28} ${40 + side * 13} ${y})`}
  />
);

const Wheat = ({ h, color, style }: { h: number; color: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 80 400"
    width={h * 0.2}
    height={h}
    aria-hidden
    style={{ position: 'absolute', mixBlendMode: 'multiply', ...style }}
  >
    <path d="M40 400 C42 300 38 200 40 60" stroke={color} strokeWidth={5} fill="none" />
    <g fill={color}>
      <ellipse cx={40} cy={40} rx={8} ry={20} />
      <Grain y={78} side={-1} />
      <Grain y={78} side={1} />
      <Grain y={114} side={-1} />
      <Grain y={114} side={1} />
      <Grain y={150} side={-1} />
      <Grain y={150} side={1} />
      <Grain y={186} side={-1} />
      <Grain y={186} side={1} />
    </g>
    <path d="M40 22 L36 0 M44 30 L56 4 M34 32 L22 8" stroke={color} strokeWidth={2.5} />
  </svg>
);

const Oven = ({ w }: { w: number }) => (
  <svg
    viewBox="0 0 400 330"
    width={w}
    height={w * 0.825}
    aria-hidden
    style={{ overflow: 'visible' }}
  >
    <g style={{ mixBlendMode: 'multiply' }}>
      <rect x="168" y="0" width="54" height="70" fill={pink} />
      <path d="M30 290 V180 C30 80 112 30 200 30 C288 30 370 80 370 180 V290 Z" fill={teal} />
      <path
        d="M128 290 V206 C128 166 160 144 200 144 C240 144 272 166 272 206 V290 Z"
        fill={blue}
      />
      <path
        d="M160 290 C150 250 175 240 170 210 C195 230 190 250 205 230 C210 252 235 250 228 220 C252 248 250 272 240 290 Z"
        fill={yellow}
      />
      <path
        d="M178 290 C172 266 188 258 186 240 C200 254 200 266 210 254 C214 270 222 276 220 290 Z"
        fill={pink}
      />
      <rect x="10" y="290" width="380" height="30" fill={pink} />
    </g>
    <g
      transform="translate(-7 6)"
      fill="none"
      stroke={blue}
      strokeWidth={4}
      style={{ mixBlendMode: 'multiply' }}
    >
      <path d="M30 290 V180 C30 80 112 30 200 30 C288 30 370 80 370 180 V290" />
      <path d="M60 120 h50 M150 70 h60 M250 72 h50 M300 120 h48 M44 170 h44 M318 170 h44 M80 220 h30 M300 220 h40 M60 260 h40 M320 260 h30" />
      <path d="M128 290 V206 C128 166 160 144 200 144 C240 144 272 166 272 206 V290" />
    </g>
  </svg>
);

const Bubble = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <circle cx={x} cy={y} r={r} fill="none" stroke={blue} strokeWidth={3} />
);

const Jar = ({ level, w = 150, lid = pink }: { level: number; w?: number; lid?: string }) => {
  const top = 206 - level * 150;
  return (
    <svg viewBox="0 0 160 220" width={w} height={w * 1.375} aria-hidden>
      <g style={{ mixBlendMode: 'multiply' }}>
        <rect x={36} y={8} width={88} height={28} rx={4} fill={lid} />
        <path
          d={`M20 ${top} Q80 ${top - 14} 140 ${top} V196 Q140 206 130 206 H30 Q20 206 20 196 Z`}
          fill={yellow}
        />
        <rect x={16} y={top - 6} width={128} height={7} fill={pink} />
      </g>
      <g style={{ mixBlendMode: 'multiply' }} transform="translate(4 -3)">
        <path
          d="M30 44 H130 Q146 44 146 60 V196 Q146 212 130 212 H30 Q14 212 14 196 V60 Q14 44 30 44 Z"
          fill="none"
          stroke={blue}
          strokeWidth={5}
        />
        <Bubble x={50} y={top + 30} r={7} />
        <Bubble x={92} y={top + 52} r={10} />
        <Bubble x={118} y={top + 24} r={5} />
        <Bubble x={66} y={top + 78} r={5} />
      </g>
    </svg>
  );
};

const Face = ({ ink, hair, w = 150 }: { ink: string; hair: 0 | 1 | 2 | 3; w?: number }) => {
  const hairs = [
    'M22 52 C20 18 100 10 98 52 C88 34 40 30 22 52 Z',
    'M18 60 C10 10 110 10 102 60 C108 92 96 104 92 108 L90 50 C70 40 44 40 30 50 L28 108 C20 100 14 80 18 60 Z',
    'M30 36 C34 14 86 14 90 36 C80 26 40 26 30 36 Z M48 18 C52 2 70 2 72 18 Z',
    'M20 54 C24 20 96 20 100 54 L104 42 C96 8 24 8 16 42 Z',
  ];
  return (
    <svg viewBox="0 0 120 120" width={w} height={w} aria-hidden>
      <g style={{ mixBlendMode: 'multiply' }}>
        <circle cx={60} cy={62} r={40} fill={ink} />
        <path d={hairs[hair]} fill={blue} />
      </g>
      <g
        transform="translate(3 2)"
        stroke={blue}
        strokeWidth={3.5}
        fill="none"
        strokeLinecap="round"
        style={{ mixBlendMode: 'multiply' }}
      >
        <circle cx={60} cy={62} r={40} />
        <path d="M45 58 v6 M75 58 v6" strokeWidth={5} />
        <path d="M46 80 Q60 92 74 80" />
      </g>
    </svg>
  );
};

const Cover: Page = () => (
  <Sheet folio={false}>
    <Staple top={250} />
    <Staple top={760} />
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 1010,
        top: 130,
        width: 760,
        height: 760,
        borderRadius: '50%',
        mixBlendMode: 'multiply',
        ...dots(yellow, 16, 44),
      }}
    />
    <Wheat h={440} color={teal} style={{ left: 1650, top: 330, transform: 'rotate(18deg)' }} />
    <Wheat h={400} color={pink} style={{ left: 1590, top: 360, transform: 'rotate(5deg)' }} />
    <div style={{ position: 'absolute', left: 990, top: 360 }}>
      <Loaf w={760} />
    </div>
    <div style={{ position: 'absolute', left: 130, top: 120 }}>
      <Eyebrow>THE YEAR ONE REPORT · NO. 01</Eyebrow>
    </div>
    <Ink size={310} style={{ position: 'absolute', left: 122, top: 220 }}>
      Crumb
      <br />
      &amp; Co.
    </Ink>
    <p
      style={{
        position: 'absolute',
        left: 130,
        top: 820,
        margin: 0,
        fontSize: 32,
        lineHeight: 1.4,
        fontWeight: 700,
        maxWidth: 820,
      }}
    >
      A neighbourhood sourdough bakery counts its first 365 days.
    </p>
    <div
      style={{
        position: 'absolute',
        left: 130,
        bottom: 56,
        fontSize: 22,
        letterSpacing: '0.08em',
      }}
    >
      MAR 2025 – FEB 2026 · 14 PELHAM ROW · OPEN 7–3, SHUT TUESDAYS
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1620,
        top: 70,
        width: 230,
        height: 230,
        borderRadius: '50%',
        background: pink,
        mixBlendMode: 'multiply',
        color: blue,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        animation: 'crumb-wobble 4s ease-in-out infinite',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 56,
          lineHeight: 0.9,
          color: '#16245e',
        }}
      >
        FREE
      </div>
      <div style={{ fontFamily: hand, fontSize: 40, lineHeight: 1, color: '#16245e' }}>
        with any loaf
      </div>
    </div>
  </Sheet>
);

const Letter: Page = () => (
  <Sheet>
    <div
      style={{
        position: 'absolute',
        left: 130,
        top: 110,
        width: 940,
        height: 760,
        background: paper,
        transform: 'rotate(-1.4deg)',
        boxShadow: '6px 8px 0 rgba(29, 50, 133, 0.12)',
        padding: '64px 72px',
        boxSizing: 'border-box',
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent 0 47px, rgba(0,120,191,0.16) 47px 48px)',
        backgroundPosition: '0 36px',
      }}
    >
      <Tape style={{ left: 380, top: -22, transform: 'rotate(-3deg)' }} />
      <div style={{ fontFamily: hand, fontSize: 76, lineHeight: 1, color: pink }}>
        Dear neighbours,
      </div>
      <p style={{ fontSize: 30, lineHeight: 1.6, margin: '36px 0 0' }}>
        A year ago we opened with one oven, one jar of starter and a hand-painted sign with a typo
        in it. You came anyway. You queued in the rain, returned our jars, and told us when the rye
        was too sour (it was). This little zine is our thank-you: every number, every mistake, every
        bun.
      </p>
      <div style={{ fontFamily: hand, fontSize: 60, color: blue, marginTop: 40 }}>
        — Maeve &amp; the crew
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1180,
        top: 170,
        width: 580,
        background: paper,
        padding: '28px 28px 0',
        transform: 'rotate(3.5deg)',
        boxShadow: '8px 10px 0 rgba(29, 50, 133, 0.14)',
      }}
    >
      <Tape
        style={{
          left: 200,
          top: -24,
          transform: 'rotate(4deg)',
          background: 'rgba(255,72,176,0.55)',
        }}
      />
      <div
        style={{
          height: 470,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          ...dots('rgba(0,161,154,0.55)', 12, 42),
        }}
      >
        <Oven w={440} />
      </div>
      <div
        style={{
          fontFamily: hand,
          fontSize: 48,
          color: 'var(--osd-text)',
          padding: '18px 0 22px',
          textAlign: 'center',
        }}
      >
        Big Bertha, 4:12 am
      </div>
    </div>
    <svg
      viewBox="0 0 100 100"
      width={150}
      height={150}
      aria-hidden
      style={{
        position: 'absolute',
        left: 1100,
        top: 770,
        mixBlendMode: 'multiply',
        transform: 'rotate(-12deg)',
      }}
    >
      <path d="M50 4 L61 38 L96 38 L68 59 L79 94 L50 72 L21 94 L32 59 L4 38 L39 38 Z" fill={pink} />
      <path
        d="M50 4 L61 38 L96 38 L68 59 L79 94 L50 72 L21 94 L32 59 L4 38 L39 38 Z"
        fill="none"
        stroke={blue}
        strokeWidth={3}
        transform="translate(4 3)"
      />
    </svg>
  </Sheet>
);

const Sticker = ({
  n,
  label,
  bg,
  rot,
  ink = 'var(--osd-text)',
}: {
  n: string;
  label: string;
  bg: string;
  rot: number;
  ink?: string;
}) => (
  <div
    style={{
      width: 372,
      height: 230,
      padding: '28px 30px',
      boxSizing: 'border-box',
      background: bg,
      mixBlendMode: 'multiply',
      transform: `rotate(${rot}deg)`,
      clipPath:
        'polygon(0 2%, 4% 0, 30% 3%, 62% 0, 96% 2%, 100% 0, 99% 40%, 100% 97%, 70% 100%, 38% 97%, 3% 100%, 0 60%)',
      color: ink,
    }}
  >
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 96, lineHeight: 0.95 }}>{n}</div>
    <div style={{ fontSize: 24, lineHeight: 1.3, marginTop: 10, fontWeight: 700 }}>{label}</div>
  </div>
);

const Numbers: Page = () => (
  <Sheet>
    <div style={{ position: 'absolute', left: 130, top: 100 }}>
      <Eyebrow bg={pink}>BY THE NUMBERS</Eyebrow>
    </div>
    <Ink size={380} lh={0.9} dx={9} dy={7} style={{ position: 'absolute', left: 124, top: 170 }}>
      41,268
    </Ink>
    <div
      style={{
        position: 'absolute',
        left: 1230,
        top: 196,
        width: 560,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 120,
        lineHeight: 0.92,
        color: 'var(--osd-text)',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          background: yellow,
          mixBlendMode: 'multiply',
          padding: '0 12px',
          boxDecorationBreak: 'clone',
        }}
      >
        loaves
      </span>
      <br />
      <span style={{ fontSize: 76 }}>out of one oven</span>
      <div
        style={{
          fontFamily: hand,
          fontSize: 46,
          lineHeight: 1.1,
          color: pink,
          marginTop: 18,
          textTransform: 'none',
        }}
      >
        ≈ 113 a day, every day
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 130,
        right: 130,
        top: 610,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <Sticker n="3.2 t" label="of flour, all milled within 60 miles" bg={yellow} rot={-3} />
      <Sticker n="9,140" label="cardamom buns (Priya's fault)" bg="rgba(255,72,176,0.85)" rot={2} />
      <Sticker
        n="1"
        label="starter. Zero days off. Fed 730 times."
        bg="rgba(0,161,154,0.7)"
        rot={-1.5}
      />
      <Sticker n="612" label="croissants we don't talk about" bg="rgba(0,120,191,0.35)" rot={3} />
    </div>
  </Sheet>
);

const Ancestor = ({
  year,
  name,
  where,
  level,
  lid,
  big,
}: {
  year: string;
  name: string;
  where: string;
  level: number;
  lid: string;
  big?: boolean;
}) => (
  <div
    style={{
      width: 340,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}
  >
    <div style={{ height: 290, display: 'flex', alignItems: 'flex-end' }}>
      <Jar level={level} w={big ? 200 : 150} lid={lid} />
    </div>
    <div style={{ fontFamily: hand, fontSize: 40, color: pink, marginTop: 14, lineHeight: 1 }}>
      {year}
    </div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: big ? 76 : 56,
        lineHeight: 1,
        marginTop: 6,
        textTransform: 'uppercase',
      }}
    >
      {name}
    </div>
    <div style={{ fontSize: 24, lineHeight: 1.35, marginTop: 10 }}>{where}</div>
  </div>
);

const Lineage: Page = () => (
  <Sheet>
    <Ink size={150} style={{ position: 'absolute', left: 130, top: 100 }}>
      Meet Doris
    </Ink>
    <p
      style={{
        position: 'absolute',
        left: 820,
        top: 128,
        width: 900,
        margin: 0,
        fontSize: 30,
        lineHeight: 1.45,
        fontWeight: 700,
      }}
    >
      Our starter is older than most of our staff. Here's her family tree, as best we can trace it.
    </p>
    <svg
      viewBox="0 0 1660 120"
      width={1660}
      height={120}
      aria-hidden
      style={{ position: 'absolute', left: 130, top: 540, mixBlendMode: 'multiply' }}
    >
      <path
        d="M240 60 C310 20 360 100 420 60 C470 26 500 90 520 60 M690 60 C760 20 800 100 860 60 C900 36 930 80 950 60 M1170 60 C1230 24 1280 96 1360 56"
        fill="none"
        stroke={blue}
        strokeWidth={4}
        strokeDasharray="2 12"
        strokeLinecap="round"
      />
      <path
        d="M1350 40 L1370 56 L1350 72"
        fill="none"
        stroke={blue}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: 330,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Ancestor
        year="1989"
        name="Old Pat"
        where="A fishermen's bakery in Polperro, Cornwall"
        level={0.5}
        lid={teal}
      />
      <Ancestor
        year="2011"
        name="Pat Jr."
        where="Aunt Bríd's airing cupboard, Galway"
        level={0.6}
        lid={blue}
      />
      <Ancestor
        year="2025"
        name="Doris"
        where="Crumb & Co. — 14 kg of flour a day"
        level={0.8}
        lid={pink}
        big
      />
      <div style={{ width: 340, textAlign: 'center' }}>
        <div
          style={{
            height: 290,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Jar level={0.4} w={80} lid={teal} />
          <Jar level={0.6} w={96} lid={pink} />
          <Jar level={0.5} w={80} lid={blue} />
        </div>
        <div style={{ fontFamily: hand, fontSize: 40, color: pink, marginTop: 14, lineHeight: 1 }}>
          and counting
        </div>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 56,
            lineHeight: 1,
            marginTop: 6,
          }}
        >
          38 GRANDKIDS
        </div>
        <div style={{ fontSize: 24, lineHeight: 1.35, marginTop: 10 }}>
          Jars gifted to neighbours. Two have been to Japan.
        </div>
      </div>
    </div>
  </Sheet>
);

const Bar = ({ m, v, max, note }: { m: string; v: number; max: number; note?: boolean }) => {
  const h = Math.round((v / max) * 440);
  return (
    <div style={{ width: 106, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
        {v.toLocaleString('en-GB')}
      </div>
      <div style={{ position: 'relative', width: 96, height: h }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'multiply',
            ...(note ? { background: pink } : dots(pink, 11, 46)),
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'translate(6px, -5px)',
            border: `4px solid ${blue}`,
            mixBlendMode: 'multiply',
          }}
        />
      </div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 34,
          marginTop: 14,
          textTransform: 'uppercase',
        }}
      >
        {m}
      </div>
    </div>
  );
};

const Chart: Page = () => (
  <Sheet>
    <Ink size={124} style={{ position: 'absolute', left: 130, top: 96 }}>
      Loaves, month by month
    </Ink>
    <div
      style={{
        position: 'absolute',
        left: 150,
        right: 150,
        top: 300,
        height: 590,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderBottom: `5px solid ${blue}`,
        paddingBottom: 0,
      }}
    >
      <Bar m="Mar" v={1480} max={5630} />
      <Bar m="Apr" v={2310} max={5630} />
      <Bar m="May" v={2950} max={5630} />
      <Bar m="Jun" v={3120} max={5630} />
      <Bar m="Jul" v={2640} max={5630} note />
      <Bar m="Aug" v={3050} max={5630} />
      <Bar m="Sep" v={3580} max={5630} />
      <Bar m="Oct" v={3900} max={5630} />
      <Bar m="Nov" v={4210} max={5630} />
      <Bar m="Dec" v={5630} max={5630} note />
      <Bar m="Jan" v={3980} max={5630} />
      <Bar m="Feb" v={4418} max={5630} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 560,
        top: 380,
        fontFamily: hand,
        fontSize: 44,
        lineHeight: 1.05,
        color: pink,
        transform: 'rotate(-4deg)',
      }}
    >
      the heatwave.
      <br />
      nobody wants toast.
    </div>
    <svg
      viewBox="0 0 120 120"
      width={110}
      height={110}
      aria-hidden
      style={{ position: 'absolute', left: 640, top: 480 }}
    >
      <path
        d="M20 10 C30 60 50 80 90 100 M70 104 L92 101 L84 80"
        fill="none"
        stroke={pink}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 1080,
        top: 300,
        fontFamily: hand,
        fontSize: 44,
        lineHeight: 1.05,
        color: pink,
        transform: 'rotate(3deg)',
      }}
    >
      December: we slept
      <br />
      under the counter →
    </div>
  </Sheet>
);

const Ticket = ({
  rank,
  name,
  pct,
  bg,
  w,
}: {
  rank: string;
  name: string;
  pct: number;
  bg: string;
  w: number;
}) => (
  <div
    style={{
      width: w,
      height: 96,
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '0 30px',
      boxSizing: 'border-box',
      background: bg,
      mixBlendMode: 'multiply',
      clipPath:
        'polygon(0 0, 100% 0, 98.8% 12%, 100% 25%, 98.8% 37%, 100% 50%, 98.8% 62%, 100% 75%, 98.8% 87%, 100% 100%, 0 100%)',
    }}
  >
    <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 60, width: 44 }}>{rank}</span>
    <span style={{ fontSize: 32, fontWeight: 700, flex: 1, whiteSpace: 'nowrap' }}>{name}</span>
    <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 60, marginRight: 30 }}>
      {pct}%
    </span>
  </div>
);

const Menu: Page = () => (
  <Sheet>
    <Ink size={150} style={{ position: 'absolute', left: 130, top: 90 }}>
      What you ate
    </Ink>
    <div
      style={{
        position: 'absolute',
        left: 130,
        top: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      <Ticket rank="1" name="Country white" pct={31} bg={yellow} w={1220} />
      <Ticket rank="2" name="Seeded rye" pct={18} bg="rgba(255,72,176,0.75)" w={940} />
      <Ticket rank="3" name="Cardamom bun" pct={16} bg="rgba(0,161,154,0.55)" w={880} />
      <Ticket rank="4" name="Fig & fennel" pct={9} bg="rgba(0,120,191,0.3)" w={720} />
      <Ticket rank="5" name="Sunday focaccia" pct={8} bg="rgba(255,225,77,0.7)" w={700} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1420,
        top: 360,
        width: 380,
        padding: '36px 34px',
        boxSizing: 'border-box',
        background: paper,
        transform: 'rotate(4deg)',
        boxShadow: '8px 10px 0 rgba(29, 50, 133, 0.14)',
      }}
    >
      <Tape
        style={{
          left: 104,
          top: -22,
          transform: 'rotate(-5deg)',
          background: 'rgba(0,161,154,0.45)',
        }}
      />
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 72,
          lineHeight: 0.95,
          color: pink,
        }}
      >
        R.I.P.
      </div>
      <div style={{ fontSize: 26, lineHeight: 1.4, marginTop: 14, fontWeight: 700 }}>
        The spelt experiment
      </div>
      <div style={{ fontSize: 24, lineHeight: 1.4, marginTop: 6 }}>
        April – May 2025. 41 loaves sold.
      </div>
      <div style={{ fontFamily: hand, fontSize: 42, lineHeight: 1.05, color: blue, marginTop: 18 }}>
        We miss it. You don't.
      </div>
    </div>
  </Sheet>
);

const Crew = ({
  name,
  job,
  fact,
  ink,
  hair,
  bg,
  rot,
}: {
  name: string;
  job: string;
  fact: string;
  ink: string;
  hair: 0 | 1 | 2 | 3;
  bg: string;
  rot: number;
}) => (
  <div
    style={{
      display: 'flex',
      gap: 22,
      alignItems: 'center',
      padding: '24px 28px',
      background: bg,
      transform: `rotate(${rot}deg)`,
      boxShadow: '6px 8px 0 rgba(29, 50, 133, 0.12)',
      height: 236,
      boxSizing: 'border-box',
    }}
  >
    <Face ink={ink} hair={hair} w={150} />
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 50,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.12em',
          marginTop: 8,
          color: pink,
        }}
      >
        {job}
      </div>
      <div style={{ fontSize: 23, lineHeight: 1.32, marginTop: 10 }}>{fact}</div>
    </div>
  </div>
);

const Team: Page = () => (
  <Sheet>
    <Ink size={150} style={{ position: 'absolute', left: 130, top: 90 }}>
      The crew
    </Ink>
    <div
      style={{
        position: 'absolute',
        left: 720,
        top: 118,
        fontFamily: hand,
        fontSize: 52,
        color: pink,
        transform: 'rotate(-3deg)',
      }}
    >
      six people, two bikes, one very warm room
    </div>
    <div
      style={{
        position: 'absolute',
        left: 130,
        right: 130,
        top: 300,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        columnGap: 40,
        rowGap: 44,
      }}
    >
      <Crew
        name="Maeve"
        job="FOUNDER · HEAD BAKER"
        fact="Named all 64 bannetons. Every single one."
        ink={pink}
        hair={1}
        bg={paper}
        rot={-1.5}
      />
      <Crew
        name="Tomás"
        job="NIGHT BAKER"
        fact="Lights the oven at 2:30. Opera, loudly."
        ink={yellow}
        hair={0}
        bg="#fdf3c4"
        rot={1}
      />
      <Crew
        name="Priya"
        job="PASTRY"
        fact="Architect of the cardamom bun. Do not ask for the recipe."
        ink={teal}
        hair={3}
        bg={paper}
        rot={-0.5}
      />
      <Crew
        name="June"
        job="COUNTER · AGE 71"
        fact="Knows 400 regulars' orders by heart."
        ink={pink}
        hair={2}
        bg="#fbe1ee"
        rot={1.5}
      />
      <Crew
        name="Kofi"
        job="DELIVERIES"
        fact="1,900 km on the cargo bike. One puncture."
        ink={yellow}
        hair={0}
        bg={paper}
        rot={-1}
      />
      <Crew
        name="Lena"
        job="APPRENTICE"
        fact="Joined from the Saturday class. Now shapes the rye."
        ink={teal}
        hair={1}
        bg="#dff1ee"
        rot={0.8}
      />
    </div>
  </Sheet>
);

const Note = ({
  quote,
  who,
  bg,
  rot,
  style,
}: {
  quote: string;
  who: string;
  bg: string;
  rot: number;
  style: CSSProperties;
}) => (
  <div
    style={{
      position: 'absolute',
      width: 640,
      padding: '34px 40px',
      boxSizing: 'border-box',
      background: bg,
      transform: `rotate(${rot}deg)`,
      boxShadow: '8px 10px 0 rgba(29, 50, 133, 0.12)',
      ...style,
    }}
  >
    <div style={{ fontSize: 28, lineHeight: 1.45, fontWeight: 700 }}>“{quote}”</div>
    <div style={{ fontFamily: hand, fontSize: 38, color: pink, marginTop: 12 }}>— {who}</div>
  </div>
);

const Community: Page = () => (
  <Sheet>
    <div style={{ position: 'absolute', left: 130, top: 110 }}>
      <Eyebrow bg="rgba(0,161,154,0.5)">THE PAY-IT-FORWARD SHELF</Eyebrow>
    </div>
    <Ink
      size={330}
      lh={0.9}
      dx={18}
      dy={14}
      front={pink}
      back={blue}
      backDots
      style={{ position: 'absolute', left: 124, top: 190 }}
    >
      2,140
    </Ink>
    <p
      style={{
        position: 'absolute',
        left: 130,
        top: 520,
        width: 760,
        margin: 0,
        fontSize: 34,
        lineHeight: 1.45,
        fontWeight: 700,
      }}
    >
      loaves paid for by one neighbour and picked up by another. No questions, no forms.
    </p>
    <div
      style={{
        position: 'absolute',
        left: 130,
        top: 700,
        width: 760,
        fontSize: 26,
        lineHeight: 1.45,
      }}
    >
      Whatever's left at 3 pm goes to the Pelham Road shelter. Kofi delivers it on the way home.
    </div>
    <Note
      quote="My daughter calls June 'Auntie'. June is not related to us."
      who="Ruth, Pelham Row"
      bg={paper}
      rot={-3}
      style={{ left: 1080, top: 110 }}
    />
    <Note
      quote="Came for bread, joined the shaping class, now I have a starter called Kevin."
      who="Dev, flat 4B"
      bg="#fdf3c4"
      rot={2.5}
      style={{ left: 1150, top: 410 }}
    />
    <Note
      quote="You fixed my bike chain with a dough scraper. Never forget."
      who="Ana, two doors down"
      bg="#fbe1ee"
      rot={-1.5}
      style={{ left: 1060, top: 690 }}
    />
  </Sheet>
);

const Stop = ({ t, body, ink }: { t: string; body: string; ink: string }) => (
  <div style={{ width: 212 }}>
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: ink,
        mixBlendMode: 'multiply',
        marginBottom: 22,
      }}
    />
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 56, lineHeight: 1 }}>{t}</div>
    <div style={{ fontSize: 22, lineHeight: 1.36, marginTop: 10 }}>{body}</div>
  </div>
);

const Day: Page = () => (
  <Sheet>
    <Ink size={150} style={{ position: 'absolute', left: 130, top: 90 }}>
      A day at Crumb
    </Ink>
    <p
      style={{
        position: 'absolute',
        left: 130,
        top: 270,
        width: 900,
        margin: 0,
        fontSize: 30,
        lineHeight: 1.45,
        fontWeight: 700,
      }}
    >
      Sixteen and a half hours, one oven, and the same order every single day.
    </p>
    <div style={{ position: 'absolute', right: 150, top: 80 }}>
      <Oven w={400} />
    </div>
    <svg
      viewBox="0 0 1680 40"
      width={1680}
      height={40}
      aria-hidden
      style={{ position: 'absolute', left: 120, top: 577 }}
    >
      <path
        d="M0 20 C80 6 160 34 240 20 C320 6 400 34 480 20 C560 6 640 34 720 20 C800 6 880 34 960 20 C1040 6 1120 34 1200 20 C1280 6 1360 34 1440 20 C1520 6 1600 34 1680 20"
        fill="none"
        stroke={blue}
        strokeWidth={5}
      />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 130,
        right: 110,
        top: 580,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Stop t="02:30" body="Tomás lights Bertha." ink={pink} />
      <Stop t="04:00" body="First bake: 160 country whites." ink={yellow} />
      <Stop t="07:00" body="Doors open. Queue of 43." ink={teal} />
      <Stop t="11:20" body="Cardamom buns sold out. Again." ink={pink} />
      <Stop t="14:00" body="Feed Doris, mix the levain." ink={yellow} />
      <Stop t="16:30" body="Shape, basket, cold room." ink={teal} />
      <Stop t="19:00" body="Lights off, oven still warm." ink={pink} />
    </div>
  </Sheet>
);

const Plan = ({ text, done }: { text: string; done?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
    <svg viewBox="0 0 60 60" width={54} height={54} aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M8 10 L52 7 L54 52 L6 54 Z"
        fill="none"
        stroke={blue}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {done && (
        <path
          d="M14 30 L26 44 L56 4"
          fill="none"
          stroke={pink}
          strokeWidth={7}
          strokeLinecap="round"
        />
      )}
    </svg>
    <span style={{ fontSize: 32, fontWeight: 700 }}>{text}</span>
  </div>
);

const YearTwo: Page = () => (
  <Sheet>
    <Ink size={260} style={{ position: 'absolute', left: 124, top: 96 }}>
      Year two
    </Ink>
    <div
      style={{
        position: 'absolute',
        left: 130,
        top: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
      }}
    >
      <Plan text="A second oven. Bertha needs a friend." done />
      <Plan text="Rye Club: one loaf a week, on subscription." />
      <Plan text="Kids' shaping school, Saturday mornings." />
      <Plan text="Open at 6:30 for the early shift." />
      <Plan text="Finally fix the typo on the sign." />
    </div>
    <Wheat h={520} color={teal} style={{ left: 1220, top: 330, transform: 'rotate(-14deg)' }} />
    <div
      style={{
        position: 'absolute',
        left: 1360,
        top: 280,
        width: 440,
        height: 440,
        borderRadius: '50%',
        border: `6px solid ${pink}`,
        mixBlendMode: 'multiply',
        transform: 'rotate(-10deg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: `inset 0 0 0 14px var(--osd-bg), inset 0 0 0 18px ${pink}`,
        color: pink,
      }}
    >
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 60, lineHeight: 0.95 }}>
        SEE YOU AT
        <br />
        THE COUNTER
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.1em',
          marginTop: 18,
          color: blue,
        }}
      >
        14 PELHAM ROW
      </div>
      <div style={{ fontFamily: hand, fontSize: 38, marginTop: 4, color: blue }}>
        from 7 am, not Tuesdays
      </div>
    </div>
  </Sheet>
);

export const meta: SlideMeta = {
  title: 'Crumb & Co. — Year One',
  createdAt: '2026-10-07T15:48:55.370Z',
};

export const notes: (string | undefined)[] = [
  `Hello everyone, and thank you for squeezing into the back room.
This is our first annual report — which is a very grand name for a stapled zine.
Grab one on the way out; it's free with any loaf.`,
  `I want to start with the letter on the left, because it's the honest version.
We opened with one oven and a sign with a typo. You came anyway.
That's Big Bertha on the right, at twelve minutes past four, which is when she looks her best.`,
  `Forty-one thousand, two hundred and sixty-eight loaves. About a hundred and thirteen a day.
Three point two tonnes of flour, all of it milled within sixty miles.
Nine thousand cardamom buns — blame Priya. And six hundred and twelve croissants we will not be discussing.`,
  `This is Doris. She's our starter, and she has a pedigree.
Old Pat started in a fishermen's bakery in Cornwall in 1989. A bit of him went to Galway, into my aunt's airing cupboard.
Doris came out of that jar. And she's already a grandmother — thirty-eight jars gifted to you lot, two of them now in Japan.`,
  `Month by month. We opened in March at about fifteen hundred loaves.
July dipped — the heatwave — nobody wants toast when it's thirty-one degrees.
December is the tall pink one: five thousand six hundred. We genuinely slept under the counter twice.`,
  `What you actually ate. Country white is nearly a third of everything — you're creatures of habit, and we love you for it.
Seeded rye, cardamom bun, fig and fennel, Sunday focaccia.
And a moment of silence for the spelt experiment. Forty-one loaves. We miss it. You don't.`,
  `The crew. Maeve, who named all sixty-four bannetons. Tomás, who starts the oven at half two to opera.
Priya on pastry. June on the counter — seventy-one, knows four hundred orders by heart.
Kofi on the cargo bike, and Lena, who walked in for a Saturday class and never left.`,
  `The number I'm proudest of: two thousand one hundred and forty.
That's how many loaves one neighbour paid for so another could pick one up — no questions.
And these notes came in through the letterbox. Kevin the starter is apparently thriving.`,
  `A day at Crumb, start to finish. Two-thirty, Tomás lights Bertha.
Doors at seven — our record queue was forty-three people, in sleet.
Buns gone by twenty past eleven, Doris gets fed at two, and the lights go off at seven. Bertha stays warm overnight.`,
  `Year two. The second oven is already ticked — it arrives in April.
Rye Club, a kids' shaping school, opening at half six for the early shift.
And yes, we will finally fix the typo on the sign. See you at the counter.`,
];

export default [
  Cover,
  Letter,
  Numbers,
  Lineage,
  Chart,
  Menu,
  Team,
  Community,
  Day,
  YearTwo,
] satisfies Page[];

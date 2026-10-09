import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#fff4e0', text: '#111111', accent: '#2346d8' },
  fonts: {
    display: '"Unbounded", "Arial Black", system-ui, sans-serif',
    body: '"Rubik", "Avenir Next", system-ui, sans-serif',
  },
  typeScale: { hero: 140, body: 32 },
  radius: 28,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Rubik:wght@500;700&family=Unbounded:wght@700;900&display=swap';
const FONT_LINK_ID = 'osd-webfont-memphis-volcano-lab';
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

const STYLE_ID = 'osd-styles-memphis-volcano-lab';
const css = `
.mv-bob { animation: mv-bob 3.2s ease-in-out infinite; }
.mv-spin { animation: mv-spin 16s linear infinite; }
.mv-wiggle { animation: mv-wiggle 1.8s ease-in-out infinite; }
.mv-erupt { animation: mv-erupt 2.4s cubic-bezier(.2,.7,.3,1) infinite; }
.mv-jelly { animation: mv-jelly 2.4s ease-in-out infinite; transform-origin: 50% 100%; }
.mv-march { animation: mv-march 1.4s linear infinite; }
.mv-float { animation: mv-float 4.6s ease-in-out infinite; }
@keyframes mv-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-18px) } }
@keyframes mv-float { 0%,100% { transform: translate(0,0) rotate(0deg) } 50% { transform: translate(8px,-14px) rotate(8deg) } }
@keyframes mv-spin { to { transform: rotate(360deg) } }
@keyframes mv-wiggle { 0%,100% { transform: rotate(-7deg) } 50% { transform: rotate(7deg) } }
@keyframes mv-erupt {
  0% { transform: translate(0,0) scale(.35); opacity: 0 }
  12% { opacity: 1 }
  100% { transform: translate(var(--dx, 0px), var(--dy, -240px)) scale(1); opacity: 0 }
}
@keyframes mv-jelly { 0%,100% { transform: scale(1,1) } 30% { transform: scale(1.05,.94) } 60% { transform: scale(.97,1.04) } }
@keyframes mv-march { to { stroke-dashoffset: -64 } }
@media (prefers-reduced-motion: reduce) {
  .mv-bob, .mv-spin, .mv-wiggle, .mv-erupt, .mv-jelly, .mv-march, .mv-float { animation: none }
}
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

const ink = '#111111';
const cream = '#fff4e0';
const mint = '#7fe0c4';
const salmon = '#ff8a70';
const lemon = '#ffe14d';
const pink = '#ffb3d1';
const lilac = '#b9a6ff';
const lava = '#ff5a36';
const cobalt = 'var(--osd-accent)';
const display = 'var(--osd-font-display)';
const body = 'var(--osd-font-body)';

const DOTS = 'radial-gradient(#111 3px, transparent 3.6px)';
const GRID =
  'linear-gradient(rgba(17,17,17,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(17,17,17,0.08) 2px, transparent 2px)';
const STRIPES = 'repeating-linear-gradient(-45deg, #111 0 7px, transparent 7px 24px)';
const TERRAZZO = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><polygon points='20,30 44,22 40,48' fill='%23ff8a70'/><polygon points='120,18 150,30 128,44' fill='%232346d8'/><polygon points='210,40 236,52 214,70' fill='%23111'/><polygon points='60,110 88,100 80,128' fill='%237fe0c4'/><polygon points='160,120 186,108 190,138' fill='%23ffe14d'/><polygon points='230,170 252,196 224,198' fill='%23ff8a70'/><polygon points='30,190 58,182 50,212' fill='%23b9a6ff'/><polygon points='120,210 146,198 140,230' fill='%23111'/><circle cx='96' cy='64' r='6' fill='%23111'/><circle cx='200' cy='90' r='5' fill='%23ff8a70'/><circle cx='30' cy='140' r='5' fill='%232346d8'/><circle cx='180' cy='230' r='7' fill='%237fe0c4'/><circle cx='240' cy='120' r='4' fill='%23111'/><circle cx='80' cy='240' r='4' fill='%23ffe14d'/></svg>")`;

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: body,
};

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'scale(0.97)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
};

const Deco = ({
  x,
  y,
  rotate = 0,
  anim,
  delay = 0,
  dur,
  children,
}: {
  x: number;
  y: number;
  rotate?: number;
  anim?: string;
  delay?: number;
  dur?: number;
  children: ReactNode;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `rotate(${rotate}deg)`,
      pointerEvents: 'none',
    }}
  >
    <div
      className={anim}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: dur ? `${dur}s` : undefined,
      }}
    >
      {children}
    </div>
  </div>
);

const Tri = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
    <polygon
      points="50,8 94,90 6,90"
      fill={color}
      stroke={ink}
      strokeWidth="8"
      strokeLinejoin="round"
    />
  </svg>
);

const Dot = ({ size, color }: { size: number; color: string }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      border: `6px solid ${ink}`,
      boxSizing: 'border-box',
    }}
  />
);

const Ring = ({ size, color }: { size: number; color: string }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: `${Math.round(size / 6)}px solid ${color}`,
      outline: `5px solid ${ink}`,
      outlineOffset: -2,
      boxSizing: 'border-box',
    }}
  />
);

const Squiggle = ({
  width,
  color,
  stroke = 12,
  march,
}: {
  width: number;
  color: string;
  stroke?: number;
  march?: boolean;
}) => (
  <svg width={width} height={width * 0.3} viewBox="0 0 200 60" style={{ display: 'block' }}>
    <path
      d="M8 30 Q 29 4 50 30 T 92 30 T 134 30 T 176 30 T 196 30"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={march ? '40 24' : undefined}
      className={march ? 'mv-march' : undefined}
    />
  </svg>
);

const Zig = ({ width, color, stroke = 12 }: { width: number; color: string; stroke?: number }) => (
  <svg width={width} height={width * 0.2} viewBox="0 0 200 40" style={{ display: 'block' }}>
    <polyline
      points="6,32 26,8 46,32 66,8 86,32 106,8 126,32 146,8 166,32 186,8 196,20"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ZIG_BORDER_POINTS = Array.from(
  { length: 50 },
  (_, i) => `${i * 40},${i % 2 === 0 ? 48 : 8}`,
).join(' ');

const ZigBorder = ({ y, color }: { y: number; color: string }) => (
  <svg
    width={1960}
    height={56}
    viewBox="0 0 1960 56"
    style={{ position: 'absolute', left: -20, top: y, display: 'block' }}
  >
    <polyline
      points={ZIG_BORDER_POINTS}
      fill="none"
      stroke={color}
      strokeWidth="12"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Plus = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: 'block' }}>
    <path
      d="M24 4 H36 V24 H56 V36 H36 V56 H24 V36 H4 V24 H24Z"
      fill={color}
      stroke={ink}
      strokeWidth="5"
      strokeLinejoin="round"
    />
  </svg>
);

const HalfDisc = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size / 2} viewBox="0 0 100 50" style={{ display: 'block' }}>
    <path d="M4 48 A 46 46 0 0 1 96 48 Z" fill={color} stroke={ink} strokeWidth="6" />
  </svg>
);

const starPoints = (spikes: number, outer: number, inner: number, c: number) => {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};
const STAR_18 = starPoints(18, 190, 160, 200);
const STAR_12 = starPoints(12, 96, 74, 100);

const Pill = ({
  children,
  bg,
  color = ink,
  size = 24,
  style,
}: {
  children: ReactNode;
  bg: string;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 26px',
      borderRadius: 999,
      background: bg,
      color,
      border: `5px solid ${ink}`,
      boxShadow: `6px 6px 0 ${ink}`,
      fontFamily: display,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

const Title = ({
  children,
  size = 84,
  color = ink,
  shadow = salmon,
  style,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  shadow?: string;
  style?: CSSProperties;
}) => (
  <h2
    style={{
      margin: 0,
      fontFamily: display,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1.02,
      letterSpacing: '-0.01em',
      color,
      textShadow: `6px 6px 0 ${shadow}`,
      ...style,
    }}
  >
    {children}
  </h2>
);

const Card = ({
  children,
  bg,
  tilt = 0,
  style,
}: {
  children: ReactNode;
  bg: string;
  tilt?: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      position: 'relative',
      background: bg,
      border: `6px solid ${ink}`,
      borderRadius: 'var(--osd-radius)',
      boxShadow: `14px 14px 0 ${ink}`,
      transform: `rotate(${tilt}deg)`,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

const Cover: Page = () => (
  <div style={fill}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: GRID,
        backgroundSize: '56px 56px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 1024,
        top: 150,
        width: 820,
        height: 820,
        borderRadius: '50%',
        background: cobalt,
        border: `8px solid ${ink}`,
        boxSizing: 'border-box',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 1084,
        top: 210,
        width: 700,
        height: 700,
        borderRadius: '50%',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 4px, transparent 4.6px)',
        backgroundSize: '34px 34px',
      }}
    />
    <Deco x={1210} y={170} anim="mv-bob" delay={0.2}>
      <svg width={460} height={260} viewBox="0 0 460 260" style={{ display: 'block' }}>
        <circle cx="100" cy="170" r="66" fill={pink} stroke={ink} strokeWidth="8" />
        <circle cx="350" cy="176" r="62" fill={pink} stroke={ink} strokeWidth="8" />
        <circle cx="300" cy="110" r="76" fill={lilac} stroke={ink} strokeWidth="8" />
        <circle cx="180" cy="104" r="84" fill={pink} stroke={ink} strokeWidth="8" />
        <circle cx="236" cy="188" r="60" fill={lilac} stroke={ink} strokeWidth="8" />
        <circle cx="180" cy="80" r="10" fill={ink} />
        <circle cx="310" cy="96" r="8" fill={ink} />
        <circle cx="236" cy="190" r="7" fill={ink} />
      </svg>
    </Deco>
    <svg
      width={820}
      height={660}
      viewBox="0 0 820 660"
      style={{ position: 'absolute', left: 1024, top: 400 }}
    >
      <defs>
        <clipPath id="mv-cover-cone">
          <path d="M 110 640 L 330 180 Q 410 214 490 180 L 710 640 Z" />
        </clipPath>
      </defs>
      <path
        d="M 30 640 Q 50 560 220 572 Q 410 596 600 562 Q 790 540 800 640 Z"
        fill={mint}
        stroke={ink}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M 110 640 L 330 180 Q 410 214 490 180 L 710 640 Z" fill={salmon} />
      <g clipPath="url(#mv-cover-cone)">
        <rect x="0" y="300" width="820" height="40" fill="#ff9f86" />
        <rect x="0" y="420" width="820" height="40" fill="#ff9f86" />
        <rect x="0" y="540" width="820" height="40" fill="#ff9f86" />
        <path
          d="M 350 186 L 330 260 L 360 300 L 320 380 L 350 430 L 300 520 L 330 640 L 380 640 L 360 520 L 400 430 L 372 380 L 410 300 L 384 260 L 400 196 Z"
          fill={lava}
          stroke={ink}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M 450 190 L 470 250 L 450 300 L 490 360 L 470 420 L 520 500 L 500 640 L 550 640 L 560 500 L 520 420 L 540 360 L 500 300 L 520 250 L 490 186 Z"
          fill={lemon}
          stroke={ink}
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M 110 640 L 330 180 Q 410 214 490 180 L 710 640"
        fill="none"
        stroke={ink}
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <ellipse cx="410" cy="190" rx="80" ry="18" fill={lava} stroke={ink} strokeWidth="8" />
    </svg>
    <div style={{ position: 'absolute', left: 1424, top: 560 }}>
      <Deco x={-20} y={0} anim="mv-erupt" delay={0}>
        <Dot size={62} color={lemon} />
      </Deco>
      <div style={{ '--dx': '-120px', '--dy': '-260px' } as CSSProperties}>
        <Deco x={-10} y={0} anim="mv-erupt" delay={0.5}>
          <Dot size={52} color={lava} />
        </Deco>
      </div>
      <div style={{ '--dx': '110px', '--dy': '-230px' } as CSSProperties}>
        <Deco x={-10} y={0} anim="mv-erupt" delay={0.9}>
          <Dot size={56} color={lemon} />
        </Deco>
      </div>
      <div style={{ '--dx': '-60px', '--dy': '-300px' } as CSSProperties}>
        <Deco x={0} y={0} anim="mv-erupt" delay={1.4}>
          <Dot size={42} color={salmon} />
        </Deco>
      </div>
      <div style={{ '--dx': '170px', '--dy': '-170px' } as CSSProperties}>
        <Deco x={0} y={0} anim="mv-erupt" delay={1.8}>
          <Dot size={46} color={lava} />
        </Deco>
      </div>
    </div>
    <Deco x={120} y={150} rotate={-4}>
      <Pill bg={lemon}>Saturday Science Club · Ages 7–11</Pill>
    </Deco>
    <div
      style={{ position: 'absolute', left: 116, top: 262, fontFamily: display, fontWeight: 900 }}
    >
      <div
        style={{
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          textShadow: `10px 10px 0 ${salmon}`,
        }}
      >
        VOLCANO
      </div>
      <div
        style={{
          fontSize: 230,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: lemon,
          WebkitTextStroke: `8px ${ink}`,
          paintOrder: 'stroke fill',
          textShadow: `12px 12px 0 ${ink}`,
        }}
      >
        LAB!
      </div>
    </div>
    <p
      style={{
        position: 'absolute',
        left: 120,
        top: 690,
        width: 860,
        margin: 0,
        fontSize: 36,
        fontWeight: 500,
        lineHeight: 1.4,
      }}
    >
      How the Earth blows its top — and how to make it happen on a kitchen table.
    </p>
    <div style={{ position: 'absolute', left: 120, top: 852, display: 'flex', gap: 28 }}>
      <Pill bg={mint} size={22}>
        Gallery 3
      </Pill>
      <Pill bg={pink} size={22}>
        10:30 – 12:00
      </Pill>
      <Pill bg="#ffffff" size={22}>
        Wear old clothes!
      </Pill>
    </div>
    <Deco x={760} y={180} anim="mv-bob" delay={0.4}>
      <Tri size={70} color={mint} />
    </Deco>
    <Deco x={900} y={590} rotate={20} anim="mv-float" delay={1}>
      <Squiggle width={150} color={cobalt} stroke={14} />
    </Deco>
    <Deco x={60} y={40} anim="mv-spin">
      <Plus size={56} color={salmon} />
    </Deco>
    <Deco x={1830} y={60} anim="mv-bob" delay={0.8}>
      <Dot size={44} color={lemon} />
    </Deco>
    <Deco x={660} y={980} rotate={-4}>
      <Zig width={220} color={ink} />
    </Deco>
  </div>
);

const PlanCard = ({
  n,
  title,
  text,
  bg,
  tilt,
  light,
}: {
  n: string;
  title: string;
  text: string;
  bg: string;
  tilt: number;
  light?: boolean;
}) => (
  <Card bg={bg} tilt={tilt} style={{ width: 520, height: 240, padding: '30px 36px' }}>
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: '50%',
        background: '#ffffff',
        border: `5px solid ${ink}`,
        display: 'grid',
        placeItems: 'center',
        fontFamily: display,
        fontWeight: 900,
        fontSize: 34,
        color: ink,
        boxSizing: 'border-box',
      }}
    >
      {n}
    </div>
    <div
      style={{
        marginTop: 22,
        fontFamily: display,
        fontWeight: 700,
        fontSize: 32,
        lineHeight: 1.1,
        color: light ? '#ffffff' : ink,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 10,
        fontSize: 26,
        fontWeight: 500,
        color: light ? '#ffffff' : ink,
      }}
    >
      {text}
    </div>
  </Card>
);

const Plan: Page = () => (
  <div style={{ ...fill }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: DOTS,
        backgroundSize: '44px 44px',
        opacity: 0.12,
      }}
    />
    <div style={{ position: 'absolute', left: 120, top: 100 }}>
      <Title size={96}>TODAY’S PLAN</Title>
      <div style={{ marginTop: 6, marginLeft: 6 }}>
        <Squiggle width={320} color={cobalt} stroke={14} march />
      </div>
    </div>
    <Deco x={1440} y={96} rotate={6}>
      <Pill bg={pink} size={24}>
        90 minutes · 6 stops
      </Pill>
    </Deco>
    <div
      style={{
        position: 'absolute',
        left: 130,
        top: 340,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 520px)',
        columnGap: 50,
        rowGap: 64,
      }}
    >
      <PlanCard
        n="1"
        title="CRACKED EARTH"
        text="Why the ground moves under us"
        bg={mint}
        tilt={-2.5}
      />
      <PlanCard
        n="2"
        title="INSIDE A VOLCANO"
        text="Magma, vents, craters & ash"
        bg={salmon}
        tilt={1.5}
      />
      <PlanCard
        n="3"
        title="KABOOM TYPES"
        text="From gentle oozers to giant blasts"
        bg={lemon}
        tilt={-1}
      />
      <PlanCard
        n="4"
        title="HALL OF FAME"
        text="The planet’s most famous peaks"
        bg={pink}
        tilt={2}
      />
      <PlanCard
        n="5"
        title="MAKE ONE!"
        text="Your own kitchen-table eruption"
        bg={cobalt}
        tilt={-2}
        light
      />
      <PlanCard n="6" title="QUIZ TIME" text="Three questions, one sticker" bg={lilac} tilt={1.5} />
    </div>
    <Deco x={1780} y={300} anim="mv-bob">
      <Tri size={64} color={lemon} />
    </Deco>
    <Deco x={40} y={560} anim="mv-float" delay={0.6}>
      <Dot size={40} color={salmon} />
    </Deco>
    <Deco x={1700} y={940} anim="mv-spin">
      <Plus size={50} color={mint} />
    </Deco>
  </div>
);

const BoundaryCard = ({
  name,
  text,
  where,
  bg,
  tilt,
  children,
}: {
  name: string;
  text: string;
  where: string;
  bg: string;
  tilt: number;
  children: ReactNode;
}) => (
  <Card
    bg={bg}
    tilt={tilt}
    style={{
      width: 880,
      height: 190,
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      padding: '0 32px',
    }}
  >
    <div
      style={{
        width: 230,
        height: 140,
        background: '#ffffff',
        border: `5px solid ${ink}`,
        borderRadius: 18,
        flexShrink: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ fontFamily: display, fontWeight: 900, fontSize: 34 }}>{name}</span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            padding: '4px 14px',
            borderRadius: 999,
            border: `4px solid ${ink}`,
            background: '#ffffff',
          }}
        >
          {where}
        </span>
      </div>
      <div style={{ marginTop: 12, fontSize: 28, fontWeight: 500, lineHeight: 1.3 }}>{text}</div>
    </div>
  </Card>
);

const Arrow = ({ x, y, dir, color }: { x: number; y: number; dir: 1 | -1; color: string }) => (
  <path
    d={`M ${x} ${y} h ${dir * 36} m ${dir * -14} -14 l ${dir * 14} 14 l ${dir * -14} 14`}
    fill="none"
    stroke={color}
    strokeWidth="7"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const LayerTag = ({ x, y, label, bg }: { x: number; y: number; label: string; bg: string }) => (
  <g>
    <rect
      x={x - label.length * 7.4 - 16}
      y={y - 20}
      width={label.length * 14.8 + 32}
      height={40}
      rx={20}
      fill={bg}
      stroke={ink}
      strokeWidth="4"
    />
    <text
      x={x}
      y={y + 8}
      textAnchor="middle"
      style={{
        fontFamily: body,
        fontWeight: 700,
        fontSize: 22,
        fill: ink,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </text>
  </g>
);

const Tectonics: Page = () => (
  <div style={fill}>
    <div style={{ position: 'absolute', left: 120, top: 100 }}>
      <Title size={76}>EARTH IS A CRACKED EGG</Title>
      <div style={{ marginTop: 18, fontSize: 32, fontWeight: 500 }}>
        Its shell is broken into giant pieces called <b>plates</b>. Where they meet, magma escapes.
      </div>
    </div>
    <svg
      width={700}
      height={640}
      viewBox="0 0 700 640"
      style={{ position: 'absolute', left: 90, top: 330 }}
    >
      <defs>
        <clipPath id="mv-earth-surface">
          <path d="M 320 330 L 610 330 A 290 290 0 1 1 320 40 Z" />
        </clipPath>
      </defs>
      <circle cx="320" cy="330" r="290" fill={cobalt} />
      <g clipPath="url(#mv-earth-surface)">
        <path
          d="M 60 230 Q 120 150 210 190 Q 260 260 200 320 Q 120 360 80 300 Z"
          fill={mint}
          stroke={ink}
          strokeWidth="6"
        />
        <path
          d="M 150 430 Q 240 400 300 470 Q 320 560 240 590 Q 170 560 150 430 Z"
          fill={mint}
          stroke={ink}
          strokeWidth="6"
        />
        <path
          d="M 380 420 Q 470 380 560 430 Q 590 500 500 540 Q 420 530 380 420 Z"
          fill={mint}
          stroke={ink}
          strokeWidth="6"
        />
        <path
          d="M 230 90 Q 270 70 300 100 Q 280 130 240 120 Z"
          fill={mint}
          stroke={ink}
          strokeWidth="6"
        />
      </g>
      <path d="M 320 330 L 320 40 A 290 290 0 0 1 610 330 Z" fill={lemon} />
      <path
        d="M 320 330 L 320 60 A 270 270 0 0 1 590 330 Z"
        fill={salmon}
        stroke={ink}
        strokeWidth="5"
      />
      <path
        d="M 320 330 L 320 170 A 160 160 0 0 1 480 330 Z"
        fill={lava}
        stroke={ink}
        strokeWidth="5"
      />
      <path
        d="M 320 330 L 320 245 A 85 85 0 0 1 405 330 Z"
        fill={lemon}
        stroke={ink}
        strokeWidth="5"
      />
      <circle cx="320" cy="330" r="290" fill="none" stroke={ink} strokeWidth="8" />
      <path d="M 320 330 L 320 40 M 320 330 L 610 330" stroke={ink} strokeWidth="8" />
      <path d="M 520 120 L 590 60" stroke={ink} strokeWidth="4" />
      <LayerTag x={600} y={44} label="CRUST" bg="#ffffff" />
      <LayerTag x={490} y={196} label="MANTLE" bg="#ffffff" />
      <LayerTag x={530} y={384} label="OUTER CORE" bg="#ffffff" />
      <LayerTag x={300} y={470} label="INNER CORE · 5,200°C" bg={lemon} />
      <path
        d="M 520 364 L 452 300 M 330 450 L 348 312"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 880,
        top: 330,
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <BoundaryCard
        name="PULL APART"
        where="Iceland"
        text="Plates drift apart. Magma fills the gap."
        bg={mint}
        tilt={-1.5}
      >
        <svg width="220" height="130" viewBox="0 0 220 130" style={{ display: 'block' }}>
          <rect x="0" y="70" width="100" height="60" fill={salmon} stroke={ink} strokeWidth="5" />
          <rect x="120" y="70" width="100" height="60" fill={salmon} stroke={ink} strokeWidth="5" />
          <path d="M 100 130 L 110 60 L 120 130 Z" fill={lava} stroke={ink} strokeWidth="5" />
          <Arrow x={70} y={38} dir={-1} color={ink} />
          <Arrow x={150} y={38} dir={1} color={ink} />
        </svg>
      </BoundaryCard>
      <BoundaryCard
        name="PUSH TOGETHER"
        where="Japan"
        text="One plate dives under and melts."
        bg={pink}
        tilt={1}
      >
        <svg width="220" height="130" viewBox="0 0 220 130" style={{ display: 'block' }}>
          <path d="M 0 70 L 120 70 L 200 130 L 0 130 Z" fill={lilac} stroke={ink} strokeWidth="5" />
          <path
            d="M 120 70 L 220 70 L 220 130 L 200 130 Z"
            fill={salmon}
            stroke={ink}
            strokeWidth="5"
          />
          <path d="M 150 70 L 170 30 L 190 70 Z" fill={lava} stroke={ink} strokeWidth="5" />
          <Arrow x={30} y={38} dir={1} color={ink} />
        </svg>
      </BoundaryCard>
      <BoundaryCard
        name="HOT SPOT"
        where="Hawaii"
        text="Heat punches up through the middle."
        bg={lemon}
        tilt={-0.5}
      >
        <svg width="220" height="130" viewBox="0 0 220 130" style={{ display: 'block' }}>
          <rect x="0" y="54" width="220" height="40" fill={mint} stroke={ink} strokeWidth="5" />
          <path
            d="M 96 130 Q 90 100 104 74 L 116 74 Q 130 100 124 130 Z"
            fill={lava}
            stroke={ink}
            strokeWidth="5"
          />
          <path d="M 80 54 L 110 18 L 140 54 Z" fill={salmon} stroke={ink} strokeWidth="5" />
        </svg>
      </BoundaryCard>
    </div>
    <Deco x={1740} y={110} anim="mv-spin">
      <Plus size={60} color={lemon} />
    </Deco>
    <Deco x={1640} y={210} anim="mv-bob" delay={0.5}>
      <Tri size={50} color={mint} />
    </Deco>
  </div>
);

const TempChip = ({ label, value, bg }: { label: string; value: string; bg: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 16,
      padding: '16px 28px',
      background: bg,
      border: `5px solid ${ink}`,
      borderRadius: 20,
      boxShadow: `8px 8px 0 ${ink}`,
    }}
  >
    <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.06em' }}>{label}</span>
    <span style={{ fontFamily: display, fontWeight: 900, fontSize: 34 }}>{value}</span>
  </div>
);

const HotFact: Page = () => (
  <div style={{ ...fill, background: salmon }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: STRIPES,
        opacity: 0.08,
      }}
    />
    <Deco x={120} y={150} rotate={-3}>
      <Pill bg={lemon} size={26}>
        Hot hot hot
      </Pill>
    </Deco>
    <div
      style={{
        position: 'absolute',
        left: 108,
        top: 270,
        fontFamily: display,
        fontWeight: 900,
        fontSize: 250,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        color: cream,
        WebkitTextStroke: `10px ${ink}`,
        paintOrder: 'stroke fill',
        textShadow: `16px 16px 0 ${ink}`,
      }}
    >
      1,200°C
    </div>
    <p
      style={{
        position: 'absolute',
        left: 120,
        top: 600,
        width: 1240,
        margin: 0,
        fontSize: 42,
        fontWeight: 700,
        lineHeight: 1.3,
      }}
    >
      That’s how hot magma can get — over five times hotter than your oven on full blast.
    </p>
    <div style={{ position: 'absolute', left: 120, top: 810, display: 'flex', gap: 36 }}>
      <TempChip label="YOUR OVEN" value="220°" bg="#ffffff" />
      <TempChip label="PIZZA OVEN" value="450°" bg={lemon} />
      <TempChip label="MAGMA" value="700–1,200°" bg={lava} />
    </div>
    <Deco x={1540} y={130} anim="mv-jelly">
      <svg width={220} height={820} viewBox="0 0 220 820" style={{ display: 'block' }}>
        <rect
          x="70"
          y="10"
          width="80"
          height="640"
          rx="40"
          fill="#ffffff"
          stroke={ink}
          strokeWidth="10"
        />
        <rect x="92" y="120" width="36" height="560" rx="18" fill={lava} />
        <circle cx="110" cy="700" r="96" fill={lava} stroke={ink} strokeWidth="10" />
        <circle cx="80" cy="672" r="20" fill="#ffffff" opacity="0.7" />
        <path
          d="M 150 120 h 30 M 150 220 h 30 M 150 320 h 30 M 150 420 h 30 M 150 520 h 30"
          stroke={ink}
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </Deco>
    <Deco x={1360} y={110} anim="mv-bob" delay={0.3}>
      <Tri size={70} color={lemon} />
    </Deco>
    <Deco x={1780} y={880} anim="mv-spin">
      <Plus size={60} color={mint} />
    </Deco>
    <Deco x={1380} y={940} rotate={-10} anim="mv-float">
      <Squiggle width={170} color={ink} stroke={12} />
    </Deco>
  </div>
);

const Callout = ({ x, y, n, bg }: { x: number; y: number; n: string; bg: string }) => (
  <g>
    <circle cx={x} cy={y} r="26" fill={bg} stroke={ink} strokeWidth="5" />
    <text
      x={x}
      y={y + 10}
      textAnchor="middle"
      style={{ fontFamily: display, fontWeight: 900, fontSize: 26, fill: ink }}
    >
      {n}
    </text>
  </g>
);

const LegendItem = ({
  n,
  term,
  text,
  bg,
}: {
  n: string;
  term: string;
  text: string;
  bg: string;
}) => (
  <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
    <div
      style={{
        width: 56,
        height: 56,
        flexShrink: 0,
        borderRadius: '50%',
        background: bg,
        border: `5px solid ${ink}`,
        display: 'grid',
        placeItems: 'center',
        fontFamily: display,
        fontWeight: 900,
        fontSize: 26,
        boxSizing: 'border-box',
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 28, lineHeight: 1.15 }}>
        {term}
      </div>
      <div style={{ fontSize: 24, fontWeight: 500, marginTop: 6, lineHeight: 1.3 }}>{text}</div>
    </div>
  </div>
);

const Cutaway: Page = () => (
  <div style={fill}>
    <div style={{ position: 'absolute', left: 120, top: 100 }}>
      <Title size={84} shadow={mint}>
        INSIDE A VOLCANO
      </Title>
    </div>
    <svg
      width={1120}
      height={760}
      viewBox="0 0 1120 760"
      style={{ position: 'absolute', left: 80, top: 250, overflow: 'visible' }}
    >
      <defs>
        <clipPath id="mv-cut-cone">
          <path d="M 220 500 L 480 190 Q 560 230 640 190 L 900 500 Z" />
        </clipPath>
        <pattern id="mv-cut-dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="4" fill={ink} />
        </pattern>
        <pattern
          id="mv-cut-stripes"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="9" height="26" fill={ink} />
        </pattern>
      </defs>
      <rect x="20" y="500" width="1080" height="80" fill={mint} stroke={ink} strokeWidth="6" />
      <rect x="20" y="500" width="1080" height="80" fill="url(#mv-cut-dots)" opacity="0.35" />
      <rect x="20" y="580" width="1080" height="80" fill={lilac} stroke={ink} strokeWidth="6" />
      <rect x="20" y="580" width="1080" height="80" fill="url(#mv-cut-stripes)" opacity="0.18" />
      <rect x="20" y="660" width="1080" height="80" fill={pink} stroke={ink} strokeWidth="6" />
      <ellipse cx="560" cy="680" rx="250" ry="56" fill={lava} stroke={ink} strokeWidth="7" />
      <path
        d="M 360 680 Q 410 650 460 680 T 560 680 T 660 680 T 760 680"
        fill="none"
        stroke={lemon}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path d="M 220 500 L 480 190 Q 560 230 640 190 L 900 500 Z" fill={salmon} />
      <g clipPath="url(#mv-cut-cone)">
        <rect x="0" y="250" width="1120" height="36" fill="#ffb19d" />
        <rect x="0" y="322" width="1120" height="36" fill="#ffb19d" />
        <rect x="0" y="394" width="1120" height="36" fill="#ffb19d" />
        <rect x="0" y="466" width="1120" height="36" fill="#ffb19d" />
      </g>
      <path
        d="M 538 640 C 528 520, 576 400, 542 205 L 580 205 C 604 400, 562 520, 590 640 Z"
        fill={lava}
        stroke={ink}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M 560 420 Q 660 380 772 340 L 780 360 Q 670 404 566 446 Z"
        fill={lava}
        stroke={ink}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M 488 200 Q 470 260 430 300 Q 400 330 380 380 Q 372 400 360 420 L 384 424 Q 402 380 432 344 Q 476 296 506 214 Z"
        fill={lemon}
        stroke={ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M 220 500 L 480 190 Q 560 230 640 190 L 900 500"
        fill="none"
        stroke={ink}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <g className="mv-bob" style={{ transformBox: 'fill-box' }}>
        <circle cx="470" cy="120" r="56" fill="#d9d3ea" stroke={ink} strokeWidth="6" />
        <circle cx="660" cy="114" r="58" fill="#d9d3ea" stroke={ink} strokeWidth="6" />
        <circle cx="560" cy="90" r="72" fill="#c9c0e4" stroke={ink} strokeWidth="6" />
        <circle cx="520" cy="156" r="44" fill="#d9d3ea" stroke={ink} strokeWidth="6" />
        <circle cx="612" cy="160" r="40" fill="#c9c0e4" stroke={ink} strokeWidth="6" />
        <circle cx="530" cy="70" r="7" fill={ink} />
        <circle cx="610" cy="120" r="6" fill={ink} />
        <circle cx="480" cy="130" r="5" fill={ink} />
      </g>
      <Callout x={760} y={70} n="1" bg={lilac} />
      <Callout x={700} y={232} n="2" bg={lemon} />
      <Callout x={640} y={330} n="3" bg={salmon} />
      <Callout x={830} y={300} n="4" bg={mint} />
      <Callout x={300} y={470} n="5" bg={pink} />
      <Callout x={850} y={680} n="6" bg={lava} />
      <path d="M 676 220 L 628 204" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <path d="M 614 330 L 584 330" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <path d="M 804 310 L 776 340" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <path d="M 824 680 L 808 680" stroke={ink} strokeWidth="5" strokeLinecap="round" />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 1230,
        top: 270,
        width: 570,
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <LegendItem n="1" term="Ash cloud" text="Rock and glass dust blasted sky-high" bg={lilac} />
      <LegendItem n="2" term="Crater" text="The bowl-shaped mouth at the top" bg={lemon} />
      <LegendItem n="3" term="Main vent" text="The pipe magma rides up" bg={salmon} />
      <LegendItem n="4" term="Side vent" text="A sneaky shortcut out the side" bg={mint} />
      <LegendItem n="5" term="Layers" text="Old eruptions stacked like pancakes" bg={pink} />
      <LegendItem n="6" term="Magma chamber" text="An underground pool of melted rock" bg={lava} />
    </div>
    <Deco x={1740} y={110} anim="mv-spin">
      <Plus size={56} color={pink} />
    </Deco>
    <Deco x={1300} y={130} anim="mv-bob" delay={0.4}>
      <Tri size={56} color={lemon} />
    </Deco>
    <Deco x={1540} y={960} rotate={-6} anim="mv-float">
      <Squiggle width={180} color={cobalt} stroke={13} />
    </Deco>
  </div>
);

const Meter = ({ level }: { level: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', marginRight: 6 }}>
      BOOM
    </span>
    <Dot size={30} color={level >= 1 ? lava : '#ffffff'} />
    <Dot size={30} color={level >= 2 ? lava : '#ffffff'} />
    <Dot size={30} color={level >= 3 ? lava : '#ffffff'} />
    <Dot size={30} color={level >= 4 ? lava : '#ffffff'} />
    <Dot size={30} color={level >= 5 ? lava : '#ffffff'} />
  </div>
);

const EruptionCard = ({
  name,
  text,
  level,
  bg,
  tilt,
  children,
}: {
  name: string;
  text: string;
  level: number;
  bg: string;
  tilt: number;
  children: ReactNode;
}) => (
  <Card bg={bg} tilt={tilt} style={{ width: 390, height: 590, padding: 26 }}>
    <div
      style={{
        height: 270,
        background: '#ffffff',
        border: `5px solid ${ink}`,
        borderRadius: 18,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
    <div style={{ marginTop: 22, fontFamily: display, fontWeight: 900, fontSize: 34 }}>{name}</div>
    <div style={{ marginTop: 14 }}>
      <Meter level={level} />
    </div>
    <div style={{ marginTop: 18, fontSize: 27, fontWeight: 500, lineHeight: 1.35 }}>{text}</div>
  </Card>
);

const EruptionTypes: Page = () => (
  <div style={fill}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 250,
        backgroundImage: TERRAZZO,
        backgroundColor: '#fffaf0',
        borderBottom: `6px solid ${ink}`,
      }}
    />
    <div style={{ position: 'absolute', left: 120, top: 92 }}>
      <Title
        size={84}
        shadow={lemon}
        style={{
          display: 'inline-block',
          background: cream,
          padding: '6px 24px',
          border: `6px solid ${ink}`,
          borderRadius: 24,
        }}
      >
        FOUR KINDS OF KABOOM
      </Title>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 330,
        width: 1680,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <EruptionCard
        name="HAWAIIAN"
        level={1}
        bg={mint}
        tilt={-2}
        text="Runny lava fountains and glowing rivers. Gentle-ish!"
      >
        <svg width="100%" height="100%" viewBox="0 0 330 220" preserveAspectRatio="xMidYMid meet">
          <path d="M 10 200 Q 165 120 320 200 Z" fill={salmon} stroke={ink} strokeWidth="6" />
          <path
            d="M 140 150 Q 150 80 165 60 Q 180 80 190 150"
            fill="none"
            stroke={lava}
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 120 160 Q 110 120 130 100"
            fill="none"
            stroke={lemon}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 210 160 Q 222 120 200 100"
            fill="none"
            stroke={lemon}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 165 150 Q 120 175 70 196"
            fill="none"
            stroke={lava}
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 170 150 Q 230 180 270 196"
            fill="none"
            stroke={lava}
            strokeWidth="9"
            strokeLinecap="round"
          />
        </svg>
      </EruptionCard>
      <EruptionCard
        name="STROMBOLIAN"
        level={2}
        bg={lemon}
        tilt={1.5}
        text="Fizzy bursts every few minutes, like popcorn."
      >
        <svg width="100%" height="100%" viewBox="0 0 330 220" preserveAspectRatio="xMidYMid meet">
          <path
            d="M 60 210 L 145 100 L 185 100 L 270 210 Z"
            fill={salmon}
            stroke={ink}
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <circle cx="150" cy="60" r="14" fill={lava} stroke={ink} strokeWidth="5" />
          <circle cx="190" cy="40" r="11" fill={lemon} stroke={ink} strokeWidth="5" />
          <circle cx="120" cy="30" r="9" fill={lava} stroke={ink} strokeWidth="4" />
          <circle cx="220" cy="74" r="10" fill={lava} stroke={ink} strokeWidth="4" />
          <circle cx="165" cy="20" r="8" fill={lemon} stroke={ink} strokeWidth="4" />
        </svg>
      </EruptionCard>
      <EruptionCard
        name="VULCANIAN"
        level={4}
        bg={pink}
        tilt={-1}
        text="Sticky lava plugs the vent, then — BANG — it blasts free."
      >
        <svg width="100%" height="100%" viewBox="0 0 330 220" preserveAspectRatio="xMidYMid meet">
          <path
            d="M 80 210 L 150 90 L 180 90 L 250 210 Z"
            fill={salmon}
            stroke={ink}
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <circle cx="140" cy="56" r="34" fill="#5b5566" stroke={ink} strokeWidth="5" />
          <circle cx="190" cy="44" r="40" fill="#5b5566" stroke={ink} strokeWidth="5" />
          <circle cx="232" cy="66" r="26" fill="#5b5566" stroke={ink} strokeWidth="5" />
          <path
            d="M 70 70 l 10 -10 M 270 110 l 12 -8 M 96 120 l -12 -6"
            stroke={ink}
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </EruptionCard>
      <EruptionCard
        name="PLINIAN"
        level={5}
        bg={lilac}
        tilt={2}
        text="A giant ash column up to 45 km high. The big one!"
      >
        <svg width="100%" height="100%" viewBox="0 0 330 220" preserveAspectRatio="xMidYMid meet">
          <path
            d="M 90 220 L 150 160 L 180 160 L 240 220 Z"
            fill={salmon}
            stroke={ink}
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M 152 160 L 140 70 L 190 70 L 178 160 Z"
            fill="#8a8399"
            stroke={ink}
            strokeWidth="5"
          />
          <circle cx="110" cy="56" r="34" fill="#8a8399" stroke={ink} strokeWidth="5" />
          <circle cx="165" cy="40" r="42" fill="#8a8399" stroke={ink} strokeWidth="5" />
          <circle cx="222" cy="56" r="34" fill="#8a8399" stroke={ink} strokeWidth="5" />
          <circle cx="270" cy="70" r="22" fill="#8a8399" stroke={ink} strokeWidth="5" />
          <circle cx="62" cy="72" r="20" fill="#8a8399" stroke={ink} strokeWidth="5" />
        </svg>
      </EruptionCard>
    </div>
  </div>
);

const Peak = ({
  height,
  name,
  meters,
  fact,
  bg,
}: {
  height: number;
  name: string;
  meters: string;
  fact: string;
  bg: string;
}) => (
  <div
    style={{
      width: 290,
      height: 720,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
    }}
  >
    <div style={{ marginBottom: 18, textAlign: 'center' }}>
      <div style={{ fontFamily: display, fontWeight: 900, fontSize: 30 }}>{name}</div>
      <div
        style={{
          display: 'inline-block',
          marginTop: 8,
          padding: '4px 16px',
          borderRadius: 999,
          border: `4px solid ${ink}`,
          background: '#ffffff',
          fontWeight: 700,
          fontSize: 24,
        }}
      >
        {meters}
      </div>
    </div>
    <svg width={290} height={height} viewBox={`0 0 290 ${height}`} style={{ display: 'block' }}>
      <path
        d={`M 4 ${height} L 145 6 L 286 ${height} Z`}
        fill={bg}
        stroke={ink}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d={`M 145 6 L 118 ${Math.min(60, height * 0.3)} L 132 ${Math.min(52, height * 0.26)} L 145 ${Math.min(70, height * 0.34)} L 158 ${Math.min(52, height * 0.26)} L 172 ${Math.min(60, height * 0.3)} Z`}
        fill="#ffffff"
        stroke={ink}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
    <div
      style={{
        position: 'absolute',
        top: 744,
        width: 290,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 500,
        lineHeight: 1.3,
      }}
    >
      {fact}
    </div>
  </div>
);

const HallOfFame: Page = () => (
  <div style={fill}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: GRID,
        backgroundSize: '56px 56px',
      }}
    />
    <div style={{ position: 'absolute', left: 120, top: 92 }}>
      <Title size={80} shadow={lilac}>
        HALL OF FAME
      </Title>
      <div style={{ marginTop: 14, fontSize: 28, fontWeight: 500 }}>
        Height above sea level, drawn to scale
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 832,
        width: 1260,
        height: 8,
        background: ink,
        borderRadius: 4,
      }}
    />
    <div style={{ position: 'absolute', left: 120, top: 116, display: 'flex', gap: 24 }}>
      <Peak
        height={440}
        name="MAUNA LOA"
        meters="4,169 m"
        fact="Biggest active volcano on Earth"
        bg={salmon}
      />
      <Peak height={399} name="FUJI" meters="3,776 m" fact="Last erupted in 1707" bg={mint} />
      <Peak height={350} name="ETNA" meters="3,320 m" fact="Erupts almost every year" bg={lemon} />
      <Peak
        height={135}
        name="VESUVIUS"
        meters="1,281 m"
        fact="Buried Pompeii in 79 AD"
        bg={pink}
      />
    </div>
    <Card
      bg={cobalt}
      tilt={4}
      style={{
        position: 'absolute',
        left: 1420,
        top: 236,
        width: 390,
        height: 620,
        padding: 34,
        color: '#ffffff',
      }}
    >
      <Pill bg={lemon} size={22}>
        Bonus: Mars!
      </Pill>
      <svg
        width={170}
        height={170}
        viewBox="0 0 200 200"
        style={{ display: 'block', margin: '28px auto 0' }}
      >
        <circle cx="100" cy="100" r="88" fill={lava} stroke={ink} strokeWidth="8" />
        <path
          d="M 40 130 L 100 70 L 160 130 Z"
          fill={salmon}
          stroke={ink}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <circle cx="62" cy="64" r="10" fill="#c23c1f" />
        <circle cx="140" cy="150" r="14" fill="#c23c1f" />
      </svg>
      <div style={{ marginTop: 26, fontFamily: display, fontWeight: 900, fontSize: 28 }}>
        OLYMPUS MONS
      </div>
      <div
        style={{ marginTop: 10, fontFamily: display, fontWeight: 900, fontSize: 54, color: lemon }}
      >
        21.9 km
      </div>
      <div style={{ marginTop: 12, fontSize: 26, fontWeight: 500, lineHeight: 1.3 }}>
        Way off our chart — five Mauna Loas tall!
      </div>
    </Card>
    <Deco x={1800} y={120} anim="mv-spin">
      <Plus size={50} color={salmon} />
    </Deco>
  </div>
);

const MakeOne: Page = () => (
  <div style={{ ...fill, background: lemon }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: DOTS,
        backgroundSize: '40px 40px',
        opacity: 0.16,
      }}
    />
    <ZigBorder y={44} color={ink} />
    <ZigBorder y={980} color={cobalt} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 250,
        textAlign: 'center',
        fontFamily: display,
        fontWeight: 900,
        lineHeight: 1,
      }}
    >
      <div style={{ fontSize: 170, letterSpacing: '-0.02em', textShadow: `10px 10px 0 ${salmon}` }}>
        LET’S MAKE
      </div>
      <div
        style={{
          fontSize: 230,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          WebkitTextStroke: `9px ${ink}`,
          paintOrder: 'stroke fill',
          textShadow: `14px 14px 0 ${cobalt}`,
        }}
      >
        ONE!
      </div>
      <div style={{ marginTop: 70 }}>
        <Pill bg="#ffffff" size={28}>
          Aprons on · Goggles on · Sleeves up
        </Pill>
      </div>
    </div>
    <Deco x={150} y={680} rotate={-12} anim="mv-wiggle">
      <svg width={170} height={240} viewBox="0 0 170 240" style={{ display: 'block' }}>
        <path
          d="M 60 10 H 110 V 70 L 160 200 Q 165 230 135 230 H 35 Q 5 230 10 200 L 60 70 Z"
          fill="#ffffff"
          stroke={ink}
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <path d="M 30 160 H 140 L 155 205 Q 158 222 135 222 H 35 Q 12 222 16 205 Z" fill={lava} />
        <circle cx="70" cy="140" r="12" fill={pink} stroke={ink} strokeWidth="5" />
        <circle cx="100" cy="112" r="8" fill={pink} stroke={ink} strokeWidth="4" />
        <path d="M 52 10 H 118" stroke={ink} strokeWidth="10" strokeLinecap="round" />
      </svg>
    </Deco>
    <Deco x={1680} y={170} anim="mv-bob">
      <Tri size={120} color={mint} />
    </Deco>
    <Deco x={1560} y={760} anim="mv-spin">
      <Plus size={90} color={salmon} />
    </Deco>
    <Deco x={120} y={180} anim="mv-float" delay={0.4}>
      <HalfDisc size={160} color={cobalt} />
    </Deco>
    <Deco x={1760} y={560} anim="mv-bob" delay={0.8}>
      <Dot size={60} color={pink} />
    </Deco>
    <Deco x={90} y={480} anim="mv-bob" delay={1.2}>
      <Ring size={80} color={salmon} />
    </Deco>
  </div>
);

const Item = ({
  name,
  qty,
  bg,
  tilt,
  children,
}: {
  name: string;
  qty: string;
  bg: string;
  tilt: number;
  children: ReactNode;
}) => (
  <Card
    bg={bg}
    tilt={tilt}
    style={{
      width: 500,
      height: 230,
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      padding: '0 30px',
    }}
  >
    <div
      style={{
        width: 150,
        height: 150,
        flexShrink: 0,
        background: '#ffffff',
        border: `5px solid ${ink}`,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
    <div>
      <div style={{ fontFamily: display, fontWeight: 700, fontSize: 30, lineHeight: 1.12 }}>
        {name}
      </div>
      <div style={{ marginTop: 10, fontSize: 26, fontWeight: 500 }}>{qty}</div>
    </div>
  </Card>
);

const iconSvg: CSSProperties = { display: 'block' };

const Materials: Page = () => (
  <div style={fill}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: GRID,
        backgroundSize: '56px 56px',
      }}
    />
    <div style={{ position: 'absolute', left: 120, top: 100 }}>
      <Title size={84} shadow={pink}>
        YOU WILL NEED
      </Title>
    </div>
    <Deco x={1500} y={40} anim="mv-wiggle">
      <svg width={280} height={280} viewBox="0 0 200 200" style={{ display: 'block' }}>
        <polygon points={STAR_12} fill={lava} stroke={ink} strokeWidth="6" strokeLinejoin="round" />
        <text
          x="100"
          y="96"
          textAnchor="middle"
          style={{ fontFamily: display, fontWeight: 900, fontSize: 20, fill: '#ffffff' }}
        >
          GOGGLES
        </text>
        <text
          x="100"
          y="124"
          textAnchor="middle"
          style={{ fontFamily: display, fontWeight: 900, fontSize: 24, fill: '#ffffff' }}
        >
          ON!
        </text>
      </svg>
    </Deco>
    <div
      style={{
        position: 'absolute',
        left: 140,
        top: 360,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 500px)',
        columnGap: 70,
        rowGap: 70,
      }}
    >
      <Item name="Plastic bottle" qty="Small, empty, clean" bg={mint} tilt={-2}>
        <svg width={90} height={110} viewBox="0 0 90 110" style={iconSvg}>
          <rect
            x="33"
            y="4"
            width="24"
            height="14"
            rx="3"
            fill={cobalt}
            stroke={ink}
            strokeWidth="5"
          />
          <path
            d="M 35 18 H 55 V 30 Q 76 40 76 60 V 98 Q 76 106 68 106 H 22 Q 14 106 14 98 V 60 Q 14 40 35 30 Z"
            fill="#dff6ff"
            stroke={ink}
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      </Item>
      <Item name="Baking soda" qty="2 big spoonfuls" bg={lemon} tilt={1.5}>
        <svg width={100} height={100} viewBox="0 0 100 100" style={iconSvg}>
          <rect
            x="16"
            y="24"
            width="56"
            height="70"
            rx="6"
            fill="#ffffff"
            stroke={ink}
            strokeWidth="5"
          />
          <rect x="16" y="44" width="56" height="24" fill={cobalt} stroke={ink} strokeWidth="5" />
          <path d="M 60 30 L 90 8" stroke={ink} strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="58" cy="32" rx="12" ry="8" fill="#e8e8e8" stroke={ink} strokeWidth="5" />
        </svg>
      </Item>
      <Item name="Vinegar" qty="About 1 cup" bg={pink} tilt={-1}>
        <svg width={70} height={110} viewBox="0 0 70 110" style={iconSvg}>
          <rect x="26" y="4" width="18" height="16" fill={ink} />
          <path
            d="M 26 20 H 44 V 36 L 56 48 V 102 Q 56 106 52 106 H 18 Q 14 106 14 102 V 48 L 26 36 Z"
            fill="#fff6c9"
            stroke={ink}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <rect x="14" y="58" width="42" height="26" fill={salmon} stroke={ink} strokeWidth="5" />
        </svg>
      </Item>
      <Item name="Dish soap" qty="One good squirt" bg={lilac} tilt={2}>
        <svg width={100} height={110} viewBox="0 0 100 110" style={iconSvg}>
          <path
            d="M 30 30 H 58 V 104 H 22 V 44 Z"
            fill={mint}
            stroke={ink}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 38 30 V 16 H 52 V 30 M 52 16 H 66"
            fill="none"
            stroke={ink}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="76" cy="26" r="9" fill="#ffffff" stroke={ink} strokeWidth="4" />
          <circle cx="86" cy="52" r="6" fill="#ffffff" stroke={ink} strokeWidth="4" />
          <circle cx="72" cy="70" r="7" fill="#ffffff" stroke={ink} strokeWidth="4" />
        </svg>
      </Item>
      <Item name="Red colouring" qty="5 drops" bg={salmon} tilt={-1.5}>
        <svg width={80} height={110} viewBox="0 0 80 110" style={iconSvg}>
          <rect x="30" y="6" width="20" height="26" rx="8" fill={ink} />
          <path
            d="M 32 32 H 48 L 44 76 H 36 Z"
            fill="#ffffff"
            stroke={ink}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 40 84 Q 52 98 40 106 Q 28 98 40 84 Z"
            fill={lava}
            stroke={ink}
            strokeWidth="4"
          />
        </svg>
      </Item>
      <Item name="Tray + clay" qty="To catch the mess" bg={cobalt} tilt={1}>
        <svg width={110} height={90} viewBox="0 0 110 90" style={iconSvg}>
          <path
            d="M 30 66 L 50 22 H 62 L 82 66 Z"
            fill={salmon}
            stroke={ink}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <rect
            x="6"
            y="64"
            width="98"
            height="16"
            rx="8"
            fill={lemon}
            stroke={ink}
            strokeWidth="5"
          />
        </svg>
      </Item>
    </div>
  </div>
);

const ExpStep = ({ n, text, bg }: { n: string; text: ReactNode; bg: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      height: 104,
      padding: '0 30px 0 18px',
      background: '#ffffff',
      border: `6px solid ${ink}`,
      borderRadius: 999,
      boxShadow: `10px 10px 0 ${ink}`,
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        width: 72,
        height: 72,
        flexShrink: 0,
        borderRadius: '50%',
        background: bg,
        border: `5px solid ${ink}`,
        display: 'grid',
        placeItems: 'center',
        fontFamily: display,
        fontWeight: 900,
        fontSize: 32,
        boxSizing: 'border-box',
      }}
    >
      {n}
    </div>
    <div style={{ fontSize: 32, fontWeight: 500 }}>{text}</div>
  </div>
);

const Experiment: Page = () => (
  <div style={{ ...fill, background: '#fff0f6' }}>
    <div style={{ position: 'absolute', left: 120, top: 92 }}>
      <Title size={80} shadow={mint}>
        ERUPTION TIME!
      </Title>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 250,
        width: 1080,
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
      }}
    >
      <Steps>
        <Step>
          <ExpStep n="1" text="Squish the clay into a cone around the bottle." bg={mint} />
        </Step>
        <Step>
          <ExpStep n="2" text="Spoon in 2 tablespoons of baking soda." bg={lemon} />
        </Step>
        <Step>
          <ExpStep n="3" text="Add a squirt of soap and 5 drops of red." bg={pink} />
        </Step>
        <Step>
          <ExpStep
            n="4"
            text={
              <>
                Pour in the vinegar and <b>STAND BACK!</b>
              </>
            }
            bg={salmon}
          />
        </Step>
        <Step duration={320}>
          <Card
            bg={cobalt}
            tilt={-1}
            style={{ marginTop: 14, padding: '26px 34px', color: '#ffffff' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Pill bg={lemon} size={24}>
                Why?
              </Pill>
              <span style={{ fontFamily: display, fontWeight: 900, fontSize: 32 }}>
                ACID + BASE → CO₂ GAS
              </span>
            </div>
            <div style={{ marginTop: 16, fontSize: 30, fontWeight: 500, lineHeight: 1.35 }}>
              The gas makes millions of bubbles that push the foam up and out!
            </div>
          </Card>
        </Step>
      </Steps>
    </div>
    <svg
      width={540}
      height={560}
      viewBox="0 0 540 560"
      style={{ position: 'absolute', left: 1280, top: 430 }}
    >
      <rect
        x="10"
        y="500"
        width="520"
        height="40"
        rx="20"
        fill={lemon}
        stroke={ink}
        strokeWidth="7"
      />
      <path
        d="M 70 500 L 220 210 H 320 L 470 500 Z"
        fill={salmon}
        stroke={ink}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M 100 440 H 440 M 130 380 H 410 M 160 320 H 380" stroke="#ffb19d" strokeWidth="18" />
      <path
        d="M 70 500 L 220 210 H 320 L 470 500"
        fill="none"
        stroke={ink}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M 214 214 Q 196 150 236 130 Q 250 90 290 110 Q 336 110 330 160 Q 350 200 326 214 Z"
        fill={lava}
        stroke={ink}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M 226 214 Q 210 270 186 300 Q 176 320 196 322 Q 214 318 226 280 Z"
        fill={lava}
        stroke={ink}
        strokeWidth="6"
      />
      <path
        d="M 316 214 Q 336 290 360 330 Q 368 350 350 352 Q 330 346 318 290 Z"
        fill={lava}
        stroke={ink}
        strokeWidth="6"
      />
    </svg>
    <div style={{ position: 'absolute', left: 1540, top: 560 }}>
      <Deco x={-10} y={0} anim="mv-erupt" delay={0}>
        <Dot size={48} color={lemon} />
      </Deco>
      <div style={{ '--dx': '-90px', '--dy': '-200px' } as CSSProperties}>
        <Deco x={0} y={0} anim="mv-erupt" delay={0.6}>
          <Dot size={40} color={salmon} />
        </Deco>
      </div>
      <div style={{ '--dx': '100px', '--dy': '-220px' } as CSSProperties}>
        <Deco x={0} y={0} anim="mv-erupt" delay={1.1}>
          <Dot size={44} color={lemon} />
        </Deco>
      </div>
      <div style={{ '--dx': '30px', '--dy': '-280px' } as CSSProperties}>
        <Deco x={0} y={0} anim="mv-erupt" delay={1.6}>
          <Dot size={34} color={lava} />
        </Deco>
      </div>
    </div>
    <Deco x={1640} y={130} anim="mv-spin">
      <Plus size={64} color={lemon} />
    </Deco>
    <Deco x={1330} y={150} rotate={-10} anim="mv-wiggle">
      <svg width={240} height={240} viewBox="0 0 200 200" style={{ display: 'block' }}>
        <polygon
          points={STAR_12}
          fill={lemon}
          stroke={ink}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <text
          x="100"
          y="114"
          textAnchor="middle"
          style={{ fontFamily: display, fontWeight: 900, fontSize: 36, fill: ink }}
        >
          FIZZ!
        </text>
      </svg>
    </Deco>
  </div>
);

const Question = ({ n, q, bg }: { n: string; q: string; bg: string }) => (
  <Card
    bg="#ffffff"
    style={{ height: 170, display: 'flex', alignItems: 'center', gap: 28, padding: '0 34px' }}
  >
    <div
      style={{
        width: 84,
        height: 84,
        flexShrink: 0,
        borderRadius: 20,
        background: bg,
        border: `5px solid ${ink}`,
        display: 'grid',
        placeItems: 'center',
        fontFamily: display,
        fontWeight: 900,
        fontSize: 40,
        boxSizing: 'border-box',
        transform: 'rotate(-6deg)',
      }}
    >
      {n}
    </div>
    <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.25 }}>{q}</div>
  </Card>
);

const Answer = ({ text, bg, tilt }: { text: string; bg: string; tilt: number }) => (
  <Card
    bg={bg}
    tilt={tilt}
    style={{
      height: 170,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 26px',
      fontFamily: display,
      fontWeight: 900,
      fontSize: 34,
      lineHeight: 1.15,
    }}
  >
    {text}
  </Card>
);

const Quiz: Page = () => (
  <div style={{ ...fill, background: mint }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: GRID,
        backgroundSize: '56px 56px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 92,
        display: 'flex',
        alignItems: 'center',
        gap: 36,
      }}
    >
      <Title size={84} shadow="#ffffff">
        POP QUIZ!
      </Title>
      <Pill bg={lemon} size={24} style={{ transform: 'rotate(-5deg)' }}>
        Shout it out!
      </Pill>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 290,
        width: 1680,
        display: 'grid',
        gridTemplateColumns: '1130px 470px',
        columnGap: 80,
        rowGap: 44,
      }}
    >
      <Steps>
        <Question n="1" q="What is magma called once it’s above ground?" bg={salmon} />
        <Step duration={260}>
          <Answer text="LAVA!" bg={lemon} tilt={3} />
        </Step>
        <Question n="2" q="Where is the biggest volcano in the solar system?" bg={pink} />
        <Step duration={260}>
          <Answer text="ON MARS!" bg={salmon} tilt={-2.5} />
        </Step>
        <Question n="3" q="Which gas made our kitchen volcano fizz?" bg={lilac} />
        <Step duration={260}>
          <Answer text="CARBON DIOXIDE" bg={pink} tilt={2} />
        </Step>
      </Steps>
    </div>
    <Deco x={1760} y={80} anim="mv-bob">
      <Dot size={56} color={salmon} />
    </Deco>
    <Deco x={1560} y={110} anim="mv-spin">
      <Plus size={54} color={lemon} />
    </Deco>
  </div>
);

const Closing: Page = () => (
  <div style={{ ...fill, background: cobalt, color: '#ffffff' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 4px, transparent 4.6px)',
        backgroundSize: '40px 40px',
      }}
    />
    <div style={{ position: 'absolute', left: 140, top: 200 }}>
      <div className="mv-spin" style={{ animationDuration: '40s' }}>
        <svg width={640} height={640} viewBox="0 0 400 400" style={{ display: 'block' }}>
          <polygon
            points={STAR_18}
            fill={lemon}
            stroke={ink}
            strokeWidth="7"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: ink,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.16em' }}>OFFICIALLY</div>
        <div
          style={{
            marginTop: 10,
            fontFamily: display,
            fontWeight: 900,
            fontSize: 46,
            lineHeight: 1.05,
          }}
        >
          JUNIOR
          <br />
          VOLCANO-
          <br />
          LOGIST
        </div>
        <svg width={120} height={40} viewBox="0 0 120 40" style={{ marginTop: 16 }}>
          <path
            d="M 6 20 Q 21 2 36 20 T 66 20 T 96 20 T 116 20"
            fill="none"
            stroke={lava}
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 900, top: 260, width: 900 }}>
      <Title size={96} color="#ffffff" shadow={ink}>
        THANKS FOR
        <br />
        ERUPTING
        <br />
        WITH US!
      </Title>
      <p style={{ margin: '40px 0 0', fontSize: 34, fontWeight: 500, lineHeight: 1.4 }}>
        Grab a sticker on your way out —
        <br />
        your volcano comes home with you!
      </p>
      <div style={{ marginTop: 40 }}>
        <Pill bg={pink} size={26}>
          Next Saturday · Dino Dig
        </Pill>
      </div>
    </div>
    <Deco x={1760} y={110} anim="mv-bob">
      <Tri size={70} color={salmon} />
    </Deco>
    <Deco x={1700} y={930} anim="mv-float">
      <Squiggle width={180} color={lemon} stroke={14} />
    </Deco>
    <Deco x={80} y={940} anim="mv-bob" delay={0.6}>
      <Dot size={50} color={mint} />
    </Deco>
  </div>
);

export const meta: SlideMeta = {
  title: 'Volcano Lab',
  createdAt: '2026-10-07T15:49:26.232Z',
};

export const notes: (string | undefined)[] = [
  `Hello, volcano scientists! Welcome to Volcano Lab.
Ask: who has ever seen a volcano — in real life, on TV, in a book? Hands up!
Today we're going to find out how they work, and then we're going to make one erupt.`,
  `Here's our plan. Read the six stops out loud and get them to shout "make one" with you on stop five.
Mention the sticker at the end — it keeps them listening.`,
  `Hold up an egg if you have one. The Earth's shell is cracked like this egg into giant plates.
Point at the cutaway: crust is the thin shell, then the mantle, then the super-hot core.
Volcanoes pop up where plates pull apart, push together, or where a hot spot burns through — like Hawaii.`,
  `Big number time. Twelve hundred degrees!
Your oven at home gets to about two hundred and twenty. Pizza ovens, four hundred and fifty. Magma is way, way hotter.`,
  `Let's look inside. Go number by number: the magma chamber at the bottom, the main vent it rides up, the sneaky side vent, the crater, and the ash cloud.
Ask: why do you think there are stripes on the volcano? Old eruptions, stacked like pancakes.`,
  `Not all eruptions are the same. Hawaiian ones are runny and gentle-ish. Strombolian ones go pop-pop like popcorn.
Vulcanian ones get plugged, then bang. Plinian ones are the giant ash columns — the boom-o-meter is full.`,
  `Hall of fame! These are drawn to scale. Mauna Loa is the biggest active volcano on Earth.
Then the bonus: Olympus Mons on Mars is so tall it doesn't fit on our chart.`,
  `Okay… are you ready? Let's make one! Get them to count down from three.`,
  `Here's what's on your table. Point at each item and have a helper hold it up.
Goggles on before anyone touches the vinegar.`,
  `Go one step at a time — click after each table finishes.
Step four: everyone stand back! Then reveal the why: vinegar is an acid, baking soda is a base, together they make carbon dioxide gas.`,
  `Quiz time. Read each question, let them shout, then click to reveal.
Answers: lava, on Mars, carbon dioxide.`,
  `You did it — you're junior volcanologists now. Hand out stickers at the door.
Plug next week's workshop: Dino Dig.`,
];

export default [
  Cover,
  Plan,
  Tectonics,
  HotFact,
  Cutaway,
  EruptionTypes,
  HallOfFame,
  MakeOne,
  Materials,
  Experiment,
  Quiz,
  Closing,
] satisfies Page[];

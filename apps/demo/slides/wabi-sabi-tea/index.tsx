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
  palette: { bg: '#ebe3d2', text: '#1d1b18', accent: '#b5381f' },
  fonts: {
    display:
      '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", "Noto Serif CJK JP", serif',
    body: '"Cormorant Garamond", "Hiragino Mincho ProN", "Yu Mincho", YuMincho, serif',
  },
  typeScale: { hero: 230, body: 34 },
  radius: 2,
};

const MUTED = '#857a6a';
const MATCHA = '#6f7d3c';
const PAPER_LIGHT = '#f5efe2';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap';
const FONT_LINK_ID = 'osd-webfont-wabi-sabi-tea';
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

const STYLE_ID = 'osd-styles-wabi-sabi-tea';
const css = `
@keyframes wabi-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes wabi-bleed {
  0% { opacity: 0; filter: blur(12px); }
  55% { opacity: 0.8; filter: blur(3px); }
  100% { opacity: 1; filter: blur(0); }
}
@keyframes wabi-stamp {
  0% { opacity: 0; transform: scale(1.35); }
  55% { opacity: 1; transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}
.wabi-draw { animation: wabi-draw 3.2s cubic-bezier(0.55, 0.08, 0.3, 1) both; }
.wabi-bleed { animation: wabi-bleed 1.6s cubic-bezier(0.2, 0, 0.1, 1) both; }
.wabi-stamp { animation: wabi-stamp 0.55s cubic-bezier(0.3, 0, 0.2, 1) both; }
[data-osd-step="revealed"] > .wabi-step { animation: wabi-bleed 1.1s cubic-bezier(0.2, 0, 0.1, 1) both; }
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

const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

// Ink-bleed: the incoming page soaks into the paper — blur and contrast settle as it fades in.
export const transition: SlideTransition = {
  duration: 560,
  exit: { duration: 560, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 560,
    easing: 'cubic-bezier(0.2, 0, 0.1, 1)',
    keyframes: [
      { opacity: 0, filter: 'blur(10px) contrast(1.5)' },
      { opacity: 0.7, filter: 'blur(3px) contrast(1.15)', offset: 0.55 },
      { opacity: 1, filter: 'blur(0px) contrast(1)' },
    ],
  },
};

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const GRAIN = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.3 0 0 0 0 0.25 0 0 0 0 0.18 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`,
);

const MOTTLE = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='0.0035 0.006' numOctaves='4' seed='11'/><feColorMatrix values='0 0 0 0 0.48 0 0 0 0 0.4 0 0 0 0 0.29 1.1 0 0 0 -0.42'/></filter><rect width='100%' height='100%' filter='url(#m)'/></svg>`,
);

const FIBERS = (() => {
  const r = rng(7);
  let dark = '';
  let light = '';
  for (let i = 0; i < 520; i++) {
    const x = r() * 1920;
    const y = r() * 1080;
    const len = 8 + r() * 64;
    const a = r() * Math.PI * 2;
    const bend = (r() - 0.5) * 22;
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    const cx = (x + x2) / 2 + Math.cos(a + Math.PI / 2) * bend;
    const cy = (y + y2) / 2 + Math.sin(a + Math.PI / 2) * bend;
    const seg = `M${x.toFixed(1)} ${y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (i % 4 === 0) dark += seg;
    else light += seg;
  }
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'><path d='${dark}' fill='none' stroke='#6b5a40' stroke-opacity='0.16' stroke-width='0.7'/><path d='${light}' fill='none' stroke='#fffaf0' stroke-opacity='0.5' stroke-width='1.1'/></svg>`,
  );
})();

const layer: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };

const Washi = () => (
  <div
    aria-hidden
    style={{
      ...layer,
      background:
        'radial-gradient(ellipse at 18% 12%, rgba(255,251,240,0.85), transparent 55%), radial-gradient(ellipse at 88% 92%, rgba(170,150,115,0.28), transparent 60%), var(--osd-bg)',
    }}
  >
    <div style={{ ...layer, backgroundImage: MOTTLE, opacity: 0.55 }} />
    <div style={{ ...layer, backgroundImage: GRAIN, opacity: 0.4, mixBlendMode: 'multiply' }} />
    <div style={{ ...layer, backgroundImage: FIBERS }} />
    <div style={{ ...layer, boxShadow: 'inset 0 0 260px rgba(110, 88, 56, 0.22)' }} />
  </div>
);

const useUid = (prefix: string) => `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

const RoughFilter = ({ id, scale, freq = 0.05 }: { id: string; scale: number; freq?: number }) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={3} result="n" />
    <feDisplacementMap
      in="SourceGraphic"
      in2="n"
      scale={scale}
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
);

const ensoPath = (offset: number, t0: number, t1: number, wobble: number) => {
  const pts: string[] = [];
  const start = 118;
  const sweep = 332;
  const steps = 140;
  for (let i = 0; i <= steps; i++) {
    const t = t0 + ((t1 - t0) * i) / steps;
    const deg = start + sweep * t;
    const th = (deg * Math.PI) / 180;
    const r =
      380 + offset + 9 * Math.sin(2 * th + wobble) + 6 * Math.sin(5 * th + wobble * 2) + t * 16;
    const x = 500 + r * Math.cos(th);
    const y = 500 + r * Math.sin(th);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join('');
};

const ENSO_CORE = ensoPath(0, 0, 1, 0.4);
const ENSO_STREAKS = [
  ensoPath(-24, 0.42, 1, 1.1),
  ensoPath(-13, 0.3, 0.97, 0.7),
  ensoPath(15, 0.36, 0.99, 1.6),
  ensoPath(25, 0.55, 1, 2.2),
];

const Enso = ({
  size,
  animate,
  delay = 0,
  opacity = 1,
  style,
}: {
  size: number;
  animate: boolean;
  delay?: number;
  opacity?: number;
  style?: CSSProperties;
}) => {
  const rough = useUid('enso-rough');
  const mask = useUid('enso-mask');
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 1000"
      width={size}
      height={size}
      style={{ color: 'var(--osd-text)', opacity, overflow: 'visible', ...style }}
    >
      <defs>
        <RoughFilter id={rough} scale={16} freq={0.035} />
        <mask id={mask} maskUnits="userSpaceOnUse" x={-100} y={-100} width={1200} height={1200}>
          <path
            d={ENSO_CORE}
            fill="none"
            stroke="white"
            strokeWidth={150}
            pathLength={1}
            strokeDasharray="1 2"
            className={animate ? 'wabi-draw' : undefined}
            style={{ animationDelay: `${delay}ms`, strokeDashoffset: animate ? undefined : 0 }}
          />
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <g filter={`url(#${rough})`} fill="none" stroke="currentColor" strokeLinecap="round">
          <path d={ENSO_CORE} strokeWidth={70} pathLength={1} strokeDasharray="0.58 2" />
          <path d={ENSO_CORE} strokeWidth={52} pathLength={1} strokeDasharray="0.8 2" />
          <path d={ENSO_CORE} strokeWidth={34} pathLength={1} strokeDasharray="0.92 2" />
          <path d={ENSO_CORE} strokeWidth={16} opacity={0.85} />
          <path d={ENSO_STREAKS[0]} strokeWidth={4} opacity={0.55} />
          <path d={ENSO_STREAKS[1]} strokeWidth={3} opacity={0.7} />
          <path d={ENSO_STREAKS[2]} strokeWidth={5} opacity={0.5} />
          <path d={ENSO_STREAKS[3]} strokeWidth={3} opacity={0.6} />
        </g>
      </g>
    </svg>
  );
};

const Hanko = ({
  size = 120,
  top = '茶',
  bottom = '道',
  rotate = -4,
  animate = false,
  delay = 0,
}: {
  size?: number;
  top?: string;
  bottom?: string;
  rotate?: number;
  animate?: boolean;
  delay?: number;
}) => {
  const id = useUid('hanko');
  return (
    <div style={{ width: size, height: size, transform: `rotate(${rotate}deg)` }}>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={animate ? 'wabi-stamp' : undefined}
        style={{ animationDelay: `${delay}ms`, display: 'block' }}
      >
        <defs>
          <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.55"
              numOctaves={3}
              seed={9}
              result="t"
            />
            <feColorMatrix
              in="t"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.55"
              result="holes"
            />
            <feComposite in="SourceGraphic" in2="holes" operator="in" result="eroded" />
            <feDisplacementMap
              in="eroded"
              in2="t"
              scale={2.5}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <g filter={`url(#${id})`}>
          <rect x={4} y={4} width={92} height={92} rx={5} style={{ fill: 'var(--osd-accent)' }} />
          <rect
            x={10}
            y={10}
            width={80}
            height={80}
            rx={2}
            fill="none"
            stroke={PAPER_LIGHT}
            strokeWidth={1.6}
          />
          <text
            x={50}
            y={46}
            textAnchor="middle"
            fontSize={36}
            fontWeight={700}
            fill={PAPER_LIGHT}
            style={{ fontFamily: 'var(--osd-font-display)' }}
          >
            {top}
          </text>
          <text
            x={50}
            y={83}
            textAnchor="middle"
            fontSize={36}
            fontWeight={700}
            fill={PAPER_LIGHT}
            style={{ fontFamily: 'var(--osd-font-display)' }}
          >
            {bottom}
          </text>
        </g>
      </svg>
    </div>
  );
};

const InkCloud = ({
  left,
  top,
  width,
  height,
  strength = 0.16,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  strength?: number;
}) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      left,
      top,
      width,
      height,
      background: `radial-gradient(closest-side, rgba(29,27,24,${strength}), rgba(29,27,24,${strength * 0.45}) 45%, transparent)`,
      filter: 'blur(40px)',
      mixBlendMode: 'multiply',
      pointerEvents: 'none',
    }}
  />
);

const ridge = (seed: number, base: number, amp: number) => {
  const r = rng(seed);
  const p1 = r() * 6;
  const p2 = r() * 6;
  const p3 = r() * 6;
  let d = `M0 420L0 ${base}`;
  for (let x = 0; x <= 1920; x += 24) {
    const y =
      base -
      amp *
        (0.55 * Math.sin(x / 260 + p1) +
          0.3 * Math.sin(x / 97 + p2) +
          0.15 * Math.sin(x / 41 + p3) +
          0.6);
    d += `L${x} ${y.toFixed(1)}`;
  }
  return `${d}L1920 420Z`;
};

const RIDGE_FAR = ridge(3, 170, 110);
const RIDGE_MID = ridge(17, 250, 90);
const RIDGE_NEAR = ridge(29, 330, 60);

const InkWash = ({ opacity = 1 }: { opacity?: number }) => {
  const g = useUid('wash');
  const blur = useUid('wash-blur');
  return (
    <svg
      aria-hidden
      viewBox="0 0 1920 420"
      width={1920}
      height={420}
      style={{ position: 'absolute', left: 0, bottom: 0, opacity, pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1b18" stopOpacity={0.55} />
          <stop offset="0.45" stopColor="#1d1b18" stopOpacity={0.14} />
          <stop offset="1" stopColor="#1d1b18" stopOpacity={0} />
        </linearGradient>
        <filter id={blur} x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={40} />
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      <g filter={`url(#${blur})`}>
        <path d={RIDGE_FAR} fill={`url(#${g})`} opacity={0.4} />
        <path d={RIDGE_MID} fill={`url(#${g})`} opacity={0.6} />
        <path d={RIDGE_NEAR} fill={`url(#${g})`} opacity={0.85} />
      </g>
    </svg>
  );
};

const KANJI_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const kanjiNumber = (n: number) => {
  if (n < 10) return KANJI_DIGITS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${tens === 1 ? '' : KANJI_DIGITS[tens]}十${ones ? KANJI_DIGITS[ones] : ''}`;
};

const Folio = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        right: 92,
        bottom: 84,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 22,
        color: MUTED,
      }}
    >
      <span style={{ writingMode: 'vertical-rl', letterSpacing: '0.2em' }}>
        {kanjiNumber(current)}
      </span>
      <span style={{ width: 1, height: 44, background: MUTED, opacity: 0.6 }} />
      <span style={{ writingMode: 'vertical-rl', letterSpacing: '0.2em' }}>
        {kanjiNumber(total)}
      </span>
    </div>
  );
};

const Bleed = ({
  delay = 0,
  style,
  children,
}: {
  delay?: number;
  style?: CSSProperties;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'wabi-bleed' : undefined}
      style={{ animationDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
};

const frame: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
};

const eyebrow: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 22,
  fontWeight: 600,
  letterSpacing: '0.34em',
  textTransform: 'uppercase',
  color: MUTED,
};

const vertical: CSSProperties = {
  writingMode: 'vertical-rl',
  fontFamily: 'var(--osd-font-display)',
  lineHeight: 1,
};

const sumiShadow = '0 0 1px rgba(29,27,24,0.55), 0 0 22px rgba(29,27,24,0.1)';

const Cover: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={frame}>
      <Washi />
      <InkCloud left={140} top={40} width={1000} height={760} strength={0.1} />
      <Enso
        size={680}
        animate={live}
        delay={200}
        style={{ position: 'absolute', left: 250, top: 36 }}
      />
      <Bleed
        delay={900}
        style={{
          ...vertical,
          position: 'absolute',
          right: 230,
          top: 140,
          fontSize: 'var(--osd-size-hero)',
          letterSpacing: '0.12em',
          textShadow: sumiShadow,
        }}
      >
        茶道
      </Bleed>
      <Bleed
        delay={1500}
        style={{
          ...vertical,
          position: 'absolute',
          right: 520,
          top: 160,
          fontSize: 32,
          letterSpacing: '0.42em',
          color: MUTED,
        }}
      >
        さどう ― 一碗の道
      </Bleed>
      <div style={{ position: 'absolute', right: 296, top: 728 }}>
        <Hanko size={124} animate={live} delay={2600} />
      </div>
      <Bleed delay={1900} style={{ position: 'absolute', left: 160, bottom: 120, width: 1060 }}>
        <div style={eyebrow}>An introduction to chadō</div>
        <div
          style={{
            fontSize: 112,
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 1.05,
            margin: '18px 0 20px',
          }}
        >
          The Way of Tea
        </div>
        <div style={{ fontSize: 'var(--osd-size-body)', color: '#4c443a', fontWeight: 500 }}>
          A bilingual introduction to the ceremony of a single bowl
        </div>
      </Bleed>
    </div>
  );
};

const IchigoIchie: Page = () => (
  <div style={frame}>
    <Washi />
    <InkWash opacity={0.75} />
    <InkCloud left={1200} top={20} width={760} height={620} strength={0.08} />
    <Bleed
      style={{
        ...vertical,
        position: 'absolute',
        right: 230,
        top: 130,
        fontSize: 140,
        letterSpacing: '0.18em',
        textShadow: sumiShadow,
      }}
    >
      一期一会
    </Bleed>
    <div
      style={{
        ...vertical,
        position: 'absolute',
        right: 420,
        top: 150,
        fontSize: 26,
        letterSpacing: '0.5em',
        color: MUTED,
      }}
    >
      いちご いちえ
    </div>
    <div
      style={{
        position: 'absolute',
        right: 435,
        top: 470,
        width: 2,
        height: 120,
        background: 'var(--osd-accent)',
      }}
    />
    <Bleed delay={400} style={{ position: 'absolute', left: 160, top: 250, width: 1000 }}>
      <div style={eyebrow}>Ichigo ichie</div>
      <div
        style={{
          fontSize: 100,
          fontStyle: 'italic',
          lineHeight: 1.05,
          margin: '22px 0 46px',
        }}
      >
        One time, one meeting.
      </div>
      <p
        style={{
          fontSize: 38,
          lineHeight: 1.5,
          margin: 0,
          maxWidth: 880,
          fontWeight: 500,
          color: '#3a342c',
        }}
      >
        No gathering of host and guest will ever happen again. The host prepares as if it were the
        last; the guest receives as if it were the first.
      </p>
      <div style={{ fontSize: 26, color: MUTED, marginTop: 40, fontStyle: 'italic' }}>
        — Yamanoue Sōji, 1588 · later taken up by Ii Naosuke
      </div>
    </Bleed>
    <Folio />
  </div>
);

const Principle = ({
  kanji,
  numeral,
  romaji,
  english,
  children,
  offset,
}: {
  kanji: string;
  numeral: string;
  romaji: string;
  english: string;
  children: ReactNode;
  offset: number;
}) => (
  <div style={{ width: 330, marginTop: offset }}>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 190,
        lineHeight: 1,
        textShadow: sumiShadow,
      }}
    >
      {kanji}
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginTop: 30,
        fontSize: 22,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: MUTED,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--osd-font-display)',
          color: 'var(--osd-accent)',
          letterSpacing: 0,
        }}
      >
        {numeral}
      </span>
      {romaji}
    </div>
    <div style={{ fontSize: 48, fontStyle: 'italic', margin: '8px 0 12px', lineHeight: 1.15 }}>
      {english}
    </div>
    <div style={{ fontSize: 29, lineHeight: 1.42, color: '#433b31', fontWeight: 500 }}>
      {children}
    </div>
  </div>
);

const Principles: Page = () => (
  <div style={frame}>
    <Washi />
    <InkCloud left={-200} top={500} width={900} height={700} strength={0.08} />
    <div style={{ position: 'absolute', left: 160, top: 120 }}>
      <div style={eyebrow}>四規 · Shiki</div>
      <div style={{ fontSize: 72, lineHeight: 1.1, marginTop: 14, fontStyle: 'italic' }}>
        The four principles
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1060,
        top: 150,
        width: 600,
        fontSize: 30,
        lineHeight: 1.45,
        color: MUTED,
        fontStyle: 'italic',
      }}
    >
      Set down by Sen no Rikyū. Every gesture in the room answers to one of these four characters.
    </div>
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 360,
        width: 1600,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Principle kanji="和" numeral="一" romaji="Wa" english="Harmony" offset={0}>
        Between host and guest, and with the turning of the seasons.
      </Principle>
      <Principle kanji="敬" numeral="二" romaji="Kei" english="Respect" offset={64}>
        For every person and every object, however humble.
      </Principle>
      <Principle kanji="清" numeral="三" romaji="Sei" english="Purity" offset={24}>
        Of the room, the utensils, and the heart that handles them.
      </Principle>
      <Principle kanji="寂" numeral="四" romaji="Jaku" english="Tranquility" offset={88}>
        The stillness that remains once the first three are lived.
      </Principle>
    </div>
    <Folio />
  </div>
);

const LINE_Y = 540;

const BrushLine = () => {
  const id = useUid('brushline');
  return (
    <svg
      aria-hidden
      viewBox="0 0 1500 60"
      width={1500}
      height={60}
      style={{ position: 'absolute', left: 120, top: LINE_Y - 30, color: 'var(--osd-text)' }}
    >
      <defs>
        <RoughFilter id={id} scale={7} freq={0.06} />
      </defs>
      <path
        filter={`url(#${id})`}
        fill="currentColor"
        d="M20 32 C 200 21, 420 23, 700 25 C 960 27, 1170 29, 1370 31 C 1170 34, 960 37, 700 39 C 420 40, 200 41, 24 37 Z"
        opacity={0.88}
      />
    </svg>
  );
};

const LineageNode = ({
  x,
  above,
  year,
  jp,
  en,
  highlight = false,
  children,
}: {
  x: number;
  above: boolean;
  year: string;
  jp: string;
  en: string;
  highlight?: boolean;
  children: ReactNode;
}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: x - (highlight ? 17 : 12),
        top: LINE_Y - (highlight ? 17 : 12),
        width: highlight ? 34 : 24,
        height: highlight ? 34 : 24,
        borderRadius: '50%',
        background: highlight ? 'var(--osd-accent)' : 'var(--osd-text)',
        boxShadow: highlight ? '0 0 0 8px rgba(181,56,31,0.14)' : 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: x,
        top: above ? LINE_Y - 64 : LINE_Y + 24,
        width: 1,
        height: 40,
        background: MUTED,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: x - 150,
        width: 300,
        ...(above ? { bottom: 1080 - LINE_Y + 80 } : { top: LINE_Y + 80 }),
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: '0.24em',
          fontWeight: 600,
          color: highlight ? 'var(--osd-accent)' : MUTED,
        }}
      >
        {year}
      </div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 44,
          lineHeight: 1.2,
          marginTop: 10,
          letterSpacing: '0.08em',
        }}
      >
        {jp}
      </div>
      <div style={{ fontSize: 32, fontStyle: 'italic', marginTop: 4 }}>{en}</div>
      <div
        style={{
          fontSize: 28,
          lineHeight: 1.4,
          marginTop: 12,
          color: '#433b31',
          fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  </>
);

const Lineage: Page = () => (
  <div style={frame}>
    <Washi />
    <div style={{ position: 'absolute', left: 160, bottom: 130 }}>
      <div style={eyebrow}>1423 — today</div>
      <div style={{ fontSize: 60, fontStyle: 'italic', marginTop: 12, lineHeight: 1.1 }}>
        From Zen hall
        <br />
        to tea house
      </div>
    </div>
    <div
      style={{
        ...vertical,
        position: 'absolute',
        right: 170,
        top: 150,
        fontSize: 120,
        letterSpacing: '0.2em',
        textShadow: sumiShadow,
      }}
    >
      系譜
    </div>
    <div
      style={{
        position: 'absolute',
        right: 330,
        top: 160,
        writingMode: 'vertical-rl',
        fontSize: 22,
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: MUTED,
      }}
    >
      The lineage of wabi-cha
    </div>
    <BrushLine />
    <LineageNode x={340} above year="1423 – 1502" jp="村田珠光" en="Murata Jukō">
      Brings Zen to the tea room and prizes plain local wares.
    </LineageNode>
    <LineageNode x={680} above={false} year="1502 – 1555" jp="武野紹鷗" en="Takeno Jōō">
      Shrinks the room to four and a half mats; tea as poetry.
    </LineageNode>
    <LineageNode x={1020} above year="1522 – 1591" jp="千利休" en="Sen no Rikyū" highlight>
      Defines wabi-cha: the crawl-in door, the black Raku bowl.
    </LineageNode>
    <LineageNode x={1360} above={false} year="1600s – today" jp="三千家" en="The three Sen houses">
      Omote, Ura and Mushakōji carry his line to the present.
    </LineageNode>
    <Folio />
  </div>
);

const U = 200;
const OX = 80;
const OY = 130;

const Mat = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
  const horizontal = w > h;
  const px = OX + x * U;
  const py = OY + y * U;
  const pw = w * U;
  const ph = h * U;
  return (
    <g>
      <rect x={px} y={py} width={pw} height={ph} fill="#ddd0ae" stroke="#1d1b18" strokeWidth={2} />
      {horizontal ? (
        <>
          <rect x={px} y={py} width={pw} height={7} fill="#2b2620" />
          <rect x={px} y={py + ph - 7} width={pw} height={7} fill="#2b2620" />
        </>
      ) : (
        <>
          <rect x={px} y={py} width={7} height={ph} fill="#2b2620" />
          <rect x={px + pw - 7} y={py} width={7} height={ph} fill="#2b2620" />
        </>
      )}
    </g>
  );
};

const PlanMarker = ({ x, y, n }: { x: number; y: number; n: string }) => (
  <g>
    <circle cx={x} cy={y} r={20} style={{ fill: 'var(--osd-accent)' }} />
    <text
      x={x}
      y={y + 8}
      textAnchor="middle"
      fontSize={22}
      fill={PAPER_LIGHT}
      style={{ fontFamily: 'var(--osd-font-display)' }}
    >
      {n}
    </text>
  </g>
);

const TeaRoomPlan = () => {
  const id = useUid('plan');
  return (
    <svg
      aria-hidden
      viewBox="0 0 760 800"
      width={760}
      height={800}
      style={{ position: 'absolute', left: 170, top: 150 }}
    >
      <defs>
        <RoughFilter id={id} scale={3} freq={0.08} />
      </defs>
      <g filter={`url(#${id})`}>
        <rect x={OX} y={OY - 110} width={250} height={110} fill="#d3c4a0" opacity={0.7} />
        <path
          d={`M${OX} ${OY} L${OX} ${OY - 110} L${OX + 250} ${OY - 110} L${OX + 250} ${OY}`}
          fill="none"
          stroke="#1d1b18"
          strokeWidth={8}
        />
        <Mat x={0} y={0} w={2} h={1} />
        <Mat x={2} y={0} w={1} h={2} />
        <Mat x={1} y={2} w={2} h={1} />
        <Mat x={0} y={1} w={1} h={2} />
        <rect
          x={OX + U}
          y={OY + U}
          width={U}
          height={U}
          fill="#d6c8a4"
          stroke="#1d1b18"
          strokeWidth={2}
        />
        <rect x={OX + 1.5 * U - 47} y={OY + 1.5 * U - 47} width={94} height={94} fill="#2b2620" />
        <rect x={OX + 1.5 * U - 33} y={OY + 1.5 * U - 33} width={66} height={66} fill="#6d6458" />
        <circle cx={OX + 1.5 * U} cy={OY + 1.5 * U} r={24} fill="#1d1b18" />
        <path
          d={`M${OX} ${OY + 2.2 * U} L${OX} ${OY} L${OX + 3 * U} ${OY} L${OX + 3 * U} ${OY + 0.05 * U}
              M${OX + 3 * U} ${OY + 0.95 * U} L${OX + 3 * U} ${OY + 3 * U} L${OX} ${OY + 3 * U} L${OX} ${OY + 2.93 * U}`}
          fill="none"
          stroke="#1d1b18"
          strokeWidth={8}
        />
        <path
          d={`M${OX - 16} ${OY + 2.2 * U} L${OX - 16} ${OY + 2.93 * U}`}
          stroke="#1d1b18"
          strokeWidth={3}
          strokeDasharray="8 6"
        />
        <path
          d={`M${OX + 3 * U + 16} ${OY + 0.05 * U} L${OX + 3 * U + 16} ${OY + 0.95 * U}`}
          stroke="#1d1b18"
          strokeWidth={3}
          strokeDasharray="8 6"
        />
      </g>
      <PlanMarker x={OX + 125} y={OY - 55} n="一" />
      <PlanMarker x={OX - 48} y={OY + 2.56 * U} n="二" />
      <PlanMarker x={OX + 1.5 * U + 70} y={OY + 1.5 * U - 70} n="三" />
      <PlanMarker x={OX + 2.5 * U} y={OY + 1.3 * U} n="四" />
      <text
        x={OX + 3 * U + 40}
        y={OY + 0.5 * U + 8}
        fontSize={20}
        fill={MUTED}
        style={{ fontFamily: 'var(--osd-font-body)', fontStyle: 'italic' }}
      >
        host
      </text>
    </svg>
  );
};

const RoomItem = ({
  n,
  jp,
  en,
  children,
}: {
  n: string;
  jp: string;
  en: string;
  children: ReactNode;
}) => (
  <div style={{ display: 'flex', gap: 26, alignItems: 'flex-start' }}>
    <div
      style={{
        flex: '0 0 auto',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--osd-accent)',
        color: PAPER_LIGHT,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
        <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 34 }}>{jp}</span>
        <span style={{ fontSize: 32, fontStyle: 'italic' }}>{en}</span>
      </div>
      <div style={{ fontSize: 29, color: '#433b31', fontWeight: 500, marginTop: 4 }}>
        {children}
      </div>
    </div>
  </div>
);

const TeaRoom: Page = () => (
  <div style={frame}>
    <Washi />
    <TeaRoomPlan />
    <div style={{ position: 'absolute', left: 1040, top: 150, width: 720 }}>
      <div style={eyebrow}>茶室 · Chashitsu</div>
      <div style={{ fontSize: 72, fontStyle: 'italic', lineHeight: 1.1, marginTop: 14 }}>
        Four and a half mats
      </div>
      <div
        style={{
          fontSize: 32,
          lineHeight: 1.45,
          marginTop: 20,
          color: MUTED,
          fontStyle: 'italic',
        }}
      >
        About 7.3 m² — small enough that five guests share one breath of steam.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 52 }}>
        <RoomItem n="一" jp="床の間" en="Tokonoma">
          The alcove: one scroll, one flower.
        </RoomItem>
        <RoomItem n="二" jp="躙口" en="Nijiriguchi">
          A 66 cm crawl-in door. Every guest bows.
        </RoomItem>
        <RoomItem n="三" jp="炉" en="Ro">
          The sunken hearth, lit November to April.
        </RoomItem>
        <RoomItem n="四" jp="点前畳" en="Temae-datami">
          The host’s mat, entered by a separate door.
        </RoomItem>
      </div>
    </div>
    <Folio />
  </div>
);

const CHASEN_TINES = (() => {
  let d = '';
  for (let i = -8; i <= 8; i++) {
    const sx = 120 + i * 1.6;
    const cx = 120 + i * 9.5;
    const ex = 120 + i * 6.2;
    const curl = i === 0 ? 0 : -Math.sign(i) * 7;
    d += `M${sx} 152 Q${cx} 92 ${ex} 40 q${curl} -6 ${curl * 1.6} -2`;
  }
  return d;
})();

const ARARE = (() => {
  let d = '';
  for (let y = 112; y <= 196; y += 12) {
    for (let x = 52; x <= 188; x += 12) {
      const ox = (y / 12) % 2 === 0 ? 0 : 6;
      const px = x + ox;
      const inside = ((px - 120) / 70) ** 2 + ((y - 150) / 56) ** 2 < 1;
      if (inside) d += `M${px - 2.4} ${y}a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0`;
    }
  }
  return d;
})();

const UtensilArt = ({ children }: { children: ReactNode }) => {
  const id = useUid('utensil');
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 240"
      width={260}
      height={260}
      style={{ display: 'block', color: 'var(--osd-text)' }}
    >
      <defs>
        <RoughFilter id={id} scale={3.5} freq={0.09} />
      </defs>
      <ellipse cx={120} cy={222} rx={86} ry={7} fill="#1d1b18" opacity={0.1} />
      <g
        filter={`url(#${id})`}
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
};

const Utensil = ({
  art,
  jp,
  romaji,
  english,
  offset,
  children,
}: {
  art: ReactNode;
  jp: string;
  romaji: string;
  english: string;
  offset: number;
  children: ReactNode;
}) => (
  <div style={{ width: 280, marginTop: offset }}>
    <div style={{ display: 'flex', justifyContent: 'center' }}>{art}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 48,
        letterSpacing: '0.1em',
        marginTop: 22,
        lineHeight: 1.1,
      }}
    >
      {jp}
    </div>
    <div style={{ fontSize: 32, marginTop: 6 }}>
      <span style={{ fontStyle: 'italic' }}>{romaji}</span>
      <span style={{ color: MUTED }}> · {english}</span>
    </div>
    <div
      style={{ fontSize: 28, lineHeight: 1.4, marginTop: 10, color: '#433b31', fontWeight: 500 }}
    >
      {children}
    </div>
  </div>
);

const Utensils: Page = () => (
  <div style={frame}>
    <Washi />
    <div style={{ position: 'absolute', left: 160, top: 112 }}>
      <div style={eyebrow}>道具 · Dōgu</div>
      <div style={{ fontSize: 64, fontStyle: 'italic', lineHeight: 1.1, marginTop: 10 }}>
        Five objects, handled like guests
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 300,
        width: 1600,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Utensil
        jp="茶碗"
        romaji="Chawan"
        english="bowl"
        offset={0}
        art={
          <UtensilArt>
            <path
              d="M30 96 C 32 154, 62 198, 120 200 C 178 198, 208 154, 210 96 Z"
              fill="#1d1b18"
            />
            <path d="M94 200 L 97 214 L 143 214 L 146 200" fill="#1d1b18" />
            <ellipse cx={120} cy={96} rx={90} ry={15} fill={MATCHA} />
            <ellipse cx={112} cy={94} rx={52} ry={7} fill="#97a35d" stroke="none" />
            <path d="M52 120 C 58 150, 72 172, 92 184" stroke="#f5efe2" opacity={0.35} />
          </UtensilArt>
        }
      >
        Raku-fired by hand. Its flaws are the point.
      </Utensil>
      <Utensil
        jp="茶筅"
        romaji="Chasen"
        english="whisk"
        offset={56}
        art={
          <UtensilArt>
            <path d={CHASEN_TINES} fill="none" strokeWidth={2} />
            <path d="M112 152 L 120 70 L 128 152 Z" fill="#1d1b18" opacity={0.55} stroke="none" />
            <rect x={104} y={150} width={32} height={10} fill="#1d1b18" />
            <rect x={106} y={160} width={28} height={58} rx={3} fill="#e6dcc4" />
            <path d="M106 190 L 134 190" />
          </UtensilArt>
        }
      >
        One length of bamboo, split into eighty tines.
      </Utensil>
      <Utensil
        jp="茶杓"
        romaji="Chashaku"
        english="scoop"
        offset={0}
        art={
          <UtensilArt>
            <path
              d="M24 206 L 192 60 C 204 48, 222 46, 226 58 C 228 66, 218 70, 206 68 L 34 214 Z"
              fill="#cbb689"
            />
            <path d="M108 128 L 120 142 M114 123 L 126 137" strokeWidth={2.5} />
            <path d="M200 58 C 208 54, 216 54, 220 58" strokeWidth={2} />
          </UtensilArt>
        }
      >
        A bamboo scoop, carved and named by the host.
      </Utensil>
      <Utensil
        jp="棗"
        romaji="Natsume"
        english="caddy"
        offset={56}
        art={
          <UtensilArt>
            <path
              d="M56 112 C 56 70, 184 70, 184 112 L 182 168 C 180 204, 60 204, 58 168 Z"
              fill="#1d1b18"
            />
            <path d="M57 124 C 92 134, 148 134, 183 124" stroke="#f5efe2" strokeWidth={2} />
            <path d="M78 100 C 84 88, 102 82, 118 80" stroke="#f5efe2" opacity={0.4} />
          </UtensilArt>
        }
      >
        Lacquered caddy for thin tea, shaped like a jujube.
      </Utensil>
      <Utensil
        jp="釜"
        romaji="Kama"
        english="kettle"
        offset={0}
        art={
          <UtensilArt>
            <path d="M108 58 C 98 44, 124 34, 112 16" fill="none" stroke={MUTED} strokeWidth={2} />
            <path d="M132 60 C 124 48, 144 40, 134 26" fill="none" stroke={MUTED} strokeWidth={2} />
            <path
              d="M44 120 C 40 180, 80 212, 120 212 C 160 212, 200 180, 196 120 C 194 96, 160 86, 120 86 C 80 86, 46 96, 44 120 Z"
              fill="#2b2620"
            />
            <path d={ARARE} fill="#4b443a" stroke="none" />
            <circle cx={38} cy={118} r={10} fill="none" />
            <circle cx={202} cy={118} r={10} fill="none" />
            <ellipse cx={120} cy={86} rx={42} ry={8} fill="#1d1b18" />
            <circle cx={120} cy={74} r={7} fill="#1d1b18" />
          </UtensilArt>
        }
      >
        Cast iron. Its simmer is called “wind in the pines.”
      </Utensil>
    </div>
    <Folio />
  </div>
);

const Measure = ({
  value,
  unit,
  jp,
  accent = false,
  children,
}: {
  value: string;
  unit: string;
  jp: string;
  accent?: boolean;
  children: ReactNode;
}) => (
  <div style={{ width: 340 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <span
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 140,
          lineHeight: 1,
          color: accent ? 'var(--osd-accent)' : 'var(--osd-text)',
          textShadow: accent ? 'none' : sumiShadow,
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 40, fontStyle: 'italic', color: MUTED }}>{unit}</span>
    </div>
    <div
      style={{
        fontSize: 30,
        lineHeight: 1.35,
        marginTop: 14,
        fontWeight: 500,
        color: '#3a342c',
      }}
    >
      {children}
    </div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 22,
        letterSpacing: '0.3em',
        color: MUTED,
        marginTop: 10,
      }}
    >
      {jp}
    </div>
  </div>
);

const ByTheBowl: Page = () => (
  <div style={frame}>
    <Washi />
    <InkCloud left={-160} top={60} width={760} height={900} strength={0.1} />
    <div
      style={{
        ...vertical,
        position: 'absolute',
        left: 190,
        top: 150,
        fontSize: 170,
        letterSpacing: '0.16em',
        textShadow: sumiShadow,
      }}
    >
      一碗
    </div>
    <div
      style={{
        position: 'absolute',
        left: 400,
        top: 160,
        writingMode: 'vertical-rl',
        fontSize: 22,
        letterSpacing: '0.4em',
        fontWeight: 600,
        textTransform: 'uppercase',
        color: MUTED,
      }}
    >
      One bowl, measured
    </div>
    <div
      style={{
        position: 'absolute',
        left: 620,
        top: 170,
        width: 1140,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 340px)',
        columnGap: 60,
        rowGap: 76,
      }}
    >
      <Measure value="2" unit="g" jp="抹茶">
        of matcha — two scoops from the chashaku
      </Measure>
      <Measure value="70" unit="ml" jp="湯">
        of water, ladled from the kettle
      </Measure>
      <Measure value="80" unit="°C" jp="温度">
        just off the boil, so the tea stays sweet
      </Measure>
      <Measure value="15" unit="sec" jp="点てる">
        of whisking — the wrist moves, not the arm
      </Measure>
      <Measure value="3½" unit="sips" jp="三口半" accent>
        to empty the bowl; the last one is audible
      </Measure>
      <Measure value="4" unit="hours" jp="茶事">
        for a full chaji, from charcoal to farewell
      </Measure>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 620,
        bottom: 120,
        fontSize: 28,
        fontStyle: 'italic',
        color: MUTED,
      }}
    >
      Measured by hand, never by scale — these are where a practised hand settles.
    </div>
    <Folio />
  </div>
);

const TemaeStep = ({
  numeral,
  verb,
  english,
  children,
}: {
  numeral: string;
  verb: string;
  english: string;
  children: ReactNode;
}) => (
  <div className="wabi-step" style={{ width: 232 }}>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 28,
        color: 'var(--osd-accent)',
      }}
    >
      {numeral}
    </div>
    <div style={{ height: 270, marginTop: 18, display: 'flex' }}>
      <div
        style={{
          ...vertical,
          fontSize: 72,
          letterSpacing: '0.12em',
          textShadow: sumiShadow,
        }}
      >
        {verb}
      </div>
    </div>
    <div style={{ width: 60, height: 1, background: MUTED, margin: '18px 0 20px' }} />
    <div style={{ fontSize: 38, fontStyle: 'italic', lineHeight: 1.1 }}>{english}</div>
    <div
      style={{ fontSize: 28, lineHeight: 1.38, marginTop: 10, color: '#433b31', fontWeight: 500 }}
    >
      {children}
    </div>
  </div>
);

const Temae: Page = () => (
  <div style={frame}>
    <Washi />
    <div style={{ position: 'absolute', left: 160, top: 112 }}>
      <div style={eyebrow}>点前 · Temae</div>
      <div style={{ fontSize: 64, fontStyle: 'italic', lineHeight: 1.1, marginTop: 10 }}>
        Making a bowl of usucha
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 160,
        top: 168,
        fontSize: 28,
        fontStyle: 'italic',
        color: MUTED,
      }}
    >
      read right to left, as the host moves ←
    </div>
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 320,
        width: 1600,
        display: 'flex',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
      }}
    >
      <Steps>
        <Step duration={500}>
          <TemaeStep numeral="一" verb="清める" english="Purify">
            Fold the silk fukusa; wipe caddy and scoop in silence.
          </TemaeStep>
        </Step>
        <Step duration={500}>
          <TemaeStep numeral="二" verb="温める" english="Warm">
            Hot water into the bowl, rinse the whisk, pour away.
          </TemaeStep>
        </Step>
        <Step duration={500}>
          <TemaeStep numeral="三" verb="掬う" english="Measure">
            Two scoops of matcha, tapped once on the rim.
          </TemaeStep>
        </Step>
        <Step duration={500}>
          <TemaeStep numeral="四" verb="点てる" english="Whisk">
            Seventy millilitres, whisked to a fine, pale foam.
          </TemaeStep>
        </Step>
        <Step duration={500}>
          <TemaeStep numeral="五" verb="出す" english="Offer">
            Turn the bowl so its face looks toward the guest.
          </TemaeStep>
        </Step>
        <Step duration={500}>
          <TemaeStep numeral="六" verb="頂く" english="Receive">
            Bow, turn the bowl twice, drink, wipe the rim.
          </TemaeStep>
        </Step>
      </Steps>
    </div>
    <Folio />
  </div>
);

const WC = 430;
const polar = (r: number, deg: number) => {
  const th = (deg * Math.PI) / 180;
  return [WC + r * Math.sin(th), WC - r * Math.cos(th)] as const;
};
const arc = (r: number, from: number, to: number) => {
  const mid = from + (to - from) / 2;
  const [x0, y0] = polar(r, from);
  const [x1, y1] = polar(r, mid);
  const [x2, y2] = polar(r, to);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
};

const MonthLabel = ({ month, label }: { month: number; label: string }) => {
  const [x, y] = polar(360, (month - 1) * 30);
  return (
    <text
      x={x}
      y={y + 8}
      textAnchor="middle"
      fontSize={22}
      fill={MUTED}
      style={{ fontFamily: 'var(--osd-font-display)' }}
    >
      {label}
    </text>
  );
};

const SeasonWheel = () => {
  const id = useUid('wheel');
  const [tx, ty] = polar(395, 285);
  const [m0x, m0y] = polar(238, 285);
  const [m1x, m1y] = polar(342, 285);
  return (
    <svg
      aria-hidden
      viewBox="0 0 860 860"
      width={860}
      height={860}
      style={{ position: 'absolute', left: 130, top: 120 }}
    >
      <defs>
        <RoughFilter id={id} scale={12} freq={0.03} />
      </defs>
      <circle cx={WC} cy={WC} r={226} fill="none" stroke={MUTED} strokeWidth={1} opacity={0.6} />
      <g filter={`url(#${id})`} fill="none" strokeLinecap="butt">
        <path d={arc(290, 287, 463)} stroke="#1d1b18" strokeWidth={54} opacity={0.86} />
        <path d={arc(290, 107, 283)} stroke={MATCHA} strokeWidth={54} opacity={0.66} />
      </g>
      <path
        d={`M${m0x} ${m0y} L${m1x} ${m1y}`}
        style={{ stroke: 'var(--osd-accent)' }}
        strokeWidth={5}
      />
      <text
        x={tx}
        y={ty - 14}
        textAnchor="middle"
        fontSize={24}
        style={{ fill: 'var(--osd-accent)', fontFamily: 'var(--osd-font-display)' }}
      >
        炉開き
      </text>
      <MonthLabel month={1} label="一月" />
      <MonthLabel month={2} label="二月" />
      <MonthLabel month={3} label="三月" />
      <MonthLabel month={4} label="四月" />
      <MonthLabel month={5} label="五月" />
      <MonthLabel month={6} label="六月" />
      <MonthLabel month={7} label="七月" />
      <MonthLabel month={8} label="八月" />
      <MonthLabel month={9} label="九月" />
      <MonthLabel month={10} label="十月" />
      <MonthLabel month={11} label="十一月" />
      <MonthLabel month={12} label="十二月" />
      <line x1={WC - 150} y1={WC} x2={WC + 150} y2={WC} stroke={MUTED} strokeWidth={1} />
      <text
        x={WC}
        y={WC - 52}
        textAnchor="middle"
        fontSize={86}
        fill="#1d1b18"
        style={{ fontFamily: 'var(--osd-font-display)' }}
      >
        炉
      </text>
      <text
        x={WC}
        y={WC - 18}
        textAnchor="middle"
        fontSize={20}
        letterSpacing="0.3em"
        fill={MUTED}
        style={{ fontFamily: 'var(--osd-font-body)', fontWeight: 600 }}
      >
        RO
      </text>
      <text
        x={WC}
        y={WC + 46}
        textAnchor="middle"
        fontSize={20}
        letterSpacing="0.3em"
        fill={MUTED}
        style={{ fontFamily: 'var(--osd-font-body)', fontWeight: 600 }}
      >
        FURO
      </text>
      <text
        x={WC}
        y={WC + 120}
        textAnchor="middle"
        fontSize={66}
        fill={MATCHA}
        style={{ fontFamily: 'var(--osd-font-display)' }}
      >
        風炉
      </text>
    </svg>
  );
};

const SeasonBlock = ({
  jp,
  name,
  months,
  color,
  children,
}: {
  jp: string;
  name: string;
  months: string;
  color: string;
  children: ReactNode;
}) => (
  <div style={{ display: 'flex', gap: 24 }}>
    <div style={{ width: 6, background: color, flex: '0 0 auto', opacity: 0.85 }} />
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 40 }}>{jp}</span>
        <span style={{ fontSize: 36, fontStyle: 'italic' }}>{name}</span>
        <span style={{ fontSize: 24, letterSpacing: '0.2em', color: MUTED, fontWeight: 600 }}>
          {months}
        </span>
      </div>
      <div
        style={{ fontSize: 30, lineHeight: 1.42, marginTop: 8, color: '#433b31', fontWeight: 500 }}
      >
        {children}
      </div>
    </div>
  </div>
);

const Seasons: Page = () => (
  <div style={frame}>
    <Washi />
    <SeasonWheel />
    <div style={{ position: 'absolute', left: 1080, top: 170, width: 690 }}>
      <div style={eyebrow}>季節 · Kisetsu</div>
      <div style={{ fontSize: 66, fontStyle: 'italic', lineHeight: 1.1, marginTop: 14 }}>
        The year turns on the fire
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: 56 }}>
        <SeasonBlock jp="炉" name="Ro" months="NOV – APR" color="#1d1b18">
          The hearth is sunk into the floor and drawn close to the guests.
        </SeasonBlock>
        <SeasonBlock jp="風炉" name="Furo" months="MAY – OCT" color={MATCHA}>
          A brazier on the mats moves the fire away to keep the room cool.
        </SeasonBlock>
      </div>
      <div
        style={{
          marginTop: 52,
          fontSize: 28,
          lineHeight: 1.45,
          fontStyle: 'italic',
          color: MUTED,
        }}
      >
        <span style={{ color: 'var(--osd-accent)', fontStyle: 'normal' }}>炉開き</span> Robiraki —
        opening the hearth in November — is the tea world’s new year.
      </div>
    </div>
    <Folio />
  </div>
);

const Course = ({ n, name, children }: { n: string; name: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
    <span
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 22,
        color: 'var(--osd-accent)',
        width: 24,
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 36, fontStyle: 'italic', width: 230 }}>{name}</span>
    <span style={{ fontSize: 30, color: '#433b31', fontWeight: 500 }}>{children}</span>
  </div>
);

const MenuLine = ({ dish, detail }: { dish: string; detail: string }) => (
  <div style={{ fontSize: 40, letterSpacing: '0.24em', lineHeight: 1.65 }}>
    {dish}
    <span style={{ fontSize: 26, color: MUTED, marginInlineStart: 56, letterSpacing: '0.34em' }}>
      {detail}
    </span>
  </div>
);

const Kaiseki: Page = () => (
  <div style={frame}>
    <Washi />
    <div style={{ position: 'absolute', left: 160, top: 150, width: 820 }}>
      <div style={eyebrow}>懐石 · Kaiseki</div>
      <div style={{ fontSize: 66, fontStyle: 'italic', lineHeight: 1.1, marginTop: 14 }}>
        A meal before the bowl
      </div>
      <div style={{ fontSize: 28, color: MUTED, marginTop: 16, fontStyle: 'italic' }}>
        Autumn menu · the tenth month · served on lacquer
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 50 }}>
        <Course n="一" name="Mukōzuke">
          sea bream, kelp-cured
        </Course>
        <Course n="二" name="Shiru">
          white miso, wheat gluten
        </Course>
        <Course n="三" name="Nimonowan">
          shrimp dumpling in clear broth
        </Course>
        <Course n="四" name="Yakimono">
          Spanish mackerel, yuzu
        </Course>
        <Course n="五" name="Hassun">
          one taste of sea, one of mountain
        </Course>
        <Course n="六" name="Kō no mono">
          pickles with the last rice
        </Course>
        <Course n="七" name="Omogashi">
          chestnut kinton, before the tea
        </Course>
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1010,
        top: 140,
        width: 760,
        height: 800,
        background: `linear-gradient(160deg, ${PAPER_LIGHT}, #efe7d6)`,
        boxShadow: '0 30px 70px rgba(80, 60, 30, 0.16), 0 2px 6px rgba(80, 60, 30, 0.12)',
      }}
    >
      <div style={{ ...layer, backgroundImage: FIBERS, opacity: 0.7 }} />
      <div
        style={{
          position: 'absolute',
          inset: 24,
          border: '1px solid rgba(29,27,24,0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 96,
          right: 70,
          height: 620,
          writingMode: 'vertical-rl',
          fontFamily: 'var(--osd-font-display)',
        }}
      >
        <div style={{ fontSize: 64, letterSpacing: '0.3em', lineHeight: 1.5 }}>献立</div>
        <div
          style={{
            fontSize: 24,
            color: MUTED,
            letterSpacing: '0.3em',
            lineHeight: 1.4,
            marginInlineStart: 0,
            marginBlockEnd: 24,
          }}
        >
          神無月
        </div>
        <MenuLine dish="向付" detail="鯛 昆布〆" />
        <MenuLine dish="汁" detail="白味噌 生麩" />
        <MenuLine dish="煮物椀" detail="海老真薯" />
        <MenuLine dish="焼物" detail="鰆 幽庵焼" />
        <MenuLine dish="八寸" detail="海のもの 山のもの" />
        <MenuLine dish="香の物" detail="沢庵 胡瓜" />
        <MenuLine dish="主菓子" detail="栗きんとん" />
      </div>
      <div style={{ position: 'absolute', left: 64, bottom: 64 }}>
        <Hanko size={84} top="利" bottom="休" rotate={3} />
      </div>
    </div>
    <Folio />
  </div>
);

const HaikuLine = ({ children }: { children: ReactNode }) => (
  <div style={{ lineHeight: 1.9 }}>{children}</div>
);

const Haiku: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={frame}>
      <Washi />
      <InkCloud left={900} top={60} width={1000} height={900} strength={0.07} />
      <Enso
        size={860}
        animate={live}
        opacity={0.16}
        style={{ position: 'absolute', left: 980, top: 110 }}
      />
      <Bleed
        delay={300}
        style={{
          position: 'absolute',
          right: 330,
          top: 170,
          writingMode: 'vertical-rl',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 92,
          letterSpacing: '0.14em',
          textShadow: sumiShadow,
        }}
      >
        <HaikuLine>古池や</HaikuLine>
        <HaikuLine>
          <span style={{ paddingInlineStart: 92 }}>蛙飛びこむ</span>
        </HaikuLine>
        <HaikuLine>
          <span style={{ paddingInlineStart: 184 }}>水の音</span>
        </HaikuLine>
      </Bleed>
      <div
        style={{
          position: 'absolute',
          right: 290,
          top: 560,
          writingMode: 'vertical-rl',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 30,
          letterSpacing: '0.4em',
          color: MUTED,
        }}
      >
        芭蕉
      </div>
      <div style={{ position: 'absolute', right: 268, top: 740 }}>
        <Hanko size={76} top="芭" bottom="蕉" rotate={-6} animate={live} delay={2400} />
      </div>
      <Bleed delay={1200} style={{ position: 'absolute', left: 160, top: 470, width: 760 }}>
        <div style={eyebrow}>Matsuo Bashō · 1686</div>
        <div style={{ fontSize: 56, fontStyle: 'italic', lineHeight: 1.35, marginTop: 26 }}>
          An old pond —<br />a frog leaps in,
          <br />
          the sound of water.
        </div>
      </Bleed>
      <div
        style={{
          position: 'absolute',
          left: 160,
          bottom: 120,
          display: 'flex',
          alignItems: 'baseline',
          gap: 24,
          fontSize: 30,
          color: MUTED,
        }}
      >
        <span style={{ fontFamily: 'var(--osd-font-display)', color: 'var(--osd-text)' }}>
          ありがとうございました
        </span>
        <span style={{ fontStyle: 'italic' }}>Thank you for sitting with us.</span>
      </div>
      <Folio />
    </div>
  );
};

export const meta: SlideMeta = {
  title: 'The Way of Tea · 茶道',
  createdAt: '2026-10-07T15:40:36.845Z',
};

export default [
  Cover,
  IchigoIchie,
  Principles,
  Lineage,
  TeaRoom,
  Utensils,
  ByTheBowl,
  Temae,
  Seasons,
  Kaiseki,
  Haiku,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Let the ensō finish drawing before you say anything — about three seconds.
Then: "Tonight is about a single bowl of tea, and why it takes four hundred years to make one properly."
Introduce yourself and how long you have studied.`,
  `This phrase is the whole ceremony in four characters. Ichigo ichie — one time, one meeting.
Ask the room to notice that this exact group will never sit together again. Pause there.
Credit Yamanoue Sōji, Rikyū's student, for writing it down in 1588.`,
  `Wa, kei, sei, jaku. Harmony, respect, purity, tranquility.
Point out that jaku is not something you do — it is what is left once you have practised the other three.
Keep this brisk; we come back to each principle in the room and the sequence.`,
  `Four names, roughly a hundred and seventy years.
Jukō brings Zen in. Jōō makes the room smaller and more poetic. Rikyū finishes the thought.
Mention that all three Sen schools today trace directly back to Rikyū's grandson, Sōtan.`,
  `Walk the plan clockwise from the alcove.
The crawl-in door is the detail people remember: sixty-six centimetres, so a samurai had to leave his sword outside and bow to enter.
Inside, everyone is equal.`,
  `Five utensils. Don't rush — linger on the black Raku bowl and say that the unevenness is deliberate.
Fun fact for the whisk: it is cut from one piece of bamboo, about eighty tines.
The kettle's sound has a name: matsukaze, wind in the pines.`,
  `Numbers for the practically minded.
Two grams, seventy millilitres, eighty degrees, fifteen seconds.
The three-and-a-half sips gets a laugh: the last half-sip is meant to be audible, to tell the host you've finished.`,
  `Advance one step at a time. Read right to left, the way the host actually moves.
Purify, warm, measure, whisk, offer, receive.
After the last step, mention that a beginner spends about a year learning just these six movements.`,
  `The year has two halves, set by where the fire sits.
November to April the sunken hearth; May to October the brazier.
Robiraki — opening the hearth in November — is celebrated as the new year of tea.`,
  `Kaiseki was originally just enough food that strong tea would not upset an empty stomach.
Walk the left list, then point at the menu card: written vertically, read right to left, the way a guest would see it.
The seal on the card is just for fun — Rikyū's name.`,
  `Close with Bashō. Read it in Japanese first, slowly, then in English.
"The sound of water" is the same sound you hear when the host pours into the bowl.
Thank the room, bow, and invite questions.`,
];

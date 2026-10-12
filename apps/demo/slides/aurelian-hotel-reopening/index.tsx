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
  palette: { bg: '#0E1C18', text: '#EEE4CC', accent: '#C9A45C' },
  fonts: {
    display: '"Poiret One", "Futura", "Avenir Next", sans-serif',
    body: '"Cormorant Garamond", "Cormorant", Georgia, serif',
  },
  typeScale: { hero: 150, body: 34 },
  radius: 0,
};

const GOLD = 'var(--osd-accent)';
const GOLD_HI = '#EDD69C';
const GOLD_LO = '#8F6F36';
const IVORY = 'var(--osd-text)';
const MUTED = '#93A196';
const EMERALD = '#163329';
const DEEP = '#08120F';
const LABEL_FONT = '"Josefin Sans", "Futura", "Avenir Next", sans-serif';

const SLIDE_ID = 'aurelian-hotel-reopening';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Josefin+Sans:wght@400;600&family=Poiret+One&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes au-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes au-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes au-rise { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
@keyframes au-spread { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes au-lift { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes au-bloom { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: none } }
@keyframes au-sheen { 0% { background-position: 100% 0, 0 0 } 38%, 100% { background-position: 0% 0, 0 0 } }
@keyframes au-glow { 0%, 100% { opacity: 0.55 } 50% { opacity: 1 } }
@keyframes au-turn { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) { [style*="au-"] { animation: none !important; } }
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
const EASE_DECO = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(5px)' },
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
      { opacity: 0, transform: 'translateY(10px)', filter: 'blur(3px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const play = (
  live: boolean,
  name: string,
  ms: number,
  delay = 0,
  ease = EASE_DECO,
): CSSProperties => (live ? { animation: `${name} ${ms}ms ${ease} ${delay}ms both` } : {});

type DrawProps = { pathLength?: number; strokeDasharray?: string; style?: CSSProperties };

const draw = (live: boolean, ms: number, delay = 0): DrawProps =>
  live
    ? {
        pathLength: 1,
        strokeDasharray: '1',
        style: { animation: `au-draw ${ms}ms ${EASE_DECO} ${delay}ms both` },
      }
    : {};

const rad = (deg: number) => (deg * Math.PI) / 180;
const px = (cx: number, r: number, deg: number) => cx + r * Math.cos(rad(deg));
const py = (cy: number, r: number, deg: number) => cy + r * Math.sin(rad(deg));

const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${px(cx, r, a0).toFixed(2)} ${py(cy, r, a0).toFixed(2)} A${r} ${r} 0 ${large} ${sweep} ${px(cx, r, a1).toFixed(2)} ${py(cy, r, a1).toFixed(2)}`;
};

const sectorD = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) => {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return [
    `M${f(px(cx, r0, a0))} ${f(py(cy, r0, a0))}`,
    `L${f(px(cx, r1, a0))} ${f(py(cy, r1, a0))}`,
    `A${r1} ${r1} 0 ${large} 1 ${f(px(cx, r1, a1))} ${f(py(cy, r1, a1))}`,
    `L${f(px(cx, r0, a1))} ${f(py(cy, r0, a1))}`,
    `A${r0} ${r0} 0 ${large} 0 ${f(px(cx, r0, a0))} ${f(py(cy, r0, a0))}`,
    'Z',
  ].join(' ');
};

const LABEL: CSSProperties = {
  fontFamily: LABEL_FONT,
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: GOLD,
  lineHeight: 1,
};

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 400,
  margin: 0,
  lineHeight: 1,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

const NUM: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 400,
  lineHeight: 1,
  color: GOLD,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'lining-nums',
};

const goldText = (live: boolean, delay = 1800): CSSProperties => ({
  backgroundImage: `linear-gradient(105deg, rgba(255,247,222,0) 42%, rgba(255,247,222,0.92) 50%, rgba(255,247,222,0) 58%), linear-gradient(180deg, ${GOLD_HI} 0%, var(--osd-accent) 55%, ${GOLD_LO} 100%)`,
  backgroundSize: '300% 100%, 100% 100%',
  backgroundPosition: '100% 0, 0 0',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  animation: live ? `au-sheen 9s ease-in-out ${delay}ms infinite` : undefined,
});

const Gem = ({ size = 10, color = GOLD }: { size?: number; color?: string }) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      background: color,
      transform: 'rotate(45deg)',
      verticalAlign: 'middle',
    }}
  />
);

const Divider = ({
  width,
  live,
  delay = 0,
  left,
  top,
}: {
  width: number;
  live: boolean;
  delay?: number;
  left: number;
  top: number;
}) => {
  const h = 20;
  const c = width / 2;
  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      style={abs(left, top, { color: GOLD, overflow: 'visible' })}
    >
      <g
        style={{
          transformBox: 'view-box',
          transformOrigin: `${c}px 10px`,
          ...play(live, 'au-spread', 1300, delay),
        }}
      >
        <line x1={0} y1={10} x2={c - 34} y2={10} stroke="currentColor" strokeWidth={1.2} />
        <line x1={c + 34} y1={10} x2={width} y2={10} stroke="currentColor" strokeWidth={1.2} />
        <line x1={24} y1={15} x2={c - 46} y2={15} stroke="currentColor" strokeOpacity={0.45} />
        <line
          x1={c + 46}
          y1={15}
          x2={width - 24}
          y2={15}
          stroke="currentColor"
          strokeOpacity={0.45}
        />
        <path d={`M${c - 24} 10 l5 -5 l5 5 l-5 5 Z`} fill="currentColor" />
        <path d={`M${c + 14} 10 l5 -5 l5 5 l-5 5 Z`} fill="currentColor" />
      </g>
      <path
        d={`M${c} 1 L${c + 9} 10 L${c} 19 L${c - 9} 10 Z`}
        fill="currentColor"
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          ...play(live, 'au-bloom', 700, delay),
        }}
      />
    </svg>
  );
};

const Sunburst = ({
  cx,
  cy,
  r0,
  r1,
  count,
  from = 180,
  to = 360,
  alt = 0.7,
  live,
  delay = 0,
  opacity = 1,
  width = 1.2,
  stagger = 26,
  ms = 1400,
}: {
  cx: number;
  cy: number;
  r0: number;
  r1: number;
  count: number;
  from?: number;
  to?: number;
  alt?: number;
  live: boolean;
  delay?: number;
  opacity?: number;
  width?: number;
  stagger?: number;
  ms?: number;
}) => {
  const rays: ReactNode[] = [];
  const mid = (count - 1) / 2;
  for (let i = 0; i < count; i++) {
    const a = from + ((to - from) * i) / Math.max(1, count - 1);
    const rEnd = i % 2 === 0 ? r1 : r0 + (r1 - r0) * alt;
    rays.push(
      <line
        key={i}
        x1={px(cx, r0, a)}
        y1={py(cy, r0, a)}
        x2={px(cx, rEnd, a)}
        y2={py(cy, rEnd, a)}
        stroke="currentColor"
        strokeWidth={i % 2 === 0 ? width : width * 0.7}
        {...draw(live, ms, delay + Math.abs(i - mid) * stagger)}
      />,
    );
  }
  return <g opacity={opacity}>{rays}</g>;
};

const Arch = ({
  cx,
  cy,
  r,
  foot,
  live,
  delay = 0,
  width = 1.2,
  opacity = 1,
  ms = 1500,
}: {
  cx: number;
  cy: number;
  r: number;
  foot?: number;
  live: boolean;
  delay?: number;
  width?: number;
  opacity?: number;
  ms?: number;
}) => {
  const leg = foot ? ` V${foot}` : '';
  return (
    <g fill="none" stroke="currentColor" strokeWidth={width} strokeOpacity={opacity}>
      <path
        d={`M${cx} ${cy - r} A${r} ${r} 0 0 0 ${cx - r} ${cy}${leg}`}
        {...draw(live, ms, delay)}
      />
      <path
        d={`M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx + r} ${cy}${leg}`}
        {...draw(live, ms, delay)}
      />
    </g>
  );
};

const Corner = ({ transform }: { transform?: string }) => {
  const rays: ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const a = i * 22.5;
    rays.push(
      <line
        key={i}
        x1={px(52, 8, a)}
        y1={py(52, 8, a)}
        x2={px(52, i % 2 === 0 ? 26 : 20, a)}
        y2={py(52, i % 2 === 0 ? 26 : 20, a)}
        stroke="currentColor"
        strokeWidth={1}
      />,
    );
  }
  return (
    <g transform={transform} fill="none" stroke="currentColor">
      <path d="M68 250 V112 H90 V90 H112 V68 H250" strokeWidth={1.4} />
      <path d="M78 180 V122 H100 V100 H122 V78 H180" strokeWidth={1} strokeOpacity={0.5} />
      <path d="M52 82 A30 30 0 0 0 82 52" strokeWidth={1.2} />
      <path d="M52 92 A40 40 0 0 0 92 52" strokeWidth={1} strokeOpacity={0.55} />
      {rays}
      <path d="M250 63 L255 68 L250 73 L245 68 Z" fill="currentColor" stroke="none" />
      <path d="M68 245 L73 250 L68 255 L63 250 Z" fill="currentColor" stroke="none" />
    </g>
  );
};

const Frame = ({ live, drawn }: { live: boolean; drawn?: boolean }) => {
  const animate = live && !!drawn;
  return (
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={abs(0, 0, { color: GOLD, pointerEvents: 'none', zIndex: 3 })}
    >
      <g fill="none" stroke="currentColor">
        <path d="M960 40 H40 V1040 H960" strokeWidth={1.4} {...draw(animate, 2200, 0)} />
        <path d="M960 40 H1880 V1040 H960" strokeWidth={1.4} {...draw(animate, 2200, 0)} />
        <path
          d="M960 52 H52 V1028 H960"
          strokeWidth={0.8}
          strokeOpacity={0.55}
          {...draw(animate, 2200, 200)}
        />
        <path
          d="M960 52 H1868 V1028 H960"
          strokeWidth={0.8}
          strokeOpacity={0.55}
          {...draw(animate, 2200, 200)}
        />
      </g>
      <g style={play(animate, 'au-fade', 1200, 1400)}>
        <Corner />
        <Corner transform="translate(1920 0) scale(-1 1)" />
        <Corner transform="translate(0 1080) scale(1 -1)" />
        <Corner transform="translate(1920 1080) scale(-1 -1)" />
        <path d="M940 52 A20 20 0 0 0 980 52" fill="none" stroke="currentColor" strokeWidth={1.2} />
        <path
          d="M932 52 A28 28 0 0 0 988 52"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.5}
        />
        <path d="M960 40 L966 46 L960 52 L954 46 Z" fill="currentColor" />
      </g>
    </svg>
  );
};

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <svg
        width={96}
        height={64}
        viewBox="0 0 96 64"
        style={abs(912, 1002, { color: GOLD, zIndex: 4 })}
      >
        <path
          d="M48 2 L94 32 L48 62 L2 32 Z"
          fill="var(--osd-bg)"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        <path
          d="M48 9 L83 32 L48 55 L13 32 Z"
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.45}
        />
      </svg>
      <div
        style={abs(912, 1022, {
          width: 96,
          textAlign: 'center',
          fontFamily: LABEL_FONT,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: GOLD,
          lineHeight: '24px',
          zIndex: 5,
        })}
      >
        {String(current).padStart(2, '0')}
      </div>
      <div style={abs(276, 1003, { ...LABEL, fontSize: 18, color: MUTED, zIndex: 4 })}>
        The Aurelian <Gem size={6} color={GOLD} /> MCMXXIX
      </div>
      <div
        style={abs(1144, 1003, {
          ...LABEL,
          fontSize: 18,
          color: MUTED,
          width: 500,
          textAlign: 'right',
          zIndex: 4,
        })}
      >
        Folio {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </>
  );
};

const Stage = ({
  children,
  live,
  drawn,
  footer = true,
}: {
  children: ReactNode;
  live: boolean;
  drawn?: boolean;
  footer?: boolean;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background:
        'radial-gradient(ellipse 62% 55% at 50% 50%, rgba(36,78,62,0.42) 0%, rgba(14,28,24,0) 72%), radial-gradient(ellipse 110% 95% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%), var(--osd-bg)',
      color: IVORY,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(201,164,92,0.03) 0 1px, rgba(0,0,0,0) 1px 48px)',
        pointerEvents: 'none',
      }}
    />
    {children}
    <Frame live={live} drawn={drawn} />
    {footer && <Footer />}
  </div>
);

const Head = ({
  numeral,
  eyebrow,
  title,
  sub,
  live,
}: {
  numeral: string;
  eyebrow: string;
  title: string;
  sub?: string;
  live: boolean;
}) => (
  <>
    <div
      style={abs(0, 118, {
        ...LABEL,
        width: 1920,
        textAlign: 'center',
        ...play(live, 'au-fade', 900, 0),
      })}
    >
      {numeral}
      <span style={{ margin: '0 22px' }}>
        <Gem size={7} />
      </span>
      {eyebrow}
    </div>
    <h2
      style={abs(0, 156, {
        ...DISPLAY,
        width: 1920,
        textAlign: 'center',
        fontSize: 84,
        color: IVORY,
        ...play(live, 'au-rise', 1100, 120),
      })}
    >
      {title}
    </h2>
    <Divider left={630} top={262} width={660} live={live} delay={350} />
    {sub && (
      <p
        style={abs(260, 296, {
          width: 1400,
          margin: 0,
          textAlign: 'center',
          fontSize: 34,
          fontStyle: 'italic',
          lineHeight: 1.3,
          color: MUTED,
          ...play(live, 'au-fade', 1000, 600),
        })}
      >
        {sub}
      </p>
    )}
  </>
);

const Crest = ({ left, top, live }: { left: number; top: number; live: boolean }) => (
  <svg width={220} height={110} viewBox="0 0 220 110" style={abs(left, top, { color: GOLD })}>
    <path
      d="M10 104 H210 V88 H188 V72 H166 V56 H144 V40 H76 V56 H54 V72 H32 V88 H10 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      {...draw(live, 1600, 200)}
    />
    <path
      d="M24 98 H196 M44 82 H176 M66 66 H154 M88 50 H132"
      stroke="currentColor"
      strokeOpacity={0.45}
      {...draw(live, 1400, 500)}
    />
    <Sunburst
      cx={110}
      cy={40}
      r0={8}
      r1={36}
      count={11}
      live={live}
      delay={900}
      ms={900}
      stagger={40}
    />
    <path d="M110 30 L116 36 L110 42 L104 36 Z" fill="currentColor" />
  </svg>
);

const RisingSun = ({ live }: { live: boolean }) => {
  const cx = 960;
  const cy = 1000;
  const stripes: ReactNode[] = [];
  for (let k = 0; k < 7; k++) {
    const dy = 12 + k * 20;
    const hw = Math.sqrt(150 * 150 - dy * dy);
    stripes.push(
      <line
        key={k}
        x1={cx - hw}
        x2={cx + hw}
        y1={cy - dy}
        y2={cy - dy}
        stroke="currentColor"
        strokeOpacity={0.55}
        strokeWidth={1}
      />,
    );
  }
  return (
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
    >
      <Sunburst
        cx={cx}
        cy={cy}
        r0={440}
        r1={1180}
        count={45}
        live={live}
        opacity={0.13}
        delay={300}
        stagger={30}
        ms={1800}
      />
      <Arch cx={cx} cy={cy} r={172} live={live} delay={200} width={1.4} />
      <Arch cx={cx} cy={cy} r={196} live={live} delay={350} width={1} opacity={0.7} />
      <Arch cx={cx} cy={cy} r={210} live={live} delay={500} width={0.8} opacity={0.45} />
      <Sunburst
        cx={cx}
        cy={cy}
        r0={228}
        r1={400}
        count={29}
        alt={0.62}
        live={live}
        opacity={0.8}
        delay={500}
        stagger={32}
      />
      <path
        d={`M${cx - 150} ${cy} A150 150 0 0 1 ${cx + 150} ${cy} Z`}
        fill="currentColor"
        fillOpacity={0.1}
        style={play(live, 'au-fade', 1400, 200)}
      />
      <g style={play(live, 'au-fade', 1400, 400)}>{stripes}</g>
      <line
        x1={460}
        x2={1460}
        y1={cy}
        y2={cy}
        stroke="currentColor"
        strokeWidth={1.2}
        style={{
          transformBox: 'view-box',
          transformOrigin: `${cx}px ${cy}px`,
          ...play(live, 'au-spread', 1600, 0),
        }}
      />
    </svg>
  );
};

const Cover: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live} drawn footer={false}>
      <RisingSun live={live} />
      <div
        style={abs(0, 104, {
          ...LABEL,
          width: 1920,
          textAlign: 'center',
          ...play(live, 'au-fade', 1200, 300),
        })}
      >
        Est. MCMXXIX{' '}
        <span style={{ margin: '0 20px' }}>
          <Gem size={7} />
        </span>{' '}
        Michigan Avenue, Chicago
      </div>
      <Crest left={850} top={150} live={live} />
      <h1
        style={abs(0, 282, {
          ...DISPLAY,
          width: 1920,
          textAlign: 'center',
          fontSize: 'var(--osd-size-hero)',
          letterSpacing: '0.1em',
          paddingLeft: '0.1em',
          ...goldText(live, 2200),
          ...play(live, 'au-rise', 1400, 500),
        })}
      >
        The Aurelian
      </h1>
      <Divider left={600} top={466} width={720} live={live} delay={900} />
      <div
        style={abs(0, 502, {
          width: 1920,
          textAlign: 'center',
          fontSize: 62,
          fontStyle: 'italic',
          lineHeight: 1.1,
          color: IVORY,
          ...play(live, 'au-fade', 1400, 1100),
        })}
      >
        1929 — Restored
      </div>
      <div style={abs(120, 950, { ...LABEL, fontSize: 18, ...play(live, 'au-fade', 1200, 1500) })}>
        Investor &amp; Press Preview
      </div>
      <div
        style={abs(1400, 950, {
          ...LABEL,
          fontSize: 18,
          width: 400,
          textAlign: 'right',
          ...play(live, 'au-fade', 1200, 1500),
        })}
      >
        October 2026
      </div>
    </Stage>
  );
};
Cover.transition = settle;

const AXIS_Y = 640;

const Era = ({
  x,
  year,
  title,
  children,
  above,
  final,
  live,
  delay,
}: {
  x: number;
  year: string;
  title: string;
  children: ReactNode;
  above?: boolean;
  final?: boolean;
  live: boolean;
  delay: number;
}) => (
  <>
    <div
      style={abs(x - 200, above ? 372 : 712, {
        width: 400,
        textAlign: 'center',
        ...play(live, 'au-rise', 1000, delay),
      })}
    >
      <div style={{ ...NUM, fontSize: 64, ...(final ? goldText(live, 2600) : {}) }}>{year}</div>
      <div style={{ fontSize: 32, fontWeight: 600, marginTop: 12, lineHeight: 1.15 }}>{title}</div>
      <div style={{ fontSize: 28, lineHeight: 1.3, color: MUTED, marginTop: 8 }}>{children}</div>
    </div>
    <div
      style={abs(x, above ? 588 : 654, {
        width: 1,
        height: 44,
        background: GOLD,
        opacity: 0.7,
        transformOrigin: above ? '50% 100%' : '50% 0%',
        ...play(live, 'au-lift', 700, delay - 200),
      })}
    />
    {final ? (
      <svg
        width={80}
        height={50}
        viewBox="0 0 80 50"
        style={abs(x - 40, AXIS_Y - 40, { color: GOLD })}
      >
        <Sunburst cx={40} cy={40} r0={10} r1={36} count={9} live={live} delay={delay} ms={800} />
        <path d="M40 30 L50 40 L40 50 L30 40 Z" fill="currentColor" />
      </svg>
    ) : (
      <div
        style={abs(x - 9, AXIS_Y - 9, {
          width: 18,
          height: 18,
          border: `1.5px solid ${GOLD}`,
          background: 'var(--osd-bg)',
          transform: 'rotate(45deg)',
          boxSizing: 'border-box',
          ...play(live, 'au-fade', 500, delay - 300),
        })}
      >
        <div style={{ position: 'absolute', inset: 4, background: GOLD }} />
      </div>
    )}
  </>
);

const History: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head
        numeral="I"
        eyebrow="Provenance"
        title="A Grand Dame"
        sub="Ninety-eight years, one address, six chapters."
        live={live}
      />
      <svg
        width={1920}
        height={40}
        viewBox="0 0 1920 40"
        style={abs(0, AXIS_Y - 20, { color: GOLD })}
      >
        <g
          style={{
            transformBox: 'view-box',
            transformOrigin: '960px 20px',
            ...play(live, 'au-spread', 1600, 300),
          }}
        >
          <line x1={190} y1={20} x2={1730} y2={20} stroke="currentColor" strokeWidth={1.2} />
          <line x1={210} y1={26} x2={1710} y2={26} stroke="currentColor" strokeOpacity={0.4} />
          <path
            d="M190 20 l-12 -8 M190 20 l-12 8 M1730 20 l12 -8 M1730 20 l12 8"
            stroke="currentColor"
          />
        </g>
      </svg>
      <Era x={320} year="1929" title="Doors open" above live={live} delay={600}>
        Harlan &amp; Vey’s 400-room tower opens on Michigan Avenue.
      </Era>
      <Era x={576} year="1938" title="On the air" live={live} delay={800}>
        Saturday dance broadcasts go out live from the ballroom.
      </Era>
      <Era x={832} year="1962" title="Modernised away" above live={live} delay={1000}>
        Drop ceilings bury the gilded lobby; terrazzo is carpeted.
      </Era>
      <Era x={1088} year="1988" title="Landmarked" live={live} delay={1200}>
        The facade and ballroom gain city landmark protection.
      </Era>
      <Era x={1344} year="2019" title="Lights out" above live={live} delay={1400}>
        The hotel closes after ninety years of continuous service.
      </Era>
      <Era x={1600} year="2027" title="Restored" final live={live} delay={1600}>
        212 keys reopen beneath the relit crown lantern.
      </Era>
    </Stage>
  );
};

const PANEL_W = 460;
const PANEL_H = 570;

const IconTower = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" style={{ color: GOLD }}>
    <g fill="none" stroke="currentColor" strokeWidth={1.4}>
      <path d="M22 132 V78 H36 V58 H50 V40 H90 V58 H104 V78 H118 V132" />
      <path d="M58 40 V26 H82 V40" />
      <path d="M12 132 H128" />
      <path d="M46 78 V132 M58 58 V132 M70 40 V132 M82 58 V132 M94 78 V132" strokeOpacity={0.5} />
    </g>
    <Sunburst cx={70} cy={24} r0={6} r1={22} count={9} live={false} />
  </svg>
);

const IconMedallion = () => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = -90 + i * 22.5;
    const r = i % 2 === 0 ? 52 : 22;
    pts.push(`${px(70, r, a).toFixed(1)},${py(70, r, a).toFixed(1)}`);
  }
  return (
    <svg width={140} height={140} viewBox="0 0 140 140" style={{ color: GOLD }}>
      <g fill="none" stroke="currentColor">
        <circle cx={70} cy={70} r={64} strokeWidth={1.4} />
        <circle cx={70} cy={70} r={58} strokeOpacity={0.5} />
        <polygon points={pts.join(' ')} strokeWidth={1.2} fill="currentColor" fillOpacity={0.15} />
        <circle cx={70} cy={70} r={10} fill="currentColor" />
      </g>
    </svg>
  );
};

const IconChandelier = () => (
  <svg width={140} height={140} viewBox="0 0 140 140" style={{ color: GOLD }}>
    <g fill="none" stroke="currentColor" strokeWidth={1.3}>
      <path d="M70 4 V30" />
      <path d="M50 30 H90 L80 44 H60 Z" />
      <path d="M30 52 H110 L94 74 H46 Z" />
      <path d="M46 84 H94 L80 104 H60 Z" />
      <path
        d="M36 56 V70 M48 74 V92 M60 74 V96 M70 74 V100 M80 74 V96 M92 74 V92 M104 56 V70"
        strokeOpacity={0.55}
      />
      <path d="M70 104 V118" />
    </g>
    <path d="M70 116 L76 124 L70 132 L64 124 Z" fill="currentColor" />
  </svg>
);

const PanelStat = ({ value, children }: { value: string; children: ReactNode }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ ...NUM, fontSize: 50 }}>{value}</div>
    <div
      style={{ fontSize: 28, fontStyle: 'italic', lineHeight: 1.25, color: IVORY, marginTop: 6 }}
    >
      {children}
    </div>
  </div>
);

const ArchPanel = ({
  left,
  name,
  icon,
  children,
}: {
  left: number;
  name: string;
  icon: ReactNode;
  children: ReactNode;
}) => {
  const R = PANEL_W / 2;
  const outer = `M1 ${PANEL_H - 1} V${R} A${R - 1} ${R - 1} 0 0 1 ${PANEL_W - 1} ${R} V${PANEL_H - 1} Z`;
  const inner = `M13 ${PANEL_H - 13} V${R} A${R - 13} ${R - 13} 0 0 1 ${PANEL_W - 13} ${R} V${PANEL_H - 13} Z`;
  return (
    <div style={abs(left, 372, { width: PANEL_W, height: PANEL_H })}>
      <svg
        width={PANEL_W}
        height={PANEL_H}
        viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
        style={abs(0, 0, { color: GOLD })}
      >
        <path d={outer} fill={EMERALD} fillOpacity={0.55} stroke="currentColor" strokeWidth={1.4} />
        <path d={inner} fill="none" stroke="currentColor" strokeOpacity={0.45} />
      </svg>
      <div style={abs(160, 64, { width: 140, height: 140 })}>{icon}</div>
      <div
        style={abs(0, 232, {
          ...DISPLAY,
          width: PANEL_W,
          textAlign: 'center',
          fontSize: 50,
          color: IVORY,
        })}
      >
        {name}
      </div>
      <Divider left={130} top={302} width={200} live={false} />
      <div
        style={abs(30, 344, {
          width: PANEL_W - 60,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        })}
      >
        {children}
      </div>
    </div>
  );
};

const Scope: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head
        numeral="II"
        eyebrow="The Restoration"
        title="What We Restored"
        sub="Everything a guest sees was restored, not replicated."
        live={live}
      />
      <div style={abs(0, 0, { width: 1920, height: 1080 })}>
        <Steps>
          <Step duration={500}>
            <ArchPanel left={190} name="The Facade" icon={<IconTower />}>
              <PanelStat value="4,180">terracotta blocks recast</PanelStat>
              <PanelStat value="312">steel windows repaired</PanelStat>
            </ArchPanel>
          </Step>
          <Step duration={500}>
            <ArchPanel left={730} name="The Lobby" icon={<IconMedallion />}>
              <PanelStat value="14 kg">of gold leaf, laid by hand</PanelStat>
              <PanelStat value="2,600">sq ft of terrazzo uncovered</PanelStat>
            </ArchPanel>
          </Step>
          <Step duration={500}>
            <ArchPanel left={1270} name="The Ballroom" icon={<IconChandelier />}>
              <PanelStat value="7,400">sq ft under a 32-ft vault</PanelStat>
              <PanelStat value="11">chandeliers re-crystalled</PanelStat>
            </ArchPanel>
          </Step>
        </Steps>
      </div>
    </Stage>
  );
};

const FX = 675;
const FY = 340;
const FS = 0.95;

const FacadeElevation = ({ live }: { live: boolean }) => {
  const shaftPiers: ReactNode[] = [];
  const shaftWindows: ReactNode[] = [];
  for (let x = 60; x <= 540; x += 40) {
    shaftPiers.push(<line key={x} x1={x} y1={260} x2={x} y2={500} />);
  }
  for (let x = 60; x < 540; x += 40) {
    for (let y = 272; y < 490; y += 30) {
      shaftWindows.push(<rect key={`${x}-${y}`} x={x + 12} y={y} width={16} height={18} />);
    }
  }
  const midPiers: ReactNode[] = [];
  const midWindows: ReactNode[] = [];
  for (let x = 120; x <= 480; x += 40) {
    midPiers.push(<line key={x} x1={x} y1={170} x2={x} y2={260} />);
  }
  for (let x = 120; x < 480; x += 40) {
    for (let y = 182; y < 250; y += 26) {
      midWindows.push(<rect key={`${x}-${y}`} x={x + 12} y={y} width={16} height={16} />);
    }
  }
  const topPiers: ReactNode[] = [];
  const topWindows: ReactNode[] = [];
  for (let x = 180; x <= 420; x += 40) {
    topPiers.push(<line key={x} x1={x} y1={100} x2={x} y2={170} />);
  }
  for (let x = 180; x < 420; x += 40) {
    for (let y = 112; y < 162; y += 26) {
      topWindows.push(<rect key={`${x}-${y}`} x={x + 13} y={y} width={14} height={14} />);
    }
  }
  const rustication: ReactNode[] = [];
  for (let y = 516; y < 620; y += 16) {
    rustication.push(<line key={y} x1={40} y1={y} x2={560} y2={y} />);
  }
  let chevron = 'M40 500';
  for (let x = 40; x < 560; x += 20) chevron += ` L${x + 10} 492 L${x + 20} 500`;
  const arched = (cx: number, w: number, h: number) =>
    `M${cx - w / 2} 620 V${620 - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${620 - h + w / 2} V620`;
  return (
    <svg
      width={600 * FS}
      height={640 * FS}
      viewBox="0 0 600 640"
      style={abs(FX, FY, { color: GOLD, overflow: 'visible' })}
    >
      <g style={play(live, 'au-rise', 1100, 200)}>
        <rect
          x={40}
          y={500}
          width={520}
          height={120}
          fill={DEEP}
          stroke="currentColor"
          strokeWidth={1.6}
        />
        <g stroke="currentColor" strokeOpacity={0.28}>
          {rustication}
        </g>
        <g fill={DEEP} stroke="currentColor" strokeWidth={1.3}>
          <path d={arched(110, 46, 84)} />
          <path d={arched(200, 46, 84)} />
          <path d={arched(300, 72, 104)} />
          <path d={arched(400, 46, 84)} />
          <path d={arched(490, 46, 84)} />
        </g>
        <Sunburst cx={300} cy={552} r0={6} r1={32} count={9} live={false} opacity={0.8} />
        <path d={chevron} fill="none" stroke="currentColor" strokeWidth={1.2} />
      </g>
      <g style={play(live, 'au-rise', 1100, 500)}>
        <rect
          x={60}
          y={260}
          width={480}
          height={232}
          fill={EMERALD}
          fillOpacity={0.6}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <g stroke="currentColor" strokeOpacity={0.55}>
          {shaftPiers}
        </g>
        <g fill="currentColor" fillOpacity={0.2}>
          {shaftWindows}
        </g>
      </g>
      <g style={play(live, 'au-rise', 1100, 800)}>
        <rect
          x={120}
          y={170}
          width={360}
          height={90}
          fill={EMERALD}
          fillOpacity={0.6}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <g stroke="currentColor" strokeOpacity={0.55}>
          {midPiers}
        </g>
        <g fill="currentColor" fillOpacity={0.24}>
          {midWindows}
        </g>
      </g>
      <g style={play(live, 'au-rise', 1100, 1100)}>
        <rect
          x={180}
          y={100}
          width={240}
          height={70}
          fill={EMERALD}
          fillOpacity={0.6}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <g stroke="currentColor" strokeOpacity={0.55}>
          {topPiers}
        </g>
        <g fill="currentColor" fillOpacity={0.28}>
          {topWindows}
        </g>
        <path
          d="M220 100 V84 H240 V70 H264 V58 H336 V70 H360 V84 H380 V100"
          fill={DEEP}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <rect
          x={284}
          y={26}
          width={32}
          height={32}
          fill="currentColor"
          fillOpacity={0.35}
          stroke="currentColor"
        />
        <path d="M284 26 L300 6 L316 26" fill="none" stroke="currentColor" strokeWidth={1.4} />
      </g>
      <circle
        cx={300}
        cy={42}
        r={46}
        fill={GOLD_HI}
        fillOpacity={0.16}
        style={live ? { animation: 'au-glow 4.5s ease-in-out 2s infinite' } : undefined}
      />
      <Sunburst
        cx={300}
        cy={42}
        r0={30}
        r1={78}
        count={15}
        from={200}
        to={340}
        live={live}
        delay={1500}
        opacity={0.75}
      />
      <line x1={0} y1={620} x2={600} y2={620} stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
};

const Callout = ({
  left,
  top,
  align,
  value,
  children,
  live,
  delay,
}: {
  left: number;
  top: number;
  align: 'left' | 'right';
  value: string;
  children: ReactNode;
  live: boolean;
  delay: number;
}) => (
  <div
    style={abs(left, top, { width: 440, textAlign: align, ...play(live, 'au-fade', 1000, delay) })}
  >
    <div style={{ ...NUM, fontSize: 64 }}>{value}</div>
    <div style={{ fontSize: 30, lineHeight: 1.3, marginTop: 10, color: IVORY }}>{children}</div>
  </div>
);

const Leader = ({
  d,
  tx,
  ty,
  live,
  delay,
}: {
  d: string;
  tx: number;
  ty: number;
  live: boolean;
  delay: number;
}) => (
  <g>
    <path d={d} fill="none" stroke="currentColor" strokeWidth={1} {...draw(live, 900, delay)} />
    <circle
      cx={tx}
      cy={ty}
      r={5}
      fill="var(--osd-bg)"
      stroke="currentColor"
      strokeWidth={1.4}
      style={play(live, 'au-fade', 400, delay + 700)}
    />
    <circle
      cx={tx}
      cy={ty}
      r={2}
      fill="currentColor"
      style={play(live, 'au-fade', 400, delay + 700)}
    />
  </g>
);

const Facade: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head numeral="III" eyebrow="The Exterior" title="The Facade" live={live} />
      <FacadeElevation live={live} />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
      >
        <Leader d="M606 472 H676 L741 606" tx={741} ty={606} live={live} delay={1500} />
        <Leader d="M606 762 H660 L722 872" tx={722} ty={872} live={live} delay={1700} />
        <Leader d="M1314 402 H1040 L976 378" tx={976} ty={378} live={live} delay={1900} />
        <Leader d="M1314 682 H1230 L1170 702" tx={1170} ty={702} live={live} delay={2100} />
      </svg>
      <Callout left={160} top={430} align="right" value="4,180" live={live} delay={1600}>
        terracotta blocks recast in the original 1929 glaze
      </Callout>
      <Callout left={160} top={720} align="right" value="26,000" live={live} delay={1800}>
        sq ft of limestone base, cleaned by hand-laid poultice
      </Callout>
      <Callout left={1320} top={360} align="left" value="1,140" live={live} delay={2000}>
        lamps relight the crown lantern behind its first glass
      </Callout>
      <Callout left={1320} top={640} align="left" value="312" live={live} delay={2200}>
        steel windows repaired in place — none replaced
      </Callout>
    </Stage>
  );
};

const Medallion = ({ live }: { live: boolean }) => {
  const C = 320;
  const kites: ReactNode[] = [];
  for (let k = 0; k < 16; k++) {
    const a = -90 + k * 22.5;
    const d = [
      `M${px(C, 100, a)} ${py(C, 100, a)}`,
      `L${px(C, 132, a - 11.25)} ${py(C, 132, a - 11.25)}`,
      `L${px(C, 238, a)} ${py(C, 238, a)}`,
      `L${px(C, 132, a + 11.25)} ${py(C, 132, a + 11.25)}`,
      'Z',
    ].join(' ');
    kites.push(
      <path
        key={k}
        d={d}
        fill="currentColor"
        fillOpacity={k % 2 === 0 ? 0.34 : 0.12}
        stroke="currentColor"
        strokeWidth={1}
        style={play(live, 'au-fade', 700, 500 + k * 70)}
      />,
    );
  }
  const minor: ReactNode[] = [];
  for (let k = 0; k < 16; k++) {
    const a = -90 + 11.25 + k * 22.5;
    const d = [
      `M${px(C, 140, a)} ${py(C, 140, a)}`,
      `L${px(C, 162, a - 5)} ${py(C, 162, a - 5)}`,
      `L${px(C, 212, a)} ${py(C, 212, a)}`,
      `L${px(C, 162, a + 5)} ${py(C, 162, a + 5)}`,
      'Z',
    ].join(' ');
    minor.push(<path key={k} d={d} fill="#1E4538" stroke="currentColor" strokeOpacity={0.5} />);
  }
  let zig = '';
  for (let k = 0; k <= 96; k++) {
    const a = -90 + k * 3.75;
    const r = k % 2 === 0 ? 268 : 292;
    zig += `${k === 0 ? 'M' : 'L'}${px(C, r, a).toFixed(1)} ${py(C, r, a).toFixed(1)} `;
  }
  const star: string[] = [];
  for (let k = 0; k < 16; k++) {
    const a = -90 + k * 22.5;
    star.push(
      `${px(C, k % 2 === 0 ? 84 : 40, a).toFixed(1)},${py(C, k % 2 === 0 ? 84 : 40, a).toFixed(1)}`,
    );
  }
  return (
    <svg width={600} height={600} viewBox="0 0 640 640" style={abs(320, 344, { color: GOLD })}>
      <circle cx={C} cy={C} r={310} fill={EMERALD} fillOpacity={0.5} />
      <g fill="none" stroke="currentColor">
        <circle cx={C} cy={C} r={310} strokeWidth={1.6} {...draw(live, 1800, 0)} />
        <circle cx={C} cy={C} r={300} strokeOpacity={0.5} {...draw(live, 1800, 150)} />
        <circle cx={C} cy={C} r={260} strokeWidth={1.3} {...draw(live, 1800, 300)} />
        <circle cx={C} cy={C} r={250} strokeOpacity={0.5} {...draw(live, 1800, 450)} />
      </g>
      <g
        style={{
          transformBox: 'view-box',
          transformOrigin: `${C}px ${C}px`,
          ...(live ? { animation: 'au-turn 180s linear 0s infinite' } : {}),
        }}
      >
        <path
          d={zig}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.1}
          {...draw(live, 2200, 300)}
        />
      </g>
      {minor}
      {kites}
      <circle cx={C} cy={C} r={100} fill={DEEP} stroke="currentColor" strokeWidth={1.3} />
      <circle cx={C} cy={C} r={92} fill="none" stroke="currentColor" strokeOpacity={0.5} />
      <polygon
        points={star.join(' ')}
        fill="currentColor"
        style={play(live, 'au-bloom', 900, 1500)}
      />
      <circle cx={C} cy={C} r={30} fill={DEEP} stroke="currentColor" />
      <text
        x={C}
        y={C + 14}
        textAnchor="middle"
        fontSize={40}
        fill="currentColor"
        style={{ fontFamily: 'var(--osd-font-display)' }}
      >
        A
      </text>
    </svg>
  );
};

const LobbyStat = ({
  top,
  value,
  children,
  live,
  delay,
}: {
  top: number;
  value: string;
  children: ReactNode;
  live: boolean;
  delay: number;
}) => (
  <div
    style={abs(1040, top, {
      width: 740,
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      ...play(live, 'au-rise', 900, delay),
    })}
  >
    <div style={{ ...NUM, fontSize: 56, width: 230, textAlign: 'right' }}>{value}</div>
    <div style={{ width: 1, height: 64, background: GOLD, opacity: 0.6 }} />
    <div style={{ fontSize: 30, lineHeight: 1.2, width: 440 }}>{children}</div>
  </div>
);

const Lobby: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Medallion live={live} />
      <div style={abs(1040, 300, { ...LABEL, ...play(live, 'au-fade', 900, 0) })}>
        IV{' '}
        <span style={{ margin: '0 18px' }}>
          <Gem size={7} />
        </span>{' '}
        The Interior
      </div>
      <h2
        style={abs(1036, 340, {
          ...DISPLAY,
          fontSize: 100,
          color: IVORY,
          ...play(live, 'au-rise', 1100, 150),
        })}
      >
        The Lobby
      </h2>
      <div
        style={abs(1040, 470, {
          width: 420,
          height: 1,
          background: GOLD,
          transformOrigin: '0 50%',
          ...play(live, 'au-spread', 1200, 400),
        })}
      />
      <div style={abs(1040, 478, { width: 300, height: 1, background: GOLD, opacity: 0.4 })} />
      <p
        style={abs(1040, 506, {
          width: 740,
          margin: 0,
          fontSize: 34,
          fontStyle: 'italic',
          lineHeight: 1.35,
          color: MUTED,
          ...play(live, 'au-fade', 1000, 600),
        })}
      >
        Hidden for sixty years under a drop ceiling — and exactly as the 1929 drawings promised.
      </p>
      <LobbyStat top={640} value="14 kg" live={live} delay={900}>
        of 23-carat gold leaf
        <br />
        on the coffered ceiling
      </LobbyStat>
      <LobbyStat top={736} value="2,600" live={live} delay={1100}>
        sq ft of terrazzo, freed
        <br />
        from its 1962 carpet
      </LobbyStat>
      <LobbyStat top={832} value="9" live={live} delay={1300}>
        bronze elevator doors,
        <br />
        every one a 1929 original
      </LobbyStat>
    </Stage>
  );
};

const TIER_MAX = 720;
const TIER_H = 86;

const RoomTier = ({
  row,
  count,
  name,
  spec,
  live,
}: {
  row: number;
  count: number;
  name: string;
  spec: string;
  live: boolean;
}) => {
  const top = 388 + row * (TIER_H + 14);
  const w = Math.max(14, (count / 118) * TIER_MAX);
  const delay = 500 + (4 - row) * 220;
  return (
    <>
      <div
        style={abs(140, top + TIER_H / 2 - 22, {
          width: 400,
          textAlign: 'right',
          fontSize: 36,
          fontWeight: 500,
          lineHeight: 1.2,
          ...play(live, 'au-fade', 900, delay + 300),
        })}
      >
        {name}
      </div>
      <div
        style={abs(960 - w / 2, top, {
          width: w,
          height: TIER_H,
          background: `repeating-linear-gradient(90deg, rgba(8,18,15,0.16) 0 1px, rgba(0,0,0,0) 1px 12px), linear-gradient(180deg, ${GOLD_HI} 0%, var(--osd-accent) 48%, ${GOLD_LO} 100%)`,
          boxShadow: `inset 0 0 0 1px rgba(255,240,200,0.35), inset 0 -10px 0 rgba(8,18,15,0.22)`,
          transformOrigin: '50% 50%',
          ...play(live, 'au-spread', 1100, delay),
        })}
      />
      <div
        style={abs(1380, top + TIER_H / 2 - 26, {
          width: 420,
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          ...play(live, 'au-fade', 900, delay + 300),
        })}
      >
        <span style={{ ...NUM, fontSize: 52, minWidth: 92 }}>{count}</span>
        <span style={{ fontSize: 28, color: MUTED }}>{spec}</span>
      </div>
    </>
  );
};

const Rooms: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head
        numeral="V"
        eyebrow="Rooms & Suites"
        title="212 Keys, Once 400"
        sub="Rooms were joined two-into-one; the average key is now 451 sq ft."
        live={live}
      />
      <RoomTier
        row={0}
        count={2}
        name="Aurelian Penthouse"
        spec="2,400 sq ft · $4,800"
        live={live}
      />
      <RoomTier row={1} count={12} name="Signature Suites" spec="960 sq ft · $1,650" live={live} />
      <RoomTier row={2} count={28} name="Junior Suites" spec="620 sq ft · $890" live={live} />
      <RoomTier row={3} count={52} name="Deluxe Doubles" spec="420 sq ft · $560" live={live} />
      <RoomTier row={4} count={118} name="Classic Kings" spec="340 sq ft · $465" live={live} />
      <div
        style={abs(1380, 896, {
          ...LABEL,
          fontSize: 18,
          color: MUTED,
          ...play(live, 'au-fade', 900, 1800),
        })}
      >
        Keys · size · opening rate
      </div>
      <div
        style={abs(140, 896, {
          ...LABEL,
          fontSize: 18,
          color: MUTED,
          width: 400,
          textAlign: 'right',
          ...play(live, 'au-fade', 900, 1800),
        })}
      >
        Tier width ∝ keys
      </div>
    </Stage>
  );
};

const BallroomScene = ({ live }: { live: boolean }) => {
  const cx = 960;
  const cy = 690;
  const floor: ReactNode[] = [];
  for (let xb = 760; xb <= 1160; xb += 40) {
    const xt = cx + (xb - cx) * ((860 - cy) / (930 - cy));
    floor.push(<line key={xb} x1={xb} y1={930} x2={xt} y2={860} />);
  }
  const drops: ReactNode[] = [];
  for (let x = 908; x <= 1012; x += 8) {
    const len = 18 + 26 * Math.cos(((x - 960) / 60) * (Math.PI / 2)) ** 2;
    drops.push(<line key={x} x1={x} y1={560} x2={x} y2={560 + len} />);
  }
  const drops2: ReactNode[] = [];
  for (let x = 930; x <= 990; x += 8) {
    const len = 12 + 18 * Math.cos(((x - 960) / 36) * (Math.PI / 2)) ** 2;
    drops2.push(<line key={x} x1={x} y1={636} x2={x} y2={636 + len} />);
  }
  return (
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
    >
      <path
        d="M640 930 V540 H662 V470 H700 V410 H760 V372 H1160 V410 H1220 V470 H1258 V540 H1280 V930"
        fill={EMERALD}
        fillOpacity={0.35}
        stroke="currentColor"
        strokeWidth={1.5}
        {...draw(live, 2000, 0)}
      />
      <path
        d="M652 930 V550 H674 V480 H712 V420 H772 V384 H1148 V420 H1208 V480 H1246 V550 H1268 V930"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.4}
        {...draw(live, 2000, 150)}
      />
      <Arch cx={cx} cy={cy} r={290} foot={930} live={live} delay={300} width={1.5} />
      <Arch cx={cx} cy={cy} r={262} foot={930} live={live} delay={450} opacity={0.7} />
      <Arch cx={cx} cy={cy} r={234} foot={930} live={live} delay={600} opacity={0.5} />
      <Arch cx={cx} cy={cy} r={206} foot={930} live={live} delay={750} width={1.4} />
      <path
        d={`M${cx - 206} 930 V${cy} A206 206 0 0 1 ${cx + 206} ${cy} V930 Z`}
        fill={DEEP}
        fillOpacity={0.55}
        style={play(live, 'au-fade', 1200, 600)}
      />
      <Sunburst
        cx={cx}
        cy={cy}
        r0={210}
        r1={232}
        count={33}
        from={180}
        to={360}
        alt={0.5}
        live={live}
        delay={900}
        opacity={0.6}
        stagger={18}
        ms={900}
      />
      <g stroke="currentColor" strokeOpacity={0.45} style={play(live, 'au-fade', 1200, 1200)}>
        {floor}
        <line x1={754} y1={860} x2={1166} y2={860} />
        <line x1={754} y1={884} x2={1166} y2={884} />
        <line x1={754} y1={907} x2={1166} y2={907} />
      </g>
      <g style={play(live, 'au-fade', 1400, 1300)}>
        <path d="M830 860 A130 130 0 0 1 1090 860 Z" fill={DEEP} fillOpacity={0.8} />
        <Arch cx={cx} cy={860} r={130} live={false} width={1.3} />
        <Arch cx={cx} cy={860} r={100} live={false} opacity={0.6} />
        <Arch cx={cx} cy={860} r={70} live={false} opacity={0.45} />
        <Sunburst cx={cx} cy={860} r0={74} r1={96} count={19} live={false} opacity={0.5} />
        <rect
          x={950}
          y={776}
          width={20}
          height={32}
          rx={9}
          fill={DEEP}
          stroke="currentColor"
          strokeWidth={1.3}
        />
        <path
          d="M953 786 H967 M953 792 H967 M953 798 H967"
          stroke="currentColor"
          strokeOpacity={0.6}
        />
        <path d="M960 808 V858 M946 858 H974" stroke="currentColor" strokeWidth={1.3} />
      </g>
      <line x1={600} y1={930} x2={1320} y2={930} stroke="currentColor" strokeWidth={1.6} />
      <g style={play(live, 'au-fade', 1400, 1100)}>
        <line x1={cx} y1={484} x2={cx} y2={528} stroke="currentColor" strokeWidth={1.2} />
        <path
          d="M932 528 H988 L976 542 H944 Z"
          fill="currentColor"
          fillOpacity={0.5}
          stroke="currentColor"
        />
        <path
          d="M898 548 H1022 L1000 576 H920 Z"
          fill="currentColor"
          fillOpacity={0.3}
          stroke="currentColor"
          strokeWidth={1.2}
        />
        <g stroke={GOLD_HI} strokeOpacity={0.75}>
          {drops}
        </g>
        <path
          d="M920 618 H1000 L986 642 H934 Z"
          fill="currentColor"
          fillOpacity={0.3}
          stroke="currentColor"
          strokeWidth={1.2}
        />
        <g stroke={GOLD_HI} strokeOpacity={0.75}>
          {drops2}
        </g>
        <path d="M960 664 L968 676 L960 688 L952 676 Z" fill="currentColor" />
      </g>
    </svg>
  );
};

const BallStat = ({
  left,
  top,
  align,
  value,
  unit,
  children,
  live,
  delay,
}: {
  left: number;
  top: number;
  align: 'left' | 'right';
  value: string;
  unit?: string;
  children: ReactNode;
  live: boolean;
  delay: number;
}) => (
  <div
    style={abs(left, top, { width: 420, textAlign: align, ...play(live, 'au-rise', 1000, delay) })}
  >
    <div style={{ ...NUM, fontSize: 84 }}>
      {value}
      {unit && (
        <span style={{ fontSize: 36, marginLeft: 12, letterSpacing: '0.06em' }}>{unit}</span>
      )}
    </div>
    <div style={{ fontSize: 30, fontStyle: 'italic', lineHeight: 1.3, marginTop: 12 }}>
      {children}
    </div>
  </div>
);

const Ballroom: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <div
        style={abs(660, 360, {
          width: 600,
          height: 460,
          background: `radial-gradient(closest-side, rgba(237,214,156,0.26) 0%, rgba(237,214,156,0.08) 50%, rgba(237,214,156,0) 100%)`,
          ...(live ? { animation: 'au-glow 5s ease-in-out 1.5s infinite' } : {}),
        })}
      />
      <BallroomScene live={live} />
      <Head
        numeral="VI"
        eyebrow="The Centrepiece"
        title="The Grand Ballroom"
        sub="Its 1938 broadcasts made the room famous. Its acoustics made them possible."
        live={live}
      />
      <BallStat
        left={160}
        top={420}
        align="right"
        value="7,400"
        unit="sq ft"
        live={live}
        delay={1300}
      >
        of sprung maple floor,
        <br />
        re-laid board by board
      </BallStat>
      <BallStat left={160} top={680} align="right" value="32" unit="ft" live={live} delay={1500}>
        to the coffered vault,
        <br />
        its stencils re-cut
      </BallStat>
      <BallStat
        left={1340}
        top={420}
        align="left"
        value="480"
        unit="seated"
        live={live}
        delay={1700}
      >
        or 650 standing for
        <br />
        reception and dance
      </BallStat>
      <BallStat left={1340} top={680} align="left" value="18,600" live={live} delay={1900}>
        crystals re-strung across
        <br />
        eleven chandeliers
      </BallStat>
    </Stage>
  );
};

const notchD = (w: number, h: number, n: number, i: number) => {
  const a = i;
  const b = w - i;
  const c = i;
  const d = h - i;
  const s = n / 2;
  return [
    `M${a + n} ${c}`,
    `H${b - n} V${c + s} H${b - s} V${c + n} H${b}`,
    `V${d - n} H${b - s} V${d - s} H${b - n} V${d}`,
    `H${a + n} V${d - s} H${a + s} V${d - n} H${a}`,
    `V${c + n} H${a + s} V${c + s} H${a + n} Z`,
  ].join(' ');
};

const EmblemFan = () => (
  <svg width={200} height={110} viewBox="0 0 200 110" style={{ color: GOLD }}>
    <path
      d="M30 100 A70 70 0 0 1 170 100"
      fill="currentColor"
      fillOpacity={0.12}
      stroke="currentColor"
      strokeWidth={1.4}
    />
    <path d="M52 100 A48 48 0 0 1 148 100" fill="none" stroke="currentColor" strokeOpacity={0.6} />
    <Sunburst cx={100} cy={100} r0={14} r1={68} count={13} alt={0.72} live={false} />
    <path d="M20 100 H180" stroke="currentColor" strokeWidth={1.4} />
    <path d="M100 92 L108 100 L100 108 L92 100 Z" fill="currentColor" />
  </svg>
);

const EmblemCoupe = () => (
  <svg width={200} height={110} viewBox="0 0 200 110" style={{ color: GOLD }}>
    <g fill="none" stroke="currentColor" strokeWidth={1.4}>
      <path d="M62 14 H138 L100 56 Z" fill="currentColor" fillOpacity={0.14} />
      <path d="M74 26 H126" strokeOpacity={0.6} />
      <path d="M100 56 V96 M80 100 H120" />
      <path d="M22 40 L36 54 L22 68 M36 40 L50 54 L36 68" strokeOpacity={0.7} />
      <path d="M178 40 L164 54 L178 68 M164 40 L150 54 L164 68" strokeOpacity={0.7} />
    </g>
    <circle cx={112} cy={8} r={3} fill="currentColor" />
    <circle cx={122} cy={2} r={2} fill="currentColor" />
  </svg>
);

const EmblemLantern = () => (
  <svg width={200} height={110} viewBox="0 0 200 110" style={{ color: GOLD }}>
    <Sunburst
      cx={100}
      cy={40}
      r0={24}
      r1={52}
      count={13}
      from={190}
      to={350}
      live={false}
      opacity={0.75}
    />
    <g fill="none" stroke="currentColor" strokeWidth={1.4}>
      <path d="M50 104 V88 H66 V76 H82 V64 H118 V76 H134 V88 H150 V104" />
      <path d="M86 64 V32 H114 V64" fill="currentColor" fillOpacity={0.2} />
      <path d="M86 32 L100 14 L114 32" />
      <path d="M40 104 H160" />
    </g>
  </svg>
);

const VenueCard = ({
  left,
  emblem,
  name,
  kicker,
  children,
}: {
  left: number;
  emblem: ReactNode;
  name: string;
  kicker: string;
  children: ReactNode;
}) => (
  <div style={abs(left, 378, { width: 480, height: 560 })}>
    <svg width={480} height={560} viewBox="0 0 480 560" style={abs(0, 0, { color: GOLD })}>
      <path
        d={notchD(480, 560, 36, 1)}
        fill={EMERALD}
        fillOpacity={0.5}
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <path d={notchD(480, 560, 36, 12)} fill="none" stroke="currentColor" strokeOpacity={0.4} />
    </svg>
    <div style={abs(140, 44, { width: 200, height: 110 })}>{emblem}</div>
    <div
      style={abs(0, 182, {
        ...DISPLAY,
        width: 480,
        textAlign: 'center',
        fontSize: 52,
        color: IVORY,
      })}
    >
      {name}
    </div>
    <div
      style={abs(0, 252, {
        width: 480,
        textAlign: 'center',
        fontSize: 30,
        fontStyle: 'italic',
        color: GOLD,
      })}
    >
      {kicker}
    </div>
    <Divider left={130} top={306} width={220} live={false} />
    <div
      style={abs(40, 348, {
        width: 400,
        textAlign: 'center',
        fontSize: 30,
        lineHeight: 1.5,
        color: IVORY,
      })}
    >
      {children}
    </div>
  </div>
);

const Dining: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head
        numeral="VII"
        eyebrow="Food & Drink"
        title="To Dine & to Drink"
        sub="Three rooms, three hours of the day — breakfast, cocktails, the city at dusk."
        live={live}
      />
      <div style={abs(0, 0, { width: 1920, height: 1080, ...play(live, 'au-rise', 1000, 700) })}>
        <VenueCard left={170} emblem={<EmblemFan />} name="Vey’s" kicker="The grand brasserie">
          Lobby level · 140 covers
          <br />
          Breakfast to late supper
          <br />
          <span style={{ color: MUTED }}>Chef Inès Marchetti</span>
        </VenueCard>
        <VenueCard
          left={720}
          emblem={<EmblemCoupe />}
          name="The Gilt Bar"
          kicker="Cocktails below stairs"
        >
          Lower level · 64 seats
          <br />
          The 1929 speakeasy, unsealed
          <br />
          <span style={{ color: MUTED }}>Bar lead Theo Varga</span>
        </VenueCard>
        <VenueCard left={1270} emblem={<EmblemLantern />} name="Lantern" kicker="Under the crown">
          Floor 22 · 90 covers
          <br />
          Terrace beside the lantern
          <br />
          <span style={{ color: MUTED }}>Seasonal, May–October</span>
        </VenueCard>
      </div>
    </Stage>
  );
};

const FAN_CX = 960;
const FAN_CY = 930;
const FAN_R0 = 228;
const FAN_R1 = 460;
const CREW = 640;

const Wedge = ({
  start,
  count,
  name,
  strong,
  live,
  delay,
}: {
  start: number;
  count: number;
  name: string;
  strong?: boolean;
  live: boolean;
  delay: number;
}) => {
  const a0 = 180 + (start / CREW) * 180;
  const a1 = 180 + ((start + count) / CREW) * 180;
  const am = (a0 + a1) / 2;
  const lx = px(FAN_CX, FAN_R1 + 34, am);
  const ly = py(FAN_CY, FAN_R1 + 34, am);
  const c = Math.cos(rad(am));
  const tx = c < -0.3 ? '-100%' : c > 0.3 ? '0%' : '-50%';
  const ty = Math.abs(c) > 0.3 ? '-50%' : '-100%';
  const align = c < -0.3 ? 'right' : c > 0.3 ? 'left' : 'center';
  return (
    <>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
      >
        <path
          d={sectorD(FAN_CX, FAN_CY, FAN_R0, FAN_R1, a0, a1)}
          fill={strong ? 'currentColor' : EMERALD}
          fillOpacity={strong ? 0.9 : 0.85}
          stroke={strong ? 'var(--osd-bg)' : 'currentColor'}
          strokeWidth={strong ? 4 : 1.4}
          style={{
            transformBox: 'view-box',
            transformOrigin: `${FAN_CX}px ${FAN_CY}px`,
            ...play(live, 'au-bloom', 900, delay),
          }}
        />
      </svg>
      <div
        style={abs(lx, ly, {
          transform: `translate(${tx}, ${ty})`,
          textAlign: align,
          whiteSpace: 'nowrap',
          ...play(live, 'au-fade', 800, delay + 400),
        })}
      >
        <div style={{ ...NUM, fontSize: 40 }}>{count}</div>
        <div
          style={{ ...LABEL, fontSize: 18, color: IVORY, marginTop: 8, letterSpacing: '0.22em' }}
        >
          {name}
        </div>
      </div>
    </>
  );
};

const Craft: Page = () => {
  const live = useIsActivePage();
  const ticks: ReactNode[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = 180 + (i / 64) * 180;
    const long = i % 8 === 0;
    ticks.push(
      <line
        key={i}
        x1={px(FAN_CX, FAN_R1 + 8, a)}
        y1={py(FAN_CY, FAN_R1 + 8, a)}
        x2={px(FAN_CX, FAN_R1 + (long ? 22 : 14), a)}
        y2={py(FAN_CY, FAN_R1 + (long ? 22 : 14), a)}
      />,
    );
  }
  return (
    <Stage live={live}>
      <Head
        numeral="VIII"
        eyebrow="The Hands"
        title="Made by Hand"
        sub="Thirty-eight trades and 412,000 hours on the tools — most of them local."
        live={live}
      />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
      >
        <g stroke="currentColor" strokeOpacity={0.6} style={play(live, 'au-fade', 1200, 200)}>
          {ticks}
        </g>
        <path
          d={arcD(FAN_CX, FAN_CY, FAN_R0 - 12, 180, 360)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          {...draw(live, 1500, 200)}
        />
        <path
          d={arcD(FAN_CX, FAN_CY, FAN_R0 - 22, 180, 360)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.45}
          {...draw(live, 1500, 350)}
        />
        <line
          x1={FAN_CX - FAN_R1 - 30}
          y1={FAN_CY}
          x2={FAN_CX + FAN_R1 + 30}
          y2={FAN_CY}
          stroke="currentColor"
          strokeWidth={1.4}
        />
      </svg>
      <Wedge start={0} count={148} name="Masons" strong live={live} delay={400} />
      <Wedge start={148} count={112} name="Plasterers" live={live} delay={560} />
      <Wedge start={260} count={96} name="Joiners" strong live={live} delay={720} />
      <Wedge start={356} count={64} name="Bronze & metal" live={live} delay={880} />
      <Wedge start={420} count={58} name="Gilders" strong live={live} delay={1040} />
      <Wedge start={478} count={44} name="Terrazzo" live={live} delay={1200} />
      <Wedge start={522} count={30} name="Glaziers" strong live={live} delay={1360} />
      <Wedge start={552} count={88} name="31 other trades" live={live} delay={1520} />
      <div
        style={abs(760, 768, {
          width: 400,
          textAlign: 'center',
          ...play(live, 'au-rise', 1000, 1600),
        })}
      >
        <div style={{ ...NUM, fontSize: 112, ...goldText(live, 2800) }}>640</div>
        <div style={{ ...LABEL, fontSize: 18, marginTop: 12 }}>Craftspeople</div>
      </div>
    </Stage>
  );
};

const GX = 560;
const QW = 61;
const ROW0 = 438;
const ROWH = 76;
const BAR_H = 36;
const TODAY_Q = 15.13;
const OPEN_Q = 16.85;

const chevronPts = (x0: number, x1: number, y: number, tip: boolean) => {
  const h = BAR_H;
  const right = tip
    ? `${x1 - 14},${y} ${x1},${y + h / 2} ${x1 - 14},${y + h}`
    : `${x1},${y} ${x1},${y + h}`;
  return `${x0},${y} ${right} ${x0},${y + h} ${x0 + 10},${y + h / 2}`;
};

const Workstream = ({
  row,
  name,
  dates,
  start,
  end,
}: {
  row: number;
  name: string;
  dates: string;
  start: number;
  end: number;
}) => {
  const y = ROW0 + row * ROWH;
  const x0 = GX + start * QW;
  const x1 = GX + end * QW;
  const today = GX + TODAY_Q * QW;
  const done = today >= x1;
  return (
    <>
      <div style={abs(140, y - 8, { width: 390 })}>
        <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.1 }}>{name}</div>
        <div style={{ ...LABEL, fontSize: 18, color: MUTED, marginTop: 6, letterSpacing: '0.2em' }}>
          {dates}
        </div>
      </div>
      <svg
        width={1920}
        height={BAR_H + 4}
        viewBox={`0 ${y - 2} 1920 ${BAR_H + 4}`}
        style={abs(0, y - 2, { color: GOLD })}
      >
        <polygon
          points={chevronPts(x0, x1, y, true)}
          fill={done ? 'currentColor' : 'none'}
          fillOpacity={0.85}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        {!done && (
          <polygon
            points={chevronPts(x0, today, y, false)}
            fill="currentColor"
            fillOpacity={0.85}
          />
        )}
      </svg>
    </>
  );
};

const YearCol = ({ index, year }: { index: number; year: string }) => (
  <div
    style={abs(GX + index * 4 * QW, 384, {
      width: 4 * QW,
      textAlign: 'center',
      ...LABEL,
      fontSize: 20,
    })}
  >
    {year}
  </div>
);

const Programme: Page = () => {
  const live = useIsActivePage();
  const grid: ReactNode[] = [];
  for (let q = 0; q <= 20; q++) {
    const x = GX + q * QW;
    grid.push(
      <line
        key={q}
        x1={x}
        x2={x}
        y1={q % 4 === 0 ? 372 : 420}
        y2={870}
        stroke="currentColor"
        strokeOpacity={q % 4 === 0 ? 0.4 : 0.12}
      />,
    );
  }
  const today = GX + TODAY_Q * QW;
  const open = GX + OPEN_Q * QW;
  return (
    <Stage live={live}>
      <Head
        numeral="IX"
        eyebrow="The Programme"
        title="Forty-Six Months"
        sub="Six workstreams, overlapped so the trades never stood idle."
        live={live}
      />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
      >
        <g style={play(live, 'au-fade', 1000, 300)}>{grid}</g>
        <line
          x1={today}
          x2={today}
          y1={420}
          y2={880}
          stroke={IVORY}
          strokeOpacity={0.7}
          strokeDasharray="4 6"
        />
        <line x1={open} x2={open} y1={410} y2={880} stroke="currentColor" strokeWidth={1.6} />
        <path
          d={`M${open} 396 L${open + 9} 405 L${open} 414 L${open - 9} 405 Z`}
          fill="currentColor"
        />
        <Sunburst
          cx={open}
          cy={405}
          r0={14}
          r1={22}
          count={7}
          from={215}
          to={325}
          live={live}
          delay={900}
          ms={900}
        />
      </svg>
      <YearCol index={0} year="2023" />
      <YearCol index={1} year="2024" />
      <YearCol index={2} year="2025" />
      <YearCol index={3} year="2026" />
      <YearCol index={4} year="2027" />
      <div
        style={abs(today - 200, 892, {
          width: 192,
          textAlign: 'right',
          ...LABEL,
          fontSize: 18,
          color: IVORY,
          lineHeight: 1.4,
        })}
      >
        Today
        <br />
        Oct 2026
      </div>
      <div style={abs(open + 12, 892, { ...LABEL, fontSize: 18, lineHeight: 1.4 })}>
        Doors open
        <br />
        18 Mar 2027
      </div>
      <div style={abs(0, 0, { width: 1920, height: 1080 })}>
        <Steps>
          <Step duration={400}>
            <Workstream
              row={0}
              name="Acquisition & survey"
              dates="Q2 – Q4 2023"
              start={1}
              end={4}
            />
          </Step>
          <Step duration={400}>
            <Workstream
              row={1}
              name="Structure & facade"
              dates="Q4 2023 – Q1 2025"
              start={3}
              end={9}
            />
          </Step>
          <Step duration={400}>
            <Workstream row={2} name="Systems & MEP" dates="Q1 2024 – Q1 2026" start={4} end={13} />
          </Step>
          <Step duration={400}>
            <Workstream
              row={3}
              name="Rooms & corridors"
              dates="Q3 2024 – Q2 2026"
              start={6}
              end={14}
            />
          </Step>
          <Step duration={400}>
            <Workstream
              row={4}
              name="Lobby & ballroom"
              dates="Q4 2024 – Q3 2026"
              start={7}
              end={15}
            />
          </Step>
          <Step duration={400}>
            <Workstream
              row={5}
              name="FF&E & pre-opening"
              dates="Q2 2026 – Q1 2027"
              start={13}
              end={17}
            />
          </Step>
        </Steps>
      </div>
    </Stage>
  );
};

const BUDGET_BASE = 900;
const BUDGET_SCALE = 500 / 186;

const BudgetTier = ({
  cum,
  amount,
  width,
  labelY,
  name,
  reserve,
  live,
  delay,
}: {
  cum: number;
  amount: number;
  width: number;
  labelY: number;
  name: string;
  reserve?: boolean;
  live: boolean;
  delay: number;
}) => {
  const bottom = BUDGET_BASE - cum * BUDGET_SCALE;
  const h = amount * BUDGET_SCALE - 4;
  const top = bottom - amount * BUDGET_SCALE;
  const mid = top + h / 2;
  const right = 960 + width / 2;
  return (
    <>
      <div
        style={abs(960 - width / 2, top, {
          width,
          height: h,
          boxSizing: 'border-box',
          background: reserve
            ? `repeating-linear-gradient(135deg, rgba(201,164,92,0.38) 0 2px, rgba(0,0,0,0) 2px 10px)`
            : `repeating-linear-gradient(90deg, rgba(8,18,15,0.16) 0 1px, rgba(0,0,0,0) 1px 12px), linear-gradient(180deg, ${GOLD_HI} 0%, var(--osd-accent) 50%, ${GOLD_LO} 100%)`,
          border: reserve ? `1.4px solid ${GOLD}` : undefined,
          boxShadow: reserve ? undefined : 'inset 0 0 0 1px rgba(255,240,200,0.32)',
          transformOrigin: '50% 100%',
          ...play(live, 'au-lift', 700, delay),
        })}
      />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
      >
        <path
          d={`M${right + 8} ${mid} H${right + 40} L1352 ${labelY} H1370`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.7}
          {...draw(live, 700, delay + 300)}
        />
        <circle
          cx={right + 8}
          cy={mid}
          r={3}
          fill="currentColor"
          style={play(live, 'au-fade', 400, delay + 200)}
        />
      </svg>
      <div
        style={abs(1384, labelY - 22, {
          width: 400,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          ...play(live, 'au-fade', 700, delay + 500),
        })}
      >
        <span
          style={{
            fontSize: 30,
            fontStyle: reserve ? 'italic' : undefined,
            color: reserve ? MUTED : IVORY,
          }}
        >
          {name}
        </span>
        <span style={{ ...NUM, fontSize: 36 }}>${amount}M</span>
      </div>
    </>
  );
};

const BudgetStat = ({
  top,
  value,
  children,
  live,
  delay,
}: {
  top: number;
  value: string;
  children: ReactNode;
  live: boolean;
  delay: number;
}) => (
  <div style={abs(140, top, { width: 440, ...play(live, 'au-rise', 1000, delay) })}>
    <div style={{ ...NUM, fontSize: 96 }}>{value}</div>
    <div
      style={{ fontSize: 30, fontStyle: 'italic', lineHeight: 1.3, marginTop: 14, color: IVORY }}
    >
      {children}
    </div>
  </div>
);

const Budget: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head
        numeral="X"
        eyebrow="The Budget"
        title="$186 Million, All In"
        sub="Acquisition through opening night, with the contingency still unspent."
        live={live}
      />
      <BudgetStat top={420} value="$877K" live={live} delay={300}>
        per key, all in — land,
        <br />
        restoration and opening
      </BudgetStat>
      <BudgetStat top={680} value="$1.24M" live={live} delay={500}>
        per key to build new luxury
        <br />
        in the same submarket
      </BudgetStat>
      <BudgetTier
        cum={0}
        amount={48}
        width={620}
        labelY={876}
        name="Acquisition"
        live={live}
        delay={300}
      />
      <BudgetTier
        cum={48}
        amount={46}
        width={560}
        labelY={800}
        name="Interiors & rooms"
        live={live}
        delay={500}
      />
      <BudgetTier
        cum={94}
        amount={38}
        width={500}
        labelY={724}
        name="Facade & structure"
        live={live}
        delay={700}
      />
      <BudgetTier
        cum={132}
        amount={19}
        width={440}
        labelY={648}
        name="Ballroom & public"
        live={live}
        delay={900}
      />
      <BudgetTier
        cum={151}
        amount={16}
        width={380}
        labelY={572}
        name="Systems & MEP"
        live={live}
        delay={1100}
      />
      <BudgetTier
        cum={167}
        amount={11}
        width={320}
        labelY={496}
        name="Contingency"
        reserve
        live={live}
        delay={1300}
      />
      <BudgetTier
        cum={178}
        amount={8}
        width={260}
        labelY={420}
        name="FF&E & pre-opening"
        live={live}
        delay={1500}
      />
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
      >
        <line
          x1={600}
          y1={BUDGET_BASE + 1}
          x2={1320}
          y2={BUDGET_BASE + 1}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <Sunburst
          cx={960}
          cy={BUDGET_BASE - 500 - 4}
          r0={10}
          r1={40}
          count={11}
          live={live}
          delay={1800}
          ms={900}
        />
      </svg>
    </Stage>
  );
};

const Gauge = ({
  left,
  year,
  occ,
  adr,
  revpar,
  live,
  delay,
}: {
  left: number;
  year: string;
  occ: number;
  adr: string;
  revpar: string;
  live: boolean;
  delay: number;
}) => {
  const cx = 180;
  const cy = 190;
  const end = 180 + occ * 1.8;
  const ticks: ReactNode[] = [];
  for (let i = 0; i <= 20; i++) {
    const a = 180 + i * 9;
    const long = i % 10 === 0;
    ticks.push(
      <line
        key={i}
        x1={px(cx, 158, a)}
        y1={py(cy, 158, a)}
        x2={px(cx, long ? 174 : 166, a)}
        y2={py(cy, long ? 174 : 166, a)}
        strokeOpacity={long ? 1 : 0.55}
      />,
    );
  }
  const seps: ReactNode[] = [];
  for (let i = 1; i < 20; i++) {
    const a = 180 + i * 9;
    if (a >= end) break;
    seps.push(
      <line
        key={i}
        x1={px(cx, 114, a)}
        y1={py(cy, 114, a)}
        x2={px(cx, 148, a)}
        y2={py(cy, 148, a)}
      />,
    );
  }
  return (
    <div style={abs(left, 412, { width: 360 })}>
      <svg width={360} height={200} viewBox="0 0 360 200" style={{ color: GOLD, display: 'block' }}>
        <g stroke="currentColor">{ticks}</g>
        <path
          d={arcD(cx, cy, 150, 180, 360)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.6}
        />
        <path
          d={arcD(cx, cy, 112, 180, 360)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.6}
        />
        <path
          d={arcD(cx, cy, 131, 180, end)}
          fill="none"
          stroke="currentColor"
          strokeWidth={34}
          {...draw(live, 1600, delay)}
        />
        <g stroke="var(--osd-bg)" strokeWidth={2} style={play(live, 'au-fade', 500, delay + 1400)}>
          {seps}
        </g>
        <path
          d={`M${cx} ${cy - 10} L${cx + 10} ${cy} L${cx} ${cy + 10} L${cx - 10} ${cy} Z`}
          fill="currentColor"
        />
      </svg>
      <div style={abs(0, 100, { width: 360, textAlign: 'center' })}>
        <span style={{ ...NUM, fontSize: 64, color: IVORY }}>{occ}</span>
        <span style={{ ...NUM, fontSize: 34, color: IVORY }}>%</span>
      </div>
      <div style={{ ...LABEL, fontSize: 22, textAlign: 'center', marginTop: 26 }}>{year}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 44, marginTop: 30 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...LABEL, fontSize: 18, color: MUTED }}>ADR</div>
          <div style={{ ...NUM, fontSize: 44, color: IVORY, marginTop: 10 }}>{adr}</div>
        </div>
        <div style={{ width: 1, background: GOLD, opacity: 0.45 }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...LABEL, fontSize: 18, color: MUTED }}>RevPAR</div>
          <div style={{ ...NUM, fontSize: 44, marginTop: 10 }}>{revpar}</div>
        </div>
      </div>
    </div>
  );
};

const Outlook: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head
        numeral="XI"
        eyebrow="The Outlook"
        title="Stabilised by 2030"
        sub="Occupancy, rate and RevPAR, underwritten against five heritage luxury hotels."
        live={live}
      />
      <Gauge
        left={150}
        year="2027 · Opening"
        occ={58}
        adr="$465"
        revpar="$270"
        live={live}
        delay={300}
      />
      <Gauge left={570} year="2028" occ={69} adr="$505" revpar="$348" live={live} delay={550} />
      <Gauge left={990} year="2029" occ={74} adr="$530" revpar="$392" live={live} delay={800} />
      <Gauge
        left={1410}
        year="2030 · Stable"
        occ={77}
        adr="$548"
        revpar="$422"
        live={live}
        delay={1050}
      />
      <Divider left={780} top={818} width={360} live={live} delay={1600} />
      <p
        style={abs(260, 860, {
          width: 1400,
          margin: 0,
          textAlign: 'center',
          fontSize: 32,
          fontStyle: 'italic',
          color: IVORY,
          ...play(live, 'au-fade', 1000, 1800),
        })}
      >
        Stabilised RevPAR of $422 — a 21% premium to the comp set’s $349.
      </p>
    </Stage>
  );
};

const ticketD = (w: number, h: number) =>
  `M0 ${h} V74 H48 V44 H96 V14 H${w - 96} V44 H${w - 48} V74 H${w} V${h} Z`;

const Ticket = ({
  left,
  month,
  day,
  weekday,
  title,
  children,
  gala,
}: {
  left: number;
  month: string;
  day: string;
  weekday: string;
  title: string;
  children: ReactNode;
  gala?: boolean;
}) => {
  const w = 300;
  const h = 520;
  const ink = gala ? DEEP : IVORY;
  return (
    <div style={abs(left, 384, { width: w, height: h })}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={abs(0, 0, { color: GOLD, overflow: 'visible' })}
      >
        <path
          d={ticketD(w, h)}
          fill={gala ? GOLD : EMERALD}
          fillOpacity={gala ? 1 : 0.55}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <path
          d={ticketD(w - 24, h - 24)}
          transform="translate(12 12)"
          fill="none"
          stroke={gala ? DEEP : 'currentColor'}
          strokeOpacity={0.4}
        />
      </svg>
      <div
        style={abs(0, 96, { width: w, textAlign: 'center', ...LABEL, color: gala ? DEEP : GOLD })}
      >
        {month}
      </div>
      <div
        style={abs(0, 132, {
          width: w,
          textAlign: 'center',
          ...NUM,
          fontSize: 124,
          color: gala ? DEEP : GOLD,
        })}
      >
        {day}
      </div>
      <div
        style={abs(0, 270, {
          width: w,
          textAlign: 'center',
          ...LABEL,
          fontSize: 18,
          color: gala ? DEEP : MUTED,
        })}
      >
        {weekday}
      </div>
      <div
        style={abs(70, 306, {
          width: 160,
          height: 1,
          background: gala ? DEEP : GOLD,
          opacity: 0.6,
        })}
      />
      <div style={abs(24, 330, { width: w - 48, textAlign: 'center', color: ink })}>
        <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.1 }}>{title}</div>
        <div
          style={{
            fontSize: 28,
            fontStyle: 'italic',
            lineHeight: 1.25,
            marginTop: 12,
            opacity: 0.85,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const Season: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage live={live}>
      <Head
        numeral="XII"
        eyebrow="Spring 2027"
        title="The Opening Season"
        sub="Five dates that put the Aurelian back on the city’s calendar."
        live={live}
      />
      <div style={abs(0, 0, { width: 1920, height: 1080 })}>
        <Steps>
          <Step duration={450}>
            <Ticket left={150} month="March" day="04" weekday="Thursday" title="Press preview">
              Hard-hat tours,
              <br />
              crown to cellar
            </Ticket>
          </Step>
          <Step duration={450}>
            <Ticket left={480} month="March" day="18" weekday="Thursday" title="Doors open">
              First guests; all
              <br />
              212 keys on sale
            </Ticket>
          </Step>
          <Step duration={450}>
            <Ticket
              left={810}
              month="April"
              day="10"
              weekday="Saturday"
              title="The Night of 1929"
              gala
            >
              Black-tie gala in
              <br />
              the Grand Ballroom
            </Ticket>
          </Step>
          <Step duration={450}>
            <Ticket left={1140} month="May" day="01" weekday="Saturday" title="Lantern opens">
              The rooftop terrace
              <br />
              on floor 22
            </Ticket>
          </Step>
          <Step duration={450}>
            <Ticket left={1470} month="June" day="18" weekday="Friday" title="Midsummer jazz">
              A residency in
              <br />
              the Gilt Bar
            </Ticket>
          </Step>
        </Steps>
      </div>
    </Stage>
  );
};

const Close: Page = () => {
  const live = useIsActivePage();
  const cx = 960;
  const cy = 540;
  return (
    <Stage live={live} drawn footer={false}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={abs(0, 0, { color: GOLD, pointerEvents: 'none' })}
      >
        <Sunburst
          cx={cx}
          cy={cy}
          r0={720}
          r1={1150}
          count={72}
          from={0}
          to={355}
          live={live}
          opacity={0.12}
          stagger={14}
          ms={1800}
        />
        <g transform="translate(340 196)">
          <path
            d={notchD(1240, 680, 72, 0)}
            fill={DEEP}
            fillOpacity={0.45}
            stroke="currentColor"
            strokeWidth={1.4}
            {...draw(live, 2400, 200)}
          />
          <path
            d={notchD(1240, 680, 72, 12)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.4}
            {...draw(live, 2400, 400)}
          />
        </g>
      </svg>
      <div
        style={abs(cx - 520, cy - 300, {
          width: 1040,
          height: 600,
          background:
            'radial-gradient(closest-side, rgba(14,28,24,0.9) 30%, rgba(14,28,24,0) 100%)',
        })}
      />
      <Crest left={850} top={232} live={live} />
      <div
        style={abs(0, 380, {
          ...LABEL,
          width: 1920,
          textAlign: 'center',
          ...play(live, 'au-fade', 1000, 400),
        })}
      >
        The Aurelian{' '}
        <span style={{ margin: '0 20px' }}>
          <Gem size={7} />
        </span>{' '}
        Michigan Avenue, Chicago
      </div>
      <h2
        style={abs(0, 422, {
          ...DISPLAY,
          width: 1920,
          textAlign: 'center',
          fontSize: 120,
          letterSpacing: '0.08em',
          paddingLeft: '0.08em',
          ...goldText(live, 2400),
          ...play(live, 'au-rise', 1300, 500),
        })}
      >
        The Doors Reopen
      </h2>
      <Divider left={620} top={578} width={680} live={live} delay={900} />
      <div
        style={abs(0, 620, {
          ...NUM,
          width: 1920,
          textAlign: 'center',
          fontSize: 58,
          letterSpacing: '0.12em',
          color: IVORY,
          ...play(live, 'au-fade', 1200, 1100),
        })}
      >
        18 · III · MMXXVII
      </div>
      <div
        style={abs(0, 702, {
          width: 1920,
          textAlign: 'center',
          fontSize: 36,
          fontStyle: 'italic',
          color: MUTED,
          ...play(live, 'au-fade', 1200, 1300),
        })}
      >
        Thank you — we will see you in the ballroom.
      </div>
      <div
        style={abs(0, 790, {
          ...LABEL,
          fontSize: 18,
          width: 1920,
          textAlign: 'center',
          color: MUTED,
          ...play(live, 'au-fade', 1000, 1500),
        })}
      >
        Press preview 4 March{' '}
        <span style={{ margin: '0 16px' }}>
          <Gem size={6} />
        </span>{' '}
        The Night of 1929, 10 April
      </div>
      <div style={abs(120, 950, { ...LABEL, fontSize: 18, ...play(live, 'au-fade', 1000, 1600) })}>
        Investor relations · Meridian Heritage
      </div>
      <div
        style={abs(1300, 950, {
          ...LABEL,
          fontSize: 18,
          width: 500,
          textAlign: 'right',
          ...play(live, 'au-fade', 1000, 1600),
        })}
      >
        Press office · The Aurelian
      </div>
    </Stage>
  );
};
Close.transition = settle;

export const meta: SlideMeta = {
  title: 'The Aurelian, 1929 — Restored',
  createdAt: '2026-10-12T12:14:04.220Z',
};

export default [
  Cover,
  History,
  Scope,
  Facade,
  Lobby,
  Rooms,
  Ballroom,
  Dining,
  Craft,
  Programme,
  Budget,
  Outlook,
  Season,
  Close,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Good evening. Let the room settle on the sunrise before speaking.
"In 1929 this building was Chicago's most glamorous address. Tonight we show you what it took to give it back to the city."
Introduce yourself and Meridian Heritage, then move on — the deck does the rest.`,
  `Six chapters, about fifteen seconds each.
1929: Harlan & Vey, four hundred rooms, opened eight months before the crash.
1938: the ballroom dance broadcasts — that's where the name travelled.
1962 is the villain: the drop ceilings and carpet. But that carpet is why the terrazzo survived.
1988 landmark status protected the shell; 2019 it closed. 2027 is why we're here.`,
  `Three acts of restoration. Click through one at a time.
Facade first — the face the city sees. Then the lobby, the first room a guest walks into. Then the ballroom, the room the city remembers.
Key line: restored, not replicated. Where an original survived, we repaired it.`,
  `Walk the building from the street up.
Limestone base: 26,000 square feet, cleaned with poultice, no sandblasting.
4,180 terracotta blocks recast — the glaze was matched from a sample found in the 1929 contractor's crate.
312 steel windows, all repaired in place.
And the crown lantern: dark since 2019, relit with 1,140 lamps behind its original glass. It's visible from the lake.`,
  `This is the room that sells the hotel.
The 1962 drop ceiling hid a coffered ceiling that still had most of its gold. We re-laid fourteen kilograms of 23-carat leaf.
Under the carpet: 2,600 square feet of terrazzo, including this compass medallion — the photograph of it uncovered is in your pack.
All nine bronze elevator doors are the 1929 originals.`,
  `Four hundred small rooms became 212 proper ones.
Most of the house is Classic Kings — 118 keys at 340 square feet, opening at $465.
The top of the ziggurat is where the rate lives: twelve Signature Suites and two Penthouses under the crown.
Average key is 451 square feet — more than double the 1929 layout.`,
  `Pause on the illustration before the numbers.
7,400 square feet of sprung maple, 32 feet to the vault, 480 seated or 650 standing.
18,600 crystals re-strung across eleven chandeliers.
Commercially: the ballroom is already 41% booked for 2027 weddings and galas — mention it here.`,
  `Three venues, each tied to a time of day.
Vey's, named for the architect: the grand brasserie, 140 covers, breakfast to late supper.
The Gilt Bar sits in the actual 1929 speakeasy we unsealed during the survey.
Lantern is the rooftop terrace beside the crown — seasonal, May to October.
Food and beverage is underwritten at 34% of total revenue.`,
  `Six hundred and forty people restored this building.
Masons were the largest trade, then plasterers and joiners.
The number to land: 412,000 hours — and about seventy percent of that labour was hired within the city.
Thank the gilders and terrazzo crews by name if any are in the room.`,
  `Forty-six months from acquisition to opening. Click through the six workstreams in order.
Point at the dashed line: we are here, October 2026. Five of six workstreams are complete.
Only FF&E and pre-opening remain, and they are on schedule for doors open on 18 March.`,
  `$186 million, all in.
Read it from the base up: acquisition, interiors, facade — those three are 71% of the total.
The hatched tier is the $11 million contingency. It is still unspent.
The comparison that matters: $877K a key, against roughly $1.24M to build new luxury in the same submarket.`,
  `Four years, one direction.
We open at 58% occupancy and a $465 ADR, conservative by design.
By 2030 we stabilise at 77% and $548 — RevPAR of $422.
The comp set is five heritage luxury hotels in the Loop and Gold Coast; their trailing RevPAR is $349.`,
  `Five dates. Reveal each one.
Press preview on 4 March — everyone in this room is invited.
Doors open 18 March. The Night of 1929 gala on 10 April is the moment for the city — black tie, the Grand Ballroom.
Lantern opens 1 May, and the summer jazz residency starts on 18 June.`,
  `Close on the date. "On 18 March 2027 the doors reopen."
Thank the audience, invite investors to the suite tours and press to the 4 March preview.
Take questions with this page on screen.`,
];

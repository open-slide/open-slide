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
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#F2F5F4', text: '#0C1A24', accent: '#0A8F7F' },
  fonts: {
    display: '"Red Hat Display", "Helvetica Neue", system-ui, sans-serif',
    body: '"Red Hat Text", "Helvetica Neue", system-ui, sans-serif',
  },
  typeScale: { hero: 168, body: 30 },
  radius: 20,
};

const MUTED = '#66767F';
const SOFT = '#3A4952';
const HAIR = '#D3DBD9';
const WELL = '#060B10';
const DAPI = '#4F7BFF';
const GFP = '#5CF08F';
const MCH = '#FF4F9A';
const CYAN = '#3FD6FF';
const ROSE = '#D9467F';
const PLACEBO = '#9AA6AC';
const DOSE30 = '#4F7BFF';
const MINT = '#7CC7BC';
const MONO = '"Red Hat Mono", ui-monospace, "SF Mono", monospace';

const SLIDE_ID = 'solenne-rd-day';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;700&family=Red+Hat+Mono:wght@400;500&family=Red+Hat+Text:wght@400;500&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;

const FLUID = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SWAY = 'cubic-bezier(0.45, 0, 0.55, 1)';
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 1100;

const rgba = (hex: string, a: number) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const CSS = `
@property --sn-yr { syntax: '<integer>'; inherits: false; initial-value: 5; }
@keyframes sn-focus { from { opacity: 0; filter: blur(10px); transform: translateY(8px); } to { opacity: 1; filter: blur(0); transform: none; } }
@keyframes sn-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes sn-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes sn-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes sn-expose { 0% { opacity: 0; filter: blur(18px) brightness(0.3); } 55% { opacity: 1; } 100% { opacity: 1; filter: blur(0) brightness(1); } }
@keyframes sn-iris { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes sn-drift { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(var(--dx), var(--dy)) rotate(var(--dr)); } }
@keyframes sn-membrane {
  0%, 100% { border-radius: 50% 50% 46% 54% / 56% 44% 56% 44%; }
  33% { border-radius: 58% 42% 54% 46% / 44% 58% 42% 56%; }
  66% { border-radius: 42% 58% 60% 40% / 52% 46% 54% 48%; }
}
@keyframes sn-nuc { 0%, 100% { transform: scale(1); opacity: 0.84; } 50% { transform: scale(1.06); opacity: 1; } }
@keyframes sn-scan { 0% { transform: translateY(-70px); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(var(--h)); opacity: 0; } }
@keyframes sn-turn { to { transform: rotate(360deg); } }
@keyframes sn-ripple { 0% { transform: scale(1); opacity: 0; } 6% { opacity: 0.6; } 100% { transform: scale(3.2); opacity: 0; } }
@keyframes sn-pop { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: none; } }
@keyframes sn-flow { 0% { offset-distance: 0%; opacity: 0; } 10% { opacity: 1; } 86% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
@keyframes sn-spin3d { from { transform: rotateX(-16deg) rotateY(0deg); } to { transform: rotateX(-16deg) rotateY(360deg); } }
@keyframes sn-face { from { transform: translate3d(var(--x), var(--y), var(--z)) rotateY(0deg) rotateX(16deg); } to { transform: translate3d(var(--x), var(--y), var(--z)) rotateY(-360deg) rotateX(16deg); } }
@keyframes sn-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes sn-scar {
  from { stroke: ${rgba(CYAN, 0.75)}; stroke-width: 2px; fill: ${rgba(CYAN, 0.05)}; transform: scale(1); }
  to { stroke: ${MCH}; stroke-width: 7px; fill: ${rgba(MCH, 0.2)}; transform: scale(0.84); }
}
@keyframes sn-yr { from { --sn-yr: 0; } to { --sn-yr: 5; } }
@keyframes sn-grow { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes sn-lit { 0% { opacity: 0; transform: scale(0.4); } 60% { opacity: 1; } 100% { opacity: 1; transform: none; } }
@keyframes sn-sweep { 0% { transform: translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(var(--w)); opacity: 0; } }
@keyframes sn-breath-well { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.014); } }
@keyframes sn-secrete { to { stroke-dashoffset: -1; } }
@keyframes sn-float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(var(--dx), var(--dy)); } }
@keyframes sn-fill { from { opacity: 0; } to { opacity: 1; } }
@keyframes sn-glint { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

.sn-yr { counter-reset: sn-yr var(--sn-yr); }
.sn-yr::after { content: counter(sn-yr); }
.sn-sma { opacity: var(--sma, 0.55); }

.sn-sdraw { stroke-dasharray: 1; stroke-dashoffset: 0; transition: stroke-dashoffset 1800ms ${FLUID} 120ms; }
[data-osd-step="pending"] .sn-sdraw { stroke-dashoffset: 1; transition: none; }
.sn-sband { opacity: 1; transition: opacity 1000ms ease-out 1100ms; }
[data-osd-step="pending"] .sn-sband { opacity: 0; transition: none; }
.sn-sdot { transform-box: fill-box; transform-origin: center; transform: none; transition: transform 700ms ${FLUID}; transition-delay: var(--d, 0ms); }
[data-osd-step="pending"] .sn-sdot { transform: scale(0); transition: none; }
.sn-srise { opacity: 1; transform: none; transition: opacity 700ms ease-out, transform 1000ms ${FLUID}; transition-delay: var(--d, 0ms); }
[data-osd-step="pending"] .sn-srise { opacity: 0; transform: translateY(14px); transition: none; }

.sn-drug { transition: transform 1500ms ${FLUID}, opacity 700ms ease-out; }
[data-osd-step="pending"] .sn-drug { transform: translate(-40px, -120px) rotate(-50deg); opacity: 0; transition: none; }
.sn-mech .sn-down, .sn-mech .sn-dim { transition: opacity 1400ms ease 700ms; }
.sn-mech:has([data-osd-step="revealed"] .sn-drug) .sn-down { opacity: 0; }
.sn-mech:has([data-osd-step="revealed"] .sn-drug) .sn-dim { opacity: 0.22; }

.sn-right .sn-fib { stroke-dasharray: 1; stroke-dashoffset: 0.72; transition: stroke-dashoffset 2800ms ${FLUID} 200ms; }
.sn-right .sn-sma { opacity: calc(var(--sma, 0.55) * 0.22); transition: opacity 2400ms ease 400ms; }
.sn-right .sn-punc { opacity: 0.15; transition: opacity 2000ms ease 400ms; }
.sn-zoom:has([data-osd-step="pending"] .sn-t72) .sn-right .sn-fib { stroke-dashoffset: 0; transition: none; }
.sn-zoom:has([data-osd-step="pending"] .sn-t72) .sn-right .sn-sma { opacity: var(--sma, 0.55); transition: none; }
.sn-zoom:has([data-osd-step="pending"] .sn-t72) .sn-right .sn-punc { opacity: 1; transition: none; }
.sn-zoom .sn-t0 { transition: opacity 400ms ease; }
.sn-zoom:has([data-osd-step="revealed"] .sn-t72) .sn-t0 { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .sn-stage, .sn-stage * { animation: none !important; transition: none !important; }
  .sn-particle { display: none !important; }
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
  if (style.textContent !== CSS) style.textContent = CSS;
}

export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, filter: 'blur(3px)', transform: 'scale(0.992)' },
      { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
    ],
  },
};

const morphTransition: SlideTransition = {
  duration: 320,
  exit: { duration: 380, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 420, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' },
};

const EYEBROW: CSSProperties = {
  fontFamily: MONO,
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--osd-accent)',
  lineHeight: 1.2,
};

const LABEL: CSSProperties = {
  fontFamily: MONO,
  fontSize: 16,
  fontWeight: 400,
  letterSpacing: '0.04em',
  color: MUTED,
  lineHeight: 1.35,
};

const CAPS: CSSProperties = { ...LABEL, textTransform: 'uppercase', letterSpacing: '0.12em' };

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 500,
  letterSpacing: '-0.025em',
  margin: 0,
};

const BODY: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 'var(--osd-size-body)',
  lineHeight: 1.5,
  color: SOFT,
  margin: 0,
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const a = (live: boolean, animation: string): CSSProperties => (live ? { animation } : {});

const pad = (n: number) => String(n).padStart(2, '0');

const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")`;

const Logo = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="14.6" fill="none" stroke="var(--osd-accent)" strokeWidth="1.8" />
    <circle cx="16" cy="16" r="10" fill="var(--osd-text)" />
    <circle cx="13.2" cy="14" r="2.9" fill={GFP} />
    <circle cx="19.2" cy="18.6" r="2.1" fill={DAPI} />
    <circle cx="18.6" cy="11.8" r="1.1" fill={MCH} />
  </svg>
);

const Wordmark = ({ size = 26 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Logo size={size + 6} />
    <span style={{ ...DISPLAY, fontSize: size, fontWeight: 700, letterSpacing: '-0.01em' }}>
      Solenne
      <span style={{ fontWeight: 500, color: MUTED, marginLeft: 6 }}>Bio</span>
    </span>
  </div>
);

const Header = ({ section }: { section: string }) => (
  <div
    style={abs(120, 62, {
      width: 1680,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    })}
  >
    <Wordmark />
    <div style={{ ...CAPS, display: 'flex', alignItems: 'center', gap: 14 }}>
      <span>R&amp;D Day 2026</span>
      <span style={{ width: 4, height: 4, borderRadius: 2, background: '#B5C1BF' }} />
      <span style={{ color: 'var(--osd-text)' }}>{section}</span>
    </div>
  </div>
);

const Footer = ({ note }: { note?: ReactNode }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={abs(120, 994, {
        ...LABEL,
        width: 1680,
        paddingTop: 14,
        borderTop: `1px solid ${HAIR}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 40,
      })}
    >
      <span>{note}</span>
      <span style={{ color: 'var(--osd-text)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        {pad(current)}
        <span style={{ color: MUTED }}> / {pad(total)}</span>
      </span>
    </div>
  );
};

const Stage = ({
  section,
  note,
  className,
  chrome = true,
  children,
}: {
  section?: string;
  note?: ReactNode;
  className?: string;
  chrome?: boolean;
  children: ReactNode;
}) => (
  <div
    className={['sn-stage', className].filter(Boolean).join(' ')}
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {chrome && section && <Header section={section} />}
    {children}
    {chrome && <Footer note={note} />}
  </div>
);

const Title = ({
  eyebrow,
  live,
  width = 1680,
  size = 60,
  children,
}: {
  eyebrow: string;
  live: boolean;
  width?: number;
  size?: number;
  children: ReactNode;
}) => (
  <>
    <div style={abs(120, 150, { ...EYEBROW, ...a(live, 'sn-fade 0.9s ease-out 0.05s both') })}>
      {eyebrow}
    </div>
    <h2
      style={{
        ...DISPLAY,
        ...abs(117, 186),
        width,
        fontSize: size,
        lineHeight: 1.08,
        ...a(live, `sn-focus 1.3s ${FLUID} 0.12s both`),
      }}
    >
      {children}
    </h2>
  </>
);

const Swatch = ({ color, ring = false }: { color: string; ring?: boolean }) => (
  <span
    style={{
      width: 12,
      height: 12,
      borderRadius: 6,
      flexShrink: 0,
      background: ring ? 'transparent' : color,
      border: ring ? `2px solid ${color}` : undefined,
      boxSizing: 'border-box',
      boxShadow: ring ? undefined : `0 0 10px ${rgba(color, 0.55)}`,
    }}
  />
);

const Channel = ({ color, label }: { color: string; label: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <Swatch color={color} />
    {label}
  </span>
);

const ScaleBar = ({
  x,
  y,
  w = 96,
  label = '50 µm',
}: {
  x: number;
  y: number;
  w?: number;
  label?: string;
}) => (
  <div style={abs(x, y, { width: w, textAlign: 'center' })}>
    <div style={{ ...LABEL, color: 'rgba(255,255,255,0.72)', marginBottom: 8 }}>{label}</div>
    <div style={{ height: 3, background: 'rgba(255,255,255,0.86)', borderRadius: 2 }} />
  </div>
);

const FluoCell = ({
  live,
  x,
  y,
  w,
  h,
  rot,
  dx = 10,
  dy = -8,
  dr = 3,
  dur = 20,
  delay = 0,
  sma = 0.55,
  nx = 0,
}: {
  live: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  dx?: number;
  dy?: number;
  dr?: number;
  dur?: number;
  delay?: number;
  sma?: number;
  nx?: number;
}) => {
  const nw = h * 1.08;
  const nh = h * 0.64;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `rotate(${rot}deg)`,
        mixBlendMode: 'screen',
      }}
    >
      <div
        style={
          {
            position: 'absolute',
            inset: 0,
            '--dx': `${dx}px`,
            '--dy': `${dy}px`,
            '--dr': `${dr}deg`,
            animation: live ? `sn-drift ${dur}s ${SWAY} ${-delay}s infinite` : undefined,
          } as CSSProperties
        }
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: '50% 50% 46% 54% / 56% 44% 56% 44%',
            background: `radial-gradient(ellipse at 50% 50%, ${rgba(GFP, 0.4)} 0%, ${rgba(GFP, 0.2)} 50%, ${rgba(GFP, 0.07)} 82%, transparent 100%)`,
            boxShadow: `0 0 26px ${rgba(GFP, 0.2)}, inset 0 0 12px ${rgba(GFP, 0.32)}`,
            animation: live
              ? `sn-membrane ${(dur * 0.62).toFixed(1)}s ease-in-out ${-delay}s infinite`
              : undefined,
          }}
        >
          <div
            className="sn-sma"
            style={
              {
                position: 'absolute',
                inset: 0,
                '--sma': sma,
                backgroundImage: `repeating-linear-gradient(177deg, transparent 0 6px, ${rgba(GFP, 0.62)} 6px 7.5px)`,
              } as CSSProperties
            }
          />
        </div>
        <div
          className="sn-punc"
          style={{
            position: 'absolute',
            left: w * 0.2,
            top: h * 0.3,
            width: 7,
            height: 7,
            borderRadius: 4,
            background: MCH,
            boxShadow: `0 0 8px ${MCH}`,
          }}
        />
        <div
          className="sn-punc"
          style={{
            position: 'absolute',
            left: w * 0.74,
            top: h * 0.62,
            width: 6,
            height: 6,
            borderRadius: 3,
            background: MCH,
            boxShadow: `0 0 8px ${MCH}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: w / 2 - nw / 2 + nx,
            top: h / 2 - nh / 2,
            width: nw,
            height: nh,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 58%, rgba(14,24,70,0.4) 0 2px, transparent 3px), radial-gradient(circle at 64% 38%, rgba(14,24,70,0.34) 0 2.5px, transparent 3.5px), radial-gradient(ellipse at 42% 40%, #C3D2FF 0%, #7A9BFF 30%, ${rgba(DAPI, 0.8)} 62%, ${rgba(DAPI, 0.18)} 100%)`,
            boxShadow: `0 0 18px ${rgba(DAPI, 0.55)}`,
            animation: live
              ? `sn-nuc ${(5.5 + (delay % 3)).toFixed(1)}s ease-in-out ${-delay}s infinite`
              : undefined,
          }}
        />
      </div>
    </div>
  );
};

const Nucleus = ({
  live,
  x,
  y,
  w,
  h,
  rot = 0,
  delay = 0,
}: {
  live: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  delay?: number;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      transform: `rotate(${rot}deg)`,
      mixBlendMode: 'screen',
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: `radial-gradient(circle at 60% 40%, rgba(14,24,70,0.35) 0 2px, transparent 3px), radial-gradient(ellipse at 44% 42%, #B4C6FF 0%, #6F91FF 34%, ${rgba(DAPI, 0.6)} 66%, ${rgba(DAPI, 0.1)} 100%)`,
        boxShadow: `0 0 16px ${rgba(DAPI, 0.45)}`,
        animation: live ? `sn-nuc 6.4s ease-in-out ${-delay}s infinite` : undefined,
      }}
    />
  </div>
);

const Fibre = ({ d, w = 2.2, o = 0.85 }: { d: string; w?: number; o?: number }) => (
  <g>
    <path
      className="sn-fib"
      d={d}
      pathLength={1}
      fill="none"
      stroke={MCH}
      strokeOpacity={0.14}
      strokeWidth={w * 5.5}
      strokeLinecap="round"
    />
    <path
      className="sn-fib"
      d={d}
      pathLength={1}
      fill="none"
      stroke={MCH}
      strokeOpacity={o}
      strokeWidth={w}
      strokeLinecap="round"
    />
  </g>
);

const FibroField = ({
  live,
  x = 0,
  y = 0,
  flip = false,
}: {
  live: boolean;
  x?: number;
  y?: number;
  flip?: boolean;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 840,
      height: 760,
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
  >
    <svg
      width={840}
      height={760}
      viewBox="0 0 840 760"
      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      aria-hidden="true"
    >
      <Fibre d="M -20 90 C 180 40 360 170 560 110 S 820 60 880 140" w={2.4} />
      <Fibre d="M -30 260 C 160 210 300 300 520 250 S 760 200 870 280" w={1.8} o={0.7} />
      <Fibre d="M 40 780 C 120 560 260 440 380 300 S 560 60 620 -20" w={2.6} />
      <Fibre d="M 860 420 C 680 380 520 470 340 430 S 80 370 -30 410" w={2} o={0.75} />
      <Fibre d="M -20 600 C 200 640 380 540 560 590 S 800 650 880 600" w={2.4} />
      <Fibre d="M 220 -20 C 260 160 200 320 260 480 S 380 700 360 790" w={1.6} o={0.6} />
      <Fibre d="M 700 -20 C 640 140 720 300 650 460 S 560 680 620 790" w={2.2} />
      <Fibre d="M -20 340 C 120 380 220 520 420 520 S 700 470 870 520" w={1.6} o={0.65} />
      <Fibre d="M 860 160 C 700 240 600 180 480 300 S 300 520 120 560" w={2.8} />
      <Fibre d="M 500 790 C 520 660 460 560 540 440 S 700 300 860 330" w={1.8} o={0.7} />
    </svg>
    <Nucleus live={live} x={486} y={262} w={58} h={40} rot={30} delay={2} />
    <Nucleus live={live} x={796} y={420} w={54} h={38} rot={-20} delay={4} />
    <Nucleus live={live} x={64} y={300} w={50} h={36} rot={10} delay={1} />
    <Nucleus live={live} x={470} y={470} w={46} h={34} rot={-40} delay={3} />
    <FluoCell
      live={live}
      x={170}
      y={170}
      w={250}
      h={80}
      rot={-24}
      dx={12}
      dy={-6}
      dur={19}
      delay={2}
    />
    <FluoCell
      live={live}
      x={470}
      y={130}
      w={230}
      h={70}
      rot={14}
      dx={-10}
      dy={8}
      dur={23}
      delay={7}
      nx={-30}
    />
    <FluoCell
      live={live}
      x={700}
      y={250}
      w={270}
      h={84}
      rot={-50}
      dx={8}
      dy={10}
      dur={21}
      delay={4}
      nx={24}
      sma={0.7}
    />
    <FluoCell
      live={live}
      x={310}
      y={340}
      w={290}
      h={90}
      rot={18}
      dx={-12}
      dy={-8}
      dur={25}
      delay={11}
      nx={-20}
      sma={0.65}
    />
    <FluoCell
      live={live}
      x={590}
      y={420}
      w={240}
      h={76}
      rot={-12}
      dx={10}
      dy={-10}
      dur={20}
      delay={5}
      nx={28}
    />
    <FluoCell
      live={live}
      x={130}
      y={480}
      w={220}
      h={72}
      rot={64}
      dx={-8}
      dy={10}
      dur={24}
      delay={9}
    />
    <FluoCell
      live={live}
      x={390}
      y={575}
      w={270}
      h={82}
      rot={-32}
      dx={12}
      dy={6}
      dur={22}
      delay={3}
      nx={-26}
      sma={0.7}
    />
    <FluoCell
      live={live}
      x={700}
      y={560}
      w={230}
      h={72}
      rot={38}
      dx={-10}
      dy={-8}
      dur={26}
      delay={13}
      nx={20}
    />
    <FluoCell
      live={live}
      x={250}
      y={690}
      w={240}
      h={74}
      rot={6}
      dx={8}
      dy={-6}
      dur={21}
      delay={6}
    />
    <FluoCell
      live={live}
      x={610}
      y={700}
      w={200}
      h={66}
      rot={-58}
      dx={-6}
      dy={8}
      dur={18}
      delay={8}
    />
  </div>
);

const Well = ({
  x,
  y,
  d,
  live,
  delay = 0,
  rim = true,
  children,
}: {
  x: number;
  y: number;
  d: number;
  live: boolean;
  delay?: number;
  rim?: boolean;
  children: ReactNode;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: d,
      height: d,
      ...a(live, `sn-iris 1.6s ${FLUID} ${delay}s both`),
    }}
  >
    {rim && (
      <div
        style={{
          position: 'absolute',
          inset: -18,
          borderRadius: '50%',
          border: `1px solid ${HAIR}`,
        }}
      />
    )}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        isolation: 'isolate',
        background: WELL,
        boxShadow: '0 40px 80px -40px rgba(6, 11, 16, 0.55)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...a(live, `sn-expose 2.4s ease-out ${delay + 0.25}s both`),
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: GRAIN,
          opacity: 0.08,
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle, transparent 56%, rgba(0,0,0,0.5) 84%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      {live && (
        <div
          style={
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 70,
              '--h': `${d + 70}px`,
              background: `linear-gradient(180deg, transparent, ${rgba(CYAN, 0.06)} 80%, ${rgba(CYAN, 0.38)} 100%)`,
              animation: `sn-scan 8s linear ${delay + 2.6}s infinite both`,
            } as CSSProperties
          }
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      />
    </div>
  </div>
);

const TickRing = ({ x, y, d, live }: { x: number; y: number; d: number; live: boolean }) => {
  const r = d / 2;
  const ticks: ReactNode[] = [];
  for (let i = 0; i < 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const major = i % 10 === 0;
    const len = major ? 14 : 6;
    ticks.push(
      <line
        key={i}
        x1={r + Math.cos(t) * (r - len)}
        y1={r + Math.sin(t) * (r - len)}
        x2={r + Math.cos(t) * r}
        y2={r + Math.sin(t) * r}
        stroke={major ? '#93A3A8' : '#BCC8C6'}
        strokeWidth={major ? 1.5 : 1}
      />,
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: d,
        height: d,
        ...a(live, `sn-fade 2s ease-out 0.6s both, sn-turn 240s linear 0s infinite`),
      }}
    >
      <svg width={d} height={d} aria-hidden="true">
        {ticks}
      </svg>
    </div>
  );
};

const Cover: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage chrome={false}>
      <div style={abs(120, 72, a(live, 'sn-fade 1s ease-out 0.1s both'))}>
        <Wordmark size={28} />
      </div>
      <div style={abs(120, 300, { ...EYEBROW, ...a(live, 'sn-fade 1s ease-out 0.3s both') })}>
        R&amp;D Day 2026
      </div>
      <h1
        style={{
          ...DISPLAY,
          ...abs(110, 340),
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 0.96,
          letterSpacing: '-0.04em',
        }}
      >
        <span style={{ display: 'block', ...a(live, `sn-focus 1.6s ${FLUID} 0.4s both`) }}>
          Breathing
        </span>
        <span
          style={{
            display: 'block',
            color: 'var(--osd-accent)',
            ...a(live, `sn-focus 1.6s ${FLUID} 0.62s both`),
          }}
        >
          room.
        </span>
      </h1>
      <p
        style={{
          ...BODY,
          ...abs(120, 712),
          width: 700,
          fontSize: 32,
          lineHeight: 1.45,
          ...a(live, `sn-rise 1.2s ${FLUID} 0.95s both`),
        }}
      >
        Phase 2b results for SLN-214 in idiopathic pulmonary fibrosis, and our path to Phase 3.
      </p>
      <div
        style={abs(120, 922, {
          ...CAPS,
          fontSize: 17,
          display: 'flex',
          gap: 18,
          alignItems: 'center',
          ...a(live, 'sn-fade 1s ease-out 1.3s both'),
        })}
      >
        <span style={{ color: 'var(--osd-text)' }}>22 October 2026</span>
        <span style={{ width: 4, height: 4, borderRadius: 2, background: '#B5C1BF' }} />
        <span>New York</span>
        <span style={{ width: 4, height: 4, borderRadius: 2, background: '#B5C1BF' }} />
        <span>Investor &amp; analyst event</span>
      </div>

      <TickRing x={902} y={92} d={856} live={live} />
      <Well x={950} y={140} d={760} live={live} delay={0.2} rim={false}>
        <FibroField live={live} x={-40} y={0} />
        <ScaleBar x={430} y={668} />
      </Well>
      <div
        style={abs(1180, 984, {
          ...LABEL,
          width: 620,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 26,
          ...a(live, 'sn-fade 1s ease-out 1.6s both'),
        })}
      >
        <Channel color={DAPI} label="DAPI" />
        <Channel color={GFP} label="α-SMA" />
        <Channel color={MCH} label="Collagen I" />
        <span>IPF donor fibroblasts · 20×</span>
      </div>
    </Stage>
  );
};

type Alv = { x: number; y: number; r: number; scar: boolean; delay: number };

const ALVEOLI: Alv[] = (() => {
  const out: Alv[] = [];
  const W = 880;
  const H = 792;
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const i = row * 13 + col;
      const x = col * 76 + (row % 2 ? 38 : 0) + (hash(i) - 0.5) * 12;
      const y = row * 66 + (hash(i + 500) - 0.5) * 12;
      const r = 31 + hash(i + 900) * 7;
      const s = 0.64 * (x / W) + 0.36 * (y / H) + 0.2 * (hash(i + 1300) - 0.5);
      const scar = s > 0.6;
      out.push({ x, y, r, scar, delay: 0.6 + Math.max(0, 1.02 - s) * 9 });
    }
  }
  return out;
})();

const Alveolus = ({ alv, live }: { alv: Alv; live: boolean }) => {
  const breathe = live
    ? { animation: `sn-breathe 4.2s ${SWAY} 0s ${alv.scar ? 1 : 'infinite'}` }
    : {};
  return (
    <g style={{ transformBox: 'fill-box', transformOrigin: 'center', ...breathe }}>
      <circle
        cx={alv.x}
        cy={alv.y}
        r={alv.r}
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          stroke: alv.scar ? MCH : rgba(CYAN, 0.75),
          strokeWidth: alv.scar ? 7 : 2,
          fill: alv.scar ? rgba(MCH, 0.2) : rgba(CYAN, 0.05),
          transform: alv.scar ? 'scale(0.84)' : undefined,
          ...(live && alv.scar
            ? { animation: `sn-scar 1.8s ${FLUID} ${alv.delay.toFixed(2)}s both` }
            : {}),
        }}
      />
    </g>
  );
};

const Stat = ({
  value,
  label,
  live,
  delay,
}: {
  value: string;
  label: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 28,
      padding: '22px 0',
      borderTop: `1px solid ${HAIR}`,
      ...a(live, `sn-rise 1s ${FLUID} ${delay}s both`),
    }}
  >
    <span style={{ ...DISPLAY, fontSize: 56, lineHeight: 1, width: 230, flexShrink: 0 }}>
      {value}
    </span>
    <span style={{ ...BODY, fontSize: 26, lineHeight: 1.35, color: MUTED }}>{label}</span>
  </div>
);

const Disease: Page = () => {
  const live = useIsActivePage();
  const alvs: ReactNode[] = [];
  for (let i = 0; i < ALVEOLI.length; i++) {
    alvs.push(<Alveolus key={i} alv={ALVEOLI[i]} live={live} />);
  }
  return (
    <Stage
      section="The disease"
      note="Survival and FVC figures are literature estimates for untreated IPF. Panel is a schematic."
    >
      <Title eyebrow="Idiopathic pulmonary fibrosis" live={live} width={720}>
        IPF turns the lung’s lattice into scar.
      </Title>
      <p
        style={{
          ...BODY,
          ...abs(120, 372),
          width: 700,
          ...a(live, `sn-rise 1.1s ${FLUID} 0.35s both`),
        }}
      >
        Fibroblasts lay down collagen faster than the lung can clear it. Air sacs stiffen, then
        collapse, and every breath takes more effort.
      </p>
      <div style={abs(120, 604, { width: 720 })}>
        <Stat value="3–5 yrs" label="median survival after diagnosis" live={live} delay={0.55} />
        <Stat
          value="~200 mL"
          label="of lung capacity lost per year, untreated"
          live={live}
          delay={0.7}
        />
        <Stat
          value="2"
          label="approved therapies; both slow decline, neither stops it"
          live={live}
          delay={0.85}
        />
      </div>

      <div
        style={abs(920, 150, {
          width: 880,
          height: 792,
          borderRadius: 'var(--osd-radius)',
          overflow: 'hidden',
          background: WELL,
          isolation: 'isolate',
          ...a(live, `sn-fade 1.2s ease-out 0.1s both`),
        })}
      >
        <svg width={880} height={792} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
          {alvs}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            opacity: 0.06,
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6,11,16,0.94) 0%, rgba(6,11,16,0.6) 9%, rgba(6,11,16,0) 20%), linear-gradient(90deg, rgba(6,11,16,0.92) 0%, rgba(6,11,16,0) 22%), linear-gradient(0deg, rgba(6,11,16,0.94) 0%, rgba(6,11,16,0) 26%)',
          }}
        />
        <div style={abs(36, 32, { ...CAPS, color: 'rgba(255,255,255,0.6)' })}>
          Alveolar lattice · schematic
        </div>
        <div style={abs(700, 26, { width: 144, textAlign: 'right', color: '#fff' })}>
          <div style={{ ...CAPS, color: 'rgba(255,255,255,0.6)' }}>Year</div>
          <div
            className="sn-yr"
            style={{
              ...DISPLAY,
              fontSize: 64,
              lineHeight: 1,
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
              ...a(live, 'sn-yr 4.4s linear 0.6s both'),
            }}
          />
        </div>
        <div
          style={abs(36, 728, {
            ...LABEL,
            color: 'rgba(255,255,255,0.72)',
            display: 'flex',
            gap: 32,
          })}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Swatch color={CYAN} ring />
            Compliant alveolus
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Swatch color={MCH} />
            Collagen-filled, collapsed
          </span>
        </div>
        <div
          style={abs(600, 728, { ...CAPS, width: 244, textAlign: 'right', color: rgba(MCH, 0.9) })}
        >
          Subpleural · basal
        </div>
      </div>
    </Stage>
  );
};

const MECH_UP = 'M 120 70 C 250 80 330 250 428 250 C 540 340 640 340 708 250';
const MECH_DOWN =
  'M 812 250 C 870 160 950 160 1008 250 L 1092 250 C 1124 196 1160 196 1190 250 L 1320 250';

const Pulse = ({
  path,
  dur,
  delay,
  live,
  rest,
  color = CYAN,
}: {
  path: string;
  dur: number;
  delay: number;
  live: boolean;
  rest: number;
  color?: string;
}) => (
  <div
    className="sn-particle"
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: `radial-gradient(circle, #ffffff 0%, ${color} 42%, ${rgba(color, 0)} 74%)`,
      boxShadow: `0 0 20px 4px ${rgba(color, 0.42)}`,
      offsetPath: `path('${path}')`,
      offsetRotate: '0deg',
      offsetDistance: `${rest}%`,
      ...(live ? { animation: `sn-flow ${dur}s ${SWAY} ${delay}s infinite both` } : {}),
    }}
  />
);

const Ligand = ({
  x,
  y,
  live,
  dx,
  dy,
  dur,
}: {
  x: number;
  y: number;
  live: boolean;
  dx: number;
  dy: number;
  dur: number;
}) => (
  <div
    style={
      {
        position: 'absolute',
        left: x - 8,
        top: y - 8,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: `radial-gradient(circle, #ffd1e4 0%, ${MCH} 45%, ${rgba(MCH, 0)} 76%)`,
        boxShadow: `0 0 16px ${rgba(MCH, 0.5)}`,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        animation: live ? `sn-float ${dur}s ${SWAY} infinite` : undefined,
      } as CSSProperties
    }
  />
);

const MechStat = ({ value, label, d }: { value: string; label: string; d: number }) => (
  <div
    className="sn-srise"
    style={{ display: 'flex', alignItems: 'baseline', gap: 18, '--d': `${d}ms` } as CSSProperties}
  >
    <span
      style={{
        ...DISPLAY,
        fontSize: 48,
        fontWeight: 700,
        color: 'var(--osd-accent)',
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    <span style={{ ...LABEL, fontSize: 18, color: SOFT, maxWidth: 300 }}>{label}</span>
  </div>
);

const NodeLabel = ({ x, y, title, sub }: { x: number; y: number; title: string; sub: string }) => (
  <div style={abs(x - 120, y, { width: 240, textAlign: 'center' })}>
    <div style={{ ...LABEL, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{title}</div>
    <div style={{ ...LABEL, color: 'rgba(255,255,255,0.5)' }}>{sub}</div>
  </div>
);

const Mechanism: Page = () => {
  const live = useIsActivePage();
  const PX = 120;
  const PY = 350;
  return (
    <Stage
      section="Mechanism"
      className="sn-mech"
      note="FSK2, fibroblast stress kinase 2. Cellular data in TGF-β1-stimulated primary IPF fibroblasts; selectivity at 1 µM across 380 kinases."
    >
      <Title eyebrow="Mechanism of action" live={live} width={1300}>
        SLN-214 silences the signal that
        <br />
        tells fibroblasts to make scar.
      </Title>
      <div
        style={abs(PX, PY, {
          width: 1680,
          height: 500,
          borderRadius: 'var(--osd-radius)',
          background: WELL,
          overflow: 'hidden',
          isolation: 'isolate',
          ...a(live, 'sn-fade 1.2s ease-out 0.15s both'),
        })}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            opacity: 0.06,
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 428,
            height: 500,
            background: `linear-gradient(90deg, ${rgba(MCH, 0.06)}, transparent)`,
          }}
        />
        <svg
          width={1680}
          height={500}
          style={{ position: 'absolute', inset: 0 }}
          aria-hidden="true"
        >
          <path
            d="M 420 0 C 404 100 436 160 420 250 S 404 400 420 500"
            fill="none"
            stroke={rgba(CYAN, 0.45)}
            strokeWidth={2}
          />
          <path
            d="M 438 0 C 422 100 454 160 438 250 S 422 400 438 500"
            fill="none"
            stroke={rgba(CYAN, 0.45)}
            strokeWidth={2}
          />
          <path
            d={MECH_UP}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.5}
            strokeDasharray="4 7"
          />
          <path
            d={MECH_DOWN}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.5}
            strokeDasharray="4 7"
          />
          <g stroke={CYAN} strokeWidth={5} strokeLinecap="round" fill="none">
            <path d="M 416 224 C 390 214 370 230 370 250 C 370 270 390 286 416 276" />
          </g>
          <rect
            x={417}
            y={204}
            width={24}
            height={92}
            rx={12}
            fill={rgba(CYAN, 0.22)}
            stroke={CYAN}
            strokeWidth={3}
          />
          <circle cx={760} cy={250} r={54} fill={rgba(CYAN, 0.1)} stroke={CYAN} strokeWidth={2} />
          <circle cx={1050} cy={250} r={42} fill={rgba(DAPI, 0.16)} stroke={DAPI} strokeWidth={2} />
          <circle
            cx={1320}
            cy={250}
            r={150}
            fill={rgba(DAPI, 0.14)}
            stroke={rgba(DAPI, 0.8)}
            strokeWidth={2}
            strokeDasharray="10 6"
          />
          <path
            d="M 1222 240 C 1250 210 1266 270 1294 240 S 1338 210 1366 240 S 1394 270 1418 240"
            fill="none"
            stroke={rgba(DAPI, 0.9)}
            strokeWidth={2.5}
          />
          <path
            d="M 1222 240 C 1250 270 1266 210 1294 240 S 1338 270 1366 240 S 1394 210 1418 240"
            fill="none"
            stroke={rgba(CYAN, 0.7)}
            strokeWidth={2.5}
          />
        </svg>
        <div
          className="sn-dim"
          style={abs(1170, 100, {
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${rgba(DAPI, 0.42)} 0%, ${rgba(DAPI, 0.12)} 55%, transparent 72%)`,
          })}
        />
        <div className="sn-dim" style={{ position: 'absolute', inset: 0 }}>
          <svg
            width={1680}
            height={500}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <path
              d="M 1466 210 C 1520 170 1580 250 1700 196"
              pathLength={1}
              fill="none"
              stroke={MCH}
              strokeWidth={3}
              strokeDasharray="0.1 0.05"
              style={live ? { animation: 'sn-secrete 3s linear infinite' } : undefined}
            />
            <path
              d="M 1472 250 C 1530 230 1590 280 1700 252"
              pathLength={1}
              fill="none"
              stroke={MCH}
              strokeWidth={3}
              strokeDasharray="0.12 0.05"
              style={live ? { animation: 'sn-secrete 3.6s linear infinite' } : undefined}
            />
            <path
              d="M 1466 292 C 1530 330 1590 280 1700 318"
              pathLength={1}
              fill="none"
              stroke={MCH}
              strokeWidth={3}
              strokeDasharray="0.09 0.05"
              style={live ? { animation: 'sn-secrete 3.3s linear infinite' } : undefined}
            />
            <path
              d="M 1466 210 C 1520 170 1580 250 1700 196"
              fill="none"
              stroke={rgba(MCH, 0.14)}
              strokeWidth={14}
            />
            <path
              d="M 1466 292 C 1530 330 1590 280 1700 318"
              fill="none"
              stroke={rgba(MCH, 0.14)}
              strokeWidth={14}
            />
          </svg>
        </div>
        <Ligand x={140} y={150} live={live} dx={14} dy={-10} dur={7} />
        <Ligand x={250} y={360} live={live} dx={-12} dy={12} dur={9} />
        <Ligand x={90} y={300} live={live} dx={10} dy={14} dur={8} />
        <Ligand x={320} y={120} live={live} dx={-10} dy={10} dur={10} />
        <Ligand x={190} y={240} live={live} dx={12} dy={-8} dur={7.5} />
        <Ligand x={392} y={250} live={false} dx={0} dy={0} dur={1} />
        <Pulse path={MECH_UP} dur={3} delay={0} live={live} rest={34} />
        <Pulse path={MECH_UP} dur={3} delay={-1} live={live} rest={62} />
        <Pulse path={MECH_UP} dur={3} delay={-2} live={live} rest={90} />
        <div className="sn-down" style={{ position: 'absolute', inset: 0 }}>
          <Pulse path={MECH_DOWN} dur={3} delay={-0.4} live={live} rest={20} />
          <Pulse path={MECH_DOWN} dur={3} delay={-1.4} live={live} rest={52} />
          <Pulse path={MECH_DOWN} dur={3} delay={-2.4} live={live} rest={84} />
        </div>
        <div
          style={abs(720, 236, {
            ...DISPLAY,
            fontWeight: 700,
            fontSize: 24,
            color: '#fff',
            width: 80,
            textAlign: 'center',
            lineHeight: 1.15,
          })}
        >
          FSK2
        </div>
        <div
          style={abs(1010, 238, {
            ...DISPLAY,
            fontWeight: 700,
            fontSize: 20,
            color: '#fff',
            width: 80,
            textAlign: 'center',
            lineHeight: 1.15,
          })}
        >
          FRX
        </div>
        <div style={abs(32, 28, { ...CAPS, color: 'rgba(255,255,255,0.5)' })}>Extracellular</div>
        <div style={abs(470, 28, { ...CAPS, color: 'rgba(255,255,255,0.5)' })}>Cytoplasm</div>
        <div
          style={abs(1200, 138, {
            ...CAPS,
            width: 240,
            textAlign: 'center',
            color: rgba(DAPI, 0.95),
          })}
        >
          Nucleus
        </div>
        <div
          style={abs(1200, 286, {
            ...LABEL,
            width: 240,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.75)',
          })}
        >
          COL1A1 · COL3A1 · ACTA2
        </div>
        <NodeLabel x={330} y={316} title="Receptor" sub="ligand-bound" />
        <NodeLabel x={760} y={322} title="Stress kinase" sub="phospho-relay" />
        <NodeLabel x={1050} y={310} title="Transcription" sub="factor" />
        <div
          style={abs(1440, 410, {
            ...LABEL,
            width: 216,
            color: rgba(MCH, 0.95),
            textAlign: 'right',
          })}
        >
          Collagen secreted
        </div>
        <div style={abs(32, 420, { ...LABEL, width: 260, color: rgba(MCH, 0.9) })}>
          Pro-fibrotic ligand
        </div>
      </div>

      <Steps>
        <Step duration={400}>
          <svg
            width={1680}
            height={500}
            style={{ position: 'absolute', left: PX, top: PY, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <circle
              className="sn-sdraw"
              cx={760}
              cy={250}
              r={68}
              pathLength={1}
              fill="none"
              stroke={GFP}
              strokeWidth={3}
              transform="rotate(-90 760 250)"
            />
            <circle
              cx={760}
              cy={250}
              r={68}
              fill="none"
              stroke={rgba(GFP, 0.18)}
              strokeWidth={14}
            />
          </svg>
          <div className="sn-drug" style={abs(PX + 780, PY + 150, { width: 96, height: 60 })}>
            <svg width={96} height={60} viewBox="0 0 96 60" aria-hidden="true">
              <g stroke={rgba(GFP, 0.8)} strokeWidth={3}>
                <line x1={14} y1={40} x2={40} y2={22} />
                <line x1={40} y1={22} x2={66} y2={36} />
                <line x1={66} y1={36} x2={86} y2={14} />
              </g>
              <circle cx={14} cy={40} r={9} fill={GFP} />
              <circle cx={40} cy={22} r={8} fill="#B9FFD2" />
              <circle cx={66} cy={36} r={9} fill={GFP} />
              <circle cx={86} cy={14} r={7} fill="#B9FFD2" />
            </svg>
          </div>
          <div
            className="sn-srise"
            style={{ ...abs(PX + 880, PY + 136), '--d': '900ms' } as CSSProperties}
          >
            <div style={{ ...CAPS, color: GFP, fontWeight: 500 }}>SLN-214 bound</div>
            <div style={{ ...LABEL, color: 'rgba(255,255,255,0.6)' }}>allosteric pocket</div>
          </div>
        </Step>
        <Step duration={300}>
          <div style={abs(120, 890, { width: 1680, display: 'flex', gap: 96 })}>
            <MechStat value="14 nM" label="cellular IC50, FSK2 phospho-relay" d={0} />
            <MechStat value="−82%" label="COL1A1 transcription at 100 nM" d={160} />
            <MechStat value=">400×" label="selectivity across 380 kinases" d={320} />
          </div>
        </Step>
      </Steps>
    </Stage>
  );
};

const PLATE_X = 1000;
const PLATE_Y = 300;
const PITCH = 60;
const WELL_D = 46;
const HIT_R = 3;
const HIT_C = 6;
const wellCx = (c: number) => PLATE_X + 52 + c * PITCH + PITCH / 2;
const wellCy = (r: number) => PLATE_Y + 44 + r * PITCH + PITCH / 2;
const HITS = ['1-9', '5-2', '6-8'];

const plateSignal = (r: number, c: number) => {
  if (c === 0) return 0.9 + hash(r) * 0.08;
  if (c === 11) return 0.08 + hash(r + 40) * 0.05;
  if (HITS.includes(`${r}-${c}`)) return 0.22 + hash(r * 12 + c) * 0.1;
  const v = hash(r * 12 + c + 7);
  return v < 0.1 ? 0.45 + v : 0.68 + v * 0.3;
};

const wellFill = (s: number) =>
  `radial-gradient(circle at 34% 40%, ${rgba(DAPI, 0.9)} 0 2px, transparent 3px), radial-gradient(circle at 64% 60%, ${rgba(DAPI, 0.8)} 0 2px, transparent 3px), radial-gradient(circle at 58% 30%, ${rgba(DAPI, 0.7)} 0 1.5px, transparent 2.5px), radial-gradient(circle, ${rgba(MCH, s)} 0%, ${rgba(MCH, s * 0.45)} 46%, transparent 72%)`;

const PlateFigure = ({
  value,
  label,
  live,
  delay,
}: {
  value: string;
  label: string;
  live: boolean;
  delay: number;
}) => (
  <div style={{ width: 172, ...a(live, `sn-rise 1s ${FLUID} ${delay}s both`) }}>
    <div style={{ ...DISPLAY, fontSize: 56, lineHeight: 1 }}>{value}</div>
    <div style={{ ...LABEL, fontSize: 18, marginTop: 12 }}>{label}</div>
  </div>
);

const Screen: Page = () => {
  const live = useIsActivePage();
  const wells: ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      if (r === HIT_R && c === HIT_C) continue;
      const s = plateSignal(r, c);
      wells.push(
        <div
          key={`${r}-${c}`}
          style={abs(wellCx(c) - WELL_D / 2, wellCy(r) - WELL_D / 2, {
            width: WELL_D,
            height: WELL_D,
            borderRadius: '50%',
            background: WELL,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7), 0 0 0 1px rgba(12,26,36,0.06)',
          })}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: wellFill(s),
              ...a(live, `sn-lit 0.9s ${FLUID} ${(0.35 + c * 0.09 + r * 0.012).toFixed(3)}s both`),
            }}
          />
        </div>,
      );
    }
  }
  const rowLabels: ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    rowLabels.push(
      <div
        key={r}
        style={abs(PLATE_X + 18, wellCy(r) - 11, { ...LABEL, width: 20, textAlign: 'center' })}
      >
        {'ABCDEFGH'[r]}
      </div>,
    );
  }
  const colLabels: ReactNode[] = [];
  for (let c = 0; c < 12; c++) {
    colLabels.push(
      <div
        key={c}
        style={abs(wellCx(c) - 15, PLATE_Y + 14, { ...LABEL, width: 30, textAlign: 'center' })}
      >
        {c + 1}
      </div>,
    );
  }
  const hx = wellCx(HIT_C);
  const hy = wellCy(HIT_R);
  return (
    <Stage
      section="Discovery"
      note="Columns 1 and 12: stimulated and unstimulated controls. Representative plate, illustrative."
    >
      <Title eyebrow="Phenotypic screen" live={live} width={760}>
        One well in 2,416
        <br />
        stopped the scar.
      </Title>
      <p
        style={{
          ...BODY,
          ...abs(120, 372),
          width: 740,
          ...a(live, `sn-rise 1.1s ${FLUID} 0.35s both`),
        }}
      >
        We treated fibroblasts from 18 IPF donors with 2,416 compounds and imaged how much collagen
        each well laid down.
      </p>
      <div
        style={abs(120, 600, {
          width: 760,
          display: 'flex',
          gap: 24,
          paddingTop: 30,
          borderTop: `1px solid ${HAIR}`,
        })}
      >
        <PlateFigure value="2,416" label="compounds screened" live={live} delay={0.55} />
        <PlateFigure value="38" label="hits, collagen halved" live={live} delay={0.67} />
        <PlateFigure value="7" label="confirmed in all 18 donors" live={live} delay={0.79} />
        <PlateFigure value="1" label="lead series, FSK2" live={live} delay={0.91} />
      </div>

      <div
        style={abs(PLATE_X, PLATE_Y, {
          width: 800,
          height: 552,
          background: '#E6ECEA',
          border: `1px solid ${HAIR}`,
          borderRadius: 'var(--osd-radius)',
          clipPath: 'polygon(28px 0, 100% 0, 100% 100%, 0 100%, 0 28px)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
          ...a(live, `sn-fade 0.9s ease-out 0.1s both`),
        })}
      />
      {rowLabels}
      {colLabels}
      {wells}
      <MorphElement id="sn-zoom-well">
        <div
          style={abs(hx - WELL_D / 2, hy - WELL_D / 2, {
            width: WELL_D,
            height: WELL_D,
            borderRadius: WELL_D / 2,
            background: WELL,
          })}
        />
      </MorphElement>
      <div
        style={abs(hx - WELL_D / 2, hy - WELL_D / 2, {
          width: WELL_D,
          height: WELL_D,
          borderRadius: '50%',
          background: wellFill(0.06),
          ...a(live, `sn-lit 0.9s ${FLUID} ${(0.35 + HIT_C * 0.09).toFixed(3)}s both`),
        })}
      />
      {live && (
        <div
          className="sn-particle"
          style={abs(PLATE_X + 52, PLATE_Y + 44, {
            width: 60,
            height: 480,
            '--w': '720px',
            background: `linear-gradient(90deg, transparent, ${rgba('#0A8F7F', 0.22)}, transparent)`,
            animation: 'sn-sweep 1.5s linear 0.3s both',
          } as CSSProperties)}
        />
      )}
      <svg
        width={100}
        height={100}
        style={abs(hx - 50, hy - 50, { overflow: 'visible' })}
        aria-hidden="true"
      >
        <circle
          cx={50}
          cy={50}
          r={33}
          pathLength={1}
          fill="none"
          stroke="var(--osd-accent)"
          strokeWidth={3}
          strokeDasharray={1}
          transform="rotate(-90 50 50)"
          style={live ? { animation: `sn-draw 1.1s ${FLUID} 1.7s both` } : undefined}
        />
      </svg>
      {live && (
        <div
          style={abs(hx - 33, hy - 33, {
            width: 66,
            height: 66,
            borderRadius: '50%',
            border: '2px solid var(--osd-accent)',
            animation: `sn-ripple 3.2s ${EASE_OUT} 2.6s infinite both`,
          })}
        />
      )}
      <div
        style={abs(PLATE_X, 880, {
          ...LABEL,
          fontSize: 17,
          width: 800,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...a(live, 'sn-fade 1s ease-out 2s both'),
        })}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--osd-text)',
          }}
        >
          <Swatch color="#0A8F7F" ring />
          D7 · SLN-214 parent, 1 µM · collagen I −91%
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          Collagen I
          <span
            style={{
              width: 110,
              height: 10,
              borderRadius: 5,
              background: `linear-gradient(90deg, ${WELL}, ${MCH})`,
            }}
          />
        </span>
      </div>
    </Stage>
  );
};

const ZoomFigure = ({ value, label }: { value: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
    <span
      style={{
        ...DISPLAY,
        fontSize: 52,
        fontWeight: 700,
        color: 'var(--osd-accent)',
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    <span style={{ ...LABEL, fontSize: 18, color: SOFT, width: 250 }}>{label}</span>
  </div>
);

const HalfLabel = ({ tag, title }: { tag: string; title: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
    <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 26, color: '#fff' }}>{tag}</span>
    <span style={{ ...LABEL, fontSize: 18, color: 'rgba(255,255,255,0.82)' }}>{title}</span>
  </div>
);

const TimeChip = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={className}
    style={{
      ...LABEL,
      position: 'absolute',
      left: 0,
      top: 0,
      padding: '4px 12px',
      borderRadius: 999,
      border: `1px solid ${rgba(GFP, 0.6)}`,
      color: GFP,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

const Zoom: Page = () => {
  const live = useIsActivePage();
  const land = (extra = 0) =>
    a(live, `sn-fade 0.9s ease-out ${(MORPH_MS / 1000 + extra).toFixed(2)}s both`);
  return (
    <Stage
      section="Discovery"
      className="sn-zoom"
      note="Primary IPF fibroblasts, TGF-β1 stimulated, 72 h. Mean of 6 donors × 3 fields; p < 0.01 vs vehicle (paired t-test). Micrographs illustrative."
    >
      <Title eyebrow="Inside well D7" live={live}>
        In patient cells, the scar recedes.
      </Title>
      <MorphElement id="sn-zoom-well">
        <div
          style={abs(120, 300, {
            width: 1680,
            height: 560,
            borderRadius: 20,
            background: WELL,
          })}
        />
      </MorphElement>
      <div
        style={abs(120, 300, {
          width: 1680,
          height: 560,
          borderRadius: 20,
          overflow: 'hidden',
          isolation: 'isolate',
          ...land(),
        })}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 840,
            height: 560,
            overflow: 'hidden',
            isolation: 'isolate',
          }}
        >
          <FibroField live={live} y={-100} />
        </div>
        <div
          className="sn-right"
          style={{
            position: 'absolute',
            left: 840,
            top: 0,
            width: 840,
            height: 560,
            overflow: 'hidden',
            isolation: 'isolate',
          }}
        >
          <FibroField live={live} x={0} y={-120} flip />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            opacity: 0.07,
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6,11,16,0.78) 0%, rgba(6,11,16,0) 18%, rgba(6,11,16,0) 82%, rgba(6,11,16,0.78) 100%)',
          }}
        />
        <div style={abs(839, 0, { width: 2, height: 560, background: 'rgba(255,255,255,0.22)' })} />
        <div style={abs(36, 28)}>
          <HalfLabel tag="a" title="Vehicle · 72 h" />
        </div>
        <div style={abs(876, 28)}>
          <HalfLabel tag="b" title="SLN-214 · 100 nM" />
        </div>
        <div
          style={abs(36, 506, {
            ...LABEL,
            color: 'rgba(255,255,255,0.75)',
            display: 'flex',
            gap: 26,
          })}
        >
          <Channel color={DAPI} label="DAPI" />
          <Channel color={GFP} label="α-SMA" />
          <Channel color={MCH} label="Collagen I" />
        </div>
        <ScaleBar x={1548} y={486} />
      </div>
      <div style={abs(120 + 876 + 290, 324, land(0.1))}>
        <TimeChip className="sn-t0">t = 0 h</TimeChip>
      </div>
      <Steps>
        <Step duration={500}>
          <div style={abs(120 + 876 + 290, 324)}>
            <TimeChip className="sn-t72">t = 72 h</TimeChip>
          </div>
          <div style={abs(120, 896, { width: 1680, display: 'flex', gap: 110 })}>
            <div className="sn-srise" style={{ '--d': '900ms' } as CSSProperties}>
              <ZoomFigure value="−58%" label="collagen I area vs vehicle" />
            </div>
            <div className="sn-srise" style={{ '--d': '1100ms' } as CSSProperties}>
              <ZoomFigure value="−71%" label="α-SMA⁺ myofibroblasts" />
            </div>
            <div className="sn-srise" style={{ '--d': '1300ms' } as CSSProperties}>
              <ZoomFigure value="6 / 6" label="donors responded" />
            </div>
          </div>
        </Step>
      </Steps>
    </Stage>
  );
};

type El = 'C' | 'N' | 'O' | 'F';
type Atom = { el: El; p: [number, number, number] };

const MOL = (() => {
  const atoms: Atom[] = [];
  const bonds: [number, number][] = [];
  const add = (el: El, x: number, y: number, z = 0) => atoms.push({ el, p: [x, y, z] }) - 1;
  const deg = (d: number) => (d * Math.PI) / 180;

  const ringA: number[] = [];
  for (let k = 0; k < 6; k++) {
    const t = deg(k * 60);
    ringA.push(add(k === 2 ? 'N' : 'C', -3.3 + 1.39 * Math.cos(t), 0.3 + 1.39 * Math.sin(t)));
  }
  for (let k = 0; k < 6; k++) bonds.push([ringA[k], ringA[(k + 1) % 6]]);
  const cf = add('C', -6.19, 0.3);
  bonds.push([ringA[3], cf]);
  bonds.push([cf, add('F', -6.7, 1.28, 0.42)]);
  bonds.push([cf, add('F', -6.7, -0.2, 1.08)]);
  bonds.push([cf, add('F', -6.7, -0.18, -1.08)]);

  const mc = add('C', -0.45, 0.62);
  bonds.push([ringA[0], mc]);
  bonds.push([mc, add('O', -0.02, 1.78)]);
  const mn = add('N', 0.42, -0.42);
  bonds.push([mc, mn]);

  const tilt = deg(35);
  const ringB: number[] = [];
  for (let k = 0; k < 6; k++) {
    const t = deg(k * 60);
    const ly = 1.39 * Math.sin(t);
    ringB.push(add('C', 3.2 + 1.39 * Math.cos(t), -0.8 + ly * Math.cos(tilt), ly * Math.sin(tilt)));
  }
  for (let k = 0; k < 6; k++) bonds.push([ringB[k], ringB[(k + 1) % 6]]);
  bonds.push([mn, ringB[3]]);
  const b5 = atoms[ringB[5]].p;
  const v = [b5[0] - 3.2, b5[1] + 0.8, b5[2]];
  const vl = Math.hypot(v[0], v[1], v[2]);
  bonds.push([
    ringB[5],
    add('F', b5[0] + (v[0] / vl) * 1.35, b5[1] + (v[1] / vl) * 1.35, b5[2] + (v[2] / vl) * 1.35),
  ]);

  const ringC: number[] = [];
  for (let k = 0; k < 6; k++) {
    const t = deg(180 + 60 * k);
    ringC.push(
      add(
        k === 0 || k === 3 ? 'N' : 'C',
        7.45 + 1.45 * Math.cos(t),
        -0.8 + (k % 2 === 0 ? 0.25 : -0.25),
        1.45 * Math.sin(t),
      ),
    );
  }
  for (let k = 0; k < 6; k++) bonds.push([ringC[k], ringC[(k + 1) % 6]]);
  bonds.push([ringB[0], ringC[0]]);
  const d0 = add('C', 10.15, -1.6, 0.35);
  bonds.push([ringC[3], d0]);
  bonds.push([d0, add('O', 11.25, -0.75, 0.6)]);

  const S = 40;
  const n = atoms.length;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const at of atoms) {
    cx += at.p[0] / n;
    cy += at.p[1] / n;
    cz += at.p[2] / n;
  }
  const pts = atoms.map((at) => ({
    el: at.el,
    x: (at.p[0] - cx) * S,
    y: -(at.p[1] - cy) * S,
    z: (at.p[2] - cz) * S,
  }));
  const sticks = bonds.map(([i, j]) => {
    const A = pts[i];
    const B = pts[j];
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const dz = B.z - A.z;
    const len = Math.hypot(dx, dy, dz);
    const rz = (Math.asin(dy / len) * 180) / Math.PI;
    const ry = (Math.atan2(-dz / len, dx / len) * 180) / Math.PI;
    return { x: A.x, y: A.y, z: A.z, len, rz, ry };
  });
  return { pts, sticks };
})();

const ATOM_STYLE: Record<El, { d: number; c: string; hi: string }> = {
  C: { d: 26, c: '#9FB2BA', hi: '#F2F7F8' },
  N: { d: 28, c: DAPI, hi: '#D6E0FF' },
  O: { d: 28, c: MCH, hi: '#FFD9E8' },
  F: { d: 24, c: GFP, hi: '#E2FFEC' },
};

const SPIN_S = 40;
const REST_DEG = 28;

const Molecule = ({ live }: { live: boolean }) => {
  const nodes: ReactNode[] = [];
  MOL.sticks.forEach((s, i) => {
    for (const k of [0, 1]) {
      nodes.push(
        <div
          key={`b${i}-${k}`}
          style={{
            position: 'absolute',
            left: 0,
            top: -3,
            width: s.len,
            height: 6,
            borderRadius: 3,
            background: 'rgba(196, 212, 218, 0.42)',
            transformOrigin: '0 50%',
            transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateY(${s.ry}deg) rotateZ(${s.rz}deg)${k ? ' rotateX(90deg)' : ''}`,
          }}
        />,
      );
    }
  });
  MOL.pts.forEach((p, i) => {
    const st = ATOM_STYLE[p.el];
    nodes.push(
      <div
        key={`a${i}`}
        style={
          {
            position: 'absolute',
            left: -st.d / 2,
            top: -st.d / 2,
            width: st.d,
            height: st.d,
            borderRadius: '50%',
            background: `radial-gradient(circle at 34% 30%, ${st.hi} 0%, ${st.c} 46%, ${rgba(st.c === '#9FB2BA' ? '#3D4E56' : st.c, 0.75)} 100%)`,
            boxShadow: p.el === 'C' ? undefined : `0 0 14px ${rgba(st.c, 0.55)}`,
            '--x': `${p.x}px`,
            '--y': `${p.y}px`,
            '--z': `${p.z}px`,
            transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateY(${-REST_DEG}deg) rotateX(16deg)`,
            animation: live ? `sn-face ${SPIN_S}s linear infinite` : undefined,
          } as CSSProperties
        }
      />,
    );
  });
  return (
    <div style={{ position: 'absolute', left: '50%', top: '46%', perspective: 1600 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformStyle: 'preserve-3d',
          transform: `rotateX(-16deg) rotateY(${REST_DEG}deg)`,
          animation: live ? `sn-spin3d ${SPIN_S}s linear infinite` : undefined,
        }}
      >
        {nodes}
      </div>
    </div>
  );
};

const PropRow = ({
  label,
  value,
  live,
  delay,
}: {
  label: string;
  value: ReactNode;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      padding: '17px 0',
      borderTop: `1px solid ${HAIR}`,
      ...a(live, `sn-rise 0.9s ${FLUID} ${delay}s both`),
    }}
  >
    <span style={{ ...CAPS, width: 270, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>{value}</span>
  </div>
);

const Molecule3D: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage
      section="The molecule"
      note="Lung and plasma exposure from rat inhalation toxicology study, 28 days. Structure shown is representative."
    >
      <Well x={200} y={180} d={760} live={live} delay={0.05}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 46%, ${rgba(CYAN, 0.1)} 0%, transparent 55%)`,
          }}
        />
        <Molecule live={live} />
        <div
          style={abs(0, 600, {
            width: 760,
            textAlign: 'center',
            ...LABEL,
            color: 'rgba(255,255,255,0.62)',
          })}
        >
          SLN-214 · C₁₈H₁₈F₄N₄O₂
        </div>
        <div
          style={abs(0, 640, {
            width: 760,
            display: 'flex',
            justifyContent: 'center',
            gap: 22,
            ...LABEL,
            color: 'rgba(255,255,255,0.62)',
          })}
        >
          <Channel color="#C6D3D8" label="C" />
          <Channel color={DAPI} label="N" />
          <Channel color={MCH} label="O" />
          <Channel color={GFP} label="F" />
        </div>
      </Well>
      <div style={abs(1060, 196, { ...EYEBROW, ...a(live, 'sn-fade 0.9s ease-out 0.05s both') })}>
        SLN-214
      </div>
      <h2
        style={{
          ...DISPLAY,
          ...abs(1057, 232),
          width: 740,
          fontSize: 64,
          lineHeight: 1.06,
          ...a(live, `sn-focus 1.3s ${FLUID} 0.12s both`),
        }}
      >
        Built to stay in the lung.
      </h2>
      <div style={abs(1060, 420, { width: 740 })}>
        <PropRow label="Target" value="FSK2, allosteric" live={live} delay={0.4} />
        <PropRow label="Molecular weight" value="398.4 Da" live={live} delay={0.5} />
        <PropRow label="Formulation" value="Dry-powder inhaler" live={live} delay={0.6} />
        <PropRow label="Dosing" value="Once daily" live={live} delay={0.7} />
        <PropRow label="Lung : plasma AUC" value={<>38 : 1</>} live={live} delay={0.8} />
        <PropRow label="Lung half-life" value="26 h" live={live} delay={0.9} />
      </div>
    </Stage>
  );
};

type Seg = { x1: number; y1: number; x2: number; y2: number; d: number };

const AIRWAY = (() => {
  const SP = [0.8, 0.45, 0.42, 0.42, 0.4, 0.38];
  const LEN = [121, 130, 97, 78, 63, 50, 39];
  const segs: Seg[] = [];
  const leaves: { x: number; y: number; path: string }[] = [];
  const grow = (x: number, y: number, ang: number, depth: number, id: number, trail: string) => {
    const len = LEN[depth];
    const x2 = x + Math.sin(ang) * len;
    const y2 = y + Math.cos(ang) * len;
    segs.push({ x1: x, y1: y, x2, y2, d: depth });
    const t = `${trail} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    if (depth === 6) {
      leaves.push({ x: x2, y: y2, path: t });
      return;
    }
    const s = SP[depth];
    const asym = (((id * 7) % 5) - 2) * 0.04;
    grow(x2, y2, ang - s + asym, depth + 1, id * 2, t);
    grow(x2, y2, ang + s + asym, depth + 1, id * 2 + 1, t);
  };
  grow(450, 0, 0, 0, 1, 'M 450 0');
  return { segs, leaves };
})();

const AIR_W = [16, 12, 9, 6.5, 4.5, 3, 2];

const Airways = ({ live }: { live: boolean }) => {
  const outer: ReactNode[] = [];
  const inner: ReactNode[] = [];
  AIRWAY.segs.forEach((s, i) => {
    const draw = live
      ? {
          strokeDasharray: 1,
          animation: `sn-draw 0.8s ${FLUID} ${(0.2 + s.d * 0.24).toFixed(2)}s both`,
        }
      : {};
    outer.push(
      <line
        key={`o${i}`}
        x1={s.x1}
        y1={s.y1}
        x2={s.x2}
        y2={s.y2}
        pathLength={1}
        stroke={rgba(CYAN, s.d < 4 ? 0.55 : 0.6)}
        strokeWidth={AIR_W[s.d]}
        strokeLinecap="round"
        style={draw}
      />,
    );
    if (s.d < 4) {
      inner.push(
        <line
          key={`i${i}`}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          pathLength={1}
          stroke={WELL}
          strokeWidth={AIR_W[s.d] - 4}
          strokeLinecap="round"
          style={draw}
        />,
      );
    }
  });
  const sacs: ReactNode[] = [];
  AIRWAY.leaves.forEach((l, i) => {
    sacs.push(
      <circle
        key={`s${i}`}
        cx={l.x}
        cy={l.y}
        r={7}
        fill={rgba(GFP, 0.55)}
        style={
          live
            ? { animation: `sn-fill 3s ease-out ${(2.6 + hash(i) * 3).toFixed(2)}s both` }
            : undefined
        }
      />,
    );
  });
  return (
    <svg width={900} height={640} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <g opacity={0.9}>{sacs}</g>
      {outer}
      {inner}
    </svg>
  );
};

const Particle = ({ leaf, i, live }: { leaf: number; i: number; live: boolean }) => {
  const l = AIRWAY.leaves[leaf];
  const dur = 4.4 + hash(i + 30) * 1.4;
  return (
    <div
      className="sn-particle"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: '#D9FFE6',
        boxShadow: `0 0 10px 3px ${rgba(GFP, 0.65)}`,
        offsetPath: `path('${l.path}')`,
        offsetRotate: '0deg',
        offsetDistance: `${(28 + ((i * 37) % 64)).toFixed(0)}%`,
        ...(live
          ? {
              animation: `sn-flow ${dur.toFixed(2)}s cubic-bezier(0.3, 0, 0.6, 1) ${(1.7 + i * 0.29).toFixed(2)}s infinite both`,
            }
          : {}),
      }}
    />
  );
};

const DepRow = ({
  color,
  label,
  value,
  live,
  delay,
}: {
  color: string;
  label: string;
  value: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      padding: '14px 0',
      borderTop: `1px solid ${HAIR}`,
      ...a(live, `sn-rise 0.9s ${FLUID} ${delay}s both`),
    }}
  >
    <span style={{ width: 14, height: 14, borderRadius: 4, background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 28, flex: 1 }}>{label}</span>
    <span style={{ fontFamily: MONO, fontSize: 26, fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </span>
  </div>
);

const DepSeg = ({
  w,
  color,
  live,
  delay,
}: {
  w: number;
  color: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      width: w,
      height: '100%',
      background: color,
      ...a(live, `sn-grow 1s ${FLUID} ${delay}s both`),
    }}
  />
);

const Delivery: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage
      section="Delivery"
      note="Gamma scintigraphy, ⁹⁹ᵐTc-labelled SLN-214 dry powder, n = 12 healthy volunteers. MMAD 2.1 µm. Airway tree schematic."
    >
      <Title eyebrow="Inhaled, once daily" live={live}>
        Delivered to where the disease lives.
      </Title>
      <div
        style={abs(120, 300, {
          width: 900,
          height: 640,
          borderRadius: 'var(--osd-radius)',
          background: WELL,
          overflow: 'hidden',
          isolation: 'isolate',
          ...a(live, 'sn-fade 1s ease-out 0.1s both'),
        })}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            opacity: 0.06,
            mixBlendMode: 'screen',
          }}
        />
        <Airways live={live} />
        <Particle leaf={2} i={0} live={live} />
        <Particle leaf={7} i={1} live={live} />
        <Particle leaf={12} i={2} live={live} />
        <Particle leaf={18} i={3} live={live} />
        <Particle leaf={22} i={4} live={live} />
        <Particle leaf={27} i={5} live={live} />
        <Particle leaf={31} i={6} live={live} />
        <Particle leaf={35} i={7} live={live} />
        <Particle leaf={40} i={8} live={live} />
        <Particle leaf={44} i={9} live={live} />
        <Particle leaf={49} i={10} live={live} />
        <Particle leaf={53} i={11} live={live} />
        <Particle leaf={58} i={12} live={live} />
        <Particle leaf={62} i={13} live={live} />
        <Particle leaf={5} i={14} live={live} />
        <Particle leaf={38} i={15} live={live} />
        <div style={abs(476, 40, { ...CAPS, color: 'rgba(255,255,255,0.55)' })}>Trachea</div>
        <div style={abs(32, 592, { ...CAPS, color: 'rgba(255,255,255,0.55)' })}>
          Bronchioles → alveoli
        </div>
        <div
          style={abs(620, 592, { ...LABEL, width: 248, textAlign: 'right', color: rgba(GFP, 0.9) })}
        >
          ● SLN-214 particles
        </div>
      </div>

      <div style={abs(1100, 300, { width: 700 })}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 20,
            ...a(live, `sn-focus 1.3s ${FLUID} 0.5s both`),
          }}
        >
          <span
            style={{
              ...DISPLAY,
              fontSize: 150,
              lineHeight: 0.9,
              color: 'var(--osd-accent)',
              letterSpacing: '-0.04em',
            }}
          >
            58%
          </span>
        </div>
        <p
          style={{
            ...BODY,
            marginTop: 22,
            width: 640,
            ...a(live, `sn-rise 1s ${FLUID} 0.7s both`),
          }}
        >
          of the emitted dose deposits in the lungs, most of it in the periphery where IPF begins.
        </p>
        <div
          style={{
            marginTop: 44,
            height: 26,
            borderRadius: 13,
            overflow: 'hidden',
            display: 'flex',
            background: '#E3E9E8',
          }}
        >
          <DepSeg w={287} color="var(--osd-accent)" live={live} delay={0.9} />
          <DepSeg w={119} color={MINT} live={live} delay={1.15} />
          <DepSeg w={238} color="#B8C3C6" live={live} delay={1.4} />
          <DepSeg w={56} color="#DCE3E2" live={live} delay={1.65} />
        </div>
        <div style={{ marginTop: 24 }}>
          <DepRow
            color="var(--osd-accent)"
            label="Peripheral lung"
            value="41%"
            live={live}
            delay={1.0}
          />
          <DepRow color={MINT} label="Central airways" value="17%" live={live} delay={1.12} />
          <DepRow color="#B8C3C6" label="Oropharynx" value="34%" live={live} delay={1.24} />
          <DepRow color="#DCE3E2" label="Exhaled" value="8%" live={live} delay={1.36} />
        </div>
      </div>
    </Stage>
  );
};

const WK_X0 = 700;
const WK_X1 = 1560;
const wkX = (w: number) => WK_X0 + ((WK_X1 - WK_X0) * w) / 52;
const VISITS = [0, 4, 12, 26, 39, 52];

const Arm = ({
  y,
  color,
  name,
  n,
  live,
  delay,
}: {
  y: number;
  color: string;
  name: string;
  n: string;
  live: boolean;
  delay: number;
}) => {
  const draw = (d: number, dur = 1.4) =>
    live ? { strokeDasharray: 1, animation: `sn-draw ${dur}s ${FLUID} ${d.toFixed(2)}s both` } : {};
  const dots: ReactNode[] = [];
  for (const w of VISITS) {
    const t = delay + 0.7 + (w / 52) * 1.2;
    dots.push(
      <circle
        key={w}
        cx={wkX(w)}
        cy={y}
        r={8}
        fill={w === 52 ? color : 'var(--osd-bg)'}
        stroke={color}
        strokeWidth={3}
        style={{
          transformBox: 'fill-box',
          transformOrigin: 'center',
          ...(live ? { animation: `sn-pop 0.6s ${FLUID} ${t.toFixed(2)}s both` } : {}),
        }}
      />,
    );
  }
  return (
    <>
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden="true"
      >
        <path
          d={`M 540 560 C 610 560 620 ${y} ${WK_X0 - 10} ${y}`}
          pathLength={1}
          fill="none"
          stroke={color}
          strokeWidth={3}
          style={draw(delay, 0.8)}
        />
        <line
          x1={wkX(0)}
          y1={y}
          x2={wkX(52)}
          y2={y}
          pathLength={1}
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          style={draw(delay + 0.6, 1.5)}
        />
        <path
          d={`M ${wkX(52) + 12} ${y} C ${wkX(52) + 40} ${y} ${wkX(52) + 40} 560 ${wkX(52) + 70} 560`}
          pathLength={1}
          fill="none"
          stroke={HAIR}
          strokeWidth={2}
          style={draw(delay + 1.9, 0.6)}
        />
        {dots}
      </svg>
      <div
        style={abs(WK_X0, y - 54, {
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          ...a(live, `sn-fade 0.8s ease-out ${(delay + 0.5).toFixed(2)}s both`),
        })}
      >
        <span style={{ fontSize: 26, fontWeight: 500 }}>{name}</span>
        <span style={LABEL}>{n}</span>
      </div>
    </>
  );
};

const Criterion = ({
  label,
  text,
  live,
  delay,
}: {
  label: string;
  text: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      flex: 1,
      paddingTop: 20,
      borderTop: `1px solid ${HAIR}`,
      ...a(live, `sn-rise 1s ${FLUID} ${delay}s both`),
    }}
  >
    <div style={CAPS}>{label}</div>
    <div style={{ fontSize: 28, lineHeight: 1.3, marginTop: 10 }}>{text}</div>
  </div>
);

const Design: Page = () => {
  const live = useIsActivePage();
  const ticks: ReactNode[] = [];
  for (const w of VISITS) {
    ticks.push(
      <div key={w} style={abs(wkX(w) - 30, 772, { ...LABEL, width: 60, textAlign: 'center' })}>
        {w}
      </div>,
    );
  }
  return (
    <Stage
      section="Phase 2b"
      note="FIBRA-2: randomised, double-blind, placebo-controlled; stratified by background antifibrotic use. QD, once daily; OLE, open-label extension."
    >
      <Title eyebrow="FIBRA-2 trial design" live={live}>
        312 patients, three arms, 52 weeks.
      </Title>
      <div
        style={abs(120, 510, {
          width: 220,
          height: 100,
          borderRadius: 'var(--osd-radius)',
          border: `1px solid ${HAIR}`,
          background: '#FAFCFB',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 28,
          boxSizing: 'border-box',
          ...a(live, `sn-rise 0.9s ${FLUID} 0.2s both`),
        })}
      >
        <div style={CAPS}>Screened</div>
        <div style={{ ...DISPLAY, fontSize: 36, marginTop: 4 }}>468</div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <line
          x1={340}
          y1={560}
          x2={400}
          y2={560}
          pathLength={1}
          stroke={HAIR}
          strokeWidth={2}
          style={
            live ? { strokeDasharray: 1, animation: `sn-draw 0.5s ${FLUID} 0.5s both` } : undefined
          }
        />
        <line
          x1={wkX(52)}
          y1={360}
          x2={wkX(52)}
          y2={740}
          stroke="var(--osd-accent)"
          strokeWidth={1.5}
          strokeDasharray="4 6"
          style={live ? { animation: 'sn-fade 0.8s ease-out 2.4s both' } : undefined}
        />
        <line
          x1={WK_X0}
          y1={756}
          x2={WK_X1}
          y2={756}
          stroke={HAIR}
          strokeWidth={1}
          style={live ? { animation: 'sn-fade 0.8s ease-out 0.8s both' } : undefined}
        />
      </svg>
      <div
        style={abs(400, 490, {
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: WELL,
          boxShadow: '0 20px 40px -20px rgba(6,11,16,0.5)',
          ...a(live, `sn-iris 1s ${FLUID} 0.55s both`),
        })}
      >
        <div
          style={abs(36, 52, {
            width: 12,
            height: 12,
            borderRadius: 6,
            background: PLACEBO,
            boxShadow: `0 0 10px ${PLACEBO}`,
          })}
        />
        <div
          style={abs(64, 52, {
            width: 12,
            height: 12,
            borderRadius: 6,
            background: DOSE30,
            boxShadow: `0 0 10px ${DOSE30}`,
          })}
        />
        <div
          style={abs(92, 52, {
            width: 12,
            height: 12,
            borderRadius: 6,
            background: '#19C2AC',
            boxShadow: '0 0 10px #19C2AC',
          })}
        />
        <div
          style={abs(0, 78, {
            ...LABEL,
            width: 140,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.8)',
          })}
        >
          1 : 1 : 1
        </div>
      </div>
      <div
        style={abs(370, 652, {
          width: 200,
          textAlign: 'center',
          ...a(live, 'sn-fade 0.8s ease-out 0.9s both'),
        })}
      >
        <div style={CAPS}>Randomised</div>
        <div style={{ ...DISPLAY, fontSize: 36, marginTop: 4 }}>N = 312</div>
      </div>
      <Arm y={420} color={PLACEBO} name="Placebo" n="n = 104" live={live} delay={0.9} />
      <Arm y={560} color={DOSE30} name="SLN-214 30 mg QD" n="n = 104" live={live} delay={1.05} />
      <Arm
        y={700}
        color="var(--osd-accent)"
        name="SLN-214 60 mg QD"
        n="n = 104"
        live={live}
        delay={1.2}
      />
      <div
        style={abs(wkX(52) - 150, 318, {
          width: 300,
          textAlign: 'center',
          ...a(live, 'sn-fade 0.8s ease-out 2.6s both'),
        })}
      >
        <div style={{ ...CAPS, color: 'var(--osd-accent)' }}>Primary endpoint</div>
      </div>
      <div style={abs(wkX(52) + 82, 532, { ...a(live, 'sn-fade 0.8s ease-out 3s both') })}>
        <div style={{ ...DISPLAY, fontSize: 30 }}>OLE</div>
        <div style={LABEL}>94% rolled over</div>
      </div>
      <div style={a(live, 'sn-fade 0.8s ease-out 0.8s both')}>
        {ticks}
        <div style={abs(WK_X0 - 120, 772, { ...LABEL, width: 100, textAlign: 'right' })}>Week</div>
      </div>
      <div style={abs(120, 846, { width: 1680, display: 'flex', gap: 56 })}>
        <Criterion
          label="Population"
          text="IPF diagnosed ≤ 5 years, age ≥ 40"
          live={live}
          delay={2.4}
        />
        <Criterion
          label="Lung function"
          text="FVC ≥ 45% and DLco ≥ 25% predicted"
          live={live}
          delay={2.55}
        />
        <Criterion
          label="Background therapy"
          text="Stable antifibrotic permitted (58%)"
          live={live}
          delay={2.7}
        />
      </div>
    </Stage>
  );
};

const FX0 = 260;
const FX1 = 1080;
const fx = (w: number) => FX0 + ((FX1 - FX0) * w) / 52;
const fy = (v: number) => 372 - v * 1.86;
const FVC = {
  placebo: [0, -22, -62, -112, -165, -214],
  d30: [0, -15, -38, -66, -95, -121],
  d60: [0, -8, -18, -30, -41, -52],
};
const CI_HW = [0, 9, 15, 22, 28, 34];

const linePath = (vals: number[]) =>
  vals.map((v, i) => `${i ? 'L' : 'M'} ${fx(VISITS[i]).toFixed(1)} ${fy(v).toFixed(1)}`).join(' ');
const bandPath = (vals: number[]) => {
  const up = vals.map(
    (v, i) => `${i ? 'L' : 'M'} ${fx(VISITS[i]).toFixed(1)} ${fy(v + CI_HW[i]).toFixed(1)}`,
  );
  const lo = vals
    .map((v, i) => `L ${fx(VISITS[i]).toFixed(1)} ${fy(v - CI_HW[i]).toFixed(1)}`)
    .reverse();
  return `${up.join(' ')} ${lo.join(' ')} Z`;
};

const Series = ({ vals, color }: { vals: number[]; color: string }) => {
  const dots: ReactNode[] = [];
  vals.forEach((v, i) => {
    dots.push(
      <circle
        key={i}
        className="sn-sdot"
        cx={fx(VISITS[i])}
        cy={fy(v)}
        r={7}
        fill="var(--osd-bg)"
        stroke={color}
        strokeWidth={3}
        style={{ '--d': `${200 + i * 230}ms` } as CSSProperties}
      />,
    );
  });
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <path className="sn-sband" d={bandPath(vals)} fill={color} fillOpacity={0.14} />
      <path
        className="sn-sdraw"
        d={linePath(vals)}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {dots}
    </svg>
  );
};

const ResultRow = ({
  y,
  color,
  arm,
  n,
  value,
  ci,
}: {
  y: number;
  color: string;
  arm: string;
  n: string;
  value: string;
  ci: string;
}) => (
  <div
    className="sn-srise"
    style={{ ...abs(1290, y), width: 510, '--d': '500ms' } as CSSProperties}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 28, height: 4, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 26, fontWeight: 500 }}>{arm}</span>
      <span style={LABEL}>{n}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8 }}>
      <span style={{ ...DISPLAY, fontSize: 56, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
      <span style={LABEL}>{ci}</span>
    </div>
  </div>
);

const Endpoint: Page = () => {
  const live = useIsActivePage();
  const grid: ReactNode[] = [];
  for (const v of [0, -50, -100, -150, -200, -250]) {
    grid.push(
      <g key={v}>
        <line
          x1={FX0}
          y1={fy(v)}
          x2={FX1}
          y2={fy(v)}
          stroke={v === 0 ? '#A9B6B9' : HAIR}
          strokeWidth={1}
        />
        <text
          x={FX0 - 18}
          y={fy(v) + 6}
          textAnchor="end"
          fontFamily={MONO}
          fontSize={16}
          fill={MUTED}
        >
          {v === 0 ? '0' : `−${-v}`}
        </text>
      </g>,
    );
  }
  for (const w of VISITS) {
    grid.push(
      <g key={`w${w}`}>
        <line
          x1={fx(w)}
          y1={fy(-250)}
          x2={fx(w)}
          y2={fy(-250) + 8}
          stroke="#A9B6B9"
          strokeWidth={1}
        />
        <text
          x={fx(w)}
          y={fy(-250) + 32}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={16}
          fill={MUTED}
        >
          {w}
        </text>
      </g>,
    );
  }
  return (
    <Stage
      section="Phase 2b · efficacy"
      note="mITT population, n = 309. MMRM; bands show 95% CI. 30 mg vs placebo: +93 mL (95% CI 45–141), p = 0.002."
    >
      <Title eyebrow="Primary endpoint · ΔFVC at week 52" live={live}>
        60 mg cut the loss of lung function by 76%.
      </Title>
      <div style={a(live, 'sn-fade 1s ease-out 0.3s both')}>
        <svg
          width={1920}
          height={1080}
          style={{ position: 'absolute', inset: 0 }}
          aria-hidden="true"
        >
          {grid}
          <text
            x={150}
            y={fy(-125)}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={16}
            fill={MUTED}
            transform={`rotate(-90 150 ${fy(-125)})`}
          >
            Change from baseline in FVC, mL
          </text>
          <text
            x={(FX0 + FX1) / 2}
            y={fy(-250) + 66}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={16}
            fill={MUTED}
          >
            Weeks since randomisation
          </text>
        </svg>
      </div>
      <Steps>
        <Step duration={300}>
          <Series vals={FVC.placebo} color={PLACEBO} />
          <ResultRow
            y={340}
            color={PLACEBO}
            arm="Placebo"
            n="n = 103"
            value="−214 mL"
            ci="95% CI −248 to −180"
          />
        </Step>
        <Step duration={300}>
          <Series vals={FVC.d30} color={DOSE30} />
          <ResultRow
            y={478}
            color={DOSE30}
            arm="SLN-214 30 mg"
            n="n = 104"
            value="−121 mL"
            ci="95% CI −155 to −87"
          />
        </Step>
        <Step duration={300}>
          <Series vals={FVC.d60} color="#0A8F7F" />
          <ResultRow
            y={616}
            color="#0A8F7F"
            arm="SLN-214 60 mg"
            n="n = 102"
            value="−52 mL"
            ci="95% CI −86 to −18"
          />
          <svg
            width={1920}
            height={1080}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <path
              className="sn-sdraw"
              d={`M ${FX1 + 18} ${fy(-52)} L ${FX1 + 30} ${fy(-52)} L ${FX1 + 30} ${fy(-214)} L ${FX1 + 18} ${fy(-214)}`}
              pathLength={1}
              fill="none"
              stroke="var(--osd-accent)"
              strokeWidth={2}
              style={{ transitionDelay: '1200ms' }}
            />
          </svg>
          <div
            className="sn-srise"
            style={{ ...abs(FX1 + 46, fy(-133) - 34), '--d': '1500ms' } as CSSProperties}
          >
            <div
              style={{
                ...DISPLAY,
                fontSize: 36,
                fontWeight: 700,
                color: 'var(--osd-accent)',
                lineHeight: 1,
              }}
            >
              162 mL
            </div>
            <div style={{ ...LABEL, marginTop: 6 }}>p &lt; 0.001</div>
          </div>
          <div
            className="sn-srise"
            style={
              {
                ...abs(1290, 790),
                width: 510,
                padding: '20px 0 0',
                borderTop: '2px solid var(--osd-accent)',
                '--d': '1700ms',
              } as CSSProperties
            }
          >
            <div style={CAPS}>Difference vs placebo, 60 mg</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 8 }}>
              <span
                style={{ ...DISPLAY, fontSize: 48, fontWeight: 700, color: 'var(--osd-accent)' }}
              >
                +162 mL
              </span>
              <span style={LABEL}>95% CI 114–210</span>
            </div>
          </div>
        </Step>
      </Steps>
    </Stage>
  );
};

type Ae = 'serious' | 'mild' | 'none';
const ARMS_AE: { serious: number; mild: number; disc: number[] }[] = [
  { serious: 11, mild: 63, disc: [2, 9, 21, 34, 47, 60, 71] },
  { serious: 10, mild: 66, disc: [4, 15, 29, 43, 57, 70] },
  { serious: 9, mild: 70, disc: [1, 8, 18, 30, 41, 55, 66, 77] },
];
const AE_COLOR: Record<Ae, string> = { serious: '#0C1A24', mild: MINT, none: '#DCE3E2' };
const DOT_P = 26;
const BLOCK_X = [120, 392, 664];
const BLOCK_Y = 420;

const DotMatrix = ({ live }: { live: boolean }) => {
  const dots: ReactNode[] = [];
  ARMS_AE.forEach((arm, b) => {
    for (let i = 0; i < 104; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const kind: Ae = i < arm.serious ? 'serious' : i < arm.serious + arm.mild ? 'mild' : 'none';
      const cx = BLOCK_X[b] + col * DOT_P + 13;
      const cy = BLOCK_Y + row * DOT_P + 13;
      const delay = 0.35 + b * 0.18 + (row + col) * 0.045;
      dots.push(
        <circle
          key={`${b}-${i}`}
          cx={cx}
          cy={cy}
          r={9}
          fill={AE_COLOR[kind]}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            ...(live ? { animation: `sn-pop 0.7s ${FLUID} ${delay.toFixed(2)}s both` } : {}),
          }}
        />,
      );
      if (arm.disc.includes(i)) {
        dots.push(
          <circle
            key={`${b}-${i}-d`}
            cx={cx}
            cy={cy}
            r={12}
            pathLength={1}
            fill="none"
            stroke={ROSE}
            strokeWidth={2.5}
            style={
              live
                ? {
                    strokeDasharray: 1,
                    animation: `sn-draw 0.8s ${FLUID} ${(delay + 1.2).toFixed(2)}s both`,
                  }
                : undefined
            }
          />,
        );
      }
    }
  });
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      aria-hidden="true"
    >
      {dots}
    </svg>
  );
};

const BlockLabel = ({
  x,
  name,
  live,
  delay,
}: {
  x: number;
  name: string;
  live: boolean;
  delay: number;
}) => (
  <div style={abs(x, 340, { width: 208, ...a(live, `sn-fade 0.8s ease-out ${delay}s both`) })}>
    <div style={{ fontSize: 26, fontWeight: 500 }}>{name}</div>
    <div style={LABEL}>n = 104</div>
  </div>
);

const LegendItem = ({
  color,
  label,
  ring = false,
}: {
  color: string;
  label: string;
  ring?: boolean;
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
    <span
      style={{
        width: ring ? 22 : 18,
        height: ring ? 22 : 18,
        borderRadius: '50%',
        boxSizing: 'border-box',
        background: ring ? 'transparent' : color,
        border: ring ? `2.5px solid ${color}` : undefined,
      }}
    />
    {label}
  </span>
);

const AeRow = ({
  label,
  p,
  d30,
  d60,
  live,
  delay,
  strong = false,
}: {
  label: string;
  p: string;
  d30: string;
  d60: string;
  live: boolean;
  delay: number;
  strong?: boolean;
}) => {
  const cell: CSSProperties = {
    width: 150,
    textAlign: 'right',
    fontFamily: MONO,
    fontSize: 24,
    fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        padding: '16px 0',
        borderTop: `1px solid ${HAIR}`,
        ...a(live, `sn-rise 0.9s ${FLUID} ${delay}s both`),
      }}
    >
      <span style={{ flex: 1, fontSize: 28, fontWeight: strong ? 500 : 400 }}>{label}</span>
      <span style={{ ...cell, color: MUTED }}>{p}</span>
      <span style={cell}>{d30}</span>
      <span style={{ ...cell, color: strong ? 'var(--osd-accent)' : undefined }}>{d60}</span>
    </div>
  );
};

const Safety: Page = () => {
  const live = useIsActivePage();
  const head: CSSProperties = { ...LABEL, fontSize: 18, width: 150, textAlign: 'right' };
  return (
    <Stage
      section="Phase 2b · safety"
      note="Safety population, N = 312. TEAE, treatment-emergent adverse event; AE, adverse event; ULN, upper limit of normal. No drug-related deaths."
    >
      <Title eyebrow="Safety and tolerability" live={live}>
        Well tolerated through 52 weeks.
      </Title>
      <BlockLabel x={BLOCK_X[0]} name="Placebo" live={live} delay={0.3} />
      <BlockLabel x={BLOCK_X[1]} name="30 mg" live={live} delay={0.45} />
      <BlockLabel x={BLOCK_X[2]} name="60 mg" live={live} delay={0.6} />
      <DotMatrix live={live} />
      <div
        style={abs(120, 790, {
          ...LABEL,
          fontSize: 18,
          color: SOFT,
          width: 760,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          rowGap: 16,
          ...a(live, 'sn-fade 1s ease-out 1.8s both'),
        })}
      >
        <LegendItem color={AE_COLOR.serious} label="Serious AE" />
        <LegendItem color={AE_COLOR.mild} label="Mild or moderate TEAE" />
        <LegendItem color={AE_COLOR.none} label="No TEAE" />
        <LegendItem color={ROSE} label="Discontinued due to AE" ring />
      </div>
      <div style={abs(120, 896, { ...LABEL, ...a(live, 'sn-fade 1s ease-out 2s both') })}>
        Each dot is one patient.
      </div>

      <div style={abs(980, 352, { width: 820 })}>
        <div
          style={{
            display: 'flex',
            paddingBottom: 14,
            ...a(live, 'sn-fade 0.8s ease-out 0.4s both'),
          }}
        >
          <span style={{ ...LABEL, fontSize: 18, flex: 1 }}>Patients, n (%)</span>
          <span style={head}>Placebo</span>
          <span style={head}>30 mg</span>
          <span style={head}>60 mg</span>
        </div>
        <AeRow label="Any TEAE" p="74 (71)" d30="76 (73)" d60="79 (76)" live={live} delay={0.5} />
        <AeRow label="Serious AE" p="11 (11)" d30="10 (10)" d60="9 (9)" live={live} delay={0.6} />
        <AeRow label="Discontinued, AE" p="7 (7)" d30="6 (6)" d60="8 (8)" live={live} delay={0.7} />
        <AeRow label="Cough" p="9 (9)" d30="11 (11)" d60="14 (13)" live={live} delay={0.8} />
        <AeRow label="Diarrhoea" p="6 (6)" d30="5 (5)" d60="6 (6)" live={live} delay={0.9} />
        <AeRow
          label="ALT or AST > 3× ULN"
          p="1 (1)"
          d30="1 (1)"
          d60="1 (1)"
          live={live}
          delay={1.0}
        />
      </div>
      <p
        style={{
          ...BODY,
          ...abs(980, 862),
          width: 820,
          fontSize: 28,
          lineHeight: 1.4,
          ...a(live, `sn-rise 1s ${FLUID} 1.3s both`),
        }}
      >
        No dose-related GI or liver signal. Cough was mild and transient.
      </p>
    </Stage>
  );
};

const LANE_X = 840;
const LANE_W = 192;
const PHASES = ['Discovery', 'IND-enabling', 'Phase 1', 'Phase 2', 'Phase 3'];

const PipelineRow = ({
  y,
  program,
  modality,
  indication,
  end,
  status,
  next,
  live,
  delay,
  lead = false,
}: {
  y: number;
  program: string;
  modality: string;
  indication: string;
  end: number;
  status: string;
  next?: number;
  live: boolean;
  delay: number;
  lead?: boolean;
}) => {
  const barEnd = LANE_X + end;
  return (
    <>
      <div style={abs(120, y, { width: 240, ...a(live, `sn-fade 0.8s ease-out ${delay}s both`) })}>
        <div style={{ ...DISPLAY, fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {program}
        </div>
        <div style={{ ...LABEL, marginTop: 4 }}>{modality}</div>
      </div>
      <div
        style={abs(380, y + 2, {
          width: 420,
          fontSize: 28,
          lineHeight: 1.2,
          ...a(live, `sn-fade 0.8s ease-out ${delay + 0.05}s both`),
        })}
      >
        {indication}
      </div>
      <div
        style={abs(LANE_X, y + 50, {
          width: end,
          height: 14,
          borderRadius: 7,
          background: lead ? 'var(--osd-accent)' : MINT,
          ...a(live, `sn-grow 1.4s ${FLUID} ${delay + 0.2}s both`),
        })}
      />
      {next !== undefined && (
        <div
          style={abs(barEnd + 8, y + 56, {
            width: next - 8,
            height: 0,
            borderTop: '2px dashed var(--osd-accent)',
            ...a(live, `sn-grow 0.8s ${FLUID} ${delay + 1.6}s both`),
          })}
        />
      )}
      <div style={abs(barEnd - 12, y + 45, { width: 24, height: 24 })}>
        {live && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${lead ? '#0A8F7F' : MINT}`,
              animation: `sn-ripple 3s ${EASE_OUT} ${(delay + 1.6).toFixed(2)}s infinite both`,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'var(--osd-bg)',
            border: `4px solid ${lead ? '#0A8F7F' : MINT}`,
            boxSizing: 'border-box',
            ...a(live, `sn-pop 0.6s ${FLUID} ${(delay + 1.3).toFixed(2)}s both`),
          }}
        />
      </div>
      <div
        style={abs(LANE_X, y + 10, {
          ...LABEL,
          width: Math.max(end + (next ?? 0), 220),
          whiteSpace: 'nowrap',
          textAlign: end < 220 ? 'left' : 'right',
          color: lead ? 'var(--osd-accent)' : SOFT,
          fontWeight: lead ? 500 : 400,
          ...a(live, `sn-fade 0.8s ease-out ${(delay + 1.4).toFixed(2)}s both`),
        })}
      >
        {status}
      </div>
    </>
  );
};

const Pipeline: Page = () => {
  const live = useIsActivePage();
  const lanes: ReactNode[] = [];
  PHASES.forEach((p, i) => {
    lanes.push(
      <div
        key={p}
        style={abs(LANE_X + i * LANE_W, 330, {
          ...CAPS,
          width: LANE_W,
          paddingLeft: 14,
          boxSizing: 'border-box',
        })}
      >
        {p}
      </div>,
    );
    lanes.push(
      <div
        key={`l${p}`}
        style={abs(LANE_X + i * LANE_W, 330, {
          width: 1,
          height: 620,
          background: i === 0 ? 'transparent' : HAIR,
        })}
      />,
    );
  });
  return (
    <Stage
      section="Pipeline"
      note="All programs wholly owned. Timelines are estimates and subject to regulatory feedback."
    >
      <Title eyebrow="One mechanism, five fibrotic diseases" live={live}>
        FSK2 is a platform, not a single bet.
      </Title>
      <div style={a(live, 'sn-fade 0.8s ease-out 0.2s both')}>
        <div style={abs(120, 330, { ...CAPS })}>Program</div>
        <div style={abs(380, 330, { ...CAPS })}>Indication</div>
        {lanes}
        <div style={abs(120, 368, { width: 1680, height: 1, background: HAIR })} />
      </div>
      <PipelineRow
        y={394}
        program="SLN-214"
        modality="Inhaled · DPI"
        indication="Idiopathic pulmonary fibrosis"
        end={LANE_W * 4}
        next={96}
        status="Phase 3 start H1 2027"
        live={live}
        delay={0.3}
        lead
      />
      <PipelineRow
        y={506}
        program="SLN-214"
        modality="Inhaled · DPI"
        indication="Progressive pulmonary fibrosis"
        end={LANE_W * 3.5}
        status="Enrolling · n = 180"
        live={live}
        delay={0.45}
      />
      <PipelineRow
        y={618}
        program="SLN-307"
        modality="Oral"
        indication="Systemic sclerosis–ILD"
        end={LANE_W * 2.6}
        status="Data H1 2027"
        live={live}
        delay={0.6}
      />
      <PipelineRow
        y={730}
        program="SLN-410"
        modality="Inhaled"
        indication="Pulmonary hypertension in ILD"
        end={LANE_W * 1.75}
        status="IND H1 2028"
        live={live}
        delay={0.75}
      />
      <PipelineRow
        y={842}
        program="FSK2-D"
        modality="Oral degrader"
        indication="Fibrotic kidney disease"
        end={LANE_W * 0.7}
        status="Lead optimisation"
        live={live}
        delay={0.9}
      />
    </Stage>
  );
};

const TL_X0 = 160;
const TL_X1 = 1760;
const TL_Y = 628;
const QW = (TL_X1 - TL_X0) / 9;

const Milestone = ({
  x,
  above,
  date,
  title,
  detail,
  live,
  alignRight = false,
}: {
  x: number;
  above: boolean;
  date: string;
  title: string;
  detail: string;
  live: boolean;
  alignRight?: boolean;
}) => {
  const t = 0.4 + ((x - TL_X0) / (TL_X1 - TL_X0)) * 1.8;
  const top = above ? 400 : 728;
  return (
    <>
      <div
        style={abs(x, above ? top + 150 : TL_Y + 14, {
          width: 1,
          height: above ? TL_Y - 14 - (top + 150) : top - TL_Y - 22,
          background: HAIR,
          ...a(live, `sn-fade 0.6s ease-out ${(t + 0.2).toFixed(2)}s both`),
        })}
      />
      <div style={abs(x - 12, TL_Y - 12, { width: 24, height: 24 })}>
        {live && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid var(--osd-accent)',
                animation: `sn-ripple 3.6s ${EASE_OUT} ${(t + 0.4).toFixed(2)}s infinite both`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid var(--osd-accent)',
                animation: `sn-ripple 3.6s ${EASE_OUT} ${(t + 2.2).toFixed(2)}s infinite both`,
              }}
            />
          </>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'var(--osd-accent)',
            boxShadow: '0 0 0 5px var(--osd-bg)',
            ...a(live, `sn-pop 0.6s ${FLUID} ${t.toFixed(2)}s both`),
          }}
        />
      </div>
      <div
        style={abs(alignRight ? x - 330 : x - 2, top, {
          width: 332,
          textAlign: alignRight ? 'right' : 'left',
          ...a(live, `sn-focus 1s ${FLUID} ${(t + 0.25).toFixed(2)}s both`),
        })}
      >
        <div style={{ ...EYEBROW, fontSize: 17 }}>{date}</div>
        <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.22, marginTop: 10 }}>
          {title}
        </div>
        <div style={{ ...LABEL, marginTop: 8 }}>{detail}</div>
      </div>
    </>
  );
};

const Milestones: Page = () => {
  const live = useIsActivePage();
  const ticks: ReactNode[] = [];
  const quarters = ['Q4', 'Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'];
  quarters.forEach((q, i) => {
    ticks.push(
      <div
        key={i}
        style={abs(TL_X0 + i * QW, TL_Y + 22, { ...LABEL, width: QW, textAlign: 'center' })}
      >
        {q}
      </div>,
    );
  });
  const today = TL_X0 + QW * 0.12;
  return (
    <Stage
      section="Catalysts"
      note="Cash, cash equivalents and marketable securities, unaudited. Milestones are company estimates."
    >
      <Title eyebrow="2026 – 2028" live={live} width={1100}>
        Six catalysts through 2028.
      </Title>
      <div
        style={abs(1400, 156, {
          width: 400,
          textAlign: 'right',
          ...a(live, `sn-rise 1s ${FLUID} 0.4s both`),
        })}
      >
        <div style={{ ...DISPLAY, fontSize: 64, lineHeight: 1 }}>$612M</div>
        <div style={{ ...LABEL, marginTop: 10 }}>cash at 30 Sep 2026 · runway into 2029</div>
      </div>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <line x1={TL_X0} y1={TL_Y} x2={TL_X1} y2={TL_Y} stroke={HAIR} strokeWidth={2} />
        <line
          x1={TL_X0}
          y1={TL_Y}
          x2={TL_X1}
          y2={TL_Y}
          pathLength={1}
          stroke="var(--osd-accent)"
          strokeWidth={2}
          style={
            live ? { strokeDasharray: 1, animation: `sn-draw 2.2s ${FLUID} 0.3s both` } : undefined
          }
        />
        <line x1={TL_X0 + QW} y1={TL_Y - 10} x2={TL_X0 + QW} y2={TL_Y + 10} stroke="#A9B6B9" />
        <line
          x1={TL_X0 + QW * 5}
          y1={TL_Y - 10}
          x2={TL_X0 + QW * 5}
          y2={TL_Y + 10}
          stroke="#A9B6B9"
        />
      </svg>
      <div style={a(live, 'sn-fade 1s ease-out 0.3s both')}>
        {ticks}
        <div style={abs(TL_X0, TL_Y - 36, { ...CAPS, color: 'var(--osd-text)' })}>2026</div>
        <div style={abs(TL_X0 + QW + 12, TL_Y - 36, { ...CAPS, color: 'var(--osd-text)' })}>
          2027
        </div>
        <div style={abs(TL_X0 + QW * 5 + 12, TL_Y - 36, { ...CAPS, color: 'var(--osd-text)' })}>
          2028
        </div>
      </div>
      <div
        style={abs(today - 1, TL_Y - 12, { width: 2, height: 24, background: 'var(--osd-text)' })}
      />
      <div
        style={abs(today - 40, TL_Y + 22, {
          ...CAPS,
          width: 80,
          textAlign: 'center',
          color: 'var(--osd-text)',
        })}
      >
        Today
      </div>
      <Milestone
        x={TL_X0 + QW * 0.6}
        above={false}
        date="Q4 2026"
        title="End-of-Phase 2 meeting with FDA"
        detail="Phase 3 design and dose"
        live={live}
      />
      <Milestone
        x={TL_X0 + QW * 2}
        above
        date="H1 2027"
        title="FIBRA-3 first patient dosed"
        detail="Phase 3, IPF, n ≈ 900"
        live={live}
      />
      <Milestone
        x={TL_X0 + QW * 2.9}
        above={false}
        date="H1 2027"
        title="SLN-307 Phase 1 data"
        detail="SSc-ILD, oral"
        live={live}
      />
      <Milestone
        x={TL_X0 + QW * 4.3}
        above
        date="H2 2027"
        title="PPF Phase 2 interim"
        detail="SLN-214, n = 180"
        live={live}
      />
      <Milestone
        x={TL_X0 + QW * 6}
        above={false}
        date="H1 2028"
        title="SLN-410 IND submission"
        detail="PH-ILD, inhaled"
        live={live}
      />
      <Milestone
        x={TL_X0 + QW * 8.2}
        above
        date="H2 2028"
        title="FIBRA-3 enrolment complete"
        detail="Topline expected 2029"
        live={live}
        alignRight
      />
    </Stage>
  );
};

const Contact = ({ kind, name, line }: { kind: string; name: string; line: string }) => (
  <div style={{ width: 340 }}>
    <div style={CAPS}>{kind}</div>
    <div style={{ fontSize: 30, fontWeight: 500, marginTop: 10 }}>{name}</div>
    <div style={{ fontFamily: MONO, fontSize: 22, color: SOFT, marginTop: 6 }}>{line}</div>
  </div>
);

const Close: Page = () => {
  const live = useIsActivePage();
  return (
    <Stage chrome={false}>
      <div style={abs(120, 72, a(live, 'sn-fade 1s ease-out 0.1s both'))}>
        <Wordmark size={28} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          ...a(live, `sn-breath-well 6s ${SWAY} 2s infinite`),
        }}
      >
        <Well x={260} y={200} d={680} live={live} delay={0.1}>
          <div className="sn-right" style={{ position: 'absolute', inset: 0 }}>
            <FibroField live={live} x={-80} y={-40} />
          </div>
          <ScaleBar x={470} y={556} />
        </Well>
      </div>
      <div style={abs(1060, 300, { ...EYEBROW, ...a(live, 'sn-fade 1s ease-out 0.3s both') })}>
        Thank you
      </div>
      <h2
        style={{
          ...DISPLAY,
          ...abs(1054, 336),
          width: 760,
          fontSize: 112,
          lineHeight: 1,
          letterSpacing: '-0.04em',
        }}
      >
        <span style={{ display: 'block', ...a(live, `sn-focus 1.5s ${FLUID} 0.4s both`) }}>
          162 mL of
        </span>
        <span style={{ display: 'block', ...a(live, `sn-focus 1.5s ${FLUID} 0.58s both`) }}>
          breathing
        </span>
        <span
          style={{
            display: 'block',
            color: 'var(--osd-accent)',
            ...a(live, `sn-focus 1.5s ${FLUID} 0.76s both`),
          }}
        >
          room.
        </span>
      </h2>
      <div
        style={abs(1060, 740, {
          display: 'flex',
          gap: 60,
          ...a(live, `sn-rise 1.1s ${FLUID} 1.1s both`),
        })}
      >
        <Contact kind="Investor relations" name="Lena Moreau" line="ir@solenne.bio" />
        <Contact kind="Media" name="Jonas Pereira" line="press@solenne.bio" />
      </div>
      <div
        style={abs(1060, 940, {
          ...LABEL,
          width: 740,
          ...a(live, 'sn-fade 1s ease-out 1.5s both'),
        })}
      >
        SLN-214 is investigational and not approved in any market. Forward-looking statements apply;
        see solenne.bio/investors.
      </div>
    </Stage>
  );
};

Screen.transition = morphTransition;
Zoom.transition = morphTransition;

export const meta: SlideMeta = {
  title: 'Solenne Bio — R&D Day 2026',
  createdAt: '2026-10-11T12:54:22.619Z',
};

export const notes: (string | undefined)[] = [
  `Let the well come into focus before you speak. What you are looking at is real biology from our lab: fibroblasts from an IPF patient, nuclei in blue, the scar-making machinery in green, collagen in magenta.
"Good morning. I'm Mara Lindqvist, CEO of Solenne. Today is about one number: how much breathing room we can give patients with IPF."
"We'll cover the disease, the biology, the Phase 2b data, and what comes next." Click.`,
  `"IPF is a scarring disease of the lung's air sacs. Fibroblasts lay down collagen faster than the lung can clear it."
Point at the panel: "Watch the lattice. The scar starts at the edge of the lung, under the pleura, and at the bases, and it creeps inward."
"Median survival is three to five years from diagnosis. Untreated, patients lose around two hundred millilitres of lung capacity a year. Two drugs are approved. Both slow that decline. Neither stops it." Click.`,
  `Hand over to Dr. Tomas Okafor, CSO.
"In fibrotic tissue, a ligand binds its receptor and the signal runs through one kinase we call FSK2, then a transcription factor, into the nucleus, where it switches on the collagen genes."
Click: "SLN-214 binds an allosteric pocket on FSK2. Signals still arrive at the receptor. They just stop there."
Click: "Fourteen nanomolar in cells, an eighty-two percent drop in collagen transcription, and more than four hundred-fold selectivity across three hundred and eighty kinases." Click.`,
  `"We didn't start from a target. We started from patients' cells."
"Two thousand four hundred and sixteen compounds, on fibroblasts from eighteen IPF donors. Each well is imaged for collagen. Bright magenta means scar."
"Column one is stimulated, column twelve unstimulated. And here, well D7, is the compound that became SLN-214." Pause, then click to zoom in.`,
  `"This is inside that well. On the left, vehicle: dense collagen, fibroblasts locked in the myofibroblast state."
"On the right, the same cells with SLN-214 at time zero." Click.
"Seventy-two hours later. Collagen area down fifty-eight percent, myofibroblasts down seventy-one percent, and every one of the six donors responded." Click.`,
  `"Then we built the molecule for the lung."
"An allosteric FSK2 inhibitor, just under four hundred daltons, formulated as a dry powder you inhale once a day."
"The key number is thirty-eight to one: lung exposure versus plasma. With a twenty-six hour lung half-life, once daily works, and the rest of the body sees very little drug." Click.`,
  `"Inhaled only works if the drug reaches the deep lung."
"In a scintigraphy study, fifty-eight percent of the emitted dose deposited in the lungs, forty-one percent in the periphery, exactly where IPF starts."
"Particle size is two point one microns, small enough to travel past the large airways." Click.`,
  `Hand over to Dr. Helen Achterberg, CMO.
"FIBRA-2 randomised three hundred and twelve patients one to one to one: placebo, thirty milligrams, or sixty milligrams once daily, for fifty-two weeks."
"Patients could stay on a stable background antifibrotic, and fifty-eight percent did. The primary endpoint is change in FVC at week fifty-two."
"Ninety-four percent of completers rolled into the open-label extension." Click.`,
  `Three clicks, one arm each.
Click: "Placebo patients lost two hundred and fourteen millilitres over the year, in line with the natural history."
Click: "Thirty milligrams: minus one hundred twenty-one."
Click: "Sixty milligrams: minus fifty-two. That's a difference of one hundred sixty-two millilitres, p below zero point zero zero one. Seventy-six percent less lung function lost." Pause. Click.`,
  `"Efficacy only matters if patients can stay on drug."
"Each dot is one patient. Adverse event rates were similar across arms: seventy-one percent on placebo, seventy-six on sixty milligrams."
"Discontinuations due to adverse events: seven, six, and eight patients. The most common event was cough, mild and transient. No dose-related GI or liver signal." Click.`,
  `Back to Mara.
"FSK2 drives fibrosis well beyond IPF, so this is a platform."
"SLN-214 goes into Phase 3 in IPF in the first half of 2027, and is already enrolling in progressive pulmonary fibrosis."
"SLN-307, an oral molecule, is in Phase 1 for scleroderma lung disease. SLN-410 targets pulmonary hypertension in ILD, and an FSK2 degrader is in lead optimisation for kidney fibrosis." Click.`,
  `"Six catalysts over the next two years."
Walk left to right: "End-of-Phase 2 meeting this quarter. FIBRA-3 starts in the first half of 2027, alongside SLN-307 data. PPF interim in the second half. SLN-410 IND in 2028, and FIBRA-3 fully enrolled by end of 2028."
"We have six hundred and twelve million dollars in cash, which funds all of this into 2029." Click.`,
  `"One hundred sixty-two millilitres. In a disease measured in what you lose, that's breathing room."
"Thank you. Lena and Jonas will follow up on materials and one-on-ones."
Open for questions.`,
];

export default [
  Cover,
  Disease,
  Mechanism,
  Screen,
  Zoom,
  Molecule3D,
  Delivery,
  Design,
  Endpoint,
  Safety,
  Pipeline,
  Milestones,
  Close,
] satisfies Page[];

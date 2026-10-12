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
import { type CSSProperties, type ReactNode, useState } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#EEEAF8', text: '#25204D', accent: '#7B5CFF' },
  fonts: {
    display: '"Unbounded", "Arial Black", sans-serif',
    body: '"Figtree", "Helvetica Neue", Arial, sans-serif',
  },
  typeScale: { hero: 200, body: 32 },
  radius: 28,
};

const INK = 'var(--osd-text)';
const ACCENT = 'var(--osd-accent)';
const MUTED = '#6C6894';
const PINK = '#FF9BD3';
const PERI = '#A3AEFF';
const MINT = '#8FEBD2';
const BUTTER = '#FFE98C';
const ICE = '#C4E6FF';
const LCD_TEXT = '#2E3A5C';

const SLIDE_ID = 'loopwave-replay-2026';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700&family=Unbounded:wght@600;700;900&family=VT323&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const FLOAT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const KEYFRAMES = `
@keyframes lw-rise { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: none } }
@keyframes lw-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes lw-pop { from { opacity: 0; transform: scale(0.8) } to { opacity: 1; transform: none } }
@keyframes lw-growx { from { transform: scaleX(0) } to { transform: none } }
@keyframes lw-growy { from { transform: scaleY(0) } to { transform: none } }
@keyframes lw-sheen { 0% { background-position: 100% 0, 0 0 } 42%, 100% { background-position: 0% 0, 0 0 } }
@keyframes lw-twinkle { 0%, 100% { transform: scale(1) rotate(0deg); opacity: 1 } 50% { transform: scale(0.5) rotate(45deg); opacity: 0.5 } }
@keyframes lw-spin { to { transform: rotate(360deg) } }
@keyframes lw-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
@keyframes lw-glint { 0% { transform: translateX(-160%) skewX(-18deg) } 38%, 100% { transform: translateX(260%) skewX(-18deg) } }
@keyframes lw-blink { 50% { opacity: 0 } }
.lw-case { transition: transform 760ms ${FLOAT}, opacity 320ms ease-out; }
[data-osd-step="pending"] .lw-case { transform: translateY(56px) scale(0.96); opacity: 0; }
.lw-fill { transform-origin: left center; transition: transform 1300ms ${FLOAT} 160ms; }
[data-osd-step="pending"] .lw-fill { transform: scaleX(0); }
.lw-badge { transition: transform 820ms ${FLOAT}, opacity 300ms ease-out; }
[data-osd-step="pending"] .lw-badge { transform: scale(0.82) rotate(-8deg); opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .lw-root *, .lw-root *::before, .lw-root *::after { animation: none !important; transition: none !important; }
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

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'scale(0.97)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
};

const CHROME_FILL =
  'linear-gradient(180deg, #9EA3D2 0%, #FFFFFF 15%, #D2D4EE 30%, #6A6EAA 46%, #1E1B4C 51%, #7E70D8 58%, #DCCBFF 72%, #FFFFFF 84%, #A7A3D8 100%)';
const SHEEN =
  'linear-gradient(100deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 60%)';
const HOLO_INK = 'linear-gradient(90deg, #E0408F 0%, #7B5CFF 52%, #12A08F 100%)';
const HOLO_LINEAR = `linear-gradient(100deg, ${PINK} 0%, ${PERI} 34%, ${MINT} 66%, ${BUTTER} 100%)`;
const HOLO_CONIC = `conic-gradient(from 210deg, ${PINK}, ${PERI}, ${MINT}, ${BUTTER}, ${PINK})`;
const GLOSS =
  'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 48%, rgba(255,255,255,0) 50%)';
const SILVER = 'linear-gradient(180deg, #FFFFFF 0%, #E6E5F4 45%, #CBC9E2 100%)';

const TINT_PINK = 'linear-gradient(160deg, #FFD3EC 0%, #FF7FC5 100%)';
const TINT_PERI = 'linear-gradient(160deg, #DFE3FF 0%, #8C98FF 100%)';
const TINT_MINT = 'linear-gradient(160deg, #D6FCEF 0%, #4FD3AE 100%)';
const TINT_BUTTER = 'linear-gradient(160deg, #FFF8D2 0%, #FFD24D 100%)';
const TINT_ICE = 'linear-gradient(160deg, #EAF6FF 0%, #86C6F5 100%)';

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const useLive = () => {
  const active = useIsActivePage();
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return active && !reduced;
};

const anim = (live: boolean, value: string): CSSProperties => (live ? { animation: value } : {});
const rise = (live: boolean, delay = 0): CSSProperties =>
  anim(live, `lw-rise 900ms ${FLOAT} ${delay}ms both`);
const pop = (live: boolean, delay = 0): CSSProperties =>
  anim(live, `lw-pop 820ms ${FLOAT} ${delay}ms both`);

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  margin: 0,
  whiteSpace: 'nowrap',
};

const LABEL: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  lineHeight: 1,
};

const LCD: CSSProperties = {
  fontFamily: '"VT323", ui-monospace, monospace',
  lineHeight: 1,
  letterSpacing: '0.04em',
};

const GLASS: CSSProperties = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.55) 100%)',
  border: '2px solid #FFFFFF',
  boxShadow: '0 24px 60px rgba(76,56,170,0.16), inset 0 0 0 1px rgba(150,140,220,0.22)',
  borderRadius: 'var(--osd-radius)',
};

const Stage = ({ children }: { children: ReactNode }) => (
  <div
    className="lw-root"
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      color: INK,
      fontFamily: 'var(--osd-font-body)',
      background: [
        'radial-gradient(1100px 760px at 92% -8%, rgba(255,155,211,0.42), rgba(255,155,211,0) 62%)',
        'radial-gradient(1000px 820px at -6% 108%, rgba(143,235,210,0.42), rgba(143,235,210,0) 60%)',
        'radial-gradient(900px 640px at 60% 70%, rgba(163,174,255,0.22), rgba(163,174,255,0) 70%)',
        'radial-gradient(700px 520px at 10% 0%, rgba(196,230,255,0.55), rgba(196,230,255,0) 70%)',
        'var(--osd-bg)',
      ].join(', '),
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'radial-gradient(circle, rgba(123,92,255,0.16) 0 1.5px, rgba(123,92,255,0) 2px)',
        backgroundSize: '32px 32px',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.15))',
        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.15))',
        zIndex: -1,
      }}
    />
    {children}
  </div>
);

const Chrome = ({
  size,
  live,
  delay = 0,
  weight = 900,
  tracking = '-0.03em',
  style,
  children,
}: {
  size: number;
  live: boolean;
  delay?: number;
  weight?: number;
  tracking?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    style={{
      ...DISPLAY,
      display: 'inline-block',
      fontSize: size,
      fontWeight: weight,
      lineHeight: 1.08,
      letterSpacing: tracking,
      paddingBottom: Math.round(size * 0.04),
      backgroundImage: `${SHEEN}, ${CHROME_FILL}`,
      backgroundSize: '300% 100%, 100% 100%',
      backgroundPosition: '100% 0, 0 0',
      backgroundRepeat: 'no-repeat',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      filter:
        'drop-shadow(0 0 0.6px rgba(37,32,77,0.55)) drop-shadow(0 3px 0 rgba(255,255,255,0.95)) drop-shadow(0 16px 26px rgba(110,84,240,0.28))',
      ...anim(live, `lw-sheen 6.4s ease-in-out ${delay}ms infinite`),
      ...style,
    }}
  >
    {children}
  </div>
);

const HoloText = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <span
    style={{
      backgroundImage: HOLO_INK,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      ...style,
    }}
  >
    {children}
  </span>
);

const Sparkle = ({
  x,
  y,
  size,
  live,
  delay = 0,
  period = 3.2,
}: {
  x: number;
  y: number;
  size: number;
  live: boolean;
  delay?: number;
  period?: number;
}) => (
  <svg
    viewBox="0 0 40 40"
    aria-hidden="true"
    style={abs(x, y, {
      width: size,
      height: size,
      overflow: 'visible',
      transformOrigin: 'center',
      filter:
        'drop-shadow(0 0 6px rgba(255,255,255,0.95)) drop-shadow(0 0 16px rgba(140,120,255,0.55))',
      ...anim(live, `lw-twinkle ${period}s ease-in-out ${delay}ms infinite`),
    })}
  >
    <defs>
      <radialGradient id="lw-spark-g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="55%" stopColor="#F4EEFF" />
        <stop offset="100%" stopColor="#A99BFF" />
      </radialGradient>
    </defs>
    <path
      d="M20 0 C21.4 13 27 18.6 40 20 C27 21.4 21.4 27 20 40 C18.6 27 13 21.4 0 20 C13 18.6 18.6 13 20 0 Z"
      fill="url(#lw-spark-g)"
    />
  </svg>
);

const Orb = ({
  size,
  tint,
  style,
  children,
}: {
  size: number;
  tint: string;
  style?: CSSProperties;
  children?: ReactNode;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      position: 'relative',
      flexShrink: 0,
      background: `radial-gradient(circle at 50% 118%, rgba(255,255,255,0.75), rgba(255,255,255,0) 52%), ${tint}`,
      border: '2px solid rgba(255,255,255,0.95)',
      boxShadow: `inset 0 -${Math.round(size * 0.08)}px ${Math.round(size * 0.16)}px rgba(60,40,150,0.22), 0 ${Math.round(size * 0.07)}px ${Math.round(size * 0.18)}px rgba(90,70,190,0.26)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '16%',
        top: '5%',
        width: '68%',
        height: '42%',
        borderRadius: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.05))',
      }}
    />
    {children ? <div style={{ position: 'relative', textAlign: 'center' }}>{children}</div> : null}
  </div>
);

const Pill = ({
  children,
  tint = HOLO_LINEAR,
  size = 20,
  style,
}: {
  children: ReactNode;
  tint?: string;
  size?: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      ...LABEL,
      fontSize: size,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      height: size * 2.3,
      padding: `0 ${Math.round(size * 1.1)}px`,
      borderRadius: 999,
      background: `${GLOSS}, ${tint}`,
      border: '2px solid #FFFFFF',
      boxShadow: '0 10px 26px rgba(110,84,240,0.22), inset 0 -4px 10px rgba(80,60,180,0.18)',
      color: INK,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

const WaveMark = ({ size }: { size: number }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 60 36" aria-hidden="true">
    <defs>
      <linearGradient id="lw-wave-g" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="#E0408F" />
        <stop offset="50%" stopColor="#7B5CFF" />
        <stop offset="100%" stopColor="#12A08F" />
      </linearGradient>
    </defs>
    <path
      d="M4 18 C 10 2, 20 2, 24 18 S 38 34, 44 18 C 47 10, 52 8, 56 12"
      fill="none"
      stroke="url(#lw-wave-g)"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <circle cx="56" cy="12" r="3.5" fill="#12A08F" />
  </svg>
);

const Wordmark = ({ size = 26 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(size * 0.45) }}>
    <WaveMark size={size * 1.8} />
    <span
      style={{
        ...DISPLAY,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: INK,
      }}
    >
      loopwave
    </span>
  </div>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <div style={abs(120, 994, { display: 'flex', alignItems: 'center', gap: 22 })}>
        <Wordmark size={20} />
        <span style={{ ...LABEL, fontSize: 18, color: MUTED }}>Replay 2026 · Artist Summit</span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 986,
          height: 48,
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          borderRadius: 999,
          background: 'linear-gradient(180deg, #E9FBF4 0%, #CDEFE6 100%)',
          border: '2px solid #FFFFFF',
          boxShadow: 'inset 0 2px 6px rgba(46,58,92,0.18), 0 8px 18px rgba(90,70,190,0.14)',
          color: LCD_TEXT,
        }}
      >
        <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
          <path d="M1 1 L13 8 L1 15 Z" fill={LCD_TEXT} />
        </svg>
        <span style={{ ...LCD, fontSize: 30 }}>
          TRACK {String(current).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
      </div>
    </>
  );
};

const Eyebrow = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={abs(120, 104, { display: 'flex', alignItems: 'center', gap: 18 })}>
    <Pill size={18}>
      <span style={{ ...LCD, fontSize: 30, letterSpacing: 0, textTransform: 'none' }}>{n}</span>
    </Pill>
    <span style={{ ...LABEL, color: MUTED }}>{children}</span>
  </div>
);

const Heading = ({
  top = 186,
  size = 72,
  live,
  delay = 60,
  children,
}: {
  top?: number;
  size?: number;
  live: boolean;
  delay?: number;
  children: ReactNode;
}) => (
  <h2
    style={{
      ...DISPLAY,
      ...abs(120, top),
      fontSize: size,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.025em',
      color: INK,
      ...rise(live, delay),
    }}
  >
    {children}
  </h2>
);

const Disc = ({
  x,
  y,
  size,
  live,
  period = 22,
  children,
}: {
  x: number;
  y: number;
  size: number;
  live: boolean;
  period?: number;
  children?: ReactNode;
}) => {
  const hub = Math.round(size * 0.36);
  const hole = Math.round(size * 0.11);
  return (
    <div
      style={abs(x, y, {
        width: size,
        height: size,
        borderRadius: '50%',
        boxShadow:
          '0 40px 90px rgba(80,60,180,0.28), 0 0 0 3px rgba(255,255,255,0.95), 0 0 0 5px rgba(150,140,220,0.25)',
      })}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, #F6F3FF 0%, ${PINK} 9%, #FBF9FF 17%, ${PERI} 27%, ${MINT} 38%, #FFFFFF 47%, ${BUTTER} 57%, ${PINK} 67%, #EFEDFF 76%, ${ICE} 84%, ${PERI} 92%, #F6F3FF 100%)`,
          ...anim(live, `lw-spin ${period}s linear infinite`),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0 3px, rgba(110,100,190,0.07) 3px 4px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'conic-gradient(from 300deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 6%, rgba(255,255,255,0) 13%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.65) 56%, rgba(255,255,255,0) 63%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: (size - hub) / 2,
          top: (size - hub) / 2,
          width: hub,
          height: hub,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.75), rgba(232,228,250,0.55))',
          border: '2px solid rgba(255,255,255,0.95)',
          boxShadow: 'inset 0 0 0 10px rgba(255,255,255,0.35)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: (size - hole) / 2,
          top: (size - hole) / 2,
          width: hole,
          height: hole,
          borderRadius: '50%',
          background: 'var(--osd-bg)',
          boxShadow: 'inset 0 4px 10px rgba(60,40,150,0.3), 0 0 0 2px rgba(255,255,255,0.9)',
        }}
      />
      {children}
    </div>
  );
};

const WinButton = ({ tint }: { tint: string }) => <Orb size={22} tint={tint} />;

const Window = ({
  x,
  y,
  w,
  h,
  title,
  style,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    style={abs(x, y, {
      width: w,
      height: h,
      borderRadius: 26,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.86) 0%, rgba(247,244,255,0.7) 100%)',
      border: '2px solid #FFFFFF',
      boxShadow:
        '0 34px 80px rgba(70,50,160,0.2), 0 2px 0 rgba(37,32,77,0.05), inset 0 0 0 1px rgba(160,150,220,0.3)',
      ...style,
    })}
  >
    <div
      style={{
        height: 58,
        borderRadius: '24px 24px 0 0',
        background: SILVER,
        borderBottom: '1px solid rgba(120,110,190,0.28)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        gap: 12,
        position: 'relative',
      }}
    >
      <WinButton tint={TINT_PINK} />
      <WinButton tint={TINT_BUTTER} />
      <WinButton tint={TINT_MINT} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: MUTED,
        }}
      >
        {title}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, top: 58, right: 0, bottom: 0 }}>{children}</div>
  </div>
);

const Cover: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <div style={abs(120, 104, { ...rise(live, 0) })}>
        <Wordmark size={34} />
      </div>
      <Pill size={18} style={{ ...abs(1236, 108), ...rise(live, 80) }}>
        <span>Indie Artist Summit</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Berlin</span>
      </Pill>
      <div style={{ ...abs(1150, 210), ...pop(live, 200) }}>
        <div style={{ position: 'relative', ...anim(live, 'lw-float 7s ease-in-out infinite') }}>
          <Disc x={0} y={0} size={640} live={live} />
        </div>
      </div>
      <div style={abs(112, 270, { ...rise(live, 120) })}>
        <Chrome size={196} live={live} delay={900}>
          REPLAY
        </Chrome>
      </div>
      <div style={abs(112, 488, { ...rise(live, 220) })}>
        <Chrome size={196} live={live} delay={1300}>
          2026
        </Chrome>
      </div>
      <p
        style={abs(120, 760, {
          margin: 0,
          width: 900,
          fontSize: 36,
          fontWeight: 500,
          lineHeight: 1.4,
          color: INK,
          ...rise(live, 360),
        })}
      >
        A year of independent music on Loopwave — the plays, the scenes, and the fans who showed up.
      </p>
      <div style={abs(120, 930, { ...rise(live, 460), display: 'flex', gap: 16 })}>
        <span style={{ ...LABEL, fontSize: 18, color: MUTED }}>
          Loopwave for Artists · 14 November 2026
        </span>
      </div>
      <Sparkle x={1110} y={190} size={64} live={live} delay={200} />
      <Sparkle x={1716} y={760} size={48} live={live} delay={1100} period={2.8} />
      <Sparkle x={1640} y={250} size={28} live={live} delay={700} period={2.4} />
      <Sparkle x={1070} y={660} size={36} live={live} delay={1500} period={3.6} />
      <Sparkle x={1080} y={800} size={24} live={live} delay={400} period={2.6} />
    </Stage>
  );
};

const TrackRow = ({
  n,
  title,
  meta,
  playing,
}: {
  n: string;
  title: string;
  meta: string;
  playing?: boolean;
}) => (
  <div
    style={{
      height: 58,
      margin: '0 18px',
      padding: '0 22px',
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      borderRadius: 999,
      background: playing ? `${GLOSS}, ${HOLO_LINEAR}` : 'transparent',
      border: playing ? '2px solid #FFFFFF' : '2px solid transparent',
      boxShadow: playing ? '0 8px 20px rgba(110,84,240,0.2)' : undefined,
    }}
  >
    <span style={{ ...LCD, fontSize: 32, width: 36, color: playing ? INK : MUTED }}>{n}</span>
    <span style={{ fontSize: 30, fontWeight: 600, flex: 1 }}>{title}</span>
    <span style={{ fontSize: 24, fontWeight: 500, color: playing ? INK : MUTED }}>{meta}</span>
  </div>
);

const PlayerKey = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <div
    style={abs(x, y, {
      width: 80,
      height: 30,
      marginLeft: -40,
      marginTop: -15,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '0.12em',
      color: '#8A86AE',
    })}
  >
    {children}
  </div>
);

const Player = ({ x, y, live }: { x: number; y: number; live: boolean }) => (
  <div
    style={abs(x, y, {
      width: 420,
      height: 690,
      borderRadius: 64,
      background:
        'linear-gradient(115deg, #FFFFFF 0%, #E9E7F7 30%, #C7C4E2 52%, #F7F6FF 64%, #D2CFEA 100%)',
      border: '3px solid #FFFFFF',
      boxShadow:
        '0 40px 90px rgba(70,50,160,0.28), inset 0 -10px 30px rgba(90,80,170,0.18), inset 0 0 0 1px rgba(150,140,220,0.4)',
    })}
  >
    <div
      style={abs(36, 40, {
        width: 348,
        height: 260,
        borderRadius: 22,
        background: 'linear-gradient(180deg, #E4FBF4 0%, #BFEBE0 100%)',
        border: '3px solid #9FA3C8',
        boxShadow: 'inset 0 4px 14px rgba(46,58,92,0.25)',
        color: LCD_TEXT,
        padding: '22px 24px',
        boxSizing: 'border-box',
      })}
    >
      <div style={{ ...LCD, fontSize: 26, display: 'flex', justifyContent: 'space-between' }}>
        <span>NOW PLAYING</span>
        <span>▮▮▮▯</span>
      </div>
      <div style={{ ...LCD, fontSize: 52, marginTop: 22 }}>REPLAY 2026</div>
      <div style={{ ...LCD, fontSize: 28, marginTop: 6 }}>
        LOOPWAVE
        <span style={{ ...anim(live, 'lw-blink 1.1s steps(1, end) infinite') }}>_</span>
      </div>
      <div
        style={{
          marginTop: 26,
          height: 12,
          borderRadius: 6,
          background: 'rgba(46,58,92,0.18)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '34%',
            borderRadius: 6,
            background: LCD_TEXT,
          }}
        />
      </div>
      <div
        style={{
          ...LCD,
          fontSize: 24,
          marginTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>01:24</span>
        <span>-02:51</span>
      </div>
    </div>
    <div
      style={abs(60, 340, {
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #EEEDF8 45%, #D6D3EA 100%)',
        border: '2px solid #FFFFFF',
        boxShadow: 'inset 0 -8px 20px rgba(90,80,170,0.2), 0 6px 16px rgba(90,80,170,0.18)',
      })}
    >
      <PlayerKey x={150} y={38}>
        MENU
      </PlayerKey>
      <PlayerKey x={150} y={262}>
        ▶︎❚❚
      </PlayerKey>
      <PlayerKey x={40} y={150}>
        ◀◀
      </PlayerKey>
      <PlayerKey x={260} y={150}>
        ▶▶
      </PlayerKey>
      <Orb size={112} tint={HOLO_CONIC} style={abs(94, 94)} />
    </div>
  </div>
);

const Tracklist: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="00">Tonight's running order</Eyebrow>
      <Heading live={live}>The tracklist.</Heading>
      <div style={{ ...abs(0, 0), width: '100%', height: '100%', ...rise(live, 160) }}>
        <Window x={120} y={300} w={1060} h={640} title="Replay_2026.m3u">
          <div style={{ paddingTop: 16 }}>
            <TrackRow n="01" title="Total streams" meta="48.6B plays" playing />
            <TrackRow n="02" title="Royalties" meta="$1.42B paid" />
            <TrackRow n="03" title="Top genres" meta="six sounds" />
            <TrackRow n="04" title="Listening by hour" meta="24 hours" />
            <TrackRow n="05" title="Fastest risers" meta="top five" />
            <TrackRow n="06" title="Playlist adds" meta="1.9B adds" />
            <TrackRow n="07" title="Fan geography" meta="190 countries" />
            <TrackRow n="08" title="Superfans" meta="the 2%" />
            <TrackRow n="09" title="Coming in 2027" meta="bonus track" />
          </div>
        </Window>
      </div>
      <div style={{ ...abs(0, 0), ...rise(live, 300) }}>
        <Player x={1340} y={250} live={live} />
      </div>
      <Sparkle x={1300} y={230} size={46} live={live} delay={600} />
      <Sparkle x={1740} y={560} size={30} live={live} delay={1300} period={2.6} />
      <Sparkle x={1712} y={226} size={22} live={live} delay={200} period={2.2} />
      <Footer />
    </Stage>
  );
};

const StatCard = ({
  x,
  value,
  label,
  live,
  delay,
}: {
  x: number;
  value: string;
  label: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={abs(x, 690, {
      ...GLASS,
      width: 520,
      height: 220,
      padding: '34px 40px',
      boxSizing: 'border-box',
      ...rise(live, delay),
    })}
  >
    <div style={{ ...DISPLAY, fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>
      <HoloText>{value}</HoloText>
    </div>
    <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.35, marginTop: 14, color: INK }}>
      {label}
    </div>
  </div>
);

const Streams: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="01">Total streams</Eyebrow>
      <div style={abs(104, 196, { ...rise(live, 80) })}>
        <Chrome size={290} live={live} delay={800}>
          48.6B
        </Chrome>
      </div>
      <Pill size={22} tint={TINT_MINT} style={{ ...abs(1390, 300), ...pop(live, 600) }}>
        ▲ 31% vs 2025
      </Pill>
      <p
        style={abs(120, 548, {
          margin: 0,
          fontSize: 44,
          fontWeight: 500,
          lineHeight: 1.3,
          ...rise(live, 260),
        })}
      >
        streams of independent music on Loopwave in 2026.
      </p>
      <StatCard
        x={120}
        value="2.3M"
        label="independent artists were streamed at least once"
        live={live}
        delay={420}
      />
      <StatCard
        x={700}
        value="412M"
        label="listeners pressed play on an indie track"
        live={live}
        delay={520}
      />
      <StatCard
        x={1280}
        value="1 in 3"
        label="streams on Loopwave was an indie release"
        live={live}
        delay={620}
      />
      <Sparkle x={1310} y={196} size={58} live={live} delay={900} />
      <Sparkle x={1700} y={420} size={30} live={live} delay={300} period={2.6} />
      <Footer />
    </Stage>
  );
};

const TUBE_TOP = 290;
const TUBE_H = 610;
const TUBE_SCALE = 470 / 1.42;
const TUBE_GLOSS =
  'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.75) 18%, rgba(255,255,255,0.12) 46%, rgba(255,255,255,0) 70%)';

const Tube = ({
  x,
  year,
  value,
  label,
  live,
  delay,
  hero,
}: {
  x: number;
  year: string;
  value: number;
  label: string;
  live: boolean;
  delay: number;
  hero?: boolean;
}) => {
  const fill = Math.round(value * TUBE_SCALE);
  return (
    <>
      <div
        style={abs(x, TUBE_TOP, {
          width: 150,
          height: TUBE_H,
          borderRadius: 75,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.75), rgba(255,255,255,0.35))',
          border: '2px solid #FFFFFF',
          boxShadow:
            'inset 0 0 0 1px rgba(150,140,220,0.3), inset 8px 0 18px rgba(255,255,255,0.9), 0 20px 40px rgba(76,56,170,0.12)',
        })}
      />
      <div
        style={abs(x + 10, TUBE_TOP + TUBE_H - 10 - fill, {
          width: 130,
          height: fill,
          borderRadius: 65,
          transformOrigin: 'bottom center',
          background: hero
            ? `${TUBE_GLOSS}, linear-gradient(0deg, ${MINT} 0%, ${PERI} 50%, ${PINK} 100%)`
            : `${TUBE_GLOSS}, linear-gradient(0deg, #D9D7EE 0%, #B9B6DC 100%)`,
          boxShadow: hero
            ? '0 0 40px rgba(255,155,211,0.55), inset 0 -10px 20px rgba(80,60,180,0.18)'
            : 'inset 0 -10px 20px rgba(80,60,180,0.12)',
          ...anim(live, `lw-growy 1400ms ${FLOAT} ${delay}ms both`),
        })}
      />
      <div
        style={abs(x, TUBE_TOP + TUBE_H - 10 - fill - 54, {
          width: 150,
          textAlign: 'center',
          ...DISPLAY,
          fontSize: 28,
          fontWeight: 700,
          color: hero ? INK : MUTED,
          ...anim(live, `lw-fade 500ms ease-out ${delay + 900}ms both`),
        })}
      >
        {label}
      </div>
      <div
        style={abs(x, TUBE_TOP + TUBE_H + 18, {
          width: 150,
          textAlign: 'center',
          ...LCD,
          fontSize: 36,
          color: hero ? INK : MUTED,
        })}
      >
        {year}
      </div>
    </>
  );
};

const Royalties: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="02">Royalties</Eyebrow>
      <Heading live={live}>
        The money
        <br />
        moved too.
      </Heading>
      <div style={abs(110, 420, { ...rise(live, 200) })}>
        <Chrome size={150} live={live} delay={1200}>
          $1.42B
        </Chrome>
      </div>
      <p
        style={abs(120, 620, {
          margin: 0,
          width: 760,
          fontSize: 32,
          fontWeight: 500,
          lineHeight: 1.5,
          ...rise(live, 320),
        })}
      >
        paid to independent artists in 2026 — double what we paid in 2023. The median payout per
        active artist rose 22% to <strong style={{ fontWeight: 700 }}>$1,860</strong>.
      </p>
      <Tube x={1040} year="2023" value={0.71} label="$0.71B" live={live} delay={300} />
      <Tube x={1240} year="2024" value={0.93} label="$0.93B" live={live} delay={420} />
      <Tube x={1440} year="2025" value={1.12} label="$1.12B" live={live} delay={540} />
      <Tube x={1640} year="2026" value={1.42} label="$1.42B" live={live} delay={660} hero />
      <Sparkle x={1756} y={300} size={44} live={live} delay={1500} />
      <Sparkle x={1600} y={330} size={22} live={live} delay={600} period={2.4} />
      <Footer />
    </Stage>
  );
};

const BAR_X = 680;
const BAR_MAX = 820;

const GenreRow = ({
  y,
  rank,
  name,
  share,
  growth,
  down,
  live,
  delay,
}: {
  y: number;
  rank: string;
  name: string;
  share: number;
  growth: string;
  down?: boolean;
  live: boolean;
  delay: number;
}) => {
  const w = Math.round((share / 14.2) * BAR_MAX);
  return (
    <>
      <div style={abs(120, y + 6, { ...LCD, fontSize: 40, color: MUTED })}>{rank}</div>
      <div
        style={abs(190, y + 6, {
          fontSize: 34,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          ...rise(live, delay),
        })}
      >
        {name}
      </div>
      <div
        style={abs(BAR_X, y, {
          width: w,
          height: 56,
          borderRadius: 28,
          background: `${GLOSS}, ${HOLO_LINEAR}`,
          backgroundSize: `100% 100%, ${BAR_MAX}px 100%`,
          border: '2px solid #FFFFFF',
          boxShadow: '0 10px 24px rgba(110,84,240,0.2), inset 0 -5px 10px rgba(80,60,180,0.16)',
          transformOrigin: 'left center',
          ...anim(live, `lw-growx 1200ms ${FLOAT} ${delay + 100}ms both`),
        })}
      />
      <div
        style={abs(BAR_X + w + 22, y + 10, {
          ...DISPLAY,
          fontSize: 30,
          fontWeight: 700,
          ...anim(live, `lw-fade 500ms ease-out ${delay + 900}ms both`),
        })}
      >
        {share.toFixed(1)}%
      </div>
      <Pill
        size={18}
        tint={down ? SILVER : TINT_MINT}
        style={{ position: 'absolute', right: 120, top: y + 6, ...pop(live, delay + 700) }}
      >
        {down ? '▼' : '▲'} {growth}
      </Pill>
    </>
  );
};

const Genres: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="03">Top genres · share of indie streams</Eyebrow>
      <Heading live={live}>Six sounds ran the year.</Heading>
      <GenreRow
        y={330}
        rank="1"
        name="Bedroom pop"
        share={14.2}
        growth="18%"
        live={live}
        delay={200}
      />
      <GenreRow y={428} rank="2" name="Alt R&B" share={11.8} growth="24%" live={live} delay={300} />
      <GenreRow
        y={526}
        rank="3"
        name="Afro-fusion"
        share={10.9}
        growth="57%"
        live={live}
        delay={400}
      />
      <GenreRow y={624} rank="4" name="Hyperpop" share={8.4} growth="33%" live={live} delay={500} />
      <GenreRow
        y={722}
        rank="5"
        name="Lo-fi beats"
        share={7.6}
        growth="4%"
        down
        live={live}
        delay={600}
      />
      <GenreRow
        y={820}
        rank="6"
        name="Indie regional Mexican"
        share={6.9}
        growth="81%"
        live={live}
        delay={700}
      />
      <div
        style={abs(1520, 266, {
          ...LABEL,
          fontSize: 18,
          color: MUTED,
          width: 280,
          textAlign: 'right',
        })}
      >
        Growth vs 2025
      </div>
      <Sparkle x={1530} y={318} size={36} live={live} delay={1400} />
      <Footer />
    </Stage>
  );
};

const PLOT_BASE = 470;
const PLOT_MAX = 360;
const SLOT = 62;
const PLOT_X = 150;

const EqBar = ({
  hour,
  v,
  live,
  peak,
  label,
}: {
  hour: number;
  v: number;
  live: boolean;
  peak?: boolean;
  label?: boolean;
}) => {
  const h = Math.round((v / 40) * PLOT_MAX);
  const x = PLOT_X + hour * SLOT;
  return (
    <>
      <div
        style={abs(x, PLOT_BASE - h, {
          width: 44,
          height: h,
          borderRadius: 8,
          transformOrigin: 'bottom center',
          background: peak
            ? `repeating-linear-gradient(0deg, rgba(255,255,255,0) 0 12px, #FAF8FF 12px 16px), linear-gradient(0deg, ${MINT} 0%, ${PERI} 45%, ${PINK} 100%)`
            : `repeating-linear-gradient(0deg, rgba(255,255,255,0) 0 12px, #FAF8FF 12px 16px), linear-gradient(0deg, #CFEFE6 0%, #C9CDF5 60%, #E9C9EA 100%)`,
          backgroundSize: `100% 100%, 100% ${PLOT_MAX}px`,
          backgroundPosition: '0 100%, 0 100%',
          boxShadow: peak ? '0 0 34px rgba(255,155,211,0.7)' : undefined,
          ...anim(live, `lw-growy 1100ms ${FLOAT} ${200 + hour * 40}ms both`),
        })}
      />
      <div
        style={abs(x, PLOT_BASE - h - 14, {
          width: 44,
          height: 6,
          borderRadius: 3,
          background: peak ? ACCENT : '#A6A2CC',
          ...anim(live, `lw-fade 400ms ease-out ${900 + hour * 40}ms both`),
        })}
      />
      {label ? (
        <div
          style={abs(x - 8, PLOT_BASE + 18, {
            width: 60,
            textAlign: 'center',
            ...LCD,
            fontSize: 28,
            color: peak ? INK : MUTED,
          })}
        >
          {String(hour).padStart(2, '0')}
        </div>
      ) : null}
    </>
  );
};

const GridLine = ({ pct }: { pct: number }) => {
  const y = PLOT_BASE - Math.round((pct / 40) * PLOT_MAX);
  return (
    <>
      <div
        style={abs(PLOT_X - 10, y, {
          width: SLOT * 24 + 6,
          height: 0,
          borderTop: '2px dashed rgba(120,110,190,0.22)',
        })}
      />
      <div
        style={abs(40, y - 14, {
          width: 80,
          textAlign: 'right',
          ...LCD,
          fontSize: 28,
          color: MUTED,
        })}
      >
        {pct}%
      </div>
    </>
  );
};

const Hours: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="04">Listening by hour</Eyebrow>
      <Heading live={live}>Indie owns the night.</Heading>
      <p
        style={abs(120, 284, {
          margin: 0,
          fontSize: 30,
          color: MUTED,
          fontWeight: 500,
          ...rise(live, 140),
        })}
      >
        Share of all Loopwave streams that were independent, by listener's local hour.
      </p>
      <div style={{ ...abs(0, 0), ...rise(live, 180) }}>
        <Window x={120} y={356} w={1680} h={590} title="Spectrum.vis — indie share by hour">
          <GridLine pct={10} />
          <GridLine pct={20} />
          <GridLine pct={30} />
          <GridLine pct={40} />
          <EqBar hour={0} v={36} live={live} label />
          <EqBar hour={1} v={38} live={live} peak />
          <EqBar hour={2} v={37} live={live} />
          <EqBar hour={3} v={35} live={live} label />
          <EqBar hour={4} v={33} live={live} />
          <EqBar hour={5} v={29} live={live} />
          <EqBar hour={6} v={25} live={live} label />
          <EqBar hour={7} v={23} live={live} />
          <EqBar hour={8} v={22} live={live} />
          <EqBar hour={9} v={23} live={live} label />
          <EqBar hour={10} v={24} live={live} />
          <EqBar hour={11} v={25} live={live} />
          <EqBar hour={12} v={26} live={live} label />
          <EqBar hour={13} v={26} live={live} />
          <EqBar hour={14} v={27} live={live} />
          <EqBar hour={15} v={27} live={live} label />
          <EqBar hour={16} v={28} live={live} />
          <EqBar hour={17} v={28} live={live} />
          <EqBar hour={18} v={29} live={live} label />
          <EqBar hour={19} v={30} live={live} />
          <EqBar hour={20} v={31} live={live} />
          <EqBar hour={21} v={33} live={live} label />
          <EqBar hour={22} v={34} live={live} />
          <EqBar hour={23} v={35} live={live} />
          <div
            style={abs(PLOT_X + SLOT + 70, 42, {
              height: 52,
              padding: '0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderRadius: 14,
              background: 'linear-gradient(180deg, #E9FBF4 0%, #CDEFE6 100%)',
              border: '2px solid #FFFFFF',
              boxShadow: 'inset 0 2px 6px rgba(46,58,92,0.18), 0 10px 22px rgba(90,70,190,0.16)',
              color: LCD_TEXT,
              ...pop(live, 1300),
            })}
          >
            <span style={{ ...LCD, fontSize: 34 }}>PEAK 01:00 · 38% INDIE</span>
          </div>
          <div
            style={abs(PLOT_X + 8 * SLOT - 40, PLOT_BASE - 198 - 96, {
              ...LCD,
              fontSize: 28,
              color: MUTED,
              width: 130,
              textAlign: 'center',
              ...anim(live, 'lw-fade 500ms ease-out 1500ms both'),
            })}
          >
            LOW 08:00
            <br />
            22%
          </div>
        </Window>
      </div>
      <Sparkle
        x={PLOT_X + SLOT + 120 + 6}
        y={356 + 58 + PLOT_BASE - 342 - 44}
        size={34}
        live={live}
        delay={1600}
      />
      <Footer />
    </Stage>
  );
};

const JewelCase = ({
  rank,
  name,
  genre,
  growth,
  from,
  to,
  hue,
  live,
  top,
}: {
  rank: string;
  name: string;
  genre: string;
  growth: string;
  from: string;
  to: string;
  hue: number;
  live: boolean;
  top?: boolean;
}) => (
  <div
    className="lw-case"
    style={{
      width: 304,
      height: 548,
      position: 'relative',
      borderRadius: 20,
      background: 'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 100%)',
      border: '2px solid #FFFFFF',
      boxShadow: top
        ? '0 0 0 3px rgba(255,155,211,0.55), 0 30px 70px rgba(224,64,143,0.28)'
        : '0 24px 56px rgba(76,56,170,0.16), inset 0 0 0 1px rgba(150,140,220,0.25)',
    }}
  >
    <div
      style={abs(0, 0, {
        width: 16,
        height: 548,
        borderRadius: '18px 0 0 18px',
        background:
          'repeating-linear-gradient(180deg, rgba(150,140,220,0.18) 0 3px, rgba(255,255,255,0) 3px 9px), linear-gradient(90deg, #FFFFFF, #E2E0F2)',
        borderRight: '1px solid rgba(150,140,220,0.3)',
      })}
    />
    <div
      style={abs(32, 18, {
        width: 256,
        height: 256,
        borderRadius: 10,
        overflow: 'hidden',
        background: `linear-gradient(${hue}deg, ${PINK} 0%, ${PERI} 40%, ${MINT} 75%, ${BUTTER} 100%)`,
        filter: `hue-rotate(${hue / 4}deg)`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.7)',
      })}
    >
      <Disc x={60} y={60} size={250} live={false} />
      <div
        style={abs(18, 14, {
          ...DISPLAY,
          fontSize: 64,
          fontWeight: 900,
          color: '#FFFFFF',
          textShadow: '0 4px 14px rgba(60,40,150,0.35)',
          letterSpacing: '-0.04em',
        })}
      >
        {rank}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(125deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 100%)',
        }}
      />
    </div>
    <div
      style={abs(32, 300, { fontSize: 32, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' })}
    >
      {name}
    </div>
    <div
      style={abs(32, 346, { fontSize: 22, fontWeight: 500, color: MUTED, whiteSpace: 'nowrap' })}
    >
      {genre}
    </div>
    <div style={abs(32, 396, { ...DISPLAY, fontSize: 42, fontWeight: 700 })}>
      <HoloText>{growth}</HoloText>
    </div>
    <div
      style={abs(32, 474, {
        height: 44,
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #E9FBF4 0%, #CDEFE6 100%)',
        boxShadow: 'inset 0 2px 5px rgba(46,58,92,0.18)',
        color: LCD_TEXT,
        ...LCD,
        fontSize: 28,
      })}
    >
      {from} → {to}
    </div>
    {top ? <Sparkle x={262} y={-26} size={54} live={live} delay={400} /> : null}
  </div>
);

const Risers: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="05">Fastest risers</Eyebrow>
      <Heading live={live}>The breakouts.</Heading>
      <p
        style={abs(120, 284, {
          margin: 0,
          fontSize: 30,
          color: MUTED,
          fontWeight: 500,
          ...rise(live, 140),
        })}
      >
        Biggest growth in monthly listeners, January → December, among artists under 50K in January.
      </p>
      <div style={abs(120, 372, { display: 'flex', gap: 40 })}>
        <Steps>
          <Step>
            <JewelCase
              rank="#5"
              name="Lunavale"
              genre="Dream pop · Montréal"
              growth="+1,240%"
              from="31K"
              to="415K"
              hue={200}
              live={live}
            />
          </Step>
          <Step>
            <JewelCase
              rank="#4"
              name="DJ Kumquat"
              genre="Amapiano · Pretoria"
              growth="+1,890%"
              from="22K"
              to="438K"
              hue={60}
              live={live}
            />
          </Step>
          <Step>
            <JewelCase
              rank="#3"
              name="Wrenfield"
              genre="Bedroom folk · Cork"
              growth="+2,630%"
              from="14K"
              to="382K"
              hue={150}
              live={live}
            />
          </Step>
          <Step>
            <JewelCase
              rank="#2"
              name="Ozi Marlé"
              genre="Afro-fusion · Lagos"
              growth="+3,350%"
              from="18K"
              to="621K"
              hue={300}
              live={live}
            />
          </Step>
          <Step>
            <JewelCase
              rank="#1"
              name="Petal Static"
              genre="Hyperpop · Leeds"
              growth="+4,180%"
              from="12K"
              to="514K"
              hue={0}
              live={live}
              top
            />
          </Step>
        </Steps>
      </div>
      <Footer />
    </Stage>
  );
};

const FunnelStep = ({
  y,
  size,
  tint,
  n,
  title,
  sub,
  live,
  delay,
}: {
  y: number;
  size: number;
  tint: string;
  n: string;
  title: string;
  sub: string;
  live: boolean;
  delay: number;
}) => (
  <>
    <div style={{ ...abs(1140 - size / 2, y), ...pop(live, delay) }}>
      <Orb size={size} tint={tint}>
        <div style={{ ...DISPLAY, fontSize: Math.round(size * 0.3), fontWeight: 900, color: INK }}>
          {n}
        </div>
      </Orb>
    </div>
    <div style={abs(1290, y + size / 2 - 40, { ...rise(live, delay + 120) })}>
      <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 500, color: MUTED, lineHeight: 1.3 }}>{sub}</div>
    </div>
  </>
);

const Playlists: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="06">Playlist adds</Eyebrow>
      <Heading live={live}>Fans did the curating.</Heading>
      <div style={abs(106, 300, { ...rise(live, 160) })}>
        <Chrome size={210} live={live} delay={1000}>
          1.9B
        </Chrome>
      </div>
      <p
        style={abs(120, 548, {
          margin: 0,
          width: 760,
          fontSize: 34,
          fontWeight: 500,
          lineHeight: 1.4,
          ...rise(live, 260),
        })}
      >
        times an independent track was added to a playlist this year.
      </p>
      <div style={abs(120, 690, { ...LABEL, fontSize: 18, color: MUTED, ...rise(live, 340) })}>
        Where the adds came from
      </div>
      <div
        style={abs(120, 728, {
          width: 760,
          height: 64,
          borderRadius: 32,
          background: SILVER,
          border: '2px solid #FFFFFF',
          boxShadow: 'inset 0 3px 8px rgba(80,60,180,0.16), 0 10px 24px rgba(110,84,240,0.14)',
          ...rise(live, 340),
        })}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '72%',
            borderRadius: 30,
            background: `${GLOSS}, ${HOLO_LINEAR}`,
            transformOrigin: 'left center',
            ...anim(live, `lw-growx 1300ms ${FLOAT} 500ms both`),
          }}
        />
        <div style={abs(26, 14, { ...DISPLAY, fontSize: 28, fontWeight: 700 })}>72%</div>
        <div
          style={{
            position: 'absolute',
            right: 26,
            top: 14,
            ...DISPLAY,
            fontSize: 28,
            fontWeight: 700,
            color: MUTED,
          }}
        >
          28%
        </div>
      </div>
      <div
        style={abs(120, 818, {
          display: 'flex',
          gap: 48,
          fontSize: 26,
          fontWeight: 500,
          ...rise(live, 420),
        })}
      >
        <span>Listener-made playlists</span>
        <span style={{ color: MUTED }}>Loopwave editorial</span>
      </div>
      <div style={abs(1000, 286, { ...LABEL, fontSize: 18, color: MUTED, ...rise(live, 300) })}>
        For every 100 playlist adds…
      </div>
      <div
        style={abs(1138, 420, {
          width: 0,
          height: 440,
          borderLeft: '4px dotted rgba(123,92,255,0.35)',
        })}
      />
      <FunnelStep
        y={330}
        size={180}
        tint={HOLO_CONIC}
        n="100"
        title="adds"
        sub="a track lands on a playlist"
        live={live}
        delay={400}
      />
      <FunnelStep
        y={540}
        size={140}
        tint={TINT_PERI}
        n="34"
        title="saves"
        sub="added to someone's library"
        live={live}
        delay={560}
      />
      <FunnelStep
        y={706}
        size={104}
        tint={TINT_PINK}
        n="11"
        title="follows"
        sub="they follow the artist"
        live={live}
        delay={720}
      />
      <FunnelStep
        y={834}
        size={76}
        tint={TINT_BUTTER}
        n="3"
        title="superfans"
        sub="within six months"
        live={live}
        delay={880}
      />
      <Footer />
    </Stage>
  );
};

const DiscTwo: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Pill size={20} style={{ ...abs(120, 220), ...rise(live, 0) }}>
        <span style={{ ...LCD, fontSize: 34, letterSpacing: 0 }}>DISC 2</span>
        <span>Side B</span>
      </Pill>
      <div style={abs(110, 310, { ...rise(live, 100) })}>
        <Chrome size={200} live={live} delay={900}>
          THE
        </Chrome>
      </div>
      <div style={abs(110, 530, { ...rise(live, 200) })}>
        <Chrome size={200} live={live} delay={1300}>
          FANS
        </Chrome>
      </div>
      <p
        style={abs(120, 800, {
          margin: 0,
          width: 950,
          fontSize: 34,
          fontWeight: 500,
          lineHeight: 1.4,
          ...rise(live, 340),
        })}
      >
        Who listened, where they were, and how hard they went.
      </p>
      <div style={{ ...abs(1090, 170), ...pop(live, 160) }}>
        <div style={{ position: 'relative', ...anim(live, 'lw-float 7s ease-in-out infinite') }}>
          <Disc x={0} y={0} size={700} live={live} period={18}>
            <div
              style={abs(350 - 150, 520, {
                width: 300,
                textAlign: 'center',
                ...LCD,
                fontSize: 34,
                color: LCD_TEXT,
                opacity: 0.7,
              })}
            >
              LOOPWAVE · REPLAY 26
            </div>
          </Disc>
        </div>
      </div>
      <Sparkle x={1060} y={180} size={60} live={live} delay={300} />
      <Sparkle x={1700} y={820} size={40} live={live} delay={1200} period={2.8} />
      <Sparkle x={980} y={760} size={26} live={live} delay={800} period={2.4} />
      <Footer />
    </Stage>
  );
};

const City = ({
  cx,
  cy,
  value,
  name,
  tint,
  live,
  delay,
}: {
  cx: number;
  cy: number;
  value: number;
  name: string;
  tint: string;
  live: boolean;
  delay: number;
}) => {
  const d = Math.round(260 * Math.sqrt(value / 2.1));
  return (
    <div style={{ ...abs(cx - d / 2, cy - d / 2), ...pop(live, delay) }}>
      <Orb size={d} tint={tint}>
        <div style={{ fontSize: d > 190 ? 28 : 22, fontWeight: 700, lineHeight: 1.15, color: INK }}>
          {name}
        </div>
        <div style={{ ...DISPLAY, fontSize: d > 190 ? 34 : 26, fontWeight: 700, color: INK }}>
          {value.toFixed(1)}B
        </div>
      </Orb>
    </div>
  );
};

const Geography: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="07">Fan geography · indie streams by city</Eyebrow>
      <Heading live={live}>Indie travels.</Heading>
      <div style={abs(106, 300, { ...rise(live, 160) })}>
        <Chrome size={210} live={live} delay={1100}>
          68%
        </Chrome>
      </div>
      <p
        style={abs(120, 548, {
          margin: 0,
          width: 700,
          fontSize: 34,
          fontWeight: 500,
          lineHeight: 1.4,
          ...rise(live, 260),
        })}
      >
        of indie streams were played outside the artist's home country — up from 54% in 2023.
      </p>
      <Pill size={20} tint={TINT_MINT} style={{ ...abs(120, 790), ...rise(live, 380) }}>
        Fastest-growing city · Lagos ▲ 96%
      </Pill>
      <City
        cx={1050}
        cy={380}
        value={2.1}
        name="Mexico City"
        tint={TINT_PINK}
        live={live}
        delay={300}
      />
      <City
        cx={1320}
        cy={330}
        value={1.8}
        name="São Paulo"
        tint={TINT_PERI}
        live={live}
        delay={380}
      />
      <City
        cx={1580}
        cy={400}
        value={1.5}
        name="Jakarta"
        tint={TINT_MINT}
        live={live}
        delay={460}
      />
      <City cx={1250} cy={610} value={1.2} name="Lagos" tint={HOLO_CONIC} live={live} delay={540} />
      <City
        cx={980}
        cy={650}
        value={0.9}
        name="Berlin"
        tint={TINT_BUTTER}
        live={live}
        delay={620}
      />
      <City cx={1510} cy={660} value={0.9} name="Manila" tint={TINT_ICE} live={live} delay={700} />
      <City
        cx={1120}
        cy={835}
        value={0.8}
        name="Los Angeles"
        tint={TINT_PERI}
        live={live}
        delay={780}
      />
      <City cx={1400} cy={850} value={0.7} name="London" tint={TINT_PINK} live={live} delay={860} />
      <div
        style={abs(1640, 760, {
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: '3px dashed rgba(123,92,255,0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: MUTED,
          ...pop(live, 940),
        })}
      >
        <div style={{ ...DISPLAY, fontSize: 26, fontWeight: 700 }}>+182</div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>more cities</div>
      </div>
      <Sparkle x={1150} y={210} size={40} live={live} delay={1300} />
      <Footer />
    </Stage>
  );
};

const ShareBar = ({
  y,
  label,
  pct,
  live,
  delay,
}: {
  y: number;
  label: string;
  pct: number;
  live: boolean;
  delay: number;
}) => (
  <>
    <div style={abs(820, y, { fontSize: 30, fontWeight: 600, ...rise(live, delay) })}>{label}</div>
    <div
      style={abs(820, y + 56, {
        width: 720,
        height: 60,
        borderRadius: 30,
        background: SILVER,
        border: '2px solid #FFFFFF',
        boxShadow: 'inset 0 3px 8px rgba(80,60,180,0.16), 0 10px 24px rgba(110,84,240,0.12)',
        ...rise(live, delay),
      })}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          minWidth: 22,
          borderRadius: 28,
          background: `${GLOSS}, ${HOLO_LINEAR}`,
          transformOrigin: 'left center',
          boxShadow: '0 0 24px rgba(255,155,211,0.5)',
          ...anim(live, `lw-growx 1300ms ${FLOAT} ${delay + 200}ms both`),
        }}
      />
    </div>
    <div style={abs(1572, y + 34, { ...rise(live, delay + 200) })}>
      <Chrome size={72} live={live} delay={delay + 1400} weight={900}>
        {pct}%
      </Chrome>
    </div>
  </>
);

const Superfans: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="08">Superfans</Eyebrow>
      <Heading live={live}>Meet the 2%.</Heading>
      <div
        style={abs(120, 316, {
          width: 560,
          height: 560,
          backgroundImage:
            'radial-gradient(circle at 28px 28px, #D6D2EC 0 17px, rgba(214,210,236,0) 18px)',
          backgroundSize: '56px 56px',
          ...anim(live, 'lw-fade 900ms ease-out 200ms both'),
        })}
      >
        <Orb
          size={42}
          tint={HOLO_CONIC}
          style={{ ...abs(8 + 56 * 7, 8 + 56 * 2), ...pop(live, 900) }}
        />
        <Orb
          size={42}
          tint={HOLO_CONIC}
          style={{ ...abs(8 + 56 * 3, 8 + 56 * 6), ...pop(live, 1050) }}
        />
      </div>
      <Sparkle x={120 + 56 * 7 + 28} y={316 + 56 * 2 - 20} size={30} live={live} delay={1300} />
      <Sparkle
        x={120 + 56 * 3 + 28}
        y={316 + 56 * 6 - 20}
        size={24}
        live={live}
        delay={1700}
        period={2.6}
      />
      <div style={abs(120, 900, { fontSize: 22, fontWeight: 500, color: MUTED })}>
        Each dot = 1% of an artist's listeners
      </div>
      <ShareBar y={316} label="Share of an artist's listeners" pct={2} live={live} delay={300} />
      <ShareBar y={516} label="Share of their streams" pct={41} live={live} delay={500} />
      <ShareBar y={716} label="Share of merch & ticket clicks" pct={63} live={live} delay={700} />
      <div style={abs(820, 900, { fontSize: 22, fontWeight: 500, color: MUTED })}>
        Superfan = an artist's top 2% of listeners by minutes played
      </div>
      <Footer />
    </Stage>
  );
};

const Badge = ({
  value,
  unit,
  text,
  tint,
  rot,
}: {
  value: string;
  unit: string;
  text: string;
  tint: string;
  rot: number;
}) => (
  <div
    className="lw-badge"
    style={{ width: 460, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
  >
    <div style={{ transform: `rotate(${rot}deg)` }}>
      <Orb size={380} tint={tint}>
        <div
          style={{
            ...DISPLAY,
            fontSize: 104,
            fontWeight: 900,
            lineHeight: 1,
            color: INK,
            letterSpacing: '-0.04em',
          }}
        >
          {value}
        </div>
        <div style={{ ...LABEL, fontSize: 20, marginTop: 16, color: INK }}>{unit}</div>
      </Orb>
    </div>
    <div
      style={{
        marginTop: 44,
        fontSize: 30,
        fontWeight: 500,
        lineHeight: 1.4,
        textAlign: 'center',
        width: 440,
      }}
    >
      {text}
    </div>
  </div>
);

const SuperfanHabits: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="08">Superfans · behaviour</Eyebrow>
      <Heading live={live}>What a superfan does.</Heading>
      <div style={abs(120, 330, { width: 1680, display: 'flex', justifyContent: 'space-between' })}>
        <Steps>
          <Step>
            <Badge
              value="9.4×"
              unit="streams / month"
              text="more streams a month than the average listener of that artist"
              tint={`linear-gradient(150deg, #FFFFFF 0%, ${PINK} 45%, ${PERI} 100%)`}
              rot={-4}
            />
          </Step>
          <Step>
            <Badge
              value="58%"
              unit="day-one plays"
              text="play a new release within 24 hours of it dropping"
              tint={`linear-gradient(150deg, #FFFFFF 0%, ${MINT} 45%, ${ICE} 100%)`}
              rot={3}
            />
          </Step>
          <Step>
            <Badge
              value="3.2×"
              unit="shares"
              text="more likely to share a track to stories or group chats"
              tint={`linear-gradient(150deg, #FFFFFF 0%, ${BUTTER} 45%, ${PINK} 100%)`}
              rot={-2}
            />
          </Step>
        </Steps>
      </div>
      <Sparkle x={500} y={330} size={46} live={live} delay={500} />
      <Sparkle x={1100} y={680} size={30} live={live} delay={1200} period={2.6} />
      <Sparkle x={1720} y={360} size={38} live={live} delay={900} period={3.4} />
      <Footer />
    </Stage>
  );
};

const Install = ({
  q,
  name,
  desc,
  pct,
  status,
  tint,
}: {
  q: string;
  name: string;
  desc: string;
  pct: number;
  status: string;
  tint: string;
}) => (
  <div
    style={{
      ...GLASS,
      width: 1680,
      height: 132,
      marginBottom: 22,
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      padding: '0 40px 0 26px',
      gap: 30,
    }}
  >
    <Orb size={88} tint={tint}>
      <span style={{ ...LCD, fontSize: 38, color: INK }}>{q}</span>
    </Orb>
    <div style={{ width: 860 }}>
      <div style={{ ...DISPLAY, fontSize: 36, fontWeight: 700, lineHeight: 1.15 }}>{name}</div>
      <div
        style={{ fontSize: 28, fontWeight: 500, color: MUTED, marginTop: 6, whiteSpace: 'nowrap' }}
      >
        {desc}
      </div>
    </div>
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          ...LCD,
          fontSize: 28,
          color: LCD_TEXT,
          marginBottom: 10,
        }}
      >
        <span>{status}</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          height: 30,
          borderRadius: 15,
          background: SILVER,
          border: '2px solid #FFFFFF',
          boxShadow: 'inset 0 3px 7px rgba(80,60,180,0.18)',
          position: 'relative',
        }}
      >
        <div
          className="lw-fill"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            borderRadius: 13,
            background: `repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 18px, rgba(255,255,255,0.55) 18px 22px), ${GLOSS}, ${HOLO_LINEAR}`,
          }}
        />
      </div>
    </div>
  </div>
);

const Roadmap: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="09">Coming in 2027</Eyebrow>
      <Heading live={live}>Now installing: 2027.</Heading>
      <div style={abs(120, 318)}>
        <Steps>
          <Step>
            <Install
              q="Q1"
              name="Fan Pass"
              desc="Paid memberships for your superfans. You keep 90%."
              pct={90}
              status="BETA LIVE · MAR"
              tint={TINT_PINK}
            />
          </Step>
          <Step>
            <Install
              q="Q2"
              name="Replay Live"
              desc="Your Replay stats, refreshed daily instead of yearly."
              pct={60}
              status="BUILDING · MAY"
              tint={TINT_PERI}
            />
          </Step>
          <Step>
            <Install
              q="Q3"
              name="Split Sheets"
              desc="Collaborator royalties split automatically at source."
              pct={35}
              status="IN DESIGN · AUG"
              tint={TINT_MINT}
            />
          </Step>
          <Step>
            <Install
              q="Q4"
              name="Tour Radar"
              desc="Route tours to the cities where your fans actually are."
              pct={15}
              status="RESEARCH · NOV"
              tint={TINT_BUTTER}
            />
          </Step>
        </Steps>
      </div>
      <Sparkle x={1740} y={250} size={40} live={live} delay={700} />
      <Footer />
    </Stage>
  );
};

const Perk = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 18, height: 58 }}>
    <Orb size={34} tint={TINT_MINT}>
      <span style={{ fontSize: 18, fontWeight: 700, color: INK }}>✓</span>
    </Orb>
    <span style={{ fontSize: 28, fontWeight: 500 }}>{children}</span>
  </div>
);

const Fact = ({ tint, children }: { tint: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 76 }}>
    <Orb size={40} tint={tint} />
    <span style={{ fontSize: 32, fontWeight: 500 }}>{children}</span>
  </div>
);

const FanPass: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <Eyebrow n="09B">Bonus track · Fan Pass</Eyebrow>
      <Heading live={live} size={68}>
        Your superfans,
        <br />
        direct.
      </Heading>
      <div style={abs(120, 420, { ...rise(live, 240) })}>
        <Fact tint={TINT_PINK}>
          Artists keep <strong style={{ fontWeight: 700 }}>90%</strong> of every membership
        </Fact>
        <Fact tint={TINT_PERI}>Launching March 2027 in 30 markets</Fact>
        <Fact tint={TINT_MINT}>
          Beta: 1,200 artists, median <strong style={{ fontWeight: 700 }}>$2,340</strong> a month
        </Fact>
      </div>
      <Pill size={20} style={{ ...abs(120, 700), ...rise(live, 360) }}>
        Beta sign-ups open today
      </Pill>
      <div style={{ ...abs(0, 0), ...rise(live, 200) }}>
        <Window x={1040} y={150} w={760} h={790} title="fanpass.loopwave.fm/petalstatic">
          <div
            style={abs(24, 24, {
              width: 708,
              height: 230,
              borderRadius: 20,
              background: `${HOLO_LINEAR}`,
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.8)',
            })}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 20,
                background:
                  'linear-gradient(125deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 40%)',
              }}
            />
            <Disc x={36} y={35} size={160} live={live} period={12} />
            <div style={abs(230, 56, { ...DISPLAY, fontSize: 44, fontWeight: 900, color: INK })}>
              Petal Static
            </div>
            <div
              style={abs(232, 124, { fontSize: 24, fontWeight: 600, color: INK, opacity: 0.75 })}
            >
              Hyperpop · Leeds · 514K listeners
            </div>
          </div>
          <div style={abs(48, 286, { display: 'flex', alignItems: 'baseline', gap: 14 })}>
            <span style={{ ...DISPLAY, fontSize: 56, fontWeight: 900 }}>
              <HoloText>$4</HoloText>
            </span>
            <span style={{ fontSize: 28, fontWeight: 500, color: MUTED }}>
              a month · cancel anytime
            </span>
          </div>
          <div style={abs(48, 384)}>
            <Perk>Early drops 48 hours before release</Perk>
            <Perk>Monthly voice notes + the demo vault</Perk>
            <Perk>Presale codes for every show</Perk>
          </div>
          <div
            style={abs(48, 600, {
              width: 664,
              height: 92,
              borderRadius: 46,
              background: `${GLOSS}, linear-gradient(180deg, #9C8BFF 0%, #6A4BF5 100%)`,
              border: '2px solid #FFFFFF',
              boxShadow: '0 16px 34px rgba(106,75,245,0.4), inset 0 -6px 14px rgba(40,20,140,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            })}
          >
            <span
              style={{
                ...DISPLAY,
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                textShadow: '0 2px 6px rgba(40,20,140,0.4)',
                position: 'relative',
              }}
            >
              Join Fan Pass
            </span>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 120,
                height: '100%',
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))',
                transform: 'translateX(-160%) skewX(-18deg)',
                ...anim(live, 'lw-glint 4.2s ease-in-out 1200ms infinite'),
              }}
            />
          </div>
        </Window>
      </div>
      <Sparkle x={1760} y={130} size={50} live={live} delay={900} />
      <Sparkle x={1010} y={700} size={30} live={live} delay={1500} period={2.6} />
      <Footer />
    </Stage>
  );
};

const Close: Page = () => {
  const live = useLive();
  return (
    <Stage>
      <div style={{ ...abs(830, 130), ...pop(live, 0) }}>
        <div style={{ position: 'relative', ...anim(live, 'lw-float 6s ease-in-out infinite') }}>
          <Orb size={260} tint={HOLO_CONIC}>
            <svg
              width="110"
              height="120"
              viewBox="0 0 110 120"
              aria-hidden="true"
              style={{ marginLeft: 18 }}
            >
              <path
                d="M14 10 C14 2 22 -2 30 3 L102 50 C108 54 108 66 102 70 L30 117 C22 122 14 118 14 110 Z"
                fill="#FFFFFF"
                style={{ filter: 'drop-shadow(0 6px 10px rgba(60,40,150,0.35))' }}
              />
            </svg>
          </Orb>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 440,
          textAlign: 'center',
          ...rise(live, 160),
        }}
      >
        <Chrome size={150} live={live} delay={900}>
          PRESS PLAY
        </Chrome>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 616,
          textAlign: 'center',
          ...rise(live, 260),
        }}
      >
        <Chrome size={150} live={live} delay={1300}>
          ON 2027.
        </Chrome>
      </div>
      <p
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 822,
          margin: 0,
          textAlign: 'center',
          fontSize: 34,
          fontWeight: 500,
          ...rise(live, 380),
        }}
      >
        Your personal Replay dashboard is live today — thank you for an incredible year.
      </p>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 900,
          display: 'flex',
          justifyContent: 'center',
          ...rise(live, 460),
        }}
      >
        <Pill size={22} style={{ textTransform: 'none', letterSpacing: '0.04em' }}>
          artists.loopwave.fm/replay
        </Pill>
      </div>
      <Sparkle x={770} y={140} size={56} live={live} delay={400} />
      <Sparkle x={1110} y={330} size={36} live={live} delay={1100} period={2.6} />
      <Sparkle x={300} y={300} size={40} live={live} delay={800} period={3.4} />
      <Sparkle x={1580} y={260} size={48} live={live} delay={1500} period={3} />
      <Sparkle x={1660} y={760} size={28} live={live} delay={200} period={2.4} />
      <Sparkle x={220} y={780} size={30} live={live} delay={1300} period={2.8} />
    </Stage>
  );
};

export const meta: SlideMeta = {
  title: 'Loopwave Replay 2026',
  createdAt: '2026-10-12T12:12:09.613Z',
};

export const notes: (string | undefined)[] = [
  `Welcome everyone — thanks for making the trip to Berlin.
This is Replay 2026: the year on Loopwave, told from the point of view of independent artists. Not the majors, not the charts — you.
Everything in the next twenty minutes is a number you helped create. Let's press play.`,
  `Here's the running order. Nine tracks, about twenty minutes.
We'll go from the big picture — streams and money — into genres and listening habits, then the artists who broke out.
Disc 2 is about fans: where they are and the small group that matters most. And there's a bonus track at the end about what we're shipping next year.`,
  `Track one. Forty-eight point six billion streams of independent music this year — up thirty-one percent.
To put that in context: one in every three streams on Loopwave is now an indie release. Three years ago it was one in five.
And it's broad, not top-heavy: two point three million different independent artists got played at least once.`,
  `Streams only matter if they turn into money, so: one point four two billion dollars paid to independent artists this year.
That's double 2023. Walk the tubes left to right — every year steeper than the one before.
The number I'd hold onto is the median: one thousand eight hundred sixty dollars per active artist, up twenty-two percent. That's the middle of the pack, not the stars.`,
  `What did people actually listen to? Bedroom pop is still the biggest slice at just over fourteen percent.
But look at the growth column. Afro-fusion up fifty-seven percent, indie regional Mexican up eighty-one.
Lo-fi beats is the only genre that shrank — a sign that background listening is moving to other formats.`,
  `This one surprised us. Indie's share of listening climbs through the evening and peaks at one in the morning — thirty-eight percent of everything played at 1 a.m. is independent.
The low point is the morning commute, eight a.m., at twenty-two percent — that's when the big playlists and podcasts win.
Practical takeaway: late-night release promos and listening parties land with your audience.`,
  `Track five — the breakouts. All five started the year under fifty thousand monthly listeners.
Count them down: Lunavale, DJ Kumquat, Wrenfield, Ozi Marlé…
And number one: Petal Static, from twelve thousand to over half a million. Forty-one hundred percent. Two of these five are in the room tonight — say hi to them later.`,
  `One point nine billion playlist adds for independent tracks this year, and seventy-two percent came from playlists that listeners made themselves — not our editorial team.
Follow the funnel on the right: of every hundred adds, thirty-four become library saves, eleven become follows, and three people become superfans within six months.
That last number is where Disc 2 picks up.`,
  `Flip the record. Disc 2 is about the people on the other end of those streams — where they are, and how deep they go.`,
  `Indie travels. Sixty-eight percent of independent streams were played outside the artist's home country — up from fifty-four percent in 2023.
Mexico City, São Paulo and Jakarta are your three biggest indie listening cities.
Lagos is the one to watch — up ninety-six percent this year. And there's a long tail of another hundred and eighty-two cities with more than a hundred million indie streams each.`,
  `Now the most important chart in the deck. Superfans — the top two percent of an artist's listeners by minutes played.
Two percent of the people… forty-one percent of the streams… and sixty-three percent of every click to merch and tickets.
If you take one thing home from tonight: your business runs on that tiny highlighted group of dots.`,
  `So what does a superfan actually do? First: they stream nine point four times more than an average listener of the same artist.
Second: fifty-eight percent of them play your new release within twenty-four hours. They are your launch week.
Third: they're three point two times more likely to share you to stories or group chats. They're your marketing team.`,
  `Which brings us to 2027. Four things are installing, in order.
Q1, Fan Pass — more on that in a second. Q2, Replay Live: everything you saw tonight, refreshed daily on your dashboard instead of once a year.
Q3, Split Sheets — collaborator royalties split automatically at source. Q4, Tour Radar — route your tour to the cities where your fans actually are.`,
  `The bonus track: Fan Pass. A paid membership your superfans buy directly from you, inside Loopwave.
You keep ninety percent. We launch in March in thirty markets.
Our beta has twelve hundred artists and the median is already two thousand three hundred forty dollars a month. Sign-ups for the next beta wave open today.`,
  `That's Replay 2026. Your personal Replay dashboard is live right now at artists.loopwave.fm/replay — every chart you saw tonight, for your own catalog.
Thank you for an incredible year. Let's press play on 2027.`,
];

export default [
  Cover,
  Tracklist,
  Streams,
  Royalties,
  Genres,
  Hours,
  Risers,
  Playlists,
  DiscTwo,
  Geography,
  Superfans,
  SuperfanHabits,
  Roadmap,
  FanPass,
  Close,
] satisfies Page[];

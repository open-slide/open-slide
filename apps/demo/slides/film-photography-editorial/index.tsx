import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useId } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#f2ede3', text: '#15120f', accent: '#7b1e22' },
  fonts: {
    display: '"Bodoni Moda", "Didot", "Bodoni 72", Georgia, serif',
    body: '"Jost", "Futura", "Avenir Next", system-ui, sans-serif',
  },
  typeScale: { hero: 230, body: 32 },
  radius: 0,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400;1,6..96,500&family=Jost:wght@400;500&display=swap';
const FONT_LINK_ID = 'osd-webfont-film-photography-editorial';
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

const muted = '#6f665b';
const hairline = 'rgba(21, 18, 15, 0.22)';
const filmBase = '#17120f';
const edgeAmber = '#d48a3c';
const serif = 'var(--osd-font-display)';
const sans = 'var(--osd-font-body)';

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1'/></filter><rect width='220' height='220' filter='url(%23g)'/></svg>")`;
const HOLES_X = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='18'><rect x='11' y='2' width='18' height='14' rx='3' fill='%23efe9dc'/></svg>")`;
const HOLES_Y = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='40'><rect x='2' y='11' width='14' height='18' rx='3' fill='%23efe9dc'/></svg>")`;
const HOLES_X_DARK = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='34' height='14'><rect x='9' y='2' width='16' height='10' rx='2.5' fill='%23302925'/></svg>")`;

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: serif,
  overflow: 'hidden',
};

const caps: CSSProperties = {
  fontFamily: sans,
  fontSize: 22,
  fontWeight: 500,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
};

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateX(calc(var(--osd-dir, 1) * 10px))' },
      { opacity: 1, transform: 'translateX(0)' },
    ],
  },
};

const breath: SlideTransition = {
  duration: 520,
  throughBackground: true,
  exit: { duration: 200, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: {
    duration: 280,
    delay: 320,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const Paper = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: GRAIN,
      backgroundSize: '220px',
      mixBlendMode: 'multiply',
      opacity: 0.09,
      pointerEvents: 'none',
    }}
  />
);

const Folio = ({ section }: { section: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingBottom: 14,
          borderBottom: `1px solid ${hairline}`,
          color: muted,
        }}
      >
        <span style={caps}>Meridian · Autumn 2026</span>
        <span style={caps}>Culture — The Slow Return of Film</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingTop: 12,
          borderTop: `1px solid ${hairline}`,
          color: muted,
        }}
      >
        <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24 }}>{section}</span>
        <span style={{ fontFamily: serif, fontSize: 24, letterSpacing: '0.08em' }}>
          {String(current).padStart(2, '0')}
          <span style={{ color: 'var(--osd-accent)', margin: '0 12px' }}>/</span>
          {String(total).padStart(2, '0')}
        </span>
      </div>
    </>
  );
};

const Eyebrow = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ ...caps, color: 'var(--osd-accent)', ...style }}>{children}</div>
);

const useSceneId = () => useId().replace(/[^a-zA-Z0-9_-]/g, '');

const sceneSvg: CSSProperties = { display: 'block', width: '100%', height: '100%' };

const SceneDunes = () => {
  const id = useSceneId();
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" style={sceneSvg}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3cf9b" />
          <stop offset="0.45" stopColor="#e7a070" />
          <stop offset="0.8" stopColor="#b85c40" />
        </linearGradient>
        <radialGradient id={`${id}sun`}>
          <stop offset="0" stopColor="#fff1cf" />
          <stop offset="0.35" stopColor="#fbd9a2" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f2b07a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="200" fill={`url(#${id}sky)`} />
      <circle cx="204" cy="112" r="64" fill={`url(#${id}sun)`} />
      <circle cx="204" cy="112" r="20" fill="#fde8c0" />
      <path d="M0 128 Q 70 104 140 121 T 300 114 L300 200 L0 200Z" fill="#a8563d" />
      <path d="M0 150 Q 90 121 170 145 T 300 139 V200 H0Z" fill="#7d3b2b" />
      <path d="M0 173 Q 120 150 220 170 T 300 167 V200H0Z" fill="#4a2118" />
      <rect x="118" y="131" width="2.6" height="11" fill="#3a1a13" />
      <circle cx="119.3" cy="129.4" r="2" fill="#3a1a13" />
    </svg>
  );
};

const SceneStreet = () => {
  const id = useSceneId();
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" style={sceneSvg}>
      <defs>
        <linearGradient id={`${id}night`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1820" />
          <stop offset="0.65" stopColor="#1b2b31" />
          <stop offset="1" stopColor="#2a1c17" />
        </linearGradient>
        <radialGradient id={`${id}halo`}>
          <stop offset="0" stopColor="#ffd8a2" />
          <stop offset="0.25" stopColor="#ff7a3c" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff3d1f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="200" fill={`url(#${id}night)`} />
      <rect x="0" y="40" width="70" height="120" fill="#081016" />
      <rect x="74" y="70" width="56" height="90" fill="#0a141a" />
      <rect x="190" y="30" width="110" height="130" fill="#071015" />
      <rect x="12" y="58" width="8" height="10" fill="#f2b45a" opacity="0.75" />
      <rect x="32" y="58" width="8" height="10" fill="#f2b45a" opacity="0.35" />
      <rect x="12" y="84" width="8" height="10" fill="#f2b45a" opacity="0.55" />
      <rect x="86" y="88" width="7" height="9" fill="#f2b45a" opacity="0.6" />
      <rect x="208" y="52" width="9" height="11" fill="#f2b45a" opacity="0.5" />
      <rect x="250" y="76" width="9" height="11" fill="#f2b45a" opacity="0.8" />
      <rect x="226" y="100" width="40" height="12" rx="2" fill="#e8453a" opacity="0.85" />
      <circle cx="246" cy="106" r="30" fill={`url(#${id}halo)`} opacity="0.7" />
      <rect x="150" y="54" width="2.5" height="106" fill="#050a0d" />
      <circle cx="151" cy="54" r="46" fill={`url(#${id}halo)`} />
      <circle cx="151" cy="54" r="5" fill="#fff0d4" />
      <circle cx="40" cy="128" r="12" fill="#f6a55a" opacity="0.28" />
      <circle cx="104" cy="136" r="8" fill="#f6c27a" opacity="0.35" />
      <circle cx="176" cy="126" r="14" fill="#e8574a" opacity="0.25" />
      <circle cx="282" cy="140" r="10" fill="#f6a55a" opacity="0.3" />
      <rect x="0" y="160" width="300" height="40" fill="#1a1411" />
      <rect x="146" y="162" width="10" height="38" fill="#ff9a50" opacity="0.22" />
      <rect x="236" y="162" width="18" height="38" fill="#e8453a" opacity="0.18" />
    </svg>
  );
};

const ScenePortrait = () => {
  const id = useSceneId();
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" style={sceneSvg}>
      <defs>
        <radialGradient id={`${id}bg`} cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#ddd7cd" />
          <stop offset="1" stopColor="#5f5a54" />
        </radialGradient>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#efe8dc" stopOpacity="0.7" />
          <stop offset="0.25" stopColor="#efe8dc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="300" height="200" fill={`url(#${id}bg)`} />
      <path d="M78 200 Q 92 138 158 132 Q 226 136 238 200Z" fill="#1f1c1a" />
      <rect x="146" y="104" width="26" height="34" fill="#2a2624" />
      <ellipse cx="158" cy="80" rx="31" ry="39" fill="#2d2927" />
      <path
        d="M124 78 Q 126 36 162 36 Q 196 38 192 82 Q 184 56 158 54 Q 134 58 124 78Z"
        fill="#141210"
      />
      <ellipse cx="158" cy="80" rx="31" ry="39" fill={`url(#${id}rim)`} />
      <path
        d="M92 200 Q 104 146 150 138"
        stroke="#efe8dc"
        strokeOpacity="0.35"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
};

const SceneSea = () => {
  const id = useSceneId();
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" style={sceneSvg}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ebe8e2" />
          <stop offset="1" stopColor="#a8a6a0" />
        </linearGradient>
        <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a6966" />
          <stop offset="1" stopColor="#252423" />
        </linearGradient>
      </defs>
      <rect width="300" height="118" fill={`url(#${id}sky)`} />
      <rect y="118" width="300" height="82" fill={`url(#${id}sea)`} />
      <circle cx="228" cy="70" r="11" fill="#f6f4ef" />
      <rect x="221" y="120" width="14" height="70" fill="#f1efe9" opacity="0.28" />
      <rect x="20" y="122" width="150" height="4" fill="#1d1c1b" />
      <rect x="28" y="126" width="3" height="40" fill="#1d1c1b" />
      <rect x="64" y="126" width="3" height="30" fill="#1d1c1b" />
      <rect x="98" y="126" width="2.5" height="22" fill="#1d1c1b" />
      <rect x="128" y="126" width="2" height="15" fill="#1d1c1b" />
      <rect x="156" y="126" width="2" height="10" fill="#1d1c1b" />
      <path d="M120 52 q 6 -6 12 0 q 6 -6 12 0" stroke="#2a2928" strokeWidth="1.6" fill="none" />
    </svg>
  );
};

const SceneDarkroom = () => {
  const id = useSceneId();
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" style={sceneSvg}>
      <defs>
        <radialGradient id={`${id}safe`} cx="0.8" cy="0.18" r="0.9">
          <stop offset="0" stopColor="#7a140c" />
          <stop offset="0.5" stopColor="#2f0805" />
          <stop offset="1" stopColor="#100303" />
        </radialGradient>
        <radialGradient id={`${id}bulb`}>
          <stop offset="0" stopColor="#ff6a45" />
          <stop offset="0.3" stopColor="#ff2a12" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ff2a12" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="300" height="200" fill={`url(#${id}safe)`} />
      <circle cx="240" cy="36" r="60" fill={`url(#${id}bulb)`} />
      <circle cx="240" cy="36" r="7" fill="#ffb199" />
      <line x1="0" y1="22" x2="200" y2="22" stroke="#3d0b07" strokeWidth="1.5" />
      <rect x="30" y="20" width="12" height="96" fill="#190504" />
      <rect x="32" y="30" width="8" height="12" fill="#5a120b" />
      <rect x="32" y="48" width="8" height="12" fill="#4a0f09" />
      <rect x="32" y="66" width="8" height="12" fill="#5a120b" />
      <rect x="32" y="84" width="8" height="12" fill="#3f0c07" />
      <rect x="62" y="20" width="12" height="80" fill="#190504" />
      <rect x="64" y="30" width="8" height="12" fill="#4a0f09" />
      <rect x="64" y="48" width="8" height="12" fill="#5a120b" />
      <rect x="64" y="66" width="8" height="12" fill="#3f0c07" />
      <rect x="94" y="20" width="12" height="104" fill="#190504" />
      <rect x="96" y="32" width="8" height="12" fill="#5a120b" />
      <rect x="96" y="52" width="8" height="12" fill="#3f0c07" />
      <rect x="96" y="72" width="8" height="12" fill="#5a120b" />
      <path
        d="M118 168 L 274 168 L 262 188 L 130 188Z"
        fill="#240605"
        stroke="#6b130c"
        strokeWidth="1.2"
      />
      <path
        d="M40 172 L 120 172 L 112 188 L 48 188Z"
        fill="#240605"
        stroke="#6b130c"
        strokeWidth="1.2"
      />
      <rect x="150" y="160" width="70" height="10" fill="#d9c9be" opacity="0.18" />
      <rect x="0" y="188" width="300" height="12" fill="#0c0202" />
    </svg>
  );
};

const SceneWindow = () => {
  const id = useSceneId();
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" style={sceneSvg}>
      <defs>
        <linearGradient id={`${id}wall`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#caa775" />
          <stop offset="1" stopColor="#7e5a37" />
        </linearGradient>
      </defs>
      <rect width="300" height="200" fill={`url(#${id}wall)`} />
      <rect x="172" y="26" width="86" height="104" fill="#fff4d8" />
      <rect x="212" y="26" width="5" height="104" fill="#5b3f25" />
      <rect x="172" y="74" width="86" height="5" fill="#5b3f25" />
      <rect x="166" y="22" width="98" height="112" fill="none" stroke="#5b3f25" strokeWidth="6" />
      <path d="M172 130 L 258 130 L 170 200 L 40 200Z" fill="#fff2cf" opacity="0.3" />
      <rect x="0" y="160" width="300" height="40" fill="#5b3c22" opacity="0.55" />
      <path
        d="M66 112 L 66 176 M 104 112 L 104 176 M 62 140 L 108 140"
        stroke="#2c1c10"
        strokeWidth="5"
      />
      <rect x="62" y="104" width="46" height="10" fill="#2c1c10" />
      <path d="M128 172 q -8 -40 14 -58 q 2 30 -6 58Z" fill="#3c4a2a" />
      <path d="M136 172 q 10 -34 34 -40 q -10 26 -26 40Z" fill="#4a5a33" />
      <rect x="126" y="168" width="22" height="20" fill="#7a3f2a" />
    </svg>
  );
};

const Still = ({
  w,
  h,
  grade,
  tint,
  children,
}: {
  w: number;
  h: number;
  grade?: string;
  tint?: string;
  children: ReactNode;
}) => (
  <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', flexShrink: 0 }}>
    <div style={{ position: 'absolute', inset: 0, filter: grade }}>{children}</div>
    {tint ? (
      <div style={{ position: 'absolute', inset: 0, background: tint, mixBlendMode: 'screen' }} />
    ) : null}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: GRAIN,
        backgroundSize: '200px',
        mixBlendMode: 'overlay',
        opacity: 0.42,
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 52%, rgba(12,7,4,0.5) 100%)',
      }}
    />
  </div>
);

const VerticalStrip = ({ children, edge }: { children: ReactNode; edge: string }) => (
  <div
    style={{
      position: 'relative',
      background: filmBase,
      padding: '34px 72px',
      display: 'flex',
      flexDirection: 'column',
      gap: 36,
      boxShadow: '0 30px 60px -30px rgba(30, 18, 10, 0.55)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 22,
        top: 0,
        bottom: 0,
        width: 18,
        backgroundImage: HOLES_Y,
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: 22,
        top: 0,
        bottom: 0,
        width: 18,
        backgroundImage: HOLES_Y,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 46,
        top: 34,
        bottom: 34,
        writingMode: 'vertical-rl',
        fontFamily: sans,
        fontSize: 14,
        letterSpacing: '0.3em',
        color: edgeAmber,
        whiteSpace: 'nowrap',
      }}
    >
      {edge}
    </div>
    {children}
  </div>
);

const HorizontalStrip = ({
  children,
  edge,
  style,
}: {
  children: ReactNode;
  edge: string;
  style?: CSSProperties;
}) => (
  <div
    style={{
      position: 'absolute',
      background: filmBase,
      padding: '48px 0',
      display: 'flex',
      gap: 26,
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 8,
        height: 18,
        backgroundImage: HOLES_X,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 8,
        height: 18,
        backgroundImage: HOLES_X,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 40,
        bottom: 26,
        fontFamily: sans,
        fontSize: 13,
        letterSpacing: '0.34em',
        color: edgeAmber,
        whiteSpace: 'nowrap',
      }}
    >
      {edge}
    </div>
    {children}
  </div>
);

const Cover: Page = () => (
  <div style={fill}>
    <Paper />
    <div
      style={{
        position: 'absolute',
        left: 116,
        top: 62,
        fontFamily: serif,
        fontSize: 96,
        fontWeight: 500,
        letterSpacing: '0.3em',
        lineHeight: 1,
      }}
    >
      MERIDIAN
    </div>
    <div
      style={{
        position: 'absolute',
        right: 120,
        top: 74,
        textAlign: 'right',
        color: muted,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span style={caps}>Autumn 2026 · Nº 41</span>
      <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 28 }}>
        The Culture Issue
      </span>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 196,
        height: 7,
        borderTop: '3px solid var(--osd-text)',
        borderBottom: '1px solid var(--osd-text)',
      }}
    />
    <Eyebrow style={{ position: 'absolute', left: 120, top: 268 }}>Feature · Photography</Eyebrow>
    <div style={{ position: 'absolute', left: 112, top: 318, lineHeight: 0.94 }}>
      <div style={{ fontSize: 150, fontWeight: 400, letterSpacing: '-0.01em' }}>The Slow</div>
      <div
        style={{
          fontSize: 'var(--osd-size-hero)',
          fontStyle: 'italic',
          fontWeight: 400,
          letterSpacing: '-0.025em',
          marginLeft: 96,
        }}
      >
        Return
      </div>
      <div style={{ fontSize: 150, fontWeight: 400, letterSpacing: '-0.01em' }}>
        of Film<span style={{ color: 'var(--osd-accent)' }}>.</span>
      </div>
    </div>
    <p
      style={{
        position: 'absolute',
        left: 120,
        top: 842,
        width: 880,
        margin: 0,
        fontSize: 34,
        fontStyle: 'italic',
        lineHeight: 1.38,
        color: '#3b342d',
      }}
    >
      Why a generation raised on the infinite camera roll is paying, gladly, for thirty-six frames
      at a time.
    </p>
    <div style={{ position: 'absolute', left: 1176, top: 262, transform: 'rotate(2.2deg)' }}>
      <VerticalStrip edge="◂ 14   ▸ 14A   MERIDIAN 400   ◂ 15   ▸ 15A">
        <Still w={446} h={298}>
          <SceneDunes />
        </Still>
        <Still w={446} h={298} grade="grayscale(1) contrast(1.15)">
          <ScenePortrait />
        </Still>
      </VerticalStrip>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTop: `1px solid ${hairline}`,
        color: muted,
      }}
    >
      <span style={caps}>Words & photographs by Ines Calloway</span>
      <span style={caps}>p. 84</span>
    </div>
  </div>
);
Cover.transition = breath;

const DropCapParagraph = () => (
  <p style={{ margin: 0, fontSize: 30, lineHeight: 1.55 }}>
    <span
      style={{
        float: 'left',
        fontSize: 176,
        lineHeight: 0.8,
        margin: '10px 18px 0 -4px',
        color: 'var(--osd-accent)',
        fontWeight: 500,
      }}
    >
      A
    </span>
    t nine on a Saturday the queue outside Halide Lab in East London is already forty people long.
    Almost nobody in it is old enough to remember when this was normal. They are here to drop off
    rolls — Portra, HP5, an expired Agfa found in a parent’s drawer — and then wait eleven days to
    see what they made.
  </p>
);

const Opening: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="I. The Return" />
    <div style={{ position: 'absolute', left: 120, top: 164 }}>
      <Still w={560} h={700} grade="sepia(0.18) saturate(0.9)">
        <SceneWindow />
      </Still>
      <div
        style={{
          marginTop: 22,
          width: 560,
          display: 'flex',
          gap: 18,
          fontFamily: sans,
          fontSize: 22,
          lineHeight: 1.45,
          color: muted,
        }}
      >
        <span style={{ color: 'var(--osd-accent)', fontWeight: 500 }}>01</span>
        <span>Morning light, Hackney. Portra 400, rated at 200, developed at Halide.</span>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 800, top: 164, width: 1000 }}>
      <Eyebrow>I. — The Return</Eyebrow>
      <h2
        style={{
          margin: '28px 0 0',
          fontSize: 100,
          fontWeight: 400,
          fontStyle: 'italic',
          lineHeight: 1.0,
          letterSpacing: '-0.02em',
        }}
      >
        Thirty-six at a time.
      </h2>
      <div
        style={{
          marginTop: 60,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 64,
          alignItems: 'start',
        }}
      >
        <DropCapParagraph />
        <div style={{ borderLeft: `1px solid ${hairline}`, paddingLeft: 40 }}>
          <p style={{ margin: 0, fontSize: 30, lineHeight: 1.55 }}>
            In an age of the bottomless phone gallery, the appeal is precisely the limit. No
            preview. No undo. No second take that costs nothing.
          </p>
          <p
            style={{
              margin: '28px 0 0',
              fontSize: 30,
              lineHeight: 1.45,
              fontStyle: 'italic',
              color: 'var(--osd-accent)',
            }}
          >
            “It’s the only thing I own that makes me wait.”
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SALES = [140, 98, 64, 45, 36, 31, 33, 38, 43, 49, 55, 62, 69, 74, 81, 88];
const chartX = (i: number) => 60 + i * (940 / 15);
const chartY = (v: number) => 500 - v * 3.2;
const salesPath = (() => {
  const pts = SALES.map((v, i) => [chartX(i), chartY(v)] as const);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
})();

const ChartNote = ({
  x,
  y,
  year,
  text,
  anchor = 'start',
}: {
  x: number;
  y: number;
  year: string;
  text: string;
  anchor?: 'start' | 'end';
}) => (
  <g>
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{ fontFamily: sans, fontSize: 18, letterSpacing: '0.2em', fill: '#7b1e22' }}
    >
      {year}
    </text>
    <text
      x={x}
      y={y + 30}
      textAnchor={anchor}
      style={{ fontFamily: serif, fontSize: 24, fontStyle: 'italic', fill: '#15120f' }}
    >
      {text}
    </text>
  </g>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div style={{ borderTop: '1px solid var(--osd-text)', paddingTop: 18 }}>
    <div
      style={{
        fontSize: 84,
        fontStyle: 'italic',
        lineHeight: 1,
        color: 'var(--osd-accent)',
        letterSpacing: '-0.01em',
      }}
    >
      {value}
    </div>
    <div style={{ marginTop: 12, fontSize: 26, lineHeight: 1.4, color: '#3b342d' }}>{label}</div>
  </div>
);

const Numbers: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="I. The Return — by the numbers" />
    <Eyebrow style={{ position: 'absolute', left: 120, top: 150 }}>The Market</Eyebrow>
    <h2
      style={{
        position: 'absolute',
        left: 116,
        top: 194,
        margin: 0,
        fontSize: 92,
        fontWeight: 400,
        fontStyle: 'italic',
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
      }}
    >
      The curve that bent back.
    </h2>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 314,
        fontFamily: sans,
        fontSize: 24,
        color: muted,
      }}
    >
      Estimated worldwide sales of 35mm and 120 roll film, millions of rolls, 2010–2025
    </div>
    <svg
      width={1040}
      height={590}
      viewBox="0 0 1040 590"
      style={{ position: 'absolute', left: 100, top: 360, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="fpe-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7b1e22" stopOpacity="0.16" />
          <stop offset="1" stopColor="#7b1e22" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="60" y1="20" x2="1000" y2="20" stroke={hairline} strokeDasharray="2 6" />
      <line x1="60" y1="180" x2="1000" y2="180" stroke={hairline} strokeDasharray="2 6" />
      <line x1="60" y1="340" x2="1000" y2="340" stroke={hairline} strokeDasharray="2 6" />
      <line x1="60" y1="500" x2="1000" y2="500" stroke="#15120f" strokeWidth="1.5" />
      <text x="40" y="26" textAnchor="end" style={{ fontFamily: sans, fontSize: 20, fill: muted }}>
        150
      </text>
      <text x="40" y="186" textAnchor="end" style={{ fontFamily: sans, fontSize: 20, fill: muted }}>
        100
      </text>
      <text x="40" y="346" textAnchor="end" style={{ fontFamily: sans, fontSize: 20, fill: muted }}>
        50
      </text>
      <text x="40" y="506" textAnchor="end" style={{ fontFamily: sans, fontSize: 20, fill: muted }}>
        0
      </text>
      <text
        x="60"
        y="540"
        textAnchor="middle"
        style={{ fontFamily: sans, fontSize: 20, fill: muted }}
      >
        2010
      </text>
      <text
        x="373.3"
        y="540"
        textAnchor="middle"
        style={{ fontFamily: sans, fontSize: 20, fill: muted }}
      >
        2015
      </text>
      <text
        x="686.7"
        y="540"
        textAnchor="middle"
        style={{ fontFamily: sans, fontSize: 20, fill: muted }}
      >
        2020
      </text>
      <text
        x="1000"
        y="540"
        textAnchor="middle"
        style={{ fontFamily: sans, fontSize: 20, fill: muted }}
      >
        2025
      </text>
      <path d={`${salesPath} L 1000 500 L 60 500 Z`} fill="url(#fpe-area)" />
      <path d={salesPath} fill="none" stroke="#7b1e22" strokeWidth="4" strokeLinecap="round" />
      <line x1="185.3" y1="295" x2="185.3" y2="196" stroke="#15120f" strokeWidth="1" />
      <circle cx="185.3" cy="295.2" r="7" fill="#f2ede3" stroke="#7b1e22" strokeWidth="3" />
      <ChartNote x={200} y={160} year="2012" text="Kodak files for bankruptcy" />
      <line x1="373.3" y1="401" x2="373.3" y2="448" stroke="#15120f" strokeWidth="1" />
      <circle cx="373.3" cy="400.8" r="9" fill="#7b1e22" />
      <ChartNote x={392} y={448} year="2015" text="The low: 31 million" />
      <line x1="498.7" y1="378" x2="498.7" y2="232" stroke="#15120f" strokeWidth="1" />
      <circle cx="498.7" cy="378.4" r="7" fill="#f2ede3" stroke="#7b1e22" strokeWidth="3" />
      <ChartNote x={514} y={226} year="2017" text="Ektachrome returns" />
      <circle cx="1000" cy="218.4" r="11" fill="#7b1e22" />
      <ChartNote x={984} y={128} year="2025" text="88 million and rising" anchor="end" />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 1270,
        top: 352,
        width: 530,
        display: 'flex',
        flexDirection: 'column',
        gap: 34,
      }}
    >
      <Stat value="2.8×" label="growth in roll sales since the 2015 low" />
      <Stat value="61%" label="of new film buyers are under thirty-five" />
      <Stat value="312" label="new film labs opened in Europe since 2019" />
    </div>
  </div>
);

const SectionStocks: Page = () => (
  <div style={fill}>
    <Paper />
    <div
      style={{
        position: 'absolute',
        left: 108,
        top: 92,
        fontSize: 330,
        fontStyle: 'italic',
        lineHeight: 1,
        color: 'var(--osd-accent)',
        letterSpacing: '-0.02em',
      }}
    >
      II.
    </div>
    <div style={{ position: 'absolute', left: 620, top: 196, width: 1180 }}>
      <Eyebrow>Chapter Two</Eyebrow>
      <div
        style={{
          marginTop: 22,
          fontSize: 160,
          lineHeight: 0.98,
          fontWeight: 400,
          letterSpacing: '-0.02em',
        }}
      >
        The Stocks
      </div>
      <div
        style={{
          marginTop: 30,
          fontSize: 38,
          fontStyle: 'italic',
          color: '#3b342d',
          lineHeight: 1.35,
        }}
      >
        Grain, colour, and the chemistry of character.
      </div>
    </div>
    <HorizontalStrip
      edge="◂ 21   ▸ 21A   MERIDIAN 400   ◂ 22   ▸ 22A   MERIDIAN 400   ◂ 23   ▸ 23A   MERIDIAN 400   ◂ 24   ▸ 24A   MERIDIAN 400   ◂ 25   ▸ 25A   MERIDIAN 400   ◂ 26"
      style={{ left: -60, right: -60, top: 680, paddingLeft: 40 }}
    >
      <Still w={300} h={200}>
        <SceneStreet />
      </Still>
      <Still w={300} h={200} grade="grayscale(1) contrast(1.2)">
        <SceneSea />
      </Still>
      <Still w={300} h={200} grade="saturate(0.9) sepia(0.15)">
        <SceneDunes />
      </Still>
      <Still w={300} h={200}>
        <SceneDarkroom />
      </Still>
      <Still w={300} h={200} grade="grayscale(1) contrast(1.1)">
        <ScenePortrait />
      </Still>
      <Still w={300} h={200}>
        <SceneWindow />
      </Still>
    </HorizontalStrip>
  </div>
);
SectionStocks.transition = breath;

const StockCard = ({
  name,
  spec,
  body,
  price,
  grade,
  tint,
}: {
  name: string;
  spec: string;
  body: string;
  price: string;
  grade?: string;
  tint?: string;
}) => (
  <div style={{ width: 372, display: 'flex', flexDirection: 'column' }}>
    <Still w={372} h={262} grade={grade} tint={tint}>
      <SceneDunes />
    </Still>
    <div
      style={{
        marginTop: 28,
        fontSize: 50,
        fontStyle: 'italic',
        lineHeight: 1.05,
        letterSpacing: '-0.01em',
      }}
    >
      {name}
    </div>
    <div style={{ ...caps, fontSize: 18, marginTop: 14, color: 'var(--osd-accent)' }}>{spec}</div>
    <div
      style={{ marginTop: 18, minHeight: 122, fontSize: 28, lineHeight: 1.45, color: '#3b342d' }}
    >
      {body}
    </div>
    <div
      style={{
        marginTop: 22,
        paddingTop: 12,
        borderTop: `1px solid ${hairline}`,
        fontFamily: sans,
        fontSize: 22,
        color: muted,
      }}
    >
      {price}
    </div>
  </div>
);

const Stocks: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="II. The Stocks" />
    <Eyebrow style={{ position: 'absolute', left: 120, top: 150 }}>
      Same sunset · four emulsions
    </Eyebrow>
    <h2
      style={{
        position: 'absolute',
        left: 116,
        top: 194,
        margin: 0,
        fontSize: 84,
        fontWeight: 400,
        fontStyle: 'italic',
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
      }}
    >
      Four ways to see the same evening.
    </h2>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 336,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <StockCard
        name="Portra 400"
        spec="ISO 400 · Colour · C-41"
        body="Forgiving, warm, kind to skin. The default of a generation."
        price="$18.95 · 36 exp."
        grade="saturate(0.82) sepia(0.14) brightness(1.05) contrast(0.95)"
      />
      <StockCard
        name="Ektar 100"
        spec="ISO 100 · Colour · C-41"
        body="Saturated and fine-grained. Skies go electric."
        price="$15.50 · 36 exp."
        grade="saturate(1.5) contrast(1.14)"
      />
      <StockCard
        name="HP5 Plus"
        spec="ISO 400 · Black & white"
        body="Gritty, elastic, cheap. The darkroom student’s bread."
        price="$9.80 · 36 exp."
        grade="grayscale(1) contrast(1.3) brightness(0.95)"
      />
      <StockCard
        name="CineStill 800T"
        spec="ISO 800 · Tungsten"
        body="Motion-picture stock. Red halos around every light."
        price="$21.00 · 36 exp."
        grade="hue-rotate(180deg) saturate(0.85) brightness(0.92) contrast(1.08)"
        tint="radial-gradient(circle at 68% 56%, rgba(255,70,40,0.95) 0, rgba(255,40,20,0.35) 14%, transparent 30%)"
      />
    </div>
  </div>
);

const VoiceQuote = ({
  quote,
  name,
  detail,
  grade,
  flip,
}: {
  quote: string;
  name: string;
  detail: string;
  grade: string;
  flip?: boolean;
}) => (
  <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
    <div
      style={{
        border: '8px solid #fbf8f2',
        boxShadow: '0 10px 24px -14px rgba(0,0,0,0.5)',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <Still w={124} h={156} grade={grade}>
        <ScenePortrait />
      </Still>
    </div>
    <div style={{ flex: 1 }}>
      <div
        style={{ fontSize: 42, fontStyle: 'italic', lineHeight: 1.28, letterSpacing: '-0.005em' }}
      >
        {quote}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 18, alignItems: 'baseline' }}>
        <span style={{ ...caps, fontSize: 20, color: 'var(--osd-accent)' }}>{name}</span>
        <span style={{ fontFamily: sans, fontSize: 22, color: muted }}>{detail}</span>
      </div>
    </div>
  </div>
);

const Voices: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="III. Voices" />
    <div style={{ position: 'absolute', left: 120, top: 164, width: 500 }}>
      <Eyebrow>III. — In the queue</Eyebrow>
      <h2
        style={{
          margin: '28px 0 0',
          fontSize: 108,
          fontWeight: 400,
          fontStyle: 'italic',
          lineHeight: 1.0,
          letterSpacing: '-0.02em',
        }}
      >
        Why they
        <br />
        came back.
      </h2>
      <p style={{ margin: '40px 0 0', fontSize: 30, lineHeight: 1.5, color: '#3b342d' }}>
        We asked forty people waiting outside Halide Lab one question. Three answers, lightly
        edited.
      </p>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 730,
        right: 120,
        top: 178,
        display: 'flex',
        flexDirection: 'column',
        gap: 58,
      }}
    >
      <Steps>
        <Step duration={520}>
          <VoiceQuote
            quote="“My phone holds eleven thousand photos. I can’t name one. I can tell you about every frame on my first roll.”"
            name="Priya N., 24"
            detail="Graphic designer, Leeds"
            grade="grayscale(1) contrast(1.1)"
          />
        </Step>
        <Step duration={520}>
          <VoiceQuote
            quote="“The wait is the point. Eleven days is long enough to forget — and then you get to remember.”"
            name="Tomás R., 29"
            detail="Nurse, Lisbon"
            grade="grayscale(1) brightness(1.1)"
            flip
          />
        </Step>
        <Step duration={520}>
          <VoiceQuote
            quote="“Film made me slow down enough to actually look at the person in front of me.”"
            name="Ada K., 19"
            detail="Student, Brooklyn"
            grade="grayscale(1) contrast(1.3) brightness(0.9)"
          />
        </Step>
      </Steps>
    </div>
  </div>
);

const RecipeRow = ({
  n,
  step,
  detail,
  time,
  temp,
}: {
  n: string;
  step: string;
  detail: string;
  time: string;
  temp: string;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '64px 1fr 180px 120px',
      alignItems: 'center',
      height: 94,
      borderBottom: `1px solid ${hairline}`,
    }}
  >
    <span style={{ fontSize: 30, fontStyle: 'italic', color: 'var(--osd-accent)' }}>{n}</span>
    <div>
      <div style={{ fontSize: 36, lineHeight: 1.1 }}>{step}</div>
      <div style={{ fontFamily: sans, fontSize: 20, color: muted, marginTop: 6 }}>{detail}</div>
    </div>
    <span
      style={{
        fontSize: 52,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums lining-nums',
        lineHeight: 1,
      }}
    >
      {time}
    </span>
    <span style={{ ...caps, fontSize: 20, textAlign: 'right', color: muted }}>{temp}</span>
  </div>
);

const Darkroom: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="III. The Darkroom" />
    <Eyebrow style={{ position: 'absolute', left: 120, top: 150 }}>The darkroom</Eyebrow>
    <h2
      style={{
        position: 'absolute',
        left: 116,
        top: 194,
        margin: 0,
        fontSize: 84,
        fontWeight: 400,
        fontStyle: 'italic',
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
      }}
    >
      Twenty degrees, eight minutes.
    </h2>
    <div style={{ position: 'absolute', left: 120, top: 330 }}>
      <Still w={800} h={540}>
        <SceneDarkroom />
      </Still>
      <div
        style={{
          marginTop: 20,
          width: 800,
          display: 'flex',
          gap: 18,
          fontFamily: sans,
          fontSize: 22,
          lineHeight: 1.45,
          color: muted,
        }}
      >
        <span style={{ color: 'var(--osd-accent)', fontWeight: 500 }}>02</span>
        <span>
          Under the safelight at Halide’s community darkroom — $15 an hour, booked out to March.
        </span>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 1010, right: 120, top: 330 }}>
      <div
        style={{
          ...caps,
          fontSize: 20,
          paddingBottom: 16,
          borderBottom: '2px solid var(--osd-text)',
        }}
      >
        The recipe · HP5 Plus in ID-11
      </div>
      <RecipeRow
        n="01"
        step="Develop"
        detail="Stock solution, agitate 10s / min"
        time="8:00"
        temp="20°C"
      />
      <RecipeRow
        n="02"
        step="Stop bath"
        detail="Halts development instantly"
        time="0:30"
        temp="20°C"
      />
      <RecipeRow n="03" step="Fix" detail="Clears unexposed silver" time="5:00" temp="20°C" />
      <RecipeRow n="04" step="Wash" detail="Running water, gentle flow" time="10:00" temp="20°C" />
      <RecipeRow
        n="05"
        step="Hang to dry"
        detail="Wetting agent, then dust-free"
        time="3 hr"
        temp="Air"
      />
      <div style={{ marginTop: 26, fontSize: 30, fontStyle: 'italic', color: '#3b342d' }}>
        Temperature is the whole game.
      </div>
    </div>
  </div>
);

const BigQuote: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="III. Voices" />
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 130,
        fontSize: 560,
        lineHeight: 1,
        color: 'var(--osd-accent)',
        opacity: 0.9,
        fontStyle: 'italic',
      }}
    >
      “
    </div>
    <div style={{ position: 'absolute', left: 300, right: 120, top: 420 }}>
      <Steps>
        <div
          style={{
            fontSize: 112,
            fontStyle: 'italic',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
          }}
        >
          We didn’t go back to film.
        </div>
        <Step duration={700}>
          <div
            style={{
              fontSize: 112,
              fontStyle: 'italic',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: 'var(--osd-accent)',
            }}
          >
            We went back to waiting.
          </div>
        </Step>
        <Step duration={500}>
          <div
            style={{
              marginTop: 72,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
            }}
          >
            <div style={{ width: 80, height: 2, background: 'var(--osd-text)' }} />
            <span style={{ fontSize: 36 }}>Marguerite Osei</span>
            <span style={{ ...caps, color: muted }}>Owner, Halide Lab · East London</span>
          </div>
        </Step>
      </Steps>
    </div>
  </div>
);

const SheetFrame = ({ children, grade }: { children: ReactNode; grade?: string }) => (
  <Still w={246} h={164} grade={grade ?? 'grayscale(1) contrast(1.2)'}>
    {children}
  </Still>
);

const SheetRow = ({ start, children }: { start: number; children: ReactNode }) => (
  <div style={{ position: 'relative', padding: '24px 0', background: '#0d0b0a' }}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 5,
        height: 14,
        backgroundImage: HOLES_X_DARK,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 3,
        height: 18,
        display: 'flex',
        fontFamily: sans,
        fontSize: 13,
        letterSpacing: '0.2em',
        color: '#8c8279',
      }}
    >
      <span style={{ width: 260, paddingLeft: 10 }}>▸ {start}</span>
      <span style={{ width: 260, paddingLeft: 10 }}>▸ {start + 1}</span>
      <span style={{ width: 260, paddingLeft: 10 }}>▸ {start + 2}</span>
      <span style={{ width: 260, paddingLeft: 10 }}>▸ {start + 3}</span>
    </div>
    <div style={{ display: 'flex', gap: 14 }}>{children}</div>
  </div>
);

const ContactSheet: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="IV. The Edit" />
    <div style={{ position: 'absolute', left: 120, top: 164, width: 460 }}>
      <Eyebrow>IV. — The Edit</Eyebrow>
      <h2
        style={{
          margin: '28px 0 0',
          fontSize: 100,
          fontWeight: 400,
          fontStyle: 'italic',
          lineHeight: 1.0,
          letterSpacing: '-0.02em',
        }}
      >
        Thirty-six
        <br />
        chances.
      </h2>
      <p style={{ margin: '40px 0 0', fontSize: 32, lineHeight: 1.5 }}>
        On a contact sheet every frame is equal — until a grease pencil decides otherwise.
      </p>
      <div
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: `1px solid ${hairline}`,
          fontFamily: sans,
          fontSize: 22,
          lineHeight: 1.5,
          color: muted,
        }}
      >
        Sheet 3 of 4, HP5 Plus pushed to 1600. Frame 7 went on to be printed at 16×20.
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 660,
        top: 160,
        width: 1140,
        height: 800,
        background: '#0d0b0a',
        boxShadow: '0 40px 80px -40px rgba(20,10,5,0.6)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 57,
          top: 52,
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <SheetRow start={1}>
          <SheetFrame>
            <ScenePortrait />
          </SheetFrame>
          <SheetFrame grade="grayscale(1) contrast(1.4) brightness(0.8)">
            <ScenePortrait />
          </SheetFrame>
          <SheetFrame>
            <SceneSea />
          </SheetFrame>
          <SheetFrame>
            <SceneStreet />
          </SheetFrame>
        </SheetRow>
        <SheetRow start={5}>
          <SheetFrame>
            <SceneWindow />
          </SheetFrame>
          <SheetFrame grade="grayscale(1) contrast(1.1) brightness(1.15)">
            <SceneWindow />
          </SheetFrame>
          <SheetFrame grade="grayscale(1) contrast(1.25)">
            <SceneDunes />
          </SheetFrame>
          <SheetFrame>
            <SceneDarkroom />
          </SheetFrame>
        </SheetRow>
        <SheetRow start={9}>
          <SheetFrame grade="grayscale(1) contrast(1.15) brightness(1.1)">
            <SceneSea />
          </SheetFrame>
          <SheetFrame>
            <SceneStreet />
          </SheetFrame>
          <SheetFrame grade="grayscale(1) contrast(1.2) brightness(0.9)">
            <ScenePortrait />
          </SheetFrame>
          <SheetFrame grade="grayscale(1) contrast(1.35)">
            <SceneDunes />
          </SheetFrame>
        </SheetRow>
      </div>
      <svg
        width={1140}
        height={800}
        viewBox="0 0 1140 800"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <path
          d="M 640 304 C 760 284, 856 316, 856 398 C 856 476, 764 516, 684 512 C 594 508, 540 458, 548 394 C 556 338, 612 306, 708 296"
          fill="none"
          stroke="#d4412f"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.92"
        />
        <path
          d="M 330 90 L 548 226 M 548 92 L 332 222"
          stroke="#d4412f"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <text
          x="874"
          y="452"
          style={{
            fontFamily: serif,
            fontStyle: 'italic',
            fontSize: 40,
            fill: '#d4412f',
          }}
        >
          this one.
        </text>
      </svg>
    </div>
  </div>
);

const Term = ({ value, label }: { value: string; label: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
    <span
      style={{
        fontSize: 110,
        lineHeight: 1,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'lining-nums',
      }}
    >
      {value}
    </span>
    <span style={{ ...caps, marginTop: 18, color: muted }}>{label}</span>
  </div>
);

const Operator = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      fontFamily: sans,
      fontSize: 72,
      fontWeight: 400,
      color: 'var(--osd-accent)',
      lineHeight: 1,
      paddingTop: 22,
    }}
  >
    {children}
  </span>
);

const Arithmetic: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="V. The Arithmetic" />
    <Eyebrow style={{ position: 'absolute', left: 120, top: 150 }}>V. — The Arithmetic</Eyebrow>
    <h2
      style={{
        position: 'absolute',
        left: 116,
        top: 194,
        margin: 0,
        fontSize: 92,
        fontWeight: 400,
        fontStyle: 'italic',
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
      }}
    >
      One dollar fourteen a frame.
    </h2>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 384,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <Term value="$18.95" label="A roll of 36" />
      <Operator>+</Operator>
      <Term value="$14.00" label="Develop" />
      <Operator>+</Operator>
      <Term value="$8.00" label="Scan" />
      <Operator>=</Operator>
      <Term value="$40.95" label="Per roll, all in" />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 600,
        height: 7,
        borderTop: '1px solid var(--osd-text)',
        borderBottom: `1px solid ${hairline}`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 640,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <div style={{ width: 860, paddingBottom: 22 }}>
        <div style={{ fontSize: 60, fontStyle: 'italic', lineHeight: 1.1 }}>÷ 36 exposures</div>
        <p style={{ margin: '28px 0 0', fontSize: 30, lineHeight: 1.5, color: '#3b342d' }}>
          The median shooter in our survey of 1,240 under-35s buys 2.4 rolls a month — about $98, or
          a streaming bundle and a half.
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 220,
            fontStyle: 'italic',
            lineHeight: 0.9,
            color: 'var(--osd-accent)',
            letterSpacing: '-0.03em',
          }}
        >
          $1.14
        </div>
        <div style={{ ...caps, marginTop: 18, color: muted }}>
          Per frame, before you press the shutter
        </div>
      </div>
    </div>
  </div>
);

const Credit = ({ credit, name }: { credit: string; name: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <span style={{ ...caps, fontSize: 18, color: muted }}>{credit}</span>
    <span style={{ fontSize: 30, fontStyle: 'italic' }}>{name}</span>
  </div>
);

const Closing: Page = () => (
  <div style={fill}>
    <Paper />
    <Folio section="Fin." />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 190,
        textAlign: 'center',
      }}
    >
      <Eyebrow>Last frame</Eyebrow>
      <div
        style={{
          marginTop: 34,
          fontSize: 'var(--osd-size-hero)',
          fontStyle: 'italic',
          lineHeight: 0.92,
          letterSpacing: '-0.035em',
        }}
      >
        Take your
        <br />
        time<span style={{ color: 'var(--osd-accent)' }}>.</span>
      </div>
      <div
        style={{
          margin: '64px auto 0',
          width: 120,
          height: 2,
          background: 'var(--osd-accent)',
        }}
      />
      <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 110 }}>
        <Credit credit="Words" name="Ines Calloway" />
        <Credit credit="Photographs" name="On HP5 Plus & Portra 400" />
        <Credit credit="Next issue" name="The Long Letter" />
      </div>
    </div>
  </div>
);
Closing.transition = breath;

export const meta: SlideMeta = {
  title: 'The Slow Return of Film',
  createdAt: '2026-10-07T15:41:36.200Z',
};

export const notes: (string | undefined)[] = [
  `Good evening. This is our autumn cover story, and I want to start with a confession: I didn't believe the trend was real.
Then I stood in a queue at nine in the morning behind forty people holding rolls of film.`,
  `Set the scene at Halide Lab. Read the line about the expired Agfa from a parent's drawer — that detail lands every time.
The key idea: the appeal is the limit. Thirty-six frames, no preview, no undo.`,
  `Here's the shape of it. Sales fell off a cliff — Kodak's bankruptcy in 2012 felt like the end.
The bottom came in 2015 at about 31 million rolls. Since then: nearly triple. And six in ten new buyers are under thirty-five.`,
  `Chapter two. Let's talk about what's actually in the camera.`,
  `Same evening, four emulsions. Portra is the forgiving one; Ektar turns skies electric; HP5 is the student's black-and-white workhorse; CineStill gives you those red halos around streetlights.
People don't just pick a camera now — they pick a look, and they talk about stocks the way they used to talk about filters.`,
  `I asked forty people in that queue one question: why film? Three answers.
Click through each — let the room sit with the first one before you move on.`,
  `The darkroom is the part nobody expected to come back. Community darkrooms in London are booked out for months.
Walk the recipe: develop, stop, fix, wash, dry. The point to land: temperature is the whole game.`,
  `This is the line I built the whole piece around. Say the first sentence, pause, then click.
"We went back to waiting." Then credit Marguerite.`,
  `A contact sheet is the honest record. Every frame equal until you circle one.
Point at the cross-out, then the circle — that's frame seven, the one that became a print.`,
  `Now the arithmetic, because people always ask. Roll, develop, scan: about forty-one dollars.
Divide by thirty-six: one fourteen a frame. And yet the median young shooter spends about ninety-eight dollars a month on it — they've decided it's worth it.`,
  `Close on the thesis: take your time. Thank the lab, thank the people in the queue, and plug the next issue.`,
];

export default [
  Cover,
  Opening,
  Numbers,
  SectionStocks,
  Stocks,
  Voices,
  Darkroom,
  BigQuote,
  ContactSheet,
  Arithmetic,
  Closing,
] satisfies Page[];

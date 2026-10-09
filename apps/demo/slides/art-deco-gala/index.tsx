import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useId } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#080a09', text: '#efe6cf', accent: '#d4af37' },
  fonts: {
    display: '"Limelight", "Didot", "Bodoni 72", serif',
    body: '"Josefin Sans", "Futura", "Century Gothic", sans-serif',
  },
  typeScale: { hero: 176, body: 32 },
  radius: 0,
};

const NUMERAL_FONT = '"Poiret One", "Josefin Sans", "Futura", sans-serif';
const EMERALD = '#0d3b2d';
const EMERALD_DEEP = '#061f18';
const IVORY_DIM = 'rgba(239, 230, 207, 0.72)';
const GOLD_SOLID = '#d4af37';
const GOLD_STOPS: [number, string][] = [
  [0, '#a07a2c'],
  [0.16, '#e9cf87'],
  [0.28, '#fff3c8'],
  [0.42, '#c89c3c'],
  [0.58, '#f4dd99'],
  [0.76, '#8f6a22'],
  [0.9, '#d9b866'],
  [1, '#a07a2c'],
];
const GOLD = `linear-gradient(100deg, ${GOLD_STOPS.map(([o, c]) => `${c} ${o * 100}%`).join(', ')})`;

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,300;0,400;0,600;1,300&family=Limelight&family=Poiret+One&display=swap';
const FONT_LINK_ID = 'osd-webfont-art-deco-gala';
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

const STYLE_ID = 'osd-styles-art-deco-gala';
const css = `
@keyframes deco-shimmer { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
@keyframes deco-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes deco-rise {
  from { opacity: 0; transform: translateY(14px); letter-spacing: 0.9em; }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes deco-glint {
  0%, 62% { transform: translateX(-140%) skewX(-20deg); }
  100% { transform: translateX(240%) skewX(-20deg); }
}
.deco-shimmer { animation: deco-shimmer 7s linear infinite; }
.deco-spin { animation: deco-spin 180s linear infinite; }
.deco-rise { animation: deco-rise 1.4s cubic-bezier(0.2, 0, 0, 1) both; }
.deco-glint { animation: deco-glint 5.5s cubic-bezier(0.5, 0, 0.3, 1) infinite; }
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

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

// A gilt flash: the incoming page blooms in slightly over-bright, like stage lights coming up.
export const transition: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'scale(0.985)', filter: 'brightness(1.6) saturate(1.2)' },
      { opacity: 1, transform: 'scale(1)', filter: 'brightness(1) saturate(1)' },
    ],
  },
};

const useUid = (prefix: string) => `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

const GoldStops = () => (
  <>
    {GOLD_STOPS.map(([o, c]) => (
      <stop key={o} offset={o} stopColor={c} />
    ))}
  </>
);

const GoldText = ({
  children,
  style,
  shimmer = true,
}: {
  children: ReactNode;
  style?: CSSProperties;
  shimmer?: boolean;
}) => {
  const live = useIsActivePage();
  return (
    <span
      className={live && shimmer ? 'deco-shimmer' : undefined}
      style={{
        backgroundImage: GOLD,
        backgroundSize: '200% 100%',
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
};

const ROMAN: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];
const roman = (n: number) => {
  let out = '';
  let rest = n;
  for (const [v, s] of ROMAN) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
};

const Lacquer = ({ tone = 'black' }: { tone?: 'black' | 'emerald' }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      background:
        tone === 'emerald'
          ? `radial-gradient(ellipse at 50% 42%, #145340 0%, ${EMERALD} 38%, ${EMERALD_DEEP} 100%)`
          : 'radial-gradient(ellipse at 50% 38%, #18231e 0%, #0b0f0d 46%, #050606 100%)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(212,175,55,0.035) 0 1px, transparent 1px 28px)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(115deg, transparent 30%, rgba(255,240,200,0.05) 45%, transparent 60%)',
      }}
    />
  </div>
);

const Sunburst = ({
  cx = 960,
  cy = 540,
  rays = 48,
  strength = 0.22,
}: {
  cx?: number;
  cy?: number;
  rays?: number;
  strength?: number;
}) => {
  const live = useIsActivePage();
  const fade = useUid('sunfade');
  let d = '';
  const R = 1500;
  for (let i = 0; i < rays; i += 2) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 1) / rays) * Math.PI * 2;
    d += `M${cx} ${cy}L${(cx + R * Math.cos(a0)).toFixed(1)} ${(cy + R * Math.sin(a0)).toFixed(1)}L${(cx + R * Math.cos(a1)).toFixed(1)} ${(cy + R * Math.sin(a1)).toFixed(1)}Z`;
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 1920 1080"
      width={1920}
      height={1080}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        <radialGradient id={fade} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={1100}>
          <stop offset="0" stopColor={GOLD_SOLID} stopOpacity={strength} />
          <stop offset="0.55" stopColor={GOLD_SOLID} stopOpacity={strength * 0.35} />
          <stop offset="1" stopColor={GOLD_SOLID} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g
        className={live ? 'deco-spin' : undefined}
        style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' }}
      >
        <path d={d} fill={`url(#${fade})`} />
      </g>
    </svg>
  );
};

const Corner = () => (
  <g>
    <path d="M74 250 V74 H250" />
    <path d="M86 170 H116 V116 H170 V86" />
    <path d="M60 128 A68 68 0 0 0 128 60" />
    <path d="M60 104 A44 44 0 0 0 104 60" />
    <path d="M60 60 L104 86 M60 60 L96 96 M60 60 L86 104" strokeWidth={1} />
    <path d="M140 140 l9 -9 l9 9 l-9 9 Z" fill={GOLD_SOLID} stroke="none" />
  </g>
);

const DecoFrame = () => {
  const g = useUid('framegold');
  return (
    <svg
      aria-hidden
      viewBox="0 0 1920 1080"
      width={1920}
      height={1080}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id={g} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={1920} y2={1080}>
          <GoldStops />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${g})`} strokeWidth={2}>
        <rect x={44} y={44} width={1832} height={992} />
        <rect x={56} y={56} width={1808} height={968} strokeWidth={1} />
        <Corner />
        <g transform="translate(1920 0) scale(-1 1)">
          <Corner />
        </g>
        <g transform="translate(0 1080) scale(1 -1)">
          <Corner />
        </g>
        <g transform="translate(1920 1080) scale(-1 -1)">
          <Corner />
        </g>
        <path d="M880 56 L900 76 H1020 L1040 56" />
        <path d="M948 56 l12 12 l12 -12" fill={GOLD_SOLID} />
        <path d="M56 500 l14 40 l-14 40 M1864 500 l-14 40 l14 40" />
      </g>
    </svg>
  );
};

const DecoFolio = ({ bg = '#070908' }: { bg?: string }) => {
  const { current, total } = useSlidePageNumber();
  const label: CSSProperties = {
    fontSize: 16,
    letterSpacing: '0.4em',
    color: GOLD_SOLID,
    background: bg,
    padding: '4px 6px 4px 12px',
  };
  return (
    <div
      style={{
        position: 'absolute',
        left: 760,
        width: 400,
        top: 1040 - 32,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      <span style={label}>FOLIO</span>
      <div
        style={{
          width: 56,
          height: 56,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 9,
            transform: 'rotate(45deg)',
            background: bg,
            border: `2px solid ${GOLD_SOLID}`,
            boxShadow: `0 0 0 4px ${bg}, 0 0 0 5px ${GOLD_SOLID}`,
          }}
        />
        <span
          style={{
            position: 'relative',
            fontSize: 17,
            fontWeight: 600,
            color: '#f4dd99',
            letterSpacing: '0.06em',
            paddingTop: 3,
          }}
        >
          {roman(current)}
        </span>
      </div>
      <span style={label}>OF {roman(total)}</span>
    </div>
  );
};

const Fan = ({ width, style }: { width: number; style?: CSSProperties }) => {
  const g = useUid('fangold');
  const wedges: string[] = [];
  const n = 12;
  for (let i = 0; i < n; i += 2) {
    const a0 = Math.PI + (i / n) * Math.PI;
    const a1 = Math.PI + ((i + 1) / n) * Math.PI;
    wedges.push(
      `M100 100L${(100 + 96 * Math.cos(a0)).toFixed(2)} ${(100 + 96 * Math.sin(a0)).toFixed(2)}A96 96 0 0 1 ${(100 + 96 * Math.cos(a1)).toFixed(2)} ${(100 + 96 * Math.sin(a1)).toFixed(2)}Z`,
    );
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 102"
      width={width}
      height={width * 0.51}
      style={{ display: 'block', margin: '0 auto', ...style }}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <GoldStops />
        </linearGradient>
      </defs>
      <path d={wedges.join('')} fill={`url(#${g})`} opacity={0.85} />
      <path d="M4 100 A96 96 0 0 1 196 100" fill="none" stroke={`url(#${g})`} strokeWidth={1.5} />
      <path d="M26 100 A74 74 0 0 1 174 100" fill="none" stroke="#070908" strokeWidth={2} />
      <path
        d="M58 100 A42 42 0 0 1 142 100 Z"
        fill="#070908"
        stroke={`url(#${g})`}
        strokeWidth={2}
      />
      <path d="M76 100 A24 24 0 0 1 124 100 Z" fill={`url(#${g})`} />
      <path d="M0 101 H200" stroke={`url(#${g})`} strokeWidth={2} />
    </svg>
  );
};

const Rule = ({ width = 520 }: { width?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, width, margin: '0 auto' }}>
    <div
      style={{
        flex: 1,
        height: 5,
        borderTop: `1px solid ${GOLD_SOLID}`,
        borderBottom: `1px solid ${GOLD_SOLID}`,
      }}
    />
    <div style={{ width: 12, height: 12, transform: 'rotate(45deg)', background: GOLD_SOLID }} />
    <div
      style={{ width: 8, height: 8, transform: 'rotate(45deg)', border: `1px solid ${GOLD_SOLID}` }}
    />
    <div style={{ width: 12, height: 12, transform: 'rotate(45deg)', background: GOLD_SOLID }} />
    <div
      style={{
        flex: 1,
        height: 5,
        borderTop: `1px solid ${GOLD_SOLID}`,
        borderBottom: `1px solid ${GOLD_SOLID}`,
      }}
    />
  </div>
);

const frame: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  textAlign: 'center',
};

const kicker: CSSProperties = {
  fontSize: 24,
  letterSpacing: '0.55em',
  textTransform: 'uppercase',
  color: GOLD_SOLID,
  fontWeight: 400,
  paddingLeft: '0.55em',
};

const PageTitle = ({ kick, children }: { kick: string; children: ReactNode }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 118 }}>
    <div style={kicker}>{kick}</div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 76,
        lineHeight: 1.1,
        marginTop: 14,
        letterSpacing: '0.04em',
      }}
    >
      <GoldText>{children}</GoldText>
    </div>
  </div>
);

const Cover: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={frame}>
      <Lacquer />
      <Sunburst cy={470} strength={0.2} />
      <DecoFrame />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 128 }}>
        <Fan width={250} />
        <div
          className={live ? 'deco-rise' : undefined}
          style={{ ...kicker, fontSize: 28, marginTop: 34 }}
        >
          The Meridian Orchestra
        </div>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            lineHeight: 1.04,
            marginTop: 26,
            letterSpacing: '0.03em',
            position: 'relative',
          }}
        >
          <GoldText>Centennial</GoldText>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 36,
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 220,
              height: 7,
              borderTop: `1px solid ${GOLD_SOLID}`,
              borderBottom: `1px solid ${GOLD_SOLID}`,
            }}
          />
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 84,
              letterSpacing: '0.5em',
              paddingLeft: '0.5em',
              lineHeight: 1,
            }}
          >
            <GoldText>GALA</GoldText>
          </div>
          <div
            style={{
              width: 220,
              height: 7,
              borderTop: `1px solid ${GOLD_SOLID}`,
              borderBottom: `1px solid ${GOLD_SOLID}`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: NUMERAL_FONT,
            fontSize: 64,
            letterSpacing: '0.2em',
            marginTop: 40,
            color: '#f2e3b3',
          }}
        >
          1926 <span style={{ color: GOLD_SOLID, fontSize: 40, verticalAlign: 'middle' }}>◆</span>{' '}
          2026
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 128,
          fontSize: 24,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: IVORY_DIM,
        }}
      >
        Saturday, the Fourteenth of November · The Aurelian Ballroom · Chicago
      </div>
    </div>
  );
};

const zigPath = (w: number, h: number, s: number, i: number) => {
  const pts: [number, number][] = [
    [i, 3 * s + i],
    [w * 0.22 + i, 3 * s + i],
    [w * 0.22 + i, 2 * s + i],
    [w * 0.31 + i, 2 * s + i],
    [w * 0.31 + i, s + i],
    [w * 0.4 + i, s + i],
    [w * 0.4 + i, i],
    [w * 0.6 - i, i],
    [w * 0.6 - i, s + i],
    [w * 0.69 - i, s + i],
    [w * 0.69 - i, 2 * s + i],
    [w * 0.78 - i, 2 * s + i],
    [w * 0.78 - i, 3 * s + i],
    [w - i, 3 * s + i],
    [w - i, h - i],
    [i, h - i],
  ];
  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
};

const ZigguratPanel = ({
  width,
  height,
  left,
  top,
  children,
}: {
  width: number;
  height: number;
  left: number;
  top: number;
  children: ReactNode;
}) => {
  const fill = useUid('zigfill');
  const g = useUid('ziggold');
  return (
    <div style={{ position: 'absolute', left, top, width, height }}>
      <svg
        aria-hidden
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#11493a" />
            <stop offset="1" stopColor={EMERALD_DEEP} />
          </linearGradient>
          <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
            <GoldStops />
          </linearGradient>
        </defs>
        <path
          d={zigPath(width, height, 26, 1)}
          fill={`url(#${fill})`}
          stroke={`url(#${g})`}
          strokeWidth={2}
        />
        <path
          d={zigPath(width, height, 26, 14)}
          fill="none"
          stroke={`url(#${g})`}
          strokeWidth={1}
        />
      </svg>
      <div style={{ position: 'relative', height: '100%' }}>{children}</div>
    </div>
  );
};

const Welcome: Page = () => (
  <div style={frame}>
    <Lacquer />
    <Sunburst cy={1080} strength={0.14} />
    <DecoFrame />
    <ZigguratPanel left={330} top={150} width={1260} height={790}>
      <div style={{ padding: '150px 150px 0' }}>
        <div style={kicker}>A Letter from the Podium</div>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 84,
            lineHeight: 1.1,
            marginTop: 22,
          }}
        >
          <GoldText>A Century in Swing</GoldText>
        </div>
        <div style={{ margin: '36px 0' }}>
          <Rule width={420} />
        </div>
        <p
          style={{
            fontSize: 'var(--osd-size-body)',
            lineHeight: 1.6,
            fontWeight: 300,
            margin: 0,
            color: 'var(--osd-text)',
          }}
        >
          One hundred years ago, eleven musicians played their first set in a smoky room above a
          tailor’s shop on State Street. Tonight, sixty-one of us take the stage to play it forward.
          Thank you for keeping this band in tune for a century.
        </p>
        <div
          style={{
            fontFamily: NUMERAL_FONT,
            fontSize: 44,
            marginTop: 44,
            color: '#f2e3b3',
          }}
        >
          Augustus Bell
        </div>
        <div style={{ ...kicker, fontSize: 20, marginTop: 8, color: IVORY_DIM }}>
          Music Director · Since 1998
        </div>
      </div>
    </ZigguratPanel>
    <DecoFolio />
  </div>
);

const Movement = ({
  year,
  title,
  children,
}: {
  year: string;
  title: string;
  children: ReactNode;
}) => (
  <div style={{ width: 248, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ fontFamily: NUMERAL_FONT, fontSize: 74, lineHeight: 1 }}>
      <GoldText>{year}</GoldText>
    </div>
    <div
      style={{
        width: 22,
        height: 22,
        transform: 'rotate(45deg)',
        background: '#070908',
        border: `2px solid ${GOLD_SOLID}`,
        boxShadow: `0 0 0 6px #0a0e0c`,
        margin: '42px 0 40px',
        position: 'relative',
        zIndex: 1,
      }}
    />
    <div
      style={{
        fontSize: 26,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: GOLD_SOLID,
        fontWeight: 600,
        paddingLeft: '0.3em',
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: 28,
        lineHeight: 1.4,
        fontWeight: 300,
        marginTop: 14,
        color: 'var(--osd-text)',
      }}
    >
      {children}
    </div>
  </div>
);

const History: Page = () => (
  <div style={frame}>
    <Lacquer />
    <DecoFrame />
    <PageTitle kick="1926 — 2026">A Century in Six Movements</PageTitle>
    <div
      style={{
        position: 'absolute',
        left: 200,
        right: 200,
        top: 535,
        height: 7,
        borderTop: `1px solid ${GOLD_SOLID}`,
        borderBottom: `1px solid ${GOLD_SOLID}`,
        opacity: 0.8,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 410,
        width: 1600,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Movement year="1926" title="Founded">
        Eleven players above a tailor’s shop on State Street.
      </Movement>
      <Movement year="1938" title="On Air">
        Coast-to-coast radio, every Friday at nine.
      </Movement>
      <Movement year="1957" title="Abroad">
        Forty cities in Europe, Paris to Stockholm.
      </Movement>
      <Movement year="1974" title="Gold">
        “Meridian Nights” sells a million copies.
      </Movement>
      <Movement year="1999" title="Home">
        The band moves into the restored Aurelian.
      </Movement>
      <Movement year="2026" title="Centennial">
        Sixty-one musicians, three generations.
      </Movement>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 150,
        fontSize: 28,
        fontStyle: 'italic',
        fontWeight: 300,
        color: IVORY_DIM,
      }}
    >
      Never once silent — not through the Depression, the war, or the pandemic winter of 2020.
    </div>
    <DecoFolio />
  </div>
);

const steppedPath = (w: number, h: number, st: number, i: number) => {
  const pts: [number, number][] = [
    [i, 2 * st + i],
    [st + i, 2 * st + i],
    [st + i, st + i],
    [2 * st + i, st + i],
    [2 * st + i, i],
    [w - 2 * st - i, i],
    [w - 2 * st - i, st + i],
    [w - st - i, st + i],
    [w - st - i, 2 * st + i],
    [w - i, 2 * st + i],
    [w - i, h - 2 * st - i],
    [w - st - i, h - 2 * st - i],
    [w - st - i, h - st - i],
    [w - 2 * st - i, h - st - i],
    [w - 2 * st - i, h - i],
    [2 * st + i, h - i],
    [2 * st + i, h - st - i],
    [st + i, h - st - i],
    [st + i, h - 2 * st - i],
    [i, h - 2 * st - i],
  ];
  return `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
};

const SteppedFrame = ({
  width,
  height,
  step = 18,
  fill,
}: {
  width: number;
  height: number;
  step?: number;
  fill: [string, string];
}) => {
  const g = useUid('stepgold');
  const f = useUid('stepfill');
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <GoldStops />
        </linearGradient>
        <linearGradient id={f} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fill[0]} />
          <stop offset="1" stopColor={fill[1]} />
        </linearGradient>
      </defs>
      <path
        d={steppedPath(width, height, step, 1)}
        fill={`url(#${f})`}
        stroke={`url(#${g})`}
        strokeWidth={2}
      />
      <path
        d={steppedPath(width, height, step, 12)}
        fill="none"
        stroke={`url(#${g})`}
        strokeWidth={1}
        opacity={0.7}
      />
    </svg>
  );
};

const StatPanel = ({ value, label, note }: { value: string; label: string; note: string }) => (
  <div
    style={{
      position: 'relative',
      width: 670,
      height: 270,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <SteppedFrame width={670} height={270} fill={['rgba(19,80,63,0.75)', 'rgba(6,31,24,0.55)']} />
    <div style={{ fontFamily: NUMERAL_FONT, fontSize: 130, lineHeight: 1, position: 'relative' }}>
      <GoldText>{value}</GoldText>
    </div>
    <div
      style={{
        fontSize: 28,
        letterSpacing: '0.4em',
        paddingLeft: '0.4em',
        textTransform: 'uppercase',
        marginTop: 16,
        color: 'var(--osd-text)',
        position: 'relative',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 300,
        color: IVORY_DIM,
        marginTop: 8,
        fontStyle: 'italic',
        position: 'relative',
      }}
    >
      {note}
    </div>
  </div>
);

const Numbers: Page = () => (
  <div style={frame}>
    <Lacquer />
    <Sunburst cy={590} rays={64} strength={0.12} />
    <DecoFrame />
    <PageTitle kick="By the Century">One Hundred Years, Counted</PageTitle>
    <div
      style={{
        position: 'absolute',
        left: 250,
        top: 320,
        width: 1420,
        display: 'grid',
        gridTemplateColumns: '670px 670px',
        columnGap: 80,
        rowGap: 56,
      }}
    >
      <StatPanel value="2,412" label="Concerts" note="from Chicago to Copenhagen" />
      <StatPanel value="61" label="Musicians" note="tonight, on one stage" />
      <StatPanel value="318" label="Recordings" note="on shellac, vinyl, tape and streams" />
      <StatPanel value="3" label="Generations" note="of the Bell family at the podium" />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 960 - 50,
        top: 320 + 270 + 28 - 26,
        width: 100,
        height: 52,
      }}
    >
      <Fan width={100} />
    </div>
    <DecoFolio />
  </div>
);

const SectionEvening: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={frame}>
      <Lacquer tone="emerald" />
      <Sunburst cy={540} rays={72} strength={0.28} />
      <DecoFrame />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 250,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div className={live ? 'deco-rise' : undefined} style={{ ...kicker, fontSize: 28 }}>
          Part the Second
        </div>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 190,
            lineHeight: 1.05,
            marginTop: 36,
            letterSpacing: '0.02em',
          }}
        >
          <GoldText>The Evening</GoldText>
        </div>
        <div style={{ marginTop: 40 }}>
          <Rule width={640} />
        </div>
        <div
          style={{
            fontSize: 30,
            letterSpacing: '0.34em',
            paddingLeft: '0.34em',
            textTransform: 'uppercase',
            marginTop: 44,
            color: '#f2e3b3',
          }}
        >
          Doors at Seven · Downbeat at Eight · Dancing till Two
        </div>
      </div>
      <DecoFolio bg="#082c22" />
    </div>
  );
};

const ProgrammeRow = ({
  time,
  title,
  detail,
  highlight = false,
}: {
  time: string;
  title: string;
  detail: string;
  highlight?: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, height: 70 }}>
    <div
      style={{
        width: 130,
        textAlign: 'right',
        fontFamily: NUMERAL_FONT,
        fontSize: 44,
        color: highlight ? '#fff3c8' : GOLD_SOLID,
      }}
    >
      {time}
    </div>
    <div
      style={{
        fontSize: 32,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: highlight ? '#fff3c8' : 'var(--osd-text)',
        fontWeight: highlight ? 600 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </div>
    <div
      style={{
        flex: 1,
        borderBottom: `2px dotted rgba(212,175,55,0.55)`,
        transform: 'translateY(-8px)',
      }}
    />
    <div
      style={{
        fontSize: 28,
        fontStyle: 'italic',
        fontWeight: 300,
        color: IVORY_DIM,
        whiteSpace: 'nowrap',
      }}
    >
      {detail}
    </div>
  </div>
);

const Programme: Page = () => (
  <div style={frame}>
    <Lacquer />
    <DecoFrame />
    <PageTitle kick="Saturday · 14 November 2026">The Programme</PageTitle>
    <div
      style={{
        position: 'absolute',
        left: 250,
        width: 1420,
        top: 330,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <ProgrammeRow time="7:00" title="Champagne Reception" detail="the Grand Foyer" />
      <ProgrammeRow
        time="8:00"
        title="Overture · Meridian Sunrise"
        detail="full orchestra, 1926 score"
      />
      <ProgrammeRow time="8:20" title="Act I · The Chicago Years" detail="with Clementine Ashby" />
      <ProgrammeRow time="9:15" title="Intermission & Oyster Bar" detail="the Mezzanine" />
      <ProgrammeRow time="9:45" title="Act II · Radio & the Road" detail="with Theo Okafor" />
      <ProgrammeRow
        time="10:40"
        title="Premiere · Second Century"
        detail="Silas Moreau, clarinet"
        highlight
      />
      <ProgrammeRow time="11:00" title="Dancing until Two" detail="the Meridian Dance Band" />
    </div>
    <DecoFolio />
  </div>
);

const Soloist = ({
  monogram,
  first,
  last,
  instrument,
  children,
}: {
  monogram: string;
  first: string;
  last: string;
  instrument: string;
  children: ReactNode;
}) => {
  const g = useUid('archgold');
  const fill = useUid('archfill');
  const clip = useUid('archclip');
  const rays: string[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    rays.push(
      `M170 300L${(170 + 300 * Math.cos(a)).toFixed(1)} ${(300 + 300 * Math.sin(a)).toFixed(1)}`,
    );
  }
  return (
    <div style={{ width: 340 }}>
      <div style={{ position: 'relative', width: 340, height: 450 }}>
        <svg
          aria-hidden
          viewBox="0 0 340 450"
          width={340}
          height={450}
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
              <GoldStops />
            </linearGradient>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#13503f" />
              <stop offset="1" stopColor={EMERALD_DEEP} />
            </linearGradient>
            <clipPath id={clip}>
              <path d="M16 434 V172 A154 154 0 0 1 324 172 V434 Z" />
            </clipPath>
          </defs>
          <path
            d="M2 448 V170 A168 168 0 0 1 338 170 V448 Z"
            fill={`url(#${fill})`}
            stroke={`url(#${g})`}
            strokeWidth={2}
          />
          <path
            d={rays.join('')}
            stroke={`url(#${g})`}
            strokeWidth={1}
            opacity={0.35}
            clipPath={`url(#${clip})`}
          />
          <path
            d="M16 434 V172 A154 154 0 0 1 324 172 V434 Z"
            fill="none"
            stroke={`url(#${g})`}
            strokeWidth={1}
          />
          <path d="M40 410 H300 M60 396 H280" stroke={`url(#${g})`} strokeWidth={1.5} />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 150,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 140,
            lineHeight: 1,
          }}
        >
          <GoldText>{monogram}</GoldText>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 330,
            fontSize: 22,
            letterSpacing: '0.5em',
            paddingLeft: '0.5em',
            textTransform: 'uppercase',
            color: '#f2e3b3',
          }}
        >
          {instrument}
        </div>
      </div>
      <div
        style={{
          fontSize: 22,
          letterSpacing: '0.45em',
          paddingLeft: '0.45em',
          textTransform: 'uppercase',
          marginTop: 30,
          color: GOLD_SOLID,
        }}
      >
        {first}
      </div>
      <div
        style={{
          fontSize: 34,
          letterSpacing: '0.14em',
          paddingLeft: '0.14em',
          textTransform: 'uppercase',
          marginTop: 6,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {last}
      </div>
      <div
        style={{ fontSize: 28, fontWeight: 300, color: IVORY_DIM, marginTop: 10, lineHeight: 1.35 }}
      >
        {children}
      </div>
    </div>
  );
};

const Soloists: Page = () => (
  <div style={frame}>
    <Lacquer />
    <DecoFrame />
    <PageTitle kick="Featured Soloists">Four Voices of the Meridian</PageTitle>
    <div
      style={{
        position: 'absolute',
        left: 160,
        top: 320,
        width: 1600,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Soloist monogram="CA" first="Clementine" last="Ashby" instrument="Voice">
        The band’s voice since 2011.
      </Soloist>
      <Soloist monogram="TO" first="Theo" last="Okafor" instrument="Trumpet">
        Principal trumpet, arranger.
      </Soloist>
      <Soloist monogram="RV" first="Ruth" last="Vandermeer" instrument="Piano">
        Her forty-seventh season.
      </Soloist>
      <Soloist monogram="SM" first="Silas" last="Moreau" instrument="Clarinet">
        Premieres “Second Century.”
      </Soloist>
    </div>
    <DecoFolio />
  </div>
);

const Building = () => {
  const g = useUid('bldgold');
  const fill = useUid('bldfill');
  let fins = '';
  for (let x = 128; x <= 392; x += 24) fins += `M${x} 352V560`;
  for (let x = 176; x <= 344; x += 24) fins += `M${x} 196V258`;
  let slits = '';
  for (let x = 120; x <= 400; x += 40) {
    if (x > 196 && x < 324) continue;
    slits += `M${x - 3} 380h6v150h-6Z`;
  }
  for (let x = 222; x <= 298; x += 19) slits += `M${x - 2} 122h4v40h-4Z`;
  let crown = '';
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    crown += `M260 180L${(260 + 170 * Math.cos(a)).toFixed(1)} ${(180 + 170 * Math.sin(a)).toFixed(1)}`;
  }
  let arch = '';
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    arch += `M260 452L${(260 + 46 * Math.cos(a)).toFixed(1)} ${(452 + 46 * Math.sin(a)).toFixed(1)}`;
  }
  return (
    <svg aria-hidden viewBox="0 0 520 640" width={520} height={640} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <GoldStops />
        </linearGradient>
        <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15563f" />
          <stop offset="1" stopColor={EMERALD_DEEP} />
        </linearGradient>
      </defs>
      <path d={crown} stroke={`url(#${g})`} strokeWidth={1} opacity={0.45} />
      <g stroke={`url(#${g})`} strokeWidth={2} fill={`url(#${fill})`}>
        <path d="M260 0 V70" strokeWidth={2} />
        <path d="M244 110 L260 52 L276 110 Z" />
        <rect x={208} y={110} width={104} height={70} />
        <rect x={160} y={180} width={200} height={90} />
        <rect x={104} y={270} width={312} height={290} />
        <rect x={72} y={330} width={32} height={230} />
        <rect x={416} y={330} width={32} height={230} />
        <rect x={40} y={560} width={440} height={30} />
        <rect x={10} y={590} width={500} height={34} />
        <path d={fins} fill="none" strokeWidth={1} opacity={0.5} />
        <path d="M214 560 V452 A46 46 0 0 1 306 452 V560 Z" fill="#070908" />
        <path d={arch} fill="none" strokeWidth={1} />
        <rect x={150} y={292} width={220} height={40} fill="#070908" />
      </g>
      <path d={slits} fill="#f4dd99" opacity={0.7} />
      <text
        x={260}
        y={320}
        textAnchor="middle"
        fontSize={22}
        letterSpacing="0.42em"
        fill="#f4dd99"
        style={{ fontFamily: 'var(--osd-font-body)', fontWeight: 600 }}
      >
        AURELIAN
      </text>
    </svg>
  );
};

const VenueStat = ({
  value,
  label,
  align,
}: {
  value: string;
  label: string;
  align: 'left' | 'right';
}) => (
  <div style={{ textAlign: align }}>
    <div style={{ fontFamily: NUMERAL_FONT, fontSize: 96, lineHeight: 1 }}>
      <GoldText>{value}</GoldText>
    </div>
    <div
      style={{
        fontSize: 26,
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        marginTop: 14,
        color: 'var(--osd-text)',
      }}
    >
      {label}
    </div>
  </div>
);

const Venue: Page = () => (
  <div style={frame}>
    <Lacquer />
    <Sunburst cy={980} rays={56} strength={0.14} />
    <DecoFrame />
    <PageTitle kick="2210 North Lakeview Avenue">The Aurelian Ballroom</PageTitle>
    <div style={{ position: 'absolute', left: 700, top: 300 }}>
      <Building />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 200,
        top: 380,
        width: 440,
        display: 'flex',
        flexDirection: 'column',
        gap: 90,
      }}
    >
      <VenueStat value="1929" label="Opened in October" align="right" />
      <VenueStat value="1,100" label="Guests, seated" align="right" />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1280,
        top: 380,
        width: 440,
        display: 'flex',
        flexDirection: 'column',
        gap: 90,
      }}
    >
      <VenueStat value="42 ft" label="Painted dome" align="left" />
      <VenueStat value="18,000" label="Leaves of gold" align="left" />
    </div>
    <DecoFolio />
  </div>
);

const Benefit = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', textAlign: 'left' }}>
    <div
      style={{
        flex: '0 0 auto',
        width: 9,
        height: 9,
        transform: 'rotate(45deg)',
        background: GOLD_SOLID,
        marginTop: 13,
      }}
    />
    <div style={{ fontSize: 28, lineHeight: 1.35, fontWeight: 300 }}>{children}</div>
  </div>
);

const Tier = ({
  name,
  price,
  featured = false,
  children,
}: {
  name: string;
  price: string;
  featured?: boolean;
  children: ReactNode;
}) => (
  <div
    style={{
      width: 362,
      height: featured ? 580 : 540,
      marginTop: featured ? 0 : 40,
      padding: '48px 34px',
      position: 'relative',
      border: `1px solid ${GOLD_SOLID}`,
      outline: featured ? `1px solid ${GOLD_SOLID}` : 'none',
      outlineOffset: 8,
      background: featured
        ? `linear-gradient(180deg, #13503f, ${EMERALD_DEEP})`
        : 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))',
      boxShadow: featured ? '0 30px 80px rgba(212,175,55,0.18)' : 'none',
    }}
  >
    {featured ? (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -20,
          transform: 'translateX(-50%)',
          background: GOLD,
          color: '#070908',
          fontSize: 18,
          letterSpacing: '0.35em',
          padding: '8px 18px 6px 24px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        BY INVITATION
      </div>
    ) : null}
    <div
      style={{
        fontSize: 26,
        letterSpacing: '0.34em',
        paddingLeft: '0.34em',
        textTransform: 'uppercase',
        color: GOLD_SOLID,
        fontWeight: 600,
      }}
    >
      {name}
    </div>
    <div
      style={{
        fontFamily: NUMERAL_FONT,
        fontSize: 66,
        lineHeight: 1,
        margin: '26px 0 30px',
        whiteSpace: 'nowrap',
      }}
    >
      <GoldText>{price}</GoldText>
    </div>
    <div
      style={{
        height: 5,
        borderTop: `1px solid ${GOLD_SOLID}`,
        borderBottom: `1px solid ${GOLD_SOLID}`,
        marginBottom: 30,
        opacity: 0.7,
      }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
  </div>
);

const Patrons: Page = () => (
  <div style={frame}>
    <Lacquer />
    <DecoFrame />
    <PageTitle kick="Circles of Patronage">Keep the Band Playing</PageTitle>
    <div
      style={{
        position: 'absolute',
        left: 180,
        top: 330,
        width: 1560,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <Tier name="Friend" price="$500">
        <Benefit>Two gala seats</Benefit>
        <Benefit>Your name in the programme</Benefit>
        <Benefit>Champagne reception</Benefit>
      </Tier>
      <Tier name="Benefactor" price="$2,500">
        <Benefit>Four seats, front tier</Benefit>
        <Benefit>Backstage tour</Benefit>
        <Benefit>Signed centennial LP</Benefit>
      </Tier>
      <Tier name="Guardian" price="$10,000">
        <Benefit>A table for eight</Benefit>
        <Benefit>Supper with the soloists</Benefit>
        <Benefit>A named chair for one season</Benefit>
      </Tier>
      <Tier name="Meridian" price="$25,000" featured>
        <Benefit>A private box</Benefit>
        <Benefit>Your name on the premiere score</Benefit>
        <Benefit>Sit in on a rehearsal</Benefit>
      </Tier>
    </div>
    <DecoFolio />
  </div>
);

const DressItem = ({ children, align }: { children: ReactNode; align: 'left' | 'right' }) => (
  <div
    style={{
      fontSize: 32,
      fontWeight: 300,
      lineHeight: 1.3,
      textAlign: align,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
    }}
  >
    {align === 'left' ? <span style={{ color: GOLD_SOLID, fontSize: 18 }}>◆</span> : null}
    {children}
    {align === 'right' ? <span style={{ color: GOLD_SOLID, fontSize: 18 }}>◆</span> : null}
  </div>
);

const DressCode: Page = () => (
  <div style={frame}>
    <Lacquer />
    <Sunburst cy={330} rays={40} strength={0.12} />
    <DecoFrame />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 120 }}>
      <Fan width={200} />
      <div style={{ ...kicker, marginTop: 26 }}>Attire</div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 140,
          lineHeight: 1.05,
          marginTop: 14,
        }}
      >
        <GoldText>Black Tie</GoldText>
      </div>
      <div style={{ fontFamily: NUMERAL_FONT, fontSize: 44, color: '#f2e3b3', marginTop: 8 }}>
        or the very finest of 1926
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 260,
        right: 260,
        top: 640,
        display: 'grid',
        gridTemplateColumns: '1fr 2px 1fr',
        columnGap: 80,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ ...kicker, textAlign: 'right', fontSize: 22, marginBottom: 6 }}>
          Encouraged
        </div>
        <DressItem align="right">Tuxedos, tails and white gloves</DressItem>
        <DressItem align="right">Beaded, fringed and feathered</DressItem>
        <DressItem align="right">Pearls, cloches and finger waves</DressItem>
      </div>
      <div
        style={{ background: `linear-gradient(180deg, transparent, ${GOLD_SOLID}, transparent)` }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{ ...kicker, textAlign: 'left', fontSize: 22, marginBottom: 6, paddingLeft: 0 }}
        >
          Kindly Avoid
        </div>
        <DressItem align="left">Denim of any decade</DressItem>
        <DressItem align="left">Sneakers on the dance floor</DressItem>
        <DressItem align="left">Flash photography during sets</DressItem>
      </div>
    </div>
    <DecoFolio />
  </div>
);

const Rsvp: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={frame}>
      <Lacquer tone="emerald" />
      <Sunburst cy={540} rays={80} strength={0.3} />
      <DecoFrame />
      <div
        style={{
          position: 'absolute',
          left: 460,
          top: 170,
          width: 1000,
          height: 740,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 128,
        }}
      >
        <SteppedFrame
          width={1000}
          height={740}
          step={22}
          fill={['rgba(5,8,7,0.92)', 'rgba(5,8,7,0.82)']}
        />
        <div style={{ position: 'absolute', inset: 50, overflow: 'hidden', pointerEvents: 'none' }}>
          {live ? (
            <div
              className="deco-glint"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: 260,
                background:
                  'linear-gradient(90deg, transparent, rgba(255,240,200,0.09), transparent)',
              }}
            />
          ) : null}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={kicker}>The Favour of a Reply</div>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 124,
              lineHeight: 1.05,
              marginTop: 26,
            }}
          >
            <GoldText>Kindly Reply</GoldText>
          </div>
          <div style={{ fontFamily: NUMERAL_FONT, fontSize: 46, color: '#f2e3b3', marginTop: 16 }}>
            by the First of October
          </div>
          <div style={{ margin: '44px 0 40px' }}>
            <Rule width={460} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.6 }}>
            Telephone the box office at{' '}
            <span style={{ color: '#f4dd99', fontWeight: 400 }}>(312) 555-0126</span>
            <br />
            or return the enclosed card by post
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.45em',
              paddingLeft: '0.45em',
              textTransform: 'uppercase',
              color: GOLD_SOLID,
              marginTop: 40,
            }}
          >
            Carriages at Two
          </div>
        </div>
      </div>
      <DecoFolio bg="#082c22" />
    </div>
  );
};

export const meta: SlideMeta = {
  title: 'The Meridian Orchestra — Centennial Gala',
  createdAt: '2026-10-07T15:51:56.734Z',
};

export default [
  Cover,
  Welcome,
  History,
  Numbers,
  SectionEvening,
  Programme,
  Soloists,
  Venue,
  Patrons,
  DressCode,
  Rsvp,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Good evening, and welcome to the Aurelian.
Let the room settle — let the sunburst turn for a beat.
"One hundred years ago this month, the Meridian Orchestra played its first set. Tonight we play the next one."`,
  `Read Augustus's letter in your own words — don't recite it.
The detail people love: the first rehearsal room was above a tailor's shop, and the tailor charged rent in free alterations.
Then thank the board and the volunteers by name.`,
  `Six movements, about twenty seconds each.
1926 founding; 1938 the Friday radio broadcasts; 1957 the European tour; 1974 Meridian Nights sells its millionth copy.
1999 the move into this ballroom. And 2026 — us, tonight.
Land the closing line: never once silent.`,
  `Pause on each number.
Two thousand four hundred and twelve concerts. Sixty-one musicians tonight.
Three hundred and eighteen recordings across every format ever invented.
And three generations of the Bell family — Augustus's grandfather founded the band.`,
  `Section break. Lower your voice a little.
"So that's the century. Now, the evening."
Doors at seven, downbeat at eight, and the dance floor stays open until two.`,
  `Walk the programme top to bottom, but don't read every line.
Flag the reception in the Grand Foyer, the oyster bar at intermission,
and the premiere at 10:40 — "Second Century," written for tonight.`,
  `Introduce each soloist with one fact.
Clementine has sung with us since 2011. Theo arranged most of Act II.
Ruth is in her forty-seventh season — please give her a hand.
Silas flew in from Paris to premiere "Second Century."`,
  `A word about the room you're sitting in.
Opened October 1929 — two weeks before the crash.
Eleven hundred seats, a forty-two-foot dome, and eighteen thousand leaves of gold that were re-laid by hand in 1999.`,
  `This is the ask, so slow down.
Four circles, from five hundred dollars to twenty-five thousand.
Mention that every Friend-level gift this year funds a student chair in the youth band.
Envelopes are on every table.`,
  `Keep this playful.
Black tie, or the very finest of 1926 — feathers, fringe and finger waves encouraged.
Just no denim, no sneakers on the dance floor, and no flash during sets.`,
  `Close warmly.
Please reply by the first of October — the box office number is on screen.
Carriages at two. Thank you, and here's to the second century.`,
];

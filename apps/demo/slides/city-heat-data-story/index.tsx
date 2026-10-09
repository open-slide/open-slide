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
  palette: { bg: '#fdf1e6', text: '#26221f', accent: '#cc3b22' },
  fonts: {
    display: '"Newsreader", Georgia, "Times New Roman", serif',
    body: '"Libre Franklin", "Helvetica Neue", Arial, sans-serif',
  },
  typeScale: { hero: 132, body: 32 },
  radius: 4,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap';
const FONT_LINK_ID = 'osd-webfont-city-heat-data-story';
const STYLE_ID = 'osd-styles-city-heat-data-story';
const css = `
@keyframes heat-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes heat-grow-x { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes heat-grow-y { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes heat-pop { from { opacity: 0; transform: scale(0.3) } to { opacity: 1; transform: scale(1) } }
@keyframes heat-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes heat-rise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
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
  if (style.textContent !== css) style.textContent = css;
}

const ink2 = '#6b6159';
const ink3 = '#8f847a';
const grid = '#ead9c8';
const axis = '#bfae9d';
const hot = '#cc3b22';
const cool = '#2a74b5';
const riverTint = '#b9cdd8';

const diverging: Record<number, string> = {
  [-3]: '#2c6aa0',
  [-2]: '#6c9dc6',
  [-1]: '#adc8dc',
  0: '#ddd3ca',
  1: '#f6c49d',
  2: '#ee9a66',
  3: '#de673a',
  4: '#c23d24',
  5: '#8c1d15',
};

const EASE = 'cubic-bezier(0.25, 0.1, 0.2, 1)';
const anim = (live: boolean, value: string) => (live ? value : undefined);

const fmt = (n: number, digits = 1) => {
  const v = n.toFixed(digits);
  return n > 0 ? `+${v}` : n < 0 ? `−${v.slice(1)}` : v;
};

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        bottom: 46,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 22,
        color: ink3,
        borderTop: `1px solid ${axis}`,
        paddingTop: 12,
      }}
    >
      <span>
        <b style={{ color: 'var(--osd-text)', fontWeight: 600 }}>The Hottest Block in Town</b> ·
        Port Halden urban heat survey
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const Kicker = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--osd-accent)',
    }}
  >
    {children}
  </div>
);

const Source = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: 22, color: ink3, lineHeight: 1.4 }}>{children}</div>
);

const Frame = ({
  kicker,
  title,
  dek,
  children,
  source,
}: {
  kicker: string;
  title: ReactNode;
  dek?: ReactNode;
  children: ReactNode;
  source?: ReactNode;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: 0,
        height: 10,
        background: 'var(--osd-text)',
      }}
    />
    <div style={{ position: 'absolute', left: 110, right: 110, top: 72 }}>
      <Kicker>{kicker}</Kicker>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 600,
          fontSize: 66,
          lineHeight: 1.06,
          letterSpacing: '-0.012em',
          margin: '12px 0 10px',
        }}
      >
        {title}
      </h2>
      {dek ? (
        <div style={{ fontSize: 30, color: ink2, lineHeight: 1.4, maxWidth: 1500 }}>{dek}</div>
      ) : null}
    </div>
    {children}
    {source ? (
      <div style={{ position: 'absolute', left: 110, right: 110, bottom: 104 }}>
        <Source>{source}</Source>
      </div>
    ) : null}
    <Footer />
  </div>
);

const TRANSECT = [
  -2.8, -2.6, -2.9, -2.2, -1.9, -2.3, -1.4, -1.1, -1.6, -0.6, -0.9, -0.2, 0.3, -0.1, 0.4, 0.9, 0.6,
  1.2, 0.8, 1.5, 1.9, 1.3, 2.2, 1.8, 2.6, 2.1, 2.9, 3.3, 2.7, 3.6, 3.1, 3.9, 3.4, 4.2, 3.8, 4.5,
  4.1, 4.6, 4.9, 4.3, 4.7,
];

const binColor = (v: number) => diverging[Math.max(-3, Math.min(5, Math.round(v)))];

const Stripe = ({ i, v, live }: { i: number; v: number; live: boolean }) => (
  <div
    style={{
      flex: 1,
      height: `${Math.round(30 + (v + 3) * 8.8)}%`,
      alignSelf: 'flex-end',
      background: binColor(v),
      transformOrigin: 'bottom',
      animation: anim(live, `heat-grow-y 0.9s ${EASE} ${0.25 + i * 0.022}s both`),
    }}
  />
);

const Cover: Page = () => {
  const live = useIsActivePage();
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--osd-bg)',
        color: 'var(--osd-text)',
        fontFamily: 'var(--osd-font-body)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 110,
          right: 110,
          top: 0,
          height: 10,
          background: 'var(--osd-text)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 110,
          right: 110,
          top: 64,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: `1px solid ${axis}`,
          paddingBottom: 16,
          fontSize: 22,
          color: ink2,
        }}
      >
        <Kicker>Climate · Data story</Kicker>
        <span>October 2026 · 7 min read</span>
      </div>
      <div style={{ position: 'absolute', left: 110, top: 148, width: 1700 }}>
        <h1
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 600,
            fontSize: 'var(--osd-size-hero)',
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          The hottest block in town
        </h1>
        <p
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 40,
            lineHeight: 1.35,
            color: ink2,
            margin: '30px 0 0',
            maxWidth: 1260,
          }}
        >
          On one August afternoon, two Port Halden neighbourhoods three miles apart were{' '}
          <span style={{ color: 'var(--osd-accent)', fontWeight: 600 }}>8°C apart</span>. The gap is
          mostly trees, tarmac — and money.
        </p>
        <div style={{ marginTop: 28, fontSize: 24, color: ink2 }}>
          By the <b style={{ color: 'var(--osd-text)' }}>Data Desk</b> · Graphics by Lena Ferro and
          Tomás Abiodun
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 110,
          right: 110,
          top: 580,
          height: 306,
          display: 'flex',
          gap: 3,
        }}
      >
        {TRANSECT.map((v, i) => (
          <Stripe key={i} i={i} v={v} live={live} />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 110,
          right: 110,
          top: 902,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          color: ink2,
        }}
      >
        <span>
          <b style={{ color: cool }}>◀</b> <b style={{ color: 'var(--osd-text)' }}>Linden Park</b>{' '}
          31.2°C
        </span>
        <span style={{ color: ink3 }}>
          Afternoon air temperature along a 3-mile walk, 14 Aug 2025, 15:00 · illustrative data
        </span>
        <span>
          <b style={{ color: 'var(--osd-text)' }}>Eastgate</b> 39.3°C{' '}
          <b style={{ color: hot }}>▶</b>
        </span>
      </div>
    </div>
  );
};

const StatTile = ({
  value,
  label,
  note,
  color,
}: {
  value: string;
  label: string;
  note: ReactNode;
  color: string;
}) => (
  <div style={{ borderTop: `3px solid ${color}`, paddingTop: 18 }}>
    <div style={{ fontSize: 24, color: ink2 }}>{label}</div>
    <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
      {value}
    </div>
    <div style={{ fontSize: 24, color: ink2, lineHeight: 1.35 }}>{note}</div>
  </div>
);

const DB = { w: 860, l: 20, r: 20 };
const dbx = (t: number) => DB.l + ((t - 30) / 10) * (DB.w - DB.l - DB.r);

const Dumbbell = ({ live }: { live: boolean }) => (
  <svg
    width={DB.w}
    height={120}
    viewBox={`0 0 ${DB.w} 120`}
    style={{ marginTop: 34, overflow: 'visible' }}
  >
    <line x1={DB.l} x2={DB.w - DB.r} y1={60} y2={60} stroke={axis} strokeWidth={2} />
    {[30, 32, 34, 36, 38, 40].map((t) => (
      <g key={t}>
        <line x1={dbx(t)} x2={dbx(t)} y1={54} y2={66} stroke={axis} strokeWidth={2} />
        <text x={dbx(t)} y={104} textAnchor="middle" fontSize={22} fill={ink3}>
          {t}°C
        </text>
      </g>
    ))}
    <line
      x1={dbx(31.2)}
      x2={dbx(39.3)}
      y1={60}
      y2={60}
      stroke="#26221f"
      strokeWidth={4}
      style={{
        transformBox: 'fill-box',
        transformOrigin: 'left center',
        animation: anim(live, `heat-grow-x 0.9s ${EASE} 0.5s both`),
      }}
    />
    <circle cx={dbx(31.2)} cy={60} r={12} fill={cool} stroke="#fdf1e6" strokeWidth={3} />
    <circle
      cx={dbx(39.3)}
      cy={60}
      r={12}
      fill={hot}
      stroke="#fdf1e6"
      strokeWidth={3}
      style={{ animation: anim(live, 'heat-fade 0.3s ease-out 1.3s both') }}
    />
    <text x={dbx(31.2)} y={30} textAnchor="middle" fontSize={24} fontWeight={700} fill="#26221f">
      Linden Park 31.2°
    </text>
    <text x={dbx(39.3)} y={30} textAnchor="middle" fontSize={24} fontWeight={700} fill="#26221f">
      Eastgate 39.3°
    </text>
  </svg>
);

const BigNumber: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame
      kicker="The gap"
      title="Same city, same hour, two climates"
      source="Source: Port Halden Urban Climate Survey, street-level sensors at 1.5 m (illustrative data)."
    >
      <div style={{ position: 'absolute', left: 110, top: 270, width: 900 }}>
        <div
          style={{
            fontSize: 260,
            fontWeight: 600,
            lineHeight: 0.9,
            letterSpacing: '-0.045em',
            color: 'var(--osd-accent)',
            animation: anim(live, `heat-rise 0.8s ${EASE} 0.15s both`),
          }}
        >
          8.1°C
        </div>
        <p style={{ fontSize: 34, lineHeight: 1.45, margin: '30px 0 0', maxWidth: 860 }}>
          The difference in air temperature between <b style={{ color: hot }}>Eastgate</b> and{' '}
          <b style={{ color: cool }}>Linden Park</b> at 3pm on 14 August 2025 — the hottest
          afternoon of the year.
        </p>
        <Dumbbell live={live} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1120,
          top: 300,
          width: 690,
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <StatTile
          value="41"
          label="Tropical nights in the city centre, 2025"
          note="Nights that never dropped below 20°C. The airport had 9."
          color={hot}
        />
        <StatTile
          value="+4.6°C"
          label="Poorest fifth of blocks vs the richest"
          note="Median afternoon temperature gap, by household income."
          color={hot}
        />
        <StatTile
          value="11% vs 46%"
          label="Tree canopy, Eastgate vs Linden Park"
          note="Share of ground shaded by trees from above."
          color={cool}
        />
      </div>
    </Frame>
  );
};

const YEARS = Array.from({ length: 51 }, (_, i) => 1975 + i);
const CITY = [
  3, 11, 6, 5, 7, 7, 8, 6, 8, 8, 9, 6, 10, 9, 10, 8, 11, 8, 9, 12, 18, 9, 12, 12, 15, 12, 14, 14,
  25, 14, 15, 22, 19, 19, 19, 19, 22, 21, 21, 21, 24, 21, 21, 31, 28, 27, 26, 35, 30, 31, 41,
];
const RURAL = [
  2, 2, 1, 1, 1, 1, 0, 1, 0, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 2, 5, 2, 2, 2, 1, 2, 4, 2, 7, 3, 3, 3, 4,
  4, 4, 5, 4, 4, 4, 5, 6, 6, 5, 8, 5, 5, 6, 10, 8, 8, 9,
];

const LC = { w: 1700, h: 540, l: 70, r: 230, t: 24, b: 54 };
const lx = (year: number) => LC.l + ((year - 1975) / 50) * (LC.w - LC.l - LC.r);
const ly = (v: number) => LC.t + (1 - v / 45) * (LC.h - LC.t - LC.b);
const linePath = (series: number[]) =>
  series
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${lx(YEARS[i]).toFixed(1)} ${ly(v).toFixed(1)}`)
    .join(' ');

const haloText: CSSProperties = {
  paintOrder: 'stroke',
  stroke: '#fdf1e6',
  strokeWidth: 8,
  strokeLinejoin: 'round',
};

const Annotation = ({ children }: { children: ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <svg width={LC.w} height={LC.h} viewBox={`0 0 ${LC.w} ${LC.h}`} style={{ overflow: 'visible' }}>
      {children}
    </svg>
  </div>
);

const NightsChart: Page = () => {
  const live = useIsActivePage();
  const gapPath = `${linePath(CITY)} ${RURAL.map((_, i) => `L${lx(YEARS[50 - i]).toFixed(1)} ${ly(RURAL[50 - i]).toFixed(1)}`).join(' ')} Z`;
  return (
    <Frame
      kicker="Chapter 1 · The nights"
      title="Summer nights in the city have stopped cooling down"
      dek="Tropical nights per summer — nights when the temperature never fell below 20°C"
      source="Source: Port Halden Met Office records, city-centre and airport stations, 1975–2025 (illustrative data)."
    >
      <div style={{ position: 'absolute', left: 110, top: 330, width: LC.w, height: LC.h }}>
        <svg
          width={LC.w}
          height={LC.h}
          viewBox={`0 0 ${LC.w} ${LC.h}`}
          style={{ overflow: 'visible' }}
        >
          {[0, 10, 20, 30, 40].map((v) => (
            <g key={v}>
              <line
                x1={LC.l}
                x2={LC.w - LC.r + 20}
                y1={ly(v)}
                y2={ly(v)}
                stroke={v === 0 ? axis : grid}
                strokeWidth={v === 0 ? 2 : 1.5}
              />
              <text
                x={LC.l - 16}
                y={ly(v) + 8}
                textAnchor="end"
                fontSize={24}
                fill={ink3}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {v}
              </text>
            </g>
          ))}
          {[1975, 1985, 1995, 2005, 2015, 2025].map((y) => (
            <g key={y}>
              <line
                x1={lx(y)}
                x2={lx(y)}
                y1={ly(0)}
                y2={ly(0) + 10}
                stroke={axis}
                strokeWidth={2}
              />
              <text x={lx(y)} y={ly(0) + 40} textAnchor="middle" fontSize={24} fill={ink3}>
                {y}
              </text>
            </g>
          ))}
          <path
            d={gapPath}
            fill={hot}
            fillOpacity={0.1}
            style={{ animation: anim(live, `heat-fade 0.8s ease-out 1.6s both`) }}
          />
          <path
            d={linePath(RURAL)}
            fill="none"
            stroke={cool}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            style={{ animation: anim(live, `heat-draw 1.6s ${EASE} 0.2s both`) }}
          />
          <path
            d={linePath(CITY)}
            fill="none"
            stroke={hot}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            style={{ animation: anim(live, `heat-draw 1.6s ${EASE} 0.2s both`) }}
          />
          <g style={{ animation: anim(live, 'heat-fade 0.4s ease-out 1.7s both') }}>
            <circle cx={lx(2025)} cy={ly(41)} r={8} fill={hot} stroke="#fdf1e6" strokeWidth={3} />
            <circle cx={lx(2025)} cy={ly(9)} r={8} fill={cool} stroke="#fdf1e6" strokeWidth={3} />
            <text x={lx(2025) + 34} y={ly(41) - 4} fontSize={26} fontWeight={700} fill="#26221f">
              City centre
            </text>
            <text x={lx(2025) + 34} y={ly(41) + 28} fontSize={26} fill={ink2}>
              41 nights
            </text>
            <text x={lx(2025) + 34} y={ly(9) - 4} fontSize={26} fontWeight={700} fill="#26221f">
              Airport
            </text>
            <text x={lx(2025) + 34} y={ly(9) + 28} fontSize={26} fill={ink2}>
              9 nights
            </text>
          </g>
        </svg>
        <Steps>
          <Step duration={260}>
            <Annotation>
              <line
                x1={lx(2003)}
                x2={lx(2003)}
                y1={ly(25) - 12}
                y2={ly(36)}
                stroke="#26221f"
                strokeWidth={1.5}
              />
              <circle
                cx={lx(2003)}
                cy={ly(25)}
                r={7}
                fill="none"
                stroke="#26221f"
                strokeWidth={2}
              />
              <text
                x={lx(2003) - 12}
                y={ly(36) - 34}
                textAnchor="end"
                fontSize={25}
                fontWeight={700}
                fill="#26221f"
                style={haloText}
              >
                2003
              </text>
              <text
                x={lx(2003) - 12}
                y={ly(36) - 4}
                textAnchor="end"
                fontSize={25}
                fill={ink2}
                style={haloText}
              >
                The European heatwave: 25 nights
              </text>
            </Annotation>
          </Step>
          <Step duration={260}>
            <Annotation>
              <line
                x1={lx(1985)}
                x2={lx(1985)}
                y1={ly(9)}
                y2={ly(2)}
                stroke="#26221f"
                strokeWidth={2}
              />
              <line
                x1={lx(1985) - 8}
                x2={lx(1985) + 8}
                y1={ly(9)}
                y2={ly(9)}
                stroke="#26221f"
                strokeWidth={2}
              />
              <line
                x1={lx(1985) - 8}
                x2={lx(1985) + 8}
                y1={ly(2)}
                y2={ly(2)}
                stroke="#26221f"
                strokeWidth={2}
              />
              <text
                x={lx(1985)}
                y={ly(9) - 60}
                textAnchor="middle"
                fontSize={25}
                fontWeight={700}
                fill="#26221f"
                style={haloText}
              >
                A gap of 7 nights in 1985…
              </text>
              <line
                x1={lx(1985)}
                x2={lx(1985)}
                y1={ly(9) - 52}
                y2={ly(9) - 10}
                stroke="#26221f"
                strokeWidth={1.5}
              />
              <line
                x1={lx(2023)}
                x2={lx(2023)}
                y1={ly(30)}
                y2={ly(8)}
                stroke="#26221f"
                strokeWidth={2}
              />
              <line
                x1={lx(2023) - 8}
                x2={lx(2023) + 8}
                y1={ly(30)}
                y2={ly(30)}
                stroke="#26221f"
                strokeWidth={2}
              />
              <line
                x1={lx(2023) - 8}
                x2={lx(2023) + 8}
                y1={ly(8)}
                y2={ly(8)}
                stroke="#26221f"
                strokeWidth={2}
              />
              <text
                x={lx(2023) - 20}
                y={ly(19) + 8}
                textAnchor="end"
                fontSize={25}
                fontWeight={700}
                fill="#26221f"
                style={haloText}
              >
                …32 by 2025
              </text>
            </Annotation>
          </Step>
          <Step duration={260}>
            <Annotation>
              <circle cx={lx(2025)} cy={ly(41)} r={20} fill="none" stroke={hot} strokeWidth={2.5} />
              <text
                x={lx(2025) - 34}
                y={ly(41) - 46}
                textAnchor="end"
                fontSize={25}
                fontWeight={700}
                fill="#26221f"
                style={haloText}
              >
                A record — and the city's heat now lasts all night
              </text>
              <path
                d={`M${lx(2025) - 30} ${ly(41) - 38} Q${lx(2025) - 16} ${ly(41) - 34} ${lx(2025) - 14} ${ly(41) - 20}`}
                fill="none"
                stroke="#26221f"
                strokeWidth={1.5}
              />
            </Annotation>
          </Step>
        </Steps>
      </div>
    </Frame>
  );
};

const COLS = 26;
const ROWS = 15;
const TILE = 34;
const GAP = 4;

const hash = (c: number, r: number) => {
  const s = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const gauss = (c: number, r: number, cx: number, cy: number, s: number) =>
  Math.exp(-((c - cx) ** 2 + (r - cy) ** 2) / (2 * s * s));
const inCity = (c: number, r: number) => {
  const e = ((c - 12.5) / 13.2) ** 2 + ((r - 7) / 7.8) ** 2;
  return e < 1 - (hash(c, r) - 0.5) * 0.16;
};
const isRiver = (c: number, r: number) => Math.abs(r - (2.2 + c * 0.44)) < 0.62;
const anomaly = (c: number, r: number) =>
  0.5 +
  4.9 * gauss(c, r, 20, 9.5, 3.4) +
  3.2 * gauss(c, r, 21.5, 3, 2.4) +
  2.0 * gauss(c, r, 12.5, 6.5, 2.4) -
  4.2 * gauss(c, r, 5, 10, 2.3) -
  1.1 * gauss(c, r, 9, 1.8, 2.2) +
  (hash(c, r) - 0.5) * 1.1;

const MapTile = ({ c, r, live }: { c: number; r: number; live: boolean }) => {
  if (isRiver(c, r)) return null;
  return (
    <rect
      x={c * (TILE + GAP)}
      y={r * (TILE + GAP)}
      width={TILE}
      height={TILE}
      rx={3}
      fill={binColor(anomaly(c, r))}
      style={{
        transformBox: 'fill-box',
        transformOrigin: 'center',
        animation: anim(live, `heat-pop 0.5s ${EASE} ${0.1 + (c + r) * 0.025}s both`),
      }}
    />
  );
};

const riverPath = (() => {
  const pts: string[] = [];
  for (let c = 0; c <= 25; c += 1) {
    const x = c * (TILE + GAP) + TILE / 2;
    const y = (2.2 + c * 0.44) * (TILE + GAP) + TILE / 2 + Math.sin(c * 0.9) * 5;
    pts.push(`${c === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

const MapLabel = ({
  c,
  r,
  name,
  dx,
  dy,
  anchor = 'start',
}: {
  c: number;
  r: number;
  name: string;
  dx: number;
  dy: number;
  anchor?: 'start' | 'end' | 'middle';
}) => {
  const x = c * (TILE + GAP) + TILE / 2;
  const y = r * (TILE + GAP) + TILE / 2;
  const v = anomaly(c, r);
  const tx = x + dx + (anchor === 'end' ? -8 : anchor === 'start' ? 8 : 0);
  const ty = dy < 0 ? y + dy - 40 : y + dy + 26;
  return (
    <g>
      <rect
        x={x - TILE / 2 - 2}
        y={y - TILE / 2 - 2}
        width={TILE + 4}
        height={TILE + 4}
        rx={4}
        fill="none"
        stroke="#26221f"
        strokeWidth={2.5}
      />
      <line
        x1={x + (dx === 0 ? 0 : Math.sign(dx) * (TILE / 2 + 2))}
        y1={y + (dx === 0 ? Math.sign(dy) * (TILE / 2 + 2) : 0)}
        x2={x + dx}
        y2={y + dy}
        stroke="#26221f"
        strokeWidth={1.5}
      />
      <text
        x={tx}
        y={ty}
        textAnchor={anchor}
        fontSize={25}
        fontWeight={700}
        fill="#26221f"
        style={haloText}
      >
        {name}
      </text>
      <text x={tx} y={ty + 30} textAnchor={anchor} fontSize={24} fill={ink2} style={haloText}>
        {fmt(v)}°C
      </text>
    </g>
  );
};

const LegendBin = ({ v, label }: { v: number; label?: string }) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 58 }}
  >
    <div style={{ width: 54, height: 22, background: diverging[v], borderRadius: 3 }} />
    <div style={{ fontSize: 22, color: ink2, height: 28, fontVariantNumeric: 'tabular-nums' }}>
      {label ?? ''}
    </div>
  </div>
);

const HeatMap: Page = () => {
  const live = useIsActivePage();
  const tiles: [number, number][] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (inCity(c, r)) tiles.push([c, r]);
    }
  }
  const W = COLS * (TILE + GAP);
  const H = ROWS * (TILE + GAP);
  return (
    <Frame
      kicker="Chapter 2 · The map"
      title="A city of hot and cool islands"
      source="Source: Port Halden Urban Climate Survey; land-surface model at 250 m, 14 Aug 2025, 15:00 (illustrative data). Each square ≈ 250 m."
    >
      <div style={{ position: 'absolute', left: 110, top: 270 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
          <path
            d={riverPath}
            fill="none"
            stroke={riverTint}
            strokeWidth={24}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {tiles.map(([c, r]) => (
            <MapTile key={`${c}-${r}`} c={c} r={r} live={live} />
          ))}
          <g style={{ animation: anim(live, 'heat-fade 0.5s ease-out 1.1s both') }}>
            <MapLabel c={21} r={10} name="Eastgate" dx={60} dy={150} />
            <MapLabel c={22} r={3} name="Old Docks" dx={-40} dy={-110} anchor="end" />
            <MapLabel c={5} r={9} name="Linden Park" dx={-70} dy={190} anchor="middle" />
            <text
              x={6 * (TILE + GAP)}
              y={4.6 * (TILE + GAP)}
              fontSize={22}
              fontStyle="italic"
              fill="#4f6b7a"
              transform={`rotate(23.7 ${6 * (TILE + GAP)} ${4.6 * (TILE + GAP)})`}
              style={haloText}
            >
              River Halde
            </text>
          </g>
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 1150, top: 285, width: 660 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Surface air temperature vs city average</div>
        <div style={{ display: 'flex', gap: 2, marginTop: 14 }}>
          <LegendBin v={-3} label="−3" />
          <LegendBin v={-2} />
          <LegendBin v={-1} />
          <LegendBin v={0} label="avg" />
          <LegendBin v={1} />
          <LegendBin v={2} />
          <LegendBin v={3} />
          <LegendBin v={4} />
          <LegendBin v={5} label="+5°C" />
        </div>
        <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 34 }}>
          <MapNote color={hot} title="Eastgate is the hot core">
            Warehouses, six-lane Ring Road, 11% tree cover. Roofs hit 61°C.
          </MapNote>
          <MapNote color={hot} title="The docks run a close second">
            Acres of dark asphalt and container yards with no shade at all.
          </MapNote>
          <MapNote color={cool} title="Linden Park cools its neighbours">
            The effect fades within about 400 m of the park's edge.
          </MapNote>
        </div>
      </div>
    </Frame>
  );
};

const MapNote = ({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: ReactNode;
}) => (
  <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: 22 }}>
    <div style={{ fontSize: 29, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
    <div style={{ fontSize: 28, color: ink2, lineHeight: 1.4, marginTop: 4 }}>{children}</div>
  </div>
);

const SC = { w: 1100, h: 560, l: 80, r: 30, t: 50, b: 70 };
const sx = (v: number) => SC.l + (v / 60) * (SC.w - SC.l - SC.r);
const sy = (v: number) => SC.t + (1 - (v - 28) / 14) * (SC.h - SC.t - SC.b);

const SCATTER: [number, number][] = Array.from({ length: 40 }, (_, i) => {
  const x = 4 + ((i * 37) % 50) + hash(i, 3) * 4;
  const y = 41.2 - 0.19 * x + (hash(i, 9) - 0.5) * 2.4;
  return [x, y];
});

const NAMED: { name: string; x: number; y: number; dx: number; dy: number; color: string }[] = [
  { name: 'Old Docks', x: 7, y: 39.8, dx: 12, dy: -24, color: hot },
  { name: 'Eastgate', x: 11, y: 39.3, dx: -14, dy: 38, color: hot },
  { name: 'Market Sq.', x: 18, y: 37.4, dx: -18, dy: 8, color: '#26221f' },
  { name: 'Riverside', x: 34, y: 34.2, dx: -18, dy: 28, color: '#26221f' },
  { name: 'Linden Park', x: 46, y: 31.2, dx: -18, dy: 8, color: cool },
];

const ScatterDot = ({
  x,
  y,
  i,
  live,
  fill,
}: {
  x: number;
  y: number;
  i: number;
  live: boolean;
  fill: string;
}) => (
  <circle
    cx={sx(x)}
    cy={sy(y)}
    r={9}
    fill={fill}
    stroke="#fdf1e6"
    strokeWidth={2.5}
    style={{
      transformBox: 'fill-box',
      transformOrigin: 'center',
      animation: anim(live, `heat-pop 0.45s ${EASE} ${0.15 + i * 0.03}s both`),
    }}
  />
);

const Scatter: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame
      kicker="Chapter 3 · The trees"
      title="Where the trees are, the heat isn't"
      source="Source: canopy from 2024 aerial LiDAR; temperatures from street sensors, 14 Aug 2025, 15:00 (illustrative data)."
    >
      <div style={{ position: 'absolute', left: 110, top: 280, width: SC.w, height: SC.h }}>
        <svg
          width={SC.w}
          height={SC.h}
          viewBox={`0 0 ${SC.w} ${SC.h}`}
          style={{ overflow: 'visible' }}
        >
          {[28, 30, 32, 34, 36, 38, 40, 42].map((v) => (
            <g key={v}>
              <line
                x1={SC.l}
                x2={SC.w - SC.r}
                y1={sy(v)}
                y2={sy(v)}
                stroke={grid}
                strokeWidth={1.5}
              />
              <text x={SC.l - 14} y={sy(v) + 8} textAnchor="end" fontSize={24} fill={ink3}>
                {v}°
              </text>
            </g>
          ))}
          {[0, 10, 20, 30, 40, 50, 60].map((v) => (
            <text key={v} x={sx(v)} y={sy(28) + 38} textAnchor="middle" fontSize={24} fill={ink3}>
              {v}%
            </text>
          ))}
          <line x1={SC.l} x2={SC.w - SC.r} y1={sy(28)} y2={sy(28)} stroke={axis} strokeWidth={2} />
          <text
            x={SC.w - SC.r}
            y={sy(28) + 70}
            textAnchor="end"
            fontSize={24}
            fontWeight={600}
            fill={ink2}
          >
            Tree canopy cover →
          </text>
          <text x={SC.l} y={SC.t - 28} fontSize={24} fontWeight={600} fill={ink2}>
            ↑ Afternoon temperature, °C
          </text>
          {SCATTER.map(([x, y], i) => (
            <ScatterDot key={i} x={x} y={y} i={i} live={live} fill="#c7b6a6" />
          ))}
          <line
            x1={sx(3)}
            y1={sy(41.2 - 0.19 * 3)}
            x2={sx(57)}
            y2={sy(41.2 - 0.19 * 57)}
            stroke="#26221f"
            strokeWidth={2.5}
            pathLength={1}
            strokeDasharray="1"
            style={{ animation: anim(live, `heat-draw 1s ${EASE} 1.3s both`) }}
          />
          {NAMED.map((p, i) => (
            <g key={p.name}>
              <ScatterDot x={p.x} y={p.y} i={i + 40} live={live} fill={p.color} />
              <text
                x={sx(p.x) + p.dx}
                y={sy(p.y) + p.dy}
                textAnchor={p.dx < 0 ? 'end' : 'start'}
                fontSize={24}
                fontWeight={700}
                fill="#26221f"
                style={{ ...haloText, animation: anim(live, 'heat-fade 0.4s ease-out 1.6s both') }}
              >
                {p.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ position: 'absolute', left: 1320, top: 300, width: 490 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: ink3,
          }}
        >
          The rule of thumb
        </div>
        <div
          style={{
            fontSize: 112,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: cool,
            marginTop: 12,
          }}
        >
          −1.9°C
        </div>
        <p style={{ fontSize: 32, lineHeight: 1.45, margin: '18px 0 0' }}>
          for every 10 percentage points of tree canopy, across 45 neighbourhoods.
        </p>
        <p style={{ fontSize: 28, lineHeight: 1.45, color: ink2, margin: '28px 0 0' }}>
          Shade matters most at street level: a mature plane tree can keep the pavement beneath it
          15°C cooler than open tarmac.
        </p>
      </div>
    </Frame>
  );
};

const hourly = (day: number, night: number) =>
  Array.from({ length: 25 }, (_, h) => {
    const k = Math.cos(((h - 15) / 24) * Math.PI * 2);
    return 27 + 6 * k + (day * (1 + k)) / 2 + (night * (1 - k)) / 2;
  });
const AVG = hourly(0, 0);

const PM = { w: 500, h: 210, t: 10, b: 36, l: 44, r: 10 };
const px = (h: number) => PM.l + (h / 24) * (PM.w - PM.l - PM.r);
const py = (v: number) => PM.t + (1 - (v - 18) / 22) * (PM.h - PM.t - PM.b);
const seriesPath = (s: number[]) =>
  s.map((v, h) => `${h === 0 ? 'M' : 'L'}${px(h).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');

const Panel = ({
  name,
  day,
  night,
  i,
  live,
}: {
  name: string;
  day: number;
  night: number;
  i: number;
  live: boolean;
}) => {
  const s = hourly(day, night);
  const color = night >= 0 ? hot : cool;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 24, color: ink2 }}>
          <b style={{ color: 'var(--osd-text)' }}>{fmt(night)}°C</b> at 3am
        </div>
      </div>
      <svg
        width={PM.w}
        height={PM.h}
        viewBox={`0 0 ${PM.w} ${PM.h}`}
        style={{ marginTop: 8, overflow: 'visible' }}
      >
        <rect x={px(0)} y={PM.t} width={px(6) - px(0)} height={PM.h - PM.t - PM.b} fill="#f3e2d3" />
        <rect
          x={px(21)}
          y={PM.t}
          width={px(24) - px(21)}
          height={PM.h - PM.t - PM.b}
          fill="#f3e2d3"
        />
        {[20, 30, 40].map((v) => (
          <g key={v}>
            <line
              x1={PM.l}
              x2={PM.w - PM.r}
              y1={py(v)}
              y2={py(v)}
              stroke={grid}
              strokeWidth={1.5}
            />
            <text x={PM.l - 8} y={py(v) + 7} textAnchor="end" fontSize={22} fill={ink3}>
              {v}°
            </text>
          </g>
        ))}
        {[
          [0, '0h'],
          [6, '6am'],
          [12, 'noon'],
          [18, '6pm'],
        ].map(([h, l]) => (
          <text
            key={l}
            x={px(h as number)}
            y={PM.h - 4}
            textAnchor="middle"
            fontSize={22}
            fill={ink3}
          >
            {l}
          </text>
        ))}
        <path d={seriesPath(AVG)} fill="none" stroke="#a89888" strokeWidth={2.5} />
        <path
          d={seriesPath(s)}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          style={{ animation: anim(live, `heat-draw 1.2s ${EASE} ${0.2 + i * 0.12}s both`) }}
        />
        <circle cx={px(3)} cy={py(s[3])} r={7} fill={color} stroke="#fdf1e6" strokeWidth={2.5} />
      </svg>
    </div>
  );
};

const SmallMultiples: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame
      kicker="Chapter 4 · The clock"
      title="The hot blocks never get a night off"
      dek={
        <>
          Air temperature over 24 hours, 14 Aug 2025 —{' '}
          <span style={{ color: '#8f7f70', fontWeight: 600 }}>city average</span> in grey, night
          hours shaded
        </>
      }
      source="Source: Port Halden Urban Climate Survey, hourly street-sensor means (illustrative data)."
    >
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 318,
          width: 1700,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 500px)',
          columnGap: 100,
          rowGap: 40,
        }}
      >
        <Panel name="Eastgate" day={3.6} night={5.8} i={0} live={live} />
        <Panel name="Old Docks" day={4.1} night={4.4} i={1} live={live} />
        <Panel name="Market Square" day={2.2} night={3.1} i={2} live={live} />
        <Panel name="Northfield" day={0.4} night={0.6} i={3} live={live} />
        <Panel name="Riverside" day={-0.8} night={-0.4} i={4} live={live} />
        <Panel name="Linden Park" day={-3.4} night={-2.6} i={5} live={live} />
      </div>
    </Frame>
  );
};

const Quote: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: 0,
        height: 10,
        background: 'var(--osd-text)',
      }}
    />
    <div style={{ position: 'absolute', left: 260, right: 260, top: 170 }}>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 240,
          lineHeight: 0.6,
          color: 'var(--osd-accent)',
          height: 110,
        }}
      >
        “
      </div>
      <blockquote
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 78,
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        In August we sleep with wet towels over the windows. The flat never cools down — not even at
        four in the morning.
      </blockquote>
      <div style={{ marginTop: 50, display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 60, height: 3, background: 'var(--osd-accent)' }} />
        <div style={{ fontSize: 30 }}>
          <b>Marisol Okafor</b>, 67{' '}
          <span style={{ color: ink2 }}>· has lived on Canal Row, Eastgate, since 1994</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 90,
          display: 'flex',
          gap: 70,
          borderTop: `1px solid ${axis}`,
          paddingTop: 26,
          maxWidth: 1100,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 600,
              color: 'var(--osd-accent)',
              letterSpacing: '-0.02em',
            }}
          >
            29.4°C
          </div>
          <div style={{ fontSize: 24, color: ink2 }}>Her bedroom at 4am, 14 August</div>
        </div>
        <div>
          <div style={{ fontSize: 54, fontWeight: 600, letterSpacing: '-0.02em' }}>24°C</div>
          <div style={{ fontSize: 24, color: ink2 }}>Suggested night-time ceiling indoors</div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

const QUINTILES: { label: string; v: number; canopy: number }[] = [
  { label: 'Poorest fifth', v: 3.1, canopy: 9 },
  { label: 'Second', v: 1.6, canopy: 14 },
  { label: 'Middle', v: 0.3, canopy: 22 },
  { label: 'Fourth', v: -0.9, canopy: 31 },
  { label: 'Richest fifth', v: -1.5, canopy: 43 },
];

const ZERO = 700;
const PER = 120;

const QuintileRow = ({
  label,
  v,
  canopy,
  i,
  live,
}: {
  label: string;
  v: number;
  canopy: number;
  i: number;
  live: boolean;
}) => {
  const w = Math.abs(v) * PER;
  const pos = v >= 0;
  return (
    <div style={{ position: 'relative', height: 96 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 30,
          width: 260,
          fontSize: 30,
          fontWeight: i === 0 || i === 4 ? 700 : 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'absolute',
          left: pos ? ZERO : ZERO - w,
          top: 26,
          width: w,
          height: 44,
          background: pos ? hot : cool,
          borderRadius: pos ? '0 4px 4px 0' : '4px 0 0 4px',
          transformOrigin: pos ? 'left center' : 'right center',
          animation: anim(live, `heat-grow-x 0.9s ${EASE} ${0.2 + i * 0.1}s both`),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: pos ? ZERO + w + 14 : undefined,
          right: pos ? undefined : 1700 - (ZERO - w - 14),
          top: 30,
          fontSize: 30,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          animation: anim(live, `heat-fade 0.4s ease-out ${0.8 + i * 0.1}s both`),
        }}
      >
        {fmt(v)}°C
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1440,
          top: 30,
          width: 260,
          fontSize: 30,
          color: ink2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: Math.round(canopy * 4.4),
            height: 14,
            background: '#7da36a',
            borderRadius: 3,
            marginRight: 14,
            verticalAlign: 'middle',
          }}
        />
        {canopy}%
      </div>
    </div>
  );
};

const Inequality: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame
      kicker="Chapter 5 · Who bears it"
      title="The poorest blocks are 4.6°C hotter than the richest"
      dek="Median afternoon temperature vs city average, by household-income fifth of city blocks"
      source="Source: Port Halden Urban Climate Survey; income from 2024 municipal tax records, 1,812 blocks (illustrative data)."
    >
      <div style={{ position: 'absolute', left: 110, top: 316, width: 1700, height: 560 }}>
        <div
          style={{
            position: 'absolute',
            left: 1440,
            top: -2,
            fontSize: 22,
            fontWeight: 700,
            color: ink3,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Tree canopy
        </div>
        <div
          style={{
            position: 'absolute',
            left: ZERO - 1,
            top: 40,
            width: 2,
            height: 500,
            background: '#26221f',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: ZERO - 200,
            top: -2,
            width: 400,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: ink3,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          City average
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 44 }}>
          <QuintileRow
            label={QUINTILES[0].label}
            v={QUINTILES[0].v}
            canopy={QUINTILES[0].canopy}
            i={0}
            live={live}
          />
          <QuintileRow
            label={QUINTILES[1].label}
            v={QUINTILES[1].v}
            canopy={QUINTILES[1].canopy}
            i={1}
            live={live}
          />
          <QuintileRow
            label={QUINTILES[2].label}
            v={QUINTILES[2].v}
            canopy={QUINTILES[2].canopy}
            i={2}
            live={live}
          />
          <QuintileRow
            label={QUINTILES[3].label}
            v={QUINTILES[3].v}
            canopy={QUINTILES[3].canopy}
            i={3}
            live={live}
          />
          <QuintileRow
            label={QUINTILES[4].label}
            v={QUINTILES[4].v}
            canopy={QUINTILES[4].canopy}
            i={4}
            live={live}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 540,
            fontSize: 24,
            color: ink2,
            display: 'flex',
            gap: 40,
          }}
        >
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                background: hot,
                borderRadius: 3,
                marginRight: 10,
              }}
            />
            Hotter than average
          </span>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 18,
                height: 18,
                background: cool,
                borderRadius: 3,
                marginRight: 10,
              }}
            />
            Cooler than average
          </span>
        </div>
      </div>
    </Frame>
  );
};

const FIX_MAX = 4.5;
const FIX_PX = 150;

const FixRow = ({
  name,
  detail,
  cooling,
  perDollar,
  best,
  i,
  live,
}: {
  name: string;
  detail: string;
  cooling: number;
  perDollar: number;
  best?: boolean;
  i: number;
  live: boolean;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '470px 760px 1fr',
      alignItems: 'center',
      height: 86,
      borderBottom: `1px solid ${grid}`,
    }}
  >
    <div>
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.15 }}>{name}</div>
      <div style={{ fontSize: 22, color: ink3 }}>{detail}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: (cooling / FIX_MAX) * FIX_PX * 4.2,
          height: 36,
          background: cool,
          borderRadius: '0 4px 4px 0',
          transformOrigin: 'left center',
          animation: anim(live, `heat-grow-x 0.9s ${EASE} ${0.2 + i * 0.09}s both`),
        }}
      />
      <div style={{ fontSize: 30, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        −{cooling.toFixed(1)}°C
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          fontSize: 30,
          fontWeight: best ? 700 : 500,
          color: best ? 'var(--osd-text)' : ink2,
          fontVariantNumeric: 'tabular-nums',
          width: 80,
          textAlign: 'right',
        }}
      >
        {perDollar.toFixed(1)}
      </div>
      {best ? (
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#fff',
            background: '#26221f',
            padding: '5px 10px',
            borderRadius: 3,
          }}
        >
          Best value
        </div>
      ) : null}
    </div>
  </div>
);

const Interventions: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame
      kicker="Chapter 6 · What works"
      title="Trees cool the most. White roofs cool the cheapest."
      source="Source: Port Halden Climate Office cooling model for a typical Eastgate block, peak afternoon surface air temperature (illustrative data)."
    >
      <div style={{ position: 'absolute', left: 110, top: 268, width: 1700 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '470px 760px 1fr',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: ink3,
            borderBottom: `2px solid ${axis}`,
            paddingBottom: 10,
          }}
        >
          <span>Intervention</span>
          <span>Peak cooling</span>
          <span>°C per $100k</span>
        </div>
        <FixRow
          name="Street trees"
          detail="Canopy raised to 30%"
          cooling={4.2}
          perDollar={1.1}
          i={0}
          live={live}
        />
        <FixRow
          name="Cool roofs"
          detail="Reflective coating on flat roofs"
          cooling={2.9}
          perDollar={2.4}
          best
          i={1}
          live={live}
        />
        <FixRow
          name="Green roofs"
          detail="Planted roofs on public buildings"
          cooling={2.1}
          perDollar={0.3}
          i={2}
          live={live}
        />
        <FixRow
          name="Pale, permeable paving"
          detail="Car parks and schoolyards"
          cooling={1.8}
          perDollar={0.4}
          i={3}
          live={live}
        />
        <FixRow
          name="Water & misting"
          detail="Fountains, splash pads, misters"
          cooling={1.1}
          perDollar={0.5}
          i={4}
          live={live}
        />
        <FixRow
          name="Shade sails"
          detail="Over bus stops and play areas"
          cooling={0.9}
          perDollar={1.0}
          i={5}
          live={live}
        />
      </div>
      <div style={{ position: 'absolute', left: 110, top: 862, fontSize: 26, color: ink2 }}>
        Effects overlap: trees plus cool roofs together model at about{' '}
        <b style={{ color: 'var(--osd-text)' }}>−5°C</b>, not the −7.1°C their sum suggests.
      </div>
    </Frame>
  );
};

const MINI_W = 370;
const MINI_H = 150;

const MiniCaption = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: 22, color: ink3, marginTop: 8 }}>{children}</div>
);

const MiniStripes = () => (
  <svg width={MINI_W} height={MINI_H} viewBox={`0 0 ${MINI_W} ${MINI_H}`}>
    {TRANSECT.map((v, i) => {
      const w = MINI_W / TRANSECT.length;
      const h = 30 + (v + 3) * 15;
      return <rect key={i} x={i * w} y={MINI_H - h} width={w - 2} height={h} fill={binColor(v)} />;
    })}
  </svg>
);

const MiniNight = () => {
  const e = hourly(3.6, 5.8);
  const mx = (h: number) => (h / 24) * MINI_W;
  const my = (v: number) => 10 + (1 - (v - 18) / 22) * (MINI_H - 20);
  const p = (s: number[]) =>
    s.map((v, h) => `${h === 0 ? 'M' : 'L'}${mx(h).toFixed(1)} ${my(v).toFixed(1)}`).join(' ');
  return (
    <svg width={MINI_W} height={MINI_H} viewBox={`0 0 ${MINI_W} ${MINI_H}`}>
      <rect x={0} y={0} width={mx(6)} height={MINI_H} fill="#f3e2d3" />
      <rect x={mx(21)} y={0} width={MINI_W - mx(21)} height={MINI_H} fill="#f3e2d3" />
      <path d={p(AVG)} fill="none" stroke="#a89888" strokeWidth={2.5} />
      <path d={p(e)} fill="none" stroke={hot} strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
};

const MiniBars = ({
  a,
  b,
  labelA,
  labelB,
  colorA,
  colorB,
  max,
}: {
  a: number;
  b: number;
  labelA: string;
  labelB: string;
  colorA: string;
  colorB: string;
  max: number;
}) => (
  <svg width={MINI_W} height={MINI_H} viewBox={`0 0 ${MINI_W} ${MINI_H}`}>
    <rect x={0} y={22} width={(a / max) * (MINI_W - 90)} height={34} fill={colorA} rx={3} />
    <text x={(a / max) * (MINI_W - 90) + 12} y={48} fontSize={24} fontWeight={700} fill="#26221f">
      {labelA}
    </text>
    <rect x={0} y={90} width={(b / max) * (MINI_W - 90)} height={34} fill={colorB} rx={3} />
    <text x={(b / max) * (MINI_W - 90) + 12} y={116} fontSize={24} fontWeight={700} fill="#26221f">
      {labelB}
    </text>
  </svg>
);

const Takeaway = ({
  n,
  title,
  children,
  chart,
  caption,
}: {
  n: string;
  title: string;
  children: ReactNode;
  chart: ReactNode;
  caption: string;
}) => (
  <div
    style={{
      borderTop: '3px solid #26221f',
      paddingTop: 20,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 64,
        fontWeight: 600,
        color: 'var(--osd-accent)',
        lineHeight: 1,
      }}
    >
      {n}
    </div>
    <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.25, marginTop: 14 }}>{title}</div>
    <div style={{ fontSize: 28, color: ink2, lineHeight: 1.42, marginTop: 10, height: 160 }}>
      {children}
    </div>
    <div style={{ marginTop: 20 }}>{chart}</div>
    <MiniCaption>{caption}</MiniCaption>
  </div>
);

const Takeaways: Page = () => (
  <Frame kicker="What we learned" title="Four things to take from Port Halden">
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: 268,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        columnGap: 56,
      }}
    >
      <Takeaway
        n="1"
        title="Heat is local"
        chart={<MiniStripes />}
        caption="Linden Park → Eastgate, 3 miles"
      >
        Blocks a short walk apart can sit 8°C apart. A citywide average hides the danger.
      </Takeaway>
      <Takeaway
        n="2"
        title="Nights are the risk"
        chart={<MiniNight />}
        caption="Eastgate vs city average, 24 hours"
      >
        Bodies recover overnight. In Eastgate, nights now stay 6°C above the city average.
      </Takeaway>
      <Takeaway
        n="3"
        title="Shade is unequal"
        chart={
          <MiniBars
            a={9}
            b={43}
            labelA="9%"
            labelB="43%"
            colorA="#7da36a"
            colorB="#7da36a"
            max={45}
          />
        }
        caption="Tree canopy, poorest vs richest fifth"
      >
        The richest fifth of blocks has nearly five times the tree cover of the poorest.
      </Takeaway>
      <Takeaway
        n="4"
        title="The fixes are known"
        chart={
          <MiniBars
            a={4.2}
            b={2.9}
            labelA="−4.2°C"
            labelB="−2.9°C"
            colorA={cool}
            colorB={cool}
            max={4.5}
          />
        }
        caption="Peak cooling: street trees, cool roofs"
      >
        Trees and cool roofs together could take 5°C off the hottest blocks within a decade.
      </Takeaway>
    </div>
  </Frame>
);

const Glance = ({ value, label }: { value: string; label: string }) => (
  <div style={{ borderTop: `2px solid ${axis}`, paddingTop: 16 }}>
    <div style={{ fontSize: 60, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
      {value}
    </div>
    <div style={{ fontSize: 24, color: ink2, marginTop: 4 }}>{label}</div>
  </div>
);

const Method: Page = () => (
  <Frame kicker="Methodology" title="How we did this">
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: 270,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: 90,
        fontSize: 29,
        lineHeight: 1.55,
      }}
    >
      <div>
        <p style={{ margin: 0 }}>
          Temperatures come from street-level sensors mounted 1.5{'\u00a0'}m above the pavement,
          read every ten minutes from June to September 2025, plus a 250{'\u00a0'}m land-surface
          model for the map.
        </p>
        <p style={{ margin: '22px 0 0' }}>
          Canopy is measured from aerial LiDAR. Income fifths rank city blocks by median household
          income. Cooling estimates model one typical Eastgate block.
        </p>
      </div>
      <div>
        <div
          style={{
            background: '#f6e2d0',
            borderLeft: '4px solid var(--osd-accent)',
            padding: '24px 30px',
            fontSize: 28,
          }}
        >
          <b>A note on the data.</b> Port Halden is a fictional city, and every figure in this story
          is illustrative — modelled on patterns reported in real urban-heat studies.
        </div>
        <div style={{ marginTop: 28, fontSize: 24, color: ink2, lineHeight: 1.6 }}>
          <b style={{ color: 'var(--osd-text)' }}>Reporting</b> Data Desk ·{' '}
          <b style={{ color: 'var(--osd-text)' }}>Graphics</b> Lena Ferro, Tomás Abiodun ·{' '}
          <b style={{ color: 'var(--osd-text)' }}>Editing</b> Priya Raman
        </div>
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        top: 720,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        columnGap: 56,
      }}
    >
      <Glance value="212" label="street-level sensors" />
      <Glance value="3.6M" label="temperature readings" />
      <Glance value="1,812" label="city blocks ranked by income" />
      <Glance value="45" label="neighbourhoods compared" />
    </div>
  </Frame>
);

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

export const meta: SlideMeta = {
  title: 'The Hottest Block in Town',
  createdAt: '2026-10-07T16:03:56.041Z',
};

export default [
  Cover,
  BigNumber,
  NightsChart,
  HeatMap,
  Scatter,
  SmallMultiples,
  Quote,
  Inequality,
  Interventions,
  Takeaways,
  Method,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `This is a story about one August afternoon in Port Halden — and why two neighbourhoods three miles apart felt like different countries.
The strip at the bottom is a walk from Linden Park to Eastgate. Every bar is a block. Watch the colour climb.`,
  `Eight point one degrees. Same city, same hour.
Three numbers frame the rest of the talk: 41 tropical nights downtown against 9 at the airport, a 4.6-degree gap between the poorest and richest blocks, and tree cover of 11 per cent versus 46.`,
  `Start with the nights, because that's where heat kills.
[click] 2003, the heatwave — 25 nights the city never cooled below 20.
[click] Look at the gap. Seven extra nights in 1985; thirty-two by 2025.
[click] And 2025 is the record: 41 nights. The airport line barely moves. This is the city doing it, not just the climate.`,
  `Here's where the heat sits. Each square is roughly 250 metres.
Eastgate in the east is the hot core — warehouses, the Ring Road, almost no trees. The docks are close behind. Linden Park is the cool island, and you can see its effect fade a few blocks out.`,
  `Plot every neighbourhood by tree cover and temperature and the line is hard to argue with.
Roughly two degrees cooler for every ten points of canopy. Eastgate and the docks sit top left; Linden Park bottom right.`,
  `Six neighbourhoods, same 24 hours. The grey line is the city average.
Note the shaded night hours: Eastgate and the docks stay far above average all night. Linden Park drops below it. That night-time gap is what sends people to hospital.`,
  `Pause on this one. Marisol has lived in Eastgate for thirty years. Let the quote land before moving on.`,
  `Now the uncomfortable part. Rank blocks by income and the heat lines up almost perfectly.
The poorest fifth runs three degrees hotter than average; the richest a degree and a half cooler. Look at the tree column on the right — 9 per cent canopy versus 43.`,
  `The good news: we know what works.
Trees give the most cooling — over four degrees. But per dollar, cool roofs win: 2.4 degrees for every hundred thousand. Green roofs are lovely and expensive.`,
  `Four things to take home. Heat is local. Nights are the risk. Shade is unequal. And the fixes are known — it's a question of where we spend first.`,
  `A quick word on method — and a reminder that Port Halden is fictional and these numbers are illustrative, modelled on patterns from real urban-heat research. Thank you.`,
];

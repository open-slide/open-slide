import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  Step,
  Steps,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#F3F1EC', text: '#141414', accent: '#E8471C' },
  fonts: {
    display: '"Geist", "Helvetica Neue", Arial, sans-serif',
    body: '"Geist", "Helvetica Neue", Arial, sans-serif',
  },
  typeScale: { hero: 520, body: 28 },
  radius: 0,
};

const muted = '#85817A';
const rule = '#D8D3C8';
const panel = '#E9E6DF';
const ink2 = '#3B3B3B';
const INK = 'var(--osd-text)';
const ACCENT = 'var(--osd-accent)';
const PAPER = 'var(--osd-bg)';
const DISPLAY = 'var(--osd-font-display)';
const MONO = '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap';
const FONT_LINK_ID = 'osd-webfont-northfold-q3-board';
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

const colX = (col: number) => 120 + (col - 1) * 142;
const span = (cols: number) => cols * 142 - 24;
const pad2 = (n: number) => String(n).padStart(2, '0');

const abs = (left: number, top: number, width?: number): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
});

const root: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: PAPER,
  color: INK,
  fontFamily: 'var(--osd-font-body)',
  fontVariantNumeric: 'tabular-nums',
};

const chrome: CSSProperties = {
  fontFamily: MONO,
  fontSize: 20,
  lineHeight: '20px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: muted,
};

const label: CSSProperties = {
  fontFamily: MONO,
  fontSize: 20,
  lineHeight: '24px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: muted,
};

const Glyph = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block' }}>
    <polygon points="0,0 40,0 0,40" fill={INK} />
    <polygon points="40,3.5 40,40 3.5,40" fill={ACCENT} />
  </svg>
);

const Wordmark = ({ size = 40 }: { size?: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.34 }}>
    <Glyph size={size} />
    <span
      style={{
        fontFamily: DISPLAY,
        fontWeight: 600,
        fontSize: size * 0.98,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        paddingBottom: size * 0.08,
      }}
    >
      northfold
    </span>
  </div>
);

const Frame = ({ section, children }: { section: string; children: ReactNode }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div style={root}>
      <div
        style={{
          ...chrome,
          position: 'absolute',
          left: 120,
          right: 120,
          top: 50,
          height: 38,
          borderBottom: `1px solid ${rule}`,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Northfold · Board update Q3 FY26</span>
        <span>Confidential</span>
      </div>
      {children}
      <div
        style={{
          ...chrome,
          position: 'absolute',
          left: 120,
          right: 120,
          top: 1000,
          paddingTop: 22,
          borderTop: `1px solid ${rule}`,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{section}</span>
        <span>
          <span style={{ color: INK }}>{pad2(current)}</span> / {pad2(total)}
        </span>
      </div>
    </div>
  );
};

const Headline = ({
  num,
  topic,
  children,
  width = span(11),
}: {
  num: string;
  topic: string;
  children: ReactNode;
  width?: number;
}) => (
  <div style={abs(120, 128, width)}>
    <div style={{ ...chrome, color: INK }}>
      <span style={{ color: ACCENT }}>{num}</span>
      <span style={{ marginLeft: 18 }}>{topic}</span>
    </div>
    <h1
      style={{
        margin: '24px 0 0',
        fontFamily: DISPLAY,
        fontSize: 72,
        fontWeight: 500,
        lineHeight: 1.04,
        letterSpacing: '-0.04em',
      }}
    >
      {children}
    </h1>
  </div>
);

const Source = ({
  children,
  left = 120,
  width = 1680,
}: {
  children: ReactNode;
  left?: number;
  width?: number;
}) => (
  <div
    style={{
      ...abs(left, 948, width),
      fontFamily: MONO,
      fontSize: 20,
      lineHeight: '26px',
      color: muted,
    }}
  >
    {children}
  </div>
);

const ARR = [13.0, 15.4, 18.9, 22.6, 26.1, 29.8, 34.1, 38.6, 43.2, 48.2];
const ARR_Q = ['Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3'];

const ArrStrip = () => {
  const bw = 26;
  const gap = 14;
  const h = 112;
  const w = ARR.length * bw + (ARR.length - 1) * gap;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {ARR.map((v, i) => {
        const bh = (v / 48.2) * h;
        return (
          <rect
            key={`strip-${i}`}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            fill={i === ARR.length - 1 ? ACCENT : INK}
          />
        );
      })}
    </svg>
  );
};

const Cover: Page = () => (
  <div style={root}>
    <div style={abs(120, 78)}>
      <Wordmark size={44} />
    </div>
    <div style={{ ...chrome, position: 'absolute', right: 120, top: 92 }}>
      Quarter ended 30 Sep 2026
    </div>
    <div
      style={{ position: 'absolute', left: 120, right: 120, top: 160, height: 1, background: rule }}
    />
    <div style={abs(120, 244, span(9))}>
      <div style={chrome}>Board of directors · Quarterly review</div>
      <h1
        style={{
          margin: '40px 0 0',
          fontFamily: DISPLAY,
          fontSize: 168,
          fontWeight: 500,
          lineHeight: 0.92,
          letterSpacing: '-0.05em',
        }}
      >
        Board update
      </h1>
      <div
        style={{
          marginTop: 30,
          fontSize: 60,
          lineHeight: 1.1,
          letterSpacing: '-0.035em',
          color: ink2,
        }}
      >
        Third quarter, fiscal 2026
      </div>
      <div
        style={{ marginTop: 48, fontFamily: MONO, fontSize: 22, lineHeight: '30px', color: ink2 }}
      >
        14 October 2026 · Prepared for the board of directors · Confidential
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 168,
        top: 556,
        fontFamily: DISPLAY,
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '-0.07em',
      }}
    >
      Q3
    </div>
    <div style={{ ...abs(1760, 966), width: 40, height: 40, background: ACCENT }} />
    <div style={abs(120, 776)}>
      <div style={label}>ARR, $M · Q2 FY24 – Q3 FY26</div>
      <div style={{ marginTop: 20 }}>
        <ArrStrip />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: 386,
          marginTop: 12,
          fontFamily: MONO,
          fontSize: 20,
          lineHeight: '24px',
          color: muted,
        }}
      >
        <span>13.0</span>
        <span style={{ color: INK }}>48.2</span>
      </div>
    </div>
  </div>
);

const Spark = ({ data, w = 354, h = 72 }: { data: number[]; w?: number; h?: number }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const x = (i: number) => 8 + (i * (w - 16)) / (data.length - 1);
  const y = (v: number) => 8 + (1 - (v - min) / (max - min)) * (h - 16);
  const last = data.length - 1;
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline
        points={data.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
        fill="none"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={x(last)} cy={y(data[last])} r={6} fill={ACCENT} />
    </svg>
  );
};

const Kpi = ({
  title,
  value,
  unit,
  detail,
  data,
  plan,
  delta,
  first = false,
}: {
  title: string;
  value: string;
  unit: string;
  detail: string;
  data: number[];
  plan: string;
  delta: string;
  first?: boolean;
}) => (
  <div
    style={{
      paddingTop: 32,
      paddingLeft: first ? 0 : 24,
      borderLeft: first ? 'none' : `1px solid ${rule}`,
    }}
  >
    <div style={label}>{title}</div>
    <div
      style={{
        marginTop: 40,
        fontFamily: DISPLAY,
        fontSize: 120,
        fontWeight: 500,
        lineHeight: 0.9,
        letterSpacing: '-0.05em',
      }}
    >
      {value}
      <span style={{ fontSize: 60, letterSpacing: '-0.03em', marginLeft: 6 }}>{unit}</span>
    </div>
    <div style={{ marginTop: 22, fontSize: 28, lineHeight: 1.3, color: ink2 }}>{detail}</div>
    <div style={{ marginTop: 52 }}>
      <Spark data={data} />
    </div>
    <div
      style={{
        marginTop: 36,
        paddingTop: 18,
        borderTop: `1px solid ${rule}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        width: 354,
        fontFamily: MONO,
      }}
    >
      <span style={{ fontSize: 22, color: muted }}>{plan}</span>
      <span style={{ fontSize: 24, fontWeight: 500, color: ACCENT }}>{delta}</span>
    </div>
  </div>
);

const Glance: Page = () => (
  <Frame section="01 Performance">
    <Headline num="1.1" topic="Quarter at a glance">
      Ahead of plan on growth.
      <br />
      On plan on burn.
    </Headline>
    <div
      style={{
        ...abs(120, 400, 1680),
        borderTop: `1px solid ${INK}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        columnGap: 24,
      }}
    >
      <Kpi
        first
        title="ARR, quarter end"
        value="$48.2"
        unit="M"
        detail="+11.6% QoQ · +62% YoY"
        data={[26.1, 29.8, 34.1, 38.6, 43.2, 48.2]}
        plan="Plan $46.5M"
        delta="+$1.7M"
      />
      <Kpi
        title="Net revenue retention"
        value="128"
        unit="%"
        detail="Trailing twelve months"
        data={[118, 120, 121, 123, 125, 128]}
        plan="Plan 122%"
        delta="+6 pts"
      />
      <Kpi
        title="Gross margin"
        value="81.4"
        unit="%"
        detail="+1.9 pts YoY"
        data={[78.9, 79.5, 80.0, 80.4, 80.9, 81.4]}
        plan="Plan 80.5%"
        delta="+0.9 pts"
      />
      <Kpi
        title="Burn multiple"
        value="0.88"
        unit="×"
        detail="Net burn / net new ARR"
        data={[1.51, 1.41, 1.19, 1.09, 1.0, 0.88]}
        plan="Plan 0.90×"
        delta="0.02× better"
      />
    </div>
    <Source>
      Source: Northfold finance, unaudited. ARR at quarter end. NRR trailing twelve months.
      Sparklines Q2 FY25 – Q3 FY26.
    </Source>
  </Frame>
);

const ArrChart = () => {
  const W = span(9);
  const H = 584;
  const L = 64;
  const T = 40;
  const B = 496;
  const max = 60;
  const x0 = L + 32;
  const x1 = W - 48;
  const x = (i: number) => x0 + (i * (x1 - x0)) / 9;
  const y = (v: number) => B - (v / max) * (B - T);
  const line = ARR.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${x(0)},${B} ${line} ${x(9)},${B}`;
  const plan: [number, number][] = [
    [6, 34.1],
    [7, 37.9],
    [8, 42.0],
    [9, 46.5],
  ];
  const planLine = plan.map(([i, v]) => `${x(i)},${y(v)}`).join(' ');
  const ticks = [0, 10, 20, 30, 40, 50, 60];
  const years: [string, number, number][] = [
    ['FY24', 0, 2],
    ['FY25', 3, 6],
    ['FY26', 7, 9],
  ];
  const qx = x(9);
  const qy = y(48.2);
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      {ticks.map((t) => (
        <g key={`t${t}`}>
          <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke={t === 0 ? INK : rule} strokeWidth={1} />
          <text
            x={L - 16}
            y={y(t) + 7}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={20}
            fill={muted}
          >
            {t}
          </text>
        </g>
      ))}
      <polygon points={area} fill={INK} fillOpacity={0.06} />
      <polyline
        points={line}
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={planLine}
        fill="none"
        stroke={muted}
        strokeWidth={2}
        strokeDasharray="7 7"
      />
      {plan.slice(1).map(([i, v]) => (
        <circle
          key={`p${i}`}
          cx={x(i)}
          cy={y(v)}
          r={5}
          fill={PAPER}
          stroke={muted}
          strokeWidth={2}
        />
      ))}
      <text
        x={(x(7) + x(8)) / 2}
        y={y(40) + 30}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize={20}
        fill={ink2}
      >
        Plan
      </text>
      {ARR.slice(0, 9).map((v, i) => (
        <circle key={`a${i}`} cx={x(i)} cy={y(v)} r={4.5} fill={INK} />
      ))}
      <circle cx={qx} cy={qy} r={10} fill={ACCENT} stroke={PAPER} strokeWidth={3} />
      <polyline
        points={`${qx - 30},${T + 52} ${qx},${T + 52} ${qx},${qy - 16}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.5}
      />
      <text
        x={qx - 42}
        y={T + 48}
        textAnchor="end"
        fontFamily={DISPLAY}
        fontSize={40}
        fontWeight={600}
        letterSpacing="-0.03em"
        fill={INK}
      >
        $48.2M
      </text>
      <text
        x={qx - 42}
        y={T + 78}
        textAnchor="end"
        fontFamily={MONO}
        fontSize={22}
        fontWeight={500}
        fill={ACCENT}
      >
        +$1.7M vs plan
      </text>
      {ARR_Q.map((q, i) => (
        <text
          key={`q${i}`}
          x={x(i)}
          y={B + 36}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={20}
          fill={i === 9 ? INK : muted}
        >
          {q}
        </text>
      ))}
      {years.map(([fy, s, e]) => (
        <g key={fy}>
          <line x1={x(s) - 26} x2={x(e) + 26} y1={B + 54} y2={B + 54} stroke={rule} />
          <text x={x(s) - 26} y={B + 84} fontFamily={MONO} fontSize={20} fill={ink2}>
            {fy}
          </text>
        </g>
      ))}
    </svg>
  );
};

const Stat = ({
  title,
  value,
  unit,
  caption,
}: {
  title: string;
  value: string;
  unit?: string;
  caption: string;
}) => (
  <div style={{ paddingTop: 22, borderTop: `1px solid ${rule}` }}>
    <div style={label}>{title}</div>
    <div
      style={{
        marginTop: 16,
        fontFamily: DISPLAY,
        fontSize: 72,
        fontWeight: 500,
        lineHeight: 0.92,
        letterSpacing: '-0.045em',
      }}
    >
      {value}
      {unit ? <span style={{ fontSize: 36, marginLeft: 4 }}>{unit}</span> : null}
    </div>
    <div style={{ marginTop: 14, fontSize: 24, lineHeight: 1.35, color: ink2 }}>{caption}</div>
  </div>
);

const Trajectory: Page = () => (
  <Frame section="01 Performance">
    <Headline num="1.2" topic="ARR trajectory">
      Ten quarters of compounding.
    </Headline>
    <div style={{ ...abs(120, 300), ...label }}>Quarter-end ARR, $M</div>
    <div style={abs(120, 336)}>
      <ArrChart />
    </div>
    <div
      style={{
        ...abs(colX(10), 336, span(3)),
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
      }}
    >
      <Stat title="Since Q2 FY24" value="3.7" unit="×" caption="ARR growth, $13.0M to $48.2M." />
      <Stat title="Compound rate" value="15.7" unit="%" caption="Compound quarterly growth." />
      <Stat title="Net new ARR, Q3" value="$5.0" unit="M" caption="Record quarter; Q2 was $4.6M." />
    </div>
    <Source>
      Source: Northfold finance, unaudited. ARR at quarter end, $M. Plan = FY26 board-approved
      operating plan.
    </Source>
  </Frame>
);

type Bar = { name: string; sub?: string; from: number; to: number; kind: 'total' | 'up' | 'down' };

const BRIDGE: Bar[] = [
  { name: 'Opening ARR', sub: 'Q2 FY26', from: 40, to: 43.2, kind: 'total' },
  { name: 'New logos', from: 43.2, to: 46.3, kind: 'up' },
  { name: 'Expansion', from: 46.3, to: 49.2, kind: 'up' },
  { name: 'Contraction', from: 49.2, to: 48.8, kind: 'down' },
  { name: 'Churn', from: 48.8, to: 48.2, kind: 'down' },
  { name: 'Closing ARR', sub: 'Q3 FY26', from: 40, to: 48.2, kind: 'total' },
];

const Waterfall = () => {
  const W = span(8);
  const H = 530;
  const B = 440;
  const k = 36;
  const L = 64;
  const x0 = 88;
  const slot = (W - x0) / 6;
  const bw = 104;
  const y = (v: number) => B - (v - 40) * k;
  const bx = (i: number) => x0 + i * slot + (slot - bw) / 2;
  const fmt = (b: Bar) => {
    if (b.kind === 'total') return b.to.toFixed(1);
    const d = b.to - b.from;
    return `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`;
  };
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <defs>
        <pattern
          id="nf-hatch"
          width={7}
          height={7}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={7} height={7} fill={PAPER} />
          <line x1={0} y1={0} x2={0} y2={7} stroke={INK} strokeWidth={3} />
        </pattern>
      </defs>
      {[40, 42, 44, 46, 48].map((t) => (
        <g key={`g${t}`}>
          <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke={t === 40 ? INK : rule} />
          <text
            x={L - 16}
            y={y(t) + 7}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={20}
            fill={muted}
          >
            {t}
          </text>
        </g>
      ))}
      {BRIDGE.slice(0, 5).map((b, i) => (
        <line
          key={`c${b.name}`}
          x1={bx(i) + bw}
          x2={bx(i + 1)}
          y1={y(b.to)}
          y2={y(b.to)}
          stroke={ink2}
          strokeDasharray="3 4"
        />
      ))}
      {BRIDGE.map((b, i) => {
        const top = y(Math.max(b.from, b.to));
        const h = Math.abs(b.to - b.from) * k;
        const fill = b.kind === 'up' ? ACCENT : b.kind === 'down' ? 'url(#nf-hatch)' : INK;
        return (
          <g key={b.name}>
            <rect
              x={bx(i)}
              y={top}
              width={bw}
              height={h}
              fill={fill}
              stroke={b.kind === 'down' ? INK : 'none'}
              strokeWidth={1.5}
            />
            {b.kind === 'total' ? (
              <polygon
                points={`${bx(i) - 2},${B - 20} ${bx(i) + bw + 2},${B - 32} ${bx(i) + bw + 2},${B - 24} ${bx(i) - 2},${B - 12}`}
                fill={PAPER}
              />
            ) : null}
            <text
              x={bx(i) + bw / 2}
              y={top - 16}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize={24}
              fontWeight={500}
              fill={b.kind === 'up' ? ACCENT : INK}
            >
              {fmt(b)}
            </text>
            <text
              x={bx(i) + bw / 2}
              y={B + 40}
              textAnchor="middle"
              fontFamily={DISPLAY}
              fontSize={24}
              fill={INK}
            >
              {b.name}
            </text>
            {b.sub ? (
              <text
                x={bx(i) + bw / 2}
                y={B + 70}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={20}
                fill={muted}
              >
                {b.sub}
              </text>
            ) : null}
          </g>
        );
      })}
      <line x1={bx(2) + bw + 8} x2={bx(3) - 10} y1={186} y2={186} stroke={INK} strokeWidth={1.5} />
    </svg>
  );
};

const Bridge: Page = () => (
  <Frame section="01 Performance">
    <Headline num="1.3" topic="ARR bridge, Q2 to Q3 FY26">
      Expansion did nearly as much
      <br />
      as new logos.
    </Headline>
    <div style={{ ...abs(120, 380), ...label }}>ARR, $M</div>
    <div style={abs(120, 410)}>
      <Waterfall />
    </div>
    <div style={abs(120 + 634, 410 + 166, 300)}>
      <div style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        94% of new-logo ARR
      </div>
      <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.35, color: ink2 }}>
        $2.9M from existing customers, against $3.1M from new logos.
      </div>
    </div>
    <div style={{ ...abs(colX(10), 380, span(3)) }}>
      <div style={{ paddingTop: 22, borderTop: `1px solid ${INK}` }}>
        <div style={label}>Net new ARR, Q3</div>
        <div
          style={{
            marginTop: 18,
            fontSize: 112,
            fontWeight: 500,
            lineHeight: 0.92,
            letterSpacing: '-0.05em',
          }}
        >
          $5.0<span style={{ fontSize: 56, marginLeft: 4 }}>M</span>
        </div>
        <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 22, color: ink2 }}>
          3.1 + 2.9 − 0.4 − 0.6
        </div>
      </div>
      <div style={{ marginTop: 48, paddingTop: 22, borderTop: `1px solid ${rule}` }}>
        <div style={label}>Gross churn</div>
        <div
          style={{
            marginTop: 18,
            fontSize: 80,
            fontWeight: 500,
            lineHeight: 0.92,
            letterSpacing: '-0.045em',
          }}
        >
          1.4<span style={{ fontSize: 40, marginLeft: 4 }}>%</span>
        </div>
        <div style={{ marginTop: 14, fontSize: 24, lineHeight: 1.35, color: ink2 }}>
          Churned ARR as a share of opening ARR, in the quarter.
        </div>
      </div>
    </div>
    <Source>
      Source: Northfold finance, unaudited. ARR, $M. Axis starts at $40M. Gross churn = churned ARR
      / opening ARR.
    </Source>
  </Frame>
);

const Divider: Page = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div style={root}>
      <div
        style={{
          position: 'absolute',
          left: colX(7),
          top: 0,
          right: 0,
          bottom: 0,
          background: ACCENT,
        }}
      />
      <div style={{ ...chrome, ...abs(120, 50) }}>Northfold · Board update Q3 FY26</div>
      <div style={{ ...chrome, position: 'absolute', right: 120, top: 50, color: INK }}>
        Confidential
      </div>
      <div style={abs(120, 150, span(6))}>
        <div style={chrome}>Section</div>
        <div
          style={{
            marginTop: 28,
            fontSize: 120,
            fontWeight: 500,
            lineHeight: 0.95,
            letterSpacing: '-0.05em',
          }}
        >
          Customers
        </div>
        <div style={{ marginTop: 24, fontSize: 40, letterSpacing: '-0.02em', color: ink2 }}>
          Retention, cohorts and mix
        </div>
      </div>
      <div style={{ ...abs(colX(7) + 48, 150, span(5)), fontFamily: MONO, color: INK }}>
        <div style={{ ...chrome, color: INK }}>In this section</div>
        <div style={{ marginTop: 32, fontSize: 26, lineHeight: '46px' }}>
          2.1&nbsp;&nbsp;Cohort retention
          <br />
          2.2&nbsp;&nbsp;Customer mix
          <br />
          2.3&nbsp;&nbsp;Pipeline and efficiency
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 319,
          fontFamily: DISPLAY,
          fontSize: 820,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: '-0.075em',
        }}
      >
        02
      </div>
      <div style={{ ...chrome, position: 'absolute', right: 120, top: 1022, color: INK }}>
        {pad2(current)} / {pad2(total)}
      </div>
    </div>
  );
};

const COHORTS: { name: string; v: number[] }[] = [
  { name: 'Q1 FY24', v: [100, 106, 113, 119, 124, 129, 133, 136, 138] },
  { name: 'Q2 FY24', v: [100, 107, 114, 120, 126, 131, 134, 137, 140] },
  { name: 'Q3 FY24', v: [100, 105, 112, 118, 122, 127, 131, 135, 137] },
  { name: 'Q4 FY24', v: [100, 108, 116, 122, 128, 133, 137, 140] },
  { name: 'Q1 FY25', v: [100, 107, 115, 121, 127, 132, 136] },
  { name: 'Q2 FY25', v: [100, 109, 117, 124, 130, 135] },
  { name: 'Q3 FY25', v: [100, 110, 118, 125, 131] },
  { name: 'Q4 FY25', v: [100, 109, 118, 124] },
];

const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const ramp = (t: number) => {
  const a = rgb(panel);
  const b = rgb(design.palette.accent);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c.join(',')})`;
};

const Heatmap = () => {
  const LBL = 150;
  const pitch = 121;
  const cw = 117;
  const rp = 60;
  const rh = 56;
  const top = 64;
  const W = LBL + 9 * pitch;
  const H = top + 8 * rp;
  const fx = LBL + 4 * pitch;
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="nf-ramp" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={panel} />
          <stop offset="1" stopColor={design.palette.accent} />
        </linearGradient>
      </defs>
      <text x={0} y={22} fontFamily={MONO} fontSize={20} fill={muted} letterSpacing="0.06em">
        COHORT
      </text>
      <text x={W - 300} y={22} textAnchor="end" fontFamily={MONO} fontSize={20} fill={muted}>
        100%
      </text>
      <rect x={W - 288} y={8} width={208} height={14} fill="url(#nf-ramp)" />
      <text x={W - 68} y={22} fontFamily={MONO} fontSize={20} fill={muted}>
        140%
      </text>
      <text x={LBL} y={22} fontFamily={MONO} fontSize={20} fill={muted} letterSpacing="0.06em">
        MONTHS SINCE START
      </text>
      {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((m, c) => (
        <text
          key={`m${m}`}
          x={LBL + c * pitch + cw / 2}
          y={top - 10}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={20}
          fontWeight={c === 4 ? 500 : 400}
          fill={c === 4 ? ACCENT : ink2}
        >
          {m}
        </text>
      ))}
      {COHORTS.map((row, r) => (
        <g key={row.name}>
          <text x={0} y={top + r * rp + rh / 2 + 7} fontFamily={MONO} fontSize={20} fill={ink2}>
            {row.name}
          </text>
          {row.v.map((v, c) => {
            const t = Math.min(1, Math.max(0, (v - 100) / 40));
            return (
              <g key={`${row.name}-${c}`}>
                <rect x={LBL + c * pitch} y={top + r * rp} width={cw} height={rh} fill={ramp(t)} />
                <text
                  x={LBL + c * pitch + cw / 2}
                  y={top + r * rp + rh / 2 + 8}
                  textAnchor="middle"
                  fontFamily={MONO}
                  fontSize={22}
                  fontWeight={500}
                  fill={t >= 0.55 ? '#FFFFFF' : INK}
                >
                  {v}
                </text>
              </g>
            );
          })}
        </g>
      ))}
      <rect
        x={fx - 5}
        y={top - 5}
        width={cw + 10}
        height={7 * rp - (rp - rh) + 10}
        fill="none"
        stroke={INK}
        strokeWidth={2.5}
      />
      <text
        x={fx + 2}
        y={top + 7 * rp + rh / 2 + 9}
        fontFamily={DISPLAY}
        fontSize={26}
        fontWeight={500}
        fill={INK}
      >
        Month 12: all seven cohorts at or above 120%
      </text>
    </svg>
  );
};

const Cohorts: Page = () => (
  <Frame section="02 Customers">
    <Headline num="2.1" topic="Cohort net retention">
      Every cohort since FY24 clears
      <br />
      120% by month twelve.
    </Headline>
    <div style={abs(120, 372)}>
      <Heatmap />
    </div>
    <div
      style={{
        ...abs(colX(10), 372, span(3)),
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
      }}
    >
      <Stat
        title="Best month 12"
        value="131"
        unit="%"
        caption="Q3 FY25 cohort, the most recent to reach month 12."
      />
      <Stat
        title="Weakest month 12"
        value="122"
        unit="%"
        caption="Q3 FY24 cohort, since compounded to 137% at month 24."
      />
    </div>
    <Source>
      Source: Northfold finance, unaudited. Cohort ARR as % of starting ARR, quarterly. Q4 FY25
      cohort reaches month 12 in Q4 FY26.
    </Source>
  </Frame>
);

const Segment = ({
  name,
  pct,
  customers,
  bg,
  fg,
}: {
  name: string;
  pct: number;
  customers: string;
  bg: string;
  fg: string;
}) => (
  <div
    style={{
      width: `${pct}%`,
      background: bg,
      color: fg,
      padding: '20px 24px 22px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div
      style={{
        fontFamily: MONO,
        fontSize: 20,
        lineHeight: '26px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {name}
      <br />
      <span style={{ opacity: 0.72 }}>{customers} customers</span>
    </div>
    <div style={{ fontSize: 64, fontWeight: 500, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
      {pct}%
    </div>
  </div>
);

const Mix: Page = () => (
  <Frame section="02 Customers">
    <Headline num="2.2" topic="Customer mix">
      Larger customers, less concentration.
    </Headline>
    <div style={{ ...abs(120, 300), ...label }}>Share of ARR by segment, Q3 FY26</div>
    <div style={{ ...abs(120, 336, 1680), height: 170, display: 'flex', gap: 3 }}>
      <Segment name="Enterprise" pct={31} customers="112" bg={ACCENT} fg="#FFFFFF" />
      <Segment name="Mid-market" pct={54} customers="598" bg={INK} fg="#FFFFFF" />
      <Segment name="Growth" pct={15} customers="702" bg={panel} fg={INK} />
    </div>
    <div
      style={{
        ...abs(120 + 403, 336),
        height: 196,
        borderLeft: '2px dashed #FFFFFF',
      }}
    />
    <div style={{ ...abs(120 + 403, 506), height: 26, borderLeft: `2px solid ${INK}` }} />
    <div
      style={{
        ...abs(120 + 415, 512),
        fontFamily: MONO,
        fontSize: 20,
        lineHeight: '24px',
        color: INK,
      }}
    >
      Enterprise a year ago: 24%
    </div>
    <div
      style={{
        ...abs(120, 600, 1680),
        borderTop: `1px solid ${INK}`,
        display: 'grid',
        gridTemplateColumns: `${span(5)}px ${span(3)}px ${span(4)}px`,
        columnGap: 24,
      }}
    >
      <div style={{ paddingTop: 28 }}>
        <div style={label}>Customers above $100K ARR</div>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', gap: 32 }}>
          <div
            style={{ fontSize: 240, fontWeight: 500, lineHeight: 0.8, letterSpacing: '-0.06em' }}
          >
            96
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 500, color: ACCENT }}>
              +57% YoY
            </div>
            <div style={{ marginTop: 8, fontSize: 28, lineHeight: 1.3, color: ink2 }}>
              Up from 61
              <br />a year ago
            </div>
          </div>
        </div>
      </div>
      <div style={{ paddingTop: 28, paddingLeft: 24, borderLeft: `1px solid ${rule}` }}>
        <div style={label}>Total customers</div>
        <div
          style={{
            marginTop: 18,
            fontSize: 104,
            fontWeight: 500,
            lineHeight: 0.9,
            letterSpacing: '-0.05em',
          }}
        >
          1,412
        </div>
        <div style={{ marginTop: 20, fontSize: 28, lineHeight: 1.3, color: ink2 }}>
          +148 in the quarter
        </div>
      </div>
      <div style={{ paddingTop: 28, paddingLeft: 24, borderLeft: `1px solid ${rule}` }}>
        <div style={label}>Top-10 customer share of ARR</div>
        <div
          style={{
            marginTop: 18,
            fontSize: 104,
            fontWeight: 500,
            lineHeight: 0.9,
            letterSpacing: '-0.05em',
          }}
        >
          9.8<span style={{ fontSize: 52, marginLeft: 4 }}>%</span>
        </div>
        <div style={{ marginTop: 20, fontSize: 28, lineHeight: 1.3, color: ink2 }}>
          Down from 13.5% in Q3 FY25
        </div>
      </div>
    </div>
    <Source>
      Source: Northfold finance, unaudited. Segments by customer annual revenue: Enterprise above
      $500M, Mid-market $50–500M, Growth below $50M.
    </Source>
  </Frame>
);

const FunnelRow = ({
  name,
  note,
  value,
  len,
  accent = false,
}: {
  name: string;
  note: string;
  value: string;
  len: number;
  accent?: boolean;
}) => (
  <div style={{ height: 132 }}>
    <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
      <span style={{ ...label, color: INK }}>{name}</span>
      <span style={label}>{note}</span>
    </div>
    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ width: len, height: 64, background: accent ? ACCENT : INK }} />
      <span
        style={{
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          color: accent ? ACCENT : INK,
        }}
      >
        {value}
      </span>
    </div>
  </div>
);

const Metric = ({
  name,
  note,
  value,
  unit,
}: {
  name: string;
  note: string;
  value: string;
  unit?: string;
}) => (
  <div
    style={{
      borderTop: `1px solid ${rule}`,
      padding: '22px 0 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    }}
  >
    <div>
      <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em' }}>{name}</div>
      <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 20, color: muted }}>{note}</div>
    </div>
    <div style={{ fontSize: 72, fontWeight: 500, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
      {value}
      {unit ? <span style={{ fontSize: 30, marginLeft: 6, letterSpacing: 0 }}>{unit}</span> : null}
    </div>
  </div>
);

const Pipeline: Page = () => (
  <Frame section="02 Customers">
    <Headline num="2.3" topic="Pipeline and efficiency">
      Pipeline supports the Q4 plan.
    </Headline>
    <div style={abs(120, 316, span(8))}>
      <FunnelRow name="Pipeline created" note="Q3, new logos" value="$21.4M" len={900} />
      <FunnelRow name="Qualified" note="60% of created" value="$12.9M" len={543} />
      <FunnelRow name="Proposal" note="59% of qualified" value="$7.6M" len={320} />
      <FunnelRow
        name="Closed-won"
        note="41% of proposal · new-logo ARR"
        value="$3.1M"
        len={130}
        accent
      />
    </div>
    <div
      style={{
        ...abs(colX(5), 596, span(4)),
        borderLeft: `3px solid ${ACCENT}`,
        paddingLeft: 28,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ ...label, color: INK }}>Q4 coverage</div>
      <div
        style={{
          marginTop: 14,
          fontSize: 80,
          fontWeight: 500,
          lineHeight: 0.9,
          letterSpacing: '-0.05em',
        }}
      >
        3.3<span style={{ fontSize: 40, marginLeft: 4 }}>×</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 26, lineHeight: 1.35, color: ink2 }}>
        $11.2M of qualified pipeline closes in Q4, against a $3.4M new-logo plan.
      </div>
    </div>
    <div
      style={{
        ...abs(colX(9), 316, span(4)),
        borderLeft: `1px solid ${rule}`,
        paddingLeft: 40,
        boxSizing: 'border-box',
      }}
    >
      <Steps>
        <div style={{ ...label, paddingBottom: 18 }}>Sales efficiency, Q3</div>
        <Step>
          <Metric name="Win rate" note="Qualified opps, by count" value="27" unit="%" />
        </Step>
        <Step>
          <Metric name="Median sales cycle" note="Qualified to closed-won" value="54" unit="days" />
        </Step>
        <Step>
          <Metric name="Magic number" note="On total revenue" value="1.3" />
        </Step>
        <Step>
          <Metric name="CAC payback" note="Gross-margin adjusted" value="14" unit="mo" />
        </Step>
      </Steps>
    </div>
    <Source width={span(8)}>
      Source: Northfold CRM and finance, unaudited. Q3 FY26 new-logo opportunities, ARR $M.
    </Source>
  </Frame>
);

const TL_L = colX(5);
const TL_R = colX(8) + 118;
const dayX = (d: number) => TL_L + (d / 91) * (TL_R - TL_L);
const PLAN_MAX = 1.75;
const BAR_W = 420;

const Lane = ({
  n,
  area,
  name,
  date,
  day,
  desc,
  value,
  unit,
  pct,
  planText,
}: {
  n: string;
  area: string;
  name: string;
  date: string;
  day: number;
  desc: string;
  value: string;
  unit: string;
  pct: number;
  planText: string;
}) => {
  const mx = dayX(day) - 120;
  const end = TL_R - 120;
  return (
    <div style={{ position: 'relative', height: 190, borderTop: `1px solid ${rule}` }}>
      <div style={abs(0, 26, span(4))}>
        <div style={{ ...label, color: INK }}>
          <span style={{ color: ACCENT }}>{n}</span>
          <span style={{ marginLeft: 14 }}>{area}</span>
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
          }}
        >
          {name}
        </div>
        <div style={{ marginTop: 10, fontSize: 22, lineHeight: 1.4, color: ink2 }}>{desc}</div>
      </div>
      <svg width={end + 20} height={190} style={{ position: 'absolute', left: 0, top: 0 }}>
        <line x1={TL_L - 120} x2={end} y1={95} y2={95} stroke={rule} strokeWidth={2} />
        <rect x={mx} y={90} width={end - mx} height={10} fill={INK} />
        <rect x={mx - 9} y={86} width={18} height={18} fill={ACCENT} />
        <text x={mx} y={66} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={INK}>
          {date}
        </text>
        <text x={end} y={134} textAnchor="end" fontFamily={MONO} fontSize={20} fill={muted}>
          {91 - day} days live
        </text>
      </svg>
      <div style={abs(colX(9) - 120, 30, span(4))}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontSize: 64, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.045em' }}>
            {value}
          </span>
          <span style={{ fontSize: 24, color: ink2 }}>{unit}</span>
        </div>
        <svg width={BAR_W} height={30} style={{ display: 'block', marginTop: 16 }}>
          <rect x={0} y={10} width={BAR_W} height={10} fill={panel} />
          <rect x={0} y={10} width={(pct / PLAN_MAX) * BAR_W} height={10} fill={ACCENT} />
          <rect x={(1 / PLAN_MAX) * BAR_W - 1} y={0} width={2} height={30} fill={INK} />
        </svg>
        <div
          style={{
            marginTop: 8,
            width: BAR_W,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: MONO,
            fontSize: 20,
            color: muted,
          }}
        >
          <span>{planText}</span>
          <span style={{ color: ACCENT, fontWeight: 500 }}>{Math.round(pct * 100)}% of plan</span>
        </div>
      </div>
    </div>
  );
};

const Product: Page = () => (
  <Frame section="03 Operations">
    <Headline num="3.1" topic="Product">
      Three launches, adopted faster than planned.
    </Headline>
    <svg width={1680} height={640} style={{ position: 'absolute', left: 120, top: 296 }}>
      {[0, 31, 62, 91].map((d) => (
        <line
          key={`d${d}`}
          x1={dayX(d) - 120}
          x2={dayX(d) - 120}
          y1={36}
          y2={614}
          stroke={rule}
          strokeDasharray="2 5"
        />
      ))}
      {(
        [
          ['JUL', 0],
          ['AUG', 31],
          ['SEP', 62],
        ] as [string, number][]
      ).map(([m, d]) => (
        <text
          key={m}
          x={dayX(d) - 120 + 10}
          y={26}
          fontFamily={MONO}
          fontSize={20}
          letterSpacing="0.06em"
          fill={muted}
        >
          {m}
        </text>
      ))}
    </svg>
    <div style={{ ...abs(120, 300), ...label }}>Launch</div>
    <div style={{ ...abs(colX(9), 300), ...label }}>Adoption at 30 Sep</div>
    <div style={abs(120, 344, 1680)}>
      <Lane
        n="01"
        area="Treasury"
        name="Multi-entity treasury"
        date="12 Aug"
        day={42}
        desc="Consolidated cash and intercompany sweeps."
        value="214"
        unit="customers live"
        pct={214 / 150}
        planText="Year-end plan 150"
      />
      <Lane
        n="02"
        area="Cards"
        name="Card controls v2"
        date="2 Sep"
        day={63}
        desc="Merchant-level limits, real-time approvals."
        value="61%"
        unit="of card customers migrated"
        pct={61 / 40}
        planText="Year-end plan 40%"
      />
      <Lane
        n="03"
        area="Integrations"
        name="ERP sync, 4 new connectors"
        date="23 Sep"
        day={84}
        desc="NetSuite, Sage Intacct, Dynamics 365, Acumatica."
        value="388"
        unit="connections"
        pct={388 / 250}
        planText="Year-end plan 250"
      />
    </div>
    <Source>
      Source: Northfold product analytics, 30 Sep 2026. Plan = launch business-case targets for 31
      Dec 2026; vertical rule marks 100% of plan.
    </Source>
  </Frame>
);

const BurnBars = () => {
  const data: [string, number][] = [
    ['Q4 FY25', 5.1],
    ['Q1 FY26', 4.9],
    ['Q2 FY26', 4.6],
    ['Q3 FY26', 4.4],
  ];
  const W = span(4);
  const H = 290;
  const B = 236;
  const T = 60;
  const y = (v: number) => B - (v / 6) * (B - T);
  const slot = W / 4;
  const bw = 76;
  const bx = (i: number) => i * slot + (slot - bw) / 2;
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <line x1={0} x2={W} y1={B} y2={B} stroke={INK} />
      {data.map(([q, v], i) => (
        <g key={q}>
          <rect x={bx(i)} y={y(v)} width={bw} height={B - y(v)} fill={i === 3 ? ACCENT : INK} />
          <text
            x={bx(i) + bw / 2}
            y={y(v) - 14}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={22}
            fontWeight={500}
            fill={i === 3 ? ACCENT : INK}
          >
            {v.toFixed(1)}
          </text>
          <text
            x={bx(i) + bw / 2}
            y={B + 32}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={20}
            fill={i === 3 ? INK : muted}
          >
            {q}
          </text>
        </g>
      ))}
      <line
        x1={bx(3) - 10}
        x2={bx(3) + bw + 10}
        y1={y(4.5)}
        y2={y(4.5)}
        stroke={INK}
        strokeWidth={2}
        strokeDasharray="4 3"
      />
      <text
        x={bx(3) + bw / 2}
        y={y(4.4) - 44}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize={20}
        fill={ink2}
      >
        plan 4.5
      </text>
    </svg>
  );
};

const OpexRow = ({
  name,
  actual,
  plan,
  variance,
  favorable = false,
  total = false,
  sub = false,
}: {
  name: string;
  actual: string;
  plan: string;
  variance: string;
  favorable?: boolean;
  total?: boolean;
  sub?: boolean;
}) => {
  const cell: CSSProperties = {
    padding: '15px 0',
    textAlign: 'right',
    fontSize: 28,
    lineHeight: '32px',
    fontWeight: total ? 500 : 400,
  };
  return (
    <tr style={{ borderTop: `1px solid ${total ? INK : rule}` }}>
      <td
        style={{
          ...cell,
          textAlign: 'left',
          color: sub ? ink2 : INK,
          paddingLeft: sub ? 28 : 0,
        }}
      >
        {name}
      </td>
      <td style={cell}>{actual}</td>
      <td style={{ ...cell, color: muted }}>{plan}</td>
      <td style={{ ...cell, fontFamily: MONO, fontSize: 24, color: favorable ? ACCENT : INK }}>
        {variance}
      </td>
    </tr>
  );
};

const Runway: Page = () => (
  <Frame section="03 Operations">
    <Headline num="3.2" topic="Spend and runway">
      36+ months of runway, even on the FY27 plan.
    </Headline>
    <div style={abs(120, 300, span(4))}>
      <div style={label}>Cash and equivalents, 30 Sep</div>
      <div
        style={{
          marginTop: 18,
          fontSize: 120,
          fontWeight: 500,
          lineHeight: 0.9,
          letterSpacing: '-0.05em',
        }}
      >
        $112.6<span style={{ fontSize: 60, marginLeft: 4 }}>M</span>
      </div>
      <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.4 }}>
        76 months at Q3 net burn
        <br />
        <span style={{ color: ink2 }}>43 months at FY27 plan burn</span>
      </div>
      <div style={{ marginTop: 44, paddingTop: 22, borderTop: `1px solid ${rule}`, ...label }}>
        Net burn by quarter, $M
      </div>
      <div style={{ marginTop: 6 }}>
        <BurnBars />
      </div>
    </div>
    <table
      style={{
        ...abs(colX(6), 300, span(7)),
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
      }}
    >
      <colgroup>
        <col />
        <col style={{ width: 170 }} />
        <col style={{ width: 170 }} />
        <col style={{ width: 170 }} />
      </colgroup>
      <thead>
        <tr>
          <th style={{ ...label, textAlign: 'left', fontWeight: 400, paddingBottom: 14 }}>
            Quarter, $M
          </th>
          <th style={{ ...label, textAlign: 'right', fontWeight: 400, paddingBottom: 14 }}>
            Q3 actual
          </th>
          <th style={{ ...label, textAlign: 'right', fontWeight: 400, paddingBottom: 14 }}>Plan</th>
          <th style={{ ...label, textAlign: 'right', fontWeight: 400, paddingBottom: 14 }}>
            Vs plan
          </th>
        </tr>
      </thead>
      <tbody>
        <OpexRow
          name="Research and development"
          actual="9.8"
          plan="10.1"
          variance="−0.3"
          favorable
        />
        <OpexRow name="Sales and marketing" actual="8.1" plan="8.0" variance="+0.1" />
        <OpexRow
          name="General and administrative"
          actual="3.0"
          plan="3.1"
          variance="−0.1"
          favorable
        />
        <OpexRow
          name="Operating expenses"
          actual="20.9"
          plan="21.2"
          variance="−0.3"
          favorable
          total
        />
        <OpexRow name="Less gross profit" actual="(15.3)" plan="(15.5)" variance="+0.2" sub />
        <OpexRow name="Less interest income" actual="(1.2)" plan="(1.2)" variance="0.0" sub />
        <OpexRow name="Net burn" actual="4.4" plan="4.5" variance="−0.1" favorable total />
      </tbody>
    </table>
    <div
      style={{
        ...abs(colX(6), 830, span(7)),
        fontSize: 26,
        lineHeight: 1.4,
        color: ink2,
      }}
    >
      Opex $0.3M under plan: six R&amp;D hires moved from Q3 to Q4. Gross profit includes
      subscription and transaction revenue.
    </div>
    <Source>
      Source: Northfold finance, unaudited. Runway = cash / monthly net burn. FY27 plan burn $31.2M
      incl. +38 heads, $6M capex.
    </Source>
  </Frame>
);

const Risk = ({
  id,
  title,
  level,
  exposure,
  mitigation,
}: {
  id: string;
  title: string;
  level: string;
  exposure: string;
  mitigation: string;
}) => (
  <div
    style={{
      borderTop: `1px solid ${rule}`,
      padding: '22px 0 26px',
      display: 'grid',
      gridTemplateColumns: '94px 1fr',
    }}
  >
    <div style={{ fontFamily: MONO, fontSize: 22, lineHeight: '40px', color: ACCENT }}>{id}</div>
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          style={{ fontSize: 34, fontWeight: 500, lineHeight: '40px', letterSpacing: '-0.02em' }}
        >
          {title}
        </span>
        <span style={label}>{level}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.4, color: ink2 }}>{exposure}</div>
      <div style={{ marginTop: 6, fontSize: 24, lineHeight: 1.4 }}>
        <span style={{ ...label, color: INK, marginRight: 12 }}>Plan</span>
        {mitigation}
      </div>
    </div>
  </div>
);

const Decision = ({ n, title, detail }: { n: string; title: string; detail: string }) => (
  <div
    style={{
      borderTop: '1px solid #CFC9BC',
      padding: '22px 0 24px',
      display: 'grid',
      gridTemplateColumns: '72px 1fr',
    }}
  >
    <div
      style={{
        fontSize: 56,
        fontWeight: 500,
        lineHeight: '44px',
        letterSpacing: '-0.04em',
        color: ACCENT,
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ fontSize: 32, fontWeight: 500, lineHeight: '38px', letterSpacing: '-0.02em' }}>
        {title}
      </div>
      <div style={{ marginTop: 8, fontSize: 24, lineHeight: 1.4, color: ink2 }}>{detail}</div>
    </div>
  </div>
);

const Decisions: Page = () => (
  <Frame section="04 Governance">
    <Headline num="4.1" topic="Risks and decisions">
      Three risks in hand.
      <br />
      Three decisions for today.
    </Headline>
    <div style={abs(120, 380, span(6) - 24)}>
      <div style={{ ...label, paddingBottom: 16 }}>Risks and mitigations</div>
      <Risk
        id="R1"
        title="EU data residency deadline"
        level="High"
        exposure="In-region data required by 30 Jun 2027; 22% of Enterprise ARR."
        mitigation="Amsterdam entity and Frankfurt region, live Q2 FY27."
      />
      <Risk
        id="R2"
        title="Enterprise sales capacity"
        level="Medium"
        exposure="11 of 14 Enterprise AEs ramped; pipeline outgrowing coverage."
        mitigation="8 Enterprise AEs in FY27 hiring; partner pipeline at 18%."
      />
      <Risk
        id="R3"
        title="Card interchange compression"
        level="Medium"
        exposure="Network changes cut blended interchange ~12 bps from Q1 FY27."
        mitigation="Card is 19% of revenue; mix shifting to treasury."
      />
    </div>
    <div
      style={{
        ...abs(colX(7), 380, span(6)),
        height: 525,
        background: panel,
        padding: '36px 44px',
        boxSizing: 'border-box',
      }}
    >
      <Steps>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 18 }}>
          <span style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em' }}>
            Decisions requested
          </span>
          <span style={{ ...label, color: INK, lineHeight: '40px' }}>For approval</span>
        </div>
        <Step>
          <Decision
            n="1"
            title="Approve FY27 hiring plan, +38 heads"
            detail="22 R&D, 12 go-to-market, 4 G&A. $7.6M annualized opex."
          />
        </Step>
        <Step>
          <Decision
            n="2"
            title="Approve Amsterdam entity"
            detail="Northfold B.V. to contract and hold EU customer data (R1)."
          />
        </Step>
        <Step>
          <Decision
            n="3"
            title="Approve $6M FY27 capex"
            detail="Second hosting region in Frankfurt, live Q2 FY27 (R1)."
          />
        </Step>
      </Steps>
    </div>
    <Source>
      Risk owners: R1 CTO, R2 CRO, R3 CFO. Reviewed by the audit committee, 2 Oct 2026.
    </Source>
  </Frame>
);

const Priority = ({ n, title, detail }: { n: string; title: string; detail: string }) => (
  <div
    style={{
      borderTop: `1px solid ${rule}`,
      padding: '24px 0 28px',
      display: 'grid',
      gridTemplateColumns: '94px 1fr',
    }}
  >
    <div style={{ fontFamily: MONO, fontSize: 22, lineHeight: '42px', color: ACCENT }}>{n}</div>
    <div>
      <div style={{ fontSize: 36, fontWeight: 500, lineHeight: '42px', letterSpacing: '-0.025em' }}>
        {title}
      </div>
      <div style={{ marginTop: 8, fontSize: 26, lineHeight: 1.4, color: ink2 }}>{detail}</div>
    </div>
  </div>
);

const Target = ({ name, value, note }: { name: string; value: string; note: string }) => (
  <div
    style={{
      borderTop: `1px solid ${rule}`,
      padding: '30px 0 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    }}
  >
    <div>
      <div style={{ ...label, color: INK }}>{name}</div>
      <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 20, color: muted }}>{note}</div>
    </div>
    <div style={{ fontSize: 80, fontWeight: 500, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
      {value}
    </div>
  </div>
);

const Close: Page = () => (
  <Frame section="04 Governance">
    <Headline num="4.2" topic="Q4 priorities">
      Close FY26 ahead of plan,
      <br />
      with the EU region funded.
    </Headline>
    <div style={abs(120, 380, span(7))}>
      <div style={{ ...label, paddingBottom: 16 }}>Priorities</div>
      <Priority
        n="01"
        title="Convert Q4 pipeline at plan win rates"
        detail="$11.2M qualified and closing in Q4; 3.3× the $3.4M new-logo plan."
      />
      <Priority
        n="02"
        title="Finish the Card controls v2 migration"
        detail="From 61% to every card customer by 15 December."
      />
      <Priority
        n="03"
        title="Start the EU region build"
        detail="Form Northfold B.V. and begin Frankfurt, subject to today's approvals."
      />
    </div>
    <div style={abs(colX(9), 380, span(4))}>
      <div style={{ ...label, paddingBottom: 16 }}>Q4 exit targets</div>
      <Target name="ARR" value="$53.5M" note="+11.0% QoQ" />
      <Target name="Net revenue retention" value="≥125%" note="Trailing twelve months" />
      <Target name="Net burn" value="≤$4.6M" note="Quarter" />
    </div>
    <div style={{ ...abs(120, 902), display: 'flex', alignItems: 'center', gap: 40 }}>
      <Wordmark size={34} />
      <span style={{ ...chrome }}>Next board meeting · 13 January 2027</span>
    </div>
  </Frame>
);

export const meta: SlideMeta = {
  title: 'Northfold — Board update, Q3 FY2026',
  createdAt: '2026-10-11T10:47:04.444Z',
};

export const notes: (string | undefined)[] = [
  `CEO opens. Thank the board, confirm the 75-minute slot: 30 minutes on numbers, 20 on customers and product, the rest on the three approvals.
One line to set the tone: we finished the quarter ahead of plan on growth and on plan on cash.`,
  `CFO. Four numbers, one minute.
ARR closed at $48.2M, $1.7M over plan, up 11.6% on the quarter and 62% on the year. NRR is 128% against a 122% plan. Gross margin 81.4%, up almost two points.
Burn multiple 0.88: we spent $4.4M to add $5.0M of net new ARR.`,
  `CFO. Ten straight quarters of growth, from $13.0M to $48.2M: 3.7 times in 27 months.
Point at the dashed line: we have been at or above the FY26 plan every quarter this year, and the gap widened in Q3.
Q3 net new ARR of $5.0M is our best quarter yet.`,
  `CFO. Where the $5.0M came from.
New logos $3.1M, expansion $2.9M; expansion is now 94% of new-logo ARR. Contraction $0.4M and churn $0.6M, so gross churn is 1.4% of opening ARR.
Note the axis starts at $40M so the small bars stay readable.`,
  `CEO. Transition to customers. Three pages: how cohorts retain, who we sell to, and whether the pipeline covers Q4. About eight minutes.`,
  `CEO. Read the heatmap by column. Month 12 is framed: every cohort that has reached it sits at 122% or better.
The FY25 cohorts are compounding faster than FY24 did at the same age; Q3 FY25 is at 131%.
Q4 FY25 reaches month 12 next quarter and is tracking 124% at month 9.`,
  `CEO. Mix is moving up-market without concentrating.
Enterprise is 31% of ARR, up from 24% a year ago. 96 customers above $100K, up from 61. Top-10 share fell from 13.5% to 9.8%.
1,412 customers in total, 148 added in the quarter.`,
  `CRO. Walk the funnel top to bottom: $21.4M created, $12.9M qualified, $7.6M at proposal, $3.1M closed.
Then the coverage callout: $11.2M of qualified pipeline closes in Q4, 3.3 times the $3.4M new-logo plan.
Advance four times to bring in win rate, sales cycle, magic number and CAC payback, one beat each.`,
  `CPO. Three launches in the quarter, all already past their year-end adoption targets.
Multi-entity treasury: 214 customers live against 150. Card controls v2: 61% migrated in four weeks against 40%. ERP connectors: 388 connections against 250 in one week live.`,
  `CFO. Cash is $112.6M. At Q3 burn of $4.4M that is 76 months; on the FY27 plan, including today's asks, it is 43 months.
Opex came in $0.3M under plan because six R&D hires slipped to Q4. Net burn $4.4M against $4.5M plan, down for the fourth straight quarter.`,
  `CEO. Risks first, then the asks. EU data residency is the one to watch: 22% of Enterprise ARR needs in-region data by June 2027.
Advance three times for the decisions. Hiring plan of 38 heads, the Amsterdam entity, and $6M capex for Frankfurt. Decisions 2 and 3 close risk R1.
Pause for questions and take the votes in order.`,
  `CEO closes. Q4 exit targets: ARR $53.5M, NRR at or above 125%, net burn at or below $4.6M.
Three priorities: convert the covered pipeline, finish the card migration, start the EU build once approved.
Next meeting 13 January.`,
];

export default [
  Cover,
  Glance,
  Trajectory,
  Bridge,
  Divider,
  Cohorts,
  Mix,
  Pipeline,
  Product,
  Runway,
  Decisions,
  Close,
] satisfies Page[];

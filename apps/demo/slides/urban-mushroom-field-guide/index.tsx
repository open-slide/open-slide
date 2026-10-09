import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#ecdfc0', text: '#3a2a1a', accent: '#9a4524' },
  fonts: {
    display: '"IM Fell English", "EB Garamond", Georgia, serif',
    body: '"EB Garamond", Georgia, "Times New Roman", serif',
  },
  typeScale: { hero: 176, body: 34 },
  radius: 2,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap';
const FONT_LINK_ID = 'osd-webfont-urban-mushroom-field-guide';
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

const smallCaps = '"IM Fell English SC", "EB Garamond", Georgia, serif';
const board = '#271e16';
const faded = '#6e5a43';
const rule = '#a88b62';
const moss = '#5f6e3a';
const ochre = '#c08a38';
const rust = '#9a4524';
const blood = '#8c2a1c';

const svgUri = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

const deckleMask = svgUri(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' viewBox='0 0 1920 1080' preserveAspectRatio='none'><filter id='d' x='-5%' y='-5%' width='110%' height='110%'><feTurbulence type='fractalNoise' baseFrequency='0.06' numOctaves='4' seed='11'/><feDisplacementMap in='SourceGraphic' scale='16'/></filter><rect x='30' y='26' width='1860' height='1028' fill='white' filter='url(#d)'/></svg>`,
);

const grain = svgUri(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0 0.1  0 0 0 0.9 0'/></filter><rect width='320' height='320' filter='url(#n)' opacity='0.55'/></svg>`,
);

const mottle = svgUri(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080' preserveAspectRatio='none'><filter id='m'><feTurbulence type='fractalNoise' baseFrequency='0.004 0.007' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.38  0 0 0 0 0.16  0 0 0 1.1 -0.35'/></filter><rect width='1920' height='1080' filter='url(#m)'/></svg>`,
);

const stampInk = svgUri(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.5 1.45'/></filter><rect width='200' height='200' filter='url(#s)'/></svg>`,
);

const foxing = [
  'radial-gradient(circle at 9% 14%, rgba(150,92,38,0.22) 0, rgba(150,92,38,0.1) 16px, transparent 34px)',
  'radial-gradient(circle at 87% 9%, rgba(150,92,38,0.16) 0, rgba(150,92,38,0.08) 10px, transparent 22px)',
  'radial-gradient(circle at 93% 78%, rgba(140,84,34,0.2) 0, rgba(140,84,34,0.08) 22px, transparent 46px)',
  'radial-gradient(circle at 6% 88%, rgba(140,84,34,0.14) 0, transparent 28px)',
  'radial-gradient(circle at 41% 95%, rgba(150,92,38,0.12) 0, transparent 18px)',
  'radial-gradient(circle at 63% 6%, rgba(150,92,38,0.12) 0, transparent 14px)',
  'radial-gradient(circle at 72% 91%, rgba(150,92,38,0.1) 0, transparent 9px)',
  'radial-gradient(circle at 23% 4%, rgba(150,92,38,0.1) 0, transparent 8px)',
  'radial-gradient(ellipse 70% 62% at 50% 48%, transparent 58%, rgba(122,76,30,0.24) 100%)',
].join(', ');

const masked: CSSProperties = {
  position: 'absolute',
  inset: 0,
  maskImage: deckleMask,
  WebkitMaskImage: deckleMask,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
};

const toRoman = (n: number) => {
  const map: [number, string][] = [
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  let out = '';
  let rest = n;
  for (const [v, s] of map) {
    while (rest >= v) {
      out += s;
      rest -= v;
    }
  }
  return out;
};

const Folio = () => {
  const { current } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 74,
        textAlign: 'center',
        fontFamily: 'var(--osd-font-display)',
        fontStyle: 'italic',
        fontSize: 26,
        color: faded,
      }}
    >
      ~ {toRoman(current)} ~
    </div>
  );
};

const RunningHead = ({ right }: { right: string }) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      right: 120,
      top: 84,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      fontFamily: smallCaps,
      fontSize: 24,
      letterSpacing: '0.12em',
      color: faded,
      borderBottom: `1px solid ${rule}`,
      paddingBottom: 8,
    }}
  >
    <span>Fungi of the City</span>
    <span>{right}</span>
  </div>
);

const Sheet = ({
  children,
  head,
  folio = true,
}: {
  children: ReactNode;
  head?: string;
  folio?: boolean;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: `radial-gradient(ellipse at 50% 40%, #3a2d21 0%, ${board} 70%)`,
      fontFamily: 'var(--osd-font-body)',
      color: 'var(--osd-text)',
    }}
  >
    <div style={{ ...masked, background: `${foxing}, var(--osd-bg)` }} />
    <div style={{ ...masked, backgroundImage: mottle, opacity: 0.55, mixBlendMode: 'multiply' }} />
    <div style={{ ...masked, backgroundImage: grain, opacity: 0.5, mixBlendMode: 'multiply' }} />
    <div
      style={{
        position: 'absolute',
        inset: 56,
        border: `1px solid ${rule}`,
        outline: `3px solid ${rule}`,
        outlineOffset: -10,
        opacity: 0.75,
      }}
    />
    {head ? <RunningHead right={head} /> : null}
    {folio ? <Folio /> : null}
    <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
  </div>
);

type Pt = [number, number];
const r1 = (n: number) => Math.round(n * 10) / 10;
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * c[0] + t * t * b[0],
  (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * c[1] + t * t * b[1],
];
const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return [
    u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
  ];
};

const ink = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const smooth = (pts: Pt[]) => {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
};

type AgaricProps = {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  capW: number;
  capH: number;
  stemH: number;
  stemW: number;
  cap: string;
  gill: string;
  stem: string;
  ring?: 'skirt' | 'thin';
  volva?: boolean;
  fibrils?: boolean;
  gills?: number;
  weight?: number;
};

const Agaric = ({
  x,
  y,
  s = 1,
  rot = 0,
  capW,
  capH,
  stemH,
  stemW,
  cap,
  gill,
  stem,
  ring,
  volva,
  fibrils,
  gills = 26,
  weight = 2,
}: AgaricProps) => {
  const w = capW / 2;
  const h = capH;
  const m = -stemH;
  const sw = stemW;
  const back: Pt = [0, m - h * 0.12];
  const front: Pt = [0, m + h * 0.26];
  const hub: Pt = [0, m + h * 0.07];
  const right: [Pt, Pt, Pt, Pt] = [
    [0, m - h],
    [w * 0.62, m - h],
    [w * 0.98, m - h * 0.55],
    [w, m],
  ];
  const capTop = `M${-w} ${m} C${r1(-w * 0.98)} ${r1(m - h * 0.55)} ${r1(-w * 0.62)} ${m - h} 0 ${m - h} C${r1(w * 0.62)} ${m - h} ${r1(w * 0.98)} ${r1(m - h * 0.55)} ${w} ${m}`;
  const capShape = `${capTop} Q0 ${r1(back[1])} ${-w} ${m} Z`;
  const lens = `M${-w} ${m} Q0 ${r1(back[1])} ${w} ${m} Q0 ${r1(front[1])} ${-w} ${m} Z`;
  const gillLines: string[] = [];
  for (let i = 1; i < gills; i++) {
    const t = i / gills;
    const pf = quad([w, m], front, [-w, m], t);
    const pb = quad([-w, m], back, [w, m], t);
    const short = i % 2 === 1 ? 0.45 : 0;
    gillLines.push(
      `M${r1(hub[0] + (pf[0] - hub[0]) * short)} ${r1(hub[1] + (pf[1] - hub[1]) * short)} L${r1(pf[0])} ${r1(pf[1])}`,
      `M${r1(hub[0] + (pb[0] - hub[0]) * 0.3)} ${r1(hub[1] + (pb[1] - hub[1]) * 0.3)} L${r1(pb[0])} ${r1(pb[1])}`,
    );
  }
  const hatch: string[] = [];
  for (const t of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88, 0.95]) {
    const p = cubic(right[0], right[1], right[2], right[3], t);
    const drop = (m - p[1]) * 0.22;
    hatch.push(
      `M${r1(p[0] * 0.98)} ${r1(p[1] + 2)} Q${r1(p[0] * 0.78)} ${r1(p[1] + drop + h * 0.05)} ${r1(p[0] * 0.58)} ${r1(p[1] + drop + h * 0.03)}`,
    );
  }
  const streaks: string[] = [];
  if (fibrils) {
    for (let i = 1; i < 14; i++) {
      const t = i / 14;
      const px = -w + 2 * w * t;
      streaks.push(
        `M${r1(px * 0.12)} ${r1(m - h * 0.94)} Q${r1(px * 0.86)} ${r1(m - h * 0.62)} ${r1(px * 0.97)} ${r1(m - 4)}`,
      );
    }
  }
  const stemTop = hub[1];
  const stemPath = `M${-sw / 2} ${r1(stemTop)} C${r1(-sw * 0.5)} ${r1(m * 0.5)} ${r1(-sw * 0.58)} ${r1(m * 0.2)} ${r1(-sw * 0.62)} 0 L${r1(sw * 0.62)} 0 C${r1(sw * 0.58)} ${r1(m * 0.2)} ${r1(sw * 0.5)} ${r1(m * 0.5)} ${sw / 2} ${r1(stemTop)} Z`;
  const stemHatch: string[] = [];
  for (const f of [0.18, 0.28, 0.38]) {
    stemHatch.push(
      `M${r1(sw * f)} ${r1(stemTop + h * 0.25)} L${r1(sw * (f + 0.08))} ${r1(-sw * 0.2)}`,
    );
  }
  const ry = m + stemH * 0.2;
  const hem: string[] = [];
  const scallops = 6;
  for (let i = 0; i < scallops; i++) {
    const x0 = sw * 1.02 - (2.04 * sw * i) / scallops;
    const x1 = sw * 1.02 - (2.04 * sw * (i + 1)) / scallops;
    hem.push(`Q${r1((x0 + x1) / 2)} ${r1(ry + 62)} ${r1(x1)} ${r1(ry + 48)}`);
  }
  const skirt = `M${r1(-sw * 0.5)} ${r1(ry)} C${r1(-sw * 0.62)} ${r1(ry + 14)} ${r1(-sw * 0.9)} ${r1(ry + 30)} ${r1(-sw * 1.02)} ${r1(ry + 48)} M${r1(sw * 0.5)} ${r1(ry)} C${r1(sw * 0.62)} ${r1(ry + 14)} ${r1(sw * 0.9)} ${r1(ry + 30)} ${r1(sw * 1.02)} ${r1(ry + 48)} ${hem.join(' ')}`;
  const skirtFill = `M${r1(-sw * 0.5)} ${r1(ry)} L${r1(sw * 0.5)} ${r1(ry)} C${r1(sw * 0.62)} ${r1(ry + 14)} ${r1(sw * 0.9)} ${r1(ry + 30)} ${r1(sw * 1.02)} ${r1(ry + 48)} ${hem.join(' ')} C${r1(-sw * 0.9)} ${r1(ry + 30)} ${r1(-sw * 0.62)} ${r1(ry + 14)} ${r1(-sw * 0.5)} ${r1(ry)} Z`;
  const thin = `M${r1(-sw * 0.52)} ${r1(ry)} Q${r1(-sw * 0.66)} ${r1(ry + 8)} ${r1(-sw * 0.6)} ${r1(ry + 16)} Q0 ${r1(ry + 24)} ${r1(sw * 0.6)} ${r1(ry + 16)} Q${r1(sw * 0.66)} ${r1(ry + 8)} ${r1(sw * 0.52)} ${r1(ry)}`;
  const sack = `M${r1(-sw * 0.62)} ${r1(-sw * 1.25)} C${r1(-sw * 0.95)} ${r1(-sw * 1.0)} ${r1(-sw * 1.12)} ${r1(-sw * 0.6)} ${r1(-sw * 1.0)} ${r1(-sw * 0.2)} Q${r1(-sw * 0.92)} 2 0 4 Q${r1(sw * 0.92)} 2 ${r1(sw * 1.0)} ${r1(-sw * 0.2)} C${r1(sw * 1.12)} ${r1(-sw * 0.6)} ${r1(sw * 0.98)} ${r1(-sw * 1.05)} ${r1(sw * 0.66)} ${r1(-sw * 1.32)} C${r1(sw * 0.7)} ${r1(-sw * 0.95)} ${r1(sw * 0.62)} ${r1(-sw * 0.72)} ${r1(sw * 0.5)} ${r1(-sw * 0.6)} Q0 ${r1(-sw * 0.38)} ${r1(-sw * 0.5)} ${r1(-sw * 0.6)} C${r1(-sw * 0.6)} ${r1(-sw * 0.72)} ${r1(-sw * 0.66)} ${r1(-sw * 0.95)} ${r1(-sw * 0.62)} ${r1(-sw * 1.25)} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} strokeWidth={weight / s}>
      <path d={lens} fill={gill} opacity={0.75} stroke="none" />
      <path d={gillLines.join(' ')} {...ink} opacity={0.62} strokeWidth={(weight * 0.45) / s} />
      <path d={lens} {...ink} strokeWidth={(weight * 0.7) / s} />
      {volva ? (
        <ellipse
          cx={0}
          cy={r1(-sw * 0.42)}
          rx={r1(sw * 0.86)}
          ry={r1(sw * 0.56)}
          fill={stem}
          stroke="currentColor"
        />
      ) : null}
      <path d={stemPath} fill={stem} opacity={0.75} stroke="none" />
      <path d={stemHatch.join(' ')} {...ink} opacity={0.45} strokeWidth={(weight * 0.5) / s} />
      <path d={stemPath} {...ink} />
      {volva ? (
        <>
          <path d={sack} fill="#efe7d3" opacity={0.9} stroke="none" />
          <path d={sack} {...ink} />
          <path
            d={`M${r1(-sw * 0.7)} ${r1(-sw * 0.5)} q${r1(sw * 0.2)} ${r1(sw * 0.3)} ${r1(sw * 0.5)} ${r1(sw * 0.4)} M${r1(sw * 0.75)} ${r1(-sw * 0.55)} q${r1(-sw * 0.15)} ${r1(sw * 0.3)} ${r1(-sw * 0.45)} ${r1(sw * 0.42)}`}
            {...ink}
            opacity={0.5}
            strokeWidth={(weight * 0.5) / s}
          />
        </>
      ) : null}
      {ring === 'skirt' ? (
        <>
          <path d={skirtFill} fill="#f3ecda" opacity={0.92} stroke="none" />
          <path d={skirt} {...ink} />
          <path
            d={`M${r1(-sw * 0.6)} ${r1(ry + 20)} l${r1(-sw * 0.16)} 22 M${r1(-sw * 0.25)} ${r1(ry + 18)} l-3 30 M${r1(sw * 0.1)} ${r1(ry + 18)} l1 32 M${r1(sw * 0.45)} ${r1(ry + 18)} l${r1(sw * 0.1)} 28 M${r1(sw * 0.75)} ${r1(ry + 24)} l${r1(sw * 0.12)} 18`}
            {...ink}
            opacity={0.45}
            strokeWidth={(weight * 0.5) / s}
          />
        </>
      ) : null}
      {ring === 'thin' ? (
        <>
          <path d={thin} fill="#f3ecda" opacity={0.9} stroke="none" />
          <path d={thin} {...ink} />
        </>
      ) : null}
      <path d={capShape} fill={cap} opacity={0.62} stroke="none" />
      <path d={capShape} fill={cap} opacity={0.26} stroke="none" transform="translate(7 -6)" />
      {fibrils ? (
        <path d={streaks.join(' ')} {...ink} opacity={0.3} strokeWidth={(weight * 0.45) / s} />
      ) : null}
      <path d={hatch.join(' ')} {...ink} opacity={0.42} strokeWidth={(weight * 0.5) / s} />
      <path d={capShape} {...ink} />
    </g>
  );
};

const InkCap = ({
  x,
  y,
  s = 1,
  capW,
  capH,
  stemH,
  old,
}: {
  x: number;
  y: number;
  s?: number;
  capW: number;
  capH: number;
  stemH: number;
  old?: boolean;
}) => {
  const w = capW / 2;
  const mw = old ? w * 1.14 : w;
  const m = -stemH;
  const top = m - capH;
  const outline = `M${r1(-mw)} ${m} C${r1(-w * 1.06)} ${r1(m - capH * 0.6)} ${r1(-w * 0.8)} ${top} 0 ${top} C${r1(w * 0.8)} ${top} ${r1(w * 1.06)} ${r1(m - capH * 0.6)} ${r1(mw)} ${m} Q0 ${m + 10} ${r1(-mw)} ${m} Z`;
  const scales: string[] = [];
  const rows = Math.floor((capH * 0.8) / 24);
  for (let r = 0; r < rows; r++) {
    const f = (r + 0.5) / rows;
    const yy = top + capH * 0.12 + f * capH * (old ? 0.55 : 0.8);
    const half = w * (0.5 + 0.42 * Math.sqrt(f));
    const step = 21;
    const offset = r % 2 === 0 ? 0 : step / 2;
    for (let xx = -half + offset; xx < half - 8; xx += step) {
      scales.push(`M${r1(xx)} ${r1(yy)} c2 7 7 11 13 7`);
    }
  }
  let drip = '';
  let wash = '';
  if (old) {
    const band = m - capH * 0.3;
    const waves: string[] = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const x0 = -w * 1.04 + (2.08 * w * i) / n;
      const x1 = -w * 1.04 + (2.08 * w * (i + 1)) / n;
      waves.push(
        `Q${r1((x0 + x1) / 2)} ${r1(band + (i % 2 === 0 ? -12 : 10))} ${r1(x1)} ${r1(band)}`,
      );
    }
    drip = `M${r1(-w * 1.04)} ${r1(band)} ${waves.join(' ')} L${r1(mw)} ${m}`;
    const k = 10;
    for (let i = 0; i <= k; i++) {
      const xx = mw - (2 * mw * i) / k;
      const len = i % 3 === 1 ? 52 : i % 2 === 0 ? 20 : 34;
      drip += ` L${r1(xx + 4)} ${m + 3} Q${r1(xx)} ${m + len} ${r1(xx - 4)} ${m + 3}`;
    }
    drip += ` L${r1(-mw)} ${m} Z`;
    wash = `M${r1(-w * 1.03)} ${r1(band + 2)} Q0 ${r1(band - 60)} ${r1(w * 1.03)} ${r1(band + 2)} Z`;
  }
  const sw = capW * 0.22;
  const stemPath = `M${r1(-sw / 2)} ${m + 4} L${r1(-sw * 0.62)} 0 L${r1(sw * 0.62)} 0 L${r1(sw / 2)} ${m + 4} Z`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeWidth={2 / s}>
      <path d={stemPath} fill="#efe6d2" opacity={0.85} stroke="none" />
      <path
        d={`M${r1(sw * 0.2)} ${m + 20} L${r1(sw * 0.28)} -8`}
        {...ink}
        opacity={0.4}
        strokeWidth={1.2 / s}
      />
      <path d={stemPath} {...ink} />
      <ellipse
        cx={0}
        cy={r1(-stemH * 0.32)}
        rx={r1(sw * 0.75)}
        ry={6}
        fill="#e6dcc6"
        stroke="currentColor"
      />
      <path d={outline} fill="#f4eddd" opacity={0.9} stroke="none" />
      <path d={outline} fill={rule} opacity={0.2} stroke="none" transform="translate(6 -5)" />
      <path
        d={scales.join(' ')}
        fill="none"
        stroke="#7d6249"
        strokeWidth={1.5 / s}
        opacity={0.85}
        strokeLinecap="round"
      />
      <path
        d={`M${r1(-w * 0.38)} ${top + 7} Q0 ${top - 5} ${r1(w * 0.38)} ${top + 7}`}
        fill={ochre}
        opacity={0.6}
        stroke="none"
      />
      {old ? (
        <>
          <path d={wash} fill="#3a2f27" opacity={0.28} stroke="none" />
          <path d={drip} fill="#1d1712" opacity={0.92} stroke="none" />
        </>
      ) : null}
      <path d={outline} {...ink} />
    </g>
  );
};

type FanFace = 'top' | 'gills' | 'chicken';

const Fan = ({
  x,
  y,
  R,
  a0,
  a1,
  sy,
  rot = 0,
  lobes = 3,
  face,
  tint,
}: {
  x: number;
  y: number;
  R: number;
  a0: number;
  a1: number;
  sy: number;
  rot?: number;
  lobes?: number;
  face: FanFace;
  tint: string;
}) => {
  const n = 36;
  const A = R * 0.08;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
    const r =
      R *
      (0.95 + 0.045 * Math.cos(lobes * t * Math.PI * 2 + 0.6)) *
      Math.sin(Math.PI * (0.03 + 0.94 * t)) ** 0.75;
    pts.push([Math.cos(a) * r, Math.sin(a) * r * sy]);
  }
  const ring: Pt[] = [[0, -A], ...pts, [0, A]];
  const outline = `M0 ${r1(-A)}${smooth(ring)} Z`;
  const margin = `M${r1(pts[2][0])} ${r1(pts[2][1])}${smooth(pts.slice(2, n - 1))}`;
  const rays: string[] = [];
  const count = face === 'gills' ? 56 : 18;
  for (let i = 1; i < count; i++) {
    const p = pts[Math.round((i / count) * n)];
    const start = face === 'gills' ? (i % 2 === 1 ? 0.5 : 0.1) : 0.25;
    rays.push(`M${r1(p[0] * start)} ${r1(p[1] * start)} L${r1(p[0] * 0.97)} ${r1(p[1] * 0.97)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} strokeWidth={2}>
      {face === 'chicken' ? (
        <>
          <path d={outline} fill="#e9bf45" transform="translate(0 18)" stroke="none" />
          <path d={outline} {...ink} transform="translate(0 18)" opacity={0.7} />
        </>
      ) : null}
      <path
        d={outline}
        fill={face === 'gills' ? '#efe5cd' : tint}
        opacity={face === 'gills' ? 0.95 : 0.78}
        stroke="none"
      />
      {face !== 'gills' ? (
        <path d={outline} fill={tint} opacity={0.3} stroke="none" transform="translate(6 -5)" />
      ) : null}
      {face === 'chicken' ? (
        <>
          <path d={margin} fill="none" stroke="#f2c94c" strokeWidth={16} opacity={0.75} />
          <path
            d={outline}
            fill="none"
            stroke="#f0c445"
            strokeWidth={5}
            opacity={0.6}
            transform="scale(0.74)"
          />
          <path
            d={outline}
            fill="none"
            stroke="#e08a35"
            strokeWidth={4}
            opacity={0.5}
            transform="scale(0.5)"
          />
          <path d={outline} {...ink} opacity={0.3} transform="scale(0.74)" />
        </>
      ) : null}
      <path
        d={rays.join(' ')}
        {...ink}
        opacity={face === 'gills' ? 0.58 : 0.22}
        strokeWidth={face === 'gills' ? 1.1 : 1.4}
      />
      {face === 'gills' ? (
        <path d={margin} fill="none" stroke={tint} strokeWidth={9} opacity={0.75} />
      ) : null}
      {face === 'top' ? <path d={outline} {...ink} opacity={0.25} transform="scale(0.82)" /> : null}
      <path d={outline} {...ink} />
    </g>
  );
};

const Trunk = ({ x, top, bottom, w }: { x: number; top: number; bottom: number; w: number }) => (
  <g>
    <path
      d={`M${x} ${top} C${x - 6} ${top + (bottom - top) * 0.4} ${x + 4} ${top + (bottom - top) * 0.7} ${x - 14} ${bottom} L${x + w + 14} ${bottom} C${x + w - 4} ${top + (bottom - top) * 0.7} ${x + w + 6} ${top + (bottom - top) * 0.4} ${x + w} ${top}`}
      fill="#8a6a4a"
      opacity={0.35}
      stroke="none"
    />
    <path
      d={`M${x} ${top} C${x - 6} ${top + (bottom - top) * 0.4} ${x + 4} ${top + (bottom - top) * 0.7} ${x - 14} ${bottom} M${x + w} ${top} C${x + w + 6} ${top + (bottom - top) * 0.4} ${x + w - 4} ${top + (bottom - top) * 0.7} ${x + w + 14} ${bottom}`}
      {...ink}
      strokeWidth={2.2}
    />
    <path
      d={`M${x + w * 0.62} ${top + 4} C${x + w * 0.66} ${top + (bottom - top) * 0.4} ${x + w * 0.6} ${top + (bottom - top) * 0.7} ${x + w * 0.66} ${bottom} L${x + w + 14} ${bottom} C${x + w - 4} ${top + (bottom - top) * 0.7} ${x + w + 6} ${top + (bottom - top) * 0.4} ${x + w} ${top} Z`}
      fill="#5e4630"
      opacity={0.22}
      stroke="none"
    />
    <path
      d={`M${x + w * 0.12} ${top + 10} q-8 120 4 240 t-4 260 M${x + w * 0.3} ${top + 60} q6 90 -2 180 M${x + w * 0.45} ${top + 40} q8 140 -4 260 t6 220 M${x + w * 0.58} ${top + 200} q-4 100 4 200 M${x + w * 0.7} ${top + 20} q-6 160 6 280 t-6 200 M${x + w * 0.8} ${top + 120} q6 80 -2 160 M${x + w * 0.88} ${top + 80} q6 120 -2 220 t4 200 M${x + w * 0.94} ${top + 30} q-4 60 2 120`}
      {...ink}
      strokeWidth={1.2}
      opacity={0.55}
    />
    <path
      d={`M${x + w * 0.2} ${top + 140} q12 -4 22 2 M${x + w * 0.5} ${top + 330} q14 -6 26 0 M${x + w * 0.3} ${top + 470} q10 -3 20 2 M${x + w * 0.74} ${top + 410} q12 -4 22 2`}
      {...ink}
      strokeWidth={1.4}
      opacity={0.6}
    />
    <ellipse
      cx={x + w * 0.36}
      cy={top + 260}
      rx={9}
      ry={16}
      {...ink}
      strokeWidth={1.6}
      opacity={0.7}
    />
    <ellipse cx={x + w * 0.36} cy={top + 260} rx={4} ry={8} fill="#5e4630" opacity={0.4} />
    <path
      d={`M${x - 4} ${top} Q${x + w / 2} ${top - 18} ${x + w + 4} ${top}`}
      {...ink}
      strokeWidth={1.6}
    />
  </g>
);

const Ground = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => {
  const tufts: string[] = [];
  for (let xx = x1 + 20; xx < x2 - 10; xx += 46) {
    tufts.push(
      `M${xx} ${y} q-3 -14 -8 -20 M${xx + 4} ${y} q1 -16 4 -24 M${xx + 8} ${y} q4 -10 10 -14`,
    );
  }
  return (
    <g>
      <path d={`M${x1} ${y} Q${(x1 + x2) / 2} ${y - 6} ${x2} ${y}`} {...ink} strokeWidth={2} />
      <path d={tufts.join(' ')} {...ink} strokeWidth={1.2} opacity={0.6} />
      <path
        d={`M${x1 + 30} ${y + 14} h40 M${x1 + 120} ${y + 20} h60 M${x2 - 160} ${y + 12} h50 M${(x1 + x2) / 2 - 40} ${y + 16} h70`}
        {...ink}
        strokeWidth={1}
        opacity={0.4}
      />
    </g>
  );
};

const Log = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
  const rx = h * 0.28;
  return (
    <g>
      <path
        d={`M${x} ${y} L${x + w} ${y + 6} Q${x + w + rx} ${y + h / 2} ${x + w} ${y + h} L${x} ${y + h} Z`}
        fill="#7d5d40"
        opacity={0.35}
        stroke="none"
      />
      <path
        d={`M${x} ${y} L${x + w} ${y + 6} Q${x + w + rx} ${y + h / 2} ${x + w} ${y + h} L${x} ${y + h}`}
        {...ink}
        strokeWidth={2}
      />
      <path
        d={`M${x + 40} ${y + h * 0.3} q${w * 0.3} -8 ${w * 0.6} 4 M${x + 20} ${y + h * 0.55} q${w * 0.4} 10 ${w * 0.8} -2 M${x + 60} ${y + h * 0.8} q${w * 0.3} -6 ${w * 0.7} 2`}
        {...ink}
        strokeWidth={1.2}
        opacity={0.55}
      />
      <ellipse
        cx={x}
        cy={y + h / 2}
        rx={rx}
        ry={h / 2}
        fill="#d9c08e"
        stroke="currentColor"
        strokeWidth={2}
      />
      <ellipse
        cx={x}
        cy={y + h / 2}
        rx={rx * 0.66}
        ry={h * 0.33}
        {...ink}
        strokeWidth={1}
        opacity={0.6}
      />
      <ellipse
        cx={x}
        cy={y + h / 2}
        rx={rx * 0.33}
        ry={h * 0.16}
        {...ink}
        strokeWidth={1}
        opacity={0.6}
      />
    </g>
  );
};

const ScaleBar = ({ label = '5 cm', width = 250 }: { label?: string; width?: number }) => {
  const seg = width / 5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: faded }}>
      <svg width={width + 4} height={18} style={{ color: 'var(--osd-text)' }}>
        <rect x={2} y={4} width={width} height={10} {...ink} strokeWidth={1.5} />
        <rect x={2} y={4} width={seg} height={10} fill="currentColor" />
        <rect x={2 + seg * 2} y={4} width={seg} height={10} fill="currentColor" />
        <rect x={2 + seg * 4} y={4} width={seg} height={10} fill="currentColor" />
      </svg>
      <span
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          fontSize: 24,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
};

const Stamp = ({
  text,
  sub,
  color,
  rotate,
  style,
}: {
  text: string;
  sub?: string;
  color: string;
  rotate: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      position: 'absolute',
      transform: `rotate(${rotate}deg)`,
      border: `4px double ${color}`,
      outline: `2px solid ${color}`,
      outlineOffset: 5,
      padding: '10px 26px 8px',
      color,
      textAlign: 'center',
      fontFamily: smallCaps,
      letterSpacing: '0.16em',
      opacity: 0.92,
      mixBlendMode: 'multiply',
      maskImage: stampInk,
      WebkitMaskImage: stampInk,
      ...style,
    }}
  >
    <div style={{ fontSize: 40, lineHeight: 1.1 }}>{text}</div>
    {sub ? <div style={{ fontSize: 22, letterSpacing: '0.2em', marginTop: 2 }}>{sub}</div> : null}
  </div>
);

const Tag = ({
  x,
  y,
  rotate,
  string,
  lines,
  width = 330,
}: {
  x: number;
  y: number;
  rotate: number;
  string: number;
  lines: [string, string, string];
  width?: number;
}) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)` }}>
    <svg
      width={width + 40}
      height={string + 150}
      style={{ position: 'absolute', left: -20, top: -string, color: '#5b4632' }}
    >
      <path
        d={`M40 0 C24 ${string * 0.4} 60 ${string * 0.7} 44 ${string + 64}`}
        {...ink}
        strokeWidth={2.2}
      />
      <path
        d={`M20 ${string + 64} L44 ${string + 10} L${width + 20} ${string + 10} L${width + 20} ${string + 118} L44 ${string + 118} Z`}
        fill="#f1e6c8"
        stroke="#7a6146"
        strokeWidth={1.6}
      />
      <circle cx={44} cy={string + 64} r={9} fill="none" stroke="#7a6146" strokeWidth={2} />
      <circle cx={44} cy={string + 64} r={4} fill="#5b4632" />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 52,
        top: 16,
        width: width - 60,
        fontFamily: 'var(--osd-font-display)',
        fontStyle: 'italic',
        color: '#4a3826',
        lineHeight: 1.18,
      }}
    >
      <div
        style={{ fontFamily: smallCaps, fontStyle: 'normal', fontSize: 22, letterSpacing: '0.1em' }}
      >
        {lines[0]}
      </div>
      <div style={{ fontSize: 26 }}>{lines[1]}</div>
      <div style={{ fontSize: 22, color: faded }}>{lines[2]}</div>
    </div>
  </div>
);

const Eyebrow = ({
  children,
  color = 'var(--osd-accent)',
}: {
  children: ReactNode;
  color?: string;
}) => (
  <div style={{ fontFamily: smallCaps, fontSize: 28, letterSpacing: '0.18em', color }}>
    {children}
  </div>
);

const NoteRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '210px 1fr',
      alignItems: 'baseline',
      gap: 24,
      padding: '14px 0 12px',
      borderBottom: `1px solid ${rule}`,
    }}
  >
    <div style={{ fontFamily: smallCaps, fontSize: 23, letterSpacing: '0.12em', color: faded }}>
      {label}
    </div>
    <div style={{ fontSize: 31, lineHeight: 1.3 }}>{children}</div>
  </div>
);

const PlateBox = ({
  children,
  x,
  caption,
}: {
  children: ReactNode;
  x: number;
  caption: ReactNode;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: 150,
      width: 800,
      height: 790,
      border: `1px solid ${rule}`,
      background: 'rgba(250,240,214,0.45)',
      boxShadow: 'inset 0 0 60px rgba(140,96,44,0.14)',
    }}
  >
    {children}
    <div
      style={{
        position: 'absolute',
        left: 32,
        right: 32,
        bottom: 22,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          fontSize: 25,
          color: faded,
        }}
      >
        {caption}
      </div>
      <ScaleBar />
    </div>
  </div>
);

const FigLabel = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      fontFamily: 'var(--osd-font-display)',
      fontStyle: 'italic',
      fontSize: 26,
      color: faded,
    }}
  >
    {children}
  </div>
);

const SpeciesHeader = ({
  plate,
  verdict,
  verdictColor,
  name,
  latin,
}: {
  plate: string;
  verdict: string;
  verdictColor: string;
  name: string;
  latin: ReactNode;
}) => (
  <div>
    <Eyebrow>
      {plate} <span style={{ color: verdictColor }}>· {verdict}</span>
    </Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 400,
        fontSize: 78,
        lineHeight: 1.05,
        margin: '14px 0 10px',
      }}
    >
      {name}
    </h2>
    <div style={{ fontSize: 36, fontStyle: 'italic', color: faded }}>{latin}</div>
  </div>
);

const Flourish = ({ width = 420 }: { width?: number }) => (
  <svg
    width={width}
    height={28}
    viewBox={`0 0 ${width} 28`}
    style={{ color: rule, display: 'block' }}
  >
    <path
      d={`M0 14 H${width / 2 - 40} M${width / 2 + 40} 14 H${width}`}
      {...ink}
      strokeWidth={1.4}
    />
    <path
      d={`M${width / 2 - 40} 14 q20 -14 40 0 q20 14 40 0 M${width / 2 - 40} 14 q20 14 40 0 q20 -14 40 0`}
      {...ink}
      strokeWidth={1.4}
    />
    <circle cx={width / 2} cy={14} r={3.5} fill="currentColor" />
  </svg>
);

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      {
        opacity: 0,
        transformOrigin: 'left center',
        transform:
          'perspective(2400px) rotateY(calc(var(--osd-dir, 1) * -3deg)) translateX(calc(var(--osd-dir, 1) * 10px))',
      },
      {
        opacity: 1,
        transformOrigin: 'left center',
        transform: 'perspective(2400px) rotateY(0deg) translateX(0px)',
      },
    ],
  },
};

const Cover: Page = () => (
  <Sheet folio={false}>
    <div
      style={{
        position: 'absolute',
        inset: '120px 160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: smallCaps, fontSize: 30, letterSpacing: '0.32em', color: faded }}>
        A Field Guide to Urban Mushroom Foraging
      </div>
      <div style={{ marginTop: 26 }}>
        <Flourish width={520} />
      </div>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 400,
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 1,
          margin: '30px 0 0',
          letterSpacing: '-0.01em',
        }}
      >
        Fungi <span style={{ fontStyle: 'italic', color: 'var(--osd-accent)' }}>of the</span> City
      </h1>
      <svg
        width={1060}
        height={380}
        viewBox="40 -12 820 330"
        style={{ color: 'var(--osd-text)', marginTop: 14 }}
      >
        <Ground x1={120} x2={780} y={300} />
        <InkCap x={250} y={300} capW={78} capH={150} stemH={70} />
        <Agaric
          x={450}
          y={300}
          capW={250}
          capH={115}
          stemH={150}
          stemW={36}
          cap="#8d9a52"
          gill="#f3eee0"
          stem="#ece4cc"
          ring="skirt"
          volva
          fibrils
        />
        <Agaric
          x={640}
          y={300}
          rot={8}
          capW={170}
          capH={70}
          stemH={80}
          stemW={30}
          cap="#e2d3b2"
          gill="#b98074"
          stem="#efe6d2"
          ring="thin"
          gills={20}
        />
        <Agaric
          x={720}
          y={300}
          rot={-6}
          s={0.55}
          capW={130}
          capH={60}
          stemH={70}
          stemW={26}
          cap="#e2d3b2"
          gill="#b98074"
          stem="#efe6d2"
          gills={14}
        />
      </svg>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          fontSize: 40,
          color: faded,
          marginTop: 18,
        }}
      >
        with Six Plates, a Calendar &amp; a Code of Conduct
      </div>
      <div
        style={{
          marginTop: 'auto',
          fontFamily: smallCaps,
          fontSize: 24,
          letterSpacing: '0.24em',
          color: faded,
        }}
      >
        Printed for the Society of Metropolitan Mycology · MMXXVI
      </div>
    </div>
  </Sheet>
);

const Callout = ({
  side,
  ly,
  px,
  py,
  term,
  gloss,
  note,
}: {
  side: 'left' | 'right';
  ly: number;
  px: number;
  py: number;
  term: string;
  gloss: string;
  note: string;
}) => {
  const lx = side === 'left' ? 640 : 1380;
  const start = side === 'left' ? lx + 14 : lx - 14;
  const elbow = side === 'left' ? lx + 46 : lx - 46;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg
        width={1920}
        height={1080}
        style={{ position: 'absolute', left: 0, top: 0, color: 'var(--osd-accent)' }}
      >
        <path d={`M${start} ${ly} H${elbow} L${px} ${py}`} {...ink} strokeWidth={1.6} />
        <circle cx={px} cy={py} r={6} fill="currentColor" />
        <circle cx={px} cy={py} r={11} {...ink} strokeWidth={1.2} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: side === 'left' ? lx - 420 : lx,
          top: ly - 26,
          width: 420,
          textAlign: side === 'left' ? 'right' : 'left',
        }}
      >
        <div
          style={{ fontFamily: smallCaps, fontSize: 38, lineHeight: 1.1, letterSpacing: '0.04em' }}
        >
          {term}{' '}
          <span
            style={{
              fontFamily: 'var(--osd-font-body)',
              fontStyle: 'italic',
              fontSize: 30,
              color: 'var(--osd-accent)',
              letterSpacing: 0,
            }}
          >
            {gloss}
          </span>
        </div>
        <div style={{ fontSize: 28, fontStyle: 'italic', color: faded, lineHeight: 1.3 }}>
          {note}
        </div>
      </div>
    </div>
  );
};

const Anatomy: Page = () => (
  <Sheet head="Fig. 1 · Anatomy">
    <div style={{ position: 'absolute', left: 120, top: 150, width: 560 }}>
      <Eyebrow>Figure the First</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 400,
          fontSize: 74,
          lineHeight: 1.02,
          margin: '10px 0 14px',
        }}
      >
        Reading a <span style={{ fontStyle: 'italic' }}>Mushroom</span>
      </h2>
      <p style={{ fontSize: 30, fontStyle: 'italic', lineHeight: 1.4, margin: 0, color: faded }}>
        Six parts, read top to bottom. Miss one and you may miss the one that kills.
      </p>
    </div>
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{ position: 'absolute', inset: 0, color: 'var(--osd-text)' }}
    >
      <path
        d="M700 850 Q1000 838 1300 850 C1290 900 1250 940 1180 950 Q1000 972 820 950 C750 940 712 900 700 850 Z"
        fill="#8a6a44"
        opacity={0.13}
      />
      <path
        d="M760 880 l4 2 M800 912 l3 -2 M1220 884 l4 3 M1250 900 l-3 3 M860 935 l4 1 M1140 940 l3 -2 M1190 912 l4 2 M780 900 l2 3"
        {...ink}
        strokeWidth={2.4}
        opacity={0.45}
      />
      <ellipse cx={1130} cy={890} rx={10} ry={6} {...ink} strokeWidth={1.2} opacity={0.5} />
      <ellipse cx={850} cy={905} rx={8} ry={5} {...ink} strokeWidth={1.2} opacity={0.5} />
      <path
        d="M985 852 q-30 30 -80 46 t-90 40 M1000 856 q10 40 60 60 t110 30 M1012 852 q40 18 70 14 t90 -20 M990 858 q-6 50 -40 80 M1020 860 q-60 30 -140 28 M1040 900 q30 20 20 50 M900 896 q-40 6 -60 30"
        {...ink}
        strokeWidth={1.2}
        opacity={0.55}
      />
      <Ground x1={680} x2={1320} y={850} />
      <Agaric
        x={1000}
        y={850}
        capW={600}
        capH={250}
        stemH={360}
        stemW={76}
        cap="#8d9a52"
        gill="#f3eee0"
        stem="#ece4cc"
        ring="skirt"
        volva
        fibrils
        gills={34}
        weight={2.4}
      />
    </svg>
    <Steps>
      <Step duration={320}>
        <Callout
          side="right"
          ly={300}
          px={1160}
          py={330}
          term="Pileus"
          gloss="the cap"
          note="Colour, texture, the curl of its margin."
        />
      </Step>
      <Step duration={320}>
        <Callout
          side="left"
          ly={520}
          px={850}
          py={510}
          term="Lamellae"
          gloss="the gills"
          note="Free, attached, or decurrent?"
        />
      </Step>
      <Step duration={320}>
        <Callout
          side="right"
          ly={560}
          px={1062}
          py={592}
          term="Annulus"
          gloss="the ring"
          note="Remnant of the veil over the gills."
        />
      </Step>
      <Step duration={320}>
        <Callout
          side="left"
          ly={690}
          px={972}
          py={700}
          term="Stipe"
          gloss="the stem"
          note="Hollow, fibrous, or snapping like chalk?"
        />
      </Step>
      <Step duration={320}>
        <Callout
          side="left"
          ly={820}
          px={938}
          py={818}
          term="Volva"
          gloss="the cup"
          note="Dig, never pull. It hides in the soil."
        />
      </Step>
      <Step duration={320}>
        <Callout
          side="right"
          ly={890}
          px={1078}
          py={914}
          term="Mycelium"
          gloss="the organism"
          note="The mushroom is only its fruit."
        />
      </Step>
    </Steps>
  </Sheet>
);

const Tree = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <g>
    <circle cx={x + 3} cy={y + 3} r={r} fill={moss} opacity={0.28} />
    <path
      d={`M${x - r} ${y} q${r * 0.1} ${-r * 0.7} ${r * 0.6} ${-r * 0.8} q${r * 0.4} ${-r * 0.4} ${r * 0.9} ${-r * 0.1} q${r * 0.6} ${r * 0.1} ${r * 0.5} ${r * 0.8} q${r * 0.1} ${r * 0.7} ${-r * 0.6} ${r * 0.9} q${-r * 0.6} ${r * 0.2} ${-r * 0.9} ${-r * 0.2} q${-r * 0.5} ${-r * 0.2} ${-r * 0.5} ${-r * 0.6} Z`}
      {...ink}
      strokeWidth={1.4}
    />
    <circle cx={x} cy={y} r={2.2} fill="currentColor" />
  </g>
);

const Marker = ({ x, y, n }: { x: number; y: number; n: string }) => (
  <g>
    <circle cx={x} cy={y} r={24} fill="#f3e7c9" stroke={rust} strokeWidth={2.5} />
    <text
      x={x}
      y={y + 9}
      textAnchor="middle"
      fontFamily="IM Fell English, Georgia, serif"
      fontSize={28}
      fill={rust}
    >
      {n}
    </text>
  </g>
);

const HabitatEntry = ({ n, place, species }: { n: string; place: string; species: string }) => (
  <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
    <div
      style={{
        width: 46,
        height: 46,
        flex: 'none',
        borderRadius: '50%',
        border: `2.5px solid ${rust}`,
        color: rust,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 27,
        display: 'grid',
        placeItems: 'center',
        marginTop: 2,
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ fontSize: 33, fontWeight: 500, lineHeight: 1.2 }}>{place}</div>
      <div style={{ fontSize: 28, fontStyle: 'italic', color: faded, lineHeight: 1.3 }}>
        {species}
      </div>
    </div>
  </div>
);

const Habitats: Page = () => {
  const avenue = [150, 225, 300, 375, 450, 525, 600];
  const oaks: [number, number, number][] = [
    [250, 270, 38],
    [330, 230, 32],
    [310, 330, 34],
    [200, 350, 26],
    [480, 176, 22],
    [650, 560, 20],
  ];
  const willows: [number, number, number][] = [
    [560, 640, 24],
    [690, 600, 22],
    [810, 560, 24],
  ];
  return (
    <Sheet head="Habitats">
      <svg
        width={960}
        height={790}
        viewBox="0 0 960 790"
        style={{ position: 'absolute', left: 120, top: 150, color: 'var(--osd-text)' }}
      >
        <rect x={1} y={1} width={958} height={788} fill="rgba(250,240,214,0.4)" stroke={rule} />
        <path d="M0 64 H960 M0 92 H960 M64 92 V790 M92 92 V790" stroke={rule} strokeWidth={1.5} />
        <path
          d="M10 10 h40 v44 h-40 z M110 10 h90 v44 h-90 z M220 10 h120 v44 h-120 z M360 10 h70 v44 h-70 z M450 10 h160 v44 h-160 z M630 10 h110 v44 h-110 z M760 10 h190 v44 h-190 z M10 104 h44 v120 h-44 z M10 240 h44 v200 h-44 z M10 460 h44 v150 h-44 z M10 630 h44 v150 h-44 z"
          fill="#8a6a44"
          opacity={0.22}
          stroke="#6e5a43"
          strokeWidth={1}
        />
        {avenue.map((x) => (
          <Tree key={x} x={x} y={128} r={20} />
        ))}
        {oaks.map(([x, y, r]) => (
          <Tree key={`${x}-${y}`} x={x} y={y} r={r} />
        ))}
        <path
          d="M700 160 h220 v200 h-220 z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeDasharray="2 6"
        />
        <rect
          x={740}
          y={190}
          width={110}
          height={56}
          fill="#8a6a44"
          opacity={0.3}
          stroke="currentColor"
        />
        <path
          d="M850 218 h26 M863 205 v26 M730 290 v18 M722 297 h16 M780 300 v18 M772 307 h16 M830 286 v18 M822 293 h16 M880 300 v18 M872 307 h16 M760 330 v18 M752 337 h16 M860 334 v18 M852 341 h16"
          {...ink}
          strokeWidth={1.6}
        />
        <path d="M130 470 h230 v200 h-230 z" fill="none" stroke="currentColor" strokeWidth={1.4} />
        <path
          d="M150 490 h80 v60 h-80 z M260 490 h80 v60 h-80 z M150 590 h190 v60 h-190 z"
          fill={ochre}
          opacity={0.35}
          stroke="#6e5a43"
        />
        <path
          d="M165 505 l6 4 M185 520 l5 -3 M205 500 l4 6 M280 510 l6 2 M300 530 l-4 4 M320 500 l5 3 M170 610 l6 2 M210 625 l-3 5 M250 605 l5 4 M290 630 l6 -2 M320 610 l4 5"
          {...ink}
          strokeWidth={1.4}
          opacity={0.7}
        />
        <circle cx={520} cy={470} r={18} fill="#d9c08e" stroke="currentColor" strokeWidth={1.6} />
        <circle cx={520} cy={470} r={9} {...ink} strokeWidth={1} />
        <circle cx={566} cy={500} r={13} fill="#d9c08e" stroke="currentColor" strokeWidth={1.6} />
        <path
          d="M470 520 l90 20 M466 530 l92 22 M462 540 l92 22"
          {...ink}
          strokeWidth={6}
          opacity={0.35}
        />
        <path
          d="M520 300 q8 -10 14 0 M560 330 q8 -10 14 0 M600 290 q8 -10 14 0 M640 330 q8 -10 14 0 M480 350 q8 -10 14 0 M590 380 q8 -10 14 0 M440 300 q8 -10 14 0 M650 410 q8 -10 14 0"
          {...ink}
          strokeWidth={1.2}
          opacity={0.6}
        />
        <circle
          cx={600}
          cy={330}
          r={44}
          {...ink}
          strokeWidth={1}
          strokeDasharray="3 7"
          opacity={0.7}
        />
        <path
          d="M92 760 C 300 740, 420 700, 560 690 S 820 600, 960 570 L960 640 C 820 670, 690 740, 560 760 S 300 790, 92 790 Z"
          fill="#7c97a0"
          opacity={0.35}
        />
        <path
          d="M92 760 C 300 740, 420 700, 560 690 S 820 600, 960 570 M150 774 q30 -6 60 0 M380 750 q30 -6 60 0 M620 708 q30 -8 60 -4 M820 650 q30 -8 60 -6"
          {...ink}
          strokeWidth={1.3}
        />
        {willows.map(([x, y, r]) => (
          <Tree key={`w-${x}`} x={x} y={y} r={r} />
        ))}
        <path
          d="M92 420 C 220 430, 330 400, 420 380 S 600 420, 700 470 S 880 470, 960 430"
          {...ink}
          strokeWidth={1.6}
          strokeDasharray="1 7"
        />
        <path
          d="M420 380 C 430 300, 470 200, 520 92"
          {...ink}
          strokeWidth={1.6}
          strokeDasharray="1 7"
        />
        <g transform="translate(130 708)">
          <rect
            x={0}
            y={0}
            width={200}
            height={8}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
          />
          <rect x={0} y={0} width={50} height={8} fill="currentColor" />
          <rect x={100} y={0} width={50} height={8} fill="currentColor" />
          <text
            x={0}
            y={-8}
            fontFamily="IM Fell English, serif"
            fontStyle="italic"
            fontSize={18}
            fill="#6e5a43"
          >
            Scale of yards · 0 — 100
          </text>
        </g>
        <Marker x={355} y={290} n="1" />
        <Marker x={385} y={520} n="2" />
        <Marker x={608} y={474} n="3" />
        <Marker x={600} y={250} n="4" />
        <Marker x={664} y={196} n="5" />
        <g transform="translate(470 640)">
          <path d="M0 -40 L8 0 L0 40 L-8 0 Z" fill="currentColor" opacity={0.8} />
          <path d="M-40 0 L0 -6 L40 0 L0 6 Z" {...ink} strokeWidth={1.2} />
          <text
            x={0}
            y={-48}
            textAnchor="middle"
            fontFamily="IM Fell English, serif"
            fontSize={22}
            fill="currentColor"
          >
            N
          </text>
        </g>
        <text
          x={110}
          y={86}
          fontFamily="IM Fell English SC, serif"
          fontSize={20}
          letterSpacing="3"
          fill="#6e5a43"
        >
          Plane Tree Avenue
        </text>
        <text
          x={704}
          y={386}
          fontFamily="IM Fell English SC, serif"
          fontSize={20}
          letterSpacing="2"
          fill="#6e5a43"
        >
          St Agnes Churchyard
        </text>
        <text
          x={700}
          y={700}
          fontFamily="IM Fell English, serif"
          fontStyle="italic"
          fontSize={22}
          fill="#4b5d63"
        >
          the Old Cut
        </text>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 1150,
          top: 150,
          width: 660,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        <Eyebrow>Where to Look</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 400,
            fontSize: 66,
            lineHeight: 1.04,
            margin: '-10px 0 4px',
          }}
        >
          A Park, <span style={{ fontStyle: 'italic' }}>surveyed</span>
        </h2>
        <HabitatEntry
          n="1"
          place="Old oaks & limes"
          species="Death cap, boletes — partners of the roots"
        />
        <HabitatEntry n="2" place="Woodchip mulch beds" species="Wine cap, shaggy ink cap" />
        <HabitatEntry n="3" place="Stumps & felled limbs" species="Oyster, chicken of the woods" />
        <HabitatEntry
          n="4"
          place="Lawns & grass verges"
          species="Field mushroom, fairy-ring champignon"
        />
        <HabitatEntry
          n="5"
          place="Old churchyards"
          species="Waxcaps, in turf unfed for a century"
        />
      </div>
    </Sheet>
  );
};

const PlateOyster: Page = () => (
  <Sheet head="Plate I">
    <PlateBox x={120} caption="Fig. 2. P. ostreatus, on beech. Nat. size.">
      <svg
        width={800}
        height={700}
        viewBox="0 0 800 700"
        style={{ position: 'absolute', left: 0, top: 10, color: 'var(--osd-text)' }}
      >
        <Trunk x={90} top={70} bottom={690} w={170} />
        <Fan
          x={252}
          y={215}
          R={350}
          a0={-78}
          a1={46}
          sy={0.58}
          rot={-14}
          lobes={2}
          face="top"
          tint="#8a8075"
        />
        <Fan
          x={254}
          y={318}
          R={420}
          a0={-40}
          a1={64}
          sy={0.7}
          rot={0}
          face="gills"
          tint="#857f78"
        />
        <Fan
          x={252}
          y={462}
          R={360}
          a0={-72}
          a1={46}
          sy={0.58}
          rot={-6}
          lobes={2}
          face="top"
          tint="#968b7e"
        />
        <Fan
          x={256}
          y={560}
          R={330}
          a0={-34}
          a1={70}
          sy={0.68}
          rot={10}
          lobes={3}
          face="gills"
          tint="#857f78"
        />
      </svg>
    </PlateBox>
    <Tag
      x={630}
      y={190}
      rotate={6}
      string={70}
      lines={['No. 014', 'Pleurotus ostreatus', 'coll. Abney Park · 3.xi.25']}
    />
    <div style={{ position: 'absolute', left: 990, top: 150, width: 810 }}>
      <SpeciesHeader
        plate="Plate I."
        verdict="Edible"
        verdictColor={moss}
        name="The Oyster Mushroom"
        latin={
          <>
            Pleurotus ostreatus <span style={{ fontStyle: 'normal' }}>(Jacq.) P. Kumm.</span>
          </>
        }
      />
      <div style={{ marginTop: 26, borderTop: `2px solid ${rule}` }}>
        <NoteRow label="Habitat">Dead hardwood — beech, poplar, park willow</NoteRow>
        <NoteRow label="Season">All year; flushes after the first frosts</NoteRow>
        <NoteRow label="Spore print">White to pale lilac</NoteRow>
        <NoteRow label="Gills">Running down into a stubby, off-centre stem</NoteRow>
      </div>
      <p
        style={{
          fontSize: 30,
          fontStyle: 'italic',
          lineHeight: 1.45,
          color: faded,
          margin: '26px 0 0',
        }}
      >
        A faint smell of aniseed. Pick young — older flesh turns leathery and is often home to
        beetles.
      </p>
    </div>
    <Stamp
      text="Edible"
      sub="pick young"
      color={moss}
      rotate={-8}
      style={{ left: 1560, top: 770 }}
    />
  </Sheet>
);

const PlateChicken: Page = () => (
  <Sheet head="Plate II">
    <PlateBox x={120} caption="Fig. 3. Laetiporus sulphureus, on oak. × ½.">
      <svg
        width={800}
        height={700}
        viewBox="0 0 800 700"
        style={{ position: 'absolute', left: 0, top: 10, color: 'var(--osd-text)' }}
      >
        <Trunk x={70} top={60} bottom={690} w={200} />
        <Fan
          x={262}
          y={170}
          R={330}
          a0={-80}
          a1={58}
          sy={0.4}
          rot={-10}
          lobes={4}
          face="chicken"
          tint="#d0672a"
        />
        <Fan
          x={258}
          y={290}
          R={400}
          a0={-78}
          a1={60}
          sy={0.42}
          rot={4}
          lobes={5}
          face="chicken"
          tint="#c95f26"
        />
        <Fan
          x={262}
          y={420}
          R={350}
          a0={-80}
          a1={56}
          sy={0.4}
          rot={-6}
          lobes={4}
          face="chicken"
          tint="#d87430"
        />
        <Fan
          x={258}
          y={545}
          R={330}
          a0={-76}
          a1={58}
          sy={0.42}
          rot={6}
          lobes={3}
          face="chicken"
          tint="#cf6a2b"
        />
      </svg>
    </PlateBox>
    <Tag
      x={560}
      y={110}
      rotate={-4}
      string={46}
      lines={['No. 022', 'Laetiporus sulphureus', 'coll. Clissold Park · 19.vi.25']}
    />
    <div style={{ position: 'absolute', left: 990, top: 150, width: 810 }}>
      <SpeciesHeader
        plate="Plate II."
        verdict="Edible, with care"
        verdictColor={ochre}
        name="Chicken of the Woods"
        latin={
          <>
            Laetiporus sulphureus <span style={{ fontStyle: 'normal' }}>(Bull.) Murrill</span>
          </>
        }
      />
      <div style={{ marginTop: 26, borderTop: `2px solid ${rule}` }}>
        <NoteRow label="Habitat">Oak, willow, cherry & old street planes</NoteRow>
        <NoteRow label="Season">May to September</NoteRow>
        <NoteRow label="Spore print">White</NoteRow>
        <NoteRow label="Underside">Pores, not gills — sulphur yellow</NoteRow>
      </div>
      <p
        style={{
          fontSize: 30,
          fontStyle: 'italic',
          lineHeight: 1.45,
          color: faded,
          margin: '26px 0 0',
        }}
      >
        Never from yew, cedar or eucalyptus: it draws up its host's toxins. Cook well, and try a
        small portion first.
      </p>
    </div>
    <Stamp
      text="With Care"
      sub="cook thoroughly"
      color={ochre}
      rotate={7}
      style={{ left: 1530, top: 800 }}
    />
  </Sheet>
);

const PlateInkCap: Page = () => (
  <Sheet head="Plate III">
    <PlateBox x={120} caption="Fig. 4. Coprinus comatus, three stages. × ⅔.">
      <svg
        width={800}
        height={700}
        viewBox="0 0 800 700"
        style={{ position: 'absolute', left: 0, top: 10, color: 'var(--osd-text)' }}
      >
        <Ground x1={60} x2={740} y={620} />
        <InkCap x={190} y={620} capW={120} capH={250} stemH={60} />
        <InkCap x={400} y={620} capW={130} capH={290} stemH={180} />
        <InkCap x={610} y={620} capW={150} capH={230} stemH={250} old />
      </svg>
      <FigLabel x={150} y={660}>
        a. young
      </FigLabel>
      <FigLabel x={350} y={660}>
        b. mature
      </FigLabel>
      <FigLabel x={545} y={660}>
        c. dissolving
      </FigLabel>
    </PlateBox>
    <Tag
      x={150}
      y={210}
      rotate={-5}
      string={60}
      lines={['No. 031', 'Coprinus comatus', 'coll. Hackney Marshes · 2.x.25']}
      width={300}
    />
    <div style={{ position: 'absolute', left: 990, top: 150, width: 810 }}>
      <SpeciesHeader
        plate="Plate III."
        verdict="Edible, young only"
        verdictColor={moss}
        name="The Shaggy Ink Cap"
        latin={
          <>
            Coprinus comatus <span style={{ fontStyle: 'normal' }}>(O.F. Müll.) Pers.</span>
          </>
        }
      />
      <div style={{ marginTop: 26, borderTop: `2px solid ${rule}` }}>
        <NoteRow label="Habitat">Lawns, verges, freshly disturbed ground</NoteRow>
        <NoteRow label="Season">August to November; again after spring rain</NoteRow>
        <NoteRow label="Spore print">Black</NoteRow>
        <NoteRow label="Lifespan">A day or two, then it melts into ink</NoteRow>
      </div>
      <p
        style={{
          fontSize: 30,
          fontStyle: 'italic',
          lineHeight: 1.45,
          color: faded,
          margin: '26px 0 0',
        }}
      >
        Cook within hours of picking. Its cousin the common ink cap turns violently toxic when taken
        with alcohol.
      </p>
    </div>
  </Sheet>
);

const CompareRow = ({ label, left, right }: { label: string; left: string; right: string }) => (
  <div style={{ borderBottom: `1px solid ${rule}`, padding: '12px 0 14px' }}>
    <div
      style={{
        textAlign: 'center',
        fontFamily: smallCaps,
        fontSize: 23,
        letterSpacing: '0.16em',
        color: faded,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 40,
        fontSize: 29,
        lineHeight: 1.3,
      }}
    >
      <div style={{ textAlign: 'right' }}>{left}</div>
      <div style={{ color: blood }}>{right}</div>
    </div>
  </div>
);

const Lookalike: Page = () => (
  <Sheet head="Plate IV">
    <div style={{ position: 'absolute', left: 120, right: 120, top: 148, textAlign: 'center' }}>
      <Eyebrow>Plate IV. · Dangerous Look-alikes</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 400,
          fontSize: 74,
          lineHeight: 1.05,
          margin: '8px 0 0',
        }}
      >
        The <span style={{ fontStyle: 'italic' }}>Fatal</span> Resemblance
      </h2>
    </div>
    <svg
      width={460}
      height={560}
      viewBox="0 0 460 560"
      style={{ position: 'absolute', left: 130, top: 300, color: 'var(--osd-text)' }}
    >
      <Ground x1={30} x2={430} y={470} />
      <Agaric
        x={230}
        y={470}
        capW={300}
        capH={120}
        stemH={150}
        stemW={52}
        cap="#e2d3b2"
        gill="#a8695c"
        stem="#efe6d2"
        ring="thin"
        gills={26}
      />
    </svg>
    <svg
      width={460}
      height={560}
      viewBox="0 0 460 560"
      style={{ position: 'absolute', left: 1330, top: 300, color: 'var(--osd-text)' }}
    >
      <Ground x1={30} x2={430} y={470} />
      <Agaric
        x={230}
        y={470}
        capW={290}
        capH={130}
        stemH={230}
        stemW={48}
        cap="#8d9a52"
        gill="#f6f1e2"
        stem="#ece4cc"
        ring="skirt"
        volva
        fibrils
        gills={26}
      />
    </svg>
    <div style={{ position: 'absolute', left: 130, top: 790, width: 460, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 40 }}>Field Mushroom</div>
      <div style={{ fontSize: 28, fontStyle: 'italic', color: faded }}>Agaricus campestris</div>
    </div>
    <div style={{ position: 'absolute', left: 1330, top: 790, width: 460, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 40, color: blood }}>
        Death Cap
      </div>
      <div style={{ fontSize: 28, fontStyle: 'italic', color: faded }}>Amanita phalloides</div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 610,
        top: 300,
        width: 700,
        borderTop: `2px solid ${rule}`,
      }}
    >
      <CompareRow label="Cap" left="White, silky, bruising pink" right="Olive-green, streaked" />
      <CompareRow label="Gills" left="Pink, ageing chocolate" right="White, always white" />
      <CompareRow label="Ring" left="Thin, often torn away" right="A broad hanging skirt" />
      <CompareRow label="Base" left="Plain, tapering stem" right="A bulb in a sac-like cup" />
      <CompareRow label="Spore print" left="Dark brown" right="White" />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 610,
        top: 880,
        width: 700,
        textAlign: 'center',
        fontSize: 28,
        fontStyle: 'italic',
        color: blood,
      }}
    >
      Half a cap can kill. Symptoms wait 6–24 hours, then seem to pass.
    </div>
    <Stamp text="Deadly" color={blood} rotate={-9} style={{ left: 1610, top: 300 }} />
  </Sheet>
);

const PlateGalerina: Page = () => (
  <Sheet head="Plate V">
    <div style={{ position: 'absolute', left: 120, top: 150, width: 800 }}>
      <SpeciesHeader
        plate="Plate V."
        verdict="Deadly"
        verdictColor={blood}
        name="The Funeral Bell"
        latin={
          <>
            Galerina marginata <span style={{ fontStyle: 'normal' }}>(Batsch) Kühner</span>
          </>
        }
      />
      <div style={{ marginTop: 26, borderTop: `2px solid ${rule}` }}>
        <NoteRow label="Habitat">Rotting stumps, in tight tufts</NoteRow>
        <NoteRow label="Season">Autumn into winter</NoteRow>
        <NoteRow label="Spore print">Rusty brown</NoteRow>
        <NoteRow label="Mistaken for">Velvet shank, honey fungus</NoteRow>
      </div>
      <p
        style={{
          fontSize: 30,
          fontStyle: 'italic',
          lineHeight: 1.45,
          color: faded,
          margin: '26px 0 0',
        }}
      >
        It carries the same amatoxins as the death cap. Small, brown and wholly ordinary — which is
        precisely the danger.
      </p>
    </div>
    <PlateBox x={1000} caption="Fig. 5. Galerina marginata, a tuft on pine. × 1.">
      <svg
        width={800}
        height={700}
        viewBox="0 0 800 700"
        style={{ position: 'absolute', left: 0, top: 10, color: 'var(--osd-text)' }}
      >
        <Log x={150} y={540} w={520} h={120} />
        <Agaric
          x={380}
          y={556}
          rot={-30}
          capW={110}
          capH={50}
          stemH={170}
          stemW={16}
          cap="#a8662f"
          gill="#c08848"
          stem="#a8784a"
          ring="thin"
          gills={14}
        />
        <Agaric
          x={392}
          y={552}
          rot={-12}
          capW={150}
          capH={64}
          stemH={260}
          stemW={19}
          cap="#b0702f"
          gill="#c08848"
          stem="#a8784a"
          ring="thin"
          gills={16}
        />
        <Agaric
          x={410}
          y={552}
          rot={6}
          capW={135}
          capH={58}
          stemH={230}
          stemW={18}
          cap="#9b5a26"
          gill="#c08848"
          stem="#a8784a"
          ring="thin"
          gills={16}
        />
        <Agaric
          x={424}
          y={556}
          rot={24}
          capW={104}
          capH={48}
          stemH={180}
          stemW={16}
          cap="#b0702f"
          gill="#c08848"
          stem="#a8784a"
          ring="thin"
          gills={12}
        />
        <Agaric
          x={436}
          y={560}
          rot={44}
          capW={72}
          capH={36}
          stemH={110}
          stemW={13}
          cap="#a8662f"
          gill="#c08848"
          stem="#a8784a"
          gills={10}
        />
        <Agaric
          x={372}
          y={560}
          rot={-52}
          capW={64}
          capH={32}
          stemH={86}
          stemW={12}
          cap="#b0702f"
          gill="#c08848"
          stem="#a8784a"
          gills={10}
        />
        <path d="M352 552 q30 -14 104 2" fill="none" stroke="currentColor" strokeWidth={2} />
        <path
          d="M200 552 q8 -10 16 0 q6 -12 14 0 M560 556 q8 -10 16 0 q6 -12 14 0 M500 552 q6 -8 12 0"
          fill="none"
          stroke={moss}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </svg>
    </PlateBox>
    <Tag
      x={1460}
      y={200}
      rotate={4}
      string={50}
      lines={['No. 047', 'Galerina marginata', 'coll. Tower Hamlets · 22.xi.25']}
    />
    <Stamp
      text="Deadly"
      sub="amatoxins"
      color={blood}
      rotate={-7}
      style={{ left: 600, top: 790 }}
    />
  </Sheet>
);

const SporePrint = ({
  spore,
  card,
  title,
  genera,
  fig,
}: {
  spore: string;
  card: string;
  title: string;
  genera: string;
  fig: string;
}) => {
  const lines: string[] = [];
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const inner = i % 3 === 0 ? 26 : i % 3 === 1 ? 60 : 84;
    const outer = 104 + 6 * Math.sin(i * 1.7) + 5 * Math.sin(i * 0.23 + 1);
    lines.push(
      `M${r1(130 + Math.cos(a) * inner)} ${r1(130 + Math.sin(a) * inner)} L${r1(130 + Math.cos(a) * outer)} ${r1(130 + Math.sin(a) * outer)}`,
    );
  }
  return (
    <div style={{ width: 270, textAlign: 'center' }}>
      <div
        style={{
          width: 270,
          height: 270,
          background: card,
          boxShadow: '3px 4px 0 rgba(80,52,24,0.18), 0 0 0 1px rgba(80,52,24,0.25)',
          display: 'grid',
          placeItems: 'center',
          transform: `rotate(${fig.length % 2 === 0 ? -1.5 : 1.2}deg)`,
        }}
      >
        <svg width={260} height={260} viewBox="0 0 260 260">
          <circle
            cx={130}
            cy={130}
            r={114}
            fill={spore}
            opacity={0.32}
            style={{ filter: 'blur(5px)' }}
          />
          <path d={lines.join(' ')} stroke={spore} strokeWidth={2.1} opacity={0.8} fill="none" />
          <circle cx={130} cy={130} r={20} fill={card} />
        </svg>
      </div>
      <div
        style={{
          fontFamily: smallCaps,
          fontSize: 24,
          letterSpacing: '0.14em',
          color: faded,
          marginTop: 26,
        }}
      >
        {fig}
      </div>
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 38, lineHeight: 1.15 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontStyle: 'italic', color: faded }}>{genera}</div>
    </div>
  );
};

const SporePrints: Page = () => (
  <Sheet head="Spore Prints">
    <div style={{ position: 'absolute', left: 120, right: 120, top: 150, textAlign: 'center' }}>
      <Eyebrow>Figs. 6–10</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 400,
          fontSize: 74,
          lineHeight: 1.05,
          margin: '8px 0 12px',
        }}
      >
        The Colour <span style={{ fontStyle: 'italic' }}>of the Dust</span>
      </h2>
      <div style={{ fontSize: 31, fontStyle: 'italic', color: faded }}>
        Cap gills-down on half-black, half-white paper · cover with a bowl · wait the night
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 390,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 40px',
      }}
    >
      <SporePrint
        spore="#f4efe2"
        card="#221a14"
        title="White"
        genera="Amanita, Pleurotus"
        fig="Fig. 6"
      />
      <SporePrint
        spore="#c98d7a"
        card="#f6efdf"
        title="Salmon pink"
        genera="Pluteus, Entoloma"
        fig="Fig. 7"
      />
      <SporePrint
        spore="#a5582b"
        card="#f6efdf"
        title="Rusty brown"
        genera="Galerina, Gymnopilus"
        fig="Fig. 8"
      />
      <SporePrint
        spore="#4a2f24"
        card="#f6efdf"
        title="Chocolate"
        genera="Agaricus, Stropharia"
        fig="Fig. 9"
      />
      <SporePrint
        spore="#16120f"
        card="#f6efdf"
        title="Black"
        genera="Coprinus, Panaeolus"
        fig="Fig. 10"
      />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 360,
        right: 360,
        top: 868,
        textAlign: 'center',
        fontSize: 30,
        fontStyle: 'italic',
        borderTop: `1px solid ${rule}`,
        paddingTop: 12,
      }}
    >
      Rusty print, a ring, a tuft on wood? Suspect <span style={{ color: blood }}>Galerina</span>,
      and walk away.
    </div>
  </Sheet>
);

const MONTH_X = 560;
const MONTH_W = 103;

const washMask = svgUri(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='60' preserveAspectRatio='none'><filter id='w'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.06' numOctaves='3' seed='9'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.4 1.6'/></filter><rect width='600' height='60' filter='url(#w)'/></svg>`,
);

const washStyle: CSSProperties = {
  position: 'absolute',
  borderRadius: 24,
  maskImage: `${washMask}, linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)`,
  WebkitMaskImage: `${washMask}, linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%)`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
  mixBlendMode: 'multiply',
};

const Season = ({
  row,
  from,
  to,
  peakFrom,
  peakTo,
  tint,
}: {
  row: number;
  from: number;
  to: number;
  peakFrom: number;
  peakTo: number;
  tint: string;
}) => {
  const top = 330 + row * 92 + 18;
  return (
    <>
      <div
        style={{
          ...washStyle,
          left: MONTH_X + from * MONTH_W + 4,
          width: (to - from + 1) * MONTH_W - 8,
          top,
          height: 52,
          background: tint,
          opacity: 0.42,
        }}
      />
      <div
        style={{
          ...washStyle,
          left: MONTH_X + peakFrom * MONTH_W + 8,
          width: (peakTo - peakFrom + 1) * MONTH_W - 16,
          top: top + 8,
          height: 36,
          background: tint,
          opacity: 0.8,
        }}
      />
    </>
  );
};

const CalendarName = ({ row, name, latin }: { row: number; name: string; latin: string }) => (
  <div style={{ position: 'absolute', left: 140, top: 330 + row * 92 + 12, width: 400 }}>
    <div style={{ fontSize: 33, lineHeight: 1.1 }}>{name}</div>
    <div style={{ fontSize: 24, fontStyle: 'italic', color: faded, lineHeight: 1.25 }}>{latin}</div>
  </div>
);

const Calendar: Page = () => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return (
    <Sheet head="Calendar">
      <div style={{ position: 'absolute', left: 140, top: 150 }}>
        <Eyebrow>Tabula Temporum</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 400,
            fontSize: 74,
            lineHeight: 1.05,
            margin: '8px 0 0',
          }}
        >
          The Forager's <span style={{ fontStyle: 'italic' }}>Year</span>
        </h2>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 140,
          top: 196,
          display: 'flex',
          gap: 34,
          alignItems: 'center',
          fontSize: 26,
          fontStyle: 'italic',
          color: faded,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{ width: 54, height: 20, background: ochre, opacity: 0.38, borderRadius: 10 }}
          />
          in season
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{ width: 54, height: 20, background: ochre, opacity: 0.8, borderRadius: 10 }}
          />
          at its best
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: MONTH_X,
          top: 286,
          width: MONTH_W * 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          fontFamily: smallCaps,
          fontSize: 24,
          letterSpacing: '0.1em',
          color: faded,
          textAlign: 'center',
        }}
      >
        {months.map((m) => (
          <div key={m}>{m}</div>
        ))}
      </div>
      <svg
        width={1660}
        height={600}
        style={{ position: 'absolute', left: 130, top: 320, color: rule }}
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path
            key={`h${i}`}
            d={`M10 ${i * 92 + 8} H1650`}
            stroke="currentColor"
            strokeWidth={i === 0 || i === 6 ? 2 : 1}
          />
        ))}
        {months.map((m, i) => (
          <path
            key={`v${m}`}
            d={`M${MONTH_X - 130 + i * MONTH_W} 8 V560`}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.45}
          />
        ))}
      </svg>
      <CalendarName row={0} name="Oyster" latin="Pleurotus ostreatus" />
      <Season row={0} from={0} to={11} peakFrom={9} peakTo={11} tint="#6f6c66" />
      <CalendarName row={1} name="Chicken of the woods" latin="Laetiporus sulphureus" />
      <Season row={1} from={4} to={8} peakFrom={5} peakTo={7} tint="#d0672a" />
      <CalendarName row={2} name="Field mushroom" latin="Agaricus campestris" />
      <Season row={2} from={6} to={9} peakFrom={7} peakTo={8} tint="#a8695c" />
      <CalendarName row={3} name="Shaggy ink cap" latin="Coprinus comatus" />
      <Season row={3} from={3} to={10} peakFrom={8} peakTo={9} tint="#6e5a43" />
      <CalendarName row={4} name="Death cap" latin="Amanita phalloides" />
      <Season row={4} from={7} to={10} peakFrom={8} peakTo={9} tint={blood} />
      <CalendarName row={5} name="Velvet shank" latin="Flammulina velutipes" />
      <Season row={5} from={9} to={11} peakFrom={11} peakTo={11} tint={ochre} />
      <Season row={5} from={0} to={2} peakFrom={0} peakTo={1} tint={ochre} />
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 900,
          fontSize: 26,
          fontStyle: 'italic',
          color: faded,
        }}
      >
        Seasons for a temperate northern city; a warm wet week can move any of them by a month.
      </div>
    </Sheet>
  );
};

const Rule = ({ n, children }: { n: string; children: ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '100px 1fr',
      alignItems: 'baseline',
      height: 100,
      borderBottom: '1.5px solid rgba(110,130,160,0.45)',
      paddingTop: 30,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 36,
        color: 'var(--osd-accent)',
        textAlign: 'right',
        paddingRight: 30,
      }}
    >
      {n}
    </div>
    <div style={{ fontSize: 35, paddingLeft: 30 }}>{children}</div>
  </div>
);

const ForagersCode: Page = () => (
  <Sheet head="Ethics & Safety">
    <div style={{ position: 'absolute', left: 120, top: 150, width: 1180 }}>
      <Eyebrow>Ethics &amp; Safety</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 400,
          fontSize: 74,
          lineHeight: 1.05,
          margin: '8px 0 24px',
        }}
      >
        The Forager's <span style={{ fontStyle: 'italic' }}>Code</span>
      </h2>
      <div style={{ position: 'relative', borderTop: '1.5px solid rgba(110,130,160,0.45)' }}>
        <div
          style={{
            position: 'absolute',
            left: 100,
            top: 0,
            bottom: -30,
            width: 2,
            background: 'rgba(170,60,50,0.5)',
          }}
        />
        <Rule n="I.">Never eat what you cannot name with total certainty.</Rule>
        <Rule n="II.">Shun roadsides & dog-walked verges — lead, cadmium, worse.</Rule>
        <Rule n="III.">Take a quarter of any flush; leave the rest to spore.</Rule>
        <Rule n="IV.">Cut at the base, tread lightly, leave the turf as found.</Rule>
        <Rule n="V.">Ask first — many city parks forbid picking outright.</Rule>
      </div>
      <div
        style={{
          marginTop: 34,
          paddingLeft: 130,
          fontSize: 28,
          fontStyle: 'italic',
          color: faded,
        }}
      >
        Suspect a poisoning? Keep a sample of what was eaten and seek help at once.
      </div>
    </div>
    <div style={{ position: 'absolute', left: 1420, top: 168 }}>
      <svg
        width={40}
        height={130}
        style={{ position: 'absolute', left: 150, top: 0, color: '#5b4632' }}
      >
        <path d="M20 4 C10 40 30 80 20 116" {...ink} strokeWidth={2.4} />
        <circle cx={20} cy={6} r={6} fill="#a07a3a" stroke="#5b4632" strokeWidth={1.5} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 74,
          width: 340,
          height: 470,
          transform: 'rotate(4deg)',
          transformOrigin: '170px 0',
        }}
      >
        <svg width={340} height={470} style={{ position: 'absolute', inset: 0 }}>
          <path
            d="M60 0 H280 L340 60 V470 H0 V60 Z"
            fill="#f3e8cb"
            stroke="#7a6146"
            strokeWidth={2}
          />
          <path d="M70 12 H270 L326 66 V456 H14 V66 Z" fill="none" stroke={rule} strokeWidth={1} />
          <circle cx={170} cy={42} r={14} fill="none" stroke="#7a6146" strokeWidth={2.5} />
          <circle cx={170} cy={42} r={6} fill="#5b4632" />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            top: 100,
            textAlign: 'center',
          }}
        >
          <div
            style={{ fontFamily: smallCaps, fontSize: 24, letterSpacing: '0.18em', color: faded }}
          >
            Rule the First
          </div>
          <div style={{ marginTop: 18 }}>
            <Flourish width={220} />
          </div>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontStyle: 'italic',
              fontSize: 56,
              lineHeight: 1.08,
              marginTop: 22,
              color: blood,
            }}
          >
            If in doubt, throw it out.
          </div>
          <div
            style={{
              fontSize: 26,
              fontStyle: 'italic',
              color: faded,
              marginTop: 24,
              lineHeight: 1.3,
            }}
          >
            — and the last.
          </div>
        </div>
      </div>
    </div>
  </Sheet>
);

const Finis: Page = () => (
  <Sheet folio={false}>
    <div
      style={{
        position: 'absolute',
        inset: '150px 200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <svg width={420} height={230} viewBox="0 0 420 230" style={{ color: 'var(--osd-text)' }}>
        <Ground x1={70} x2={350} y={210} />
        <InkCap x={170} y={210} capW={70} capH={130} stemH={60} />
        <InkCap x={250} y={210} s={0.8} capW={70} capH={120} stemH={70} old />
      </svg>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 150,
          lineHeight: 1,
          margin: '20px 0 26px',
        }}
      >
        Finis.
      </h2>
      <Flourish width={520} />
      <p
        style={{
          fontSize: 38,
          fontStyle: 'italic',
          lineHeight: 1.4,
          margin: '30px 0 0',
          maxWidth: 1100,
        }}
      >
        Go slowly. Look down. Carry a knife, a basket, and more doubt than appetite.
      </p>
      <div
        style={{
          marginTop: 44,
          fontFamily: smallCaps,
          fontSize: 24,
          letterSpacing: '0.2em',
          color: faded,
        }}
      >
        A primer, not a licence to eat · Join your local mycological society
      </div>
    </div>
  </Sheet>
);

export const meta: SlideMeta = {
  title: 'Fungi of the City',
  createdAt: '2026-10-07T15:40:36.295Z',
};

export default [
  Cover,
  Anatomy,
  Habitats,
  PlateOyster,
  PlateChicken,
  PlateInkCap,
  Lookalike,
  PlateGalerina,
  SporePrints,
  Calendar,
  ForagersCode,
  Finis,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Good evening. Tonight's guide is about the food growing out of the cracks of the city — and the handful of things out there that can kill you.
Everything I'll show is drawn from parks, verges and churchyards within the city limits.`,
  `Before we name a single species, we learn to read one. Six parts, top to bottom.
Cap first — colour, texture, the margin. Then the gills underneath. Then the ring, the stem, and the part most beginners never see: the volva, the cup buried in the soil.
And last, the mycelium. The mushroom is only the fruit; the organism is underground and can be the size of the park.`,
  `Where do you look? This is one city park, surveyed.
Old oaks and limes for the mycorrhizal species — including the death cap. Woodchip beds near the playground. Stumps and felled limbs for the bracket fungi. Lawns and verges. And old churchyards, where turf hasn't been fertilised in a century and waxcaps survive.`,
  `Plate one: the oyster mushroom. The friendliest start. Shelves on dead hardwood, all year round, best after the first frosts.
Note the gills running down into a stubby, off-centre stem. White to lilac spore print. Pick them young.`,
  `Plate two: chicken of the woods. You'll see it from across the park — sulphur and orange shelves on oak or willow.
Pores, not gills. And the one rule: never from yew, cedar or eucalyptus, because it takes up the host's toxins.`,
  `Plate three: the shaggy ink cap, the lawn mushroom. Three stages, left to right — and by the third it's dissolving into black ink.
You have a day, maybe two. Cook it within hours. And don't confuse it with its cousin, which reacts violently with alcohol.`,
  `Now the reason this guide exists. On the left, the field mushroom — the one in every supermarket. On the right, the death cap.
Walk across the table: pink gills versus white; a thin ring versus a skirt; and at the base, the cup. Which is why we dig, never pull.
Half a cap can kill an adult, and the symptoms fade before the liver fails.`,
  `Plate five is the quiet one. The funeral bell. Small, brown, on stumps, in exactly the months people go out for velvet shank.
Same toxins as the death cap. If you can't tell little brown mushrooms apart, you don't eat little brown mushrooms.`,
  `The spore print is the cheapest lab test you'll ever run. Cap gills-down on half-black, half-white paper, a bowl over the top, leave it overnight.
White, pink, rust, chocolate, black — five colours that cut the possibilities dramatically. A rusty print from a tuft on wood is a red flag.`,
  `Here's the year at a glance. Oysters all year, chicken of the woods in summer, the field mushroom in late summer, ink caps through autumn.
Notice the death cap sits right on top of the field mushroom season. Velvet shank carries us through the winter.`,
  `Five rules. Certainty, or nothing. Avoid the verges where cars and dogs go. Take a quarter and leave the rest. Cut cleanly. And ask — a lot of city parks forbid picking altogether.
And the rule on the tag, which is also the first and last: if in doubt, throw it out.`,
  `That's the guide. Go slowly, look down, and carry more doubt than appetite.
If tonight caught you, join your local mycological society — the forays are free and the experts are generous. Thank you.`,
];

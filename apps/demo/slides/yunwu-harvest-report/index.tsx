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
  palette: { bg: '#EFE9DD', text: '#1D2620', accent: '#A4552A' },
  fonts: {
    display: '"Newsreader", "Iowan Old Style", Georgia, serif',
    body: '"Newsreader", "Iowan Old Style", Georgia, serif',
  },
  typeScale: { hero: 160, body: 32 },
  radius: 0,
};

const MUTED = '#6E6A5F';
const RULE = '#CFC6B4';
const CELADON = '#8DA696';
const PINE = '#2F4A3A';
const PAPER_DARK = '#E4DCCC';

const SANS = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';
const CJK = '"Noto Serif TC", "Songti TC", serif';

const M = 140;
const col = (n: number) => M + n * 140;
const span = (n: number) => n * 140 - 40;

const CJK_TEXT = '雲霧茶行採摘梨山一期會';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap';
const CJK_HREF = `https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&text=${encodeURIComponent(CJK_TEXT)}&display=swap`;

const linkStylesheet = (id: string, href: string) => {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
};
if (typeof document !== 'undefined') {
  linkStylesheet('osd-webfont-yunwu-harvest-report', FONT_HREF);
  linkStylesheet('osd-webfont-yunwu-harvest-report-cjk', CJK_HREF);
}

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: { duration: 240, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

const SMALLCAPS: CSSProperties = {
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 20,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: MUTED,
  lineHeight: 1.3,
};

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 400,
  letterSpacing: '-0.02em',
  lineHeight: 1.02,
  margin: 0,
};

const ITALIC: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontStyle: 'italic',
  fontWeight: 400,
};

const abs = (style: CSSProperties): CSSProperties => ({ position: 'absolute', ...style });

type Pt = [number, number];

const smoothOpen = (p: Pt[]) => {
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(i - 1, 0)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(i + 2, p.length - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

const smoothClosed = (p: Pt[]) => {
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
};

const hill = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
  rot: number,
  height: number,
) => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const u = ((x - cx) * c + (y - cy) * s) / sx;
  const v = (-(x - cx) * s + (y - cy) * c) / sy;
  return height * Math.exp(-(u * u + v * v) / 2);
};

const terrain = (x: number, y: number) => {
  const base =
    hill(x, y, 1460, 400, 300, 200, -0.55, 1500) +
    hill(x, y, 1380, 500, 620, 360, -0.45, 760) +
    hill(x, y, 1830, 880, 210, 160, 0.5, 820) +
    hill(x, y, 1900, 90, 260, 190, 0.7, 760) +
    hill(x, y, 1040, 250, 240, 150, 0.25, 420);
  const grain =
    1 +
    0.07 * Math.sin(x / 83 + y / 131) +
    0.05 * Math.sin(x / 47 - y / 71 + 1.3) +
    0.025 * Math.sin((x + y) / 29);
  return base * grain;
};

type Contour = { level: number; d: string; points: Pt[] };

const buildTopo = () => {
  const X0 = -300;
  const Y0 = -720;
  const STEP = 8;
  const nx = Math.ceil((2700 - X0) / STEP) + 1;
  const ny = Math.ceil((1800 - Y0) / STEP) + 1;
  const grid = new Float64Array(nx * ny);
  let max = 0;
  let summit: Pt = [0, 0];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * STEP;
      const y = Y0 + j * STEP;
      const v = terrain(x, y);
      grid[j * nx + i] = v;
      if (v > max) {
        max = v;
        summit = [x, y];
      }
    }
  }
  const scale = 2050 / max;
  for (let k = 0; k < grid.length; k++) grid[k] *= scale;

  const contours: Contour[] = [];
  for (let level = 250; level <= 2000; level += 250) {
    const pts = new Map<string, Pt>();
    const links = new Map<string, string[]>();
    const val = (i: number, j: number) => grid[j * nx + i];
    const at = (
      key: string,
      ax: number,
      ay: number,
      av: number,
      bx: number,
      by: number,
      bv: number,
    ) => {
      if (!pts.has(key)) {
        const t = (level - av) / (bv - av);
        pts.set(key, [ax + (bx - ax) * t, ay + (by - ay) * t]);
      }
      return key;
    };
    const join = (a: string, b: string) => {
      links.set(a, [...(links.get(a) ?? []), b]);
      links.set(b, [...(links.get(b) ?? []), a]);
    };
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const tl = val(i, j);
        const tr = val(i + 1, j);
        const br = val(i + 1, j + 1);
        const bl = val(i, j + 1);
        const c =
          (tl >= level ? 8 : 0) |
          (tr >= level ? 4 : 0) |
          (br >= level ? 2 : 0) |
          (bl >= level ? 1 : 0);
        if (c === 0 || c === 15) continue;
        const x0 = X0 + i * STEP;
        const y0 = Y0 + j * STEP;
        const x1 = x0 + STEP;
        const y1 = y0 + STEP;
        const T = () => at(`h${i}_${j}`, x0, y0, tl, x1, y0, tr);
        const R = () => at(`v${i + 1}_${j}`, x1, y0, tr, x1, y1, br);
        const B = () => at(`h${i}_${j + 1}`, x0, y1, bl, x1, y1, br);
        const L = () => at(`v${i}_${j}`, x0, y0, tl, x0, y1, bl);
        if (c === 1 || c === 14) join(L(), B());
        else if (c === 2 || c === 13) join(B(), R());
        else if (c === 3 || c === 12) join(L(), R());
        else if (c === 4 || c === 11) join(T(), R());
        else if (c === 6 || c === 9) join(T(), B());
        else if (c === 7 || c === 8) join(L(), T());
        else if (c === 5) {
          join(L(), T());
          join(B(), R());
        } else if (c === 10) {
          join(L(), B());
          join(T(), R());
        }
      }
    }
    const seen = new Set<string>();
    const starts = [...links.keys()].sort(
      (a, b) => (links.get(a)?.length ?? 0) - (links.get(b)?.length ?? 0),
    );
    for (const start of starts) {
      if (seen.has(start)) continue;
      const loop: Pt[] = [];
      let prev = '';
      let cur: string | undefined = start;
      while (cur && !seen.has(cur)) {
        seen.add(cur);
        const p = pts.get(cur);
        if (p) loop.push(p);
        const from: string = prev;
        const next: string | undefined = links.get(cur)?.find((k) => k !== from && !seen.has(k));
        prev = cur;
        cur = next;
      }
      if (loop.length < 40) continue;
      const sparse = loop.filter((_, k) => k % 3 === 0);
      const closed = (links.get(start)?.length ?? 0) > 1;
      contours.push({
        level,
        d: closed ? smoothClosed(sparse) : smoothOpen(sparse),
        points: sparse,
      });
    }
  }

  const target: Pt = [1250, 560];
  let best: { p: Pt; angle: number; dist: number } = { p: target, angle: 0, dist: Infinity };
  for (const c of contours) {
    if (c.level !== 1500) continue;
    const n = c.points.length;
    for (let k = 0; k < n; k++) {
      const p = c.points[k];
      const dist = (p[0] - target[0]) ** 2 + (p[1] - target[1]) ** 2;
      if (dist < best.dist) {
        const a = c.points[(k - 2 + n) % n];
        const b = c.points[(k + 2) % n];
        let angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
        if (angle > 90) angle -= 180;
        if (angle < -90) angle += 180;
        best = { p, angle, dist };
      }
    }
  }
  return { contours, summit, label: best };
};

const TOPO = buildTopo();

const TopoMap = () => (
  <svg
    viewBox="0 0 1920 1080"
    width={1920}
    height={1080}
    style={abs({ left: 0, top: 0 })}
    aria-hidden="true"
  >
    {TOPO.contours.map((c) => (
      <path
        key={c.d.slice(0, 32)}
        d={c.d}
        fill="none"
        stroke={c.level === 1500 ? 'var(--osd-accent)' : c.level % 1000 === 0 ? CELADON : RULE}
        strokeWidth={c.level === 1500 ? 1.8 : c.level % 500 === 0 ? 1.5 : 1.1}
      />
    ))}
    <g transform={`translate(${TOPO.label.p[0]} ${TOPO.label.p[1]}) rotate(${TOPO.label.angle})`}>
      <text
        y={7}
        textAnchor="middle"
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 17,
          letterSpacing: '0.14em',
          fill: 'var(--osd-accent)',
          stroke: 'var(--osd-bg)',
          strokeWidth: 10,
          paintOrder: 'stroke',
        }}
      >
        1500 m
      </text>
    </g>
    <g transform={`translate(${TOPO.summit[0]} ${TOPO.summit[1]})`}>
      <path d="M-7,0H7M0,-7V7" stroke="var(--osd-text)" strokeWidth={1.4} />
      <text
        x={-14}
        y={-10}
        textAnchor="end"
        style={{
          fontFamily: 'var(--osd-font-body)',
          fontStyle: 'italic',
          fontSize: 24,
          fill: 'var(--osd-text)',
        }}
      >
        2,050
      </text>
    </g>
  </svg>
);

const Folio = () => {
  const { current } = useSlidePageNumber();
  return (
    <div
      style={abs({
        left: M,
        right: M,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderTop: `1px solid ${RULE}`,
        paddingTop: 16,
      })}
    >
      <span style={SMALLCAPS}>Harvest Report 2026</span>
      <span style={{ ...ITALIC, fontSize: 24, color: MUTED }}>
        p. {String(current).padStart(2, '0')}
      </span>
    </div>
  );
};

const Sheet = ({ children, folio = true }: { children: ReactNode; folio?: boolean }) => (
  <div
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
      fontSize: 'var(--osd-size-body)',
      lineHeight: 1.5,
    }}
  >
    {children}
    {folio && <Folio />}
  </div>
);

const Eyebrow = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
    <span
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 500,
        fontSize: 26,
        color: 'var(--osd-accent)',
        letterSpacing: '0.02em',
      }}
    >
      {n}
    </span>
    <span style={SMALLCAPS}>{children}</span>
  </div>
);

const Vertical = ({
  children,
  size,
  style,
}: {
  children: ReactNode;
  size: number;
  style?: CSSProperties;
}) => (
  <div
    style={{
      writingMode: 'vertical-rl',
      fontFamily: CJK,
      fontWeight: 500,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '0.08em',
      ...style,
    }}
  >
    {children}
  </div>
);

const Cover: Page = () => (
  <Sheet folio={false}>
    <TopoMap />
    <div style={abs({ left: M, top: 120, display: 'flex', alignItems: 'baseline', gap: 20 })}>
      <span style={{ ...SMALLCAPS, color: 'var(--osd-text)' }}>Yunwu Tea Co.</span>
      <span
        style={{
          fontFamily: CJK,
          fontWeight: 500,
          fontSize: 22,
          color: MUTED,
          letterSpacing: '0.2em',
        }}
      >
        雲霧茶行
      </span>
    </div>
    <div style={abs({ left: M, top: 420, width: span(8) })}>
      <h1 style={{ ...DISPLAY, fontSize: 'var(--osd-size-hero)', lineHeight: 0.98 }}>
        The 2026
        <br />
        Harvest Report
      </h1>
      <p
        style={{
          ...ITALIC,
          fontSize: 42,
          lineHeight: 1.3,
          margin: '48px 0 0',
          maxWidth: 760,
          color: PINE,
        }}
      >
        Six gardens, four flushes, and what they mean for your 2027 orders.
      </p>
    </div>
    <div
      style={abs({
        left: M,
        bottom: 96,
        width: span(8),
        whiteSpace: 'nowrap',
        borderTop: '1px solid var(--osd-text)',
        paddingTop: 18,
        display: 'flex',
        justifyContent: 'space-between',
      })}
    >
      <span style={{ ...SMALLCAPS, color: 'var(--osd-text)' }}>Yunwu Tea Co. · Vol. 7</span>
      <span style={SMALLCAPS}>Prepared for wholesale partners</span>
    </div>
    <Vertical size={250} style={abs({ right: M, top: 150, color: 'var(--osd-text)' })}>
      雲霧
    </Vertical>
    <div
      style={abs({
        right: M,
        top: 760,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
      })}
    >
      <div>
        <div
          style={{ ...SMALLCAPS, fontSize: 16, display: 'flex', justifyContent: 'space-between' }}
        >
          <span>0</span>
          <span>1 km</span>
        </div>
        <div
          style={{
            width: 160,
            height: 8,
            marginTop: 6,
            border: '1px solid var(--osd-text)',
            background: 'linear-gradient(90deg, var(--osd-text) 50%, var(--osd-bg) 50%)',
          }}
        />
      </div>
      <div style={{ ...SMALLCAPS, fontSize: 16, textAlign: 'right' }}>Contour interval 250 m</div>
    </div>
    <div
      style={abs({
        right: M + 266,
        top: 158,
        writingMode: 'vertical-rl',
        ...SMALLCAPS,
        fontSize: 18,
        letterSpacing: '0.22em',
      })}
    >
      Yún wù · cloud and mist
    </div>
  </Sheet>
);

const Letter: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="I.">The Year</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: M, top: 196, width: span(8) }), fontSize: 92 }}>
      A note before the numbers
    </h2>
    <div
      style={abs({
        left: M,
        top: 380,
        width: span(8),
        columnCount: 2,
        columnGap: 40,
        fontSize: 32,
        lineHeight: 1.5,
        textWrap: 'pretty',
      })}
    >
      <p style={{ margin: 0 }}>
        <span
          style={{
            float: 'left',
            fontFamily: 'var(--osd-font-display)',
            fontSize: 158,
            lineHeight: 0.8,
            margin: '10px 14px 0 -4px',
            color: 'var(--osd-accent)',
          }}
        >
          T
        </span>
        his was a cold, slow spring. Frost held on Lishan until the second week of April, and the
        first picking came eleven days late. Our growers worried; we were quietly pleased. Leaves
        that grow slowly carry more sugar and a deeper aroma, and you will taste it in the spring
        lots. Volumes are up seven per cent, prices to growers are up again, and every lab test came
        back clean. The pages that follow explain what that means for your 2027 orders.
      </p>
    </div>
    <div style={abs({ left: col(4), top: 790 })}>
      <div style={{ ...ITALIC, fontSize: 44, lineHeight: 1.1 }}>Lin Yu-ting</div>
      <div style={{ ...SMALLCAPS, marginTop: 12 }}>Buyer & second-generation owner</div>
    </div>
    <div style={abs({ left: 1260, top: 380, width: 1, height: 520, background: RULE })} />
    <blockquote
      style={{
        ...abs({ left: 1316, top: 372, width: 1780 - 1316 }),
        margin: 0,
        ...ITALIC,
        fontSize: 50,
        lineHeight: 1.16,
        color: 'var(--osd-accent)',
        textIndent: '-0.42em',
        textWrap: 'balance',
      }}
    >
      “A cold, slow spring is the best thing that can happen to a high‑mountain oolong.”
    </blockquote>
    <div
      style={{
        ...ITALIC,
        ...abs({ left: 1316, top: 800 }),
        fontSize: 24,
        lineHeight: 1.4,
        color: MUTED,
      }}
    >
      Dadaocheng, Taipei
      <br />
      30 September 2026
    </div>
  </Sheet>
);

const YEARS: { year: string; t: number }[] = [
  { year: '2020', t: 11.2 },
  { year: '2021', t: 12.6 },
  { year: '2022', t: 13.9 },
  { year: '2023', t: 15.1 },
  { year: '2024', t: 16.3 },
  { year: '2025', t: 17.2 },
  { year: '2026', t: 18.4 },
];

const TonnesChart = () => {
  const w = 520;
  const h = 210;
  const base = 170;
  const bw = 40;
  const gap = (w - bw * YEARS.length) / (YEARS.length - 1);
  const y = (t: number) => base - (t / 20) * 150;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line
        x1={0}
        x2={w}
        y1={base + 0.5}
        y2={base + 0.5}
        stroke="var(--osd-text)"
        strokeWidth={1}
      />
      {YEARS.map((d, i) => {
        const x = i * (bw + gap);
        const last = i === YEARS.length - 1;
        return (
          <g key={d.year}>
            <rect
              x={x}
              y={y(d.t)}
              width={bw}
              height={base - y(d.t)}
              fill={last ? 'var(--osd-accent)' : RULE}
            />
            <text
              x={x + bw / 2}
              y={base + 30}
              textAnchor="middle"
              style={{
                fontFamily: SANS,
                fontWeight: 500,
                fontSize: 17,
                fill: last ? 'var(--osd-text)' : MUTED,
              }}
            >
              {d.year}
            </text>
            {(i === 0 || last) && (
              <text
                x={x + bw / 2}
                y={y(d.t) - 10}
                textAnchor="middle"
                style={{
                  fontFamily: 'var(--osd-font-body)',
                  fontSize: 22,
                  fill: last ? 'var(--osd-accent)' : MUTED,
                }}
              >
                {d.t}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const Figure = ({
  x,
  width,
  prefix,
  value,
  children,
}: {
  x: number;
  width: number;
  prefix?: string;
  value: string;
  children: ReactNode;
}) => (
  <div style={abs({ left: x, top: 660, width })}>
    <div
      style={{
        ...DISPLAY,
        fontSize: 104,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        fontVariantNumeric: 'lining-nums',
      }}
    >
      {prefix && (
        <span
          style={{ ...SMALLCAPS, fontSize: 26, color: 'var(--osd-text)', letterSpacing: '0.08em' }}
        >
          {prefix}
        </span>
      )}
      {value}
    </div>
    <p
      style={{
        margin: '22px 0 0',
        fontSize: 28,
        lineHeight: 1.45,
        color: PINE,
        textWrap: 'pretty',
      }}
    >
      {children}
    </p>
  </div>
);

const YearInNumbers: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="I.">The Year</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: M, top: 190 }), fontSize: 64 }}>The year in numbers</h2>
    <Steps>
      <Step>
        <div style={abs({ left: M - 8, top: 316 })}>
          <div style={{ ...DISPLAY, fontSize: 300, lineHeight: 0.84, letterSpacing: '-0.04em' }}>
            18.4
          </div>
        </div>
        <div style={abs({ left: col(5) - 10, top: 352, width: span(3) + 30 })}>
          <div style={{ ...ITALIC, fontSize: 56, lineHeight: 1 }}>tonnes</div>
          <p style={{ margin: '20px 0 0', fontSize: 30, lineHeight: 1.45 }}>
            of leaf bought from our six gardens,{' '}
            <span style={{ color: 'var(--osd-accent)' }}>7% more than in 2025.</span>
          </p>
        </div>
        <div style={abs({ left: M + span(12) - 520, top: 356 })}>
          <TonnesChart />
        </div>
        <div
          style={abs({
            left: M,
            top: 616,
            width: span(12),
            height: 1,
            background: 'var(--osd-text)',
          })}
        />
      </Step>
      <Step>
        <Figure x={col(0)} width={span(3) - 20} value="6">
          family gardens in four growing regions, from Taipei to Lishan.
        </Figure>
      </Step>
      <Step>
        <Figure x={col(3)} width={span(3) - 20} value="212">
          wholesale partners in nine countries, 31 of them new this year.
        </Figure>
      </Step>
      <Step>
        <Figure x={col(6)} width={span(3) - 10} prefix="NT$" value="1,180">
          average paid per kg of finished tea, 38% above the regional auction average.
        </Figure>
      </Step>
      <Step>
        <Figure x={col(9)} width={span(3)} value="0">
          pesticide residue detections in 146 independent lab tests.
        </Figure>
      </Step>
    </Steps>
  </Sheet>
);

const ELEV_Y = (m: number) => 900 - m * 0.2;

const FRONT_RIDGE: Pt[] = [
  [230, ELEV_Y(140)],
  [300, ELEV_Y(400)],
  [380, ELEV_Y(300)],
  [470, ELEV_Y(360)],
  [556, ELEV_Y(450)],
  [650, ELEV_Y(400)],
  [730, ELEV_Y(560)],
  [812, ELEV_Y(750)],
  [900, ELEV_Y(690)],
  [980, ELEV_Y(1020)],
  [1068, ELEV_Y(1400)],
  [1150, ELEV_Y(1260)],
  [1230, ELEV_Y(1430)],
  [1324, ELEV_Y(1600)],
  [1410, ELEV_Y(1520)],
  [1470, ELEV_Y(1780)],
  [1540, ELEV_Y(2050)],
  [1630, ELEV_Y(1880)],
  [1700, ELEV_Y(1960)],
  [1780, ELEV_Y(1700)],
];

const MID_RIDGE: Pt[] = [
  [230, ELEV_Y(380)],
  [340, ELEV_Y(620)],
  [460, ELEV_Y(560)],
  [600, ELEV_Y(820)],
  [720, ELEV_Y(760)],
  [860, ELEV_Y(1180)],
  [960, ELEV_Y(1080)],
  [1100, ELEV_Y(1640)],
  [1200, ELEV_Y(1500)],
  [1300, ELEV_Y(1860)],
  [1420, ELEV_Y(1740)],
  [1520, ELEV_Y(2140)],
  [1620, ELEV_Y(2040)],
  [1780, ELEV_Y(2180)],
];

const FAR_RIDGE: Pt[] = [
  [230, ELEV_Y(700)],
  [380, ELEV_Y(940)],
  [520, ELEV_Y(860)],
  [700, ELEV_Y(1260)],
  [840, ELEV_Y(1160)],
  [1000, ELEV_Y(1720)],
  [1140, ELEV_Y(1620)],
  [1280, ELEV_Y(2060)],
  [1400, ELEV_Y(1940)],
  [1560, ELEV_Y(2200)],
  [1680, ELEV_Y(2100)],
  [1780, ELEV_Y(2200)],
];

const ridgeArea = (p: Pt[]) => `${smoothOpen(p)}L1780,900L230,900Z`;

const Garden = ({
  x,
  metres,
  place,
  family,
  highlight,
}: {
  x: number;
  metres: number;
  place: string;
  family: string;
  highlight?: boolean;
}) => {
  const py = ELEV_Y(metres);
  const labelTop = 330;
  const ink = highlight ? 'var(--osd-accent)' : 'var(--osd-text)';
  return (
    <>
      <div
        style={abs({
          left: x,
          top: labelTop + 6,
          width: 1,
          height: py - labelTop - 12,
          background: ink,
          opacity: 0.55,
        })}
      />
      <div
        style={abs({
          left: x - 8,
          top: py - 8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${highlight ? 'var(--osd-accent)' : 'var(--osd-text)'}`,
          background: highlight ? 'var(--osd-accent)' : 'var(--osd-bg)',
          boxSizing: 'border-box',
        })}
      />
      <div style={abs({ left: x + 16, top: labelTop, width: 220 })}>
        <div style={{ ...DISPLAY, fontSize: 46, lineHeight: 1, color: ink }}>
          {metres.toLocaleString('en-US')}
          <span style={{ ...ITALIC, fontSize: 28, marginLeft: 6 }}>m</span>
        </div>
        <div style={{ fontSize: 26, lineHeight: 1.2, marginTop: 8 }}>{place}</div>
        <div style={{ ...SMALLCAPS, fontSize: 16, marginTop: 6 }}>{family}</div>
      </div>
    </>
  );
};

const Altitudes: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="I.">Where it grows</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: M, top: 188 }), fontSize: 84 }}>
      From 400 to 2,050 metres.
    </h2>
    <p
      style={{
        ...abs({ left: col(8) + 70, top: 196, width: span(4) - 70 }),
        ...ITALIC,
        margin: 0,
        fontSize: 28,
        lineHeight: 1.4,
        color: PINE,
      }}
    >
      Higher gardens grow colder and slower, and pick less. Prices follow the altitude.
    </p>
    <svg
      viewBox="0 0 1920 1080"
      width={1920}
      height={1080}
      style={abs({ left: 0, top: 0 })}
      aria-hidden="true"
    >
      <defs>
        <pattern id="yw-hatch" width="9" height="7" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0.5" x2="9" y2="0.5" stroke={RULE} strokeWidth="1" />
        </pattern>
      </defs>
      <line
        x1={230}
        x2={1780}
        y1={ELEV_Y(2000)}
        y2={ELEV_Y(2000)}
        stroke={RULE}
        strokeDasharray="2 6"
      />
      <line
        x1={230}
        x2={1780}
        y1={ELEV_Y(1500)}
        y2={ELEV_Y(1500)}
        stroke={RULE}
        strokeDasharray="2 6"
      />
      <line
        x1={230}
        x2={1780}
        y1={ELEV_Y(1000)}
        y2={ELEV_Y(1000)}
        stroke={RULE}
        strokeDasharray="2 6"
      />
      <line
        x1={230}
        x2={1780}
        y1={ELEV_Y(500)}
        y2={ELEV_Y(500)}
        stroke={RULE}
        strokeDasharray="2 6"
      />
      <path
        d={ridgeArea(FAR_RIDGE)}
        fill={PAPER_DARK}
        stroke={CELADON}
        strokeWidth={1}
        opacity={0.7}
      />
      <path d={ridgeArea(MID_RIDGE)} fill={PAPER_DARK} stroke={CELADON} strokeWidth={1.2} />
      <path d={ridgeArea(FRONT_RIDGE)} fill="var(--osd-bg)" />
      <path d={ridgeArea(FRONT_RIDGE)} fill="url(#yw-hatch)" />
      <path d={smoothOpen(FRONT_RIDGE)} fill="none" stroke="var(--osd-text)" strokeWidth={1.8} />
      <line x1={230} x2={1780} y1={900.5} y2={900.5} stroke="var(--osd-text)" strokeWidth={1.2} />
    </svg>
    <div style={{ ...SMALLCAPS, fontSize: 16, ...abs({ left: M, top: ELEV_Y(2000) - 11 }) }}>
      2,000
    </div>
    <div style={{ ...SMALLCAPS, fontSize: 16, ...abs({ left: M, top: ELEV_Y(1500) - 11 }) }}>
      1,500
    </div>
    <div style={{ ...SMALLCAPS, fontSize: 16, ...abs({ left: M, top: ELEV_Y(1000) - 11 }) }}>
      1,000
    </div>
    <div style={{ ...SMALLCAPS, fontSize: 16, ...abs({ left: M, top: ELEV_Y(500) - 11 }) }}>
      500
    </div>
    <div style={{ ...SMALLCAPS, fontSize: 16, ...abs({ left: M, top: ELEV_Y(0) - 11 }) }}>0</div>
    <Garden x={300} metres={400} place="Muzha, Taipei" family="Chang family" />
    <Garden x={556} metres={450} place="Pinglin" family="Wu family" />
    <Garden x={812} metres={750} place="Lugu / Dong Ding" family="Huang family" />
    <Garden x={1068} metres={1400} place="Alishan" family="Chen family" />
    <Garden x={1324} metres={1600} place="Shanlinxi" family="Lai family" />
    <Garden x={1540} metres={2050} place="Lishan" family="Ko family" highlight />
    <div style={{ ...ITALIC, ...abs({ left: 230, top: 914 }), fontSize: 22, color: MUTED }}>
      Gardens ordered by altitude, not by position on the map.
    </div>
  </Sheet>
);

const ContentsLine = ({ page, title }: { page: string; title: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 20,
      borderBottom: `1px solid ${RULE}`,
      padding: '10px 0 8px',
      fontSize: 26,
      lineHeight: 1.3,
    }}
  >
    <span style={{ ...ITALIC, color: 'var(--osd-accent)', width: 36 }}>{page}</span>
    <span>{title}</span>
  </div>
);

const Divider: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140, width: span(4) })}>
      <div style={{ ...SMALLCAPS, marginBottom: 10 }}>In this section</div>
      <ContentsLine page="06" title="Four flushes, one year" />
      <ContentsLine page="07" title="From green to amber" />
      <ContentsLine page="08" title="What we pay, and why" />
      <ContentsLine page="09" title="Ko Shu-fen, Lishan" />
    </div>
    <div style={abs({ left: M, top: 520 })}>
      <div style={{ ...DISPLAY, fontSize: 64, color: 'var(--osd-accent)', fontWeight: 500 }}>
        II.
      </div>
      <h2 style={{ ...DISPLAY, fontSize: 180, lineHeight: 0.96, marginTop: 16 }}>The Harvest</h2>
    </div>
    <div
      style={abs({
        left: M,
        top: 820,
        width: span(9),
        borderTop: `1px solid ${RULE}`,
        paddingTop: 20,
      })}
    >
      <p style={{ ...ITALIC, margin: 0, fontSize: 30, lineHeight: 1.45, color: PINE }}>
        Four flushes, seven teas, what we paid for them, and one grower near the top of the island.
      </p>
    </div>
    <Vertical size={210} style={abs({ right: M + 40, top: 150, color: 'var(--osd-text)' })}>
      採摘
    </Vertical>
    <div
      style={abs({
        right: M,
        top: 158,
        writingMode: 'vertical-rl',
        ...SMALLCAPS,
        fontSize: 18,
        letterSpacing: '0.22em',
      })}
    >
      Cǎi zhāi · to pick by hand
    </div>
  </Sheet>
);

const CAL = { cx: 560, cy: 570, r: 296 };

const polar = (r: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [CAL.cx + r * Math.sin(a), CAL.cy - r * Math.cos(a)];
};

const sector = (r0: number, r1: number, a0: number, a1: number) => {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0},${y0}A${r1},${r1} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${large} 0 ${x3},${y3}Z`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FlushArc = ({
  from,
  to,
  share,
  color,
}: {
  from: number;
  to: number;
  share: number;
  color: string;
}) => {
  const outer = CAL.r - 8;
  const inner = outer - share * 2.2;
  const [lx, ly] = polar(inner - 44, ((from + to) / 2) * 30);
  return (
    <>
      <path d={sector(inner, outer, from * 30 + 1.2, to * 30 - 1.2)} fill={color} />
      <text
        x={lx}
        y={ly + 14}
        textAnchor="middle"
        style={{ fontFamily: 'var(--osd-font-body)', fontSize: 38, fill: 'var(--osd-text)' }}
      >
        {share}%
      </text>
    </>
  );
};

const FlushCalendar = () => (
  <svg
    viewBox="0 0 1920 1080"
    width={1920}
    height={1080}
    style={abs({ left: 0, top: 0 })}
    aria-hidden="true"
  >
    <circle
      cx={CAL.cx}
      cy={CAL.cy}
      r={CAL.r}
      fill="none"
      stroke="var(--osd-text)"
      strokeWidth={1.2}
    />
    <circle cx={CAL.cx} cy={CAL.cy} r={CAL.r - 140} fill="none" stroke={RULE} strokeWidth={1} />
    {MONTHS.map((m, i) => {
      const [x0, y0] = polar(CAL.r, i * 30);
      const [x1, y1] = polar(CAL.r + 16, i * 30);
      const [tx, ty] = polar(CAL.r + 44, i * 30 + 15);
      return (
        <g key={m}>
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--osd-text)" strokeWidth={1.2} />
          <text
            x={tx}
            y={ty + 7}
            textAnchor="middle"
            style={{
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: '0.14em',
              fill: MUTED,
            }}
          >
            {m.toUpperCase()}
          </text>
        </g>
      );
    })}
    <FlushArc from={3} to={5} share={41} color="var(--osd-accent)" />
    <FlushArc from={5} to={7} share={16} color={CELADON} />
    <FlushArc from={8} to={10} share={19} color={PINE} />
    <FlushArc from={10} to={12} share={24} color="#7A5A3F" />
    <path
      id="yw-rest"
      d={`M${polar(CAL.r - 34, 6).join(',')}A${CAL.r - 34},${CAL.r - 34} 0 0 1 ${polar(CAL.r - 34, 84).join(',')}`}
      fill="none"
    />
    <text
      style={{ fontFamily: 'var(--osd-font-body)', fontStyle: 'italic', fontSize: 24, fill: MUTED }}
    >
      <textPath href="#yw-rest" startOffset="50%" textAnchor="middle">
        dormant · pruning
      </textPath>
    </text>
    <text
      x={CAL.cx}
      y={CAL.cy - 6}
      textAnchor="middle"
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 64,
        letterSpacing: '-0.02em',
        fill: 'var(--osd-text)',
      }}
    >
      2026
    </text>
    <text
      x={CAL.cx}
      y={CAL.cy + 36}
      textAnchor="middle"
      style={{
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: 16,
        letterSpacing: '0.16em',
        fill: MUTED,
      }}
    >
      SHARE OF VOLUME
    </text>
  </svg>
);

const FlushNote = ({
  x,
  y,
  swatch,
  season,
  months,
  share,
  children,
}: {
  x: number;
  y: number;
  swatch: string;
  season: string;
  months: string;
  share: number;
  children: ReactNode;
}) => (
  <div style={abs({ left: x, top: y, width: 310 })}>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        borderTop: `1px solid ${RULE}`,
        paddingTop: 16,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          background: swatch,
          display: 'inline-block',
          alignSelf: 'center',
        }}
      />
      <span style={{ ...SMALLCAPS, color: 'var(--osd-text)' }}>{season}</span>
      <span style={{ ...DISPLAY, fontSize: 40, marginLeft: 'auto', lineHeight: 1 }}>{share}%</span>
    </div>
    <div style={{ ...ITALIC, fontSize: 22, color: MUTED, marginTop: 2, paddingLeft: 28 }}>
      {months}
    </div>
    <p
      style={{
        margin: '12px 0 0',
        fontSize: 28,
        lineHeight: 1.42,
        color: PINE,
        textWrap: 'pretty',
      }}
    >
      {children}
    </p>
  </div>
);

const Flushes: Page = () => (
  <Sheet>
    <FlushCalendar />
    <div style={abs({ left: col(7), top: 140 })}>
      <Eyebrow n="II.">The Harvest</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: col(7), top: 190, width: span(5) }), fontSize: 84 }}>
      Four flushes,
      <br />
      one year.
    </h2>
    <FlushNote
      x={col(7)}
      y={430}
      swatch="var(--osd-accent)"
      season="Spring"
      months="April – May"
      share={41}
    >
      Florals and cream. Our best high-mountain lots.
    </FlushNote>
    <FlushNote
      x={col(7) + 350}
      y={430}
      swatch={CELADON}
      season="Summer"
      months="June – July"
      share={16}
    >
      Brisk, bold leaf. Oriental Beauty is bitten in June.
    </FlushNote>
    <FlushNote
      x={col(7)}
      y={680}
      swatch={PINE}
      season="Autumn"
      months="September – October"
      share={19}
    >
      Rounder and sweeter. Good value for house pots.
    </FlushNote>
    <FlushNote
      x={col(7) + 350}
      y={680}
      swatch="#7A5A3F"
      season="Winter"
      months="November – December"
      share={24}
    >
      Short days, light liquor, a long, sweet finish.
    </FlushNote>
  </Sheet>
);

const BAND = { x: M, w: 1640, top: 556, h: 46 };
const ox = (pct: number) => BAND.x + (pct / 100) * BAND.w;

const TeaMark = ({
  pct,
  side,
  tier,
  name,
  origin,
}: {
  pct: number;
  side: 'above' | 'below';
  tier: number;
  name: string;
  origin: string;
}) => {
  const x = ox(pct);
  const labelH = 92;
  const step = 104;
  const gap = 34;
  const top =
    side === 'above'
      ? BAND.top - gap - labelH - (tier - 1) * step
      : BAND.top + BAND.h + gap + (tier - 1) * step;
  const lineTop = side === 'above' ? top : BAND.top + BAND.h;
  const lineBottom = side === 'above' ? BAND.top : top + labelH;
  return (
    <>
      <div
        style={abs({
          left: x - 1,
          top: BAND.top - 6,
          width: 2,
          height: BAND.h + 12,
          background: 'var(--osd-text)',
        })}
      />
      <div
        style={abs({
          left: x,
          top: lineTop,
          width: 1,
          height: lineBottom - lineTop,
          background: 'var(--osd-text)',
        })}
      />
      <div style={abs({ left: x + 16, top, width: 380 })}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 19,
            letterSpacing: '0.1em',
            color: 'var(--osd-accent)',
            lineHeight: 1.2,
          }}
        >
          {pct}%
        </div>
        <div style={{ fontWeight: 500, fontSize: 31, lineHeight: 1.2, marginTop: 4 }}>{name}</div>
        <div style={{ ...ITALIC, fontSize: 23, lineHeight: 1.3, color: MUTED }}>{origin}</div>
      </div>
    </>
  );
};

const Oxidation: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="II.">The Harvest</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: M, top: 188 }), fontSize: 84 }}>
      From green to amber.
    </h2>
    <p
      style={{
        ...ITALIC,
        ...abs({ left: col(8) + 70, top: 196, width: span(4) - 70 }),
        margin: 0,
        fontSize: 28,
        lineHeight: 1.4,
        color: PINE,
      }}
    >
      Our seven teas, placed by how far the leaf is allowed to oxidise before it is fixed.
    </p>
    <div
      style={abs({
        left: BAND.x,
        top: BAND.top,
        width: BAND.w,
        height: BAND.h,
        background:
          'linear-gradient(90deg, #9DAF6E 0%, #B9B266 16%, #C9A456 30%, #C1873F 46%, #A4552A 66%, #84391F 84%, #5E2416 100%)',
      })}
    />
    <div
      style={{
        ...SMALLCAPS,
        ...abs({ left: BAND.x + 14, top: BAND.top + 12 }),
        fontSize: 16,
        color: '#F5F0E4',
      }}
    >
      0%
    </div>
    <div
      style={{
        ...SMALLCAPS,
        ...abs({ left: ox(50) - 20, top: BAND.top + 12 }),
        fontSize: 16,
        color: '#F5F0E4',
      }}
    >
      50%
    </div>
    <div
      style={{
        ...SMALLCAPS,
        ...abs({ right: M + 14, top: BAND.top + 12 }),
        fontSize: 16,
        color: '#F5F0E4',
      }}
    >
      100%
    </div>
    <div
      style={{
        ...ITALIC,
        ...abs({ left: M, top: BAND.top + BAND.h + 34 }),
        fontSize: 24,
        color: MUTED,
        lineHeight: 1.3,
      }}
    >
      Unoxidised:
      <br />
      green tea
    </div>
    <div
      style={{
        ...ITALIC,
        ...abs({ right: M, top: BAND.top - 34 - 62 }),
        fontSize: 24,
        color: MUTED,
        lineHeight: 1.3,
        textAlign: 'right',
      }}
    >
      Fully oxidised:
      <br />
      black tea
    </div>
    <TeaMark pct={12} side="above" tier={2} name="Wenshan Baozhong" origin="Pinglin · 450 m" />
    <TeaMark pct={22} side="above" tier={1} name="Alishan Jin Xuan" origin="Alishan · 1,400 m" />
    <TeaMark
      pct={45}
      side="above"
      tier={1}
      name="Muzha Tieguanyin"
      origin="Muzha · 400 m · heavy roast"
    />
    <TeaMark pct={18} side="below" tier={3} name="Lishan High Mountain" origin="Lishan · 2,050 m" />
    <TeaMark pct={25} side="below" tier={2} name="Shanlinxi" origin="Shanlinxi · 1,600 m" />
    <TeaMark pct={35} side="below" tier={1} name="Dong Ding" origin="Lugu · 750 m · medium roast" />
    <TeaMark
      pct={70}
      side="below"
      tier={1}
      name="Oriental Beauty"
      origin="Pinglin · 450 m · summer flush"
    />
  </Sheet>
);

const PX_PER_NT = 1080 / 2500;
const BAR_X = 470;

const PriceRow = ({
  y,
  region,
  family,
  ours,
  auction,
}: {
  y: number;
  region: string;
  family: string;
  ours: number;
  auction: number;
}) => {
  const premium = Math.round((ours / auction - 1) * 100);
  return (
    <div
      style={abs({ left: M, top: y, width: span(12), height: 88, borderTop: `1px solid ${RULE}` })}
    >
      <div style={abs({ left: 0, top: 14 })}>
        <div style={{ fontSize: 32, lineHeight: 1.1 }}>{region}</div>
        <div style={{ ...ITALIC, fontSize: 22, color: MUTED, marginTop: 2 }}>{family}</div>
      </div>
      <div
        style={abs({
          left: BAR_X - M,
          top: 20,
          width: ours * PX_PER_NT,
          height: 22,
          background: 'var(--osd-accent)',
        })}
      />
      <div
        style={{
          ...abs({ left: BAR_X - M + ours * PX_PER_NT + 12, top: 16 }),
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 21,
          lineHeight: 1.4,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {ours.toLocaleString('en-US')}
      </div>
      <div
        style={abs({
          left: BAR_X - M,
          top: 50,
          width: auction * PX_PER_NT,
          height: 10,
          background: CELADON,
        })}
      />
      <div
        style={{
          ...abs({ left: BAR_X - M + auction * PX_PER_NT + 12, top: 42 }),
          fontFamily: SANS,
          fontWeight: 500,
          fontSize: 19,
          lineHeight: 1.4,
          color: MUTED,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {auction.toLocaleString('en-US')}
      </div>
      <div
        style={{
          ...DISPLAY,
          ...abs({ right: 0, top: 18 }),
          fontSize: 42,
          color: 'var(--osd-accent)',
        }}
      >
        +{premium}%
      </div>
    </div>
  );
};

const PriceTick = ({ value, label = true }: { value: number; label?: boolean }) => (
  <>
    <div
      style={abs({
        left: BAR_X + value * PX_PER_NT,
        top: 384,
        width: 1,
        height: 532,
        background: RULE,
        opacity: 0.8,
      })}
    />
    {label && (
      <div
        style={{
          ...SMALLCAPS,
          ...abs({
            left: BAR_X + value * PX_PER_NT - 40,
            top: 352,
            width: 80,
            textAlign: 'center',
          }),
          fontSize: 16,
          letterSpacing: '0.08em',
        }}
      >
        {value.toLocaleString('en-US')}
      </div>
    )}
  </>
);

const Prices: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="II.">The Harvest</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: M, top: 188 }), fontSize: 84 }}>
      What we pay, and why.
    </h2>
    <p
      style={{
        ...ITALIC,
        ...abs({ left: col(8) + 70, top: 196, width: span(4) - 70 }),
        margin: 0,
        fontSize: 28,
        lineHeight: 1.4,
        color: PINE,
      }}
    >
      Paying above auction keeps families picking by hand and selling their best lots to us first.
    </p>
    <div style={{ ...abs({ left: M, top: 348 }), display: 'flex', gap: 28, alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          ...SMALLCAPS,
          fontSize: 16,
          color: 'var(--osd-text)',
        }}
      >
        <span style={{ width: 26, height: 14, background: 'var(--osd-accent)' }} />
        Yunwu
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          ...SMALLCAPS,
          fontSize: 16,
        }}
      >
        <span style={{ width: 26, height: 7, background: CELADON }} />
        Auction avg.
      </span>
    </div>
    <PriceTick value={0} label={false} />
    <PriceTick value={500} />
    <PriceTick value={1000} />
    <PriceTick value={1500} />
    <PriceTick value={2000} />
    <PriceTick value={2500} />
    <div style={{ ...SMALLCAPS, ...abs({ right: M, top: 352 }), fontSize: 16 }}>Premium</div>
    <PriceRow y={388} region="Lishan" family="Ko · 2,050 m" ours={2350} auction={1720} />
    <PriceRow y={476} region="Shanlinxi" family="Lai · 1,600 m" ours={1640} auction={1190} />
    <PriceRow y={564} region="Alishan" family="Chen · 1,400 m" ours={1420} auction={1030} />
    <PriceRow y={652} region="Muzha" family="Chang · 400 m" ours={1050} auction={760} />
    <PriceRow y={740} region="Dong Ding" family="Huang · 750 m" ours={980} auction={720} />
    <PriceRow y={828} region="Pinglin" family="Wu · 450 m" ours={860} auction={640} />
    <div
      style={abs({ left: M, top: 916, width: span(12), height: 1, background: 'var(--osd-text)' })}
    />
    <div style={{ ...ITALIC, ...abs({ left: M, top: 926 }), fontSize: 21, color: MUTED }}>
      NT$ per kg of finished tea. Regional averages: 2026 spring competition and auction results,
      Yunwu analysis.
    </div>
  </Sheet>
);

const APRIL_LOWS = [
  7.2, 6.8, 5.9, 4.6, 3.8, 4.1, 5.2, 6.0, 6.4, 5.1, 4.0, 3.2, 2.6, 3.4, 4.8, 5.6, 6.9, 7.4, 6.1,
  5.0, 4.4, 3.9, 4.7, 5.8, 6.6, 5.3, 4.2, 4.9, 5.7, 6.3,
];

const NightLows = () => {
  const w = 760;
  const h = 130;
  const y = (t: number) => h - 20 - (t / 10) * (h - 30);
  const bw = 13;
  const plot = w - 70;
  const pitch = plot / APRIL_LOWS.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line
        x1={0}
        x2={plot}
        y1={y(4)}
        y2={y(4)}
        stroke="var(--osd-accent)"
        strokeDasharray="3 5"
        strokeWidth={1.2}
      />
      <text
        x={plot + 12}
        y={y(4) + 7}
        style={{
          fontFamily: 'var(--osd-font-body)',
          fontStyle: 'italic',
          fontSize: 22,
          fill: 'var(--osd-accent)',
        }}
      >
        4 °C
      </text>
      {APRIL_LOWS.map((t, i) => (
        <rect
          key={`d${i + 1}`}
          x={i * pitch + (pitch - bw) / 2}
          y={y(t)}
          width={bw}
          height={y(0) - y(t)}
          fill={t <= 4 ? PINE : RULE}
        />
      ))}
      <line x1={0} x2={plot} y1={y(0) + 0.5} y2={y(0) + 0.5} stroke="var(--osd-text)" />
    </svg>
  );
};

const DataRow = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div style={{ borderTop: `1px solid ${RULE}`, padding: '14px 0 16px' }}>
    <div style={{ ...SMALLCAPS, fontSize: 17 }}>{label}</div>
    <div style={{ fontSize: 34, lineHeight: 1.2, marginTop: 4 }}>
      {value}
      {sub && <span style={{ ...ITALIC, fontSize: 24, color: MUTED, marginLeft: 10 }}>{sub}</span>}
    </div>
  </div>
);

const Grower: Page = () => (
  <Sheet>
    <Vertical size={150} style={abs({ left: M - 6, top: 140, color: 'var(--osd-accent)' })}>
      梨山
    </Vertical>
    <div
      style={{
        ...abs({ left: M + 172, top: 146, writingMode: 'vertical-rl' }),
        ...SMALLCAPS,
        fontSize: 16,
        letterSpacing: '0.22em',
      }}
    >
      Lí Shān · Pear Mountain
    </div>
    <div style={abs({ left: col(2), top: 140 })}>
      <Eyebrow n="II.">A grower</Eyebrow>
    </div>
    <blockquote
      style={{
        ...abs({ left: col(2), top: 214, width: span(6) + 60 }),
        margin: 0,
        ...ITALIC,
        fontSize: 64,
        lineHeight: 1.12,
        letterSpacing: '-0.01em',
        textIndent: '-0.4em',
        textWrap: 'pretty',
      }}
    >
      “In April the nights drop to four degrees. The bushes sulk for a week, and then they give you
      the sweetest leaf on the island.”
    </blockquote>
    <div style={abs({ left: col(2), top: 572 })}>
      <div style={{ ...DISPLAY, fontSize: 48 }}>Ko Shu-fen</div>
      <div style={{ ...SMALLCAPS, marginTop: 10 }}>Lishan, Taichung · 2,050 m</div>
    </div>
    <div style={abs({ left: col(2), top: 716 })}>
      <NightLows />
      <div style={{ ...ITALIC, fontSize: 21, color: MUTED, marginTop: 8, lineHeight: 1.3 }}>
        Nightly lows at the garden, 1–30 April 2026. Average 5.2 °C; below 4 °C on six nights.
      </div>
    </div>
    <div style={abs({ left: col(9), top: 214, width: span(3) })}>
      <DataRow label="Garden" value="2.1 ha" sub="terraced, east-facing" />
      <DataRow label="Cultivar" value="Qingxin oolong" />
      <DataRow label="Partnered since" value="2014" sub="12th harvest" />
      <DataRow label="Spring harvest" value="6 May 2026" sub="11 days late" />
      <DataRow label="Spring yield" value="1,240 kg" sub="finished tea" />
      <div style={{ borderTop: '1px solid var(--osd-text)' }} />
    </div>
  </Sheet>
);

const Measure = ({
  y,
  n,
  prefix,
  figure,
  unit,
  title,
  detail,
}: {
  y: number;
  n: string;
  prefix?: string;
  figure: string;
  unit?: string;
  title: string;
  detail: string;
}) => (
  <div
    style={abs({ left: M, top: y, width: span(12), height: 150, borderTop: `1px solid ${RULE}` })}
  >
    <div
      style={{ ...ITALIC, ...abs({ left: 0, top: 22 }), fontSize: 26, color: 'var(--osd-accent)' }}
    >
      {n}
    </div>
    <div
      style={{
        ...DISPLAY,
        ...abs({ left: 70, top: 14, width: span(4) - 50 }),
        fontSize: 116,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
      }}
    >
      {prefix && (
        <span
          style={{ ...SMALLCAPS, fontSize: 28, color: 'var(--osd-text)', letterSpacing: '0.08em' }}
        >
          {prefix}
        </span>
      )}
      {figure}
      {unit && <span style={{ ...ITALIC, fontSize: 44, letterSpacing: 0 }}>{unit}</span>}
    </div>
    <div style={abs({ left: span(4) + 60, top: 26, width: span(7) })}>
      <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 27, lineHeight: 1.4, color: PINE, marginTop: 8 }}>{detail}</div>
    </div>
  </div>
);

const Mountain: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="III.">The Mountain</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: M, top: 188 }), fontSize: 84 }}>
      Care for the mountain.
    </h2>
    <p
      style={{
        ...ITALIC,
        ...abs({ left: col(8) + 70, top: 196, width: span(4) - 70 }),
        margin: 0,
        fontSize: 28,
        lineHeight: 1.4,
        color: PINE,
      }}
    >
      Four changes this year, in the gardens and in our own warehouse.
    </p>
    <Measure
      y={336}
      n="i."
      figure="100"
      unit="%"
      title="Compostable retail packaging, since March"
      detail="Kraft pouches with a plant-based lining. Home-compostable in about twelve weeks."
    />
    <Measure
      y={486}
      n="ii."
      figure="81"
      unit="%"
      title="Of export volume now travels by sea"
      detail="Up from 54% in 2024. We keep air freight for spring lots under 20 kg."
    />
    <Measure
      y={636}
      n="iii."
      figure="11"
      unit="ha"
      title="Under cover crops, across three gardens"
      detail="Clover and peanut between rows at Wu, Huang and Lai; less runoff on the terraces."
    />
    <Measure
      y={786}
      n="iv."
      prefix="NT$"
      figure="2.4M"
      title="Paid into the growers’ replanting fund"
      detail="NT$2 on every kilo you order, matched by us. This year: 9,000 Qingxin seedlings."
    />
  </Sheet>
);

const TABLE_COLS = '520px 330px 210px 210px 150px 1fr';

const Status = ({ kind }: { kind: 'Open' | 'Limited' | 'Waitlist' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
    <svg width={14} height={14} viewBox="0 0 14 14" aria-hidden="true">
      {kind === 'Open' && <circle cx={7} cy={7} r={6} fill="var(--osd-text)" />}
      {kind === 'Limited' && (
        <>
          <circle cx={7} cy={7} r={5.5} fill="none" stroke="var(--osd-accent)" strokeWidth={1.4} />
          <path d="M7,1.5A5.5,5.5 0 0 1 7,12.5Z" fill="var(--osd-accent)" />
        </>
      )}
      {kind === 'Waitlist' && (
        <circle cx={7} cy={7} r={5.5} fill="none" stroke={MUTED} strokeWidth={1.4} />
      )}
    </svg>
    <span
      style={{
        ...SMALLCAPS,
        fontSize: 17,
        color:
          kind === 'Open' ? 'var(--osd-text)' : kind === 'Limited' ? 'var(--osd-accent)' : MUTED,
      }}
    >
      {kind}
    </span>
  </span>
);

const NUM: CSSProperties = {
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontSize: 32,
};

const AllocRow = ({
  tea,
  style: note,
  origin,
  kg,
  nt,
  us,
  status,
}: {
  tea: string;
  style: string;
  origin: string;
  kg: number;
  nt: number;
  us: number;
  status: 'Open' | 'Limited' | 'Waitlist';
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: TABLE_COLS,
      alignItems: 'baseline',
      borderTop: `1px solid ${RULE}`,
      padding: '13px 0 11px',
    }}
  >
    <div style={{ fontSize: 32, lineHeight: 1.25 }}>
      {tea}
      <span style={{ ...ITALIC, fontSize: 24, color: MUTED, marginLeft: 12 }}>{note}</span>
    </div>
    <div style={{ fontSize: 26, color: PINE }}>{origin}</div>
    <div style={NUM}>{kg.toLocaleString('en-US')}</div>
    <div style={NUM}>{nt.toLocaleString('en-US')}</div>
    <div style={{ ...NUM, color: MUTED }}>{us}</div>
    <div style={{ paddingLeft: 56 }}>
      <Status kind={status} />
    </div>
  </div>
);

const HEAD: CSSProperties = { ...SMALLCAPS, fontSize: 16 };

const Allocations: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="IV.">Next year</Eyebrow>
    </div>
    <h2 style={{ ...DISPLAY, ...abs({ left: M, top: 188 }), fontSize: 84 }}>2027 allocations</h2>
    <p
      style={{
        ...ITALIC,
        ...abs({ left: col(8) + 70, top: 196, width: span(4) - 70 }),
        margin: 0,
        fontSize: 28,
        lineHeight: 1.4,
        color: PINE,
      }}
    >
      Wholesale prices, per kg of finished tea, ex-warehouse Taipei.
    </p>
    <div style={abs({ left: M, top: 336, width: span(12) })}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: TABLE_COLS,
          paddingBottom: 12,
          borderBottom: '1px solid var(--osd-text)',
        }}
      >
        <div style={HEAD}>Tea</div>
        <div style={HEAD}>Origin</div>
        <div style={{ ...HEAD, textAlign: 'right' }}>Available kg</div>
        <div style={{ ...HEAD, textAlign: 'right' }}>NT$ / kg</div>
        <div style={{ ...HEAD, textAlign: 'right' }}>US$ / kg</div>
        <div style={{ ...HEAD, paddingLeft: 56 }}>Status</div>
      </div>
      <AllocRow
        tea="Wenshan Baozhong"
        style="spring"
        origin="Pinglin · Wu"
        kg={640}
        nt={1480}
        us={46}
        status="Open"
      />
      <AllocRow
        tea="Lishan High Mountain"
        style="spring"
        origin="Lishan · Ko"
        kg={260}
        nt={3900}
        us={120}
        status="Waitlist"
      />
      <AllocRow
        tea="Alishan Jin Xuan"
        style="spring"
        origin="Alishan · Chen"
        kg={520}
        nt={2350}
        us={72}
        status="Open"
      />
      <AllocRow
        tea="Shanlinxi"
        style="spring"
        origin="Shanlinxi · Lai"
        kg={310}
        nt={2800}
        us={86}
        status="Limited"
      />
      <AllocRow
        tea="Dong Ding"
        style="medium roast"
        origin="Lugu · Huang"
        kg={780}
        nt={1650}
        us={51}
        status="Open"
      />
      <AllocRow
        tea="Muzha Tieguanyin"
        style="heavy roast"
        origin="Muzha · Chang"
        kg={240}
        nt={1850}
        us={57}
        status="Limited"
      />
      <AllocRow
        tea="Oriental Beauty"
        style="summer"
        origin="Pinglin · Wu"
        kg={90}
        nt={3600}
        us={111}
        status="Waitlist"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: TABLE_COLS,
          alignItems: 'baseline',
          borderTop: '1px solid var(--osd-text)',
          padding: '14px 0 0',
        }}
      >
        <div style={{ ...ITALIC, fontSize: 26 }}>Total available for allocation</div>
        <div />
        <div style={{ ...NUM, fontWeight: 500 }}>2,840</div>
        <div />
        <div />
        <div style={{ ...ITALIC, fontSize: 21, color: MUTED, paddingLeft: 56 }}>US$ at NT$32.5</div>
      </div>
    </div>
  </Sheet>
);

const Milestone = ({ date, label }: { date: string; label: string }) => (
  <div style={{ borderTop: '1px solid var(--osd-text)', paddingTop: 14 }}>
    <div style={{ ...DISPLAY, fontSize: 40 }}>{date}</div>
    <div style={{ ...SMALLCAPS, fontSize: 17, marginTop: 8 }}>{label}</div>
  </div>
);

const Colophon: Page = () => (
  <Sheet>
    <div style={abs({ left: M, top: 140 })}>
      <Eyebrow n="IV.">Ordering</Eyebrow>
    </div>
    <h2
      style={{
        ...DISPLAY,
        ...abs({ left: M, top: 196, width: span(9) }),
        fontSize: 124,
        lineHeight: 1,
      }}
    >
      Orders for 2027 open{' '}
      <span style={{ fontStyle: 'italic', color: 'var(--osd-accent)' }}>1 December.</span>
    </h2>
    <div
      style={abs({
        left: M,
        top: 520,
        width: span(9),
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        columnGap: 40,
      })}
    >
      <Milestone date="1 Dec" label="Allocations open" />
      <Milestone date="15 Jan" label="Requests close" />
      <Milestone date="1 Feb" label="Confirmed by letter" />
      <Milestone date="Late May" label="Spring lots ship" />
    </div>
    <div style={abs({ left: M, top: 712, width: span(4) })}>
      <div style={SMALLCAPS}>Orders & tastings</div>
      <div style={{ fontSize: 38, lineHeight: 1.2, marginTop: 12 }}>orders@yunwu.example</div>
      <div style={{ fontSize: 26, lineHeight: 1.45, color: PINE, marginTop: 10 }}>
        Tasting room in Dadaocheng, Taipei.
        <br />
        Samples of every lot, on request.
      </div>
    </div>
    <div style={abs({ left: 770, top: 712, width: 560 })}>
      <div style={SMALLCAPS}>Colophon</div>
      <p
        style={{
          ...ITALIC,
          margin: '12px 0 0',
          fontSize: 22,
          lineHeight: 1.5,
          color: MUTED,
          textWrap: 'pretty',
        }}
      >
        Set in Newsreader, Hanken Grotesk and Noto Serif TC. Figures to 30&nbsp;September&nbsp;2026.
        A paper edition of 300 is printed on uncoated 120 gsm stock for partners who prefer it.
      </p>
    </div>
    <Vertical
      size={124}
      style={abs({ right: M + 24, top: 170, color: 'var(--osd-text)', letterSpacing: '0.02em' })}
    >
      一期一會
    </Vertical>
    <div style={abs({ right: M, top: 760, width: 360, textAlign: 'right' })}>
      <div style={{ ...ITALIC, fontSize: 26, lineHeight: 1.4, color: PINE }}>
        One time, one meeting.
        <br />
        Each harvest happens once.
      </div>
    </div>
  </Sheet>
);

export const meta: SlideMeta = {
  title: 'Yunwu Tea Co. — The 2026 Harvest Report',
  createdAt: '2026-10-11T10:43:59.267Z',
};

export default [
  Cover,
  Letter,
  YearInNumbers,
  Altitudes,
  Divider,
  Flushes,
  Oxidation,
  Prices,
  Grower,
  Mountain,
  Allocations,
  Colophon,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Thank everyone for coming, and for pouring our tea for another year. This is our seventh harvest report.
In twenty minutes: what grew, what we paid for it, and what you can order for 2027.`,
  `Read the pull quote aloud; it is the whole year in one line.
Frost on Lishan until mid-April, a picking eleven days late, and better tea because of it. Volumes up 7%, every lab test clean.`,
  `Let the 18.4 tonnes land first, then click through the four figures.
Stress the NT$1,180 a kilo and the 38% above auction: that premium is why the families sell us their best lots. Zero residue detections in 146 tests.`,
  `Six gardens, from the Chang family at 400 metres in Muzha to Ko Shu-fen at 2,050 metres on Lishan.
Altitude is the simplest way to understand our price list: colder and slower means smaller yields and more aroma.`,
  `Section two: the harvest itself. Pause here and take questions on the year so far.`,
  `Spring is 41% of the year and carries the high-mountain lots, so that is where allocations get tight.
Winter is small but fast to sell out. If you want a winter lot, tell us in December, not March.`,
  `Read the band from left to right: light, floral teas on the green end, roasted and honeyed on the amber end.
For a café menu, one tea from each third covers most customers: Baozhong or Lishan, Dong Ding, and Oriental Beauty.`,
  `We pay between 34% and 38% above the regional auction average in every region.
The largest absolute gap is Lishan: NT$2,350 against 1,720. That money is what keeps hand-picking viable at 2,000 metres.`,
  `Ko Shu-fen has worked with us since 2014. Her spring picking came on 6 May, eleven days late, and gave 1,240 kg.
The chart shows the nights she is talking about: six below four degrees.`,
  `Four practical changes. Packaging is fully compostable since March. Four-fifths of exports go by sea now.
NT$2 on every kilo you order goes into the replanting fund, and we match it. This year that bought 9,000 seedlings.`,
  `Three teas are open, two limited, two on a waitlist: Lishan and Oriental Beauty.
If either matters to your menu, put the request in on the first day.`,
  `Allocations open 1 December and close 15 January; confirmations go out by 1 February.
Write to orders@yunwu.example, or come and taste in Dadaocheng. Thank you.`,
];

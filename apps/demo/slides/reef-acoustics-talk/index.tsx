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
  palette: { bg: '#FBFAF6', text: '#161514', accent: '#1A4B7A' },
  fonts: {
    display: '"Spectral", "Iowan Old Style", Georgia, serif',
    body: '"Spectral", "Iowan Old Style", Georgia, serif',
  },
  typeScale: { hero: 116, body: 32 },
  radius: 3,
};

const INK = 'var(--osd-text)';
const PAPER = 'var(--osd-bg)';
const ACCENT = 'var(--osd-accent)';
const MUTED = '#5F5B54';
const FAINT = '#A29D93';
const TINT = '#ECE8DF';
const SC_FONT = '"Spectral SC", "Spectral", Georgia, serif';
const MATH_FONT = '"STIX Two Math", "Cambria Math", serif';

const SLIDE_ID = 'reef-acoustics-talk';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;1,400&family=Spectral+SC:wght@400;600&family=STIX+Two+Math&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes ra-fade { from { opacity: 0 } to { opacity: 1 } }
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

export const transition: SlideTransition = {
  duration: 200,
  exit: { duration: 200, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: { duration: 200, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const NUM: CSSProperties = { fontVariantNumeric: 'lining-nums tabular-nums' };
const SC: CSSProperties = { fontFamily: SC_FONT };
const fillInk = { fill: INK };
const fillAccent = { fill: ACCENT };
const fillPaper = { fill: PAPER };

const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const normal = (rand: () => number) => {
  const u = Math.max(1e-9, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

type Grp = 'h' | 'r' | 'd';

const circlePath = (x: number, y: number, r: number) =>
  `M${r1(x - r)} ${r1(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const squarePath = (x: number, y: number, s: number) =>
  `M${r1(x - s / 2)} ${r1(y - s / 2)}h${s}v${s}h${-s}z`;
const triPath = (x: number, y: number, s: number) =>
  `M${r1(x)} ${r1(y - s * 0.62)}L${r1(x + s * 0.58)} ${r1(y + s * 0.42)}L${r1(x - s * 0.58)} ${r1(y + s * 0.42)}z`;

const smoothClosed = (pts: [number, number][]) => {
  const n = pts.length;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${p2[0]} ${p2[1]}`;
  }
  return `${d}z`;
};

const scaleAbout = (pts: [number, number][], k: number): [number, number][] => {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map((p) => [r1(cx + (p[0] - cx) * k), r1(cy + (p[1] - cy) * k)]);
};

const Header = ({ section }: { section: string }) => (
  <>
    <div
      style={abs(120, 50, {
        width: 1680,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 22,
        lineHeight: 1,
      })}
    >
      <span>
        <span style={{ fontStyle: 'italic' }}>Listening for Recovery</span>
        <span style={{ color: FAINT, margin: '0 16px' }}>·</span>
        <span style={SC}>Okonkwo, Lindqvist, Raman &amp; Ahuna</span>
      </span>
      <SectionLabel text={section} />
    </div>
    <div style={abs(120, 88, { width: 1680, height: 1, background: INK })} />
  </>
);

const LINING: CSSProperties = { fontFamily: 'var(--osd-font-body)', ...NUM };

const SectionLabel = ({ text }: { text: string }) => {
  const m = /^(§\d+)\s(.*)$/.exec(text);
  return (
    <span style={{ color: MUTED }}>
      {m && <span style={{ ...LINING, marginRight: 10 }}>{m[1]}</span>}
      <span style={SC}>{m ? m[2] : text}</span>
    </span>
  );
};

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={abs(120, 1010, {
        width: 1680,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 20,
        lineHeight: 1,
        color: MUTED,
      })}
    >
      <span style={SC}>Ocean Soundscapes Symposium 2026 · Honolulu</span>
      <span style={{ ...NUM, color: INK, fontSize: 22 }}>
        {current} / {total}
      </span>
    </div>
  );
};

const Sheet = ({ section, children }: { section?: string; children: ReactNode }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: PAPER,
      color: INK,
      fontFamily: 'var(--osd-font-body)',
      fontSize: 'var(--osd-size-body)',
    }}
  >
    {section && <Header section={section} />}
    {children}
    <Footer />
  </div>
);

const SecHead = ({ n, children, top = 136 }: { n: string; children: ReactNode; top?: number }) => (
  <h2
    style={abs(120, top, {
      margin: 0,
      width: 1680,
      fontFamily: 'var(--osd-font-display)',
      fontSize: 58,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.005em',
      display: 'flex',
      alignItems: 'baseline',
    })}
  >
    <span style={{ ...NUM, color: ACCENT, fontWeight: 400, marginRight: 30 }}>§{n}</span>
    <span>{children}</span>
  </h2>
);

const Caption = ({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div style={{ fontSize: 24, lineHeight: 1.45, ...style }}>
    <span style={{ ...SC, fontWeight: 600 }}>{label.split(' ')[0]}</span>{' '}
    <span style={{ ...LINING, fontWeight: 600, marginRight: 12 }}>{label.split(' ')[1]}</span>
    {children}
  </div>
);

const Cite = ({ n }: { n: string }) => (
  <span style={{ ...LINING, color: ACCENT, whiteSpace: 'nowrap' }}>[{n}]</span>
);

const Fn = ({ n }: { n: string }) => (
  <sup style={{ ...LINING, fontSize: '0.6em', color: ACCENT, marginLeft: 2, lineHeight: 0 }}>
    {n}
  </sup>
);

const Footnote = ({ n, children, top = 916 }: { n: string; children: ReactNode; top?: number }) => (
  <div style={abs(120, top, { width: 1500 })}>
    <div style={{ width: 320, height: 1, background: INK, marginBottom: 12 }} />
    <div style={{ fontSize: 20, lineHeight: 1.45, color: MUTED }}>
      <sup style={{ fontSize: 14, color: ACCENT, marginRight: 6 }}>{n}</sup>
      {children}
    </div>
  </div>
);

const Mark = ({ kind, size = 22 }: { kind: Grp; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    style={{ display: 'inline-block', verticalAlign: '-0.1em', overflow: 'visible' }}
    aria-hidden="true"
  >
    {kind === 'h' && <circle cx="10" cy="10" r="7.5" style={fillInk} />}
    {kind === 'r' && <rect x="3" y="3" width="14" height="14" style={fillAccent} />}
    {kind === 'd' && (
      <path
        d="M10 2.5 L17.5 16.5 L2.5 16.5 Z"
        style={{ fill: PAPER, stroke: INK, strokeWidth: 1.8 }}
      />
    )}
  </svg>
);

const XL = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <text x={x} y={y} fontSize={20} textAnchor="middle" fill="currentColor" style={NUM}>
    {children}
  </text>
);

const YL = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <text x={x} y={y + 7} fontSize={20} textAnchor="end" fill="currentColor" style={NUM}>
    {children}
  </text>
);

const AxisTitle = ({
  x,
  y,
  rotate,
  children,
}: {
  x: number;
  y: number;
  rotate?: boolean;
  children: ReactNode;
}) => (
  <text
    x={x}
    y={y}
    fontSize={22}
    textAnchor="middle"
    fill="currentColor"
    fontStyle="italic"
    transform={rotate ? `rotate(-90 ${x} ${y})` : undefined}
  >
    {children}
  </text>
);

const boxTicks = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  xs: number[],
  ys: number[],
  len = 9,
) => {
  let d = '';
  for (const x of xs) d += `M${r1(x)} ${y1}v${-len}M${r1(x)} ${y0}v${len}`;
  for (const y of ys) d += `M${x0} ${r1(y)}h${len}M${x1} ${r1(y)}h${-len}`;
  return d;
};

const PlotBox = ({
  x0,
  y0,
  x1,
  y1,
  ticks,
}: {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  ticks: string;
}) => (
  <>
    <rect
      x={x0}
      y={y0}
      width={x1 - x0}
      height={y1 - y0}
      style={{ fill: 'none', stroke: INK, strokeWidth: 1.4 }}
    />
    <path d={ticks} style={{ fill: 'none', stroke: INK, strokeWidth: 1.2 }} />
  </>
);

const TITLE_WAVE = (() => {
  const rand = mulberry32(7);
  const n = 480;
  const w = 760;
  const bursts = [0.12, 0.2, 0.28, 0.47, 0.55, 0.74, 0.8, 0.86];
  let d = 'M0 40';
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    let env = 0.08;
    for (const b of bursts) env += 0.9 * Math.exp(-((u - b) ** 2) / 0.00045);
    env *= 0.5 + 0.5 * Math.sin(Math.PI * u);
    const y = 40 + (rand() * 2 - 1) * 34 * Math.min(1, env);
    d += `L${r1((u * w) as number)} ${r1(y)}`;
  }
  return d;
})();

const Aff = ({ children }: { children: ReactNode }) => (
  <sup style={{ fontSize: '0.58em', marginLeft: 2, lineHeight: 0, ...NUM }}>{children}</sup>
);

const TitlePage: Page = () => {
  const live = useIsActivePage();
  const fade: CSSProperties = live ? { animation: `ra-fade 700ms ${EASE_OUT} both` } : {};
  return (
    <Sheet>
      <div
        style={abs(0, 150, {
          width: 1920,
          textAlign: 'center',
          ...SC,
          fontSize: 26,
          letterSpacing: '0.04em',
          color: MUTED,
        })}
      >
        Ocean Soundscapes Symposium 2026 · Session 4B, Restoration Acoustics
      </div>
      <h1
        style={abs(0, 232, {
          width: 1920,
          margin: 0,
          textAlign: 'center',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-0.015em',
        })}
      >
        Listening for Recovery
      </h1>
      <div
        style={abs(0, 380, {
          width: 1920,
          textAlign: 'center',
          fontSize: 50,
          fontStyle: 'italic',
          lineHeight: 1.2,
        })}
      >
        Passive Acoustic Monitoring of Restored Coral Reefs
      </div>
      <svg
        width={760}
        height={80}
        viewBox="0 0 760 80"
        style={abs(580, 476, { overflow: 'visible', ...fade })}
        aria-hidden="true"
      >
        <path d={TITLE_WAVE} style={{ fill: 'none', stroke: ACCENT, strokeWidth: 1.4 }} />
      </svg>
      <div style={abs(0, 600, { width: 1920, textAlign: 'center', fontSize: 38, lineHeight: 1.3 })}>
        Maya R. Okonkwo<Aff>1</Aff>
        <span style={{ margin: '0 22px', color: FAINT }}>·</span>
        Tomás H. Lindqvist<Aff>2</Aff>
        <span style={{ margin: '0 22px', color: FAINT }}>·</span>
        Priya Raman<Aff>1,3</Aff>
        <span style={{ margin: '0 22px', color: FAINT }}>·</span>
        Daniel K. Ahuna<Aff>3</Aff>
      </div>
      <div
        style={abs(0, 684, {
          width: 1920,
          textAlign: 'center',
          fontSize: 26,
          fontStyle: 'italic',
          lineHeight: 1.55,
          color: MUTED,
        })}
      >
        <div>
          <Aff>1</Aff> School of Ocean &amp; Earth Science, Halloway University
        </div>
        <div>
          <Aff>2</Aff> Marine Bioacoustics Group, Instituto Oceánico del Pacífico
        </div>
        <div>
          <Aff>3</Aff> Kalea Reef Restoration Programme, Flores Sea
        </div>
      </div>
      <div style={abs(0, 860, { width: 1920, display: 'flex', justifyContent: 'center' })}>
        <div style={{ width: 120, height: 1, background: INK }} />
      </div>
      <div
        style={abs(0, 888, {
          width: 1920,
          textAlign: 'center',
          ...SC,
          fontSize: 24,
          letterSpacing: '0.04em',
        })}
      >
        Honolulu · 9 November 2026
      </div>
    </Sheet>
  );
};

const Item = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 22, fontSize: 32, lineHeight: 1.45 }}>
    <span style={{ color: ACCENT, flex: 'none', width: 18 }}>•</span>
    <span>{children}</span>
  </div>
);

const FIG1 = { x0: 86, x1: 776, y0: 24, y1: 444, max: 50 };
const f1x = (i: number) => FIG1.x0 + i * 46 + 9;
const f1y = (v: number) => FIG1.y1 - (v / FIG1.max) * (FIG1.y1 - FIG1.y0);

const YearBar = ({ i, total, mon }: { i: number; total: number; mon: number }) => (
  <g>
    <rect
      x={f1x(i)}
      y={f1y(total)}
      width={28}
      height={f1y(0) - f1y(total)}
      style={{ fill: PAPER, stroke: INK, strokeWidth: 1.3 }}
    />
    <rect
      x={f1x(i)}
      y={f1y(mon)}
      width={28}
      height={f1y(0) - f1y(mon)}
      style={{ ...fillAccent, stroke: INK, strokeWidth: 1.3 }}
    />
  </g>
);

const Motivation: Page = () => (
  <Sheet section="§1 Introduction">
    <SecHead n="1">Restoration is outpacing evaluation</SecHead>
    <div style={abs(120, 268, { width: 790, display: 'flex', flexDirection: 'column', gap: 30 })}>
      <Item>
        Reef restoration is scaling fast: 332 projects began in our region since 2010.
        <Fn n="1" />
      </Item>
      <Item>
        Success is judged by coral survival at hand-over, not by habitat function <Cite n="1, 2" />.
      </Item>
      <Item>Diver surveys are costly, infrequent and grounded by weather.</Item>
      <Item>
        Healthy reefs are loud, and their sound reflects who lives there <Cite n="5, 6" />.
      </Item>
      <div style={{ fontSize: 36, fontStyle: 'italic', lineHeight: 1.35, marginTop: 18 }}>
        Can we evaluate recovery by <span style={{ color: ACCENT }}>listening</span>?
      </div>
    </div>
    <svg
      width={800}
      height={500}
      viewBox="0 0 800 500"
      style={abs(1000, 252, { color: INK, overflow: 'visible' })}
      aria-label="Bar chart of restoration projects per year"
    >
      <PlotBox
        x0={FIG1.x0}
        y0={FIG1.y0}
        x1={FIG1.x1}
        y1={FIG1.y1}
        ticks={boxTicks(
          FIG1.x0,
          FIG1.y0,
          FIG1.x1,
          FIG1.y1,
          [],
          [f1y(10), f1y(20), f1y(30), f1y(40)],
        )}
      />
      <YearBar i={0} total={4} mon={1} />
      <YearBar i={1} total={6} mon={1} />
      <YearBar i={2} total={7} mon={2} />
      <YearBar i={3} total={9} mon={2} />
      <YearBar i={4} total={12} mon={3} />
      <YearBar i={5} total={15} mon={3} />
      <YearBar i={6} total={19} mon={4} />
      <YearBar i={7} total={22} mon={5} />
      <YearBar i={8} total={27} mon={6} />
      <YearBar i={9} total={31} mon={7} />
      <YearBar i={10} total={24} mon={5} />
      <YearBar i={11} total={33} mon={7} />
      <YearBar i={12} total={38} mon={8} />
      <YearBar i={13} total={41} mon={8} />
      <YearBar i={14} total={44} mon={8} />
      <YL x={76} y={f1y(0)}>
        0
      </YL>
      <YL x={76} y={f1y(10)}>
        10
      </YL>
      <YL x={76} y={f1y(20)}>
        20
      </YL>
      <YL x={76} y={f1y(30)}>
        30
      </YL>
      <YL x={76} y={f1y(40)}>
        40
      </YL>
      <YL x={76} y={f1y(50)}>
        50
      </YL>
      <XL x={f1x(0) + 14} y={474}>
        2010
      </XL>
      <XL x={f1x(2) + 14} y={474}>
        2012
      </XL>
      <XL x={f1x(4) + 14} y={474}>
        2014
      </XL>
      <XL x={f1x(6) + 14} y={474}>
        2016
      </XL>
      <XL x={f1x(8) + 14} y={474}>
        2018
      </XL>
      <XL x={f1x(10) + 14} y={474}>
        2020
      </XL>
      <XL x={f1x(12) + 14} y={474}>
        2022
      </XL>
      <XL x={f1x(14) + 14} y={474}>
        2024
      </XL>
      <AxisTitle x={22} y={234} rotate>
        Projects started per year
      </AxisTitle>
      <rect
        x={112}
        y={50}
        width={20}
        height={20}
        style={{ ...fillAccent, stroke: INK, strokeWidth: 1.3 }}
      />
      <text x={144} y={67} fontSize={21} fill="currentColor">
        monitored &gt; 12 months
      </text>
      <rect
        x={112}
        y={84}
        width={20}
        height={20}
        style={{ fill: PAPER, stroke: INK, strokeWidth: 1.3 }}
      />
      <text x={144} y={101} fontSize={21} fill="currentColor">
        not monitored after hand-over
      </text>
    </svg>
    <Caption label="Figure 1." style={abs(1000, 772, { width: 800 })}>
      Restoration projects started per year in the regional registry (<i>n</i>&nbsp;=&nbsp;332).
      Only 70 of them (21 %) report monitoring beyond the first year.
    </Caption>
    <Footnote n="1">
      Coral Triangle Restoration Registry, accessed March 2026; projects covering ≥ 100 m² of reef.
    </Footnote>
  </Sheet>
);

const Tally = ({ kind, label, note }: { kind: Grp; label: string; note: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', gap: 14 }}>
      <Mark kind={kind} size={30} />
      <Mark kind={kind} size={30} />
      <Mark kind={kind} size={30} />
      <Mark kind={kind} size={30} />
    </div>
    <div style={{ fontSize: 30, lineHeight: 1.2 }}>{label}</div>
    <div style={{ fontSize: 22, lineHeight: 1.35, color: MUTED, fontStyle: 'italic' }}>{note}</div>
  </div>
);

const Hypothesis = ({ n, name, children }: { n: string; name: string; children: ReactNode }) => (
  <div style={{ width: 780, fontSize: 32, lineHeight: 1.5 }}>
    <span style={{ ...SC, fontWeight: 600 }}>Hypothesis</span>{' '}
    <span style={{ ...LINING, fontWeight: 600 }}>{n}</span>{' '}
    <span style={{ fontStyle: 'italic' }}>({name}).</span> {children}
  </div>
);

const Question: Page = () => (
  <Sheet section="§1 Introduction">
    <SecHead n="1.1">Research question</SecHead>
    <div
      style={abs(120, 278, {
        width: 1640,
        paddingLeft: 36,
        borderLeft: `3px solid ${ACCENT}`,
        fontSize: 46,
        lineHeight: 1.36,
      })}
    >
      <span style={{ ...SC, fontWeight: 600, fontSize: 42 }}>Research Question.</span>{' '}
      <span style={{ fontStyle: 'italic' }}>
        Does the soundscape of a restored reef converge on that of a healthy reference reef — and on
        what timescale?
      </span>
    </div>
    <div style={abs(120, 486, { width: 1680, display: 'flex', justifyContent: 'space-between' })}>
      <Hypothesis n="1" name="convergence">
        Restored sites become acoustically distinct from degraded sites within six months, then
        approach healthy sites.
      </Hypothesis>
      <Hypothesis n="2" name="validity">
        Acoustic indices track diver-survey fish density and coral cover with <i>r</i> &gt; 0.5.
      </Hypothesis>
    </div>
    <div style={abs(120, 700, { width: 1680, height: 1, background: FAINT })} />
    <div style={abs(120, 732, { fontSize: 30, lineHeight: 1.4, width: 430 })}>
      <span style={{ ...SC, fontWeight: 600 }}>Design.</span> Twelve sites in three conditions,
      recorded for 18 months.
    </div>
    <div style={abs(640, 736, { display: 'flex', gap: 96 })}>
      <Tally kind="h" label="Healthy reference" note="never damaged" />
      <Tally kind="r" label="Restored" note="frames installed Feb 2024" />
      <Tally kind="d" label="Degraded" note="unrestored rubble" />
    </div>
  </Sheet>
);

const MAP_MAIN: [number, number][] = [
  [520, 330],
  [560, 290],
  [630, 272],
  [700, 280],
  [762, 300],
  [788, 345],
  [772, 400],
  [722, 432],
  [650, 446],
  [590, 440],
  [540, 416],
  [506, 376],
];
const MAP_BATU: [number, number][] = [
  [282, 196],
  [302, 168],
  [346, 162],
  [382, 184],
  [376, 216],
  [336, 232],
  [296, 226],
];
const MAP_SEDAP: [number, number][] = [
  [822, 166],
  [846, 142],
  [886, 146],
  [906, 172],
  [880, 196],
  [840, 196],
];
const MAP_KECIL: [number, number][] = [
  [396, 470],
  [410, 452],
  [440, 455],
  [450, 476],
  [426, 492],
  [402, 487],
];
const MAP_SHOAL_W: [number, number][] = [
  [176, 120],
  [200, 100],
  [236, 106],
  [244, 132],
  [214, 150],
  [182, 144],
];
const MAP_SHOAL_E: [number, number][] = [
  [960, 318],
  [984, 296],
  [1018, 306],
  [1022, 340],
  [994, 360],
  [964, 348],
];
const MAP_ISOBATH: [number, number][] = [
  [200, 64],
  [430, 64],
  [700, 108],
  [930, 56],
  [1046, 150],
  [1048, 400],
  [960, 560],
  [700, 572],
  [430, 574],
  [214, 524],
  [164, 330],
];

const MAP_PATHS = {
  main: smoothClosed(MAP_MAIN),
  batu: smoothClosed(MAP_BATU),
  sedap: smoothClosed(MAP_SEDAP),
  kecil: smoothClosed(MAP_KECIL),
  flats: [
    smoothClosed(scaleAbout(MAP_MAIN, 1.28)),
    smoothClosed(scaleAbout(MAP_BATU, 1.5)),
    smoothClosed(scaleAbout(MAP_SEDAP, 1.55)),
    smoothClosed(scaleAbout(MAP_KECIL, 1.7)),
    smoothClosed(MAP_SHOAL_W),
    smoothClosed(MAP_SHOAL_E),
  ].join(''),
  isobath: smoothClosed(MAP_ISOBATH),
};

const NEATLINE = (() => {
  const x0 = 90;
  const y0 = 20;
  const x1 = 1070;
  const y1 = 590;
  const w = 8;
  const seg = 70;
  let d = '';
  let k = 0;
  for (let x = x0; x < x1; x += seg, k++) {
    if (k % 2 === 0) {
      const len = Math.min(seg, x1 - x);
      d += `M${x} ${y0}h${len}v${w}h${-len}z`;
      d += `M${x} ${y1 - w}h${len}v${w}h${-len}z`;
    }
  }
  k = 0;
  for (let y = y0; y < y1; y += seg, k++) {
    if (k % 2 === 1) {
      const len = Math.min(seg, y1 - y);
      d += `M${x0} ${y}h${w}v${len}h${-w}z`;
      d += `M${x1 - w} ${y}h${w}v${len}h${-w}z`;
    }
  }
  return d;
})();

const Site = ({
  x,
  y,
  kind,
  label,
  dx = 14,
  dy = 7,
}: {
  x: number;
  y: number;
  kind: Grp;
  label: string;
  dx?: number;
  dy?: number;
}) => (
  <g>
    {kind === 'h' && (
      <path d={circlePath(x, y, 8)} style={{ ...fillInk, stroke: PAPER, strokeWidth: 2 }} />
    )}
    {kind === 'r' && (
      <path d={squarePath(x, y, 16)} style={{ ...fillAccent, stroke: PAPER, strokeWidth: 2 }} />
    )}
    {kind === 'd' && (
      <path d={triPath(x, y, 19)} style={{ fill: PAPER, stroke: INK, strokeWidth: 2 }} />
    )}
    <text
      x={x + dx}
      y={y + dy}
      fontSize={20}
      fill="currentColor"
      textAnchor={dx < 0 ? 'end' : 'start'}
      style={{ ...SC, fontWeight: 600, paintOrder: 'stroke', stroke: PAPER, strokeWidth: 4 }}
    >
      {label}
    </text>
  </g>
);

const Sounding = ({ x, y, d }: { x: number; y: number; d: string }) => (
  <text x={x} y={y} fontSize={18} fontStyle="italic" fill={FAINT} textAnchor="middle" style={NUM}>
    {d}
  </text>
);

const PlaceName = ({
  x,
  y,
  size = 20,
  children,
}: {
  x: number;
  y: number;
  size?: number;
  children: ReactNode;
}) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    textAnchor="middle"
    fontStyle="italic"
    fill="currentColor"
    style={{ paintOrder: 'stroke', stroke: TINT, strokeWidth: 4 }}
  >
    {children}
  </text>
);

const LegendRow = ({ kind, label, note }: { kind: Grp; label: string; note: string }) => (
  <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
    <div style={{ paddingTop: 6 }}>
      <Mark kind={kind} size={28} />
    </div>
    <div>
      <div style={{ fontSize: 30, lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 22, lineHeight: 1.4, color: MUTED, fontStyle: 'italic' }}>{note}</div>
    </div>
  </div>
);

const SpecRow = ({ k, v, last }: { k: string; v: ReactNode; last?: boolean }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      fontSize: 28,
      lineHeight: 1.3,
      padding: '11px 0',
      borderBottom: last ? `2px solid ${INK}` : undefined,
    }}
  >
    <span style={{ color: MUTED }}>{k}</span>
    <span style={NUM}>{v}</span>
  </div>
);

const Sites: Page = () => (
  <Sheet section="§2 Methods">
    <SecHead n="2.1">Study sites</SecHead>
    <svg
      width={1080}
      height={640}
      viewBox="0 0 1080 640"
      style={abs(120, 236, { color: INK, overflow: 'visible' })}
      aria-label="Map of the Kalea Archipelago with twelve recording sites"
    >
      <rect x={90} y={20} width={980} height={570} style={{ fill: PAPER }} />
      <path
        d={MAP_PATHS.isobath}
        style={{
          fill: 'none',
          stroke: MUTED,
          strokeWidth: 1.6,
          strokeDasharray: '1 6',
          strokeLinecap: 'round',
        }}
      />
      <path
        d={MAP_PATHS.flats}
        style={{ fill: 'none', stroke: INK, strokeWidth: 1.1, strokeDasharray: '7 5' }}
      />
      <path
        d={`${MAP_PATHS.main}${MAP_PATHS.batu}${MAP_PATHS.sedap}${MAP_PATHS.kecil}`}
        style={{ fill: TINT, stroke: INK, strokeWidth: 1.6 }}
      />
      <path d="M588 424h9v9h-9zM602 418h9v9h-9zM598 432h8v8h-8zM612 430h9v8h-9z" style={fillInk} />
      <path d="M618 442 L626 474" style={{ stroke: INK, strokeWidth: 3 }} />
      <PlaceName x={650} y={366} size={26}>
        Pulau Kalea
      </PlaceName>
      <PlaceName x={648} y={418}>
        Kalea
      </PlaceName>
      <PlaceName x={332} y={204}>
        Batu Lima
      </PlaceName>
      <PlaceName x={864} y={177}>
        Sedap
      </PlaceName>
      <text
        x={210}
        y={180}
        fontSize={18}
        textAnchor="middle"
        fontStyle="italic"
        fill={MUTED}
        style={{ paintOrder: 'stroke', stroke: PAPER, strokeWidth: 5 }}
      >
        Gosong Biru
      </text>
      <text x={992} y={392} fontSize={18} textAnchor="middle" fontStyle="italic" fill={MUTED}>
        Taka Lamun
      </text>
      <text
        x={1022}
        y={478}
        fontSize={18}
        fontStyle="italic"
        fill={MUTED}
        textAnchor="middle"
        style={{ paintOrder: 'stroke', stroke: PAPER, strokeWidth: 6 }}
      >
        20 m
      </text>
      <PlaceName x={423} y={478} size={18}>
        Kecil
      </PlaceName>
      <Sounding x={300} y={420} d="14" />
      <Sounding x={180} y={250} d="22" />
      <Sounding x={540} y={150} d="18" />
      <Sounding x={760} y={150} d="11" />
      <Sounding x={980} y={230} d="16" />
      <Sounding x={900} y={410} d="9" />
      <Sounding x={640} y={548} d="12" />
      <Sounding x={330} y={512} d="27" />
      <Sounding x={960} y={468} d="31" />
      <Sounding x={430} y={380} d="8" />
      <Site x={208} y={126} kind="h" label="H1" />
      <Site x={369} y={144} kind="h" label="H2" />
      <Site x={901} y={128} kind="h" label="H3" />
      <Site x={992} y={328} kind="h" label="H4" />
      <Site x={614} y={247} kind="r" label="R1" />
      <Site x={816} y={341} kind="r" label="R2" />
      <Site x={338} y={249} kind="r" label="R3" dx={-14} />
      <Site x={473} y={321} kind="r" label="R4" dx={-14} />
      <Site x={563} y={462} kind="d" label="D1" dx={-16} />
      <Site x={732} y={452} kind="d" label="D2" dx={16} />
      <Site x={430} y={506} kind="d" label="D3" dx={-16} />
      <Site x={870} y={214} kind="d" label="D4" dx={-16} />
      <path d={NEATLINE} style={fillInk} />
      <rect
        x={90}
        y={20}
        width={980}
        height={570}
        style={{ fill: 'none', stroke: INK, strokeWidth: 1.4 }}
      />
      <rect
        x={98}
        y={28}
        width={964}
        height={554}
        style={{ fill: 'none', stroke: INK, strokeWidth: 0.8 }}
      />
      <path d="M134 108 L134 56" style={{ stroke: INK, strokeWidth: 1.6 }} />
      <path d="M134 46 L142 72 L134 66 L126 72 Z" style={fillInk} />
      <text x={134} y={128} fontSize={20} textAnchor="middle" fill="currentColor" style={SC}>
        n
      </text>
      <rect x={122} y={556} width={60} height={8} style={fillInk} />
      <rect
        x={182}
        y={556}
        width={60}
        height={8}
        style={{ fill: PAPER, stroke: INK, strokeWidth: 1.2 }}
      />
      <text x={122} y={546} fontSize={18} textAnchor="middle" fill="currentColor" style={NUM}>
        0
      </text>
      <text x={182} y={546} fontSize={18} textAnchor="middle" fill="currentColor" style={NUM}>
        1
      </text>
      <text x={242} y={546} fontSize={18} textAnchor="middle" fill="currentColor" style={NUM}>
        2
      </text>
      <text x={256} y={546} fontSize={18} fill="currentColor" fontStyle="italic">
        km
      </text>
      <XL x={250} y={618}>
        120°12′E
      </XL>
      <XL x={580} y={618}>
        120°15′E
      </XL>
      <XL x={910} y={618}>
        120°18′E
      </XL>
      <YL x={80} y={150}>
        7°08′S
      </YL>
      <YL x={80} y={460}>
        7°11′S
      </YL>
    </svg>
    <div style={abs(1300, 252, { width: 500, display: 'flex', flexDirection: 'column', gap: 30 })}>
      <LegendRow kind="h" label="Healthy reference" note="H1–H4 · outer shoals, > 40 % coral" />
      <LegendRow kind="r" label="Restored" note="R1–R4 · reef-star frames, Feb 2024" />
      <LegendRow kind="d" label="Degraded" note="D1–D4 · blast-fishing rubble" />
    </div>
    <div style={abs(1300, 620, { width: 500, borderTop: `2px solid ${INK}` })}>
      <SpecRow k="Depth" v="6–9 m" />
      <SpecRow k="Nearest site" v="1.5–2.8 km" />
      <SpecRow k="Recorders" v="1 per site" last />
    </div>
    <Caption label="Figure 2." style={abs(120, 888, { width: 1080 })}>
      The Kalea Archipelago, Flores Sea. Dashed: reef-flat edge; dotted: 20 m isobath. Conditions
      are interleaved so no single shoreline drives the contrast.
    </Caption>
  </Sheet>
);

const RUBBLE = (() => {
  const rand = mulberry32(31);
  let d = '';
  for (let i = 0; i < 90; i++) {
    const x = 50 + rand() * 940;
    const y = 498 + rand() * 54;
    const s = 4 + rand() * 7;
    const a = rand() * Math.PI;
    const pts: string[] = [];
    for (let k = 0; k < 5; k++) {
      const ang = a + (k / 5) * Math.PI * 2;
      const rr = s * (0.6 + rand() * 0.5);
      pts.push(`${r1(x + Math.cos(ang) * rr)} ${r1(y + Math.sin(ang) * rr * 0.6)}`);
    }
    d += `M${pts.join('L')}z`;
  }
  return d;
})();

const STAR_FRAMES = (() => {
  const base = 486;
  let d = '';
  for (const x of [170, 270, 370, 470, 800, 900]) {
    d += `M${x} ${base}L${x + 50} ${base - 66}L${x + 100} ${base}`;
    d += `M${x + 22} ${base}L${x + 50} ${base - 66}L${x + 78} ${base}`;
    d += `M${x + 13} ${base - 17}L${x + 87} ${base - 17}`;
  }
  return d;
})();

const SURFACE = `M40 62 q12 -6 24 0${' t24 0'.repeat(39)}`;

const Coral = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <path
    d="M0 0V-16M0 -8L-11 -20V-32M-11 -24L-19 -31M0 -10L11 -24V-36M11 -28L19 -36M0 -16V-30M0 -24L-6 -32"
    transform={`translate(${x} ${y}) scale(${s})`}
    vectorEffect="non-scaling-stroke"
    style={{
      fill: 'none',
      stroke: INK,
      strokeWidth: 3,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }}
  />
);

const Fish = ({ x, y, flip }: { x: number; y: number; flip?: boolean }) => (
  <path
    d="M0 0 C 10 -12, 30 -12, 40 0 C 30 12, 10 12, 0 0 Z M40 0 L 54 -10 L 52 0 L 54 10 Z"
    transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}
    style={{ fill: PAPER, stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' }}
  />
);

const Letter = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <text
    x={x}
    y={y}
    fontSize={24}
    fontStyle="italic"
    fill="currentColor"
    style={{ paintOrder: 'stroke', stroke: PAPER, strokeWidth: 5 }}
  >
    {children}
  </text>
);

const DutyBlock = ({ m }: { m: number }) => (
  <rect x={m * 9} y={10} width={18} height={30} style={fillAccent} />
);

const Deployment: Page = () => (
  <Sheet section="§2 Methods">
    <SecHead n="2.2">Hydrophone deployment</SecHead>
    <svg
      width={1040}
      height={570}
      viewBox="0 0 1040 570"
      style={abs(120, 240, { color: INK, overflow: 'visible' })}
      aria-label="Cross-section of recorder deployment on a restored reef"
    >
      <path d={SURFACE} style={{ fill: 'none', stroke: INK, strokeWidth: 1.6 }} />
      <text x={1000} y={40} fontSize={20} textAnchor="end" fontStyle="italic" fill={MUTED}>
        sea surface
      </text>
      <path d="M72 72 L72 476" style={{ stroke: INK, strokeWidth: 1.2 }} />
      <path d="M72 70 l-6 14 h12 z M72 478 l-6 -14 h12 z" style={fillInk} />
      <text
        x={58}
        y={274}
        fontSize={22}
        fontStyle="italic"
        textAnchor="middle"
        fill="currentColor"
        transform="rotate(-90 58 274)"
      >
        6–9 m
      </text>
      <path
        d="M40 486 C 200 476, 340 496, 520 488 S 820 480, 1000 490 L1000 560 L40 560 Z"
        style={{ fill: TINT, stroke: INK, strokeWidth: 1.6 }}
      />
      <path d={RUBBLE} style={{ fill: 'none', stroke: MUTED, strokeWidth: 1.1 }} />
      <path
        d={STAR_FRAMES}
        style={{ fill: 'none', stroke: INK, strokeWidth: 2.6, strokeLinejoin: 'round' }}
      />
      <Coral x={220} y={420} s={0.7} />
      <Coral x={320} y={420} s={1.3} />
      <Coral x={420} y={420} s={1} />
      <Coral x={520} y={420} s={1.5} />
      <Coral x={850} y={420} s={1.15} />
      <Coral x={950} y={420} s={0.8} />
      <Fish x={300} y={300} />
      <Fish x={460} y={250} flip />
      <Fish x={850} y={200} />
      <path
        d="M560 342 A 172 172 0 0 1 904 342 M610 342 A 122 122 0 0 1 854 342 M660 342 A 72 72 0 0 1 804 342"
        style={{ fill: 'none', stroke: ACCENT, strokeWidth: 1.6, strokeDasharray: '6 7' }}
      />
      <path d="M660 494 L660 352" style={{ stroke: INK, strokeWidth: 4, strokeLinecap: 'round' }} />
      <path d="M652 494 L668 494 L660 512 Z" style={fillInk} />
      <rect
        x={612}
        y={330}
        width={110}
        height={26}
        rx={13}
        style={{ fill: PAPER, stroke: INK, strokeWidth: 2 }}
      />
      <path d="M646 326 v34 M690 326 v34" style={{ stroke: INK, strokeWidth: 2 }} />
      <circle cx={732} cy={343} r={9} style={{ ...fillAccent, stroke: INK, strokeWidth: 1.6 }} />
      <path d="M760 343 L760 490" style={{ stroke: INK, strokeWidth: 1 }} />
      <path d="M752 343 h16 M752 490 h16" style={{ stroke: INK, strokeWidth: 1.2 }} />
      <text x={772} y={426} fontSize={20} fontStyle="italic" fill="currentColor">
        0.5 m
      </text>
      <path d="M786 286 L740 336" style={{ stroke: INK, strokeWidth: 1 }} />
      <Letter x={790} y={282}>
        (a)
      </Letter>
      <path d="M586 290 L626 330" style={{ stroke: INK, strokeWidth: 1 }} />
      <Letter x={556} y={286}>
        (b)
      </Letter>
      <path d="M612 440 L656 432" style={{ stroke: INK, strokeWidth: 1 }} />
      <Letter x={576} y={448}>
        (c)
      </Letter>
      <path d="M146 446 L186 470" style={{ stroke: INK, strokeWidth: 1 }} />
      <Letter x={108} y={448}>
        (d)
      </Letter>
      <Letter x={150} y={540}>
        (e)
      </Letter>
      <text x={914} y={336} fontSize={20} fontStyle="italic" style={fillAccent}>
        ≈ 100 m
      </text>
    </svg>
    <Caption label="Figure 3." style={abs(120, 826, { width: 1040 })}>
      Deployment at a restored site, not to scale. (a) hydrophone; (b) recorder housing; (c) steel
      stake; (d) reef-star frames; (e) rubble. Arcs: nominal listening range.
      <Fn n="2" />
    </Caption>
    <Caption label="Table 1." style={abs(1260, 248, { width: 540 })}>
      Recording configuration.
    </Caption>
    <div style={abs(1260, 300, { width: 540, borderTop: `2px solid ${INK}` })}>
      <SpecRow k="Sensitivity" v="−176 dB re 1 V/µPa" />
      <SpecRow k="Sampling" v="48 kHz, 16 bit" />
      <SpecRow k="Duty cycle" v="2 min every 10" />
      <SpecRow k="Deployment" v="Mar 2024 – Sep 2025" />
      <SpecRow k="Servicing" v="every 3 months" />
      <SpecRow k="Recorder-days" v="6,480" last />
    </div>
    <div style={abs(1260, 720, { ...SC, fontSize: 22, color: MUTED })}>Duty cycle, one hour</div>
    <svg
      width={540}
      height={84}
      viewBox="0 0 540 84"
      style={abs(1260, 756, { color: INK, overflow: 'visible' })}
      aria-hidden="true"
    >
      <rect
        x={0}
        y={10}
        width={540}
        height={30}
        style={{ fill: 'none', stroke: INK, strokeWidth: 1.2 }}
      />
      <DutyBlock m={0} />
      <DutyBlock m={10} />
      <DutyBlock m={20} />
      <DutyBlock m={30} />
      <DutyBlock m={40} />
      <DutyBlock m={50} />
      <XL x={0} y={70}>
        0
      </XL>
      <XL x={270} y={70}>
        30
      </XL>
      <text x={540} y={70} fontSize={20} textAnchor="end" fill="currentColor" style={NUM}>
        60 min
      </text>
    </svg>
    <Footnote n="2">
      For fish calls at R2, from playback trials assuming spherical spreading and 98 dB re 1 µPa
      ambient noise.
    </Footnote>
  </Sheet>
);

const Glyph = ({ children }: { children: ReactNode }) => (
  <svg
    width={180}
    height={70}
    viewBox="0 0 180 70"
    style={{ display: 'block', margin: '18px auto 16px', color: INK, overflow: 'visible' }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const GLYPH_WAVE = (() => {
  const rand = mulberry32(3);
  let d = 'M0 35';
  for (let i = 1; i <= 90; i++) {
    const u = i / 90;
    const env =
      0.25 +
      0.75 * Math.exp(-((u - 0.35) ** 2) / 0.004) +
      0.6 * Math.exp(-((u - 0.72) ** 2) / 0.003);
    d += `L${r1(u * 180)} ${r1(35 + (rand() * 2 - 1) * 28 * Math.min(1, env))}`;
  }
  return d;
})();

const GLYPH_GRID = (() => {
  const rand = mulberry32(11);
  const cells: string[] = ['', '', '', ''];
  for (let c = 0; c < 12; c++) {
    for (let r = 0; r < 5; r++) {
      const v = rand() * (r < 2 ? 1 : 0.7) + (c === 4 || c === 8 ? 0.5 : 0);
      const lvl = Math.min(3, Math.floor(v * 3));
      cells[lvl] += `M${c * 15} ${r * 14}h15v14h-15z`;
    }
  }
  return cells;
})();

const Stage = ({
  n,
  title,
  detail,
  volume,
  children,
}: {
  n: string;
  title: string;
  detail: ReactNode;
  volume: ReactNode;
  children: ReactNode;
}) => (
  <div style={{ width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div
      style={{
        width: 240,
        height: 290,
        boxSizing: 'border-box',
        border: `1.5px solid ${INK}`,
        borderRadius: 'var(--osd-radius)',
        background: PAPER,
        padding: '22px 18px',
        textAlign: 'center',
      }}
    >
      <div style={{ ...SC, ...NUM, fontSize: 22, color: ACCENT, lineHeight: 1 }}>stage {n}</div>
      <div style={{ fontSize: 31, fontWeight: 600, lineHeight: 1.2, marginTop: 12 }}>{title}</div>
      <Glyph>{children}</Glyph>
      <div style={{ fontSize: 21, lineHeight: 1.4, color: MUTED, fontStyle: 'italic' }}>
        {detail}
      </div>
    </div>
    <div style={{ ...NUM, fontSize: 22, lineHeight: 1.35, marginTop: 18, textAlign: 'center' }}>
      {volume}
    </div>
  </div>
);

const Arrow = () => (
  <svg width={48} height={290} viewBox="0 0 48 290" aria-hidden="true" style={{ flex: 'none' }}>
    <path d="M8 145 H34" style={{ stroke: INK, strokeWidth: 1.6 }} />
    <path d="M42 145 L30 138 L30 152 Z" style={fillInk} />
  </svg>
);

const Pipeline: Page = () => (
  <Sheet section="§2 Methods">
    <SecHead n="2.3">Signal-processing pipeline</SecHead>
    <div
      style={abs(120, 238, { fontSize: 32, lineHeight: 1.45, fontStyle: 'italic', color: MUTED })}
    >
      From 9.8 TB of raw audio to one number per site, per band, per day.
      <Fn n="3" />
    </div>
    <div style={abs(120, 330, { width: 1680, display: 'flex', alignItems: 'flex-start' })}>
      <Stage n="1" title="Calibrate" detail="end-to-end gain, per recorder" volume="851,328 clips">
        <path d={GLYPH_WAVE} style={{ fill: 'none', stroke: INK, strokeWidth: 1.3 }} />
      </Stage>
      <Arrow />
      <Stage n="2" title="Screen" detail="tonal-line vessel detector [10]" volume="− 8.8 % clips">
        <path d={GLYPH_WAVE} style={{ fill: 'none', stroke: FAINT, strokeWidth: 1.3 }} />
        <rect
          x={98}
          y={2}
          width={64}
          height={66}
          style={{ fill: 'none', stroke: ACCENT, strokeWidth: 2 }}
        />
        <path d="M104 8 L156 62 M156 8 L104 62" style={{ stroke: ACCENT, strokeWidth: 2 }} />
      </Stage>
      <Arrow />
      <Stage
        n="3"
        title="STFT"
        detail="Hann, N = 2048, 50 % overlap"
        volume="1,025 bins × 5,624 frames"
      >
        <path d={GLYPH_GRID[0]} style={{ fill: TINT }} />
        <path d={GLYPH_GRID[1]} style={{ fill: FAINT }} />
        <path d={GLYPH_GRID[2]} style={{ fill: MUTED }} />
        <path d={GLYPH_GRID[3]} style={fillInk} />
      </Stage>
      <Arrow />
      <Stage
        n="4"
        title="Band-split"
        detail="fish 0.05–1 kHz; shrimp 2–20 kHz"
        volume="41 + 769 bins"
      >
        <rect
          x={10}
          y={4}
          width={160}
          height={24}
          style={{ fill: 'none', stroke: INK, strokeWidth: 1.5 }}
        />
        <rect
          x={10}
          y={42}
          width={160}
          height={24}
          style={{ ...fillAccent, stroke: INK, strokeWidth: 1.5 }}
        />
        <text
          x={90}
          y={22}
          fontSize={17}
          textAnchor="middle"
          fontStyle="italic"
          fill="currentColor"
        >
          shrimp
        </text>
        <text x={90} y={60} fontSize={17} textAnchor="middle" fontStyle="italic" style={fillPaper}>
          fish
        </text>
      </Stage>
      <Arrow />
      <Stage n="5" title="Indices" detail="ACI, band SPL, snap rate" volume="776,411 × 3 values">
        <text
          x={90}
          y={58}
          fontSize={64}
          textAnchor="middle"
          fill="currentColor"
          style={{ fontFamily: MATH_FONT }}
        >
          ∑
        </text>
      </Stage>
      <Arrow />
      <Stage
        n="6"
        title="Model"
        detail="mixed effects, site as random [9]"
        volume="5,912 site-days"
      >
        <path d="M6 64 H176 M6 64 V4" style={{ fill: 'none', stroke: INK, strokeWidth: 1.2 }} />
        <path
          d="M10 58 C 50 26, 90 16, 172 12"
          style={{ fill: 'none', stroke: ACCENT, strokeWidth: 2.2 }}
        />
        <path
          d={`${squarePath(30, 50, 8)}${squarePath(62, 34, 8)}${squarePath(96, 22, 8)}${squarePath(132, 20, 8)}${squarePath(160, 12, 8)}`}
          style={fillInk}
        />
      </Stage>
    </div>
    <Caption label="Figure 4." style={abs(120, 760, { width: 1500 })}>
      Processing chain. Numbers beneath each stage give the data volume leaving it; stages 1–5 run
      per two-minute clip, stage 6 on daily site means.
    </Caption>
    <Footnote n="3" top={900}>
      Stages 1–5 in Python 3.12 (<i>scipy.signal</i>), 41 h on one 32-core workstation; stage 6 in R
      4.4 with <i>lme4</i> <Cite n="9" />.
    </Footnote>
  </Sheet>
);

const Var = ({ children }: { children: ReactNode }) => (
  <span style={{ fontStyle: 'italic' }}>{children}</span>
);

const Op = ({ children, pad = 0.22 }: { children: ReactNode; pad?: number }) => (
  <span style={{ fontFamily: MATH_FONT, margin: `0 ${pad}em` }}>{children}</span>
);

const Sub = ({ children }: { children: ReactNode }) => (
  <sub style={{ fontSize: '0.6em', verticalAlign: '-0.35em', lineHeight: 0, marginLeft: '0.04em' }}>
    {children}
  </sub>
);

const Sup = ({ children }: { children: ReactNode }) => (
  <sup style={{ fontSize: '0.6em', verticalAlign: '0.55em', lineHeight: 0, marginLeft: '0.04em' }}>
    {children}
  </sup>
);

const Frac = ({ num, den }: { num: ReactNode; den: ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '0 0.12em',
    }}
  >
    <span style={{ padding: '0 0.18em 0.12em', whiteSpace: 'nowrap' }}>{num}</span>
    <span style={{ alignSelf: 'stretch', borderTop: '2px solid currentColor' }} />
    <span style={{ padding: '0.1em 0.18em 0', whiteSpace: 'nowrap' }}>{den}</span>
  </span>
);

const BigSum = ({ lo, hi }: { lo: ReactNode; hi: ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '0 0.18em',
      lineHeight: 1,
    }}
  >
    <span style={{ fontSize: '0.56em', marginBottom: '0.3em' }}>{hi}</span>
    <span style={{ fontFamily: MATH_FONT, fontSize: '1.9em', lineHeight: 1.05 }}>∑</span>
    <span style={{ fontSize: '0.56em', marginTop: '0.15em' }}>{lo}</span>
  </span>
);

const InlineSum = ({ lo, hi }: { lo: ReactNode; hi: ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '0.12em' }}>
    <span style={{ fontFamily: MATH_FONT, fontSize: '1.15em', lineHeight: 1 }}>∑</span>
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        fontSize: '0.56em',
        lineHeight: 1.15,
        marginLeft: '0.08em',
      }}
    >
      <span>{hi}</span>
      <span style={{ height: '0.5em' }} />
      <span>{lo}</span>
    </span>
  </span>
);

const Ikj = ({ j }: { j: ReactNode }) => (
  <span>
    <Var>I</Var>
    <Sub>
      <Var>k</Var>,{j}
    </Sub>
  </span>
);

const EqNo = ({ n }: { n: string }) => (
  <span style={{ ...NUM, fontSize: 36, fontFamily: 'var(--osd-font-body)' }}>({n})</span>
);

const Where = ({ sym, children }: { sym: ReactNode; children: ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 31, lineHeight: 1.5 }}>
    <span style={{ width: 140, textAlign: 'right', fontSize: 36, flex: 'none' }}>{sym}</span>
    <span style={{ width: 70, textAlign: 'center', color: FAINT, flex: 'none' }}>—</span>
    <span>{children}</span>
  </div>
);

const Equation: Page = () => (
  <Sheet section="§2 Methods">
    <SecHead n="2.4">Acoustic indices</SecHead>
    <div style={abs(120, 238, { fontSize: 32, lineHeight: 1.45 })}>
      Each clip is summarised by the Acoustic Complexity Index <Cite n="3" />, computed separately
      in each band <Var>b</Var>:
    </div>
    <div
      style={abs(120, 316, {
        width: 1680,
        height: 190,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 54,
        whiteSpace: 'nowrap',
      })}
    >
      <span>
        ACI
        <Sub>
          <Var>b</Var>
        </Sub>
      </span>
      <Op pad={0.4}>=</Op>
      <BigSum
        lo={
          <span>
            <Var>k</Var>
            <Op pad={0.1}>=</Op>1
          </span>
        }
        hi={<Var>q</Var>}
      />
      <Frac
        num={
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <InlineSum
              lo={
                <span>
                  <Var>j</Var>
                  <Op pad={0.08}>=</Op>1
                </span>
              }
              hi={
                <span>
                  <Var>n</Var>
                  <Op pad={0.08}>−</Op>1
                </span>
              }
            />
            <Op pad={0.06}>|</Op>
            <Ikj
              j={
                <span>
                  <Var>j</Var>+1
                </span>
              }
            />
            <Op>−</Op>
            <Ikj j={<Var>j</Var>} />
            <Op pad={0.06}>|</Op>
          </span>
        }
        den={
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <InlineSum
              lo={
                <span>
                  <Var>j</Var>
                  <Op pad={0.08}>=</Op>1
                </span>
              }
              hi={<Var>n</Var>}
            />
            <Ikj j={<Var>j</Var>} />
          </span>
        }
      />
    </div>
    <div style={abs(1700, 390, { width: 100, textAlign: 'right' })}>
      <EqNo n="1" />
    </div>
    <div style={abs(120, 526, { display: 'flex', flexDirection: 'column', gap: 2 })}>
      <div style={{ fontSize: 31, fontStyle: 'italic', marginBottom: 6 }}>where</div>
      <Where
        sym={
          <span>
            <Var>I</Var>
            <Sub>
              <Var>k</Var>,<Var>j</Var>
            </Sub>
          </span>
        }
      >
        is the STFT magnitude in frequency bin <Var>k</Var> at time step <Var>j</Var>
        {';'}
      </Where>
      <Where sym={<Var>n</Var>}>
        is the number of time steps in a clip (<Var>n</Var> = 5,624 for two minutes);
      </Where>
      <Where sym={<Var>q</Var>}>is the number of bins in the band (41 fish, 769 shrimp).</Where>
    </div>
    <div style={abs(120, 778, { width: 1680, height: 1, background: FAINT })} />
    <div style={abs(120, 802, { ...SC, fontSize: 22, color: MUTED })}>Recovery fraction</div>
    <div
      style={abs(120, 834, {
        width: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 40,
        whiteSpace: 'nowrap',
      })}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Var>ρ</Var>
        <Op pad={0.04}>(</Op>
        <Var>t</Var>
        <Op pad={0.04}>)</Op>
        <Op pad={0.35}>=</Op>
        <Frac
          num={
            <span>
              ACI
              <Sub>
                <Var>R</Var>
              </Sub>
              <Op pad={0.04}>(</Op>
              <Var>t</Var>
              <Op pad={0.04}>)</Op>
              <Op>−</Op>
              ACI
              <Sub>
                <Var>D</Var>
              </Sub>
            </span>
          }
          den={
            <span>
              ACI
              <Sub>
                <Var>H</Var>
              </Sub>
              <Op>−</Op>
              ACI
              <Sub>
                <Var>D</Var>
              </Sub>
            </span>
          }
        />
      </span>
      <EqNo n="2" />
    </div>
    <div style={abs(1000, 802, { ...SC, fontSize: 22, color: MUTED })}>
      Saturating recovery model
    </div>
    <div
      style={abs(1000, 834, {
        width: 800,
        height: 112,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 40,
        whiteSpace: 'nowrap',
      })}
    >
      <span>
        <Var>ρ</Var>
        <Op pad={0.04}>(</Op>
        <Var>t</Var>
        <Op pad={0.04}>)</Op>
        <Op pad={0.35}>=</Op>
        <Var>ρ</Var>
        <Sub>
          <Op pad={0}>∞</Op>
        </Sub>
        <Op pad={0.1}>(</Op>1<Op>−</Op>
        <Var>e</Var>
        <Sup>
          <Op pad={0}>−</Op>
          <Var>t</Var>/<Var>τ</Var>
        </Sup>
        <Op pad={0.1}>)</Op>
      </span>
      <EqNo n="3" />
    </div>
  </Sheet>
);

const SPEC_COLS = 240;
const SPEC_ROWS = 80;
const SPEC_CW = 5.4;
const SPEC_RH = 7;
const SPEC_W = SPEC_COLS * SPEC_CW;
const SPEC_H = SPEC_ROWS * SPEC_RH;
const SPEC_X = 90;
const SPEC_Y = 14;
const SPEC_LEVELS = 12;
const F_MIN = 50;
const F_MAX = 24000;
const LOG_SPAN = Math.log(F_MAX / F_MIN);
const fRow = (f: number) => (Math.log(f / F_MIN) / LOG_SPAN) * (SPEC_ROWS - 1);
const fY = (f: number) => r1(SPEC_Y + SPEC_H - (fRow(f) + 0.5) * SPEC_RH);
const tX = (t: number) => r1(SPEC_X + (t / 60) * SPEC_W);
const bump = (r: number, c: number, w: number) => Math.exp(-((r - c) ** 2) / (2 * w * w));

const SPEC_PATHS = (() => {
  const rand = mulberry32(20240214);
  const grid: number[][] = [];
  const snapAmp: number[] = [];
  for (let c = 0; c < SPEC_COLS; c++) {
    snapAmp.push(rand() < 0.4 ? 0.22 + 0.62 * rand() ** 2 : 0);
  }
  const knocks = new Set<number>();
  for (let i = 0; i < 16; i++) knocks.add(Math.floor(rand() * SPEC_COLS));
  for (let c = 0; c < SPEC_COLS; c++) {
    const col: number[] = [];
    for (let r = 0; r < SPEC_ROWS; r++) {
      const f = F_MIN * Math.exp((r / (SPEC_ROWS - 1)) * LOG_SPAN);
      const lf = r / (SPEC_ROWS - 1);
      let v = 0.14 + 0.2 * (1 - lf) + rand() * 0.09;
      if (f > 1800) v += 0.14 * Math.min(1, (f - 1800) / 2500) * (f > 16000 ? 0.6 : 1);
      const snap = snapAmp[c] + (c > 0 ? snapAmp[c - 1] * 0.3 : 0);
      if (snap > 0 && f > 900) {
        v += snap * (0.6 + 0.4 * rand()) * (f < 1800 ? 0.35 : 1) * (f > 15000 ? 0.75 : 1);
      }
      if (c >= 24 && c <= 62 && (c - 24) % 3 < 2) {
        const p = Math.floor((c - 24) / 3);
        const k = (c - 24) % 3 === 0 ? 1 : 0.5;
        const f0 = 205 * (1 + 0.04 * Math.sin(p));
        for (let h = 1; h <= 5; h++) v += ((k * 0.78) / h ** 0.6) * bump(r, fRow(f0 * h), 0.7);
      }
      if (knocks.has(c) && f < 1200) v += 0.42 * bump(r, fRow(170), 2.6);
      if (c >= 72 && c <= 120) {
        const e = Math.sin((Math.PI * (c - 72)) / 48) ** 1.5;
        const f0 = 124 * (1 + 0.035 * (0.5 - (c - 72) / 48));
        for (let h = 1; h <= 7; h++) v += ((0.62 * e) / h ** 0.45) * bump(r, fRow(f0 * h), 0.5);
        v += 0.28 * e * bump(r, fRow(260), 7);
      }
      if (c >= 136) {
        const ramp = ((c - 136) / 103) ** 0.7;
        v += ramp * 0.62 * (0.5 + 0.5 * rand()) * bump(r, fRow(560), 3.2);
      }
      col.push(v);
    }
    grid.push(col);
  }
  const paths: string[] = [];
  for (let l = 0; l <= SPEC_LEVELS; l++) paths.push('');
  const level = (v: number) =>
    clamp(Math.floor(clamp(v - 0.08, 0, 1) ** 1.15 * (SPEC_LEVELS + 0.99)), 0, SPEC_LEVELS);
  for (let r = 0; r < SPEC_ROWS; r++) {
    const y = r1(SPEC_Y + SPEC_H - (r + 1) * SPEC_RH);
    let c = 0;
    while (c < SPEC_COLS) {
      const l = level(grid[c][r]);
      let e = c + 1;
      while (e < SPEC_COLS && level(grid[e][r]) === l) e++;
      if (l > 0) {
        const x = r1(SPEC_X + c * SPEC_CW);
        const w = r1((e - c) * SPEC_CW);
        paths[l] += `M${x} ${y}h${w}v${SPEC_RH}h${-w}z`;
      }
      c = e;
    }
  }
  return paths;
})();

const levelOpacity = (l: number) => r1((l / SPEC_LEVELS) ** 1.05 * 9.2) / 10;

const SpecLevel = ({ l }: { l: number }) => (
  <path
    d={SPEC_PATHS[l]}
    style={{ fill: INK, fillOpacity: levelOpacity(l) }}
    shapeRendering="crispEdges"
  />
);

const CB_X = 1560;
const CbCell = ({ l }: { l: number }) => (
  <rect
    x={CB_X}
    y={SPEC_Y + SPEC_H - ((l + 1) * SPEC_H) / (SPEC_LEVELS + 1)}
    width={22}
    height={SPEC_H / (SPEC_LEVELS + 1)}
    style={{ fill: INK, fillOpacity: levelOpacity(l) }}
    shapeRendering="crispEdges"
  />
);

const Bracket = ({ t0, t1, y, label }: { t0: number; t1: number; y: number; label: string }) => (
  <g>
    <path
      d={`M${tX(t0)} ${y + 10}V${y}H${tX(t1)}V${y + 10}`}
      style={{ fill: 'none', stroke: PAPER, strokeWidth: 6 }}
    />
    <path
      d={`M${tX(t0)} ${y + 10}V${y}H${tX(t1)}V${y + 10}`}
      style={{ fill: 'none', stroke: ACCENT, strokeWidth: 2 }}
    />
    <text
      x={(tX(t0) + tX(t1)) / 2}
      y={y - 10}
      fontSize={24}
      textAnchor="middle"
      fontStyle="italic"
      style={{ ...fillAccent, paintOrder: 'stroke', stroke: PAPER, strokeWidth: 6 }}
    >
      {label}
    </text>
  </g>
);

const Brace = ({ f0, f1, label }: { f0: number; f1: number; label: string }) => {
  const x = SPEC_X + SPEC_W + 16;
  const ya = fY(f1);
  const yb = fY(f0);
  return (
    <g>
      <path
        d={`M${x} ${ya}h8V${yb}h-8M${x + 8} ${(ya + yb) / 2}h8`}
        style={{ fill: 'none', stroke: ACCENT, strokeWidth: 1.8 }}
      />
      <text x={x + 24} y={(ya + yb) / 2 + 7} fontSize={21} fontStyle="italic" style={fillAccent}>
        {label}
      </text>
    </g>
  );
};

const Spectrogram: Page = () => (
  <Sheet section="§3 Results">
    <SecHead n="3.1">What a recovering reef sounds like</SecHead>
    <svg
      width={1680}
      height={640}
      viewBox="0 0 1680 640"
      style={abs(120, 232, { color: INK, overflow: 'visible' })}
      aria-label="Spectrogram of one minute of reef sound at a restored site"
    >
      <SpecLevel l={1} />
      <SpecLevel l={2} />
      <SpecLevel l={3} />
      <SpecLevel l={4} />
      <SpecLevel l={5} />
      <SpecLevel l={6} />
      <SpecLevel l={7} />
      <SpecLevel l={8} />
      <SpecLevel l={9} />
      <SpecLevel l={10} />
      <SpecLevel l={11} />
      <SpecLevel l={12} />
      <PlotBox
        x0={SPEC_X}
        y0={SPEC_Y}
        x1={SPEC_X + SPEC_W}
        y1={SPEC_Y + SPEC_H}
        ticks={boxTicks(
          SPEC_X,
          SPEC_Y,
          SPEC_X + SPEC_W,
          SPEC_Y + SPEC_H,
          [tX(10), tX(20), tX(30), tX(40), tX(50)],
          [fY(100), fY(200), fY(500), fY(1000), fY(2000), fY(5000), fY(10000), fY(20000)],
        )}
      />
      <Bracket t0={5.6} t1={15.8} y={fY(1500)} label="(a)" />
      <Bracket t0={17.8} t1={30.2} y={fY(1700)} label="(c)" />
      <Bracket t0={34} t1={59.4} y={fY(1250)} label="(d)" />
      <Brace f0={50} f1={1000} label="fish" />
      <Brace f0={2000} f1={20000} label="shrimp (b)" />
      <YL x={SPEC_X - 12} y={fY(100)}>
        0.1
      </YL>
      <YL x={SPEC_X - 12} y={fY(200)}>
        0.2
      </YL>
      <YL x={SPEC_X - 12} y={fY(500)}>
        0.5
      </YL>
      <YL x={SPEC_X - 12} y={fY(1000)}>
        1
      </YL>
      <YL x={SPEC_X - 12} y={fY(2000)}>
        2
      </YL>
      <YL x={SPEC_X - 12} y={fY(5000)}>
        5
      </YL>
      <YL x={SPEC_X - 12} y={fY(10000)}>
        10
      </YL>
      <YL x={SPEC_X - 12} y={fY(20000)}>
        20
      </YL>
      <XL x={tX(0)} y={SPEC_Y + SPEC_H + 30}>
        0
      </XL>
      <XL x={tX(10)} y={SPEC_Y + SPEC_H + 30}>
        10
      </XL>
      <XL x={tX(20)} y={SPEC_Y + SPEC_H + 30}>
        20
      </XL>
      <XL x={tX(30)} y={SPEC_Y + SPEC_H + 30}>
        30
      </XL>
      <XL x={tX(40)} y={SPEC_Y + SPEC_H + 30}>
        40
      </XL>
      <XL x={tX(50)} y={SPEC_Y + SPEC_H + 30}>
        50
      </XL>
      <XL x={tX(60)} y={SPEC_Y + SPEC_H + 30}>
        60
      </XL>
      <AxisTitle x={tX(30)} y={SPEC_Y + SPEC_H + 62}>
        Time (s)
      </AxisTitle>
      <AxisTitle x={22} y={SPEC_Y + SPEC_H / 2} rotate>
        Frequency (kHz, log scale)
      </AxisTitle>
      <CbCell l={0} />
      <CbCell l={1} />
      <CbCell l={2} />
      <CbCell l={3} />
      <CbCell l={4} />
      <CbCell l={5} />
      <CbCell l={6} />
      <CbCell l={7} />
      <CbCell l={8} />
      <CbCell l={9} />
      <CbCell l={10} />
      <CbCell l={11} />
      <CbCell l={12} />
      <rect
        x={CB_X}
        y={SPEC_Y}
        width={22}
        height={SPEC_H}
        style={{ fill: 'none', stroke: INK, strokeWidth: 1.2 }}
      />
      <text x={CB_X + 32} y={SPEC_Y + SPEC_H + 6} fontSize={20} fill="currentColor" style={NUM}>
        50
      </text>
      <text x={CB_X + 32} y={SPEC_Y + SPEC_H / 2 + 7} fontSize={20} fill="currentColor" style={NUM}>
        75
      </text>
      <text x={CB_X + 32} y={SPEC_Y + 14} fontSize={20} fill="currentColor" style={NUM}>
        100
      </text>
      <AxisTitle x={1660} y={SPEC_Y + SPEC_H / 2} rotate>
        PSD, dB re 1 µPa²/Hz
      </AxisTitle>
    </svg>
    <Caption label="Figure 5." style={abs(120, 878, { width: 1680 })}>
      One minute at R2, month 14, 18:42 local time. (a) grunt train, 205 Hz and harmonics; (b)
      snapping-shrimp snaps, broadband above 2 kHz; (c) passing vessel, harmonics of 124 Hz — such
      clips are screened out; (d) onset of the dusk chorus near 560 Hz.
    </Caption>
  </Sheet>
);

const RX = (t: number) => r1(100 + t * (1030 / 19));
const RY = (v: number) => r1(520 - (v - 120) * (500 / 70));
const FIT_INF = 40.9;
const FIT_TAU = 6.2;
const fit = (t: number) => 131.2 + FIT_INF * (1 - Math.exp(-t / FIT_TAU));

const FIT_PATH = (() => {
  let d = `M${RX(0)} ${RY(fit(0))}`;
  for (let t = 0.25; t <= 19.001; t += 0.25) d += `L${RX(t)} ${RY(fit(t))}`;
  return d;
})();

const ObsPt = ({ t, v, ci }: { t: number; v: number; ci: number }) => (
  <g>
    <path
      d={`M${RX(t)} ${RY(v - ci)}V${RY(v + ci)}M${RX(t) - 7} ${RY(v - ci)}h14M${RX(t) - 7} ${RY(v + ci)}h14`}
      style={{ fill: 'none', stroke: ACCENT, strokeWidth: 1.8 }}
    />
    <path
      d={squarePath(RX(t), RY(v), 15)}
      style={{ ...fillAccent, stroke: PAPER, strokeWidth: 1.5 }}
    />
  </g>
);

const RES_X = [0, 3, 6, 9, 12, 15, 18].map(RX);
const RES_Y = [130, 140, 150, 160, 170, 180].map(RY);

const Stat = ({ top, value, children }: { top: number; value: ReactNode; children: ReactNode }) => (
  <div style={abs(1340, top, { width: 460, borderTop: `1px solid ${INK}`, paddingTop: 18 })}>
    <div style={{ ...NUM, fontSize: 50, lineHeight: 1.1, color: ACCENT }}>{value}</div>
    <div style={{ fontSize: 24, lineHeight: 1.45, marginTop: 10, color: MUTED }}>{children}</div>
  </div>
);

const ResultLayer = ({ children }: { children: ReactNode }) => (
  <svg
    width={1160}
    height={600}
    viewBox="0 0 1160 600"
    style={abs(120, 236, { color: INK, overflow: 'visible' })}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Result: Page = () => (
  <Sheet section="§3 Results">
    <SecHead n="3.2">Restored reefs converge on the healthy soundscape</SecHead>
    <ResultLayer>
      <rect
        x={100}
        y={RY(187)}
        width={1030}
        height={RY(176.4) - RY(187)}
        style={{ fill: INK, fillOpacity: 0.07 }}
      />
      <path
        d={`M100 ${RY(181.7)}H1130`}
        style={{ stroke: INK, strokeWidth: 1.4, strokeDasharray: '9 6' }}
      />
      <rect
        x={100}
        y={RY(135.4)}
        width={1030}
        height={RY(127) - RY(135.4)}
        style={{ fill: INK, fillOpacity: 0.07 }}
      />
      <path
        d={`M100 ${RY(131.2)}H1130`}
        style={{ stroke: INK, strokeWidth: 1.4, strokeDasharray: '2 5' }}
      />
      <text x={118} y={RY(176.4) - 12} fontSize={22} fontStyle="italic" fill="currentColor">
        Healthy reference, mean and 95 % CI
      </text>
      <text
        x={1114}
        y={RY(127) + 30}
        fontSize={22}
        fontStyle="italic"
        fill="currentColor"
        textAnchor="end"
      >
        Degraded, mean and 95 % CI
      </text>
      <PlotBox
        x0={100}
        y0={20}
        x1={1130}
        y1={520}
        ticks={boxTicks(100, 20, 1130, 520, RES_X, RES_Y)}
      />
      <XL x={RX(0)} y={552}>
        0
      </XL>
      <XL x={RX(3)} y={552}>
        3
      </XL>
      <XL x={RX(6)} y={552}>
        6
      </XL>
      <XL x={RX(9)} y={552}>
        9
      </XL>
      <XL x={RX(12)} y={552}>
        12
      </XL>
      <XL x={RX(15)} y={552}>
        15
      </XL>
      <XL x={RX(18)} y={552}>
        18
      </XL>
      <YL x={88} y={RY(120)}>
        120
      </YL>
      <YL x={88} y={RY(140)}>
        140
      </YL>
      <YL x={88} y={RY(160)}>
        160
      </YL>
      <YL x={88} y={RY(180)}>
        180
      </YL>
      <AxisTitle x={615} y={590}>
        Months since frame installation
      </AxisTitle>
      <AxisTitle x={24} y={270} rotate>
        Fish-band ACI
      </AxisTitle>
    </ResultLayer>
    <Steps>
      <Step duration={160}>
        <ResultLayer>
          <ObsPt t={0} v={132.6} ci={4.8} />
          <ObsPt t={2} v={141.2} ci={5.1} />
          <ObsPt t={4} v={152.3} ci={4.6} />
          <ObsPt t={6} v={155.4} ci={5.3} />
          <ObsPt t={8} v={162.4} ci={4.9} />
          <ObsPt t={10} v={163.1} ci={5.6} />
          <ObsPt t={12} v={167.6} ci={5.0} />
          <ObsPt t={14} v={166.9} ci={5.4} />
          <ObsPt t={16} v={170.3} ci={5.9} />
          <ObsPt t={18} v={169.4} ci={6.3} />
        </ResultLayer>
        <Stat
          top={250}
          value={
            <>
              <Var>p</Var> &lt; 0.001
            </>
          }
        >
          restored ≠ degraded from month 4 onward (mixed model, Holm-adjusted)
        </Stat>
      </Step>
      <Step duration={160}>
        <ResultLayer>
          <path
            d={`M100 ${RY(131.2 + FIT_INF)}H1130`}
            style={{ stroke: ACCENT, strokeWidth: 1.2, strokeDasharray: '3 6' }}
          />
          <path d={FIT_PATH} style={{ fill: 'none', stroke: ACCENT, strokeWidth: 2.6 }} />
          <path
            d={`M${RX(FIT_TAU)} 520V${RY(fit(FIT_TAU))}`}
            style={{ stroke: ACCENT, strokeWidth: 1.4, strokeDasharray: '5 5' }}
          />
          <circle
            cx={RX(FIT_TAU)}
            cy={RY(fit(FIT_TAU))}
            r={6}
            style={{ fill: PAPER, stroke: ACCENT, strokeWidth: 2 }}
          />
          <text
            x={RX(FIT_TAU) + 16}
            y={RY(146)}
            fontSize={26}
            fontStyle="italic"
            style={fillAccent}
          >
            τ = 6.2 months
          </text>
        </ResultLayer>
        <Stat
          top={470}
          value={
            <>
              <Var>τ</Var> = 6.2 months
            </>
          }
        >
          time constant of Eq. (3); 95 % CI [4.9, 7.8]
        </Stat>
      </Step>
      <Step duration={160}>
        <ResultLayer>
          <path
            d={`M1108 ${RY(131.2)}V${RY(169.4)}M1100 ${RY(131.2)}h16M1100 ${RY(169.4)}h16`}
            style={{ fill: 'none', stroke: ACCENT, strokeWidth: 2 }}
          />
          <path
            d={`M1108 ${RY(169.4)}V${RY(181.7)}`}
            style={{ stroke: ACCENT, strokeWidth: 1.4, strokeDasharray: '2 4' }}
          />
          <text
            x={1094}
            y={RY(150) + 8}
            fontSize={26}
            fontStyle="italic"
            textAnchor="end"
            style={fillAccent}
          >
            76 %
          </text>
        </ResultLayer>
        <Stat
          top={662}
          value={
            <>
              <Var>ρ</Var> = 0.76
            </>
          }
        >
          of the healthy–degraded gap closed by month 18; asymptote <Var>ρ</Var>
          <Sub>∞</Sub> = 0.81
        </Stat>
      </Step>
    </Steps>
    <Caption label="Figure 6." style={abs(120, 862, { width: 1160 })}>
      Restored sites (■, mean ± 95 % CI across four sites) against the reference conditions. Curve:
      Eq. (3), fitted by nonlinear least squares.
    </Caption>
  </Sheet>
);

const TH: CSSProperties = {
  fontWeight: 400,
  padding: '10px 18px',
  textAlign: 'right',
  verticalAlign: 'bottom',
};
const TD: CSSProperties = { padding: '9px 18px', textAlign: 'right', ...NUM };
const TOP_RULE = `2.5px solid ${INK}`;
const MID_RULE = `1.2px solid ${INK}`;

const ColHead = ({ name, unit }: { name: ReactNode; unit: ReactNode }) => (
  <th style={{ ...TH, borderBottom: MID_RULE }}>
    <div style={{ fontSize: 28, lineHeight: 1.25 }}>{name}</div>
    <div style={{ fontSize: 21, lineHeight: 1.35, color: MUTED, fontStyle: 'italic' }}>{unit}</div>
  </th>
);

const CondCell = ({ kind, children }: { kind: Grp; children: ReactNode }) => (
  <td style={{ ...TD, textAlign: 'left' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
      <Mark kind={kind} size={22} />
      {children}
    </span>
  </td>
);

const Pm = () => <span style={{ color: MUTED, margin: '0 0.2em' }}>±</span>;

const TableRow = ({
  kind,
  label,
  sites,
  days,
  aci,
  spl,
  snaps,
  rho,
  last,
}: {
  kind: Grp;
  label: string;
  sites: string;
  days: string;
  aci: [string, string];
  spl: [string, string];
  snaps: [string, string];
  rho: string;
  last?: boolean;
}) => (
  <tr style={{ fontSize: 30 }}>
    <CondCell kind={kind}>{label}</CondCell>
    <td style={TD}>{sites}</td>
    <td style={TD}>{days}</td>
    <td style={TD}>
      {aci[0]}
      <Pm />
      {aci[1]}
    </td>
    <td style={TD}>
      {spl[0]}
      <Pm />
      {spl[1]}
    </td>
    <td style={TD}>
      {snaps[0]}
      <Pm />
      {snaps[1]}
    </td>
    <td
      style={{
        ...TD,
        fontWeight: kind === 'r' ? 600 : 400,
        borderBottom: last ? MID_RULE : undefined,
      }}
    >
      {rho}
    </td>
  </tr>
);

const ContrastRow = ({
  label,
  aci,
  spl,
  snaps,
  p,
  last,
}: {
  label: string;
  aci: string;
  spl: string;
  snaps: string;
  p: string;
  last?: boolean;
}) => {
  const rule = last ? TOP_RULE : undefined;
  return (
    <tr style={{ fontSize: 28 }}>
      <td style={{ ...TD, textAlign: 'left', borderBottom: rule }}>{label}</td>
      <td style={{ ...TD, borderBottom: rule }} />
      <td style={{ ...TD, borderBottom: rule }} />
      <td style={{ ...TD, borderBottom: rule }}>{aci}</td>
      <td style={{ ...TD, borderBottom: rule }}>{spl}</td>
      <td style={{ ...TD, borderBottom: rule }}>{snaps}</td>
      <td style={{ ...TD, borderBottom: rule, fontStyle: 'italic' }}>{p}</td>
    </tr>
  );
};

const ResultsTable: Page = () => (
  <Sheet section="§3 Results">
    <SecHead n="3.3">Summary by condition</SecHead>
    <Caption label="Table 2." style={abs(120, 240, { width: 1680 })}>
      Acoustic indices by condition over months 13–18, and mixed-model contrasts.
    </Caption>
    <table
      style={abs(120, 298, {
        width: 1680,
        borderCollapse: 'collapse',
        fontFamily: 'var(--osd-font-body)',
        color: INK,
      })}
    >
      <thead>
        <tr>
          <th style={{ ...TH, borderTop: TOP_RULE, padding: '8px 18px 0' }} />
          <th style={{ ...TH, borderTop: TOP_RULE, padding: '8px 18px 0' }} />
          <th style={{ ...TH, borderTop: TOP_RULE, padding: '8px 18px 0' }} />
          <th
            colSpan={3}
            style={{ ...TH, borderTop: TOP_RULE, padding: '14px 18px 0', textAlign: 'center' }}
          >
            <div
              style={{ ...SC, fontSize: 24, paddingBottom: 8, borderBottom: `1px solid ${INK}` }}
            >
              Acoustic indices, mean ± s.e.
              <Fn n="a" />
            </div>
          </th>
          <th style={{ ...TH, borderTop: TOP_RULE, padding: '8px 18px 0' }} />
        </tr>
        <tr>
          <th style={{ ...TH, textAlign: 'left', borderBottom: MID_RULE }}>
            <div style={{ fontSize: 28 }}>Condition</div>
          </th>
          <ColHead name="Sites" unit="" />
          <ColHead name="Rec.-days" unit="" />
          <ColHead name="ACI, fish band" unit="dimensionless" />
          <ColHead name="SPL, 0.05–1 kHz" unit="dB re 1 µPa" />
          <ColHead name="Snap rate" unit="snaps per second" />
          <ColHead
            name={
              <span>
                <Var>ρ</Var>
                <Fn n="b" />
              </span>
            }
            unit="Eq. (2)"
          />
        </tr>
      </thead>
      <tbody>
        <TableRow
          kind="h"
          label="Healthy"
          sites="4"
          days="1,986"
          aci={['181.7', '2.1']}
          spl={['118.4', '0.9']}
          snaps={['41.2', '3.0']}
          rho="1.00"
        />
        <TableRow
          kind="r"
          label="Restored"
          sites="4"
          days="1,958"
          aci={['169.8', '2.6']}
          spl={['114.9', '1.1']}
          snaps={['33.7', '2.8']}
          rho="0.76"
        />
        <TableRow
          kind="d"
          label="Degraded"
          sites="4"
          days="1,968"
          aci={['131.2', '2.4']}
          spl={['108.6', '1.0']}
          snaps={['18.9', '2.2']}
          rho="0.00"
        />
        <tr>
          <td
            colSpan={7}
            style={{
              ...TD,
              textAlign: 'left',
              borderTop: MID_RULE,
              paddingTop: 14,
              fontSize: 24,
              fontStyle: 'italic',
              color: MUTED,
            }}
          >
            Contrasts, estimate [95 % CI]
            <Fn n="c" />
          </td>
        </tr>
        <ContrastRow
          label="Restored − Degraded"
          aci="+38.6 [31.9, 45.3]"
          spl="+6.3 [4.1, 8.5]"
          snaps="+14.8 [9.6, 20.0]"
          p="p < 0.001"
        />
        <ContrastRow
          label="Healthy − Restored"
          aci="+11.9 [5.0, 18.8]"
          spl="+3.5 [1.3, 5.7]"
          snaps="+7.5 [2.3, 12.7]"
          p="p = 0.002"
          last
        />
      </tbody>
    </table>
    <div style={abs(120, 842, { width: 1680, fontSize: 21, lineHeight: 1.55, color: MUTED })}>
      <div>
        <sup style={{ color: ACCENT, marginRight: 6 }}>a</sup>Across site-days, months 13–18 after
        installation; vessel-screened clips only.
        <sup style={{ color: ACCENT, margin: '0 6px 0 28px' }}>b</sup>Recovery fraction from ACI.
      </div>
      <div>
        <sup style={{ color: ACCENT, marginRight: 6 }}>c</sup>Linear mixed model with site as random
        intercept <Cite n="9" />; <Var>p</Var>-values Holm-adjusted over the three indices.
      </div>
    </div>
  </Sheet>
);

type Obs = { g: Grp; x: number; y: number };

const VISITS = (() => {
  const rand = mulberry32(84);
  const a: Obs[] = [];
  const b: Obs[] = [];
  const groups: Grp[] = ['h', 'r', 'd'];
  for (const g of groups) {
    for (let s = 0; s < 4; s++) {
      const offA = normal(rand);
      const offB = normal(rand);
      for (let v = 0; v < 7; v++) {
        const prog = v / 6;
        const fish =
          g === 'h'
            ? 86 + offA * 9 + normal(rand) * 8
            : g === 'r'
              ? 26 + prog * 42 + offA * 5 + normal(rand) * 7
              : 22 + offA * 5 + normal(rand) * 6;
        const cover =
          g === 'h'
            ? 41 + offB * 6 + normal(rand) * 3
            : g === 'r'
              ? 6 + prog * 16 + offB * 2 + normal(rand) * 2.5
              : 5 + offB * 2 + normal(rand) * 1.8;
        const fx = clamp(fish, 3, 116);
        const cx = clamp(cover, 0.6, 57);
        a.push({ g, x: fx, y: clamp(118 + 0.72 * fx + normal(rand) * 15, 112, 208) });
        b.push({ g, x: cx, y: clamp(14 + 0.62 * cx + normal(rand) * 11, 1, 68) });
      }
    }
  }
  return { a, b };
})();

const regress = (pts: Obs[]) => {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of pts) {
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
    sxy += (p.x - mx) * (p.y - my);
  }
  const slope = sxy / sxx;
  const icpt = my - slope * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  let sse = 0;
  for (const p of pts) sse += (p.y - icpt - slope * p.x) ** 2;
  const s = Math.sqrt(sse / (n - 2));
  const z = Math.atanh(r);
  const se = 1 / Math.sqrt(n - 3);
  return {
    n,
    slope,
    icpt,
    r,
    lo: Math.tanh(z - 1.96 * se),
    hi: Math.tanh(z + 1.96 * se),
    band: (x: number) => 1.99 * s * Math.sqrt(1 / n + (x - mx) ** 2 / sxx),
  };
};

const FIT_A = regress(VISITS.a);
const FIT_B = regress(VISITS.b);

type Frame = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
};
const PANEL_A: Frame = {
  x0: 96,
  x1: 770,
  y0: 16,
  y1: 420,
  xmin: 0,
  xmax: 120,
  ymin: 100,
  ymax: 220,
};
const PANEL_B: Frame = { x0: 96, x1: 770, y0: 16, y1: 420, xmin: 0, xmax: 60, ymin: 0, ymax: 70 };
const px = (f: Frame, x: number) => r1(f.x0 + ((x - f.xmin) / (f.xmax - f.xmin)) * (f.x1 - f.x0));
const py = (f: Frame, y: number) => r1(f.y1 - ((y - f.ymin) / (f.ymax - f.ymin)) * (f.y1 - f.y0));

const scatterLayers = (f: Frame, pts: Obs[], fitR: ReturnType<typeof regress>) => {
  let h = '';
  let r = '';
  let d = '';
  for (const p of pts) {
    const x = px(f, p.x);
    const y = py(f, p.y);
    if (p.g === 'h') h += circlePath(x, y, 6.5);
    else if (p.g === 'r') r += squarePath(x, y, 12);
    else d += triPath(x, y, 15);
  }
  const xs: number[] = [];
  for (let i = 0; i <= 40; i++) xs.push(f.xmin + ((f.xmax - f.xmin) * i) / 40);
  const yAt = (x: number) => fitR.icpt + fitR.slope * x;
  const upper = xs.map((x) => `${px(f, x)} ${py(f, clamp(yAt(x) + fitR.band(x), f.ymin, f.ymax))}`);
  const lower = xs
    .map((x) => `${px(f, x)} ${py(f, clamp(yAt(x) - fitR.band(x), f.ymin, f.ymax))}`)
    .reverse();
  const band = `M${upper.join('L')}L${lower.join('L')}z`;
  const line = `M${px(f, f.xmin)} ${py(f, clamp(yAt(f.xmin), f.ymin, f.ymax))}L${px(f, f.xmax)} ${py(f, clamp(yAt(f.xmax), f.ymin, f.ymax))}`;
  return { h, r, d, band, line };
};

const SCAT_A = scatterLayers(PANEL_A, VISITS.a, FIT_A);
const SCAT_B = scatterLayers(PANEL_B, VISITS.b, FIT_B);
const fmtR = (v: number) => v.toFixed(2);

const ScatterMarks = ({ s }: { s: typeof SCAT_A }) => (
  <>
    <path d={s.band} style={{ fill: INK, fillOpacity: 0.08 }} />
    <path d={s.line} style={{ stroke: INK, strokeWidth: 1.8 }} />
    <path d={s.d} style={{ fill: PAPER, stroke: INK, strokeWidth: 1.5 }} />
    <path d={s.h} style={{ ...fillInk, stroke: PAPER, strokeWidth: 1.2 }} />
    <path d={s.r} style={{ ...fillAccent, stroke: PAPER, strokeWidth: 1.2 }} />
  </>
);

const PanelTag = ({ tag, r, lo, hi }: { tag: string; r: number; lo: number; hi: number }) => (
  <>
    <text x={116} y={50} fontSize={26} fill="currentColor" fontWeight={600}>
      {tag}
    </text>
    <text x={156} y={50} fontSize={24} fill="currentColor" fontStyle="italic" style={NUM}>
      r = {fmtR(r)} [{fmtR(lo)}, {fmtR(hi)}]
    </text>
  </>
);

const EffortBar = ({
  label,
  hours,
  w,
  accent,
}: {
  label: string;
  hours: string;
  w: number;
  accent?: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 24, lineHeight: 1 }}>
    <span style={{ width: 210, color: MUTED, fontStyle: 'italic' }}>{label}</span>
    <span style={{ width: w, height: 18, background: accent ? ACCENT : INK }} />
    <span style={NUM}>{hours}</span>
  </div>
);

const Surveys: Page = () => (
  <Sheet section="§3 Results">
    <SecHead n="3.4">Listening agrees with looking</SecHead>
    <svg
      width={790}
      height={480}
      viewBox="0 0 790 480"
      style={abs(120, 236, { color: INK, overflow: 'visible' })}
      aria-label="Scatter of fish-band ACI against diver-counted fish density"
    >
      <ScatterMarks s={SCAT_A} />
      <PlotBox
        x0={PANEL_A.x0}
        y0={PANEL_A.y0}
        x1={PANEL_A.x1}
        y1={PANEL_A.y1}
        ticks={boxTicks(
          PANEL_A.x0,
          PANEL_A.y0,
          PANEL_A.x1,
          PANEL_A.y1,
          [px(PANEL_A, 30), px(PANEL_A, 60), px(PANEL_A, 90)],
          [py(PANEL_A, 130), py(PANEL_A, 160), py(PANEL_A, 190)],
        )}
      />
      <PanelTag tag="(a)" r={FIT_A.r} lo={FIT_A.lo} hi={FIT_A.hi} />
      <XL x={px(PANEL_A, 0)} y={450}>
        0
      </XL>
      <XL x={px(PANEL_A, 30)} y={450}>
        30
      </XL>
      <XL x={px(PANEL_A, 60)} y={450}>
        60
      </XL>
      <XL x={px(PANEL_A, 90)} y={450}>
        90
      </XL>
      <XL x={px(PANEL_A, 120)} y={450}>
        120
      </XL>
      <YL x={84} y={py(PANEL_A, 100)}>
        100
      </YL>
      <YL x={84} y={py(PANEL_A, 130)}>
        130
      </YL>
      <YL x={84} y={py(PANEL_A, 160)}>
        160
      </YL>
      <YL x={84} y={py(PANEL_A, 190)}>
        190
      </YL>
      <YL x={84} y={py(PANEL_A, 220)}>
        220
      </YL>
      <AxisTitle x={433} y={482}>
        Fish density, ind. per 100 m² (diver UVC)
      </AxisTitle>
      <AxisTitle x={22} y={218} rotate>
        Fish-band ACI
      </AxisTitle>
    </svg>
    <svg
      width={790}
      height={480}
      viewBox="0 0 790 480"
      style={abs(1010, 236, { color: INK, overflow: 'visible' })}
      aria-label="Scatter of snap rate against live coral cover"
    >
      <ScatterMarks s={SCAT_B} />
      <PlotBox
        x0={PANEL_B.x0}
        y0={PANEL_B.y0}
        x1={PANEL_B.x1}
        y1={PANEL_B.y1}
        ticks={boxTicks(
          PANEL_B.x0,
          PANEL_B.y0,
          PANEL_B.x1,
          PANEL_B.y1,
          [px(PANEL_B, 15), px(PANEL_B, 30), px(PANEL_B, 45)],
          [py(PANEL_B, 20), py(PANEL_B, 40), py(PANEL_B, 60)],
        )}
      />
      <PanelTag tag="(b)" r={FIT_B.r} lo={FIT_B.lo} hi={FIT_B.hi} />
      <XL x={px(PANEL_B, 0)} y={450}>
        0
      </XL>
      <XL x={px(PANEL_B, 15)} y={450}>
        15
      </XL>
      <XL x={px(PANEL_B, 30)} y={450}>
        30
      </XL>
      <XL x={px(PANEL_B, 45)} y={450}>
        45
      </XL>
      <XL x={px(PANEL_B, 60)} y={450}>
        60
      </XL>
      <YL x={84} y={py(PANEL_B, 0)}>
        0
      </YL>
      <YL x={84} y={py(PANEL_B, 20)}>
        20
      </YL>
      <YL x={84} y={py(PANEL_B, 40)}>
        40
      </YL>
      <YL x={84} y={py(PANEL_B, 60)}>
        60
      </YL>
      <AxisTitle x={433} y={482}>
        Live coral cover, % (photo-quadrats)
      </AxisTitle>
      <AxisTitle x={22} y={218} rotate>
        Snaps per second
      </AxisTitle>
    </svg>
    <Caption label="Figure 7." style={abs(120, 752, { width: 1680 })}>
      Acoustic indices against diver surveys at 84 site-visits: <Mark kind="h" size={18} /> healthy,{' '}
      <Mark kind="r" size={18} /> restored, <Mark kind="d" size={18} /> degraded. Line: OLS fit with
      95 % band; <Var>r</Var> with Fisher-<Var>z</Var> interval.
    </Caption>
    <div style={abs(120, 846, { display: 'flex', flexDirection: 'column', gap: 18 })}>
      <EffortBar label="Diver survey" hours="11.5 person-h per site-month" w={920} />
      <EffortBar label="Acoustic" hours="0.4 person-h per site-month" w={32} accent />
    </div>
  </Sheet>
);

const Limit = ({ n, title, children }: { n: string; title: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 28 }}>
    <span
      style={{
        width: 64,
        fontSize: 34,
        fontStyle: 'italic',
        color: ACCENT,
        flex: 'none',
        lineHeight: 1.3,
      }}
    >
      ({n})
    </span>
    <div>
      <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 30, lineHeight: 1.45, color: MUTED, marginTop: 4 }}>{children}</div>
    </div>
  </div>
);

const Limitations: Page = () => (
  <Sheet section="§4 Discussion">
    <SecHead n="4.1">Limitations</SecHead>
    <div style={abs(120, 262, { width: 1060, display: 'flex', flexDirection: 'column', gap: 40 })}>
      <Limit n="i" title="Sites were not randomly assigned.">
        Practitioners chose where to restore; we matched on depth and exposure.
      </Limit>
      <Limit n="ii" title="Indices are aggregates.">
        ACI and SPL do not identify species — louder is not always richer.
      </Limit>
      <Limit n="iii" title="Vessel noise is uneven.">
        8.8 % of clips excluded, mostly at R1 and R3 near the ferry lane.
        <Fn n="4" />
      </Limit>
      <Limit n="iv" title="One region, one method, 18 months.">
        Steel frames in a sheltered archipelago; long-run trajectories unknown.
      </Limit>
    </div>
    <div
      style={abs(1280, 268, {
        width: 520,
        borderTop: `2px solid ${INK}`,
        borderBottom: `2px solid ${INK}`,
        padding: '28px 0 30px',
      })}
    >
      <div style={{ fontSize: 30, lineHeight: 1.5 }}>
        <span style={{ ...SC, fontWeight: 600 }}>Remark.</span>{' '}
        <span style={{ fontStyle: 'italic' }}>What would falsify H1?</span>
      </div>
      <div style={{ fontSize: 30, lineHeight: 1.5, marginTop: 14 }}>
        A restored site that <i>sounds</i> healthy but <i>surveys</i> as degraded. Across 28
        restored site-visits we found none; the largest standardised residual was 1.4.
      </div>
    </div>
    <Footnote n="4">
      Kalea–Bira ferry, about six crossings a day; detector and thresholds as in Lindqvist &amp;
      Okonkwo <Cite n="10" />.
    </Footnote>
  </Sheet>
);

const Claim = ({ n, title, children }: { n: string; title: ReactNode; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 36, alignItems: 'baseline' }}>
    <span style={{ ...NUM, fontSize: 64, lineHeight: 1, color: ACCENT, width: 54, flex: 'none' }}>
      {n}
    </span>
    <div>
      <div style={{ fontSize: 44, lineHeight: 1.25, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 31, lineHeight: 1.45, color: MUTED, marginTop: 10 }}>{children}</div>
    </div>
  </div>
);

const Conclusions: Page = () => (
  <Sheet section="§5 Conclusions">
    <SecHead n="5">Conclusions</SecHead>
    <div style={abs(120, 272, { width: 1500, display: 'flex', flexDirection: 'column', gap: 54 })}>
      <Claim n="1" title="Restored reefs regain their voice — quickly.">
        <Var>τ</Var> = 6.2 months; 76 % of the gap to healthy reefs closed within 18 months (H1
        supported).
      </Claim>
      <Claim n="2" title="Listening agrees with looking.">
        <Var>r</Var> = {fmtR(FIT_A.r)} with diver-counted fish density, at one-thirtieth of the
        field effort (H2 supported).
      </Claim>
      <Claim n="3" title="Sound should be a standard hand-over metric.">
        Cheap, continuous and auditable: one recorder per site, from the day the frames go in.
      </Claim>
    </div>
    <div
      style={abs(120, 828, {
        width: 1680,
        borderTop: `1px solid ${FAINT}`,
        paddingTop: 22,
        fontSize: 30,
        lineHeight: 1.45,
      })}
    >
      <span style={{ ...SC, fontWeight: 600 }}>Next.</span>{' '}
      <span style={{ fontStyle: 'italic' }}>
        Species-level call detection, and a 40-site regional array from 2027.
      </span>
    </div>
  </Sheet>
);

const Ref = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 20, fontSize: 28, lineHeight: 1.38 }}>
    <span style={{ ...NUM, width: 56, flex: 'none', color: ACCENT }}>[{n}]</span>
    <span>{children}</span>
  </div>
);

const J = ({ children }: { children: ReactNode }) => <i>{children}</i>;

const References: Page = () => (
  <Sheet section="References">
    <h2
      style={abs(120, 136, {
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 58,
        fontWeight: 600,
        lineHeight: 1.2,
      })}
    >
      References
    </h2>
    <div style={abs(120, 252, { width: 800, display: 'flex', flexDirection: 'column', gap: 22 })}>
      <Ref n="1">
        T. P. Hughes et al. Global warming transforms coral reef assemblages. <J>Nature</J>,
        556:492–496, 2018.
      </Ref>
      <Ref n="2">
        L. Boström-Einarsson et al. Coral restoration — a systematic review of current methods,
        successes, failures and future directions. <J>PLoS ONE</J>, 15(1):e0226631, 2020.
      </Ref>
      <Ref n="3">
        N. Pieretti, A. Farina, D. Morri. A new methodology to infer the singing activity of an
        avian community: the Acoustic Complexity Index. <J>Ecol. Indic.</J>, 11(3):868–873, 2011.
      </Ref>
      <Ref n="4">
        J. Sueur, A. Farina, A. Gasc, N. Pieretti, S. Pavoine. Acoustic indices for biodiversity
        assessment and landscape investigation. <J>Acta Acust. united Ac.</J>, 100(4):772–781, 2014.
      </Ref>
      <Ref n="5">
        M. B. Kaplan, T. A. Mooney, J. Partan, A. R. Solow. Coral reef species assemblages are
        associated with ambient soundscapes. <J>Mar. Ecol. Prog. Ser.</J>, 533:93–107, 2015.
      </Ref>
    </div>
    <div style={abs(1000, 252, { width: 800, display: 'flex', flexDirection: 'column', gap: 22 })}>
      <Ref n="6">
        T. A. C. Gordon et al. Acoustic enrichment can enhance fish community development on
        degraded coral reef habitat. <J>Nat. Commun.</J>, 10:5414, 2019.
      </Ref>
      <Ref n="7">
        T. A. C. Lamont et al. The sound of recovery: coral reef restoration success is detectable
        in the soundscape. <J>J. Appl. Ecol.</J>, 59(3):742–756, 2022.
      </Ref>
      <Ref n="8">
        M. R. Okonkwo, P. Raman. Duty-cycled hydrophone arrays for long-term reef soundscape
        monitoring. <J>Methods Ecol. Evol.</J>, in press.
      </Ref>
      <Ref n="9">
        D. Bates, M. Mächler, B. Bolker, S. Walker. Fitting linear mixed-effects models using lme4.{' '}
        <J>J. Stat. Softw.</J>, 67(1):1–48, 2015.
      </Ref>
      <Ref n="10">
        T. H. Lindqvist, M. R. Okonkwo. A tonal-line detector for vessel noise in long-term reef
        recordings. <J>JASA Express Lett.</J>, 4(7):071201, 2024.
      </Ref>
    </div>
  </Sheet>
);

const Colophon = ({ head, children }: { head: string; children: ReactNode }) => (
  <div style={{ width: 500 }}>
    <div style={{ ...SC, fontWeight: 600, fontSize: 26, marginBottom: 12 }}>{head}</div>
    <div style={{ fontSize: 28, lineHeight: 1.5, color: MUTED }}>{children}</div>
  </div>
);

const Thanks: Page = () => (
  <Sheet section="Questions">
    <div
      style={abs(0, 214, {
        width: 1920,
        textAlign: 'center',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: '-0.015em',
      })}
    >
      Thank you
    </div>
    <div
      style={abs(0, 368, { width: 1920, textAlign: 'center', fontSize: 44, fontStyle: 'italic' })}
    >
      Questions, comments and corrections are very welcome.
    </div>
    <div style={abs(0, 476, { width: 1920, display: 'flex', justifyContent: 'center' })}>
      <div style={{ width: 120, height: 1, background: INK }} />
    </div>
    <div style={abs(120, 548, { width: 1680, display: 'flex', justifyContent: 'space-between' })}>
      <Colophon head="Acknowledgements">
        The Kalea Dive Cooperative, for 214 survey dives; the Blue Horizon Ocean Fund, grant
        BH-2023-117.
      </Colophon>
      <Colophon head="Data &amp; code">
        Daily index tables, model code and 40 hours of example audio will be released with the
        paper.
      </Colophon>
      <Colophon head="Contact">
        Maya R. Okonkwo
        <br />
        School of Ocean &amp; Earth Science, Halloway University
      </Colophon>
    </div>
    <svg
      width={760}
      height={80}
      viewBox="0 0 760 80"
      style={abs(580, 820, { overflow: 'visible' })}
      aria-hidden="true"
    >
      <path d={TITLE_WAVE} style={{ fill: 'none', stroke: ACCENT, strokeWidth: 1.4 }} />
    </svg>
  </Sheet>
);

export const meta: SlideMeta = {
  title: 'Listening for Recovery',
  createdAt: '2026-10-12T12:15:24.833Z',
};

export default [
  TitlePage,
  Motivation,
  Question,
  Sites,
  Deployment,
  Pipeline,
  Equation,
  Spectrogram,
  Result,
  ResultsTable,
  Surveys,
  Limitations,
  Conclusions,
  References,
  Thanks,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Thank the chair. Introduce yourself and say which group you are from.
One sentence on the premise: we want to know whether a restored reef is working, and we think we can hear it.
Fifteen minutes, four parts: why, how, what we found, what it does not show.`,
  `Start with scale: 332 projects started in the region since 2010, and the curve is still climbing.
Then the catch: only 70 of them — about one in five — report anything after the first year.
Most evaluations stop at "did the coral fragments survive hand-over?" That is not the same as "is this a reef again?"
Diver surveys answer the better question, but they are expensive and weather-bound.
Land the last line slowly: healthy reefs are loud. Can we listen instead?`,
  `Read the research question out loud, once, and let it sit.
Two hypotheses. H1 is about timing — distinct from rubble within six months, then moving toward healthy.
H2 is about validity — if the sound does not track what divers see, nobody should trust it. We set r above 0.5 in advance.
Design: four sites in each of three conditions, 18 months of recordings.`,
  `Orient the room: north is up, the village of Kalea is on the south shore of the main island.
Black circles are healthy reference reefs, mostly on outer shoals. Blue squares are the restored sites. Open triangles are the degraded rubble fields, closer to the village — that is the blast-fishing legacy.
Point out that conditions are interleaved around the island, so one coastline is not driving the result.`,
  `Walk the diagram left to right. The recorder sits on a steel stake half a metre above the bottom, next to the reef-star frames.
Mention the duty cycle — two minutes in every ten — which is how a battery lasts three months.
The arcs are a nominal listening range for fish calls, about a hundred metres, from playback trials.
6,480 recorder-days in total before any screening.`,
  `This is the whole processing chain, so take it one stage at a time but keep moving.
The stage worth pausing on is stage 2: vessel noise. A passing boat will make any reef look "complex", so we cut those clips — 8.8 percent.
Then STFT, split into a fish band and a shrimp band, three indices per clip, and a mixed model on daily site means.`,
  `Do not read the equation symbol by symbol. Say what it measures: how much the intensity in each frequency bin changes from one moment to the next, normalised by how loud that bin is.
Steady noise like an engine scores low; lots of short calls score high.
Then the two quantities we report: rho, the fraction of the healthy-minus-degraded gap a restored site has closed; and a saturating model with time constant tau.`,
  `Let the room listen with their eyes for a moment before you speak.
Point to (a), a grunt train; (b), the shrimp snaps that make the top half look like static; (c), a boat — note those harmonics, this clip would be excluded; and (d), the dusk chorus building at the right edge.
This is fourteen months after the frames went in. Eighteen months earlier, this site sounded like the degraded ones.`,
  `Build this in three clicks.
First: the restored sites over time. Separate from degraded by month 4.
Second: the fitted curve. Time constant about six months.
Third: by month 18 they have closed about three-quarters of the gap — but not all of it. Say that clearly; we are not claiming full recovery.`,
  `This is the table for people who want the numbers. Don't read it.
Highlight two things: all three indices agree in direction; and the healthy-minus-restored contrast is still significant. Restored reefs are much closer, but not there yet.`,
  `This is H2. Panel (a): fish-band ACI against fish density counted by divers. Panel (b): snap rate against coral cover — weaker, as expected.
Then the effort comparison underneath: 11.5 person-hours of diving per site per month against 0.4 for swapping batteries and cards. That is the practical argument.`,
  `Be honest and brisk. The biggest one is (i): we did not choose where to restore.
Indices are not species lists. Vessel noise is uneven across sites. And this is one region, one method, eighteen months.
Then the remark: the result that would have hurt us — a site that sounds healthy but looks degraded — never showed up.`,
  `Three sentences, one per point. Slow down.
Restored reefs regain their voice within months. Listening agrees with looking. So put a recorder at every restoration site, from day one.
Mention the next step briefly, then go to questions.`,
  `Leave this up only if someone asks for a citation. The key methods references are Pieretti for ACI and Lamont et al. for the closest prior study.`,
  `Thank the dive cooperative by name.
Take questions. Likely ones: site selection bias (refer back to limitation i), species identification, and cost per recorder — about 2,400 dollars each including housing.`,
];

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
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#060a12', text: '#e7edf5', accent: '#ff6b1a' },
  fonts: {
    display: '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif',
    body: '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace',
  },
  typeScale: { hero: 230, body: 26 },
  radius: 2,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap';
const FONT_LINK_ID = 'osd-webfont-lunar-mission-briefing';
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

const STYLE_ID = 'osd-styles-lunar-mission-briefing';
const css = `
.lm-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: lm-draw 2.2s cubic-bezier(.65,0,.25,1) forwards; }
.lm-fade { opacity: 0; animation: lm-fade .6s ease-out forwards; }
.lm-pulse { transform-box: fill-box; transform-origin: center; animation: lm-pulse 2s ease-out infinite; }
.lm-blink { animation: lm-blink 1.1s steps(1) infinite; }
.lm-spin { transform-box: fill-box; transform-origin: center; animation: lm-spin 90s linear infinite; }
@keyframes lm-draw { to { stroke-dashoffset: 0 } }
@keyframes lm-fade { to { opacity: 1 } }
@keyframes lm-pulse { 0% { transform: scale(.7); opacity: .9 } 100% { transform: scale(1.9); opacity: 0 } }
@keyframes lm-blink { 50% { opacity: 0 } }
@keyframes lm-spin { to { transform: rotate(360deg) } }
@media (prefers-reduced-motion: reduce) {
  .lm-draw { animation: none; stroke-dashoffset: 0 }
  .lm-fade { animation: none; opacity: 1 }
  .lm-pulse, .lm-blink, .lm-spin { animation: none }
}
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

const muted = '#7d8aa0';
const steel = '#4f6a92';
const line = 'rgba(140, 170, 220, 0.22)';
const panel = 'rgba(14, 22, 38, 0.82)';
const accent = 'var(--osd-accent)';
const display = 'var(--osd-font-display)';
const mono = 'var(--osd-font-body)';

const MORPH_MS = 900;
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 220,
  exit: { duration: 220, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 220, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

const morphCut: SlideTransition = {
  duration: 320,
  exit: { duration: 340, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 340, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: mono,
};

const label: CSSProperties = {
  fontFamily: mono,
  fontSize: 18,
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: muted,
};

const Blueprint = () => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(rgba(110,150,220,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(110,150,220,0.06) 1px, transparent 1px), linear-gradient(rgba(110,150,220,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(110,150,220,0.11) 1px, transparent 1px)',
        backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px',
        backgroundPosition: '0 0, 0 0, -40px -40px, -40px -40px',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(2,4,8,0.7) 100%)',
      }}
    />
  </>
);

const RegMark = ({ x, y }: { x: number; y: number }) => (
  <svg
    width={44}
    height={44}
    viewBox="0 0 44 44"
    style={{ position: 'absolute', left: x - 22, top: y - 22 }}
  >
    <circle cx="22" cy="22" r="11" fill="none" stroke={muted} strokeWidth="1.5" />
    <path d="M22 0 V44 M0 22 H44" stroke={muted} strokeWidth="1.5" />
  </svg>
);

const Chrome = ({ section }: { section: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <RegMark x={60} y={60} />
      <RegMark x={1860} y={60} />
      <RegMark x={60} y={1020} />
      <RegMark x={1860} y={1020} />
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 46,
          display: 'flex',
          justifyContent: 'space-between',
          paddingBottom: 12,
          borderBottom: `1px solid ${line}`,
          ...label,
        }}
      >
        <span>
          <span style={{ color: accent }}>■</span>&nbsp;&nbsp;SELENE IV · Flight Readiness Briefing
        </span>
        <span>Doc SLN4-FRB-007 · Rev C</span>
        <span>Crew / MCC Distribution</span>
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
          borderTop: `1px solid ${line}`,
          ...label,
        }}
      >
        <span>{section}</span>
        <span>L–14 D · 2027-02-28</span>
        <span>
          PG <span style={{ color: 'var(--osd-text)' }}>{String(current).padStart(2, '0')}</span> /{' '}
          {String(total).padStart(2, '0')}
        </span>
      </div>
    </>
  );
};

const Heading = ({ kicker, title }: { kicker: string; title: string }) => (
  <div style={{ position: 'absolute', left: 120, top: 108 }}>
    <div style={{ ...label, color: accent }}>{kicker}</div>
    <h2
      style={{
        margin: '8px 0 0',
        fontFamily: display,
        fontWeight: 600,
        fontSize: 76,
        lineHeight: 1,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </h2>
  </div>
);

const CraftGlyph = () => (
  <svg width={48} height={48} viewBox="0 0 48 48" style={{ display: 'block', overflow: 'visible' }}>
    <circle
      className="lm-pulse"
      cx="24"
      cy="24"
      r="14"
      fill="none"
      stroke="#ff6b1a"
      strokeWidth="2"
    />
    <circle cx="24" cy="24" r="17" fill="none" stroke="#ff6b1a" strokeWidth="1.5" />
    <path d="M24 0 V10 M24 38 V48 M0 24 H10 M38 24 H48" stroke="#ff6b1a" strokeWidth="2" />
    <path d="M24 14 L34 24 L24 34 L14 24 Z" fill="#ff6b1a" />
    <circle cx="24" cy="24" r="3" fill="#060a12" />
  </svg>
);

const Craft = ({ x, y }: { x: number; y: number }) => (
  <MorphElement id="craft">
    <div style={{ position: 'absolute', left: x - 24, top: y - 24, width: 48, height: 48 }}>
      <CraftGlyph />
    </div>
  </MorphElement>
);

const DIAGRAM_LEFT = 120;
const DIAGRAM_TOP = 214;
const OUTBOUND = 'M 240 117 C 620 0, 1100 20, 1425.1 150.3';
const RETURN = 'M 1440 321 C 1100 450, 620 470, 240 353';

const Badge = ({ x, y, n }: { x: number; y: number; n: string }) => (
  <g>
    <rect
      x={x - 22}
      y={y - 16}
      width="44"
      height="32"
      fill="#060a12"
      stroke="#ff6b1a"
      strokeWidth="2"
    />
    <text
      x={x}
      y={y + 7}
      textAnchor="middle"
      style={{ fontFamily: mono, fontSize: 18, fontWeight: 500, fill: '#ff6b1a' }}
    >
      {n}
    </text>
  </g>
);

const svgLabel: CSSProperties = {
  fontFamily: mono,
  fontSize: 17,
  letterSpacing: '0.12em',
  fill: muted,
};

const TrajectoryDiagram = ({ active, draw }: { active?: 1 | 2 | 3; draw?: boolean }) => {
  const isActive = useIsActivePage();
  const animateDraw = draw && isActive;
  const animateActive = !draw && isActive;
  const segStroke = (n: 1 | 2 | 3) => {
    if (draw) return '#e7edf5';
    return active === n ? '#ff6b1a' : steel;
  };
  const segWidth = (n: 1 | 2 | 3) => (active === n || draw ? 3.5 : 2);
  const baseOpacity = draw ? 0.35 : 1;
  const drawClass = (n: 1 | 2 | 3, delay: number) => {
    if (animateDraw) return { className: 'lm-draw', style: { animationDelay: `${delay}s` } };
    if (animateActive && active === n)
      return { className: 'lm-draw', style: { animationDelay: `${MORPH_MS / 1000}s` } };
    return {};
  };
  return (
    <svg
      width={1680}
      height={470}
      viewBox="0 0 1680 470"
      style={{ position: 'absolute', left: DIAGRAM_LEFT, top: DIAGRAM_TOP, overflow: 'visible' }}
    >
      <circle
        cx="240"
        cy="235"
        r="118"
        fill="none"
        stroke={steel}
        strokeWidth="2"
        opacity={baseOpacity}
      />
      <circle
        cx="240"
        cy="235"
        r="118"
        fill="none"
        stroke={segStroke(1)}
        strokeWidth={segWidth(1)}
        pathLength={1}
        {...drawClass(1, 0)}
      />
      <circle cx="240" cy="235" r="74" fill="#0c1628" stroke="#e7edf5" strokeWidth="2" />
      <ellipse cx="240" cy="235" rx="74" ry="28" fill="none" stroke={steel} strokeWidth="1" />
      <ellipse cx="240" cy="235" rx="30" ry="74" fill="none" stroke={steel} strokeWidth="1" />
      <path d="M 166 235 H 314 M 240 161 V 309" stroke={steel} strokeWidth="1" />
      <path d={RETURN} fill="none" stroke={steel} strokeWidth="2" strokeDasharray="8 10" />
      <path d={OUTBOUND} fill="none" stroke={steel} strokeWidth="2" opacity={baseOpacity} />
      <path
        d={OUTBOUND}
        fill="none"
        stroke={segStroke(2)}
        strokeWidth={segWidth(2)}
        pathLength={1}
        {...drawClass(2, 0.5)}
      />
      <circle
        cx="1440"
        cy="235"
        r="86"
        fill="none"
        stroke={steel}
        strokeWidth="2"
        opacity={baseOpacity}
      />
      <circle
        cx="1440"
        cy="235"
        r="86"
        fill="none"
        stroke={segStroke(3)}
        strokeWidth={segWidth(3)}
        pathLength={1}
        {...drawClass(3, 1.6)}
      />
      <circle cx="1440" cy="235" r="40" fill="#1a2232" stroke="#e7edf5" strokeWidth="2" />
      <circle cx="1428" cy="224" r="8" fill="#121a28" />
      <circle cx="1452" cy="250" r="6" fill="#121a28" />
      <text x="104" y="241" textAnchor="end" style={svgLabel}>
        LEO 185 KM
      </text>
      <text x="240" y="400" textAnchor="middle" style={{ ...svgLabel, fill: '#e7edf5' }}>
        EARTH
      </text>
      <text x="660" y="84" textAnchor="middle" style={svgLabel}>
        TLI · 3.18 KM/S
      </text>
      <text x="860" y="404" textAnchor="middle" style={svgLabel}>
        FREE-RETURN · ABORT PATH
      </text>
      <text x="1540" y="318" style={svgLabel}>
        LLO 100 KM
      </text>
      <text x="1440" y="364" textAnchor="middle" style={{ ...svgLabel, fill: '#e7edf5' }}>
        MOON
      </text>
      <path d="M 240 448 H 1440" stroke={line} strokeWidth="1" />
      <path d="M 240 440 V 456 M 1440 440 V 456" stroke={muted} strokeWidth="1.5" />
      <text x="1180" y="440" textAnchor="middle" style={{ ...svgLabel, fontSize: 15 }}>
        384,400 KM
      </text>
      {draw ? (
        <g>
          <Badge x={338} y={318} n="01" />
          <Badge x={660} y={120} n="02" />
          <Badge x={1336} y={128} n="03" />
          <Badge x={1440} y={235} n="04" />
        </g>
      ) : null}
    </svg>
  );
};

const PhaseTimeline = ({ phase }: { phase: 1 | 2 | 3 | 4 }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 870,
        width: 1680,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        ...label,
      }}
    >
      <span style={{ color: phase === 1 ? accent : muted }}>01 · Launch / LEO</span>
      <span style={{ color: phase === 2 ? accent : muted }}>02 · TLI / Coast</span>
      <span style={{ color: phase === 3 ? accent : muted }}>03 · LOI / Orbit</span>
      <span style={{ color: phase === 4 ? accent : muted }}>04 · Descent / Surface</span>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 912,
        width: 1680,
        height: 2,
        background: line,
      }}
    />
    <div
      style={{ position: 'absolute', left: 540, top: 904, width: 2, height: 18, background: muted }}
    />
    <div
      style={{ position: 'absolute', left: 960, top: 904, width: 2, height: 18, background: muted }}
    />
    <div
      style={{
        position: 'absolute',
        left: 1380,
        top: 904,
        width: 2,
        height: 18,
        background: muted,
      }}
    />
    <MorphElement id="phase-fill">
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 909,
          width: 420 * phase,
          height: 8,
          background: '#ff6b1a',
        }}
      />
    </MorphElement>
  </>
);

const Readout = ({ k, v, sub }: { k: string; v: string; sub: string }) => (
  <div
    style={{
      background: panel,
      border: `1px solid ${line}`,
      borderTop: '2px solid #e7edf5',
      padding: '14px 22px 0',
      height: 146,
      boxSizing: 'border-box',
    }}
  >
    <div style={label}>{k}</div>
    <div
      style={{
        marginTop: 6,
        fontFamily: display,
        fontWeight: 600,
        fontSize: 54,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {v}
    </div>
    <div style={{ marginTop: 6, fontSize: 18, color: muted }}>{sub}</div>
  </div>
);

const ReadoutRow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      top: 700,
      width: 1680,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 24,
    }}
  >
    {children}
  </div>
);

const Moon = () => (
  <svg
    width={800}
    height={800}
    viewBox="0 0 800 800"
    style={{ position: 'absolute', left: 1120, top: 150, overflow: 'visible' }}
  >
    <defs>
      <radialGradient id="lm-moon" cx="0.36" cy="0.34" r="0.8">
        <stop offset="0" stopColor="#3a4458" />
        <stop offset="0.55" stopColor="#1b2231" />
        <stop offset="1" stopColor="#0a0e16" />
      </radialGradient>
      <clipPath id="lm-moon-clip">
        <circle cx="400" cy="400" r="350" />
      </clipPath>
    </defs>
    <circle cx="400" cy="400" r="350" fill="url(#lm-moon)" />
    <g clipPath="url(#lm-moon-clip)" opacity="0.85">
      <circle cx="300" cy="260" r="46" fill="#151b27" stroke="#4a5670" strokeWidth="2" />
      <circle cx="470" cy="360" r="70" fill="#141a26" stroke="#46526b" strokeWidth="2" />
      <circle cx="250" cy="470" r="30" fill="#151b27" stroke="#4a5670" strokeWidth="2" />
      <circle cx="380" cy="560" r="54" fill="#121824" stroke="#3f4a61" strokeWidth="2" />
      <circle cx="560" cy="540" r="24" fill="#121824" stroke="#3f4a61" strokeWidth="2" />
      <circle cx="560" cy="210" r="18" fill="#151b27" stroke="#4a5670" strokeWidth="2" />
      <circle cx="420" cy="700" r="80" fill="#0f141e" stroke="#384258" strokeWidth="2" />
      <ellipse cx="400" cy="400" rx="350" ry="120" fill="none" stroke="rgba(140,170,220,0.15)" />
      <ellipse cx="400" cy="400" rx="120" ry="350" fill="none" stroke="rgba(140,170,220,0.15)" />
    </g>
    <circle
      cx="400"
      cy="400"
      r="350"
      fill="none"
      stroke="#e7edf5"
      strokeOpacity="0.5"
      strokeWidth="2"
    />
    <g className="lm-spin">
      <circle
        cx="400"
        cy="400"
        r="392"
        fill="none"
        stroke="#ff6b1a"
        strokeWidth="2"
        strokeDasharray="4 14"
      />
      <circle cx="400" cy="8" r="7" fill="#ff6b1a" />
    </g>
    <path d="M 400 650 V 760 M 400 40 V 150" stroke="#ff6b1a" strokeWidth="2" />
    <circle cx="420" cy="700" r="26" fill="none" stroke="#ff6b1a" strokeWidth="2" />
    <path
      d="M 420 660 V 676 M 420 724 V 740 M 380 700 H 396 M 444 700 H 460"
      stroke="#ff6b1a"
      strokeWidth="2"
    />
    <text
      x="376"
      y="690"
      textAnchor="end"
      style={{ fontFamily: mono, fontSize: 18, fill: '#ff6b1a', letterSpacing: '0.12em' }}
    >
      TGT · SITE 004
    </text>
    <text
      x="376"
      y="716"
      textAnchor="end"
      style={{ fontFamily: mono, fontSize: 16, fill: muted, letterSpacing: '0.12em' }}
    >
      89.46°S 222.7°E
    </text>
  </svg>
);

const CoverStat = ({ k, v }: { k: string; v: string }) => (
  <div style={{ borderLeft: '2px solid #ff6b1a', paddingLeft: 18 }}>
    <div style={label}>{k}</div>
    <div
      style={{ marginTop: 6, fontFamily: display, fontWeight: 600, fontSize: 40, lineHeight: 1.05 }}
    >
      {v}
    </div>
  </div>
);

const Cover: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Moon />
    <Chrome section="§ 00 · Cover" />
    <div style={{ position: 'absolute', left: 120, top: 200 }}>
      <div style={{ ...label, color: accent, fontSize: 22 }}>
        Crewed lunar landing · Mission briefing
      </div>
      <div
        style={{
          marginTop: 20,
          fontFamily: display,
          fontWeight: 700,
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 0.86,
          letterSpacing: '-0.005em',
        }}
      >
        SELENE<span style={{ color: accent }}> IV</span>
      </div>
      <div
        style={{
          marginTop: 30,
          width: 900,
          fontSize: 30,
          lineHeight: 1.45,
          color: '#c3cddb',
        }}
      >
        Four crew. Eleven days. The first landing on the south polar Connecting Ridge.
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 720,
        width: 960,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        rowGap: 36,
        columnGap: 48,
      }}
    >
      <CoverStat k="Launch window opens" v="2027-03-14 · 06:42:10 UTC" />
      <CoverStat k="Mission duration" v="11 D 06 H 18 M" />
      <CoverStat k="Stack" v="HELIOS HLV · ARGO · TALOS" />
      <CoverStat k="Flight director" v="K. Abernathy · Gold team" />
    </div>
  </div>
);

const Objective = ({ n, title, text }: { n: string; title: string; text: string }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '90px 1fr',
      padding: '32px 0',
      borderBottom: `1px solid ${line}`,
    }}
  >
    <span
      style={{ fontFamily: display, fontWeight: 600, fontSize: 44, color: accent, lineHeight: 1 }}
    >
      {n}
    </span>
    <div>
      <div
        style={{
          fontFamily: display,
          fontWeight: 600,
          fontSize: 40,
          lineHeight: 1.05,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 8, fontSize: 22, color: muted, lineHeight: 1.4 }}>{text}</div>
    </div>
  </div>
);

const Figure = ({ k, v, unit }: { k: string; v: string; unit: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '18px 0',
      borderBottom: `1px solid ${line}`,
    }}
  >
    <span style={label}>{k}</span>
    <span>
      <span
        style={{
          fontFamily: display,
          fontWeight: 600,
          fontSize: 56,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {v}
      </span>
      <span style={{ marginLeft: 10, fontSize: 20, color: muted }}>{unit}</span>
    </span>
  </div>
);

const Overview: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 01 · Mission overview" />
    <Heading kicker="§ 01 · Mission overview" title="Primary objectives" />
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 270,
        width: 960,
        borderTop: '2px solid #e7edf5',
      }}
    >
      <Objective
        n="01"
        title="Land two crew at Site 004"
        text="Touchdown within 100 m of target on the Connecting Ridge."
      />
      <Objective
        n="02"
        title="Deploy the RIDGE package"
        text="Seismometer, heat-flow probe and laser retroreflector."
      />
      <Objective
        n="03"
        title="Return 85 kg of samples"
        text="Including cores from a permanently shadowed region."
      />
      <Objective
        n="04"
        title="Certify TALOS for long stays"
        text="Six surface days, four EVAs, full ascent and rendezvous."
      />
    </div>
    <div style={{ position: 'absolute', left: 1220, top: 270, width: 580 }}>
      <div
        style={{ ...label, color: '#e7edf5', paddingBottom: 14, borderBottom: '2px solid #e7edf5' }}
      >
        Key figures
      </div>
      <Figure k="Crew" v="4" unit="2 surface · 2 orbit" />
      <Figure k="Surface stay" v="6.6" unit="days" />
      <Figure k="EVAs" v="4 × 7" unit="hours" />
      <Figure k="ΔV post-LEO" v="8.74" unit="km/s" />
      <Figure k="Splashdown" v="03-25" unit="Pacific" />
    </div>
  </div>
);

const Insignia = ({ initials, surface }: { initials: string; surface?: boolean }) => (
  <svg width={150} height={150} viewBox="0 0 150 150" style={{ display: 'block' }}>
    <circle cx="75" cy="75" r="70" fill="#0c1424" stroke="#e7edf5" strokeWidth="2" />
    <circle cx="75" cy="75" r="58" fill="none" stroke={line} strokeWidth="1" />
    <ellipse
      cx="75"
      cy="75"
      rx="68"
      ry="22"
      fill="none"
      stroke={surface ? '#ff6b1a' : steel}
      strokeWidth="2"
      transform="rotate(-24 75 75)"
    />
    <circle cx="137" cy="50" r="5" fill={surface ? '#ff6b1a' : steel} />
    <text
      x="75"
      y="90"
      textAnchor="middle"
      style={{
        fontFamily: display,
        fontWeight: 700,
        fontSize: 46,
        fill: '#e7edf5',
        letterSpacing: '0.04em',
      }}
    >
      {initials}
    </text>
  </svg>
);

const CrewCard = ({
  pos,
  name,
  duty,
  initials,
  flights,
  hours,
  surface,
}: {
  pos: string;
  name: string;
  duty: string;
  initials: string;
  flights: string;
  hours: string;
  surface?: boolean;
}) => (
  <div
    style={{
      background: panel,
      border: `1px solid ${line}`,
      borderTop: `3px solid ${surface ? '#ff6b1a' : '#e7edf5'}`,
      padding: 30,
      height: 580,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Insignia initials={initials} surface={surface} />
      <span
        style={{
          ...label,
          color: surface ? '#060a12' : '#e7edf5',
          background: surface ? '#ff6b1a' : 'transparent',
          border: `1px solid ${surface ? '#ff6b1a' : muted}`,
          padding: '6px 10px',
        }}
      >
        {surface ? 'Surface' : 'Orbit'}
      </span>
    </div>
    <div
      style={{
        marginTop: 30,
        fontFamily: display,
        fontWeight: 700,
        fontSize: 30,
        color: accent,
        letterSpacing: '0.08em',
      }}
    >
      {pos}
    </div>
    <div
      style={{
        marginTop: 4,
        fontFamily: display,
        fontWeight: 600,
        fontSize: 46,
        lineHeight: 1.02,
        textTransform: 'uppercase',
      }}
    >
      {name}
    </div>
    <div style={{ marginTop: 12, fontSize: 22, color: '#c3cddb', lineHeight: 1.4 }}>{duty}</div>
    <div
      style={{
        marginTop: 'auto',
        display: 'flex',
        gap: 30,
        paddingTop: 18,
        borderTop: `1px solid ${line}`,
      }}
    >
      <div>
        <div style={label}>Flights</div>
        <div style={{ fontFamily: display, fontWeight: 600, fontSize: 36 }}>{flights}</div>
      </div>
      <div>
        <div style={label}>Hours</div>
        <div style={{ fontFamily: display, fontWeight: 600, fontSize: 36 }}>{hours}</div>
      </div>
    </div>
  </div>
);

const Crew: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 02 · Crew" />
    <Heading kicker="§ 02 · Flight crew" title="Four seats, two landers" />
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 280,
        width: 1680,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 24,
      }}
    >
      <CrewCard
        pos="CDR"
        name="Mara Okafor"
        duty="Commander. Flies TALOS descent and ascent."
        initials="MO"
        flights="2"
        hours="4,310"
        surface
      />
      <CrewCard
        pos="MS1"
        name="Aiko Tanabe"
        duty="Planetary geologist. Leads all four EVAs."
        initials="AT"
        flights="1"
        hours="1,980"
        surface
      />
      <CrewCard
        pos="PLT"
        name="Daniel Reyes"
        duty="Pilot. Holds ARGO in lunar orbit for rendezvous."
        initials="DR"
        flights="2"
        hours="3,645"
      />
      <CrewCard
        pos="MS2"
        name="Jonas Weller"
        duty="Flight engineer. Orbital science and comms relay."
        initials="JW"
        flights="0"
        hours="—"
      />
    </div>
  </div>
);

const SpecRow = ({ k, v, unit }: { k: string; v: string; unit: string }) => (
  <div style={{ padding: '18px 0', borderBottom: `1px solid ${line}` }}>
    <div style={label}>{k}</div>
    <div style={{ marginTop: 4 }}>
      <span style={{ fontFamily: display, fontWeight: 600, fontSize: 64, lineHeight: 1 }}>{v}</span>
      <span style={{ marginLeft: 10, fontSize: 22, color: muted }}>{unit}</span>
    </div>
  </div>
);

const Callout = ({
  y,
  fromX,
  code,
  name,
  spec,
  hot,
}: {
  y: number;
  fromX: number;
  code: string;
  name: string;
  spec: string;
  hot?: boolean;
}) => (
  <g>
    <circle cx={fromX} cy={y} r="4" fill={hot ? '#ff6b1a' : '#e7edf5'} />
    <path d={`M ${fromX} ${y} H 430`} stroke={hot ? '#ff6b1a' : muted} strokeWidth="1.5" />
    <text
      x="446"
      y={y - 2}
      style={{ fontFamily: mono, fontSize: 19, fill: '#ff6b1a', letterSpacing: '0.14em' }}
    >
      {code}
    </text>
    <text
      x="560"
      y={y - 2}
      style={{
        fontFamily: display,
        fontWeight: 600,
        fontSize: 30,
        fill: '#e7edf5',
        letterSpacing: '0.02em',
      }}
    >
      {name}
    </text>
    <text x="446" y={y + 28} style={{ fontFamily: mono, fontSize: 19, fill: muted }}>
      {spec}
    </text>
  </g>
);

const Vehicle: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 03 · Vehicle" />
    <Heading kicker="§ 03 · Integrated stack" title="HELIOS HLV · Block 2" />
    <svg
      width={933}
      height={686}
      viewBox="0 0 1060 780"
      style={{ position: 'absolute', left: 160, top: 282 }}
    >
      <defs>
        <pattern
          id="lm-hatch"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="2" height="10" fill="rgba(140,170,220,0.28)" />
        </pattern>
      </defs>
      <path d="M 176 6 L 184 6 L 186 46 L 174 46 Z" fill="none" stroke="#e7edf5" strokeWidth="2" />
      <path
        d="M 172 46 L 188 46 L 196 66 L 164 66 Z"
        fill="none"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <path d="M 180 46 L 180 6" stroke="#e7edf5" strokeWidth="1" />
      <path
        d="M 166 72 L 194 72 L 222 132 L 138 132 Z"
        fill="rgba(255,107,26,0.18)"
        stroke="#ff6b1a"
        strokeWidth="2.5"
      />
      <rect
        x="138"
        y="132"
        width="84"
        height="66"
        fill="url(#lm-hatch)"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <path
        d="M 138 198 L 222 198 L 246 318 L 114 318 Z"
        fill="none"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <path
        d="M 156 300 L 160 252 L 200 252 L 204 300 M 150 300 H 210 M 168 252 L 172 232 H 188 L 192 252"
        fill="none"
        stroke="#ff6b1a"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      <rect x="114" y="318" width="132" height="150" fill="none" stroke="#e7edf5" strokeWidth="2" />
      <path d="M 114 360 H 246 M 114 430 H 246" stroke={line} strokeWidth="1.5" />
      <rect
        x="114"
        y="468"
        width="132"
        height="26"
        fill="url(#lm-hatch)"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <rect x="114" y="494" width="132" height="244" fill="none" stroke="#e7edf5" strokeWidth="2" />
      <path d="M 114 560 H 246 M 114 680 H 246" stroke={line} strokeWidth="1.5" />
      <path
        d="M 124 738 L 144 738 L 148 770 L 120 770 Z M 152 738 L 172 738 L 176 770 L 148 770 Z M 188 738 L 208 738 L 212 770 L 184 770 Z M 216 738 L 236 738 L 240 770 L 212 770 Z"
        fill="none"
        stroke="#e7edf5"
        strokeWidth="1.5"
      />
      <path
        d="M 70 430 Q 70 392 88 380 Q 106 392 106 430 Z"
        fill="none"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <rect
        x="70"
        y="430"
        width="36"
        height="300"
        fill="url(#lm-hatch)"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <path
        d="M 74 730 L 102 730 L 108 764 L 68 764 Z"
        fill="none"
        stroke="#e7edf5"
        strokeWidth="1.5"
      />
      <path
        d="M 254 430 Q 254 392 272 380 Q 290 392 290 430 Z"
        fill="none"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <rect
        x="254"
        y="430"
        width="36"
        height="300"
        fill="url(#lm-hatch)"
        stroke="#e7edf5"
        strokeWidth="2"
      />
      <path
        d="M 258 730 L 286 730 L 292 764 L 252 764 Z"
        fill="none"
        stroke="#e7edf5"
        strokeWidth="1.5"
      />
      <path d="M 30 6 V 770 M 22 6 H 38 M 22 770 H 38" stroke={muted} strokeWidth="1.5" />
      <text
        x="18"
        y="388"
        textAnchor="middle"
        transform="rotate(-90 18 388)"
        style={{ fontFamily: mono, fontSize: 17, fill: muted, letterSpacing: '0.14em' }}
      >
        98.4 M
      </text>
      <Callout
        y={30}
        fromX={186}
        code="LAS"
        name="LAUNCH ABORT SYSTEM"
        spec="Pulls ARGO clear at 15 g in 2.5 s"
      />
      <Callout
        y={102}
        fromX={208}
        code="CM"
        name="ARGO CREW MODULE"
        spec="4 crew · 11.4 m³ habitable"
        hot
      />
      <Callout
        y={170}
        fromX={222}
        code="SM"
        name="SERVICE MODULE"
        spec="OMS-E main engine · 26.7 kN"
      />
      <Callout
        y={270}
        fromX={238}
        code="LM"
        name="TALOS LANDER (STOWED)"
        spec="2 crew · 6.6 days on surface"
        hot
      />
      <Callout
        y={396}
        fromX={246}
        code="US-2"
        name="UPPER STAGE"
        spec="LH2 / LOX · performs TLI burn"
      />
      <Callout
        y={540}
        fromX={290}
        code="SRB"
        name="TWIN SOLID BOOSTERS"
        spec="5-segment · 126 s burn"
      />
      <Callout
        y={650}
        fromX={246}
        code="CORE"
        name="CORE STAGE"
        spec="4 × main engines · 480 s burn"
      />
    </svg>
    <div
      style={{
        position: 'absolute',
        left: 1320,
        top: 280,
        width: 480,
        borderTop: '2px solid #e7edf5',
      }}
    >
      <SpecRow k="Height" v="98.4" unit="m" />
      <SpecRow k="Liftoff mass" v="2,612" unit="t" />
      <SpecRow k="Liftoff thrust" v="39.1" unit="MN" />
      <SpecRow k="Payload to TLI" v="46.0" unit="t" />
    </div>
  </div>
);

const PhaseCard = ({
  n,
  title,
  time,
  text,
}: {
  n: string;
  title: string;
  time: string;
  text: string;
}) => (
  <div style={{ borderTop: '2px solid #e7edf5', paddingTop: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: display, fontWeight: 600, fontSize: 34, color: accent }}>{n}</span>
      <span style={label}>{time}</span>
    </div>
    <div
      style={{
        marginTop: 4,
        fontFamily: display,
        fontWeight: 600,
        fontSize: 36,
        textTransform: 'uppercase',
      }}
    >
      {title}
    </div>
    <div style={{ marginTop: 6, fontSize: 20, color: muted, lineHeight: 1.4 }}>{text}</div>
  </div>
);

const Trajectory: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 04 · Trajectory" />
    <Heading kicker="§ 04 · Flight profile" title="Free-return trajectory" />
    <TrajectoryDiagram draw />
    <Craft x={DIAGRAM_LEFT + 277} y={DIAGRAM_TOP + 171} />
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 730,
        width: 1680,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 36,
      }}
    >
      <PhaseCard
        n="01"
        title="Launch · LEO"
        time="T+0 → 1h 32m"
        text="Ascent, insertion, one checkout orbit."
      />
      <PhaseCard
        n="02"
        title="TLI · Coast"
        time="3d 04h"
        text="Upper stage burn onto a free-return path."
      />
      <PhaseCard
        n="03"
        title="LOI · Orbit"
        time="1d 06h"
        text="Far-side capture into 100 km polar orbit."
      />
      <PhaseCard n="04" title="Descent" time="12 min" text="TALOS powered descent to Site 004." />
    </div>
  </div>
);
Trajectory.transition = morphCut;

const PhaseHeading = ({ n, title }: { n: string; title: string }) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      top: 108,
      display: 'flex',
      alignItems: 'flex-end',
      gap: 28,
    }}
  >
    <div>
      <div style={{ ...label, color: accent }}>Phase {n} / 04</div>
      <h2
        style={{
          margin: '8px 0 0',
          fontFamily: display,
          fontWeight: 600,
          fontSize: 76,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h2>
    </div>
  </div>
);

const PhaseLaunch: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 04 · Trajectory · Phase 01" />
    <PhaseHeading n="01" title="Launch & parking orbit" />
    <TrajectoryDiagram active={1} />
    <Craft x={DIAGRAM_LEFT + 323.4} y={DIAGRAM_TOP + 151.6} />
    <ReadoutRow>
      <Readout k="Liftoff" v="06:42:10" sub="UTC · 14 Mar 2027 · LC-39" />
      <Readout k="Orbit insertion" v="T+8:41" sub="MECO + OMS-1 circularise" />
      <Readout k="Parking orbit" v="185 KM" sub="Circular · 28.5° inclination" />
      <Readout k="Time in LEO" v="1H 32M" sub="One rev · systems checkout" />
    </ReadoutRow>
    <PhaseTimeline phase={1} />
  </div>
);
PhaseLaunch.transition = morphCut;

const PhaseCoast: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 04 · Trajectory · Phase 02" />
    <PhaseHeading n="02" title="Trans-lunar injection & coast" />
    <TrajectoryDiagram active={2} />
    <Craft x={DIAGRAM_LEFT + 853} y={DIAGRAM_TOP + 41} />
    <ReadoutRow>
      <Readout k="TLI burn" v="3.18 KM/S" sub="ΔV · 18 min on US-2" />
      <Readout k="Coast" v="3D 04H" sub="Free-return if SM fails" />
      <Readout k="Mid-course" v="3 BURNS" sub="MCC-1, -2, -4 · <5 m/s each" />
      <Readout k="Peak velocity" v="10.9 KM/S" sub="At TLI cutoff" />
    </ReadoutRow>
    <PhaseTimeline phase={2} />
  </div>
);
PhaseCoast.transition = morphCut;

const PhaseOrbit: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 04 · Trajectory · Phase 03" />
    <PhaseHeading n="03" title="Lunar orbit insertion" />
    <TrajectoryDiagram active={3} />
    <Craft x={DIAGRAM_LEFT + 1526} y={DIAGRAM_TOP + 235} />
    <ReadoutRow>
      <Readout k="LOI burn" v="0.91 KM/S" sub="Far side · retrograde" />
      <Readout k="Loss of signal" v="47 MIN" sub="No comms behind the Moon" />
      <Readout k="Lunar orbit" v="100 KM" sub="Polar · 2h 07m period" />
      <Readout k="Undock" v="REV 12" sub="TALOS separates from ARGO" />
    </ReadoutRow>
    <PhaseTimeline phase={3} />
  </div>
);
PhaseOrbit.transition = morphCut;

const contourRing = (cx: number, cy: number, r: number, seed: number) => {
  let d = '';
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    const rr =
      r *
      (1 +
        0.09 * Math.sin(3 * t + seed) +
        0.05 * Math.sin(5 * t + seed * 1.7) +
        0.025 * Math.sin(11 * t + seed * 0.6));
    const x = cx + rr * Math.cos(t) * 1.3;
    const y = cy + rr * Math.sin(t);
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `${d}Z`;
};
const RIDGE_CONTOURS = [36, 72, 112, 156, 204, 258, 318, 384]
  .map((r, i) => contourRing(520, 300, r, i * 0.7))
  .join(' ');
const CRATER_CONTOURS = [24, 50, 80, 112].map((r, i) => contourRing(210, 150, r, 2 + i)).join(' ');

const SiteRow = ({ k, v }: { k: string; v: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '13px 0',
      borderBottom: `1px solid ${line}`,
    }}
  >
    <span style={label}>{k}</span>
    <span style={{ fontFamily: display, fontWeight: 600, fontSize: 34 }}>{v}</span>
  </div>
);

const MAP_LEFT = 120;
const MAP_TOP = 248;

const mapLabel: CSSProperties = {
  ...svgLabel,
  paintOrder: 'stroke',
  stroke: '#08101c',
  strokeWidth: 8,
  strokeLinejoin: 'round',
};

const LandingSite: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 05 · Landing site" />
    <PhaseHeading n="04" title="Descent to Site 004" />
    <svg
      width={980}
      height={600}
      viewBox="0 0 980 600"
      style={{ position: 'absolute', left: MAP_LEFT, top: MAP_TOP }}
    >
      <defs>
        <pattern
          id="lm-psr"
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="2" height="9" fill="rgba(140,170,220,0.35)" />
        </pattern>
        <clipPath id="lm-map-clip">
          <rect width="980" height="600" />
        </clipPath>
      </defs>
      <rect width="980" height="600" fill="#08101c" />
      <g clipPath="url(#lm-map-clip)">
        <path
          d="M 0 98 H 980 M 0 196 H 980 M 0 294 H 980 M 0 392 H 980 M 0 490 H 980 M 0 588 H 980"
          stroke="rgba(140,170,220,0.08)"
        />
        <path
          d="M 98 0 V 600 M 196 0 V 600 M 294 0 V 600 M 392 0 V 600 M 490 0 V 600 M 588 0 V 600 M 686 0 V 600 M 784 0 V 600 M 882 0 V 600"
          stroke="rgba(140,170,220,0.08)"
        />
        <path d={RIDGE_CONTOURS} fill="none" stroke="rgba(160,190,235,0.42)" strokeWidth="1.4" />
        <path
          d={CRATER_CONTOURS}
          fill="url(#lm-psr)"
          fillRule="evenodd"
          stroke="rgba(160,190,235,0.42)"
          strokeWidth="1.4"
        />
        <path d="M 980 80 L 610 291" stroke="#ff6b1a" strokeWidth="2" strokeDasharray="10 8" />
        <circle cx="610" cy="291" r="5" fill="#ff6b1a" />
        <ellipse
          cx="500"
          cy="332"
          rx="118"
          ry="70"
          fill="rgba(255,107,26,0.08)"
          stroke="#ff6b1a"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <path
          d="M 500 230 V 300 M 500 364 V 434 M 360 332 H 468 M 532 332 H 640"
          stroke="#ff6b1a"
          strokeWidth="1.5"
        />
      </g>
      <rect width="980" height="600" fill="none" stroke={line} strokeWidth="2" />
      <text x="210" y="304" textAnchor="middle" style={{ ...mapLabel, fill: '#c3cddb' }}>
        PSR · SHADOWED CRATER
      </text>
      <text x="690" y="300" style={{ ...mapLabel, fill: '#ff6b1a' }}>
        APPROACH · AZ 212°
      </text>
      <text x="636" y="420" style={{ ...mapLabel, fill: '#ff6b1a' }}>
        ELLIPSE 240 × 140 M
      </text>
      <text x="20" y="584" style={mapLabel}>
        89.52°S
      </text>
      <text x="960" y="584" textAnchor="end" style={mapLabel}>
        223.4°E
      </text>
      <path d="M 40 540 H 236" stroke="#e7edf5" strokeWidth="2" />
      <path d="M 40 532 V 548 M 138 536 V 544 M 236 532 V 548" stroke="#e7edf5" strokeWidth="2" />
      <text x="40" y="520" style={mapLabel}>
        0
      </text>
      <text x="236" y="520" textAnchor="middle" style={mapLabel}>
        1 KM
      </text>
      <path d="M 930 490 L 940 526 L 930 518 L 920 526 Z" fill="#e7edf5" />
      <text x="930" y="480" textAnchor="middle" style={{ ...mapLabel, fill: '#e7edf5' }}>
        N
      </text>
    </svg>
    <Craft x={MAP_LEFT + 500} y={MAP_TOP + 332} />
    <div style={{ position: 'absolute', left: 1180, top: 248, width: 620 }}>
      <div
        style={{ ...label, color: '#e7edf5', paddingBottom: 12, borderBottom: '2px solid #e7edf5' }}
      >
        Site 004 · Connecting Ridge
      </div>
      <SiteRow k="Latitude" v="89.46° S" />
      <SiteRow k="Longitude" v="222.7° E" />
      <SiteRow k="Elevation" v="+1,912 M" />
      <SiteRow k="Mean slope" v="3.8°" />
      <SiteRow k="Sunlight" v="82% of lunar day" />
      <SiteRow k="Earth in view" v="71% · DTE comms" />
      <SiteRow k="Powered descent" v="12 MIN 40 S" />
    </div>
    <PhaseTimeline phase={4} />
  </div>
);
LandingSite.transition = morphCut;

const AbortRow = ({
  mode,
  window: win,
  trigger,
  response,
}: {
  mode: string;
  window: string;
  trigger: string;
  response: string;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '220px 300px 520px 1fr',
      alignItems: 'center',
      height: 92,
      borderBottom: `1px solid ${line}`,
      fontSize: 24,
    }}
  >
    <span>
      <span
        style={{
          fontFamily: display,
          fontWeight: 700,
          fontSize: 34,
          color: '#060a12',
          background: '#ff6b1a',
          padding: '2px 14px',
        }}
      >
        {mode}
      </span>
    </span>
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{win}</span>
    <span style={{ color: '#c3cddb' }}>{trigger}</span>
    <span>{response}</span>
  </div>
);

const Aborts: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 06 · Abort modes" />
    <Heading kicker="§ 06 · Contingency" title="Abort modes by flight phase" />
    <div style={{ position: 'absolute', left: 120, top: 290, width: 1680 }}>
      <div
        style={{
          height: 14,
          background: 'repeating-linear-gradient(-45deg, #ff6b1a 0 14px, #060a12 14px 28px)',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 300px 520px 1fr',
          padding: '18px 0 14px',
          borderBottom: '2px solid #e7edf5',
          ...label,
          color: '#e7edf5',
        }}
      >
        <span>Mode</span>
        <span>Window</span>
        <span>Trigger</span>
        <span>Response</span>
      </div>
      <AbortRow
        mode="1A"
        window="T-0 → T+2:10"
        trigger="Booster or core anomaly"
        response="LAS fires · CM under chutes"
      />
      <AbortRow
        mode="1B"
        window="T+2:10 → T+6:40"
        trigger="Core stage failure"
        response="CM/SM separate · splashdown"
      />
      <AbortRow
        mode="2"
        window="T+6:40 → MECO"
        trigger="Late engine-out"
        response="Abort-to-orbit on US-2"
      />
      <AbortRow
        mode="3"
        window="TLI → LOI"
        trigger="SM propulsion loss"
        response="Free-return · Earth in ~4 d"
      />
      <AbortRow
        mode="4"
        window="PDI → touchdown"
        trigger="TALOS anomaly"
        response="Ascent stage fires to orbit"
      />
    </div>
    <div style={{ position: 'absolute', left: 120, top: 900, fontSize: 22, color: muted }}>
      <span style={{ color: accent }}>▲</span>&nbsp;&nbsp;Mode 3 is why we fly free-return: no
      engine required to come home.
    </div>
  </div>
);

const POLL_TOP = 270;
const POLL_ROW = 72;

const PollName = ({ code, desc }: { code: string; desc: string }) => (
  <div
    style={{
      height: POLL_ROW,
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      borderBottom: `1px solid ${line}`,
      boxSizing: 'border-box',
    }}
  >
    <span style={{ width: 210, fontFamily: display, fontWeight: 600, fontSize: 38 }}>{code}</span>
    <span style={{ fontSize: 20, color: muted }}>{desc}</span>
  </div>
);

const StatusBox = ({ go }: { go?: boolean }) => (
  <div
    style={{ height: POLL_ROW, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
  >
    <span
      style={{
        width: 120,
        textAlign: 'center',
        fontFamily: display,
        fontWeight: 700,
        fontSize: go ? 32 : 22,
        letterSpacing: '0.1em',
        padding: '4px 0',
        color: go ? '#060a12' : muted,
        background: go ? '#ff6b1a' : '#060a12',
        border: `1px solid ${go ? '#ff6b1a' : muted}`,
      }}
    >
      {go ? 'GO' : 'STBY'}
    </span>
  </div>
);

const useCountdown = (startSec: number) => {
  const active = useIsActivePage();
  const [t, setT] = useState(startSec);
  useEffect(() => {
    if (!active) return;
    setT(startSec);
    const id = setInterval(() => setT((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [active, startSec]);
  return t;
};

const Countdown = () => {
  const t = useCountdown(600);
  const hh = String(Math.floor(t / 3600)).padStart(2, '0');
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 600,
        fontSize: 150,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ color: accent }}>T–</span>
      {hh}:{mm}:{ss}
    </div>
  );
};

const GoNoGo: Page = () => (
  <div style={fill}>
    <Blueprint />
    <Chrome section="§ 07 · Launch poll" />
    <Heading kicker="§ 07 · Terminal count" title="Go / No-go poll" />
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: POLL_TOP,
        width: 900,
        borderTop: '2px solid #e7edf5',
      }}
    >
      <PollName code="BOOSTER" desc="Launch vehicle systems" />
      <PollName code="RETRO" desc="Entry & landing planning" />
      <PollName code="FIDO" desc="Flight dynamics" />
      <PollName code="GUIDANCE" desc="Nav & onboard software" />
      <PollName code="SURGEON" desc="Crew health" />
      <PollName code="EECOM" desc="Power & life support" />
      <PollName code="NETWORK" desc="Ground stations & DSN" />
      <PollName code="CAPCOM" desc="Crew communications" />
    </div>
    <div style={{ position: 'absolute', left: 880, top: POLL_TOP + 2, width: 140 }}>
      <StatusBox />
      <StatusBox />
      <StatusBox />
      <StatusBox />
      <StatusBox />
      <StatusBox />
      <StatusBox />
      <StatusBox />
    </div>
    <div style={{ position: 'absolute', left: 880, top: POLL_TOP + 2, width: 140 }}>
      <Steps>
        <Step duration={120}>
          <StatusBox go />
        </Step>
        <Step duration={120}>
          <StatusBox go />
        </Step>
        <Step duration={120}>
          <StatusBox go />
        </Step>
        <Step duration={120}>
          <StatusBox go />
        </Step>
        <Step duration={120}>
          <StatusBox go />
        </Step>
        <Step duration={120}>
          <StatusBox go />
        </Step>
        <Step duration={120}>
          <StatusBox go />
        </Step>
        <Step duration={120}>
          <StatusBox go />
        </Step>
      </Steps>
    </div>
    <div style={{ position: 'absolute', left: 1120, top: POLL_TOP, width: 680 }}>
      <div
        style={{ ...label, color: '#e7edf5', paddingBottom: 12, borderBottom: '2px solid #e7edf5' }}
      >
        <span className="lm-blink" style={{ color: accent }}>
          ●
        </span>
        &nbsp;&nbsp;Count · Built-in hold released
      </div>
      <div style={{ marginTop: 34 }}>
        <Countdown />
      </div>
      <div style={{ marginTop: 18, fontSize: 22, color: muted, lineHeight: 1.5 }}>
        Window opens 06:42:10 UTC · closes 08:52:10 UTC
      </div>
      <div style={{ marginTop: 40 }}>
        <Steps>
          <Step duration={400}>
            <div
              style={{
                border: '2px solid #ff6b1a',
                padding: '22px 28px',
                background: 'rgba(255,107,26,0.1)',
              }}
            >
              <div style={{ ...label, color: accent }}>Flight → Launch control</div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: 52,
                  lineHeight: 1.02,
                  textTransform: 'uppercase',
                }}
              >
                SELENE IV,
                <br />
                you are go for launch.
              </div>
            </div>
          </Step>
        </Steps>
      </div>
    </div>
  </div>
);

const Closing: Page = () => (
  <div style={fill}>
    <Blueprint />
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <radialGradient id="lm-earth" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#dfe8f5" />
          <stop offset="0.6" stopColor="#7d93b5" />
          <stop offset="1" stopColor="#24324a" />
        </radialGradient>
        <linearGradient id="lm-horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3243" />
          <stop offset="1" stopColor="#0a0e16" />
        </linearGradient>
      </defs>
      <circle cx="1440" cy="560" r="96" fill="url(#lm-earth)" />

      <circle
        cx="1440"
        cy="560"
        r="130"
        fill="none"
        stroke="#ff6b1a"
        strokeWidth="1.5"
        strokeDasharray="4 10"
      />
      <path d="M -200 1080 Q 960 640 2120 1080 Z" fill="url(#lm-horizon)" />
      <path
        d="M -200 1080 Q 960 640 2120 1080"
        fill="none"
        stroke="#e7edf5"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      <circle cx="560" cy="930" r="34" fill="none" stroke="rgba(140,170,220,0.3)" strokeWidth="2" />
      <circle
        cx="1240"
        cy="960"
        r="22"
        fill="none"
        stroke="rgba(140,170,220,0.3)"
        strokeWidth="2"
      />
      <circle
        cx="840"
        cy="1000"
        r="46"
        fill="none"
        stroke="rgba(140,170,220,0.25)"
        strokeWidth="2"
      />
      <text
        x="1590"
        y="520"
        style={{ fontFamily: mono, fontSize: 18, fill: '#ff6b1a', letterSpacing: '0.14em' }}
      >
        EARTH · 384,400 KM
      </text>
      <text
        x="1590"
        y="548"
        style={{ fontFamily: mono, fontSize: 16, fill: muted, letterSpacing: '0.14em' }}
      >
        DTE LINK NOMINAL
      </text>
    </svg>
    <Chrome section="§ 08 · End of briefing" />
    <div style={{ position: 'absolute', left: 120, top: 200 }}>
      <div style={{ ...label, color: accent, fontSize: 22 }}>
        End of briefing · Questions to Flight
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: display,
          fontWeight: 700,
          fontSize: 190,
          lineHeight: 0.9,
          textTransform: 'uppercase',
        }}
      >
        Godspeed,
        <br />
        SELENE<span style={{ color: accent }}> IV</span>
      </div>
      <div style={{ marginTop: 36, fontSize: 26, color: '#c3cddb', lineHeight: 1.5, width: 960 }}>
        Next: crew quarantine L–7 · Final readiness review L–3
      </div>
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'SELENE IV — Mission Briefing',
  createdAt: '2026-10-07T16:00:54.580Z',
};

export const notes: (string | undefined)[] = [
  `Good morning. This is the flight readiness briefing for SELENE IV.
Four crew, eleven days, and the first landing on the Connecting Ridge at the lunar south pole. Window opens March 14th at 06:42 UTC.`,
  `Four primary objectives. Land two crew within a hundred metres of Site 004. Deploy the RIDGE package. Bring home 85 kilograms, including the shadowed-region cores. And certify TALOS for long stays.
Key number to remember: 8.74 kilometres per second of delta-V after we leave low Earth orbit.`,
  `Meet the crew. Commander Okafor and Dr Tanabe take TALOS to the surface. Daniel Reyes and Jonas Weller hold ARGO in lunar orbit.
Jonas is our rookie — first flight.`,
  `The integrated stack, top to bottom: abort tower, ARGO, the service module, TALOS stowed in the adapter, upper stage, core, and twin boosters.
Ninety-eight metres, thirty-nine meganewtons at liftoff, forty-six tonnes through TLI.`,
  `Here's the whole flight profile. Watch the path draw: parking orbit, trans-lunar injection, capture at the Moon.
The dashed line is the free-return — if the service module fails on the way out, physics brings the crew home. Follow the orange marker through the next four pages.`,
  `Phase one. Liftoff, insertion at T plus eight forty-one, one revolution in a 185 kilometre parking orbit while we check out every system.`,
  `Phase two. The upper stage burns for eighteen minutes — 3.18 kilometres per second — and we're on a free-return coast for just over three days. Three small mid-course corrections planned.`,
  `Phase three. Lunar orbit insertion happens on the far side, so we lose signal for forty-seven minutes. Expect a quiet room.
On rev twelve, TALOS undocks.`,
  `Phase four: descent to Site 004. Twelve minutes forty of powered descent, approach from azimuth 212, into a 240 by 140 metre ellipse on the ridge.
Eighty-two percent sunlight, Earth in view seventy-one percent of the time.`,
  `Abort modes, by phase. Walk the table top to bottom.
Land on mode three: we fly free-return so that no engine is required to come home.`,
  `Final poll. Call each console and click as they answer GO.
When CAPCOM confirms, click once more for Flight's call.`,
  `That's the briefing. Questions to Flight. Godspeed, SELENE IV.`,
];

export default [
  Cover,
  Overview,
  Crew,
  Vehicle,
  Trajectory,
  PhaseLaunch,
  PhaseCoast,
  PhaseOrbit,
  LandingSite,
  Aborts,
  GoNoGo,
  Closing,
] satisfies Page[];

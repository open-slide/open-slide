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
  palette: { bg: '#f4f3ef', text: '#111111', accent: '#e3000f' },
  fonts: {
    display: '"Inter Tight", "Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Inter Tight", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  typeScale: { hero: 240, body: 32 },
  radius: 0,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;700&display=swap';
const FONT_LINK_ID = 'osd-webfont-swiss-wayfinding';
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

const STYLE_ID = 'osd-styles-swiss-wayfinding';
const css = `@keyframes swiss-pulse { 0% { r: 16; opacity: .9 } 100% { r: 46; opacity: 0 } }`;
if (typeof document !== 'undefined') {
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

const muted = '#77766f';
const hair = 'rgba(17, 17, 17, 0.08)';
const panel = '#111111';

const line = {
  u1: '#f28c00',
  u2: '#0062b1',
  u3: '#ffcc00',
  u4: '#009a4e',
  u5: '#7b3f98',
  u6: '#8c6a4f',
};

const M = 120;
const grid12: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  columnGap: 24,
};

const GridLines = () => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      left: M,
      right: M,
      top: 0,
      bottom: 0,
      pointerEvents: 'none',
      backgroundImage: `repeating-linear-gradient(to right, ${hair} 0 1px, transparent 1px 117px, ${hair} 117px 118px, transparent 118px 142px)`,
    }}
  />
);

const pad = (n: number) => String(n).padStart(2, '0');

const Folio = ({ section }: { section: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        ...grid12,
        position: 'absolute',
        left: M,
        right: M,
        bottom: 56,
        borderTop: '2px solid var(--osd-text)',
        paddingTop: 14,
        fontSize: 22,
        fontWeight: 500,
        lineHeight: 1.2,
      }}
    >
      <span style={{ gridColumn: '1 / span 3' }}>Velmar U — Wayfinding</span>
      <span style={{ gridColumn: '4 / span 3', color: muted }}>{section}</span>
      <span style={{ gridColumn: '7 / span 3', color: muted }}>Studio Haller Brun</span>
      <span style={{ gridColumn: '10 / span 3', textAlign: 'right' }}>
        {pad(current)}
        <span style={{ color: muted }}> / {pad(total)}</span>
      </span>
    </div>
  );
};

const Kicker = ({ n, label }: { n: string; label: string }) => (
  <div
    style={{
      ...grid12,
      position: 'absolute',
      left: M,
      right: M,
      top: 56,
      borderTop: '6px solid var(--osd-text)',
      paddingTop: 14,
      fontSize: 22,
      fontWeight: 700,
      lineHeight: 1.2,
    }}
  >
    <span style={{ gridColumn: '1 / span 1', color: 'var(--osd-accent)' }}>{n}</span>
    <span style={{ gridColumn: '2 / span 5' }}>{label}</span>
  </div>
);

const Frame = ({ n, label, children }: { n: string; label: string; children: ReactNode }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
      letterSpacing: '-0.01em',
    }}
  >
    <GridLines />
    <Kicker n={n} label={label} />
    {children}
    <Folio section={`${n} ${label}`} />
  </div>
);

const Body = ({ children, top = 180 }: { children: ReactNode; top?: number }) => (
  <div style={{ ...grid12, position: 'absolute', left: M, right: M, top }}>{children}</div>
);

const H = ({
  children,
  size = 72,
  span = 12,
}: {
  children: ReactNode;
  size?: number;
  span?: number;
}) => (
  <h2
    style={{
      gridColumn: `1 / span ${span}`,
      fontFamily: 'var(--osd-font-display)',
      fontSize: size,
      fontWeight: 700,
      lineHeight: 1.04,
      letterSpacing: '-0.035em',
      margin: 0,
    }}
  >
    {children}
  </h2>
);

const Bullet = ({
  color,
  n,
  size = 150,
  dark = false,
}: {
  color: string;
  n: string;
  size?: number;
  dark?: boolean;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      color: dark ? '#111111' : '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.52,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      flexShrink: 0,
    }}
  >
    {n}
  </div>
);

const MetaBlock = ({ k, v }: { k: string; v: string }) => (
  <div style={{ gridColumn: 'span 3', fontSize: 22, lineHeight: 1.35, fontWeight: 500 }}>
    <div style={{ color: muted }}>{k}</div>
    <div style={{ whiteSpace: 'pre-line' }}>{v}</div>
  </div>
);

const Cover: Page = () => (
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
    <GridLines />
    <div
      style={{
        ...grid12,
        position: 'absolute',
        left: M,
        right: M,
        top: 56,
        borderTop: '6px solid var(--osd-text)',
        paddingTop: 16,
      }}
    >
      <MetaBlock k="Client" v={'Velmar Verkehrsbetriebe\nVVB Metro Division'} />
      <MetaBlock k="Project" v={'Wayfinding System 2027\nPhase 3 — Design freeze'} />
      <MetaBlock k="Studio" v={'Studio Haller Brun\nZürich / Velmar'} />
      <MetaBlock k="Issue" v={'October 2026\nRevision 4.2'} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: M + 142 * 9,
        top: 250,
        width: 402,
        height: 402,
        borderRadius: '50%',
        background: 'var(--osd-accent)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: M + 142 * 9,
        top: 672,
        width: 402,
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.3,
      }}
    >
      You are here.
      <div style={{ fontWeight: 500, color: muted }}>The only red on the network.</div>
    </div>
    <h1
      style={{
        position: 'absolute',
        left: M - 12,
        bottom: 236,
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 700,
        lineHeight: 0.86,
        letterSpacing: '-0.055em',
      }}
    >
      Find
      <br />
      your way.
    </h1>
    <div
      style={{
        ...grid12,
        position: 'absolute',
        left: M,
        right: M,
        bottom: 72,
        borderTop: '2px solid var(--osd-text)',
        paddingTop: 20,
        alignItems: 'start',
      }}
    >
      <p
        style={{
          gridColumn: '1 / span 6',
          margin: 0,
          fontSize: 'var(--osd-size-body)',
          fontWeight: 500,
          lineHeight: 1.3,
        }}
      >
        A signage system for 64 stations, six lines and 1.1 million daily journeys.
      </p>
      <div style={{ gridColumn: '9 / span 4', display: 'flex', gap: 12 }}>
        <Bullet color={line.u1} n="1" size={56} />
        <Bullet color={line.u2} n="2" size={56} />
        <Bullet color={line.u3} n="3" size={56} dark />
        <Bullet color={line.u4} n="4" size={56} />
        <Bullet color={line.u5} n="5" size={56} />
        <Bullet color={line.u6} n="6" size={56} />
      </div>
    </div>
  </div>
);

const Fact = ({ value, label }: { value: string; label: string }) => (
  <div style={{ borderTop: '2px solid var(--osd-text)', paddingTop: 16, marginBottom: 44 }}>
    <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em' }}>
      {value}
    </div>
    <div style={{ fontSize: 26, lineHeight: 1.35, marginTop: 12, fontWeight: 500 }}>{label}</div>
  </div>
);

const Problem: Page = () => (
  <Frame n="01" label="The problem">
    <Body top={196}>
      <div style={{ gridColumn: '1 / span 8' }}>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 470,
            fontWeight: 700,
            lineHeight: 0.78,
            letterSpacing: '-0.07em',
            marginLeft: -20,
          }}
        >
          41<span style={{ color: 'var(--osd-accent)' }}>%</span>
        </div>
        <p
          style={{
            fontSize: 52,
            fontWeight: 500,
            lineHeight: 1.12,
            margin: '64px 0 0',
            maxWidth: 980,
            letterSpacing: '-0.025em',
          }}
        >
          of first-time riders leave Zentrum by the wrong exit.
        </p>
      </div>
      <div style={{ gridColumn: '9 / span 4', paddingTop: 8 }}>
        <Fact value="7" label="sign families in service, spanning four decades of contracts." />
        <Fact value="212" label="different arrow drawings found in the 2025 station audit." />
        <Fact value="18 min" label="median transfer time at Zentrum. The target is six." />
      </div>
    </Body>
  </Frame>
);

const Rule = ({ n, title, body }: { n: string; title: string; body: string }) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 240,
        fontWeight: 700,
        lineHeight: 0.8,
        letterSpacing: '-0.06em',
        marginLeft: -10,
      }}
    >
      {n}
    </div>
    <div style={{ height: 4, background: 'var(--osd-text)', marginTop: 32 }} />
    <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: 22 }}>
      <span style={{ width: 16, height: 16, background: 'var(--osd-accent)', flexShrink: 0 }} />
      <h3
        style={{
          margin: 0,
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: '-0.025em',
        }}
      >
        {title}
      </h3>
    </div>
    <p style={{ fontSize: 28, lineHeight: 1.42, margin: '18px 0 0', fontWeight: 400 }}>{body}</p>
  </div>
);

const Principles: Page = () => (
  <Frame n="02" label="Principles">
    <Body>
      <H span={10}>Three rules hold the system together.</H>
    </Body>
    <div
      style={{
        position: 'absolute',
        left: M,
        right: M,
        top: 340,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        columnGap: 24,
      }}
    >
      <Steps>
        <Step duration={260}>
          <Rule
            n="1"
            title="Sign only where a choice is made."
            body="Nothing between decision points. A corridor with one way forward gets no sign at all."
          />
        </Step>
        <Step duration={260}>
          <Rule
            n="2"
            title="Colour names the line. Red names you."
            body="Six line colours, never reused for anything else. Red is reserved for you-are-here and stop."
          />
        </Step>
        <Step duration={260}>
          <Rule
            n="3"
            title="Same thing, same place, every station."
            body="Exits are always top right. Line bullets always lead. Riders learn it once, at the first station."
          />
        </Step>
      </Steps>
    </div>
  </Frame>
);

const LineCard = ({
  n,
  color,
  name,
  from,
  to,
  km,
  stations,
  spec,
  dark,
}: {
  n: string;
  color: string;
  name: string;
  from: string;
  to: string;
  km: string;
  stations: number;
  spec: string;
  dark?: boolean;
}) => (
  <div style={{ gridColumn: 'span 2' }}>
    <Bullet color={color} n={n} size={168} dark={dark} />
    <div style={{ height: 12, background: color, marginTop: 36 }} />
    <div style={{ fontSize: 36, fontWeight: 700, marginTop: 20, letterSpacing: '-0.025em' }}>
      {name}
    </div>
    <div style={{ fontSize: 26, lineHeight: 1.3, marginTop: 8, fontWeight: 500 }}>
      {from}
      <br />
      <span style={{ color: muted }}>→</span> {to}
    </div>
    <div
      style={{
        borderTop: '2px solid var(--osd-text)',
        marginTop: 22,
        paddingTop: 12,
        fontSize: 22,
        lineHeight: 1.4,
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {km} km · {stations} stations
      <div style={{ color: muted }}>{spec}</div>
    </div>
  </div>
);

const Lines: Page = () => (
  <Frame n="03" label="Line colours">
    <Body>
      <H span={7}>Colour names the line.</H>
      <p
        style={{
          gridColumn: '8 / span 5',
          margin: 0,
          fontSize: 28,
          lineHeight: 1.38,
          fontWeight: 500,
          alignSelf: 'end',
        }}
      >
        Six hues, spaced for colour-blind separation and tested on wet platforms under sodium light.{' '}
        <span style={{ color: 'var(--osd-accent)' }}>Red is never a line.</span>
      </p>
    </Body>
    <Body top={384}>
      <LineCard
        n="1"
        color={line.u1}
        name="Hafenlinie"
        from="Westpark"
        to="Ostkreuz"
        km="18.2"
        stations={14}
        spec="Pantone 151 C"
      />
      <LineCard
        n="2"
        color={line.u2}
        name="Nordlinie"
        from="Flughafen"
        to="Nordbahnhof"
        km="21.7"
        stations={12}
        spec="Pantone 2935 C"
      />
      <LineCard
        n="3"
        color={line.u3}
        name="Ringlinie"
        from="Nordheide"
        to="Südring"
        km="9.4"
        stations={11}
        spec="Pantone 116 C"
        dark
      />
      <LineCard
        n="4"
        color={line.u4}
        name="Seelinie"
        from="Seetor"
        to="Ostkreuz"
        km="12.8"
        stations={10}
        spec="Pantone 7726 C"
      />
      <LineCard
        n="5"
        color={line.u5}
        name="Werftlinie"
        from="Universität"
        to="Werft"
        km="8.1"
        stations={9}
        spec="Pantone 2597 C"
      />
      <LineCard
        n="6"
        color={line.u6}
        name="Stadionlinie"
        from="Messe"
        to="Südost"
        km="6.6"
        stations={8}
        spec="Pantone 7517 C"
      />
    </Body>
  </Frame>
);

const Seg = ({ d, color }: { d: string; color: string }) => (
  <path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth={16}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const Stn = ({
  x,
  y,
  label,
  dx = 26,
  dy = 8,
  anchor = 'start',
}: {
  x: number;
  y: number;
  label: string;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'middle' | 'end';
}) => (
  <g>
    <circle cx={x} cy={y} r={15} fill="#ffffff" stroke="#111111" strokeWidth={5} />
    <text
      x={x + dx}
      y={y + dy}
      textAnchor={anchor}
      fontSize={22}
      fontWeight={500}
      fill="#111111"
      style={{ fontFamily: 'var(--osd-font-body)', letterSpacing: '-0.01em' }}
    >
      {label}
    </text>
  </g>
);

const Network: Page = () => (
  <Frame n="04" label="Network diagram">
    <Body>
      <div style={{ gridColumn: '1 / span 3' }}>
        <H size={60}>Drawn at 45° and 90°. Nothing else.</H>
        <p style={{ fontSize: 26, lineHeight: 1.42, margin: '36px 0 0', fontWeight: 500 }}>
          Geography bends to clarity. Distances are equalised, so riders count stops, not
          kilometres.
        </p>
        <div
          style={{
            marginTop: 40,
            borderTop: '2px solid var(--osd-text)',
            paddingTop: 16,
            fontSize: 22,
            lineHeight: 1.6,
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '5px solid #111',
                boxSizing: 'border-box',
              }}
            />
            Interchange
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--osd-accent)',
              }}
            />
            You are here
          </div>
        </div>
      </div>
    </Body>
    <svg
      viewBox="0 0 1240 720"
      width={1240}
      height={720}
      style={{ position: 'absolute', left: M + 142 * 3 + 14, top: 196 }}
      aria-label="Velmar U network diagram"
    >
      <Seg d="M 60 360 H 800 L 920 480 H 1180" color={line.u1} />
      <Seg d="M 140 600 H 380 L 620 360 V 60" color={line.u2} />
      <Seg d="M 440 60 V 680" color={line.u3} />
      <Seg d="M 260 360 L 420 200 H 960 L 1180 420 V 480" color={line.u4} />
      <Seg d="M 800 680 V 360 L 960 200 V 60" color={line.u5} />
      <Seg d="M 380 600 H 1100" color={line.u6} />
      <Stn x={60} y={360} label="Westpark" dx={0} dy={-30} anchor="middle" />
      <Stn x={260} y={360} label="Seetor" dx={0} dy={46} anchor="middle" />
      <Stn x={440} y={360} label="Altmarkt" dx={22} dy={46} anchor="start" />
      <Stn x={620} y={360} label="Zentrum" dx={26} dy={44} />
      <Stn x={800} y={360} label="Glasfabrik" dx={-24} dy={-24} anchor="end" />
      <Stn x={1180} y={480} label="Ostkreuz" dx={0} dy={50} anchor="middle" />
      <Stn x={140} y={600} label="Flughafen" dx={0} dy={50} anchor="middle" />
      <Stn x={380} y={600} label="Messe" dx={0} dy={50} anchor="middle" />
      <Stn x={440} y={540} label="Kanalstraße" dx={26} dy={8} />
      <Stn x={620} y={200} label="Lindenhof" dx={26} dy={-20} />
      <Stn x={620} y={60} label="Nordbahnhof" dx={26} dy={8} />
      <Stn x={440} y={60} label="Nordheide" dx={-26} dy={8} anchor="end" />
      <Stn x={440} y={680} label="Südring" dx={-26} dy={8} anchor="end" />
      <Stn x={960} y={200} label="Hafenplatz" dx={-26} dy={-20} anchor="end" />
      <Stn x={960} y={60} label="Werft" dx={26} dy={8} />
      <Stn x={800} y={600} label="Stadion" dx={26} dy={-18} />
      <Stn x={800} y={680} label="Universität" dx={26} dy={8} />
      <Stn x={1100} y={600} label="Südost" dx={0} dy={50} anchor="middle" />
      <circle
        cx={620}
        cy={360}
        r={16}
        fill="none"
        stroke="var(--osd-accent)"
        strokeWidth={4}
        style={{ animation: 'swiss-pulse 2.4s cubic-bezier(0,0,0.2,1) infinite' }}
      />
      <circle cx={620} cy={360} r={17} fill="var(--osd-accent)" />
    </svg>
  </Frame>
);

const Tile = ({ label, de, children }: { label: string; de: string; children: ReactNode }) => (
  <div>
    <div
      style={{
        width: 252,
        height: 252,
        background: panel,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={176}
        height={176}
        fill="#ffffff"
        stroke="#ffffff"
        aria-hidden
      >
        {children}
      </svg>
    </div>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 14,
        fontSize: 22,
        fontWeight: 700,
        width: 252,
      }}
    >
      <span>{label}</span>
      <span style={{ color: muted, fontWeight: 500 }}>{de}</span>
    </div>
  </div>
);

const Pictograms: Page = () => (
  <Frame n="05" label="Pictograms">
    <Body>
      <div style={{ gridColumn: '1 / span 4' }}>
        <H size={72}>34 symbols. One stroke.</H>
        <p style={{ fontSize: 28, lineHeight: 1.42, margin: '36px 0 0', fontWeight: 500 }}>
          Drawn on a 100-unit grid with an 8-unit stroke and square ends, so a pictogram and a
          letterform carry the same weight at any size.
        </p>
        <p
          style={{
            fontSize: 22,
            lineHeight: 1.5,
            margin: '28px 0 0',
            fontWeight: 500,
            color: muted,
          }}
        >
          Tested with 140 riders. Mean recognition 94%, lowest: “interchange” at 81%.
        </p>
      </div>
      <div
        style={{
          gridColumn: '6 / span 7',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 252px)',
          columnGap: 24,
          rowGap: 44,
          justifyContent: 'end',
        }}
      >
        <Tile label="Exit" de="Ausgang">
          <rect x={18} y={16} width={40} height={68} fill="none" strokeWidth={8} />
          <path d="M44 50 H86" strokeWidth={8} fill="none" />
          <path d="M70 34 L88 50 L70 66 Z" stroke="none" />
        </Tile>
        <Tile label="Stairs" de="Treppe">
          <path d="M12 86 V72 H32 V56 H50 V40 H68 V24 H88 V86 Z" stroke="none" />
        </Tile>
        <Tile label="Lift" de="Aufzug">
          <rect x={22} y={12} width={56} height={76} fill="none" strokeWidth={8} />
          <path d="M50 24 L64 42 H36 Z M50 76 L64 58 H36 Z" stroke="none" />
        </Tile>
        <Tile label="Toilets" de="WC">
          <circle cx={28} cy={20} r={8} stroke="none" />
          <path d="M18 34 H38 V60 H34 V88 H22 V60 H18 Z" stroke="none" />
          <path d="M50 12 V88" strokeWidth={4} />
          <circle cx={72} cy={20} r={8} stroke="none" />
          <path d="M64 34 H80 L88 66 H80 V88 H64 V66 H56 Z" stroke="none" />
        </Tile>
        <Tile label="Tickets" de="Fahrkarten">
          <path d="M12 30 H88 V42 A8 8 0 0 0 88 58 V70 H12 V58 A8 8 0 0 0 12 42 Z" stroke="none" />
          <path d="M64 32 V68" stroke="#111111" strokeWidth={4} strokeDasharray="6 5" />
        </Tile>
        <Tile label="Interchange" de="Umstieg">
          <path d="M12 36 H72" strokeWidth={8} fill="none" />
          <path d="M66 22 L88 36 L66 50 Z" stroke="none" />
          <path d="M88 64 H28" strokeWidth={8} fill="none" />
          <path d="M34 50 L12 64 L34 78 Z" stroke="none" />
        </Tile>
        <Tile label="Step-free" de="Barrierefrei">
          <circle cx={42} cy={16} r={8} stroke="none" />
          <path d="M42 30 V58 H66 L74 82 H84" fill="none" strokeWidth={8} strokeLinejoin="miter" />
          <path d="M42 42 H62" strokeWidth={8} />
          <path d="M30 50 A22 22 0 1 0 64 76" fill="none" strokeWidth={8} />
        </Tile>
        <Tile label="Bicycles" de="Velo">
          <circle cx={24} cy={64} r={16} fill="none" strokeWidth={7} />
          <circle cx={76} cy={64} r={16} fill="none" strokeWidth={7} />
          <path
            d="M24 64 L40 38 H66 L76 64 M40 38 L52 64 L66 38 M36 28 H48 M66 38 L62 24 H72"
            fill="none"
            strokeWidth={6}
            strokeLinejoin="round"
          />
        </Tile>
      </div>
    </Body>
  </Frame>
);

const Tag = ({ x, y, ch }: { x: number; y: number; ch: string }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: 'var(--osd-accent)',
      color: '#ffffff',
      fontSize: 24,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {ch}
  </div>
);

const Dim = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => {
  const vertical = h > w;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: 'border-box',
        borderStyle: 'solid',
        borderColor: 'var(--osd-accent)',
        borderWidth: vertical ? '3px 0 3px 0' : '0 3px 0 3px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          background: 'var(--osd-accent)',
          ...(vertical
            ? { left: '50%', top: 0, bottom: 0, width: 3, marginLeft: -1 }
            : { top: '50%', left: 0, right: 0, height: 3, marginTop: -1 }),
        }}
      />
    </div>
  );
};

const Spec = ({ ch, title, body }: { ch: string; title: string; body: string }) => (
  <div style={{ borderTop: '2px solid var(--osd-text)', paddingTop: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--osd-accent)',
          color: '#fff',
          fontSize: 22,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ch}
      </span>
      <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</span>
    </div>
    <p style={{ fontSize: 26, lineHeight: 1.4, margin: '14px 0 0', fontWeight: 500 }}>{body}</p>
  </div>
);

const SIGN_TOP = 236;

const Anatomy: Page = () => (
  <Frame n="06" label="Sign anatomy">
    <div style={{ position: 'absolute', right: M, top: 166, fontSize: 22, fontWeight: 700 }}>
      Platform sign, type P-2 <span style={{ color: muted, fontWeight: 500 }}>· scale 1 : 10</span>
    </div>
    <div
      style={{
        position: 'absolute',
        left: M,
        top: SIGN_TOP,
        width: 1680,
        height: 300,
        background: panel,
        color: '#ffffff',
      }}
    >
      <div style={{ position: 'absolute', left: 48, top: 83, display: 'flex', gap: 16 }}>
        <Bullet color={line.u1} n="1" size={134} />
        <Bullet color={line.u2} n="2" size={134} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 380,
          top: 84,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 132,
          lineHeight: '132px',
          fontWeight: 700,
          letterSpacing: '-0.035em',
        }}
      >
        Zentrum
      </div>
      <div
        style={{
          position: 'absolute',
          right: 48 + 134 + 36,
          top: 96,
          textAlign: 'right',
          fontSize: 42,
          lineHeight: 1.12,
          fontWeight: 500,
        }}
      >
        Exit 3<div style={{ color: '#9a9a94' }}>Marktgasse</div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 48,
          top: 83,
          width: 134,
          height: 134,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 100 100" width={96} height={96} aria-hidden>
          <path d="M14 50 H70" stroke="#111" strokeWidth={14} />
          <path d="M52 22 L86 50 L52 78 Z" fill="#111" />
        </svg>
      </div>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        columnGap: 24,
        padding: `640px ${M}px 0`,
      }}
    >
      <Steps>
        <Step duration={240}>
          <Dim x={M + 362} y={SIGN_TOP + 102} w={14} h={96} />
          <Tag x={M + 347} y={SIGN_TOP - 62} ch="A" />
          <div
            style={{
              position: 'absolute',
              left: M + 369,
              top: SIGN_TOP - 18,
              width: 3,
              height: 120,
              background: 'var(--osd-accent)',
            }}
          />
          <Spec
            ch="A"
            title="Cap height 100 mm"
            body="The module. Every other measure on the sign is a multiple of it."
          />
        </Step>
        <Step duration={240}>
          <Dim x={M + 48} y={SIGN_TOP + 320} w={134} h={14} />
          <Tag x={M + 93} y={SIGN_TOP + 354} ch="B" />
          <Spec
            ch="B"
            title="Bullet = 1.4 × cap"
            body="Line bullets always lead, ordered by line number, never by importance."
          />
        </Step>
        <Step duration={240}>
          <Dim x={M} y={SIGN_TOP - 34} w={48} h={14} />
          <Tag x={M + 2} y={SIGN_TOP - 96} ch="C" />
          <Spec
            ch="C"
            title="Margin = 0.5 × cap"
            body="Same margin on all four sides, so signs butt together into one band."
          />
        </Step>
        <Step duration={240}>
          <div
            style={{
              position: 'absolute',
              left: M + 1680 - 48 - 134 - 12,
              top: SIGN_TOP + 71,
              width: 158,
              height: 158,
              border: '3px solid var(--osd-accent)',
              boxSizing: 'border-box',
            }}
          />
          <Tag x={M + 1680 - 48 - 89} y={SIGN_TOP + 320} ch="D" />
          <Spec
            ch="D"
            title="Arrow sits outermost"
            body="On the side it points to. Read the sign edge-first and you already know where to turn."
          />
        </Step>
      </Steps>
    </div>
  </Frame>
);

const Size = ({ px, mm, m, use }: { px: number; mm: number; m: string; use: string }) => (
  <div>
    <div style={{ height: 260, display: 'flex', alignItems: 'flex-end' }}>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: px,
          lineHeight: 0.727,
          fontWeight: 700,
          letterSpacing: '-0.04em',
        }}
      >
        Z
      </div>
    </div>
    <div style={{ borderTop: '2px solid var(--osd-text)', marginTop: 28, paddingTop: 18 }}>
      <div style={{ height: 8, width: Number(m) * 4.8, background: 'var(--osd-accent)' }} />
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: '-0.035em',
          marginTop: 22,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {mm} mm
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, marginTop: 10 }}>read at {m} m</div>
      <div style={{ fontSize: 22, lineHeight: 1.35, marginTop: 10, fontWeight: 500, color: muted }}>
        {use}
      </div>
    </div>
  </div>
);

const Legibility: Page = () => (
  <Frame n="07" label="Legibility">
    <Body>
      <H span={8}>Cap height follows distance.</H>
      <p
        style={{
          gridColumn: '9 / span 4',
          margin: 0,
          fontSize: 26,
          lineHeight: 1.4,
          fontWeight: 500,
          alignSelf: 'end',
        }}
      >
        One ratio, 1 : 250, for every sign. Red bars show reading distance to scale.
      </p>
    </Body>
    <div
      style={{
        position: 'absolute',
        left: M,
        right: M,
        top: 360,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        columnGap: 24,
      }}
    >
      <Steps>
        <Step duration={240}>
          <Size px={58} mm={40} m="10" use="Timetables, platform columns" />
        </Step>
        <Step duration={240}>
          <Size px={86} mm={60} m="15" use="Exit numbers, lift call points" />
        </Step>
        <Step duration={240}>
          <Size px={142} mm={100} m="25" use="Station name on the track wall" />
        </Step>
        <Step duration={240}>
          <Size px={212} mm={150} m="37.5" use="Concourse direction signs" />
        </Step>
        <Step duration={240}>
          <Size px={352} mm={250} m="62.5" use="Street entrance totems" />
        </Step>
      </Steps>
    </div>
  </Frame>
);

const Quarter = ({ q, year }: { q: string; year?: string }) => (
  <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
    <div style={{ color: year ? 'var(--osd-text)' : 'transparent' }}>{year ?? '—'}</div>
    <div style={{ color: muted, fontWeight: 500 }}>{q}</div>
  </div>
);

const Phase = ({
  start,
  span,
  n,
  title,
  sub,
  red,
}: {
  start: number;
  span: number;
  n: string;
  title: string;
  sub: string;
  red?: boolean;
}) => (
  <div style={{ ...grid12, height: 132 }}>
    <div
      style={{
        gridColumn: `${start} / span ${span}`,
        background: red ? 'var(--osd-accent)' : panel,
        color: '#ffffff',
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 112,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}
      >
        <span style={{ opacity: 0.6, marginRight: 14 }}>{n}</span>
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, opacity: 0.8, whiteSpace: 'nowrap' }}>{sub}</div>
    </div>
  </div>
);

const Rollout: Page = () => (
  <Frame n="08" label="Rollout">
    <Body>
      <H span={9}>Three years, one station at a time.</H>
    </Body>
    <div style={{ position: 'absolute', left: M, right: M, top: 330 }}>
      <div
        style={{
          ...grid12,
          borderBottom: '2px solid var(--osd-text)',
          paddingBottom: 14,
          marginBottom: 28,
        }}
      >
        <Quarter q="Q1" year="2027" />
        <Quarter q="Q2" />
        <Quarter q="Q3" />
        <Quarter q="Q4" />
        <Quarter q="Q1" year="2028" />
        <Quarter q="Q2" />
        <Quarter q="Q3" />
        <Quarter q="Q4" />
        <Quarter q="Q1" year="2029" />
        <Quarter q="Q2" />
        <Quarter q="Q3" />
        <Quarter q="Q4" />
      </div>
      <Steps>
        <Step duration={240}>
          <Phase start={1} span={2} n="1" title="Pilot" sub="Zentrum, Altmarkt" red />
        </Step>
        <Step duration={240}>
          <Phase
            start={3}
            span={4}
            n="2"
            title="Lines U1 + U2"
            sub="26 stations · night installs"
          />
        </Step>
        <Step duration={240}>
          <Phase
            start={6}
            span={5}
            n="3"
            title="Lines U3 — U6"
            sub="38 stations · 4,100 sign faces"
          />
        </Step>
        <Step duration={240}>
          <Phase start={10} span={3} n="4" title="Street level" sub="Totems, live displays" />
        </Step>
      </Steps>
    </div>
  </Frame>
);

const Quote: Page = () => (
  <Frame n="09" label="Client">
    <Body top={270}>
      <div
        style={{
          gridColumn: '1 / span 1',
          fontSize: 300,
          fontWeight: 700,
          lineHeight: 0.8,
          color: 'var(--osd-accent)',
          marginTop: -10,
        }}
      >
        “
      </div>
      <blockquote
        style={{
          gridColumn: '2 / span 10',
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 108,
          fontWeight: 700,
          lineHeight: 1.02,
          letterSpacing: '-0.045em',
        }}
      >
        A good sign is one nobody remembers reading. They only remember{' '}
        <span style={{ color: 'var(--osd-accent)' }}>arriving.</span>
      </blockquote>
      <div
        style={{
          gridColumn: '2 / span 6',
          marginTop: 72,
          borderTop: '2px solid var(--osd-text)',
          paddingTop: 16,
          fontSize: 26,
          lineHeight: 1.4,
          fontWeight: 500,
        }}
      >
        <div style={{ fontWeight: 700 }}>Ines Morandi</div>
        <div style={{ color: muted }}>Director of Customer Experience, Velmar Verkehrsbetriebe</div>
      </div>
    </Body>
  </Frame>
);

const Next: Page = () => (
  <Frame n="10" label="Next">
    <Body>
      <div style={{ gridColumn: '1 / span 8' }}>
        <h2
          style={{
            margin: '0 0 0 -12px',
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            fontWeight: 700,
            lineHeight: 0.86,
            letterSpacing: '-0.055em',
          }}
        >
          Danke.
        </h2>
        <p
          style={{
            fontSize: 40,
            lineHeight: 1.22,
            margin: '56px 0 0',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
          }}
        >
          Full-size mock-ups go up on Zentrum platform 2 on 12 January. Come and get lost — on
          purpose.
        </p>
      </div>
      <div style={{ gridColumn: '10 / span 3', display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            width: 402,
            height: 402,
            background: panel,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 100 100" width={280} height={280} aria-hidden>
            <path d="M14 50 H66" stroke="#fff" strokeWidth={12} />
            <path d="M50 26 L82 50 L50 74 Z" fill="#fff" />
          </svg>
        </div>
      </div>
    </Body>
    <div
      style={{
        ...grid12,
        position: 'absolute',
        left: M,
        right: M,
        top: 744,
        borderTop: '6px solid var(--osd-text)',
        paddingTop: 16,
      }}
    >
      <MetaBlock k="Studio" v={'Studio Haller Brun\nLimmatquai 41, Zürich'} />
      <MetaBlock k="Lead" v={'Anna Haller\nanna@hallerbrun.ch'} />
      <MetaBlock k="Client lead" v={'Jonas Ekberg, VVB\nProgramme Manager'} />
      <MetaBlock k="Documents" v={'Sign manual v4.2\n312 pages, 64 drawings'} />
    </div>
  </Frame>
);

export const meta: SlideMeta = {
  title: 'Velmar U — Wayfinding System',
  createdAt: '2026-10-07T15:38:25.867Z',
};

export const notes: (string | undefined)[] = [
  `Good morning. We're Studio Haller Brun, and this is the design freeze for the Velmar U wayfinding system.
Everything you'll see today has one job: get a rider from the train to the street without thinking about it.
The red dot on this cover is the only red you'll find anywhere on the network — hold on to that, it comes back.`,
  `Start with the number that started this project. Forty-one percent.
In our 2025 shadowing study, four in ten first-time riders left Zentrum by the wrong exit.
That's not a rider problem. Seven sign families, two hundred and twelve arrow drawings, eighteen-minute transfers. The station is talking over itself.`,
  `Three rules. I'll reveal them one at a time because each one cost us an argument.
One: sign only at decision points. If a corridor has one way forward, it gets nothing.
Two: colour belongs to the lines. Red belongs to you — you-are-here and stop.
Three: same thing, same place. Exits are top right at every station, forever.`,
  `Here's the palette. Six line colours, each with a Pantone reference for the fabricators.
We tested them for deuteranopia and protanopia and under the sodium lighting at the older stations.
Notice what's missing: red. If anyone asks for a seventh line in red, the answer is already no.`,
  `The network diagram. Every segment is horizontal, vertical, or forty-five degrees.
We've equalised distances, so riders count stops rather than guess kilometres.
The pulsing dot is how every in-station map marks your position. Ten interchanges, each drawn as the same open ring.`,
  `Thirty-four pictograms in the full set — here are the eight that do most of the work.
They're drawn on the same stroke weight as the typeface, so a symbol never shouts over a word.
Recognition testing averaged ninety-four percent. Interchange was weakest at eighty-one, which is why it always appears with a word.`,
  `This is the P-2 platform sign at one-to-ten. Let's take it apart.
A — the cap height, one hundred millimetres, is the module.
B — line bullets are one point four times that, and they always lead.
C — the margin is half a cap, on all four sides.
D — the arrow sits on the side it points to. Read the edge, know the turn.`,
  `How big? One ratio: one to two hundred and fifty.
Forty millimetres reads at ten metres — timetables. A hundred millimetres reads at twenty-five — the station name on the track wall.
Two hundred and fifty millimetres carries sixty-two metres — the street totems you'll see from across the square.`,
  `Rollout runs three years, quarter by quarter on the same twelve-column grid you've been looking at all morning.
Pilot at Zentrum and Altmarkt first — that's the red bar, it opens in January.
Then U1 and U2, then the other four lines, then street level. Installation is night-only; no station closes.`,
  `We'll let the client have the last word. This is Ines Morandi from our kickoff workshop.
Pause here — let the room read it.`,
  `Thank you. The mock-ups go up on Zentrum platform two on the twelfth of January.
Please go and get lost on purpose, and tell us where the system failed you.
The full manual is three hundred and twelve pages; we'll circulate it after this session. Questions.`,
];

export default [
  Cover,
  Problem,
  Principles,
  Lines,
  Network,
  Pictograms,
  Anatomy,
  Legibility,
  Rollout,
  Quote,
  Next,
] satisfies Page[];

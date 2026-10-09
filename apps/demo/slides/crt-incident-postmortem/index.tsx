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
  palette: { bg: '#010502', text: '#6bff8f', accent: '#ffb547' },
  fonts: {
    display: 'VT323, "IBM Plex Mono", ui-monospace, monospace',
    body: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
  },
  typeScale: { hero: 128, body: 44 },
  radius: 44,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=VT323&display=swap';
const FONT_LINK_ID = 'osd-webfont-crt-incident-postmortem';
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

const STYLE_ID = 'osd-styles-crt-incident-postmortem';
const css = `
@keyframes crt-type { to { clip-path: inset(0 0 0 0) } }
@keyframes crt-in { to { opacity: 1 } }
@keyframes crt-blink { 50% { opacity: 0 } }
@keyframes crt-flicker { 0% { opacity: .93 } 50% { opacity: 1 } 100% { opacity: .96 } }
@keyframes crt-roll { from { transform: translateY(-30%) } to { transform: translateY(130%) } }
@keyframes crt-draw { to { stroke-dashoffset: 0 } }
.crt-live .crt-type { clip-path: inset(0 100% 0 0); animation: crt-type var(--dur) steps(var(--n), end) var(--d) forwards; }
.crt-live .crt-in { opacity: 0; animation: crt-in 1ms linear var(--d) forwards; }
.crt-live .crt-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: crt-draw 2.4s cubic-bezier(.3,.1,.3,1) var(--d) forwards; }
.crt-cursor { animation: crt-blink 1.06s steps(1) infinite; }
.crt-flicker { animation: crt-flicker 0.14s steps(3) infinite; }
.crt-roll { animation: crt-roll 7.5s linear infinite; }
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

const dim = '#2f9e52';
const faint = 'rgba(107, 255, 143, 0.16)';
const glow =
  '0 0 1px rgba(107,255,143,.9), 0 0 10px rgba(107,255,143,.5), 0 0 30px rgba(107,255,143,.18)';
const glowAmber =
  '0 0 1px rgba(255,181,71,.9), 0 0 10px rgba(255,181,71,.5), 0 0 30px rgba(255,181,71,.2)';

const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)', keyframes: HOLD },
  enter: {
    duration: 260,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    keyframes: [
      { opacity: 0, filter: 'brightness(2.6) blur(2px)' },
      { opacity: 0.9, filter: 'brightness(1.8) blur(1px)', offset: 0.35 },
      { opacity: 0.45, offset: 0.55 },
      { opacity: 1, filter: 'brightness(1) blur(0)' },
    ],
  },
};

const powerCycle: SlideTransition = {
  duration: 700,
  throughBackground: true,
  exit: {
    duration: 240,
    easing: 'cubic-bezier(0.6, 0, 1, 1)',
    keyframes: [
      { opacity: 1, transform: 'scale(1, 1)', filter: 'brightness(1)' },
      { opacity: 1, transform: 'scale(1, 0.006)', filter: 'brightness(3)', offset: 0.7 },
      { opacity: 0, transform: 'scale(0, 0.006)', filter: 'brightness(4)' },
    ],
  },
  enter: {
    duration: 420,
    delay: 280,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    keyframes: [
      { opacity: 0, transform: 'scale(0.02, 0.006)', filter: 'brightness(4)' },
      { opacity: 1, transform: 'scale(1, 0.006)', filter: 'brightness(3)', offset: 0.3 },
      { opacity: 1, transform: 'scale(1, 1)', filter: 'brightness(1.6)', offset: 0.7 },
      { opacity: 1, transform: 'scale(1, 1)', filter: 'brightness(1)' },
    ],
  },
};

const vars = (v: Record<string, string | number>) => v as CSSProperties;

const Type = ({
  children,
  d = 0,
  speed = 38,
}: {
  children: string;
  d?: number;
  speed?: number;
}) => (
  <span
    className="crt-type"
    style={{
      display: 'inline-block',
      whiteSpace: 'pre',
      ...vars({ '--n': children.length, '--d': `${d}ms`, '--dur': `${children.length * speed}ms` }),
    }}
  >
    {children}
  </span>
);

const Out = ({ children, d, style }: { children: ReactNode; d: number; style?: CSSProperties }) => (
  <div className="crt-in" style={{ ...vars({ '--d': `${d}ms` }), ...style }}>
    {children}
  </div>
);

const Amber = ({ children }: { children: ReactNode }) => (
  <span style={{ color: 'var(--osd-accent)', textShadow: glowAmber }}>{children}</span>
);

const Cursor = ({ h = 0.9, d = 0 }: { h?: number; d?: number }) => (
  <span className="crt-in" style={vars({ '--d': `${d}ms` })}>
    <span
      className="crt-cursor"
      style={{
        display: 'inline-block',
        width: '0.55em',
        height: `${h}em`,
        background: 'var(--osd-text)',
        boxShadow: glow,
        verticalAlign: '-0.1em',
        marginLeft: '0.12em',
      }}
    />
  </span>
);

const StatusBar = ({ label }: { label: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 40,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--osd-font-body)',
        fontSize: 20,
        color: dim,
        letterSpacing: '0.06em',
        borderBottom: `1px dashed ${dim}`,
        paddingBottom: 12,
      }}
    >
      <span>INC-2291 · POSTMORTEM · SEV-1</span>
      <span style={{ color: 'var(--osd-text)' }}>{label}</span>
      <span>
        [{String(current).padStart(2, '0')}/{String(total).padStart(2, '0')}] TTY1 9600 BAUD
      </span>
    </div>
  );
};

const Prompt = ({ cmd }: { cmd: string }) => (
  <div
    style={{
      position: 'absolute',
      left: 96,
      bottom: 40,
      fontFamily: 'var(--osd-font-body)',
      fontSize: 24,
      color: dim,
    }}
  >
    ops@postmortem:~$ <span style={{ color: 'var(--osd-text)' }}>{cmd}</span>
    <Cursor />
  </div>
);

const Crt = ({
  children,
  label,
  cmd,
  chrome = true,
}: {
  children: ReactNode;
  label?: string;
  cmd?: string;
  chrome?: boolean;
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'crt-live' : undefined}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000000',
        fontFamily: 'var(--osd-font-display)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 24,
          borderRadius: 'var(--osd-radius)',
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse 80% 75% at 50% 48%, #07210f 0%, var(--osd-bg) 72%, #000 100%)',
          color: 'var(--osd-text)',
          textShadow: glow,
          boxShadow: 'inset 0 0 0 2px #0d1a10',
        }}
      >
        <div className="crt-flicker" style={{ position: 'absolute', inset: 0 }}>
          {chrome && label && <StatusBar label={label} />}
          {children}
          {chrome && cmd && <Prompt cmd={cmd} />}
        </div>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(0,0,0,0.32) 0 2px, transparent 2px 4px)',
          }}
        />
        <div
          aria-hidden
          className="crt-roll"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 220,
            pointerEvents: 'none',
            background:
              'linear-gradient(to bottom, transparent, rgba(107,255,143,0.045), transparent)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 'var(--osd-radius)',
            boxShadow:
              'inset 0 0 180px 40px rgba(0,0,0,0.85), inset 0 0 18px rgba(107,255,143,0.12)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 60% 40% at 30% 18%, rgba(255,255,255,0.05), transparent 70%)',
          }}
        />
      </div>
    </div>
  );
};

const Boot: Page = () => (
  <Crt chrome={false}>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 96,
        fontFamily: 'var(--osd-font-body)',
        fontSize: 24,
        lineHeight: 1.6,
      }}
    >
      <Out d={100} style={{ color: dim }}>
        VELMAR-OPS BIOS v4.02 · 65536K OK · PHOSPHOR P1
      </Out>
      <Out d={420}>[ OK ] mounting /var/log/incidents</Out>
      <Out d={700}>[ OK ] loading INC-2291/postmortem.md</Out>
      <Out d={980}>
        [<Amber>WARN</Amber>] contents may cause on-call flashbacks
      </Out>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 360,
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 0.92,
        letterSpacing: '0.01em',
      }}
    >
      <div>
        <Type d={1300} speed={45}>
          POSTMORTEM:
        </Type>
      </div>
      <div style={{ color: 'var(--osd-accent)', textShadow: glowAmber }}>
        <Type d={1900} speed={42}>
          THE 02:14 DATABASE
        </Type>
      </div>
      <div style={{ color: 'var(--osd-accent)', textShadow: glowAmber }}>
        <Type d={2700} speed={42}>
          FAILOVER
        </Type>
        <Cursor h={0.78} d={3040} />
      </div>
    </div>
    <Out
      d={3200}
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 96,
        display: 'flex',
        gap: 56,
        fontFamily: 'var(--osd-font-body)',
        fontSize: 24,
        color: dim,
        borderTop: `1px dashed ${dim}`,
        paddingTop: 18,
      }}
    >
      <span>
        SEV <span style={{ color: 'var(--osd-text)' }}>1</span>
      </span>
      <span>
        DURATION <span style={{ color: 'var(--osd-text)' }}>47 MIN</span>
      </span>
      <span>
        DATE <span style={{ color: 'var(--osd-text)' }}>2026-09-18</span>
      </span>
      <span>
        AUTHOR <span style={{ color: 'var(--osd-text)' }}>R. OKAFOR, SRE</span>
      </span>
      <span>
        FORMAT <span style={{ color: 'var(--osd-text)' }}>BLAMELESS</span>
      </span>
    </Out>
  </Crt>
);

const Stat = ({ v, label, amber, d }: { v: string; label: string; amber?: boolean; d: number }) => (
  <Out
    d={d}
    style={{
      borderLeft: `2px solid ${amber ? 'var(--osd-accent)' : 'var(--osd-text)'}`,
      paddingLeft: 26,
    }}
  >
    <div
      style={{
        fontSize: 150,
        lineHeight: 0.9,
        color: amber ? 'var(--osd-accent)' : 'var(--osd-text)',
        textShadow: amber ? glowAmber : glow,
      }}
    >
      {v}
    </div>
    <div
      style={{
        fontFamily: 'var(--osd-font-body)',
        fontSize: 22,
        lineHeight: 1.4,
        marginTop: 12,
        color: dim,
      }}
    >
      {label}
    </div>
  </Out>
);

const Summary: Page = () => (
  <Crt label="SUMMARY" cmd="cat summary.md">
    <div
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 140,
        border: '3px double var(--osd-text)',
        boxShadow: `0 0 12px ${faint}, inset 0 0 12px ${faint}`,
        padding: '44px 48px 36px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: -22,
          background: 'var(--osd-bg)',
          padding: '0 14px',
          fontSize: 40,
          lineHeight: 1,
        }}
      >
        ┤ TL;DR ├
      </div>
      <div style={{ fontSize: 'var(--osd-size-body)', lineHeight: 1.3 }}>
        <Out d={200}>&gt; At 02:14 UTC the primary database froze. Failover worked in 31 s.</Out>
        <Out d={600}>
          &gt; The connection pool kept talking to the frozen box for 38 more minutes.
        </Out>
        <Out d={1000}>
          &gt; <Amber>Checkout was down for 47 minutes.</Amber> No data was lost.
        </Out>
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 520,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        columnGap: 40,
      }}
    >
      <Stat v="47m" label="customer-facing impact, 02:14 → 03:01" amber d={1400} />
      <Stat v="38%" label="peak checkout error rate (5-min window)" amber d={1600} />
      <Stat v="12,406" label="orders failed · 71% retried successfully" amber d={1800} />
      <Stat v="0" label="bytes of data lost. WAL fully replayed." d={2000} />
    </div>
  </Crt>
);

const Row = ({ t, children, warn }: { t: string; children: ReactNode; warn?: boolean }) => (
  <div style={{ display: 'flex', gap: 36, fontSize: 46, lineHeight: 1.4 }}>
    <span
      style={{
        color: warn ? 'var(--osd-accent)' : dim,
        textShadow: warn ? glowAmber : 'none',
        minWidth: 140,
      }}
    >
      {t}
    </span>
    <span style={{ color: dim }}>▸</span>
    <span>{children}</span>
  </div>
);

const Timeline: Page = () => (
  <Crt label="TIMELINE · UTC" cmd="less timeline.log">
    <div style={{ position: 'absolute', left: 96, right: 96, top: 120 }}>
      <Steps>
        <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 28 }}>
          <Type d={150}>TIMELINE</Type>
        </div>
        <Step>
          <Row t="02:14:07" warn>
            pg-main-01 storage stalls. Writes hang.
          </Row>
        </Step>
        <Step>
          <Row t="02:14:38">Patroni promotes pg-main-02. Textbook.</Row>
        </Step>
        <Step>
          <Row t="02:14:41">DNS db-primary.internal → pg-main-02.</Row>
        </Step>
        <Step>
          <Row t="02:15:02" warn>
            Checkout errors climb. Pool still on pg-main-01.
          </Row>
        </Step>
        <Step>
          <Row t="02:21:30" warn>
            Page fires — to the secondary rotation.
          </Row>
        </Step>
        <Step>
          <Row t="02:38:12">Primary on-call joins. Suspects the app.</Row>
        </Step>
        <Step>
          <Row t="02:52:47">PgBouncer restarted. Errors fall off a cliff.</Row>
        </Step>
        <Step>
          <Row t="03:01:00">Recovered. Incident closed 03:14.</Row>
        </Step>
      </Steps>
    </div>
  </Crt>
);

const Tick = ({ x, label }: { x: number; label: string }) => (
  <g>
    <line x1={x} y1={460} x2={x} y2={470} stroke={dim} strokeWidth={2} />
    <text
      x={x}
      y={500}
      textAnchor="middle"
      fill={dim}
      fontSize={20}
      style={{ fontFamily: 'var(--osd-font-body)' }}
    >
      {label}
    </text>
  </g>
);

const YTick = ({ y, label }: { y: number; label: string }) => (
  <g>
    <line x1={0} y1={y} x2={1400} y2={y} stroke={faint} strokeWidth={1} strokeDasharray="2 8" />
    <text
      x={-18}
      y={y + 7}
      textAnchor="end"
      fill={dim}
      fontSize={20}
      style={{ fontFamily: 'var(--osd-font-body)' }}
    >
      {label}
    </text>
  </g>
);

const Event = ({ x, label, row }: { x: number; label: string; row: number }) => (
  <g>
    <line
      x1={x}
      y1={-10 + row * 0}
      x2={x}
      y2={460}
      stroke="var(--osd-accent)"
      strokeWidth={2}
      strokeDasharray="6 6"
    />
    <text
      x={x + 10}
      y={row}
      fill="var(--osd-accent)"
      fontSize={22}
      style={{ fontFamily: 'var(--osd-font-body)', textShadow: glowAmber }}
    >
      {label}
    </text>
  </g>
);

const Graph: Page = () => (
  <Crt label="METRICS" cmd="grafana-cli render checkout --from 02:00">
    <div style={{ position: 'absolute', left: 96, top: 116, fontSize: 72, lineHeight: 1 }}>
      <Type d={150}>CHECKOUT ERROR RATE</Type>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 96,
        top: 130,
        fontFamily: 'var(--osd-font-body)',
        fontSize: 20,
        lineHeight: 1.7,
        color: dim,
        textAlign: 'right',
      }}
    >
      <div>
        <span style={{ color: 'var(--osd-text)' }}>━━</span> 5xx / requests (%)
      </div>
      <div>
        <span style={{ color: dim }}>┅┅</span> p99 latency (0–5 s)
      </div>
    </div>
    <svg
      viewBox="-90 -40 1520 560"
      width={1520}
      height={560}
      aria-label="Checkout error rate, 02:00 to 03:20 UTC"
      style={{ position: 'absolute', left: 140, top: 300, overflow: 'visible' }}
    >
      <YTick y={460} label="0%" />
      <YTick y={350} label="10%" />
      <YTick y={240} label="20%" />
      <YTick y={130} label="30%" />
      <YTick y={20} label="40%" />
      <Tick x={0} label="02:00" />
      <Tick x={175} label="02:10" />
      <Tick x={350} label="02:20" />
      <Tick x={525} label="02:30" />
      <Tick x={700} label="02:40" />
      <Tick x={875} label="02:50" />
      <Tick x={1050} label="03:00" />
      <Tick x={1225} label="03:10" />
      <Tick x={1400} label="03:20" />
      <line x1={0} y1={460} x2={1400} y2={460} stroke={dim} strokeWidth={2} />
      <Event x={245} label="02:14 failover" row={-14} />
      <Event x={367} label="02:21 paged" row={14} />
      <Event x={910} label="02:52 pool restart" row={-14} />
      <path
        d="M0 453 L262 452 L275 30 L910 26 L927 300 L962 440 L1067 452 L1400 453"
        fill="none"
        stroke={dim}
        strokeWidth={3}
        strokeDasharray="4 8"
      />
      <path
        className="crt-draw"
        pathLength={1}
        d="M0 457 L175 456 L245 455 L262 328 L280 196 L315 119 L340 92 L367 64 L400 58 L437 42 L470 50 L525 53 L560 44 L612 42 L650 55 L700 64 L740 50 L787 53 L830 66 L875 75 L910 86 L927 328 L962 427 L1015 449 L1067 453 L1140 455 L1225 456 L1400 457"
        fill="none"
        stroke="var(--osd-text)"
        strokeWidth={4}
        strokeLinejoin="round"
        style={{
          filter: 'drop-shadow(0 0 6px rgba(107,255,143,0.8))',
          ...vars({ '--d': '400ms' }),
        }}
      />
    </svg>
  </Crt>
);

const Ln = ({ i, children }: { i: number; children: ReactNode }) => (
  <Out d={200 + i * 70} style={{ whiteSpace: 'pre' }}>
    {children}
  </Out>
);

const Impact = ({
  name,
  state,
  note,
  warn,
}: {
  name: string;
  state: string;
  note: string;
  warn?: boolean;
}) => (
  <div style={{ borderTop: `1px dashed ${dim}`, padding: '18px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 48, lineHeight: 1 }}>
      <span>{name}</span>
      {warn ? <Amber>{state}</Amber> : <span>{state}</span>}
    </div>
    <div style={{ fontFamily: 'var(--osd-font-body)', fontSize: 22, color: dim, marginTop: 10 }}>
      {note}
    </div>
  </div>
);

const Blast: Page = () => (
  <Crt label="BLAST RADIUS" cmd="./topology --highlight=impact">
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 130,
        fontFamily: 'var(--osd-font-body)',
        fontSize: 30,
        lineHeight: 1.14,
        fontWeight: 600,
      }}
    >
      <Ln i={0}>{'              ┌──────────────────────┐'}</Ln>
      <Ln i={1}>{'  users ─────>│   edge  /  api-gw    │'}</Ln>
      <Ln i={2}>{'              └──────────┬───────────┘'}</Ln>
      <Ln i={3}>{'       ┌─────────────────┼─────────────────┐'}</Ln>
      <Ln i={4}>{'       v                 v                 v'}</Ln>
      <Ln i={5}>{' ┌───────────┐     ┌───────────┐     ┌───────────┐'}</Ln>
      <Ln i={6}>{' │ checkout  │     │  search   │     │ accounts  │'}</Ln>
      <Ln i={7}>
        {' │   '}
        <Amber>DOWN</Amber>
        {'    │     │    OK     │     │ '}
        <Amber>DEGRADED</Amber>
        {'  │'}
      </Ln>
      <Ln i={8}>{' └─────┬─────┘     └───────────┘     └─────┬─────┘'}</Ln>
      <Ln i={9}>{'       └─────────────────┬─────────────────┘'}</Ln>
      <Ln i={10}>{'                         v'}</Ln>
      <Ln i={11}>{'              ┌──────────────────────┐'}</Ln>
      <Ln i={12}>
        {'              │   pgbouncer  x6      │ '}
        <Amber>{'<── stale DNS'}</Amber>
      </Ln>
      <Ln i={13}>{'              └────┬─────────────┬───┘'}</Ln>
      <Ln i={14}>{'                   v             v'}</Ln>
      <Ln i={15}>{'            ┌────────────┐ ┌────────────┐'}</Ln>
      <Ln i={16}>{'            │ pg-main-01 │ │ pg-main-02 │'}</Ln>
      <Ln i={17}>
        {'            │   '}
        <Amber>FROZEN</Amber>
        {'   │ │  PRIMARY   │'}
      </Ln>
      <Ln i={18}>{'            └────────────┘ └────────────┘'}</Ln>
    </div>
    <div style={{ position: 'absolute', left: 1110, right: 96, top: 150 }}>
      <Out d={1500} style={{ fontSize: 64, lineHeight: 1, marginBottom: 24 }}>
        WHO FELT IT
      </Out>
      <Out d={1700}>
        <Impact name="checkout" state="DOWN" note="writes only · 38% 5xx at peak" warn />
      </Out>
      <Out d={1900}>
        <Impact name="accounts" state="DEGRADED" note="password changes failed; logins fine" warn />
      </Out>
      <Out d={2100}>
        <Impact name="search" state="OK" note="reads served by replicas throughout" />
      </Out>
      <Out d={2300}>
        <Impact name="payments" state="OK" note="never reached — upstream failed first" />
      </Out>
    </div>
  </Crt>
);

const Log = ({
  i,
  ts,
  src,
  children,
  warn,
}: {
  i: number;
  ts: string;
  src: string;
  children: ReactNode;
  warn?: boolean;
}) => (
  <Out d={250 + i * 260} style={{ display: 'flex', gap: 22, whiteSpace: 'pre' }}>
    <span style={{ color: dim, textShadow: 'none' }}>{ts}</span>
    <span
      style={{
        width: 172,
        color: warn ? 'var(--osd-accent)' : 'var(--osd-text)',
        textShadow: warn ? glowAmber : glow,
      }}
    >
      {src}
    </span>
    <span style={warn ? { color: 'var(--osd-accent)', textShadow: glowAmber } : undefined}>
      {children}
    </span>
  </Out>
);

const Logs: Page = () => (
  <Crt label="LOG EXCERPT" cmd={'grep -h "02:1[45]\\|02:5[12]" *.log'}>
    <div style={{ position: 'absolute', left: 96, top: 116, fontSize: 72, lineHeight: 1 }}>
      <Type d={100}>THE EVIDENCE</Type>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 236,
        fontFamily: 'var(--osd-font-body)',
        fontSize: 26,
        lineHeight: 2.05,
      }}
    >
      <Log i={0} ts="02:14:07.412" src="pg-main-01" warn>
        PANIC: could not fsync file "base/16384/2619": I/O error
      </Log>
      <Log i={1} ts="02:14:38.006" src="patroni">
        INFO: no response from leader, promoting pg-main-02
      </Log>
      <Log i={2} ts="02:14:41.950" src="patroni">
        INFO: promoted self to leader by acquiring session lock
      </Log>
      <Log i={3} ts="02:14:42.101" src="route53">
        UPSERT db-primary.internal A 10.4.2.31 TTL 30
      </Log>
      <Log i={4} ts="02:15:02.377" src="pgbouncer" warn>
        WARNING server conn crashed? pg-main-01 10.4.1.17:5432
      </Log>
      <Log i={5} ts="02:15:02.380" src="checkout" warn>
        ERROR no connection within 5000ms (×4,812 / min)
      </Log>
      <Log i={6} ts="02:21:30.000" src="pagerduty" warn>
        TRIGGERED INC-2291 → escalation: db-secondary
      </Log>
      <Log i={7} ts="02:52:47.233" src="pgbouncer">
        LOG dns: db-primary.internal → 10.4.2.31 (re-resolved)
      </Log>
    </div>
    <Out
      d={2600}
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 740,
        border: `2px solid var(--osd-accent)`,
        boxShadow: `0 0 14px rgba(255,181,71,0.25)`,
        padding: '18px 28px',
        fontSize: 40,
        color: 'var(--osd-accent)',
        textShadow: glowAmber,
      }}
    >
      NOTE: DNS changed at 02:14:42. PgBouncer didn't ask again until 02:52:47.
    </Out>
  </Crt>
);

const RootCause: Page = () => (
  <Crt label="ROOT CAUSE" cmd="git blame pgbouncer.ini">
    <div style={{ position: 'absolute', left: 96, top: 140, fontSize: 168, lineHeight: 0.9 }}>
      <Type d={300} speed={60}>
        ROOT CAUSE
      </Type>
      <Cursor h={0.8} d={900} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 360,
        fontSize: 'var(--osd-size-body)',
        lineHeight: 1.36,
      }}
    >
      <Out d={1100}>PgBouncer resolved the primary's hostname once, at boot,</Out>
      <Out d={1300}>and trusted the answer for up to an hour.</Out>
      <Out
        d={1800}
        style={{
          margin: '36px 0',
          padding: '20px 30px',
          background: 'rgba(107,255,143,0.07)',
          borderLeft: '6px solid var(--osd-text)',
          fontFamily: 'var(--osd-font-body)',
          fontSize: 32,
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: dim }}>pgbouncer.ini:41 </span>
        <Amber>dns_max_ttl = 3600</Amber>
        <span style={{ color: dim }}>{'   # 2023-03: quiet resolver flood'}</span>
      </Out>
      <Out d={2300}>Health checks were TCP-only, so a frozen primary</Out>
      <Out d={2500}>still answered — and still looked healthy.</Out>
    </div>
  </Crt>
);

const Ledger = ({
  title,
  sign,
  children,
  warn,
}: {
  title: string;
  sign: string;
  children: ReactNode;
  warn?: boolean;
}) => (
  <div
    style={{
      border: `2px solid ${warn ? 'var(--osd-accent)' : 'var(--osd-text)'}`,
      boxShadow: warn ? '0 0 14px rgba(255,181,71,0.2)' : `0 0 14px ${faint}`,
      padding: '40px 36px 30px',
      position: 'relative',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: -26,
        left: 28,
        padding: '0 14px',
        background: 'var(--osd-bg)',
        fontSize: 48,
        lineHeight: 1,
        color: warn ? 'var(--osd-accent)' : 'var(--osd-text)',
        textShadow: warn ? glowAmber : glow,
      }}
    >
      [{sign}] {title}
    </div>
    <div style={{ fontSize: 40, lineHeight: 1.55 }}>{children}</div>
  </div>
);

const Metric = ({ k, v, warn }: { k: string; v: string; warn?: boolean }) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--osd-font-body)',
        fontSize: 20,
        letterSpacing: '0.1em',
        color: dim,
      }}
    >
      {k}
    </div>
    <div
      style={{
        fontSize: 84,
        lineHeight: 1,
        marginTop: 8,
        color: warn ? 'var(--osd-accent)' : 'var(--osd-text)',
        textShadow: warn ? glowAmber : glow,
      }}
    >
      {v}
    </div>
  </div>
);

const Ledgers: Page = () => (
  <Crt label="WENT WELL / DIDN'T" cmd="diff expected.txt actual.txt">
    <div
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 200,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: 56,
      }}
    >
      <Out d={200}>
        <Ledger title="WENT WELL" sign="+">
          <div>+ Patroni promoted in 31 s, as designed.</div>
          <div>+ Zero data loss. WAL fully replayed.</div>
          <div>+ Status page live by 02:40.</div>
          <div>+ 71% of failed orders retried fine.</div>
          <div>+ Calm, kind incident channel.</div>
        </Ledger>
      </Out>
      <Out d={900}>
        <Ledger title="DIDN'T" sign="-" warn>
          <div>- Pool held a stale primary for 38 min.</div>
          <div>- Page went to the wrong rotation.</div>
          <div>- Dashboard said the DB was "healthy".</div>
          <div>- Runbook step 4 used a removed flag.</div>
          <div>- Nobody had run a failover since May.</div>
        </Ledger>
      </Out>
    </div>
    <Out
      d={1500}
      style={{
        position: 'absolute',
        left: 96,
        right: 96,
        top: 700,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        columnGap: 40,
        borderTop: `1px dashed ${dim}`,
        paddingTop: 22,
      }}
    >
      <Metric k="TIME TO DETECT" v="1m" />
      <Metric k="TIME TO RIGHT ON-CALL" v="24m" warn />
      <Metric k="TIME TO DIAGNOSE" v="38m" warn />
      <Metric k="TIME TO RECOVER" v="47m" warn />
    </Out>
  </Crt>
);

const Action = ({
  id,
  what,
  who,
  due,
  status,
}: {
  id: string;
  what: string;
  who: string;
  due: string;
  status: 'DONE' | 'DOING' | 'TODO';
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr 260px 140px 170px',
      columnGap: 24,
      alignItems: 'baseline',
      fontSize: 38,
      lineHeight: 1.2,
      padding: '24px 0',
      borderBottom: `1px dashed ${dim}`,
    }}
  >
    <span style={{ color: dim }}>{id}</span>
    <span>{what}</span>
    <span style={{ fontFamily: 'var(--osd-font-body)', fontSize: 22, color: dim }}>{who}</span>
    <span style={{ fontFamily: 'var(--osd-font-body)', fontSize: 22, color: dim }}>{due}</span>
    {status === 'DONE' ? (
      <span>[x] DONE</span>
    ) : status === 'DOING' ? (
      <Amber>[~] DOING</Amber>
    ) : (
      <span style={{ color: dim }}>[ ] TODO</span>
    )}
  </div>
);

const Actions: Page = () => (
  <Crt label="ACTION ITEMS" cmd="jira ls --label INC-2291">
    <div style={{ position: 'absolute', left: 96, right: 96, top: 120 }}>
      <Steps>
        <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 20 }}>
          <Type d={150}>ACTION ITEMS</Type>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 260px 140px 170px',
            columnGap: 24,
            fontFamily: 'var(--osd-font-body)',
            fontSize: 20,
            color: dim,
            letterSpacing: '0.1em',
            borderBottom: '2px solid var(--osd-text)',
            paddingBottom: 10,
          }}
        >
          <span>ID</span>
          <span>ACTION</span>
          <span>OWNER</span>
          <span>DUE</span>
          <span>STATUS</span>
        </div>
        <Step>
          <Action
            id="AI-1"
            what="dns_max_ttl = 15; add server_check_query"
            who="@r.okafor"
            due="09-25"
            status="DONE"
          />
        </Step>
        <Step>
          <Action
            id="AI-2"
            what="Fix escalation for db-* alerts"
            who="@n.mbeki"
            due="09-22"
            status="DONE"
          />
        </Step>
        <Step>
          <Action
            id="AI-3"
            what="Replace TCP check with a write probe"
            who="@e.lindqvist"
            due="10-09"
            status="DOING"
          />
        </Step>
        <Step>
          <Action
            id="AI-4"
            what="Rewrite failover runbook, delete step 4"
            who="@r.okafor"
            due="10-16"
            status="DOING"
          />
        </Step>
        <Step>
          <Action
            id="AI-5"
            what="Quarterly forced-failover game day"
            who="@sre-team"
            due="11-01"
            status="TODO"
          />
        </Step>
      </Steps>
    </div>
  </Crt>
);

const Eof: Page = () => (
  <Crt chrome={false}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 120px',
      }}
    >
      <div style={{ fontSize: 220, lineHeight: 0.9 }}>
        <Type d={300} speed={90}>
          &gt; EOF
        </Type>
        <Cursor h={0.78} d={750} />
      </div>
      <Out
        d={1000}
        style={{ fontSize: 56, marginTop: 40, color: 'var(--osd-accent)', textShadow: glowAmber }}
      >
        blameless. always.
      </Out>
      <Out
        d={1400}
        style={{
          fontFamily: 'var(--osd-font-body)',
          fontSize: 26,
          lineHeight: 1.7,
          marginTop: 48,
          color: dim,
        }}
      >
        <div>
          questions → <span style={{ color: 'var(--osd-text)' }}>#inc-2291-review</span>
        </div>
        <div>
          full doc →{' '}
          <span style={{ color: 'var(--osd-text)' }}>wiki/postmortems/2026-09-18-db-failover</span>
        </div>
        <div>
          next game day → <span style={{ color: 'var(--osd-text)' }}>Sat 1 Nov, 10:00 UTC</span>
        </div>
      </Out>
    </div>
  </Crt>
);

Boot.transition = powerCycle;
RootCause.transition = powerCycle;
Eof.transition = powerCycle;

export const meta: SlideMeta = {
  title: 'Postmortem: the 02:14 Database Failover',
  createdAt: '2026-10-07T16:01:32.749Z',
};

export const notes: (string | undefined)[] = [
  `Let the boot sequence finish before you speak — it takes about four seconds.
Good afternoon. This is the blameless review for INC-2291, the database failover on the eighteenth of September.
I'm Rachel, I was incident commander. Nobody in this room is in trouble.`,
  `The one-minute version. The primary froze at 02:14. Failover itself was fine — thirty-one seconds.
The problem is what happened after: our connection pool kept talking to the frozen machine for thirty-eight more minutes.
Forty-seven minutes of checkout downtime, twelve thousand four hundred failed orders, and — importantly — zero data lost.`,
  `Let's walk the clock. I'll step through it line by line.
Note the gap between 02:14:41, when DNS was correct, and 02:52, when we restarted PgBouncer.
Everything in that gap is the incident. Also note the page went to the secondary rotation — seven minutes we didn't get back.`,
  `Here's what customers felt. Flat until 02:14, a wall at 02:15, and a plateau around thirty-eight percent.
The dashed line is p99 latency — pinned at the five-second timeout the whole time.
The cliff at 02:52 is the PgBouncer restart. That's the moment we understood the bug.`,
  `Blast radius. Anything that wrote through the pool broke: checkout fully, accounts partially — password changes failed.
Search kept working because it reads from replicas and never touches the primary pool.
Payments looks fine on paper, but only because checkout failed before it ever got there.`,
  `This is the evidence that cracked it. Route 53 updated at 02:14:42 with a thirty-second TTL.
PgBouncer didn't re-resolve until 02:52:47 — and only because we restarted it.
That amber box is the whole incident in one sentence.`,
  `Root cause. dns_max_ttl was set to thirty-six hundred in March 2023 to stop a resolver flood — a reasonable fix at the time.
Combined with TCP-only health checks, a frozen primary still accepted connections and looked healthy.
Two sensible decisions, years apart, that combined badly. That's the lesson, not anyone's mistake.`,
  `What went well and what didn't. I want to dwell on the left side for a second — Patroni did exactly its job, and nobody lost data.
On the right: the stale pool, the wrong rotation, a dashboard that lied, a runbook that rotted.
And the last line is the real one: we hadn't exercised a failover since May.`,
  `Five action items, revealed one at a time. Two are done already: the TTL is fifteen seconds and alert routing is fixed.
The write probe and the runbook rewrite are in progress.
And the most important one: a forced-failover game day every quarter, starting the first of November.`,
  `That's the end of file. Blameless, always.
Questions in the channel, the full document is on the wiki, and I'd love volunteers for the first game day.`,
];

export default [
  Boot,
  Summary,
  Timeline,
  Graph,
  Blast,
  Logs,
  RootCause,
  Ledgers,
  Actions,
  Eof,
] satisfies Page[];

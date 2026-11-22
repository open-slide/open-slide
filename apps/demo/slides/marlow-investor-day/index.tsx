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
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0B0A08', text: '#ECE6D6', accent: '#FFB21A' },
  fonts: {
    display: '"IBM Plex Sans Condensed", "Arial Narrow", sans-serif',
    body: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
  },
  typeScale: { hero: 184, body: 28 },
  radius: 2,
};

const MUTED = '#8A8270';
const PANEL = '#12100C';
const CELL = '#1C1914';
const LINE = 'rgba(255,178,26,0.16)';
const GRID = 'rgba(236,230,214,0.07)';
const AMBER_SOFT = 'rgba(255,178,26,0.45)';
const AMBER_FAINT = 'rgba(255,178,26,0.12)';
const CREAM_SOFT = 'rgba(236,230,214,0.3)';
const CREAM_FILL = 'rgba(236,230,214,0.24)';
const UP = '#56D08B';
const DOWN = '#FF5A4E';
const HATCH =
  'repeating-linear-gradient(135deg, rgba(236,230,214,0.34) 0 2px, rgba(236,230,214,0.06) 2px 9px)';
const HATCH_LIGHT =
  'repeating-linear-gradient(135deg, rgba(236,230,214,0.2) 0 2px, rgba(236,230,214,0.03) 2px 12px)';
const HATCH_AMBER =
  'repeating-linear-gradient(135deg, rgba(255,178,26,0.5) 0 2px, rgba(255,178,26,0.08) 2px 9px)';

const MONO = 'var(--osd-font-body)';
const COND = 'var(--osd-font-display)';
const CRISP = 'cubic-bezier(0.2, 0, 0, 1)';
const M = 96;

const SLIDE_ID = 'marlow-investor-day';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600;700&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const CSS = `
.mx-root { font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased; }
.mx-root * { box-sizing: border-box; }
@keyframes mx-roll { from { transform: translateY(var(--from, 0lh)) } }
@keyframes mx-flip { from { transform: translateY(var(--from, 0px)) } }
@keyframes mx-shade { from { opacity: 0.85; transform: scaleY(1) } to { opacity: 0; transform: scaleY(0.12) } }
@keyframes mx-draw { from { stroke-dashoffset: 1 } }
@keyframes mx-ride { from { offset-distance: 0% } }
@keyframes mx-on { from { opacity: 0 } }
@keyframes mx-inv { from { background: var(--osd-accent); color: var(--osd-bg) } to { background: var(--osd-accent); color: var(--osd-bg) } }
@keyframes mx-blink { 50% { opacity: 0 } }
@keyframes mx-boot { 0% { opacity: 0 } 18% { opacity: 0.8 } 30% { opacity: 0.2 } 46% { opacity: 1 } 62% { opacity: 0.7 } 100% { opacity: 1 } }
@keyframes mx-gy { from { transform: scaleY(0) } }
@keyframes mx-gx { from { transform: scaleX(0) } }
@keyframes mx-pop { from { opacity: 0; transform: translateY(8px) } }
@keyframes mx-fade { from { opacity: 0 } }
@keyframes mx-tape { to { transform: translateX(-50%) } }
@keyframes mx-tick { from { opacity: 0; transform: translateY(-0.45em) } }
@keyframes mx-sweep { from { transform: translateX(var(--from, 0px)) } }
@keyframes mx-scan { from { transform: translateX(0); opacity: 1 } 94% { opacity: 1 } to { transform: translateX(var(--to)); opacity: 0 } }
@keyframes mx-packet { from { stroke-dashoffset: 0.05 } to { stroke-dashoffset: -1 } }
@keyframes mx-ping { from { transform: scale(1); opacity: 0.9 } to { transform: scale(3.6); opacity: 0 } }
@keyframes mx-basis { from { flex-basis: var(--from) } }
@keyframes mx-wipe { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes mx-fold { from { opacity: 0; transform: perspective(1800px) rotateX(-74deg) } 35% { opacity: 1 } }
@keyframes mx-flash { from { background-color: var(--flash) } }
.mx-live .mx-roll { animation: mx-roll var(--du, 1500ms) cubic-bezier(0.3, 0, 0, 1) var(--dl, 0ms) both }
.mx-live .mx-flip { animation: mx-flip var(--du) steps(var(--n), jump-none) var(--dl, 0ms) both }
.mx-live .mx-shade { animation: mx-shade var(--st) linear var(--dl, 0ms) var(--k) forwards }
.mx-live .mx-draw { animation: mx-draw var(--du, 1200ms) var(--ez, cubic-bezier(0.4, 0, 0.2, 1)) var(--dl, 0ms) both }
.mx-live .mx-ride { animation: mx-ride var(--du, 1200ms) var(--ez, cubic-bezier(0.4, 0, 0.2, 1)) var(--dl, 0ms) both }
.mx-live .mx-ch { animation: mx-on 1ms linear var(--dl) both, mx-inv var(--du) linear var(--dl) }
.mx-live .mx-on { animation: mx-on 1ms linear var(--dl, 0ms) both }
.mx-live .mx-boot { animation: mx-boot 560ms linear var(--dl, 0ms) both }
.mx-live .mx-gy { animation: mx-gy var(--du, 420ms) ${CRISP} var(--dl, 0ms) both }
.mx-live .mx-gx { animation: mx-gx var(--du, 700ms) ${CRISP} var(--dl, 0ms) both }
.mx-live .mx-pop { animation: mx-pop var(--du, 380ms) ${CRISP} var(--dl, 0ms) both }
.mx-live .mx-fade { animation: mx-fade var(--du, 320ms) linear var(--dl, 0ms) both }
.mx-live .mx-blink { animation: mx-blink 1.06s steps(1, end) infinite }
.mx-live .mx-tape { animation: mx-tape var(--du, 90s) linear infinite }
.mx-live .mx-tick { animation: mx-tick 260ms ${CRISP} both }
.mx-live .mx-sweep { animation: mx-sweep var(--du) linear var(--dl, 0ms) both }
.mx-live .mx-scan { animation: mx-scan var(--du) linear var(--dl, 0ms) both }
.mx-live .mx-packet { animation: mx-packet var(--du, 1800ms) linear var(--dl, 0ms) infinite both }
.mx-live .mx-ping { animation: mx-ping 2.4s ${CRISP} var(--dl, 0ms) infinite both }
.mx-live .mx-basis { animation: mx-basis var(--du, 1500ms) cubic-bezier(0.65, 0, 0.2, 1) var(--dl, 0ms) both }
.mx-live .mx-wipe { animation: mx-wipe var(--du, 1400ms) linear var(--dl, 0ms) both }
.mx-live .mx-fold { animation: mx-fold 640ms ${CRISP} var(--dl, 0ms) both; transform-origin: 50% 0 }
.mx-live .mx-flash { animation: mx-flash 520ms ease-out both }
.mx-live [data-osd-step="pending"] :is(.mx-roll, .mx-flip, .mx-shade, .mx-draw, .mx-ride, .mx-gy, .mx-gx, .mx-pop, .mx-fade, .mx-fold, .mx-ch, .mx-on) { animation: none }
@media (prefers-reduced-motion: reduce) {
  .mx-root *, .mx-root *::before, .mx-root *::after { animation: none !important; }
}
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
  if (style.textContent !== CSS) style.textContent = CSS;
}

const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 200,
  exit: { duration: 200, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: { duration: 200, easing: CRISP, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

const LABEL: CSSProperties = {
  fontFamily: MONO,
  fontSize: 17,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const vars = (o: Record<string, string | number>) => o as CSSProperties;

const tm = (dl: number, du?: number, extra?: CSSProperties): CSSProperties => ({
  ...vars(du === undefined ? { '--dl': `${dl}ms` } : { '--dl': `${dl}ms`, '--du': `${du}ms` }),
  ...extra,
});

const rand = (n: number) => {
  let x = Math.imul(n ^ 0x2c1b3c6d, 0x297a2d39);
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

const bridge = (seed: number, n: number, a: number, b: number, vol: number) => {
  const w = [0];
  for (let i = 1; i < n; i++) w.push(w[i - 1] + (rand(seed * 1000 + i) - 0.5) * 2);
  return w.map((v, i) => {
    const f = i / (n - 1);
    return a + (b - a) * f + (v - w[n - 1] * f) * vol;
  });
};

const linePath = (vals: number[], w: number, h: number, lo: number, hi: number) =>
  vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - lo) / (hi - lo)) * h;
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

const T0 = Date.now();
const OPEN_S = 9 * 3600 + 30 * 60;

const hms = (s: number) => {
  const t = ((s % 86400) + 86400) % 86400;
  return `${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t / 60) % 60)}:${pad2(t % 60)}`;
};

const useSessionClock = (live: boolean) => {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!live) return;
    const tick = () => setS(Math.floor((Date.now() - T0) / 1000));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [live]);
  return live ? s : 0;
};

const useTick = (live: boolean, ms: number) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setT((v) => v + 1), ms);
    return () => window.clearInterval(id);
  }, [live, ms]);
  return live ? t : 0;
};

const Type = ({ text, dl = 0, iv = 16 }: { text: string; dl?: number; iv?: number }) => {
  const live = useIsActivePage();
  if (!live) return <>{text}</>;
  return (
    <>
      {[...text].map((c, i) => (
        <span key={i} className="mx-ch" style={tm(dl + i * iv, iv)}>
          {c}
        </span>
      ))}
    </>
  );
};

const Wheel = ({
  d,
  f,
  turns,
  dl,
  du,
}: {
  d: number;
  f: number;
  turns: number;
  dl: number;
  du: number;
}) => {
  const cells = '0123456789'.repeat(turns + 1);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ visibility: 'hidden' }}>{d}</span>
      <span style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <span
          className="mx-roll"
          style={vars({
            display: 'block',
            transform: `translateY(${-(turns * 10 + d)}lh)`,
            '--from': `${-f}lh`,
            '--dl': `${dl}ms`,
            '--du': `${du}ms`,
          })}
        >
          {[...cells].map((c, i) => (
            <span key={i} style={{ display: 'block' }}>
              {c}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
};

const Odo = ({
  value,
  from,
  dl = 0,
  du = 1500,
  stagger = 80,
}: {
  value: string;
  from?: string;
  dl?: number;
  du?: number;
  stagger?: number;
}) => {
  const live = useIsActivePage();
  if (!live) return <span style={{ whiteSpace: 'pre' }}>{value}</span>;
  const src = from ? [...from] : null;
  let di = 0;
  return (
    <span style={{ whiteSpace: 'pre' }}>
      {[...value].map((c, i) => {
        if (c < '0' || c > '9') return <span key={i}>{c}</span>;
        const d = Number(c);
        const fc = src?.[i];
        const f = fc && fc >= '0' && fc <= '9' ? Number(fc) : 0;
        const k = di++;
        if (src && f === d) return <span key={i}>{c}</span>;
        return <Wheel key={i} d={d} f={f} turns={src ? 1 : 1 + k} dl={dl + k * stagger} du={du} />;
      })}
    </span>
  );
};

const FLAP_POOL = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
const pick = (seed: number) => FLAP_POOL[Math.floor(rand(seed) * FLAP_POOL.length)];

const Flap = ({
  to,
  from,
  n = 8,
  dl = 0,
  st = 60,
  w,
  h,
  size,
  color = 'var(--osd-text)',
  seed = 1,
}: {
  to: string;
  from?: string;
  n?: number;
  dl?: number;
  st?: number;
  w: number;
  h: number;
  size: number;
  color?: string;
  seed?: number;
}) => {
  const live = useIsActivePage();
  const still = !live || from === to || (to === ' ' && from === undefined);
  const frames = still
    ? [to]
    : [
        to,
        ...Array.from({ length: Math.max(1, n - 2) }, (_, i) => pick(seed * 131 + i * 17)),
        from ?? pick(seed * 7 + 3),
      ];
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: w,
        height: h,
        background: CELL,
        borderRadius: 2,
        overflow: 'hidden',
        color,
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: size,
        verticalAlign: 'top',
      }}
    >
      <span
        className={still ? undefined : 'mx-flip'}
        style={vars({
          display: 'block',
          '--from': `${-(frames.length - 1) * h}px`,
          '--n': frames.length,
          '--du': `${frames.length * st}ms`,
          '--dl': `${dl}ms`,
        })}
      >
        {frames.map((c, i) => (
          <span
            key={i}
            style={{ display: 'block', height: h, lineHeight: `${h}px`, textAlign: 'center' }}
          >
            {c === ' ' ? ' ' : c}
          </span>
        ))}
      </span>
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: h / 2,
          background: 'linear-gradient(rgba(255,255,255,0.045), rgba(255,255,255,0.01))',
        }}
      />
      {!still && (
        <span
          className="mx-shade"
          style={vars({
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: h / 2,
            background: 'rgba(0,0,0,0.6)',
            transformOrigin: '50% 100%',
            opacity: 0,
            '--st': `${st}ms`,
            '--k': frames.length - 1,
            '--dl': `${dl}ms`,
          })}
        />
      )}
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: h / 2 - 1,
          height: 2,
          background: 'var(--osd-bg)',
        }}
      />
    </span>
  );
};

const Trace = ({
  d,
  w,
  h,
  dl = 0,
  du = 1400,
  area = false,
}: {
  d: string;
  w: number;
  h: number;
  dl?: number;
  du?: number;
  area?: boolean;
}) => (
  <div style={{ position: 'relative', width: w, height: h }}>
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
    >
      {area && (
        <path
          d={`${d} L${w} ${h} L0 ${h} Z`}
          fill={AMBER_FAINT}
          className="mx-fade"
          style={tm(dl + du * 0.7, 500)}
        />
      )}
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke="var(--osd-accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeDasharray="1"
        className="mx-draw"
        style={tm(dl, du)}
      />
    </svg>
    <span
      className="mx-ride"
      style={tm(dl, du, {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 9,
        height: 9,
        background: 'var(--osd-accent)',
        offsetPath: `path('${d}')`,
        offsetDistance: '100%',
        offsetRotate: '0deg',
        boxShadow: '0 0 0 4px rgba(255,178,26,0.16), 0 0 14px rgba(255,178,26,0.75)',
      })}
    />
  </div>
);

type Fn = 'DES' | 'GP' | 'FA' | 'LAT' | 'MBO' | 'GRW' | 'MAP' | 'TGT' | 'CAP';

const FnKey = ({ k, on }: { k: Fn; on?: Fn }) => {
  const active = k === on;
  return (
    <span
      style={{
        height: 30,
        padding: '0 11px',
        display: 'inline-flex',
        alignItems: 'center',
        background: active ? 'var(--osd-accent)' : 'transparent',
        color: active ? 'var(--osd-bg)' : MUTED,
        fontWeight: active ? 600 : 500,
        letterSpacing: '0.06em',
      }}
    >
      {k}
    </span>
  );
};

const TickText = ({ text }: { text: string }) => (
  <span style={{ whiteSpace: 'pre' }}>
    {[...text].map((c, i) => (
      <span key={`${i}-${c}`} className="mx-tick" style={{ display: 'inline-block' }}>
        {c}
      </span>
    ))}
  </span>
);

const Header = ({ fn }: { fn?: Fn }) => {
  const live = useIsActivePage();
  const s = useSessionClock(live);
  return (
    <>
      <div
        style={abs(M, 40, {
          width: 1728,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          fontSize: 18,
          fontWeight: 500,
        })}
      >
        <span
          style={{
            height: 30,
            padding: '0 10px',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--osd-accent)',
            color: 'var(--osd-bg)',
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          MRLW
        </span>
        <span style={{ marginLeft: 14 }}>US Equity</span>
        <span style={{ marginLeft: 12, color: MUTED }}>&lt;GO&gt;</span>
        <span style={{ width: 1, height: 24, background: LINE, margin: '0 20px' }} />
        <FnKey k="DES" on={fn} />
        <FnKey k="GP" on={fn} />
        <FnKey k="FA" on={fn} />
        <FnKey k="LAT" on={fn} />
        <FnKey k="MBO" on={fn} />
        <FnKey k="GRW" on={fn} />
        <FnKey k="MAP" on={fn} />
        <FnKey k="TGT" on={fn} />
        <FnKey k="CAP" on={fn} />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 30 }}>
          <span>
            <span style={{ color: MUTED, marginRight: 10 }}>NY</span>
            <TickText text={hms(OPEN_S + s)} />
          </span>
          <span>
            <span style={{ color: MUTED, marginRight: 10 }}>LDN</span>
            <TickText text={hms(OPEN_S + 5 * 3600 + s)} />
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--osd-accent)',
              letterSpacing: '0.08em',
            }}
          >
            <span
              className="mx-blink"
              style={{ width: 10, height: 10, background: 'var(--osd-accent)' }}
            />
            LIVE
          </span>
        </div>
      </div>
      <div style={abs(M, 96, { width: 1728, height: 1, background: LINE })} />
    </>
  );
};

const Footer = ({ source }: { source: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <div style={abs(M, 984, { width: 1728, height: 1, background: LINE })} />
      <div
        style={abs(M, 1000, {
          ...LABEL,
          width: 1728,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          color: MUTED,
        })}
      >
        <span style={{ color: 'var(--osd-accent)', fontWeight: 600 }}>
          PG {pad2(current)}/{pad2(total)}
        </span>
        <span>Marlow Exchange Inc. · Investor Day 2026 · New York</span>
        <span style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: '0.02em' }}>
          {source}
        </span>
      </div>
    </>
  );
};

const TapeItem = ({ sym, px, chg, up }: { sym: string; px: string; chg: string; up: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '0 30px',
      height: '100%',
      borderRight: `1px solid ${LINE}`,
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{ color: 'var(--osd-accent)', fontWeight: 600 }}>{sym}</span>
    <span>{px}</span>
    <span style={{ color: up ? UP : DOWN }}>
      {up ? '▲' : '▼'} {chg}
    </span>
  </span>
);

const TapeSet = () => (
  <div style={{ display: 'flex', height: '100%' }}>
    <TapeItem sym="MRLW" px="184.62" chg="1.27%" up />
    <TapeItem sym="MX100" px="8,412.6" chg="0.61%" up />
    <TapeItem sym="HXN" px="62.14" chg="0.42%" up />
    <TapeItem sym="KSTL" px="41.08" chg="0.88%" up={false} />
    <TapeItem sym="VNTR" px="318.50" chg="2.06%" up />
    <TapeItem sym="ODEN" px="12.77" chg="1.34%" up={false} />
    <TapeItem sym="QNTA" px="151.90" chg="3.12%" up />
    <TapeItem sym="BRCK" px="27.45" chg="0.31%" up={false} />
    <TapeItem sym="ALDR" px="96.31" chg="0.15%" up />
    <TapeItem sym="SOLV" px="58.03" chg="0.47%" up={false} />
    <TapeItem sym="MXTECH" px="3,906.2" chg="0.94%" up />
    <TapeItem sym="UST10Y" px="4.12%" chg="2BP" up={false} />
    <TapeItem sym="ADV MTD" px="$43.9B" chg="6.8%" up />
  </div>
);

const Tape = () => (
  <div
    style={abs(0, 988, {
      width: 1920,
      height: 52,
      borderTop: `1px solid ${LINE}`,
      borderBottom: `1px solid ${LINE}`,
      background: PANEL,
      overflow: 'hidden',
      fontSize: 19,
      fontWeight: 500,
    })}
  >
    <div
      className="mx-tape"
      style={tm(0, 70000, {
        display: 'flex',
        width: 'max-content',
        height: '100%',
        marginLeft: 300,
      })}
    >
      <TapeSet />
      <TapeSet />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 330,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: M,
        gap: 12,
        background: `linear-gradient(90deg, ${PANEL} 78%, rgba(18,16,12,0))`,
        ...LABEL,
        color: 'var(--osd-accent)',
      }}
    >
      <span style={{ width: 8, height: 8, background: 'var(--osd-accent)' }} />
      Marlow tape
    </div>
  </div>
);

const Stage = ({
  fn,
  source,
  tape = false,
  children,
}: {
  fn?: Fn;
  source?: string;
  tape?: boolean;
  children: ReactNode;
}) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'mx-root mx-live' : 'mx-root'}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--osd-bg)',
        color: 'var(--osd-text)',
        fontFamily: MONO,
      }}
    >
      <Header fn={fn} />
      {children}
      {tape ? <Tape /> : <Footer source={source ?? ''} />}
    </div>
  );
};

const Heading = ({ code, fn, title }: { code: string; fn: string; title: string }) => (
  <>
    <div style={abs(M, 126, { ...LABEL, display: 'flex', gap: 18 })}>
      <span style={{ color: 'var(--osd-accent)', fontWeight: 600 }}>{code}</span>
      <span style={{ color: MUTED }}>{fn}</span>
    </div>
    <h1
      style={abs(M, 158, {
        margin: 0,
        fontFamily: COND,
        fontWeight: 600,
        fontSize: 60,
        lineHeight: 1.05,
        letterSpacing: '-0.012em',
        whiteSpace: 'nowrap',
      })}
    >
      <Type text={title} dl={140} iv={13} />
    </h1>
  </>
);

const Panel = ({
  x,
  y,
  w,
  h,
  title,
  meta,
  dl = 0,
  anim = 'mx-boot',
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  meta?: string;
  dl?: number;
  anim?: 'mx-boot' | 'mx-fold';
  children?: ReactNode;
}) => (
  <div
    className={anim}
    style={tm(dl, undefined, {
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: PANEL,
      border: `1px solid ${LINE}`,
      borderRadius: 'var(--osd-radius)',
    })}
  >
    <div
      style={{
        ...LABEL,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 20px',
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <span style={{ width: 8, height: 8, background: 'var(--osd-accent)', flex: 'none' }} />
      <span>{keep(title)}</span>
      {meta && <span style={{ marginLeft: 'auto', color: MUTED }}>{keep(meta)}</span>}
    </div>
    <div style={{ position: 'absolute', left: 0, top: 44, right: 0, bottom: 0 }}>{children}</div>
  </div>
);

const keep = (s: string) =>
  s.split(/(µs|σ)/).map((part, i) =>
    part === 'µs' || part === 'σ' ? (
      <span key={i} style={{ textTransform: 'none' }}>
        {part}
      </span>
    ) : (
      part
    ),
  );

const Cap = ({ children, color = MUTED }: { children: ReactNode; color?: string }) => (
  <div style={{ ...LABEL, color }}>{children}</div>
);

const INTRA = bridge(11, 79, 182.4, 184.62, 0.3);
const INTRA_HI = Math.max(...INTRA);
const INTRA_LO = Math.min(...INTRA);
const PREV_CLOSE = 182.31;
const INTRA_TOP = INTRA_HI + 0.35;
const INTRA_BOT = Math.min(INTRA_LO, PREV_CLOSE) - 0.35;
const INTRA_PATH = linePath(INTRA, 510, 220, INTRA_BOT, INTRA_TOP);

const CommandBar = ({
  x,
  y,
  w,
  text,
  size,
  h,
  status,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  size: number;
  h: number;
  status?: string;
}) => {
  const iv = 70;
  const done = 300 + text.length * iv;
  return (
    <div style={abs(x, y, { display: 'flex', alignItems: 'center', gap: 28 })}>
      <div
        style={{
          width: w,
          height: h,
          border: `1px solid ${AMBER_SOFT}`,
          background: PANEL,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${Math.round(size * 0.7)}px`,
          gap: Math.round(size * 0.5),
          fontSize: size,
          fontWeight: 500,
        }}
      >
        <span style={{ color: MUTED }}>&gt;</span>
        <span style={{ color: 'var(--osd-accent)', whiteSpace: 'pre', display: 'flex' }}>
          <Type text={text} dl={300} iv={iv} />
          <span className="mx-on" style={tm(done, undefined, { marginLeft: size * 0.12 })}>
            <span
              className="mx-blink"
              style={{
                display: 'inline-block',
                width: size * 0.6,
                height: size * 1.05,
                background: 'var(--osd-accent)',
                verticalAlign: 'middle',
              }}
            />
          </span>
        </span>
      </div>
      {status && (
        <span className="mx-on" style={tm(done + 200, undefined, { ...LABEL, color: MUTED })}>
          {status}
        </span>
      )}
    </div>
  );
};

const Credit = ({ x, title, name }: { x: number; title: string; name: string }) => (
  <div className="mx-pop" style={tm(2100 + (x - M) * 0.6, undefined, abs(x, 836))}>
    <Cap color="var(--osd-accent)">{title}</Cap>
    <div style={{ fontFamily: COND, fontWeight: 600, fontSize: 32, lineHeight: 1.1, marginTop: 8 }}>
      {name}
    </div>
  </div>
);

const QuoteStat = ({
  x,
  y,
  label,
  value,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
}) => (
  <div style={abs(x, y)}>
    <Cap>{label}</Cap>
    <div style={{ fontSize: 28, fontWeight: 500, marginTop: 6 }}>{value}</div>
  </div>
);

const Cover: Page = () => (
  <Stage tape>
    <CommandBar
      x={M}
      y={164}
      w={460}
      h={64}
      size={30}
      text="MRLW <GO>"
      status="Investor Day 2026 · session loaded"
    />
    <div style={abs(M, 292, { ...LABEL, color: MUTED, display: 'flex', gap: 26 })}>
      <span style={{ color: 'var(--osd-accent)' }}>Event</span>
      <span>14 Oct 2026</span>
      <span>55 Water Street, New York</span>
      <span>Webcast + replay</span>
    </div>
    <h1
      style={abs(M - 6, 330, {
        margin: 0,
        fontFamily: COND,
        fontWeight: 700,
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 0.94,
        letterSpacing: '-0.02em',
      })}
    >
      <span style={{ display: 'block' }}>
        <Type text="Investor Day" dl={1050} iv={42} />
      </span>
      <span style={{ display: 'block', color: 'var(--osd-accent)' }}>
        <Odo value="2026" dl={1500} du={1600} stagger={110} />
      </span>
    </h1>
    <p
      className="mx-pop"
      style={tm(
        2000,
        undefined,
        abs(M, 712, {
          margin: 0,
          fontFamily: COND,
          fontWeight: 500,
          fontSize: 46,
          lineHeight: 1.2,
        }),
      )}
    >
      Fewer microseconds. <span style={{ color: MUTED }}>More recurring revenue.</span>
    </p>
    <Credit x={M} title="Chair & CEO" name="Helen Achterberg" />
    <Credit x={M + 380} title="Chief Financial Officer" name="Daniel Okafor" />
    <Credit x={M + 760} title="President, Data" name="Mira Castell" />

    <Panel x={1264} y={164} w={560} h={730} title="MRLW US · last close" meta="13 Oct" dl={300}>
      <div style={abs(24, 22, { fontFamily: COND, fontWeight: 700, fontSize: 112, lineHeight: 1 })}>
        <Odo value="184.62" dl={700} du={1500} stagger={70} />
      </div>
      <div style={abs(26, 146, { display: 'flex', gap: 20, fontSize: 26, color: UP })}>
        <span>▲ +2.31</span>
        <span>+1.27%</span>
      </div>
      <div style={abs(24, 210)}>
        <svg
          width={510}
          height={220}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <line
            x1={0}
            x2={510}
            y1={220 - ((PREV_CLOSE - INTRA_BOT) / (INTRA_TOP - INTRA_BOT)) * 220}
            y2={220 - ((PREV_CLOSE - INTRA_BOT) / (INTRA_TOP - INTRA_BOT)) * 220}
            stroke={MUTED}
            strokeDasharray="3 5"
          />
          <line x1={0} x2={510} y1={0} y2={0} stroke={GRID} />
          <line x1={0} x2={510} y1={110} y2={110} stroke={GRID} />
          <line x1={0} x2={510} y1={220} y2={220} stroke={GRID} />
        </svg>
        <Trace d={INTRA_PATH} w={510} h={220} dl={900} du={1700} area />
        <div
          style={abs(310, 220 - ((PREV_CLOSE - INTRA_BOT) / (INTRA_TOP - INTRA_BOT)) * 220 + 8, {
            ...LABEL,
            width: 200,
            textAlign: 'right',
            whiteSpace: 'nowrap',
            color: MUTED,
          })}
        >
          Prev 182.31
        </div>
      </div>
      <div
        style={abs(24, 444, {
          ...LABEL,
          width: 510,
          display: 'flex',
          justifyContent: 'space-between',
          color: MUTED,
        })}
      >
        <span>09:30</span>
        <span>12:00</span>
        <span>14:00</span>
        <span>16:00</span>
      </div>
      <div style={abs(24, 492, { width: 510, height: 1, background: LINE })} />
      <QuoteStat x={24} y={516} label="Open" value="182.40" />
      <QuoteStat x={204} y={516} label="High" value={INTRA_HI.toFixed(2)} />
      <QuoteStat x={384} y={516} label="Low" value={INTRA_LO.toFixed(2)} />
      <QuoteStat x={24} y={596} label="Volume" value="2.84M" />
      <QuoteStat x={204} y={596} label="Mkt cap" value="$34.3B" />
      <QuoteStat x={384} y={596} label="P/E 26E" value="31.2×" />
    </Panel>
  </Stage>
);

const ADV_Q = [30.1, 31.4, 32.0, 33.2, 34.5, 35.1, 35.9, 36.8, 38.9, 40.6, 41.8, 43.5];

const QuarterBars = () => {
  const W = 640;
  const H = 200;
  const slot = W / ADV_Q.length;
  const bw = 30;
  const y = (v: number) => H - (v / 50) * H;
  return (
    <svg width={W} height={H + 36} style={abs(32, 360, { overflow: 'visible' })}>
      <line x1={0} x2={W} y1={y(25)} y2={y(25)} stroke={GRID} />
      <line x1={0} x2={W} y1={y(50)} y2={y(50)} stroke={GRID} />
      <line x1={0} x2={W} y1={H} y2={H} stroke={LINE} />
      {ADV_Q.map((v, i) => (
        <rect
          key={i}
          x={i * slot + (slot - bw) / 2}
          y={y(v)}
          width={bw}
          height={H - y(v)}
          fill={i >= 8 ? 'var(--osd-accent)' : AMBER_SOFT}
          className="mx-gy"
          style={tm(600 + i * 70, 460, { transformBox: 'fill-box', transformOrigin: '50% 100%' })}
        />
      ))}
      <g className="mx-fade" style={tm(1500, 400)}>
        <line
          x1={8 * slot}
          x2={W}
          y1={y(41.2)}
          y2={y(41.2)}
          stroke="var(--osd-text)"
          strokeDasharray="4 4"
        />
        <text
          x={8 * slot + 4}
          y={y(41.2) - 64}
          fill="var(--osd-text)"
          fontSize={17}
          letterSpacing="0.06em"
        >
          FY26E AVG 41.2
        </text>
        <line
          x1={8 * slot + 4}
          x2={8 * slot + 4}
          y1={y(41.2) - 56}
          y2={y(41.2) - 4}
          stroke="var(--osd-text)"
          strokeWidth={1}
        />
      </g>
      <text x={0} y={H + 30} fill={MUTED} fontSize={17}>
        Q4&apos;23
      </text>
      <text x={4 * slot} y={H + 30} fill={MUTED} fontSize={17}>
        Q4&apos;24
      </text>
      <text x={8 * slot} y={H + 30} fill={MUTED} fontSize={17}>
        Q4&apos;25
      </text>
      <text x={W} y={H + 30} fill="var(--osd-accent)" fontSize={17} textAnchor="end">
        Q3&apos;26
      </text>
      <text x={W + 8} y={y(50) + 6} fill={MUTED} fontSize={17}>
        50
      </text>
      <text x={W + 8} y={y(25) + 6} fill={MUTED} fontSize={17}>
        25
      </text>
    </svg>
  );
};

const KpiTile = ({
  x,
  y,
  title,
  value,
  delta,
  note,
  series,
  dl,
}: {
  x: number;
  y: number;
  title: string;
  value: string;
  delta: string;
  note: string;
  series: number[];
  dl: number;
}) => {
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  return (
    <Panel x={x} y={y} w={487} h={332} title={title} meta="FY26E" dl={dl}>
      <div style={abs(26, 26, { fontFamily: COND, fontWeight: 700, fontSize: 88, lineHeight: 1 })}>
        <Odo value={value} dl={dl + 200} du={1400} />
      </div>
      <div
        style={abs(28, 126, {
          width: 429,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        })}
      >
        <span style={{ fontSize: 22, color: UP, fontWeight: 500 }}>{delta}</span>
        <span style={{ ...LABEL, color: MUTED }}>{note}</span>
      </div>
      <div style={abs(28, 176)}>
        <Trace d={linePath(series, 429, 64, lo, hi)} w={429} h={64} dl={dl + 400} du={1300} area />
      </div>
      <div
        style={abs(28, 252, {
          ...LABEL,
          width: 429,
          display: 'flex',
          justifyContent: 'space-between',
          color: MUTED,
        })}
      >
        <span>Q4&apos;23</span>
        <span>Q3&apos;26</span>
      </div>
    </Panel>
  );
};

const Snapshot: Page = () => (
  <Stage fn="DES" source="FY26E = Jan–Sep actual + Q4 guidance midpoint. Unaudited.">
    <Heading
      code="DES"
      fn="Company snapshot · FY2026E"
      title="Record revenue, and more than half of it recurs."
    />
    <Panel x={M} y={264} w={706} h={688} title="Average daily volume" meta="Notional · USD">
      <div style={abs(32, 30)}>
        <Cap>FY26E · all asset classes</Cap>
      </div>
      <div style={abs(26, 62, { fontFamily: COND, fontWeight: 700, fontSize: 200, lineHeight: 1 })}>
        <Odo value="$41.2B" dl={250} du={1700} stagger={110} />
      </div>
      <div style={abs(32, 290, { display: 'flex', alignItems: 'baseline', gap: 22 })}>
        <span style={{ fontSize: 26, color: UP, fontWeight: 500 }}>▲ 18.4% Y/Y</span>
        <span style={{ ...LABEL, color: MUTED }}>vs $34.8B in FY25</span>
      </div>
      <QuarterBars />
    </Panel>
    <KpiTile
      x={826}
      y={264}
      title="Net revenue"
      value="$2.84B"
      delta="▲ 14.2% Y/Y"
      note="FY25 $2.49B"
      series={bridge(3, 12, 0.56, 0.76, 0.012)}
      dl={250}
    />
    <KpiTile
      x={1337}
      y={264}
      title="Adj. EBITDA margin"
      value="61%"
      delta="▲ 2.1 PTS"
      note="EBITDA $1.73B"
      series={bridge(5, 12, 56.5, 61.4, 0.5)}
      dl={380}
    />
    <KpiTile
      x={826}
      y={620}
      title="Recurring revenue"
      value="54%"
      delta="▲ 5.0 PTS"
      note="$1.53B of $2.84B"
      series={bridge(8, 12, 46, 54.6, 0.45)}
      dl={510}
    />
    <KpiTile
      x={1337}
      y={620}
      title="Listed companies"
      value="1,312"
      delta="▲ 64 NET"
      note="112 IPOs · 38 transfers"
      series={bridge(13, 12, 1190, 1312, 6)}
      dl={640}
    />
  </Stage>
);

const GP = (() => {
  const n = 60;
  const a = Math.log(59.04);
  const b = Math.log(184.62);
  const w = [0];
  for (let i = 1; i <= n; i++) w.push(w[i - 1] + (rand(700 + i) - 0.5) * 2);
  const closes: number[] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const k = Math.min(1, Math.max(0, (i - 5) / 16));
    closes.push(
      Math.exp(a + (b - a) * f + (w[i] - w[n] * f) * 0.05 - 0.24 * Math.sin(Math.PI * k)),
    );
  }
  const candles = Array.from({ length: n }, (_, i) => {
    const o = closes[i];
    const c = closes[i + 1];
    return {
      o,
      c,
      h: Math.max(o, c) * (1.012 + rand(900 + i) * 0.04),
      l: Math.min(o, c) * (0.988 - rand(1100 + i) * 0.04),
    };
  });
  const adv = bridge(41, n, 16.8, 43.5, 0.9).map((v, i) =>
    i === n - 1 ? v : v * (0.9 + rand(1300 + i) * 0.2),
  );
  const ma: number[] = [];
  for (let i = 11; i < n; i++) {
    let s = 0;
    for (let j = i - 11; j <= i; j++) s += closes[j + 1];
    ma.push(s / 12);
  }
  return { candles, adv, ma };
})();

const G = { x0: 24, pw: 1168, pTop: 96, pH: 352, vBase: 584, vH: 100, hi: 200, lo: 40 };
const gSlot = G.pw / 60;
const gx = (i: number) => G.x0 + (i + 0.5) * gSlot;
const gy = (p: number) => G.pTop + ((G.hi - p) / (G.hi - G.lo)) * G.pH;
const gv = (v: number) => G.vBase - (v / 50) * G.vH;
const G_STEP = 22;
const G_START = 300;

const EventFlag = ({ i, letter }: { i: number; letter: string }) => {
  const top = gy(GP.candles[i].h) - 44;
  return (
    <g className="mx-pop" style={tm(G_START + i * G_STEP + 240)}>
      <line
        x1={gx(i)}
        x2={gx(i)}
        y1={top + 24}
        y2={gy(GP.candles[i].h) - 4}
        stroke="var(--osd-accent)"
        strokeDasharray="2 3"
      />
      <rect x={gx(i) - 12} y={top} width={24} height={24} fill="var(--osd-accent)" />
      <text
        x={gx(i)}
        y={top + 18}
        textAnchor="middle"
        fontSize={17}
        fontWeight={600}
        fill="var(--osd-bg)"
      >
        {letter}
      </text>
    </g>
  );
};

const PriceChart = () => {
  const last = GP.candles[59];
  const maPath = GP.ma
    .map((v, k) => `${k ? 'L' : 'M'}${gx(k + 11).toFixed(1)} ${gy(v).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={1288} height={642} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {[50, 100, 150, 200].map((p) => (
        <g key={p}>
          <line x1={G.x0} x2={G.x0 + G.pw} y1={gy(p)} y2={gy(p)} stroke={GRID} />
          <text x={G.x0 + G.pw + 14} y={gy(p) + 6} fill={MUTED} fontSize={17}>
            {p}
          </text>
        </g>
      ))}
      <line x1={G.x0} x2={G.x0 + G.pw} y1={G.vBase} y2={G.vBase} stroke={LINE} />
      <line x1={G.x0} x2={G.x0 + G.pw} y1={gv(50)} y2={gv(50)} stroke={GRID} />
      <text x={G.x0 + G.pw + 14} y={gv(50) + 6} fill={MUTED} fontSize={17}>
        50
      </text>
      <text x={G.x0 + G.pw + 14} y={gv(25) + 6} fill={MUTED} fontSize={17}>
        25
      </text>
      <text x={G.x0} y={gv(50) - 12} fill={MUTED} fontSize={17} letterSpacing="0.08em">
        ADV · USD BN
      </text>
      {GP.candles.map((c, i) => {
        const up = c.c >= c.o;
        const top = gy(Math.max(c.o, c.c));
        const bh = Math.max(2, gy(Math.min(c.o, c.c)) - top);
        return (
          <g
            key={i}
            className="mx-gy"
            style={tm(G_START + i * G_STEP, 280, {
              transformBox: 'fill-box',
              transformOrigin: '50% 50%',
            })}
          >
            <line
              x1={gx(i)}
              x2={gx(i)}
              y1={gy(c.h)}
              y2={gy(c.l)}
              stroke="var(--osd-accent)"
              strokeWidth={1.5}
            />
            <rect
              x={gx(i) - 6}
              y={top}
              width={12}
              height={bh}
              fill={up ? 'var(--osd-accent)' : PANEL}
              stroke="var(--osd-accent)"
              strokeWidth={1.5}
            />
          </g>
        );
      })}
      {GP.adv.map((v, i) => (
        <rect
          key={i}
          x={gx(i) - 6}
          y={gv(v)}
          width={12}
          height={G.vBase - gv(v)}
          fill={i === 59 ? 'var(--osd-accent)' : CREAM_SOFT}
          className="mx-gy"
          style={tm(G_START + i * G_STEP, 280, {
            transformBox: 'fill-box',
            transformOrigin: '50% 100%',
          })}
        />
      ))}
      <path
        d={maPath}
        pathLength={1}
        strokeDasharray="1"
        fill="none"
        stroke="var(--osd-text)"
        strokeWidth={1.5}
        opacity={0.7}
        className="mx-draw"
        style={tm(G_START + 11 * G_STEP, 49 * G_STEP, vars({ '--ez': 'linear' }))}
      />
      {[3, 15, 27, 39, 51].map((i, k) => (
        <g key={i}>
          <line
            x1={G.x0 + i * gSlot}
            x2={G.x0 + i * gSlot}
            y1={G.vBase}
            y2={G.vBase + 8}
            stroke={MUTED}
          />
          <text x={G.x0 + i * gSlot + 6} y={G.vBase + 30} fill={MUTED} fontSize={17}>
            {2022 + k}
          </text>
        </g>
      ))}
      <EventFlag i={8} letter="A" />
      <EventFlag i={17} letter="B" />
      <EventFlag i={33} letter="C" />
      <EventFlag i={44} letter="D" />
      <EventFlag i={53} letter="E" />
      <g
        className="mx-sweep"
        style={tm(
          G_START,
          60 * G_STEP,
          vars({ '--from': `${(G.x0 - gx(59)).toFixed(1)}px`, transformBox: 'view-box' }),
        )}
      >
        <line
          x1={gx(59)}
          x2={gx(59)}
          y1={G.pTop - 70}
          y2={G.vBase}
          stroke="var(--osd-accent)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </g>
      <g className="mx-pop" style={tm(G_START + 60 * G_STEP + 120)}>
        <line
          x1={G.x0}
          x2={G.x0 + G.pw}
          y1={gy(last.c)}
          y2={gy(last.c)}
          stroke="var(--osd-accent)"
          strokeWidth={1}
          strokeDasharray="2 5"
          opacity={0.6}
        />
        <rect
          x={G.x0 + G.pw + 6}
          y={gy(last.c) - 15}
          width={80}
          height={30}
          fill="var(--osd-accent)"
        />
        <text
          x={G.x0 + G.pw + 46}
          y={gy(last.c) + 6}
          textAnchor="middle"
          fontSize={17}
          fontWeight={600}
          fill="var(--osd-bg)"
        >
          184.62
        </text>
      </g>
    </svg>
  );
};

const EventRow = ({
  y,
  letter,
  date,
  text,
}: {
  y: number;
  letter: string;
  date: string;
  text: string;
}) => (
  <div style={abs(24, y, { display: 'flex', alignItems: 'center', gap: 14, fontSize: 19 })}>
    <span
      style={{
        width: 24,
        height: 24,
        background: 'var(--osd-accent)',
        color: 'var(--osd-bg)',
        fontWeight: 600,
        fontSize: 17,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {letter}
    </span>
    <span style={{ color: MUTED, width: 74 }}>{date}</span>
    <span>{text}</span>
  </div>
);

const CompareBar = ({
  y,
  label,
  value,
  w,
  hot,
  dl,
}: {
  y: number;
  label: string;
  value: string;
  w: number;
  hot?: boolean;
  dl: number;
}) => (
  <div style={abs(24, y, { display: 'flex', alignItems: 'center', gap: 12, height: 26 })}>
    <span style={{ ...LABEL, width: 96, color: hot ? 'var(--osd-text)' : MUTED }}>{label}</span>
    <span
      className="mx-gx"
      style={tm(dl, 900, {
        width: w,
        height: 18,
        background: hot ? 'var(--osd-accent)' : CREAM_SOFT,
        transformOrigin: '0 50%',
      })}
    />
    <span style={{ fontSize: 19, color: hot ? 'var(--osd-accent)' : MUTED }}>{value}</span>
  </div>
);

const Graph: Page = () => (
  <Stage fn="GP" source="Monthly OHLC, Oct 2021 – Sep 2026. TSR assumes dividends reinvested.">
    <Heading
      code="GP"
      fn="Price & volume graph · monthly"
      title="Five years: the stock up 3.1×, volume up 2.4×."
    />
    <Panel x={M} y={264} w={1290} h={688} title="MRLW US · monthly OHLC + ADV" meta="USD · 12M MA">
      <PriceChart />
    </Panel>
    <Panel x={1410} y={264} w={414} h={688} title="Returns · 5Y" dl={200}>
      <div style={abs(24, 26)}>
        <Cap>Total shareholder return</Cap>
      </div>
      <div
        style={abs(20, 56, {
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 96,
          lineHeight: 1,
          color: 'var(--osd-accent)',
        })}
      >
        <Odo value="+231%" dl={500} du={1600} />
      </div>
      <CompareBar y={176} label="MRLW" value="231%" w={170} hot dl={900} />
      <CompareBar y={212} label="S&P Fin." value="71%" w={52} dl={1000} />
      <div style={abs(24, 266, { width: 364, height: 1, background: LINE })} />
      <div style={abs(24, 290)}>
        <Cap>Price CAGR</Cap>
        <div style={{ fontFamily: COND, fontWeight: 600, fontSize: 56, lineHeight: 1.1 }}>
          <Odo value="25.6%" dl={1100} />
        </div>
      </div>
      <div style={abs(210, 290)}>
        <Cap>ADV CAGR</Cap>
        <div style={{ fontFamily: COND, fontWeight: 600, fontSize: 56, lineHeight: 1.1 }}>
          <Odo value="19.1%" dl={1200} />
        </div>
      </div>
      <div style={abs(24, 404, { width: 364, height: 1, background: LINE })} />
      <div style={abs(24, 426)}>
        <Cap>Events</Cap>
      </div>
      <EventRow y={460} letter="A" date="JUN 22" text="Kestrel Clearing" />
      <EventRow y={494} letter="B" date="MAR 23" text="LD4 engine live" />
      <EventRow y={528} letter="C" date="JUL 24" text="Data Cloud launch" />
      <EventRow y={562} letter="D" date="JUN 25" text="Crypto ETPs listed" />
      <EventRow y={596} letter="E" date="MAR 26" text="38 µs median" />
    </Panel>
  </Stage>
);

const Seg = ({
  from,
  to,
  fill,
  ink,
  name,
  pct,
  dl,
}: {
  from: string;
  to: string;
  fill: string;
  ink: string;
  name: string;
  pct: string;
  dl: number;
}) => (
  <div
    className="mx-basis"
    style={tm(
      dl,
      1500,
      vars({
        flexBasis: to,
        flexGrow: 0,
        flexShrink: 0,
        '--from': from,
        position: 'relative',
        height: '100%',
        background: fill,
        borderRight: `3px solid ${PANEL}`,
        overflow: 'hidden',
      }),
    )}
  >
    <div
      className="mx-fade"
      style={tm(dl + 1500, 300, {
        position: 'absolute',
        left: 16,
        top: 14,
        color: ink,
        whiteSpace: 'nowrap',
      })}
    >
      <div style={{ ...LABEL, color: ink }}>{name}</div>
      <div style={{ fontSize: 30, fontWeight: 600, marginTop: 12 }}>{pct}</div>
    </div>
  </div>
);

const SegRow = ({
  y,
  fill,
  name,
  kind,
  a,
  b,
  cagr,
  w,
  dl,
}: {
  y: number;
  fill: string;
  name: string;
  kind: string;
  a: string;
  b: string;
  cagr: string;
  w: number;
  dl: number;
}) => (
  <div
    className="mx-pop"
    style={tm(
      dl,
      undefined,
      abs(0, y, {
        width: 1726,
        height: 46,
        display: 'flex',
        alignItems: 'baseline',
        paddingTop: 2,
      }),
    )}
  >
    <span
      style={{
        width: 20,
        height: 20,
        margin: '0 20px 0 32px',
        background: fill,
        alignSelf: 'center',
      }}
    />
    <span style={{ width: 368, fontFamily: COND, fontWeight: 500, fontSize: 30 }}>{name}</span>
    <span style={{ ...LABEL, width: 260, color: MUTED }}>{kind}</span>
    <span style={{ width: 160, textAlign: 'right', fontSize: 27 }}>{a}</span>
    <span style={{ width: 200, textAlign: 'right', fontSize: 27 }}>{b}</span>
    <span style={{ width: 474, paddingLeft: 80, alignSelf: 'center', height: 18 }}>
      <span
        className="mx-gx"
        style={tm(dl + 200, 800, {
          display: 'block',
          width: w,
          height: 18,
          background: 'var(--osd-accent)',
          transformOrigin: '0 50%',
        })}
      />
    </span>
    <span style={{ width: 160, textAlign: 'right', fontSize: 27, color: 'var(--osd-accent)' }}>
      {cagr}
    </span>
  </div>
);

const GroupLabel = ({
  label,
  value,
  from,
  right,
}: {
  label: string;
  value: string;
  from: string;
  right?: boolean;
}) => (
  <>
    <div
      style={{
        position: 'absolute',
        top: -52,
        left: right ? undefined : 0,
        right: right ? 3 : undefined,
        display: 'flex',
        gap: 12,
        alignItems: 'baseline',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ ...LABEL, color: right ? MUTED : 'var(--osd-accent)' }}>{label}</span>
      <span
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: right ? 'var(--osd-text)' : 'var(--osd-accent)',
        }}
      >
        <Odo value={value} from={from} dl={700} du={1500} />
      </span>
    </div>
    <div
      style={{
        position: 'absolute',
        top: -16,
        left: 0,
        right: 3,
        height: 9,
        borderTop: `1px solid ${right ? MUTED : 'var(--osd-accent)'}`,
        borderLeft: `1px solid ${right ? MUTED : 'var(--osd-accent)'}`,
        borderRight: `1px solid ${right ? MUTED : 'var(--osd-accent)'}`,
      }}
    />
  </>
);

const Mix: Page = () => (
  <Stage
    fn="FA"
    source="Net revenue = revenue less transaction-based expenses. FY21 restated for Kestrel."
  >
    <Heading
      code="FA"
      fn="Financial analysis · net revenue by segment"
      title="Recurring revenue went from 38% to 54% of the mix."
    />
    <Panel x={M} y={264} w={1728} h={340} title="Mix · share of net revenue" meta="FY21 → FY26E">
      <div style={abs(32, 24, { display: 'flex', gap: 5 })}>
        <Flap to="F" from="F" w={46} h={66} size={40} />
        <Flap to="Y" from="Y" w={46} h={66} size={40} />
        <Flap to="2" from="2" w={46} h={66} size={40} />
        <Flap
          to="6"
          from="1"
          n={9}
          st={70}
          dl={500}
          w={46}
          h={66}
          size={40}
          color="var(--osd-accent)"
          seed={4}
        />
      </div>
      <div style={abs(276, 22)}>
        <Cap>Net revenue</Cap>
        <div
          style={{
            fontFamily: COND,
            fontWeight: 600,
            fontSize: 46,
            lineHeight: 1.05,
            marginTop: 4,
          }}
        >
          <Odo value="$2.84B" from="$1.62B" dl={600} />
        </div>
      </div>
      <div style={abs(536, 22)}>
        <Cap>5Y CAGR</Cap>
        <div
          style={{
            fontFamily: COND,
            fontWeight: 600,
            fontSize: 46,
            lineHeight: 1.05,
            marginTop: 4,
            color: 'var(--osd-accent)',
          }}
        >
          <Odo value="11.9%" dl={700} />
        </div>
      </div>
      <div style={abs(32, 166, { width: 1662, height: 96, display: 'flex' })}>
        <div
          className="mx-basis"
          style={tm(
            600,
            1500,
            vars({
              flexBasis: '53.9%',
              '--from': '38.3%',
              flexShrink: 0,
              display: 'flex',
              position: 'relative',
            }),
          )}
        >
          <GroupLabel label="Recurring" value="54%" from="38%" />
          <Seg
            from="58.1%"
            to="61.4%"
            fill="var(--osd-accent)"
            ink="var(--osd-bg)"
            name="Market data"
            pct="33.1%"
            dl={600}
          />
          <Seg
            from="24.2%"
            to="19.0%"
            fill="rgba(255,178,26,0.66)"
            ink="var(--osd-bg)"
            name="Listings"
            pct="10.2%"
            dl={600}
          />
          <Seg
            from="17.7%"
            to="19.6%"
            fill="rgba(255,178,26,0.38)"
            ink="var(--osd-text)"
            name="Connectivity"
            pct="10.6%"
            dl={600}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
          <GroupLabel label="Transactional" value="46%" from="62%" right />
          <Seg
            from="71%"
            to="65.6%"
            fill={HATCH}
            ink="var(--osd-text)"
            name="Trading"
            pct="30.3%"
            dl={600}
          />
          <Seg
            from="29%"
            to="34.4%"
            fill={HATCH_LIGHT}
            ink="var(--osd-text)"
            name="Clearing"
            pct="15.8%"
            dl={600}
          />
        </div>
      </div>
    </Panel>
    <Panel x={M} y={628} w={1728} h={324} title="Segments · USD BN" meta="CAGR FY21–26E" dl={150}>
      <div style={abs(0, 10, { ...LABEL, width: 1726, height: 24, color: MUTED })}>
        <span style={abs(72, 0)}>Segment</span>
        <span style={abs(440, 0)}>Type</span>
        <span style={abs(700, 0, { width: 160, textAlign: 'right' })}>FY21</span>
        <span style={abs(900, 0, { width: 160, textAlign: 'right' })}>FY26E</span>
        <span style={abs(1140, 0)}>Growth</span>
        <span style={abs(1534, 0, { width: 160, textAlign: 'right' })}>CAGR</span>
      </div>
      <SegRow
        y={44}
        fill="var(--osd-accent)"
        name="Market data & analytics"
        kind="Recurring"
        a="0.36"
        b="0.94"
        cagr="21.2%"
        w={364}
        dl={900}
      />
      <SegRow
        y={90}
        fill="rgba(255,178,26,0.66)"
        name="Listings & index"
        kind="Recurring"
        a="0.15"
        b="0.29"
        cagr="14.1%"
        w={243}
        dl={980}
      />
      <SegRow
        y={136}
        fill="rgba(255,178,26,0.38)"
        name="Connectivity & colocation"
        kind="Recurring"
        a="0.11"
        b="0.30"
        cagr="22.2%"
        w={381}
        dl={1060}
      />
      <SegRow
        y={182}
        fill={HATCH}
        name="Trading"
        kind="Transactional"
        a="0.71"
        b="0.86"
        cagr="3.9%"
        w={67}
        dl={1140}
      />
      <SegRow
        y={228}
        fill={HATCH_LIGHT}
        name="Clearing"
        kind="Transactional"
        a="0.29"
        b="0.45"
        cagr="9.2%"
        w={158}
        dl={1220}
      />
    </Panel>
  </Stage>
);

const HIST = (() => {
  const raw = Array.from({ length: 35 }, (_, i) => {
    const x = 21 + i * 2;
    const core = Math.exp(-((Math.log(x) - Math.log(38.6)) ** 2) / (2 * 0.125 * 0.125));
    const tail = 0.045 * Math.exp(-((x - 62) ** 2) / 110);
    return core + tail;
  });
  const max = Math.max(...raw);
  return raw.map((v) => v / max);
})();

const hx = (v: number) => 32 + ((v - 20) / 70) * 932;

const Histogram = () => {
  const base = 586;
  const H = 250;
  return (
    <svg width={996} height={642} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <line x1={32} x2={964} y1={base} y2={base} stroke={LINE} />
      {HIST.map((v, i) => {
        const x0 = hx(20 + i * 2);
        const hot = i === 9;
        return (
          <rect
            key={i}
            x={x0 + 3}
            y={base - v * H}
            width={20.6}
            height={Math.max(2, v * H)}
            fill={
              hot ? 'var(--osd-accent)' : i > 9 && i < 21 ? AMBER_SOFT : 'rgba(255,178,26,0.28)'
            }
            className="mx-gy"
            style={tm(500 + i * 34, 420, { transformBox: 'fill-box', transformOrigin: '50% 100%' })}
          />
        );
      })}
      <g className="mx-pop" style={tm(1100)}>
        <line
          x1={hx(38)}
          x2={hx(38)}
          y1={base - H - 34}
          y2={base}
          stroke="var(--osd-text)"
          strokeDasharray="3 4"
        />
        <text
          x={hx(38) + 10}
          y={base - H - 18}
          fill="var(--osd-text)"
          fontSize={17}
          letterSpacing="0.06em"
        >
          P50 38
        </text>
      </g>
      <g className="mx-pop" style={tm(1500)}>
        <line
          x1={hx(61)}
          x2={hx(61)}
          y1={base - 120}
          y2={base}
          stroke={MUTED}
          strokeDasharray="3 4"
        />
        <text x={hx(61) + 10} y={base - 104} fill={MUTED} fontSize={17} letterSpacing="0.06em">
          P99 61
        </text>
      </g>
      <g className="mx-pop" style={tm(1700)}>
        <line
          x1={hx(84)}
          x2={hx(84)}
          y1={base - 80}
          y2={base}
          stroke={MUTED}
          strokeDasharray="3 4"
        />
        <text
          x={hx(84) - 10}
          y={base - 64}
          fill={MUTED}
          fontSize={17}
          letterSpacing="0.06em"
          textAnchor="end"
        >
          P99.9 84
        </text>
      </g>
      {[20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
        <text
          key={v}
          x={hx(v)}
          y={base + 30}
          fill={MUTED}
          fontSize={17}
          textAnchor={v === 20 ? 'start' : v === 90 ? 'end' : 'middle'}
        >
          {v}
        </text>
      ))}
    </svg>
  );
};

const LatStat = ({ y, label, value }: { y: number; label: string; value: string }) => (
  <div
    style={abs(560, y, {
      width: 404,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      borderBottom: `1px solid ${LINE}`,
      paddingBottom: 10,
    })}
  >
    <span style={{ ...LABEL, color: MUTED }}>{keep(label)}</span>
    <span style={{ fontSize: 28, fontWeight: 500 }}>{value}</span>
  </div>
);

const W_X0 = 40;
const W_X1 = 664;
const wx = (us: number) => W_X0 + (us / 38) * (W_X1 - W_X0);

const StageLabel = ({ a, b, name }: { a: number; b: number; name: string }) => (
  <div style={abs(wx(a), 26, { width: wx(b) - wx(a), textAlign: 'center' })}>
    <Cap>{name}</Cap>
    <div style={{ fontSize: 28, fontWeight: 500, marginTop: 6 }}>{b - a} µs</div>
  </div>
);

const OrderPath = () => {
  const live = useIsActivePage();
  return (
    <>
      <StageLabel a={0} b={6} name="Gateway" />
      <StageLabel a={6} b={15} name="Risk" />
      <StageLabel a={15} b={26} name="Match" />
      <StageLabel a={26} b={38} name="Publish" />
      <svg width={704} height={286} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <path
          d={`M${W_X0} 132 H${W_X1}`}
          stroke={AMBER_SOFT}
          strokeWidth={2}
          pathLength={1}
          strokeDasharray="1"
          className="mx-draw"
          style={tm(400, 900)}
        />
        {live && (
          <>
            <path
              d={`M${W_X0} 132 H${W_X1}`}
              stroke="var(--osd-accent)"
              strokeWidth={6}
              pathLength={1}
              strokeDasharray="0.035 2"
              fill="none"
              className="mx-packet"
              style={tm(1300, 1500)}
            />
            <path
              d={`M${W_X0} 132 H${W_X1}`}
              stroke="var(--osd-accent)"
              strokeWidth={6}
              pathLength={1}
              strokeDasharray="0.035 2"
              fill="none"
              className="mx-packet"
              style={tm(1800, 1500)}
            />
            <path
              d={`M${W_X0} 132 H${W_X1}`}
              stroke="var(--osd-accent)"
              strokeWidth={6}
              pathLength={1}
              strokeDasharray="0.035 2"
              fill="none"
              className="mx-packet"
              style={tm(2300, 1500)}
            />
          </>
        )}
        {[0, 6, 15, 26, 38].map((us, i) => (
          <rect
            key={us}
            x={wx(us) - 7}
            y={125}
            width={14}
            height={14}
            fill={i === 0 || i === 4 ? 'var(--osd-accent)' : PANEL}
            stroke="var(--osd-accent)"
            strokeWidth={2}
            className="mx-pop"
            style={tm(400 + i * 200)}
          />
        ))}
      </svg>
      <div style={abs(24, 166, { ...LABEL, color: MUTED })}>Order in · t=0</div>
      <div
        style={abs(456, 166, {
          ...LABEL,
          width: 224,
          textAlign: 'right',
          color: 'var(--osd-accent)',
        })}
      >
        {keep('Ack out · t=38 µs')}
      </div>
      <div style={abs(24, 226, { width: 656, height: 1, background: LINE })} />
      <div
        style={abs(24, 242, {
          ...LABEL,
          color: MUTED,
          textTransform: 'none',
          letterSpacing: '0.02em',
        })}
      >
        Measured at the NY4 cross-connect, 10 GbE, Sep 2026.
      </div>
    </>
  );
};

const PeerBar = ({
  y,
  name,
  us,
  hot,
  dl,
}: {
  y: number;
  name: string;
  us: number;
  hot?: boolean;
  dl: number;
}) => (
  <div style={abs(24, y, { width: 656, height: 40, display: 'flex', alignItems: 'center' })}>
    <span style={{ ...LABEL, width: 150, color: hot ? 'var(--osd-accent)' : MUTED }}>{name}</span>
    <span
      className="mx-gx"
      style={tm(dl, 900, {
        width: us * 4.3,
        height: 24,
        background: hot ? 'var(--osd-accent)' : CREAM_SOFT,
        transformOrigin: '0 50%',
      })}
    />
    <span
      style={{
        marginLeft: 16,
        fontSize: 28,
        fontWeight: 500,
        color: hot ? 'var(--osd-accent)' : 'var(--osd-text)',
      }}
    >
      <Odo value={String(us)} dl={dl} du={1100} />
    </span>
  </div>
);

const Latency: Page = () => (
  <Stage
    fn="LAT"
    source="Peers: published venue latency statistics, Q3 2026. Marlow: internal capture."
  >
    <Heading
      code="LAT"
      fn="Latency monitor · order entry, round-trip"
      title="38 µs from order in to acknowledgement out."
    />
    <Panel x={M} y={264} w={998} h={688} title="Distribution · 4.1bn orders" meta="µs · 2 µs bins">
      <div style={abs(32, 28)}>
        <Cap>Median round-trip</Cap>
      </div>
      <div
        style={abs(24, 56, {
          display: 'flex',
          alignItems: 'baseline',
          gap: 14,
          fontFamily: COND,
          fontWeight: 700,
          lineHeight: 1,
        })}
      >
        <span style={{ fontSize: 200, color: 'var(--osd-accent)' }}>
          <Odo value="38" dl={300} du={1500} stagger={140} />
        </span>
        <span style={{ fontSize: 72, color: MUTED }}>µs</span>
      </div>
      <LatStat y={44} label="P50" value="38 µs" />
      <LatStat y={98} label="P99" value="61 µs" />
      <LatStat y={152} label="P99.9" value="84 µs" />
      <LatStat y={206} label="Jitter σ" value="4.2 µs" />
      <Histogram />
    </Panel>
    <Panel x={1118} y={264} w={706} h={332} title="Path · median stage times" meta="µs" dl={200}>
      <OrderPath />
    </Panel>
    <Panel
      x={1118}
      y={620}
      w={706}
      h={332}
      title="Peers · median order-to-ack"
      meta="µs · Q3 2026"
      dl={350}
    >
      <PeerBar y={34} name="Marlow" us={38} hot dl={900} />
      <PeerBar y={94} name="Venue A" us={52} dl={1000} />
      <PeerBar y={154} name="Venue B" us={71} dl={1100} />
      <PeerBar y={214} name="Venue C" us={94} dl={1200} />
    </Panel>
  </Stage>
);

const MID = 62.14;

const level = (side: number, i: number, t: number) => {
  const period = 2 + Math.floor(rand(side * 100 + i) * 5);
  const phase = Math.floor(rand(side * 200 + i) * period);
  const v = Math.floor((t + phase) / period);
  const base = 1500 + i * 360 + rand(side * 300 + i) * 2600;
  const at = (k: number) =>
    Math.round((base * (0.7 + 0.6 * rand(side * 10007 + i * 97 + k * 7919))) / 100) * 100;
  return { size: at(v), prev: at(v - 1), v };
};

const DepthChart = ({ t }: { t: number }) => {
  const X0 = 80;
  const X1 = 972;
  const Y0 = 34;
  const Y1 = 384;
  const lo = MID - 0.255;
  const hi = MID + 0.255;
  const px = (p: number) => X0 + ((p - lo) / (hi - lo)) * (X1 - X0);
  const py = (q: number) => Y1 - (q / 200000) * (Y1 - Y0);
  const side = (s: number) => {
    let cum = 0;
    let d = `M${px(MID + s * 0.01).toFixed(1)} ${Y1}`;
    for (let i = 0; i < 24; i++) {
      const p = MID + s * (0.01 + i * 0.01);
      cum += level(s > 0 ? 1 : 0, i, t).size;
      d += ` V${py(cum).toFixed(1)} H${px(p + s * 0.01).toFixed(1)}`;
    }
    return d;
  };
  const bid = side(-1);
  const ask = side(1);
  return (
    <svg
      width={996}
      height={440}
      style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
    >
      {[50000, 100000, 150000, 200000].map((q) => (
        <g key={q}>
          <line x1={X0} x2={X1} y1={py(q)} y2={py(q)} stroke={GRID} />
          <text x={X0 - 14} y={py(q) + 6} fill={MUTED} fontSize={17} textAnchor="end">
            {q / 1000}K
          </text>
        </g>
      ))}
      <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke={LINE} />
      <g className="mx-wipe" style={tm(400, 1200)}>
        <path d={`${bid} V${Y1} Z`} fill="rgba(255,178,26,0.16)" />
        <path d={bid} fill="none" stroke="var(--osd-accent)" strokeWidth={2} />
        <path d={`${ask} V${Y1} Z`} fill="rgba(236,230,214,0.08)" />
        <path d={ask} fill="none" stroke="var(--osd-text)" strokeWidth={2} />
      </g>
      <line x1={px(MID)} x2={px(MID)} y1={Y0 - 10} y2={Y1} stroke={MUTED} strokeDasharray="3 4" />
      <rect x={px(MID) - 122} y={Y0 - 30} width={244} height={30} fill="var(--osd-accent)" />
      <text
        x={px(MID)}
        y={Y0 - 9}
        textAnchor="middle"
        fontSize={17}
        fontWeight={600}
        fill="var(--osd-bg)"
      >
        MID 62.14 · SPRD 0.02
      </text>
      {[61.9, 62.0, 62.1, 62.2, 62.3].map((p) => (
        <text key={p} x={px(p)} y={Y1 + 30} fill={MUTED} fontSize={17} textAnchor="middle">
          {p.toFixed(2)}
        </text>
      ))}
      <text x={X0 + 8} y={Y0 + 30} fill="var(--osd-accent)" fontSize={17} letterSpacing="0.08em">
        BIDS
      </text>
      <text
        x={X1 - 8}
        y={Y0 + 30}
        fill="var(--osd-text)"
        fontSize={17}
        letterSpacing="0.08em"
        textAnchor="end"
      >
        ASKS
      </text>
    </svg>
  );
};

const LadderRow = ({ y, i, side, t }: { y: number; i: number; side: 'bid' | 'ask'; t: number }) => {
  const s = side === 'ask' ? 1 : 0;
  const l = level(s, i, t);
  const price = (MID + (side === 'ask' ? 1 : -1) * (0.01 + i * 0.01)).toFixed(2);
  const w = Math.min(176, (l.size / 9000) * 176);
  const best = i === 0;
  const flash = l.size > l.prev ? 'rgba(86,208,139,0.32)' : 'rgba(255,90,78,0.32)';
  return (
    <div style={abs(0, y, { width: 704, height: 30 })}>
      <span
        style={abs(side === 'bid' ? 200 - w : 506, 6, {
          width: w,
          height: 18,
          background: side === 'bid' ? AMBER_SOFT : CREAM_SOFT,
          transition: 'width 160ms linear, left 160ms linear',
        })}
      />
      <span
        key={l.v}
        className={t > 0 ? 'mx-flash' : undefined}
        style={vars({
          ...abs(side === 'bid' ? 168 : 416, 2, { width: 120, height: 26 }),
          textAlign: side === 'bid' ? 'right' : 'left',
          padding: '0 6px',
          fontSize: 20,
          lineHeight: '26px',
          color: side === 'bid' ? 'var(--osd-accent)' : 'var(--osd-text)',
          '--flash': flash,
        })}
      >
        {l.size.toLocaleString('en-US')}
      </span>
      <span
        style={abs(292, 0, {
          width: 120,
          textAlign: 'center',
          fontSize: 22,
          lineHeight: '30px',
          fontWeight: best ? 600 : 400,
          color: best ? 'var(--osd-accent)' : 'var(--osd-text)',
          background: best ? 'rgba(255,178,26,0.1)' : 'transparent',
        })}
      >
        {price}
      </span>
    </div>
  );
};

const HEAT = [
  [48.2, 61.5, 22.4, 9.8, 6.1, 12.7],
  [21.3, 14.8, 18.9, 16.2, 8.4, 7.5],
  [17.6, 9.1, 12.3, 11.0, 3.9, 10.4],
];

const HeatTile = ({ r, c, t }: { r: number; c: number; t: number }) => {
  const period = 3 + Math.floor(rand(r * 13 + c) * 6);
  const v = Math.floor((t + Math.floor(rand(r * 7 + c * 3) * period)) / period);
  const val = HEAT[r][c] * (t === 0 ? 1 : 0.9 + 0.2 * rand(r * 1000 + c * 31 + v * 101));
  const a = 0.1 + Math.min(1, val / 62) * 0.75;
  return (
    <span
      key={v}
      className={t > 0 ? 'mx-flash' : undefined}
      style={vars({
        ...abs(110 + c * 96, 34 + r * 50, { width: 92, height: 46 }),
        background: `rgba(255,178,26,${a.toFixed(3)})`,
        color: a > 0.5 ? 'var(--osd-bg)' : 'var(--osd-text)',
        fontSize: 20,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '--flash': 'rgba(236,230,214,0.55)',
      })}
    >
      {val.toFixed(1)}
    </span>
  );
};

const DataStat = ({
  x,
  value,
  label,
  note,
}: {
  x: number;
  value: string;
  label: string;
  note: string;
}) => (
  <div style={abs(x, 474, { width: 230 })}>
    <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 60, lineHeight: 1 }}>
      <Odo value={value} dl={600 + (x - 32) * 0.6} du={1400} />
    </div>
    <div style={{ ...LABEL, color: MUTED, marginTop: 14 }}>{label}</div>
    <div style={{ fontSize: 20, color: UP, marginTop: 10 }}>{note}</div>
  </div>
);

const OrderBook: Page = () => {
  const live = useIsActivePage();
  const t = useTick(live, 240);
  return (
    <Stage
      fn="MBO"
      source="Data Cloud metrics as of 30 Sep 2026. ARR = annualised Sep recurring billings."
    >
      <Heading
        code="MBO"
        fn="Market-by-order depth · Marlow Data Cloud"
        title="Market data is our fastest-growing line: +21% a year."
      />
      <Panel
        x={M}
        y={264}
        w={998}
        h={688}
        title="Depth · HXN US — Hexon Corp"
        meta="±0.25 from mid · live"
      >
        <DepthChart t={t} />
        <div style={abs(32, 446, { width: 932, height: 1, background: LINE })} />
        <DataStat x={32} value="3,140" label="Subscribing firms" note="▲ 19% Y/Y" />
        <DataStat x={272} value="116%" label="Net rev. retention" note="▲ 4 PTS" />
        <DataStat x={512} value="$612M" label="Data Cloud ARR" note="▲ 31% Y/Y" />
        <DataStat x={752} value="482B" label="Msgs, peak day" note="▲ 2.3× FY24" />
      </Panel>
      <Panel x={1118} y={264} w={706} h={414} title="Ladder · top 5" meta="Shares" dl={200}>
        <div style={abs(0, 12, { ...LABEL, width: 704, height: 22, color: MUTED })}>
          <span style={abs(162, 0, { width: 120, textAlign: 'right' })}>Bid size</span>
          <span style={abs(292, 0, { width: 120, textAlign: 'center' })}>Price</span>
          <span style={abs(422, 0)}>Ask size</span>
        </div>
        <LadderRow y={44} i={4} side="ask" t={t} />
        <LadderRow y={74} i={3} side="ask" t={t} />
        <LadderRow y={104} i={2} side="ask" t={t} />
        <LadderRow y={134} i={1} side="ask" t={t} />
        <LadderRow y={164} i={0} side="ask" t={t} />
        <div style={abs(24, 200, { width: 656, height: 1, background: LINE })} />
        <LadderRow y={206} i={0} side="bid" t={t} />
        <LadderRow y={236} i={1} side="bid" t={t} />
        <LadderRow y={266} i={2} side="bid" t={t} />
        <LadderRow y={296} i={3} side="bid" t={t} />
        <LadderRow y={326} i={4} side="bid" t={t} />
      </Panel>
      <Panel
        x={1118}
        y={702}
        w={706}
        h={250}
        title="Usage · msgs/s by region"
        meta="Millions"
        dl={350}
      >
        <div style={abs(0, 8, { ...LABEL, width: 704, color: MUTED })}>
          <span style={abs(110, 0, { width: 92, textAlign: 'center' })}>EQ</span>
          <span style={abs(206, 0, { width: 92, textAlign: 'center' })}>OPT</span>
          <span style={abs(302, 0, { width: 92, textAlign: 'center' })}>FUT</span>
          <span style={abs(398, 0, { width: 92, textAlign: 'center' })}>FX</span>
          <span style={abs(494, 0, { width: 92, textAlign: 'center' })}>Rates</span>
          <span style={abs(590, 0, { width: 92, textAlign: 'center' })}>Crypto</span>
        </div>
        <div style={abs(24, 46, { ...LABEL, color: MUTED })}>AMER</div>
        <div style={abs(24, 96, { ...LABEL, color: MUTED })}>EMEA</div>
        <div style={abs(24, 146, { ...LABEL, color: MUTED })}>APAC</div>
        <HeatTile r={0} c={0} t={t} />
        <HeatTile r={0} c={1} t={t} />
        <HeatTile r={0} c={2} t={t} />
        <HeatTile r={0} c={3} t={t} />
        <HeatTile r={0} c={4} t={t} />
        <HeatTile r={0} c={5} t={t} />
        <HeatTile r={1} c={0} t={t} />
        <HeatTile r={1} c={1} t={t} />
        <HeatTile r={1} c={2} t={t} />
        <HeatTile r={1} c={3} t={t} />
        <HeatTile r={1} c={4} t={t} />
        <HeatTile r={1} c={5} t={t} />
        <HeatTile r={2} c={0} t={t} />
        <HeatTile r={2} c={1} t={t} />
        <HeatTile r={2} c={2} t={t} />
        <HeatTile r={2} c={3} t={t} />
        <HeatTile r={2} c={4} t={t} />
        <HeatTile r={2} c={5} t={t} />
      </Panel>
    </Stage>
  );
};

const BoardRow = ({
  y,
  text,
  row,
  amber = 0,
}: {
  y: number;
  text: string;
  row: number;
  amber?: number;
}) => (
  <div style={abs(M, y, { display: 'flex', gap: 10 })}>
    {[...text].map((c, i) => (
      <Flap
        key={i}
        to={c}
        n={7 + i * 2 + row * 3}
        st={58}
        dl={300 + row * 160 + i * 30}
        w={112}
        h={152}
        size={108}
        seed={row * 40 + i + 1}
        color={i < amber ? 'var(--osd-accent)' : 'var(--osd-text)'}
      />
    ))}
  </div>
);

const DepRow = ({
  y,
  time,
  code,
  name,
  status,
  state,
}: {
  y: number;
  time: string;
  code: string;
  name: string;
  status: string;
  state: 'done' | 'now' | 'next';
}) => (
  <div
    style={abs(0, y, {
      width: 558,
      height: 54,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 22,
      fontSize: 24,
      borderBottom: `1px solid ${LINE}`,
      background: state === 'now' ? 'rgba(255,178,26,0.08)' : 'transparent',
      color: state === 'done' ? MUTED : 'var(--osd-text)',
    })}
  >
    <span style={{ width: 84 }}>{time}</span>
    <span style={{ color: state === 'now' ? 'var(--osd-accent)' : undefined, width: 48 }}>
      {code}
    </span>
    <span>{name}</span>
    <span
      style={{
        marginLeft: 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        ...LABEL,
        fontSize: 18,
        color: state === 'now' ? 'var(--osd-accent)' : MUTED,
      }}
    >
      {state === 'now' && (
        <span
          className="mx-blink"
          style={{ width: 10, height: 10, background: 'var(--osd-accent)' }}
        />
      )}
      {status}
    </span>
  </div>
);

const Divider: Page = () => (
  <Stage fn="GRW" source="Session board · times Eastern.">
    <div style={abs(M, 286, { ...LABEL, display: 'flex', gap: 18 })}>
      <span style={{ color: 'var(--osd-accent)' }}>Section 02 of 03</span>
      <span style={{ color: MUTED }}>Departing 10:45 ET</span>
    </div>
    <BoardRow y={330} text="02 WHERE" row={0} amber={2} />
    <BoardRow y={496} text="WE GROW " row={1} />
    <p
      className="mx-pop"
      style={tm(
        1900,
        undefined,
        abs(M, 692, {
          margin: 0,
          width: 970,
          fontFamily: COND,
          fontWeight: 500,
          fontSize: 34,
          lineHeight: 1.3,
          color: MUTED,
        }),
      )}
    >
      Where the next <span style={{ color: 'var(--osd-text)' }}>$1.1B of net revenue</span> comes
      from:
      <br />
      data, clearing and listings.
    </p>
    <Panel x={1264} y={330} w={560} h={450} title="Session board" meta="Today" dl={400}>
      <DepRow y={0} time="09:30" code="01" name="The franchise" status="Done" state="done" />
      <DepRow y={54} time="10:45" code="02" name="Where we grow" status="Now" state="now" />
      <DepRow y={108} time="11:25" code="03" name="Targets & capital" status="11:25" state="next" />
      <DepRow y={162} time="12:00" code="Q&A" name="Open floor" status="12:00" state="next" />
      <div style={abs(24, 246)}>
        <Cap>Session progress</Cap>
      </div>
      <div style={abs(24, 282, { width: 510, height: 12, background: CELL })}>
        <span
          className="mx-gx"
          style={tm(700, 1200, {
            position: 'absolute',
            left: 0,
            top: 0,
            width: 255,
            height: 12,
            background: 'var(--osd-accent)',
            transformOrigin: '0 50%',
          })}
        />
        <span style={abs(391, -4, { width: 1, height: 20, background: MUTED })} />
        <span
          className="mx-blink"
          style={abs(251, -6, { width: 8, height: 24, background: 'var(--osd-text)' })}
        />
      </div>
      <div style={abs(24, 310, { ...LABEL, width: 510, height: 20, color: MUTED })}>
        <span style={abs(0, 0)}>09:30</span>
        <span style={abs(255, 0, { transform: 'translateX(-50%)', color: 'var(--osd-text)' })}>
          10:45
        </span>
        <span style={abs(391, 0, { transform: 'translateX(-50%)' })}>11:25</span>
        <span style={abs(510, 0, { transform: 'translateX(-100%)' })}>12:00</span>
      </div>
      <div
        style={abs(24, 366, {
          ...LABEL,
          color: MUTED,
          textTransform: 'none',
          letterSpacing: '0.02em',
        })}
      >
        Lunch on 41 follows Q&amp;A.
      </div>
    </Panel>
  </Stage>
);

const SubscriberLine = () => {
  const vals = [1900, 2450, 2800, 3140, 4000, 4950, 6000];
  const W = 502;
  const H = 170;
  const pts = vals.map((v, i) => [(i / 6) * (W - 20) + 10, H - (v / 6500) * H] as const);
  const solid = pts
    .slice(0, 4)
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const proj = pts
    .slice(3)
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  return (
    <svg width={W} height={H + 30} style={abs(28, 296, { overflow: 'visible' })}>
      <line x1={0} x2={W} y1={H} y2={H} stroke={LINE} />
      <line x1={0} x2={W} y1={H - (3000 / 6500) * H} y2={H - (3000 / 6500) * H} stroke={GRID} />
      <line x1={0} x2={W} y1={H - (6000 / 6500) * H} y2={H - (6000 / 6500) * H} stroke={GRID} />
      <path
        d={solid}
        pathLength={1}
        strokeDasharray="1"
        fill="none"
        stroke="var(--osd-accent)"
        strokeWidth={2.5}
        className="mx-draw"
        style={tm(350, 700)}
      />
      <path
        d={proj}
        fill="none"
        stroke="var(--osd-accent)"
        strokeWidth={2.5}
        strokeDasharray="6 6"
        className="mx-fade"
        style={tm(1000, 500)}
      />
      {pts.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 5}
          y={y - 5}
          width={10}
          height={10}
          fill={i <= 3 ? 'var(--osd-accent)' : PANEL}
          stroke="var(--osd-accent)"
          strokeWidth={2}
          className="mx-pop"
          style={tm(350 + i * 130)}
        />
      ))}
      <text
        x={pts[3][0]}
        y={pts[3][1] - 18}
        fill="var(--osd-text)"
        fontSize={17}
        textAnchor="middle"
      >
        3,140
      </text>
      <text
        x={pts[6][0]}
        y={pts[6][1] - 18}
        fill="var(--osd-accent)"
        fontSize={17}
        textAnchor="middle"
      >
        6,000
      </text>
      {['FY23', 'FY26', 'FY29'].map((l, k) => (
        <text key={l} x={pts[k * 3][0]} y={H + 28} fill={MUTED} fontSize={17} textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  );
};

const ClearingBars = () => {
  const data = [
    [0.45, 0],
    [0.47, 0.05],
    [0.49, 0.14],
    [0.51, 0.27],
  ];
  const H = 170;
  const k = H / 0.9;
  return (
    <svg width={502} height={H + 30} style={abs(28, 296, { overflow: 'visible' })}>
      <line x1={0} x2={502} y1={H} y2={H} stroke={LINE} />
      {data.map(([base, add], i) => {
        const x = 30 + i * 124;
        return (
          <g key={i}>
            <rect
              x={x}
              y={H - base * k}
              width={70}
              height={base * k}
              fill={CREAM_FILL}
              className="mx-gy"
              style={tm(350 + i * 120, 500, {
                transformBox: 'fill-box',
                transformOrigin: '50% 100%',
              })}
            />
            {add > 0 && (
              <rect
                x={x}
                y={H - (base + add) * k}
                width={70}
                height={add * k - 3}
                fill="var(--osd-accent)"
                className="mx-gy"
                style={tm(650 + i * 120, 420, {
                  transformBox: 'fill-box',
                  transformOrigin: '50% 100%',
                })}
              />
            )}
            <text
              x={x + 35}
              y={H - (base + add) * k - 12}
              fill={i === 3 ? 'var(--osd-accent)' : 'var(--osd-text)'}
              fontSize={17}
              textAnchor="middle"
              className="mx-fade"
              style={tm(900 + i * 120)}
            >
              {(base + add).toFixed(2)}
            </text>
            <text x={x + 35} y={H + 28} fill={MUTED} fontSize={17} textAnchor="middle">
              FY{26 + i}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const EtpColumn = ({
  x,
  n,
  year,
  proj,
  dl,
}: {
  x: number;
  n: number;
  year: string;
  proj?: boolean;
  dl: number;
}) => {
  const cells = Math.round(n / 10);
  return (
    <g>
      {Array.from({ length: cells }, (_, j) => {
        const col = j % 5;
        const row = Math.floor(j / 5);
        return (
          <rect
            key={j}
            x={x + col * 13}
            y={158 - row * 12}
            width={10}
            height={9}
            fill={proj ? AMBER_SOFT : 'var(--osd-accent)'}
            className="mx-on"
            style={tm(dl + j * 9)}
          />
        );
      })}
      <text
        x={x + 31}
        y={158 - Math.ceil(cells / 5) * 12 - 6}
        fill={proj ? MUTED : 'var(--osd-text)'}
        fontSize={17}
        textAnchor="middle"
        className="mx-fade"
        style={tm(dl + cells * 9)}
      >
        {n}
      </text>
      <text x={x + 31} y={198} fill={MUTED} fontSize={17} textAnchor="middle">
        {year}
      </text>
    </g>
  );
};

const EtpDots = () => (
  <svg width={502} height={200} style={abs(28, 296, { overflow: 'visible' })}>
    <line x1={0} x2={502} y1={170} y2={170} stroke={LINE} />
    <EtpColumn x={30} n={412} year="FY26" dl={350} />
    <EtpColumn x={154} n={480} year="FY27" proj dl={500} />
    <EtpColumn x={278} n={560} year="FY28" proj dl={650} />
    <EtpColumn x={402} n={650} year="FY29" proj dl={800} />
  </svg>
);

const Vector = ({
  x,
  code,
  title,
  add,
  facts,
  children,
}: {
  x: number;
  code: string;
  title: string;
  add: string;
  facts: [string, string, string];
  children: ReactNode;
}) => (
  <Panel x={x} y={264} w={560} h={688} title={`Vector ${code}`} meta="FY26E → FY29T" anim="mx-fold">
    <div style={abs(28, 26, { ...LABEL, color: 'var(--osd-accent)' })}>{code} / 3</div>
    <div style={abs(28, 54, { fontFamily: COND, fontWeight: 600, fontSize: 44, lineHeight: 1.1 })}>
      {title}
    </div>
    <div style={abs(24, 128, { fontFamily: COND, fontWeight: 700, fontSize: 100, lineHeight: 1 })}>
      <span style={{ color: 'var(--osd-accent)' }}>+</span>
      <Odo value={add} dl={200} du={1300} />
    </div>
    <div style={abs(28, 240)}>
      <Cap>Incremental net revenue by FY29</Cap>
    </div>
    {children}
    <div style={abs(28, 524, { width: 504 })}>
      <div
        className="mx-pop"
        style={tm(700, undefined, {
          fontFamily: COND,
          fontWeight: 500,
          fontSize: 28,
          lineHeight: 1.3,
        })}
      >
        <span style={{ color: 'var(--osd-accent)', marginRight: 12 }}>›</span>
        {facts[0]}
      </div>
      <div
        className="mx-pop"
        style={tm(800, undefined, {
          fontFamily: COND,
          fontWeight: 500,
          fontSize: 28,
          lineHeight: 1.3,
        })}
      >
        <span style={{ color: 'var(--osd-accent)', marginRight: 12 }}>›</span>
        {facts[1]}
      </div>
      <div
        className="mx-pop"
        style={tm(900, undefined, {
          fontFamily: COND,
          fontWeight: 500,
          fontSize: 28,
          lineHeight: 1.3,
        })}
      >
        <span style={{ color: 'var(--osd-accent)', marginRight: 12 }}>›</span>
        {facts[2]}
      </div>
    </div>
  </Panel>
);

const Growth: Page = () => (
  <Stage fn="GRW" source="FY29T = management targets, not guidance. Incremental vs FY26E run-rate.">
    <Heading
      code="GRW"
      fn="Growth vectors · incremental net revenue, FY26E → FY29T"
      title="Three vectors add $1.1B of net revenue by 2029."
    />
    <Steps>
      <Step>
        <Vector
          x={M}
          code="V1"
          title="Data & analytics"
          add="$520M"
          facts={[
            'Subscribers 3,140 → 6,000 firms',
            'Cloud delivery in three regions',
            'Priced per feed, not per screen',
          ]}
        >
          <SubscriberLine />
        </Vector>
      </Step>
      <Step>
        <Vector
          x={680}
          code="V2"
          title="Multi-asset clearing"
          add="$330M"
          facts={[
            'Treasury clearing mandate, 2027',
            'Crypto futures under our DCO',
            'Cross-margin across four assets',
          ]}
        >
          <ClearingBars />
        </Vector>
      </Step>
      <Step>
        <Vector
          x={1264}
          code="V3"
          title="Listings & indices"
          add="$250M"
          facts={[
            'ETP listings 412 → 650',
            'MX index licences to $90B AUM',
            '38 transfers in, zero out, FY26',
          ]}
        >
          <EtpDots />
        </Vector>
      </Step>
    </Steps>
  </Stage>
);

type LL = [number, number];

const LAND: LL[][] = [
  [
    [-166, 68],
    [-160, 71],
    [-150, 71],
    [-140, 70],
    [-128, 70],
    [-117, 69],
    [-108, 68],
    [-97, 68],
    [-94, 72],
    [-86, 70],
    [-82, 66],
    [-88, 64],
    [-94, 60],
    [-93, 57],
    [-87, 55.5],
    [-82, 53],
    [-79, 55],
    [-77, 60],
    [-78, 62.5],
    [-73, 62],
    [-69, 59],
    [-64, 60],
    [-61, 56],
    [-56, 52],
    [-60, 47],
    [-66, 45],
    [-70, 42],
    [-74, 40.5],
    [-76, 37],
    [-75.5, 35],
    [-81, 31],
    [-80, 26],
    [-81.5, 25],
    [-83, 29.5],
    [-89, 30],
    [-94, 29.5],
    [-97, 26],
    [-97.5, 22],
    [-95, 19],
    [-91, 19],
    [-90, 21.5],
    [-87, 21.5],
    [-88, 16],
    [-84, 15.5],
    [-83, 10],
    [-79.5, 9],
    [-77.5, 8],
    [-80, 7.5],
    [-85, 10],
    [-87, 13],
    [-92, 14.5],
    [-96, 15.7],
    [-105, 19.5],
    [-106, 23],
    [-110, 24.5],
    [-112.5, 29.5],
    [-114.5, 31],
    [-117, 32.5],
    [-121, 34.5],
    [-124, 40],
    [-124.5, 48],
    [-128, 51],
    [-133, 55],
    [-140, 59.5],
    [-147, 61],
    [-152, 59],
    [-158, 57],
    [-162, 55],
    [-158, 58.5],
    [-162, 59.5],
    [-165, 62],
    [-165, 64.5],
    [-168, 66],
  ],
  [
    [-73, 78],
    [-60, 82],
    [-30, 83.5],
    [-20, 81],
    [-18, 76],
    [-22, 70],
    [-32, 68],
    [-40, 65],
    [-43, 60],
    [-48, 61],
    [-52, 65],
    [-54, 69],
    [-58, 75],
    [-66, 76.5],
  ],
  [
    [-80, 73],
    [-72, 71],
    [-62, 67],
    [-64, 64],
    [-70, 62.5],
    [-74, 64.5],
    [-78, 64.5],
    [-83, 66],
    [-90, 70],
    [-86, 73.5],
  ],
  [
    [-120, 72],
    [-110, 73],
    [-100, 74],
    [-95, 75],
    [-90, 77],
    [-80, 80],
    [-65, 82.5],
    [-90, 82],
    [-105, 79],
    [-118, 76],
    [-125, 74],
  ],
  [
    [-85, 21.8],
    [-82, 23.2],
    [-77, 22.3],
    [-74.2, 20.2],
    [-77.5, 19.8],
    [-80, 21.7],
    [-82, 22.2],
  ],
  [
    [-74.5, 19.8],
    [-72.5, 19.9],
    [-68.5, 18.8],
    [-68.5, 18.2],
    [-71, 17.8],
    [-74.4, 18.3],
  ],
  [
    [-77.5, 8],
    [-72, 12],
    [-64, 10.5],
    [-60, 8.5],
    [-52, 5],
    [-50, 0],
    [-44, -2.5],
    [-35, -5.5],
    [-35, -9],
    [-39, -13],
    [-39, -18],
    [-41, -22],
    [-45, -23.5],
    [-48.5, -26],
    [-49, -29],
    [-53, -34],
    [-58, -34.5],
    [-57, -37],
    [-62, -39],
    [-65, -41],
    [-63.5, -42.5],
    [-65.5, -45],
    [-67.5, -46.5],
    [-66, -48],
    [-69, -51],
    [-68.5, -52.5],
    [-70, -55],
    [-74, -52],
    [-75.5, -47],
    [-73.5, -42],
    [-73.5, -37],
    [-71.5, -30],
    [-70.5, -23],
    [-70.3, -18],
    [-75, -15.5],
    [-77, -12],
    [-79.5, -7.5],
    [-81.2, -5],
    [-80, -2],
    [-80, 1],
    [-78.5, 2.5],
    [-77.5, 4],
    [-77.3, 7],
  ],
  [
    [-24, 64],
    [-22, 66.4],
    [-16, 66.5],
    [-13.5, 65],
    [-18, 63.4],
  ],
  [
    [-5.7, 50],
    [1.5, 51],
    [1.7, 52.7],
    [0, 53.5],
    [-1.5, 55],
    [-2, 57],
    [-3.5, 58.6],
    [-5, 58.6],
    [-6.2, 57.5],
    [-5.5, 55.5],
    [-4.8, 54.8],
    [-3, 54],
    [-4.7, 52.8],
    [-5.2, 51.7],
    [-3.3, 51.4],
  ],
  [
    [-6, 52],
    [-6, 54.5],
    [-7.5, 55.3],
    [-10, 54],
    [-10.4, 52],
    [-8, 51.5],
  ],
  [
    [-9.5, 37],
    [-9, 43],
    [-1.5, 43.5],
    [-1.5, 46.5],
    [-4.5, 48],
    [-1.5, 49.5],
    [2, 51],
    [4.5, 53],
    [8, 54],
    [8.5, 57],
    [10.5, 57.5],
    [10.5, 54.5],
    [14, 54],
    [19, 54.5],
    [21, 57],
    [24, 57.5],
    [23.5, 59.5],
    [28, 60],
    [22.5, 60.5],
    [21.5, 63.5],
    [25.5, 65],
    [21.5, 65.8],
    [17.5, 62.5],
    [18.5, 60],
    [16.5, 57],
    [12.5, 56],
    [10.7, 59],
    [8, 58],
    [5, 59],
    [5, 62],
    [10, 64],
    [14, 67],
    [19, 70],
    [25, 71],
    [31, 70],
    [33, 69],
    [41, 67],
    [38, 66],
    [34.5, 66],
    [37, 64.5],
    [44, 66],
    [43.5, 68.5],
    [53, 68.5],
    [60, 69],
    [68, 69],
    [66, 71],
    [69, 73],
    [73, 72.5],
    [72, 68],
    [80, 72.5],
    [87, 74],
    [100, 76],
    [105, 77.5],
    [113, 73.5],
    [126, 73.5],
    [131, 71],
    [140, 72.5],
    [150, 71.5],
    [160, 70],
    [170, 70],
    [180, 69],
    [180, 65],
    [178, 64.5],
    [177, 62.5],
    [171, 60],
    [163, 58],
    [162, 56],
    [156, 51],
    [156, 57.5],
    [163, 62],
    [160, 61.5],
    [154, 59],
    [143, 59.5],
    [137, 54],
    [141, 52.5],
    [140, 48],
    [135, 43.5],
    [131, 42.5],
    [129.5, 40],
    [129, 35.5],
    [126.5, 34.5],
    [126, 37.5],
    [125, 39.5],
    [121.5, 40],
    [118, 39],
    [121.5, 37],
    [119, 35],
    [121.5, 32],
    [122, 29.5],
    [119.5, 26],
    [116.5, 23],
    [110.5, 21],
    [108, 21.5],
    [106, 19],
    [108.5, 15],
    [109, 11.5],
    [105, 8.6],
    [103, 10.5],
    [100, 13.5],
    [99, 10],
    [102, 6],
    [103.5, 1.3],
    [101, 3],
    [98.5, 8],
    [98.5, 13],
    [97.5, 16.5],
    [94.5, 16],
    [94, 19],
    [92, 21.5],
    [90, 22],
    [87, 21.5],
    [85, 19.5],
    [80, 15.5],
    [80, 10],
    [77.5, 8],
    [76, 10],
    [73, 17],
    [72.5, 21],
    [69, 22.5],
    [66.5, 25.5],
    [61.5, 25.2],
    [57, 25.8],
    [56, 27],
    [52, 27.8],
    [50, 30],
    [48, 30],
    [50, 26.5],
    [51.5, 24],
    [54, 24],
    [56.4, 26.4],
    [57.5, 23.5],
    [59.8, 22.4],
    [57, 18.8],
    [55, 17],
    [52, 16],
    [48.5, 14],
    [45, 12.8],
    [43.3, 12.7],
    [42.8, 15],
    [39, 21],
    [35, 28],
    [34, 28.5],
    [32.5, 30],
    [32.3, 31.3],
    [34.9, 32.5],
    [35.9, 35.5],
    [36.2, 36.6],
    [34, 36.3],
    [30.5, 36.3],
    [27.3, 37],
    [26.3, 39.5],
    [26.5, 40.5],
    [23, 40.3],
    [23, 39],
    [22.5, 37],
    [21.5, 36.8],
    [21.1, 38.3],
    [19.5, 40],
    [19.5, 41.8],
    [18.5, 42.5],
    [16, 43.5],
    [13.7, 45.5],
    [12.3, 45.3],
    [12.4, 44],
    [14, 42],
    [16, 41.4],
    [18.5, 40.2],
    [16.5, 39],
    [16, 38],
    [15.7, 40],
    [14, 40.8],
    [12, 41.8],
    [10.5, 43],
    [8.8, 44.4],
    [7, 43.6],
    [4, 43.5],
    [3.2, 41.9],
    [0.8, 41],
    [-0.5, 39],
    [0, 38.6],
    [-2, 36.8],
    [-5.5, 36],
    [-6.5, 36.9],
    [-7.5, 37.2],
  ],
  [
    [52, 71],
    [55, 73.5],
    [60, 76.5],
    [68, 77],
    [57, 74.5],
    [56, 71],
  ],
  [
    [-17, 21],
    [-17, 15],
    [-16.8, 13],
    [-15, 11],
    [-13, 8],
    [-10, 6],
    [-7.5, 4.3],
    [-4, 5.2],
    [1, 6],
    [4.5, 6.3],
    [8.5, 4.5],
    [9.5, 3.8],
    [9.8, 1],
    [9, -1],
    [11.8, -4.5],
    [13, -8.5],
    [13.5, -12],
    [11.8, -17],
    [14.5, -22.5],
    [15, -26.5],
    [17, -29],
    [18.5, -34],
    [20, -34.8],
    [25.5, -34],
    [28, -33],
    [31, -29.5],
    [33, -26],
    [35.5, -24],
    [35.3, -22],
    [35, -20],
    [37, -17.5],
    [40.5, -15.3],
    [40.5, -11],
    [39.5, -7],
    [39, -5],
    [41, -2],
    [43, 0],
    [46, 2],
    [49, 6],
    [51.2, 10.5],
    [51, 12],
    [49, 11.3],
    [45, 10.5],
    [43.3, 11.6],
    [42.5, 13.5],
    [39.5, 15.5],
    [38.5, 18],
    [37.2, 21],
    [36.8, 22],
    [35.5, 24],
    [34, 26.5],
    [32.5, 29.8],
    [32.3, 31.3],
    [29, 30.8],
    [25, 31.6],
    [20, 30.9],
    [19.8, 32],
    [15, 32.3],
    [11, 33.3],
    [10.3, 36.8],
    [9, 37.2],
    [3, 36.8],
    [-1, 35.5],
    [-5.5, 35.8],
    [-6.5, 34],
    [-9.8, 30.8],
    [-9.6, 29],
    [-13, 27.5],
    [-14.8, 25],
  ],
  [
    [44, -25],
    [47, -25],
    [50.5, -15.5],
    [49.5, -12],
    [48, -13.5],
    [44.3, -17],
    [43.5, -22],
  ],
  [
    [129.7, 33],
    [131, 31.3],
    [132, 33.8],
    [135, 33.5],
    [136.8, 34.3],
    [139.8, 35],
    [140.8, 36.5],
    [141, 38.5],
    [142, 40],
    [141.3, 41.4],
    [140, 40.6],
    [140, 39],
    [139, 38],
    [137, 37],
    [136, 35.6],
    [133, 35.5],
    [131, 34.4],
  ],
  [
    [140, 41.5],
    [141.5, 45.3],
    [145.3, 44],
    [143.2, 42],
    [141, 42.2],
  ],
  [
    [120, 18.5],
    [122.3, 18.5],
    [122, 16],
    [124, 13],
    [123.5, 12.5],
    [121, 13.8],
    [120.5, 15],
    [119.8, 16.5],
  ],
  [
    [122, 7],
    [125.5, 9.8],
    [126.5, 7],
    [125.5, 5.8],
    [124, 6.5],
  ],
  [
    [109, 1.5],
    [110, -1.5],
    [110.5, -3],
    [114.5, -4],
    [116.5, -3.5],
    [117.5, 0.5],
    [119, 1],
    [117.5, 4],
    [119, 5.3],
    [117, 7],
    [116, 6],
    [113, 3.2],
    [111, 2],
    [109.6, 2],
  ],
  [
    [95.2, 5.6],
    [97.5, 5.2],
    [100.5, 2],
    [104, -1],
    [106, -3],
    [106, -5.8],
    [104.5, -5.8],
    [102, -4],
    [100, -1],
    [98.5, 1.5],
    [96, 3.8],
  ],
  [
    [105.5, -6.8],
    [108, -6.3],
    [111, -6.4],
    [114.5, -7.6],
    [114.5, -8.7],
    [111, -8.2],
    [108, -7.8],
    [106, -7.5],
  ],
  [
    [119.5, -5.5],
    [120.5, -2.5],
    [120, 0.8],
    [124.5, 1.3],
    [121.5, -1],
    [123.3, -5.3],
    [121, -4.5],
  ],
  [
    [131, -1],
    [134, -0.8],
    [138, -1.6],
    [141, -2.6],
    [145.5, -4.5],
    [147.5, -6],
    [147.8, -8],
    [150, -10.5],
    [146, -8.8],
    [143.5, -9],
    [141, -9.1],
    [138, -8.3],
    [137.5, -5],
    [134.5, -4],
    [132, -2.8],
  ],
  [
    [113.5, -22],
    [114, -26.5],
    [115, -34],
    [117.5, -35],
    [123, -34],
    [126, -32.3],
    [131, -31.5],
    [134, -32.8],
    [135.8, -34.8],
    [137.8, -32.8],
    [138, -35.5],
    [140, -38],
    [144, -38.3],
    [146.5, -39],
    [150, -37.5],
    [151.3, -33.8],
    [153.5, -28.5],
    [153, -25],
    [150.5, -22.5],
    [149, -20.5],
    [146, -18.8],
    [145.3, -15],
    [143.5, -14],
    [142.5, -10.7],
    [141.6, -13],
    [141.5, -16.5],
    [140.5, -17.5],
    [139, -17],
    [136, -15.2],
    [136.8, -12.3],
    [132.5, -11.3],
    [130, -12.2],
    [129.5, -15],
    [127.5, -14],
    [125, -14.5],
    [122.2, -17],
    [121, -19.5],
    [117, -20.7],
    [114.5, -21.6],
  ],
  [
    [145, -41],
    [148.3, -41],
    [148, -43.2],
    [146, -43.5],
  ],
  [
    [172.7, -34.5],
    [174.5, -36],
    [176, -37.6],
    [178.5, -37.7],
    [177, -39.5],
    [175, -41.5],
    [173.7, -39],
    [174.6, -37],
  ],
  [
    [172.7, -40.5],
    [174.3, -41.7],
    [173, -43.7],
    [171.2, -44.5],
    [169, -46.6],
    [166.5, -46],
    [168, -44],
    [171, -42],
  ],
];

const WATER: LL[][] = [
  [
    [28, 41.5],
    [28, 43.5],
    [29.8, 45.5],
    [33, 46],
    [36, 45.2],
    [38, 47],
    [39.5, 47],
    [38, 45],
    [40, 43.4],
    [41.6, 41.6],
    [38, 41],
    [35, 42],
    [31, 41.2],
  ],
  [
    [47, 44.5],
    [49.5, 46.5],
    [53, 47],
    [53, 45],
    [51, 44.3],
    [52.8, 41.5],
    [54, 37.5],
    [50, 37],
    [49, 38.5],
    [49.5, 40.5],
    [48, 42],
  ],
];

const inPoly = (x: number, y: number, poly: LL[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

const MAP_W = 1240;
const MAP_H = 468;
const mx = (lon: number) => ((lon + 170) / 360) * MAP_W;
const my = (lat: number) => ((80 - lat) / 136) * MAP_H;

let dotCache: string | null = null;
const mapDots = () => {
  if (dotCache) return dotCache;
  const parts: string[] = [];
  for (let lat = 78.75; lat > -56; lat -= 2.5) {
    for (let lon = -168.75; lon < 190; lon += 2.5) {
      const L = lon > 180 ? lon - 360 : lon;
      if (LAND.some((p) => inPoly(L, lat, p)) && !WATER.some((p) => inPoly(L, lat, p))) {
        parts.push(`M${(mx(lon) - 2).toFixed(1)} ${(my(lat) - 2).toFixed(1)}h4.2v4.2h-4.2z`);
      }
    }
  }
  dotCache = parts.join('');
  return dotCache;
};

type Site = { id: string; lon: number; lat: number };
const SITES: Record<string, Site> = {
  NY4: { id: 'NY4', lon: -74.1, lat: 40.8 },
  CH2: { id: 'CH2', lon: -88.3, lat: 41.8 },
  TR1: { id: 'TR1', lon: -79.4, lat: 43.7 },
  DC3: { id: 'DC3', lon: -77.5, lat: 39 },
  SP2: { id: 'SP2', lon: -46.6, lat: -23.5 },
  LD4: { id: 'LD4', lon: -0.6, lat: 51.5 },
  FR2: { id: 'FR2', lon: 8.7, lat: 50.1 },
  AM3: { id: 'AM3', lon: 4.9, lat: 52.4 },
  DX1: { id: 'DX1', lon: 55.3, lat: 25.2 },
  MB2: { id: 'MB2', lon: 72.9, lat: 19.1 },
  SG1: { id: 'SG1', lon: 103.8, lat: 1.35 },
  HK1: { id: 'HK1', lon: 114.2, lat: 22.3 },
  TY3: { id: 'TY3', lon: 139.7, lat: 35.7 },
  SY1: { id: 'SY1', lon: 151.2, lat: -33.9 },
};

const routePath = (a: string, b: string) => {
  const A = SITES[a];
  const B = SITES[b];
  const ax = mx(A.lon);
  const ay = my(A.lat);
  const bx = mx(B.lon);
  const by = my(B.lat);
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  const lift = Math.min(90, len * 0.2);
  const nx = dy / len;
  const ny = -dx / len;
  const flip = ny > 0 ? -1 : 1;
  const cx = (ax + bx) / 2 + nx * lift * flip;
  const cy = (ay + by) / 2 + ny * lift * flip;
  return `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
};

const Route = ({ a, b, dl }: { a: string; b: string; dl: number }) => {
  const live = useIsActivePage();
  const d = routePath(a, b);
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke={AMBER_SOFT}
        strokeWidth={2}
        pathLength={1}
        strokeDasharray="1"
        className="mx-draw"
        style={tm(dl, 700)}
      />
      {live && (
        <path
          d={d}
          fill="none"
          stroke="var(--osd-accent)"
          strokeWidth={4}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.03 2"
          className="mx-packet"
          style={tm(dl + 700, 1600 + rand(a.length * 31 + b.charCodeAt(0)) * 900)}
        />
      )}
    </>
  );
};

const Node = ({
  id,
  engine,
  label,
  dx = 12,
  dy = 6,
  anchor = 'start',
  dl,
}: {
  id: string;
  engine?: boolean;
  label?: boolean;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'end' | 'middle';
  dl: number;
}) => {
  const s = SITES[id];
  const x = mx(s.lon);
  const y = my(s.lat);
  const r = engine ? 7 : 4;
  return (
    <g className="mx-pop" style={tm(dl)}>
      {engine && (
        <rect
          x={x - r}
          y={y - r}
          width={r * 2}
          height={r * 2}
          fill="none"
          stroke="var(--osd-accent)"
          strokeWidth={1.5}
          className="mx-ping"
          style={tm(dl + 400, undefined, { transformBox: 'fill-box', transformOrigin: '50% 50%' })}
        />
      )}
      <rect
        x={x - r}
        y={y - r}
        width={r * 2}
        height={r * 2}
        fill={engine ? 'var(--osd-accent)' : 'var(--osd-text)'}
        stroke="var(--osd-bg)"
        strokeWidth={2}
      />
      {label && (
        <text
          x={x + dx}
          y={y + dy}
          textAnchor={anchor}
          fontSize={17}
          fontWeight={engine ? 600 : 500}
          fill={engine ? 'var(--osd-accent)' : 'var(--osd-text)'}
          stroke="var(--osd-bg)"
          strokeWidth={5}
          paintOrder="stroke"
        >
          {id}
        </text>
      )}
    </g>
  );
};

const WorldMap = () => {
  const live = useIsActivePage();
  return (
    <div style={abs(24, 22, { width: MAP_W, height: MAP_H })}>
      <svg
        width={MAP_W}
        height={MAP_H}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <path
          d={mapDots()}
          fill="rgba(236,230,214,0.2)"
          className="mx-wipe"
          style={tm(200, 1300)}
        />
        <Route a="NY4" b="CH2" dl={1300} />
        <Route a="NY4" b="SP2" dl={1450} />
        <Route a="NY4" b="LD4" dl={1400} />
        <Route a="LD4" b="FR2" dl={1600} />
        <Route a="FR2" b="DX1" dl={1700} />
        <Route a="DX1" b="MB2" dl={1850} />
        <Route a="MB2" b="SG1" dl={1950} />
        <Route a="SG1" b="HK1" dl={2050} />
        <Route a="HK1" b="TY3" dl={2150} />
        <Route a="SG1" b="SY1" dl={2150} />
        <Node id="CH2" label dx={-12} anchor="end" dl={600} />
        <Node id="TR1" dl={620} />
        <Node id="DC3" dl={640} />
        <Node id="NY4" engine label dx={14} dy={20} dl={660} />
        <Node id="SP2" label dl={720} />
        <Node id="LD4" engine label dx={-14} anchor="end" dl={900} />
        <Node id="AM3" dl={920} />
        <Node id="FR2" label dx={12} dy={20} dl={940} />
        <Node id="DX1" label dx={-10} dy={22} anchor="end" dl={1020} />
        <Node id="MB2" label dx={0} dy={28} anchor="middle" dl={1060} />
        <Node id="SG1" engine label dx={0} dy={32} anchor="middle" dl={1120} />
        <Node id="HK1" label dl={1160} />
        <Node id="TY3" label dl={1200} />
        <Node id="SY1" label dl={1240} />
      </svg>
      {live && (
        <div
          className="mx-scan"
          style={tm(200, 1300, {
            ...vars({ '--to': `${MAP_W}px` }),
            position: 'absolute',
            left: 0,
            top: -6,
            width: 2,
            height: MAP_H + 12,
            background: 'var(--osd-accent)',
            boxShadow: '0 0 18px 2px rgba(255,178,26,0.55)',
            opacity: 0,
          })}
        />
      )}
    </div>
  );
};

const Legend = ({ x, swatch, label }: { x: number; swatch: ReactNode; label: string }) => (
  <div
    style={abs(x, 520, { display: 'flex', alignItems: 'center', gap: 12, ...LABEL, color: MUTED })}
  >
    {swatch}
    {label}
  </div>
);

const RouteStat = ({ x, pair, ms }: { x: number; pair: string; ms: string }) => (
  <div style={abs(x, 566)}>
    <Cap>{pair}</Cap>
    <div style={{ fontSize: 26, fontWeight: 500, marginTop: 6 }}>{ms}</div>
  </div>
);

const FootStat = ({
  y,
  value,
  label,
  dl,
}: {
  y: number;
  value: string;
  label: string;
  dl: number;
}) => (
  <div style={abs(24, y)}>
    <div style={{ fontFamily: COND, fontWeight: 700, fontSize: 64, lineHeight: 1 }}>
      <Odo value={value} dl={dl} du={1300} />
    </div>
    <div style={{ ...LABEL, color: MUTED, marginTop: 10 }}>{label}</div>
  </div>
);

const Footprint: Page = () => (
  <Stage fn="MAP" source="Round-trip times on Marlow private routes, Sep 2026 median.">
    <Heading
      code="MAP"
      fn="Network map · colocation sites and private routes"
      title="14 data centres, 61 countries, one matching fabric."
    />
    <Panel x={M} y={264} w={1290} h={688} title="Network · sites & routes" meta="Dot = 2.5°">
      <WorldMap />
      <Legend
        x={24}
        swatch={<span style={{ width: 14, height: 14, background: 'var(--osd-accent)' }} />}
        label="Matching engine"
      />
      <Legend
        x={300}
        swatch={<span style={{ width: 9, height: 9, background: 'var(--osd-text)' }} />}
        label="Colocation site"
      />
      <Legend
        x={570}
        swatch={<span style={{ width: 34, height: 2, background: AMBER_SOFT }} />}
        label="Private route"
      />
      <Legend
        x={840}
        swatch={<span style={{ width: 14, height: 4, background: 'var(--osd-accent)' }} />}
        label="Live packet"
      />
      <div style={abs(24, 552, { width: 1240, height: 1, background: LINE })} />
      <RouteStat x={24} pair="NY4 ↔ LD4" ms="59.6 ms" />
      <RouteStat x={334} pair="LD4 ↔ FR2" ms="4.2 ms" />
      <RouteStat x={644} pair="NY4 ↔ CH2" ms="7.9 ms" />
      <RouteStat x={954} pair="SG1 ↔ HK1" ms="31.8 ms" />
    </Panel>
    <Panel x={1410} y={264} w={414} h={688} title="Footprint · FY26" dl={200}>
      <FootStat y={28} value="3" label="Matching engines" dl={500} />
      <FootStat y={150} value="14" label="Colocation sites" dl={600} />
      <FootStat y={272} value="61" label="Countries, direct access" dl={700} />
      <FootStat y={394} value="2,480" label="Cross-connects" dl={800} />
      <FootStat y={516} value="99.998%" label="Matching uptime" dl={900} />
    </Panel>
  </Stage>
);

const T_CELL_W = 38;
const T_CELL_H = 60;
const T_RIGHT = 948;

const BlankCells = ({ y, n }: { y: number; n: number }) => (
  <div style={abs(T_RIGHT - n * (T_CELL_W + 4) + 4, y + 18, { display: 'flex', gap: 4 })}>
    {Array.from({ length: n }, (_, i) => (
      <Flap key={i} to=" " w={T_CELL_W} h={T_CELL_H} size={40} />
    ))}
  </div>
);

const TargetRow = ({
  y,
  code,
  metric,
  sub,
  actual,
}: {
  y: number;
  code: string;
  metric: string;
  sub: string;
  actual: string;
}) => (
  <>
    <div style={abs(0, y + 95, { width: 1142, height: 1, background: LINE })} />
    <div style={abs(24, y + 38, { ...LABEL, color: MUTED })}>{code}</div>
    <div
      style={abs(76, y + 16, { fontFamily: COND, fontWeight: 500, fontSize: 34, lineHeight: 1.1 })}
    >
      {metric}
    </div>
    <div style={abs(76, y + 58, { ...LABEL, color: MUTED })}>{sub}</div>
    <div
      style={abs(420, y + 26, {
        width: 220,
        textAlign: 'right',
        fontSize: 36,
        fontWeight: 500,
        color: MUTED,
      })}
    >
      {actual}
    </div>
    <BlankCells y={y} n={actual.length} />
  </>
);

const TargetValue = ({
  y,
  from,
  to,
  change,
  note,
  seed,
}: {
  y: number;
  from: string;
  to: string;
  change: string;
  note: string;
  seed: number;
}) => (
  <>
    <div style={abs(T_RIGHT - to.length * (T_CELL_W + 4) + 4, y + 18, { display: 'flex', gap: 4 })}>
      {[...to].map((c, i) => (
        <Flap
          key={i}
          to={c}
          from={from[i]}
          n={6 + i * 2}
          st={55}
          dl={120 + i * 40}
          w={T_CELL_W}
          h={T_CELL_H}
          size={40}
          color="var(--osd-accent)"
          seed={seed * 10 + i}
        />
      ))}
    </div>
    <div className="mx-pop" style={tm(700, undefined, abs(982, y + 22))}>
      <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--osd-text)' }}>{change}</div>
      <div style={{ ...LABEL, color: MUTED, marginTop: 4 }}>{note}</div>
    </div>
  </>
);

const Assume = ({ y, children, dl }: { y: number; children: string; dl: number }) => (
  <div
    className="mx-pop"
    style={tm(
      dl,
      undefined,
      abs(28, y, {
        fontFamily: COND,
        fontWeight: 500,
        fontSize: 30,
        lineHeight: 1.2,
        display: 'flex',
        gap: 14,
      }),
    )}
  >
    <span style={{ color: 'var(--osd-accent)' }}>›</span>
    {children}
  </div>
);

const Targets: Page = () => (
  <Stage
    fn="TGT"
    source="FY29 targets assume no M&A and constant FY26 FX. Adj. EPS excludes amortisation."
  >
    <Heading
      code="TGT"
      fn="Medium-term targets · FY2026E → FY2029"
      title="By 2029: $4.1B of net revenue, 62% recurring."
    />
    <Panel x={M} y={264} w={1144} h={688} title="Targets · FY29" meta="Management targets">
      <div style={abs(0, 14, { ...LABEL, width: 1142, color: MUTED })}>
        <span style={abs(24, 0)}>#</span>
        <span style={abs(76, 0)}>Metric</span>
        <span style={abs(420, 0, { width: 220, textAlign: 'right' })}>FY26E</span>
        <span style={abs(700, 0, { width: 248, textAlign: 'right' })}>FY29 target</span>
        <span style={abs(982, 0)}>Change</span>
      </div>
      <div style={abs(0, 50, { width: 1142, height: 1, background: LINE })} />
      <TargetRow y={52} code="01" metric="Net revenue" sub="USD" actual="$2.84B" />
      <TargetRow y={148} code="02" metric="Recurring share" sub="Of net revenue" actual="54%" />
      <TargetRow y={244} code="03" metric="Adj. EBITDA margin" sub="Of net revenue" actual="61%" />
      <TargetRow y={340} code="04" metric="Adj. EPS" sub="USD, diluted" actual="$5.92" />
      <TargetRow
        y={436}
        code="05"
        metric="Average daily volume"
        sub="Notional, USD"
        actual="$41.2B"
      />
      <TargetRow y={532} code="06" metric="Median latency" sub="Order-to-ack" actual="38µs" />
      <Steps>
        <Step>
          <TargetValue y={52} from="$2.84B" to="$4.10B" change="+13%" note="CAGR" seed={1} />
        </Step>
        <Step>
          <TargetValue y={148} from="54%" to="62%" change="+8 pts" note="Mix shift" seed={2} />
        </Step>
        <Step>
          <TargetValue y={244} from="61%" to="64%" change="+3 pts" note="Op. leverage" seed={3} />
        </Step>
        <Step>
          <TargetValue y={340} from="$5.92" to="$9.40" change="+17%" note="CAGR" seed={4} />
        </Step>
        <Step>
          <TargetValue y={436} from="$41.2B" to="$58.0B" change="+12%" note="CAGR" seed={5} />
        </Step>
        <Step>
          <TargetValue y={532} from="38µs" to="25µs" change="−34%" note="New engine" seed={6} />
        </Step>
      </Steps>
    </Panel>
    <Panel x={1264} y={264} w={560} h={688} title="Assumptions" meta="Plan basis" dl={200}>
      <Assume y={32} dl={500}>
        US equity volumes +4% a year
      </Assume>
      <Assume y={96} dl={580}>
        No acquisitions in the plan
      </Assume>
      <Assume y={160} dl={660}>
        FX held at FY26 average rates
      </Assume>
      <Assume y={224} dl={740}>
        Capex 6–7% of net revenue
      </Assume>
      <Assume y={288} dl={820}>
        Adjusted tax rate 23–24%
      </Assume>
      <Assume y={352} dl={900}>
        Buybacks executed at $185
      </Assume>
      <div style={abs(28, 448, { width: 502, height: 1, background: LINE })} />
      <div style={abs(28, 472)}>
        <Cap>Next checkpoint</Cap>
        <div
          style={{
            fontFamily: COND,
            fontWeight: 600,
            fontSize: 34,
            lineHeight: 1.2,
            marginTop: 10,
          }}
        >
          FY26 results · 28 Jan 2027
        </div>
        <div
          style={{
            ...LABEL,
            color: MUTED,
            marginTop: 12,
            textTransform: 'none',
            letterSpacing: '0.02em',
          }}
        >
          Targets re-based annually, never mid-year.
        </div>
      </div>
    </Panel>
  </Stage>
);

const WF_BASE = 540;
const WF_K = 76;
const wfX = (i: number) => 24 + i * 218.8 + 39.4;

const WfBar = ({
  i,
  top,
  bottom,
  fill,
  outline,
  down,
  value,
  name,
  note,
  dl,
}: {
  i: number;
  top: number;
  bottom: number;
  fill: string;
  outline?: boolean;
  down?: boolean;
  value: string;
  name: string;
  note: string;
  dl: number;
}) => {
  const y0 = WF_BASE - top * WF_K;
  const y1 = WF_BASE - bottom * WF_K;
  return (
    <>
      <div
        className="mx-gy"
        style={tm(dl, 560, {
          ...abs(wfX(i), y0, { width: 140, height: y1 - y0 }),
          background: fill,
          border: outline ? '2px solid var(--osd-accent)' : undefined,
          transformOrigin: down ? '50% 0' : '50% 100%',
        })}
      />
      <div
        style={abs(wfX(i) - 30, down ? y1 + 12 : y0 - 54, {
          width: 200,
          textAlign: 'center',
          fontFamily: COND,
          fontWeight: 600,
          fontSize: 40,
          lineHeight: 1.05,
          color: down ? 'var(--osd-text)' : 'var(--osd-accent)',
        })}
      >
        <span className="mx-on" style={tm(dl)}>
          <Odo value={value} dl={dl} du={900} stagger={60} />
        </span>
      </div>
      <div style={abs(wfX(i) - 34, WF_BASE + 22, { width: 208, textAlign: 'center' })}>
        <Cap color="var(--osd-text)">{name}</Cap>
        <div
          style={{
            ...LABEL,
            color: MUTED,
            marginTop: 8,
            textTransform: 'none',
            letterSpacing: '0.02em',
          }}
        >
          {note}
        </div>
      </div>
    </>
  );
};

const WfLink = ({ i, level, dl }: { i: number; level: number; dl: number }) => (
  <div
    className="mx-gx"
    style={tm(dl, 300, {
      ...abs(wfX(i) + 140, WF_BASE - level * WF_K, { width: 218.8 - 140, height: 0 }),
      borderTop: `1px dashed ${MUTED}`,
      transformOrigin: '0 50%',
    })}
  />
);

const Policy = ({
  y,
  label,
  value,
  note,
  dl,
}: {
  y: number;
  label: string;
  value: string;
  note: string;
  dl: number;
}) => (
  <div className="mx-pop" style={tm(dl, undefined, abs(28, y, { width: 502 }))}>
    <Cap>{label}</Cap>
    <div
      style={{ fontFamily: COND, fontWeight: 700, fontSize: 58, lineHeight: 1.05, marginTop: 8 }}
    >
      {value}
    </div>
    <div style={{ fontSize: 20, color: MUTED, marginTop: 6 }}>{note}</div>
  </div>
);

const Capital: Page = () => (
  <Stage
    fn="CAP"
    source="FCF = operating cash flow less capex. FY27E–29E cumulative, management estimates."
  >
    <Heading
      code="CAP"
      fn="Capital allocation · cumulative FY2027E–FY2029E"
      title="$5.4B of free cash flow; $3.6B goes back to owners."
    />
    <Panel
      x={M}
      y={264}
      w={1144}
      h={688}
      title="FCF deployment · USD BN"
      meta="FY27E–29E cumulative"
    >
      <div style={abs(24, WF_BASE, { width: 1094, height: 1, background: LINE })} />
      <div style={abs(24, WF_BASE - 5 * WF_K, { width: 1094, height: 1, background: GRID })} />
      <div style={abs(24, WF_BASE - 5 * WF_K - 26, { ...LABEL, color: MUTED })}>5.0</div>
      <WfBar
        i={0}
        top={5.4}
        bottom={0}
        fill="var(--osd-accent)"
        value="5.4"
        name="Free cash flow"
        note="FY27E–29E"
        dl={300}
      />
      <WfLink i={0} level={5.4} dl={900} />
      <WfBar
        i={1}
        top={5.4}
        bottom={3.8}
        fill={HATCH_AMBER}
        outline
        down
        value="−1.6"
        name="Dividends"
        note="+10% a year"
        dl={1100}
      />
      <WfLink i={1} level={3.8} dl={1700} />
      <WfBar
        i={2}
        top={3.8}
        bottom={1.8}
        fill={HATCH_AMBER}
        outline
        down
        value="−2.0"
        name="Buybacks"
        note="$2.5B authorised"
        dl={1900}
      />
      <WfLink i={2} level={1.8} dl={2500} />
      <WfBar
        i={3}
        top={1.8}
        bottom={1.3}
        fill={HATCH_AMBER}
        outline
        down
        value="−0.5"
        name="Deleveraging"
        note="To ≤1.0× net"
        dl={2700}
      />
      <WfLink i={3} level={1.3} dl={3300} />
      <WfBar
        i={4}
        top={1.3}
        bottom={0}
        fill="var(--osd-text)"
        value="1.3"
        name="M&A capacity"
        note="Bolt-ons, data"
        dl={3500}
      />
    </Panel>
    <Panel x={1264} y={264} w={560} h={688} title="Policy" meta="Board approved" dl={200}>
      <Policy
        y={28}
        label="Dividend per share"
        value="$2.40"
        note="FY26 · grow ~10% a year"
        dl={500}
      />
      <Policy
        y={186}
        label="Buyback authorisation"
        value="$2.5B"
        note="New programme, 9 Oct 2026"
        dl={600}
      />
      <Policy y={344} label="Net leverage" value="1.4× → 1.0×" note="Target by end FY28" dl={700} />
      <Policy y={502} label="Payout ratio" value="40–45%" note="Of adjusted net income" dl={800} />
    </Panel>
  </Stage>
);

const Contact = ({ x, label, lines }: { x: number; label: string; lines: [string, string] }) => (
  <div className="mx-pop" style={tm(1900 + (x - M) * 0.5, undefined, abs(x, 760, { width: 520 }))}>
    <Cap color="var(--osd-accent)">{label}</Cap>
    <div style={{ fontSize: 28, fontWeight: 500, marginTop: 14 }}>{lines[0]}</div>
    <div style={{ fontSize: 28, color: MUTED, marginTop: 6 }}>{lines[1]}</div>
  </div>
);

const Close: Page = () => (
  <Stage tape>
    <CommandBar
      x={M}
      y={170}
      w={620}
      h={92}
      size={48}
      text="MRLW <GO>"
      status="End of presentation · Q&A open"
    />
    <h2
      style={abs(M - 6, 352, {
        margin: 0,
        fontFamily: COND,
        fontWeight: 700,
        fontSize: 168,
        lineHeight: 0.98,
        letterSpacing: '-0.02em',
      })}
    >
      <span style={{ display: 'block' }}>
        <Type text="Same exchange." dl={1000} iv={36} />
      </span>
      <span style={{ display: 'block', color: 'var(--osd-accent)' }}>
        <Type text="A different business." dl={1560} iv={30} />
      </span>
    </h2>
    <div style={abs(M, 728, { width: 1728, height: 1, background: LINE })} />
    <Contact
      x={M}
      label="Investor relations"
      lines={['Priya Raman, Head of IR', 'ir@marlow.exchange']}
    />
    <Contact
      x={M + 600}
      label="Materials"
      lines={['Slides, replay, model', 'ir.marlow.exchange/2026']}
    />
    <Contact x={M + 1200} label="Next" lines={['Q3 FY26 results', '29 Oct 2026 · 08:00 ET']} />
  </Stage>
);

export const meta: SlideMeta = {
  title: 'Marlow Exchange — Investor Day 2026',
  createdAt: '2026-10-11T12:56:58.354Z',
};

export const notes: (string | undefined)[] = [
  `Let the command line type and the tape start moving before you speak.
"Good morning, and welcome to Marlow's first investor day since 2022. I'm Helen Achterberg."
"The quote on the right is yesterday's close: one eighty-four sixty-two, up one and a quarter percent."
"If you remember one line today, make it the one under the title: fewer microseconds, more recurring revenue." Click.`,
  `"Here's 2026 on one screen."
Point at the hero: "Average daily volume of forty-one point two billion dollars, up eighteen percent."
Walk the four tiles left to right, top to bottom: "Net revenue two eighty-four, up fourteen. Sixty-one percent adjusted EBITDA margin. Fifty-four percent recurring. And thirteen hundred and twelve listed companies."
"The tile that matters most is bottom left. More than half of what we earn no longer depends on how busy the market is." Click.`,
  `Wait for the cursor to finish the sweep.
"Five years, sixty candles. The stock is up three point one times, volume two point four."
Use the flags: "A, Kestrel Clearing in June 2022. B, the London engine. C, Data Cloud. D, crypto ETPs. E, thirty-eight microseconds."
"Total shareholder return, two hundred thirty-one percent, against seventy-one for the financials index." Click.`,
  `"This is the slide I'd frame."
Let the bar repartition before speaking. "In 2021, thirty-eight cents of every dollar recurred. Today it's fifty-four."
"Market data compounded at twenty-one percent a year, connectivity at twenty-two. Trading still grew, but at four."
"Same revenue line, very different quality of earnings." Click.`,
  `Hand to Kenji Arakawa, CTO, or deliver yourself.
"Thirty-eight microseconds, median, from an order hitting our gateway to the acknowledgement leaving."
Trace the wire: "Six in the gateway, nine in risk, eleven to match, twelve to publish market data."
"P99 is sixty-one. The nearest of the large US venues is at fifty-two median. Speed is why the volume comes, and volume is why the data sells." Click.`,
  `Mira Castell presents.
"This is a live depth view, the product our clients pay for. Every order, every level, every venue."
"Three thousand one hundred forty firms subscribe. Net revenue retention is one sixteen. ARR six hundred twelve million, up thirty-one."
"The heat map underneath is usage by region and asset class. Options in the Americas is the hottest square, and APAC is where it's growing fastest." Click.`,
  `Let the board finish flipping. Pause.
"That was the franchise. Section two: where the next billion comes from."
"We'll be done with this section by eleven twenty-five." Click.`,
  `Three clicks, one per vector.
Click one: "Data and analytics, five hundred twenty million of incremental revenue. Subscribers from three thousand to six thousand."
Click two: "Clearing. The Treasury clearing mandate starts in 2027, and crypto futures run through our own DCO. Three hundred thirty million."
Click three: "Listings and indices, two hundred fifty. ETPs from four hundred twelve to six fifty, and index licensing."
"One point one billion in total. None of it requires an acquisition." Click.`,
  `"Fourteen data centres, sixty-one countries with direct access, three matching engines: New York, London, Singapore."
Let the packets run. "Every route you see is ours or leased dark fibre. New York to London, fifty-nine point six milliseconds round trip."
"This footprint is why a London fund and a Singapore bank can buy one Data Cloud contract instead of three." Click.`,
  `Daniel Okafor presents. Six clicks, one per row.
"Net revenue to four point one billion, thirteen percent CAGR."
"Recurring to sixty-two percent. Margin to sixty-four. Adjusted EPS to nine forty, seventeen percent a year."
"ADV to fifty-eight billion. And latency from thirty-eight microseconds to twenty-five with the new engine in 2028."
Point at the assumptions: "No M&A, constant currency, modest market growth." Click.`,
  `"Five point four billion of free cash flow over three years."
Let each bar drop before you name it. "One point six in dividends, growing ten percent a year. Two billion in buybacks under the new authorisation. Half a billion to get leverage to one times."
"That leaves one point three for bolt-ons. Three point six billion goes straight back to you." Click.`,
  `Back to Helen.
"Same exchange. A different business: faster, more recurring, and returning more cash."
"Priya and the IR team have the model and the replay on the site this afternoon."
Open the floor for questions.`,
];

export default [
  Cover,
  Snapshot,
  Graph,
  Mix,
  Latency,
  OrderBook,
  Divider,
  Growth,
  Footprint,
  Targets,
  Capital,
  Close,
] satisfies Page[];

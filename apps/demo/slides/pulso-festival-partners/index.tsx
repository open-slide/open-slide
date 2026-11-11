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
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#F1EADB', text: '#111111', accent: '#FF3D1F' },
  fonts: {
    display: '"Archivo", "Helvetica Neue", Arial, sans-serif',
    body: '"Archivo", "Helvetica Neue", Arial, sans-serif',
  },
  typeScale: { hero: 388, body: 30 },
  radius: 0,
};

const PAPER = 'var(--osd-bg)';
const INK = 'var(--osd-text)';
const RED = 'var(--osd-accent)';
const COBALT = '#1D3DE0';
const YELLOW = '#FFC20E';
const PINK = '#FFB8CF';

const SLIDE_ID = 'pulso-festival-partners';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes pl-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes pl-spin { to { transform: rotate(360deg) } }
@keyframes pl-pop { from { opacity: 0; transform: scale(0.6) } to { opacity: 1; transform: none } }
@keyframes pl-grow { from { transform: scaleY(0) } to { transform: none } }
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

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='g' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.05'/></filter><rect width='260' height='260' filter='url(#g)'/></svg>`,
)}")`;

const BRISA_FILL = `radial-gradient(circle, #111111 0 3px, transparent 3.5px) 0 0 / 14px 14px, ${YELLOW}`;

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 940;

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'scale(0.97)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
};

const morphTransition: SlideTransition = {
  duration: 320,
  exit: { duration: 340, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 340, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' },
};

const capTop = (y: number, size: number, lineHeight: number) =>
  Math.round(y - (lineHeight / 2 - 0.354) * size);

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontStretch: '125%',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '-0.02em',
  margin: 0,
  whiteSpace: 'nowrap',
};

const LABEL: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  lineHeight: 1,
};

const NUM: CSSProperties = { fontVariantNumeric: 'tabular-nums' };

const Poster = ({
  bg,
  color = INK,
  children,
  footer,
}: {
  bg: string;
  color?: string;
  children: ReactNode;
  footer?: ReactNode;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: bg,
      color,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: GRAIN,
        backgroundSize: '260px 260px',
        mixBlendMode: 'multiply',
        opacity: 0.22,
        zIndex: 8,
      }}
    />
    {footer}
  </div>
);

const FOOT: CSSProperties = {
  ...LABEL,
  position: 'absolute',
  bottom: 48,
  fontSize: 17,
  zIndex: 9,
};

const Footer = ({ left = INK, right = left }: { left?: string; right?: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <>
      <div style={{ ...FOOT, left: 120, color: left }}>Pulso Lisboa 2027</div>
      <div style={{ ...FOOT, right: 120, color: right, display: 'flex', gap: 32 }}>
        <span>Partnership proposal</span>
        <span style={NUM}>
          {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
    </>
  );
};

const Kicker = ({
  n,
  children,
  color = INK,
}: {
  n: string;
  children: ReactNode;
  color?: string;
}) => (
  <div style={abs(120, 96, { ...LABEL, color, display: 'flex', alignItems: 'center', gap: 18 })}>
    <span style={NUM}>{n}</span>
    <span style={{ width: 48, height: 4, background: color }} />
    <span>{children}</span>
  </div>
);

const Heading = ({
  top,
  size = 72,
  color = INK,
  width,
  children,
}: {
  top: number;
  size?: number;
  color?: string;
  width?: number;
  children: ReactNode;
}) => (
  <h2
    style={{
      ...DISPLAY,
      ...abs(120, capTop(top, size, 0.94)),
      fontSize: size,
      lineHeight: 0.94,
      color,
      width,
    }}
  >
    {children}
  </h2>
);

const Disc = ({
  left,
  top,
  size,
  color,
}: {
  left: number;
  top: number;
  size: number;
  color: string;
}) => (
  <MorphElement id="pulso-disc">
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
      }}
    />
  </MorphElement>
);

const Cover: Page = () => (
  <Poster bg={PAPER}>
    <div
      style={abs(0, 600, {
        width: 480,
        height: 480,
        background: YELLOW,
        borderTopRightRadius: 480,
      })}
    />
    <div
      style={abs(580, 0, {
        width: 400,
        height: 200,
        background: COBALT,
        borderRadius: '0 0 200px 200px',
      })}
    />
    <div style={abs(1000, 0, { width: 40, height: 552, background: INK })} />
    <Disc left={1040} top={80} size={760} color={RED} />
    <div style={abs(120, 96, { ...LABEL })}>Proposta de parceria</div>
    <div
      style={abs(120, 136, {
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
      })}
    >
      Partnership proposal
      <br />
      for Brisa Drinks
    </div>
    <h1
      style={{
        ...DISPLAY,
        ...abs(108, capTop(600, 388, 0.8)),
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 0.8,
        letterSpacing: '-0.035em',
      }}
    >
      Pulso
    </h1>
    <div
      style={{
        ...DISPLAY,
        ...abs(910, capTop(912, 48, 1)),
        fontSize: 48,
        lineHeight: 1,
        letterSpacing: '-0.01em',
        ...NUM,
      }}
    >
      Lisboa · 11—13 Junho 2027
    </div>
    <div style={abs(120, 912, { ...LABEL, lineHeight: 1.6 })}>
      Parque Tejo
      <br />4 palcos · 3 dias
    </div>
  </Poster>
);

const Stat = ({
  left,
  value,
  unit,
  children,
}: {
  left: number;
  value: string;
  unit?: string;
  children: ReactNode;
}) => (
  <div style={abs(left, 760, { width: 210 })}>
    <div style={{ height: 8, background: INK }} />
    <div
      style={{
        ...DISPLAY,
        ...NUM,
        fontSize: 80,
        lineHeight: 0.71,
        marginTop: 32,
      }}
    >
      {value}
      {unit && <span style={{ fontSize: 40, verticalAlign: 'top', marginLeft: 4 }}>{unit}</span>}
    </div>
    <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.3, marginTop: 22 }}>{children}</div>
  </div>
);

const Audience: Page = () => {
  const live = useIsActivePage();
  const landed: CSSProperties = live
    ? { animation: `pl-fade 520ms ${EASE_OUT} ${MORPH_MS - 160}ms both` }
    : {};
  return (
    <Poster bg={YELLOW} footer={<Footer />}>
      <Kicker n="01">Público · Audience</Kicker>
      <Disc left={880} top={60} size={1000} color={RED} />
      <div
        style={{
          ...DISPLAY,
          ...NUM,
          ...abs(108, capTop(300, 300, 0.71)),
          fontSize: 300,
          lineHeight: 0.71,
          letterSpacing: '-0.04em',
          ...landed,
        }}
      >
        128,000
      </div>
      <div
        style={{
          ...DISPLAY,
          ...abs(120, capTop(562, 56, 0.96)),
          fontSize: 56,
          lineHeight: 0.96,
        }}
      >
        People over
        <br />
        three days
      </div>
      <Stat left={120} value="41">
        Days to sell out
        <br />
        the 2026 edition
      </Stat>
      <Stat left={400} value="37" unit="%">
        Of the crowd
        <br />
        from abroad
      </Stat>
      <Stat left={680} value="27">
        Average age
        <br />
        of a ticket buyer
      </Stat>
      <div style={abs(1180, 880, { ...LABEL, width: 400, textAlign: 'center', ...landed })}>
        Capped · 42,700 a day
      </div>
    </Poster>
  );
};

const GrowthDisc = ({
  x,
  d,
  year,
  value,
  note,
  color,
  projected,
  delay,
}: {
  x: number;
  d: number;
  year: string;
  value: string;
  note?: string;
  color: string;
  projected?: boolean;
  delay: number;
}) => {
  const live = useIsActivePage();
  return (
    <>
      <div
        style={abs(x, 760 - d, {
          width: d,
          height: d,
          borderRadius: '50%',
          boxSizing: 'border-box',
          background: projected ? 'transparent' : color,
          border: projected ? `6px dashed ${color}` : undefined,
          transformOrigin: '50% 100%',
          animation: live ? `pl-pop 640ms ${EASE_OUT} ${delay}ms both` : undefined,
        })}
      />
      <div style={abs(x + d / 2 - 140, 806, { width: 280, textAlign: 'center' })}>
        <div style={{ ...LABEL, ...NUM }}>{year}</div>
        <div
          style={{
            ...DISPLAY,
            ...NUM,
            fontSize: 52,
            lineHeight: 0.71,
            marginTop: 20,
            color: projected ? RED : INK,
          }}
        >
          {value}
        </div>
        {note && (
          <div style={{ fontSize: 20, fontWeight: 500, marginTop: 18, lineHeight: 1 }}>{note}</div>
        )}
      </div>
    </>
  );
};

const Growth: Page = () => (
  <Poster bg={PAPER} footer={<Footer />}>
    <Kicker n="01">Público · Growth</Kicker>
    <Heading top={160} size={76}>
      3.6× the crowd
      <br />
      since 2022.
    </Heading>
    <div
      style={abs(1240, 160, {
        width: 560,
        fontSize: 26,
        fontWeight: 500,
        lineHeight: 1.4,
      })}
    >
      Six editions, each one bigger than the last. From 2027 the city caps the site at 128,000, so
      demand now outruns supply.
    </div>
    <GrowthDisc x={120} d={155} year="2022" value="34K" color={COBALT} delay={0} />
    <GrowthDisc x={315} d={207} year="2023" value="61K" color={COBALT} delay={70} />
    <GrowthDisc
      x={562}
      d={249}
      year="2024"
      value="88K"
      note="Sold out · 88 days"
      color={COBALT}
      delay={140}
    />
    <GrowthDisc
      x={851}
      d={277}
      year="2025"
      value="109K"
      note="Sold out · 63 days"
      color={COBALT}
      delay={210}
    />
    <GrowthDisc
      x={1168}
      d={292}
      year="2026"
      value="121K"
      note="Sold out · 41 days"
      color={RED}
      delay={280}
    />
    <GrowthDisc
      x={1500}
      d={300}
      year="2027 · cap"
      value="128K"
      note="Projected"
      color={RED}
      projected
      delay={350}
    />
    <div style={abs(120, 760, { width: 1680, height: 14, background: INK })} />
  </Poster>
);

const AgeBar = ({
  x,
  h,
  pct,
  band,
  color,
  delay,
}: {
  x: number;
  h: number;
  pct: string;
  band: string;
  color: string;
  delay: number;
}) => {
  const live = useIsActivePage();
  return (
    <>
      <div
        style={{
          ...DISPLAY,
          ...NUM,
          ...abs(x, 880 - h - 24 - 40, { width: 168 }),
          fontSize: 56,
          lineHeight: 0.71,
          color: PAPER,
          animation: live ? `pl-fade 400ms ${EASE_OUT} ${delay + 360}ms both` : undefined,
        }}
      >
        {pct}
      </div>
      <div
        style={abs(x, 880 - h, {
          width: 168,
          height: h,
          background: color,
          transformOrigin: '50% 100%',
          animation: live ? `pl-grow 620ms ${EASE_OUT} ${delay}ms both` : undefined,
        })}
      />
      <div style={abs(x, 908, { ...LABEL, ...NUM, color: PAPER })}>{band}</div>
    </>
  );
};

const OriginBlock = ({
  x,
  y,
  w,
  h,
  name,
  pct,
  bg,
  fg = INK,
  outline,
  compact,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  pct: string;
  bg: string;
  fg?: string;
  outline?: boolean;
  compact?: boolean;
}) => (
  <div
    style={abs(x, y, {
      width: w,
      height: h,
      boxSizing: 'border-box',
      background: outline ? 'transparent' : bg,
      border: outline ? `4px solid ${bg}` : undefined,
      color: fg,
      padding: compact ? '0 20px' : '22px 24px',
      display: 'flex',
      flexDirection: compact ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: compact ? 'center' : 'flex-start',
    })}
  >
    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{name}</div>
    <div
      style={{
        ...DISPLAY,
        ...NUM,
        fontSize: compact ? 30 : 64,
        lineHeight: 0.71,
      }}
    >
      {pct}
    </div>
  </div>
);

const WhoComes: Page = () => (
  <Poster bg={COBALT} color={PAPER} footer={<Footer left={PAPER} />}>
    <Kicker n="01" color={PAPER}>
      Público · Who comes
    </Kicker>
    <Heading top={160} size={72} color={PAPER}>
      Mostly under 35.
      <br />
      One in three flies in.
    </Heading>
    <div style={abs(120, 392, { ...LABEL, color: PAPER })}>Age</div>
    <AgeBar x={120} h={332} pct="34%" band="18–24" color={PAPER} delay={0} />
    <AgeBar x={312} h={400} pct="41%" band="25–34" color={YELLOW} delay={80} />
    <AgeBar x={504} h={166} pct="17%" band="35–44" color={PAPER} delay={160} />
    <AgeBar x={696} h={78} pct="8%" band="45+" color={PAPER} delay={240} />
    <div style={abs(1000, 392, { ...LABEL, color: PAPER })}>Origin</div>
    <div style={abs(1000, 440, { ...LABEL, fontSize: 17, color: PAPER })}>Portugal 63%</div>
    <div style={abs(1507, 440, { ...LABEL, fontSize: 17, color: PAPER })}>Abroad 37%</div>
    <OriginBlock x={1000} y={480} w={499} h={255} name="Lisbon metro" pct="41%" bg={RED} />
    <OriginBlock x={1000} y={743} w={499} h={137} name="Rest of Portugal" pct="22%" bg={YELLOW} />
    <OriginBlock x={1507} y={480} w={293} h={112} name="Spain" pct="11%" bg={PAPER} compact />
    <OriginBlock x={1507} y={600} w={293} h={81} name="UK" pct="8%" bg={PINK} compact />
    <OriginBlock
      x={1507}
      y={689}
      w={293}
      h={61}
      name="France"
      pct="6%"
      bg="#111111"
      fg={PAPER}
      compact
    />
    <OriginBlock
      x={1507}
      y={758}
      w={293}
      h={122}
      name="Other"
      pct="12%"
      bg={PAPER}
      fg={PAPER}
      outline
      compact
    />
  </Poster>
);

const Ring = ({
  x,
  y,
  d,
  stroke,
  color,
}: {
  x: number;
  y: number;
  d: number;
  stroke: number;
  color: string;
}) => {
  const live = useIsActivePage();
  const r = (d - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={d}
      height={d}
      viewBox={`0 0 ${d} ${d}`}
      style={abs(x, y, {
        animation: live ? 'pl-spin 60s linear infinite' : undefined,
      })}
    >
      <circle
        cx={d / 2}
        cy={d / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={`${c * 0.86} ${c * 0.14}`}
        style={{ stroke: color }}
      />
    </svg>
  );
};

const Divider = ({
  n,
  title,
  sub,
  bg,
  fg,
  numColor,
  children,
}: {
  n: string;
  title: string;
  sub: ReactNode;
  bg: string;
  fg: string;
  numColor: string;
  children: ReactNode;
}) => (
  <Poster bg={bg} color={fg} footer={<Footer left={fg} />}>
    {children}
    <div
      style={{
        ...DISPLAY,
        ...NUM,
        ...abs(96, capTop(96, 560, 0.71)),
        fontSize: 560,
        lineHeight: 0.71,
        letterSpacing: '-0.05em',
        color: numColor,
      }}
    >
      {n}
    </div>
    <div
      style={{
        ...DISPLAY,
        ...abs(116, capTop(720, 168, 0.71)),
        fontSize: 168,
        lineHeight: 0.71,
      }}
    >
      {title}
    </div>
    <div style={abs(120, 880, { fontSize: 36, fontWeight: 500, lineHeight: 1.2 })}>{sub}</div>
  </Poster>
);

const SiteDivider: Page = () => (
  <Divider
    n="02"
    title="O Recinto"
    sub="The site — Parque Tejo, 90 hectares on the river"
    bg={RED}
    fg={INK}
    numColor={INK}
  >
    <div style={abs(1200, 96, { width: 600, height: 600, borderRadius: '50%', background: INK })} />
    <Ring x={1290} y={186} d={420} stroke={30} color={PAPER} />
    <div
      style={abs(1440, 336, { width: 120, height: 120, borderRadius: '50%', background: RED })}
    />
    <div
      style={abs(1500, 696, {
        width: 300,
        height: 150,
        background: COBALT,
        borderRadius: '0 0 150px 150px',
      })}
    />
  </Divider>
);

const StageKey = ({
  y,
  name,
  capacity,
  color,
}: {
  y: number;
  name: string;
  capacity: string;
  color: string;
}) => (
  <div
    style={abs(120, y, {
      width: 600,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      borderBottom: '3px solid #111111',
    })}
  >
    <div style={{ width: 48, height: 24, background: color, borderRadius: '0 0 24px 24px' }} />
    <div style={{ flex: 1, fontSize: 28, fontWeight: 700 }}>{name}</div>
    <div style={{ ...NUM, fontSize: 28, fontWeight: 500 }}>{capacity}</div>
  </div>
);

const KeyRow = ({ y, swatch, label }: { y: number; swatch: ReactNode; label: string }) => (
  <div style={abs(120, y, { display: 'flex', alignItems: 'center', gap: 24 })}>
    <div style={{ width: 48, display: 'flex', justifyContent: 'center' }}>{swatch}</div>
    <div style={{ fontSize: 24, fontWeight: 500 }}>{label}</div>
  </div>
);

const HalfDisc = ({
  cx,
  cy,
  r,
  facing,
  color,
}: {
  cx: number;
  cy: number;
  r: number;
  facing: 'down' | 'up' | 'left' | 'right';
  color: string;
}) => {
  const box: Record<typeof facing, CSSProperties> = {
    down: abs(cx - r, cy, { width: 2 * r, height: r, borderRadius: `0 0 ${r}px ${r}px` }),
    up: abs(cx - r, cy - r, { width: 2 * r, height: r, borderRadius: `${r}px ${r}px 0 0` }),
    left: abs(cx - r, cy - r, { width: r, height: 2 * r, borderRadius: `${r}px 0 0 ${r}px` }),
    right: abs(cx, cy - r, { width: r, height: 2 * r, borderRadius: `0 ${r}px ${r}px 0` }),
  };
  return <div style={{ ...box[facing], background: color }} />;
};

const PlanLabel = ({
  x,
  y,
  children,
  color = INK,
  align = 'left',
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  align?: 'left' | 'center';
}) => (
  <div
    style={abs(align === 'center' ? x - 160 : x, y, {
      ...LABEL,
      fontSize: 17,
      color,
      width: align === 'center' ? 320 : undefined,
      textAlign: align,
    })}
  >
    {children}
  </div>
);

const Gate = ({ x, y, rotate }: { x: number; y: number; rotate: number }) => (
  <div
    style={abs(x - 18, y - 18, {
      width: 0,
      height: 0,
      borderLeft: '18px solid transparent',
      borderRight: '18px solid transparent',
      borderTop: '30px solid #111111',
      transform: `rotate(${rotate}deg)`,
    })}
  />
);

const SitePlan: Page = () => (
  <Poster bg={PAPER} footer={<Footer />}>
    <svg
      width={1920}
      height={1080}
      viewBox="0 0 1920 1080"
      style={abs(0, 0)}
      role="img"
      aria-label="Site plan"
    >
      <polygon points="1720,0 1920,0 1920,1080 1830,1080" style={{ fill: COBALT }} />
      <polygon
        points="840,96 1680,96 1768,960 840,960"
        style={{ fill: 'none', stroke: '#111111', strokeWidth: 4 }}
      />
      <path
        d="M 880 480 H 1240 M 1000 480 V 380 M 1240 480 V 380 M 1200 480 V 880"
        style={{
          fill: 'none',
          stroke: COBALT,
          strokeWidth: 14,
          strokeLinecap: 'round',
          strokeDasharray: '0 24',
        }}
      />
    </svg>
    <div
      style={{
        ...LABEL,
        ...abs(1884, 470, {
          color: PAPER,
          whiteSpace: 'nowrap',
          transform: 'rotate(90deg)',
          transformOrigin: '0 0',
        }),
      }}
    >
      Rio Tejo
    </div>
    <HalfDisc cx={1572} cy={600} r={270} facing="left" color={RED} />
    <div style={abs(1572, 330, { width: 28, height: 540, background: INK })} />
    <HalfDisc cx={1080} cy={196} r={171} facing="down" color={YELLOW} />
    <div style={abs(899, 168, { width: 362, height: 28, background: INK })} />
    <HalfDisc cx={980} cy={846} r={99} facing="up" color={COBALT} />
    <div style={abs(871, 846, { width: 218, height: 22, background: INK })} />
    <HalfDisc cx={1636} cy={214} r={70} facing="left" color={PINK} />
    <div style={abs(1636, 138, { width: 20, height: 152, background: INK })} />
    <div
      style={abs(892, 540, {
        width: 150,
        height: 150,
        boxSizing: 'border-box',
        borderRadius: '50%',
        background: BRISA_FILL,
        border: '5px solid #111111',
      })}
    />
    <div
      style={abs(1290, 168, {
        width: 120,
        height: 72,
        boxSizing: 'border-box',
        border: '3px dashed #111111',
      })}
    />
    <div
      style={abs(1290, 846, {
        width: 120,
        height: 64,
        boxSizing: 'border-box',
        border: '3px dashed #111111',
      })}
    />
    <PlanLabel x={1450} y={592} align="center">
      Palco Tejo
    </PlanLabel>
    <PlanLabel x={1080} y={262} align="center">
      Palco Sol
    </PlanLabel>
    <PlanLabel x={980} y={800} align="center" color={PAPER}>
      Cúpula
    </PlanLabel>
    <PlanLabel x={1604} y={306} align="center">
      Rio Club
    </PlanLabel>
    <div
      style={abs(1058, 598, {
        ...LABEL,
        fontSize: 17,
        background: INK,
        color: YELLOW,
        padding: '8px 12px',
      })}
    >
      Brisa
    </div>
    <Gate x={840} y={480} rotate={-90} />
    <Gate x={1150} y={96} rotate={0} />
    <Gate x={1200} y={960} rotate={180} />
    <PlanLabel x={866} y={504}>
      Metro
    </PlanLabel>
    <PlanLabel x={1184} y={112}>
      Norte
    </PlanLabel>
    <PlanLabel x={1234} y={926}>
      Sul · Night Line
    </PlanLabel>
    <Kicker n="02">O Recinto · Site plan</Kicker>
    <Heading top={160} size={64}>
      Four stages
      <br />
      on the river.
    </Heading>
    <StageKey y={336} name="Palco Tejo" capacity="45,000" color={RED} />
    <StageKey y={400} name="Palco Sol" capacity="18,000" color={YELLOW} />
    <StageKey y={464} name="Cúpula" capacity="6,000" color={COBALT} />
    <StageKey y={528} name="Rio Club" capacity="3,000" color={PINK} />
    <div style={abs(120, 616, { ...LABEL, fontSize: 17 })}>Stage area scaled to capacity</div>
    <KeyRow
      y={700}
      label="Cúpula Brisa, by the metro gate"
      swatch={
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: BRISA_FILL,
            border: '3px solid #111111',
            boxSizing: 'border-box',
          }}
        />
      }
    />
    <KeyRow
      y={764}
      label="Linha de Recarga · 60 refill taps"
      swatch={
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COBALT }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COBALT }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COBALT }} />
        </div>
      }
    />
    <KeyRow
      y={828}
      label="Other partner zones"
      swatch={
        <div
          style={{
            width: 40,
            height: 28,
            border: '3px dashed #111111',
            boxSizing: 'border-box',
          }}
        />
      }
    />
    <KeyRow
      y={892}
      label="Entrances"
      swatch={
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '14px solid transparent',
            borderRight: '14px solid transparent',
            borderTop: '24px solid #111111',
          }}
        />
      }
    />
  </Poster>
);

const X0 = 400;
const PX_H = 116.67;
const ROW_H = 104;
const ROW_TOP = [356, 474, 592, 710];
const hx = (h: number) => Math.round(X0 + (h - 16) * PX_H);
const clock = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h % 1) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const Slot = ({
  row,
  from,
  to,
  label,
  bg,
  fg = INK,
  strong,
}: {
  row: number;
  from: number;
  to: number;
  label: string;
  bg: string;
  fg?: string;
  strong?: boolean;
}) => (
  <div
    style={abs(hx(from) + 3, ROW_TOP[row], {
      width: hx(to) - hx(from) - 6,
      height: ROW_H,
      boxSizing: 'border-box',
      background: bg,
      color: fg,
      padding: '16px 14px',
      borderTop: strong ? '10px solid #111111' : undefined,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    })}
  >
    <div
      style={
        strong
          ? { ...LABEL, fontSize: 21, fontWeight: 900, letterSpacing: '0.06em' }
          : { fontSize: 22, fontWeight: 700, lineHeight: 1 }
      }
    >
      {label}
    </div>
    <div style={{ ...NUM, fontSize: 18, fontWeight: 500, lineHeight: 1 }}>{clock(from)}</div>
  </div>
);

const StageRow = ({ row, name, capacity }: { row: number; name: string; capacity: string }) => (
  <div style={abs(120, ROW_TOP[row], { height: ROW_H, color: PAPER, paddingTop: 16 })}>
    <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{name}</div>
    <div style={{ ...NUM, fontSize: 18, fontWeight: 500, marginTop: 12, opacity: 0.7 }}>
      {capacity}
    </div>
  </div>
);

const HourTick = ({ h, end }: { h: number; end?: boolean }) => (
  <>
    <div
      style={abs(end ? hx(h) - 80 : hx(h) - 40, 298, {
        ...LABEL,
        ...NUM,
        width: 80,
        textAlign: end ? 'right' : 'center',
      })}
    >
      {clock(h)}
    </div>
    <div style={abs(hx(h) - 1, 330, { width: 2, height: 16, background: PAPER })} />
  </>
);

const BrisaBar = ({
  y,
  from,
  to,
  label,
}: {
  y: number;
  from: number;
  to: number;
  label: string;
}) => (
  <div
    style={abs(hx(from) + 3, y, {
      width: hx(to) - hx(from) - 6,
      height: 44,
      background: BRISA_FILL,
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 10,
      boxSizing: 'border-box',
    })}
  >
    <span
      style={{
        ...LABEL,
        fontSize: 16,
        background: YELLOW,
        color: '#111111',
        padding: '6px 10px',
      }}
    >
      {label}
    </span>
  </div>
);

const Schedule: Page = () => (
  <Poster bg="#111111" color={PAPER} footer={<Footer left={PAPER} />}>
    <Kicker n="02" color={PAPER}>
      O Recinto · Saturday 12 June
    </Kicker>
    <Heading top={160} size={72} color={PAPER}>
      A day at Pulso
    </Heading>
    <div style={abs(1240, 156, { width: 560, fontSize: 24, fontWeight: 500, lineHeight: 1.4 })}>
      Gates open at 15:00. Stages are staggered so the top of the bill never clashes.
    </div>
    <HourTick h={16} />
    <HourTick h={18} />
    <HourTick h={20} />
    <HourTick h={22} />
    <HourTick h={24} />
    <HourTick h={26} />
    <HourTick h={28} end />
    <div style={abs(X0, 346, { width: hx(28) - X0, height: 2, background: PAPER })} />
    <StageRow row={0} name="Palco Tejo" capacity="45,000" />
    <StageRow row={1} name="Palco Sol" capacity="18,000" />
    <StageRow row={2} name="Cúpula" capacity="6,000" />
    <StageRow row={3} name="Rio Club" capacity="3,000" />
    <Slot row={0} from={17} to={18} label="Opening" bg={RED} />
    <Slot row={0} from={18.5} to={19.75} label="Live" bg={RED} />
    <Slot row={0} from={20.25} to={21.75} label="Live" bg={RED} />
    <Slot row={0} from={22.5} to={24.25} label="Headliner" bg={RED} strong />
    <Slot row={0} from={24.75} to={26} label="Live" bg={RED} />
    <Slot row={1} from={16} to={17.25} label="Live" bg={YELLOW} />
    <Slot row={1} from={17.75} to={19} label="Live" bg={YELLOW} />
    <Slot row={1} from={19.5} to={20.75} label="Sunset set" bg={YELLOW} />
    <Slot row={1} from={21.25} to={22.5} label="Live" bg={YELLOW} />
    <Slot row={1} from={23} to={24.5} label="Special guest" bg={YELLOW} />
    <Slot row={2} from={20} to={22} label="DJ set" bg={COBALT} fg={PAPER} />
    <Slot row={2} from={22} to={24} label="DJ set" bg={COBALT} fg={PAPER} />
    <Slot row={2} from={24} to={26} label="B2B" bg={COBALT} fg={PAPER} />
    <Slot row={2} from={26} to={28} label="Closing set" bg={COBALT} fg={PAPER} />
    <Slot row={3} from={16} to={19} label="Day party" bg={PINK} />
    <Slot row={3} from={19} to={21.5} label="DJ set" bg={PINK} />
    <Slot row={3} from={21.5} to={24} label="Live" bg={PINK} />
    <Slot row={3} from={24} to={27} label="B2B" bg={PINK} />
    <div style={abs(120, 850, { color: YELLOW, paddingTop: 4 })}>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>Brisa</div>
      <div style={{ fontSize: 18, fontWeight: 500, marginTop: 12 }}>On site, all day</div>
    </div>
    <BrisaBar y={846} from={16} to={21} label="Cúpula Brisa" />
    <BrisaBar y={846} from={24} to={28} label="Night Line" />
    <BrisaBar y={898} from={16} to={28} label="Linha de Recarga · 60 taps" />
  </Poster>
);

const PartnershipDivider: Page = () => (
  <Divider
    n="03"
    title="Parceria"
    sub="Partnership — three tiers, one headline slot"
    bg={COBALT}
    fg={PAPER}
    numColor={YELLOW}
  >
    <div style={abs(1200, 96, { width: 600, height: 600, borderRadius: '50%', background: RED })} />
    <Ring x={1290} y={186} d={420} stroke={30} color={INK} />
    <div
      style={abs(1440, 336, { width: 120, height: 120, borderRadius: '50%', background: YELLOW })}
    />
    <div
      style={abs(1500, 696, {
        width: 300,
        height: 150,
        background: YELLOW,
        borderRadius: '0 0 150px 150px',
      })}
    />
  </Divider>
);

const Slot3 = ({ color }: { color: string }) => (
  <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, flex: 'none' }} />
);

const Tier = ({
  y,
  w,
  h,
  bg,
  fg,
  name,
  price,
  priceSize,
  slots,
  available,
  children,
  tag,
}: {
  y: number;
  w: number;
  h: number;
  bg: string;
  fg: string;
  name: string;
  price: string;
  priceSize: number;
  slots: ReactNode;
  available: string;
  children: ReactNode;
  tag?: string;
}) => (
  <div style={abs(120, y, { width: w, height: h, background: bg, color: fg })}>
    <div style={abs(40, 36, { ...LABEL })}>{name}</div>
    <div
      style={{
        ...DISPLAY,
        ...NUM,
        ...abs(34, h - 36 - Math.round(priceSize * 0.69)),
        fontSize: priceSize,
        lineHeight: 0.69,
      }}
    >
      {price}
    </div>
    <ul
      style={abs(722, 30, {
        margin: 0,
        padding: 0,
        listStyle: 'none',
        fontSize: 25,
        fontWeight: 500,
        lineHeight: 1.42,
        width: w - 722 - 260,
      })}
    >
      {children}
    </ul>
    <div
      style={abs(w - 220, 36, {
        width: 180,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 14,
      })}
    >
      <div style={{ display: 'flex', gap: 8 }}>{slots}</div>
      <div style={{ ...LABEL, fontSize: 17 }}>{available}</div>
    </div>
    {tag && (
      <div
        style={abs(w - 320, h - 36 - 36, {
          ...LABEL,
          fontSize: 17,
          whiteSpace: 'nowrap',
          width: 280,
          height: 36,
          background: INK,
          color: PAPER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {tag}
      </div>
    )}
  </div>
);

const Tiers: Page = () => (
  <Poster bg={PAPER} footer={<Footer />}>
    <Kicker n="03">Parceria · Tiers</Kicker>
    <Heading top={160} size={72}>
      Three ways in.
    </Heading>
    <div style={abs(1240, 156, { width: 560, fontSize: 24, fontWeight: 500, lineHeight: 1.4 })}>
      Seven partners, one per category. Fees cover the 2027 edition; build is quoted separately.
    </div>
    <Steps>
      <Step duration={320}>
        <Tier
          y={276}
          w={1680}
          h={272}
          bg={RED}
          fg={INK}
          name="Headline partner"
          price="€1.2M"
          priceSize={168}
          slots={<Slot3 color={INK} />}
          available="1 available"
          tag="Proposed for Brisa"
        >
          <li>Co-branded festival lock-up</li>
          <li>Exclusive in water & soft drinks</li>
          <li>Two activation sites, 900 m²</li>
          <li>120 hospitality passes a day</li>
        </Tier>
      </Step>
      <Step duration={320}>
        <Tier
          y={564}
          w={1538}
          h={204}
          bg={COBALT}
          fg={PAPER}
          name="Stage partner"
          price="€450K"
          priceSize={124}
          slots={
            <>
              <Slot3 color={PAPER} />
              <Slot3 color={PAPER} />
            </>
          }
          available="2 available"
        >
          <li>Naming of Palco Sol or Cúpula</li>
          <li>One activation site, 400 m²</li>
          <li>40 hospitality passes a day</li>
        </Tier>
      </Step>
      <Step duration={320}>
        <Tier
          y={784}
          w={1396}
          h={176}
          bg={YELLOW}
          fg={INK}
          name="Supporting partner"
          price="€150K"
          priceSize={96}
          slots={
            <>
              <Slot3 color={INK} />
              <Slot3 color={INK} />
              <Slot3 color={INK} />
              <Slot3 color={INK} />
            </>
          }
          available="4 available"
        >
          <li>Bar and product placement</li>
          <li>Logo on site signage and app</li>
          <li>12 hospitality passes a day</li>
        </Tier>
      </Step>
    </Steps>
  </Poster>
);

const Concept = ({
  x,
  index,
  title,
  body,
  art,
  stats,
}: {
  x: number;
  index: string;
  title: string;
  body: string;
  art: ReactNode;
  stats: ReactNode;
}) => (
  <div style={abs(x, 296, { width: 520 })}>
    <div style={{ height: 292, position: 'relative' }}>{art}</div>
    <div style={{ height: 10, background: INK, marginTop: 20 }} />
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 28 }}>
      <span style={{ ...LABEL, ...NUM }}>{index}</span>
      <span style={{ ...DISPLAY, fontSize: 36, lineHeight: 1 }}>{title}</span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.4, marginTop: 18, height: 110 }}>
      {body}
    </div>
    <div style={{ display: 'flex', gap: 40, marginTop: 28 }}>{stats}</div>
  </div>
);

const Figure = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div style={{ ...DISPLAY, ...NUM, fontSize: 60, lineHeight: 0.71 }}>{value}</div>
    <div style={{ ...LABEL, fontSize: 16, marginTop: 16 }}>{label}</div>
  </div>
);

const DomeArt = () => (
  <svg width={520} height={292} viewBox="0 0 520 292" style={abs(0, 0)} aria-hidden="true">
    <path
      d="M 40 270 A 220 220 0 0 1 480 270"
      pathLength={31}
      style={{
        fill: 'none',
        stroke: '#111111',
        strokeWidth: 12,
        strokeLinecap: 'round',
        strokeDasharray: '0 1',
      }}
    />
    <path d="M 100 270 A 160 160 0 0 1 420 270 Z" style={{ fill: COBALT }} />
    <path d="M 210 270 A 50 50 0 0 1 310 270 Z" style={{ fill: '#F1EADB' }} />
    <rect x={0} y={270} width={520} height={14} style={{ fill: '#111111' }} />
  </svg>
);

const RefillArt = () => (
  <svg width={520} height={292} viewBox="0 0 520 292" style={abs(0, 0)} aria-hidden="true">
    <rect x={0} y={40} width={520} height={30} style={{ fill: '#111111' }} />
    <path
      d="M 30 88 H 490"
      style={{ fill: 'none', stroke: '#111111', strokeWidth: 36, strokeDasharray: '20 68' }}
    />
    <g transform="translate(218 196)">
      <path d="M 0 -80 L 49.5 -30.5 A 70 70 0 1 1 -49.5 -30.5 Z" style={{ fill: COBALT }} />
    </g>
    <circle cx={128} cy={140} r={14} style={{ fill: COBALT }} />
    <circle cx={128} cy={196} r={9} style={{ fill: COBALT }} />
    <circle cx={392} cy={150} r={20} style={{ fill: COBALT }} />
    <circle cx={392} cy={222} r={12} style={{ fill: COBALT }} />
  </svg>
);

const NightArt = () => (
  <svg width={520} height={292} viewBox="0 0 520 292" style={abs(0, 0)} aria-hidden="true">
    <circle cx={130} cy={150} r={120} style={{ fill: '#111111' }} />
    <circle cx={186} cy={110} r={100} style={{ fill: YELLOW }} />
    <path
      d="M 292 220 H 500"
      style={{ fill: 'none', stroke: '#FF3D1F', strokeWidth: 16, strokeDasharray: '26 14' }}
    />
    <circle
      cx={300}
      cy={220}
      r={20}
      style={{ fill: '#F1EADB', stroke: '#111111', strokeWidth: 6 }}
    />
    <circle cx={492} cy={220} r={20} style={{ fill: '#111111' }} />
  </svg>
);

const Activations: Page = () => (
  <Poster bg={YELLOW} footer={<Footer />}>
    <Kicker n="03">Parceria · Activations</Kicker>
    <Heading top={160} size={64}>
      Three things Brisa does on site.
    </Heading>
    <Concept
      x={120}
      index="A"
      title="Cúpula Brisa"
      body="A shaded dome at the metro gate, misting through the afternoon heat."
      art={<DomeArt />}
      stats={
        <>
          <Figure value="32" label="Misting stations" />
          <Figure value="1,200" label="m² of shade" />
        </>
      }
    />
    <Concept
      x={700}
      index="B"
      title="Linha de Recarga"
      body="Free refill taps across the site. Every refill is a Brisa moment, not a plastic bottle."
      art={<RefillArt />}
      stats={
        <>
          <Figure value="410K" label="Est. refills" />
          <Figure value="120K" label="Bottles avoided" />
        </>
      }
    />
    <Concept
      x={1280}
      index="C"
      title="Night Line"
      body="A free after-hours shuttle from the south gate to Cais do Sodré, 00:00 to 04:00."
      art={<NightArt />}
      stats={
        <>
          <Figure value="12" label="Minutes apart" />
          <Figure value="16K" label="Est. riders" />
        </>
      }
    />
  </Poster>
);

const Channel = ({
  y,
  color,
  name,
  detail,
  outline,
}: {
  y: number;
  color: string;
  name: string;
  detail: string;
  outline?: boolean;
}) => (
  <div style={abs(120, y, { display: 'flex', alignItems: 'flex-start', gap: 24, width: 900 })}>
    <div
      style={{
        width: 32,
        height: 32,
        flex: 'none',
        marginTop: 2,
        background: outline ? 'transparent' : color,
        border: outline ? `4px solid ${color}` : undefined,
        boxSizing: 'border-box',
      }}
    />
    <div>
      <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
      <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.3, marginTop: 6, opacity: 0.72 }}>
        {detail}
      </div>
    </div>
  </div>
);

const BandValue = ({
  r,
  value,
  size,
  color,
}: {
  r: number;
  value: string;
  size: number;
  color: string;
}) => {
  const d = r / Math.SQRT2;
  return (
    <div
      style={{
        ...DISPLAY,
        ...NUM,
        ...abs(1920 - d - 150, 1080 - d - Math.round(size * 0.35)),
        width: 300,
        textAlign: 'center',
        fontSize: size,
        lineHeight: 0.71,
        color,
      }}
    >
      {value}
    </div>
  );
};

const CornerDisc = ({ r, color }: { r: number; color: string }) => (
  <div
    style={abs(1920 - r, 1080 - r, {
      width: 2 * r,
      height: 2 * r,
      borderRadius: '50%',
      background: color,
    })}
  />
);

const Reach: Page = () => (
  <Poster bg="#111111" color={PAPER} footer={<Footer left={PAPER} right={INK} />}>
    <CornerDisc r={860} color={PAPER} />
    <CornerDisc r={812} color={YELLOW} />
    <CornerDisc r={717} color={COBALT} />
    <CornerDisc r={538} color={RED} />
    <BandValue r={290} value="18M" size={96} color={INK} />
    <BandValue r={628} value="14M" size={64} color={PAPER} />
    <BandValue r={765} value="9M" size={40} color={INK} />
    <BandValue r={836} value="5M" size={24} color={INK} />
    <Kicker n="03" color={PAPER}>
      Parceria · Reach
    </Kicker>
    <div
      style={{
        ...DISPLAY,
        ...NUM,
        ...abs(108, capTop(176, 300, 0.71)),
        fontSize: 300,
        lineHeight: 0.71,
        letterSpacing: '-0.04em',
        color: YELLOW,
      }}
    >
      46M
    </div>
    <div style={abs(120, 418, { fontSize: 30, fontWeight: 500, lineHeight: 1.35, width: 780 })}>
      Projected impressions carrying the Brisa mark,
      <br />
      March to June 2027.
    </div>
    <Channel
      y={548}
      color={RED}
      name="Owned social"
      detail="Instagram, TikTok and YouTube · 2.1M followers"
    />
    <Channel
      y={640}
      color={COBALT}
      name="Broadcast & stream"
      detail="RTP highlights + YouTube live, all three days"
    />
    <Channel
      y={732}
      color={YELLOW}
      name="OOH Lisbon"
      detail="Metro, MUPI and riverfront, six weeks"
    />
    <Channel
      y={824}
      color={PAPER}
      name="Press"
      detail="Music and lifestyle titles in PT, ES and UK"
    />
    <div style={abs(1000, 176, { width: 440, color: PAPER })}>
      <div style={{ ...DISPLAY, ...NUM, fontSize: 96, lineHeight: 0.71 }}>+410K</div>
      <div style={{ ...LABEL, fontSize: 17, lineHeight: 1.5, marginTop: 22 }}>
        Ticket buyers in the Pulso CRM,
        <br />
        one co-branded send a month
      </div>
    </div>
  </Poster>
);

const T0 = 120;
const PX_M = 1680 / 11;
const AXIS_Y = 640;
const mx = (month: number, day: number, days: number) =>
  Math.round(T0 + (month + (day - 1) / days) * PX_M);

const MonthTick = ({ m, label }: { m: number; label: string }) => {
  const x = Math.round(T0 + m * PX_M);
  return (
    <>
      {m > 0 && <div style={abs(x - 1, AXIS_Y, { width: 2, height: 40, background: PAPER })} />}
      <div style={abs(x + 14, AXIS_Y + 12, { ...LABEL, fontSize: 16, color: PAPER })}>{label}</div>
    </>
  );
};

const Milestone = ({
  x,
  above,
  date,
  title,
  detail,
  marker,
  width = 340,
  alignRight,
}: {
  x: number;
  above?: boolean;
  date: string;
  title: string;
  detail: string;
  marker: ReactNode;
  width?: number;
  alignRight?: boolean;
}) => {
  const stemTop = above ? 452 : AXIS_Y + 40;
  const stemBottom = above ? AXIS_Y : AXIS_Y + 92;
  return (
    <>
      <div
        style={abs(x - 2, stemTop, { width: 4, height: stemBottom - stemTop, background: INK })}
      />
      {marker}
      <div
        style={abs(alignRight ? x + 2 - width : x - 2, above ? 320 : AXIS_Y + 112, {
          width,
          textAlign: alignRight ? 'right' : 'left',
        })}
      >
        <div style={{ ...LABEL, ...NUM, fontSize: 18 }}>{date}</div>
        <div style={{ ...DISPLAY, fontSize: 34, lineHeight: 1, marginTop: 14 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.35, marginTop: 12 }}>
          {detail}
        </div>
      </div>
    </>
  );
};

const Timeline: Page = () => {
  const sign = mx(0, 30, 30);
  const announce = mx(3, 10, 28);
  const lineup = mx(4, 4, 31);
  const buildFrom = mx(6, 18, 31);
  const festival = mx(7, 12, 30);
  const report = mx(10, 15, 30);
  return (
    <Poster bg={PAPER} footer={<Footer />}>
      <Kicker n="03">Parceria · Timeline</Kicker>
      <Heading top={160} size={72}>
        Six months to the gates.
      </Heading>
      <div style={abs(T0, AXIS_Y, { width: 1680, height: 40, background: INK })} />
      <MonthTick m={0} label="Nov" />
      <MonthTick m={1} label="Dec" />
      <MonthTick m={2} label="Jan" />
      <MonthTick m={3} label="Feb" />
      <MonthTick m={4} label="Mar" />
      <MonthTick m={5} label="Apr" />
      <MonthTick m={6} label="May" />
      <MonthTick m={7} label="Jun" />
      <MonthTick m={8} label="Jul" />
      <MonthTick m={9} label="Aug" />
      <MonthTick m={10} label="Sep" />
      <div style={abs(T0, AXIS_Y + 56, { ...LABEL, ...NUM, fontSize: 16 })}>2026</div>
      <div style={abs(Math.round(T0 + 2 * PX_M), AXIS_Y + 56, { ...LABEL, ...NUM, fontSize: 16 })}>
        2027
      </div>
      <Steps>
        <Step duration={280}>
          <Milestone
            x={sign}
            above
            date="30 Nov 2026"
            title="Sign"
            detail="Contract and exclusivity locked."
            marker={
              <div
                style={abs(sign - 28, AXIS_Y - 56, { width: 56, height: 56, background: INK })}
              />
            }
          />
        </Step>
        <Step duration={280}>
          <Milestone
            x={announce}
            date="10 Feb 2027"
            title="Announce"
            detail="Brisa named headline partner."
            marker={<HalfDisc cx={announce} cy={AXIS_Y} r={44} facing="up" color={COBALT} />}
          />
        </Step>
        <Step duration={280}>
          <Milestone
            x={lineup}
            above
            date="04 Mar 2027"
            title="Line-up"
            detail="Full bill drops, co-branded."
            marker={
              <div
                style={abs(lineup - 36, AXIS_Y - 72, {
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  boxSizing: 'border-box',
                  background: YELLOW,
                  border: '6px solid #111111',
                })}
              />
            }
          />
        </Step>
        <Step duration={280}>
          <Milestone
            x={buildFrom}
            date="18 May — 10 Jun"
            title="Build"
            detail="Cúpula and taps go in."
            width={260}
            marker={
              <div
                style={abs(buildFrom, AXIS_Y - 48, {
                  width: festival - buildFrom,
                  height: 48,
                  background: BRISA_FILL,
                })}
              />
            }
          />
        </Step>
        <Step duration={280}>
          <Milestone
            x={festival}
            above
            date="11 — 13 Jun 2027"
            title="Pulso"
            detail="128,000 people, four stages."
            marker={
              <div
                style={abs(festival - 60, AXIS_Y - 120, {
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: RED,
                })}
              />
            }
          />
        </Step>
        <Step duration={280}>
          <Milestone
            x={report}
            date="15 Sep 2027"
            title="Report"
            detail="Audited reach and refills."
            width={300}
            alignRight
            marker={
              <div
                style={abs(report - 64, AXIS_Y - 64, {
                  width: 64,
                  height: 64,
                  background: INK,
                  borderTopLeftRadius: 64,
                })}
              />
            }
          />
        </Step>
      </Steps>
    </Poster>
  );
};

const Close: Page = () => (
  <Poster bg={RED}>
    <div
      style={abs(0, 600, {
        width: 480,
        height: 480,
        background: YELLOW,
        borderTopRightRadius: 480,
      })}
    />
    <div
      style={abs(580, 0, {
        width: 400,
        height: 200,
        background: COBALT,
        borderRadius: '0 0 200px 200px',
      })}
    />
    <div style={abs(1000, 0, { width: 40, height: 552, background: INK })} />
    <div
      style={abs(1040, 80, { width: 760, height: 760, borderRadius: '50%', background: PAPER })}
    />
    <div style={abs(120, 96, { ...LABEL })}>Obrigado</div>
    <div
      style={abs(120, 136, {
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
      })}
    >
      Let's make
      <br />
      some noise.
    </div>
    <h2
      style={{
        ...DISPLAY,
        ...abs(108, capTop(600, 180, 0.86)),
        fontSize: 180,
        lineHeight: 0.86,
        letterSpacing: '-0.03em',
      }}
    >
      Vamos fazer
      <br />
      barulho.
    </h2>
    <div style={abs(120, 300, { width: 440, fontSize: 26, fontWeight: 500, lineHeight: 1.45 })}>
      <div style={{ fontWeight: 800 }}>Inês Duarte</div>
      <div>Head of Partnerships</div>
      <div>partners@pulso.pt</div>
    </div>
    <div style={abs(120, 960, { ...LABEL, lineHeight: 1.6 })}>
      Pulso Lisboa 2027
      <br />
      11—13 Junho · Parque Tejo
    </div>
  </Poster>
);

Cover.transition = morphTransition;
Audience.transition = morphTransition;

export const meta: SlideMeta = {
  title: 'Pulso Lisboa 2027 — Partnership proposal',
  createdAt: '2026-10-11T11:45:48.190Z',
};

export const notes: (string | undefined)[] = [
  `Open on the poster and let it sit for a beat.
"This is PULSO, the sixth edition: three days on the river in Lisbon, 11 to 13 June 2027."
"We've put this together for Brisa specifically, and we'll show you why the fit is so good." Click.`,
  `The circle grows into the crowd. Wait for it to land.
"One hundred and twenty-eight thousand people over three days. That's the capped capacity for 2027."
Then the three supporting numbers: sold out in 41 days last year, 37 percent international, average age 27.`,
  `"This didn't happen overnight." Walk left to right along the circles.
"Thirty-four thousand in 2022. Sixty-one. Eighty-eight. A hundred and nine. A hundred and twenty-one last year."
Point at the dashed ring: "2027 is capped at 128,000. Demand is ahead of supply, which is exactly where a partner wants to be."`,
  `"Who are they?" Left: "Three quarters are between 18 and 34. The biggest group is 25 to 34, the people building their brand habits now."
Right: "Sixty-three percent Portuguese, forty-one percent from greater Lisbon. And thirty-seven percent travel in, mostly from Spain, the UK and France."`,
  `Short pause. "Let's walk the site."`,
  `"Parque Tejo, on the river. Four stages, drawn here at a size that matches their capacity."
"Palco Tejo holds forty-five thousand; Rio Club, on the water, three thousand."
Point to the striped circle: "This is the Brisa zone, right at the metro gate, where most of the crowd arrives. The blue dotted line is the refill line."`,
  `"Here's a Saturday." Trace the rows.
"Music from four in the afternoon to four in the morning, staggered so the main stages never clash at the top of the bill."
Point to the striped bars: "Brisa is present all day: the Cúpula through the afternoon heat, refills the whole time, the Night Line from midnight."`,
  `Short pause. "So, how do we work together?"`,
  `"Three tiers, seven partners in total, one per category."
Click: "Headline partner, 1.2 million euros. There's one. This is what we're proposing for Brisa."
Click: "Stage partner, 450 thousand, two available."
Click: "Supporting partner, 150 thousand, four available."`,
  `"Three things Brisa does on site, all of them useful to people, not just signage."
"The Cúpula: shade and 32 misting stations by the metro gate."
"The Linha de Recarga: 60 free refill taps, about 410,000 refills, around 120,000 plastic bottles that never get made."
"And the Night Line: a free shuttle to Cais do Sodré every twelve minutes after midnight."`,
  `"What does Brisa get back? Forty-six million projected impressions, March to June."
"Eighteen million on our own social, fourteen million through RTP and the YouTube live stream, nine million in outdoor across Lisbon, five in press."
"Plus direct access to 410,000 ticket buyers in our CRM."`,
  `"Here's how we get there." Click through each milestone.
"Sign by the end of November. Announce Brisa in February, a month before the line-up drops on co-branded media."
"Build from mid-May, festival 11 to 13 June, and an audited impact report in September."`,
  `"Vamos fazer barulho. Let's make some noise."
"Inês Duarte leads partnerships; she'll follow up this week with the full deliverables schedule."
Hold on this page for questions.`,
];

export default [
  Cover,
  Audience,
  Growth,
  WhoComes,
  SiteDivider,
  SitePlan,
  Schedule,
  PartnershipDivider,
  Tiers,
  Activations,
  Reach,
  Timeline,
  Close,
] satisfies Page[];

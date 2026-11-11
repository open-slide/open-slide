import {
  type Page,
  type SlideTransition,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useId } from 'react';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=Newsreader:ital,opsz,wght@1,6..72,400&display=swap';
const FONT_LINK_ID = 'osd-webfont-theme-fieldwork';
const STYLE_ID = 'osd-styles-theme-fieldwork';
const KEYFRAMES = `
@keyframes fw-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes fw-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes fw-rise { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes fw-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
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

const SANS = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif';
const SERIF = '"Newsreader", "Iowan Old Style", Georgia, serif';

const BG = '#FFFEFC';
const INK = '#191919';
const CORAL = '#E8553B';
const BODY = '#5F5E5B';
const SOFT = '#9B9A97';
const RULE = 'rgba(25,25,25,0.12)';

const YELLOW = '#F8DA7E';
const BLUE = '#8DBDEB';
const PINK = '#F6C3CF';
const GREEN = '#A6D4B2';

const TINT_YELLOW = '#FBF3DB';
const TINT_BLUE = '#E7F3F8';
const TINT_GREEN = '#EDF3EC';

const X0 = 120;

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(5px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const abs = (left: number, top: number, width?: number, height?: number): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
});

const root: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: BG,
  color: INK,
  fontFamily: SANS,
  fontVariantNumeric: 'tabular-nums',
  WebkitFontSmoothing: 'antialiased',
};

const Title = ({ children }: { children: ReactNode }) => (
  <h1
    style={{
      margin: 0,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
      fontSize: 150,
      fontWeight: 780,
      lineHeight: 1,
      letterSpacing: '-0.04em',
      wordSpacing: '0.08em',
      color: '#191919',
    }}
  >
    {children}
  </h1>
);

const Heading = ({ children, size = 104 }: { children: ReactNode; size?: number }) => (
  <h2
    style={{
      margin: 0,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
      fontSize: size,
      fontWeight: 780,
      lineHeight: 1,
      letterSpacing: size >= 100 ? '-0.04em' : '-0.03em',
      wordSpacing: '0.08em',
      color: '#191919',
    }}
  >
    {children}
  </h2>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
      fontSize: 26,
      fontWeight: 650,
      letterSpacing: '-0.01em',
      color: '#E8553B',
    }}
  >
    {children}
  </div>
);

const Mark = ({ size = 24 }: { size?: number }) => (
  <svg
    aria-hidden="true"
    width={size * 0.8}
    height={size}
    viewBox="0 0 20 25"
    style={{ display: 'block' }}
  >
    <path
      d="M10 24C8.5 20 1.5 15 1.5 9.5a8.5 8.5 0 0 1 17 0C18.5 15 11.5 20 10 24Z"
      fill="#191919"
    />
    <circle cx="10" cy="9.5" r="3.4" fill="#FFFEFC" />
  </svg>
);

const Footer = ({
  brand = 'Fieldwork',
  label = 'Operating plan',
}: {
  brand?: string;
  label?: string;
}) => {
  const { current, total } = useSlidePageNumber();
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 1000,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
        fontSize: 21,
        color: '#9B9A97',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Mark size={24} />
        <span style={{ color: '#191919', fontWeight: 720, letterSpacing: '-0.02em' }}>{brand}</span>
        <span style={{ marginLeft: 12 }}>{label}</span>
      </span>
      <span>
        {pad2(current)} / {pad2(total)}
      </span>
    </div>
  );
};

const Highlight = ({ children, color = '#FCE38A' }: { children: ReactNode; color?: string }) => (
  <span
    style={{
      background: color,
      borderRadius: '6px 12px 8px 14px',
      padding: '0 6px',
      margin: '0 -2px',
      color: '#191919',
      WebkitBoxDecorationBreak: 'clone',
      boxDecorationBreak: 'clone',
    }}
  >
    {children}
  </span>
);

const TintCard = ({
  tint = '#E7F3F8',
  style,
  children,
}: {
  tint?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    style={{
      position: 'relative',
      boxSizing: 'border-box',
      borderRadius: 24,
      background: tint,
      padding: '34px 44px 32px',
      ...style,
    }}
  >
    {children}
  </div>
);

const Ink = ({
  width,
  height,
  viewBox,
  style,
  wobble = 2.2,
  children,
}: {
  width: number;
  height: number;
  viewBox?: string;
  style?: CSSProperties;
  wobble?: number;
  children: ReactNode;
}) => {
  const id = `fw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={viewBox ?? `0 0 ${width} ${height}`}
      fill="none"
      stroke="#191919"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={wobble} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </svg>
  );
};

const Stroke = ({
  d,
  live,
  delay = 0.3,
  dur = 0.7,
  color = '#191919',
  width = 3.2,
}: {
  d: string;
  live: boolean;
  delay?: number;
  dur?: number;
  color?: string;
  width?: number;
}) => (
  <path
    d={d}
    pathLength={1}
    strokeDasharray={1}
    stroke={color}
    strokeWidth={width}
    fill="none"
    style={{
      animation: live ? `fw-draw ${dur}s cubic-bezier(0, 0, 0.2, 1) ${delay}s both` : undefined,
    }}
  />
);

const loopPath = (w: number, h: number) => {
  const p = (x: number, y: number) => `${((x * w) / 100).toFixed(1)} ${((y * h) / 100).toFixed(1)}`;
  return `M${p(30, 8)}C${p(55, 2)} ${p(90, 8)} ${p(96, 40)}C${p(100, 70)} ${p(72, 94)} ${p(42, 93)}C${p(14, 92)} ${p(2, 74)} ${p(4, 50)}C${p(6, 26)} ${p(26, 10)} ${p(56, 5)}`;
};

const CircleDoodle = ({
  x,
  y,
  w,
  h,
  live,
  color = '#E8553B',
  delay = 0.4,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  live: boolean;
  color?: string;
  delay?: number;
}) => (
  <Ink width={w} height={h} wobble={1.6} style={{ position: 'absolute', left: x, top: y }}>
    <Stroke d={loopPath(w, h)} color={color} width={3.6} live={live} delay={delay} dur={0.8} />
  </Ink>
);

const Sparkle = ({
  x,
  y,
  s = 1,
  fill = '#F8DA7E',
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -20Q3 -3 20 0Q3 3 0 20Q-3 3 -20 0Q-3 -3 0 -20Z"
    fill={fill}
    strokeWidth={3 / s}
  />
);

const pinPath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy + 2.4 * r}C${cx - 0.25 * r} ${cy + 1.7 * r} ${cx - r} ${cy + 1.1 * r} ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}C${cx + r} ${cy + 1.1 * r} ${cx + 0.25 * r} ${cy + 1.7 * r} ${cx} ${cy + 2.4 * r}Z`;

const CoverArt = () => (
  <Ink width={880} height={700} style={abs(940, 150)}>
    <circle cx="470" cy="330" r="250" fill={YELLOW} stroke="none" />
    <g transform="translate(150 40) scale(1.1)">
      <rect
        x="170"
        y="110"
        width="250"
        height="310"
        rx="6"
        fill="#FFFFFF"
        transform="rotate(-9 295 265)"
      />
      <rect
        x="170"
        y="110"
        width="250"
        height="310"
        rx="6"
        fill="#FFFFFF"
        transform="rotate(6 295 265)"
      />
      <g transform="rotate(-2 300 280)">
        <rect x="170" y="120" width="260" height="320" rx="6" fill="#FFFFFF" />
        <path
          d="M170 170H430M170 220H430M170 270H430M170 320H430M170 370H430M250 120V440M340 120V440"
          strokeWidth={2.4}
        />
        <rect x="252" y="172" width="86" height="46" fill={PINK} stroke="none" />
        <path d="M190 196h40M270 246h50M360 296h46M190 346h36M272 396h44" strokeWidth={2.6} />
      </g>
      <g transform="translate(372 410) rotate(-38)">
        <rect x="0" y="-13" width="210" height="26" rx="3" fill={BLUE} />
        <path d="M0 -13L-36 0L0 13Z" fill="#FFFFFF" />
        <path d="M-36 0L-24 -4.3L-24 4.3Z" fill={INK} />
        <rect x="210" y="-13" width="28" height="26" rx="5" fill={PINK} />
        <path d="M206 -13V13" />
      </g>
    </g>
    <path d={pinPath(690, 120, 52)} fill={CORAL} />
    <circle cx="690" cy="120" r="19" fill="#FFFFFF" />
    <Sparkle x={790} y={250} s={1.1} />
    <Sparkle x={250} y={110} s={0.7} fill="#FFFFFF" />
    <Sparkle x={190} y={540} s={0.9} />
    <path d="M60 640Q300 635 560 639T860 638" />
  </Ink>
);

const House = ({ x, y, fill = '#FFFFFF' }: { x: number; y: number; fill?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-32 0L-32 -40L0 -66L32 -40L32 0Z" fill={fill} />
    <path d="M-9 0L-9 -22L9 -22L9 0" />
  </g>
);

const BranchesArt = () => (
  <Ink width={300} height={200}>
    <path d="M150 92L62 140M150 92L150 132M150 92L238 140" strokeDasharray="0.1 11" />
    <House x={56} y={186} />
    <House x={150} y={186} fill={YELLOW} />
    <House x={244} y={186} />
    <path d={pinPath(150, 36, 22)} fill={CORAL} />
    <circle cx="150" cy="36" r="8" fill="#FFFFFF" />
  </Ink>
);

const PaymentsArt = () => (
  <Ink width={300} height={200}>
    <rect x="70" y="24" width="96" height="168" rx="18" fill="#FFFFFF" />
    <path d="M104 42h28" />
    <circle cx="118" cy="112" r="24" fill={GREEN} />
    <path d="M107 112l7 7 14-15" strokeWidth={3.4} />
    <g transform="rotate(-14 222 84)">
      <rect x="166" y="52" width="118" height="72" rx="10" fill={YELLOW} />
      <path d="M166 74h118" strokeWidth={6} />
      <path d="M184 104h34" />
    </g>
  </Ink>
);

const OfflineArt = () => (
  <Ink width={300} height={200}>
    <rect x="60" y="24" width="96" height="168" rx="18" fill="#FFFFFF" />
    <path d="M94 42h28" />
    <path d="M80 82h56M80 104h44M80 126h52" strokeWidth={2.6} />
    <rect x="80" y="144" width="56" height="26" rx="6" fill={PINK} />
    <path d="M196 118Q190 92 216 90Q226 66 252 76Q278 72 278 98Q296 102 290 120Z" fill="#FFFFFF" />
    <path d="M196 140L292 66" stroke={CORAL} strokeWidth={4} />
  </Ink>
);

const ToolboxArt = () => (
  <Ink width={720} height={500} style={abs(1080, 300)}>
    <circle cx="370" cy="260" r="215" fill={YELLOW} stroke="none" />
    <path d="M180 214Q180 170 236 168Q292 170 292 212" />
    <path d="M202 216Q202 190 236 189Q270 190 270 214" />
    <path d="M122 250L470 246L462 420Q461 432 449 432L136 434Q124 434 123 422Z" fill={CORAL} />
    <path d="M110 216L482 212L478 252L114 255Z" fill={CORAL} />
    <rect x="276" y="244" width="44" height="30" rx="5" fill="#FFFFFF" />
    <g transform="translate(440 178) scale(1.2)">
      <path d="M110 70Q100 58 110 46Q120 34 110 22M146 72Q136 60 146 48Q156 36 146 24" />
      <path
        d="M70 92Q69 87.5 74 87.5L177 87Q182 87 181.5 92L176.5 196Q175.5 214 157 214L95 214.5Q76.5 214.5 75.5 197Z"
        fill="#FFFFFF"
      />
      <path d="M73.4 142L179 141L178 161.5L74.4 162.5Z" fill={BLUE} stroke="none" />
      <path d="M70 92Q69 87.5 74 87.5L177 87Q182 87 181.5 92L176.5 196Q175.5 214 157 214L95 214.5Q76.5 214.5 75.5 197Z" />
      <path d="M181 116Q214 113 213.5 142Q213 171 177.5 171.5M180 130Q199 129.5 199 143Q198.5 157 178.5 158" />
    </g>
    <path d="M40 436Q300 431 560 435T710 434" />
  </Ink>
);

const Cover: Page = () => (
  <div style={root}>
    <div style={{ ...abs(X0, 100), display: 'flex', alignItems: 'center', gap: 14 }}>
      <Mark size={32} />
      <span style={{ fontSize: 30, fontWeight: 760, letterSpacing: '-0.03em' }}>Fieldwork</span>
    </div>
    <div style={abs(X0, 262)}>
      <Title>
        The annual
        <br />
        operating
        <br />
        plan.
      </Title>
    </div>
    <p style={{ ...abs(X0, 772, 760), margin: 0, fontSize: 34, lineHeight: 1.45, color: BODY }}>
      Where we are, where we are going, and <Highlight>who owns each step</Highlight>.
    </p>
    <div style={{ ...abs(X0, 906), fontSize: 24, color: SOFT }}>
      All-hands pre-read · Planning team
    </div>
    <CoverArt />
    <Footer />
  </div>
);

const BetCard = ({
  x,
  tint,
  index,
  art,
  title,
  body,
  metric,
  from,
  to,
}: {
  x: number;
  tint: string;
  index: string;
  art: ReactNode;
  title: string;
  body: string;
  metric: string;
  from: string;
  to: string;
}) => (
  <TintCard
    tint={tint}
    style={{ ...abs(x, 330, 536, 610), display: 'flex', flexDirection: 'column' }}
  >
    <div style={{ marginLeft: -8 }}>{art}</div>
    <div style={{ marginTop: 28, fontSize: 22, fontWeight: 700, color: SOFT }}>{index}</div>
    <div style={{ marginTop: 8 }}>
      <Heading size={54}>{title}</Heading>
    </div>
    <p style={{ margin: '20px 0 0', fontSize: 28, lineHeight: 1.45, color: BODY }}>{body}</p>
    <div style={{ marginTop: 'auto', fontSize: 22, color: SOFT }}>{metric}</div>
    <div
      style={{
        marginTop: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontSize: 40,
        fontWeight: 760,
      }}
    >
      <span style={{ color: SOFT, fontWeight: 500 }}>{from}</span>
      <span style={{ color: SOFT, fontWeight: 400 }}>→</span>
      <span style={{ letterSpacing: '-0.03em' }}>{to}</span>
    </div>
  </TintCard>
);

const Content: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={root}>
      <div style={abs(X0, 116)}>
        <Eyebrow>Strategy</Eyebrow>
      </div>
      <div style={abs(X0, 160)}>
        <Heading>Three bets this year.</Heading>
      </div>
      <div style={{ ...abs(1220, 196, 580), fontSize: 28, lineHeight: 1.45, color: BODY }}>
        Each answers a lesson from last year, and <Highlight>each moves one number</Highlight>.
      </div>
      <BetCard
        x={120}
        tint={TINT_BLUE}
        index="01"
        art={<BranchesArt />}
        title="Expansion"
        body="One workspace across every site, with a shared team pool."
        metric="Net revenue retention · Product"
        from="109%"
        to="116%"
      />
      <BetCard
        x={692}
        tint={TINT_GREEN}
        index="02"
        art={<PaymentsArt />}
        title="Payments"
        body="Collect on the spot, so invoices stop sitting for 30 days."
        metric="Payments attach rate · Finance"
        from="22%"
        to="40%"
      />
      <BetCard
        x={1264}
        tint={TINT_YELLOW}
        index="03"
        art={<OfflineArt />}
        title="Offline"
        body="Forms and photos work with no signal, then sync."
        metric="Crash-free sessions · Engineering"
        from="99.2%"
        to="99.8%"
      />
      <CircleDoodle x={710} y={834} w={300} h={104} live={live} delay={0.5} />
      <Footer />
    </div>
  );
};

const Closer: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={root}>
      <div style={abs(X0, 140)}>
        <Heading size={130}>
          Thanks for
          <br />
          reading.
        </Heading>
      </div>
      <Ink width={540} height={40} style={abs(X0, 398)}>
        <Stroke d="M6 22C120 10 260 30 400 16S510 12 532 16" color={CORAL} live={live} />
      </Ink>
      <div style={{ ...abs(X0, 460), fontSize: 34, color: BODY }}>
        Comments stay open until the plan locks.
      </div>
      <div style={{ ...abs(X0, 548, 900), borderTop: `1.5px solid ${RULE}` }} />
      <blockquote
        style={{
          ...abs(X0, 590, 900),
          margin: 0,
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 66,
          lineHeight: 1.16,
          letterSpacing: '-0.01em',
        }}
      >
        “Write the plan so the newest person on the team could run it.”
      </blockquote>
      <div style={{ ...abs(X0, 790), fontSize: 26, color: BODY }}>
        <span style={{ color: INK, fontWeight: 650 }}>Planning team</span>, house rule
      </div>
      <ToolboxArt />
      <Footer label="Thank you" />
    </div>
  );
};

export default [Cover, Content, Closer];

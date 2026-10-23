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
import { type CSSProperties, type ReactNode, useId } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#FFFEFC', text: '#191919', accent: '#E8553B' },
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  },
  typeScale: { hero: 150, body: 34 },
  radius: 24,
};

const SLIDE_ID = 'fieldwork-fy27-plan';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=Newsreader:ital,opsz,wght@1,6..72,400&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
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

const INK = 'var(--osd-text)';
const RED = 'var(--osd-accent)';
const INK_HEX = '#191919';
const RED_HEX = '#E8553B';
const BODY = '#5F5E5B';
const SOFT = '#9B9A97';
const RULE = 'rgba(25,25,25,0.12)';
const SERIF = '"Newsreader", "Iowan Old Style", Georgia, serif';

const YELLOW = '#F8DA7E';
const BLUE = '#8DBDEB';
const PINK = '#F6C3CF';
const GREEN = '#A6D4B2';
const HIGHLIGHT = '#FCE38A';

const TINT_YELLOW = '#FBF3DB';
const TINT_BLUE = '#E7F3F8';
const TINT_PINK = '#FAF1F5';
const TINT_GREEN = '#EDF3EC';

const X0 = 120;
const W = 1680;

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 760;

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(5px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const morphTransition: SlideTransition = {
  duration: 280,
  exit: { duration: 300, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 300, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const abs = (left: number, top: number, width?: number, height?: number): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
});

const row: CSSProperties = { display: 'flex', alignItems: 'center' };

const root: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: INK,
  fontFamily: 'var(--osd-font-body)',
  fontVariantNumeric: 'tabular-nums',
  WebkitFontSmoothing: 'antialiased',
};

const headline = (size: number): CSSProperties => ({
  margin: 0,
  fontFamily: 'var(--osd-font-display)',
  fontSize: size,
  fontWeight: 780,
  lineHeight: 1.0,
  letterSpacing: size >= 100 ? '-0.04em' : '-0.03em',
  wordSpacing: '0.08em',
});

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
      aria-hidden
      width={width}
      height={height}
      viewBox={viewBox ?? `0 0 ${width} ${height}`}
      fill="none"
      stroke={INK_HEX}
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
  color = INK_HEX,
  width = 3.2,
  fill = 'none',
}: {
  d: string;
  live: boolean;
  delay?: number;
  dur?: number;
  color?: string;
  width?: number;
  fill?: string;
}) => (
  <path
    d={d}
    pathLength={1}
    strokeDasharray={1}
    stroke={color}
    strokeWidth={width}
    fill={fill}
    style={{ animation: live ? `fw-draw ${dur}s ${EASE_OUT} ${delay}s both` : undefined }}
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
  color = RED_HEX,
  live,
  delay = 0.4,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  live: boolean;
  delay?: number;
}) => (
  <Ink width={w} height={h} style={abs(x, y)} wobble={1.6}>
    <Stroke d={loopPath(w, h)} color={color} width={3.6} live={live} delay={delay} dur={0.8} />
  </Ink>
);

const Sparkle = ({
  x,
  y,
  s = 1,
  fill = YELLOW,
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

const Highlight = ({ children, color = HIGHLIGHT }: { children: ReactNode; color?: string }) => (
  <span
    style={{
      background: color,
      borderRadius: '6px 12px 8px 14px',
      padding: '0 6px',
      margin: '0 -2px',
      color: INK,
      WebkitBoxDecorationBreak: 'clone',
      boxDecorationBreak: 'clone',
    }}
  >
    {children}
  </span>
);

const Mark = ({ size = 24 }: { size?: number }) => (
  <svg
    aria-hidden
    width={size * 0.8}
    height={size}
    viewBox="0 0 20 25"
    style={{ display: 'block' }}
  >
    <path
      d="M10 24C8.5 20 1.5 15 1.5 9.5a8.5 8.5 0 0 1 17 0C18.5 15 11.5 20 10 24Z"
      fill={INK_HEX}
    />
    <circle cx="10" cy="9.5" r="3.4" fill="#FFFEFC" />
  </svg>
);

const pad2 = (n: number) => String(n).padStart(2, '0');

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        ...abs(X0, 1000, W, 32),
        ...row,
        justifyContent: 'space-between',
        fontSize: 21,
        color: SOFT,
      }}
    >
      <span style={{ ...row, gap: 12 }}>
        <Mark size={24} />
        <span style={{ color: INK, fontWeight: 720, letterSpacing: '-0.02em' }}>Fieldwork</span>
        <span style={{ marginLeft: 12 }}>FY27 Operating Plan</span>
      </span>
      <span>
        {pad2(current)} / {pad2(total)}
      </span>
    </div>
  );
};

const Frame = ({ children }: { children: ReactNode }) => (
  <div style={root}>
    {children}
    <Footer />
  </div>
);

const Eyebrow = ({ children, top = 116 }: { children: ReactNode; top?: number }) => (
  <div
    style={{ ...abs(X0, top), fontSize: 26, fontWeight: 650, color: RED, letterSpacing: '-0.01em' }}
  >
    {children}
  </div>
);

const Van = ({ transform }: { transform: string }) => (
  <g transform={transform}>
    <path d="M34 18.5Q92 16 158 18M34 9Q92 6.5 158 8.5" />
    <path d="M50 9v9M74 8.2v9M98 7.6v9M122 7.8v9M146 8.4v9M46 18v12M146 18v12" />
    <path
      d="M14 36Q14 30.5 20 30.5L182 29.5Q190 29.5 194.5 35L222 70Q225.5 74.5 233 75.5L258 79Q268.5 80.5 268.5 91L269 118Q269 125 262 125L233 125A26 26 0 0 0 181 125L97 125A26 26 0 0 0 45 125L20 125Q13 125 13 118Z"
      fill="#FFFFFF"
    />
    <path d="M17 88L175 87L175 101L17 102Z" fill={RED_HEX} stroke="none" />
    <path d="M14 36Q14 30.5 20 30.5L182 29.5Q190 29.5 194.5 35L222 70Q225.5 74.5 233 75.5L258 79Q268.5 80.5 268.5 91L269 118Q269 125 262 125L233 125A26 26 0 0 0 181 125L97 125A26 26 0 0 0 45 125L20 125Q13 125 13 118Z" />
    <path d="M176 32Q177.5 78 176 122" />
    <path d="M188 41L213 69.5L189 70.5Z" fill={TINT_BLUE} />
    <path d="M161 79.5h9M253 112.5h14M261 88.5q4.5.5 4.5 5" />
    <circle cx="71" cy="125" r="19" fill="#FFFFFF" />
    <circle cx="71" cy="125" r="5.5" />
    <circle cx="207" cy="125" r="19" fill="#FFFFFF" />
    <circle cx="207" cy="125" r="5.5" />
  </g>
);

const pinPath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy + 2.4 * r}C${cx - 0.25 * r} ${cy + 1.7 * r} ${cx - r} ${cy + 1.1 * r} ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}C${cx + r} ${cy + 1.1 * r} ${cx + 0.25 * r} ${cy + 1.7 * r} ${cx} ${cy + 2.4 * r}Z`;

const Figure = ({ x, y, shirt }: { x: number; y: number; shirt: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-34 -86L-30 -4L-6 -4L0 -58L6 -4L30 -4L34 -86Z" fill={INK_HEX} />
    <path d="M-30 -3L-40 -2M30 -3L40 -2" />
    <path d="M-32 -160Q0 -171 32 -160L38 -84L-38 -84Z" fill={shirt} />
    <path d="M-31 -155Q-52 -120 -42 -90" />
    <path d="M31 -155Q54 -132 30 -112" />
    <path d="M4 -144L38 -148L42 -100L8 -96Z" fill="#FFFFFF" />
    <path d="M16 -136h16M17 -124h14M18 -112h9" strokeWidth={2.4} />
    <path d="M0 -175L0 -163" />
    <circle cx="0" cy="-202" r="27" fill="#FFFFFF" />
    <path
      d="M-28 -202Q-31 -233 0 -233Q31 -233 28 -205Q18 -216 2 -213Q-14 -213 -28 -202Z"
      fill={INK_HEX}
    />
    <circle cx="-9" cy="-198" r="2.6" fill={INK_HEX} stroke="none" />
    <circle cx="9" cy="-198" r="2.6" fill={INK_HEX} stroke="none" />
    <path d="M-7 -186Q0 -181 7 -186" strokeWidth={2.6} />
  </g>
);

const CoverArt = () => (
  <Ink width={880} height={700} style={abs(940, 150)}>
    <circle cx="470" cy="330" r="250" fill={YELLOW} stroke="none" />
    <path d={pinPath(560, 150, 70)} fill={RED_HEX} />
    <circle cx="560" cy="150" r="26" fill="#FFFFFF" />
    <path d="M520 556C610 530 560 420 600 380S566 330 560 326" strokeDasharray="0.1 14" />
    <Sparkle x={690} y={118} s={1.1} />
    <Sparkle x={420} y={96} s={0.7} fill="#FFFFFF" />
    <Van transform="translate(80 392) scale(1.55)" />
    <Figure x={780} y={606} shirt={BLUE} />
    <path d="M30 608Q300 603 560 607T860 606" />
  </Ink>
);

const Cover: Page = () => {
  return (
    <Frame>
      <div style={{ ...abs(X0, 100), ...row, gap: 14 }}>
        <Mark size={32} />
        <span style={{ fontSize: 30, fontWeight: 760, letterSpacing: '-0.03em' }}>Fieldwork</span>
      </div>
      <h1 style={{ ...abs(X0, 262), ...headline(150), fontSize: 'var(--osd-size-hero)' }}>
        The FY27
        <br />
        operating
        <br />
        plan.
      </h1>
      <p
        style={{
          ...abs(X0, 772, 760),
          margin: 0,
          fontSize: 34,
          lineHeight: 1.45,
          color: BODY,
        }}
      >
        How we get from $28.6M to <Highlight>$40.0M ARR</Highlight>, and who does what.
      </p>
      <div style={{ ...abs(X0, 906), fontSize: 24, color: SOFT }}>
        All-hands and board pre-read · January 14, 2027 · Maya Lindqvist, CEO
      </div>
      <CoverArt />
    </Frame>
  );
};

const BigNumber = ({
  x,
  value,
  label,
  sub,
}: {
  x: number;
  value: string;
  label: string;
  sub: string;
}) => (
  <div style={abs(x, 600, 520)}>
    <div style={{ ...headline(140), letterSpacing: '-0.05em' }}>{value}</div>
    <div style={{ marginTop: 34, fontSize: 30, fontWeight: 680 }}>{label}</div>
    <div style={{ marginTop: 8, fontSize: 26, color: BODY }}>{sub}</div>
  </div>
);

const Summary: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame>
      <Eyebrow>TL;DR</Eyebrow>
      <h2 style={{ ...abs(X0, 160), ...headline(104) }}>The plan, on one page.</h2>
      <p
        style={{
          ...abs(X0, 318, 1240),
          margin: 0,
          fontSize: 34,
          lineHeight: 1.5,
          color: BODY,
        }}
      >
        FY26 closed ahead of plan on ARR, but <Highlight>larger crews outgrew us</Highlight> and
        retention missed. FY27 fixes that with three bets, and grows Fieldwork to $40.0M ARR and 186
        people at a 1.1× burn multiple.
      </p>
      <BigNumber x={X0} value="$40.0M" label="ARR by December 31" sub="from $28.6M, up 40%" />
      <BigNumber x={700} value="116%" label="Net revenue retention" sub="from 109%, up 7 points" />
      <BigNumber x={1280} value="186" label="People on the team" sub="from 142, 44 new roles" />
      <CircleDoodle x={52} y={560} w={660} h={232} live={live} />
      <Ink width={400} height={50} style={abs(694, 730)}>
        <Stroke
          d="M6 30C90 14 180 34 260 20S360 14 392 18"
          color="#3E7FCF"
          live={live}
          delay={0.7}
        />
        <Stroke
          d="M40 42C120 30 220 44 330 32"
          color="#3E7FCF"
          live={live}
          delay={0.95}
          width={2.6}
        />
      </Ink>
      <Ink width={160} height={130} style={abs(1520, 560)}>
        <Sparkle x={60} y={60} s={1.3} />
        <Sparkle x={124} y={24} s={0.7} />
        <Sparkle x={128} y={104} s={0.55} fill="#FFFFFF" />
      </Ink>
    </Frame>
  );
};

const CheckMark = ({ color = INK_HEX }: { color?: string }) => (
  <Ink width={30} height={30} wobble={1.4}>
    <path d="M5 16L12 23L26 6" stroke={color} strokeWidth={3.4} />
  </Ink>
);

const ScoreRow = ({
  top,
  metric,
  target,
  actual,
  status,
  miss = false,
}: {
  top: number;
  metric: string;
  target: string;
  actual: string;
  status: string;
  miss?: boolean;
}) => (
  <div style={{ ...abs(760, top, 1040, 124), borderTop: `1.5px solid ${RULE}` }}>
    <div style={{ ...abs(0, 26), fontSize: 34, fontWeight: 660, letterSpacing: '-0.015em' }}>
      {metric}
    </div>
    <div style={{ ...abs(0, 74), fontSize: 24, color: SOFT }}>Target {target}</div>
    <div
      style={{
        ...abs(560, 30, 260),
        textAlign: 'right',
        fontSize: 60,
        fontWeight: 760,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color: miss ? RED : INK,
      }}
    >
      {actual}
    </div>
    <div
      style={{
        ...abs(880, 44),
        ...row,
        gap: 12,
        fontSize: 26,
        fontWeight: 600,
        color: miss ? RED : BODY,
      }}
    >
      {miss ? null : <CheckMark />}
      {status}
    </div>
  </div>
);

const TallyBox = ({ x, miss = false, live }: { x: number; miss?: boolean; live: boolean }) => (
  <g transform={`translate(${x} 0)`}>
    <rect
      x="3"
      y="3"
      width="52"
      height="52"
      rx="9"
      fill={miss ? '#FFFFFF' : TINT_GREEN}
      strokeWidth={2.8}
    />
    {miss ? (
      <Stroke
        d="M17 17L41 41M41 17L17 41"
        color={RED_HEX}
        width={3.6}
        live={live}
        delay={0.9}
        dur={0.4}
      />
    ) : (
      <path d="M14 30L25 41L44 16" strokeWidth={3.4} />
    )}
  </g>
);

const Scorecard: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame>
      <Eyebrow>FY26 scorecard</Eyebrow>
      <h2 style={{ ...abs(X0, 160), ...headline(120), lineHeight: 0.98 }}>
        Five out
        <br />
        of six.
      </h2>
      <p
        style={{
          ...abs(X0, 440, 540),
          margin: 0,
          fontSize: 30,
          lineHeight: 1.5,
          color: BODY,
        }}
      >
        We beat on growth and efficiency. Retention missed, and that miss shapes most of FY27.
      </p>
      <Ink width={420} height={60} style={abs(X0, 640)}>
        <TallyBox x={0} live={live} />
        <TallyBox x={70} live={live} />
        <TallyBox x={140} live={live} />
        <TallyBox x={210} live={live} />
        <TallyBox x={280} live={live} />
        <TallyBox x={350} miss live={live} />
      </Ink>
      <ScoreRow top={150} metric="Ending ARR" target="$27.5M" actual="$28.6M" status="Beat" />
      <ScoreRow top={274} metric="New customers" target="1,150" actual="1,186" status="Hit" />
      <ScoreRow
        top={398}
        metric="Net revenue retention"
        target="115%"
        actual="109%"
        status="Missed by 6"
        miss
      />
      <ScoreRow top={522} metric="Gross margin" target="76.0%" actual="77.8%" status="Hit" />
      <ScoreRow top={646} metric="Logo churn" target="10% or less" actual="9.4%" status="Hit" />
      <ScoreRow
        top={770}
        metric="Burn multiple"
        target="1.3× or less"
        actual="1.1×"
        status="Beat"
      />
      <div style={{ ...abs(760, 894, 1040), borderTop: `1.5px solid ${RULE}` }} />
      <CircleDoodle x={1372} y={400} w={240} h={122} live={live} delay={0.5} />
    </Frame>
  );
};

const PapersArt = () => (
  <Ink width={620} height={540} style={abs(1180, 230)}>
    <circle cx="320" cy="270" r="215" fill={PINK} stroke="none" />
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
      <rect x="252" y="172" width="86" height="46" fill={YELLOW} stroke="none" />
      <path d="M190 196h40M270 246h50M360 296h46M190 346h36M272 396h44" strokeWidth={2.6} />
    </g>
    <g transform="translate(372 410) rotate(-38)">
      <rect x="0" y="-13" width="210" height="26" rx="3" fill={YELLOW} />
      <path d="M0 -13L-36 0L0 13Z" fill="#FFFFFF" />
      <path d="M-36 0L-24 -4.3L-24 4.3Z" fill={INK_HEX} />
      <rect x="210" y="-13" width="28" height="26" rx="5" fill={PINK} />
      <path d="M206 -13V13" />
    </g>
  </Ink>
);

const Lesson = ({ top, value, children }: { top: number; value: string; children: ReactNode }) => (
  <div style={{ ...abs(X0, top, 1080), display: 'flex', gap: 30 }}>
    <div style={{ width: 180, ...headline(64), letterSpacing: '-0.04em', lineHeight: 1.05 }}>
      {value}
    </div>
    <div style={{ flex: 1, fontSize: 30, lineHeight: 1.4, color: BODY, paddingTop: 8 }}>
      {children}
    </div>
  </div>
);

const Learnings: Page = () => (
  <Frame>
    <Eyebrow>What we learned</Eyebrow>
    <blockquote
      style={{
        ...abs(X0, 168, 1000),
        margin: 0,
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontSize: 66,
        lineHeight: 1.16,
        letterSpacing: '-0.01em',
      }}
    >
      “Once we passed 30 techs and a second branch, the office went back to spreadsheets.”
    </blockquote>
    <div style={{ ...abs(X0, 440), fontSize: 26, color: BODY }}>
      <span style={{ color: INK, fontWeight: 650 }}>Dana Ruiz</span>, Operations Director, Ruiz
      Mechanical · Phoenix, 42 techs
    </div>
    <div style={{ ...abs(X0, 530, 1000), borderTop: `1.5px solid ${RULE}` }} />
    <Lesson top={574} value="61%">
      of lost ARR came from 25+ tech accounts (38% of ARR).
    </Lesson>
    <Lesson top={694} value="14×">
      a day, technicians open the app. Office users: 3 times.
    </Lesson>
    <Lesson top={814} value="4.1%">
      logo churn with payments. Everyone else churns at 11.2%.
    </Lesson>
    <PapersArt />
  </Frame>
);

const House = ({
  x,
  y,
  s = 1,
  fill = '#FFFFFF',
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-32 0L-32 -40L0 -66L32 -40L32 0Z" fill={fill} strokeWidth={3.2 / s} />
    <path d="M-9 0L-9 -22L9 -22L9 0" strokeWidth={3.2 / s} />
  </g>
);

const BranchesArt = () => (
  <Ink width={300} height={200}>
    <path d="M150 92L62 140M150 92L150 132M150 92L238 140" strokeDasharray="0.1 11" />
    <House x={56} y={186} />
    <House x={150} y={186} fill={YELLOW} />
    <House x={244} y={186} />
    <path d={pinPath(150, 36, 22)} fill={RED_HEX} />
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
    <path d="M196 140L292 66" stroke={RED_HEX} strokeWidth={4} />
  </Ink>
);

const BetCard = ({
  x,
  tint,
  index,
  art,
  title,
  body,
  owner,
  metric,
  from,
  to,
  morphId,
}: {
  x: number;
  tint: string;
  index: string;
  art: ReactNode;
  title: string;
  body: string;
  owner: string;
  metric: string;
  from: string;
  to: string;
  morphId?: string;
}) => {
  const bg = <div style={{ ...abs(0, 0, 536, 610), borderRadius: 24, background: tint }} />;
  return (
    <div style={abs(x, 330, 536, 610)}>
      {morphId ? <MorphElement id={morphId}>{bg}</MorphElement> : bg}
      <div style={abs(36, 34)}>{art}</div>
      <div style={{ ...abs(44, 262), fontSize: 22, fontWeight: 700, color: SOFT }}>{index}</div>
      <div style={{ ...abs(44, 296), ...headline(54) }}>{title}</div>
      <p
        style={{
          ...abs(44, 370, 448),
          margin: 0,
          fontSize: 28,
          lineHeight: 1.45,
          color: BODY,
        }}
      >
        {body}
      </p>
      <div style={{ ...abs(44, 500, 448), fontSize: 22, color: SOFT }}>
        {metric} · {owner}
      </div>
      <div style={{ ...abs(44, 532), ...row, gap: 14, fontSize: 40, fontWeight: 760 }}>
        <span style={{ color: SOFT, fontWeight: 500 }}>{from}</span>
        <span style={{ color: SOFT, fontWeight: 400 }}>→</span>
        <span style={{ letterSpacing: '-0.03em' }}>{to}</span>
      </div>
    </div>
  );
};

const Bets: Page = () => (
  <Frame>
    <Eyebrow>Strategy</Eyebrow>
    <h2 style={{ ...abs(X0, 160), ...headline(104) }}>Three bets for FY27.</h2>
    <div style={{ ...abs(1220, 196, 580), fontSize: 28, lineHeight: 1.45, color: BODY }}>
      Each answers a lesson from FY26, and each moves one number.
    </div>
    <BetCard
      x={120}
      tint={TINT_BLUE}
      index="01"
      art={<BranchesArt />}
      title="Branches"
      body="One board across every branch, with a shared tech pool."
      owner="Priya Nair"
      metric="Net revenue retention"
      from="109%"
      to="116%"
      morphId="bet-branches"
    />
    <BetCard
      x={692}
      tint={TINT_GREEN}
      index="02"
      art={<PaymentsArt />}
      title="Payments"
      body="Techs collect on site from the app, so invoices stop sitting for 30 days."
      owner="Marcus Bell"
      metric="Payments attach rate"
      from="22%"
      to="40%"
    />
    <BetCard
      x={1264}
      tint={TINT_YELLOW}
      index="03"
      art={<OfflineArt />}
      title="Offline app"
      body="Jobs, forms and photos work with no signal, then sync."
      owner="Lena Okafor"
      metric="Crash-free sessions"
      from="99.2%"
      to="99.8%"
    />
  </Frame>
);

const BranchDiagram = ({ live }: { live: boolean }) => (
  <Ink width={760} height={640} style={abs(990, 210)}>
    <path d="M150 150C220 190 230 230 262 262" strokeDasharray="0.1 12" />
    <path d="M610 150C540 190 530 230 498 262" strokeDasharray="0.1 12" />
    <path d="M380 506L380 432" strokeDasharray="0.1 12" />
    <House x={130} y={130} s={1.5} />
    <House x={630} y={130} s={1.5} fill={YELLOW} />
    <House x={380} y={600} s={1.5} fill={PINK} />
    <rect x="250" y="250" width="260" height="176" rx="16" fill="#FFFFFF" />
    <path d="M250 286H510M337 286V426M424 286V426" strokeWidth={2.6} />
    <rect x="262" y="300" width="62" height="24" rx="6" fill={YELLOW} />
    <rect x="262" y="334" width="62" height="24" rx="6" fill={PINK} />
    <rect x="349" y="300" width="62" height="24" rx="6" fill={GREEN} />
    <rect x="436" y="300" width="62" height="24" rx="6" fill={YELLOW} />
    <rect x="436" y="334" width="62" height="24" rx="6" fill={GREEN} />
    <rect x="436" y="368" width="62" height="24" rx="6" fill={PINK} />
    <Stroke
      d="M640 330C620 380 590 400 530 392M530 392L548 378M530 392L546 408"
      color={RED_HEX}
      live={live}
      delay={MORPH_MS / 1000 + 0.3}
    />
  </Ink>
);

const DiagramLabel = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <div style={{ ...abs(x - 120, y, 240), textAlign: 'center', fontSize: 24, fontWeight: 600 }}>
    {children}
  </div>
);

const BranchesDeep: Page = () => {
  const live = useIsActivePage();
  const after: CSSProperties = live
    ? { animation: `fw-fade 0.4s ease-out ${MORPH_MS}ms both` }
    : {};
  return (
    <Frame>
      <MorphElement id="bet-branches">
        <div style={{ ...abs(940, 110, 860, 840), borderRadius: 24, background: TINT_BLUE }} />
      </MorphElement>
      <div style={{ ...abs(0, 0, 1920, 1000), ...after }}>
        <BranchDiagram live={live} />
        <DiagramLabel x={1120} y={200}>
          Phoenix
        </DiagramLabel>
        <DiagramLabel x={1620} y={200}>
          Mesa
        </DiagramLabel>
        <DiagramLabel x={1370} y={820}>
          Tucson
        </DiagramLabel>
        <div style={{ ...abs(1530, 470, 220), fontSize: 24, lineHeight: 1.3, color: RED }}>
          One board,
          <br />
          one tech pool
        </div>
        <div style={{ ...abs(990, 890), fontSize: 22, fontWeight: 650, color: BODY }}>
          Beta with 14 accounts · GA June 30
        </div>
      </div>
      <Eyebrow>Bet 01 · Branches</Eyebrow>
      <h2 style={{ ...abs(X0, 160), ...headline(112), lineHeight: 0.98 }}>
        One board
        <br />
        for every
        <br />
        branch.
      </h2>
      <p
        style={{
          ...abs(X0, 520, 700),
          margin: 0,
          fontSize: 30,
          lineHeight: 1.5,
          color: BODY,
        }}
      >
        Larger crews run one Fieldwork account per branch today. Branches puts them on one board,
        with technicians shared across locations.
      </p>
      <div style={{ ...abs(X0, 730, 760), display: 'flex', gap: 60 }}>
        <div style={{ width: 330 }}>
          <div style={{ ...headline(84), letterSpacing: '-0.045em' }}>38%</div>
          <div style={{ marginTop: 14, fontSize: 25, lineHeight: 1.4, color: BODY }}>
            of ARR sits in accounts with 25+ techs
          </div>
        </div>
        <div style={{ width: 330 }}>
          <div style={{ ...headline(84), letterSpacing: '-0.045em', color: RED }}>61%</div>
          <div style={{ marginTop: 14, fontSize: 25, lineHeight: 1.4, color: BODY }}>
            of the ARR we lost in FY26 came from them
          </div>
        </div>
      </div>
    </Frame>
  );
};

Bets.transition = morphTransition;
BranchesDeep.transition = morphTransition;

const KeyResult = ({
  text,
  pct,
  status,
  color = '#448361',
  live,
}: {
  text: string;
  pct: number;
  status: string;
  color?: string;
  live: boolean;
}) => (
  <div style={{ marginTop: 30 }}>
    <div style={{ fontSize: 27, lineHeight: 1.35 }}>{text}</div>
    <div style={{ ...row, gap: 16, marginTop: 14 }}>
      <span
        style={{
          position: 'relative',
          width: 250,
          height: 6,
          borderRadius: 3,
          background: 'rgba(25,25,25,0.09)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 6,
            width: `${pct}%`,
            borderRadius: 3,
            background: color === RED_HEX ? RED : INK,
            transformOrigin: 'left center',
            animation: live ? `fw-grow 0.7s ${EASE_OUT} 0.15s both` : undefined,
          }}
        />
      </span>
      <span style={{ width: 56, fontSize: 23, fontWeight: 650 }}>{pct}%</span>
      <span style={{ fontSize: 23, fontWeight: 600, color }}>{status}</span>
    </div>
  </div>
);

const Objective = ({
  code,
  title,
  owner,
  children,
}: {
  code: string;
  title: string;
  owner: string;
  children: ReactNode;
}) => (
  <div style={{ width: 500 }}>
    <div style={{ fontSize: 26, fontWeight: 700, color: RED }}>{code}</div>
    <div style={{ marginTop: 12, ...headline(46), lineHeight: 1.08, height: 100 }}>{title}</div>
    <div style={{ marginTop: 12, fontSize: 24, color: SOFT }}>{owner}</div>
    {children}
  </div>
);

const Okrs: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame>
      <Eyebrow>FY27 objectives</Eyebrow>
      <h2 style={{ ...abs(X0, 160), ...headline(104) }}>What we commit to.</h2>
      <div style={{ ...abs(1300, 196, 500), fontSize: 26, lineHeight: 1.45, color: BODY }}>
        Progress as of January 14. Owners update it every Friday.
      </div>
      <div
        style={{
          ...abs(X0, 330, W),
          display: 'flex',
          gap: 90,
          borderTop: `2px solid ${INK_HEX}`,
          paddingTop: 30,
        }}
      >
        <Steps>
          <Step duration={240}>
            <Objective code="O1" title="Grow inside our largest accounts" owner="Priya Nair">
              <KeyResult text="Branches GA by June 30" pct={35} status="On track" live={live} />
              <KeyResult
                text="180 large accounts on Branches"
                pct={8}
                status="On track"
                live={live}
              />
              <KeyResult
                text="NRR from 109% to 116%"
                pct={0}
                status="Not started"
                color={SOFT}
                live={live}
              />
            </Objective>
          </Step>
          <Step duration={240}>
            <Objective code="O2" title="Get paid on the job" owner="Marcus Bell">
              <KeyResult text="Attach rate from 22% to 40%" pct={6} status="On track" live={live} />
              <KeyResult text="Tap to Pay live by April" pct={60} status="On track" live={live} />
              <KeyResult
                text="Next-day payouts, 95% of volume"
                pct={15}
                status="At risk"
                color={RED_HEX}
                live={live}
              />
            </Objective>
          </Step>
          <Step duration={240}>
            <Objective code="O3" title="A tech app that works anywhere" owner="Lena Okafor">
              <KeyResult
                text="Full job flow offline by Oct 15"
                pct={20}
                status="On track"
                live={live}
              />
              <KeyResult
                text="Crash-free from 99.2% to 99.8%"
                pct={25}
                status="On track"
                live={live}
              />
            </Objective>
          </Step>
        </Steps>
      </div>
    </Frame>
  );
};

const MW = W / 12;
const mx = (m: number) => X0 + m * MW;
const TL_TOP = 420;
const TL_GAP = 68;

const MonthLabel = ({ m, label }: { m: number; label: string }) => (
  <div style={{ ...abs(mx(m), 364, MW), textAlign: 'center', fontSize: 23, color: SOFT }}>
    {label}
  </div>
);

const Quarter = ({ q }: { q: number }) => (
  <>
    <div style={{ ...abs(mx(q * 3) + 4, 316), fontSize: 26, fontWeight: 750 }}>Q{q + 1}</div>
    <div
      style={{
        ...abs(mx(q * 3), 404, 0, 500),
        borderLeft: `1.5px dashed ${q === 0 ? 'transparent' : RULE}`,
      }}
    />
  </>
);

const Bar = ({
  from,
  to,
  i,
  fill,
  children,
}: {
  from: number;
  to: number;
  i: number;
  fill: string;
  children: ReactNode;
}) => (
  <div
    style={{
      ...abs(mx(from), TL_TOP + i * TL_GAP, (to - from) * MW, 50),
      ...row,
      padding: '0 22px',
      borderRadius: 25,
      background: fill,
      boxShadow: `inset 0 0 0 2px ${INK_HEX}`,
      fontSize: 24,
      fontWeight: 650,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

const Milestone = ({ at, i, label }: { at: number; i: number; label: string }) => (
  <div style={{ ...abs(mx(at) + 8, TL_TOP + i * TL_GAP - 2), ...row, gap: 8, height: 54 }}>
    <Ink width={40} height={40} viewBox="-22 -22 44 44">
      <Sparkle x={0} y={0} s={0.9} />
    </Ink>
    <span style={{ fontSize: 23, fontWeight: 650 }}>{label}</span>
  </div>
);

const LegendDot = ({ fill, children }: { fill: string; children: ReactNode }) => (
  <span style={{ ...row, gap: 10 }}>
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        background: fill,
        boxShadow: `inset 0 0 0 2px ${INK_HEX}`,
      }}
    />
    {children}
  </span>
);

const Roadmap: Page = () => {
  const live = useIsActivePage();
  const today = mx(13 / 31);
  return (
    <Frame>
      <Eyebrow>Roadmap</Eyebrow>
      <h2 style={{ ...abs(X0, 160), ...headline(104) }}>FY27, month by month.</h2>
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 120,
          ...row,
          gap: 26,
          fontSize: 23,
          color: BODY,
        }}
      >
        <LegendDot fill={BLUE}>Product</LegendDot>
        <LegendDot fill={GREEN}>Payments</LegendDot>
        <LegendDot fill={PINK}>Engineering</LegendDot>
        <LegendDot fill={YELLOW}>Sales</LegendDot>
      </div>
      <Quarter q={0} />
      <Quarter q={1} />
      <Quarter q={2} />
      <Quarter q={3} />
      <MonthLabel m={0} label="Jan" />
      <MonthLabel m={1} label="Feb" />
      <MonthLabel m={2} label="Mar" />
      <MonthLabel m={3} label="Apr" />
      <MonthLabel m={4} label="May" />
      <MonthLabel m={5} label="Jun" />
      <MonthLabel m={6} label="Jul" />
      <MonthLabel m={7} label="Aug" />
      <MonthLabel m={8} label="Sep" />
      <MonthLabel m={9} label="Oct" />
      <MonthLabel m={10} label="Nov" />
      <MonthLabel m={11} label="Dec" />
      <div style={{ ...abs(X0, 404, W), borderTop: `2px solid ${INK_HEX}` }} />
      <div style={{ ...abs(today, 404, 0, 500), borderLeft: `2.5px solid ${RED_HEX}` }} />
      <Bar from={0.1} to={6} i={0} fill={BLUE}>
        Branches: beta to GA
      </Bar>
      <Milestone at={6} i={0} label="GA, Jun 30" />
      <Bar from={6.25} to={9} i={1} fill={BLUE}>
        Branch-level reports
      </Bar>
      <Bar from={0.33} to={3.47} i={2} fill={GREEN}>
        Tap to Pay in the app
      </Bar>
      <Milestone at={3.47} i={2} label="Live, Apr 15" />
      <Bar from={3} to={8} i={3} fill={GREEN}>
        Next-day payouts
      </Bar>
      <Bar from={0.55} to={5} i={4} fill={PINK}>
        Offline sync engine
      </Bar>
      <Bar from={5.5} to={9.47} i={5} fill={PINK}>
        Tech app 4.0
      </Bar>
      <Milestone at={9.47} i={5} label="Ships, Oct 15" />
      <Bar from={1} to={11.5} i={6} fill={YELLOW}>
        Mid-market sales pod, 6 account executives
      </Bar>
      <Ink width={200} height={80} style={abs(today - 2, 900)}>
        <Stroke
          d="M80 58C40 60 12 46 6 10M6 10L-4 26M6 10L18 24"
          color={RED_HEX}
          live={live}
          delay={0.5}
        />
      </Ink>
      <div style={{ ...abs(today + 88, 940), fontSize: 23, fontWeight: 650, color: RED }}>
        We are here: January 14
      </div>
    </Frame>
  );
};

const Bust = ({
  x,
  shirt,
  hair,
  bg,
}: {
  x: number;
  shirt: string;
  hair: 'short' | 'bun' | 'long' | 'beard';
  bg: string;
}) => (
  <g transform={`translate(${x} 300)`}>
    <circle cx="0" cy="-110" r="80" fill={bg} stroke="none" />
    {hair === 'long' ? (
      <path d="M-40 -96Q-48 -152 0 -150Q48 -152 40 -96L42 -58L-42 -58Z" fill={INK_HEX} />
    ) : null}
    <path d="M-72 0Q-68 -62 0 -66Q68 -62 72 0Z" fill={shirt} />
    <path d="M0 -70L0 -62" />
    <circle cx="0" cy="-106" r="37" fill="#FFFFFF" />
    {hair === 'short' ? (
      <path
        d="M-38 -110Q-40 -148 0 -148Q40 -148 38 -112Q24 -128 4 -124Q-20 -124 -38 -110Z"
        fill={INK_HEX}
      />
    ) : null}
    {hair === 'bun' ? (
      <>
        <circle cx="0" cy="-152" r="15" fill={INK_HEX} />
        <path
          d="M-38 -108Q-38 -146 0 -146Q38 -146 38 -108Q20 -132 0 -132Q-20 -132 -38 -108Z"
          fill={INK_HEX}
        />
      </>
    ) : null}
    {hair === 'long' ? (
      <path d="M-38 -104Q-36 -146 0 -146Q36 -146 38 -104Q14 -132 -38 -104Z" fill={INK_HEX} />
    ) : null}
    {hair === 'beard' ? (
      <>
        <path
          d="M-36 -116Q-30 -146 0 -146Q30 -146 36 -116Q20 -132 0 -132Q-20 -132 -36 -116Z"
          fill={INK_HEX}
        />
        <path
          d="M-34 -98Q-28 -64 0 -64Q28 -64 34 -98Q18 -82 0 -84Q-18 -82 -34 -98Z"
          fill={INK_HEX}
        />
      </>
    ) : null}
    <circle cx="-12" cy="-104" r="3" fill={INK_HEX} stroke="none" />
    <circle cx="12" cy="-104" r="3" fill={INK_HEX} stroke="none" />
    {hair === 'beard' ? null : <path d="M-8 -90Q0 -84 8 -90" strokeWidth={2.6} />}
  </g>
);

const TeamRow = ({ team, n }: { team: string; n: number }) => (
  <div style={{ ...row, height: 56, fontSize: 28 }}>
    <span style={{ width: 290 }}>{team}</span>
    <span style={{ width: n * 22, height: 14, borderRadius: 7, background: INK }} />
    <span style={{ marginLeft: 16, fontWeight: 700 }}>{n}</span>
  </div>
);

const Stage = ({ n, label, accent = false }: { n: number; label: string; accent?: boolean }) => (
  <div style={{ width: 148 }}>
    <div style={{ ...headline(72), letterSpacing: '-0.04em', color: accent ? RED : INK }}>{n}</div>
    <div style={{ marginTop: 10, fontSize: 23, color: BODY }}>{label}</div>
  </div>
);

const Hiring: Page = () => (
  <Frame>
    <Eyebrow>Hiring plan</Eyebrow>
    <h2 style={{ ...abs(X0, 160), ...headline(170), letterSpacing: '-0.045em' }}>
      142 <span style={{ color: SOFT, fontWeight: 400 }}>→</span> 186
    </h2>
    <p
      style={{
        ...abs(X0, 372, 820),
        margin: 0,
        fontSize: 32,
        lineHeight: 1.45,
        color: BODY,
      }}
    >
      44 net new roles by December 31. 28 of them land in the first half, on purpose.
    </p>
    <Ink width={760} height={320} style={abs(1060, 110)}>
      <Bust x={100} shirt={BLUE} hair="short" bg={TINT_YELLOW} />
      <Bust x={286} shirt={RED_HEX} hair="bun" bg={TINT_BLUE} />
      <Bust x={472} shirt={GREEN} hair="beard" bg={TINT_PINK} />
      <Bust x={658} shirt={YELLOW} hair="long" bg={TINT_GREEN} />
    </Ink>
    <div style={{ ...abs(X0, 540), fontSize: 24, fontWeight: 700 }}>New roles by team</div>
    <div style={abs(X0, 586, 820)}>
      <TeamRow team="Engineering" n={18} />
      <TeamRow team="Sales" n={9} />
      <TeamRow team="Customer Success" n={6} />
      <TeamRow team="Product and Design" n={5} />
      <TeamRow team="Payments" n={3} />
      <TeamRow team="G&A" n={3} />
    </div>
    <div style={{ ...abs(1060, 540), fontSize: 24, fontWeight: 700 }}>Where the 44 are today</div>
    <div style={{ ...abs(1060, 600), display: 'flex', gap: 2 }}>
      <Stage n={27} label="Planned" />
      <Stage n={10} label="Open" />
      <Stage n={4} label="Interviews" />
      <Stage n={2} label="Offers out" />
      <Stage n={1} label="Hired" accent />
    </div>
    <div
      style={{
        ...abs(1060, 790, 740),
        display: 'flex',
        gap: 18,
        fontSize: 28,
        lineHeight: 1.4,
      }}
    >
      <Ink width={44} height={44} viewBox="-22 -22 44 44" style={{ marginTop: 2, flexShrink: 0 }}>
        <Sparkle x={0} y={0} s={0.95} />
      </Ink>
      <span>
        Our first FY27 hire, a senior Android engineer, starts <Highlight>February 1</Highlight>.
      </span>
    </div>
  </Frame>
);

const BASE = 860;
const PER = 25;

const BarGroup = ({
  cx,
  label,
  a,
  b,
  live,
}: {
  cx: number;
  label: string;
  a: number;
  b: number;
  live: boolean;
}) => {
  const grow: CSSProperties = live
    ? { transformOrigin: 'bottom center', animation: `fw-rise 0.7s ${EASE_OUT} 0.1s both` }
    : {};
  return (
    <>
      <div
        style={{
          ...abs(cx - 82, BASE - a * PER, 76, a * PER),
          background: '#E7E5E0',
          borderRadius: '10px 10px 0 0',
          ...grow,
        }}
      />
      <div
        style={{
          ...abs(cx + 6, BASE - b * PER, 76, b * PER),
          background: INK,
          borderRadius: '10px 10px 0 0',
          ...grow,
        }}
      />
      <div
        style={{
          ...abs(cx - 92, BASE - a * PER - 36, 96),
          textAlign: 'center',
          fontSize: 23,
          color: SOFT,
        }}
      >
        {a.toFixed(1)}
      </div>
      <div
        style={{
          ...abs(cx - 4, BASE - b * PER - 36, 96),
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 720,
        }}
      >
        {b.toFixed(1)}
      </div>
      <div
        style={{
          ...abs(cx - 120, BASE + 18, 240),
          textAlign: 'center',
          fontSize: 24,
          color: BODY,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </>
  );
};

const SpendRow = ({ fn, value, share }: { fn: string; value: string; share: string }) => (
  <div
    style={{
      ...row,
      height: 62,
      fontSize: 28,
      borderBottom: `1.5px solid ${RULE}`,
    }}
  >
    <span style={{ flex: 1 }}>{fn}</span>
    <span style={{ width: 120, textAlign: 'right', fontWeight: 700 }}>{value}</span>
    <span style={{ width: 100, textAlign: 'right', color: SOFT }}>{share}</span>
  </div>
);

const Budget: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame>
      <Eyebrow>Budget</Eyebrow>
      <h2 style={{ ...abs(X0, 160), ...headline(104) }}>Where $39.5M goes.</h2>
      <div style={{ ...abs(X0, 300), fontSize: 28, color: BODY }}>
        FY27 operating expenses by function, in millions. Up 33% on FY26.
      </div>
      <div style={{ ...abs(X0, 380), ...row, gap: 28, fontSize: 22, color: BODY }}>
        <span style={{ ...row, gap: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: '#E7E5E0' }} />
          FY26 actual
        </span>
        <span style={{ ...row, gap: 10 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: INK }} />
          FY27 plan
        </span>
      </div>
      <BarGroup cx={240} label="R&D" a={11.9} b={15.8} live={live} />
      <BarGroup cx={480} label="Sales & Marketing" a={10.6} b={14.2} live={live} />
      <BarGroup cx={720} label="G&A" a={4.2} b={5.3} live={live} />
      <BarGroup cx={960} label="Customer Success" a={3.1} b={4.2} live={live} />
      <div style={{ ...abs(X0, BASE, 980), borderTop: `2px solid ${INK_HEX}` }} />
      <div
        style={{
          ...abs(640, 440, 340),
          fontSize: 23,
          lineHeight: 1.35,
          color: RED,
          fontWeight: 600,
        }}
      >
        +$3.9M in R&D, mostly engineers for Branches and offline
      </div>
      <Ink width={330} height={110} style={abs(310, 430)}>
        <Stroke
          d="M322 24C240 0 120 10 22 50M22 50L44 30M22 50L50 58"
          color={RED_HEX}
          live={live}
          delay={0.8}
        />
      </Ink>
      <div style={abs(1180, 392, 620)}>
        <SpendRow fn="R&D" value="15.8" share="40%" />
        <SpendRow fn="Sales & Marketing" value="14.2" share="36%" />
        <SpendRow fn="G&A" value="5.3" share="13%" />
        <SpendRow fn="Customer Success" value="4.2" share="11%" />
        <div style={{ ...row, height: 66, fontSize: 28, fontWeight: 720 }}>
          <span style={{ flex: 1 }}>Total opex</span>
          <span style={{ width: 120, textAlign: 'right' }}>39.5</span>
          <span style={{ width: 100 }} />
        </div>
      </div>
      <div style={{ ...abs(1180, 760), ...headline(110), letterSpacing: '-0.05em' }}>1.1×</div>
      <CircleDoodle x={1134} y={724} w={290} h={176} live={live} delay={1} />
      <div style={{ ...abs(1430, 770, 370), fontSize: 24, lineHeight: 1.4, color: BODY }}>
        <span style={{ color: INK, fontWeight: 650 }}>Burn multiple.</span> $12.6M of burn buys
        $11.4M of net new ARR. Cash ends FY27 at $33.4M.
      </div>
    </Frame>
  );
};

const CalendarDoodle = () => (
  <Ink width={120} height={120}>
    <rect x="10" y="22" width="100" height="88" rx="12" fill="#FFFFFF" />
    <path d="M10 48H110M36 12V30M84 12V30" />
    <path d="M30 70h6M52 70h6M30 90h6M52 90h6" strokeWidth={4} />
    <circle cx="82" cy="80" r="15" stroke={RED_HEX} />
  </Ink>
);

const CardDoodle = () => (
  <Ink width={120} height={120}>
    <rect x="8" y="40" width="96" height="62" rx="10" fill="#FFFFFF" />
    <path d="M8 60H104" strokeWidth={6} />
    <path d="M24 86h26" />
    <path d="M70 30L104 6M88 6H104V22" stroke={RED_HEX} />
  </Ink>
);

const HourglassDoodle = () => (
  <Ink width={120} height={120}>
    <path d="M28 10H92M28 110H92" />
    <path d="M36 10Q36 50 60 60Q84 50 84 10M36 110Q36 70 60 60Q84 70 84 110" fill="#FFFFFF" />
    <path d="M44 104Q60 82 76 104Z" fill={YELLOW} />
    <path d="M48 28Q60 44 72 28Z" fill={YELLOW} />
  </Ink>
);

const RiskCard = ({
  top,
  tint,
  art,
  level,
  levelColor,
  title,
  body,
  owner,
  by,
  call,
}: {
  top: number;
  tint: string;
  art: ReactNode;
  level: string;
  levelColor: string;
  title: string;
  body: string;
  owner: string;
  by: string;
  call: string;
}) => (
  <div style={{ ...abs(X0, top, W, 188), borderRadius: 24, background: tint }}>
    <div style={abs(44, 34)}>{art}</div>
    <div style={{ ...abs(210, 30), fontSize: 22, fontWeight: 700, color: levelColor }}>{level}</div>
    <div style={{ ...abs(210, 64), ...headline(42), whiteSpace: 'nowrap' }}>{title}</div>
    <div style={{ ...abs(210, 122, 940), fontSize: 27, lineHeight: 1.4, color: BODY }}>{body}</div>
    <div style={abs(1220, 34, 420)}>
      <div style={{ fontSize: 26, fontWeight: 680 }}>{owner}</div>
      <div style={{ marginTop: 4, fontSize: 26, color: BODY }}>Decide by {by}</div>
      <div style={{ marginTop: 14, fontSize: 23, lineHeight: 1.35, color: BODY }}>{call}</div>
    </div>
  </div>
);

const Risks: Page = () => (
  <Frame>
    <Eyebrow>Risks</Eyebrow>
    <h2 style={{ ...abs(X0, 160), ...headline(104) }}>What could go wrong.</h2>
    <div style={{ ...abs(1300, 196, 500), fontSize: 26, lineHeight: 1.45, color: BODY }}>
      Each risk has one owner and a date by which we decide.
    </div>
    <RiskCard
      top={330}
      tint={TINT_PINK}
      art={<CalendarDoodle />}
      level="High"
      levelColor={RED_HEX}
      title="Branches GA slips past June"
      body="Half of FY27 expansion ARR assumes Branches is live before Q3 renewals."
      owner="Priya Nair"
      by="February 15"
      call="Freeze scope; reports can slip to Q4."
    />
    <RiskCard
      top={538}
      tint={TINT_YELLOW}
      art={<CardDoodle />}
      level="Medium"
      levelColor="#B07A12"
      title="Processor fees rise in April"
      body="New pricing cuts our payments margin from 0.9% to 0.6% of volume."
      owner="Marcus Bell"
      by="March 31"
      call="Renegotiate, or add a second processor."
    />
    <RiskCard
      top={746}
      tint={TINT_BLUE}
      art={<HourglassDoodle />}
      level="Watch"
      levelColor="#3E7FCF"
      title="Hiring runs ahead of revenue"
      body="28 of 44 hires land in H1. If Q1 new ARR is under $1.4M, we pause 12 H2 roles."
      owner="Owen Carter"
      by="April 14"
      call="The Q1 business review sets the gate."
    />
  </Frame>
);

const CompassArt = () => (
  <Ink width={360} height={360} style={abs(1440, 110)}>
    <circle cx="190" cy="190" r="150" fill={TINT_BLUE} stroke="none" />
    <circle cx="180" cy="180" r="112" fill="#FFFFFF" />
    <circle cx="180" cy="180" r="92" strokeWidth={2.4} />
    <path d="M180 68V84M180 276V292M68 180H84M276 180H292" />
    <path d="M180 104L198 180L162 180Z" fill={RED_HEX} />
    <path d="M180 256L198 180L162 180Z" fill="#FFFFFF" />
    <circle cx="180" cy="180" r="7" fill={INK_HEX} />
    <Sparkle x={318} y={64} s={0.8} />
  </Ink>
);

const Question = ({
  top,
  n,
  title,
  done = false,
  children,
  meta,
}: {
  top: number;
  n: string;
  title: string;
  done?: boolean;
  children: ReactNode;
  meta?: string;
}) => (
  <div style={abs(X0, top, 1240)}>
    <div style={{ ...row, alignItems: 'baseline', gap: 28 }}>
      <span style={{ width: 52, fontSize: 26, fontWeight: 700, color: done ? SOFT : RED }}>
        {n}
      </span>
      <span
        style={{
          ...headline(56),
          color: done ? SOFT : INK,
          textDecoration: done ? 'line-through' : 'none',
          textDecorationThickness: 3,
        }}
      >
        {title}
      </span>
    </div>
    <div style={{ marginLeft: 80, marginTop: 18, fontSize: 28, lineHeight: 1.5, color: BODY }}>
      {children}
    </div>
    {meta ? (
      <div style={{ marginLeft: 80, marginTop: 10, fontSize: 23, fontWeight: 600, color: SOFT }}>
        {meta}
      </div>
    ) : null}
  </div>
);

const Questions: Page = () => (
  <Frame>
    <Eyebrow>Open questions</Eyebrow>
    <h2 style={{ ...abs(X0, 160), ...headline(104) }}>Still open.</h2>
    <Question
      top={330}
      n="01"
      title="How do we price Branches?"
      meta="Jordan Reyes and Priya Nair · test with 20 accounts in February"
    >
      Per branch is simpler to sell, but{' '}
      <Highlight>60% of our 25+ tech accounts run a single branch</Highlight>. The proposal: price
      per technician, with a two-branch minimum.
    </Question>
    <Question
      top={590}
      n="02"
      title="Should payments be on by default?"
      meta="Marcus Bell and Theo Brandt · proposal is default-on from March"
    >
      <Highlight color="#FADDE4">Default-on doubled attach in the October cohort</Highlight>, but
      support tickets rose 18% in the same group. The payouts FAQ ships first.
    </Question>
    <Question top={850} n="03" title="Canada in FY27?" done>
      Resolved by Maya: not this year. We revisit it in FY28 planning.
    </Question>
    <CompassArt />
  </Frame>
);

const ToolboxArt = () => (
  <Ink width={720} height={500} style={abs(1080, 300)}>
    <circle cx="370" cy="260" r="215" fill={YELLOW} stroke="none" />
    <path d="M180 214Q180 170 236 168Q292 170 292 212" />
    <path d="M202 216Q202 190 236 189Q270 190 270 214" />
    <path d="M122 250L470 246L462 420Q461 432 449 432L136 434Q124 434 123 422Z" fill={RED_HEX} />
    <path d="M110 216L482 212L478 252L114 255Z" fill={RED_HEX} />
    <rect x="276" y="244" width="44" height="30" rx="5" fill="#FFFFFF" />
    <g transform="translate(330 196) rotate(-3)">
      <path d="M18 -7.5L112 -5L112 5L18 7.5Z" fill="#FFFFFF" />
      <circle cx="128" cy="0" r="17" fill="#FFFFFF" />
      <path d="M121 -6.5L128 -9.5L135 -6.5L135 3L128 7L121 3Z" />
      <path
        d="M20 -8.5C11 -16.5 -6 -17 -13 -6.5L1 -4L1 4L-13 6.5C-6 17 11 16.5 20 8.5Z"
        fill="#FFFFFF"
      />
    </g>
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

const Todo = ({
  done = false,
  live = false,
  date,
  children,
}: {
  done?: boolean;
  live?: boolean;
  date: string;
  children: ReactNode;
}) => (
  <div style={{ ...row, gap: 22, height: 60, fontSize: 30 }}>
    <Ink width={34} height={34} wobble={1.5}>
      <rect x="3" y="3" width="28" height="28" rx="5" fill="#FFFFFF" strokeWidth={2.8} />
      {done ? (
        <Stroke d="M8 18L15 25L30 4" color={RED_HEX} width={3.6} live={live} delay={0.5} />
      ) : null}
    </Ink>
    <span
      style={{ flex: 1, color: done ? SOFT : INK, textDecoration: done ? 'line-through' : 'none' }}
    >
      {children}
    </span>
    <span style={{ fontSize: 26, color: SOFT }}>{date}</span>
  </div>
);

const Close: Page = () => {
  const live = useIsActivePage();
  return (
    <Frame>
      <h2 style={{ ...abs(X0, 140), ...headline(130), lineHeight: 0.98 }}>
        Thank you
        <br />
        for FY26.
      </h2>
      <div style={{ ...abs(X0, 420), fontSize: 34, color: BODY }}>
        See you at the Q1 review on April 14.
      </div>
      <div style={{ ...abs(X0, 520), fontSize: 24, fontWeight: 700 }}>Next</div>
      <div style={abs(X0, 562, 860)}>
        <Todo done live={live} date="Jan 14">
          Board pre-read sent · Maya
        </Todo>
        <Todo date="Jan 29">Team OKRs drafted from this plan · all leads</Todo>
        <Todo date="Feb 15">Branches scope freeze · Priya</Todo>
        <Todo date="Mar 31">Payments processor decision · Marcus</Todo>
        <Todo date="Apr 14">Q1 business review · Owen</Todo>
      </div>
      <div style={{ ...abs(X0, 900), fontSize: 23, color: SOFT }}>
        The plan locks on January 22. Comments are open until then.
      </div>
      <ToolboxArt />
    </Frame>
  );
};

export const meta: SlideMeta = {
  title: 'Fieldwork — FY27 Operating Plan',
  createdAt: '2026-10-12T05:15:09.357Z',
};

export const notes: (string | undefined)[] = [
  `Maya (CEO) opens. Welcome to kickoff. This is the plan of record for FY27; the board got the same document as a pre-read this morning.
Twenty-five minutes: where FY26 landed, what we learned, the three bets, then targets, roadmap, hiring and money. Comments stay open until January 21.`,
  `Maya. If you remember one page, make it this one.
FY26 closed at $28.6M ARR, $1.1M over plan. Net revenue retention came in at 109% against 115%, and that miss is the story of the year.
FY27: $40.0M ARR, NRR back to 116%, 186 people by December 31. Burn multiple stays at 1.1×.`,
  `Owen (CFO). Six targets, five met.
ARR $28.6M on $27.5M. 1,186 new customers. Gross margin 77.8%, burn multiple 1.1× against a 1.3× ceiling.
The circled number is NRR: 109% against 115%. We are not going to soften it. Priya explains why on the next page.`,
  `Priya (VP Product). We read 214 customer calls against the numbers.
Read Dana's quote. Ruiz Mechanical has 42 techs and two branches, and they went back to spreadsheets.
Three numbers: accounts with 25+ techs are 38% of ARR and 61% of what we lost. Techs open the app 14 times a day. Payments customers churn at 4.1% against 11.2%.`,
  `Maya. Three bets follow straight from those three lessons.
Branches for multi-location crews, owned by Priya. Payments on every job, owned by Marcus. An offline tech app, owned by Lena.
Each card has one number it has to move. Let's open the first one.`,
  `Priya. Branches is the largest bet and the NRR plan depends on it.
Beta is live with 14 accounts; GA is June 30. The why: 38% of ARR, 61% of lost ARR, most of them running one account per branch.
What ships: one board across branches, a shared tech pool, and branch-level reports in Q3.`,
  `Owners, one each. Advance to bring in each objective.
O1, Priya: GA by June 30, 180 large accounts on Branches, NRR to 116%. NRR is lagging, so it reads "not started" until Q3 renewals.
O2, Marcus: attach 22% to 40%, Tap to Pay by April. Next-day payouts is at risk; that is the processor issue on the risks page.
O3, Lena: offline by October 15, crash-free to 99.8%.`,
  `Lena (VP Engineering). The red line is today, January 14.
Two dependencies matter: the offline sync engine must finish in May before Tech app 4.0 starts, and Branches GA gates the branch reports in July.
Jordan's mid-market pod hires through the year; that is the yellow bar.`,
  `Hana (VP People). 44 net new roles takes us from 142 to 186. 28 of them land in H1, which is deliberate and also a risk.
Engineering is 18 of the 44, Sales 9, Success 6, Product and Design 5, Payments and G&A 3 each.
Two offers out, one hire already signed: our Android lead starts February 1.`,
  `Owen. Opex goes from $29.8M to $39.5M, up 33%. R&D is 40% of it, Sales and Marketing 36%.
Point at the arrow: most of the R&D increase is engineers for Branches and offline.
Burn is $12.6M for $11.4M of net new ARR, so the burn multiple holds at 1.1×. We end the year with $33.4M in the bank.`,
  `Maya. Three risks, each with a decision date.
Branches slipping is the big one; scope freezes February 15. Processor pricing changes in April; Marcus brings a recommendation by March 31.
Hiring ahead of revenue: if Q1 new ARR is under $1.4M we pause 12 second-half roles. Owen calls it at the Q1 review on April 14.`,
  `Maya. Two questions are still open, and we want your input in the plan's comments.
Pricing for Branches: Jordan and Priya propose per tech with a two-branch minimum, tested with 20 accounts in February.
Payments default-on: doubled attach, but tickets rose 18%. Canada is resolved: not in FY27.`,
  `Maya closes. Five dates to remember; the first is done.
Team OKRs by January 29, Branches scope by February 15, processor by March 31, Q1 review April 14.
Thank you for FY26. Questions go in the comments; we answer every one before the plan locks on January 22.`,
];

export default [
  Cover,
  Summary,
  Scorecard,
  Learnings,
  Bets,
  BranchesDeep,
  Okrs,
  Roadmap,
  Hiring,
  Budget,
  Risks,
  Questions,
  Close,
] satisfies Page[];

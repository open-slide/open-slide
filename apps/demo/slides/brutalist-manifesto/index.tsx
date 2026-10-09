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
  palette: { bg: '#ffffff', text: '#000000', accent: '#ff3300' },
  fonts: {
    display: '"Times New Roman", Times, serif',
    body: '"Courier New", Courier, ui-monospace, monospace',
  },
  typeScale: { hero: 250, body: 32 },
  radius: 0,
};

const LINK = '#0000ee';
const VISITED = '#551a8b';
const GREY = '#6b6b6b';
const RULE = '3px solid var(--osd-text)';

const STYLE_ID = 'osd-styles-brutalist-manifesto';
const css = `
@keyframes bru-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes bru-type { from { opacity: 0; } to { opacity: 1; } }
@keyframes bru-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes bru-jolt {
  0% { transform: translate(-10px, 0); color: var(--osd-accent); }
  25% { transform: translate(8px, 0); }
  50% { transform: translate(-3px, 0); color: var(--osd-text); }
  100% { transform: translate(0, 0); }
}
.bru-marquee { animation: bru-marquee 22s linear infinite; }
.bru-type { animation: bru-type 40ms steps(1, end) both; }
.bru-blink { animation: bru-blink 1s steps(1, end) infinite; }
[data-osd-step="revealed"] > .bru-jolt { animation: bru-jolt 240ms steps(4, end) both; }
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

const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

// Hard cut with a stepped jitter: no fade, the new page lands inverted and shakes into place.
export const transition: SlideTransition = {
  duration: 220,
  exit: { duration: 220, keyframes: HOLD },
  enter: {
    duration: 220,
    easing: 'steps(4, end)',
    keyframes: [
      { opacity: 1, transform: 'translate(-14px, 0)', filter: 'invert(1)' },
      { opacity: 1, transform: 'translate(10px, 0)', filter: 'invert(0)', offset: 0.35 },
      { opacity: 1, transform: 'translate(-4px, 0)', filter: 'invert(0)', offset: 0.7 },
      { opacity: 1, transform: 'translate(0, 0)', filter: 'invert(0)' },
    ],
  },
};

const MORPH_MS = 620;
const morphCut: SlideTransition = {
  duration: 200,
  exit: { duration: MORPH_MS, keyframes: HOLD },
  enter: { duration: 200, easing: 'steps(2, end)', keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.85, 0, 0.15, 1)' },
};

const frame: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
};

const AddressBar = ({ path }: { path: string }) => {
  const { current, total } = useSlidePageNumber();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 64,
        borderBottom: RULE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 80px',
        fontSize: 22,
      }}
    >
      <span>
        <span style={{ opacity: 0.55 }}>file:///</span>talks/deleted-design-system/{path}
      </span>
      <span style={{ fontWeight: 700 }}>
        [{pad(current)}/{pad(total)}] ← →
      </span>
    </div>
  );
};

const Tag = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ fontSize: 24, color: GREY, ...style }}>{children}</div>
);

const Marquee = ({ text, top, invert = true }: { text: string; top: number; invert?: boolean }) => {
  const live = useIsActivePage();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        height: 84,
        overflow: 'hidden',
        background: invert ? 'var(--osd-text)' : 'var(--osd-accent)',
        color: invert ? 'var(--osd-bg)' : 'var(--osd-text)',
        borderTop: RULE,
        borderBottom: RULE,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        className={live ? 'bru-marquee' : undefined}
        style={{
          display: 'flex',
          whiteSpace: 'nowrap',
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '0.02em',
          width: 'max-content',
        }}
      >
        <span style={{ paddingRight: 40 }}>{text}</span>
        <span style={{ paddingRight: 40 }}>{text}</span>
        <span style={{ paddingRight: 40 }}>{text}</span>
        <span style={{ paddingRight: 40 }}>{text}</span>
      </div>
    </div>
  );
};

const Link = ({ children, visited = false }: { children: ReactNode; visited?: boolean }) => (
  <span
    style={{
      color: visited ? VISITED : LINK,
      textDecoration: 'underline',
      textDecorationThickness: 2,
      textUnderlineOffset: 4,
    }}
  >
    {children}
  </span>
);

const Cover: Page = () => (
  <div style={frame}>
    <AddressBar path="index.html" />
    <div style={{ position: 'absolute', left: 80, top: 110, fontSize: 26 }}>
      FRONTEND/FRIGHT 2026 — ROOM B — SAT 11:40 — 30 MIN (+10 FOR YELLING)
    </div>
    <h1
      style={{
        position: 'absolute',
        left: 72,
        top: 190,
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 400,
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 0.9,
        letterSpacing: '-0.035em',
      }}
    >
      We{' '}
      <span
        style={{
          display: 'inline-block',
          background: 'var(--osd-accent)',
          padding: '0 14px',
          marginLeft: -6,
          lineHeight: 0.84,
        }}
      >
        Deleted
      </span>{' '}
      Our
      <br />
      Design System.
    </h1>
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 690,
        width: 1760,
        borderTop: RULE,
        paddingTop: 26,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 30,
      }}
    >
      <span>Hana Okafor (eng) &amp; Dev Ruiz (design) — Fieldnote</span>
      <Link>fieldnote.dev/deleted</Link>
    </div>
    <div style={{ position: 'absolute', left: 80, top: 790, fontSize: 30, color: GREY }}>
      &lt;!-- a talk about removing 147 components and shipping faster --&gt;
    </div>
    <Marquee
      top={940}
      text="→ NO MORE TOKENS → NO MORE STORYBOOK → NO MORE “WHICH BUTTON DO I USE?” → NO MORE THEME PROVIDERS → JUST HTML AND ONE CSS FILE"
    />
  </div>
);

const Cell = ({
  children,
  head = false,
  style,
}: {
  children: ReactNode;
  head?: boolean;
  style?: CSSProperties;
}) => (
  <td
    style={{
      padding: '10px 22px',
      borderBottom: '1px solid #b9b9b9',
      fontWeight: head ? 700 : 400,
      verticalAlign: 'baseline',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </td>
);

const IndexRow = ({
  name,
  date,
  size,
  desc,
  visited = false,
}: {
  name: string;
  date: string;
  size: string;
  desc: string;
  visited?: boolean;
}) => (
  <tr>
    <Cell style={{ fontFamily: 'var(--osd-font-body)', fontSize: 24, color: GREY }}>[DIR]</Cell>
    <Cell>
      <Link visited={visited}>{name}</Link>
    </Cell>
    <Cell style={{ fontFamily: 'var(--osd-font-body)', fontSize: 26 }}>{date}</Cell>
    <Cell style={{ fontFamily: 'var(--osd-font-body)', fontSize: 26, textAlign: 'right' }}>
      {size}
    </Cell>
    <Cell>{desc}</Cell>
  </tr>
);

const Agenda: Page = () => (
  <div style={frame}>
    <AddressBar path="" />
    <div style={{ position: 'absolute', left: 80, top: 120, width: 1760 }}>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 96,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        Index of /talks/deleted-design-system
      </h1>
      <table
        style={{
          marginTop: 48,
          borderCollapse: 'collapse',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 38,
          width: '100%',
        }}
      >
        <thead>
          <tr style={{ borderBottom: RULE }}>
            <Cell head> </Cell>
            <Cell head>
              <Link>Name</Link>
            </Cell>
            <Cell head>
              <Link>Last modified</Link>
            </Cell>
            <Cell head style={{ textAlign: 'right' }}>
              <Link>Size</Link>
            </Cell>
            <Cell head>
              <Link>Description</Link>
            </Cell>
          </tr>
        </thead>
        <tbody>
          <IndexRow name="../" date="—" size="-" desc="Parent Directory" visited />
          <IndexRow
            name="01-the-problem/"
            date="2026-01-12 09:14"
            size="147"
            desc="how it got this bad"
          />
          <IndexRow name="02-the-numbers/" date="2026-09-30 17:02" size="6" desc="before / after" />
          <IndexRow name="03-what-we-kept/" date="2026-04-02 11:45" size="5" desc="not much" />
          <IndexRow name="04-the-rules/" date="2026-04-03 08:30" size="5" desc="we follow these" />
          <IndexRow name="05-yes-but/" date="2026-10-01 22:19" size="4" desc="your objections" />
          <IndexRow name="06-questions/" date="—" size="∞" desc="bring them" />
        </tbody>
      </table>
      <div style={{ borderTop: RULE, marginTop: 34, paddingTop: 18 }}>
        <span style={{ fontFamily: 'var(--osd-font-display)', fontStyle: 'italic', fontSize: 30 }}>
          Apache/2.4.62 (Unix) Server at fieldnote.dev Port 443
        </span>
      </div>
    </div>
  </div>
);

const BIG_LEFT = 60;
const BIG_TOP = 222;

const Problem: Page = () => (
  <div style={frame}>
    <AddressBar path="01-the-problem/" />
    <Tag style={{ position: 'absolute', left: 80, top: 110 }}>&lt;h2&gt; jan 2026 &lt;/h2&gt;</Tag>
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 150,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 52,
      }}
    >
      @fieldnote/ui contained
    </div>
    <MorphElement id="component-count">
      <div
        style={{
          position: 'absolute',
          left: BIG_LEFT,
          top: BIG_TOP,
          width: 1060,
          height: 600,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 720,
          lineHeight: '600px',
          letterSpacing: '-0.06em',
          color: 'var(--osd-accent)',
        }}
      >
        147
      </div>
    </MorphElement>
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 840,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
      }}
    >
      React components.
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1180,
        top: 250,
        width: 660,
        borderLeft: RULE,
        paddingLeft: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 44,
      }}
    >
      <Steps>
        <Tag>{'// and among them'}</Tag>
        <Step>
          <div
            className="bru-jolt"
            style={{ fontFamily: 'var(--osd-font-display)', fontSize: 60, lineHeight: 1.05 }}
          >
            31 were buttons.
          </div>
        </Step>
        <Step>
          <div className="bru-jolt" style={{ fontSize: 34, lineHeight: 1.35 }}>
            4 were called
            <br />
            &lt;PrimaryButton&gt;
          </div>
        </Step>
        <Step>
          <div
            className="bru-jolt"
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 60,
              lineHeight: 1.05,
              fontStyle: 'italic',
            }}
          >
            Nobody knew which one to use.
          </div>
        </Step>
        <Step>
          <div className="bru-jolt" style={{ fontSize: 34, lineHeight: 1.35 }}>
            → so everyone built a <span style={{ background: 'var(--osd-accent)' }}>32nd</span>.
          </div>
        </Step>
      </Steps>
    </div>
  </div>
);
Problem.transition = morphCut;

const NumRow = ({
  metric,
  before,
  after,
  delta,
}: {
  metric: string;
  before: ReactNode;
  after: string;
  delta: string;
}) => (
  <tr>
    <td style={{ border: RULE, padding: '14px 26px', fontFamily: 'var(--osd-font-display)' }}>
      {metric}
    </td>
    <td style={{ border: RULE, padding: '14px 26px', textAlign: 'right' }}>{before}</td>
    <td style={{ border: RULE, padding: '14px 26px', textAlign: 'right', fontWeight: 700 }}>
      {after}
    </td>
    <td
      style={{
        border: RULE,
        padding: '14px 26px',
        textAlign: 'right',
        background: 'var(--osd-accent)',
        fontWeight: 700,
      }}
    >
      {delta}
    </td>
  </tr>
);

const th: CSSProperties = {
  border: RULE,
  padding: '12px 26px',
  textAlign: 'left',
  background: 'var(--osd-text)',
  color: 'var(--osd-bg)',
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '0.04em',
};

const Numbers: Page = () => (
  <div style={frame}>
    <AddressBar path="02-the-numbers/" />
    <Tag style={{ position: 'absolute', left: 80, top: 110 }}>&lt;table border="3"&gt;</Tag>
    <h2
      style={{
        position: 'absolute',
        left: 80,
        top: 140,
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 400,
        fontSize: 110,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}
    >
      Before → After
    </h2>
    <table
      style={{
        position: 'absolute',
        left: 80,
        top: 300,
        width: 1760,
        borderCollapse: 'collapse',
        fontSize: 40,
      }}
    >
      <thead>
        <tr>
          <th style={th}>METRIC</th>
          <th style={{ ...th, textAlign: 'right' }}>JAN 2026</th>
          <th style={{ ...th, textAlign: 'right' }}>SEP 2026</th>
          <th style={{ ...th, textAlign: 'right' }}>Δ</th>
        </tr>
      </thead>
      <tbody>
        <NumRow
          metric="React components"
          before={
            <MorphElement id="component-count">
              <span
                style={{
                  display: 'inline-block',
                  color: 'var(--osd-text)',
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 46,
                  lineHeight: 1,
                }}
              >
                147
              </span>
            </MorphElement>
          }
          after="12"
          delta="−92%"
        />
        <NumRow metric="Lines of styling code" before="48,210" after="6,904" delta="−86%" />
        <NumRow metric="Design tokens" before="1,204" after="9" delta="−99%" />
        <NumRow metric="CSS shipped (gzip)" before="412 KB" after="96 KB" delta="−77%" />
        <NumRow metric="Days to ship a settings page" before="9" after="2" delta="−78%" />
        <NumRow metric="Open “DS” tickets" before="212" after="0" delta="closed" />
      </tbody>
    </table>
    <div style={{ position: 'absolute', left: 80, top: 930, fontSize: 24, color: GREY }}>
      * main branch, 30-day averages. we are a product team, not a lab. &lt;/table&gt;
    </div>
  </div>
);
Numbers.transition = morphCut;

const Statement: Page = () => (
  <div style={{ ...frame, background: 'var(--osd-accent)' }}>
    <AddressBar path="01-the-problem/diagnosis.txt" />
    <div style={{ position: 'absolute', left: 80, top: 120, fontSize: 28 }}>DIAGNOSIS ↓↓↓</div>
    <div
      style={{
        position: 'absolute',
        left: 72,
        top: 175,
        width: 1780,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 192,
        lineHeight: 0.9,
        letterSpacing: '-0.03em',
      }}
    >
      A component library
      <br />
      is a second product.
    </div>
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 640,
        width: 1760,
        borderTop: RULE,
        paddingTop: 30,
        fontSize: 44,
        lineHeight: 1.35,
        fontWeight: 700,
      }}
    >
      Nobody on our team was its customer.
      <br />
      Everybody on our team was its support desk.
    </div>
    <Marquee
      top={900}
      text="ROADMAP Q3: FIX <Button> ← FIX <ButtonV2> ← DEPRECATE <ButtonV2> ← WRITE MIGRATION GUIDE ← FIX <Button> ←"
    />
  </div>
);

const TermLine = ({ i, children, color }: { i: number; children: ReactNode; color?: string }) => {
  const live = useIsActivePage();
  return (
    <div
      className={live ? 'bru-type' : undefined}
      style={{ animationDelay: `${120 + i * 140}ms`, color, whiteSpace: 'pre' }}
    >
      {children}
    </div>
  );
};

const GitRm: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={frame}>
      <AddressBar path="01-the-problem/the-commit.log" />
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 120,
          width: 1760,
          height: 450,
          background: 'var(--osd-text)',
          color: 'var(--osd-bg)',
          padding: '34px 44px',
          fontSize: 30,
          lineHeight: 1.45,
          border: RULE,
          boxShadow: '14px 14px 0 var(--osd-accent)',
        }}
      >
        <TermLine i={0}>
          <span style={{ color: 'var(--osd-accent)' }}>$</span> git rm -r packages/ui
        </TermLine>
        <TermLine i={1} color="#bdbdbd">
          rm 'packages/ui/src/Button/Button.tsx'
        </TermLine>
        <TermLine i={2} color="#bdbdbd">
          rm 'packages/ui/src/Button/PrimaryButton.tsx'
        </TermLine>
        <TermLine i={3} color="#bdbdbd">
          rm 'packages/ui/src/Button/PrimaryButtonV2.tsx'
        </TermLine>
        <TermLine i={4} color="#bdbdbd">
          rm 'packages/ui/src/Button/ReallyPrimaryButton.tsx'
        </TermLine>
        <TermLine i={5} color="#bdbdbd">
          ... 1,407 more
        </TermLine>
        <TermLine i={6}>
          <span style={{ color: 'var(--osd-accent)' }}>$</span> git commit -m "delete the design
          system"
        </TermLine>
        <TermLine i={7}>
          [main 4e1f0c2] 1,412 files changed, 0 insertions(+), 48,210 deletions(-)
          <span
            className={live ? 'bru-blink' : undefined}
            style={{
              display: 'inline-block',
              width: 18,
              height: 34,
              background: 'var(--osd-bg)',
              marginLeft: 10,
              verticalAlign: 'middle',
            }}
          />
        </TermLine>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 66,
          top: 640,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 270,
          lineHeight: 0.9,
          letterSpacing: '-0.05em',
          color: 'var(--osd-accent)',
        }}
      >
        −48,210
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1230,
          top: 700,
          width: 610,
          fontSize: 30,
          lineHeight: 1.4,
          borderLeft: RULE,
          paddingLeft: 32,
        }}
      >
        lines, on a Tuesday, in one PR.
        <br />
        CI passed in 6 minutes.
        <br />
        Nothing caught fire.
      </div>
    </div>
  );
};

const KeptItem = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 22, padding: '16px 0', borderBottom: '1px solid #000' }}>
    <span style={{ color: GREY, width: 52 }}>{n}</span>
    <span>{children}</span>
  </div>
);

const DeletedItem = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 22, padding: '16px 0', borderBottom: '1px solid #000' }}>
    <span style={{ color: GREY, width: 52 }}>{n}</span>
    <span
      style={{
        textDecoration: 'line-through',
        textDecorationColor: 'var(--osd-accent)',
        textDecorationThickness: 6,
      }}
    >
      {children}
    </span>
  </div>
);

const Kept: Page = () => (
  <div style={frame}>
    <AddressBar path="03-what-we-kept/" />
    <h2
      style={{
        position: 'absolute',
        left: 80,
        top: 110,
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 400,
        fontSize: 120,
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}
    >
      What survived.
    </h2>
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 290,
        width: 1760,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        border: RULE,
        fontSize: 32,
      }}
    >
      <div style={{ padding: '24px 40px 34px', borderRight: RULE }}>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 56,
            marginBottom: 10,
          }}
        >
          KEPT <span style={{ fontSize: 32, color: GREY }}>(5)</span>
        </div>
        <KeptItem n="01">1 CSS file, 612 lines</KeptItem>
        <KeptItem n="02">9 color variables</KeptItem>
        <KeptItem n="03">5 font sizes. that's it.</KeptItem>
        <KeptItem n="04">&lt;button&gt; &lt;dialog&gt; &lt;details&gt;</KeptItem>
        <KeptItem n="05">a printed a11y checklist</KeptItem>
      </div>
      <div style={{ padding: '24px 40px 34px', background: '#f2f2f2' }}>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 56,
            marginBottom: 10,
          }}
        >
          DELETED <span style={{ fontSize: 32, color: GREY }}>(everything else)</span>
        </div>
        <DeletedItem n="01">147 React components</DeletedItem>
        <DeletedItem n="02">1,204 design tokens</DeletedItem>
        <DeletedItem n="03">3 nested theme providers</DeletedItem>
        <DeletedItem n="04">Storybook (14 min build)</DeletedItem>
        <DeletedItem n="05">the Thursday “DS guild”</DeletedItem>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 80, top: 900, fontSize: 30, lineHeight: 1.5 }}>
      <div>
        <span style={{ color: 'var(--osd-accent)' }}>$</span> wc -l styles/app.css
      </div>
      <div style={{ fontWeight: 700 }}>612 styles/app.css ← the entire design system</div>
    </div>
  </div>
);

const RuleRow = ({ n, title, children }: { n: string; title: string; children: ReactNode }) => (
  <div
    className="bru-jolt"
    style={{
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      alignItems: 'baseline',
      borderTop: RULE,
      padding: '8px 0 12px',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        lineHeight: 1,
        color: 'var(--osd-accent)',
      }}
    >
      §{n}
    </div>
    <div>
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 52, lineHeight: 1.1 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, marginTop: 6, color: '#222' }}>{children}</div>
    </div>
  </div>
);

const Rules: Page = () => (
  <div style={frame}>
    <AddressBar path="04-the-rules/RULES.txt" />
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 100,
        display: 'flex',
        alignItems: 'baseline',
        gap: 36,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontWeight: 400,
          fontSize: 120,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        THE RULES
      </h2>
      <span style={{ fontSize: 28 }}>(we actually follow these. mostly.)</span>
    </div>
    <div style={{ position: 'absolute', left: 80, top: 260, width: 1760, borderBottom: RULE }}>
      <Steps>
        <Step duration={0}>
          <RuleRow n="1" title="Use the platform.">
            &lt;button&gt; before &lt;Button&gt;. &lt;dialog&gt; before &lt;Modal&gt;.
          </RuleRow>
        </Step>
        <Step duration={0}>
          <RuleRow n="2" title="Copy, don’t import.">
            duplicate it today. delete it later. both are cheap.
          </RuleRow>
        </Step>
        <Step duration={0}>
          <RuleRow n="3" title="Three strikes, then extract.">
            not two. not “we’ll need it eventually.”
          </RuleRow>
        </Step>
        <Step duration={0}>
          <RuleRow n="4" title="The CSS file is the design system.">
            612 lines. every engineer has read all of it.
          </RuleRow>
        </Step>
        <Step duration={0}>
          <RuleRow n="5" title="Ship it in the browser.">
            mockups are a sketch, not a spec.
          </RuleRow>
        </Step>
      </Steps>
    </div>
  </div>
);

const Objection = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      borderTop: RULE,
      borderRight: RULE,
      padding: '30px 34px',
      fontFamily: 'var(--osd-font-display)',
      fontSize: 62,
      lineHeight: 1.1,
      fontStyle: 'italic',
    }}
  >
    {children}
  </div>
);

const Reply = ({ children }: { children: ReactNode }) => (
  <div
    className="bru-jolt"
    style={{
      borderTop: RULE,
      padding: '34px 38px',
      fontSize: 34,
      lineHeight: 1.4,
      height: '100%',
    }}
  >
    <span style={{ color: 'var(--osd-accent)', fontWeight: 700 }}>→ </span>
    {children}
  </div>
);

const YesBut: Page = () => (
  <div style={frame}>
    <AddressBar path="05-yes-but/" />
    <h2
      style={{
        position: 'absolute',
        left: 80,
        top: 110,
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontWeight: 400,
        fontSize: 120,
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}
    >
      “Yes, but what about—”
    </h2>
    <div
      style={{
        position: 'absolute',
        left: 80,
        top: 290,
        width: 1760,
        display: 'grid',
        gridTemplateColumns: '500px 1fr',
        border: RULE,
        borderTop: 'none',
      }}
    >
      <Steps>
        <Objection>Consistency?</Objection>
        <Step duration={0}>
          <Reply>We got MORE consistent. 9 colors fit in your head. 1,204 tokens never did.</Reply>
        </Step>
        <Objection>Accessibility?</Objection>
        <Step duration={0}>
          <Reply>
            Native elements ship it for free. Our custom &lt;Select&gt; had 14 open a11y bugs.
          </Reply>
        </Step>
        <Objection>Onboarding?</Objection>
        <Step duration={0}>
          <Reply>Day one: read one CSS file. New hires are done by lunch.</Reply>
        </Step>
        <Objection>Scale?</Objection>
        <Step duration={0}>
          <Reply>We are 40 engineers. Ask us again at 400. Seriously, email us.</Reply>
        </Step>
      </Steps>
    </div>
  </div>
);

const Quote: Page = () => (
  <div style={frame}>
    <AddressBar path="05-yes-but/the-wrong-abstraction.html" />
    <div
      aria-hidden
      style={{
        position: 'absolute',
        right: 70,
        top: 470,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 900,
        lineHeight: 1,
        color: 'var(--osd-accent)',
      }}
    >
      ”
    </div>
    <div style={{ position: 'absolute', left: 80, top: 130, fontSize: 28 }}>&lt;blockquote&gt;</div>
    <div
      style={{
        position: 'absolute',
        left: 72,
        top: 210,
        width: 1700,
        fontFamily: 'var(--osd-font-display)',
        fontStyle: 'italic',
        fontSize: 150,
        lineHeight: 1,
        letterSpacing: '-0.025em',
      }}
    >
      Duplication is far cheaper than the wrong abstraction.
    </div>
    <div style={{ position: 'absolute', left: 80, top: 610, fontSize: 34 }}>
      — Sandi Metz, <Link>“The Wrong Abstraction”</Link>, 2016
    </div>
    <div style={{ position: 'absolute', left: 80, top: 690, fontSize: 28 }}>
      &lt;/blockquote&gt;
    </div>
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 80,
        borderTop: RULE,
        paddingTop: 20,
        fontSize: 26,
        color: GREY,
      }}
    >
      we printed this and taped it above the coffee machine. it is still there.
    </div>
  </div>
);

const Questions: Page = () => (
  <div style={frame}>
    <AddressBar path="06-questions/" />
    <div
      style={{
        position: 'absolute',
        left: 50,
        top: 90,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 500,
        lineHeight: 1,
        letterSpacing: '-0.07em',
      }}
    >
      Q&amp;A<span style={{ color: 'var(--osd-accent)' }}>?</span>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1350,
        top: 150,
        width: 500,
        fontSize: 30,
        lineHeight: 1.5,
        borderLeft: RULE,
        paddingLeft: 36,
      }}
    >
      <div style={{ color: GREY }}>slides + the 612-line CSS file:</div>
      <div style={{ fontSize: 36, marginTop: 6 }}>
        <Link>fieldnote.dev/deleted</Link>
      </div>
      <div style={{ color: GREY, marginTop: 40 }}>yell at us:</div>
      <div style={{ marginTop: 6 }}>
        <Link>@hanaokafor</Link>
        <br />
        <Link>@devruiz</Link>
      </div>
      <div style={{ color: GREY, marginTop: 40 }}>hiring?</div>
      <div style={{ marginTop: 6 }}>yes. no design system required.</div>
    </div>
    <Marquee
      top={760}
      invert={false}
      text="ASK US ANYTHING ← EXCEPT TABS VS SPACES ← YES WE STILL USE FIGMA ← NO WE DID NOT GET FIRED ←"
    />
    <div style={{ position: 'absolute', left: 80, top: 900, fontSize: 26, color: GREY }}>
      &lt;/html&gt; &lt;!-- thanks for reading the source --&gt;
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'We Deleted Our Design System',
  createdAt: '2026-10-07T16:02:26.711Z',
};

export default [
  Cover,
  Agenda,
  Problem,
  Numbers,
  Statement,
  GitRm,
  Kept,
  Rules,
  YesBut,
  Quote,
  Questions,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Walk out, don't say anything, let the marquee run for a second.
"Hi. We deleted our design system. We're not sorry. Give us thirty minutes and you might not be either."
Introduce yourselves: Hana runs frontend, Dev leads design.`,
  `This is literally an Apache directory listing. That's the energy of this talk.
Six folders. We'll go in order. Questions at the end — there's a folder for that too.`,
  `"In January our component library had a hundred and forty-seven components."
Click: thirty-one of them were buttons. Click: four were called PrimaryButton.
Click: nobody knew which one to use. Click — and so, every new feature built a thirty-second.`,
  `Watch the 147 fly into the table. That's the before.
Read three rows: components 147 to 12, tokens 1,204 to 9, settings page nine days to two.
Then the last row: 212 open design-system tickets — we didn't fix them, we closed the project.`,
  `Pause. Let them read it.
"A component library is a second product." We were staffing it like a side project.
Nobody was its customer; everyone was its support desk.`,
  `This is the actual commit. Tuesday afternoon, one PR.
Forty-eight thousand lines gone. Zero insertions.
CI passed in six minutes and nothing caught fire. Let that land.`,
  `What we kept fits on a sticky note: one CSS file, nine colors, five font sizes, native elements, and a printed accessibility checklist.
What we deleted — read the right column slowly, especially the Thursday guild meeting. Get the laugh.`,
  `Five rules, one at a time.
Use the platform. Copy, don't import. Three strikes, then extract.
The CSS file is the design system. And: ship it in the browser.
Mention rule four is enforced in code review — if it's not in the CSS file, it's not a pattern.`,
  `These are the four questions we get every time. Reveal each answer after you read the question out loud.
On accessibility, be specific: fourteen open bugs on our custom Select, zero on the native one.
On scale, be honest — we're forty engineers.`,
  `The one quote. Sandi Metz, 2016.
Don't over-explain it. Say: "We printed this and taped it above the coffee machine."`,
  `Q&A. Point at the link for the slides and the CSS file.
If nobody asks a question in five seconds, ask the room: "Who here has more than three button components?"`,
];

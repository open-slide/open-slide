---
name: Fieldwork
description: Notion-style operating plan — warm off-white page, heavy Inter headlines, Newsreader italic quotes, wobbly ink illustrations, pastel tinted cards and coral hand-drawn annotations.
mode: light
---

# Fieldwork

## Palette

Ink and coral carry the page. The four pastels fill illustrations; their paler tints fill cards. Use coral for one thing per page — the eyebrow, a circled number, an arrow, a miss.

| Role        | Value                  | Notes                                                    |
| ----------- | ---------------------- | -------------------------------------------------------- |
| bg          | `#FFFEFC`              | warm off-white page                                      |
| text        | `#191919`              | ink — headlines, strokes, primary copy                   |
| accent      | `#E8553B`              | coral — eyebrow, annotations, circled numbers, misses    |
| body        | `#5F5E5B`              | warm grey body copy and subtitles                        |
| muted       | `#9B9A97`              | captions, footer, card index, the "from" in from → to    |
| rule        | `rgba(25,25,25,0.12)`  | 1.5 px hairlines between rows                            |
| track       | `rgba(25,25,25,0.09)`  | progress-bar track                                       |
| neutral     | `#E7E5E0`              | "previous period" bars in charts                         |
| paper       | `#FFFFFF`              | fill inside ink drawings (phones, pages, faces)          |
| yellow      | `#F8DA7E`              | illustration fill, sparkles, backdrop circles            |
| blue        | `#8DBDEB`              | illustration fill                                        |
| pink        | `#F6C3CF`              | illustration fill                                        |
| green       | `#A6D4B2`              | illustration fill                                        |
| highlight   | `#FCE38A`              | marker highlight behind a phrase (alt: `#FADDE4` pink)   |
| tintYellow  | `#FBF3DB`              | card background                                          |
| tintBlue    | `#E7F3F8`              | card background                                          |
| tintPink    | `#FAF1F5`              | card background                                          |
| tintGreen   | `#EDF3EC`              | card background                                          |
| ok          | `#448361`              | status text — on track                                   |
| warn        | `#B07A12`              | status text — medium risk                                |
| note        | `#3E7FCF`              | secondary annotation stroke / "watch" status             |

Tweakable tokens for a real slide (headlines read `var(--osd-font-display)`, hero size reads `var(--osd-size-hero)`):

```tsx
export const design: DesignSystem = {
  palette: { bg: '#FFFEFC', text: '#191919', accent: '#E8553B' },
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  },
  typeScale: { hero: 150, body: 34 },
  radius: 24,
};
```

## Typography

- Display font: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif` — weight 780, line-height 1.0, letter-spacing `-0.04em` at ≥ 100 px and `-0.03em` below, word-spacing `0.08em`.
- Body font: same Inter stack — weight 400; 600–720 for labels and inline emphasis. Set `fontVariantNumeric: 'tabular-nums'` on the page root.
- Quote font: `"Newsreader", "Iowan Old Style", Georgia, serif` — italic 400, only for pull quotes.
- Webfont import: `https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=Newsreader:ital,opsz,wght@1,6..72,400&display=swap` — inject once at module top level with a slide-keyed link id (see `references/webfonts.md` in `slide-authoring`).
- Type scale:
  - Hero title: 150 px (cover, three short lines).
  - Section / closer heading: 120–130 px, line-height 0.98.
  - Page heading: 104 px.
  - Card title: 42–54 px, display recipe.
  - Big stat: 140 px (hero stat), 84 px (inline), 60–72 px (table cell), letter-spacing `-0.04em` to `-0.05em`.
  - Pull quote: 66 px Newsreader italic, line-height 1.16.
  - Body: 34 px on the cover, 28–32 px on content pages, line-height 1.45–1.5, color `body`.
  - Eyebrow: 26 px, weight 650, coral, sentence case.
  - Caption / meta: 22–26 px, color `muted`.
  - Footer: 21 px.

## Layout

- Canvas 1920 × 1080, absolutely positioned on a fixed grid. Left edge `X0 = 120`, content width `W = 1680`.
- Vertical rhythm: eyebrow at `top: 116`, page heading at `top: 160`, a one-line aside right-aligned at `left: 1220–1300, top: 196`, main content from `top: 330`, last content ends by ~940, footer at `top: 1000`.
- Cards: radius 24, flat pastel tint, no border, no shadow. Three across: 536 × 610 at `x = 120 / 692 / 1264`. Full-width rows: 1680 × 188, stacked 20 px apart.
- Tables and lists: rows separated by 1.5 px `rule` hairlines; header rules in solid 2 px ink.
- Illustrations sit right of the text block (`x ≈ 940–1080`) on a pastel backdrop circle, and never overlap type.
- Position helper:

```tsx
const abs = (left: number, top: number, width?: number, height?: number): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
});
```

## Fixed components

These are paste-ready. Copy them verbatim into a slide that uses this theme (`import { type CSSProperties, type ReactNode, useId } from 'react';`).

### Title

```tsx
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
```

### Heading

Page headings (104), closer headings (130) and card titles (54) share one recipe.

```tsx
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
```

### Footer

Pin mark + wordmark + label on the left, zero-padded counter on the right. Pass your own `brand` / `label`.

```tsx
import { useSlidePageNumber } from '@open-slide/core';

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
```

### Eyebrow

Coral, sentence case, no tracking — it reads like a Notion page breadcrumb, not a label.

```tsx
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
```

### Highlight

Marker swipe behind one phrase per page. Uneven radii make it look hand-applied.

```tsx
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
```

### TintCard

Flat pastel card. Pick the tint from `tintBlue` / `tintGreen` / `tintYellow` / `tintPink`; rotate through them across a row.

```tsx
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
```

### Ink, Stroke, CircleDoodle, Sparkle

The hand-drawn layer. `Ink` is an SVG with round 3.2 px ink strokes run through a turbulence filter so every line wobbles slightly. Draw illustrations inside it with plain `<path>` / `<rect>` / `<circle>`: ink outline, `#FFFFFF` or a pastel fill, and a pastel backdrop circle with `stroke="none"`. `Stroke` draws itself in when `live` is true — pass `useIsActivePage()` from the page. `CircleDoodle` loops a key number in coral; `Sparkle` is the four-point star used as a bullet, milestone or garnish.

```tsx
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
```

Hand-drawn arrow / underline: an `Ink` box with one or two coral `Stroke`s, e.g. an underline `M6 22C120 10 260 30 400 16S510 12 532 16`, or an arrow whose head is two short strokes appended to the shaft (`…M22 50L44 30M22 50L50 58`).

## Motion

- Philosophy: subtle — pages ease in with a 5 px lift, then the ink annotations draw themselves and bars grow once the page is active; nothing loops.
- Keyframes (inject once at module top level with a slide-keyed `<style>` id):

```css
@keyframes fw-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes fw-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes fw-rise { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes fw-grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
```

- Easing: `cubic-bezier(0, 0, 0.2, 1)` out, `cubic-bezier(0.4, 0, 1, 1)` in. Draws run 0.7–0.8 s with a 0.3–1.0 s delay; bars `fw-rise` / `fw-grow` 0.7 s from `transformOrigin` bottom / left.
- Gate every on-page animation on `useIsActivePage()` so thumbnails render the finished state.
- Page transition:

```tsx
export const transition: SlideTransition = {
  duration: 240,
  exit: {
    duration: 240,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    keyframes: [{ opacity: 1 }, { opacity: 1 }],
  },
  enter: {
    duration: 240,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    keyframes: [
      { opacity: 0, transform: 'translateY(5px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};
```

- For a card that opens into its own page, wrap the tinted card background in `MorphElement` and use `morph: { duration: 760, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }`; fade the new page's contents in with `fw-fade` after the morph.

## Aesthetic

A company operating plan written in Notion and illustrated by hand: warm paper-white canvas, very heavy tight Inter headlines that read like page titles, calm warm-grey body copy, and generous empty space. Personality comes from the ink layer — wobbly black-outlined spot illustrations (vans, houses, phones, people, toolboxes) sitting on soft pastel circles, coral circles and arrows scribbled over the numbers that matter, a yellow marker swipe behind one phrase, and the occasional Newsreader italic quote. Every number is real and owned by someone. Avoid: gradients, drop shadows, card borders, dark backgrounds, photography, emoji, uppercase tracked labels, more than one coral mark competing on a page, and illustrations drawn with clean geometric (non-wobbly) strokes.

## Example usage

```tsx
const root: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  background: '#FFFEFC',
  color: '#191919',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  fontVariantNumeric: 'tabular-nums',
  WebkitFontSmoothing: 'antialiased',
};

const Cover: Page = () => (
  <div style={root}>
    <div style={{ ...abs(120, 100), display: 'flex', alignItems: 'center', gap: 14 }}>
      <Mark size={32} />
      <span style={{ fontSize: 30, fontWeight: 760, letterSpacing: '-0.03em' }}>Fieldwork</span>
    </div>
    <div style={abs(120, 262)}>
      <Title>
        The annual
        <br />
        operating
        <br />
        plan.
      </Title>
    </div>
    <p style={{ ...abs(120, 772, 760), margin: 0, fontSize: 34, lineHeight: 1.45, color: '#5F5E5B' }}>
      Where we are, where we are going, and <Highlight>who owns each step</Highlight>.
    </p>
    <div style={{ ...abs(120, 906), fontSize: 24, color: '#9B9A97' }}>
      All-hands pre-read · Planning team
    </div>
    <Footer />
  </div>
);

const Summary: Page = () => {
  const live = useIsActivePage();
  return (
    <div style={root}>
      <div style={abs(120, 116)}>
        <Eyebrow>Strategy</Eyebrow>
      </div>
      <div style={abs(120, 160)}>
        <Heading>Three bets this year.</Heading>
      </div>
      <TintCard tint="#E7F3F8" style={abs(120, 330, 536, 610)}>
        …
      </TintCard>
      <CircleDoodle x={710} y={834} w={300} h={104} live={live} />
      <Footer />
    </div>
  );
};
```

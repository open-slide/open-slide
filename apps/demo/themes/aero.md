---
name: Aero
description: Kinetic sports-launch deck — electric violet, volt accent, italic condensed caps, every edge cut on one 12° angle.
mode: dark
---

# Aero

## Palette

Three base colours carry the deck (violet / volt / ink). Everything else is a supporting tint. Volt is the only highlight — one volt thing per idea, never a volt paragraph.

| Role     | Value                    | Notes                                                                                   |
| -------- | ------------------------ | --------------------------------------------------------------------------------------- |
| bg       | `#4B1DFF`                | electric violet ("UV") — default page, `design.palette.bg`                              |
| text     | `#FFFFFF`                | primary copy on violet and ink                                                          |
| accent   | `#D8FF2E`                | volt — hero digits, bands, bib + kicker chips, the "target" in every chart              |
| ink      | `#0B0A14`                | near-black — text on volt, third page tone, chip / marker fill                          |
| deep     | `#2A0FA3`                | deep violet — streaks, baseline bars, track and start-line blocks on violet             |
| muted    | `#D3CAFF`                | lavender — secondary copy, labels, axis ticks on violet (`TONES.uv.dim`)                |
| coral    | `#FF4A3D`                | hot accent — placings ("1st"), record counts, one chip per page at most                 |
| foam     | `#BBAEFF`                | light violet tint for illustration fills only                                           |
| whiteA   | `rgba(255,255,255,a)`    | `0.6` dim copy on ink · `0.22–0.36` streaks + rules · `0.26` inactive bars · `0.12` chip |
| inkA     | `rgba(11,10,20,a)`       | on volt pages: `0.66` secondary copy · `0.7` captions · `0.24` inactive bars + rules    |

### Design tokens + tones

Declare the `design` const so `bg` / `text` / `accent` / fonts / hero size stay tweakable from the Design panel; the rest are plain constants. Every page picks one of three **tones** — the `TONES` map tells chrome (footer, kicker) which colours to use on that background.

```tsx
export const design: DesignSystem = {
  palette: { bg: '#4B1DFF', text: '#FFFFFF', accent: '#D8FF2E' },
  fonts: {
    display: '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif',
    body: '"Barlow", system-ui, sans-serif',
  },
  typeScale: { hero: 620, body: 30 },
  radius: 0,
};

const INK = '#0B0A14';
const CORAL = '#FF4A3D';
const DEEP = '#2A0FA3';
const LAV = '#D3CAFF';
const WHITE_A = (a: number) => `rgba(255,255,255,${a})`;
const INK_A = (a: number) => `rgba(11,10,20,${a})`;

type Tone = 'uv' | 'volt' | 'ink';

const TONES: Record<Tone, { bg: string; fg: string; dim: string; hi: string; hiFg: string }> = {
  uv: { bg: 'var(--osd-bg)', fg: 'var(--osd-text)', dim: LAV, hi: 'var(--osd-accent)', hiFg: INK },
  volt: {
    bg: 'var(--osd-accent)',
    fg: INK,
    dim: 'rgba(11,10,20,0.66)',
    hi: INK,
    hiFg: 'var(--osd-accent)',
  },
  ink: {
    bg: INK,
    fg: 'var(--osd-text)',
    dim: 'rgba(255,255,255,0.6)',
    hi: 'var(--osd-accent)',
    hiFg: INK,
  },
};
```

- `uv` — default. Violet page, white type, lavender labels, volt highlights.
- `volt` — inverted: volt page, ink type. Use for lab data, pricing, asks — the pages that must be read.
- `ink` — near-black page for results / proof. Coral is most at home here.

## Typography

- Display font: `var(--osd-font-display)` → `"Barlow Condensed", "Arial Narrow", system-ui, sans-serif` — **always italic, always uppercase**, weight 900 (800 for secondary numerals), line-height 0.84, letter-spacing -0.012em. Numerals add `tabular-nums` and -0.015em.
- Body font: `var(--osd-font-body)` → `"Barlow", system-ui, sans-serif` — weight 500 for copy; labels are weight 600–700, uppercase, letter-spacing 0.2em.
- Webfont import: `https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;1,700;1,800;1,900&family=Barlow:wght@400;500;600;700&display=swap` — inject once at module top level (snippet under **Foundation** below), per `references/webfonts.md` in `slide-authoring`.
- Type scale (deliberately extreme — overrides `slide-authoring` defaults):
  - Hero title: **620 px** (`var(--osd-size-hero)`), line-height 0.8, -0.02em, `nowrap` — one short word + a volt digit (≈ 6 characters max).
  - Section / divider / closer heading: 196–236 px.
  - Page heading: 104–150 px (`Title` default 132).
  - Hero stat numeral: 280–360 px. Secondary numerals: 84–150 px. Inline / row numerals: 40–104 px.
  - Band text and card titles: 40–92 px display.
  - Body text: **30 px**, line-height 1.4 (secondary copy 22–26 px).
  - Label: 20 px (17–24). Footnote / tiny label: 15–16 px.
  - Footer: 17 px label, 24 px bib numeral.

## Layout

- Canvas: 1920 × 1080, **absolutely positioned** with the `abs(x, y)` helper — composition is placed, not flowed.
- Left rail `x = 120`, right edge `x = 1800` (content width 1680). Display type sits 4–8 px left of the rail (`x = 112–116`, hero at 96) so the italic overhang lines up optically with labels at 120.
- Vertical rhythm: wordmark / kicker row at y ≈ 92–104 · heading at y ≈ 156–168 · content down to ≈ 960 · footer bib at y = 1004 (32 px tall).
- Full-bleed motifs (streaks, bands, start-line stripe) overrun the canvas (`left: -80`, width 2080) so skewed ends never show; `Stage` clips with `overflow: hidden`.
- Radius is 0 everywhere. No rounded corners, no shadows, no gradients.

### The 12° angle system

One angle drives every slanted edge in the deck — chips, bars, bands, streaks, rules, chart columns, even SVG hatching. Never introduce a second angle.

```tsx
const ANGLE = 12;
const T = Math.tan((ANGLE * Math.PI) / 180);
const SKEW = `skewX(-${ANGLE}deg)`;

const cut = (h: number) => {
  const d = (h * T).toFixed(2);
  return `polygon(${d}px 0, 100% 0, calc(100% - ${d}px) 100%, 0 100%)`;
};

const BAND_RATIO = 12;
const BAND_PCT = ((T / BAND_RATIO) * 100).toFixed(4);
const BAND_CLIP = `polygon(${BAND_PCT}% 0, 100% 0, ${(100 - Number(BAND_PCT)).toFixed(4)}% 100%, 0 100%)`;
```

- `SKEW` — for thin things that are *only* slant: streaks, vertical rules, the three-bar mark, spec ticks. Use `transformOrigin: '0 100%'` so the foot stays on its x.
- `cut(h)` — for filled blocks with upright content inside (chips, bars, ask rows, bib). Pass the element's own pixel height; the clip offset is `h · tan 12°`, so the lean is identical at any height.
- `BAND_CLIP` — the signature volt band. Its height is always `w / BAND_RATIO`; the clip is percentage-based so the band can scale or morph between pages and keep the angle.
- In SVG charts, offset a bar's top by `h * T` (parallelogram columns), and skew SVG patterns with ``patternTransform={`skewX(-${ANGLE})`}``.

## Fixed components

These are paste-ready. Copy them verbatim into a slide that uses this theme. Swap the placeholder brand (`Tempo`) and footer labels for the real ones.

### Foundation

Shared type styles, helpers and the module-level webfont + keyframe injection (replace `<slide-id>` with the slide's folder id).

```tsx
import type { CSSProperties, ReactNode } from 'react';

const SLIDE_ID = '<slide-id>';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;1,700;1,800;1,900&family=Barlow:wght@400;500;600;700&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;
const KEYFRAMES = `
@keyframes ae-run { from { transform: translateX(0) } to { transform: translateX(calc(var(--tile) * -1)) } }
@keyframes ae-in { from { opacity: 0; transform: translateX(-56px) } to { opacity: 1; transform: none } }
@keyframes ae-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ae-pace { to { stroke-dashoffset: -1000 } }
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

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontStyle: 'italic',
  fontWeight: 900,
  textTransform: 'uppercase',
  lineHeight: 0.84,
  letterSpacing: '-0.012em',
  margin: 0,
};

const NUM: CSSProperties = {
  ...DISPLAY,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.015em',
};

const LABEL: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const BODY: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontSize: 30,
  fontWeight: 500,
  lineHeight: 1.4,
  margin: 0,
};

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const pad = (n: number) => String(n).padStart(2, '0');
```

### Title

Absolute-placed display heading. `color` inherits from the page tone; pass `style` for entry animation.

```tsx
const Title = ({
  children,
  size = 132,
  x = 116,
  y = 160,
  style,
}: {
  children: ReactNode;
  size?: number;
  x?: number;
  y?: number;
  style?: CSSProperties;
}) => <h2 style={{ ...DISPLAY, ...abs(x, y), fontSize: size, ...style }}>{children}</h2>;
```

### Footer

The race bib: page number in a cut volt chip, total beside it, brand + deck title + meta label. Tone-aware via `TONES`. Rendered by `Stage` — covers, dividers and closers turn it off.

```tsx
import { useSlidePageNumber } from '@open-slide/core';

const Footer = ({
  tone,
  brand = 'Tempo',
  title = 'Season plan',
  meta = '2027 · Confidential',
}: {
  tone: Tone;
  brand?: string;
  title?: string;
  meta?: string;
}) => {
  const { current, total } = useSlidePageNumber();
  const t = TONES[tone];
  return (
    <div
      style={{
        ...LABEL,
        position: 'absolute',
        left: 120,
        right: 120,
        top: 1004,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        fontSize: 17,
        color: t.dim,
        zIndex: 5,
      }}
    >
      <span
        style={{
          ...NUM,
          width: 64,
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: t.hi,
          color: t.hiFg,
          clipPath: cut(32),
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: 0,
        }}
      >
        {pad(current)}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums', marginLeft: -8 }}>/ {pad(total)}</span>
      <span style={{ color: t.fg, marginLeft: 14 }}>{brand}</span>
      <span>{title}</span>
      <span style={{ marginLeft: 'auto' }}>{meta}</span>
    </div>
  );
};
```

### Stage

Every page's root. Sets the tone background + text colour and mounts the footer.

```tsx
const Stage = ({
  tone = 'uv',
  footer = true,
  children,
}: {
  tone?: Tone;
  footer?: boolean;
  children: ReactNode;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: TONES[tone].bg,
      color: TONES[tone].fg,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    {footer && <Footer tone={tone} />}
  </div>
);
```

### Eyebrow (Kicker)

A cut chip with the section tag, followed by the page's subject in label type. Sits top-left at `(120, 104)` on every content page.

```tsx
const Kicker = ({
  tag,
  children,
  tone = 'uv',
  x = 120,
  y = 104,
}: {
  tag: string;
  children: ReactNode;
  tone?: Tone;
  x?: number;
  y?: number;
}) => {
  const t = TONES[tone];
  return (
    <div
      style={abs(x, y, { ...LABEL, display: 'flex', alignItems: 'center', gap: 18, color: t.fg })}
    >
      <span
        style={{
          ...LABEL,
          height: 32,
          padding: '0 18px',
          display: 'inline-flex',
          alignItems: 'center',
          background: t.hi,
          color: t.hiFg,
          clipPath: cut(32),
          fontWeight: 700,
          fontSize: 17,
        }}
      >
        {tag}
      </span>
      {children}
    </div>
  );
};
```

### Wordmark + Mark

Three skewed bars stepping down in opacity — the brand's speed mark. Wordmark at `(120, 92)` on covers and closers; the Mark alone (in ink, `h={64}`) sits inside the volt band.

```tsx
const Mark = ({ color, h = 34 }: { color: string; h?: number }) => (
  <div style={{ display: 'flex', gap: h * 0.16 }}>
    <div style={{ width: h * 0.3, height: h, background: color, transform: SKEW }} />
    <div style={{ width: h * 0.3, height: h, background: color, transform: SKEW, opacity: 0.7 }} />
    <div style={{ width: h * 0.3, height: h, background: color, transform: SKEW, opacity: 0.4 }} />
  </div>
);

const Wordmark = ({
  x,
  y,
  brand = 'Tempo',
  color = 'var(--osd-text)',
  mark = 'var(--osd-accent)',
}: {
  x: number;
  y: number;
  brand?: string;
  color?: string;
  mark?: string;
}) => (
  <div style={abs(x, y, { display: 'flex', alignItems: 'center', gap: 18, zIndex: 4 })}>
    <Mark color={mark} />
    <span style={{ ...DISPLAY, fontSize: 46, letterSpacing: '0.02em', color, lineHeight: 1 }}>
      {brand}
    </span>
  </div>
);
```

### Streak

A skewed, dashed speed line that loops sideways. Stack 8–12 on a cover in `deep` (thick, slow) and `WHITE_A(0.22–0.36)` (hairline, fast). `live` comes from `useIsActivePage()`.

```tsx
const Streak = ({
  y,
  h,
  tile,
  dash,
  color,
  dur,
  shift = 0,
  live,
}: {
  y: number;
  h: number;
  tile: number;
  dash: number;
  color: string;
  dur: number;
  shift?: number;
  live: boolean;
}) => (
  <div
    style={{
      position: 'absolute',
      left: -80,
      top: y,
      width: 2080,
      height: h,
      overflow: 'hidden',
      transform: SKEW,
    }}
  >
    <div
      style={
        {
          '--tile': `${tile}px`,
          width: 2080 + tile,
          height: h,
          backgroundImage: `linear-gradient(90deg, ${color} 0 ${dash}px, transparent ${dash}px)`,
          backgroundSize: `${tile}px ${h}px`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: `${shift}px 0`,
          animation: live ? `ae-run ${dur}s linear infinite` : undefined,
        } as CSSProperties
      }
    />
  </div>
);
```

### VoltBand

The signature skewed band — the "one line" of the deck. Put band text over it in ink. For a cover-to-page morph, wrap it in `<MorphElement id="volt-band">` (see Motion).

```tsx
const VoltBand = ({ x, y, w }: { x: number; y: number; w: number }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: w / BAND_RATIO,
      background: 'var(--osd-accent)',
      clipPath: BAND_CLIP,
    }}
  />
);
```

### CutBar, SkewRule, Chip, SpecChip

Data bars, column dividers, tags and inline spec ticks — all on the 12° angle.

```tsx
const CutBar = ({
  x,
  y,
  w,
  h,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: color,
      clipPath: cut(h),
    }}
  />
);

const SkewRule = ({
  x,
  y,
  h,
  w = 6,
  color = 'var(--osd-accent)',
}: {
  x: number;
  y: number;
  h: number;
  w?: number;
  color?: string;
}) => (
  <div
    style={abs(x, y, {
      width: w,
      height: h,
      background: color,
      transform: SKEW,
      transformOrigin: '0 100%',
    })}
  />
);

const Chip = ({
  children,
  bg = CORAL,
  fg = INK,
  h = 34,
}: {
  children: ReactNode;
  bg?: string;
  fg?: string;
  h?: number;
}) => (
  <span
    style={{
      ...LABEL,
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: '0.14em',
      height: h,
      padding: '0 16px',
      display: 'inline-flex',
      alignItems: 'center',
      background: bg,
      color: fg,
      clipPath: cut(h),
    }}
  >
    {children}
  </span>
);

const SpecChip = ({ children }: { children: ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 22 }}>
    <span style={{ width: 4, height: 22, background: 'var(--osd-accent)', transform: SKEW }} />
    {children}
  </span>
);
```

- `CutBar` — horizontal data bar; `deep` for baseline, `VoltBand` (or volt `CutBar`) for the target, `INK_A(0.24)` for "category average" on volt pages.
- `SkewRule` — 6 px volt divider between hero stats; 3 px `WHITE_A(0.3)` for split / table columns.
- `Chip` — coral by default for placings and callouts; `bg={WHITE_A(0.12)} fg="#FFFFFF"` for neutral codes (country, size).
- `SpecChip` — the spec row under a cover band: a plain first item, then each following spec led by a skewed volt tick (`4 drops`, `<SpecChip>38 markets</SpecChip>`, …).

## Motion

- Philosophy: **rich, but only where it means speed.** Covers, dividers and closers move (looping streaks, a snap-in hero, a pace light running a track); content pages hold still apart from `<Steps>` reveals and one morph. Every move is horizontal and travels left → right. Gate all animation on `useIsActivePage()` so thumbnails, the overview grid and PDF render the final frame.
- Reusable keyframes (already in the Foundation `KEYFRAMES` string):

```css
@keyframes ae-run { from { transform: translateX(0) } to { transform: translateX(calc(var(--tile) * -1)) } }
@keyframes ae-in { from { opacity: 0; transform: translateX(-56px) } to { opacity: 1; transform: none } }
@keyframes ae-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ae-pace { to { stroke-dashoffset: -1000 } }
```

- `ae-run` — `Streak` loops, 1.3–4.2 s linear infinite; thinner streaks run faster.
- `ae-in` — hero and headline entries: `ae-in 0.8s ${SNAP} ${delay}s both`, staggered 0.05 s → 0.18 s.
- `ae-fade` — content that lands on a bar after a morph: `ae-fade 0.45s ease-out ${MORPH_MS}ms both`.
- `ae-pace` — a white dash running along an SVG path (`pathLength={1000}`, `strokeDasharray: '22 228'`, 9 s linear infinite).

Easing + page transitions — a fast 240 ms nudge in the direction of travel; the outgoing page holds while the new one lands:

```tsx
import { type SlideTransition } from '@open-slide/core';

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const SNAP = 'cubic-bezier(0.16, 1, 0.3, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 860;

export const transition: SlideTransition = {
  duration: 240,
  exit: { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateX(calc(var(--osd-dir, 1) * 10px))' },
      { opacity: 1, transform: 'translateX(0)' },
    ],
  },
};

const morphTransition: SlideTransition = {
  duration: 300,
  exit: { duration: 320, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 320, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' },
};
```

The signature move: the cover's full-width `VoltBand` morphs into the "target" bar on the next page (wrap both in `<MorphElement id="volt-band">`, set `Cover.transition = morphTransition` and the same on the receiving page).

## Aesthetic

Kinetic sports launch — the visual language of a race-day campaign: electric violet like a stadium at night, a single volt line you can follow across the whole deck, numbers set huge in italic condensed caps the way a bib or a finish clock would set them. Everything leans forward on the same 12° angle, so even a static page feels like it's moving left to right. Composition is placed, not flowed: big numerals carry the page and copy stays short. Hold the discipline — one highlight colour, one angle, one display face. Avoid: rounded corners, drop shadows, gradients, glows, photography that fights the flat colour, upright (non-italic) display type, sentence-case headlines, a second slant angle, and more than one coral element per page.

## Example usage

```tsx
const Cover: Page = () => {
  const live = useIsActivePage();
  const enter = (delay: number): CSSProperties =>
    live ? { animation: `ae-in 0.8s ${SNAP} ${delay}s both` } : {};
  return (
    <Stage footer={false}>
      <Streak y={236} h={16} tile={920} dash={560} color={DEEP} dur={3.4} shift={-300} live={live} />
      <Streak y={462} h={3} tile={340} dash={120} color={WHITE_A(0.3)} dur={1.5} live={live} />
      <Wordmark x={120} y={92} />
      <h1
        style={{
          ...DISPLAY,
          ...abs(96, 156),
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 0.8,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          ...enter(0.05),
        }}
      >
        Run <span style={{ color: 'var(--osd-accent)' }}>27</span>
      </h1>
      <VoltBand x={60} y={700} w={1800} />
      <div
        style={abs(196, 700, {
          height: 150,
          width: 1528,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: INK,
          ...enter(0.18),
        })}
      >
        <span style={{ ...DISPLAY, fontSize: 92, lineHeight: 1 }}>Season plan</span>
        <Mark color={INK} h={64} />
        <span style={{ ...NUM, fontSize: 92, lineHeight: 1 }}>Spring 2027</span>
      </div>
    </Stage>
  );
};

const Results: Page = () => (
  <Stage tone="volt">
    <Kicker tag="Lab" tone="volt">
      Lab results
    </Kicker>
    <Title size={104}>The lab says faster.</Title>
    <div style={abs(120, 320)}>
      <div style={{ ...LABEL, fontSize: 18, fontWeight: 700 }}>Running economy</div>
      <div style={{ ...NUM, fontSize: 132, marginTop: 10 }}>+4.1%</div>
      <p style={{ ...BODY, fontSize: 22, color: INK_A(0.7), marginTop: 6 }}>
        Less oxygen at the same pace vs last season.
      </p>
    </div>
    <CutBar x={760} y={340} w={655} h={44} color="var(--osd-bg)" />
    <CutBar x={760} y={396} w={266} h={44} color={INK} />
    <CutBar x={760} y={452} w={380} h={44} color={INK_A(0.24)} />
  </Stage>
);
```

---
name: Pommi
description: Playful consumer-brand deck — cream paper, ink outlines, tomato accent, sticker-bright fills, chunky Gabarito and springy motion.
mode: light
---

# Pommi

## Palette

Cream paper and near-black ink do the structural work; tomato is the one accent. Butter, mint, periwinkle and pink are flat fills for cards, stickers, chips and chart marks — every filled shape gets a 4 px ink outline and a hard offset shadow.

| Role      | Value                   | Notes                                                                 |
| --------- | ----------------------- | --------------------------------------------------------------------- |
| bg        | `#FFF3DF`               | cream canvas (`design.palette.bg` → `CREAM`)                          |
| text      | `#151313`               | ink: copy, outlines, shadows, pill fills (`design.palette.text` → `INK`) |
| accent    | `#FF5A2C`               | tomato: hero stat block, lead sticker, "you" marks (`design.palette.accent` → `TOMATO`) |
| butter    | `#FFD23F`               | default eyebrow fill, highlight sticker, sparkles                     |
| mint      | `#7EDDB0`               | positive / "done" fills, secondary sticker                            |
| peri      | `#98A6FF`               | cool fill, cover slab, third series                                   |
| pink      | `#FFB0D0`               | fourth series, small sparkles                                         |
| paper     | `#FFFCF6`               | card surface on top of cream                                          |
| white     | `#FFFFFF`               | chat-bubble style surfaces only                                       |
| muted     | `rgba(21, 19, 19, 0.6)` | captions, mono labels, footnotes (≈ `#736D65` on cream)               |
| faint     | `rgba(21, 19, 19, 0.16)`| dashed dividers, grid lines, "inactive" outlines (≈ `#DACFBE` on cream) |
| heat ramp | `rgba(255, 90, 44, a)`  | tomato at 0.1–1 alpha for heatmap tiles                               |

Text on any fill (tomato, butter, mint, peri, pink) is always ink — never white.

## Typography

- Display font: `"Gabarito", system-ui, sans-serif` — weight 900 for titles and numbers, 800 for taglines and card labels.
- Body font: `"Gabarito", system-ui, sans-serif` — weight 500 for copy, 700–800 for inline emphasis.
- Label font: `"DM Mono", ui-monospace, monospace` — weight 500, 17 px, uppercase, `letter-spacing: 0.06em`. Used for eyebrows, captions, axis labels, the footer and page counter.
- Webfont import: `https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=Gabarito:wght@500;700;800;900&display=swap` — inject once at module top level (snippet in **Motion**), per `references/webfonts.md` in `slide-authoring`.
- Type scale (overrides `slide-authoring` where noted):
  - Wordmark / hero word: 250–300 px, weight 900, `letter-spacing: -0.055em`, line-height 1 (`typeScale.hero = 300`; above the 140–200 default).
  - Hero number: 180–280 px, weight 900, `letter-spacing: -0.05em`, line-height 0.86, tabular figures.
  - Cover / closer tagline: 64–72 px, weight 800, line-height 1.06–1.08, `letter-spacing: -0.03em`.
  - Page title: 88 px (80–96), weight 900, line-height 1, `letter-spacing: -0.035em`.
  - Card title: 46–64 px display weight 900.
  - Stat number: 44–76 px display weight 900, `letter-spacing: -0.04em`.
  - Body: 30 px, weight 500, line-height 1.32 (`typeScale.body = 30`; tighter than the 1.5 default — the type is chunky and copy is short). 28 px inside cards.
  - Inline UI label: 20–30 px, weight 700–800.
  - Mono label: 16–18 px. Footnote: 18 px, weight 500, line-height 1.4, muted.
- Gotcha: Gabarito's heavy `€` has almost no right bearing; under negative tracking wrap it as `<span style={{ marginRight: '0.06em' }}>€</span>`.

## Layout

- Canvas 1920 × 1080, `overflow: hidden`. Everything is absolutely placed with the `abs(left, top)` helper — this is a poster layout, not a flow layout.
- Side margins: 120 px → content width 1680 px.
- Vertical rhythm on content pages: Eyebrow at `y = 96` (46 px tall), Title at `y = 168`, content band roughly `y = 330 → 900`, Footnote at `y ≈ 898–956`, Footer row at `y = 996` (44 px tall).
- Split pages: left column `x = 120`, 1000 px wide; right column starts at 1160–1240 and runs to 1800. A big coloured **slab** (620–640 px wide, 48 px radius, 4 px ink border) often fills the right column and may bleed off the bottom edge.
- Cover and closer drop the footer and carry a muted mono line at `y = 984` instead.
- Strokes: 4 px ink for cards, slabs and stickers; 3 px for pills, chips and small tiles; 2.5 px for tiny badges.
- Shadows are hard offsets with no blur — `shadow(n)` = `n px n px 0 ink`: 4 on pills, 5–6 on stickers and small tiles, 8 on cards, 10 on large cards, 12 on slabs and hero objects.
- Radii: 999 for pills, 20–28 for cards (`design.radius = 28`), 34 for large tilted cards, 48 for slabs.
- Tilt: stickers ±4–10°, cards ±1–9°. Content tables and charts stay straight.
- Dividers: `3px dashed faint` inside cards; `2px dashed faint` for chart grid lines; a 4 px ink baseline under bar charts.

## Fixed components

These are paste-ready. Copy the tokens and helpers first, then the components, then the Motion helpers and style injection.

### Tokens & layout helpers

`CREAM` / `INK` / `TOMATO` read from the per-slide `design` so the Design panel can tweak them.

```tsx
import {
  type DesignSystem,
  type Page,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#FFF3DF', text: '#151313', accent: '#FF5A2C' },
  fonts: {
    display: '"Gabarito", system-ui, sans-serif',
    body: '"Gabarito", system-ui, sans-serif',
  },
  typeScale: { hero: 300, body: 30 },
  radius: 28,
};

const CREAM = 'var(--osd-bg)';
const INK = 'var(--osd-text)';
const TOMATO = 'var(--osd-accent)';
const BUTTER = '#FFD23F';
const MINT = '#7EDDB0';
const PERI = '#98A6FF';
const PINK = '#FFB0D0';
const PAPER = '#FFFCF6';
const MUTED = 'rgba(21, 19, 19, 0.6)';
const FAINT = 'rgba(21, 19, 19, 0.16)';

const BORDER = `4px solid ${INK}`;
const shadow = (n = 8) => `${n}px ${n}px 0 ${INK}`;

const DISPLAY: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontWeight: 900,
  letterSpacing: '-0.035em',
  lineHeight: 1,
  margin: 0,
};

const MONO: CSSProperties = {
  fontFamily: '"DM Mono", ui-monospace, monospace',
  fontWeight: 500,
  fontSize: 17,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const BODY: CSSProperties = {
  fontFamily: 'var(--osd-font-body)',
  fontWeight: 500,
  fontSize: 'var(--osd-size-body)',
  lineHeight: 1.32,
  margin: 0,
  textWrap: 'pretty',
};

const NUM: CSSProperties = { ...DISPLAY, fontVariantNumeric: 'tabular-nums' };

const abs = (left: number, top: number, extra?: CSSProperties): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  ...extra,
});

const pad = (n: number) => String(n).padStart(2, '0');
```

### Title

Absolutely placed at the standard title slot. Rises in when the page goes live.

```tsx
const Title = ({
  children,
  live,
  x = 120,
  y = 168,
  size = 88,
  width = 1680,
  delay = 70,
}: {
  children: ReactNode;
  live: boolean;
  x?: number;
  y?: number;
  size?: number;
  width?: number;
  delay?: number;
}) => (
  <h2 style={{ ...DISPLAY, ...abs(x, y), width, fontSize: size, ...rise(live, delay, 40) }}>
    {children}
  </h2>
);
```

### Footer

Pull the page number from `useSlidePageNumber()` — never hardcode `pageNum` / `total` props. Brand mark + wordmark on the left, mono label, a muted note pushed right, and an ink pill counter (`03 / 12`).

```tsx
const Footer = ({
  brand = 'pommi',
  label = 'Company update · 2026',
  note = 'Confidential',
}: {
  brand?: string;
  label?: string;
  note?: string;
}) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={abs(120, 996, {
        width: 1680,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        zIndex: 8,
      })}
    >
      <Mark size={34} />
      <span style={{ ...DISPLAY, fontSize: 30, letterSpacing: '-0.04em' }}>{brand}</span>
      <span style={{ ...MONO, color: MUTED, marginLeft: 18 }}>{label}</span>
      <span style={{ ...MONO, color: MUTED, marginLeft: 'auto', marginRight: 10 }}>{note}</span>
      <span
        style={{
          ...MONO,
          height: 38,
          padding: '0 16px',
          borderRadius: 999,
          background: INK,
          color: CREAM,
          display: 'inline-flex',
          alignItems: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pad(current)} / {pad(total)}
      </span>
    </div>
  );
};
```

### Eyebrow

A numbered section tag: ink cell with the section number, butter label, hard 4 px shadow. Pass `color={TOMATO}` for the climax section (e.g. the ask).

```tsx
const Eyebrow = ({
  n,
  children,
  live,
  x = 120,
  y = 96,
  color = BUTTER,
}: {
  n: string;
  children: ReactNode;
  live: boolean;
  x?: number;
  y?: number;
  color?: string;
}) => (
  <div
    style={abs(x, y, {
      display: 'flex',
      alignItems: 'stretch',
      height: 46,
      border: `3px solid ${INK}`,
      borderRadius: 999,
      background: color,
      boxShadow: shadow(4),
      overflow: 'hidden',
      ...rise(live, 0, 20),
    })}
  >
    <span
      style={{
        ...MONO,
        fontSize: 18,
        padding: '0 14px 0 16px',
        display: 'flex',
        alignItems: 'center',
        background: INK,
        color: CREAM,
      }}
    >
      {n}
    </span>
    <span
      style={{
        ...MONO,
        fontSize: 18,
        padding: '0 20px 0 16px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </span>
  </div>
);
```

### Stage

The page root. Every page wraps in it; pass `footer={false}` on cover and closer.

```tsx
const Stage = ({ footer = true, children }: { footer?: boolean; children: ReactNode }) => (
  <div
    className="pm-root"
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: CREAM,
      color: INK,
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    {children}
    {footer && <Footer />}
  </div>
);
```

### Mark

The tomato mascot: ink-outlined tomato with a mint leaf and a little door. Used at 34 px in the footer, 50 px on the cover, 400 px bobbing on the closer.

```tsx
const Mark = ({ size = 56 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    aria-hidden="true"
    style={{ display: 'block', overflow: 'visible' }}
  >
    <path
      d="M36.5 13.5 C 38.5 6, 46.5 2.5, 55 4.5 C 53 12, 45 16, 36.5 13.5 Z"
      style={{ fill: MINT, stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' }}
    />
    <path
      d="M32 19 C 32 13, 33 9, 36 6"
      style={{ fill: 'none', stroke: INK, strokeWidth: 4, strokeLinecap: 'round' }}
    />
    <path
      d="M32 19 C 23 13, 6 15, 6 34 C 6 50, 17 60, 25 60 C 28 60, 30 58.5, 32 58.5 C 34 58.5, 36 60, 39 60 C 47 60, 58 50, 58 34 C 58 15, 41 13, 32 19 Z"
      style={{ fill: TOMATO, stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' }}
    />
    <path
      d="M26.5 58.6 V 47 A 5.5 5.5 0 0 1 37.5 47 V 58.6"
      style={{ fill: CREAM, stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' }}
    />
    <path
      d="M15 30 C 15.5 25.5, 18.5 22.5, 22.5 21.5"
      style={{ fill: 'none', stroke: PAPER, strokeWidth: 3.5, strokeLinecap: 'round' }}
    />
  </svg>
);
```

### Sticker

The signature move: a tilted, outlined, hard-shadowed badge that slaps on and then wobbles gently forever. Pass `round={232}` for a circular sticker.

```tsx
const Sticker = ({
  x,
  y,
  r,
  live,
  delay,
  bg,
  children,
  round,
  pad: padding = '14px 26px',
  z = 6,
}: {
  x: number;
  y: number;
  r: number;
  live: boolean;
  delay: number;
  bg: string;
  children: ReactNode;
  round?: number;
  pad?: string;
  z?: number;
}) => (
  <div
    style={
      {
        ...abs(x, y),
        '--r': `${r}deg`,
        transform: `rotate(${r}deg)`,
        zIndex: z,
        ...anim(live, `pm-slap 760ms ${SLAP} ${delay}ms both`),
      } as CSSProperties
    }
  >
    <div
      style={{
        ...anim(live, `pm-wobble 5.2s ease-in-out ${delay + 900}ms infinite`),
        background: bg,
        border: BORDER,
        boxShadow: shadow(6),
        borderRadius: round ? '50%' : 22,
        width: round,
        height: round,
        padding: round ? 0 : padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  </div>
);
```

### Sparkle

A four-point ink-outlined star that pops in and twinkles. Scatter two or three around stickers and slabs, never more.

```tsx
const Sparkle = ({
  x,
  y,
  size,
  color = BUTTER,
  live,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  color?: string;
  live: boolean;
  delay: number;
}) => (
  <div
    style={{
      ...abs(x, y),
      width: size,
      height: size,
      ...anim(live, `pm-pop 700ms ${BOUNCY} ${delay}ms both`),
    }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      style={{
        display: 'block',
        overflow: 'visible',
        ...anim(live, `pm-twinkle 2.8s ease-in-out ${delay + 700}ms infinite`),
      }}
    >
      <path
        d="M20 2 C 22 14, 26 18, 38 20 C 26 22, 22 26, 20 38 C 18 26, 14 22, 2 20 C 14 18, 18 14, 20 2 Z"
        style={{ fill: color, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' }}
      />
    </svg>
  </div>
);
```

### Chip

Paper pill for facts under a tagline (counts, markets, contact details).

```tsx
const Chip = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      height: 52,
      padding: '0 22px',
      border: `3px solid ${INK}`,
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 24,
      fontWeight: 700,
      background: PAPER,
    }}
  >
    {children}
  </span>
);
```

### StatRow

A paper card with a coloured number block on the left — the workhorse for "three numbers" pages. Stack at 156 px pitch (`y = 420, 576, 732`).

```tsx
const StatRow = ({
  x = 120,
  y,
  n,
  color,
  live,
  delay,
  children,
}: {
  x?: number;
  y: number;
  n: string;
  color: string;
  live: boolean;
  delay: number;
  children: ReactNode;
}) => (
  <div
    style={abs(x, y, {
      width: 1000,
      height: 132,
      display: 'flex',
      border: BORDER,
      borderRadius: 28,
      background: PAPER,
      boxShadow: shadow(8),
      overflow: 'hidden',
      boxSizing: 'border-box',
      ...anim(live, `pm-in-l 900ms ${SNAPPY} ${delay}ms both`),
    })}
  >
    <div
      style={{
        width: 250,
        flex: 'none',
        background: color,
        borderRight: BORDER,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 30,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ ...NUM, fontSize: 76, letterSpacing: '-0.045em' }}>{n}</span>
    </div>
    <p style={{ ...BODY, padding: '0 36px', alignSelf: 'center' }}>{children}</p>
  </div>
);
```

### TiltCard

A large coloured card with an ink number badge and a display title, slapped on at an angle. Fan three of them for "how it works" or feature pages.

```tsx
const TiltCard = ({
  x,
  y,
  r,
  color,
  n,
  title,
  live,
  delay,
  width = 360,
  height = 420,
  children,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  n: string;
  title: string;
  live: boolean;
  delay: number;
  width?: number;
  height?: number;
  children: ReactNode;
}) => (
  <div
    style={
      {
        ...abs(x, y),
        '--r': `${r}deg`,
        transform: `rotate(${r}deg)`,
        width,
        height,
        boxSizing: 'border-box',
        padding: 28,
        background: color,
        border: BORDER,
        borderRadius: 34,
        boxShadow: shadow(10),
        display: 'flex',
        flexDirection: 'column',
        ...anim(live, `pm-slap 760ms ${SLAP} ${delay}ms both`),
      } as CSSProperties
    }
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span
        style={{
          ...MONO,
          fontSize: 18,
          width: 52,
          height: 52,
          flex: 'none',
          borderRadius: '50%',
          background: INK,
          color: CREAM,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n}
      </span>
      <span style={{ ...DISPLAY, fontSize: 64 }}>{title}</span>
    </div>
    <p style={{ ...BODY, fontSize: 28, marginTop: 24, lineHeight: 1.3 }}>{children}</p>
  </div>
);
```

### DropWord

Hero word where each letter falls in with a gravity bounce and squashes on landing. Use for one short word (no spaces) at 250–300 px.

```tsx
const DropWord = ({
  text,
  size,
  live,
  delay = 0,
}: {
  text: string;
  size: number;
  live: boolean;
  delay?: number;
}) => {
  const letters = Array.from(text, (ch, i) => ({ ch, id: `${i}-${ch}` }));
  return (
    <div
      style={{
        ...DISPLAY,
        fontSize: size,
        letterSpacing: '-0.055em',
        lineHeight: 1,
        display: 'flex',
        whiteSpace: 'nowrap',
      }}
    >
      {letters.map((l, i) => {
        const d = delay + i * 85;
        return (
          <span
            key={l.id}
            style={{
              display: 'inline-block',
              ...(live
                ? ({
                    animation: `pm-drop 940ms ${DROP} ${d}ms both`,
                    '--pm-from': '-1.6em',
                  } as CSSProperties)
                : {}),
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transformOrigin: '50% 88%',
                ...anim(live, `pm-squash 560ms ease-out ${d + Math.round(940 * DROP_LAND)}ms both`),
              }}
            >
              {l.ch}
            </span>
          </span>
        );
      })}
    </div>
  );
};
```

### Footnote

```tsx
const Footnote = ({
  x = 120,
  y,
  width = 1680,
  children,
}: {
  x?: number;
  y: number;
  width?: number;
  children: ReactNode;
}) => (
  <p style={{ ...BODY, ...abs(x, y), width, fontSize: 18, lineHeight: 1.4, color: MUTED }}>
    {children}
  </p>
);
```

## Motion

- Philosophy: **rich** — everything has weight: letters drop and squash, stickers slap on and wobble, cards spring in, hero numbers count up and land with a "thunk"; but animation only runs while the page is active (`useLive`), so thumbnails, overview and PDF render the final frame.
- Easing: physical curves generated into CSS `linear()` — `BOUNCY` (spring, ζ 0.38) for pops and bars, `SNAPPY` (spring, ζ 0.62) for rises and slide-ins, `DROP` (gravity with two bounces) for falling objects, `SLAP` cubic-bezier for stickers.
- Choreography: eyebrow at 0 ms, title ~70 ms, content staggered 120–150 ms apart, stickers and sparkles last (1.2–2.5 s). Count-ups ease out quartically over ~1.6 s; fire `pm-thunk` on the number as it lands.
- Page transition: 240 ms — the outgoing page holds, the incoming one fades up 8 px.
- `prefers-reduced-motion` disables all animation under `.pm-root`.

Easing generators and live / count-up helpers:

```tsx
const springAt = (t: number, zeta: number, omega: number) => {
  if (t >= 1) return 1;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const decay = Math.exp(-zeta * omega * t);
  return 1 - decay * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
};

// Gravity drop with two shrinking bounces; never passes the floor, unlike a spring.
const dropAt = (t: number) => {
  const e = 0.3;
  const segs = [1, 2 * e, 2 * e * e];
  const total = segs[0] + segs[1] + segs[2];
  let u = t * total;
  if (u <= 1) return u * u;
  u -= 1;
  for (let k = 1; k < segs.length; k++) {
    if (u <= segs[k]) {
      const x = u / segs[k];
      return 1 - e ** (2 * k) * 4 * x * (1 - x);
    }
    u -= segs[k];
  }
  return 1;
};
const DROP_LAND = 1 / (1 + 0.6 + 0.18);

const toLinear = (f: (t: number) => number, n: number) =>
  `linear(${Array.from({ length: n + 1 }, (_, i) => Number(f(i / n).toFixed(4))).join(', ')})`;

const BOUNCY = toLinear((t) => springAt(t, 0.38, 15), 64);
const SNAPPY = toLinear((t) => springAt(t, 0.62, 10.5), 48);
const DROP = toLinear(dropAt, 72);
const SLAP = 'cubic-bezier(0.2, 0.8, 0.3, 1)';

const anim = (live: boolean, value: string): CSSProperties => (live ? { animation: value } : {});

const rise = (live: boolean, delay = 0, dist = 32): CSSProperties =>
  live
    ? ({
        animation: `pm-rise 820ms ${SNAPPY} ${delay}ms both`,
        '--pm-rise': `${dist}px`,
      } as CSSProperties)
    : {};

const useLive = () => {
  const active = useIsActivePage();
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  return active && !reduced;
};

const useCount = (target: number, live: boolean, delay: number, dur = 1700) => {
  const [value, setValue] = useState(live ? 0 : target);
  useEffect(() => {
    if (!live) {
      setValue(target);
      return;
    }
    setValue(0);
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / dur));
      setValue(target * (1 - (1 - p) ** 4));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, target, delay, dur]);
  return value;
};
```

Webfont + keyframes, injected once at module top level (key the ids to your slide):

```tsx
const SLIDE_ID = 'your-slide-id';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=Gabarito:wght@500;700;800;900&display=swap';
const FONT_LINK_ID = `osd-webfont-${SLIDE_ID}`;
const STYLE_ID = `osd-styles-${SLIDE_ID}`;

const CSS = `
@keyframes pm-rise { from { opacity: 0; transform: translateY(var(--pm-rise, 32px)) } to { opacity: 1; transform: translateY(0) } }
@keyframes pm-in-l { from { opacity: 0; transform: translateX(-90px) } to { opacity: 1; transform: translateX(0) } }
@keyframes pm-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes pm-drop { from { transform: translateY(var(--pm-from, -320px)) } to { transform: translateY(0) } }
@keyframes pm-pop { from { opacity: 0; transform: scale(0) } to { opacity: 1; transform: scale(1) } }
@keyframes pm-pop-b { from { opacity: 0; transform: translateY(20px) scale(0.55) } to { opacity: 1; transform: translateY(0) scale(1) } }
@keyframes pm-squash { 0% { transform: scale(1, 1) } 26% { transform: scale(1.14, 0.82) } 56% { transform: scale(0.96, 1.05) } 100% { transform: scale(1, 1) } }
@keyframes pm-slap {
  0% { opacity: 0; transform: rotate(calc(var(--r) - 24deg)) scale(1.9) }
  42% { opacity: 1; transform: rotate(calc(var(--r) + 4deg)) scale(0.88, 0.84) }
  70% { opacity: 1; transform: rotate(calc(var(--r) - 1.5deg)) scale(1.04) }
  100% { opacity: 1; transform: rotate(var(--r)) scale(1) }
}
@keyframes pm-wobble { 0%, 100% { transform: rotate(0deg) } 50% { transform: rotate(2.6deg) } }
@keyframes pm-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
@keyframes pm-twinkle { 0%, 100% { transform: scale(1) rotate(0deg) } 50% { transform: scale(0.7) rotate(25deg) } }
@keyframes pm-thunk { 0% { transform: scale(1) } 24% { transform: scale(1.07) rotate(-1.4deg) } 58% { transform: scale(0.985) rotate(0.4deg) } 100% { transform: scale(1) } }

@media (prefers-reduced-motion: reduce) {
  .pm-root *, .pm-root *::before, .pm-root *::after { animation: none !important; transition: none !important; }
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
```

Optional page transition:

```tsx
import type { SlideTransition } from '@open-slide/core';

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
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};
```

## Aesthetic

A consumer app's pitch deck that feels like a sticker sheet: warm cream paper, thick ink outlines on every shape, flat candy fills (tomato, butter, mint, periwinkle, pink) and hard, blur-free offset shadows that make cards look die-cut and stacked. Type is huge, heavy and tightly tracked; uppercase DM Mono keeps the labels honest. Layouts are poster-like — big absolute-positioned blocks, a coloured slab on the right, a few tilted stickers and sparkles breaking the grid — and motion is springy and physical, as if everything was dropped onto the page. Avoid: gradients, soft or blurred shadows, glassmorphism, thin hairline borders, white text on fills, photography, dark mode, and more than one tomato hero per page. If it could be a die-cut sticker on a laptop lid, it is on theme.

## Example usage

```tsx
const Content: Page = () => {
  const live = useLive();
  const count = useCount(412, live, 600, 1600);
  return (
    <Stage>
      <Eyebrow n="01" live={live}>
        Highlights
      </Eyebrow>
      <Title live={live} size={96} width={1100}>
        This quarter,
        <br />
        in three numbers.
      </Title>
      <StatRow y={420} n="3.4×" color={TOMATO} live={live} delay={260}>
        more weekly active users than at the same point last year
      </StatRow>
      <StatRow y={576} n="61%" color={BUTTER} live={live} delay={380}>
        of new sign-ups arrived through a friend's invite link
      </StatRow>
      <StatRow y={732} n="4 s" color={PERI} live={live} delay={500}>
        median time to finish the core action, down from eleven
      </StatRow>
      <Footnote y={898} width={1000}>
        Illustrative figures for the theme preview. Swap in your own numbers and sources.
      </Footnote>

      <div
        style={abs(1220, 330, {
          width: 580,
          height: 520,
          boxSizing: 'border-box',
          padding: '40px 44px',
          background: PAPER,
          border: BORDER,
          borderRadius: 34,
          boxShadow: shadow(10),
          display: 'flex',
          flexDirection: 'column',
          ...rise(live, 160, 60),
        })}
      >
        <span style={{ ...MONO, color: MUTED }}>Monthly active homes</span>
        <span
          style={{
            ...NUM,
            fontSize: 200,
            lineHeight: 0.86,
            letterSpacing: '-0.05em',
            marginTop: 24,
            transformOrigin: '0% 80%',
            ...anim(live, 'pm-thunk 620ms ease-out 2200ms both'),
          }}
        >
          {Math.round(count)}k
        </span>
        <p style={{ ...BODY, fontWeight: 700, marginTop: 26 }}>
          households open the app at least once a month.
        </p>
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 22,
            borderTop: `3px dashed ${FAINT}`,
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
          }}
        >
          <span style={{ ...NUM, fontSize: 44, letterSpacing: '-0.03em' }}>+3.1×</span>
          <span style={{ ...MONO, fontSize: 16, color: MUTED }}>Year on year</span>
        </div>
      </div>
      <Sticker x={1600} y={286} r={6} live={live} delay={2300} bg={MINT} pad="10px 20px">
        <span style={{ fontSize: 24, fontWeight: 800 }}>64% organic</span>
      </Sticker>
      <Sparkle x={1180} y={296} size={40} live={live} delay={2450} />
    </Stage>
  );
};
```

# Shapes (`<Shape>`)

`<Shape>` from `@open-slide/core` draws a filled and/or stroked outline in a box. It is what the visual editor inserts from its Shape menu, so decks edited by hand and by the editor stay in the same vocabulary.

```tsx
import { Shape, type Page } from '@open-slide/core';

const Diagram: Page = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--osd-bg)' }}>
    <Shape kind="rect" fill="var(--osd-accent)" radius={24} style={{ position: 'absolute', left: 160, top: 320, width: 480, height: 280 }} />
    <Shape kind="line-arrow" stroke="var(--osd-text)" strokeWidth={6} style={{ position: 'absolute', left: 680, top: 448, width: 280, height: 24 }} />
    <Shape kind="ellipse" fill="none" stroke="var(--osd-accent)" strokeWidth={8} style={{ position: 'absolute', left: 1000, top: 300, width: 320, height: 320 }}>
      <span style={{ fontSize: 40 }}>Done</span>
    </Shape>
  </div>
);
```

## Props

| Prop | Meaning |
| --- | --- |
| `kind` | `rect`, `ellipse`, `triangle`, `right-triangle`, `diamond`, `pentagon`, `hexagon`, `star`, `arrow`, `chevron`, `callout`, `line`, `line-arrow` |
| `fill` | Any CSS color or `var(--osd-…)` token. Defaults to `currentColor`; lines default to no fill. |
| `stroke` / `strokeWidth` | Outline color and width in canvas px. The stroke is drawn inside the box. |
| `radius` | Corner radius for `rect`. |
| `style` | Position and size, exactly like any element. Use `position: 'absolute'` with numeric `left`/`top`/`width`/`height`. |
| `children` | Optional content centered on top, such as a label. |

## Rules

- Position shapes with numeric `left`/`top`/`width`/`height` on an absolutely positioned box. The visual editor moves such elements by rewriting those numbers, which keeps the source readable.
- Pass literal values (`fill="#ff5a1f"`, `strokeWidth={4}`), not expressions, when the user may edit the shape visually — the editor only rewrites literal props.
- Use tokens (`var(--osd-accent)`) so shapes follow the deck's design system.
- `line` and `line-arrow` are horizontal; rotate the box (`rotate: '30deg'`) for other angles.
- Reach for plain `<div>`s for layout containers and cards with text. `<Shape>` is for diagrams, callouts and decoration that need a non-rectangular outline or a stroke.

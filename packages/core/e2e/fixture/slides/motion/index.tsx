import type { Page, SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = {
  title: 'Motion Deck',
  createdAt: '2026-10-28T00:00:00.000Z',
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#101014',
  color: '#f2f2ef',
  padding: 120,
  fontFamily: 'system-ui, sans-serif',
} as const;

const One: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Motion page one</h1>
  </div>
);
One.transition = {
  duration: 320,
  enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

const Two: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Motion page two</h1>
  </div>
);
Two.transition = {
  duration: 400,
  enter: {
    keyframes: [
      { opacity: 0, transform: 'translateY(80px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const Three: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Motion page three</h1>
    <div data-osd-morph="hero" style={{ fontSize: 48 }}>
      Morphing object
    </div>
  </div>
);
Three.transition = { duration: 600, morph: true };

export default [One, Two, Three] satisfies Page[];

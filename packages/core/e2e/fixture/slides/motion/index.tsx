import { type Page, type SlideMeta, Step, Steps } from '@open-slide/core';

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
    <h1 data-os-anim="fade" data-os-anim-duration="450" style={{ fontSize: 96, margin: 0 }}>
      Motion page two
    </h1>
    <div
      data-os-anim="fly"
      data-os-anim-direction="bottom"
      data-os-anim-duration="600"
      style={{
        marginTop: 60,
        padding: 40,
        width: 720,
        background: '#1c1c22',
        border: '4px solid #f2f2ef',
        borderRadius: 24,
      }}
    >
      <h2 style={{ fontSize: 48, margin: 0 }}>Card title</h2>
      <p style={{ fontSize: 28 }}>Card body copy</p>
    </div>
    <div
      data-os-anim="zoom"
      data-os-anim-trigger="click"
      data-os-anim-duration="400"
      style={{ marginTop: 40, padding: 24, width: 360, background: '#2a2a33' }}
    >
      Click to zoom
    </div>
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

const Four: Page = () => (
  <div data-os-anim="fade" data-os-anim-duration="300" style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Motion page four</h1>
    <p style={{ fontSize: 32 }}>The full-slide background is animated, not promoted.</p>
  </div>
);
Four.transition = {
  duration: 200,
  enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

const Five: Page = () => (
  <div style={fill}>
    <Steps>
      <Step>
        <div data-os-anim="fly" data-os-anim-duration="300">
          Nested step
        </div>
      </Step>
    </Steps>
    <p style={{ fontSize: 32 }}>
      Block copy{' '}
      <span data-os-anim="zoom" style={{ background: '#333' }}>
        inline
      </span>
    </p>
  </div>
);
Five.transition = {
  duration: 200,
  enter: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

export default [One, Two, Three, Four, Five] satisfies Page[];

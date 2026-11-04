import { useEffect, useMemo, useRef } from 'react';
import type { IntroTarget } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { type SketchVariant, SlideSketch } from './slide-sketch';

const SWIFT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SOFT_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const DRIFT_IN = 'cubic-bezier(0.2, 0.55, 0.25, 1)';
const SETTLE = 'cubic-bezier(0.42, 0, 0.18, 1)';
// The negative control point pulls the window back a little before it commits.
const COLLAPSE = 'cubic-bezier(0.7, -0.1, 0.1, 1)';
// The veil stays translucent so the desktop shows through, dimming in steps as
// the story narrows down to the mark.
const VEIL = 'rgb(11 9 8 / 0.58)';
const VEIL_MID = 'rgb(11 9 8 / 0.68)';
const VEIL_DEEP = 'rgb(11 9 8 / 0.82)';
const WORDMARK = 'open-slide';
const WINDOW_RATIO = 1.7;
const WINDOW_RADIUS = 14;
const VISIBLE_SLOTS = 4;
const TILT = { angle: 30, zoom: 1.6, topWidth: 0.515, topY: 0.535 };
const RIG_REST_Z = -0.25;
const RIG_START_Z = -0.45;
const FLAT_ZOOM = 0.8;

const TILE_FILL = 'linear-gradient(180deg, #ffffff 0%, #efebe6 100%)';
const TILE_BEVEL = 'inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 -2px 0 rgb(0 0 0 / 0.06)';
const WINDOW_SHADOW = `${TILE_BEVEL}, 0 60px 120px -30px rgb(254 82 38 / 0), 0 40px 80px -24px rgb(0 0 0 / 0.65)`;
const TILE_SHADOW = `${TILE_BEVEL}, 0 40px 90px -24px rgb(254 82 38 / 0.55), 0 18px 40px -12px rgb(0 0 0 / 0.6)`;

const at = {
  glow: 200,
  cards: 350,
  gather: 3100,
  flatten: 5750,
  morph: 8950,
  word: 9750,
  exit: 12100,
};
const ENTER_MS = 1500;
const RISE_MS = 2000;
const FLIGHT_MS = 1700;
const FLATTEN_MS = 2600;
const MORPH_MS = 1350;
const SHEEN_MS = 1100;

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

// Six slides fill the rail one card per slot, ordered so that no two flight paths
// cross; the lowest two park past the window's edge, off screen. Depth stays positive so no card can pass behind the window's plane on its way.
const SCATTER: {
  x: number;
  y: number;
  width: number;
  rotate: number;
  variant: SketchVariant;
  slot: number;
  enter: number;
  land: number;
  depth: number;
  blur: number;
}[] = [
  {
    x: 0.197,
    y: 0.228,
    width: 0.216,
    rotate: -3,
    variant: 'cover',
    slot: 0,
    enter: 0,
    land: 700,
    depth: 0.19,
    blur: 0,
  },
  {
    x: 0.337,
    y: 0.535,
    width: 0.195,
    rotate: -12,
    variant: 'chart',
    slot: 3,
    enter: 2,
    land: 240,
    depth: 0.33,
    blur: 0,
  },
  {
    x: 0.174,
    y: 0.767,
    width: 0.24,
    rotate: 23,
    variant: 'quote',
    slot: 5,
    enter: 4,
    land: 0,
    depth: 0.48,
    blur: 2.5,
  },
  {
    x: 0.775,
    y: 0.275,
    width: 0.21,
    rotate: 20,
    variant: 'title',
    slot: 1,
    enter: 1,
    land: 560,
    depth: 0.15,
    blur: 0,
  },
  {
    x: 0.68,
    y: 0.507,
    width: 0.118,
    rotate: 13,
    variant: 'image',
    slot: 2,
    enter: 3,
    land: 360,
    depth: 0.025,
    blur: 1.6,
  },
  {
    x: 0.828,
    y: 0.72,
    width: 0.19,
    rotate: -12,
    variant: 'grid',
    slot: 4,
    enter: 5,
    land: 120,
    depth: 0.28,
    blur: 0,
  },
];

type Rect = { x: number; y: number; width: number; height: number };
type Stop = [ms: number, keyframe: Keyframe];

const rectStyle = ({ x, y, width, height }: Rect) => ({
  left: `${x}px`,
  top: `${y}px`,
  width: `${width}px`,
  height: `${height}px`,
});

// Every pose shares this function list, so transforms interpolate term by term
// rather than through matrix decomposition, which would bow the flight paths.
const place = (x: number, y: number, z: number, rotate: number, scale: number) =>
  `translate3d(${x}px, ${y}px, ${z}px) rotate(${rotate}deg) scale(${scale})`;

const aim = (y: number, z: number, pitch: number, yaw: number, zoom: number) =>
  `translate3d(0px, ${y}px, ${z}px) rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${zoom})`;

const halo = (opacity: number, scale: number): Keyframe => ({
  opacity,
  transform: `translate(-50%, -50%) scale(${scale})`,
});

function track(el: Element | null | undefined, stops: Stop[]) {
  const start = stops[0]?.[0] ?? 0;
  const span = (stops[stops.length - 1]?.[0] ?? start) - start;
  return el?.animate(
    stops.map(([ms, keyframe]) => ({ ...keyframe, offset: (ms - start) / span })),
    { delay: start, duration: span, fill: 'both' },
  );
}

function layoutStage(w: number, h: number) {
  const height = Math.min(w * 0.347, h * 0.58);
  const width = height * WINDOW_RATIO;
  const win: Rect = { x: (w - width) / 2, y: (h - height) / 2, width, height };

  const pad = width * 0.046;
  const thumbWidth = width * 0.16;
  const thumbHeight = (thumbWidth * 9) / 16;
  const pitch = (height - pad * 2 - thumbHeight) / (VISIBLE_SLOTS - 1);
  const slots: Rect[] = SCATTER.map((_, i) => ({
    x: win.x + pad,
    y: win.y + pad + i * pitch,
    width: thumbWidth,
    height: thumbHeight,
  }));
  const canvasLeft = pad + thumbWidth + width * 0.035;
  const canvas: Rect = {
    x: win.x + canvasLeft,
    y: win.y + pad,
    width: width - canvasLeft - pad,
    height: height - pad * 2,
  };

  const perspective = width * 0.84;
  const radians = (TILT.angle * Math.PI) / 180;
  const reach = (height / 2) * TILT.zoom;
  const topZ = perspective * (1 - 1 / TILT.topWidth);
  const tilt = {
    y: ((TILT.topY - 0.5) * h) / TILT.topWidth + reach * Math.cos(radians),
    z: topZ + reach * Math.sin(radians),
  };

  const cards = SCATTER.map((card) => {
    const z = card.depth * perspective;
    // Undo the projection at rest, so depth reads as parallax in motion without
    // pulling a card off its place in the composition.
    const fit = (perspective - z - RIG_REST_Z * perspective) / perspective;
    const cardWidth = card.width * Math.min(w, h * 1.6) * fit;
    const x = (card.x - 0.5) * w * fit;
    const y = (card.y - 0.5) * h * fit;
    const slot = slots[card.slot] as Rect;
    const side = x < 0 ? -1 : 1;
    return {
      ...card,
      cardWidth,
      from: place(x * 0.88, y * 0.88, z - perspective * 0.7, card.rotate * 1.6, 0.94),
      pose: place(x, y, z, card.rotate, 1),
      drift: place(
        x + side * w * 0.007,
        y - h * 0.006,
        z + perspective * 0.03,
        card.rotate + side * 1.4,
        1,
      ),
      slotX: slot.x + slot.width / 2 - w / 2,
      slotY: slot.y + slot.height / 2 - h / 2,
      slotScale: slot.width / cardWidth,
    };
  });

  return { win, canvas, cards, perspective, tilt };
}

export function Intro() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLSpanElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const stage = useMemo(() => layoutStage(window.innerWidth, window.innerHeight), []);

  useEffect(() => {
    const scene = sceneRef.current;
    const content = contentRef.current;
    if (!scene || !content) return;

    let cancelled = false;
    let exiting = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    let target: IntroTarget | null = null;

    const animate = (
      el: Element | null | undefined,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => el?.animate(keyframes, { fill: 'both', easing: SWIFT, ...options });

    const finish = () => {
      if (!cancelled) desktop.intro.done();
    };

    const exit = (fast: boolean) => {
      if (exiting || cancelled) return;
      exiting = true;
      for (const timer of timers) clearTimeout(timer);
      const fadeOut = animate(
        content,
        [{ opacity: 0, filter: 'blur(12px)', transform: 'scale(0.985)' }],
        { duration: fast ? 300 : 800, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
      );
      const dissolve = () => {
        if (cancelled) return;
        desktop.intro.reveal();
        later(170, () => {
          const fade = animate(scene, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 420,
            easing: 'ease-out',
            fill: 'forwards',
          });
          fade?.finished.then(finish, finish);
        });
      };
      fadeOut?.finished.then(() => {
        if (cancelled) return;
        if (!target) {
          dissolve();
          return;
        }
        const { innerWidth: w, innerHeight: h } = window;
        const { x, y, width, height, radius, dark } = target;
        const frame = frameRef.current;
        if (frame) {
          Object.assign(frame.style, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            borderRadius: `${radius}px`,
            color: dark ? '#fff' : '#000',
          });
          animate(frame, [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], {
            duration: fast ? 760 : 1300,
            easing: 'ease-out',
          });
        }
        const fold = animate(
          scene,
          [
            { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
            {
              clipPath: `inset(${y}px ${w - x - width}px ${h - y - height}px ${x}px round ${radius}px)`,
              backgroundColor: dark ? '#0d0d0d' : '#f4f3f2',
            },
          ],
          { duration: fast ? 760 : 1300, easing: IN_OUT, fill: 'forwards' },
        );
        fold?.finished.then(dissolve, dissolve);
      }, finish);
    };

    const run = () => {
      const { innerWidth: w, innerHeight: h } = window;
      const { win, canvas, cards, perspective, tilt } = stage;
      const iconBox = iconRef.current?.getBoundingClientRect();
      const tileSize = iconBox?.width ?? win.height * 0.3;
      const tile: Rect = {
        x: iconBox?.left ?? (w - tileSize) / 2,
        y: iconBox?.top ?? (h - tileSize) / 2,
        width: tileSize,
        height: tileSize,
      };
      const hero: Rect = {
        x: tile.x + tileSize * 0.2,
        y: tile.y + tileSize * 0.325,
        width: tileSize * 0.6,
        height: tileSize * 0.35,
      };
      const shrink = tileSize / win.width;
      const tileCenterX = tile.x + tileSize / 2 - w / 2;
      const tileCenterY = tile.y + tileSize / 2 - h / 2;
      const winCenterX = win.x + win.width / 2 - w / 2;
      const winCenterY = win.y + win.height / 2 - h / 2;
      const gatherEnd = at.gather + RISE_MS;
      const flattenEnd = at.flatten + FLATTEN_MS;
      const morphEnd = at.morph + MORPH_MS;
      const flattenSheen = at.flatten + 1700;

      animate(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: 'ease-out' });
      track(scene, [
        [at.gather, { backgroundColor: VEIL, easing: IN_OUT }],
        [gatherEnd, { backgroundColor: VEIL_MID, easing: 'linear' }],
        [at.morph, { backgroundColor: VEIL_MID, easing: IN_OUT }],
        [morphEnd + 300, { backgroundColor: VEIL_DEEP }],
      ]);
      // The light rises behind the tilted window like a sunrise, tightens as the
      // window collapses, then blooms once the mark lands.
      track(glowRef.current, [
        [at.glow, { ...halo(0, 0.25), easing: SOFT_OUT }],
        [at.gather, { ...halo(0.55, 0.85), easing: IN_OUT }],
        [gatherEnd + 150, { ...halo(1, 1.08), easing: IN_OUT }],
        [flattenEnd, { ...halo(0.7, 0.8), easing: 'linear' }],
        [at.morph + 150, { ...halo(0.7, 0.8), easing: IN_OUT }],
        [morphEnd - 350, { ...halo(0.5, 0.4), easing: SOFT_OUT }],
        [morphEnd + 500, { ...halo(1, 0.95), easing: 'linear' }],
        [at.exit, halo(0.85, 1.02)],
      ]);

      track(rigRef.current, [
        [
          0,
          {
            transform: aim(0, RIG_START_Z * perspective, 5, -7, 1),
            easing: DRIFT_IN,
          },
        ],
        [at.gather, { transform: aim(0, RIG_REST_Z * perspective, 0, 0, 1), easing: SETTLE }],
        [at.flatten, { transform: aim(tilt.y, tilt.z, TILT.angle, 0, TILT.zoom), easing: SETTLE }],
        [flattenEnd, { transform: aim(0, 0, 0, 0, FLAT_ZOOM), easing: 'linear' }],
        [at.morph, { transform: aim(0, 0, 0, 0, FLAT_ZOOM * 1.02), easing: COLLAPSE }],
        [morphEnd, { transform: aim(0, 0, 0, 0, 1) }],
      ]);

      track(chromeRef.current, [
        [at.gather, { transform: `translate3d(0px, ${h * 1.1}px, 0px)`, easing: SETTLE }],
        [gatherEnd, { transform: 'translate3d(0px, 0px, 0px)' }],
      ]);
      track(chromeRef.current, [
        [at.gather, { opacity: 0, easing: 'linear' }],
        [at.gather + 80, { opacity: 1 }],
      ]);
      track(chromeRef.current, [
        [
          at.morph,
          {
            ...rectStyle(win),
            borderRadius: `${WINDOW_RADIUS}px`,
            boxShadow: WINDOW_SHADOW,
            easing: COLLAPSE,
          },
        ],
        [
          morphEnd,
          { ...rectStyle(tile), borderRadius: `${tileSize * 0.233}px`, boxShadow: TILE_SHADOW },
        ],
      ]);

      const cardEls = cardsRef.current?.children ?? [];
      cards.forEach((card, i) => {
        const el = cardEls[i];
        const enter = at.cards + card.enter * 110;
        const lands = at.gather + card.land;
        const slotPose = place(card.slotX, card.slotY, 2, 0, card.slotScale);
        const collapse = place(
          tileCenterX + (card.slotX - winCenterX) * shrink,
          tileCenterY + (card.slotY - winCenterY) * shrink,
          2,
          0,
          card.slotScale * shrink,
        );
        track(el, [
          [enter, { transform: card.from, easing: SOFT_OUT }],
          [enter + ENTER_MS, { transform: card.pose, easing: 'linear' }],
          [lands, { transform: card.drift, easing: SETTLE }],
          [lands + FLIGHT_MS, { transform: slotPose, easing: 'linear' }],
          [at.morph, { transform: slotPose, easing: COLLAPSE }],
          [morphEnd, { transform: collapse }],
        ]);
        track(
          el,
          // Parked cards vanish once off screen, or flattening would lift them
          // back into view below the window.
          card.slot >= VISIBLE_SLOTS
            ? [
                [enter, { opacity: 0, easing: 'ease-out' }],
                [enter + 700, { opacity: 1, easing: 'linear' }],
                [lands + FLIGHT_MS * 0.85, { opacity: 1, easing: 'linear' }],
                [lands + FLIGHT_MS, { opacity: 0 }],
              ]
            : [
                [enter, { opacity: 0, easing: 'ease-out' }],
                [enter + 700, { opacity: 1, easing: 'linear' }],
                [at.morph + MORPH_MS * 0.2, { opacity: 1, easing: 'ease-out' }],
                [at.morph + MORPH_MS * 0.6, { opacity: 0 }],
              ],
        );
        // Rack focus: out-of-plane cards sit soft until they gather into the window.
        track(el, [
          [enter, { filter: 'blur(16px)', easing: SOFT_OUT }],
          [enter + ENTER_MS, { filter: `blur(${card.blur}px)`, easing: 'linear' }],
          [lands, { filter: `blur(${card.blur}px)`, easing: IN_OUT }],
          [lands + 800, { filter: 'blur(0px)' }],
        ]);
      });

      track(canvasRef.current, [
        [at.gather, { transform: `translate3d(0px, ${h * 1.1}px, 1px)`, easing: SETTLE }],
        [gatherEnd, { transform: 'translate3d(0px, 0px, 1px)' }],
      ]);
      track(canvasRef.current, [
        [at.gather, { opacity: 0, easing: 'linear' }],
        [at.gather + 80, { opacity: 1 }],
      ]);
      track(canvasRef.current, [
        [at.morph, { ...rectStyle(canvas), borderRadius: '10px', easing: COLLAPSE }],
        [
          morphEnd,
          {
            ...rectStyle(hero),
            borderRadius: `${hero.width * 0.118}px / ${hero.height * 0.202}px`,
          },
        ],
      ]);
      track(heroRef.current, [
        [at.morph, { opacity: 0, easing: 'ease-out' }],
        [at.morph + MORPH_MS * 0.55, { opacity: 1 }],
      ]);
      track(sheenRef.current, [
        [flattenSheen, { transform: 'translateX(-130%) skewX(-18deg)', easing: IN_OUT }],
        [
          flattenSheen + SHEEN_MS,
          { transform: 'translateX(230%) skewX(-18deg)', easing: 'linear' },
        ],
        [morphEnd - 1, { transform: 'translateX(230%) skewX(-18deg)', easing: 'linear' }],
        [morphEnd, { transform: 'translateX(-130%) skewX(-18deg)', easing: IN_OUT }],
        [morphEnd + SHEEN_MS, { transform: 'translateX(230%) skewX(-18deg)' }],
      ]);

      const letters = Array.from(wordRef.current?.children ?? []);
      const middle = (letters.length - 1) / 2;
      letters.forEach((letter, i) => {
        const offset = i - middle;
        animate(
          letter,
          [
            {
              opacity: 0,
              transform: `translate(${offset * 0.16}em, 0.12em)`,
              filter: 'blur(12px)',
            },
            { opacity: 1, transform: 'translate(0em, 0em)', filter: 'blur(0px)' },
          ],
          { delay: at.word + Math.abs(offset) * 60, duration: 1300, easing: SOFT_OUT },
        );
      });
      animate(hintRef.current, [{ opacity: 0 }, { opacity: 1 }], {
        delay: 1600,
        duration: 900,
        easing: 'ease-out',
      });

      // Keep a held frame from reading as stalled: everything breathes a touch.
      animate(content, [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }], {
        delay: morphEnd,
        duration: at.exit - morphEnd,
        easing: 'ease-in-out',
      });

      later(at.exit, () => exit(false));
    };

    const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]);
    void Promise.all([desktop.intro.target().catch(() => null), fonts]).then(([t]) => {
      if (cancelled) return;
      target = t as IntroTarget | null;
      run();
    });

    const skip = (e: Event) => {
      e.preventDefault();
      exit(true);
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
      for (const animation of scene.getAnimations({ subtree: true })) animation.cancel();
    };
  }, [stage]);

  return (
    <div
      ref={sceneRef}
      className="fixed inset-0 overflow-hidden text-white opacity-0"
      style={{ backgroundColor: VEIL }}
    >
      <div ref={contentRef} className="absolute inset-0">
        <div
          ref={glowRef}
          aria-hidden
          className="absolute top-1/2 left-1/2 aspect-square w-[130vmax] rounded-full opacity-0"
          style={{
            background:
              'radial-gradient(closest-side, rgb(255 160 110 / 0.34), rgb(254 82 38 / 0.26) 22%, rgb(238 67 22 / 0.1) 48%, transparent 72%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 50%, rgb(0 0 0 / 0.4) 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: GRAIN }}
        />

        <div className="absolute inset-0" style={{ perspective: `${stage.perspective}px` }}>
          <div ref={rigRef} className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
            <div
              ref={chromeRef}
              className="absolute overflow-hidden opacity-0"
              style={{
                ...rectStyle(stage.win),
                borderRadius: WINDOW_RADIUS,
                background: TILE_FILL,
                boxShadow: WINDOW_SHADOW,
              }}
            />

            <div
              ref={cardsRef}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {stage.cards.map((card) => (
                <div
                  key={card.variant}
                  className="absolute top-1/2 left-1/2 opacity-0"
                  style={{
                    width: card.cardWidth,
                    marginLeft: -card.cardWidth / 2,
                    marginTop: (-card.cardWidth * 9) / 32,
                    willChange: 'transform, opacity, filter',
                  }}
                >
                  <SlideSketch
                    variant={card.variant}
                    className="rounded-[14px]"
                    style={{
                      boxShadow:
                        'inset 0 0 0 1px rgb(24 22 20 / 0.07), 0 30px 60px -24px rgb(0 0 0 / 0.55)',
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              ref={canvasRef}
              className="absolute overflow-hidden opacity-0"
              style={{
                ...rectStyle(stage.canvas),
                boxShadow: '0 10px 24px -6px rgb(254 82 38 / 0.6)',
              }}
            >
              <SlideSketch variant="cover" className="h-full w-full" />
              <span
                ref={heroRef}
                aria-hidden
                className="absolute inset-0 opacity-0"
                style={{
                  background:
                    'radial-gradient(120% 90% at 30% 10%, rgb(255 255 255 / 0.28), transparent 60%), linear-gradient(180deg, #ff8a5e 0%, #fe5226 45%, #ee4316 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 -1.5px 0 rgb(184 48 12 / 0.45)',
                }}
              />
              <span
                ref={sheenRef}
                aria-hidden
                className="absolute inset-y-[-20%] left-0 w-[45%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgb(255 255 255 / 0.34) 50%, transparent)',
                  transform: 'translateX(-130%) skewX(-18deg)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div ref={iconRef} style={{ width: 'clamp(92px, 15vmin, 164px)', aspectRatio: '1' }} />
          <h1
            ref={wordRef}
            aria-label={WORDMARK}
            className="mt-[3.4vmin] flex font-heading font-semibold"
            style={{
              fontSize: 'clamp(34px, 5.8vmin, 72px)',
              letterSpacing: '-0.045em',
              lineHeight: 1,
            }}
          >
            {WORDMARK.split('').map((char, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: letters of a fixed word
                key={i}
                aria-hidden
                className="inline-block opacity-0"
                style={{ color: char === '-' ? '#ff8a5e' : undefined }}
              >
                {char}
              </span>
            ))}
          </h1>
        </div>

        <div
          ref={hintRef}
          className="absolute inset-x-0 bottom-[5vh] text-center text-[11px] font-medium tracking-[0.18em] text-white/35 uppercase opacity-0 mix-blend-difference"
        >
          Press any key to skip
        </div>
      </div>

      <div
        ref={frameRef}
        aria-hidden
        className="pointer-events-none absolute opacity-0"
        style={{ boxShadow: 'inset 0 0 0 1px color-mix(in oklab, currentColor 10%, transparent)' }}
      >
        <span
          className="absolute inset-x-0 top-10 h-px"
          style={{ background: 'color-mix(in oklab, currentColor 7%, transparent)' }}
        />
      </div>
    </div>
  );
}

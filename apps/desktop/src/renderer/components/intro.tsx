import { useEffect, useMemo, useRef } from 'react';
import type { IntroTarget } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { createIntroSound, type ScoreCues } from '../lib/intro-score';
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
const CARD_COUNT = 18;
const OUTER_RING = 11;
const PLAIN_SKETCHES: SketchVariant[] = ['title', 'chart', 'image', 'quote', 'grid'];
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
  flatten: 7300,
  morph: 9950,
  word: 10750,
  exit: 12900,
};
const ENTER_MS = 1500;
const ENTER_STAGGER = 45;
const RISE_MS = 2000;
const FLIGHT_MS = 1700;
const ROLL_MS = 2800;
const FLIGHT_SAMPLES = 24;
const FLATTEN_MS = 2200;
const MORPH_MS = 1350;
const SHEEN_MS = 1100;
const FLATTEN_SHEEN = at.flatten + 1450;
const FIRST_DOCK = at.gather + FLIGHT_MS;
// COLLAPSE covers most of its travel early, so the mark reads as landed before
// the morph formally ends. The bloom and the score's hit both start here.
const MARK_LANDS = at.morph + MORPH_MS - 350;

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

const rollEase = (progress: number) => (1 - Math.cos(Math.PI * progress)) / 2;
const rollProgress = (eased: number) => Math.acos(1 - 2 * eased) / Math.PI;
const ROLL_EASING = `linear(${Array.from({ length: 49 }, (_, i) => rollEase(i / 48).toFixed(4)).join(', ')})`;

// Landings follow the inverse of the roll, so each card meets the top slot exactly
// as the rail has moved one pitch down to make room for it.
const landAt = (order: number) => FIRST_DOCK + ROLL_MS * rollProgress(order / (CARD_COUNT - 1));

// In units of the rail's pitch: how far the rail still has to roll down at `ms`.
const rollRemaining = (ms: number) => {
  const progress = Math.min(1, Math.max(0, (ms - FIRST_DOCK) / ROLL_MS));
  return (CARD_COUNT - 1) * (1 - rollEase(progress));
};

// Flights chase a moving slot, so they are sampled in JS and cannot use a CSS easing.
const settle = (progress: number) => {
  const smooth = progress * progress * (3 - 2 * progress);
  return smooth * (2 - smooth);
};

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

function random(seed: number) {
  let t = seed;
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296;
    return t / 4294967296;
  };
}

const SCORE_CUES: ScoreCues = {
  glow: at.glow,
  gather: at.gather,
  flatten: at.flatten,
  sheen: FLATTEN_SHEEN,
  morph: at.morph,
  lands: MARK_LANDS,
  exit: at.exit,
};

type Rect = { x: number; y: number; width: number; height: number };
type Stop = [ms: number, keyframe: Keyframe];
type Pose = {
  x: number;
  y: number;
  z: number;
  pitch: number;
  yaw: number;
  roll: number;
  scale: number;
};

const rectStyle = ({ x, y, width, height }: Rect) => ({
  left: `${x}px`,
  top: `${y}px`,
  width: `${width}px`,
  height: `${height}px`,
});

// Every pose shares this function list, so transforms interpolate term by term
// rather than through matrix decomposition, which would bow the flight paths.
const place = ({ x, y, z, pitch, yaw, roll, scale }: Pose) =>
  `translate3d(${x}px, ${y}px, ${z}px) rotateX(${pitch}deg) rotateY(${yaw}deg) rotate(${roll}deg) scale(${scale})`;

const aim = (y: number, z: number, pitch: number, yaw: number, roll: number, zoom: number) =>
  `translate3d(0px, ${y}px, ${z}px) rotateX(${pitch}deg) rotateY(${yaw}deg) rotate(${roll}deg) scale(${zoom})`;

// A card and its rail thumbnail swap on landing, so both derive their frame from
// their own width and match exactly once the card has scaled down to the slot.
const sketchFrame = (width: number): React.CSSProperties => {
  const unit = width / 220;
  return {
    borderRadius: width * 0.065,
    boxShadow: `inset 0 0 0 ${unit}px rgb(24 22 20 / 0.07), 0 ${30 * unit}px ${60 * unit}px ${-24 * unit}px rgb(0 0 0 / 0.55)`,
  };
};

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
  // The fifth thumbnail is cut in half by the window's edge, so the rail reads as scrollable.
  const pitch = (height - pad - thumbHeight / 2) / VISIBLE_SLOTS;
  const canvasLeft = pad + thumbWidth + width * 0.035;
  const canvas: Rect = {
    x: win.x + canvasLeft,
    y: win.y + pad,
    width: width - canvasLeft - pad,
    height: height - pad * 2,
  };

  const rail: Rect = { x: win.x, y: win.y, width: canvasLeft, height };

  const perspective = width * 0.84;
  const radians = (TILT.angle * Math.PI) / 180;
  const reach = (height / 2) * TILT.zoom;
  const topZ = perspective * (1 - 1 / TILT.topWidth);
  const tilt = {
    y: ((TILT.topY - 0.5) * h) / TILT.topWidth + reach * Math.cos(radians),
    z: topZ + reach * Math.sin(radians),
  };

  const dock = {
    x: win.x + pad + thumbWidth / 2 - w / 2,
    y: win.y + pad + thumbHeight / 2 - h / 2,
  };
  const rand = random(7);
  const baseWidth = Math.min(300, Math.max(150, w * 0.15));
  const entryOrders = Array.from({ length: CARD_COUNT }, (_, i) => i).sort(() => rand() - 0.5);
  const ring = Array.from({ length: CARD_COUNT }, (_, i) => {
    const outer = i < OUTER_RING;
    const ringIndex = outer ? i : i - OUTER_RING;
    const ringSize = outer ? OUTER_RING : CARD_COUNT - OUTER_RING;
    const angle = (ringIndex / ringSize) * Math.PI * 2 + (outer ? 0.2 : 0.62) + rand() * 0.18;
    const x = Math.cos(angle) * (outer ? 0.41 : 0.18) * w;
    const y = Math.sin(angle) * (outer ? 0.36 : 0.16) * h;
    return {
      angle,
      outer,
      x,
      y,
      // A card's turn dips its corners by up to 0.08 of the perspective. Staying above
      // that keeps them from slicing through the window's plane as they fly over it.
      depth: outer ? 0.2 + rand() * 0.28 : 0.1 + rand() * 0.08,
      twist: (rand() - 0.5) * 16,
      entryOrder: entryOrders[i] ?? i,
      reach: Math.hypot(x - dock.x, y - dock.y),
    };
  });
  // Cards leave nearest-first, a wave sweeping toward the rail's single entry point.
  const byReach = ring.map((card) => card.reach).sort((a, b) => a - b);

  const cards = ring.map((card) => {
    const z = card.depth * perspective;
    // Undo the projection at rest, so depth reads as parallax in motion without
    // pulling a card off its place in the composition.
    const fit = (perspective - z - RIG_REST_Z * perspective) / perspective;
    const cardWidth = baseWidth * (card.outer ? 1 : 0.7) * fit;
    const x = card.x * fit;
    const y = card.y * fit;
    const side = x < 0 ? -1 : 1;
    const pitchTurn = Math.sin(card.angle) * 14;
    const yawTurn = Math.cos(card.angle) * -22;
    const order = byReach.indexOf(card.reach);
    const slot = CARD_COUNT - 1 - order;
    const variant: SketchVariant =
      slot % 9 === 0 ? 'cover' : (PLAIN_SKETCHES[slot % PLAIN_SKETCHES.length] ?? 'title');
    const pose: Pose = { x, y, z, pitch: pitchTurn, yaw: yawTurn, roll: card.twist, scale: 1 };
    return {
      variant,
      slot,
      entryOrder: card.entryOrder,
      land: landAt(order),
      cardWidth,
      blur: card.outer ? (card.depth > 0.38 ? 2 : 0) : 1.4,
      from: {
        x: x * 0.12,
        y: y * 0.12,
        z: -1.87 * perspective,
        pitch: pitchTurn * 3,
        yaw: yawTurn * 3,
        roll: card.twist * 4,
        scale: 1,
      } satisfies Pose,
      pose,
      drift: {
        ...pose,
        x: x + side * w * 0.007,
        y: y - h * 0.006,
        z: z + perspective * 0.03,
        roll: card.twist + side * 1.4,
      } satisfies Pose,
      dockScale: thumbWidth / cardWidth,
    };
  });

  return { win, rail, canvas, cards, perspective, tilt, pad, pitch, thumbWidth, dock };
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
  const railRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
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
    const sound = createIntroSound(SCORE_CUES);

    const animate = (
      el: Element | null | undefined,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => el?.animate(keyframes, { fill: 'both', easing: SWIFT, ...options });

    let faded: Promise<void> | null = null;
    let skipped = false;
    const finish = () => {
      if (cancelled) return;
      desktop.intro.done(skipped);
      void faded?.then(() => {
        if (!cancelled) desktop.intro.close();
      });
    };

    const exit = (fast: boolean) => {
      if (exiting || cancelled) return;
      exiting = true;
      skipped = fast;
      for (const timer of timers) clearTimeout(timer);
      faded = sound.fadeOut(fast ? 3.5 : 9.5);
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
      const { win, rail, canvas, cards, perspective, tilt, pitch, dock } = stage;
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

      if (!exiting) sound.start();
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
        [MARK_LANDS, { ...halo(0.5, 0.4), easing: SOFT_OUT }],
        [morphEnd + 500, { ...halo(1, 0.95), easing: 'linear' }],
        [at.exit, halo(0.85, 1.02)],
      ]);

      track(rigRef.current, [
        [
          0,
          {
            transform: aim(0, RIG_START_Z * perspective, 6, -7, -5, 0.96),
            easing: DRIFT_IN,
          },
        ],
        [at.gather, { transform: aim(0, RIG_REST_Z * perspective, 0, 0, 0, 1), easing: SETTLE }],
        [
          at.flatten,
          { transform: aim(tilt.y, tilt.z, TILT.angle, 0, 0, TILT.zoom), easing: SETTLE },
        ],
        [flattenEnd, { transform: aim(0, 0, 0, 0, 0, FLAT_ZOOM), easing: 'linear' }],
        [at.morph, { transform: aim(0, 0, 0, 0, 0, FLAT_ZOOM * 1.02), easing: COLLAPSE }],
        [morphEnd, { transform: aim(0, 0, 0, 0, 0, 1) }],
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

      track(scrollerRef.current, [
        [
          FIRST_DOCK,
          {
            transform: `translateY(${-rollRemaining(FIRST_DOCK) * pitch}px)`,
            easing: ROLL_EASING,
          },
        ],
        [FIRST_DOCK + ROLL_MS, { transform: 'translateY(0px)' }],
      ]);
      const railCenterX = rail.x + rail.width / 2 - w / 2;
      const railCenterY = rail.y + rail.height / 2 - h / 2;
      const railTravelX = tileCenterX + (railCenterX - winCenterX) * shrink - railCenterX;
      const railTravelY = tileCenterY + (railCenterY - winCenterY) * shrink - railCenterY;
      track(railRef.current, [
        [at.morph, { transform: 'translate3d(0px, 0px, 1px) scale(1)', easing: COLLAPSE }],
        [
          morphEnd,
          { transform: `translate3d(${railTravelX}px, ${railTravelY}px, 1px) scale(${shrink})` },
        ],
      ]);
      track(railRef.current, [
        [at.morph + MORPH_MS * 0.2, { opacity: 1, easing: 'ease-out' }],
        [at.morph + MORPH_MS * 0.6, { opacity: 0 }],
      ]);

      const cardEls = cardsRef.current?.children ?? [];
      const thumbEls = scrollerRef.current?.children ?? [];
      cards.forEach((card, i) => {
        const el = cardEls[i];
        const enter = at.cards + card.entryOrder * ENTER_STAGGER;
        const depart = card.land - FLIGHT_MS;
        const flight = Array.from({ length: FLIGHT_SAMPLES }, (_, sample): Stop => {
          const progress = (sample + 1) / FLIGHT_SAMPLES;
          const ms = depart + FLIGHT_MS * progress;
          const eased = settle(progress);
          // Weighting by eased² keeps the card from overshooting far above the rail
          // early on, while still matching the rail's speed at the moment of contact.
          const chase = (rollRemaining(ms) - rollRemaining(card.land)) * pitch * eased * eased;
          return [
            ms,
            {
              transform: place({
                x: lerp(card.drift.x, dock.x, eased),
                y: lerp(card.drift.y, dock.y, eased) - chase,
                z: lerp(card.drift.z, 2, eased),
                pitch: lerp(card.drift.pitch, 0, eased),
                yaw: lerp(card.drift.yaw, 0, eased),
                roll: lerp(card.drift.roll, 0, eased),
                scale: lerp(1, card.dockScale, eased),
              }),
            },
          ];
        });
        track(el, [
          [enter, { transform: place(card.from), easing: SOFT_OUT }],
          [enter + ENTER_MS, { transform: place(card.pose), easing: 'linear' }],
          [depart, { transform: place(card.drift) }],
          ...flight,
        ]);
        track(el, [
          [enter, { opacity: 0, easing: 'ease-out' }],
          [enter + ENTER_MS * 0.35, { opacity: 1, easing: 'linear' }],
          [card.land - 1, { opacity: 1, easing: 'linear' }],
          [card.land, { opacity: 0 }],
        ]);
        track(thumbEls[i], [
          [card.land - 1, { opacity: 0, easing: 'linear' }],
          [card.land, { opacity: 1 }],
        ]);
        // Rack focus: out-of-plane cards sit soft until they gather into the window.
        track(el, [
          [enter, { filter: 'blur(12px)', easing: SOFT_OUT }],
          [enter + ENTER_MS, { filter: `blur(${card.blur}px)`, easing: 'linear' }],
          [depart, { filter: `blur(${card.blur}px)`, easing: IN_OUT }],
          [depart + 800, { filter: 'blur(0px)' }],
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
        [FLATTEN_SHEEN, { transform: 'translateX(-130%) skewX(-18deg)', easing: IN_OUT }],
        [
          FLATTEN_SHEEN + SHEEN_MS,
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
    void Promise.all([desktop.intro.target().catch(() => null), fonts, sound.ready]).then(([t]) => {
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
      sound.dispose();
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
              ref={railRef}
              className="absolute overflow-hidden"
              style={{
                ...rectStyle(stage.rail),
                borderRadius: `${WINDOW_RADIUS}px 0 0 ${WINDOW_RADIUS}px`,
                transform: 'translate3d(0px, 0px, 1px)',
              }}
            >
              <div
                ref={scrollerRef}
                className="absolute inset-0"
                style={{ willChange: 'transform' }}
              >
                {stage.cards.map((card) => (
                  <div
                    key={card.slot}
                    className="absolute opacity-0"
                    style={{
                      left: stage.pad,
                      top: stage.pad + card.slot * stage.pitch,
                      width: stage.thumbWidth,
                    }}
                  >
                    <SlideSketch variant={card.variant} style={sketchFrame(stage.thumbWidth)} />
                  </div>
                ))}
              </div>
            </div>

            <div
              ref={cardsRef}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {stage.cards.map((card) => (
                <div
                  key={card.slot}
                  className="absolute top-1/2 left-1/2 opacity-0"
                  style={{
                    width: card.cardWidth,
                    marginLeft: -card.cardWidth / 2,
                    marginTop: (-card.cardWidth * 9) / 32,
                    willChange: 'transform, opacity, filter',
                  }}
                >
                  <SlideSketch variant={card.variant} style={sketchFrame(card.cardWidth)} />
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

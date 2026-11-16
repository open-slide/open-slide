import { useEffect, useMemo, useRef } from 'react';
import type { IntroTarget } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { createIntroSound, type ScoreCues } from '../lib/intro-score';
import { type SketchVariant, SlideSketch } from './slide-sketch';

const SWIFT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SOFT_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const DRIFT_IN = 'cubic-bezier(0.2, 0.55, 0.25, 1)';
const FLOAT = 'cubic-bezier(0.37, 0, 0.63, 1)';
const SETTLE = 'cubic-bezier(0.42, 0, 0.18, 1)';
// The negative control point pulls the window back a little before it commits.
const COLLAPSE = 'cubic-bezier(0.7, -0.1, 0.1, 1)';
// The veil stays translucent so the desktop shows through. A second sheet over
// it deepens the dark in steps, to 0.68 and then 0.82, as the story narrows
// down to the mark; fading a sheet costs nothing, repainting the veil does.
const VEIL = 'rgb(11 9 8 / 0.58)';
const DIM = { mid: 0.24, deep: 0.57 };
const WORDMARK = 'open-slide';
const WINDOW_RATIO = 1.7;
const WINDOW_RADIUS = 14;
const VISIBLE_SLOTS = 4;
const STAGE_WIDTH = 1512;

type Seat = {
  variant: SketchVariant;
  x: number;
  y: number;
  width: number;
  depth: number;
  twist: number;
  blur: number;
  entry: number;
};

// Listed in landing order, nearest the rail first. Each is where a card rests
// on screen: x and width in units of the stage's span, y of its height. Focus
// sits on the middle depth, and the centre stays clear for the window.
const SEATS: Seat[] = [
  {
    variant: 'chart',
    x: -0.285,
    y: -0.24,
    width: 0.185,
    depth: 0.24,
    twist: -7,
    blur: 0,
    entry: 2,
  },
  {
    variant: 'quote',
    x: -0.03,
    y: -0.335,
    width: 0.122,
    depth: 0.1,
    twist: 5,
    blur: 1.4,
    entry: 0,
  },
  { variant: 'title', x: -0.37, y: 0.06, width: 0.16, depth: 0.28, twist: 4, blur: 0, entry: 4 },
  {
    variant: 'image',
    x: -0.165,
    y: 0.295,
    width: 0.235,
    depth: 0.46,
    twist: -5,
    blur: 2.2,
    entry: 6,
  },
  { variant: 'list', x: 0.3, y: -0.255, width: 0.23, depth: 0.42, twist: 6, blur: 2.2, entry: 5 },
  {
    variant: 'grid',
    x: 0.175,
    y: 0.305,
    width: 0.128,
    depth: 0.12,
    twist: -8,
    blur: 1.4,
    entry: 1,
  },
  { variant: 'cover', x: 0.37, y: 0.085, width: 0.178, depth: 0.22, twist: -4, blur: 0, entry: 3 },
];
const CARD_COUNT = SEATS.length;
const TILT = { angle: 30, zoom: 1.6, topWidth: 0.515, topY: 0.535 };
const RIG_REST_Z = -0.25;
const RIG_START_Z = -0.45;
const FLAT_ZOOM = 0.8;

const TILE_FILL = 'linear-gradient(180deg, #ffffff 0%, #efebe6 100%)';
const TILE_BEVEL = 'inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 -2px 0 rgb(0 0 0 / 0.06)';
// Shadows this soft are costly to repaint, and the window changes size on every
// frame of its collapse. Each lives on a layer of its own that only moves and fades.
const WINDOW_SHADOW = '0 40px 80px -24px rgb(0 0 0 / 0.65)';
const TILE_SHADOW = '0 40px 90px -24px rgb(254 82 38 / 0.55), 0 18px 40px -12px rgb(0 0 0 / 0.6)';

const at = {
  glow: 200,
  cards: 350,
  gather: 3100,
  flatten: 7300,
  morph: 9950,
  word: 10750,
  exit: 12900,
};
const ENTER_MS = 1700;
const ENTER_STAGGER = 110;
const FLIGHT_MS = 1700;
// The window is seated as the first card docks, and the last docks on the
// score's next hit, as the camera pulls back.
const RISE_MS = FLIGHT_MS;
const ROLL_MS = at.flatten - at.gather - FLIGHT_MS;
const FOCUS_MS = 800;
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

// A gradient this smooth survives being drawn small and stretched, which keeps a
// layer wider than the screen out of memory.
const GLOW_STRETCH = 4;

const halo = (opacity: number, scale: number): Keyframe => ({
  opacity,
  transform: `translate(-50%, -50%) scale(${scale * GLOW_STRETCH})`,
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

  const inset = width * 0.03;
  const top = width * 0.05;
  const margin = width * 0.036;
  const thumbWidth = width * 0.16;
  const thumbHeight = (thumbWidth * 9) / 16;
  // The fifth thumbnail is cut in half by the window's edge, so the rail reads as scrollable.
  const pitch = (height - top - thumbHeight / 2) / VISIBLE_SLOTS;
  const rail: Rect = { x: win.x, y: win.y, width: inset * 2 + thumbWidth, height };
  const canvas: Rect = {
    x: rail.x + rail.width + margin,
    y: win.y + margin,
    width: width - rail.width - margin * 2,
    height: height - margin * 2,
  };

  const perspective = width * 0.84;
  const radians = (TILT.angle * Math.PI) / 180;
  const reach = (height / 2) * TILT.zoom;
  const topZ = perspective * (1 - 1 / TILT.topWidth);
  const tilt = {
    y: ((TILT.topY - 0.5) * h) / TILT.topWidth + reach * Math.cos(radians),
    z: topZ + reach * Math.sin(radians),
  };

  const dock = {
    x: win.x + inset + thumbWidth / 2 - w / 2,
    y: win.y + top + thumbHeight / 2 - h / 2,
  };
  const span = Math.min(w, h * 1.6);

  const cards = SEATS.map((seat, order) => {
    // A card's turn dips its corners by up to 0.08 of the perspective. Seats sit
    // deeper than that, so no corner slices through the window's plane in flight.
    const z = seat.depth * perspective;
    // Undo the projection at rest, so depth reads as parallax in motion without
    // pulling a card off its place in the composition.
    const fit = (perspective - z - RIG_REST_Z * perspective) / perspective;
    const cardWidth = seat.width * span * fit;
    const x = seat.x * span * fit;
    const y = seat.y * h * fit;
    const side = x < 0 ? -1 : 1;
    const angle = Math.atan2(seat.y, seat.x);
    const pitchTurn = Math.sin(angle) * 12;
    const yawTurn = Math.cos(angle) * -20;
    const pose: Pose = { x, y, z, pitch: pitchTurn, yaw: yawTurn, roll: seat.twist, scale: 1 };
    return {
      variant: seat.variant,
      slot: CARD_COUNT - 1 - order,
      enter: at.cards + seat.entry * ENTER_STAGGER,
      land: landAt(order),
      cardWidth,
      blur: (seat.blur * fit * span) / STAGE_WIDTH,
      from: {
        x: x * 0.4,
        y: y * 0.4,
        z: z - 1.5 * perspective,
        pitch: pitchTurn * 2.5,
        yaw: yawTurn * 2.5,
        roll: seat.twist * 3,
        scale: 1,
      } satisfies Pose,
      pose,
      drift: {
        ...pose,
        x: x + side * span * 0.008,
        y: y - h * 0.007,
        z: z + perspective * 0.03,
        roll: seat.twist + side * 1.2,
      } satisfies Pose,
      dockScale: thumbWidth / cardWidth,
    };
  });

  return {
    win,
    rail,
    canvas,
    cards,
    perspective,
    tilt,
    inset,
    top,
    pitch,
    thumbWidth,
    thumbHeight,
    dock,
    light: width * 0.0115,
    ring: thumbWidth * 0.03,
  };
}

export function Intro() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const windowShadowRef = useRef<HTMLDivElement>(null);
  const tileShadowRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLSpanElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
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
        animate(dimRef.current, [{ opacity: 0 }], {
          duration: fast ? 760 : 1300,
          easing: IN_OUT,
          fill: 'forwards',
        });
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
      const lastDock = FIRST_DOCK + ROLL_MS;
      const below = h * 1.1;

      if (!exiting) sound.start();
      animate(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: 'ease-out' });
      track(dimRef.current, [
        [at.gather, { opacity: 0, easing: IN_OUT }],
        [gatherEnd, { opacity: DIM.mid, easing: 'linear' }],
        [at.morph, { opacity: DIM.mid, easing: IN_OUT }],
        [morphEnd + 300, { opacity: DIM.deep }],
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

      const rise: Stop[] = [
        [at.gather, { opacity: 0, easing: 'linear' }],
        [at.gather + 80, { opacity: 1 }],
      ];
      track(chromeRef.current, [
        [at.gather, { transform: `translate3d(0px, ${below}px, 0px)`, easing: SETTLE }],
        [gatherEnd, { transform: 'translate3d(0px, 0px, 0px)' }],
      ]);
      track(chromeRef.current, rise);
      track(chromeRef.current, [
        [at.morph, { ...rectStyle(win), borderRadius: `${WINDOW_RADIUS}px`, easing: COLLAPSE }],
        [morphEnd, { ...rectStyle(tile), borderRadius: `${tileSize * 0.233}px` }],
      ]);

      // Scaled to the same frame the window is laid out at, so the shadow stays
      // under it through the collapse, then hands over to the tile's own.
      track(windowShadowRef.current, [
        [
          at.gather,
          { transform: `translate3d(0px, ${below}px, -1px) scale(1, 1)`, easing: SETTLE },
        ],
        [gatherEnd, { transform: 'translate3d(0px, 0px, -1px) scale(1, 1)', easing: 'linear' }],
        [at.morph, { transform: 'translate3d(0px, 0px, -1px) scale(1, 1)', easing: COLLAPSE }],
        [
          morphEnd,
          {
            transform: `translate3d(${tileCenterX - winCenterX}px, ${tileCenterY - winCenterY}px, -1px) scale(${shrink}, ${tileSize / win.height})`,
          },
        ],
      ]);
      track(windowShadowRef.current, [
        ...rise,
        [at.morph + MORPH_MS * 0.3, { opacity: 1, easing: 'ease-out' }],
        [at.morph + MORPH_MS * 0.8, { opacity: 0 }],
      ]);
      const tileShadow = tileShadowRef.current;
      if (tileShadow) {
        Object.assign(tileShadow.style, rectStyle(tile), {
          borderRadius: `${tileSize * 0.233}px`,
        });
      }
      track(tileShadow, [
        [at.morph + MORPH_MS * 0.5, { opacity: 0, easing: 'ease-out' }],
        [morphEnd, { opacity: 1 }],
      ]);

      track(scrollerRef.current, [
        [
          FIRST_DOCK,
          {
            transform: `translateY(${-rollRemaining(FIRST_DOCK) * pitch}px)`,
            easing: ROLL_EASING,
          },
        ],
        [lastDock, { transform: 'translateY(0px)' }],
      ]);
      const railCenterX = rail.x + rail.width / 2 - w / 2;
      const railCenterY = rail.y + rail.height / 2 - h / 2;
      const railTravelX = tileCenterX + (railCenterX - winCenterX) * shrink - railCenterX;
      const railTravelY = tileCenterY + (railCenterY - winCenterY) * shrink - railCenterY;
      track(railRef.current, [
        [at.gather, { transform: `translate3d(0px, ${below}px, 1px) scale(1)`, easing: SETTLE }],
        [gatherEnd, { transform: 'translate3d(0px, 0px, 1px) scale(1)', easing: 'linear' }],
        [at.morph, { transform: 'translate3d(0px, 0px, 1px) scale(1)', easing: COLLAPSE }],
        [
          morphEnd,
          { transform: `translate3d(${railTravelX}px, ${railTravelY}px, 1px) scale(${shrink})` },
        ],
      ]);
      track(railRef.current, [
        ...rise,
        [at.morph + MORPH_MS * 0.2, { opacity: 1, easing: 'ease-out' }],
        [at.morph + MORPH_MS * 0.6, { opacity: 0 }],
      ]);
      // The rail shrinks evenly while the window does not, so its tint would come
      // away from the window's edges. It is gone before the collapse gets going.
      track(sidebarRef.current, [
        [at.morph, { opacity: 1, easing: 'ease-out' }],
        [at.morph + MORPH_MS * 0.25, { opacity: 0 }],
      ]);
      track(ringRef.current, [
        [lastDock, { opacity: 0, easing: 'ease-out' }],
        [lastDock + 450, { opacity: 1, easing: 'linear' }],
        [at.morph, { opacity: 1, easing: 'ease-out' }],
        [at.morph + MORPH_MS * 0.25, { opacity: 0 }],
      ]);

      const cardEls = cardsRef.current?.children ?? [];
      const thumbEls = scrollerRef.current?.children ?? [];
      cards.forEach((card, i) => {
        const el = cardEls[i];
        const sharp = el?.lastElementChild;
        const soft = card.blur > 0 ? el?.firstElementChild : null;
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
          [card.enter, { transform: place(card.from), easing: SOFT_OUT }],
          [card.enter + ENTER_MS, { transform: place(card.pose), easing: FLOAT }],
          [depart, { transform: place(card.drift) }],
          ...flight,
        ]);
        const appear: Stop[] = [
          [card.enter, { opacity: 0, easing: 'ease-out' }],
          [card.enter + ENTER_MS * 0.35, { opacity: 1, easing: 'linear' }],
        ];
        const land: Stop[] = [
          [card.land - 1, { opacity: 1, easing: 'linear' }],
          [card.land, { opacity: 0 }],
        ];
        if (soft) {
          // Rack focus: a card off the focal plane sits soft until it leaves for
          // the window. The blur is painted once into a second copy and the two
          // cross-fade, the sharp one first so the card never thins out between.
          track(soft, [
            ...appear,
            [depart + FOCUS_MS * 0.5, { opacity: 1, easing: 'ease-out' }],
            [depart + FOCUS_MS, { opacity: 0 }],
          ]);
          track(sharp, [
            [depart, { opacity: 0, easing: 'ease-out' }],
            [depart + FOCUS_MS * 0.6, { opacity: 1, easing: 'linear' }],
            ...land,
          ]);
        } else {
          track(sharp, [...appear, ...land]);
        }
        track(thumbEls[i], [
          [card.land - 1, { opacity: 0, easing: 'linear' }],
          [card.land, { opacity: 1 }],
        ]);
      });

      track(canvasRef.current, [
        [at.gather, { transform: `translate3d(0px, ${below}px, 1px)`, easing: SETTLE }],
        [gatherEnd, { transform: 'translate3d(0px, 0px, 1px)' }],
      ]);
      track(canvasRef.current, rise);
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
            { opacity: 0, transform: `translate(${offset * 0.16}em, 0.12em)` },
            { opacity: 1, transform: 'translate(0em, 0em)' },
          ],
          { delay: at.word + Math.abs(offset) * 60, duration: 1300, easing: SOFT_OUT },
        );
      });
      animate(wordRef.current, [{ filter: 'blur(12px)' }, { filter: 'blur(0px)' }], {
        delay: at.word,
        duration: 1300,
        easing: SOFT_OUT,
      });
      // The hint has done its job by the time the window comes up over it.
      track(hintRef.current, [
        [1600, { opacity: 0, easing: 'ease-out' }],
        [2500, { opacity: 1, easing: 'linear' }],
        [at.gather, { opacity: 1, easing: 'ease-out' }],
        [at.gather + 500, { opacity: 0 }],
      ]);

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
      if (cancelled || exiting) return;
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
      <div
        ref={dimRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ backgroundColor: 'rgb(11 9 8)' }}
      />
      <div ref={contentRef} className="absolute inset-0">
        <div
          ref={glowRef}
          aria-hidden
          className="absolute top-1/2 left-1/2 aspect-square rounded-full opacity-0"
          style={{
            width: `${130 / GLOW_STRETCH}vmax`,
            willChange: 'transform',
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
              ref={windowShadowRef}
              aria-hidden
              className="absolute opacity-0"
              style={{
                ...rectStyle(stage.win),
                borderRadius: WINDOW_RADIUS,
                boxShadow: WINDOW_SHADOW,
              }}
            />
            <div
              ref={tileShadowRef}
              aria-hidden
              className="absolute opacity-0"
              style={{ boxShadow: TILE_SHADOW, transform: 'translateZ(-1px)' }}
            />
            <div
              ref={chromeRef}
              className="absolute opacity-0"
              style={{
                ...rectStyle(stage.win),
                borderRadius: WINDOW_RADIUS,
                background: TILE_FILL,
                boxShadow: TILE_BEVEL,
              }}
            />

            <div
              ref={railRef}
              className="absolute overflow-hidden opacity-0"
              style={{
                ...rectStyle(stage.rail),
                borderRadius: `${WINDOW_RADIUS}px 0 0 ${WINDOW_RADIUS}px`,
                transform: 'translate3d(0px, 0px, 1px)',
              }}
            >
              <div
                ref={sidebarRef}
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: 'rgb(24 22 20 / 0.035)',
                  boxShadow: 'inset -1px 0 0 rgb(24 22 20 / 0.07)',
                }}
              >
                <div
                  className="absolute flex"
                  style={{
                    left: stage.inset * 0.62,
                    top: stage.inset * 0.62,
                    gap: stage.light * 0.62,
                  }}
                >
                  {['close', 'minimize', 'zoom'].map((light) => (
                    <span
                      key={light}
                      className="rounded-full"
                      style={{
                        width: stage.light,
                        height: stage.light,
                        background: 'rgb(24 22 20 / 0.12)',
                      }}
                    />
                  ))}
                </div>
              </div>
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
                      left: stage.inset,
                      top: stage.top + card.slot * stage.pitch,
                      width: stage.thumbWidth,
                    }}
                  >
                    <SlideSketch variant={card.variant} style={sketchFrame(stage.thumbWidth)} />
                  </div>
                ))}
              </div>
              <span
                ref={ringRef}
                aria-hidden
                className="absolute opacity-0"
                style={{
                  left: stage.inset - stage.ring,
                  top: stage.top - stage.ring,
                  width: stage.thumbWidth + stage.ring * 2,
                  height: stage.thumbHeight + stage.ring * 2,
                  borderRadius: stage.thumbWidth * 0.065 + stage.ring,
                  boxShadow: `inset 0 0 0 ${stage.ring * 0.45}px #fe5226`,
                }}
              />
            </div>

            <div
              ref={cardsRef}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {stage.cards.map((card) => (
                <div
                  key={card.slot}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: card.cardWidth,
                    marginLeft: -card.cardWidth / 2,
                    marginTop: (-card.cardWidth * 9) / 32,
                    willChange: 'transform',
                  }}
                >
                  {card.blur > 0 && (
                    <div className="absolute inset-0 opacity-0">
                      <SlideSketch
                        variant={card.variant}
                        style={{
                          ...sketchFrame(card.cardWidth),
                          filter: `blur(${card.blur}px)`,
                        }}
                      />
                    </div>
                  )}
                  <div className="relative opacity-0">
                    <SlideSketch variant={card.variant} style={sketchFrame(card.cardWidth)} />
                  </div>
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
          className="absolute inset-x-0 bottom-[5vh] text-center text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase opacity-0"
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

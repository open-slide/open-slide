import { useEffect, useMemo, useRef } from 'react';
import type { IntroTarget } from '../../shared/types';
import { desktop } from '../lib/desktop';
import { createIntroSound, type ScoreCues } from '../lib/intro-score';
import { MARK_HERO, MARK_TILE } from '../lib/mark';
import { type SketchVariant, SlideSketch } from './slide-sketch';

const SOFT_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const DRIFT_IN = 'cubic-bezier(0.2, 0.55, 0.25, 1)';
const FLOAT = 'cubic-bezier(0.37, 0, 0.63, 1)';
const SETTLE = 'cubic-bezier(0.42, 0, 0.18, 1)';
const COLLAPSE = 'cubic-bezier(0.7, -0.1, 0.1, 1)';
const VEIL = 'rgb(11 9 8 / 0.58)';
const DIM = { mid: 0.24, deep: 0.57 };
const WORDMARK = 'open-slide';
const WINDOW_RATIO = 1.7;
const WINDOW_RADIUS = 14;
const VISIBLE_SLOTS = 4;
const STAGE_WIDTH = 1512;

type Seat = [
  variant: SketchVariant,
  x: number,
  y: number,
  width: number,
  depth: number,
  twist: number,
  blur: number,
  entry: number,
];

const SEATS: Seat[] = [
  ['chart', -0.285, -0.24, 0.185, 0.24, -7, 0, 2],
  ['quote', -0.03, -0.335, 0.122, 0.1, 5, 1.4, 0],
  ['title', -0.37, 0.06, 0.16, 0.28, 4, 0, 4],
  ['image', -0.165, 0.295, 0.235, 0.46, -5, 2.2, 6],
  ['list', 0.3, -0.255, 0.23, 0.42, 6, 2.2, 5],
  ['grid', 0.175, 0.305, 0.128, 0.12, -8, 1.4, 1],
  ['cover', 0.37, 0.085, 0.178, 0.22, -4, 0, 3],
];
const CARD_COUNT = SEATS.length;
const TILT = { angle: 30, zoom: 1.6, topWidth: 0.515, topY: 0.535 };
const RIG_REST_Z = -0.25;
const RIG_START_Z = -0.45;
const FLAT_ZOOM = 0.8;

const TILE_BEVEL = 'inset 0 1px 0 rgb(255 255 255 / 0.9), inset 0 -2px 0 rgb(0 0 0 / 0.06)';
const WINDOW_SHADOW = '0 40px 80px -24px rgb(0 0 0 / 0.65)';
const TILE_SHADOW = '0 40px 90px -24px rgb(254 82 38 / 0.55), 0 18px 40px -12px rgb(0 0 0 / 0.6)';
const SHEEN_FROM = 'translateX(-130%) skewX(-18deg)';
const SHEEN_TO = 'translateX(230%) skewX(-18deg)';

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
const FOCUS_MS = 800;
const FLIGHT_SAMPLES = 24;
const FLATTEN_MS = 2200;
const MORPH_MS = 1350;
const SHEEN_MS = 1100;
const FLATTEN_SHEEN = at.flatten + 1450;
const FIRST_DOCK = at.gather + FLIGHT_MS;
const ROLL_MS = at.flatten - FIRST_DOCK;
const FLATTEN_END = at.flatten + FLATTEN_MS;
const MORPH_END = at.morph + MORPH_MS;
const MARK_LANDS = MORPH_END - 350;

const during = (fraction: number) => at.morph + MORPH_MS * fraction;

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>",
)}")`;

const rollEase = (progress: number) => (1 - Math.cos(Math.PI * progress)) / 2;
const rollProgress = (eased: number) => Math.acos(1 - 2 * eased) / Math.PI;
const ROLL_EASING = `linear(${Array.from({ length: 49 }, (_, i) => rollEase(i / 48).toFixed(4)).join(', ')})`;

const landAt = (order: number) => FIRST_DOCK + ROLL_MS * rollProgress(order / (CARD_COUNT - 1));

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

const LEVEL: Pose = { x: 0, y: 0, z: 0, pitch: 0, yaw: 0, roll: 0, scale: 1 };

const rectStyle = ({ x, y, width, height }: Rect) => ({
  left: `${x}px`,
  top: `${y}px`,
  width: `${width}px`,
  height: `${height}px`,
});

// One shared function list interpolates per term; matrix decomposition would bow the flights.
const place = ({ x, y, z, pitch, yaw, roll, scale }: Pose) =>
  `translate3d(${x}px, ${y}px, ${z}px) rotateX(${pitch}deg) rotateY(${yaw}deg) rotate(${roll}deg) scale(${scale})`;

const camera = (pose: Partial<Pose>) => place({ ...LEVEL, ...pose });

const mix = (from: Pose, to: Pose, amount: number) =>
  Object.fromEntries(
    Object.entries(from).map(([key, value]) => [key, lerp(value, to[key as keyof Pose], amount)]),
  ) as Pose;

const sketchFrame = (width: number): React.CSSProperties => {
  const unit = width / 220;
  return {
    borderRadius: width * 0.065,
    boxShadow: `inset 0 0 0 ${unit}px rgb(24 22 20 / 0.07), 0 ${30 * unit}px ${60 * unit}px ${-24 * unit}px rgb(0 0 0 / 0.55)`,
  };
};

// Drawn small and scaled up, which keeps a layer wider than the screen out of memory.
const GLOW_STRETCH = 4;

const halo = (opacity: number, scale: number): Keyframe => ({
  opacity,
  transform: `translate(-50%, -50%) scale(${scale * GLOW_STRETCH})`,
});

const fade = (start: number, end: number, to: 0 | 1, easing = 'ease-out'): Stop[] => [
  [start, { opacity: 1 - to, easing }],
  [end, { opacity: to }],
];

const collapse = (from: Keyframe, to: Keyframe): Stop[] => [
  [at.morph, { ...from, easing: COLLAPSE }],
  [MORPH_END, to],
];

const sheen = (ms: number): Stop[] => [
  [ms, { transform: SHEEN_FROM, easing: IN_OUT }],
  [ms + SHEEN_MS, { transform: SHEEN_TO }],
];

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

  const cards = SEATS.map(
    ([variant, seatX, seatY, seatWidth, depth, twist, blur, entry], order) => {
      const z = depth * perspective;
      const fit = (perspective - z - RIG_REST_Z * perspective) / perspective;
      const cardWidth = seatWidth * span * fit;
      const x = seatX * span * fit;
      const y = seatY * h * fit;
      const side = x < 0 ? -1 : 1;
      const angle = Math.atan2(seatY, seatX);
      const pose: Pose = {
        x,
        y,
        z,
        pitch: Math.sin(angle) * 12,
        yaw: Math.cos(angle) * -20,
        roll: twist,
        scale: 1,
      };
      return {
        variant,
        slot: CARD_COUNT - 1 - order,
        enter: at.cards + entry * ENTER_STAGGER,
        land: landAt(order),
        cardWidth,
        blur: (blur * fit * span) / STAGE_WIDTH,
        from: {
          ...pose,
          x: x * 0.4,
          y: y * 0.4,
          z: z - 1.5 * perspective,
          pitch: pose.pitch * 2.5,
          yaw: pose.yaw * 2.5,
          roll: twist * 3,
        },
        pose,
        drift: {
          ...pose,
          x: x + side * span * 0.008,
          y: y - h * 0.007,
          z: z + perspective * 0.03,
          roll: twist + side * 1.2,
        },
        docked: { ...LEVEL, x: dock.x, y: dock.y, z: 2, scale: thumbWidth / cardWidth },
      };
    },
  );

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
    let skipped = false;
    let target: IntroTarget | null = null;
    let faded: Promise<void> | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const sound = createIntroSound(SCORE_CUES);

    const animate = (
      el: Element | null | undefined,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => el?.animate(keyframes, { fill: 'both', ...options });

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
      const foldMs = fast ? 760 : 1300;

      const dissolve = () => {
        if (cancelled) return;
        desktop.intro.reveal();
        later(170, () => {
          animate(scene, [{ opacity: 1 }, { opacity: 0 }], {
            duration: 420,
            easing: 'ease-out',
            fill: 'forwards',
          })?.finished.then(finish, finish);
        });
      };

      const fold = () => {
        if (cancelled) return;
        if (!target) return dissolve();
        const { innerWidth: w, innerHeight: h } = window;
        const { x, y, width, height, radius, dark } = target;
        const frame = frameRef.current;
        if (frame) {
          Object.assign(frame.style, rectStyle(target), {
            borderRadius: `${radius}px`,
            color: dark ? '#fff' : '#000',
          });
        }
        animate(frame, [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], {
          duration: foldMs,
          easing: 'ease-out',
        });
        animate(dimRef.current, [{ opacity: 0 }], {
          duration: foldMs,
          easing: IN_OUT,
          fill: 'forwards',
        });
        animate(
          scene,
          [
            { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
            {
              clipPath: `inset(${y}px ${w - x - width}px ${h - y - height}px ${x}px round ${radius}px)`,
              backgroundColor: dark ? '#0d0d0d' : '#f4f3f2',
            },
          ],
          { duration: foldMs, easing: IN_OUT, fill: 'forwards' },
        )?.finished.then(dissolve, dissolve);
      };

      animate(content, [{ opacity: 0, filter: 'blur(12px)', transform: 'scale(0.985)' }], {
        duration: fast ? 300 : 800,
        easing: 'cubic-bezier(0.4, 0, 1, 1)',
        fill: 'forwards',
      })?.finished.then(fold, finish);
    };

    const run = () => {
      const { innerWidth: w, innerHeight: h } = window;
      const { win, rail, canvas, cards, perspective, tilt, pitch } = stage;
      const iconBox = iconRef.current?.getBoundingClientRect();
      const tileSize = iconBox?.width ?? win.height * 0.3;
      const tile: Rect = {
        x: iconBox?.left ?? (w - tileSize) / 2,
        y: iconBox?.top ?? (h - tileSize) / 2,
        width: tileSize,
        height: tileSize,
      };
      const tileRadius = `${tileSize * 0.233}px`;
      const hero: Rect = {
        x: tile.x + tileSize * 0.2,
        y: tile.y + tileSize * 0.325,
        width: tileSize * 0.6,
        height: tileSize * 0.35,
      };
      const shrink = tileSize / win.width;
      const center = (rect: Rect) => ({
        x: rect.x + rect.width / 2 - w / 2,
        y: rect.y + rect.height / 2 - h / 2,
      });
      const tileCenter = center(tile);
      const winCenter = center(win);
      const toTile = (rect: Rect, z: number) => {
        const from = center(rect);
        const x = tileCenter.x + (from.x - winCenter.x) * shrink - from.x;
        const y = tileCenter.y + (from.y - winCenter.y) * shrink - from.y;
        return `translate3d(${x}px, ${y}px, ${z}px)`;
      };
      const below = h * 1.1;
      const lift = (z: number, scale = '', collapseTo?: string): Stop[] => {
        const rest = { transform: `translate3d(0px, 0px, ${z}px)${scale}` };
        const stops: Stop[] = [
          [
            at.gather,
            { transform: `translate3d(0px, ${below}px, ${z}px)${scale}`, easing: SETTLE },
          ],
          [FIRST_DOCK, rest],
        ];
        return collapseTo ? [...stops, ...collapse(rest, { transform: collapseTo })] : stops;
      };
      const rise = fade(at.gather, at.gather + 80, 1, 'linear');

      if (!exiting) sound.start();
      animate(scene, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, easing: 'ease-out' });
      track(dimRef.current, [
        [at.gather, { opacity: 0, easing: IN_OUT }],
        [FIRST_DOCK, { opacity: DIM.mid }],
        [at.morph, { opacity: DIM.mid, easing: IN_OUT }],
        [MORPH_END + 300, { opacity: DIM.deep }],
      ]);
      track(glowRef.current, [
        [at.glow, { ...halo(0, 0.25), easing: SOFT_OUT }],
        [at.gather, { ...halo(0.55, 0.85), easing: IN_OUT }],
        [FIRST_DOCK + 150, { ...halo(1, 1.08), easing: IN_OUT }],
        [FLATTEN_END, halo(0.7, 0.8)],
        [at.morph + 150, { ...halo(0.7, 0.8), easing: IN_OUT }],
        [MARK_LANDS, { ...halo(0.5, 0.4), easing: SOFT_OUT }],
        [MORPH_END + 500, halo(1, 0.95)],
        [at.exit, halo(0.85, 1.02)],
      ]);

      track(rigRef.current, [
        [
          0,
          {
            transform: camera({
              z: RIG_START_Z * perspective,
              pitch: 6,
              yaw: -7,
              roll: -5,
              scale: 0.96,
            }),
            easing: DRIFT_IN,
          },
        ],
        [at.gather, { transform: camera({ z: RIG_REST_Z * perspective }), easing: SETTLE }],
        [
          at.flatten,
          {
            transform: camera({ y: tilt.y, z: tilt.z, pitch: TILT.angle, scale: TILT.zoom }),
            easing: SETTLE,
          },
        ],
        [FLATTEN_END, { transform: camera({ scale: FLAT_ZOOM }) }],
        [at.morph, { transform: camera({ scale: FLAT_ZOOM * 1.02 }), easing: COLLAPSE }],
        [MORPH_END, { transform: camera({}) }],
      ]);

      track(chromeRef.current, lift(0));
      track(chromeRef.current, rise);
      track(
        chromeRef.current,
        collapse(
          { ...rectStyle(win), borderRadius: `${WINDOW_RADIUS}px` },
          { ...rectStyle(tile), borderRadius: tileRadius },
        ),
      );

      track(
        windowShadowRef.current,
        lift(-1, ' scale(1, 1)', `${toTile(win, -1)} scale(${shrink}, ${tileSize / win.height})`),
      );
      track(windowShadowRef.current, [...rise, ...fade(during(0.3), during(0.8), 0)]);
      const tileShadow = tileShadowRef.current;
      if (tileShadow)
        Object.assign(tileShadow.style, rectStyle(tile), { borderRadius: tileRadius });
      track(tileShadow, fade(during(0.5), MORPH_END, 1));

      track(scrollerRef.current, [
        [
          FIRST_DOCK,
          { transform: `translateY(${-(CARD_COUNT - 1) * pitch}px)`, easing: ROLL_EASING },
        ],
        [at.flatten, { transform: 'translateY(0px)' }],
      ]);
      track(railRef.current, lift(1, ' scale(1)', `${toTile(rail, 1)} scale(${shrink})`));
      track(railRef.current, [...rise, ...fade(during(0.2), during(0.6), 0)]);
      track(sidebarRef.current, fade(at.morph, during(0.25), 0));
      track(ringRef.current, [
        ...fade(at.flatten, at.flatten + 450, 1),
        ...fade(at.morph, during(0.25), 0),
      ]);

      const cardEls = cardsRef.current?.children ?? [];
      const thumbEls = scrollerRef.current?.children ?? [];
      cards.forEach((card, i) => {
        const el = cardEls[i];
        const depart = card.land - FLIGHT_MS;
        const flight = Array.from({ length: FLIGHT_SAMPLES }, (_, sample): Stop => {
          const progress = (sample + 1) / FLIGHT_SAMPLES;
          const ms = depart + FLIGHT_MS * progress;
          const eased = settle(progress);
          const chase = (rollRemaining(ms) - rollRemaining(card.land)) * pitch * eased * eased;
          const pose = mix(card.drift, card.docked, eased);
          return [ms, { transform: place({ ...pose, y: pose.y - chase }) }];
        });
        track(el, [
          [card.enter, { transform: place(card.from), easing: SOFT_OUT }],
          [card.enter + ENTER_MS, { transform: place(card.pose), easing: FLOAT }],
          [depart, { transform: place(card.drift) }],
          ...flight,
        ]);
        const appear = fade(card.enter, card.enter + ENTER_MS * 0.35, 1);
        const land = fade(card.land - 1, card.land, 0, 'linear');
        const sharp = el?.lastElementChild;
        if (card.blur > 0) {
          track(el?.firstElementChild, [
            ...appear,
            ...fade(depart + FOCUS_MS * 0.5, depart + FOCUS_MS, 0),
          ]);
          track(sharp, [...fade(depart, depart + FOCUS_MS * 0.6, 1), ...land]);
        } else {
          track(sharp, [...appear, ...land]);
        }
        track(thumbEls[i], fade(card.land - 1, card.land, 1, 'linear'));
      });

      track(canvasRef.current, lift(1));
      track(canvasRef.current, rise);
      track(
        canvasRef.current,
        collapse(
          { ...rectStyle(canvas), borderRadius: '10px' },
          {
            ...rectStyle(hero),
            borderRadius: `${hero.width * 0.118}px / ${hero.height * 0.202}px`,
          },
        ),
      );
      track(heroRef.current, fade(at.morph, during(0.55), 1));
      track(sheenRef.current, [
        ...sheen(FLATTEN_SHEEN),
        [MORPH_END - 1, { transform: SHEEN_TO }],
        ...sheen(MORPH_END),
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
      track(hintRef.current, [...fade(1600, 2500, 1), ...fade(at.gather, at.gather + 500, 0)]);

      animate(content, [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }], {
        delay: MORPH_END,
        duration: at.exit - MORPH_END,
        easing: 'ease-in-out',
      });

      later(at.exit, () => exit(false));
    };

    const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]);
    void Promise.all([desktop.intro.target().catch(() => null), fonts, sound.ready]).then(([t]) => {
      if (cancelled || exiting) return;
      target = t;
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
                background: MARK_TILE,
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
                  background: MARK_HERO,
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
                  transform: SHEEN_FROM,
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

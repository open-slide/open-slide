import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#1a1c2c', text: '#f4f4f4', accent: '#ffcd75' },
  fonts: {
    display: '"Press Start 2P", "Courier New", monospace',
    body: '"VT323", "Courier New", monospace',
  },
  typeScale: { hero: 200, body: 46 },
  radius: 0,
};

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap';
const FONT_LINK_ID = 'osd-webfont-pixel-speedrun';
const STYLE_ID = 'osd-styles-pixel-speedrun';
const css = `
@keyframes px-strip { to { transform: translateX(-100%) } }
@keyframes px-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
@keyframes px-bob { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
@keyframes px-count { to { transform: translateY(-100%) } }
@keyframes px-playhead { to { transform: translateX(1520px) } }
@keyframes px-drift { to { transform: translateX(-96px) } }
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
  if (style.textContent !== css) style.textContent = css;
}

const C = {
  night: '#1a1c2c',
  plum: '#5d275d',
  red: '#b13e53',
  orange: '#ef7d57',
  yellow: '#ffcd75',
  lime: '#a7f070',
  green: '#38b764',
  teal: '#257179',
  navy: '#29366f',
  blue: '#3b5dc9',
  sky: '#41a6f6',
  cyan: '#73eff7',
  white: '#f4f4f4',
  mist: '#94b0c2',
  steel: '#566c86',
  slate: '#333c57',
};

const PALETTE: Record<string, string> = {
  H: C.yellow,
  R: C.red,
  S: C.orange,
  E: C.night,
  B: C.sky,
  N: C.blue,
  W: C.white,
  Y: C.yellow,
  O: C.orange,
  K: C.slate,
  G: C.green,
  L: C.lime,
  D: C.night,
  M: C.mist,
  P: C.plum,
  C: C.cyan,
};

const RUN_A = [
  '....HHHHH...',
  '...HHHHHHH..',
  'RRRRRRRRRR..',
  'R..HSSSESS..',
  '...HSSSSSS..',
  '....SSSSS...',
  '....BBBBB...',
  '...BBBBBBS..',
  '..SBBBBB....',
  '....NNNN....',
  '...NN..NN...',
  '..NN....NN..',
  '.NN......NN.',
  'WW.......WW.',
];
const RUN_B = [
  '....HHHHH...',
  '...HHHHHHH..',
  '.RRRRRRRRR..',
  'RR.HSSSESS..',
  '...HSSSSSS..',
  '....SSSSS...',
  '....BBBBB...',
  '....BBBBS...',
  '....SBBBB...',
  '....NNNN....',
  '.....NN.....',
  '.....NNN....',
  '.....NN.....',
  '.....WWW....',
];
const RUN_C = [
  '....HHHHH...',
  '...HHHHHHH..',
  'RRRRRRRRRR..',
  '.R.HSSSESS..',
  '...HSSSSSS..',
  '....SSSSS...',
  '....BBBBB...',
  '..SBBBBB....',
  '...BBBBBBS..',
  '....NNNN....',
  '....NNNNN...',
  '...NN...NN..',
  '..WW....NN..',
  '........WW..',
];
const JUMP = [
  '....HHHHH...',
  '...HHHHHHH..',
  'RRRRRRRRRR..',
  '...HSSSESS..',
  '...HSSSSSS.S',
  '....SSSSS.SS',
  '...BBBBBBBS.',
  '..SBBBBBB...',
  '.S..BBBB....',
  '....NNNNN...',
  '...NN..NNN..',
  '..WW....WW..',
  '............',
  '............',
];

const COIN_A = [
  '..YYYY..',
  '.YYWYYY.',
  'YYWYYYOY',
  'YYWYYYOY',
  'YYWYYYOY',
  'YYWYYYOY',
  '.YYYYOY.',
  '..YYYY..',
];
const COIN_B = [
  '...YY...',
  '..YWYY..',
  '..YWYO..',
  '..YWYO..',
  '..YWYO..',
  '..YWYO..',
  '..YYYO..',
  '...YY...',
];
const COIN_C = [
  '...YY...',
  '...YO...',
  '...YO...',
  '...YO...',
  '...YO...',
  '...YO...',
  '...YO...',
  '...YY...',
];

const HEART = ['.RR.RR.', 'RWRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
const HEART_EMPTY = ['.KK.KK.', 'K..K..K', 'K.....K', '.K...K.', '..K.K..', '...K...'];

const CLOCK = [
  '..DDDDD..',
  '.DWWWWWD.',
  'DWWWDWWWD',
  'DWWWDWWWD',
  'DWWWDDDWD',
  'DWWWWWWWD',
  'DWWWWWWWD',
  '.DWWWWWD.',
  '..DDDDD..',
];
const SCROLL = [
  'DDDDDDDD.',
  'DYYYYYYD.',
  '.DYDDDYD.',
  '.DYYYYYD.',
  '.DYDDDYD.',
  '.DYYYYYD.',
  '.DYDDYYD.',
  'DYYYYYYD.',
  'DDDDDDDD.',
];
const REC = [
  '.........',
  'DDDDDDD..',
  'DWWWWWD.D',
  'DWRRRWDDD',
  'DWRRRWDDD',
  'DWRRRWDDD',
  'DWWWWWD.D',
  'DDDDDDD..',
  '.........',
];
const SHIELD = [
  'DDDDDDDDD',
  'DGGGGGGGD',
  'DGWGGGGGD',
  'DGWGGGGGD',
  'DGGGGGGGD',
  '.DGGGGGD.',
  '.DGGGGGD.',
  '..DGGGD..',
  '...DGD...',
  '....D....',
];
const PAD = [
  '..DDDDDDD..',
  '.DWWWWWWWD.',
  'DWWDWWWRWWD',
  'DWDDDWRWRWD',
  'DWWDWWWRWWD',
  '.DWWWWWWWD.',
  '..DD...DD..',
];
const FLAG = ['WRRRRRR', 'WRRRRR.', 'WRRRR..', 'WRRR...', 'WRR....', 'W......'];

const Sprite = ({ rows, px }: { rows: string[]; px: number }) => {
  const h = rows.length;
  const w = rows[0].length;
  const rects: ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const ch = row[x];
      if (ch === '.') {
        x++;
        continue;
      }
      let x2 = x;
      while (x2 < w && row[x2] === ch) x2++;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={x2 - x + 0.02}
          height={1.02}
          fill={PALETTE[ch]}
        />,
      );
      x = x2;
    }
  });
  return (
    <svg
      width={w * px}
      height={h * px}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={{ display: 'block', flex: 'none' }}
    >
      {rects}
    </svg>
  );
};

const SpriteAnim = ({
  frames,
  px,
  duration,
}: {
  frames: string[][];
  px: number;
  duration: number;
}) => {
  const w = frames[0][0].length * px;
  const h = frames[0].length * px;
  return (
    <div style={{ width: w, height: h, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          width: w * frames.length,
          animation: `px-strip ${duration}s steps(${frames.length}) infinite`,
        }}
      >
        {frames.map((f, i) => (
          <Sprite key={i} rows={f} px={px} />
        ))}
      </div>
    </div>
  );
};

const Runner = ({ px = 6 }: { px?: number }) => (
  <SpriteAnim frames={[RUN_A, RUN_B, RUN_C, RUN_B]} px={px} duration={0.48} />
);
const Coin = ({ px = 6 }: { px?: number }) => (
  <SpriteAnim frames={[COIN_A, COIN_B, COIN_C, COIN_B]} px={px} duration={0.6} />
);

const pixelShadow = (border: string, s = 6) =>
  `0 -${s}px 0 0 ${border}, 0 ${s}px 0 0 ${border}, -${s}px 0 0 0 ${border}, ${s}px 0 0 0 ${border}, inset 0 ${s}px 0 0 rgba(255,255,255,0.10), inset 0 -${s}px 0 0 rgba(0,0,0,0.28)`;

const PixelBox = ({
  children,
  bg = C.navy,
  border = C.white,
  style,
}: {
  children: ReactNode;
  bg?: string;
  border?: string;
  style?: CSSProperties;
}) => <div style={{ background: bg, boxShadow: pixelShadow(border), ...style }}>{children}</div>;

const hash = (n: number) => {
  const s = Math.sin(n * 91.7) * 43758.5453;
  return s - Math.floor(s);
};

const STARS = Array.from({ length: 70 }, (_, i) => {
  const x = Math.floor(hash(i) * 1900);
  const y = Math.floor(hash(i + 300) * 820) + 110;
  const c = i % 7 === 0 ? C.yellow : i % 3 === 0 ? C.cyan : C.steel;
  return `${x}px ${y}px 0 0 ${c}`;
}).join(', ');

const HILLS_FAR =
  '0,140 0,90 60,90 60,70 120,70 120,50 180,50 180,40 240,40 240,60 300,60 300,80 380,80 380,56 440,56 440,30 500,30 500,46 560,46 560,70 640,70 640,90 720,90 720,64 780,64 780,44 840,44 840,24 900,24 900,40 960,40 960,62 1040,62 1040,82 1120,82 1120,58 1180,58 1180,36 1240,36 1240,52 1300,52 1300,74 1380,74 1380,90 1460,90 1460,62 1520,62 1520,42 1600,42 1600,60 1660,60 1660,80 1740,80 1740,58 1800,58 1800,72 1920,72 1920,140';
const HILLS_NEAR =
  '0,140 0,110 90,110 90,96 150,96 150,84 210,84 210,100 300,100 300,116 420,116 420,98 480,98 480,86 540,86 540,104 660,104 660,118 780,118 780,100 860,100 860,88 920,88 920,102 1020,102 1020,116 1140,116 1140,96 1200,96 1200,84 1270,84 1270,100 1380,100 1380,114 1500,114 1500,98 1580,98 1580,108 1700,108 1700,92 1780,92 1780,106 1920,106 1920,140';

const RUN_X = [120, 290, 460, 630, 800, 970, 1140, 1310, 1480, 1690];
const GROUND_Y = 990;

const HudItem = ({
  label,
  children,
  align = 'left',
}: {
  label: string;
  children: ReactNode;
  align?: 'left' | 'right';
}) => (
  <div style={{ textAlign: align }}>
    <div style={{ color: C.mist }}>{label}</div>
    <div
      style={{
        marginTop: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {children}
    </div>
  </div>
);

const Hud = ({
  world,
  time,
  coins,
  lives,
}: {
  world: string;
  time: string;
  coins: number;
  lives: number;
}) => (
  <div
    style={{
      position: 'absolute',
      left: 100,
      right: 100,
      top: 34,
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr',
      fontFamily: 'var(--osd-font-display)',
      fontSize: 22,
      color: C.white,
      letterSpacing: '0.04em',
    }}
  >
    <HudItem label="RUNNER 1">{String(coins * 100 + 4120).padStart(6, '0')}</HudItem>
    <HudItem label="LIVES">
      <Sprite rows={lives > 0 ? HEART : HEART_EMPTY} px={4} />
      <Sprite rows={lives > 1 ? HEART : HEART_EMPTY} px={4} />
      <Sprite rows={lives > 2 ? HEART : HEART_EMPTY} px={4} />
    </HudItem>
    <HudItem label="COINS">
      <Sprite rows={COIN_A} px={3} />×{String(coins).padStart(2, '0')}
    </HudItem>
    <HudItem label="WORLD">{world}</HudItem>
    <HudItem label="TIME" align="right">
      <span style={{ color: C.yellow }}>{time}</span>
    </HudItem>
  </div>
);

const Ground = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y, bottom: 0 }}>
    <div style={{ height: 12, background: C.lime }} />
    <div style={{ height: 6, background: C.green }} />
    <div
      style={{
        height: 36,
        background: `repeating-linear-gradient(90deg, ${C.red} 0 6px, transparent 6px 72px), ${C.orange}`,
        borderBottom: `6px solid ${C.red}`,
      }}
    />
    <div
      style={{
        height: 36,
        background: `repeating-linear-gradient(90deg, ${C.red} 0 6px, transparent 6px 72px), ${C.orange}`,
        backgroundPosition: '36px 0',
      }}
    />
  </div>
);

const Goal = () => (
  <div style={{ position: 'absolute', left: 1800, top: GROUND_Y - 160 }}>
    <div
      style={{ position: 'absolute', left: 0, top: 0, width: 12, height: 160, background: C.mist }}
    />
    <div
      style={{
        position: 'absolute',
        left: -6,
        top: -18,
        width: 24,
        height: 24,
        background: C.yellow,
      }}
    />
    <div style={{ position: 'absolute', left: 12, top: 12 }}>
      <Sprite rows={FLAG.map((r) => r.slice(1))} px={12} />
    </div>
  </div>
);

const Stage = ({
  step,
  world,
  time,
  coins,
  lives = 3,
  runner = true,
  children,
}: {
  step: number;
  world: string;
  time: string;
  coins: number;
  lives?: number;
  runner?: boolean;
  children: ReactNode;
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: `linear-gradient(180deg, ${C.night} 0%, ${C.night} 55%, #222647 100%)`,
      color: 'var(--osd-text)',
      fontFamily: 'var(--osd-font-body)',
    }}
  >
    <div style={{ position: 'absolute', left: 0, top: 0, width: 6, height: 6, boxShadow: STARS }} />
    <svg
      width={1920}
      height={140}
      viewBox="0 0 1920 140"
      style={{ position: 'absolute', left: 0, top: GROUND_Y - 140 }}
      shapeRendering="crispEdges"
    >
      <polygon points={HILLS_FAR} fill={C.navy} opacity={0.55} />
      <polygon points={HILLS_NEAR} fill={C.slate} />
    </svg>
    <Ground />
    <Goal />
    <Hud world={world} time={time} coins={coins} lives={lives} />
    {children}
    {runner ? (
      <MorphElement id="runner">
        <div
          style={{
            position: 'absolute',
            left: RUN_X[step],
            top: GROUND_Y - 112,
            width: 96,
            height: 112,
          }}
        >
          <Runner px={8} />
        </div>
      </MorphElement>
    ) : null}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'repeating-linear-gradient(180deg, transparent 0 3px, rgba(0,0,0,0.16) 3px 4px)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)',
      }}
    />
  </div>
);

const Title = ({
  children,
  color = C.yellow,
  size = 48,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
}) => (
  <h2
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontWeight: 400,
      fontSize: size,
      lineHeight: 1.25,
      margin: 0,
      color,
      textShadow: `5px 5px 0 ${C.plum}`,
      letterSpacing: '0.02em',
    }}
  >
    {children}
  </h2>
);

const Tag = ({ children, bg = C.red }: { children: ReactNode; bg?: string }) => (
  <span
    style={{
      display: 'inline-block',
      fontFamily: 'var(--osd-font-display)',
      fontSize: 22,
      background: bg,
      color: C.white,
      padding: '10px 14px 8px',
      boxShadow: pixelShadow(bg, 4),
    }}
  >
    {children}
  </span>
);

const Blink = ({ children, speed = 1 }: { children: ReactNode; speed?: number }) => (
  <span style={{ animation: `px-blink ${speed}s steps(1) infinite` }}>{children}</span>
);

const TitleScreen: Page = () => (
  <Stage step={0} world="—" time="00:00.00" coins={0}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center' }}>
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            lineHeight: 1,
            color: C.yellow,
            letterSpacing: '0.04em',
            textShadow: `8px 8px 0 ${C.orange}, 16px 16px 0 ${C.red}, 24px 24px 0 ${C.plum}`,
          }}
        >
          ANY%
        </div>
        <div
          style={{
            position: 'absolute',
            left: -140,
            top: 20,
            animation: 'px-bob 1.2s steps(2) infinite',
          }}
        >
          <Coin px={8} />
        </div>
        <div
          style={{
            position: 'absolute',
            right: -150,
            top: 90,
            animation: 'px-bob 1.2s steps(2) 0.6s infinite',
          }}
        >
          <Coin px={8} />
        </div>
      </div>
      <div
        style={{
          marginTop: 76,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 32,
          color: C.cyan,
          letterSpacing: '0.06em',
        }}
      >
        THE ART &amp; SCIENCE OF SPEEDRUNNING
      </div>
      <div
        style={{
          marginTop: 100,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 40,
          color: C.white,
        }}
      >
        <Blink>PRESS START</Blink>
      </div>
      <div
        style={{
          marginTop: 70,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
          color: C.steel,
        }}
      >
        © 2026 FRAME DATA CLUB · 1 PLAYER · 0 CONTINUES
      </div>
    </div>
  </Stage>
);

const RuleCard = ({
  icon,
  title,
  children,
}: {
  icon: string[];
  title: string;
  children: ReactNode;
}) => (
  <PixelBox
    bg={C.slate}
    border={C.mist}
    style={{ padding: '30px 30px 26px', display: 'flex', gap: 28, alignItems: 'flex-start' }}
  >
    <Sprite rows={icon} px={9} />
    <div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 24,
          color: C.yellow,
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 42, lineHeight: 1.05, marginTop: 12, color: C.white }}>
        {children}
      </div>
    </div>
  </PixelBox>
);

const WhatIs: Page = () => (
  <Stage step={1} world="1-1" time="00:42.17" coins={3}>
    <div style={{ position: 'absolute', left: 120, right: 120, top: 150 }}>
      <Tag>WORLD 1-1</Tag>
      <div style={{ marginTop: 26 }}>
        <Title>WHAT IS A SPEEDRUN?</Title>
      </div>
      <PixelBox style={{ marginTop: 44, padding: '34px 40px', position: 'relative' }}>
        <div style={{ fontSize: 56, lineHeight: 1.1, color: C.white, maxWidth: 1560 }}>
          Beat a game as fast as humanly possible — on a real clock, under a published ruleset, with
          video proof for every second.
        </div>
        <div
          style={{
            position: 'absolute',
            right: 30,
            bottom: 18,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 22,
            color: C.yellow,
          }}
        >
          <Blink speed={0.8}>▼</Blink>
        </div>
      </PixelBox>
      <div
        style={{ marginTop: 52, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 44 }}
      >
        <RuleCard icon={CLOCK} title="ONE CLOCK">
          Starts on the first input. Stops on the last hit.
        </RuleCard>
        <RuleCard icon={SCROLL} title="ONE RULESET">
          The category decides what counts as fair.
        </RuleCard>
        <RuleCard icon={REC} title="ONE TAKE">
          No cuts. No edits. Every run is on tape.
        </RuleCard>
      </div>
    </div>
  </Stage>
);

const CategoryCard = ({
  icon,
  name,
  desc,
  stars,
  selected,
}: {
  icon: ReactNode;
  name: string;
  desc: string;
  stars: number;
  selected?: boolean;
}) => (
  <div style={{ position: 'relative' }}>
    {selected ? (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: -66,
          transform: 'translateX(-50%)',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 34,
          color: C.yellow,
        }}
      >
        <span style={{ display: 'inline-block', animation: 'px-bob 0.6s steps(2) infinite' }}>
          ▼
        </span>
      </div>
    ) : null}
    <PixelBox
      bg={selected ? C.navy : C.slate}
      border={selected ? C.yellow : C.steel}
      style={{
        height: 470,
        padding: '34px 26px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 28,
          color: selected ? C.yellow : C.white,
          marginTop: 26,
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 40, lineHeight: 1.05, marginTop: 20, color: C.mist, flex: 1 }}>
        {desc}
      </div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
          color: C.orange,
          letterSpacing: '0.2em',
        }}
      >
        {'★'.repeat(stars)}
        <span style={{ color: C.steel }}>{'★'.repeat(5 - stars)}</span>
      </div>
    </PixelBox>
  </div>
);

const SelectCategory: Page = () => (
  <Stage step={2} world="1-2" time="01:58.03" coins={7}>
    <div style={{ position: 'absolute', left: 120, right: 120, top: 150 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Title>SELECT CATEGORY</Title>
        <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 22, color: C.mist }}>
          DIFFICULTY ★
        </div>
      </div>
      <div
        style={{ marginTop: 100, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 34 }}
      >
        <CategoryCard
          icon={<Sprite rows={RUN_A} px={8} />}
          name="ANY%"
          desc="Reach the credits. Anything goes."
          stars={3}
          selected
        />
        <CategoryCard
          icon={<Sprite rows={COIN_A} px={13} />}
          name="100%"
          desc="Collect every last item first."
          stars={5}
        />
        <CategoryCard
          icon={<Sprite rows={SHIELD} px={11} />}
          name="NO GLITCH"
          desc="Major exploits are banned."
          stars={4}
        />
        <CategoryCard
          icon={<Sprite rows={HEART} px={14} />}
          name="LOW%"
          desc="Win with as little as possible."
          stars={4}
        />
        <CategoryCard
          icon={<Sprite rows={PAD} px={10} />}
          name="TAS"
          desc="Tool-assisted. Frame-by-frame."
          stars={1}
        />
      </div>
      <div style={{ marginTop: 44, fontSize: 40, color: C.mist, textAlign: 'center' }}>
        <span style={{ color: C.cyan }}>TIP:</span> same game, different category — a completely
        different sport.
      </div>
    </div>
  </Stage>
);

const MapNode = ({
  x,
  y,
  n,
  state,
}: {
  x: number;
  y: number;
  n: string;
  state: 'done' | 'skip' | 'goal' | 'next';
}) => {
  const bg =
    state === 'done' ? C.green : state === 'skip' ? C.slate : state === 'goal' ? C.red : C.blue;
  const fg = state === 'skip' ? C.steel : C.white;
  return (
    <g>
      <rect x={x - 30} y={y - 30} width={60} height={60} fill={bg} />
      <rect x={x - 30} y={y - 30} width={60} height={6} fill="rgba(255,255,255,0.25)" />
      <rect x={x - 30} y={y + 24} width={60} height={6} fill="rgba(0,0,0,0.3)" />
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fontFamily="'Press Start 2P', monospace"
        fontSize={24}
        fill={fg}
      >
        {n}
      </text>
    </g>
  );
};

const SplitRow = ({
  n,
  name,
  time,
  delta,
  gold,
}: {
  n: string;
  name: string;
  time: string;
  delta: string;
  gold?: boolean;
}) => {
  const ahead = delta.startsWith('−');
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr 150px 110px',
        alignItems: 'baseline',
        padding: '10px 0',
        borderBottom: `3px solid ${C.slate}`,
      }}
    >
      <span style={{ color: C.steel }}>{n}</span>
      <span>{name}</span>
      <span style={{ textAlign: 'right', color: C.white }}>{time}</span>
      <span style={{ textAlign: 'right', color: gold ? C.yellow : ahead ? C.lime : C.red }}>
        {delta}
      </span>
    </div>
  );
};

const Routing: Page = () => (
  <Stage step={3} world="2-1" time="03:11.40" coins={12}>
    <div style={{ position: 'absolute', left: 120, right: 120, top: 150 }}>
      <Tag bg={C.teal}>WORLD 2</Tag>
      <div style={{ marginTop: 26 }}>
        <Title>ROUTING: PLAN EVERY STEP</Title>
      </div>
    </div>
    <PixelBox
      bg="#14233a"
      border={C.steel}
      style={{ position: 'absolute', left: 120, top: 330, width: 900, height: 500 }}
    >
      <svg width={900} height={500} viewBox="0 0 900 500" shapeRendering="crispEdges">
        <path
          d="M110 380 H270 V110 H690 V380 H830"
          fill="none"
          stroke={C.steel}
          strokeWidth={12}
          strokeDasharray="12 12"
        />
        <path d="M110 380 H690" fill="none" stroke={C.yellow} strokeWidth={12} />
        <path d="M690 380 H830" fill="none" stroke={C.yellow} strokeWidth={12} />
        <MapNode x={110} y={380} n="1" state="done" />
        <MapNode x={270} y={380} n="2" state="done" />
        <MapNode x={270} y={245} n="3" state="skip" />
        <MapNode x={270} y={110} n="4" state="skip" />
        <MapNode x={480} y={110} n="5" state="skip" />
        <MapNode x={690} y={110} n="6" state="skip" />
        <MapNode x={690} y={380} n="7" state="next" />
        <MapNode x={830} y={380} n="8" state="goal" />
        <rect x={395} y={354} width={170} height={52} fill={C.night} />
        <text
          x={480}
          y={390}
          textAnchor="middle"
          fontFamily="'Press Start 2P', monospace"
          fontSize={20}
          fill={C.yellow}
        >
          WARP
        </text>
        <text
          x={480}
          y={462}
          textAnchor="middle"
          fontFamily="'Press Start 2P', monospace"
          fontSize={20}
          fill={C.mist}
        >
          SKIPS WORLDS 3-6 · -11:42
        </text>
      </svg>
    </PixelBox>
    <PixelBox
      bg={C.night}
      border={C.mist}
      style={{
        position: 'absolute',
        left: 1090,
        top: 330,
        width: 710,
        height: 500,
        padding: '24px 34px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
          color: C.cyan,
          marginBottom: 10,
        }}
      >
        SPLITS · PB PACE
      </div>
      <div style={{ fontSize: 42, lineHeight: 1 }}>
        <SplitRow n="1" name="Tutorial" time="0:48.2" delta="−0.4" />
        <SplitRow n="2" name="Forest" time="2:31.9" delta="−1.2" />
        <SplitRow n="↯" name="Warp skip" time="2:44.0" delta="+0.3" />
        <SplitRow n="7" name="Castle" time="5:12.6" delta="−2.1" gold />
        <SplitRow n="8" name="Final boss" time="7:58.3" delta="−0.8" />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 20,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
        }}
      >
        <span style={{ color: C.mist }}>SUM OF BEST</span>
        <span style={{ color: C.yellow }}>7:41.9</span>
      </div>
    </PixelBox>
  </Stage>
);

const T = 40;

const Brick = ({ c, r, broken }: { c: number; r: number; broken?: boolean }) =>
  broken ? (
    <rect
      x={c * T + 3}
      y={r * T + 3}
      width={T - 6}
      height={T - 6}
      fill="none"
      stroke={C.orange}
      strokeWidth={3}
      strokeDasharray="6 6"
    />
  ) : (
    <g>
      <rect x={c * T} y={r * T} width={T} height={T} fill={C.orange} />
      <rect x={c * T} y={r * T + T / 2 - 2} width={T} height={4} fill={C.red} />
      <rect x={c * T + (r % 2 === 0 ? 10 : 28)} y={r * T} width={4} height={T / 2} fill={C.red} />
      <rect
        x={c * T + (r % 2 === 0 ? 28 : 10)}
        y={r * T + T / 2}
        width={4}
        height={T / 2}
        fill={C.red}
      />
    </g>
  );

const Pipe = ({ c, top, label }: { c: number; top: number; label: string }) => (
  <g>
    <rect x={c * T - 6} y={top * T} width={T * 2 + 12} height={T} fill={C.green} />
    <rect x={c * T - 6} y={top * T} width={10} height={T} fill={C.lime} />
    <rect x={c * T} y={(top + 1) * T} width={T * 2} height={(11 - top - 1) * T} fill={C.green} />
    <rect x={c * T + 8} y={(top + 1) * T} width={10} height={(11 - top - 1) * T} fill={C.lime} />
    <text
      x={c * T + T}
      y={top * T - 16}
      textAnchor="middle"
      fontFamily="'Press Start 2P', monospace"
      fontSize={22}
      fill={label === '-1' ? C.cyan : C.white}
    >
      {label}
    </text>
  </g>
);

const Marker = ({ x, y, n }: { x: number; y: number; n: string }) => (
  <g>
    <rect x={x - 22} y={y - 22} width={44} height={44} fill={C.yellow} />
    <text
      x={x}
      y={y + 11}
      textAnchor="middle"
      fontFamily="'Press Start 2P', monospace"
      fontSize={22}
      fill={C.night}
    >
      {n}
    </text>
  </g>
);

const GlitchStep = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
    <span
      style={{
        flex: 'none',
        width: 44,
        height: 44,
        background: C.yellow,
        color: C.night,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 22,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 40, lineHeight: 1.05 }}>{children}</span>
  </div>
);

const Glitch: Page = () => {
  const ceiling = Array.from({ length: 27 }, (_, c) => c);
  const wallRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <Stage step={4} world="3-1" time="04:07.92" coins={15}>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 150 }}>
        <Tag bg={C.plum}>WORLD 3 · FAMOUS GLITCH</Tag>
        <div style={{ marginTop: 26 }}>
          <Title>THE MINUS WORLD</Title>
        </div>
      </div>
      <PixelBox
        bg="#0e1224"
        border={C.steel}
        style={{ position: 'absolute', left: 120, top: 330, width: 1080, height: 480 }}
      >
        <svg width={1080} height={480} viewBox="0 0 1080 480" shapeRendering="crispEdges">
          {ceiling.map((c) => (
            <Brick key={`c${c}`} c={c} r={0} />
          ))}
          {ceiling.map((c) => (
            <rect
              key={`g${c}`}
              x={c * T}
              y={11 * T}
              width={T}
              height={T}
              fill={c % 2 === 0 ? C.steel : C.slate}
            />
          ))}
          {wallRows.map((r) => (
            <Brick key={`w1${r}`} c={15} r={r} broken={r === 1 || r === 2} />
          ))}
          {wallRows.map((r) => (
            <Brick key={`w2${r}`} c={16} r={r} broken={r === 1} />
          ))}
          <rect x={10 * T} y={9 * T} width={T * 5} height={T * 2} fill={C.green} />
          <rect x={10 * T} y={9 * T} width={T * 5} height={10} fill={C.lime} />
          <rect x={9 * T + 20} y={8 * T + 30} width={20} height={T * 2 + 10} fill={C.green} />
          <Pipe c={18} top={8} label="-1" />
          <Pipe c={21} top={8} label="5" />
          <Pipe c={24} top={8} label="-1" />
          <text
            x={21 * T + 20}
            y={3 * T}
            textAnchor="middle"
            fontFamily="'Press Start 2P', monospace"
            fontSize={20}
            fill={C.steel}
          >
            WARP ZONE
          </text>
          <text
            x={21 * T + 20}
            y={3 * T + 34}
            textAnchor="middle"
            fontFamily="'Press Start 2P', monospace"
            fontSize={18}
            fill={C.steel}
          >
            (SIGNS NOT LOADED)
          </text>
          <path
            d={`M${13 * T} ${8 * T - 10} C${14 * T} ${6 * T} ${15 * T} ${6 * T} ${16 * T + 20} ${7 * T + 10} L${17 * T + 30} ${8 * T - 10}`}
            fill="none"
            stroke={C.yellow}
            strokeWidth={5}
            strokeDasharray="10 8"
          />
          <path
            d={`M${17 * T + 30} ${8 * T - 10} l-18 -4 m18 4 l-6 -16`}
            fill="none"
            stroke={C.yellow}
            strokeWidth={5}
          />
          <g transform={`translate(${12 * T} ${7 * T - 4})`}>
            <svg width={60} height={70} viewBox="0 0 12 14" shapeRendering="crispEdges">
              {JUMP.map((row, y) =>
                row
                  .split('')
                  .map((ch, x) =>
                    ch === '.' ? null : (
                      <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width={1.02}
                        height={1.02}
                        fill={PALETTE[ch]}
                      />
                    ),
                  ),
              )}
            </svg>
          </g>
          <Marker x={14 * T - 10} y={2 * T} n="1" />
          <Marker x={13 * T + 10} y={5 * T + 10} n="2" />
          <Marker x={17.6 * T} y={4.5 * T} n="3" />
          <Marker x={19 * T} y={6.4 * T} n="4" />
        </svg>
      </PixelBox>
      <div style={{ position: 'absolute', left: 1260, top: 330, width: 560 }}>
        <Steps>
          <Step>
            <GlitchStep n="1">Break the bricks above the exit pipe. Leave one.</GlitchStep>
          </Step>
          <Step>
            <GlitchStep n="2">
              Crouch-jump into the wall. The game pushes you through it.
            </GlitchStep>
          </Step>
          <Step>
            <GlitchStep n="3">Land in the warp zone before its signs load.</GlitchStep>
          </Step>
          <Step>
            <GlitchStep n="4">
              Take the first pipe: <span style={{ color: C.cyan }}>WORLD −1</span>, an underwater
              level that never ends.
            </GlitchStep>
          </Step>
        </Steps>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 850,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 20,
          color: C.mist,
        }}
      >
        SUPER MARIO BROS. (1985) · FAMOUS FOREVER, USELESS FOR ANY%: YOU CAN NEVER FINISH IT
      </div>
    </Stage>
  );
};

const FrameCell = ({ n, hit }: { n: number; hit?: boolean }) => (
  <div style={{ width: 64, textAlign: 'center' }}>
    <div
      style={{
        height: 96,
        background: hit ? C.yellow : n % 2 === 0 ? C.slate : '#2b3250',
        boxShadow: hit ? pixelShadow(C.white, 4) : undefined,
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 16,
        color: hit ? C.night : C.steel,
      }}
    >
      {hit ? 'A!' : ''}
    </div>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 14,
        color: hit ? C.yellow : C.steel,
        marginTop: 10,
      }}
    >
      {n}
    </div>
  </div>
);

const MeterRow = ({ label, ms, color }: { label: string; ms: number; color: string }) => {
  const frames = ms / (1000 / 60);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '430px 1fr 190px',
        alignItems: 'center',
        gap: 20,
        marginBottom: 10,
      }}
    >
      <span style={{ fontSize: 40 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: Math.max(1, Math.round(frames)) }, (_, i) => (
          <div key={i} style={{ width: 36, height: 30, background: color }} />
        ))}
      </div>
      <span
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 20,
          color: C.mist,
          textAlign: 'right',
        }}
      >
        {ms < 100 ? ms.toFixed(1) : `~${Math.round(ms)}`} MS
      </span>
    </div>
  );
};

const FramePerfect: Page = () => {
  const cells = Array.from({ length: 20 }, (_, i) => i + 1);
  return (
    <Stage step={5} world="4-1" time="05:20.06" coins={18}>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 150 }}>
        <Tag bg={C.blue}>WORLD 4 · TECH</Tag>
        <div
          style={{
            marginTop: 26,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <Title>THE FRAME-PERFECT TRICK</Title>
          <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 22, color: C.mist }}>
            60 FPS
          </span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 120, top: 310, width: 1680 }}>
        <div style={{ position: 'relative', height: 40 }}>
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 0,
              animation: 'px-playhead 2.4s steps(19) infinite',
              fontFamily: 'var(--osd-font-display)',
              fontSize: 26,
              color: C.cyan,
            }}
          >
            ▼
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {cells.map((n) => (
            <FrameCell key={n} n={n} hit={n === 12} />
          ))}
        </div>
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 30 }}>
          <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 44, color: C.yellow }}>
            1 FRAME = 16.7 MS
          </span>
          <span style={{ fontSize: 44, color: C.mist }}>— press on frame 12, not 11, not 13.</span>
        </div>
        <div style={{ marginTop: 26 }}>
          <MeterRow label="Frame-perfect window" ms={16.7} color={C.yellow} />
          <MeterRow label="Two-frame window" ms={33.3} color={C.orange} />
          <MeterRow label="Human reaction time" ms={250} color={C.red} />
        </div>
        <div style={{ marginTop: 6, fontSize: 40, color: C.cyan }}>
          So runners don't react. They count — by rhythm, sound and muscle memory.
        </div>
      </div>
    </Stage>
  );
};

const TOTALS = [210, 380, 560, 790, 1020, 1240, 1610, 1880, 2030, 2210, 2470, 2915];
const BLOCK = 44;

const MoneyBar = ({ year, k, i }: { year: number; k: number; i: number }) => {
  const blocks = Math.max(1, Math.round(k / 250));
  const last = i === TOTALS.length - 1;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: 60,
      }}
    >
      {last ? (
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 18,
            color: C.yellow,
            marginBottom: 12,
          }}
        >
          $2.9M
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 4 }}>
        {Array.from({ length: blocks }, (_, b) => (
          <div
            key={b}
            style={{
              width: BLOCK,
              height: 26,
              background: last ? C.yellow : b % 2 === 0 ? C.green : C.lime,
              boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.25)',
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 14,
          color: last ? C.yellow : C.steel,
          marginTop: 12,
        }}
      >
        &apos;{String(year).slice(2)}
      </div>
    </div>
  );
};

const BonusStat = ({ value, label, color }: { value: string; label: string; color: string }) => (
  <PixelBox bg={C.slate} border={color} style={{ padding: '18px 26px' }}>
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 36, color }}>{value}</div>
    <div style={{ fontSize: 38, marginTop: 8, color: C.white, lineHeight: 1 }}>{label}</div>
  </PixelBox>
);

const Marathons: Page = () => (
  <Stage step={6} world="BONUS" time="06:33.51" coins={64}>
    <div style={{ position: 'absolute', left: 120, right: 120, top: 150 }}>
      <Tag bg={C.green}>BONUS STAGE</Tag>
      <div style={{ marginTop: 26 }}>
        <Title>MARATHONS FOR CHARITY</Title>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 120, top: 320, width: 1040 }}>
      <div style={{ fontSize: 40, color: C.mist }}>
        Raised per year by “Speed for Good”, $k{' '}
        <span style={{ color: C.steel }}>· fictional, illustrative</span>
      </div>
      <div style={{ marginTop: 40, height: 420, display: 'flex', alignItems: 'flex-end', gap: 22 }}>
        {TOTALS.map((k, i) => (
          <MoneyBar key={k} year={2014 + i} k={k} i={i} />
        ))}
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 1240,
        top: 330,
        width: 540,
        display: 'flex',
        flexDirection: 'column',
        gap: 34,
      }}
    >
      <BonusStat value="168 HRS" label="of runs, nonstop" color={C.cyan} />
      <BonusStat value="152 RUNS" label="9-minute dashes to RPGs" color={C.orange} />
      <BonusStat value="$2.9M" label="for medical aid in 2025" color={C.yellow} />
    </div>
  </Stage>
);

const SCORE_COLORS = [C.yellow, C.orange, C.red, C.lime, C.cyan, C.sky, C.mist, C.mist];

const ScoreRow = ({
  rank,
  name,
  time,
  date,
  i,
}: {
  rank: string;
  name: string;
  time: string;
  date: string;
  i: number;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '130px 1fr 300px 220px',
      alignItems: 'center',
      fontFamily: 'var(--osd-font-display)',
      fontSize: 26,
      color: SCORE_COLORS[i],
      padding: '11px 0',
      whiteSpace: 'nowrap',
    }}
  >
    <span>{rank}</span>
    <span>{name}</span>
    <span style={{ textAlign: 'right' }}>{time}</span>
    {i === 0 ? (
      <span style={{ textAlign: 'right' }}>
        <span
          style={{
            fontSize: 18,
            color: C.night,
            background: C.yellow,
            padding: '6px 8px 4px',
            boxShadow: pixelShadow(C.yellow, 3),
          }}
        >
          NEW WR
        </span>
      </span>
    ) : (
      <span style={{ textAlign: 'right', color: C.steel }}>{date}</span>
    )}
  </div>
);

const BoardRule = ({ n, children }: { n: string; children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', marginBottom: 20 }}>
    <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 22, color: C.yellow }}>
      {n}
    </span>
    <span style={{ fontSize: 40, lineHeight: 1.05 }}>{children}</span>
  </div>
);

const HighScores: Page = () => (
  <Stage step={7} world="5-1" time="07:41.88" coins={71}>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 150,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      <Title color={C.cyan}>HIGH SCORES</Title>
      <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 22, color: C.mist }}>
        PIXEL QUEST II · ANY% · FICTIONAL BOARD
      </span>
    </div>
    <PixelBox
      bg={C.night}
      border={C.cyan}
      style={{
        position: 'absolute',
        left: 120,
        top: 280,
        width: 1130,
        height: 560,
        padding: '22px 40px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '130px 1fr 300px 220px',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 20,
          color: C.steel,
          paddingBottom: 12,
          borderBottom: `4px solid ${C.slate}`,
        }}
      >
        <span>RANK</span>
        <span>RUNNER</span>
        <span style={{ textAlign: 'right' }}>TIME</span>
        <span style={{ textAlign: 'right' }}>DATE</span>
      </div>
      <ScoreRow i={0} rank="1ST" name="KIRA_FRAMES" time="24:58.33" date="SEP 26" />
      <ScoreRow i={1} rank="2ND" name="MOTHMAN64" time="25:01.90" date="AUG 26" />
      <ScoreRow i={2} rank="3RD" name="PXLDUCK" time="25:07.12" date="SEP 26" />
      <ScoreRow i={3} rank="4TH" name="ZIPCLIP" time="25:13.48" date="JUN 26" />
      <ScoreRow i={4} rank="5TH" name="NORA.EXE" time="25:19.05" date="JUL 26" />
      <ScoreRow i={5} rank="6TH" name="LAGWIZARD" time="25:22.77" date="MAR 26" />
      <ScoreRow i={6} rank="7TH" name="BYTEBEAR" time="25:30.01" date="DEC 25" />
      <ScoreRow i={7} rank="8TH" name="OLDSCHOOLSAM" time="25:41.66" date="OCT 25" />
    </PixelBox>
    <div style={{ position: 'absolute', left: 1320, top: 290, width: 480 }}>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 22,
          color: C.yellow,
          marginBottom: 26,
          lineHeight: 1.5,
        }}
      >
        HOW A RUN GETS ON THE BOARD
      </div>
      <BoardRule n="1">Record the full run, timer on screen.</BoardRule>
      <BoardRule n="2">Submit the video with your splits.</BoardRule>
      <BoardRule n="3">Volunteer mods re-time it frame by frame.</BoardRule>
      <BoardRule n="4">Then your rivals study it — and race back.</BoardRule>
    </div>
  </Stage>
);

const PB: [number, number][] = [
  [1, 1900],
  [40, 1812],
  [95, 1770],
  [180, 1731],
  [320, 1682],
  [510, 1642],
  [800, 1609],
  [1150, 1580],
  [1600, 1551],
  [2100, 1533],
  [2600, 1510],
  [3012, 1498],
];

const GW = 1060;
const GH = 430;
const gx = (a: number) => 140 + (a / 3100) * (GW - 180);
const gy = (s: number) => 50 + ((1920 - s) / (1920 - 1470)) * (GH - 90);
const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const GrindStat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div style={{ marginBottom: 30 }}>
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 20, color: C.steel }}>
      {label}
    </div>
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 40, color, marginTop: 12 }}>
      {value}
    </div>
  </div>
);

const Grind: Page = () => {
  let d = `M${gx(PB[0][0])} ${gy(PB[0][1])}`;
  for (let i = 1; i < PB.length; i++) {
    d += ` H${gx(PB[i][0])} V${gy(PB[i][1])}`;
  }
  d += ` H${gx(3100)}`;
  return (
    <Stage step={8} world="6-1" time="08:59.30" coins={80}>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 150 }}>
        <Tag bg={C.orange}>SAVE POINT</Tag>
        <div style={{ marginTop: 26 }}>
          <Title>THE MATH OF THE GRIND</Title>
        </div>
      </div>
      <PixelBox
        bg="#14233a"
        border={C.steel}
        style={{ position: 'absolute', left: 120, top: 330, width: GW, height: GH + 70 }}
      >
        <svg
          width={GW}
          height={GH + 70}
          viewBox={`0 0 ${GW} ${GH + 70}`}
          shapeRendering="crispEdges"
        >
          {[1500, 1620, 1740, 1860].map((s) => (
            <g key={s}>
              <rect x={140} y={gy(s)} width={GW - 180} height={3} fill={C.slate} />
              <text
                x={124}
                y={gy(s) + 9}
                textAnchor="end"
                fontFamily="'Press Start 2P', monospace"
                fontSize={18}
                fill={C.steel}
              >
                {fmtTime(s)}
              </text>
            </g>
          ))}
          {[0, 1000, 2000, 3000].map((a) => (
            <text
              key={a}
              x={gx(a)}
              y={GH + 30}
              textAnchor="middle"
              fontFamily="'Press Start 2P', monospace"
              fontSize={18}
              fill={C.steel}
            >
              {a === 0 ? '0' : `${a / 1000}K`}
            </text>
          ))}
          <text
            x={GW - 30}
            y={GH + 58}
            textAnchor="end"
            fontFamily="'Press Start 2P', monospace"
            fontSize={18}
            fill={C.mist}
          >
            ATTEMPTS →
          </text>
          <path d={d} fill="none" stroke={C.lime} strokeWidth={8} />
          {PB.map(([a, s], i) => (
            <rect
              key={a}
              x={gx(a) - 7}
              y={gy(s) - 7}
              width={14}
              height={14}
              fill={i === PB.length - 1 ? C.yellow : C.green}
            />
          ))}
          <text
            x={gx(1)}
            y={gy(1900) - 22}
            fontFamily="'Press Start 2P', monospace"
            fontSize={20}
            fill={C.mist}
          >
            FIRST RUN 31:40
          </text>
          <text
            x={gx(3012) - 10}
            y={gy(1498) + 44}
            textAnchor="end"
            fontFamily="'Press Start 2P', monospace"
            fontSize={20}
            fill={C.yellow}
          >
            PB 24:58
          </text>
        </svg>
      </PixelBox>
      <div style={{ position: 'absolute', left: 1270, top: 340, width: 540 }}>
        <GrindStat label="ATTEMPTS" value="3,012" color={C.white} />
        <GrindStat label="FINISHED RUNS" value="151 · 5%" color={C.orange} />
        <GrindStat label="TIME SAVED" value="-6:42" color={C.lime} />
        <div style={{ fontSize: 40, lineHeight: 1.05, color: C.mist }}>
          Most runs die in the first five minutes. Reset, reset, reset — then one run holds.
        </div>
      </div>
    </Stage>
  );
};

const Digits = () => (
  <div
    style={{ height: 140, overflow: 'hidden', display: 'inline-block', verticalAlign: 'bottom' }}
  >
    <div style={{ animation: 'px-count 10s steps(10) infinite' }}>
      {['9', '8', '7', '6', '5', '4', '3', '2', '1', '0'].map((d) => (
        <div key={d} style={{ height: 140, lineHeight: '150px' }}>
          {d}
        </div>
      ))}
    </div>
  </div>
);

const GameOver: Page = () => (
  <Stage step={9} world="8-4" time="09:59.99" coins={99} lives={0}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 130,
          color: C.red,
          textShadow: `8px 8px 0 ${C.plum}`,
          letterSpacing: '0.04em',
        }}
      >
        GAME OVER
      </div>
      <div
        style={{
          marginTop: 70,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 56,
          color: C.white,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 30,
        }}
      >
        <span style={{ lineHeight: '140px' }}>CONTINUE?</span>
        <span style={{ fontSize: 100, color: C.yellow }}>
          <Digits />
        </span>
      </div>
      <div
        style={{
          marginTop: 44,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 36,
          display: 'flex',
          justifyContent: 'center',
          gap: 120,
        }}
      >
        <span style={{ color: C.yellow }}>
          <Blink speed={0.6}>▶</Blink> YES
        </span>
        <span style={{ color: C.steel }}>NO</span>
      </div>
      <div style={{ marginTop: 74, fontSize: 48, color: C.mist }}>
        Thanks for playing. Insert coin to ask a question.
      </div>
    </div>
  </Stage>
);

const morph: SlideTransition = {
  duration: 400,
  exit: { duration: 640, easing: 'steps(1, end)', keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 400,
    easing: 'steps(8, end)',
    keyframes: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
  },
  morph: { duration: 640, easing: 'steps(16, end)' },
};

export const transition: SlideTransition = morph;

export const meta: SlideMeta = {
  title: 'Any% — The Art and Science of Speedrunning',
  createdAt: '2026-10-07T16:16:25.541Z',
};

export default [
  TitleScreen,
  WhatIs,
  SelectCategory,
  Routing,
  Glitch,
  FramePerfect,
  Marathons,
  HighScores,
  Grind,
  GameOver,
] satisfies Page[];

export const notes: (string | undefined)[] = [
  `Press start. Tonight is about speedrunning — people who finish video games as fast as humanly possible, and why it's half sport, half science.
Watch the little runner at the bottom. Every slide is a level; he'll be at the flag by the end.`,
  `World 1-1. The definition is simple: beat the game as fast as possible.
Three rules make it a sport. One clock — real time, first input to last hit. One ruleset — the category. One take — every run is recorded, no cuts.`,
  `Same game, different categories. Any% means reach the end, by any means — that's our focus. 100% means collect everything. Glitchless bans the big exploits. Low% is the minimalist challenge.
And TAS — tool-assisted — is a separate art: frame-by-frame inputs by a computer. Not competing with humans.`,
  `A route is a plan for every second. Runners hunt for skips — here a warp that jumps straight past four worlds and saves almost twelve minutes.
On the right, splits: each segment compared to your best. Green means ahead. Sum of best is your theoretical perfect run.`,
  `The most famous glitch in history: the Minus World in Super Mario Bros.
[click] Break the bricks above the exit pipe, leave one. [click] Crouch-jump into the wall and the game pushes you through. [click] You land in the warp zone before its signs load. [click] Take the first pipe and you're in World minus one — an underwater level that loops forever.
Famous — and useless for Any%, because you can't finish it. Not every glitch is a shortcut.`,
  `At 60 frames a second, one frame is 16.7 milliseconds. A frame-perfect trick has exactly that window.
Human reaction is around 250 milliseconds — fifteen frames. So runners don't react. They count: rhythm, audio cues, muscle memory.`,
  `Bonus stage: charity. Speedrun marathons stream for a week straight and raise millions.
These figures are illustrative — a fictional marathon modelled on the real ones — but the shape is real: a hobby that turned into one of gaming's biggest fundraisers.`,
  `The leaderboard is the community. Runs are recorded, submitted with splits, and re-timed by volunteer moderators frame by frame.
And then rivals study your run, and race back. Records fall by tenths of a second.`,
  `Here's the honest part. Three thousand attempts. Only five per cent are finished — most runs are reset in the first five minutes.
The personal best falls in steps: big drops early, tiny ones later. Six minutes forty-two saved, one frame at a time.`,
  `Game over — or continue? Thanks for playing. Insert coin to ask a question.`,
];

export type ScoreCues = {
  glow: number;
  gather: number;
  flatten: number;
  sheen: number;
  morph: number;
  lands: number;
  settled: number;
  exit: number;
  docks: number[];
};

export type IntroSound = {
  ready: Promise<void>;
  start(): void;
  fadeOut(seconds: number): void;
  dispose(): void;
};

const MASTER = 0.5;
const TAIL = 3.4;
const SAW_DETUNE = [-14, -7, 0, 7, 14];
const SAW_PAN = [-0.9, 0.45, 0, -0.45, 0.9];
const BELL_PARTIALS = [
  { ratio: 1, level: 1, decay: 1 },
  { ratio: 2, level: 0.55, decay: 0.7 },
  { ratio: 3.01, level: 0.3, decay: 0.45 },
  { ratio: 4.2, level: 0.16, decay: 0.3 },
  { ratio: 5.43, level: 0.08, decay: 0.18 },
];

const HARMONY = {
  drone: ['D2', 'A2', 'D3'],
  rise: ['Bb2', 'F3', 'Bb3', 'D4', 'F4'],
  lift: ['C3', 'G3', 'D4', 'E4', 'G4', 'C5'],
  suspend: ['D3', 'A3', 'D4', 'G4', 'A4', 'D5'],
  arrive: ['D2', 'A2', 'D3', 'A3', 'D4', 'F#4', 'A4', 'D5', 'F#5', 'A5'],
};
const DOCK_BELLS = ['Bb4', 'D5', 'F5', 'Bb5', 'D6', 'F6'];
const SHEEN_BELLS = ['G5', 'C6', 'D6', 'E6', 'G6', 'C7'];
const SETTLE_BELLS = ['A5', 'D6', 'F#6', 'A6', 'D7'];

const hz = (name: string) => {
  const [, letter = 'A', accidental, octave = '4'] = /^([A-G])(b|#)?(\d)$/.exec(name) ?? [];
  const pitchClass =
    'C D EF G A B'.indexOf(letter) + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  return 440 * 2 ** ((pitchClass + (Number(octave) + 1) * 12 - 69) / 12);
};

function makeGain(ctx: BaseAudioContext, value: number) {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

function makeNoise(ctx: BaseAudioContext) {
  const buffer = ctx.createBuffer(2, ctx.sampleRate * 2, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function makeHall(ctx: BaseAudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let smoothed = 0;
    for (let i = 0; i < length; i++) {
      const progress = i / length;
      // Air absorbs highs first, so the tail darkens as it decays.
      smoothed += (0.75 - 0.62 * progress) * (Math.random() * 2 - 1 - smoothed);
      data[i] = smoothed * Math.exp(-6.5 * progress);
    }
  }
  return buffer;
}

function makeDriveCurve(amount: number) {
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

function makeLfo(ctx: BaseAudioContext, rate: number, depth: number, start: number) {
  const lfo = ctx.createOscillator();
  lfo.frequency.value = rate;
  const amount = makeGain(ctx, depth);
  lfo.connect(amount);
  lfo.start(start);
  return amount;
}

function makePhaser(ctx: BaseAudioContext, start: number) {
  const input = makeGain(ctx, 1);
  const output = makeGain(ctx, 0.72);
  const sweep = makeLfo(ctx, 0.11, 620, start);
  input.connect(output);
  let tail: AudioNode = input;
  for (let stage = 0; stage < 4; stage++) {
    const allpass = ctx.createBiquadFilter();
    allpass.type = 'allpass';
    allpass.frequency.value = 900 + stage * 260;
    allpass.Q.value = 0.7;
    sweep.connect(allpass.frequency);
    tail.connect(allpass);
    tail = allpass;
  }
  tail.connect(output);
  return { input, output };
}

function makeChorus(ctx: BaseAudioContext, start: number) {
  const input = makeGain(ctx, 1);
  const output = makeGain(ctx, 0.8);
  const split = ctx.createChannelSplitter(2);
  const merge = ctx.createChannelMerger(2);
  input.connect(output);
  input.connect(split);
  [0.31, 0.43].forEach((rate, channel) => {
    const delay = ctx.createDelay(0.1);
    delay.delayTime.value = 0.019 + channel * 0.004;
    makeLfo(ctx, rate, 0.0038, start).connect(delay.delayTime);
    split.connect(delay, channel);
    delay.connect(merge, 0, channel);
  });
  merge.connect(output);
  return { input, output };
}

function makePingPong(ctx: BaseAudioContext, seconds: number) {
  const input = makeGain(ctx, 1);
  const left = ctx.createDelay(1);
  const right = ctx.createDelay(1);
  left.delayTime.value = seconds;
  right.delayTime.value = seconds;
  const feedback = makeGain(ctx, 0.44);
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 4800;
  const merge = ctx.createChannelMerger(2);
  input.connect(left);
  left.connect(right);
  right.connect(damp);
  damp.connect(feedback);
  feedback.connect(left);
  left.connect(merge, 0, 0);
  right.connect(merge, 0, 1);
  return { input, output: merge };
}

function makeRack(ctx: BaseAudioContext, output: AudioNode, start: number) {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 6;
  limiter.ratio.value = 4;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.28;
  const master = makeGain(ctx, MASTER);
  limiter.connect(master);
  master.connect(output);

  const predelay = ctx.createDelay(0.2);
  predelay.delayTime.value = 0.03;
  const hall = ctx.createConvolver();
  hall.buffer = makeHall(ctx, 5.5);
  const hallReturn = makeGain(ctx, 0.9);
  predelay.connect(hall);
  hall.connect(hallReturn);
  hallReturn.connect(limiter);

  const echo = makePingPong(ctx, 0.36);
  const echoReturn = makeGain(ctx, 0.5);
  echo.output.connect(echoReturn);
  echoReturn.connect(limiter);
  echoReturn.connect(predelay);

  const pad = makeGain(ctx, 1);
  const drive = ctx.createWaveShaper();
  drive.curve = makeDriveCurve(1.8);
  drive.oversample = '2x';
  const lowpasses = [0.7, 1.3].map((Q) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = Q;
    return filter;
  });
  const [lowOne, lowTwo] = lowpasses as [BiquadFilterNode, BiquadFilterNode];
  const phaser = makePhaser(ctx, start);
  const chorus = makeChorus(ctx, start);
  const padSend = makeGain(ctx, 0.4);
  pad.connect(drive);
  drive.connect(lowOne);
  lowOne.connect(lowTwo);
  lowTwo.connect(phaser.input);
  phaser.output.connect(chorus.input);
  chorus.output.connect(limiter);
  chorus.output.connect(padSend);
  padSend.connect(predelay);

  const sparkle = makeGain(ctx, 1);
  const sparkleSend = makeGain(ctx, 0.55);
  sparkle.connect(limiter);
  sparkle.connect(echo.input);
  sparkle.connect(sparkleSend);
  sparkleSend.connect(predelay);

  const low = ctx.createWaveShaper();
  low.curve = makeDriveCurve(2.4);
  low.oversample = '2x';
  low.connect(limiter);

  return { limiter, pad, lowpasses, predelay, sparkle, low, noise: makeNoise(ctx) };
}

type Rack = ReturnType<typeof makeRack>;

type Chord = {
  notes: string[];
  start: number;
  stop: number;
  attack: number;
  release: number;
  level: number;
  slide: number;
};

function playChord(ctx: BaseAudioContext, rack: Rack, chord: Chord) {
  const { notes, start, stop, attack, release, level, slide } = chord;
  const peak = level / Math.sqrt(notes.length * SAW_DETUNE.length);
  const envelope = makeGain(ctx, 0);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(peak, start + attack);
  envelope.gain.setValueAtTime(peak, stop - release);
  envelope.gain.linearRampToValueAtTime(0, stop);
  envelope.connect(rack.pad);
  for (const note of notes) {
    SAW_DETUNE.forEach((cents, i) => {
      const saw = ctx.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.value = hz(note);
      saw.detune.setValueAtTime(cents - slide, start);
      saw.detune.linearRampToValueAtTime(cents, start + Math.max(attack, 0.25));
      const pan = ctx.createStereoPanner();
      pan.pan.value = SAW_PAN[i] ?? 0;
      saw.connect(pan);
      pan.connect(envelope);
      // Oscillators share a start phase; staggering them avoids a zipped-up click
      // on fast attacks and lets the detune spread from the first cycle.
      saw.start(start + Math.random() * 0.018);
      saw.stop(stop);
    });
  }
}

function playSub(
  ctx: BaseAudioContext,
  rack: Rack,
  note: string,
  start: number,
  stop: number,
  attack: number,
  level: number,
) {
  const sine = ctx.createOscillator();
  sine.frequency.value = hz(note);
  const envelope = makeGain(ctx, 0);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + attack);
  envelope.gain.setValueAtTime(level, stop - 0.2);
  envelope.gain.linearRampToValueAtTime(0, stop);
  sine.connect(envelope);
  envelope.connect(rack.low);
  sine.start(start);
  sine.stop(stop);
}

function playThump(
  ctx: BaseAudioContext,
  rack: Rack,
  note: string,
  time: number,
  level: number,
  decay: number,
) {
  const sine = ctx.createOscillator();
  const pitch = hz(note);
  sine.frequency.setValueAtTime(pitch * 3.2, time);
  sine.frequency.exponentialRampToValueAtTime(pitch, time + 0.13);
  const envelope = makeGain(ctx, 0);
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(level, time + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  sine.connect(envelope);
  envelope.connect(rack.low);
  sine.start(time);
  sine.stop(time + decay);

  const skin = ctx.createBufferSource();
  skin.buffer = rack.noise;
  skin.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1600;
  const click = makeGain(ctx, 0);
  click.gain.setValueAtTime(level * 0.35, time);
  click.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  skin.connect(filter);
  filter.connect(click);
  click.connect(rack.limiter);
  click.connect(rack.predelay);
  skin.start(time);
  skin.stop(time + 0.1);
}

function playBell(
  ctx: BaseAudioContext,
  rack: Rack,
  note: string,
  time: number,
  level: number,
  decay: number,
) {
  const pan = ctx.createStereoPanner();
  pan.pan.value = Math.random() * 1.2 - 0.6;
  pan.connect(rack.sparkle);
  for (const partial of BELL_PARTIALS) {
    const sine = ctx.createOscillator();
    sine.frequency.value = hz(note) * partial.ratio;
    const ring = decay * partial.decay;
    const envelope = makeGain(ctx, 0);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level * partial.level, time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + ring);
    sine.connect(envelope);
    envelope.connect(pan);
    sine.start(time);
    sine.stop(time + ring);
  }
}

function playWind(ctx: BaseAudioContext, rack: Rack, start: number, stop: number) {
  const source = ctx.createBufferSource();
  source.buffer = rack.noise;
  source.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(260, start);
  band.frequency.exponentialRampToValueAtTime(1500, stop);
  const envelope = makeGain(ctx, 0);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(0.09, start + (stop - start) * 0.7);
  envelope.gain.linearRampToValueAtTime(0, stop);
  source.connect(band);
  band.connect(envelope);
  envelope.connect(rack.limiter);
  envelope.connect(rack.predelay);
  source.start(start);
  source.stop(stop);
}

function playRiser(ctx: BaseAudioContext, rack: Rack, start: number, stop: number) {
  const source = ctx.createBufferSource();
  source.buffer = rack.noise;
  source.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 2.4;
  band.frequency.setValueAtTime(420, start);
  band.frequency.exponentialRampToValueAtTime(10500, stop);
  const envelope = makeGain(ctx, 0.0001);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.3, stop);
  envelope.gain.linearRampToValueAtTime(0, stop + 0.025);
  source.connect(band);
  band.connect(envelope);
  envelope.connect(rack.limiter);
  envelope.connect(rack.predelay);
  source.start(start);
  source.stop(stop + 0.03);
}

function playGlide(ctx: BaseAudioContext, rack: Rack, start: number, stop: number) {
  for (const [from, to] of [
    ['D3', 'D5'],
    ['A3', 'A5'],
  ] as const) {
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.setValueAtTime(hz(from), start);
    saw.frequency.exponentialRampToValueAtTime(hz(to), stop);
    const envelope = makeGain(ctx, 0);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(0.09, stop - 0.05);
    envelope.gain.linearRampToValueAtTime(0, stop);
    saw.connect(envelope);
    envelope.connect(rack.pad);
    saw.start(start);
    saw.stop(stop);
  }
}

function playWash(ctx: BaseAudioContext, rack: Rack, time: number, decay: number) {
  const source = ctx.createBufferSource();
  source.buffer = rack.noise;
  source.loop = true;
  const high = ctx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = 4200;
  const envelope = makeGain(ctx, 0);
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(0.22, time + 0.006);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  source.connect(high);
  high.connect(envelope);
  envelope.connect(rack.limiter);
  envelope.connect(rack.predelay);
  source.start(time);
  source.stop(time + decay);
}

export function performScore(
  ctx: BaseAudioContext,
  output: AudioNode,
  cues: ScoreCues,
  origin: number,
) {
  const rack = makeRack(ctx, output, origin);
  const t = (ms: number) => origin + ms / 1000;
  const glow = t(cues.glow);
  const gather = t(cues.gather);
  const flatten = t(cues.flatten);
  const sheen = t(cues.sheen);
  const morph = t(cues.morph);
  const lands = t(cues.lands);
  const settled = t(cues.settled);
  const exit = t(cues.exit);
  const end = exit + TAIL;

  for (const filter of rack.lowpasses) {
    const cutoff = filter.frequency;
    cutoff.setValueAtTime(240, glow);
    cutoff.exponentialRampToValueAtTime(900, gather);
    cutoff.exponentialRampToValueAtTime(1500, flatten);
    cutoff.exponentialRampToValueAtTime(3200, sheen);
    cutoff.exponentialRampToValueAtTime(3800, morph);
    // Closes as the window winds back, so the opening hits harder when it commits.
    cutoff.exponentialRampToValueAtTime(1900, morph + 0.2);
    cutoff.exponentialRampToValueAtTime(8500, lands - 0.03);
    cutoff.setValueAtTime(14000, lands);
    cutoff.exponentialRampToValueAtTime(6200, lands + 1.4);
    cutoff.exponentialRampToValueAtTime(3400, exit + 1);
  }

  // A held breath just before the hit: the contrast is what makes it feel huge.
  rack.pad.gain.setValueAtTime(1, lands - 0.2);
  rack.pad.gain.linearRampToValueAtTime(0.12, lands - 0.02);
  rack.pad.gain.setValueAtTime(1, lands);

  playWind(ctx, rack, glow, gather + 0.4);
  playChord(ctx, rack, {
    notes: HARMONY.drone,
    start: glow,
    stop: gather + 1.4,
    attack: 2.4,
    release: 1.4,
    level: 0.04,
    slide: 0,
  });
  playChord(ctx, rack, {
    notes: HARMONY.rise,
    start: gather,
    stop: flatten + 0.7,
    attack: 1.5,
    release: 0.7,
    level: 0.1,
    slide: 34,
  });
  playChord(ctx, rack, {
    notes: HARMONY.lift,
    start: flatten,
    stop: morph + 0.35,
    attack: 0.9,
    release: 0.35,
    level: 0.17,
    slide: 28,
  });
  playChord(ctx, rack, {
    notes: HARMONY.suspend,
    start: morph,
    stop: lands + 0.02,
    attack: 0.3,
    release: 0.04,
    level: 0.25,
    slide: 18,
  });
  playChord(ctx, rack, {
    notes: HARMONY.arrive,
    start: lands,
    stop: end,
    attack: 0.012,
    release: 0.5,
    level: 1.6,
    slide: 0,
  });

  playSub(ctx, rack, 'Bb1', gather, flatten + 0.3, 1.2, 0.016);
  playSub(ctx, rack, 'C2', flatten, morph + 0.2, 0.7, 0.024);
  playSub(ctx, rack, 'D2', morph, lands, 0.25, 0.032);
  playSub(ctx, rack, 'D1', lands, end, 0.02, 0.09);
  playSub(ctx, rack, 'D2', lands, end, 0.02, 0.045);

  playThump(ctx, rack, 'Bb1', gather, 0.1, 1.1);
  playThump(ctx, rack, 'C2', flatten, 0.16, 1.3);
  playThump(ctx, rack, 'D2', morph, 0.2, 0.9);
  playThump(ctx, rack, 'D1', lands, 1, 2.8);

  playBell(ctx, rack, 'Bb3', gather, 0.05, 3);
  playBell(ctx, rack, 'C4', flatten, 0.07, 3.4);
  playBell(ctx, rack, 'D4', morph, 0.08, 2);
  playBell(ctx, rack, 'D4', lands, 0.24, 5);
  playBell(ctx, rack, 'A4', lands, 0.13, 4.5);
  playBell(ctx, rack, 'D5', lands, 0.14, 4);

  cues.docks.forEach((dock, i) => {
    playBell(ctx, rack, DOCK_BELLS[i % DOCK_BELLS.length] as string, t(dock), 0.04 + i * 0.005, 2);
  });
  SHEEN_BELLS.forEach((note, i) => {
    playBell(ctx, rack, note, sheen + i * 0.17, 0.035 + i * 0.005, 2.2);
  });
  SETTLE_BELLS.forEach((note, i) => {
    playBell(ctx, rack, note, settled + i * 0.26, 0.08, 3.6);
  });

  playRiser(ctx, rack, sheen, lands);
  playGlide(ctx, rack, morph, lands);
  playWash(ctx, rack, lands, 3.2);
}

export function createIntroSound(cues: ScoreCues): IntroSound {
  // Nothing here reacts to input, so a larger buffer is free insurance against
  // dropouts while the intro's heavy compositing runs.
  const ctx = new AudioContext({ latencyHint: 'playback' });
  const fader = makeGain(ctx, 1);
  fader.connect(ctx.destination);
  const ready = Promise.race([
    ctx.resume().catch(() => {}),
    new Promise<void>((resolve) => setTimeout(resolve, 300)),
  ]);
  return {
    ready,
    start() {
      performScore(ctx, fader, cues, ctx.currentTime + 0.03);
    },
    fadeOut(seconds) {
      fader.gain.setTargetAtTime(0, ctx.currentTime, seconds / 5);
    },
    dispose() {
      void ctx.close();
    },
  };
}

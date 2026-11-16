export type ScoreCues = {
  glow: number;
  gather: number;
  flatten: number;
  sheen: number;
  morph: number;
  lands: number;
  exit: number;
};

type IntroSound = {
  ready: Promise<void>;
  start(): void;
  fadeOut(seconds: number): Promise<void>;
  dispose(): void;
};

const MASTER = 0.5;
const TAIL = 10;
const SAW_DETUNE = [-14, -7, 0, 7, 14];
const SAW_PAN = [-0.9, 0.45, 0, -0.45, 0.9];
const BELL_PARTIALS = [
  { ratio: 1, level: 1, decay: 1 },
  { ratio: 2, level: 0.55, decay: 0.7 },
  { ratio: 3.01, level: 0.3, decay: 0.45 },
  { ratio: 4.2, level: 0.16, decay: 0.3 },
  { ratio: 5.43, level: 0.08, decay: 0.18 },
];

const hz = (name: string) => {
  const [, letter = 'A', accidental, octave = '4'] = /^([A-G])(b|#)?(\d)$/.exec(name) ?? [];
  const pitchClass =
    'C D EF G A B'.indexOf(letter) + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  return 440 * 2 ** ((pitchClass + (Number(octave) + 1) * 12 - 69) / 12);
};

// Holds near full before thinning out; a plain exponential drops most of its level at once.
function makeFadeCurve(from: number) {
  const curve = new Float32Array(512);
  for (let i = 0; i < curve.length; i++) {
    const progress = i / (curve.length - 1);
    curve[i] = from * ((1 + Math.cos(Math.PI * progress)) / 2) ** 1.3;
  }
  return curve;
}

function chain(...nodes: AudioNode[]) {
  nodes.reduce((from, to) => from.connect(to));
}

function fan(from: AudioNode, ...targets: AudioNode[]) {
  for (const target of targets) from.connect(target);
}

function sweep(param: AudioParam, from: number, to: number, start: number, stop: number) {
  param.setValueAtTime(from, start);
  param.exponentialRampToValueAtTime(to, stop);
}

function makeGain(ctx: BaseAudioContext, value: number) {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

function makeFilter(ctx: BaseAudioContext, type: BiquadFilterType, frequency: number, Q?: number) {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  if (Q !== undefined) filter.Q.value = Q;
  return filter;
}

function makeDrive(ctx: BaseAudioContext, amount: number) {
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  const shaper = ctx.createWaveShaper();
  shaper.curve = curve;
  shaper.oversample = '2x';
  return shaper;
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
  const sweepLfo = makeLfo(ctx, 0.11, 620, start);
  const stages = [0, 1, 2, 3].map((stage) => {
    const allpass = makeFilter(ctx, 'allpass', 900 + stage * 260, 0.7);
    sweepLfo.connect(allpass.frequency);
    return allpass;
  });
  input.connect(output);
  chain(input, ...stages, output);
  return { input, output };
}

function makeChorus(ctx: BaseAudioContext, start: number) {
  const input = makeGain(ctx, 1);
  const output = makeGain(ctx, 0.8);
  const split = ctx.createChannelSplitter(2);
  const merge = ctx.createChannelMerger(2);
  fan(input, output, split);
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
  const merge = ctx.createChannelMerger(2);
  chain(input, left, right, makeFilter(ctx, 'lowpass', 4800), makeGain(ctx, 0.44), left);
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
  chain(limiter, makeGain(ctx, MASTER), output);

  const predelay = ctx.createDelay(0.2);
  predelay.delayTime.value = 0.03;
  const hall = ctx.createConvolver();
  hall.buffer = makeHall(ctx, 5.5);
  chain(predelay, hall, makeGain(ctx, 0.9), limiter);

  const echo = makePingPong(ctx, 0.36);
  const echoReturn = makeGain(ctx, 0.5);
  echo.output.connect(echoReturn);
  fan(echoReturn, limiter, predelay);

  const pad = makeGain(ctx, 1);
  const lowpasses = [0.7, 1.3].map((Q) => makeFilter(ctx, 'lowpass', 240, Q));
  const phaser = makePhaser(ctx, start);
  const chorus = makeChorus(ctx, start);
  chain(pad, makeDrive(ctx, 1.8), ...lowpasses, phaser.input);
  phaser.output.connect(chorus.input);
  chorus.output.connect(limiter);
  chain(chorus.output, makeGain(ctx, 0.4), predelay);

  const sparkle = makeGain(ctx, 1);
  fan(sparkle, limiter, echo.input);
  chain(sparkle, makeGain(ctx, 0.55), predelay);

  const low = makeDrive(ctx, 2.4);
  low.connect(limiter);

  return { ctx, limiter, pad, lowpasses, predelay, sparkle, low, noise: makeNoise(ctx) };
}

type Rack = ReturnType<typeof makeRack>;

function swell(
  ctx: BaseAudioContext,
  start: number,
  stop: number,
  attack: number,
  release: number,
  level: number,
) {
  const envelope = makeGain(ctx, 0);
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + attack);
  envelope.gain.setValueAtTime(level, stop - release);
  envelope.gain.linearRampToValueAtTime(0, stop);
  return envelope;
}

function strike(ctx: BaseAudioContext, time: number, attack: number, decay: number, level: number) {
  const envelope = makeGain(ctx, 0);
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(level, time + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);
  return envelope;
}

function tone(
  rack: Rack,
  frequency: number,
  start: number,
  stop: number,
  type: OscillatorType = 'sine',
) {
  const osc = rack.ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.start(start);
  osc.stop(stop);
  return osc;
}

function noise(rack: Rack, filter: AudioNode, envelope: AudioNode, start: number, stop: number) {
  const source = rack.ctx.createBufferSource();
  source.buffer = rack.noise;
  source.loop = true;
  chain(source, filter, envelope);
  fan(envelope, rack.limiter, rack.predelay);
  source.start(start);
  source.stop(stop);
}

function playChord(
  rack: Rack,
  notes: string,
  start: number,
  stop: number,
  attack: number,
  release: number,
  level: number,
  slide: number,
) {
  const voices = notes.split(' ');
  const peak = level / Math.sqrt(voices.length * SAW_DETUNE.length);
  const envelope = swell(rack.ctx, start, stop, attack, release, peak);
  envelope.connect(rack.pad);
  for (const note of voices) {
    SAW_DETUNE.forEach((cents, i) => {
      // Staggered starts avoid a phase-aligned click and spread the detune from the first cycle.
      const saw = tone(rack, hz(note), start + Math.random() * 0.018, stop, 'sawtooth');
      saw.detune.setValueAtTime(cents - slide, start);
      saw.detune.linearRampToValueAtTime(cents, start + Math.max(attack, 0.25));
      const pan = rack.ctx.createStereoPanner();
      pan.pan.value = SAW_PAN[i] ?? 0;
      chain(saw, pan, envelope);
    });
  }
}

function playSub(
  rack: Rack,
  note: string,
  start: number,
  stop: number,
  attack: number,
  level: number,
) {
  chain(
    tone(rack, hz(note), start, stop),
    swell(rack.ctx, start, stop, attack, 0.2, level),
    rack.low,
  );
}

function playThump(rack: Rack, note: string, time: number, level: number, decay: number) {
  const pitch = hz(note);
  const body = tone(rack, pitch * 3.2, time, time + decay);
  sweep(body.frequency, pitch * 3.2, pitch, time, time + 0.13);
  chain(body, strike(rack.ctx, time, 0.006, decay, level), rack.low);

  const click = makeGain(rack.ctx, 0);
  sweep(click.gain, level * 0.35, 0.0001, time, time + 0.09);
  noise(rack, makeFilter(rack.ctx, 'lowpass', 1600), click, time, time + 0.1);
}

function playBell(rack: Rack, note: string, time: number, level: number, decay: number) {
  const pan = rack.ctx.createStereoPanner();
  pan.pan.value = Math.random() * 1.2 - 0.6;
  pan.connect(rack.sparkle);
  for (const partial of BELL_PARTIALS) {
    const ring = decay * partial.decay;
    const envelope = strike(rack.ctx, time, 0.004, ring, level * partial.level);
    chain(tone(rack, hz(note) * partial.ratio, time, time + ring), envelope, pan);
  }
}

function playWind(rack: Rack, start: number, stop: number) {
  const band = makeFilter(rack.ctx, 'bandpass', 260, 0.8);
  sweep(band.frequency, 260, 1500, start, stop);
  const length = stop - start;
  noise(rack, band, swell(rack.ctx, start, stop, length * 0.7, length * 0.3, 0.09), start, stop);
}

function playRiser(rack: Rack, start: number, stop: number) {
  const band = makeFilter(rack.ctx, 'bandpass', 420, 2.4);
  sweep(band.frequency, 420, 10500, start, stop);
  const envelope = makeGain(rack.ctx, 0.0001);
  sweep(envelope.gain, 0.0001, 0.3, start, stop);
  envelope.gain.linearRampToValueAtTime(0, stop + 0.025);
  noise(rack, band, envelope, start, stop + 0.03);
}

function playGlide(rack: Rack, start: number, stop: number) {
  for (const [from, to] of [
    ['D3', 'D5'],
    ['A3', 'A5'],
  ] as const) {
    const saw = tone(rack, hz(from), start, stop, 'sawtooth');
    sweep(saw.frequency, hz(from), hz(to), start, stop);
    chain(saw, swell(rack.ctx, start, stop, stop - 0.05 - start, 0.05, 0.09), rack.pad);
  }
}

function playWash(rack: Rack, time: number, decay: number) {
  const high = makeFilter(rack.ctx, 'highpass', 4200);
  noise(rack, high, strike(rack.ctx, time, 0.006, decay, 0.22), time, time + decay);
}

function performScore(ctx: BaseAudioContext, output: AudioNode, cues: ScoreCues, origin: number) {
  const rack = makeRack(ctx, output, origin);
  const { glow, gather, flatten, sheen, morph, lands, exit } = Object.fromEntries(
    Object.entries(cues).map(([cue, ms]) => [cue, origin + ms / 1000]),
  ) as ScoreCues;
  const end = exit + TAIL;

  for (const { frequency: cutoff } of rack.lowpasses) {
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
    cutoff.exponentialRampToValueAtTime(1100, exit + 8.5);
  }

  // A held breath just before the hit: the contrast is what makes it feel huge.
  rack.pad.gain.setValueAtTime(1, lands - 0.2);
  rack.pad.gain.linearRampToValueAtTime(0.12, lands - 0.02);
  rack.pad.gain.setValueAtTime(1, lands);

  playWind(rack, glow, gather + 0.4);
  playChord(rack, 'D2 A2 D3', glow, gather + 1.4, 2.4, 1.4, 0.04, 0);
  playChord(rack, 'Bb2 F3 Bb3 D4 F4', gather, flatten + 0.7, 1.5, 0.7, 0.1, 34);
  playChord(rack, 'C3 G3 D4 E4 G4 C5', flatten, morph + 0.35, 0.9, 0.35, 0.17, 28);
  playChord(rack, 'D3 A3 D4 G4 A4 D5', morph, lands + 0.02, 0.3, 0.04, 0.25, 18);
  playChord(rack, 'D2 A2 D3 A3 D4 F#4 A4 D5 F#5 A5', lands, end, 0.012, 0.5, 1.6, 0);

  playSub(rack, 'Bb1', gather, flatten + 0.3, 1.2, 0.016);
  playSub(rack, 'C2', flatten, morph + 0.2, 0.7, 0.024);
  playSub(rack, 'D2', morph, lands, 0.25, 0.032);
  playSub(rack, 'D1', lands, end, 0.02, 0.09);
  playSub(rack, 'D2', lands, end, 0.02, 0.045);

  playThump(rack, 'Bb1', gather, 0.1, 1.1);
  playThump(rack, 'C2', flatten, 0.16, 1.3);
  playThump(rack, 'D2', morph, 0.2, 0.9);
  playThump(rack, 'D1', lands, 1, 2.8);

  playBell(rack, 'Bb3', gather, 0.05, 3);
  playBell(rack, 'C4', flatten, 0.07, 3.4);
  playBell(rack, 'D4', morph, 0.08, 2);
  playBell(rack, 'D4', lands, 0.24, 5);
  playBell(rack, 'A4', lands, 0.13, 4.5);
  playBell(rack, 'D5', lands, 0.14, 4);

  playRiser(rack, sheen, lands);
  playGlide(rack, morph, lands);
  playWash(rack, lands, 3.2);
}

const SILENT: IntroSound = {
  ready: Promise.resolve(),
  start() {},
  fadeOut: () => Promise.resolve(),
  dispose() {},
};

export function createIntroSound(cues: ScoreCues): IntroSound {
  let ctx: AudioContext;
  try {
    // Nothing reacts to input, so a larger buffer is free insurance against dropouts.
    ctx = new AudioContext({ latencyHint: 'playback' });
  } catch {
    return SILENT;
  }
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
      const now = ctx.currentTime;
      const from = fader.gain.value;
      fader.gain.cancelScheduledValues(now);
      fader.gain.setValueCurveAtTime(makeFadeCurve(from), now, seconds);
      return new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 100));
    },
    dispose() {
      void ctx.close();
    },
  };
}

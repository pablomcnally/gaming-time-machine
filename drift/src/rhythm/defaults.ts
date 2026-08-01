import type {
  DrumKit,
  DrumVoiceId,
  DrumVoiceParams,
  GenerativeRhythmState,
  MixerBusState,
  RhythmPattern,
  RhythmState,
  RhythmStep,
  RhythmTrack,
  StepDivision,
  TransportState,
} from './types';
import { drumVoices } from './types';

export const voiceNames: Record<DrumVoiceId, string> = {
  kick: 'BASS DRUM',
  snare: 'SNARE',
  lowTom: 'LOW TOM',
  midTom: 'MID TOM',
  highTom: 'HIGH TOM',
  rim: 'RIMSHOT',
  clap: 'CLAP',
  closedHat: 'CLOSED HAT',
  openHat: 'OPEN HAT',
  crash: 'CRASH',
  ride: 'RIDE',
};

const baseVoice: DrumVoiceParams = {
  tune: 0.5,
  decay: 0.42,
  tone: 0.58,
  attack: 0.35,
  body: 0.62,
  noise: 0.35,
  metallic: 0.5,
  spread: 0.35,
  pitchEnvelope: 0.52,
  drive: 0.12,
  level: 0.62,
  pan: 0,
  muted: false,
  solo: false,
  choke: true,
};

const voiceOverrides: Record<DrumVoiceId, Partial<DrumVoiceParams>> = {
  kick: { tune: 0.38, decay: 0.5, tone: 0.36, body: 0.82, attack: 0.42, noise: 0.05, level: 0.72 },
  snare: { tune: 0.54, decay: 0.34, tone: 0.62, body: 0.48, noise: 0.7, level: 0.61 },
  lowTom: { tune: 0.28, decay: 0.46, body: 0.74, pitchEnvelope: 0.58, pan: -0.32 },
  midTom: { tune: 0.5, decay: 0.4, body: 0.7, pitchEnvelope: 0.52, pan: 0 },
  highTom: { tune: 0.7, decay: 0.35, body: 0.64, pitchEnvelope: 0.46, pan: 0.32 },
  rim: { tune: 0.62, decay: 0.1, tone: 0.72, body: 0.25, noise: 0.08, level: 0.48 },
  clap: { tune: 0.5, decay: 0.32, tone: 0.68, spread: 0.62, noise: 0.92, level: 0.54 },
  closedHat: { tune: 0.58, decay: 0.12, tone: 0.68, metallic: 0.72, noise: 0.2, level: 0.45 },
  openHat: { tune: 0.57, decay: 0.52, tone: 0.66, metallic: 0.74, noise: 0.2, level: 0.42 },
  crash: { tune: 0.52, decay: 0.75, tone: 0.6, metallic: 0.8, spread: 0.7, level: 0.36, choke: false },
  ride: { tune: 0.62, decay: 0.62, tone: 0.72, metallic: 0.82, spread: 0.5, level: 0.38, choke: false },
};

export function makeVoiceParams(voice: DrumVoiceId): DrumVoiceParams {
  return { ...baseVoice, ...voiceOverrides[voice] };
}

export function makeStep(active = false): RhythmStep {
  return {
    active,
    accent: false,
    velocity: 0.78,
    probability: 1,
    microTiming: 0,
    ratchets: 1,
    flam: 0,
    protected: false,
    locks: {},
  };
}

export function makeTrack(voice: DrumVoiceId, division: StepDivision = '1/16'): RhythmTrack {
  return {
    voice,
    name: voiceNames[voice],
    length: 16,
    firstStep: 0,
    lastStep: 15,
    division,
    rotation: 0,
    locked: false,
    params: makeVoiceParams(voice),
    steps: Array.from({ length: 64 }, () => makeStep()),
  };
}

export function makeEmptyPattern(id = 'pattern-a01', name = 'Pattern A01'): RhythmPattern {
  return {
    id,
    name,
    length: 16,
    swing: 0,
    tempoOverride: null,
    favourite: false,
    style: 'straight-machine',
    seed: `RHY-${id.toUpperCase()}`,
    tracks: drumVoices.map((voice) => makeTrack(voice)),
  };
}

export const defaultDrumEffects = {
  saturation: 0.14,
  compression: 0.32,
  transient: 0.58,
  tone: 0.56,
  bitReduction: 0,
  sampleRateReduction: 0,
  room: 0.12,
  delay: 0.08,
  parallelDrive: 0.1,
  width: 0.66,
};

export function makeDefaultKit(): DrumKit {
  return {
    id: 'kit-classic-circuit',
    name: 'Classic Circuit',
    factory: true,
    voices: Object.fromEntries(drumVoices.map((voice) => [voice, makeVoiceParams(voice)])) as Record<
      DrumVoiceId,
      DrumVoiceParams
    >,
    effects: { ...defaultDrumEffects },
  };
}

export const defaultGenerative: GenerativeRhythmState = {
  style: 'straight-machine',
  density: 0.48,
  complexity: 0.34,
  variation: 0.28,
  syncopation: 0.22,
  humanisation: 0.08,
  mutation: 0.18,
  fillFrequency: 0.16,
  accentStrength: 0.64,
  swing: 0,
  stability: 0.78,
  evolving: false,
  frozen: false,
  boundaryBars: 4,
  seed: 'RHYTHM-ORBIT-01',
};

export const defaultBus: MixerBusState = {
  volume: 0.72,
  pan: 0,
  mute: false,
  solo: false,
  width: 0.72,
  low: 0.5,
  high: 0.5,
  reverbSend: 0.1,
  delaySend: 0.08,
};

export const defaultTransport: TransportState = {
  playing: false,
  bpm: 118,
  swing: 0,
  numerator: 4,
  denominator: 4,
  positionPulses: 0,
  droneMode: 'free',
};

export function makeDefaultRhythmState(pattern?: RhythmPattern): RhythmState {
  const first = pattern ?? makeEmptyPattern();
  const patterns = Array.from({ length: 16 }, (_, index) =>
    index === 0
      ? structuredClone(first)
      : makeEmptyPattern(`pattern-a${String(index + 1).padStart(2, '0')}`, `Pattern A${String(index + 1).padStart(2, '0')}`),
  );
  return {
    kit: makeDefaultKit(),
    banks: [{ id: 'bank-a', name: 'BANK A', patterns }],
    activeBank: 0,
    activePattern: 0,
    queuedPattern: null,
    switchMode: 'pattern',
    chain: [0],
    chainPosition: 0,
    selectedVoice: 'kick',
    selectedPage: 0,
    generative: { ...defaultGenerative },
    effects: { ...defaultDrumEffects },
    bus: { ...defaultBus },
    sidechain: {
      enabled: false,
      trigger: 'kick',
      amount: 0.24,
      attack: 0.01,
      release: 0.28,
      filter: 0.4,
      mode: 'gentle',
    },
    interactions: [
      {
        id: 'kick-to-drone-filter',
        enabled: false,
        source: 'kick',
        destination: 'drone-filter',
        amount: 0.18,
        smoothing: 0.22,
        polarity: 1,
        minimum: 0,
        maximum: 1,
      },
    ],
    mutationHistory: [],
  };
}

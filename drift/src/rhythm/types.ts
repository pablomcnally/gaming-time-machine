export const RHYTHM_NAME = 'RHYTHM';

export const drumVoices = [
  'kick',
  'snare',
  'lowTom',
  'midTom',
  'highTom',
  'rim',
  'clap',
  'closedHat',
  'openHat',
  'crash',
  'ride',
] as const;

export type DrumVoiceId = (typeof drumVoices)[number];
export type StepDivision = '1/4' | '1/8' | '1/16' | '1/32' | '1/8T' | '1/16T';
export type RhythmStyle =
  | 'straight-machine'
  | 'electro'
  | 'industrial'
  | 'dub-techno'
  | 'ambient-pulse'
  | 'broken-beat'
  | 'minimal'
  | 'acid-rhythm'
  | 'slow-ritual'
  | 'abstract'
  | 'sparse'
  | 'chaotic';

export interface DrumVoiceParams {
  tune: number;
  decay: number;
  tone: number;
  attack: number;
  body: number;
  noise: number;
  metallic: number;
  spread: number;
  pitchEnvelope: number;
  drive: number;
  level: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  choke: boolean;
}

export interface RhythmStep {
  active: boolean;
  accent: boolean;
  velocity: number;
  probability: number;
  microTiming: number;
  ratchets: number;
  flam: number;
  protected: boolean;
  locks: Partial<DrumVoiceParams>;
}

export interface RhythmTrack {
  voice: DrumVoiceId;
  name: string;
  length: number;
  firstStep: number;
  lastStep: number;
  division: StepDivision;
  rotation: number;
  locked: boolean;
  params: DrumVoiceParams;
  steps: RhythmStep[];
}

export interface RhythmPattern {
  id: string;
  name: string;
  length: number;
  swing: number;
  tempoOverride: number | null;
  favourite: boolean;
  style: RhythmStyle;
  seed: string;
  tracks: RhythmTrack[];
}

export interface RhythmBank {
  id: string;
  name: string;
  patterns: RhythmPattern[];
}

export interface DrumKit {
  id: string;
  name: string;
  factory: boolean;
  voices: Record<DrumVoiceId, DrumVoiceParams>;
  effects: DrumEffectsState;
}

export interface DrumEffectsState {
  saturation: number;
  compression: number;
  transient: number;
  tone: number;
  bitReduction: number;
  sampleRateReduction: number;
  room: number;
  delay: number;
  parallelDrive: number;
  width: number;
}

export interface GenerativeRhythmState {
  style: RhythmStyle;
  density: number;
  complexity: number;
  variation: number;
  syncopation: number;
  humanisation: number;
  mutation: number;
  fillFrequency: number;
  accentStrength: number;
  swing: number;
  stability: number;
  evolving: boolean;
  frozen: boolean;
  boundaryBars: 1 | 2 | 4 | 8;
  seed: string;
}

export interface MixerBusState {
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  width: number;
  low: number;
  high: number;
  reverbSend: number;
  delaySend: number;
}

export type InteractionSource = 'kick' | 'snare' | 'hats' | 'drum-bus' | 'drone-level' | 'drone-evolution';
export type InteractionDestination =
  | 'drone-filter'
  | 'drone-duck'
  | 'drone-texture'
  | 'drone-motion'
  | 'rhythm-density'
  | 'rhythm-mutation';

export interface InteractionRoute {
  id: string;
  enabled: boolean;
  source: InteractionSource;
  destination: InteractionDestination;
  amount: number;
  smoothing: number;
  polarity: 1 | -1;
  minimum: number;
  maximum: number;
}

export interface SidechainState {
  enabled: boolean;
  trigger: DrumVoiceId | 'drum-bus';
  amount: number;
  attack: number;
  release: number;
  filter: number;
  mode: 'gentle' | 'pump';
}

export interface TransportState {
  playing: boolean;
  bpm: number;
  swing: number;
  numerator: number;
  denominator: number;
  positionPulses: number;
  droneMode: 'free' | 'transport' | 'tempo-sync';
}

export interface RhythmState {
  kit: DrumKit;
  banks: RhythmBank[];
  activeBank: number;
  activePattern: number;
  queuedPattern: number | null;
  switchMode: 'immediate' | 'beat' | 'bar' | 'pattern';
  chain: number[];
  chainPosition: number;
  selectedVoice: DrumVoiceId;
  selectedPage: number;
  generative: GenerativeRhythmState;
  effects: DrumEffectsState;
  bus: MixerBusState;
  sidechain: SidechainState;
  interactions: InteractionRoute[];
  mutationHistory: RhythmPattern[];
}

export interface WorkstationSession {
  format: 'drift-session';
  version: 2;
  name: string;
  dronePresetId: string;
  dronePreset: import('../types').DriftPreset;
  rhythm: RhythmState;
  transport: TransportState;
  droneBus: MixerBusState;
  masterVolume: number;
  activePage: 'drift' | 'rhythm' | 'mixer';
}

export interface TransportPulse {
  time: number;
  pulse: number;
  bar: number;
  beat: number;
  pulseInBeat: number;
}

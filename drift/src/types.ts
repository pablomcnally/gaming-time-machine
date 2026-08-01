export type Waveform = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'noise';
export type FilterKind = 'lowpass' | 'highpass' | 'bandpass' | 'notch';
export type TuningMode =
  | 'free'
  | 'chromatic'
  | 'minor'
  | 'major'
  | 'dorian'
  | 'phrygian'
  | 'whole-tone'
  | 'fifths'
  | 'harmonic'
  | 'just'
  | 'inharmonic'
  | 'microtonal';

export interface VoiceState {
  name: string;
  waveform: Waveform;
  coarse: number;
  fine: number;
  detune: number;
  unison: number;
  volume: number;
  pan: number;
  cutoff: number;
  resonance: number;
  filterType: FilterKind;
  modulation: number;
  sub: number;
  fifth: number;
  octave: number;
  muted: boolean;
  solo: boolean;
  locked: boolean;
}

export interface MacroState {
  autoMorphEnabled: boolean;
  autoMorphDepth: number;
  evolution: number;
  stability: number;
  mutation: number;
  speed: number;
  range: number;
  density: number;
  tension: number;
  warmth: number;
  motion: number;
  space: number;
  distortion: number;
  master: number;
}

export interface EffectsState {
  chorus: number;
  phaser: number;
  flanger: number;
  delay: number;
  delayTime: number;
  delayFeedback: number;
  reverb: number;
  reverbDecay: number;
  saturation: number;
  bitReduction: number;
  wobble: number;
  width: number;
  highpass: number;
  lowpass: number;
}

export interface TuningState {
  root: number;
  octaveRange: number;
  mode: TuningMode;
  temperament: 'equal' | 'just';
  glide: number;
  customRatios: number[];
}

export interface AtmosphereState {
  enabled: boolean;
  droneMix: number;
  fieldMix: number;
  rain: number;
  thunder: number;
  sonar: number;
  chatter: number;
  transmission: number;
  activity: number;
  echo: number;
  distance: number;
  randomness: number;
  speechRate: number;
  speechGlitch: number;
}

export type PulsePattern = 'breath' | 'heartbeat' | 'beacon' | 'drift';

export interface PulseState {
  enabled: boolean;
  pattern: PulsePattern;
  tempo: number;
  depth: number;
  tone: number;
  decay: number;
  irregularity: number;
}

export interface BinauralState {
  enabled: boolean;
  carrier: number;
  beat: number;
  level: number;
  drift: number;
}

export type AmbientCharacter = 'aurora' | 'glass' | 'choir' | 'stars';

export interface AmbientLayerState {
  enabled: boolean;
  character: AmbientCharacter;
  level: number;
  activity: number;
  brightness: number;
  decay: number;
  spread: number;
  density: number;
}

export interface JourneyState {
  sceneIds: string[];
  travelSeconds: number;
  loop: boolean;
}

export type ImportedSoundMode = 'event' | 'loop';

export interface ImportedSoundState {
  id: string;
  name: string;
  fileName: string;
  size: number;
  enabled: boolean;
  mode: ImportedSoundMode;
  level: number;
  rate: number;
  automatic: boolean;
  weight: number;
}

export type ChordWaveform = 'sawtooth' | 'square' | 'triangle';
export type ChordQuality =
  'minor' | 'major' | 'minor7' | 'major7' | 'minor9' | 'add9' | 'sus2' | 'sus4' | 'power';

export interface ChordStep {
  offset: number;
  quality: ChordQuality;
  inversion: number;
  enabled: boolean;
}

export interface ChordState {
  enabled: boolean;
  running: boolean;
  key: number;
  octave: number;
  waveform: ChordWaveform;
  tempo: number;
  stepBeats: 1 | 2 | 4 | 8;
  swing: number;
  gate: number;
  level: number;
  detune: number;
  spread: number;
  cutoff: number;
  resonance: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  drive: number;
  steps: ChordStep[];
}

export type SaxPhraseStyle = 'lonely' | 'noir' | 'yearning';

export interface SaxState {
  enabled: boolean;
  automatic: boolean;
  style: SaxPhraseStyle;
  level: number;
  tone: number;
  breath: number;
  vibrato: number;
  glide: number;
  expression: number;
  activity: number;
  octave: number;
}

export type ModSourceKind =
  | 'lfo'
  | 'random-walk'
  | 'sample-hold'
  | 'smooth-random'
  | 'coherent-noise'
  | 'long-envelope'
  | 'probability';

export interface ModulationRoute {
  id: string;
  source: ModSourceKind;
  destination:
    'pitch' | 'detune' | 'cutoff' | 'resonance' | 'amplitude' | 'pan' | 'harmonics' | 'space';
  rate: number;
  depth: number;
  enabled: boolean;
}

export interface DriftPreset {
  id: string;
  name: string;
  factory: boolean;
  favourite: boolean;
  seed: string;
  macros: MacroState;
  voices: VoiceState[];
  effects: EffectsState;
  atmosphere: AtmosphereState;
  pulse: PulseState;
  binaural: BinauralState;
  ambientLayer: AmbientLayerState;
  chord: ChordState;
  sax: SaxState;
  tuning: TuningState;
  modulation: ModulationRoute[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  sampleRate: 44100 | 48000 | 96000;
  latencyHint: 'interactive' | 'balanced' | 'playback';
  defaultMaster: number;
  startMuted: boolean;
  restoreSession: boolean;
  closeBehavior: 'quit' | 'tray';
  visualizerQuality: 'low' | 'medium' | 'high';
  maximumCpu: boolean;
  presetLocation: string;
  recordingLocation: string;
  outputDeviceId: string;
}

export interface PersistedState {
  version: 1;
  settings: AppSettings;
  userPresets: DriftPreset[];
  favourites: string[];
  lastPresetId: string;
  lastPreset?: DriftPreset;
  journey?: JourneyState;
  importedSounds?: ImportedSoundState[];
}

export interface EvolutionFrame {
  voice: Array<{
    pitch: number;
    detune: number;
    cutoff: number;
    resonance: number;
    amplitude: number;
    pan: number;
    harmonics: number;
  }>;
  space: number;
  phase: number;
}

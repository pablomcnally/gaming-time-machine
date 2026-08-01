import type {
  AmbientLayerState,
  AtmosphereState,
  BinauralState,
  ChordState,
  ChordStep,
  DriftPreset,
  EffectsState,
  MacroState,
  ModulationRoute,
  PulseState,
  SaxState,
  TuningState,
  VoiceState,
} from '../types';
import { clamp, lerp } from './math';

function blendRecord<T extends object>(from: T, to: T, amount: number): T {
  const progress = clamp(amount, 0, 1);
  const result = { ...from } as Record<string, unknown>;
  for (const key of Object.keys(from) as Array<keyof T>) {
    const left = from[key];
    const right = to[key];
    result[String(key)] =
      typeof left === 'number' && typeof right === 'number'
        ? lerp(left, right, progress)
        : progress < 0.5
          ? left
          : right;
  }
  return result as T;
}

export function smoothJourneyProgress(progress: number): number {
  const value = clamp(progress, 0, 1);
  return value * value * (3 - 2 * value);
}

export function interpolatePreset(from: DriftPreset, to: DriftPreset, amount: number): DriftPreset {
  const progress = clamp(amount, 0, 1);
  if (progress <= 0) return structuredClone(from);
  if (progress >= 1) return structuredClone(to);
  const metadata = progress < 0.5 ? from : to;

  return {
    ...structuredClone(metadata),
    macros: blendRecord<MacroState>(from.macros, to.macros, progress),
    effects: blendRecord<EffectsState>(from.effects, to.effects, progress),
    atmosphere: blendRecord<AtmosphereState>(from.atmosphere, to.atmosphere, progress),
    pulse: blendRecord<PulseState>(from.pulse, to.pulse, progress),
    binaural: blendRecord<BinauralState>(from.binaural, to.binaural, progress),
    ambientLayer: blendRecord<AmbientLayerState>(from.ambientLayer, to.ambientLayer, progress),
    chord: {
      ...blendRecord<ChordState>(from.chord, to.chord, progress),
      steps: from.chord.steps.map((step, index) =>
        blendRecord<ChordStep>(step, to.chord.steps[index] ?? step, progress),
      ),
    },
    sax: blendRecord<SaxState>(from.sax, to.sax, progress),
    tuning: {
      ...blendRecord<TuningState>(from.tuning, to.tuning, progress),
      customRatios:
        progress < 0.5
          ? structuredClone(from.tuning.customRatios)
          : structuredClone(to.tuning.customRatios),
    },
    voices: from.voices.map((voice, index) =>
      blendRecord<VoiceState>(voice, to.voices[index] ?? voice, progress),
    ),
    modulation: from.modulation.map((route, index) =>
      blendRecord<ModulationRoute>(route, to.modulation[index] ?? route, progress),
    ),
    updatedAt: new Date().toISOString(),
  };
}

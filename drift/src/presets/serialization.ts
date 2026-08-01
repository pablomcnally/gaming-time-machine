import type { DriftPreset } from '../types';

export interface PresetEnvelope {
  format: 'drift-preset';
  version: 1;
  preset: DriftPreset;
}

function isPreset(value: unknown): value is DriftPreset {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DriftPreset>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.seed === 'string' &&
    Array.isArray(candidate.voices) &&
    candidate.voices.length === 4 &&
    candidate.voices.every(
      (voice) =>
        typeof voice?.volume === 'number' &&
        Number.isFinite(voice.volume) &&
        typeof voice?.cutoff === 'number' &&
        Number.isFinite(voice.cutoff),
    ) &&
    Boolean(candidate.macros) &&
    Boolean(candidate.effects) &&
    Boolean(candidate.tuning) &&
    Array.isArray(candidate.modulation)
  );
}

export function serializePreset(preset: DriftPreset): string {
  const envelope: PresetEnvelope = {
    format: 'drift-preset',
    version: 1,
    preset: structuredClone(preset),
  };
  return JSON.stringify(envelope, null, 2);
}

export function deserializePreset(input: string | unknown): DriftPreset {
  const value = typeof input === 'string' ? (JSON.parse(input) as unknown) : input;
  const possibleEnvelope = value as Partial<PresetEnvelope>;
  const candidate =
    possibleEnvelope?.format === 'drift-preset' && possibleEnvelope.version === 1
      ? possibleEnvelope.preset
      : value;
  if (!isPreset(candidate)) throw new Error('The file is not a valid DRIFT preset.');
  return structuredClone(candidate);
}

import { clamp } from '../audio/math';
import type { DriftPreset, PersistedState, PersistedStateV1 } from '../types';
import { defaultBus, defaultGenerative, defaultTransport, makeDefaultRhythmState, makeStep, makeVoiceParams } from './defaults';
import type { DrumKit, RhythmPattern, RhythmState, WorkstationSession } from './types';
import { drumVoices } from './types';

type EnvelopeFormat = 'drift-kit' | 'drift-pattern' | 'drift-rhythm-preset' | 'drift-session';

interface Envelope<T> {
  format: EnvelopeFormat;
  version: 1 | 2;
  data: T;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new Error('The file does not contain valid DRIFT data.');
  return value as Record<string, unknown>;
}

export function normalisePattern(value: unknown): RhythmPattern {
  const candidate = object(value) as unknown as Partial<RhythmPattern>;
  if (typeof candidate.id !== 'string' || !Array.isArray(candidate.tracks))
    throw new Error('The file is not a valid RHYTHM pattern.');
  const fallback = makeDefaultRhythmState().banks[0]!.patterns[0]!;
  const tracks = drumVoices.map((voice) => {
    const source = candidate.tracks!.find((track) => track?.voice === voice);
    const base = fallback.tracks.find((track) => track.voice === voice)!;
    const length = clamp(Math.round(Number(source?.length ?? candidate.length ?? 16)), 1, 64);
    return {
      ...structuredClone(base),
      ...source,
      voice,
      name: String(source?.name ?? base.name).slice(0, 32),
      length,
      firstStep: clamp(Math.round(Number(source?.firstStep ?? 0)), 0, length - 1),
      lastStep: clamp(Math.round(Number(source?.lastStep ?? length - 1)), 0, length - 1),
      rotation: clamp(Math.round(Number(source?.rotation ?? 0)), -63, 63),
      params: { ...makeVoiceParams(voice), ...(source?.params ?? {}) },
      steps: Array.from({ length: 64 }, (_, index) => {
        const step = source?.steps?.[index];
        return {
          ...makeStep(),
          ...(step ?? {}),
          velocity: clamp(Number(step?.velocity ?? 0.78), 0, 1),
          probability: clamp(Number(step?.probability ?? 1), 0, 1),
          microTiming: clamp(Number(step?.microTiming ?? 0), -24, 24),
          ratchets: clamp(Math.round(Number(step?.ratchets ?? 1)), 1, 4),
          flam: clamp(Number(step?.flam ?? 0), 0, 1),
          locks: step?.locks && typeof step.locks === 'object' ? { ...step.locks } : {},
        };
      }),
    };
  });
  const length = clamp(Math.round(Number(candidate.length ?? 16)), 1, 64);
  return {
    ...structuredClone(fallback),
    ...candidate,
    id: candidate.id,
    name: String(candidate.name ?? 'Untitled Pattern').slice(0, 64),
    length,
    swing: clamp(Number(candidate.swing ?? 0), 0, 0.75),
    tempoOverride:
      candidate.tempoOverride === null || candidate.tempoOverride === undefined
        ? null
        : clamp(Number(candidate.tempoOverride), 30, 300),
    seed: String(candidate.seed ?? `RHY-${candidate.id}`).slice(0, 96),
    tracks,
  };
}

export function normaliseKit(value: unknown): DrumKit {
  const candidate = object(value) as unknown as Partial<DrumKit>;
  if (typeof candidate.id !== 'string' || !candidate.voices) throw new Error('The file is not a valid DRIFT drum kit.');
  const voices = {} as DrumKit['voices'];
  for (const voice of drumVoices) voices[voice] = { ...makeVoiceParams(voice), ...(candidate.voices[voice] ?? {}) };
  return {
    id: candidate.id,
    name: String(candidate.name ?? 'Untitled Kit').slice(0, 64),
    factory: Boolean(candidate.factory),
    voices,
    effects: { ...makeDefaultRhythmState().effects, ...(candidate.effects ?? {}) },
  };
}

export function normaliseRhythmState(value: unknown): RhythmState {
  const fallback = makeDefaultRhythmState();
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<RhythmState>;
  const banks = Array.isArray(candidate.banks)
    ? candidate.banks.slice(0, 8).map((bank, bankIndex) => ({
        id: String(bank?.id ?? `bank-${bankIndex + 1}`),
        name: String(bank?.name ?? `BANK ${bankIndex + 1}`).slice(0, 32),
        patterns: Array.from({ length: 16 }, (_, index) =>
          normalisePattern(bank?.patterns?.[index] ?? fallback.banks[0]!.patterns[index]!),
        ),
      }))
    : fallback.banks;
  return {
    ...fallback,
    ...candidate,
    kit: normaliseKit(candidate.kit ?? fallback.kit),
    banks: banks.length ? banks : fallback.banks,
    activeBank: clamp(Math.round(Number(candidate.activeBank ?? 0)), 0, Math.max(0, banks.length - 1)),
    activePattern: clamp(Math.round(Number(candidate.activePattern ?? 0)), 0, 15),
    selectedPage: clamp(Math.round(Number(candidate.selectedPage ?? 0)), 0, 3),
    generative: { ...defaultGenerative, ...(candidate.generative ?? {}) },
    effects: { ...fallback.effects, ...(candidate.effects ?? {}) },
    bus: { ...defaultBus, ...(candidate.bus ?? {}) },
    sidechain: {
      ...fallback.sidechain,
      ...(candidate.sidechain ?? {}),
      amount: clamp(Number(candidate.sidechain?.amount ?? fallback.sidechain.amount), 0, 1),
      attack: clamp(Number(candidate.sidechain?.attack ?? fallback.sidechain.attack), 0.002, 1),
      release: clamp(Number(candidate.sidechain?.release ?? fallback.sidechain.release), 0.03, 2.5),
      filter: clamp(Number(candidate.sidechain?.filter ?? fallback.sidechain.filter), 0, 1),
    },
    interactions: Array.isArray(candidate.interactions)
      ? candidate.interactions.slice(0, 16).map((route) => ({
          ...route,
          amount: clamp(Number(route.amount), 0, 1),
          smoothing: clamp(Number(route.smoothing), 0.02, 2),
          minimum: clamp(Number(route.minimum), 0, 1),
          maximum: clamp(Number(route.maximum), 0, 1),
        }))
      : fallback.interactions,
    mutationHistory: Array.isArray(candidate.mutationHistory)
      ? candidate.mutationHistory.slice(-16).map(normalisePattern)
      : [],
  };
}

export function serializeRhythmData<T>(format: EnvelopeFormat, data: T): string {
  return JSON.stringify({ format, version: format === 'drift-session' ? 2 : 1, data } satisfies Envelope<T>, null, 2);
}

export function deserializeRhythmData<T>(input: string | unknown, format: EnvelopeFormat): T {
  const value = typeof input === 'string' ? JSON.parse(input) : input;
  const envelope = object(value) as unknown as Envelope<unknown>;
  if (envelope.format !== format || (envelope.version !== 1 && envelope.version !== 2))
    throw new Error(`The file is not a valid ${format}.`);
  return structuredClone(envelope.data) as T;
}

export function migratePersistedState(
  value: unknown,
  defaults: PersistedState,
): PersistedState {
  if (!value || typeof value !== 'object') return structuredClone(defaults);
  const candidate = value as { version?: number } &
    Partial<Omit<PersistedState, 'version'>> &
    Partial<Omit<PersistedStateV1, 'version'>>;
  if (candidate.version !== 1 && candidate.version !== 2) return structuredClone(defaults);
  return {
    ...structuredClone(defaults),
    ...candidate,
    version: 2,
    rhythm: normaliseRhythmState(candidate.rhythm ?? defaults.rhythm),
    transport: { ...defaultTransport, ...(candidate.transport ?? {}) },
    droneBus: { ...defaultBus, volume: 0.78, ...(candidate.droneBus ?? {}) },
    activePage: candidate.activePage === 'rhythm' || candidate.activePage === 'mixer' ? candidate.activePage : 'drift',
  };
}

export function makeSession(
  name: string,
  dronePreset: DriftPreset,
  rhythm: RhythmState,
  transport: import('./types').TransportState,
  droneBus = { ...defaultBus, volume: 0.78 },
): WorkstationSession {
  return {
    format: 'drift-session',
    version: 2,
    name: name.slice(0, 64),
    dronePresetId: dronePreset.id,
    dronePreset: structuredClone(dronePreset),
    rhythm: structuredClone(rhythm),
    transport: { ...transport },
    droneBus: { ...droneBus },
    masterVolume: dronePreset.macros.master,
    activePage: 'drift',
  };
}

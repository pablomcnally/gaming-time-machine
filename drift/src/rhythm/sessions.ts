import { factoryPresets } from '../presets/factory';
import { defaultBus, defaultTransport, makeDefaultRhythmState } from './defaults';
import { factoryKits, factoryPatterns, factorySessionSummaries } from './factory';
import type { WorkstationSession } from './types';

export const factorySessions: WorkstationSession[] = factorySessionSummaries.map((summary, index) => {
  const rhythm = makeDefaultRhythmState(factoryPatterns[index]!);
  rhythm.kit = structuredClone(factoryKits[index % factoryKits.length]!);
  rhythm.banks[0]!.patterns = Array.from({ length: 16 }, (_, slot) =>
    structuredClone(factoryPatterns[slot]!),
  );
  rhythm.banks.push({
    id: 'bank-b',
    name: 'BANK B',
    patterns: Array.from({ length: 16 }, (_, slot) =>
      structuredClone(factoryPatterns[slot + 16] ?? factoryPatterns[slot]!),
    ),
  });
  rhythm.activeBank = index >= 8 ? 1 : 0;
  rhythm.activePattern = index % 8;
  rhythm.generative.seed = `SESSION-${String(index + 1).padStart(2, '0')}`;
  const pattern = rhythm.banks[rhythm.activeBank]!.patterns[rhythm.activePattern]!;
  for (const track of pattern.tracks) track.params = structuredClone(rhythm.kit.voices[track.voice]);
  const dronePreset = structuredClone(
    factoryPresets.find((preset) => preset.id === summary.dronePresetId) ?? factoryPresets[index % factoryPresets.length]!,
  );
  return {
    format: 'drift-session',
    version: 2,
    name: summary.name,
    dronePresetId: dronePreset.id,
    dronePreset,
    rhythm,
    transport: { ...defaultTransport, bpm: 72 + index * 7, swing: index % 3 === 0 ? 0.14 : 0 },
    droneBus: { ...defaultBus, volume: 0.74 },
    masterVolume: 0.34,
    activePage: 'rhythm',
  };
});


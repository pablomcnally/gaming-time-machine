import { describe, expect, it } from 'vitest';
import { defaultGenerative, makeDefaultKit, makeDefaultRhythmState, makeEmptyPattern } from './defaults';
import { generatePattern, mutatePattern, rotateTrack } from './generator';
import { deserializeRhythmData, migratePersistedState, normalisePattern, serializeRhythmData } from './serialization';
import { factoryKits, factoryPatterns, factorySessionSummaries } from './factory';
import { makeDefaultState } from '../presets/defaults';

describe('RHYTHM persistence and factory content', () => {
  it('round-trips patterns and kits independently', () => {
    const pattern = factoryPatterns[3]!;
    const kit = factoryKits[4]!;
    expect(deserializeRhythmData(serializeRhythmData('drift-pattern', pattern), 'drift-pattern')).toEqual(JSON.parse(JSON.stringify(pattern)));
    expect(deserializeRhythmData(serializeRhythmData('drift-kit', kit), 'drift-kit')).toEqual(JSON.parse(JSON.stringify(kit)));
  });

  it('ships the requested original factory library', () => {
    expect(factoryKits).toHaveLength(12);
    expect(factoryPatterns).toHaveLength(24);
    expect(factorySessionSummaries).toHaveLength(10);
    expect(new Set(factoryKits.map((kit) => kit.name)).size).toBe(12);
    expect(new Set(factoryPatterns.map((pattern) => pattern.name)).size).toBe(24);
  });

  it('migrates a version-one DRIFT state without losing its drone preset', () => {
    const defaults = makeDefaultState();
    const legacy = {
      version: 1,
      settings: defaults.settings,
      userPresets: defaults.userPresets,
      favourites: ['factory-deep-space'],
      lastPresetId: 'factory-deep-space',
      lastPreset: defaults.lastPreset,
    };
    const migrated = migratePersistedState(legacy, defaults);
    expect(migrated.version).toBe(2);
    expect(migrated.lastPresetId).toBe(legacy.lastPresetId);
    expect(migrated.favourites).toEqual(legacy.favourites);
    expect(migrated.rhythm?.banks[0]?.patterns).toHaveLength(16);
  });
});

describe('RHYTHM generation', () => {
  it('regenerates exactly from the same seed', () => {
    const source = makeEmptyPattern();
    const settings = { ...defaultGenerative, style: 'broken-beat' as const, seed: 'TEST-SEED' };
    expect(generatePattern(source, settings)).toEqual(generatePattern(source, settings));
  });

  it('keeps every step and track inside safe bounds', () => {
    const generated = generatePattern(makeEmptyPattern(), { ...defaultGenerative, style: 'chaotic', density: 1, complexity: 1 }, 'BOUNDS');
    const mutated = mutatePattern(generated, { ...defaultGenerative, mutation: 1, stability: 0 }, 'MUTATION');
    for (const track of mutated.tracks) {
      expect(track.steps).toHaveLength(64);
      expect(track.length).toBeGreaterThanOrEqual(1);
      expect(track.length).toBeLessThanOrEqual(64);
      for (const step of track.steps) {
        expect(step.velocity).toBeGreaterThanOrEqual(0);
        expect(step.velocity).toBeLessThanOrEqual(1);
        expect(step.probability).toBeGreaterThanOrEqual(0);
        expect(step.probability).toBeLessThanOrEqual(1);
        expect(step.microTiming).toBeGreaterThanOrEqual(-24);
        expect(step.microTiming).toBeLessThanOrEqual(24);
        expect(step.ratchets).toBeGreaterThanOrEqual(1);
        expect(step.ratchets).toBeLessThanOrEqual(4);
      }
    }
  });

  it('preserves locked tracks and protected steps during mutation', () => {
    const source = makeEmptyPattern();
    source.tracks[0]!.locked = true;
    source.tracks[0]!.steps[0]!.active = true;
    source.tracks[1]!.steps[5]!.active = true;
    source.tracks[1]!.steps[5]!.protected = true;
    const mutated = mutatePattern(source, { ...defaultGenerative, mutation: 1, stability: 0, density: 1 }, 'LOCKS');
    expect(mutated.tracks[0]).toEqual(source.tracks[0]);
    expect(mutated.tracks[1]!.steps[5]).toEqual(source.tracks[1]!.steps[5]);
  });

  it('rotates only the active track region', () => {
    const track = makeEmptyPattern().tracks[0]!;
    track.firstStep = 2;
    track.lastStep = 5;
    track.steps[2]!.active = true;
    const rotated = rotateTrack(track, 1);
    expect(rotated.steps[3]!.active).toBe(true);
    expect(rotated.steps[0]).toEqual(track.steps[0]);
  });

  it('normalises corrupt numeric values and restores all eleven voices', () => {
    const pattern = makeEmptyPattern();
    pattern.length = 999;
    pattern.tracks[0]!.steps[0]!.velocity = Number.NaN;
    pattern.tracks[0]!.steps[0]!.probability = 8;
    const normal = normalisePattern(pattern);
    expect(normal.length).toBe(64);
    expect(normal.tracks).toHaveLength(11);
    expect(normal.tracks[0]!.steps[0]!.velocity).toBe(0);
    expect(normal.tracks[0]!.steps[0]!.probability).toBe(1);
  });

  it('creates a complete default kit and rhythm state', () => {
    expect(Object.keys(makeDefaultKit().voices)).toHaveLength(11);
    expect(makeDefaultRhythmState().banks[0]!.patterns).toHaveLength(16);
  });
});

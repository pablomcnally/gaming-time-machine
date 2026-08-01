import { describe, expect, it } from 'vitest';
import { factoryPresets } from '../presets/factory';
import { EvolutionEngine } from './evolution';

describe('EvolutionEngine', () => {
  it('is deterministic for a seed and input state', () => {
    const preset = structuredClone(factoryPresets[3]!);
    const first = new EvolutionEngine('DR-EVOLUTION-CHECK');
    const second = new EvolutionEngine('DR-EVOLUTION-CHECK');
    for (let index = 0; index < 500; index += 1) {
      expect(first.update(0.09, preset)).toEqual(second.update(0.09, preset));
    }
  });

  it('keeps every destination finite and within safe normalized bounds over long runs', () => {
    for (const preset of factoryPresets) {
      const engine = new EvolutionEngine(preset.seed);
      let minimum = Infinity;
      let maximum = -Infinity;
      let allFinite = true;
      for (let index = 0; index < 5000; index += 1) {
        const frame = engine.update(0.1, preset);
        for (const voice of frame.voice) {
          for (const value of Object.values(voice)) {
            allFinite &&= Number.isFinite(value);
            minimum = Math.min(minimum, value);
            maximum = Math.max(maximum, value);
          }
        }
        allFinite &&= Number.isFinite(frame.space);
        minimum = Math.min(minimum, frame.space);
        maximum = Math.max(maximum, frame.space);
      }
      expect(allFinite).toBe(true);
      expect(minimum).toBeGreaterThanOrEqual(-1);
      expect(maximum).toBeLessThanOrEqual(1);
    }
  });

  it('holds the current modulation frame while frozen', () => {
    const preset = factoryPresets[0]!;
    const engine = new EvolutionEngine(preset.seed);
    const beforeFreeze = engine.update(1, preset);
    engine.setFrozen(true);
    const frame = engine.update(60, preset);
    expect(frame).toEqual(beforeFreeze);
  });

  it('adds audible bounded movement when Auto Morph is enabled', () => {
    const preset = structuredClone(factoryPresets[0]!);
    preset.macros.evolution = 0;
    preset.macros.autoMorphDepth = 0.8;
    const engine = new EvolutionEngine(preset.seed);
    const neutral = engine.update(1, preset);
    expect(neutral.voice.every((voice) => Object.values(voice).every((value) => value === 0))).toBe(
      true,
    );

    preset.macros.autoMorphEnabled = true;
    const morphed = engine.update(1, preset);
    expect(
      morphed.voice.some((voice) => Object.values(voice).some((value) => Math.abs(value) > 0.05)),
    ).toBe(true);
    expect(
      morphed.voice.every((voice) =>
        Object.values(voice).every((value) => Number.isFinite(value) && Math.abs(value) <= 1),
      ),
    ).toBe(true);
  });
});

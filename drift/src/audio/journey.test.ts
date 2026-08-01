import { describe, expect, it } from 'vitest';
import { factoryPresets } from '../presets/factory';
import { interpolatePreset, smoothJourneyProgress } from './journey';

describe('Journey interpolation', () => {
  const from = factoryPresets[0]!;
  const to = factoryPresets[factoryPresets.length - 1]!;

  it('preserves the exact scenes at each end of a leg', () => {
    expect(interpolatePreset(from, to, 0)).toEqual(from);
    expect(interpolatePreset(from, to, 1)).toEqual(to);
  });

  it('smoothly blends numeric sound controls without leaving their endpoints', () => {
    const middle = interpolatePreset(from, to, 0.5);
    expect(middle.macros.warmth).toBeCloseTo((from.macros.warmth + to.macros.warmth) / 2);
    expect(middle.voices[0]!.cutoff).toBeCloseTo(
      (from.voices[0]!.cutoff + to.voices[0]!.cutoff) / 2,
    );
    expect(middle.pulse.tempo).toBeCloseTo((from.pulse.tempo + to.pulse.tempo) / 2);
    expect(middle.chord.tempo).toBeCloseTo((from.chord.tempo + to.chord.tempo) / 2);
    expect(middle.binaural.beat).toBeCloseTo((from.binaural.beat + to.binaural.beat) / 2);
    expect(middle.ambientLayer.level).toBeCloseTo(
      (from.ambientLayer.level + to.ambientLayer.level) / 2,
    );
    expect(middle.sax.level).toBeCloseTo((from.sax.level + to.sax.level) / 2);
  });

  it('uses a bounded slow-in, slow-out travel curve', () => {
    expect(smoothJourneyProgress(-1)).toBe(0);
    expect(smoothJourneyProgress(0.5)).toBe(0.5);
    expect(smoothJourneyProgress(2)).toBe(1);
    expect(smoothJourneyProgress(0.1)).toBeLessThan(0.1);
    expect(smoothJourneyProgress(0.9)).toBeGreaterThan(0.9);
  });
});

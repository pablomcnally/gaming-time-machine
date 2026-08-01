import { describe, expect, it } from 'vitest';
import { factoryPresets } from './factory';
import { deserializePreset, serializePreset } from './serialization';

describe('preset serialization', () => {
  it('round-trips every factory preset without data loss', () => {
    for (const preset of factoryPresets) {
      expect(deserializePreset(serializePreset(preset))).toEqual(preset);
    }
  });

  it('ships twenty-eight distinct sonic characters', () => {
    expect(factoryPresets).toHaveLength(28);
    expect(new Set(factoryPresets.map((preset) => preset.name)).size).toBe(factoryPresets.length);
    const sonicSignatures = factoryPresets.map((preset) =>
      JSON.stringify({
        macros: preset.macros,
        voices: preset.voices,
        effects: preset.effects,
        atmosphere: preset.atmosphere,
        binaural: preset.binaural,
        ambientLayer: preset.ambientLayer,
        sax: preset.sax,
        chord: preset.chord,
        tuning: preset.tuning,
      }),
    );
    expect(new Set(sonicSignatures).size).toBe(factoryPresets.length);
  });

  it('keeps every Atmosphere control in range and includes distinct environments', () => {
    for (const preset of factoryPresets) {
      expect(typeof preset.atmosphere.enabled).toBe('boolean');
      for (const value of Object.values(preset.atmosphere).filter(
        (candidate): candidate is number => typeof candidate === 'number',
      )) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
    expect(
      factoryPresets.filter((preset) => preset.atmosphere.rain > 0.5).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      factoryPresets.filter((preset) => preset.atmosphere.sonar > 0.4).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      factoryPresets.filter((preset) => preset.atmosphere.transmission > 0.5).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('ships safe slow-pulse settings and all four pulse characters', () => {
    const enabled = factoryPresets.filter((preset) => preset.pulse.enabled);
    expect(enabled).toHaveLength(4);
    expect(new Set(enabled.map((preset) => preset.pulse.pattern))).toEqual(
      new Set(['breath', 'heartbeat', 'beacon', 'drift']),
    );
    for (const preset of factoryPresets) {
      expect(preset.pulse.tempo).toBeGreaterThanOrEqual(2);
      expect(preset.pulse.tempo).toBeLessThanOrEqual(40);
      for (const value of [
        preset.pulse.depth,
        preset.pulse.tone,
        preset.pulse.decay,
        preset.pulse.irregularity,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('ships safe eight-step chord instruments in every program', () => {
    for (const preset of factoryPresets) {
      expect(preset.chord.steps).toHaveLength(8);
      expect(preset.chord.tempo).toBeGreaterThanOrEqual(35);
      expect(preset.chord.tempo).toBeLessThanOrEqual(180);
      expect([1, 2, 4, 8]).toContain(preset.chord.stepBeats);
      expect(typeof preset.chord.enabled).toBe('boolean');
      expect(typeof preset.chord.running).toBe('boolean');
      for (const value of [
        preset.chord.swing,
        preset.chord.gate,
        preset.chord.level,
        preset.chord.spread,
        preset.chord.sustain,
        preset.chord.drive,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('ships three conservative binaural programs and bounded ambient layers', () => {
    const binauralPrograms = factoryPresets.filter((preset) => preset.binaural.enabled);
    expect(binauralPrograms.map((preset) => preset.name)).toEqual([
      'Delta Night',
      'Theta Passage',
      'Alpha Float',
    ]);
    expect(binauralPrograms.map((preset) => preset.binaural.beat)).toEqual([2.5, 6, 10]);
    for (const preset of factoryPresets) {
      expect(preset.binaural.carrier).toBeGreaterThanOrEqual(60);
      expect(preset.binaural.carrier).toBeLessThanOrEqual(400);
      expect(preset.binaural.beat).toBeGreaterThanOrEqual(0.25);
      expect(preset.binaural.beat).toBeLessThanOrEqual(40);
      expect(preset.binaural.level).toBeGreaterThanOrEqual(0);
      expect(preset.binaural.level).toBeLessThanOrEqual(0.18);
      for (const value of [
        preset.ambientLayer.level,
        preset.ambientLayer.activity,
        preset.ambientLayer.brightness,
        preset.ambientLayer.decay,
        preset.ambientLayer.spread,
        preset.ambientLayer.density,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('ships a bounded automatic Night Sax demonstration', () => {
    const automatic = factoryPresets.filter((preset) => preset.sax.automatic);
    expect(automatic.map((preset) => preset.name)).toEqual(['Midnight Sax']);
    for (const preset of factoryPresets) {
      expect(['lonely', 'noir', 'yearning']).toContain(preset.sax.style);
      expect(preset.sax.octave).toBeGreaterThanOrEqual(2);
      expect(preset.sax.octave).toBeLessThanOrEqual(5);
      for (const value of [
        preset.sax.level,
        preset.sax.tone,
        preset.sax.breath,
        preset.sax.vibrato,
        preset.sax.glide,
        preset.sax.expression,
        preset.sax.activity,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rejects incomplete and corrupt data', () => {
    expect(() => deserializePreset('not json')).toThrow();
    expect(() => deserializePreset({ name: 'Missing engine state' })).toThrow(
      'not a valid DRIFT preset',
    );
  });
});

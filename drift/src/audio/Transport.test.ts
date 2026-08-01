import { describe, expect, it } from 'vitest';
import { transportPosition, transportSecondsPerPulse, transportSwingOffset } from './Transport';

describe('shared transport calculations', () => {
  it('maps 24 PPQN positions to bars and beats', () => {
    expect(transportPosition(0, 4)).toEqual({ bar: 0, beat: 0, pulseInBeat: 0 });
    expect(transportPosition(95, 4)).toEqual({ bar: 0, beat: 3, pulseInBeat: 23 });
    expect(transportPosition(96, 4)).toEqual({ bar: 1, beat: 0, pulseInBeat: 0 });
  });

  it('calculates stable tempo intervals and clamps unsafe BPM', () => {
    expect(transportSecondsPerPulse(120)).toBeCloseTo(1 / 48, 8);
    expect(transportSecondsPerPulse(0)).toBeCloseTo(60 / 30 / 24, 8);
    expect(transportSecondsPerPulse(999)).toBeCloseTo(60 / 300 / 24, 8);
  });

  it('delays only offbeat sixteenths for swing', () => {
    expect(transportSwingOffset(0, 120, 0.5)).toBe(0);
    expect(transportSwingOffset(6, 120, 0.5)).toBeGreaterThan(0);
    expect(transportSwingOffset(12, 120, 0.5)).toBe(0);
    expect(transportSwingOffset(6, 120, 0)).toBe(0);
  });
});


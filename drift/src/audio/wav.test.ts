import { describe, expect, it } from 'vitest';
import { encodeWav } from './wav';

describe('WAV encoder', () => {
  it('writes a valid stereo PCM header and payload length', () => {
    const bytes = encodeWav([new Int16Array([0, 0, 32767, -32767])], 48000, 2);
    const text = (start: number, end: number) =>
      String.fromCharCode(...bytes.slice(start, end));
    const view = new DataView(bytes.buffer);
    expect(text(0, 4)).toBe('RIFF');
    expect(text(8, 12)).toBe('WAVE');
    expect(text(36, 40)).toBe('data');
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(48000);
    expect(view.getUint32(40, true)).toBe(8);
    expect(bytes.byteLength).toBe(52);
  });
});

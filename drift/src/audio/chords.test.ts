import { describe, expect, it } from 'vitest';
import { defaultChord } from '../presets/defaults';
import { chordLabel, chordMidiNotes } from './chords';

describe('Neon chord voicing', () => {
  it('creates bounded playable notes for every default progression step', () => {
    for (const step of defaultChord.steps) {
      const notes = chordMidiNotes(defaultChord, step);
      expect(notes.length).toBeGreaterThanOrEqual(3);
      expect(notes.every((note) => note >= 20 && note <= 108)).toBe(true);
      expect(notes).toEqual([...notes].sort((left, right) => left - right));
    }
  });

  it('applies inversions and wide voicing without changing pitch class content', () => {
    const root = { offset: 0, quality: 'minor7' as const, inversion: 0, enabled: true };
    const inverted = { ...root, inversion: 2 };
    const close = chordMidiNotes({ ...defaultChord, spread: 0 }, root);
    const wide = chordMidiNotes({ ...defaultChord, spread: 0.8 }, inverted);
    expect(wide).not.toEqual(close);
    expect(new Set(wide.map((note) => note % 12))).toEqual(new Set(close.map((note) => note % 12)));
  });

  it('labels the chord from key, offset and quality', () => {
    expect(chordLabel(0, { offset: 8, quality: 'major7', inversion: 0, enabled: true })).toBe(
      'G♯ MAJ 7',
    );
  });
});

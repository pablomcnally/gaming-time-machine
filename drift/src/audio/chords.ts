import type { ChordQuality, ChordState, ChordStep } from '../types';
import { clamp } from './math';

export const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

export const chordQualityLabels: Record<ChordQuality, string> = {
  minor: 'MIN',
  major: 'MAJ',
  minor7: 'MIN 7',
  major7: 'MAJ 7',
  minor9: 'MIN 9',
  add9: 'ADD 9',
  sus2: 'SUS 2',
  sus4: 'SUS 4',
  power: 'POWER',
};

const qualityIntervals: Record<ChordQuality, number[]> = {
  minor: [0, 3, 7],
  major: [0, 4, 7],
  minor7: [0, 3, 7, 10],
  major7: [0, 4, 7, 11],
  minor9: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 14],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  power: [0, 7, 12],
};

export function chordLabel(key: number, step: ChordStep): string {
  const root = noteNames[((Math.round(key + step.offset) % 12) + 12) % 12] ?? 'C';
  return `${root} ${chordQualityLabels[step.quality]}`;
}

export function chordMidiNotes(state: ChordState, step: ChordStep): number[] {
  const root = (clamp(Math.round(state.octave), 1, 5) + 1) * 12 + state.key + step.offset;
  const notes = qualityIntervals[step.quality].map((interval) => root + interval);
  const inversion = clamp(Math.round(step.inversion), 0, Math.min(3, notes.length - 1));
  for (let index = 0; index < inversion; index += 1) notes[index] = notes[index]! + 12;
  notes.sort((left, right) => left - right);

  if (state.spread > 0.28 && notes.length > 2) {
    notes[notes.length - 1] = notes[notes.length - 1]! + 12;
  }
  if (state.spread > 0.62 && notes.length > 3) {
    notes[notes.length - 2] = notes[notes.length - 2]! + 12;
  }
  if (state.spread > 0.86) notes[0] = notes[0]! - 12;
  return notes.map((note) => clamp(note, 20, 108)).sort((left, right) => left - right);
}

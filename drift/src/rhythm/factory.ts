import { generatePattern } from './generator';
import { defaultDrumEffects, defaultGenerative, makeDefaultKit, makeEmptyPattern } from './defaults';
import type { DrumKit, DrumVoiceId, RhythmPattern, RhythmStyle, WorkstationSession } from './types';

const kitNames = [
  'Classic Circuit', 'Concrete Room', 'Rusted Machine', 'Deep Warehouse', 'Cold Chrome',
  'Broken Console', 'Midnight Electro', 'Soft Voltage', 'Industrial Dust', 'Dub Chamber',
  'Lunar Rhythm', 'Submerged Drums',
];

export const factoryKits: DrumKit[] = kitNames.map((name, index) => {
  const kit = makeDefaultKit();
  kit.id = `kit-${name.toLowerCase().replaceAll(' ', '-')}`;
  kit.name = name;
  const colour = (index - 5.5) / 11;
  for (const [voice, params] of Object.entries(kit.voices) as Array<[DrumVoiceId, DrumKit['voices'][DrumVoiceId]]>) {
    const metallic = ['closedHat', 'openHat', 'crash', 'ride'].includes(voice);
    params.tune = Math.min(1, Math.max(0, params.tune + colour * (metallic ? 0.18 : 0.09)));
    params.decay = Math.min(1, Math.max(0.04, params.decay + ((index % 4) - 1.5) * 0.055));
    params.drive = Math.min(0.72, params.drive + (index % 3) * 0.07);
    params.tone = Math.min(1, Math.max(0, params.tone + colour * 0.16));
  }
  kit.effects = {
    ...defaultDrumEffects,
    saturation: 0.08 + (index % 5) * 0.055,
    compression: 0.22 + (index % 4) * 0.08,
    room: name.includes('Room') || name.includes('Chamber') ? 0.34 : 0.08 + (index % 3) * 0.05,
  };
  return kit;
});

const styles: RhythmStyle[] = [
  'straight-machine', 'electro', 'industrial', 'dub-techno', 'ambient-pulse', 'broken-beat',
  'minimal', 'acid-rhythm', 'slow-ritual', 'abstract', 'sparse', 'chaotic',
];

export const factoryPatterns: RhythmPattern[] = Array.from({ length: 24 }, (_, index) => {
  const style = styles[index % styles.length]!;
  const bank = index < 16 ? 'A' : 'B';
  const slot = (index % 16) + 1;
  const base = makeEmptyPattern(`factory-${bank.toLowerCase()}${String(slot).padStart(2, '0')}`, `${style.replaceAll('-', ' ').toUpperCase()} ${String(index + 1).padStart(2, '0')}`);
  base.length = index % 7 === 0 ? 32 : index % 11 === 0 ? 24 : 16;
  for (const track of base.tracks) {
    track.length = base.length;
    track.lastStep = base.length - 1;
  }
  return generatePattern(base, {
    ...defaultGenerative,
    style,
    seed: `FACTORY-RHYTHM-${index + 1}`,
    density: 0.32 + (index % 5) * 0.11,
    complexity: 0.22 + (index % 6) * 0.1,
    syncopation: 0.12 + (index % 4) * 0.16,
    swing: index % 3 === 0 ? 0.16 : 0,
  });
});

const sessionNames = [
  'Orbital Pulse', 'Reactor Floor', 'Frozen Industry', 'Machine Dreams', 'Abandoned Club',
  'Slow Signal', 'Black Rain', 'Transmission 909', 'Tidal Circuit', 'Concrete Nebula',
];

export const factorySessionSummaries: Array<Pick<WorkstationSession, 'name' | 'dronePresetId'>> =
  sessionNames.map((name, index) => ({
    name,
    dronePresetId: [
      'factory-deep-space', 'factory-abyssal-beacon', 'factory-neon-rain',
      'factory-crystal-atmosphere',
    ][index % 4]!,
  }));


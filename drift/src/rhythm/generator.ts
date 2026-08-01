import { clamp } from '../audio/math';
import { SeededRandom } from '../audio/seeded';
import { makeStep } from './defaults';
import type {
  GenerativeRhythmState,
  RhythmPattern,
  RhythmStep,
  RhythmStyle,
  RhythmTrack,
} from './types';

interface StyleRules {
  kick: number[];
  backbeat: number[];
  hatStride: number;
  syncopation: number;
  sparsity: number;
  toms: number;
}

const rules: Record<RhythmStyle, StyleRules> = {
  'straight-machine': { kick: [0, 8], backbeat: [4, 12], hatStride: 2, syncopation: 0.12, sparsity: 0, toms: 0.08 },
  electro: { kick: [0, 6, 10], backbeat: [4, 12], hatStride: 2, syncopation: 0.42, sparsity: 0.08, toms: 0.18 },
  industrial: { kick: [0, 3, 8, 11], backbeat: [4, 12], hatStride: 1, syncopation: 0.5, sparsity: 0.04, toms: 0.34 },
  'dub-techno': { kick: [0, 7, 10], backbeat: [4, 12], hatStride: 2, syncopation: 0.32, sparsity: 0.18, toms: 0.1 },
  'ambient-pulse': { kick: [0, 10], backbeat: [6, 14], hatStride: 4, syncopation: 0.25, sparsity: 0.42, toms: 0.18 },
  'broken-beat': { kick: [0, 5, 11], backbeat: [4, 13], hatStride: 2, syncopation: 0.7, sparsity: 0.12, toms: 0.22 },
  minimal: { kick: [0, 8], backbeat: [4, 12], hatStride: 4, syncopation: 0.1, sparsity: 0.45, toms: 0.03 },
  'acid-rhythm': { kick: [0, 6, 8, 14], backbeat: [4, 12], hatStride: 2, syncopation: 0.48, sparsity: 0.05, toms: 0.2 },
  'slow-ritual': { kick: [0, 10], backbeat: [6, 14], hatStride: 4, syncopation: 0.18, sparsity: 0.38, toms: 0.4 },
  abstract: { kick: [0, 9], backbeat: [5, 13], hatStride: 3, syncopation: 0.72, sparsity: 0.24, toms: 0.42 },
  sparse: { kick: [0], backbeat: [12], hatStride: 4, syncopation: 0.12, sparsity: 0.64, toms: 0.06 },
  chaotic: { kick: [0, 3, 7, 10, 14], backbeat: [4, 11, 15], hatStride: 1, syncopation: 0.88, sparsity: 0, toms: 0.62 },
};

function hit(step: RhythmStep, velocity: number, probability = 1, accent = false): void {
  step.active = true;
  step.velocity = clamp(velocity, 0.05, 1);
  step.probability = clamp(probability, 0, 1);
  step.accent = accent;
}

function clearMutable(track: RhythmTrack): void {
  if (track.locked) return;
  track.steps = track.steps.map((step) => (step.protected ? step : makeStep()));
}

export function generatePattern(
  source: RhythmPattern,
  settings: GenerativeRhythmState,
  seed = settings.seed,
): RhythmPattern {
  const pattern = structuredClone(source);
  const random = new SeededRandom(`${seed}:${settings.style}:${pattern.id}`);
  const profile = rules[settings.style];
  pattern.seed = seed;
  pattern.style = settings.style;
  pattern.swing = clamp(settings.swing, 0, 0.75);
  pattern.tracks.forEach(clearMutable);

  for (const track of pattern.tracks) {
    if (track.locked) continue;
    const role = track.voice;
    for (let index = 0; index < pattern.length; index += 1) {
      const step = track.steps[index]!;
      if (step.protected) continue;
      const local = index % 16;
      if (role === 'kick' && profile.kick.includes(local)) {
        hit(step, local === 0 ? 0.98 : 0.76 + random.next() * 0.16, 1, local === 0);
      } else if ((role === 'snare' || role === 'clap') && profile.backbeat.includes(local)) {
        if (role === 'snare' || random.next() < 0.45 + settings.complexity * 0.35)
          hit(step, 0.72 + random.next() * 0.2, 1, true);
      } else if (role === 'closedHat' && local % profile.hatStride === 0) {
        const chance = clamp(0.62 + settings.density * 0.38 - profile.sparsity, 0.12, 1);
        if (random.next() < chance) hit(step, 0.38 + random.next() * 0.35, 0.82 + random.next() * 0.18, local % 4 === 0);
      } else if (role === 'openHat' && local % 8 === 6 && random.next() < 0.42 + settings.variation * 0.35) {
        hit(step, 0.52 + random.next() * 0.2, 0.72 + random.next() * 0.24);
      } else if (['lowTom', 'midTom', 'highTom'].includes(role) && random.next() < profile.toms * settings.complexity * 0.18) {
        hit(step, 0.5 + random.next() * 0.28, 0.72 + random.next() * 0.25);
      } else if (role === 'rim' && local % 4 === 2 && random.next() < settings.syncopation * profile.syncopation * 0.72) {
        hit(step, 0.42 + random.next() * 0.25, 0.62 + random.next() * 0.3);
      } else if ((role === 'crash' || role === 'ride') && local === 0 && index > 0 && random.next() < settings.fillFrequency * 0.45) {
        hit(step, 0.55, 0.8);
      }

      if (step.active) {
        step.microTiming = Math.round(random.signed() * settings.humanisation * 18) || 0;
        if (random.next() < settings.complexity * 0.08) step.ratchets = random.next() < 0.75 ? 2 : 3;
        if ((role === 'snare' || role === 'clap') && random.next() < settings.variation * 0.08)
          step.flam = 0.2 + random.next() * 0.45;
      }
    }
  }
  return pattern;
}

export function mutatePattern(
  source: RhythmPattern,
  settings: GenerativeRhythmState,
  seed: string,
): RhythmPattern {
  const pattern = structuredClone(source);
  const random = new SeededRandom(`${seed}:mutate:${source.seed}`);
  const intensity = clamp(settings.mutation * (1.1 - settings.stability * 0.7), 0.01, 0.8);
  for (const track of pattern.tracks) {
    if (track.locked) continue;
    for (let index = track.firstStep; index <= track.lastStep; index += 1) {
      const step = track.steps[index]!;
      if (step.protected) continue;
      if (random.next() < intensity * 0.18) {
        if (step.active) step.active = random.next() > 0.42;
        else if (random.next() < settings.density) hit(step, 0.38 + random.next() * 0.45, 0.55 + random.next() * 0.42);
      }
      if (step.active && random.next() < intensity * 0.4) step.velocity = clamp(step.velocity + random.signed() * 0.16, 0.08, 1);
      if (step.active && random.next() < intensity * 0.25) step.probability = clamp(step.probability + random.signed() * 0.2, 0.1, 1);
      if (step.active && random.next() < intensity * 0.18) step.microTiming = Math.round(clamp(step.microTiming + random.signed() * 8, -24, 24));
    }
  }
  pattern.seed = seed;
  return pattern;
}

export function rotateTrack(track: RhythmTrack, amount: number): RhythmTrack {
  const next = structuredClone(track);
  const first = clamp(Math.round(next.firstStep), 0, 63);
  const last = clamp(Math.round(next.lastStep), first, 63);
  const region = next.steps.slice(first, last + 1);
  if (!region.length) return next;
  const shift = ((Math.round(amount) % region.length) + region.length) % region.length;
  const rotated = [...region.slice(-shift), ...region.slice(0, -shift || undefined)];
  next.steps.splice(first, region.length, ...rotated);
  next.rotation = (next.rotation + amount) % region.length;
  return next;
}

export function humanisePattern(source: RhythmPattern, amount: number, seed: string): RhythmPattern {
  const next = structuredClone(source);
  const random = new SeededRandom(`${seed}:humanise`);
  for (const track of next.tracks) {
    if (track.locked) continue;
    for (const step of track.steps) {
      if (!step.active || step.protected) continue;
      step.velocity = clamp(step.velocity + random.signed() * amount * 0.14, 0.05, 1);
      step.microTiming = Math.round(clamp(step.microTiming + random.signed() * amount * 18, -24, 24));
    }
  }
  return next;
}

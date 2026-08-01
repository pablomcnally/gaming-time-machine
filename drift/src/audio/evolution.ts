import type { DriftPreset, EvolutionFrame, ModSourceKind, ModulationRoute } from '../types';
import { clamp, lerp } from './math';
import { SeededRandom } from './seeded';

interface SourceState {
  value: number;
  target: number;
  phase: number;
  elapsed: number;
  nextEvent: number;
}

const emptyVoice = () => ({
  pitch: 0,
  detune: 0,
  cutoff: 0,
  resonance: 0,
  amplitude: 0,
  pan: 0,
  harmonics: 0,
});

export class EvolutionEngine {
  private random: SeededRandom;
  private sourceStates = new Map<string, SourceState>();
  private time = 0;
  private frozen = false;
  private impulse = 0;
  private lastFrame: EvolutionFrame | null = null;

  constructor(seed: string) {
    this.random = new SeededRandom(seed);
  }

  reseed(seed: string): void {
    this.random = new SeededRandom(seed);
    this.sourceStates.clear();
    this.time = 0;
    this.impulse = 0;
    this.lastFrame = null;
  }

  setFrozen(frozen: boolean): void {
    this.frozen = frozen;
  }

  mutate(amount = 0.5): void {
    this.impulse = clamp(this.impulse + amount, 0, 1);
    for (const state of this.sourceStates.values()) {
      state.target = clamp(state.target + this.random.signed() * amount, -1, 1);
    }
  }

  private stateFor(route: ModulationRoute, voiceIndex: number): SourceState {
    const key = `${route.id}:${voiceIndex}`;
    let state = this.sourceStates.get(key);
    if (!state) {
      state = {
        value: this.random.signed() * 0.2,
        target: this.random.signed(),
        phase: this.random.next() * Math.PI * 2,
        elapsed: 0,
        nextEvent: this.random.range(2, 12),
      };
      this.sourceStates.set(key, state);
    }
    return state;
  }

  private sourceValue(
    kind: ModSourceKind,
    route: ModulationRoute,
    voiceIndex: number,
    dt: number,
    speed: number,
    mutation: number,
  ): number {
    const state = this.stateFor(route, voiceIndex);
    const rateHz = 1 / lerp(320, 1.5, clamp(route.rate * speed, 0, 1));
    state.elapsed += dt;
    state.phase += dt * rateHz * Math.PI * 2;

    switch (kind) {
      case 'lfo':
        state.value = Math.sin(state.phase);
        break;
      case 'random-walk':
        state.value = clamp(state.value + this.random.signed() * dt * rateHz * 2.5, -1, 1);
        break;
      case 'sample-hold':
        if (state.elapsed >= state.nextEvent) {
          state.value = this.random.signed();
          state.elapsed = 0;
          state.nextEvent = 1 / Math.max(0.0001, rateHz);
        }
        break;
      case 'smooth-random':
        if (state.elapsed >= state.nextEvent) {
          state.target = this.random.signed();
          state.elapsed = 0;
          state.nextEvent = 1 / Math.max(0.0001, rateHz);
        }
        state.value = lerp(state.value, state.target, clamp(dt * rateHz * 4, 0, 1));
        break;
      case 'coherent-noise':
        state.value =
          Math.sin(state.phase) * 0.55 +
          Math.sin(state.phase * 0.37 + voiceIndex * 1.71) * 0.3 +
          Math.sin(state.phase * 0.11 + 2.4) * 0.15;
        break;
      case 'long-envelope':
        state.value = Math.sin(state.phase - Math.PI / 2) * 0.5 + 0.5;
        break;
      case 'probability':
        if (
          state.elapsed >= state.nextEvent &&
          this.random.next() < mutation * 0.5 + this.impulse
        ) {
          state.target = this.random.signed();
          state.elapsed = 0;
          state.nextEvent = this.random.range(4, 30) / Math.max(0.1, speed);
        }
        state.value = lerp(state.value, state.target, clamp(dt * 0.12, 0, 1));
        break;
    }
    return clamp(state.value, -1, 1);
  }

  update(dt: number, preset: DriftPreset): EvolutionFrame {
    const safeDt = clamp(dt, 0, 1);
    if (this.frozen && this.lastFrame) return this.lastFrame;
    if (!this.frozen) this.time += safeDt;
    const output: EvolutionFrame = {
      voice: preset.voices.map(emptyVoice),
      space: 0,
      phase: this.time,
    };
    if (this.frozen || (preset.macros.evolution <= 0 && !preset.macros.autoMorphEnabled)) {
      this.lastFrame = output;
      return output;
    }

    const speed = clamp(0.08 + preset.macros.speed * 0.92, 0.02, 1);
    const activity = preset.macros.evolution;
    const roaming = preset.macros.range * (1 - preset.macros.stability * 0.62);

    preset.modulation.forEach((route) => {
      if (!route.enabled) return;
      preset.voices.forEach((voice, index) => {
        if (voice.locked) return;
        const raw = this.sourceValue(
          route.source,
          route,
          index,
          safeDt,
          speed,
          preset.macros.mutation,
        );
        const depth = route.depth * voice.modulation * activity * roaming;
        const value = raw * depth;
        switch (route.destination) {
          case 'pitch':
            output.voice[index]!.pitch += value * (0.18 + preset.macros.tension * 0.82);
            break;
          case 'detune':
            output.voice[index]!.detune += value;
            break;
          case 'cutoff':
            output.voice[index]!.cutoff += value;
            break;
          case 'resonance':
            output.voice[index]!.resonance += value;
            break;
          case 'amplitude':
            output.voice[index]!.amplitude += value;
            break;
          case 'pan':
            output.voice[index]!.pan += value * preset.macros.motion;
            break;
          case 'harmonics':
            output.voice[index]!.harmonics += value;
            break;
          case 'space':
            output.space += value;
            break;
        }
      });
    });

    if (preset.macros.autoMorphEnabled && preset.macros.autoMorphDepth > 0) {
      const depth = preset.macros.autoMorphDepth;
      const morphRate = 0.012 + preset.macros.speed * 0.045;
      preset.voices.forEach((voice, index) => {
        if (voice.locked) return;
        const phase = this.time * morphRate * Math.PI * 2 + index * 1.73;
        const secondary = Math.sin(phase * 0.43 + index * 0.91);
        const tertiary = Math.sin(phase * 0.19 + 2.4);
        const shaped = Math.sin(phase) * 0.62 + secondary * 0.27 + tertiary * 0.11;
        const frame = output.voice[index]!;
        frame.cutoff += shaped * depth * 0.78;
        frame.resonance += Math.sin(phase * 0.67 + 0.8) * depth * 0.34;
        frame.detune += Math.sin(phase * 0.31 + index) * depth * 0.3;
        frame.harmonics += Math.sin(phase * 0.23 + index * 0.6) * depth * 0.52;
        frame.amplitude += Math.sin(phase * 0.17 + index * 1.2) * depth * 0.2;
        frame.pan += Math.sin(phase * 0.37 + index * 1.9) * depth * 0.72;
        if (index === 0) output.space += Math.sin(phase * 0.13) * depth * 0.38;
      });
    }

    const centering = clamp(preset.macros.stability * safeDt * 0.05, 0, 1);
    for (const state of this.sourceStates.values()) {
      state.value = lerp(state.value, 0, centering);
    }
    this.impulse = Math.max(0, this.impulse - safeDt * 0.07);

    for (const voice of output.voice) {
      voice.pitch = clamp(voice.pitch, -1, 1);
      voice.detune = clamp(voice.detune, -1, 1);
      voice.cutoff = clamp(voice.cutoff, -1, 1);
      voice.resonance = clamp(voice.resonance, -1, 1);
      voice.amplitude = clamp(voice.amplitude, -1, 1);
      voice.pan = clamp(voice.pan, -1, 1);
      voice.harmonics = clamp(voice.harmonics, -1, 1);
    }
    output.space = clamp(output.space, -1, 1);
    this.lastFrame = output;
    return output;
  }
}

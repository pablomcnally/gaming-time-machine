import { clamp } from './math';
import type { TransportPulse, TransportState } from '../rhythm/types';

export type TransportListener = (pulse: TransportPulse) => void;
export type TransportStateListener = (state: TransportState) => void;

const PULSES_PER_BEAT = 24;

export function transportSecondsPerPulse(bpm: number): number {
  return 60 / clamp(bpm, 30, 300) / PULSES_PER_BEAT;
}

export function transportSwingOffset(pulse: number, bpm: number, swing: number): number {
  const sixteenth = Math.floor(pulse / 6);
  return sixteenth % 2 === 1
    ? transportSecondsPerPulse(bpm) * 6 * clamp(swing, 0, 0.75) * 0.45
    : 0;
}

export function transportPosition(pulse: number, numerator = 4): Pick<TransportPulse, 'bar' | 'beat' | 'pulseInBeat'> {
  const beat = Math.floor(Math.max(0, pulse) / PULSES_PER_BEAT);
  return {
    bar: Math.floor(beat / Math.max(1, numerator)),
    beat: beat % Math.max(1, numerator),
    pulseInBeat: Math.max(0, pulse) % PULSES_PER_BEAT,
  };
}

export class Transport {
  private state: TransportState;
  private nextPulseAt = 0;
  private timer: number | null = null;
  private listeners = new Set<TransportListener>();
  private stateListeners = new Set<TransportStateListener>();
  private lookahead = 0.12;

  constructor(
    private readonly context: AudioContext,
    initial: TransportState,
  ) {
    this.state = { ...initial, playing: false };
  }

  snapshot(): TransportState {
    return { ...this.state };
  }

  subscribe(listener: TransportListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeState(listener: TransportStateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  setBpm(bpm: number): void {
    this.state.bpm = clamp(bpm, 30, 300);
    this.emitState();
  }

  setSwing(swing: number): void {
    this.state.swing = clamp(swing, 0, 0.75);
    this.emitState();
  }

  setDroneMode(mode: TransportState['droneMode']): void {
    this.state.droneMode = mode;
    this.emitState();
  }

  start(): void {
    if (this.state.playing) return;
    this.state.playing = true;
    this.nextPulseAt = this.context.currentTime + 0.035;
    this.timer = window.setInterval(() => this.schedule(), 25);
    this.schedule();
    this.emitState();
  }

  pause(): void {
    if (!this.state.playing) return;
    this.state.playing = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.emitState();
  }

  stop(): void {
    this.pause();
    this.state.positionPulses = 0;
    this.emitState();
  }

  reset(): void {
    this.state.positionPulses = 0;
    if (this.state.playing) this.nextPulseAt = this.context.currentTime + 0.035;
    this.emitState();
  }

  tap(taps: number[]): number | null {
    if (taps.length < 2) return null;
    const intervals = taps.slice(1).map((value, index) => value - taps[index]!);
    const recent = intervals.slice(-5).filter((value) => value >= 200 && value <= 2000);
    if (!recent.length) return null;
    const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
    const bpm = clamp(60000 / average, 30, 300);
    this.setBpm(bpm);
    return bpm;
  }

  dispose(): void {
    this.pause();
    this.listeners.clear();
    this.stateListeners.clear();
  }

  private emitState(): void {
    const snapshot = this.snapshot();
    for (const listener of this.stateListeners) listener(snapshot);
  }

  private schedule(): void {
    const secondsPerPulse = transportSecondsPerPulse(this.state.bpm);
    const horizon = this.context.currentTime + this.lookahead;
    let scheduled = 0;
    while (this.nextPulseAt < horizon && scheduled < 256) {
      const pulse = this.state.positionPulses;
      const position = transportPosition(pulse, this.state.numerator);
      const swung = transportSwingOffset(pulse, this.state.bpm, this.state.swing);
      const event: TransportPulse = {
        time: this.nextPulseAt + swung,
        pulse,
        ...position,
      };
      for (const listener of this.listeners) listener(event);
      this.state.positionPulses += 1;
      this.nextPulseAt += secondsPerPulse;
      if (this.state.positionPulses % 6 === 0) this.emitState();
      scheduled += 1;
    }
  }
}

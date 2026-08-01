import { clamp, safeParam } from './math';
import { SeededRandom } from './seeded';
import type { Transport } from './Transport';
import type {
  DrumEffectsState,
  DrumVoiceId,
  DrumVoiceParams,
  RhythmPattern,
  RhythmStep,
  RhythmTrack,
  TransportPulse,
} from '../rhythm/types';
import { drumVoices } from '../rhythm/types';

interface VoiceBus {
  input: GainNode;
  tone: BiquadFilterNode;
  drive: WaveShaperNode;
  panner: StereoPannerNode;
  gain: GainNode;
  analyser: AnalyserNode;
}

interface ActiveHit {
  voice: DrumVoiceId;
  sources: AudioScheduledSourceNode[];
  envelope: GainNode;
  stopAt: number;
}

export interface RhythmMeterFrame {
  bus: number;
  voices: Record<DrumVoiceId, number>;
}

const divisionPulses: Record<RhythmTrack['division'], number> = {
  '1/4': 24,
  '1/8': 12,
  '1/16': 6,
  '1/32': 3,
  '1/8T': 8,
  '1/16T': 4,
};

export class RhythmEngine {
  private input: GainNode;
  private saturation: WaveShaperNode;
  private tone: BiquadFilterNode;
  private compressor: DynamicsCompressorNode;
  private parallelDrive: WaveShaperNode;
  private parallelGain: GainNode;
  private dryGain: GainNode;
  private delay: DelayNode;
  private delayFeedback: GainNode;
  private delayGain: GainNode;
  private room: ConvolverNode;
  private roomGain: GainNode;
  private busAnalyser: AnalyserNode;
  private outputGain: GainNode;
  private voiceBuses = new Map<DrumVoiceId, VoiceBus>();
  private activeHits = new Set<ActiveHit>();
  private openHatHits = new Set<ActiveHit>();
  private noiseBuffer: AudioBuffer;
  private unsubscribe: (() => void) | null = null;
  private patternProvider: (() => RhythmPattern) | null = null;
  private transport: Transport | null = null;
  private selectedVoiceProvider: (() => DrumVoiceId) | null = null;
  private playheadListener: ((step: number, pulse: TransportPulse) => void) | null = null;
  private triggerListener: ((voice: DrumVoiceId, strength: number, time: number) => void) | null = null;
  private lastPatternId = '';
  private probabilitySeed = '';
  private disposed = false;
  private stereoWidth = 0.66;

  constructor(
    readonly context: AudioContext,
    destination: AudioNode,
  ) {
    this.input = context.createGain();
    this.input.gain.value = 0.72;
    this.saturation = context.createWaveShaper();
    this.saturation.oversample = '2x';
    this.saturation.curve = this.driveCurve(0.14);
    this.tone = context.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 15000;
    this.tone.Q.value = 0.45;
    this.compressor = context.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 3.2;
    this.compressor.attack.value = 0.008;
    this.compressor.release.value = 0.18;
    this.parallelDrive = context.createWaveShaper();
    this.parallelDrive.oversample = '4x';
    this.parallelDrive.curve = this.driveCurve(0.42);
    this.parallelGain = context.createGain();
    this.parallelGain.gain.value = 0.08;
    this.dryGain = context.createGain();
    this.dryGain.gain.value = 0.92;
    this.delay = context.createDelay(2);
    this.delay.delayTime.value = 0.19;
    this.delayFeedback = context.createGain();
    this.delayFeedback.gain.value = 0.24;
    this.delayGain = context.createGain();
    this.delayGain.gain.value = 0.06;
    this.room = context.createConvolver();
    this.room.buffer = this.makeRoomImpulse();
    this.roomGain = context.createGain();
    this.roomGain.gain.value = 0.08;
    this.busAnalyser = context.createAnalyser();
    this.busAnalyser.fftSize = 256;
    this.busAnalyser.smoothingTimeConstant = 0.72;
    this.outputGain = context.createGain();
    this.outputGain.gain.value = 0.78;

    this.input.connect(this.saturation).connect(this.tone).connect(this.compressor);
    this.compressor.connect(this.dryGain).connect(this.busAnalyser);
    this.compressor.connect(this.parallelDrive).connect(this.parallelGain).connect(this.busAnalyser);
    this.compressor.connect(this.delay).connect(this.delayGain).connect(this.busAnalyser);
    this.delay.connect(this.delayFeedback).connect(this.delay);
    this.compressor.connect(this.room).connect(this.roomGain).connect(this.busAnalyser);
    this.busAnalyser.connect(this.outputGain).connect(destination);
    this.noiseBuffer = this.makeNoiseBuffer();

    for (const voice of drumVoices) this.voiceBuses.set(voice, this.makeVoiceBus());
  }

  connectTransport(
    transport: Transport,
    patternProvider: () => RhythmPattern,
    selectedVoiceProvider: () => DrumVoiceId,
    onPlayhead: (step: number, pulse: TransportPulse) => void,
  ): void {
    this.unsubscribe?.();
    this.transport = transport;
    this.patternProvider = patternProvider;
    this.selectedVoiceProvider = selectedVoiceProvider;
    this.playheadListener = onPlayhead;
    this.unsubscribe = transport.subscribe((pulse) => this.schedulePulse(pulse));
  }

  onTrigger(listener: (voice: DrumVoiceId, strength: number, time: number) => void): void {
    this.triggerListener = listener;
  }

  applyPattern(pattern: RhythmPattern): void {
    const anySolo = pattern.tracks.some((track) => track.params.solo);
    for (const track of pattern.tracks) {
      const bus = this.voiceBuses.get(track.voice)!;
      const audible = !track.params.muted && (!anySolo || track.params.solo);
      const now = this.context.currentTime;
      safeParam(bus.gain.gain, audible ? clamp(track.params.level, 0, 0.9) : 0, now, 0.025);
      safeParam(bus.panner.pan, clamp(track.params.pan * (0.45 + this.stereoWidth * 0.85), -1, 1), now, 0.04);
      safeParam(bus.tone.frequency, 500 + clamp(track.params.tone, 0, 1) * 17500, now, 0.06);
      bus.drive.curve = this.driveCurve(track.params.drive);
    }
    if (pattern.id !== this.lastPatternId || pattern.seed !== this.probabilitySeed) {
      this.lastPatternId = pattern.id;
      this.probabilitySeed = pattern.seed;
    }
  }

  applyEffects(effects: DrumEffectsState): void {
    const now = this.context.currentTime;
    this.saturation.curve = this.colourCurve(effects.saturation, effects.bitReduction);
    this.parallelDrive.curve = this.driveCurve(0.25 + effects.parallelDrive * 0.7);
    safeParam(this.parallelGain.gain, clamp(effects.parallelDrive, 0, 0.5), now, 0.06);
    safeParam(this.dryGain.gain, 1 - clamp(effects.parallelDrive, 0, 0.5) * 0.35, now, 0.06);
    safeParam(this.tone.frequency, 1200 + clamp(effects.tone, 0, 1) * 17800, now, 0.08);
    this.compressor.threshold.value = -8 - clamp(effects.compression, 0, 1) * 22;
    this.compressor.ratio.value = 1.5 + clamp(effects.compression, 0, 1) * 7;
    this.compressor.attack.value = 0.002 + (1 - clamp(effects.transient, 0, 1)) * 0.035;
    const bpm = this.transport?.snapshot().bpm ?? 120;
    safeParam(this.delay.delayTime, clamp(60 / bpm * 0.375, 0.03, 1.5), now, 0.1);
    safeParam(this.delayGain.gain, clamp(effects.delay, 0, 0.42), now, 0.08);
    safeParam(this.delayFeedback.gain, clamp(0.12 + effects.delay * 0.42, 0, 0.62), now, 0.08);
    safeParam(this.roomGain.gain, clamp(effects.room, 0, 0.38), now, 0.08);
    this.stereoWidth = clamp(effects.width, 0, 1);
  }

  setOutput(volume: number, muted: boolean): void {
    safeParam(this.outputGain.gain, muted ? 0 : clamp(volume, 0, 0.9), this.context.currentTime, 0.035);
  }

  trigger(voice: DrumVoiceId, velocity = 0.8, time = this.context.currentTime + 0.01): void {
    const pattern = this.patternProvider?.();
    const params = pattern?.tracks.find((track) => track.voice === voice)?.params;
    if (!params) return;
    this.synthesise(voice, time, clamp(velocity, 0.01, 1), params);
  }

  panic(): void {
    const now = this.context.currentTime;
    for (const hit of [...this.activeHits]) {
      try {
        hit.envelope.gain.cancelScheduledValues(now);
        hit.envelope.gain.setTargetAtTime(0, now, 0.003);
        for (const source of hit.sources) source.stop(now + 0.03);
      } catch {
        // Already-ended sources are harmless.
      }
    }
    this.activeHits.clear();
    this.openHatHits.clear();
  }

  getMeterFrame(): RhythmMeterFrame {
    const voices = {} as Record<DrumVoiceId, number>;
    for (const voice of drumVoices) voices[voice] = this.readRms(this.voiceBuses.get(voice)!.analyser);
    return { bus: this.readRms(this.busAnalyser), voices };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribe?.();
    this.panic();
    for (const bus of this.voiceBuses.values()) {
      bus.input.disconnect();
      bus.tone.disconnect();
      bus.drive.disconnect();
      bus.panner.disconnect();
      bus.gain.disconnect();
      bus.analyser.disconnect();
    }
    this.input.disconnect();
    this.saturation.disconnect();
    this.tone.disconnect();
    this.compressor.disconnect();
    this.parallelDrive.disconnect();
    this.parallelGain.disconnect();
    this.dryGain.disconnect();
    this.delay.disconnect();
    this.delayFeedback.disconnect();
    this.delayGain.disconnect();
    this.room.disconnect();
    this.roomGain.disconnect();
    this.busAnalyser.disconnect();
    this.outputGain.disconnect();
  }

  private schedulePulse(pulse: TransportPulse): void {
    const pattern = this.patternProvider?.();
    if (!pattern) return;
    this.applyPattern(pattern);
    const anySolo = pattern.tracks.some((track) => track.params.solo);
    for (const track of pattern.tracks) {
      const division = divisionPulses[track.division];
      if (pulse.pulse % division !== 0 || track.params.muted || (anySolo && !track.params.solo)) continue;
      const regionLength = Math.max(1, Math.min(track.length, track.lastStep - track.firstStep + 1));
      const rawIndex = Math.floor(pulse.pulse / division);
      const index = track.firstStep + (((rawIndex + track.rotation) % regionLength) + regionLength) % regionLength;
      const step = track.steps[index];
      if (!step?.active || !this.shouldPlay(pattern, track, step, index, pulse.pulse)) continue;
      const params = { ...track.params, ...step.locks };
      const strength = clamp(step.velocity * (step.accent ? 1.16 : 1), 0.01, 1);
      const offset = clamp(step.microTiming, -24, 24) / 1000;
      const baseTime = Math.max(this.context.currentTime + 0.002, pulse.time + offset);
      const spacing =
        (60 / (this.transport?.snapshot().bpm ?? 120) / 24) * division /
        Math.max(1, step.ratchets);
      for (let ratchet = 0; ratchet < clamp(Math.round(step.ratchets), 1, 4); ratchet += 1) {
        this.synthesise(track.voice, baseTime + ratchet * spacing, strength * (ratchet ? 0.82 : 1), params);
      }
      if (step.flam > 0) this.synthesise(track.voice, baseTime + 0.012 + step.flam * 0.035, strength * 0.72, params);
      this.triggerListener?.(track.voice, strength, baseTime);
    }

    const selected = pattern.tracks.find((track) => track.voice === this.selectedVoiceProvider?.());
    if (selected) {
      const division = divisionPulses[selected.division];
      if (pulse.pulse % division === 0) {
        const length = Math.max(1, selected.length);
        const step = Math.floor(pulse.pulse / division) % length;
        const delay = Math.max(0, (pulse.time - this.context.currentTime) * 1000);
        window.setTimeout(() => this.playheadListener?.(step, pulse), delay);
      }
    }
  }

  private shouldPlay(
    pattern: RhythmPattern,
    track: RhythmTrack,
    step: RhythmStep,
    index: number,
    pulse: number,
  ): boolean {
    if (step.probability >= 1) return true;
    const random = new SeededRandom(`${pattern.seed}:${track.voice}:${index}:${Math.floor(pulse / Math.max(1, pattern.length * 6))}`);
    return random.next() <= clamp(step.probability, 0, 1);
  }

  private synthesise(voice: DrumVoiceId, time: number, velocity: number, params: DrumVoiceParams): void {
    if (this.activeHits.size > 96) {
      const oldest = this.activeHits.values().next().value as ActiveHit | undefined;
      if (oldest) this.stopHit(oldest, this.context.currentTime + 0.01);
    }
    if ((voice === 'closedHat' || voice === 'openHat') && params.choke) this.chokeHats(time);
    if (voice === 'kick') this.kick(time, velocity, params);
    else if (voice === 'snare') this.snare(time, velocity, params);
    else if (voice === 'lowTom' || voice === 'midTom' || voice === 'highTom') this.tom(voice, time, velocity, params);
    else if (voice === 'rim') this.rim(time, velocity, params);
    else if (voice === 'clap') this.clap(time, velocity, params);
    else this.metal(voice, time, velocity, params);
  }

  private kick(time: number, velocity: number, params: DrumVoiceParams): void {
    const oscillator = this.context.createOscillator();
    oscillator.type = 'sine';
    const base = 38 + params.tune * 54;
    oscillator.frequency.setValueAtTime(base * (2.2 + params.pitchEnvelope * 2.8), time);
    oscillator.frequency.exponentialRampToValueAtTime(base, time + 0.025 + params.attack * 0.045);
    const click = this.context.createBufferSource();
    click.buffer = this.noiseBuffer;
    const clickFilter = this.context.createBiquadFilter();
    clickFilter.type = 'highpass';
    clickFilter.frequency.value = 1800 + params.attack * 6500;
    const mix = this.context.createGain();
    const envelope = this.context.createGain();
    const duration = 0.12 + params.decay * 1.1;
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(0.75 * velocity * (0.6 + params.body * 0.4), time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(mix);
    click.connect(clickFilter).connect(mix);
    clickFilter.frequency.value = 1800 + params.attack * 6500;
    mix.connect(envelope).connect(this.voiceBuses.get('kick')!.input);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.04);
    click.start(time);
    click.stop(time + 0.018);
    this.trackHit('kick', [oscillator, click], envelope, time + duration + 0.05);
  }

  private snare(time: number, velocity: number, params: DrumVoiceParams): void {
    const body = this.context.createOscillator();
    const ring = this.context.createOscillator();
    body.type = 'triangle';
    ring.type = 'sine';
    body.frequency.value = 135 + params.tune * 95;
    ring.frequency.value = body.frequency.value * 1.72;
    const noise = this.context.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1100 + params.tone * 4800;
    filter.Q.value = 0.5 + params.noise * 1.8;
    const mix = this.context.createGain();
    const bodyGain = this.context.createGain();
    bodyGain.gain.value = params.body * 0.75;
    const noiseGain = this.context.createGain();
    noiseGain.gain.value = 0.25 + params.noise * 0.75;
    const envelope = this.makeEnvelope(time, 0.06 + params.decay * 0.62, velocity * 0.64);
    body.connect(bodyGain).connect(mix);
    ring.connect(bodyGain).connect(mix);
    noise.connect(filter).connect(noiseGain).connect(mix);
    mix.connect(envelope).connect(this.voiceBuses.get('snare')!.input);
    const stop = time + 0.1 + params.decay * 0.7;
    body.start(time); ring.start(time); noise.start(time);
    body.stop(stop); ring.stop(stop); noise.stop(stop);
    this.trackHit('snare', [body, ring, noise], envelope, stop);
  }

  private tom(voice: 'lowTom' | 'midTom' | 'highTom', time: number, velocity: number, params: DrumVoiceParams): void {
    const oscillator = this.context.createOscillator();
    oscillator.type = params.tone > 0.58 ? 'triangle' : 'sine';
    const ranges = { lowTom: 72, midTom: 112, highTom: 166 };
    const base = ranges[voice] * (0.72 + params.tune * 0.7);
    oscillator.frequency.setValueAtTime(base * (1.1 + params.pitchEnvelope * 1.2), time);
    oscillator.frequency.exponentialRampToValueAtTime(base, time + 0.035 + params.pitchEnvelope * 0.09);
    const envelope = this.makeEnvelope(time, 0.1 + params.decay * 0.75, velocity * 0.62 * (0.6 + params.body * 0.4));
    oscillator.connect(envelope).connect(this.voiceBuses.get(voice)!.input);
    const stop = time + 0.14 + params.decay * 0.8;
    oscillator.start(time); oscillator.stop(stop);
    this.trackHit(voice, [oscillator], envelope, stop);
  }

  private rim(time: number, velocity: number, params: DrumVoiceParams): void {
    const first = this.context.createOscillator();
    const second = this.context.createOscillator();
    first.type = 'square'; second.type = 'triangle';
    first.frequency.value = 360 + params.tune * 380;
    second.frequency.value = first.frequency.value * 1.72;
    const mix = this.context.createGain();
    const envelope = this.makeEnvelope(time, 0.025 + params.decay * 0.12, velocity * 0.34);
    first.connect(mix); second.connect(mix); mix.connect(envelope).connect(this.voiceBuses.get('rim')!.input);
    const stop = time + 0.05 + params.decay * 0.14;
    first.start(time); second.start(time); first.stop(stop); second.stop(stop);
    this.trackHit('rim', [first, second], envelope, stop);
  }

  private clap(time: number, velocity: number, params: DrumVoiceParams): void {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900 + params.tone * 2300;
    filter.Q.value = 0.65;
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    const spread = 0.012 + params.spread * 0.018;
    for (let burst = 0; burst < 4; burst += 1) {
      const at = time + burst * spread;
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.linearRampToValueAtTime(velocity * (0.48 - burst * 0.055), at + 0.002);
      envelope.gain.exponentialRampToValueAtTime(0.015, at + 0.02);
    }
    const stop = time + spread * 3 + 0.08 + params.decay * 0.42;
    envelope.gain.exponentialRampToValueAtTime(0.0001, stop);
    noise.connect(filter).connect(envelope).connect(this.voiceBuses.get('clap')!.input);
    noise.start(time); noise.stop(stop + 0.02);
    this.trackHit('clap', [noise], envelope, stop + 0.03);
  }

  private metal(voice: 'closedHat' | 'openHat' | 'crash' | 'ride', time: number, velocity: number, params: DrumVoiceParams): void {
    const mix = this.context.createGain();
    const frequencies = [1, 1.342, 1.498, 1.823, 2.164, 2.627];
    const base = (voice === 'ride' ? 310 : 420) * (0.72 + params.tune * 0.72);
    const sources = frequencies.map((ratio, index) => {
      const oscillator = this.context.createOscillator();
      oscillator.type = index % 2 ? 'square' : 'triangle';
      oscillator.frequency.value = base * ratio * (0.96 + params.metallic * 0.08);
      const gain = this.context.createGain();
      gain.gain.value = 0.055 + params.metallic * 0.035;
      oscillator.connect(gain).connect(mix);
      return oscillator;
    });
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = voice === 'ride' ? 2800 : 4800 - params.tone * 1700;
    const duration = voice === 'closedHat' ? 0.035 + params.decay * 0.18 : voice === 'openHat' ? 0.18 + params.decay * 0.72 : 0.35 + params.decay * 1.6;
    const envelope = this.makeEnvelope(time, duration, velocity * (voice === 'closedHat' ? 0.34 : 0.28));
    mix.connect(filter).connect(envelope).connect(this.voiceBuses.get(voice)!.input);
    for (const oscillator of sources) { oscillator.start(time); oscillator.stop(time + duration + 0.04); }
    const hit = this.trackHit(voice, sources, envelope, time + duration + 0.05);
    if (voice === 'openHat') this.openHatHits.add(hit);
  }

  private chokeHats(time: number): void {
    for (const hit of [...this.openHatHits]) {
      try {
        hit.envelope.gain.cancelScheduledValues(time);
        hit.envelope.gain.setTargetAtTime(0.0001, time, 0.008);
        for (const source of hit.sources) source.stop(time + 0.04);
      } catch {
        // A source that just ended needs no further action.
      }
      this.openHatHits.delete(hit);
    }
  }

  private makeVoiceBus(): VoiceBus {
    const input = this.context.createGain();
    const tone = this.context.createBiquadFilter();
    tone.type = 'lowpass'; tone.frequency.value = 17000;
    const drive = this.context.createWaveShaper();
    drive.oversample = '2x'; drive.curve = this.driveCurve(0.1);
    const panner = this.context.createStereoPanner();
    const gain = this.context.createGain(); gain.gain.value = 0.5;
    const analyser = this.context.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.58;
    input.connect(tone).connect(drive).connect(panner).connect(gain).connect(analyser).connect(this.input);
    return { input, tone, drive, panner, gain, analyser };
  }

  private makeEnvelope(time: number, duration: number, peak: number): GainNode {
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    return envelope;
  }

  private trackHit(voice: DrumVoiceId, sources: AudioScheduledSourceNode[], envelope: GainNode, stopAt: number): ActiveHit {
    const hit = { voice, sources, envelope, stopAt };
    this.activeHits.add(hit);
    window.setTimeout(() => {
      this.activeHits.delete(hit);
      this.openHatHits.delete(hit);
      try { envelope.disconnect(); } catch { /* already disconnected */ }
    }, Math.max(80, (stopAt - this.context.currentTime) * 1000 + 80));
    return hit;
  }

  private stopHit(hit: ActiveHit, time: number): void {
    try {
      hit.envelope.gain.setTargetAtTime(0.0001, time, 0.004);
      for (const source of hit.sources) source.stop(time + 0.025);
    } catch {
      // Already stopped.
    }
    this.activeHits.delete(hit);
    this.openHatHits.delete(hit);
  }

  private makeNoiseBuffer(): AudioBuffer {
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let state = 0x51f15e;
    for (let index = 0; index < data.length; index += 1) {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      data[index] = ((state >>> 0) / 2147483648 - 1) * 0.92;
    }
    return buffer;
  }

  private driveCurve(amount: number): Float32Array<ArrayBuffer> {
    const curve = new Float32Array(1024);
    const drive = 1 + clamp(amount, 0, 1) * 18;
    for (let index = 0; index < curve.length; index += 1) {
      const x = (index / (curve.length - 1)) * 2 - 1;
      curve[index] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    return curve;
  }

  private colourCurve(driveAmount: number, bitReduction: number): Float32Array<ArrayBuffer> {
    const curve = this.driveCurve(driveAmount);
    const bits = Math.round(16 - clamp(bitReduction, 0, 1) * 11);
    const levels = Math.pow(2, bits - 1);
    if (bits >= 16) return curve;
    for (let index = 0; index < curve.length; index += 1)
      curve[index] = Math.round(curve[index]! * levels) / levels;
    return curve;
  }

  private makeRoomImpulse(): AudioBuffer {
    const length = Math.round(this.context.sampleRate * 0.62);
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    const random = new SeededRandom('RHYTHM-ROOM-IR');
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const envelope = Math.pow(1 - index / length, 4.2);
        data[index] = random.signed() * envelope * 0.54;
      }
    }
    return impulse;
  }

  private readRms(analyser: AnalyserNode): number {
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let energy = 0;
    for (const sample of data) energy += sample * sample;
    return Math.sqrt(energy / data.length);
  }
}

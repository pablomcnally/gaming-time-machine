import chatterBeaconUrl from '../assets/atmosphere/chatter-beacon.wav?url';
import chatterCopyUrl from '../assets/atmosphere/chatter-copy.wav?url';
import chatterPositionUrl from '../assets/atmosphere/chatter-position.wav?url';
import chatterStandbyUrl from '../assets/atmosphere/chatter-standby.wav?url';
import curfewInspectionUrl from '../assets/atmosphere/curfew-inspection.wav?url';
import easternWeatherUrl from '../assets/atmosphere/eastern-weather.wav?url';
import frenchBeaconUrl from '../assets/atmosphere/fr-balise.wav?url';
import frenchIdentificationUrl from '../assets/atmosphere/fr-identification.wav?url';
import frenchPositionUrl from '../assets/atmosphere/fr-position.wav?url';
import frenchPlatformUrl from '../assets/atmosphere/fr-quai-neuf.wav?url';
import frenchNetworkUrl from '../assets/atmosphere/fr-reseau.wav?url';
import frenchVisibilityUrl from '../assets/atmosphere/fr-visibilite.wav?url';
import georgeChannelUrl from '../assets/atmosphere/george-channel.wav?url';
import georgeSecurityUrl from '../assets/atmosphere/george-security.wav?url';
import georgeSignalUrl from '../assets/atmosphere/george-signal.wav?url';
import georgeWeatherUrl from '../assets/atmosphere/george-weather.wav?url';
import offworldDelayUrl from '../assets/atmosphere/offworld-delay.wav?url';
import orbitalShuttleUrl from '../assets/atmosphere/orbital-shuttle.wav?url';
import platformTwelveUrl from '../assets/atmosphere/platform-twelve.wav?url';
import sectorNineUrl from '../assets/atmosphere/sector-nine.wav?url';
import serviceChannelUrl from '../assets/atmosphere/service-channel.wav?url';
import transitDeckUrl from '../assets/atmosphere/transit-deck.wav?url';
import visibilityUrl from '../assets/atmosphere/visibility.wav?url';
import weatherGridUrl from '../assets/atmosphere/weather-grid.wav?url';
import type {
  AmbientLayerState,
  AtmosphereState,
  BinauralState,
  ChordState,
  DriftPreset,
  EvolutionFrame,
  ImportedSoundState,
  PulseState,
  SaxState,
  VoiceState,
  Waveform,
} from '../types';
import { clamp, centsToRatio, midiToHz, safeParam } from './math';
import { chordMidiNotes } from './chords';
import { SeededRandom } from './seeded';

interface SourceUnit {
  node: OscillatorNode | AudioBufferSourceNode;
  gain: GainNode;
  ratio: number;
  detuneOffset: number;
}

interface VoiceUnit {
  input: GainNode;
  filter: BiquadFilterNode;
  panner: StereoPannerNode;
  gain: GainNode;
  sources: SourceUnit[];
  signature: string;
}

interface RecorderState {
  node: ScriptProcessorNode;
  silent: GainNode;
  source: AudioNode;
  chunks: Int16Array[];
  startedAt: number;
}

interface SpeechClip {
  url: string;
  lowVoice?: boolean;
}

export interface CustomSpeechClip extends SpeechClip {
  kind: 'chatter' | 'transmission';
}

interface ImportedLoopUnit {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: StereoPannerNode;
}

export interface MeterFrame {
  rms: number;
  peak: number;
  spectrum: Uint8Array;
  waveform: Uint8Array;
}

export type AtmosphereEventKind = 'sonar' | 'thunder' | 'chatter' | 'transmission';
export type AtmosphereStatus = AtmosphereEventKind | 'custom' | 'waiting';

type AtmosphereSelection =
  { type: 'built-in'; kind: AtmosphereEventKind } | { type: 'custom'; id: string };

const scaleMap: Record<string, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  minor: [0, 3, 5, 7, 10],
  major: [0, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  'whole-tone': [0, 2, 4, 6, 8, 10],
  fifths: [0, 7, 12, 19],
  harmonic: [0, 12, 19, 24, 28, 31],
  just: [0, 3.86, 7.02, 9.69, 12],
  inharmonic: [0, 4.3, 7.7, 11.2],
  microtonal: [0, 1.35, 3.8, 6.4, 8.85, 10.55],
  free: [0],
};

export class DriftEngine {
  readonly context: AudioContext;
  private masterInput: GainNode;
  private masterToneHigh: BiquadFilterNode;
  private masterToneLow: BiquadFilterNode;
  private bitCrusher: WaveShaperNode;
  private saturator: WaveShaperNode;
  private dry: GainNode;
  private effectReturn: GainNode;
  private chorusDelay: DelayNode;
  private chorusGain: GainNode;
  private chorusLfo: OscillatorNode;
  private chorusLfoGain: GainNode;
  private phaser: BiquadFilterNode;
  private phaserGain: GainNode;
  private phaserLfo: OscillatorNode;
  private phaserLfoGain: GainNode;
  private flanger: DelayNode;
  private flangerFeedback: GainNode;
  private flangerGain: GainNode;
  private delay: DelayNode;
  private delayFeedback: GainNode;
  private delayGain: GainNode;
  private convolver: ConvolverNode;
  private reverbGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private limiter: DynamicsCompressorNode;
  private masterGain: GainNode;
  private panicGain: GainNode;
  private analyser: AnalyserNode;
  private droneInstrumentInput: GainNode;
  private droneInstrumentLow: BiquadFilterNode;
  private droneInstrumentHigh: BiquadFilterNode;
  private droneInstrumentGain: GainNode;
  private droneInstrumentAnalyser: AnalyserNode;
  private rhythmInstrumentInput: GainNode;
  private rhythmInstrumentLow: BiquadFilterNode;
  private rhythmInstrumentHigh: BiquadFilterNode;
  private rhythmInstrumentGain: GainNode;
  private rhythmInstrumentAnalyser: AnalyserNode;
  private droneBusLevel = 0.78;
  private rhythmBusLevel = 0.76;
  private droneHighDb = 0;
  private voiceUnits: VoiceUnit[] = [];
  private noiseBuffer: AudioBuffer;
  private droneBus: GainNode;
  private chordBus: GainNode;
  private atmosphereBus: GainNode;
  private ambientBus: GainNode;
  private atmosphereDelay: DelayNode;
  private atmosphereFeedback: GainNode;
  private rainSource: AudioBufferSourceNode;
  private rainFilter: BiquadFilterNode;
  private rainGain: GainNode;
  private rainLfo: OscillatorNode;
  private rainLfoGain: GainNode;
  private binauralLeft: OscillatorNode;
  private binauralRight: OscillatorNode;
  private binauralLeftGain: GainNode;
  private binauralRightGain: GainNode;
  private binauralMerger: ChannelMergerNode;
  private binauralGain: GainNode;
  private ambientRandom = new SeededRandom('DRIFT-AMBIENT');
  private ambientSeed = '';
  private nextAmbientAt = 0;
  private ambientCount = 0;
  private activeAmbientCleanups = new Set<() => void>();
  private saxRandom = new SeededRandom('DRIFT-NIGHT-SAX');
  private saxSeed = '';
  private nextSaxAt = 0;
  private saxCount = 0;
  private activeSaxCleanups = new Set<() => void>();
  private nextAtmosphereEventAt = 0;
  private atmosphereFrozen = false;
  private lastAtmosphereEvent: AtmosphereStatus = 'waiting';
  private atmosphereRandom = new SeededRandom('DRIFT-ATMOSPHERE');
  private atmosphereSeed = '';
  private importedSounds: ImportedSoundState[] = [];
  private importedBuffers = new Map<string, AudioBuffer>();
  private importedLoops = new Map<string, ImportedLoopUnit>();
  private activeImportedEvents = new Set<AudioBufferSourceNode>();
  private pulseRandom = new SeededRandom('DRIFT-PULSE');
  private pulseSeed = '';
  private nextPulseAt = 0;
  private lastPulseAt = -1;
  private pulseCount = 0;
  private nextChordAt = 0;
  private chordStepIndex = 0;
  private lastChordStep = -1;
  private chordTriggerCount = 0;
  private activeChordCleanups = new Set<() => void>();
  private transmissionClips: SpeechClip[] = [
    { url: sectorNineUrl },
    { url: transitDeckUrl },
    { url: visibilityUrl },
    { url: weatherGridUrl },
    { url: offworldDelayUrl, lowVoice: true },
    { url: platformTwelveUrl, lowVoice: true },
    { url: curfewInspectionUrl, lowVoice: true },
    { url: easternWeatherUrl },
    { url: serviceChannelUrl },
    { url: orbitalShuttleUrl },
    { url: georgeSecurityUrl },
    { url: georgeSignalUrl },
    { url: frenchPlatformUrl },
    { url: frenchVisibilityUrl },
    { url: frenchIdentificationUrl },
    { url: frenchNetworkUrl },
  ];
  private chatterClips: SpeechClip[] = [
    { url: chatterBeaconUrl, lowVoice: true },
    { url: chatterPositionUrl, lowVoice: true },
    { url: chatterCopyUrl },
    { url: chatterStandbyUrl },
    { url: georgeChannelUrl },
    { url: georgeWeatherUrl },
    { url: frenchBeaconUrl },
    { url: frenchPositionUrl },
  ];
  private customTransmissionClips: SpeechClip[] = [];
  private customChatterClips: SpeechClip[] = [];
  private activeSpeechCleanups = new Set<() => void>();
  private recorder: RecorderState | null = null;
  private muted = true;
  private currentPreset: DriftPreset | null = null;

  constructor(sampleRate = 48000, latencyHint: AudioContextLatencyCategory = 'balanced') {
    this.context = new AudioContext({ sampleRate, latencyHint });
    this.masterInput = this.context.createGain();
    this.masterInput.gain.value = 0.42;

    this.masterToneHigh = this.context.createBiquadFilter();
    this.masterToneHigh.type = 'highpass';
    this.masterToneHigh.frequency.value = 24;
    this.masterToneHigh.Q.value = 0.7;
    this.masterToneLow = this.context.createBiquadFilter();
    this.masterToneLow.type = 'lowpass';
    this.masterToneLow.frequency.value = 15500;
    this.masterToneLow.Q.value = 0.7;
    this.bitCrusher = this.context.createWaveShaper();
    this.bitCrusher.oversample = 'none';
    this.bitCrusher.curve = this.makeBitReductionCurve(0);
    this.saturator = this.context.createWaveShaper();
    this.saturator.oversample = '4x';
    this.saturator.curve = this.makeSaturationCurve(0.12);

    this.dry = this.context.createGain();
    this.dry.gain.value = 0.78;
    this.effectReturn = this.context.createGain();
    this.effectReturn.gain.value = 0.7;

    this.chorusDelay = this.context.createDelay(0.08);
    this.chorusDelay.delayTime.value = 0.024;
    this.chorusGain = this.context.createGain();
    this.chorusGain.gain.value = 0.2;
    this.chorusLfo = this.context.createOscillator();
    this.chorusLfo.type = 'sine';
    this.chorusLfo.frequency.value = 0.11;
    this.chorusLfoGain = this.context.createGain();
    this.chorusLfoGain.gain.value = 0.0045;
    this.chorusLfo.connect(this.chorusLfoGain).connect(this.chorusDelay.delayTime);
    this.chorusLfo.start();

    this.phaser = this.context.createBiquadFilter();
    this.phaser.type = 'allpass';
    this.phaser.frequency.value = 620;
    this.phaser.Q.value = 2.5;
    this.phaserGain = this.context.createGain();
    this.phaserGain.gain.value = 0.12;
    this.phaserLfo = this.context.createOscillator();
    this.phaserLfo.frequency.value = 0.037;
    this.phaserLfoGain = this.context.createGain();
    this.phaserLfoGain.gain.value = 390;
    this.phaserLfo.connect(this.phaserLfoGain).connect(this.phaser.frequency);
    this.phaserLfo.start();

    this.flanger = this.context.createDelay(0.05);
    this.flanger.delayTime.value = 0.007;
    this.flangerFeedback = this.context.createGain();
    this.flangerFeedback.gain.value = 0.18;
    this.flangerGain = this.context.createGain();
    this.flangerGain.gain.value = 0.05;
    this.flanger.connect(this.flangerFeedback).connect(this.flanger);

    this.delay = this.context.createDelay(8);
    this.delay.delayTime.value = 1.45;
    this.delayFeedback = this.context.createGain();
    this.delayFeedback.gain.value = 0.35;
    this.delayGain = this.context.createGain();
    this.delayGain.gain.value = 0.18;
    this.delay.connect(this.delayFeedback).connect(this.delay);

    this.convolver = this.context.createConvolver();
    this.convolver.buffer = this.makeImpulse(14);
    this.reverbGain = this.context.createGain();
    this.reverbGain.gain.value = 0.48;

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 2.4;
    this.compressor.attack.value = 0.08;
    this.compressor.release.value = 0.8;
    this.limiter = this.context.createDynamicsCompressor();
    this.limiter.threshold.value = -3;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.16;
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.36;
    this.panicGain = this.context.createGain();
    this.panicGain.gain.value = 0;
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.88;

    this.droneInstrumentInput = this.context.createGain();
    this.droneInstrumentLow = this.context.createBiquadFilter();
    this.droneInstrumentLow.type = 'lowshelf';
    this.droneInstrumentLow.frequency.value = 180;
    this.droneInstrumentHigh = this.context.createBiquadFilter();
    this.droneInstrumentHigh.type = 'highshelf';
    this.droneInstrumentHigh.frequency.value = 5200;
    this.droneInstrumentGain = this.context.createGain();
    this.droneInstrumentGain.gain.value = this.droneBusLevel;
    this.droneInstrumentAnalyser = this.context.createAnalyser();
    this.droneInstrumentAnalyser.fftSize = 256;
    this.droneInstrumentAnalyser.smoothingTimeConstant = 0.76;

    this.rhythmInstrumentInput = this.context.createGain();
    this.rhythmInstrumentLow = this.context.createBiquadFilter();
    this.rhythmInstrumentLow.type = 'lowshelf';
    this.rhythmInstrumentLow.frequency.value = 180;
    this.rhythmInstrumentHigh = this.context.createBiquadFilter();
    this.rhythmInstrumentHigh.type = 'highshelf';
    this.rhythmInstrumentHigh.frequency.value = 5200;
    this.rhythmInstrumentGain = this.context.createGain();
    this.rhythmInstrumentGain.gain.value = this.rhythmBusLevel;
    this.rhythmInstrumentAnalyser = this.context.createAnalyser();
    this.rhythmInstrumentAnalyser.fftSize = 256;
    this.rhythmInstrumentAnalyser.smoothingTimeConstant = 0.7;

    this.masterInput
      .connect(this.masterToneHigh)
      .connect(this.masterToneLow)
      .connect(this.bitCrusher)
      .connect(this.saturator);
    this.saturator.connect(this.dry).connect(this.compressor);
    this.saturator.connect(this.chorusDelay).connect(this.chorusGain).connect(this.effectReturn);
    this.saturator.connect(this.phaser).connect(this.phaserGain).connect(this.effectReturn);
    this.saturator.connect(this.flanger).connect(this.flangerGain).connect(this.effectReturn);
    this.saturator.connect(this.delay).connect(this.delayGain).connect(this.effectReturn);
    this.saturator.connect(this.convolver).connect(this.reverbGain).connect(this.effectReturn);
    this.effectReturn.connect(this.compressor);
    this.droneInstrumentInput
      .connect(this.droneInstrumentLow)
      .connect(this.droneInstrumentHigh)
      .connect(this.droneInstrumentGain)
      .connect(this.droneInstrumentAnalyser)
      .connect(this.masterInput);
    this.rhythmInstrumentInput
      .connect(this.rhythmInstrumentLow)
      .connect(this.rhythmInstrumentHigh)
      .connect(this.rhythmInstrumentGain)
      .connect(this.rhythmInstrumentAnalyser)
      .connect(this.masterInput);

    this.binauralLeft = this.context.createOscillator();
    this.binauralRight = this.context.createOscillator();
    this.binauralLeft.type = 'sine';
    this.binauralRight.type = 'sine';
    this.binauralLeftGain = this.context.createGain();
    this.binauralRightGain = this.context.createGain();
    this.binauralLeftGain.gain.value = 0.5;
    this.binauralRightGain.gain.value = 0.5;
    this.binauralMerger = this.context.createChannelMerger(2);
    this.binauralGain = this.context.createGain();
    this.binauralGain.gain.value = 0;
    this.binauralLeft.connect(this.binauralLeftGain).connect(this.binauralMerger, 0, 0);
    this.binauralRight.connect(this.binauralRightGain).connect(this.binauralMerger, 0, 1);
    this.binauralMerger.connect(this.binauralGain).connect(this.droneInstrumentInput);
    this.binauralLeft.start();
    this.binauralRight.start();
    this.compressor
      .connect(this.limiter)
      .connect(this.masterGain)
      .connect(this.panicGain)
      .connect(this.analyser)
      .connect(this.context.destination);

    this.noiseBuffer = this.makeNoiseBuffer();

    this.droneBus = this.context.createGain();
    this.droneBus.gain.value = 0.7;
    this.droneBus.connect(this.droneInstrumentInput);

    this.chordBus = this.context.createGain();
    this.chordBus.gain.value = 0.82;
    this.chordBus.connect(this.droneInstrumentInput);

    this.ambientBus = this.context.createGain();
    this.ambientBus.gain.value = 0.72;
    this.ambientBus.connect(this.droneInstrumentInput);

    this.atmosphereBus = this.context.createGain();
    this.atmosphereBus.gain.value = 0.92;
    this.atmosphereDelay = this.context.createDelay(8);
    this.atmosphereDelay.delayTime.value = 1.8;
    this.atmosphereFeedback = this.context.createGain();
    this.atmosphereFeedback.gain.value = 0.38;
    this.atmosphereBus.connect(this.droneInstrumentInput);
    this.atmosphereBus.connect(this.atmosphereDelay);
    this.atmosphereDelay.connect(this.atmosphereFeedback).connect(this.atmosphereDelay);
    this.atmosphereDelay.connect(this.droneInstrumentInput);

    this.rainSource = this.context.createBufferSource();
    this.rainSource.buffer = this.noiseBuffer;
    this.rainSource.loop = true;
    this.rainFilter = this.context.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.value = 3100;
    this.rainFilter.Q.value = 0.55;
    this.rainGain = this.context.createGain();
    this.rainGain.gain.value = 0;
    this.rainLfo = this.context.createOscillator();
    this.rainLfo.frequency.value = 0.035;
    this.rainLfoGain = this.context.createGain();
    this.rainLfoGain.gain.value = 900;
    this.rainLfo.connect(this.rainLfoGain).connect(this.rainFilter.frequency);
    this.rainSource.connect(this.rainFilter).connect(this.rainGain).connect(this.atmosphereBus);
    this.rainSource.start();
    this.rainLfo.start();
  }

  private makeNoiseBuffer(): AudioBuffer {
    const length = Math.max(2, this.context.sampleRate * 4);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.965 + white * 0.035;
      data[index] = clamp(last * 2.2, -1, 1);
    }
    return buffer;
  }

  private makeImpulse(decay: number): AudioBuffer {
    const seconds = clamp(decay, 1, 45);
    const length = Math.floor(this.context.sampleRate * seconds);
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      let filtered = 0;
      for (let index = 0; index < length; index += 1) {
        const envelope = Math.pow(1 - index / length, 2.2);
        filtered = filtered * 0.72 + (Math.random() * 2 - 1) * 0.28;
        data[index] = filtered * envelope * 0.85;
      }
    }
    return impulse;
  }

  private makeSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
    const size = 4096;
    const curve = new Float32Array(size);
    const drive = 1 + clamp(amount, 0, 1) * 24;
    for (let index = 0; index < size; index += 1) {
      const x = (index / (size - 1)) * 2 - 1;
      curve[index] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    return curve;
  }

  private makeBitReductionCurve(amount: number): Float32Array<ArrayBuffer> {
    const size = 4096;
    const curve = new Float32Array(size);
    const bits = Math.round(16 - clamp(amount, 0, 1) * 12);
    const steps = Math.pow(2, bits - 1);
    for (let index = 0; index < size; index += 1) {
      const x = (index / (size - 1)) * 2 - 1;
      curve[index] = Math.round(x * steps) / steps;
    }
    return curve;
  }

  private createSource(
    waveform: Waveform,
    ratio: number,
    detuneOffset: number,
    destination: AudioNode,
  ): SourceUnit {
    const gain = this.context.createGain();
    gain.gain.value = ratio === 1 ? 0.5 : 0;
    let node: OscillatorNode | AudioBufferSourceNode;
    if (waveform === 'noise') {
      const noise = this.context.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;
      node = noise;
    } else {
      const oscillator = this.context.createOscillator();
      oscillator.type = waveform;
      oscillator.frequency.value = 55 * ratio;
      oscillator.detune.value = detuneOffset;
      node = oscillator;
    }
    node.connect(gain).connect(destination);
    node.start();
    return { node, gain, ratio, detuneOffset };
  }

  private signature(voice: VoiceState): string {
    return `${voice.waveform}:${voice.unison}`;
  }

  private buildVoice(voice: VoiceState): VoiceUnit {
    const input = this.context.createGain();
    input.gain.value = 0.66;
    const filter = this.context.createBiquadFilter();
    filter.type = voice.filterType;
    const panner = this.context.createStereoPanner();
    const gain = this.context.createGain();
    gain.gain.value = 0;
    input.connect(filter).connect(panner).connect(gain).connect(this.droneBus);

    const sources: SourceUnit[] = [];
    if (voice.waveform === 'noise') {
      sources.push(this.createSource('noise', 1, 0, input));
    } else {
      const count = clamp(Math.round(voice.unison), 1, 4);
      for (let index = 0; index < count; index += 1) {
        const spread = index - (count - 1) / 2;
        sources.push(this.createSource(voice.waveform, 1, spread * voice.detune, input));
      }
      sources.push(this.createSource(voice.waveform, 0.5, -voice.detune * 0.4, input));
      sources.push(this.createSource(voice.waveform, 1.5, voice.detune * 0.25, input));
      sources.push(this.createSource(voice.waveform, 2, voice.detune * 0.5, input));
    }
    return { input, filter, panner, gain, sources, signature: this.signature(voice) };
  }

  private destroyVoice(unit: VoiceUnit): void {
    const now = this.context.currentTime;
    safeParam(unit.gain.gain, 0, now, 0.03);
    window.setTimeout(() => {
      for (const source of unit.sources) {
        try {
          source.node.stop();
          source.node.disconnect();
          source.gain.disconnect();
        } catch {
          // The source may already have been stopped during shutdown.
        }
      }
      unit.input.disconnect();
      unit.filter.disconnect();
      unit.panner.disconnect();
      unit.gain.disconnect();
    }, 120);
  }

  async start(): Promise<void> {
    if (this.context.state !== 'running') await this.context.resume();
  }

  async setOutputDevice(deviceId: string): Promise<boolean> {
    const context = this.context as AudioContext & {
      setSinkId?: (sinkId: string) => Promise<void>;
    };
    if (!context.setSinkId || !deviceId) return false;
    try {
      await context.setSinkId(deviceId);
      return true;
    } catch {
      return false;
    }
  }

  setMuted(muted: boolean, immediate = false): void {
    this.muted = muted;
    const now = this.context.currentTime;
    safeParam(this.panicGain.gain, muted ? 0 : 1, now, immediate ? 0.005 : 0.08);
  }

  get isMuted(): boolean {
    return this.muted;
  }

  panic(fadeSeconds = 0): void {
    this.muted = true;
    const now = this.context.currentTime;
    const duration = clamp(fadeSeconds, 0, 30);
    const gain = this.panicGain.gain;

    if (duration <= 0.01) {
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(0, now);
      return;
    }

    if (typeof gain.cancelAndHoldAtTime === 'function') {
      gain.cancelAndHoldAtTime(now);
    } else {
      const current = gain.value;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(current, now);
    }
    gain.linearRampToValueAtTime(0, now + duration);
  }

  private pitchForVoice(preset: DriftPreset, voice: VoiceState, index: number): number {
    const scale = scaleMap[preset.tuning.mode] ?? scaleMap.free!;
    let interval = voice.coarse;
    if (preset.tuning.mode !== 'free') {
      const noteIndex = Math.abs(Math.round(voice.coarse / 2) + index) % scale.length;
      interval = Math.floor(voice.coarse / 12) * 12 + scale[noteIndex]!;
    }
    if (preset.tuning.temperament === 'just' && preset.tuning.mode !== 'free') {
      const ratios = preset.tuning.customRatios.length
        ? preset.tuning.customRatios
        : [1, 5 / 4, 3 / 2, 2];
      const ratio = ratios[index % ratios.length] ?? 1;
      return midiToHz(preset.tuning.root + Math.floor(voice.coarse / 12) * 12) * ratio;
    }
    return midiToHz(preset.tuning.root + interval) * centsToRatio(voice.fine);
  }

  setAtmosphereFrozen(frozen: boolean): void {
    this.atmosphereFrozen = frozen;
  }

  getAtmosphereStatus(): AtmosphereStatus {
    return this.lastAtmosphereEvent;
  }

  async registerImportedSound(id: string, bytes: Uint8Array): Promise<boolean> {
    try {
      const copy = bytes.slice();
      const buffer = await this.context.decodeAudioData(copy.buffer as ArrayBuffer);
      if (!buffer.length || !Number.isFinite(buffer.duration)) return false;
      this.importedBuffers.set(id, buffer);
      this.syncImportedLoops();
      return true;
    } catch {
      this.importedBuffers.delete(id);
      return false;
    }
  }

  setImportedSounds(sounds: ImportedSoundState[]): void {
    this.importedSounds = sounds.map((sound) => ({ ...sound }));
    this.syncImportedLoops();
  }

  removeImportedSound(id: string): void {
    this.stopImportedLoop(id);
    this.importedBuffers.delete(id);
    this.importedSounds = this.importedSounds.filter((sound) => sound.id !== id);
  }

  private stopImportedLoop(id: string, immediate = false): void {
    const unit = this.importedLoops.get(id);
    if (!unit) return;
    this.importedLoops.delete(id);
    unit.source.onended = null;
    const stop = () => {
      try {
        unit.source.stop();
      } catch {
        // The source may already have reached its natural end during shutdown.
      }
      unit.source.disconnect();
      unit.gain.disconnect();
      unit.panner.disconnect();
    };
    if (immediate) {
      stop();
    } else {
      safeParam(unit.gain.gain, 0, this.context.currentTime, 0.08);
      window.setTimeout(stop, 360);
    }
  }

  private syncImportedLoops(): void {
    const now = this.context.currentTime;
    for (const id of [...this.importedLoops.keys()]) {
      const state = this.importedSounds.find((sound) => sound.id === id);
      if (!state?.enabled || state.mode !== 'loop' || !this.importedBuffers.has(id)) {
        this.stopImportedLoop(id);
      }
    }

    for (const state of this.importedSounds) {
      if (!state.enabled || state.mode !== 'loop') continue;
      const buffer = this.importedBuffers.get(state.id);
      if (!buffer) continue;
      let unit = this.importedLoops.get(state.id);
      if (!unit) {
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        const panner = this.context.createStereoPanner();
        source.buffer = buffer;
        source.loop = true;
        gain.gain.value = 0;
        panner.pan.value = this.atmosphereRandom.signed() * 0.35;
        source.connect(gain).connect(panner).connect(this.atmosphereBus);
        source.start();
        unit = { source, gain, panner };
        this.importedLoops.set(state.id, unit);
      }
      safeParam(unit.gain.gain, clamp(state.level * 0.34, 0, 0.34), now, 0.3);
      safeParam(unit.source.playbackRate, clamp(state.rate, 0.25, 3), now, 0.2);
    }
  }

  triggerImportedSound(id: string): boolean {
    const state = this.importedSounds.find((sound) => sound.id === id);
    const buffer = this.importedBuffers.get(id);
    if (!state?.enabled || !buffer) return false;

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    source.buffer = buffer;
    source.playbackRate.value = clamp(
      state.rate *
        Math.pow(
          2,
          this.atmosphereRandom.signed() *
            (this.currentPreset?.atmosphere.randomness ?? 0.5) *
            0.16,
        ),
      0.25,
      3,
    );
    gain.gain.value = clamp(state.level * 0.46, 0.01, 0.46);
    panner.pan.value = this.atmosphereRandom.signed() * 0.75;
    source.connect(gain).connect(panner).connect(this.atmosphereBus);
    const cleanup = () => {
      source.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.activeImportedEvents.delete(source);
    };
    source.addEventListener('ended', cleanup, { once: true });
    this.activeImportedEvents.add(source);
    source.start();
    this.lastAtmosphereEvent = 'custom';
    return true;
  }

  private atmosphereLevel(kind: AtmosphereEventKind, state: AtmosphereState): number {
    switch (kind) {
      case 'sonar':
        return state.sonar;
      case 'thunder':
        return state.thunder;
      case 'chatter':
        return state.chatter;
      case 'transmission':
        return state.transmission;
    }
  }

  private chooseAtmosphereEvent(state: AtmosphereState): AtmosphereSelection | null {
    const weighted: Array<[AtmosphereSelection, number]> = [
      [{ type: 'built-in', kind: 'sonar' }, state.sonar],
      [{ type: 'built-in', kind: 'thunder' }, state.thunder],
      [{ type: 'built-in', kind: 'chatter' }, state.chatter],
      [{ type: 'built-in', kind: 'transmission' }, state.transmission],
      ...this.importedSounds
        .filter(
          (sound) =>
            sound.enabled &&
            sound.mode === 'event' &&
            sound.automatic &&
            this.importedBuffers.has(sound.id),
        )
        .map((sound): [AtmosphereSelection, number] => [
          { type: 'custom', id: sound.id },
          sound.weight * sound.level,
        ]),
    ];
    const total = weighted.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
    if (total <= 0.001) return null;
    let cursor = this.atmosphereRandom.range(0, total);
    for (const [selection, weight] of weighted) {
      cursor -= Math.max(0, weight);
      if (cursor <= 0) return selection;
    }
    return weighted[weighted.length - 1]![0];
  }

  private scheduleNextAtmosphereEvent(state: AtmosphereState, now: number): void {
    const baseSeconds = 150 - state.activity * 140;
    const variation = 1 + this.atmosphereRandom.signed() * state.randomness * 0.7;
    this.nextAtmosphereEventAt = now + clamp(baseSeconds * variation, 4, 240);
  }

  private triggerSonar(level: number, state: AtmosphereState): void {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    oscillator.type = 'sine';
    oscillator.frequency.value = this.atmosphereRandom.range(520, 1180);
    panner.pan.value = this.atmosphereRandom.signed() * (0.25 + state.distance * 0.65);
    gain.gain.value = 0.0001;
    oscillator.connect(gain).connect(panner).connect(this.atmosphereBus);
    const strength = clamp(level * (0.14 + (1 - state.distance) * 0.12), 0.003, 0.22);
    const repeats = state.echo > 0.62 ? 3 : 2;
    for (let index = 0; index < repeats; index += 1) {
      const at = now + index * (0.82 + state.distance * 0.8);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(strength * Math.pow(0.62, index), at + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.7 + state.distance * 1.1);
    }
    oscillator.start(now);
    oscillator.stop(now + repeats * 2.4);
  }

  private triggerThunder(level: number, state: AtmosphereState): void {
    const now = this.context.currentTime;
    const noise = this.context.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    noise.playbackRate.value = this.atmosphereRandom.range(0.32, 0.62);
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.atmosphereRandom.range(95, 240);
    filter.Q.value = 0.8;
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    panner.pan.value = this.atmosphereRandom.signed() * 0.5;
    const distanceGain = 0.42 - state.distance * 0.18;
    const peak = clamp(level * distanceGain, 0.008, 0.34);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(peak * 0.42, now + 1.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5 + state.distance * 4);
    noise.connect(filter).connect(gain).connect(panner).connect(this.atmosphereBus);
    noise.start(now);
    noise.stop(now + 10);

    const boom = this.context.createOscillator();
    const boomGain = this.context.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(this.atmosphereRandom.range(34, 58), now);
    boom.frequency.exponentialRampToValueAtTime(24, now + 3.2);
    boomGain.gain.setValueAtTime(0.0001, now);
    boomGain.gain.exponentialRampToValueAtTime(peak * 0.86, now + 0.08);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.4);
    boom.connect(boomGain).connect(panner);
    boom.start(now);
    boom.stop(now + 4.6);
  }

  private mappedSpeechRate(value: number): number {
    return value <= 0.5 ? 0.35 + value * 1.3 : 1 + (value - 0.5) * 2.4;
  }

  private playSpeechClip(
    clip: SpeechClip,
    level: number,
    state: AtmosphereState,
    kind: 'chatter' | 'transmission',
  ): void {
    const media = new Audio(clip.url);
    media.preload = 'auto';
    media.preservesPitch = false;
    const mappedRate = this.mappedSpeechRate(state.speechRate);
    const voiceScale = clip.lowVoice ? 0.72 : 1;
    const nominalRate = clamp(
      mappedRate *
        voiceScale *
        Math.pow(2, this.atmosphereRandom.signed() * state.randomness * 0.08),
      0.22,
      2.6,
    );
    media.playbackRate = nominalRate;

    const source = this.context.createMediaElementSource(media);
    const filter = this.context.createBiquadFilter();
    const distortion = this.context.createWaveShaper();
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    filter.type = 'bandpass';
    filter.frequency.value =
      kind === 'chatter'
        ? this.atmosphereRandom.range(1250, 2200)
        : this.atmosphereRandom.range(1000, 1750);
    filter.Q.value = (kind === 'chatter' ? 0.9 : 0.65) + state.distance * 1.4;
    distortion.curve = this.makeSaturationCurve(
      (kind === 'chatter' ? 0.48 : 0.3) + state.distance * 0.22 + state.speechGlitch * 0.5,
    );
    distortion.oversample = '2x';
    gain.gain.value =
      kind === 'chatter'
        ? clamp(level * (0.36 - state.distance * 0.12), 0.025, 0.3)
        : clamp(level * (0.17 - state.distance * 0.065), 0.012, 0.18);
    panner.pan.value = this.atmosphereRandom.signed() * 0.8;
    source
      .connect(filter)
      .connect(distortion)
      .connect(gain)
      .connect(panner)
      .connect(this.atmosphereBus);

    let glitchTimer: number | undefined;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (glitchTimer !== undefined) window.clearInterval(glitchTimer);
      media.pause();
      source.disconnect();
      filter.disconnect();
      distortion.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.activeSpeechCleanups.delete(cleanup);
    };
    this.activeSpeechCleanups.add(cleanup);
    media.addEventListener('ended', cleanup, { once: true });
    media.addEventListener('error', cleanup, { once: true });

    if (state.speechGlitch > 0.01) {
      const interval = Math.round(780 - state.speechGlitch * 620);
      glitchTimer = window.setInterval(() => {
        if (media.ended) return;
        if (this.atmosphereRandom.next() < state.speechGlitch * 0.82) {
          media.playbackRate = clamp(
            nominalRate * Math.pow(2, this.atmosphereRandom.signed() * state.speechGlitch * 0.95),
            0.18,
            3,
          );
          if (
            state.speechGlitch > 0.52 &&
            media.currentTime > 0.4 &&
            this.atmosphereRandom.next() < state.speechGlitch * 0.34
          ) {
            media.currentTime = Math.max(
              0,
              media.currentTime - this.atmosphereRandom.range(0.08, 0.42),
            );
          }
        } else {
          media.playbackRate = nominalRate;
        }
      }, interval);
    }
    void media.play().catch(cleanup);
  }

  private triggerChatter(level: number, state: AtmosphereState): void {
    this.playSpeechClip(
      this.atmosphereRandom.pick([...this.chatterClips, ...this.customChatterClips]),
      level,
      state,
      'chatter',
    );
  }

  private triggerTransmission(level: number, state: AtmosphereState): void {
    this.playSpeechClip(
      this.atmosphereRandom.pick([...this.transmissionClips, ...this.customTransmissionClips]),
      level,
      state,
      'transmission',
    );
  }

  setCustomSpeechClips(clips: CustomSpeechClip[]): void {
    this.customChatterClips = clips
      .filter((clip) => clip.kind === 'chatter')
      .map(({ url, lowVoice }) => ({ url, lowVoice }));
    this.customTransmissionClips = clips
      .filter((clip) => clip.kind === 'transmission')
      .map(({ url, lowVoice }) => ({ url, lowVoice }));
  }

  getCustomSpeechCount(): number {
    return this.customChatterClips.length + this.customTransmissionClips.length;
  }

  triggerAtmosphere(kind: AtmosphereEventKind): void {
    const state = this.currentPreset?.atmosphere;
    if (!state || !state.enabled) return;
    const level = this.atmosphereLevel(kind, state);
    if (level <= 0.001) return;
    this.lastAtmosphereEvent = kind;
    switch (kind) {
      case 'sonar':
        this.triggerSonar(level, state);
        break;
      case 'thunder':
        this.triggerThunder(level, state);
        break;
      case 'chatter':
        this.triggerChatter(level, state);
        break;
      case 'transmission':
        this.triggerTransmission(level, state);
        break;
    }
  }

  private updateAtmosphere(state: AtmosphereState, now: number): void {
    const active = state.enabled;
    safeParam(this.droneBus.gain, state.droneMix, now, 0.15);
    safeParam(this.atmosphereBus.gain, active ? state.fieldMix : 0, now, 0.15);
    safeParam(this.rainGain.gain, active ? state.rain * 0.28 : 0, now, 0.35);
    safeParam(this.rainFilter.frequency, 2200 + state.distance * 2600, now, 0.4);
    safeParam(this.atmosphereDelay.delayTime, 0.55 + state.distance * 2.9, now, 0.35);
    safeParam(this.atmosphereFeedback.gain, clamp(state.echo * 0.68, 0, 0.68), now, 0.25);
    if (!active || this.atmosphereFrozen) return;
    if (this.nextAtmosphereEventAt <= 0) {
      this.scheduleNextAtmosphereEvent(state, now);
      return;
    }
    if (now >= this.nextAtmosphereEventAt) {
      const selection = this.chooseAtmosphereEvent(state);
      if (selection?.type === 'built-in') this.triggerAtmosphere(selection.kind);
      else if (selection?.type === 'custom') this.triggerImportedSound(selection.id);
      this.scheduleNextAtmosphereEvent(state, now);
    }
  }

  private makePulseVoice(
    state: PulseState,
    startAt: number,
    strength: number,
    frequencyScale = 1,
  ): void {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const baseFrequency = clamp(38 * Math.pow(2, state.tone * 2.35) * frequencyScale, 28, 420);
    const duration =
      state.pattern === 'breath'
        ? 0.9 + state.decay * 3.4
        : state.pattern === 'beacon'
          ? 0.65 + state.decay * 2.7
          : 0.32 + state.decay * 1.4;
    const attack = state.pattern === 'breath' ? 0.16 + state.decay * 0.28 : 0.018;
    const peak = clamp((0.04 + state.depth * 0.32) * strength, 0.008, 0.36);

    oscillator.type =
      state.pattern === 'drift' ? 'triangle' : state.pattern === 'heartbeat' ? 'sine' : 'sine';
    oscillator.frequency.setValueAtTime(baseFrequency, startAt);
    if (state.pattern === 'beacon') {
      oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 1.55, startAt + duration);
    } else if (state.pattern === 'drift') {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(22, baseFrequency * 0.72),
        startAt + duration,
      );
    }

    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(peak, startAt + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    panner.pan.value = clamp(
      this.pulseRandom.signed() * (0.12 + state.irregularity * 0.5),
      -0.7,
      0.7,
    );

    oscillator.connect(envelope).connect(panner).connect(this.droneInstrumentInput);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      panner.disconnect();
    };
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }

  private triggerPulse(state: PulseState, now: number): void {
    if (state.pattern === 'heartbeat') {
      this.makePulseVoice(state, now, 1, 0.9);
      this.makePulseVoice(state, now + 0.22 + state.decay * 0.12, 0.68, 1.06);
    } else if (state.pattern === 'beacon') {
      this.makePulseVoice(state, now, 0.82, 1.8);
    } else {
      this.makePulseVoice(state, now, 1);
    }
    this.lastPulseAt = now;
    this.pulseCount += 1;
  }

  private updatePulse(state: PulseState, seed: string, now: number): void {
    if (this.pulseSeed !== seed) {
      this.pulseSeed = seed;
      this.pulseRandom = new SeededRandom(`${seed}:pulse`);
      this.nextPulseAt = 0;
    }
    if (!state.enabled) {
      this.nextPulseAt = 0;
      return;
    }
    if (this.nextPulseAt <= 0) {
      this.nextPulseAt = now + 0.35;
      return;
    }
    if (now < this.nextPulseAt) return;

    this.triggerPulse(state, now);
    const baseInterval = 60 / clamp(state.tempo, 2, 40);
    const variation = 1 + this.pulseRandom.signed() * clamp(state.irregularity, 0, 1) * 0.45;
    this.nextPulseAt = now + Math.max(0.8, baseInterval * variation);
  }

  getPulseCount(): number {
    return this.pulseCount;
  }

  private playChord(state: ChordState, stepIndex: number, now: number): boolean {
    if (!state.enabled) return false;
    const step = state.steps[stepIndex];
    if (!step?.enabled) return false;
    const notes = chordMidiNotes(state, step);
    if (!notes.length) return false;

    const mix = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const distortion = this.context.createWaveShaper();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const oscillators: OscillatorNode[] = [];
    const oscillatorCount = notes.length * 2;
    const attack = clamp(state.attack, 0.005, 2);
    const decay = clamp(state.decay, 0.04, 4);
    const stepDuration = (60 / clamp(state.tempo, 35, 180)) * state.stepBeats;
    const holdUntil = Math.max(attack + decay, stepDuration * clamp(state.gate, 0.08, 0.95));
    const release = clamp(state.release, 0.08, 8);
    const endAt = now + holdUntil + release + 0.1;
    const peak = clamp(state.level * 0.58, 0.0001, 0.58);
    const sustain = peak * clamp(state.sustain, 0.05, 1);

    mix.gain.value = 0.64 / Math.max(1, oscillatorCount);
    filter.type = 'lowpass';
    filter.Q.value = clamp(state.resonance, 0.1, 16);
    filter.frequency.setValueAtTime(clamp(state.cutoff * 0.58, 80, 16000), now);
    filter.frequency.exponentialRampToValueAtTime(
      clamp(state.cutoff * 1.22, 90, 18000),
      now + attack,
    );
    filter.frequency.exponentialRampToValueAtTime(
      clamp(state.cutoff * 0.72, 70, 15000),
      now + attack + decay,
    );
    distortion.curve = this.makeSaturationCurve(clamp(state.drive * 0.72, 0, 0.9));
    distortion.oversample = '2x';
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(peak, now + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);
    envelope.gain.setValueAtTime(sustain, now + holdUntil);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + holdUntil + release);
    panner.pan.value = clamp((stepIndex % 2 === 0 ? -1 : 1) * state.spread * 0.18, -0.35, 0.35);

    for (const [noteIndex, note] of notes.entries()) {
      for (const side of [-1, 1]) {
        const oscillator = this.context.createOscillator();
        oscillator.type = state.waveform;
        oscillator.frequency.value = midiToHz(note);
        oscillator.detune.value =
          side * state.detune * 0.5 + (noteIndex - (notes.length - 1) / 2) * 0.7;
        oscillator.connect(mix);
        oscillator.start(now);
        oscillator.stop(endAt);
        oscillators.push(oscillator);
      }
    }

    mix
      .connect(filter)
      .connect(distortion)
      .connect(envelope)
      .connect(panner)
      .connect(this.chordBus);
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      for (const oscillator of oscillators) {
        oscillator.onended = null;
        oscillator.disconnect();
      }
      mix.disconnect();
      filter.disconnect();
      distortion.disconnect();
      envelope.disconnect();
      panner.disconnect();
      this.activeChordCleanups.delete(cleanup);
    };
    this.activeChordCleanups.add(cleanup);
    oscillators[oscillators.length - 1]!.onended = cleanup;
    this.lastChordStep = stepIndex;
    this.chordTriggerCount += 1;
    return true;
  }

  triggerChordStep(stepIndex: number): boolean {
    const state = this.currentPreset?.chord;
    if (!state) return false;
    return this.playChord(
      state,
      clamp(Math.round(stepIndex), 0, state.steps.length - 1),
      this.context.currentTime,
    );
  }

  getChordStatus(): { step: number; count: number } {
    return { step: this.lastChordStep, count: this.chordTriggerCount };
  }

  private updateChord(state: ChordState, now: number): void {
    if (!state.enabled || !state.running || !state.steps.some((step) => step.enabled)) {
      this.nextChordAt = 0;
      this.chordStepIndex = 0;
      return;
    }
    if (this.nextChordAt <= 0) {
      this.nextChordAt = now + 0.18;
      this.chordStepIndex = 0;
      return;
    }
    if (now < this.nextChordAt) return;

    let attempts = 0;
    while (!state.steps[this.chordStepIndex]?.enabled && attempts < state.steps.length) {
      this.chordStepIndex = (this.chordStepIndex + 1) % state.steps.length;
      attempts += 1;
    }
    const playedStep = this.chordStepIndex;
    this.playChord(state, playedStep, now);
    this.chordStepIndex = (playedStep + 1) % state.steps.length;
    const baseInterval = (60 / clamp(state.tempo, 35, 180)) * state.stepBeats;
    const swingDirection = playedStep % 2 === 0 ? -1 : 1;
    this.nextChordAt =
      now + baseInterval * (1 + swingDirection * clamp(state.swing, 0, 0.48) * 0.34);
  }

  private updateBinaural(state: BinauralState, now: number): void {
    const carrier = clamp(state.carrier, 60, 400);
    const beat = clamp(state.beat, 0.25, 40);
    const drift = Math.sin(now * 0.047) * clamp(state.drift, 0, 1) * 4;
    safeParam(this.binauralLeft.frequency, carrier - beat * 0.5 + drift, now, 0.3);
    safeParam(this.binauralRight.frequency, carrier + beat * 0.5 + drift, now, 0.3);
    safeParam(this.binauralGain.gain, state.enabled ? clamp(state.level, 0, 0.18) : 0, now, 0.25);
  }

  private playAmbientLayer(state: AmbientLayerState, preset: DriftPreset, now: number): boolean {
    if (!state.enabled || state.level <= 0.001) return false;
    const intervals: Record<AmbientLayerState['character'], number[]> = {
      aurora: [0, 7, 12, 16, 19, 24],
      glass: [12, 19, 24, 28, 31, 36],
      choir: [0, 3, 7, 10, 14, 19],
      stars: [19, 24, 31, 36, 43],
    };
    const voiceCount = 1 + Math.round(clamp(state.density, 0, 1) * 3);
    const shuffled = [...intervals[state.character]].sort(() => this.ambientRandom.next() - 0.5);
    const attack =
      state.character === 'stars'
        ? 0.015
        : state.character === 'glass'
          ? 0.08
          : state.character === 'choir'
            ? 1.8
            : 2.6;
    const release = 2.5 + clamp(state.decay, 0, 1) * 17;
    const hold = state.character === 'stars' ? 0.18 : 0.8 + state.decay * 2.8;
    const root = clamp(preset.tuning.root + (state.character === 'stars' ? 24 : 12), 32, 84);
    const oscillators: OscillatorNode[] = [];
    const nodes: AudioNode[] = [];
    const pairCount = voiceCount * 2;

    for (let index = 0; index < voiceCount; index += 1) {
      const midi = clamp(root + shuffled[index % shuffled.length]!, 36, 108);
      const startAt = now + index * (0.08 + state.density * 0.2);
      const filter = this.context.createBiquadFilter();
      const envelope = this.context.createGain();
      const panner = this.context.createStereoPanner();
      filter.type =
        state.character === 'glass' || state.character === 'stars' ? 'bandpass' : 'lowpass';
      filter.frequency.value =
        state.character === 'stars'
          ? 1800 + state.brightness * 9000
          : 480 + state.brightness * 7200;
      filter.Q.value = state.character === 'glass' ? 2.8 : state.character === 'stars' ? 4.2 : 0.8;
      const peak = clamp((state.level * 0.24) / Math.sqrt(pairCount), 0.0001, 0.13);
      envelope.gain.setValueAtTime(0.0001, startAt);
      envelope.gain.exponentialRampToValueAtTime(peak, startAt + attack);
      envelope.gain.setValueAtTime(peak * 0.72, startAt + attack + hold);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + attack + hold + release);
      const position =
        voiceCount === 1
          ? this.ambientRandom.signed()
          : -1 + (index / Math.max(1, voiceCount - 1)) * 2;
      panner.pan.value = clamp(position * state.spread, -1, 1);
      filter.connect(envelope).connect(panner).connect(this.ambientBus);
      nodes.push(filter, envelope, panner);

      for (const side of [-1, 1]) {
        const oscillator = this.context.createOscillator();
        oscillator.type =
          state.character === 'choir'
            ? 'triangle'
            : state.character === 'aurora'
              ? 'triangle'
              : 'sine';
        oscillator.frequency.value = midiToHz(midi);
        oscillator.detune.value = side * (state.character === 'choir' ? 8 : 3.5);
        oscillator.connect(filter);
        oscillator.start(startAt);
        oscillator.stop(startAt + attack + hold + release + 0.08);
        oscillators.push(oscillator);
      }
    }

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      for (const oscillator of oscillators) {
        oscillator.onended = null;
        oscillator.disconnect();
      }
      for (const node of nodes) node.disconnect();
      this.activeAmbientCleanups.delete(cleanup);
    };
    this.activeAmbientCleanups.add(cleanup);
    oscillators[oscillators.length - 1]!.onended = cleanup;
    this.ambientCount += 1;
    return true;
  }

  triggerAmbientLayer(): boolean {
    const preset = this.currentPreset;
    if (!preset) return false;
    return this.playAmbientLayer(preset.ambientLayer, preset, this.context.currentTime);
  }

  getAmbientCount(): number {
    return this.ambientCount;
  }

  private updateAmbientLayer(state: AmbientLayerState, preset: DriftPreset, now: number): void {
    if (this.ambientSeed !== preset.seed) {
      this.ambientSeed = preset.seed;
      this.ambientRandom = new SeededRandom(`${preset.seed}:ambient-layer`);
      this.nextAmbientAt = 0;
    }
    if (!state.enabled) {
      this.nextAmbientAt = 0;
      return;
    }
    if (this.nextAmbientAt <= 0) {
      this.nextAmbientAt = now + 1.2;
      return;
    }
    if (now < this.nextAmbientAt) return;
    this.playAmbientLayer(state, preset, now);
    const baseInterval = 78 - clamp(state.activity, 0, 1) * 70;
    this.nextAmbientAt = now + baseInterval * this.ambientRandom.range(0.68, 1.36);
  }

  private playSaxNote(
    midi: number,
    startAt: number,
    duration: number,
    state: SaxState,
    pan: number,
  ): void {
    const target = midiToHz(clamp(midi, 46, 88));
    const carrier = this.context.createOscillator();
    const harmonic = this.context.createOscillator();
    const vibrato = this.context.createOscillator();
    const vibratoDepth = this.context.createGain();
    const carrierGain = this.context.createGain();
    const harmonicGain = this.context.createGain();
    const breath = this.context.createBufferSource();
    const breathFilter = this.context.createBiquadFilter();
    const breathGain = this.context.createGain();
    const mix = this.context.createGain();
    const toneFilter = this.context.createBiquadFilter();
    const formant = this.context.createBiquadFilter();
    const saturation = this.context.createWaveShaper();
    const envelope = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const attack = 0.055 + state.expression * 0.085;
    const release = 0.6 + state.expression * 1.7;
    const endAt = startAt + attack + duration + release;
    const peak = clamp(state.level * 0.28 * this.saxRandom.range(0.82, 1.08), 0.0001, 0.16);
    const scoop = Math.pow(2, (-18 - state.glide * 62) / 1200);

    carrier.type = 'sawtooth';
    harmonic.type = 'triangle';
    carrier.frequency.setValueAtTime(target * scoop, startAt);
    carrier.frequency.exponentialRampToValueAtTime(target, startAt + 0.07 + state.glide * 0.24);
    harmonic.frequency.setValueAtTime(target * 2 * scoop, startAt);
    harmonic.frequency.exponentialRampToValueAtTime(
      target * 2,
      startAt + 0.07 + state.glide * 0.24,
    );
    vibrato.type = 'sine';
    vibrato.frequency.value = 4.5 + state.vibrato * 1.5;
    vibratoDepth.gain.value = 3 + state.vibrato * 24;
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(carrier.detune);
    vibratoDepth.connect(harmonic.detune);
    carrierGain.gain.value = 0.34;
    harmonicGain.gain.value = 0.1 + state.tone * 0.08;
    carrier.connect(carrierGain).connect(mix);
    harmonic.connect(harmonicGain).connect(mix);

    breath.buffer = this.noiseBuffer;
    breath.loop = true;
    breath.playbackRate.value = this.saxRandom.range(0.8, 1.3);
    breathFilter.type = 'bandpass';
    breathFilter.frequency.value = 1500 + state.tone * 2600;
    breathFilter.Q.value = 0.72;
    breathGain.gain.value = state.breath * 0.22;
    breath.connect(breathFilter).connect(breathGain).connect(mix);

    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 950 + state.tone * 4800;
    toneFilter.Q.value = 1.15;
    formant.type = 'peaking';
    formant.frequency.value = 620 + state.tone * 720;
    formant.Q.value = 1.8;
    formant.gain.value = 5.5;
    saturation.curve = this.makeSaturationCurve(0.12 + state.expression * 0.12);
    saturation.oversample = '2x';
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(peak, startAt + attack);
    envelope.gain.setValueAtTime(peak * (0.72 + state.expression * 0.2), startAt + attack + duration);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);
    panner.pan.value = clamp(pan, -0.65, 0.65);
    mix
      .connect(toneFilter)
      .connect(formant)
      .connect(saturation)
      .connect(envelope)
      .connect(panner)
      .connect(this.ambientBus);

    const sources: AudioScheduledSourceNode[] = [carrier, harmonic, vibrato, breath];
    const nodes: AudioNode[] = [
      vibratoDepth,
      carrierGain,
      harmonicGain,
      breathFilter,
      breathGain,
      mix,
      toneFilter,
      formant,
      saturation,
      envelope,
      panner,
    ];
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      for (const source of sources) {
        source.onended = null;
        source.disconnect();
      }
      for (const node of nodes) node.disconnect();
      this.activeSaxCleanups.delete(cleanup);
    };
    this.activeSaxCleanups.add(cleanup);
    breath.onended = cleanup;
    for (const source of sources) {
      source.start(startAt);
      source.stop(endAt + 0.08);
    }
  }

  private playSaxPhrase(state: SaxState, preset: DriftPreset, now: number): boolean {
    if (!state.enabled || state.level <= 0.001) return false;
    const enabledSteps = preset.chord.steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.enabled);
    if (!enabledSteps.length) return false;
    const selected =
      enabledSteps.find(({ index }) => index === this.lastChordStep) ??
      this.saxRandom.pick(enabledSteps);
    const chordNotes = chordMidiNotes(preset.chord, selected.step);
    const root = (clamp(Math.round(state.octave), 2, 5) + 1) * 12 + preset.chord.key + selected.step.offset;
    const chordPool = [...new Set(chordNotes.map((note) => ((note % 12) + 12) % 12))].map(
      (pitchClass) => root + ((pitchClass - root + 120) % 12),
    );
    const passing = [2, 5, 9, 10, 14].map((interval) => root + interval);
    const pool = [...chordPool, ...passing].map((note) => clamp(note, 46, 88));
    let notes: number[];
    let durations: number[];
    let gaps: number[];
    if (state.style === 'noir') {
      notes = [pool[1] ?? root + 3, root + 2, pool[2] ?? root + 7, root + 10];
      durations = [0.72, 0.42, 0.88, 1.65];
      gaps = [0, 0.88, 1.48, 2.55];
    } else if (state.style === 'yearning') {
      notes = [root, root + 5, root + 7, root + 10, root + 7];
      durations = [0.9, 0.82, 1.15, 1.42, 2.1];
      gaps = [0, 1.05, 2, 3.3, 4.9];
    } else {
      const high = Math.max(...chordPool) + 12;
      notes = [high, pool[Math.floor(pool.length * 0.55)] ?? root + 7, root + 3, root];
      durations = [1.45, 0.9, 1.25, 2.35];
      gaps = [0, 1.72, 2.88, 4.42];
    }
    const phrasePan = this.saxRandom.signed() * 0.34;
    notes.forEach((note, index) =>
      this.playSaxNote(
        clamp(note + (this.saxRandom.next() < 0.16 ? 12 : 0), 46, 88),
        now + gaps[index]!,
        durations[index]!,
        state,
        phrasePan + this.saxRandom.signed() * 0.08,
      ),
    );
    this.saxCount += 1;
    return true;
  }

  triggerSaxPhrase(): boolean {
    const preset = this.currentPreset;
    if (!preset) return false;
    return this.playSaxPhrase(preset.sax, preset, this.context.currentTime);
  }

  getRhythmInput(): AudioNode {
    return this.rhythmInstrumentInput;
  }

  setInstrumentBus(
    bus: 'drone' | 'rhythm',
    volume: number,
    muted: boolean,
    low = 0.5,
    high = 0.5,
  ): void {
    const now = this.context.currentTime;
    const level = muted ? 0 : clamp(volume, 0, 0.95);
    if (bus === 'drone') {
      this.droneBusLevel = level;
      safeParam(this.droneInstrumentGain.gain, level, now, 0.04);
      safeParam(this.droneInstrumentLow.gain, (clamp(low, 0, 1) - 0.5) * 18, now, 0.08);
      this.droneHighDb = (clamp(high, 0, 1) - 0.5) * 18;
      safeParam(this.droneInstrumentHigh.gain, this.droneHighDb, now, 0.08);
    } else {
      this.rhythmBusLevel = level;
      safeParam(this.rhythmInstrumentGain.gain, level, now, 0.035);
      safeParam(this.rhythmInstrumentLow.gain, (clamp(low, 0, 1) - 0.5) * 18, now, 0.08);
      safeParam(this.rhythmInstrumentHigh.gain, (clamp(high, 0, 1) - 0.5) * 18, now, 0.08);
    }
  }

  scheduleDroneDuck(time: number, amount: number, attack: number, release: number): void {
    if (this.droneBusLevel <= 0) return;
    const at = Math.max(this.context.currentTime + 0.001, time);
    const depth = clamp(amount, 0, 0.92);
    const floor = this.droneBusLevel * (1 - depth);
    const attackEnd = at + clamp(attack, 0.002, 0.2);
    const releaseEnd = attackEnd + clamp(release, 0.03, 2.5);
    const gain = this.droneInstrumentGain.gain;
    gain.cancelScheduledValues(at);
    gain.setValueAtTime(this.droneBusLevel, at);
    gain.linearRampToValueAtTime(floor, attackEnd);
    gain.exponentialRampToValueAtTime(Math.max(0.0001, this.droneBusLevel), releaseEnd);
  }

  scheduleDroneTone(time: number, amount: number, smoothing: number, polarity: 1 | -1): void {
    const at = Math.max(this.context.currentTime + 0.001, time);
    const base = this.droneHighDb;
    const peak = clamp(base + clamp(amount, 0, 1) * polarity * 12, -12, 12);
    const duration = clamp(smoothing, 0.02, 2);
    const gain = this.droneInstrumentHigh.gain;
    gain.cancelScheduledValues(at);
    gain.setValueAtTime(gain.value, at);
    gain.linearRampToValueAtTime(peak, at + 0.015);
    gain.linearRampToValueAtTime(base, at + duration);
  }

  setMasterVolume(volume: number): void {
    safeParam(this.masterGain.gain, clamp(volume, 0, 0.72), this.context.currentTime, 0.08);
  }

  getInstrumentMeters(): { drone: number; rhythm: number } {
    return {
      drone: this.readAnalyserRms(this.droneInstrumentAnalyser),
      rhythm: this.readAnalyserRms(this.rhythmInstrumentAnalyser),
    };
  }

  getSaxCount(): number {
    return this.saxCount;
  }

  private updateSax(state: SaxState, preset: DriftPreset, now: number): void {
    if (this.saxSeed !== preset.seed) {
      this.saxSeed = preset.seed;
      this.saxRandom = new SeededRandom(`${preset.seed}:night-sax`);
      this.nextSaxAt = 0;
    }
    if (!state.enabled || !state.automatic) {
      this.nextSaxAt = 0;
      return;
    }
    if (this.nextSaxAt <= 0) {
      this.nextSaxAt = now + 2.8;
      return;
    }
    if (now < this.nextSaxAt) return;
    this.playSaxPhrase(state, preset, now);
    const baseInterval = 92 - clamp(state.activity, 0, 1) * 76;
    this.nextSaxAt = now + baseInterval * this.saxRandom.range(0.72, 1.34);
  }

  applyPreset(preset: DriftPreset, evolution?: EvolutionFrame): void {
    this.currentPreset = preset;
    const now = this.context.currentTime;
    if (this.atmosphereSeed !== preset.seed) {
      this.atmosphereSeed = preset.seed;
      this.atmosphereRandom = new SeededRandom(`${preset.seed}:atmosphere`);
      this.nextAtmosphereEventAt = 0;
    }
    while (this.voiceUnits.length < preset.voices.length) {
      this.voiceUnits.push(this.buildVoice(preset.voices[this.voiceUnits.length]!));
    }
    while (this.voiceUnits.length > preset.voices.length) {
      this.destroyVoice(this.voiceUnits.pop()!);
    }
    const anySolo = preset.voices.some((voice) => voice.solo);
    const densityCount = Math.max(1, Math.round(preset.macros.density * preset.voices.length));

    preset.voices.forEach((voice, index) => {
      let unit = this.voiceUnits[index]!;
      if (unit.signature !== this.signature(voice)) {
        const replacement = this.buildVoice(voice);
        this.voiceUnits[index] = replacement;
        this.destroyVoice(unit);
        unit = replacement;
      }
      const motion = evolution?.voice[index];
      const baseFrequency = this.pitchForVoice(preset, voice, index);
      const pitchRatio = Math.pow(2, (motion?.pitch ?? 0) * preset.macros.range * 0.35);
      const gainAllowed = !voice.muted && (!anySolo || voice.solo) && index < densityCount;
      const evolvedVolume = voice.volume * (1 + (motion?.amplitude ?? 0) * 0.35);
      const targetGain = gainAllowed ? clamp(evolvedVolume * 0.52, 0, 0.52) : 0;
      safeParam(unit.gain.gain, targetGain, now, 0.12);
      safeParam(
        unit.filter.frequency,
        clamp(
          voice.cutoff * Math.pow(2, (motion?.cutoff ?? 0) * 2.4) * (0.55 + preset.macros.warmth),
          24,
          19000,
        ),
        now,
        0.18,
      );
      safeParam(
        unit.filter.Q,
        clamp(voice.resonance + (motion?.resonance ?? 0) * 4, 0.01, 18),
        now,
        0.18,
      );
      unit.filter.type = voice.filterType;
      safeParam(
        unit.panner.pan,
        clamp(
          (voice.pan + (motion?.pan ?? 0) * preset.macros.motion) *
            (0.5 + preset.effects.width * 0.7),
          -1,
          1,
        ),
        now,
        0.16,
      );

      const primary = unit.sources.filter((source) => source.ratio === 1);
      for (const source of unit.sources) {
        if (source.node instanceof OscillatorNode) {
          const detune =
            source.detuneOffset +
            (motion?.detune ?? 0) * voice.detune * 2 +
            (motion?.harmonics ?? 0) * preset.macros.tension * 8 +
            Math.sin(now * (0.42 + index * 0.07)) * preset.effects.wobble * 11;
          safeParam(
            source.node.frequency,
            baseFrequency * pitchRatio * source.ratio,
            now,
            preset.tuning.glide * 0.08,
          );
          safeParam(source.node.detune, detune, now, 0.15);
        }
        let sourceGain = 0;
        if (source.ratio === 1) sourceGain = 0.7 / Math.max(1, primary.length);
        else if (source.ratio === 0.5) sourceGain = voice.sub * 0.36;
        else if (source.ratio === 1.5) sourceGain = voice.fifth * 0.3;
        else if (source.ratio === 2) sourceGain = voice.octave * 0.25;
        safeParam(
          source.gain.gain,
          clamp(sourceGain * (1 + (motion?.harmonics ?? 0) * 0.35), 0, 0.7),
          now,
          0.15,
        );
      }
    });

    safeParam(this.masterToneHigh.frequency, clamp(preset.effects.highpass, 10, 1800), now, 0.15);
    safeParam(this.masterToneLow.frequency, clamp(preset.effects.lowpass, 300, 20000), now, 0.15);
    this.saturator.curve = this.makeSaturationCurve(
      clamp(preset.effects.saturation + preset.macros.distortion * 0.65, 0, 1),
    );
    this.bitCrusher.curve = this.makeBitReductionCurve(preset.effects.bitReduction);
    safeParam(this.chorusGain.gain, preset.effects.chorus * 0.52, now, 0.1);
    safeParam(this.phaserGain.gain, preset.effects.phaser * 0.42, now, 0.1);
    safeParam(this.flangerGain.gain, preset.effects.flanger * 0.32, now, 0.1);
    safeParam(this.delayGain.gain, preset.effects.delay * 0.56, now, 0.1);
    safeParam(this.delay.delayTime, clamp(preset.effects.delayTime, 0.03, 7.5), now, 0.25);
    safeParam(this.delayFeedback.gain, clamp(preset.effects.delayFeedback, 0, 0.78), now, 0.2);
    safeParam(
      this.reverbGain.gain,
      clamp(
        preset.effects.reverb * (0.7 + preset.macros.space * 0.55 + (evolution?.space ?? 0) * 0.2),
        0,
        0.82,
      ),
      now,
      0.2,
    );
    safeParam(this.masterGain.gain, clamp(preset.macros.master, 0, 0.72), now, 0.12);
    this.updateAtmosphere(preset.atmosphere, now);
    this.updatePulse(preset.pulse, preset.seed, now);
    this.updateChord(preset.chord, now);
    this.updateBinaural(preset.binaural, now);
    this.updateAmbientLayer(preset.ambientLayer, preset, now);
    this.updateSax(preset.sax, preset, now);
  }

  rebuildReverb(decay: number): void {
    this.convolver.buffer = this.makeImpulse(decay);
  }

  getMeterFrame(): MeterFrame {
    const spectrum = new Uint8Array(this.analyser.frequencyBinCount);
    const waveform = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteFrequencyData(spectrum);
    this.analyser.getByteTimeDomainData(waveform);
    let energy = 0;
    let peak = 0;
    for (const value of waveform) {
      const sample = (value - 128) / 128;
      energy += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    return { rms: Math.sqrt(energy / waveform.length), peak, spectrum, waveform };
  }

  private readAnalyserRms(analyser: AnalyserNode): number {
    const waveform = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(waveform);
    let energy = 0;
    for (const sample of waveform) energy += sample * sample;
    return Math.sqrt(energy / waveform.length);
  }

  startRecording(source: 'master' | 'drone' | 'rhythm' = 'master'): number {
    if (this.recorder) return this.recorder.startedAt;
    const node = this.context.createScriptProcessor(4096, 2, 2);
    const silent = this.context.createGain();
    silent.gain.value = 0;
    const chunks: Int16Array[] = [];
    node.onaudioprocess = (event) => {
      const left = event.inputBuffer.getChannelData(0);
      const right =
        event.inputBuffer.numberOfChannels > 1
          ? event.inputBuffer.getChannelData(1)
          : event.inputBuffer.getChannelData(0);
      const interleaved = new Int16Array(left.length * 2);
      for (let index = 0; index < left.length; index += 1) {
        interleaved[index * 2] = Math.round(clamp(left[index]!, -1, 1) * 32767);
        interleaved[index * 2 + 1] = Math.round(clamp(right[index]!, -1, 1) * 32767);
      }
      chunks.push(interleaved);
    };
    const recordingSource =
      source === 'drone'
        ? this.droneInstrumentAnalyser
        : source === 'rhythm'
          ? this.rhythmInstrumentAnalyser
          : this.analyser;
    recordingSource.connect(node);
    node.connect(silent).connect(this.context.destination);
    this.recorder = { node, silent, source: recordingSource, chunks, startedAt: Date.now() };
    return this.recorder.startedAt;
  }

  stopRecording(): { chunks: Int16Array[]; sampleRate: number; startedAt: number } | null {
    if (!this.recorder) return null;
    const result = {
      chunks: this.recorder.chunks,
      sampleRate: this.context.sampleRate,
      startedAt: this.recorder.startedAt,
    };
    this.recorder.source.disconnect(this.recorder.node);
    this.recorder.node.disconnect();
    this.recorder.silent.disconnect();
    this.recorder.node.onaudioprocess = null;
    this.recorder = null;
    return result;
  }

  async close(): Promise<void> {
    this.panic();
    for (const cleanup of [...this.activeSpeechCleanups]) cleanup();
    for (const cleanup of [...this.activeChordCleanups]) cleanup();
    for (const cleanup of [...this.activeAmbientCleanups]) cleanup();
    for (const cleanup of [...this.activeSaxCleanups]) cleanup();
    for (const id of [...this.importedLoops.keys()]) this.stopImportedLoop(id, true);
    for (const source of this.activeImportedEvents) {
      try {
        source.stop();
      } catch {
        // The source may already have stopped naturally.
      }
    }
    this.activeImportedEvents.clear();
    if (this.recorder) this.stopRecording();
    for (const unit of this.voiceUnits) this.destroyVoice(unit);
    this.voiceUnits = [];
    this.chorusLfo.stop();
    this.phaserLfo.stop();
    this.rainSource.stop();
    this.rainLfo.stop();
    this.binauralLeft.stop();
    this.binauralRight.stop();
    await this.context.close();
  }
}

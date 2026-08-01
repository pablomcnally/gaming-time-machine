import { useState } from 'react';
import type { EvolutionFrame, VoiceState } from '../types';
import { Knob } from './Knob';

interface VoiceStripProps {
  index: number;
  voice: VoiceState;
  motion?: EvolutionFrame['voice'][number];
  range: number;
  motionAmount: number;
  onChange: (voice: VoiceState) => void;
}

export function VoiceStrip({
  index,
  voice,
  motion,
  range,
  motionAmount,
  onChange,
}: VoiceStripProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const patch = <K extends keyof VoiceState>(key: K, value: VoiceState[K]) =>
    onChange({ ...voice, [key]: value });
  return (
    <article
      className={`voice-strip ${expanded ? 'is-expanded' : ''} ${voice.muted ? 'is-muted' : ''}`}
    >
      <header className="voice-strip__head">
        <button
          className="voice-strip__expand"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          <span className="voice-index">0{index + 1}</span>
          <span>
            <strong>{voice.name}</strong>
            <small>
              {voice.waveform.toUpperCase()} / {voice.filterType.toUpperCase()}
            </small>
          </span>
          <span className="chevron">{expanded ? '−' : '+'}</span>
        </button>
        <div className="voice-strip__switches">
          <button
            className={voice.muted ? 'is-active danger' : ''}
            onClick={() => patch('muted', !voice.muted)}
          >
            M
          </button>
          <button
            className={voice.solo ? 'is-active' : ''}
            onClick={() => patch('solo', !voice.solo)}
          >
            S
          </button>
          <button
            className={voice.locked ? 'is-active lock' : ''}
            onClick={() => patch('locked', !voice.locked)}
            title="Exclude this voice from mutation and generative drift"
          >
            {voice.locked ? 'LOCKED' : 'LOCK'}
          </button>
        </div>
      </header>
      {expanded && (
        <div className="voice-strip__body">
          <div className="control-column source-column">
            <span className="section-tag">SOURCE</span>
            <label>
              OSCILLATOR
              <select
                value={voice.waveform}
                onChange={(event) =>
                  patch('waveform', event.target.value as VoiceState['waveform'])
                }
              >
                <option value="sine">Sine</option>
                <option value="triangle">Triangle</option>
                <option value="sawtooth">Saw</option>
                <option value="square">Square</option>
                <option value="noise">Noise</option>
              </select>
            </label>
            <label>
              UNISON
              <select
                value={voice.unison}
                disabled={voice.waveform === 'noise'}
                onChange={(event) => patch('unison', Number(event.target.value))}
              >
                <option value={1}>1 voice</option>
                <option value={2}>2 voices</option>
                <option value={3}>3 voices</option>
                <option value={4}>4 voices</option>
              </select>
            </label>
          </div>
          <div className="knob-row">
            <Knob
              size="small"
              label="COARSE"
              value={voice.coarse}
              modulatedValue={motion ? voice.coarse + motion.pitch * range * 4.2 : undefined}
              min={-24}
              max={24}
              step={1}
              display={`${voice.coarse > 0 ? '+' : ''}${voice.coarse} st`}
              onChange={(value) => patch('coarse', value)}
            />
            <Knob
              size="small"
              label="FINE"
              value={voice.fine}
              modulatedValue={motion ? voice.fine + motion.detune * voice.detune * 2 : undefined}
              min={-100}
              max={100}
              step={1}
              display={`${voice.fine > 0 ? '+' : ''}${voice.fine}¢`}
              onChange={(value) => patch('fine', value)}
            />
            <Knob
              size="small"
              label="DETUNE"
              value={voice.detune}
              modulatedValue={
                motion ? Math.abs(voice.detune + motion.detune * voice.detune * 2) : undefined
              }
              min={0}
              max={50}
              step={1}
              display={`${voice.detune}¢`}
              onChange={(value) => patch('detune', value)}
            />
            <Knob
              size="small"
              label="LEVEL"
              value={voice.volume}
              modulatedValue={motion ? voice.volume * (1 + motion.amplitude * 0.35) : undefined}
              display={`${Math.round(voice.volume * 100)}%`}
              onChange={(value) => patch('volume', value)}
            />
            <Knob
              size="small"
              label="PAN"
              value={voice.pan}
              modulatedValue={motion ? voice.pan + motion.pan * motionAmount : undefined}
              min={-1}
              max={1}
              display={
                voice.pan === 0
                  ? 'C'
                  : `${Math.round(Math.abs(voice.pan) * 100)}${voice.pan < 0 ? 'L' : 'R'}`
              }
              onChange={(value) => patch('pan', value)}
            />
          </div>
          <div className="knob-row">
            <Knob
              accent="cyan"
              size="small"
              label="CUTOFF"
              value={voice.cutoff}
              modulatedValue={motion ? voice.cutoff * Math.pow(2, motion.cutoff * 2.4) : undefined}
              min={24}
              max={16000}
              step={1}
              display={
                voice.cutoff >= 1000
                  ? `${(voice.cutoff / 1000).toFixed(1)}k`
                  : `${Math.round(voice.cutoff)}`
              }
              onChange={(value) => patch('cutoff', value)}
            />
            <Knob
              accent="cyan"
              size="small"
              label="RESONANCE"
              value={voice.resonance}
              modulatedValue={motion ? voice.resonance + motion.resonance * 4 : undefined}
              min={0.1}
              max={18}
              step={0.1}
              display={voice.resonance.toFixed(1)}
              onChange={(value) => patch('resonance', value)}
            />
            <div className="select-stack">
              <label>
                FILTER
                <select
                  value={voice.filterType}
                  onChange={(event) =>
                    patch('filterType', event.target.value as VoiceState['filterType'])
                  }
                >
                  <option value="lowpass">Low-pass</option>
                  <option value="highpass">High-pass</option>
                  <option value="bandpass">Band-pass</option>
                  <option value="notch">Notch</option>
                </select>
              </label>
              <label>
                NAME
                <input
                  value={voice.name}
                  maxLength={12}
                  onChange={(event) => patch('name', event.target.value.toUpperCase())}
                />
              </label>
            </div>
            <Knob
              accent="cyan"
              size="small"
              label="DRIFT DEPTH"
              value={voice.modulation}
              display={`${Math.round(voice.modulation * 100)}%`}
              onChange={(value) => patch('modulation', value)}
            />
          </div>
          <div className="harmonics">
            <span className="section-tag">HARMONICS</span>
            <Knob
              size="small"
              label="SUB"
              value={voice.sub}
              modulatedValue={motion ? voice.sub * (1 + motion.harmonics * 0.35) : undefined}
              display={`${Math.round(voice.sub * 100)}%`}
              disabled={voice.waveform === 'noise'}
              onChange={(value) => patch('sub', value)}
            />
            <Knob
              size="small"
              label="FIFTH"
              value={voice.fifth}
              modulatedValue={motion ? voice.fifth * (1 + motion.harmonics * 0.35) : undefined}
              display={`${Math.round(voice.fifth * 100)}%`}
              disabled={voice.waveform === 'noise'}
              onChange={(value) => patch('fifth', value)}
            />
            <Knob
              size="small"
              label="OCTAVE"
              value={voice.octave}
              modulatedValue={motion ? voice.octave * (1 + motion.harmonics * 0.35) : undefined}
              display={`${Math.round(voice.octave * 100)}%`}
              disabled={voice.waveform === 'noise'}
              onChange={(value) => patch('octave', value)}
            />
          </div>
        </div>
      )}
    </article>
  );
}

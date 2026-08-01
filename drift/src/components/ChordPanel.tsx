import { useEffect, useRef } from 'react';
import { chordLabel, chordQualityLabels, noteNames } from '../audio/chords';
import type { ChordQuality, ChordState, ChordStep, SaxPhraseStyle, SaxState } from '../types';
import { Knob } from './Knob';

interface ChordPanelProps {
  chord: ChordState;
  activeStep: number;
  triggerCount: number;
  sax: SaxState;
  saxCount: number;
  onChange: (chord: ChordState) => void;
  onSaxChange: (sax: SaxState) => void;
  onToggleRunning: () => void;
  onTrigger: (index: number) => void;
  onTriggerSax: () => void;
}

const qualities = Object.keys(chordQualityLabels) as ChordQuality[];

const progressionTemplates: Array<{ name: string; steps: ChordStep[] }> = [
  {
    name: 'NEON NOIR',
    steps: [
      { offset: 0, quality: 'minor9', inversion: 0, enabled: true },
      { offset: 8, quality: 'major7', inversion: 1, enabled: true },
      { offset: 3, quality: 'minor7', inversion: 1, enabled: true },
      { offset: 10, quality: 'sus2', inversion: 0, enabled: true },
      { offset: 0, quality: 'minor9', inversion: 1, enabled: true },
      { offset: 8, quality: 'add9', inversion: 0, enabled: true },
      { offset: 5, quality: 'minor7', inversion: 2, enabled: true },
      { offset: 10, quality: 'sus4', inversion: 1, enabled: true },
    ],
  },
  {
    name: 'NIGHT DRIVE',
    steps: [
      { offset: 0, quality: 'minor7', inversion: 0, enabled: true },
      { offset: 5, quality: 'minor7', inversion: 1, enabled: true },
      { offset: 8, quality: 'major7', inversion: 1, enabled: true },
      { offset: 3, quality: 'add9', inversion: 2, enabled: true },
      { offset: 0, quality: 'minor7', inversion: 1, enabled: true },
      { offset: 5, quality: 'sus2', inversion: 0, enabled: true },
      { offset: 10, quality: 'major', inversion: 2, enabled: true },
      { offset: 8, quality: 'major7', inversion: 1, enabled: true },
    ],
  },
  {
    name: 'OFF-WORLD',
    steps: [
      { offset: 0, quality: 'minor9', inversion: 0, enabled: true },
      { offset: 1, quality: 'major7', inversion: 2, enabled: true },
      { offset: 8, quality: 'add9', inversion: 1, enabled: true },
      { offset: 6, quality: 'sus2', inversion: 1, enabled: true },
      { offset: 0, quality: 'minor9', inversion: 2, enabled: true },
      { offset: 11, quality: 'major7', inversion: 1, enabled: true },
      { offset: 3, quality: 'minor7', inversion: 2, enabled: true },
      { offset: 1, quality: 'sus4', inversion: 0, enabled: true },
    ],
  },
  {
    name: 'CHROME HEART',
    steps: [
      { offset: 0, quality: 'minor', inversion: 0, enabled: true },
      { offset: 7, quality: 'power', inversion: 0, enabled: true },
      { offset: 5, quality: 'sus2', inversion: 1, enabled: true },
      { offset: 8, quality: 'major', inversion: 1, enabled: true },
      { offset: 0, quality: 'minor', inversion: 1, enabled: true },
      { offset: 10, quality: 'power', inversion: 0, enabled: true },
      { offset: 3, quality: 'add9', inversion: 2, enabled: true },
      { offset: 7, quality: 'sus4', inversion: 1, enabled: true },
    ],
  },
];

export function ChordPanel({
  chord,
  activeStep,
  triggerCount,
  sax,
  saxCount,
  onChange,
  onSaxChange,
  onToggleRunning,
  onTrigger,
  onTriggerSax,
}: ChordPanelProps) {
  const triggerRef = useRef(onTrigger);
  triggerRef.current = onTrigger;
  const patch = <K extends keyof ChordState>(key: K, value: ChordState[K]) =>
    onChange({ ...chord, [key]: value });
  const patchStep = (index: number, values: Partial<ChordStep>) =>
    patch(
      'steps',
      chord.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, ...values } : step)),
    );
  const patchSax = <K extends keyof SaxState>(key: K, value: SaxState[K]) =>
    onSaxChange({ ...sax, [key]: value });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        ['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)
      ) {
        return;
      }
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 8) triggerRef.current(index);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <section className="rack-panel chord-panel" data-trigger-count={triggerCount}>
      <div className="panel-title">
        <span>NEON CHORD INSTRUMENT</span>
        <small>Polyphonic cyber-noir stabs / eight-step progression engine</small>
        <button
          className={`chord-power ${chord.enabled ? 'is-active' : ''}`}
          onClick={() => patch('enabled', !chord.enabled)}
        >
          <i />
          {chord.enabled ? 'INSTRUMENT ONLINE' : 'INSTRUMENT OFFLINE'}
        </button>
      </div>

      <div className="chord-console">
        <div className="chord-transport">
          <button
            className={`chord-run ${chord.running ? 'is-active' : ''}`}
            onClick={onToggleRunning}
          >
            <i />
            {chord.running ? 'STOP PROGRESSION' : 'PLAY PROGRESSION'}
            <small>{chord.stepBeats} BEATS PER CHORD</small>
          </button>
          <label>
            KEY
            <select
              value={chord.key}
              onChange={(event) => patch('key', Number(event.target.value))}
            >
              {noteNames.map((note, index) => (
                <option value={index} key={note}>
                  {note}
                </option>
              ))}
            </select>
          </label>
          <label>
            OCTAVE
            <select
              value={chord.octave}
              onChange={(event) => patch('octave', Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5].map((octave) => (
                <option value={octave} key={octave}>
                  {octave}
                </option>
              ))}
            </select>
          </label>
          <label>
            OSCILLATORS
            <select
              value={chord.waveform}
              onChange={(event) => patch('waveform', event.target.value as ChordState['waveform'])}
            >
              <option value="sawtooth">Twin saw</option>
              <option value="square">Twin pulse</option>
              <option value="triangle">Twin triangle</option>
            </select>
          </label>
          <label>
            CHORD LENGTH
            <select
              value={chord.stepBeats}
              onChange={(event) =>
                patch('stepBeats', Number(event.target.value) as ChordState['stepBeats'])
              }
            >
              <option value={1}>1 beat</option>
              <option value={2}>2 beats</option>
              <option value={4}>1 bar / 4 beats</option>
              <option value={8}>2 bars / 8 beats</option>
            </select>
          </label>
          <Knob
            accent="cyan"
            label="TEMPO"
            value={chord.tempo}
            min={35}
            max={180}
            step={1}
            display={`${Math.round(chord.tempo)} BPM`}
            onChange={(value) => patch('tempo', value)}
          />
          <Knob
            accent="cyan"
            label="SWING"
            value={chord.swing}
            max={0.48}
            display={`${Math.round(chord.swing * 100)}%`}
            onChange={(value) => patch('swing', value)}
          />
          <Knob
            accent="cyan"
            label="GATE"
            value={chord.gate}
            min={0.08}
            max={0.95}
            display={`${Math.round(chord.gate * 100)}%`}
            onChange={(value) => patch('gate', value)}
          />
        </div>

        <div className="chord-shaper">
          <Knob
            label="LEVEL"
            value={chord.level}
            display={`${Math.round(chord.level * 100)}%`}
            onChange={(value) => patch('level', value)}
          />
          <Knob
            label="CUTOFF"
            value={chord.cutoff}
            min={100}
            max={12000}
            step={10}
            display={`${Math.round(chord.cutoff)} Hz`}
            onChange={(value) => patch('cutoff', value)}
          />
          <Knob
            label="RESONANCE"
            value={chord.resonance}
            min={0.1}
            max={12}
            display={chord.resonance.toFixed(1)}
            onChange={(value) => patch('resonance', value)}
          />
          <Knob
            label="ATTACK"
            value={chord.attack}
            min={0.005}
            max={1.5}
            step={0.005}
            display={`${chord.attack.toFixed(2)}s`}
            onChange={(value) => patch('attack', value)}
          />
          <Knob
            label="DECAY"
            value={chord.decay}
            min={0.04}
            max={3}
            display={`${chord.decay.toFixed(2)}s`}
            onChange={(value) => patch('decay', value)}
          />
          <Knob
            label="SUSTAIN"
            value={chord.sustain}
            min={0.05}
            display={`${Math.round(chord.sustain * 100)}%`}
            onChange={(value) => patch('sustain', value)}
          />
          <Knob
            label="RELEASE"
            value={chord.release}
            min={0.08}
            max={8}
            display={`${chord.release.toFixed(1)}s`}
            onChange={(value) => patch('release', value)}
          />
          <Knob
            label="DETUNE"
            value={chord.detune}
            max={40}
            step={1}
            display={`${Math.round(chord.detune)} ct`}
            onChange={(value) => patch('detune', value)}
          />
          <Knob
            label="SPREAD"
            value={chord.spread}
            display={`${Math.round(chord.spread * 100)}%`}
            onChange={(value) => patch('spread', value)}
          />
          <Knob
            accent="red"
            label="DRIVE"
            value={chord.drive}
            display={`${Math.round(chord.drive * 100)}%`}
            onChange={(value) => patch('drive', value)}
          />
        </div>
      </div>

      <div className="progression-templates">
        <span>PROGRESSION TEMPLATES</span>
        {progressionTemplates.map((template) => (
          <button
            key={template.name}
            onClick={() => patch('steps', structuredClone(template.steps))}
          >
            {template.name}
          </button>
        ))}
        <small>Templates replace the eight chord slots but leave the sound design untouched.</small>
      </div>

      <div className="chord-steps">
        {chord.steps.map((step, index) => (
          <article
            className={`chord-step ${step.enabled ? '' : 'is-disabled'} ${
              activeStep === index ? 'is-playing' : ''
            }`}
            key={index}
          >
            <header>
              <span>0{index + 1}</span>
              <button
                className={`led-switch ${step.enabled ? 'is-active' : ''}`}
                aria-label={`Toggle chord step ${index + 1}`}
                onClick={() => patchStep(index, { enabled: !step.enabled })}
              >
                <i />
              </button>
            </header>
            <button
              className="chord-pad"
              disabled={!chord.enabled || !step.enabled}
              onClick={() => onTrigger(index)}
            >
              <i key={activeStep === index ? triggerCount : 0} />
              <strong>{chordLabel(chord.key, step)}</strong>
              <small>PRESS {index + 1}</small>
            </button>
            <label>
              ROOT
              <select
                value={step.offset}
                onChange={(event) => patchStep(index, { offset: Number(event.target.value) })}
              >
                {noteNames.map((_, offset) => (
                  <option value={offset} key={offset}>
                    {noteNames[(chord.key + offset) % 12]} ({offset === 0 ? 'I' : `+${offset}`})
                  </option>
                ))}
              </select>
            </label>
            <label>
              QUALITY
              <select
                value={step.quality}
                onChange={(event) =>
                  patchStep(index, { quality: event.target.value as ChordQuality })
                }
              >
                {qualities.map((quality) => (
                  <option value={quality} key={quality}>
                    {chordQualityLabels[quality]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              INVERSION
              <select
                value={step.inversion}
                onChange={(event) => patchStep(index, { inversion: Number(event.target.value) })}
              >
                <option value={0}>Root</option>
                <option value={1}>First</option>
                <option value={2}>Second</option>
                <option value={3}>Third</option>
              </select>
            </label>
          </article>
        ))}
      </div>

      <section
        className={`night-sax ${sax.enabled ? 'is-active' : ''}`}
        data-sax-count={saxCount}
      >
        <header>
          <div>
            <span>NIGHT SAX</span>
            <small>Breath-modelled monophonic phrases / follows the active chord harmony</small>
          </div>
          <button
            className={`sax-power ${sax.enabled ? 'is-active' : ''}`}
            onClick={() => patchSax('enabled', !sax.enabled)}
          >
            <i />
            {sax.enabled ? 'SAX ONLINE' : 'SAX OFFLINE'}
          </button>
        </header>

        <div className="sax-console">
          <div className="sax-performance">
            <label>
              PHRASE CHARACTER
              <select
                value={sax.style}
                onChange={(event) => patchSax('style', event.target.value as SaxPhraseStyle)}
              >
                <option value="lonely">Lonely descent</option>
                <option value="noir">Noir fragments</option>
                <option value="yearning">Yearning rise</option>
              </select>
            </label>
            <label>
              REGISTER
              <select
                value={sax.octave}
                onChange={(event) => patchSax('octave', Number(event.target.value))}
              >
                <option value={2}>Low / baritone</option>
                <option value={3}>Tenor</option>
                <option value={4}>High tenor</option>
                <option value={5}>Alto edge</option>
              </select>
            </label>
            <button
              className={`sax-auto ${sax.automatic ? 'is-active' : ''}`}
              disabled={!sax.enabled}
              onClick={() => patchSax('automatic', !sax.automatic)}
            >
              <i />
              {sax.automatic ? 'AUTO PHRASES ON' : 'AUTO PHRASES OFF'}
              <small>Activity controls the space between appearances</small>
            </button>
            <button className="sax-trigger" disabled={!sax.enabled} onClick={onTriggerSax}>
              PLAY A PHRASE
              <small>{saxCount} PHRASES PLAYED</small>
            </button>
          </div>

          <div className="sax-knobs">
            <Knob
              accent="cyan"
              label="LEVEL"
              value={sax.level}
              display={`${Math.round(sax.level * 100)}%`}
              onChange={(value) => patchSax('level', value)}
            />
            <Knob
              label="DARKNESS"
              value={sax.tone}
              display={`${Math.round((1 - sax.tone) * 100)}%`}
              onChange={(value) => patchSax('tone', value)}
            />
            <Knob
              label="BREATH"
              value={sax.breath}
              display={`${Math.round(sax.breath * 100)}%`}
              onChange={(value) => patchSax('breath', value)}
            />
            <Knob
              label="VIBRATO"
              value={sax.vibrato}
              display={`${Math.round(sax.vibrato * 100)}%`}
              onChange={(value) => patchSax('vibrato', value)}
            />
            <Knob
              label="SCOOP"
              value={sax.glide}
              display={`${Math.round(sax.glide * 100)}%`}
              onChange={(value) => patchSax('glide', value)}
            />
            <Knob
              label="EXPRESSION"
              value={sax.expression}
              display={`${Math.round(sax.expression * 100)}%`}
              onChange={(value) => patchSax('expression', value)}
            />
            <Knob
              accent="cyan"
              label="ACTIVITY"
              value={sax.activity}
              display={`${Math.round(sax.activity * 100)}%`}
              onChange={(value) => patchSax('activity', value)}
            />
          </div>
        </div>

        <footer>
          Night Sax uses original real-time synthesis: pitched reed harmonics, filtered breath,
          formant colour, note scoops and delayed vibrato. Automatic phrases remain deliberately
          sparse and continue while ordinary Evolution is Frozen.
        </footer>
      </section>

      <div className="chord-note">
        <strong>PERFORMANCE</strong>
        <p>
          Click a pad or press number keys 1–8 for manual stabs. Every note uses a detuned
          oscillator pair, animated low-pass envelope and individual drive stage before entering
          DRIFT’s shared effects, limiter, master fade and WAV recorder.
        </p>
      </div>
    </section>
  );
}

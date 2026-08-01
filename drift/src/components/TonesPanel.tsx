import type { AmbientCharacter, AmbientLayerState, BinauralState } from '../types';
import { Knob } from './Knob';

interface TonesPanelProps {
  binaural: BinauralState;
  ambientLayer: AmbientLayerState;
  ambientCount: number;
  onBinauralChange: (state: BinauralState) => void;
  onAmbientChange: (state: AmbientLayerState) => void;
  onTriggerAmbient: () => void;
}

const binauralPrograms: Array<{
  name: string;
  description: string;
  carrier: number;
  beat: number;
}> = [
  { name: 'SLOW DELTA', description: '2.5 Hz / night drift', carrier: 110, beat: 2.5 },
  { name: 'THETA PASSAGE', description: '6 Hz / meditative', carrier: 140, beat: 6 },
  { name: 'ALPHA FLOAT', description: '10 Hz / calm focus', carrier: 180, beat: 10 },
  { name: 'DEEP PULSE', description: '0.25 Hz / very slow', carrier: 250, beat: 0.25 },
];

const characterLabels: Record<AmbientCharacter, string> = {
  aurora: 'Aurora swells',
  glass: 'Glassy harmonics',
  choir: 'Synthetic choir',
  stars: 'Sparse star tones',
};

export function TonesPanel({
  binaural,
  ambientLayer,
  ambientCount,
  onBinauralChange,
  onAmbientChange,
  onTriggerAmbient,
}: TonesPanelProps) {
  const patchBinaural = <K extends keyof BinauralState>(key: K, value: BinauralState[K]) =>
    onBinauralChange({ ...binaural, [key]: value });
  const patchAmbient = <K extends keyof AmbientLayerState>(key: K, value: AmbientLayerState[K]) =>
    onAmbientChange({ ...ambientLayer, [key]: value });

  return (
    <section
      className="rack-panel tones-panel"
      data-ambient-count={ambientCount}
      data-binaural-beat={binaural.beat}
    >
      <div className="panel-title">
        <span>TONES &amp; AURORA</span>
        <small>Headphone-isolated binaural tones / generative upper atmosphere</small>
      </div>

      <div className="tones-grid">
        <section className={`binaural-module ${binaural.enabled ? 'is-active' : ''}`}>
          <header>
            <div>
              <span>STEREO BINAURAL TONES</span>
              <small>Independent sine tone for each ear / bypasses spatial effects</small>
            </div>
            <button
              className={`tone-power ${binaural.enabled ? 'is-active' : ''}`}
              onClick={() => patchBinaural('enabled', !binaural.enabled)}
            >
              <i />
              {binaural.enabled ? 'TONES ONLINE' : 'TONES OFFLINE'}
            </button>
          </header>

          <div className="binaural-programs">
            {binauralPrograms.map((program) => (
              <button
                key={program.name}
                className={
                  Math.abs(binaural.beat - program.beat) < 0.01 &&
                  Math.abs(binaural.carrier - program.carrier) < 0.01
                    ? 'is-selected'
                    : ''
                }
                onClick={() =>
                  onBinauralChange({
                    ...binaural,
                    enabled: true,
                    carrier: program.carrier,
                    beat: program.beat,
                  })
                }
              >
                <strong>{program.name}</strong>
                <small>{program.description}</small>
              </button>
            ))}
          </div>

          <div className="tone-knobs">
            <Knob
              accent="cyan"
              label="CARRIER"
              value={binaural.carrier}
              min={60}
              max={400}
              step={1}
              display={`${Math.round(binaural.carrier)} Hz`}
              onChange={(value) => patchBinaural('carrier', value)}
            />
            <Knob
              accent="cyan"
              label="BEAT"
              value={binaural.beat}
              min={0.25}
              max={40}
              step={0.05}
              display={`${binaural.beat.toFixed(binaural.beat < 1 ? 2 : 1)} Hz`}
              onChange={(value) => patchBinaural('beat', value)}
            />
            <Knob
              label="LEVEL"
              value={binaural.level}
              max={0.18}
              step={0.002}
              display={`${Math.round((binaural.level / 0.18) * 100)}%`}
              onChange={(value) => patchBinaural('level', value)}
            />
            <Knob
              label="DRIFT"
              value={binaural.drift}
              display={`${Math.round(binaural.drift * 100)}%`}
              onChange={(value) => patchBinaural('drift', value)}
            />
          </div>

          <div className="headphone-note">
            <strong>HEADPHONES REQUIRED</strong>
            <p>
              Each ear receives a different frequency. Keep the level quiet. These are exploratory
              listening presets, not a treatment or a guarantee of sleep, focus or brainwave
              entrainment.
            </p>
          </div>
        </section>

        <section className={`ambient-module ${ambientLayer.enabled ? 'is-active' : ''}`}>
          <header>
            <div>
              <span>GENERATIVE AMBIENT LAYER</span>
              <small>Sparse harmonic events above the main drone</small>
            </div>
            <button
              className={`tone-power ${ambientLayer.enabled ? 'is-active' : ''}`}
              onClick={() => patchAmbient('enabled', !ambientLayer.enabled)}
            >
              <i />
              {ambientLayer.enabled ? 'AURORA ONLINE' : 'AURORA OFFLINE'}
            </button>
          </header>

          <div className="ambient-character">
            <label>
              CHARACTER
              <select
                value={ambientLayer.character}
                onChange={(event) =>
                  patchAmbient('character', event.target.value as AmbientCharacter)
                }
              >
                {Object.entries(characterLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="ambient-trigger"
              disabled={!ambientLayer.enabled}
              onClick={onTriggerAmbient}
            >
              TRIGGER A SWELL
              <small>{ambientCount} EVENTS GENERATED</small>
            </button>
          </div>

          <div className="ambient-knobs">
            <Knob
              accent="cyan"
              label="LEVEL"
              value={ambientLayer.level}
              display={`${Math.round(ambientLayer.level * 100)}%`}
              onChange={(value) => patchAmbient('level', value)}
            />
            <Knob
              accent="cyan"
              label="ACTIVITY"
              value={ambientLayer.activity}
              display={`${Math.round(ambientLayer.activity * 100)}%`}
              onChange={(value) => patchAmbient('activity', value)}
            />
            <Knob
              label="BRIGHTNESS"
              value={ambientLayer.brightness}
              display={`${Math.round(ambientLayer.brightness * 100)}%`}
              onChange={(value) => patchAmbient('brightness', value)}
            />
            <Knob
              label="DECAY"
              value={ambientLayer.decay}
              display={`${(2.5 + ambientLayer.decay * 17).toFixed(1)}s`}
              onChange={(value) => patchAmbient('decay', value)}
            />
            <Knob
              label="SPREAD"
              value={ambientLayer.spread}
              display={`${Math.round(ambientLayer.spread * 100)}%`}
              onChange={(value) => patchAmbient('spread', value)}
            />
            <Knob
              label="DENSITY"
              value={ambientLayer.density}
              display={`${1 + Math.round(ambientLayer.density * 3)} NOTES`}
              onChange={(value) => patchAmbient('density', value)}
            />
          </div>

          <div className="ambient-note">
            <strong>LONG-FORM MOVEMENT</strong>
            <p>
              Activity controls the waiting time between events. Each swell follows the current
              program's root and enters DRIFT's chorus, delay, reverb, limiter and WAV recorder. It
              continues generating while ordinary Evolution is Frozen.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

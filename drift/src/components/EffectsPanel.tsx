import type { EffectsState } from '../types';
import { Knob } from './Knob';

interface EffectsPanelProps {
  effects: EffectsState;
  onChange: (effects: EffectsState) => void;
}

export function EffectsPanel({ effects, onChange }: EffectsPanelProps) {
  const patch = <K extends keyof EffectsState>(key: K, value: EffectsState[K]) =>
    onChange({ ...effects, [key]: value });
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  return (
    <section className="rack-panel effects-panel">
      <div className="panel-title"><span>ATMOSPHERE & PROCESSING</span><small>Parallel spatial sends / protected master bus</small></div>
      <div className="effects-grid">
        <div className="effect-block">
          <span className="section-tag">MODULATION</span>
          <Knob size="small" accent="cyan" label="ENSEMBLE" value={effects.chorus} display={percent(effects.chorus)} onChange={(value) => patch('chorus', value)} />
          <Knob size="small" accent="cyan" label="PHASER" value={effects.phaser} display={percent(effects.phaser)} onChange={(value) => patch('phaser', value)} />
          <Knob size="small" accent="cyan" label="FLANGER" value={effects.flanger} display={percent(effects.flanger)} onChange={(value) => patch('flanger', value)} />
          <Knob size="small" accent="cyan" label="TAPE WOBBLE" value={effects.wobble} display={percent(effects.wobble)} onChange={(value) => patch('wobble', value)} />
        </div>
        <div className="effect-block">
          <span className="section-tag">ECHO</span>
          <Knob size="small" label="DELAY SEND" value={effects.delay} display={percent(effects.delay)} onChange={(value) => patch('delay', value)} />
          <Knob size="small" label="TIME" value={effects.delayTime} min={0.03} max={7.5} step={0.01} display={`${effects.delayTime.toFixed(2)}s`} onChange={(value) => patch('delayTime', value)} />
          <Knob size="small" label="FEEDBACK" value={effects.delayFeedback} min={0} max={0.78} display={percent(effects.delayFeedback)} onChange={(value) => patch('delayFeedback', value)} />
        </div>
        <div className="effect-block">
          <span className="section-tag">SPACE</span>
          <Knob size="small" label="REVERB SEND" value={effects.reverb} display={percent(effects.reverb)} onChange={(value) => patch('reverb', value)} />
          <Knob size="small" label="DECAY" value={effects.reverbDecay} min={1} max={45} step={1} display={`${Math.round(effects.reverbDecay)}s`} onChange={(value) => patch('reverbDecay', value)} />
          <Knob size="small" label="WIDTH" value={effects.width} display={percent(effects.width)} onChange={(value) => patch('width', value)} />
        </div>
        <div className="effect-block">
          <span className="section-tag">MASTER COLOUR</span>
          <Knob size="small" accent="red" label="SATURATION" value={effects.saturation} display={percent(effects.saturation)} onChange={(value) => patch('saturation', value)} />
          <Knob size="small" accent="red" label="BIT REDUCTION" value={effects.bitReduction} display={percent(effects.bitReduction)} onChange={(value) => patch('bitReduction', value)} />
          <Knob size="small" label="HIGH-PASS" value={effects.highpass} min={10} max={1800} step={1} display={`${Math.round(effects.highpass)}Hz`} onChange={(value) => patch('highpass', value)} />
          <Knob size="small" label="LOW-PASS" value={effects.lowpass} min={300} max={20000} step={10} display={effects.lowpass >= 1000 ? `${(effects.lowpass / 1000).toFixed(1)}k` : `${Math.round(effects.lowpass)}`} onChange={(value) => patch('lowpass', value)} />
        </div>
      </div>
      <div className="master-chain"><span>VOICE BUS</span><i>→</i><span>COLOUR</span><i>→</i><span>GLUE 2.4:1</span><i>→</i><span className="safe">LIMIT −3 dB</span><i>→</i><span>OUTPUT</span></div>
    </section>
  );
}

import type { ModulationRoute } from '../types';

interface ModulationPanelProps {
  routes: ModulationRoute[];
  onChange: (routes: ModulationRoute[]) => void;
}

export function ModulationPanel({ routes, onChange }: ModulationPanelProps) {
  const patch = (index: number, values: Partial<ModulationRoute>) =>
    onChange(routes.map((route, routeIndex) => (routeIndex === index ? { ...route, ...values } : route)));
  return (
    <section className="rack-panel modulation-panel">
      <div className="panel-title">
        <span>MODULATION MATRIX</span>
        <small>Every route is smoothed before reaching the audio graph</small>
      </div>
      <div className="mod-table">
        <div className="mod-table__header">
          <span>ON</span><span>SOURCE</span><span>DESTINATION</span><span>RATE</span><span>DEPTH</span><span>ACTIVITY</span>
        </div>
        {routes.map((route, index) => (
          <div className={`mod-route ${route.enabled ? '' : 'is-disabled'}`} key={route.id}>
            <button className={`led-switch ${route.enabled ? 'is-active' : ''}`} aria-label={`Toggle ${route.id}`} onClick={() => patch(index, { enabled: !route.enabled })}><i /></button>
            <select value={route.source} onChange={(event) => patch(index, { source: event.target.value as ModulationRoute['source'] })}>
              <option value="lfo">Very slow LFO</option>
              <option value="random-walk">Random walk</option>
              <option value="sample-hold">Sample & hold</option>
              <option value="smooth-random">Smoothed random</option>
              <option value="coherent-noise">Coherent noise</option>
              <option value="long-envelope">Long envelope</option>
              <option value="probability">Probability events</option>
            </select>
            <select value={route.destination} onChange={(event) => patch(index, { destination: event.target.value as ModulationRoute['destination'] })}>
              <option value="pitch">Pitch drift</option>
              <option value="detune">Oscillator detune</option>
              <option value="cutoff">Filter cutoff</option>
              <option value="resonance">Resonance</option>
              <option value="amplitude">Amplitude</option>
              <option value="pan">Stereo position</option>
              <option value="harmonics">Harmonic content</option>
              <option value="space">Reverb field</option>
            </select>
            <label className="mini-slider"><input type="range" min={0.01} max={1} step={0.01} value={route.rate} onChange={(event) => patch(index, { rate: Number(event.target.value) })} /><span>{Math.round(route.rate * 100)}</span></label>
            <label className="mini-slider"><input type="range" min={0} max={1} step={0.01} value={route.depth} onChange={(event) => patch(index, { depth: Number(event.target.value) })} /><span>{Math.round(route.depth * 100)}</span></label>
            <div className="activity-trace" style={{ '--activity': `${route.depth * 100}%` } as React.CSSProperties}><i /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

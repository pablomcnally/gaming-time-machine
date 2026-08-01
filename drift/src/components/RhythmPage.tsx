import { useEffect, useMemo, useRef, useState } from 'react';
import { createSeed } from '../audio/seeded';
import { factoryKits } from '../rhythm/factory';
import { humanisePattern, rotateTrack } from '../rhythm/generator';
import { RHYTHM_NAME, drumVoices, type DrumVoiceId, type RhythmPattern, type RhythmState, type TransportState } from '../rhythm/types';
import { voiceNames } from '../rhythm/defaults';

interface Props {
  state: RhythmState;
  transport: TransportState;
  currentStep: number;
  meters: Record<DrumVoiceId, number>;
  busMeter: number;
  active: boolean;
  onChange: (state: RhythmState) => void;
  onAudition: (voice: DrumVoiceId) => void;
  onGenerate: () => void;
  onMutate: () => void;
  onToggleEvolution: () => void;
  onExportPattern: () => void;
  onImportPattern: () => void;
  onExportKit: () => void;
  onImportKit: () => void;
  onExportPreset: () => void;
  onImportPreset: () => void;
}

const styleLabels: Record<RhythmState['generative']['style'], string> = {
  'straight-machine': 'Straight Machine', electro: 'Electro', industrial: 'Industrial',
  'dub-techno': 'Dub Techno', 'ambient-pulse': 'Ambient Pulse', 'broken-beat': 'Broken Beat',
  minimal: 'Minimal', 'acid-rhythm': 'Acid Rhythm', 'slow-ritual': 'Slow Ritual',
  abstract: 'Abstract', sparse: 'Sparse', chaotic: 'Chaotic',
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function RhythmPage({
  state,
  transport,
  currentStep,
  meters,
  busMeter,
  active,
  onChange,
  onAudition,
  onGenerate,
  onMutate,
  onToggleEvolution,
  onExportPattern,
  onImportPattern,
  onExportKit,
  onImportKit,
  onExportPreset,
  onImportPreset,
}: Props) {
  const [selectedStep, setSelectedStep] = useState(0);
  const [clipboard, setClipboard] = useState<RhythmPattern | null>(null);
  const redoRef = useRef<RhythmPattern[]>([]);
  const pattern = state.banks[state.activeBank]?.patterns[state.activePattern] ?? state.banks[0]!.patterns[0]!;
  const track = pattern.tracks.find((candidate) => candidate.voice === state.selectedVoice)!;
  const pageStart = state.selectedPage * 16;
  const visibleSteps = track.steps.slice(pageStart, pageStart + 16);
  const selected = track.steps[selectedStep] ?? track.steps[0]!;

  const setPattern = (next: RhythmPattern, remember = true) => {
    const updated = structuredClone(state);
    if (remember) updated.mutationHistory = [...updated.mutationHistory.slice(-15), structuredClone(pattern)];
    updated.banks[updated.activeBank]!.patterns[updated.activePattern] = next;
    onChange(updated);
  };

  const updateTrack = (updater: (current: typeof track) => typeof track) => {
    const next = structuredClone(pattern);
    const index = next.tracks.findIndex((candidate) => candidate.voice === state.selectedVoice);
    next.tracks[index] = updater(next.tracks[index]!);
    setPattern(next);
  };

  const patchVoice = (key: keyof typeof track.params, value: number | boolean) =>
    updateTrack((current) => ({ ...current, params: { ...current.params, [key]: value } }));

  const patchStep = (key: keyof typeof selected, value: number | boolean | object) =>
    updateTrack((current) => {
      const next = structuredClone(current);
      next.steps[selectedStep] = { ...next.steps[selectedStep]!, [key]: value };
      return next;
    });

  const undo = () => {
    const previous = state.mutationHistory.at(-1);
    if (!previous) return;
    redoRef.current.push(structuredClone(pattern));
    const updated = structuredClone(state);
    updated.mutationHistory.pop();
    updated.banks[updated.activeBank]!.patterns[updated.activePattern] = structuredClone(previous);
    onChange(updated);
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) return;
    setPattern(next);
  };

  useEffect(() => {
    if (!active) return;
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        setClipboard(structuredClone(pattern)); event.preventDefault(); return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v' && clipboard) {
        setPattern(structuredClone(clipboard)); event.preventDefault(); return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        if (event.shiftKey) redo(); else undo(); event.preventDefault(); return;
      }
      if (event.key.toLowerCase() === 'g') {
        if (event.shiftKey) onMutate(); else onGenerate(); event.preventDefault(); return;
      }
      if (event.key.toLowerCase() === 'f') {
        const next = structuredClone(state); next.generative.frozen = !next.generative.frozen; onChange(next); return;
      }
      if (event.key.toLowerCase() === 'm') patchVoice('muted', !track.params.muted);
      if (event.key.toLowerCase() === 's') patchVoice('solo', !track.params.solo);
      if (event.key === 'Delete' || event.key === 'Backspace') patchStep('active', false);
      if (event.key === 'ArrowLeft') setSelectedStep((value) => Math.max(pageStart, value - 1));
      if (event.key === 'ArrowRight') setSelectedStep((value) => Math.min(pageStart + 15, value + 1));
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  const voiceControls = useMemo(() => {
    if (state.selectedVoice === 'kick') return ['tune', 'decay', 'attack', 'body', 'drive'] as const;
    if (state.selectedVoice === 'snare') return ['tune', 'tone', 'noise', 'decay', 'body', 'drive'] as const;
    if (state.selectedVoice.includes('Tom')) return ['tune', 'decay', 'tone', 'pitchEnvelope', 'drive'] as const;
    if (['closedHat', 'openHat', 'crash', 'ride'].includes(state.selectedVoice)) return ['tune', 'decay', 'metallic', 'tone', 'drive'] as const;
    if (state.selectedVoice === 'clap') return ['tone', 'spread', 'decay', 'noise', 'drive'] as const;
    return ['tune', 'tone', 'decay', 'drive'] as const;
  }, [state.selectedVoice]);

  return (
    <section className="rhythm-page" aria-label={`${RHYTHM_NAME} drum machine`}>
      <div className="rhythm-identity">
        <div><span>INSTRUMENT 02</span><h1>{RHYTHM_NAME}</h1><small>GENERATIVE PERCUSSION LAB / 11 VOICE CIRCUIT</small></div>
        <div className="rhythm-bus-meter"><i style={{ width: `${Math.min(100, busMeter * 280)}%` }} /><span>DRUM BUS</span></div>
      </div>

      <section className="rhythm-panel voice-selector">
        <header><strong>VOICE MATRIX</strong><small>Select a circuit; Shift-click is not required to audition.</small></header>
        <div className="voice-buttons">
          {drumVoices.map((voice) => (
            <button key={voice} className={state.selectedVoice === voice ? 'is-selected' : ''}
              onClick={() => onChange({ ...state, selectedVoice: voice })} onDoubleClick={() => onAudition(voice)}>
              <i style={{ height: `${Math.min(100, meters[voice] * 360)}%` }} />
              <span>{voiceNames[voice]}</span>
              <small>{pattern.tracks.find((candidate) => candidate.voice === voice)?.locked ? 'LOCK' : 'ARM'}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="rhythm-panel voice-editor">
        <header>
          <div><strong>{track.name}</strong><small>SYNTHESIS CIRCUIT</small></div>
          <button className={track.locked ? 'is-on' : ''} onClick={() => updateTrack((current) => ({ ...current, locked: !current.locked }))}>GEN LOCK</button>
          <button className={track.params.muted ? 'is-on warning' : ''} onClick={() => patchVoice('muted', !track.params.muted)}>MUTE</button>
          <button className={track.params.solo ? 'is-on' : ''} onClick={() => patchVoice('solo', !track.params.solo)}>SOLO</button>
          <button onClick={() => onAudition(track.voice)}>TRIGGER</button>
        </header>
        <div className="rhythm-controls">
          {voiceControls.map((control) => (
            <label key={control}>{control.replace(/([A-Z])/g, ' $1').toUpperCase()}
              <input type="range" min={0} max={1} step={0.01} value={Number(track.params[control])}
                onChange={(event) => patchVoice(control, Number(event.target.value))} />
              <span>{percent(Number(track.params[control]))}</span>
            </label>
          ))}
          <label>LEVEL<input type="range" min={0} max={0.9} step={0.01} value={track.params.level} onChange={(event) => patchVoice('level', Number(event.target.value))} /><span>{percent(track.params.level)}</span></label>
          <label>PAN<input type="range" min={-1} max={1} step={0.01} value={track.params.pan} onChange={(event) => patchVoice('pan', Number(event.target.value))} /><span>{Math.round(track.params.pan * 100)}</span></label>
        </div>
      </section>

      <section className="rhythm-panel sequencer">
        <header className="sequencer-head">
          <div><strong>POLYMETRIC STEP FIELD</strong><small>AUDIO-CLOCKED / {track.division} / STEP {String(currentStep + 1).padStart(2, '0')}</small></div>
          <label>BANK<select value={state.activeBank} onChange={(event) => onChange({ ...state, activeBank: Number(event.target.value), activePattern: 0 })}>{state.banks.map((bank, index) => <option key={bank.id} value={index}>{bank.name}</option>)}</select></label>
          <label>PATTERN<select value={state.queuedPattern ?? state.activePattern} onChange={(event) => { const target = Number(event.target.value); onChange(transport.playing && state.switchMode !== 'immediate' ? { ...state, queuedPattern: target } : { ...state, activePattern: target, queuedPattern: null }); }}>{state.banks[state.activeBank]!.patterns.map((item, index) => <option key={item.id} value={index}>{String(index + 1).padStart(2, '0')} / {item.name}</option>)}</select></label>
          <label>LENGTH<input type="number" min={1} max={64} value={track.length} onChange={(event) => updateTrack((current) => ({ ...current, length: Math.max(1, Math.min(64, Number(event.target.value))), lastStep: Math.max(0, Math.min(63, Number(event.target.value) - 1)) }))} /></label>
          <label>DIVISION<select value={track.division} onChange={(event) => updateTrack((current) => ({ ...current, division: event.target.value as typeof current.division }))}>{['1/4','1/8','1/16','1/32','1/8T','1/16T'].map((division) => <option key={division}>{division}</option>)}</select></label>
          <label>SWITCH<select value={state.switchMode} onChange={(event) => onChange({ ...state, switchMode: event.target.value as RhythmState['switchMode'] })}><option value="pattern">End of pattern</option><option value="bar">Next bar</option><option value="beat">Next beat</option><option value="immediate">Immediate</option></select></label>
          <label>CHAIN<input value={state.chain.map((slot) => slot + 1).join(',')} onChange={(event) => { const chain = event.target.value.split(',').map(Number).filter((value) => Number.isFinite(value) && value >= 1 && value <= 16).map((value) => value - 1).slice(0, 64); onChange({ ...state, chain: chain.length ? chain : [state.activePattern], chainPosition: 0 }); }} /></label>
        </header>
        <div className="page-select">{[0,1,2,3].map((page) => <button key={page} className={state.selectedPage === page ? 'is-on' : ''} onClick={() => onChange({ ...state, selectedPage: page })}>{page * 16 + 1}–{page * 16 + 16}</button>)}</div>
        <div className="step-grid">
          {visibleSteps.map((step, index) => {
            const absolute = pageStart + index;
            return <button key={absolute}
              className={`${step.active ? 'is-active' : ''} ${step.accent ? 'is-accent' : ''} ${step.protected ? 'is-protected' : ''} ${currentStep === absolute && transport.playing ? 'is-current' : ''} ${selectedStep === absolute ? 'is-selected' : ''}`}
              onClick={(event) => {
                setSelectedStep(absolute);
                if (event.altKey) patchStep('protected', !step.protected);
                else updateTrack((current) => { const next = structuredClone(current); next.steps[absolute]!.active = !next.steps[absolute]!.active; return next; });
              }}>
              <span>{String(absolute + 1).padStart(2, '0')}</span><i style={{ opacity: step.probability }} />
              <small>{step.ratchets > 1 ? `×${step.ratchets}` : step.locks && Object.keys(step.locks).length ? 'P' : ''}</small>
            </button>;
          })}
        </div>
        <div className="step-editor">
          <strong>STEP {String(selectedStep + 1).padStart(2, '0')}</strong>
          <button className={selected.accent ? 'is-on' : ''} onClick={() => patchStep('accent', !selected.accent)}>ACCENT</button>
          <button className={selected.protected ? 'is-on' : ''} onClick={() => patchStep('protected', !selected.protected)}>PROTECT</button>
          <label>VELOCITY<input type="range" min={0} max={1} step={0.01} value={selected.velocity} onChange={(event) => patchStep('velocity', Number(event.target.value))} /><span>{percent(selected.velocity)}</span></label>
          <label>PROBABILITY<input type="range" min={0} max={1} step={0.01} value={selected.probability} onChange={(event) => patchStep('probability', Number(event.target.value))} /><span>{percent(selected.probability)}</span></label>
          <label>MICRO ms<input type="range" min={-24} max={24} step={1} value={selected.microTiming} onChange={(event) => patchStep('microTiming', Number(event.target.value))} /><span>{selected.microTiming}</span></label>
          <label>RATCHET<select value={selected.ratchets} onChange={(event) => patchStep('ratchets', Number(event.target.value))}>{[1,2,3,4].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>FLAM<input type="range" min={0} max={1} step={0.01} value={selected.flam} onChange={(event) => patchStep('flam', Number(event.target.value))} /><span>{percent(selected.flam)}</span></label>
          <button onClick={() => patchStep('locks', Object.keys(selected.locks).length ? {} : { tune: track.params.tune, decay: track.params.decay })}>{Object.keys(selected.locks).length ? 'CLEAR P-LOCK' : 'LOCK TUNE/DECAY'}</button>
        </div>
        <footer className="pattern-tools">
          <button onClick={() => updateTrack((current) => ({ ...current, steps: current.steps.map(() => ({ ...current.steps[0]!, active: false, accent: false, protected: false, locks: {} })) }))}>CLEAR TRACK</button>
          <button onClick={() => setPattern({ ...pattern, tracks: pattern.tracks.map((item) => ({ ...item, steps: item.steps.map(() => ({ ...item.steps[0]!, active: false, accent: false, protected: false, locks: {} })) })) })}>CLEAR PATTERN</button>
          <button onClick={() => updateTrack((current) => rotateTrack(current, -1))}>SHIFT LEFT</button>
          <button onClick={() => updateTrack((current) => rotateTrack(current, 1))}>SHIFT RIGHT</button>
          <button onClick={() => setPattern(humanisePattern(pattern, state.generative.humanisation || 0.2, createSeed()))}>HUMANISE</button>
          <button onClick={() => { const next = structuredClone(state); const target = (state.activePattern + 1) % 16; next.banks[next.activeBank]!.patterns[target] = { ...structuredClone(pattern), id: `${pattern.id}-copy-${target}`, name: `${pattern.name} COPY` }; next.activePattern = target; onChange(next); }}>DUPLICATE</button>
          <button onClick={undo}>UNDO</button><button onClick={redo}>REDO</button>
          <button onClick={onExportPattern}>EXPORT PATTERN</button><button onClick={onImportPattern}>IMPORT PATTERN</button>
        </footer>
      </section>

      <section className="rhythm-lower-grid">
        <section className="rhythm-panel generator-panel">
          <header><div><strong>GENERATOR / EVOLUTION</strong><small>DETERMINISTIC MUSICAL RULE SYSTEM</small></div><code>{state.generative.seed}</code></header>
          <div className="generator-actions">
            <button onClick={onGenerate}>GENERATE</button><button onClick={onMutate}>MUTATE</button>
            <button className={state.generative.evolving ? 'is-on' : ''} onClick={onToggleEvolution}>EVOLVE</button>
            <button className={state.generative.frozen ? 'is-on' : ''} onClick={() => onChange({ ...state, generative: { ...state.generative, frozen: !state.generative.frozen } })}>FREEZE</button>
            <button onClick={() => onChange({ ...state, generative: { ...state.generative, seed: createSeed() } })}>NEW SEED</button>
            <button onClick={undo}>REVERT</button>
          </div>
          <div className="generator-grid">
            <label>STYLE<select value={state.generative.style} onChange={(event) => onChange({ ...state, generative: { ...state.generative, style: event.target.value as typeof state.generative.style } })}>{Object.entries(styleLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {(['density','complexity','variation','syncopation','humanisation','mutation','fillFrequency','accentStrength','swing','stability'] as const).map((key) =>
              <label key={key}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}<input type="range" min={0} max={1} step={0.01} value={state.generative[key]} onChange={(event) => onChange({ ...state, generative: { ...state.generative, [key]: Number(event.target.value) } })} /><span>{percent(state.generative[key])}</span></label>)}
          </div>
        </section>

        <section className="rhythm-panel drum-mix-panel">
          <header><strong>DRUM BUS / DYNAMICS</strong><small>PROTECTED ROUTE TO SHARED MASTER</small></header>
          <div className="generator-grid">
            <label>KIT<select value={state.kit.id} onChange={(event) => { const kit = factoryKits.find((item) => item.id === event.target.value)!; const next = structuredClone(state); next.kit = structuredClone(kit); for (const item of next.banks[next.activeBank]!.patterns[next.activePattern]!.tracks) item.params = structuredClone(kit.voices[item.voice]); next.effects = structuredClone(kit.effects); onChange(next); }}>{factoryKits.map((kit) => <option key={kit.id} value={kit.id}>{kit.name}</option>)}</select></label>
            <div className="data-actions"><button onClick={onExportKit}>EXPORT KIT</button><button onClick={onImportKit}>IMPORT KIT</button><button onClick={onExportPreset}>EXPORT RHYTHM</button><button onClick={onImportPreset}>IMPORT RHYTHM</button></div>
            <label>BUS LEVEL<input type="range" min={0} max={0.9} step={0.01} value={state.bus.volume} onChange={(event) => onChange({ ...state, bus: { ...state.bus, volume: Number(event.target.value) } })} /><span>{percent(state.bus.volume)}</span></label>
            {(['saturation','compression','transient','tone','parallelDrive','room','delay','width'] as const).map((key) => <label key={key}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}<input type="range" min={0} max={1} step={0.01} value={state.effects[key]} onChange={(event) => onChange({ ...state, effects: { ...state.effects, [key]: Number(event.target.value) } })} /><span>{percent(state.effects[key])}</span></label>)}
          </div>
        </section>

        <section className="rhythm-panel interaction-panel">
          <header><strong>INTERACTION / SIDECHAIN</strong><small>OFF BY DEFAULT / CLAMPED CONTROL ROUTE</small></header>
          <div className="sidechain-grid">
            <button className={state.sidechain.enabled ? 'is-on' : ''} onClick={() => onChange({ ...state, sidechain: { ...state.sidechain, enabled: !state.sidechain.enabled } })}>DRONE DUCK</button>
            <label>TRIGGER<select value={state.sidechain.trigger} onChange={(event) => onChange({ ...state, sidechain: { ...state.sidechain, trigger: event.target.value as typeof state.sidechain.trigger } })}>{drumVoices.map((voice) => <option key={voice} value={voice}>{voiceNames[voice]}</option>)}<option value="drum-bus">DRUM BUS</option></select></label>
            {(['amount','attack','release','filter'] as const).map((key) => <label key={key}>{key.toUpperCase()}<input type="range" min={0} max={key === 'release' ? 1.5 : 1} step={0.01} value={state.sidechain[key]} onChange={(event) => onChange({ ...state, sidechain: { ...state.sidechain, [key]: Number(event.target.value) } })} /><span>{key === 'attack' || key === 'release' ? `${state.sidechain[key].toFixed(2)}s` : percent(state.sidechain[key])}</span></label>)}
            <label>MODE<select value={state.sidechain.mode} onChange={(event) => onChange({ ...state, sidechain: { ...state.sidechain, mode: event.target.value as 'gentle' | 'pump' } })}><option value="gentle">Gentle transparent</option><option value="pump">External pump</option></select></label>
          </div>
          {state.interactions.map((route, index) => (
            <div className="interaction-route" key={route.id}>
              <button className={route.enabled ? 'is-on' : ''} onClick={() => { const next = structuredClone(state); next.interactions[index]!.enabled = !route.enabled; onChange(next); }}>{route.enabled ? 'ROUTE ON' : 'ROUTE OFF'}</button>
              <label>SOURCE<select value={route.source} onChange={(event) => { const next = structuredClone(state); next.interactions[index]!.source = event.target.value as typeof route.source; onChange(next); }}><option value="kick">Bass drum</option><option value="snare">Snare</option><option value="hats">Hats</option><option value="drum-bus">Drum bus</option></select></label>
              <label>DESTINATION<select value={route.destination} onChange={(event) => { const next = structuredClone(state); next.interactions[index]!.destination = event.target.value as typeof route.destination; onChange(next); }}><option value="drone-filter">Drone filter</option><option value="drone-duck">Drone level</option></select></label>
              <label>AMOUNT<input type="range" min={0} max={1} step={0.01} value={route.amount} onChange={(event) => { const next = structuredClone(state); next.interactions[index]!.amount = Number(event.target.value); onChange(next); }} /><span>{percent(route.amount)}</span></label>
              <label>SMOOTH<input type="range" min={0.02} max={2} step={0.01} value={route.smoothing} onChange={(event) => { const next = structuredClone(state); next.interactions[index]!.smoothing = Number(event.target.value); onChange(next); }} /><span>{route.smoothing.toFixed(2)}s</span></label>
              <button onClick={() => { const next = structuredClone(state); next.interactions[index]!.polarity = route.polarity === 1 ? -1 : 1; onChange(next); }}>POLARITY {route.polarity === 1 ? '+' : '−'}</button>
            </div>
          ))}
        </section>
      </section>
    </section>
  );
}

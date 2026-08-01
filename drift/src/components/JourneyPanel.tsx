import type { JourneyState, PulseState } from '../types';
import { Knob } from './Knob';

interface JourneyProgram {
  id: string;
  name: string;
}

interface JourneyPanelProps {
  journey: JourneyState;
  programs: JourneyProgram[];
  running: boolean;
  segment: number;
  progress: number;
  pulse: PulseState;
  pulseCount: number;
  onJourneyChange: (journey: JourneyState) => void;
  onPulseChange: (pulse: PulseState) => void;
  onToggleJourney: () => void;
  onSkip: () => void;
}

const routePoints = [
  { x: 8, y: 65 },
  { x: 36, y: 26 },
  { x: 65, y: 58 },
  { x: 92, y: 20 },
];

function formatTravel(seconds: number): string {
  if (seconds < 60) return `${seconds} SEC`;
  return `${Math.round(seconds / 60)} MIN`;
}

export function JourneyPanel({
  journey,
  programs,
  running,
  segment,
  progress,
  pulse,
  pulseCount,
  onJourneyChange,
  onPulseChange,
  onToggleJourney,
  onSkip,
}: JourneyPanelProps) {
  const scenes = journey.sceneIds
    .map((id) => programs.find((program) => program.id === id))
    .filter((program): program is JourneyProgram => Boolean(program));
  const points = routePoints.slice(0, scenes.length);
  const fromPoint = points[Math.min(segment, Math.max(0, points.length - 1))] ?? routePoints[0]!;
  const toPoint =
    points[(segment + 1) % Math.max(1, points.length)] ?? points[points.length - 1] ?? fromPoint;
  const traveller = {
    x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
    y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
  };
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const currentScene = scenes[Math.min(segment, Math.max(0, scenes.length - 1))];
  const nextScene = scenes[(segment + 1) % Math.max(1, scenes.length)];

  const patchPulse = <K extends keyof PulseState>(key: K, value: PulseState[K]) =>
    onPulseChange({ ...pulse, [key]: value });

  return (
    <section className="rack-panel journey-panel">
      <div className="panel-title">
        <span>JOURNEY & SLOW PULSE</span>
        <small>Travel between complete sound worlds / add a distant sub-rhythm</small>
      </div>

      <div className="journey-layout">
        <div className={`journey-map ${running ? 'is-running' : ''}`}>
          <div className="journey-map__stars" />
          <svg viewBox="0 0 100 82" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={linePoints} />
            {journey.loop && points.length > 2 && (
              <line
                x1={points[points.length - 1]!.x}
                y1={points[points.length - 1]!.y}
                x2={points[0]!.x}
                y2={points[0]!.y}
                className="journey-map__return"
              />
            )}
          </svg>
          {scenes.map((scene, index) => (
            <div
              className={`journey-node ${index === segment ? 'is-current' : ''}`}
              key={`${scene.id}-${index}`}
              style={{ left: `${points[index]!.x}%`, top: `${points[index]!.y}%` }}
            >
              <i />
              <span>0{index + 1}</span>
              <strong>{scene.name}</strong>
            </div>
          ))}
          {scenes.length > 1 && (
            <div
              className="journey-traveller"
              style={{ left: `${traveller.x}%`, top: `${traveller.y}%` }}
            >
              <i />
            </div>
          )}
          <div className="journey-readout">
            <span>{running ? 'IN TRANSIT' : 'ROUTE STANDBY'}</span>
            <strong>
              {currentScene?.name ?? 'SELECT A SCENE'}
              {running && nextScene ? ` → ${nextScene.name}` : ''}
            </strong>
            <small>
              {running ? `${Math.round(progress * 100)}% OF LEG` : `${scenes.length} SCENES ARMED`}
            </small>
          </div>
        </div>

        <div className="journey-controls">
          <div className="journey-scenes">
            {journey.sceneIds.map((id, index) => (
              <label key={index}>
                SCENE 0{index + 1}
                <select
                  disabled={running}
                  value={id}
                  onChange={(event) =>
                    onJourneyChange({
                      ...journey,
                      sceneIds: journey.sceneIds.map((sceneId, sceneIndex) =>
                        sceneIndex === index ? event.target.value : sceneId,
                      ),
                    })
                  }
                >
                  <option value="">— EMPTY —</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="journey-transport">
            <label>
              TIME PER LEG
              <select
                disabled={running}
                value={journey.travelSeconds}
                onChange={(event) =>
                  onJourneyChange({ ...journey, travelSeconds: Number(event.target.value) })
                }
              >
                <option value={10}>10 sec / audition</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={1200}>20 minutes</option>
                <option value={1800}>30 minutes</option>
              </select>
            </label>
            <label className="journey-loop">
              <input
                type="checkbox"
                disabled={running}
                checked={journey.loop}
                onChange={(event) => onJourneyChange({ ...journey, loop: event.target.checked })}
              />
              LOOP LAST → FIRST
            </label>
            <button
              className={running ? 'journey-stop' : 'journey-start'}
              onClick={onToggleJourney}
            >
              <i />
              {running ? 'STOP JOURNEY' : 'BEGIN JOURNEY'}
              <small>{formatTravel(journey.travelSeconds)} PER LEG</small>
            </button>
            <button className="journey-skip" disabled={!running} onClick={onSkip}>
              NEXT SCENE
            </button>
          </div>
        </div>

        <div className="pulse-controls">
          <div className="pulse-identity">
            <button
              className={`pulse-switch ${pulse.enabled ? 'is-active' : ''}`}
              data-pulse-count={pulseCount}
              onClick={() => patchPulse('enabled', !pulse.enabled)}
            >
              <span className="pulse-orbit">
                <i key={pulseCount} />
              </span>
              {pulse.enabled ? 'PULSE ONLINE' : 'PULSE OFFLINE'}
              <small>ROUTED THROUGH MASTER FX + RECORDER</small>
            </button>
            <label>
              CHARACTER
              <select
                value={pulse.pattern}
                onChange={(event) =>
                  patchPulse('pattern', event.target.value as PulseState['pattern'])
                }
              >
                <option value="breath">Slow breath</option>
                <option value="heartbeat">Double heartbeat</option>
                <option value="beacon">Distant beacon</option>
                <option value="drift">Irregular machinery</option>
              </select>
            </label>
          </div>
          <div className="pulse-knobs">
            <Knob
              accent="cyan"
              label="TEMPO"
              value={pulse.tempo}
              min={2}
              max={40}
              step={1}
              display={`${Math.round(pulse.tempo)} BPM`}
              onChange={(value) => patchPulse('tempo', value)}
            />
            <Knob
              accent="cyan"
              label="DEPTH"
              value={pulse.depth}
              display={`${Math.round(pulse.depth * 100)}%`}
              onChange={(value) => patchPulse('depth', value)}
            />
            <Knob
              accent="cyan"
              label="TONE"
              value={pulse.tone}
              display={`${Math.round(pulse.tone * 100)}%`}
              onChange={(value) => patchPulse('tone', value)}
            />
            <Knob
              accent="cyan"
              label="DECAY"
              value={pulse.decay}
              display={`${Math.round(pulse.decay * 100)}%`}
              onChange={(value) => patchPulse('decay', value)}
            />
            <Knob
              accent="cyan"
              label="IRREGULAR"
              value={pulse.irregularity}
              display={`${Math.round(pulse.irregularity * 100)}%`}
              onChange={(value) => patchPulse('irregularity', value)}
            />
          </div>
          <p>
            The pulse is intentionally sparse: two to forty beats per minute, softened by the shared
            colour, space and limiter. Irregularity bends the gap between events without changing
            the displayed centre tempo.
          </p>
        </div>
      </div>
    </section>
  );
}

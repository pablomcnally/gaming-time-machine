import { useEffect, useRef, useState } from 'react';
import type { AtmosphereEventKind, AtmosphereStatus } from '../audio/DriftEngine';
import type { AtmosphereState, ImportedSoundState } from '../types';
import { CustomSoundLibrary, type ImportedSoundLoadStatus } from './CustomSoundLibrary';
import { Knob } from './Knob';

interface AtmospherePanelProps {
  atmosphere: AtmosphereState;
  onChange: (atmosphere: AtmosphereState) => void;
  onTrigger: (kind: AtmosphereEventKind) => void;
  getStatus: () => AtmosphereStatus;
  importedSounds: ImportedSoundState[];
  importedStatuses: Record<string, ImportedSoundLoadStatus>;
  onImportSounds: () => void;
  onImportedChange: (sound: ImportedSoundState) => void;
  onImportedTrigger: (id: string) => void;
  onImportedRemove: (sound: ImportedSoundState) => void;
  customSpeechStatus: {
    state: 'standby' | 'rendering' | 'ready' | 'error';
    count: number;
    failed: number;
    path: string;
  };
  onOpenPhraseScript: () => void;
  onReloadPhraseScript: () => void;
}

const eventLabels: Array<{
  kind: AtmosphereEventKind;
  key: 'thunder' | 'sonar' | 'chatter' | 'transmission';
  title: string;
  description: string;
}> = [
  {
    kind: 'thunder',
    key: 'thunder',
    title: 'DISTANT THUNDER',
    description: 'Low weather mass and long sub-frequency decay',
  },
  {
    kind: 'sonar',
    key: 'sonar',
    title: 'SONAR / BEACON',
    description: 'Positioned pings with decaying field repetitions',
  },
  {
    kind: 'chatter',
    key: 'chatter',
    title: 'RADIO CHATTER',
    description: 'Procedural broken-band speech fragments',
  },
  {
    kind: 'transmission',
    key: 'transmission',
    title: 'ANNOUNCEMENTS',
    description: 'Original civic messages through damaged loudspeakers',
  },
];

export function AtmospherePanel({
  atmosphere,
  onChange,
  onTrigger,
  getStatus,
  importedSounds,
  importedStatuses,
  onImportSounds,
  onImportedChange,
  onImportedTrigger,
  onImportedRemove,
  customSpeechStatus,
  onOpenPhraseScript,
  onReloadPhraseScript,
}: AtmospherePanelProps) {
  const [status, setStatus] = useState<AtmosphereStatus>('waiting');
  const getStatusRef = useRef(getStatus);
  getStatusRef.current = getStatus;
  const patch = <K extends keyof AtmosphereState>(key: K, value: AtmosphereState[K]) =>
    onChange({ ...atmosphere, [key]: value });
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const speechRate = (value: number) => {
    const rate = value <= 0.5 ? 0.35 + value * 1.3 : 1 + (value - 0.5) * 2.4;
    return `${rate.toFixed(2)}×`;
  };

  useEffect(() => {
    const timer = window.setInterval(() => setStatus(getStatusRef.current()), 250);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className={`rack-panel atmosphere-panel ${atmosphere.enabled ? '' : 'is-disabled'}`}>
      <div className="panel-title">
        <span>ATMOSPHERE / FIELD EVENTS</span>
        <small>All layers enter the protected master chain and WAV recorder</small>
        <button
          className={`atmosphere-power ${atmosphere.enabled ? 'is-active' : ''}`}
          onClick={() => patch('enabled', !atmosphere.enabled)}
        >
          <i />
          {atmosphere.enabled ? 'FIELD ONLINE' : 'FIELD OFFLINE'}
        </button>
      </div>

      <div className="atmosphere-overview">
        <div className="weather-screen">
          <div className="weather-screen__grid" />
          <div className="weather-screen__rain" style={{ opacity: atmosphere.rain }} />
          <div className={`weather-pulse weather-pulse--${status}`} />
          <span>ENVIRONMENTAL ARRAY</span>
          <strong>{status === 'waiting' ? 'MONITORING' : status.toUpperCase()}</strong>
        </div>
        <div className="bus-mixer">
          <span className="section-tag">BUS MIXER</span>
          <div>
            <Knob
              size="large"
              label="DRONE"
              value={atmosphere.droneMix}
              display={percent(atmosphere.droneMix)}
              onChange={(value) => patch('droneMix', value)}
            />
            <Knob
              size="large"
              accent="cyan"
              label="ATMOSPHERE"
              value={atmosphere.fieldMix}
              display={percent(atmosphere.fieldMix)}
              onChange={(value) => patch('fieldMix', value)}
            />
          </div>
          <p>Independent levels before the shared effects and protected master output.</p>
        </div>
        <div className="rain-control">
          <span className="section-tag">CONTINUOUS BED</span>
          <Knob
            size="large"
            accent="cyan"
            label="RAINFALL"
            value={atmosphere.rain}
            display={percent(atmosphere.rain)}
            onChange={(value) => patch('rain', value)}
          />
          <p>Filtered, slowly breathing weather noise. It continues beneath discrete events.</p>
        </div>
        <div className="atmosphere-macros">
          <Knob
            label="ACTIVITY"
            value={atmosphere.activity}
            display={percent(atmosphere.activity)}
            onChange={(value) => patch('activity', value)}
          />
          <Knob
            label="ECHO"
            value={atmosphere.echo}
            display={percent(atmosphere.echo)}
            onChange={(value) => patch('echo', value)}
          />
          <Knob
            label="DISTANCE"
            value={atmosphere.distance}
            display={percent(atmosphere.distance)}
            onChange={(value) => patch('distance', value)}
          />
          <Knob
            label="RANDOMNESS"
            value={atmosphere.randomness}
            display={percent(atmosphere.randomness)}
            onChange={(value) => patch('randomness', value)}
          />
          <Knob
            label="SPEECH RATE"
            value={atmosphere.speechRate}
            display={speechRate(atmosphere.speechRate)}
            onChange={(value) => patch('speechRate', value)}
          />
          <Knob
            accent="red"
            label="GLITCH"
            value={atmosphere.speechGlitch}
            display={percent(atmosphere.speechGlitch)}
            onChange={(value) => patch('speechGlitch', value)}
          />
        </div>
      </div>

      <div className="atmosphere-events">
        {eventLabels.map((event) => (
          <article key={event.kind} className={`atmosphere-event atmosphere-event--${event.kind}`}>
            <header>
              <span className="event-lamp" />
              <div>
                <strong>{event.title}</strong>
                <small>{event.description}</small>
              </div>
            </header>
            <Knob
              size="medium"
              accent={event.kind === 'thunder' ? 'red' : event.kind === 'sonar' ? 'cyan' : 'amber'}
              label="LEVEL / WEIGHT"
              value={atmosphere[event.key]}
              display={percent(atmosphere[event.key])}
              onChange={(value) => patch(event.key, value)}
            />
            <button
              className="event-trigger"
              disabled={!atmosphere.enabled || atmosphere[event.key] <= 0}
              onClick={() => onTrigger(event.kind)}
            >
              TRIGGER NOW
            </button>
          </article>
        ))}
      </div>

      <section
        className="phrase-script"
        data-phrase-count={customSpeechStatus.count}
        data-phrase-state={customSpeechStatus.state}
      >
        <div>
          <span className="section-tag">CUSTOM PHRASE SCRIPT</span>
          <strong
            className={`phrase-script__status is-${customSpeechStatus.state}`}
            title={customSpeechStatus.path}
          >
            {customSpeechStatus.state === 'rendering'
              ? 'RENDERING WINDOWS SPEECH…'
              : customSpeechStatus.state === 'ready'
                ? `${customSpeechStatus.count} PHRASE${customSpeechStatus.count === 1 ? '' : 'S'} READY`
                : customSpeechStatus.state === 'error'
                  ? 'SPEECH RENDER FAILED'
                  : 'READY TO LOAD'}
          </strong>
          <p>
            One phrase per line. Optional tags: <code>[chatter]</code>, <code>[low]</code> and{' '}
            <code>[voice=Hazel]</code>. Save the text file, then reload it.
          </p>
          {customSpeechStatus.failed > 0 && (
            <small>{customSpeechStatus.failed} line(s) could not be rendered.</small>
          )}
        </div>
        <button className="phrase-open" onClick={onOpenPhraseScript}>
          OPEN PHRASE FILE
          <small>custom-phrases.txt</small>
        </button>
        <button
          className="phrase-reload"
          disabled={customSpeechStatus.state === 'rendering'}
          onClick={onReloadPhraseScript}
        >
          {customSpeechStatus.state === 'rendering' ? 'RENDERING…' : 'RELOAD PHRASES'}
          <small>Cache locally as WAV</small>
        </button>
      </section>

      <CustomSoundLibrary
        sounds={importedSounds}
        statuses={importedStatuses}
        onImport={onImportSounds}
        onChange={onImportedChange}
        onTrigger={onImportedTrigger}
        onRemove={onImportedRemove}
      />

      <div className="atmosphere-note">
        <strong>GENERATIVE BEHAVIOUR</strong>
        <p>
          Activity ranges from rare events several minutes apart to a busy environmental field.
          Level also acts as probability weight. Freeze prevents new automatic events while
          preserving rainfall and any echoes already in flight; manual triggers remain available.
          Speech Rate and Glitch affect both chatter and announcements. Imported Event sounds join
          this probability field; imported Loop beds remain continuous.
        </p>
      </div>
    </section>
  );
}

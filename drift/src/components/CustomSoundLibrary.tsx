import type { ImportedSoundState } from '../types';

export type ImportedSoundLoadStatus = 'stored' | 'loading' | 'ready' | 'error';

interface CustomSoundLibraryProps {
  sounds: ImportedSoundState[];
  statuses: Record<string, ImportedSoundLoadStatus>;
  onImport: () => void;
  onChange: (sound: ImportedSoundState) => void;
  onTrigger: (id: string) => void;
  onRemove: (sound: ImportedSoundState) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CustomSoundLibrary({
  sounds,
  statuses,
  onImport,
  onChange,
  onTrigger,
  onRemove,
}: CustomSoundLibraryProps) {
  const patch = <K extends keyof ImportedSoundState>(
    sound: ImportedSoundState,
    key: K,
    value: ImportedSoundState[K],
  ) => onChange({ ...sound, [key]: value });

  return (
    <section className="custom-library">
      <header>
        <div>
          <span className="section-tag">IMPORTED SOUND LIBRARY</span>
          <p>Managed copies / global across presets / maximum 100 MB per file</p>
        </div>
        <button className="custom-import" onClick={onImport}>
          + IMPORT SOUNDS
          <small>WAV · MP3 · OGG · M4A · AAC · FLAC</small>
        </button>
      </header>

      {!sounds.length ? (
        <div className="custom-library__empty">
          <strong>NO CUSTOM SOUNDS LOADED</strong>
          <p>
            Import field recordings, voices, machinery, weather or found audio. Event sounds can
            appear automatically; Loop sounds form continuous beds.
          </p>
        </div>
      ) : (
        <div className="custom-sound-table">
          <div className="custom-sound-table__head">
            <span>ON</span>
            <span>NAME / STATUS</span>
            <span>MODE</span>
            <span>LEVEL</span>
            <span>SPEED</span>
            <span>AUTO</span>
            <span>WEIGHT</span>
            <span>ACTION</span>
          </div>
          {sounds.map((sound) => {
            const status = statuses[sound.id] ?? 'stored';
            const looping = sound.mode === 'loop';
            return (
              <article
                className={`custom-sound-row ${sound.enabled ? '' : 'is-disabled'}`}
                key={sound.id}
              >
                <button
                  className={`led-switch ${sound.enabled ? 'is-active' : ''}`}
                  aria-label={`${sound.enabled ? 'Disable' : 'Enable'} ${sound.name}`}
                  onClick={() => patch(sound, 'enabled', !sound.enabled)}
                >
                  <i />
                </button>
                <label className="custom-sound-name">
                  <input
                    value={sound.name}
                    maxLength={64}
                    onChange={(event) => patch(sound, 'name', event.target.value)}
                  />
                  <small className={`is-${status}`}>
                    {status.toUpperCase()} · {formatSize(sound.size)}
                  </small>
                </label>
                <select
                  value={sound.mode}
                  onChange={(event) =>
                    patch(sound, 'mode', event.target.value as ImportedSoundState['mode'])
                  }
                >
                  <option value="event">Event</option>
                  <option value="loop">Loop bed</option>
                </select>
                <label className="custom-mini-slider">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={sound.level}
                    onChange={(event) => patch(sound, 'level', Number(event.target.value))}
                  />
                  <span>{Math.round(sound.level * 100)}%</span>
                </label>
                <label className="custom-mini-slider">
                  <input
                    type="range"
                    min={0.35}
                    max={2.2}
                    step={0.01}
                    value={sound.rate}
                    onChange={(event) => patch(sound, 'rate', Number(event.target.value))}
                  />
                  <span>{sound.rate.toFixed(2)}×</span>
                </label>
                <label className={`custom-check ${looping ? 'is-unavailable' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={looping}
                    checked={!looping && sound.automatic}
                    onChange={(event) => patch(sound, 'automatic', event.target.checked)}
                  />
                  {looping ? 'LIVE' : 'AUTO'}
                </label>
                <label className={`custom-mini-slider ${looping ? 'is-unavailable' : ''}`}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    disabled={looping || !sound.automatic}
                    value={sound.weight}
                    onChange={(event) => patch(sound, 'weight', Number(event.target.value))}
                  />
                  <span>{looping ? '—' : Math.round(sound.weight * 100)}</span>
                </label>
                <div className="custom-sound-actions">
                  <button
                    className="custom-trigger"
                    disabled={!sound.enabled || looping || status !== 'ready'}
                    onClick={() => onTrigger(sound.id)}
                  >
                    {looping ? 'LOOP LIVE' : 'TRIGGER'}
                  </button>
                  <button
                    className="custom-remove"
                    title={`Remove ${sound.name}`}
                    onClick={() => onRemove(sound)}
                  >
                    ×
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer>
        Event Weight joins Sonar, Thunder, Chatter and Announcements in the automatic Atmosphere
        selection. Loop beds continue beneath events and Freeze, but follow Field Online/Offline and
        the Atmosphere bus level.
      </footer>
    </section>
  );
}

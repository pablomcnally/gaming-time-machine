import type { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  devices: MediaDeviceInfo[];
  onChange: (settings: AppSettings) => void;
  onClose: () => void;
  onChooseDirectory: (kind: 'preset' | 'recording') => void;
}

export function SettingsPanel({ settings, devices, onChange, onClose, onChooseDirectory }: SettingsPanelProps) {
  const patch = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    onChange({ ...settings, [key]: value });
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-modal" role="dialog" aria-modal="true" aria-label="DRIFT settings">
        <header><div><span className="eyebrow">SYSTEM CONFIGURATION</span><h2>SETTINGS</h2></div><button onClick={onClose}>CLOSE ×</button></header>
        <div className="settings-grid">
          <label>AUDIO OUTPUT<select value={settings.outputDeviceId} onChange={(event) => patch('outputDeviceId', event.target.value)}><option value="">System default</option>{devices.filter((device) => device.kind === 'audiooutput').map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Output ${index + 1}`}</option>)}</select><small>Device selection depends on Chromium / Windows support.</small></label>
          <label>SAMPLE RATE<select value={settings.sampleRate} onChange={(event) => patch('sampleRate', Number(event.target.value) as AppSettings['sampleRate'])}><option value={44100}>44.1 kHz</option><option value={48000}>48 kHz</option><option value={96000}>96 kHz</option></select><small>Applied when the audio engine is restarted.</small></label>
          <label>LATENCY MODE<select value={settings.latencyHint} onChange={(event) => patch('latencyHint', event.target.value as AppSettings['latencyHint'])}><option value="interactive">Low latency</option><option value="balanced">Balanced</option><option value="playback">Maximum stability</option></select></label>
          <label>DEFAULT MASTER<input type="range" min={0} max={0.72} step={0.01} value={settings.defaultMaster} onChange={(event) => patch('defaultMaster', Number(event.target.value))} /><span>{Math.round(settings.defaultMaster * 100)}%</span></label>
          <label>VISUALISER QUALITY<select value={settings.visualizerQuality} onChange={(event) => patch('visualizerQuality', event.target.value as AppSettings['visualizerQuality'])}><option value="low">Low / 12 fps</option><option value="medium">Medium / 24 fps</option><option value="high">High / 40 fps</option></select></label>
          <div className="setting-toggles">
            <label><input type="checkbox" checked={settings.startMuted} onChange={(event) => patch('startMuted', event.target.checked)} />START MUTED</label>
            <label><input type="checkbox" checked={settings.restoreSession} onChange={(event) => patch('restoreSession', event.target.checked)} />RESTORE PREVIOUS SESSION</label>
            <label><input type="checkbox" checked={settings.closeBehavior === 'tray'} onChange={(event) => patch('closeBehavior', event.target.checked ? 'tray' : 'quit')} />X CLOSES TO SYSTEM TRAY</label>
            <label><input type="checkbox" checked={settings.maximumCpu} onChange={(event) => patch('maximumCpu', event.target.checked)} />MAXIMUM CPU MODE</label>
          </div>
          <label className="path-setting">PRESET STORAGE<span>{settings.presetLocation || 'Application data folder'}</span><button onClick={() => onChooseDirectory('preset')}>CHOOSE FOLDER</button></label>
          <label className="path-setting">RECORDING LOCATION<span>{settings.recordingLocation || 'Windows Music folder'}</span><button onClick={() => onChooseDirectory('recording')}>CHOOSE FOLDER</button></label>
        </div>
        <footer>Changes are saved automatically. Audio format changes take effect after restarting DRIFT.</footer>
      </section>
    </div>
  );
}

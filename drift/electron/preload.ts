import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('driftDesktop', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (state: unknown) => ipcRenderer.invoke('state:save', state),
  exportPreset: (preset: unknown, suggestedName: string) =>
    ipcRenderer.invoke('preset:export', preset, suggestedName),
  importPreset: () => ipcRenderer.invoke('preset:import'),
  importAudio: () => ipcRenderer.invoke('audio:import'),
  loadAudio: (fileName: string) => ipcRenderer.invoke('audio:load', fileName),
  removeAudio: (fileName: string) => ipcRenderer.invoke('audio:remove', fileName),
  openPhraseScript: () => ipcRenderer.invoke('speech:open-script'),
  reloadPhraseScript: () => ipcRenderer.invoke('speech:reload'),
  saveRecording: (bytes: Uint8Array, suggestedName: string, recordingLocation?: string) =>
    ipcRenderer.invoke('recording:save', bytes, suggestedName, recordingLocation),
  chooseDirectory: (kind: 'preset' | 'recording') => ipcRenderer.invoke('directory:choose', kind),
  setTrayEnabled: (enabled: boolean) => ipcRenderer.invoke('tray:set-enabled', enabled),
  setPowerSave: (active: boolean) => ipcRenderer.invoke('power:set-active', active),
  onTrayAction: (callback: (action: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
    ipcRenderer.on('tray:action', listener);
    return () => ipcRenderer.removeListener('tray:action', listener);
  },
});

/// <reference types="vite/client" />

interface DriftDesktopAPI {
  loadState: () => Promise<unknown>;
  saveState: (state: unknown) => Promise<boolean>;
  exportPreset: (preset: unknown, suggestedName: string) => Promise<boolean>;
  importPreset: () => Promise<unknown | null>;
  importAudio: () => Promise<Array<{ id: string; name: string; fileName: string; size: number }>>;
  loadAudio: (fileName: string) => Promise<Uint8Array | null>;
  removeAudio: (fileName: string) => Promise<boolean>;
  openPhraseScript: () => Promise<{ path: string; error: string }>;
  reloadPhraseScript: () => Promise<{
    path: string;
    clips: Array<{
      id: string;
      text: string;
      kind: 'chatter' | 'transmission';
      lowVoice: boolean;
      bytes: Uint8Array;
    }>;
    failed: number;
  }>;
  saveRecording: (
    bytes: Uint8Array,
    suggestedName: string,
    recordingLocation?: string,
  ) => Promise<string | null>;
  chooseDirectory: (kind: 'preset' | 'recording') => Promise<string | null>;
  setTrayEnabled: (enabled: boolean) => Promise<boolean>;
  setPowerSave: (active: boolean) => Promise<boolean>;
  onTrayAction: (callback: (action: string) => void) => () => void;
}

interface Window {
  driftDesktop?: DriftDesktopAPI;
}

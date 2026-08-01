import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import packageInfo from '../package.json';
import { DriftEngine, type AtmosphereEventKind, type CustomSpeechClip } from './audio/DriftEngine';
import { EvolutionEngine } from './audio/evolution';
import { interpolatePreset, smoothJourneyProgress } from './audio/journey';
import { clamp } from './audio/math';
import { createSeed, SeededRandom } from './audio/seeded';
import { encodeWav } from './audio/wav';
import { EffectsPanel } from './components/EffectsPanel';
import { AtmospherePanel } from './components/AtmospherePanel';
import { ChordPanel } from './components/ChordPanel';
import type { ImportedSoundLoadStatus } from './components/CustomSoundLibrary';
import { Knob } from './components/Knob';
import { JourneyPanel } from './components/JourneyPanel';
import { ManualPanel } from './components/ManualPanel';
import { ModulationPanel } from './components/ModulationPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { TonesPanel } from './components/TonesPanel';
import { Visualizer } from './components/Visualizer';
import { VoiceStrip } from './components/VoiceStrip';
import {
  defaultAtmosphere,
  defaultAmbientLayer,
  defaultBinaural,
  defaultChord,
  defaultJourney,
  defaultMacros,
  defaultPulse,
  defaultSax,
  defaultSettings,
  makeDefaultState,
} from './presets/defaults';
import { factoryPresets } from './presets/factory';
import { deserializePreset, serializePreset } from './presets/serialization';
import type {
  AppSettings,
  DriftPreset,
  EvolutionFrame,
  ImportedSoundState,
  JourneyState,
  MacroState,
  PersistedState,
  TuningMode,
  VoiceState,
} from './types';

type Panel =
  'voices' | 'modulation' | 'effects' | 'atmosphere' | 'journey' | 'chords' | 'tones' | 'recording';
const panelTabs: Panel[] = [
  'voices',
  'modulation',
  'effects',
  'atmosphere',
  'journey',
  'chords',
  'tones',
  'recording',
];
type AudioStatus = 'idle' | 'starting' | 'running' | 'error';
const PANIC_FADE_SECONDS = 4;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalisePreset(value: DriftPreset): DriftPreset {
  return {
    ...clone(value),
    macros: {
      ...clone(defaultMacros),
      ...(value.macros ?? {}),
    },
    atmosphere: {
      ...clone(defaultAtmosphere),
      ...(value.atmosphere ?? {}),
    },
    pulse: {
      ...clone(defaultPulse),
      ...(value.pulse ?? {}),
    },
    binaural: {
      ...clone(defaultBinaural),
      ...(value.binaural ?? {}),
    },
    ambientLayer: {
      ...clone(defaultAmbientLayer),
      ...(value.ambientLayer ?? {}),
    },
    chord: {
      ...clone(defaultChord),
      ...(value.chord ?? {}),
      steps: Array.from({ length: 8 }, (_, index) => ({
        ...clone(defaultChord.steps[index]!),
        ...(value.chord?.steps?.[index] ?? {}),
      })),
    },
    sax: {
      ...clone(defaultSax),
      ...(value.sax ?? {}),
    },
  };
}

function normaliseJourney(value?: Partial<JourneyState>): JourneyState {
  const ids = Array.isArray(value?.sceneIds)
    ? value.sceneIds.filter((id): id is string => typeof id === 'string').slice(0, 4)
    : [];
  while (ids.length < 4) ids.push(defaultJourney.sceneIds[ids.length] ?? '');
  return {
    ...clone(defaultJourney),
    ...value,
    sceneIds: ids,
    travelSeconds: clamp(Number(value?.travelSeconds ?? defaultJourney.travelSeconds), 10, 1800),
    loop: typeof value?.loop === 'boolean' ? value.loop : defaultJourney.loop,
  };
}

function normaliseImportedSound(value: unknown): ImportedSoundState | null {
  if (!value || typeof value !== 'object') return null;
  const sound = value as Partial<ImportedSoundState>;
  if (
    typeof sound.id !== 'string' ||
    typeof sound.name !== 'string' ||
    typeof sound.fileName !== 'string'
  ) {
    return null;
  }
  return {
    id: sound.id,
    name: sound.name.slice(0, 64),
    fileName: sound.fileName,
    size: clamp(Number(sound.size ?? 0), 0, 100 * 1024 * 1024),
    enabled: typeof sound.enabled === 'boolean' ? sound.enabled : true,
    mode: sound.mode === 'loop' ? 'loop' : 'event',
    level: clamp(Number(sound.level ?? 0.65), 0, 1),
    rate: clamp(Number(sound.rate ?? 1), 0.35, 2.2),
    automatic: typeof sound.automatic === 'boolean' ? sound.automatic : true,
    weight: clamp(Number(sound.weight ?? 0.5), 0, 1),
  };
}

function validPreset(value: unknown): value is DriftPreset {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DriftPreset>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.seed === 'string' &&
    Array.isArray(candidate.voices) &&
    candidate.voices.length === 4 &&
    Boolean(candidate.macros) &&
    Boolean(candidate.effects) &&
    Boolean(candidate.tuning) &&
    Array.isArray(candidate.modulation)
  );
}

function dateStamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [preset, setPreset] = useState<DriftPreset>(() => clone(factoryPresets[0]!));
  const [savedSnapshot, setSavedSnapshot] = useState<DriftPreset>(() => clone(factoryPresets[0]!));
  const [userPresets, setUserPresets] = useState<DriftPreset[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => clone(defaultSettings));
  const [loaded, setLoaded] = useState(false);
  const [engine, setEngine] = useState<DriftEngine | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('idle');
  const [audioError, setAudioError] = useState('');
  const [muted, setMuted] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const [activePanel, setActivePanel] = useState<Panel>('voices');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [meter, setMeter] = useState({ rms: 0, peak: 0 });
  const [liveFrame, setLiveFrame] = useState<EvolutionFrame | null>(null);
  const [cpu, setCpu] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(0);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [panicFading, setPanicFading] = useState(false);
  const [journey, setJourney] = useState<JourneyState>(() => clone(defaultJourney));
  const [journeyRunning, setJourneyRunning] = useState(false);
  const [journeySegment, setJourneySegment] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const [importedSounds, setImportedSounds] = useState<ImportedSoundState[]>([]);
  const [importedStatuses, setImportedStatuses] = useState<Record<string, ImportedSoundLoadStatus>>(
    {},
  );
  const [customSpeechStatus, setCustomSpeechStatus] = useState<{
    state: 'standby' | 'rendering' | 'ready' | 'error';
    count: number;
    failed: number;
    path: string;
  }>({ state: 'standby', count: 0, failed: 0, path: '' });
  const [chordStatus, setChordStatus] = useState({ step: -1, count: 0 });
  const [ambientCount, setAmbientCount] = useState(0);
  const [saxCount, setSaxCount] = useState(0);
  const [pendingRecording, setPendingRecording] = useState<{
    bytes: Uint8Array;
    filename: string;
  } | null>(null);
  const [notice, setNotice] = useState('');

  const evolutionRef = useRef(new EvolutionEngine(preset.seed));
  const presetRef = useRef(preset);
  const frozenRef = useRef(frozen);
  const engineRef = useRef<DriftEngine | null>(null);
  const mutationCount = useRef(0);
  const dspBudget = useRef({ spent: 0, since: performance.now() });
  const liveFrameRef = useRef<EvolutionFrame | null>(null);
  const stopRecordingRef = useRef<() => Promise<void>>(async () => undefined);
  const recordingRef = useRef(recording);
  const recordingStartedAtRef = useRef(recordingStartedAt);
  const panicTimerRef = useRef<number | null>(null);
  const journeyRunningRef = useRef(false);
  const journeySegmentRef = useRef(0);
  const journeyLegStartedAtRef = useRef(0);
  const journeyLastTickRef = useRef(0);
  const importedSoundsRef = useRef(importedSounds);
  const customSpeechClipsRef = useRef<CustomSpeechClip[]>([]);

  recordingRef.current = recording;
  recordingStartedAtRef.current = recordingStartedAt;
  importedSoundsRef.current = importedSounds;

  const allPresets = useMemo(
    () => [
      ...factoryPresets
        .map((item) => ({ ...item, favourite: favourites.includes(item.id) }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      ...userPresets
        .map((item) => ({ ...item, favourite: favourites.includes(item.id) }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    ],
    [favourites, userPresets],
  );

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? '' : current)), 2800);
  }, []);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);
  useEffect(() => {
    frozenRef.current = frozen;
    evolutionRef.current.setFrozen(frozen);
    engineRef.current?.setAtmosphereFrozen(frozen);
  }, [frozen]);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  useEffect(() => {
    const load = async () => {
      let saved: PersistedState | null = null;
      try {
        if (window.driftDesktop) {
          saved = (await window.driftDesktop.loadState()) as PersistedState | null;
        } else {
          const raw = localStorage.getItem('drift-state');
          saved = raw ? (JSON.parse(raw) as PersistedState) : null;
        }
      } catch {
        saved = null;
      }
      const state = saved?.version === 1 ? saved : makeDefaultState();
      setSettings({ ...defaultSettings, ...state.settings });
      const restoredUsers = Array.isArray(state.userPresets)
        ? state.userPresets.filter(validPreset).map(normalisePreset)
        : [];
      setUserPresets(restoredUsers);
      setFavourites(Array.isArray(state.favourites) ? state.favourites : []);
      setJourney(normaliseJourney(state.journey));
      const restoredSounds = Array.isArray(state.importedSounds)
        ? state.importedSounds
            .map(normaliseImportedSound)
            .filter((sound): sound is ImportedSoundState => Boolean(sound))
            .slice(0, 16)
        : [];
      setImportedSounds(restoredSounds);
      setImportedStatuses(Object.fromEntries(restoredSounds.map((sound) => [sound.id, 'stored'])));
      const collection = [...factoryPresets, ...restoredUsers];
      const restored =
        state.settings?.restoreSession && state.lastPreset && validPreset(state.lastPreset)
          ? state.lastPreset
          : (collection.find((item) => item.id === state.lastPresetId) ?? factoryPresets[0]!);
      const normalised = normalisePreset(restored);
      setPreset(normalised);
      setSavedSnapshot(clone(normalised));
      evolutionRef.current.reseed(restored.seed);
      setLoaded(true);
    };
    void load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timeout = window.setTimeout(() => {
      const state: PersistedState = {
        version: 1,
        settings,
        userPresets,
        favourites,
        lastPresetId: preset.id,
        lastPreset: clone(preset),
        journey,
        importedSounds,
      };
      if (window.driftDesktop) void window.driftDesktop.saveState(state);
      else localStorage.setItem('drift-state', JSON.stringify(state));
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [favourites, importedSounds, journey, loaded, preset, settings, userPresets]);

  useEffect(() => {
    if (!window.driftDesktop) return;
    void window.driftDesktop.setTrayEnabled(settings.closeBehavior === 'tray');
  }, [settings.closeBehavior]);

  useEffect(() => {
    if (!engine) return;
    let previous = performance.now();
    const interval = window.setInterval(
      () => {
        const begin = performance.now();
        const now = performance.now();
        const frame = evolutionRef.current.update((now - previous) / 1000, presetRef.current);
        liveFrameRef.current = frame;
        previous = now;
        engine.applyPreset(presetRef.current, frame);
        dspBudget.current.spent += performance.now() - begin;
      },
      settings.maximumCpu ? 40 : 90,
    );
    return () => window.clearInterval(interval);
  }, [engine, settings.maximumCpu]);

  useEffect(() => {
    if (!engine) return;
    const interval = window.setInterval(() => {
      const frame = engine.getMeterFrame();
      setMeter({ rms: frame.rms, peak: frame.peak });
      setPulseCount(engine.getPulseCount());
      setChordStatus(engine.getChordStatus());
      setAmbientCount(engine.getAmbientCount());
      setSaxCount(engine.getSaxCount());
      setLiveFrame(liveFrameRef.current);
      const now = performance.now();
      const elapsed = now - dspBudget.current.since;
      setCpu(clamp((dspBudget.current.spent / Math.max(1, elapsed)) * 100, 0, 99));
      dspBudget.current = { spent: 0, since: now };
    }, 350);
    return () => window.clearInterval(interval);
  }, [engine]);

  useEffect(() => {
    engine?.setImportedSounds(importedSounds);
  }, [engine, importedSounds]);

  useEffect(() => {
    journeyRunningRef.current = journeyRunning;
    if (!journeyRunning) return;
    const route = journey.sceneIds
      .map((id) => allPresets.find((candidate) => candidate.id === id))
      .filter((candidate): candidate is DriftPreset => Boolean(candidate))
      .map(normalisePreset);
    if (route.length < 2) {
      journeyRunningRef.current = false;
      setJourneyRunning(false);
      notify('Journey needs at least two available scenes.');
      return;
    }

    const timer = window.setInterval(() => {
      const now = performance.now();
      if (frozenRef.current) {
        journeyLegStartedAtRef.current += now - journeyLastTickRef.current;
        journeyLastTickRef.current = now;
        return;
      }
      journeyLastTickRef.current = now;
      const rawProgress = clamp(
        (now - journeyLegStartedAtRef.current) / (journey.travelSeconds * 1000),
        0,
        1,
      );
      const segment = journeySegmentRef.current;
      const from = route[segment]!;
      const to = route[(segment + 1) % route.length]!;
      const next = interpolatePreset(from, to, smoothJourneyProgress(rawProgress));
      next.chord.running = presetRef.current.chord.running;
      presetRef.current = next;
      setPreset(next);
      setJourneyProgress(rawProgress);

      if (rawProgress < 1) return;
      const arrivedIndex = (segment + 1) % route.length;
      const arrived = clone(route[arrivedIndex]!);
      arrived.chord.running = presetRef.current.chord.running;
      presetRef.current = arrived;
      setPreset(arrived);
      evolutionRef.current.reseed(arrived.seed);

      if (!journey.loop && arrivedIndex === route.length - 1) {
        journeyRunningRef.current = false;
        setJourneyRunning(false);
        setJourneyProgress(1);
        notify(`Journey arrived at ${arrived.name}.`);
        return;
      }

      journeySegmentRef.current = arrivedIndex;
      journeyLegStartedAtRef.current = now;
      journeyLastTickRef.current = now;
      setJourneySegment(arrivedIndex);
      setJourneyProgress(0);
    }, 200);

    return () => window.clearInterval(timer);
  }, [allPresets, journey, journeyRunning, notify]);

  useEffect(() => {
    if (!engine) return;
    const timeout = window.setTimeout(() => engine.rebuildReverb(preset.effects.reverbDecay), 850);
    return () => window.clearTimeout(timeout);
  }, [engine, preset.effects.reverbDecay]);

  useEffect(() => {
    if (!engine || !settings.outputDeviceId) return;
    void engine.setOutputDevice(settings.outputDeviceId).then((supported) => {
      if (!supported) notify('Output selection is not supported by this Windows audio backend.');
    });
  }, [engine, notify, settings.outputDeviceId]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - recordingStartedAt) / 1000;
      setRecordingElapsed(elapsed);
      if (!panicFading && recordingDuration > 0 && elapsed >= recordingDuration) {
        void stopRecordingRef.current();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [panicFading, recording, recordingDuration, recordingStartedAt]);

  useEffect(() => {
    if (!window.driftDesktop) return;
    return window.driftDesktop.onTrayAction((action) => {
      switch (action) {
        case 'toggle-mute':
          setMuted((current) => {
            engineRef.current?.setMuted(!current);
            return !current;
          });
          break;
        case 'toggle-freeze':
          setFrozen((current) => !current);
          break;
        case 'mutate':
          mutate();
          break;
        case 'previous-preset':
          stepPreset(-1);
          break;
        case 'next-preset':
          stepPreset(1);
          break;
      }
    });
  });

  useEffect(
    () => () => {
      if (panicTimerRef.current !== null) window.clearTimeout(panicTimerRef.current);
      for (const clip of customSpeechClipsRef.current) URL.revokeObjectURL(clip.url);
      void engineRef.current?.close();
      if (window.driftDesktop) void window.driftDesktop.setPowerSave(false);
    },
    [],
  );

  const stopJourneyForEdit = () => {
    if (!journeyRunningRef.current) return;
    journeyRunningRef.current = false;
    setJourneyRunning(false);
  };

  const updatePreset = (updater: (current: DriftPreset) => DriftPreset) => {
    stopJourneyForEdit();
    setPreset((current) => ({ ...updater(current), updatedAt: new Date().toISOString() }));
  };

  const loadImportedSound = async (
    activeEngine: DriftEngine,
    sound: ImportedSoundState,
  ): Promise<boolean> => {
    if (!window.driftDesktop) return false;
    setImportedStatuses((current) => ({ ...current, [sound.id]: 'loading' }));
    const bytes = await window.driftDesktop.loadAudio(sound.fileName);
    const ready = Boolean(bytes && (await activeEngine.registerImportedSound(sound.id, bytes)));
    setImportedStatuses((current) => ({
      ...current,
      [sound.id]: ready ? 'ready' : 'error',
    }));
    return ready;
  };

  const loadImportedLibrary = async (activeEngine: DriftEngine, sounds: ImportedSoundState[]) => {
    activeEngine.setImportedSounds(sounds);
    for (const sound of sounds) await loadImportedSound(activeEngine, sound);
    activeEngine.setImportedSounds(importedSoundsRef.current);
  };

  const reloadCustomSpeech = async (activeEngine = engineRef.current) => {
    if (!window.driftDesktop) return;
    setCustomSpeechStatus((current) => ({ ...current, state: 'rendering' }));
    try {
      const result = await window.driftDesktop.reloadPhraseScript();
      const nextClips = result.clips.map((clip): CustomSpeechClip => ({
        kind: clip.kind,
        lowVoice: clip.lowVoice,
        url: URL.createObjectURL(new Blob([clip.bytes as BlobPart], { type: 'audio/wav' })),
      }));
      const previousClips = customSpeechClipsRef.current;
      customSpeechClipsRef.current = nextClips;
      activeEngine?.setCustomSpeechClips(nextClips);
      for (const clip of previousClips) URL.revokeObjectURL(clip.url);
      setCustomSpeechStatus({
        state: result.failed > 0 && nextClips.length === 0 ? 'error' : 'ready',
        count: nextClips.length,
        failed: result.failed,
        path: result.path,
      });
      if (result.failed > 0) {
        notify(
          `${nextClips.length} custom phrase${nextClips.length === 1 ? '' : 's'} ready; ${result.failed} could not be rendered.`,
        );
      } else {
        notify(`${nextClips.length} custom phrase${nextClips.length === 1 ? '' : 's'} ready.`);
      }
    } catch (error) {
      setCustomSpeechStatus((current) => ({ ...current, state: 'error' }));
      notify(`Custom phrases could not be loaded: ${String(error)}`);
    }
  };

  const openPhraseScript = async () => {
    if (!window.driftDesktop) return;
    const result = await window.driftDesktop.openPhraseScript();
    setCustomSpeechStatus((current) => ({ ...current, path: result.path }));
    if (result.error) notify(`The phrase file could not be opened: ${result.error}`);
  };

  const startAudio = async () => {
    if (engineRef.current) return;
    setAudioStatus('starting');
    setAudioError('');
    try {
      const next = new DriftEngine(settings.sampleRate, settings.latencyHint);
      await next.start();
      next.setAtmosphereFrozen(frozenRef.current);
      next.applyPreset(presetRef.current);
      next.setImportedSounds(importedSoundsRef.current);
      next.setCustomSpeechClips(customSpeechClipsRef.current);
      const startMuted = settings.startMuted;
      next.setMuted(startMuted);
      setMuted(startMuted);
      engineRef.current = next;
      setEngine(next);
      setAudioStatus('running');
      void loadImportedLibrary(next, importedSoundsRef.current);
      void reloadCustomSpeech(next);
      if (window.driftDesktop) void window.driftDesktop.setPowerSave(true);
      try {
        setDevices(await navigator.mediaDevices.enumerateDevices());
      } catch {
        setDevices([]);
      }
      notify(startMuted ? 'Audio engine engaged — output remains muted.' : 'Audio engine engaged.');
    } catch (error) {
      setAudioStatus('error');
      setAudioError(error instanceof Error ? error.message : String(error));
    }
  };

  const toggleMute = async () => {
    if (!engine) {
      await startAudio();
      return;
    }
    if (panicTimerRef.current !== null) {
      window.clearTimeout(panicTimerRef.current);
      panicTimerRef.current = null;
      setPanicFading(false);
    }
    const next = !muted;
    engine.setMuted(next);
    setMuted(next);
  };

  const handlePanic = () => {
    const activeEngine = engineRef.current;
    if (!activeEngine) return;

    if (panicTimerRef.current !== null) {
      const wasRecording = recordingRef.current;
      window.clearTimeout(panicTimerRef.current);
      panicTimerRef.current = null;
      activeEngine.panic();
      setMuted(true);
      setPanicFading(false);
      if (wasRecording) void stopRecordingRef.current();
      notify(wasRecording ? 'Immediate cut — WAV capture finished.' : 'Immediate output cut.');
      return;
    }

    const takeStartedAt = recordingStartedAtRef.current;
    activeEngine.panic(PANIC_FADE_SECONDS);
    setMuted(true);
    setPanicFading(true);
    notify(
      recordingRef.current
        ? `Fading master for ${PANIC_FADE_SECONDS} seconds, then saving the WAV.`
        : `Fading master to silence over ${PANIC_FADE_SECONDS} seconds.`,
    );

    panicTimerRef.current = window.setTimeout(
      () => {
        panicTimerRef.current = null;
        setPanicFading(false);
        if (recordingRef.current && recordingStartedAtRef.current === takeStartedAt) {
          void stopRecordingRef.current();
        }
      },
      PANIC_FADE_SECONDS * 1000 + 80,
    );
  };

  const triggerAtmosphereEvent = async (kind: AtmosphereEventKind) => {
    if (!engineRef.current) await startAudio();
    engineRef.current?.triggerAtmosphere(kind);
  };

  const importCustomSounds = async () => {
    if (!window.driftDesktop) {
      notify('Custom sound import is available in the desktop build.');
      return;
    }
    if (importedSoundsRef.current.length >= 16) {
      notify('The custom library can hold up to sixteen sounds.');
      return;
    }
    const records = await window.driftDesktop.importAudio();
    if (!records.length) return;
    const remaining = 16 - importedSoundsRef.current.length;
    const acceptedRecords = records.slice(0, remaining);
    for (const extra of records.slice(remaining)) {
      void window.driftDesktop.removeAudio(extra.fileName);
    }
    const additions = acceptedRecords.map((record): ImportedSoundState => ({
      ...record,
      enabled: true,
      mode: 'event',
      level: 0.65,
      rate: 1,
      automatic: true,
      weight: 0.5,
    }));
    const nextSounds = [...importedSoundsRef.current, ...additions];
    importedSoundsRef.current = nextSounds;
    setImportedSounds(nextSounds);
    setImportedStatuses((current) => ({
      ...current,
      ...Object.fromEntries(additions.map((sound) => [sound.id, 'stored'])),
    }));
    if (engineRef.current) {
      for (const sound of additions) await loadImportedSound(engineRef.current, sound);
      engineRef.current.setImportedSounds(nextSounds);
    }
    notify(`${additions.length} custom sound${additions.length === 1 ? '' : 's'} imported.`);
  };

  const triggerCustomSound = async (id: string) => {
    const sound = importedSoundsRef.current.find((candidate) => candidate.id === id);
    if (!sound) return;
    let activeEngine = engineRef.current;
    if (!activeEngine) {
      await startAudio();
      activeEngine = engineRef.current;
    }
    if (!activeEngine) return;
    if (importedStatuses[id] !== 'ready') {
      const ready = await loadImportedSound(activeEngine, sound);
      if (!ready) {
        notify(`${sound.name} could not be decoded.`);
        return;
      }
    }
    activeEngine.setImportedSounds(importedSoundsRef.current);
    if (activeEngine.triggerImportedSound(id)) notify(`Triggered ${sound.name}.`);
  };

  const triggerChord = async (index: number) => {
    let activeEngine = engineRef.current;
    if (!activeEngine) {
      await startAudio();
      activeEngine = engineRef.current;
    }
    if (!activeEngine) return;
    activeEngine.applyPreset(presetRef.current, liveFrameRef.current ?? undefined);
    activeEngine.triggerChordStep(index);
  };

  const toggleChordRunning = async () => {
    if (!presetRef.current.chord.running && !engineRef.current) await startAudio();
    setPreset((current) => {
      const next = {
        ...current,
        chord: {
          ...current.chord,
          enabled: true,
          running: !current.chord.running,
        },
        updatedAt: new Date().toISOString(),
      };
      presetRef.current = next;
      return next;
    });
  };

  const triggerAmbientLayer = async () => {
    let activeEngine = engineRef.current;
    if (!activeEngine) {
      await startAudio();
      activeEngine = engineRef.current;
    }
    if (!activeEngine) return;
    activeEngine.applyPreset(presetRef.current, liveFrameRef.current ?? undefined);
    activeEngine.triggerAmbientLayer();
  };

  const triggerSaxPhrase = async () => {
    let activeEngine = engineRef.current;
    if (!activeEngine) {
      await startAudio();
      activeEngine = engineRef.current;
    }
    if (!activeEngine) return;
    activeEngine.applyPreset(presetRef.current, liveFrameRef.current ?? undefined);
    activeEngine.triggerSaxPhrase();
  };

  const removeCustomSound = async (sound: ImportedSoundState) => {
    if (
      !window.confirm(
        `Remove "${sound.name}" from DRIFT's library? The original source file will not be deleted.`,
      )
    ) {
      return;
    }
    engineRef.current?.removeImportedSound(sound.id);
    const nextSounds = importedSoundsRef.current.filter((candidate) => candidate.id !== sound.id);
    importedSoundsRef.current = nextSounds;
    setImportedSounds(nextSounds);
    setImportedStatuses((current) => {
      const next = { ...current };
      delete next[sound.id];
      return next;
    });
    if (window.driftDesktop) await window.driftDesktop.removeAudio(sound.fileName);
    notify(`${sound.name} removed from DRIFT. Original file preserved.`);
  };

  const loadPreset = (nextPreset: DriftPreset) => {
    stopJourneyForEdit();
    const next = normalisePreset(nextPreset);
    setPreset(next);
    setSavedSnapshot(clone(next));
    evolutionRef.current.reseed(next.seed);
    mutationCount.current = 0;
    setPresetMenuOpen(false);
    notify(`Loaded ${next.name}`);
  };

  const toggleJourney = async () => {
    if (journeyRunningRef.current) {
      journeyRunningRef.current = false;
      setJourneyRunning(false);
      notify('Journey stopped at the current position.');
      return;
    }
    const route = journey.sceneIds
      .map((id) => allPresets.find((candidate) => candidate.id === id))
      .filter((candidate): candidate is DriftPreset => Boolean(candidate));
    if (route.length < 2) {
      notify('Choose at least two Journey scenes first.');
      return;
    }

    const chordRunning = presetRef.current.chord.running;
    const first = normalisePreset(route[0]!);
    first.chord.running = chordRunning;
    presetRef.current = first;
    setPreset(first);
    evolutionRef.current.reseed(first.seed);
    journeySegmentRef.current = 0;
    journeyLegStartedAtRef.current = performance.now();
    journeyLastTickRef.current = journeyLegStartedAtRef.current;
    setJourneySegment(0);
    setJourneyProgress(0);
    journeyRunningRef.current = true;
    setJourneyRunning(true);
    if (!engineRef.current) await startAudio();
    notify(`Journey begun: ${route.map((scene) => scene.name).join(' → ')}`);
  };

  const skipJourneyScene = () => {
    if (!journeyRunningRef.current) return;
    journeyLegStartedAtRef.current = performance.now() - journey.travelSeconds * 1000;
  };

  const stepPreset = (direction: number) => {
    const collection = allPresets;
    const index = Math.max(
      0,
      collection.findIndex((item) => item.id === presetRef.current.id),
    );
    const nextIndex = (index + direction + collection.length) % collection.length;
    loadPreset(collection[nextIndex]!);
  };

  const mutate = () => {
    mutationCount.current += 1;
    const current = presetRef.current;
    const random = new SeededRandom(`${current.seed}:mutation:${mutationCount.current}`);
    const amount = 0.08 + current.macros.mutation * 0.24;
    updatePreset((source) => ({
      ...source,
      voices: source.voices.map((voice) =>
        voice.locked
          ? voice
          : {
              ...voice,
              fine: clamp(voice.fine + random.signed() * amount * 60, -100, 100),
              detune: clamp(voice.detune + random.signed() * amount * 18, 0, 50),
              cutoff: clamp(voice.cutoff * Math.pow(2, random.signed() * amount * 1.7), 24, 16000),
              pan: clamp(voice.pan + random.signed() * amount * 0.8, -1, 1),
              fifth: clamp(voice.fifth + random.signed() * amount * 0.35, 0, 1),
              volume: clamp(voice.volume + random.signed() * amount * 0.18, 0.02, 0.8),
            },
      ),
      effects: {
        ...source.effects,
        delayTime: clamp(
          source.effects.delayTime * Math.pow(2, random.signed() * amount),
          0.03,
          7.5,
        ),
        wobble: clamp(source.effects.wobble + random.signed() * amount * 0.3, 0, 1),
        phaser: clamp(source.effects.phaser + random.signed() * amount * 0.25, 0, 1),
      },
    }));
    evolutionRef.current.mutate(0.35 + current.macros.mutation * 0.4);
    notify('Related mutation introduced.');
  };

  const newSeed = () => {
    const seed = createSeed();
    updatePreset((current) => ({ ...current, seed }));
    evolutionRef.current.reseed(seed);
    mutationCount.current = 0;
    notify('A new generative path is ready.');
  };

  const copySeed = async () => {
    await navigator.clipboard.writeText(preset.seed);
    notify('Seed copied to clipboard.');
  };

  const savePreset = () => {
    const now = new Date().toISOString();
    if (preset.factory) {
      const copyPreset: DriftPreset = {
        ...clone(preset),
        id: `user-${Date.now().toString(36)}`,
        name: `${preset.name} Variation`,
        factory: false,
        createdAt: now,
        updatedAt: now,
      };
      setPreset(copyPreset);
      setSavedSnapshot(clone(copyPreset));
      setUserPresets((current) => [...current, copyPreset]);
      notify(`Saved as ${copyPreset.name}`);
    } else {
      const saved = { ...clone(preset), updatedAt: now };
      setPreset(saved);
      setSavedSnapshot(clone(saved));
      setUserPresets((current) => [...current.filter((item) => item.id !== saved.id), saved]);
      notify(`${saved.name} saved.`);
    }
  };

  const duplicatePreset = () => {
    const now = new Date().toISOString();
    const duplicate: DriftPreset = {
      ...clone(preset),
      id: `user-${Date.now().toString(36)}`,
      name: `${preset.name} Copy`,
      factory: false,
      createdAt: now,
      updatedAt: now,
    };
    setUserPresets((current) => [...current, duplicate]);
    loadPreset(duplicate);
  };

  const renamePreset = () => {
    if (preset.factory) return notify('Duplicate a factory preset before renaming it.');
    const name = window.prompt('Preset name', preset.name)?.trim();
    if (!name) return;
    updatePreset((current) => ({ ...current, name: name.slice(0, 48) }));
    setUserPresets((current) =>
      current.map((item) => (item.id === preset.id ? { ...item, name: name.slice(0, 48) } : item)),
    );
  };

  const deletePreset = () => {
    if (preset.factory) return notify('Factory presets cannot be deleted.');
    if (!window.confirm(`Delete "${preset.name}"? This cannot be undone.`)) return;
    setUserPresets((current) => current.filter((item) => item.id !== preset.id));
    loadPreset(factoryPresets[0]!);
  };

  const toggleFavourite = () => {
    setFavourites((current) =>
      current.includes(preset.id)
        ? current.filter((id) => id !== preset.id)
        : [...current, preset.id],
    );
  };

  const exportPreset = async () => {
    const envelope = JSON.parse(serializePreset(preset)) as unknown;
    if (window.driftDesktop) {
      const success = await window.driftDesktop.exportPreset(envelope, preset.name);
      if (success) notify('Preset exported.');
    } else {
      const bytes = new TextEncoder().encode(serializePreset(preset));
      downloadBytes(bytes, `${preset.name}.drift.json`);
    }
  };

  const importPreset = async () => {
    let imported: unknown = null;
    if (window.driftDesktop) imported = await window.driftDesktop.importPreset();
    else {
      notify('Preset import is available in the desktop build.');
      return;
    }
    let decoded: DriftPreset;
    try {
      decoded = deserializePreset(imported);
    } catch {
      if (imported) notify('That file is not a valid four-voice DRIFT preset.');
      return;
    }
    const now = new Date().toISOString();
    const next: DriftPreset = {
      ...normalisePreset(decoded),
      id: `user-${Date.now().toString(36)}`,
      factory: false,
      createdAt: now,
      updatedAt: now,
    };
    setUserPresets((current) => [...current, next]);
    loadPreset(next);
  };

  const saveRecordingBytes = useCallback(
    async (bytes: Uint8Array, filename: string) => {
      if (window.driftDesktop) {
        const path = await window.driftDesktop.saveRecording(
          bytes,
          filename.replace(/\.wav$/i, ''),
          settings.recordingLocation || undefined,
        );
        if (path) {
          setPendingRecording(null);
          notify('WAV recording saved.');
        } else {
          setPendingRecording({ bytes, filename });
          notify('Recording retained — choose SAVE RECORDING when ready.');
        }
      } else {
        downloadBytes(bytes, filename);
        setPendingRecording(null);
      }
    },
    [notify, settings.recordingLocation],
  );

  const stopRecording = useCallback(async () => {
    const activeEngine = engineRef.current;
    if (!activeEngine) return;
    const result = activeEngine.stopRecording();
    if (!result) return;
    recordingRef.current = false;
    setRecording(false);
    const bytes = encodeWav(result.chunks, result.sampleRate, 2);
    const filename = `${presetRef.current.name}-${dateStamp(new Date(result.startedAt))}.wav`;
    setPendingRecording({ bytes, filename });
    await saveRecordingBytes(bytes, filename);
  }, [saveRecordingBytes]);
  stopRecordingRef.current = stopRecording;

  const startRecording = async () => {
    let activeEngine = engine;
    if (!activeEngine) {
      await startAudio();
      activeEngine = engineRef.current;
    }
    if (!activeEngine || recording) return;
    const startedAt = activeEngine.startRecording();
    recordingStartedAtRef.current = startedAt;
    recordingRef.current = true;
    setRecordingStartedAt(startedAt);
    setRecordingElapsed(0);
    setRecording(true);
    notify('Master WAV capture started.');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':');
  };

  const patchMacro = <K extends keyof MacroState>(key: K, value: MacroState[K]) =>
    updatePreset((current) => ({ ...current, macros: { ...current.macros, [key]: value } }));

  const updateVoice = (index: number, voice: VoiceState) =>
    updatePreset((current) => ({
      ...current,
      voices: current.voices.map((item, itemIndex) => (itemIndex === index ? voice : item)),
    }));

  const chooseDirectory = async (kind: 'preset' | 'recording') => {
    if (!window.driftDesktop) return;
    const path = await window.driftDesktop.chooseDirectory(kind);
    if (path)
      setSettings((current) => ({
        ...current,
        [kind === 'preset' ? 'presetLocation' : 'recordingLocation']: path,
      }));
  };

  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const favourite = favourites.includes(preset.id);
  const showLiveMotion =
    Boolean(engine && liveFrame) && (preset.macros.autoMorphEnabled || preset.macros.evolution > 0);
  const averageMotion = (key: keyof EvolutionFrame['voice'][number]) =>
    liveFrame
      ? liveFrame.voice.reduce((sum, voice) => sum + voice[key], 0) /
        Math.max(1, liveFrame.voice.length)
      : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <i />
            <i />
            <i />
          </span>
          <div>
            <h1>DRIFT</h1>
            <small>GENERATIVE DRONE SYSTEM / MK I / V{packageInfo.version}</small>
          </div>
        </div>
        <div className="preset-browser">
          <span className="eyebrow">CURRENT PROGRAM</span>
          <button
            className="preset-browser__current"
            onClick={() => setPresetMenuOpen((current) => !current)}
          >
            <span>
              <strong>{preset.name}</strong>
              <small>
                {preset.factory ? 'FACTORY' : 'USER'} / {preset.tuning.mode.toUpperCase()}
              </small>
            </span>
            <i>⌄</i>
          </button>
          {presetMenuOpen && (
            <div className="preset-menu">
              <div className="preset-menu__actions">
                <button onClick={savePreset}>SAVE</button>
                <button onClick={duplicatePreset}>DUPLICATE</button>
                <button onClick={renamePreset}>RENAME</button>
                <button onClick={deletePreset}>DELETE</button>
                <button onClick={() => void importPreset()}>IMPORT</button>
                <button onClick={() => void exportPreset()}>EXPORT</button>
              </div>
              <div className="preset-list">
                {allPresets.map((item) => (
                  <button
                    key={item.id}
                    className={item.id === preset.id ? 'is-active' : ''}
                    onClick={() => loadPreset(item)}
                  >
                    <span>{favourites.includes(item.id) ? '★' : '·'}</span>
                    <strong>{item.name}</strong>
                    <small>{item.factory ? 'F' : 'U'}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          className={`favourite-button ${favourite ? 'is-active' : ''}`}
          onClick={toggleFavourite}
          title="Favourite preset"
        >
          {favourite ? '★' : '☆'}
        </button>
        <button className="top-action" onClick={savePreset}>
          SAVE STATE
        </button>
        <div className="seed-box">
          <span className="eyebrow">SEED</span>
          <div>
            <input
              value={preset.seed}
              onChange={(event) =>
                updatePreset((current) => ({
                  ...current,
                  seed: event.target.value.toUpperCase().slice(0, 40),
                }))
              }
              onBlur={() => evolutionRef.current.reseed(preset.seed)}
            />
            <button onClick={() => void copySeed()}>COPY</button>
          </div>
        </div>
        <div className="system-readout">
          <div>
            <span>CPU</span>
            <strong>{cpu.toFixed(1)}%</strong>
            <i style={{ width: `${cpu}%` }} />
          </div>
          <div>
            <span>AUDIO</span>
            <strong className={audioStatus}>
              {audioStatus === 'running'
                ? `${(engine?.context.sampleRate ?? settings.sampleRate) / 1000}K`
                : audioStatus.toUpperCase()}
            </strong>
          </div>
        </div>
        <div className="top-utilities">
          <button
            className="manual-button"
            onClick={() => setManualOpen(true)}
            aria-label="Open quick manual"
          >
            ?
          </button>
          <button
            className="settings-button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <main>
        <section className="performance-panel">
          <div className="performance-panel__header">
            <span>MACRO CONTROL SURFACE</span>
            <small>Manual changes become the centre point for continued evolution</small>
          </div>
          <div className="macro-bank">
            <Knob
              size="large"
              accent="cyan"
              label="EVOLUTION"
              value={preset.macros.evolution}
              display={percent(preset.macros.evolution)}
              onChange={(value) => patchMacro('evolution', value)}
            />
            <Knob
              size="large"
              label="SPEED"
              value={preset.macros.speed}
              display={percent(preset.macros.speed)}
              onChange={(value) => patchMacro('speed', value)}
            />
            <Knob
              size="large"
              accent="red"
              label="MUTATION"
              value={preset.macros.mutation}
              display={percent(preset.macros.mutation)}
              onChange={(value) => patchMacro('mutation', value)}
            />
            <Knob
              size="large"
              label="DENSITY"
              value={preset.macros.density}
              display={`${Math.max(1, Math.round(preset.macros.density * 4))}/4`}
              onChange={(value) => patchMacro('density', value)}
            />
            <Knob
              size="large"
              accent="red"
              label="TENSION"
              value={preset.macros.tension}
              modulatedValue={
                showLiveMotion
                  ? preset.macros.tension +
                    (averageMotion('detune') + averageMotion('harmonics')) * 0.12
                  : undefined
              }
              display={percent(preset.macros.tension)}
              onChange={(value) => patchMacro('tension', value)}
            />
            <Knob
              size="large"
              label="WARMTH"
              value={preset.macros.warmth}
              modulatedValue={
                showLiveMotion ? preset.macros.warmth - averageMotion('cutoff') * 0.16 : undefined
              }
              display={percent(preset.macros.warmth)}
              onChange={(value) => patchMacro('warmth', value)}
            />
            <Knob
              size="large"
              accent="cyan"
              label="MOTION"
              value={preset.macros.motion}
              modulatedValue={
                showLiveMotion ? preset.macros.motion + averageMotion('pan') * 0.25 : undefined
              }
              display={percent(preset.macros.motion)}
              onChange={(value) => patchMacro('motion', value)}
            />
            <Knob
              size="large"
              label="SPACE"
              value={preset.macros.space}
              modulatedValue={
                showLiveMotion ? preset.macros.space + (liveFrame?.space ?? 0) * 0.2 : undefined
              }
              display={percent(preset.macros.space)}
              onChange={(value) => patchMacro('space', value)}
            />
            <Knob
              size="large"
              accent="red"
              label="DISTORTION"
              value={preset.macros.distortion}
              modulatedValue={
                showLiveMotion
                  ? preset.macros.distortion + averageMotion('harmonics') * 0.12
                  : undefined
              }
              display={percent(preset.macros.distortion)}
              onChange={(value) => patchMacro('distortion', value)}
            />
          </div>
          <div className="field-console">
            <Visualizer
              engine={engine}
              evolution={Math.max(
                preset.macros.evolution,
                preset.macros.autoMorphEnabled ? preset.macros.autoMorphDepth : 0,
              )}
              frozen={frozen}
              quality={settings.visualizerQuality}
            />
            <div className="field-actions">
              <button
                className={`freeze-button ${frozen ? 'is-active' : ''}`}
                onClick={() => setFrozen((current) => !current)}
              >
                <i />
                {frozen ? 'UNFREEZE' : 'FREEZE'}
                <small>{frozen ? 'FIELD HELD' : 'HOLD EVOLUTION'}</small>
              </button>
              <button
                className={`morph-button ${preset.macros.autoMorphEnabled ? 'is-active' : ''}`}
                onClick={() => patchMacro('autoMorphEnabled', !preset.macros.autoMorphEnabled)}
              >
                <i />
                AUTO MORPH
                <small>
                  {preset.macros.autoMorphEnabled
                    ? `ON / DEPTH ${percent(preset.macros.autoMorphDepth)}`
                    : 'OFF / CLICK TO START'}
                </small>
              </button>
              <button onClick={mutate}>
                MUTATE<small>RELATED VARIATION</small>
              </button>
              <button onClick={newSeed}>
                NEW SEED<small>NEW PATH</small>
              </button>
            </div>
          </div>
          <div className="master-section">
            <div className="output-meter">
              <span>MASTER OUTPUT</span>
              <div>
                <i style={{ height: `${clamp(meter.rms * 190, 0, 100)}%` }} />
                <i
                  className={meter.peak > 0.92 ? 'is-hot' : ''}
                  style={{ height: `${clamp(meter.peak * 100, 0, 100)}%` }}
                />
              </div>
              <small>{meter.peak > 0.92 ? 'LIMITING' : 'SAFE'}</small>
            </div>
            <Knob
              size="large"
              label="MASTER"
              value={preset.macros.master}
              min={0}
              max={0.72}
              display={percent(preset.macros.master)}
              onChange={(value) => patchMacro('master', value)}
            />
            <button
              className={`audio-button ${muted ? 'is-muted' : 'is-live'}`}
              onClick={() => void toggleMute()}
            >
              <i />
              {audioStatus === 'idle' ? 'ENGAGE AUDIO' : muted ? 'OUTPUT MUTED' : 'OUTPUT LIVE'}
              <small>
                {audioStatus === 'idle'
                  ? 'START SILENTLY'
                  : muted
                    ? 'CLICK TO UNMUTE'
                    : 'CLICK TO MUTE'}
              </small>
            </button>
            <button
              className={`panic-button ${panicFading ? 'is-fading' : ''}`}
              onClick={handlePanic}
              disabled={!engine}
            >
              {panicFading ? 'FADING…' : 'PANIC'}
              <small>
                {panicFading
                  ? 'PRESS AGAIN TO CUT'
                  : recording
                    ? '4 SEC FADE + SAVE'
                    : '4 SEC FADE OUT'}
              </small>
            </button>
          </div>
        </section>

        <nav className="panel-tabs">
          {panelTabs.map((panel, index) => (
            <button
              key={panel}
              className={activePanel === panel ? 'is-active' : ''}
              onClick={() => setActivePanel(panel)}
            >
              <span>0{index + 1}</span>
              {panel.toUpperCase()}
            </button>
          ))}
        </nav>

        {activePanel === 'voices' && (
          <section className="voice-panel">
            <div className="tuning-bar">
              <span className="section-tag">PITCH RELATIONSHIPS</span>
              <label>
                ROOT
                <select
                  value={preset.tuning.root}
                  onChange={(event) =>
                    updatePreset((current) => ({
                      ...current,
                      tuning: { ...current.tuning, root: Number(event.target.value) },
                    }))
                  }
                >
                  {Array.from({ length: 36 }, (_, index) => index + 24).map((note) => (
                    <option key={note} value={note}>
                      {['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][note % 12]}
                      {Math.floor(note / 12) - 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                MODE
                <select
                  value={preset.tuning.mode}
                  onChange={(event) =>
                    updatePreset((current) => ({
                      ...current,
                      tuning: { ...current.tuning, mode: event.target.value as TuningMode },
                    }))
                  }
                >
                  <option value="free">Free / unquantised</option>
                  <option value="chromatic">Chromatic</option>
                  <option value="fifths">Octaves & fifths</option>
                  <option value="minor">Minor drone</option>
                  <option value="major">Major drone</option>
                  <option value="dorian">Dorian</option>
                  <option value="phrygian">Phrygian</option>
                  <option value="whole-tone">Whole tone</option>
                  <option value="harmonic">Harmonic series</option>
                  <option value="just">Just intonation</option>
                  <option value="inharmonic">Inharmonic</option>
                  <option value="microtonal">Microtonal drift</option>
                </select>
              </label>
              <label>
                TEMPERAMENT
                <select
                  value={preset.tuning.temperament}
                  onChange={(event) =>
                    updatePreset((current) => ({
                      ...current,
                      tuning: {
                        ...current.tuning,
                        temperament: event.target.value as 'equal' | 'just',
                      },
                    }))
                  }
                >
                  <option value="equal">Equal</option>
                  <option value="just">Just ratios</option>
                </select>
              </label>
              <label>
                OCTAVE RANGE
                <select
                  value={preset.tuning.octaveRange}
                  onChange={(event) =>
                    updatePreset((current) => ({
                      ...current,
                      tuning: { ...current.tuning, octaveRange: Number(event.target.value) },
                    }))
                  }
                >
                  <option value={1}>1 octave</option>
                  <option value={2}>2 octaves</option>
                  <option value={3}>3 octaves</option>
                  <option value={4}>4 octaves</option>
                  <option value={5}>5 octaves</option>
                </select>
              </label>
              <label>
                GLIDE
                <input
                  type="range"
                  min={0.05}
                  max={12}
                  step={0.05}
                  value={preset.tuning.glide}
                  onChange={(event) =>
                    updatePreset((current) => ({
                      ...current,
                      tuning: { ...current.tuning, glide: Number(event.target.value) },
                    }))
                  }
                />
                <span>{preset.tuning.glide.toFixed(1)}s</span>
              </label>
              <label className="ratio-field">
                CUSTOM RATIOS
                <input
                  value={preset.tuning.customRatios.join(', ')}
                  onChange={(event) => {
                    const ratios = event.target.value
                      .split(',')
                      .map(Number)
                      .filter((value) => Number.isFinite(value) && value > 0 && value < 16)
                      .slice(0, 12);
                    if (ratios.length)
                      updatePreset((current) => ({
                        ...current,
                        tuning: { ...current.tuning, customRatios: ratios },
                      }));
                  }}
                />
              </label>
            </div>
            {preset.voices.map((voice, index) => (
              <VoiceStrip
                key={index}
                index={index}
                voice={voice}
                motion={showLiveMotion ? liveFrame?.voice[index] : undefined}
                range={preset.macros.range}
                motionAmount={preset.macros.motion}
                onChange={(next) => updateVoice(index, next)}
              />
            ))}
          </section>
        )}
        {activePanel === 'modulation' && (
          <>
            <div className="secondary-macros">
              <Knob
                label="STABILITY"
                value={preset.macros.stability}
                display={percent(preset.macros.stability)}
                onChange={(value) => patchMacro('stability', value)}
              />
              <Knob
                label="RANGE"
                value={preset.macros.range}
                display={percent(preset.macros.range)}
                onChange={(value) => patchMacro('range', value)}
              />
              <Knob
                accent="cyan"
                label="MORPH DEPTH"
                value={preset.macros.autoMorphDepth}
                display={percent(preset.macros.autoMorphDepth)}
                onChange={(value) => patchMacro('autoMorphDepth', value)}
              />
              <div>
                <strong>BEHAVIOUR</strong>
                <p>
                  Auto Morph adds an immediately audible slow movement layer. Stability pulls
                  ordinary routes towards their centre; Range limits their excursion. Freeze pauses
                  both systems, and each voice lock excludes that voice.
                </p>
              </div>
            </div>
            <ModulationPanel
              routes={preset.modulation}
              onChange={(modulation) => updatePreset((current) => ({ ...current, modulation }))}
            />
          </>
        )}
        {activePanel === 'effects' && (
          <EffectsPanel
            effects={preset.effects}
            onChange={(effects) => updatePreset((current) => ({ ...current, effects }))}
          />
        )}
        {activePanel === 'atmosphere' && (
          <AtmospherePanel
            atmosphere={preset.atmosphere}
            onChange={(atmosphere) => updatePreset((current) => ({ ...current, atmosphere }))}
            onTrigger={(kind) => void triggerAtmosphereEvent(kind)}
            getStatus={() => engineRef.current?.getAtmosphereStatus() ?? 'waiting'}
            importedSounds={importedSounds}
            importedStatuses={importedStatuses}
            onImportSounds={() => void importCustomSounds()}
            onImportedChange={(sound) =>
              setImportedSounds((current) =>
                current.map((candidate) => (candidate.id === sound.id ? sound : candidate)),
              )
            }
            onImportedTrigger={(id) => void triggerCustomSound(id)}
            onImportedRemove={(sound) => void removeCustomSound(sound)}
            customSpeechStatus={customSpeechStatus}
            onOpenPhraseScript={() => void openPhraseScript()}
            onReloadPhraseScript={() => void reloadCustomSpeech()}
          />
        )}
        {activePanel === 'journey' && (
          <JourneyPanel
            journey={journey}
            programs={allPresets.map(({ id, name }) => ({ id, name }))}
            running={journeyRunning}
            segment={journeySegment}
            progress={journeyProgress}
            pulse={preset.pulse}
            pulseCount={pulseCount}
            onJourneyChange={(next) => setJourney(normaliseJourney(next))}
            onPulseChange={(pulse) =>
              updatePreset((current) => ({
                ...current,
                pulse,
              }))
            }
            onToggleJourney={() => void toggleJourney()}
            onSkip={skipJourneyScene}
          />
        )}
        {activePanel === 'chords' && (
          <ChordPanel
            chord={preset.chord}
            activeStep={chordStatus.step}
            triggerCount={chordStatus.count}
            sax={preset.sax}
            saxCount={saxCount}
            onChange={(chord) => updatePreset((current) => ({ ...current, chord }))}
            onSaxChange={(sax) => updatePreset((current) => ({ ...current, sax }))}
            onToggleRunning={() => void toggleChordRunning()}
            onTrigger={(index) => void triggerChord(index)}
            onTriggerSax={() => void triggerSaxPhrase()}
          />
        )}
        {activePanel === 'tones' && (
          <TonesPanel
            binaural={preset.binaural}
            ambientLayer={preset.ambientLayer}
            ambientCount={ambientCount}
            onBinauralChange={(binaural) => updatePreset((current) => ({ ...current, binaural }))}
            onAmbientChange={(ambientLayer) =>
              updatePreset((current) => ({ ...current, ambientLayer }))
            }
            onTriggerAmbient={() => void triggerAmbientLayer()}
          />
        )}
        {activePanel === 'recording' && (
          <section className="rack-panel recording-panel">
            <div className="panel-title">
              <span>MASTER RECORDING</span>
              <small>16-bit stereo WAV / evolution continues uninterrupted</small>
            </div>
            <div className="recorder-deck">
              <div className={`reel-display ${recording ? 'is-recording' : ''}`}>
                <div className="reel">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="reel">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <span>
                  {recording
                    ? panicFading
                      ? 'FADING MASTER — ENDING TAKE'
                      : 'CAPTURING MASTER OUTPUT'
                    : pendingRecording
                      ? 'UNSAVED TAKE RETAINED'
                      : 'RECORDER READY'}
                </span>
              </div>
              <div className="record-time">
                <span>ELAPSED</span>
                <strong>{formatTime(recordingElapsed)}</strong>
                <small>
                  {engine
                    ? `${engine.context.sampleRate / 1000} kHz / STEREO`
                    : `${settings.sampleRate / 1000} kHz / STANDBY`}
                </small>
              </div>
              <label>
                DURATION
                <select
                  disabled={recording}
                  value={recordingDuration}
                  onChange={(event) => setRecordingDuration(Number(event.target.value))}
                >
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={1800}>30 minutes</option>
                  <option value={3600}>1 hour</option>
                  <option value={0}>Unlimited / manual stop</option>
                </select>
              </label>
              {!recording ? (
                <button className="record-button" onClick={() => void startRecording()}>
                  <i />
                  START RECORDING
                </button>
              ) : (
                <button className="stop-button" onClick={() => void stopRecording()}>
                  <i />
                  STOP & SAVE WAV
                </button>
              )}
              {pendingRecording && !recording && (
                <button
                  className="retry-save"
                  onClick={() =>
                    void saveRecordingBytes(pendingRecording.bytes, pendingRecording.filename)
                  }
                >
                  SAVE RETAINED TAKE
                </button>
              )}
            </div>
            <div className="record-note">
              <strong>SAFE CAPTURE</strong>
              <p>
                Recording taps the protected master output after compression and limiting. Muting
                the app also mutes the recording; Freeze does not stop it. Panic creates a
                four-second fade, then stops and saves an active take. If you cancel the save
                dialog, the take remains available until a new recording begins or DRIFT closes.
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="statusbar">
        <span>
          <i className={frozen ? 'amber' : 'green'} />
          {frozen ? 'EVOLUTION FROZEN' : 'EVOLUTION ACTIVE'}
        </span>
        <span>
          {preset.macros.autoMorphEnabled
            ? `AUTO MORPH ${percent(preset.macros.autoMorphDepth)}`
            : 'AUTO MORPH OFF'}
        </span>
        <span>{preset.voices.filter((voice) => !voice.muted).length} VOICES ARMED</span>
        <span>
          {preset.chord.running
            ? `CHORD SEQ 0${Math.max(0, chordStatus.step) + 1}`
            : 'CHORD SEQ STANDBY'}
        </span>
        <span>
          {preset.ambientLayer.enabled
            ? `AURORA ${ambientCount}`
            : preset.binaural.enabled
              ? `BINAURAL ${preset.binaural.beat.toFixed(1)} HZ`
              : 'TONES STANDBY'}
        </span>
        <span>
          {journeyRunning
            ? `JOURNEY ${Math.round(journeyProgress * 100)}% / ${preset.pulse.enabled ? `${Math.round(preset.pulse.tempo)} BPM` : 'PULSE OFF'}`
            : preset.pulse.enabled
              ? `PULSE ${Math.round(preset.pulse.tempo)} BPM`
              : 'JOURNEY STANDBY'}
        </span>
        <span>{recording ? `● REC ${formatTime(recordingElapsed)}` : 'RECORDER STANDBY'}</span>
        <span>SAFETY LIMITER ONLINE</span>
        <button
          onClick={() => {
            stopJourneyForEdit();
            const reset = normalisePreset(savedSnapshot);
            presetRef.current = reset;
            setPreset(reset);
          }}
        >
          RESET TO SAVED
        </button>
      </footer>

      {audioStatus === 'error' && (
        <div className="error-banner">
          <strong>AUDIO COULD NOT START</strong>
          <span>{audioError}</span>
          <button onClick={() => setAudioStatus('idle')}>DISMISS</button>
        </div>
      )}
      {notice && <div className="notice">{notice}</div>}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          devices={devices}
          onChange={setSettings}
          onClose={() => setSettingsOpen(false)}
          onChooseDirectory={(kind) => void chooseDirectory(kind)}
        />
      )}
      {manualOpen && <ManualPanel onClose={() => setManualOpen(false)} />}
    </div>
  );
}

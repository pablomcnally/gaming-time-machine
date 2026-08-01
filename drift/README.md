# DRIFT

DRIFT is a standalone, Windows-first generative music workstation. Version 2 combines the original four-voice generative drone instrument with **RHYTHM**, an original eleven-voice analogue percussion synthesizer, a shared transport, instrument buses, sidechain and modulation routing, session persistence, system-tray control, and safety-limited WAV capture.

The application is intentionally offline. It does not need a DAW, plug-in host, account, or network connection.

## Quick start

Requirements:

- Windows 10 or 11 (64-bit)
- Node.js 20 or newer when developing from source
- A working Windows audio output

Install and run the development build:

```powershell
cd C:\path\to\drift
npm install
npm run dev
```

Build and run the production application locally:

```powershell
npm run build
npm start
```

Run the automated checks:

```powershell
npm run typecheck
npm run lint
npm test
```

Create both a Windows installer and portable executable:

```powershell
npm run package
```

Artifacts are written to `release\`. `DRIFT-2.0.0-x64-Setup.exe` is the installer and `DRIFT-2.0.0-x64-Portable.exe` is the no-install build.

The release is not Authenticode-signed because no code-signing certificate is bundled with the project. Windows SmartScreen may therefore ask for confirmation on first launch.

## First sound

DRIFT deliberately opens with no audio engine and, by default, starts muted.

1. Choose a factory preset.
2. Select **ENGAGE AUDIO**. The engine starts silently.
3. Select **OUTPUT MUTED** to fade the protected master output in.
4. Use the large macro controls to steer the field.

**FREEZE** holds the current modulation field without changing the sound. **MUTATE** introduces a related variation. **NEW SEED** starts a new deterministic generative path. The red **PANIC** control immediately drops the final output gain to zero.

Manual parameter changes become the new centre around which modulation continues. Locking a voice removes that entire voice from mutation and generative drift.

**AUTO MORPH** adds a stronger, immediately audible layer of slow filter, resonance, detune, harmonic, amplitude, stereo and space movement. Its Depth control is in the Modulation panel. Freeze pauses both ordinary evolution and Auto Morph.

Live cyan ghost needles show the current evolved value without moving the amber manual setting. Expanded voice controls expose pitch, detune, level, pan, cutoff, resonance and harmonic motion; the main surface mirrors broader tonal and spatial movement. Freeze holds the needles at their exact current positions.

## Presets

Twenty-four factory presets are included, including the cinematic analogue-noir **Neon Rain**, narrative **Off-World Terminal**, deep **Abyssal Beacon**, and luminous vintage analogue-space **Crystal Atmosphere** programs. Saving a modified factory preset creates a user variation; saving a user preset updates it. User presets, favourites, settings, and the latest session persist in Electron's application-data folder.

Preset files contain the seed, all four voices, tuning, modulation routes, macro values, Atmosphere state, and the complete effects state. Imported files are validated before they are accepted.

## Atmosphere

The Atmosphere panel turns DRIFT from a continuous drone into an inhabited environment. Its two-bus mixer independently balances the synthesizer **Drone** and the complete **Atmosphere** layer before both enter the shared effects and protected master output.

- **Rainfall** is a continuous, filtered weather bed with slow natural movement.
- **Distant Thunder** produces low weather mass with a long sub-frequency decay.
- **Sonar / Beacon** creates positioned pings and decaying field repetitions.
- **Radio Chatter** selects from eight original radio exchanges through broken-band processing.
- **Announcements** selects from sixteen original civic messages through damaged-loudspeaker filtering.

The speech pool includes natural female performances, a genuine Microsoft George male voice, deeper transformed characters, and six occasional French-text transit/radio fragments. All text and rendered assets are original to DRIFT.

**Activity** sets the automatic event interval, from rare events several minutes apart to a busy soundscape. Each event's Level also acts as its probability weight. **Echo**, **Distance**, and **Randomness** determine placement and pacing. **Speech Rate** ranges from 0.35× to 2.2×; **Glitch** introduces live rate jumps and, at high settings, short rewinds. Trigger Now auditions any enabled event immediately.

Freeze prevents new automatic events while preserving rainfall and echoes already in flight. Manual triggers remain available. Every layer enters the main effects, compression, limiter, mute and recorder chain.

## Recording

The recorder taps the stereo signal after master compression, limiting, and mute. It captures 16-bit PCM and exports a standard WAV without resetting the generative sequence. A cancelled save dialog retains the completed take in memory and exposes **SAVE RETAINED TAKE**.

WAV files are saved wherever you choose in the native Save dialog. It opens in **Settings → Recording Location** when configured, or the Windows Music folder when unset.

For long captures, memory use grows with duration because PCM is accumulated before the final WAV is written. At 48 kHz stereo, allow roughly 330 MB per hour. This design keeps recording independent of platform codecs and guarantees a real WAV file.

## Architecture

```text
React control surface
  ├─ preset/settings state ── Electron IPC ── atomic JSON storage
  ├─ deterministic EvolutionEngine (seeded, bounded, smoothed)
  └─ DriftEngine
      ├─ 4 voice graphs (source/unison → filter → pan → gain)
      ├─ Atmosphere engine (rain + seeded occasional field events)
      ├─ parallel ensemble/phaser/flanger/delay/reverb sends
      ├─ master tone and saturation
      ├─ gentle compressor → brick-style safety limiter → mute
      ├─ analyser → calm visual field
      └─ PCM recorder → WAV encoder → native save dialog

Electron main process
  ├─ isolated preload API
  ├─ background throttling disabled
  ├─ app-suspension blocker while audio is active
  ├─ atomic state/preset/recording writes
  └─ system tray commands
```

The audio engine, deterministic modulation engine, interface, persistence bridge, and Electron host are separate modules. Audio parameters use exponential smoothing and explicit clamps. Delay feedback is capped, source and voice gains are conservative, and the final output always passes through a limiter.

## Audio and framework decisions

- Chromium's Web Audio API provides stable standalone audio in Electron and avoids native build-tool friction.
- Windows output-device selection uses `AudioContext.setSinkId` where the bundled Chromium and driver support it. The system default remains the reliable fallback.
- Sample rate and latency hints are selected when the `AudioContext` is created, so changes apply after restarting the application.
- Bit reduction uses a bounded quantising transfer curve, avoiding a costly render-thread callback while still providing deliberate low-bit colour.
- Stereo width scales the four independent voice positions and their slowly modulated spatial movement.

## Background behaviour

Electron renderer throttling is disabled for the DRIFT window. While the audio engine is active, the main process uses an app-suspension blocker. Closing the window with **Minimise to system tray** enabled hides it rather than ending the process.

DRIFT uses software compositing by default to avoid black-window failures caused by damaged Chromium GPU caches or incompatible Windows graphics drivers. This does not alter Web Audio processing.

Tray actions include mute, freeze, previous/next preset, mutate, restore, and quit.

## Version 2 workstation architecture

```text
Persistent React shell
  +-- DRIFT page state + deterministic EvolutionEngine
  +-- RHYTHM pattern/kit/generator state (never the timing clock)
  +-- MIXER page state
  +-- version-2 migration/persistence -- Electron IPC -- atomic JSON
  `-- one shared AudioContext, created after user engagement
      +-- DRIFT sources -> Drone bus (EQ / gain / meter)
      +-- RhythmEngine: 11 synthesised voices -> drum effects -> Drum bus
      +-- Transport: 24 PPQN, audio-time lookahead, phase-preserving BPM changes
      +-- optional clamped sidechain and cross-instrument routes
      `-- shared effects -> compressor -> limiter -> master/mute -> output + recorder
```

Instrument pages only change visibility. Neither engine is mounted inside a page component, so page changes cannot reset audio, transport, generated state or recording. The visual playhead follows events already scheduled against `AudioContext.currentTime`; React and animation frames never trigger drum hits.

## RHYTHM

RHYTHM synthesises bass drum, snare, three toms, rimshot, clap, closed/open hats, crash and ride. It uses no commercial samples. Every voice has an individual bus with appropriate synthesis controls, level, pan, tone, drive, mute, solo and metering. Hi-hats use a bounded choke group and active drum hits are capped to prevent indefinite cymbal accumulation.

Patterns contain eleven independent 64-step tracks. Each track has its own active region, length, rotation and division (`1/4`, `1/8`, `1/16`, `1/32`, eighth-note triplet or sixteenth-note triplet). Steps store on/off, accent, velocity, probability, microtiming, ratchets, flam, protection and bounded parameter locks. Each bank has sixteen slots. Pattern switching can be immediate, on a beat, on a bar or at pattern end; pattern end is the default. The editable chain accepts comma-separated slot numbers.

Generation uses seeded musical-role rules instead of uniform random hits. Twelve profiles steer pulse, backbeat, subdivision, syncopation, fills and cymbals. Generate is reproducible from the displayed seed. Mutation observes track and step protection. Continuous evolution commits only at a chosen bar boundary and keeps a bounded revert history.

Twelve original kits and twenty-four fixed factory patterns are included. Ten named combined-session definitions document the intended DRIFT/RHYTHM pairings.

## Shared transport and interaction

The shared transport runs at 24 pulses per quarter note. A 25 ms control timer fills a 120 ms audio-time lookahead window; Web Audio start times are authoritative. BPM changes alter future pulse spacing without recreating the context or restarting long DRIFT modulation cycles. Swing delays alternate sixteenth positions while preserving the straight-grid phase.

DRIFT can be free-running, follow transport start/stop, or use tempo-sync mode. Tempo-sync currently supplies shared tempo/start state while intentionally preserving legacy long-modulator phase. RHYTHM provides optional sidechain ducking from a selected voice or the drum bus, with gentle and pump modes. A small interaction router maps kick, snare, hats or drum bus activity to bounded drone brightness or level motion. All interactions default to off.

## Data formats and migration

Saved files are UTF-8 JSON envelopes:

- `drift-preset`, version 1: unchanged legacy DRIFT presets.
- `drift-kit`, version 1: drum synthesis parameters and effects.
- `drift-pattern`, version 1: pattern metadata, tracks, steps and locks.
- `drift-rhythm-preset`, version 1: the complete RHYTHM state and banks.
- `drift-session`, version 2: current DRIFT state, RHYTHM, transport, mixer, routing, seeds and visible page.

Automatic application state is version 2. `migratePersistedState` accepts version-1 state, retains the existing drone preset, settings and imported library, and adds safe RHYTHM/transport defaults. The legacy preset serializer was not modified, so existing DRIFT preset files remain usable.

## Recording sources

The WAV recorder can tap the complete protected master, the DRIFT instrument bus or the RHYTHM instrument bus. Capture can begin immediately, on the next beat or on the next bar. Existing duration/manual stop behavior remains. Individual-voice offline stem rendering is an extension point and is not performed in real time in version 2.0.

## State boundaries

- Audio nodes live in `DriftEngine` and `RhythmEngine` and receive clamped, smoothed changes.
- Timing lives in `Transport`, based on audio-context time.
- Pattern, kit, generator and session models are serializable data outside the component tree.
- Meters and the playhead are sampled into React at UI rates and never control audio.
- Page and editor selection state can rerender or hide without owning an `AudioNode`.

## MIDI and external clock

The transport and drum-trigger APIs are ready for Web MIDI mapping, but MIDI input/output is not enabled in version 2.0. This keeps the core instrument independent of device permission and driver behavior. A future MIDI service should translate clock into transport pulses and notes into `RhythmEngine.trigger` without constructing another audio context.

## Adding another instrument

Create an engine that accepts the existing `AudioContext` and an instrument-bus `AudioNode`; never construct an audio context inside the instrument. Keep its serializable model outside React, subscribe scheduling to `Transport`, expose meters at a low UI rate, keep its page mounted with visibility changes, and route its bus into the protected shared master.

## Project map

- `src/audio/RhythmEngine.ts` — eleven drum synthesis models, voice/bus effects and scheduling
- `src/audio/Transport.ts` — shared audio-time transport and timing calculations
- `src/rhythm/` — pattern/kit/session models, factory content, generation and migration
- `src/components/RhythmPage.tsx` — RHYTHM control surface and pattern editor

- `electron/main.ts` — desktop lifecycle, tray, persistence, native dialogs
- `electron/preload.ts` — restricted renderer IPC surface
- `src/audio/DriftEngine.ts` — synthesis, Atmosphere events, effects, master safety, recording
- `src/audio/evolution.ts` — deterministic generative modulation
- `src/presets/factory.ts` — twenty-four factory sound programs
- `USER_MANUAL.md` — concise operating guide and sound recipes
- `src/components/` — instrument control panels
- `src/App.tsx` — application state and orchestration

## Reliability notes

The test suite checks seed repeatability, long-run modulation bounds, freeze behaviour, Atmosphere bounds, all factory preset round trips, distinct factory sound states, corrupt preset rejection, and the PCM WAV header. A production build performs strict TypeScript checking before bundling.

DRIFT avoids feedback values above 0.78, clamps all engine input, smooths ordinary control changes, creates a fresh state atomically, and starts at conservative gain. It can run indefinitely; the only duration-dependent allocation is an active recording.

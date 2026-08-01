# DRIFT

DRIFT is a standalone, Windows-first generative ambient synthesizer. It combines four continuously running synthesis voices with deterministic slow modulation, a procedural Atmosphere engine, a spatial effects rack, safety-limited master output, persistent presets, system-tray control, and stereo WAV capture.

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

Artifacts are written to `release\`. `DRIFT-1.1.4-x64-Setup.exe` is the installer and `DRIFT-1.1.4-x64-Portable.exe` is the no-install build.

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

## Project map

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

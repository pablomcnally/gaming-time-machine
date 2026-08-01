# DRIFT — Quick Instruction Manual

DRIFT is a four-voice generative drone synthesizer designed to be started, gently steered, and left running. Manual adjustments become the centre around which the sound continues evolving.

## Starting the sound

1. Choose a sound from **Current Program**.
2. Press **Engage Audio**. The engine starts safely muted.
3. Press **Output Muted** to fade the drone in.

Use **Master** for the final listening level. **Panic** fades the complete output to silence over four seconds. If a recording is running, DRIFT captures the fade, then automatically stops and opens the WAV Save dialog. Press **Panic** again while **Fading** is shown for an immediate emergency cut.

## Main controls

- **Evolution** — how actively the sound changes.
- **Speed** — how quickly those changes unfold.
- **Mutation** — the likelihood and strength of noticeable variations.
- **Density** — how many voices remain present.
- **Tension** — dissonance, beating and unstable intervals.
- **Warmth** — softer sources and darker filtering.
- **Motion** — stereo movement.
- **Space** — reverb size and depth.
- **Distortion** — saturation and harmonic roughness.

Manual changes steer the system. They do not fight it: your new setting becomes the centre of continued modulation.

## Atmosphere and field events

Open **Atmosphere** to add an environmental layer around the four-voice drone.

Use the **Bus Mixer** to balance the two main layers. Lower **Drone** when environmental detail is being masked; raise **Atmosphere** when you want the world to sit in front of the synthesizer. Both buses still pass through the same effects, safety processing and Master control.

- **Rainfall** is continuous filtered weather noise.
- **Distant Thunder** adds low rumbles with long decays.
- **Sonar / Beacon** adds spatial pings and echoing repetitions.
- **Radio Chatter** selects from eight original radio exchanges with alternating natural, deep and male voices.
- **Announcements** selects from sixteen original civic messages treated as damaged, distant loudspeakers.

Six speech fragments use original French transit and radio text. They are deliberately occasional, making up roughly one quarter of the relevant speech pools.

The four event levels do two jobs: they set loudness and weight the chance of that event being selected. **Activity** controls the interval between automatic events. Low settings can leave several minutes of space; high settings produce a busier environment. **Echo**, **Distance** and **Randomness** control placement and pacing.

**Speech Rate** affects chatter and announcements from 0.35× to 2.2×. **Glitch** adds live speed jumps; above roughly 50% it can also rewind a short fragment to create stutters. Low-register performances are rendered locally from a separate pitch-shifted voice character.

Use **Trigger Now** to audition an event immediately. Turning **Field Offline** fades the complete Atmosphere layer out. Freeze prevents new automatic events but leaves rainfall, echoes already in flight and manual triggers active.

All Atmosphere audio passes through DRIFT's effects, master colour, compression, safety limiter, mute and WAV recorder.

## Custom phrase script

The supplied announcements and chatter are bundled WAV recordings. They are not regenerated on every playback; DRIFT selects a recording and applies live speed, filtering, distance, distortion and glitch treatment.

**Custom Phrase Script** adds editable speech without requiring an online service:

1. Open **Atmosphere** and press **Open Phrase File**.
2. Add one spoken phrase per line in `custom-phrases.txt`.
3. Save the text file.
4. Return to DRIFT and press **Reload Phrases**.
5. Wait for the status to show the number of phrases ready.

DRIFT uses an installed Windows SAPI voice to render each changed line locally, then caches it as WAV audio. Unchanged lines reuse their cached audio, so subsequent reloads are quick. Up to 32 non-comment lines are read, with a maximum of 240 characters per phrase. Lines beginning with `#` are comments.

Optional tags can be placed at the start of a line:

- `[chatter] Confirm your position at the eastern marker.` — joins the Radio Chatter pool.
- `[announcement] Platform access is currently restricted.` — explicitly joins Announcements; this is the default.
- `[low] All transit is suspended until further notice.` — receives the lower, slower voice treatment.
- `[voice=Hazel] Visibility is falling across the lower levels.` — prefers an installed Windows voice containing that name.

Tags can be combined, for example `[chatter][low] Signal acquired. Hold present range.` If the requested voice is not installed, Windows uses its default voice. The exact available voices depend on the Windows speech packs installed on the computer.

Once cached, custom lines behave like the bundled speech samples: Speech Rate, Glitch, Distance, Echo, the Atmosphere bus, shared effects, limiter and WAV recorder all apply. Removing a line from the text file removes it from the active pool on the next reload; its harmless cached WAV may remain available for fast reuse.

## Importing your own sounds

The **Imported Sound Library** sits below the four built-in event modules in Atmosphere.

1. Press **Import Sounds**.
2. Choose one or several WAV, MP3, OGG, M4A, AAC or FLAC files.
3. Wait for the status beside each name to change from Loading to Ready.
4. Choose **Event** or **Loop Bed** for each sound.

DRIFT accepts up to sixteen imported sounds and limits each managed file to 100 MB. It copies selected audio into its private application library, normally inside the Windows DRIFT application-data folder under `imported-audio`. The original can be renamed, moved or disconnected afterwards without breaking DRIFT.

Each library row contains:

- **On** — enables or disables that sound.
- **Name** — editable display name.
- **Mode: Event** — a one-shot sound which can be triggered manually or selected automatically.
- **Mode: Loop Bed** — a continuous layer beneath the environment. Enabling the row starts it; disabling it stops it.
- **Level** — individual playback volume before the Atmosphere bus.
- **Speed** — playback rate from 0.35× to 2.2×. Lower settings are especially effective for voices and machinery.
- **Auto** — allows an Event sound to join automatic Atmosphere selection.
- **Weight** — its probability relative to Sonar, Thunder, Chatter, Announcements and other imported Events.
- **Trigger** — auditions an Event immediately.
- **Remove (×)** — deletes only DRIFT's managed copy. The original source file is explicitly preserved.

Loop beds continue through Freeze like rainfall, but follow **Field Online/Offline** and the Atmosphere bus level. Imported Events stop being scheduled while Frozen, although manual Trigger remains available.

Imported sounds are a global library rather than part of an individual preset, so they remain available while programs and Journey scenes change. Their complete mix settings and names survive restarts.

## Freeze, Mutate and New Seed

- **Freeze** holds the current sound without resetting it.
- **Mutate** introduces a noticeable but related variation.
- **New Seed** creates a new deterministic generative path.

Seeds can be copied, pasted and saved with presets. A locked voice is excluded from evolution and mutation.

## Auto Morph

Press **Auto Morph** beneath the visual field for a stronger, clearly audible layer of continuous movement. The button shows its current state and depth. Adjust **Morph Depth** in the Modulation panel.

Auto Morph slowly moves filtering, resonance, detune, harmonics, amplitude, stereo position and space without replacing the underlying preset. Voice Lock excludes individual voices. Freeze pauses both ordinary Evolution and Auto Morph.

The amber knob needle remains your saved manual setting. A moving cyan ghost needle shows the current evolved value. Expand a voice to watch its pitch, detune, level, pan, filter and harmonics move. Freeze holds the cyan needles exactly where they are.

## Journey mode

Open **Journey** to build a route through two to four factory or user programs.

1. Choose a program for each Scene slot. Set unused slots to Empty.
2. Choose **Time per Leg**, from a 10-second audition to 30 minutes.
3. Enable **Loop Last → First** for a continuous circular route, or disable it to finish at the final scene.
4. Press **Begin Journey**.

The star map shows every armed scene, the current leg and a glowing traveller moving between them. Journey blends complete voice, tuning, effects, Atmosphere, macro and Slow Pulse states with a slow-in, slow-out travel curve. Waveform, filter and mode choices change near the midpoint while continuous values glide throughout the leg.

**Next Scene** completes the current leg immediately. **Stop Journey** leaves the sound exactly where it has reached. Freeze pauses the traveller without resetting its position; unfreezing resumes from the same point.

Touching a sound control manually stops Journey at its current position so the automation does not fight your adjustment. User programs appear in the Scene lists after they have been saved.

The default route travels through **Deep Space**, **Crystal Atmosphere**, **Neon Rain** and **Abyssal Beacon**.

## Slow Pulse generator

Slow Pulse is in the lower half of the Journey panel. It creates sparse tonal events through the same effects, master protection and WAV recorder as the rest of DRIFT.

- **Slow Breath** — a long, soft swell.
- **Double Heartbeat** — two rounded low-frequency impacts.
- **Distant Beacon** — a rising tonal transmission.
- **Irregular Machinery** — a slightly unstable descending pulse.
- **Tempo** — the centre rate from 2–40 BPM.
- **Depth** — pulse loudness.
- **Tone** — pulse pitch and colour.
- **Decay** — length of the pulse tail.
- **Irregular** — varies the space between events by up to roughly 45%.

**Warm Machine**, **Endless Engine**, **Crystal Atmosphere** and **Abyssal Beacon** demonstrate the four Pulse characters. Pulse can be switched off independently and keeps running when ordinary evolution is Frozen.

## Neon Chord instrument

Open **Chords** for DRIFT's playable polyphonic instrument. It is designed for enormous analogue-style stabs, slow synthwave progressions and original cyber-noir harmony.

- Click one of the eight chord pads, or press number keys **1–8**, to play it manually.
- Press **Play Progression** to advance automatically through every enabled slot.
- **Key** transposes the complete bank. **Octave** changes its register.
- **Chord Length** sets each sequencer step to 1, 2, 4 or 8 beats.
- **Tempo** runs from 35–180 BPM. **Swing** offsets alternating steps; **Gate** determines how long each chord is held.
- **Twin Saw**, **Twin Pulse** and **Twin Triangle** select the oscillator character.
- **Cutoff** and **Resonance** shape the low-pass filter sweep.
- **Attack, Decay, Sustain and Release** control the chord envelope.
- **Detune** thickens every note with an oscillator pair. **Spread** opens the voicing and stereo field. **Drive** adds edge before the shared effects.

Each slot has its own chromatic root offset, chord quality, inversion and enable switch. The supplied **Neon Noir**, **Night Drive**, **Off-World** and **Chrome Heart** templates replace all eight chord slots without disturbing the sound controls.

Chords pass through DRIFT's shared chorus, phaser, delay, reverb, tone, compression, safety limiter, Master fade and WAV recorder. Lower the Drone bus in Atmosphere when you want the stabs to dominate. Long Release plus plenty of shared Reverb creates pads; short Attack, Gate and Release settings create harder rhythmic stabs.

Journey includes the complete Chord sound state, so its tone, timing and progression can morph between scenes. Starting or stopping the Chord sequencer does not cancel a Journey, and its transport keeps playing as the scenes move. A running chord sequencer also continues when ordinary evolution is Frozen, making it usable as an independent performance layer.

### Night Sax

At the bottom of **Chords**, Night Sax adds an original, real-time synthesized solo voice above the chord bank. It is not a sampled saxophone: oscillators, filtered breath noise, pitch scoop, vibrato and an expressive envelope create its dark, weathered character.

- Switch **Sax** on, then press **Play a Phrase** to audition it immediately.
- Switch **Auto Phrases** on for sparse, self-playing phrases. **Activity** controls how frequently they arrive.
- **Lonely Descent** falls away at the end, **Noir Fragments** leaves tense gaps, and **Yearning Rise** reaches upwards before settling.
- **Register** chooses baritone through alto territory. **Level** balances it against the drone and chord stabs.
- **Darkness** closes the tone, **Breath** adds air and texture, and **Vibrato** controls the late-note movement.
- **Scoop** increases the slide into each note. **Expression** widens the dynamic shape of the phrase.

Night Sax takes its notes from the currently playing chord. If the sequencer is stopped, it chooses from the enabled chord slots, so editing the progression also changes the soloist's vocabulary. It enters DRIFT's shared effects, limiter, Master and WAV recorder. Automatic phrases continue while ordinary Evolution is Frozen.

Load **Midnight Sax** for a complete melancholy starting point with a slow minor progression, rain, sparse star tones and automatic sax phrases. **Neon Rain** also contains a tailored Noir sax setup ready to be switched on.

## Tones and Aurora

Open **Tones** for two independent long-form layers: a stereo binaural tone generator and the generative Aurora instrument.

### Binaural tones

Binaural playback sends one continuous sine frequency to the left ear and a slightly different frequency to the right. The **Beat** control is the difference between those frequencies; **Carrier** sets their shared centre pitch. Stereo headphones are required to keep the ear signals separate.

The supplied starting points are:

- **Slow Delta** — 2.5 Hz difference around a 110 Hz carrier.
- **Theta Passage** — 6 Hz difference around a 140 Hz carrier.
- **Alpha Float** — 10 Hz difference around a 180 Hz carrier.
- **Deep Pulse** — 0.25 Hz difference around a 250 Hz carrier.

**Level** is deliberately conservative and should be kept quiet, especially for long listening. **Drift** moves the two frequencies together without changing their difference.

The binaural pair bypasses chorus, phaser, delay, reverb and stereo widening so the left/right relationship remains intact. It still passes through DRIFT's compressor, safety limiter, Master, mute, Panic fade and WAV recorder.

Research into binaural beats and sleep, relaxation and attention has produced some promising findings, but studies use different frequencies and methods and results are not conclusive. These controls are exploratory sound tools, not medical treatment and not a guarantee of sleep, focus or brainwave entrainment. Do not use headphones while driving or when you need to remain alert.

### Generative Ambient Layer

The Ambient Layer adds occasional upper-register musical material above the continuous drone:

- **Aurora Swells** — slow, warm harmonic blooms.
- **Glassy Harmonics** — brighter resonant tones with long tails.
- **Synthetic Choir** — dark, softly detuned clustered voices.
- **Sparse Star Tones** — isolated high-frequency points and pings.
- **Level** — the layer's overall strength.
- **Activity** — the average waiting time between generated events.
- **Brightness** — filter colour.
- **Decay** — event tail, from roughly 2.5 to 19.5 seconds.
- **Spread** — stereo width.
- **Density** — one to four notes per event.

Press **Trigger a Swell** to hear the current settings immediately. Automatic events follow the current program's root and continue when ordinary Evolution is Frozen. They pass through the shared effects, protected master and WAV recorder.

Factory programs **Delta Night**, **Theta Passage** and **Alpha Float** demonstrate binaural and ambient combinations. Deep Space, Crystal Atmosphere and Neon Rain also carry tailored Ambient Layer settings ready to be switched on.

## Cinematic analogue-noir recipe

Load **Neon Rain**, the dedicated warm futuristic-noir program.

Suggested controls:

- Evolution: 25–35%
- Speed: 15–25%
- Warmth: 75–90%
- Space: 75–90%
- Motion: 25–45%
- Tension: 30–45%

The preset's Atmosphere adds rain, distant thunder, broken chatter and occasional civic messages. Try **Off-World Terminal** when you want a denser, more inhabited version.

## Deep-space drifting recipe

Start with **Deep Space**, **Black Ocean**, or **Dark Matter**.

Suggested controls:

- Evolution: 35–50%
- Speed: 10–20%
- Stability: 70–85%
- Range: 25–40%
- Density: 45–65%
- Tension: 10–25%
- Motion: 35–55%
- Space: 80–95%

Freeze occasionally, reduce Density to two voices, and unfreeze for slow structural movement.

In Atmosphere, keep Activity near 10–20%, Sonar near 40–55%, Distance near 85–95%, and Echo near 80–90%. **Abyssal Beacon** is the more active sonar-led alternative.

## Vintage crystal-air recipe

Load **Crystal Atmosphere** for an original late-70s analogue-space sound: phased saw and triangle layers, resonant filtering, airy noise, ensemble and unsynchronised echo.

Suggested controls:

- Evolution: 30–45%
- Speed: 20–35%
- Warmth: 65–80%
- Motion: 35–55%
- Space: 70–85%
- Tension: 15–25%

## Recording

1. Open **Recording**.
2. Choose a duration or select Unlimited.
3. Press **Start Recording**.
4. Press **Stop & Save WAV**, or wait for the duration timer.
5. Choose the filename and folder in the Windows Save dialog.

The filename is suggested from the current preset and date. The dialog opens in **Settings → Recording Location** when configured, or the Windows Music folder when it is unset.

For a finished-sounding ending, press **Panic** while recording. DRIFT fades the protected master over four seconds, captures the full fade, then stops and saves the take automatically. A second press during the fade cuts immediately and still finishes the recording.

If the Save dialog is cancelled, the completed take remains available through **Save Retained Take** until a new recording begins or DRIFT closes.

Recording captures the protected stereo master output after compression and limiting, including imported Events and Loop beds, Journey movement, Slow Pulse, the Neon Chord instrument, Night Sax, binaural tones and the generative Ambient Layer. At 48 kHz, allow roughly 330 MB of memory per hour.

## Presets

Saving a modified factory program creates a user variation. User presets can be renamed, duplicated, favourited, exported, imported and deleted.

Preset files include all voices, tuning, effects, Atmosphere, Slow Pulse, binaural and Ambient Layer settings, the complete Neon Chord instrument and Night Sax, modulation, macro controls and the random seed. Journey routes are stored as part of the application session.

## Closing and background operation

By default, the window's **X** shuts DRIFT down cleanly. Enable **X Closes to System Tray** in Settings when you want closing the window to hide it while the synth continues running.

The tray menu provides:

- Mute/unmute
- Freeze/unfreeze
- Previous/next preset
- Mutate
- Restore window
- Quit

## Safety

Start with Windows volume low. DRIFT uses conservative gain staging, compression and a final limiter, but layered low frequencies can still feel powerful.

Use **Panic** for a four-second musical fade. Press it again during the fade for immediate silence. Use the normal output button for a reversible mute or unmute.

## RHYTHM quick start

1. Select **RHYTHM** in the persistent instrument navigation.
2. Select **ENGAGE** if the shared engine is still idle. It starts at the existing safe mute setting.
3. Press **PLAY**. The drum sequencer and shared bar/beat display now follow the audio clock.
4. Select a voice and click steps in the 16-step window. Use the four page buttons for steps 1–64.
5. Double-click a voice button or use **TRIGGER** to audition its synthesis circuit.

Each voice has its own length, first/last step region, rotation and timing division. The detailed step editor controls velocity, probability, microtiming, ratchets, flam, accent and parameter locks. Alt-click a step, or use **PROTECT**, to keep it unchanged by generation and mutation. **GEN LOCK** protects the entire selected track.

**GENERATE** creates a complete, role-aware pattern from the selected style and displayed seed. The same seed and settings reproduce the same result. **MUTATE** makes a related version. **EVOLVE** commits mutations only at the selected musical boundary; **FREEZE** suspends that process without stopping playback. **REVERT/UNDO** restores the prior pattern.

Pattern changes are queued to pattern end by default. Choose immediate, next beat or next bar when required. Enter comma-separated pattern numbers in **CHAIN** for arrangement playback.

## Shared transport, mixer and sessions

The top shell stays visible on every page. Space toggles transport, **STOP** returns to the beginning, **TAP** calculates tempo, and the Swing control delays alternate subdivisions. DRIFT can remain free-running, follow start/stop, or use the shared tempo-sync state.

The **MIXER** page controls the DRIFT bus, RHYTHM bus and protected master. Both instruments continue while their pages are hidden. Sidechain and interaction routes ship off; enable them explicitly in RHYTHM's Interaction panel.

**SAVE SESSION** exports both instruments, pattern banks, transport, mixer, seeds and UI state. Kits, patterns and complete RHYTHM presets also have independent import/export controls. Old DRIFT preset files continue to work.

The recorder can capture the full master, DRIFT only or RHYTHM only. Select an immediate, next-beat or next-bar start before arming capture.

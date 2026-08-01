interface ManualPanelProps {
  onClose: () => void;
}

export function ManualPanel({ onClose }: ManualPanelProps) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="settings-modal manual-modal"
        role="dialog"
        aria-modal="true"
        aria-label="DRIFT quick manual"
      >
        <header>
          <div>
            <span className="eyebrow">OPERATING NOTES / MK I</span>
            <h2>QUICK MANUAL</h2>
          </div>
          <button onClick={onClose}>CLOSE ×</button>
        </header>

        <div className="manual-intro">
          DRIFT is designed to be started, gently steered, and left alone. Ordinary manual changes
          become the new centre around which the sound continues to evolve.
        </div>

        <div className="manual-grid">
          <article>
            <span>01</span>
            <div>
              <h3>START THE SOUND</h3>
              <ol>
                <li>
                  Choose a program from <strong>Current Program</strong>.
                </li>
                <li>
                  Press <strong>Engage Audio</strong>. The engine starts safely muted.
                </li>
                <li>
                  Press <strong>Output Muted</strong> to fade the drone in.
                </li>
              </ol>
              <p>
                Master controls the final level. Panic fades the complete output over four seconds.
                During recording, it then finishes and saves the take. Press Panic again during the
                fade for an immediate emergency cut.
              </p>
            </div>
          </article>

          <article>
            <span>02</span>
            <div>
              <h3>STEER THE FIELD</h3>
              <dl>
                <dt>Evolution</dt>
                <dd>How actively DRIFT changes.</dd>
                <dt>Speed</dt>
                <dd>How quickly the changes unfold.</dd>
                <dt>Density</dt>
                <dd>How many voices remain present.</dd>
                <dt>Tension</dt>
                <dd>Dissonance, beating and unstable intervals.</dd>
                <dt>Warmth</dt>
                <dd>Softer sources and darker filtering.</dd>
                <dt>Motion</dt>
                <dd>Stereo travel and spatial movement.</dd>
                <dt>Space</dt>
                <dd>The size and depth of the reverb field.</dd>
              </dl>
            </div>
          </article>

          <article>
            <span>03</span>
            <div>
              <h3>EVOLUTION COMMANDS</h3>
              <p>
                <strong>Freeze</strong> holds the current sound exactly where it is.
              </p>
              <p>
                <strong>Auto Morph</strong> switches on a stronger layer of slow filter, detune,
                harmonic, amplitude, stereo and space movement. Set its depth in Modulation.
              </p>
              <p>
                Amber needles remain your saved settings; cyan ghost needles show the live evolved
                values. Freeze holds them at their current positions.
              </p>
              <p>
                <strong>Mutate</strong> introduces a noticeable but related variation.
              </p>
              <p>
                <strong>New Seed</strong> creates a new deterministic path. Copy the seed if you
                want to return to it.
              </p>
              <p>A locked voice is excluded from generative drift and mutation.</p>
            </div>
          </article>

          <article className="manual-recipe">
            <span>04</span>
            <div>
              <h3>NEON ANALOGUE NOIR</h3>
              <p>
                Load <strong>Neon Rain</strong>. Try Evolution 25–35%, Speed 15–25%, Warmth 75–90%,
                Space 75–90%, Motion 25–45%, and Tension 30–45%.
              </p>
              <p>
                Its Atmosphere layer adds rainfall, distant thunder, broken chatter and civic
                transmissions. <strong>Off-World Terminal</strong> is the denser, more narrative
                variation.
              </p>
            </div>
          </article>

          <article className="manual-recipe">
            <span>05</span>
            <div>
              <h3>DEEP-SPACE DRIFT</h3>
              <p>
                Start with <strong>Deep Space</strong>, <strong>Black Ocean</strong>, or{' '}
                <strong>Dark Matter</strong>.
              </p>
              <p>
                Try Evolution 35–50%, Speed 10–20%, Stability 70–85%, Range 25–40%, Density 45–65%,
                Tension 10–25%, Motion 35–55%, and Space 80–95%.
              </p>
              <p>
                Freeze occasionally, lower Density to two voices, then unfreeze for very slow
                structural movement.
              </p>
            </div>
          </article>

          <article className="manual-recipe">
            <span>06</span>
            <div>
              <h3>VINTAGE CRYSTAL AIR</h3>
              <p>
                Load <strong>Crystal Atmosphere</strong> for luminous late-70s analogue-space
                colour: phased saw and triangle layers, resonant filtering, airy noise, ensemble and
                unsynchronised echo.
              </p>
              <p>
                Try Evolution 30–45%, Speed 20–35%, Warmth 65–80%, Motion 35–55%, Space 70–85%, and
                Tension 15–25%.
              </p>
            </div>
          </article>

          <article>
            <span>07</span>
            <div>
              <h3>ATMOSPHERE &amp; FIELD EVENTS</h3>
              <p>
                The <strong>Bus Mixer</strong> balances the continuous Drone against the complete
                Atmosphere layer before they enter the shared effects and master output.
              </p>
              <p>
                <strong>Rainfall</strong> is a continuous weather bed. Thunder, Sonar, Chatter and
                Announcements are occasional events selected by their Level / Weight controls.
              </p>
              <p>
                <strong>Activity</strong> controls how often automatic events occur; Echo and
                Distance place them in the world. Trigger Now auditions an event immediately. Freeze
                blocks new automatic events but leaves rain, echo tails and manual triggers alive.
              </p>
              <p>
                <strong>Speech Rate</strong> moves chatter and announcements from 0.35× to 2.2×.
                Glitch introduces live speed changes and, at higher settings, short rewinds.
              </p>
              <p>
                The expanded speech pool includes a genuine male voice and occasional original
                French transit and radio fragments.
              </p>
              <p>
                <strong>Custom Phrase Script</strong> opens an editable text file. Add one phrase
                per line, save it, then press Reload Phrases. DRIFT renders the new lines locally
                with an installed Windows voice and caches them as WAV audio. Use{' '}
                <code>[chatter]</code> for radio traffic, <code>[low]</code> for a lowered voice, or{' '}
                <code>[voice=Hazel]</code> to prefer a named installed voice.
              </p>
              <p>
                Every Atmosphere layer passes through the master effects, safety limiter and WAV
                recorder.
              </p>
              <p>
                <strong>Import Sounds</strong> adds WAV, MP3, OGG, M4A, AAC or FLAC files to a
                persistent sixteen-slot library. Event sounds can be triggered or selected
                automatically; Loop beds run continuously. Each has Enable, Level, Speed and Weight
                controls. DRIFT keeps its own managed copy, and Remove never deletes the original.
              </p>
            </div>
          </article>

          <article>
            <span>08</span>
            <div>
              <h3>JOURNEY &amp; SLOW PULSE</h3>
              <p>
                Journey travels through two to four factory or user programs. Choose the scenes, set
                Time per Leg, decide whether the final scene loops to the first, then press{' '}
                <strong>Begin Journey</strong>. The star map shows the live route and progress.
              </p>
              <p>
                Complete voice, tuning, effect, Atmosphere, macro and Pulse states move together
                using a slow-in, slow-out curve. Freeze pauses the traveller. Moving a sound control
                manually stops the Journey at its current position; Next Scene completes the current
                leg immediately.
              </p>
              <p>
                <strong>Slow Pulse</strong> adds Breath, Heartbeat, Beacon or Irregular Machinery
                events from 2–40 BPM. Depth is loudness, Tone is pitch colour, Decay controls the
                tail and Irregularity varies the time between events. Pulse passes through the
                shared effects, limiter and recorder.
              </p>
            </div>
          </article>

          <article>
            <span>09</span>
            <div>
              <h3>NEON CHORD INSTRUMENT</h3>
              <p>
                Open <strong>Chords</strong> for eight playable polyphonic chord pads. Click a pad
                or press number keys 1&ndash;8 for manual stabs, or press{' '}
                <strong>Play Progression</strong> to run all enabled slots automatically.
              </p>
              <p>
                Choose the key, octave, twin-oscillator waveform and chord length, then shape the
                sound with Level, Cutoff, Resonance, ADSR, Detune, Spread and Drive. Every slot has
                an editable root, chord quality and inversion. The four templates replace the
                progression while preserving your sound design.
              </p>
              <p>
                Chords enter the same shared effects, master protection and WAV recorder as the
                drone. Journey can morph the complete instrument between scenes while its Chord
                sequencer keeps playing. Freeze pauses Journey and drone evolution but leaves a
                running chord performance playing.
              </p>
              <p>
                <strong>Night Sax</strong> is the original synthesized solo voice beneath the
                chord pads. Switch it on and play a phrase manually, or enable Auto Phrases for
                sparse chord-aware improvisation. Lonely, Noir and Yearning phrase shapes alter
                the contour; Darkness, Breath, Vibrato, Scoop and Expression shape the voice.
              </p>
              <p>
                The sax follows the currently playing chord, or chooses from enabled chord slots
                when the sequencer is stopped. It uses the shared effects and recorder, continues
                through Freeze, and is demonstrated by the <strong>Midnight Sax</strong> factory
                program.
              </p>
            </div>
          </article>

          <article>
            <span>10</span>
            <div>
              <h3>TONES &amp; AURORA</h3>
              <p>
                The Tones panel contains an optional stereo binaural generator and a separate
                generative Ambient Layer. Binaural playback sends slightly different sine
                frequencies to the left and right ears, so use stereo headphones at a quiet level.
              </p>
              <p>
                Slow Delta (2.5 Hz), Theta Passage (6 Hz), Alpha Float (10 Hz) and Deep Pulse (0.25
                Hz) are exploratory listening settings. Research is promising in places but not
                conclusive, so DRIFT does not claim to induce sleep, focus or a particular brain
                state.
              </p>
              <p>
                Aurora, Glass, Choir and Stars create sparse upper-register events above the drone.
                Activity sets how often they appear; Brightness, Decay, Spread and Density shape
                each event. Trigger a Swell auditions one immediately. The layer follows the current
                root and enters the shared effects, limiter and recorder.
              </p>
            </div>
          </article>

          <article>
            <span>11</span>
            <div>
              <h3>RECORDING</h3>
              <ol>
                <li>Open the Recording panel and choose a duration.</li>
                <li>
                  Press <strong>Start Recording</strong>.
                </li>
                <li>
                  Press <strong>Stop &amp; Save WAV</strong>, or let the timer stop it.
                </li>
                <li>Choose the filename and folder in the Windows Save dialog.</li>
              </ol>
              <p>
                The dialog opens in Settings → Recording Location, or your Windows Music folder when
                unset. Cancelling keeps the take available as <strong>Save Retained Take</strong>.
              </p>
            </div>
          </article>

          <article>
            <span>12</span>
            <div>
              <h3>PRESETS &amp; BACKGROUND USE</h3>
              <p>
                Saving a modified factory sound creates a user variation. User programs can be
                renamed, duplicated, exported, imported and deleted.
              </p>
              <p>
                By default, X shuts DRIFT down cleanly. Enable X Closes to System Tray in Settings
                when you want the window to hide while the synth continues playing. The tray menu
                controls mute, Freeze, presets and Mutate.
              </p>
            </div>
          </article>

          <article>
            <span>13</span>
            <div>
              <h3>SAFE OPERATION</h3>
              <p>
                Start with Windows volume low. DRIFT has conservative gain staging, compression and
                a final limiter, but layered low frequencies can still feel powerful.
              </p>
              <p>
                <strong>Panic</strong> normally gives you a four-second musical fade. Press it a
                second time while Fading is shown when you need immediate silence. Use the regular
                output button for a reversible mute or unmute.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

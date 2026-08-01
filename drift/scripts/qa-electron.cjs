const {
  _electron: electron,
} = require('C:\\Users\\djras\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const errors = [];
  const packagedArgument = process.env.DRIFT_EXECUTABLE || process.argv[2];
  const packagedExecutable = packagedArgument ? path.resolve(root, packagedArgument) : '';
  const electronApp = await electron.launch({
    executablePath:
      packagedExecutable || path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: packagedExecutable ? [] : [root],
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DRIFT_QA: '1',
      DRIFT_QA_AUDIO_FIXTURE: path.join(root, 'src', 'assets', 'atmosphere', 'chatter-beacon.wav'),
    },
  });
  if (process.env.DRIFT_PAGE_QA !== '1') {
    const packagedState = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      await wait(1800);
      const candidate = BrowserWindow.getAllWindows()[0];
      if (!candidate) return null;
      candidate.show();
      await wait(150);
      const ui = await candidate.webContents.executeJavaScript(`(async () => {
        const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        const runtimeErrors = [];
        window.addEventListener('error', (event) => runtimeErrors.push(event.message));
        window.addEventListener('unhandledrejection', (event) => runtimeErrors.push(String(event.reason)));
        document.querySelector('.preset-browser__current')?.click();
        await wait(80);
        const factoryPrograms = document.querySelectorAll('.preset-list button').length;
        const deltaNightVisible = [...document.querySelectorAll('.preset-list button')]
          .some((button) => button.textContent?.includes('Delta Night'));
        const thetaPassageVisible = [...document.querySelectorAll('.preset-list button')]
          .some((button) => button.textContent?.includes('Theta Passage'));
        const alphaFloatVisible = [...document.querySelectorAll('.preset-list button')]
          .some((button) => button.textContent?.includes('Alpha Float'));
        const midnightSaxVisible = [...document.querySelectorAll('.preset-list button')]
          .some((button) => button.textContent?.includes('Midnight Sax'));
        [...document.querySelectorAll('.preset-list button')]
          .find((button) => button.textContent?.includes('Neon Rain'))?.click();
        await wait(180);
        const morphButton = document.querySelector('.morph-button');
        if (!morphButton?.classList.contains('is-active')) morphButton?.click();
        await wait(150);
        const autoMorphActive = document.querySelector('.morph-button')?.classList.contains('is-active');
        document.querySelector('.audio-button')?.click();
        await wait(900);
        const liveGhostKnobs = document.querySelectorAll('.knob.is-modulating').length;
        [...document.querySelectorAll('.panel-tabs button')]
          .find((button) => button.textContent?.includes('ATMOSPHERE'))?.click();
        await wait(250);
        const busMixerKnobs = document.querySelectorAll('.bus-mixer .knob').length;
        const atmosphereMacroKnobs = document.querySelectorAll('.atmosphere-macros .knob').length;
        const phraseOpenButton = Boolean(document.querySelector('.phrase-open'));
        const phraseReload = document.querySelector('.phrase-reload');
        if (!phraseReload?.disabled) phraseReload?.click();
        for (let attempt = 0; attempt < 50; attempt += 1) {
          if (document.querySelector('.phrase-script')?.dataset.phraseState !== 'rendering') break;
          await wait(100);
        }
        const phraseState = document.querySelector('.phrase-script')?.dataset.phraseState;
        const phraseCount = Number(document.querySelector('.phrase-script')?.dataset.phraseCount ?? 0);
        document.querySelector('.atmosphere-event--chatter .event-trigger')?.click();
        await wait(350);
        const chatterStatus = document.querySelector('.weather-screen strong')?.textContent?.trim();
        document.querySelector('.atmosphere-event--transmission .event-trigger')?.click();
        await wait(350);
        const transmissionStatus = document.querySelector('.weather-screen strong')?.textContent?.trim();
        document.querySelector('.atmosphere-event--sonar .event-trigger')?.click();
        await wait(350);
        const atmosphereStatus = document.querySelector('.weather-screen strong')?.textContent?.trim();
        const customRowsBefore = document.querySelectorAll('.custom-sound-row').length;
        document.querySelector('.custom-import')?.click();
        await wait(1350);
        const customRows = document.querySelectorAll('.custom-sound-row').length;
        const importedRow = [...document.querySelectorAll('.custom-sound-row')].at(-1);
        const customLoadStatus = importedRow?.querySelector('.custom-sound-name small')?.textContent?.trim();
        importedRow?.querySelector('.custom-trigger')?.click();
        await wait(250);
        const customStatus = document.querySelector('.weather-screen strong')?.textContent?.trim();
        window.confirm = () => true;
        importedRow?.querySelector('.custom-remove')?.click();
        await wait(250);
        const customRowsAfterRemove = document.querySelectorAll('.custom-sound-row').length;
        [...document.querySelectorAll('.panel-tabs button')]
          .find((button) => button.textContent?.includes('JOURNEY'))?.click();
        await wait(180);
        const journeySceneSlots = document.querySelectorAll('.journey-scenes select').length;
        const journeyNodes = document.querySelectorAll('.journey-node').length;
        const pulseKnobs = document.querySelectorAll('.pulse-knobs .knob').length;
        const pulseButton = document.querySelector('.pulse-switch');
        if (!pulseButton?.classList.contains('is-active')) pulseButton?.click();
        await wait(1050);
        const pulseEnabled = document.querySelector('.pulse-switch')?.classList.contains('is-active');
        const pulseEventCount = Number(document.querySelector('.pulse-switch')?.dataset.pulseCount ?? 0);
        document.querySelector('.journey-start')?.click();
        await wait(420);
        const journeyRunning = document.querySelector('.journey-map')?.classList.contains('is-running');
        [...document.querySelectorAll('.panel-tabs button')]
          .find((button) => button.textContent?.includes('CHORDS'))?.click();
        await wait(180);
        const chordSteps = document.querySelectorAll('.chord-step').length;
        const chordKnobs = document.querySelectorAll('.chord-shaper .knob').length;
        document.querySelector('.chord-pad')?.click();
        await wait(500);
        const manualChordTriggers = Number(
          document.querySelector('.chord-panel')?.dataset.triggerCount ?? 0,
        );
        const chordRunButton = document.querySelector('.chord-run');
        chordRunButton?.click();
        await wait(1100);
        const chordRunning = chordRunButton?.classList.contains('is-active');
        const chordPlaying = Boolean(document.querySelector('.chord-step.is-playing'));
        const chordTriggers = Number(
          document.querySelector('.chord-panel')?.dataset.triggerCount ?? 0,
        );
        const journeyTransportPreserved = [...document.querySelectorAll('.statusbar span')]
          .some((item) => item.textContent?.trim().startsWith('JOURNEY '));
        const saxKnobs = document.querySelectorAll('.sax-knobs .knob').length;
        const saxPower = document.querySelector('.sax-power');
        if (!saxPower?.classList.contains('is-active')) saxPower?.click();
        await wait(120);
        document.querySelector('.sax-trigger')?.click();
        await wait(500);
        const saxCount = Number(document.querySelector('.night-sax')?.dataset.saxCount ?? 0);
        const saxAutoButton = document.querySelector('.sax-auto');
        if (!saxAutoButton?.classList.contains('is-active')) saxAutoButton?.click();
        await wait(80);
        const saxActive = document.querySelector('.sax-power')?.classList.contains('is-active');
        const saxAuto = document.querySelector('.sax-auto')?.classList.contains('is-active');
        [...document.querySelectorAll('.panel-tabs button')]
          .find((button) => button.textContent?.includes('TONES'))?.click();
        await wait(180);
        const binauralPrograms = document.querySelectorAll('.binaural-programs button').length;
        const toneKnobs = document.querySelectorAll('.tone-knobs .knob').length;
        const ambientKnobs = document.querySelectorAll('.ambient-knobs .knob').length;
        document.querySelector('.binaural-programs button')?.click();
        document.querySelector('.ambient-module .tone-power')?.click();
        await wait(180);
        document.querySelector('.ambient-trigger')?.click();
        await wait(600);
        const binauralActive = document.querySelector('.binaural-module')?.classList.contains('is-active');
        const ambientActive = document.querySelector('.ambient-module')?.classList.contains('is-active');
        const binauralBeat = Number(document.querySelector('.tones-panel')?.dataset.binauralBeat ?? 0);
        const ambientCount = Number(document.querySelector('.tones-panel')?.dataset.ambientCount ?? 0);
        const panicButton = document.querySelector('.panic-button');
        panicButton?.click();
        await wait(80);
        const panicFadeText = panicButton?.textContent?.replace(/\\s+/g, ' ').trim();
        const panicFading = panicButton?.classList.contains('is-fading');
        panicButton?.click();
        await wait(80);
        const panicCutText = panicButton?.textContent?.replace(/\\s+/g, ' ').trim();
        return {
          readyState: document.readyState,
          title: document.title,
          version: document.querySelector('.brand small')?.textContent,
          factoryPrograms,
          deltaNightVisible,
          thetaPassageVisible,
          alphaFloatVisible,
          midnightSaxVisible,
          autoMorphActive,
          liveGhostKnobs,
          busMixerKnobs,
          atmosphereMacroKnobs,
          phraseOpenButton,
          phraseState,
          phraseCount,
          chatterStatus,
          transmissionStatus,
          atmosphereStatus,
          customRowsBefore,
          customRows,
          customLoadStatus,
          customStatus,
          customRowsAfterRemove,
          journeySceneSlots,
          journeyNodes,
          pulseKnobs,
          pulseEnabled,
          pulseEventCount,
          journeyRunning,
          chordSteps,
          chordKnobs,
          manualChordTriggers,
          chordRunning,
          chordPlaying,
          chordTriggers,
          journeyTransportPreserved,
          saxKnobs,
          saxCount,
          saxActive,
          saxAuto,
          binauralPrograms,
          toneKnobs,
          ambientKnobs,
          binauralActive,
          ambientActive,
          binauralBeat,
          ambientCount,
          panicFadeText,
          panicFading,
          panicCutText,
          noHorizontalOverflow: document.body.scrollWidth <= window.innerWidth,
          runtimeErrors
        };
      })()`);
      await candidate.webContents.executeJavaScript(`
        window.scrollTo(0, document.body.scrollHeight);
      `);
      await wait(180);
      const screenshot = (await candidate.webContents.capturePage()).toPNG().toString('base64');
      await candidate.webContents.executeJavaScript(`(async () => {
        const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        [...document.querySelectorAll('.panel-tabs button')]
          .find((button) => button.textContent?.includes('CHORDS'))?.click();
        await wait(180);
        window.scrollTo(0, document.body.scrollHeight);
        await wait(180);
      })()`);
      const saxScreenshot = (await candidate.webContents.capturePage()).toPNG().toString('base64');
      await candidate.webContents.executeJavaScript(`(async () => {
        const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        [...document.querySelectorAll('.panel-tabs button')]
          .find((button) => button.textContent?.includes('ATMOSPHERE'))?.click();
        await wait(180);
        document.querySelector('.custom-import')?.click();
        await wait(1200);
        window.scrollTo(0, document.body.scrollHeight);
        await wait(180);
      })()`);
      const customScreenshot = (await candidate.webContents.capturePage())
        .toPNG()
        .toString('base64');
      await candidate.webContents.executeJavaScript(`(async () => {
        const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        window.confirm = () => true;
        while (document.querySelector('.custom-sound-row')) {
          document.querySelector('.custom-sound-row .custom-remove')?.click();
          await wait(120);
        }
        await wait(800);
      })()`);
      return {
        visible: candidate.isVisible(),
        url: candidate.webContents.getURL(),
        ui,
        screenshot,
        saxScreenshot,
        customScreenshot,
      };
    });
    if (packagedState?.screenshot) {
      fs.mkdirSync(path.join(root, 'qa'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'qa', 'drift-tones.png'),
        Buffer.from(packagedState.screenshot, 'base64'),
      );
      delete packagedState.screenshot;
    }
    if (packagedState?.customScreenshot) {
      fs.writeFileSync(
        path.join(root, 'qa', 'drift-custom-library.png'),
        Buffer.from(packagedState.customScreenshot, 'base64'),
      );
      delete packagedState.customScreenshot;
    }
    if (packagedState?.saxScreenshot) {
      fs.writeFileSync(
        path.join(root, 'qa', 'drift-night-sax.png'),
        Buffer.from(packagedState.saxScreenshot, 'base64'),
      );
      delete packagedState.saxScreenshot;
    }
    console.log(JSON.stringify({ packagedState }, null, 2));
    await electronApp.close();
    if (
      !packagedState?.visible ||
      packagedState.ui?.readyState !== 'complete' ||
      packagedState.ui?.title !== 'DRIFT' ||
      !packagedState.ui?.version?.includes('V2.0.0') ||
      packagedState.ui?.factoryPrograms !== 28 ||
      !packagedState.ui?.deltaNightVisible ||
      !packagedState.ui?.thetaPassageVisible ||
      !packagedState.ui?.alphaFloatVisible ||
      !packagedState.ui?.midnightSaxVisible ||
      !packagedState.ui?.autoMorphActive ||
      packagedState.ui?.liveGhostKnobs < 1 ||
      packagedState.ui?.busMixerKnobs !== 2 ||
      packagedState.ui?.atmosphereMacroKnobs !== 6 ||
      !packagedState.ui?.phraseOpenButton ||
      packagedState.ui?.phraseState !== 'ready' ||
      packagedState.ui?.phraseCount < 1 ||
      packagedState.ui?.chatterStatus !== 'CHATTER' ||
      packagedState.ui?.transmissionStatus !== 'TRANSMISSION' ||
      packagedState.ui?.atmosphereStatus !== 'SONAR' ||
      packagedState.ui?.customRows !== packagedState.ui?.customRowsBefore + 1 ||
      !packagedState.ui?.customLoadStatus?.includes('READY') ||
      packagedState.ui?.customStatus !== 'CUSTOM' ||
      packagedState.ui?.customRowsAfterRemove !== packagedState.ui?.customRowsBefore ||
      packagedState.ui?.journeySceneSlots !== 4 ||
      packagedState.ui?.journeyNodes !== 4 ||
      packagedState.ui?.pulseKnobs !== 5 ||
      !packagedState.ui?.pulseEnabled ||
      packagedState.ui?.pulseEventCount < 1 ||
      !packagedState.ui?.journeyRunning ||
      packagedState.ui?.chordSteps !== 8 ||
      packagedState.ui?.chordKnobs !== 10 ||
      packagedState.ui?.manualChordTriggers < 1 ||
      !packagedState.ui?.chordRunning ||
      !packagedState.ui?.chordPlaying ||
      packagedState.ui?.chordTriggers < 2 ||
      !packagedState.ui?.journeyTransportPreserved ||
      packagedState.ui?.saxKnobs !== 7 ||
      packagedState.ui?.saxCount < 1 ||
      !packagedState.ui?.saxActive ||
      !packagedState.ui?.saxAuto ||
      packagedState.ui?.binauralPrograms !== 4 ||
      packagedState.ui?.toneKnobs !== 4 ||
      packagedState.ui?.ambientKnobs !== 6 ||
      !packagedState.ui?.binauralActive ||
      !packagedState.ui?.ambientActive ||
      packagedState.ui?.binauralBeat !== 2.5 ||
      packagedState.ui?.ambientCount < 1 ||
      !packagedState.ui?.panicFading ||
      !packagedState.ui?.panicFadeText?.includes('FADING') ||
      !packagedState.ui?.panicCutText?.includes('PANIC') ||
      !packagedState.ui?.noHorizontalOverflow ||
      packagedState.ui?.runtimeErrors.length
    ) {
      process.exitCode = 1;
    }
    return;
  }
  const window = electronApp.windows()[0] || (await electronApp.firstWindow());
  window.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  window.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  window.on('requestfailed', (request) =>
    errors.push(`request: ${request.url()} / ${request.failure()?.errorText || 'failed'}`),
  );
  await window.waitForLoadState('domcontentloaded');
  await window.waitForTimeout(1800);
  await window.setViewportSize({ width: 1440, height: 900 });
  await window.screenshot({ path: path.join(root, 'qa', 'drift-main.png'), fullPage: true });
  await window.locator('.preset-browser__current').click();
  const factoryPrograms = await window.locator('.preset-list button').count();
  const neonRainVisible = await window.getByRole('button', { name: /Neon Rain/i }).isVisible();
  const crystalAtmosphereVisible = await window
    .getByRole('button', { name: /Crystal Atmosphere/i })
    .isVisible();
  const offWorldTerminalVisible = await window
    .getByRole('button', { name: /Off-World Terminal/i })
    .isVisible();
  const deltaNightVisible = await window.getByRole('button', { name: /Delta Night/i }).isVisible();
  const thetaPassageVisible = await window
    .getByRole('button', { name: /Theta Passage/i })
    .isVisible();
  const alphaFloatVisible = await window.getByRole('button', { name: /Alpha Float/i }).isVisible();
  const midnightSaxVisible = await window.getByRole('button', { name: /Midnight Sax/i }).isVisible();
  await window.locator('.preset-browser__current').click();
  await window.getByRole('button', { name: /Open quick manual/i }).click();
  const manualVisible = await window.locator('.manual-modal').isVisible();
  await window.screenshot({ path: path.join(root, 'qa', 'drift-manual.png'), fullPage: true });
  await window.locator('.manual-modal').getByRole('button', { name: /close/i }).click();
  await window.getByRole('button', { name: /Open settings/i }).click();
  const closesToTrayByDefault = await window
    .getByRole('checkbox', { name: /X closes to system tray/i })
    .isChecked();
  await window.locator('.settings-modal').getByRole('button', { name: /close/i }).click();

  const initial = await window.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('h1')?.textContent,
    versionLabel: document.querySelector('.brand small')?.textContent,
    knobs: document.querySelectorAll('.knob').length,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  initial.factoryPrograms = factoryPrograms;

  await window.getByRole('button', { name: /engage audio/i }).click();
  await window.waitForTimeout(1200);
  const audioReadout = await window.locator('.system-readout strong').nth(1).textContent();
  const mutedReadout = await window.getByRole('button', { name: /output muted/i }).textContent();

  const seedBefore = await window.locator('.seed-box input').inputValue();
  await window.getByRole('button', { name: /^NEW SEED/i }).click();
  const seedAfter = await window.locator('.seed-box input').inputValue();
  await window.getByRole('button', { name: /^FREEZE/i }).click();
  const freezeText = await window.locator('.freeze-button').textContent();
  await window.locator('.preset-browser__current').click();
  await window.getByRole('button', { name: /Neon Rain/i }).click();
  await window.getByRole('button', { name: /04ATMOSPHERE/i }).click();
  await window.waitForTimeout(350);
  const atmosphereVisible = await window.locator('.atmosphere-panel').isVisible();
  const busMixerVisible = await window.locator('.bus-mixer').isVisible();
  const busMixerKnobs = await window.locator('.bus-mixer .knob').count();
  const atmosphereMacroKnobs = await window.locator('.atmosphere-macros .knob').count();
  const phraseOpenButton = await window.locator('.phrase-open').isVisible();
  const phraseReload = window.locator('.phrase-reload');
  if (!(await phraseReload.isDisabled())) await phraseReload.click();
  await window.locator('.phrase-script').waitFor({ state: 'visible', timeout: 5000 });
  await window.waitForFunction(
    () =>
      document.querySelector('.phrase-script')?.getAttribute('data-phrase-state') !== 'rendering',
  );
  const phraseState = await window.locator('.phrase-script').getAttribute('data-phrase-state');
  const phraseCount = Number(
    (await window.locator('.phrase-script').getAttribute('data-phrase-count')) ?? 0,
  );
  await window
    .locator('.atmosphere-event--chatter .event-trigger')
    .evaluate((button) => button.click());
  await window.waitForTimeout(500);
  const chatterStatus = await window.locator('.weather-screen strong').textContent();
  await window
    .locator('.atmosphere-event--transmission .event-trigger')
    .evaluate((button) => button.click());
  await window.waitForTimeout(500);
  const transmissionStatus = await window.locator('.weather-screen strong').textContent();
  await window
    .locator('.atmosphere-event--sonar .event-trigger')
    .evaluate((button) => button.click());
  await window.waitForTimeout(450);
  const atmosphereStatus = await window.locator('.weather-screen strong').textContent();
  await window.screenshot({ path: path.join(root, 'qa', 'drift-atmosphere.png'), fullPage: true });
  await window.getByRole('button', { name: /03EFFECTS/i }).click();
  await window.waitForTimeout(400);
  const effectsVisible = await window.locator('.effects-panel').isVisible();
  await window.screenshot({ path: path.join(root, 'qa', 'drift-effects.png'), fullPage: true });
  await window.getByRole('button', { name: /05JOURNEY/i }).click();
  await window.waitForTimeout(250);
  const journeyVisible = await window.locator('.journey-panel').isVisible();
  const journeySceneSlots = await window.locator('.journey-scenes select').count();
  const journeyNodes = await window.locator('.journey-node').count();
  const pulseKnobs = await window.locator('.pulse-knobs .knob').count();
  const pulseSwitch = window.locator('.pulse-switch');
  if (!(await pulseSwitch.evaluate((button) => button.classList.contains('is-active')))) {
    await pulseSwitch.click();
  }
  await window.locator('.journey-start').click();
  await window.waitForTimeout(500);
  const journeyRunning = await window
    .locator('.journey-map')
    .evaluate((map) => map.classList.contains('is-running'));
  await window.screenshot({ path: path.join(root, 'qa', 'drift-journey.png'), fullPage: true });
  await window.getByRole('button', { name: /06CHORDS/i }).click();
  await window.waitForTimeout(250);
  const chordVisible = await window.locator('.chord-panel').isVisible();
  const chordSteps = await window.locator('.chord-step').count();
  const chordKnobs = await window.locator('.chord-shaper .knob').count();
  await window.locator('.chord-pad').first().click();
  await window.waitForTimeout(500);
  const manualChordTriggers = Number(
    (await window.locator('.chord-panel').getAttribute('data-trigger-count')) ?? 0,
  );
  await window.locator('.chord-run').click();
  await window.waitForTimeout(1100);
  const chordRunning = await window
    .locator('.chord-run')
    .evaluate((button) => button.classList.contains('is-active'));
  const chordPlaying = await window.locator('.chord-step.is-playing').count();
  const chordTriggers = Number(
    (await window.locator('.chord-panel').getAttribute('data-trigger-count')) ?? 0,
  );
  const journeyTransportPreserved = await window
    .locator('.statusbar')
    .getByText(/^JOURNEY \d+%/)
    .isVisible();
  const saxKnobs = await window.locator('.sax-knobs .knob').count();
  const saxPower = window.locator('.sax-power');
  if (!(await saxPower.evaluate((button) => button.classList.contains('is-active')))) {
    await saxPower.click();
  }
  await window.locator('.sax-trigger').click();
  await window.waitForTimeout(500);
  const saxCount = Number(
    (await window.locator('.night-sax').getAttribute('data-sax-count')) ?? 0,
  );
  const saxAutoButton = window.locator('.sax-auto');
  if (!(await saxAutoButton.evaluate((button) => button.classList.contains('is-active')))) {
    await saxAutoButton.click();
  }
  const saxActive = await saxPower.evaluate((button) => button.classList.contains('is-active'));
  const saxAuto = await saxAutoButton.evaluate((button) => button.classList.contains('is-active'));
  await window.screenshot({ path: path.join(root, 'qa', 'drift-night-sax.png'), fullPage: true });
  await window.getByRole('button', { name: /07TONES/i }).click();
  await window.waitForTimeout(250);
  const tonesVisible = await window.locator('.tones-panel').isVisible();
  const binauralPrograms = await window.locator('.binaural-programs button').count();
  const toneKnobs = await window.locator('.tone-knobs .knob').count();
  const ambientKnobs = await window.locator('.ambient-knobs .knob').count();
  await window.locator('.binaural-programs button').first().click();
  await window.locator('.ambient-module .tone-power').click();
  await window.locator('.ambient-trigger').click();
  await window.waitForTimeout(600);
  const binauralActive = await window.locator('.binaural-module.is-active').count();
  const ambientActive = await window.locator('.ambient-module.is-active').count();
  const binauralBeat = Number(
    (await window.locator('.tones-panel').getAttribute('data-binaural-beat')) ?? 0,
  );
  const ambientCount = Number(
    (await window.locator('.tones-panel').getAttribute('data-ambient-count')) ?? 0,
  );
  await window.screenshot({ path: path.join(root, 'qa', 'drift-tones.png'), fullPage: true });

  console.log(
    JSON.stringify(
      {
        initial,
        neonRainVisible,
        crystalAtmosphereVisible,
        offWorldTerminalVisible,
        deltaNightVisible,
        thetaPassageVisible,
        alphaFloatVisible,
        midnightSaxVisible,
        closesToTrayByDefault,
        manualVisible,
        audioReadout: audioReadout?.trim(),
        mutedReadout: mutedReadout?.replace(/\s+/g, ' ').trim(),
        seedChanged: seedBefore !== seedAfter,
        freezeText: freezeText?.replace(/\s+/g, ' ').trim(),
        atmosphereVisible,
        busMixerVisible,
        busMixerKnobs,
        atmosphereMacroKnobs,
        phraseOpenButton,
        phraseState,
        phraseCount,
        chatterStatus: chatterStatus?.trim(),
        transmissionStatus: transmissionStatus?.trim(),
        atmosphereStatus: atmosphereStatus?.trim(),
        effectsVisible,
        journeyVisible,
        journeySceneSlots,
        journeyNodes,
        pulseKnobs,
        journeyRunning,
        chordVisible,
        chordSteps,
        chordKnobs,
        manualChordTriggers,
        chordRunning,
        chordPlaying,
        chordTriggers,
        journeyTransportPreserved,
        saxKnobs,
        saxCount,
        saxActive,
        saxAuto,
        tonesVisible,
        binauralPrograms,
        toneKnobs,
        ambientKnobs,
        binauralActive,
        ambientActive,
        binauralBeat,
        ambientCount,
        errors,
      },
      null,
      2,
    ),
  );
  await electronApp.close();
  if (
    initial.title !== 'DRIFT' ||
    initial.heading !== 'DRIFT' ||
    !initial.versionLabel?.includes('V2.0.0') ||
    initial.knobs < 9 ||
    initial.factoryPrograms !== 28 ||
    !neonRainVisible ||
    !crystalAtmosphereVisible ||
    !offWorldTerminalVisible ||
    !deltaNightVisible ||
    !thetaPassageVisible ||
    !alphaFloatVisible ||
    !midnightSaxVisible ||
    closesToTrayByDefault ||
    !manualVisible ||
    audioReadout?.trim() !== '48K' ||
    !seedBefore ||
    seedBefore === seedAfter ||
    !atmosphereVisible ||
    !busMixerVisible ||
    busMixerKnobs !== 2 ||
    atmosphereMacroKnobs !== 6 ||
    !phraseOpenButton ||
    phraseState !== 'ready' ||
    phraseCount < 1 ||
    chatterStatus?.trim() !== 'CHATTER' ||
    transmissionStatus?.trim() !== 'TRANSMISSION' ||
    atmosphereStatus?.trim() !== 'SONAR' ||
    !effectsVisible ||
    !journeyVisible ||
    journeySceneSlots !== 4 ||
    journeyNodes !== 4 ||
    pulseKnobs !== 5 ||
    !journeyRunning ||
    !chordVisible ||
    chordSteps !== 8 ||
    chordKnobs !== 10 ||
    manualChordTriggers < 1 ||
    !chordRunning ||
    chordPlaying < 1 ||
    chordTriggers < 2 ||
    !journeyTransportPreserved ||
    saxKnobs !== 7 ||
    saxCount < 1 ||
    !saxActive ||
    !saxAuto ||
    !tonesVisible ||
    binauralPrograms !== 4 ||
    toneKnobs !== 4 ||
    ambientKnobs !== 6 ||
    binauralActive < 1 ||
    ambientActive < 1 ||
    binauralBeat !== 2.5 ||
    ambientCount < 1 ||
    errors.length
  ) {
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

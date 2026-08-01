const { _electron: electron } = require(
  'C:\\Users\\djras\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright',
);
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const errors = [];
  const electronApp = await electron.launch({
    executablePath: path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: [root],
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production', DRIFT_QA: '1' },
  });
  const window = electronApp.windows()[0] || (await electronApp.firstWindow());
  window.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  window.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  await window.waitForLoadState('domcontentloaded');
  await window.waitForTimeout(1200);
  await window.setViewportSize({ width: 1440, height: 1000 });
  await window.evaluate(() => {
    const NativeAudioContext = window.AudioContext;
    window.__driftQaAudioContexts = 0;
    window.AudioContext = class CountingAudioContext extends NativeAudioContext {
      constructor(options) {
        super(options);
        window.__driftQaAudioContexts += 1;
      }
    };
  });

  await window.locator('.instrument-navigation button').filter({ hasText: 'RHYTHM' }).click();
  await window.waitForTimeout(200);
  const voiceCount = await window.locator('.voice-buttons button').count();
  const stepCount = await window.locator('.step-grid button').count();
  const pageCount = await window.locator('.page-select button').count();
  const kitCount = await window.locator('.drum-mix-panel select').first().locator('option').count();
  const rhythmVisible = await window.locator('.rhythm-page').isVisible();
  const generatedBefore = await window.locator('.step-grid button.is-active').count();
  await window.getByRole('button', { name: 'GENERATE', exact: true }).click();
  const generatedAfter = await window.locator('.step-grid button.is-active').count();

  await window.locator('.shared-engine').click();
  await window.waitForTimeout(500);
  const audioContextCount = await window.evaluate(() => window.__driftQaAudioContexts);
  if ((await window.locator('.shared-engine').textContent())?.includes('MUTED'))
    await window.locator('.shared-engine').click();
  await window.locator('.transport-play').click();
  await window.waitForTimeout(700);
  const stepDuringRhythm = await window.locator('.step-grid button').evaluateAll((steps) =>
    steps.findIndex((step) => step.classList.contains('is-current')),
  );
  const positionDuringRhythm = await window.locator('.shared-transport output').textContent();
  await window.locator('.instrument-navigation button').filter({ hasText: 'DRIFT' }).click();
  await window.waitForTimeout(450);
  const transportStillPlaying = await window.locator('.transport-play').evaluate((element) =>
    element.classList.contains('is-playing'),
  );
  await window.locator('.instrument-navigation button').filter({ hasText: 'RHYTHM' }).click();
  await window.waitForTimeout(450);
  const stepAfterSwitch = await window.locator('.step-grid button').evaluateAll((steps) =>
    steps.findIndex((step) => step.classList.contains('is-current')),
  );
  const positionAfterSwitch = await window.locator('.shared-transport output').textContent();
  await window.locator('.voice-buttons button').first().dblclick();
  await window.waitForTimeout(160);
  await window.screenshot({ path: path.join(root, 'qa', 'rhythm-main.png'), fullPage: true });
  await window.locator('.instrument-navigation button').filter({ hasText: 'MIXER' }).click();
  const mixerStrips = await window.locator('.mixer-strips article').count();
  const noHorizontalOverflow = await window.evaluate(() => document.body.scrollWidth <= window.innerWidth);

  const result = {
    rhythmVisible,
    voiceCount,
    stepCount,
    pageCount,
    kitCount,
    generatedBefore,
    generatedAfter,
    audioContextCount,
    stepDuringRhythm,
    stepAfterSwitch,
    positionDuringRhythm,
    positionAfterSwitch,
    transportStillPlaying,
    playheadAdvancedAcrossSwitch:
      positionDuringRhythm !== positionAfterSwitch &&
      (stepAfterSwitch < 0 || stepDuringRhythm !== stepAfterSwitch),
    mixerStrips,
    noHorizontalOverflow,
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  await electronApp.close();
  if (
    !rhythmVisible ||
    voiceCount !== 11 ||
    stepCount !== 16 ||
    pageCount !== 4 ||
    kitCount !== 12 ||
    generatedAfter < 1 ||
    audioContextCount !== 1 ||
    !transportStillPlaying ||
    !result.playheadAdvancedAcrossSwitch ||
    mixerStrips !== 3 ||
    !noHorizontalOverflow ||
    errors.length
  ) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const { chromium } = require(
  'C:\\Users\\djras\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright',
);
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const portFile = 'C:\\Users\\djras\\AppData\\Roaming\\DRIFT\\DevToolsActivePort';
  const [port] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const pages = browser.contexts().flatMap((context) => context.pages());
  const result = [];
  for (const [index, page] of pages.entries()) {
    await page.waitForTimeout(500);
    result.push({
      url: page.url(),
      title: await page.title(),
      readyState: await page.evaluate(() => document.readyState),
      rootChildren: await page.locator('#root').locator(':scope > *').count(),
      bodyText: (await page.locator('body').innerText()).slice(0, 500),
      background: await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      dimensions: await page.evaluate(() => ({
        innerWidth,
        innerHeight,
        bodyWidth: document.body.scrollWidth,
        bodyHeight: document.body.scrollHeight,
      })),
    });
    await page.screenshot({
      path: path.join(__dirname, '..', 'qa', `running-portable-${index}.png`),
      fullPage: true,
    });
  }
  console.log(JSON.stringify(result, null, 2));
  if (process.env.DRIFT_INSPECT_CLOSE === '1') {
    const session = await browser.newBrowserCDPSession();
    await session.send('Browser.close');
  } else {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

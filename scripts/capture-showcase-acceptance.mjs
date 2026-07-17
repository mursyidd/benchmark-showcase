import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { startServer } from './serve.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = resolve(root, 'evidence', 'showcase-acceptance');
await mkdir(outputRoot, { recursive: true });
const server = await startServer({ root, port: 0 });
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();
const records = [];

async function capture(name, viewport, setup) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC' });
  const page = await context.newPage();
  await setup(page);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const path = resolve(outputRoot, `${name}.png`);
  await page.screenshot({ path, type: 'png', fullPage: false, animations: 'disabled' });
  records.push({ label: 'Showcase acceptance capture', name, path: `evidence/showcase-acceptance/${name}.png`, viewport, capturedAt: new Date().toISOString() });
  await context.close();
}

try {
  await capture('desktop-report', { width: 1440, height: 900 }, (page) => page.goto(base));
  await capture('mobile-report', { width: 390, height: 844 }, (page) => page.goto(base));
  await capture('selected-case-comparison', { width: 1440, height: 900 }, async (page) => {
    await page.goto(`${base}/#results`);
    await page.locator('.case-selector button').nth(1).click();
    await page.locator('#results').scrollIntoViewIfNeeded();
  });
  await capture('exact-prompt-view', { width: 1440, height: 900 }, (page) => page.goto(`${base}/#prompt=case-01-new-skill`));
  await capture('tested-skill-view', { width: 1440, height: 900 }, async (page) => {
    await page.goto(base);
    await page.getByRole('button', { name: 'View tested skill' }).click();
  });
  await capture('sandboxed-preview', { width: 1440, height: 900 }, async (page) => {
    await page.goto(base);
    await page.locator('#run-grid [data-run-card]').first().getByRole('button', { name: 'Open live preview' }).click();
  });
  await capture('mobile-run-explorer', { width: 390, height: 844 }, async (page) => {
    await page.goto(`${base}/#run-explorer`);
    await page.locator('#run-explorer').scrollIntoViewIfNeeded();
  });
  const chromiumVersion = browser.version();
  await writeFile(resolve(outputRoot, 'capture-metadata.json'), `${JSON.stringify({ captureType: 'showcase-acceptance', captureTool: `Playwright 1.61.1; Chromium ${chromiumVersion}`, records }, null, 2)}\n`, 'utf8');
  console.log(`ACCEPTANCE CAPTURE PASS records=${records.length} chromium=${chromiumVersion}`);
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
}

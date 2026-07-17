import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';
import { sha256File } from './lib/publication.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const baseURL = 'http://127.0.0.1:4174';
const variants = [
  { variant: 'desktop', width: 1440, height: 900 },
  { variant: 'mobile', width: 390, height: 844 }
];

const data = JSON.parse(await readFile(resolve(root, 'data', 'benchmark.json'), 'utf8'));
const copyMap = JSON.parse(await readFile(resolve(root, 'evidence', 'audit', 'showcase-copy-map.json'), 'utf8'));
const sourceEntries = copyMap.files.filter((entry) => entry.kind === 'sanitized-run-artifact');

async function assertSourcesUnchanged() {
  for (const entry of sourceEntries) {
    const hash = await sha256File(resolve(root, entry.destinationPath));
    if (hash !== entry.sha256) throw new Error(`Copied implementation changed: ${entry.destinationPath}`);
  }
}

await assertSourcesUnchanged();
const server = await startServer({ root, port: 4174 });
const browser = await chromium.launch({ headless: true });
const browserVersion = browser.version();
const records = [];

try {
  for (const run of data.runs) {
    for (const item of variants) {
      const captureViewport = { width: item.width, height: item.height };
      const relativePath = `assets/screenshots/derived/${run.id}/${item.variant}.png`;
      const record = {
        provenance: 'publication-time-derived-capture',
        label: 'Publication-time derived capture',
        sourceRunId: run.id,
        capturedFrom: run.previewPath,
        variant: item.variant,
        captureViewport,
        capturedAt: null,
        captureTool: `Playwright 1.61.1; Chromium ${browserVersion}`,
        capturePolicy: {
          waitStrategy: 'domcontentloaded-load-fonts-two-raf-500ms-v1',
          deviceScaleFactor: 1,
          colorScheme: 'light',
          reducedMotion: 'reduce',
          locale: 'en-US',
          timezoneId: 'UTC',
          format: 'png',
          fullPage: false,
          initialInteraction: 'none'
        },
        path: null,
        failureReason: null,
        status: 'pending',
        sourceModified: false
      };
      let context = null;
      let captureError = null;
      const output = resolve(root, relativePath);
      try {
        context = await browser.newContext({
          viewport: captureViewport,
          deviceScaleFactor: 1,
          colorScheme: 'light',
          reducedMotion: 'reduce',
          locale: 'en-US',
          timezoneId: 'UTC'
        });
        const page = await context.newPage();
        const loadDeadline = Date.now() + 30_000;
        await page.goto(`${baseURL}/${run.previewPath}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        const remainingLoadTime = Math.max(1, loadDeadline - Date.now());
        await page.waitForLoadState('load', { timeout: remainingLoadTime });
        await page.evaluate(() => Promise.race([
          document.fonts?.ready ?? Promise.resolve(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Font readiness timed out')), 10_000))
        ]));
        await page.evaluate(() => new Promise((resolveFrames) => requestAnimationFrame(() => requestAnimationFrame(resolveFrames))));
        await page.waitForTimeout(500);
        await mkdir(dirname(output), { recursive: true });
        await page.screenshot({ path: output, type: 'png', fullPage: false });
        record.path = relativePath;
      } catch (error) {
        captureError = error;
      } finally {
        if (context) {
          try { await context.close(); }
          catch (error) { captureError ||= error; }
        }
      }
      if (captureError) {
        await rm(output, { force: true });
        record.path = null;
        record.status = 'failed';
        record.failureReason = `${captureError.name}: ${captureError.message}`.split('\n')[0];
      } else {
        record.capturedAt = new Date().toISOString();
        record.status = 'captured';
      }
      records.push(record);
      console.log(`${record.status.toUpperCase()} ${run.id} ${item.variant}`);
    }
  }
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
}

await assertSourcesUnchanged();
await writeFile(resolve(root, 'data', 'capture-provenance.json'), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
const failures = records.filter((record) => record.status === 'failed');
console.log(`CAPTURE ${failures.length ? 'FAIL' : 'PASS'} runs=${data.runs.length} desktop=${records.filter((record) => record.variant === 'desktop' && record.path).length} mobile=${records.filter((record) => record.variant === 'mobile' && record.path).length} failures=${failures.length}`);
if (failures.length) process.exitCode = 1;

import { readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const template = await readFile(resolve(root, 'templates', 'social-preview.template.html'), 'utf8');
const paths = [
  'assets/screenshots/derived/case-01-new-skill-luna-xhigh/desktop.png',
  'assets/screenshots/derived/case-01-no-skill-sol-high/desktop.png',
  'assets/screenshots/derived/case-02-new-skill-terra-xhigh/desktop.png',
  'assets/screenshots/derived/case-03-no-skill-luna-xhigh/desktop.png'
];
let html = template;
for (const [index, path] of paths.entries()) {
  const encoded = (await readFile(resolve(root, ...path.split('/')))).toString('base64');
  html = html.replace(`{{IMAGE_${index + 1}}}`, `data:image/png;base64,${encoded}`);
}
if (/\{\{IMAGE_\d+\}\}/.test(html)) throw new Error('Social preview template has unresolved image markers');
const output = resolve(root, 'assets', 'social', 'benchmark-preview.png');
await mkdir(dirname(output), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, type: 'png', fullPage: false, animations: 'disabled' });
} finally {
  await browser.close();
}
console.log('SOCIAL PASS width=1200 height=630 sources=4 provenance=publication-time-derived-capture');

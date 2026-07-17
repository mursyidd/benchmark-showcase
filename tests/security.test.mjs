import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('preview controls never link directly to raw run HTML', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.doesNotMatch(html, /href=["'][^"']*runs\/[^"']*\/index\.html/);
});

test('preview implementation uses the exact sandbox without same-origin', async () => {
  const source = await readFile('js/preview-controller.js', 'utf8');
  assert.match(source, /allow-scripts allow-forms allow-modals/);
  assert.doesNotMatch(source, /allow-same-origin|allow-top-navigation/);
  assert.doesNotMatch(source, /[?&](url|src)=|searchParams/);
});

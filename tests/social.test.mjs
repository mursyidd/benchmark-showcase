import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('social preview is a 1200 by 630 PNG', async () => {
  const png = await readFile('assets/social/benchmark-preview.png');
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('social template uses the exact derived-capture provenance label', async () => {
  const template = await readFile('templates/social-preview.template.html', 'utf8');
  assert.equal(template.match(/Publication-time derived capture/g)?.length, 4);
  assert.doesNotMatch(template, /Publication-time capture/);
  assert.match(template, /Transparent evidence archive/);
  assert.match(template, /No rankings · No superiority claims/);
});

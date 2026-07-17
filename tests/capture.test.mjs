import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

function pngDimensions(buffer) {
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('every run has exact desktop and mobile derived captures', async () => {
  const records = JSON.parse(await readFile('data/capture-provenance.json', 'utf8'));
  assert.equal(records.length, 36);
  assert.equal(new Set(records.map((record) => `${record.sourceRunId}:${record.variant}`)).size, 36);
  for (const record of records) {
    assert.equal(record.provenance, 'publication-time-derived-capture');
    assert.equal(record.status, 'captured');
    assert.equal(record.failureReason, null);
    assert.equal(record.sourceModified, false);
    assert.equal(record.capturePolicy.waitStrategy, 'domcontentloaded-load-fonts-two-raf-500ms-v1');
    assert.ok(record.path && existsSync(record.path));
    assert.ok(record.capturedAt && !Number.isNaN(Date.parse(record.capturedAt)));
    const dimensions = pngDimensions(await readFile(record.path));
    assert.deepEqual(dimensions, record.captureViewport);
    assert.deepEqual(dimensions, record.variant === 'desktop' ? { width: 1440, height: 900 } : { width: 390, height: 844 });
  }
});

test('capture script uses deterministic document readiness', async () => {
  const source = await readFile('scripts/capture-runs.mjs', 'utf8');
  assert.doesNotMatch(source, new RegExp(`network${'idle'}`, 'i'));
  assert.match(source, /domcontentloaded/);
  assert.match(source, /document\.fonts/);
  assert.match(source, /requestAnimationFrame/);
});

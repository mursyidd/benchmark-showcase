import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

async function loadData() { return JSON.parse(await readFile('data/benchmark.json', 'utf8')); }

test('dataset represents every run once without embedding canonical contents', async () => {
  const data = await loadData();
  assert.equal(data.runs.length, 18);
  assert.equal(new Set(data.runs.map((run) => run.id)).size, 18);
  assert.equal(data.prompts.length, 6);
  assert.equal(data.prompts.every((prompt) => !('content' in prompt)), true);
  assert.equal('content' in data.skill, false);
  assert.equal(data.runs.filter((run) => run.skillPath !== null).length, 9);
});

test('every allowlisted source file has a verified SHA-256 checksum', async () => {
  const data = await loadData();
  for (const run of data.runs) for (const source of run.sourceFiles) {
    assert.equal(source.checksumAlgorithm, 'sha256');
    assert.match(source.checksum, /^[a-f0-9]{64}$/);
  }
});

test('dataset distinguishes original artifacts from original-evidence run coverage', async () => {
  const data = await loadData();
  const captures = JSON.parse(await readFile('data/capture-provenance.json', 'utf8'));
  const successful = captures.filter((record) => record.path);
  const coveredRuns = new Set(data.runs.filter((run) => run.derivedCaptures.desktop?.path && run.derivedCaptures.mobile?.path).map((run) => run.id));
  assert.equal(data.screenshotEvidenceSummary.originalScreenshotArtifactCount, 15);
  assert.equal(data.screenshotEvidenceSummary.runsWithOriginalScreenshotEvidenceCount, 1);
  assert.equal(data.screenshotEvidenceSummary.standardizedDerivedCaptureCount, successful.length);
  assert.equal(data.screenshotEvidenceSummary.runsWithStandardizedDerivedCaptureCoverageCount, coveredRuns.size);
});

test('model configurations and prompt mappings are exact', async () => {
  const data = await loadData();
  assert.deepEqual(data.models.map((model) => model.label), ['Luna xHigh', 'Sol High', 'Terra xHigh']);
  for (const run of data.runs) {
    assert.equal(data.prompts.find((prompt) => prompt.id === run.promptId).usedByRuns.includes(run.id), true);
    assert.equal(run.conditionId === 'new-skill', run.skillPath !== null);
    assert.equal(existsSync(run.previewPath), true);
    assert.equal(existsSync(run.evidencePath), true);
    assert.equal(existsSync(run.summaryPath), true);
    for (const file of run.sourceFiles) assert.equal(existsSync(file.path), true);
    for (const screenshot of run.originalScreenshots) assert.equal(existsSync(screenshot.path), true);
  }
  const cells = new Map();
  for (const run of data.runs) {
    const key = `${run.caseId}:${run.conditionId}`;
    cells.set(key, [...(cells.get(key) || []), run.modelId]);
  }
  assert.equal(cells.size, 6);
  for (const modelIds of cells.values()) assert.deepEqual(modelIds.sort(), ['luna-xhigh', 'sol-high', 'terra-xhigh']);
});

test('capture provenance contains 36 explicit run-variant slots', async () => {
  const records = JSON.parse(await readFile('data/capture-provenance.json', 'utf8'));
  assert.equal(records.length, 36);
  assert.equal(new Set(records.map((record) => `${record.sourceRunId}:${record.variant}`)).size, 36);
  const statuses = new Set(records.map((record) => record.status));
  assert.equal([...statuses].every((status) => ['pending', 'captured', 'failed'].includes(status)), true);
  for (const record of records) assert.equal(record.sourceModified, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import {
  assertUniqueFindingIds,
  createMissingFragmentFinding,
  findBrokenFragments,
  mergeReviewDecisions
} from '../scripts/lib/findings.mjs';

const rationale = 'Confirmed against the finalized generated output. Defect intentionally retained as archival evidence.';

function sampleFinding() {
  return createMissingFragmentFinding(
    { id: 'case-02-new-skill-luna-xhigh', previewPath: 'runs/case-02/new-skill/luna-xhigh/index.html' },
    '<nav><a href="#preferences">Preferences</a><a href="#service-health">Health</a></nav>'
  );
}

function decisionFor(finding, overrides = {}) {
  return {
    findingId: finding.id,
    detectorId: finding.detectorId,
    evidenceFingerprint: finding.evidenceFingerprint,
    status: 'human-review-verified-for-archive',
    reviewedAt: '2026-07-15T14:06:42Z',
    rationale,
    ...overrides
  };
}

test('missing-fragment detection aggregates one finding per run with a semantic ID and deterministic fingerprint', () => {
  const finding = sampleFinding();
  assert.equal(finding.id, 'finding-missing-fragment-target-case-02-new-skill-luna-xhigh');
  assert.equal(finding.detectorId, 'missing-fragment-target');
  assert.deepEqual(finding.targets, ['preferences', 'service-health']);
  assert.equal(finding.occurrenceCount, 2);
  assert.equal(finding.evidenceFingerprint, 'sha256:7e33d47a4fba9b9063f15aeb65c83444234d987bfd999284137b22e827114ef1');
});

test('review decisions apply only on exact ID, detector, and evidence fingerprint matches', () => {
  const finding = sampleFinding();
  const pending = mergeReviewDecisions([finding], { schemaVersion: 1, decisions: [] });
  assert.equal(pending[0].reviewStatus, 'human-review-required');
  assert.equal(pending[0].reviewedAt, null);
  const verified = mergeReviewDecisions([finding], { schemaVersion: 1, decisions: [decisionFor(finding)] });
  assert.equal(verified[0].reviewStatus, 'human-review-verified-for-archive');
  assert.equal(verified[0].reviewRationale, rationale);
});

test('stale, unknown, duplicate, malformed, and deprecated review decisions fail explicitly', () => {
  const finding = sampleFinding();
  const doc = (decision) => ({ schemaVersion: 1, decisions: [decision] });
  assert.throws(() => mergeReviewDecisions([finding], doc(decisionFor(finding, {
    evidenceFingerprint: `sha256:${'0'.repeat(64)}`
  }))), /Stale review decision/);
  assert.throws(() => mergeReviewDecisions([finding], doc(decisionFor(finding, {
    findingId: 'finding-missing-fragment-target-unknown-run'
  }))), /Unknown review decision/);
  assert.throws(() => mergeReviewDecisions([finding], {
    schemaVersion: 1,
    decisions: [decisionFor(finding), decisionFor(finding)]
  }), /Duplicate review decision/);
  assert.throws(() => mergeReviewDecisions([finding], doc(decisionFor(finding, {
    evidenceFingerprint: 'sha256:not-a-hash'
  }))), /Malformed review fingerprint/);
  assert.throws(() => mergeReviewDecisions([finding], doc(decisionFor(finding, {
    status: 'human-review-approved'
  }))), /Invalid review status/);
});

test('duplicate semantic finding IDs fail generation', () => {
  const finding = sampleFinding();
  assert.throws(() => assertUniqueFindingIds([finding, { ...finding }]), /Duplicate detected finding ID/);
});

test('every generated finding is traceable, verified for archive, and still present in preserved output', async () => {
  const data = JSON.parse(await readFile('data/benchmark.json', 'utf8'));
  const findings = JSON.parse(await readFile('data/findings.json', 'utf8'));
  const decisions = JSON.parse(await readFile('evidence/findings-review-decisions.json', 'utf8'));
  const runIds = new Set(data.runs.map((run) => run.id));
  assert.equal(findings.length, 6);
  assert.equal(decisions.decisions.length, 6);
  for (const finding of findings) {
    assert.match(finding.id, /^finding-missing-fragment-target-case-/);
    assert.equal(runIds.has(finding.runId), true);
    assert.equal(existsSync(finding.sourcePath), true);
    assert.equal(finding.sourcePath.startsWith('evidence/'), true);
    assert.equal(existsSync(finding.artifactPath), true);
    assert.equal(finding.detectorId, 'missing-fragment-target');
    assert.match(finding.evidenceFingerprint, /^sha256:[a-f0-9]{64}$/);
    assert.equal(finding.severity, null);
    assert.equal(finding.classificationStatus, 'editorially-normalized');
    assert.equal(finding.reviewStatus, 'human-review-verified-for-archive');
    assert.equal(finding.reviewRationale, rationale);
    const source = await readFile(finding.sourcePath, 'utf8');
    assert.match(source, new RegExp(`^## ${finding.sourceSection}$`, 'm'));
    const html = await readFile(finding.artifactPath, 'utf8');
    const broken = findBrokenFragments(html);
    assert.equal(finding.occurrenceCount, broken.occurrences);
    assert.equal(finding.uniqueTargetCount, broken.targets.length);
    assert.deepEqual(finding.targets, broken.targets);
  }
  assert.equal(findings.reduce((sum, finding) => sum + finding.occurrenceCount, 0), 19);
});

test('semantic finding IDs are joined to runs and the generated ledger records archival verification', async () => {
  const data = JSON.parse(await readFile('data/benchmark.json', 'utf8'));
  const findings = JSON.parse(await readFile('data/findings.json', 'utf8'));
  const joined = data.runs.flatMap((run) => run.findingIds);
  assert.deepEqual(joined.sort(), findings.map((finding) => finding.id).sort());
  const review = await readFile('evidence/findings-review.md', 'utf8');
  assert.match(review, /Archival findings review complete/);
  assert.match(review, /not the quality, correctness, or product acceptance/);
  for (const finding of findings) {
    assert.equal(review.split(finding.id).length - 1, 1);
    assert.match(review, new RegExp(finding.evidenceFingerprint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});


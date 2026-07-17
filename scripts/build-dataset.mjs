import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File } from './lib/publication.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const evidenceManifestPath = resolve(root, 'evidence', 'benchmark-manifest.json');

const cases = [
  { id: 'case-01', number: 1, name: 'Creative landing page', shortName: 'Creative Landing', purpose: 'A public-facing creative product landing page with responsive interaction requirements.' },
  { id: 'case-02', number: 2, name: 'Operational dashboard', shortName: 'Operational Dashboard', purpose: 'A dense operational interface for monitoring and controlling agent work.' },
  { id: 'case-03', number: 3, name: 'Settings form', shortName: 'Settings Form', purpose: 'A stateful account settings experience with validation and save feedback.' }
];

const models = [
  { id: 'luna-xhigh', name: 'Luna', reasoningLevel: 'xhigh', label: 'Luna xHigh' },
  { id: 'sol-high', name: 'Sol', reasoningLevel: 'high', label: 'Sol High' },
  { id: 'terra-xhigh', name: 'Terra', reasoningLevel: 'xhigh', label: 'Terra xHigh' }
];

const conditions = [
  { id: 'new-skill', label: 'New Skill', skillLoaded: true },
  { id: 'no-skill', label: 'No Skill', skillLoaded: false }
];

function caseId(value) { return `case-${String(value).padStart(2, '0')}`; }
function modelId(run) { return `${run.model.toLowerCase()}-${run.reasoningLevel.toLowerCase()}`; }
function copiedRunRoot(run) { return `runs/${caseId(run.case)}/${run.condition}/${modelId(run)}`; }

async function readCaptures() {
  try {
    const records = JSON.parse(await readFile(resolve(root, 'data', 'capture-provenance.json'), 'utf8'));
    return records.some((record) => record.status !== 'pending') ? records : [];
  }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function readFindings() {
  try { return JSON.parse(await readFile(resolve(root, 'data', 'findings.json'), 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const manifest = JSON.parse(await readFile(evidenceManifestPath, 'utf8'));
const captures = await readCaptures();
const findings = await readFindings();
const caseByNumber = new Map(cases.map((item) => [item.number, item]));
const modelById = new Map(models.map((item) => [item.id, item]));
const conditionById = new Map(conditions.map((item) => [item.id, item]));

const prompts = await Promise.all(manifest.prompts.map(async (prompt) => ({
  id: prompt.id,
  caseId: caseId(prompt.case),
  conditionId: prompt.condition,
  label: `${caseByNumber.get(prompt.case).shortName} — ${conditionById.get(prompt.condition).label}`,
  path: prompt.publicPath,
  checksumAlgorithm: prompt.publishedChecksumAlgorithm,
  checksum: prompt.publishedChecksum,
  verificationStatus: prompt.verificationStatus,
  sanitized: prompt.sanitized,
  skillLoadedSeparately: Boolean(prompt.skillPath),
  usedByRuns: [...prompt.usedByRuns]
})));

const runs = await Promise.all(manifest.runs.map(async (run) => {
  const runRoot = copiedRunRoot(run);
  const rawFiles = await Promise.all((run.rawArtifacts || []).map(async (artifact) => {
    const suffix = posix.relative(run.rawPath, artifact.publicPath);
    const path = `${runRoot}/${suffix}`;
    return { name: posix.basename(suffix), path, checksumAlgorithm: 'sha256', checksum: await sha256File(resolve(root, ...path.split('/'))) };
  }));
  const originalScreenshots = (run.screenshots || []).map((screenshot) => {
    const suffix = posix.relative(run.rawPath, screenshot.publicPath);
    return {
      path: `${runRoot}/${suffix}`,
      provenance: 'original-benchmark-evidence',
      label: 'Original benchmark screenshot',
      sourceRunId: run.runId
    };
  });
  const runCaptures = captures.filter((capture) => capture.sourceRunId === run.runId);
  const captureFor = (variant) => runCaptures.find((capture) => capture.variant === variant) || null;
  const caseRecord = caseByNumber.get(run.case);
  const modelRecord = modelById.get(modelId(run));
  const conditionRecord = conditionById.get(run.condition);
  return {
    id: run.runId,
    caseId: caseRecord.id,
    caseName: caseRecord.name,
    modelId: modelRecord.id,
    modelLabel: modelRecord.label,
    conditionId: conditionRecord.id,
    conditionLabel: conditionRecord.label,
    promptId: run.promptId,
    skillPath: run.condition === 'new-skill' ? 'inputs/skill/SKILL.md' : null,
    previewPath: `${runRoot}/index.html`,
    evidencePath: `${runRoot}/${posix.basename(run.runNotesPath)}`,
    runNotesPath: `${runRoot}/${posix.basename(run.runNotesPath)}`,
    summaryPath: `evidence/summaries/${posix.basename(run.summaryPath)}`,
    sourceDirectoryPath: `${runRoot}/`,
    sourceFiles: rawFiles,
    durationSeconds: run.recordedIndividualDuration ?? null,
    batchDurationSeconds: run.recordedBatchDuration ?? null,
    durationDisplay: run.recordedIndividualDuration == null ? null : `${Math.round(run.recordedIndividualDuration)} seconds`,
    timingCaveat: run.timingCaveat ?? null,
    selfReportedStatus: null,
    derivedCaptures: { desktop: captureFor('desktop'), mobile: captureFor('mobile') },
    originalScreenshots,
    findingIds: findings.filter((finding) => finding.runId === run.runId).map((finding) => finding.id)
  };
}));

const originalScreenshotArtifactCount = runs.reduce((sum, run) => sum + run.originalScreenshots.length, 0);
const runsWithOriginalScreenshotEvidenceCount = runs.filter((run) => run.originalScreenshots.length > 0).length;
const successfulCaptures = captures.filter((capture) => capture.path);
const coveredRuns = new Set(runs.filter((run) => run.derivedCaptures.desktop?.path && run.derivedCaptures.mobile?.path).map((run) => run.id));

const data = {
  schemaVersion: 1,
  benchmark: {
    title: 'Frontend Benchmark Evidence Archive',
    description: 'A transparent archive of 18 frontend generation runs; not a controlled study, model ranking, or superiority claim.',
    caseCount: 3,
    modelCount: 3,
    conditionCount: 2,
    runCount: 18,
    promptCount: 6
  },
  screenshotEvidenceSummary: {
    originalScreenshotArtifactCount,
    runsWithOriginalScreenshotEvidenceCount,
    standardizedDerivedCaptureCount: successfulCaptures.length,
    runsWithStandardizedDerivedCaptureCoverageCount: coveredRuns.size
  },
  models,
  conditions,
  cases,
  skill: {
    name: manifest.skill.name,
    path: 'inputs/skill/SKILL.md',
    verificationStatus: manifest.skill.verificationStatus,
    sanitized: manifest.skill.sanitized,
    checksumAlgorithm: manifest.skill.publishedChecksumAlgorithm,
    checksum: manifest.skill.publishedChecksum,
    usedByCondition: manifest.skill.usedByCondition,
    excludedFromCondition: manifest.skill.excludedFromCondition
  },
  prompts,
  runs,
  findingsPath: 'data/findings.json',
  captureProvenancePath: 'data/capture-provenance.json',
  evidence: {
    manifestPath: 'evidence/benchmark-manifest.json',
    publicationReadmePath: 'evidence/README.md',
    sanitizationReportPath: 'evidence/audit/sanitization-report.md',
    excludedArtifactsPath: 'evidence/audit/excluded-artifacts.md',
    copyMapPath: 'evidence/audit/showcase-copy-map.json'
  }
};

await mkdir(resolve(root, 'data'), { recursive: true });
await writeFile(resolve(root, 'data', 'benchmark.json'), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
if (!captures.length) {
  const pendingCaptures = runs.flatMap((run) => [
    { provenance: 'publication-time-derived-capture', sourceRunId: run.id, capturedFrom: run.previewPath, variant: 'desktop', captureViewport: { width: 1440, height: 900 }, path: null, failureReason: null, status: 'pending', sourceModified: false },
    { provenance: 'publication-time-derived-capture', sourceRunId: run.id, capturedFrom: run.previewPath, variant: 'mobile', captureViewport: { width: 390, height: 844 }, path: null, failureReason: null, status: 'pending', sourceModified: false }
  ]);
  await writeFile(resolve(root, 'data', 'capture-provenance.json'), `${JSON.stringify(pendingCaptures, null, 2)}\n`, 'utf8');
}
console.log(`DATASET PASS runs=${runs.length} prompts=${prompts.length} originalArtifacts=${originalScreenshotArtifactCount} originalRuns=${runsWithOriginalScreenshotEvidenceCount} derived=${successfulCaptures.length}`);

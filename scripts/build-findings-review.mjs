import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMissingFragmentFinding, mergeReviewDecisions } from './lib/findings.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const dataPath = resolve(root, 'data', 'benchmark.json');
const findingsPath = resolve(root, 'data', 'findings.json');
const reviewPath = resolve(root, 'evidence', 'findings-review.md');
const decisionsPath = resolve(root, 'evidence', 'findings-review-decisions.json');
const auditPath = 'evidence/audit/sanitization-report.md';

const data = JSON.parse(await readFile(dataPath, 'utf8'));
const audit = await readFile(resolve(root, auditPath), 'utf8');
const decisions = JSON.parse(await readFile(decisionsPath, 'utf8'));
if (!audit.includes('broken fragment anchors') || !audit.includes('original model-output defects')) {
  throw new Error('Audit source no longer supports broken-fragment normalization');
}

const detected = [];
for (const run of data.runs) {
  const html = await readFile(resolve(root, run.previewPath), 'utf8');
  const finding = createMissingFragmentFinding(run, html, { sourcePath: auditPath });
  if (finding) detected.push(finding);
}

const findings = mergeReviewDecisions(detected, decisions);

await writeFile(findingsPath, `${JSON.stringify(findings, null, 2)}\n`, 'utf8');
for (const run of data.runs) run.findingIds = findings.filter((finding) => finding.runId === run.id).map((finding) => finding.id);
await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

const rows = findings.map((finding) => `| ${finding.id} | ${finding.runId} | ${finding.detectorId} | ${finding.summary} | ${finding.targets.map((target) => `\`#${target}\``).join(', ')} | \`${finding.evidenceFingerprint}\` | [Audit source](${finding.sourcePath.replace(/^evidence\//, '')}) — ${finding.sourceSection} | \`${finding.artifactPath}\` | ${finding.reviewStatus} | ${finding.reviewedAt ?? ''} | ${finding.reviewRationale ?? ''} |`).join('\n');
const unresolved = findings.filter((finding) => finding.reviewStatus !== 'human-review-verified-for-archive');
const releaseLine = unresolved.length
  ? `**ARCHIVAL PUBLICATION BLOCKED: ${unresolved.length} findings lack matching verification for archive.**`
  : '**Archival findings review complete. The verified defects remain intentionally unchanged as preserved evidence.**';
const review = `# Findings Review\n\nThese entries are archival metadata derived from deterministic checks of finalized generated outputs. Human verification confirms the defect evidence and description, not the quality, correctness, or product acceptance of an interface or implementation.\n\n| ID | Run | Detector | Summary | Targets | Evidence fingerprint | Source | Artifact locator | Review status | Reviewed at | Human decision |\n|---|---|---|---|---|---|---|---|---|---|---|\n${rows || '| — | — | — | No eligible findings were detected. | — | — | — | — | — | — | — |'}\n\n${releaseLine}\n`;
await writeFile(reviewPath, review, 'utf8');
console.log(`FINDINGS PASS entries=${findings.length} verified=${findings.filter((finding) => finding.reviewStatus === 'human-review-verified-for-archive').length} required=${findings.filter((finding) => finding.reviewStatus === 'human-review-required').length} rejected=${findings.filter((finding) => finding.reviewStatus === 'human-review-rejected').length}`);

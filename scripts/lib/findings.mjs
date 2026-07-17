import { createHash } from 'node:crypto';

export const MISSING_FRAGMENT_DETECTOR_ID = 'missing-fragment-target';
export const FINGERPRINT_SCHEMA_VERSION = 1;

const decisionStatuses = new Set([
  'human-review-verified-for-archive',
  'human-review-rejected'
]);
const decisionFields = new Set([
  'findingId',
  'detectorId',
  'evidenceFingerprint',
  'status',
  'reviewedAt',
  'reviewer',
  'rationale'
]);

function decodeFragment(value) {
  try { return decodeURIComponent(value); }
  catch { return value; }
}

export function findBrokenFragments(html) {
  const ids = new Set();
  for (const match of html.matchAll(/\s(?:id|name)\s*=\s*["']([^"']+)["']/gi)) ids.add(match[1]);
  const missing = [];
  for (const match of html.matchAll(/href\s*=\s*["']#([^"']+)["']/gi)) {
    const fragment = decodeFragment(match[1]);
    if (fragment && !ids.has(fragment)) missing.push(fragment);
  }
  return {
    occurrences: missing.length,
    targets: [...new Set(missing)].sort((a, b) => a.localeCompare(b))
  };
}

export function createMissingFragmentFinding(run, html, {
  sourcePath = 'evidence/audit/sanitization-report.md',
  sourceSection = 'Reference and integrity decisions'
} = {}) {
  const broken = findBrokenFragments(html);
  if (!broken.occurrences) return null;
  const finding = {
    id: `finding-${MISSING_FRAGMENT_DETECTOR_ID}-${run.id}`,
    detectorId: MISSING_FRAGMENT_DETECTOR_ID,
    runId: run.id,
    category: 'functional-defect',
    severity: null,
    summary: `The finalized implementation contains ${broken.occurrences} fragment link occurrence${broken.occurrences === 1 ? '' : 's'} without matching target IDs.`,
    detail: `${broken.occurrences} broken references target ${broken.targets.length} unique missing ID${broken.targets.length === 1 ? '' : 's'}: ${broken.targets.map((fragment) => `#${fragment}`).join(', ')}.`,
    targets: broken.targets,
    occurrenceCount: broken.occurrences,
    uniqueTargetCount: broken.targets.length,
    sourcePath,
    sourceSection,
    artifactPath: run.previewPath,
    classificationStatus: 'editorially-normalized'
  };
  return { ...finding, evidenceFingerprint: fingerprintFindingEvidence(finding) };
}

export function canonicalFindingEvidence(finding) {
  return {
    fingerprintSchemaVersion: FINGERPRINT_SCHEMA_VERSION,
    detectorId: finding.detectorId,
    runId: finding.runId,
    artifactPath: String(finding.artifactPath).replaceAll('\\', '/'),
    category: finding.category,
    targets: [...new Set(finding.targets)].sort((a, b) => a.localeCompare(b)),
    occurrenceCount: finding.occurrenceCount
  };
}

export function fingerprintFindingEvidence(finding) {
  const canonical = JSON.stringify(canonicalFindingEvidence(finding));
  return `sha256:${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}

export function assertUniqueFindingIds(findings) {
  const seen = new Set();
  for (const finding of findings) {
    if (seen.has(finding.id)) throw new Error(`Duplicate detected finding ID: ${finding.id}`);
    seen.add(finding.id);
  }
}

function assertIsoUtc(value, findingId) {
  if (typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)
    || Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid review timestamp for ${findingId}`);
  }
}

export function validateReviewDecisionDocument(document, findings) {
  if (!document || document.schemaVersion !== 1 || !Array.isArray(document.decisions)) {
    throw new Error('Findings review decisions must use schemaVersion 1 with a decisions array');
  }
  assertUniqueFindingIds(findings);
  const findingsById = new Map(findings.map((finding) => [finding.id, finding]));
  const decisionsById = new Map();
  for (const decision of document.decisions) {
    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
      throw new Error('Findings review decision must be an object');
    }
    const unexpected = Object.keys(decision).filter((field) => !decisionFields.has(field));
    if (unexpected.length) throw new Error(`Unknown review decision field for ${decision.findingId || 'unknown finding'}: ${unexpected.join(', ')}`);
    if (typeof decision.findingId !== 'string' || !decision.findingId.startsWith('finding-')) {
      throw new Error('Review decision has an invalid findingId');
    }
    if (decisionsById.has(decision.findingId)) throw new Error(`Duplicate review decision: ${decision.findingId}`);
    const finding = findingsById.get(decision.findingId);
    if (!finding) throw new Error(`Unknown review decision: ${decision.findingId}`);
    if (decision.detectorId !== finding.detectorId) throw new Error(`Review detector mismatch: ${decision.findingId}`);
    if (typeof decision.evidenceFingerprint !== 'string'
      || !/^sha256:[a-f0-9]{64}$/.test(decision.evidenceFingerprint)) {
      throw new Error(`Malformed review fingerprint: ${decision.findingId}`);
    }
    const currentFingerprint = fingerprintFindingEvidence(finding);
    if (decision.evidenceFingerprint !== currentFingerprint
      || finding.evidenceFingerprint !== currentFingerprint) {
      throw new Error(`Stale review decision: ${decision.findingId} no longer matches detected evidence.`);
    }
    if (!decisionStatuses.has(decision.status)) throw new Error(`Invalid review status: ${decision.findingId}`);
    assertIsoUtc(decision.reviewedAt, decision.findingId);
    for (const field of ['reviewer', 'rationale']) {
      if (decision[field] != null && (typeof decision[field] !== 'string' || !decision[field].trim())) {
        throw new Error(`Invalid ${field} for ${decision.findingId}`);
      }
    }
    decisionsById.set(decision.findingId, decision);
  }
  return decisionsById;
}

export function mergeReviewDecisions(findings, document) {
  const decisionsById = validateReviewDecisionDocument(document, findings);
  return findings.map((finding) => {
    const decision = decisionsById.get(finding.id);
    return {
      ...finding,
      reviewStatus: decision?.status ?? 'human-review-required',
      reviewedAt: decision?.reviewedAt ?? null,
      reviewer: decision?.reviewer ?? null,
      reviewRationale: decision?.rationale ?? null
    };
  });
}


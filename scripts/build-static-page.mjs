import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDir, '..');

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function replaceRequired(template, marker, value) {
  if (!template.includes(marker)) throw new Error(`Template marker missing: ${marker}`);
  return template.replace(marker, value);
}

function renderMetrics() {
  return [[18, 'Finalized runs'], [3, 'Test cases'], [3, 'Model configs'], [2, 'Conditions'], [6, 'Exact prompts'], [1, 'Tested skill']]
    .map(([value, label]) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`).join('');
}

function renderRunCard(data, run, { includeId = true } = {}) {
  const capture = run.derivedCaptures.desktop;
  const prompt = data.prompts.find((item) => item.id === run.promptId);
  const media = capture?.path
    ? `<a href="${escapeHtml(capture.path)}"><img src="${escapeHtml(capture.path)}" alt="${escapeHtml(`${run.caseName}, ${run.modelLabel}, ${run.conditionLabel} — publication-time derived desktop capture`)}" loading="lazy" width="1440" height="900"></a>`
    : capture?.failureReason
      ? `<p class="empty-state">Capture unavailable · ${escapeHtml(capture.failureReason)}</p>`
      : '<p class="empty-state">Capture record missing</p>';
  const id = includeId ? ` id="run=${escapeHtml(run.id)}"` : '';
  return `<article${id} class="run-card" data-static-run-card data-run-id="${escapeHtml(run.id)}"><div class="run-card-media">${media}</div><div class="run-card-body"><span class="condition-badge">${escapeHtml(run.conditionLabel)}</span><h3>${escapeHtml(run.modelLabel)}</h3><p>${escapeHtml(run.caseName)}</p><p class="run-id">${escapeHtml(run.id)}</p><div class="run-stats"><div class="run-stat"><b>Recorded duration</b><span>${escapeHtml(run.durationDisplay || 'Not recorded')}</span></div><div class="run-stat"><b>Findings</b><span>${run.findingIds.length}</span></div></div><details class="timing-caveat"><summary>Timing caveat</summary><p>${escapeHtml(run.timingCaveat || 'No timing caveat recorded.')}</p></details><span class="provenance-note">Publication-time derived capture</span><div class="card-actions"><a href="${escapeHtml(capture?.path || run.evidencePath)}">View desktop capture</a><a href="${escapeHtml(prompt.path)}">Exact prompt</a><a href="${escapeHtml(run.evidencePath)}">Run evidence</a></div></div></article>`;
}

function renderCases(data) {
  return `<div class="case-card-grid">${data.cases.map((item) => `<article class="case-card"><span class="case-index">${String(item.number).padStart(2, '0')}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.purpose)}</p><p class="run-id">6 runs · 3 model configurations · 2 conditions</p></article>`).join('')}</div>`;
}

function renderPromptCards(data) {
  return data.prompts.map((prompt) => `<article class="prompt-card"><span class="condition-badge">${prompt.conditionId === 'new-skill' ? 'New Skill' : 'No Skill'}</span><h3>${escapeHtml(prompt.label)}</h3><p class="run-id">${escapeHtml(prompt.id)}</p><p>${prompt.skillLoadedSeparately ? 'Exact prompt + tested SKILL.md loaded separately.' : 'Exact prompt + tested SKILL.md not loaded.'}</p><a class="action" href="${escapeHtml(prompt.path)}">Read exact prompt</a></article>`).join('');
}

function renderMethodology(data) {
  const counts = data.screenshotEvidenceSummary;
  const batches = [];
  const seen = new Set();
  for (const run of data.runs) {
    const key = `${run.caseId}:${run.conditionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    batches.push({ label: `${run.caseName} · ${run.conditionLabel}`, seconds: run.batchDurationSeconds });
  }
  const maximum = Math.max(...batches.map((batch) => batch.seconds || 0), 1);
  const timing = batches.map((batch) => `<div class="timing-row"><span>${escapeHtml(batch.label)}</span><meter min="0" max="${maximum}" value="${batch.seconds || 0}" aria-label="${escapeHtml(`${batch.label}: ${batch.seconds == null ? 'Not recorded' : `${Math.round(batch.seconds)} seconds`}`)}"></meter><strong>${batch.seconds == null ? 'Not recorded' : `${Math.round(batch.seconds)} s`}</strong></div>`).join('');
  return `<div class="method-grid"><article class="method-card"><p class="eyebrow">Archive matrix</p><h3>3 × 3 × 2</h3><p>Three task types, three recorded model configurations, and two prompting conditions. Luna and Terra used xHigh reasoning. Sol used High reasoning. These archived runs are not a controlled comparison.</p></article><article class="method-card"><h3>Screenshot provenance</h3><p class="eyebrow">${counts.originalScreenshotArtifactCount} original artifacts · ${counts.standardizedDerivedCaptureCount} derived captures</p><p>The sanitized publication contains 15 original screenshot artifacts belonging to 1 run with original screenshot evidence. The showcase adds 36 standardized publication-time derived captures, providing a consistent archival reference for 18 runs.</p><p>No model was rerun.</p><p>No implementation was regenerated or repaired.</p><p>The publication-time derived captures do not reconstruct the exact original runtime environment. Original benchmark screenshots remain separately labelled where available.</p></article></div><section class="timing-block" aria-labelledby="timing-title"><h3 id="timing-title">Recorded timing</h3><p>Timing records are preserved as execution evidence, not as controlled performance measurements. Individual durations retain manifest caveats: they include orchestration, tool execution, and observation handoff.</p><div class="timing-list">${timing}</div></section>`;
}

function renderLimitations() {
  const items = [
    'Publication-time captures show how the finalized sanitized implementations rendered in the showcase capture environment. They may differ from the exact browser, font, timing, or operating-system conditions present during the original benchmark execution.',
    'This archive is not a controlled scientific experiment, model ranking, or basis for causal or superiority claims.',
    'Luna and Terra used xHigh reasoning while Sol used High reasoning; these are recorded configurations, not matched reasoning levels.',
    'The selected task types are illustrative rather than representative, and model outputs are nondeterministic.',
    'Recorded durations include orchestration and observation caveats and must not be interpreted as controlled performance measurements.'
  ];
  return `<div class="limitations-grid">${items.map((text, index) => `<article class="limitation-card"><p class="eyebrow">Limitation ${String(index + 1).padStart(2, '0')}</p><p>${escapeHtml(text)}</p></article>`).join('')}</div>`;
}

function renderEvidence(data) {
  const items = [['Sanitization-stage integrity assurance', 'The original-to-sanitized relationship is governed by the sanitization report.', data.evidence.sanitizationReportPath], ['Showcase-copy integrity verification', 'Showcase copies match the finalized sanitized publication artifacts from which they were copied.', data.evidence.copyMapPath], ['Derived screenshot generation', 'Standardized screenshots were rendered from finalized sanitized implementations without showcase-time source modification.', data.captureProvenancePath], ['Finalized benchmark manifest', 'The sanitized publication manifest is the source of truth for the 18-run archive matrix.', data.evidence.manifestPath], ['Findings archival-review ledger', 'Human review verifies the evidence and defect descriptions for archival publication; it does not approve the generated interfaces.', 'evidence/findings-review.md']];
  return `<div class="evidence-grid">${items.map(([label, description, path]) => `<article class="evidence-card"><h3>${escapeHtml(label)}</h3><p>${escapeHtml(description)}</p><a href="${escapeHtml(path)}">Open evidence</a></article>`).join('')}</div>`;
}

function renderFindings(findings) {
  const labels = { 'human-review-required': 'Human review required', 'human-review-verified-for-archive': 'Verified for archive', 'human-review-rejected': 'Human review rejected' };
  const pending = findings.some((finding) => finding.reviewStatus !== 'human-review-verified-for-archive');
  const review = pending
    ? '<div class="release-warning" role="status"><strong>Archival review incomplete</strong><p>Publication is blocked until every detected finding has a matching verification decision suitable for the evidence archive.</p></div>'
    : '<div class="release-warning" role="status"><strong>Archival evidence review</strong><p>Human verification confirms the defect evidence and description. It does not approve interface quality, implementation correctness, or product behavior. The verified defects remain intentionally unchanged in the original generated outputs.</p></div>';
  return `${review}<div class="finding-list">${findings.map((finding) => `<article class="finding"><code>${escapeHtml(finding.id)}</code><div><strong>${escapeHtml(finding.summary)}</strong><p>${escapeHtml(finding.detail)}</p><code>${escapeHtml(finding.runId)}</code><p><a href="${escapeHtml(finding.sourcePath)}">${escapeHtml(finding.sourceSection)} — source</a></p></div><div class="finding-badges"><span class="classification-badge">${escapeHtml(finding.classificationStatus)}</span><span class="review-badge">${escapeHtml(labels[finding.reviewStatus] || finding.reviewStatus)}</span></div></article>`).join('')}</div>`;
}

function navigation() {
  const links = [
    ['overview', 'Overview'], ['results', 'Archive'], ['cases', 'Tasks'],
    ['run-explorer', 'Run Explorer'], ['prompts', 'Prompts'], ['tested-skill', 'Tested Skill'],
    ['methodology', 'Archive Context'], ['findings', 'Preserved Findings'], ['limitations', 'Limitations'], ['evidence', 'Evidence']
  ];
  return `<header class="site-header"><a class="wordmark" href="#overview">FB<span>18</span></a><nav aria-label="Report sections"><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Sections</button><ul id="site-nav">${links.map(([id, label]) => `<li><a href="#${id}">${label}</a></li>`).join('')}</ul></nav></header>`;
}

function dialogs() {
  return `<dialog id="text-dialog" aria-labelledby="text-dialog-title"><div class="dialog-shell"><header><div><p id="text-dialog-kicker" class="eyebrow"></p><h2 id="text-dialog-title">Exact source</h2></div><button type="button" data-dialog-close aria-label="Close viewer">Close</button></header><div id="text-dialog-meta"></div><pre tabindex="0"><code id="text-dialog-code"></code></pre></div></dialog><dialog id="image-dialog" aria-labelledby="image-dialog-title"><div class="dialog-shell image-dialog-shell"><header><div><p id="image-dialog-kicker" class="eyebrow"></p><h2 id="image-dialog-title">Screenshot</h2></div><button type="button" data-dialog-close aria-label="Close screenshot viewer">Close</button></header><div id="image-dialog-body"></div></div></dialog><dialog id="preview-dialog" aria-labelledby="embedded-preview-title"><div class="dialog-shell preview-dialog-shell"><header><div><p class="eyebrow">Sandboxed evidence viewer</p><h2 id="embedded-preview-title">Live preview</h2></div><button type="button" data-dialog-close aria-label="Close live preview">Close</button></header><div id="embedded-preview-controls"></div><div id="embedded-preview-container" class="preview-container"></div></div></dialog>`;
}

export async function renderStaticPages({
  dataPath = resolve(defaultRoot, 'data', 'benchmark.json'),
  templateRoot = resolve(defaultRoot, 'templates'),
  outputRoot = defaultRoot
} = {}) {
  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  const findings = JSON.parse(await readFile(resolve(dirname(dataPath), '..', data.findingsPath), 'utf8'));
  const indexTemplate = await readFile(resolve(templateRoot, 'index.template.html'), 'utf8');
  const previewTemplate = await readFile(resolve(templateRoot, 'preview.template.html'), 'utf8');
  let index = replaceRequired(indexTemplate, '{{STATIC_NAV}}', navigation());
  index = replaceRequired(index, '{{STATIC_METRICS}}', renderMetrics());
  index = replaceRequired(index, '{{STATIC_CASE_SELECTOR}}', '<p>Showing the first case below. All finalized outputs remain available in the run explorer.</p>');
  index = replaceRequired(index, '{{STATIC_COMPARISON}}', `<div class="comparison-grid">${data.runs.filter((run) => run.caseId === 'case-01').map((run) => renderRunCard(data, run, { includeId: false })).join('')}</div>`);
  index = replaceRequired(index, '{{STATIC_CASES}}', renderCases(data));
  index = replaceRequired(index, '{{STATIC_RUN_CARDS}}', data.runs.map((run) => renderRunCard(data, run)).join('\n'));
  index = replaceRequired(index, '{{STATIC_PROMPT_CARDS}}', renderPromptCards(data));
  index = replaceRequired(index, '{{STATIC_SKILL_CARD}}', `<div class="method-card"><p class="eyebrow">${escapeHtml(data.skill.verificationStatus)} · SHA-256</p><h3>${escapeHtml(data.skill.name)}</h3><p>This is the exact skill file confirmed as used for finalized New Skill runs.</p><p class="run-id">${escapeHtml(data.skill.checksum)}</p><a class="action primary" href="${escapeHtml(data.skill.path)}">View tested skill</a></div>`);
  index = replaceRequired(index, '{{STATIC_METHODOLOGY}}', renderMethodology(data));
  index = replaceRequired(index, '{{STATIC_FINDINGS}}', renderFindings(findings));
  index = replaceRequired(index, '{{STATIC_LIMITATIONS}}', renderLimitations());
  index = replaceRequired(index, '{{STATIC_EVIDENCE}}', renderEvidence(data));
  index = replaceRequired(index, '{{STATIC_DIALOGS}}', dialogs());
  await mkdir(outputRoot, { recursive: true });
  const indexPath = resolve(outputRoot, 'index.html');
  const previewPath = resolve(outputRoot, 'preview.html');
  await writeFile(indexPath, index, 'utf8');
  await writeFile(previewPath, previewTemplate, 'utf8');
  return {
    indexPath,
    previewPath,
    sha256: createHash('sha256').update(index).digest('hex')
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await renderStaticPages();
  console.log(`HTML PASS sha256=${result.sha256}`);
}

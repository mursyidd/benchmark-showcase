import { loadBenchmark } from './data-store.js';
import { createImageViewer } from './dialogs.js';
import { createEmbeddedPreview } from './preview-controller.js';
import { readHash, rejectInvalidHash, writeHash } from './router.js';
import { createTextViewer } from './text-viewer.js';

document.documentElement.classList.add('js');
const data = await loadBenchmark();
const byId = (id) => document.getElementById(id);
const hashSchema = {
  $sections: new Set(['overview', 'results', 'cases', 'run-explorer', 'prompts', 'tested-skill', 'methodology', 'findings', 'limitations', 'evidence']),
  run: new Set(data.runs.map((run) => run.id)),
  prompt: new Set(data.prompts.map((prompt) => prompt.id)),
  source: new Set(data.runs.flatMap((run) => run.sourceFiles.map((source) => `${run.id}:${source.name}`))),
  case: new Set(data.cases.map((item) => item.id)),
  model: new Set(data.models.map((item) => item.id)),
  condition: new Set(data.conditions.map((item) => item.id)),
  findings: new Set(['yes', 'no']),
  original: new Set(['yes', 'no']),
  desktop: new Set(['available', 'unavailable']),
  mobile: new Set(['available', 'unavailable']),
  preview: new Set(['yes', 'no']),
  status: new Set(['recorded', 'not-recorded'])
};

function node(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text != null) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs || {})) element.setAttribute(name, value);
  for (const child of children) if (child) element.append(child);
  return element;
}

function renderMetrics() {
  const metrics = [
    [data.benchmark.runCount, 'Finalized runs'], [data.benchmark.caseCount, 'Test cases'],
    [data.benchmark.modelCount, 'Model configs'], [data.benchmark.conditionCount, 'Conditions'],
    [data.benchmark.promptCount, 'Exact prompts'], [1, 'Tested skill']
  ];
  byId('summary-metrics').replaceChildren(...metrics.map(([value, label]) => node('div', { className: 'metric' }, [node('strong', { text: value }), node('span', { text: label })])));
}

function conditionBadge(run) { return node('span', { className: 'condition-badge', text: run.conditionLabel }); }

function runCard(run, compact = false) {
  const capture = run.derivedCaptures.desktop;
  const media = node('div', { className: 'run-card-media' });
  if (capture?.path) media.append(node('img', { attrs: { src: capture.path, alt: `${run.caseName}, ${run.modelLabel}, ${run.conditionLabel} — publication-time derived desktop capture`, loading: 'lazy', width: '1440', height: '900' } }));
  else if (capture?.failureReason) media.append(node('p', { className: 'empty-state', text: 'Capture unavailable' }));
  else media.append(node('p', { className: 'empty-state', text: 'Capture record missing' }));
  const actions = node('div', { className: 'card-actions' }, [
    node('button', { text: 'View screenshots', attrs: { type: 'button', 'data-view-images': run.id } }),
    node('button', { text: 'Open live preview', attrs: { type: 'button', 'data-open-preview': run.id } }),
    node('button', { text: 'Exact prompt', attrs: { type: 'button', 'data-view-prompt': run.promptId } }),
    node('button', { text: 'Sanitized source', attrs: { type: 'button', 'data-view-source': `${run.id}:index.html` } })
  ]);
  const body = node('div', { className: 'run-card-body' }, [
    conditionBadge(run),
    node('h3', { text: run.modelLabel }),
    node('p', { className: 'run-id', text: run.id }),
    node('div', { className: 'run-stats' }, [
      node('div', { className: 'run-stat' }, [node('b', { text: 'Recorded duration' }), node('span', { text: run.durationDisplay || 'Not recorded' })]),
      node('div', { className: 'run-stat' }, [node('b', { text: 'Findings' }), node('span', { text: String(run.findingIds.length) })])
    ]),
    node('details', { className: 'timing-caveat' }, [node('summary', { text: 'Timing caveat' }), node('p', { text: run.timingCaveat || 'No timing caveat recorded.' })]),
    node('span', { className: 'provenance-note', text: 'Publication-time derived capture' }),
    actions,
    node('a', { className: 'run-link', text: 'Permalink to this run', attrs: { href: `#run=${encodeURIComponent(run.id)}` } })
  ]);
  const attrs = { 'data-run-card': '', 'data-run-id': run.id, 'data-case': run.caseId, 'data-model': run.modelId, 'data-condition': run.conditionId };
  if (!compact) attrs.id = `run=${run.id}`;
  return node('article', { className: `run-card${compact ? ' compact' : ''}`, attrs }, [media, body]);
}

let selectedCase = data.cases[0].id;
let explorer;
function renderComparison() {
  const selector = node('div', { className: 'case-selector', attrs: { 'aria-label': 'Select benchmark case' } });
  for (const item of data.cases) {
    const button = node('button', { text: `${String(item.number).padStart(2, '0')} — ${item.shortName}`, attrs: { type: 'button', 'aria-pressed': String(item.id === selectedCase) } });
    button.addEventListener('click', () => {
      selectedCase = item.id;
      renderComparison();
      if (explorer) {
        explorer.controls.case.value = item.id;
        explorer.applyFilters();
      } else writeHash({ case: item.id }, hashSchema);
    });
    selector.append(button);
  }
  byId('case-selector').replaceChildren(selector);
  const grid = node('div', { className: 'comparison-grid' });
  for (const model of data.models) {
    const column = node('div', { className: 'model-column' }, [node('div', { className: 'model-heading', text: model.label })]);
    for (const condition of data.conditions) column.append(runCard(data.runs.find((run) => run.caseId === selectedCase && run.modelId === model.id && run.conditionId === condition.id), true));
    grid.append(column);
  }
  byId('comparison-grid').replaceChildren(grid);
}

function renderCases() {
  const grid = node('div', { className: 'case-card-grid' });
  for (const item of data.cases) grid.append(node('article', { className: 'case-card' }, [node('span', { className: 'case-index', text: String(item.number).padStart(2, '0') }), node('h3', { text: item.name }), node('p', { text: item.purpose }), node('p', { className: 'run-id', text: '6 runs · 3 model configurations · 2 conditions' })]));
  byId('case-cards').replaceChildren(grid);
}

function renderExplorer() {
  const definitions = [
    ['case', 'Case', [['all', 'All cases'], ...data.cases.map((item) => [item.id, item.name])]],
    ['model', 'Model', [['all', 'All models'], ...data.models.map((item) => [item.id, item.label])]],
    ['condition', 'Condition', [['all', 'All conditions'], ...data.conditions.map((item) => [item.id, item.label])]],
    ['findings', 'Has findings', [['all', 'Any'], ['yes', 'Yes'], ['no', 'No']]],
    ['original', 'Original screenshot evidence', [['all', 'Any'], ['yes', 'Yes'], ['no', 'No']]],
    ['desktop', 'Desktop derived capture', [['all', 'Any'], ['available', 'Available'], ['unavailable', 'Unavailable']]],
    ['mobile', 'Mobile derived capture', [['all', 'Any'], ['available', 'Available'], ['unavailable', 'Unavailable']]],
    ['preview', 'Live preview', [['all', 'Any'], ['yes', 'Yes'], ['no', 'No']]],
    ['status', 'Recorded duration', [['all', 'Any'], ['recorded', 'Recorded'], ['not-recorded', 'Not recorded']]]
  ];
  const filters = node('div', { className: 'filters' });
  for (const [key, label, options] of definitions) {
    const select = node('select', { attrs: { id: `${key === 'original' ? 'original-screenshot' : key}-filter`, 'data-filter-key': key } });
    for (const [value, text] of options) select.append(node('option', { text, attrs: { value } }));
    filters.append(node('label', { className: 'filter-field' }, [node('span', { text: label }), select]));
  }
  const clear = node('button', { className: 'action', text: 'Clear all filters', attrs: { type: 'button', id: 'clear-filters' } });
  byId('run-filters').replaceChildren(filters, clear);
  byId('run-grid').className = 'run-grid';
  byId('run-grid').replaceChildren(...data.runs.map((run) => runCard(run)));
  const empty = node('p', { className: 'empty-state', text: 'No runs match these filters.', attrs: { id: 'run-empty-state', hidden: '' } });
  byId('run-grid').after(empty);

  const controls = Object.fromEntries([...filters.querySelectorAll('select')].map((select) => [select.dataset.filterKey, select]));
  function matches(run) {
    const value = (key) => controls[key].value;
    return (value('case') === 'all' || run.caseId === value('case'))
      && (value('model') === 'all' || run.modelId === value('model'))
      && (value('condition') === 'all' || run.conditionId === value('condition'))
      && (value('findings') === 'all' || (run.findingIds.length > 0) === (value('findings') === 'yes'))
      && (value('original') === 'all' || (run.originalScreenshots.length > 0) === (value('original') === 'yes'))
      && (value('desktop') === 'all' || Boolean(run.derivedCaptures.desktop?.path) === (value('desktop') === 'available'))
      && (value('mobile') === 'all' || Boolean(run.derivedCaptures.mobile?.path) === (value('mobile') === 'available'))
      && (value('preview') === 'all' || Boolean(run.previewPath) === (value('preview') === 'yes'))
      && (value('status') === 'all' || (run.durationSeconds != null) === (value('status') === 'recorded'));
  }
  function applyFilters(updateUrl = true) {
    let visible = 0;
    for (const card of byId('run-grid').querySelectorAll('[data-run-card]')) {
      const show = matches(data.runs.find((run) => run.id === card.dataset.runId));
      card.hidden = !show;
      if (show) visible += 1;
    }
    byId('run-count').textContent = `${visible} ${visible === 1 ? 'run' : 'runs'} shown`;
    empty.hidden = visible !== 0;
    if (updateUrl) writeHash(Object.fromEntries(Object.entries(controls).filter(([, control]) => control.value !== 'all').map(([key, control]) => [key, control.value])), hashSchema);
  }
  filters.addEventListener('change', () => applyFilters());
  clear.addEventListener('click', () => {
    Object.values(controls).forEach((control) => { control.value = 'all'; });
    applyFilters();
  });
  return { controls, applyFilters };
}

function renderPrompts() {
  const grid = node('div', { className: 'prompt-grid' });
  for (const prompt of data.prompts) grid.append(node('article', { className: 'prompt-card', attrs: { 'data-condition': prompt.conditionId } }, [
    node('span', { className: 'condition-badge', text: prompt.conditionId === 'new-skill' ? 'New Skill' : 'No Skill' }),
    node('h3', { text: prompt.label }), node('p', { className: 'run-id', text: prompt.id }),
    node('p', { text: prompt.skillLoadedSeparately ? 'Exact prompt + tested SKILL.md loaded separately.' : 'Exact prompt + tested SKILL.md not loaded.' }),
    node('button', { className: 'action', text: 'Read exact prompt', attrs: { type: 'button', 'data-view-prompt': prompt.id } })
  ]));
  byId('prompt-grid').className = 'prompt-grid';
  byId('prompt-grid').replaceChildren(grid);
}

function renderSkill() {
  byId('skill-view').replaceChildren(node('div', { className: 'method-card' }, [node('p', { className: 'eyebrow', text: `${data.skill.verificationStatus} · SHA-256` }), node('h3', { text: data.skill.name }), node('p', { text: 'This is the exact skill file confirmed as used for the finalized New Skill runs. The No Skill runs did not receive this benchmarked skill.' }), node('p', { className: 'run-id', text: data.skill.checksum }), node('button', { className: 'action primary', text: 'View tested skill', attrs: { type: 'button', 'data-view-skill': '' } })]));
}

async function renderFindings() {
  const findings = await fetch(new URL('../data/findings.json', import.meta.url)).then((response) => response.json());
  const labels = { 'human-review-required': 'Human review required', 'human-review-verified-for-archive': 'Verified for archive', 'human-review-rejected': 'Human review rejected' };
  const list = node('div', { className: 'finding-list' });
  for (const finding of findings) list.append(node('article', { className: 'finding' }, [node('code', { text: finding.id }), node('div', {}, [node('strong', { text: finding.summary }), node('p', { text: finding.detail }), node('code', { text: finding.runId }), node('p', {}, [node('a', { text: `${finding.sourceSection} — source`, attrs: { href: finding.sourcePath } })])]), node('div', { className: 'finding-badges' }, [node('span', { className: 'classification-badge', text: finding.classificationStatus }), node('span', { className: 'review-badge', text: labels[finding.reviewStatus] || finding.reviewStatus })])]));
  const content = [];
  if (findings.some((finding) => finding.reviewStatus !== 'human-review-verified-for-archive')) content.push(node('div', { className: 'release-warning', attrs: { role: 'status' } }, [node('strong', { text: 'Archival review incomplete' }), node('p', { text: 'Publication is blocked until every detected finding has a matching verification decision suitable for the evidence archive.' })]));
  else content.push(node('div', { className: 'release-warning', attrs: { role: 'status' } }, [node('strong', { text: 'Archival evidence review' }), node('p', { text: 'Human verification confirms the defect evidence and description. It does not approve interface quality, implementation correctness, or product behavior. The verified defects remain intentionally unchanged in the original generated outputs.' })]));
  content.push(list);
  byId('findings-content').replaceChildren(...content);
}

function renderNarrative() {
  const counts = data.screenshotEvidenceSummary;
  const method = node('div', { className: 'method-grid' }, [
    node('article', { className: 'method-card' }, [node('p', { className: 'eyebrow', text: 'Archive matrix' }), node('h3', { text: '3 × 3 × 2' }), node('p', { text: 'Three task types, three recorded model configurations, and two prompting conditions. Luna and Terra used xHigh reasoning. Sol used High reasoning. These archived runs are not a controlled comparison.' })]),
    node('article', { className: 'method-card' }, [node('h3', { text: 'Screenshot provenance' }), node('p', { className: 'eyebrow', text: `${counts.originalScreenshotArtifactCount} original artifacts · ${counts.standardizedDerivedCaptureCount} derived captures` }), node('p', { text: 'The sanitized publication contains 15 original screenshot artifacts belonging to 1 run with original screenshot evidence. The showcase adds 36 standardized publication-time derived captures, providing a consistent archival reference for 18 runs.' }), node('p', { text: 'No model was rerun.' }), node('p', { text: 'No implementation was regenerated or repaired.' }), node('p', { text: 'The publication-time derived captures do not reconstruct the exact original runtime environment. Original benchmark screenshots remain separately labelled where available.' })])
  ]);
  const batches = [];
  const seen = new Set();
  for (const run of data.runs) {
    const key = `${run.caseId}:${run.conditionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    batches.push({ label: `${run.caseName} · ${run.conditionLabel}`, seconds: run.batchDurationSeconds });
  }
  const maximum = Math.max(...batches.map((batch) => batch.seconds || 0), 1);
  const timingList = node('div', { className: 'timing-list' }, batches.map((batch) => node('div', { className: 'timing-row' }, [node('span', { text: batch.label }), node('meter', { attrs: { min: '0', max: String(maximum), value: String(batch.seconds || 0), 'aria-label': `${batch.label}: ${batch.seconds == null ? 'Not recorded' : `${Math.round(batch.seconds)} seconds`}` } }), node('strong', { text: batch.seconds == null ? 'Not recorded' : `${Math.round(batch.seconds)} s` })])));
  const timing = node('section', { className: 'timing-block', attrs: { 'aria-labelledby': 'timing-title' } }, [node('h3', { text: 'Recorded timing', attrs: { id: 'timing-title' } }), node('p', { text: 'Timing records are preserved as execution evidence, not as controlled performance measurements. Individual durations retain manifest caveats: they include orchestration, tool execution, and observation handoff.' }), timingList]);
  byId('methodology-content').replaceChildren(method, timing);
  const limits = [
    'Publication-time captures show how the finalized sanitized implementations rendered in the showcase capture environment. They may differ from the exact browser, font, timing, or operating-system conditions present during the original benchmark execution.',
    'This archive is not a controlled scientific experiment, model ranking, or basis for causal or superiority claims.',
    'Luna and Terra used xHigh reasoning while Sol used High reasoning; these are recorded configurations, not matched reasoning levels.',
    'The selected task types are illustrative rather than representative, and model outputs are nondeterministic.',
    'Recorded durations include orchestration and observation caveats and must not be interpreted as controlled performance measurements.'
  ];
  byId('limitations-content').replaceChildren(node('div', { className: 'limitations-grid' }, limits.map((text, index) => node('article', { className: 'limitation-card' }, [node('p', { className: 'eyebrow', text: `Limitation ${String(index + 1).padStart(2, '0')}` }), node('p', { text })]))));
  const evidence = [
    ['Sanitization-stage integrity assurance', 'The original-to-sanitized relationship is governed by the sanitization report.', data.evidence.sanitizationReportPath],
    ['Showcase-copy integrity verification', 'Showcase copies match the finalized sanitized publication artifacts from which they were copied.', data.evidence.copyMapPath],
    ['Derived screenshot generation', 'Standardized screenshots were rendered from finalized sanitized implementations without showcase-time source modification.', data.captureProvenancePath],
    ['Finalized benchmark manifest', 'The sanitized publication manifest is the source of truth for the 18-run archive matrix.', data.evidence.manifestPath],
    ['Findings archival-review ledger', 'Human review verifies the evidence and defect descriptions for archival publication; it does not approve the generated interfaces.', 'evidence/findings-review.md']
  ];
  byId('evidence-content').replaceChildren(node('div', { className: 'evidence-grid' }, evidence.map(([label, description, path]) => node('article', { className: 'evidence-card' }, [node('h3', { text: label }), node('p', { text: description }), node('a', { text: 'Open evidence', attrs: { href: path } })]))));
}

function setupNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = byId('site-nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.dataset.open = String(open);
  });
}

renderMetrics();
renderComparison();
renderCases();
explorer = renderExplorer();
renderPrompts();
renderSkill();
renderNarrative();
await renderFindings();
setupNav();

const textViewer = createTextViewer(data);
const imageViewer = createImageViewer(data);
const embeddedPreview = createEmbeddedPreview(data);

document.addEventListener('click', (event) => {
  const prompt = event.target.closest('[data-view-prompt]');
  if (prompt) {
    textViewer.openPrompt(prompt.dataset.viewPrompt, prompt);
    writeHash({ prompt: prompt.dataset.viewPrompt }, hashSchema);
  }
  const skill = event.target.closest('[data-view-skill]');
  if (skill) textViewer.openSkill(skill);
  const source = event.target.closest('[data-view-source]');
  if (source) {
    textViewer.openSource(source.dataset.viewSource, source);
    writeHash({ source: source.dataset.viewSource }, hashSchema);
  }
  const images = event.target.closest('[data-view-images]');
  if (images) imageViewer.open(images.dataset.viewImages, images);
  const preview = event.target.closest('[data-open-preview]');
  if (preview) embeddedPreview.open(preview.dataset.openPreview, preview);
});

function applyRoute() {
  embeddedPreview.close();
  const route = readHash(hashSchema);
  if (route.invalid) {
    for (const dialog of document.querySelectorAll('#text-dialog[open], #image-dialog[open]')) dialog.close();
    rejectInvalidHash();
    return;
  }
  if (route.values.run) {
    Object.values(explorer.controls).forEach((control) => { control.value = 'all'; });
    explorer.applyFilters(false);
    const card = byId(`run=${route.values.run}`);
    if (!card) {
      rejectInvalidHash();
      return;
    }
    card.tabIndex = -1;
    requestAnimationFrame(() => { card.scrollIntoView({ block: 'center' }); card.focus({ preventScroll: true }); });
    return;
  }
  if (route.values.prompt) {
    const opener = document.querySelector(`[data-view-prompt="${CSS.escape(route.values.prompt)}"]`);
    textViewer.openPrompt(route.values.prompt, opener);
    return;
  }
  if (route.values.source) {
    const opener = document.querySelector(`[data-view-source="${CSS.escape(route.values.source)}"]`);
    textViewer.openSource(route.values.source, opener);
    return;
  }
  for (const [key, control] of Object.entries(explorer.controls)) control.value = route.values[key] || 'all';
  explorer.applyFilters(false);
  if (route.values.case && selectedCase !== route.values.case) {
    selectedCase = route.values.case;
    renderComparison();
  }
}

applyRoute();
window.addEventListener('hashchange', applyRoute);

import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { renderStaticPages } from './build-static-page.mjs';
import { mergeReviewDecisions } from './lib/findings.mjs';

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const root = resolve(rootIndex >= 0 ? args[rootIndex + 1] : scriptRoot);
const allowHumanReviewPending = args.includes('--allow-human-review-pending');
const errors = [];
const warnings = [];
const error = (category, message) => errors.push({ category, message });
const warn = (category, message) => { if (!warnings.some((item) => item.category === category)) warnings.push({ category, message }); };

async function json(path) { return JSON.parse(await readFile(resolve(root, ...path.split('/')), 'utf8')); }
async function text(path) { return readFile(resolve(root, ...path.split('/')), 'utf8'); }
async function sha256(path) { return createHash('sha256').update(await readFile(path)).digest('hex'); }
async function exists(path) { try { await stat(path); return true; } catch { return false; } }

async function walk(directory, relativeRoot = '') {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', 'test-results', 'playwright-report', '.git'].includes(entry.name)) continue;
    const relativePath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...await walk(resolve(directory, entry.name), relativePath));
    else found.push(relativePath);
  }
  return found;
}

function inside(relativePath, label) {
  if (typeof relativePath !== 'string' || !relativePath || isAbsolute(relativePath) || relativePath.includes('\\') || relativePath.split('/').includes('..')) {
    error('PATH', `${label} must be a contained relative POSIX path: ${relativePath}`);
    return null;
  }
  if (/(^|\/)[^/]*-old(?:\/|$)/i.test(relativePath)) error('PATH', `${label} contains forbidden -old artifact: ${relativePath}`);
  const target = resolve(root, ...relativePath.split('/'));
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    error('PATH', `${label} escapes showcase root: ${relativePath}`);
    return null;
  }
  return target;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngDimensions(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature)) return null;
  let offset = 8;
  let ihdr = null;
  const idat = [];
  let ended = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > buffer.length) return null;
    const type = buffer.subarray(offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (crc32(Buffer.concat([type, data])) !== buffer.readUInt32BE(offset + 8 + length)) return null;
    const name = type.toString('ascii');
    if (name === 'IHDR') {
      if (ihdr || length !== 13 || offset !== 8) return null;
      ihdr = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9] };
    } else if (name === 'IDAT') idat.push(data);
    else if (name === 'IEND') { if (length !== 0) return null; ended = true; break; }
    offset = end;
  }
  if (!ihdr || !idat.length || !ended || ihdr.bitDepth !== 8) return null;
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.colorType];
  if (!channels) return null;
  try {
    const decoded = inflateSync(Buffer.concat(idat));
    if (decoded.length !== (ihdr.width * channels + 1) * ihdr.height) return null;
  } catch { return null; }
  return { width: ihdr.width, height: ihdr.height };
}

async function validateStructure(data, manifest) {
  const expected = { runCount: 18, caseCount: 3, modelCount: 3, conditionCount: 2, promptCount: 6 };
  for (const [key, value] of Object.entries(expected)) if (data.benchmark?.[key] !== value) error('STRUCTURE', `${key} must equal ${value}`);
  if (data.runs?.length !== 18 || new Set(data.runs?.map((run) => run.id)).size !== 18) error('STRUCTURE', '18 unique runs are required');
  if (data.prompts?.length !== 6 || new Set(data.prompts?.map((prompt) => prompt.id)).size !== 6) error('STRUCTURE', 'six unique prompts are required');
  if (!data.skill?.path) error('STRUCTURE', 'one canonical tested skill is required');
  const exactCases = new Set(['case-01', 'case-02', 'case-03']);
  const exactModels = new Set(['luna-xhigh', 'sol-high', 'terra-xhigh']);
  const exactConditions = new Set(['new-skill', 'no-skill']);
  if (data.cases?.length !== 3 || data.cases.some((item) => !exactCases.has(item.id))) error('STRUCTURE', 'case IDs must be exactly case-01 through case-03');
  if (data.models?.length !== 3 || data.models.some((item) => !exactModels.has(item.id))) error('STRUCTURE', 'model IDs must be exactly luna-xhigh, sol-high, and terra-xhigh');
  if (data.conditions?.length !== 2 || data.conditions.some((item) => !exactConditions.has(item.id))) error('STRUCTURE', 'conditions must be exactly new-skill and no-skill');
  const expectedCells = new Set([...exactCases].flatMap((caseId) => [...exactModels].flatMap((modelId) => [...exactConditions].map((conditionId) => `${caseId}:${modelId}:${conditionId}`))));
  const cells = new Set();
  for (const run of data.runs || []) {
    const cell = `${run.caseId}:${run.modelId}:${run.conditionId}`;
    cells.add(cell);
    if (!expectedCells.has(cell) || run.id !== `${run.caseId}-${run.conditionId}-${run.modelId}`) error('STRUCTURE', `invalid run matrix identity: ${run.id}`);
    if (!data.prompts.some((prompt) => prompt.id === run.promptId && prompt.caseId === run.caseId && prompt.conditionId === run.conditionId)) error('STRUCTURE', `run prompt foreign key mismatch: ${run.id}`);
    for (const [label, path] of [['preview', run.previewPath], ['evidence', run.evidencePath], ...run.sourceFiles.map((item) => ['source', item.path])]) {
      const target = inside(path, `${run.id} ${label}`);
      if (target && !(await exists(target))) error('PATH', `missing ${label} path: ${path}`);
    }
  }
  if (cells.size !== 18 || [...expectedCells].some((cell) => !cells.has(cell))) error('STRUCTURE', 'run matrix must equal the complete 3×3×2 Cartesian product');
  for (const prompt of data.prompts || []) {
    const target = inside(prompt.path, `prompt ${prompt.id}`);
    if (target && !(await exists(target))) error('PATH', `missing prompt: ${prompt.path}`);
    const used = new Set(prompt.usedByRuns || []);
    const expectedRuns = new Set(data.runs.filter((run) => run.caseId === prompt.caseId && run.conditionId === prompt.conditionId).map((run) => run.id));
    if (used.size !== 3 || [...used].some((id) => !expectedRuns.has(id)) || [...expectedRuns].some((id) => !used.has(id))) error('STRUCTURE', `${prompt.id} must map uniquely to the correct three runs`);
  }
  const skill = inside(data.skill?.path, 'tested skill');
  if (skill && !(await exists(skill))) error('PATH', `missing tested skill: ${data.skill.path}`);
  if (data.skill.path !== 'inputs/skill/SKILL.md' || data.skill.usedByCondition !== 'new-skill' || data.skill.excludedFromCondition !== 'no-skill') error('STRUCTURE', 'tested skill semantics are invalid');
  if (manifest.runs?.length !== 18 || manifest.prompts?.length !== 6) error('STRUCTURE', 'copied finalized manifest matrix is incomplete');
}

async function validateCopies(data, copyMap, manifest) {
  if (!Array.isArray(copyMap.files) || copyMap.files.length === 0) error('COPY', 'copy map has no files');
  const mapped = new Set();
  for (const entry of copyMap.files || []) {
    const target = inside(entry.destinationPath, 'copy-map destination');
    if (!target || !(await exists(target))) { error('COPY', `copy-map destination missing: ${entry.destinationPath}`); continue; }
    if (mapped.has(entry.destinationPath)) error('COPY', `duplicate copy-map destination: ${entry.destinationPath}`);
    mapped.add(entry.destinationPath);
    const actual = await sha256(target);
    if (actual !== entry.sha256) error('COPY', `checksum mismatch for ${entry.destinationPath}`);
    if ((await stat(target)).size !== entry.bytes) error('COPY', `byte-count mismatch for ${entry.destinationPath}`);
  }
  const manifestArtifacts = new Set(manifest.runs.flatMap((run) => [...(run.rawArtifacts || []), ...(run.screenshots || [])].map((artifact) => artifact.publicPath.replace(/^raw\//, 'runs/'))));
  const artifactPaths = new Set((data.runs || []).flatMap((run) => [...run.sourceFiles.map((item) => item.path), ...run.originalScreenshots.map((item) => item.path)]));
  const mappedArtifacts = new Set((copyMap.files || []).filter((entry) => entry.kind === 'sanitized-run-artifact').map((entry) => entry.destinationPath));
  const filesystemArtifacts = new Set((await walk(resolve(root, 'runs'))).map((path) => `runs/${path}`));
  const sets = [manifestArtifacts, artifactPaths, mappedArtifacts, filesystemArtifacts];
  if (sets.some((set) => set.size !== 89) || sets.some((set) => [...manifestArtifacts].some((path) => !set.has(path)) || [...set].some((path) => !manifestArtifacts.has(path)))) {
    error('COPY', 'implementation inventory differs from the 89 finalized sanitized publication artifacts');
  }
  for (const run of data.runs || []) for (const source of run.sourceFiles) {
    const target = inside(source.path, 'source checksum');
    if (target && await exists(target) && await sha256(target) !== source.checksum) error('COPY', `dataset source checksum mismatch: ${source.path}`);
  }
  for (const prompt of data.prompts) {
    const target = inside(prompt.path, 'canonical prompt checksum');
    if (target && await sha256(target) !== prompt.checksum) error('COPY', `canonical prompt checksum mismatch: ${prompt.path}`);
  }
  const skill = inside(data.skill.path, 'canonical skill checksum');
  if (skill && await sha256(skill) !== data.skill.checksum) error('COPY', 'canonical tested skill checksum mismatch');
  const audit = await text('evidence/audit/sanitization-report.md');
  const results = [...audit.matchAll(/^RESULT=([^\r\n]+)$/gm)].map((match) => match[1]);
  if (results.length !== 1 || results[0] !== 'PASS errors=0 warnings=1') error('COPY', 'sanitization audit does not contain one resolved PASS result');
}

async function validateDependencies() {
  const pkg = await json('package.json');
  const lock = await json('package-lock.json');
  const pins = { '@playwright/test': '1.61.1', '@axe-core/playwright': '4.12.1' };
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const [name, version] of Object.entries(pkg[section] || {})) if (/^(latest|\*|\^|~)/.test(version)) error('DEPENDENCY', `exact dependency version required for ${section}.${name}`);
  }
  for (const [name, version] of Object.entries(pins)) {
    if (pkg.devDependencies?.[name] !== version) error('DEPENDENCY', `exact dependency version required: ${name}@${version}`);
    if (lock.packages?.[`node_modules/${name}`]?.version !== version) error('DEPENDENCY', `lockfile exact dependency version required: ${name}@${version}`);
    if (lock.packages?.['']?.devDependencies?.[name] !== version) error('DEPENDENCY', `lockfile root exact dependency version required: ${name}@${version}`);
  }
}

async function validateGenerated() {
  const temp = await mkdtemp(resolve(tmpdir(), 'showcase-html-'));
  try {
    await renderStaticPages({ dataPath: resolve(root, 'data', 'benchmark.json'), templateRoot: resolve(root, 'templates'), outputRoot: temp });
    for (const page of ['index.html', 'preview.html']) {
      const expected = await readFile(resolve(temp, page));
      const actual = await readFile(resolve(root, page));
      if (!actual.equals(expected)) error('GENERATED', `generated HTML differs for ${page}`);
      if (actual.toString('utf8').includes('{{')) error('GENERATED', `unresolved template marker in ${page}`);
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
}

async function validateCaptures(data, captures, copyMap) {
  if (captures.length !== 36) error('CAPTURE', 'exactly 36 desktop/mobile capture records are required');
  const slots = new Set();
  for (const capture of captures) {
    const key = `${capture.sourceRunId}:${capture.variant}`;
    if (slots.has(key)) error('CAPTURE', `duplicate capture slot: ${key}`);
    slots.add(key);
    const run = data.runs.find((item) => item.id === capture.sourceRunId);
    if (!run || capture.capturedFrom !== run.previewPath) error('CAPTURE', `capture source/run mismatch: ${key}`);
    if (capture.provenance !== 'publication-time-derived-capture' || capture.label !== 'Publication-time derived capture') error('CAPTURE', `derived provenance label mismatch: ${key}`);
    if (capture.sourceModified !== false) error('CAPTURE', `sourceModified must be false: ${key}`);
    if (!capture.captureTool) error('CAPTURE', `capture tool missing: ${key}`);
    if (capture.capturedAt && Number.isNaN(Date.parse(capture.capturedAt))) error('CAPTURE', `invalid capture timestamp: ${key}`);
    if (capture.capturePolicy?.waitStrategy !== 'domcontentloaded-load-fonts-two-raf-500ms-v1') error('CAPTURE', `readiness policy mismatch: ${key}`);
    const fixedPolicy = { deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC', format: 'png', fullPage: false, initialInteraction: 'none' };
    for (const [name, value] of Object.entries(fixedPolicy)) if (capture.capturePolicy?.[name] !== value) error('CAPTURE', `fixed capture policy mismatch for ${name}: ${key}`);
    if (capture.path && capture.failureReason) error('CAPTURE', `capture cannot have both path and failure reason: ${key}`);
    if (!capture.path && (typeof capture.failureReason !== 'string' || !capture.failureReason.trim())) error('CAPTURE', `capture failure reason required when path is null: ${key}`);
    if (capture.path) {
      if (capture.status !== 'captured') error('CAPTURE', `capture with a path must have captured status: ${key}`);
      const target = inside(capture.path, 'derived capture');
      if (!target || !(await exists(target))) { error('CAPTURE', `capture file missing: ${capture.path}`); continue; }
      const dimensions = pngDimensions(await readFile(target));
      const expected = capture.variant === 'desktop' ? { width: 1440, height: 900 } : { width: 390, height: 844 };
      if (!dimensions || dimensions.width !== expected.width || dimensions.height !== expected.height) error('CAPTURE', `capture dimensions mismatch: ${key}`);
      if (capture.captureViewport?.width !== expected.width || capture.captureViewport?.height !== expected.height) error('CAPTURE', `capture viewport mismatch: ${key}`);
    } else {
      if (capture.status !== 'failed') error('CAPTURE', `documented capture failure must have failed status: ${key}`);
      error('CAPTURE', `documented capture failure blocks the current 36 captures / 18 covered runs publication claim: ${key}`);
    }
    if (run && JSON.stringify(run.derivedCaptures?.[capture.variant]) !== JSON.stringify(capture)) error('CAPTURE', `dataset capture record differs from provenance record: ${key}`);
  }
  for (const run of data.runs) for (const variant of ['desktop', 'mobile']) if (!slots.has(`${run.id}:${variant}`)) error('CAPTURE', `missing capture slot: ${run.id}:${variant}`);
  const originals = data.runs.flatMap((run) => run.originalScreenshots);
  if (originals.length !== 15 || data.runs.filter((run) => run.originalScreenshots.length).length !== 1) error('CAPTURE', 'original evidence must be 15 artifacts belonging to 1 run');
  const mapByPath = new Map(copyMap.files.map((entry) => [entry.destinationPath, entry]));
  for (const original of originals) {
    if (original.provenance !== 'original-benchmark-evidence' || original.label !== 'Original benchmark screenshot') error('CAPTURE', `original provenance mismatch: ${original.path}`);
    const target = inside(original.path, 'original screenshot');
    const mapped = mapByPath.get(original.path);
    if (!target || !mapped || await sha256(target) !== mapped.sha256) error('CAPTURE', `original screenshot checksum mismatch: ${original.path}`);
  }
  const summary = data.screenshotEvidenceSummary;
  const successful = captures.filter((item) => item.path);
  const covered = new Set(data.runs.filter((run) => run.derivedCaptures.desktop?.path && run.derivedCaptures.mobile?.path).map((run) => run.id));
  if (successful.length !== 36 || covered.size !== 18) error('CAPTURE', 'the current publication claim requires 36 successful captures covering all 18 runs');
  if (summary.originalScreenshotArtifactCount !== 15 || summary.runsWithOriginalScreenshotEvidenceCount !== 1 || summary.standardizedDerivedCaptureCount !== 36 || summary.runsWithStandardizedDerivedCaptureCoverageCount !== 18) error('CAPTURE', 'screenshot evidence summary must report exactly 15 / 1 / 36 / 18');
  const captureSource = await text('scripts/capture-runs.mjs');
  if (/networkidle/i.test(captureSource) || captures.some((item) => /networkidle/i.test(JSON.stringify(item.capturePolicy)))) error('CAPTURE', 'networkidle is forbidden by the capture readiness policy');
}

async function validateSecurityAndContent(data) {
  const index = await text('index.html');
  const preview = await text('preview.html');
  const scopeStatement = 'This archive documents an 18-run frontend generation exercise across three task types, three model configurations, and two prompting conditions. It is provided as a transparent showcase of the work performed, not as a controlled study, model ranking, or claim that one approach is superior.';
  const scopeQualifier = 'It is non-evaluative: it does not identify a winner or support causal conclusions.';
  const readme = await text('README.md');
  if (!readme.includes(scopeStatement) || !index.includes(scopeStatement) || !readme.includes(scopeQualifier) || !index.includes(scopeQualifier)) error('CONTENT', 'required non-evaluative archive scope statement is missing');
  if (/(?:href|src|action|formaction|content)=["'][^"']*runs\/[^"']*\/index\.html/i.test(index + preview) || /http-equiv=["']refresh["'][^>]*runs\//i.test(index + preview)) error('SECURITY', 'direct raw implementation link is forbidden');
  const controller = await text('js/preview-controller.js');
  const shell = await text('js/preview-shell.js');
  const viewer = await text('js/text-viewer.js');
  if (/allow-same-origin|allow-top-navigation/i.test(controller + shell + index + preview)) error('SECURITY', 'unsafe iframe sandbox token found');
  if (!/PREVIEW_SANDBOX\s*=\s*'allow-scripts allow-forms allow-modals'/.test(controller) || !/setAttribute\('sandbox',\s*PREVIEW_SANDBOX\)/.test(controller)) error('SECURITY', 'preview controller must apply the exact iframe sandbox contract');
  if (!/buildSandboxedFrame\(data,\s*runId/.test(controller) || !/getRun\(data,\s*runId\)/.test(controller) || !/frame\.src\s*=\s*run\.previewPath/.test(controller)) error('SECURITY', 'preview source must be constructed only from a validated dataset run');
  if (/<iframe\b/i.test(index + preview)) error('SECURITY', 'generated pages must not contain eager static iframes');
  if (/location\.search|searchParams|[?&](url|src)=/i.test(shell)) error('SECURITY', 'standalone preview accepts an arbitrary URL parameter');
  if (/innerHTML/.test(viewer)) error('SECURITY', 'innerHTML is forbidden in exact text viewers');
  const jsFiles = await readdir(resolve(root, 'js'));
  const runtimeSources = `${index}\n${preview}\n${await text('styles.css')}\n${(await Promise.all(jsFiles.filter((name) => name.endsWith('.js')).map((name) => text(`js/${name}`)))).join('\n')}`;
  if (/https?:\/\//i.test(runtimeSources)) error('SECURITY', 'runtime external request found in showcase chrome');
  if (/javascript:|vbscript:|data:text\/html/i.test(runtimeSources)) error('SECURITY', 'unsafe URL scheme found in showcase chrome');
  const localRefs = [...(index + preview).matchAll(/(?:href|src|action|formaction)=["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const reference of localRefs) {
    if (!reference || /^(data:|mailto:|tel:|https?:)/i.test(reference)) continue;
    if (reference.startsWith('#')) {
      const fragment = reference.slice(1);
      if (fragment && !new RegExp(`id=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(index)) error('LINK', `broken showcase fragment link: ${reference}`);
      continue;
    }
    const path = reference.split('#')[0];
    const target = inside(path, 'generated page link');
    if (target && !(await exists(target))) error('LINK', `broken generated page link: ${reference}`);
  }
  const jsonText = await text('data/benchmark.json');
  const chrome = `${index}\n${jsonText}\n${(await Promise.all(jsFiles.filter((name) => name.endsWith('.js')).map((name) => text(`js/${name}`)))).join('\n')}`;
  const normalizedChrome = chrome.replace(/\\[nrt]/g, ' ').replace(/\s+/g, ' ');
  for (const prompt of data.prompts) {
    const contents = await text(prompt.path);
    const normalized = contents.replace(/\s+/g, ' ').trim();
    if (chrome.includes(contents) || chrome.includes(JSON.stringify(contents).slice(1, -1)) || (normalized.length >= 200 && normalizedChrome.includes(normalized.slice(0, 200)))) error('CONTENT', `canonical prompt content duplicated outside its canonical file: ${prompt.id}`);
  }
  const skillContents = await text(data.skill.path);
  const normalizedSkill = skillContents.replace(/\s+/g, ' ').trim();
  if (chrome.includes(skillContents) || chrome.includes(JSON.stringify(skillContents).slice(1, -1)) || (normalizedSkill.length >= 200 && normalizedChrome.includes(normalizedSkill.slice(0, 200)))) error('CONTENT', 'canonical skill content duplicated outside its canonical file');
  const authoredPaths = ['README.md', 'templates/index.template.html', 'templates/social-preview.template.html', 'scripts/build-static-page.mjs', 'scripts/build-dataset.mjs', 'js/app.js', 'evidence/final-report.md', 'evidence/browser-acceptance.md', 'evidence/findings-review.md'];
  const authoredText = `${(await Promise.all(authoredPaths.map((path) => text(path)))).join('\n')}\n${index}\n${jsonText}`;
  const deprecatedClaims = /\b(?:overall winner|benchmark winner|best[- ]performing|outperform(?:s|ed|ing)?|proves? (?:that )?.{0,80}(?:better|superior))\b/i;
  if (/"(?:score|winner|ranking)"\s*:/i.test(jsonText) || deprecatedClaims.test(authoredText)) error('CONTENT', 'publication-authored evaluative claim or invented score/ranking field found');
  for (const phrase of ['Comparison laboratory', 'Three controlled briefs', 'Experimental inputs', 'Batch durations are the primary comparison', 'Public release is blocked until normalized findings receive human review and approval']) {
    if (authoredText.includes(phrase)) error('CONTENT', `deprecated evaluative claim remains in publication-authored copy: ${phrase}`);
  }
  const publicFiles = await walk(root);
  for (const path of publicFiles) if (/(^|\/)[^/]*-old(?:\/|$)/i.test(path)) error('PRIVACY', `forbidden -old artifact is published: ${path}`);
  const privacyFiles = publicFiles.filter((path) => !path.startsWith('tests/') && /\.(?:html|css|js|json|md|txt|svg|xml|ya?ml)$/i.test(path));
  for (const path of privacyFiles) {
    const contents = await text(path);
    if (/C:\\Users\\[^\\\s|]+\\|C:\/Users\/[^/\s|]+\/|\.codex[/\\]attachments|\/home\/[A-Za-z0-9._-]+\//i.test(contents)) error('PRIVACY', `private absolute path found in ${path}`);
    const secretPatterns = [
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /\bAKIA[0-9A-Z]{16}\b/,
      /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
      /\bsk-[A-Za-z0-9_-]{20,}\b/,
      /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._-]{20,}/i,
      /\b(?:api[_-]?key|secret)\s*[:=]\s*["']?(?!<|\$\{|REDACTED|EXAMPLE)[A-Za-z0-9_./+-]{20,}/i
    ];
    if (secretPatterns.some((pattern) => pattern.test(contents))) error('PRIVACY', `credible secret or credential pattern found in ${path}`);
  }
  for (const markdownPath of ['README.md', 'evidence/findings-review.md']) {
    const contents = await text(markdownPath);
    for (const match of contents.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const reference = match[1].split('#')[0];
      if (!reference || /^(https?:|mailto:)/i.test(reference)) continue;
      const target = resolve(dirname(resolve(root, ...markdownPath.split('/'))), ...reference.split('/'));
      if (!(await exists(target))) error('LINK', `broken showcase-authored Markdown link in ${markdownPath}: ${reference}`);
    }
  }
}

async function validateFindings(findings) {
  const reviewStatuses = new Set(['human-review-required', 'human-review-verified-for-archive', 'human-review-rejected']);
  const classificationStatuses = new Set(['editorially-normalized', 'editorially-classified']);
  for (const finding of findings) {
    const target = inside(finding.sourcePath, `finding ${finding.id} source`);
    if (!target || !(await exists(target))) error('FINDINGS', `finding source missing: ${finding.id}`);
    else if (!(await readFile(target, 'utf8')).includes(finding.sourceSection)) error('FINDINGS', `finding source section missing: ${finding.id}`);
    if (!reviewStatuses.has(finding.reviewStatus) || !classificationStatuses.has(finding.classificationStatus)) error('FINDINGS', `finding review metadata uses an unknown status: ${finding.id}`);
    if (finding.severity != null && finding.classificationStatus !== 'editorially-classified') error('FINDINGS', `provisional severity must be editorially classified: ${finding.id}`);
  }
  try {
    const decisions = await json('evidence/findings-review-decisions.json');
    const expected = mergeReviewDecisions(findings, decisions);
    for (let index = 0; index < findings.length; index += 1) {
      for (const field of ['reviewStatus', 'reviewedAt', 'reviewer', 'reviewRationale']) {
        if (findings[index][field] !== expected[index][field]) error('FINDINGS', `finding review merge is inconsistent for ${findings[index].id}: ${field}`);
      }
    }
  } catch (cause) {
    error('FINDINGS', cause.message);
  }
  const review = await text('evidence/findings-review.md');
  for (const finding of findings) {
    const rows = review.split(/\r?\n/).filter((line) => line.startsWith(`| ${finding.id} |`));
    const requiredCells = [
      `| ${finding.detectorId} |`,
      `| \`${finding.evidenceFingerprint}\` |`,
      `| \`${finding.artifactPath}\` |`,
      `| ${finding.reviewStatus} |`,
      `| ${finding.reviewedAt ?? ''} |`
    ];
    if (rows.length !== 1 || requiredCells.some((cell) => !rows[0].includes(cell))) error('FINDINGS', `finding review ledger row is missing or inconsistent: ${finding.id}`);
  }
  if (findings.some((finding) => /fragment link/i.test(`${finding.summary} ${finding.detail}`))) warn('PRESERVED_SOURCE', 'Copied benchmark implementations retain documented broken fragment references; these are not showcase defects.');
}

async function main() {
  try {
    const data = await json('data/benchmark.json');
    const captures = await json('data/capture-provenance.json');
    const findings = await json('data/findings.json');
    const copyMap = await json('evidence/audit/showcase-copy-map.json');
    const manifest = await json('evidence/benchmark-manifest.json');
    await validateStructure(data, manifest);
    await validateCopies(data, copyMap, manifest);
    await validateDependencies();
    await validateGenerated();
    await validateCaptures(data, captures, copyMap);
    await validateSecurityAndContent(data);
    await validateFindings(findings);
    if (!errors.some((item) => ['COPY', 'STRUCTURE', 'PATH'].includes(item.category))) console.log('INTEGRITY: Every implementation copied into the showcase matches its corresponding finalized sanitized publication artifact, excluding no files and applying no showcase-time source modification.');
    console.log('BOUNDARY: Sanitization-stage integrity assurance is governed by evidence/audit/sanitization-report.md; showcase-copy verification does not independently prove equality with unsanitized originals.');
    for (const item of errors) console.log(`ERROR [${item.category}] ${item.message}`);
    for (const item of warnings) console.log(`WARNING [${item.category}] ${item.message}`);
    const pending = findings.filter((finding) => finding.reviewStatus !== 'human-review-verified-for-archive');
    if (pending.length) console.log(`ARCHIVE REVIEW BLOCKER [FINDINGS] ${pending.length} findings lack matching verification for archive.`);
    if (errors.length) {
      console.log(`VALIDATION FAIL errors=${errors.length} warnings=${warnings.length}`);
      process.exitCode = 1;
    } else if (pending.length) {
      console.log(`TECHNICAL VALIDATION PASS errors=0 warnings=${warnings.length}`);
      console.log('NOT READY FOR ARCHIVAL PUBLICATION');
      process.exitCode = allowHumanReviewPending ? 0 : 1;
    } else {
      console.log(`VALIDATION PASS errors=0 warnings=${warnings.length}`);
    }
  } catch (cause) {
    console.log(`ERROR [VALIDATOR] ${cause.stack || cause.message}`);
    console.log('VALIDATION FAIL errors=1 warnings=0');
    process.exitCode = 1;
  }
}

await main();

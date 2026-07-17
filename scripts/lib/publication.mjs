import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

export function resolveInside(root, relativePath) {
  if (!relativePath || isAbsolute(relativePath) || /^[A-Za-z]:[\\/]/.test(relativePath)) {
    throw new Error(`Absolute or empty publication path rejected: ${relativePath}`);
  }
  if (String(relativePath).toLowerCase().includes('-old')) {
    throw new Error(`Superseded publication path rejected: ${relativePath}`);
  }
  const normalizedRoot = resolve(root);
  const candidate = resolve(normalizedRoot, relativePath);
  if (candidate !== normalizedRoot && !candidate.startsWith(`${normalizedRoot}${sep}`)) {
    throw new Error(`Publication path escapes root: ${relativePath}`);
  }
  return candidate;
}

export async function sha256File(filePath) {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

export async function assertExistingInside(root, relativePath) {
  const rootReal = await realpath(root);
  const path = resolveInside(root, relativePath);
  const pathReal = await realpath(path);
  if (pathReal !== rootReal && !pathReal.startsWith(`${rootReal}${sep}`)) {
    throw new Error(`Publication path resolves outside root: ${relativePath}`);
  }
  return path;
}

function modelId(run) {
  return `${run.model.toLowerCase()}-${run.reasoningLevel.toLowerCase()}`;
}

export function validateMatrix(manifest) {
  const expectedModels = new Map([['Luna', 'xhigh'], ['Sol', 'high'], ['Terra', 'xhigh']]);
  const promptByCell = new Map(manifest.prompts.map((prompt) => [`${prompt.case}:${prompt.condition}`, prompt]));
  const expectedIds = new Set();
  for (const caseNumber of [1, 2, 3]) {
    for (const condition of ['new-skill', 'no-skill']) {
      const prompt = promptByCell.get(`${caseNumber}:${condition}`);
      if (!prompt) throw new Error(`Missing canonical prompt for case ${caseNumber} ${condition}`);
      for (const [model, reasoning] of expectedModels) {
        expectedIds.add(`case-${String(caseNumber).padStart(2, '0')}-${condition}-${model.toLowerCase()}-${reasoning}`);
      }
    }
  }
  if (manifest.runs.length !== expectedIds.size) throw new Error('Unexpected run matrix size');
  for (const run of manifest.runs) {
    const expectedReasoning = expectedModels.get(run.model);
    if (!expectedReasoning || run.reasoningLevel.toLowerCase() !== expectedReasoning) {
      throw new Error(`Unexpected model configuration: ${run.model} ${run.reasoningLevel}`);
    }
    if (!expectedIds.delete(run.runId)) throw new Error(`Unexpected or duplicate run ID: ${run.runId}`);
    const prompt = promptByCell.get(`${run.case}:${run.condition}`);
    if (!prompt || run.promptId !== prompt.id || run.promptPath !== prompt.publicPath) {
      throw new Error(`Prompt mapping mismatch: ${run.runId}`);
    }
    const expectedSkill = run.condition === 'new-skill' ? manifest.skill.publicPath : null;
    if ((prompt.skillPath ?? null) !== expectedSkill) throw new Error(`Skill condition mismatch: ${prompt.id}`);
  }
  if (expectedIds.size) throw new Error(`Missing expected runs: ${[...expectedIds].join(', ')}`);
}

export function assertAuditPass(audit) {
  const results = [...audit.matchAll(/^RESULT=.*$/gm)].map((match) => match[0].trim());
  if (results.length !== 1 || results[0] !== 'RESULT=PASS errors=0 warnings=1') {
    throw new Error(`Sanitization audit result is not an unambiguous pass: ${results.join(' | ') || 'missing'}`);
  }
  if (/unresolved\s+(privacy|dataset-integrity)\s+(failure|failures|error|errors|blocker|blockers)/i.test(audit)
    || /(privacy|dataset-integrity)\s+(failure|failures|error|errors|blocker|blockers)[^\n]*unresolved/i.test(audit)) {
    throw new Error('Sanitization audit contains an unresolved blocker');
  }
}

export async function loadAndValidateManifest({
  artifactRoot,
  manifestPath = 'benchmark-manifest.json',
  auditPath = 'audit/sanitization-report.md',
  copyMapPath = null
}) {
  const resolvedManifestPath = await assertExistingInside(artifactRoot, manifestPath);
  const manifest = JSON.parse(await readFile(resolvedManifestPath, 'utf8'));
  let mappedFiles = null;
  if (copyMapPath) {
    const copyMap = JSON.parse(await readFile(await assertExistingInside(artifactRoot, copyMapPath), 'utf8'));
    if (!Array.isArray(copyMap.files)) throw new Error('Showcase copy map must contain a files array');
    mappedFiles = new Map();
    for (const entry of copyMap.files) {
      if (!entry?.sourcePath || !entry.destinationPath || !/^([a-f0-9]{64})$/.test(entry.sha256) || !Number.isInteger(entry.bytes)) {
        throw new Error(`Invalid showcase copy-map entry: ${entry?.sourcePath || 'unknown'}`);
      }
      if (mappedFiles.has(entry.sourcePath)) throw new Error(`Duplicate showcase copy-map source: ${entry.sourcePath}`);
      mappedFiles.set(entry.sourcePath, entry);
    }
  }

  async function resolveManifestArtifact(relativePath) {
    if (!mappedFiles) return assertExistingInside(artifactRoot, relativePath);
    const entry = mappedFiles.get(relativePath);
    if (!entry) throw new Error(`Manifest artifact is missing from showcase copy map: ${relativePath}`);
    const destination = await assertExistingInside(artifactRoot, entry.destinationPath);
    const destinationStat = await stat(destination);
    if (destinationStat.size !== entry.bytes || await sha256File(destination) !== entry.sha256) {
      throw new Error(`Packaged manifest artifact differs from showcase copy map: ${relativePath}`);
    }
    return destination;
  }
  if (manifest.publicationStatus !== 'sanitized') throw new Error('Publication is not marked sanitized');
  if (manifest.runCount !== 18 || manifest.runs?.length !== 18) throw new Error('Expected exactly 18 runs');
  if (manifest.caseCount !== 3) throw new Error('Expected exactly 3 cases');
  if (manifest.prompts?.length !== 6) throw new Error('Expected exactly 6 prompts');
  if (new Set(manifest.runs.map((run) => run.runId)).size !== 18) throw new Error('Run IDs are not unique');
  validateMatrix(manifest);
  for (const run of manifest.runs) {
    const fields = mappedFiles ? ['summaryPath', 'runNotesPath', 'promptPath'] : ['publicPath', 'rawPath', 'summaryPath', 'runNotesPath', 'promptPath'];
    for (const field of fields) {
      if (String(run[field]).includes('-old')) throw new Error(`Superseded path rejected: ${run[field]}`);
      await resolveManifestArtifact(run[field]);
    }
    for (const item of [...(run.rawArtifacts || []), ...(run.screenshots || [])]) {
      if (String(item.publicPath).includes('-old')) throw new Error(`Superseded artifact rejected: ${item.publicPath}`);
      await resolveManifestArtifact(item.publicPath);
    }
  }
  const skillPath = await resolveManifestArtifact(manifest.skill.publicPath);
  if (await sha256File(skillPath) !== manifest.skill.publishedChecksum) throw new Error('Skill checksum mismatch');
  for (const prompt of manifest.prompts) {
    const promptPath = await resolveManifestArtifact(prompt.publicPath);
    if (await sha256File(promptPath) !== prompt.publishedChecksum) throw new Error(`Prompt checksum mismatch: ${prompt.id}`);
  }
  const audit = await readFile(await assertExistingInside(artifactRoot, auditPath), 'utf8');
  assertAuditPass(audit);
  return manifest;
}

export async function copyFileVerified(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { force: true, preserveTimestamps: false });
  const [sourceHash, destinationHash, sourceStat, destinationStat] = await Promise.all([
    sha256File(source), sha256File(destination), stat(source), stat(destination)
  ]);
  if (sourceHash !== destinationHash || sourceStat.size !== destinationStat.size) {
    throw new Error(`Verified copy failed: ${source} -> ${destination}`);
  }
  return { sha256: sourceHash, bytes: sourceStat.size };
}

export async function listFiles(root) {
  const files = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
      else throw new Error(`Non-regular artifact rejected: ${relative(root, path)}`);
    }
  }
  await walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

export function parsePublicationRootArgs(args, { cwd = process.cwd() } = {}) {
  if (!Array.isArray(args) || args.length === 0) throw new Error('Intake requires --publication-root <path>');
  const roots = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== '--publication-root') throw new Error(`Unknown intake argument: ${argument}`);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) throw new Error('--publication-root requires a path');
    roots.push(value);
    index += 1;
  }
  if (roots.length !== 1) throw new Error('--publication-root must be provided exactly once');
  return resolve(cwd, roots[0]);
}

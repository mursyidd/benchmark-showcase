import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertExistingInside, copyFileVerified, listFiles, loadAndValidateManifest, parsePublicationRootArgs, resolveInside } from './lib/publication.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(scriptDir, '..');
const publicationRoot = parsePublicationRootArgs(process.argv.slice(2));
const map = [];

function caseId(value) { return `case-${String(value).padStart(2, '0')}`; }
function modelId(run) { return `${run.model.toLowerCase()}-${run.reasoningLevel.toLowerCase()}`; }

async function copyMapped(sourceRelative, destinationRelative, kind) {
  const source = await assertExistingInside(publicationRoot, sourceRelative);
  const destination = resolveInside(siteRoot, destinationRelative);
  const verified = await copyFileVerified(source, destination);
  map.push({ sourcePath: sourceRelative.replaceAll('\\', '/'), destinationPath: destinationRelative.replaceAll('\\', '/'), kind, ...verified });
}

async function copyDirectory(sourceRelative, destinationRelative, kind) {
  const sourceRoot = resolveInside(publicationRoot, sourceRelative);
  for (const source of await listFiles(sourceRoot)) {
    const suffix = relative(sourceRoot, source);
    await copyMapped(`${sourceRelative}/${suffix.replaceAll('\\', '/')}`, `${destinationRelative}/${suffix.replaceAll('\\', '/')}`, kind);
  }
}

const manifest = await loadAndValidateManifest({ artifactRoot: publicationRoot });
for (const path of ['inputs', 'runs', 'evidence', 'assets/screenshots/derived']) {
  await rm(resolve(siteRoot, path), { recursive: true, force: true });
}
await mkdir(resolve(siteRoot, 'evidence', 'audit'), { recursive: true });

await copyMapped(manifest.skill.publicPath, 'inputs/skill/SKILL.md', 'canonical-skill');
for (const prompt of manifest.prompts) await copyMapped(prompt.publicPath, prompt.publicPath, 'canonical-prompt');

const copiedSummaries = new Set();
for (const run of manifest.runs) {
  const destinationRoot = `runs/${caseId(run.case)}/${run.condition}/${modelId(run)}`;
  await copyDirectory(run.rawPath, destinationRoot, 'sanitized-run-artifact');
  if (!copiedSummaries.has(run.summaryPath)) {
    copiedSummaries.add(run.summaryPath);
    await copyMapped(run.summaryPath, `evidence/summaries/${basename(run.summaryPath)}`, 'summary');
  }
}

for (const [source, destination] of [
  ['README.md', 'evidence/README.md'],
  ['benchmark-manifest.json', 'evidence/benchmark-manifest.json'],
  ['audit/sanitization-report.md', 'evidence/audit/sanitization-report.md'],
  ['audit/excluded-artifacts.md', 'evidence/audit/excluded-artifacts.md'],
  ['audit/source-public-map.json', 'evidence/audit/source-public-map.json']
]) await copyMapped(source, destination, 'publication-evidence');

map.sort((a, b) => a.destinationPath.localeCompare(b.destinationPath));
await writeFile(resolve(siteRoot, 'evidence', 'audit', 'showcase-copy-map.json'), `${JSON.stringify({
  publicationRoot: 'publication/',
  statement: 'Showcase copies match the finalized sanitized publication artifacts from which they were copied.',
  files: map
}, null, 2)}\n`, 'utf8');

const runFiles = map.filter((entry) => entry.kind === 'sanitized-run-artifact').length;
console.log(`INTAKE PASS runs=${manifest.runs.length} prompts=${manifest.prompts.length} skill=1 runFiles=${runFiles} copyErrors=0`);

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertAuditPass, resolveInside, loadAndValidateManifest, validateMatrix } from '../scripts/lib/publication.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagedPublication = {
  artifactRoot: projectRoot,
  manifestPath: 'evidence/benchmark-manifest.json',
  auditPath: 'evidence/audit/sanitization-report.md',
  copyMapPath: 'evidence/audit/showcase-copy-map.json'
};

test('publishing pages have one deterministic generation owner', () => {
  assert.equal(existsSync('templates/index.template.html'), true);
  assert.equal(existsSync('templates/preview.template.html'), true);
  assert.equal(existsSync('scripts/build-static-page.mjs'), true);
  assert.equal(existsSync('.nojekyll'), true);
});

test('development dependencies are exact', async () => {
  const packageJson = JSON.parse(await import('node:fs/promises').then(({ readFile }) => readFile('package.json', 'utf8')));
  assert.equal(packageJson.devDependencies['@playwright/test'], '1.61.1');
  assert.equal(packageJson.devDependencies['@axe-core/playwright'], '4.12.1');
});

test('publication resolver rejects escapes and absolute paths', () => {
  assert.throws(() => resolveInside('../publication', '../secret.txt'));
  assert.throws(() => resolveInside('../publication', 'C:/Users/example/file'));
  assert.throws(() => resolveInside('../publication', 'raw/case-01-old/index.html'));
});

test('sanitized manifest is the complete matrix', async () => {
  const manifest = await loadAndValidateManifest(packagedPublication);
  assert.equal(manifest.runs.length, 18);
  assert.equal(manifest.prompts.length, 6);
  assert.deepEqual([...new Set(manifest.runs.map((run) => run.case))], [1, 2, 3]);
});

test('matrix validation rejects wrong cells and prompt mappings', async () => {
  const manifest = await loadAndValidateManifest(packagedPublication);
  const wrongModel = structuredClone(manifest);
  wrongModel.runs[0].reasoningLevel = 'high';
  assert.throws(() => validateMatrix(wrongModel), /model configuration/i);
  const wrongPrompt = structuredClone(manifest);
  wrongPrompt.runs[0].promptId = wrongPrompt.prompts[1].id;
  assert.throws(() => validateMatrix(wrongPrompt), /prompt mapping/i);
});

test('audit validation rejects multiple, failed, and unresolved results', () => {
  assert.doesNotThrow(() => assertAuditPass('RESULT=PASS errors=0 warnings=1'));
  assert.throws(() => assertAuditPass('RESULT=PASS errors=0 warnings=1\nRESULT=FAIL errors=1 warnings=1'));
  assert.throws(() => assertAuditPass('RESULT=FAIL errors=1 warnings=0'));
  assert.throws(() => assertAuditPass('UNRESOLVED PRIVACY BLOCKER\nRESULT=PASS errors=0 warnings=1'));
});

test('intake requires one explicit publication root and rejects undocumented arguments', async () => {
  const publication = await import('../scripts/lib/publication.mjs');
  assert.equal(typeof publication.parsePublicationRootArgs, 'function');
  assert.equal(
    publication.parsePublicationRootArgs(['--publication-root', '../publication'], { cwd: projectRoot }),
    resolve(projectRoot, '..', 'publication')
  );
  assert.throws(() => publication.parsePublicationRootArgs([], { cwd: projectRoot }), /requires --publication-root/);
  assert.throws(() => publication.parsePublicationRootArgs(['--other', 'value'], { cwd: projectRoot }), /Unknown intake argument/);
  assert.throws(() => publication.parsePublicationRootArgs(['--publication-root'], { cwd: projectRoot }), /requires a path/);
  assert.throws(() => publication.parsePublicationRootArgs([
    '--publication-root', '../one', '--publication-root', '../two'
  ], { cwd: projectRoot }), /exactly once/);
});

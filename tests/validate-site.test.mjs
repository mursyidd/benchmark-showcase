import assert from 'node:assert/strict';
import test from 'node:test';
import { appendFile, cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const projectRoot = resolve('.');
const validator = resolve('scripts/validate-site.mjs');

async function makeFixture() {
  const fixture = await mkdtemp(join(tmpdir(), 'showcase-validator-'));
  await cp(projectRoot, fixture, { recursive: true, filter: (source) => !/node_modules|test-results|playwright-report/.test(source) });
  return fixture;
}

function run(fixture) {
  return spawnSync(process.execPath, [validator, '--root', fixture, '--allow-human-review-pending'], { encoding: 'utf8' });
}

test('validator accepts the generated archival findings ledger', async () => {
  const fixture = await makeFixture();
  const result = run(fixture);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /VALIDATION PASS/);
});

test('validator rejects a direct raw-run link', async () => {
  const fixture = await makeFixture();
  await appendFile(join(fixture, 'index.html'), '<a href="runs/case-01/new-skill/luna-xhigh/index.html">raw</a>');
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /direct raw implementation link/i);
});

test('validator rejects missing capture without a reason', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'data', 'capture-provenance.json');
  const records = JSON.parse(await readFile(path, 'utf8'));
  records[0].path = null;
  records[0].failureReason = null;
  records[0].status = 'failed';
  await writeFile(path, `${JSON.stringify(records, null, 2)}\n`);
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /capture failure reason/i);
});

test('validator rejects stale generated HTML', async () => {
  const fixture = await makeFixture();
  await appendFile(join(fixture, 'index.html'), '<!-- direct edit -->');
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /generated HTML differs/i);
});

test('validator requires the non-evaluative archive scope statement', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'README.md');
  const source = await readFile(path, 'utf8');
  await writeFile(path, source.replace(/This archive documents an 18-run frontend generation exercise[^\r\n]+/, 'Evidence package.'));
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /archive scope statement/i);
});

test('validator rejects publication-authored winner claims', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'README.md');
  await appendFile(path, '\nOverall winner: one configuration.\n');
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /evaluative claim/i);
});

test('validator rejects floating development dependencies', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'package.json');
  const pkg = JSON.parse(await readFile(path, 'utf8'));
  pkg.devDependencies['@playwright/test'] = 'latest';
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /exact dependency version/i);
});

test('validator rejects unknown findings review statuses', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'data', 'findings.json');
  const findings = JSON.parse(await readFile(path, 'utf8'));
  findings[0].reviewStatus = 'human-review-complete-ish';
  await writeFile(path, `${JSON.stringify(findings, null, 2)}\n`);
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /unknown status/i);
});

test('validator rejects an unmapped file in the copied run tree', async () => {
  const fixture = await makeFixture();
  await writeFile(join(fixture, 'runs', 'case-01', 'new-skill', 'luna-xhigh', 'unmapped.txt'), 'unexpected');
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /implementation inventory differs/i);
});

test('validator requires the exact preview sandbox construction contract', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'js', 'preview-controller.js');
  const source = (await readFile(path, 'utf8')).replace("'allow-scripts allow-forms allow-modals'", "'allow-scripts'");
  await writeFile(path, source);
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /exact iframe sandbox contract/i);
});

test('validator rejects credible secrets in publishable text assets', async () => {
  const fixture = await makeFixture();
  await writeFile(join(fixture, 'assets', 'leak.txt'), 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456');
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /credible secret or credential/i);
});

test('validator rejects a malformed matrix even when it still has 18 rows', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'data', 'benchmark.json');
  const data = JSON.parse(await readFile(path, 'utf8'));
  data.runs[0].caseId = 'case-99';
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /matrix identity|Cartesian product/i);
});

test('validator rejects floating versions outside devDependencies', async () => {
  const fixture = await makeFixture();
  const path = join(fixture, 'package.json');
  const pkg = JSON.parse(await readFile(path, 'utf8'));
  pkg.optionalDependencies = { example: '^1.0.0' };
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /optionalDependencies\.example/i);
});

test('validator rejects a forged PNG header with dimensions only', async () => {
  const fixture = await makeFixture();
  const fake = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(fake);
  fake.writeUInt32BE(1440, 16);
  fake.writeUInt32BE(900, 20);
  await writeFile(join(fixture, 'assets', 'screenshots', 'derived', 'case-01-new-skill-luna-xhigh', 'desktop.png'), fake);
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /capture dimensions mismatch/i);
});

test('validator allows passive absolute Open Graph metadata', async () => {
  const fixture = await makeFixture();
  const html = await readFile(join(fixture, 'index.html'), 'utf8');
  assert.match(html, /<meta property="og:url" content="https:\/\/mursyidd\.github\.io\/benchmark-showcase\/">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/mursyidd\.github\.io\/benchmark-showcase\/assets\/social\/benchmark-preview\.png">/);
  const result = run(fixture);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('validator still rejects genuine external runtime requests', async () => {
  const fixture = await makeFixture();
  await appendFile(join(fixture, 'js', 'app.js'), "\nfetch('https://example.com/runtime.json');\n");
  const result = run(fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /runtime external request/i);
});

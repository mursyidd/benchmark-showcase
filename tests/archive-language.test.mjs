import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const scopeStatement = 'This archive documents an 18-run frontend generation exercise across three task types, three model configurations, and two prompting conditions. It is provided as a transparent showcase of the work performed, not as a controlled study, model ranking, or claim that one approach is superior.';
const scopeQualifier = 'It is non-evaluative: it does not identify a winner or support causal conclusions.';

test('README and homepage sources lead with the non-evaluative archive scope', async () => {
  const readme = await readFile('README.md', 'utf8');
  const template = await readFile('templates/index.template.html', 'utf8');
  assert.match(readme, new RegExp(scopeStatement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(template, new RegExp(scopeStatement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(readme, new RegExp(scopeQualifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(template, new RegExp(scopeQualifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(template, /Evidence archive/);
  assert.match(template, /Archived run matrix/);
  assert.match(template, /Three task briefs/);
  assert.match(template, /Archived generation inputs/);
  assert.match(template, /Explore the archive/);
});

test('publication-authored sources contain no deprecated evaluative or approval framing', async () => {
  const paths = [
    'README.md',
    'templates/index.template.html',
    'templates/social-preview.template.html',
    'scripts/build-static-page.mjs',
    'scripts/build-dataset.mjs',
    'js/app.js',
    'evidence/final-report.md',
    'evidence/browser-acceptance.md',
    'evidence/findings-review.md'
  ];
  const text = (await Promise.all(paths.map((path) => readFile(path, 'utf8')))).join('\n');
  for (const phrase of [
    'Comparison laboratory',
    'Three controlled briefs',
    'Experimental inputs',
    'Batch durations are the primary comparison',
    'Public release is blocked until normalized findings receive human review and approval',
    'human-review-approved'
  ]) assert.equal(text.includes(phrase), false, `deprecated publication phrase remains: ${phrase}`);
});

test('generated archive presents archival verification without product acceptance', async () => {
  const index = await readFile('index.html', 'utf8');
  const data = JSON.parse(await readFile('data/benchmark.json', 'utf8'));
  assert.match(index, /transparent showcase of the work performed/);
  assert.match(index, /Verified for archive/);
  assert.match(index, /does not approve (?:the )?interface quality, implementation correctness, or product behavior/i);
  assert.equal(data.benchmark.title, 'Frontend Benchmark Evidence Archive');
  assert.match(data.benchmark.description, /not a controlled study, model ranking, or superiority claim/i);
});

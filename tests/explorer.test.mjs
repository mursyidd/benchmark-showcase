import assert from 'node:assert/strict';
import test from 'node:test';
import { derivedCaptureStatus } from '../js/dialogs.js';
import { readHash } from '../js/router.js';

const schema = {
  $sections: new Set(['overview', 'run-explorer']),
  run: new Set(['case-01-new-skill-luna-xhigh']),
  prompt: new Set(['case-01-new-skill']),
  source: new Set(['case-01-new-skill-luna-xhigh:index.html']),
  case: new Set(['case-01'])
};

test('router accepts only documented exclusive deep links', () => {
  assert.deepEqual(readHash(schema, '#prompt=case-01-new-skill').values, { prompt: 'case-01-new-skill' });
  assert.deepEqual(readHash(schema, '#source=case-01-new-skill-luna-xhigh%3Aindex.html').values, { source: 'case-01-new-skill-luna-xhigh:index.html' });
  assert.equal(readHash(schema, '#run=case-01-new-skill-luna-xhigh&case=case-01').invalid, true);
  assert.equal(readHash(schema, '#prompt=missing').invalid, true);
  assert.equal(readHash(schema, '#nonsense').invalid, true);
  assert.equal(readHash(schema, '#overview').invalid, false);
});

test('derived capture states never disguise unexplained absence as unavailable', () => {
  assert.deepEqual(derivedCaptureStatus({ path: 'capture.png', label: 'Publication-time derived capture' }), { kind: 'captured', text: 'Publication-time derived capture' });
  assert.deepEqual(derivedCaptureStatus({ path: null, failureReason: 'Browser crashed' }), { kind: 'failure', text: 'Capture unavailable · Browser crashed' });
  assert.deepEqual(derivedCaptureStatus(null), { kind: 'missing', text: 'Capture record missing' });
});

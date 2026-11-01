import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepAt } from './useScrollSteps.js';

test('each quarter of the track is one step', () => {
  assert.equal(stepAt(0, 4), 0);
  assert.equal(stepAt(0.2499, 4), 0);
  assert.equal(stepAt(0.25, 4), 1);
  assert.equal(stepAt(0.5, 4), 2);
  assert.equal(stepAt(1, 4), 3);
});

test('progress outside 0..1 clamps to the first and last step', () => {
  assert.equal(stepAt(-0.5, 4), 0);
  assert.equal(stepAt(1.7, 4), 3);
});

test('steps never go backwards as progress grows', () => {
  let last = 0;
  for (let p = -0.1; p <= 1.1; p += 0.01) {
    const step = stepAt(p, 4);
    assert.ok(step >= last);
    last = step;
  }
  assert.equal(last, 3);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickActive } from './useActiveSection.js';

test('no section is active above the first one', () => {
  assert.equal(pickActive([500, 1400, 2300, 3200], 300, false), -1);
});

test('the last section whose top passed the line is active', () => {
  assert.equal(pickActive([-900, 120, 1000, 1900], 300, false), 1);
  assert.equal(pickActive([-2000, -1100, -200, 700], 300, false), 2);
});

test('missing sections are skipped and the bottom selects the last one', () => {
  assert.equal(pickActive([-900, null, 1000, 1900], 300, false), 0);
  assert.equal(pickActive([-900, -300, 100, 600], 300, true), 3);
});

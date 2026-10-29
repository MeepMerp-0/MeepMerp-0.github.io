import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, findInvalidFields, isRateLimited } from './contactRules.js';

const VALID = { name: 'Ada', email: 'ada@example.com', purpose: 'A role', message: 'Hello.' };

test('a complete form has no invalid fields', () => {
  assert.deepEqual(findInvalidFields(VALID), { name: false, email: false, purpose: false, message: false });
});

test('blank and whitespace-only fields are invalid', () => {
  assert.deepEqual(
    findInvalidFields({ name: '', email: '', purpose: ' ', message: '\n\t' }),
    { name: true, email: true, purpose: true, message: true },
  );
});

test('an email needs one @, a dotted domain and no spaces', () => {
  for (const email of ['ada', 'ada@example', 'ada@example.', '@example.com', 'ada@@example.com', 'ada @example.com', ' ada@example.com']) {
    assert.equal(findInvalidFields({ ...VALID, email }).email, true, email);
  }
  for (const email of ['ada@example.com', 'a.b+c@mail.example.co.uk']) {
    assert.equal(findInvalidFields({ ...VALID, email }).email, false, email);
  }
});

test('a message must fit LIMITS.message once trimmed', () => {
  assert.equal(findInvalidFields({ ...VALID, message: ` ${'x'.repeat(LIMITS.message)} ` }).message, false);
  assert.equal(findInvalidFields({ ...VALID, message: 'x'.repeat(LIMITS.message + 1) }).message, true);
});

test('a fourth message within 60 seconds is rate limited', () => {
  const now = 1_000_000;
  assert.equal(isRateLimited([], now), false);
  assert.equal(isRateLimited([now - 2000, now - 1000], now), false);
  assert.equal(isRateLimited([now - 59_999, now - 1000, now], now), true);
  assert.equal(isRateLimited([now - 60_000, now - 1000, now], now), false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrambleFrame } from './motion.js';

test('scrambleFrame keeps length and punctuation and settles left to right', () => {
  const text = 'AI & Full-Stack · 04';
  const f0 = scrambleFrame(text, 0, () => 0);
  assert.equal(f0.length, text.length);
  assert.equal(f0.replace(/[A-Z0-9]/g, '_'), text.replace(/[A-Za-z0-9]/g, '_'));
  assert.equal(scrambleFrame(text, 0.5, () => 0.99).slice(0, 10), text.slice(0, 10));
  assert.equal(scrambleFrame(text, 1), text);
});

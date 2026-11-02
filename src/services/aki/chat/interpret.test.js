import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from './interpret.js';

const answer = (status, body) => interpret({ status, body });
const NETWORK = { kind: 'network' };

test('no answer, an unreadable one and a type it does not know all count as network', () => {
  for (const [status, body] of [[0, null], [502, null], [200, {}], [403, { type: 'session_denied' }]]) {
    assert.deepEqual(answer(status, body), NETWORK, `${status} ${JSON.stringify(body)}`);
  }
});

test('session_required counts only on a 401, and carries its reason', () => {
  const required = { type: 'session_required', reason: 'consent' };
  assert.deepEqual(answer(401, required), { kind: 'session_required', reason: 'consent' });
  assert.deepEqual(answer(200, required), NETWORK);
});

test('a reply needs its text, signature and time; a missing prevSig reads as empty', () => {
  const reply = { type: 'ai', reply: 'Hi', sig: 's2', ts: 5, provider: 'groq' };
  assert.deepEqual(answer(200, reply), { kind: 'ai', reply: 'Hi', sig: 's2', ts: 5, prev: '', provider: 'groq' });
  assert.equal(answer(200, { ...reply, prevSig: 's1' }).prev, 's1');
  for (const broken of [{ reply: 7 }, { sig: null }, { ts: '5' }]) {
    assert.deepEqual(answer(200, { ...reply, ...broken }), NETWORK, JSON.stringify(broken));
  }
});

test('a transcript is trimmed, and an faq answer carries no fields', () => {
  const transcript = answer(200, { type: 'transcript', text: ' Who is Jason?\n', provider: 'groq' });
  assert.deepEqual(transcript, { kind: 'transcript', text: 'Who is Jason?' });
  assert.deepEqual(answer(200, { type: 'transcript', text: null }), NETWORK);
  assert.deepEqual(answer(200, { type: 'faq', reason: 'region' }), { kind: 'faq' });
});

test('provider_unavailable keeps its reason, and a retryAfter only when it is positive, rounded up', () => {
  const unavailable = (retryAfter) => answer(200, { type: 'provider_unavailable', reason: 'disabled', retryAfter });
  assert.deepEqual(unavailable(2.1), { kind: 'unavailable', reason: 'disabled', retryAfter: 3 });
  for (const retryAfter of [undefined, 0, -1, 'soon']) {
    assert.deepEqual(unavailable(retryAfter), { kind: 'unavailable', reason: 'disabled' }, String(retryAfter));
  }
});

test('rate_limited waits 5 s when retryAfter is missing or unreadable, and at least 1 s otherwise', () => {
  const limited = (retryAfter) => answer(429, { type: 'rate_limited', scope: 'site_minute', retryAfter });
  assert.deepEqual(limited(12), { kind: 'rate', scope: 'site_minute', retryAfter: 12 });
  for (const [retryAfter, wait] of [[undefined, 5], ['soon', 5], [0.2, 1], [-3, 1]]) {
    assert.equal(limited(retryAfter).retryAfter, wait, String(retryAfter));
  }
});

test('quota_exhausted keeps resetsAt only when it parses', () => {
  const exhausted = (resetsAt) => answer(429, { type: 'quota_exhausted', scope: 'groq_daily', resetsAt });
  assert.deepEqual(exhausted('2026-10-30T07:00:00.000Z'), { kind: 'quota', resetsAt: Date.UTC(2026, 9, 30, 7) });
  assert.deepEqual(exhausted('tomorrow'), { kind: 'quota' });
});

test('invalid_request carries its error', () => {
  assert.deepEqual(answer(400, { type: 'invalid_request', error: 'message_too_long' }), {
    kind: 'invalid', error: 'message_too_long',
  });
});

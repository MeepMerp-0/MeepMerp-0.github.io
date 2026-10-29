import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';
import { chatOutcome, toVoiceResult, voiceNote } from './outcomes.js';

const FAILED = { note: MSG.failure, mood: { state: 'error', ms: 2000 } };
const cooldown = (seconds, siteWide, announcement) => ({ cooldown: { seconds, siteWide, announcement } });

test('an answer clears the box, marks the connection ok and carries what history stores', () => {
  const res = { kind: 'ai', reply: 'Hello!', sig: 'sig2', ts: 1000, prev: 'sig1', provider: 'groq' };
  assert.deepEqual(chatOutcome(res), {
    draft: 'clear',
    connection: 'ok',
    reply: { content: 'Hello!', sig: 'sig2', ts: 1000, prev: 'sig1' },
    mood: { state: 'speaking', ms: 1150 },
  });
});

test('the speaking face lasts longer for a longer answer, up to 4 seconds', () => {
  const ms = (reply) => chatOutcome({ kind: 'ai', reply, sig: 's', ts: 0, prev: '' }).mood.ms;
  assert.equal(ms(''), 1000);
  assert.equal(ms('x'.repeat(120)), 4000);
  assert.equal(ms('x'.repeat(500)), 4000);
});

test('every other result gives the message back and says what changed', () => {
  const cases = [
    [{ kind: 'faq' }, { quickOnly: true, note: MSG.region }],
    [{ kind: 'consent' }, { consent: true }],
    [{ kind: 'rate', scope: 'ip', retryAfter: 5 }, cooldown(5, false, MSG.retry(5))],
    [{ kind: 'rate', scope: 'site_minute', retryAfter: 9 }, cooldown(9, true, MSG.veryBusy(9))],
    [{ kind: 'rate', scope: 'queue_full', retryAfter: 2 }, cooldown(2, true, MSG.veryBusy(2))],
    [{ kind: 'updated' }, { note: MSG.updated }],
    [{ kind: 'quota' }, { connection: 'down', quickOnly: true, quotaUntil: undefined, note: MSG.quota(undefined) }],
    [{ kind: 'unavailable', reason: 'content_blocked' }, { note: MSG.blocked }],
    [
      { kind: 'unavailable', reason: 'groq_busy', retryAfter: 4 },
      { connection: 'busy', ...cooldown(4, true, MSG.veryBusy(4)) },
    ],
    [{ kind: 'unavailable', reason: 'groq_busy' }, { connection: 'busy', ...FAILED }],
    [{ kind: 'unavailable', reason: 'groq_failed' }, { connection: 'down', ...FAILED }],
    [{ kind: 'unavailable', reason: 'disabled' }, { connection: 'down', ...FAILED }],
    [{ kind: 'unavailable' }, { connection: 'down', ...FAILED }],
    [{ kind: 'network' }, { connection: 'down', ...FAILED }],
    [{ kind: 'invalid', error: 'bad_request' }, { connection: 'down', ...FAILED }],
    [{ kind: 'session_required', reason: 'expired' }, FAILED],
    [{ kind: 'transcript', text: 'hello' }, FAILED],
    [{ kind: 'something new' }, FAILED],
  ];
  for (const [res, outcome] of cases) {
    assert.deepEqual(chatOutcome(res), { draft: 'restore', ...outcome }, JSON.stringify(res));
  }
});

test('a quota with a reset time names it and brings chat back then', () => {
  const resetsAt = Date.UTC(2026, 9, 30, 6, 0);
  const at = new Date(resetsAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  assert.deepEqual(chatOutcome({ kind: 'quota', resetsAt }), {
    draft: 'restore', connection: 'down', quickOnly: true, quotaUntil: resetsAt, note: MSG.quota(`after ${at}`),
  });
});

test('each failure gets its own mood object, so the error face restarts its timer', () => {
  assert.notEqual(chatOutcome({ kind: 'network' }).mood, chatOutcome({ kind: 'network' }).mood);
});

test('a transcript becomes the text', () => {
  assert.deepEqual(toVoiceResult({ kind: 'transcript', text: 'hello Aki' }), { text: 'hello Aki' });
});

test('every other transcription result becomes an error code', () => {
  const cases = [
    [{ kind: 'consent' }, 'consent'],
    [{ kind: 'faq' }, 'region'],
    [{ kind: 'updated' }, 'updated'],
    [{ kind: 'rate', scope: 'ip', retryAfter: 5 }, 'busy'],
    [{ kind: 'unavailable', reason: 'stt_busy', retryAfter: 3 }, 'busy'],
    [{ kind: 'unavailable', reason: 'stt_failed' }, 'unavailable'],
    [{ kind: 'unavailable' }, 'unavailable'],
    [{ kind: 'quota', resetsAt: 0 }, 'unavailable'],
    [{ kind: 'network' }, 'unavailable'],
    [{ kind: 'invalid', error: 'bad_request' }, 'unavailable'],
  ];
  for (const [res, error] of cases) assert.deepEqual(toVoiceResult(res), { error }, JSON.stringify(res));
});

test('each voice error code has its note, and any other code the general one', () => {
  const cases = {
    'not-allowed': MSG.micBlocked,
    network: MSG.voiceNetwork,
    region: MSG.region,
    updated: MSG.updated,
    busy: MSG.voiceBusy,
    unavailable: MSG.voiceDown,
    'audio-capture': MSG.voiceFailed,
    start: MSG.voiceFailed,
  };
  for (const [code, note] of Object.entries(cases)) assert.equal(voiceNote(code), note, code);
});

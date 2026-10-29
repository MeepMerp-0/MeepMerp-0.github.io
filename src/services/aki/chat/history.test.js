import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIP_CP, KEEP_MS, MAX_HISTORY_CP, MAX_HISTORY_ENTRIES, REPLY_MAX_AGE_MS, buildWindow, parseHistory, prune,
} from './history.js';

const NOW = Date.UTC(2026, 9, 29, 9);

// Pair n, sent `age` ms before NOW, its reply chained to pair n - 1's.
const pair = (n, { age = 0, reply = `a${n}`, prev = n > 1 ? `s${n - 1}` : '' } = {}) => [
  { role: 'user', content: `q${n}`, ts: NOW - age },
  { role: 'assistant', content: reply, sig: `s${n}`, prev, ts: NOW - age },
];
const sent = (msgs) => buildWindow(msgs, NOW).history.map((m) => m.content);

test('parseHistory keeps well-formed entries and rejects a malformed record', () => {
  const [q, a] = pair(1);
  const bad = [null, { ...q, ts: 'now' }, { ...q, role: 'system' }, { ...a, content: 7 }, { ...a, prev: null }];
  const stored = JSON.stringify({ mid: 'm', messages: [q, a, ...bad] });
  assert.deepEqual(parseHistory(stored), { mid: 'm', messages: [q, a] });
  for (const raw of [null, 'not json', '[]', '{"messages":[]}', '{"mid":"m","messages":{}}']) {
    assert.equal(parseHistory(raw), null, String(raw));
  }
});

test('prune keeps a pair exactly KEEP_MS old and drops a pair with any older message', () => {
  const [q1, a1] = pair(1, { age: KEEP_MS });
  const [q2, a2] = pair(2);
  const h = { mid: 'm', messages: [q1, a1, { ...q2, ts: NOW - KEEP_MS - 1 }, a2] };
  assert.deepEqual(prune(h, NOW), { mid: 'm', messages: [q1, a1] });
});

test('buildWindow sends user text and signed replies only', () => {
  assert.deepEqual(buildWindow(pair(1), NOW), {
    prevSig: '',
    history: [{ role: 'user', content: 'q1' }, { role: 'assistant', content: 'a1', sig: 's1', ts: NOW }],
  });
});

test('buildWindow sends the last MAX_HISTORY_ENTRIES entries, chained to the reply before them', () => {
  const msgs = [1, 2, 3, 4, 5].flatMap((n) => pair(n));
  const win = buildWindow(msgs, NOW);
  assert.deepEqual(win.history.map((m) => m.content), msgs.slice(-MAX_HISTORY_ENTRIES).map((m) => m.content));
  assert.equal(win.prevSig, msgs.at(-MAX_HISTORY_ENTRIES - 1).sig);
});

test('buildWindow starts after a reply older than REPLY_MAX_AGE_MS', () => {
  assert.deepEqual(sent([...pair(1, { age: REPLY_MAX_AGE_MS }), ...pair(2)]), ['q1', 'a1', 'q2', 'a2']);
  assert.deepEqual(sent([...pair(1, { age: REPLY_MAX_AGE_MS + 1 }), ...pair(2)]), ['q2', 'a2']);
  // An empty window still chains to the newest reply.
  assert.deepEqual(buildWindow(pair(1, { age: REPLY_MAX_AGE_MS + 1 }), NOW), { prevSig: 's1', history: [] });
});

test('buildWindow starts at a reply that does not chain to the one before', () => {
  const win = buildWindow([...pair(1), ...pair(2), ...pair(3, { prev: 'other tab' })], NOW);
  assert.deepEqual(win.history.map((m) => m.content), ['q3', 'a3']);
  assert.equal(win.prevSig, 'other tab');
});

test('buildWindow clips each reply to CLIP_CP code points', () => {
  // One code point, two UTF-16 units.
  const [, reply] = buildWindow(pair(1, { reply: '\u{1F600}'.repeat(CLIP_CP + 1) }), NOW).history;
  assert.equal(reply.content, '\u{1F600}'.repeat(CLIP_CP));
});

test('buildWindow drops whole pairs from the front until the window fits MAX_HISTORY_CP', () => {
  // The three replies fill the budget exactly, so the questions push it over.
  const third = 'x'.repeat(MAX_HISTORY_CP / 3);
  assert.deepEqual(sent([1, 2, 3].flatMap((n) => pair(n, { reply: third }))), ['q2', third, 'q3', third]);
});

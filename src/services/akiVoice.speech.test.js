// Speech mode on a fake recognizer: it records the calls made to it, and the test plays the browser by firing its
// result, error and end events. The pointer reads as coarse, so there is no second capture and no Web Audio.
import { test } from 'node:test';
import assert from 'node:assert/strict';

let recognizer;
class FakeRecognition {
  calls = [];
  constructor() { recognizer = this; }
  start() { this.calls.push('start'); }
  stop() { this.calls.push('stop'); }
  abort() { this.calls.push('abort'); }
}
globalThis.window = globalThis;
globalThis.SpeechRecognition = FakeRecognition;
globalThis.matchMedia = () => ({ matches: true });
const { END_MS, VOICE_MODE, listen } = await import('./akiVoice.js?speech');

// A turn that logs every callback in order, so a missing or repeated one fails the test.
function start(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const v = { log: [] };
  v.turn = listen({
    onText: (s) => v.log.push(['text', s]),
    onDone: (s) => v.log.push(['done', s]),
    onError: (code) => v.log.push(['error', code]),
  });
  v.rec = recognizer;
  return v;
}
// A result event: every phrase heard so far, the way the browser resends them.
const heard = (...phrases) => ({ results: phrases.map((transcript) => [{ transcript }]) });

test('speech mode is picked where the browser has a recognizer', () => assert.equal(VOICE_MODE, 'speech'));

test('speech: a finished question stops the recognizer after END_MS.done of silence, not a millisecond sooner', (t) => {
  const v = start(t);
  v.rec.onresult(heard('What does Jason build?'));
  t.mock.timers.tick(END_MS.done - 1);
  assert.deepEqual(v.rec.calls, ['start']);
  t.mock.timers.tick(1);
  assert.deepEqual(v.rec.calls, ['start', 'stop']);
  assert.deepEqual(v.log, [['text', 'What does Jason build?']]);
  v.rec.onend();
  assert.deepEqual(v.log, [['text', 'What does Jason build?'], ['done', 'What does Jason build?']]);
});

test('speech: no-speech is a quiet end with no words', (t) => {
  const v = start(t);
  v.rec.onerror({ error: 'no-speech' });
  v.rec.onend();
  assert.deepEqual(v.log, [['done', '']]);
});

test('speech: a refused mic fails once, with no end event after it (Safari) or with one (Chrome)', (t) => {
  const v = start(t);
  v.rec.onerror({ error: 'not-allowed' });
  assert.deepEqual(v.log, [['error', 'not-allowed']]);
  v.rec.onend();
  assert.deepEqual(v.log, [['error', 'not-allowed']]);
});

test('speech: after abort() no callback fires', (t) => {
  const v = start(t);
  v.rec.onresult(heard('Tell me'));
  v.turn.abort();
  v.rec.onresult(heard('Tell me', 'about Jason.'));
  t.mock.timers.tick(END_MS.pausing);
  v.rec.onerror({ error: 'aborted' });
  v.rec.onend();
  assert.deepEqual(v.log, [['text', 'Tell me']]);
  assert.deepEqual(v.rec.calls, ['start', 'abort']);
});

test('speech: a start() the browser refuses fails with "start" a microtask later', async (t) => {
  t.mock.method(FakeRecognition.prototype, 'start', () => { throw new Error('already started'); });
  const v = start(t);
  assert.deepEqual(v.log, []);
  await Promise.resolve();
  assert.deepEqual(v.log, [['error', 'start']]);
});

test('speech: results after stop() update the words but never restart the wait', (t) => {
  const v = start(t);
  v.rec.onresult(heard('Tell me about'));
  v.turn.stop();
  // Chrome starts later results with a space.
  v.rec.onresult(heard('Tell me about', ' his projects'));
  t.mock.timers.tick(END_MS.pausing);
  assert.deepEqual(v.rec.calls, ['start', 'stop']);
  v.rec.onend();
  assert.deepEqual(v.log, [
    ['text', 'Tell me about'],
    ['text', 'Tell me about his projects'],
    ['done', 'Tell me about his projects'],
  ]);
});

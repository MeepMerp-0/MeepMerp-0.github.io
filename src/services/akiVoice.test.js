// endDelay and the mode under Node, then the record backend on fakes. akiVoice.speech.test.js covers speech mode.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { END_MS, VOICE_MODE, VOICE_SUPPORTED, endDelay } from './akiVoice.js';

const cases = {
  // Whisper ends nearly every phrase with a mark; a joining word or filler before it is still mid-thought.
  pausing: ['tell me about his projects and', 'so um', 'what about the', 'his projects,', 'well...', 'hmm', '他的项目，',
    'Tell me about his projects and.', 'Um.'],
  // A question mark is a finished question even after a joining word.
  done: ['What does Jason build?', 'Tell me about Jason.', 'What is it about?', 'Where is he from?'],
  // Whole words only: "brand" ends in "and" but is not a joining word.
  plain: ['tell me about his projects', '   ', 'his brand'],
};

for (const [kind, texts] of Object.entries(cases)) {
  for (const t of texts) test(`${kind}: ${JSON.stringify(t)}`, () => assert.equal(endDelay(t), END_MS[kind]));
}

test('no voice mode under Node (no window, no MediaRecorder)', () => {
  assert.equal(VOICE_SUPPORTED, false);
  assert.equal(VOICE_MODE, null);
});

// Record mode on fakes: a mic whose loudness the test sets, a recorder with one 1-byte chunk per timeslice, and a
// mocked clock. They exist before a second copy of the module loads, so that copy picks record mode.
let loud = 0;
globalThis.AudioContext = class {
  createAnalyser() { return { getFloatTimeDomainData: (buf) => buf.fill(loud) }; }
  createMediaStreamSource() { return { connect() {} }; }
  close() { return Promise.resolve(); }
};
globalThis.MediaRecorder = class {
  static isTypeSupported = (type) => type === 'audio/webm;codecs=opus';
  state = 'inactive';
  start(ms) { this.state = 'recording'; this.timer = setInterval(() => this.ondataavailable({ data: new Blob(['x']) }), ms); }
  stop() { clearInterval(this.timer); this.state = 'inactive'; this.ondataavailable({ data: new Blob(['x']) }); this.onstop?.(); }
};
Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => ({ getTracks: () => [] }) } });
const record = await import('./akiVoice.js?record');

const flush = () => new Promise((resolve) => setTimeout(resolve));
// Moves the clock one pause-detection interval at a time, letting each upload's answer land.
async function wait(t, ms) {
  for (let n = 0; n < ms; n += 50) { t.mock.timers.tick(50); await flush(); }
}
async function speak(t, ms) { loud = 0.2; await wait(t, ms); loud = 0; }
// A turn whose uploads are answered with `replies`, in order.
async function start(t, replies) {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const v = { texts: [], uploads: [] };
  v.turn = record.listen({
    onText: (s) => v.texts.push(s),
    onDone: (s) => { v.result = s; },
    onError: (code) => { v.result = { error: code }; },
    transcribe: async (blob) => { v.uploads.push(blob.size); return { text: replies.shift() }; },
  });
  await flush();
  return v;
}

test('record mode is picked where MediaRecorder and getUserMedia exist', () => assert.equal(record.VOICE_MODE, 'record'));

test('record: a pause mid-thought keeps listening; new speech makes that partial stale', async (t) => {
  const v = await start(t, ['Tell me about his projects and.', 'Tell me about his projects and his clients.']);
  await speak(t, 500);
  await wait(t, 2000);
  assert.deepEqual(v.texts, ['Tell me about his projects and.']);
  assert.equal(v.result, undefined);
  await speak(t, 500);
  await wait(t, 1300);
  assert.equal(v.result, 'Tell me about his projects and his clients.');
  // The second upload is the whole recording so far, not only the new speech.
  assert.equal(v.uploads.length, 2);
  assert.ok(v.uploads[1] > v.uploads[0]);
});

test('record: a finished sentence ends the turn after the minimum silence, not END_MS.done', async (t) => {
  const v = await start(t, ['What does Jason build?']);
  await speak(t, 500);
  await wait(t, 1000);
  assert.equal(v.result, undefined);
  await wait(t, 300);
  assert.equal(v.result, 'What does Jason build?');
  assert.equal(v.uploads.length, 1);
});

test('record: no speech ends empty with no upload', async (t) => {
  const v = await start(t, []);
  await wait(t, 8100);
  assert.equal(v.result, '');
  assert.equal(v.uploads.length, 0);
});

test('record: stop() with an up-to-date partial sends no extra request', async (t) => {
  const v = await start(t, ['Hello there.']);
  await speak(t, 500);
  await wait(t, 800);
  v.turn.stop();
  assert.equal(v.result, 'Hello there.');
  assert.equal(v.uploads.length, 1);
});

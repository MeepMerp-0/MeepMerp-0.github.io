// endDelay only: listen() needs a browser's speech recognition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { END_MS, VOICE_SUPPORTED, endDelay } from './akiVoice.js';

const cases = {
  pausing: ['tell me about his projects and', 'so um', 'what about the', 'his projects,', 'well...', 'hmm', '他的项目，'],
  done: ['What does Jason build?', 'Tell me about Jason.'],
  // Whole words only: "brand" ends in "and" but is not a joining word.
  plain: ['tell me about his projects', '   ', 'his brand'],
};

for (const [kind, texts] of Object.entries(cases)) {
  for (const t of texts) test(`${kind}: ${JSON.stringify(t)}`, () => assert.equal(endDelay(t), END_MS[kind]));
}

test('VOICE_SUPPORTED is false under Node (no window)', () => {
  assert.equal(VOICE_SUPPORTED, false);
});

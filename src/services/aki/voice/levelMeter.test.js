// LevelMeter on a fake Web Audio graph: what it reads before, during and after a capture, and a mic stream that
// arrives after close().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LevelMeter } from './levelMeter.js';

let contextsClosed = 0;
globalThis.AudioContext = class {
  createAnalyser() { return { getFloatTimeDomainData: (samples) => samples.fill(0.125) }; }
  createMediaStreamSource() { return { connect() {} }; }
  close() { contextsClosed += 1; return Promise.resolve(); }
};
// A mic stream that counts how often its track is stopped.
function micStream() {
  const stream = { stopped: 0 };
  stream.getTracks = () => [{ stop: () => { stream.stopped += 1; } }];
  return stream;
}

test('the level is 0 before a stream is attached, measured while it is, and 0 again after close()', () => {
  contextsClosed = 0;
  const meter = new LevelMeter(512);
  const stream = micStream();
  assert.equal(meter.rms(), 0);
  assert.equal(meter.attach(stream), true);
  assert.equal(meter.rms(), 0.125);
  assert.equal(meter.level(), 0.75);
  meter.close();
  meter.close();
  assert.equal(meter.level(), 0);
  assert.equal(stream.stopped, 1);
  assert.equal(contextsClosed, 1);
});

test('a stream that arrives after close() is stopped at once and never measured', () => {
  const meter = new LevelMeter(512);
  meter.close();
  const stream = micStream();
  assert.equal(meter.attach(stream), false);
  assert.equal(stream.stopped, 1);
  assert.equal(meter.rms(), 0);
});

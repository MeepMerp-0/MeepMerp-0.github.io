import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CORE, CORE_CLEARANCE, SIGNAL, activeStage, cameraAt, signalAt, stageWeights, typeAt } from './heroMotion.js';

const samples = Array.from({ length: 401 }, (_, i) => i / 400);

test('the signal holds at Inputs, reaches the core mid-journey and rests at Application', () => {
  assert.equal(signalAt(0), 0);
  assert.equal(signalAt(SIGNAL.start), 0);
  assert.equal(signalAt(SIGNAL.core), 0.5);
  assert.equal(signalAt(SIGNAL.end), 1);
  assert.equal(signalAt(1), 1);
  samples.slice(1).forEach((p, i) => assert.ok(signalAt(p) >= signalAt(samples[i]), `monotonic at ${p}`));
});

test('every value is a pure function of progress, so reversing restores the same frame', () => {
  for (const p of samples) {
    assert.deepEqual(cameraAt(p, 1.6), cameraAt(p, 1.6));
    assert.deepEqual(stageWeights(p), stageWeights(p));
    assert.deepEqual(typeAt(p), typeAt(p));
  }
});

test('stages run Inputs, Intelligence, Application with bounded emphasis', () => {
  assert.equal(activeStage(0), 0);
  assert.equal(activeStage(0.5), 1);
  assert.equal(activeStage(1), 2);
  for (const p of samples) {
    stageWeights(p).forEach((w) => assert.ok(w >= 0 && w <= 1));
    const w = stageWeights(p);
    // At a boundary two stages tie; the active one is never weaker than the strongest.
    assert.ok(w[activeStage(p)] >= Math.max(...w) - 1e-9, `strongest stage at ${p}`);
  }
});

test('the camera keeps clear of the core at every progress and aspect ratio', () => {
  for (const aspect of [0.4, 0.75, 1, 1.6, 2.4, 3]) {
    for (const p of samples) {
      const { position } = cameraAt(p, aspect);
      const d = Math.hypot(...position.map((v, i) => v - CORE[i]));
      assert.ok(d >= CORE_CLEARANCE - 1e-9, `distance ${d} at p=${p}, aspect=${aspect}`);
      position.forEach((v) => assert.ok(Number.isFinite(v)));
    }
  }
});

test('the camera moves in for the core and opens out for Application', () => {
  const dist = (p) => Math.hypot(...cameraAt(p).position.map((v, i) => v - CORE[i]));
  assert.ok(dist(SIGNAL.core) < dist(0) * 0.5);
  assert.ok(dist(1) > dist(SIGNAL.core) * 2);
  assert.ok(cameraAt(1).target[0] > 2, 'the end view is centred toward Application');
});

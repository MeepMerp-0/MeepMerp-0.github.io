import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CORE, CORE_CLEARANCE, HERO_FOV, SIGNAL, activeStage, cameraAt, signalAt, stageWeights, typeAt,
} from './heroMotion.js';

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

// Projects a world point to normalised device coordinates for the scene camera (up is +y, looking at the target).
function project(point, { position, target }, aspect) {
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  const unit = (a) => a.map((v) => v / Math.hypot(...a));
  const forward = unit(sub(target, position));
  const right = unit([-forward[2], 0, forward[0]]);
  const up = [right[1] * forward[2] - right[2] * forward[1], right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0]];
  const v = sub(point, position);
  const depth = dot(v, forward);
  const half = Math.tan((HERO_FOV * Math.PI) / 360);
  return { x: dot(v, right) / (depth * half * aspect), y: dot(v, up) / (depth * half), depth };
}

const corners = ([x0, x1], [y0, y1], [z0, z1]) =>
  [x0, x1].flatMap((x) => [y0, y1].flatMap((y) => [z0, z1].map((z) => [x, y, z])));

test('the layers stay inside the frame at the ends, and the core at the middle, for common canvas shapes', () => {
  const margin = 0.96;
  const half = Math.tan((HERO_FOV * Math.PI) / 360);
  // Layer extents from the spec. The core is a sphere of radius 1.4, so its half-size in the frame is that radius
  // over the depth of its centre.
  const layers = [
    corners([-6.2, -2.2], [-1, 1.4], [-2.8, -0.2]),
    corners([1.9, 4.9], [-1, 1.4], [-2.3, -0.6]),
  ].flat();
  const coreFits = (cam, aspect, label) => {
    const c = project(CORE, cam, aspect);
    assert.ok(Math.abs(c.x) + 1.4 / (c.depth * half * aspect) <= margin, `core fits across ${label}`);
    assert.ok(Math.abs(c.y) + 1.4 / (c.depth * half) <= margin, `core fits down ${label}`);
  };
  for (const aspect of [0.97, 1.2, 1.74]) {
    for (const p of [0, 1]) {
      const cam = cameraAt(p, aspect);
      layers.map((pt) => project(pt, cam, aspect)).forEach((q) => {
        assert.ok(q.depth > 0, `in front of the camera at p=${p}, aspect=${aspect}`);
        const inside = Math.abs(q.x) <= margin && Math.abs(q.y) <= margin;
        assert.ok(inside, `inside at p=${p}, aspect=${aspect}: ${q.x}, ${q.y}`);
      });
      coreFits(cam, aspect, `at p=${p}, aspect=${aspect}`);
    }
    coreFits(cameraAt(0.5, aspect), aspect, `at p=0.5, aspect=${aspect}`);
  }
});

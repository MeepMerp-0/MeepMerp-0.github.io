import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CORE, CORE_CLEARANCE, HERO_FOV, SIGNAL, ZOOM_END, activeStage, cameraAt, signalAt, stageWeights, typeAt,
} from './heroMotion.js';

const samples = Array.from({ length: 401 }, (_, i) => i / 400);

test('the signal holds at Inputs, reaches the core mid-journey and rests at Application', () => {
  assert.equal(signalAt(0), 0);
  assert.equal(signalAt(SIGNAL.start), 0);
  assert.equal(signalAt(SIGNAL.core), 0.5);
  assert.equal(signalAt(SIGNAL.end), 1);
  assert.equal(signalAt(1), 1);
  assert.deepEqual([SIGNAL.start, SIGNAL.core, SIGNAL.end], [0.08, 0.45, 0.72]);
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
  assert.equal(activeStage(0.26), 0);
  assert.equal(activeStage(0.45), 1);
  assert.equal(activeStage(0.61), 2);
  assert.equal(activeStage(1), 2);
  // Stages never go backwards as progress grows.
  samples.slice(1).forEach((p, i) => assert.ok(activeStage(p) >= activeStage(samples[i]), `stage order at ${p}`));
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

test('the camera moves in for the core, opens toward Application, then zooms out wider than the opening', () => {
  const dist = (p) => Math.hypot(...cameraAt(p).position.map((v, i) => v - CORE[i]));
  assert.ok(dist(SIGNAL.core) < dist(0) * 0.65);
  assert.ok(cameraAt(SIGNAL.end).target[0] > 1.5, 'the third beat is centred toward Application');
  const from = cameraAt(0).target;
  for (const aspect of [0.97, 1.2, 1.74, 1.76]) {
    const away = (p) => Math.hypot(...cameraAt(p, aspect).position.map((v, i) => v - from[i]));
    assert.ok(away(1) >= 1.15 * away(0), `final view is wider than the opening at aspect=${aspect}`);
    assert.deepEqual(cameraAt(ZOOM_END, aspect), cameraAt(1, aspect), 'the last beat holds');
    assert.deepEqual(cameraAt(0.04, aspect), cameraAt(0, aspect), 'the first beat holds');
  }
});

test('the camera is continuous, with no jump between beats', () => {
  for (const aspect of [0.97, 1.76]) {
    let prev = cameraAt(0, aspect);
    for (let i = 1; i <= 2000; i += 1) {
      const cur = cameraAt(i / 2000, aspect);
      [['position', cur.position, prev.position], ['target', cur.target, prev.target]].forEach(([name, a, b]) => {
        assert.ok(Math.hypot(...a.map((v, k) => v - b[k])) < 0.05, `${name} jumps at p=${i / 2000}, aspect=${aspect}`);
      });
      prev = cur;
    }
  }
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

test('the framing rules hold for common canvas shapes', () => {
  const margin = 0.96;
  const half = Math.tan((HERO_FOV * Math.PI) / 360);
  // Layer extents from the spec (r3), labels included. The core's outer spokes reach 1.42 from its centre, and the
  // hexagon with its inner fins fills a disc of about 0.9; a disc's half-size in the frame is its radius over the depth
  // of its centre.
  const inputs = corners([-3.14, -1.46], [-0.42, 1.5], [-3.04, -2.96]);
  const intelligence = corners([-1.42, 1.42], [-1.02, 2.1], [-3.2, -2.8]);
  const application = corners([1.88, 4.04], [-0.66, 1.76], [-3.04, -2.96]);
  // Frame extent of a layer: {x0, x1, y0, y1} in normalised device coordinates; every point must be in front of the camera.
  const frame = (points, cam, aspect) => {
    const q = points.map((pt) => project(pt, cam, aspect));
    assert.ok(q.every((v) => v.depth > 0), 'in front of the camera');
    const xs = q.map((v) => v.x);
    const ys = q.map((v) => v.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  const coreFrame = (cam, aspect, radius) => {
    const c = project(CORE, cam, aspect);
    const rx = radius / (c.depth * half * aspect);
    const ry = radius / (c.depth * half);
    return { x0: c.x - rx, x1: c.x + rx, y0: c.y - ry, y1: c.y + ry };
  };
  const inside = (f) => f.x0 >= -margin && f.x1 <= margin && f.y0 >= -margin && f.y1 <= margin;
  for (const aspect of [0.97, 1.2, 1.74, 1.76]) {
    const at = `aspect=${aspect}`;
    // Overview: all three layers and their labels in frame, together filling at least 75 % of the frame's width.
    const cam0 = cameraAt(0, aspect);
    const layers = [inputs, intelligence, application].map((l) => frame(l, cam0, aspect));
    layers.forEach((f, i) => assert.ok(inside(f), `layer ${i} inside at p=0, ${at}: ${JSON.stringify(f)}`));
    const span = Math.max(...layers.map((f) => f.x1)) - Math.min(...layers.map((f) => f.x0));
    assert.ok(span >= 0.75 * 2, `layers fill 75% of the width at p=0, ${at}: ${span / 2}`);
    // The overview is frontal: nearly level, slightly above, and nearly head-on.
    const eye = cam0.position.map((v, i) => v - cam0.target[i]);
    assert.ok(Math.abs(eye[0]) < 0.1 * Math.hypot(...eye) && eye[1] > 0 && eye[1] < 0.2 * Math.hypot(...eye), `frontal at p=0, ${at}`);
    // Close-up: the hexagon and inner fins fill most of the frame's height, seen a little off-axis.
    const cam5 = cameraAt(SIGNAL.core, aspect);
    const focus = coreFrame(cam5, aspect, 0.9);
    assert.ok(inside(focus), `hexagon and inner fins inside at p=0.45, ${at}: ${JSON.stringify(focus)}`);
    const eye5 = cam5.position.map((v, i) => v - CORE[i]);
    assert.ok(Math.abs(eye5[0]) > 0.15 * Math.hypot(...eye5), `off-axis at p=0.45, ${at}`);
    if (aspect >= 1.74) assert.ok(focus.y1 - focus.y0 >= 0.8 * 2, `fills the height at p=0.45, ${at}: ${(focus.y1 - focus.y0) / 2}`);
    // Third beat: Application is in frame, large and right of centre, and the core is partly in frame. Inputs may leave.
    const cam72 = cameraAt(SIGNAL.end, aspect);
    const [c72, a72] = [coreFrame(cam72, aspect, 1.42), frame(application, cam72, aspect)];
    assert.ok(c72.x1 > -margin && c72.x0 < margin, `core partly in frame at p=0.72, ${at}`);
    assert.ok(inside(a72), `Application inside at p=0.72, ${at}: ${JSON.stringify(a72)}`);
    assert.ok((a72.x1 - a72.x0) >= 0.35 * 2, `Application fills 35% of the width at p=0.72, ${at}: ${(a72.x1 - a72.x0) / 2}`);
    assert.ok((a72.x0 + a72.x1) / 2 > 0, `Application is right of centre at p=0.72, ${at}`);
    // Final view: all three layers and their labels are back in frame, wider than the opening and still frontal.
    const cam1 = cameraAt(1, aspect);
    const final = [inputs, intelligence, application].map((l) => frame(l, cam1, aspect));
    final.forEach((f, i) => assert.ok(inside(f), `layer ${i} inside at p=1, ${at}: ${JSON.stringify(f)}`));
    const eye1 = cam1.position.map((v, i) => v - cam1.target[i]);
    assert.ok(Math.abs(eye1[0]) < 0.1 * Math.hypot(...eye1) && eye1[1] > 0 && eye1[1] < 0.2 * Math.hypot(...eye1), `frontal at p=1, ${at}`);
  }
});

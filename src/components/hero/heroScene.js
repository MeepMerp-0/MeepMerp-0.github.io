// The Hero scene: Inputs, Intelligence, Application, joined by one copper route with a signal travelling along it.
// A grid of request tiles on the left, a ribbed core in the middle and an abstract app panel on the right. The core
// is a sculpture, not a face: it has no eyes, screen, antenna or limbs, and it is unrelated to Aki.
// Every transform is a function of scroll progress (heroMotion.js), theme and size, and the scene renders on demand:
// when scrolling stops the frame holds. No timers, no idle loop, nothing reads the clock.
import {
  BoxGeometry, CatmullRomCurve3, Color, DoubleSide, Group, InstancedMesh, LatheGeometry, Mesh, Object3D,
  PerspectiveCamera, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createStudio, tones } from '../three/studio.js';
import { CORE, HERO_FOV, ROUTE_CORE, cameraAt, clamp01, signalAt, stageWeights } from './heroMotion.js';

// Fixed pseudo-random numbers in [0, 1), so a scroll position always draws the same frame.
const hash = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Several pieces as one geometry, so a layer that shares a material costs a single draw call.
function merged(parts) {
  const geometries = parts.map(([geometry, x, y, z]) => geometry.translate(x, y, z));
  const geometry = mergeGeometries(geometries);
  geometries.forEach((g) => g.dispose());
  return geometry;
}

const box = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 2, r);

// Inputs: a tilted field of tiles on a slab, a few of them marked as requests.
const COLS = 5;
const ROWS = 4;
const REQUESTS = new Set([1, 8, 12, 18]);
const TILE_HEIGHTS = [0.16, 0.3, 0.46];
const SLAB_TOP = -0.35;

// The route: from the request tiles, across the front of the core, into the application panel. Every point keeps
// at least 2 units from the core's centre, clear of its 1.4 radius.
const ROUTE = [
  [-5.5, 0.5, -1.2], [-4.0, 0.8, -1.7], [-2.5, 0.55, -1.4], [-1.6, 0.25, -1.0], [-0.3, 0.55, -0.85],
  [1.2, 1.1, -1.1], [2.1, 0.7, -1.6], [3.0, 0.45, -1.25],
].map((v) => new Vector3(...v));
const TUBULAR = 240;
const RADIAL = 8;
const ROUTE_RADIUS = 0.035;

// Releases the studio, then the GPU context itself. The studio's context-lost listener is gone by then, so this does
// not call onLost. A browser that lacks the extension, or a context that is already lost, is left alone.
function release(studio) {
  studio.dispose();
  try { studio.renderer.forceContextLoss?.(); } catch { /* already lost */ }
}

// If anything throws after the renderer exists, the renderer and its context are released before the error goes on.
export function createHeroScene(canvas, { theme = 'dark', onLost } = {}) {
  const studio = createStudio(canvas, { onLost });
  try {
    return build(studio, theme);
  } catch (error) {
    release(studio);
    throw error;
  }
}

function build(studio, theme) {
  const { scene, renderer, key } = studio;
  const camera = new PerspectiveCamera(HERO_FOV, 1, 0.1, 100);

  // Warm charcoal, ivory and champagne in the dark theme; warm stone, ink and bronze in the light one.
  const t = tones({
    slab: { c: ['#352f26', '#d8ccb5'], metal: 0.15, rough: 0.75 },
    tile: { c: ['#e6dcc8', '#2c2721'], metal: 0.25, rough: 0.5 },
    request: { c: ['#c47a45', '#9a5426'], metal: 0.6, rough: 0.35 },
    rib: { c: ['#d8b878', '#8a5f2a'], metal: 1, rough: 0.28 },
    layer: { c: ['#6b5a42', '#b99c6a'], metal: 0.85, rough: 0.32 },
    shell: { c: ['#f1e4c8', '#c9a46a'], metal: 0.2, rough: 0.2, opacity: 0.22, side: DoubleSide },
    heart: { c: ['#f3d9a4', '#b8863a'], metal: 0.3, rough: 0.25 },
    appBody: { c: ['#3d362b', '#e9e1d1'], metal: 0.2, rough: 0.55 },
    appSide: { c: ['#241f19', '#cdc1a9'], metal: 0.2, rough: 0.6 },
    appCard: { c: ['#efe6d4', '#2d2822'], metal: 0.2, rough: 0.5 },
    appHead: { c: ['#d8b878', '#8a5f2a'], metal: 0.9, rough: 0.3 },
    bars: { c: ['#c47a45', '#9a5426'], metal: 0.6, rough: 0.35 },
    route: { c: ['#c47a45', '#9a5426'], metal: 0.7, rough: 0.3 },
    travelled: { c: ['#ffb985', '#d9692a'], glow: true },
    signal: { c: ['#fff3dc', '#7a3f12'], glow: true },
    halo: { c: ['#fff3dc', '#7a3f12'], glow: true, opacity: 0.25 },
  });
  // Stage emphasis lifts these materials' emissive light only: [material, emissive colour, base, gain].
  const accents = [
    [[t.request, '#c47a45', 0.1, 0.9]],
    [[t.rib, '#e8c27a', 0.04, 0.6], [t.layer, '#e8c27a', 0, 0.35], [t.heart, '#f3d9a4', 0.5, 2.2]],
    [[t.bars, '#c47a45', 0.1, 0.9], [t.appHead, '#e8c27a', 0.04, 0.5]],
  ];
  accents.flat().forEach(([material, color]) => material.emissive.set(color));

  // Inputs: tiles in four instanced meshes (three heights plus the request tiles) on a tilted slab.
  const inputs = new Group();
  inputs.position.set(-4.2, 0.2, -1.5);
  inputs.rotation.x = 0.25;
  const slab = new Mesh(box(4, 0.1, 2.8, 0.04), t.slab);
  slab.position.y = SLAB_TOP - 0.05;
  inputs.add(slab);
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({
    i,
    x: ((i % COLS) - (COLS - 1) / 2) * 0.8,
    z: (Math.floor(i / COLS) - (ROWS - 1) / 2) * 0.66,
    kind: REQUESTS.has(i) ? 'request' : Math.floor(hash(i, 1) * TILE_HEIGHTS.length),
  }));
  const dummy = new Object3D();
  const tint = new Color();
  const tileGroups = [
    ...TILE_HEIGHTS.map((h, kind) => ({ kind, h, material: t.tile })),
    { kind: 'request', h: 0.36, material: t.request },
  ];
  tileGroups.forEach(({ kind, h, material }) => {
    const group = cells.filter((cell) => cell.kind === kind);
    if (!group.length) return;
    const tiles = new InstancedMesh(box(0.66, h, 0.54, 0.05), material, group.length);
    group.forEach((cell, n) => {
      dummy.position.set(cell.x, SLAB_TOP + h / 2, cell.z);
      dummy.updateMatrix();
      tiles.setMatrixAt(n, dummy.matrix);
      // A little variation in brightness; the request tiles keep their copper.
      const v = kind === 'request' ? 1 : 0.82 + hash(cell.i, 2) * 0.18;
      tiles.setColorAt(n, tint.setRGB(v, v, v));
    });
    inputs.add(tiles);
  });

  // Intelligence: stacked ribs around a layered inner core, inside a faint shell. Everything stays within 1.4 of
  // the centre.
  const core = new Group();
  core.position.set(...CORE);
  core.rotation.set(0.08, 0, 0.16);
  const ribs = Array.from({ length: 9 }, (_, k) => {
    const y = (k - 4) * 0.24;
    return [new TorusGeometry(Math.sqrt(1.28 * 1.28 - y * y), 0.065, 12, 72).rotateX(Math.PI / 2), 0, y, 0];
  });
  const ovoid = (radius, wobble = 0, waves = 0) => Array.from({ length: 33 }, (_, k) => {
    const y = ((k / 32) * 2 - 1) * radius;
    return new Vector2(Math.max(0.001, Math.sqrt(radius * radius - y * y) + wobble * Math.sin(y * waves)), y);
  });
  const ring = new Mesh(new TorusGeometry(1.34, 0.02, 8, 96).rotateX(Math.PI / 2 + 0.45), t.rib);
  core.add(
    new Mesh(merged(ribs), t.rib),
    new Mesh(new LatheGeometry(ovoid(1.08), 48), t.shell),
    new Mesh(new LatheGeometry(ovoid(0.82, 0.035, 14), 48), t.layer),
    new Mesh(new SphereGeometry(0.3, 32, 24), t.heart),
    ring,
  );

  // Application: an abstract panel (header bar, sidebar, cards and a small bar chart) with no text or logos.
  const app = new Group();
  app.position.set(3.4, 0.2, -1.6);
  app.rotation.x = -0.14;
  const FACE = 0.06;
  const cardX = [-0.39, 0.33, 1.05];
  const barHeights = [0.25, 0.4, 0.32, 0.55, 0.45, 0.62, 0.5];
  const plate = new Mesh(box(3, 0.07, 1.2, 0.03), t.slab);
  plate.position.set(0, -1.08, 0.3);
  app.add(
    plate,
    new Mesh(box(3, 2.1, 0.12, 0.07), t.appBody),
    new Mesh(merged([
      [box(2.84, 0.28, 0.05), 0, 0.84, FACE + 0.025],
      ...cardX.map((x) => [box(0.3, 0.05, 0.02, 0.01), x - 0.12, 0.55, FACE + 0.15]),
    ]), t.appHead),
    new Mesh(box(0.6, 1.5, 0.05), t.appSide).translateX(-1.1).translateY(-0.1).translateZ(FACE + 0.025),
    new Mesh(merged([
      ...cardX.map((x) => [box(0.62, 0.5, 0.06, 0.03), x, 0.4, FACE + 0.06]),
      [box(2.06, 0.8, 0.06, 0.03), 0.33, -0.43, FACE + 0.06],
      ...[0, 1, 2].map((k) => [box(0.1, 0.1, 0.02, 0.01), -1.28 + k * 0.16, 0.84, FACE + 0.06]),
      ...[0, 1, 2, 3].map((k) => [box(0.44, 0.09, 0.03, 0.01), -1.1, 0.45 - k * 0.2, FACE + 0.065]),
    ]), t.appCard),
    new Mesh(merged(barHeights.map((h, k) => [
      new BoxGeometry(0.15, h, 0.03), -0.5 + k * 0.27, -0.78 + h / 2, FACE + 0.105,
    ])), t.bars),
  );

  // The route, its travelled part and the signal.
  const curve = new CatmullRomCurve3(ROUTE, false, 'centripetal');
  const path = new TubeGeometry(curve, TUBULAR, ROUTE_RADIUS, RADIAL, false);
  const done = new TubeGeometry(curve, TUBULAR, ROUTE_RADIUS * 1.15, RADIAL, false);
  const signal = new Mesh(new SphereGeometry(0.085, 24, 16), t.signal);
  const halo = new Mesh(new SphereGeometry(0.22, 24, 16), t.halo);
  const travelled = new Mesh(done, t.travelled);
  scene.add(inputs, core, app, new Mesh(path, t.route), travelled, signal, halo);

  // The route parameter nearest the core, found once, so the signal is at the core exactly when the camera is.
  const coreAt = new Vector3(...CORE);
  let uCore = ROUTE_CORE;
  let nearest = Infinity;
  for (let i = 0; i <= 200; i += 1) {
    const d = curve.getPointAt(i / 200).distanceToSquared(coreAt);
    if (d < nearest) { nearest = d; uCore = i / 200; }
  }
  // Two linear pieces: Inputs to the core, then the core to Application.
  const routeAt = (s) => (s <= ROUTE_CORE
    ? (s / ROUTE_CORE) * uCore
    : uCore + ((s - ROUTE_CORE) / (1 - ROUTE_CORE)) * (1 - uCore));

  const setColors = (name) => {
    studio.setTheme(name);
    key.color.set(studio.palette().keys[0]);
    t.apply(name);
  };
  setColors(theme);

  let p = 0;
  let frame = 0;
  let disposed = false;
  const render = () => {
    const u = routeAt(signalAt(p));
    const w = stageWeights(p);
    accents.forEach((stage, i) => stage.forEach(([material, , base, gain]) => {
      material.emissiveIntensity = base + gain * w[i];
    }));
    // The draw range counts indices, six per tube segment per radial step.
    done.setDrawRange(0, Math.floor(u * TUBULAR) * RADIAL * 6);
    const point = curve.getPointAt(u);
    signal.position.copy(point);
    halo.position.copy(point);
    const { position, target } = cameraAt(p, camera.aspect);
    camera.position.set(...position);
    camera.lookAt(...target);
    renderer.render(scene, camera);
  };
  const request = () => {
    if (frame || disposed) return;
    frame = requestAnimationFrame(() => { frame = 0; render(); });
  };

  const resize = () => {
    const { w, h } = studio.fit();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    request();
  };
  resize();

  return {
    setProgress(value) {
      const next = clamp01(value);
      if (next !== p) { p = next; request(); }
    },
    setTheme(name) { setColors(name); request(); },
    resize,
    renderNow() {
      cancelAnimationFrame(frame);
      frame = 0;
      render();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      scene.traverse((o) => o.isInstancedMesh && o.dispose());
      release(studio);
    },
  };
}

// The Hero scene: a frontal row of three layers, Inputs, Intelligence and Application, joined by one copper route with
// a signal travelling along it. A square grid of request tiles on the left, a ringed core with a hexagon in the middle
// and an abstract app panel on the right. The core is a sculpture, not a face, and it is unrelated to Aki.
// Layout is drawn in reference-image pixels (PX per world unit) and placed around the core. Every transform is a
// function of scroll progress (heroMotion.js), theme and size, and the scene renders on demand: when scrolling stops
// the frame holds. No timers, no idle loop, nothing reads the clock.
import {
  BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, CircleGeometry, Color,
  ExtrudeGeometry, Group, InstancedMesh, LineSegments, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera,
  PlaneGeometry, SRGBColorSpace, Shape, SphereGeometry, TorusGeometry, TubeGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createStudio, tones } from '../three/studio.js';
import { CORE, HERO_FOV, ROUTE_CORE, SIGNAL, ZOOM_END, cameraAt, clamp01, ease, signalAt, stageWeights } from './heroMotion.js';

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
const box = (w, h, d) => new BoxGeometry(w, h, d);

// Layout. The composition was drawn on an 853 px wide image with the core's centre at (423, 176); one world unit is 100
// of those pixels. wx and wy turn that pixel layout into world coordinates, and the layers share the core's depth.
const Z = CORE[2];
const wx = (px) => (px - 423) / 100;
const wy = (py) => CORE[1] - (py - 176) / 100;
const SANS = '"Helvetica Neue", Helvetica, Arial, "Segoe UI", system-ui, sans-serif';

// Inputs: a 5 x 5 grid of tiles; the bronze ones are requests.
const GRID = 5;
const BRONZE_TILES = new Set([0, 3, 7, 11, 14, 15, 18, 22]);
const INPUTS = { cx: wx(193.5), cy: wy(176), w: 1.65, h: 1.62, pitch: 0.3, tile: 0.24 };
// Application: a wider panel with a top line and three rows (block, long line, short line).
const APP = { cx: wx(719), cy: wy(173.5), w: 2.14, h: 2.15 };
const APP_ROWS = [142, 190, 238].map((py) => wy(py) - APP.cy);

// Intelligence: a ribbed annulus of fins between two radii, with rings and spokes around it and a hexagon inside.
const FINS = 120;
const FIN_IN = 0.83;
const FIN_OUT = 1.19;
const HEX = 0.5;

// The route, in image pixels and a depth: behind the Inputs panel, in front of the fins, into the hexagon, out to the
// right and down behind the Application panel. The signal starts on a tile of the Inputs panel.
const ROUTE = [
  [-150, 190, -3.14], [20, 190, -3.14], [111, 190, -3.14], [193, 190, -3.14], [280, 196, -3.1], [300, 197, -2.78],
  [340, 194, -2.78], [372, 185, -2.92], [400, 179, -3], [423, 177, -3], [446, 177.5, -3], [474, 179, -2.92],
  [506, 183, -2.78], [546, 196, -2.78], [580, 205, -2.9], [612, 208, -3.12], [640, 206, -3.12], [652, 203, -3.12],
].map(([px, py, z]) => new Vector3(wx(px), wy(py), z));
const ORB_X = wx(192);
const TUBULAR = 320;
const RADIAL = 8;
const ROUTE_RADIUS = 0.04;
// While the signal crosses a panel or the core it rides in front of it: [x from, x to, depth]. It is drawn on top.
const HOVER = [[-3.12, -1.47, -2.9], [-0.6, 0.6, -2.74], [1.89, 6, -2.9]];

const PAL = {
  tile: ['#252728', '#463f35'], bronze: ['#634a2e', '#9a6a2a'], appBronze: ['#6d5538', '#9a6a2a'],
  finLo: ['#58402a', '#c79d66'], finHi: ['#a68562', '#8c5c28'],
};
const FACE = { fill: ['#383632', '#4a443c'], text: ['#ece0c8', '#f4ecdb'] };

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

// A panel: a dark body inside a thin bronze frame. Returns the two meshes at the centre of the panel.
function panel(w, h, bodyMaterial, frameMaterial) {
  const f = 0.022;
  const frame = merged([
    [box(w, f, 0.07), 0, h / 2 - f / 2, 0], [box(w, f, 0.07), 0, -h / 2 + f / 2, 0],
    [box(f, h - 2 * f, 0.07), -w / 2 + f / 2, 0, 0], [box(f, h - 2 * f, 0.07), w / 2 - f / 2, 0, 0],
  ]);
  return [new Mesh(box(w - 0.004, h - 0.004, 0.06), bodyMaterial), new Mesh(frame, frameMaterial)];
}

// Small spaced uppercase text on a transparent canvas, white so the material's colour tints it. Drawn once.
function labelTexture(text) {
  const size = 40;
  const gap = 2;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `700 ${size}px ${SANS}`;
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  c.width = Math.ceil(widths.reduce((sum, v) => sum + v + gap, 0)) + 8;
  c.height = 64;
  ctx.font = `700 ${size}px ${SANS}`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  let x = 4;
  [...text].forEach((ch, i) => { ctx.fillText(ch, x, 34); x += widths[i] + gap; });
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  return { texture, aspect: c.width / c.height };
}

function build(studio, theme) {
  const { scene, renderer, key } = studio;
  const camera = new PerspectiveCamera(HERO_FOV, 1, 0.1, 100);
  const owned = []; // textures to dispose

  // Warm charcoal, bronze and champagne in the dark theme; warm stone, ink and bronze in the light one.
  const frameTone = { c: ['#a38d68', '#a67a45'], metal: 0.25, rough: 0.55 };
  const labelTone = { c: ['#d2c7b0', '#5e4d36'], glow: true, opacity: 0.7 };
  const t = tones({
    glow: { c: ['#6e4a28', '#e6bd7e'], glow: true, opacity: 0.3 },
    panel: { c: ['#101312', '#efe6d3'], metal: 0, rough: 1 },
    frame0: frameTone,
    frame1: frameTone,
    frame2: frameTone,
    // White: the instance colours carry the palette.
    tile: { c: ['#ffffff', '#ffffff'], metal: 0, rough: 0.9 },
    fin: { c: ['#ffffff', '#ffffff'], metal: 0.05, rough: 0.7 },
    ring: { c: ['#c4a672', '#9a6a32'], metal: 0.4, rough: 0.45 },
    rim: { c: ['#8f6a43', '#a8742f'], metal: 0.45, rough: 0.5 },
    spoke: { c: ['#c9ad7c', '#8a5f2a'], line: true, opacity: 0.8 },
    lineLong: { c: ['#d8cab0', '#5e4f3a'], metal: 0, rough: 0.9 },
    lineShort: { c: ['#5a5851', '#a69a84'], metal: 0, rough: 0.9 },
    route: { c: ['#cf8450', '#b4642a'], metal: 0.5, rough: 0.35, opacity: 1 },
    travelled: { c: ['#ff9d55', '#d9692a'], glow: true },
    signal: { c: ['#ffc98c', '#7a3f12'], glow: true },
    halo: { c: ['#ff9a50', '#7a3f12'], glow: true, opacity: 0.28 },
    label0: labelTone,
    label1: labelTone,
    label2: labelTone,
  });
  // Stage emphasis lifts these materials' emissive light only: [material, emissive colour, base, gain].
  const accents = [
    [[t.frame0, '#c9a56f', 0.02, 0.35]],
    [[t.frame1, '#c9a56f', 0.02, 0.35], [t.ring, '#e8c27a', 0.02, 0.4], [t.rim, '#e8c27a', 0.02, 0.25]],
    [[t.frame2, '#c9a56f', 0.02, 0.35]],
  ];
  accents.flat().forEach(([material, color]) => material.emissive.set(color));
  t.route.vertexColors = true;
  // The signal is drawn last and on top, so it stays visible over panels and the core.
  [t.signal, t.halo].forEach((m) => { m.depthTest = false; m.depthWrite = false; });

  const dummy = new Object3D();
  const color = new Color();

  // Inputs: a panel with a 5 x 5 grid of tiles.
  const inputs = new Group();
  inputs.position.set(INPUTS.cx, INPUTS.cy, Z);
  inputs.add(...panel(INPUTS.w, INPUTS.h, t.panel, t.frame0));
  const tiles = new InstancedMesh(box(INPUTS.tile, INPUTS.tile, 0.05), t.tile, GRID * GRID);
  for (let n = 0; n < GRID * GRID; n += 1) {
    dummy.position.set(((n % GRID) - 2) * INPUTS.pitch, (2 - Math.floor(n / GRID)) * INPUTS.pitch, 0.055);
    dummy.updateMatrix();
    tiles.setMatrixAt(n, dummy.matrix);
  }
  inputs.add(tiles);

  // Intelligence: fins, rings, spokes and a hexagon, all with depth along z so the camera's approach shows parallax.
  const core = new Group();
  core.position.set(...CORE);
  const fins = new InstancedMesh(box(FIN_OUT - FIN_IN, 0.056, 0.3), t.fin, FINS);
  for (let n = 0; n < FINS; n += 1) {
    const a = ((n + 0.5) / FINS) * Math.PI * 2;
    const r = (FIN_IN + FIN_OUT) / 2;
    dummy.position.set(r * Math.cos(a), r * Math.sin(a), 0);
    dummy.rotation.set(0, 0, a);
    dummy.scale.set(1, 1, 0.94 + hash(n, 3) * 0.12);
    dummy.updateMatrix();
    fins.setMatrixAt(n, dummy.matrix);
  }
  const finWeight = Array.from({ length: FINS }, (_, n) => {
    const a = ((n + 0.5) / FINS) * Math.PI * 2;
    return (0.5 + 0.5 * Math.cos(a + Math.PI / 4)) ** 1.3; // lightest toward the bottom right
  });
  const rings = merged([
    [new TorusGeometry(1.29, 0.008, 6, 180), 0, 0, -0.06],
    [new TorusGeometry(0.74, 0.007, 6, 160), 0, 0, 0.05],
  ]);
  // Spokes (twelve directions, in front of the fins) and ticks along the outer ring, in one set of line segments.
  const points = [];
  const segment = (r0, r1, a, z) => points.push(r0 * Math.cos(a), r0 * Math.sin(a), z, r1 * Math.cos(a), r1 * Math.sin(a), z);
  for (let k = 0; k < 12; k += 1) segment(0.9, 1.42, (k * Math.PI) / 6, 0.16);
  for (let k = 0; k < 36; k += 1) segment(1.29, 1.33, (k * Math.PI) / 18, -0.06);
  const spokes = new BufferGeometry().setAttribute('position', new BufferAttribute(new Float32Array(points), 3));
  const hexShape = new Shape();
  for (let k = 0; k < 6; k += 1) {
    const a = Math.PI / 2 + (k * Math.PI) / 3;
    hexShape[k ? 'lineTo' : 'moveTo'](HEX * Math.cos(a), HEX * Math.sin(a));
  }
  const rimGeometry = new ExtrudeGeometry(hexShape, {
    depth: 0.18, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 2, curveSegments: 1,
  }).translate(0, 0, -0.03);

  // The hexagon's dark face carries "AI" on a canvas texture; it is redrawn only when the theme changes.
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 256;
  faceCanvas.height = 256;
  const faceTexture = new CanvasTexture(faceCanvas);
  faceTexture.colorSpace = SRGBColorSpace;
  owned.push(faceTexture);
  const drawFace = (name) => {
    const i = name === 'light' ? 1 : 0;
    const ctx = faceCanvas.getContext('2d');
    ctx.fillStyle = FACE.fill[i];
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = FACE.text[i];
    ctx.font = `800 96px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('AI', 128, 128 + 34);
    faceTexture.needsUpdate = true;
  };
  const face = new Mesh(
    new CircleGeometry(0.44, 6, Math.PI / 2),
    new MeshBasicMaterial({ map: faceTexture, toneMapped: false }),
  );
  face.position.z = 0.19;
  core.add(
    fins,
    new Mesh(rings, t.ring),
    new LineSegments(spokes, t.spoke),
    new Mesh(rimGeometry, t.rim),
    face,
  );

  // Application: a panel with a top line and three rows, each a block with a long and a short line.
  const app = new Group();
  app.position.set(APP.cx, APP.cy, Z);
  app.add(...panel(APP.w, APP.h, t.panel, t.frame2));
  const blocks = new InstancedMesh(box(0.44, 0.34, 0.05), t.tile, 3);
  APP_ROWS.forEach((y, n) => {
    dummy.position.set(-0.67, y, 0.055);
    dummy.updateMatrix();
    blocks.setMatrixAt(n, dummy.matrix);
  });
  const lineBox = (len, thick) => box(len, thick, 0.012);
  app.add(
    blocks,
    new Mesh(merged([
      [lineBox(1.76, 0.012), 0, 0.765, 0.04],
      ...APP_ROWS.map((y) => [lineBox(1.08, 0.022), 0.27, y + 0.09, 0.04]),
    ]), t.lineLong),
    new Mesh(merged(APP_ROWS.map((y) => [lineBox(0.76, 0.012), 0.11, y - 0.06, 0.04])), t.lineShort),
  );

  // Labels above the top left of each layer: decorative text planes that move with the camera. The HTML stage list is
  // the semantic source.
  const LABELS = [
    ['01 / INPUTS', wx(115), wy(77)],
    ['02 / INTELLIGENCE', wx(314), wy(19)],
    ['03 / APPLICATION', wx(620), wy(46)],
  ];
  const labels = LABELS.map(([text, left, y], i) => {
    const { texture, aspect } = labelTexture(text);
    owned.push(texture);
    const material = t[`label${i}`];
    material.map = texture;
    material.toneMapped = false;
    const h = 0.17;
    const mesh = new Mesh(new PlaneGeometry(h * aspect, h), material);
    mesh.position.set(left + (h * aspect) / 2, y, Z + 0.04);
    return mesh;
  });

  // A soft warm glow behind the core, drawn once as a radial alpha texture.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const gradient = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  gctx.fillStyle = gradient;
  gctx.fillRect(0, 0, 128, 128);
  const glowTexture = new CanvasTexture(glowCanvas);
  glowTexture.colorSpace = SRGBColorSpace;
  owned.push(glowTexture);
  t.glow.map = glowTexture;
  const glow = new Mesh(new PlaneGeometry(10.5, 5.6), t.glow);
  glow.position.set(0.2, -0.2, Z - 0.9);

  // The route: thin and faint far to the left, thickening into a copper tube. Its travelled part overlays it, and the
  // signal and halo sit at its head.
  const curve = new CatmullRomCurve3(ROUTE, false, 'centripetal');
  const tube = (radius, alpha) => {
    const geometry = new TubeGeometry(curve, TUBULAR, radius, RADIAL, false);
    const position = geometry.attributes.position;
    const ring = RADIAL + 1;
    const colors = new Float32Array(position.count * 4);
    const centre = new Vector3();
    const v = new Vector3();
    for (let i = 0; i <= TUBULAR; i += 1) {
      curve.getPointAt(i / TUBULAR, centre);
      const f = ease(-5.6, -1.4, centre.x);
      for (let j = 0; j < ring; j += 1) {
        const n = i * ring + j;
        v.fromBufferAttribute(position, n).sub(centre).multiplyScalar(0.2 + 0.8 * f).add(centre);
        position.setXYZ(n, v.x, v.y, v.z);
        colors.set([1, 1, 1, alpha ? 0.06 + 0.94 * f * f : 1], n * 4);
      }
    }
    if (alpha) geometry.setAttribute('color', new BufferAttribute(colors, 4));
    return geometry;
  };
  const done = tube(ROUTE_RADIUS * 1.15, false);
  const signal = new Mesh(new SphereGeometry(0.065, 24, 16), t.signal);
  const halo = new Mesh(new SphereGeometry(0.11, 24, 16), t.halo);
  const travelled = new Mesh(done, t.travelled);
  signal.renderOrder = 10;
  halo.renderOrder = 9;
  scene.add(glow, inputs, core, app, ...labels, new Mesh(tube(ROUTE_RADIUS, true), t.route), travelled, halo, signal);

  // Route parameters for the signal: the tile it waits on, and the point nearest the core, found once, so the signal
  // is at the core exactly when the camera is.
  const coreAt = new Vector3(...CORE);
  let uStart = 0;
  let uCore = ROUTE_CORE;
  let nearestStart = Infinity;
  let nearest = Infinity;
  for (let i = 0; i <= 400; i += 1) {
    const point = curve.getPointAt(i / 400);
    const dx = Math.abs(point.x - ORB_X);
    if (dx < nearestStart && point.x < 0) { nearestStart = dx; uStart = i / 400; }
    const d = point.distanceToSquared(coreAt);
    if (d < nearest) { nearest = d; uCore = i / 400; }
  }
  // Two linear pieces: the Inputs tile to the core, then the core to Application.
  const routeAt = (s) => (s <= ROUTE_CORE
    ? uStart + (s / ROUTE_CORE) * (uCore - uStart)
    : uCore + ((s - ROUTE_CORE) / (1 - ROUTE_CORE)) * (1 - uCore));
  const startIndex = Math.floor(uStart * TUBULAR);
  // Draws the signal in front of the panel or the core it is crossing; `over` is how far it is over the hexagon.
  const hover = (at) => {
    let z = at.z;
    let over = 0;
    HOVER.forEach(([from, to, top], i) => {
      const w = ease(from - 0.3, from, at.x) * (1 - ease(to, to + 0.3, at.x));
      z = Math.max(z, at.z + w * (top - at.z));
      if (i === 1) over = w;
    });
    return { z, over };
  };

  // Instance colours: the palette for the theme, lifted a little for the active stage.
  const lo = new Color();
  const hi = new Color();
  const paint = (name, w) => {
    const i = name === 'light' ? 1 : 0;
    for (let n = 0; n < GRID * GRID; n += 1) {
      color.set(BRONZE_TILES.has(n) ? PAL.bronze[i] : PAL.tile[i]);
      if (BRONZE_TILES.has(n)) color.multiplyScalar(1 + 0.45 * w[0]);
      tiles.setColorAt(n, color);
    }
    lo.set(PAL.finLo[i]);
    hi.set(PAL.finHi[i]);
    for (let n = 0; n < FINS; n += 1) {
      fins.setColorAt(n, color.copy(lo).lerp(hi, finWeight[n]).multiplyScalar(0.92 + 0.2 * w[1]));
    }
    [PAL.tile[i], PAL.appBronze[i], PAL.tile[i]].forEach((c, n) => {
      color.set(c);
      if (n === 1) color.multiplyScalar(1 + 0.45 * w[2]);
      blocks.setColorAt(n, color);
    });
    [tiles, fins, blocks].forEach((m) => { m.instanceColor.needsUpdate = true; });
  };

  let current = theme;
  const setColors = (name) => {
    current = name;
    studio.setTheme(name);
    key.color.set(studio.palette().keys[0]);
    t.apply(name);
    drawFace(name);
  };
  setColors(theme);

  let p = 0;
  let frame = 0;
  let disposed = false;
  const point = new Vector3();
  // 1 when a label lies wholly inside the visible frame, falling to 0 as any edge reaches the frame edge, so a label
  // never shows cut off.
  const corner = new Vector3();
  const inFrame = (label) => {
    const { width, height } = label.geometry.parameters;
    let margin = Infinity;
    for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      corner.set(label.position.x + (sx * width) / 2, label.position.y + (sy * height) / 2, label.position.z).project(camera);
      margin = Math.min(margin, 1 + corner.x, 1 - corner.x, 1 - Math.abs(corner.y));
    }
    return ease(0, 0.08, margin);
  };
  const render = () => {
    const u = routeAt(signalAt(p));
    const w = stageWeights(p);
    accents.forEach((stage, i) => stage.forEach(([material, , base, gain]) => {
      material.emissiveIntensity = base + gain * w[i];
    }));
    t.spoke.opacity = 0.7 + 0.3 * w[1];
    paint(current, w);
    // The draw range counts indices, six per tube segment per radial step; the overlay starts at the signal's tile.
    done.setDrawRange(startIndex * RADIAL * 6, Math.max(0, Math.floor(u * TUBULAR) - startIndex) * RADIAL * 6);
    curve.getPointAt(u, point);
    const { z, over } = hover(point);
    signal.position.set(point.x, point.y, z);
    halo.position.copy(signal.position);
    // Over the hexagon the signal is absorbed into the core, so it never sits on the "AI" text.
    signal.scale.setScalar(Math.max(1e-3, 1 - over));
    halo.scale.setScalar(Math.max(1e-3, 1 - over));
    const { position, target } = cameraAt(p, camera.aspect);
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateMatrixWorld();
    // All three labels read at the overview. Once the camera moves in, only the active stage's label stays (its weight
    // is cubed, so a label is nearly gone by the midpoint of its cross-fade), and any label reaching the frame edge
    // fades out. The closing zoom-out brings the others back by the time the camera settles.
    const away = ease(SIGNAL.start, 0.27, p) * (1 - ease(SIGNAL.end + 0.04, ZOOM_END, p));
    labels.forEach((label, i) => {
      label.material.opacity = ((0.72 + 0.28 * w[i]) * (1 - away) + w[i] ** 3 * away) * inFrame(label);
    });
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
      owned.forEach((texture) => texture.dispose());
      release(studio);
    },
  };
}

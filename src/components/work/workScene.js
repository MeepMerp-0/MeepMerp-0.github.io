// The Work showcase scene: four geometric sculptures on one path, authored here with no model or texture files.
// Loaded with import() only when the Work section is near, so Three.js never delays the first paint.
// It renders on demand (scroll, theme, size), never in an idle loop: when scrolling stops, the frame holds.
import {
  BoxGeometry, Color, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh, MathUtils, Mesh, Object3D,
  PerspectiveCamera, SphereGeometry, TorusGeometry, Vector3,
} from 'three';
import { createStudio } from '../three/studio.js';

// Vertical distance between sculptures: the outgoing one rises out of frame as the next rises into it, so a
// transition moves with the scroll and never passes behind the copy on the left.
const SPACING = 6;
const TAU = Math.PI * 2;
const smoothstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// 0 · Aki: a faceted core inside a glass shell, with conversation rings and orbiting nodes.
function buildAki(m) {
  const g = new Group();
  const core = new Mesh(new IcosahedronGeometry(1.05, 0), m.metal);
  const shell = new Mesh(new SphereGeometry(1.55, 48, 32), m.glass);
  const rings = [1.95, 2.35, 2.75].map((r, i) => {
    const ring = new Mesh(new TorusGeometry(r, 0.022, 12, 160), i === 1 ? m.deep : m.satin);
    ring.rotation.set(Math.PI / 2 + (i - 1) * 0.42, i * 0.5, 0);
    return ring;
  });
  const nodeGeo = new SphereGeometry(0.11, 20, 14);
  const nodes = rings.flatMap((ring, i) => [0, 1].map((k) => {
    const node = new Mesh(nodeGeo, m.metal);
    node.userData = { ring, r: ring.geometry.parameters.radius, phase: k * Math.PI + i };
    return node;
  }));
  g.add(core, shell, ...rings, ...nodes);
  g.userData.update = (s, local) => {
    core.rotation.set(s * 0.7, s * 1.3, 0);
    rings.forEach((ring, i) => { ring.rotation.z = s * (0.5 + i * 0.25); });
    nodes.forEach((node) => {
      const { ring, r, phase } = node.userData;
      const a = phase + s * 1.8;
      node.position.set(Math.cos(a) * r, 0, Math.sin(a) * r).applyEuler(ring.rotation);
    });
    shell.scale.setScalar(1 + 0.04 * Math.sin(local * Math.PI));
  };
  return g;
}

// 1 · INNERCIRCLE: an abstract circular colonnade around an inner ring. Not a depiction of the product.
function buildInnerCircle(m) {
  const g = new Group();
  const base = new Mesh(new CylinderGeometry(2.35, 2.48, 0.16, 96), m.stone);
  base.position.y = -1.3;
  const columns = new InstancedMesh(new BoxGeometry(0.14, 2.4, 0.14), m.satin, 16);
  const dummy = new Object3D();
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * TAU;
    dummy.position.set(Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9);
    dummy.rotation.y = -a;
    dummy.updateMatrix();
    columns.setMatrixAt(i, dummy.matrix);
  }
  const crown = new Mesh(new TorusGeometry(1.9, 0.05, 12, 160), m.metal);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 1.22;
  const inner = new Mesh(new TorusGeometry(0.9, 0.13, 24, 120), m.metal);
  const pivot = new Mesh(new SphereGeometry(0.32, 32, 20), m.deep);
  g.add(base, columns, crown, inner, pivot);
  g.userData.update = (s, local) => {
    g.rotation.y = s * 0.55;
    inner.rotation.set(Math.PI / 2 + Math.sin(s * 1.4) * 0.5, s * 1.1, 0);
    crown.position.y = 1.22 + 0.12 * Math.sin(local * Math.PI);
  };
  return g;
}

// 2 · Timekeeping: a dial whose hands turn as you scroll, beside a rising stack of ledger slabs.
function buildTimekeeping(m) {
  const g = new Group();
  const dial = new Group();
  const rim = new Mesh(new TorusGeometry(1.85, 0.08, 16, 160), m.metal);
  const face = new Mesh(new CylinderGeometry(1.78, 1.78, 0.06, 96), m.stone);
  face.rotation.x = Math.PI / 2;
  face.position.z = -0.05;
  const ticks = new InstancedMesh(new BoxGeometry(0.07, 0.3, 0.07), m.satin, 12);
  const dummy = new Object3D();
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * TAU;
    dummy.position.set(Math.sin(a) * 1.5, Math.cos(a) * 1.5, 0.04);
    dummy.rotation.z = -a;
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  const hand = (length, width, material) => {
    const pivot = new Group();
    const mesh = new Mesh(new BoxGeometry(width, length, 0.06), material);
    mesh.position.set(0, length / 2 - 0.12, 0.1);
    pivot.add(mesh);
    return pivot;
  };
  const hour = hand(0.95, 0.1, m.deep);
  const minute = hand(1.35, 0.06, m.metal);
  const hub = new Mesh(new CylinderGeometry(0.12, 0.12, 0.2, 32), m.metal);
  hub.rotation.x = Math.PI / 2;
  dial.add(face, rim, ticks, hour, minute, hub);
  const slabs = Array.from({ length: 6 }, (_, i) => {
    const slab = new Mesh(new BoxGeometry(1.5, 0.12, 0.95), i % 2 ? m.satin : m.deep);
    slab.userData.y = -1.3 + i * 0.2;
    return slab;
  });
  const stack = new Group();
  stack.add(...slabs);
  stack.position.set(2.45, 0, -1);
  g.add(dial, stack);
  g.userData.update = (s, local) => {
    minute.rotation.z = -s * TAU * 1.5;
    hour.rotation.z = -s * TAU * 0.125 - 0.6;
    dial.rotation.y = -0.35 + Math.sin(s * 0.8) * 0.25;
    slabs.forEach((slab, i) => {
      const shown = smoothstep(i / 6, (i + 1) / 6, local);
      slab.position.y = slab.userData.y - (1 - shown) * 0.6;
      slab.scale.set(1, Math.max(0.01, shown), 1);
    });
    stack.rotation.y = s * 0.6;
  };
  return g;
}

// 3 · FuturoHub: a grid of blocks, like page sections and sites, rising in a wave over a plinth.
function buildBlocks(m) {
  const g = new Group();
  const N = 6;
  const blocks = new InstancedMesh(new BoxGeometry(0.5, 1, 0.5), m.metal, N * N);
  const plinth = new Mesh(new BoxGeometry(N * 0.68 + 0.4, 0.14, N * 0.68 + 0.4), m.stone);
  plinth.position.y = -1.2;
  const dummy = new Object3D();
  g.add(plinth, blocks);
  g.rotation.x = 0.28;
  g.userData.update = (s, local) => {
    for (let i = 0; i < N; i += 1) {
      for (let j = 0; j < N; j += 1) {
        const h = 0.25 + 1.15 * (0.5 + 0.5 * Math.sin(i * 0.9 + j * 1.25 + s * 2.6)) * (0.35 + 0.65 * local);
        dummy.position.set((i - (N - 1) / 2) * 0.68, -1.13 + h / 2, (j - (N - 1) / 2) * 0.68);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        blocks.setMatrixAt(i * N + j, dummy.matrix);
      }
    }
    blocks.instanceMatrix.needsUpdate = true;
    g.rotation.y = 0.6 + s * 0.35;
  };
  return g;
}

export function createWorkScene(canvas, { theme = 'dark', compact = false, onLost } = {}) {
  // Throws when WebGL is unavailable; the caller shows the static emblems instead.
  const studio = createStudio(canvas, { compact, onLost });
  const { renderer, scene, key, rim, m } = studio;
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);

  const groups = [buildAki(m), buildInnerCircle(m), buildTimekeeping(m), buildBlocks(m)];
  groups.forEach((group) => scene.add(group));

  let s = 0;
  let palette = studio.setTheme(theme);
  let frame = 0;
  let size = { w: 1, h: 1, wide: false };
  const target = new Vector3();
  const keyColor = new Color();
  const keyNext = new Color();

  const render = () => {
    frame = 0;
    const base = Math.min(Math.floor(s), groups.length - 2);
    const f = s - base;
    // Each sculpture rests around its chapter's middle; the hand-over to the next happens near the switch.
    const travel = smoothstep(0.2, 0.8, f);
    const eased = base + travel;
    // The camera orbits a little as you scroll and dips during a hand-over, for parallax.
    const swing = (s - 1.5) * 0.18;
    const distance = size.wide ? 10.5 : 12.5 / Math.min(1, Math.max(0.55, size.w / size.h)) ** 0.6;
    camera.position.set(Math.sin(swing) * distance, 1.6 - Math.sin(travel * Math.PI) * 0.9, Math.cos(swing) * distance);
    camera.lookAt(target);
    // Light colour and strength cross-fade from one chapter's key to the next.
    keyColor.set(palette.keys[base]).lerp(keyNext.set(palette.keys[base + 1]), travel);
    key.color.copy(keyColor);
    rim.intensity = palette.rimPower * (0.8 + 0.4 * Math.sin(f * Math.PI));

    groups.forEach((group, i) => {
      const presence = 1 - MathUtils.clamp(Math.abs(s - i), 0, 1);
      // Only the sculptures being travelled between are drawn, so a resting chapter shows its sculpture alone.
      group.visible = Math.abs(s - i) < 0.98;
      if (!group.visible) return;
      group.userData.update(s, presence);
      group.position.y = (eased - i) * SPACING;
      group.scale.setScalar(0.82 + 0.18 * presence);
    });
    renderer.render(scene, camera);
  };
  const request = () => { if (!frame) frame = requestAnimationFrame(render); };

  const resize = () => {
    const { w, h } = studio.fit();
    camera.aspect = w / h;
    size = { w, h, wide: !compact && w / h > 1.25 };
    // On a wide stage the copy sits on the left, so the sculpture is framed to the right of centre.
    if (size.wide) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    request();
  };

  resize();

  return {
    setScene(value) { if (value !== s) { s = value; request(); } },
    setTheme(name) { palette = studio.setTheme(name); request(); },
    resize,
    // Renders the current state now; the caller uses it to know the first frame has been drawn.
    renderNow: render,
    dispose() {
      cancelAnimationFrame(frame);
      studio.dispose();
    },
  };
}

// The Hero sculpture, matching the headline "AI systems and full-stack apps, built for real work": a full-stack
// stack (an interface pane, a logic slab and two data discs) with a violet AI orb wired into it, on a plinth. It shares
// the studio (renderer, lights, materials, palette) with the Work scene and is not related to Aki's robot.
// Renders on demand only: once, then when scroll progress, theme or size changes. No idle loop.
import { CylinderGeometry, Group, Mesh, PerspectiveCamera, SphereGeometry, TorusGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStudio, tones } from '../three/studio.js';

export function createHeroScene(canvas, { theme = 'dark', onLost } = {}) {
  const studio = createStudio(canvas, { onLost });
  const { scene, renderer, key, m } = studio;
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.9, 11);
  camera.lookAt(0, 0.1, 0);
  // Champagne logic, deep-teal data, pearl interface blocks and a violet AI orb: premium in both themes.
  const t = tones({
    disc: { c: ['#2f5560', '#3f6d79'], metal: 0.85, rough: 0.3 },
    slab: { c: ['#e3c27a', '#b0802a'], metal: 1, rough: 0.28 },
    edge: { c: ['#4f5fd8', '#3b4cc0'], metal: 0.5, rough: 0.3 },
    block: { c: ['#dde2ec', '#a3aec0'], metal: 0.85, rough: 0.3 },
    orb: { c: ['#8f7bff', '#6a4fe6'], metal: 0.7, rough: 0.16 },
    orbit: { c: ['#c8d2e2', '#8d9ab0'], metal: 1, rough: 0.25 },
    link: { c: ['#b3a6ff', '#6a4fe6'], glow: true },
  });

  const art = new Group();
  // Tilted toward the camera so the layers show their tops.
  art.rotation.x = 0.3;
  const plinth = new Mesh(new CylinderGeometry(2.3, 2.4, 0.08, 96), m.stone);
  plinth.position.y = -1.75;
  // Data: two database discs.
  const data = [0, 1].map((i) => {
    const disc = new Mesh(new CylinderGeometry(0.95, 0.95, 0.2, 64), t.disc);
    disc.position.y = -1.45 + i * 0.28;
    return disc;
  });
  // Logic: a metal slab. Interface: a glass pane with three blocks of layout on it.
  const logic = new Mesh(new RoundedBoxGeometry(2.3, 0.2, 1.55, 3, 0.06), t.slab);
  const ui = new Group();
  const pane = new Mesh(new RoundedBoxGeometry(2.6, 0.06, 1.75, 2, 0.03), m.glass);
  const edge = new Mesh(new RoundedBoxGeometry(2.66, 0.03, 1.81, 2, 0.015), t.edge);
  edge.position.y = -0.04;
  const blocks = [[-0.55, -0.35, 1.1, 0.5], [0.6, -0.35, 0.9, 0.5], [0, 0.35, 2.1, 0.45]].map(([x, z, w, d]) => {
    const block = new Mesh(new RoundedBoxGeometry(w, 0.06, d, 2, 0.03), t.block);
    block.position.set(x, 0.06, z);
    return block;
  });
  ui.add(edge, pane, ...blocks);
  // AI: an orb with its orbit, linked down into the stack.
  const ai = new Group();
  const orb = new Mesh(new SphereGeometry(0.36, 48, 32), t.orb);
  const orbit = new Mesh(new TorusGeometry(0.62, 0.025, 12, 120), t.orbit);
  const link = new Mesh(new CylinderGeometry(0.012, 0.012, 1, 8), t.link);
  ai.add(orb, orbit);
  const ring = new Mesh(new TorusGeometry(2.15, 0.035, 16, 200), m.satin);
  ring.rotation.set(Math.PI / 2, 0, 0);
  ring.position.y = -1.2;
  art.add(plinth, ...data, logic, ui, ai, link, ring);
  scene.add(art);
  const setColors = (name) => {
    studio.setTheme(name);
    key.color.set(studio.palette().keys[0]);
    t.apply(name);
  };
  setColors(theme);

  let p = 0;
  let frame = 0;
  const render = () => {
    frame = 0;
    // As the Hero scrolls away the layers part a little, like an exploded view, and the orb circles the stack.
    logic.position.y = -0.7 + p * 0.25;
    ui.position.y = -0.15 + p * 0.6;
    const a = 0.7 + p * 1.4;
    ai.position.set(Math.cos(a) * 1.25, 1.05 + p * 0.3, Math.sin(a) * 0.6);
    orbit.rotation.set(Math.PI / 2 - 0.35, 0, p * 1.5);
    link.position.set(ai.position.x, (ai.position.y - 0.36 + ui.position.y) / 2, ai.position.z);
    link.scale.y = Math.max(0.01, ai.position.y - ui.position.y - 0.36);
    art.rotation.y = -0.45 + p * 0.55;
    renderer.render(scene, camera);
  };
  const request = () => { if (!frame) frame = requestAnimationFrame(render); };

  const resize = () => {
    const { w, h } = studio.fit();
    camera.aspect = w / h;
    // Taller than square (phones): step back so the rings stay inside the frame.
    camera.position.z = 11 / Math.min(1, w / h);
    camera.updateProjectionMatrix();
    request();
  };
  resize();

  return {
    setProgress(value) { if (value !== p) { p = value; request(); } },
    setTheme(name) { setColors(name); request(); },
    resize,
    renderNow: render,
    dispose() { cancelAnimationFrame(frame); studio.dispose(); },
  };
}

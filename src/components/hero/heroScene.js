// The Hero sculpture: a brushed-gold slab beside a glass pane, held by two rings, with a small orb. It shares the
// studio (renderer, lights, materials, palette) with the Work scene and is not related to Aki's robot.
// Renders on demand only: once, then when scroll progress, theme or size changes. No idle loop.
import { BoxGeometry, CylinderGeometry, Group, Mesh, PerspectiveCamera, SphereGeometry, TorusGeometry } from 'three';
import { createStudio } from '../three/studio.js';

export function createHeroScene(canvas, { theme = 'dark', onLost } = {}) {
  const studio = createStudio(canvas, { onLost });
  const { scene, renderer, key, m } = studio;
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.9, 11);
  camera.lookAt(0, 0.1, 0);

  const art = new Group();
  const front = new Mesh(new BoxGeometry(1.15, 3.3, 0.22), m.metal);
  front.position.set(0.55, 0.15, 0.35);
  front.rotation.y = -0.42;
  const back = new Mesh(new BoxGeometry(1.45, 2.85, 0.08), m.glass);
  back.position.set(-0.75, 0.05, -0.45);
  back.rotation.y = 0.5;
  const backEdge = new Mesh(new BoxGeometry(1.5, 2.9, 0.04), m.deep);
  backEdge.position.copy(back.position).setZ(back.position.z - 0.07);
  backEdge.rotation.copy(back.rotation);
  const outer = new Mesh(new TorusGeometry(2.15, 0.035, 16, 200), m.satin);
  outer.rotation.set(Math.PI / 2 - 0.32, 0.18, 0);
  outer.position.y = -0.95;
  const inner = new Mesh(new TorusGeometry(1.35, 0.03, 16, 160), m.metal);
  inner.rotation.set(Math.PI / 2 - 0.2, -0.35, 0);
  inner.position.y = 0.25;
  const orb = new Mesh(new SphereGeometry(0.36, 48, 32), m.metal);
  orb.position.set(1.35, 1.75, 0.6);
  const plinth = new Mesh(new CylinderGeometry(2.3, 2.4, 0.08, 96), m.stone);
  plinth.position.y = -1.75;
  art.add(backEdge, back, front, outer, inner, orb, plinth);
  scene.add(art);
  studio.setTheme(theme);
  key.color.set(studio.palette().keys[0]);

  let p = 0;
  let frame = 0;
  const render = () => {
    frame = 0;
    // As the Hero scrolls away the sculpture turns a little and the orb drifts up: depth, not spectacle.
    art.rotation.y = -0.18 + p * 0.55;
    art.rotation.x = 0.04 + p * 0.06;
    orb.position.y = 1.75 + p * 0.5;
    inner.rotation.z = p * 0.8;
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
    setTheme(name) { studio.setTheme(name); key.color.set(studio.palette().keys[0]); request(); },
    resize,
    renderNow: render,
    dispose() { cancelAnimationFrame(frame); studio.dispose(); },
  };
}

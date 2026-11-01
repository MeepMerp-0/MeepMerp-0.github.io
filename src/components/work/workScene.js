// The Work showcase scene: one sculpture per project on one path, authored here with no model or texture files.
// Loaded with import() only when the Work section is near, so Three.js never delays the first paint.
// It renders on demand (scroll, theme, size), never in an idle loop: when scrolling stops, the frame holds.
import {
  BoxGeometry, BufferGeometry, CapsuleGeometry, Color, CubicBezierCurve3, CylinderGeometry, DoubleSide, EdgesGeometry,
  Group, IcosahedronGeometry, InstancedMesh, Line, LineBasicMaterial, LineSegments, MathUtils, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, OctahedronGeometry, PerspectiveCamera, QuadraticBezierCurve3, SphereGeometry,
  TorusGeometry, TubeGeometry, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStudio } from '../three/studio.js';

// Vertical distance between sculptures: the outgoing one rises out of frame as the next rises into it, so a
// transition moves with the scroll and never passes behind the copy on the left.
const SPACING = 6;
const smoothstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const fract = (x) => ((x % 1) + 1) % 1;
// Fixed pseudo-random offsets in [-0.5, 0.5], so a scroll position always draws the same frame.
const jitter = (i, k) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) - 0.5;
// Glow and line materials take the theme's metal colour on every frame, so they follow a theme switch.
const follow = (m, ...materials) => materials.forEach((material) => material.color.copy(m.metal.color));

// Aki's own colours (the launcher's shell, trim and default LEDs), so the sculpture reads as the robot in the corner.
// The launcher itself is a separate 2D canvas and is not touched.
const AKI = { shell: '#7a4a2a', trim: '#c8a27a', screen: '#17110c', led: '#e8f2ff' };

// 0 · Aki: the robot's TV head, assembled from pieces that fall into place as the chapter opens (scene -0.5 to 0).
function buildAki() {
  const g = new Group();
  const body = new Group();
  body.position.y = -0.35;
  g.add(body);
  const shell = new MeshStandardMaterial({ color: AKI.shell, metalness: 0.15, roughness: 0.32 });
  const trim = new MeshStandardMaterial({ color: AKI.trim, metalness: 0.55, roughness: 0.3 });
  const screen = new MeshStandardMaterial({ color: AKI.screen, metalness: 0.2, roughness: 0.18 });
  const led = new MeshBasicMaterial({ color: AKI.led });
  const pieces = [];
  const add = (mesh, x, y, z) => {
    mesh.position.set(x, y, z);
    mesh.userData = { home: mesh.position.clone(), turn: mesh.rotation.clone() };
    body.add(mesh);
    pieces.push(mesh);
  };
  add(new Mesh(new RoundedBoxGeometry(3.1, 2.25, 1.5, 4, 0.42), shell), 0, 0, 0);
  add(new Mesh(new RoundedBoxGeometry(2.45, 1.55, 0.2, 3, 0.18), screen), 0, 0, 0.7);
  [-1, 1].forEach((side) => {
    const ear = new Mesh(new CylinderGeometry(0.34, 0.34, 0.28, 32), trim);
    ear.rotation.z = Math.PI / 2;
    add(ear, side * 1.66, 0, 0);
  });
  add(new Mesh(new CylinderGeometry(0.2, 0.26, 0.16, 24), trim), 0, 1.18, 0);
  add(new Mesh(new CylinderGeometry(0.045, 0.045, 0.6, 12), trim), 0, 1.52, 0);
  add(new Mesh(new SphereGeometry(0.16, 24, 16), led), 0, 1.88, 0);
  // Two block eyes on the LED screen.
  [-1, 1].forEach((side) => add(new Mesh(new RoundedBoxGeometry(0.34, 0.56, 0.05, 2, 0.05), led), side * 0.55, 0.12, 0.83));

  g.userData.update = (s) => {
    // -0.5: scattered above the frame; 0: assembled. The shell lands first and the eyes last.
    const t = MathUtils.clamp((s + 0.5) / 0.45, 0, 1);
    pieces.forEach((piece, i) => {
      const u = MathUtils.clamp((t - (i / pieces.length) * 0.55) / 0.45, 0, 1);
      const rest = 1 - u;
      const { home, turn } = piece.userData;
      // Height falls with the square of time, so each piece speeds up until it lands. The shell starts just inside
      // the top of the frame, so the stage is never empty when the chapter opens.
      const drop = 3.4 + i * 0.3;
      piece.position.set(home.x + jitter(i, 1) * 3 * rest, home.y + drop * (1 - u * u), home.z + jitter(i, 2) * 2 * rest);
      piece.rotation.set(turn.x + jitter(i, 3) * 4 * rest, turn.y + jitter(i, 4) * 4 * rest, turn.z + jitter(i, 5) * 4 * rest);
    });
    g.rotation.set(0.06, -0.32 + Math.max(0, s) * 0.5, 0);
  };
  return g;
}

// 1 · INNERCIRCLE: an AI core in the middle hands task cards out to four agents, inside a ring of floating
// dashboard panels. Abstract: no product screens or data are depicted.
function buildInnerCircle(m) {
  const g = new Group();
  const glow = new MeshBasicMaterial();
  const holo = new MeshBasicMaterial({ transparent: true, opacity: 0.1, side: DoubleSide, depthWrite: false });
  const lines = new LineBasicMaterial({ transparent: true, opacity: 0.7 });
  const base = new Mesh(new CylinderGeometry(2.6, 2.7, 0.12, 96), m.stone);
  base.position.y = -1.45;
  const pedestal = new Mesh(new CylinderGeometry(0.16, 0.34, 1.1, 32), m.satin);
  pedestal.position.y = -0.85;
  const core = new Mesh(new IcosahedronGeometry(0.5, 1), m.metal);
  core.position.y = 0.15;
  const halo = new Mesh(new TorusGeometry(0.85, 0.03, 12, 120), m.deep);
  halo.position.y = 0.15;
  g.add(base, pedestal, core, halo);

  // Curved panels behind and beside the core, each with a few chart bars.
  const PANELS = [[1.7, 0.75], [2.4, -0.05], [Math.PI, 0.85], [3.9, -0.05], [4.6, 0.75]];
  PANELS.forEach(([angle, y]) => {
    const shape = new CylinderGeometry(2.55, 2.55, 0.95, 16, 1, true, angle - 0.32, 0.64);
    const panel = new Mesh(shape, holo);
    const frame = new LineSegments(new EdgesGeometry(shape, 20), lines);
    panel.position.y = y;
    frame.position.y = y;
    g.add(panel, frame);
  });
  const bars = new InstancedMesh(new BoxGeometry(0.09, 1, 0.02), glow, PANELS.length * 4);
  g.add(bars);
  const dummy = new Object3D();

  // Agents on the front arc, each linked to the core by an arched route.
  const agents = [-1.05, -0.35, 0.35, 1.05].map((angle) => {
    const agent = new Mesh(new OctahedronGeometry(0.24, 0), m.metal);
    agent.position.set(Math.sin(angle) * 2.05, -1.0, Math.cos(angle) * 2.05);
    const pad = new Mesh(new TorusGeometry(0.3, 0.02, 8, 48), m.deep);
    pad.rotation.x = Math.PI / 2;
    pad.position.copy(agent.position).setY(-1.36);
    const route = new QuadraticBezierCurve3(core.position.clone(), agent.position.clone().multiplyScalar(0.5).setY(1.25), agent.position.clone());
    g.add(agent, pad, new Line(new BufferGeometry().setFromPoints(route.getPoints(32)), lines));
    const card = new Mesh(new BoxGeometry(0.34, 0.22, 0.025), m.metal);
    card.rotation.y = angle;
    g.add(card);
    return { agent, route, card };
  });

  g.userData.update = (s) => {
    follow(m, glow, holo, lines);
    core.rotation.set(s * 0.6, s * 1.2, 0);
    halo.rotation.set(Math.PI / 2 + Math.sin(s * 1.4) * 0.35, s * 0.8, 0);
    PANELS.forEach(([angle, y], p) => {
      for (let k = 0; k < 4; k += 1) {
        const a = angle - 0.2 + k * 0.13;
        const h = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(k * 1.7 + p * 2.3 + s * 3));
        dummy.position.set(Math.sin(a) * 2.5, y - 0.38 + h / 2, Math.cos(a) * 2.5);
        dummy.rotation.set(0, a, 0);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        bars.setMatrixAt(p * 4 + k, dummy.matrix);
      }
    });
    bars.instanceMatrix.needsUpdate = true;
    // Each card leaves the core, arcs over and lands on its agent, which turns as it takes the task.
    agents.forEach(({ agent, route, card }, k) => {
      const u = fract(s * 1.6 + k * 0.25);
      route.getPoint(u, card.position);
      card.scale.setScalar(Math.max(0.001, MathUtils.smoothstep(u, 0, 0.1) * (1 - MathUtils.smoothstep(u, 0.92, 1))));
      const taken = Math.max(0, 1 - Math.abs(u - 0.95) / 0.15);
      agent.scale.setScalar(1 + 0.35 * taken);
      agent.rotation.y = s * 2 + k;
    });
    g.rotation.y = (s - 1) * 0.35;
  };
  return g;
}

// 2 · Timekeeping: a guard walks into the phone's proximity ring, taps the phone, a face scan verifies them, and
// the attendance entry travels to the web dashboard by itself. Generic figures: no real person, screen or data.
function buildTimekeeping(m) {
  const g = new Group();
  // A wide composition: scaled and shifted so the dashboard stays in frame beside the copy.
  const rig = new Group();
  rig.scale.setScalar(0.78);
  rig.position.x = -0.4;
  g.add(rig);
  const glow = new MeshBasicMaterial();
  const ringMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false });
  const beamMaterial = new LineBasicMaterial({ transparent: true });
  const screenMaterial = new MeshStandardMaterial({ color: '#120e0a', metalness: 0.2, roughness: 0.2 });
  const floor = new Mesh(new BoxGeometry(6.6, 0.1, 2.4), m.stone);
  floor.position.set(0, -1.4, 0);

  // The guard faces the phone (+x): body, head, cap and brim, a badge, and the near arm.
  const guard = new Group();
  const torso = new Mesh(new CapsuleGeometry(0.3, 0.75, 6, 20), m.deep);
  torso.position.y = -0.67;
  const head = new Mesh(new SphereGeometry(0.25, 32, 20), m.satin);
  head.position.y = 0.26;
  const cap = new Mesh(new CylinderGeometry(0.26, 0.27, 0.13, 32), m.deep);
  cap.position.y = 0.47;
  const brim = new Mesh(new BoxGeometry(0.22, 0.03, 0.34), m.deep);
  brim.position.set(0.22, 0.42, 0);
  const badge = new Mesh(new BoxGeometry(0.12, 0.14, 0.03), m.metal);
  badge.position.set(0.1, -0.45, 0.29);
  const arm = new Group();
  arm.position.set(0, -0.12, 0.31);
  const forearm = new Mesh(new BoxGeometry(0.11, 0.62, 0.11), m.deep);
  forearm.position.y = -0.31;
  arm.add(forearm);
  // The face-scan frame: a square that closes in around the head.
  const frame = new Mesh(new TorusGeometry(0.44, 0.014, 4, 4), glow);
  frame.rotation.z = Math.PI / 4;
  frame.position.set(0, 0.3, 0.32);
  guard.add(torso, head, cap, brim, badge, arm, frame);

  const PX = 0.1;
  const stand = new Mesh(new CylinderGeometry(0.04, 0.06, 0.95, 16), m.satin);
  stand.position.set(PX, -0.87, 0.1);
  const phone = new Group();
  phone.position.set(PX, 0.05, 0.15);
  phone.rotation.y = -0.35;
  const handset = new Mesh(new RoundedBoxGeometry(0.56, 1.0, 0.07, 3, 0.07), m.deep);
  const display = new Mesh(new BoxGeometry(0.46, 0.86, 0.01), screenMaterial);
  display.position.z = 0.04;
  const face = new Mesh(new TorusGeometry(0.14, 0.012, 8, 48), glow);
  face.position.set(0, 0.12, 0.05);
  const scanLine = new Mesh(new BoxGeometry(0.4, 0.018, 0.01), glow);
  scanLine.position.z = 0.05;
  phone.add(handset, display, face, scanLine);
  const proximity = new Mesh(new TorusGeometry(1.25, 0.025, 8, 120), ringMaterial);
  proximity.rotation.x = Math.PI / 2;
  proximity.position.set(PX, -1.33, 0.1);
  const beam = new LineSegments(new BufferGeometry().setFromPoints(Array.from({ length: 4 }, () => new Vector3())), beamMaterial);

  // The web dashboard: a browser window whose newest attendance row slides in at the top.
  const web = new Group();
  web.position.set(2.35, 0.15, -0.2);
  web.rotation.y = -0.4;
  const pane = new Mesh(new BoxGeometry(2.1, 1.55, 0.05), m.glass);
  const back = new Mesh(new BoxGeometry(2.14, 1.59, 0.03), m.stone);
  back.position.z = -0.04;
  const bar = new Mesh(new BoxGeometry(2.1, 0.2, 0.07), m.deep);
  bar.position.y = 0.68;
  web.add(back, pane, bar);
  [0, 1, 2].forEach((i) => {
    const dot = new Mesh(new SphereGeometry(0.035, 12, 8), glow);
    dot.position.set(-0.9 + i * 0.11, 0.68, 0.05);
    web.add(dot);
  });
  const rows = [0, 1, 2, 3].map((i) => {
    const row = new Mesh(new BoxGeometry(1.6, 0.12, 0.02), i === 0 ? m.metal : m.satin);
    row.position.z = 0.05;
    web.add(row);
    return row;
  });
  const packet = new Mesh(new SphereGeometry(0.08, 20, 12), glow);
  const route = new QuadraticBezierCurve3(new Vector3(PX, 0.4, 0.25), new Vector3(1.3, 2.0, 0.3), new Vector3(2.33, 0.5, -0.12));
  rig.add(floor, proximity, stand, phone, guard, beam, web, packet);

  g.userData.update = (s) => {
    follow(m, glow, ringMaterial, beamMaterial);
    // One pass over the chapter: walk in, tap, scan, verified, then the entry is sent to the dashboard.
    const ph = MathUtils.clamp((s - 1.5) / 0.9, 0, 1);
    const walk = MathUtils.smoothstep(ph, 0, 0.34);
    const near = MathUtils.smoothstep(ph, 0.24, 0.33);
    const touch = MathUtils.smoothstep(ph, 0.34, 0.46) * (1 - MathUtils.smoothstep(ph, 0.7, 0.8));
    const scan = MathUtils.smoothstep(ph, 0.46, 0.6);
    const verified = MathUtils.smoothstep(ph, 0.62, 0.68);
    const send = MathUtils.smoothstep(ph, 0.68, 0.86);
    const logged = MathUtils.smoothstep(ph, 0.84, 0.94);

    const gx = -2.9 + (PX - 0.75 + 2.9) * walk;
    guard.position.set(gx, walk < 1 ? 0.04 * Math.abs(Math.sin(walk * Math.PI * 7)) : 0, 0);
    arm.rotation.z = touch * 1.35;
    ringMaterial.opacity = 0.15 + 0.8 * near;

    screenMaterial.emissive.copy(m.metal.color).multiplyScalar(0.35 * Math.max(touch, scan * (1 - send)));
    face.visible = scan > 0 && send < 1;
    scanLine.visible = scan > 0 && verified < 1;
    scanLine.position.y = 0.32 - 0.5 * MathUtils.smoothstep(ph, 0.46, 0.62);
    frame.visible = scan > 0 && send < 1;
    frame.scale.setScalar(1.5 - 0.5 * scan);
    beam.visible = scan > 0 && verified < 1;
    beamMaterial.opacity = scan * (1 - verified);
    if (beam.visible) {
      const p = beam.geometry.attributes.position;
      p.setXYZ(0, PX - 0.1, 0.12, 0.25); p.setXYZ(1, gx + 0.3, 0.6, 0.32);
      p.setXYZ(2, PX - 0.1, 0.12, 0.25); p.setXYZ(3, gx + 0.3, 0.0, 0.32);
      p.needsUpdate = true;
    }

    packet.visible = send > 0 && send < 1;
    route.getPoint(send, packet.position);
    rows.forEach((row, i) => {
      row.position.y = 0.35 - (i - 1 + logged) * 0.27;
      if (i === 0) {
        row.scale.x = Math.max(0.001, logged);
        row.position.x = -0.8 * (1 - logged);
      }
    });
    g.rotation.y = (s - 2) * 0.3;
  };
  return g;
}

// 3 · FuturoHub: a workflow. A website form and a chat start it, an assistant node routes the request, and three
// actions fire before the owner is told. Pulses run along the links in order as you scroll. Abstract nodes only.
function buildWorkflow(m) {
  const g = new Group();
  const glow = new MeshBasicMaterial();
  const graph = new Group();
  graph.rotation.x = -0.42;
  graph.scale.setScalar(0.8);
  g.add(graph);
  const board = new Mesh(new BoxGeometry(6.9, 3.6, 0.05), m.glass);
  board.position.z = -0.16;
  graph.add(board);

  const card = new RoundedBoxGeometry(0.95, 0.6, 0.16, 3, 0.08);
  const label = new BoxGeometry(0.55, 0.07, 0.03);
  // [x, y, step at which the node lights]
  const NODES = { web: [-2.7, 0.75, 0], chat: [-2.7, -0.75, 0], ai: [-0.9, 0, 1], sheet: [0.9, 1.2, 2], notify: [0.9, 0, 2],
    alert: [0.9, -1.2, 2], owner: [2.7, 0, 3] };
  const nodes = Object.fromEntries(Object.entries(NODES).map(([name, [x, y, step]]) => {
    const node = new Mesh(card, m.stone);
    node.position.set(x, y, 0);
    const line = new Mesh(label, m.deep);
    line.position.set(-0.08, 0.1, 0.09);
    const short = new Mesh(label, m.deep);
    short.scale.x = 0.6;
    short.position.set(-0.19, -0.08, 0.09);
    node.add(line, short);
    if (name === 'ai') {
      node.scale.setScalar(1.25);
      const orb = new Mesh(new SphereGeometry(0.13, 24, 16), m.metal);
      orb.position.set(0.3, 0, 0.16);
      node.add(orb);
    }
    graph.add(node);
    return [name, { node, step }];
  }));

  const LINKS = [['web', 'ai'], ['chat', 'ai'], ['ai', 'sheet'], ['ai', 'notify'], ['ai', 'alert'], ['sheet', 'owner'],
    ['notify', 'owner'], ['alert', 'owner']];
  const links = LINKS.map(([from, to]) => {
    const a = nodes[from].node.position;
    const b = nodes[to].node.position;
    const out = from === 'ai' ? 0.6 : 0.48;
    const into = to === 'ai' ? 0.6 : 0.48;
    // Leaves the right side of one node and enters the left side of the next, like a workflow editor.
    const curve = new CubicBezierCurve3(new Vector3(a.x + out, a.y, 0), new Vector3(a.x + 1.0, a.y, 0),
      new Vector3(b.x - 1.0, b.y, 0), new Vector3(b.x - into, b.y, 0));
    const tube = new Mesh(new TubeGeometry(curve, 40, 0.022, 6), m.satin);
    const pulse = new Mesh(new SphereGeometry(0.075, 16, 10), glow);
    graph.add(tube, pulse);
    return { curve, pulse, step: nodes[from].step };
  });

  g.userData.update = (s) => {
    follow(m, glow);
    // Steps 0 to 3 light in turn over the chapter's rest and exit (scene 2.45 to 3.45).
    const ph = MathUtils.clamp((s - 2.45) / 1.0, 0, 1) * 3.2;
    links.forEach(({ curve, pulse, step }) => {
      const u = MathUtils.clamp((ph - step - 0.05) / 0.9, 0, 1);
      pulse.visible = u > 0 && u < 1;
      curve.getPoint(u, pulse.position);
    });
    Object.values(nodes).forEach(({ node, step }) => { node.material = ph >= step ? m.metal : m.stone; });
    g.rotation.y = -0.22 + (s - 3) * 0.3;
  };
  return g;
}

export function createWorkScene(canvas, { theme = 'dark', compact = false, onLost } = {}) {
  // Throws when WebGL is unavailable; the caller shows the static emblems instead.
  const studio = createStudio(canvas, { compact, onLost });
  const { renderer, scene, key, rim, m } = studio;
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);

  const groups = [buildAki(m), buildInnerCircle(m), buildTimekeeping(m), buildWorkflow(m)];
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
    // The scene coordinate runs from -0.5 (Aki still assembling) to count - 0.5 (the last workflow finishing).
    // The camera and the hand-overs use the chapter range; each sculpture's own motion gets the full value.
    const c = MathUtils.clamp(s, 0, groups.length - 1);
    const base = Math.min(Math.floor(c), groups.length - 2);
    const f = c - base;
    // Each sculpture rests around its chapter's middle; the hand-over to the next happens near the switch.
    const travel = smoothstep(0.2, 0.8, f);
    const eased = base + travel;
    // The camera orbits a little as you scroll and dips during a hand-over, for parallax.
    const swing = (c - 1.5) * 0.18;
    const distance = size.wide ? 10.5 : 12.5 / Math.min(1, Math.max(0.55, size.w / size.h)) ** 0.6;
    camera.position.set(Math.sin(swing) * distance, 1.6 - Math.sin(travel * Math.PI) * 0.9, Math.cos(swing) * distance);
    camera.lookAt(target);
    // Light colour and strength cross-fade from one chapter's key to the next.
    keyColor.set(palette.keys[base]).lerp(keyNext.set(palette.keys[base + 1]), travel);
    key.color.copy(keyColor);
    rim.intensity = palette.rimPower * (0.8 + 0.4 * Math.sin(f * Math.PI));

    groups.forEach((group, i) => {
      const presence = 1 - MathUtils.clamp(Math.abs(c - i), 0, 1);
      // Only the sculptures being travelled between are drawn, so a resting chapter shows its sculpture alone.
      group.visible = Math.abs(c - i) < 0.98;
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

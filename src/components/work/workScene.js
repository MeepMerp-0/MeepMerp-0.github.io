// The Work showcase scene: one sculpture per project on one path, authored here with no model or texture files.
// Loaded with import() only when the Work section is near, so Three.js never delays the first paint.
// It renders on demand (scroll, theme, size), never in an idle loop: when scrolling stops, the frame holds.
import {
  BoxGeometry, BufferGeometry, CapsuleGeometry, Color, ConeGeometry, CubicBezierCurve3, CylinderGeometry, DoubleSide, EdgesGeometry,
  Group, IcosahedronGeometry, InstancedMesh, Line, LineSegments, MathUtils, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, OctahedronGeometry, PerspectiveCamera, QuadraticBezierCurve3, SphereGeometry,
  TorusGeometry, TubeGeometry, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStudio, tones } from '../three/studio.js';

// Vertical distance between sculptures: the outgoing one rises out of frame as the next rises into it, so a
// transition moves with the scroll and never passes behind the copy on the left.
const SPACING = 6;
const smoothstep = (a, b, x) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const fract = (x) => ((x % 1) + 1) % 1;
// Fixed pseudo-random offsets in [-0.5, 0.5], so a scroll position always draws the same frame.
const jitter = (i, k) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) - 0.5;

// Aki's own colours (the launcher's shell, trim and default LEDs), so the sculpture reads as the robot in the corner.
// The launcher itself is a separate 2D canvas and is not touched.
const AKI = { shell: '#7a4a2a', trim: '#c8a27a', screen: '#17110c', led: '#e8f2ff' };

// 0 · Aki: the robot's TV head, assembled from pieces that fall into place once, on a short timer, the first time
// the chapter is on screen. Scrolling does not drive it, and no piece shows before it starts.
function buildAki() {
  const g = new Group();
  g.userData.frame = [4.4, 3.6];
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

  g.userData.update = (s, ctx) => {
    // ctx.intro runs 0 to 1 over the timed fall. The shell lands first and the eyes last.
    pieces.forEach((piece, i) => {
      const u = MathUtils.clamp((ctx.intro - (i / pieces.length) * 0.55) / 0.45, 0, 1);
      piece.visible = u > 0;
      const rest = 1 - u;
      const { home, turn } = piece.userData;
      // Height falls with the square of time, so each piece speeds up until it lands. Every piece starts above
      // the frame.
      const drop = 5.5 + i * 0.25;
      piece.position.set(home.x + jitter(i, 1) * 3 * rest, home.y + drop * (1 - u * u), home.z + jitter(i, 2) * 2 * rest);
      piece.rotation.set(turn.x + jitter(i, 3) * 4 * rest, turn.y + jitter(i, 4) * 4 * rest, turn.z + jitter(i, 5) * 4 * rest);
    });
    g.rotation.set(0.06, -0.32 + Math.max(0, s) * 0.5, 0);
  };
  return g;
}

// 1 · INNERCIRCLE: an AI core in the middle hands task cards out to four agents, inside an arc of floating
// dashboard panels. Sapphire, cyan and silver, after the owner's reference. Abstract: no product screens or data.
function buildInnerCircle() {
  const g = new Group();
  g.userData.frame = [5.8, 4.0];
  const t = tones({
    base: { c: ['#1a2130', '#e3e8f0'], metal: 0.2, rough: 0.7 },
    core: { c: ['#4f7dff', '#2c5ae0'], metal: 0.85, rough: 0.18 },
    silver: { c: ['#c8d2e2', '#8d9ab0'], metal: 1, rough: 0.25 },
    halo: { c: ['#7fdcff', '#1689c4'], glow: true },
    holo: { c: ['#7fdcff', '#1f7fbf'], glow: true, opacity: 0.1, side: DoubleSide },
    lines: { c: ['#8fe3ff', '#1f7fbf'], line: true, opacity: 0.75 },
    bars: { c: ['#8fe3ff', '#2a8fd0'], glow: true },
    card: { c: ['#ffb547', '#d48806'], metal: 0.7, rough: 0.3 },
  });
  const base = new Mesh(new CylinderGeometry(2.6, 2.7, 0.12, 96), t.base);
  base.position.y = -1.45;
  const pedestal = new Mesh(new CylinderGeometry(0.16, 0.34, 1.1, 32), t.silver);
  pedestal.position.y = -0.85;
  const core = new Mesh(new IcosahedronGeometry(0.5, 1), t.core);
  core.position.y = 0.15;
  const halo = new Mesh(new TorusGeometry(0.85, 0.025, 12, 120), t.halo);
  halo.position.y = 0.15;
  g.add(base, pedestal, core, halo);

  // Curved panels behind and beside the core, each with a few chart bars.
  const PANELS = [[1.7, 0.75], [2.4, -0.05], [Math.PI, 0.85], [3.9, -0.05], [4.6, 0.75]];
  PANELS.forEach(([angle, y]) => {
    const shape = new CylinderGeometry(2.55, 2.55, 0.95, 16, 1, true, angle - 0.32, 0.64);
    const panel = new Mesh(shape, t.holo);
    const frame = new LineSegments(new EdgesGeometry(shape, 20), t.lines);
    panel.position.y = y;
    frame.position.y = y;
    g.add(panel, frame);
  });
  const bars = new InstancedMesh(new BoxGeometry(0.09, 1, 0.02), t.bars, PANELS.length * 4);
  g.add(bars);
  const dummy = new Object3D();

  // Agents on the front arc, each linked to the core by an arched route.
  const agents = [-1.05, -0.35, 0.35, 1.05].map((angle) => {
    const agent = new Mesh(new OctahedronGeometry(0.24, 0), t.silver);
    agent.position.set(Math.sin(angle) * 2.05, -1.0, Math.cos(angle) * 2.05);
    const pad = new Mesh(new TorusGeometry(0.3, 0.02, 8, 48), t.halo);
    pad.rotation.x = Math.PI / 2;
    pad.position.copy(agent.position).setY(-1.36);
    const route = new QuadraticBezierCurve3(core.position.clone(), agent.position.clone().multiplyScalar(0.5).setY(1.25), agent.position.clone());
    g.add(agent, pad, new Line(new BufferGeometry().setFromPoints(route.getPoints(32)), t.lines));
    const card = new Mesh(new BoxGeometry(0.34, 0.22, 0.025), t.card);
    card.rotation.y = angle;
    g.add(card);
    return { agent, route, card };
  });

  g.userData.update = (s, ctx) => {
    t.apply(ctx.theme);
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
    // Each card leaves the core, arcs over and lands on its agent, which grows as it takes the task.
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

// 2 · Timekeeping: a guard walks into the proximity ring around their post and raises their own phone; once the
// arm is level the phone shows, a face scan on it verifies them, and the attendance entry travels to the web
// dashboard by itself. Navy, teal and emerald. Generic figure: no real person, screen or data.
function buildTimekeeping() {
  const g = new Group();
  g.userData.frame = [5.4, 2.8];
  // A wide composition: scaled and shifted so the dashboard stays in frame beside the copy.
  const rig = new Group();
  rig.scale.setScalar(0.78);
  rig.position.x = -0.4;
  g.add(rig);
  const t = tones({
    floor: { c: ['#1f242c', '#cdd3dc'], metal: 0.15, rough: 0.8 },
    navy: { c: ['#2f4170', '#2a3c6b'], metal: 0.3, rough: 0.5 },
    pearl: { c: ['#e9e4dc', '#d8d1c6'], metal: 0.1, rough: 0.45 },
    gold: { c: ['#e8c67e', '#b07f22'], metal: 1, rough: 0.25 },
    graphite: { c: ['#1c1f25', '#2a2e36'], metal: 0.6, rough: 0.3 },
    silver: { c: ['#c8d2e2', '#8d9ab0'], metal: 1, rough: 0.25 },
    scan: { c: ['#5ef0d0', '#0c9a83'], glow: true },
    beam: { c: ['#5ef0d0', '#0c9a83'], line: true, opacity: 1 },
    ring: { c: ['#3ee08f', '#11904f'], glow: true, opacity: 1 },
    ok: { c: ['#3ee08f', '#11904f'], glow: true },
    slate: { c: ['#262c36', '#fbfcfd'], metal: 0.2, rough: 0.6 },
    indigo: { c: ['#5867e8', '#3b4cc0'], metal: 0.4, rough: 0.35 },
    row: { c: ['#4a5468', '#aeb7c6'], metal: 0.3, rough: 0.5 },
    fresh: { c: ['#3ee08f', '#11904f'], metal: 0.4, rough: 0.35 },
    red: { c: ['#ff6b5e', '#d6453a'], glow: true },
    amber: { c: ['#ffbd4a', '#d18b00'], glow: true },
  });
  const screenMaterial = new MeshStandardMaterial({ color: '#0d1014', metalness: 0.2, roughness: 0.2 });
  const floor = new Mesh(new BoxGeometry(6.6, 0.1, 2.4), t.floor);
  floor.position.set(0, -1.4, 0);

  // The guard faces +x: uniform, head, cap and brim, a badge, and the near arm.
  const guard = new Group();
  const torso = new Mesh(new CapsuleGeometry(0.3, 0.75, 6, 20), t.navy);
  torso.position.y = -0.67;
  const head = new Mesh(new SphereGeometry(0.25, 32, 20), t.pearl);
  head.position.y = 0.26;
  const cap = new Mesh(new CylinderGeometry(0.26, 0.27, 0.13, 32), t.navy);
  cap.position.y = 0.47;
  const brim = new Mesh(new BoxGeometry(0.22, 0.03, 0.34), t.navy);
  brim.position.set(0.22, 0.42, 0);
  const capBadge = new Mesh(new BoxGeometry(0.03, 0.06, 0.08), t.gold);
  capBadge.position.set(0.26, 0.48, 0);
  const badge = new Mesh(new BoxGeometry(0.12, 0.14, 0.03), t.gold);
  badge.position.set(0.1, -0.45, 0.29);
  const SHOULDER = new Vector3(0, -0.12, 0.31);
  const ARM = 0.62;
  const arm = new Group();
  arm.position.copy(SHOULDER);
  const forearm = new Mesh(new BoxGeometry(0.11, ARM, 0.11), t.navy);
  forearm.position.y = -ARM / 2;
  arm.add(forearm);
  // The face-scan frame: a square that closes in around the head.
  const frame = new Mesh(new TorusGeometry(0.44, 0.014, 4, 4), t.scan);
  frame.rotation.z = Math.PI / 4;
  frame.position.set(0, 0.3, 0.32);
  // The guard's own phone, held upright in the hand with its screen turned to the guard's face.
  const phone = new Group();
  phone.rotation.y = -Math.PI / 2 + 0.55;
  const handset = new Mesh(new RoundedBoxGeometry(0.36, 0.66, 0.045, 3, 0.045), t.graphite);
  const display = new Mesh(new BoxGeometry(0.3, 0.57, 0.01), screenMaterial);
  display.position.z = 0.022;
  const face = new Mesh(new TorusGeometry(0.075, 0.008, 8, 40), t.scan);
  face.position.set(0, 0.07, 0.03);
  const scanLine = new Mesh(new BoxGeometry(0.22, 0.012, 0.01), t.scan);
  scanLine.position.z = 0.03;
  phone.add(handset, display, face, scanLine);
  guard.add(torso, head, cap, brim, capBadge, badge, arm, frame, phone);

  // The post: a beacon behind the centre of the proximity ring.
  const PX = 0.1;
  const post = new Mesh(new CylinderGeometry(0.06, 0.09, 1.3, 16), t.silver);
  post.position.set(PX + 0.6, -0.7, -0.7);
  const beacon = new Mesh(new SphereGeometry(0.11, 20, 12), t.ok);
  beacon.position.set(PX + 0.6, 0.02, -0.7);
  const proximity = new Mesh(new TorusGeometry(1.25, 0.025, 8, 120), t.ring);
  proximity.rotation.x = Math.PI / 2;
  proximity.position.set(PX + 0.35, -1.33, -0.3);
  const beam = new LineSegments(new BufferGeometry().setFromPoints(Array.from({ length: 4 }, () => new Vector3())), t.beam);

  // The web dashboard: a browser window whose newest attendance row slides in at the top.
  const web = new Group();
  web.position.set(2.35, 0.15, -0.2);
  web.rotation.y = -0.4;
  const pane = new Mesh(new BoxGeometry(2.1, 1.55, 0.05), t.slate);
  const bar = new Mesh(new BoxGeometry(2.1, 0.2, 0.07), t.indigo);
  bar.position.y = 0.68;
  web.add(pane, bar);
  [t.red, t.amber, t.ok].forEach((material, i) => {
    const dot = new Mesh(new SphereGeometry(0.035, 12, 8), material);
    dot.position.set(-0.9 + i * 0.11, 0.68, 0.05);
    web.add(dot);
  });
  const rows = [0, 1, 2, 3].map((i) => {
    const row = new Mesh(new BoxGeometry(1.6, 0.12, 0.02), i === 0 ? t.fresh : t.row);
    row.position.z = 0.04;
    web.add(row);
    return row;
  });
  const packet = new Mesh(new SphereGeometry(0.08, 20, 12), t.ok);
  const route = new QuadraticBezierCurve3(new Vector3(), new Vector3(1.3, 2.0, 0.3), new Vector3(2.33, 0.5, -0.12));
  rig.add(floor, proximity, post, beacon, guard, beam, web, packet);

  g.userData.update = (s, ctx) => {
    t.apply(ctx.theme);
    // One pass over the chapter: walk into the ring, raise the phone, face scan, verified, entry sent and logged.
    const ph = MathUtils.clamp((s - 1.5) / 0.9, 0, 1);
    const walk = MathUtils.smoothstep(ph, 0, 0.3);
    const near = MathUtils.smoothstep(ph, 0.2, 0.28);
    const raise = MathUtils.smoothstep(ph, 0.3, 0.42) * (1 - MathUtils.smoothstep(ph, 0.86, 0.96));
    const scan = MathUtils.smoothstep(ph, 0.44, 0.58);
    const verified = MathUtils.smoothstep(ph, 0.6, 0.66);
    const send = MathUtils.smoothstep(ph, 0.66, 0.84);
    const logged = MathUtils.smoothstep(ph, 0.82, 0.92);

    const gx = -2.9 + (PX - 0.55 + 2.9) * walk;
    guard.position.set(gx, walk < 1 ? 0.04 * Math.abs(Math.sin(walk * Math.PI * 7)) : 0, 0);
    t.ring.opacity = 0.2 + 0.8 * near;

    // The arm swings up to level; the phone only shows once it is level, held just above the hand.
    const a = raise * Math.PI / 2;
    arm.rotation.z = a;
    const held = MathUtils.smoothstep(a, 1.35, 1.55);
    phone.visible = held > 0;
    phone.scale.setScalar(Math.max(0.001, held));
    phone.position.set(SHOULDER.x + Math.sin(a) * ARM, SHOULDER.y - Math.cos(a) * ARM + 0.26, SHOULDER.z);
    screenMaterial.emissive.copy(t.scan.color).multiplyScalar(0.35 * held * Math.max(0.3, scan * (1 - send)));

    const scanning = held > 0.9 && scan > 0;
    face.visible = scanning && send < 1;
    scanLine.visible = scanning && verified < 1;
    scanLine.position.y = 0.2 - 0.32 * MathUtils.smoothstep(ph, 0.44, 0.6);
    frame.visible = scanning && send < 1;
    frame.material = verified > 0.5 ? t.ok : t.scan;
    face.material = frame.material;
    frame.scale.setScalar(1.5 - 0.5 * scan);
    beam.visible = scanning && verified < 1;
    t.beam.opacity = scan * (1 - verified);
    const px = gx + phone.position.x - 0.05;
    const py = phone.position.y;
    if (beam.visible) {
      const p = beam.geometry.attributes.position;
      p.setXYZ(0, px, py, 0.31); p.setXYZ(1, gx + 0.22, 0.6, 0.32);
      p.setXYZ(2, px, py, 0.31); p.setXYZ(3, gx + 0.22, 0.0, 0.32);
      p.needsUpdate = true;
    }

    route.v0.set(px + 0.05, py, 0.31);
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

// 3 · FuturoHub: workflow automation. Orders and messages arrive from four channels (a chat app, social DMs, a
// website message and a point-of-sale terminal); an assistant node reads each one and an if/else gate routes it:
// orders go to the order sheet and the owner's alert, anything else gets an auto-reply and a hand-off. Two runs play
// as you scroll: a chat order takes the yes branch, then a website message takes the no branch. Abstract nodes only.
function buildWorkflow() {
  const g = new Group();
  g.userData.frame = [5.4, 2.9];
  const t = tones({
    board: { c: ['#1b1f26', '#dcd8d0'], metal: 0.1, rough: 0.85 },
    card: { c: ['#2a2f38', '#fdfcf9'], metal: 0.35, rough: 0.4 },
    ink: { c: ['#4f5662', '#a7adb7'], metal: 0.3, rough: 0.5 },
    link: { c: ['#4a505b', '#a3a9b3'], metal: 0.5, rough: 0.45 },
    chat: { c: ['#2fd27a', '#0f8a47'], glow: true },
    social: { c: ['#ff5c8f', '#c2185b'], glow: true },
    web: { c: ['#5b93ff', '#2459d6'], glow: true },
    pos: { c: ['#ffb547', '#b86e00'], glow: true },
    ai: { c: ['#a58bff', '#6a46e0'], glow: true },
    orb: { c: ['#9a83ff', '#6a46e0'], metal: 0.6, rough: 0.2 },
    gate: { c: ['#e8c67e', '#a3701c'], metal: 0.95, rough: 0.22 },
    yes: { c: ['#3ee08f', '#11904f'], glow: true },
    no: { c: ['#ff7a66', '#c93a24'], glow: true },
    dim: { c: ['#3d434d', '#c3c8d0'], glow: true },
  });
  const graph = new Group();
  graph.rotation.x = -0.42;
  graph.scale.setScalar(0.62);
  graph.position.x = 0.25;
  g.add(graph);
  const board = new Mesh(new RoundedBoxGeometry(8.6, 4.1, 0.05, 2, 0.02), t.board);
  board.position.z = -0.16;
  graph.add(board);

  // Small icons, one per node, in the node's colour.
  const mesh = (geometry, material, x = 0, y = 0, z = 0, rz = 0) => {
    const o = new Mesh(geometry, material);
    o.position.set(x, y, z);
    o.rotation.z = rz;
    return o;
  };
  const group = (...children) => { const o = new Group(); o.add(...children); return o; };
  const ICONS = {
    chat: (c) => group(mesh(new TorusGeometry(0.1, 0.024, 8, 32), c), mesh(new ConeGeometry(0.04, 0.09, 8), c, -0.07, -0.1, 0, 0.7)),
    social: (c) => group(mesh(new TorusGeometry(0.12, 0.02, 4, 4), c, 0, 0, 0, Math.PI / 4), mesh(new TorusGeometry(0.045, 0.018, 8, 24), c),
      mesh(new SphereGeometry(0.018, 8, 6), c, 0.055, 0.055)),
    web: (c) => group(mesh(new BoxGeometry(0.24, 0.16, 0.02), c), mesh(new BoxGeometry(0.14, 0.02, 0.02), t.card, -0.055, 0.035, 0.012, -0.5),
      mesh(new BoxGeometry(0.14, 0.02, 0.02), t.card, 0.055, 0.035, 0.012, 0.5)),
    pos: (c) => group(mesh(new BoxGeometry(0.17, 0.2, 0.03), c), mesh(new BoxGeometry(0.11, 0.08, 0.02), t.ink, 0, 0.14),
      mesh(new BoxGeometry(0.11, 0.05, 0.01), t.card, 0, 0.04, 0.02)),
    ai: () => group(mesh(new SphereGeometry(0.11, 24, 16), t.orb), mesh(new TorusGeometry(0.16, 0.012, 8, 40), t.ai, 0, 0, 0, 0.5)),
    sheet: (c) => group(...[0.06, 0, -0.06].map((y) => mesh(new BoxGeometry(0.2, 0.03, 0.02), c, 0, y)), mesh(new BoxGeometry(0.02, 0.16, 0.02), c, -0.03)),
    bell: (c) => group(mesh(new ConeGeometry(0.09, 0.14, 16), c, 0, 0.02), mesh(new SphereGeometry(0.025, 8, 6), c, 0, -0.07)),
    person: (c) => group(mesh(new SphereGeometry(0.05, 12, 8), c, 0, 0.06), mesh(new CapsuleGeometry(0.06, 0.04, 4, 12), c, 0, -0.07)),
  };

  const card = new RoundedBoxGeometry(0.95, 0.6, 0.16, 3, 0.08);
  const strip = new BoxGeometry(0.06, 0.44, 0.03);
  const label = new BoxGeometry(0.36, 0.06, 0.03);
  const nodes = {};
  const addNode = (name, x, y, color, icon, scale = 1) => {
    const body = new Mesh(card, t.card);
    body.position.set(x, y, 0);
    body.scale.setScalar(scale);
    const accent = mesh(strip, t.dim, -0.41, 0, 0.085);
    const long = mesh(label, t.ink, 0.17, 0.08, 0.085);
    const short = mesh(label, t.ink, 0.1, -0.08, 0.085);
    short.scale.x = 0.6;
    const glyph = ICONS[icon](t[color]);
    glyph.position.set(-0.2, 0, 0.1);
    body.add(accent, long, short, glyph);
    graph.add(body);
    nodes[name] = { body, accent, color, x, y };
  };
  [['chat', 'chat'], ['social', 'social'], ['web', 'web'], ['pos', 'pos']].forEach(([name, icon], i) => addNode(name, -3.4, 1.35 - i * 0.9, name, icon));
  addNode('ai', -1.7, 0, 'ai', 'ai', 1.15);
  addNode('order', 1.7, 0.95, 'yes', 'sheet');
  addNode('notify', 3.4, 0.95, 'yes', 'bell');
  addNode('reply', 1.7, -0.95, 'no', 'chat');
  addNode('handoff', 3.4, -0.95, 'no', 'person');

  // The if/else gate: a diamond with its input on the left, "yes" from the top and "no" from the bottom.
  const gate = new Mesh(new RoundedBoxGeometry(0.6, 0.6, 0.18, 3, 0.06), t.gate);
  gate.rotation.z = Math.PI / 4;
  const tick = group(mesh(new BoxGeometry(0.08, 0.025, 0.02), t.dim, -0.04, -0.01, 0, -0.8), mesh(new BoxGeometry(0.15, 0.025, 0.02), t.dim, 0.03, 0.01, 0, 0.9));
  tick.position.set(0.32, 0.6, 0.05);
  const cross = group(mesh(new BoxGeometry(0.15, 0.025, 0.02), t.dim, 0, 0, 0, 0.785), mesh(new BoxGeometry(0.15, 0.025, 0.02), t.dim, 0, 0, 0, -0.785));
  cross.position.set(0.32, -0.6, 0.05);
  graph.add(gate, tick, cross);
  const marks = { yes: tick, no: cross };

  const v = (x, y) => new Vector3(x, y, 0);
  const horizontal = (a, b) => new CubicBezierCurve3(a, v(a.x + 0.6, a.y), v(b.x - 0.6, b.y), b);
  const links = {};
  const addLink = (key, curve) => {
    const tube = new Mesh(new TubeGeometry(curve, 40, 0.022, 6), t.link);
    const pulse = new Mesh(new SphereGeometry(0.075, 16, 10), t.dim);
    graph.add(tube, pulse);
    links[key] = { curve, tube, pulse };
  };
  ['chat', 'social', 'web', 'pos'].forEach((name) => addLink(`${name}-ai`, horizontal(v(-2.92, nodes[name].y), v(-2.25, 0))));
  addLink('ai-gate', horizontal(v(-1.15, 0), v(-0.43, 0)));
  addLink('gate-order', new CubicBezierCurve3(v(0, 0.43), v(0, 0.95), v(0.6, 0.95), v(1.22, 0.95)));
  addLink('gate-reply', new CubicBezierCurve3(v(0, -0.43), v(0, -0.95), v(0.6, -0.95), v(1.22, -0.95)));
  addLink('order-notify', horizontal(v(2.18, 0.95), v(2.92, 0.95)));
  addLink('reply-handoff', horizontal(v(2.18, -0.95), v(2.92, -0.95)));

  const RUNS = [['chat', 'yes', ['order', 'notify']], ['web', 'no', ['reply', 'handoff']]].map(([from, branch, [b1, b2]]) => ({
    branch,
    path: [from, 'ai', 'gate', b1, b2],
    hops: [[`${from}-ai`, from], ['ai-gate', 'ai'], [`gate-${b1}`, branch], [`${b1}-${b2}`, branch]],
  }));

  g.userData.update = (s, ctx) => {
    t.apply(ctx.theme);
    // Two runs over the chapter's rest and exit (scene 2.45 to 3.45), four hops each.
    const ph = MathUtils.clamp((s - 2.45) / 1.0, 0, 1);
    const index = ph < 0.5 ? 0 : 1;
    const run = RUNS[index];
    const at = (ph - index * 0.5) * 2 * 4.4;
    Object.values(links).forEach((link) => { link.tube.material = t.link; link.pulse.visible = false; });
    Object.values(nodes).forEach((node) => { node.accent.material = t.dim; node.body.position.z = 0; });
    run.hops.forEach(([key, color], k) => {
      const link = links[key];
      const u = MathUtils.clamp(at - k, 0, 1);
      link.pulse.material = t[color];
      link.pulse.visible = u > 0 && u < 1;
      link.curve.getPoint(u, link.pulse.position);
      if (u > 0) link.tube.material = t[color];
    });
    run.path.forEach((name, j) => {
      const node = nodes[name];
      if (!node || at < Math.max(j, 0.01)) return;
      node.accent.material = t[node.color];
      node.body.position.z = 0.08;
    });
    // The gate shows which way it went.
    Object.entries(marks).forEach(([branch, mark]) => {
      const on = branch === run.branch && at >= 2;
      mark.children.forEach((bar) => { bar.material = on ? t[branch] : t.dim; });
    });
    gate.rotation.y = at >= 2 && at < 3 ? (at - 2) * Math.PI : 0;
    g.rotation.y = -0.1 + (s - 3) * 0.25;
  };
  return g;
}

export function createWorkScene(canvas, { theme = 'dark', compact = false, onLost } = {}) {
  // Throws when WebGL is unavailable; the caller shows the static emblems instead.
  const studio = createStudio(canvas, { compact, onLost });
  const { renderer, scene, key, rim } = studio;
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);

  const groups = [buildAki(), buildInnerCircle(), buildTimekeeping(), buildWorkflow()];
  groups.forEach((group) => scene.add(group));

  let s = 0;
  let themeName = theme;
  let palette = studio.setTheme(theme);
  // Aki's one-time assembly: starts the first time the canvas is on screen with Aki showing, then plays on a timer.
  const INTRO_MS = 1600;
  let inView = false;
  let introStart = null;
  const ctx = { theme, intro: 0 };
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
    // A wide stage keeps one distance. A narrow stage (phones, the strip band) moves in until the sculpture,
    // blended between the two being travelled between, just fits, so it fills the band instead of sitting small.
    const [aw, ah] = groups[base].userData.frame;
    const [bw, bh] = groups[base + 1].userData.frame;
    const fw = MathUtils.lerp(aw, bw, travel);
    const fh = MathUtils.lerp(ah, bh, travel);
    const tan = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const fit = 1.15 * Math.max(fh / 2 / tan, fw / 2 / (tan * camera.aspect));
    const distance = size.wide ? 10.5 : Math.max(6, fit);
    camera.position.set(Math.sin(swing) * distance, 1.6 - Math.sin(travel * Math.PI) * 0.9, Math.cos(swing) * distance);
    camera.lookAt(target);
    // Light colour and strength cross-fade from one chapter's key to the next.
    keyColor.set(palette.keys[base]).lerp(keyNext.set(palette.keys[base + 1]), travel);
    key.color.copy(keyColor);
    rim.intensity = palette.rimPower * (0.8 + 0.4 * Math.sin(f * Math.PI));

    if (introStart === null && inView && c < 0.98) introStart = performance.now();
    ctx.theme = themeName;
    ctx.intro = introStart === null ? 0 : Math.min(1, (performance.now() - introStart) / INTRO_MS);
    groups.forEach((group, i) => {
      const presence = 1 - MathUtils.clamp(Math.abs(c - i), 0, 1);
      // Only the sculptures being travelled between are drawn, so a resting chapter shows its sculpture alone.
      group.visible = Math.abs(c - i) < 0.98;
      if (!group.visible) return;
      group.userData.update(s, ctx);
      group.position.y = (eased - i) * SPACING;
      group.scale.setScalar(0.82 + 0.18 * presence);
    });
    renderer.render(scene, camera);
    // The only timed animation: keep drawing until the assembly lands, then go back to drawing on demand.
    if (introStart !== null && ctx.intro < 1) request();
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
    setTheme(name) { themeName = name; palette = studio.setTheme(name); request(); },
    setInView(value) { if (value !== inView) { inView = value; request(); } },
    resize,
    // Renders the current state now; the caller uses it to know the first frame has been drawn.
    renderNow: render,
    dispose() {
      cancelAnimationFrame(frame);
      studio.dispose();
    },
  };
}

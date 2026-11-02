// The Hero journey as pure functions of one scroll progress value p in [0, 1]: Inputs, then Intelligence, then
// Application. The scene, the stage labels and the type all read from here, so a given p always gives the same
// frame, holding still when scrolling stops and reversing exactly when scrolling goes back up.
// No DOM, Three.js or timers, so Node tests can import it.

export const STAGES = ['Inputs', 'Intelligence', 'Application'];

// The signal waits at Inputs, reaches the core at `core`, and rests at Application from `end` on.
export const SIGNAL = { start: 0.08, core: 0.45, end: 0.72 };
// The camera's closing zoom-out runs from SIGNAL.end to here, then holds on the full view.
export const ZOOM_END = 0.94;
// Where the core sits along the route (0 = first input, 1 = application).
export const ROUTE_CORE = 0.5;
// The camera never comes closer than this to the core's centre, so the near plane cannot cut into it.
export const CORE_CLEARANCE = 2.6;
export const CORE = [0, 0.4, -3];
// The scene camera's vertical field of view in degrees. The projection test uses the same value.
export const HERO_FOV = 34;

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
// Smootherstep from a to b: 0 before a, 1 after b, zero velocity at both ends.
export const ease = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// Position of the signal along the route, 0..1.
export function signalAt(p) {
  if (p <= SIGNAL.core) return ROUTE_CORE * ease(SIGNAL.start, SIGNAL.core, p);
  return mix(ROUTE_CORE, 1, ease(SIGNAL.core, SIGNAL.end, p));
}

// The stage the journey is in, for aria-current and the label marker.
export function activeStage(p) {
  return p < 0.27 ? 0 : p < 0.6 ? 1 : 2;
}

// How strongly each stage is emphasised, 0..1. Neighbouring stages cross-fade.
export function stageWeights(p) {
  return [
    1 - ease(0.17, 0.37, p),
    ease(0.17, 0.37, p) * (1 - ease(0.5, 0.7, p)),
    ease(0.5, 0.7, p),
  ];
}

// Typography follows the same progress: the headline lifts a little and its accent line warms toward the end.
export function typeAt(p) {
  return { lift: -16 * ease(0, 1, p), accent: ease(0.15, 0.95, p) };
}

// A camera pose from the point it looks at: distance, elevation above the ground plane and azimuth (positive is to the
// right of straight-on), the last two in degrees.
const orbit = (target, distance, elevation, azimuth) => {
  const el = (elevation * Math.PI) / 180;
  const az = (azimuth * Math.PI) / 180;
  return {
    position: [target[0] + distance * Math.cos(el) * Math.sin(az), target[1] + distance * Math.sin(el),
      target[2] + distance * Math.cos(el) * Math.cos(az)],
    target,
  };
};

// Camera keyframes, one per beat boundary. The scene is a frontal row of three layers (see heroScene.js): the overview
// looks at the row almost head-on from slightly above, the close-up sits about 3.2 from the core, a little off-axis so
// the fins show their depth, then the camera opens out to the right so Application is large with the core partly in
// frame, and finally pulls back to a frontal view of the whole row, wider than the opening (8.9 against 7.4 from the
// same target). `fit` is how much of the narrow-canvas step-back applies at that key. The projection test keeps them
// framed.
const OVERVIEW = [0.46, 0.5, -3];
const KEYS = [
  { ...orbit(OVERVIEW, 7.4, 3, 0), fit: 1 },
  { ...orbit(CORE, 3.2, 10, 22), fit: 0.5 },
  { ...orbit([2.75, 0.45, -3], 5.4, 8, 12), fit: 1 },
  { ...orbit(OVERVIEW, 8.9, 3, 0), fit: 1 },
];
// Beat boundaries: hold, move in, open toward Application, zoom out, hold.
const BEATS = [SIGNAL.start, SIGNAL.core, SIGNAL.end, ZOOM_END];

// Canvas aspect at and above which the overview fits without stepping back.
const FIT_ASPECT = 1.74;

// Camera pose for progress p and the canvas aspect ratio (width / height). Narrow canvases step back along the view
// direction so the overview still fits; the close-up steps back less. Each beat eases between two keys, so the pose is
// continuous across beats. Returns plain arrays.
export function cameraAt(p, aspect = 16 / 9) {
  const i = p <= BEATS[1] ? 0 : p <= BEATS[2] ? 1 : 2;
  const [from, to] = [KEYS[i], KEYS[i + 1]];
  const t = ease(BEATS[i], BEATS[i + 1], p);
  const target = mix3(from.target, to.target, t);
  let position = mix3(from.position, to.position, t);
  const narrow = Math.min(3.4, Math.max(1, FIT_ASPECT / Math.max(0.2, aspect)));
  position = mix3(target, position, 1 + (narrow - 1) * mix(from.fit, to.fit, t));
  // Clearance from the core, enforced rather than assumed.
  const d = position.map((v, j) => v - CORE[j]);
  const len = Math.hypot(...d);
  if (len < CORE_CLEARANCE) position = CORE.map((c, j) => c + (d[j] / len) * CORE_CLEARANCE);
  return { position, target };
}

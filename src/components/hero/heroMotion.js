// The Hero journey as pure functions of one scroll progress value p in [0, 1]: Inputs, then Intelligence, then
// Application. The scene, the stage labels and the type all read from here, so a given p always gives the same
// frame, holding still when scrolling stops and reversing exactly when scrolling goes back up.
// No DOM, Three.js or timers, so Node tests can import it.

export const STAGES = ['Inputs', 'Intelligence', 'Application'];

// The signal waits at Inputs, reaches the core at CORE, and rests at Application from END on.
export const SIGNAL = { start: 0.08, core: 0.5, end: 0.92 };
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
  return p < 0.3 ? 0 : p < 0.7 ? 1 : 2;
}

// How strongly each stage is emphasised, 0..1. Neighbouring stages cross-fade.
export function stageWeights(p) {
  return [
    1 - ease(0.2, 0.4, p),
    ease(0.2, 0.4, p) * (1 - ease(0.6, 0.8, p)),
    ease(0.6, 0.8, p),
  ];
}

// Typography follows the same progress: the headline lifts a little and its accent line warms toward the end.
export function typeAt(p) {
  return { lift: -16 * ease(0, 1, p), accent: ease(0.15, 0.95, p) };
}

// Camera keyframes: a wide overview of all three layers, a close view of the core (about 6.7 from it), then an end view
// that opens out and leans toward Application. The projection test keeps all three framed at p = 0 and 1.
const KEYS = [
  { position: [1.2, 3.8, 11.8], target: [-0.4, 0.3, -2] },
  { position: [1.2, 2.0, 3.3], target: CORE },
  { position: [4, 3, 15.6], target: [2.05, 0.3, -1.6] },
];

// Canvas aspect at and above which the overview fits without stepping back.
const FIT_ASPECT = 1.74;

// Camera pose for progress p and the canvas aspect ratio (width / height). Narrow canvases step back along the view
// direction so the overview still fits; the close-up steps back less. Returns plain arrays.
export function cameraAt(p, aspect = 16 / 9) {
  const a = ease(SIGNAL.start, SIGNAL.core, p);
  const b = ease(SIGNAL.core, SIGNAL.end, p);
  const from = p <= SIGNAL.core ? KEYS[0] : KEYS[1];
  const to = p <= SIGNAL.core ? KEYS[1] : KEYS[2];
  const t = p <= SIGNAL.core ? a : b;
  const target = mix3(from.target, to.target, t);
  let position = mix3(from.position, to.position, t);
  const narrow = Math.min(2.4, Math.max(1, FIT_ASPECT / Math.max(0.2, aspect)));
  // Full step-back at the overviews, half of it at the close-up.
  const closeness = p <= SIGNAL.core ? a : 1 - b;
  const k = mix(narrow, 1 + (narrow - 1) * 0.5, closeness);
  position = mix3(target, position, k);
  // Clearance from the core, enforced rather than assumed.
  const d = position.map((v, i) => v - CORE[i]);
  const len = Math.hypot(...d);
  if (len < CORE_CLEARANCE) position = CORE.map((c, i) => c + (d[i] / len) * CORE_CLEARANCE);
  return { position, target };
}

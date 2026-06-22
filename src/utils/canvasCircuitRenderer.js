const PACKET_SPEED = 0.0008;
const PACKET_RADIUS = 2.8;
const PULSE_LENGTH = 40;
const MOUSE_TRIGGER_RADIUS = 250;

function seededRandom(index) {
  return ((index * 0.618033988749895) % 1 + 1) % 1;
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
}

const RAW_PATHS = [
  {
    points: [
      { x: 20, y: 20 },
      { x: 60, y: 20 },
      { x: 80, y: 40 },
      { x: 120, y: 40 },
    ],
    hasStartCircle: true,
    hasEndCircle: true,
  },
  {
    points: [
      { x: 150, y: 10 },
      { x: 150, y: 50 },
      { x: 170, y: 70 },
    ],
    hasStartCircle: false,
    hasEndCircle: true,
  },
  {
    points: [
      { x: 40, y: 100 },
      { x: 40, y: 140 },
      { x: 20, y: 160 },
    ],
    hasStartCircle: false,
    hasEndCircle: true,
  },
  {
    points: [
      { x: 100, y: 120 },
      { x: 140, y: 120 },
      { x: 160, y: 140 },
      { x: 160, y: 180 },
    ],
    hasStartCircle: false,
    hasEndCircle: true,
  },
  {
    points: [
      { x: 10, y: 80 },
      { x: 50, y: 80 },
    ],
    hasStartCircle: false,
    hasEndCircle: false,
  },
  {
    points: [
      { x: 180, y: 30 },
      { x: 180, y: 70 },
    ],
    hasStartCircle: false,
    hasEndCircle: false,
  },
];

// Get position along path at a given absolute distance from the start.
// Accepts pre-baked segmentLengths + totalLength so nothing is recomputed per call.
function getPathPositionAtDistance(path, dist) {
  const { segmentLengths, totalLength } = path;
  dist = Math.max(0, Math.min(totalLength, dist));

  let currentLength = 0;
  for (let i = 0; i < path.points.length - 1; i++) {
    const segLen = segmentLengths[i];
    if (currentLength + segLen >= dist) {
      const t = (dist - currentLength) / segLen;
      const p1 = path.points[i];
      const p2 = path.points[i + 1];
      return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        segmentIndex: i,
      };
    }
    currentLength += segLen;
  }

  const last = path.points[path.points.length - 1];
  return { x: last.x, y: last.y, segmentIndex: path.points.length - 2 };
}

// Parse any CSS color string into "r,g,b" once at theme load time.
// This replaces the per-frame-per-path toRgba() offscreen-canvas approach
// which was creating a new canvas element on every animation frame.
function parseColorToRgb(color) {
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 1;
  const tmpCtx = tmp.getContext('2d');
  tmpCtx.fillStyle = color;
  tmpCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = tmpCtx.getImageData(0, 0, 1, 1).data;
  return `${r},${g},${b}`;
}

export function getStaticCircuitPaths(width, height) {
  const scale = 2;
  const tileSize = 400;
  const cols = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);

  const paths = [];
  RAW_PATHS.forEach((rawPath, pathIdx) => {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offsetX = col * tileSize;
        const offsetY = row * tileSize;

        const scaledPoints = rawPath.points.map(p => ({
          x: p.x * scale + offsetX,
          y: p.y * scale + offsetY,
        }));

        // Pre-bake segment lengths and total length so drawPulses never
        // recomputes them. Previously getPathLengths() ran every frame per path.
        let totalLength = 0;
        const segmentLengths = [];
        for (let i = 0; i < scaledPoints.length - 1; i++) {
          const p1 = scaledPoints[i];
          const p2 = scaledPoints[i + 1];
          const len = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
          segmentLengths.push(len);
          totalLength += len;
        }

        paths.push({
          points: scaledPoints,
          segmentLengths,
          totalLength,
          hasStartCircle: rawPath.hasStartCircle,
          hasEndCircle: rawPath.hasEndCircle,
          phase: (row * cols + col + pathIdx) * 0.15,
        });
      }
    }
  });

  return paths;
}

function isFinePointerCanvasTheme(theme, isDesktopFinePointer) {
  return theme === 'light' && isDesktopFinePointer === true;
}

export function shouldAnimateCircuitRenderer({
  theme,
  isDesktopFinePointer,
  prefersReducedMotion,
}) {
  return isFinePointerCanvasTheme(theme, isDesktopFinePointer, prefersReducedMotion);
}

function getThemeColors(theme) {
  const styles = getComputedStyle(document.documentElement);
  const line = styles.getPropertyValue('--fiber-color-1').trim() || '#00838f';
  const packet = styles.getPropertyValue('--fiber-color-2').trim() || '#2563eb';

  return {
    line,
    packet,
    // Pre-parse packet color to "r,g,b" once so gradient stops can use
    // rgba(r,g,b,a) strings without any per-frame color parsing.
    packetRgb: parseColorToRgb(packet),
    bg: 'transparent',
  };
}

function resizeCanvas(canvas, state) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const ratio = window.devicePixelRatio || 1;
  const scaledWidth = Math.floor(width * ratio);
  const scaledHeight = Math.floor(height * ratio);

  if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
  }

  state.size = { width, height, ratio };
}

// Duration of the pause at each circle endpoint, in milliseconds.
// Converted to equivalent distance units inside drawPulses so the whole
// bounce cycle runs on one linear timer with no stateful phase tracking.
const BOUNCE_PAUSE_MS = 400;

function drawPulses(context, paths, colors, time, fadeInAlpha, mousePos, isInitialPulse) {
  const { packetRgb } = colors;

  paths.forEach((path) => {
    if (!path.hasStartCircle && !path.hasEndCircle) return;

    const { totalLength, segmentLengths } = path;

    // headDist / tailDist are absolute pixel distances from path start.
    // headDist is always the bright leading tip; tailDist is the fading end.
    // For the bounce case headDist > tailDist when going forward, and
    // headDist < tailDist when going in reverse — clamping handles both.
    let headDist, tailDist;

    if (path.hasStartCircle && path.hasEndCircle) {
      // --- Bounce animation for two-circle paths ---
      //
      // Full cycle timeline (all in distance units):
      //   [0 .. travelDist)          forward travel  (head 0 → totalLength, tail exits)
      //   [travelDist .. halfCycle)  pause at end circle
      //   [halfCycle .. halfCycle+travelDist) reverse travel (head totalLength → 0)
      //   [halfCycle+travelDist .. fullCycle) pause at start circle
      //
      // travelDist = totalLength + PULSE_LENGTH so the tail fully exits the
      // endpoint before the pause begins.
      // pauseDist converts BOUNCE_PAUSE_MS into the same distance units.
      const travelDist = totalLength + PULSE_LENGTH;
      const pauseDist = BOUNCE_PAUSE_MS * PACKET_SPEED * totalLength;
      const halfCycle = travelDist + pauseDist;
      const fullCycle = halfCycle * 2;

      const cyclePos = (time * PACKET_SPEED * totalLength) % fullCycle;

      if (cyclePos < travelDist) {
        // Forward travel: head moves 0 → totalLength
        headDist = cyclePos;
        tailDist = headDist - PULSE_LENGTH;
      } else if (cyclePos < halfCycle) {
        // Pause at end circle: pulse is fully off-screen past totalLength
        return;
      } else {
        const revPos = cyclePos - halfCycle;
        if (revPos < travelDist) {
          // Reverse travel: head moves totalLength → 0
          headDist = totalLength - revPos;
          tailDist = headDist + PULSE_LENGTH; // tail trails behind (larger dist value)
        } else {
          // Pause at start circle: pulse is fully off-screen before 0
          return;
        }
      }
    } else {
      // --- Single-circle paths: simple one-way loop (unchanged) ---
      const cycleLength = totalLength + PULSE_LENGTH;
      const cyclePos = (time * PACKET_SPEED * totalLength) % cycleLength;

      if (path.hasStartCircle) {
        // Flow toward start circle (reverse direction)
        headDist = totalLength - cyclePos;
        tailDist = headDist + PULSE_LENGTH;
      } else {
        // Flow toward end circle
        headDist = cyclePos;
        tailDist = headDist - PULSE_LENGTH;
      }
    }

    // Clamp to visible path range.
    // Forward:  headDist >= tailDist  → head = min(head, total), tail = max(tail, 0)
    // Reverse:  headDist <= tailDist  → same clamping still works because we draw
    //           from the lower of the two values to the higher.
    const lo = Math.max(Math.min(headDist, tailDist), 0);
    const hi = Math.min(Math.max(headDist, tailDist), totalLength);

    if (hi <= 0 || lo >= totalLength || hi <= lo) return;

    // The bright tip is whichever end is the actual head.
    const goingForward = headDist <= tailDist ? false : true;
    const brightDist = goingForward ? hi : lo;
    const fadeDist = goingForward ? lo : hi;

    // Mouse proximity check
    let alpha = 0.3 * fadeInAlpha;
    if (!isInitialPulse && mousePos) {
      let minDist = Infinity;
      for (let i = 0; i < path.points.length - 1; i++) {
        const p1 = path.points[i];
        const p2 = path.points[i + 1];
        const dist = pointToSegmentDistance(mousePos.x, mousePos.y, p1.x, p1.y, p2.x, p2.y);
        if (dist < minDist) minDist = dist;
      }
      if (minDist > MOUSE_TRIGGER_RADIUS) return;
      alpha *= (1 - minDist / MOUSE_TRIGGER_RADIUS);
    }

    context.globalAlpha = alpha;

    const brightPos = getPathPositionAtDistance(path, brightDist);
    const fadePos = getPathPositionAtDistance(path, fadeDist);

    // Gradient always runs transparent (fade end) → full color (bright tip).
    const gradient = context.createLinearGradient(fadePos.x, fadePos.y, brightPos.x, brightPos.y);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.35, `rgba(${packetRgb},0.5)`);
    gradient.addColorStop(1, `rgba(${packetRgb},1)`);

    context.strokeStyle = gradient;
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // All segments in one continuous beginPath/stroke so the gradient flows
    // smoothly around bends with no reset at joints.
    context.beginPath();
    let penDown = false;
    let cumDist = 0;

    for (let i = 0; i < path.points.length - 1; i++) {
      const segStart = cumDist;
      const segEnd = cumDist + segmentLengths[i];

      if (segEnd <= lo) { cumDist = segEnd; continue; }
      if (segStart >= hi) break;

      const p1 = path.points[i];
      const p2 = path.points[i + 1];
      const segLen = segmentLengths[i];

      const localLoT = Math.max(0, (lo - segStart) / segLen);
      const localHiT = Math.min(1, (hi - segStart) / segLen);

      const sx = p1.x + (p2.x - p1.x) * localLoT;
      const sy = p1.y + (p2.y - p1.y) * localLoT;
      const ex = p1.x + (p2.x - p1.x) * localHiT;
      const ey = p1.y + (p2.y - p1.y) * localHiT;

      if (!penDown) {
        context.moveTo(sx, sy);
        penDown = true;
      } else {
        context.lineTo(sx, sy);
      }
      context.lineTo(ex, ey);

      cumDist = segEnd;
    }

    context.stroke();
    context.globalAlpha = 0.70;
  });
}

function clearCanvas(canvas, context, state, colors) {
  const { width, height, ratio } = state.size;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  if (colors.bg !== 'transparent') {
    context.fillStyle = colors.bg;
    context.fillRect(0, 0, width, height);
  }
}

function createNoopRenderer(state) {
  return {
    start() { },
    stop() { },
    updateTheme(nextTheme) {
      state.theme = nextTheme;
    },
    updateCapabilities(nextCapabilities) {
      state.theme = nextCapabilities?.theme ?? state.theme;
      state.isDesktopFinePointer = nextCapabilities?.isDesktopFinePointer ?? state.isDesktopFinePointer;
      state.prefersReducedMotion = nextCapabilities?.prefersReducedMotion ?? state.prefersReducedMotion;
    },
  };
}

export function createCircuitRenderer({
  canvas,
  theme,
  isDesktopFinePointer,
  prefersReducedMotion,
}) {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return createNoopRenderer({ theme, isDesktopFinePointer, prefersReducedMotion });
  }

  const context = canvas.getContext('2d', { alpha: true });

  if (!context) {
    return createNoopRenderer({ theme, isDesktopFinePointer, prefersReducedMotion });
  }

  const state = {
    rafId: null,
    resizeObserver: null,
    mousePos: null,
    isInitialPulse: true,
    theme,
    isDesktopFinePointer,
    prefersReducedMotion,
    paths: [],
    fadeInAlpha: 0,
    fadeStartTime: 0,
    deltaSeconds: 0,
    lastFrameTime: performance.now(),
    needsResize: true,
    size: {
      width: 1,
      height: 1,
      ratio: window.devicePixelRatio || 1,
    },
    colors: getThemeColors(theme),
  };

  function handleResize() {
    // Flag a resize instead of calling resizeCanvas every frame.
    // resizeCanvas now only runs when the ResizeObserver actually fires.
    state.needsResize = true;
    state.paths = [];
  }

  function frame(time) {
    const now = performance.now();
    state.deltaSeconds = Math.min(0.05, (now - state.lastFrameTime) / 1000 || 0);
    state.lastFrameTime = now;

    if (state.needsResize) {
      resizeCanvas(canvas, state);
      state.needsResize = false;
    }

    clearCanvas(canvas, context, state, state.colors);

    if (state.paths.length === 0) {
      state.paths = getStaticCircuitPaths(state.size.width, state.size.height);
      state.fadeStartTime = time;
    }

    const fadeInElapsed = (time - state.fadeStartTime) / 1000;
    state.fadeInAlpha = Math.min(1, fadeInElapsed / 1.5);

    drawPulses(context, state.paths, state.colors, time, state.fadeInAlpha, state.mousePos, state.isInitialPulse);

    state.rafId = requestAnimationFrame(frame);
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    state.mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    state.isInitialPulse = false;
  }

  function stopLoop() {
    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
      state.resizeObserver = null;
    }

    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    document.removeEventListener('mousemove', handleMouseMove);
  }

  function stopAndDetach() {
    stopLoop();
    if (state.mousePos) {
      state.mousePos = null;
    }
  }

  function startLoop() {
    if (!shouldAnimateCircuitRenderer(state) || state.rafId) {
      return;
    }

    state.colors = getThemeColors(state.theme);
    state.isInitialPulse = true;
    state.needsResize = true;

    if (typeof ResizeObserver !== 'undefined') {
      state.resizeObserver = new ResizeObserver(handleResize);
      state.resizeObserver.observe(canvas);
    }

    document.addEventListener('mousemove', handleMouseMove);

    frame(performance.now());
  }

  return {
    start: startLoop,

    stop: stopAndDetach,

    updateTheme(nextTheme) {
      state.theme = nextTheme;

      if (nextTheme === 'light') {
        state.colors = getThemeColors(nextTheme);
      }

      if (!shouldAnimateCircuitRenderer(state)) {
        stopAndDetach();
      } else {
        startLoop();
      }
    },

    updateCapabilities(nextCapabilities) {
      state.theme = nextCapabilities?.theme ?? state.theme;
      state.isDesktopFinePointer = nextCapabilities?.isDesktopFinePointer ?? state.isDesktopFinePointer;
      state.prefersReducedMotion = nextCapabilities?.prefersReducedMotion ?? state.prefersReducedMotion;

      if (state.theme === 'light') {
        state.colors = getThemeColors(state.theme);
      }

      if (!shouldAnimateCircuitRenderer(state)) {
        stopAndDetach();
      } else {
        startLoop();
      }
    },
  };
}
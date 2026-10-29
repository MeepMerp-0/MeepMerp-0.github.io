import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

const LEVEL_SMOOTHING = 0.25;
const PHASE_STEP = 0.2;
const WAVES = 3;
// The room left above and below the loudest swing, and the line's width.
const EDGE_PX = 3;
const LINE_PX = 2;
// The gap between plotted points, in canvas pixels: not scaled by dpr like the two above, so sharper screens plot
// more points.
const STEP_DEVICE_PX = 2;

// While the mic is on the box becomes a line that swells with the visitor's voice, so they can see it hears them.
// level() is read every frame. Pass a stable function: a new one restarts the drawing and the line falls flat.
export function Wave({ level }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let amp = 0;
    let phase = 0;
    let raf;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      // Eased toward the live level, so the line swells and settles instead of jumping.
      amp += (level() - amp) * LEVEL_SMOOTHING;
      if (!reduceMotion) phase += PHASE_STEP;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      for (let x = 0; x <= w; x += STEP_DEVICE_PX) {
        // Tapered to the ends, three waves across.
        const y = Math.sin(Math.PI * x / w) * Math.sin(2 * WAVES * Math.PI * x / w - phase) * amp * (h / 2 - EDGE_PX * dpr);
        ctx.lineTo(x, h / 2 + y);
      }
      // Read each frame: the theme can change mid-turn.
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.lineWidth = LINE_PX * dpr;
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [level, reduceMotion]);
  return <canvas ref={ref} className="aki-wave" aria-hidden="true" />;
}

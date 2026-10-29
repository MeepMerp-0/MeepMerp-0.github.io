import { motion, useReducedMotion } from 'motion/react';
import { EASE_OUT } from '../utils/motion.js';

// Slides a block in from `from` (such as { x: -16 }) each time it scrolls into view.
// Only the axes named in `from` animate, so a one-axis entrance stays one-axis.
export function Reveal({ as: Component = motion.div, from, amount, duration, delay = 0, ...props }) {
  const reduceMotion = useReducedMotion();
  const settled = Object.fromEntries(Object.keys(from).map((axis) => [axis, 0]));
  return (
    <Component
      initial={reduceMotion ? false : from}
      whileInView={settled}
      viewport={{ once: false, amount }}
      transition={{ duration, delay, ease: EASE_OUT }}
      {...props}
    />
  );
}

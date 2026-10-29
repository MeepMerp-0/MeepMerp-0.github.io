import { motion, useReducedMotion } from 'motion/react';
import { EASE_OUT } from '../utils/motion.js';

// Where a section heading slides in from. A static heading stays in place.
const ENTRANCES = {
  rise: { y: 14 },
  'from-left': { x: -18 },
  'from-right': { x: 18 },
  static: false,
};

export function SectionIntro({ number, eyebrow, title, subtitle, titleId, entrance = 'rise' }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="section-intro"
      initial={reduceMotion ? false : ENTRANCES[entrance] ?? ENTRANCES.rise}
      whileInView={{ x: 0, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      <div className="section-intro-label"><span>{number}</span> / {eyebrow}</div>
      <div className="section-intro-main">
        <h2 id={titleId}>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </motion.div>
  );
}

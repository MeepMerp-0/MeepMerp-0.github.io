import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

export function ReadingProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150, damping: 30, mass: 0.25,
  });

  // Decorative: never require motion to understand or navigate the page.
  if (reduceMotion) return null;
  return <motion.div className="reading-progress" aria-hidden="true" style={{ scaleX: smoothProgress }} />;
}

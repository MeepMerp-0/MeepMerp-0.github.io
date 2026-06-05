// components/ScrollReveal.jsx
// Reusable motion wrapper that triggers when element enters viewport.
// variant prop controls the entry direction/style.
// Powered by Motion (motion.dev) whileInView.

import { motion } from 'motion/react';

const VARIANTS = {
  fadeUp: {
    hidden:  { opacity:0, y:48 },
    visible: { opacity:1, y:0  },
  },
  fadeDown: {
    hidden:  { opacity:0, y:-40 },
    visible: { opacity:1, y:0  },
  },
  fromLeft: {
    hidden:  { opacity:0, x:-60 },
    visible: { opacity:1, x:0  },
  },
  fromRight: {
    hidden:  { opacity:0, x:60 },
    visible: { opacity:1, x:0  },
  },
  popUp: {
    hidden:  { opacity:0, scale:0.88, y:24 },
    visible: { opacity:1, scale:1,    y:0  },
  },
  fadeIn: {
    hidden:  { opacity:0 },
    visible: { opacity:1 },
  },
};

export default function ScrollReveal({
  children,
  variant   = 'fadeUp',
  delay     = 0,
  duration  = 0.65,
  threshold = 0.12,
  style     = {},
  className = '',
}) {
  const selected = VARIANTS[variant] || VARIANTS.fadeUp;

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once:true, amount:threshold }}
      variants={selected}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// components/ServiceBubble.jsx
// Uses Motion animate with y/x keyframe arrays for true levitation.
// CSS drift keyframes were overridden by Motion — now Motion owns the float.
// Outer motion.div handles float + entry opacity. Inner div handles hover only.

import { useState, memo } from 'react';
import { motion } from 'motion/react';

// Each bubble gets a unique float path so they move independently
const FLOAT_PATHS = [
  { y: [0, -18, -8,  6,  0], x: [0,  8, -6, -4,  0], dur: 7  },
  { y: [0,  14, 20, -6,  0], x: [0, -10, 5,  8,  0], dur: 9  },
  { y: [0, -12, -4, 14,  0], x: [0,  12, -8, -5,  0], dur: 8  },
  { y: [0,  10, -16, 4,  0], x: [0,  -6, 10, -8,  0], dur: 10 },
  { y: [0, -20,  6, 10,  0], x: [0,   4, -12, 6,  0], dur: 7.5},
  { y: [0,   8, 18, -10, 0], x: [0,  -8, 4,  10,  0], dur: 11 },
  { y: [0, -14, -6, 12,  0], x: [0,   6, -10, 4,  0], dur: 9.5},
  { y: [0,  16, -8, -12, 0], x: [0,  -4,  8, -6,  0], dur: 8.5},
];

export default memo(function ServiceBubble({ label, x, y, visible, index = 0 }) {
  const [hov, setHov] = useState(false);
  const path = FLOAT_PATHS[index % FLOAT_PATHS.length];

  return (
    <motion.div
      style={{
        position:'absolute',
        left: x,
        top:  y,
        zIndex: 2,
        willChange: 'transform, opacity',
      }}
      // Entry fade-in
      initial={{ opacity: 0, scale: 0.85 }}
      animate={visible ? {
        opacity: 1,
        scale:   1,
        y:       path.y,
        x:       path.x,
      } : { opacity: 0, scale: 0.85 }}
      transition={visible ? {
        opacity:  { duration: 0.9, delay: index * 0.12 },
        scale:    { duration: 0.9, delay: index * 0.12 },
        y: {
          duration:   path.dur,
          repeat:     Infinity,
          repeatType: 'loop',
          ease:       'easeInOut',
          delay:      index * 0.35,
        },
        x: {
          duration:   path.dur * 1.15,
          repeat:     Infinity,
          repeatType: 'loop',
          ease:       'easeInOut',
          delay:      index * 0.35,
        },
      } : { duration: 0.4 }}
    >
      {/* Inner: hover styling only — no transform so it doesn't fight Motion */}
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          padding:'7px 16px',
          borderRadius: 24,
          border: `1px solid ${hov ? 'var(--accent-border-hover)' : 'var(--accent-border)'}`,
          background:   hov ? 'var(--accent-bg-hover)' : 'var(--bubble-bg)',
          backdropFilter: 'blur(10px)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
          color:   hov ? 'var(--cyan)' : 'var(--muted)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          cursor: 'default',
          transition: 'border-color 0.45s ease, background 0.45s ease, color 0.45s ease',
          boxShadow: hov ? 'var(--shadow-hover)' : 'var(--shadow)',
        }}
      >
        <span style={{
          marginRight: 7,
          color: 'var(--cyan)',
          opacity: hov ? 0.95 : 0.45,
          transition: 'opacity 0.45s',
        }}>◆</span>
        {label}
      </div>
    </motion.div>
  );
});

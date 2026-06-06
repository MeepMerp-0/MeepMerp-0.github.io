// components/HudFrame.jsx
import { motion } from 'motion/react';

export default function HudFrame() {
  const PILL = 160;
  const GAP = 32;
  // Overshoots guarantee the pill fully exits the track on both ends.
  // overflow:hidden on the track clips anything outside — safe to overshoot.
  const FAR = 2000;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none', zIndex: 5,
    }}>

      {/* Corner brackets */}
      {[
        { top: 18, left: 18, borderTop: '1.5px solid var(--cyan)', borderLeft: '1.5px solid var(--cyan)' },
        { top: 18, right: 18, borderTop: '1.5px solid var(--cyan)', borderRight: '1.5px solid var(--cyan)' },
        { bottom: 18, left: 18, borderBottom: '1.5px solid var(--cyan)', borderLeft: '1.5px solid var(--cyan)' },
        { bottom: 18, right: 18, borderBottom: '1.5px solid var(--cyan)', borderRight: '1.5px solid var(--cyan)' },
      ].map((s, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', width: 30, height: 30, ...s }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: i * 2 }}
        />
      ))}

      {/* Tick marks — top */}
      {[0.18, 0.38, 0.62, 0.82].map((pos, i) => (
        <div key={`tt${i}`} style={{
          position: 'absolute', top: 19,
          left: `${pos * 100}%`, transform: 'translateX(-50%)',
          width: i % 2 === 0 ? 20 : 8, height: 1.5,
          background: 'var(--cyan)', opacity: 0.4,
        }} />
      ))}

      {/* Tick marks — bottom */}
      {[0.18, 0.38, 0.62, 0.82].map((pos, i) => (
        <div key={`tb${i}`} style={{
          position: 'absolute', bottom: 19,
          left: `${pos * 100}%`, transform: 'translateX(-50%)',
          width: i % 2 === 0 ? 20 : 8, height: 1.5,
          background: 'var(--cyan)', opacity: 0.4,
        }} />
      ))}

      {/* Left border — pill sweeps DOWN then mirrors back up */}
      <div style={{
        position: 'absolute',
        left: 19, top: GAP, bottom: GAP,
        width: 1, overflow: 'hidden',
        background: 'var(--border-subtle)',
      }}>
        <motion.div
          style={{
            position: 'absolute', left: 0,
            width: '100%', height: PILL,
            background: 'linear-gradient(180deg, transparent, var(--cyan) 40%, var(--fiber-color-2) 60%, transparent)',
          }}
          animate={{ top: [-PILL, FAR] }}
          transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </div>

      {/* Right border — pill sweeps UP then mirrors back down */}
      <div style={{
        position: 'absolute',
        right: 19, top: GAP, bottom: GAP,
        width: 1, overflow: 'hidden',
        background: 'var(--border-subtle)',
      }}>
        <motion.div
          style={{
            position: 'absolute', left: 0,
            width: '100%', height: PILL,
            background: 'linear-gradient(180deg, transparent, var(--fiber-color-3) 40%, var(--cyan) 60%, transparent)',
          }}
          animate={{ top: [FAR, -PILL] }}
          transition={{ duration: 7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </div>

      {/* Top border — pill sweeps RIGHT TO LEFT then mirrors back */}
      <div style={{
        position: 'absolute',
        top: 19, left: GAP, right: GAP,
        height: 1, overflow: 'hidden',
        background: 'var(--border-subtle)',
      }}>
        <motion.div
          style={{
            position: 'absolute', top: 0,
            height: '100%', width: PILL,
            background: 'linear-gradient(90deg, transparent, var(--cyan) 40%, var(--fiber-color-1) 60%, transparent)',
          }}
          animate={{ left: [FAR, -PILL] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </div>

      {/* Bottom border — pill sweeps LEFT TO RIGHT then mirrors back */}
      <div style={{
        position: 'absolute',
        bottom: 19, left: GAP, right: GAP,
        height: 1, overflow: 'hidden',
        background: 'var(--border-subtle)',
      }}>
        <motion.div
          style={{
            position: 'absolute', top: 0,
            height: '100%', width: PILL,
            background: 'linear-gradient(90deg, transparent, var(--fiber-color-4) 40%, var(--cyan) 60%, transparent)',
          }}
          animate={{ left: [-PILL, FAR] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </div>

    </div>
  );
}
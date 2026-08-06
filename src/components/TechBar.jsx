// components/TechBar.jsx
// Stepped proficiency bar — 5 equal segments filled by step value.

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Master'];

export default function TechBar({ label, step, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 7,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5, color: 'var(--text)',
        }}>{label}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10, color: 'var(--cyan)', opacity: 0.8,
        }}>{STEP_LABELS[step - 1] ?? ''}</span>
      </div>

      {/* Track */}
      <div style={{
        height: 6,
        borderRadius: 2,
        display: 'flex', gap: 3,
      }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: inView ? 1 : 0, scaleY: inView ? 1 : 0 }}
            transition={{ duration: 0.3, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{
              flex: 1, height: '100%', borderRadius: 1,
              background: i < step ? 'var(--soft)' : 'var(--bg3)',
              border: '1px solid var(--border-subtle)', // always on, not conditional
            }}
          />
        ))}
      </div>
    </div>
  );
}
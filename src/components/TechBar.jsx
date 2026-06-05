// components/TechBar.jsx
// Skill bar that animates width when scrolled into view.
// Uses motion.div for the fill — spring easing on width via motion value.

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

export default function TechBar({ label, pct, delay = 0 }) {
  const ref  = useRef(null);
  const inView = useInView(ref, { once:true, margin:'-60px' });

  return (
    <div ref={ref} style={{ marginBottom:18 }}>
      <div style={{
        display:'flex', justifyContent:'space-between',
        marginBottom:7,
      }}>
        <span style={{
          fontFamily:'var(--font-mono)',
          fontSize:11.5, color:'var(--text)',
        }}>{label}</span>
        <span style={{
          fontFamily:'var(--font-mono)',
          fontSize:10, color:'var(--cyan)', opacity:0.8,
        }}>{pct}%</span>
      </div>

      {/* Track */}
      <div style={{
        height:2.5, background:'var(--track-bg)',
        borderRadius:2, overflow:'hidden',
      }}>
        {/* Animated fill */}
        <motion.div
          initial={{ width:'0%' }}
          animate={{ width: inView ? `${pct}%` : '0%' }}
          transition={{ duration:1.2, delay, ease:[0.16,1,0.3,1] }}
          style={{
            height:'100%', borderRadius:2,
            background:'linear-gradient(90deg,var(--blue),var(--cyan))',
          }}
        />
      </div>
    </div>
  );
}

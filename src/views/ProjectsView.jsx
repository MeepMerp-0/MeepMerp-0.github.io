// views/ProjectsView.jsx
// Staggered project cards: even cards slide from left, odd from right.
// Scanline hover effect via CSS animation on a positioned child.
// Motion powers the reveal. Locked to viewport with internal local scrolling enabled.

import { useState, memo } from 'react';
import { motion } from 'motion/react';
import SectionHeading from '../components/SectionHeading.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import { PROJECTS } from '../models/portfolioData.js';

const ProjectCard = memo(function ProjectCard({ project, index }) {
  const [hov, setHov] = useState(false);
  const isEven = index % 2 === 0;
  const { tag, title, desc, tech, accent, status, year, highlights } = project;

  return (
    <ScrollReveal variant='fromBottom' delay={index * 0.08} >
      <motion.div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        animate={{ y: hov ? -5 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'var(--item-bg)',
          border: `1px solid ${hov ? 'var(--cyan)' : 'var(--border-subtle)'}`,
          borderRadius: 14,
          padding: '26px 26px 22px',
          position: 'relative', overflow: 'hidden',
          transition: 'border-color 0.4s ease',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
          boxShadow: hov ? 'var(--shadow-hover)' : 'none',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
          background: `linear-gradient(90deg,transparent,${accent},transparent)`,
          opacity: hov ? 0.9 : 0.3,
          transition: 'opacity 0.4s ease',
        }} />

        {/* Scanline on hover */}
        {hov && (
          <div style={{
            position: 'absolute', inset: 0,
            pointerEvents: 'none', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, height: '20%',
              background: `linear-gradient(180deg,transparent,${accent}08,transparent)`,
              animation: 'scanGlide 2.5s linear infinite',
              willChange: 'top',
            }} />
          </div>
        )}

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: accent, opacity: 0.75,
          }}>{tag}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.45, color: 'var(--muted)',
            }}>{year}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              padding: '2px 10px',
              border: `1px solid ${accent}38`, borderRadius: 20,
              color: accent, background: `${accent}0d`,
              letterSpacing: '0.1em',
            }}>{status}</span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
          marginBottom: 11, color: 'var(--text)', letterSpacing: '-0.01em',
        }}>{title}</h3>

        {/* Description */}
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.78, marginBottom: 16 }}>{desc}</p>

        {/* Highlights */}
        <ul style={{
          listStyle: 'none', marginBottom: 18,
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {highlights.map(h => (
            <li key={h} style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--muted)', opacity: 0.75,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: accent, opacity: 0.7, fontSize: 8 }}>▸</span>
              {h}
            </li>
          ))}
        </ul>

        {/* Tech tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {tech.map(t => (
            <span key={t} style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              padding: '3px 9px',
              background: 'var(--bg3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 3, color: 'var(--muted)',
            }}>{t}</span>
          ))}
        </div>

        {/* Arrow indicator */}
        <motion.div
          animate={{ opacity: hov ? 1 : 0, x: hov ? 0 : -6, y: hov ? 0 : 6 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'absolute', bottom: 22, right: 22,
            color: accent, fontSize: 17,
          }}
        >→</motion.div>
      </motion.div>
    </ScrollReveal>
  );
});

export default function ProjectsView() {
  return (
    <section
      id="projects"
      style={{
        minHeight: '100%', // Reverted back to allow cards to stretch the section size
        padding: '40px clamp(24px, 5vw, 72px) 80px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <SectionHeading
        tag="Projects"
        title="Selected Work"
        subtitle="Production systems, operational tools, and business-driven platforms."
      />

      {/* Render the clean, layout grid directly without inner overflow rules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,

        textAlign: 'justify',
        textJustify: 'inter-word',
        wordBreak: 'break-word',
        hyphens: 'auto',
      }}>
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
// views/AboutView.jsx

import { motion } from 'motion/react';
import SectionHeading from '../components/SectionHeading.jsx';
import SkillMarquee from '../components/SkillMarquee.jsx';
import TechBar from '../components/TechBar.jsx';

import {
  ABOUT_PARAGRAPHS,
  STATS,
  PROFICIENCY,
  EXPERIENCE,
} from '../data/portfolioData.js';

// All styles live in global.css under "/* ── ABOUT VIEW ── */"

export default function AboutView() {
  return (
    <section className="about-section">
      <SectionHeading
        tag="About"
        title="Engineer for Impact"
        subtitle="Building operational systems, not just interfaces."
      />

      {/* ── Two-column main grid ── */}
      <div className="about-grid">

        {/* ── LEFT column: Engineer for Impact + description ── */}
        <motion.div
          className="about-col about-col-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          {ABOUT_PARAGRAPHS.map((para, i) => (
            <motion.p
              key={i}
              className="about-para"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            >
              {para}
            </motion.p>
          ))}
        </motion.div>

        {/* ── RIGHT column: Technical Proficiency + Stats ── */}
        <motion.div
          className="about-col"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
        >
          <div className="proficiency-heading">Technical Proficiency</div>

          {PROFICIENCY.map((item, i) => (
            <TechBar
              key={item.label}
              label={item.label}
              step={item.step}
              delay={i * 0.06}
            />
          ))}

          {/* Stats — 2 × 2, below proficiency ── */}
          <div className="about-stats about-stats-bottom" style={{ marginTop: 36 }}>
            {STATS.map(({ value, label }, index) => (
              <motion.div
                key={label}
                className="stat-item"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.35 + index * 0.08, duration: 0.5 }}
              >
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ── Tech Stack & Tools (full width) ── */}
      <motion.div
        className="tech-stack-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <SkillMarquee />
      </motion.div>

      {/* ── 4-column Experience Grid at Bottom ── */}
      <div className="about-exp-grid">
        {EXPERIENCE.map(({ company, role, period, link }, i) => {
          const CardTag = link ? 'a' : 'div';
          const linkProps = link
            ? { href: link, target: '_blank', rel: 'noopener noreferrer' }
            : {};

          return (
            <CardTag
              key={i}
              className="about-exp-grid-card"
              data-clickable={link ? true : undefined}
              {...linkProps}
            >
              <div className="about-exp-dot" />
              <div className="about-exp-body">
                <span className="exp-company">{company}</span>
                <span className="exp-role">{role}</span>
                <span className="exp-period">{period}</span>
              </div>
            </CardTag>
          );
        })}
      </div>
    </section>
  );
}
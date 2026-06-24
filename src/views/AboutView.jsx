// views/AboutView.jsx

import { motion } from 'motion/react';
import SectionHeading from '../components/SectionHeading.jsx';
import SkillMarquee from '../components/SkillMarquee.jsx';
import TechBar from '../components/TechBar.jsx';

import {
  ABOUT_PARAGRAPHS,
  STATS,
  PROFICIENCY,
} from '../data/portfolioData.js';

// All styles live in global.css under "/* ── ABOUT VIEW ── */"
const EXPERIENCE = [
  {
    company: 'CliqueHA Information Service OPC',
    role: 'Software Developer Intern',
    period: 'Feb – May 2026',
  },
];

export default function AboutView() {
  return (
    <section
      className="about-section"
    >
      <SectionHeading
        tag="About"
        title="Engineered for Impact"
        subtitle="A full-stack developer who builds operational systems, not just interfaces."
      />

      <div className="about-grid">

        {/* ── LEFT column ── */}
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

          {/* Stats — 2 × 2 */}
          <div className="about-stats">
            {STATS.map(({ value, label }, index) => (
              <motion.div
                key={label}
                className="stat-item"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.08, duration: 0.5 }}
              >
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </div>

          {/* Experience */}
          <motion.div
            className="about-exp-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {EXPERIENCE.map(({ company, role, period }, i) => (
              <div key={i} className="about-exp-card">
                <div className="about-exp-dot" />
                <div className="about-exp-body">
                  <span className="exp-company">{company}</span>
                  <span className="exp-role">{role}</span>
                  <span className="exp-period">{period}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT column ── */}
        <motion.div
          className="about-col"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
        >
          <SkillMarquee />

          <div className="proficiency-heading">Technical Proficiency</div>

          {PROFICIENCY.map((item, i) => (
            <TechBar
              key={item.label}
              label={item.label}
              pct={item.pct}
              delay={i * 0.06}
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
}
// views/AboutView.jsx

import { motion } from 'motion/react';
import SectionHeading from '../components/SectionHeading.jsx';
import SkillMarquee from '../components/SkillMarquee.jsx';
import TechBar from '../components/TechBar.jsx';

import {
  ABOUT_PARAGRAPHS,
  STATS,
  PROFICIENCY,
} from '../models/portfolioData.js';

export default function AboutView() {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 60,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -60,
      }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        minHeight: '100%',
        width: '100%',
        padding: '40px clamp(24px,5vw,72px) 80px',
      }}
    >
      <SectionHeading
        tag="About"
        title="Engineered for Impact"
        subtitle="A full-stack developer who builds operational systems, not just interfaces."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(280px,1fr))',
          gap: 52,
        }}
      >
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.7,
          }}
        >
          {ABOUT_PARAGRAPHS.map((para, i) => (
            <motion.p
              key={i}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.3 + i * 0.1,
                duration: 0.5,
              }}
              style={{
                color: 'var(--muted)',
                lineHeight: 1.88,
                fontSize: 14.5,
                marginBottom: 16,
                textAlign: 'justify',
                textJustify: 'inter-word',
                wordBreak: 'break-word',
                hyphens: 'auto',
              }}
            >
              {para}
            </motion.p>
          ))}

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: 28,
              marginTop: 36,
              flexWrap: 'wrap',
            }}
          >
            {STATS.map(({ value, label }, index) => (
              <motion.div
                key={label}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.5 + index * 0.08,
                  duration: 0.5,
                }}
                style={{
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily:
                      'var(--font-display)',
                    fontSize: 26,
                    fontWeight: 700,
                    color: 'var(--cyan)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {value}
                </div>

                <div
                  style={{
                    fontFamily:
                      'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--muted)',
                    letterSpacing: '0.12em',
                    marginTop: 3,
                  }}
                >
                  {label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Experience Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {[
              'CliqueHA Information Service OPC · Software Developer Intern · Feb–May 2026'
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 14px',
                  background: 'var(--accent-bg-hover)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 10,
                  width: 'fit-content',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--cyan)',
                    opacity: 0.8,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{
            opacity: 0,
            x: 40,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay: 0.25,
            duration: 0.7,
          }}
        >
          <SkillMarquee />

          <div
            style={{
              fontFamily:
                'var(--font-mono)',
              fontSize: 10,
              color: 'var(--cyan)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 22,
              marginTop: 30,
              opacity: 0.8,
            }}
          >
            Technical Proficiency
          </div>

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
    </motion.section>
  );
}
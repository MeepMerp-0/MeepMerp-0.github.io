// views/ProjectsView.jsx

import { useState, memo, useEffect } from 'react';
import { motion } from 'motion/react';
import SectionHeading from '../components/SectionHeading.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import { PROJECTS } from '../models/portfolioData.js';

function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.innerWidth <= bp
  );

  useEffect(() => {
    const mq = window.matchMedia(
      `(max-width:${bp}px)`
    );

    const handler = (e) =>
      setIsMobile(e.matches);

    mq.addEventListener('change', handler);

    return () =>
      mq.removeEventListener(
        'change',
        handler
      );
  }, [bp]);

  return isMobile;
}

const ProjectCard = memo(function ProjectCard({
  project,
  index,
  isMobile,
}) {
  const [hov, setHov] = useState(false);

  const {
    tag,
    title,
    desc,
    tech,
    accent,
    status,
    year,
    highlights,
  } = project;

  const hoverEnabled =
    !isMobile && hov;

  return (
    <ScrollReveal
      variant="fromBottom"
      delay={index * 0.08}
    >
      <motion.div
        onMouseEnter={() =>
          setHov(true)
        }
        onMouseLeave={() =>
          setHov(false)
        }
        animate={{
          y: hoverEnabled ? -5 : 0,
        }}
        transition={{
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          background:
            'var(--item-bg)',

          border: `1px solid ${hoverEnabled
              ? 'var(--cyan)'
              : 'var(--border-subtle)'
            }`,

          borderRadius: 14,

          padding: isMobile
            ? '18px 18px 16px'
            : '26px 26px 22px',

          position: 'relative',

          overflow: 'hidden',

          transition:
            'border-color 0.4s ease',

          cursor: isMobile
            ? 'default'
            : 'pointer',

          backdropFilter:
            'blur(6px)',

          boxShadow:
            hoverEnabled
              ? 'var(--shadow-hover)'
              : 'none',
        }}
      >
        {/* Accent Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1.5,

            background: `linear-gradient(
              90deg,
              transparent,
              ${accent},
              transparent
            )`,

            opacity: hoverEnabled
              ? 0.9
              : 0.3,

            transition:
              'opacity 0.4s ease',
          }}
        />

        {/* Scanline */}
        {hoverEnabled && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '20%',

                background: `linear-gradient(
                  180deg,
                  transparent,
                  ${accent}08,
                  transparent
                )`,

                animation:
                  'scanGlide 2.5s linear infinite',
              }}
            />
          </div>
        )}

        {/* Header */}
        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            flexWrap: 'wrap',

            gap: 8,

            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily:
                'var(--font-mono)',

              fontSize: 9,

              letterSpacing:
                '0.16em',

              textTransform:
                'uppercase',

              color: accent,

              opacity: 0.75,
            }}
          >
            {tag}
          </span>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily:
                  'var(--font-mono)',

                fontSize: 9,

                opacity: 0.45,

                color:
                  'var(--muted)',
              }}
            >
              {year}
            </span>

            <span
              style={{
                fontFamily:
                  'var(--font-mono)',

                fontSize: 9,

                padding:
                  '2px 10px',

                border: `1px solid ${accent}38`,

                borderRadius: 20,

                color: accent,

                background:
                  `${accent}0d`,
              }}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily:
              'var(--font-display)',

            fontSize: isMobile
              ? 16
              : 18,

            fontWeight: 600,

            marginBottom: 11,

            lineHeight: 1.35,

            color: 'var(--text)',
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            color: 'var(--muted)',

            fontSize: isMobile
              ? 12
              : 13,

            lineHeight: 1.75,

            marginBottom: 16,
          }}
        >
          {desc}
        </p>

        {/* Highlights */}
        <ul
          style={{
            listStyle: 'none',

            marginBottom: 18,

            display: 'flex',

            flexDirection: 'column',

            gap: 5,
          }}
        >
          {highlights.map(h => (
            <li
              key={h}
              style={{
                fontFamily:
                  'var(--font-mono)',

                fontSize: isMobile
                  ? 10
                  : 11,

                color:
                  'var(--muted)',

                opacity: 0.75,

                display: 'flex',

                alignItems: 'center',

                gap: 8,
              }}
            >
              <span
                style={{
                  color: accent,
                }}
              >
                ▸
              </span>

              {h}
            </li>
          ))}
        </ul>

        {/* Tech */}
        <div
          style={{
            display: 'flex',

            flexWrap: 'wrap',

            gap: 7,
          }}
        >
          {tech.map(t => (
            <span
              key={t}
              style={{
                fontFamily:
                  'var(--font-mono)',

                fontSize: isMobile
                  ? 9
                  : 10,

                padding:
                  '3px 8px',

                background:
                  'var(--bg3)',

                border:
                  '1px solid var(--border-subtle)',

                borderRadius: 3,

                color:
                  'var(--muted)',

                wordBreak:
                  'break-word',
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {!isMobile && (
          <motion.div
            animate={{
              opacity: hov ? 1 : 0,
              x: hov ? 0 : -6,
              y: hov ? 0 : 6,
            }}
            transition={{
              duration: 0.3,
            }}
            style={{
              position: 'absolute',
              bottom: 22,
              right: 22,

              color: accent,

              fontSize: 17,
            }}
          >
            →
          </motion.div>
        )}
      </motion.div>
    </ScrollReveal>
  );
});

export default function ProjectsView() {
  const isMobile =
    useIsMobile();

  return (
    <section
      id="projects"
      style={{
        minHeight: '100%',

        padding: isMobile
          ? '20px 16px 60px'
          : '40px clamp(24px, 5vw, 72px) 80px',

        width: '100%',

        boxSizing:
          'border-box',
      }}
    >
      <SectionHeading
        tag="Projects"
        title="Selected Work"
        subtitle="Production systems, operational tools, and business-driven platforms."
      />

      <div
        style={{
          display: 'grid',

          gridTemplateColumns:
            isMobile
              ? '1fr'
              : 'repeat(auto-fit, minmax(320px, 1fr))',

          gap: isMobile
            ? 16
            : 24,

          textAlign: 'justify',
          textJustify:
            'inter-word',

          wordBreak:
            'break-word',

          hyphens: 'auto',
        }}
      >
        {PROJECTS.map(
          (project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              isMobile={isMobile}
            />
          )
        )}
      </div>
    </section>
  );
}
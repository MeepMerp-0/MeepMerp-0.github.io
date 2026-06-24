// views/ProjectsView.jsx

import { useState, memo, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SectionHeading from '../components/SectionHeading.jsx';
import ScrollReveal from '../components/ScrollReveal.jsx';
import ProjectModal from '../components/ProjectModal.jsx';
import { PROJECTS } from '../data/portfolioData.js';
import { useIsMobile } from '../hooks/useIsMobile.js';

const MAX_HIGHLIGHTS_COLLAPSED = 3;
const CARD_COLLAPSED_H = 320;

const ProjectCard = memo(function ProjectCard({ project, index, isMobile, onShowMessage }) {
  const [hov, setHov] = useState(false);
  const innerRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(CARD_COLLAPSED_H);

  const { tag, title, desc, tech, accent, status, year, highlights, site, metrics, clickMessage } = project;

  const isExpanded = !isMobile && hov;
  const extraHighlights = highlights.length - MAX_HIGHLIGHTS_COLLAPSED;
  const visibleHighlights = isExpanded ? highlights : highlights.slice(0, MAX_HIGHLIGHTS_COLLAPSED);
  const hasSite = Boolean(site);
  const hasMessage = Boolean(clickMessage);

  useLayoutEffect(() => {
    if (!innerRef.current) return;
    const el = innerRef.current;
    const update = () => setContentHeight(el.scrollHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleClick() {
    if (hasMessage) {
      onShowMessage({ title, message: clickMessage, accent });
    } else if (hasSite) {
      window.open(site, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <ScrollReveal variant="fromBottom" delay={index * 0.08}>
      <motion.div
        onMouseEnter={() => !isMobile && setHov(true)}
        onMouseLeave={() => !isMobile && setHov(false)}
        onClick={handleClick}
        animate={{
          height: isMobile
            ? 'auto'
            : isExpanded && contentHeight > CARD_COLLAPSED_H
              ? contentHeight
              : CARD_COLLAPSED_H,
          y: isExpanded ? -4 : 0,
        }}
        transition={{
          height: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          y: { duration: 0.3 },
        }}
        style={{
          background: 'var(--item-bg)',
          border: `1px solid ${isExpanded ? accent : 'var(--border-subtle)'}`,
          borderRadius: 14,
          position: 'relative',
          overflow: 'hidden',
          cursor: (hasSite || hasMessage) ? 'pointer' : 'default',
          backdropFilter: 'blur(6px)',
          boxShadow: isExpanded ? 'var(--shadow-hover)' : 'none',
          transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <div
          ref={innerRef}
          style={{
            padding: isMobile ? '18px 18px 16px' : '26px 26px 22px',
            height: 'fit-content',
          }}
        >

          {/* ── Accent top line ── */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 1.5,
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              opacity: isExpanded ? 0.9 : 0.3,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* ── Scanline on hover ── */}
          {isExpanded && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  height: '20%',
                  background: `linear-gradient(180deg, transparent, ${accent}08, transparent)`,
                  animation: 'scanGlide 2.5s linear infinite',
                }}
              />
            </div>
          )}

          {/* ── Header row ── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'nowrap',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {/* Tag — grows to fill space, truncates with ellipsis before hitting year/status */}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: accent,
                opacity: 0.75,
                flex: '1 1 0',
                minWidth: 0,
                overflow: hov ? 'visible' : 'hidden',
                whiteSpace: hov ? 'normal' : 'nowrap',
                textOverflow: hov ? 'unset' : 'ellipsis',
                transition: 'opacity 0.2s ease',
              }}
            >
              {tag}
            </span>

            {/* Year + status — never shrinks */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.45, color: 'var(--muted)' }}>
                {year}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  padding: '2px 10px',
                  border: `1px solid ${accent}38`,
                  borderRadius: 20,
                  color: accent,
                  background: `${accent}0d`,
                }}
              >
                {status}
              </span>
            </div>
          </div>

          {/* ── Title ── */}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: isMobile ? 16 : 18,
              fontWeight: 600,
              marginBottom: 11,
              lineHeight: 1.35,
              color: 'var(--text)',
            }}
          >
            {title}
          </h3>

          {/* ── Description ── */}
          <p className="project-desc"
            style={{
              fontSize: isMobile ? 12 : 13,
              marginBottom: 16,
              WebkitLineClamp: isExpanded || isMobile ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: isExpanded || isMobile ? 'visible' : 'hidden',
            }}
          >
            {desc}
          </p>

          {/* ── Highlights ── */}
          <ul
            style={{
              listStyle: 'none',
              marginBottom: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            <AnimatePresence initial={false}>
              {visibleHighlights.map((h) => (
                <motion.li
                  key={h}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: isMobile ? 10 : 11,
                    color: 'var(--muted)',
                    opacity: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ color: accent, flexShrink: 0 }}>▸</span>
                  {h}
                </motion.li>
              ))}
            </AnimatePresence>

            {/* "+N more" pill */}
            <AnimatePresence>
              {!isExpanded && !isMobile && extraHighlights > 0 && (
                <motion.li
                  key="more-pill"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ color: accent, flexShrink: 0 }}>▸</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: isMobile ? 9 : 10,
                      padding: '2px 9px',
                      border: `1px solid ${accent}38`,
                      borderRadius: 20,
                      color: accent,
                      background: `${accent}0d`,
                      opacity: 0.8,
                    }}
                  >
                    +{extraHighlights} more
                  </span>
                </motion.li>
              )}
            </AnimatePresence>
          </ul>

          {/* ── Metrics ── */}
          {metrics && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {metrics.map((m) => (
                <div key={m.label} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px 12px',
                  background: 'var(--nav-active-bg)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 8,
                  minWidth: 70,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: accent,
                  }}>{m.value}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>{m.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Tech chips ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {tech.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: isMobile ? 9 : 10,
                  padding: '3px 8px',
                  background: 'var(--bg3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 3,
                  color: 'var(--muted)',
                  wordBreak: 'break-word',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* ── Bottom-right CTA ── */}
          {!isMobile && (
            <motion.div
              animate={{
                opacity: hov ? 1 : 0,
                x: hov ? 0 : -6,
                y: hov ? 0 : 6,
              }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                bottom: 22,
                right: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: accent,
              }}
            >
              {(hasSite || hasMessage) && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    opacity: 0.75,
                  }}
                >
                  {hasMessage ? 'Details' : 'Visit site'}
                </span>
              )}
              <span style={{ fontSize: 17 }}>{hasMessage ? 'ℹ' : hasSite ? '↗' : '→'}</span>
            </motion.div>
          )}

        </div>{/* /inner */}
      </motion.div>
    </ScrollReveal>
  );
});

export default function ProjectsView() {
  const isMobile = useIsMobile();
  const [modal, setModal] = useState({ open: false, title: '', message: '', accent: '' });

  return (
    <section
      id="projects"
      style={{
        minHeight: '100%',
        padding: isMobile
          ? '20px 16px 60px'
          : '40px clamp(24px, 5vw, 72px) 80px',
        width: '100%',
        boxSizing: 'border-box',
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
          gridTemplateColumns: isMobile
            ? '1fr'
            : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: isMobile ? 16 : 24,
          alignItems: 'start',
        }}
      >
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={i}
            isMobile={isMobile}
            onShowMessage={({ title, message, accent }) => setModal({ open: true, title, message, accent })}
          />
        ))}
      </div>

      <ProjectModal
        open={modal.open}
        onClose={() => setModal({ ...modal, open: false })}
        title={modal.title}
        message={modal.message}
        accent={modal.accent}
      />
    </section>
  );
}
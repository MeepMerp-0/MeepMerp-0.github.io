import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDownRight, ArrowRight } from 'lucide-react';
import { NoteEntries } from '../components/NoteEntries.jsx';
import { FOCUS_AREAS, LATEST_ROLE, PERSONAL } from '../data/portfolioData.js';
import { twoDigits } from '../utils/format.js';
import { EASE_OUT } from '../utils/motion.js';

export function Hero() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const noteParallaxY = useTransform(scrollYProgress, [0, 1], [0, -16]);

  return (
    <section ref={heroRef} className="hero shell" id="home" aria-labelledby="hero-title">
      <div className="hero-topline">
        <span><span className="status-dot" aria-hidden="true" /> {PERSONAL.title.toUpperCase()} / ABU DHABI, UAE</span>
        <span>PORTFOLIO — 2026</span>
      </div>
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">HELLO, I'M JASON.</p>
          <motion.h1
            id="hero-title"
            initial={reduceMotion ? false : { y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE_OUT }}
          >I build<br /><em>AI systems</em> and<br />full-stack apps<span className="period">.</span></motion.h1>
          <motion.p
            className="hero-description"
            initial={reduceMotion ? false : { y: 10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.55, delay: 0.17, ease: EASE_OUT }}
          >{PERSONAL.headline}</motion.p>
          <div className="hero-actions">
            <a className="button button-solid" href="#work">Explore selected work <ArrowRight size={18} aria-hidden="true" /></a>
          </div>
        </div>
        <motion.aside
          className="hero-notes"
          aria-label="Areas of work"
          style={{ y: reduceMotion ? 0 : noteParallaxY }}
        >
          <div className="notes-heading"><span>FIELD NOTES</span><span>{twoDigits(FOCUS_AREAS.length)} NOTES</span></div>
          <p className="notes-title">What I work on</p>
          <NoteEntries entries={FOCUS_AREAS} />
          <div className="notes-foot">
            <span className="notes-foot-label">LATEST ROLE</span>
            <span>{LATEST_ROLE.role} · {LATEST_ROLE.company}</span>
          </div>
        </motion.aside>
      </div>
      <div className="hero-bottomline">
        <span>SELECTED PROJECTS AND EXPERIENCE, NOT A TEMPLATE SHOWCASE</span>
        <a href="#work">SCROLL TO WORK <ArrowDownRight size={17} aria-hidden="true" /></a>
      </div>
    </section>
  );
}

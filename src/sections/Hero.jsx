import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { HERO } from '../data/siteCopy.js';
import { EASE_OUT } from '../utils/motion.js';

// The sculpture is CSS only and decorative: the copy and both actions render first and never wait on it.
function HeroSculpture() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-art-rig">
        <span className="hero-ring hero-ring-outer" />
        <span className="hero-slab hero-slab-back" />
        <span className="hero-slab hero-slab-front" />
        <span className="hero-ring hero-ring-inner" />
        <span className="hero-orb" />
      </div>
      <span className="hero-floor" />
    </div>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const rise = (delay) => (reduceMotion ? {} : {
    // Position only, never opacity: the copy is readable from the first frame.
    initial: { y: 18 },
    animate: { y: 0 },
    transition: { duration: 0.7, delay, ease: EASE_OUT },
  });

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="status-dot" aria-hidden="true" />{HERO.eyebrow} · {HERO.location}</p>
          <motion.h1 id="hero-title" {...rise(0.05)}>
            {HERO.headline.map((line, i) => <span key={line} className={i === 1 ? 'hero-line-accent' : undefined}>{line}</span>)}
          </motion.h1>
          <motion.p className="hero-lead" {...rise(0.15)}>{HERO.lead}</motion.p>
          <motion.div className="hero-actions" {...rise(0.22)}>
            <a className="button button-solid" href="#work">View Work <ArrowRight size={18} aria-hidden="true" /></a>
            <a className="button button-ghost" href="#contact">Start a conversation</a>
          </motion.div>
          <p className="hero-availability">{HERO.availability}</p>
        </div>
        <HeroSculpture />
      </div>
      <div className="shell hero-foot">
        <ul className="hero-focus" aria-label="What I build">
          {HERO.focus.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <a className="hero-scroll" href="#work">Selected work <ArrowDown size={16} aria-hidden="true" /></a>
      </div>
    </section>
  );
}

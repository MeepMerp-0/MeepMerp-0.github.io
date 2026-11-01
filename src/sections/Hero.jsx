import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { HERO } from '../data/siteCopy.js';
import { EASE_OUT } from '../utils/motion.js';

// Three.js starts only after the page has loaded and the browser is idle, so it never delays the copy or actions.
const whenIdle = (fn) => {
  const go = () => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1500 }) : window.setTimeout(fn, 200));
  if (document.readyState === 'complete') return go();
  window.addEventListener('load', go, { once: true });
  return undefined;
};

// The sculpture is decorative. The CSS version is the placeholder until the Three.js frame is drawn, and stays
// if WebGL is missing or fails. Scroll turns the 3D version slightly while the Hero is on screen; offscreen it
// stops listening, and with reduced motion it draws one still frame.
function HeroSculpture({ theme, reduceMotion }) {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    let cancelled = false;
    let frame = 0;
    let visible = true;
    let resizeObserver;
    let io;

    const progress = () => {
      frame = 0;
      const hero = box.closest('.hero').getBoundingClientRect();
      sceneRef.current?.setProgress(Math.min(1, Math.max(0, -hero.top / Math.max(1, hero.height))));
    };
    const onScroll = () => { if (visible && !frame) frame = requestAnimationFrame(progress); };

    whenIdle(async () => {
      try {
        const { createHeroScene } = await import('../components/hero/heroScene.js');
        if (cancelled) return;
        const scene = createHeroScene(canvas, { theme: document.documentElement.dataset.theme, onLost: () => setStatus('failed') });
        sceneRef.current = scene;
        if (!reduceMotion) progress();
        scene.renderNow();
        resizeObserver = new ResizeObserver(() => scene.resize());
        resizeObserver.observe(canvas);
        if (!reduceMotion) {
          io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) onScroll(); });
          io.observe(box);
          window.addEventListener('scroll', onScroll, { passive: true });
        }
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('failed');
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
      resizeObserver?.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [reduceMotion]);

  useEffect(() => { sceneRef.current?.setTheme(theme); }, [theme]);

  return (
    <div className="hero-art" aria-hidden="true" data-status={status} ref={boxRef}>
      <div className="hero-art-rig">
        <span className="hero-ring hero-ring-outer" />
        <span className="hero-slab hero-slab-back" />
        <span className="hero-slab hero-slab-front" />
        <span className="hero-ring hero-ring-inner" />
        <span className="hero-orb" />
      </div>
      <span className="hero-floor" />
      <canvas ref={canvasRef} className="hero-canvas" hidden={status === 'failed'} />
    </div>
  );
}

export function Hero({ theme }) {
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
            <a className="button button-ghost" href="#contact">Contact</a>
          </motion.div>
          <p className="hero-availability">{HERO.availability}</p>
        </div>
        <HeroSculpture theme={theme} reduceMotion={reduceMotion} />
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

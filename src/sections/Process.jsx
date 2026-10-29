import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { PortfolioWorkflow } from '../components/PortfolioWorkflow.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';

export function Process() {
  const reduceMotion = useReducedMotion();
  const processRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: processRef,
    offset: ['start end', 'end start'],
  });
  const sectionProgress = useTransform(scrollYProgress, [0.15, 0.75], [0, 1]);

  return (
    <section ref={processRef} className="page-section process-section" id="process" aria-labelledby="process-title">
      <div className="shell">
        <SectionIntro titleId="process-title" entrance="static" number="03" eyebrow="THE PROCESS" title="Small loops. Real evidence." subtitle="A repeatable approach to shipping improvements without introducing layers of unnecessary complexity." />
        <div className="process-scroll-track" aria-hidden="true">
          <motion.div className="process-scroll-fill" style={{ scaleX: reduceMotion ? 1 : sectionProgress }} />
        </div>
        <PortfolioWorkflow />
        <p className="process-note">These are documented roles and checkpoints, not a claim that autonomous agents run in the background. The final decision stays with a person.</p>
      </div>
    </section>
  );
}

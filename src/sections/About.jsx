import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { ABOUT } from '../data/siteCopy.js';
import { useScrollSteps } from '../hooks/useScrollSteps.js';
import { EASE_OUT } from '../utils/motion.js';

// Tabs with roving focus (arrow keys, Home, End). Every capability name stays visible, so the section reads
// without interaction; selecting one only adds its detail. Scrolling through the pinned block steps through them.
function Capabilities() {
  const reduceMotion = useReducedMotion();
  const tabs = useRef([]);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const count = ABOUT.capabilities.length;
  const { pinned, index: selected, goTo } = useScrollSteps({ count, trackRef, stageRef });
  const active = ABOUT.capabilities[selected];

  const onKeyDown = (event) => {
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next;
    if (event.key in moves) next = (selected + moves[event.key] + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    goTo(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="steps-track" ref={trackRef} data-pinned={pinned} style={{ '--steps': count }}>
    <div className="capabilities steps-stage" ref={stageRef}>
      <h3 className="capabilities-title">What I bring to a team</h3>
      <div className="capabilities-tabs" role="tablist" aria-label="Capabilities" onKeyDown={onKeyDown}>
        {ABOUT.capabilities.map((item, index) => (
          <button key={item.id} ref={(el) => { tabs.current[index] = el; }} type="button" role="tab"
            id={`cap-tab-${item.id}`} aria-controls="cap-panel" aria-selected={index === selected}
            tabIndex={index === selected ? 0 : -1} className="capabilities-tab" onClick={() => goTo(index)}>
            <span className="capabilities-num" aria-hidden="true">0{index + 1}</span>{item.label}
          </button>
        ))}
      </div>
      <div className="capabilities-panel" id="cap-panel" role="tabpanel" aria-labelledby={`cap-tab-${active.id}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={active.id}
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}>
            <p>{active.body}</p>
            <p className="capabilities-evidence"><span>Evidence</span> {active.evidence}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}

export function About() {
  return (
    <section className="page-section about-section" id="about" aria-labelledby="about-title">
      <div className="shell">
        <SectionIntro titleId="about-title" number="02" eyebrow="ABOUT" title={ABOUT.title} />
        <div className="about-layout">
          <Reveal className="about-story" from={{ y: 16 }} amount={0.2} duration={0.6}>
            {ABOUT.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <dl className="about-facts">
              {ABOUT.arrangements.map((fact) => (
                <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
              ))}
            </dl>
          </Reveal>
          <Reveal as={motion.aside} className="about-timeline" aria-labelledby="experience-title" from={{ y: 22 }} amount={0.15} duration={0.65} delay={0.05}>
            <h3 id="experience-title">Experience</h3>
            <ol>
              {ABOUT.experience.map((item) => (
                <li key={`${item.company}-${item.role}`}>
                  <span className="about-period">{item.period}</span>
                  <strong>{item.role}</strong>
                  <span className="about-company">{item.company}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
        <Capabilities />
      </div>
    </section>
  );
}

import { useRef } from 'react';
import { motion } from 'motion/react';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { ABOUT } from '../data/siteCopy.js';
import { useScrollSteps } from '../hooks/useScrollSteps.js';

// Tabs with roving focus (arrow keys, Home, End). Every capability name stays visible, so the section reads
// without interaction; selecting one only adds its detail. Scrolling through the pinned block steps through them.
function Capabilities() {
  const tabs = useRef([]);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const count = ABOUT.capabilities.length;
  const { pinned, index: selected, goTo } = useScrollSteps({ count, trackRef, stageRef });
  const active = ABOUT.capabilities[selected];

  const onKeyDown = (event) => {
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    // Move from the focused tab: while pinned, scrolling can select another tab without moving focus.
    const from = Math.max(0, tabs.current.indexOf(document.activeElement));
    let next;
    if (event.key in moves) next = (from + moves[event.key] + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    goTo(next);
    tabs.current[next]?.focus({ preventScroll: true });
  };

  return (
    <div className="steps-track" ref={trackRef} data-pinned={pinned} style={{ '--steps': count }}>
    <span className="steps-probe" aria-hidden="true" />
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
      {/* Every panel is laid out in the same cell, so the stage is as tall as the longest one whichever step shows,
          and the pinned fit never depends on the step. */}
      <div className="capabilities-panel steps-panes" id="cap-panel" role="tabpanel" aria-labelledby={`cap-tab-${active.id}`}>
        {ABOUT.capabilities.map((item, index) => (
          <div key={item.id} className="steps-pane" data-active={index === selected}>
            <p>{item.body}</p>
            <p className="capabilities-evidence"><span>Evidence</span> {item.evidence}</p>
          </div>
        ))}
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

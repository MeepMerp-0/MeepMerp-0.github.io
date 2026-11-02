import { useRef } from 'react';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { Scramble, SplitText } from '../components/TextMotion.jsx';
import { ABOUT } from '../data/siteCopy.js';
import { useReveal } from '../hooks/useReveal.js';
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
  const [, reveal] = useReveal(0.2, stageRef);

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
    <div className="capabilities steps-stage" ref={stageRef} data-reveal={reveal}>
      <h3 className="capabilities-title"><SplitText text="What I bring to a team" /></h3>
      <div className="capabilities-tabs" role="tablist" aria-label="Capabilities" onKeyDown={onKeyDown}>
        {ABOUT.capabilities.map((item, index) => (
          <button key={item.id} ref={(el) => { tabs.current[index] = el; }} type="button" role="tab"
            id={`cap-tab-${item.id}`} aria-controls="cap-panel" aria-selected={index === selected}
            tabIndex={index === selected ? 0 : -1} className="capabilities-tab tm-up" style={{ '--i': index }} onClick={() => goTo(index)}>
            <span className="capabilities-num" aria-hidden="true">0{index + 1}</span>{item.label}
          </button>
        ))}
      </div>
      {/* Every panel is laid out in the same cell, so the stage is as tall as the longest one whichever step shows,
          and the pinned fit never depends on the step. */}
      <div className="capabilities-panel steps-panes tm-up" id="cap-panel" role="tabpanel" aria-labelledby={`cap-tab-${active.id}`}>
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
  const [storyRef, story] = useReveal(0.2);
  const [timelineRef, timeline] = useReveal(0.15);

  return (
    <section className="page-section about-section" id="about" aria-labelledby="about-title">
      <div className="shell">
        <SectionIntro titleId="about-title" number="02" eyebrow="ABOUT" title={ABOUT.title} />
        <div className="about-layout">
          <div ref={storyRef} className="about-story" data-reveal={story}>
            {/* The display-serif lead is never hidden; it inks word by word as it scrolls through. */}
            {ABOUT.intro.map((paragraph, i) => (
              <p key={paragraph} className={i ? 'tm-lines' : undefined}>{i ? paragraph : <SplitText text={paragraph} ink />}</p>
            ))}
            <dl className="about-facts tm-up">
              {ABOUT.arrangements.map((fact) => (
                <div key={fact.label}><dt><Scramble text={fact.label} play={story === 'in'} delay={480} /></dt><dd>{fact.value}</dd></div>
              ))}
            </dl>
          </div>
          <aside ref={timelineRef} className="about-timeline" aria-labelledby="experience-title" data-reveal={timeline}>
            <h3 id="experience-title"><Scramble text="Experience" play={timeline === 'in'} /></h3>
            <ol>
              {ABOUT.experience.map((item, i) => (
                <li key={`${item.company}-${item.role}`} className="tm-up" style={{ '--i': i }}>
                  <span className="about-period">{item.period}</span>
                  <strong>{item.role}</strong>
                  <span className="about-company">{item.company}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
        <Capabilities />
      </div>
    </section>
  );
}

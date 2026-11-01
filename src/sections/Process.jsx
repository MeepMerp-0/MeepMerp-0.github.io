import { useRef } from 'react';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { useScrollSteps } from '../hooks/useScrollSteps.js';
import { PROCESS_STEPS } from '../data/siteCopy.js';
import { twoDigits } from '../utils/format.js';

export function Process() {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const { pinned, index: selected, goTo } = useScrollSteps({ count: PROCESS_STEPS.length, trackRef, stageRef });

  return (
    <section className="page-section process-section" id="process" aria-labelledby="process-title">
      <div className="shell">
        <SectionIntro titleId="process-title" number="03" eyebrow="PROCESS" title="Four steps, written down."
          subtitle="How I take work from a loose request to something a team can rely on. A working approach, not a guarantee." />
        <div className="steps-track" ref={trackRef} data-pinned={pinned} style={{ '--steps': PROCESS_STEPS.length }}>
        <span className="steps-probe" aria-hidden="true" />
        <div className="process steps-stage" ref={stageRef}>
          <ol className="process-steps">
            {PROCESS_STEPS.map((step, index) => (
              <li key={step.id}>
                <button type="button" className="process-step" aria-pressed={index === selected}
                  aria-controls="process-detail" onClick={() => goTo(index)}>
                  <span className="process-num">{twoDigits(index + 1)}</span>
                  <span className="process-label">{step.label}</span>
                  <span className="process-summary">{step.summary}</span>
                </button>
              </li>
            ))}
          </ol>
          {/* All steps share one cell, so the stage height does not depend on the step (see About). While pinned the
              detail follows scrolling, so it is not a live region there; announcing every step would be noise. */}
          <div className="process-detail steps-panes" id="process-detail" aria-live={pinned ? 'off' : 'polite'}>
            {PROCESS_STEPS.map((step, index) => (
              <div key={step.id} className="process-detail-inner steps-pane" data-active={index === selected}>
                <h3>{twoDigits(index + 1)} · {step.label}</h3>
                <dl>
                  <div><dt>Focus</dt><dd>{step.focus}</dd></div>
                  <div><dt>Expected output</dt><dd>{step.output}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

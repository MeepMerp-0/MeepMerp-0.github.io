import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { PROCESS_STEPS } from '../data/siteCopy.js';
import { twoDigits } from '../utils/format.js';
import { EASE_OUT } from '../utils/motion.js';

export function Process() {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const active = PROCESS_STEPS[selected];

  return (
    <section className="page-section process-section" id="process" aria-labelledby="process-title">
      <div className="shell">
        <SectionIntro titleId="process-title" number="03" eyebrow="PROCESS" title="Four steps, written down."
          subtitle="How I take work from a loose request to something a team can rely on. A working approach, not a guarantee." />
        <div className="process">
          <ol className="process-steps">
            {PROCESS_STEPS.map((step, index) => (
              <li key={step.id}>
                <button type="button" className="process-step" aria-pressed={index === selected}
                  aria-controls="process-detail" onClick={() => setSelected(index)}>
                  <span className="process-num">{twoDigits(index + 1)}</span>
                  <span className="process-label">{step.label}</span>
                  <span className="process-summary">{step.summary}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="process-detail" id="process-detail" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={active.id} className="process-detail-inner"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}>
                <h3>{twoDigits(selected + 1)} · {active.label}</h3>
                <dl>
                  <div><dt>Focus</dt><dd>{active.focus}</dd></div>
                  <div><dt>Expected output</dt><dd>{active.output}</dd></div>
                </dl>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

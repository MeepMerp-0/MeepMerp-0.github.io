import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, ChevronRight, GitBranch } from 'lucide-react';
import { WORKFLOW_STAGES } from '../data/workflowStages.js';
import { twoDigits } from '../utils/format.js';
import './PortfolioWorkflow.css';

export function PortfolioWorkflow() {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const active = WORKFLOW_STAGES[selected];
  return (
    <section className="portfolio-workflow" aria-labelledby="portfolio-workflow-title">
      <div className="portfolio-workflow__window">
        <div className="portfolio-workflow__toolbar">
          <div className="portfolio-workflow__lights" aria-hidden="true"><span /><span /><span /></div>
          <span className="portfolio-workflow__path">portfolio / build.md</span>
          <span className="portfolio-workflow__mode">HUMAN-APPROVED</span>
        </div>
        <div className="portfolio-workflow__intro">
          <span className="portfolio-workflow__eyebrow">AI-ASSISTED DELIVERY / PLAYBOOK 01</span>
          <h3 id="portfolio-workflow-title">From idea to shipped experience.</h3>
          <p>A practical five-stage process for improving this portfolio: clear roles, explicit handoffs, honest testing, and review before release.</p>
        </div>
        <div className="portfolio-workflow__steps" role="group" aria-label="Choose a delivery stage">
          {WORKFLOW_STAGES.map((stage, index) => (
            <button key={stage.id} type="button" className="portfolio-workflow__step"
              aria-pressed={index === selected} onClick={() => setSelected(index)}>
              <span className="portfolio-workflow__step-name"><span>{twoDigits(index + 1)}</span> {stage.label}</span>
              <span className="portfolio-workflow__step-summary">{stage.short}</span>
            </button>
          ))}
        </div>
        <div className="portfolio-workflow__detail" aria-live="polite" aria-atomic="true">
          <motion.div
            className="portfolio-workflow__primary"
            key={active.id}
            initial={reduceMotion ? false : { y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <span className="portfolio-workflow__tag">{'<'}{active.id}{'>'}</span>
            <h4>{active.heading}</h4>
            <p>{active.description}</p>
            <ul>{active.checks.map(check => <li key={check}><ChevronRight size={14} aria-hidden="true" />{check}</li>)}</ul>
            <span className="portfolio-workflow__tag">{'</'}{active.id}{'>'}</span>
          </motion.div>
          <div className="portfolio-workflow__sidebar">
            <div><span className="portfolio-workflow__meta">ROLE</span><strong>{active.role}</strong></div>
            <div><span className="portfolio-workflow__meta">DELIVERABLE</span><strong>{active.output}</strong></div>
            <div className="portfolio-workflow__gate">
              <span className="portfolio-workflow__meta">APPROVAL CHECKPOINT</span>
              <p><Check size={15} aria-hidden="true" />{active.gate}</p>
            </div>
          </div>
        </div>
        <div className="portfolio-workflow__footer">
          <span><GitBranch size={14} aria-hidden="true" /> Three lean review roles. Five accountable stages.</span>
          <a href="https://github.com/MeepMerp-0/MeepMerp-0.github.io" target="_blank" rel="noopener noreferrer">View source on GitHub <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, ChevronRight, GitBranch } from 'lucide-react';
import './PortfolioWorkflow.css';

const STAGES = [
  { id: 'audit', label: 'AUDIT', short: 'Find the friction', heading: 'Start with the visitor, not the framework.', description: 'Review this portfolio as a recruiter, client, and mobile visitor. Find one real problem before changing code.', role: 'Research and accessibility auditor', output: 'Prioritized improvement brief', gate: 'One user problem and a success signal are defined.', checks: ['Review mobile, keyboard and loading experience', 'Check content clarity, links and SEO basics', 'Rank opportunities by impact and effort'] },
  { id: 'design', label: 'DESIGN', short: 'Define the solution', heading: 'Make the change small enough to ship.', description: 'Turn the best finding into a clear interface and content specification that matches this design system.', role: 'UX and content designer', output: 'Mobile-first implementation spec', gate: 'Layout, copy, keyboard paths and acceptance criteria are approved.', checks: ['Sketch a mobile-first layout', 'Specify interaction and error states', 'Define measurable acceptance criteria'] },
  { id: 'build', label: 'BUILD', short: 'Implement one slice', heading: 'Build a useful change, not a bigger stack.', description: 'Implement the scoped improvement in React with existing conventions. Keep dependencies lean and the diff reviewable.', role: 'Frontend implementer', output: 'Focused pull request', gate: 'The change matches approved scope without leaking secrets.', checks: ['Reuse components and CSS tokens', 'Use semantic markup and accessible controls', 'Document behavior and trade-offs'] },
  { id: 'test', label: 'TEST', short: 'Challenge the result', heading: 'Prove it works beyond your laptop.', description: 'Check the bundle and visitor flows. Report what was actually tested and label any unverified assumptions.', role: 'Independent quality reviewer', output: 'QA notes and reproducible results', gate: 'Build checks pass and critical manual checks receive sign-off.', checks: ['Run the build and focused lint checks', 'Check narrow layouts and both themes', 'Verify keyboard focus, navigation and reduced motion'] },
  { id: 'ship', label: 'SHIP', short: 'Release and learn', heading: 'Publish with a human in control.', description: 'Review the pull request, release it deliberately, and use feedback to prioritize another improvement.', role: 'Human release owner', output: 'Approved release and next iteration', gate: 'The owner reviews the PR before merging or deploying.', checks: ['Record the change and evidence', 'Approve the PR before deployment', 'Capture feedback and the next improvement'] },
];

export default function PortfolioWorkflow() {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const active = STAGES[selected];
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
          {STAGES.map((stage, index) => (
            <button key={stage.id} type="button" className="portfolio-workflow__step"
              aria-pressed={index === selected} onClick={() => setSelected(index)}>
              <span className="portfolio-workflow__step-name"><span>{String(index + 1).padStart(2, '0')}</span> {stage.label}</span>
              <span className="portfolio-workflow__step-summary">{stage.short}</span>
            </button>
          ))}
        </div>
        <div className="portfolio-workflow__detail" aria-live="polite" aria-atomic="true">
          <motion.div
            className="portfolio-workflow__primary"
            key={active.id}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
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

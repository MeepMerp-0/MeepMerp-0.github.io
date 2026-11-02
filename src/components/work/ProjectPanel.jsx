import { useRef } from 'react';
import { ArrowUpRight, MessageSquare, MonitorPlay } from 'lucide-react';
import { AKI_ENABLED } from '../../services/akiClient.js';
import { twoDigits } from '../../utils/format.js';
import { useReveal } from '../../hooks/useReveal.js';
import { RollText, Scramble, SplitText } from '../TextMotion.jsx';

// Opens the real assistant through its own launcher, exactly as a click on the robot would.
// Uses Aki's own launcher, so the assistant behaves exactly as when the robot is clicked. If the panel is
// already open, focus moves to it instead.
function openAki() {
  const launcher = document.querySelector('.aki-launcher');
  if (launcher && launcher.getAttribute('aria-expanded') !== 'true') launcher.click();
  else document.getElementById('aki-panel')?.focus();
}

function ExternalLink({ href, label }) {
  return (
    <a className="project-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
      <RollText>{label}</RollText> <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}

export function ProjectPanel({ project, index, total, onDemo, className = '', hidden, panelRef, children }) {
  const titleId = `project-${project.id}-title`;
  const revealRef = useRef(null);
  const [, seen] = useReveal(0.2, revealRef);
  // Pinned panels are stacked and all in view, so only the shown panel takes part in the reveal. Inactive panels get
  // no attribute, which keeps the outgoing text visible while it fades.
  const reveal = hidden ? undefined : seen;
  return (
    <article ref={(el) => { revealRef.current = el; panelRef?.(el); }} className={`project ${className}`}
      id={`project-${project.id}`} aria-labelledby={titleId} data-hidden={hidden || undefined} data-reveal={reveal}>
      {children}
      <p className="project-kicker tm-fade"><span>{twoDigits(index + 1)}</span> / {twoDigits(total)} · <Scramble text={project.chapter} play={reveal === 'in'} /></p>
      <h3 id={titleId}><SplitText text={project.title} /></h3>
      <p className="project-role tm-up">{project.role}</p>
      <dl className="project-facts">
        <div className="tm-lines" style={{ '--i': 0 }}><dt>Context</dt><dd>{project.context}</dd></div>
        <div className="tm-lines" style={{ '--i': 1 }}><dt>What I built</dt><dd>{project.built}</dd></div>
        <div className="tm-lines" style={{ '--i': 2 }}>
          <dt>Approach</dt>
          <dd><ul className="project-approach">{project.approach.map((item) => <li key={item}>{item}</li>)}</ul></dd>
        </div>
        <div className="tm-lines" style={{ '--i': 3 }}><dt>Result</dt><dd>{project.resultWithoutAki && !AKI_ENABLED ? project.resultWithoutAki : project.result}</dd></div>
      </dl>
      <ul className="project-tech tm-fade" aria-label="Technologies">
        {project.tech.map((tech) => <li key={tech}>{tech}</li>)}
      </ul>
      {project.techNote && <p className="project-note tm-fade">{project.techNote}</p>}
      <div className="project-actions tm-fade">
        {project.askAki && AKI_ENABLED && (
          <button type="button" className="button button-solid" onClick={openAki}>
            <MessageSquare size={16} aria-hidden="true" /> <RollText>Ask Aki now</RollText>
          </button>
        )}
        {project.demo && (
          <button type="button" className="button button-ghost" onClick={(event) => onDemo(project, event.currentTarget)}>
            <MonitorPlay size={16} aria-hidden="true" /> <RollText>Open fictional demo</RollText>
          </button>
        )}
        {project.links.map((link) => (link.external
          ? <ExternalLink key={link.href} href={link.href} label={link.label} />
          : <a key={link.href} className="project-link" href={link.href}><RollText>{link.label}</RollText> <ArrowUpRight size={15} aria-hidden="true" /></a>))}
      </div>
      {project.samples?.length > 0 && (
        <details className="project-samples tm-fade">
          <summary>{project.samples.length} more sample sites</summary>
          <ul>{project.samples.map((sample) => <li key={sample.href}><ExternalLink href={sample.href} label={sample.label} /></li>)}</ul>
        </details>
      )}
    </article>
  );
}

import { ArrowUpRight, MessageSquare, MonitorPlay } from 'lucide-react';
import { AKI_ENABLED } from '../../services/akiClient.js';
import { twoDigits } from '../../utils/format.js';

// Opens the real assistant through its own launcher, exactly as a click on the robot would.
function openAki() {
  const launcher = document.querySelector('.aki-launcher');
  if (launcher && launcher.getAttribute('aria-expanded') !== 'true') launcher.click();
}

function ExternalLink({ href, label }) {
  return (
    <a className="project-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
      {label} <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}

export function ProjectPanel({ project, index, total, onDemo, className = '', hidden, panelRef, children }) {
  const titleId = `project-${project.id}-title`;
  return (
    <article ref={panelRef} className={`project ${className}`} id={`project-${project.id}`} aria-labelledby={titleId}
      data-hidden={hidden || undefined}>
      {children}
      <p className="project-kicker"><span>{twoDigits(index + 1)}</span> / {twoDigits(total)} · {project.chapter}</p>
      <h3 id={titleId}>{project.title}</h3>
      <p className="project-role">{project.role}</p>
      <dl className="project-facts">
        <div><dt>Context</dt><dd>{project.context}</dd></div>
        <div><dt>What I built</dt><dd>{project.built}</dd></div>
        <div>
          <dt>Approach</dt>
          <dd><ul className="project-approach">{project.approach.map((item) => <li key={item}>{item}</li>)}</ul></dd>
        </div>
        <div><dt>Result</dt><dd>{project.result}</dd></div>
      </dl>
      <ul className="project-tech" aria-label="Technologies">
        {project.tech.map((tech) => <li key={tech}>{tech}</li>)}
      </ul>
      {project.techNote && <p className="project-note">{project.techNote}</p>}
      <div className="project-actions">
        {project.askAki && AKI_ENABLED && (
          <button type="button" className="button button-solid" onClick={openAki}>
            <MessageSquare size={16} aria-hidden="true" /> Ask Aki now
          </button>
        )}
        {project.demo && (
          <button type="button" className="button button-ghost" onClick={(event) => onDemo(project, event.currentTarget)}>
            <MonitorPlay size={16} aria-hidden="true" /> Open fictional demo
          </button>
        )}
        {project.links.map((link) => (link.external
          ? <ExternalLink key={link.href} href={link.href} label={link.label} />
          : <a key={link.href} className="project-link" href={link.href}>{link.label} <ArrowUpRight size={15} aria-hidden="true" /></a>))}
      </div>
      {project.samples?.length > 0 && (
        <details className="project-samples">
          <summary>{project.samples.length} more sample sites</summary>
          <ul>{project.samples.map((sample) => <li key={sample.href}><ExternalLink href={sample.href} label={sample.label} /></li>)}</ul>
        </details>
      )}
    </article>
  );
}

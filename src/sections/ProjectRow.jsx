import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '../components/Reveal.jsx';
import { EMAIL_URL } from '../data/portfolioData.js';
import { twoDigits } from '../utils/format.js';

const HIGHLIGHT_LIMIT = 3;
const TECH_LIMIT = 6;

// The sites from an engagement, a note for private work, or a single link to the project.
function ProjectLinks({ project }) {
  if (project.links?.length) {
    return (
      <div className="project-site-collection" role="group" aria-label="Sites from this engagement">
        <span className="project-collection-label">WEBSITES / SELECTED</span>
        <div className="project-site-links">
          {project.links.map((link) => (
            <a key={link.href} className="project-link" href={link.href}
              target="_blank" rel="noopener noreferrer"
              aria-label={`${link.label} (opens in a new tab)`}>
              {link.label} <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ))}
        </div>
        {project.samples?.length > 0 && (
          <details className="project-samples">
            <summary>View {project.samples.length} additional site samples</summary>
            <ul>
              {project.samples.map((sample) => (
                <li key={sample.href}>
                  <a href={sample.href} target="_blank" rel="noopener noreferrer"
                    aria-label={`${sample.label} (opens in a new tab)`}>
                    {sample.label} <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  }
  if (!project.site) {
    return (
      <div className="project-private">
        <span>{project.privateLabel || 'PRIVATE / INTERNAL PROJECT'}</span>
        <p>{project.clickMessage || 'Further details available on request.'}</p>
        <a href={`${EMAIL_URL}?subject=Portfolio%20project%20enquiry`}>Ask about this work <ArrowUpRight size={15} aria-hidden="true" /></a>
      </div>
    );
  }
  return (
    <a className="project-link" href={project.site} target="_blank" rel="noopener noreferrer"
      aria-label={`View ${project.title} (opens in a new tab)`}>
      Visit project <ArrowUpRight size={18} aria-hidden="true" />
    </a>
  );
}

export function ProjectRow({ project, index }) {
  const metric = project.metrics?.[0];
  return (
    <Reveal
      as={motion.article}
      className="project-row"
      from={{ x: index % 2 === 0 ? -16 : 16 }}
      amount={0.16}
      duration={0.58}
    >
      <div className="project-count">
        <span>{twoDigits(index + 1)}</span>
        <span className="project-year">{project.year}</span>
      </div>
      <div className="project-content">
        <div className="project-label-row">
          <span className="project-type">{project.tag.split('·')[0].trim()}</span>
          {project.status === 'In progress' && <span className="project-ongoing">CURRENT WORK</span>}
        </div>
        <h3>{project.title}</h3>
        <p className="project-description">{project.desc}</p>
        <ul className="project-highlights" aria-label="Key features">
          {project.highlights.slice(0, HIGHLIGHT_LIMIT).map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
        <div className="project-tech" aria-label="Technologies">
          {project.tech.slice(0, TECH_LIMIT).map((tech) => <span key={tech}>{tech}</span>)}
        </div>
        {project.techContext && <p className="project-tech-note">{project.techContext}</p>}
      </div>
      <div className="project-aside">
        {metric && <div className="project-evidence"><span>{metric.label}</span><strong>{metric.value}</strong></div>}
        <ProjectLinks project={project} />
      </div>
    </Reveal>
  );
}

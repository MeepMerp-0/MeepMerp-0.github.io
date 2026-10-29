import { ArrowUpRight } from 'lucide-react';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { PERSONAL, SELECTED_PROJECTS } from '../data/portfolioData.js';
import { ProjectRow } from './ProjectRow.jsx';

export function Work() {
  return (
    <section className="page-section work-section" id="work" aria-labelledby="work-title">
      <div className="shell">
        <SectionIntro titleId="work-title" entrance="from-left" number="01" eyebrow="SELECTED WORK" title="Proof over promises." subtitle="Current client engineering, completed systems, and practical experiments. Every project starts with a real workflow." />
        <div className="project-list">
          {SELECTED_PROJECTS.map((project, index) => <ProjectRow key={project.id} project={project} index={index} />)}
        </div>
        <div className="section-outro"><span>THAT'S THE SHORTLIST.</span><a href={PERSONAL.github} target="_blank" rel="noopener noreferrer">More on GitHub <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}

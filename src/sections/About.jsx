import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { NoteEntries } from '../components/NoteEntries.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import {
  ABOUT_STORY, AVAILABILITY, EMAIL_URL, LATEST_ROLE, SKILL_GROUPS, WHATSAPP_URL,
} from '../data/portfolioData.js';

const AT_A_GLANCE = [
  { title: 'Full-time role', description: AVAILABILITY.fullTime },
  { title: 'Freelance', description: AVAILABILITY.freelance },
  { title: 'Latest role', description: `${LATEST_ROLE.role} · ${LATEST_ROLE.company}` },
  { title: 'Based in', description: 'Abu Dhabi, UAE' },
];

export function About() {
  return (
    <section className="page-section about-section-redesign" id="about" aria-labelledby="about-title">
      <div className="shell">
        <SectionIntro titleId="about-title" entrance="rise" number="02" eyebrow="BACKGROUND" title="Engineer first. Tools second." subtitle="I work across the stack because most useful problems don't stop neatly at the frontend." />
        <div className="about-layout">
          <Reveal className="about-story" from={{ x: -18 }} amount={0.17} duration={0.58}>
            <h3>A little about me.</h3>
            {ABOUT_STORY.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </Reveal>
          <Reveal
            as={motion.aside}
            className="hero-notes about-card"
            aria-label="Availability at a glance"
            from={{ x: 18 }}
            amount={0.14}
            duration={0.62}
            delay={0.06}
          >
            <div className="notes-heading"><span>AT A GLANCE</span><span><span className="status-dot" aria-hidden="true" /> OPEN TO WORK</span></div>
            <p className="notes-title">What I'm looking for</p>
            <NoteEntries entries={AT_A_GLANCE} />
            <div className="notes-foot">
              <span className="notes-foot-label">LET'S TALK</span>
              <span className="about-card-links">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp (opens in a new tab)">WhatsApp <ArrowUpRight size={13} aria-hidden="true" /></a>
                <a href={EMAIL_URL}>Email <ArrowUpRight size={13} aria-hidden="true" /></a>
              </span>
            </div>
          </Reveal>
        </div>
        <Reveal className="capabilities" from={{ y: 12 }} amount={0.16} duration={0.6}>
          <div className="capabilities-lead">CURRENT TOOLKIT <span>SELECTED, NOT EXHAUSTIVE</span></div>
          <div className="capabilities-grid">
            {SKILL_GROUPS.map((group) => (
              <div className="capabilities-group" key={group.label}>
                <h4>{group.label}</h4>
                <p>{group.items.join(' / ')}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

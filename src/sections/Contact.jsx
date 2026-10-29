import { ArrowUpRight, Github } from 'lucide-react';
import { ContactForm } from '../components/contact/ContactForm.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { EMAIL_URL, PERSONAL } from '../data/portfolioData.js';

export function Contact() {
  return (
    <section className="page-section contact-section" id="contact" aria-labelledby="contact-title">
      <div className="shell">
        <SectionIntro titleId="contact-title" entrance="from-right" number="04" eyebrow="GET IN TOUCH" title="Have something worth building?" subtitle="Tell me the problem, not just the tech stack. I'll take it from there." />
        <div className="contact-grid">
          <Reveal className="contact-sidebar" from={{ x: -16 }} amount={0.18} duration={0.54}>
            <h3>Let's make it useful.</h3>
            <p>Open to conversations about agentic AI systems, full-stack engineering, and business software. Tell me the problem you're solving.</p>
            <div className="contact-method"><span>EMAIL</span><a href={EMAIL_URL}>{PERSONAL.email} <ArrowUpRight size={16} aria-hidden="true" /></a></div>
            <div className="contact-method"><span>GITHUB</span><a href={PERSONAL.github} target="_blank" rel="noopener noreferrer"><Github size={16} aria-hidden="true" /> MeepMerp-0 <ArrowUpRight size={15} aria-hidden="true" /></a></div>
            <div className="contact-method"><span>LOCATION</span><strong>Abu Dhabi, United Arab Emirates</strong></div>
          </Reveal>
          <Reveal className="contact-form-wrap" from={{ y: 22 }} amount={0.15} duration={0.65} delay={0.08}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

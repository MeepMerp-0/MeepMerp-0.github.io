import { ArrowUpRight, MessageCircle, createLucideIcon } from 'lucide-react';
import { ContactForm } from '../components/contact/ContactForm.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { EMAIL_URL, PERSONAL, WHATSAPP_URL } from '../data/portfolioData.js';

// lucide-react 1.x dropped brand icons; this is the same GitHub outline from lucide 0.447 (ISC licence).
const Github = createLucideIcon('Github', [
  ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4', key: 'tonef' }],
  ['path', { d: 'M9 18c-4.51 2-5-2-7-2', key: '9comsn' }],
]);

export function Contact() {
  return (
    <section className="page-section contact-section" id="contact" aria-labelledby="contact-title">
      <div className="shell">
        <SectionIntro titleId="contact-title" number="04" eyebrow="CONTACT" title="Hiring? Let's talk."
          subtitle="Full-time roles come first. Freelance projects and partnerships are welcome too." />
        <div className="contact-grid">
          <Reveal className="contact-sidebar" from={{ y: 16 }} amount={0.18} duration={0.55}>
            <p>Tell me about the role or the problem, the team, and any timing that matters. I'll reply by email.</p>
            <div className="contact-method"><span>EMAIL</span><a href={EMAIL_URL}>{PERSONAL.email} <ArrowUpRight size={16} aria-hidden="true" /></a></div>
            <div className="contact-method"><span>WHATSAPP</span><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Message on WhatsApp (opens in a new tab)"><MessageCircle size={16} aria-hidden="true" /> Message on WhatsApp <ArrowUpRight size={15} aria-hidden="true" /></a></div>
            <div className="contact-method"><span>GITHUB</span><a href={PERSONAL.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub, MeepMerp-0 (opens in a new tab)"><Github size={16} aria-hidden="true" /> MeepMerp-0 <ArrowUpRight size={15} aria-hidden="true" /></a></div>
            <div className="contact-method"><span>LOCATION</span><strong>Abu Dhabi, United Arab Emirates</strong></div>
          </Reveal>
          <div className="contact-form-wrap">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

import { ArrowUpRight, Github, MessageCircle } from 'lucide-react';
import { ContactForm } from '../components/contact/ContactForm.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionIntro } from '../components/SectionIntro.jsx';
import { EMAIL_URL, PERSONAL, WHATSAPP_URL } from '../data/portfolioData.js';

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

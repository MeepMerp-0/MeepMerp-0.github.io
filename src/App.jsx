import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, Github,
  Menu, Moon, Sun, X,
} from 'lucide-react';
import PortfolioWorkflow from './components/PortfolioWorkflow.jsx';
import { PERSONAL, PROJECTS, EXPERIENCE } from './data/portfolioData.js';
import { useContactForm } from './hooks/useContactForm.js';
import { submitContactForm } from './services/formService.js';

const PROJECT_ORDER = [
  'thesis', 'erp-dashboard', 'workflow', 'wedding',
  '360-property-tour', 'christening-invitation',
];
const selectedProjects = PROJECT_ORDER
  .map((id) => PROJECTS.find((project) => project.id === id))
  .filter(Boolean);

const SKILL_GROUPS = [
  { label: '01 / INTERFACES', items: ['React', 'React Native', 'Next.js', 'Responsive UI'] },
  { label: '02 / SYSTEMS', items: ['Node.js', 'Laravel', 'Livewire', 'SQL'] },
  { label: '03 / AUTOMATION', items: ['n8n', 'AI workflows', 'APIs', 'Webhooks'] },
];

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage may be unavailable; the website still works without it.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function Header({ theme, setTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const navigation = useRef(null);
  useEffect(() => {
    if (menuOpen) navigation.current?.querySelector('a')?.focus();
  }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);
  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <a className="wordmark" href="#home" onClick={() => setMenuOpen(false)} aria-label="Jason Selerio, back to top">
          <span className="wordmark-symbol" aria-hidden="true">js<span>.</span></span>
          <span className="wordmark-text">JASON SELERIO <small>SOFTWARE ENGINEER</small></span>
        </a>
        <nav ref={navigation} className={'site-nav' + (menuOpen ? ' site-nav--open' : '')} id="main-navigation" aria-label="Main navigation">
          <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#process" onClick={() => setMenuOpen(false)}>Process</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button theme-button" type="button" onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <a className="header-cta" href={'mailto:' + PERSONAL.email}>Let's talk <ArrowUpRight size={15} aria-hidden="true" /></a>
          <button ref={menuButton} className="icon-button mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}>
            {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function SectionIntro({ number, eyebrow, title, subtitle, id }) {
  return (
    <div className="section-intro">
      <div className="section-intro-label"><span>{number}</span> / {eyebrow}</div>
      <div className="section-intro-main">
        <h2 id={id}>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero shell" id="home" aria-labelledby="hero-title">
      <div className="hero-topline">
        <span><span className="status-dot" aria-hidden="true" /> SOFTWARE ENGINEER / ABU DHABI, UAE</span>
        <span>PORTFOLIO — 2026</span>
      </div>
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow">HELLO, I'M JASON.</p>
          <h1 id="hero-title">I build the<br /><em>systems</em> behind<br />the interface<span className="period">.</span></h1>
          <p className="hero-description">Full-stack engineering, automation, and practical tools for people doing real work. Less ceremony. More dependable software.</p>
          <div className="hero-actions">
            <a className="button button-solid" href="#work">Explore selected work <ArrowRight size={18} aria-hidden="true" /></a>
            <a className="button button-text" href={PERSONAL.cvDownloadUrl} target="_blank" rel="noopener noreferrer">View résumé <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <aside className="hero-notes" aria-label="Areas of work">
          <div className="notes-heading"><span>FIELD NOTES</span><span>001 / 003</span></div>
          <p className="notes-title">What I work on</p>
          <div className="notes-entry"><span>01</span><div><strong>Business systems</strong><p>Attendance, payroll, and operational dashboards.</p></div></div>
          <div className="notes-entry"><span>02</span><div><strong>Automation</strong><p>n8n workflows, API integrations, and human checkpoints.</p></div></div>
          <div className="notes-entry"><span>03</span><div><strong>Human-facing products</strong><p>Fast interfaces with real-world workflows behind them.</p></div></div>
          <div className="notes-foot">CURRENT ROLE <span>AI Engineer · INNERCIRCLE°</span></div>
        </aside>
      </div>
      <div className="hero-bottomline">
        <span>SELECTED PROJECTS AND EXPERIENCE, NOT A TEMPLATE SHOWCASE</span>
        <a href="#work">SCROLL TO WORK <ArrowDownRight size={17} aria-hidden="true" /></a>
      </div>
    </section>
  );
}

function ProjectRow({ project, index }) {
  const metric = project.metrics?.[0];
  const isPrivate = !project.site;
  return (
    <article className="project-row">
      <div className="project-count">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span className="project-year">{project.year}</span>
      </div>
      <div className="project-content">
        <span className="project-type">{project.tag.split('·')[0].trim()}</span>
        <h3>{project.title}</h3>
        <p className="project-description">{project.desc}</p>
        <ul className="project-highlights" aria-label="Key features">
          {project.highlights.slice(0, 3).map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
        <div className="project-tech" aria-label="Technologies">
          {project.tech.slice(0, 6).map((tech) => <span key={tech}>{tech}</span>)}
        </div>
      </div>
      <div className="project-aside">
        {metric && <div className="project-evidence"><span>{metric.label}</span><strong>{metric.value}</strong></div>}
        {isPrivate ? (
          <div className="project-private">
            <span>PRIVATE / INTERNAL PROJECT</span>
            <p>{project.clickMessage || 'Further details available on request.'}</p>
            <a href={'mailto:' + PERSONAL.email + '?subject=Portfolio%20project%20enquiry'}>Ask about this work <ArrowUpRight size={15} aria-hidden="true" /></a>
          </div>
        ) : (
          <a className="project-link" href={project.site} target="_blank" rel="noopener noreferrer"
            aria-label={'View ' + project.title + ' (opens in a new tab)'}>
            Visit project <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

function Work() {
  return (
    <section className="page-section work-section" id="work" aria-labelledby="work-title">
      <div className="shell">
        <SectionIntro id="work-title" number="01" eyebrow="SELECTED WORK" title="Proof over promises." subtitle="A mix of shipped products, business systems, and useful experiments. Each project starts with a concrete problem." />
        <div className="project-list">
          {selectedProjects.map((project, index) => <ProjectRow key={project.id} project={project} index={index} />)}
        </div>
        <div className="section-outro"><span>THAT'S THE SHORTLIST.</span><a href={PERSONAL.github} target="_blank" rel="noopener noreferrer">More on GitHub <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="page-section about-section-redesign" id="about" aria-labelledby="about-title">
      <div className="shell">
        <SectionIntro id="about-title" number="02" eyebrow="BACKGROUND" title="Engineer first. Tools second." subtitle="I work across the stack because most useful problems don't stop neatly at the frontend." />
        <div className="about-layout">
          <div className="about-story">
            <h3>A little about how I got here.</h3>
            <p>I'm a software engineer based in Abu Dhabi, focused on full-stack applications and AI-assisted workflow automation. I work on the parts people see—and the operational systems they rely on.</p>
            <p>My experience spans product interfaces, internal business tools, API integrations, and web/mobile development. The throughline is simple: understand the actual workflow, then make it easier to run.</p>
            <a href={PERSONAL.cvDownloadUrl} target="_blank" rel="noopener noreferrer" className="inline-link">Read my résumé <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <div className="experience">
            <h3>EXPERIENCE / RECENT TO EARLIER</h3>
            <ol>{EXPERIENCE.map((job) => <li key={job.company + job.period}>
              <div><strong>{job.role}</strong><span>{job.company}</span></div>
              <time>{job.period}</time>
            </li>)}</ol>
          </div>
        </div>
        <div className="capabilities">
          <div className="capabilities-lead">CURRENT TOOLKIT <span>SELECTED, NOT EXHAUSTIVE</span></div>
          <div className="capabilities-grid">{SKILL_GROUPS.map((group) => <div className="capabilities-group" key={group.label}>
            <h4>{group.label}</h4><p>{group.items.join(' / ')}</p>
          </div>)}</div>
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="page-section process-section" id="process" aria-labelledby="process-title">
      <div className="shell">
        <SectionIntro id="process-title" number="03" eyebrow="THE PROCESS" title="Small loops. Real evidence." subtitle="A repeatable approach to shipping improvements without introducing layers of unnecessary complexity." />
        <PortfolioWorkflow />
        <p className="process-note">These are documented roles and checkpoints, not a claim that autonomous agents run in the background. The final decision stays with a person.</p>
      </div>
    </section>
  );
}

function Contact() {
  const { values, sent, loading, error, showAsterisk, handleChange, handleSubmit, reset, MAX_MESSAGE_LENGTH } = useContactForm(submitContactForm);
  return (
    <section className="page-section contact-section" id="contact" aria-labelledby="contact-title">
      <div className="shell">
        <SectionIntro id="contact-title" number="04" eyebrow="GET IN TOUCH" title="Have something worth building?" subtitle="Tell me the problem, not just the tech stack. I'll take it from there." />
        <div className="contact-grid">
          <div className="contact-sidebar">
            <h3>Let's make it useful.</h3>
            <p>Open to conversations about software engineering roles, practical web products, and automation work.</p>
            <div className="contact-method"><span>EMAIL</span><a href={'mailto:' + PERSONAL.email}>{PERSONAL.email} <ArrowUpRight size={16} aria-hidden="true" /></a></div>
            <div className="contact-method"><span>GITHUB</span><a href={PERSONAL.github} target="_blank" rel="noopener noreferrer"><Github size={16} aria-hidden="true" /> MeepMerp-0 <ArrowUpRight size={15} aria-hidden="true" /></a></div>
            <div className="contact-method"><span>LOCATION</span><strong>Abu Dhabi, United Arab Emirates</strong></div>
          </div>
          <div className="contact-form-wrap">
            {sent ? (
              <div className="form-feedback" role="status">
                <Check size={25} aria-hidden="true" />
                <h3>Message sent.</h3>
                <p>Thanks for reaching out. You can send another message if needed.</p>
                <button type="button" className="button button-solid" onClick={reset}>Write another message <ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="form-header"><span>MESSAGE.JS / NEW REQUEST</span><span>01—04</span></div>
                <div className="form-two">
                  <label>Your name <input name="name" type="text" autoComplete="name" required maxLength={50} placeholder="How should I call you?"
                    value={values.name} onChange={(event) => handleChange('name')(event.target.value)} aria-invalid={showAsterisk.name} /></label>
                  <label>Email address <input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"
                    value={values.email} onChange={(event) => handleChange('email')(event.target.value)} aria-invalid={showAsterisk.email} /></label>
                </div>
                <label>What is this about? <input name="purpose" type="text" required maxLength={150} placeholder="Project, role, or collaboration"
                  value={values.purpose} onChange={(event) => handleChange('purpose')(event.target.value)} aria-invalid={showAsterisk.purpose} /></label>
                <label>Tell me more <textarea name="message" required rows={5} maxLength={MAX_MESSAGE_LENGTH} placeholder="A few details about the problem you're solving..."
                  value={values.message} onChange={(event) => handleChange('message')(event.target.value)} aria-invalid={showAsterisk.message} /></label>
                <div className="form-count">{values.message.length} / {MAX_MESSAGE_LENGTH}</div>
                <div className="sr-only" aria-hidden="true"><label htmlFor="portfolio-website">Leave this empty</label><input type="text" name="website" id="portfolio-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => handleChange('website')(event.target.value)} /></div>
                {(Object.values(showAsterisk).some(Boolean)) && <p className="form-error" role="alert">Please complete all fields with a valid email and a message under {MAX_MESSAGE_LENGTH} characters.</p>}
                {error && <p className="form-error" role="alert">The message couldn't be sent. Please email me directly at <a href={'mailto:' + PERSONAL.email}>{PERSONAL.email}</a>.</p>}
                <button type="submit" className="button button-solid submit-button" disabled={loading}>
                  {loading ? 'Sending…' : 'Send message'} <ArrowUpRight size={18} aria-hidden="true" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem('theme', theme); } catch { /* optional */ }
  }, [theme]);

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <Header theme={theme} setTheme={setTheme} />
      <main id="content">
        <Hero />
        <Work />
        <About />
        <Process />
        <Contact />
      </main>
      <footer className="footer"><div className="shell footer-inner">
        <span>© {new Date().getFullYear()} {PERSONAL.name}</span>
        <span>DESIGNED WITH INTENT · BUILT WITH REACT</span>
        <a href="#home">BACK TO TOP ↑</a>
      </div></footer>
    </>
  );
}

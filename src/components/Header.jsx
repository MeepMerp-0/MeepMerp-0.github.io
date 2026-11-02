import { useEffect, useRef } from 'react';
import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { PERSONAL, WHATSAPP_URL } from '../data/portfolioData.js';
import { useActiveSection } from '../hooks/useActiveSection.js';
import { useMobileMenu } from '../hooks/useMobileMenu.js';
import { RollText, Scramble } from './TextMotion.jsx';

const NAV_LINKS = [
  { href: '#work', label: 'Work' },
  { href: '#about', label: 'About' },
  { href: '#process', label: 'Process' },
  { href: '#contact', label: 'Contact' },
];
const SECTION_IDS = NAV_LINKS.map(({ href }) => href.slice(1));

export function Header({ theme, onToggleTheme }) {
  const active = useActiveSection(SECTION_IDS);
  const { open, toggle, close, buttonRef, navRef } = useMobileMenu();
  const headerRef = useRef(null);

  // Anchors (scroll-padding-top) and the pinned Work stage sit exactly below the header, whatever its height.
  useEffect(() => {
    const header = headerRef.current;
    const measure = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <div className="header-inner shell" data-reveal="in">
        <a className="wordmark" href="#home" onClick={close} aria-label="Jason Selerio, back to top">
          <span className="wordmark-symbol" aria-hidden="true">js<span>.</span></span>
          <span className="wordmark-text"><Scramble text="JASON SELERIO" /> <small>{PERSONAL.title.toUpperCase()}</small></span>
        </a>
        <nav ref={navRef} className={`site-nav${open ? ' site-nav--open' : ''}`} id="main-navigation" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }, i) => <a key={href} href={href} className="tm-up" style={{ '--i': i }} onClick={close} aria-current={href === `#${active}` ? 'location' : undefined}><RollText>{label}</RollText></a>)}
        </nav>
        <div className="header-actions tm-fade">
          <button className="icon-button theme-button" type="button" onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <a className="header-cta" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Let's talk on WhatsApp (opens in a new tab)"><RollText>Let's talk</RollText> <ArrowUpRight size={15} aria-hidden="true" /></a>
          <button ref={buttonRef} className="icon-button mobile-menu" type="button" onClick={toggle}
            aria-expanded={open} aria-controls="main-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'}>
            {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

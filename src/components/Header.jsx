import { ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react';
import { PERSONAL, WHATSAPP_URL } from '../data/portfolioData.js';
import { useMobileMenu } from '../hooks/useMobileMenu.js';

const NAV_LINKS = [
  { href: '#work', label: 'Work' },
  { href: '#about', label: 'About' },
  { href: '#process', label: 'Process' },
  { href: '#contact', label: 'Contact' },
];

export function Header({ theme, onToggleTheme }) {
  const { open, toggle, close, buttonRef, navRef } = useMobileMenu();

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <a className="wordmark" href="#home" onClick={close} aria-label="Jason Selerio, back to top">
          <span className="wordmark-symbol" aria-hidden="true">js<span>.</span></span>
          <span className="wordmark-text">JASON SELERIO <small>{PERSONAL.title.toUpperCase()}</small></span>
        </a>
        <nav ref={navRef} className={`site-nav${open ? ' site-nav--open' : ''}`} id="main-navigation" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => <a key={href} href={href} onClick={close}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <button className="icon-button theme-button" type="button" onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <a className="header-cta" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Let's talk on WhatsApp (opens in a new tab)">Let's talk <ArrowUpRight size={15} aria-hidden="true" /></a>
          <button ref={buttonRef} className="icon-button mobile-menu" type="button" onClick={toggle}
            aria-expanded={open} aria-controls="main-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'}>
            {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}

import { PERSONAL } from '../data/portfolioData.js';

export function Footer() {
  return (
    <footer className="footer"><div className="shell footer-inner">
      <span>© {new Date().getFullYear()} {PERSONAL.name}</span>
      <span>DESIGNED WITH INTENT · BUILT WITH REACT</span>
      <a href="aki-legal.html">PRIVACY &amp; TERMS</a>
      <a href="#home">BACK TO TOP ↑</a>
    </div></footer>
  );
}

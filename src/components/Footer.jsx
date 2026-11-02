import { PERSONAL } from '../data/portfolioData.js';
import { useReveal } from '../hooks/useReveal.js';
import { RollText, Scramble } from './TextMotion.jsx';

export function Footer() {
  const [ref, reveal] = useReveal(0.5);
  return (
    <footer className="footer"><div ref={ref} className="shell footer-inner" data-reveal={reveal}>
      <span className="tm-fade">© {new Date().getFullYear()} {PERSONAL.name}</span>
      <span className="tm-fade" style={{ '--i': 1 }}><Scramble text="DESIGNED WITH INTENT · BUILT WITH REACT" play={reveal === 'in'} /></span>
      <a className="tm-fade" style={{ '--i': 2 }} href="aki-legal.html"><RollText>PRIVACY &amp; TERMS</RollText></a>
      <a className="tm-fade" style={{ '--i': 3 }} href="#home"><RollText>BACK TO TOP ↑</RollText></a>
    </div></footer>
  );
}

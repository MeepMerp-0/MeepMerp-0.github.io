import { Scramble, SplitText } from './TextMotion.jsx';
import { useReveal } from '../hooks/useReveal.js';

export function SectionIntro({ number, eyebrow, title, subtitle, titleId }) {
  const [ref, reveal] = useReveal(0.3);
  return (
    <div ref={ref} className="section-intro" data-reveal={reveal}>
      <div className="section-intro-label tm-fade">
        <span><Scramble text={number} play={reveal === 'in'} /></span> / <Scramble text={eyebrow} play={reveal === 'in'} />
      </div>
      <div className="section-intro-main">
        <h2 id={titleId}><SplitText text={title} /></h2>
        {subtitle && <p className="tm-lines">{subtitle}</p>}
      </div>
    </div>
  );
}

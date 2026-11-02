import { Fragment, useLayoutEffect, useRef } from 'react';
import { useMedia } from '../hooks/useWorkProgress.js';
import { scrambleFrame } from '../utils/motion.js';

const REDUCE = '(prefers-reduced-motion: reduce)';

// The whole text for assistive tech, aria-hidden fragments for motion. Spaces stay plain text between the fragments,
// so lines break exactly where the unsplit text would. `ink`: colour-only fragments (scroll-linked), never hidden or raised.
export function SplitText({ text, by = 'word', ink = false }) {
  const words = text.split(' ');
  return (
    <>
      <span className="sr-only tm-sr">{text}</span>
      <span className={ink ? 'split split-ink' : 'split split-rise'} aria-hidden="true" style={{ '--n': words.length }}>
        {words.map((word, w) => (
          <Fragment key={w}>
            {w > 0 && ' '}
            {by === 'char'
              ? <span className="split-word">{[...word].map((ch, c) => (
                  <span key={c} className="split-unit split-char" style={{ '--i': words.slice(0, w).join('').length + c }}>{ch}</span>
                ))}</span>
              : <span className="split-unit" style={{ '--i': w }}>{word}</span>}
          </Fragment>
        ))}
      </span>
    </>
  );
}

// Left-to-right decode of a monospace label. Only letters and digits change, into A-Z0-9, so the width and the break
// points never move. Ticks at ~25fps; cleanup restores the real text (StrictMode-safe).
export function Scramble({ text, play = true, delay = 0 }) {
  const ref = useRef(null);
  const reduce = useMedia(REDUCE);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!play || reduce || !el) return undefined;
    const duration = 300 + Math.min(text.length, 60) * 8;
    const start = performance.now() + delay;
    let raf = 0;
    let last = -Infinity;
    const tick = (now) => {
      const k = (now - start) / duration;
      if (k >= 1) { el.textContent = text; return; }
      if (now - last >= 40) { last = now; el.textContent = scrambleFrame(text, Math.max(0, k)); }
      raf = requestAnimationFrame(tick);
    };
    tick(performance.now());
    return () => { cancelAnimationFrame(raf); el.textContent = text; };
  }, [play, reduce, text, delay]);
  return (
    <span className="scramble">
      <span className="sr-only tm-sr">{text}</span>
      <span ref={ref} aria-hidden="true">{text}</span>
    </span>
  );
}

// Hover/focus label roll: the label slides up out of a clip while an aria-hidden copy slides in.
export function RollText({ children }) {
  return <span className="roll"><span>{children}</span><span aria-hidden="true">{children}</span></span>;
}

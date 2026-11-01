import { useEffect, useState } from 'react';

// The last section whose top has reached the reading line wins; at the very bottom the final one wins,
// since a short last section may never get its top up to the line.
export function pickActive(tops, line, atBottom) {
  if (atBottom && tops.length) return tops.length - 1;
  let active = -1;
  tops.forEach((top, index) => {
    if (top !== null && top <= line) active = index;
  });
  return active;
}

// Returns the id of the section the visitor is reading, or '' above the first one (the Hero).
export function useActiveSection(ids) {
  const [active, setActive] = useState('');
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const root = document.documentElement;
      const header = parseFloat(getComputedStyle(root).getPropertyValue('--header-h'))
        || document.querySelector('.site-header')?.offsetHeight || 0;
      const line = header + (window.innerHeight - header) * 0.35;
      // Looked up on every read because lazy sections mount after the first paint.
      const tops = ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? null);
      const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      const index = pickActive(tops, line, atBottom);
      setActive(index < 0 ? '' : ids[index]);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ids]);
  return active;
}

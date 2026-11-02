import { useRef } from 'react';
import { useInView } from 'motion/react';
import { useMedia } from './useWorkProgress.js';

// 'out' until the block's top passes `amount` of the viewport height from the bottom, then 'in' for good. A viewport line
// rather than an area ratio, so a block taller than the screen still reveals. undefined under reduced motion, so nothing is hidden.
// Pass `target` to observe a ref the component already owns.
export function useReveal(amount = 0.25, target) {
  const own = useRef(null);
  const ref = target ?? own;
  const seen = useInView(ref, { once: true, margin: `0px 0px -${Math.round(amount * 100)}% 0px` });
  const reduce = useMedia('(prefers-reduced-motion: reduce)');
  return [ref, reduce ? undefined : seen ? 'in' : 'out'];
}

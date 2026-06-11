import { useEffect, useState } from 'react';

export function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof globalThis === 'undefined' || !globalThis.matchMedia) return false;
    return globalThis.matchMedia(`(max-width:${bp}px)`).matches;
  });

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !globalThis.matchMedia) return;

    const mq = globalThis.matchMedia(`(max-width:${bp}px)`);
    const handler = (e) => setIsMobile(e.matches);

    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, [bp]);

  return isMobile;
}
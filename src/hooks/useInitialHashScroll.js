import { useEffect } from 'react';

export function useInitialHashScroll() {
  useEffect(() => {
    // On an initial /#work-style deep link, the browser can try to follow
    // the fragment before React has mounted the section into the DOM.
    const fragment = window.location.hash.slice(1);
    if (!fragment) return;
    let id;
    try { id = decodeURIComponent(fragment); } catch { return; }
    document.getElementById(id)?.scrollIntoView({
      behavior: 'instant',
      block: 'start',
    });
    // Native hash links handle subsequent navigation without JS scroll trapping.
  }, []);
}

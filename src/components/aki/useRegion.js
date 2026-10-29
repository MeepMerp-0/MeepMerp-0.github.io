import { useEffect, useEffectEvent, useState } from 'react';
import { fetchRegion } from '../../services/akiClient.js';

const REGION_DEFAULT = { memory: 'opt_in', gemini: 'ineligible' };

// The visitor's region rules, asked again each time the panel opens. An answer that arrives after the panel closed
// is dropped.
export function useRegion(open, onLoaded) {
  const [region, setRegion] = useState(REGION_DEFAULT);
  const loaded = useEffectEvent(onLoaded);
  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    fetchRegion().then((r) => {
      if (!live) return;
      setRegion(r);
      loaded(r);
    });
    return () => { live = false; };
  }, [open]);
  return region;
}

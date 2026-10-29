import { useEffect, useRef, useState } from 'react';
import { AKI_CAN_CHAT } from '../../services/akiClient.js';

// What the Worker allows right now (the connection, a cooldown, quick answers only) and the robot's mood after a
// result. apply() takes a chatOutcome().
export function useServiceStatus() {
  const [connection, setConnection] = useState('ok');
  const [cooldown, setCooldown] = useState(null);
  const [quickOnly, setQuickOnly] = useState(!AKI_CAN_CHAT);
  const [quotaUntil, setQuotaUntil] = useState(null);
  const [mood, setMood] = useState(null);
  const regionDown = useRef(false);

  // The daily quota resets at resetsAt: bring free-text chat back without a reload.
  useEffect(() => {
    if (!quotaUntil) return undefined;
    const t = setTimeout(() => {
      setQuotaUntil(null);
      setQuickOnly(!AKI_CAN_CHAT);
      setConnection('ok');
    }, Math.max(0, quotaUntil - Date.now()));
    return () => clearTimeout(t);
  }, [quotaUntil]);

  useEffect(() => {
    if (!cooldown || cooldown.seconds <= 0) return undefined;
    const t = setTimeout(() => {
      if (cooldown.seconds > 1) {
        setCooldown({ ...cooldown, seconds: cooldown.seconds - 1 });
      } else {
        setCooldown(null);
        setConnection((c) => (c === 'busy' ? 'ok' : c));
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!mood) return undefined;
    const t = setTimeout(() => setMood(null), mood.ms);
    return () => clearTimeout(t);
  }, [mood]);

  // A visitor's own spam cooldown is not "busy"; only a real provider/site limit is.
  let health = 'ok';
  if (connection === 'down') health = 'down';
  else if (connection === 'busy' || cooldown?.siteWide) health = 'busy';

  function apply(outcome) {
    if (outcome.connection) setConnection(outcome.connection);
    if (outcome.cooldown) setCooldown(outcome.cooldown);
    if (outcome.quickOnly) setQuickOnly(true);
    if (outcome.quotaUntil) setQuotaUntil(outcome.quotaUntil);
    if (outcome.mood) setMood(outcome.mood);
  }

  // A region answer without a consent version means the Worker is out of reach. The first good answer after one sets
  // the connection back to ok, over any state a chat result set in between; later good answers leave it alone.
  function regionLoaded(region) {
    const wasDown = regionDown.current;
    regionDown.current = !region.consentVersion;
    if (!region.consentVersion) setConnection('down');
    else if (wasDown) setConnection('ok');
  }

  return {
    connection, cooldown, quickOnly, mood, health, apply, regionLoaded,
    quickAnswersOnly: () => setQuickOnly(true),
    resetQuickOnly: () => setQuickOnly(!AKI_CAN_CHAT),
    clearCooldown: () => setCooldown(null),
  };
}

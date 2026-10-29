import { useEffect, useRef, useState } from 'react';
import { clearGate, readGate, startSession } from '../../services/akiClient.js';

// The welcome or the chat step, and the bot check Continue runs between them. The welcome comes back two ways:
// showWelcome() keeps the choices a settings visit filled in, requireConsent() starts over.
export function useConsent({ turnstileRef }) {
  const [step, setStep] = useState(() => (readGate() ? 'chat' : 'welcome'));
  const [prefill, setPrefill] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const check = useRef(null);

  useEffect(() => () => check.current?.abort(), []);

  // Resolves false when the check was cancelled.
  async function verify() {
    const ctrl = new AbortController();
    check.current = ctrl;
    setVerifying(true);
    await startSession(turnstileRef.current, ctrl.signal);
    if (check.current !== ctrl) return false;
    check.current = null;
    setVerifying(false);
    return true;
  }

  // Closing during the bot check leaves consent unfinished: the welcome shows again next time.
  function cancelCheck() {
    if (!check.current) return;
    check.current.abort();
    check.current = null;
    clearGate();
    setVerifying(false);
  }

  function editSettings() {
    setPrefill(readGate());
    clearGate();
    setStep('welcome');
  }

  function requireConsent() {
    setPrefill(null);
    setStep('welcome');
  }

  return {
    step, prefill, verifying, verify, cancelCheck, editSettings, requireConsent,
    enterChat: () => setStep('chat'),
    showWelcome: () => setStep('welcome'),
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';
import { startSession, transcribe } from '../../services/akiClient.js';
import { listen, VOICE_MODE } from '../../services/akiVoice.js';
import { toVoiceResult } from './outcomes.js';

// One voice turn at a time. finish() ends it and sends what was heard; cancel() ends it and sends nothing.
export function useVoiceInput({ turnstileRef, micRef, discardRef, say, onText, onSpoken, onError }) {
  const [listening, setListening] = useState(false);
  const turn = useRef(null);
  const noticed = useRef(false);
  const latestHandlers = useRef({ onText, onSpoken, onError });

  // Voice callbacks fire long after the tap; they must reach the latest handlers, not the ones from the tap's render.
  useEffect(() => { latestHandlers.current = { onText, onSpoken, onError }; });

  useEffect(() => () => turn.current?.abort(), []);

  // Stable, so the Wave's drawing loop runs for the whole turn.
  const level = useCallback(() => turn.current?.level() ?? 0, []);

  function start(prefix) {
    // Where the audio goes: said once per page load, as listening starts.
    if (!noticed.current) {
      noticed.current = true;
      say(VOICE_MODE === 'record' ? MSG.voiceNoticeServer : MSG.voiceNotice);
    }
    // Words already typed stay in front of what is said.
    const join = (words) => (prefix && words ? `${prefix} ${words}` : prefix || words);
    setListening(true);
    if (VOICE_MODE === 'record') startSession(turnstileRef.current);
    // Safari never focuses a tapped button; without this the reply would hand focus to the box (phone keyboard).
    micRef.current?.focus();
    turn.current = listen({
      // Record mode only: the recording goes to the Worker on the same session as chat.
      transcribe: (blob, signal) => transcribe({ blob, container: turnstileRef.current, signal }).then(toVoiceResult),
      onText: (words) => latestHandlers.current.onText(join(words)),
      onDone: (words) => {
        ended();
        if (words) latestHandlers.current.onSpoken(join(words));
      },
      onError: (code) => {
        ended();
        // The mic stays: a failure may be passing (network), and the code helps tell which browser refuses.
        console.warn('Aki voice:', code);
        latestHandlers.current.onError(code);
      },
    });
  }

  function finish() {
    turn.current?.stop();
  }

  function cancel() {
    turn.current?.abort();
    ended();
  }

  // However a turn ends, the trash button goes with it: focus on it moves to the mic, which stays.
  function ended() {
    turn.current = null;
    if (discardRef.current && document.activeElement === discardRef.current) micRef.current?.focus();
    setListening(false);
  }

  return { listening, start, finish, cancel, level };
}

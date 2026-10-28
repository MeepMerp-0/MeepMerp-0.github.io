// Aki voice input: the browser's own speech recognition, plus a guess at whether the visitor has finished speaking.
const Recognition = typeof window === 'undefined' ? undefined : window.SpeechRecognition || window.webkitSpeechRecognition;

export const VOICE_SUPPORTED = Boolean(Recognition);

// How long a silence ends the turn, by how the words so far end.
export const END_MS = { done: 900, plain: 1400, pausing: 2500 };

// ponytail: English fillers and joining words only; other languages fall back to punctuation and the plain wait.
// Upgrade path if it misfires: a semantic end-of-turn check.
const PAUSING = /(?:^|\s)(?:u+m+|u+h+|e+r+m*|h+m+|a+h+|and|but|or|so|because|cause|like|the|a|an|to|of|with|for|about|in|on|at|from|my|his|your|is|are|was|if|then|than|that|which|who|what|when|where|how|i|i'm|you know|i mean)$/i;

export function endDelay(text) {
  const t = text.trim();
  // CJK and Arabic commas count too, like their sentence ends below.
  if (/(?:[,\uFF0C\u3001\u060C]|\.\.\.|\u2026|[-\u2013\u2014])$/.test(t)) return END_MS.pausing;
  if (/[.?!\u3002\uFF1F\uFF01\u061F]$/.test(t)) return END_MS.done;
  return PAUSING.test(t) ? END_MS.pausing : END_MS.plain;
}

// One voice turn. onText gets the words so far; a long enough silence, stop() or the browser ending the session
// calls onDone with the final words (possibly empty). abort() ends it with no further callback.
export function listen({ onText, onDone, onError }) {
  const rec = new Recognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = navigator.language;
  let text = '';
  let timer;
  let ending = false;
  let failed = null;
  let cancelled = false;
  const stop = () => { ending = true; clearTimeout(timer); rec.stop(); };
  rec.onresult = (e) => {
    if (cancelled) return;
    // Chrome starts later results with a space, Safari does not.
    text = Array.from(e.results, (r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim();
    onText(text);
    // Results that arrive after stop() update the words but never restart the wait; onText may have aborted.
    if (ending || cancelled) return;
    clearTimeout(timer);
    timer = setTimeout(stop, endDelay(text));
  };
  rec.onerror = (e) => { failed = e.error; };
  rec.onend = () => {
    clearTimeout(timer);
    if (cancelled) return;
    // No speech at all is a quiet end, not a failure.
    if (failed && failed !== 'no-speech' && failed !== 'aborted') onError(failed);
    else onDone(text);
  };
  try {
    rec.start();
  } catch {
    queueMicrotask(() => { if (!cancelled) onError('start'); });
  }
  return { stop, abort: () => { cancelled = true; clearTimeout(timer); rec.abort(); } };
}

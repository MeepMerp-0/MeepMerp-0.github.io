// How long a silence ends the turn, by how the words so far end.
export const END_MS = { done: 900, plain: 1400, pausing: 2500 };

// ponytail: English fillers and joining words only; other languages fall back to punctuation and the plain wait.
// Upgrade path if it misfires: a semantic end-of-turn check.
const PAUSING = /(?:^|\s)(?:u+m+|u+h+|e+r+m*|h+m+|a+h+|and|but|or|so|because|cause|like|the|a|an|to|of|with|for|about|in|on|at|from|my|his|your|is|are|was|if|then|than|that|which|who|what|when|where|how|i|i'm|you know|i mean)$/i;

export function endDelay(text) {
  const t = text.trim();
  // CJK and Arabic commas count too, like their sentence ends below.
  if (/(?:[,\uFF0C\u3001\u060C]|\.\.\.|\u2026|[-\u2013\u2014])$/.test(t)) return END_MS.pausing;
  // Whisper ends nearly every phrase with a full stop: "projects and." is still mid-thought, "what is it about?" is not.
  if (PAUSING.test(t.replace(/[.\u3002]+$/, ''))) return END_MS.pausing;
  return /[.?!\u3002\uFF1F\uFF01\u061F]$/.test(t) ? END_MS.done : END_MS.plain;
}

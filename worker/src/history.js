// Signed history. The browser keeps the conversation; each reply is signed over the conversation id (mid),
// the signature before it, its time, the question and the reply, so only replies this Worker gave reach a model.

import { DAY } from './time.js';
import { SIG_RE, hmac, hmacOk } from './hmac.js';

// The browser mirrors these limits: src/services/aki/chat/history.js under the same names, and MAX_MESSAGE as
// MAX_CHARS in src/components/aki/Composer.jsx. Change both sides together.
export const MAX_MESSAGE = 500;
const MAX_HISTORY_ENTRIES = 6;
const MAX_HISTORY_CP = 3000;
const CLIP_CP = 1500;
export const REPLY_MAX_AGE_MS = DAY;

export const cpLength = (s) => [...s].length;
const clip = (s) => [...s].slice(0, CLIP_CP).join('');

const replyText = (mid, prevSig, ts, userContent, replyContent) =>
  `aki-reply-v2\n${JSON.stringify([mid, prevSig, ts, userContent, clip(replyContent)])}`;

export const signReply = (secret, mid, prevSig, ts, userContent, replyContent) =>
  hmac(secret, replyText(mid, prevSig, ts, userContent, replyContent));

export const signatureOk = (secret, sig, mid, prevSig, ts, userContent, replyContent) =>
  hmacOk(secret, replyText(mid, prevSig, ts, userContent, replyContent), sig);

/**
 * → {history, chainPrev}. A reply that fails its check is dropped with every pair before it, and one older than
 * REPLY_MAX_AGE_MS is left out; both still link the chain. The next reply is signed over chainPrev.
 */
export async function verifyChain(secret, mid, prevSig, history, now) {
  let p = prevSig;
  let pairs = [];
  for (let i = 0; i < history.length; i++) {
    const e = history[i];
    if (e.role === 'user' || typeof e.sig !== 'string' || !SIG_RE.test(e.sig)) continue;
    const q = history[i - 1];
    const ok = i > 0 && q.role === 'user' && Number.isSafeInteger(e.ts)
      && await signatureOk(secret, e.sig, mid, p, e.ts, q.content, e.content);
    if (!ok) {
      pairs = [];
      p = e.sig;
      continue;
    }
    p = e.sig;
    if (now - e.ts > REPLY_MAX_AGE_MS) continue;
    pairs.push([{ role: 'user', content: q.content }, { role: 'assistant', content: clip(e.content), sig: e.sig, ts: e.ts }]);
  }
  return { history: pairs.flat(), chainPrev: p };
}

/** Drops the oldest (user, assistant) pairs until the total is ≤ 3,000 code points. Input alternates user, assistant. */
export function capHistory(history) {
  const len = (e) => (e ? cpLength(e.content) : 0);
  let total = history.reduce((n, e) => n + len(e), 0);
  let i = 0;
  while (total > MAX_HISTORY_CP && i < history.length) {
    total -= len(history[i]) + len(history[i + 1]);
    i += 2;
  }
  return history.slice(i);
}

export function validHistory(history) {
  if (!Array.isArray(history) || history.length > MAX_HISTORY_ENTRIES) return false;
  return history.every((e) => {
    if (!e || typeof e !== 'object' || typeof e.content !== 'string') return false;
    if (e.role === 'user') return cpLength(e.content) <= MAX_MESSAGE;
    return e.role === 'assistant' && (e.sig === undefined || typeof e.sig === 'string') && (e.ts === undefined || typeof e.ts === 'number');
  });
}

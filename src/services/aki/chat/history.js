// A conversation as it is stored, { mid, messages } in user/assistant pairs, and the window each turn sends from it.
const DAY_MS = 24 * 3600 * 1000;
export const KEEP_MS = 7 * DAY_MS;

// The Worker's limits on the history a turn carries. Each mirrors the constant of the same name in
// worker/src/history.js.
export const MAX_HISTORY_ENTRIES = 6;
export const CLIP_CP = 1500;
export const MAX_HISTORY_CP = 3000;
export const REPLY_MAX_AGE_MS = DAY_MS;

export const codePoints = (s) => [...s].length;
const clip = (s, n) => [...s].slice(0, n).join('');

export function parseHistory(raw) {
  try {
    const h = JSON.parse(raw);
    if (!h || typeof h.mid !== 'string' || !Array.isArray(h.messages)) return null;
    const messages = h.messages.filter((m) => m && typeof m.content === 'string' && Number.isFinite(m.ts)
      && (m.role === 'user' || (m.role === 'assistant' && typeof m.sig === 'string' && typeof m.prev === 'string')));
    return { mid: h.mid, messages };
  } catch { return null; }
}

// Drops whole user/assistant pairs older than 7 days.
export function prune(h, now = Date.now()) {
  const messages = [];
  for (let i = 0; i < h.messages.length; i += 2) {
    const pair = h.messages.slice(i, i + 2);
    if (pair.every((m) => now - m.ts <= KEEP_MS)) messages.push(...pair);
  }
  return { ...h, messages };
}

// The history a turn sends (Q3, R4-21, R4-22): only ever cut from the front.
export function buildWindow(msgs, now = Date.now()) {
  let start = Math.max(0, msgs.length - MAX_HISTORY_ENTRIES);
  msgs.forEach((m, i) => {
    if (m.role !== 'assistant') return;
    if (now - m.ts > REPLY_MAX_AGE_MS) start = Math.max(start, i + 1);
    const before = msgs[i - 2];
    if (before && m.prev !== before.sig) start = Math.max(start, i - 1);
  });
  let w = msgs.slice(start).map((m) => (m.role === 'assistant' ? { ...m, content: clip(m.content, CLIP_CP) } : m));
  const total = () => w.reduce((n, m) => n + codePoints(m.content), 0);
  while (w.length && (w[0].role !== 'user' || total() > MAX_HISTORY_CP)) w = w.slice(w[0].role === 'user' ? 2 : 1);
  const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
  const firstAssistant = w.find((m) => m.role === 'assistant');
  return {
    prevSig: firstAssistant ? firstAssistant.prev : (lastAssistant?.sig ?? ''),
    history: w.map((m) => (m.role === 'assistant'
      ? { role: 'assistant', content: m.content, sig: m.sig, ts: m.ts }
      : { role: 'user', content: m.content })),
  };
}

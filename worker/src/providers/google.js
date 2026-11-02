/**
 * Aki's only Google fetch (plan A2, B3, addendum §1.2). routes/chatTurn.js owns the routing: Gemini first for gated,
 * eligible sessions, then a hop to Groq on any non-success except a block. Gemma, on the same key, is the last resort
 * after Groq and Workers AI.
 *
 *   gemini(history, message), gemma(history, message) → {ok:true, content} | {ok:false, status, retryAfter, blocked?}
 *     Both send the history through filterHistory first, so Google never gets a pair that holds contact data.
 *     status 0 = timeout (12 s) or network error; 401 also stands for a 400 API_KEY_INVALID/EXPIRED (R5-24 latch).
 *     retryAfter (429 only, else null): the Retry-After header, else error.details[].retryDelay in seconds; for a
 *     per-day quotaId, the seconds until the next Pacific midnight. limiter.js caps it at 24 h.
 *     blocked: promptFeedback.blockReason or a safety finishReason. Never sent on to Groq (policy evasion).
 *   filterHistory(history) → history without any (user, assistant) pair that holds contact data (V13, R5-14).
 */

import { nextPacificMidnight } from '../time.js';
import { GEMINI_SYSTEM_PROMPT, matchesContactPattern } from '../knowledge.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
const GOOGLE_TIMEOUT_MS = 12_000;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// ponytail: regex heuristic; over-drops (e.g. "2019-2023") and misses numbers written in words. See plan B3 step 6.
// Any script's digits, and slash or Unicode dashes as separators.
const PHONE_RE = /\+?\p{Nd}(?:[\s()./‐-―-]*\p{Nd}){6,}/u;
// A dead or revoked key gets 400 from Google, not 401/403.
const KEY_FAULTS = ['API_KEY_INVALID', 'API_KEY_EXPIRED'];
const BLOCKED_FINISH = ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'];

const hasContact = (text) => {
  const t = text.normalize('NFKC');
  return matchesContactPattern(t) || EMAIL_RE.test(t) || PHONE_RE.test(t);
};

export function filterHistory(history) {
  const out = [];
  for (let i = 0; i + 1 < history.length; i += 2) {
    const [q, a] = [history[i], history[i + 1]];
    if (!hasContact(q.content) && !hasContact(a.content)) out.push(q, a);
  }
  return out;
}

/** Seconds to pause Gemini after a 429 (§1.2). A per-day quota runs to the Pacific day reset. */
function retryAfterOf(res, details, now) {
  const quotas = details.flatMap((d) => [d, ...(Array.isArray(d?.violations) ? d.violations : [])]);
  if (quotas.some((q) => typeof q?.quotaId === 'string' && q.quotaId.includes('PerDay'))) {
    return Math.ceil((nextPacificMidnight(now) - now) / 1000);
  }
  const header = res.headers.get('retry-after');
  if (header !== null) return header;
  const delay = details.map((d) => d?.retryDelay).find((d) => typeof d === 'string' && /^\d+(\.\d+)?s$/.test(d));
  return delay ? Number(delay.slice(0, -1)) : null;
}

export class Google {
  #config;
  #deps;

  constructor(config, deps) {
    this.#config = config;
    this.#deps = deps;
  }

  gemini(history, message) {
    return this.#generate(this.#config.gemini.model, filterHistory(history), message);
  }

  gemma(history, message) {
    return this.#generate(this.#config.gemini.gemmaModel, filterHistory(history), message);
  }

  // Gemma takes no system instruction, so Aki's instructions go in front of the first user turn instead.
  async #generate(model, history, message) {
    const gemma = model.startsWith('gemma');
    const turns = [...history.map(({ role, content }) => ({ role: role === 'assistant' ? 'model' : 'user', parts: [{ text: content }] })),
      { role: 'user', parts: [{ text: message }] }];
    if (gemma) turns[0] = { ...turns[0], parts: [{ text: `${GEMINI_SYSTEM_PROMPT}\n\n${turns[0].parts[0].text}` }] };
    const fail = (status, retryAfter = null) => ({ ok: false, status, retryAfter });
    try {
      const res = await this.#deps.fetch(`${GEMINI_BASE}${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: new Headers({ 'x-goog-api-key': this.#config.gemini.apiKey, 'content-type': 'application/json' }),
        body: JSON.stringify({
          ...(!gemma && { systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] } }),
          contents: turns,
          generationConfig: { maxOutputTokens: this.#config.maxTokens },
        }),
        signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
      });
      if (res.status !== 200) {
        const raw = (await res.json().catch(() => null))?.error?.details;
        const details = Array.isArray(raw) ? raw : [];
        // Reported as 401 so the limiter trips the R5-24 latch; other 400s may come from visitor input and do not latch.
        if (res.status === 400 && details.some((d) => KEY_FAULTS.includes(d?.reason))) return fail(401);
        return res.status === 429 ? fail(429, retryAfterOf(res, details, this.#deps.now())) : fail(res.status);
      }
      const data = await res.json();
      const cand = data?.candidates?.[0];
      if (data?.promptFeedback?.blockReason || BLOCKED_FINISH.includes(cand?.finishReason)) return { ...fail(200), blocked: true };
      const parts = Array.isArray(cand?.content?.parts) ? cand.content.parts : [];
      const content = parts.filter((p) => typeof p?.text === 'string' && !p.thought).map((p) => p.text).join('');
      return content.trim() && cand.finishReason === 'STOP' ? { ok: true, content } : fail(200);
    } catch {
      return fail(0);
    }
  }
}

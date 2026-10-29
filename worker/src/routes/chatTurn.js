/**
 * One validated /v1/chat turn (§1.1, §1.2): Gemini first for gated, eligible sessions, then Groq. When Groq has no
 * capacity or fails, Workers AI and then Gemma are the backups. Each step is reserved in the limiter before its call,
 * and the turn and the visitor lease are always closed, also after a Cancel or disconnect (§1.6).
 *   new ChatTurn(req, ctx).run() → Promise<Response>, where ctx comes from prepareChat in chat.js.
 */

import { clientClosed } from '../http.js';
import { signReply } from '../history.js';
import { GROQ_SYSTEM_PROMPT } from '../knowledge.js';
import { Groq } from '../providers/groq.js';
import { WorkersAI } from '../providers/workersAI.js';
import { Google } from '../providers/google.js';

function withTurn(body, turnId) {
  return body.type === 'provider_unavailable' ? { ...body, turnId } : body;
}

// Groq route results that mean "no Groq capacity right now" rather than a visitor limit or a closed day.
const noGroqCapacity = (r) => (r.type === 'provider_unavailable' && ['groq_busy', 'groq_failed', 'groq_daily'].includes(r.reason))
  || (r.type === 'rate_limited' && (r.scope === 'site_minute' || r.scope === 'queue_full'))
  || (r.type === 'quota_exhausted' && r.scope === 'groq_daily');

export class ChatTurn {
  #config;
  #deps;
  #respond;
  #ctx;
  #key;
  #messages;
  #useGemma;
  #groq;
  #workersAI;
  #google;

  constructor({ config, deps, respond }, ctx) {
    this.#config = config;
    this.#deps = deps;
    this.#respond = respond;
    this.#ctx = ctx;
    this.#key = { ipKey: ctx.ipKey, sid: ctx.sid, turnId: ctx.turnId };
    this.#messages = [
      { role: 'system', content: GROQ_SYSTEM_PROMPT },
      ...ctx.history.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: ctx.message },
    ];
    this.#useGemma = Boolean(config.gemini.gemmaModel) && ctx.gemini;
    this.#groq = new Groq(config, deps);
    this.#workersAI = new WorkersAI(config, deps);
    this.#google = new Google(config, deps);
  }

  async run() {
    // A Cancel or disconnect before any step that can reach a provider makes no call (§1.6).
    if (this.#aborted) return clientClosed();
    let r = await this.#deps.limiter.reserve({ ...this.#key, cfg: this.#config.limits, gemini: this.#ctx.gemini });
    if (r.type === 'go' && r.provider === 'gemini') {
      const { g, hop } = await this.#askGemini();
      if (g.ok) return this.#reply('gemini', g.content);
      // Blocked content is never sent on to Groq (§1.2: that would be policy evasion).
      if (g.blocked) return this.#refuse({ type: 'provider_unavailable', reason: 'content_blocked' });
      if (!hop) return clientClosed();
      console.log(JSON.stringify({ gemini_failed: g.status }));
      r = hop;
    }
    r = await this.#waitForSlot(r);
    if (!r) return clientClosed();
    if (r.type !== 'go') return this.#backupOr(r);
    // Aborted during reserve, fallback or claim with no wait left: cancel refunds the unused Groq slot.
    if (this.#aborted) {
      this.#cancel();
      return clientClosed();
    }
    return this.#viaGroq();
  }

  // → {g, hop}: Gemini's result, plus limiter.fallback's result when the turn moves on to Groq.
  // One waitUntil unit, so the lease release, the R5-24 latch and the 429 pause survive a visitor disconnect.
  // A failed end() is retried once and never costs the visitor the reply.
  #askGemini() {
    const work = (async () => {
      // Aborted during reserve: no Google call; the Gemini day count stays spent (never under-counts).
      const g = this.#aborted
        ? { ok: false, status: 0, retryAfter: null }
        : await this.#google.gemini(this.#ctx.history, this.#ctx.message);
      const status = { googleStatus: g.ok || g.blocked ? 200 : g.status, retryAfter: g.retryAfter };
      // §1.6: a Cancel or disconnect before or during the Gemini call ends the turn with no fallback and no Groq call.
      if (g.ok || g.blocked || this.#aborted) {
        const endTurn = async () => this.#deps.limiter.end({ ...this.#key, ...status });
        await endTurn().catch(endTurn).catch(() => {});
        return { g };
      }
      return { g, hop: await this.#deps.limiter.fallback({ ...this.#key, cfg: this.#config.limits, ...status }) };
    })();
    this.#deps.waitUntil(work.catch(() => {}));
    return work;
  }

  // → r itself when there is no wait; else sleeps until the Groq slot is due and returns the last claim's result, or
  // null when the visitor left during the wait (the slot is cancelled).
  async #waitForSlot(r) {
    while (r.type === 'go' && r.waitMs > 0) {
      let failed = false;
      try {
        await this.#deps.sleep(r.waitMs, this.#deps.signal);
      } catch {
        failed = true;
      }
      if (failed || this.#aborted) {
        this.#cancel();
        return null;
      }
      r = await this.#deps.limiter.claim({ ...this.#key, cfg: this.#config.limits });
    }
    return r;
  }

  async #viaGroq() {
    const groq = await this.#groq.chat(this.#messages);
    if (groq.ok) {
      this.#deps.waitUntil(Promise.resolve(this.#deps.limiter.end(this.#key)).catch(() => {}));
      return this.#reply('groq', groq.content);
    }
    // There is never a Groq → Gemini hop (§1.2). A Groq 429 pauses Groq in end(), which also closes the turn
    // before the Workers AI backup may take it.
    const closeReq = { ...this.#key, groqStatus: groq.status, retryAfter: groq.retryAfter };
    const ended = Promise.resolve().then(() => this.#deps.limiter.end(closeReq)).then(() => true, () => false);
    this.#deps.waitUntil(ended);
    const closed = await ended;
    // A failed close is retried inside #backupOr, so the backups are not refused for an open turn.
    return this.#backupOr({ type: 'provider_unavailable', reason: 'groq_failed' }, { closed, closeReq });
  }

  // After Groq, when it has no capacity or fails: Workers AI, then Google's Gemma as the last resort (only for
  // sessions that allowed Gemini), each once per turn, before the client's quick answers. Only for sessions agreed
  // under a notice that names both.
  async #backupOr(refusal, { closed = false, closeReq = this.#key } = {}) {
    if (!(this.#config.backup.on || this.#useGemma) || !this.#ctx.backups || this.#aborted || !noGroqCapacity(refusal)) {
      return this.#refuse(refusal);
    }
    // A claim can report groq_failed for a lapsed IN_FLIGHT turn: close it first.
    // A retry after a failed close sends the same payload, so a Groq 429 pause is still recorded.
    if (refusal.reason === 'groq_failed' && !closed) {
      await Promise.resolve().then(() => this.#deps.limiter.end(closeReq)).catch(() => {});
    }
    if (this.#config.backup.on && (await this.#backupStep({ provider: 'workers_ai' }))?.type === 'go') {
      const response = await this.#viaWorkersAI();
      if (response) return response;
    }
    if (!this.#useGemma || this.#aborted) return this.#refuse(refusal);
    if ((await this.#backupStep({ provider: 'gemma', gemini: true }))?.type !== 'go') return this.#refuse(refusal);
    return this.#viaGemma(refusal);
  }

  #backupStep(req) {
    return Promise.resolve()
      .then(() => this.#deps.limiter.backup({ ...this.#key, cfg: this.#config.limits, ...req }))
      .catch(() => null);
  }

  // → the reply or a 499, or null when Workers AI failed and Gemma may still answer.
  async #viaWorkersAI() {
    // The step holds the visitor lease; release it once Workers AI is done (before any Gemma step reserves).
    const release = () => {
      const p = Promise.resolve().then(() => this.#deps.limiter.end(this.#key)).catch(() => {});
      this.#deps.waitUntil(p);
      return p;
    };
    // Disconnected while the step was reserved: send nothing to Workers AI (§1.6).
    if (this.#aborted) {
      release();
      return clientClosed();
    }
    const w = await this.#workersAI.chat(this.#messages);
    await release();
    if (w.ok) return this.#reply('workers_ai', w.content);
    console.log(JSON.stringify({ workers_ai_failed: true }));
    return null;
  }

  async #viaGemma(refusal) {
    const endOnce = (status) => Promise.resolve().then(() => this.#deps.limiter.end({ ...this.#key, ...status }));
    const endTurn = (status) => endOnce(status).catch(() => endOnce(status)).catch(() => {});
    // Disconnected while the step was reserved: close it and send nothing to Google (§1.6).
    if (this.#aborted) {
      this.#deps.waitUntil(endTurn({}));
      return clientClosed();
    }
    // One waitUntil unit, like the Gemini path, so the 429 pause or key latch survives a disconnect.
    const work = (async () => {
      const g = await this.#google.gemma(this.#ctx.history, this.#ctx.message);
      await endTurn({ googleStatus: g.ok || g.blocked ? 200 : g.status, retryAfter: g.retryAfter });
      return g;
    })();
    this.#deps.waitUntil(work.catch(() => {}));
    const g = await work;
    if (g.ok) return this.#reply('gemma', g.content);
    if (g.blocked) return this.#refuse({ type: 'provider_unavailable', reason: 'content_blocked' });
    console.log(JSON.stringify({ gemma_failed: g.status }));
    return this.#refuse(refusal);
  }

  async #reply(provider, content) {
    const { turnId, mid, message, chainPrev } = this.#ctx;
    const ts = this.#deps.now();
    const sig = await signReply(this.#config.sessionSecret, mid, chainPrev, ts, message, content);
    return this.#respond({ type: 'ai', turnId, provider, reply: content, sig, ts, prevSig: chainPrev });
  }

  #refuse(body) {
    return this.#respond(withTurn(body, this.#ctx.turnId));
  }

  #cancel() {
    this.#deps.waitUntil(Promise.resolve(this.#deps.limiter.cancel(this.#key)).catch(() => {}));
  }

  get #aborted() {
    return this.#deps.signal?.aborted;
  }
}

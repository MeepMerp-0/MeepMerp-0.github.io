// The tab's Worker session: a stored one is reused while it is fresh, otherwise one is minted behind the bot check.
import { AKI_CONSENT_VERSION } from '../../../data/akiFaq.js';
import { interpret } from './interpret.js';
import { applyRule, clearGate, dropSession, readGate, readSession, writeSession } from './memory.js';
import { post } from './transport.js';
import { turnstileToken } from './turnstile.js';

// A stored session is reused only while it has more than this left.
const FRESH_MS = 30000;
const GATE_MAX_AGE_MS = 24 * 3600 * 1000;

export class SessionManager {
  // Shared while in flight: a voice upload and a chat turn may both need a session, and two Turnstile runs in one
  // container would race. A cancelled one is never joined: the caller after a cancel starts its own.
  // ponytail: a joiner shares the first caller's cancel; give the mint its own signal and a waiter count if two callers
  // ever overlap for real (today each cancels the last before it starts).
  #minting = null;

  // Resolves { ok: true, token } or { ok: false, kind }.
  start(container, signal) {
    return this.#ensure(container, signal);
  }

  // One request that needs a session: a 401 re-runs the session once and calls again.
  async request(container, signal, call) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const session = await this.#ensure(container, signal, attempt > 0);
      if (!session.ok) return { kind: session.kind };
      applyRule();
      const result = interpret(await call(session.token));
      if (result.kind !== 'session_required') return result;
      // The notice changed since the visitor confirmed: show the welcome again.
      if (result.reason === 'consent') { clearGate(); return { kind: 'consent' }; }
    }
    return { kind: 'unavailable' };
  }

  // Any response other than 200 "session" means the rule is unknown.
  async #ensure(container, signal, force) {
    if (!force) {
      try {
        const s = readSession();
        if (s?.sessionToken && Date.parse(s.expiresAt) > Date.now() + FRESH_MS) {
          return { ok: true, token: s.sessionToken };
        }
      } catch { /* Date.parse throws on a stored expiresAt that cannot become a string: fetch a new one */ }
    }
    if (this.#minting && !this.#minting.signal?.aborted) return this.#minting.load;
    const m = { signal };
    m.load = this.#mint(container, signal).finally(() => { if (this.#minting === m) this.#minting = null; });
    this.#minting = m;
    return m.load;
  }

  async #mint(container, signal) {
    dropSession();
    // A gate older than a day cannot mint sessions: the visitor must confirm again.
    const gate = readGate();
    if (!gate || Date.now() - gate.confirmedAt > GATE_MAX_AGE_MS) {
      clearGate();
      return { ok: false, kind: 'consent' };
    }
    let token;
    try { token = await turnstileToken(container, signal); } catch { return { ok: false, kind: 'network' }; }
    const { status, body } = await post('/v1/session', {
      turnstileToken: token, ackTerms: true, geminiAck: gate.gemini, consentVersion: AKI_CONSENT_VERSION,
    }, signal);
    if (status === 200 && body?.type === 'session' && typeof body.sessionToken === 'string') {
      writeSession({
        sessionToken: body.sessionToken, expiresAt: body.expiresAt, memory: body.memory, gemini: body.gemini === 'on',
      });
      return { ok: true, token: body.sessionToken };
    }
    if (status === 0) return { ok: false, kind: 'network' };
    if (body?.type === 'invalid_request') {
      return { ok: false, kind: body.error === 'bad_consent' ? 'updated' : 'network' };
    }
    return { ok: false, kind: 'unavailable' };
  }
}

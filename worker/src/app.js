/**
 * Aki API handlers (plan B1-B4, addendum D19-D21). Pure and injectable: no globals except Web Crypto, URL, Headers
 * and Response.
 *
 *   handle(request, env, deps) → Promise<Response>
 *     routes  POST /v1/session, /v1/chat, /v1/region (everything else 404)
 *     deps = {limiter, fetch, sleep(ms, signal), signal, waitUntil(promise), country, ip, now()}
 *       limiter  object with reserve/claim/cancel/end/fallback/consent (see limiter.js); methods may be async (DO stub)
 *       country  request.cf?.country as is; ip  the cf-connecting-ip header value or null; now  Worker clock (ms)
 *   A route handler gets `req` and returns a Response:
 *     req = {config, deps, origin, body, respond(body) → Response, path}
 *   handle() has already done, in this order: 404/405, body cap (413), readConfig (misconfigured), origin (403), JSON parse.
 *
 * The 18+ gate (addendum §2): /v1/session mints a token only for {ack18:true, geminiAck:boolean,
 * consentVersion === CONSENT_VERSION}, signed over {sid, exp, cv, g}; g = geminiAck && the country is eligible.
 * Every /v1/chat re-checks cv (401 session_required{reason:"consent"}), g and this request's country.
 *
 * Exports:
 *   readConfig(env) → {ok:false} | {ok:true, ..., consentVersion, limits (the cfg object for limiter.js),
 *                      gemini: {on, dailyCap, countries, model, apiKey}}. `gemini.on` is false unless
 *                      GEMINI_ENABLED === "true" and every Gemini var is valid (plan B1 "off vs ineligible").
 *   geminiSwitch(config, country) → 'off' | 'ineligible' | 'eligible'  (pure; latch and caps are checked in the DO)
 *   prepareChat(req) → {response} | {ctx}. /v1/chat shape, message and history validation, session and consent
 *       version, cap=0, cf-connecting-ip. ctx = {sid, turnId, mid, prevSig, message (trimmed), history (verified,
 *       clipped and capped, user/assistant pairs), chainPrev, ipKey, country, gemini (boolean: §1.1 checks 1-4)}.
 *   verifyChain(secret, mid, prevSig, history, now) → {history, chainPrev}
 *   capHistory(history), clip(text), cpLength(text),
 *   signReply(secret, mid, prevSig, ts, userContent, replyContent), signatureOk(...),
 *   withTurn(body, turnId) (adds turnId to provider_unavailable).
 */

import { EEA_UK_CH, AI_BLOCKED, REPLY_MAX_AGE_MS, ipPrefix } from './limiter.js';
import { GROQ_SYSTEM_PROMPT } from './knowledge.js';
import { callGemini, filterHistory } from './gemini.js';

const MAX_BODY = 32 * 1024;
const MAX_MESSAGE = 500;
const MAX_HISTORY_ENTRIES = 6;
const MAX_HISTORY_CP = 3000;
const CLIP_CP = 1500;
const SESSION_TTL_MS = 24 * 3_600_000;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIG_RE = /^[A-Za-z0-9_-]{43}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

// --- crypto ---

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hmacKey = (secret) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

async function hmac(secret, text) {
  return b64u(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text)));
}

async function hmacOk(secret, text, sig) {
  try {
    return await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(text));
  } catch {
    return false;
  }
}

export const cpLength = (s) => [...s].length;
export const clip = (s) => [...s].slice(0, CLIP_CP).join('');

const replyText = (mid, prevSig, ts, userContent, replyContent) =>
  `aki-reply-v2\n${JSON.stringify([mid, prevSig, ts, userContent, clip(replyContent)])}`;

export const signReply = (secret, mid, prevSig, ts, userContent, replyContent) =>
  hmac(secret, replyText(mid, prevSig, ts, userContent, replyContent));

export const signatureOk = (secret, sig, mid, prevSig, ts, userContent, replyContent) =>
  hmacOk(secret, replyText(mid, prevSig, ts, userContent, replyContent), sig);

const signSession = async (secret, claims) => {
  const payload = b64u(enc.encode(JSON.stringify(claims)));
  return `${payload}.${await hmac(secret, `aki-session\n${payload}`)}`;
};

async function verifySession(secret, token, now) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !SIG_RE.test(parts[1])) return null;
  if (!(await hmacOk(secret, `aki-session\n${parts[0]}`, parts[1]))) return null;
  try {
    const { sid, exp, cv, g } = JSON.parse(new TextDecoder().decode(unb64u(parts[0])));
    // Tokens minted before the 18+ gate have no cv or g, so they are refused (addendum §2).
    return typeof sid === 'string' && Number.isSafeInteger(exp) && exp > now && typeof cv === 'string' && typeof g === 'boolean'
      ? { sid, exp, cv, g }
      : null;
  } catch {
    return null;
  }
}

// --- config (B1) ---

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';
const intIn = (v, min, max) => (typeof v === 'string' && /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : null);

function list(v) {
  if (typeof v !== 'string') return null;
  const items = v.split(',').map((s) => s.trim());
  return items.every(Boolean) ? items : null;
}

function readGemini(env) {
  const dailyCap = intIn(env.GEMINI_DAILY_CAP, 1, 500);
  const countries = list(env.GEMINI_ALLOWED_COUNTRIES);
  const countriesOk = countries && countries.every((c) => COUNTRY_RE.test(c) && c !== 'XX' && !EEA_UK_CH.includes(c) && !AI_BLOCKED.includes(c));
  const on = env.GEMINI_ENABLED === 'true' && dailyCap !== null && countriesOk
    && nonEmpty(env.GEMINI_MODEL) && nonEmpty(env.GEMINI_API_KEY);
  // Gemma on the same key and terms: an extra Google tier after Gemini is capped or paused. Unset = off.
  const gemmaCap = nonEmpty(env.GEMMA_MODEL) ? intIn(env.GEMMA_DAILY_CAP, 1, 14400) : null;
  return on
    ? { on, dailyCap, countries, model: env.GEMINI_MODEL.trim(), apiKey: env.GEMINI_API_KEY.trim(),
      gemmaModel: gemmaCap ? env.GEMMA_MODEL.trim() : '', gemmaDailyCap: gemmaCap ?? 0 }
    : { on: false, dailyCap: 0, countries: [], model: '', apiKey: '', gemmaModel: '', gemmaDailyCap: 0 };
}

/** Workers AI backup (env.AI binding): on only with a model and a daily cap; the cap keeps it in the free allocation. */
function readBackup(env, ai) {
  const dailyCap = intIn(env.WORKERS_AI_DAILY_CAP, 1, 1000);
  return ai && typeof ai.run === 'function' && nonEmpty(env.WORKERS_AI_MODEL) && dailyCap !== null
    ? { on: true, model: env.WORKERS_AI_MODEL.trim(), dailyCap }
    : { on: false, model: '', dailyCap: 0 };
}

export function readConfig(env, ai) {
  const e = env ?? {};
  const origins = list(e.ALLOWED_ORIGINS);
  const hostnames = list(e.TURNSTILE_HOSTNAMES);
  const actions = list(e.TURNSTILE_ACTIONS);
  const siteDailyCap = intIn(e.SITE_DAILY_CAP, 0, 20000);
  // Groq's own daily budget inside the site cap (its free tier has a daily token limit); unset means the site cap.
  const groqDailyCap = e.GROQ_DAILY_CAP === undefined ? siteDailyCap : intIn(e.GROQ_DAILY_CAP, 0, 1000);
  const groqSitePerMin = intIn(e.GROQ_SITE_PER_MIN, 1, Number.MAX_SAFE_INTEGER);
  const maxTokens = intIn(e.GROQ_MAX_COMPLETION_TOKENS, 1, Number.MAX_SAFE_INTEGER);
  const maxQueueWait = intIn(e.MAX_QUEUE_WAIT, 0, 30);
  const maxQueueDepth = intIn(e.MAX_QUEUE_DEPTH, 1, 10);
  const ok = ['GROQ_API_KEY', 'SESSION_HMAC_SECRET', 'IP_HASH_SECRET', 'TURNSTILE_SECRET', 'GROQ_MODEL', 'CONSENT_VERSION'].every((k) => nonEmpty(e[k]))
    && origins && hostnames && actions
    && [siteDailyCap, groqDailyCap, groqSitePerMin, maxTokens, maxQueueWait, maxQueueDepth].every((n) => n !== null);
  if (!ok) return { ok: false };
  const gemini = readGemini(e);
  const backup = readBackup(e, ai);
  return {
    ok: true,
    groqApiKey: e.GROQ_API_KEY.trim(),
    sessionSecret: e.SESSION_HMAC_SECRET.trim(),
    ipSecret: e.IP_HASH_SECRET.trim(),
    turnstileSecret: e.TURNSTILE_SECRET.trim(),
    groqModel: e.GROQ_MODEL.trim(),
    // Current version first; while a new notice rolls out the previous one may follow a comma, so the
    // live site keeps working until its new bundle deploys. Remove it once the site is updated.
    consentVersion: e.CONSENT_VERSION.split(',')[0].trim(),
    consentVersions: e.CONSENT_VERSION.split(',').map((v) => v.trim()).filter(Boolean),
    origins,
    hostnames,
    actions,
    siteDailyCap,
    maxTokens,
    limits: { siteDailyCap, groqDailyCap, groqSitePerMin, maxQueueWait, maxQueueDepth, geminiDailyCap: gemini.dailyCap,
      gemmaDailyCap: gemini.gemmaDailyCap, backupDailyCap: backup.dailyCap },
    gemini,
    backup,
  };
}

export function geminiSwitch(config, country) {
  if (!config.gemini.on) return 'off';
  return typeof country === 'string' && COUNTRY_RE.test(country) && config.gemini.countries.includes(country) ? 'eligible' : 'ineligible';
}

/** Memory default (D21): opt-in for the EEA, UK and CH, XX, and a malformed or missing country. */
const memoryRule = (country) =>
  (typeof country !== 'string' || !COUNTRY_RE.test(country) || country === 'XX' || EEA_UK_CH.includes(country) ? 'opt_in' : 'default_on');

// --- responses ---

function statusOf(body) {
  switch (body.type) {
    case 'rate_limited': case 'quota_exhausted': return 429;
    case 'session_required': return 401;
    case 'session_denied': return 403;
    case 'invalid_request':
      return body.error === 'body_too_large' ? 413 : body.error === 'turn_reused' ? 409 : 400;
    default: return 200;
  }
}

function makeResponse(body, origin) {
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status: statusOf(body), headers });
}

const bad = (error) => ({ type: 'invalid_request', error });

export function withTurn(body, turnId) {
  return body.type === 'provider_unavailable' ? { ...body, turnId } : body;
}

// --- history (B3 "Signed history") ---

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

function validHistory(history) {
  if (!Array.isArray(history) || history.length > MAX_HISTORY_ENTRIES) return false;
  return history.every((e) => {
    if (!e || typeof e !== 'object' || typeof e.content !== 'string') return false;
    if (e.role === 'user') return cpLength(e.content) <= MAX_MESSAGE;
    return e.role === 'assistant' && (e.sig === undefined || typeof e.sig === 'string') && (e.ts === undefined || typeof e.ts === 'number');
  });
}

// --- /v1/chat validation ---

export async function prepareChat(req) {
  const { config, deps, body, respond } = req;
  const fail = (b) => ({ response: respond(b) });
  const { sessionToken, turnId, mid, prevSig, message, history } = body;
  if (typeof sessionToken !== 'string' || typeof turnId !== 'string' || !UUID_RE.test(turnId)
    || typeof mid !== 'string' || !UUID_RE.test(mid) || typeof prevSig !== 'string' || (prevSig !== '' && !SIG_RE.test(prevSig))
    || typeof message !== 'string' || !Array.isArray(history)) {
    return fail(bad('bad_request'));
  }
  const text = message.trim();
  if (!text) return fail(bad('empty_message'));
  if (cpLength(text) > MAX_MESSAGE) return fail(bad('message_too_long'));
  if (!validHistory(history)) return fail(bad('bad_history'));
  const session = await verifySession(config.sessionSecret, sessionToken, deps.now());
  if (!session) return fail({ type: 'session_required' });
  if (!config.consentVersions.includes(session.cv)) return fail({ type: 'session_required', reason: 'consent' });
  if (config.siteDailyCap === 0) return fail({ type: 'provider_unavailable', reason: 'disabled', turnId });
  if (!deps.ip) return fail({ type: 'provider_unavailable', reason: 'misconfigured', turnId });
  const chain = await verifyChain(config.sessionSecret, mid, prevSig, history, deps.now());
  return {
    ctx: {
      sid: session.sid,
      turnId,
      mid,
      prevSig,
      message: text,
      history: capHistory(chain.history),
      chainPrev: chain.chainPrev,
      ipKey: await hmac(config.ipSecret, ipPrefix(deps.ip)),
      country: deps.country,
      gemini: session.g && geminiSwitch(config, deps.country) === 'eligible',
      // Gemma and Workers AI were added in the current notice: a session agreed under an older one never reaches them.
      currentNotice: session.cv === config.consentVersion,
    },
  };
}

// --- Groq ---

async function callGroq(config, deps, messages) {
  const { fetch } = deps;
  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: new Headers({ authorization: `Bearer ${config.groqApiKey}`, 'content-type': 'application/json' }),
      body: JSON.stringify({
        model: config.groqModel,
        messages,
        reasoning_effort: 'low',
        include_reasoning: false,
        max_completion_tokens: config.maxTokens,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 200) {
      const data = await res.json();
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;
      return typeof content === 'string' && content.trim() && choice.finish_reason !== 'length'
        ? { ok: true, content }
        : { ok: false, status: 200, retryAfter: null };
    }
    return { ok: false, status: res.status, retryAfter: res.headers.get('retry-after') };
  } catch {
    return { ok: false, status: 0, retryAfter: null };
  }
}

// --- Workers AI backup ---

const WORKERS_AI_TIMEOUT_MS = 10_000;

async function callWorkersAI(config, deps, messages) {
  let timer;
  try {
    const out = await Promise.race([
      deps.ai.run(config.backup.model, { messages, max_tokens: config.maxTokens }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), WORKERS_AI_TIMEOUT_MS); }),
    ]);
    const content = out?.response;
    return typeof content === 'string' && content.trim() ? { ok: true, content } : { ok: false };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

// Groq route results that mean "no Groq capacity right now" rather than a visitor limit or a closed day.
const noGroqCapacity = (r) => (r.type === 'provider_unavailable' && ['groq_busy', 'groq_failed', 'groq_daily'].includes(r.reason))
  || (r.type === 'rate_limited' && (r.scope === 'site_minute' || r.scope === 'queue_full'))
  || (r.type === 'quota_exhausted' && r.scope === 'groq_daily');

async function chat(req) {
  const { config, deps, respond } = req;
  const { limiter, sleep, waitUntil } = deps;
  const prepared = await prepareChat(req);
  if (prepared.response) return prepared.response;
  const { ctx } = prepared;
  const { sid, turnId, ipKey, message, mid } = ctx;
  if (AI_BLOCKED.includes(ctx.country)) return respond({ type: 'faq', turnId, reason: 'region' });

  const key = { ipKey, sid, turnId };
  const out = (b) => respond(withTurn(b, turnId));
  const reply = async (provider, content) => {
    const ts = deps.now();
    const sig = await signReply(config.sessionSecret, mid, ctx.chainPrev, ts, message, content);
    return respond({ type: 'ai', turnId, provider, reply: content, sig, ts, prevSig: ctx.chainPrev });
  };
  // A Cancel or disconnect before any step that can reach a provider makes no call (§1.6).
  if (deps.signal?.aborted) return new Response(null, { status: 499 });
  let r = await limiter.reserve({ ...key, cfg: config.limits, gemini: ctx.gemini, gemma: ctx.currentNotice });

  if (r.type === 'go' && r.provider === 'gemini') {
    // One waitUntil unit, so the lease release, the R5-24 latch and the 429 pause survive a visitor disconnect.
    // A failed end() is retried once and never costs the visitor the reply.
    const work = (async () => {
      // Aborted during reserve: no Google call; the Gemini day count stays spent (never under-counts).
      const g = deps.signal?.aborted
        ? { ok: false, status: 0, retryAfter: null }
        : await callGemini(config, deps, filterHistory(ctx.history), message, r.model === 'gemma' ? config.gemini.gemmaModel : undefined);
      const status = { googleStatus: g.ok || g.blocked ? 200 : g.status, retryAfter: g.retryAfter };
      // §1.6: a Cancel or disconnect before or during the Gemini call ends the turn with no fallback and no Groq call.
      if (g.ok || g.blocked || deps.signal?.aborted) {
        const endTurn = async () => limiter.end({ ...key, ...status });
        await endTurn().catch(endTurn).catch(() => {});
        return { g };
      }
      return { g, hop: await limiter.fallback({ ...key, cfg: config.limits, ...status }) };
    })();
    waitUntil(work.catch(() => {}));
    const { g, hop } = await work;
    if (g.ok) return reply(r.model === 'gemma' ? 'gemma' : 'gemini', g.content);
    // Blocked content is never sent on to Groq (§1.2: that would be policy evasion).
    if (g.blocked) return out({ type: 'provider_unavailable', reason: 'content_blocked' });
    if (!hop) return new Response(null, { status: 499 });
    console.log(JSON.stringify({ gemini_failed: g.status }));
    r = hop;
  }

  while (r.type === 'go' && r.waitMs > 0) {
    let failed = false;
    try {
      await sleep(r.waitMs, deps.signal);
    } catch {
      failed = true;
    }
    if (failed || deps.signal?.aborted) {
      waitUntil(Promise.resolve(limiter.cancel(key)).catch(() => {}));
      return new Response(null, { status: 499 });
    }
    r = await limiter.claim({ ...key, cfg: config.limits });
  }
  const messages = [
    { role: 'system', content: GROQ_SYSTEM_PROMPT },
    ...ctx.history.map(({ role, content }) => ({ role, content })),
    { role: 'user', content: message },
  ];
  // Last AI resort before the client's quick answers: Workers AI, once per turn, when Groq has no capacity.
  const backupOr = async (refusal) => {
    if (!config.backup.on || !ctx.currentNotice || deps.signal?.aborted || !noGroqCapacity(refusal)) return out(refusal);
    // A claim can report groq_failed for a lapsed IN_FLIGHT turn: close it first (a no-op for a closed turn).
    if (refusal.reason === 'groq_failed') await Promise.resolve(limiter.end(key)).catch(() => {});
    const b = await Promise.resolve(limiter.backup({ ...key, cfg: config.limits })).catch(() => null);
    if (b?.type !== 'go') return out(refusal);
    const w = await callWorkersAI(config, deps, messages);
    if (w.ok) return reply('workers_ai', w.content);
    console.log(JSON.stringify({ workers_ai_failed: true }));
    return out(refusal);
  };
  if (r.type !== 'go') return backupOr(r);
  // Aborted during reserve, fallback or claim with no wait left: cancel refunds the unused Groq slot.
  if (deps.signal?.aborted) {
    waitUntil(Promise.resolve(limiter.cancel(key)).catch(() => {}));
    return new Response(null, { status: 499 });
  }

  const groq = await callGroq(config, deps, messages);
  if (groq.ok) {
    waitUntil(Promise.resolve(limiter.end(key)).catch(() => {}));
    return reply('groq', groq.content);
  }
  // There is never a Groq → Gemini hop (§1.2). A Groq 429 pauses Groq in end(), which also closes the turn
  // before the Workers AI backup may take it.
  const ended = Promise.resolve(limiter.end({ ...key, groqStatus: groq.status, retryAfter: groq.retryAfter })).catch(() => {});
  waitUntil(ended);
  await ended;
  return backupOr({ type: 'provider_unavailable', reason: 'groq_failed' });
}

// --- session ---

async function siteverify(config, deps, token) {
  const { fetch } = deps;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret: config.turnstileSecret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const j = await res.json();
    return j?.success === true && config.hostnames.includes(j.hostname) && config.actions.includes(j.action);
  } catch {
    return false;
  }
}

async function session(req) {
  const { config, deps, body, respond } = req;
  const token = body.turnstileToken;
  if (typeof token !== 'string') return respond(bad('bad_request'));
  // The 18+ gate (§2), checked before siteverify so a bad request spends no siteverify call.
  const { ack18, geminiAck, consentVersion } = body;
  if (ack18 !== true || typeof geminiAck !== 'boolean' || !config.consentVersions.includes(consentVersion)) {
    return respond(bad('bad_consent'));
  }
  if (config.siteDailyCap === 0) return respond({ type: 'provider_unavailable', reason: 'disabled' });
  if (!token || token.length > 2048 || !(await siteverify(config, deps, token))) return respond({ type: 'session_denied' });
  const country = deps.country;
  // The server downgrades the Gemini flag itself and never trusts the client.
  const g = geminiAck && geminiSwitch(config, country) === 'eligible';
  const sid = crypto.randomUUID();
  // The audit record; a failed write fails the session closed (handle's catch).
  await deps.limiter.consent({ sid, consentVersion, gemini: g, country: country ?? null });
  const exp = deps.now() + SESSION_TTL_MS;
  return respond({
    type: 'session',
    sessionToken: await signSession(config.sessionSecret, { sid, exp, cv: consentVersion, g }),
    expiresAt: new Date(exp).toISOString(),
    memory: memoryRule(country),
    gemini: g ? 'on' : 'off',
  });
}

// --- region (§3): no limiter call, no storage write, no fetch ---

function region(req) {
  const { config, deps, respond } = req;
  return respond({
    type: 'region',
    memory: memoryRule(deps.country),
    gemini: geminiSwitch(config, deps.country) === 'eligible' ? 'eligible' : 'ineligible',
    consentVersion: config.consentVersion,
  });
}

// --- entry ---

// Reads at most MAX_BODY bytes: a chunked body with no content-length is cut off, not buffered whole.
async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { all.set(c, at); at += c.byteLength; }
  return new TextDecoder().decode(all);
}

const ROUTES = { '/v1/session': session, '/v1/chat': chat, '/v1/region': region };

export async function handle(request, env, deps) {
  const path = new URL(request.url).pathname;
  const route = ROUTES[path];
  if (!route) return new Response(null, { status: 404 });
  if (request.method !== 'POST' && request.method !== 'OPTIONS') return new Response(null, { status: 405 });
  try {
    let text = '';
    if (request.method === 'POST') {
      text = await readBody(request);
      if (text === null) return makeResponse(bad('body_too_large'), null);
    }
    const config = readConfig(env, deps?.ai);
    if (!config.ok) return makeResponse({ type: 'provider_unavailable', reason: 'misconfigured' }, null);
    const origin = request.headers.get('origin');
    if (!origin || !config.origins.includes(origin)) return new Response(null, { status: 403 });
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'Content-Type',
          'access-control-max-age': '600',
          vary: 'Origin',
        },
      });
    }
    const respond = (b) => makeResponse(b, origin);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return respond(bad('bad_request'));
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(bad('bad_request'));
    const d = { waitUntil: (p) => p.catch(() => {}), now: Date.now, ...deps };
    return await route({ config, deps: d, origin, body, respond, path });
  } catch {
    return makeResponse({ type: 'provider_unavailable', reason: 'groq_failed' }, null);
  }
}

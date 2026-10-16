// Aki chat client: Turnstile, gate, session, turn ids, history window and the region-aware memory rules (B4/B5).
import { AKI_CONSENT_VERSION } from '../data/akiFaq.js';

const API = (import.meta.env.VITE_AKI_API_URL || '').replace(/\/+$/, '');
const SITEKEY = import.meta.env.VITE_AKI_TURNSTILE_SITEKEY || '';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const TIMEOUT_MS = 45000;
// A chat turn may run Gemini, Groq, Workers AI and Gemma in turn (12 + 10 + 10 + 12 s at most).
const CHAT_TIMEOUT_MS = 60000;
const REGION_TIMEOUT_MS = 5000;
const DAY = 24 * 3600 * 1000;
const KEEP_MS = 7 * DAY;
const KEY = {
  history: 'aki:v1:history',
  session: 'aki:v1:session',
  gate: 'aki:v1:gate',
};

export const AKI_ENABLED = Boolean(API);
export const AKI_CAN_CHAT = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
export const newId = () => crypto.randomUUID();
export const codePoints = (s) => [...s].length;
const clip = (s, n) => [...s].slice(0, n).join('');

// Storage: every access is guarded; a write the browser refuses is kept in memory for this page instead.
const area = (kind) => {
  try { return kind === 'local' ? window.localStorage : window.sessionStorage; } catch { return null; }
};
const mem = { local: new Map(), session: new Map() };
const read = (kind, key) => {
  if (mem[kind].has(key)) return mem[kind].get(key);
  try { return area(kind)?.getItem(key) ?? null; } catch { return null; }
};
const write = (kind, key, value) => {
  try {
    const a = area(kind);
    if (!a) throw new Error('no storage');
    a.setItem(key, value);
    mem[kind].delete(key);
  } catch { mem[kind].set(key, value); }
};
const drop = (kind, key) => { mem[kind].delete(key); try { area(kind)?.removeItem(key); } catch { /* memory only */ } };

function parseHistory(raw) {
  try {
    const h = JSON.parse(raw);
    if (!h || typeof h.mid !== 'string' || !Array.isArray(h.messages)) return null;
    const messages = h.messages.filter((m) => m && typeof m.content === 'string' && Number.isFinite(m.ts)
      && (m.role === 'user' || (m.role === 'assistant' && typeof m.sig === 'string' && typeof m.prev === 'string')));
    return { mid: h.mid, messages };
  } catch { return null; }
}

// ---- Memory rules ----
// Owner decision D25: no Remember control; default_on keeps history 7 days in localStorage, opt_in until the tab closes.
const dropStale = () => drop('local', 'aki:v1:memory');

// Drops whole user/assistant pairs older than 7 days.
function prune(h) {
  const now = Date.now();
  const messages = [];
  for (let i = 0; i < h.messages.length; i += 2) {
    const pair = h.messages.slice(i, i + 2);
    if (pair.every((m) => now - m.ts <= KEEP_MS)) messages.push(...pair);
  }
  return { ...h, messages };
}

// What the visitor confirmed on the welcome screen; per tab, it authorises nothing (the server session does).
export function readGate() {
  const raw = read('session', KEY.gate);
  try {
    const g = JSON.parse(raw);
    if (g && g.consentVersion === AKI_CONSENT_VERSION && typeof g.gemini === 'boolean'
      && (g.memory === 'on' || g.memory === 'off') && Number.isFinite(g.confirmedAt)) return g;
  } catch { /* treated as no gate */ }
  // A rejected gate (old consent version) takes its session with it: the next session must carry the new choice.
  if (raw !== null) clearGate();
  return null;
}
export const writeGate = ({ gemini, memory }) => {
  write('session', KEY.gate, JSON.stringify({
    consentVersion: AKI_CONSENT_VERSION, gemini, memory: memory ? 'on' : 'off', confirmedAt: Date.now(),
  }));
  // The rule the visitor just accepted applies now, not at the first send.
  applyRule();
};
export const clearGate = () => { drop('session', KEY.gate); drop('session', KEY.session); };

// Session rule when a session exists, else what the welcome screen showed; null until the gate is passed.
export function getRule() {
  try {
    const s = JSON.parse(read('session', KEY.session));
    if (s) return s.memory === 'default_on' ? 'default_on' : 'opt_in';
  } catch { /* fall back to the gate */ }
  const g = readGate();
  return g ? (g.memory === 'on' ? 'default_on' : 'opt_in') : null;
}

// 'local' | 'session' | null (null means React state only): from the region rule.
export function memoryTarget() {
  const rule = getRule();
  if (!rule) return null;
  return rule === 'default_on' ? 'local' : 'session';
}

// A stricter region (EEA/UK/CH or unknown) applies at once, also to a session made under default_on.
function tightenRule() {
  try {
    const s = JSON.parse(read('session', KEY.session));
    if (s?.memory === 'default_on') write('session', KEY.session, JSON.stringify({ ...s, memory: 'opt_in' }));
  } catch { /* no session */ }
  const g = readGate();
  if (g?.memory === 'on') write('session', KEY.gate, JSON.stringify({ ...g, memory: 'off' }));
  applyRule('opt_in');
}

// opt_in: history written under an earlier default_on visit moves to sessionStorage.
export function applyRule(rule = getRule()) {
  if (rule !== 'opt_in') return;
  const old = read('local', KEY.history);
  if (old === null) return;
  if (read('session', KEY.history) === null) write('session', KEY.history, old);
  drop('local', KEY.history);
}

export function loadHistory() {
  dropStale();
  // Expiry applies to localStorage history in any tab, whatever the rule; removing data is not a new write.
  const stored = parseHistory(read('local', KEY.history));
  if (stored) {
    const fresh = prune(stored);
    if (fresh.messages.length !== stored.messages.length) {
      if (fresh.messages.length) write('local', KEY.history, JSON.stringify(fresh));
      else drop('local', KEY.history);
    }
  }
  applyRule();
  const target = memoryTarget();
  // Rule unknown: existing history may be shown but is never modified.
  for (const kind of target ? [target] : ['session', 'local']) {
    const h = parseHistory(read(kind, KEY.history));
    if (!h) continue;
    if (target !== 'local') return h;
    const kept = prune(h);
    if (kept.messages.length !== h.messages.length) saveHistory(kept);
    return kept.messages.length ? kept : null;
  }
  return null;
}

export function saveHistory(h) {
  const target = memoryTarget();
  if (!target) return;
  const kept = target === 'local' ? prune(h) : h;
  if (kept.messages.length) write(target, KEY.history, JSON.stringify(kept));
  else drop(target, KEY.history);
  drop(target === 'local' ? 'session' : 'local', KEY.history);
}

export function clearHistory() {
  dropStale();
  drop('local', KEY.history);
  drop('session', KEY.history);
}

// Re-reads storage so two tabs never overwrite each other's pairs.
export function appendPair(h, user, assistant) {
  const target = memoryTarget();
  const stored = target ? parseHistory(read(target, KEY.history)) : null;
  const base = stored?.mid === h.mid ? stored : h;
  const next = { mid: h.mid, messages: [...base.messages, user, assistant].slice(-50) };
  saveHistory(next);
  return target === 'local' ? prune(next) : next;
}

// ---- History window (Q3, R4-21, R4-22): only ever cut from the front ----
export function buildWindow(msgs) {
  const now = Date.now();
  let start = Math.max(0, msgs.length - 6);
  msgs.forEach((m, i) => {
    if (m.role !== 'assistant') return;
    if (now - m.ts > DAY) start = Math.max(start, i + 1);
    const before = msgs[i - 2];
    if (before && m.prev !== before.sig) start = Math.max(start, i - 1);
  });
  let w = msgs.slice(start).map((m) => (m.role === 'assistant' ? { ...m, content: clip(m.content, 1500) } : m));
  const total = () => w.reduce((n, m) => n + codePoints(m.content), 0);
  while (w.length && (w[0].role !== 'user' || total() > 3000)) w = w.slice(w[0].role === 'user' ? 2 : 1);
  const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
  const firstAssistant = w.find((m) => m.role === 'assistant');
  return {
    prevSig: firstAssistant ? firstAssistant.prev : (lastAssistant?.sig ?? ''),
    history: w.map((m) => (m.role === 'assistant'
      ? { role: 'assistant', content: m.content, sig: m.sig, ts: m.ts }
      : { role: 'user', content: m.content })),
  };
}

// ---- Turnstile ----
let turnstileLoad = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  turnstileLoad ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => { turnstileLoad = null; reject(new Error('turnstile')); };
    document.head.append(s);
  });
  return turnstileLoad;
}

// Without a sitekey the client sends an empty token; the real Worker rejects it.
async function turnstileToken(container, signal) {
  if (!SITEKEY) return '';
  // The script load counts against the same timeout and Cancel as the widget.
  const ts = await new Promise((resolve, reject) => {
    const stop = (e) => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); reject(e); };
    const onAbort = () => stop(new Error('aborted'));
    const timer = setTimeout(() => { turnstileLoad = null; stop(new Error('turnstile')); }, TIMEOUT_MS);
    if (signal?.aborted) return onAbort();
    signal?.addEventListener('abort', onAbort);
    loadTurnstile().then((v) => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); resolve(v); }, stop);
  });
  return new Promise((resolve, reject) => {
    let id;
    const finish = (fn, v) => {
      signal?.removeEventListener('abort', onAbort);
      queueMicrotask(() => { try { ts.remove(id); } catch { /* already gone */ } });
      fn(v);
    };
    const onAbort = () => finish(reject, new Error('aborted'));
    if (signal?.aborted) return reject(new Error('aborted'));
    signal?.addEventListener('abort', onAbort);
    const fail = () => finish(reject, new Error('turnstile'));
    const timer = setTimeout(fail, TIMEOUT_MS);
    const done = (fn) => (v) => { clearTimeout(timer); finish(fn, v); };
    id = ts.render(container, {
      sitekey: SITEKEY,
      action: 'aki_session',
      // Flexible needs 300px; narrow phone panels get the compact widget.
      size: container.parentElement.clientWidth < 324 ? 'compact' : 'flexible',
      callback: done(resolve),
      'error-callback': done(reject),
      'timeout-callback': done(reject),
      'expired-callback': done(reject),
      'unsupported-callback': done(reject),
    });
  });
}

// ---- Transport ----
async function post(path, body, signal, ms = TIMEOUT_MS) {
  const inner = new AbortController();
  const abort = () => inner.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, ms);
  try {
    const res = await fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: inner.signal,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch {
    return { status: 0, body: null };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

const REGION_FAILSAFE = { memory: 'opt_in', gemini: 'ineligible', consentVersion: null };
// Shared only while in flight: each panel open asks again, so a move to a stricter region is seen.
let regionLoad = null;

export function fetchRegion() {
  regionLoad ??= post('/v1/region', {}, undefined, REGION_TIMEOUT_MS).then(({ status, body }) => {
    if (status !== 200 || body?.type !== 'region') return REGION_FAILSAFE;
    const consentVersion = typeof body.consentVersion === 'string' ? body.consentVersion : null;
    const gate = readGate();
    if (consentVersion && gate && gate.consentVersion !== consentVersion) clearGate();
    if (body.memory !== 'default_on') tightenRule();
    return {
      memory: body.memory === 'default_on' ? 'default_on' : 'opt_in',
      gemini: body.gemini === 'eligible' ? 'eligible' : 'ineligible',
      consentVersion,
    };
  }).finally(() => { regionLoad = null; });
  return regionLoad;
}

// Any response other than 200 "session" means the rule is unknown.
async function ensureSession(container, signal, force) {
  if (!force) {
    try {
      const s = JSON.parse(read('session', KEY.session));
      if (s?.sessionToken && Date.parse(s.expiresAt) > Date.now() + 30000) return { ok: true, token: s.sessionToken };
    } catch { /* fetch a new one */ }
  }
  drop('session', KEY.session);
  // A gate older than a day cannot mint sessions: the visitor must confirm again.
  const gate = readGate();
  if (!gate || Date.now() - gate.confirmedAt > DAY) { clearGate(); return { ok: false, kind: 'consent' }; }
  let token;
  try { token = await turnstileToken(container, signal); } catch { return { ok: false, kind: 'network' }; }
  const { status, body } = await post('/v1/session', {
    turnstileToken: token, ack18: true, geminiAck: gate.gemini, consentVersion: AKI_CONSENT_VERSION,
  }, signal);
  if (status === 200 && body?.type === 'session' && typeof body.sessionToken === 'string') {
    write('session', KEY.session, JSON.stringify({
      sessionToken: body.sessionToken, expiresAt: body.expiresAt, memory: body.memory, gemini: body.gemini === 'on',
    }));
    return { ok: true, token: body.sessionToken };
  }
  if (status === 0) return { ok: false, kind: 'network' };
  if (body?.type === 'invalid_request') return { ok: false, kind: body.error === 'bad_consent' ? 'updated' : 'network' };
  return { ok: false, kind: 'unavailable' };
}

function interpret({ status, body }) {
  const t = body?.type;
  if (status === 0 || !t) return { kind: 'network' };
  if (status === 401 && t === 'session_required') return { kind: 'session_required', reason: body.reason };
  if (t === 'ai' && typeof body.reply === 'string' && typeof body.sig === 'string' && Number.isFinite(body.ts)) {
    return { kind: 'ai', reply: body.reply, sig: body.sig, ts: body.ts, prev: body.prevSig ?? '', provider: body.provider };
  }
  if (t === 'faq') return { kind: 'faq' };
  if (t === 'provider_unavailable') {
    const retryAfter = Math.ceil(Number(body.retryAfter));
    return { kind: 'unavailable', reason: body.reason, ...(retryAfter > 0 ? { retryAfter } : {}) };
  }
  if (t === 'rate_limited') return { kind: 'rate', scope: body.scope, retryAfter: Math.max(1, Math.ceil(Number(body.retryAfter) || 5)) };
  if (t === 'quota_exhausted') {
    const resetsAt = Date.parse(body.resetsAt);
    return { kind: 'quota', ...(Number.isFinite(resetsAt) ? { resetsAt } : {}) };
  }
  if (t === 'invalid_request') return { kind: 'invalid', error: body.error };
  return { kind: 'network' };
}

// One user turn. Always uses a fresh turnId; a 401 re-runs the session once and resends with another new one.
export async function sendTurn({ message, mid, stored, container, signal }) {
  const win = buildWindow(stored);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const session = await ensureSession(container, signal, attempt > 0);
    if (!session.ok) return { kind: session.kind, rule: getRule() };
    applyRule();
    const ctx = { sessionToken: session.token, turnId: newId(), mid, prevSig: win.prevSig, message, history: win.history };
    const result = interpret(await post('/v1/chat', ctx, signal, CHAT_TIMEOUT_MS));
    if (result.kind === 'session_required') {
      // The notice changed since the visitor confirmed: show the welcome again.
      if (result.reason === 'consent') { clearGate(); return { kind: 'consent', rule: getRule() }; }
      if (attempt === 0) continue;
      return { kind: 'unavailable', rule: getRule() };
    }
    return { ...result, rule: getRule() };
  }
  return { kind: 'unavailable', rule: getRule() };
}

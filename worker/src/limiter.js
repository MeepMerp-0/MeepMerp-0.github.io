/**
 * Aki limiter: the pure decisions behind the Limiter Durable Object (plan B2, B3).
 * No I/O and no clock. `now` is always the DO's own Date.now(), read at the start of each call (R4-2).
 *
 * Storage, one record per key (the DO passes ctx.storage.kv; tests pass memoryStore()):
 *   g                 global  {day, groq, gemini, S, groqBlockedUntil, geminiBlockedUntil}
 *                             S = [[slotAt, "sid:turnId"], ...] in ascending slotAt order (R5-32, R5-33)
 *   v:<ipKey>         visitor {w: accepted-turn times (24 h, ≤ 30), lastAt, lease: {turnId, exp} | null, at}
 *                             lease.turnId holds the full turn key "sid:turnId"
 *   t:<sid>:<turnId>  turn    {state, exp, slotAt?, reservedAt?, day?, hop?, at}
 *                             state: GEMINI_IN_FLIGHT | IN_FLIGHT (Groq; hop:true when it came from Gemini) | DONE
 *   c:<sid>           consent {sid, consentVersion, ack18, gemini, confirmedAt, country}  (audit trail, addendum §2)
 *
 * createLimiter(store, now) → {reserve, claim, cancel, end, fallback, consent, cleanup}.
 * Each method takes one request object and calls now() itself:
 *   reserve   {cfg, ipKey, sid, turnId, gemini}   gemini: true only if the session, config and country allow it
 *   claim     {cfg, ipKey, sid, turnId}
 *   fallback  {cfg, ipKey, sid, turnId, googleStatus, retryAfter}   Gemini failed (not blocked): hop to Groq
 *   cancel    {ipKey, sid, turnId}
 *   end       {ipKey, sid, turnId, googleStatus?, groqStatus?, retryAfter?}   retryAfter = seconds or raw header
 *   consent   {sid, consentVersion, gemini, country}
 *   cleanup   () → number of records deleted (hourly alarm, R5-17)
 * cfg = {siteDailyCap, groqSitePerMin, maxQueueWait (seconds), maxQueueDepth, geminiDailyCap}, from readConfig.
 * The Gemini latch, pause and caps are checked here; a turn that may not use Gemini silently takes the Groq route.
 *
 * Results:
 *   {type:'go', provider:'gemini', waitMs:0}  reserve: call Gemini now.
 *   {type:'go', provider:'groq', waitMs}      reserve and fallback. waitMs > 0: sleep, then claim. 0: call Groq now.
 *   {type:'go', waitMs}                       claim (Groq only).
 *   null                                      cancel, end and consent.
 *   otherwise a B4 body without turnId (app.js adds it):
 *     rate_limited{scope, retryAfter}, quota_exhausted{scope, resetsAt}, provider_unavailable{reason, retryAfter?},
 *     invalid_request{error: 'turn_reused'}.
 *
 * The pure ops (reserve, claim, ...) take (slice, now, cfg, req), where slice = {g, v, t} as read from storage,
 * and return {result} plus only the records to write (g, v, t, c). Refusals write nothing.
 */

export const EEA_UK_CH = Object.freeze([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
  'GF', 'GP', 'MQ', 'RE', 'YT', 'MF', 'AX', 'SJ',
  'GI', 'JE', 'GG', 'IM',
]);
export const AI_BLOCKED = Object.freeze(['CU', 'IR', 'KP', 'SY', 'T1']);

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
export const SLOT_GUARD_MS = 3_000;
export const REPLY_MAX_AGE_MS = DAY;
export const COOLDOWN_MS = 4_000;
export const GROQ_LEASE_MS = 15_000;
export const GEMINI_LEASE_MS = 20_000;
export const HOP_WAIT_MAX_MS = 15_000;
export const DONE_MS = 10 * MINUTE;
export const DEFAULT_PAUSE_MS = 20_000;
export const MAX_PAUSE_MS = DAY;
export const CONSENT_TTL_MS = DAY;
export const RECORD_TTL_MS = 47 * HOUR;
export const CLEANUP_INTERVAL_MS = HOUR;

const VISITOR_LIMITS = [['hour', HOUR, 15], ['day', DAY, 30]];

const PT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function pacificParts(ms) {
  const p = Object.fromEntries(PT.formatToParts(ms).map(({ type, value }) => [type, Number(value)]));
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) + (ms % 1000 + 1000) % 1000;
  return { ...p, offset: wall - ms };
}

/** Pacific calendar day of `ms` as 'YYYY-MM-DD' (D9). */
export function pacificDay(ms) {
  const { year, month, day } = pacificParts(ms);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The next Pacific midnight after `ms`, in ms. DST changes at 02:00, so the offset near midnight is exact. */
export function nextPacificMidnight(ms) {
  const { year, month, day, offset } = pacificParts(ms);
  const wallMidnight = Date.UTC(year, month - 1, day + 1);
  return wallMidnight - pacificParts(wallMidnight - offset).offset;
}

/** IPv4 as is; IPv6 reduced to its /64 prefix, so one IPv6 customer network is one visitor (B2). */
export function ipPrefix(ip) {
  const s = String(ip).trim().toLowerCase().split('%')[0];
  if (!s.includes(':')) return s;
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1];
  const [head, tail] = s.split('::');
  const groups = (x) => (x ? x.split(':').flatMap((g) => (g.includes('.') ? ['0', '0'] : [g])) : []);
  const h = groups(head);
  const t = groups(tail);
  const all = tail === undefined ? h : [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return `${all.slice(0, 4).map((g) => (parseInt(g, 16) || 0).toString(16)).join(':')}::/64`;
}

/** Groq or Gemini pause after a 429: retry-after seconds capped at 24 h; 20 s if missing or not a number (B2, R4-28). */
export function pauseMs(retryAfter) {
  const n = typeof retryAfter === 'number' ? retryAfter
    : typeof retryAfter === 'string' && /^\s*\d+(\.\d+)?\s*$/.test(retryAfter) ? Number(retryAfter) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.min(n * 1000, MAX_PAUSE_MS) : DEFAULT_PAUSE_MS;
}

/** Earliest Groq slot: ≤ cap per rolling 60 s with a 3 s guard, never before a pause ends, strict FIFO (B2, R4-3). */
export function nextSlot(S, now, groqBlockedUntil, cap) {
  const n = S.length;
  return Math.max(
    now,
    groqBlockedUntil,
    n >= cap ? S[n - cap][0] + MINUTE + SLOT_GUARD_MS : 0,
    n > 0 ? S[n - 1][0] : 0,
  );
}

// --- results ---

const secs = (ms) => Math.max(1, Math.ceil(ms / 1000));
const go = (waitMs, provider) => ({ type: 'go', ...(provider && { provider }), waitMs });
const limited = (scope, ms) => ({ type: 'rate_limited', scope, retryAfter: secs(ms) });
const unavailable = (reason, extra) => ({ type: 'provider_unavailable', reason, ...extra });
const invalid = (error) => ({ type: 'invalid_request', error });
const exhausted = (scope, now) => ({
  type: 'quota_exhausted', scope, resetsAt: new Date(nextPacificMidnight(now)).toISOString(),
});

// --- helpers on the working slice ---

const keyOf = (sid, turnId) => `${sid}:${turnId}`;
const doneTurn = (now) => ({ state: 'DONE', exp: now + DONE_MS });
const hopWaitMs = (cfg) => Math.min(cfg.maxQueueWait * 1000, HOP_WAIT_MAX_MS);

function dayCounts(g, today) {
  return g.day === today ? { groq: g.groq, gemini: g.gemini } : { groq: 0, gemini: 0 };
}

function rollDay(g, today) {
  if (g.day !== today) Object.assign(g, { day: today, groq: 0, gemini: 0 });
}

function refundGroqDay(g, t, now) {
  const today = pacificDay(now);
  if (t.day === today && g.day === today) g.groq = Math.max(0, g.groq - 1);
}

/** Provider error effects (§1.2, §1.8): Google 401/403 → 24 h latch (R5-24); a 429 pauses that provider. */
function applyStatus(g, now, { googleStatus, groqStatus, retryAfter }) {
  if (googleStatus === 401 || googleStatus === 403) g.geminiBlockedUntil = Math.max(g.geminiBlockedUntil, now + DAY);
  if (googleStatus === 429) g.geminiBlockedUntil = Math.max(g.geminiBlockedUntil, now + pauseMs(retryAfter));
  if (groqStatus === 429) g.groqBlockedUntil = Math.max(g.groqBlockedUntil, now + pauseMs(retryAfter));
}

function cooldownCheck(v, now) {
  return v.lastAt != null && now - v.lastAt < COOLDOWN_MS ? limited('cooldown', v.lastAt + COOLDOWN_MS - now) : null;
}

function leaseCheck(v, now) {
  return v.lease && v.lease.exp > now ? limited('concurrent', v.lease.exp - now) : null;
}

function windowsCheck(v, now, cfg) {
  for (const [scope, span, max] of [['minute', MINUTE, Math.min(4, cfg.groqSitePerMin)], ...VISITOR_LIMITS]) {
    const recent = v.w.filter((x) => x > now - span);
    if (!(recent.length < max)) return limited(scope, recent[recent.length - max] + span - now);
  }
  return null;
}

function countAttempt(v, now) {
  v.w = [...v.w.filter((x) => x > now - DAY), now].slice(-30);
}

function refundAttempt(v, at) {
  const i = v.w.lastIndexOf(at);
  if (i >= 0) v.w.splice(i, 1);
}

function releaseLease(v, key) {
  if (v.lease?.turnId === key) v.lease = null;
}

const prune = (S, now) => S.filter(([at]) => at > now - MINUTE - SLOT_GUARD_MS);

function checkCfg(cfg) {
  const ok = cfg && ['siteDailyCap', 'groqSitePerMin', 'maxQueueWait', 'maxQueueDepth']
    .every((k) => Number.isInteger(cfg[k]) && cfg[k] >= 0) && cfg.groqSitePerMin >= 1 && cfg.maxQueueDepth >= 1;
  if (!ok) throw new TypeError('limiter: invalid cfg');
}

/**
 * Runs `fn` on a deep copy of the slice with defaults filled in. Returns {result} plus each record that changed,
 * stamped with `at = now` (the cleanup age). A consent record set as `s.c` is returned as `c`.
 */
function step(slice, now, fn) {
  const before = {
    g: slice.g ?? { day: pacificDay(now), groq: 0, gemini: 0, S: [], groqBlockedUntil: 0, geminiBlockedUntil: 0 },
    v: slice.v ?? { w: [], lastAt: null, lease: null },
    t: slice.t ?? null,
  };
  const s = structuredClone(before);
  const out = { result: fn(s) };
  for (const k of ['g', 'v', 't']) {
    if (s[k] && JSON.stringify(s[k]) !== JSON.stringify(before[k])) out[k] = k === 'g' ? s[k] : { ...s[k], at: now };
  }
  // A rewrite refreshes the cleanup age, so it must not carry turn times older than the rolling day.
  if (out.v) out.v.w = out.v.w.filter((x) => x > now - DAY);
  if (s.c) out.c = s.c;
  return out;
}

// --- ops ---

export function reserve(slice, now, cfg, { sid, turnId, gemini }) {
  checkCfg(cfg);
  return step(slice, now, (s) => {
    const key = keyOf(sid, turnId);
    const { g, v, t } = s;
    if (t && !(t.state === 'DONE' && t.exp <= now)) {
      return t.state === 'IN_FLIGHT' && t.exp > now ? limited('concurrent', t.exp - now) : invalid('turn_reused');
    }
    const refused = cooldownCheck(v, now) || leaseCheck(v, now) || windowsCheck(v, now, cfg);
    if (refused) return refused;
    const today = pacificDay(now);
    const c = dayCounts(g, today);
    // Gemini first (§1.1). A missing geminiDailyCap compares false, so the turn takes the Groq route.
    if (gemini === true && g.geminiBlockedUntil <= now
      && c.gemini < cfg.geminiDailyCap && c.groq + c.gemini < cfg.siteDailyCap) {
      rollDay(g, today);
      g.gemini += 1;
      countAttempt(v, now);
      v.lastAt = now;
      v.lease = { turnId: key, exp: now + GEMINI_LEASE_MS };
      s.t = { state: 'GEMINI_IN_FLIGHT', exp: now + GEMINI_LEASE_MS, day: today };
      return go(0, 'gemini');
    }
    if (g.groqBlockedUntil - now > cfg.maxQueueWait * 1000) {
      v.lastAt = now;
      s.t = doneTurn(now);
      return unavailable('groq_busy', { retryAfter: secs(g.groqBlockedUntil - now) });
    }
    if (!(c.groq + c.gemini < cfg.siteDailyCap)) return exhausted('site_daily', now);
    const S = prune(g.S, now);
    const slotAt = nextSlot(S, now, g.groqBlockedUntil, cfg.groqSitePerMin);
    const waiting = S.filter(([at]) => at > now);
    if (slotAt > now && waiting.length >= cfg.maxQueueDepth) return limited('queue_full', waiting[0][0] - now);
    if (slotAt - now > cfg.maxQueueWait * 1000) return limited('site_minute', slotAt - now - cfg.maxQueueWait * 1000);
    g.S = [...S, [slotAt, key]];
    rollDay(g, today);
    g.groq += 1;
    countAttempt(v, now);
    v.lastAt = now;
    v.lease = { turnId: key, exp: slotAt + GROQ_LEASE_MS };
    s.t = { state: 'IN_FLIGHT', exp: slotAt + GROQ_LEASE_MS, slotAt, reservedAt: now, day: today };
    return go(slotAt - now, 'groq');
  });
}

/** Gemini → Groq hop (§1.4, §1.6). Only from an unexpired GEMINI_IN_FLIGHT; counts no visitor window. */
export function fallback(slice, now, cfg, { sid, turnId, googleStatus, retryAfter }) {
  checkCfg(cfg);
  return step(slice, now, (s) => {
    const key = keyOf(sid, turnId);
    const { g, v, t } = s;
    applyStatus(g, now, { googleStatus, retryAfter });
    if (!t || t.state !== 'GEMINI_IN_FLIGHT' || t.exp <= now) {
      s.t = doneTurn(now);
      return unavailable('gemini_failed');
    }
    const finish = (result) => {
      releaseLease(v, key);
      s.t = doneTurn(now);
      return result;
    };
    const today = pacificDay(now);
    const c = dayCounts(g, today);
    if (!(c.groq + c.gemini < cfg.siteDailyCap)) return finish(exhausted('site_daily', now));
    const S = prune(g.S, now);
    const slotAt = nextSlot(S, now, g.groqBlockedUntil, cfg.groqSitePerMin);
    const waiting = S.filter(([at]) => at > now);
    if ((slotAt > now && waiting.length >= cfg.maxQueueDepth) || slotAt - now > hopWaitMs(cfg)) {
      return finish(unavailable('groq_busy', { retryAfter: secs(slotAt - now) }));
    }
    g.S = [...S, [slotAt, key]];
    rollDay(g, today);
    g.groq += 1;
    s.t = { state: 'IN_FLIGHT', exp: slotAt + GROQ_LEASE_MS, slotAt, reservedAt: now, day: today, hop: true };
    if (v.lease?.turnId === key) v.lease.exp = s.t.exp;
    return go(slotAt - now, 'groq');
  });
}

export function claim(slice, now, cfg, { sid, turnId }) {
  checkCfg(cfg);
  return step(slice, now, (s) => {
    const key = keyOf(sid, turnId);
    const { g, v, t } = s;
    if (!t || t.state !== 'IN_FLIGHT' || t.exp <= now) return unavailable('groq_failed');
    if (now < t.slotAt) return go(t.slotAt - now);
    if (g.groqBlockedUntil <= now) return go(0);
    const S = prune(g.S, now).filter(([, k]) => k !== key);
    const slotAt = nextSlot(S, now, g.groqBlockedUntil, cfg.groqSitePerMin);
    if (slotAt - t.reservedAt <= (t.hop ? hopWaitMs(cfg) : cfg.maxQueueWait * 1000)) {
      g.S = [...S, [slotAt, key]];
      t.slotAt = slotAt;
      t.exp = slotAt + GROQ_LEASE_MS;
      if (v.lease?.turnId === key) v.lease.exp = t.exp;
      return go(slotAt - now);
    }
    g.S = S;
    // A hop turn already cost a Gemini call, so its visitor window stays spent (§1.7).
    if (!t.hop) refundAttempt(v, t.reservedAt);
    refundGroqDay(g, t, now);
    releaseLease(v, key);
    s.t = doneTurn(now);
    return unavailable('groq_busy', { retryAfter: secs(g.groqBlockedUntil - now) });
  });
}

export function cancel(slice, now, _cfg, { sid, turnId }) {
  return step(slice, now, (s) => {
    const key = keyOf(sid, turnId);
    const { g, v, t } = s;
    if (!t || t.state !== 'IN_FLIGHT') return null;
    if (t.exp > now) {
      g.S = g.S.filter(([, k]) => k !== key);
      refundGroqDay(g, t, now);
      releaseLease(v, key);
    }
    s.t = doneTurn(now);
    return null;
  });
}

export function end(slice, now, _cfg, { sid, turnId, googleStatus, groqStatus, retryAfter }) {
  return step(slice, now, (s) => {
    const { g, v, t } = s;
    applyStatus(g, now, { googleStatus, groqStatus, retryAfter });
    if (!t || (t.state !== 'IN_FLIGHT' && t.state !== 'GEMINI_IN_FLIGHT')) return null;
    if (t.exp > now) releaseLease(v, keyOf(sid, turnId));
    s.t = doneTurn(now);
    return null;
  });
}

/** The consent audit record for one chat session (§2). Throws on a malformed request so /v1/session fails closed. */
export function consent(slice, now, _cfg, { sid, consentVersion, gemini, country }) {
  if (typeof sid !== 'string' || !sid || typeof consentVersion !== 'string' || !consentVersion
    || typeof gemini !== 'boolean') {
    throw new TypeError('limiter: invalid consent');
  }
  return step(slice, now, (s) => {
    s.c = { sid, consentVersion, ack18: true, gemini, confirmedAt: now, country };
    return null;
  });
}

export const OPS = { reserve, claim, cancel, end, fallback, consent };

// --- storage glue (shared by the DO and the tests) ---

export function storageKeys(ipKey, sid, turnId) {
  return { g: 'g', v: `v:${ipKey}`, t: `t:${sid}:${turnId}`, c: `c:${sid}` };
}

/** Read the slice, decide, write the changed records. `store` is synchronous, so the step is atomic in the DO. */
export function applyOp(store, now, op, req) {
  const k = storageKeys(req.ipKey, req.sid, req.turnId);
  const out = OPS[op]({ g: store.get(k.g), v: store.get(k.v), t: store.get(k.t) }, now, req.cfg, req);
  for (const name of ['g', 'v', 't', 'c']) if (out[name] !== undefined) store.put(k[name], out[name]);
  return out.result;
}

/** Hourly cleanup (R5-17): consent records at 24 h after confirmedAt, visitors and turns at 47 h since their last write. */
export function isStale(key, rec, now) {
  if (key.startsWith('c:')) return now - rec.confirmedAt >= CONSENT_TTL_MS;
  return /^[vt]:/.test(key) && now - rec.at >= RECORD_TTL_MS;
}

export function cleanup(store, now) {
  const stale = [...store.list()].filter(([key, rec]) => isStale(key, rec, now)).map(([key]) => key);
  for (const key of stale) store.delete(key);
  return stale.length;
}

export function createLimiter(store, now) {
  const call = (op) => (req) => applyOp(store, now(), op, req);
  return { ...Object.fromEntries(Object.keys(OPS).map((op) => [op, call(op)])), cleanup: () => cleanup(store, now()) };
}

/** A Map behind the same get/put/delete/list surface as the DO's synchronous KV. */
export function memoryStore() {
  const m = new Map();
  return { get: (k) => m.get(k), put: (k, val) => void m.set(k, val), delete: (k) => m.delete(k), list: () => m.entries() };
}

import { AKI_CONSENT_VERSION } from '../../src/data/akiFaq.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_BLOCKED, EEA_UK_CH, SLOT_GUARD_MS, REPLY_MAX_AGE_MS, OPS,
  createLimiter, memoryStore, pauseMs, pacificDay, nextPacificMidnight, ipPrefix, reserve,
} from '../src/limiter.js';

const S = 1000;
const H = 3_600_000;
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 16, 19, 0, 0); // 12:00 PDT
const BASE = { siteDailyCap: 100, groqSitePerMin: 2, maxQueueWait: 25, maxQueueDepth: 4, geminiDailyCap: 20 };

// The limiter reads this injected clock itself; no test passes a time into a limiter method (R4-2).
function setup(over = {}, start = T0) {
  const clock = { now: start };
  const store = memoryStore();
  const lim = createLimiter(store, () => clock.now);
  const cfg = { ...BASE, ...over };
  let n = 0;
  return {
    lim, store, cfg,
    at: (ms) => { clock.now = start + ms; },
    req: (ip, extra = {}) => ({ cfg, ipKey: ip, sid: `sid-${ip}`, turnId: `turn-${++n}`, gemini: false, ...extra }),
    g: () => store.get('g'),
    v: (ip) => store.get(`v:${ip}`),
    t: (r) => store.get(`t:${r.sid}:${r.turnId}`),
    keys: () => (store.get('g')?.S ?? []).map(([, k]) => k),
    snapshot: () => JSON.stringify([...store.list()]),
  };
}

const go = (waitMs) => ({ type: 'go', provider: 'groq', waitMs }); // reserve and fallback
const cgo = (waitMs) => ({ type: 'go', waitMs }); // claim
const GEMINI_GO = { type: 'go', provider: 'gemini', waitMs: 0 };
const rl = (scope, retryAfter) => ({ type: 'rate_limited', scope, retryAfter });
const busy = (retryAfter) => ({ type: 'provider_unavailable', reason: 'groq_busy', retryAfter });

// Reserve a Gemini-route turn (GEMINI_IN_FLIGHT).
function gem(e, ip, extra = {}) {
  const r = e.req(ip, { gemini: true, ...extra });
  assert.deepEqual(e.lim.reserve(r), GEMINI_GO);
  return r;
}
// A Groq 429 from another turn pauses Groq for `secs` seconds from now.
function pauseGroq(e, secs) {
  e.lim.end({ ipKey: 'Z', sid: 'z', turnId: 'z', groqStatus: 429, retryAfter: String(secs) });
}

test('constants', () => {
  assert.deepEqual([...AI_BLOCKED], ['CU', 'IR', 'KP', 'SY', 'T1']);
  assert.equal(EEA_UK_CH.length, 44);
  assert.equal(new Set(EEA_UK_CH).size, 44);
  for (const c of ['SJ', 'GB', 'CH', 'NO', 'IS', 'LI', 'GF', 'AX', 'GI', 'JE', 'GG', 'IM', 'DE']) assert.ok(EEA_UK_CH.includes(c), c);
  assert.equal(SLOT_GUARD_MS, 3000);
  assert.equal(REPLY_MAX_AGE_MS, DAY);
});

test('cooldown is 4 s and a rejected call does not reset it', () => {
  const e = setup();
  const a = e.req('A');
  assert.deepEqual(e.lim.reserve(a), go(0));
  e.lim.end(a);
  e.at(2 * S);
  assert.deepEqual(e.lim.reserve(e.req('A')), rl('cooldown', 2));
  e.at(3.5 * S);
  assert.deepEqual(e.lim.reserve(e.req('A')), rl('cooldown', 1));
  e.at(4 * S);
  assert.deepEqual(e.lim.reserve(e.req('A')), go(0));
});

test('pause path (V20): groq_busy with no offer, stamps the cooldown, counts no window or cap', () => {
  const e = setup();
  const x = e.req('X');
  e.lim.reserve(x);
  e.lim.end({ ...x, groqStatus: 429, retryAfter: '60' });
  e.at(S);
  const a = e.req('A');
  assert.deepEqual(e.lim.reserve(a), busy(59));
  assert.deepEqual(e.v('A').w, []);
  assert.equal(e.v('A').lastAt, T0 + S);
  assert.equal(e.g().groq, 1);
  assert.equal(e.t(a).state, 'DONE');
  e.at(3 * S);
  assert.deepEqual(e.lim.reserve(e.req('A')), rl('cooldown', 2));
});

test('visitor minute cap, and the site minute cap from a third ipKey (R4-33)', () => {
  const e = setup();
  for (const ms of [0, 4 * S]) {
    e.at(ms);
    const a = e.req('A');
    assert.equal(e.lim.reserve(a).type, 'go');
    e.lim.end(a);
  }
  e.at(8 * S);
  assert.deepEqual(e.lim.reserve(e.req('A')), rl('minute', 52));

  const f = setup();
  assert.deepEqual(f.lim.reserve(f.req('A')), go(0));
  assert.deepEqual(f.lim.reserve(f.req('B')), go(0));
  assert.deepEqual(f.lim.reserve(f.req('C')), rl('site_minute', 38));
});

test('with GROQ_SITE_PER_MIN=10 the visitor minute cap is 4', () => {
  const e = setup({ groqSitePerMin: 10 });
  for (let i = 0; i < 4; i++) {
    e.at(i * 4 * S);
    const a = e.req('A');
    assert.equal(e.lim.reserve(a).type, 'go');
    e.lim.end(a);
  }
  e.at(16 * S);
  assert.equal(e.lim.reserve(e.req('A')).scope, 'minute');
});

test('the 16th request in an hour and the 31st in a day are blocked, and write no slot', () => {
  const e = setup();
  for (let i = 0; i < 15; i++) {
    e.at(i * 32 * S);
    const a = e.req('A');
    assert.equal(e.lim.reserve(a).type, 'go', `turn ${i}`);
    e.lim.end(a);
  }
  e.at(15 * 32 * S);
  const before = e.snapshot();
  assert.equal(e.lim.reserve(e.req('A')).scope, 'hour');
  assert.equal(e.snapshot(), before);

  const d = setup();
  for (let i = 0; i < 30; i++) {
    d.at(i * 300 * S);
    const a = d.req('A');
    assert.equal(d.lim.reserve(a).type, 'go', `turn ${i}`);
    d.lim.end(a);
  }
  d.at(30 * 300 * S);
  const snap = d.snapshot();
  assert.equal(d.lim.reserve(d.req('A')).scope, 'day');
  assert.equal(d.snapshot(), snap);
});

test('the lease blocks a second concurrent turn; Groq lease 15 s after the slot, Gemini lease 20 s', () => {
  const e = setup();
  e.lim.reserve(e.req('A'));
  e.at(5 * S);
  assert.deepEqual(e.lim.reserve(e.req('A')), rl('concurrent', 10));
  e.at(15 * S);
  assert.equal(e.lim.reserve(e.req('A')).type, 'go');

  const g = setup({ groqSitePerMin: 10 });
  const r = gem(g, 'A');
  assert.deepEqual(g.v('A').lease, { turnId: `${r.sid}:${r.turnId}`, exp: T0 + 20 * S });
  assert.deepEqual(g.t(r), { state: 'GEMINI_IN_FLIGHT', exp: T0 + 20 * S, day: '2026-10-16', at: T0 });
  g.at(19 * S);
  assert.deepEqual(g.lim.reserve(g.req('A')), rl('concurrent', 1));
  g.at(20 * S);
  assert.equal(g.lim.reserve(g.req('A')).type, 'go');
});

test('lease ownership (R4-4): a late end or cancel of a lapsed turn leaves the newer lease alone', () => {
  const e = setup();
  const t1 = e.req('A');
  e.lim.reserve(t1);
  e.at(16 * S);
  const t2 = e.req('A');
  assert.deepEqual(e.lim.reserve(t2), go(0));
  e.at(17 * S);
  e.lim.cancel(t1);
  assert.equal(e.t(t1).state, 'DONE');
  assert.equal(e.g().groq, 2);
  assert.equal(e.keys().length, 2);
  e.lim.end(t1);
  assert.deepEqual(e.v('A').lease, { turnId: `${t2.sid}:${t2.turnId}`, exp: T0 + 31 * S });

  const f = setup();
  const u1 = f.req('A');
  f.lim.reserve(u1);
  f.at(16 * S);
  const u2 = f.req('A');
  f.lim.reserve(u2);
  f.lim.end(u1);
  assert.equal(f.t(u1).state, 'DONE');
  assert.equal(f.v('A').lease.turnId, `${u2.sid}:${u2.turnId}`);
});

test('site daily cap, Groq and Gemini counted separately', () => {
  const e = setup({ groqSitePerMin: 10, siteDailyCap: 3 });
  for (const ip of ['A', 'B', 'C']) assert.equal(e.lim.reserve(e.req(ip)).type, 'go');
  const before = e.snapshot();
  assert.deepEqual(e.lim.reserve(e.req('D')), {
    type: 'quota_exhausted', scope: 'site_daily', resetsAt: '2026-10-17T07:00:00.000Z',
  });
  assert.equal(e.snapshot(), before);

  // Gemini cap on its own: Gemini comes via reserve, and a capped Gemini turn takes the Groq route.
  const g = setup({ groqSitePerMin: 10, geminiDailyCap: 1 });
  gem(g, 'A');
  assert.equal(g.g().groq, 0);
  assert.equal(g.g().gemini, 1);
  assert.deepEqual(g.lim.reserve(g.req('B', { gemini: true })), go(0));
  assert.equal(g.g().groq, 1);
  assert.equal(g.g().gemini, 1);

  // Site cap on the sum, for both routes.
  const s = setup({ groqSitePerMin: 10, siteDailyCap: 2 });
  gem(s, 'A');
  assert.deepEqual(s.lim.reserve(s.req('B')), go(0));
  assert.equal(s.lim.reserve(s.req('C')).scope, 'site_daily');
  assert.equal(s.lim.reserve(s.req('D', { gemini: true })).scope, 'site_daily');
});

test('Groq pause length (R4-28)', () => {
  assert.equal(pauseMs('30'), 30 * S);
  assert.equal(pauseMs('3600'), H);
  assert.equal(pauseMs('200000'), DAY);
  assert.equal(pauseMs(null), 20 * S);
  assert.equal(pauseMs(undefined), 20 * S);
  assert.equal(pauseMs('soon'), 20 * S);
  assert.equal(pauseMs('Wed, 21 Oct 2026 07:28:00 GMT'), 20 * S);

  const e = setup();
  const x = e.req('X');
  e.lim.reserve(x);
  e.lim.end({ ...x, groqStatus: 429, retryAfter: '3600' });
  e.at(5 * S);
  e.lim.end({ ...x, groqStatus: 429, retryAfter: null });
  assert.equal(e.g().groqBlockedUntil, T0 + H);
});

test('queue slot math and FIFO (R4-3)', () => {
  const e = setup();
  assert.deepEqual(e.lim.reserve(e.req('A')), go(0));
  assert.deepEqual(e.lim.reserve(e.req('B')), go(0));
  assert.deepEqual(e.lim.reserve(e.req('C')), rl('site_minute', 38));
  e.at(40 * S);
  assert.deepEqual(e.lim.reserve(e.req('D')), go(23 * S));
  e.at(41 * S);
  assert.deepEqual(e.lim.reserve(e.req('E')), go(22 * S));
  assert.equal(e.lim.reserve(e.req('F')).scope, 'site_minute');
});

test('ended turns keep their slot until it ages out (R5-30)', () => {
  const e = setup();
  const a = e.req('A');
  const b = e.req('B');
  e.lim.reserve(a);
  e.lim.reserve(b);
  e.at(5 * S);
  e.lim.end(a);
  e.lim.end(b);
  assert.equal(e.keys().length, 2);
  e.at(20 * S);
  assert.deepEqual(e.lim.reserve(e.req('C')), rl('site_minute', 18));
  e.at(63 * S + 1);
  const d = e.req('D');
  assert.deepEqual(e.lim.reserve(d), go(0));
  assert.deepEqual(e.keys(), [`${d.sid}:${d.turnId}`]);
});

test('same turnId in two sessions (R5-32): cancel removes only its own entry', () => {
  const e = setup();
  const x = { ...e.req('A'), sid: 'X', turnId: 'T' };
  const y = { ...e.req('B'), sid: 'Y', turnId: 'T' };
  e.lim.reserve(x);
  e.lim.reserve(y);
  e.lim.cancel(y);
  assert.deepEqual(e.keys(), ['X:T']);
});

test('depth cap: the fifth waiting turn gets queue_full and nothing is counted', () => {
  const e = setup({ groqSitePerMin: 10, maxQueueDepth: 4 });
  const z = e.req('Z');
  e.lim.reserve(z);
  e.lim.end({ ...z, groqStatus: 429, retryAfter: '10' });
  for (const ip of ['A', 'B', 'C', 'D']) assert.deepEqual(e.lim.reserve(e.req(ip)), go(10 * S));
  const before = e.snapshot();
  assert.deepEqual(e.lim.reserve(e.req('E')), rl('queue_full', 10));
  assert.equal(e.snapshot(), before);
  assert.equal(e.v('E'), undefined);
});

test('MAX_QUEUE_WAIT=0 refuses any turn that would wait', () => {
  const e = setup({ maxQueueWait: 0 });
  e.lim.reserve(e.req('A'));
  e.lim.reserve(e.req('B'));
  assert.deepEqual(e.lim.reserve(e.req('C')), rl('site_minute', 63));
});

test('short pause queues to its end; long pause takes the pause branch with no counters', () => {
  const e = setup();
  const x = e.req('X');
  e.lim.reserve(x);
  e.lim.end({ ...x, groqStatus: 429, retryAfter: '20' });
  assert.deepEqual(e.lim.reserve(e.req('A')), go(20 * S));

  const f = setup();
  const y = f.req('X');
  f.lim.reserve(y);
  f.lim.end({ ...y, groqStatus: 429, retryAfter: '26' });
  assert.equal(f.lim.reserve(f.req('A')).reason, 'groq_busy');
  assert.equal(f.g().groq, 1);
  assert.equal(f.keys().length, 1);
  assert.deepEqual(f.v('A').w, []);
});

test('visitor limits and the daily cap are never queued and write no slot', () => {
  const cases = [
    ['cooldown', {}, (e) => { const a = e.req('A'); e.lim.reserve(a); e.lim.end(a); e.at(S); }],
    ['concurrent', {}, (e) => { e.lim.reserve(e.req('A')); e.at(5 * S); }],
    ['minute', {}, (e) => {
      for (const ms of [0, 4 * S]) { e.at(ms); const a = e.req('A'); e.lim.reserve(a); e.lim.end(a); }
      e.at(8 * S);
    }],
    ['site_daily', { siteDailyCap: 1 }, (e) => { e.lim.end(e.req('B')); e.lim.reserve(e.req('B')); e.at(5 * S); }],
  ];
  for (const [scope, over, prep] of cases) {
    const e = setup(over);
    prep(e);
    const before = e.snapshot();
    assert.equal(e.lim.reserve(e.req('A')).scope, scope);
    assert.equal(e.snapshot(), before, scope);
  }
});

test('cancel (R4-1, R4-6)', () => {
  const e = setup();
  e.lim.reserve(e.req('P'));
  e.lim.reserve(e.req('Q'));
  e.at(40 * S);
  const a = e.req('A');
  assert.deepEqual(e.lim.reserve(a), go(23 * S));
  assert.equal(e.g().groq, 3);
  e.at(41 * S);
  e.lim.cancel(a);
  assert.ok(!e.keys().includes(`${a.sid}:${a.turnId}`));
  assert.equal(e.g().groq, 2);
  assert.deepEqual(e.v('A').w, [T0 + 40 * S]);
  assert.equal(e.v('A').lease, null);
  assert.equal(e.t(a).state, 'DONE');
  e.at(42 * S);
  assert.equal(e.lim.reserve(e.req('A')).scope, 'cooldown');
  // A second cancel refunds nothing; end after cancel is a no-op.
  const before = e.snapshot();
  e.lim.cancel(a);
  e.lim.end(a);
  assert.equal(e.snapshot(), before);
  // Reusing the cancelled turnId gives turn_reused.
  e.at(50 * S);
  assert.deepEqual(e.lim.reserve(a), { type: 'invalid_request', error: 'turn_reused' });
});

test('a cancel at slotAt + 1 ms frees the slot and refunds the day counts', () => {
  const e = setup();
  const a = e.req('A');
  e.lim.reserve(a);
  e.at(1);
  e.lim.cancel(a);
  assert.deepEqual(e.keys(), []);
  assert.equal(e.g().groq, 0);
});

test('a cancel after a Pacific-day rollover refunds no daily counter', () => {
  const late = Date.UTC(2026, 9, 17, 6, 59, 59); // 23:59:59 PDT
  const e = setup({}, late);
  const a = e.req('A');
  e.lim.reserve(a);
  e.at(2 * S);
  e.lim.reserve(e.req('B'));
  assert.equal(e.g().day, '2026-10-17');
  assert.equal(e.g().groq, 1);
  e.at(3 * S);
  e.lim.cancel(a);
  assert.equal(e.g().groq, 1);
});

test('reserve-then-cancel cycles spend the visitor windows (R5-6)', () => {
  const e = setup();
  for (const ms of [0, 4 * S]) {
    e.at(ms);
    const a = e.req('A');
    assert.equal(e.lim.reserve(a).type, 'go');
    e.lim.cancel(a);
  }
  e.at(8 * S);
  assert.equal(e.lim.reserve(e.req('A')).scope, 'minute');

  const f = setup();
  for (let i = 0; i < 15; i++) {
    f.at(i * 31 * S);
    const b = f.req('B');
    assert.equal(f.lim.reserve(b).type, 'go', `cycle ${i}`);
    f.lim.cancel(b);
  }
  f.at(15 * 31 * S);
  assert.equal(f.lim.reserve(f.req('B')).scope, 'hour');
  assert.equal(f.g().groq, 0);
});

test('claim: go, re-queue then go (R5-1), lapsed turn', () => {
  const e = setup();
  e.lim.reserve(e.req('P'));
  e.lim.reserve(e.req('Q'));
  e.at(40 * S);
  const d = e.req('D');
  e.lim.reserve(d);
  e.at(60 * S);
  assert.deepEqual(e.lim.claim(d), cgo(3 * S)); // an early claim never goes before its slot
  e.at(63 * S);
  assert.deepEqual(e.lim.claim(d), cgo(0));

  const f = setup({ groqSitePerMin: 10 });
  const b = f.req('B');
  f.lim.reserve(b);
  f.lim.end({ ...b, groqStatus: 429, retryAfter: '5' });
  const a = f.req('A');
  assert.deepEqual(f.lim.reserve(a), go(5 * S));
  const c = f.req('C');
  assert.deepEqual(f.lim.reserve(c), go(5 * S));
  f.lim.end({ ...b, groqStatus: 429, retryAfter: '25' });
  f.at(5 * S);
  const key = `${a.sid}:${a.turnId}`;
  assert.deepEqual(f.lim.claim(a), cgo(20 * S));
  const S1 = f.g().S;
  assert.deepEqual(S1.at(-1), [T0 + 25 * S, key]);
  assert.deepEqual(S1.map(([at]) => at), S1.map(([at]) => at).toSorted((x, y) => x - y));
  assert.equal(f.t(a).slotAt, T0 + 25 * S);
  assert.equal(f.t(a).exp, T0 + 40 * S);
  assert.equal(f.v('A').lease.exp, T0 + 40 * S);
  f.at(25 * S);
  assert.deepEqual(f.lim.claim(a), cgo(0));
  f.lim.end(a);
  assert.equal(f.v('A').lease, null);
  assert.equal(f.t(a).state, 'DONE');

  const l = setup();
  const x = l.req('X');
  l.lim.reserve(x);
  l.at(15 * S);
  assert.deepEqual(l.lim.claim(x), { type: 'provider_unavailable', reason: 'groq_failed' });
});

test('claim with a long pause (R5-31): refund, keep cooldown, release lease, then groq_busy', () => {
  const e = setup({ groqSitePerMin: 10 });
  const b = e.req('B');
  e.lim.reserve(b);
  e.lim.end({ ...b, groqStatus: 429, retryAfter: '5' });
  const a = e.req('A');
  assert.deepEqual(e.lim.reserve(a), go(5 * S));
  e.lim.end({ ...b, groqStatus: 429, retryAfter: '100' });
  e.at(5 * S);
  const groqBefore = e.g().groq;
  assert.deepEqual(e.lim.claim(a), busy(95));
  assert.ok(!e.keys().includes(`${a.sid}:${a.turnId}`));
  assert.equal(e.g().groq, groqBefore - 1);
  assert.deepEqual(e.v('A').w, []);
  assert.equal(e.v('A').lastAt, T0);
  assert.equal(e.v('A').lease, null);
  assert.equal(e.t(a).state, 'DONE');
  e.at(9 * S);
  assert.equal(e.lim.reserve(e.req('A')).reason, 'groq_busy');
});

test('shared slot time (R5-1): cancelling one turn keeps the other entry and lease', () => {
  const e = setup();
  e.lim.reserve(e.req('P'));
  e.lim.reserve(e.req('Q'));
  e.at(40 * S);
  const d = e.req('D');
  e.lim.reserve(d);
  e.at(41 * S);
  const f = e.req('E');
  e.lim.reserve(f);
  e.lim.cancel(d);
  assert.deepEqual(e.g().S.at(-1), [T0 + 63 * S, `${f.sid}:${f.turnId}`]);
  assert.equal(e.v('E').lease.turnId, `${f.sid}:${f.turnId}`);
});

test('no double count; a repeat while queued gives concurrent', () => {
  const e = setup();
  e.lim.reserve(e.req('P'));
  e.lim.reserve(e.req('Q'));
  e.at(40 * S);
  const a = e.req('A');
  e.lim.reserve(a);
  const before = e.snapshot();
  assert.deepEqual(e.lim.reserve(a), rl('concurrent', 38));
  assert.equal(e.snapshot(), before);
  e.at(63 * S);
  e.lim.claim(a);
  e.lim.end(a);
  assert.equal(e.g().groq, 3);
  assert.deepEqual(e.v('A').w, [T0 + 40 * S]);
});

test('lease TTL follows the slot: +20 s slot holds until +35 s', () => {
  const e = setup({ groqSitePerMin: 10 });
  const x = e.req('X');
  e.lim.reserve(x);
  e.lim.end({ ...x, groqStatus: 429, retryAfter: '20' });
  assert.deepEqual(e.lim.reserve(e.req('A')), go(20 * S));
  e.at(30 * S);
  assert.deepEqual(e.lim.reserve(e.req('A')), rl('concurrent', 5));
  e.at(36 * S);
  assert.equal(e.lim.reserve(e.req('A')).type, 'go');
});

test('DO clock (R4-2): a 429 after a queued wait pauses from the end time', () => {
  const e = setup({ groqSitePerMin: 10 });
  const x = e.req('X');
  e.lim.reserve(x);
  e.lim.end({ ...x, groqStatus: 429, retryAfter: '20' });
  const a = e.req('A');
  assert.deepEqual(e.lim.reserve(a), go(20 * S));
  e.at(20 * S);
  assert.deepEqual(e.lim.claim(a), cgo(0));
  e.at(21 * S);
  e.lim.end({ ...a, groqStatus: 429, retryAfter: '30' });
  assert.equal(e.g().groqBlockedUntil, T0 + 51 * S);
});

test('reserve routes Gemini only if gemini, no latch or pause, room under both caps; otherwise Groq', () => {
  const e = setup({ groqSitePerMin: 10 });
  assert.deepEqual(e.lim.reserve(e.req('A', { gemini: true })), GEMINI_GO);
  // Only a strict boolean true selects Gemini.
  for (const [ip, gemini] of [['B', false], ['C', 'eligible'], ['D', 1], ['E', undefined]]) {
    assert.deepEqual(e.lim.reserve(e.req(ip, { gemini })), go(0), ip);
  }
  assert.equal(e.g().gemini, 1);
  assert.equal(e.g().groq, 4);

  // Gemini pause or latch → Groq.
  for (const blockedFor of [S, DAY]) {
    const f = setup();
    f.store.put('g', { day: '2026-10-16', groq: 0, gemini: 0, S: [], groqBlockedUntil: 0, geminiBlockedUntil: T0 + blockedFor });
    assert.deepEqual(f.lim.reserve(f.req('A', { gemini: true })), go(0));
    f.at(blockedFor);
    assert.deepEqual(f.lim.reserve(f.req('B', { gemini: true })), GEMINI_GO);
  }

  // A long Groq pause does not stop the Gemini route; the Groq route gets groq_busy.
  const p = setup();
  pauseGroq(p, 100);
  assert.deepEqual(p.lim.reserve(p.req('A', { gemini: true })), GEMINI_GO);
  assert.deepEqual(p.lim.reserve(p.req('B')), busy(100));
});

test('a Gemini-route turn counts one window entry and stamps the cooldown', () => {
  const e = setup();
  const a = gem(e, 'A');
  assert.deepEqual(e.v('A').w, [T0]);
  assert.equal(e.v('A').lastAt, T0);
  e.lim.end({ ...a, googleStatus: 200 });
  assert.equal(e.v('A').lease, null);
  assert.equal(e.t(a).state, 'DONE');
  e.at(2 * S);
  assert.deepEqual(e.lim.reserve(e.req('A', { gemini: true })), rl('cooldown', 2));
  e.at(4 * S);
  e.lim.end(gem(e, 'A'));
  e.at(8 * S);
  assert.deepEqual(e.lim.reserve(e.req('A', { gemini: true })), rl('minute', 52));
});

test('fallback: hop to Groq extends lease and exp in one write, no window entry, groq++', () => {
  const e = setup();
  e.lim.reserve(e.req('P'));
  e.lim.reserve(e.req('Q'));
  e.at(50 * S);
  const a = gem(e, 'A');
  const key = `${a.sid}:${a.turnId}`;
  assert.deepEqual(e.lim.fallback({ ...a, googleStatus: 500 }), go(13 * S));
  assert.deepEqual(e.t(a), {
    state: 'IN_FLIGHT', exp: T0 + 78 * S, slotAt: T0 + 63 * S, reservedAt: T0 + 50 * S, day: '2026-10-16', hop: true,
    at: T0 + 50 * S,
  });
  assert.deepEqual(e.v('A').lease, { turnId: key, exp: T0 + 78 * S });
  assert.deepEqual(e.v('A').w, [T0 + 50 * S]);
  assert.deepEqual(e.g().S.at(-1), [T0 + 63 * S, key]);
  assert.equal(e.g().groq, 3);
  assert.equal(e.g().gemini, 1);
  assert.equal(e.g().geminiBlockedUntil, 0);
  e.at(63 * S);
  assert.deepEqual(e.lim.claim(a), cgo(0));
  e.lim.end(a);
  assert.equal(e.v('A').lease, null);
  assert.equal(e.t(a).state, 'DONE');
});

test('fallback only from an unexpired GEMINI_IN_FLIGHT, once', () => {
  const e = setup({ groqSitePerMin: 10 });
  const a = gem(e, 'A');
  assert.deepEqual(e.lim.fallback({ ...a, googleStatus: 503 }), go(0));
  const S1 = e.g().S;
  assert.deepEqual(e.lim.fallback({ ...a, googleStatus: 503 }), { type: 'provider_unavailable', reason: 'gemini_failed' });
  assert.deepEqual(e.g().S, S1);
  assert.equal(e.g().groq, 1);

  // A Groq-route turn, a missing turn and a lapsed Gemini turn: gemini_failed, DONE, no slot, lease untouched.
  const b = e.req('B');
  e.lim.reserve(b);
  assert.equal(e.lim.fallback({ ...b, googleStatus: 500 }).reason, 'gemini_failed');
  assert.equal(e.t(b).state, 'DONE');
  const missing = e.req('C');
  assert.equal(e.lim.fallback({ ...missing, googleStatus: 500 }).reason, 'gemini_failed');
  assert.equal(e.t(missing).state, 'DONE');
  const d = gem(e, 'D');
  e.at(20 * S);
  const lease = e.v('D').lease;
  const groq = e.g().groq;
  assert.equal(e.lim.fallback({ ...d, googleStatus: 500 }).reason, 'gemini_failed');
  assert.equal(e.t(d).state, 'DONE');
  assert.deepEqual(e.v('D').lease, lease);
  assert.equal(e.g().groq, groq);
  assert.ok(!e.keys().includes(`${d.sid}:${d.turnId}`));
});

test('fallback refusals: site cap → quota_exhausted; pause, depth or wait beyond HOP_WAIT_MS → groq_busy', () => {
  const refused = (e, a, expected) => {
    assert.deepEqual(e.lim.fallback({ ...a, googleStatus: 500 }), expected);
    assert.equal(e.t(a).state, 'DONE');
    assert.equal(e.v(a.ipKey).lease, null);
    assert.ok(!e.keys().includes(`${a.sid}:${a.turnId}`));
  };
  const cap = setup({ siteDailyCap: 1 });
  refused(cap, gem(cap, 'A'), { type: 'quota_exhausted', scope: 'site_daily', resetsAt: '2026-10-17T07:00:00.000Z' });
  assert.equal(cap.g().groq, 0);

  // Pause: 15 s fits the hop bound, 16 s does not (MAX_QUEUE_WAIT=25, so the bound is 15 s).
  const ok = setup();
  pauseGroq(ok, 15);
  assert.deepEqual(ok.lim.fallback({ ...gem(ok, 'A'), googleStatus: 500 }), go(15 * S));
  const pause = setup();
  pauseGroq(pause, 16);
  refused(pause, gem(pause, 'A'), busy(16));
  assert.equal(pause.g().groq, 0);

  // With MAX_QUEUE_WAIT=0 the hop must get an immediate slot.
  const zero = setup({ maxQueueWait: 0 });
  pauseGroq(zero, 1);
  refused(zero, gem(zero, 'A'), busy(1));

  // Rolling-minute wait beyond the bound.
  const wait = setup();
  wait.lim.reserve(wait.req('P'));
  wait.lim.reserve(wait.req('Q'));
  wait.at(40 * S);
  refused(wait, gem(wait, 'A'), busy(23));

  // Depth.
  const depth = setup({ groqSitePerMin: 10, maxQueueDepth: 1 });
  pauseGroq(depth, 10);
  assert.deepEqual(depth.lim.reserve(depth.req('B')), go(10 * S));
  refused(depth, gem(depth, 'A'), busy(10));
});

test('Gemini 429 sets a short pause; 401 and 403 set the 24 h latch (R5-24); both route to Groq', () => {
  for (const [status, retryAfter, until] of [
    [429, '30', T0 + 30 * S], [429, undefined, T0 + 20 * S], [429, 3600, T0 + H],
    [401, undefined, T0 + DAY], [403, undefined, T0 + DAY], [500, undefined, 0], [400, undefined, 0], [404, undefined, 0],
  ]) {
    for (const op of ['fallback', 'end']) {
      const e = setup({ groqSitePerMin: 10 });
      const a = gem(e, 'A');
      e.lim[op]({ ...a, googleStatus: status, retryAfter });
      assert.equal(e.g().geminiBlockedUntil, until, `${op} ${status}`);
      assert.equal(e.g().groqBlockedUntil, 0);
      const b = e.req('B', { gemini: true });
      assert.deepEqual(e.lim.reserve(b), until ? go(0) : GEMINI_GO, `${op} ${status}`);
    }
  }

  // The latch only extends, and expires on time.
  const f = setup();
  f.lim.end({ ipKey: 'Z', sid: 'z', turnId: 'z', googleStatus: 403 });
  f.at(H);
  f.lim.end({ ipKey: 'Z', sid: 'z', turnId: 'z', googleStatus: 403 });
  f.lim.end({ ipKey: 'Z', sid: 'z', turnId: 'z', googleStatus: 429, retryAfter: '5' });
  assert.equal(f.g().geminiBlockedUntil, T0 + H + DAY);
  f.at(H + DAY - 1);
  assert.deepEqual(f.lim.reserve(f.req('A', { gemini: true })), go(0));
  f.at(H + DAY);
  assert.deepEqual(f.lim.reserve(f.req('B', { gemini: true })), GEMINI_GO);
});

test('end: groqStatus 429 sets the Groq pause, googleStatus 429 the Gemini pause, neither touches the other', () => {
  const e = setup();
  const a = e.req('A');
  e.lim.reserve(a);
  e.lim.end({ ...a, groqStatus: 429, retryAfter: '40' });
  assert.equal(e.g().groqBlockedUntil, T0 + 40 * S);
  assert.equal(e.g().geminiBlockedUntil, 0);
  assert.equal(e.v('A').lease, null);
  assert.equal(e.t(a).state, 'DONE');

  const f = setup();
  const b = gem(f, 'B');
  f.lim.end({ ...b, googleStatus: 429, retryAfter: '40' });
  assert.equal(f.g().geminiBlockedUntil, T0 + 40 * S);
  assert.equal(f.g().groqBlockedUntil, 0);
  assert.equal(f.v('B').lease, null);

  // Other statuses, and a plain end, change no pause.
  const g = setup();
  for (const extra of [{}, { groqStatus: 500 }, { groqStatus: 401 }, { googleStatus: 200 }, { googleStatus: 500 }]) {
    g.lim.end({ ipKey: 'Z', sid: 'z', turnId: 'z', retryAfter: '40', ...extra });
  }
  assert.equal(g.g(), undefined);
});

test('claim on a hop turn uses the hop bound and does not refund the visitor window', () => {
  const run = (pauseTo) => {
    const e = setup({ groqSitePerMin: 10 });
    pauseGroq(e, 10);
    const a = gem(e, 'A');
    assert.deepEqual(e.lim.fallback({ ...a, googleStatus: 500 }), go(10 * S));
    pauseGroq(e, pauseTo);
    e.at(10 * S);
    return { e, a, r: e.lim.claim(a) };
  };
  // 14 s from the hop is within 15 s: re-queued.
  const ok = run(14);
  assert.deepEqual(ok.r, cgo(4 * S));
  assert.equal(ok.e.t(ok.a).exp, T0 + 29 * S);
  assert.equal(ok.e.v('A').lease.exp, T0 + 29 * S);

  // 20 s from the hop fits MAX_QUEUE_WAIT (25 s) but not the hop bound: groq_busy, refund the slot, keep the window.
  const { e, a, r } = run(20);
  assert.deepEqual(r, busy(10));
  assert.ok(!e.keys().includes(`${a.sid}:${a.turnId}`));
  assert.equal(e.g().groq, 0);
  assert.equal(e.g().gemini, 1);
  assert.deepEqual(e.v('A').w, [T0]);
  assert.equal(e.v('A').lease, null);
  assert.equal(e.t(a).state, 'DONE');
});

test('consent writes c:<sid> and nothing else; a malformed request throws', () => {
  const e = setup();
  e.at(5 * S);
  assert.equal(e.lim.consent({ sid: 's1', consentVersion: AKI_CONSENT_VERSION, gemini: true, country: 'US' }), null);
  assert.deepEqual([...e.store.list()], [['c:s1', {
    sid: 's1', consentVersion: AKI_CONSENT_VERSION, ack18: true, gemini: true, confirmedAt: T0 + 5 * S, country: 'US',
  }]]);
  e.lim.consent({ sid: 's1', consentVersion: AKI_CONSENT_VERSION, gemini: false, country: 'GB' });
  assert.equal(e.store.get('c:s1').gemini, false);
  for (const bad of [
    { consentVersion: 'v', gemini: true }, { sid: '', consentVersion: 'v', gemini: true },
    { sid: 's', gemini: true }, { sid: 's', consentVersion: 'v', gemini: 'true' }, { sid: 's', consentVersion: 'v' },
  ]) {
    assert.throws(() => e.lim.consent(bad), TypeError);
  }
  assert.equal([...e.store.list()].length, 1);
});

test('OPS names the RPC methods the Limiter DO must expose', () => {
  assert.deepEqual(Object.keys(OPS), ['reserve', 'claim', 'cancel', 'end', 'fallback', 'consent']);
});

test('Pacific day: rollover resets the site counters; resetsAt is the next Pacific midnight across DST', () => {
  const late = Date.UTC(2026, 9, 17, 6, 59, 0); // 23:59 PDT
  const e = setup({ siteDailyCap: 1 }, late);
  e.lim.reserve(e.req('A'));
  e.at(30 * S);
  assert.deepEqual(e.lim.reserve(e.req('B')), {
    type: 'quota_exhausted', scope: 'site_daily', resetsAt: '2026-10-17T07:00:00.000Z',
  });
  e.at(90 * S);
  assert.equal(e.lim.reserve(e.req('C')).type, 'go');

  assert.equal(pacificDay(Date.UTC(2026, 9, 17, 6, 59, 59)), '2026-10-16');
  assert.equal(pacificDay(Date.UTC(2026, 9, 17, 7, 0, 0)), '2026-10-17');
  assert.equal(nextPacificMidnight(Date.UTC(2026, 10, 1, 6)), Date.UTC(2026, 10, 1, 7)); // Oct 31 23:00 PDT
  assert.equal(nextPacificMidnight(Date.UTC(2026, 10, 1, 12)), Date.UTC(2026, 10, 2, 8)); // Nov 1 04:00 PST
  assert.equal(nextPacificMidnight(Date.UTC(2026, 2, 8, 9, 30)), Date.UTC(2026, 2, 9, 7)); // Mar 8 01:30 PST
  assert.equal(nextPacificMidnight(Date.UTC(2026, 2, 8, 7)), Date.UTC(2026, 2, 8, 8)); // Mar 7 23:00 PST
});

test('IPv6 addresses in the same /64 share a key; IPv4 is kept whole', () => {
  assert.equal(ipPrefix('2001:db8:1:2:aaaa::1'), ipPrefix('2001:0DB8:0001:0002:ffff:ffff:ffff:ffff'));
  assert.equal(ipPrefix('2001:db8:1:2::'), '2001:db8:1:2::/64');
  assert.notEqual(ipPrefix('2001:db8:1:3::1'), ipPrefix('2001:db8:1:2::1'));
  assert.equal(ipPrefix('2001:db8::1'), '2001:db8:0:0::/64');
  assert.equal(ipPrefix('203.0.113.5'), '203.0.113.5');
  assert.equal(ipPrefix('::ffff:203.0.113.5'), '203.0.113.5');
});

test('turn records: IN_FLIGHT expires, DONE reuse is 409 until it expires, the key includes sid', () => {
  const e = setup({ groqSitePerMin: 10 });
  const a = e.req('A');
  e.lim.reserve(a);
  e.lim.end(a);
  e.at(5 * S);
  assert.deepEqual(e.lim.reserve(a), { type: 'invalid_request', error: 'turn_reused' });
  assert.equal(e.lim.reserve({ ...a, ipKey: 'B', sid: 'other' }).type, 'go');
  e.at(10 * 60 * S);
  assert.equal(e.lim.reserve(a).type, 'go');

  const lapsed = e.req('C');
  e.lim.reserve(lapsed);
  e.at(10 * 60 * S + 15 * S);
  assert.equal(e.lim.claim(lapsed).reason, 'groq_failed');
  e.at(10 * 60 * S + 20 * S);
  assert.equal(e.lim.reserve(lapsed).error, 'turn_reused');
});

test('hourly cleanup (R5-17): c:<sid> at 24 h after confirmedAt, visitors and turns at 47 h', () => {
  const e = setup();
  const put = (k, rec) => e.store.put(k, rec);
  const now = T0 + 100 * H;
  e.at(100 * H - DAY - 1);
  e.lim.consent({ sid: 'old', consentVersion: 'v', gemini: true, country: 'US' });
  e.at(100 * H - DAY + 60 * S);
  e.lim.consent({ sid: 'new', consentVersion: 'v', gemini: false, country: 'US' });
  e.at(100 * H);
  for (const p of ['v', 't']) {
    put(`${p}:old`, { at: now - 47 * H - 1 });
    put(`${p}:new`, { at: now - 47 * H + 120 * S });
  }
  put('g', { day: 'x', groq: 0, gemini: 0, S: [], groqBlockedUntil: 0, geminiBlockedUntil: 0 });
  assert.equal(e.lim.cleanup(), 3);
  assert.deepEqual([...e.store.list()].map(([k]) => k).sort(), ['c:new', 'g', 't:new', 'v:new']);
  e.at(100 * H + 60 * S);
  assert.equal(e.lim.cleanup(), 1);
  assert.equal(e.store.get('c:new'), undefined);

  // Records carry their last write time.
  const f = setup();
  const a = f.req('A');
  f.at(7 * S);
  f.lim.reserve(a);
  assert.equal(f.v('A').at, T0 + 7 * S);
  assert.equal(f.t(a).at, T0 + 7 * S);
});

test('fails closed on an invalid cfg', () => {
  assert.throws(() => reserve({}, T0, { ...BASE, groqSitePerMin: undefined }, { sid: 's', turnId: 't' }));
  assert.throws(() => reserve({}, T0, { ...BASE, maxQueueDepth: 0 }, { sid: 's', turnId: 't' }));
  // A missing Gemini cap never selects Gemini.
  const e = setup({ groqSitePerMin: 10, geminiDailyCap: undefined });
  assert.deepEqual(e.lim.reserve(e.req('A', { gemini: true })), go(0));
  assert.equal(e.g().gemini, 0);
});

test('property: the site Groq cap is never exceeded, with Gemini hops interleaved (Q2, R4-3, R5-1, R5-30, R5-33)', () => {
  const stats = { requeue: 0, cancel: 0, pause: 0, busy: 0, gemini: 0, hop: 0, hopRefused: 0 };
  // Several seeds: a re-queue or a hop that fits its bound is rare in any one saturated run.
  for (const start of [20261016, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    let seed = start;
    const geminiBefore = stats.gemini;
    const count = (k) => { stats[k]++; };
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const cap = 2;
    const e = setup({ groqSitePerMin: cap, maxQueueWait: 25, maxQueueDepth: 4 });
    const ipOf = new Map();
    const arrivals = Array.from({ length: 200 }, () => Math.floor(rand() * 600 * S)).sort((x, y) => x - y);
    const pending = [];
    const calls = [];
    const handed = [];
    let now = 0;

    const check = () => {
      const entries = e.g()?.S ?? [];
      const keys = entries.map(([, k]) => k);
      assert.equal(new Set(keys).size, keys.length, 'S unique by key');
      for (let i = 1; i < entries.length; i++) assert.ok(entries[i - 1][0] <= entries[i][0], 'S sorted');
      for (const [k, rec] of e.store.list()) {
        if (!k.startsWith('t:') || rec.state !== 'IN_FLIGHT' || rec.exp <= T0 + now) continue;
        const key = k.slice(2);
        const mine = entries.filter(([, kk]) => kk === key);
        assert.equal(mine.length, 1, `one entry for ${key}`);
        assert.equal(mine[0][0], rec.slotAt);
        assert.equal(rec.exp, rec.slotAt + 15 * S);
        const lease = e.v(ipOf.get(key)).lease;
        if (lease?.turnId === key) assert.equal(lease.exp, rec.exp);
      }
    };
    const call = (r) => {
      const t = e.t(r);
      assert.ok(T0 + now - t.reservedAt <= (t.hop ? 15 : 25) * S, 'waited within the bound');
      calls.push(t.slotAt);
      const x = rand();
      if (x < 0.15) {
        count('pause');
        e.lim.end({ ...r, groqStatus: 429, retryAfter: String(1 + Math.floor(rand() * 40)) });
      } else if (x < 0.85) {
        e.lim.end(r);
      } // else: lapse
      check();
    };

    let i = 0;
    while (i < arrivals.length || pending.length) {
      pending.sort((x, y) => x.wakeAt - y.wakeAt);
      if (pending.length && (i >= arrivals.length || pending[0].wakeAt <= arrivals[i])) {
        const p = pending.shift();
        now = p.wakeAt;
        e.at(now);
        if (p.gemini) {
          // The Gemini call returned: success, a failure that hops to Groq, or a lapse.
          const x = rand();
          if (x < 0.5) {
            const googleStatus = rand() < 0.3 ? 429 : 500;
            const res = e.lim.fallback({ ...p.r, googleStatus, retryAfter: String(Math.floor(rand() * 30)) });
            check();
            assert.equal(e.v(ipOf.get(`${p.r.sid}:${p.r.turnId}`)).w.filter((at) => at === T0 + p.reservedAt).length, 1);
            if (res.type !== 'go') { count('hopRefused'); continue; }
            count('hop');
            handed.push(now + res.waitMs);
            if (res.waitMs === 0) call(p.r);
            else pending.push({ r: p.r, wakeAt: now + res.waitMs });
          } else if (x < 0.9) {
            e.lim.end({ ...p.r, googleStatus: 200 });
            check();
          }
          continue;
        }
        if (rand() < 0.2) {
          count('cancel');
          e.lim.cancel(p.r);
          check();
          continue;
        }
        const res = e.lim.claim(p.r);
        check();
        if (res.type !== 'go') { count('busy'); continue; }
        if (res.waitMs === 0) { call(p.r); continue; }
        count('requeue');
        handed.push(now + res.waitMs);
        pending.push({ r: p.r, wakeAt: now + res.waitMs });
      } else {
        now = arrivals[i++];
        e.at(now);
        const ip = `ip${Math.floor(rand() * 20)}`;
        const r = e.req(ip, { gemini: rand() < 0.4 });
        ipOf.set(`${r.sid}:${r.turnId}`, ip);
        const res = e.lim.reserve(r);
        check();
        if (res.type !== 'go') continue;
        if (res.provider === 'gemini') {
          count('gemini');
          pending.push({ r, gemini: true, reservedAt: now, wakeAt: now + Math.floor(rand() * 12 * S) });
          continue;
        }
        handed.push(now + res.waitMs);
        if (res.waitMs === 0) call(r);
        else pending.push({ r, wakeAt: now + res.waitMs });
      }
    }

    for (let k = 1; k < handed.length; k++) assert.ok(handed[k - 1] <= handed[k], 'slots handed out in FIFO order');
    calls.sort((x, y) => x - y);
    for (let k = 0; k + cap < calls.length; k++) {
      assert.ok(calls[k + cap] - calls[k] >= 60 * S + SLOT_GUARD_MS, `calls ${k} and ${k + cap} spaced`);
    }
    assert.ok(e.g().gemini <= BASE.geminiDailyCap && e.g().gemini === stats.gemini - geminiBefore);
    assert.ok(e.g().groq + e.g().gemini <= BASE.siteDailyCap);
    assert.ok(calls.length >= 10, String(calls.length));
  }
  assert.ok(Object.values(stats).every((n) => n > 0), JSON.stringify(stats));
});

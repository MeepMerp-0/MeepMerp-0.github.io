import { AKI_CONSENT_VERSION } from '../../src/data/akiFaq.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { handle, signReply, signatureOk, readConfig } from '../src/app.js';
import { createLimiter, memoryStore, OPS, EEA_UK_CH, AI_BLOCKED, REPLY_MAX_AGE_MS } from '../src/limiter.js';
import { GROQ_PACK } from '../src/knowledge.js';
import { PROJECTS } from '../../src/data/portfolioData.js';

const CV = AKI_CONSENT_VERSION;

const T0 = Date.UTC(2026, 9, 16, 19, 0, 0);
const ORIGIN = 'https://meepmerp-0.github.io';
const SECRET = 's3cret';
const BASE_ENV = {
  GROQ_API_KEY: 'gk', SESSION_HMAC_SECRET: SECRET, IP_HASH_SECRET: 'ipsecret', TURNSTILE_SECRET: 'ts', GROQ_MODEL: 'm',
  ALLOWED_ORIGINS: `${ORIGIN},http://localhost:8888`, TURNSTILE_HOSTNAMES: 'meepmerp-0.github.io', TURNSTILE_ACTIONS: 'aki_session',
  SITE_DAILY_CAP: '60', GROQ_SITE_PER_MIN: '2', GROQ_MAX_COMPLETION_TOKENS: '600', MAX_QUEUE_WAIT: '25', MAX_QUEUE_DEPTH: '4',
  CONSENT_VERSION: CV,
};
const GEMINI_ENV = { GEMINI_ENABLED: 'true', GEMINI_MODEL: 'g', GEMINI_DAILY_CAP: '20', GEMINI_ALLOWED_COUNTRIES: 'US,CA', GEMINI_API_KEY: 'k' };
const PATHS = ['/v1/session', '/v1/chat', '/v1/region'];
const gate = (over = {}) => ({ turnstileToken: 'tok', ack18: true, geminiAck: false, consentVersion: CV, ...over });
const ok200 = (content = 'Hello there', finish = 'stop') =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: finish }] }), { status: 200 });

function makeApp(opts = {}) {
  const { env = {}, ip = '203.0.113.7', limiter: customLimiter } = opts;
  const country = 'country' in opts ? opts.country : 'US';
  const clock = { t: T0 };
  const now = () => clock.t;
  const real = createLimiter(memoryStore(), now);
  const limiterCalls = [];
  const consentCalls = [];
  const limiter = customLimiter ?? Object.fromEntries(Object.keys(OPS).map((op) => [
    op, (r) => (op === 'consent' ? consentCalls.push(r) : limiterCalls.push(op), real[op](r)),
  ]));
  const app = {
    clock, real, limiter, limiterCalls, consentCalls, fetchCalls: [], sleeps: [], waitUntils: [],
    env: { ...BASE_ENV, ...env },
    verify: { success: true, hostname: 'meepmerp-0.github.io', action: 'aki_session' },
    groq: () => ok200(),
    mid: crypto.randomUUID(),
    token: null,
  };
  app.fetch = async (url, init) => {
    app.fetchCalls.push({ url: String(url), init });
    if (String(url).includes('siteverify')) {
      if (app.verify instanceof Error) throw app.verify;
      return new Response(JSON.stringify(app.verify), { status: 200 });
    }
    if (String(url).includes('groq.com')) return app.groq();
    throw new Error(`unexpected fetch ${url}`);
  };
  app.groqCalls = () => app.fetchCalls.filter((c) => c.url.includes('groq.com'));
  app.lastGroq = () => JSON.parse(app.groqCalls().at(-1).init.body);
  app.history = () => app.lastGroq().messages.slice(1, -1);
  app.send = async (path, body, o = {}) => {
    const headers = { origin: ORIGIN, 'content-type': 'text/plain;charset=utf-8', ...(o.headers ?? {}) };
    if ('origin' in o) {
      if (o.origin === null) delete headers.origin;
      else headers.origin = o.origin;
    }
    const raw = o.raw ?? JSON.stringify(body);
    const request = new Request(`https://aki.example${path}`, { method: o.method ?? 'POST', headers, body: (o.method ?? 'POST') === 'POST' ? raw : undefined });
    const res = await handle(request, o.env ?? app.env, {
      limiter: app.limiter,
      fetch: app.fetch,
      sleep: o.sleep ?? (async (ms) => { app.sleeps.push(ms); clock.t += ms; }),
      signal: o.signal,
      waitUntil: (p) => { app.waitUntils.push(p); },
      country: 'country' in o ? o.country : country,
      ip: 'ip' in o ? o.ip : ip,
      now,
    });
    const text = await res.text();
    return { res, status: res.status, json: text ? JSON.parse(text) : null };
  };
  app.session = async (o = {}) => {
    const r = await app.send('/v1/session', gate(o.gate), o);
    assert.equal(r.json.type, 'session', JSON.stringify(r.json));
    app.token = r.json.sessionToken;
    return r;
  };
  app.chat = async (over = {}, o = {}) => {
    if (!app.token) await app.session();
    return app.send('/v1/chat', {
      sessionToken: app.token, turnId: crypto.randomUUID(), mid: app.mid, prevSig: '', message: 'hi', history: [], ...over,
    }, o);
  };
  app.tick = (ms = 5000) => { clock.t += ms; };
  return app;
}

const hmac64 = (secret, text) => createHmac('sha256', secret).update(text).digest('base64url');

/** A signed chain of (user, assistant) pairs; every pair carries the prevSig it was signed over. */
async function chain(app, pairs, { secret = SECRET, prev0 = '', mid = app.mid } = {}) {
  let prev = prev0;
  const out = [];
  for (const [i, p] of pairs.entries()) {
    const ts = p.ts ?? T0 - (pairs.length - i) * 1000;
    const sig = await signReply(secret, mid, prev, ts, p.u, p.a);
    out.push({ u: { role: 'user', content: p.u }, a: { role: 'assistant', content: p.a, sig, ts }, prev });
    prev = sig;
  }
  return out;
}
const flat = (ps) => ps.flatMap((p) => [p.u, p.a]);
const outbound = (app) => app.history().map((m) => [m.role, m.content]);
const expectOut = (app, ...pairs) => assert.deepEqual(outbound(app), pairs.flatMap((p) => [['user', p.u.content], ['assistant', p.a.content]]));
const cp = (s) => [...s].length;

// --- Groq replies ---

test('Groq 200 gives ai with a valid sig, the injected ts and the chainPrev used', async () => {
  const app = makeApp();
  const { json, status } = await app.chat();
  assert.equal(status, 200);
  assert.equal(json.type, 'ai');
  assert.equal(json.provider, 'groq');
  assert.equal(json.reply, 'Hello there');
  assert.equal(json.ts, T0);
  assert.equal(json.prevSig, '');
  assert.equal(json.sig.length, 43);
  assert.ok(await signatureOk(SECRET, json.sig, app.mid, '', T0, 'hi', 'Hello there'));
  const body = app.lastGroq();
  assert.equal(body.model, 'm');
  assert.equal(body.max_completion_tokens, 600);
  assert.equal(body.messages.at(-1).content, 'hi');
  assert.deepEqual(app.limiterCalls, ['reserve', 'end']);
});

test('a rejected limiter.end does not drop a delivered Groq reply', async () => {
  const app = makeApp();
  app.limiter = { ...app.limiter, end: async () => { throw new Error('do reset'); } };
  const r = await app.chat();
  assert.equal(r.json.type, 'ai');
  assert.equal(r.res.headers.get('access-control-allow-origin'), ORIGIN);
});

test('empty content and finish_reason length give groq_failed', async () => {
  for (const reply of [() => ok200('  '), () => ok200('cut off', 'length')]) {
    const app = makeApp();
    app.groq = reply;
    const { json } = await app.chat();
    assert.equal(json.type, 'provider_unavailable');
    assert.equal(json.reason, 'groq_failed');
    assert.equal(json.turnId.length, 36);
  }
});

test('429 retry-after 60 pauses; the next turn makes no fetch and reports groq_busy', async () => {
  const app = makeApp();
  app.groq = () => new Response('', { status: 429, headers: { 'retry-after': '60' } });
  assert.equal((await app.chat()).json.reason, 'groq_failed');
  app.tick();
  const { json } = await app.chat();
  assert.equal(json.reason, 'groq_busy');
  assert.ok(json.retryAfter >= 50 && json.retryAfter <= 60);
  assert.equal(app.groqCalls().length, 1);
});

test('429 retry-after 10: the next turn sleeps, claims, then calls Groq', async () => {
  const app = makeApp();
  app.groq = () => new Response('', { status: 429, headers: { 'retry-after': '10' } });
  await app.chat();
  app.groq = () => ok200();
  app.tick();
  const { json } = await app.chat();
  assert.equal(json.type, 'ai');
  assert.deepEqual(app.sleeps, [5000]);
  assert.equal(app.groqCalls().length, 2);
  assert.deepEqual(app.limiterCalls, ['reserve', 'end', 'reserve', 'claim', 'end']);
});

test('Groq 400, 401, 422, 500 and a timeout each give provider_unavailable', async () => {
  const cases = [() => new Response('', { status: 400 }), () => new Response('', { status: 401 }),
    () => new Response('', { status: 422 }), () => new Response('', { status: 500 }),
    () => { throw new DOMException('timed out', 'TimeoutError'); }];
  for (const groq of cases) {
    const app = makeApp();
    app.groq = groq;
    const { json } = await app.chat();
    assert.equal(json.type, 'provider_unavailable');
    assert.equal(json.reason, 'groq_failed');
    assert.equal(app.groqCalls().length, 1);
  }
});

// --- queue wait ---

const stubLimiter = (log, { reserve, claim }) => ({
  reserve: (r) => (log.push('reserve'), reserve(r)),
  claim: (r) => (log.push('claim'), claim(r)),
  cancel: () => (log.push('cancel'), null),
  end: () => (log.push('end'), null),
  fallback: () => (log.push('fallback'), { type: 'provider_unavailable', reason: 'gemini_failed' }),
  consent: () => null,
});

test('waitMs 20,000: sleep, then claim, then the Groq fetch', async () => {
  const log = [];
  const app = makeApp({ limiter: stubLimiter(log, { reserve: () => ({ type: 'go', waitMs: 20_000 }), claim: () => ({ type: 'go', waitMs: 0 }) }) });
  app.groq = () => (log.push('groq'), ok200());
  const { json } = await app.chat({}, { sleep: async (ms) => { log.push(`sleep:${ms}`); } });
  assert.equal(json.type, 'ai');
  assert.deepEqual(log, ['reserve', 'sleep:20000', 'claim', 'groq', 'end']);
});

test('aborting during the sleep cancels through waitUntil and makes no Groq fetch', async () => {
  for (const mode of ['rejects', 'resolves']) {
    const log = [];
    const app = makeApp({ limiter: stubLimiter(log, { reserve: () => ({ type: 'go', waitMs: 20_000 }), claim: () => ({ type: 'go', waitMs: 0 }) }) });
    const ac = new AbortController();
    const sleep = async () => {
      ac.abort();
      if (mode === 'rejects') throw new DOMException('aborted', 'AbortError');
    };
    await app.chat({}, { sleep, signal: ac.signal });
    await Promise.all(app.waitUntils);
    assert.deepEqual(log, ['reserve', 'cancel']);
    assert.equal(app.groqCalls().length, 0);
  }
});

test('waitMs 0 does not sleep and does not claim', async () => {
  const log = [];
  const app = makeApp({ limiter: stubLimiter(log, { reserve: () => ({ type: 'go', waitMs: 0 }), claim: () => assert.fail('claim') }) });
  await app.chat({}, { sleep: async () => assert.fail('sleep') });
  assert.deepEqual(log, ['reserve', 'end']);
});

test('a 429 reported while B waits means B makes no Groq fetch at its slot', async () => {
  const app = makeApp();
  app.groq = () => new Response('', { status: 429, headers: { 'retry-after': '20' } });
  await app.chat();
  assert.equal(app.groqCalls().length, 1);
  app.groq = () => ok200();
  app.tick();
  const b = await app.chat({}, {
    ip: '198.51.100.9',
    sleep: async (ms) => {
      app.real.end({ ipKey: 'other', sid: 'x', turnId: 'y', groqStatus: 429, retryAfter: '60' });
      app.clock.t += ms;
    },
  });
  assert.equal(b.json.type, 'provider_unavailable');
  assert.equal(b.json.reason, 'groq_busy');
  assert.equal(app.groqCalls().length, 1);
});

// --- message and body limits ---

test('message limits and bad shapes', async () => {
  const app = makeApp();
  await app.session();
  const chat = async (over) => (await app.chat(over)).json;
  assert.deepEqual(await chat({ message: 'x'.repeat(501) }), { type: 'invalid_request', error: 'message_too_long' });
  assert.deepEqual(await chat({ message: '  \n\t ' }), { type: 'invalid_request', error: 'empty_message' });
  for (const over of [{ turnId: 'nope' }, { mid: 'nope' }, { prevSig: 'short' }, { prevSig: 5 }, { message: 7 }, { history: 'x' }, { sessionToken: 5 }]) {
    assert.deepEqual(await chat(over), { type: 'invalid_request', error: 'bad_request' }, JSON.stringify(over));
  }
  assert.deepEqual((await app.send('/v1/chat', null, { raw: '{not json' })).json, { type: 'invalid_request', error: 'bad_request' });
  assert.deepEqual((await app.send('/v1/chat', null, { raw: '[1]' })).json, { type: 'invalid_request', error: 'bad_request' });
  assert.equal(app.groqCalls().length, 0);
});

test('500 emoji pass; padding spaces are trimmed from the outbound body', async () => {
  const app = makeApp();
  assert.equal((await app.chat({ message: '😀'.repeat(500) })).json.type, 'ai');
  app.tick();
  const padded = `${' '.repeat(5000)}${'a'.repeat(500)}${' '.repeat(5000)}`;
  assert.equal((await app.chat({ message: padded })).json.type, 'ai');
  assert.equal(app.lastGroq().messages.at(-1).content, 'a'.repeat(500));
});

test('a body over 32 KB gives 413, declared or chunked', async () => {
  const app = makeApp();
  const big = JSON.stringify({ pad: 'x'.repeat(33 * 1024) });
  const a = await app.send('/v1/chat', null, { raw: big });
  assert.equal(a.status, 413);
  assert.deepEqual(a.json, { type: 'invalid_request', error: 'body_too_large' });
  const b = await app.send('/v1/chat', null, { raw: big, headers: { 'content-length': String(big.length) } });
  assert.equal(b.status, 413);
});

test('the maximum-length CJK request passes and is not a 413', async () => {
  const app = makeApp();
  const cjk = (n) => '漢'.repeat(n);
  const pairs = await chain(app, [1, 2, 3].map(() => ({ u: cjk(500), a: cjk(1500) })));
  const body = {
    sessionToken: (await app.session(), app.token), turnId: crypto.randomUUID(), mid: app.mid, prevSig: '',
    message: cjk(500), history: flat(pairs),
  };
  assert.ok(new TextEncoder().encode(JSON.stringify(body)).length < 32 * 1024);
  const { status, json } = await app.send('/v1/chat', body);
  assert.equal(status, 200);
  assert.equal(json.type, 'ai');
});

// --- signed history ---

test('a valid chain of 3 pairs is kept; the new reply chains over the last signature', async () => {
  const app = makeApp();
  const ps = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }, { u: 'q3', a: 'r3' }]);
  const { json } = await app.chat({ history: flat(ps) });
  expectOut(app, ...ps);
  assert.ok(app.history().every((m) => Object.keys(m).join() === 'role,content'));
  assert.equal(json.prevSig, ps[2].a.sig);
  assert.ok(await signatureOk(SECRET, json.sig, app.mid, ps[2].a.sig, json.ts, 'hi', 'Hello there'));
});

test('a reply moved under a different user message is dropped', async () => {
  const app = makeApp();
  const [p1, p2] = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }]);
  await app.chat({ history: [p1.u, p1.a, { role: 'user', content: 'other' }, p2.a] });
  expectOut(app);
});

test('two pairs swapped: the out-of-order pair and every pair kept before it are dropped', async () => {
  const app = makeApp();
  const [p1, p2, p3] = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }, { u: 'q3', a: 'r3' }]);
  await app.chat({ history: flat([p1, p3, p2]) });
  expectOut(app);
});

test('a reply signed under another mid is dropped', async () => {
  const app = makeApp();
  const ps = await chain(app, [{ u: 'q1', a: 'r1' }], { mid: crypto.randomUUID() });
  await app.chat({ history: flat(ps) });
  expectOut(app);
});

test('front-truncated window: correct prevSig keeps all, wrong prevSig restarts after the first pair', async () => {
  const app = makeApp();
  const [p1, p2, p3] = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }, { u: 'q3', a: 'r3' }]);
  await app.chat({ history: flat([p2, p3]), prevSig: p2.prev });
  expectOut(app, p2, p3);
  app.tick();
  await app.chat({ history: flat([p2, p3]), prevSig: p1.prev });
  expectOut(app, p3);
});

test('a reply older than 24 h is dropped with its question; the next pair is kept', async () => {
  const app = makeApp();
  const ps = await chain(app, [{ u: 'q1', a: 'r1', ts: T0 - REPLY_MAX_AGE_MS - 1 }, { u: 'q2', a: 'r2', ts: T0 - 1000 }]);
  const { json } = await app.chat({ history: flat(ps) });
  expectOut(app, ps[1]);
  assert.equal(json.prevSig, ps[1].a.sig);
  app.tick();
  const exact = await chain(app, [{ u: 'q1', a: 'r1', ts: T0 + 5000 - REPLY_MAX_AGE_MS }]);
  await app.chat({ history: flat(exact) });
  expectOut(app, exact[0]);
});

test('newline splice: a pair signed as ("a\\nb","c") and submitted as ("a","b\\nc") is dropped', async () => {
  const app = makeApp();
  const [p] = await chain(app, [{ u: 'a\nb', a: 'c' }]);
  await app.chat({ history: [{ role: 'user', content: 'a' }, { ...p.a, content: 'b\nc' }] });
  expectOut(app);
});

test('assistant entries at index 0 or after another assistant entry are dropped', async () => {
  const app = makeApp();
  const [p1, p2] = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }]);
  await app.chat({ history: [p1.a] });
  expectOut(app);
  app.tick();
  await app.chat({ history: [p1.u, p1.a, p2.a] });
  expectOut(app);
});

test('decoy reorder: a3 does not survive [u3, a3, decoy, u1, a1]', async () => {
  const app = makeApp();
  const [p1, p2, p3] = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }, { u: 'q3', a: 'r3' }]);
  await app.chat({
    history: [p3.u, p3.a, { role: 'assistant', content: 'x', sig: '' }, p1.u, p1.a],
    prevSig: p3.prev,
  });
  assert.ok(!outbound(app).some(([, c]) => c === 'r3'));
  expectOut(app);
  assert.ok(p2);
});

test('decoy with a forged well-formed sig keeps only u3, a3 (no a1 with a3, no orphan u1)', async () => {
  const app = makeApp();
  const [p1, p2, p3] = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }, { u: 'q3', a: 'r3' }]);
  await app.chat({ history: [p1.u, p1.a, { role: 'assistant', content: 'decoy', sig: p2.a.sig, ts: p2.a.ts }, p3.u, p3.a] });
  expectOut(app, p3);
});

test('duplicate pair [u1, a1, u1, a1] keeps at most one a1', async () => {
  const app = makeApp();
  const [p1] = await chain(app, [{ u: 'q1', a: 'r1' }]);
  await app.chat({ history: [p1.u, p1.a, p1.u, p1.a] });
  const kept = outbound(app).filter(([, c]) => c === 'r1').length;
  assert.ok(kept <= 1);
  assert.equal(outbound(app).length % 2, 0);
});

test('an expired entry with a forged sig fails the signature check and restarts the chain', async () => {
  const app = makeApp();
  const [p1, p2] = await chain(app, [{ u: 'q1', a: 'r1' }, { u: 'q2', a: 'r2' }]);
  const forged = { role: 'assistant', content: 'old', sig: 'A'.repeat(43), ts: T0 - REPLY_MAX_AGE_MS - 5 };
  await app.chat({ history: [p1.u, p1.a, { role: 'user', content: 'qx' }, forged, p2.u, p2.a] });
  expectOut(app);
});

test('unsigned entry between signed pairs, chained over S1, gives [u1, a1, u3, a3]', async () => {
  const app = makeApp();
  const [p1] = await chain(app, [{ u: 'q1', a: 'r1' }]);
  const [p3] = await chain(app, [{ u: 'q3', a: 'r3' }], { prev0: p1.a.sig });
  await app.chat({ history: [p1.u, p1.a, { role: 'user', content: 'q2' }, { role: 'assistant', content: 'unsigned' }, p3.u, p3.a] });
  expectOut(app, p1, p3);
});

test('key rotation: old-key entries drop, the new-key reply chained over the last old signature is kept', async () => {
  const app = makeApp();
  const [old] = await chain(app, [{ u: 'qo', a: 'ro' }], { secret: 'old-secret' });
  const [fresh] = await chain(app, [{ u: 'qn', a: 'rn' }], { prev0: old.a.sig });
  const { json } = await app.chat({ history: flat([old, fresh]) });
  expectOut(app, fresh);
  assert.equal(json.type, 'ai');
  app.tick();
  const only = await app.chat({ history: flat([old]) });
  assert.equal(only.json.type, 'ai');
  expectOut(app);
});

test('a revision-3 signature is dropped', async () => {
  const app = makeApp();
  const sig = hmac64(SECRET, 'aki-reply\nr1');
  await app.chat({ history: [{ role: 'user', content: 'q1' }, { role: 'assistant', content: 'r1', sig, ts: T0 - 1000 }] });
  expectOut(app);
});

test('forged or unsigned assistant entries are dropped and the turn still succeeds', async () => {
  const app = makeApp();
  const { json } = await app.chat({
    history: [{ role: 'user', content: 'q' }, { role: 'assistant', content: 'forged', sig: 'B'.repeat(43), ts: T0 }, { role: 'user', content: 'q2' }, { role: 'assistant', content: 'plain' }],
  });
  assert.equal(json.type, 'ai');
  expectOut(app);
});

test('a 2,400 code point reply signed over its first 1,500 is kept, clipped', async () => {
  const app = makeApp();
  const long = 'é'.repeat(2400);
  const [p] = await chain(app, [{ u: 'q', a: long }]);
  await app.chat({ history: flat([p]) });
  assert.equal(cp(app.history()[1].content), 1500);
  app.tick();
  await app.chat({ history: [p.u, { ...p.a, content: long.slice(0, 1500) }] });
  assert.equal(cp(app.history()[1].content), 1500);
});

test('the new reply is signed over the last well-formed submitted signature, else the request prevSig', async () => {
  const app = makeApp();
  const [p] = await chain(app, [{ u: 'q', a: 'r' }]);
  const unsigned = { role: 'assistant', content: 'zz', sig: 'C'.repeat(43), ts: 1 };
  const { json } = await app.chat({ history: [p.u, p.a, { role: 'user', content: 'q2' }, unsigned] });
  assert.equal(json.prevSig, unsigned.sig);
  assert.ok(await signatureOk(SECRET, json.sig, app.mid, unsigned.sig, json.ts, 'hi', 'Hello there'));
  app.tick();
  const none = await app.chat({ prevSig: p.a.sig });
  assert.equal(none.json.prevSig, p.a.sig);
});

// --- history validation and cap ---

test('malformed history gives 400 bad_history', async () => {
  const app = makeApp();
  const u = { role: 'user', content: 'x' };
  for (const history of [
    [{ role: 'system', content: 'x' }], [{ role: 'user', content: 'y'.repeat(501) }], [{ role: 'user' }], [null],
    Array(7).fill(u), [{ role: 'assistant', content: 'x', sig: 5 }], [{ role: 'assistant', content: 'x', ts: 'now' }],
  ]) {
    assert.deepEqual((await app.chat({ history })).json, { type: 'invalid_request', error: 'bad_history' }, JSON.stringify(history).slice(0, 60));
  }
  assert.equal(app.groqCalls().length, 0);
});

test('the outbound history totals at most 3,000 code points, oldest pairs first, starting with a user entry', async () => {
  const app = makeApp();
  const ps = await chain(app, [1, 2, 3].map((i) => ({ u: `${i}`.repeat(500), a: `${i}`.repeat(1500) })));
  await app.chat({ history: flat(ps) });
  const h = app.history();
  assert.ok(h.reduce((n, m) => n + cp(m.content), 0) <= 3000);
  assert.equal(h[0].role, 'user');
  assert.equal(h.at(-1).content, '3'.repeat(1500));
  assert.equal(h.length, 2);
});

// --- origin and session ---

test('a disallowed or missing origin gives 403; a bad session gives 401', async () => {
  const app = makeApp();
  await app.session();
  for (const origin of ['https://evil.example', null, 'null']) {
    const r = await app.chat({}, { origin });
    assert.equal(r.status, 403);
    assert.equal(r.json, null);
  }
  assert.equal(app.limiterCalls.length, 0);
  for (const sessionToken of ['garbage', `${app.token}x`, '', `${app.token.split('.')[0]}.${'A'.repeat(43)}`]) {
    const r = await app.chat({ sessionToken });
    assert.equal(r.status, 401);
    assert.deepEqual(r.json, { type: 'session_required' });
  }
  const other = makeApp({ env: { SESSION_HMAC_SECRET: 'another' } });
  await other.session();
  assert.equal((await app.chat({ sessionToken: other.token })).status, 401);
  app.clock.t += 24 * 3_600_000 + 1;
  assert.equal((await app.chat()).status, 401);
});

test('CORS: allowed origins are echoed with Vary, OPTIONS is answered, other routes and methods are refused', async () => {
  const app = makeApp();
  const r = await app.send('/v1/session', gate(), { origin: 'http://localhost:8888' });
  assert.equal(r.res.headers.get('access-control-allow-origin'), 'http://localhost:8888');
  assert.equal(r.res.headers.get('vary'), 'Origin');
  const o = await app.send('/v1/chat', null, { method: 'OPTIONS' });
  assert.equal(o.status, 204);
  assert.equal(o.res.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal((await app.send('/v1/chat', null, { method: 'OPTIONS', origin: 'https://evil.example' })).status, 403);
  assert.equal((await app.send('/v1/nope', {})).status, 404);
  assert.equal((await app.send('/v1/chat', null, { method: 'GET' })).status, 405);
});

test('siteverify failures give 403 session_denied', async () => {
  const bads = [
    { success: false }, { success: true, hostname: 'evil.example', action: 'aki_session' },
    { success: true, hostname: 'meepmerp-0.github.io', action: 'other' }, { success: true, hostname: 'meepmerp-0.github.io' },
    new Error('network'), new DOMException('timed out', 'TimeoutError'),
  ];
  for (const verify of bads) {
    const app = makeApp();
    app.verify = verify;
    const r = await app.send('/v1/session', gate());
    assert.equal(r.status, 403);
    assert.deepEqual(r.json, { type: 'session_denied' });
  }
  const app = makeApp();
  assert.equal((await app.send('/v1/session', gate({ turnstileToken: '' }))).status, 403);
  assert.equal(app.fetchCalls.length, 0);
  assert.equal((await app.send('/v1/session', {})).json.error, 'bad_request');
  const ok = await app.session();
  const call = app.fetchCalls[0];
  assert.match(call.url, /siteverify/);
  assert.equal(call.init.body.get('secret'), 'ts');
  assert.equal(ok.json.memory, 'default_on');
  assert.equal(ok.json.gemini, 'off');
  assert.ok(Date.parse(ok.json.expiresAt) === T0 + 24 * 3_600_000);
});

test('session memory rule: opt_in for every EEA_UK_CH code, XX, T1 and a missing country; default_on for AE, US, PH', async () => {
  assert.equal(EEA_UK_CH.length, 44);
  for (const country of [...EEA_UK_CH, 'XX', 'T1', undefined, null, 'us', 'USA']) {
    const app = makeApp({ country });
    assert.equal((await app.session()).json.memory, 'opt_in', String(country));
  }
  for (const country of ['AE', 'US', 'PH']) {
    const app = makeApp({ country });
    assert.equal((await app.session()).json.memory, 'default_on', country);
  }
});

// --- config ---

async function misconfigured(patch, label) {
  const app = makeApp();
  const goodToken = (await app.session(), app.token);
  const env = { ...BASE_ENV };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  const before = app.fetchCalls.length;
  for (const path of PATHS) {
    const body = path === '/v1/session' ? gate() : path === '/v1/region' ? {} : { sessionToken: goodToken, turnId: crypto.randomUUID(), mid: app.mid, prevSig: '', message: 'hi', history: [] };
    const r = await app.send(path, body, { env });
    assert.equal(r.status, 200, `${label} ${path}`);
    assert.deepEqual(r.json, { type: 'provider_unavailable', reason: 'misconfigured' }, `${label} ${path}`);
    assert.equal(r.res.headers.get('access-control-allow-origin'), null, `${label} ${path}`);
  }
  assert.equal(app.fetchCalls.length, before, label);
  assert.equal(app.limiterCalls.length, 0, label);
}

test('a missing or empty required var gives misconfigured on session, chat and region', async () => {
  const keys = ['GROQ_API_KEY', 'SESSION_HMAC_SECRET', 'IP_HASH_SECRET', 'TURNSTILE_SECRET', 'GROQ_MODEL', 'CONSENT_VERSION', 'ALLOWED_ORIGINS', 'TURNSTILE_HOSTNAMES', 'TURNSTILE_ACTIONS'];
  for (const k of keys) {
    for (const v of [undefined, '', '  ']) await misconfigured({ [k]: v }, `${k}=${JSON.stringify(v)}`);
  }
  for (const k of ['ALLOWED_ORIGINS', 'TURNSTILE_HOSTNAMES', 'TURNSTILE_ACTIONS']) await misconfigured({ [k]: 'a,' }, `${k}=a,`);
});

test('bad numeric vars give misconfigured on session, chat and region', async () => {
  for (const k of ['SITE_DAILY_CAP', 'GROQ_SITE_PER_MIN', 'GROQ_MAX_COMPLETION_TOKENS', 'MAX_QUEUE_WAIT', 'MAX_QUEUE_DEPTH']) {
    for (const v of [undefined, 'NaN', '2.5', '', ' 2', '-1']) await misconfigured({ [k]: v }, `${k}=${JSON.stringify(v)}`);
  }
  await misconfigured({ SITE_DAILY_CAP: '101' }, 'cap 101');
  await misconfigured({ MAX_QUEUE_WAIT: '31' }, 'wait 31');
  await misconfigured({ MAX_QUEUE_DEPTH: '0' }, 'depth 0');
  await misconfigured({ MAX_QUEUE_DEPTH: '11' }, 'depth 11');
  await misconfigured({ GROQ_SITE_PER_MIN: '0' }, 'per min 0');
  await misconfigured({ GROQ_MAX_COMPLETION_TOKENS: '0' }, 'tokens 0');
});

test('boundary values are valid; SITE_DAILY_CAP=0 gives disabled with no fetch', async () => {
  for (const patch of [{ SITE_DAILY_CAP: '100' }, { MAX_QUEUE_WAIT: '0' }, { MAX_QUEUE_WAIT: '30' }, { MAX_QUEUE_DEPTH: '10' }]) {
    assert.equal(readConfig({ ...BASE_ENV, ...patch }).ok, true, JSON.stringify(patch));
  }
  const app = makeApp();
  await app.session();
  const env = { ...BASE_ENV, SITE_DAILY_CAP: '0' };
  const before = app.fetchCalls.length;
  const chat = await app.chat({}, { env });
  assert.deepEqual([chat.json.type, chat.json.reason], ['provider_unavailable', 'disabled']);
  const sess = await app.send('/v1/session', gate(), { env });
  assert.deepEqual(sess.json, { type: 'provider_unavailable', reason: 'disabled' });
  assert.equal(app.fetchCalls.length, before);
  assert.equal(app.limiterCalls.length, 0);
});

test('Gemini config is off unless GEMINI_ENABLED is exactly "true" and every Gemini var is valid', () => {
  const gem = { GEMINI_ENABLED: 'true', GEMINI_DAILY_CAP: '20', GEMINI_ALLOWED_COUNTRIES: 'US,CA', GEMINI_MODEL: 'g', GEMINI_API_KEY: 'k' };
  const on = (patch = {}) => readConfig({ ...BASE_ENV, ...gem, ...patch }).gemini.on;
  assert.equal(on(), true);
  for (const patch of [{ GEMINI_ENABLED: 'True' }, { GEMINI_ENABLED: undefined }, { GEMINI_DAILY_CAP: '0' }, { GEMINI_DAILY_CAP: '21' },
    { GEMINI_DAILY_CAP: '2.5' }, { GEMINI_MODEL: '' }, { GEMINI_API_KEY: undefined },
    { GEMINI_ALLOWED_COUNTRIES: '' }, { GEMINI_ALLOWED_COUNTRIES: 'US,' }, { GEMINI_ALLOWED_COUNTRIES: 'us' },
    { GEMINI_ALLOWED_COUNTRIES: 'FR' }, { GEMINI_ALLOWED_COUNTRIES: 'GF' }, { GEMINI_ALLOWED_COUNTRIES: 'XX' }, { GEMINI_ALLOWED_COUNTRIES: 'CU' }]) {
    assert.equal(on(patch), false, JSON.stringify(patch));
    assert.equal(readConfig({ ...BASE_ENV, ...gem, ...patch }).ok, true);
  }
});

// --- IP and headers ---

test('only the injected cf-connecting-ip decides the visitor; forwarded headers are ignored', async () => {
  const app = makeApp();
  await app.chat();
  app.tick(1000);
  const same = await app.chat({}, { headers: { 'x-forwarded-for': '9.9.9.9', 'x-real-ip': '8.8.8.8' } });
  assert.deepEqual([same.json.type, same.json.scope], ['rate_limited', 'cooldown']);
  const other = await app.chat({}, { ip: '203.0.113.99', headers: { 'x-forwarded-for': '203.0.113.7' } });
  assert.equal(other.json.type, 'ai');
});

test('a missing cf-connecting-ip gives misconfigured with no fetch', async () => {
  const app = makeApp();
  await app.session();
  const before = app.fetchCalls.length;
  const { json } = await app.chat({}, { ip: null });
  assert.deepEqual([json.type, json.reason], ['provider_unavailable', 'misconfigured']);
  assert.equal(app.fetchCalls.length, before);
  assert.equal(app.limiterCalls.length, 0);
});

test('outbound Groq headers are only authorization and content-type', async () => {
  const app = makeApp();
  await app.chat({}, { headers: { 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '1.2.3.4', cookie: 'a=b' } });
  const headers = app.groqCalls()[0].init.headers;
  assert.deepEqual([...headers.keys()].sort(), ['authorization', 'content-type']);
  assert.equal(headers.get('authorization'), 'Bearer gk');
});

// --- D5 ---

test('D5: blocked countries get faq with no fetch; the env cannot change that; XX and a missing country reach Groq', async () => {
  assert.deepEqual([...AI_BLOCKED], ['CU', 'IR', 'KP', 'SY', 'T1']);
  for (const country of AI_BLOCKED) {
    const app = makeApp({ country, env: { AI_BLOCKED_COUNTRIES: '' } });
    const before = (await app.session(), app.fetchCalls.length);
    const { json } = await app.chat();
    assert.deepEqual(json.type === 'faq' && json.reason, 'region', country);
    assert.equal(app.fetchCalls.length, before);
    assert.equal(app.limiterCalls.length, 0);
  }
  for (const country of ['XX', undefined]) {
    const app = makeApp({ country });
    assert.equal((await app.chat()).json.type, 'ai');
  }
});

// --- turns ---

test('reusing a finished turnId gives 409 turn_reused', async () => {
  const app = makeApp();
  const turnId = crypto.randomUUID();
  assert.equal((await app.chat({ turnId })).json.type, 'ai');
  app.tick();
  const r = await app.chat({ turnId });
  assert.equal(r.status, 409);
  assert.deepEqual(r.json, { type: 'invalid_request', error: 'turn_reused' });
  assert.equal(app.groqCalls().length, 1);
});

test('the Groq pack is at most 6,000 characters and private projects expose only their label', () => {
  assert.ok(GROQ_PACK.length <= 6000);
  const pack = JSON.parse(GROQ_PACK);
  for (const p of PROJECTS.filter((x) => x.privateLabel)) {
    const entry = pack.projects.find((x) => x.title === p.privateLabel);
    assert.deepEqual(Object.keys(entry).sort(), ['note', 'title']);
  }
});

// --- 18+ gate (addendum §2) ---

test('a bad gate body gives 400 bad_consent with no siteverify fetch and no limiter call', async () => {
  const bads = [
    { ack18: undefined }, { ack18: false }, { ack18: 'true' }, { ack18: 1 },
    { geminiAck: undefined }, { geminiAck: 'true' }, { geminiAck: 1 }, { geminiAck: null },
    { consentVersion: undefined }, { consentVersion: '0000-00-00.0' }, { consentVersion: ` ${CV}` }, { consentVersion: 5 },
  ];
  for (const over of bads) {
    const app = makeApp();
    const r = await app.send('/v1/session', gate(over));
    assert.equal(r.status, 400, JSON.stringify(over));
    assert.deepEqual(r.json, { type: 'invalid_request', error: 'bad_consent' }, JSON.stringify(over));
    assert.equal(app.fetchCalls.length, 0, JSON.stringify(over));
    assert.equal(app.limiterCalls.length + app.consentCalls.length, 0, JSON.stringify(over));
  }
});

const claimsOf = (token) => JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());

test('a valid session body makes one consent call; the claims carry cv and g', async () => {
  const app = makeApp({ env: GEMINI_ENV });
  const r = await app.session({ gate: { geminiAck: true } });
  assert.equal(app.consentCalls.length, 1);
  const c = app.consentCalls[0];
  assert.equal(c.consentVersion, CV);
  assert.equal(c.gemini, true);
  assert.equal(c.country, 'US');
  assert.equal(typeof c.sid, 'string');
  const claims = claimsOf(r.json.sessionToken);
  assert.deepEqual([claims.cv, claims.g, claims.sid], [CV, true, c.sid]);
  assert.equal(r.json.gemini, 'on');
});

test('g is false from GB even when geminiAck is true, and when Gemini is off or the box is unticked', async () => {
  for (const [opts, ack] of [[{ country: 'GB', env: GEMINI_ENV }, true], [{ country: 'US' }, true], [{ country: 'US', env: GEMINI_ENV }, false]]) {
    const app = makeApp(opts);
    const r = await app.session({ gate: { geminiAck: ack } });
    assert.equal(claimsOf(r.json.sessionToken).g, false, JSON.stringify(opts));
    assert.equal(r.json.gemini, 'off');
    assert.equal(app.consentCalls[0].gemini, false);
  }
});

test('a failed consent write fails the session closed', async () => {
  const app = makeApp();
  app.limiter = { ...app.limiter, consent: async () => { throw new Error('do down'); } };
  const r = await app.send('/v1/session', gate());
  assert.notEqual(r.json.type, 'session');
});

test('/v1/chat with an old token (no cv or g) gives 401; a cv mismatch gives 401 with reason consent', async () => {
  const app = makeApp();
  const old = (claims) => {
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    return `${payload}.${hmac64(SECRET, `aki-session\n${payload}`)}`;
  };
  const exp = T0 + 3_600_000;
  for (const claims of [{ sid: 's', exp }, { sid: 's', exp, cv: CV }, { sid: 's', exp, g: false }, { sid: 's', exp, cv: CV, g: 'no' }]) {
    const r = await app.chat({ sessionToken: old(claims) });
    assert.equal(r.status, 401, JSON.stringify(claims));
    assert.deepEqual(r.json, { type: 'session_required' }, JSON.stringify(claims));
  }
  const mismatch = await app.chat({ sessionToken: old({ sid: 's', exp, cv: 'old', g: false }) });
  assert.equal(mismatch.status, 401);
  assert.deepEqual(mismatch.json, { type: 'session_required', reason: 'consent' });
  const fresh = makeApp();
  await fresh.session();
  const bumped = await fresh.chat({}, { env: { ...fresh.env, CONSENT_VERSION: '2099-01-01' } });
  assert.deepEqual([bumped.status, bumped.json], [401, { type: 'session_required', reason: 'consent' }]);
  assert.equal(app.groqCalls().length + fresh.groqCalls().length, 0);
});

// --- /v1/region (addendum §3) ---

test('/v1/region memory is opt_in for all 44 codes, XX, T1 and a missing country; default_on for AE, US, PH', async () => {
  for (const country of [...EEA_UK_CH, 'XX', 'T1', undefined, null, 'us', 'USA']) {
    const r = await makeApp({ country }).send('/v1/region', {});
    assert.equal(r.json.memory, 'opt_in', String(country));
    assert.equal(r.json.type, 'region');
    assert.equal(r.json.consentVersion, CV);
  }
  for (const country of ['AE', 'US', 'PH']) {
    assert.equal((await makeApp({ country }).send('/v1/region', {})).json.memory, 'default_on', country);
  }
});

test('/v1/region gemini is eligible only when on and the country is allowed', async () => {
  const gemini = async (opts) => (await makeApp(opts).send('/v1/region', {})).json.gemini;
  assert.equal(await gemini({ env: GEMINI_ENV, country: 'US' }), 'eligible');
  assert.equal(await gemini({ env: GEMINI_ENV, country: 'CA' }), 'eligible');
  assert.equal(await gemini({ env: GEMINI_ENV, country: 'AU' }), 'ineligible');
  assert.equal(await gemini({ country: 'US' }), 'ineligible', 'off');
  assert.equal(await gemini({ env: { ...GEMINI_ENV, GEMINI_API_KEY: undefined }, country: 'US' }), 'ineligible', 'key removed');
  assert.equal(await gemini({ env: { ...GEMINI_ENV, GEMINI_ENABLED: 'false' }, country: 'US' }), 'ineligible', 'kill switch');
  assert.equal(await gemini({ env: GEMINI_ENV, country: 'GB' }), 'ineligible');
  assert.equal(await gemini({ env: GEMINI_ENV, country: undefined }), 'ineligible');
});

test('/v1/region makes zero limiter calls and zero fetches, is no-store, refuses a bad origin and answers OPTIONS', async () => {
  const app = makeApp({ env: GEMINI_ENV });
  const r = await app.send('/v1/region', {});
  assert.equal(r.status, 200);
  assert.equal(r.res.headers.get('cache-control'), 'no-store');
  assert.equal(r.res.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(app.fetchCalls.length, 0);
  assert.equal(app.limiterCalls.length + app.consentCalls.length, 0);
  for (const origin of ['https://evil.example', null]) {
    const bad = await app.send('/v1/region', {}, { origin });
    assert.equal(bad.status, 403);
    assert.equal(bad.json, null);
  }
  const o = await app.send('/v1/region', null, { method: 'OPTIONS' });
  assert.equal(o.status, 204);
  assert.equal(o.res.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal((await app.send('/v1/region', null, { method: 'GET' })).status, 405);
  assert.equal(app.fetchCalls.length + app.limiterCalls.length, 0);
});

test('/v1/region with a misconfigured config gives provider_unavailable', async () => {
  const app = makeApp();
  const r = await app.send('/v1/region', {}, { env: { ...BASE_ENV, CONSENT_VERSION: undefined } });
  assert.deepEqual(r.json, { type: 'provider_unavailable', reason: 'misconfigured' });
});

// --- parity ---

test('RPC parity: every OPS key has a matching Limiter method in index.js, and there are no extras', () => {
  const src = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  const methods = [...src.matchAll(/^ {2}(\w+)\(req\) \{ return applyOp\(this\.ctx\.storage\.kv, Date\.now\(\), '(\w+)', req\); \}$/gm)];
  for (const [, name, op] of methods) assert.equal(name, op, `method ${name} applies op ${op}`);
  assert.deepEqual(methods.map((m) => m[1]).sort(), Object.keys(OPS).sort());
  // Any other method-looking line in the class would be an extra RPC entry point.
  const cls = src.slice(src.indexOf('export class Limiter'), src.indexOf('export default'));
  const named = [...cls.matchAll(/^ {2}(?:async )?(\w+)\(/gm)].map((m) => m[1]).filter((n) => n !== 'constructor' && n !== 'alarm');
  assert.deepEqual(named.sort(), Object.keys(OPS).sort());
});

test('version parity: AKI_CONSENT_VERSION, the legal page and both wrangler.toml lines are equal', () => {
  const read = (rel) => readFileSync(new URL(rel, import.meta.url), 'utf8');
  const client = read('../../src/data/akiFaq.js').match(/export const AKI_CONSENT_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1];
  const legal = read('../../public/aki-legal.html').match(/data-consent-version="([^"]+)"/)?.[1];
  const toml = [...read('../wrangler.toml').matchAll(/^CONSENT_VERSION\s*=\s*"([^"]*)"/gm)].map((m) => m[1]);
  assert.ok(client, 'AKI_CONSENT_VERSION found');
  assert.equal(legal, client);
  assert.deepEqual(toml, [client, client]);
});

import { AKI_CONSENT_VERSION } from '../../src/data/akiFaq.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handle, signReply, signatureOk, readConfig } from '../src/app.js';
import { filterHistory } from '../src/gemini.js';
import { createLimiter, memoryStore, OPS, EEA_UK_CH, AI_BLOCKED, REPLY_MAX_AGE_MS, nextPacificMidnight } from '../src/limiter.js';
import { GEMINI_PACK, GEMINI_SYSTEM_PROMPT, matchesContactPattern } from '../src/knowledge.js';

const T0 = Date.UTC(2026, 9, 16, 19, 0, 0);
const ORIGIN = 'https://meepmerp-0.github.io';
const SECRET = 's3cret';
const CV = AKI_CONSENT_VERSION;
const KEY = 'gem-key';
const BASE_ENV = {
  GROQ_API_KEY: 'gk', SESSION_HMAC_SECRET: SECRET, IP_HASH_SECRET: 'ipsecret', TURNSTILE_SECRET: 'ts', GROQ_MODEL: 'm',
  ALLOWED_ORIGINS: ORIGIN, TURNSTILE_HOSTNAMES: 'meepmerp-0.github.io', TURNSTILE_ACTIONS: 'aki_session',
  SITE_DAILY_CAP: '60', GROQ_SITE_PER_MIN: '4', GROQ_MAX_COMPLETION_TOKENS: '600', MAX_QUEUE_WAIT: '0', MAX_QUEUE_DEPTH: '4',
  GEMINI_ENABLED: 'true', GEMINI_MODEL: 'gemini-test', GEMINI_DAILY_CAP: '20', GEMINI_ALLOWED_COUNTRIES: 'US,CA,AU',
  CONSENT_VERSION: CV, GEMINI_API_KEY: KEY,
};
const ok200 = (content = 'Hello there') =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }), { status: 200 });
const gem200 = (text = 'From Gemini') =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }), { status: 200 });
const gemJson = (body, code = 200) => () => new Response(JSON.stringify(body), { status: code });
const status = (code, headers) => () => new Response('', { status: code, headers });
const FAIL500 = status(500);
const UUID = () => crypto.randomUUID();

function makeApp(opts = {}) {
  const { env = {}, ip = '203.0.113.7', geminiAck = true } = opts;
  const country = 'country' in opts ? opts.country : 'US';
  const clock = { t: T0 };
  const now = () => clock.t;
  const store = memoryStore();
  const real = createLimiter(store, now);
  const log = [];
  const calls = [];
  const limiter = Object.fromEntries(Object.keys(OPS).map((op) => [
    op, (r) => (log.push(op), calls.push({ op, req: r }), real[op](r)),
  ]));
  const app = {
    clock, store, real, log, calls, limiter, fetchCalls: [], waited: [],
    env: { ...BASE_ENV, ...env },
    groq: () => ok200(),
    google: () => gem200(),
    mid: UUID(),
    token: null,
  };
  for (const [k, v] of Object.entries(env)) if (v === undefined) delete app.env[k];
  app.fetch = async (url, init) => {
    const u = String(url);
    app.fetchCalls.push({ url: u, init });
    if (u.includes('siteverify')) {
      return new Response(JSON.stringify({ success: true, hostname: 'meepmerp-0.github.io', action: 'aki_session' }), { status: 200 });
    }
    if (u.includes('groq.com')) { log.push('groq'); return app.groq(); }
    if (u.includes('googleapis.com')) { log.push('google'); return app.google(); }
    throw new Error(`unexpected fetch ${u}`);
  };
  app.googleCalls = () => app.fetchCalls.filter((c) => c.url.includes('googleapis.com'));
  app.groqCalls = () => app.fetchCalls.filter((c) => c.url.includes('groq.com'));
  app.googleBody = () => JSON.parse(app.googleCalls().at(-1).init.body);
  app.send = async (path, body, o = {}) => {
    const request = new Request(`https://aki.example${path}`, {
      method: 'POST', headers: { origin: ORIGIN, 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body),
    });
    const res = await handle(request, o.env ?? app.env, {
      limiter: app.limiter,
      fetch: app.fetch,
      sleep: async (ms) => { clock.t += ms; },
      signal: o.signal,
      waitUntil: (p) => app.waited.push(p),
      country: 'country' in o ? o.country : country,
      ip: 'ip' in o ? o.ip : ip,
      now,
    });
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null };
  };
  app.session = async (o = {}) => {
    const r = await app.send('/v1/session', { turnstileToken: 'tok', ack18: true, geminiAck, consentVersion: CV }, o);
    assert.equal(r.json.type, 'session', JSON.stringify(r.json));
    app.token = r.json.sessionToken;
    return r.json;
  };
  app.chat = async (over = {}, o = {}) => {
    app.token ??= (await app.session(o)).sessionToken;
    return app.send('/v1/chat', {
      sessionToken: app.token, turnId: UUID(), mid: app.mid, prevSig: '', message: 'hi', history: [], ...over,
    }, o);
  };
  /** Forget the calls made so far (session set-up), keep the state. */
  app.reset = () => { log.length = 0; calls.length = 0; app.fetchCalls.length = 0; };
  app.tick = (ms = 5000) => { clock.t += ms; };
  return app;
}

const noGoogle = (app, label) => assert.equal(app.googleCalls().length, 0, label);
const fetched = (app) => app.fetchCalls.map((c) => (c.url.includes('googleapis') ? 'google' : c.url.includes('groq') ? 'groq' : 'siteverify'));

/** A signed chain of (user, assistant) pairs. */
async function chain(app, pairs) {
  let prev = '';
  const hist = [];
  for (const [i, p] of pairs.entries()) {
    const ts = p.ts ?? T0 - (pairs.length - i) * 1000;
    const sig = await signReply(SECRET, app.mid, prev, ts, p.u, p.a);
    hist.push({ role: 'user', content: p.u }, { role: 'assistant', content: p.a, sig, ts });
    prev = sig;
  }
  return hist;
}

// --- production vars (V11, D18, R5-8, R5-9) ---

function parseVars(toml) {
  const block = toml.split(/^\[vars\]\s*$/m)[1]?.split(/^\[/m)[0] ?? '';
  const vars = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"([^"]*)"\s*(?:#.*)?$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

test('production vars are consistent, on or off (R5-8, R5-9)', async () => {
  const vars = parseVars(readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8'));
  assert.ok(vars.CONSENT_VERSION?.trim(), 'CONSENT_VERSION is set');
  assert.ok(vars.GEMINI_ENABLED === undefined || vars.GEMINI_ENABLED === 'true', `GEMINI_ENABLED must be "true" or absent, got ${vars.GEMINI_ENABLED}`);
  const env = { ...BASE_ENV, ...vars, ALLOWED_ORIGINS: ORIGIN };
  assert.ok(readConfig(env).ok, 'CONSENT_VERSION is present, so the config is not misconfigured');
  if (vars.GEMINI_ENABLED === 'true') {
    const cfg = readConfig(env);
    assert.ok(cfg.ok && cfg.gemini.on, 'Gemini config classified on');
    for (const c of cfg.gemini.countries) {
      assert.ok(!EEA_UK_CH.includes(c) && c !== 'XX' && !AI_BLOCKED.includes(c), `${c} must not be allowed`);
    }
    assert.ok(cfg.gemini.dailyCap >= 1 && cfg.gemini.dailyCap <= 500);
    const app = makeApp({ env, country: cfg.gemini.countries[0] });
    const r = await app.chat();
    assert.equal(r.json.provider, 'gemini');
    assert.equal(app.groqCalls().length, 0);
    for (const country of ['GB', 'XX', undefined]) {
      const a = makeApp({ env, country });
      const out = await a.chat();
      assert.equal(out.json.provider, 'groq', String(country));
      noGoogle(a, String(country));
    }
  } else {
    assert.equal(readConfig(env).gemini.on, false);
    const app = makeApp({ env });
    assert.equal((await app.session()).gemini, 'off');
  }
  const flagRemoved = { ...env, GEMINI_ENABLED: undefined };
  assert.equal(readConfig(flagRemoved).gemini.on, false);
  const app = makeApp({ env: flagRemoved });
  assert.equal((await app.chat()).json.provider, 'groq');
  noGoogle(app);
  assert.equal((await app.send('/v1/region', {})).json.gemini, 'ineligible');
});

// --- routing ---

test('g:true from the US makes exactly one Google fetch and no Groq fetch; the reply signature verifies', async () => {
  const app = makeApp();
  const { json, status: code } = await app.chat();
  assert.equal(code, 200);
  assert.equal(json.type, 'ai');
  assert.equal(json.provider, 'gemini');
  assert.equal(json.reply, 'From Gemini');
  assert.equal(app.googleCalls().length, 1);
  assert.equal(app.groqCalls().length, 0);
  assert.ok(await signatureOk(SECRET, json.sig, app.mid, '', json.ts, 'hi', 'From Gemini'));
});

test('the Google fetch happens only after reserve returned provider gemini (call order)', async () => {
  const app = makeApp();
  let reserved = null;
  const reserve = app.limiter.reserve;
  app.limiter.reserve = async (r) => { reserved = await reserve(r); return reserved; };
  app.google = () => { assert.equal(reserved?.provider, 'gemini', 'google fetched before reserve answered'); return gem200(); };
  assert.equal((await app.chat()).json.provider, 'gemini');
  assert.ok(app.log.indexOf('reserve') < app.log.indexOf('google'));
  assert.deepEqual(app.log.filter((x) => x !== 'consent'), ['reserve', 'google', 'end']);
});

test('outbound Google headers carry the key header only, with no key in the URL', async () => {
  const app = makeApp();
  await app.chat();
  const call = app.googleCalls()[0];
  assert.deepEqual([...call.init.headers.keys()].sort(), ['content-type', 'x-goog-api-key']);
  assert.equal(call.init.headers.get('x-goog-api-key'), KEY);
  assert.ok(!call.url.includes(KEY) && !call.url.includes('key='));
});

const FALLBACKS = {
  timeout: () => { throw new DOMException('timed out', 'TimeoutError'); },
  429: status(429),
  500: status(500),
  503: status(503),
  401: status(401),
  403: status(403),
  'key-400': gemJson({ error: { code: 400, status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }, 400),
  'other 400': status(400),
  404: status(404),
  empty: gemJson({ candidates: [{ content: { parts: [{ text: '  ' }] }, finishReason: 'STOP' }] }),
  MAX_TOKENS: gemJson({ candidates: [{ content: { parts: [{ text: 'cut off' }] }, finishReason: 'MAX_TOKENS' }] }),
};

test('each Gemini failure makes one Google fetch, then one Groq fetch, in that order', async () => {
  for (const [label, google] of Object.entries(FALLBACKS)) {
    const app = makeApp();
    app.google = google;
    const { json } = await app.chat();
    assert.equal(json.type, 'ai', label);
    assert.equal(json.provider, 'groq', label);
    assert.deepEqual(fetched(app).filter((x) => x !== 'siteverify'), ['google', 'groq'], label);
    assert.deepEqual(app.log.filter((x) => x !== 'consent'), ['reserve', 'google', 'fallback', 'groq', 'end'], label);
  }
});

test('blocked content (blockReason and SAFETY) makes one Google fetch, no Groq fetch, and gives content_blocked', async () => {
  const blocks = [
    gemJson({ promptFeedback: { blockReason: 'SAFETY' } }),
    gemJson({ candidates: [{ finishReason: 'SAFETY' }] }),
  ];
  for (const google of blocks) {
    const app = makeApp();
    app.google = google;
    const { json } = await app.chat();
    assert.equal(json.type, 'provider_unavailable');
    assert.equal(json.reason, 'content_blocked');
    assert.equal(json.turnId.length, 36);
    assert.equal(app.googleCalls().length, 1);
    assert.equal(app.groqCalls().length, 0);
  }
});

test('a blocked reply ends the turn: a second turn 5 s later is not rate_limited concurrent', async () => {
  const app = makeApp();
  app.google = gemJson({ promptFeedback: { blockReason: 'SAFETY' } });
  assert.equal((await app.chat()).json.reason, 'content_blocked');
  assert.ok(app.log.includes('end'));
  app.tick();
  app.google = () => gem200();
  const second = await app.chat();
  assert.equal(second.json.type, 'ai', JSON.stringify(second.json));
});

test('Gemini fails and Groq fails: groq_failed, and no second Google fetch', async () => {
  const app = makeApp();
  app.google = FAIL500;
  app.groq = FAIL500;
  const { json } = await app.chat();
  assert.equal(json.type, 'provider_unavailable');
  assert.equal(json.reason, 'groq_failed');
  assert.equal(app.googleCalls().length, 1);
  assert.equal(app.groqCalls().length, 1);
});

test('g:false (no Gemini acknowledgement) makes zero Google fetches', async () => {
  const app = makeApp({ geminiAck: false });
  assert.equal((await app.session()).gemini, 'off');
  const { json } = await app.chat();
  assert.equal(json.provider, 'groq');
  noGoogle(app);
});

test('g:true but this request is from GB makes zero Google fetches', async () => {
  const app = makeApp();
  await app.session();
  const { json } = await app.chat({}, { country: 'GB' });
  assert.equal(json.provider, 'groq');
  noGoogle(app);
});

test('a g:true token used from CU, IR, KP, SY or T1 gives faq with zero Google, Groq and limiter calls', async () => {
  for (const country of AI_BLOCKED) {
    const app = makeApp();
    await app.session();
    app.reset();
    const { json } = await app.chat({}, { country });
    assert.deepEqual([json.type, json.reason], ['faq', 'region'], country);
    assert.deepEqual(app.fetchCalls, [], country);
    assert.deepEqual(app.log, [], country);
  }
});

test('latch active or Gemini cap reached: zero Google fetches, the turn goes to Groq', async () => {
  const latched = makeApp();
  latched.google = status(403);
  assert.equal((await latched.chat()).json.provider, 'groq');
  latched.tick();
  latched.google = () => gem200();
  const before = latched.googleCalls().length;
  assert.equal((await latched.chat()).json.provider, 'groq');
  assert.equal(latched.googleCalls().length, before);

  const capped = makeApp({ env: { GEMINI_DAILY_CAP: '1' } });
  assert.equal((await capped.chat()).json.provider, 'gemini');
  capped.tick();
  assert.equal((await capped.chat()).json.provider, 'groq');
  assert.equal(capped.googleCalls().length, 1);
});

test('a 400 API_KEY_INVALID trips the R5-24 latch; any other 400 does not', async () => {
  for (const [google, latchedOut] of [[FALLBACKS['key-400'], true], [status(400), false]]) {
    const app = makeApp();
    app.google = google;
    assert.equal((await app.chat()).json.provider, 'groq');
    app.tick();
    assert.equal((await app.chat()).json.provider, 'groq');
    assert.equal(app.googleCalls().length, latchedOut ? 1 : 2);
  }
});

test('off and kill switch: zero Google fetches and /v1/region reports ineligible', async () => {
  const variants = [{ GEMINI_ENABLED: 'false' }, { GEMINI_ENABLED: 'TRUE' }, { GEMINI_ENABLED: '1' }, { GEMINI_ENABLED: undefined },
    { GEMINI_API_KEY: undefined }];
  for (const env of variants) {
    const label = JSON.stringify(env);
    const app = makeApp({ env });
    assert.equal((await app.session()).gemini, 'off', label);
    assert.equal((await app.chat()).json.provider, 'groq', label);
    noGoogle(app, label);
    assert.equal((await app.send('/v1/region', {})).json.gemini, 'ineligible', label);
  }
  // A token minted while Gemini was on, used after the key was removed.
  const app = makeApp();
  await app.session();
  const { json } = await app.chat({}, { env: { ...app.env, GEMINI_API_KEY: undefined } });
  assert.equal(json.provider, 'groq');
  noGoogle(app);
});

test('Gemini on but one var invalid: Groq route, zero Google fetches; with Groq failing, groq_failed', async () => {
  const cases = [
    ...[undefined, 'NaN', '2.5', '0', '501'].map((v) => ({ GEMINI_DAILY_CAP: v })),
    { GEMINI_MODEL: '' }, { GEMINI_API_KEY: undefined },
    ...['', 'US,', 'us', 'FR', 'GF', 'XX', 'CU'].map((v) => ({ GEMINI_ALLOWED_COUNTRIES: v })),
  ];
  for (const env of cases) {
    const label = JSON.stringify(env);
    const app = makeApp({ env });
    assert.equal((await app.chat()).json.provider, 'groq', label);
    noGoogle(app, label);
    const failing = makeApp({ env });
    failing.groq = FAIL500;
    const r = await failing.chat();
    assert.deepEqual([r.json.type, r.json.reason], ['provider_unavailable', 'groq_failed'], label);
    noGoogle(failing, label);
  }
});

test('ineligible countries make zero Google fetches; blocked ones give faq', async () => {
  for (const country of ['GB', 'DE', 'CH', 'NO', 'GF', 'XX', undefined]) {
    const app = makeApp({ country });
    assert.equal((await app.session()).gemini, 'off', String(country));
    assert.equal((await app.chat()).json.provider, 'groq', String(country));
    noGoogle(app, String(country));
  }
  for (const country of AI_BLOCKED) {
    const app = makeApp({ country });
    app.reset();
    const r = await app.chat();
    assert.equal(r.json.type, 'faq', country);
    noGoogle(app, country);
    assert.equal(app.groqCalls().length, 0, country);
  }
});

test('/v1/gemini/decision is gone: 404', async () => {
  const app = makeApp();
  const r = await app.send('/v1/gemini/decision', {});
  assert.equal(r.status, 404);
  assert.deepEqual(app.log, []);
});

// --- cancel ---

test('with MAX_QUEUE_WAIT=0, an abort during the Gemini fetch gives 499, one Google fetch, no Groq fetch and no S entry', async () => {
  const app = makeApp();
  const ac = new AbortController();
  app.google = () => { ac.abort(); return new Response('', { status: 503 }); };
  const { status: code } = await app.chat({}, { signal: ac.signal });
  assert.equal(code, 499);
  await Promise.all(app.waited);
  assert.equal(app.googleCalls().length, 1);
  assert.equal(app.groqCalls().length, 0);
  assert.deepEqual(app.store.get('g').S, []);
  assert.ok(!app.log.includes('fallback'));
  const ended = app.calls.filter((c) => c.op === 'end');
  assert.equal(ended.length, 1);
  assert.equal(ended[0].req.googleStatus, 503);
  assert.ok(app.waited.length >= 1, 'end ran inside waitUntil');
});

// Abort inside one limiter op (after it ran), or before the turn starts.
const abortIn = (app, op, ac) => { const f = app.limiter[op]; app.limiter[op] = async (r) => { const v = await f(r); ac.abort(); return v; }; };
const settle = async (app, ac) => {
  await app.session();
  app.reset();
  const { status: code } = await app.chat({}, { signal: ac.signal });
  await Promise.all(app.waited);
  assert.equal(code, 499);
  assert.equal(app.googleCalls().length, 0);
  assert.equal(app.groqCalls().length, 0);
};

test('already aborted before reserve: 499, no limiter op and no provider fetch', async () => {
  const app = makeApp();
  const ac = new AbortController();
  ac.abort();
  await settle(app, ac);
  assert.deepEqual(app.log, []);
});

test('abort during reserve on the Gemini route: no Google or Groq fetch, end runs, no fallback', async () => {
  const app = makeApp();
  const ac = new AbortController();
  abortIn(app, 'reserve', ac);
  await settle(app, ac);
  assert.deepEqual(app.log, ['reserve', 'end']);
  assert.equal(app.store.get('g').S.length, 0);
});

test('abort during reserve on the Groq-only route: cancel through waitUntil, no Groq fetch', async () => {
  const app = makeApp({ geminiAck: false });
  const ac = new AbortController();
  abortIn(app, 'reserve', ac);
  await settle(app, ac);
  assert.deepEqual(app.log, ['reserve', 'cancel']);
});

test('abort during an immediate fallback (MAX_QUEUE_WAIT=0): cancel, no Groq fetch', async () => {
  const app = makeApp();
  const ac = new AbortController();
  await app.session();
  app.reset();
  app.google = () => new Response('', { status: 500 });
  abortIn(app, 'fallback', ac);
  const { status: code } = await app.chat({}, { signal: ac.signal });
  await Promise.all(app.waited);
  assert.equal(code, 499);
  assert.equal(app.googleCalls().length, 1);
  assert.equal(app.groqCalls().length, 0);
  assert.deepEqual(app.log, ['reserve', 'google', 'fallback', 'cancel']);
});

// --- Gemini pauses ---

test('a Gemini 429 with no Retry-After and error.details[].retryDelay "3600s" passes retryAfter 3600 to fallback', async () => {
  const app = makeApp();
  app.google = gemJson({ error: { code: 429, details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3600s' }] } }, 429);
  assert.equal((await app.chat()).json.provider, 'groq');
  assert.equal(app.calls.find((c) => c.op === 'fallback').req.retryAfter, 3600);
  app.tick();
  assert.equal((await app.chat()).json.provider, 'groq');
  assert.equal(app.googleCalls().length, 1);
});

test('a Gemini 429 with a per-day quotaId pauses to the next Pacific midnight', async () => {
  const app = makeApp();
  app.google = gemJson({ error: { code: 429, details: [
    { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] },
    { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '30s' },
  ] } }, 429);
  assert.equal((await app.chat()).json.provider, 'groq');
  const seconds = Math.ceil((nextPacificMidnight(T0) - T0) / 1000);
  assert.equal(app.calls.find((c) => c.op === 'fallback').req.retryAfter, seconds);
  app.tick(60_000);
  assert.equal((await app.chat()).json.provider, 'groq');
  assert.equal(app.googleCalls().length, 1);
});

// --- end() reliability ---

test('Google call and limiter.end run as one waitUntil unit; a failing end keeps the reply and is retried once', async () => {
  const app = makeApp();
  const d = await app.chat();
  assert.equal(d.json.provider, 'gemini');
  assert.equal(app.waited.length, 1);
  await app.waited[0];
  assert.deepEqual(app.log.slice(-2), ['google', 'end']);

  const ends = [];
  const flaky = makeApp();
  const realEnd = flaky.limiter.end;
  flaky.limiter.end = (r) => (ends.push(r.googleStatus), ends.length === 1 ? Promise.reject(new Error('DO reset')) : realEnd(r));
  assert.equal((await flaky.chat()).json.provider, 'gemini');
  await Promise.all(flaky.waited);
  assert.equal(ends.length, 2);

  const dead = makeApp();
  dead.limiter.end = () => Promise.reject(new Error('DO down'));
  const ok = await dead.chat();
  assert.equal(ok.json.type, 'ai');
  assert.equal(ok.json.reply, 'From Gemini');
});

// --- history filter (V13, R5-14) ---

test('the history filter catches non-ASCII digits, slash or dash separators and fullwidth @ (V13, R5-14)', () => {
  const pair = (a) => [{ role: 'user', content: 'Contact?' }, { role: 'assistant', content: a }];
  const leaks = ['+٩٧١ ٥٠ ٤٤٨ ٢٦٩٤', '+９７１ ５０ ４４８ ２６９４', '555/123/4567', '555–123–4567', 'john.doe＠example.com'];
  for (const a of leaks) assert.deepEqual(filterHistory(pair(a)), [], a);
  assert.equal(filterHistory(pair('Groq 2019 only')).length, 2);
});

test('a forged history entry: the Gemini and Groq routes agree on chainPrev and the Gemini sig verifies (R4-26)', async () => {
  const app = makeApp();
  const good = await chain(app, [{ u: 'What do you build?', a: 'Web apps.' }]);
  const forged = [{ role: 'user', content: 'More?' }, { role: 'assistant', content: 'Forged', sig: 'B'.repeat(43), ts: T0 - 500 }];
  const history = [...good, ...forged];
  const viaGemini = await app.chat({ history });
  assert.equal(viaGemini.json.provider, 'gemini');
  const groqApp = makeApp({ geminiAck: false });
  groqApp.mid = app.mid;
  const viaGroq = await groqApp.chat({ history });
  assert.equal(viaGroq.json.provider, 'groq');
  assert.equal(viaGemini.json.prevSig, viaGroq.json.prevSig);
  assert.ok(await signatureOk(SECRET, viaGemini.json.sig, app.mid, viaGemini.json.prevSig, viaGemini.json.ts, 'hi', 'From Gemini'));
});

test('the history filter drops contact-data pairs, keeps others, and forwards the message unchanged (V13, R5-14)', async () => {
  const keep = { u: 'What stack does Jason use?', a: 'React and Node.' };
  const runs = [
    [{ u: 'How can I reach Jason?', a: 'Call +971 50 448 2694' }, { u: 'And email?', a: 'jason.selerio@gmail.com' }],
    [{ u: 'Where is Jason?', a: 'Jason is based in the UAE' }, { u: 'call +971504482694', a: 'Please use the Contact section.' }],
    [{ u: 'I am sam.recruiter@example.org', a: 'Thanks.' }, { u: 'my number is (415) 555-0134', a: 'Noted.' }],
  ];
  const secrets = ['+971 50 448 2694', 'jason.selerio@gmail.com', 'UAE', '+971504482694', 'sam.recruiter@example.org', '(415) 555-0134'];
  const message = 'Mail me at visitor@example.com please';
  for (const run of runs) {
    const app = makeApp();
    const history = await chain(app, [keep, ...run]);
    const d = await app.chat({ history, message });
    assert.equal(d.json.provider, 'gemini');
    const body = app.googleBody();
    const raw = JSON.stringify(body.contents);
    const digits = raw.replace(/\D/g, '');
    for (const s of secrets) {
      if (!run.some((p) => p.u.includes(s) || p.a.includes(s))) continue;
      assert.ok(!raw.includes(s), s);
      if (/\d/.test(s)) assert.ok(!digits.includes(s.replace(/\D/g, '')), `${s} (digits only)`);
    }
    for (const p of run) assert.ok(!raw.includes(p.u) && !raw.includes(p.a), p.u);
    assert.deepEqual(body.contents.map((c) => c.role), ['user', 'model', 'user']);
    assert.equal(body.contents[0].parts[0].text, keep.u);
    assert.equal(body.contents.at(-1).parts[0].text, message);
  }
});

test('an expired history pair is dropped before the Google fetch', async () => {
  const app = makeApp();
  const history = await chain(app, [{ u: 'Old question', a: 'Old answer', ts: T0 - REPLY_MAX_AGE_MS - 1 }]);
  assert.equal((await app.chat({ history })).json.provider, 'gemini');
  assert.ok(!JSON.stringify(app.googleBody().contents).includes('Old answer'));
});

test('the Gemini pack matches no CONTACT_PATTERNS entry (V10, R4-14)', () => {
  assert.ok(!matchesContactPattern(GEMINI_PACK));
  assert.ok(!matchesContactPattern(GEMINI_SYSTEM_PROMPT));
});

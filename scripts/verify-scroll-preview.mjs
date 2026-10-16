/**
 * Dependency-free Chrome DevTools screenshots and scroll smoke checks.
 * Run after "npm run build" while Vite preview is listening on 127.0.0.1:4173.
 * Requires Node.js 22+ and a Chrome/Chromium binary.
 *
 * Unlike "chrome --headless --screenshot=URL#section", this navigates a real
 * browser tab, waits for React, scrolls explicitly, then waits for paint.
 */
import { execFile, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AKI_GREETINGS, AKI_GREETING_LINES } from '../src/data/akiGreetings.js';
import { AKI_CONSENT_VERSION, AKI_FAQ, AKI_MESSAGES, AKI_WELCOME_COPY as W } from '../src/data/akiFaq.js';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
const chromeBin = process.env.CHROME_BIN || 'google-chrome';
const folder = 'ui-previews';
const profile = await mkdtemp(join(tmpdir(), 'portfolio-motion-chrome-'));

/** Allocate an OS-assigned loopback port for this specific browser instance.
 * Chrome's OWN stderr must confirm the exact DevTools websocket ID before
 * we ever send commands. If another process races for the port, fail closed.
 */
async function allocateDebugPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}
const debugPort = await allocateDebugPort();
const chrome = spawn(chromeBin, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--remote-allow-origins=*',
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=' + debugPort,
  '--user-data-dir=' + profile,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let startupStderr = '';
chrome.stderr.on('data', (chunk) => {
  startupStderr += String(chunk);
  if (startupStderr.length > 12000) startupStderr = startupStderr.slice(-12000);
});

let socket;
let nextId = 0;
const pending = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForChromePort() {
  // The own-process diagnostic is essential: fetching any open debugging port
  // alone could mistakenly connect to a different Chrome session.
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const started = startupStderr.match(
      /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\/devtools\/browser\/([\w-]+)/
    );
    if (started) {
      const observedPort = Number(started[1]);
      const browserId = started[2];
      if (observedPort !== debugPort) {
        throw new Error('Chrome owned an unexpected debugging port: ' + observedPort);
      }
      try {
        const response = await fetch('http://127.0.0.1:' + debugPort + '/json/version');
        if (response.ok) {
          const info = await response.json();
          const expectedSocket = 'ws://127.0.0.1:' + debugPort
            + '/devtools/browser/' + browserId;
          if (info.webSocketDebuggerUrl !== expectedSocket) {
            throw new Error('Refusing to connect: DevTools belongs to a different Chrome process');
          }
          console.log('[chrome] isolated DevTools port', debugPort);
          return debugPort;
        }
      } catch (error) {
        if (String(error.message).includes('different Chrome process')) throw error;
      }
    }
    if (chrome.exitCode !== null) {
      throw new Error('Chrome exited before DevTools initialized:\n' + startupStderr.slice(-2400));
    }
    await delay(100);
  }
  throw new Error('Chrome failed to advertise owned DevTools on ' + debugPort
    + ':\n' + startupStderr.slice(-2400));
}

async function openPageSocket(port) {
  let target;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let response;
    try {
      response = await fetch('http://127.0.0.1:' + port + '/json');
    } catch {
      await delay(100);
      continue;
    }
    if (!response.ok) throw new Error('DevTools returned ' + response.status);
    const targets = await response.json();
    target = targets.find((candidate) => candidate.type === 'page');
    if (target) break;
    await delay(100);
  }
  if (!target) throw new Error('Chrome did not provide a page target');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error('Unable to connect to Chrome DevTools'));
  });
}

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error('DevTools timed out: ' + method));
    }, 20000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const output = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (output.exceptionDetails) {
    throw new Error('Browser evaluation failed: ' + output.exceptionDetails.text);
  }
  return output.result.value;
}

async function waitForReact(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await evaluate(
      "document.readyState === 'complete' && location.href === "
        + JSON.stringify(new URL(url).href)
        + " && Boolean(document.querySelector('#home')) && Boolean(document.querySelector('#contact'))"
    );
    if (ready) return;
    await delay(100);
  }
  throw new Error('The React portfolio did not render its page sections');
}

async function settle() {
  await evaluate('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  // Permit one-time 650ms entrances to complete before checking for clipping.
  await delay(710);
}

async function navigate(url) {
  const result = await call('Page.navigate', { url });
  if (result.errorText) throw new Error('Navigation failed: ' + result.errorText);
  await waitForReact(url);
  await settle();
}

async function viewport(width, height) {
  await call('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 600,
  });
  await delay(100);
}

async function measureSection(id) {
  return evaluate('(() => {'
    + 'const e = document.getElementById(' + JSON.stringify(id) + ');'
    + 'if (!e) return null;'
    + 'return {top: e.getBoundingClientRect().top, y: window.scrollY,'
    + 'scrollWidth: document.documentElement.scrollWidth,'
    + 'viewportWidth: document.documentElement.clientWidth,'
    + 'headerHeight: document.querySelector(".site-header")?.getBoundingClientRect().height || 0,'
    + 'atDocumentEnd: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3};'
    + '})()');
}

/** Test readable content geometry, even when overflow-x: clip masks protrusion. */
async function verifyLayout(label, section) {
  const expression = String.raw`(() => {
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const selector = __TARGET__;
    const selected = document.querySelector(selector);
    const errors = [];
    if (!selected) errors.push('missing ' + selector);
    const htmlWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    if (Math.max(htmlWidth, bodyWidth) > width + 3) {
      errors.push('horizontal document overflow: ' + htmlWidth + ' / ' + bodyWidth + ' vs ' + width);
    }
    const selectors = ['.site-header', '.shell', '.hero-grid', '.hero h1', '.hero-notes',
      '.section-intro', '.project-row', '.about-layout', '.capabilities-grid',
      '.contact-grid', '.contact-form', '.portfolio-workflow__window'];
    const inspected = new Set();
    const candidates = [
      ...document.querySelectorAll(selectors.join(',')),
      ...(selected ? selected.querySelectorAll('a, button, input:not([type="hidden"]), textarea, summary') : []),
    ];
    for (const node of candidates) {
      if (inspected.has(node)) continue;
      inspected.add(node);
      if (node !== selected && !node.closest(selector) && !node.closest('.site-header')) continue;
      if (node.closest('.sr-only')) continue;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= height) continue;
      if (rect.left < -4 || rect.right > width + 4) {
        const className = typeof node.className === 'string' ? node.className : '';
        errors.push(node.tagName.toLowerCase() + '.' + className.slice(0, 55)
          + ' outside viewport: ' + rect.left.toFixed(1) + ' .. ' + rect.right.toFixed(1)
          + ' vs ' + width);
        if (errors.length >= 12) break;
      }
    }
    return errors;
  })()`.replace('__TARGET__', JSON.stringify(section ? '#' + section : '#home'));
  const errors = await evaluate(expression);
  if (errors.length) {
    throw new Error('Responsive layout failure (' + label + ' / ' + (section || 'home')
      + '): ' + JSON.stringify(errors));
  }
}

/** Test responsive nav and theme switching without following links or sending forms. */
async function verifyNavigation(label, width) {
  const expression = String.raw`(async () => {
    const menu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('.site-nav');
    const theme = document.querySelector('.theme-button');
    if (!menu || !nav || !theme) return 'missing header controls';
    const expectsMenu = __WIDTH__ <= 830;
    const menuVisible = getComputedStyle(menu).display !== 'none';
    if (menuVisible !== expectsMenu) return 'incorrect menu breakpoint';
    if (expectsMenu) {
      if (getComputedStyle(nav).display !== 'none') return 'closed nav visible';
      menu.click();
      await new Promise((done) => setTimeout(done, 100));
      if (menu.getAttribute('aria-expanded') !== 'true') return 'menu did not open';
      if (getComputedStyle(nav).display === 'none') return 'menu links stayed hidden';
      if (document.activeElement !== nav.querySelector('a')) return 'opening menu did not focus first link';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise((done) => setTimeout(done, 100));
      if (menu.getAttribute('aria-expanded') !== 'false') return 'Escape did not close menu';
      if (document.activeElement !== menu) return 'Escape did not restore menu focus';
    } else if (getComputedStyle(nav).display === 'none') {
      return 'desktop navigation hidden';
    }
    const original = document.documentElement.dataset.theme;
    theme.click();
    await new Promise((done) => setTimeout(done, 100));
    if (original === document.documentElement.dataset.theme) return 'theme did not toggle';
    theme.click();
    await new Promise((done) => setTimeout(done, 100));
    if (original !== document.documentElement.dataset.theme) return 'theme did not restore';
    return 'ok';
  })()`.replace('__WIDTH__', String(width));
  const result = await evaluate(expression);
  if (result !== 'ok') throw new Error('Navigation failure (' + label + '): ' + result);
  console.log('[navigation]', label, width, result);
}

async function capture(name, section, width, height, screenshot = true, alreadyScrolled = false) {
  if (section && !alreadyScrolled) {
    await evaluate('document.getElementById(' + JSON.stringify(section)
      + ').scrollIntoView({behavior: "instant", block: "start"})');
    await settle();
  }
  if (section) {
    const info = await measureSection(section);
    if (!info || info.top < -180 || info.top > height * 0.72) {
      throw new Error('Section anchor did not land on ' + section + ': '
        + JSON.stringify(info));
    }
    if (info.scrollWidth > info.viewportWidth + 3) {
      throw new Error('Horizontal overflow at ' + section + ': ' + JSON.stringify(info));
    }
    // The sticky header is roughly 67-76px. Anchor padding should keep each
    // section below it without leaving 168px of stale previous-section text.
    if (info.top < info.headerHeight - 12
      || (info.top > info.headerHeight + 38 && !info.atDocumentEnd)) {
      throw new Error('Sticky-header anchor spacing is incorrect at ' + name
        + ': ' + JSON.stringify(info));
    }
    // At the bottom of a short last section, native scrolling stops at the
    // document boundary, so exact scroll-padding alignment is impossible.
    console.log('[section]', name, JSON.stringify(info));
  }
  await verifyLayout(name, section);
  if (!screenshot) return;
  const result = await call('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: false, fromSurface: true,
  });
  const png = Buffer.from(result.data, 'base64');
  if (png.length < 1024) throw new Error('Chrome captured an empty screenshot: ' + name);
  await writeFile(join(folder, name + '.png'), png);
  console.log('[screenshot]', name, width + 'x' + height, png.length + ' bytes');
}

// ---------------------------------------------------------------------------
// Aki smoke: a local stub API, a dedicated build pointed at it, a static
// server for that build, and a stub window.turnstile that records render().
// ---------------------------------------------------------------------------
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.pdf': 'application/pdf', '.woff2': 'font/woff2',
};
const b64url = () => randomBytes(32).toString('base64url');

let stub;
function resetStub(patch = {}) {
  stub = {
    memory: 'default_on', gemini: 'eligible', regionStatus: 200, regionVersion: AKI_CONSENT_VERSION,
    sessionStatus: 200, session: null, sessions: 0, log: [], closed: [],
    chat: (body) => ({ body: aiReply(body, 'Stub reply from Aki.') }),
    ...patch,
  };
}

function aiReply(body, reply, provider = 'groq') {
  const lastSig = [...(body.history || [])].reverse().find((m) => m.role === 'assistant')?.sig;
  return {
    type: 'ai', turnId: body.turnId, provider, reply, sig: b64url(), ts: Date.now(),
    prevSig: lastSig ?? body.prevSig ?? '',
  };
}
const chatCalls = () => stub.log.filter((e) => e.path === '/v1/chat');
const regionCalls = () => stub.log.filter((e) => e.path === '/v1/region');
const sessionCalls = () => stub.log.filter((e) => e.path === '/v1/session');

function startStub() {
  const server = createHttpServer((req, res) => {
    const cors = {
      'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
    };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors).end(); return; }
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      let body = {};
      try { body = JSON.parse(raw); } catch { /* leave empty */ }
      const path = new URL(req.url, 'http://stub').pathname;
      stub.log.push({ path, body });
      let timer;
      res.on('close', () => {
        if (!res.writableEnded) { if (!stub.keepOnClose) clearTimeout(timer); stub.closed.push(path); }
      });
      let out;
      if (path === '/v1/region') {
        out = stub.regionStatus === 200
          ? { body: { type: 'region', memory: stub.memory, gemini: stub.gemini, consentVersion: stub.regionVersion } }
          : { status: stub.regionStatus, body: { type: 'invalid_request', error: 'bad_request' } };
      } else if (path === '/v1/session') {
        stub.sessions += 1;
        out = stub.session?.(body)
          ?? (stub.sessionStatus === 200
            ? { body: { type: 'session', sessionToken: 'tok-' + stub.sessions,
              expiresAt: new Date(Date.now() + 3600000).toISOString(), memory: stub.memory,
              gemini: body.geminiAck && stub.gemini === 'eligible' ? 'on' : 'off' } }
            : { status: stub.sessionStatus, body: { type: 'session_denied' } });
      } else if (path === '/v1/chat') {
        out = stub.chat(body, chatCalls().length);
      } else {
        out = { status: 404, body: { type: 'invalid_request', error: 'bad_request' } };
      }
      timer = setTimeout(() => {
        if (!res.writableEnded) res.writeHead(out.status || 200, cors).end(JSON.stringify(out.body));
      }, out.holdMs || 0);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function startStatic(dir) {
  const server = createHttpServer(async (req, res) => {
    let file = normalize(join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (file.endsWith('/')) file += 'index.html';
    try {
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }).end(data);
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function build(outDir, apiOrigin) {
  return new Promise((resolve, reject) => {
    execFile('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], {
      cwd: repoRoot,
      env: { ...process.env, VITE_AKI_API_URL: apiOrigin, VITE_AKI_TURNSTILE_SITEKEY: 'stub-sitekey' },
      maxBuffer: 16 * 1024 * 1024,
    }, (error, stdout, stderr) => (error ? reject(new Error('Aki build failed:\n' + stderr.slice(-2000)))
      : resolve()));
  });
}

const q = JSON.stringify;
function check(condition, message) {
  if (!condition) throw new Error('Aki smoke: ' + message);
}
async function until(expression, what, timeout = 8000) {
  for (let t = 0; t < timeout; t += 50) {
    if (await evaluate('Boolean(' + expression + ')')) return;
    await delay(50);
  }
  throw new Error('Aki smoke: timed out waiting for ' + what);
}
const click = (selector) => evaluate('document.querySelector(' + q(selector) + ').click()');
const exists = (selector) => evaluate('Boolean(document.querySelector(' + q(selector) + '))');
const texts = (selector) => evaluate('[...document.querySelectorAll(' + q(selector) + ')].map((e) => e.textContent)');
const openPanel = async () => { await click('.aki-launcher'); await until('document.querySelector("#aki-panel")', 'panel'); };
// Waits for the welcome's /v1/region answer (success or failure) to be rendered.
async function regionSettled() {
  for (let i = 0; i < 100 && !regionCalls().length; i += 1) await delay(50);
  await delay(250);
}
// Sets one welcome card (found by its title) to the wanted state.
const setCard = (title, want) => evaluate('(() => { const i = [...document.querySelectorAll(".aki-card")]'
  + '.find((c) => c.querySelector("strong").textContent === ' + q(title) + ')?.querySelector("input");'
  + 'if (!i) return false; if (i.checked !== ' + q(want) + ') i.click(); return true; })()');
/** Welcome step: ticks 18+, sets Gemini when given (undefined leaves the default), clicks Continue. */
async function passGate({ gemini } = {}) {
  await until('document.querySelector(".aki-welcome")', 'welcome step');
  await regionSettled();
  await setCard(W.age.title, true);
  if (gemini !== undefined) check(await setCard(W.gemini.title, gemini), 'Gemini card missing');
  await click('.aki-actions .button-solid');
  await until('document.querySelector("#aki-input")', 'chat step');
  await delay(80);
}
const openChat = async (opts) => { await openPanel(); await passGate(opts); };
const snap = () => evaluate('(() => { const o = { local: {}, session: {} };'
  + 'for (const [k, s] of [["local", localStorage], ["session", sessionStorage]])'
  + 'for (let i = 0; i < s.length; i += 1) { const key = s.key(i); if (key.startsWith("aki:")) o[k][key] = s.getItem(key); }'
  + 'return o; })()');
const hist = (s, kind) => (s[kind]['aki:v1:history'] ? JSON.parse(s[kind]['aki:v1:history']) : null);

async function sendMessage(text) {
  await evaluate('(() => { const el = document.getElementById("aki-input");'
    + 'Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, ' + q(text) + ');'
    + 'el.dispatchEvent(new Event("input", { bubbles: true })); })()');
  await until('!document.querySelector(".aki-form button[type=submit]").disabled', 'Send enabled');
  await click('.aki-form button[type=submit]');
}
// Waits for the visible reply count to grow (assistant messages in the log).
const replies = () => evaluate('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length');
async function sendAndWait(text) {
  const before = await replies();
  await sendMessage(text);
  await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > ' + before, 'assistant message');
  await delay(60);
}

async function reload() {
  await evaluate('window.__stale = 1');
  await call('Page.reload');
  await until('!window.__stale && document.readyState === "complete" && document.querySelector("#home")', 'reload');
  await settle();
}
function seedHistory(pairs, mid = 'mid-seeded') {
  const messages = [];
  const now = Date.now();
  for (let i = 1; i <= pairs; i += 1) {
    messages.push({ role: 'user', content: 'seed question ' + i, ts: now - 1000 * (pairs - i + 1) });
    messages.push({ role: 'assistant', content: 'seed answer ' + i, sig: 's' + i,
      prev: i === 1 ? '' : 's' + (i - 1), ts: now - 1000 * (pairs - i + 1) });
  }
  return JSON.stringify({ mid, messages });
}

let akiUrl;
let akiCase = 0;
/** Fresh document with controlled stub behaviour and optional seeded storage. */
async function akiPage(patch = {}, seed = {}) {
  resetStub(patch);
  await navigate(akiUrl + '?aki=prep' + (akiCase += 1));
  await evaluate('localStorage.clear(); sessionStorage.clear()');
  for (const [kind, entries] of Object.entries(seed)) {
    for (const [key, value] of Object.entries(entries)) {
      await evaluate(kind + 'Storage.setItem(' + q(key) + ', ' + q(value) + ')');
    }
  }
  await navigate(akiUrl + '?aki=case' + akiCase);
  stub.log = [];
}

async function step(name, fn) {
  await fn();
  console.log('[aki]', name, 'ok');
}

const CLEAR = '.aki-link[aria-label="Clear conversation"]';

async function runAkiSmoke() {
  const outDir = await mkdtemp(join(tmpdir(), 'aki-dist-'));
  resetStub();
  const api = await startStub();
  const apiOrigin = 'http://127.0.0.1:' + api.address().port;
  let site;
  const script = await call('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__tsRenders = []; window.turnstile = { render(el, o) {'
      + 'window.__tsRenders.push({ action: o.action, sitekey: o.sitekey, size: o.size });'
      + 'setTimeout(() => o.callback("stub-token"), 0); return "w" + window.__tsRenders.length; },'
      + 'remove() {} };',
  });
  try {
    await build(outDir, apiOrigin);
    site = await startStatic(outDir);
    akiUrl = 'http://127.0.0.1:' + site.address().port + '/';
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
    await viewport(1440, 900);

    await step('built CSP and legal page', async () => {
      const html = await readFile(join(outDir, 'index.html'), 'utf8');
      check(!html.includes('__AKI_'), 'dist/index.html still has a __AKI_ placeholder');
      const connect = html.match(/connect-src([^;]*);/)?.[1] || '';
      check(connect.includes(apiOrigin), 'connect-src lacks the stub origin: ' + connect);
      const legal = await readFile(join(outDir, 'aki-legal.html'), 'utf8');
      check(!legal.includes('['), 'dist/aki-legal.html contains "["');
      check(!/counsel/i.test(legal), 'dist/aki-legal.html mentions counsel');
    });

    await step('launcher fits 320-1920 closed and open', async () => {
      for (const w of [320, 360, 390, 430, 768, 834, 1024, 1440, 1920]) {
        await viewport(w, w < 600 ? 800 : 900);
        await akiPage();
        for (const state of ['closed', 'open']) {
          if (state === 'open') await openPanel();
          const bad = await evaluate('(() => { const W = document.documentElement.clientWidth, H = innerHeight;'
            + 'const out = []; if (Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > W + 3) out.push("page overflow");'
            + 'for (const s of [".aki-launcher", ".aki-bubble", "#aki-panel"]) { const e = document.querySelector(s);'
            + 'if (!e) continue; const r = e.getBoundingClientRect(); if (!r.width) continue;'
            + 'if (r.left < -1 || r.right > W + 1 || r.top < -1 || r.bottom > H + 1) out.push(s + " outside viewport " + [r.left, r.top, r.right, r.bottom].map(Math.round)); }'
            + 'if (!document.querySelector(".aki-launcher") && !document.querySelector("#aki-panel")) out.push("no launcher"); return out; })()');
          check(!bad.length, 'layout at ' + w + ' ' + state + ': ' + JSON.stringify(bad));
        }
      }
      await viewport(1440, 900);
    });

    await step('open, close, Escape, focus return', async () => {
      await akiPage();
      const state = () => evaluate('({ expanded: document.querySelector(".aki-launcher")?.getAttribute("aria-expanded"),'
        + 'panel: Boolean(document.querySelector("#aki-panel")),'
        + 'focus: document.activeElement?.className, focusId: document.activeElement?.id })');
      await openPanel();
      await delay(100);
      let s = await state();
      check(s.expanded === 'true' && s.focusId === 'aki-panel', 'open state ' + JSON.stringify(s));
      await click('[aria-label="Close Aki"]');
      await until('!document.querySelector("#aki-panel")', 'panel closed');
      await delay(50);
      s = await state();
      check(s.expanded === 'false' && String(s.focus).includes('aki-launcher'), 'close focus ' + JSON.stringify(s));
      await openPanel();
      await delay(100);
      await evaluate('document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))');
      await until('!document.querySelector("#aki-panel")', 'Escape closes');
      await delay(50);
      s = await state();
      check(String(s.focus).includes('aki-launcher'), 'Escape focus ' + JSON.stringify(s));
    });

    const clipNow = async () => {
      await openPanel();
      await evaluate('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))');
      return evaluate('getComputedStyle(document.querySelector("#aki-panel")).clipPath');
    };
    const full = (v) => v === 'none' || /^inset\(0(px|%)?( 0(px|%)?){0,3}\)$/.test(v);
    await step('reveal animates normally, skipped under reduced motion', async () => {
      await akiPage();
      check(!full(await clipNow()), 'reveal was not animating with motion allowed');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await akiPage();
      const v = await clipNow();
      const heads = await evaluate('[".aki-launcher canvas"].map((q) => document.querySelector(q)?.parentElement?.getAttribute("aria-hidden") === "true")');
      const still = await evaluate('new Promise((r) => { const c = document.querySelector(".aki-launcher canvas"); const a = c.toDataURL(); setTimeout(() => r(a === c.toDataURL()), 300); })');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
      check(full(v), 'reveal still animating under reduced motion: ' + v);
      check(heads.every(Boolean), 'robot-head canvas missing or not aria-hidden in launcher ' + JSON.stringify(heads));
      check(still, 'robot-heads still animating under reduced motion');
    });

    await step('Turnstile render action, XSS as text fresh and reloaded', async () => {
      const payload = '<img src=x onerror="window.__xss=1">';
      await akiPage({ chat: (b) => ({ body: aiReply(b, payload) }) });
      await openChat();
      await sendAndWait('hello');
      const renders = await evaluate('window.__tsRenders');
      check(renders.length && renders[0].action === 'aki_session' && renders[0].sitekey === 'stub-sitekey' && renders[0].size === 'flexible',
        'turnstile.render options ' + JSON.stringify(renders));
      const probe = () => evaluate('({ last: [...document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p")].pop()?.textContent,'
        + 'img: document.querySelectorAll(".aki-log img").length, xss: window.__xss })');
      let p = await probe();
      check(p.last === payload && !p.img && !p.xss, 'fresh XSS render ' + JSON.stringify(p));
      await reload();
      await openPanel();
      p = await probe();
      check(p.last === payload && !p.img && !p.xss, 'reloaded XSS render ' + JSON.stringify(p));
    });

    await step('memory rules', async () => {
      const send = async (patch, seed, after) => {
        await akiPage(patch, seed);
        await openChat();
        if (after) await after();
        await sendAndWait('remember me');
        return snap();
      };
      let s = await send({ memory: 'default_on' });
      check(hist(s, 'local') && !hist(s, 'session'), '1: default_on should use localStorage ' + JSON.stringify(s));
      check(!(await exists('.aki-memory')) && !(await exists('#aki-memory-status')), '1: Remember UI still exists');
      s = await send({ memory: 'opt_in' });
      check(!hist(s, 'local') && hist(s, 'session'), '2: opt_in should use sessionStorage');
      const seeded = seedHistory(1);
      await akiPage({ memory: 'opt_in' }, { local: { 'aki:v1:history': seeded } });
      await openChat();
      const before = await snap();
      check(!before.local['aki:v1:history'] && before.session['aki:v1:history'] === seeded, '8: an opt_in region should move seeded history to the tab at once');
      check((await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p')).includes('seed answer 1'), '8: seeded history not shown');
      await sendAndWait('remember me');
      s = await snap();
      check(!hist(s, 'local') && hist(s, 'session')?.messages.length === 4, '3: seeded history should move to sessionStorage');
      s = await send({ memory: 'opt_in' }, { local: { 'aki:v1:memory': 'on' } });
      check(!hist(s, 'local') && hist(s, 'session') && !s.local['aki:v1:memory'], '4: stored "on" should be removed and ignored');
      s = await send({ memory: 'default_on' }, { local: { 'aki:v1:memory': 'off' } });
      check(hist(s, 'local') && !hist(s, 'session') && !s.local['aki:v1:memory'], '6: stored "off" should be removed and ignored');
      await akiPage();
      await openChat();
      await click('.aki-chip');
      await delay(150);
      s = await snap();
      check(!Object.keys(s.local).length && Object.keys(s.session).join() === 'aki:v1:gate'
        && stub.log.every((e) => e.path === '/v1/region'),
      '5: chip use should write no history and call only /v1/region ' + JSON.stringify(s));
      // D25: default_on prunes pairs older than 7 days on reload; fresh pairs stay.
      const old = Date.now() - 8 * 24 * 3600 * 1000;
      const fresh = JSON.parse(seedHistory(1, 'mid-fresh'));
      const aged = JSON.parse(seedHistory(1, 'mid-fresh')).messages.map((m) => ({ ...m, content: 'old ' + m.content, ts: old }));
      await akiPage({ memory: 'default_on' });
      await openChat();
      await evaluate('localStorage.setItem("aki:v1:history", ' + q(JSON.stringify({ mid: 'mid-fresh', messages: [...aged, ...fresh.messages] })) + ')');
      await reload();
      await openPanel();
      await delay(300);
      s = await snap();
      check(hist(s, 'local')?.messages.map((m) => m.content).join() === fresh.messages.map((m) => m.content).join(),
        '7: stale pair should be pruned and the fresh one kept ' + JSON.stringify(s.local));
      const shown = await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p');
      check(shown.includes('seed answer 1') && !shown.includes('old seed answer 1'), '7: pruned pair still shown ' + JSON.stringify(shown));
      // New tab (no gate, no session): expired local pairs are neither shown nor kept, under any rule.
      for (const memory of ['default_on', 'opt_in']) {
        await akiPage({ memory }, { local: { 'aki:v1:history': JSON.stringify({ mid: 'mid-fresh', messages: [...aged, ...fresh.messages] }) } });
        await openChat();
        s = await snap();
        const left = JSON.stringify(s);
        const shown2 = await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p');
        check(!left.includes('old seed') && !shown2.includes('old seed answer 1'), '7b: ' + memory + ' expired pair kept or shown ' + left);
      }
      await akiPage({ memory: 'default_on' });
      await openChat();
      await sendAndWait('first');
      check(stub.sessions === 1, '9: setup');
      await reload();
      await openPanel();
      await sendAndWait('second');
      s = await snap();
      check(stub.sessions === 1 && hist(s, 'local')?.messages.length === 4 && !hist(s, 'session'),
        '9: reload should reuse the cached session and the same storage (sessions=' + stub.sessions + ')');
      await akiPage({ sessionStatus: 403 });
      await openChat();
      await sendMessage('denied');
      await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > 0', 'denied note');
      s = await snap();
      check(!hist(s, 'local') && !hist(s, 'session') && !s.session['aki:v1:session'], '10: session_denied wrote history/session');
      check(await evaluate('document.querySelectorAll(".aki-chip").length') > 0
        && (await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p'))[0] === AKI_MESSAGES.failure, '10: chips/failure copy missing');
    });

    await step('Clear conversation and new mid', async () => {
      await akiPage({ memory: 'opt_in' }, { local: { 'aki:v1:history': seedHistory(1) }, session: { 'aki:v1:history': seedHistory(1) } });
      await openChat();
      await sendAndWait('one');
      const mid1 = chatCalls()[0].body.mid;
      await click(CLEAR);
      await delay(100);
      const s = await snap();
      check(!hist(s, 'local') && !hist(s, 'session') && !s.local['aki:v1:memory'], 'Clear storage state ' + JSON.stringify(s));
      check(await evaluate('document.querySelectorAll(".aki-row:not(:first-child) .aki-msg").length') === 0, 'Clear left messages in the log');
      await sendAndWait('two');
      check(chatCalls()[1].body.mid !== mid1, 'mid did not change after Clear');
    });

    await step('Clear during queue wait', async () => {
      await akiPage({ chat: (b) => ({ body: aiReply(b, 'late'), holdMs: 1500 }) });
      stub.keepOnClose = true;
      await openChat();
      await sendMessage('slow one');
      for (let i = 0; i < 40 && !chatCalls().length; i += 1) await delay(50);
      await click(CLEAR);
      for (let i = 0; i < 40 && !stub.closed.includes('/v1/chat'); i += 1) await delay(50);
      check(stub.closed.includes('/v1/chat'), 'Clear did not close the pending request');
      await delay(1800);
      stub.keepOnClose = false;
      const s = await snap();
      check(!hist(s, 'local') && !hist(s, 'session') && await evaluate('document.querySelectorAll(".aki-row:not(:first-child) .aki-msg").length') === 0,
        'a cleared request left a message or history');
    });

    await step('history window and only signed pairs stored', async () => {
      await akiPage({}, { local: { 'aki:v1:history': seedHistory(5) } });
      await openChat();
      await sendAndWait('window please');
      const body = chatCalls()[0].body;
      const seededMsgs = JSON.parse(seedHistory(5)).messages;
      const firstA = body.history.find((m) => m.role === 'assistant');
      check(body.history.length <= 6 && body.history[0].role === 'user', 'window shape ' + JSON.stringify(body.history.map((m) => m.role)));
      check(body.prevSig === seededMsgs.find((m) => m.sig === firstA.sig).prev, 'prevSig does not match the first assistant prev');
      await akiPage({ chat: () => ({ body: { type: 'provider_unavailable', reason: 'groq_failed' } }) });
      await openChat();
      await click('.aki-chip');
      await sendMessage('fails');
      await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > 1', 'unavailable note');
      let s = await snap();
      check(!hist(s, 'local') && !hist(s, 'session'), 'unavailable reply was stored');
      stub.chat = (b) => ({ body: aiReply(b, 'now ok') });
      await sendAndWait('works');
      s = await snap();
      const bad = hist(s, 'local').messages.filter((m) => m.role === 'assistant' && !m.sig);
      check(!bad.length, 'stored assistant entry without sig');
    });

    await step('two tabs on one remembered conversation', async () => {
      await akiPage({}, { local: { 'aki:v1:history': seedHistory(1) } });
      await openChat();
      const now = Date.now();
      await evaluate('(() => { const h = JSON.parse(localStorage.getItem("aki:v1:history"));'
        + 'h.messages.push({ role: "user", content: "tab B question", ts: ' + now + ' },'
        + '{ role: "assistant", content: "tab B answer", sig: "sB", prev: "s1", ts: ' + now + ' });'
        + 'localStorage.setItem("aki:v1:history", JSON.stringify(h)); })()');
      await sendAndWait('tab A question');
      const s = await snap();
      const msgs = hist(s, 'local').messages;
      check(msgs.length === 6 && msgs[3].content === 'tab B answer' && msgs[4].content === 'tab A question',
        'both pairs should be stored whole ' + JSON.stringify(msgs.map((m) => m.content)));
      const aPrev = msgs[5].prev;
      await sendAndWait('next');
      const next = chatCalls()[1].body;
      check(next.history[0].content === 'tab A question' && next.prevSig === aPrev,
        'window should start at the forked pair ' + JSON.stringify(next.history.map((m) => m.content)));
    });

    await step('public 401 recovery', async () => {
      await akiPage({ chat: (b, n) => (n === 1 ? { status: 401, body: { type: 'session_required' } }
        : { body: aiReply(b, 'after recovery') }) });
      await openChat();
      await sendAndWait('retry me');
      const calls = chatCalls();
      check(stub.sessions === 2 && calls.length === 2 && calls[0].body.turnId !== calls[1].body.turnId,
        '401 recovery: sessions ' + stub.sessions + ', chat calls ' + calls.length);
      check((await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p')).includes('after recovery'), '401 recovery reply not shown');
    });

    await step('provider_unavailable keeps history and shows chips', async () => {
      const seeded = seedHistory(1);
      await akiPage({ chat: () => ({ body: { type: 'provider_unavailable', reason: 'groq_failed' } }) },
        { local: { 'aki:v1:history': seeded } });
      await openChat();
      await sendMessage('anyone there');
      await until('(document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p")).length > 1', 'failure note');
      const s = await snap();
      check(s.local['aki:v1:history'] === seeded, 'history changed after provider_unavailable');
      check((await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p')).includes(AKI_MESSAGES.failure)
        && await evaluate('document.querySelectorAll(".aki-chip").length') > 0, 'failure copy or chips missing');
    });

    await step('TRY ASKING hides after use, returns after Clear; typing indicator timing', async () => {
      const tryUp = () => exists('.aki-try');
      const typing = () => exists('.aki-typing');
      const answers = () => evaluate('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length');
      await akiPage({ chat: (b) => ({ body: aiReply(b, 'Stub reply from Aki.'), holdMs: 1200 }) });
      await openChat();
      check(await tryUp(), 'TRY ASKING missing on a fresh chat');
      const t0 = Date.now();
      await click('.aki-chip');
      check(!(await tryUp()), 'TRY ASKING still visible after a chip click');
      check(await typing(), 'no typing indicator right after a chip click');
      await delay(400);
      check((await answers()) === 0 && await typing(), 'chip answer shown too early');
      await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > 0', 'chip answer');
      check(Date.now() - t0 >= 550, 'chip answer came after ' + (Date.now() - t0) + ' ms');
      check(!(await typing()), 'typing indicator still shown after the chip answer');
      await click(CLEAR);
      await delay(100);
      check(await tryUp(), 'TRY ASKING did not return after Clear');
      await sendMessage('typed question');
      check(!(await tryUp()), 'TRY ASKING still visible after a typed message');
      await until('document.querySelector(".aki-typing")', 'typing indicator before the AI reply');
      await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > 0', 'AI reply', 6000);
      check(!(await typing()), 'typing indicator still shown after the AI reply');
      await click(CLEAR);
      await delay(100);
      check(await tryUp(), 'TRY ASKING did not return after the second Clear');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await click('.aki-chip');
      await until('document.querySelector(".aki-typing i")', 'typing dots under reduced motion');
      check(await evaluate('getComputedStyle(document.querySelector(".aki-typing i")).animationName') === 'none',
        'typing dots animate under reduced motion');
      await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    });

    await step('chat step: only the log scrolls, input inside the viewport', async () => {
      for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1440, 900]]) {
        await viewport(w, h);
        await akiPage({}, { local: { 'aki:v1:history': seedHistory(10) } });
        await openChat();
        const m = await evaluate('(() => { const r = document.getElementById("aki-input").getBoundingClientRect(); const p = document.querySelector("#aki-panel");'
          + 'const b = document.querySelector(".aki-chat"); const l = document.querySelector(".aki-log");'
          + 'return { panel: p.scrollHeight - p.clientHeight, body: b.scrollHeight - b.clientHeight, log: l.scrollHeight - l.clientHeight,'
          + 'top: r.top, bottom: r.bottom, left: r.left, right: r.right, W: innerWidth, H: innerHeight }; })()');
        check(m.panel <= 1 && m.body <= 1, 'chat panel scrolls at ' + w + ' ' + JSON.stringify(m));
        check(m.log > 1, 'log does not scroll with long history at ' + w + ' ' + JSON.stringify(m));
        check(m.top >= 0 && m.bottom <= m.H && m.left >= 0 && m.right <= m.W, 'input outside viewport at ' + w + ' ' + JSON.stringify(m));
      }
      await viewport(667, 375);
      await akiPage({}, { local: { 'aki:v1:history': seedHistory(3) } });
      await openChat();
      const s = await evaluate('(() => { const b = document.querySelector(".aki-chat"); b.scrollTop = b.scrollHeight;'
        + 'return { log: document.querySelector(".aki-log").clientHeight, foot: document.querySelector(".aki-foot").getBoundingClientRect().bottom, H: innerHeight }; })()');
      check(s.log > 0 && s.foot <= s.H, 'short viewport clips the log or footer ' + JSON.stringify(s));
      await viewport(1440, 900);
    });

    await step('launcher bubble greeting', async () => {
      await viewport(1440, 900);
      await akiPage();
      await until('document.querySelector(".aki-bubble")', 'bubble');
      const g = await evaluate('({ t: document.querySelector(".aki-bubble strong")?.textContent, l: document.querySelector(".aki-bubble span")?.textContent })');
      const titles = [...AKI_GREETINGS.general, ...Object.values(AKI_GREETINGS.timed), AKI_GREETINGS.friday];
      check(titles.includes(g.t) && AKI_GREETING_LINES.includes(g.l), 'bubble text not from akiGreetings ' + JSON.stringify(g));
    });

    await step('launcher greeting is two lines at the longest title and sentence', async () => {
      const title = [...AKI_GREETINGS.general, ...Object.values(AKI_GREETINGS.timed), AKI_GREETINGS.friday].reduce((a, b) => (b.length > a.length ? b : a));
      const line = AKI_GREETING_LINES.reduce((a, b) => (b.length > a.length ? b : a));
      for (const [w, h] of [[361, 800], [1440, 900]]) {
        await viewport(w, h);
        await akiPage();
        await until('document.querySelector(".aki-bubble")', 'bubble');
        await delay(1300);
        const m = await evaluate('(() => { const b = document.querySelector(".aki-bubble"); const t = b.querySelector("strong"); const l = b.querySelector("span");'
          + 't.textContent = ' + q(title) + '; l.textContent = ' + q(line) + ';'
          + 'const lines = (e) => { const r = document.createRange(); r.selectNodeContents(e); const tops = []; for (const c of r.getClientRects()) if (!tops.some((x) => Math.abs(x - c.top) < 4)) tops.push(c.top); return tops.length; };'
          + 'const r = b.getBoundingClientRect(); const cs = getComputedStyle(b);'
          + 'return { title: lines(t), line: lines(l), h: r.height, pad: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), kids: t.getBoundingClientRect().height + l.getBoundingClientRect().height,'
          + 'left: r.left, right: r.right, top: r.top, bottom: r.bottom, W: innerWidth, H: innerHeight }; })()');
        check(m.title === 1 && m.line === 1, 'greeting wraps at ' + w + ' ' + JSON.stringify(m));
        check(Math.abs(m.h - m.pad - m.kids) <= 3, 'greeting is not 2 line boxes at ' + w + ' ' + JSON.stringify(m));
        check(m.left >= 0 && m.right <= m.W && m.top >= 0 && m.bottom <= m.H, 'greeting outside viewport at ' + w + ' ' + JSON.stringify(m));
      }
      await viewport(1440, 900);
    });

    await step('chat bubbles: sides, labels, no avatar, thin scrollbars', async () => {
      await viewport(1440, 900);
      const run = JSON.parse(seedHistory(2));
      run.messages.push({ role: 'assistant', content: 'seed follow-up', sig: 's3', prev: 's2', ts: Date.now() });
      await akiPage({}, { local: { 'aki:v1:history': JSON.stringify(run) } });
      await openChat();
      const m = await evaluate('(() => { const log = document.querySelector(".aki-log"); const L = log.getBoundingClientRect();'
        + 'const rows = [...log.querySelectorAll(".aki-row")].map((r, i, all) => { const b = r.querySelector(".aki-msg").getBoundingClientRect(); const role = r.classList.contains("aki-row-user") ? "user" : "assistant";'
        + 'return { role, left: b.left, right: b.right, mt: getComputedStyle(r).marginTop, who: r.querySelector(".aki-who")?.textContent ?? null, start: i === 0 || all[i - 1].classList.contains("aki-row-user") !== (role === "user") }; });'
        + 'return { rows, L: { left: L.left, right: L.right, w: log.clientWidth }, avatar: Boolean(document.querySelector(".aki-avatar")), art: log.querySelectorAll(".aki-msg img, .aki-msg svg, .aki-msg canvas").length,'
        + 'inBubble: log.querySelectorAll(".aki-msg .aki-who, .aki-msg .aki-eyebrow").length,'
        + 'sb: [document.documentElement, log].map((e) => getComputedStyle(e).scrollbarWidth === "thin" || getComputedStyle(e, "::-webkit-scrollbar").width === "6px") }; })()');
      const user = m.rows.filter((r) => r.role === 'user');
      const aki = m.rows.filter((r) => r.role === 'assistant');
      check(user.length && aki.length, 'chat rows missing ' + JSON.stringify(m.rows));
      check(!m.avatar && !m.art, 'avatar element present in chat');
      check(!m.inBubble, 'name label inside a bubble');
      check(user.every((u) => aki.every((a) => u.left > a.left && u.right > a.right)), 'visitor bubbles not right of Aki bubbles ' + JSON.stringify(m.rows));
      check(user.every((u) => u.right > m.L.right - 30) && aki.every((a) => a.left < m.L.left + 30), 'bubbles not pinned to their sides ' + JSON.stringify([m.L, m.rows]));
      check(m.rows.every((r) => r.who === (r.start ? (r.role === 'user' ? 'You' : 'Aki') : null)), 'name labels not only at run start ' + JSON.stringify(m.rows));
      check(m.rows.some((r) => !r.start) && m.rows.filter((r) => !r.start).every((r) => r.mt === '4px'), 'same-speaker gap not 4px ' + JSON.stringify(m.rows));
      check(m.rows.every((r) => r.right - r.left < m.L.w - 40), 'short bubbles not narrower than the log ' + JSON.stringify(m.rows));
      check(m.sb.every(Boolean), 'scrollbar not thin on html/.aki-log ' + JSON.stringify(m.sb));
    });

    await step('compact chat sizing and counter', async () => {
      await viewport(1440, 900);
      await akiPage({}, { local: { 'aki:v1:history': seedHistory(3) } });
      await openChat();
      const m = await evaluate('(() => { const p = document.querySelector("#aki-panel"); const small = [];'
        + 'for (const e of p.querySelectorAll("button, a, .aki-chip")) { const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;'
        + 'const min = e.closest(".aki-foot") && e.tagName === "A" ? 24 : 32; if (r.height < min - 0.5) small.push((e.textContent || e.ariaLabel || e.className).slice(0, 20) + " " + Math.round(r.height)); }'
        + 'return { head: document.querySelector(".aki-head").getBoundingClientRect().height, width: p.getBoundingClientRect().width, small }; })()');
      check(m.head <= 52, 'header too tall ' + m.head);
      check(m.width <= 380, 'panel too wide ' + m.width);
      check(!m.small.length, 'controls too small ' + JSON.stringify(m.small));
      const type = (v) => evaluate('(() => { const el = document.getElementById("aki-input");'
        + 'Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, ' + q(v) + ');'
        + 'el.dispatchEvent(new Event("input", { bubbles: true })); })()');
      await type('');
      check(!(await evaluate('Boolean(document.querySelector("#aki-count"))')), 'counter shown at 0 chars');
      await type('a'.repeat(400));
      await until('document.querySelector("#aki-count")', 'counter at 400 chars');
    });

    await step('welcome and chat do not squeeze, footer follows the answering provider', async () => {
      const squeezed = () => evaluate('[...document.querySelectorAll(".aki-card, .aki-log")]'
        + '.filter((e) => e.scrollHeight > e.clientHeight + 1 && e.className !== "aki-log").map((e) => e.className)');
      for (const [w, h] of [[320, 568], [1440, 900]]) {
        await viewport(w, h);
        await akiPage({ memory: 'default_on', gemini: 'eligible', chat: (b) => ({ body: aiReply(b, 'hello there') }) });
        await openPanel();
        await regionSettled();
        check(!(await squeezed()).length, 'welcome cards squeezed at ' + w);
        await passGate({ gemini: true });
        await sendMessage('hi');
        await until('document.querySelector(".aki-log .aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))")', 'reply');
        check(!(await squeezed()).length, 'chat log squeezed at ' + w);
      }
      await viewport(1440, 900);
    });

    await step('a slow reply shows typing only, no Cancel', async () => {
      await akiPage({ chat: (b) => ({ body: aiReply(b, 'slow'), holdMs: 4500 }) });
      await openChat();
      await sendMessage('queued');
      await delay(3600);
      check(await evaluate('document.querySelector(".aki-status-line span[aria-hidden]:not(.aki-dot)").textContent') === AKI_MESSAGES.head.typing,
        'header does not say typing while a reply is pending');
      check(!(await exists('.aki-cancel')) && await exists('.aki-row-assistant .aki-typing'), 'Cancel shown or typing dots missing on a slow reply');
      check(await evaluate('document.querySelector(".aki-dot").dataset.level') === 'ok', 'a slow reply turned the dot busy');
      await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > 0', 'slow reply', 6000);
    });

    // ---- Welcome step, gate and footer status (addendum 6, 9) ----
    const welcomeCopy = () => evaluate('(() => { const w = document.querySelector(".aki-welcome"); const t = (s) => w.querySelector(s)?.textContent;'
      + 'return { eyebrow: t(".aki-eyebrow"), heading: t("h3"), lead: t(".aki-lead"),'
      + 'cards: [...w.querySelectorAll(".aki-card")].map((c) => [c.querySelector("strong").textContent, c.querySelector("small").textContent, c.querySelector("input").checked]),'
      + 'notes: [...w.querySelectorAll(".aki-note:not(#aki-age-hint)")].map((n) => n.textContent), hint: t("#aki-age-hint"),'
      + 'buttons: [...w.querySelectorAll(".aki-actions button")].map((b) => [b.textContent, b.disabled]),'
      + 'links: [...w.querySelectorAll(".aki-foot-links a")].map((a) => [a.textContent, a.getAttribute("href"), a.target, a.rel]) }; })()');
    await step('welcome defaults', async () => {
      const cases = [
        { name: 'default_on+eligible', patch: { memory: 'default_on', gemini: 'eligible' }, gemini: true, storage: 'default_on' },
        { name: 'opt_in+ineligible', patch: { memory: 'opt_in', gemini: 'ineligible' }, gemini: false, storage: 'opt_in' },
        { name: 'region 500', patch: { regionStatus: 500 }, gemini: false, storage: 'unknown' },
      ];
      for (const c of cases) {
        await akiPage(c.patch);
        await openPanel();
        await regionSettled();
        const w = await welcomeCopy();
        const cards = [[W.age.title, W.age.body, false]];
        if (c.gemini) cards.push([W.gemini.title, W.gemini.body, W.geminiDefault]);
        check(w.eyebrow === W.eyebrow && w.heading === W.headingTop + W.headingBottom + ' \u{1F44B}' && w.lead === W.intro,
          c.name + ': heading copy ' + JSON.stringify([w.eyebrow, w.heading, w.lead]));
        check(JSON.stringify(w.cards) === JSON.stringify(cards), c.name + ': cards ' + JSON.stringify(w.cards));
        check(JSON.stringify(w.notes) === JSON.stringify([W.storage[c.storage], c.gemini ? W.noteGemini : W.noteGroq]), c.name + ': notes ' + JSON.stringify(w.notes));
        check(w.hint === W.hint, c.name + ': hint ' + w.hint);
        check(JSON.stringify(w.buttons) === JSON.stringify([[W.continueLabel, true], [W.notNow, false]]), c.name + ': buttons ' + JSON.stringify(w.buttons));
        check(JSON.stringify(w.links) === JSON.stringify([[W.privacy, 'aki-legal.html#privacy', '_blank', 'noopener noreferrer'],
          [W.terms, 'aki-legal.html#terms', '_blank', 'noopener noreferrer']]), c.name + ': links ' + JSON.stringify(w.links));
        await setCard(W.age.title, true);
        const after = await welcomeCopy();
        check(after.buttons[0][1] === false && after.hint === undefined, c.name + ': Continue not enabled by the 18+ box');
        await setCard(W.age.title, false);
        check((await welcomeCopy()).buttons[0][1] === true, c.name + ': Continue not disabled again');
      }
    });

    await step('Not now sends nothing', async () => {
      await akiPage();
      await openPanel();
      await regionSettled();
      await click('.aki-actions .button:not(.button-solid)');
      await until('!document.querySelector("#aki-panel")', 'panel closed');
      await delay(100);
      check(String(await evaluate('document.activeElement?.className')).includes('aki-launcher'), 'Not now: focus did not return to the launcher');
      const s = await snap();
      check(stub.log.length && stub.log.every((e) => e.path === '/v1/region'), 'Not now: stub saw ' + JSON.stringify(stub.log.map((e) => e.path)));
      check(!Object.keys(s.local).length && !Object.keys(s.session).length, 'Not now: storage changed ' + JSON.stringify(s));
      check(!(await evaluate('window.__tsRenders.length')), 'Not now ran Turnstile');
    });

    await step('Continue: focus, session body, storage, chips', async () => {
      await akiPage({ regionVersion: 'v-from-region' });
      await openChat({ gemini: true });
      check(await evaluate('document.activeElement.id') === 'aki-input', 'Continue: focus is on ' + await evaluate('document.activeElement.id'));
      check(!sessionCalls().length && !chatCalls().length, 'Continue made a network call before the first send');
      const s0 = await snap();
      check(!Object.keys(s0.local).length && Object.keys(s0.session).join() === 'aki:v1:gate', 'Continue storage ' + JSON.stringify(s0));
      const chips = await texts('.aki-chip');
      check(chips.length === AKI_FAQ.length && AKI_FAQ.every((f, i) => chips[i].includes(f.label)), 'chips ' + JSON.stringify(chips));
      await sendAndWait('hello');
      const b = sessionCalls()[0].body;
      check(b.ack18 === true && b.geminiAck === true && b.consentVersion === AKI_CONSENT_VERSION && b.consentVersion !== 'v-from-region',
        'session body ' + JSON.stringify(b));
      check(JSON.stringify(Object.keys(b).sort()) === JSON.stringify(['ack18', 'consentVersion', 'geminiAck', 'turnstileToken']), 'session body keys');
      check(!Object.keys((await snap()).local).some((k) => k !== 'aki:v1:history'), 'unexpected localStorage key');

      await akiPage();
      await openChat({ gemini: false });
      await sendAndWait('hello');
      check(sessionCalls()[0].body.geminiAck === false, 'unticked Gemini sent geminiAck true');
      check(!(await snap()).local['aki:v1:memory'], 'aki:v1:memory was written');
    });

    await step('region down: geminiAck false (D21)', async () => {
      await akiPage({ regionStatus: 500, memory: 'default_on' });
      await openPanel();
      await regionSettled();
      await click('[aria-label="Close Aki"]');
      await until('!document.querySelector("#aki-panel")', 'panel closed');
      await openPanel();
      await passGate();
      check(regionCalls().length === 2, 'expected two region calls, saw ' + regionCalls().length);
      await sendAndWait('hello');
      check(sessionCalls()[0].body.geminiAck === false, 'D21: geminiAck was not false');
    });

    await step('no Remember UI; no session before the first send', async () => {
      await akiPage({ memory: 'default_on' });
      await openChat();
      check(!(await exists('.aki-memory')) && !(await exists('#aki-memory-status')), 'Remember UI still exists');
      check(stub.sessions === 0, 'a session was created before the first send');
    });

    await step('chat panel keeps one height as messages arrive', async () => {
      const height = () => evaluate('Math.round(document.querySelector("#aki-panel").getBoundingClientRect().height)');
      await akiPage({});
      await openChat();
      const before = await height();
      await sendAndWait('hello');
      await sendAndWait('tell me more about Jason and the projects Jason built recently');
      check(await height() === before, 'chat panel grew from ' + before + ' to ' + await height());
    });

    await step('no provider status in the footer', async () => {
      await akiPage({ gemini: 'eligible' });
      await openChat({ gemini: true });
      check(!(await exists('.aki-state')), 'footer still shows a provider status');

      await akiPage({ chat: () => ({ body: { type: 'faq' } }) });
      await openChat();
      await sendMessage('hello');
      await until('document.querySelector(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))")', 'faq reply');
      check((await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p')).includes(AKI_MESSAGES.region), 'region line missing after faq');
      check(!(await exists('#aki-input')), 'free-text composer still shown after faq');
    });

    await step('a stricter region applies to an existing session; IME Enter does not send', async () => {
      await akiPage({ memory: 'default_on' });
      await openChat();
      await sendAndWait('hello');
      check(await evaluate('localStorage.getItem("aki:v1:history") !== null'), 'default_on reply not in localStorage');
      stub.memory = 'opt_in';
      await click('[aria-label="Close Aki"]');
      await openPanel();
      await until('localStorage.getItem("aki:v1:history") === null && sessionStorage.getItem("aki:v1:history") !== null', 'reopen did not recheck the region');
      check(JSON.parse(await evaluate('sessionStorage.getItem("aki:v1:session")')).memory === 'opt_in', 'session rule not tightened');

      // A new tab in a stricter region moves remembered history before any gate exists.
      const kept = await evaluate('sessionStorage.getItem("aki:v1:history")');
      await akiPage({ memory: 'opt_in' }, { local: { 'aki:v1:history': kept } });
      await openPanel();
      await until('localStorage.getItem("aki:v1:history") === null && sessionStorage.getItem("aki:v1:history") !== null', 'history not moved before the gate');

      // A gate from an older consent version is rejected together with its session.
      await akiPage({}, { session: {
        'aki:v1:gate': JSON.stringify({ consentVersion: 'old', gemini: true, memory: 'on', confirmedAt: Date.now() }),
        'aki:v1:session': JSON.stringify({ sessionToken: 'old-token', expiresAt: new Date(Date.now() + 3600000).toISOString(), memory: 'default_on', gemini: true }) } });
      await openPanel();
      await until('sessionStorage.getItem("aki:v1:gate") === null && sessionStorage.getItem("aki:v1:session") === null', 'stale gate and its session cleared');

      // Storage that refuses writes: the gate lives in memory and chat still works.
      await akiPage();
      await evaluate('Storage.prototype.setItem = function () { throw new Error("blocked"); }');
      await openChat();
      await sendAndWait('hello');
      check((await texts('.aki-msg-assistant p')).length >= 2, 'no reply with storage blocked');

      await akiPage();
      await openChat();
      const chats = stub.log.length;
      await evaluate('(() => { const el = document.querySelector("#aki-input"); el.focus();'
        + 'Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, "にほ");'
        + 'el.dispatchEvent(new Event("input", { bubbles: true }));'
        + 'el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true })); })()');
      await delay(400);
      check(stub.log.length === chats && (await evaluate('document.querySelector("#aki-input").value')) === 'にほ', 'Enter during IME composition sent the message');
    });

    await step('spam cooldown is not busy; replies link only to page sections', async () => {
      await akiPage({ chat: (b, n) => ({ body: n === 1 ? { type: 'rate_limited', scope: 'ip', retryAfter: 2 }
        : aiReply(b, 'Reach Jason via the [Contact](#contact) section, not [this](https://evil.example/#contact) or [that](javascript:void0).') }) });
      await openChat();
      await sendMessage('one');
      await until('document.querySelector(".aki-status")', 'cooldown line');
      check((await texts('.aki-status')).some((t) => t.includes('spam-free')), 'cooldown copy does not mention spam');
      check(await evaluate('document.querySelector(".aki-dot").dataset.level') === 'ok', 'own cooldown turned the dot busy');
      await until('!document.querySelector(".aki-status")', 'cooldown over', 6000);
      await sendAndWait('two');
      const links = await evaluate('[...document.querySelectorAll(".aki-msg-assistant p a")].map((a) => [a.textContent, a.getAttribute("href")])');
      check(JSON.stringify(links) === JSON.stringify([['Contact', '#contact']]), 'reply links ' + JSON.stringify(links));
      check((await texts('.aki-msg-assistant p')).some((t) => t.includes('not this or that.')), 'disallowed links not shown as plain labels');
      await click('.aki-msg-assistant p a');
      await delay(1500);
      const pos = await evaluate('({ hash: location.hash, top: document.getElementById("contact").getBoundingClientRect().top, y: scrollY, max: document.documentElement.scrollHeight - innerHeight })');
      check(pos.hash === '#contact' && (Math.abs(pos.top) < 140 || pos.y >= pos.max - 2), 'not scrolled to Contact ' + JSON.stringify(pos));
      check(await exists('#aki-panel'), 'desktop panel closed on a section link');
      check(await evaluate('document.activeElement?.id') === 'contact', 'focus did not move to Contact');

      await viewport(390, 844);
      await akiPage({ chat: (b) => ({ body: aiReply(b, 'See [Work](#work).') }) });
      await openChat();
      await sendAndWait('work?');
      await click('.aki-msg-assistant p a');
      await until('!document.querySelector("#aki-panel") && location.hash === "#work" && document.activeElement?.id === "work"', 'phone panel closed, moved and focused Work', 4000);
      await viewport(1440, 900);
    });

    await step('replies render Markdown; a topic question always gets its section link', async () => {
      const md = "Jason's contact details:\n\n- **Email:** jason@example.com\n- **Phone:** `+000`\n\n*Feel free* to reach out.";
      await akiPage({ chat: (b) => ({ body: aiReply(b, md) }) });
      await openChat();
      await sendAndWait("what is jason's contact info?");
      const r = await evaluate('(() => { const m = [...document.querySelectorAll(".aki-msg-assistant")].pop();'
        + 'return { li: m.querySelectorAll("ul > li").length, strong: [...m.querySelectorAll("strong")].map((e) => e.textContent),'
        + 'em: m.querySelector("em")?.textContent, code: m.querySelector("code")?.textContent, raw: /\\*\\*|`/.test(m.textContent),'
        + 'chip: [...m.querySelectorAll(".aki-links a")].map((a) => [a.textContent, a.getAttribute("href")]) }; })()');
      check(r.li === 2 && r.strong.join() === 'Email:,Phone:' && r.em === 'Feel free' && r.code === '+000' && !r.raw, 'markdown render ' + JSON.stringify(r));
      check(JSON.stringify(r.chip) === JSON.stringify([['\u2192 Contact', '#contact']]), 'contact chip ' + JSON.stringify(r.chip));
      await click('.aki-msg-assistant .aki-links a');
      await until('location.hash === "#contact"', 'chip goes to Contact', 4000);

      // A link to another section does not cancel the asked-about one; "work" itself picks Work.
      const chipFor = async (question, reply) => {
        stub.chat = (b) => ({ body: aiReply(b, reply) });
        await sendAndWait(question);
        return evaluate('[...[...document.querySelectorAll(".aki-msg-assistant")].pop().querySelectorAll(".aki-links a")].map((a) => a.getAttribute("href")).join()');
      };
      check(await chipFor('how do I contact him?', 'See his [Work](#work).') === '#contact', 'wrong-section link suppressed the Contact chip');
      check(await chipFor("show me Jason's work", 'Plenty to see.') === '#work', 'no Work chip for "work"');
      check(await chipFor('how do I contact him?', 'Use the [Contact](#contact) form.') === '', 'chip added although Contact was linked');
      check(await chipFor('how do I contact him?', 'Use `[Contact](#contact)`.') === '#contact', 'a code-wrapped link suppressed the chip');
      check(await chipFor('how do I contact him?', 'Use **[Contact](#contact)**.') === '', 'chip added although a bold link renders');
      check(await evaluate('[...document.querySelectorAll(".aki-msg-assistant strong > a")].pop()?.getAttribute("href")') === '#contact', 'link inside bold not rendered');
      check(await chipFor('take me home', 'Sure.') === '#home', 'no Home chip');
      check(await chipFor('Has Jason built any phone apps?', 'See [Work](#work).') === '', 'phone apps got a Contact chip');
      check(await chipFor('Who is Jason?', 'An engineer.') === '#about', 'no About chip for "Who is Jason?"');
      check(await chipFor("Tell me about Jason's projects", 'See [Work](#work).') === '', '"about" as a preposition added an About chip');
      check(await chipFor("Tell me about Jason's projects", 'Several.') === '#work', 'no Work chip for projects');
      check(await chipFor("what's his phone number?", 'Here it is.') === '#contact', 'no Contact chip for a phone number');
      check(await chipFor('¿Cómo contacto a Jason?', 'Puedes escribirle.') === '#contact', 'no Contact chip for Spanish');
      // In a full log, the visitor's typing row scrolls into view.
      await evaluate('(() => { const el = document.getElementById("aki-input"); el.focus();'
        + 'Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, "h");'
        + 'el.dispatchEvent(new Event("input", { bubbles: true })); })()');
      await until('(() => { const log = document.querySelector(".aki-log"), row = document.querySelector(".aki-row-user .aki-typing");'
        + 'return row && log.scrollHeight > log.clientHeight && row.getBoundingClientRect().bottom <= log.getBoundingClientRect().bottom + 1; })()', 'visitor typing row visible');
      check(await chipFor('ジェイソンのプロジェクトは？', 'いくつかあります。') === '#work', 'no Work chip for Japanese');
      check(await chipFor('كيف أتواصل مع جيسون؟', 'يمكنك مراسلته.') === '#contact', 'no Contact chip for Arabic');
    });

    await step('send clears and disables the box; the visitor gets typing dots too', async () => {
      await akiPage({ chat: (b) => ({ body: aiReply(b, 'ok'), holdMs: 1500 }) });
      await openChat();
      await evaluate('(() => { const el = document.getElementById("aki-input"); el.focus();'
        + 'Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, "hel");'
        + 'el.dispatchEvent(new Event("input", { bubbles: true })); })()');
      await until('document.querySelector(".aki-row-user .aki-typing")', 'visitor typing dots');
      await evaluate('(() => { const el = document.getElementById("aki-input");'
        + 'Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, "hello");'
        + 'el.dispatchEvent(new Event("input", { bubbles: true })); })()');
      // A pointer click focuses Send before submitting; element.click() does not, so focus it first.
      await evaluate('document.querySelector(".aki-form button[type=submit]").focus()');
      await click('.aki-form button[type=submit]');
      await until('document.querySelector(".aki-row-assistant .aki-typing")', 'Aki typing dots');
      const s = await evaluate('(() => { const el = document.getElementById("aki-input"); return { value: el.value, disabled: el.disabled,'
        + 'you: Boolean(document.querySelector(".aki-row-user .aki-typing")) }; })()');
      check(s.value === '' && s.disabled && !s.you, 'box while Aki answers ' + JSON.stringify(s));
      await until('!document.getElementById("aki-input").disabled && document.activeElement?.id === "aki-input"', 'box enabled and focused after the reply', 6000);
    });

    await step('groq_busy holds the composer for retryAfter; narrow panels get the compact Turnstile', async () => {
      await akiPage({ chat: (b, n) => ({ body: n === 1 ? { type: 'provider_unavailable', reason: 'groq_busy', retryAfter: 3 } : aiReply(b, 'ok') }) });
      await openChat();
      await sendMessage('hello');
      await until('document.querySelector(".aki-dot")?.dataset.level === "busy" && document.querySelector(".aki-status")', 'busy wait');
      check((await texts('.aki-status')).some((t) => t.includes('very busy')), 'groq_busy wait text missing');
      check(await evaluate('document.querySelector(".aki-send").disabled'), 'send enabled during groq_busy wait');
      await until('!document.querySelector(".aki-status") && document.querySelector(".aki-dot")?.dataset.level === "ok"', 'busy cleared after the countdown', 6000);
      await viewport(320, 700);
      await akiPage({ chat: (b) => ({ body: aiReply(b, 'ok') }) });
      await openChat();
      await sendAndWait('hello');
      check((await evaluate('window.__tsRenders'))[0]?.size === 'compact', 'Turnstile at 320px: ' + JSON.stringify(await evaluate('window.__tsRenders')));
      await viewport(1440, 900);
    });

    await step('stale site: bad_consent shows the reload line', async () => {
      await akiPage({ session: () => ({ status: 400, body: { type: 'invalid_request', error: 'bad_consent' } }) });
      await openChat();
      await sendMessage('keep this text');
      await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > 0', 'updated line');
      check((await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p')).includes(AKI_MESSAGES.updated), 'updated line missing');
      check(await evaluate('document.getElementById("aki-input").value') === 'keep this text', 'typed text lost');
      await delay(200);
      check(!chatCalls().length && sessionCalls().length === 1, 'calls after bad_consent: ' + JSON.stringify(stub.log.map((e) => e.path)));
    });

    await step('old gate: no new session, welcome again', async () => {
      const hours = 3600000;
      await akiPage({ chat: () => ({ status: 401, body: { type: 'session_required' } }), memory: 'default_on' }, {
        session: {
          'aki:v1:gate': JSON.stringify({ consentVersion: AKI_CONSENT_VERSION, gemini: false, memory: 'off', confirmedAt: Date.now() - 25 * hours }),
          'aki:v1:session': JSON.stringify({ sessionToken: 'old', expiresAt: new Date(Date.now() + hours).toISOString(), memory: 'default_on', gemini: false }),
        },
      });
      await openPanel();
      await sendMessage('still here');
      await until('document.querySelector(".aki-welcome")', 'welcome after the old gate');
      check(stub.sessions === 0 && chatCalls().length === 1, 'old gate minted a session or looped (sessions ' + stub.sessions + ')');
      check(!(await snap()).session['aki:v1:gate'], 'old gate was kept');
    });

    await step('consent change (401 consent) keeps the typed text', async () => {
      await akiPage({ chat: (b, n) => (n === 1 ? { status: 401, body: { type: 'session_required', reason: 'consent' } }
        : { body: aiReply(b, 'after consent') }) });
      await openChat();
      await sendMessage('keep me');
      await until('document.querySelector(".aki-welcome")', 'welcome after consent 401');
      check(chatCalls().length === 1 && stub.sessions === 1, 'consent 401 was retried');
      check(!(await snap()).session['aki:v1:gate'], 'gate kept after consent 401');
      await passGate();
      check(await evaluate('document.getElementById("aki-input").value') === 'keep me', 'typed text lost');
      await until('!document.querySelector(".aki-form button[type=submit]").disabled', 'Send enabled');
      await click('.aki-form button[type=submit]');
      await until('document.querySelectorAll(".aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing))").length > 0', 'reply');
      check(stub.sessions === 2, 'the new gate did not mint a new session');
    });

    await step('Consent settings returns to the welcome', async () => {
      await akiPage({ memory: 'opt_in' });
      await openChat();
      await sendAndWait('one');
      await evaluate('[...document.querySelectorAll(".aki-link")].find((b) => b.getAttribute("aria-label") === "Consent settings").click()');
      await until('document.querySelector(".aki-welcome")', 'welcome from Consent settings');
      const w = await welcomeCopy();
      check(w.cards[0][2] === true && w.cards.at(-1)[2] === true, 'welcome not pre-filled ' + JSON.stringify(w.cards));
      const s = await snap();
      check(!s.session['aki:v1:gate'] && !s.session['aki:v1:session'] && hist(s, 'session'), 'Consent settings storage ' + JSON.stringify(s));
      await passGate();
      await sendAndWait('two');
      check(stub.sessions === 2, 'next send did not mint a new session (' + stub.sessions + ')');
    });

    await step('once per tab', async () => {
      await akiPage();
      await openChat();
      await sendAndWait('remember once');
      await reload();
      await openPanel();
      await delay(300);
      check(!(await exists('.aki-welcome')) && await exists('#aki-input'), 'reload showed the welcome again');
      await evaluate('sessionStorage.clear()');
      await reload();
      await openPanel();
      await until('document.querySelector(".aki-welcome")', 'welcome in a fresh tab');
      await passGate();
      check((await texts('.aki-row:not(:first-child) > .aki-msg-assistant:not(:has(.aki-typing)) p')).includes('Stub reply from Aki.'), 'history not shown after Continue');
    });

    await step('header dot shows the link state; no canvas in the panel', async () => {
      await akiPage();
      await openChat();
      await sendAndWait('hello');
      const h = await evaluate('(() => { const p = document.querySelector("#aki-panel"); return { canvas: p.querySelectorAll("canvas").length,'
        + 'level: p.querySelector(".aki-dot")?.dataset.level, text: p.querySelector("[role=status]")?.textContent }; })()');
      check(h.canvas === 0, 'panel still has a canvas');
      check(h.level === 'ok' && h.text === AKI_MESSAGES.head.ok, 'header after a reply: ' + JSON.stringify(h));
    });

    await step('header dot: busy, down, then green again', async () => {
      const head = () => evaluate('(() => { const p = document.querySelector("#aki-panel"); return { level: p.querySelector(".aki-dot")?.dataset.level,'
        + 'text: p.querySelector(".aki-status-line span[aria-hidden]:not(.aki-dot)")?.textContent }; })()');
      const seq = [{ type: 'rate_limited', scope: 'site_minute', retryAfter: 2 }, { type: 'provider_unavailable', reason: 'groq_failed' }, null];
      const quota = () => ({ type: 'quota_exhausted', scope: 'ip', resetsAt: new Date(Date.now() + 4000).toISOString() });
      await akiPage({ chat: (b, n) => ({ body: n === 4 ? quota() : seq[n - 1] || aiReply(b, 'back') }) });
      await openChat();
      await sendMessage('one');
      await until('document.querySelector(".aki-dot")?.dataset.level === "busy"', 'busy dot');
      check((await head()).text === AKI_MESSAGES.head.busy, 'busy text ' + JSON.stringify(await head()));
      await until('!document.querySelector(".aki-status")', 'rate wait over', 6000);
      await sendAndWait('two');
      check((await head()).level === 'down' && (await head()).text === AKI_MESSAGES.head.down, 'down after provider_unavailable ' + JSON.stringify(await head()));
      await sendAndWait('three');
      check((await head()).level === 'ok' && (await head()).text === AKI_MESSAGES.head.ok, 'green after a reply ' + JSON.stringify(await head()));
      await sendMessage('four');
      await until('!document.querySelector("#aki-input")', 'composer hidden after quota_exhausted');
      check((await head()).level === 'down', 'down after quota_exhausted ' + JSON.stringify(await head()));
      check((await texts('.aki-msg-assistant p')).some((t) => t.startsWith("Aki has used up today's free answers") && t.includes('after ')),
        'quota line with the reset time missing');
      check(await exists('.aki-chip'), 'quick answers hidden after quota_exhausted');
      await until('document.querySelector("#aki-input")', 'composer back after the quota reset', 9000);
      check((await head()).level === 'ok', 'not green after the quota reset ' + JSON.stringify(await head()));
    });

    await step('rounded panel and chips; welcome fits at 320px in both themes', async () => {
      await akiPage();
      await openPanel();
      const r = await evaluate('(() => { const px = (s) => parseFloat(getComputedStyle(document.querySelector(s)).borderTopLeftRadius);'
        + 'return { panel: px("#aki-panel") }; })()');
      check(r.panel >= 16, 'panel radius ' + r.panel);
      await passGate();
      check(await evaluate('getComputedStyle(document.querySelector(".aki-chip")).borderTopLeftRadius') === '999px', 'chip radius is not 999px');
      await viewport(320, 700);
      for (const scheme of ['light', 'dark']) {
        await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
        await akiPage({ gemini: 'eligible' });
        await openPanel();
        await regionSettled();
        const m = await evaluate('(() => { const W = document.documentElement.clientWidth; const p = document.querySelector("#aki-panel");'
          + 'const b = p.querySelector(".aki-body"); const r = p.getBoundingClientRect();'
          + 'return { theme: document.documentElement.dataset.theme, page: document.documentElement.scrollWidth - W, body: b.scrollWidth - b.clientWidth,'
          + 'inside: r.left >= 0 && r.right <= W, small: [...p.querySelectorAll("button, a, input")].filter((e) => { const x = e.getBoundingClientRect();'
          + 'return x.width && (e.matches("input") ? false : x.height < (e.matches(".aki-foot a") ? 24 : 32) - 1); }).map((e) => e.textContent.slice(0, 20)) }; })()');
        check(m.theme === scheme, 'theme was ' + m.theme + ', wanted ' + scheme);
        check(m.page <= 1 && m.body <= 1 && m.inside, '320px ' + scheme + ' overflow ' + JSON.stringify(m));
        check(!m.small.length, '320px ' + scheme + ' tap targets under 32px (footer links 24px): ' + JSON.stringify(m.small));
      }
      await call('Emulation.setEmulatedMedia', { features: [] });
      await viewport(1440, 900);
    });
  } finally {
    await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier }).catch(() => {});
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }).catch(() => {});
    api.close();
    site?.close();
    await rm(outDir, { recursive: true, force: true }).catch(() => {});
  }
}

try {
  if (typeof WebSocket !== 'function') {
    throw new Error('Node.js 22+ with the built-in WebSocket implementation is required');
  }
  await mkdir(folder, { recursive: true });
  const port = await waitForChromePort();
  socket = await openPageSocket(port);
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (!data.id || !pending.has(data.id)) return;
    const { resolve, reject, timeout } = pending.get(data.id);
    clearTimeout(timeout);
    pending.delete(data.id);
    if (data.error) reject(new Error(data.error.message));
    else resolve(data.result);
  };
  await call('Page.enable');
  await call('Runtime.enable');

  // Full coverage on wide desktop, laptop, both tablet orientations and phones.
  // Every one of these widths checks Home + Work + About + Process + Contact.
  const profiles = [
    { label: 'desktop-xl', width: 1920, height: 1080, captureAll: false },
    { label: 'desktop', width: 1440, height: 900, captureAll: true },
    { label: 'laptop', width: 1024, height: 768, captureAll: false },
    { label: 'tablet-medium', width: 834, height: 1112, captureAll: false },
    { label: 'tablet', width: 768, height: 1024, captureAll: true },
    { label: 'phone-large', width: 430, height: 932, captureAll: false },
    { label: 'mobile', width: 390, height: 844, captureAll: true },
    { label: 'phone-small', width: 360, height: 800, captureAll: false },
    { label: 'phone-compact', width: 320, height: 700, captureAll: true },
  ];
  const sections = ['work', 'about', 'process', 'contact'];
  for (const profile of profiles) {
    await viewport(profile.width, profile.height);
    await navigate(baseUrl + '?smoke=responsive-' + profile.label);
    await verifyNavigation(profile.label, profile.width);
    await capture(profile.label, null, profile.width, profile.height, profile.captureAll);
    for (const section of sections) {
      await capture(profile.label + '-' + section, section,
        profile.width, profile.height, profile.captureAll);
    }
    console.log('[responsive]', profile.label, profile.width, profile.height, 'all five sections passed');
  }

  // Direct deep links require a fresh document, because React mounts its
  // hash targets after Chrome initially receives the URL.
  for (const profile of [
    { label: 'desktop', width: 1440, height: 900 },
    { label: 'tablet', width: 768, height: 1024 },
    { label: 'mobile', width: 390, height: 844 },
  ]) {
    await viewport(profile.width, profile.height);
    for (const section of sections) {
      await navigate(baseUrl + '?smoke=deep-' + profile.label + '-' + section + '#' + section);
      await capture('deep-' + profile.label + '-' + section,
        section, profile.width, profile.height, section === 'about', true);
    }
  }

  await runAkiSmoke();

  // Both large and narrow screens must honor reduced-motion.
  await call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  for (const profile of [
    { label: 'desktop', width: 1440, height: 900 },
    { label: 'mobile', width: 390, height: 844 },
  ]) {
    await viewport(profile.width, profile.height);
    await navigate(baseUrl + '?smoke=reduced-motion-' + profile.label);
    const indicatorPresent = await evaluate('Boolean(document.querySelector(".reading-progress"))');
    if (indicatorPresent) {
      throw new Error('Reduced-motion mode still rendered the progress indicator at ' + profile.width);
    }
    await capture('reduced-motion-' + profile.label, null,
      profile.width, profile.height);
    await capture('reduced-motion-' + profile.label + '-process',
      'process', profile.width, profile.height, false);
  }

  console.log('All scroll and screenshot smoke checks passed.');
} finally {
  if (socket) socket.close();
  chrome.kill('SIGTERM');
  await delay(150);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

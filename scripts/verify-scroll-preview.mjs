/**
 * Dependency-free Chrome DevTools screenshots and scroll smoke checks.
 * Run after "npm run build" while Vite preview is listening on 127.0.0.1:4173.
 * Requires Node.js 22+ and a Chrome/Chromium binary.
 *
 * Unlike "chrome --headless --screenshot=URL#section", this navigates a real
 * browser tab, waits for React, scrolls explicitly, then waits for paint.
 */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';

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
    + 'headerHeight: document.querySelector(".site-header")?.getBoundingClientRect().height || 0};'
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
    if (info.top < info.headerHeight - 12 || info.top > info.headerHeight + 38) {
      throw new Error('Sticky-header anchor spacing is incorrect at ' + name
        + ': ' + JSON.stringify(info));
    }
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

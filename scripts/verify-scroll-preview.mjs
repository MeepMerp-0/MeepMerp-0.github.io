/**
 * Dependency-free Chrome DevTools screenshots and scroll smoke checks.
 * Run after "npm run build" while Vite preview is listening on 127.0.0.1:4173.
 * Requires Node.js 22+ and a Chrome/Chromium binary.
 *
 * Unlike "chrome --headless --screenshot=URL#section", this navigates a real
 * browser tab, waits for React, scrolls explicitly, then waits for paint.
 */
import { spawn } from 'node:child_process';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
const chromeBin = process.env.CHROME_BIN || 'google-chrome';
const folder = 'ui-previews';
const profile = await mkdtemp(join(tmpdir(), 'portfolio-motion-chrome-'));
const chrome = spawn(chromeBin, [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--no-first-run',
  '--remote-allow-origins=*',
  '--remote-debugging-port=0',
  '--user-data-dir=' + profile,
  'about:blank',
], { stdio: 'ignore' });

let socket;
let nextId = 0;
const pending = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForChromePort() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const config = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
      const port = Number(config.split(/\r?\n/)[0]);
      if (Number.isInteger(port) && port > 0) return port;
    } catch {
      // Chrome hasn't started its DevTools endpoint yet.
    }
    if (chrome.exitCode !== null) throw new Error('Chrome exited before DevTools initialized');
    await delay(100);
  }
  throw new Error('Chrome did not open its DevTools endpoint in time');
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
  await delay(170);
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
    + 'viewportWidth: document.documentElement.clientWidth};'
    + '})()');
}

async function capture(name, section, width, height, alreadyScrolled = false) {
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
      throw new Error('Horizontal overflow at ' + section + ': '
        + JSON.stringify(info));
    }
    console.log('[section]', name, JSON.stringify(info));
  }
  const result = await call('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  const data = Buffer.from(result.data, 'base64');
  if (data.length < 1024) throw new Error('Chrome generated an empty screenshot: ' + name);
  await writeFile(join(folder, name + '.png'), data);
  console.log('[screenshot]', name, width + 'x' + height, data.length + ' bytes');
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

  await viewport(1440, 900);
  await navigate(baseUrl);
  await capture('desktop', null, 1440, 900);
  for (const section of ['work', 'about', 'process', 'contact']) {
    await capture(section, section, 1440, 900);
  }

  await viewport(390, 844);
  await navigate(baseUrl);
  await capture('mobile', null, 390, 844);
  await capture('mobile-work', 'work', 390, 844);

  // Deep-link test: React mounts the target after the browser receives #about.
  await viewport(1440, 900);
  await navigate(baseUrl + '?smoke=deep-link#about');
  await capture('deep-link-about', 'about', 1440, 900, true);

  // Respect system and browser Reduced Motion, including linked page progress.
  await call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await navigate(baseUrl + '?smoke=reduced-motion');
  const indicatorPresent = await evaluate('Boolean(document.querySelector(".reading-progress"))');
  if (indicatorPresent) {
    throw new Error('Reduced-motion mode still rendered the animated reading indicator');
  }
  await capture('reduced-motion-home', null, 1440, 900);

  console.log('All scroll and screenshot smoke checks passed.');
} finally {
  if (socket) socket.close();
  chrome.kill('SIGTERM');
  await delay(150);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

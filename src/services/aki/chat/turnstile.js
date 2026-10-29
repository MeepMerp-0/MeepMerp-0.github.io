// The Cloudflare Turnstile bot check that every new session needs, run in a container the panel provides.
const SITEKEY = import.meta.env.VITE_AKI_TURNSTILE_SITEKEY || '';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const BOT_CHECK_TIMEOUT_MS = 45000;

let scriptLoad = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptLoad ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => { scriptLoad = null; reject(new Error('turnstile')); };
    document.head.append(s);
  });
  return scriptLoad;
}

// Without a sitekey the client sends an empty token; the real Worker rejects it.
export async function turnstileToken(container, signal) {
  if (!SITEKEY) return '';
  // The script load counts against the same timeout and Cancel as the widget.
  const ts = await new Promise((resolve, reject) => {
    const stop = (e) => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); reject(e); };
    const onAbort = () => stop(new Error('aborted'));
    const timer = setTimeout(() => { scriptLoad = null; stop(new Error('turnstile')); }, BOT_CHECK_TIMEOUT_MS);
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
    const timer = setTimeout(fail, BOT_CHECK_TIMEOUT_MS);
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

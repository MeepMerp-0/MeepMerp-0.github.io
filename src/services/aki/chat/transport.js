// Requests to the Aki Worker.
const API = (import.meta.env.VITE_AKI_API_URL || '').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 45000;

export const AKI_ENABLED = Boolean(API);

// Never rejects: a network error, the timeout or a Cancel gives status 0, or a null body if the answer had begun.
export async function post(path, body, signal, ms = REQUEST_TIMEOUT_MS) {
  const inner = new AbortController();
  const abort = () => inner.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, ms);
  // A form (voice audio) gets the browser's own multipart type and boundary; both stay CORS simple requests.
  const form = body instanceof FormData;
  try {
    const res = await fetch(API + path, {
      method: 'POST',
      headers: form ? {} : { 'Content-Type': 'text/plain;charset=utf-8' },
      body: form ? body : JSON.stringify(body),
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

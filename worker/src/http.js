function statusOf(body) {
  switch (body.type) {
    case 'rate_limited': case 'quota_exhausted': return 429;
    case 'session_required': return 401;
    case 'session_denied': return 403;
    case 'invalid_request':
      return body.error === 'body_too_large' ? 413 : body.error === 'turn_reused' ? 409 : 400;
    default: return 200;
  }
}

/** A B4 body with its status. `origin` is the allowed origin for the CORS headers, or null before that check. */
export function json(body, origin) {
  const headers = new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' });
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }
  return new Response(JSON.stringify(body), { status: statusOf(body), headers });
}

export const empty = (status) => new Response(null, { status });

// 499, nginx's "client closed request": the visitor cancelled or disconnected, so no one reads the reply.
export const clientClosed = () => empty(499);

export function preflight(origin) {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      'access-control-max-age': '600',
      vary: 'Origin',
    },
  });
}

export const bad = (error) => ({ type: 'invalid_request', error });

// Reads at most `max` bytes: a chunked body with no content-length is cut off, not buffered whole.
export async function readBody(request, max) {
  if (Number(request.headers.get('content-length')) > max) return null;
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { all.set(c, at); at += c.byteLength; }
  return all;
}

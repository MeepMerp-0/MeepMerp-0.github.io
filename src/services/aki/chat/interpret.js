// The Worker's answer as a result kind; an answer it does not recognise counts as 'network'.
export function interpret({ status, body }) {
  const t = body?.type;
  if (status === 0 || !t) return { kind: 'network' };
  if (status === 401 && t === 'session_required') return { kind: 'session_required', reason: body.reason };
  if (t === 'ai' && typeof body.reply === 'string' && typeof body.sig === 'string' && Number.isFinite(body.ts)) {
    return {
      kind: 'ai', reply: body.reply, sig: body.sig, ts: body.ts, prev: body.prevSig ?? '', provider: body.provider,
    };
  }
  if (t === 'transcript' && typeof body.text === 'string') return { kind: 'transcript', text: body.text.trim() };
  if (t === 'faq') return { kind: 'faq' };
  if (t === 'provider_unavailable') {
    const retryAfter = Math.ceil(Number(body.retryAfter));
    return { kind: 'unavailable', reason: body.reason, ...(retryAfter > 0 ? { retryAfter } : {}) };
  }
  if (t === 'rate_limited') {
    return { kind: 'rate', scope: body.scope, retryAfter: Math.max(1, Math.ceil(Number(body.retryAfter) || 5)) };
  }
  if (t === 'quota_exhausted') {
    const resetsAt = Date.parse(body.resetsAt);
    return { kind: 'quota', ...(Number.isFinite(resetsAt) ? { resetsAt } : {}) };
  }
  if (t === 'invalid_request') return { kind: 'invalid', error: body.error };
  return { kind: 'network' };
}

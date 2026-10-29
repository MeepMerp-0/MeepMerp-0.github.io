/**
 * POST /v1/transcribe: voice clips from browsers without a speech service. The multipart body holds sessionToken and
 * file, a WebM, Ogg or MP4 audio clip. Checked in this order: form (400), session (401), cv at or after VOICE_NOTICE
 * (401 consent), STT off or SITE_DAILY_CAP 0 (disabled), no ip (misconfigured), AI_BLOCKED (faq), aborted (499),
 * limiter.transcribe, Groq Whisper, then Workers AI Whisper once if Groq failed → {type:'transcript', text, provider}.
 * Never quota_exhausted: the client would close chat for the day.
 */

import { bad, clientClosed } from '../http.js';
import { AI_BLOCKED } from '../regions.js';
import { VOICE_NOTICE, verifySession, visitorKey } from '../auth.js';
import { Groq } from '../providers/groq.js';
import { WorkersAI } from '../providers/workersAI.js';

// Groq picks the decoder from the file name's extension: take it from the checked type, never the client's name.
const audioExt = (file) => /^audio\/(webm|ogg|mp4)$/.exec(file.type.split(';')[0].trim().toLowerCase())?.[1];

export async function transcribe({ config, deps, body, respond }) {
  const { limiter } = deps;
  const token = body.get('sessionToken');
  const file = body.get('file');
  const ext = file instanceof Blob && file.size ? audioExt(file) : null;
  if (typeof token !== 'string' || !ext) return respond(bad('bad_request'));
  const session = await verifySession(config.sessionSecret, token, deps.now());
  if (!session) return respond({ type: 'session_required' });
  // A session agreed under an older notice (still valid for chat during a rollout) must agree again first. Not the
  // exact current one: a bundle a bump behind already told its visitors, and could only ever mint its own version.
  if (!(session.cv >= VOICE_NOTICE)) return respond({ type: 'session_required', reason: 'consent' });
  if (!config.stt.on || config.siteDailyCap === 0) return respond({ type: 'provider_unavailable', reason: 'disabled' });
  if (!deps.ip) return respond({ type: 'provider_unavailable', reason: 'misconfigured' });
  if (AI_BLOCKED.includes(deps.country)) return respond({ type: 'faq', reason: 'region' });
  if (deps.signal?.aborted) return clientClosed();
  const key = { cfg: config.limits, ipKey: await visitorKey(config, deps.ip), sid: session.sid };
  let r = await limiter.transcribe(key);
  if (r.type !== 'go') return respond(r);
  const failed = { type: 'provider_unavailable', reason: 'stt_failed' };
  if (r.provider === 'groq') {
    const w = await new Groq(config, deps).transcribe(file, ext);
    if (w.ok) return respond({ type: 'transcript', text: w.text.trim(), provider: 'groq' });
    console.log(JSON.stringify({ stt_failed: w.status }));
    // One DO call records a 429 pause (Whisper's own; chat's Groq is untouched) and claims the backup.
    const fallback = { status: w.status, retryAfter: w.retryAfter };
    r = await Promise.resolve().then(() => limiter.transcribe({ ...key, fallback })).catch(() => null);
    if (r?.type !== 'go') return respond(failed);
  }
  const b = await new WorkersAI(config, deps).transcribe(file);
  if (b.ok) return respond({ type: 'transcript', text: b.text.trim(), provider: 'workers_ai' });
  console.log(JSON.stringify({ stt_backup_failed: true }));
  return respond(failed);
}

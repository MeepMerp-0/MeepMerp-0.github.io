/**
 * The Aki API (plan B1-B4, addendum D19-D21): POST /v1/session, /v1/chat, /v1/region and /v1/transcribe.
 *
 *   handle(request, env, deps) → Promise<Response>
 *     deps = {limiter, fetch, sleep(ms, signal), signal, waitUntil(promise), country, ip, now(), ai}
 *       limiter  object with the limiter.js OPS (reserve ... transcribe); methods may be async (DO stub)
 *       country  request.cf?.country as is; ip  the cf-connecting-ip header value or null; now  Worker clock (ms)
 *       ai  the Workers AI binding (env.AI) or undefined
 *   Checked in this order: path (404), method other than POST or OPTIONS (405), body size (413), readConfig
 *   (misconfigured), origin (403), OPTIONS (204 preflight), body parse (400). The route then gets
 *   {config, deps, body, respond(body) → Response}, where body is the JSON object, or a FormData for /v1/transcribe.
 *   Anything thrown after the method check fails closed as provider_unavailable{reason:'groq_failed'}.
 */

import { bad, empty, json, preflight, readBody } from './http.js';
import { readConfig } from './config.js';
import { chat } from './routes/chat.js';
import { region } from './routes/region.js';
import { session } from './routes/session.js';
import { transcribe } from './routes/transcribe.js';

const MAX_BODY_BYTES = 32 * 1024;
// 30 s of Opus fits even at an ignored 128 kbps bitrate hint.
const MAX_AUDIO_BODY_BYTES = 1024 * 1024;

const parseJson = (bytes) => JSON.parse(new TextDecoder().decode(bytes));
// The audio route's bytes go to the multipart parser as they are: decoding them as text would corrupt the clip.
const parseForm = (bytes, request) =>
  new Response(bytes, { headers: { 'content-type': request.headers.get('content-type') ?? '' } }).formData();

const ROUTES = {
  '/v1/session':    { maxBody: MAX_BODY_BYTES,       parse: parseJson, run: session },
  '/v1/chat':       { maxBody: MAX_BODY_BYTES,       parse: parseJson, run: chat },
  '/v1/region':     { maxBody: MAX_BODY_BYTES,       parse: parseJson, run: region },
  '/v1/transcribe': { maxBody: MAX_AUDIO_BODY_BYTES, parse: parseForm, run: transcribe },
};

export async function handle(request, env, deps) {
  const route = ROUTES[new URL(request.url).pathname];
  if (!route) return empty(404);
  if (request.method !== 'POST' && request.method !== 'OPTIONS') return empty(405);
  try {
    let bytes;
    if (request.method === 'POST') {
      bytes = await readBody(request, route.maxBody);
      if (!bytes) return json(bad('body_too_large'), null);
    }
    const config = readConfig(env, deps.ai);
    if (!config.ok) return json({ type: 'provider_unavailable', reason: 'misconfigured' }, null);
    const origin = request.headers.get('origin');
    if (!origin || !config.origins.includes(origin)) return empty(403);
    if (request.method === 'OPTIONS') return preflight(origin);
    const respond = (b) => json(b, origin);
    let body;
    try {
      body = await route.parse(bytes, request);
    } catch {
      return respond(bad('bad_request'));
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(bad('bad_request'));
    // Awaited here, so a route that rejects still lands in the catch below.
    return await route.run({ config, deps, body, respond });
  } catch {
    return json({ type: 'provider_unavailable', reason: 'groq_failed' }, null);
  }
}

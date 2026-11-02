/**
 * POST /v1/chat: one visitor turn. An AI_BLOCKED country gets the quick answers (faq); any other turn runs as a ChatTurn.
 *   prepareChat(req) → {response} | {ctx} checks the shape, the message and the signed history, then re-checks the
 *   session from /v1/session: its cv against the CONSENT_VERSION list (401 session_required{reason:"consent"}), its g
 *   and this request's country. It also refuses cap=0 and a missing cf-connecting-ip.
 *   ctx = {sid, turnId, mid, message (trimmed), history (verified, clipped and capped, user/assistant pairs), chainPrev,
 *   ipKey, country, gemini (boolean: §1.1 checks 1-4), backups (agreed under BACKUP_NOTICE or later)}.
 */

import { bad } from '../http.js';
import { AI_BLOCKED, geminiSwitch } from '../regions.js';
import { SIG_RE } from '../hmac.js';
import { BACKUP_NOTICE, verifySession, visitorKey } from '../auth.js';
import { MAX_MESSAGE, capHistory, cpLength, validHistory, verifyChain } from '../history.js';
import { ChatTurn } from './chatTurn.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function prepareChat(req) {
  const { config, deps, body, respond } = req;
  const fail = (b) => ({ response: respond(b) });
  const { sessionToken, turnId, mid, prevSig, message, history } = body;
  if (typeof sessionToken !== 'string' || typeof turnId !== 'string' || !UUID_RE.test(turnId)
    || typeof mid !== 'string' || !UUID_RE.test(mid) || typeof prevSig !== 'string' || (prevSig !== '' && !SIG_RE.test(prevSig))
    || typeof message !== 'string' || !Array.isArray(history)) {
    return fail(bad('bad_request'));
  }
  const text = message.trim();
  if (!text) return fail(bad('empty_message'));
  if (cpLength(text) > MAX_MESSAGE) return fail(bad('message_too_long'));
  if (!validHistory(history)) return fail(bad('bad_history'));
  const session = await verifySession(config.sessionSecret, sessionToken, deps.now());
  if (!session) return fail({ type: 'session_required' });
  if (!config.consentVersions.includes(session.cv)) return fail({ type: 'session_required', reason: 'consent' });
  if (config.siteDailyCap === 0) return fail({ type: 'provider_unavailable', reason: 'disabled', turnId });
  if (!deps.ip) return fail({ type: 'provider_unavailable', reason: 'misconfigured', turnId });
  const chain = await verifyChain(config.sessionSecret, mid, prevSig, history, deps.now());
  return {
    ctx: {
      sid: session.sid,
      turnId,
      mid,
      message: text,
      history: capHistory(chain.history),
      chainPrev: chain.chainPrev,
      ipKey: await visitorKey(config, deps.ip),
      country: deps.country,
      gemini: session.g && geminiSwitch(config, deps.country) === 'eligible',
      backups: session.cv >= BACKUP_NOTICE,
    },
  };
}

export async function chat(req) {
  const prepared = await prepareChat(req);
  if (prepared.response) return prepared.response;
  const { ctx } = prepared;
  if (AI_BLOCKED.includes(ctx.country)) return req.respond({ type: 'faq', turnId: ctx.turnId, reason: 'region' });
  return new ChatTurn(req, ctx).run();
}

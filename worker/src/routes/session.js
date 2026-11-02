/**
 * POST /v1/session: the Terms gate (addendum §2). A token is minted only for {ackTerms:true, geminiAck:boolean,
 * consentVersion in the CONSENT_VERSION list} and a passing Turnstile check. It is signed over {sid, exp, cv, g},
 * where g = geminiAck && the country is eligible.
 */

import { DAY } from '../time.js';
import { bad } from '../http.js';
import { geminiSwitch, memoryRule } from '../regions.js';
import { signSession } from '../auth.js';

const SESSION_TTL_MS = DAY;
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const SITEVERIFY_TIMEOUT_MS = 5_000;

async function siteverify(config, deps, token) {
  const { fetch } = deps;
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({ secret: config.turnstileSecret, response: token }),
      signal: AbortSignal.timeout(SITEVERIFY_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const j = await res.json();
    if (j?.success !== true) return false;
    // Cloudflare's test secret answers for example.com with no action; only a dev config (TURNSTILE_TEST_KEYS) accepts that.
    if (config.turnstileTestKeys && j.metadata?.result_with_testing_key === true) return true;
    return config.hostnames.includes(j.hostname) && config.actions.includes(j.action);
  } catch {
    return false;
  }
}

export async function session({ config, deps, body, respond }) {
  const token = body.turnstileToken;
  if (typeof token !== 'string') return respond(bad('bad_request'));
  // The Terms gate (§2), checked before siteverify so a bad request spends no siteverify call.
  const { ackTerms, geminiAck, consentVersion } = body;
  if (ackTerms !== true || typeof geminiAck !== 'boolean' || !config.consentVersions.includes(consentVersion)) {
    return respond(bad('bad_consent'));
  }
  if (config.siteDailyCap === 0) return respond({ type: 'provider_unavailable', reason: 'disabled' });
  if (!token || token.length > 2048 || !(await siteverify(config, deps, token))) return respond({ type: 'session_denied' });
  const country = deps.country;
  // The server downgrades the Gemini flag itself and never trusts the client.
  const g = geminiAck && geminiSwitch(config, country) === 'eligible';
  const sid = crypto.randomUUID();
  // The audit record; a failed write fails the session closed (handle's catch).
  await deps.limiter.consent({ sid, consentVersion, gemini: g, country: country ?? null });
  const exp = deps.now() + SESSION_TTL_MS;
  return respond({
    type: 'session',
    sessionToken: await signSession(config.sessionSecret, { sid, exp, cv: consentVersion, g }),
    expiresAt: new Date(exp).toISOString(),
    memory: memoryRule(country),
    gemini: g ? 'on' : 'off',
  });
}

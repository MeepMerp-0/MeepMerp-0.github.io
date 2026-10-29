// The Worker's vars. A missing or invalid required var fails the whole config; Gemini and Gemma, the
// Workers AI backup and voice are optional, and a missing or invalid var just turns that feature off.

import { AI_BLOCKED, EEA_UK_CH, isCountry } from './regions.js';

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';
const intIn = (v, min, max) => (typeof v === 'string' && /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max ? Number(v) : null);

function list(v) {
  if (typeof v !== 'string') return null;
  const items = v.split(',').map((s) => s.trim());
  return items.every(Boolean) ? items : null;
}

function readGemini(env) {
  const dailyCap = intIn(env.GEMINI_DAILY_CAP, 1, 500);
  const countries = list(env.GEMINI_ALLOWED_COUNTRIES);
  const countriesOk = countries && countries.every((c) => isCountry(c) && !EEA_UK_CH.includes(c) && !AI_BLOCKED.includes(c));
  const on = env.GEMINI_ENABLED === 'true' && dailyCap !== null && countriesOk
    && nonEmpty(env.GEMINI_MODEL) && nonEmpty(env.GEMINI_API_KEY);
  // Gemma on the same key and terms: an extra Google tier after Gemini is capped or paused. Unset = off.
  const gemmaCap = nonEmpty(env.GEMMA_MODEL) ? intIn(env.GEMMA_DAILY_CAP, 1, 14400) : null;
  return on
    ? { on, dailyCap, countries, model: env.GEMINI_MODEL.trim(), apiKey: env.GEMINI_API_KEY.trim(),
      gemmaModel: gemmaCap ? env.GEMMA_MODEL.trim() : '', gemmaDailyCap: gemmaCap ?? 0 }
    : { on: false, dailyCap: 0, countries: [], model: '', apiKey: '', gemmaModel: '', gemmaDailyCap: 0 };
}

/** Workers AI backup (env.AI binding): on only with a model and a daily cap; the cap keeps it in the free allocation. */
function readBackup(env, ai) {
  const dailyCap = intIn(env.WORKERS_AI_DAILY_CAP, 1, 1000);
  return ai && typeof ai.run === 'function' && nonEmpty(env.WORKERS_AI_MODEL) && dailyCap !== null
    ? { on: true, model: env.WORKERS_AI_MODEL.trim(), dailyCap }
    : { on: false, model: '', dailyCap: 0 };
}

/** Voice transcription: Groq Whisper, then Workers AI Whisper (env.AI) as its backup. Invalid or unset = off. */
function readStt(env, ai) {
  const perMin = intIn(env.STT_SITE_PER_MIN, 1, 20);
  const dailyCap = intIn(env.STT_DAILY_CAP, 1, 2000);
  const backupCap = intIn(env.STT_BACKUP_DAILY_CAP, 1, 1000);
  const on = nonEmpty(env.STT_MODEL) && perMin !== null && dailyCap !== null;
  const backupOn = typeof ai?.run === 'function' && nonEmpty(env.STT_BACKUP_MODEL) && backupCap !== null;
  return {
    stt: { on, model: on ? env.STT_MODEL.trim() : '', backupOn, backupModel: backupOn ? env.STT_BACKUP_MODEL.trim() : '' },
    limits: { sttSitePerMin: on ? perMin : 0, sttDailyCap: on ? dailyCap : 0, sttBackupDailyCap: backupOn ? backupCap : 0 },
  };
}

/**
 * → {ok:false} | {ok:true, ..., consentVersion, limits (the cfg object for limiter.js), gemini, backup, stt}.
 * `ai` is the Workers AI binding (env.AI) or undefined. `gemini.on` is false unless GEMINI_ENABLED === "true" and
 * every Gemini var is valid (plan B1 "off vs ineligible").
 */
export function readConfig(env, ai) {
  const e = env ?? {};
  const origins = list(e.ALLOWED_ORIGINS);
  const hostnames = list(e.TURNSTILE_HOSTNAMES);
  const actions = list(e.TURNSTILE_ACTIONS);
  const siteDailyCap = intIn(e.SITE_DAILY_CAP, 0, 20000);
  // Groq's own daily budget inside the site cap (its free tier has a daily token limit); unset means the site cap.
  const groqDailyCap = e.GROQ_DAILY_CAP === undefined ? siteDailyCap : intIn(e.GROQ_DAILY_CAP, 0, 1000);
  const groqSitePerMin = intIn(e.GROQ_SITE_PER_MIN, 1, Number.MAX_SAFE_INTEGER);
  const maxTokens = intIn(e.GROQ_MAX_COMPLETION_TOKENS, 1, Number.MAX_SAFE_INTEGER);
  const maxQueueWait = intIn(e.MAX_QUEUE_WAIT, 0, 30);
  const maxQueueDepth = intIn(e.MAX_QUEUE_DEPTH, 1, 10);
  const ok = ['GROQ_API_KEY', 'SESSION_HMAC_SECRET', 'IP_HASH_SECRET', 'TURNSTILE_SECRET', 'GROQ_MODEL', 'CONSENT_VERSION'].every((k) => nonEmpty(e[k]))
    && origins && hostnames && actions
    && [siteDailyCap, groqDailyCap, groqSitePerMin, maxTokens, maxQueueWait, maxQueueDepth].every((n) => n !== null);
  if (!ok) return { ok: false };
  const gemini = readGemini(e);
  const backup = readBackup(e, ai);
  // Not in the required list above: a missing STT var turns voice off, never chat.
  const stt = readStt(e, ai);
  // Current version first; while a new notice rolls out the previous one may follow a comma, so the
  // live site keeps working until its new bundle deploys. Remove it once the site is updated.
  const versions = e.CONSENT_VERSION.split(',').map((v) => v.trim());
  return {
    ok: true,
    groqApiKey: e.GROQ_API_KEY.trim(),
    sessionSecret: e.SESSION_HMAC_SECRET.trim(),
    ipSecret: e.IP_HASH_SECRET.trim(),
    turnstileSecret: e.TURNSTILE_SECRET.trim(),
    turnstileTestKeys: e.TURNSTILE_TEST_KEYS === 'true',
    groqModel: e.GROQ_MODEL.trim(),
    consentVersion: versions[0],
    consentVersions: versions.filter(Boolean),
    origins,
    hostnames,
    actions,
    siteDailyCap,
    maxTokens,
    limits: { siteDailyCap, groqDailyCap, groqSitePerMin, maxQueueWait, maxQueueDepth, geminiDailyCap: gemini.dailyCap,
      gemmaDailyCap: gemini.gemmaDailyCap, backupDailyCap: backup.dailyCap, ...stt.limits },
    gemini,
    backup,
    stt: stt.stt,
  };
}

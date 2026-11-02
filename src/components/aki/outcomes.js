import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';

// What one chat result changes, as data, so it can all be applied in one render. draft is 'clear' after an answer
// and 'restore' otherwise: a message that got no answer goes back in the box. A field left out changes nothing.
export function chatOutcome(res) {
  if (res.kind === 'ai') {
    return {
      draft: 'clear',
      connection: 'ok',
      reply: { content: res.reply, sig: res.sig, ts: res.ts, prev: res.prev },
      mood: { state: 'speaking', ms: Math.min(4000, 1000 + res.reply.length * 25) },
    };
  }
  return { draft: 'restore', ...unanswered(res) };
}

function unanswered(res) {
  switch (res.kind) {
    case 'faq':
      return { quickOnly: true, note: MSG.region };
    case 'consent':
      return { consent: true };
    case 'rate':
      return { cooldown: cooldown(res.retryAfter, res.scope === 'site_minute' || res.scope === 'queue_full') };
    case 'updated':
      return { note: MSG.updated };
    case 'quota': {
      const at = res.resetsAt
        && new Date(res.resetsAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
      return { connection: 'down', quickOnly: true, quotaUntil: res.resetsAt, note: MSG.quota(at && `after ${at}`) };
    }
    case 'unavailable':
      // Blocked content says nothing about the connection, so it leaves the connection state alone.
      if (res.reason === 'content_blocked') return { note: MSG.blocked };
      if (res.reason !== 'groq_busy') return { connection: 'down', ...failure() };
      if (res.retryAfter) return { connection: 'busy', cooldown: cooldown(res.retryAfter, true) };
      return { connection: 'busy', ...failure() };
    case 'network':
    case 'invalid':
      return { connection: 'down', ...failure() };
    default:
      return failure();
  }
}

function cooldown(seconds, siteWide) {
  return { seconds, siteWide, announcement: siteWide ? MSG.veryBusy(seconds) : MSG.retry(seconds) };
}

// A new mood object every time, so a second failure restarts the error face's timer.
function failure() {
  return { note: MSG.failure, mood: { state: 'error', ms: 2000 } };
}

// A transcription as listen() takes it: the text, or a code that onError turns into a note.
const VOICE_ERROR = { consent: 'consent', faq: 'region', updated: 'updated', rate: 'busy' };

export function toVoiceResult(res) {
  if (res.kind === 'transcript') return { text: res.text };
  return { error: VOICE_ERROR[res.kind] ?? (res.reason === 'stt_busy' ? 'busy' : 'unavailable') };
}

// 'network' only comes from the browser's own speech service; record-mode network failures arrive as 'unavailable'.
const VOICE_NOTE = {
  'not-allowed': MSG.micBlocked, network: MSG.voiceNetwork, region: MSG.region, updated: MSG.updated,
  busy: MSG.voiceBusy, unavailable: MSG.voiceDown,
};

export const voiceNote = (code) => VOICE_NOTE[code] ?? MSG.voiceFailed;

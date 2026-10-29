// Aki chat client: Turnstile, gate, session, turn ids, history window and the region-aware memory rules (B4/B5).
// The UI imports only this module; the parts live in aki/chat/.
import { buildWindow } from './aki/chat/history.js';
import { clearGate, readGate, tightenRule } from './aki/chat/memory.js';
import { SessionManager } from './aki/chat/sessionManager.js';
import { post } from './aki/chat/transport.js';

export { AKI_ENABLED } from './aki/chat/transport.js';
export { codePoints } from './aki/chat/history.js';
export { appendPair, clearGate, clearHistory, loadHistory, readGate, writeGate } from './aki/chat/memory.js';

// A chat turn may run Gemini, Groq, Workers AI and Gemma in turn (12 + 10 + 10 + 12 s at most), plus any
// Groq queue or hop wait (MAX_QUEUE_WAIT: 0 s in production, 5 s in dev).
const CHAT_TIMEOUT_MS = 60_000;
// The Worker tries Groq, then Workers AI (10 s each), plus the upload.
const TRANSCRIBE_TIMEOUT_MS = 25_000;
const REGION_TIMEOUT_MS = 5000;
const REGION_FAILSAFE = { memory: 'opt_in', gemini: 'ineligible', consentVersion: null };

export const AKI_CAN_CHAT = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
export const newId = () => crypto.randomUUID();

const sessions = new SessionManager();
// Shared only while in flight: each panel open asks again, so a move to a stricter region is seen.
let regionLoad = null;

export function fetchRegion() {
  regionLoad ??= post('/v1/region', {}, undefined, REGION_TIMEOUT_MS).then(({ status, body }) => {
    if (status !== 200 || body?.type !== 'region') return REGION_FAILSAFE;
    const consentVersion = typeof body.consentVersion === 'string' ? body.consentVersion : null;
    const gate = readGate();
    if (consentVersion && gate && gate.consentVersion !== consentVersion) clearGate();
    if (body.memory !== 'default_on') tightenRule();
    return {
      memory: body.memory === 'default_on' ? 'default_on' : 'opt_in',
      gemini: body.gemini === 'eligible' ? 'eligible' : 'ineligible',
      consentVersion,
    };
  }).finally(() => { regionLoad = null; });
  return regionLoad;
}

// Runs the bot check and starts a session now rather than at the first send: on the welcome step's Continue, and at
// a record-mode mic tap if that one failed or ran out. The first send retries a failure.
export const startSession = (container, signal) => sessions.start(container, signal);

// One user turn. Always uses a fresh turnId; a 401 re-runs the session once and resends with another new one.
export async function sendTurn({ message, mid, stored, container, signal }) {
  const win = buildWindow(stored);
  return sessions.request(container, signal, (sessionToken) => post('/v1/chat', {
    sessionToken, turnId: newId(), mid, prevSig: win.prevSig, message, history: win.history,
  }, signal, CHAT_TIMEOUT_MS));
}

// One voice recording to text: sendTurn's result kinds, plus 'transcript'. The Worker names the file from its type.
export async function transcribe({ blob, container, signal }) {
  return sessions.request(container, signal, (sessionToken) => {
    const form = new FormData();
    form.append('sessionToken', sessionToken);
    form.append('file', blob, `voice.${blob.type.split(/[/;]/)[1]}`);
    return post('/v1/transcribe', form, signal, TRANSCRIBE_TIMEOUT_MS);
  });
}

// What Aki keeps in this browser: the welcome-screen gate, the session record and the conversation.
// Owner decision D25: no Remember control; default_on keeps history 7 days in localStorage, opt_in until the tab closes.
import { AKI_CONSENT_VERSION } from '../../../data/akiFaq.js';
import { parseHistory, prune } from './history.js';
import { localStore, tabStore } from './safeStorage.js';

const KEY = {
  history: 'aki:v1:history',
  session: 'aki:v1:session',
  gate: 'aki:v1:gate',
};
// The setting of the Remember control that D25 removed: deleted whenever history loads or clears, never read.
const LEGACY_MEMORY_KEY = 'aki:v1:memory';
const MAX_STORED_MESSAGES = 50;

// What the visitor confirmed on the welcome screen; per tab, it authorises nothing (the server session does).
export function readGate() {
  const raw = tabStore.get(KEY.gate);
  try {
    const g = JSON.parse(raw);
    if (g && g.consentVersion === AKI_CONSENT_VERSION && typeof g.gemini === 'boolean'
      && (g.memory === 'on' || g.memory === 'off') && Number.isFinite(g.confirmedAt)) return g;
  } catch { /* treated as no gate */ }
  // A rejected gate (old consent version) takes its session with it: the next session must carry the new choice.
  if (raw !== null) clearGate();
  return null;
}
export const writeGate = ({ gemini, memory }) => {
  tabStore.set(KEY.gate, JSON.stringify({
    consentVersion: AKI_CONSENT_VERSION, gemini, memory: memory ? 'on' : 'off', confirmedAt: Date.now(),
  }));
  // The rule the visitor just accepted applies now, not at the first send.
  applyRule();
};
export const clearGate = () => { tabStore.remove(KEY.gate); dropSession(); };

// The Worker session this tab holds; null when there is none or it cannot be parsed.
export function readSession() {
  try { return JSON.parse(tabStore.get(KEY.session)); } catch { return null; }
}
export const writeSession = (session) => tabStore.set(KEY.session, JSON.stringify(session));
export const dropSession = () => tabStore.remove(KEY.session);

// Session rule when a session exists, else what the welcome screen showed; null until the gate is passed.
function getRule() {
  const s = readSession();
  if (s) return s.memory === 'default_on' ? 'default_on' : 'opt_in';
  const g = readGate();
  if (!g) return null;
  return g.memory === 'on' ? 'default_on' : 'opt_in';
}

// localStore | tabStore | null (null means React state only): from the region rule.
function memoryTarget() {
  const rule = getRule();
  if (!rule) return null;
  return rule === 'default_on' ? localStore : tabStore;
}

// A stricter region (EEA/UK/CH or unknown) applies at once, also to a session made under default_on.
export function tightenRule() {
  const s = readSession();
  if (s?.memory === 'default_on') writeSession({ ...s, memory: 'opt_in' });
  const g = readGate();
  if (g?.memory === 'on') tabStore.set(KEY.gate, JSON.stringify({ ...g, memory: 'off' }));
  applyRule('opt_in');
}

// opt_in: history written under an earlier default_on visit moves to sessionStorage.
export function applyRule(rule = getRule()) {
  if (rule !== 'opt_in') return;
  const old = localStore.get(KEY.history);
  if (old === null) return;
  if (tabStore.get(KEY.history) === null) tabStore.set(KEY.history, old);
  localStore.remove(KEY.history);
}

// Expiry applies to localStorage history in any tab, whatever the rule; removing data is not a new write.
function expireLocalHistory() {
  const stored = parseHistory(localStore.get(KEY.history));
  if (!stored) return;
  const fresh = prune(stored);
  if (fresh.messages.length === stored.messages.length) return;
  if (fresh.messages.length) localStore.set(KEY.history, JSON.stringify(fresh));
  else localStore.remove(KEY.history);
}

export function loadHistory() {
  localStore.remove(LEGACY_MEMORY_KEY);
  expireLocalHistory();
  applyRule();
  const target = memoryTarget();
  // Rule unknown: existing history may be shown but is never modified.
  for (const store of target ? [target] : [tabStore, localStore]) {
    const h = parseHistory(store.get(KEY.history));
    if (!h) continue;
    if (target !== localStore) return h;
    const kept = prune(h);
    if (kept.messages.length !== h.messages.length) saveHistory(kept);
    return kept.messages.length ? kept : null;
  }
  return null;
}

function saveHistory(h) {
  const target = memoryTarget();
  if (!target) return;
  const kept = target === localStore ? prune(h) : h;
  if (kept.messages.length) target.set(KEY.history, JSON.stringify(kept));
  else target.remove(KEY.history);
  const other = target === localStore ? tabStore : localStore;
  other.remove(KEY.history);
}

export function clearHistory() {
  localStore.remove(LEGACY_MEMORY_KEY);
  localStore.remove(KEY.history);
  tabStore.remove(KEY.history);
}

// Re-reads storage so two tabs never overwrite each other's pairs.
export function appendPair(h, user, assistant) {
  const target = memoryTarget();
  const stored = target ? parseHistory(target.get(KEY.history)) : null;
  const base = stored?.mid === h.mid ? stored : h;
  const next = { mid: h.mid, messages: [...base.messages, user, assistant].slice(-MAX_STORED_MESSAGES) };
  saveHistory(next);
  return target === localStore ? prune(next) : next;
}

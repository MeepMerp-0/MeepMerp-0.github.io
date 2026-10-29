import { useEffect, useRef, useState } from 'react';
import { appendPair, clearHistory, loadHistory, newId, sendTurn } from '../../services/akiClient.js';
import { chatOutcome } from './outcomes.js';
import { followUpLinks } from './sectionLinks.js';

const SLOW_MS = 3000;
const MIN_TYPING_MS = 700;

// Restored answers get the follow-up links they had when they arrived.
function historyToLog(h) {
  if (!h) return [];
  return h.messages.map((m, i, all) => {
    const row = { id: `s${i}`, role: m.role, text: m.content };
    const question = all[i - 1];
    if (m.role === 'assistant' && question?.role === 'user') row.links = followUpLinks(question.content, m.content);
    return row;
  });
}

// The conversation: stored history, the visible log, the one request in flight and the canned quick answers.
// onOutcome(outcome, message) gets each chat result in the same render as its reply or note.
export function useConversation({ turnstileRef, onOutcome }) {
  const [history, setHistory] = useState(loadHistory);
  const [log, setLog] = useState(() => historyToLog(history));
  const [pending, setPending] = useState(null);
  const [slow, setSlow] = useState(false);
  const [answeringFaq, setAnsweringFaq] = useState(false);
  const [hasAsked, setHasAsked] = useState(() => log.length > 0);
  const uid = useRef(0);
  const inFlight = useRef(null);
  const slowTimer = useRef(null);
  const holdTimer = useRef(null);
  const faqTimer = useRef(null);
  const faqDone = useRef(null);
  const latestOnOutcome = useRef(onOutcome);

  // A reply arrives long after send(): it goes to the latest onOutcome, not the one from the send's render.
  useEffect(() => { latestOnOutcome.current = onOutcome; });

  useEffect(() => () => {
    inFlight.current?.abort();
    clearTimeout(slowTimer.current);
    clearTimeout(faqTimer.current);
    clearTimeout(holdTimer.current);
  }, []);

  const requesting = Boolean(pending);

  // Row keys are taken before setLog: StrictMode runs updaters twice.
  function rowId(prefix) {
    uid.current += 1;
    return `${prefix}${uid.current}`;
  }

  function say(text) {
    const id = rowId('n');
    setLog((l) => [...l, { id, role: 'assistant', text }]);
  }

  async function send(message) {
    const mid = history?.mid ?? newId();
    const base = { mid, messages: history?.messages ?? [] };
    const ctrl = new AbortController();
    inFlight.current = ctrl;
    const t0 = Date.now();
    setHasAsked(true);
    setPending(message);
    slowTimer.current = setTimeout(() => setSlow(true), SLOW_MS);
    const res = await sendTurn({
      message, mid, stored: base.messages, container: turnstileRef.current, signal: ctrl.signal,
    });
    if (inFlight.current !== ctrl) return;
    const left = MIN_TYPING_MS - (Date.now() - t0);
    // stop() clears this wait without settling it, so a cancelled reply ends here.
    if (left > 0) await new Promise((done) => { holdTimer.current = setTimeout(done, left); });
    if (inFlight.current !== ctrl) return;
    endRequest();
    const outcome = chatOutcome(res);
    if (outcome.reply) {
      const user = { role: 'user', content: message, ts: Date.now() };
      setHistory(appendPair(base, user, { role: 'assistant', ...outcome.reply }));
      const { content } = outcome.reply;
      const rows = [
        { id: rowId('u'), role: 'user', text: message },
        { id: rowId('a'), role: 'assistant', text: content, links: followUpLinks(message, content) },
      ];
      setLog((l) => [...l, ...rows]);
    }
    if (outcome.note) say(outcome.note);
    latestOnOutcome.current(outcome, message);
  }

  function endRequest() {
    clearTimeout(slowTimer.current);
    inFlight.current = null;
    setPending(null);
    setSlow(false);
  }

  function askFaq(item) {
    const question = { id: rowId('u'), role: 'user', text: item.label };
    setLog((l) => [...l, question]);
    setHasAsked(true);
    setAnsweringFaq(true);
    faqDone.current = () => {
      const answer = { id: rowId('a'), role: 'assistant', text: item.answer, links: item.links };
      setLog((l) => [...l, answer]);
    };
    faqTimer.current = setTimeout(answerFaqNow, Math.min(2000, 600 + 15 * item.answer.length));
  }

  function answerFaqNow() {
    const done = faqDone.current;
    stopFaq();
    done?.();
  }

  function stopFaq() {
    clearTimeout(faqTimer.current);
    faqDone.current = null;
    setAnsweringFaq(false);
  }

  function stop() {
    clearTimeout(holdTimer.current);
    inFlight.current?.abort();
    endRequest();
    stopFaq();
  }

  function clear() {
    stop();
    clearHistory();
    setHistory(null);
    setLog([]);
    setHasAsked(false);
  }

  return {
    log, pending, slow, requesting, answeringFaq, answering: requesting || answeringFaq, hasAsked,
    send, askFaq, say, stop, clear, answerFaqNow,
  };
}

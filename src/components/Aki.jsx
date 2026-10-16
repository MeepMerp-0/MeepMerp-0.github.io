import { useEffect, useReducer, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ShieldCheck, X } from 'lucide-react';
import { RobotHead } from 'robot-heads';
import { pickGreeting } from '../data/akiGreetings.js';
import { AKI_FAQ, AKI_MESSAGES as MSG, AKI_WELCOME_COPY as W } from '../data/akiFaq.js';
import {
  AKI_ENABLED, AKI_CAN_CHAT, appendPair, clearGate, clearHistory, codePoints, fetchRegion,
  loadHistory, newId, readGate, sendTurn, writeGate,
} from '../services/akiClient.js';

const MAX_CHARS = 500;
const SLOW_MS = 3000;
const MIN_TYPING_MS = 700;

const now = () => Date.now();

// Plain text only: every message goes through here as React text nodes.
function Message({ item, first }) {
  const mine = item.role === 'user';
  const who = mine ? 'You' : 'Aki';
  return (
    <div className={`aki-row aki-row-${item.role}${first ? ' aki-first' : ''}`} aria-hidden={item.typing || undefined}>
      {first && <span className="aki-who" aria-hidden="true">{who}</span>}
      <div className={`aki-msg aki-msg-${item.role}`}>
        <span className="sr-only">{who} said: </span>
        {item.typing ? <span className="aki-typing"><i /><i /><i /></span> : item.greet ? (
          <p>{MSG.greetingHead} <span aria-hidden="true">{'\u{1F44B}'}</span> {MSG.greetingBody}</p>
        ) : <p>{item.text}</p>}
        {item.links?.length > 0 && (
          <p className="aki-links">
            {item.links.map((l) => (
              <a key={l.href} href={l.href} {...(/^https?:/.test(l.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {l.label}
              </a>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

const REGION_DEFAULT = { memory: 'opt_in', gemini: 'ineligible' };

function Card({ checked, onChange, title, body, required }) {
  return (
    <label className="aki-card">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required={required} />
      <span><strong>{title}</strong><small>{body}</small></span>
    </label>
  );
}

// Untouched boxes follow the region answer; touched boxes keep what the visitor set.
function Welcome({ region, initial, onContinue, onClose }) {
  const [age, setAge] = useState(Boolean(initial));
  const [pick, setPick] = useState({});
  const offered = region.gemini === 'eligible';
  const gemini = pick.gemini ?? (initial ? initial.gemini : W.geminiDefault);
  return (
    <div className="aki-body aki-welcome">
      <div className="aki-kicker">
        <span className="aki-badge"><ShieldCheck size={16} aria-hidden="true" /></span>
        <span className="aki-eyebrow">{W.eyebrow}</span>
      </div>
      <h3>{W.headingTop}<br />{W.headingBottom} <span aria-hidden="true">{'\u{1F44B}'}</span></h3>
      <p className="aki-lead">{W.intro}</p>
      <Card checked={age} onChange={setAge} title={W.age.title} body={W.age.body} />
      {offered && <Card checked={gemini} onChange={(v) => setPick((p) => ({ ...p, gemini: v }))} title={W.gemini.title} body={W.gemini.body} />}
      <p className="aki-note">{W.storage[region.consentVersion ? region.memory : 'unknown']}</p>
      <p className="aki-note">{offered ? W.noteGemini : W.noteGroq}</p>
      <div className="aki-actions">
        <button
          type="button"
          className="button button-solid"
          disabled={!age}
          aria-describedby={age ? undefined : 'aki-age-hint'}
          onClick={() => onContinue({ gemini: offered && gemini, memory: region.memory === 'default_on' })}
        >
          {W.continueLabel}
        </button>
        <button type="button" className="button" onClick={onClose}>{W.notNow}</button>
      </div>
      {!age && <p id="aki-age-hint" className="aki-note">{W.hint}</p>}
      <p className="aki-foot-links">
        <a href="aki-legal.html#privacy" target="_blank" rel="noopener noreferrer">{W.privacy}</a>
        <span aria-hidden="true">{' \u00B7 '}</span>
        <a href="aki-legal.html#terms" target="_blank" rel="noopener noreferrer">{W.terms}</a>
      </p>
    </div>
  );
}

const toLog = (h) => (h ? h.messages.map((m, i) => ({ id: `s${i}`, role: m.role, text: m.content })) : []);

function AkiWidget() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [greeting] = useState(() => pickGreeting());
  const [history, setHistory] = useState(loadHistory);
  const [log, setLog] = useState(() => toLog(history));
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(null);
  const [slow, setSlow] = useState(false);
  const [replying, setReplying] = useState(false);
  const [usedTry, setUsedTry] = useState(() => toLog(loadHistory()).length > 0);
  const [wait, setWait] = useState(null);
  const [step, setStep] = useState(() => (readGate() ? 'chat' : 'welcome'));
  const [region, setRegion] = useState(REGION_DEFAULT);
  const [welcomeInit, setWelcomeInit] = useState(null);
  const [quickOnly, setQuickOnly] = useState(!AKI_CAN_CHAT);
  const [quotaUntil, setQuotaUntil] = useState(null);
  const [typing, setTyping] = useState(false);
  const [mood, setMood] = useState(null);
  const [link, setLink] = useState('ok');
  const [, bump] = useReducer((n) => n + 1, 0);
  const uid = useRef(0);
  const abortRef = useRef(null);
  const slowTimer = useRef(null);
  const faqTimer = useRef(null);
  const faqDone = useRef(null);
  const holdTimer = useRef(null);
  const launcherRef = useRef(null);
  const panelRef = useRef(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const focusInput = useRef(false);
  const turnstileRef = useRef(null);
  const wasOpen = useRef(false);
  const regionDown = useRef(false);

  const busy = Boolean(pending);
  const isTyping = busy || replying;
  const showTry = !isTyping && (!usedTry || quickOnly || link === 'down');
  const count = codePoints(input.trim());
  let head = 'idle';
  if (open) {
    if (wait) head = 'sleeping';
    else if (pending) head = slow ? 'working' : 'thinking';
    else if (mood) head = mood.state;
    else if (typing && input.trim()) head = 'listening';
  }
  const level = link === 'down' ? 'down' : (link === 'busy' || wait || (pending && slow)) ? 'busy' : 'ok';
  const feed = [
    { id: 'greet', role: 'assistant', greet: true },
    ...log,
    ...(pending ? [{ id: 'pending', role: 'user', text: pending }] : []),
    ...(isTyping ? [{ id: 'typing', role: 'assistant', typing: true }] : []),
  ];
  const note = (role, text, links) => setLog((l) => [...l, { id: `n${uid.current += 1}`, role, text, links }]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    fetchRegion().then((r) => {
      if (!live) return;
      setRegion(r);
      const was = regionDown.current;
      regionDown.current = !r.consentVersion;
      setLink((l) => (!r.consentVersion ? 'down' : was ? 'ok' : l));
      if (!readGate()) setStep('welcome');
    });
    return () => { live = false; };
  }, [open]);

  useEffect(() => {
    if (step !== 'chat' || !focusInput.current) return;
    focusInput.current = false;
    panelRef.current?.querySelector(AKI_CAN_CHAT ? '#aki-input' : '.aki-chip')?.focus();
  }, [step]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log, pending, replying, slow, wait, open, step]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [input, step, open]);

  // The daily quota resets at resetsAt: bring free-text chat back without a reload.
  useEffect(() => {
    if (!quotaUntil) return undefined;
    const t = setTimeout(() => { setQuotaUntil(null); setQuickOnly(!AKI_CAN_CHAT); setLink('ok'); }, Math.max(0, quotaUntil - now()));
    return () => clearTimeout(t);
  }, [quotaUntil]);

  useEffect(() => {
    if (!wait || wait.n <= 0) return undefined;
    const t = setTimeout(() => {
      if (wait.n > 1) setWait({ ...wait, n: wait.n - 1 });
      else { setWait(null); setLink((l) => (l === 'busy' ? 'ok' : l)); }
    }, 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (!mood) return undefined;
    const t = setTimeout(() => setMood(null), mood.ms);
    return () => clearTimeout(t);
  }, [mood]);

  useEffect(() => () => {
    abortRef.current?.abort();
    clearTimeout(slowTimer.current);
    clearTimeout(faqTimer.current);
    clearTimeout(holdTimer.current);
  }, []);

  const endRequest = () => {
    clearTimeout(slowTimer.current);
    abortRef.current = null;
    setPending(null);
    setSlow(false);
  };

  const stopFaq = () => { clearTimeout(faqTimer.current); faqDone.current = null; setReplying(false); };

  const flushFaq = () => { const done = faqDone.current; stopFaq(); done?.(); };

  const cancel = () => {
    clearTimeout(holdTimer.current);
    abortRef.current?.abort();
    endRequest();
  };

  const clearConversation = () => {
    cancel();
    stopFaq();
    setWait(null);
    clearHistory();
    setHistory(null);
    setLog([]);
    setUsedTry(false);
  };

  const failure = () => { note('assistant', MSG.failure); setMood({ state: 'error', ms: 2000 }); };

  const handle = (res, message, mid, base) => {
    if (res.kind === 'ai') setLink('ok');
    else if (res.kind === 'unavailable') setLink(res.reason === 'groq_busy' ? 'busy' : res.reason === 'content_blocked' ? link : 'down');
    else if (res.kind === 'network' || res.kind === 'invalid' || res.kind === 'quota') setLink('down');
    switch (res.kind) {
      case 'ai': {
        const user = { role: 'user', content: message, ts: now() };
        const assistant = { role: 'assistant', content: res.reply, sig: res.sig, ts: res.ts, prev: res.prev };
        setHistory(appendPair(base, user, assistant));
        setLog((l) => [...l,
          { id: `u${uid.current += 1}`, role: 'user', text: message },
          { id: `a${uid.current += 1}`, role: 'assistant', text: res.reply }]);
        setInput('');
        setMood({ state: 'speaking', ms: Math.min(4000, 1000 + res.reply.length * 25) });
        break;
      }
      case 'faq': setQuickOnly(true); note('assistant', MSG.region); break;
      case 'consent': setWelcomeInit(null); setStep('welcome'); break;
      case 'rate': {
        const big = res.scope === 'site_minute' || res.scope === 'queue_full';
        setWait({ n: res.retryAfter, big, say: big ? MSG.veryBusy(res.retryAfter) : MSG.retry(res.retryAfter) });
        break;
      }
      case 'updated': note('assistant', MSG.updated); break;
      case 'quota': {
        const at = res.resetsAt && new Date(res.resetsAt).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
        setQuickOnly(true);
        if (res.resetsAt) setQuotaUntil(res.resetsAt);
        note('assistant', MSG.quota(at && `after ${at}`));
        break;
      }
      case 'unavailable':
        if (res.reason === 'content_blocked') note('assistant', MSG.blocked);
        else if (res.reason === 'groq_busy' && res.retryAfter) {
          setWait({ n: res.retryAfter, big: true, say: MSG.veryBusy(res.retryAfter) });
        } else failure();
        break;
      default: failure();
    }
  };

  const onContinue = ({ gemini, memory }) => {
    writeGate({ gemini, memory });
    setQuickOnly(!AKI_CAN_CHAT);
    focusInput.current = true;
    setStep('chat');
    bump();
  };

  const consentSettings = () => {
    cancel();
    stopFaq();
    setWait(null);
    setWelcomeInit(readGate());
    clearGate();
    setStep('welcome');
    bump();
  };

  async function send() {
    const message = input.trim();
    if (!message || count > MAX_CHARS || isTyping || wait) return;
    const mid = history?.mid ?? newId();
    const base = { mid, messages: history?.messages ?? [] };
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t0 = now();
    setUsedTry(true);
    setPending(message);
    slowTimer.current = setTimeout(() => setSlow(true), SLOW_MS);
    const res = await sendTurn({
      message, mid, stored: base.messages, container: turnstileRef.current, signal: ctrl.signal,
    });
    if (abortRef.current !== ctrl) return;
    const left = MIN_TYPING_MS - (now() - t0);
    if (left > 0) await new Promise((done) => { holdTimer.current = setTimeout(done, left); });
    if (abortRef.current !== ctrl) return;
    endRequest();
    bump();
    handle(res, message, mid, base);
  }

  const askFaq = (item) => {
    if (isTyping) return;
    setLog((l) => [...l, { id: `u${uid.current += 1}`, role: 'user', text: item.label }]);
    setUsedTry(true);
    setReplying(true);
    faqDone.current = () => setLog((l) => [...l, { id: `a${uid.current += 1}`, role: 'assistant', text: item.answer, links: item.links }]);
    faqTimer.current = setTimeout(() => { const done = faqDone.current; stopFaq(); done?.(); }, Math.min(2000, 600 + 15 * item.answer.length));
    (panelRef.current?.querySelector('#aki-input') ?? panelRef.current)?.focus();
  };

  const close = () => { flushFaq(); setOpen(false); setTyping(false); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
  };

  return (
    <div className="aki" data-open={open || undefined}>
      <button
        ref={launcherRef}
        type="button"
        className="aki-launcher"
        aria-label="Ask Aki, AI assistant"
        aria-expanded={open}
        aria-controls="aki-panel"
        onClick={() => { if (open) flushFaq(); setOpen((o) => !o); setGreeted(true); setTyping(false); }}
      >
        <RobotHead size={68} state={head} color="#7a4a2a" trimColor="#c8a27a" aria-hidden="true" />
      </button>
      {!open && !greeted && (
        <button
          type="button"
          className="aki-bubble"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => { setOpen(true); setGreeted(true); setTyping(false); }}
        >
          <strong>{greeting.title}</strong>
          <span>{greeting.line}</span>
        </button>
      )}
      {open && (
        <motion.section
          id="aki-panel"
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Aki, portfolio AI"
          className="aki-panel"
          onKeyDown={onKeyDown}
          initial={reduceMotion ? false : { clipPath: 'inset(100% 0% 0% 100% round 18px)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0% round 18px)', transitionEnd: { clipPath: 'none' } }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
        >
          <header className="aki-head">
            <div>
              <p className="aki-status-line">
                <span className="aki-dot" data-level={level} aria-hidden="true" />
                <span aria-hidden="true">{MSG.head[level]}</span>
                <span className="sr-only" role="status">{MSG.head[level]}</span>
              </p>
            </div>
            <button type="button" className="icon-button" aria-label="Close Aki" onClick={close}>
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          {step === 'welcome' ? (
            <Welcome
              region={region}
              initial={welcomeInit}
              onContinue={onContinue}
              onClose={close}
            />
          ) : (
            <div className="aki-body aki-chat">
              <div ref={logRef} className="aki-log">
                <div role="log" aria-live="polite" aria-label="Conversation with Aki">
                {feed.map((item, i) => <Message key={item.id} item={item} first={feed[i - 1]?.role !== item.role} />)}
                {slow && pending && (
                  <div className="aki-status">
                    <p>{MSG.busy}</p>
                    <button type="button" className="button aki-cancel" onClick={cancel}>Cancel</button>
                  </div>
                )}
                </div>
                {showTry && (
                  <>
                  <p className="aki-try">{MSG.tryAsking}</p>
                  <div className="aki-chips">
                    {AKI_FAQ.map((item) => (
                      <button key={item.id} type="button" className="aki-chip" onClick={() => askFaq(item)}>
                        <span aria-hidden="true">{'\u2197'}</span> {item.label}
                      </button>
                    ))}
                  </div>
                  </>
                )}
              </div>
              <p className="sr-only" role="status">{isTyping ? MSG.typing : ''}</p>
              {wait && (
                <>
                  <p className="aki-status" aria-hidden="true">{wait.big ? MSG.veryBusy(wait.n) : MSG.retry(wait.n)}</p>
                  <p className="sr-only" role="status">{wait.say}</p>
                </>
              )}

              {AKI_CAN_CHAT ? !quickOnly && (
                <form className="aki-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <label className="sr-only" htmlFor="aki-input">Ask about Jason's work</label>
                  <div className="aki-compose">
                    <textarea
                      id="aki-input"
                      ref={inputRef}
                      rows={1}
                      placeholder="Ask me about Jason's work..."
                      value={input}
                      readOnly={busy}
                      aria-describedby={count >= 400 ? 'aki-count' : undefined}
                      onChange={(e) => setInput(e.target.value)}
                      onFocus={() => setTyping(true)}
                      onBlur={() => setTyping(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); } }}
                    />
                    <button
                      type="submit"
                      className="button button-solid aki-send"
                      aria-label="Send"
                      disabled={isTyping || Boolean(wait) || !count || count > MAX_CHARS}
                    >
                      <ArrowRight size={20} aria-hidden="true" />
                    </button>
                  </div>
                  {count >= 400 && (
                    <span id="aki-count" className={count > MAX_CHARS ? 'aki-over' : undefined}>
                      {count}/{MAX_CHARS}{count > MAX_CHARS ? ` · ${MSG.tooLong}` : ''}
                    </span>
                  )}
                </form>
              ) : <p className="aki-status">{MSG.noCrypto}</p>}

              <div ref={turnstileRef} className="aki-turnstile" />

              <div className="aki-foot">
                <nav aria-label="Aki links and settings">
                  <a href="aki-legal.html#privacy" target="_blank" rel="noopener noreferrer">{W.privacy}</a>
                  <span aria-hidden="true">·</span>
                  <a href="aki-legal.html#terms" target="_blank" rel="noopener noreferrer">Terms</a>
                  <span aria-hidden="true">·</span>
                  <button type="button" className="aki-link" aria-label="Clear conversation" onClick={clearConversation}>Clear</button>
                  <span aria-hidden="true">·</span>
                  <button type="button" className="aki-link" aria-label="Consent settings" onClick={consentSettings}>Consent</button>
                </nav>
              </div>
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}

export function Aki() {
  return AKI_ENABLED ? <AkiWidget /> : null;
}

export default Aki;

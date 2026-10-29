import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { pickGreeting } from '../../data/akiGreetings.js';
import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';
import { AKI_ENABLED, AKI_CAN_CHAT, codePoints, readGate, writeGate } from '../../services/akiClient.js';
import { ChatStep } from './ChatStep.jsx';
import { Composer, MAX_CHARS } from './Composer.jsx';
import { GreetingBubble, Launcher } from './Launcher.jsx';
import { voiceNote } from './outcomes.js';
import { Panel } from './Panel.jsx';
import { useConsent } from './useConsent.js';
import { useConversation } from './useConversation.js';
import { usePanelFocus } from './usePanelFocus.js';
import { useRegion } from './useRegion.js';
import { useReturnFocus } from './useReturnFocus.js';
import { useServiceStatus } from './useServiceStatus.js';
import { useVoiceInput } from './useVoiceInput.js';
import { Welcome } from './Welcome.jsx';

function AkiWidget() {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [greeting] = useState(() => pickGreeting());
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const launcherRef = useRef(null);
  const panelRef = useRef(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const micRef = useRef(null);
  const turnstileRef = useRef(null);

  const status = useServiceStatus();
  const region = useRegion(open, onRegionLoaded);
  // Before useConsent: loadHistory() takes the memory rule from the session, and readGate() drops the session along
  // with a rejected gate.
  const conversation = useConversation({ turnstileRef, onOutcome: applyOutcome });
  const consent = useConsent({ turnstileRef });
  const voice = useVoiceInput({
    turnstileRef, micRef, say: conversation.say, onText: onVoiceText, onSpoken: send, onError: onVoiceError,
  });

  const { connection, cooldown, quickOnly, mood, health } = status;
  const { step } = consent;
  const { log, pending, slow, answeringFaq, answering, requesting, hasAsked } = conversation;
  const { listening } = voice;

  // Effects run in call order and the focus moves depend on it: usePanelFocus, then the autosize and scroll effects
  // below, then useReturnFocus.
  const focus = usePanelFocus({ open, step, quickOnly, launcherRef, panelRef, inputRef });

  const visitorTyping = !answering && inputFocused && Boolean(draft.trim());
  // Suggestions are for an opening: gone once Aki has said two things (the greeting counts), unless quick answers
  // are all that works.
  const akiSaid = 1 + log.filter((m) => m.role === 'assistant').length;
  // Hidden while the mic is on: a chip tapped mid-turn would drop the voice message and strand focus.
  const showSuggestions = !answering && !listening
    && ((!hasAsked && akiSaid < 2) || quickOnly || connection === 'down');
  const heard = listening ? draft.trim() : '';
  const statusLabel = health === 'ok' && answering ? MSG.head.typing : MSG.head[health];
  const feed = [
    { id: 'greet', role: 'assistant', greet: true },
    ...log,
    // What the mic hears shows live in the visitor's bubble (kept from screen readers until it is sent).
    ...(pending || heard ? [{ id: 'pending', role: 'user', text: pending || heard, live: !pending }] : []),
    ...(answering ? [{ id: 'typing', role: 'assistant', typing: true }] : []),
    // The visitor's own typing dots, mirroring Aki's, while they compose a message.
    ...(visitorTyping ? [{ id: 'you-typing', role: 'user', typing: true }] : []),
  ];

  // Before the scroll below: the box regrows first, so the log scrolls against its final height.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [draft, step, open, listening]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log, pending, heard, answeringFaq, slow, cooldown, open, step, visitorTyping]);

  const returnFocus = useReturnFocus({ requesting, inputRef, micRef });

  function robotFace() {
    if (!open) return 'idle';
    if (cooldown) return 'sleeping';
    if (pending) return slow ? 'working' : 'thinking';
    if (mood) return mood.state;
    if (listening || (inputFocused && draft.trim())) return 'listening';
    return 'idle';
  }

  function show() {
    setOpen(true);
    setGreeted(true);
    setInputFocused(false);
  }

  function close() {
    conversation.answerFaqNow();
    voice.cancel();
    consent.cancelCheck();
    setOpen(false);
    setInputFocused(false);
  }

  function send(text = draft) {
    const message = text.trim();
    // Not the composer's count: a voice turn passes text the draft may not hold yet.
    if (!message || codePoints(message) > MAX_CHARS || answering || cooldown) return;
    // Enter or Send while listening sends the box as it is.
    voice.cancel();
    setDraft('');
    returnFocus.rememberComposer();
    conversation.send(message);
  }

  function applyOutcome(outcome, message) {
    // The box was cleared on send; an unanswered message comes back so it can be sent again.
    setDraft(outcome.draft === 'clear' ? '' : (v) => v || message);
    status.apply(outcome);
    if (outcome.consent) consent.requireConsent();
  }

  async function continueToChat(choice) {
    writeGate(choice);
    status.resetQuickOnly();
    // The bot check runs here, on the welcome step, not in the chat box. Skipped while the Worker is unreachable; a
    // check that fails is tried again at the first send, where the chat explains the failure.
    if (AKI_CAN_CHAT && region.consentVersion && !(await consent.verify())) return;
    focus.composeOnChat();
    consent.enterChat();
  }

  function editConsent() {
    conversation.stop();
    voice.cancel();
    status.clearCooldown();
    consent.editSettings();
  }

  function clear() {
    conversation.clear();
    voice.cancel();
    status.clearCooldown();
  }

  function askFaq(item) {
    if (answering) return;
    conversation.askFaq(item);
    // The tapped chip goes with the suggestions: focus moves to the box, or to the panel when there is none.
    focus.focusComposerOrPanel();
  }

  // One tap starts listening; the stop button it turns into sends what was heard.
  function toggleVoice() {
    if (listening) voice.finish();
    else voice.start(draft.trim());
  }

  function onVoiceText(text) {
    setDraft(text);
    // Over the limit: stop, and leave the text in the box for the visitor to shorten.
    if (codePoints(text) > MAX_CHARS) voice.cancel();
  }

  function onVoiceError(code) {
    // Not applyOutcome(): a failed transcription must not put chat into its quota, wait or down states.
    if (code === 'consent') {
      consent.requireConsent();
      return;
    }
    if (code === 'region') status.quickAnswersOnly();
    conversation.say(voiceNote(code));
  }

  function onRegionLoaded(loaded) {
    status.regionLoaded(loaded);
    if (!readGate()) {
      // The welcome screen has no mic: end a voice turn the region change interrupted.
      voice.cancel();
      consent.showWelcome();
    }
  }

  return (
    <div className="aki" data-open={open || undefined}>
      <Launcher ref={launcherRef} open={open} face={robotFace()} onClick={open ? close : show} />
      {!open && !greeted && <GreetingBubble greeting={greeting} onClick={show} />}
      {open && (
        <Panel ref={panelRef} reduceMotion={reduceMotion} health={health} statusLabel={statusLabel} onClose={close}>
          {step === 'welcome' ? (
            <Welcome
              region={region}
              initial={consent.prefill}
              verifying={consent.verifying}
              turnstileRef={turnstileRef}
              onContinue={continueToChat}
              onClose={close}
            />
          ) : (
            <ChatStep
              logRef={logRef}
              feed={feed}
              showSuggestions={showSuggestions}
              onAsk={askFaq}
              answering={answering}
              listening={listening}
              cooldown={cooldown}
              composer={!quickOnly && (
                <Composer
                  inputRef={inputRef}
                  micRef={micRef}
                  draft={draft}
                  onDraftChange={setDraft}
                  onFocusChange={setInputFocused}
                  requesting={requesting}
                  answering={answering}
                  coolingDown={Boolean(cooldown)}
                  listening={listening}
                  level={voice.level}
                  onMic={toggleVoice}
                  onSend={send}
                />
              )}
              turnstileRef={turnstileRef}
              reduceMotion={reduceMotion}
              onClose={close}
              onClear={clear}
              onConsentSettings={editConsent}
            />
          )}
        </Panel>
      )}
    </div>
  );
}

export function Aki() {
  return AKI_ENABLED ? <AkiWidget /> : null;
}

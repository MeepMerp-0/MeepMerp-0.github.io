import { useRef } from 'react';
import { ArrowRight, Mic, Square, Trash2 } from 'lucide-react';
import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';
import { codePoints } from '../../services/akiClient.js';
import { VOICE_MODE } from '../../services/akiVoice.js';
import { Wave } from './Wave.jsx';

// Mirrors worker/src/history.js MAX_MESSAGE: the longest message the Worker takes, in code points.
export const MAX_CHARS = 500;
const COUNTER_FROM = 400;
// On a touchscreen, a press held longer than this is hold-to-talk: lifting the finger ends the turn. A shorter tap keeps
// the tap-to-start, tap-to-stop behaviour, which is also what mouse and keyboard get.
const HOLD_MS = 300;

// Enter sends and Shift+Enter starts a new line. The Enter that confirms an IME's text (Japanese, Chinese, Korean)
// must not send: most browsers mark it isComposing, Safari only gives it keyCode 229.
function submitOnEnter(e, onSend) {
  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
    e.preventDefault();
    onSend();
  }
}

export function Composer({
  inputRef, micRef, discardRef, draft, onDraftChange, onFocusChange, requesting, answering, coolingDown, listening, level,
  onMic, onMicRelease, onDiscard, onSend,
}) {
  const press = useRef(null);
  const count = codePoints(draft.trim());
  const showCount = count >= COUNTER_FROM;
  return (
    // Enter in the box calls onSend itself, so a submit is always the Send button.
    <form className="aki-form" onSubmit={(e) => { e.preventDefault(); onSend(true); }}>
      <label className="sr-only" htmlFor="aki-input">Ask about Jason's work</label>
      <div className="aki-compose">
        {listening && (
          <>
            {/* Kept apart from the stop button, which keeps the words, so a near miss can't do the opposite. */}
            <button
              ref={discardRef}
              type="button"
              className="button aki-discard"
              aria-label="Discard voice message"
              onClick={onDiscard}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
            <Wave level={level} />
          </>
        )}
        <textarea
          id="aki-input"
          ref={inputRef}
          rows={1}
          placeholder="Ask me about Jason's work..."
          value={draft}
          disabled={requesting}
          hidden={listening}
          aria-describedby={showCount ? 'aki-count' : undefined}
          onChange={(e) => onDraftChange(e.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          onKeyDown={(e) => submitOnEnter(e, onSend)}
        />
        {VOICE_MODE && (
          <button
            ref={micRef}
            type="button"
            className="button aki-mic"
            aria-label={listening ? 'Stop listening' : 'Speak to Aki'}
            data-listening={listening || undefined}
            disabled={!listening && (answering || coolingDown)}
            onPointerDown={(e) => {
              if (e.pointerType !== 'touch' || listening || e.currentTarget.disabled) return;
              press.current = performance.now();
              e.currentTarget.setPointerCapture?.(e.pointerId);
              onMic();
            }}
            onPointerUp={() => {
              const at = press.current;
              if (at !== null && performance.now() - at >= HOLD_MS) onMicRelease();
            }}
            // The system took the touch (a call, a gesture): end the turn like a release. No click follows.
            onPointerCancel={() => { if (press.current !== null) { press.current = null; onMicRelease(); } }}
            // A touch press already started the turn on pointerdown, so its click only clears the press.
            onClick={() => {
              if (press.current !== null) { press.current = null; return; }
              onMic();
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {listening ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
          </button>
        )}
        {/* Gone while the mic listens: what is heard goes in the box to check before it can be sent. */}
        {!listening && (
          <button
            type="submit"
            className="button button-solid aki-send"
            aria-label="Send"
            disabled={answering || coolingDown || !count || count > MAX_CHARS}
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      {showCount && (
        <span id="aki-count" className={count > MAX_CHARS ? 'aki-over' : undefined}>
          {count}/{MAX_CHARS}{count > MAX_CHARS ? ` · ${MSG.tooLong}` : ''}
        </span>
      )}
    </form>
  );
}

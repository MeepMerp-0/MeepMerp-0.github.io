import { ArrowRight, Mic, Square, Trash2 } from 'lucide-react';
import { AKI_MESSAGES as MSG } from '../../data/akiFaq.js';
import { codePoints } from '../../services/akiClient.js';
import { VOICE_MODE } from '../../services/akiVoice.js';
import { Wave } from './Wave.jsx';

// Mirrors worker/src/history.js MAX_MESSAGE: the longest message the Worker takes, in code points.
export const MAX_CHARS = 500;
const COUNTER_FROM = 400;

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
  onMic, onDiscard, onSend,
}) {
  const count = codePoints(draft.trim());
  const showCount = count >= COUNTER_FROM;
  return (
    <form className="aki-form" onSubmit={(e) => { e.preventDefault(); onSend(); }}>
      <label className="sr-only" htmlFor="aki-input">Ask about Jason's work</label>
      <div className="aki-compose">
        {listening && (
          <>
            {/* Kept apart from the stop button, which sends, so a near miss can't do the opposite. */}
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
            aria-label={listening ? 'Stop and send' : 'Speak to Aki'}
            data-listening={listening || undefined}
            disabled={!listening && (answering || coolingDown)}
            onClick={onMic}
          >
            {listening ? <Square size={16} fill="currentColor" aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
          </button>
        )}
        <button
          type="submit"
          className="button button-solid aki-send"
          aria-label="Send"
          disabled={answering || coolingDown || !count || count > MAX_CHARS}
        >
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
      {showCount && (
        <span id="aki-count" className={count > MAX_CHARS ? 'aki-over' : undefined}>
          {count}/{MAX_CHARS}{count > MAX_CHARS ? ` · ${MSG.tooLong}` : ''}
        </span>
      )}
    </form>
  );
}

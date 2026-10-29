import { AKI_FAQ, AKI_MESSAGES as MSG, AKI_WELCOME_COPY as COPY } from '../../data/akiFaq.js';
import { AKI_CAN_CHAT } from '../../services/akiClient.js';
import { Message } from './Message.jsx';

// Mirrors the phone layout's media query in global.css.
const PHONE_QUERY = '(max-width: 559px)';

// Section links in replies scroll the page; on phones the panel closes first so the section is visible.
function goToSection(e, { close, reduceMotion }) {
  const a = e.target.closest?.('a[href^="#"]');
  const target = a && document.getElementById(a.getAttribute('href').slice(1));
  if (!target) return;
  e.preventDefault();
  if (window.matchMedia(PHONE_QUERY).matches) close();
  window.history.replaceState(null, '', a.getAttribute('href'));
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  // Keyboard and screen-reader users continue from the section, after any panel-close focus move.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  setTimeout(() => target.focus({ preventScroll: true }), 0);
}

export function ChatStep({
  logRef, feed, showSuggestions, onAsk, answering, listening, cooldown, composer, turnstileRef, reduceMotion,
  onClose, onClear, onConsentSettings,
}) {
  let liveStatus = '';
  if (answering) liveStatus = MSG.typing;
  else if (listening) liveStatus = MSG.listening;
  return (
    <div className="aki-body aki-chat">
      <div ref={logRef} className="aki-log" onClick={(e) => goToSection(e, { close: onClose, reduceMotion })}>
        <div role="log" aria-live="polite" aria-label="Conversation with Aki">
          {feed.map((item, i) => <Message key={item.id} item={item} first={feed[i - 1]?.role !== item.role} />)}
        </div>
        {showSuggestions && (
          <>
            <p className="aki-try">{MSG.tryAsking}</p>
            <div className="aki-chips">
              {AKI_FAQ.map((item) => (
                <button key={item.id} type="button" className="aki-chip" onClick={() => onAsk(item)}>
                  <span aria-hidden="true">{'\u2197'}</span> {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="sr-only" role="status">{liveStatus}</p>
      {cooldown && (
        <>
          <p className="aki-status" aria-hidden="true">
            {cooldown.siteWide ? MSG.veryBusy(cooldown.seconds) : MSG.retry(cooldown.seconds)}
          </p>
          {/* The count goes down on screen only: screen readers hear the wait once, not every second. */}
          <p className="sr-only" role="status">{cooldown.announcement}</p>
        </>
      )}

      {AKI_CAN_CHAT ? composer : <p className="aki-status">{MSG.noCrypto}</p>}

      <div ref={turnstileRef} className="aki-turnstile" />

      <div className="aki-foot">
        <nav aria-label="Aki links and settings">
          <a href="aki-legal.html#privacy" target="_blank" rel="noopener noreferrer">{COPY.privacy}</a>
          <span aria-hidden="true">·</span>
          <a href="aki-legal.html#terms" target="_blank" rel="noopener noreferrer">Terms</a>
          <span aria-hidden="true">·</span>
          <button type="button" className="aki-link" aria-label="Clear conversation" onClick={onClear}>Clear</button>
          <span aria-hidden="true">·</span>
          <button type="button" className="aki-link" aria-label="Consent settings" onClick={onConsentSettings}>Consent</button>
        </nav>
      </div>
    </div>
  );
}

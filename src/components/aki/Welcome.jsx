import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AKI_WELCOME_COPY as COPY } from '../../data/akiFaq.js';

function ConsentCard({ checked, onChange, title, body, disabled }) {
  return (
    <label className="aki-card">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span><strong>{title}</strong><small>{body}</small></span>
    </label>
  );
}

// Untouched boxes follow the region answer; touched boxes keep what the visitor set.
export function Welcome({ region, initial, verifying, turnstileRef, onContinue, onClose }) {
  const [accepted, setAccepted] = useState(Boolean(initial));
  const [geminiPick, setGeminiPick] = useState(null);
  const offered = region.gemini === 'eligible';
  const gemini = geminiPick ?? (initial ? initial.gemini : COPY.geminiDefault);
  const [beforeLink, afterLink] = COPY.accept.title.split(COPY.accept.link);
  return (
    <div className="aki-body aki-welcome">
      <div className="aki-kicker">
        <span className="aki-badge"><ShieldCheck size={16} aria-hidden="true" /></span>
        <span className="aki-eyebrow">{COPY.eyebrow}</span>
      </div>
      <h3>{COPY.headingTop}<br />{COPY.headingBottom} <span aria-hidden="true">{'\u{1F44B}'}</span></h3>
      <p className="aki-lead">{COPY.intro}</p>
      <ConsentCard
        checked={accepted}
        onChange={setAccepted}
        disabled={verifying}
        title={<>{beforeLink}<a href="aki-legal.html#terms" target="_blank" rel="noopener noreferrer">{COPY.accept.link}</a>{afterLink}</>}
        body={COPY.accept.body}
      />
      {offered && <ConsentCard checked={gemini} onChange={setGeminiPick} title={COPY.gemini.title} body={COPY.gemini.body} disabled={verifying} />}
      <p className="aki-note">{COPY.storage[region.consentVersion ? region.memory : 'unknown']}</p>
      <p className="aki-note">{offered ? COPY.noteGemini : COPY.noteGroq}</p>
      <div className="aki-actions">
        <button
          type="button"
          className="button button-solid"
          disabled={!accepted}
          // Not disabled while the check runs: a disabled button would drop the visitor's focus.
          aria-disabled={verifying || undefined}
          aria-describedby={accepted ? undefined : 'aki-terms-hint'}
          onClick={() => { if (!verifying) onContinue({ gemini: offered && gemini, memory: region.memory === 'default_on' }); }}
        >
          {COPY.continueLabel}
        </button>
        <button type="button" className="button" onClick={onClose}>{COPY.notNow}</button>
      </div>
      {/* Cloudflare's bot check shows here on Continue, so the chat box never has it. */}
      <div ref={turnstileRef} className="aki-turnstile" />
      {verifying && <p className="aki-note" role="status">{COPY.verifying}</p>}
      {!accepted && <p id="aki-terms-hint" className="aki-note">{COPY.hint}</p>}
      <p className="aki-foot-links">
        <a href="aki-legal.html#privacy" target="_blank" rel="noopener noreferrer">{COPY.privacy}</a>
        <span aria-hidden="true">{' \u00B7 '}</span>
        <a href="aki-legal.html#terms" target="_blank" rel="noopener noreferrer">{COPY.terms}</a>
      </p>
    </div>
  );
}

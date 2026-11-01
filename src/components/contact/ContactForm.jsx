import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { CONTACT_INTENTS } from '../../data/siteCopy.js';
import { EMAIL_URL, PERSONAL } from '../../data/portfolioData.js';
import { submitContactForm } from '../../services/contactForm.js';
import { EASE_OUT } from '../../utils/motion.js';
import { LIMITS, purposeForIntent } from './contactRules.js';
import { useContactForm } from './useContactForm.js';

const INTENT_LABELS = CONTACT_INTENTS.map((intent) => intent.label);
const DEFAULT_INTENT = CONTACT_INTENTS[0];

export function ContactForm() {
  const reduceMotion = useReducedMotion();
  const [intent, setIntent] = useState(DEFAULT_INTENT.id);
  const {
    values, field, setField, hasInvalidFields, sent, loading, failed, handleSubmit, reset,
  } = useContactForm(submitContactForm, { purpose: DEFAULT_INTENT.label });
  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };

  const chooseIntent = (next) => {
    setIntent(next.id);
    setField('purpose', purposeForIntent(values.purpose, INTENT_LABELS, next.label));
  };

  const startOver = () => {
    setIntent(DEFAULT_INTENT.id);
    reset();
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <motion.div key="sent" className="form-feedback" role="status" {...fade} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <Check size={25} aria-hidden="true" />
          <h3>Message sent.</h3>
          <p>Thanks for reaching out. You can send another message if needed.</p>
          <button type="button" className="button button-solid" onClick={startOver}>Write another message <ArrowRight size={16} aria-hidden="true" /></button>
        </motion.div>
      ) : (
        <motion.form key="form" className="contact-form" onSubmit={handleSubmit} noValidate {...fade} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <fieldset className="intent-group">
            <legend>I'm getting in touch about</legend>
            <div className="intent-options">
              {CONTACT_INTENTS.map((option) => (
                <label key={option.id} className="intent-option">
                  <input type="radio" name="intent" value={option.id} checked={intent === option.id}
                    onChange={() => chooseIntent(option)} />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-two">
            <label>Your name <input type="text" autoComplete="name" required maxLength={LIMITS.name} placeholder="How should I call you?" {...field('name')} /></label>
            <label>Email address <input type="email" autoComplete="email" required maxLength={LIMITS.email} placeholder="you@example.com" {...field('email')} /></label>
          </div>
          <label>What is this about? <input type="text" required maxLength={LIMITS.purpose} placeholder="Role, project, or collaboration" {...field('purpose')} /></label>
          <label>Tell me more <textarea required rows={5} maxLength={LIMITS.message} placeholder="The role or problem, the team, and any timing that matters..." {...field('message')} /></label>
          <div className="form-count">{values.message.length} / {LIMITS.message}</div>
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="portfolio-website">Leave this empty</label>
            <input type="text" id="portfolio-website" tabIndex={-1} autoComplete="off" {...field('website')} />
          </div>
          {hasInvalidFields && <p className="form-error" role="alert">Please complete all fields with a valid email and a message under {LIMITS.message} characters.</p>}
          {failed && <p className="form-error" role="alert">The message couldn't be sent. Try again, or email me directly at <a href={EMAIL_URL}>{PERSONAL.email}</a>.</p>}
          <button type="submit" className="button button-solid submit-button" disabled={loading} aria-busy={loading || undefined}>
            {loading ? 'Sending…' : (failed ? 'Try again' : 'Send message')} <ArrowUpRight size={18} aria-hidden="true" />
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

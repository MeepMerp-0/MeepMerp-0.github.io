import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { EMAIL_URL, PERSONAL } from '../../data/portfolioData.js';
import { submitContactForm } from '../../services/contactForm.js';
import { LIMITS } from './contactRules.js';
import { useContactForm } from './useContactForm.js';

export function ContactForm() {
  const { values, field, hasInvalidFields, sent, loading, failed, handleSubmit, reset } = useContactForm(submitContactForm);

  if (sent) {
    return (
      <div className="form-feedback" role="status">
        <Check size={25} aria-hidden="true" />
        <h3>Message sent.</h3>
        <p>Thanks for reaching out. You can send another message if needed.</p>
        <button type="button" className="button button-solid" onClick={reset}>Write another message <ArrowRight size={16} aria-hidden="true" /></button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-header"><span>MESSAGE.JS / NEW REQUEST</span><span>01—04</span></div>
      <div className="form-two">
        <label>Your name <input type="text" autoComplete="name" required maxLength={LIMITS.name} placeholder="How should I call you?" {...field('name')} /></label>
        <label>Email address <input type="email" autoComplete="email" required maxLength={LIMITS.email} placeholder="you@example.com" {...field('email')} /></label>
      </div>
      <label>What is this about? <input type="text" required maxLength={LIMITS.purpose} placeholder="Project, role, or collaboration" {...field('purpose')} /></label>
      <label>Tell me more <textarea required rows={5} maxLength={LIMITS.message} placeholder="A few details about the problem you're solving..." {...field('message')} /></label>
      <div className="form-count">{values.message.length} / {LIMITS.message}</div>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="portfolio-website">Leave this empty</label>
        <input type="text" id="portfolio-website" tabIndex={-1} autoComplete="off" {...field('website')} />
      </div>
      {hasInvalidFields && <p className="form-error" role="alert">Please complete all fields with a valid email and a message under {LIMITS.message} characters.</p>}
      {failed && <p className="form-error" role="alert">The message couldn't be sent. Please email me directly at <a href={EMAIL_URL}>{PERSONAL.email}</a>.</p>}
      <button type="submit" className="button button-solid submit-button" disabled={loading}>
        {loading ? 'Sending…' : 'Send message'} <ArrowUpRight size={18} aria-hidden="true" />
      </button>
    </form>
  );
}

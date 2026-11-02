'use strict';

// The fictional site: preview width, menu and the availability form.
// The chat and the workflow live in flow.js. Nothing is stored or sent anywhere.
const byId = (id) => document.getElementById(id);

const frame = byId('frame');
const head = byId('site-head');
const toggle = byId('nav-toggle');
const nav = byId('site-nav');
const form = byId('order-form');
const sent = byId('sent');
const note = byId('f-note');
const widthButtons = document.querySelectorAll('.seg-btn');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^\+?[\d\s().-]+$/;

function checkContact(v) {
  if (!v) return 'Enter an email address or a phone number.';
  if (v.includes('@')) return EMAIL.test(v) ? '' : 'Enter an email like name@example.com.';
  const digits = v.replace(/\D/g, '').length;
  return PHONE_CHARS.test(v) && digits >= 7 && digits <= 15
    ? ''
    : 'Enter a phone number with 7 to 15 digits, or an email address.';
}

const fields = [
  { id: 'f-name', check: (v) => (v.length < 2 ? 'Enter your name (at least 2 characters).' : '') },
  { id: 'f-contact', check: checkContact },
  { id: 'f-item', check: (v) => (v ? '' : 'Choose an item, or "Not sure, ask the team".') },
  {
    id: 'f-qty',
    check: (v) => (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 10 ? '' : 'Enter a quantity from 1 to 10.'),
  },
].map((f) => ({ ...f, input: byId(f.id), error: byId(`${f.id}-error`) }));

function setWidth(name) {
  frame.dataset.width = name;
  widthButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.width === name)));
}

function setMenu(open, returnFocus) {
  head.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  if (returnFocus) toggle.focus({ preventScroll: true });
}

function showError(field, message) {
  field.error.textContent = message;
  field.error.hidden = !message;
  field.input.setAttribute('aria-invalid', String(Boolean(message)));
  return message;
}

function validateField(field) {
  return showError(field, field.check(field.input.value.trim()));
}

function send() {
  const invalid = fields.filter((f) => validateField(f));
  if (invalid.length) {
    sent.hidden = true;
    invalid[0].input.focus();
    return;
  }
  const [name, contact, item, qty] = fields.map((f) => f.input.value.trim());
  byId('sent-who').textContent = `Thanks, ${name}. Your request passed the checks.`;
  sent.hidden = false;
  sent.focus();
  // flow.js picks this up and runs the workflow.
  form.dispatchEvent(new CustomEvent('order-request', {
    detail: { name, contact, sku: item, qty: Number(qty), note: note.value.trim() },
  }));
}

function reset() {
  fields.forEach((f) => {
    f.input.value = f.id === 'f-qty' ? '1' : '';
    showError(f, '');
  });
  note.value = '';
  sent.hidden = true;
  byId('sent-who').textContent = '';
  setMenu(false, false);
  setWidth('desktop');
  window.scrollTo(0, 0);
}

widthButtons.forEach((b) => b.addEventListener('click', () => setWidth(b.dataset.width)));
byId('reset').addEventListener('click', reset);
// The portfolio shows this page in an iframe sandboxed without allow-forms, where a form never fires `submit`.
// So the button works from a click, and Enter in a text field is caught before the browser tries to submit.
byId('send').addEventListener('click', send);
form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.isComposing || e.target.tagName !== 'INPUT') return;
  e.preventDefault();
  send();
});

toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true', false));

nav.addEventListener('click', (e) => {
  // A chosen section takes the reading position; focus is not pulled back to the Menu button.
  if (e.target.closest('a') && head.classList.contains('is-open')) setMenu(false, false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && head.classList.contains('is-open')) setMenu(false, true);
});

fields.forEach((f) => {
  const live = () => {
    sent.hidden = true;
    if (f.input.getAttribute('aria-invalid') === 'true') validateField(f);
  };
  f.input.addEventListener('input', live);
  f.input.addEventListener('change', live);
});

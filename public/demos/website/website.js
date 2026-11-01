'use strict';

// All state lives in the DOM and in memory. Nothing is stored or sent anywhere.
const byId = (id) => document.getElementById(id);

const frame = byId('frame');
const head = byId('site-head');
const toggle = byId('nav-toggle');
const nav = byId('site-nav');
const sent = byId('sent');
const widthButtons = document.querySelectorAll('.seg-btn');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fields = [
  {
    id: 'f-name',
    check: (v) => (v.length < 2 ? 'Enter your name (at least 2 characters).' : ''),
  },
  {
    id: 'f-email',
    check: (v) => (!v ? 'Enter your email address.' : EMAIL.test(v) ? '' : 'Enter an email like name@example.com.'),
  },
  {
    id: 'f-topic',
    check: (v) => (v ? '' : 'Choose a topic.'),
  },
  {
    id: 'f-message',
    check: (v) => (v.length < 10 ? 'Write a message of at least 10 characters.' : ''),
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
  const name = fields[0].input.value.trim();
  byId('sent-who').textContent = `Thanks, ${name}. Your details passed the checks.`;
  sent.hidden = false;
  sent.focus();
}

function reset() {
  fields.forEach((f) => {
    f.input.value = '';
    showError(f, '');
  });
  sent.hidden = true;
  byId('sent-who').textContent = '';
  setMenu(false, false);
  setWidth('desktop');
  window.scrollTo(0, 0);
}

widthButtons.forEach((b) => b.addEventListener('click', () => setWidth(b.dataset.width)));
byId('reset').addEventListener('click', reset);
byId('send').addEventListener('click', send);

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

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
  runFlow('form', name, fields[2].input.value);
}

// The automation behind the form, simulated step by step: the enquiry arrives, the assistant sorts it by topic,
// three actions run side by side, and the owner gets the summary. Nothing leaves the page.
const flowSteps = [...document.querySelectorAll('#flow-steps li')];
const flowTexts = ['flow-trigger', 'flow-route', 'flow-owner'].map((id) => [id, byId(id).textContent]);
const ROUTES = { design: 'New design lead', renovation: 'Renovation lead', other: 'General enquiry' };
// Trigger, route, the three actions together, then the owner.
const STAGES = [[0], [1], [2, 3, 4], [5]];
let flowTimer = 0;

function runFlow(source, name, topic) {
  window.clearTimeout(flowTimer);
  const route = ROUTES[topic] || ROUTES.other;
  byId('flow-trigger').textContent = `${source === 'chat' ? 'Chat message' : 'Website form'} from ${name}.`;
  byId('flow-route').textContent = `Topic read: ${route}.`;
  byId('flow-owner').textContent = 'Waiting for the actions.';
  byId('flow-status').textContent = '';
  flowSteps.forEach((li) => { li.dataset.state = 'todo'; });
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stage = 0;
  const advance = () => {
    STAGES[stage].forEach((n) => { flowSteps[n].dataset.state = 'done'; });
    stage += 1;
    if (stage < STAGES.length) {
      STAGES[stage].forEach((n) => { flowSteps[n].dataset.state = 'current'; });
      if (still) advance();
      else flowTimer = window.setTimeout(advance, 650);
      return;
    }
    const summary = `${route} from ${name}, by ${source}: saved, owner notified, reminder set.`;
    byId('flow-owner').textContent = summary;
    byId('flow-status').textContent = `Workflow finished (simulated). ${summary}`;
  };
  STAGES[0].forEach((n) => { flowSteps[n].dataset.state = 'current'; });
  if (still) advance();
  else flowTimer = window.setTimeout(advance, 650);
}

function resetFlow() {
  window.clearTimeout(flowTimer);
  flowSteps.forEach((li) => { delete li.dataset.state; });
  flowTexts.forEach(([id, text]) => { byId(id).textContent = text; });
  byId('flow-status').textContent = '';
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
  resetFlow();
  window.scrollTo(0, 0);
}

widthButtons.forEach((b) => b.addEventListener('click', () => setWidth(b.dataset.width)));
byId('reset').addEventListener('click', reset);
byId('send').addEventListener('click', send);
byId('flow-chat').addEventListener('click', () => runFlow('chat', 'Sam (fictional)', 'renovation'));

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

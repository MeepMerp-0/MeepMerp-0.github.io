// Field limits and send checks for the contact form. Pure, so contactRules.test.js runs them under Node.
export const LIMITS = { name: 50, email: 254, purpose: 150, message: 500 };

const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_SENDS_PER_WINDOW = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFilled = (value) => value.trim() !== '';

// True for each field that stops the form from sending.
export const findInvalidFields = ({ name, email, purpose, message }) => ({
  name: !isFilled(name),
  email: !EMAIL_PATTERN.test(email),
  purpose: !isFilled(purpose),
  message: !isFilled(message) || message.trim().length > LIMITS.message,
});

// A courtesy limit for this page only: three sent messages a minute. A reload starts over.
export const isRateLimited = (sentTimes, now) =>
  sentTimes.filter((time) => now - time < RATE_LIMIT_WINDOW_MS).length >= MAX_SENDS_PER_WINDOW;

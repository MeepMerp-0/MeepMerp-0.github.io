// Sends a contact message to the configured backend: Google Apps Script, or a JSON API for 'smtp' and 'third-party'.

const PROVIDERS = ['appscript', 'smtp', 'third-party'];
const PROVIDER = import.meta.env.VITE_FORM_BACKEND || 'appscript';
if (!PROVIDERS.includes(PROVIDER)) {
  throw new Error(`Invalid VITE_FORM_BACKEND: ${PROVIDER}. Must be one of: ${PROVIDERS.join(', ')}`);
}
const SCRIPT_URL = import.meta.env.VITE_FORM_SCRIPT_URL;
const API_URL = import.meta.env.VITE_FORM_API_URL || '/api/contact';

async function postToAppsScript(values) {
  if (!SCRIPT_URL) return false;
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    // text/plain avoids CORS preflight (no OPTIONS request)
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    // Apps Script cannot read request headers, so send the site the message came from.
    // Not named "website": spam filters treat that as a bot honeypot field.
    body: JSON.stringify({ ...values, origin: window.location.host }),
    redirect: 'follow',
  });
  if (!response.ok) return false;
  // Apps Script reports its own errors with HTTP 200, so check the body too.
  const data = await response.json();
  return data?.success !== false;
}

async function postToApi(values) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  });
  if (!response.ok) return false;
  // A 200 without a JSON body counts as a failure.
  await response.json();
  return true;
}

// Resolves true once the backend accepts the message, and false on a refusal or a network error.
export async function submitContactForm(values) {
  try {
    return await (PROVIDER === 'appscript' ? postToAppsScript(values) : postToApi(values));
  } catch {
    return false;
  }
}

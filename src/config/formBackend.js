/**
 * Form backend configuration
 * @typedef {Object} FormBackendConfig
 * @property {'appscript'|'smtp'|'third-party'} PROVIDER - Form backend provider
 * @property {string} SCRIPT_URL - Google Apps Script URL
 * @property {string} API_URL - Custom API endpoint URL
 * @property {string} THIRD_PARTY_URL - Third-party service URL
 */

/** @type {FormBackendConfig} */
export const FORM_BACKEND = {
  // Primary form backend provider (appscript, smtp, or third-party)
  PROVIDER: (() => {
    const raw = typeof import.meta !== 'undefined' && import.meta.env?.VITE_FORM_BACKEND
      ? import.meta.env.VITE_FORM_BACKEND
      : 'appscript';
    const valid = ['appscript', 'smtp', 'third-party'];
    if (!valid.includes(raw)) {
      throw new Error(`Invalid VITE_FORM_BACKEND: ${raw}. Must be one of: ${valid.join(', ')}`);
    }
    return raw;
  })(),

  // Google Apps Script URL (when PROVIDER is 'appscript')
  SCRIPT_URL: typeof import.meta !== 'undefined' && import.meta.env?.VITE_FORM_SCRIPT_URL
    ? import.meta.env.VITE_FORM_SCRIPT_URL
    : '',

  // Custom API endpoint URL (when PROVIDER is 'smtp' or custom)
  API_URL: typeof import.meta !== 'undefined' && import.meta.env?.VITE_FORM_API_URL
    ? import.meta.env.VITE_FORM_API_URL
    : '/api/contact',

  // Third-party service URL (when PROVIDER is 'third-party')
  THIRD_PARTY_URL: typeof import.meta !== 'undefined' && import.meta.env?.VITE_FORM_THIRD_PARTY_URL
    ? import.meta.env.VITE_FORM_THIRD_PARTY_URL
    : ''
};
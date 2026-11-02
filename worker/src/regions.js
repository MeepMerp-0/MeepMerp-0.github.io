// Country rules. `country` is request.cf?.country as is: a two-letter code, XX when unknown, T1 for Tor, or missing.

// Memory is opt-in and Gemini is never offered in the EEA, the UK and Switzerland, with their separately coded territories.
export const EEA_UK_CH = Object.freeze([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
  'GF', 'GP', 'MQ', 'RE', 'YT', 'MF', 'AX', 'SJ',
  'GI', 'JE', 'GG', 'IM',
]);
// Quick answers only: CU, IR, KP and SY for export controls (Groq's terms), and Tor (T1), which defeats the
// per-IP limits. A constant rather than a var, so a missing config value cannot drop it.
export const AI_BLOCKED = Object.freeze(['CU', 'IR', 'KP', 'SY', 'T1']);

const COUNTRY_RE = /^[A-Z]{2}$/;

export const isCountry = (c) => typeof c === 'string' && COUNTRY_RE.test(c) && c !== 'XX';

/** 'off' | 'ineligible' | 'eligible'. Pure: the Gemini latch and caps are checked in the DO. */
export function geminiSwitch(config, country) {
  if (!config.gemini.on) return 'off';
  return isCountry(country) && config.gemini.countries.includes(country) ? 'eligible' : 'ineligible';
}

/** Memory default (D21): opt-in for the EEA, UK and CH, XX, and a malformed or missing country. */
export const memoryRule = (country) => (!isCountry(country) || EEA_UK_CH.includes(country) ? 'opt_in' : 'default_on');

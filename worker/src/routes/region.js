import { geminiSwitch, memoryRule } from '../regions.js';

/**
 * POST /v1/region (§3): the visitor's memory default, Gemini eligibility and the current consent version.
 * No limiter call, no storage write, no fetch.
 */
export function region({ config, deps, respond }) {
  return respond({
    type: 'region',
    memory: memoryRule(deps.country),
    gemini: geminiSwitch(config, deps.country) === 'eligible' ? 'eligible' : 'ineligible',
    consentVersion: config.consentVersion,
  });
}

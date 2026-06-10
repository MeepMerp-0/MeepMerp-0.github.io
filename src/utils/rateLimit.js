/**
 * Rate limiting configuration
 * @typedef {Object} RateLimitConfig
 * @property {number} MAX_SUBMISSIONS - Max submissions per window
 * @property {number} WINDOW_MS - Time window in milliseconds
 * @property {Function} clear - Clears the store
 */

/** @type {RateLimitConfig} */
export const RATE_LIMIT = {
  MAX_SUBMISSIONS: 5,
  WINDOW_MS: 60000,
  clear: () => submissionStore.clear(),
};

const submissionStore = new Map();

/**
 * Checks if IP is within rate limit
 * @param {string} ip - Client IP address
 * @returns {{allowed: boolean, retryAfter?: number}}
 */
export function checkRateLimit(ip) {
  if (typeof ip !== 'string') {
    return { allowed: false, retryAfter: RATE_LIMIT.WINDOW_MS };
  }

  const now = Date.now();
  const timestamps = submissionStore.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT.WINDOW_MS);

  if (validTimestamps.length >= RATE_LIMIT.MAX_SUBMISSIONS) {
    return { allowed: false, retryAfter: RATE_LIMIT.WINDOW_MS };
  }

  // Immutable update - create new array
  const updatedTimestamps = [...validTimestamps, now];
  submissionStore.set(ip, updatedTimestamps);
  return { allowed: true };
}
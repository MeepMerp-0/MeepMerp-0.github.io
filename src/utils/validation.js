/**
 * Validates email format
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates required string field
 * @param {string} value
 * @returns {boolean}
 */
export function validateRequired(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates maximum string length
 * @param {string} value
 * @param {number} max
 * @returns {boolean}
 */
export function validateMaxLength(value, max) {
  if (!value || typeof value !== 'string') return true;
  return value.length <= max;
}
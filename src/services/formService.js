import { FORM_BACKEND } from '../config/formBackend.js';
import { submitToAppScript } from './appScriptService.js';
import { validateEmail, validateRequired, validateMaxLength } from '../utils/validation.js';

/**
 * Validates form data for all providers
 * @param {Object} formData
 * @returns {string[]} Array of error messages
 */
function validateForm(formData) {
  const errors = [];
  if (!validateRequired(formData.name)) errors.push('Name is required');
  if (!validateMaxLength(formData.name, 50)) errors.push('Name must be under 50 characters');
  if (!validateEmail(formData.email)) errors.push('Valid email is required');
  if (!validateRequired(formData.purpose)) errors.push('Purpose is required');
  if (!validateRequired(formData.message)) errors.push('Message is required');
  if (!validateMaxLength(formData.message, 500)) errors.push('Message must be under 500 characters');
  return errors;
}

/**
 * Submits via API endpoint (smtp or third-party)
 * @param {Object} formData
 * @returns {Promise<Object>}
 */
async function submitViaApi(formData) {
  try {
    const response = await fetch(FORM_BACKEND.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }

    const error = await response.json().catch(() => ({}));
    const errorMessage = error.errors
      ? error.errors.join(', ')
      : error.error || error.message || `HTTP ${response.status}`;
    return { success: false, error: errorMessage };
  } catch (err) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Submits form data using the configured backend
 * @param {Object} formData - The form data to submit
 * @returns {Promise<Object>} Result object with success status and data or error
 */
export async function submitContactForm(formData) {
  const errors = validateForm(formData);
  if (errors.length > 0) {
    return { success: false, error: errors.join(', ') };
  }

  switch (FORM_BACKEND.PROVIDER) {
    case 'appscript':
      if (!FORM_BACKEND.SCRIPT_URL) {
        return { success: false, error: 'VITE_FORM_SCRIPT_URL not configured' };
      }
      return submitToAppScript(formData);

    case 'smtp':
    case 'third-party':
      return submitViaApi(formData);

    default:
      return { success: false, error: 'Unknown form backend provider' };
  }
}
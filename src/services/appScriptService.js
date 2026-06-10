/**
 * Submits form data to Google Apps Script endpoint
 * @param {Object} formData - The form data to submit
 * @param {string} formData.name - User's name
 * @param {string} formData.email - User's email
 * @param {string} formData.purpose - Purpose of contact
 * @param {string} formData.message - Message content
 * @returns {Promise<Object>} Result object with success status and data or error
 * @returns {boolean} result.success - Whether the submission was successful
 * @returns {any} result.data - Response data from the service (if successful)
 * @returns {string} result.error - Error message (if unsuccessful)
 */
export async function submitToAppScript(formData) {
  const SCRIPT_URL = import.meta.env.VITE_FORM_SCRIPT_URL || '';

  if (!SCRIPT_URL) {
    return { success: false, error: 'VITE_FORM_SCRIPT_URL not configured' };
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      // text/plain avoids CORS preflight (no OPTIONS request)
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(formData),
      redirect: 'follow',
    });

    // Opaque response means Google redirected — treat as success
    if (response.type === 'opaque') {
      return { success: true, data: null };
    }

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }

    const error = await response.json().catch(() => ({}));
    return { success: false, error: error.error || `HTTP ${response.status}` };
  } catch (err) {
    return { success: false, error: err.message || 'Network error' };
  }
}
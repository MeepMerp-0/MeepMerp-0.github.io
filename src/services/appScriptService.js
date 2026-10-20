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
      // Apps Script cannot read request headers, so send the site the message came from.
      // Not named "website": spam filters treat that as a bot honeypot field.
      body: JSON.stringify({ ...formData, origin: window.location.host }),
      redirect: 'follow',
    });

    // Opaque response means Google redirected — treat as success
    if (response.type === 'opaque') {
      return { success: true, data: null };
    }

    if (response.ok) {
      const data = await response.json();
      // Apps Script reports its own errors with HTTP 200, so check the body too.
      if (data?.success === false) return { success: false, error: data.error || 'Submission rejected' };
      return { success: true, data };
    }

    const error = await response.json().catch(() => ({}));
    return { success: false, error: error.error || `HTTP ${response.status}` };
  } catch (err) {
    return { success: false, error: err.message || 'Network error' };
  }
}
import { google } from 'googleapis';

/**
 * Validates required Google Sheets environment variables
 * @throws {Error} If required env vars are missing
 */
function validateSheetsConfig() {
  const required = ['GOOGLE_SERVICE_ACCOUNT_KEY', 'GOOGLE_SHEETS_ID'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing Google Sheets config: ${missing.join(', ')}`);
  }
}

// Allow injecting sheets instance for testing
let sheetsInstance = null;

const getSheetsInstance = () => {
  if (sheetsInstance) {
    return sheetsInstance;
  }
  validateSheetsConfig();
  return google.sheets({ version: 'v4', auth: process.env.GOOGLE_SERVICE_ACCOUNT_KEY });
};

/**
 * Appends contact form data to Google Sheets
 * @param {Object} params
 * @param {string} params.name - User's name
 * @param {string} params.email - User's email
 * @param {string} params.purpose - Purpose of contact
 * @param {string} params.message - Message content
 * @param {string} params.submissionId - Unique submission ID
 * @returns {Promise<Object>} Result with success status
 */
export async function appendToSheet({ name, email, purpose, message, submissionId }) {
  try {
    validateSheetsConfig();
    const sheets = getSheetsInstance();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[submissionId, new Date().toISOString(), name, email, purpose, message]],
      },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
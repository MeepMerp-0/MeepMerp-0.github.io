import nodemailer from 'nodemailer';

/**
 * Sanitizes input to prevent email header injection
 * @param {string} input
 * @returns {string}
 */
function sanitize(input) {
  return input.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Validates required SMTP environment variables
 * @throws {Error} If required env vars are missing
 */
function validateSmtpConfig() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing SMTP config: ${missing.join(', ')}`);
  }
}

/**
 * Sends contact form email
 * @param {Object} params
 * @param {string} params.name - User's name
 * @param {string} params.email - User's email
 * @param {string} params.purpose - Purpose of contact
 * @param {string} params.message - Message content
 * @param {string} params.submissionId - Unique submission ID
 * @returns {Promise<Object>} Result with success status
 */
export async function sendContactEmail({ name, email, purpose, message, submissionId }) {
  validateSmtpConfig();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
    subject: `Contact Form: ${sanitize(purpose)}`,
    text: `New contact form submission\n\nID: ${submissionId}\nName: ${sanitize(name)}\nEmail: ${sanitize(email)}\nPurpose: ${sanitize(purpose)}\nMessage: ${sanitize(message)}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
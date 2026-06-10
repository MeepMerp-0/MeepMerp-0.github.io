import { validateEmail, validateRequired, validateMaxLength } from '../src/utils/validation.js';
import { checkRateLimit } from '../src/utils/rateLimit.js';
import { generateUUID } from '../src/utils/uuid.js';
import { sendContactEmail } from '../src/services/emailService.js';
import { appendToSheet } from '../src/services/sheetsService.js';

/**
 * Handles contact form submission
 * @param {Request} req - Incoming request object
 * @returns {Promise<Response>} Response with success/error status
 */
export default async function contactHandler(req) {
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const body = await req.json();
  const ip = getClientIp(req);

  if (body.website) {
    return errorResponse('Spam detected', 400);
  }

  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    return errorResponse('Rate limit exceeded', 429);
  }

  const validationErrors = validateContactForm(body);
  if (validationErrors.length > 0) {
    return errorResponse(validationErrors, 400);
  }

  const submissionId = generateUUID();

  try {
    const [emailResult, sheetsResult] = await Promise.all([
      sendContactEmail({ name: body.name, email: body.email, purpose: body.purpose, message: body.message, submissionId }),
      appendToSheet({ name: body.name, email: body.email, purpose: body.purpose, message: body.message, submissionId })
    ]);

    if (emailResult.success && sheetsResult.success) {
      return successResponse({ success: true, id: submissionId });
    }

    const errors = [];
    if (!emailResult.success) errors.push('Email service failed');
    if (!sheetsResult.success) errors.push('Google Sheets service failed');

    return errorResponse({ error: 'Failed to process submission', details: errors }, 500);
  } catch (err) {
    return errorResponse({ error: 'Internal server error', details: [err.message] }, 500);
  }
}

/**
 * Extracts client IP from request headers
 * @param {Request} req
 * @returns {string}
 */
function getClientIp(req) {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Validates contact form fields
 * @param {Object} body - Form data
 * @returns {string[]} Array of error messages
 */
function validateContactForm(body) {
  const errors = [];
  if (!validateRequired(body.name)) errors.push('Name is required');
  if (!validateMaxLength(body.name, 50)) errors.push('Name must be under 50 characters');
  if (!validateEmail(body.email)) errors.push('Valid email is required');
  if (!validateRequired(body.purpose)) errors.push('Purpose is required');
  if (!validateRequired(body.message)) errors.push('Message is required');
  if (!validateMaxLength(body.message, 500)) errors.push('Message must be under 500 characters');
  return errors;
}

/**
 * Creates a JSON error response
 * @param {string|Object} message - Error message or object
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
function errorResponse(message, status) {
  const body = typeof message === 'string' ? { error: message } : message;
  return new Response(JSON.stringify(body), { status });
}

/**
 * Creates a JSON success response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response}
 */
function successResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status });
}
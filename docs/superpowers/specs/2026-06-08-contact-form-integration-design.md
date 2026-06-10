# Contact Form Integration Design

**Date:** 2026-06-08

## Overview
Implement a functional contact form that sends submissions to both email and Google Sheets, with rate limiting, unique ID generation, client-side and server-side validation, and honeypot anti-spam protection.

## Architecture
### Frontend
- React component (`ContactView.jsx`) with form fields: name, email, purpose (subject), message
- Added honeypot field (hidden input) to trap bots
- Client-side validation for immediate feedback
- On submit: send data to Vercel serverless function `/api/contact`
- Display success or error messages based on response

### Backend
- Vercel serverless function (`/api/contact`) handling POST requests
- Steps:
  1. Extract IP address for rate limiting
  2. Check honeypot field (if not empty, reject as spam)
  3. Rate limit: 5 submissions per minute per IP (in-memory store)
  4. Server-side validation:
     - name: required, max 50 characters
     - email: required, valid email format
     - purpose: required
     - message: required, max 500 characters
  5. Generate UUID v4 as unique ID
  6. Send email via nodemailer (SMTP credentials from environment variables)
  7. Append submission to Google Sheets via Google Sheets API (service account from environment variables)
  8. Return success or error response

## Components
### Frontend
- `ContactView.jsx`: main form component
- Validation functions (shared or inline)
- Honeypot field implementation

### Backend
- Serverless function handler
- Validation module (optional)
- Rate limiting module (optional)
- Email service module (nodemailer wrapper)
- Google Sheets service module

## Data Flow
1. User fills form and submits
2. Frontend performs client-side validation
3. If valid, POST request sent to `/api/contact` with form data
4. Backend:
   - Checks honeypot (spam if not empty)
   - Checks rate limit (by IP)
   - Validates fields server-side
   - Generates UUID
   - Sends email
   - Appends to Google Sheets
   - Returns result
5. Frontend shows success/error message based on response

## Error Handling
- Client-side: field-level errors (e.g., invalid email, missing required) and form-level errors (rate limit, spam)
- Server-side:
  - 400 Bad Request: honeypot filled, validation errors, rate limit exceeded
  - 500 Internal Server Error: email or Google Sheets failure (logged internally)
  - Generic error messages shown to user to avoid leaking sensitive info
- Logging: errors logged to Vercel logs for debugging

## Testing
- Unit tests for validation and rate limiting logic
- Integration tests for serverless function (using Jest or Vercel testing)
- Frontend tests with React Testing Library (existing test setup)
- Target: 80%+ test coverage

## Open Questions
- None; all design aspects approved.

## Approval
This design has been reviewed and approved for implementation.
# Contact Form - Google Apps Script Backend

> **Status:** Approved design - ready for implementation planning

## Overview

Flexible contact form backend supporting multiple providers with Google Apps Script as primary. Feature flag approach allows switching between backends via environment variables.

## Architecture

```
┌─────────────────┐
│ ContactView.jsx │
│  (Frontend)     │
└────────┬────────┘
         │ POST JSON
         ▼
┌─────────────────────────────────┐
│ formSubmission.js (Service)     │
│  - Provider: appscript|smtp|thirdparty
│  - Routes based on FORM_BACKEND.PROVIDER
└────────┬────────────────────────┘
         │
         ├─────── appscript ──────▶ Google Apps Script Web App
         ├─────── smtp ──────────▶ /api/contact (Vercel/Netlify)
         └─────── thirdparty ──────▶ Formspree/etc
```

## Configuration

### Environment Variables (.env)
```
REACT_APP_FORM_BACKEND=appscript
REACT_APP_FORM_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXXXXXXXX/exec
REACT_APP_FORM_API_URL=/api/contact
REACT_APP_THIRD_PARTY_URL=https://formspree.io/f/XXXXXXXX
```

### Config File (src/config/formBackend.js)
```javascript
export const FORM_BACKEND = {
  PROVIDER: process.env.REACT_APP_FORM_BACKEND || 'appscript',
  SCRIPT_URL: process.env.REACT_APP_FORM_SCRIPT_URL || '',
  API_URL: process.env.REACT_APP_FORM_API_URL || '/api/contact',
  THIRD_PARTY_URL: process.env.REACT_APP_THIRD_PARTY_URL || ''
};
```

## Files to Create

### src/config/formBackend.js
Configuration constants for backend provider selection.

### src/services/formSubmission.js
Main submission service that routes to appropriate backend.

### src/services/appScriptService.js
Apps Script submission handler with fetch to Google endpoint.

### src/services/thirdPartyService.js
Third-party service submission handler (optional).

## Files to Modify

### src/views/ContactView.jsx
- Import `submitContactForm` from formSubmission service
- Add required field indicators (*) after labels
- Add character counter below message field
- Update fetch call to use unified service

## Frontend Validation

Uses existing utility functions:
- `validateEmail()` - email format check
- `validateRequired()` - non-empty check
- `validateMaxLength()` - length limits (50 for name, 500 for message)

Real-time feedback:
- Green border when field valid
- Red accent when approaching character limit
- Immediate error display on submit attempt

## Apps Script Implementation

### Entry Point (doPost)
Handles POST requests with validation, sheet storage, and optional email.

### Validation Flow
1. Parse JSON request body
2. Honeypot check (reject if filled)
3. Required fields check
4. Email format validation
5. Max length enforcement (name:50, message:500)
6. Generate UUID and timestamp server-side

### Storage
- Single Google Sheet with columns:
  - A: Submission ID
  - B: Timestamp
  - C: Name
  - D: Email
  - E: Purpose
  - F: Message

### Email
- Sends notification to form owner
- Uses `MailApp.sendEmail()`
- Fails gracefully (logs but doesn't block submission)

## Character Counter UI

```javascript
// Message field character counter with color states
const charCount = vals.message.length;
const maxChars = 500;
const counterColor = charCount >= maxChars * 0.9 ? 'var(--warning)' :
                    charCount >= maxChars * 0.8 ? 'var(--cyan)' :
                    'var(--muted)';

// Display below textarea
<div style={{
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: counterColor,
  marginTop: 4
}}>{charCount}/{maxChars}</div>
```

## Required Field Indicators

Red asterisks after each label:
```javascript
<span style={{ color: 'var(--cyan)' }}>*</span>
```

Applied to: Name, Email, Subject, Message

## User Experience

1. User enters form data
2. Real-time validation shows visual feedback (green borders)
3. Character counter updates below message field
4. Submit button starts loading state ("TRANSMITTING...")
5. On success: Shows "Message Transmitted" UI
6. On error: Shows error message with retry option

## Security

- No secrets in client code
- Apps Script runs under user's Google account
- Honeypot prevents bot submissions
- Server-side validation as backup
- `.env` in `.gitignore`

## Testing

- Frontend validation tests (existing)
- Service integration tests (planned)
- Apps Script manual testing via script editor

## Implementation Steps

1. Create `src/config/formBackend.js`
2. Create `src/services/formSubmission.js`
3. Create `src/services/appScriptService.js`
4. Modify `src/views/ContactView.jsx`
5. Update `.env.example` with backend variables
6. Create Apps Script project and paste code
7. Deploy Apps Script as web app
8. Set environment variables in build/deployment
9. Test end-to-end flow

## Rollback Plan

Switch `REACT_APP_FORM_BACKEND` to alternative provider:
- `smtp` - uses existing `/api/contact` endpoint
- `thirdparty` - uses Formspree/etc
- Original code remains unchanged
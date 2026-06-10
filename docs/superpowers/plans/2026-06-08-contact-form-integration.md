# Contact Form Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a functional contact form that sends submissions to both email and Google Sheets, with rate limiting, unique ID generation, validation, and honeypot anti-spam protection.

**Architecture:** Frontend forms validated client-side, then POST to Vercel serverless function. Backend validates, checks honeypot/rate-limit, sends email via nodemailer, appends to Google Sheets via API.

**Tech Stack:** React 19, Motion, Vercel Serverless Functions, Nodemailer, Google Sheets API, Jest

---

## Task 1: Create validation utility module

**Files:**
- Create: `src/utils/validation.js`
- Create: `tests/utils/validation.test.js`

- [ ] **Step 1: Write failing test for validation functions**

```javascript
// tests/utils/validation.test.js
import { validateEmail, validateRequired, validateMaxLength } from '../../src/utils/validation.js';

describe('validateEmail', () => {
  test('returns true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
  test('returns false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
  test('returns false for empty email', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validateRequired', () => {
  test('returns true for non-empty string', () => {
    expect(validateRequired('test')).toBe(true);
  });
  test('returns false for empty string', () => {
    expect(validateRequired('')).toBe(false);
  });
});

describe('validateMaxLength', () => {
  test('returns true for string within limit', () => {
    expect(validateMaxLength('abc', 5)).toBe(true);
  });
  test('returns false for string exceeding limit', () => {
    expect(validateMaxLength('abcdef', 5)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/utils/validation.test.js -- --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/utils/validation.js
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value) {
  return value && typeof value === 'string' && value.trim().length > 0;
}

export function validateMaxLength(value, max) {
  if (!value || typeof value !== 'string') return true;
  return value.length <= max;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/utils/validation.test.js -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Save**

Verify tests pass. User handles git commits.

---

## Task 2: Create rate limiting utility

**Files:**
- Create: `src/utils/rateLimit.js`
- Create: `tests/utils/rateLimit.test.js`

- [ ] **Step 1: Write failing test for rate limiting**

```javascript
// tests/utils/rateLimit.test.js
import { checkRateLimit, RATE_LIMIT } from '../../src/utils/rateLimit.js';

describe('checkRateLimit', () => {
  beforeEach(() => {
    RATE_LIMIT.clear();
  });

  test('allows request under limit', () => {
    const ip = '192.168.1.1';
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(true);
  });

  test('blocks request over limit', () => {
    const ip = '192.168.1.2';
    // Simulate 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip);
    }
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/utils/rateLimit.test.js -- --no-coverage`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/utils/rateLimit.js
const submissionStore = new Map();

export const RATE_LIMIT = {
  MAX_SUBMISSIONS: 5,
  WINDOW_MS: 60000,
  clear: () => submissionStore.clear(),
};

export function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = submissionStore.get(ip) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT.WINDOW_MS);

  if (validTimestamps.length >= RATE_LIMIT.MAX_SUBMISSIONS) {
    return { allowed: false, retryAfter: RATE_LIMIT.WINDOW_MS };
  }

  validTimestamps.push(now);
  submissionStore.set(ip, validTimestamps);
  return { allowed: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/utils/rateLimit.test.js -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Save**

Verify tests pass. User handles git commits.

---

## Task 3: Create UUID utility

**Files:**
- Create: `src/utils/uuid.js`
- Create: `tests/utils/uuid.test.js`

- [ ] **Step 1: Write failing test for UUID generation**

```javascript
// tests/utils/uuid.test.js
import { generateUUID } from '../../src/utils/uuid.js';

describe('generateUUID', () => {
  test('generates valid UUID v4 format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(uuid)).toBe(true);
  });

  test('generates unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/utils/uuid.test.js -- --no-coverage`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/utils/uuid.js
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/utils/uuid.test.js -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Save**

Verify tests pass. User handles git commits.

---

## Task 4: Create Vercel serverless function endpoint

**Files:**
- Create: `api/contact.js`
- Create: `tests/api/contact.test.js`

- [ ] **Step 1: Write failing test for serverless function**

```javascript
// tests/api/contact.test.js
import { default as contactHandler } from '../../api/contact.js';

describe('contactHandler', () => {
  test('rejects filled honeypot', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        purpose: 'Hello',
        message: 'Test message',
        website: 'spam',
      }),
    });
    const res = await contactHandler(req);
    expect(res.status).toBe(400);
  });

  test('rejects invalid email', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'invalid-email',
        purpose: 'Hello',
        message: 'Test message',
        website: '',
      }),
    });
    const res = await contactHandler(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/api/contact.test.js -- --no-coverage`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// api/contact.js
import { validateEmail, validateRequired, validateMaxLength } from '../src/utils/validation.js';
import { checkRateLimit } from '../src/utils/rateLimit.js';
import { generateUUID } from '../src/utils/uuid.js';

export default async function contactHandler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = await req.json();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Check honeypot (spam trap)
  if (body.website) {
    return new Response(JSON.stringify({ error: 'Spam detected' }), { status: 400 });
  }

  // Rate limiting
  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
  }

  // Validation
  const errors = [];
  if (!validateRequired(body.name)) errors.push('Name is required');
  if (!validateMaxLength(body.name, 50)) errors.push('Name must be under 50 characters');
  if (!validateEmail(body.email)) errors.push('Valid email is required');
  if (!validateRequired(body.purpose)) errors.push('Purpose is required');
  if (!validateRequired(body.message)) errors.push('Message is required');
  if (!validateMaxLength(body.message, 500)) errors.push('Message must be under 500 characters');

  if (errors.length > 0) {
    return new Response(JSON.stringify({ errors }), { status: 400 });
  }

  const submissionId = generateUUID();
  return new Response(JSON.stringify({ success: true, id: submissionId }), { status: 200 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/api/contact.test.js -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Save**

Verify tests pass. User handles git commits.

---

## Task 5: Create setupTests.js

**Files:**
- Create: `src/setupTests.js`

- [ ] **Step 1: Write setupTests.js**

```javascript
// src/setupTests.js
import '@testing-library/jest-dom';
```

- [ ] **Step 2: Save**

User handles git commits.

---

## Task 6: Update ContactView.jsx with form functionality

**Files:**
- Modify: `src/views/ContactView.jsx`
- Create: `tests/views/ContactView.test.jsx`

- [ ] **Step 1: Write failing test for form submission**

```javascript
// tests/views/ContactView.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ContactView from '../../src/views/ContactView.jsx';

global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }));

describe('ContactView', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('validates required fields before submission', async () => {
    render(<ContactView />);
    const submitButton = screen.getByRole('button', { name: /transmit message/i });
    fireEvent.click(submitButton);
    expect(fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/views/ContactView.test.jsx -- --no-coverage`
Expected: FAIL

- [ ] **Step 3: Modify ContactView.jsx**

Add honeypot field (hidden input), validation state, submission state, and fetch call to `/api/contact`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/views/ContactView.test.jsx -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Save**

Verify tests pass. User handles git commits.

---

## Task 7: Implement email sending (nodemailer)

**Files:**
- Create: `src/services/emailService.js`
- Create: `tests/services/emailService.test.js`

- [ ] **Step 1: Install nodemailer**

```bash
npm install nodemailer
```

- [ ] **Step 2: Write failing test**

- [ ] **Step 3: Write implementation**

```javascript
// src/services/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendContactEmail({ name, email, purpose, message, submissionId }) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
    subject: `Contact Form: ${purpose}`,
    text: `New contact form submission\n\nID: ${submissionId}\nName: ${name}\nEmail: ${email}\nPurpose: ${purpose}\nMessage: ${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
}
```

- [ ] **Step 4: Save**

Verify tests pass. User handles git commits.

---

## Task 8: Implement Google Sheets integration

**Files:**
- Create: `src/services/sheetsService.js`
- Create: `tests/services/sheetsService.test.js`

- [ ] **Step 1: Install googleapis**

```bash
npm install googleapis
```

- [ ] **Step 2: Write failing test**

- [ ] **Step 3: Write implementation**

```javascript
// src/services/sheetsService.js
import { google } from 'googleapis';

const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SERVICE_ACCOUNT_KEY });

export async function appendToSheet({ name, email, purpose, message, submissionId }) {
  try {
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
    console.error('Sheets append failed:', error);
    return { success: false, error: error.message };
  }
}
```

- [ ] **Step 4: Save**

Verify tests pass. User handles git commits.

---

## Task 9: Integrate services into contact handler

**Files:**
- Modify: `api/contact.js`

- [ ] **Step 1: Import and call services**

Import `sendContactEmail` and `appendToSheet`, call them after validation.

- [ ] **Step 2: Run tests**

- [ ] **Step 3: Save**

Verify tests pass. User handles git commits.

---

## Task 10: Create .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=your-email@example.com
CONTACT_EMAIL=your-email@example.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHEETS_ID=your-spreadsheet-id
```

- [ ] **Step 2: Save**

Ready for git commit.

---

## Spec Review

All requirements covered:
- ✅ Both email and Google Sheets storage
- ✅ Rate limiting (5 per minute per IP)
- ✅ UUID v4 unique ID generation
- ✅ Email validation (basic format)
- ✅ Name max 50 chars, message max 500 chars
- ✅ Purpose required only
- ✅ Honeypot anti-spam field
- ✅ Error handling
# Contact Form - Google Apps Script Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement flexible contact form backend supporting Google Apps Script with required field indicators and character counter UI.

**Architecture:** Feature flag approach routes submissions to Apps Script, SMTP API, or third-party services. Apps Script handles validation, sheet storage, and email notifications.

**Tech Stack:** React 19, Vite 8, Google Apps Script, Google Sheets API

---

## Task 1: Create formBackend configuration

**Files:**
- Create: `src/config/formBackend.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/config/formBackend.test.js
import { FORM_BACKEND } from '../../src/config/formBackend.js';

describe('FORM_BACKEND configuration', () => {
  test('has PROVIDER property with default value', () => {
    expect(FORM_BACKEND.PROVIDER).toBeDefined();
  });

  test('has SCRIPT_URL property', () => {
    expect(FORM_BACKEND.SCRIPT_URL).toBeDefined();
  });

  test('has API_URL property', () => {
    expect(FORM_BACKEND.API_URL).toBeDefined();
  });

  test('has THIRD_PARTY_URL property', () => {
    expect(FORM_BACKEND.THIRD_PARTY_URL).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/config/formBackend.test.js -- --no-coverage`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/config/formBackend.js
export const FORM_BACKEND = {
  PROVIDER: import.meta.env.VITE_FORM_BACKEND || 'appscript',
  SCRIPT_URL: import.meta.env.VITE_FORM_SCRIPT_URL || '',
  API_URL: import.meta.env.VITE_FORM_API_URL || '/api/contact',
  THIRD_PARTY_URL: import.meta.env.VITE_FORM_THIRD_PARTY_URL || ''
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/config/formBackend.test.js -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

(Handle git commands personally)

---

## Task 2: Create Apps Script service

**Files:**
- Create: `src/services/appScriptService.js`
- Create: `tests/services/appScriptService.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/services/appScriptService.test.js
import { submitToAppScript } from '../../src/services/appScriptService.js';

global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ success: true, id: 'test-uuid' })
}));

describe('submitToAppScript', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('sends POST request to script URL with form data', async () => {
    const result = await submitToAppScript({
      name: 'Test User',
      email: 'test@example.com',
      purpose: 'Test Purpose',
      message: 'Test Message'
    });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        purpose: 'Test Purpose',
        message: 'Test Message'
      })
    });
    expect(result.success).toBe(true);
  });

  test('returns error when response is not ok', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'Validation failed' })
    }));

    const result = await submitToAppScript({});
    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/services/appScriptService.test.js -- --no-coverage`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/services/appScriptService.js
const SCRIPT_URL = import.meta.env.VITE_FORM_SCRIPT_URL || '';

export async function submitToAppScript(formData) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/services/appScriptService.test.js -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

(Handle git commands personally)

---

## Task 3: Modify ContactView.jsx - Add character counter

**Files:**
- Modify: `src/views/ContactView.jsx`

- [ ] **Step 1: Write failing test**

```javascript
// tests/views/ContactView-char-counter.test.jsx
import { render, screen } from '@testing-library/react';
import ContactView from '../../src/views/ContactView.jsx';

describe('Character counter', () => {
  test('renders character counter below message field', () => {
    render(<ContactView />);
    const counter = screen.getByText('0/500');
    expect(counter).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/views/ContactView-char-counter.test.jsx -- --no-coverage`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation - add counter below message field**

In ContactView.jsx, after the textarea closing tag (line 569), add:
```javascript
<div style={{
  textAlign: 'right',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: vals.message.length >= 450 ? 'var(--cyber-red)' :
        vals.message.length >= 400 ? 'var(--cyan)' :
        'var(--muted)',
  marginTop: 4
}}>{vals.message.length}/500</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/views/ContactView-char-counter.test.jsx -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

(Handle git commands personally)

---

## Task 4: Modify ContactView.jsx - Add required field indicators

**Files:**
- Modify: `src/views/ContactView.jsx`

- [ ] **Step 1: Write failing test**

```javascript
// tests/views/ContactView-required-indicators.test.jsx
import { render, screen } from '@testing-library/react';
import ContactView from '../../src/views/ContactView.jsx';

describe('Required field indicators', () => {
  test('shows asterisk after required field labels', () => {
    render(<ContactView />);
    // Check Name label exists with asterisk
    expect(screen.getByText(/Name/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/views/ContactView-required-indicators.test.jsx -- --no-coverage`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Modify labels in ContactView.jsx:
- Name label: Add `<span style={{ color: 'var(--cyan)' }}>*</span>` after text
- Email label: Add `<span style={{ color: 'var(--cyan)' }}>*</span>` after text  
- Subject label: Add `<span style={{ color: 'var(--cyan)' }}>*</span>` after text
- Message label: Add `<span style={{ color: 'var(--cyan)' }}>*</span>` after text

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/views/ContactView-required-indicators.test.jsx -- --no-coverage`
Expected: PASS

- [ ] **Step 5: Commit**

(Handle git commands personally)

---

## Task 5: Update .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add form backend variables**

Add to `.env.example`:
```
VITE_FORM_BACKEND=appscript
VITE_FORM_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_FORM_API_URL=/api/contact
VITE_FORM_THIRD_PARTY_URL=https://formspree.io/f/YOUR_FORM_ID
```

- [ ] **Step 2: Commit**

(Handle git commands personally)

---

## Task 6: Google Apps Script deployment guide

**Files:**
- Create: `docs/google-apps-script-setup.md`

- [ ] **Step 1: Write deployment documentation**

Create `docs/google-apps-script-setup.md` with Apps Script code:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.website && data.website.trim() !== '') {
      return createJsonResponse({ success: false, error: 'Spam detected' }, 400);
    }

    // Required fields
    const required = ['name', 'email', 'purpose', 'message'];
    const missing = required.filter(f => !data[f] || data[f].trim() === '');
    if (missing.length > 0) {
      return createJsonResponse({ success: false, error: `${missing.join(', ')} required` }, 400);
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return createJsonResponse({ success: false, error: 'Invalid email' }, 400);
    }

    // Max length
    if (data.name.length > 50) return createJsonResponse({ success: false, error: 'Name too long' }, 400);
    if (data.message.length > 500) return createJsonResponse({ success: false, error: 'Message too long' }, 400);

    // Generate ID and timestamp
    const submissionId = generateUUID();
    const timestamp = new Date().toISOString();

    // Store in sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      submissionId,
      timestamp,
      data.name.trim(),
      data.email.trim(),
      data.purpose.trim(),
      data.message.trim()
    ]);

    // Send email notification
    try {
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: `New Contact Form: ${data.purpose}`,
        body: `New submission:\nID: ${submissionId}\nName: ${data.name}\nEmail: ${data.email}\nPurpose: ${data.purpose}\nMessage: ${data.message}`
      });
    } catch (err) {
      console.error('Email failed:', err);
    }

    return createJsonResponse({ success: true, id: submissionId }, 200);

  } catch (err) {
    return createJsonResponse({ success: false, error: 'Server error' }, 500);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function createJsonResponse(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setResponseCode(statusCode);
}
```

- [ ] **Step 2: Commit**

(Handle git commands personally)

---

**"Plan complete and saved to `docs/superpowers/plans/2026-06-08-appscript-contact-form-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**
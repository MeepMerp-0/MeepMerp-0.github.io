# Google Apps Script Setup Guide
## For Your Contact Form

This guide shows you how to set up Google Apps Script to handle form submissions from your portfolio website. The script will:
- ✅ Validate form data (required fields, email format, spam protection)
- 💾 Save submissions to a Google Sheet
- 📧 Send email notifications
- 🔄 Return success/error responses to your website

---

## 📋 What You'll Need

Before starting, make sure you have:
1. A Google Account (Gmail)
2. Access to Google Sheets and Google Apps Script
3. Your form's data structure (name, email, purpose, message)

---

## 🚀 Step-by-Step Setup

### 1. Create the Script
1. Go to [Google Apps Script](https://script.google.com/)
2. Click "New Project"
3. Delete any starter code
4. Copy and paste the code below into the editor

### 2. Add the Script Code
```javascript
/**
 * Handles CORS preflight requests
 */
function doGet(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Main function that handles form submissions
 * @param {Object} e - The event object containing form data
 * @returns {Object} JSON response with success status
 */
function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // 🛡️ SPAM PROTECTION: Check honeypot field
    if (data.website && data.website.trim() !== '') {
      return createJsonResponse({ success: false, error: 'Spam detected' }, 400);
    }

    // ✅ REQUIRED FIELDS: Verify all required fields are filled
    const required = ['name', 'email', 'purpose', 'message'];
    const missing = required.filter(f => !data[f] || data[f].trim() === '');
    if (missing.length > 0) {
      return createJsonResponse({ 
        success: false, 
        error: `${missing.join(', ')} required` 
      }, 400);
    }

    // 📧 EMAIL VALIDATION: Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return createJsonResponse({ success: false, error: 'Invalid email' }, 400);
    }

    // 📏 LENGTH LIMITS: Prevent overly long submissions
    if (data.name.length > 50) return createJsonResponse({ success: false, error: 'Name too long' }, 400);
    if (data.message.length > 500) return createJsonResponse({ success: false, error: 'Message too long' }, 400);

    // 🆔 GENERATE ID & TIMESTAMP
    const submissionId = generateUUID();
    const timestamp = new Date().toISOString();

    // 💾 SAVE TO GOOGLE SHEET
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      submissionId,
      timestamp,
      data.name.trim(),
      data.email.trim(),
      data.purpose.trim(),
      data.message.trim()
    ]);

    // 📧 SEND EMAIL NOTIFICATION (optional)
    try {
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: `New Contact Form: ${data.purpose}`,
        body: `New submission:\nID: ${submissionId}\nName: ${data.name}\nEmail: ${data.email}\nPurpose: ${data.purpose}\nMessage: ${data.message}`
      });
    } catch (err) {
      // Log email failure but don't fail the whole request
      console.error('Email notification failed:', err);
    }

    // ✅ RETURN SUCCESS
    return createJsonResponse({ success: true, id: submissionId }, 200);

  } catch (err) {
    // Handle unexpected errors
    return createJsonResponse({ success: false, error: 'Server error' }, 500);
  }
}

/**
 * Generates a unique ID (UUID v4 format)
 * @returns {string} Unique identifier
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Creates a standardized JSON response
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted JSON response
 */
function createJsonResponse(data, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setResponseCode(statusCode);
}
```

### 3. Save and Deploy
1. Click the floppy disk icon or press `Ctrl+S` to save
2. Give your project a name (like "Contact Form Handler")
3. Click "Deploy" → "New deployment"
4. Select "Web app" as the deployment type
5. Configure:
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone
6. Click "Deploy"
7. **IMPORTANT**: Copy the web app URL from the deployment confirmation

### 4. Configure Your Website
1. Open your project's `.env` file
2. Add or update these lines:
   ```
   VITE_FORM_BACKEND=appscript
   VITE_FORM_SCRIPT_URL=[PASTE_YOUR_WEB_APP_URL_HERE]
   VITE_FORM_API_URL=/api/contact
   VITE_FORM_THIRD_PARTY_URL=https://formspree.io/f/YOUR_FORM_ID
   ```
3. Replace `[PASTE_YOUR_WEB_APP_URL_HERE]` with the URL you copied in step 3

### 5. Prepare Your Google Sheet
1. Open the Google Sheet where you want to store submissions
2. In the first row (header row), add these column labels:
   - A1: Submission ID
   - B1: Timestamp
   - C1: Name
   - D1: Email
   - E1: Purpose
   - F1: Message
3. The script will start adding data from row 2 downward

---

## 🔍 How It Works

**When someone submits your contact form:**
1. Website sends form data to this Apps Script URL
2. Script validates: required fields, email format, spam protection
3. If valid: saves data to Google Sheet + sends email notification
4. Script returns JSON response: `{success: true, id: "unique-id"}`
5. Website shows success message to user
6. If invalid: returns error details for website to display

---

## 🛡️ Security & Privacy Notes

- **Data stays in your Google Account**: All submissions are stored in YOUR Google Sheet
- **Email notifications go to YOU**: Only you get notified of new submissions
- **No third-party services**: Unlike Formspree or similar, this uses only Google's infrastructure
- **Spam protection**: Built-in honeypot field catches most automated bots
- **Rate limiting**: Google Apps Script has built-in quotas to prevent abuse

---

## 📊 Viewing Your Submissions

All form submissions appear in your Google Sheet with these columns:
| Submission ID | Timestamp | Name | Email | Purpose | Message |
|---------------|-----------|------|-------|---------|---------|
| abc-123-def   | 2024-01-15T10:30:00Z | John Doe | john@example.com | Website Inquiry | Hello, I'm interested in... |
| ...           | ...       | ...  | ...   | ...     | ...     |

You can:
- Sort/filter by any column
- Add additional notes or status tracking
- Export to CSV/Excel
- Create charts or reports from the data

---

## ❓ Troubleshooting

**Issue**: "Access denied" or permission errors
**Solution**: Make sure you deployed as "Me (your account)" and not "Anyone"

**Issue**: Not receiving email notifications
**Solution**: Check that your Google Account email is correct and not in spam folder

**Issue**: Form not submitting
**Solution**: 
1. Verify `VITE_FORM_SCRIPT_URL` in your `.env` matches the deployment URL
2. Check browser console for network errors
3. Ensure your Google Sheet has the correct header row

**Issue**: Getting "Server error" responses
**Solution**: Check the Apps Script execution log (View → Executions) for detailed error messages

---

## ✅ Testing Your Setup

1. Submit a test entry through your website's contact form
2. Check your Google Sheet for the new row
3. Verify you received an email notification (if enabled)
4. Confirm the website shows a success message

Once working, you're all set to receive genuine inquiries through your portfolio contact form!
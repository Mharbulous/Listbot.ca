# Email Extraction Testing Guide

**Version**: 3.0 (v5 Matter-Scoped Architecture)
**Status**: Ready for Testing
**Environment**: Production (us-west1)
**Last Updated**: 2025-11-29

> **Note**: This guide reflects the v5 architecture where all data is matter-scoped.
> - `uploads` collection → `evidence` collection (within matter scope)
> - `emails` collection → matter-scoped `emails` subcollection
> - All paths include `firmId` and `matterId`

---

## Prerequisites

Before you begin testing, ensure you have:

- [ ] Access to the ListBot production app
- [ ] Firebase Console access (https://console.firebase.google.com)
- [ ] Sample email files (.msg and .eml) with various scenarios
- [ ] Browser DevTools open to monitor network requests
- [ ] Firebase CLI installed locally (`firebase --version`)

---

## Test File Preparation

### Recommended Test Files

You'll need to prepare or obtain the following test files:

1. **Simple Email** (.msg or .eml)
   - No attachments
   - Plain text body
   - ~10-50KB size

2. **Email with PDF Attachment** (.msg or .eml)
   - 1-2 PDF attachments
   - ~500KB-2MB total size

3. **Email with Image Attachments** (.msg or .eml)
   - 2-3 image files (JPG/PNG)
   - ~1-5MB total size

4. **Email with Duplicate Attachments** (.msg or .eml)
   - Same attachment appears multiple times
   - Tests deduplication logic

5. **Nested Email** (.msg or .eml)
   - Contains another .msg or .eml file as attachment
   - Tests recursive extraction

6. **Large Email** (optional, for error testing)
   - >100MB total size
   - Should be rejected by validation

---

## Test 1: Basic Email Upload

**Objective**: Verify end-to-end email extraction with a simple email file

### Step 1.1: Upload the Email

1. Open ListBot app in your browser
2. Navigate to a matter (or create a test matter)
3. Upload a simple .msg or .eml file
4. Note the file hash displayed (if visible in UI)

### Step 1.2: Monitor Client-Side Behavior

**Check Browser DevTools (Console)**:
```javascript
// Look for:
// - File hash calculation (BLAKE3)
// - Storage upload success
// - Firestore document creation
```

**Expected Logs**:
- "File hashed: [64-char hash]"
- "Uploaded to Storage: firms/{firmId}/matters/{matterId}/evidence/[hash]"
- "Created evidence document with hasEmailAttachments: true"

### Step 1.3: Verify Firestore Documents

**Open Firebase Console → Firestore Database**

**Navigate to**: `firms/{firmId}/matters/{matterId}/evidence`

1. Find document with ID = your file hash
2. Verify initial state (fields shown in Firebase Console alphabetical order):
   ```javascript
   {
     // Tag counters (alphabetically first)
     autoApprovedCount: 0,

     // Email extraction fields
     extractedAttachmentHashes: [],
     extractedFromEmails: [],
     extractedMessageId: null,

     // File metadata
     fileSize: [number],
     fileType: "email",
     firmId: "[your-firm-id]",

     // Processing status
     hasAllPages: null,
     hasEmailAttachments: true,  // Initially TRUE

     // Attachment tracking
     isEmailAttachment: false,
     isProcessed: false,

     // Identity
     matterId: "[matter-id]",
     nestingDepth: 0,

     // Parsing status
     parseError: null,
     parseStatus: "pending",     // Then "processing" → "completed"
     parsedAt: null,
     processingStage: "uploaded",
     retryCount: 0,
     reviewRequiredCount: 0,

     // Source tracking
     sourceFileName: "test-email.msg",
     sourceFolderPath: "",
     sourceID: "[hash]",           // Same as id for original uploads
     sourceLastModified: [timestamp],
     sourceMetadata: {},
     sourceMetadataCount: 1,
     sourceMetadataVariants: {
       "[hash]": {
         sourceFileName: "test-email.msg",
         sourceFolderPath: "",
         sourceLastModified: [timestamp],
         uploadDate: [timestamp]
       }
     },

     // Storage
     storagePath: "firms/{firmId}/matters/{matterId}/uploads/[hash].msg",

     // Tags
     tagCount: 0,
     tags: {},

     // Timestamps
     uploadDate: [timestamp],

     // User
     userId: "[your-user-id]"
   }
   ```

3. **Wait 5-30 seconds** for Cloud Function to process
4. Refresh the document and verify final state:
   ```javascript
   {
     // ... same fields as above, but:
     hasEmailAttachments: false,      // Changed to FALSE
     parseStatus: "completed",        // Changed to "completed"
     parsedAt: [timestamp],           // Now populated
     extractedMessageId: "[msg-id]"   // Now populated
   }
   ```

**Navigate to**: `firms/{firmId}/matters/{matterId}/emails`

1. Find the new document (ID should match `extractedMessageId` from above)
2. Verify structure:
   ```javascript
   {
     id: "[auto-generated-id]",
     firmId: "[your-firm-id]",
     userId: "[your-user-id]",
     matterId: "[matter-id]",
     sourceFileHash: "[file-hash]",
     extractedAt: [timestamp],

     // Email metadata
     subject: "Your Email Subject",
     from: { name: "Sender Name", email: "sender@example.com" },
     to: [{ name: "Recipient", email: "recipient@example.com" }],
     cc: [],
     date: [email-date-timestamp],

     // Body storage paths (matter-scoped)
     bodyTextPath: "firms/{firmId}/matters/{matterId}/emails/[msg-id]/body.txt",
     bodyHtmlPath: "firms/{firmId}/matters/{matterId}/emails/[msg-id]/body.html",  // May be null
     bodyPreview: "First 500 characters of email body...",

     // Attachments
     hasAttachments: false,  // No attachments in this test
     attachmentCount: 0,
     attachments: [],

     createdAt: [timestamp]
   }
   ```

### Step 1.4: Verify Storage Files

**Open Firebase Console → Storage**

1. Navigate to `firms/{firmId}/matters/{matterId}/emails/[msg-id]/`
2. Verify files exist:
   - `body.txt` - Plain text email body
   - `body.html` - HTML email body (if present)

3. Click on `body.txt` and preview content
4. Verify it matches the email body

### Step 1.5: Check Function Logs

**Via Firebase Console**:
1. Go to Functions → onEvidenceCreated → Logs
2. Look for recent execution
3. Expected log: `"Extracted [hash]: 0 attachments"`

**Via CLI** (optional):
```bash
firebase functions:log --only onEvidenceCreated --limit 10
```

### ✅ Test 1 Success Criteria

- [ ] File uploaded to Storage successfully
- [ ] `evidence` document created with correct initial state (including v5 fields)
- [ ] `parseStatus` transitioned: `pending` → `processing` → `completed`
- [ ] `hasEmailAttachments` changed: `true` → `false`
- [ ] `emails` document created in matter-scoped subcollection with correct metadata
- [ ] Email body saved to Storage at matter-scoped path (body.txt)
- [ ] Function logs show successful extraction
- [ ] No errors in browser console or function logs

---

## Test 2: Email with Attachments

**Objective**: Verify attachment extraction and BLAKE3 deduplication

### Step 2.1: Upload Email with Attachments

1. Upload a .msg/.eml file containing 2-3 PDF or image attachments
2. Note the parent email's file hash

### Step 2.2: Monitor Processing

Watch the `evidence` document for the parent email as it processes.

### Step 2.3: Verify Attachment Extraction

**Navigate to**: `firms/{firmId}/matters/{matterId}/evidence`

1. Find the parent email document (should now be `parseStatus: "completed"`)
2. Check `extractedAttachmentHashes` array:
   ```javascript
   {
     extractedAttachmentHashes: [
       "abc123def456...",  // Hash of attachment 1
       "789ghi012jkl...",  // Hash of attachment 2
       "345mno678pqr..."   // Hash of attachment 3
     ]
   }
   ```

3. For EACH hash in the array, find the corresponding evidence document (alphabetical order):
   ```javascript
   // Document ID = attachment hash
   {
     // Tag counters
     autoApprovedCount: 0,

     // Email fields (null for non-email attachments)
     extractedAttachmentHashes: [],
     extractedFromEmails: ["[parent-hash]"],  // Parent email hash
     extractedMessageId: null,

     // File metadata
     fileSize: [number],
     fileType: "pdf",  // Detected from extension
     firmId: "[same-firm]",

     // Processing status
     hasAllPages: null,
     hasEmailAttachments: null,

     // Attachment tracking
     isEmailAttachment: true,            // TRUE - extracted from email
     isProcessed: false,

     // Identity
     matterId: "[same-matter]",
     nestingDepth: 1,                    // One level deep

     // Parsing status (null for non-email attachments)
     parseError: null,
     parseStatus: null,
     parsedAt: null,
     processingStage: "uploaded",
     retryCount: 0,
     reviewRequiredCount: 0,

     // Source tracking
     sourceFileName: "attachment.pdf",
     sourceFolderPath: "",
     sourceID: "abc123def456...",
     sourceLastModified: [timestamp],
     sourceMetadata: {},
     sourceMetadataCount: 1,
     sourceMetadataVariants: {
       "abc123def456...": {
         sourceFileName: "attachment.pdf",
         sourceFolderPath: "",
         sourceLastModified: [timestamp],
         uploadDate: [timestamp]
       }
     },

     // Storage
     storagePath: "firms/{firmId}/matters/{matterId}/uploads/abc123def456...",

     // Tags
     tagCount: 0,
     tags: {},

     // Timestamps
     uploadDate: [timestamp],

     // User
     userId: "[same-user]"
   }
   ```

**Navigate to**: `firms/{firmId}/matters/{matterId}/emails`

1. Find the email document (ID from `extractedMessageId`)
2. Verify `attachments` array:
   ```javascript
   {
     hasAttachments: true,
     attachmentCount: 3,
     attachments: [
       {
         fileHash: "abc123def456...",
         fileName: "attachment.pdf",
         size: 245678,
         mimeType: "application/pdf",
         isDuplicate: false
       },
       {
         fileHash: "789ghi012jkl...",
         fileName: "image.jpg",
         size: 123456,
         mimeType: "image/jpeg",
         isDuplicate: false
       },
       {
         fileHash: "345mno678pqr...",
         fileName: "document.docx",
         size: 456789,
         mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         isDuplicate: false
       }
     ]
   }
   ```

### Step 2.4: Verify Attachment Storage

**Check Firebase Storage**:

1. Navigate to `firms/{firmId}/matters/{matterId}/evidence/`
2. Verify each attachment file exists with hash as filename
3. Download and verify file integrity

### Step 2.5: Test Deduplication

**Upload the SAME email again**:

1. Upload the identical email file (same attachments)
2. Wait for processing to complete
3. Check `evidence` collection for attachment hashes
4. Verify `isDuplicate: true` in the new email's attachment array
5. Confirm NO new files created in Storage (attachments reused)
6. Verify `extractedFromEmails` array updated with new parent:
   ```javascript
   {
     extractedFromEmails: [
       "[first-parent-hash]",
       "[second-parent-hash]"  // Added
     ]
   }
   ```

### ✅ Test 2 Success Criteria

- [ ] All attachments extracted and uploaded to Storage
- [ ] Each attachment has correct `evidence` document with `isEmailAttachment: true`
- [ ] `extractedAttachmentHashes` array contains all attachment hashes
- [ ] `emails` document has correct `attachments` array metadata
- [ ] Attachment files accessible in matter-scoped Storage path
- [ ] Duplicate attachments detected (`isDuplicate: true`)
- [ ] Duplicate attachments NOT re-uploaded to Storage
- [ ] `extractedFromEmails` array updated for duplicates
- [ ] BLAKE3 hashes consistent between client and server

---

## Test 3: Nested Emails (Recursive Extraction)

**Objective**: Verify recursive extraction of .msg/.eml files attached to emails

### Step 3.1: Upload Email with Nested Email

1. Upload a .msg file that contains another .msg or .eml file as an attachment
2. Note the parent email hash

### Step 3.2: Monitor Cascade Processing

**Watch for TWO sequential Cloud Function executions**:

1. **First execution**: Processes parent email
   - Extracts nested .msg/.eml file
   - Creates `evidence` document for nested email with `hasEmailAttachments: true`
   - Marks parent as `parseStatus: "completed"`

2. **Second execution**: Processes nested email (triggered automatically)
   - Extracts nested email's content and attachments
   - Marks nested email as `parseStatus: "completed"`

### Step 3.3: Verify Parent Email

**Navigate to**: `firms/{firmId}/matters/{matterId}/evidence` (parent email document)

```javascript
{
  // Key fields only (alphabetical order):
  extractedAttachmentHashes: [
    "[nested-email-hash]",         // Hash of nested .msg file
    "[other-attachment-hash]"      // Other attachments (if any)
  ],
  fileType: "email",
  hasEmailAttachments: false,      // Completed
  nestingDepth: 0,                 // Top level
  parseStatus: "completed",
  sourceFileName: "parent-email.msg"
}
```

**Navigate to**: `firms/{firmId}/matters/{matterId}/emails` (parent email document)

```javascript
{
  sourceFileHash: "[parent-hash]",
  subject: "Email with attached email",
  attachments: [
    {
      fileHash: "[nested-email-hash]",
      fileName: "nested-email.msg",
      mimeType: "application/vnd.ms-outlook",
      isDuplicate: false
    }
  ]
}
```

### Step 3.4: Verify Nested Email

**Navigate to**: `firms/{firmId}/matters/{matterId}/evidence` (nested email document)

```javascript
{
  // Key fields only (alphabetical order):
  extractedAttachmentHashes: [...], // Nested email's attachments
  extractedFromEmails: ["[parent-hash]"],
  extractedMessageId: "[nested-msg-id]",
  fileType: "email",
  hasEmailAttachments: false,      // Completed (initially was true)
  isEmailAttachment: true,          // TRUE - extracted from parent
  nestingDepth: 1,                  // One level deeper
  parseStatus: "completed",
  sourceFileName: "nested-email.msg"
}
```

**Navigate to**: `firms/{firmId}/matters/{matterId}/emails` (nested email document)

```javascript
{
  id: "[nested-msg-id]",
  sourceFileHash: "[nested-email-hash]",
  subject: "Subject of nested email",
  from: {...},
  to: [...],
  // ... standard email fields
}
```

### Step 3.5: Verify Function Logs

**Expected log sequence**:

```
1. "Extracted [parent-hash]: 1 attachments"
2. "Extracted [nested-email-hash]: 0 attachments"  // Or more if nested has attachments
```

### Step 3.6: Test Depth Limit (Optional)

**If you have a deeply nested email chain**:

1. Upload an email with nesting depth >10
2. Verify extraction stops at depth 10
3. Check for error: `"Exceeded max nesting depth of 10"`
4. Verify `parseStatus: "failed"` for depth-11 email

### ✅ Test 3 Success Criteria

- [ ] Parent email processed successfully
- [ ] Nested email detected and extracted
- [ ] Both emails have separate documents in matter-scoped `emails` subcollection
- [ ] Both emails have `evidence` documents in matter-scoped `evidence` collection
- [ ] `nestingDepth` increments correctly (0, 1, 2, ...)
- [ ] `extractedFromEmails` tracks parent relationship
- [ ] Function triggered twice (once for each email)
- [ ] Depth limit enforced (MAX_DEPTH = 10)
- [ ] No infinite loops or duplicate processing

---

## Test 4: Error Handling

**Objective**: Verify graceful handling of edge cases and errors

### Test 4.1: File Size Validation

**Upload an email >100MB** (if available):

1. Upload or simulate large email
2. Expected behavior:
   - `parseStatus: "failed"`
   - `parseError: "File exceeds 100MB limit"`
   - `retryCount: 1`
3. Verify error message displayed in UI (if implemented)
4. Check function logs for error details

### Test 4.2: Corrupt Email File

**Upload a corrupted or invalid .msg file**:

1. Create a text file, rename to .msg, upload
2. Expected behavior:
   - `parseStatus: "failed"`
   - `parseError: "Unsupported format: ..." or parser error`
   - `retryCount: 1`

### Test 4.3: Missing Permissions (Security Test)

**Attempt to retry another user's failed extraction**:

1. Get `fileHash` of another user's failed extraction
2. Call `retryEmailExtraction` function:
   ```javascript
   const fn = httpsCallable(functions, 'retryEmailExtraction');
   try {
     await fn({ fileHash: 'other-users-hash' });
   } catch (error) {
     console.log(error.code);  // Should be 'permission-denied'
   }
   ```
3. Expected: `HttpsError: permission-denied, "Not your file"`

### Test 4.4: Already Processing Lock

**Simulate duplicate trigger**:

1. Upload large email (slow processing)
2. While processing, manually update Firestore to trigger re-processing
3. Expected: Second attempt skipped with log `"Skipping [hash]: already processing"`

### ✅ Test 4 Success Criteria

- [ ] Oversized files rejected with clear error message
- [ ] Corrupt files fail gracefully without crashing function
- [ ] Error messages stored in `parseError` field
- [ ] `retryCount` incremented on failure
- [ ] Security: Users cannot retry others' files
- [ ] Processing lock prevents duplicate execution
- [ ] Function doesn't timeout or exceed memory limits
- [ ] All errors logged to Cloud Functions logs

---

## Test 5: Retry Failed Extraction

**Objective**: Verify manual retry functionality from UI or CLI

### Step 5.1: Create a Failed Extraction

Use Test 4.2 (corrupt file) to create a failed extraction, or:

1. Temporarily modify Cloud Function to throw error
2. Upload email → will fail
3. Verify `parseStatus: "failed"`

### Step 5.2: Test Retry from UI (If Implemented)

**Using EmailExtractionStatus component**:

1. View the failed upload in UI
2. Verify retry button appears (if `retryCount < 3`)
3. Click "Retry" button
4. Monitor status change:
   - `parseStatus: "failed"` → `"pending"` → `"processing"`
5. If transient error: expect `"completed"`
6. If persistent error: expect `"failed"` again with `retryCount: 2`

### Step 5.3: Test Retry via Function Call

**Using Browser DevTools Console**:

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';

const retry = httpsCallable(functions, 'retryEmailExtraction');

try {
  const result = await retry({
    fileHash: '[failed-file-hash]',
    firmId: '[your-firm-id]',
    matterId: '[matter-id]'
  });
  console.log('Retry result:', result.data);
} catch (error) {
  console.error('Retry failed:', error.code, error.message);
}
```

### Step 5.4: Test Max Retry Limit

**Force multiple failures**:

1. Upload corrupt file (fails)
2. Retry → fails again (`retryCount: 2`)
3. Retry → fails again (`retryCount: 3`)
4. Retry → should be REJECTED with error:
   - `HttpsError: failed-precondition, "Max retries exceeded"`
5. Verify retry button disabled in UI (if implemented)

### Step 5.5: Verify Retry Security

**Test authentication requirement**:

```javascript
// In unauthenticated context (incognito window)
const retry = httpsCallable(functions, 'retryEmailExtraction');
await retry({ fileHash: 'any-hash' });
// Expected: HttpsError: unauthenticated, "Must be logged in"
```

### ✅ Test 5 Success Criteria

- [ ] Retry button appears for failed extractions (`retryCount < 3`)
- [ ] Retry resets `parseStatus` to `"pending"` and clears `parseError`
- [ ] Retry increments `retryCount` on subsequent failures
- [ ] Max retry limit enforced (3 attempts total)
- [ ] Retry disabled after max attempts
- [ ] Security: Only authenticated users can retry
- [ ] Security: Only file owner can retry their own files
- [ ] Transient errors succeed on retry
- [ ] Persistent errors fail consistently

---

## Test 6: Monitoring & Debugging

**Objective**: Set up monitoring and review system health

### Step 6.1: View Real-Time Function Logs

**Via Firebase Console**:

1. Navigate to Functions → onEvidenceCreated
2. Click "Logs" tab
3. Set filter to "Last 1 hour"
4. Look for:
   - Success: `"Extracted [hash]: N attachments"`
   - Skips: `"Skipping [hash]: already processed"`
   - Errors: `"Extraction failed for [hash]: ..."`

**Via Firebase CLI**:

```bash
# Stream live logs
firebase functions:log --only onEvidenceCreated

# View recent logs with limit
firebase functions:log --only onEvidenceCreated --limit 20

# Filter by severity
firebase functions:log --only onEvidenceCreated --filter "severity=ERROR"
```

### Step 6.2: Check Function Performance Metrics

**In Firebase Console → Functions → onEvidenceCreated → Metrics**:

Review:
- **Invocations**: Total trigger count
- **Execution time**: Median, 95th percentile
  - Target: <60 seconds for typical emails
  - Alert if >120 seconds consistently
- **Memory usage**: Peak memory consumption
  - Allocated: 2048 MB
  - Typical usage: <500 MB
  - Alert if >1500 MB consistently
- **Error rate**: Percentage of failed executions
  - Target: <5% for production

### Step 6.3: Monitor Firestore Usage

**Check Firestore Console → Usage tab**:

- **Document reads**: Should be minimal (transaction-based locks)
- **Document writes**: 1-2 per email + 1 per attachment
- **Storage reads**: 1 per email file download

### Step 6.4: Monitor Storage Costs

**Check Storage Console → Usage**:

- **Total storage**: Track growth as emails uploaded
- **Download bandwidth**: Monitor for unexpected spikes
- **Operations**: Should correlate with upload volume

### Step 6.5: Set Up Alerts (Recommended)

**Create Cloud Monitoring alert policies** (optional but recommended):

1. **Function Error Rate Alert**:
   - Condition: Error rate > 10% over 5 minutes
   - Notification: Email to admin

2. **Function Execution Time Alert**:
   - Condition: 95th percentile > 120 seconds
   - Notification: Investigate performance

3. **Storage Cost Alert**:
   - Condition: Daily cost > $X threshold
   - Notification: Review usage patterns

### Step 6.6: Review Security Rules

**Test Firestore security rules**:

```javascript
// In browser console (authenticated)
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// Test 1: Read own evidence document
const myDoc = await getDoc(doc(db, 'firms/[firm-id]/matters/[matter-id]/evidence', '[my-file-hash]'));
console.log('Read own evidence:', myDoc.exists());  // Should be true

// Test 2: Try to read another user's evidence in different matter
const otherDoc = await getDoc(doc(db, 'firms/[other-firm]/matters/[other-matter]/evidence', '[other-hash]'));
console.log('Read other evidence:', otherDoc.exists());  // Should fail with permission-denied

// Test 3: Try to update protected field
await updateDoc(doc(db, 'firms/[firm-id]/matters/[matter-id]/evidence', '[my-file-hash]'), {
  userId: 'different-user'  // Should fail
});
```

### ✅ Test 6 Success Criteria

- [ ] Function logs accessible and informative
- [ ] Success/error patterns visible in logs
- [ ] Performance metrics within acceptable ranges
- [ ] No unexpected spikes in Firestore/Storage usage
- [ ] Security rules prevent unauthorized access
- [ ] Alerts configured for critical errors (optional)
- [ ] Cost monitoring in place

---

## Overall Success Checklist

Mark each item when verified:

### Core Functionality
- [ ] Basic email extraction works (.msg and .eml)
- [ ] Attachments extracted and deduplicated via BLAKE3
- [ ] Nested emails cascade correctly
- [ ] `hasEmailAttachments` flag transitions properly (`true` → `false`)
- [ ] Email metadata parsed accurately (subject, from, to, date)
- [ ] Email bodies stored in Storage (text and HTML)

### Data Integrity
- [ ] BLAKE3 hashes match between client and server
- [ ] Duplicate files not re-uploaded to Storage
- [ ] `extractedFromEmails` array tracks lineage correctly
- [ ] `nestingDepth` increments properly
- [ ] No orphaned documents in Firestore
- [ ] No orphaned files in Storage

### Error Handling
- [ ] Files >100MB rejected gracefully
- [ ] Nesting depth >10 rejected gracefully
- [ ] Corrupt files fail with clear error messages
- [ ] Errors logged to Cloud Functions logs
- [ ] `retryCount` incremented on failures

### Security
- [ ] Only file owners can view their extractions
- [ ] Only file owners can retry their extractions
- [ ] Unauthenticated users cannot call functions
- [ ] Firestore rules prevent unauthorized access
- [ ] Storage rules prevent unauthorized access

### Performance
- [ ] Typical emails process in <60 seconds
- [ ] Memory usage stays under 1GB
- [ ] No function timeouts
- [ ] No excessive Firestore reads/writes

### UI Integration (If Implemented)
- [ ] Extraction status visible in upload table
- [ ] Status updates in real-time (Firestore snapshot)
- [ ] Retry button appears for failed extractions
- [ ] Retry button disabled after max attempts
- [ ] Error messages displayed to user

---

## Troubleshooting Common Issues

### Issue: `parseStatus` stuck at "pending"

**Possible Causes**:
- Function not deployed or disabled
- Function region mismatch (should be us-west1)
- Function error during initialization

**Debugging Steps**:
1. Check function deployment: `firebase functions:list`
2. Check function logs: `firebase functions:log --only onEvidenceCreated`
3. Verify trigger configuration in Firebase Console

---

### Issue: "Permission denied" errors

**Possible Causes**:
- Security rules too restrictive
- User not authenticated
- `userId` mismatch in document

**Debugging Steps**:
1. Verify user is authenticated: `firebase.auth().currentUser`
2. Check document `userId` matches current user
3. Test security rules in Firebase Console Rules Playground

---

### Issue: Attachments not extracted

**Possible Causes**:
- Parser not recognizing attachment format
- Attachment too large (>100MB)
- Function memory exceeded

**Debugging Steps**:
1. Check function logs for parser errors
2. Verify attachment size < 100MB
3. Check `parseError` field in `evidence` document
4. Test with simpler email file

---

### Issue: Duplicate files uploaded despite same hash

**Possible Causes**:
- BLAKE3 hash mismatch between client/server
- Race condition in duplicate check
- Storage path incorrect

**Debugging Steps**:
1. Compare client hash vs. server hash (check logs)
2. Verify `evidence` document created before extraction
3. Check `isDuplicate` flag in email's `attachments` array
4. Review storage paths for consistency (matter-scoped)

---

## Next Steps After Testing

Once all tests pass:

1. **Monitor Production Usage**:
   - Track extraction success rate
   - Monitor costs (Firestore, Storage, Functions)
   - Review user feedback

2. **UI Enhancements**:
   - Integrate `EmailExtractionStatus` component into upload table
   - Add email viewer for extracted messages
   - Display attachment hierarchy for nested emails

3. **Feature Additions** (Future):
   - Search across extracted email metadata
   - Filter by sender/recipient
   - Export email threads
   - AI analysis of email content

4. **Performance Optimization** (If Needed):
   - Implement lazy parser loading if cold starts slow
   - Batch attachment uploads
   - Optimize body storage (compression)

---

## Testing Completion Report Template

After completing all tests, document your results:

```markdown
# Email Extraction Testing Report

**Date**: [Date]
**Tester**: [Your Name]
**Environment**: Production (us-west1)

## Test Results Summary

- Total Tests: 6
- Passed: [X]
- Failed: [Y]
- Blocked: [Z]

## Test Details

### Test 1: Basic Email Upload
- Status: [PASS/FAIL]
- Notes: [Any observations]
- Issues: [Any problems encountered]

### Test 2: Email with Attachments
- Status: [PASS/FAIL]
- Notes: [Any observations]
- Issues: [Any problems encountered]

[... continue for all tests ...]

## Issues Found

### Issue 1: [Title]
- Severity: [High/Medium/Low]
- Description: [Details]
- Reproduction Steps: [How to reproduce]
- Expected Behavior: [What should happen]
- Actual Behavior: [What actually happened]

## Recommendations

- [Any suggestions for improvements]
- [Any concerns to address]
- [Any follow-up tasks needed]

## Conclusion

[Overall assessment of the email extraction feature]
```

---

## Quick Reference: Key Commands

```bash
# View function logs
firebase functions:log --only onEvidenceCreated --limit 20

# Deploy functions
firebase deploy --only functions

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage

# List deployed functions
firebase functions:list

# Monitor function metrics
# (Use Firebase Console → Functions → Metrics)

# Test retry function (browser console)
const fn = httpsCallable(functions, 'retryEmailExtraction');
await fn({
  fileHash: '[hash]',
  firmId: '[firm-id]',
  matterId: '[matter-id]'
});
```

---

## Support

If you encounter issues during testing:

1. Check function logs first
2. Review Firestore documents for unexpected states
3. Verify security rules in Rules Playground
4. Consult the implementation plan: `planning/4. Testing/2025-11-28-Email_Extraction_Plan_Server-Side.md`
5. Review deployment notes in Step 7 of the plan

**Happy Testing! 🎉**

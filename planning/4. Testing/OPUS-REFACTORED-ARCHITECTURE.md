# Opus's Refactored Email Extraction Architecture

**Date**: 2025-11-29
**Version**: Refactored (Post-Bug Fix)
**Status**: Implemented - Ready for Deployment

---

## Problem: Root Cause Analysis

### The Bug
Cloud Function `onEvidenceCreated` crashed when processing voicemail `.msg` files with error:
```
parseError: "Cannot read properties of undefined (reading 'toLowerCase')"
```

### Why It Happened

The `@kenjiuno/msgreader` library has quirks when handling attachments:

1. **Undefined `fileName` Property**: Some attachments have `fileName: undefined` (not missing, but explicitly undefined)
2. **Multiple Filename Fields**: The library uses different field names depending on .msg structure:
   - `att.fileName`
   - `att.name`
   - `att.displayName`
   - `att.longFilename`
   - `att.shortFilename`
3. **Null/Undefined Entries**: The attachments array can contain `null` or `undefined` entries

### Why Defensive Checks Failed

**Original buggy approach**:
```javascript
// parsers.js (FAILED APPROACH)
attachments: (data.attachments || []).map(att => ({
  fileName: att.fileName || 'unnamed',  // ❌ Doesn't work!
  data: content ? Buffer.from(content) : Buffer.alloc(0)
}))
```

**The problem**: `.toLowerCase()` was called on `att.fileName` BEFORE the fallback could work:
```javascript
// isEmailFile function (FAILED)
function isEmailFile(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();  // ❌ Crashes if fileName is undefined
  return ext === 'msg' || ext === 'eml';
}
```

**Key insight**: Scattering `|| 'fallback'` checks throughout the codebase is fragile. Downstream code doesn't know which fields are guaranteed valid.

---

## Solution: "Validate Once at the Boundary"

Opus's refactored architecture isolates library quirks and validates data at a single boundary, guaranteeing downstream code never sees invalid data.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloud Function                           │
│                         (index.js)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Orchestrator                             │
│                     (orchestrator.js)                           │
│                                                                 │
│  1. Validate inputs                                             │
│  2. Check nesting depth                                         │
│  3. Acquire lock                                                │
│  4. Download file                                               │
│  5. Parse and validate  ──────────────────────┐                │
│  6. Process attachments                        │                │
│  7. Save email bodies                          │                │
│  8. Create email document                      │                │
│  9. Mark success/failure                       │                │
└────────────────────────────────────────────────│────────────────┘
                                                 │
                              ┌──────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Parser                                 │
│                        (parser.js)                              │
│                                                                 │
│  1. Detect format (.msg or .eml)                               │
│  2. Call appropriate adapter                                    │
│  3. Validate result via schema                                  │
│                                                                 │
│  OUTPUT: Guaranteed valid ParsedEmail object                    │
└─────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────┐
│    MSG Adapter      │            │    EML Adapter      │
│  (msgAdapter.js)    │            │  (emlAdapter.js)    │
│                     │            │                     │
│  Handles all        │            │  Handles all        │
│  msgreader quirks   │            │  mailparser quirks  │
└─────────────────────┘            └─────────────────────┘
         │                                    │
         └────────────────┬───────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Schema                                  │
│                       (schema.js)                               │
│                                                                 │
│  validateParsedEmail(raw, fileName)                            │
│                                                                 │
│  - Validates every field                                        │
│  - Normalizes to consistent format                              │
│  - Provides sensible defaults                                   │
│  - Skips malformed attachments (logs warning)                  │
│                                                                 │
│  OUTPUT: Guaranteed shape, no undefined fields                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Validate Once at the Boundary

**Philosophy**: All data validation happens in `schema.js`. After validation, downstream code **trusts** the data shape.

**How it works**:
- Adapters return raw data (including `null`/`undefined` values)
- `schema.js` validates and normalizes everything
- After validation, fileName is GUARANTEED to be a non-empty string
- Downstream code like `isEmailFile()` can safely call `.toLowerCase()`

**Benefits**:
- No scattered `|| 'fallback'` checks throughout codebase
- Single source of truth for data shape
- Easy to test (validate once, trust everywhere)

### 2. Isolate Third-Party Libraries

**Philosophy**: `msgreader` and `mailparser` quirks are contained in their respective adapters. The rest of the codebase never touches them directly.

**msgAdapter.js - Handles ALL msgreader Quirks**:
```javascript
// Try ALL possible filename fields (lines 113-122)
const possibleNames = [
  att.fileName,      // Standard field
  att.name,          // Alternative 1
  att.displayName,   // Alternative 2
  att.longFilename,  // Alternative 3
  att.shortFilename  // Alternative 4
];

const detectedName = possibleNames.find(n => typeof n === 'string' && n.trim());

// Return null - let schema.js handle the fallback
attachments.push({
  fileName: detectedName || null,
  data: content ? Buffer.from(content) : null,
  // ... other fields
});
```

**Benefits**:
- Library-specific code isolated to one file
- Easy to update when library behavior changes
- Clear separation of concerns

### 3. Single Responsibility

Each module does ONE thing well:

| Module | Responsibility | Lines |
|--------|---------------|-------|
| `errors.js` | Typed errors with context | 77 |
| `schema.js` | Data validation | 228 |
| `adapters/msgAdapter.js` | msgreader library isolation | 151 |
| `adapters/emlAdapter.js` | mailparser library isolation | ~100 |
| `parser.js` | Parse + validate in one step | 107 |
| `operations.js` | Small, focused DB/storage operations | 398 |
| `orchestrator.js` | Coordinates everything, NO business logic | 226 |
| `index.js` | Cloud Functions entry points | 120 |

**Benefits**:
- Each file fits in your head
- Easy to test in isolation
- Clear responsibilities

### 4. Errors Tell You Where and Why

**Philosophy**: Every error includes phase, filename, and relevant context.

**Example error output**:
```javascript
{
  name: "ValidationError",
  message: "Attachment 2 data is not a Buffer",
  phase: "validation",
  fileName: "voicemail.msg",
  fileHash: "abc123...",
  details: {
    field: "attachments[2].data",
    receivedValue: "undefined",
    expectedType: "Buffer"
  }
}
```

**Contrast with original**:
```
"Cannot read properties of undefined (reading 'toLowerCase')"
```

**Benefits**:
- Debugging is straightforward
- Know exactly where and what failed
- Context helps fix root cause

---

## File Structure

```
functions/
├── index.js              # Cloud Functions entry points
├── orchestrator.js       # Main coordination logic (no business logic)
├── parser.js             # Parse + validate entry point
├── schema.js             # Data validation (single source of truth)
├── operations.js         # Database/storage operations
├── constants.js          # Configuration constants
├── errors.js             # Typed error classes
└── adapters/
    ├── msgAdapter.js     # msgreader library isolation
    └── emlAdapter.js     # mailparser library isolation
```

---

## How It Fixes the Bug

### Step-by-Step: Processing Voicemail .msg File

#### 1. **Orchestrator downloads file** (`orchestrator.js:162`)
```javascript
const buffer = await ops.downloadFile(bucket, storagePath, fileHash);
```

#### 2. **Parser calls msgAdapter** (`parser.js:85`)
```javascript
const rawParsed = parseMsgBuffer(buffer, fileName);
```

#### 3. **msgAdapter handles quirks** (`msgAdapter.js:113-131`)
```javascript
// Try ALL possible filename fields
const possibleNames = [
  att.fileName,        // ❌ undefined in voicemail
  att.name,            // ❌ undefined
  att.displayName,     // ❌ undefined
  att.longFilename,    // ✅ Found! "audio.wav"
  att.shortFilename    // Not checked (already found)
];

const detectedName = possibleNames.find(n => typeof n === 'string' && n.trim());
// detectedName = "audio.wav"

// Return to schema for validation
return {
  fileName: detectedName || null,  // "audio.wav"
  data: content ? Buffer.from(content) : null,
  size: content?.length || 0,
  mimeType: att.mimeType || att.contentType || null
};
```

#### 4. **Schema validates and normalizes** (`schema.js:100-145`)
```javascript
function validateAttachment(raw, index, sourceFileName) {
  // fileName validation (lines 112-117)
  let fileName = raw.fileName;
  if (typeof fileName !== 'string' || fileName.trim() === '') {
    fileName = `attachment_${index}`;  // Fallback if needed
  } else {
    fileName = fileName.trim();
  }
  // fileName is NOW GUARANTEED to be a non-empty string

  // data validation (lines 120-134)
  let data;
  if (Buffer.isBuffer(raw.data)) {
    data = raw.data;
  } else if (raw.data instanceof Uint8Array) {
    data = Buffer.from(raw.data);
  } else if (raw.data == null) {
    data = Buffer.alloc(0);
  } else {
    throw new ValidationError(`Attachment ${index} data is not a Buffer`, {...});
  }
  // data is NOW GUARANTEED to be a Buffer

  return { fileName, data, size, mimeType };
}
```

#### 5. **Parser returns validated data** (`parser.js:97`)
```javascript
const validated = validateParsedEmail(rawParsed, fileName);
// After this point, ALL fields are guaranteed valid
return validated;
```

#### 6. **Downstream code safely uses data**
```javascript
// operations.js:101 - Can safely call getExtension
const ext = ops.getExtension(attachment.fileName);  // ✅ SAFE - fileName is guaranteed string

// operations.js:30-35 - getExtension implementation
function getExtension(fileName) {
  if (typeof fileName !== 'string') return 'bin';  // Defensive, but never hit
  const parts = fileName.split('.');
  if (parts.length < 2) return 'bin';
  return parts.pop().toLowerCase();  // ✅ SAFE - toLowerCase called on guaranteed string
}
```

### Why This Approach Works

| Aspect | Original | Refactored |
|--------|----------|------------|
| **Validation** | Scattered (`\|\| 'unnamed'` everywhere) | Single file (schema.js) |
| **Library isolation** | Mixed with business logic | Clean adapters |
| **Error context** | Generic "toLowerCase undefined" | "attachments[2].data is not a Buffer in voicemail.msg" |
| **Testing** | Hard (tightly coupled) | Easy (each module independent) |
| **Adding new format** | Modify multiple files | Add one adapter |
| **Downstream guarantees** | None (fields could be undefined) | Strong (all fields validated) |

---

## Comparison with Original

### Original Code (Buggy)

```javascript
// parsers.js (original)
async function parseMsgFile(buffer) {
  const reader = new MsgReader(buffer);
  const data = reader.getFileData();

  return {
    // ... email fields ...
    attachments: (data.attachments || []).map(att => {
      let content = att.content;
      if (!content && att.dataId !== undefined) {
        content = reader.getAttachment(att.dataId).content;
      }
      return {
        fileName: att.fileName || att.name || 'unnamed',  // ❌ Doesn't cover all cases
        data: content ? Buffer.from(content) : Buffer.alloc(0),
        size: content?.length || 0,
        mimeType: att.mimeType || 'application/octet-stream'
      };
    })
  };
}

// isEmailFile function (original)
function isEmailFile(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();  // ❌ Crashes if fileName undefined
  return ext === 'msg' || ext === 'eml';
}
```

**Problems**:
- Missed `att.displayName`, `att.longFilename`, `att.shortFilename` fields
- Didn't skip null/undefined attachment entries
- Called `.toLowerCase()` before validation
- No validation of data types
- Error messages unhelpful

### Refactored Code

```javascript
// adapters/msgAdapter.js (refactored)
function parseMsgBuffer(buffer, fileName) {
  // ... reader setup ...

  const attachments = [];
  const rawAttachments = Array.isArray(data.attachments) ? data.attachments : [];

  for (let i = 0; i < rawAttachments.length; i++) {
    const att = rawAttachments[i];

    // Skip null/undefined entries ✅
    if (!att) {
      console.warn(`[MsgAdapter] Attachment ${i} is null/undefined in ${fileName}`);
      continue;
    }

    // Skip non-object entries ✅
    if (typeof att !== 'object') {
      console.warn(`[MsgAdapter] Attachment ${i} is not an object in ${fileName}:`, typeof att);
      continue;
    }

    // Try ALL possible filename fields ✅
    const possibleNames = [
      att.fileName,
      att.name,
      att.displayName,
      att.longFilename,
      att.shortFilename
    ];

    const detectedName = possibleNames.find(n => typeof n === 'string' && n.trim());

    attachments.push({
      fileName: detectedName || null,  // ✅ Let validator handle fallback
      data: content ? Buffer.from(content) : null,
      size: content?.length || 0,
      mimeType: att.mimeType || att.contentType || null
    });
  }

  return { /* ... email fields ... */ attachments };
}

// schema.js (refactored)
function validateAttachment(raw, index, sourceFileName) {
  // Validate fileName ✅
  let fileName = raw.fileName;
  if (typeof fileName !== 'string' || fileName.trim() === '') {
    fileName = `attachment_${index}`;
  } else {
    fileName = fileName.trim();
  }
  // ✅ GUARANTEED: fileName is non-empty string

  // Validate data ✅
  let data;
  if (Buffer.isBuffer(raw.data)) {
    data = raw.data;
  } else if (raw.data instanceof Uint8Array) {
    data = Buffer.from(raw.data);
  } else if (raw.data == null) {
    data = Buffer.alloc(0);
  } else {
    throw new ValidationError(`Attachment ${index} data is not a Buffer`, {...});
  }
  // ✅ GUARANTEED: data is a Buffer

  return { fileName, data, size, mimeType };
}

// parser.js (refactored)
function isEmailFile(fileName) {
  const ext = getExtension(fileName);  // ✅ Helper handles validation
  return ext === 'msg' || ext === 'eml';
}

function getExtension(fileName) {
  if (typeof fileName !== 'string') return null;  // ✅ Safe check
  const parts = fileName.split('.');
  if (parts.length < 2) return null;
  return parts.pop().toLowerCase();  // ✅ Safe to call toLowerCase
}
```

**Improvements**:
- Tries ALL possible filename fields from msgreader
- Skips null/undefined attachment entries
- Validates before calling `.toLowerCase()`
- Strong type guarantees after validation
- Clear, contextual error messages
- Graceful degradation (skip bad attachments, don't crash)

---

## Testing & Debugging

### Testing Each Module Independently

```javascript
// Test validation in isolation
const { validateParsedEmail } = require('./schema');
const result = validateParsedEmail(mockData, 'test.msg');

// Test adapters in isolation
const { parseMsgBuffer } = require('./adapters/msgAdapter');
const raw = parseMsgBuffer(buffer, 'test.msg');

// Test operations in isolation (mock db/storage)
const ops = require('./operations');
await ops.createAttachmentEvidence(mockDb, params);
```

### Error Messages Now Tell You Exactly What's Wrong

**Before (Original)**:
```
"Cannot read properties of undefined (reading 'toLowerCase')"
```

**After (Refactored)**:
```
[Orchestrator] Failed abc123def456:
  error: "Attachment 2 data is not a Buffer"
  phase: "validation"
  details: {
    field: "attachments[2].data",
    receivedValue: "undefined",
    expectedType: "Buffer",
    fileName: "voicemail.msg"
  }
```

---

## Migration Notes

### Changes Made

1. **Replaced `functions/index.js`**:
   - Changed import: `require('./emailExtraction')` → `require('./orchestrator')`
   - Updated to expect `result.success` and `result.messageId`

2. **Added New Modules**:
   - `functions/errors.js` - Typed error classes
   - `functions/schema.js` - Data validation
   - `functions/parser.js` - Parse + validate entry point
   - `functions/orchestrator.js` - Main coordination logic
   - `functions/operations.js` - DB/storage operations
   - `functions/adapters/msgAdapter.js` - msgreader isolation
   - `functions/adapters/emlAdapter.js` - mailparser isolation

3. **Firestore Document Structure**: NO CHANGE
   - Same `evidence` collection fields
   - Same `emails` collection fields
   - No data migration needed

### Deployment

```bash
# Deploy Cloud Functions
firebase deploy --only functions:onEvidenceCreated

# If you also have the retry function:
firebase deploy --only functions:retryEmailExtraction
```

---

## Success Criteria

After deployment, test with the problematic voicemail .msg file:

**Expected Firestore Evidence Document** (fields in alphabetical order):
```javascript
{
  extractedAttachmentHashes: ["abc123..."],  // Populated
  extractedMessageId: "msg_xyz...",           // Populated
  hasEmailAttachments: false,                 // Changed from initial true
  parseError: null,                           // NOT toLowerCase error
  parseStatus: "completed",                   // NOT "failed"
  parsedAt: [timestamp],                      // Populated
  // ... other fields ...
}
```

**Expected Firestore Email Document**:
```javascript
{
  id: "msg_xyz...",
  subject: "New Voice Message from VANCOUVER BC (236) 998-7022",
  from: { name: null, email: "voicemail@example.com" },
  attachments: [
    {
      fileHash: "abc123...",
      fileName: "audio.wav",  // ✅ Extracted successfully
      size: 245678,
      mimeType: "audio/wav",
      isDuplicate: false
    }
  ],
  // ... other fields ...
}
```

---

## Key Achievement

**Root cause**: msgreader library quirks not handled comprehensively

**Solution**: "Validate Once at the Boundary" architecture
- Library quirks isolated in adapters
- Single validation point guarantees data shape
- Downstream code trusts validated data
- Graceful degradation instead of crashes

**Result**: Robust email extraction that handles real-world .msg file variations, including voicemail messages with unconventional attachment metadata.

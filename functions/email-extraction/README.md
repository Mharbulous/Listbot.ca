# Email Extraction - Refactored Architecture

A clean, maintainable implementation of email extraction for ListBot.

## Design Principles

1. **Validate Once at the Boundary** - All data validation happens in `schema.js`. After validation, downstream code trusts the data shape.

2. **Isolate Third-Party Libraries** - `msgreader` and `mailparser` quirks are contained in their respective adapters. The rest of the codebase never touches them directly.

3. **Single Responsibility** - Each module does one thing well:
   - `errors.js` - Typed errors with context
   - `schema.js` - Data validation
   - `adapters/*` - Library isolation
   - `parser.js` - Parse + validate in one step
   - `operations.js` - Small, focused database/storage operations
   - `orchestrator.js` - Coordinates everything, contains no business logic

4. **Errors Tell You Where and Why** - Every error includes phase, filename, and relevant context.

## File Structure

```
email-extraction/
├── index.js              # Cloud Functions entry points
├── main.js               # Module exports
├── orchestrator.js       # Main coordination logic
├── parser.js             # Parse + validate entry point
├── schema.js             # Data validation (single source of truth)
├── operations.js         # Database/storage operations
├── constants.js          # Configuration constants
├── errors.js             # Typed error classes
└── adapters/
    ├── msgAdapter.js     # msgreader library isolation
    └── emlAdapter.js     # mailparser library isolation
```

## Data Flow

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

## Error Handling

Errors are typed and include context:

```javascript
try {
  await processEmailFile(hash, data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Bad input data
    console.log(error.field);        // Which field failed
    console.log(error.receivedValue); // What we got
    console.log(error.expectedType);  // What we expected
  } else if (error instanceof ParseError) {
    // Parsing failed
    console.log(error.format);       // 'msg' or 'eml'
    console.log(error.parserError);  // Original library error
  } else if (error instanceof StorageError) {
    // Storage operation failed
    console.log(error.operation);    // 'download', 'upload', etc.
    console.log(error.path);         // File path
  }
  
  // All errors have:
  console.log(error.phase);     // Where it happened
  console.log(error.fileName);  // Source file
  console.log(error.fileHash);  // Document ID
}
```

## Debugging

When something fails, the error tells you exactly where:

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

## Testing

Each module can be tested independently:

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

## Comparison with Original

| Aspect | Original | Refactored |
|--------|----------|------------|
| Lines to understand full flow | 150+ scattered | 50 in orchestrator |
| Where validation happens | Scattered (`\|\| 'unnamed'` everywhere) | Single file (schema.js) |
| Library isolation | Mixed with business logic | Clean adapters |
| Error context | Generic "toLowerCase undefined" | "attachments[2].data is not a Buffer in voicemail.msg" |
| Testing | Hard (tightly coupled) | Easy (each module independent) |
| Adding new email format | Modify multiple files | Add one adapter |

## Migration

To migrate from the original implementation:

1. Replace `functions/` directory contents with `email-extraction/`
2. Update any imports:
   - `require('./parsers')` → `require('./parser')`
   - `require('./emailExtraction')` → `require('./orchestrator')`
3. Deploy: `firebase deploy --only functions`

The Firestore document structure remains identical, so no data migration needed.

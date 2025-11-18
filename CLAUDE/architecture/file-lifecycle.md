# Data Model & Naming Conventions

## File Lifecycle Terminology

The application distinguishes between related but distinct concepts in the file handling lifecycle. **Consistent use of this terminology is critical** throughout code, comments, UI text, and documentation.

### File Lifecycle

1. **Original** - The original real-world evidence

   - May be physical (paper receipt, printed invoice) or digital (email attachment, downloaded file)

2. **Source** - The digital file created or obtained by the user for upload to the application

   - Always digital: scanned PDF, smartphone photo, screenshot, downloaded file
   - This is what exists on the user's device/filesystem before upload

3. **Upload** - The digital file stored in Firebase Storage in the '../uploads' subfolder

   - Stored with hash-based deduplication (BLAKE3)
   - One **Upload** may be linked to multiple **Sources**

4. **Batesed** - **Upload** files that have been converted to PDF format, digitally bates stamped, and stored in Firebase Storage in the '../Batesed' subfolder

5. **Page** - **Batesed** files split into single page PDF files and stored in Firebase Storage in the '../Pages' subfolder for near duplicate analysis.

6. **Redacted** - **Batesed** files that have been redacted in preparation for production and saved in Firebase Storage in the '../Redacted' subfolder

7. **Production** - The final set of documents that have been approved for production and saved in Firebase storage in the '../Production' subfolder

   - Copied from a mix of **Batesed** files, **Redacted** files

8. **Storage** - Refers in general to all digital files saved in Firebase Storage, specifically: **Upload**, **Batesed**, **Page**, **Redacted**, and **Production**

   - Does not have its own subfolder.
   - Useful for describing functions, variables or constants that apply to all multiple file types; e.g. **Upload**, **Batesed**, **Page**, **Redacted**, and **Production**

9. **Document** - Refers in general to all versions of evidence, from **Original** to **Storage**, for situations where we are talking about all versions of the file. For example, 'Document Description' would be used to refer to text that is a description of the **Original** and of the **Source** and the **Storage** files in Firebase storage.

### Example Flow

```
Paper parking receipt (document, transaction date: Jan 15, 2025)
  ↓ User scans with phone
Scanned PDF on phone (source, file created: Jan 20, 2025)
  ↓ User uploads via app
PDF in Firebase Storage (file, uploaded: Jan 20, 2025, hash: abc123...)
```

### Usage Guidelines

**Variable Naming:**

```javascript
// Good - Clear and specific
const documentDate = receipt.transactionDate;
const sourceModifiedDate = fileObj.lastModified;
const fileUploadDate = metadata.uploadTimestamp;

// Avoid - Ambiguous
const date = ???; // Which date?
const fileDate = ???; // Source or upload date?
```

**UI/UX Text:**

- "Document date" or "Transaction date" for the business event date
- "Scanned on" or "Created on" for source file creation
- "Uploaded on" for when file entered system

**Database Fields:**

```javascript
{
  documentDate: '2025-01-15',      // Business transaction date
  sourceCreatedDate: '2025-01-20', // Source file timestamp
  uploadedAt: '2025-01-20T14:30:00Z' // Firebase upload time
}
```

**Code Comments:**

```javascript
// Extract document date from OCR text (not source file metadata)
const documentDate = extractDateFromContent(ocrText);

// Use source file's modified date as fallback
const fallbackDate = sourceFile.lastModifiedDate;
```

## Upload Workflow Terminology

The application uses a two-step upload process where users first queue files and then explicitly start the upload operation. **Consistent use of compound terminology is critical** to avoid ambiguity with the **Upload** file lifecycle stage.

### Upload Workflow Terms

1. **Queue** (verb: "to queue") - The action of selecting and staging **Source** files for processing

   - Files are analyzed, deduplicated, and validated locally
   - Files remain on the user's device/filesystem
   - Users can review, add, or remove files before uploading
   - No data is transferred to Firebase Storage
   - UI: "Add to Queue", "Queue Files"
   - Code: `queueFiles()`, `addToQueue()`

2. **Upload queue** or **queue** (noun) - The collection of **Source** files staged and ready for upload

   - Contains files awaiting the upload process
   - UI: "3 files in queue", "Queue is empty"
   - Code: `uploadQueue`, `queuedFiles`, `queueStatus`

3. **Upload process** or **upload operation** (noun) - The process of transferring queued files to Firebase Storage

   - Initiated by explicit user action (e.g., "Start Upload" button)
   - Transfers file content and metadata to Firebase Storage
   - Creates Firestore documents and Storage objects
   - Transitions files from **Source** stage to **Upload** stage
   - UI: "Start Upload", "Upload in progress", "Upload complete"
   - Code: `uploadProcess`, `uploadStatus`, `uploadProgress`

4. **Uploading** (verb, present continuous) - Actively performing the upload operation

   - UI: "Uploading files...", "Currently uploading"
   - Code: `isUploading`, `startUploading()`

### Lifecycle Stage vs. Workflow Action

To distinguish between the **Upload** file lifecycle stage and upload workflow actions, always use compound terms for workflow references:

**Lifecycle Stage (File at rest in Storage):**
- **Upload file** or **Upload files** - Files stored in Firebase Storage '../uploads' subfolder
- **Upload stage** - The lifecycle stage where files exist in Firebase Storage
- Example: "The Upload file is deduplicated using BLAKE3 hash"

**Workflow Actions (Process of moving files):**
- **Upload queue** - Files staged for upload
- **Upload process** - The operation transferring files
- **Uploading** - Active file transfer
- Example: "The upload process transfers queued files to Storage"

### Usage Examples

**Variable Naming:**

```javascript
// Lifecycle stage references (files in Storage)
const uploadFile = doc.data(); // File at Upload stage
const uploadFilePath = 'firms/123/uploads/abc123.pdf'; // Path to Upload file
const uploadFileHash = 'abc123...'; // Upload file's BLAKE3 hash

// Workflow action references (process/operation)
const uploadQueue = []; // Files queued for uploading
const queuedFiles = await getQueuedFiles(); // Files in the queue
const uploadProcess = { status: 'active', progress: 50 }; // The upload operation
const isUploading = ref(false); // Currently performing upload operation

// Functions
function addToQueue(files) { ... } // Add files to upload queue
function startUploadProcess() { ... } // Begin uploading queued files
function clearQueue() { ... } // Empty the upload queue
```

**UI/UX Text:**

```javascript
// Lifecycle stage
"Upload file location: ../uploads/abc123.pdf"
"View Upload files in Storage"
"Upload stage: Files are deduplicated"

// Workflow actions
"Add to Queue" // Button
"3 files in queue" // Status
"Start Upload" // Button
"Upload in progress..." // Status
"Uploading 2 of 10 files" // Progress
"Upload complete" // Success
"Clear queue" // Action
```

**Code Comments:**

```javascript
// Add source files to upload queue for analysis
function addToQueue(files) { ... }

// Start upload process: transfer queued files to Storage (Source → Upload stage)
async function startUploadProcess(queuedFiles) { ... }

// Retrieve Upload file metadata from Firestore
async function getUploadFile(fileHash) { ... }
```

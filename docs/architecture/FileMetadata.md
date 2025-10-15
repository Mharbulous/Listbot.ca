# File Metadata Data Structures

Last Updated: 2025-09-07

## Critical Concept: Original Files vs Storage Files

This application preserves complete legal metadata about **original files** while implementing storage deduplication. Understanding this distinction is essential:

- **Original Files**: Multiple files on users' computers - may be identical content with different names, locations, timestamps
- **Storage Files**: Single deduplicated copy in Firebase Storage, named by SHA-256 hash

**Example**: Three clients upload the same PDF contract:

- Client A: `Contract_Final.pdf` modified Jan 1, 2025
- Client B: `Agreement_v2.PDF` modified Jan 15, 2025
- Client C: `contract.pdf` modified Feb 1, 2025

Result: ONE file in storage (`abc123...def.pdf`), THREE metadata records preserving each original context.

## Matter Organization (Current Testing Phase)

**Current Implementation**: All collections are hardcoded to use `/matters/general/` as a testing ground for feature development.

**Future Implementation**: The 'general' matter will become the default matter when no specific matter is selected, and the system will support dynamic matter IDs for organizing files by legal matter, client, or project.

## The Three Collections

### 1. originalMetadata Subcollection

**Path**: `/teams/{teamId}/matters/{matterId}/evidence/{fileHash}/originalMetadata/{metadataHash}`
**Current**: `/teams/{teamId}/matters/general/evidence/{fileHash}/originalMetadata/{metadataHash}`

**Purpose**: Preserves metadata about original desktop files as a subcollection under evidence documents

**Document ID**: `metadataHash` - SHA-256 hash of `originalName|lastModified|fileHash`

**Fields**:

```javascript
{
  originalName: string,      // Exact filename with ORIGINAL CASE PRESERVED (e.g., "Contract.PDF")
  lastModified: number,       // Original file's timestamp (milliseconds since epoch)
  fileHash: string,          // SHA-256 of file content (64 hex chars)
  metadataHash: string,      // SHA-256 of metadata string (64 hex chars)
  folderPaths: string        // Pipe-delimited paths (e.g., "Documents/2023|Archive/Legal")
}
```

**Important**: The `originalName` field is the ONLY place where the original file extension case is preserved. Everywhere else in the codebase, file extensions are standardized to lowercase.

**Key Files Using This**:

- `src/services/StorageService.js` - Creates records during upload
- `src/components/FileExplorer.vue` - Displays original names and paths
- `src/workers/hashWorker.js` - Generates metadata hashes
- `src/features/upload/composables/useFileMetadata.js` - Manages metadata records

### 2. evidence Collection

**Path**: `/teams/{teamId}/matters/{matterId}/evidence/{fileHash}`
**Current**: `/teams/{teamId}/matters/general/evidence/{fileHash}`

**Purpose**: Links deduplicated storage files to their display metadata

**Document ID**: `fileHash` - SHA-256 hash of file content (provides automatic deduplication)

**Fields**:

```javascript
{
  // Document ID = fileHash (SHA-256, 64 chars) - NOT A STORED FIELD

  displayCopy: string,       // metadataHash pointing to originalMetadata record
  fileSize: number,          // File size in bytes
  processingStage: string,   // Upload/processing status
  isProcessed: boolean,      // Whether file has been processed
  hasAllPages: boolean|null, // Page completeness check
  tagCount: number,          // Count of tags (for performance)
  autoApprovedCount: number, // Count of auto-approved tags
  reviewRequiredCount: number, // Count of tags needing review
  updatedAt: timestamp,      // Last modified time
  tags: subcollection        // Tag documents for categorization
}
```

**Key Differences from Old Schema**:

- **No `storageRef` field**: File hash is now the document ID itself
- **Simplified `displayCopy`**: Changed from object to simple string (metadataHash)
- **Automatic Deduplication**: Using fileHash as document ID prevents duplicate evidence records
- **Tag Counters**: Added for performance optimization
- **Access file hash**: Use `evidence.id` (document ID) instead of `evidence.storageRef.fileHash`

**Key Files Using This**:

- `src/services/EvidenceService.js` - Creates and queries evidence records
- `src/components/DocumentList.vue` - Displays evidence with metadata
- `src/stores/documentsStore.js` - Manages evidence state
- `src/features/organizer/services/evidenceService.js` - Core evidence operations
- `src/features/organizer/stores/organizerCore.js` - Fetches displayName from originalMetadata

### 3. uploadEvents Collection

**Path**: `/teams/{teamId}/matters/{matterId}/uploadEvents/{eventId}`  
**Current**: `/teams/{teamId}/matters/general/uploadEvents/{eventId}`

**Purpose**: Audit trail of every upload attempt (successful or duplicate)

**Document ID**: Auto-generated Firestore ID

**Fields**:

```javascript
{
  eventType: string,         // 'upload_success' | 'upload_duplicate' | 'upload_error' | 'upload_interrupted'
  timestamp: timestamp,       // When upload was attempted
  fileName: string,          // Original filename from upload attempt
  fileHash: string,          // SHA-256 of file content
  metadataHash: string,      // SHA-256 of metadata
  teamId: string,            // Team context
  userId: string,            // User who uploaded
  errorMessage: string       // Optional - only for upload_error events
}
```

**Key Files Using This**:

- `src/services/AuditService.js` - Creates event records
- `src/components/UploadHistory.vue` - Shows upload activity
- `src/utils/powerOutageDetection.js` - Detects interrupted uploads
- `src/features/upload/composables/useUploadLogger.js` - Logs upload events

## How They Work Together

```
User uploads file →
  ↓
Calculate fileHash and metadataHash →
  ↓
Create uploadEvent (always) →
  ↓
Check if fileHash exists in Storage →
  ├─ No: Upload file to Storage (with lowercase extension)
  └─ Yes: Skip upload (file already exists)
  ↓
Create evidence record using fileHash as document ID →
  (Automatic deduplication - identical files = same document)
  ↓
Create originalMetadata record as subcollection under evidence document →
  Path: /evidence/{fileHash}/originalMetadata/{metadataHash}
```

## File Extension Handling

**Preservation**: Original file extension case is preserved ONLY in `originalMetadata.originalName`

**Standardization**: Everywhere else uses lowercase:

- Firebase Storage paths: `{fileHash}.pdf` (always lowercase)
- UI display logic: Converts to lowercase for consistency
- File type detection: Uses lowercase for comparisons

**Example**:

- User uploads: `Report.PDF`
- originalMetadata: `{ originalName: "Report.PDF" }` (preserved)
- Firebase Storage: `abc123...def.pdf` (lowercase)
- Evidence: Document ID is the fileHash (no extension field)

## Deduplication Logic

**Storage Level (Firebase Storage)**: Files with identical content (same `fileHash`) are stored once

**Evidence Level**: Files with identical content get ONE evidence document
- Document ID = fileHash (Firestore enforces uniqueness)
- Automatic deduplication without manual checking
- setDoc() safely overwrites if the same file is uploaded again

**Metadata Level (originalMetadata Subcollection)**: Metadata combinations (same `metadataHash`) are stored once as subcollection documents under the evidence document
- Multiple originalMetadata documents can exist under one evidence document
- Each represents a different upload context (different name, timestamp, or path)
- Path: `/evidence/{fileHash}/originalMetadata/{metadataHash}`

**Result**: Triple-layer deduplication - efficient storage while preserving all original contexts through the subcollection structure

## Folder Paths System

The `folderPaths` field captures folder structure from webkitdirectory uploads:

- **Format**: Pipe-delimited paths using forward slashes
- **Examples**:
  - Single: `"Documents/2023/Contracts"`
  - Multiple: `"Documents/2023|Archive/Legal|Backup/2023"`
  - Root: `""` (empty string)

**Path Accumulation**: When the same file is uploaded from different folders, paths are combined using the pipe delimiter to preserve all contexts.

## Quick Reference for Developers

**Adding new metadata fields?**

- Add to appropriate collection schema above
- Update `StorageService.js` to populate the field
- Update relevant display components to use the field

**Need to find where files are processed?**

- Upload logic: `src/services/StorageService.js`, `src/features/upload/FileUpload.vue`
- Hash calculation: `src/workers/hashWorker.js`
- Metadata management: `src/features/upload/composables/useFileMetadata.js`
- Evidence management: `src/features/organizer/services/evidenceService.js`
- Display components: `src/features/organizer/stores/organizerCore.js`, `DocumentList.vue`

**Understanding the deduplication?**

- Same file content = one storage file (named by fileHash)
- Same file content = ONE evidence document (fileHash as document ID)
- Same metadata = one originalMetadata subcollection document under evidence (identified by metadataHash)
- Multiple metadata variants = multiple subcollection documents under same evidence document
- Every upload = new uploadEvent (for audit trail)

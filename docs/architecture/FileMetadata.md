# File Metadata Data Structures

Last Updated: 2025-10-17

## Critical Concept: Original Files vs Storage Files

This application preserves complete legal metadata about **original files** while implementing storage deduplication. Understanding this distinction is essential:

- **Original Files**: Multiple files on users' computers - may be identical content with different names, locations, timestamps
- **Storage Files**: Single deduplicated copy in Firebase Storage, named by SHA-256 hash

**Example**: Three clients upload the same PDF contract:

- Client A: `Contract_Final.pdf` modified Jan 1, 2025
- Client B: `Agreement_v2.PDF` modified Jan 15, 2025
- Client C: `contract.pdf` modified Feb 1, 2025

Result: ONE file in storage (`abc123...def.pdf`), THREE metadata records preserving each original context.

## UI Metadata Presentation

The application presents metadata to users in three distinct categories, reflecting the source and nature of each piece of information:

### Source File

**Definition**: Intrinsic properties of the original file as it existed on the user's computer.

**Displayed Fields**:

- **Name**: Dropdown showing available metadata variants (e.g., "Report.PDF", "report.pdf (2)"). User can select which variant to display. Shows earlier copy notification when a file with an earlier modification date already exists in storage.
- **Date Modified (Source File)**: File system modification timestamp from `sourceMetadata.lastModified`
- **Size**: File size in bytes from `evidence.fileSize`
- **MIME Type**: Content type from Firebase Storage metadata.contentType (not from sourceMetadata)

**Data Sources**: Combines data from `sourceMetadata` subcollection, `evidence` collection, and Firebase Storage metadata.

**Purpose**: Shows users the file's original properties for identification and context.

#### Metadata Variant Selection

When the same file (identified by fileHash) has been uploaded with different metadata combinations, users can select which variant to display:

**UI Implementation**:

- **Dropdown Menu**: Appears when multiple sourceMetadata records exist for a single evidence document
- **Variant Identification**: Shows original filename with duplicate indicators (e.g., "Report.PDF", "report.pdf (2)")
- **Earlier Copy Notification**: Displays a notification message when a file with an earlier modification date already exists in storage
- **Persistence**: Selected variant is stored in `evidence.displayCopy` field

**Data Structure**:

- Multiple sourceMetadata documents share the same parent evidence document (identified by fileHash)
- Each sourceMetadata document has a unique metadataHash (generated from `sourceFileName|lastModified|fileHash`)
- The `displayCopy` field in the evidence document points to the currently selected metadataHash

**Use Case Example**:

1. User uploads `Contract.PDF` modified Jan 1, 2025
2. Later, uploads identical file as `contract.pdf` modified Feb 1, 2025
3. System creates ONE evidence document (same fileHash)
4. System creates TWO sourceMetadata documents (different metadataHash values)
5. User sees dropdown with both variants and can switch between them
6. System shows notification that an earlier copy (Jan 1) already exists

### Embedded Metadata

**Definition**: Data extracted from within the file's content, following format-specific standards.

**Implementation Status**: **FULLY IMPLEMENTED FOR PDF FILES** using client-side extraction. Other file formats planned for future implementation.

#### PDF Embedded Metadata (Implemented)

**Extraction Architecture**:

- **Library**: pdfjs-dist v5.4.296 with Vite-configured Web Worker
- **Trigger**: Automatic extraction when viewing PDF files in ViewDocument.vue
- **Performance**: ~100-300ms (metadata only, no page rendering)
- **Storage**: Client-side only (real-time extraction, not persisted to Firestore)
- **Bandwidth**: Minimal - only reads PDF header via Firebase Storage range requests

**Extracted Fields**:

##### Document Information Dictionary (PDF Standard - 8 fields):

- **Title**: Document title from PDF metadata
- **Author**: Document author
- **Subject**: Document subject/description
- **Keywords**: Document keywords for indexing
- **Creator**: Application that created the original document
- **Producer**: PDF generation software/library
- **CreationDate**: Original creation timestamp with timezone (e.g., "Apr 7, 2025, 04:35:14 PM PDT (-07:00)")
- **ModDate**: Last modification timestamp with timezone

##### XMP Metadata (Forensically Valuable - 11 fields):

- **dc:title**: Dublin Core title metadata
- **dc:creator**: Dublin Core creator information
- **dc:description**: Document description from XMP
- **xmp:CreateDate**: XMP creation timestamp
- **xmp:ModifyDate**: XMP modification timestamp
- **xmp:CreatorTool**: Tool used to create the document
- **pdf:Producer**: PDF producer from XMP namespace
- **xmpMM:DocumentID**: Unique document identifier (tracks version lineage)
- **xmpMM:InstanceID**: Unique instance identifier (tracks specific version)
- **xmpMM:History**: **Complete audit trail** - array of all editing operations, timestamps, and software used

**Forensic Significance** (per MetadataSpecs.md):

- **Time zone offsets** reveal editing location (e.g., -07:00 = Pacific Daylight Time)
- **DocumentID/InstanceID** track version lineage across document edits
- **xmpMM:History** provides complete audit trail of all modifications
- **Creator/Producer mismatch** reveals document conversion workflows
- **Date discrepancies** between CreationDate and ModDate indicate post-creation editing

**Date Format Handling**:

- **PDF Format**: `D:YYYYMMDDHHmmSSOHH'mm'` (e.g., `D:20250407163514-07'00'`)
- **Parsed to**: ISO 8601 with timezone preservation
- **Displayed**: Localized format with timezone indicator
- **Forensic Value**: Timezone reveals physical location during document creation/editing

#### Other File Formats (Future Implementation)

**Planned Expansion**:

- **Images** (JPG/PNG/TIFF): EXIF data, GPS coordinates, camera information, device serial numbers
- **Office Docs** (DOC/DOCX/XLS/XLSX): Author, Company, Revision history, Track Changes, edit times
- **Media Files** (MP3/MP4/WAV): Recording timestamps, device information, GPS tracks, codec details

**Data Sources**:

- **PDF (Current)**: Client-side extraction via pdfjs-dist (not persisted)
- **Future**: May be stored in `evidence` collection fields or dedicated subcollections

**Technical Reference**: See `docs/architecture/MetadataSpecs.md` for detailed specifications of embedded metadata standards for 17+ file types.

**Purpose**: Provides forensically valuable metadata embedded within files for authenticity verification and chain of custody.

### Cloud

**Definition**: System-level information about how and when the file is stored in the application's infrastructure.

**Displayed Fields**:

- **Date Uploaded**: Firebase Storage upload timestamp from storage metadata `timeCreated`
- **File Hash**: SHA-256 hash of file content, used as both `evidence` document ID and storage filename

**Data Sources**: Firebase Storage metadata API and `evidence` document ID.

**Purpose**: Provides audit trail and deduplication information for system management.

### Data Source Mapping

```
UI Category          → Data Source
────────────────────────────────────────────────────────────
Source File:
  Name               → sourceMetadata.sourceFileName (with variant selection dropdown)
  Date Modified      → sourceMetadata.lastModified
  Size               → evidence.fileSize
  MIME Type          → Firebase Storage metadata.contentType

Embedded Metadata (PDF - Implemented):
  Document Info Dict → Client-side: pdfjs-dist extraction from Firebase Storage
  XMP Metadata       → Client-side: pdfjs-dist extraction from Firebase Storage
  Storage            → Not persisted (real-time extraction only)
  Display            → ViewDocument.vue "Embedded Metadata" section

Embedded Metadata (Other Formats - Future):
  Images             → EXIF, XMP, GPS (not yet implemented)
  Office Docs        → Author, Revision history (not yet implemented)
  Media Files        → Device info, GPS tracks (not yet implemented)
  Storage            → TBD: evidence collection fields or subcollections
                       (See MetadataSpecs.md for extraction targets)

Cloud:
  Date Uploaded      → Firebase Storage metadata.timeCreated
  File Hash          → evidence.id (document ID)
```

**Implementation Reference**: See `src/features/organizer/views/ViewDocument.vue` for current UI implementation of these metadata categories.

### PDF Metadata Extraction Implementation

**Status**: Fully implemented and deployed for PDF files.

**Extraction Composable**: `src/features/organizer/composables/usePdfMetadata.js`

- Extracts Document Information Dictionary (8 fields: Title, Author, Subject, Keywords, Creator, Producer, CreationDate, ModDate)
- Extracts XMP metadata (11 fields including xmpMM:DocumentID, xmpMM:InstanceID, xmpMM:History)
- Formats PDF dates with timezone preservation (converts `D:YYYYMMDDHHmmSSOHH'mm'` to ISO 8601)
- Handles extraction errors gracefully with user-friendly error messages
- Returns structured metadata object with `info` and `xmp` properties

**Display Component**: `src/features/organizer/views/ViewDocument.vue`

- **Location**: "Embedded Metadata" section (template lines 95-191)
- **Conditional Rendering**: Only displays for PDF files (checks MIME type and file extension)
- **Loading States**: Shows "Loading PDF metadata..." during extraction
- **Error Handling**: Displays error messages if extraction fails
- **Two Subsections**:
  - Document Information Dictionary fields (Title, Author, Creator, Producer, dates, etc.)
  - XMP Metadata subsection (DocumentID, InstanceID, Revision History)
- **Revision History Display**: Shows xmpMM:History as formatted JSON in scrollable container when available

**Worker Configuration**: `src/config/pdfWorker.js`

- Configures pdfjs-dist Web Worker using Vite's `new URL()` with `import.meta.url`
- Enables non-blocking PDF processing (prevents UI freezing during extraction)
- Worker path resolves automatically from node_modules (no CDN dependency)

**Extraction Workflow**:

1. User navigates to ViewDocument.vue with PDF file
2. Component loads evidence and sourceMetadata from Firestore
3. `fetchStorageMetadata()` detects PDF file by extension
4. Calls `extractMetadata()` from usePdfMetadata composable
5. Composable fetches PDF from Firebase Storage (minimal bandwidth - header only)
6. pdfjs-dist extracts metadata using Web Worker (non-blocking)
7. Metadata parsed and formatted (dates converted, timezone preserved)
8. Template displays extracted metadata in "Embedded Metadata" section

**Key Characteristics**:

- **Client-side only**: Metadata is NOT persisted to Firestore (extracted on-demand each view)
- **Real-time extraction**: Runs automatically when viewing PDF files
- **Performance optimized**: Only reads PDF header (typically <100KB), not entire file
- **Forensically valuable**: Preserves timezone offsets, document IDs, and complete audit trails
- **Bandwidth efficient**: Uses Firebase Storage range requests for partial file download
- **No server costs**: All processing happens in user's browser

**Dependencies**:

- `pdfjs-dist`: v5.4.296 (Mozilla PDF.js library)
- Firebase Storage: For file retrieval
- Vite: For Web Worker configuration and URL resolution

## Matter Organization (Current Testing Phase)

**Current Implementation**: All collections are hardcoded to use `/matters/general/` as a testing ground for feature development.

**Future Implementation**: The 'general' matter will become the default matter when no specific matter is selected, and the system will support dynamic matter IDs for organizing files by legal matter, client, or project.

## The Three Collections

### 1. sourceMetadata Subcollection

**Path**: `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}/sourceMetadata/{metadataHash}`
**Current**: `/firms/{firmId}/matters/general/evidence/{fileHash}/sourceMetadata/{metadataHash}`

**Purpose**: Preserves metadata about original desktop files as a subcollection under evidence documents

**Document ID**: `metadataHash` - SHA-256 hash of `originalName|lastModified|fileHash`

**Fields**:

```javascript
{
  sourceFileName: string,      // Exact filename with ORIGINAL CASE PRESERVED (e.g., "Contract.PDF")
  lastModified: Timestamp,      // Original file's timestamp (Firestore Timestamp)
  fileHash: string,            // SHA-256 of file content (64 hex chars)
  sourceFolderPath: string,    // Pipe-delimited paths (e.g., "Documents/2023|Archive/Legal")
  sourceFileType: string       // MIME type from file.type property (e.g., "application/pdf")
}
```

**Important**: The `sourceFileName` field is the ONLY place where the original file extension case is preserved. Everywhere else in the codebase, file extensions are standardized to lowercase.

**Metadata Capture Implementation**: For detailed information about how original file metadata is captured, processed, and saved to this collection—including the smart folder path pattern recognition algorithm and upload workflow—see **[File Upload System Documentation - Metadata Management](../uploading.md#metadata-management)**.

### 2. evidence Collection

**Path**: `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}`
**Current**: `/firms/{firmId}/matters/general/evidence/{fileHash}`

**Purpose**: Links deduplicated storage files to their display metadata

**Document ID**: `fileHash` - SHA-256 hash of file content (provides automatic deduplication)

**Fields**:

```javascript
{
  // Document ID = fileHash (SHA-256, 64 chars) - NOT A STORED FIELD

  displayCopy: string,       // metadataHash pointing to sourceMetadata record
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
- **Updated sourceMetadata field names**: `originalName` → `sourceFileName`, `folderPaths` → `sourceFolderPath`
- **Added MIME type capture**: New `sourceFileType` field stores file MIME type

**Key Implementation**:

- `src/features/organizer/services/evidenceService.js` - Core evidence operations
- `src/features/organizer/stores/organizerCore.js` - Fetches displayName from sourceMetadata

### 3. uploadEvents Collection

**Path**: `/firms/{firmId}/matters/{matterId}/uploadEvents/{eventId}`  
**Current**: `/firms/{firmId}/matters/general/uploadEvents/{eventId}`

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
  firmId: string,            // Firm context
  userId: string,            // User who uploaded
  errorMessage: string       // Optional - only for upload_error events
}
```

**Key Implementation**:

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
Create sourceMetadata record as subcollection under evidence document →
  Path: /evidence/{fileHash}/sourceMetadata/{metadataHash}
```

## File Extension Handling

**Preservation**: Original file extension case is preserved ONLY in `sourceMetadata.sourceFileName`

**Standardization**: Everywhere else uses lowercase:

- Firebase Storage paths: `{fileHash}.pdf` (always lowercase)
- UI display logic: Converts to lowercase for consistency
- File type detection: Uses lowercase for comparisons

**Example**:

- User uploads: `Report.PDF`
- sourceMetadata: `{ sourceFileName: "Report.PDF" }` (preserved)
- Firebase Storage: `abc123...def.pdf` (lowercase)
- Evidence: Document ID is the fileHash (no extension field)

## Deduplication Logic

**Storage Level (Firebase Storage)**: Files with identical content (same `fileHash`) are stored once

**Evidence Level**: Files with identical content get ONE evidence document

- Document ID = fileHash (Firestore enforces uniqueness)
- Automatic deduplication without manual checking
- setDoc() safely overwrites if the same file is uploaded again

**Metadata Level (sourceMetadata Subcollection)**: Metadata combinations (same `metadataHash`) are stored once as subcollection documents under the evidence document

- Multiple sourceMetadata documents can exist under one evidence document
- Each represents a different upload context (different name, timestamp, or path)
- Path: `/evidence/{fileHash}/sourceMetadata/{metadataHash}`
- Note: The `metadataHash` is generated from `sourceFileName|lastModified|fileHash`

**Result**: Triple-layer deduplication - efficient storage while preserving all original contexts through the subcollection structure

## Folder Paths System

The `sourceFolderPath` field captures folder structure from webkitdirectory uploads:

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

**Working with PDF metadata?**

- **Extraction**: See `src/features/organizer/composables/usePdfMetadata.js`
- **Display**: See `src/features/organizer/views/ViewDocument.vue` (Embedded Metadata section)
- **Worker Config**: See `src/config/pdfWorker.js`
- **Adding new PDF fields**: Update `parseXmpMetadata()` or `processedInfo` in usePdfMetadata.js
- **Note**: PDF metadata is client-side only (not persisted to Firestore)

**Need to find where files are processed?**

- **Upload workflow and implementation details**: See **[uploading.md](../uploading.md)** for complete upload process flow, smart folder path pattern recognition, and metadata capture algorithms
- **Code locations**:
  - Upload logic: `src/features/upload/FileUpload.vue`
  - Hash calculation: `src/workers/fileHashWorker.js`
  - Metadata management: `src/features/upload/composables/useFileMetadata.js`
  - Evidence management: `src/features/organizer/services/evidenceService.js`
  - Display components: `src/features/organizer/stores/organizerCore.js`, `src/features/organizer/views/ViewDocument.vue`
  - **PDF metadata extraction**: `src/features/organizer/composables/usePdfMetadata.js`
  - **PDF metadata display**: `src/features/organizer/views/ViewDocument.vue`

**Understanding the deduplication?**

- Same file content = one storage file (named by fileHash)
- Same file content = ONE evidence document (fileHash as document ID)
- Same metadata = one sourceMetadata subcollection document under evidence (identified by metadataHash from `sourceFileName|lastModified|fileHash`)
- Multiple metadata variants = multiple subcollection documents under same evidence document
- Every upload = new uploadEvent (for audit trail)

# Firestore Data Structure Design (KISS Edition)

**Reconciled up to**: 2025-11-18
**Last Updated**: 2025-08-31

## Overview

This document serves as the **central hub** for our Firestore data structure documentation. Following the KISS principle, we've designed a simple, scalable data structure for our multi-tenant firm-based architecture supporting Multi-App SSO.

**Key Design Decisions:**

- Firms typically have 3-10 members (max 100)
- All apps share the same role-based permissions
- No denormalization needed for queries
- No audit trails in MVP
- Flat structure for simplicity

## Key Files

These source files implement the core data structures described in this document:

**Data Access Services:**
- `src/services/matterService.js` - Matters collection CRUD operations
- `src/services/uploadService.js` - Evidence queries with embedded metadata optimization
- `src/features/organizer/services/evidenceService.js` - Evidence document creation and management
- `src/features/organizer/services/categoryService.js` - Category management
- `src/features/organizer/services/tagSubcollectionService.js` - Tag subcollection operations

**Authentication & Firm Management:**
- `src/core/stores/auth/authStore.js` - Auth state machine
- `src/core/stores/auth/authFirmSetup.js` - Solo Firm creation and firm management

**Firebase Integration:**
- `src/services/firebase.js` - Firebase initialization
- `src/features/organizer/services/fileProcessingService.js` - Firebase Storage file access

## Documentation Organization

This data structure documentation references several specialized documents. **Note**: Not all referenced documents currently exist - this represents an aspirational documentation structure.

### 📚 Core Documentation Components

#### Core Data Architecture Documentation

The Firestore collection schemas are documented in three specialized files:

**[Solo Firm Matters](./architecture/SoloFirmMatters.md)** ⚠️ *Not yet created*
Core architecture including:

- Users and Firms collections
- Matters collection (client names stored directly, no separate Clients collection)
- Custom claims and query patterns
- Basic required Firestore indexes

**[File Metadata](./architecture/FileMetadata.md)** ⚠️ *Not yet created*
File management systems including:

- File metadata and folder path systems
- Upload event tracking and deduplication architecture
- File processing and storage optimization

**[Categories and Tags](./architecture/CategoryTags.md)** ⚠️ *Not yet created*
Document organization systems including:

- Hybrid tag storage: subcollection (full metadata) + embedded map (DocumentTable performance)
- Categories collection with soft-delete patterns
- Tag management and color theming
- Robust query fallback strategies

#### [Firebase Storage Structure](./architecture/firebase-storage.md) ⚠️ *Not yet created*

Firebase Storage organization and file management:

- File storage paths and deduplication
- Processing folders (OCR, split, merged files)
- Storage path examples and access control
- Deduplication examples and optimization features

#### [Security Rules and Access Control](./Security/firestore-security-rules.md) ✅ *Exists*

Comprehensive security implementation:

- Firestore and Firebase Storage security rules
- Custom claims structure and role-based access control
- Access control matrix and data isolation guarantees
- Security testing and monitoring guidelines

#### [Firm Workflows and User Management](./architecture/firm-workflows.md) ⚠️ *Not yet created*

User and firm management processes:

- Solo user to firm workflow and new user registration
- Firm invitation process and data migration
- Firm management workflows (adding/removing members)
- Firm merger scenarios and invitation management

## Architecture Summary

### Solo User Design

- New users automatically get a firm where `firmId === userId`
- Creates a "firm of one" eliminating special cases
- Easy upgrade path to collaborative firms
- Perfect deduplication works consistently

### Firm-Based Multi-Tenancy

- All data scoped by firm ID for perfect isolation
- Embedded members (optimal for 3-10 users)
- Simple pending invitations system
- Consistent security model across all apps

### File Management

- Content-based deduplication using BLAKE3 hashes
- Multiple metadata records for same file content
- Smart folder path system with pattern recognition
- Future-ready processing workflow folders

### Security Model

- Firm-based access control with custom claims
- Simple, consistent security rules
- Solo users have `firmId === userId`
- Role-based permissions (admin/member)

## Collection Structure

### Complete Collection Paths

```
/users/{userId}                                                    // User preferences
/firms/{firmId}                                                    // Firm info with embedded members
/firms/{firmId}/matters/{matterId}                                 // Matter/case records
/firms/{firmId}/matters/{matterId}/evidence/{fileHash}             // File metadata (PRIMARY collection)
/firms/{firmId}/matters/{matterId}/evidence/{fileHash}/sourceMetadata/{metadataHash}  // Source file variants
/firms/{firmId}/matters/{matterId}/categories/{categoryId}         // Document organization categories
/firms/{firmId}/emails/{messageId}                                 // Individual parsed email messages
```

### Email Messages Collection (NEW)

**Path**: `/firms/{firmId}/emails/{messageId}`

Individual email messages parsed from .msg/.eml files during email extraction.

**Purpose**:
- Store parsed Native and Quoted messages separately for threading
- Enable full-text search across email content
- Support modification detection (compare Quoted vs original Native)

**Document ID**: Auto-generated (not hash-based) to allow duplicate quoted content across multiple .msg files

**Key Fields**:
- `isNative`: boolean - Native (reliable) vs Quoted (potentially edited)
- `extractedFromFile`: string - Hash of original .msg file
- `attachments`: array - References to attachment hashes
- `bodyText`, `bodyHtml`: Email content
- `from`, `to`, `cc`, `bcc`: Email addresses
- `subject`, `date`: Message metadata

**See**: `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md` for complete schema

**Integration**:
- Stage 1c (Email Extraction) populates this collection
- Stage 3 (Email Threading) consumes this data

### Evidence Collection (File Metadata)

The **evidence collection** is the primary collection for file metadata. Each document represents unique file content (identified by BLAKE3 hash):

**Path**: `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}`

**Schema** (from `evidenceService.js:58-85`):
```javascript
{
  // Display configuration
  sourceID: metadataHash,               // Primary source metadata reference

  // Source file properties (embedded for performance)
  fileSize: number,
  fileType: string,                     // MIME type
  sourceFileName: string,               // Embedded from primary source
  sourceLastModified: Timestamp,        // Embedded from primary source
  sourceFolderPath: string,             // Embedded from primary source

  // Processing status (for Document Processing Workflow)
  isProcessed: boolean,
  hasAllPages: boolean|null,            // null = unknown
  processingStage: 'uploaded'|'splitting'|'merging'|'complete',

  // Tag counters
  tagCount: number,
  autoApprovedCount: number,
  reviewRequiredCount: number,

  // Embedded tags (denormalized for performance)
  tags: {},                             // Map of category tags for O(1) access

  // Embedded source metadata (denormalized for performance)
  sourceMetadata: {},                   // Primary source metadata
  sourceMetadataVariants: {},           // Alternate sources (copies)
  sourceMetadataCount: number,          // Count of source file variants

  // Timestamps
  uploadDate: Timestamp
}
```

**Deduplication Architecture**:
- Document ID (`fileHash`) is the BLAKE3 content hash
- Automatic database-level deduplication
- Multiple source files with same content → Single evidence document with sourceMetadata subcollection
- Embedded fields optimize query performance (avoid subcollection reads)

### sourceMetadata Subcollection

**Path**: `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}/sourceMetadata/{metadataHash}`

Stores filesystem metadata for each source file that has this content:
- `sourceFileName` - Original filename
- `sourceLastModified` - File modification timestamp
- `sourceFolderPath` - Original folder location
- `size` - File size in bytes

**Purpose**:
- Track multiple copies of same file content with different names/paths/dates
- Support "alternate sources" feature in UI
- Document ID (`metadataHash`) is hash of filesystem metadata

### Categories Collection

**Path**: `/firms/{firmId}/matters/{matterId}/categories/{categoryId}`

Document organization using tags with hybrid storage pattern:
- Full tag metadata in subcollections
- Embedded tag maps in evidence documents for performance
- System categories vs user categories

## Terminology Guide

### Hash Types

The system uses three different hash concepts:

1. **fileHash** (BLAKE3 content hash)
   - Hash of file content only
   - Used as document ID in evidence collection
   - Same content = same fileHash (deduplication)

2. **metadataHash** (filesystem metadata hash)
   - Hash of filename + size + modified date + path
   - Used as document ID in sourceMetadata subcollection
   - Same file with different name/date = different metadataHash

3. **sourceID**
   - Field in evidence document
   - Points to primary sourceMetadata document (metadataHash)
   - Determines which variant is displayed by default

### File Metadata vs Evidence

- **File metadata** = Filesystem properties (name, size, date, path)
- **Evidence** = Content metadata (hash, type, processing stage, tags)

### Processing Stages

File lifecycle stages (from `evidenceService.js:69`):
- `uploaded` - Initial upload, no processing
- `splitting` - Being split into pages
- `merging` - Multiple files being merged
- `complete` - Processing finished

### Deduplication Terms

Following CLAUDE.md terminology:
- **duplicate** - Identical hash + metadata, no informational value (not uploaded)
- **copy** - Same hash but meaningful metadata differences (metadata recorded)
- **redundant** - Hash-verified duplicates awaiting removal
- **best/primary** - File with most meaningful metadata (sourceID points here)

## Storage Paths

```
/firms/{firmId}/matters/{matterId}/uploads/{fileHash}.{ext}  // Current uploads
/firms/{firmId}/matters/{matterId}/OCRed/                    // Future OCR files
/firms/{firmId}/matters/{matterId}/split/                    // Future split files
/firms/{firmId}/matters/{matterId}/merged/                   // Future merged files
```

## Security Pattern

```javascript
// All firm data follows this pattern
match /firms/{firmId}/{collection}/{document} {
  allow read: if request.auth != null &&
                 request.auth.token.firmId == firmId;
  allow write: if request.auth != null &&
                  request.auth.token.firmId == firmId;
}
```

## Implementation Notes

### Current Status

- ✅ Core collections implemented
- ✅ Solo user workflow active
- ✅ File deduplication working
- ✅ Basic security rules deployed
- ✅ Evidence collection with embedded metadata optimization
- ✅ Hybrid tag storage (embedded + subcollection)
- 🔄 Firm invitations (in development)
- ⏳ Document processing workflows (planned)

### Future Considerations

**YAGNI Principle**: Don't add complexity until needed:

1. **If firms grow beyond 100 members**: Move members to subcollection
2. **If you need audit trails**: Add `history` array to documents
3. **If you need per-app permissions**: Extend custom claims
4. **If queries get complex**: Add specific denormalization

**Remember**: You can always add complexity later. Keep it simple and add complexity only when real usage patterns demand it.

## Getting Started

For detailed implementation guidance:

1. **Start with** → Review the Key Files section above to understand source code organization
2. **Then review** → [Security Rules](./Security/firestore-security-rules.md)
3. **For authentication** → Review `src/core/stores/auth/authStore.js` and `authFirmSetup.js`
4. **For file handling** → Review `src/services/uploadService.js` and `evidenceService.js`
5. **For matter management** → Review `src/services/matterService.js`

Each source file contains detailed implementation patterns. Use the Key Files section to navigate to relevant code.

## Performance Optimizations

### Embedded Metadata Pattern

The codebase uses **embedded fields** in evidence documents to avoid expensive subcollection queries:

- `sourceFileName`, `sourceLastModified`, `sourceFolderPath` embedded from primary source
- `tags` map embedded for O(1) category tag access
- `sourceMetadataCount` embedded to determine "alternate sources" without counting subcollection

**Impact** (from `uploadService.js:96-107`):
- 90% reduction in Firestore reads
- Single query fetches all data needed for document table
- No subcollection queries during list operations

### Query Constraints

**CRITICAL**: Firestore security rules are not filters. Queries MUST include the same constraints as security rules.

Example: If security rule requires `firmId` match, query MUST filter by `firmId`:
```javascript
// CORRECT
const q = query(
  collection(db, 'firms', firmId, 'matters', matterId, 'evidence'),
  orderBy('uploadDate', 'desc')
);

// INCORRECT - would fail even though path includes firmId
const q = query(collection(db, 'evidence')); // Missing firm scoping
```

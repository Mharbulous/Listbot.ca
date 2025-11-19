# Evidence Document Structure

**Reconciled up to**: 2025-11-18

## Key Files

- `src/features/organizer/services/evidenceService.js` - Main evidence CRUD operations
- `src/features/organizer/services/tagSubcollectionService.js` - Tag subcollection operations and dual storage sync
- `src/features/organizer/services/evidenceDocumentService.js` - Evidence document access and AI tag storage
- `src/features/organizer/services/evidenceQueryService.js` - Evidence query operations
- `src/features/upload/composables/useFileMetadata.js` - Metadata hash generation (xxHash)
- `src/services/fileService.js` - File operations and storage references

## Database Path

```
/firms/{firmId}/matters/general/evidence/{fileHash}
```

**IMPORTANT**: Document ID is the BLAKE3 hash of the file content (32 hex characters). This provides automatic deduplication - identical files cannot create duplicate evidence records.

## Document Schema

### Required Fields

```javascript
{
  // Document ID = fileHash (BLAKE3, 32 chars) - NOT A STORED FIELD

  // Display Configuration - REQUIRED
  sourceID: string,           // Metadata hash - references sourceMetadata collection

  // File Properties - REQUIRED
  fileSize: number,              // Bytes, must be > 0
  fileType: string,              // MIME type from source file (e.g., "application/pdf")

  // Processing Status - REQUIRED
  isProcessed: boolean,          // Default: false
  hasAllPages: boolean | null,   // null until processing complete
  processingStage: string,       // ENUM: 'uploaded' | 'splitting' | 'merging' | 'complete'

  // Tag Counters - REQUIRED (NOTE: Currently not maintained by tag operations - see Tag Management section)
  tagCount: number,              // Default: 0, increment on tag add
  autoApprovedCount: number,     // Default: 0, tags with confidence >= 95%
  reviewRequiredCount: number,   // Default: 0, tags with confidence < 95%

  // Timestamps - REQUIRED
  uploadDate: timestamp,         // Firebase Storage creation timestamp (from timeCreated metadata)

  // Embedded Source Metadata (Denormalized for Performance) - OPTIONAL
  sourceFileName: string,        // Primary source filename (from selected sourceMetadata variant)
  sourceLastModified: timestamp, // Primary source file modification date
  sourceFolderPath: string,      // Primary source folder path (pipe-delimited)

  // Source Metadata Variants Map (Fast Duplicate Checking) - OPTIONAL
  sourceMetadataVariants: {      // Map of all metadata variants for this file
    [metadataHash]: {            // Key is metadataHash (16 hex chars)
      sourceFileName: string,
      sourceLastModified: timestamp,
      sourceFolderPath: string,
      uploadDate: timestamp
    }
  },
  sourceMetadataCount: number,   // Count of metadata variants (for performance)

  // Embedded Tags (Denormalized for Performance) - OPTIONAL
  tags: {                        // Map of embedded tags for DocumentTable
    [categoryId]: {
      tagName: string,
      confidence: number,
      source: 'ai' | 'human',
      autoApproved: boolean,
      reviewRequired: boolean,
      createdAt: timestamp
    }
  }
}
```

### Field Constraints

**Document ID (fileHash):**

- **MUST** be a valid BLAKE3 hash (32 hexadecimal characters)
- **AUTOMATIC DEDUPLICATION**: Using fileHash as document ID prevents duplicate evidence records
- **ALWAYS** verify file exists in Firebase Storage before creating evidence document
- **NEVER** manually set document ID - use the fileHash from upload process

**sourceID:**

- **ALWAYS** verify hash exists in sourceMetadata collection
- **MUST** be a valid metadataHash (xxHash, 16 characters)
- **USE** hash-based lookup for metadata retrieval

**Note**: For understanding the critical distinction between source file metadata and storage file references, including how sourceMetadata is stored as a subcollection under evidence documents, see [@docs/Features/Organizer/Data/file-metadata-schema.md](@docs/Features/Organizer/Data/file-metadata-schema.md).

**processingStage:**

- **MUST** follow this progression: 'uploaded' → 'splitting' → 'merging' → 'complete'
- **NEVER** skip stages or move backwards
- **UPDATE** isProcessed to true only when stage = 'complete'

**Tag Counters:**

- **DOCUMENTED BEHAVIOR**: Counters should be incremented atomically using FieldValue.increment()
- **CURRENT IMPLEMENTATION NOTE**: Tag counters (`tagCount`, `autoApprovedCount`, `reviewRequiredCount`) are currently NOT maintained by `tagSubcollectionService.js` (lines 124-148). The service only updates embedded tags map via batch writes. Counter maintenance gap exists between documentation and implementation.
- **WORKAROUND**: Query subcollection for accurate counts, or implement counter updates in tag operations
- **NEVER** manually calculate from subcollection if counters are maintained
- **UPDATE** uploadDate whenever counters change

**uploadDate Timestamp:**

- **PRIMARY SOURCE**: Retrieved from Firebase Storage metadata's `timeCreated` field after upload completes
- **CONVERSION**: Storage timestamp (ISO 8601 string) is converted to Firestore Timestamp object
- **FALLBACK**: Uses Firestore `serverTimestamp()` if Storage metadata unavailable
- **PURPOSE**: Ensures exact timestamp match between Storage file and Firestore evidence document
- **ACCURACY**: Eliminates 1-second discrepancies between Storage and Firestore operations
- **IMMUTABILITY**: Represents when file was created in Storage (not when document was modified)

**Embedded Source Metadata (Performance Optimization):**

- **PURPOSE**: Denormalized data from sourceMetadata subcollection for single-query table rendering
- **FIELDS USED**: Individual denormalized fields (`sourceFileName`, `sourceLastModified`, `sourceFolderPath`)
- **UPDATED**: Automatically updated when sourceMetadata is created or sourceID is changed
- **SOURCE**: Copied from the sourceMetadata document referenced by sourceID field
- **PRIMARY METADATA**: Represents the "selected" metadata variant for display
- **ELIMINATES**: Subcollection queries for DocumentTable rendering (massive performance gain)

**sourceMetadataVariants Map (Fast Duplicate Checking):**

- **PURPOSE**: Embedded map of ALL metadata variants for instant duplicate detection
- **KEY**: metadataHash (16 hex chars) serves as map key
- **UPDATED**: Atomically updated when new sourceMetadata documents are created
- **FAST LOOKUP**: Check `sourceMetadataVariants[metadataHash]` instead of querying subcollection
- **USE CASE**: `metadataRecordExists()` checks this map for O(1) duplicate detection
- **PERFORMANCE**: Eliminates subcollection query for every duplicate check

**sourceMetadataCount Counter:**

- **PURPOSE**: Track number of metadata variants without counting subcollection
- **INCREMENT**: Atomically incremented when new sourceMetadata document is created
- **DISPLAY**: Shows users how many different upload contexts exist for this file

**Embedded Tags Map (DocumentTable Performance):**

- **PURPOSE**: Simplified tag data for DocumentTable rendering without subcollection queries
- **SYNC**: Automatically synchronized with tags subcollection via batch writes
- **DUAL STORAGE**: Full metadata in subcollection, simplified data in embedded map
- **PERFORMANCE**: Enables DocumentTable to load 10,000+ documents in single query

**Note**: For complete tag subcollection architecture, validation rules, and Categories patterns, see [@docs/Features/Organizer/Categories/category-system-overview.md](@docs/Features/Organizer/Categories/category-system-overview.md).

## Source Metadata Subcollection

### Path Structure

```
/firms/{firmId}/matters/general/evidence/{evidenceId}/sourceMetadata/{metadataHash}
```

### Purpose

The sourceMetadata subcollection stores variant metadata for files with identical content but different upload contexts (different names, timestamps, or folder paths). This preserves all source file contexts while maintaining efficient storage deduplication.

### Source Metadata Document Schema

```javascript
{
  // Core file metadata (only what varies between identical files)
  sourceFileName: string,           // Exact filename with SOURCE FILE CASE PRESERVED
  sourceLastModified: Timestamp,    // Source file's timestamp (Firestore Timestamp)
  fileHash: string,                 // BLAKE3 of file content (32 hex chars)

  // File path information
  sourceFolderPath: string,         // Pipe-delimited paths (e.g., "Documents/2023|Archive/Legal")
}
```

### Key Characteristics

- **Multiple variants per evidence**: One evidence document can have multiple sourceMetadata subcollection documents
- **Automatic deduplication**: Identical metadata (same metadataHash) stored only once per evidence document
- **Preserves original context**: Each document represents a unique upload context with different name, timestamp, or path
- **Case preservation**: The ONLY place where source file extension case is preserved

## Tag Storage (Hybrid Architecture)

Tags use **dual storage** synchronized via atomic batch writes (`tagSubcollectionService.js`):
- **Subcollection** (below) - Full metadata for detail views and review workflows
- **Embedded map** `evidence.tags[categoryId]` - Simplified data for DocumentTable performance

### Tag Subcollection (Full Metadata)

**Path**: `/firms/{firmId}/matters/{matterId}/evidence/{evidenceId}/tags/{categoryId}`

### Tag Document Schema

```javascript
{
  // Tag Identity - REQUIRED
  categoryId: string,            // Must match document ID
  tags: string[],                // Array of tag values for this category

  // AI Processing - REQUIRED
  confidence: number,            // 0-100, decimal allowed
  aiSource: string,              // Model identifier (e.g., 'gpt-4')

  // Approval Status - REQUIRED
  status: string,                // ENUM: 'auto_approved' | 'pending_review' | 'human_approved' | 'rejected'

  // Optional Metadata
  reviewedBy: string | null,     // User ID if human reviewed
  reviewedAt: timestamp | null,  // Timestamp of human review

  // Timestamps - REQUIRED
  createdAt: timestamp,          // Server timestamp
  updatedAt: timestamp           // Server timestamp
}
```

### Embedded Tags Map (Simplified for Performance)

**Location**: `evidence.tags[categoryId]` in evidence document

```javascript
evidence.tags = {
  'DocumentDate': {
    tagName: string,
    confidence: number,          // 0-100 percentage
    source: 'ai' | 'human',
    autoApproved: boolean,
    reviewRequired: boolean,
    createdAt: timestamp
  }
}
```

**Accessed by**: DocumentTable for fast loading of 10,000+ documents in single query.

### Tag Status Rules

**ALWAYS** set status based on confidence:

- confidence >= 95: status = 'auto_approved'
- confidence < 95: status = 'pending_review'

**NEVER** allow:

- Empty tags array
- Duplicate categoryId within same evidence
- Confidence values outside 0-100 range
- Manual status changes without updating reviewedBy/reviewedAt

## Firestore Security Rules

```javascript
match /firms/{firmId}/matters/{matterId}}/evidence/{fileHash} {
  // Evidence document access
  // Note: fileHash is the document ID (BLAKE3, 32 hex chars)
  allow read: if request.auth != null &&
                 request.auth.token.firmId == firmId;

  allow create: if request.auth != null &&
                   request.auth.token.firmId == firmId &&
                   validateEvidenceCreate(request.resource.data, fileHash);

  allow update: if request.auth != null &&
                   request.auth.token.firmId == firmId &&
                   validateEvidenceUpdate(request.resource.data, resource.data);

  allow delete: if false; // NEVER allow deletion

  // Tag subcollection
  match /tags/{categoryId} {
    allow read: if request.auth != null &&
                   request.auth.token.firmId == firmId;

    allow write: if request.auth != null &&
                    request.auth.token.firmId == firmId &&
                    request.resource.id == request.resource.data.categoryId &&
                    validateTagDocument(request.resource.data);
  }
}

// Validation Functions
function validateEvidenceCreate(data, fileHash) {
  return data.keys().hasAll(['sourceID', 'fileSize',
                              'isProcessed', 'processingStage', 'tagCount',
                              'autoApprovedCount', 'reviewRequiredCount', 'uploadDate']) &&
         fileHash.size() == 32 &&  // Document ID must be valid BLAKE3 hash
         data.sourceID.size() == 16 &&  // Must be valid xxHash metadata hash
         data.fileSize > 0 &&
         data.processingStage in ['uploaded', 'splitting', 'merging', 'complete'] &&
         data.tagCount >= 0 &&
         data.autoApprovedCount >= 0 &&
         data.reviewRequiredCount >= 0 &&
         // Optional embedded source metadata fields
         (!data.keys().has('sourceMetadataCount') || data.sourceMetadataCount >= 0);
}

function validateTagDocument(data) {
  return data.confidence >= 0 &&
         data.confidence <= 100 &&
         data.tags.size() > 0 &&
         data.status in ['auto_approved', 'pending_review', 'human_approved', 'rejected'] &&
         (data.confidence >= 95 ? data.status == 'auto_approved' : true) &&
         (data.confidence < 95 ? data.status == 'pending_review' : true);
}
```

**Note**: For complete security rule patterns, custom claims structure, and firm-based access control implementation, see [@docs/Data/Security/25-11-18-firestore-security-rules.md](@docs/Data/Security/25-11-18-firestore-security-rules.md).

```javascript

```

## Query Operations

### Get Evidence with Tag Counts

```javascript
const evidenceDoc = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .doc('general')
  .collection('evidence')
  .doc(evidenceId)
  .get();

// ALWAYS check document exists
if (!evidenceDoc.exists) throw new Error('Evidence not found');

const data = evidenceDoc.data();
// NOTE: Tag counters may not be maintained by current implementation
// Consider querying subcollection for accurate counts
const tagMetrics = {
  total: data.tagCount,
  autoApproved: data.autoApprovedCount,
  reviewRequired: data.reviewRequiredCount,
};
```

**Note**: For firm member management and data migration workflows that affect evidence document access patterns, see [@docs/Features/Matters/firm-workflows.md](@docs/Features/Matters/firm-workflows.md).

```javascript

```

### Get Tags for Evidence

```javascript
// Get all tags
const tagsSnapshot = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .doc('general')
  .collection('evidence')
  .doc(evidenceId)
  .collection('tags')
  .get();

// Get pending review tags only
const pendingTags = await db
  .collection('firms')
  .doc(firmId)
  .collection('matters')
  .doc('general')
  .collection('evidence')
  .doc(evidenceId)
  .collection('tags')
  .where('status', '==', 'pending_review')
  .get();
```

### Add Tag to Evidence

```javascript
// DOCUMENTED: Transaction-based approach with counter maintenance
// NOTE: Current tagSubcollectionService.js implementation (lines 124-148)
// uses batch writes for embedded tags map but does NOT update counters
// The code example below shows the INTENDED pattern for counter maintenance

await db.runTransaction(async (transaction) => {
  const evidenceRef = db
    .collection('firms')
    .doc(firmId)
    .collection('matters')
    .doc('general')
    .collection('evidence')
    .doc(evidenceId);

  const tagRef = evidenceRef.collection('tags').doc(categoryId);

  // Determine status based on confidence
  const status = confidence >= 95 ? 'auto_approved' : 'pending_review';

  // Create tag document
  transaction.set(tagRef, {
    categoryId,
    tags: tagArray,
    confidence,
    aiSource,
    status,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Update counters atomically (NOT currently implemented in tagSubcollectionService)
  const counterUpdates = {
    tagCount: FieldValue.increment(1),
    uploadDate: FieldValue.serverTimestamp(),
  };

  if (status === 'auto_approved') {
    counterUpdates.autoApprovedCount = FieldValue.increment(1);
  } else {
    counterUpdates.reviewRequiredCount = FieldValue.increment(1);
  }

  transaction.update(evidenceRef, counterUpdates);
});
```

### Update Processing Stage

```javascript
// MUST follow stage progression rules
const validTransitions = {
  uploaded: ['splitting'],
  splitting: ['merging'],
  merging: ['complete'],
  complete: [], // Terminal state
};

// ALWAYS validate transition
const currentStage = evidenceDoc.data().processingStage;
const canTransition = validTransitions[currentStage].includes(newStage);

if (!canTransition) {
  throw new Error(`Invalid stage transition: ${currentStage} → ${newStage}`);
}

// Update stage
await evidenceRef.update({
  processingStage: newStage,
  isProcessed: newStage === 'complete',
  hasAllPages: newStage === 'complete' ? true : null,
  uploadDate: FieldValue.serverTimestamp(),
});
```

## Performance Requirements

### Indexing

**MUST** create composite indexes:

```
Collection: tags
- status ASC, confidence DESC
- categoryId ASC, createdAt DESC
- status ASC, updatedAt DESC
```

### Counter Maintenance

- **DOCUMENTED**: Counters should never be recalculated from subcollection queries
- **CURRENT IMPLEMENTATION**: Tag counters are NOT updated by `tagSubcollectionService.js`
- **WORKAROUND**: Query tags subcollection directly for accurate counts
- **ALWAYS** use FieldValue.increment() for atomic updates (when implemented)
- **USE** counters for UI display without subcollection reads (once implemented)

### Batch Operations

- **LIMIT** batch writes to 500 documents per batch
- **USE** BulkWriter for large tag imports
- **IMPLEMENT** exponential backoff for retries

**Note**: For complete storage path organization, processing folder architecture, and Firebase Storage optimization strategies, see [@docs/Features/Upload/Storage/firebase-storage.md](@docs/Features/Upload/Storage/firebase-storage.md).

## Critical Constraints

### Data Integrity

- **NEVER** delete evidence documents
- **NEVER** modify document ID (fileHash) after creation
- **AUTOMATIC DEDUPLICATION**: Same fileHash = same document (setDoc overwrites safely)
- **ALWAYS** maintain counter accuracy with transactions (when counter maintenance is implemented)
- **NEVER** allow orphaned tags (evidence deleted but tags remain)

### File References

- **ALWAYS** verify file exists in Firebase Storage before creating evidence
- **NEVER** store file content in Firestore
- **USE** fileHash (document ID) to locate files in Storage: `firms/{firmId}/matters/{matterId}/uploads/{fileHash}.{extension}`
- **ALWAYS** verify metadata hash exists in sourceMetadata collection
- **ACCESS** file using: `evidence.id` (which is the fileHash)

**Note**: For understanding firm-based data isolation including solo user patterns where firmId === userId, see [@docs/Features/Matters/solo-firm-matters.md](@docs/Features/Matters/solo-firm-matters.md).

### Processing Workflow

- **MUST** process documents in order: upload → split → merge → complete
- **NEVER** mark isProcessed=true unless processingStage='complete'
- **ALWAYS** update uploadDate timestamp on any field change
- **DO NOT** allow manual stage changes without proper validation

### Embedded Metadata Management

- **SYNC** embedded source metadata with sourceMetadata subcollection
- **UPDATE** sourceMetadataVariants map when creating new sourceMetadata documents
- **INCREMENT** sourceMetadataCount atomically using FieldValue.increment()
- **MAINTAIN** tags map in sync with tags subcollection via batch writes
- **NEVER** manually edit embedded maps without updating corresponding subcollections

### Tag Management

- **ENFORCE** confidence thresholds: 95% for auto-approval
- **NEVER** allow confidence values outside 0-100 range
- **ALWAYS** track reviewer identity for manual approvals
- **MAINTAIN** accurate counts through atomic transactions (when counter maintenance is implemented)

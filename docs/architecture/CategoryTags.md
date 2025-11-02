# Categories and Tags System

Last Updated: 2025-09-20

## Critical Architecture Context

**DO NOT** assume tags are stored in the evidence document. Tags use a subcollection architecture at `/firms/{firmId}/evidence/{evidenceId}/tags/{categoryId}` for scalability.

**ALWAYS** enforce one tag per category through tagCategoryId as document ID.

**NEVER** store duplicate tag colors. Colors are computed using triadic pattern based on category position.

## Data Structures - Single Source of Truth

### System Categories Collection: `/systemcategories/{categoryId}`

Global collection containing predefined system categories that should exist for all matters:

```javascript
{
  name: string,                    // Category display name
  type: string,                    // Category type (Date, Fixed List, Open List, Text Area, etc.)
  isActive: boolean,               // Always true for system categories
  isSystemCategory: boolean,       // Always true - identifies system categories
  description: string,             // Description of the category's purpose
  tags: [                          // Pre-defined tags for Fixed List and Open List types
    {
      id: string,                  // UUID
      name: string,                // Tag name
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Reserved System Category IDs:**

- `DocumentDate` - Date type category for document dates
- `Privilege` - Fixed List for privilege classification (Attorney-Client, Work Product, Not Privileged)
- `Description` - Text Area for free-form document descriptions
- `DocumentType` - Open List for document type classification
- `Author` - Open List for document authors
- `Custodian` - Open List for document custodians

### Matter-Specific Categories Collection: `/firms/{firmId}/matters/{matterId}/categories/{categoryId}`

Each matter has its own categories collection that includes both system categories (copied from `/systemcategories`) and custom categories:

```javascript
{
  name: string,                    // Max 50 chars
  type: string,                    // Category type
  color: string,                   // Hex format (#RRGGBB) - optional, auto-assigned by UI
  isActive: boolean,               // Soft delete flag (undefined = true for legacy data)
  isSystemCategory: boolean,       // true for system categories, false/undefined for custom
  deletedAt: Timestamp,            // Set when soft deleted (not used for system categories)
  isOpen: boolean,                 // true = Open List (allows new options), false = Fixed List (locked options)
  tags: [
    {
      id: string,                  // UUID
      name: string,                // Max 30 chars, unique within category
      color: string                // Hex color (optional, inherits category color)
    }
  ],
  description: string,             // Optional description
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Important Notes:**

- System categories use reserved document IDs (e.g., `DocumentDate`, `Privilege`)
- Custom categories use auto-generated document IDs
- System categories cannot be deleted, only edited
- Each matter gets its own copy of system categories during initialization

### Tags Subcollection: `/firms/{firmId}/evidence/{evidenceId}/tags/{categoryId}`

```javascript
{
  // Core fields - REQUIRED
  tagCategoryId: string,           // Same as document ID - the category this tag belongs to
  tagName: string,
  source: 'ai' | 'ai-auto' | 'human',
  confidence: number,              // 0.0-1.0, 1.0 for human
  autoApproved: boolean,           // true if confidence >= 0.85
  reviewRequired: boolean,         // true if confidence < 0.85

  // Review tracking - OPTIONAL
  reviewedAt: Timestamp | null,
  reviewedBy: string | null,
  humanApproved: boolean | null,

  // Metadata - REQUIRED
  createdAt: Timestamp,
  createdBy: string,               // 'ai-system' or userId

  // AI analysis - REQUIRED for AI tags
  AIanalysis: {
    aiSelection: string,
    originalConfidence: number,
    aiAlternatives: string[],      // ALL alternatives, rank-ordered
    processingModel: string,
    contentMatch: string | null,
    reviewReason: string | null,
    reviewNote: string | null,
    userNote: string | null
  }
}
```

### Evidence Document Counters

```javascript
{
  // ALWAYS maintain these counters
  tagCount: number,
  autoApprovedCount: number,
  reviewRequiredCount: number
}
```

## System Categories Architecture

### Initialization Process

1. **Global Seed**: System categories are defined in `/systemcategories` collection (one-time setup)
2. **Matter Initialization**: When a user accesses `/organizer/categories`, the app checks if the matter has all system categories
3. **Auto-Copy**: Missing system categories are automatically copied from `/systemcategories` to `/firms/{firmId}/matters/{matterId}/categories/`
4. **Reserved IDs**: System categories use reserved document IDs (e.g., `DocumentDate`) instead of auto-generated IDs

### System Category Behavior

**Initialization:**

- System categories are automatically created when first accessing the category manager
- Each matter gets its own copy of system categories
- Categories are copied from `/systemcategories` to matter-specific collection

**Deletion Prevention:**

- System categories cannot be deleted through the UI or API
- `SystemCategoryService.validateNotSystemCategory()` throws error on deletion attempts
- Delete button is disabled in UI for system categories

**Editing:**

- System categories CAN be edited (field values, tags, etc.)
- Changes are matter-specific and don't affect other matters
- No automatic synchronization with `/systemcategories` after initial copy

**UI Indicators:**

- System categories display a "System" badge in the category list
- System categories are sorted to appear first in the list
- Delete functionality is disabled for system categories

### Matter-Specific Categories

All categories (system and custom) are stored at the matter level:

- Path: `/firms/{firmId}/matters/{matterId}/categories/{categoryId}`
- Default matter is `general` for backward compatibility
- Each matter has independent category data
- System categories are copied to each matter during initialization

## Critical Constraints and Rules

### Validation Rules

**NEVER** allow:

- Deletion of system categories (reserved IDs: DocumentDate, Privilege, Description, DocumentType, Author, Custodian)
- Category names starting with `system_` or `ai_`
- Tag names containing: `< > " ' & |`
- More than 100 tags per evidence document
- Tags referencing inactive categories
- Duplicate tag names within a category

**ALWAYS**:

- Trim whitespace from tag names
- Perform case-insensitive matching for duplicates
- Store original case in database
- Validate hex color format for colors
- Maintain one tag per category (enforced by document ID)
- Check `isSystemCategory(categoryId)` before allowing deletion

### Auto-Approval Rules

**ALWAYS** auto-approve when confidence >= 0.85
**NEVER** auto-approve when confidence < 0.85
**ALWAYS** set `reviewRequired: true` for confidence < 0.85
**ALWAYS** set `autoApproved: true` for confidence >= 0.85
**ALWAYS** set confidence to 1.0 for human-created tags

### Soft Delete Pattern

**DO NOT** hard delete categories.
**ALWAYS** set `isActive: false` and `deletedAt` timestamp for deletion.
**ALWAYS** treat undefined `isActive` as true for backward compatibility.
**ALWAYS** attempt `where('isActive', '==', true)` queries first, then fall back to client-side filtering if index missing.

## UI Component Requirements

### EditableTag Component (`src/components/features/tags/EditableTag.vue`)

**Props**:

- `tag` - Current tag object
- `categoryOptions` - Available tags array
- `isOpenCategory` - Boolean for Fixed vs Open List (should match category.isOpen)
- `tagColor` - Computed triadic color

**Events**:

- `tag-updated` - Existing option selected
- `tag-created` - New option created (Open List only)
- `tag-selected` - Option selected (no persistence)

### Fixed List vs Open List Behavior

**Fixed List Categories**:

- **NEVER** allow new option creation
- **ALWAYS** show lock icon during editing
- **ONLY** allow selection from existing options

**Open List Categories**:

- **ALWAYS** allow new option creation via Enter key
- **ALWAYS** show pencil icon during editing
- **ALWAYS** add new options to category tags array

### Color System

**NEVER** store individual tag colors. Use triadic rotation:

- Position 0: `#733381` (Purple)
- Position 1: `#589C48` (Green)
- Position 2: `#F58024` (Orange)

**ALWAYS** assign colors by `categoryIndex % 3`

## Development Testing Environment

**Testing Page**: `http://localhost:5174/#/dev/clickable-tags`

**Development Collections**:

- `devTesting` - Development categories collection
- `devTesting/config/TestTags` - Test tags subcollection

The testing page provides side-by-side comparison of Fixed List Categories (locked options) vs Open List Categories (user can create new options). Requires authentication for real Firebase integration testing.

## AI Alternatives Storage Pattern

**ALWAYS** store ALL alternatives in `aiAlternatives` array (no cap).
**NEVER** include the selected tag in alternatives array.
**ALWAYS** rank-order alternatives by confidence.

UI display strategy:

- Show top 2 alternatives as quick options
- "Other" button shows remaining alternatives + all other category options

## Required Firestore Indexes

```javascript
// Categories collection
{
  collection: 'firms/{firmId}/categories',
  fields: [
    { field: 'isActive', order: 'ASCENDING' },
    { field: 'createdAt', order: 'ASCENDING' }
  ]
}

// Tags subcollection
{
  collection: 'firms/{firmId}/evidence/{evidenceId}/tags',
  fields: [
    { field: 'reviewRequired', order: 'ASCENDING' },
    { field: 'createdAt', order: 'ASCENDING' }
  ]
}
```

## Query Patterns

### Initialize System Categories for Matter

```javascript
import { SystemCategoryService } from '../services/systemCategoryService.js';

// Check for missing system categories
const missingIds = await SystemCategoryService.checkMissingCategories(firmId, matterId);

// Initialize missing system categories
const result = await SystemCategoryService.initializesystemcategories(firmId, matterId);
console.log(`Created ${result.created} system categories`);
```

### Get Active Categories with Fallback

```javascript
// ALWAYS try indexed query first
try {
  const snapshot = await db
    .collection('firms')
    .doc(firmId)
    .collection('matters')
    .doc(matterId) // Can be 'general' or any other matter ID
    .collection('categories')
    .where('isActive', '==', true)
    .get();
} catch (error) {
  // Fallback to client-side filtering if index missing
  const snapshot = await db
    .collection('firms')
    .doc(firmId)
    .collection('matters')
    .doc(matterId)
    .collection('categories')
    .get();
  // Filter client-side for isActive !== false
}
```

### Check if Category is System Category

```javascript
import { isSystemCategory } from '../constants/systemcategories.js';

if (isSystemCategory(categoryId)) {
  console.log('This is a system category - cannot be deleted');
}
```

### Access Tag for Specific Category

```javascript
// Direct access via tagCategoryId as document ID
const tagDoc = await db
  .collection('firms')
  .doc(firmId)
  .collection('evidence')
  .doc(evidenceId)
  .collection('tags')
  .doc(tagCategoryId)
  .get();
```

## Performance Requirements

- Tag counter updates MUST complete in <100ms
- Auto-approval processing MUST complete in <200ms
- Category loading MUST handle 1000+ tags without degradation
- **ALWAYS** use counters to avoid subcollection counts
- **NEVER** load all tags when only count needed

## Cross-Reference to Other Documentation

For authentication and firm validation rules, see Authentication documentation.
For evidence document structure and lifecycle, see Evidence Management documentation.
For real-time synchronization patterns, see Real-Time Updates documentation.
For AI processing pipeline and confidence scoring, see AI Integration documentation.

## Migration and Backward Compatibility

**ALWAYS** handle missing `isActive` field as true.
**NEVER** assume all categories have modern structure.
**ALWAYS** perform background migrations without blocking operations.

## Environment Variables

```javascript
// Feature flags - NEVER hardcode these values
const ENABLE_AUTO_APPROVAL = process.env.VITE_ENABLE_AUTO_APPROVAL !== 'false';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.VITE_CONFIDENCE_THRESHOLD) || 0.85;
```

## Common Pitfalls

**DO NOT** store tags in the evidence document - use subcollection.
**DO NOT** allow multiple tags per category - one tagCategoryId per tag document.
**DO NOT** compute colors client-side differently than triadic pattern.
**DO NOT** skip validation assuming Firestore rules will catch errors.
**DO NOT** query all tags when counters are available on evidence document.
**DO NOT** hard delete categories - always soft delete.
**DO NOT** assume `isActive` field exists - handle undefined as true.

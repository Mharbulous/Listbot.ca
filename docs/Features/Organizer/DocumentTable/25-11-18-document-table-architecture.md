# DocumentTable - Cloud View

**Reconciled up to**: 2025-11-18

Last Updated: 2025-10-27

## Key Files

- `src/views/Documents.vue` - Cloud view page component that uses DocumentTable
- `src/components/base/DocumentTable.vue` - Reusable table component with virtual scrolling
- `src/services/uploadService.js` - Evidence document and tag data fetching
- `src/features/organizer/services/categoryService.js` - Category CRUD operations
- `src/features/organizer/services/systemCategoryService.js` - System category initialization and management
- `src/composables/useColumnResize.js` - Column width management and persistence
- `src/composables/useColumnDragDrop.js` - Drag-and-drop column reordering
- `src/composables/useColumnVisibility.js` - Show/hide column toggles
- `src/composables/useVirtualTable.js` - TanStack Virtual integration for performance
- `src/composables/useColumnSort.js` - Multi-column sorting logic

## Overview

The DocumentTable is the primary data display component shown on the Cloud view (`/#/cloud`). It presents evidence documents with columns from four distinct data sources, all rendered with a unified, consistent appearance.

**Component Architecture**:
- **View Component**: `src/views/Documents.vue` - Page component that fetches data and manages state
- **Table Component**: `src/components/base/DocumentTable.vue` - Reusable presentational table with virtual scrolling

## Table Architecture

### Four Column Data Sources

The DocumentTable aggregates column data from four sources, displayed with consistent styling:

#### 1. Built-in Data Columns (Hardcoded)

These columns are hardcoded in the component and display file metadata that is not associated with dynamic categories.

**Hardcoded Columns** (defined in `NON_SYSTEM_COLUMNS` array in Documents.vue:144-152):
- **File Size** - Size of the uploaded file (formatted, e.g., "2.4 MB")
- **Source File Name** - Original filename from the source system
- **Upload Date** - Timestamp when the file was uploaded to the evidence collection
- **File Format** - MIME type of the file (e.g., "PDF", "DOCX")
- **Source Modified Date** - Last modified date from the source file system
- **Source Folder** - Original folder path from the source system
- **Multiple Source Files** - Indicator if multiple source files deduplicated to this evidence

**Data Source**: Evidence documents at `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}` with embedded source metadata fields.

#### 2. System Categories

Global categories defined by developers and used across all firms and matters.

**Storage Path**: `/systemcategories/{categoryId}`

**Characteristics**:
- Created and managed exclusively by developers
- Available to all firms automatically
- Cannot be deleted by users
- Use reserved document IDs (e.g., `DocumentDate`, `Privilege`, `Description`, `DocumentType`, `Author`, `Custodian`)
- Each matter receives a copy during initialization

**Reserved System Categories**:
- `DocumentDate` - Date type category for document dates
- `Privilege` - Fixed List for privilege classification (Attorney-Client, Work Product, Not Privileged)
- `Description` - Text Area for free-form document descriptions
- `DocumentType` - Open List for document type classification
- `Author` - Open List for document authors
- `Custodian` - Open List for document custodians

**Implementation Status**: ✅ Fully implemented (Documents.vue:186-190)

#### 3. Firm Categories

Categories common to all matters within a firm. These are stored in the special "general" matter.

**Storage Path**: `/firms/{firmId}/matters/general/categories/{categoryId}`

**Characteristics**:
- Created by firm users/admins
- Shared across all matters in the firm
- Stored in the special `general` matter (firm-wide scope)
- Can be created, edited, and soft-deleted by authorized users
- Include both system categories (copied during initialization) and custom firm categories

**Implementation Status**: ✅ Fully implemented (Documents.vue:192-197, 334-347)

#### 4. Matter Categories

Categories specific to a single matter.

**Storage Path**: `/firms/{firmId}/matters/{matterId}/categories/{categoryId}`

**Characteristics**:
- Created for a specific matter only
- Not shared with other matters in the firm
- Stored under the specific matter ID (not "general")
- Can be created, edited, and soft-deleted by authorized users
- Include both system categories (copied during initialization) and custom matter categories

**Implementation Status**: ✅ Fully implemented (Documents.vue:199-204, 349-366)

### Category Hierarchy and Data Model

```
System Categories (Global)
└── /systemcategories/{categoryId}
    ├── isSystemCategory: true
    └── Copied to matters on initialization

Firm Categories (Firm-wide)
└── /firms/{firmId}/matters/general/categories/{categoryId}
    ├── System categories (isSystemCategory: true) - copied from /systemcategories
    └── Custom firm categories (isSystemCategory: false/undefined)

Matter Categories (Matter-specific)
└── /firms/{firmId}/matters/{matterId}/categories/{categoryId}
    ├── System categories (isSystemCategory: true) - copied from /systemcategories
    └── Custom matter categories (isSystemCategory: false/undefined)
```

**Important**: The "general" matter serves as a special matter ID for firm-wide data. All other matter IDs represent specific legal matters.

## Visual Design

### Unified Appearance

All four column types (Built-in, System, Firm, Matter) are displayed with **identical visual styling**:

- Same header cell design with drag-and-drop handles
- Consistent typography and padding
- Unified sorting indicators
- Identical resize handles
- Same hover and interaction states

**Design Principle**: Users cannot visually distinguish the data source of a column. This creates a seamless, unified table experience.

### Column Features

All columns support:

1. **Reordering**: Drag-and-drop column headers to reorder
2. **Resizing**: Drag resize handles to adjust column width
3. **Sorting**: Click column header to toggle sort direction
4. **Visibility Toggle**: Show/hide columns via the "Cols" button
5. **Persistence**: Column order, width, and visibility saved to user preferences

## Category Tag Display

Category columns display tag values from the **embedded tags map** (`evidence.tags[categoryId]`) for performance. The subcollection at `/firms/{firmId}/matters/{matterId}/evidence/{fileHash}/tags/{categoryId}` contains full metadata and is accessed only in detail views.

**Display Logic** (uploadService.js:48):
- If tag exists: Display the `tagName` value from `evidence.tags[categoryId].tagName`
- If no tag exists: Returns `null` (displayed as empty cell)
- If error: Display error message prefixed with "ERROR:"

## Current Implementation

### What's Implemented (Documents.vue)

✅ **Built-in Data Columns**: All hardcoded columns fully functional
✅ **System Categories**: Fetched from `/systemcategories` and displayed as columns
✅ **Firm Categories**: Fetched from `/firms/{firmId}/matters/general/categories` and displayed as columns
✅ **Matter Categories**: Fetched from `/firms/{firmId}/matters/{matterId}/categories` and displayed as columns
✅ **Tag Values**: Category tag values loaded from embedded `evidence.tags` map (not subcollection)
✅ **Virtual Scrolling**: High-performance rendering with TanStack Virtual
✅ **Column Management**: Reordering, resizing, visibility, sorting all functional

### What's Not Yet Implemented

⚠️ **Category Hierarchy Logic**: Determining which categories take precedence when same category exists at multiple levels

## Data Flow

### Current Flow (Implemented)

1. User navigates to `/#/cloud`
2. `Documents.vue` checks authentication (authStore) and matter selection (matterViewStore)
3. **Three parallel category fetches**:
   - System categories from `/systemcategories` (sorted alphabetically by name)
   - Firm categories from `/firms/{firmId}/matters/general/categories`
   - Matter categories from `/firms/{firmId}/matters/{matterId}/categories`
4. Evidence documents fetched from `/firms/{firmId}/matters/{matterId}/evidence`
5. For each evidence document:
   - Embedded source metadata fields used for built-in columns
   - Embedded `tags` map used for category tag values (no subcollection queries)
6. All categories merged into `allColumns` computed property (Documents.vue:179-207)
7. Data rendered in virtual table with column management features

### Future Enhancement

**Category Hierarchy Logic**: When the same category ID exists at multiple levels (system, firm, matter), implement precedence rules to determine which category definition takes priority.

## Performance Considerations

### Virtual Scrolling

The table uses TanStack Vue Virtual for high-performance rendering:
- Only visible rows + overscan are rendered in DOM
- Supports 10,000+ documents without performance degradation
- FPS monitoring in development for performance tracking

### Category Loading Strategy

**Current Implementation** (All Category Types):
- Three parallel queries: system, firm, matter categories
- Single optimized query for evidence documents with embedded tags (uploadService.js:28-33)
- No subcollection queries - all tag values from embedded `evidence.tags` map
- ~50-200 categories possible
- Performance optimization: embedded tags eliminate N×M subcollection queries (uploadService.js:43-50)

**Future Optimization** (if needed for 200+ categories):
- Implement category column virtualization
- Add category search/filter in column selector
- Consider pagination or lazy-loading for very large category sets

## Composables Used

The DocumentTable leverages several composables for table functionality:

- **`useColumnResize`**: Column width management and persistence
- **`useColumnDragDrop`**: Drag-and-drop column reordering
- **`useColumnVisibility`**: Show/hide column toggles
- **`useVirtualTable`**: TanStack Virtual integration for performance
- **`useColumnSort`**: Column sorting logic

**Location**: `src/composables/`

## Related Services

- **`uploadService.js`** (`src/services/uploadService.js`): Fetches evidence documents and tags
  - `fetchFiles()`: Main optimized query function for table data (single query with embedded tags)
- **`categoryService.js`** (`src/features/organizer/services/categoryService.js`): Category CRUD operations
  - `getActiveCategories()`: Fetch categories for a matter
  - Uses `matterId='general'` for firm-wide categories
- **`systemCategoryService.js`** (`src/features/organizer/services/systemCategoryService.js`): System category management
  - `getsystemcategories()`: Fetches all system categories from global collection

## Column Definition Structure

```javascript
{
  key: string,           // Column identifier (field name or categoryId)
  label: string,         // Display name in header
  defaultWidth: number   // Default column width in pixels
}
```

**Examples**:

```javascript
// Built-in column
{ key: 'fileName', label: 'Source File Name', defaultWidth: 300 }

// System category column
{ key: 'DocumentDate', label: 'Document Date', defaultWidth: 180 }

// Firm category column
{ key: 'ClientName', label: 'Client Name', defaultWidth: 180 }

// Matter category column
{ key: 'ExhibitNumber', label: 'Exhibit Number', defaultWidth: 150 }
```

## Testing

**Test Data**: Use dev console to create test categories at different levels:
- System: Seed via Firebase console to `/systemcategories`
- Firm: Create via Category Manager with `matterId='general'`
- Matter: Create via Category Manager with specific `matterId`

**Test Scenarios**:
1. Verify all built-in columns display correctly
2. Verify system category columns appear and show tag values
3. Verify firm category columns appear and show tag values
4. Verify matter category columns appear and show tag values
5. Test column reordering, resizing, visibility toggling
6. Test sorting by different column types
7. Test performance with 1000+ documents

## Common Pitfalls

**DO NOT**:
- Assume categories are stored at firm level (they're at matter level)
- Hardcode `matterId='general'` everywhere (use from matterViewStore)
- Forget to handle missing tag values (returns `null` from uploadService)
- Load all category types synchronously (use parallel fetching)
- Skip virtual scrolling for large datasets

**ALWAYS**:
- Check `isSystemCategory` field to distinguish system vs custom categories
- Use `getCategoryFieldName(category.type)` to get correct tag field name
- Handle Firestore timestamp formatting for date columns
- Consider category precedence rules when merging firm + matter categories
- Use virtual scrolling composable for 100+ rows

## Future Enhancements

### Category Precedence Rules

When same category exists at multiple levels:
1. **Matter categories** override firm and system
2. **Firm categories** override system
3. **System categories** are base defaults

### Category Filtering UI

Add UI to filter which category levels are shown:
- Toggle system categories on/off
- Toggle firm categories on/off
- Toggle matter categories on/off

### Performance Optimizations

For very large category sets (200+):
- Implement category column virtualization
- Add category search/filter in column selector
- Consider lazy-loading tag values on scroll

## Cross-References

- **Category Architecture**: `@docs/Features/Organizer/Categories/25-11-18-category-system-overview.md`
- **Evidence Document Structure**: `@docs/Features/Organizer/Data/25-11-18-evidence-schema.md`
- **File Lifecycle**: `@docs/Features/Upload/Processing/file-lifecycle.md`
- **Authentication & Firm Context**: `@docs/Features/Authentication/25-11-18-auth-state-machine.md`
- **Solo Firm Matters**: `@docs/Features/Matters/solo-firm-matters.md`

# Title-Drawer Pattern DRY Refactoring - Implementation Plan

## Context & Problem

Significant duplication exists across 5+ pages for:
- Gradient background (identical CSS, ~50 lines)
- Title-drawer HTML/CSS structure (identical pattern)
- Sticky table headers (similar patterns with variations)
- Scroll container pattern

## User Decisions (FINALIZED)

1. **Title-drawer bottom padding**: `20px 24px 10px 24px` (Facts page version with 10px bottom)
2. **Sticky header background**: `#e0f2fe` (light blue/cyan "cloudy sky")
3. **Sticky header top offset**: `top: 0` (stick to scroll container top)
4. **Box shadow**: Multi-directional shadow from Facts/Pleadings:
   ```css
   box-shadow:
     0 -3px 6px rgba(0, 0, 0, 0.08),
     -2px 0 4px rgba(0, 0, 0, 0.03),
     2px 0 4px rgba(0, 0, 0, 0.03);
   ```
5. **Upload page**: Refactor to use same title-drawer pattern as other pages
6. **Sticky footer**: Upload-specific only (no other tables have footers)
7. **Component location**: `src/shared/components/layout/` (follows existing pattern)
8. **Gradient height**: `800px` is intentional (arbitrary design choice, keep as-is)

## Files with Duplication (Reference)

### Gradient Background - Identical in:
- `src/features/matters/views/Matters.vue:639-648`
- `src/features/facts/views/Facts.vue:63-72`
- `src/features/pleadings/views/Pleadings.vue:91-100`
- `src/features/documents/views/ViewDocument.vue:346-355`
- `src/features/upload/components/UploadTableVirtualizer.vue:49-50`

### Title-Drawer Pattern - Nearly identical in:
- `src/features/matters/views/Matters.vue:650-671`
- `src/features/facts/views/Facts.vue:74-95`
- `src/features/pleadings/views/Pleadings.vue:102-123`
- `src/features/documents/views/ViewDocument.vue:357-378`

### Sticky Headers - Need standardization:
- `src/features/facts/components/FactsTable.vue` (lines 4-5, uses #e0f2fe)
- `src/features/pleadings/components/PleadingsTable.vue` (lines 4-5, uses #e0f2fe)
- `src/features/matters/views/Matters.vue:678-685` (uses #f9fafb, needs update to #e0f2fe)
- `src/features/upload/components/UploadTableHeader.vue:93-101` (uses #f9fafb + top: 56px, needs update)

## Implementation Plan

### Phase 1: Create Shared Components

#### ✅ COMPLETED: PageLayout.vue
- Location: `src/shared/components/layout/PageLayout.vue`
- Provides: scroll-container + gradient-background
- Already created

#### TODO: TitleDrawer.vue
- Location: `src/shared/components/layout/TitleDrawer.vue`
- Props:
  - `title` (string, required)
  - `bottomPadding` (string, default: '10px')
- Slot: Default slot for controls/buttons
- CSS: Use Facts page version with configurable bottom padding

#### TODO: Shared Sticky Header CSS
- Create: `src/shared/styles/sticky-table-header.css` (or add to existing shared CSS)
- Export class: `.sticky-table-header`
- Background: `#e0f2fe`
- Box shadow: Multi-directional version from Facts/Pleadings
- Position: `sticky`, `top: 0`, `z-index: 10`

### Phase 2: Refactor Pages to Use New Components

#### Page Refactoring Order:
1. **Matters.vue** - Simplest, good test case
2. **Facts.vue** - Reference implementation
3. **Pleadings.vue** - Has sticky tabs between title-drawer and table
4. **ViewDocument.vue** - Custom grid layout
5. **Upload.vue** - Most complex, needs structural changes

#### For Each Page:
- Replace scroll-container + gradient-background with `<PageLayout>`
- Replace title-drawer div with `<TitleDrawer :title="...">`
- Move controls into TitleDrawer slot
- Import components from `@/shared/components/layout/`

### Phase 3: Standardize Sticky Headers

#### FactsTable.vue & PleadingsTable.vue:
- Already use `#e0f2fe` - just refactor to use shared CSS class
- Replace inline styles with `.sticky-table-header` class

#### Matters.vue:
- Change background from `#f9fafb` to `#e0f2fe`
- Replace `.matters-table-header` with shared `.sticky-table-header` class

#### UploadTableHeader.vue:
- Change background from `#f9fafb` to `#e0f2fe`
- Change `top: 56px` to `top: 0` (after Upload page uses PageLayout)
- Replace custom styles with shared `.sticky-table-header` class

### Phase 4: Upload Page Special Handling

**Current state**: Upload doesn't use title-drawer pattern at all

**Changes needed**:
1. Wrap entire Upload.vue content in `<PageLayout>`
2. Add `<TitleDrawer title="Upload Queue">` with upload controls
3. Update `UploadTableVirtualizer.vue` to remove duplicate gradient
4. Update `UploadTableHeader.vue` to use `top: 0` instead of `top: 56px`
5. Keep `UploadTableFooter.vue` as-is (Upload-specific sticky footer)

## Testing Checklist

After refactoring each page, verify:
- [ ] Gradient background renders correctly
- [ ] Title-drawer has correct padding and styling
- [ ] Text shadow visible on title
- [ ] Controls positioned correctly in title-drawer
- [ ] Table header sticks at top when scrolling
- [ ] Header background is `#e0f2fe` (light blue/cyan)
- [ ] Box shadow renders with multi-directional effect
- [ ] No visual regressions compared to before

## Key Implementation Notes

1. **Pleadings page has sticky tabs**: ProceedingsTabs component between title-drawer and table - preserve this
2. **Upload footer**: Only page with sticky footer - don't add to others
3. **Z-index layering**: gradient (0) → title-drawer (1) → sticky elements (10)
4. **Import paths**: Use `@/shared/components/layout/` for new components
5. **Gradient is intentional**: 800px height is arbitrary but keep as-is per user decision

## Current Progress

- ✅ PageLayout.vue created
- ⏸️ Paused before creating TitleDrawer.vue (interruption for context handoff)

## Next Steps

1. Create TitleDrawer.vue component
2. Create shared sticky-table-header CSS
3. Begin page refactoring starting with Matters.vue
4. Test each page after refactoring
5. Commit when all pages refactored and tested

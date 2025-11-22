# TanStack Virtual File Table - Layout Mockup

## Viewport Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Browser Window (Full Viewport)                                              │
│                                                                              │
│  ┌──┐  ┌──────────────────────────────────────────────────────────────────┐│
│  │  │  │ AppHeader (Fixed - 80px height)                                   ││
│  │  │  │  Home  |  Matters  |  Upload  |  Analyze  |  [User Menu]         ││
│  │  │  └──────────────────────────────────────────────────────────────────┘│
│  │  │                                                                        │
│  │A │  ┌──────────────────────────────────────────────────────────────────┐│
│  │p │  │ TABLE CONTAINER (calc(100vh - 80px))                              ││
│  │p │  │                                                                    ││
│  │  │  │ ┌────────────────────────────────────────────────────────────┐  ││
│  │S │  │ │ TABLE HEADER (Sticky, scrolls horizontally with table)     │  ││
│  │i │  │ │                                                              │  ││
│  │d │  │ │  File Type │ File Name         │ Size │ Date │ ... [▼Cols] │  ││
│  │e │  │ │  ─────────────────────────────────────────────────────────  │  ││
│  │b │  │ └────────────────────────────────────────────────────────────┘  ││
│  │a │  │                                                                    ││
│  │r │  │ ┌────────────────────────────────────────────────────────────┐  ││
│  │  │  │ │ VIRTUALIZED TABLE BODY (Scrolls both H + V)                │  ││
│  │6 │  │ │                                                              │  ││
│  │0 │  │ │  PDF  │ contract_2024.pdf  │ 2.4MB │ 2024-10 │ ...         │  ││
│  │p │  │ │  DOCX │ meeting_notes.docx │ 124KB │ 2024-10 │ ...         │  ││
│  │x │  │ │  PDF  │ invoice_001.pdf    │ 856KB │ 2024-09 │ ...         │  ││
│  │  │  │ │  ...  │ ...                │ ...   │ ...     │ ...         │  ││
│  │  │  │ │  ...  │ ...                │ ...   │ ...     │ ...         │  ││
│  │  │  │ │  (Only visible rows rendered - virtual scrolling)          │  ││
│  │  │  │ │                                                              │  ││
│  │  │  │ │                                                              │◄─┼─ Vertical
│  │  │  │ │                                                              │  │  Scrollbar
│  │  │  │ └────────────────────────────────────────────────────────────┘  ││
│  │  │  │                                                                    ││
│  │  │  │ └──────────────────────────────────────────────────────────────┘ ││
│  │  │  │                         ▲                                          │
│  │  │  │                         └─ Horizontal Scrollbar                   │
│  └──┘  └──────────────────────────────────────────────────────────────────┘│
│         (Scrollbar appears here when columns exceed viewport width)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Layout Features

### 1. **AppSidebar (Fixed Left - 60px width)**
- Remains fixed on the left
- Does NOT scroll with table
- Contains navigation icons

### 2. **AppHeader (Fixed Top - 80px height)**
- Remains fixed at top
- Contains app navigation
- Does NOT scroll

### 3. **Main Content Area**
- Position: `margin-left: 60px; margin-top: 80px`
- Dimensions: `calc(100vw - 60px)` × `calc(100vh - 80px)`
- Contains the entire table component

### 4. **Table Container**
- Fills entire main content area
- No padding/margins (maximize space)
- Height: `100%` of available space

### 5. **Table Header (Sticky)**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ File Type │ File Name              │ Size  │ Date       │ ... │ [▼ Cols] │
│           │                         │       │            │     │          │
│  (Badge)  │  (Text + Tooltip)      │ (Fmt) │ (Fmt Date) │ ... │ (Button) │
└──────────────────────────────────────────────────────────────────────────┘
    80px         minmax(200px,2fr)     100px     120px      ...     60px
```

**Header Features:**
- `position: sticky; top: 0; z-index: 10`
- Scrolls horizontally WITH the table content
- Remains visible when scrolling vertically
- **Column selector integrated on the right**: Small dropdown button labeled "Cols ▼"

### 6. **Column Selector (Integrated in Header)**
```
┌────────────────────────────────────┐
│ [▼ Columns]  ◄── Button in header │
└────────────────────────────────────┘
        │
        ▼ (Clicking opens popover below)
┌─────────────────────────────────────┐
│ ☑ File Type                         │
│ ☑ File Name       (required)        │
│ ☑ File Size                         │
│ ☑ Document Date                     │
│ ☐ Privilege                         │
│ ☑ Description                       │
│ ☐ Document Type                     │
│ ☐ Author                            │
│ ☐ Custodian                         │
│ ─────────────────                   │
│ [ Reset to Defaults ]               │
└─────────────────────────────────────┘
```

**Popover Positioning:**
- Anchored to the "Columns" button in header
- Floats above table content
- Uses Vuetify's `v-menu` or similar
- Closes after selection or click outside

## Scrolling Behavior

### Vertical Scrolling
- **What scrolls**: Table body rows
- **What stays fixed**:
  - AppSidebar (left)
  - AppHeader (top)
  - Table header (sticky within scroll container)
- **Virtualization**: Only renders ~20 rows in viewport (+ buffer)

### Horizontal Scrolling
- **What scrolls**:
  - Table header (in sync)
  - Table body
- **What stays fixed**:
  - AppSidebar (left)
  - AppHeader (top)
- **Virtualization**: Can virtualize columns if > 20 columns visible

## Detailed Component Structure

```
src/views/Analyze.vue (Page Container)
│
├─ Template Structure:
│  └─ <div class="analyze-page">           ← Full height container
│     └─ <TanStackFileTable />              ← Table fills container
│
└─ Styling:
   .analyze-page {
     height: calc(100vh - 80px);           ← Account for header
     width: calc(100vw - 60px);            ← Account for sidebar
     overflow: hidden;                      ← Prevent double scrollbars
   }
```

```
src/features/organizer/components/TanStackFileTable.vue
│
├─ <div class="table-wrapper">             ← Outer container
│  │
│  ├─ <div class="table-header">           ← Sticky header
│  │  ├─ Column headers (dynamic)
│  │  └─ <ColumnSelectorButton />          ← Integrated in header
│  │     └─ <v-menu>                       ← Popover overlay
│  │        └─ Column checkboxes
│  │
│  └─ <div class="table-body">             ← Scroll container
│     └─ TanStack Virtualizer renders here
│        ├─ Virtual rows (vertical)
│        └─ Virtual columns (horizontal)
```

## CSS Layout Strategy

```css
/* Page fills available space after sidebar/header */
.analyze-page {
  height: calc(100vh - 80px);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Table wrapper fills page */
.table-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e5e7eb;
}

/* Sticky header */
.table-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: hidden;  /* Controlled by body scroll */
  flex-shrink: 0;
}

/* Scrollable body */
.table-body {
  flex: 1;
  overflow: auto;  /* Both horizontal and vertical */
  position: relative;
}
```

## Space Utilization Breakdown

| Component | Width | Height | Scrollable |
|-----------|-------|--------|------------|
| AppSidebar | 60px | 100vh | No |
| AppHeader | 100vw | 80px | No |
| Table Area | calc(100vw - 60px) | calc(100vh - 80px) | Yes (H+V) |
| Table Header | 100% | ~50px | Horizontal only |
| Table Body | 100% | calc(100% - 50px) | Both |

## Benefits of This Layout

1. **Maximum Space**: No wasted padding/margins around table
2. **Integrated Controls**: Column selector in header = no separate toolbar
3. **Sticky Header**: Always visible during vertical scroll
4. **Synchronized Scroll**: Header scrolls horizontally with body
5. **No Double Scrollbars**: Only table scrolls, not the page
6. **Clean UX**: Minimal UI chrome, focus on data

## Comparison to Current `/produce` Page

| Feature | `/produce` (Current) | `/analyze` (New) |
|---------|-------------------|------------------|
| Virtual Scrolling | Vertical only | Vertical + Horizontal |
| Column Selector | Separate toolbar | Integrated in header |
| Space Usage | Padding/margins | Full viewport |
| Horizontal Scroll | Broken | Working |
| Performance | Good (vue-virtual-scroller) | Better (TanStack) |
| Technology | vue-virtual-scroller | @tanstack/vue-virtual |

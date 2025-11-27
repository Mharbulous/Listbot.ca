# Responsive Overlapping Folder Tabs - Best Practices

**Date:** 2025-11-22
**Updated:** 2025-11-27
**Topic:** Implementing browser-style skeuomorphic tabs with responsive overlap behavior and sticky table headers

## Problem Statement

How do you create folder-style tabs that:
1. **Left-align with gaps** when space allows
2. **Overlap each other** when space is constrained
3. **Stack with rightmost tabs on top** (like browser tabs)
4. Transition smoothly between these states
5. Never exceed container width (no horizontal scrollbar)
6. **Support sticky table headers** that stick below the tabs when scrolling

## âœ… PROVEN TECHNIQUE: Wrapper-Based Overflow (RECOMMENDED)

**Status:** Successfully implemented in production (ProceedingsTabs.vue)
**Example:** See `docs/Front-End/25-11-22-Adaptive-folder-tabs.md`

This is the **CSS-only** approach that actually works. The key insight is using a **two-layer structure** where wrappers shrink but buttons stay fixed.

### Core Concept

**Each tab has TWO elements:**
1. **Wrapper element** (e.g., `<div>` or `<li>`) - SHRINKS adaptively
2. **Button inside wrapper** - FIXED width (e.g., 220px), never shrinks

**When wrapper shrinks below button width:**
- Button OVERFLOWS its wrapper container
- Creates automatic overlap with next tab
- Pure CSS, no JavaScript needed for overlap

### HTML Structure

```html
<div class="tabs-container">
  <!-- Tab 1 wrapper -->
  <div class="tab-wrapper">
    <button class="tab-button">Tab 1</button>
  </div>

  <!-- Tab 2 wrapper -->
  <div class="tab-wrapper">
    <button class="tab-button">Tab 2</button>
  </div>

  <!-- Super spacer - absorbs space first -->
  <div class="super-spacer"></div>

  <!-- ALL tab - never shrinks -->
  <div class="all-tab-wrapper">
    <button class="all-tab-button">ALL</button>
  </div>
</div>
```

### CSS Pattern (The Correct Way)

```css
/* Container */
.tabs-container {
  display: flex;
  align-items: flex-end;
  width: 100%;
  overflow: visible; /* Allow buttons to overflow */
}

/* Tab Wrapper - This SHRINKS */
.tab-wrapper {
  position: relative;
  flex-shrink: 1;          /* Can shrink */
  flex-basis: 220px;       /* Preferred width */
  min-width: 0;            /* KEY! Allows shrinking below 220px */
  margin-right: 8px;       /* Spacing between tabs */
}

/* Last wrapper gets a floor to prevent complete collapse */
.tab-wrapper:last-of-type {
  min-width: 140px;
}

/* Hover brings wrapper to front */
.tab-wrapper:hover {
  z-index: 100;
}

/* Tab Button - FIXED WIDTH (creates overflow) */
.tab-button {
  width: 220px;  /* FIXED - never shrinks! */
  height: 64px;
  /* Styling omitted for brevity */
}

/* Super Spacer - Shrinks FIRST (high shrink value) */
.super-spacer {
  flex-grow: 1;
  flex-shrink: 10000;  /* Very high - shrinks before tabs */
  min-width: 0;
}

/* ALL tab wrapper - NEVER shrinks */
.all-tab-wrapper {
  flex-shrink: 0;
  position: relative;
}

.all-tab-button {
  width: 80px;  /* Fixed width */
  height: 60px;
}
```

### Vue 3 Implementation Example

```vue
<template>
  <div class="tabs-container">
    <!-- Tab wrappers that shrink -->
    <div
      v-for="(tab, index) in tabs"
      :key="tab.id"
      class="tab-wrapper"
      :class="{ 'last-tab-wrapper': index === tabs.length - 1 }"
      :style="{ zIndex: isActive(tab.id) ? 100 : index + 1 }"
    >
      <button
        @click="selectTab(tab.id)"
        class="tab-button"
        :class="{ active: isActive(tab.id) }"
      >
        {{ tab.title }}
      </button>
    </div>

    <!-- Super spacer -->
    <div class="super-spacer"></div>

    <!-- ALL tab -->
    <div class="all-tab-wrapper">
      <button @click="selectTab(null)" class="all-tab-button">
        ALL
      </button>
    </div>
  </div>
</template>

<style scoped>
.tab-wrapper {
  position: relative;
  flex-shrink: 1;
  flex-basis: 220px;
  min-width: 0;
  margin-right: 8px;
}

.last-tab-wrapper {
  min-width: 140px;
}

.tab-button {
  width: 220px; /* Fixed - never shrinks */
  height: 64px;
}

.super-spacer {
  flex-grow: 1;
  flex-shrink: 10000;
  min-width: 0;
}

.all-tab-wrapper {
  flex-shrink: 0;
}
</style>
```

### How Overlap Works (Step-by-Step)

1. **Wide container (lots of space):**
   - Super spacer absorbs extra space
   - All tab wrappers stay at full 220px width
   - Buttons fit perfectly in wrappers
   - Tabs have 8px gaps between them (margin-right)

2. **Container starts shrinking:**
   - Super spacer shrinks first (shrink: 10000)
   - Tab wrappers still at 220px
   - No overlap yet

3. **Spacer exhausted, container continues shrinking:**
   - Tab wrappers start shrinking (e.g., 220px â†’ 200px â†’ 180px)
   - Buttons stay at FIXED 220px width
   - Buttons overflow their wrappers
   - **Example:** Wrapper is 180px, button is 220px = 40px overflow
   - Next wrapper is 8px away (margin-right)
   - **Result:** ~32px overlap with next tab

4. **Container very narrow:**
   - Tab wrappers shrink to minimum (140px for last tab, 0px for others)
   - Buttons still 220px wide
   - Maximum overlap achieved
   - ALL tab stays full 80px (never shrinks)

### Why This Works Better Than Other Approaches

âœ… **Advantages:**
- Pure CSS (no JavaScript needed for overlap detection)
- Smooth, automatic adaptation to any container width
- True overlap (not just negative margins)
- No layout shifts or recalculations
- Works with flexbox naturally
- Easy to understand and maintain

âŒ **What NOT to do:**
- Don't make buttons shrink (flex-shrink on button) - this squeezes but doesn't overlap
- Don't use negative margins - harder to control and less predictable
- Don't use JavaScript for overlap detection - unnecessary complexity

### Critical Implementation Details

1. **`min-width: 0` is ESSENTIAL** on tab wrappers
   - Default flex minimum is `auto` (content size)
   - `min-width: 0` allows shrinking below content/button size
   - Without this, wrappers won't shrink below 220px

2. **Last wrapper gets `min-width: 140px`**
   - Prevents the last tab from completely disappearing
   - Ensures at least one tab is always readable

3. **Super spacer gets very high shrink value (10000)**
   - Ensures it shrinks completely before tabs start overlapping
   - Creates two-phase behavior: normal â†’ overlapping

4. **Z-index layering:**
   - Base z-index increases left-to-right (1, 2, 3...)
   - Active tab: z-index: 100
   - Hovered tab: z-index: 99 or 100
   - This mimics physical folder tabs

5. **Content container MUST have intermediate z-index (CRITICAL!):**
   - Content container (below tabs): `position: relative; z-index: 25;`
   - This creates the folder-tab metaphor:
     - Inactive tabs (z-index 1-10) appear **behind** the content
     - Active tab (z-index 100) appears **in front** of the content
     - Makes it look like the active tab is "attached" to the content area
   - **Without this**, all tabs will appear behind or in front of content - breaking the visual effect
   ```css
   .content-container {
     position: relative;
     z-index: 25; /* Higher than inactive tabs, lower than active tab */
     border: 1px solid #cbd5e1;
     border-top: none; /* Tab connects to content */
     border-radius: 0 0 12px 12px; /* Square top corners, rounded bottom corners */
   }
   ```

6. **Text truncation inside buttons:**
   ```css
   .tab-content {
     overflow: hidden;
     text-overflow: ellipsis;
     white-space: nowrap;
   }
   ```

### Common Mistakes to Avoid

âŒ **WRONG - Making button shrink:**
```css
.tab-button {
  flex-shrink: 1;  /* NO! Button will squeeze, not overlap */
  width: 220px;
}
```

âœ… **CORRECT - Only wrapper shrinks:**
```css
.tab-wrapper {
  flex-shrink: 1;  /* YES! Wrapper shrinks */
}

.tab-button {
  width: 220px;  /* Fixed - no flex properties */
}
```

---

âŒ **WRONG - Parent wrapper with z-index creates stacking context:**
```html
<!-- Import Tabs -->
<ImportTabs v-model="activeTab" />

<!-- Tabbed Import Content -->
<div class="mx-6 mb-6 relative z-0">  <!-- âŒ PROBLEM: relative z-0 -->
  <div class="content-container">
    <!-- Content here -->
  </div>
</div>
```

**Problem:** The `relative z-0` on the parent wrapper creates a **new stacking context** that isolates all child elements (including `.content-container` with `z-index: 25`) from the tabs above. This prevents the folder-tab layering effect from working - all tabs will appear at the same visual layer as the content.

âœ… **CORRECT - No z-index isolation on parent wrapper:**
```html
<!-- Import Tabs -->
<ImportTabs v-model="activeTab" />

<!-- Tabbed Import Content -->
<div class="mx-6 mb-6">  <!-- âœ… No relative z-0 -->
  <div class="content-container">
    <!-- Content here -->
  </div>
</div>
```

**Key Principle:** The **tabs and content container must be in the same stacking context** to compete for z-index positioning. Any parent element between them that has `position: relative/absolute` AND a `z-index` value will create a barrier that breaks the layering.

**What creates a new stacking context:**
- `position: relative/absolute/fixed` + ANY `z-index` value (including `z-0`)
- `position: sticky` + ANY `z-index` value
- `opacity` less than 1
- `transform`, `filter`, `perspective` properties
- `isolation: isolate`

**When to be careful:**
- When applying Tailwind classes like `relative z-0` or `relative z-10` to wrappers
- When using CSS-in-JS that might add positioning by default
- When wrapping components in layout divs that have stacking context properties

**Reference:** See the fix in `MatterImport.vue` (commit da8c278) where removing `relative z-0` from the wrapper fixed the tab layering.

---

## âš ï¸ CRITICAL: The `position: sticky` Stacking Context Trap

**Date Added:** 2025-11-27
**Status:** Production-proven fix

### The Problem

If your tabs container uses `position: sticky` (e.g., to keep tabs visible while scrolling), you will encounter a **stacking context isolation problem** that breaks the folder-tab z-index layering effect.

**Why it happens:** Per the CSS specification, `position: sticky` **ALWAYS creates a new stacking context**, even without an explicit `z-index`. This means:

```
BROKEN STRUCTURE:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ .import-tabs-sticky (position: sticky)  â”‚  â† Creates ISOLATED stacking context
â”‚   â””â”€â”€ tab wrappers (z-index: 1-100)     â”‚  â† Can only compete with EACH OTHER
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                    â†• Z-INDEX CANNOT COMPETE ACROSS THIS BOUNDARY!
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ .content-container (z-index: 25)        â”‚  â† Different stacking context
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Symptoms:**
- ALL tabs appear behind the content container (or all in front)
- Changing z-index values on tabs has no effect relative to content
- Active tab doesn't appear "in front of" the content header
- The folder-tab metaphor is completely broken

### Failed Approaches (Don't Try These)

âŒ **Setting z-index on the sticky container:**
```css
.import-tabs-sticky {
  position: sticky;
  z-index: 50; /* Makes ALL tabs appear in front - not what we want */
}
```

âŒ **Removing z-index from the sticky container:**
```css
.import-tabs-sticky {
  position: sticky;
  /* No z-index - but sticky STILL creates stacking context! */
}
```

âŒ **Adjusting individual tab z-index values:**
```javascript
// Doesn't matter what values you use - they can't escape the sticky context
zIndex: isActive ? 9999 : index + 1
```

### âœ… THE SOLUTION: Slot-Based Shared Stacking Context

**The fix:** Put both the tabs AND the content container **inside the same parent element**. Use a Vue slot (or React children) to achieve this while keeping components modular.

```
FIXED STRUCTURE:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ .import-tabs-wrapper (position: relative)       â”‚  â† SINGLE stacking context
â”‚   â”œâ”€â”€ .import-tabs-row                          â”‚
â”‚   â”‚     â””â”€â”€ tab wrappers (z-index: 1-100)       â”‚  â† NOW competes with content!
â”‚   â””â”€â”€ <slot name="content">                     â”‚
â”‚         â””â”€â”€ .content-container (z-index: 25)    â”‚  â† SAME stacking context
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Result:**
- Active tab (z-index: 100) > Content (z-index: 25) = **Tab appears IN FRONT** âœ…
- Inactive tabs (z-index: 1-10) < Content (z-index: 25) = **Tabs appear BEHIND** âœ…

### Vue 3 Implementation

**ImportTabs.vue - Add wrapper and content slot:**
```vue
<template>
  <!-- Wrapper creates single stacking context for both tabs and content -->
  <div class="import-tabs-wrapper">
    <div class="import-tabs-row px-6">
      <div class="tabs-container">
        <!-- Tab wrappers here -->
        <div
          v-for="(tab, index) in tabs"
          :key="tab.value"
          class="tab-wrapper"
          :style="{ zIndex: isActive(tab.value) ? 100 : index + 1 }"
        >
          <button
            @click="selectTab(tab.value)"
            class="folder-tab"
            :class="isActive(tab.value) ? 'folder-tab-active' : 'folder-tab-inactive'"
          >
            {{ tab.label }}
          </button>
        </div>
        
        <!-- Super spacer and other tabs... -->
      </div>
    </div>
    
    <!-- Content slot - NOW IN SAME STACKING CONTEXT AS TABS -->
    <slot name="content"></slot>
  </div>
</template>

<style scoped>
/* Wrapper - creates single stacking context */
.import-tabs-wrapper {
  position: relative;
  /* NO position: sticky here! */
}

/* Tabs row - no sticky positioning */
.import-tabs-row {
  position: relative;
  background: transparent;
}

/* Rest of tab styles unchanged... */
</style>
```

**MatterImport.vue - Pass content through slot:**
```vue
<template>
  <PageLayout>
    <TitleDrawer title="Bulk Import">
      <!-- Header content -->
    </TitleDrawer>

    <!-- Tabs now WRAP the content via slot -->
    <ImportTabs v-model="activeTab">
      <template #content>
        <div class="mx-6 mb-6">
          <div class="content-container">
            <!-- Table content here -->
          </div>
        </div>
      </template>
    </ImportTabs>
  </PageLayout>
</template>

<style scoped>
.content-container {
  position: relative;
  z-index: 25; /* Now competes with tabs in SAME stacking context */
  background: white;
  border: 1px solid #cbd5e1;
  border-top: none;
  border-radius: 0 0 12px 12px;
}
</style>
```

### If You Still Need Sticky Behavior

If you need the tabs to stick to the top while scrolling, you have options:

**Option A: Make the entire wrapper sticky**
```css
.import-tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 50; /* Entire section (tabs + visible content) sticks together */
}
```
Note: This makes the whole tabbed section sticky, not just the tabs row.

**Option B: Accept the visual tradeoff**
Keep tabs sticky but use design tricks (matching colors, shadows, border manipulation) to create the illusion of connection without actual z-index layering.

**Option C: JavaScript scroll detection**
Dynamically toggle the visual effect based on scroll position - more complex but allows true sticky tabs with layering effect when not scrolled.

### Quick Reference: What Creates Stacking Context

Per CSS spec, these properties create a new stacking context (isolating children from competing with outside elements):

| Property | Creates Stacking Context? |
|----------|--------------------------|
| `position: sticky` | âœ… **ALWAYS** (even without z-index!) |
| `position: fixed` | âœ… Always |
| `position: relative` + `z-index` | âœ… When both present |
| `position: absolute` + `z-index` | âœ… When both present |
| `opacity: 0.99` (or less than 1) | âœ… Always |
| `transform: any` | âœ… Always |
| `filter: any` | âœ… Always |
| `isolation: isolate` | âœ… Always |
| `will-change: transform` | âœ… Always |
| `contain: layout` or `paint` | âœ… Always |

**Key insight:** `position: sticky` is the sneakiest because it creates a stacking context **even without a z-index value**, unlike `position: relative` which only creates one when combined with z-index.

**Reference:** See fix implemented in `ImportTabs.vue` and `MatterImport.vue` (2025-11-27)

---

## ðŸš¨ COMMON PROBLEMS & FIXES (Lessons from Production)

**Date Added:** 2025-11-27
**Context:** Fixes applied to pleadings page tabs (commits 5057266, ca827cd, 5d53f29)

When implementing skeuomorphic tabs, you may encounter these specific issues. Here are the proven fixes:

### Problem 1: Hover Z-Index Override Breaking Tab Layering

**Symptom:** When hovering over inactive tabs, they jump in front of the content container (breaking the folder-tab metaphor).

**Root Cause:** CSS hover rules with `!important` override the carefully orchestrated z-index values:
```css
/* âŒ WRONG - Forces hovered tab in front of content */
.tab-wrapper:hover {
  z-index: 100 !important;
}
```

**The Fix:** Remove `!important` hover overrides. Instead, set hover z-index through JavaScript state:
```javascript
const Z_INDEX_ACTIVE = 100;
const Z_INDEX_HOVERED = 20;  // Higher than inactive (1-10) but LOWER than content (25)
const Z_INDEX_CONTENT = 25;

const getTabWrapperStyle = (tabId) => {
  let zIndex = 1;
  if (isActive(tabId)) {
    zIndex = Z_INDEX_ACTIVE;  // 100: In front of everything
  } else if (isHovered(tabId)) {
    zIndex = Z_INDEX_HOVERED;  // 20: In front of other inactive tabs, but BEHIND content
  } else {
    zIndex = index + 1;  // 1-10: Behind content
  }
  return { zIndex };
};
```

**Key Principle:** Hovered inactive tabs should be `Z_INDEX_HOVERED (20) < Z_INDEX_CONTENT (25) < Z_INDEX_ACTIVE (100)`.

**Reference:** Fixed in commit ca827cd

---

### Problem 2: Box Shadows Breaking Visual Seamlessness

**Symptom:** Active tab appears to "float" above content instead of being seamlessly connected. Color rendering doesn't match between active tab and table header.

**Root Cause:** Box shadows and gradient backgrounds create visual artifacts:
```css
/* âŒ WRONG - Creates visual separation */
.folder-tab {
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.folder-tab-active {
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
  box-shadow:
    0 -3px 6px rgba(0, 0, 0, 0.08),
    -2px 0 4px rgba(0, 0, 0, 0.03),
    2px 0 4px rgba(0, 0, 0, 0.03);
}
```

**The Fix:** Use solid colors and remove box shadows from tabs (content container can have shadow):
```css
/* âœ… CORRECT - Clean, seamless appearance */
.folder-tab {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border: 1px solid #cbd5e1;
  border-bottom: none;
  /* NO box-shadow on base class */
}

.folder-tab-active {
  background: #e0f2fe;  /* Solid color - no gradient */
  transform: translateY(1px);
  border-color: #cbd5e1;
  /* NO box-shadow */
}

.folder-tab-inactive {
  background: #e2e8f0;  /* Solid color - no gradient */
  transform: translateY(4px);
}

.folder-tab-inactive:hover {
  background: #cbd5e1;  /* Solid color - no gradient */
  transform: translateY(2px);
}

/* Apply shadow to content container only */
.content-container {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
```

**Why This Works:**
- Solid colors ensure exact color matching between active tab and table header
- No visual "seam" or shadow artifacts between connected elements
- Content shadow creates depth without interfering with tab connection

**Reference:** Fixed in commit ca827cd

---

### Problem 3: Active Tab Vertical Alignment (Y-Axis Position)

**Symptom:** Active tab doesn't align tightly with content header - there's a visible gap or misalignment.

**Root Cause:** Conflicting `translateY` values on base class vs. specific tab type override:
```css
/* âŒ WRONG - Override creates 4px gap */
.folder-tab-active {
  transform: translateY(1px);  /* Base value */
}

.proceeding-tab.folder-tab-active {
  transform: translateY(5px);  /* Override pushes tab DOWN, away from content */
}
```

**The Fix:** Remove the specific override and let the base `translateY(1px)` apply to all active tabs:
```css
/* âœ… CORRECT - Single consistent value */
.folder-tab-active {
  transform: translateY(1px);  /* Moves tab UP 3px from inactive position */
}

/* Remove this override entirely */
/* .proceeding-tab.folder-tab-active {
  transform: translateY(5px);
} */

.folder-tab-inactive {
  transform: translateY(4px);  /* Inactive tabs sit lower */
}
```

**Visual Effect:**
- Inactive tabs: `translateY(4px)` - sit lower, appear "behind"
- Active tab: `translateY(1px)` - moves UP 3px, creating tight connection with content header
- The 3px difference creates the "pulling forward" effect

**Reference:** Fixed in commit 5d53f29

---

### Problem 4: Border Styling for Seamless Connection

**Symptom:** Visible border line between active tab and content, or no border separation between inactive tabs and content.

**The Complete Border Solution:**
```css
/* Tab styling */
.folder-tab {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border: 1px solid #cbd5e1;
  border-bottom: none;  /* âš ï¸ CRITICAL: No bottom border on tabs */
}

/* Content container */
.content-container {
  position: relative;
  z-index: 25;
  background: white;
  border: 1px solid #cbd5e1;
  border-top: none;  /* âš ï¸ CRITICAL: No top border on container */
  border-radius: 0 0 12px 12px;  /* Square top, rounded bottom */
}

/* Table header (inside content container) */
.sticky-table-header {
  background: #e0f2fe;  /* âš ï¸ CRITICAL: Same color as active tab */
  border-top: 1px solid #cbd5e1;  /* âš ï¸ CRITICAL: Creates separation for inactive tabs */
}
```

**How This Creates the Folder Effect:**

1. **Active tab (z-index 100) in front of content:**
   - Tab has no bottom border
   - Content has no top border
   - Tab background (#e0f2fe) flows seamlessly into table header background (#e0f2fe)
   - **Result:** No visible line = seamless connection âœ…

2. **Inactive tabs (z-index 1-10) behind content:**
   - Content container (z-index 25) overlaps inactive tabs
   - Table header's `border-top: 1px solid #cbd5e1` creates visible separation
   - **Result:** Visible line between inactive tab and content = tabs appear "behind" âœ…

**Visual Breakdown:**
```
ACTIVE TAB VIEW (z-index 100 > 25):
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Active Tab  â”‚ â† background: #e0f2fe, border-bottom: none
â”‚  (no line)  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â† NO VISIBLE LINE (both #e0f2fe, no borders)
â”‚Table Header â”‚ â† background: #e0f2fe, border-top creates line with inactive tabs
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

INACTIVE TAB VIEW (z-index 1-10 < 25):
    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
    â”‚Inactive Tab â”‚ â† background: #e2e8f0, gets covered by content
    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Content Edge   â”‚ â† border-top: 1px solid #cbd5e1 (VISIBLE LINE)
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Table Header   â”‚ â† background: #e0f2fe
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Reference:** Fixed in commit 5057266

---

### Quick Checklist: Implementing Tabs Without These Issues

When implementing new skeuomorphic tabs, verify:

- [ ] **No `!important` on hover z-index** - Use JavaScript state management instead
- [ ] **Hover z-index < content z-index** - Inactive tabs stay behind even when hovered (e.g., 20 < 25 < 100)
- [ ] **Solid background colors** - No gradients on tabs
- [ ] **No box-shadows on tabs** - Only on content container if needed
- [ ] **Single `translateY` value for active tabs** - No overrides creating gaps
- [ ] **Matching backgrounds** - Active tab color matches table header exactly
- [ ] **Border strategy:**
  - [ ] Tabs: `border-bottom: none`
  - [ ] Content container: `border-top: none`
  - [ ] Table header: `border-top: 1px solid` (creates line with inactive tabs)
- [ ] **Slot-based pattern** - Tabs and content in same stacking context
- [ ] **No `position: sticky` on tabs** - Use wrapper pattern if sticky needed

**Files to Reference:**
- `src/features/pleadings/components/ProceedingsTabs.vue` - Tabs component with slot
- `src/features/pleadings/components/PleadingsTable.vue` - Content container styling
- `src/features/pleadings/views/Pleadings.vue` - Parent view using slot pattern

---

## 📌 Sticky Table Headers Below Tabs

**Date Added:** 2025-11-27
**Status:** Implementation guidance for production use

### The Challenge

When you have folder tabs above a data table, you often want the **table header row to stick** to the visible area while scrolling through table rows. However, this introduces complexity:

1. **The table header must stick below the tabs**, not overlap them
2. **Z-index layering must be preserved** for the folder-tab metaphor
3. **The sticky position (`top` value) depends on which tab pattern you use**

```
DESIRED SCROLL BEHAVIOR:
┌─────────────────────────────────────┐
│ App Header (fixed, z-index: 100)    │ ← Always visible at top
├─────────────────────────────────────┤
│ Folder Tabs Row                     │ ← May be sticky or scroll away
├─────────────────────────────────────┤
│ Table Header (sticky)               │ ← Should stick BELOW tabs
├─────────────────────────────────────┤
│ Table Row 1                         │ ↑
│ Table Row 2                         │ │ Scrolls
│ Table Row 3                         │ │ under
│ ...                                 │ ↓ header
└─────────────────────────────────────┘
```

### Key Measurements

Before implementing, know your layout dimensions:

| Element | Height | Notes |
|---------|--------|-------|
| App Header | 64px | Fixed position, handled by PageLayout (`mt-16`) |
| Tab Container | ~80px | Height of `.tabs-container` |
| Active Tab | 64px | With `translateY(1px)` |
| Inactive Tab | 64px | With `translateY(4px)` |
| ALL Tab | 60px | Slightly shorter |

### Two Patterns, Two Solutions

The sticky table header implementation depends on which tab pattern you're using:

---

### Pattern A: Shared Stacking Context (ImportTabs)

**When tabs use the slot pattern (NOT sticky):**

In this pattern, the tabs wrapper is `position: relative` (not sticky), so the tabs scroll away with the content. The table header can use `top: 0` because when it starts sticking, the tabs have already scrolled out of view.

**Structure:**
```
PageLayout (scroll-container, overflow: auto)
  ├── TitleDrawer (scrolls away)
  ├── ImportTabs (wrapper, NOT sticky)
  │     └── [content slot]
  │           └── .content-container (z-index: 25)
  │                 └── table
  │                       └── thead.sticky-table-header (top: 0)
  └── Footer (scrolls away)
```

**CSS Implementation:**
```css
/* Content container - maintains folder-tab z-index layering */
.content-container {
  position: relative;
  z-index: 25;
  background: white;
  border: 1px solid #cbd5e1;
  border-top: none;
  border-radius: 0 0 12px 12px;
}

/* Table header sticks to top of scroll container */
.sticky-table-header {
  position: sticky;
  top: 0;
  z-index: 10; /* Below content container's z-index (25) */
  background: #e0f2fe; /* Matches active tab */
  border-top: 1px solid #cbd5e1;
}
```

**Why `top: 0` works here:**
- The scroll container is `PageLayout`'s `.scroll-container`
- When user scrolls, the tabs scroll away first
- By the time the table header needs to stick, tabs are out of view
- `top: 0` positions header at the top of the scroll container

**Z-index considerations:**
- Table header: `z-index: 10` — lower than content container (25)
- This ensures the header doesn't interfere with folder-tab layering
- The header is INSIDE the content container, so it inherits the stacking context

---

### Pattern B: Standalone Sticky Tabs (ProceedingsTabs)

**When tabs themselves are sticky:**

In this pattern, the tabs row uses `position: sticky; top: 0` and stays visible while scrolling. The table header must stick BELOW the tabs, requiring a calculated `top` value.

**Structure:**
```
PageLayout (scroll-container, overflow: auto)
  ├── TitleDrawer (scrolls away)
  ├── ProceedingsTabs (position: sticky, top: 0, z-index: 10)
  └── PleadingsTable
        └── .table-container (z-index: 25)
              └── table
                    └── thead.sticky-table-header (top: 80px) ← MUST account for tabs!
```

**CSS Implementation:**
```css
/* Tabs row - sticks at very top */
.proceeding-tabs-row {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white; /* Prevents content showing through */
}

/* Content container */
.table-container {
  position: relative;
  z-index: 25;
  background: white;
  border: 1px solid #cbd5e1;
  border-top: none;
  border-radius: 0 0 12px 12px;
}

/* Table header sticks BELOW the tabs */
.sticky-table-header {
  position: sticky;
  top: 80px; /* ⚠️ CRITICAL: Height of tabs container */
  z-index: 10;
  background: #e0f2fe;
  border-top: 1px solid #cbd5e1;
}
```

**Why `top: 80px` is needed:**
- Tabs stick at `top: 0` and occupy ~80px of height
- Table header must stick below that
- `top: 80px` = tabs height, so header appears immediately below tabs

**⚠️ CAUTION: Stacking Context Isolation**

Remember that `position: sticky` creates a stacking context! If your sticky tabs create an isolated stacking context, the folder-tab z-index layering effect (active tab in front, inactive behind) will be broken.

**Solutions:**
1. **Accept the tradeoff:** Use design techniques (matching colors, borders) to fake the connection
2. **Use the slot pattern:** Move to Pattern A if folder-tab layering is essential
3. **Hybrid approach:** See "Advanced: Conditional Sticky Behavior" below

---

### Vue 3 Implementation Examples

**Pattern A: Non-Sticky Tabs with Sticky Table Header**

```vue
<!-- ImportTabs.vue - Wrapper provides slot for content -->
<template>
  <div class="import-tabs-wrapper">
    <div class="import-tabs-row px-6">
      <div class="tabs-container">
        <!-- Tab buttons here -->
      </div>
    </div>
    
    <slot name="content"></slot>
  </div>
</template>

<style scoped>
.import-tabs-wrapper {
  position: relative; /* NOT sticky */
}
</style>
```

```vue
<!-- MatterImport.vue - Parent view -->
<template>
  <PageLayout>
    <ImportTabs v-model="activeTab">
      <template #content>
        <div class="mx-6 mb-6">
          <div class="content-container">
            <table>
              <thead class="sticky-table-header">
                <tr>
                  <th>Column 1</th>
                  <th>Column 2</th>
                </tr>
              </thead>
              <tbody>
                <!-- Table rows -->
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </ImportTabs>
  </PageLayout>
</template>

<style scoped>
.content-container {
  position: relative;
  z-index: 25;
  background: white;
  border: 1px solid #cbd5e1;
  border-top: none;
  border-radius: 0 0 12px 12px;
}

.sticky-table-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #e0f2fe;
  border-top: 1px solid #cbd5e1;
}
</style>
```

**Pattern B: Sticky Tabs with Sticky Table Header**

```vue
<!-- ProceedingsTabs.vue - Standalone sticky tabs -->
<template>
  <div class="proceeding-tabs-sticky">
    <div class="tabs-container">
      <!-- Tab buttons here -->
    </div>
  </div>
</template>

<style scoped>
.proceeding-tabs-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  height: 80px; /* Fixed height for predictable sticky offset */
}
</style>
```

```vue
<!-- Pleadings.vue - Parent view -->
<template>
  <PageLayout>
    <TitleDrawer title="Pleadings" />
    
    <ProceedingsTabs v-model="activeTab" />
    
    <div class="px-6 pb-6">
      <div class="table-container">
        <table>
          <thead class="sticky-table-header">
            <tr>
              <th>Column 1</th>
              <th>Column 2</th>
            </tr>
          </thead>
          <tbody>
            <!-- Table rows -->
          </tbody>
        </table>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.table-container {
  position: relative;
  z-index: 25;
  background: white;
  border: 1px solid #cbd5e1;
  border-top: none;
  border-radius: 0 0 12px 12px;
}

.sticky-table-header {
  position: sticky;
  top: 80px; /* Height of sticky tabs */
  z-index: 10;
  background: #e0f2fe;
  border-top: 1px solid #cbd5e1;
}
</style>
```

---

### Advanced: Dynamic Sticky Offset with CSS Custom Properties

For maintainability, use CSS custom properties to define the sticky offset:

```css
:root {
  --app-header-height: 64px;
  --tabs-container-height: 80px;
  --sticky-offset: 0px; /* Default for Pattern A */
}

/* When using Pattern B (sticky tabs), override the offset */
.has-sticky-tabs {
  --sticky-offset: var(--tabs-container-height);
}

.sticky-table-header {
  position: sticky;
  top: var(--sticky-offset);
  z-index: 10;
  background: #e0f2fe;
}
```

**Vue 3 with dynamic offset:**

```vue
<template>
  <div :class="{ 'has-sticky-tabs': useStickyTabs }">
    <!-- Content -->
  </div>
</template>

<script setup>
const useStickyTabs = ref(true); // Toggle based on your needs
</script>
```

---

### Advanced: Conditional Sticky Behavior (JavaScript)

For the best of both worlds — folder-tab layering when NOT scrolled, sticky tabs when scrolled — use JavaScript scroll detection:

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const isScrolled = ref(false);
const scrollThreshold = 100; // Pixels before tabs become sticky

const handleScroll = () => {
  const scrollContainer = document.querySelector('.scroll-container');
  isScrolled.value = scrollContainer.scrollTop > scrollThreshold;
};

onMounted(() => {
  const scrollContainer = document.querySelector('.scroll-container');
  scrollContainer.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  const scrollContainer = document.querySelector('.scroll-container');
  scrollContainer.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div 
    class="tabs-row"
    :class="{ 'tabs-row-sticky': isScrolled }"
  >
    <!-- Tabs -->
  </div>
</template>

<style scoped>
.tabs-row {
  position: relative; /* Default: not sticky, folder-tab layering works */
}

.tabs-row-sticky {
  position: sticky;
  top: 0;
  z-index: 50; /* High enough to cover content when sticky */
}
</style>
```

**Trade-offs:**
- ✅ Full folder-tab layering when not scrolled
- ✅ Sticky tabs when scrolled down
- ⚠️ More complex implementation
- ⚠️ Visual "snap" when switching between modes

---

### Common Mistakes with Sticky Table Headers

❌ **WRONG - Table header overlaps sticky tabs:**
```css
.sticky-table-header {
  position: sticky;
  top: 0; /* Will overlap tabs when Pattern B is used! */
}
```

✅ **CORRECT - Account for tabs height:**
```css
.sticky-table-header {
  position: sticky;
  top: 80px; /* Matches tabs container height */
}
```

---

❌ **WRONG - Table header z-index too high:**
```css
.sticky-table-header {
  position: sticky;
  z-index: 100; /* Competes with active tab! */
}
```

✅ **CORRECT - Table header z-index below content container:**
```css
.sticky-table-header {
  position: sticky;
  z-index: 10; /* Lower than content container (25) and active tab (100) */
}
```

---

❌ **WRONG - Background color mismatch:**
```css
.sticky-table-header {
  background: white; /* Doesn't match active tab (#e0f2fe) */
}
```

✅ **CORRECT - Background matches active tab:**
```css
.sticky-table-header {
  background: #e0f2fe; /* Same as active tab for seamless connection */
}
```

---

❌ **WRONG - Missing border-top on table header:**
```css
.sticky-table-header {
  background: #e0f2fe;
  /* No border-top - inactive tabs have no visual separation! */
}
```

✅ **CORRECT - Border-top creates separation with inactive tabs:**
```css
.sticky-table-header {
  background: #e0f2fe;
  border-top: 1px solid #cbd5e1; /* Creates line between inactive tabs and content */
}
```

---

### Testing Checklist: Sticky Table Headers

When implementing sticky table headers with folder tabs, verify:

- [ ] **Table header sticks at correct position** — doesn't overlap tabs
- [ ] **`top` value matches tabs height** (Pattern B) or is `0` (Pattern A)
- [ ] **Z-index is lower than content container** (e.g., 10 < 25)
- [ ] **Background color matches active tab** for seamless connection
- [ ] **Border-top present** to create visual separation with inactive tabs
- [ ] **Scroll behavior is smooth** — no jumping or flickering
- [ ] **Folder-tab layering still works** (if using Pattern A)
- [ ] **Content scrolls under header** — header doesn't scroll with content
- [ ] **Works with variable content heights** — test with few and many rows

---

### Quick Reference: Sticky Header Values by Pattern

| Pattern | Tabs Position | Header `top` | Header `z-index` | Folder Layering |
|---------|---------------|--------------|------------------|-----------------|
| A (Slot) | `relative` | `0` | `10` | ✅ Full support |
| B (Standalone) | `sticky; top: 0` | `80px` | `10` | ⚠️ Limited (use design tricks) |
| Hybrid | `relative` → `sticky` | `0` → `80px` | `10` | ✅ When not scrolled |

**Files to Reference:**
- `src/features/matters/views/MatterImport.vue` - Pattern A example (lines 320-326)
- `src/features/pleadings/views/Pleadings.vue` - Pattern B example
- `src/shared/components/layout/PageLayout.vue` - Scroll container definition

---

## Alternative Approaches (For Reference)

**Note:** The following approaches were researched from internet sources but are **NOT RECOMMENDED** for new implementations. They are kept here for reference only. Use the **Wrapper-Based Overflow** technique above instead.

**Why these are less preferred:**
- More complex (JavaScript needed for overlap detection)
- Harder to maintain (conditional logic, ResizeObserver management)
- Less predictable (negative margins can conflict with other styles)
- Layout shift risks (switching between gap/overlap modes)

**See working example:** `docs/Front-End/25-11-22-Adaptive-folder-tabs.md` (React)
**Production implementation:** `src/features/pleadings/components/ProceedingsTabs.vue` (Vue 3)

---

### Approach 1: JavaScript-Detected Overlap (NOT Recommended)

Use JavaScript to detect when tabs overflow their container, then apply negative margins conditionally.

**Key Principles:**
1. Use **`ResizeObserver`** to monitor container width changes
2. Compare `scrollWidth` vs `offsetWidth` to detect overflow
3. Apply **negative `margin-left`** (not `left` positioning) for overlap
4. Use **incremental z-index** from left to right
5. Boost active tab z-index significantly higher

**JavaScript Detection Pattern:**
```javascript
function checkOverlapNeeded() {
  const container = containerRef.value;
  const scrollWidth = container.scrollWidth;
  const offsetWidth = container.offsetWidth;

  // If content scrolls (wider than container), enable overlap
  needsOverlap.value = scrollWidth > offsetWidth;
}

// Watch for resize
const resizeObserver = new ResizeObserver(checkOverlapNeeded);
resizeObserver.observe(containerRef.value);
```

**Styling Pattern:**
```javascript
function getTabStyle(index) {
  const baseZIndex = index + 1; // Right tabs higher
  const overlapAmount = 40; // pixels
  const normalGap = 8; // pixels

  if (!needsOverlap) {
    return {
      marginRight: `${normalGap}px`,
      zIndex: isActive ? 100 : baseZIndex
    };
  }

  return {
    marginLeft: index === 0 ? '0' : `-${overlapAmount}px`,
    zIndex: isActive ? 100 : baseZIndex,
    position: 'relative' // Required for z-index
  };
}
```

**Why This Works:**
- Negative `margin-left` works with flexbox flow (unlike `left` positioning)
- First tab never overlaps (acts as anchor)
- Each subsequent tab overlaps the previous one
- Z-index naturally increases left-to-right

---

### Approach 2: Container Queries (NOT Recommended - Fixed Breakpoint)

Use CSS container queries to automatically switch between gapped and overlapped layouts.

**HTML Structure:**
```html
<div class="tabs-wrapper">
  <div class="tabs-container">
    <button class="tab">Tab 1</button>
    <button class="tab">Tab 2</button>
    <button class="tab">Tab 3</button>
  </div>
</div>
```

**CSS Pattern:**
```css
.tabs-wrapper {
  container-type: inline-size;
}

.tabs-container {
  display: flex;
  gap: 8px; /* Default gap when space allows */
}

.tab {
  position: relative;
  z-index: 1;
}

.tab:nth-child(2) { z-index: 2; }
.tab:nth-child(3) { z-index: 3; }
.tab:nth-child(4) { z-index: 4; }
/* ... increment z-index for each tab */

.tab.active {
  z-index: 100; /* Active tab always on top */
}

/* When container is constrained, remove gap and add overlap */
@container (max-width: 800px) {
  .tabs-container {
    gap: 0;
  }

  .tab:not(:first-child) {
    margin-left: -40px; /* Create overlap */
  }
}
```

**Advantages:**
- No JavaScript required
- Automatically responsive
- Clean separation of concerns

**Limitations:**
- Fixed breakpoint (not dynamic based on actual content)
- Browser support (Safari 16+, Chrome 105+)

---

### Approach 3: Float-Based (NOT Recommended - Legacy)

The classic approach using floats and negative margins.

**CSS Pattern:**
```css
.tabs-container {
  overflow: hidden; /* Contain floats */
}

.tab {
  float: left;
  margin-right: 8px; /* Default gap */
  position: relative;
  z-index: 1;
}

.tab:nth-child(2) { z-index: 2; }
.tab:nth-child(3) { z-index: 3; }
/* ... increment z-index */

.tab.active {
  z-index: 100;
}

/* On small screens, overlap */
@media (max-width: 768px) {
  .tab {
    margin-right: 0;
    margin-left: -40px;
  }

  .tab:first-child {
    margin-left: 0;
  }
}
```

**Why Float Left (Not Right)?**
- Floating left + negative left margins maintains left-to-right order
- Floating right would reverse tab order (unless you reverse HTML)
- Z-index increments handle the stacking order

---

## Critical Implementation Rules

### 1. Use Negative Margins, NOT Positioning
âŒ **WRONG:**
```css
.tab {
  left: -40px; /* Breaks flexbox flow */
}
```

âœ… **CORRECT:**
```css
.tab:not(:first-child) {
  margin-left: -40px; /* Works with flexbox */
}
```

**Why:** The `left` property only works with `position: absolute/relative` and removes elements from normal flow. Negative margins work within flexbox/grid layouts.

### 2. Z-Index Requires Position Context
âŒ **WRONG:**
```css
.tab {
  z-index: 5; /* Won't work without position */
}
```

âœ… **CORRECT:**
```css
.tab {
  position: relative; /* Creates stacking context */
  z-index: 5;
}
```

### 3. First Tab Never Overlaps
The first tab acts as the anchor. Only subsequent tabs apply negative margins:

```css
.tab:not(:first-child) {
  margin-left: -40px;
}
```

### 4. Active Tab Needs Highest Z-Index
Use a significantly higher z-index for the active tab to ensure it's always visible:

```javascript
zIndex: isActive ? 100 : baseZIndex
```

### 5. Flexbox Gap vs Margin
- **Use `gap`** for normal spacing (when not overlapping)
- **Use `margin-left`** for overlap (gap doesn't support negative values)
- **Don't mix** - switch between them based on overlap state

---

## Common Pitfalls (Especially with Tailwind CSS)

### Pitfall 1: Transform Conflicts
If you're using `transform` for vertical positioning, don't use it for horizontal overlap:

âŒ **WRONG:**
```javascript
transform: `translateX(-${overlap}px) translateY(4px)`
```

âœ… **CORRECT:**
```javascript
// Use margin for horizontal, transform for vertical
marginLeft: `-${overlap}px`,
transform: 'translateY(4px)'
```

### Pitfall 2: Tailwind Class Specificity
Inline styles override Tailwind classes. Be consistent:

```javascript
// Either use inline styles
:style="{ marginLeft: '-40px', zIndex: 5 }"

// OR Tailwind classes (but can't be dynamic easily)
:class="needsOverlap ? '-ml-10 z-[5]' : 'mr-2 z-[5]'"
```

### Pitfall 3: Overflow Clipping
Parent containers may clip overlapping tabs:

```css
.tabs-container {
  overflow: visible; /* Don't clip shadows/overlap */
}
```

---

## Testing Checklist

When implementing overlapping tabs, verify:

- [ ] Tabs align left with visible gaps when space allows
- [ ] Tabs overlap smoothly when container shrinks
- [ ] Rightmost tabs appear on top of leftmost tabs
- [ ] Active tab always appears on top (regardless of position)
- [ ] **Active tab appears IN FRONT of content container** (z-index layering works)
- [ ] **Inactive tabs appear BEHIND content container** (folder-tab metaphor intact)
- [ ] Hover states are visible (z-index adjusts if needed)
- [ ] **Hovered inactive tabs stay BEHIND content** (not jumping in front - see Problem 1 in "Common Problems & Fixes")
- [ ] **No visual seam between active tab and content** (see Problem 2 & 4 in "Common Problems & Fixes")
- [ ] **Active tab aligns tightly with content header** (see Problem 3 in "Common Problems & Fixes")
- [ ] Shadows/borders aren't clipped by overflow
- [ ] Transitions are smooth when resizing
- [ ] Works with variable tab widths
- [ ] No horizontal scrollbar appears unintentionally
- [ ] **No `position: sticky` isolating tabs from content** (or using slot pattern if sticky needed)
- [ ] **Sticky table header sticks at correct `top` value** (see "Sticky Table Headers Below Tabs" section)
- [ ] **Sticky table header doesn't overlap tabs** when scrolling

**Pro Tip:** Use the "Quick Checklist" in the "Common Problems & Fixes" section for detailed verification steps.

---

## Browser Compatibility Notes

| Approach | IE11 | Edge | Chrome | Firefox | Safari |
|----------|------|------|--------|---------|--------|
| Float-based | âœ… | âœ… | âœ… | âœ… | âœ… |
| Flexbox + JS | âŒ | âœ… | âœ… | âœ… | âœ… |
| Container Queries | âŒ | âœ… | 105+ | 110+ | 16+ |

**Recommendation:** Use Flexbox + JavaScript for best balance of compatibility and control.

---

## Performance Considerations

1. **ResizeObserver** is efficient - debouncing not needed for most cases
2. **Avoid recalculating styles on scroll** - only on resize
3. **Use `will-change: transform`** if animating tab positions
4. **Limit number of tabs** - 20+ tabs may need virtualization

---

## Accessibility Notes

- Ensure tab labels remain readable when overlapped
- Don't hide tab text under other tabs (adjust overlap amount)
- Maintain keyboard focus indicators (z-index for `:focus`)
- Use `aria-selected` for active tab state
- Ensure sufficient color contrast in overlapped states

---

## References

- [CSS Mouse-over Overlapping Tabs - Stack Overflow](https://stackoverflow.com/questions/1066511/css-mouse-over-overlapping-tabs)
- [Overlapping Tabbed Navigation in CSS](https://shapeshed.com/overlapping-tabbed-navigation-in-css/)
- [CSS Examples - Overlapping Tabs with Hover](http://www.pmob.co.uk/pob/hover/tab1.htm)
- [The Rules of Margin Collapse - Josh Comeau](https://www.joshwcomeau.com/css/rules-of-margin-collapse/)
- [Responsive design - Tailwind CSS](https://tailwindcss.com/docs/responsive-design)
- [The Z-Index CSS Property - Smashing Magazine](https://www.smashingmagazine.com/2009/09/the-z-index-css-property-a-comprehensive-look/)
- [What No One Told You About Z-Index - Philip Walton](https://philipwalton.com/articles/what-no-one-told-you-about-z-index/)

---

## Summary

**âœ… RECOMMENDED: Wrapper-Based Overflow (Proven in Production)**

**The Golden Rules:**
1. Use **two-layer structure**: wrapper (shrinks) + button (fixed width)
2. Set wrapper: `flex-shrink: 1`, `flex-basis: 220px`, **`min-width: 0`** (critical!)
3. Set button: `width: 220px` (fixed - no flex properties)
4. Last wrapper: `min-width: 140px` (prevents complete collapse)
5. Super spacer: `flex-shrink: 10000` (shrinks first)
6. Apply **incremental z-index** from left to right (1, 2, 3...)
7. Give **active tab highest z-index** (e.g., 100)
8. Give **hovered inactive tabs intermediate z-index** (e.g., 20) - LOWER than content (25)
9. **Content container: `position: relative; z-index: 25;`** (CRITICAL! - appears in front of inactive tabs, behind active tab)
10. ALL tab: `flex-shrink: 0` (never shrinks)
11. Container: `overflow: visible` (allows button overflow)
12. **âš ï¸ Tabs and content MUST share the same stacking context** - use a slot pattern if needed (see section above)

**âš ï¸ CRITICAL GOTCHA: `position: sticky` Trap**
If using `position: sticky` on your tabs container, it creates an **isolated stacking context** that breaks z-index layering with the content. Solution: Use a **slot-based pattern** where the content is rendered INSIDE the tabs component, so both share the same stacking context. See "The `position: sticky` Stacking Context Trap" section above.

**ðŸš¨ AVOID THESE COMMON MISTAKES:**
See the "Common Problems & Fixes" section for production-proven solutions to:
1. Hover z-index overrides breaking tab layering
2. Box shadows and gradients creating visual artifacts
3. Active tab vertical misalignment (Y-axis position)
4. Border styling for seamless tab-content connection

**📌 STICKY TABLE HEADERS:**
When combining folder tabs with data tables, table headers often need to stick below the tabs while scrolling. See the "Sticky Table Headers Below Tabs" section for:
- Pattern A (slot-based tabs): Use `top: 0` — tabs scroll away first
- Pattern B (sticky tabs): Use `top: 80px` — header sticks below tabs
- Z-index coordination to preserve folder-tab layering

**Why This Works:**
- When wrapper shrinks below button width, button overflows â†’ creates overlap
- Pure CSS solution - no JavaScript needed for overlap detection
- Smooth, automatic adaptation to any container width
- Works reliably across modern frameworks (React, Vue, Svelte)

**Alternative Approaches:**
For scenarios where the wrapper technique doesn't fit, see the "Alternative Approaches" section above for negative margin and JavaScript-based solutions.
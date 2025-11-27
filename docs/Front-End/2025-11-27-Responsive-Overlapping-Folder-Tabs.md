# Responsive Overlapping Folder Tabs - Best Practices

**Date:** 2025-11-22
**Updated:** 2025-11-27
**Topic:** Implementing browser-style skeuomorphic tabs with responsive overlap behavior

## Problem Statement

How do you create folder-style tabs that:
1. **Left-align with gaps** when space allows
2. **Overlap each other** when space is constrained
3. **Stack with rightmost tabs on top** (like browser tabs)
4. Transition smoothly between these states
5. Never exceed container width (no horizontal scrollbar)

## ✅ PROVEN TECHNIQUE: Wrapper-Based Overflow (RECOMMENDED)

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
   - Tab wrappers start shrinking (e.g., 220px → 200px → 180px)
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

✅ **Advantages:**
- Pure CSS (no JavaScript needed for overlap detection)
- Smooth, automatic adaptation to any container width
- True overlap (not just negative margins)
- No layout shifts or recalculations
- Works with flexbox naturally
- Easy to understand and maintain

❌ **What NOT to do:**
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
   - Creates two-phase behavior: normal → overlapping

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

❌ **WRONG - Making button shrink:**
```css
.tab-button {
  flex-shrink: 1;  /* NO! Button will squeeze, not overlap */
  width: 220px;
}
```

✅ **CORRECT - Only wrapper shrinks:**
```css
.tab-wrapper {
  flex-shrink: 1;  /* YES! Wrapper shrinks */
}

.tab-button {
  width: 220px;  /* Fixed - no flex properties */
}
```

---

❌ **WRONG - Parent wrapper with z-index creates stacking context:**
```html
<!-- Import Tabs -->
<ImportTabs v-model="activeTab" />

<!-- Tabbed Import Content -->
<div class="mx-6 mb-6 relative z-0">  <!-- ❌ PROBLEM: relative z-0 -->
  <div class="content-container">
    <!-- Content here -->
  </div>
</div>
```

**Problem:** The `relative z-0` on the parent wrapper creates a **new stacking context** that isolates all child elements (including `.content-container` with `z-index: 25`) from the tabs above. This prevents the folder-tab layering effect from working - all tabs will appear at the same visual layer as the content.

✅ **CORRECT - No z-index isolation on parent wrapper:**
```html
<!-- Import Tabs -->
<ImportTabs v-model="activeTab" />

<!-- Tabbed Import Content -->
<div class="mx-6 mb-6">  <!-- ✅ No relative z-0 -->
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

## ⚠️ CRITICAL: The `position: sticky` Stacking Context Trap

**Date Added:** 2025-11-27
**Status:** Production-proven fix

### The Problem

If your tabs container uses `position: sticky` (e.g., to keep tabs visible while scrolling), you will encounter a **stacking context isolation problem** that breaks the folder-tab z-index layering effect.

**Why it happens:** Per the CSS specification, `position: sticky` **ALWAYS creates a new stacking context**, even without an explicit `z-index`. This means:

```
BROKEN STRUCTURE:
┌─────────────────────────────────────────┐
│ .import-tabs-sticky (position: sticky)  │  ← Creates ISOLATED stacking context
│   └── tab wrappers (z-index: 1-100)     │  ← Can only compete with EACH OTHER
└─────────────────────────────────────────┘
                    ↕ Z-INDEX CANNOT COMPETE ACROSS THIS BOUNDARY!
┌─────────────────────────────────────────┐
│ .content-container (z-index: 25)        │  ← Different stacking context
└─────────────────────────────────────────┘
```

**Symptoms:**
- ALL tabs appear behind the content container (or all in front)
- Changing z-index values on tabs has no effect relative to content
- Active tab doesn't appear "in front of" the content header
- The folder-tab metaphor is completely broken

### Failed Approaches (Don't Try These)

❌ **Setting z-index on the sticky container:**
```css
.import-tabs-sticky {
  position: sticky;
  z-index: 50; /* Makes ALL tabs appear in front - not what we want */
}
```

❌ **Removing z-index from the sticky container:**
```css
.import-tabs-sticky {
  position: sticky;
  /* No z-index - but sticky STILL creates stacking context! */
}
```

❌ **Adjusting individual tab z-index values:**
```javascript
// Doesn't matter what values you use - they can't escape the sticky context
zIndex: isActive ? 9999 : index + 1
```

### ✅ THE SOLUTION: Slot-Based Shared Stacking Context

**The fix:** Put both the tabs AND the content container **inside the same parent element**. Use a Vue slot (or React children) to achieve this while keeping components modular.

```
FIXED STRUCTURE:
┌─────────────────────────────────────────────────┐
│ .import-tabs-wrapper (position: relative)       │  ← SINGLE stacking context
│   ├── .import-tabs-row                          │
│   │     └── tab wrappers (z-index: 1-100)       │  ← NOW competes with content!
│   └── <slot name="content">                     │
│         └── .content-container (z-index: 25)    │  ← SAME stacking context
└─────────────────────────────────────────────────┘
```

**Result:**
- Active tab (z-index: 100) > Content (z-index: 25) = **Tab appears IN FRONT** ✅
- Inactive tabs (z-index: 1-10) < Content (z-index: 25) = **Tabs appear BEHIND** ✅

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
| `position: sticky` | ✅ **ALWAYS** (even without z-index!) |
| `position: fixed` | ✅ Always |
| `position: relative` + `z-index` | ✅ When both present |
| `position: absolute` + `z-index` | ✅ When both present |
| `opacity: 0.99` (or less than 1) | ✅ Always |
| `transform: any` | ✅ Always |
| `filter: any` | ✅ Always |
| `isolation: isolate` | ✅ Always |
| `will-change: transform` | ✅ Always |
| `contain: layout` or `paint` | ✅ Always |

**Key insight:** `position: sticky` is the sneakiest because it creates a stacking context **even without a z-index value**, unlike `position: relative` which only creates one when combined with z-index.

**Reference:** See fix implemented in `ImportTabs.vue` and `MatterImport.vue` (2025-11-27)

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
❌ **WRONG:**
```css
.tab {
  left: -40px; /* Breaks flexbox flow */
}
```

✅ **CORRECT:**
```css
.tab:not(:first-child) {
  margin-left: -40px; /* Works with flexbox */
}
```

**Why:** The `left` property only works with `position: absolute/relative` and removes elements from normal flow. Negative margins work within flexbox/grid layouts.

### 2. Z-Index Requires Position Context
❌ **WRONG:**
```css
.tab {
  z-index: 5; /* Won't work without position */
}
```

✅ **CORRECT:**
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

❌ **WRONG:**
```javascript
transform: `translateX(-${overlap}px) translateY(4px)`
```

✅ **CORRECT:**
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
- [ ] Shadows/borders aren't clipped by overflow
- [ ] Transitions are smooth when resizing
- [ ] Works with variable tab widths
- [ ] No horizontal scrollbar appears unintentionally
- [ ] **No `position: sticky` isolating tabs from content** (or using slot pattern if sticky needed)

---

## Browser Compatibility Notes

| Approach | IE11 | Edge | Chrome | Firefox | Safari |
|----------|------|------|--------|---------|--------|
| Float-based | ✅ | ✅ | ✅ | ✅ | ✅ |
| Flexbox + JS | ❌ | ✅ | ✅ | ✅ | ✅ |
| Container Queries | ❌ | ✅ | 105+ | 110+ | 16+ |

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

**✅ RECOMMENDED: Wrapper-Based Overflow (Proven in Production)**

**The Golden Rules:**
1. Use **two-layer structure**: wrapper (shrinks) + button (fixed width)
2. Set wrapper: `flex-shrink: 1`, `flex-basis: 220px`, **`min-width: 0`** (critical!)
3. Set button: `width: 220px` (fixed - no flex properties)
4. Last wrapper: `min-width: 140px` (prevents complete collapse)
5. Super spacer: `flex-shrink: 10000` (shrinks first)
6. Apply **incremental z-index** from left to right (1, 2, 3...)
7. Give **active/hovered tab highest z-index** (e.g., 100)
8. **Content container: `position: relative; z-index: 25;`** (CRITICAL! - appears in front of inactive tabs, behind active tab)
9. ALL tab: `flex-shrink: 0` (never shrinks)
10. Container: `overflow: visible` (allows button overflow)
11. **⚠️ Tabs and content MUST share the same stacking context** - use a slot pattern if needed (see section above)

**⚠️ CRITICAL GOTCHA: `position: sticky` Trap**
If using `position: sticky` on your tabs container, it creates an **isolated stacking context** that breaks z-index layering with the content. Solution: Use a **slot-based pattern** where the content is rendered INSIDE the tabs component, so both share the same stacking context. See "The `position: sticky` Stacking Context Trap" section above.

**Why This Works:**
- When wrapper shrinks below button width, button overflows → creates overlap
- Pure CSS solution - no JavaScript needed for overlap detection
- Smooth, automatic adaptation to any container width
- Works reliably across modern frameworks (React, Vue, Svelte)

**Alternative Approaches:**
For scenarios where the wrapper technique doesn't fit, see the "Alternative Approaches" section above for negative margin and JavaScript-based solutions.
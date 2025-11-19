# Design System Documentation

**Reconciled up to**: 2025-11-18

## Key Files

This documentation references the following key implementation files:

- `tailwind.config.js` - Tailwind CSS configuration with custom brand colors
- `src/plugins/vuetify.js` - Vuetify 3 Material Design theme configuration
- `src/main.js` - Application entry point and framework initialization
- `src/styles/tailwind.css` - Tailwind directive imports and base styles
- `src/styles/main.css` - Main stylesheet with sidebar theme variables

---

## Overview

This document serves as the definitive guide for maintaining visual consistency and design standards across the Vue Template application. All new features and components should adhere to these guidelines to ensure a cohesive user experience.

## Color Palette

### Primary Brand Colors

- **Brand Blue**: `#3b82f6` (`brand-blue`)
  - Primary actions, links, active states
  - Usage: Primary buttons, navigation highlights, focus states
- **Brand Blue Dark**: `#1d4ed8` (`brand-blue-dark`)
  - Hover states, pressed buttons
  - Usage: Button hover effects, active navigation items

### Neutral Colors (Slate Scale)

- **Slate 800**: `#1e293b` - Primary text, dark backgrounds
- **Slate 700**: `#334155` - Secondary text, sidebar backgrounds
- **Slate 600**: `#475569` - Muted text, borders
- **Slate 500**: `#64748b` - Placeholder text
- **Slate 400**: `#94a3b8` - Icons, disabled text
- **Slate 300**: `#cbd5e1` - Light borders
- **Slate 200**: `#e2e8f0` - Subtle borders, dividers
- **Slate 100**: `#f1f5f9` - Light backgrounds
- **Slate 50**: `#f8fafc` - Subtle backgrounds

### Semantic Colors

- **Success**: `#10b981` (green-500)
- **Warning**: `#f59e0b` (amber-500)
- **Error**: `#ef4444` (red-500)
- **Info**: `#3b82f6` (blue-500)

### Interactive States

- **Hover Blue**: `#dbeafe` (`blue-50`) - Light blue background for hover states
- **Hover Red**: `#fef2f2` (`red-50`) - Light red background for destructive actions

## Typography

### Font Family

- **Primary**: System font stack via Tailwind's default
- **Fallbacks**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

### Font Sizes

- **xs**: `0.75rem` (`text-xs`) - Captions, labels
- **sm**: `0.875rem` (`text-sm`) - Body text, form inputs
- **base**: `1rem` (`text-base`) - Default body text
- **lg**: `1.125rem` (`text-lg`) - Subheadings
- **xl**: `1.25rem` (`text-xl`) - Small headings
- **2xl**: `1.5rem` (`text-2xl`) - Page titles, main headings

### Font Weights

- **Normal**: `400` (`font-normal`) - Body text
- **Medium**: `500` (`font-medium`) - Emphasized text, labels
- **Semibold**: `600` (`font-semibold`) - Subheadings, important text
- **Bold**: `700` (`font-bold`) - Headings, strong emphasis

### Line Heights

- **Tight**: `1.25` (`leading-tight`) - Headings
- **Normal**: `1.5` (`leading-normal`) - Body text
- **Relaxed**: `1.625` (`leading-relaxed`) - Long-form content

## Spacing System

### Padding/Margin Scale (Tailwind Units)

- **1**: `0.25rem` (4px) - Minimal spacing
- **2**: `0.5rem` (8px) - Small spacing
- **3**: `0.75rem` (12px) - Default component spacing
- **4**: `1rem` (16px) - Standard spacing
- **5**: `1.25rem` (20px) - Medium spacing
- **8**: `2rem` (32px) - Large spacing
- **10**: `2.5rem` (40px) - Extra large spacing

### Component-Specific Spacing

- **Button padding**: `py-3 px-4` (12px vertical, 16px horizontal)
- **Input padding**: `py-3 px-4 pl-11` (with icon)
- **Dropdown items**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Card padding**: `p-6` (24px all sides)

## Border Radius

### Standard Radius Values

- **Small**: `rounded` (4px) - Buttons, inputs
- **Medium**: `rounded-lg` (8px) - Cards, modals
- **Large**: `rounded-xl` (12px) - Dropdowns, overlays
- **Full**: `rounded-full` - Avatars, pills

## Shadows

### Shadow Hierarchy

- **Small**: `shadow-sm` - Subtle elevation
- **Default**: `shadow` - Standard cards
- **Medium**: `shadow-md` - Elevated cards
- **Large**: `shadow-lg` - Modals, important overlays
- **Extra Large**: `shadow-xl` - Dropdowns, tooltips

## Icons

### Icon System

The application uses a **dual icon system** to balance Material Design components with custom branding:

#### Material Design Icons (MDI)

- **Library**: `@mdi/font` - Material Design Icons for Vuetify components
- **Usage**: Vuetify components (buttons, menus, lists) via `mdi-*` prefixes
- **Size**: Controlled by Vuetify's `size` prop or MDI classes
- **Color**: `color` prop on Vuetify components, or `text-*` classes
- **Examples**:
  - `mdi-plus` - Add/create actions
  - `mdi-chevron-down` - Dropdown indicators
  - `mdi-file-multiple` - File-related actions
  - `mdi-folder-multiple` - Folder operations

#### Emoji Icons

- **Usage**: Navigation sidebar and primary app navigation
- **Size**: Inherits from parent text size
- **Color**: Single-color (uses font color)
- **Examples**:
  - 🗄️ Matters
  - 🗃️ Categories
  - 📤 Upload
  - 📁 Documents
  - 🕵️ Analyze

### Icon Usage Guidelines

- Use **MDI icons** for all Vuetify Material Design components
- Use **emoji icons** for navigation and branding elements where custom personality is desired
- Icons should always be accompanied by text labels or tooltips for accessibility
- Maintain consistent sizing within component groups

## Interactive States

### Hover Effects

- **Background**: Subtle color shift (e.g., `hover:bg-blue-50`)
- **Text**: Color change to brand blue (`hover:text-brand-blue`)
- **Icons**: Color change to match text
- **Duration**: `transition-all duration-200`

### Focus States

- **Outline**: `focus:outline-none focus:ring-2 focus:ring-brand-blue`
- **Background**: `focus:bg-white` for inputs
- **Border**: `focus:border-brand-blue`

### Active States

- **Navigation**: `bg-brand-blue text-white`
- **Buttons**: Darker background variant

## Component Patterns

### Buttons

```html
<!-- Primary Button -->
<button
  class="bg-brand-blue hover:bg-brand-blue-dark text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
>
  <!-- Secondary Button -->
  <button
    class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
  >
    <!-- Destructive Button -->
    <button
      class="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
    ></button>
  </button>
</button>
```

### Form Inputs

```html
<input
  class="w-full py-3 px-4 border border-gray-300 rounded-lg bg-gray-50 text-sm transition-all duration-200 focus:outline-none focus:border-brand-blue focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
/>
```

### Cards

```html
<div class="bg-white border border-gray-200 rounded-lg shadow-md p-6"></div>
```

### Dropdowns

```html
<div
  class="bg-white border border-gray-200/50 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden"
></div>
```

## Layout Guidelines

### Grid System

- Use Tailwind's grid utilities
- Prefer `gap-4` or `gap-6` for consistent spacing
- Use responsive prefixes (`md:`, `lg:`) for mobile-first design

### Containers

- **Page container**: `max-w-7xl mx-auto px-4`
- **Content sections**: `py-8` or `py-12` for vertical spacing

### Header

- **Height**: `h-20` (80px) fixed height
- **Background**: `bg-white` with `border-b border-slate-200`
- **Padding**: `px-8 py-5`

### Sidebar

- **Width**: `w-[60px]` collapsed, `w-[280px]` expanded
- **Background**: Custom CSS variables with "Starry Night" theme (see `src/styles/main.css`)
  - Primary: `theme('colors.blue.900')`
  - Secondary: `theme('colors.indigo.950')`
  - Text: `theme('colors.slate.100')` with yellow accents
- **Theme Variables**: Van Gogh "Starry Night" inspired color scheme with deep night blues and bright yellow accents

## Accessibility Guidelines

### Color Contrast

- Ensure minimum 4.5:1 contrast ratio for normal text
- Ensure minimum 3:1 contrast ratio for large text
- Never rely solely on color to convey information

### Focus Management

- All interactive elements must have visible focus states
- Tab order should be logical and intuitive
- Use `tabindex` appropriately for custom components

### Screen Reader Support

- Use semantic HTML elements when possible
- Provide `aria-label` for icon-only buttons
- Use `role` attributes for custom components

## Animation & Transitions

### Standard Durations

- **Fast**: `duration-150` (150ms) - Hover effects
- **Standard**: `duration-200` (200ms) - Most interactions
- **Slow**: `duration-300` (300ms) - Complex state changes

### Easing Functions

- **Default**: `ease-in-out` for most transitions
- **Entrance**: `ease-out` for appearing elements
- **Exit**: `ease-in` for disappearing elements

### Transform Guidelines

- Use `transform` for performance-optimized animations
- Prefer `scale`, `translate`, and `rotate` over layout-affecting properties
- Use `transition-transform` for transform-only animations

## Mobile Responsiveness

### Breakpoints (Tailwind defaults)

- **sm**: `640px` and up
- **md**: `768px` and up
- **lg**: `1024px` and up
- **xl**: `1280px` and up

### Mobile-First Approach

- Design for mobile first, enhance for larger screens
- Use responsive prefixes consistently
- Test all interactions on touch devices

### Touch Targets

- Minimum `44px × 44px` for touch targets
- Provide adequate spacing between interactive elements
- Consider thumb-friendly navigation patterns

## Implementation Notes

### Tailwind Configuration

- Custom colors are defined in `tailwind.config.js`
- Extend Tailwind's theme rather than overriding defaults
- Use CSS custom properties for dynamic theming if needed

### CSS Import Order

**Note**: Modern Vite prefers CSS imports before Vue for optimal build performance:

```javascript
// src/main.js
import './styles/main.css'  // Import CSS first (Vite best practice)
import { createApp } from 'vue'
```

This differs from traditional guidance but follows Vite's optimization strategy for faster HMR and build times.

### Component Organization

- Group related utilities together
- Use consistent class ordering: layout → spacing → colors → typography → effects
- Consider extracting complex utility combinations into component classes

### Performance Considerations

- Use Tailwind's purge functionality to remove unused styles
- Minimize custom CSS in favor of utility classes
- Leverage Tailwind's `@apply` directive sparingly

## Material Design Integration Strategy

### Component Library Approach

**Current Stack**: The application uses a **dual framework approach** combining Vuetify 3 and Element Plus to leverage strengths of each:

#### Vuetify 3 (Primary Material Design Framework)

- **Purpose**: Material Design components, theming, and design system foundation
- **Version**: Vuetify 3.x (Vue 3 compatible)
- **Configuration**: `src/plugins/vuetify.js` with custom theme aligned to brand colors
- **Strengths**:
  - 80+ Material Design components with excellent accessibility
  - Robust theming system with light/dark mode support
  - First-class TypeScript support
  - Active community and comprehensive documentation

#### Element Plus (Complementary UI Library)

- **Purpose**: Supplementary components for specific use cases
- **Version**: Latest stable
- **Registration**: Global registration in `src/main.js`
- **Use Cases**: [Document specific scenarios where Element Plus is preferred]

#### When to Use Each Framework

**Prefer Vuetify for:**
- Form inputs (text fields, selects, checkboxes, radio buttons)
- Buttons and action components
- Navigation elements (tabs, menus, breadcrumbs)
- Data display (tables, lists, cards)
- Feedback components (alerts, snackbars, progress indicators)
- Layout components (grids, containers, dividers)

**Use Element Plus when:**
- Specific component not available or overly complex in Vuetify
- Performance optimization requires lightweight alternative
- Existing Element Plus component already integrated

#### Integration Guidelines

1. **Theming**: Vuetify theme (in `src/plugins/vuetify.js`) serves as primary design system
2. **Consistency**: When using Element Plus, apply Tailwind utilities to match Vuetify's Material Design aesthetic
3. **Migration Strategy**: Gradually consolidate to single framework where feasible to reduce bundle size
4. **Documentation**: Document component choice rationale in component comments

### Dark Mode Support

**Status**: ✅ **Fully Implemented**

Dark mode is production-ready with complete theme configuration in `src/plugins/vuetify.js`:

#### Current Implementation

- **Light Theme**: Default theme with brand blue primary and slate neutrals
- **Dark Theme**: Complete dark color palette with adjusted surface and text colors
- **Vuetify Theme System**: Leverages Vuetify's built-in theme switching
- **Color Tokens**:
  - Surface colors auto-adjust for dark backgrounds
  - Text colors (`on-surface`, `on-surface-variant`) ensure proper contrast
  - All semantic colors (success, warning, error, info) maintain visibility

#### Theme Toggle

- **Integration Point**: Theme switcher can be added to user preferences or header
- **API**: `vuetify.theme.global.name.value = 'dark'` or `'light'`
- **Persistence**: Consider storing preference in localStorage for user sessions

#### Tailwind Integration

- Tailwind's `dark:` variant can complement Vuetify theme for custom components
- Ensure both systems stay synchronized when implementing dark mode toggles

## Future Considerations

### Material Design 3 Migration

- Monitor Vuetify's Material Design 3 (Material You) implementation progress
- Plan for future migration when officially supported in Vuetify
- Consider design token structure that supports both Material Design 2 and 3

### Theming

- Structure color tokens to support multiple brand themes
- Use CSS custom properties for runtime theme switching
- Integrate with Vuetify's theming system for consistency

### Framework Consolidation

- **Long-term goal**: Evaluate consolidating to single component library
- **Analysis needed**: Identify Element Plus components in use and Vuetify equivalents
- **Migration plan**: Gradual replacement to minimize disruption
- **Bundle optimization**: Removing duplicate framework code will improve performance

### Component Library

- Prioritize Material Design components from Vuetify
- Create custom components only when Material Design doesn't meet requirements
- Document component APIs and usage examples
- Maintain consistency with Material Design principles even in custom components

---

_Last updated: 2025-11-18_
_Version: 2.0_

For questions or suggestions regarding this design system, please refer to the development team.

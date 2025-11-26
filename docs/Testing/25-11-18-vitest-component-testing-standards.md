# Component Testing Standards

**Document Purpose**: Comprehensive guide for testing Vue components using Vue Test Utils and Vitest in the ListBot application.

**Last Updated**: 2025-01-20
**Maintained By**: Development Firm

---

## Overview

This document defines the standards and best practices for testing Vue components using Vue Test Utils and Vitest in the ListBot application.

---

## 1. Vue Test Utils Best Practices

### Component Mounting Strategies

**Shallow vs. Full Mount:**
```javascript
import { mount, shallowMount } from '@vue/test-utils'

// Use shallowMount for isolated unit tests
describe('MyComponent (isolated)', () => {
  it('should render with props', () => {
    const wrapper = shallowMount(MyComponent, {
      props: { title: 'Test' }
    })
    expect(wrapper.text()).toContain('Test')
  })
})

// Use mount for integration tests with child components
describe('MyComponent (integrated)', () => {
  it('should pass data to child component', () => {
    const wrapper = mount(MyComponent, {
      props: { items: [...] }
    })
    const childComponent = wrapper.findComponent({ name: 'ChildComponent' })
    expect(childComponent.exists()).toBe(true)
  })
})
```

**Standard Mounting Options:**
```javascript
// Recommended global configuration for component tests
const createWrapper = (props = {}, options = {}) => {
  return mount(MyComponent, {
    props,
    global: {
      plugins: [createPinia()],      // Pinia store
      stubs: {
        teleport: true,              // Stub teleport for testing
        'v-icon': true,              // Stub Vuetify icons if not testing icons
      },
      mocks: {
        $route: { params: { id: '123' } },
        $router: { push: vi.fn() }
      }
    },
    ...options
  })
}
```

### Testing Props and Emits

**Props Validation:**
```javascript
describe('Component Props', () => {
  it('should accept required props', () => {
    const wrapper = mount(MyComponent, {
      props: { requiredProp: 'value' }
    })
    expect(wrapper.props('requiredProp')).toBe('value')
  })

  it('should use default prop values', () => {
    const wrapper = mount(MyComponent, {
      props: { requiredProp: 'value' }
    })
    expect(wrapper.props('optionalProp')).toBe('defaultValue')
  })

  it('should validate prop types', () => {
    // Test invalid prop type in development
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation()
    mount(MyComponent, {
      props: { numberProp: 'not-a-number' }
    })
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid prop')
    )
    consoleWarn.mockRestore()
  })
})
```

**Event Emission:**
```javascript
describe('Component Events', () => {
  it('should emit events with correct payload', async () => {
    const wrapper = mount(MyComponent)
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['newValue'])
  })

  it('should emit multiple events in sequence', async () => {
    const wrapper = mount(MyComponent)
    await wrapper.vm.performAction()

    expect(wrapper.emitted()).toHaveProperty('start')
    expect(wrapper.emitted()).toHaveProperty('progress')
    expect(wrapper.emitted()).toHaveProperty('complete')
  })
})
```

### Testing Slots and Scoped Slots

```javascript
describe('Component Slots', () => {
  it('should render default slot content', () => {
    const wrapper = mount(MyComponent, {
      slots: {
        default: '<span>Slot Content</span>'
      }
    })
    expect(wrapper.html()).toContain('Slot Content')
  })

  it('should render scoped slots with data', () => {
    const wrapper = mount(MyComponent, {
      slots: {
        item: `
          <template #item="{ data }">
            <div class="custom-item">{{ data.name }}</div>
          </template>
        `
      }
    })
    expect(wrapper.find('.custom-item').exists()).toBe(true)
  })
})
```

### Async Operations and Timing

```javascript
describe('Async Component Behavior', () => {
  it('should wait for DOM updates', async () => {
    const wrapper = mount(MyComponent)
    wrapper.vm.show = true

    // Wait for Vue to update the DOM
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.conditional-element').exists()).toBe(true)
  })

  it('should handle async data loading', async () => {
    const wrapper = mount(MyComponent)

    // Trigger async operation
    await wrapper.vm.loadData()

    // Wait for all promises to resolve
    await flushPromises()

    expect(wrapper.vm.data).toBeDefined()
  })

  it('should test lifecycle hooks', async () => {
    const onMountedSpy = vi.fn()
    mount(MyComponent, {
      global: {
        mixins: [{
          mounted() {
            onMountedSpy()
          }
        }]
      }
    })

    await nextTick()
    expect(onMountedSpy).toHaveBeenCalled()
  })
})
```

---

## 2. Vuetify Component Mocking

### Vuetify Plugin Configuration

**Global Vuetify Setup for Tests:**
```javascript
// tests/setup/vuetify.js
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export function createVuetifyForTesting(options = {}) {
  return createVuetify({
    components,
    directives,
    ...options
  })
}

// In test files:
import { createVuetifyForTesting } from '@/test-utils/vuetify'

const wrapper = mount(MyComponent, {
  global: {
    plugins: [createVuetifyForTesting()]
  }
})
```

### Selective Component Stubbing

**When to Stub Vuetify Components:**
```javascript
describe('MyComponent with Vuetify', () => {
  // DON'T stub when testing Vuetify component behavior
  it('should test v-btn click behavior', async () => {
    const wrapper = mount(MyComponent, {
      global: { plugins: [createVuetifyForTesting()] }
    })

    await wrapper.findComponent({ name: 'VBtn' }).trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  // DO stub when Vuetify components are not the focus
  it('should test business logic without Vuetify overhead', () => {
    const wrapper = mount(MyComponent, {
      global: {
        stubs: {
          VBtn: { template: '<button><slot /></button>' },
          VCard: { template: '<div><slot /></div>' },
          VTextField: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          }
        }
      }
    })

    // Test component logic without full Vuetify rendering
  })
})
```

### Common Vuetify Component Patterns

**VTextField Testing:**
```javascript
describe('VTextField Integration', () => {
  it('should bind v-model correctly', async () => {
    const wrapper = mount(MyForm, {
      global: { plugins: [createVuetifyForTesting()] }
    })

    const textField = wrapper.findComponent({ name: 'VTextField' })
    await textField.setValue('new value')

    expect(wrapper.vm.formData.field).toBe('new value')
  })

  it('should display validation errors', async () => {
    const wrapper = mount(MyForm, {
      global: { plugins: [createVuetifyForTesting()] }
    })

    const textField = wrapper.findComponent({ name: 'VTextField' })
    await textField.setValue('')
    await wrapper.vm.$refs.form.validate()

    expect(textField.props('errorMessages')).toContain('Field is required')
  })
})
```

**VDataTable Testing:**
```javascript
describe('VDataTable Integration', () => {
  it('should render table rows from items prop', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]

    const wrapper = mount(MyDataTable, {
      props: { items },
      global: { plugins: [createVuetifyForTesting()] }
    })

    const table = wrapper.findComponent({ name: 'VDataTable' })
    expect(table.props('items')).toHaveLength(2)
  })

  it('should handle row selection', async () => {
    const wrapper = mount(MyDataTable, {
      global: { plugins: [createVuetifyForTesting()] }
    })

    const table = wrapper.findComponent({ name: 'VDataTable' })
    await table.vm.$emit('update:modelValue', [{ id: 1 }])

    expect(wrapper.emitted('rowsSelected')).toBeTruthy()
  })
})
```

**VMenu and VDialog Testing:**
```javascript
describe('VMenu/VDialog Testing', () => {
  it('should open menu on activator click', async () => {
    const wrapper = mount(MyMenuComponent, {
      global: { plugins: [createVuetifyForTesting()] },
      attachTo: document.body  // Required for teleport
    })

    const activator = wrapper.find('[data-test="menu-activator"]')
    await activator.trigger('click')
    await nextTick()

    const menu = wrapper.findComponent({ name: 'VMenu' })
    expect(menu.props('modelValue')).toBe(true)

    wrapper.unmount() // Clean up attached elements
  })

  it('should render dialog content when open', async () => {
    const wrapper = mount(MyDialogComponent, {
      props: { modelValue: true },
      global: {
        plugins: [createVuetifyForTesting()],
        stubs: { teleport: true }  // Stub teleport to test in isolation
      }
    })

    expect(wrapper.find('[data-test="dialog-content"]').exists()).toBe(true)
  })
})
```

### Vuetify Theme and Layout Testing

```javascript
describe('Vuetify Theme Integration', () => {
  it('should apply theme colors correctly', () => {
    const vuetify = createVuetifyForTesting({
      theme: {
        defaultTheme: 'customTheme',
        themes: {
          customTheme: {
            colors: {
              primary: '#1976D2'
            }
          }
        }
      }
    })

    const wrapper = mount(MyComponent, {
      global: { plugins: [vuetify] }
    })

    // Test theme-dependent rendering
  })
})
```

---

## 3. Store Integration Patterns

### Pinia Store Setup for Testing

**Creating Isolated Store Instances:**
```javascript
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

describe('Component with Store Integration', () => {
  let pinia

  beforeEach(() => {
    // Create fresh Pinia instance for each test
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should read from store state', () => {
    const authStore = useAuthStore()
    authStore.user = { id: '123', name: 'Test User' }

    const wrapper = mount(MyComponent, {
      global: { plugins: [pinia] }
    })

    expect(wrapper.text()).toContain('Test User')
  })

  it('should dispatch store actions', async () => {
    const wrapper = mount(MyComponent, {
      global: { plugins: [pinia] }
    })

    const authStore = useAuthStore()
    const loginSpy = vi.spyOn(authStore, 'login')

    await wrapper.find('button[data-test="login"]').trigger('click')

    expect(loginSpy).toHaveBeenCalledWith({ username: 'test', password: 'pass' })
  })
})
```

### Mocking Store Dependencies

**Mocking External Services in Stores:**
```javascript
import { useDocumentStore } from '@/stores/documentStore'
import { firestore } from '@/services/firebase'

vi.mock('@/services/firebase', () => ({
  firestore: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ id: '123', name: 'Test Doc' })
        }))
      }))
    }))
  }
}))

describe('Document Store', () => {
  it('should fetch document from Firestore', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const store = useDocumentStore()
    await store.fetchDocument('123')

    expect(store.documents['123']).toEqual({
      id: '123',
      name: 'Test Doc'
    })
  })
})
```

### Testing Store Getters and Computed Properties

```javascript
describe('Store Getters', () => {
  it('should compute derived state correctly', () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const documentStore = useDocumentStore()
    documentStore.documents = {
      '1': { id: '1', status: 'processed' },
      '2': { id: '2', status: 'pending' },
      '3': { id: '3', status: 'processed' }
    }

    expect(documentStore.processedDocuments).toHaveLength(2)
    expect(documentStore.pendingDocuments).toHaveLength(1)
  })

  it('should react to state changes', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const wrapper = mount(MyComponent, {
      global: { plugins: [pinia] }
    })

    const store = useDocumentStore()

    expect(wrapper.find('.count').text()).toBe('0')

    store.addDocument({ id: '1', name: 'Doc 1' })
    await nextTick()

    expect(wrapper.find('.count').text()).toBe('1')
  })
})
```

### Testing Multiple Store Interactions

```javascript
describe('Multi-Store Integration', () => {
  it('should coordinate between auth and document stores', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const authStore = useAuthStore()
    const documentStore = useDocumentStore()

    // Setup auth state
    authStore.user = { id: 'user-123', firmId: 'firm-456' }

    // Component should use firmId from auth store
    const wrapper = mount(DocumentList, {
      global: { plugins: [pinia] }
    })

    await wrapper.vm.loadDocuments()

    // Verify documents were loaded with correct firmId
    expect(documentStore.currentFirmId).toBe('firm-456')
  })
})
```

### Store State Reset Between Tests

```javascript
describe('Store Cleanup', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    // Optional: Explicitly reset all stores
    pinia._s.forEach(store => store.$reset())
  })

  it('should start with clean state', () => {
    const store = useDocumentStore()
    expect(store.documents).toEqual({})
    expect(store.loading).toBe(false)
  })
})
```

---

## 4. Accessibility Testing Requirements

### ARIA Attributes Testing

**Required ARIA Tests:**
```javascript
describe('Accessibility - ARIA Attributes', () => {
  it('should have proper role attributes', () => {
    const wrapper = mount(CustomButton, {
      props: { label: 'Submit' }
    })

    const button = wrapper.find('button')
    expect(button.attributes('role')).toBe('button')
  })

  it('should include aria-label for icon-only buttons', () => {
    const wrapper = mount(IconButton, {
      props: { icon: 'mdi-close' }
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Close')
  })

  it('should use aria-labelledby for complex labels', () => {
    const wrapper = mount(FormField, {
      props: { id: 'email-field', label: 'Email Address' }
    })

    const input = wrapper.find('input')
    const labelId = wrapper.find('label').attributes('id')

    expect(input.attributes('aria-labelledby')).toBe(labelId)
  })

  it('should set aria-expanded for expandable elements', async () => {
    const wrapper = mount(Accordion, {
      props: { title: 'Section 1' }
    })

    const trigger = wrapper.find('[data-test="accordion-trigger"]')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
  })

  it('should use aria-live for dynamic content updates', () => {
    const wrapper = mount(StatusMessage, {
      props: { message: 'Loading...' }
    })

    const liveRegion = wrapper.find('[data-test="status"]')
    expect(liveRegion.attributes('aria-live')).toBe('polite')
    expect(liveRegion.attributes('aria-atomic')).toBe('true')
  })

  it('should set aria-disabled instead of disabled for custom controls', () => {
    const wrapper = mount(CustomControl, {
      props: { disabled: true }
    })

    const control = wrapper.find('[role="button"]')
    expect(control.attributes('aria-disabled')).toBe('true')
    expect(control.classes()).toContain('disabled')
  })
})
```

### Keyboard Navigation Testing

**Standard Keyboard Interaction Tests:**
```javascript
describe('Accessibility - Keyboard Navigation', () => {
  it('should focus first interactive element on Tab', async () => {
    const wrapper = mount(MyForm, {
      attachTo: document.body
    })

    const firstInput = wrapper.find('input')
    firstInput.element.focus()

    expect(document.activeElement).toBe(firstInput.element)

    wrapper.unmount()
  })

  it('should navigate through form fields with Tab', async () => {
    const wrapper = mount(MyForm, {
      attachTo: document.body
    })

    const inputs = wrapper.findAll('input')

    inputs[0].element.focus()
    expect(document.activeElement).toBe(inputs[0].element)

    // Simulate Tab key
    await inputs[0].trigger('keydown', { key: 'Tab' })
    inputs[1].element.focus()

    expect(document.activeElement).toBe(inputs[1].element)

    wrapper.unmount()
  })

  it('should handle Enter key to submit', async () => {
    const wrapper = mount(MyForm)

    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('should handle Escape key to close dialog', async () => {
    const wrapper = mount(MyDialog, {
      props: { modelValue: true }
    })

    await wrapper.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('should support arrow key navigation in menus', async () => {
    const wrapper = mount(ContextMenu, {
      props: { items: ['Option 1', 'Option 2', 'Option 3'] }
    })

    const menu = wrapper.find('[role="menu"]')
    const firstItem = wrapper.find('[role="menuitem"]')

    await menu.trigger('keydown', { key: 'ArrowDown' })

    expect(wrapper.vm.focusedIndex).toBe(0)

    await menu.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.vm.focusedIndex).toBe(1)

    await menu.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.vm.focusedIndex).toBe(0)
  })

  it('should trap focus within modal dialogs', async () => {
    const wrapper = mount(ModalDialog, {
      props: { open: true },
      attachTo: document.body
    })

    const dialog = wrapper.find('[role="dialog"]')
    const focusableElements = dialog.findAll('button, input, [tabindex="0"]')

    const firstElement = focusableElements[0].element
    const lastElement = focusableElements[focusableElements.length - 1].element

    // Focus should cycle within modal
    lastElement.focus()
    await lastElement.trigger('keydown', { key: 'Tab' })

    expect(document.activeElement).toBe(firstElement)

    wrapper.unmount()
  })
})
```

### Focus Management Testing

```javascript
describe('Accessibility - Focus Management', () => {
  it('should restore focus after dialog closes', async () => {
    const wrapper = mount(PageWithDialog, {
      attachTo: document.body
    })

    const openButton = wrapper.find('[data-test="open-dialog"]')
    openButton.element.focus()
    await openButton.trigger('click')

    // Dialog should be open and focused
    await nextTick()
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)

    // Close dialog
    await wrapper.find('[data-test="close-dialog"]').trigger('click')
    await nextTick()

    // Focus should return to open button
    expect(document.activeElement).toBe(openButton.element)

    wrapper.unmount()
  })

  it('should set initial focus in modal', async () => {
    const wrapper = mount(ModalDialog, {
      props: { open: true },
      attachTo: document.body
    })

    await nextTick()

    const autoFocusElement = wrapper.find('[data-autofocus]')
    expect(document.activeElement).toBe(autoFocusElement.element)

    wrapper.unmount()
  })

  it('should have visible focus indicators', () => {
    const wrapper = mount(MyButton)
    const button = wrapper.find('button')

    // Check for focus styles (implementation-dependent)
    expect(button.classes()).not.toContain('focus-visible-disabled')

    // Or check CSS custom properties
    const styles = getComputedStyle(button.element)
    expect(styles.getPropertyValue('--focus-ring-width')).toBeTruthy()
  })
})
```

### Screen Reader Testing

**Semantic HTML and Screen Reader Support:**
```javascript
describe('Accessibility - Screen Reader Support', () => {
  it('should use semantic HTML elements', () => {
    const wrapper = mount(ArticlePage)

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('footer').exists()).toBe(true)
  })

  it('should provide text alternatives for images', () => {
    const wrapper = mount(ImageGallery, {
      props: {
        images: [
          { src: '/image1.jpg', alt: 'Product photo from front' },
          { src: '/image2.jpg', alt: 'Product photo from side' }
        ]
      }
    })

    const images = wrapper.findAll('img')
    images.forEach(img => {
      expect(img.attributes('alt')).toBeTruthy()
      expect(img.attributes('alt').length).toBeGreaterThan(0)
    })
  })

  it('should announce loading states', async () => {
    const wrapper = mount(DataLoader)

    const status = wrapper.find('[aria-live="polite"]')
    expect(status.text()).toBe('Loading data...')

    await wrapper.vm.loadComplete()
    await nextTick()

    expect(status.text()).toBe('Data loaded successfully')
  })

  it('should provide descriptive error messages', async () => {
    const wrapper = mount(LoginForm)

    await wrapper.find('input[type="email"]').setValue('invalid-email')
    await wrapper.find('form').trigger('submit')

    const errorMessage = wrapper.find('[role="alert"]')
    expect(errorMessage.exists()).toBe(true)
    expect(errorMessage.text()).toContain('Please enter a valid email address')

    // Error should be associated with input
    const emailInput = wrapper.find('input[type="email"]')
    expect(emailInput.attributes('aria-invalid')).toBe('true')
    expect(emailInput.attributes('aria-describedby')).toBeTruthy()
  })
})
```

### Accessibility Testing Utilities

**Helper Functions for A11y Testing:**
```javascript
// tests/utils/accessibility.js
export const axeTest = async (wrapper) => {
  // Placeholder for axe-core integration
  // In real implementation, would run axe accessibility checks
  const violations = []

  // Check for common issues
  const images = wrapper.findAll('img')
  images.forEach((img, index) => {
    if (!img.attributes('alt')) {
      violations.push({
        id: 'image-alt',
        impact: 'critical',
        description: `Image at index ${index} missing alt text`
      })
    }
  })

  return violations
}

export const checkFocusVisible = (element) => {
  const styles = window.getComputedStyle(element)
  return styles.outline !== 'none' || styles.boxShadow.includes('focus')
}

export const getAccessibleName = (element) => {
  // Simplified version - real implementation would handle all aria-label* attributes
  return element.getAttribute('aria-label') ||
         element.getAttribute('aria-labelledby') ||
         element.textContent
}

// Usage in tests:
describe('Component Accessibility', () => {
  it('should pass axe accessibility checks', async () => {
    const wrapper = mount(MyComponent)
    const violations = await axeTest(wrapper)

    expect(violations).toHaveLength(0)
  })
})
```

### Color Contrast and Visual Accessibility

```javascript
describe('Accessibility - Visual', () => {
  it('should meet color contrast requirements', () => {
    const wrapper = mount(MyButton, {
      props: { variant: 'primary' }
    })

    const button = wrapper.find('button')
    const styles = window.getComputedStyle(button.element)

    // Note: Actual contrast calculation would require a library
    // This is a simplified check
    expect(styles.backgroundColor).toBeTruthy()
    expect(styles.color).toBeTruthy()

    // In real tests, use a library like color-contrast-checker
    // const contrast = getContrastRatio(styles.color, styles.backgroundColor)
    // expect(contrast).toBeGreaterThanOrEqual(4.5) // WCAG AA standard
  })

  it('should not rely solely on color to convey information', () => {
    const wrapper = mount(StatusIndicator, {
      props: { status: 'error' }
    })

    // Should have both color AND icon/text
    expect(wrapper.find('.status-icon').exists()).toBe(true)
    expect(wrapper.find('.status-text').exists()).toBe(true)
  })

  it('should be usable at 200% zoom', () => {
    // This would typically be tested manually or with visual regression tools
    const wrapper = mount(MyComponent)

    // Check that important elements have relative sizing
    const container = wrapper.find('.container')
    const styles = window.getComputedStyle(container.element)

    // Ensure rem/em units rather than px for text
    expect(styles.fontSize).toMatch(/rem|em/)
  })
})
```

---

## 5. Component Testing Checklist

Use this checklist when writing component tests:

**Basic Functionality:**
- [ ] Component renders without errors
- [ ] Props are correctly received and displayed
- [ ] Default prop values work correctly
- [ ] Events are emitted with correct payloads
- [ ] Slots render content correctly

**Vuetify Integration:**
- [ ] Vuetify components are properly configured
- [ ] Theme styles apply correctly
- [ ] Form validation works as expected
- [ ] Responsive breakpoints are respected

**Store Integration:**
- [ ] Component reads from store state correctly
- [ ] Store actions are dispatched properly
- [ ] Computed values from store update reactively
- [ ] Store state changes trigger UI updates

**Accessibility:**
- [ ] All interactive elements are keyboard accessible
- [ ] Focus management works correctly
- [ ] ARIA attributes are present and correct
- [ ] Screen reader announcements are appropriate
- [ ] Color contrast meets WCAG standards
- [ ] No reliance on color alone for information

**Error Handling:**
- [ ] Loading states are tested
- [ ] Error states are tested
- [ ] Edge cases are covered
- [ ] Null/undefined values are handled

**Performance:**
- [ ] Large data sets are tested
- [ ] Expensive operations are benchmarked
- [ ] Memory leaks are prevented
- [ ] Re-renders are optimized

---

## Test Suite Standards

**File Naming Convention**:
- **Store/Service/Composable Tests**: Use `.test.js` extension
  - Examples: `virtualFolderStore.test.js`, `aiMetadataExtractionService.test.js`, `useFolderAnalysis.test.js`
  - Applied to: Pinia stores, services, composables, utilities, integration tests, E2E tests
- **Component Tests**: Use `.spec.js` extension
  - Examples: `ViewModeToggle.spec.js`, `FolderBreadcrumbs.spec.js`
  - Applied to: Vue components, UI elements
- **Integration Tests**: Use `.integration.test.js` for cross-module integration testing
  - Example: `organizer.integration.test.js`

**Structure**: Use clear describe blocks and descriptive test names
**Documentation**: Include comments explaining complex test scenarios
**Performance**: Include performance assertions for critical operations
**Coverage**: Aim for comprehensive edge case coverage
**Mocking**: Use appropriate mocking for external dependencies

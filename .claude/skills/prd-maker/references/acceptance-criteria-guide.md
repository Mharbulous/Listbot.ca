# Writing Clear, Testable Acceptance Criteria

Guide for creating acceptance criteria that are specific, measurable, and verifiable.

---

## What Are Acceptance Criteria?

Acceptance criteria define the conditions that must be met for a user story to be considered complete. They:
- Clarify what "done" means
- Provide a basis for testing
- Prevent scope creep
- Align team understanding
- Enable QA validation

---

## The Golden Rules

### 1. Make Them Testable
Every criterion must be objectively verifiable. Avoid subjective language.

**❌ Bad:**
- [ ] The UI looks good
- [ ] Performance is acceptable
- [ ] Error messages are helpful

**✅ Good:**
- [ ] All form elements align to 8px grid
- [ ] Page loads in under 2 seconds (p95)
- [ ] Error message specifies which field is invalid and why

### 2. Be Specific
Include concrete values, thresholds, and behaviors.

**❌ Bad:**
- [ ] User can upload files
- [ ] System sends notification
- [ ] Password must be secure

**✅ Good:**
- [ ] User can upload files up to 10MB in size
- [ ] System sends email notification within 5 minutes
- [ ] Password must be 8+ characters with uppercase, lowercase, number, and special character

### 3. Cover the Complete Scenario
Don't just describe the happy path—include edge cases and error conditions.

**❌ Incomplete:**
- [ ] User can log in with email and password

**✅ Complete:**
- [ ] User can log in with valid email and password
- [ ] Invalid credentials show error: "Email or password is incorrect"
- [ ] Account locks after 5 failed attempts
- [ ] Locked account shows error: "Account locked. Check email for unlock instructions"
- [ ] Successful login redirects to dashboard

### 4. Use Consistent Format
Format as checkboxes for easy validation tracking.

**✅ Standard Format:**
```markdown
**Acceptance Criteria:**
- [ ] [Action/condition 1]
- [ ] [Action/condition 2]
- [ ] [Action/condition 3]
```

### 5. Focus on Outcomes, Not Implementation
Describe what happens, not how it's built.

**❌ Too technical:**
- [ ] API returns 200 status code with JWT token in response body
- [ ] React component renders using useState hook

**✅ Outcome-focused:**
- [ ] User receives authentication token on successful login
- [ ] Form displays error messages below invalid fields

---

## Categories of Acceptance Criteria

### Functional Criteria
What the feature must do.

**Example - User Registration:**
- [ ] User can enter email, password, and confirm password
- [ ] Email format must be valid (contains @ and domain)
- [ ] Password and confirm password must match
- [ ] Account is created in database with user-provided information
- [ ] Confirmation email sent to provided email address
- [ ] User redirected to email verification page

### Validation Criteria
Input validation and data integrity.

**Example - Form Validation:**
- [ ] Email field rejects invalid formats (missing @, invalid domain)
- [ ] Email field rejects duplicate emails (shows "Email already registered")
- [ ] Password field enforces 8 character minimum
- [ ] Password field requires at least one uppercase letter
- [ ] Password field requires at least one number
- [ ] Required fields show error when empty on submit

### Error Handling Criteria
How errors are displayed and handled.

**Example - API Error Handling:**
- [ ] Network error shows: "Connection lost. Please check internet and try again"
- [ ] 400 error shows specific validation errors per field
- [ ] 401 error redirects to login with message: "Session expired. Please log in again"
- [ ] 403 error shows: "You don't have permission to perform this action"
- [ ] 500 error shows: "Something went wrong. Please try again later"
- [ ] Error messages are dismissible by user

### UI/UX Criteria
Visual and interaction requirements.

**Example - Button States:**
- [ ] Button shows loading spinner during async operation
- [ ] Button is disabled while loading
- [ ] Button shows success checkmark for 2 seconds after completion
- [ ] Button returns to default state after success animation
- [ ] Button shows error state (red) if operation fails
- [ ] Button text clearly indicates action ("Save Changes", not "Submit")

### Performance Criteria
Speed and efficiency requirements.

**Example - Search Performance:**
- [ ] Search results appear within 1 second of query submission
- [ ] Results update without full page reload
- [ ] Search handles 1000+ concurrent users without degradation
- [ ] Autocomplete suggestions appear within 300ms of typing
- [ ] Search indexes update within 5 minutes of content changes

### Security Criteria
Security and privacy requirements.

**Example - Password Handling:**
- [ ] Password is hashed before storage (never stored plain text)
- [ ] Password is not visible in browser DevTools network tab
- [ ] Password field masks characters by default
- [ ] "Show password" toggle reveals password when clicked
- [ ] Password validation happens on both client and server
- [ ] Failed login attempts are rate-limited (5 per 15 minutes)

### Accessibility Criteria
Standards for users with disabilities.

**Example - Form Accessibility:**
- [ ] All form inputs have associated labels
- [ ] Error messages have role="alert" for screen readers
- [ ] Form can be completed entirely with keyboard
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast ratio meets WCAG AA standard (4.5:1)
- [ ] Invalid fields have aria-invalid="true" attribute

### Data/Content Criteria
How data is displayed and managed.

**Example - User List Display:**
- [ ] List displays user name, email, and join date
- [ ] List is paginated (20 users per page)
- [ ] User count shown (e.g., "Showing 1-20 of 156 users")
- [ ] Empty state shows "No users found" when list is empty
- [ ] Deleted users do not appear in list
- [ ] List updates immediately after user added/removed

---

## Common Patterns & Examples

### Pattern: CRUD Operations

**Create:**
- [ ] User can create new [entity] via [form/modal]
- [ ] All required fields must be completed
- [ ] Form validation prevents invalid data
- [ ] Success message shows after creation
- [ ] New [entity] appears in [list] immediately
- [ ] User redirected to [entity] detail page

**Read:**
- [ ] User can view [entity] details
- [ ] All [entity] fields displayed correctly
- [ ] Related [entities] shown in [section]
- [ ] "Not found" page shown if [entity] doesn't exist
- [ ] "Access denied" shown if user lacks permission

**Update:**
- [ ] User can edit [entity] via [form/modal]
- [ ] Form pre-populated with current values
- [ ] Changes saved on "Save" button click
- [ ] Success message shown after update
- [ ] Updated values reflected immediately
- [ ] "Last modified" timestamp updated

**Delete:**
- [ ] Delete button available on [entity] page
- [ ] Confirmation dialog shown before deletion
- [ ] Dialog explains deletion consequences
- [ ] [Entity] removed from database on confirmation
- [ ] User redirected to [list] page after deletion
- [ ] Success message shown
- [ ] Related [entities] handled appropriately (cascade/block)

### Pattern: Authentication Flow

**Login:**
- [ ] User can enter email and password
- [ ] Valid credentials grant access
- [ ] Invalid credentials show: "Email or password incorrect"
- [ ] Unverified accounts show: "Please verify your email"
- [ ] Locked accounts show: "Account locked. Contact support"
- [ ] Successful login redirects to [destination]
- [ ] Session token generated with [X hour] expiry
- [ ] "Remember me" extends session to [X days]

### Pattern: Search & Filter

**Search:**
- [ ] Search input accepts text up to 100 characters
- [ ] Search triggers on Enter key or search button
- [ ] Results shown within 1 second
- [ ] Results highlight matching terms
- [ ] "No results" message if no matches found
- [ ] Results count displayed (e.g., "42 results")
- [ ] Search works across [list of fields]

**Filter:**
- [ ] Filter panel shows all available filters
- [ ] Multiple filters can be applied simultaneously
- [ ] Active filters shown as removable chips
- [ ] Results update without page reload
- [ ] Filter count shows matching results
- [ ] "Clear all" button removes all filters
- [ ] No results shows: "No items match these filters"

### Pattern: File Upload

**Upload:**
- [ ] User can drag-and-drop files to upload
- [ ] User can click to browse and select files
- [ ] Multiple files can be selected simultaneously
- [ ] Only [file types] accepted (rejects others)
- [ ] Files over [X]MB rejected with clear error
- [ ] Upload progress indicator shown for each file
- [ ] User can cancel upload in progress
- [ ] Completed uploads show in [location]

### Pattern: Notifications

**In-App:**
- [ ] Notification bell icon shows unread count
- [ ] Clicking bell opens notification panel
- [ ] Panel shows up to 10 most recent notifications
- [ ] Each notification shows timestamp and message
- [ ] Clicking notification marks as read
- [ ] Clicking notification navigates to related content
- [ ] "Mark all as read" button available
- [ ] Notifications older than 30 days auto-archived

**Email:**
- [ ] Email sent within [X] minutes of trigger event
- [ ] Email subject clearly describes notification
- [ ] Email body contains relevant details and action link
- [ ] Email footer includes unsubscribe link
- [ ] Email respects user's notification preferences
- [ ] Failed email deliveries retry up to 3 times
- [ ] Email template is mobile-responsive

---

## Anti-Patterns to Avoid

### Too Vague
**❌ Don't write:**
- [ ] User can manage their account
- [ ] System handles errors appropriately  
- [ ] Interface is user-friendly

**✅ Instead write:**
- [ ] User can update name, email, and password in account settings
- [ ] Network errors show: "Connection lost" with retry button
- [ ] All interactive elements have hover states and focus indicators

### Too Technical
**❌ Don't write:**
- [ ] GraphQL mutation returns user object with JWT token
- [ ] Redux state updates on successful API response
- [ ] Component re-renders when props change

**✅ Instead write:**
- [ ] User receives authentication token after successful login
- [ ] Dashboard data refreshes after user updates profile
- [ ] Form displays updated values after save

### Mixing Multiple Concerns
**❌ Don't write:**
- [ ] User can log in, reset password, verify email, and update profile

**✅ Instead write:**
Create separate stories for each concern, or break into multiple criteria:
- [ ] User can log in with email and password
- [ ] User can request password reset from login page
- [ ] User receives password reset email with valid link
- [ ] User can set new password via reset link

### Non-Testable
**❌ Don't write:**
- [ ] System is fast
- [ ] Design is modern and attractive
- [ ] Error messages are clear

**✅ Instead write:**
- [ ] API endpoints respond within 200ms (p95)
- [ ] Design uses current brand colors and typography
- [ ] Error messages specify which field is invalid and why

---

## Acceptance Criteria Checklist

Before finalizing a user story, verify:

**Completeness:**
- [ ] Happy path covered
- [ ] Error scenarios covered
- [ ] Edge cases covered
- [ ] Loading/waiting states covered
- [ ] Empty states covered

**Quality:**
- [ ] All criteria are testable
- [ ] Specific values/thresholds provided
- [ ] No subjective language
- [ ] No implementation details
- [ ] Consistent formatting

**Coverage:**
- [ ] Functional requirements defined
- [ ] Validation requirements defined
- [ ] Error handling defined
- [ ] UI/UX requirements defined
- [ ] Performance requirements defined (if applicable)
- [ ] Security requirements defined (if applicable)
- [ ] Accessibility requirements defined (if applicable)

---

## Examples by Story Type

### Example 1: Feature Story

**Story:** User can add items to shopping cart

**Acceptance Criteria:**
- [ ] "Add to Cart" button visible on product page
- [ ] Clicking button adds 1 quantity to cart
- [ ] User can adjust quantity (1-99) before adding
- [ ] Variant selection required for products with variants
- [ ] Out-of-stock products show "Out of Stock" instead of button
- [ ] Cart icon badge updates with total item count
- [ ] Toast notification shows: "Added to cart" for 3 seconds
- [ ] User can click "View Cart" in toast to go to cart page
- [ ] Cart persists across browser sessions for logged-in users
- [ ] Cart limited to 100 items total

### Example 2: Bug Fix Story

**Story:** Fix duplicate notifications being sent

**Acceptance Criteria:**
- [ ] User receives exactly one email per notification event
- [ ] User receives exactly one push notification per event
- [ ] In-app notification counter matches actual notification count
- [ ] No duplicate notifications in notification history
- [ ] Duplicate detection works across all notification types
- [ ] Fix applies to both new and existing users
- [ ] Existing duplicate notifications are deduplicated
- [ ] System logs confirm single notification sent per event

### Example 3: Technical Story

**Story:** Migrate database to PostgreSQL

**Acceptance Criteria:**
- [ ] All tables migrated with correct schema
- [ ] All data migrated without loss (row counts match)
- [ ] All indexes recreated on new database
- [ ] All foreign key relationships maintained
- [ ] Application connects to new database successfully
- [ ] All API endpoints function correctly with new database
- [ ] Query performance meets or exceeds previous benchmarks
- [ ] Migration rollback plan documented and tested
- [ ] Old database backed up and retained for 30 days
- [ ] Zero downtime during migration (or downtime < 5 minutes)

---

## Tips for Review

When reviewing acceptance criteria:

1. **Can QA test it?** If tester asks "how do I verify this?", it's not specific enough
2. **Are metrics defined?** Performance, size limits, counts should have numbers
3. **Are edge cases covered?** Empty states, max limits, errors
4. **Can it be split?** If criteria is very long, consider splitting story
5. **Is it user-focused?** Should describe outcome, not implementation
6. **Is it complete?** Story should be fully defined, no assumptions needed

---

## Summary

**Good acceptance criteria are:**
- ✅ Testable and objective
- ✅ Specific with concrete values
- ✅ Complete (happy path + errors + edge cases)
- ✅ Formatted as checkboxes
- ✅ Outcome-focused, not implementation-focused
- ✅ Verifiable by QA without interpretation

**Avoid:**
- ❌ Vague or subjective language
- ❌ Implementation details
- ❌ Non-testable statements
- ❌ Mixing multiple concerns
- ❌ Missing edge cases or error scenarios

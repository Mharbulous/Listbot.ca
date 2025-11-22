# User Story Patterns by Feature Type

This reference provides proven story patterns for common feature types. Use these as templates and adapt to your specific context.

---

## Authentication & Authorization Stories

### User Registration
**As a** new user  
**I want to** create an account with email and password  
**So that** I can access personalized features

**Acceptance Criteria:**
- [ ] User can enter email, password, and confirmation password
- [ ] Email validation prevents invalid formats
- [ ] Email uniqueness is enforced (error shown if already exists)
- [ ] Password meets security requirements (8+ chars, mix of char types)
- [ ] Password confirmation must match
- [ ] User receives confirmation email
- [ ] Account created with proper default values in database
- [ ] Clear error messages for validation failures
- [ ] Success message and redirect after registration

### Social Login (OAuth)
**As a** user  
**I want to** sign in with my Google/Facebook account  
**So that** I don't have to remember another password

**Acceptance Criteria:**
- [ ] OAuth button displayed on login page
- [ ] Clicking button redirects to OAuth provider
- [ ] After authorization, user returned to application
- [ ] New account created if user doesn't exist
- [ ] Existing account linked if email matches
- [ ] User profile populated with OAuth data
- [ ] Error handling for OAuth failures
- [ ] Privacy policy link shown before OAuth

### Password Reset
**As a** user who forgot my password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] User can request password reset from login page
- [ ] Email with reset link sent if account exists
- [ ] No indication given whether email exists (security)
- [ ] Reset link expires after 1 hour
- [ ] Reset link can only be used once
- [ ] New password must meet security requirements
- [ ] User notified of successful password change
- [ ] Old sessions invalidated after reset

### Two-Factor Authentication
**As a** security-conscious user  
**I want to** enable two-factor authentication  
**So that** my account has additional protection

**Acceptance Criteria:**
- [ ] User can enable 2FA in account settings
- [ ] QR code generated for authenticator app setup
- [ ] Backup codes provided and downloadable
- [ ] 2FA required on subsequent logins
- [ ] User can disable 2FA with password verification
- [ ] Recovery option available if device lost
- [ ] Clear instructions provided for setup

---

## CRUD (Create, Read, Update, Delete) Stories

### Create Entity
**As a** [user type]  
**I want to** create a new [entity]  
**So that** I can [manage/track/organize] my [data/workflow/information]

**Acceptance Criteria:**
- [ ] User can access create form from [location]
- [ ] All required fields are marked
- [ ] Form validation prevents invalid data
- [ ] User receives confirmation on successful creation
- [ ] New entity appears in [list/dashboard]
- [ ] Entity has proper default values
- [ ] User redirected to [appropriate page] after creation
- [ ] Error messages clear if creation fails

### Read/View Entity
**As a** [user type]  
**I want to** view details of a [entity]  
**So that** I can [review/analyze/understand] the information

**Acceptance Criteria:**
- [ ] User can access entity from [list/search/link]
- [ ] All entity fields displayed correctly
- [ ] Related entities shown (if applicable)
- [ ] Loading state displayed while fetching data
- [ ] Error message if entity not found or access denied
- [ ] Data formatted appropriately for display
- [ ] Actions available (edit, delete, share) shown

### Update Entity
**As a** [user type]  
**I want to** edit an existing [entity]  
**So that** I can [keep information current/fix mistakes]

**Acceptance Criteria:**
- [ ] User can access edit form from entity view
- [ ] Form pre-populated with current values
- [ ] Validation applied to all fields
- [ ] Changes saved only on explicit save action
- [ ] User can cancel without saving changes
- [ ] Confirmation message shown on successful update
- [ ] Updated entity reflects changes immediately
- [ ] Last modified timestamp updated

### Delete Entity
**As a** [user type]  
**I want to** delete a [entity]  
**So that** I can remove obsolete or incorrect data

**Acceptance Criteria:**
- [ ] Delete option available from entity view
- [ ] Confirmation dialog shown before deletion
- [ ] Confirmation explains consequences (e.g., "This cannot be undone")
- [ ] Entity removed from database on confirmation
- [ ] User redirected to appropriate page after deletion
- [ ] Success message shown
- [ ] Related entities handled appropriately (cascade/block)
- [ ] Soft delete option (if required) maintains data integrity

### List/View All Entities
**As a** [user type]  
**I want to** see a list of all my [entities]  
**So that** I can [browse/select/manage] them

**Acceptance Criteria:**
- [ ] List displays all user's entities
- [ ] Pagination implemented if more than [X] items
- [ ] Each item shows key information
- [ ] List sorted by [default sort criteria]
- [ ] Loading state shown while fetching
- [ ] Empty state shown when no entities exist
- [ ] Actions available on each item (view, edit, delete)
- [ ] Performance optimized for large lists

---

## Search & Filter Stories

### Basic Search
**As a** user  
**I want to** search for [entities] by [keyword]  
**So that** I can quickly find what I'm looking for

**Acceptance Criteria:**
- [ ] Search box accessible from main navigation
- [ ] Search triggers on Enter key or search button
- [ ] Results displayed within [X] seconds
- [ ] Results highlight matching terms
- [ ] Number of results shown
- [ ] Empty state message if no results
- [ ] Search works across multiple fields
- [ ] Recent searches saved for quick access

### Advanced Filters
**As a** user  
**I want to** filter [entities] by [multiple criteria]  
**So that** I can narrow down to specific items I need

**Acceptance Criteria:**
- [ ] Filter panel accessible from list view
- [ ] Multiple filter criteria can be applied simultaneously
- [ ] Filters include: [list specific filters]
- [ ] Active filters displayed as chips/tags
- [ ] User can clear individual filters or all filters
- [ ] Results update immediately when filters applied
- [ ] Filter state persists during session
- [ ] Number of matching results shown

### Sort Options
**As a** user  
**I want to** sort [entities] by different criteria  
**So that** I can organize the list in a way that's useful to me

**Acceptance Criteria:**
- [ ] Sort dropdown available in list view
- [ ] Sort options include: [list options like date, name, status]
- [ ] Both ascending and descending order available
- [ ] Current sort order visually indicated
- [ ] List re-renders smoothly when sort changes
- [ ] Sort preference saved for user session
- [ ] Default sort is [specify default]

---

## Payment & E-commerce Stories

### Add to Cart
**As a** shopper  
**I want to** add items to my shopping cart  
**So that** I can purchase multiple items at once

**Acceptance Criteria:**
- [ ] "Add to Cart" button visible on product pages
- [ ] User can select quantity before adding
- [ ] Variant selection required if applicable (size, color)
- [ ] Cart icon updates with item count
- [ ] Confirmation message shown when item added
- [ ] User can continue shopping or go to cart
- [ ] Out-of-stock items cannot be added
- [ ] Cart persists across sessions for logged-in users

### Checkout Process
**As a** customer  
**I want to** complete my purchase securely  
**So that** I can receive my items

**Acceptance Criteria:**
- [ ] Cart review step shows all items and total
- [ ] User can add/edit shipping address
- [ ] User can select shipping method
- [ ] Payment information collected securely (PCI compliant)
- [ ] Order summary shown before final confirmation
- [ ] User can apply discount codes
- [ ] Tax calculated based on location
- [ ] Order confirmation email sent after purchase
- [ ] User redirected to order confirmation page

### Payment Processing
**As a** customer  
**I want to** pay with my credit card  
**So that** I can complete my purchase

**Acceptance Criteria:**
- [ ] Card number, expiry, CVV fields displayed
- [ ] Real-time validation of card number format
- [ ] CVV and card number properly masked
- [ ] Payment processed via secure gateway (Stripe, PayPal, etc.)
- [ ] Loading indicator shown during processing
- [ ] Clear error messages for failed payments
- [ ] Success confirmation on approved payment
- [ ] No card details stored directly in database
- [ ] 3D Secure verification when required

### Refund Request
**As a** customer  
**I want to** request a refund for my order  
**So that** I can get my money back for items I'm returning

**Acceptance Criteria:**
- [ ] Refund option available on order details page
- [ ] User must provide reason for refund
- [ ] Refund policy displayed
- [ ] Confirmation dialog before submitting
- [ ] Refund request created in system
- [ ] Customer notified of request status
- [ ] Admin can approve/reject refund
- [ ] Refund processed to original payment method

---

## Notification Stories

### Email Notification
**As a** user  
**I want to** receive email notifications for [important events]  
**So that** I stay informed about [activity/updates]

**Acceptance Criteria:**
- [ ] Email sent when [trigger event] occurs
- [ ] Email contains relevant information about event
- [ ] Email formatting is professional and branded
- [ ] Unsubscribe link included in email footer
- [ ] User can control notification preferences
- [ ] No duplicate emails sent for same event
- [ ] Emails queued and sent asynchronously
- [ ] Failed email deliveries are retried

### In-App Notification
**As a** user  
**I want to** see notifications within the app  
**So that** I'm aware of important updates while using the system

**Acceptance Criteria:**
- [ ] Notification bell icon shows unread count
- [ ] Clicking bell opens notification panel
- [ ] Notifications listed with most recent first
- [ ] Each notification shows timestamp and brief message
- [ ] User can mark notifications as read
- [ ] User can mark all as read
- [ ] Clicking notification navigates to relevant content
- [ ] Notifications older than [X] days auto-archived

### Push Notification (Mobile)
**As a** mobile app user  
**I want to** receive push notifications  
**So that** I'm alerted to important events even when not using the app

**Acceptance Criteria:**
- [ ] User prompted to allow push notifications on first launch
- [ ] User can enable/disable in app settings
- [ ] Notifications sent when [trigger event] occurs
- [ ] Notification shows title and brief message
- [ ] Tapping notification opens app to relevant screen
- [ ] Notifications respect quiet hours (if configured)
- [ ] Badge count updated on app icon
- [ ] User can customize notification categories

---

## File Upload/Management Stories

### Upload File
**As a** user  
**I want to** upload files to [location/entity]  
**So that** I can [store/share/attach] documents

**Acceptance Criteria:**
- [ ] User can drag-and-drop files to upload
- [ ] User can click to browse and select files
- [ ] Multiple files can be uploaded simultaneously
- [ ] File type restrictions enforced (if applicable)
- [ ] File size limit enforced (max [X] MB)
- [ ] Upload progress indicator shown
- [ ] User can cancel upload in progress
- [ ] Files scanned for viruses before acceptance
- [ ] Uploaded files visible immediately after upload

### View/Download File
**As a** user  
**I want to** view or download uploaded files  
**So that** I can access the content

**Acceptance Criteria:**
- [ ] Files listed with name, size, and upload date
- [ ] Preview available for supported file types (images, PDFs)
- [ ] Download button available for all files
- [ ] File downloads with original filename
- [ ] Access control enforced (only authorized users)
- [ ] Thumbnails generated for images
- [ ] File type icons shown for documents

### Delete File
**As a** user  
**I want to** delete uploaded files  
**So that** I can remove outdated or incorrect documents

**Acceptance Criteria:**
- [ ] Delete option available for file owner
- [ ] Confirmation dialog shown before deletion
- [ ] File removed from storage after confirmation
- [ ] File reference removed from database
- [ ] Success message shown after deletion
- [ ] Action cannot be undone (or trash/recovery period)
- [ ] Associated thumbnails also deleted

---

## Reporting & Analytics Stories

### Generate Report
**As a** user  
**I want to** generate a report of [data/metrics]  
**So that** I can analyze [trends/performance]

**Acceptance Criteria:**
- [ ] User can select report type from dropdown
- [ ] Date range selector available
- [ ] Additional filters available (as appropriate)
- [ ] Report generates within [X] seconds
- [ ] Data displayed in appropriate format (table/chart)
- [ ] User can export report as PDF/CSV/Excel
- [ ] Report shows timestamp of generation
- [ ] Empty state if no data matches criteria

### View Dashboard
**As a** user  
**I want to** see a dashboard of key metrics  
**So that** I can quickly understand performance at a glance

**Acceptance Criteria:**
- [ ] Dashboard shows [list key metrics]
- [ ] Metrics update in real-time or near real-time
- [ ] Charts and graphs visualize trends
- [ ] Date range selector filters all dashboard data
- [ ] Dashboard loads within [X] seconds
- [ ] Responsive layout works on mobile
- [ ] User can customize which widgets are shown
- [ ] Drill-down available for detailed views

### Schedule Report
**As a** user  
**I want to** schedule reports to be sent automatically  
**So that** I receive regular updates without manual work

**Acceptance Criteria:**
- [ ] User can select report type to schedule
- [ ] Frequency options: daily, weekly, monthly
- [ ] User can select delivery time/day
- [ ] Email recipients can be specified
- [ ] Report format selectable (PDF, CSV, Excel)
- [ ] User can view list of scheduled reports
- [ ] User can edit or delete scheduled reports
- [ ] Reports sent reliably at scheduled time

---

## Social/Collaboration Stories

### Comment on Item
**As a** user  
**I want to** add comments to [items/posts/documents]  
**So that** I can discuss or provide feedback

**Acceptance Criteria:**
- [ ] Comment box available on item detail page
- [ ] User can enter and submit comment
- [ ] Comment appears immediately after submission
- [ ] Comments listed chronologically
- [ ] User's name and timestamp shown with each comment
- [ ] User can edit their own comments
- [ ] User can delete their own comments
- [ ] Character limit enforced (if applicable)

### Share Item
**As a** user  
**I want to** share items with other users  
**So that** we can collaborate

**Acceptance Criteria:**
- [ ] Share button available on item
- [ ] User can search for recipients by name/email
- [ ] User can set permission level (view/edit)
- [ ] Recipients notified of share via email
- [ ] Shared items appear in recipient's dashboard
- [ ] Owner can revoke access at any time
- [ ] Recipient can decline share
- [ ] Share history tracked

### Follow/Subscribe
**As a** user  
**I want to** follow [users/topics/items]  
**So that** I'm notified of updates

**Acceptance Criteria:**
- [ ] Follow button available on relevant pages
- [ ] Follow status clearly indicated (following/not following)
- [ ] User notified when followed entity has updates
- [ ] User can view list of things they're following
- [ ] User can unfollow at any time
- [ ] Follow count displayed (if public)

---

## Settings/Preferences Stories

### Update Profile
**As a** user  
**I want to** update my profile information  
**So that** my account details are current

**Acceptance Criteria:**
- [ ] User can access profile from account menu
- [ ] Form shows current profile information
- [ ] User can update: name, email, phone, bio
- [ ] Profile picture upload available
- [ ] Email change requires verification
- [ ] Validation applied to all fields
- [ ] Success message shown on save
- [ ] Changes reflected immediately across app

### Notification Preferences
**As a** user  
**I want to** control which notifications I receive  
**So that** I'm not overwhelmed with alerts

**Acceptance Criteria:**
- [ ] Settings page lists all notification types
- [ ] User can toggle each notification type on/off
- [ ] Separate controls for email, push, in-app
- [ ] User can set quiet hours
- [ ] Changes save immediately
- [ ] User can reset to defaults
- [ ] Preview of notification types provided

### Privacy Settings
**As a** user  
**I want to** control who can see my information  
**So that** I maintain my privacy

**Acceptance Criteria:**
- [ ] Privacy settings page accessible from account
- [ ] User can set profile visibility (public/private/friends)
- [ ] User can control what information is public
- [ ] User can manage blocked users list
- [ ] User can download their data (GDPR compliance)
- [ ] User can delete their account
- [ ] Changes take effect immediately

---

## Admin/Moderation Stories

### Manage Users (Admin)
**As an** admin  
**I want to** manage user accounts  
**So that** I can maintain system integrity

**Acceptance Criteria:**
- [ ] Admin can view list of all users
- [ ] Admin can search/filter users
- [ ] Admin can view user details
- [ ] Admin can suspend/unsuspend accounts
- [ ] Admin can reset user passwords
- [ ] Admin can assign roles/permissions
- [ ] All admin actions logged for audit
- [ ] Confirmation required for destructive actions

### Review Content (Moderator)
**As a** moderator  
**I want to** review flagged content  
**So that** I can remove inappropriate material

**Acceptance Criteria:**
- [ ] Queue of flagged items shown to moderator
- [ ] Each item shows flag reason and reporter
- [ ] Moderator can view full content
- [ ] Moderator can approve or remove content
- [ ] Moderator can warn or ban user
- [ ] Action reason must be provided
- [ ] User notified of moderation decision
- [ ] All moderation actions logged

---

## Tips for Adapting Patterns

1. **Personalize the persona:** Change "user" to the specific user type
2. **Contextualize the benefit:** Make "so that" clause specific to your product
3. **Add domain-specific criteria:** Include acceptance criteria relevant to your business rules
4. **Consider edge cases:** Add criteria for error scenarios, empty states, loading states
5. **Check dependencies:** Note if this story depends on other stories being complete
6. **Estimate complexity:** Assign a size estimate (small/medium/large)

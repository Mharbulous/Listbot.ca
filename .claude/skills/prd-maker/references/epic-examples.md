# Epic Examples by Domain

Complete epic breakdowns for common feature domains. Use these as references when structuring your own epics.

---

## Epic: User Authentication & Authorization

**Priority:** Must-have  
**Business Value:** High  
**Target Release:** MVP  
**Estimated Duration:** 3-4 sprints

### Overview
Complete authentication system allowing users to securely create accounts, log in, recover passwords, and manage their security settings. Foundation for all personalized features.

### User Stories

#### 1. User Registration
**As a** new user  
**I want to** create an account with email and password  
**So that** I can access personalized features

**Acceptance Criteria:**
- [ ] Registration form with email, password, confirm password fields
- [ ] Email format validation
- [ ] Email uniqueness check (clear error if exists)
- [ ] Password strength requirements enforced (8+ chars, mixed types)
- [ ] Password confirmation must match
- [ ] Verification email sent upon registration
- [ ] Account created with inactive status until verified
- [ ] Success message and redirect to verification notice

**Priority:** High | **Dependencies:** None | **Complexity:** Medium

#### 2. Email Verification
**As a** newly registered user  
**I want to** verify my email address  
**So that** I can activate my account

**Acceptance Criteria:**
- [ ] Verification email contains unique token link
- [ ] Clicking link verifies email and activates account
- [ ] Token expires after 24 hours
- [ ] Clear error message for expired tokens
- [ ] User can request new verification email
- [ ] Success message shown after verification
- [ ] User redirected to login or onboarding

**Priority:** High | **Dependencies:** User Registration | **Complexity:** Medium

#### 3. User Login
**As a** registered user  
**I want to** log in with email and password  
**So that** I can access my account

**Acceptance Criteria:**
- [ ] Login form with email and password fields
- [ ] Valid credentials grant access
- [ ] Invalid credentials show clear error
- [ ] Account lockout after 5 failed attempts
- [ ] Lockout notification sent via email
- [ ] Session token generated on successful login
- [ ] "Remember me" option for extended session
- [ ] Redirect to dashboard after login

**Priority:** High | **Dependencies:** User Registration | **Complexity:** Medium

#### 4. Password Reset
**As a** user who forgot password  
**I want to** reset my password via email  
**So that** I can regain access

**Acceptance Criteria:**
- [ ] "Forgot password" link on login page
- [ ] User enters email address
- [ ] Reset email sent if account exists (no indication if not)
- [ ] Reset link expires after 1 hour
- [ ] Reset link single-use only
- [ ] New password meets strength requirements
- [ ] All active sessions invalidated on reset
- [ ] Confirmation email sent after successful reset

**Priority:** High | **Dependencies:** User Login | **Complexity:** Medium

#### 5. Social Login (OAuth)
**As a** user  
**I want to** sign in with Google/Facebook  
**So that** I don't need to manage another password

**Acceptance Criteria:**
- [ ] OAuth buttons on login and registration pages
- [ ] Redirect to OAuth provider on click
- [ ] Handle OAuth callback and exchange token
- [ ] Create new account if email doesn't exist
- [ ] Link to existing account if email matches
- [ ] Profile data populated from OAuth
- [ ] Handle OAuth errors gracefully
- [ ] Privacy policy link shown before OAuth

**Priority:** Medium | **Dependencies:** User Login | **Complexity:** Large

#### 6. Two-Factor Authentication
**As a** security-conscious user  
**I want to** enable 2FA on my account  
**So that** my account has additional protection

**Acceptance Criteria:**
- [ ] 2FA toggle in account settings
- [ ] QR code generated for authenticator app
- [ ] Backup codes generated (10 single-use codes)
- [ ] User can download/print backup codes
- [ ] 2FA required on subsequent logins after enabling
- [ ] Option to disable 2FA (requires password)
- [ ] Recovery flow using backup codes
- [ ] Clear setup instructions provided

**Priority:** Low (Nice-to-have) | **Dependencies:** User Login | **Complexity:** Large

### Technical Considerations
- Use bcrypt or Argon2 for password hashing (cost factor 12+)
- JWT tokens for session management (24hr expiry, 30 days with remember-me)
- Refresh token rotation for extended sessions
- Rate limiting on login endpoint (5 attempts per 15 minutes per IP)
- OAuth integration requires registered app credentials
- Email service integration (SendGrid, AWS SES, etc.)
- Secure token generation (cryptographically random)
- HTTPS required for all authentication flows

### UX Considerations
- Clear, actionable error messages
- Loading states during async operations
- Password strength indicator on registration
- Option to show/hide password
- Auto-focus on first form field
- Remember last used login method
- Smooth transitions between auth states
- Mobile-friendly form inputs

### Dependencies
- Email service provider configured
- Database user table created
- Session management infrastructure
- HTTPS/TLS certificates installed

### Success Metrics
- Registration completion rate >70%
- Email verification rate >80%
- Login success rate >95%
- Password reset completion rate >60%

---

## Epic: User Profile Management

**Priority:** Must-have  
**Business Value:** High  
**Target Release:** MVP  
**Estimated Duration:** 2 sprints

### Overview
Allow users to view and update their profile information, manage preferences, and control account settings.

### User Stories

#### 1. View Profile
**As a** user  
**I want to** view my profile information  
**So that** I can see what others see and verify my details

**Acceptance Criteria:**
- [ ] Profile page shows all user information
- [ ] Profile picture displayed (or default avatar)
- [ ] Display name, bio, location, website
- [ ] Join date and account status shown
- [ ] Edit profile button prominently placed
- [ ] Profile data loads within 500ms

**Priority:** High | **Dependencies:** Authentication | **Complexity:** Small

#### 2. Edit Profile
**As a** user  
**I want to** update my profile information  
**So that** my details are current and accurate

**Acceptance Criteria:**
- [ ] Form pre-filled with current data
- [ ] Can update: name, bio, location, website, phone
- [ ] Real-time character count for bio (max 500 chars)
- [ ] Email change requires verification
- [ ] Phone number format validation
- [ ] Save button disabled until changes made
- [ ] Success message on save
- [ ] Changes reflected immediately

**Priority:** High | **Dependencies:** View Profile | **Complexity:** Medium

#### 3. Upload Profile Picture
**As a** user  
**I want to** upload a profile picture  
**So that** my profile is personalized

**Acceptance Criteria:**
- [ ] Click to upload or drag-and-drop
- [ ] Image preview before upload
- [ ] Crop/resize tool provided
- [ ] File type validation (JPG, PNG, GIF)
- [ ] File size limit 5MB
- [ ] Image optimization on upload
- [ ] Old image deleted when new one uploaded
- [ ] Default avatar if no image uploaded

**Priority:** Medium | **Dependencies:** View Profile | **Complexity:** Medium

[Additional stories for privacy settings, notification preferences, etc.]

### Technical Considerations
- Image storage (S3, Cloudinary, etc.)
- Image processing/optimization pipeline
- Avatar generation for users without uploads
- Profile data caching strategy
- Privacy controls enforcement

### UX Considerations
- Real-time validation feedback
- Unsaved changes warning on navigation
- Mobile-optimized forms
- Profile preview while editing

---

## Epic: Product Search & Discovery

**Priority:** Must-have  
**Business Value:** High  
**Target Release:** MVP  
**Estimated Duration:** 3 sprints

### Overview
Enable users to find products through search and filtering, browse categories, and discover recommendations.

### User Stories

#### 1. Keyword Search
**As a** shopper  
**I want to** search for products by keyword  
**So that** I can quickly find what I'm looking for

**Acceptance Criteria:**
- [ ] Search bar prominently placed in navigation
- [ ] Search triggers on Enter or click
- [ ] Results show within 1 second
- [ ] Minimum 3 characters required
- [ ] Search across product names and descriptions
- [ ] Typo tolerance (fuzzy matching)
- [ ] Results highlight matching terms
- [ ] Number of results displayed
- [ ] "No results" state with suggestions

**Priority:** High | **Dependencies:** Product catalog | **Complexity:** Large

#### 2. Filter by Category
**As a** shopper  
**I want to** browse products by category  
**So that** I can explore specific product types

**Acceptance Criteria:**
- [ ] Category navigation in main menu
- [ ] Clicking category shows filtered results
- [ ] Subcategories available for drill-down
- [ ] Breadcrumb navigation shows path
- [ ] Product count shown per category
- [ ] Empty categories hidden or marked
- [ ] Category images/icons displayed

**Priority:** High | **Dependencies:** Product catalog | **Complexity:** Medium

#### 3. Advanced Filters
**As a** shopper  
**I want to** filter products by multiple attributes  
**So that** I can narrow down to exactly what I need

**Acceptance Criteria:**
- [ ] Filter panel available on search/category pages
- [ ] Filters: price range, brand, color, size, rating
- [ ] Multiple filters can be applied simultaneously
- [ ] Active filters shown as removable chips
- [ ] Results update without page reload
- [ ] Filter count shows matched products
- [ ] "Clear all" button available
- [ ] Filters collapse on mobile

**Priority:** High | **Dependencies:** Keyword Search | **Complexity:** Large

#### 4. Sort Results
**As a** shopper  
**I want to** sort search results  
**So that** I can organize products by what's most relevant to me

**Acceptance Criteria:**
- [ ] Sort dropdown on search/category pages
- [ ] Options: Relevance, Price (low-high), Price (high-low), Rating, Newest
- [ ] Current sort visually indicated
- [ ] Results re-render smoothly on sort change
- [ ] Sort preference persists during session
- [ ] Default sort is "Relevance"

**Priority:** Medium | **Dependencies:** Keyword Search | **Complexity:** Small

[Additional stories for recommendations, recently viewed, etc.]

### Technical Considerations
- Search engine (Elasticsearch, Algolia, etc.)
- Index optimization for performance
- Caching strategy for popular searches
- Analytics tracking for search terms
- A/B testing framework for relevance tuning

### UX Considerations
- Autocomplete suggestions
- Search history (recent searches)
- Visual search (upload image to find similar)
- Filter combinations that return zero results handled gracefully

---

## Epic: Shopping Cart & Checkout

**Priority:** Must-have  
**Business Value:** High (Critical Path)  
**Target Release:** MVP  
**Estimated Duration:** 4 sprints

### Overview
Complete e-commerce purchase flow from adding items to cart through payment processing and order confirmation.

### User Stories

#### 1. Add Item to Cart
**As a** shopper  
**I want to** add products to my cart  
**So that** I can purchase multiple items together

**Acceptance Criteria:**
- [ ] "Add to Cart" button on product pages
- [ ] Quantity selector available
- [ ] Variant selection required (size, color, etc.)
- [ ] Stock availability checked
- [ ] Cart icon updates with count
- [ ] Toast notification confirms addition
- [ ] User can continue shopping or go to cart
- [ ] Cart persists for logged-in users

**Priority:** High | **Dependencies:** Product catalog | **Complexity:** Medium

[Continue with stories for: View Cart, Update Quantities, Remove Items, Apply Coupon, Checkout, Payment Processing, Order Confirmation]

### Technical Considerations
- Cart storage (session, database, Redis)
- Inventory management integration
- Payment gateway integration (Stripe, PayPal)
- PCI compliance requirements
- Order processing workflow
- Transaction idempotency
- Email notification system

### UX Considerations
- Clear cart total with tax breakdown
- Guest checkout option
- Save cart for later
- Mobile-optimized checkout
- Progress indicator during checkout
- Multiple payment methods
- Address autocomplete

---

## Epic: Admin Dashboard

**Priority:** Should-have  
**Business Value:** High  
**Target Release:** Phase 2  
**Estimated Duration:** 3 sprints

### Overview
Administrative interface for managing users, content, and monitoring system health.

### User Stories

#### 1. View User List
**As an** admin  
**I want to** see a list of all users  
**So that** I can monitor and manage accounts

**Acceptance Criteria:**
- [ ] Paginated list of all users
- [ ] Columns: name, email, status, join date, last login
- [ ] Search by name or email
- [ ] Filter by status (active, suspended, deleted)
- [ ] Sort by any column
- [ ] Click user to view details
- [ ] Bulk actions available (export, suspend)
- [ ] Performance optimized for 100k+ users

**Priority:** High | **Dependencies:** Authentication | **Complexity:** Medium

[Continue with stories for: User Details, Suspend/Unsuspend User, Analytics Dashboard, System Health Monitoring]

### Technical Considerations
- Role-based access control (RBAC)
- Admin audit logging
- Performance optimization for large datasets
- Real-time metrics collection
- Data export capabilities

### UX Considerations
- Responsive admin interface
- Keyboard shortcuts for common actions
- Confirmation dialogs for destructive actions
- Bulk operation feedback

---

## Epic: Notification System

**Priority:** Should-have  
**Business Value:** Medium  
**Target Release:** Phase 2  
**Estimated Duration:** 3 sprints

### Overview
Multi-channel notification system supporting email, in-app, and push notifications with user preferences.

### User Stories

[Stories for: In-App Notifications, Email Notifications, Push Notifications, Notification Preferences]

### Technical Considerations
- Message queue (RabbitMQ, AWS SQS)
- Email service provider
- Push notification service (FCM, APNs)
- Notification template engine
- Retry logic for failed deliveries
- Unsubscribe management

---

## Epic: Analytics & Reporting

**Priority:** Nice-to-have  
**Business Value:** Medium  
**Target Release:** Phase 3  
**Estimated Duration:** 4 sprints

### Overview
Business intelligence and reporting capabilities for stakeholders to track KPIs and make data-driven decisions.

[Stories for: Dashboard, Custom Reports, Scheduled Reports, Data Export]

---

## Template for Creating Your Own Epics

```markdown
## Epic: [Epic Name]

**Priority:** [Must-have/Should-have/Nice-to-have]  
**Business Value:** [High/Medium/Low]  
**Target Release:** [MVP/Phase 2/Phase 3]  
**Estimated Duration:** [X sprints]

### Overview
[2-3 sentence description of what this epic accomplishes and why it matters]

### User Stories

#### [Number]. [Story Title]
**As a** [user type]  
**I want to** [action]  
**So that** [benefit]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Priority:** [High/Medium/Low] | **Dependencies:** [Other stories] | **Complexity:** [Small/Medium/Large]

[Repeat for each story in epic]

### Technical Considerations
[Technical notes, architecture decisions, infrastructure needs]

### UX Considerations
[Design patterns, user flows, accessibility requirements]

### Dependencies
[External systems, APIs, infrastructure prerequisites]

### Success Metrics
[How to measure success of this epic]
```

---

## Tips for Epic Creation

1. **Keep epics focused:** Each epic should represent one cohesive feature area
2. **Size appropriately:** 3-10 stories per epic is typical
3. **Independent value:** Each epic should deliver value on its own
4. **Consider dependencies:** Order epics based on technical dependencies
5. **Include non-functional requirements:** Security, performance, accessibility
6. **Think about edge cases:** Error handling, empty states, loading states
7. **Plan for scale:** Consider how epic works with 10x users/data
8. **Mobile-first thinking:** Ensure epics work across devices

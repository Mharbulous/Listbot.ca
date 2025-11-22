# Non-Functional Requirements Checklist

Comprehensive guide for specifying non-functional requirements (NFRs) across all critical categories.

---

## What Are Non-Functional Requirements?

Non-functional requirements (NFRs) define **how** a system should behave, rather than **what** it should do. They specify:
- Quality attributes (performance, security, usability)
- System constraints (scalability, compatibility)
- Design constraints (compliance, standards)

**Why NFRs Matter:**
- Prevent critical issues discovered late
- Guide architectural decisions
- Set clear expectations with stakeholders
- Enable proper testing and validation
- Ensure production readiness

---

## Performance Requirements

### Response Time
How quickly the system responds to user actions.

**Web Application Example:**
- [ ] API endpoints respond within 200ms (p95)
- [ ] API endpoints respond within 500ms (p99)
- [ ] Page load time under 2 seconds (p95)
- [ ] Page load time under 3 seconds (p99)
- [ ] Database queries complete within 50ms (p95)

**Mobile Application Example:**
- [ ] App launch time under 2 seconds
- [ ] Screen transitions under 300ms
- [ ] List scrolling maintains 60 FPS
- [ ] Image loading progressive (placeholder → full)

**Best Practices:**
- Use percentile metrics (p95, p99) not just averages
- Specify different targets for different operations
- Consider network conditions (3G, 4G, WiFi)
- Measure from user perspective, not just server

### Throughput
How much work the system can handle.

**Examples:**
- [ ] System handles 1000 concurrent users
- [ ] API processes 500 requests per second
- [ ] Batch job processes 10,000 records per minute
- [ ] File uploads support 100 concurrent uploads
- [ ] WebSocket server handles 5,000 concurrent connections

### Resource Usage
How efficiently the system uses resources.

**Examples:**
- [ ] Memory usage under 512MB per instance
- [ ] CPU usage under 70% during normal load
- [ ] Disk I/O under 100MB/s during normal operation
- [ ] Network bandwidth under 1Gbps during peak
- [ ] Database connection pool max 100 connections

---

## Security Requirements

### Authentication
How users prove their identity.

**Examples:**
- [ ] Passwords hashed with bcrypt (cost factor 12+) or Argon2
- [ ] Session tokens expire after 24 hours of inactivity
- [ ] Refresh tokens rotate on each use
- [ ] Multi-factor authentication supported
- [ ] OAuth 2.0 for third-party authentication
- [ ] API keys rotatable by users
- [ ] Failed login attempts rate-limited (5 per 15 minutes)

### Authorization
What authenticated users can do.

**Examples:**
- [ ] Role-based access control (RBAC) implemented
- [ ] Attribute-based access control (ABAC) for complex permissions
- [ ] Least privilege principle enforced
- [ ] Admin functions require admin role
- [ ] Users can only access their own data
- [ ] Permission checks on both frontend and backend
- [ ] API endpoints validate user permissions

### Data Protection
How sensitive data is protected.

**Examples:**
- [ ] All data encrypted in transit (TLS 1.3)
- [ ] All data encrypted at rest (AES-256)
- [ ] PII (Personally Identifiable Information) encrypted in database
- [ ] Payment data never stored (tokenized via payment processor)
- [ ] Passwords never logged or displayed
- [ ] Sensitive data masked in logs
- [ ] Database backups encrypted

### Input Validation
Preventing injection attacks.

**Examples:**
- [ ] All user input validated and sanitized
- [ ] SQL injection prevention via parameterized queries
- [ ] XSS prevention via output encoding
- [ ] CSRF tokens on all state-changing requests
- [ ] File upload validation (type, size, content)
- [ ] API rate limiting (100 requests per minute per user)
- [ ] Request size limits (5MB max payload)

### Compliance
Meeting regulatory requirements.

**Examples:**
- [ ] GDPR compliance (data portability, right to erasure)
- [ ] HIPAA compliance (if handling health data)
- [ ] PCI DSS compliance (if handling payments)
- [ ] SOC 2 Type II certification
- [ ] Cookie consent mechanism (GDPR)
- [ ] Privacy policy and terms of service
- [ ] Data retention and deletion policies

---

## Scalability Requirements

### Horizontal Scaling
Adding more servers/instances.

**Examples:**
- [ ] Application is stateless (scales horizontally)
- [ ] Load balancer distributes traffic across instances
- [ ] Session data stored in Redis (not in-memory)
- [ ] File uploads go to S3 (not local filesystem)
- [ ] Background jobs use message queue (not cron)
- [ ] Database supports read replicas
- [ ] Auto-scaling based on CPU/memory/requests

### Vertical Scaling
Handling growth on existing infrastructure.

**Examples:**
- [ ] System supports 10x current user base
- [ ] Database handles 100M+ rows efficiently
- [ ] Storage capacity for 10TB+ of user data
- [ ] Efficient queries (indexed, optimized joins)
- [ ] Pagination for large datasets
- [ ] Lazy loading for heavy resources

### Geographic Distribution
Supporting users globally.

**Examples:**
- [ ] CDN for static assets (images, CSS, JS)
- [ ] Multi-region deployment (US, EU, Asia)
- [ ] Database replication across regions
- [ ] Latency under 200ms globally
- [ ] Data residency requirements met (GDPR)
- [ ] Failover to backup region in under 5 minutes

---

## Reliability Requirements

### Availability
System uptime targets.

**Examples:**
- [ ] 99.9% uptime (43 minutes downtime per month)
- [ ] 99.95% uptime (21 minutes downtime per month)
- [ ] 99.99% uptime (4 minutes downtime per month)
- [ ] Planned maintenance windows outside business hours
- [ ] Zero-downtime deployments
- [ ] Blue-green deployment strategy
- [ ] Health checks and automatic failover

### Error Rate
How often things go wrong.

**Examples:**
- [ ] Less than 0.1% of requests result in errors
- [ ] Less than 0.01% of transactions fail
- [ ] Payment processing success rate >99.5%
- [ ] Email delivery success rate >98%
- [ ] API error rate under 1%

### Recovery
How quickly system recovers from failures.

**Examples:**
- [ ] Recovery Time Objective (RTO): 1 hour
- [ ] Recovery Point Objective (RPO): 5 minutes data loss max
- [ ] Automated failover within 30 seconds
- [ ] Database backup every 6 hours
- [ ] Point-in-time recovery available
- [ ] Disaster recovery plan documented and tested quarterly
- [ ] Backup restoration tested monthly

### Fault Tolerance
How system handles failures.

**Examples:**
- [ ] Graceful degradation when service unavailable
- [ ] Circuit breaker for external API calls
- [ ] Retry logic with exponential backoff
- [ ] Failed jobs automatically retried
- [ ] Offline mode for mobile app
- [ ] Cached data served when backend down
- [ ] No single point of failure

---

## Usability Requirements

### Learnability
How quickly users can learn the system.

**Examples:**
- [ ] New users complete onboarding in under 5 minutes
- [ ] Less than 3 support tickets per 100 new users
- [ ] Interactive tutorial for first-time users
- [ ] Contextual help available on complex features
- [ ] Common tasks require no training
- [ ] UI follows platform conventions (iOS, Android, Web)

### Efficiency
How quickly users can complete tasks.

**Examples:**
- [ ] Common tasks completable in under 3 clicks
- [ ] Keyboard shortcuts for power users
- [ ] Bulk actions available (select multiple, bulk edit)
- [ ] Recently used items quick-accessible
- [ ] Forms remember previous inputs
- [ ] Auto-complete for repetitive data entry

### Error Prevention & Recovery
Helping users avoid and fix mistakes.

**Examples:**
- [ ] Confirmation dialog for destructive actions
- [ ] Undo functionality for reversible actions
- [ ] Autosave every 30 seconds (draft mode)
- [ ] Clear error messages with solutions
- [ ] Validation feedback in real-time
- [ ] No data loss on browser crash/close
- [ ] "Are you sure?" for irreversible actions

---

## Accessibility Requirements

### WCAG Compliance
Meeting web accessibility standards.

**Examples:**
- [ ] WCAG 2.1 Level AA compliance
- [ ] Color contrast ratio minimum 4.5:1 (normal text)
- [ ] Color contrast ratio minimum 3:1 (large text)
- [ ] Information not conveyed by color alone
- [ ] All images have alt text
- [ ] All form inputs have associated labels

### Keyboard Navigation
Usable without a mouse.

**Examples:**
- [ ] All functionality accessible via keyboard
- [ ] Logical tab order through interactive elements
- [ ] Focus indicators visible on all elements
- [ ] Skip navigation links available
- [ ] Keyboard shortcuts don't conflict with assistive tech
- [ ] Modal dialogs trap focus appropriately

### Screen Reader Support
Usable with assistive technology.

**Examples:**
- [ ] Semantic HTML elements used (nav, main, article, etc.)
- [ ] ARIA labels for complex widgets
- [ ] ARIA live regions for dynamic content
- [ ] Skip links for navigation
- [ ] Form validation errors announced
- [ ] Loading states announced
- [ ] Tested with JAWS, NVDA, VoiceOver

### Visual Adaptability
Supporting different visual needs.

**Examples:**
- [ ] Text scaling to 200% without loss of functionality
- [ ] Responsive layout works at all zoom levels
- [ ] Dark mode available
- [ ] High contrast mode supported
- [ ] No content relies solely on color
- [ ] Font size adjustable by user

---

## Maintainability Requirements

### Code Quality
How easy code is to understand and modify.

**Examples:**
- [ ] Code coverage minimum 80%
- [ ] All public APIs documented
- [ ] Complex functions have inline comments
- [ ] Code passes linter with no warnings
- [ ] Consistent code style enforced
- [ ] No commented-out code in production
- [ ] Technical debt tracked and addressed

### Documentation
What must be documented.

**Examples:**
- [ ] README with setup instructions
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture decision records (ADRs)
- [ ] Database schema documentation
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] Code-level documentation for public APIs

### Testing
What must be tested.

**Examples:**
- [ ] Unit tests for all business logic
- [ ] Integration tests for API endpoints
- [ ] End-to-end tests for critical user flows
- [ ] Performance tests for key operations
- [ ] Security tests (OWASP Top 10)
- [ ] Accessibility tests (automated and manual)
- [ ] Browser compatibility tests (Chrome, Firefox, Safari, Edge)

### Monitoring & Observability
How system health is tracked.

**Examples:**
- [ ] Application logs centralized (ELK, Splunk, CloudWatch)
- [ ] Metrics tracked (CPU, memory, requests, errors)
- [ ] Distributed tracing implemented (Jaeger, Datadog)
- [ ] Alerts configured for critical issues
- [ ] Dashboard for key metrics
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Audit logs for sensitive operations

---

## Compatibility Requirements

### Browser Compatibility
Which browsers are supported.

**Examples:**
- [ ] Chrome (last 2 versions)
- [ ] Firefox (last 2 versions)
- [ ] Safari (last 2 versions)
- [ ] Edge (last 2 versions)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android 10+)

### Device Compatibility
Which devices are supported.

**Examples:**
- [ ] Desktop (1920x1080 and down to 1280x720)
- [ ] Tablet (1024x768 and similar)
- [ ] Mobile (375x667 and up to 414x896)
- [ ] Responsive design adapts to all screen sizes
- [ ] Touch-friendly targets (44x44px minimum)

### Operating System Compatibility
**Examples:**
- [ ] Windows 10+
- [ ] macOS 11+
- [ ] iOS 14+
- [ ] Android 10+
- [ ] Linux (Ubuntu 20.04+)

### API Compatibility
**Examples:**
- [ ] REST API follows semantic versioning
- [ ] Breaking changes require major version bump
- [ ] Deprecated endpoints supported for 6 months
- [ ] API versioning in URL (/api/v1, /api/v2)
- [ ] Backward compatibility maintained within major version

---

## Operational Requirements

### Deployment
How system is deployed.

**Examples:**
- [ ] Zero-downtime deployments
- [ ] Blue-green deployment strategy
- [ ] Automated CI/CD pipeline
- [ ] Rollback capability within 5 minutes
- [ ] Database migrations automated
- [ ] Feature flags for gradual rollout
- [ ] Canary deployments for high-risk changes

### Backup & Recovery
How data is protected.

**Examples:**
- [ ] Daily full database backups
- [ ] Incremental backups every 6 hours
- [ ] Backups retained for 30 days
- [ ] Backups stored in different region
- [ ] Backup restoration tested monthly
- [ ] Point-in-time recovery available
- [ ] RTO (Recovery Time Objective): 1 hour
- [ ] RPO (Recovery Point Objective): 5 minutes

### Monitoring & Alerting
How issues are detected.

**Examples:**
- [ ] Uptime monitoring with 1-minute checks
- [ ] Error rate alerts if >1% of requests fail
- [ ] Response time alerts if p95 >500ms
- [ ] Disk space alerts at 80% capacity
- [ ] Memory alerts at 85% usage
- [ ] Failed job alerts within 5 minutes
- [ ] SSL certificate expiry alerts 30 days before

---

## NFR Template by Project Type

### SaaS Application
**Critical NFRs:**
- Performance: API <200ms, Page load <2s
- Security: HTTPS, password hashing, RBAC
- Scalability: Horizontal scaling, multi-tenant
- Reliability: 99.9% uptime, automated backups
- Usability: Onboarding <5min, responsive design
- Accessibility: WCAG 2.1 AA

### Mobile App
**Critical NFRs:**
- Performance: App launch <2s, 60 FPS
- Security: Encrypted storage, secure API calls
- Compatibility: iOS 14+, Android 10+
- Reliability: Offline mode, sync conflicts
- Usability: Native UI patterns, touch-friendly
- Battery: Efficient background operations

### E-commerce Platform
**Critical NFRs:**
- Performance: Checkout flow <5s total
- Security: PCI DSS, fraud detection
- Scalability: Handle traffic spikes (Black Friday)
- Reliability: 99.95% uptime, order recovery
- Usability: Guest checkout, mobile-optimized
- Compliance: GDPR, payment regulations

### Enterprise System
**Critical NFRs:**
- Security: SSO, audit logs, data encryption
- Scalability: 10,000+ concurrent users
- Reliability: 99.99% uptime, disaster recovery
- Compliance: SOC 2, industry-specific regulations
- Integration: APIs for existing systems
- Reporting: Real-time analytics, custom reports

---

## NFR Checklist Template

Use this template when defining NFRs for a project:

```markdown
## Non-Functional Requirements

### Performance
- [ ] API response time: [target]
- [ ] Page load time: [target]
- [ ] Database query time: [target]
- [ ] Throughput: [target]
- [ ] Concurrent users: [target]

### Security
- [ ] Authentication: [method]
- [ ] Authorization: [model]
- [ ] Data encryption: [in transit/at rest]
- [ ] Compliance: [standards]
- [ ] Input validation: [approach]

### Scalability
- [ ] Horizontal scaling: [capability]
- [ ] User growth: [target]
- [ ] Data volume: [target]
- [ ] Geographic distribution: [regions]

### Reliability
- [ ] Uptime: [target %]
- [ ] Error rate: [target %]
- [ ] RTO: [time]
- [ ] RPO: [time]
- [ ] Backup frequency: [schedule]

### Accessibility
- [ ] WCAG compliance: [level]
- [ ] Keyboard navigation: [supported]
- [ ] Screen reader: [compatible]
- [ ] Color contrast: [ratio]

### Maintainability
- [ ] Code coverage: [target %]
- [ ] Documentation: [requirements]
- [ ] Monitoring: [tools]
- [ ] Logging: [approach]

### Compatibility
- [ ] Browsers: [list]
- [ ] Devices: [list]
- [ ] OS: [list]
- [ ] API versions: [strategy]
```

---

## Common Mistakes to Avoid

**❌ Too Vague:**
- "System should be fast"
- "Security should be good"
- "UI should be user-friendly"

**✅ Specific:**
- "API responds within 200ms (p95)"
- "All data encrypted with AES-256"
- "WCAG 2.1 Level AA compliant"

**❌ Unrealistic:**
- "100% uptime"
- "Infinite scalability"
- "Zero latency"

**✅ Achievable:**
- "99.9% uptime"
- "Scales to 10x current load"
- "Latency <200ms globally"

**❌ Missing Metrics:**
- "Good performance"
- "Highly available"
- "Very secure"

**✅ Measurable:**
- "Response time <200ms (p95)"
- "99.9% uptime"
- "OWASP Top 10 vulnerabilities mitigated"

---

## Summary

**Good NFRs are:**
- ✅ Specific and measurable
- ✅ Testable and verifiable
- ✅ Realistic and achievable
- ✅ Relevant to business needs
- ✅ Complete across all categories

**Always define:**
- ✅ Performance targets (with metrics)
- ✅ Security requirements (specific standards)
- ✅ Scalability needs (growth expectations)
- ✅ Reliability targets (uptime, recovery)
- ✅ Usability standards (accessibility, efficiency)
- ✅ Maintainability requirements (testing, docs)

**Remember:**
NFRs are not optional "nice-to-haves" — they're essential requirements that determine whether your system is production-ready.

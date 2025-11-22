# Product Requirements Document: Pleadings Feature
## ListBot.ca E-Discovery Platform

**Version:** 1.0  
**Date:** November 21, 2025  
**Author:** Product Manager, ListBot.ca  
**Status:** Draft - Ready for Review

---

## 1. Product Vision & Goals

### Vision Statement

Transform ListBot.ca into the only e-discovery platform that understands pleadings as the organizational framework for litigation—not just another document type—by automatically extracting facts, tracking party positions, and systematically connecting evidence to allegations, enabling litigation lawyers to work 60% faster and with greater confidence.

### Product Goals

1. **Establish Market Differentiation**
   - Metric: Competitive win rate when Pleadings feature is demonstrated
   - Target: 70% win rate against competitors in head-to-head evaluations
   - Timeline: 6 months post-launch

2. **Drive User Adoption**
   - Metric: % of litigation users actively using Pleadings feature weekly
   - Target: 75% adoption within 6 months
   - Timeline: Month-over-month growth to 75% by Month 6

3. **Deliver Measurable Time Savings**
   - Metric: User-reported time reduction in finding documents for specific facts
   - Target: 60% reduction from baseline (15-20 min → 2-3 min)
   - Timeline: Validated by 6 months post-launch

4. **Achieve AI Accuracy Threshold**
   - Metric: Precision and recall on atomic fact extraction from pleadings
   - Target: 85% or higher (measured by user feedback and manual validation)
   - Timeline: 3 months post-launch

5. **Justify Premium Pricing**
   - Metric: Customer willingness to pay for Professional tier with Pleadings
   - Target: 15-20% increase in Professional tier subscriptions
   - Timeline: 12 months post-launch

### Success Metrics

**Primary Metric:** User Adoption Rate - Target: 75% of litigation users using Pleadings weekly by Month 6

**Secondary Metrics:**
- AI Fact Extraction Accuracy: Target 85%+ (Month 3)
- Time to Find Documents for Specific Fact: Target <3 minutes (Month 6)
- User Satisfaction Score (NPS): Target 4.2+/5.0 (Month 6)
- AI Suggestion Acceptance Rate: Target 70%+ (Ongoing)
- Document-Fact Links Created: Target 10,000+ (Month 6)

---

## 2. Target Users

### Primary Persona: Senior Litigation Associate - "Sarah the Strategist"

- **Role/Type:** Senior Associate or Junior Partner at small/mid-sized litigation firm
- **Demographics:** 32-42 years old, 8-15 years litigation experience, Canadian firm, medium-high tech proficiency
- **Goals:** 
  - Efficiently manage 15-25 active litigation files
  - Quickly understand case issues across multiple files
  - Find relevant documents without wasting billable hours
  - Prepare for trials efficiently
- **Pain Points:**
  - Wastes 15-20% of document review time re-reading pleadings
  - Can't keep track of what's admitted vs. disputed across parties
  - Finding evidence for specific allegations takes 40-50% of trial prep time
  - Amended pleadings create chaos and rework
  - Junior associates can't determine relevance without constant questions
- **Behaviors:**
  - Manually highlights pleadings in different colors
  - Creates Word docs with "issues list"
  - Uses spreadsheets to track document-issue relationships
  - Relies on memory and handwritten notes
- **Motivations:** Partnership track requires efficiency AND quality; work-life balance; building reputation as organized
- **Success Criteria:** Can click on a pleading paragraph and instantly see related documents; version control eliminates amendment chaos; measurable time savings

### Secondary Persona: Paralegal - "David the Detail-Oriented"

- **Role/Type:** Senior Paralegal supporting 2-3 litigation lawyers
- **Demographics:** 25-35 years old, 5-10 years experience, high technical proficiency
- **Goals:** 
  - Support lawyers efficiently
  - Be seen as indispensable
  - Zero mistakes in productions
- **Pain Points:**
  - Lawyers don't clearly define what's relevant
  - Tracking pleading amendments manually is tedious
  - Creating privilege logs is time-consuming
  - No good system for tracking admissions
- **Behaviors:** Creates detailed Excel tracking, uses color-coding, maintains personal checklists
- **Motivations:** Professional pride, career advancement, job security
- **Success Criteria:** Clear categorization of admitted/disputed facts; batch operations for efficiency; export capabilities for reports

### Tertiary Persona: Junior Associate - "Jasmine the Junior"

- **Role/Type:** Junior Associate (1-3 years call)
- **Demographics:** 26-30 years old, very high technical proficiency (digital native)
- **Goals:** Learn litigation; avoid mistakes; gain trust
- **Pain Points:**
  - Doesn't understand case well enough to review documents
  - Nervous about missing important documents
  - Learning pleading structure is hard
- **Behaviors:** Seeks constant reassurance; over-inclusive review
- **Motivations:** Career development; skill building; proving competence
- **Success Criteria:** AI guidance helps understand key issues; confidence in relevance decisions; educational component

---

## 3. Feature Overview

The Pleadings feature transforms how ListBot.ca handles pleadings by treating them as the distinct organizational framework for litigation—not just another document type. Using AI-powered semantic analysis (Gemini API), the system automatically identifies pleading documents, extracts atomic facts using natural language processing, performs intelligent deduplication across multiple pleadings, and tracks party positions (admit/dispute/neutral) in an interactive matrix.

This enables lawyers to instantly understand case issues, find documents related to specific allegations, manage amended pleadings with full version control, and systematically connect evidence to pleading facts—solving the critical gap that exists in all competing e-discovery platforms.

The feature integrates seamlessly with ListBot.ca's existing document management, providing a unified experience where pleadings serve as the organizing principle for identification, review, analysis, and production stages of EDRM.

### Core Features (MVP - Phase 1)

- **Pleading Identification & Separation** - AI auto-detects pleadings; dedicated navigation section
- **Pleading Version Control** - Track amended pleadings with visual diff and impact analysis
- **AI Atomic Fact Extraction** - Gemini-powered parsing of pleadings into individual factual assertions
- **Fact List Management** - Organized table view with sorting, filtering, search, and export
- **Semantic Fact Deduplication** - AI identifies when same fact is stated in different words

### Future Enhancements (Phase 2 & 3)

- **Party-Fact Position Matrix** - Visual tracking of admit/dispute/neutral positions (Phase 2)
- **AI Document-Fact Linking** - Automatic connection of evidence to pleading facts (Phase 2)
- **Advanced Search & Filtering** - Natural language search across pleadings and facts (Phase 2)
- **Evidence Strength Indicators** - Gap analysis showing supporting/contradicting evidence (Phase 3)
- **Legal Issue Mapping** - Connect facts to legal issues and remedies (Phase 3)
- **Multi-Case Fact Library** - Reuse facts across similar cases (Phase 3)

---

## 4. Epic Breakdown

### Epic 1: Pleading Document Management
**Priority:** Must-have  
**Business Value:** High  
**Target Release:** MVP (Month 1-3)

#### Overview
Establish pleadings as a distinct document category within ListBot.ca, separate from evidence documents, with dedicated navigation and organization. This provides the foundation for all advanced pleading-specific features.

#### User Stories

##### Story 1.1: AI-Powered Pleading Detection
**As a** litigation lawyer  
**I want** the system to automatically detect when I upload a pleading document  
**So that** I don't have to manually categorize every document and pleadings are organized separately

**Acceptance Criteria:**
- [ ] System analyzes uploaded PDF content for pleading indicators (keywords: "Statement of Claim", "Defence", "Counterclaim", "Reply", "Petition", "Notice of Application")
- [ ] AI detection achieves 90%+ accuracy on common pleading formats (BC, AB, ON, QC courts)
- [ ] When pleading detected, system prompts: "This appears to be a [pleading type]. Confirm?"
- [ ] User can accept AI suggestion with one click
- [ ] User can reject and manually specify document type
- [ ] False positives (non-pleadings flagged as pleadings) are easily correctable
- [ ] Detection processing completes within 5 seconds of upload
- [ ] Detection confidence score shown to user (High/Medium/Low)

**Priority:** High  
**Dependencies:** Existing document upload feature  
**Estimated Complexity:** Medium

##### Story 1.2: Manual Pleading Classification
**As a** litigation lawyer  
**I want** to manually mark any document as a pleading  
**So that** I can handle edge cases where AI detection fails or for scanned/poor-quality documents

**Acceptance Criteria:**
- [ ] "Mark as Pleading" option available in document context menu
- [ ] User selects pleading type from dropdown: Statement of Claim, Defence, Counterclaim, Reply, Third Party Notice, Petition, Notice of Application, Other
- [ ] User specifies which party filed the pleading (Plaintiff, Defendant, Third Party, etc.)
- [ ] User can optionally add filing date
- [ ] Document immediately moves to Pleadings section after classification
- [ ] Action is logged in audit trail with timestamp and user
- [ ] User can later change pleading type or unmark as pleading
- [ ] Bulk action available: select multiple docs and "Mark as Pleading"

**Priority:** High  
**Dependencies:** Story 1.1 (detection)  
**Estimated Complexity:** Small

##### Story 1.3: Dedicated Pleadings Navigation Section
**As a** litigation lawyer  
**I want** a dedicated "Pleadings" section in the navigation  
**So that** I can quickly access all pleadings without filtering through evidence documents

**Acceptance Criteria:**
- [ ] "Pleadings" item appears in left sidebar navigation (between "Upload" and "Documents")
- [ ] Navigation badge shows count of pleadings in current case
- [ ] Clicking navigation item navigates to Pleadings list view
- [ ] Active navigation state clearly indicates when in Pleadings section
- [ ] Keyboard shortcut available (e.g., Cmd+P for Pleadings)
- [ ] Responsive design: sidebar collapses on mobile with hamburger menu
- [ ] Role-based visibility: all users can view, only certain roles can edit

**Priority:** High  
**Dependencies:** None  
**Estimated Complexity:** Small

##### Story 1.4: Pleadings List View
**As a** litigation lawyer  
**I want** to see all pleadings in a clean list view with key metadata  
**So that** I can quickly find and access specific pleadings

**Acceptance Criteria:**
- [ ] Table displays: Document Name, Pleading Type, Filed By (Party), Filing Date, Version, Actions
- [ ] List sorted by filing date (newest first) by default
- [ ] User can sort by any column (click column header to sort ascending/descending)
- [ ] User can filter by pleading type (multi-select dropdown)
- [ ] User can filter by party (multi-select dropdown)
- [ ] Search box filters list in real-time by document name
- [ ] List shows all versions of amended pleadings (with visual grouping)
- [ ] Click row to open pleading detail view
- [ ] Actions column shows: View, Download, Delete, Edit Metadata
- [ ] Empty state displays: "No pleadings yet. Upload documents or mark existing documents as pleadings."
- [ ] Pagination if more than 50 pleadings (20 per page)

**Priority:** High  
**Dependencies:** Story 1.3 (navigation)  
**Estimated Complexity:** Medium

##### Story 1.5: Pleading Detail View
**As a** litigation lawyer  
**I want** to view a pleading's full details and content  
**So that** I can read the pleading and access related information

**Acceptance Criteria:**
- [ ] Detail view displays: pleading metadata (type, party, date, version)
- [ ] PDF viewer embedded showing full pleading document
- [ ] Metadata is editable (click to edit inline)
- [ ] Quick actions available: Download, Delete, Extract Facts, View Versions
- [ ] Breadcrumb navigation shows: Case Name > Pleadings > [Document Name]
- [ ] "Back to Pleadings" button returns to list view
- [ ] Related facts section (if facts extracted) shows count and preview
- [ ] Version indicator (if multiple versions exist) with "See all versions" link
- [ ] Last modified timestamp and user shown
- [ ] Document available for offline viewing (download for offline)

**Priority:** High  
**Dependencies:** Story 1.4 (list view)  
**Estimated Complexity:** Medium

#### Technical Considerations
- Firestore schema:
  ```
  /cases/{caseId}/pleadings/{pleadingId}
    - document_id: reference to document
    - pleading_type: string
    - filed_by: string
    - filing_date: timestamp
    - version_number: number
    - parent_pleading_id: reference (for versions)
    - ai_detected: boolean
    - detection_confidence: number
  ```
- Use existing PDF.js library for PDF viewing
- Gemini API for AI detection (batch processing to manage costs)
- Cache AI detection results in Firestore to avoid re-processing

#### UX Considerations
- Visual distinction: pleading documents should have different icon/color than evidence
- Smooth transitions between list and detail views
- Loading states for AI detection
- Clear feedback when actions complete
- Mobile-responsive tables (consider card layout on small screens)

---

### Epic 2: Pleading Version Control
**Priority:** Must-have  
**Business Value:** High  
**Target Release:** MVP (Month 1-3)

#### Overview
Enable tracking of amended pleadings with full version history, comparison capabilities, and impact analysis. This solves the critical pain point of chaos when pleadings are amended.

#### User Stories

##### Story 2.1: Upload Amended Pleading as New Version
**As a** litigation lawyer  
**I want** to upload an amended pleading and link it to the original  
**So that** I maintain a complete history without losing previous versions

**Acceptance Criteria:**
- [ ] When uploading new pleading, system detects similar existing pleading by name similarity
- [ ] System prompts: "Is this an amended version of [existing pleading name]?"
- [ ] User can confirm (links as new version) or reject (creates new pleading)
- [ ] Version number auto-increments (v1.0, v2.0, v3.0, etc.)
- [ ] Previous version automatically marked as "Superseded" status
- [ ] Both versions retained in system (nothing deleted)
- [ ] Upload timestamp and user recorded for new version
- [ ] Relationship between versions stored in database
- [ ] User can manually link versions if AI detection missed

**Priority:** High  
**Dependencies:** Epic 1 (Pleading Management)  
**Estimated Complexity:** Medium

##### Story 2.2: Version History Display
**As a** litigation lawyer  
**I want** to see all versions of a pleading in chronological order  
**So that** I can understand how the pleading evolved over time

**Acceptance Criteria:**
- [ ] Pleading detail view shows "Versions" tab
- [ ] Version list displays: Version Number, Upload Date, Uploaded By, Status (Current/Superseded), Actions
- [ ] Current version clearly highlighted (e.g., green badge "Current")
- [ ] Superseded versions shown in gray with "Superseded" badge
- [ ] Click version to view that version's content
- [ ] "View All Versions" toggle shows/hides version list
- [ ] Default view: show only current version
- [ ] Timeline visualization available (visual timeline of amendments)
- [ ] Each version downloadable independently
- [ ] Version count shown in pleading list view (e.g., "v3 of 3")

**Priority:** High  
**Dependencies:** Story 2.1 (upload versions)  
**Estimated Complexity:** Medium

##### Story 2.3: Version Comparison (Text Diff)
**As a** litigation lawyer  
**I want** to see exactly what changed between pleading versions  
**So that** I can quickly understand amendments without re-reading entire pleading

**Acceptance Criteria:**
- [ ] "Compare Versions" button available when 2+ versions exist
- [ ] User selects two versions to compare (dropdown: "Compare v2.0 with v1.0")
- [ ] Side-by-side view displays both versions with synchronized scrolling
- [ ] Text differences highlighted: green for additions, red for deletions, yellow for modifications
- [ ] Line numbers shown for reference
- [ ] Paragraph-level comparison (not just character-level)
- [ ] Summary statistics shown: "X paragraphs added, Y deleted, Z modified"
- [ ] Export comparison as PDF with highlighted changes
- [ ] Toggle between side-by-side and inline diff views
- [ ] Comparison processing completes within 10 seconds for typical pleadings

**Priority:** Medium  
**Dependencies:** Story 2.2 (version history)  
**Estimated Complexity:** Large

##### Story 2.4: Version Rollback
**As a** litigation lawyer  
**I want** to revert to a previous version if an amendment was uploaded in error  
**So that** I can correct mistakes without losing data

**Acceptance Criteria:**
- [ ] "Restore this version" button available on superseded versions
- [ ] Confirmation dialog explains: "This will restore [version] as the current version. The current version will be preserved as a superseded version."
- [ ] User confirms action (two-step process to prevent accidents)
- [ ] Selected version becomes current version with new version number (e.g., v2.0 restored becomes v4.0)
- [ ] Previous current version marked as superseded
- [ ] Action logged in audit trail with clear explanation
- [ ] User receives confirmation: "Version restored successfully"
- [ ] Related facts remain linked (not deleted)
- [ ] No data is ever permanently deleted (complete audit trail)

**Priority:** Low  
**Dependencies:** Story 2.2 (version history)  
**Estimated Complexity:** Medium

#### Technical Considerations
- Store full document for each version (storage cost acceptable for pleadings - small files)
- Use diff library (e.g., `diff-match-patch`) for text comparison
- Version comparison may require server-side processing for large pleadings
- Cache comparison results to avoid re-computation
- Firestore structure:
  ```
  /cases/{caseId}/pleadings/{pleadingId}/versions/{versionId}
    - version_number: number
    - upload_date: timestamp
    - uploaded_by: user_id
    - status: 'current' | 'superseded'
    - document_id: reference
  ```

#### UX Considerations
- Clear visual indicators for version status (current vs. superseded)
- Prevent accidental deletion of versions
- Performance optimization: lazy load old versions
- Consider mobile experience for version comparison (challenging on small screens)

---

### Epic 3: AI-Powered Fact Extraction
**Priority:** Must-have  
**Business Value:** Very High (Core Innovation)  
**Target Release:** MVP (Month 1-3)

#### Overview
Automatically extract atomic facts from pleadings using Gemini API, transforming unstructured pleading text into structured, searchable, linkable fact records. This is the primary innovation and competitive differentiator.

#### User Stories

##### Story 3.1: Trigger Fact Extraction
**As a** litigation lawyer  
**I want** to extract facts from a pleading with one click  
**So that** I don't have to manually read and catalog every factual assertion

**Acceptance Criteria:**
- [ ] "Extract Facts" button visible on pleading detail view
- [ ] Button disabled if facts already extracted (shows "Re-extract Facts" instead)
- [ ] Clicking button triggers AI processing job
- [ ] Loading indicator shows: "Analyzing pleading... This may take 30-60 seconds"
- [ ] Processing happens asynchronously (user can navigate away)
- [ ] User receives notification when extraction completes: "Fact extraction complete. X facts extracted."
- [ ] Error handling: if AI fails, show clear error and "Retry" option
- [ ] Extraction automatically runs on newly uploaded pleadings (opt-in setting)
- [ ] Batch extraction available: select multiple pleadings and "Extract All"
- [ ] Cost estimate shown before extraction (e.g., "Estimated cost: $0.25")

**Priority:** High  
**Dependencies:** Epic 1 (Pleading Management)  
**Estimated Complexity:** Medium

##### Story 3.2: AI Fact Extraction Processing
**As a** system  
**I want** to parse pleading text and extract atomic facts using Gemini API  
**So that** lawyers receive structured fact data without manual effort

**Acceptance Criteria:**
- [ ] System extracts text from pleading PDF using PDF.js
- [ ] Text sent to Gemini API with fact extraction prompt
- [ ] Prompt instructs AI to:
  - Identify "Facts" section (vs. "Legal Issues" or "Relief Sought")
  - Extract each distinct factual assertion as separate fact
  - Parse paragraphs to find multiple facts within single paragraph
  - Return JSON: {fact_text, source_paragraph, confidence_score}
- [ ] System parses Gemini JSON response into structured data
- [ ] Each fact stored in Firestore with metadata (pleading_id, paragraph, confidence)
- [ ] Facts with confidence <70% flagged for review
- [ ] Processing completes within 60 seconds for typical pleading (10-20 pages)
- [ ] Error handling: API failures retry up to 3 times before failing
- [ ] Processing cost logged for analytics (track Gemini API spending)
- [ ] Results cached to avoid re-processing unchanged pleadings

**Priority:** High  
**Dependencies:** Story 3.1 (trigger extraction)  
**Estimated Complexity:** Large

##### Story 3.3: Review Extracted Facts
**As a** litigation lawyer  
**I want** to review AI-extracted facts and make corrections  
**So that** I ensure accuracy before relying on the fact list

**Acceptance Criteria:**
- [ ] After extraction, system displays: "X facts extracted. Review recommended."
- [ ] Extracted facts shown in review interface (table or cards)
- [ ] Each fact displays: Fact Text, Source Paragraph, Confidence Score (High/Medium/Low)
- [ ] User can edit fact text inline (click to edit)
- [ ] User can delete incorrectly extracted facts (trash icon)
- [ ] User can merge duplicate facts (select multiple, click "Merge")
- [ ] User can split complex facts into multiple atomic facts
- [ ] Changes saved automatically (debounced)
- [ ] Confidence score badge color-coded: Green (85-100%), Yellow (70-84%), Red (<70%)
- [ ] Facts below 70% confidence automatically flagged for review
- [ ] "Mark All as Reviewed" button confirms review complete
- [ ] Review status tracked per pleading (Reviewed/Pending Review)

**Priority:** High  
**Dependencies:** Story 3.2 (AI processing)  
**Estimated Complexity:** Medium

##### Story 3.4: Manual Fact Entry
**As a** litigation lawyer  
**I want** to manually add facts that AI missed  
**So that** my fact list is complete even if AI is imperfect

**Acceptance Criteria:**
- [ ] "Add Fact" button available on fact list view
- [ ] Modal opens with form: Fact Text (required), Source Paragraph (optional), Notes
- [ ] User can select source pleading from dropdown
- [ ] User can specify paragraph number
- [ ] Fact tagged as "Manually Added" (vs. "AI Extracted")
- [ ] Manual facts included in all views and searches alongside AI facts
- [ ] User can bulk import facts from CSV (for migration from other systems)
- [ ] Form validation prevents empty fact text
- [ ] Success message: "Fact added successfully"
- [ ] New fact appears immediately in fact list

**Priority:** Medium  
**Dependencies:** Story 3.3 (review facts)  
**Estimated Complexity:** Small

##### Story 3.5: Link Fact to Source Paragraph
**As a** litigation lawyer  
**I want** to click a fact and see the exact paragraph in the pleading  
**So that** I can verify context and accuracy

**Acceptance Criteria:**
- [ ] Each fact displays "View Source" link
- [ ] Clicking link opens pleading PDF viewer
- [ ] PDF scrolls to exact source paragraph
- [ ] Source paragraph highlighted in yellow
- [ ] Highlight persists for 5 seconds then fades
- [ ] User can navigate between facts while viewing pleading (Previous/Next Fact buttons)
- [ ] Keyboard shortcut available (arrow keys to navigate facts)
- [ ] "Jump to Source" also available from fact detail view
- [ ] If source paragraph not found, show message: "Source paragraph not available"
- [ ] Deep linking: URL includes fact ID for sharing

**Priority:** High  
**Dependencies:** Story 3.3 (review facts)  
**Estimated Complexity:** Medium

#### Technical Considerations
- **Gemini API Integration:**
  - Model: Gemini Flash ($0.075/1M input tokens, $0.30/1M output tokens)
  - Average pleading: 10-20 pages = ~5,000-10,000 tokens input
  - Cost per pleading: ~$0.15-0.30
  - Batch processing via Firebase Cloud Functions
  - Rate limiting: 1,500 requests/minute for Gemini Flash
  
- **Prompt Engineering:**
  - Few-shot prompting with examples of good fact extraction
  - Instruct model to separate facts from legal arguments
  - Request structured JSON output for parsing
  - Include confidence scoring in prompt
  
- **Firestore Schema:**
  ```
  /cases/{caseId}/facts/{factId}
    - fact_text: string
    - source_pleading_id: reference
    - source_paragraph: number
    - confidence_score: number (0-100)
    - ai_extracted: boolean
    - created_date: timestamp
    - created_by: user_id
    - reviewed: boolean
    - notes: string
  ```

- **Performance:**
  - Cache Gemini API results aggressively
  - Use background processing (Cloud Functions)
  - Implement progress indicators for long operations
  - Optimize PDF text extraction (consider parallelization)

#### UX Considerations
- Set user expectations: "AI-assisted, not automated"
- Show confidence scores prominently
- Make corrections easy (single click to edit/delete)
- Celebrate success: show count of facts extracted
- Handle failures gracefully with clear error messages
- Consider progressive disclosure: show high-confidence facts first

---

### Epic 4: Fact List Management
**Priority:** Must-have  
**Business Value:** High  
**Target Release:** MVP (Month 1-3)

#### Overview
Provide an organized, searchable, filterable interface for viewing and managing all extracted facts across one or more pleadings, with export capabilities for external use.

#### User Stories

##### Story 4.1: Fact List Table View
**As a** litigation lawyer  
**I want** to see all facts in a clean table view  
**So that** I can browse, search, and understand all factual assertions in the case

**Acceptance Criteria:**
- [ ] Table displays columns: Fact, Alleged By (Party), Source (Pleading + Paragraph), Confidence, Actions
- [ ] Fact text truncated at 100 characters with "..." and hover tooltip for full text
- [ ] Table sorted by creation date (newest first) by default
- [ ] User can sort by any column (click header)
- [ ] Alleged By shows party name (Plaintiff, Defendant, etc.)
- [ ] Source shows hyperlink to pleading + paragraph (e.g., "Statement of Claim ¶15")
- [ ] Confidence displayed as badge (High/Medium/Low) with color coding
- [ ] Actions column: View, Edit, Delete icons
- [ ] Pagination: 20 facts per page (configurable)
- [ ] Total fact count displayed: "Showing 1-20 of 156 facts"
- [ ] Empty state: "No facts yet. Extract facts from pleadings to get started."
- [ ] Responsive: table scrolls horizontally on small screens

**Priority:** High  
**Dependencies:** Epic 3 (Fact Extraction)  
**Estimated Complexity:** Medium

##### Story 4.2: Fact Search and Filtering
**As a** litigation lawyer  
**I want** to search and filter the fact list  
**So that** I can quickly find specific facts

**Acceptance Criteria:**
- [ ] Search box filters facts by text (full-text search)
- [ ] Search updates results in real-time (debounced 300ms)
- [ ] Filter by pleading (multi-select dropdown)
- [ ] Filter by party (multi-select dropdown)
- [ ] Filter by confidence level (High/Medium/Low checkboxes)
- [ ] Filter by reviewed status (Reviewed/Pending Review)
- [ ] Active filters shown as removable chips
- [ ] "Clear All Filters" button removes all filters
- [ ] Filter state persists in URL (bookmarkable)
- [ ] Result count updates as filters applied: "42 facts match filters"
- [ ] No results message: "No facts match your search and filters"
- [ ] Filters collapse/expand on mobile (accordion)

**Priority:** High  
**Dependencies:** Story 4.1 (table view)  
**Estimated Complexity:** Medium

##### Story 4.3: Fact Detail View and Editing
**As a** litigation lawyer  
**I want** to view full fact details and make edits  
**So that** I can correct AI errors and add my own notes

**Acceptance Criteria:**
- [ ] Click fact row to open detail modal or side panel
- [ ] Detail view shows: Full fact text, Source pleading, Source paragraph, Confidence score, Alleged by party, Created date, Last modified, Notes
- [ ] All fields editable except created date and confidence score
- [ ] Inline editing: click field to edit
- [ ] "Save" and "Cancel" buttons
- [ ] Changes saved to Firestore on "Save"
- [ ] Success message: "Fact updated"
- [ ] Error handling: validation prevents empty fact text
- [ ] "View in Pleading" button opens source document at paragraph
- [ ] "Delete Fact" button with confirmation dialog
- [ ] Audit trail shown: "Created by [User] on [Date], Last modified by [User] on [Date]"
- [ ] Keyboard shortcuts: Esc to close, Enter to save

**Priority:** High  
**Dependencies:** Story 4.1 (table view)  
**Estimated Complexity:** Medium

##### Story 4.4: Bulk Fact Operations
**As a** litigation lawyer  
**I want** to perform actions on multiple facts at once  
**So that** I can efficiently manage large fact lists

**Acceptance Criteria:**
- [ ] Checkbox in table header selects all visible facts
- [ ] Checkbox per row selects individual fact
- [ ] Selection count shown: "X facts selected"
- [ ] Bulk actions toolbar appears when facts selected: Delete, Merge, Export, Mark as Reviewed
- [ ] Delete: confirmation dialog lists facts to be deleted
- [ ] Merge: combines selected facts into single fact (user chooses which text to keep)
- [ ] Export: downloads selected facts as CSV
- [ ] Mark as Reviewed: updates review status for all selected
- [ ] "Select all on this page" vs. "Select all X facts" (if more than one page)
- [ ] Clear selection button
- [ ] Actions disabled if no facts selected
- [ ] Success message after bulk action: "X facts deleted"

**Priority:** Medium  
**Dependencies:** Story 4.1 (table view)  
**Estimated Complexity:** Medium

##### Story 4.5: Export Fact List
**As a** litigation lawyer  
**I want** to export the fact list to Excel/CSV  
**So that** I can use it in other tools or share with opposing counsel

**Acceptance Criteria:**
- [ ] "Export" button above fact table
- [ ] Export format options: CSV, Excel (.xlsx)
- [ ] Export respects current filters (exports only visible facts)
- [ ] Export includes all columns: Fact, Alleged By, Source Pleading, Source Paragraph, Confidence, Created Date, Notes
- [ ] File downloaded with meaningful name: "Facts - [Case Name] - [Date].csv"
- [ ] Excel export includes formatting: header row bold, confidence color-coded
- [ ] Export completes within 5 seconds for typical fact lists (<1000 facts)
- [ ] Success message: "Fact list exported successfully"
- [ ] Export button disabled if no facts to export
- [ ] Loading indicator during export generation
- [ ] Error handling: if export fails, show message and "Retry" option

**Priority:** Medium  
**Dependencies:** Story 4.1 (table view)  
**Estimated Complexity:** Small

#### Technical Considerations
- Use Vue 3 computed properties for real-time filtering
- Debounce search input for performance
- Firestore compound indexes for efficient filtering
- Consider Algolia for advanced search (future enhancement)
- Excel export: use library like SheetJS (xlsx)
- CSV export: native JavaScript (simpler)

#### UX Considerations
- Fast, responsive filtering (no perceptible lag)
- Clear visual feedback for selections
- Prevent accidental bulk deletions (confirmation dialogs)
- Mobile-friendly table (consider card layout)
- Loading states for all async operations

---

### Epic 5: Semantic Fact Deduplication
**Priority:** Must-have  
**Business Value:** High  
**Target Release:** MVP (Month 1-3)

#### Overview
Use AI to identify when the same fact is alleged in different words across multiple pleadings or within a single pleading, reducing noise and enabling accurate multi-party fact tracking.

#### User Stories

##### Story 5.1: AI Duplicate Detection
**As a** system  
**I want** to detect semantically similar facts using Gemini API  
**So that** the same fact isn't listed multiple times in different words

**Acceptance Criteria:**
- [ ] After extracting facts from pleading, system runs deduplication pass
- [ ] System compares each new fact against existing facts using Gemini embeddings
- [ ] Similarity threshold: 85%+ similarity flagged as potential duplicate
- [ ] System creates "potential duplicate" suggestions with confidence scores
- [ ] Suggestions stored in Firestore for user review
- [ ] Deduplication runs automatically after fact extraction
- [ ] User can manually trigger deduplication: "Check for Duplicates" button
- [ ] Processing completes within 30 seconds for typical fact lists (<500 facts)
- [ ] Cost optimization: cache embeddings to avoid recomputing
- [ ] Algorithm considers: same numerical values, same dates, same entities (people/companies)

**Priority:** High  
**Dependencies:** Epic 3 (Fact Extraction)  
**Estimated Complexity:** Large

##### Story 5.2: Review Duplicate Suggestions
**As a** litigation lawyer  
**I want** to review AI duplicate suggestions and decide whether to merge  
**So that** I maintain control over fact organization while benefiting from AI assistance

**Acceptance Criteria:**
- [ ] "Potential Duplicates" notification badge shown on Fact List
- [ ] Click badge to view duplicate review interface
- [ ] Side-by-side comparison shows: Existing Fact | New Fact | Similarity Score
- [ ] Example: "Contract signed January 1, 2023" vs. "Parties entered agreement on 01/01/23" - 92% similar
- [ ] User actions: Merge, Keep Separate, Not Sure (skip)
- [ ] Merge option combines facts, preserving both source citations
- [ ] Keep Separate dismisses suggestion (won't show again)
- [ ] Not Sure skips for now (can review later)
- [ ] Similarity score shown as percentage (85%-100%)
- [ ] User can see source paragraphs for both facts (quick reference links)
- [ ] Progress indicator: "5 of 12 duplicates reviewed"
- [ ] "Review Later" button saves progress
- [ ] All suggestions reviewable in one session or over time

**Priority:** High  
**Dependencies:** Story 5.1 (duplicate detection)  
**Estimated Complexity:** Medium

##### Story 5.3: Merge Duplicate Facts
**As a** litigation lawyer  
**I want** to merge duplicate facts into a single canonical fact  
**So that** my fact list remains clean and I see each fact only once

**Acceptance Criteria:**
- [ ] When merging, user chooses which fact text to keep (or edits to create new text)
- [ ] Merged fact preserves source citations from both original facts
- [ ] Example result: Fact Text: "Contract signed January 1, 2023" | Sources: "Statement of Claim ¶15, Defence ¶8"
- [ ] Original fact IDs preserved in merge history (audit trail)
- [ ] Merged fact displays both parties that alleged it: "Alleged by: Plaintiff, Defendant"
- [ ] User can view verbatim text from each source (expandable)
- [ ] Merge action is reversible: "Unmerge" button splits back into originals
- [ ] Confirmation dialog before merge: "Merge these 2 facts?"
- [ ] Success message: "Facts merged successfully"
- [ ] Merged facts clearly indicated in fact list (icon or badge)
- [ ] Audit trail shows: "Merged from Fact #15 and Fact #23 by [User] on [Date]"

**Priority:** High  
**Dependencies:** Story 5.2 (review duplicates)  
**Estimated Complexity:** Medium

##### Story 5.4: Duplicate Detection Accuracy Tracking
**As a** product manager  
**I want** to track AI duplicate detection accuracy  
**So that** I can measure and improve the feature over time

**Acceptance Criteria:**
- [ ] System logs user decisions: Merge (true positive), Keep Separate (false positive), Skip
- [ ] Accuracy metrics calculated: Precision = True Positives / (True Positives + False Positives)
- [ ] Analytics dashboard shows: Total suggestions, Accepted, Rejected, Accuracy %
- [ ] User feedback optional: "Was this suggestion helpful? Yes/No"
- [ ] Low-accuracy suggestions (<70%) flagged for review
- [ ] Feedback used to improve AI prompts and similarity thresholds
- [ ] Aggregate data reported (no individual user tracking)
- [ ] Monthly report generated: "Duplicate detection accuracy: X%"
- [ ] Target: 90%+ precision (90% of suggestions are correct duplicates)

**Priority:** Low  
**Dependencies:** Story 5.3 (merge facts)  
**Estimated Complexity:** Small

#### Technical Considerations
- **Gemini Embeddings API:**
  - Cost: $0.00025 per 1K documents
  - Generate embeddings for each fact
  - Compute cosine similarity between embeddings
  - Threshold: 0.85 similarity = potential duplicate
  
- **Optimization:**
  - Cache embeddings in Firestore
  - Only compute new embeddings for new facts
  - Batch embedding generation for efficiency
  
- **Firestore Schema:**
  ```
  /cases/{caseId}/duplicate_suggestions/{suggestionId}
    - fact1_id: reference
    - fact2_id: reference
    - similarity_score: number
    - status: 'pending' | 'merged' | 'dismissed'
    - reviewed_by: user_id
    - reviewed_date: timestamp
  
  /cases/{caseId}/facts/{factId}
    - merged_from: array of fact_ids (audit trail)
    - source_pleadings: array of {pleading_id, paragraph, verbatim_text}
  ```

#### UX Considerations
- Make merge decisions fast and easy (clear UI, keyboard shortcuts)
- Show confidence scores to build trust
- Allow undo (reversible merges)
- Batch review interface (don't make users review one at a time)
- Celebrate good AI: "10 duplicates found and merged - your fact list is 10 items cleaner!"

---

## 5. Non-Functional Requirements

### Performance
- **API Response Time:** Firestore queries return within 200ms (p95)
- **Page Load Time:** Pleadings list view loads within 2 seconds (p95)
- **AI Processing Time:** 
  - Fact extraction: <60 seconds for 10-20 page pleading
  - Duplicate detection: <30 seconds for 500 facts
  - Gemini API response: <5 seconds per request
- **Concurrent Users:** Support 100 concurrent users per case without degradation
- **PDF Rendering:** PDF viewer loads within 3 seconds for typical pleading

### Security
- **Authentication:** Existing Firebase Authentication (email/password, Google OAuth)
- **Authorization:** Role-based access control (Admin, Lawyer, Paralegal, View-Only)
- **Data Protection:** 
  - Encryption at rest: Firestore native encryption
  - Encryption in transit: TLS 1.3
  - Gemini API calls over HTTPS
- **API Key Security:** Gemini API key stored in Firebase environment config, never client-side
- **Audit Logging:** All fact edits, merges, deletions logged with user and timestamp
- **Compliance:** PIPEDA (Canada), GDPR (if applicable), attorney-client privilege considerations

### Scalability
- **Case Size:** Support cases with 10,000+ facts without performance degradation
- **Storage:** Firestore scales automatically; monitor usage (1GB free tier)
- **API Costs:** Gemini API budget monitoring (set alerts at $500/month)
- **User Growth:** Firebase supports 100,000+ concurrent connections
- **Fact Extraction Volume:** Process 1,000 pleadings/month at peak (10,000+ facts)

### Reliability
- **Uptime Target:** 99.9% availability (Firestore SLA)
- **Error Rate:** <1% of AI extractions fail
- **Recovery:** 
  - Retry failed Gemini API calls up to 3 times
  - Manual retry option for users if extraction fails
  - No data loss: all operations logged
- **Backup:** Firestore automatic backups (daily)
- **Monitoring:** Firebase console + custom error logging

### Accessibility
- **WCAG Compliance:** Level AA (4.5:1 contrast ratio minimum)
- **Keyboard Navigation:** Full keyboard support (Tab, Enter, Esc)
- **Screen Reader:** ARIA labels on all interactive elements
- **Focus Indicators:** Visible focus states on all focusable elements
- **Color Contrast:** Meet WCAG AA for text and UI elements
- **Text Scaling:** Support up to 200% zoom without breaking layout

### Maintainability
- **Code Coverage:** 70%+ unit test coverage for fact extraction logic
- **Documentation:** 
  - Inline code comments for complex algorithms
  - API documentation for Gemini integration
  - User guide for Pleadings feature
- **Code Style:** Follow Vue 3 + Composition API best practices
- **Monitoring:** 
  - Firebase Analytics for feature usage
  - Custom events for fact extraction, merges, exports
  - Error logging via Firebase Crashlytics

---

## 6. User Experience Requirements

### Key User Flows

1. **First-time Fact Extraction Flow:**
   Upload pleading → AI detects as pleading → Confirm → Click "Extract Facts" → Wait 30-60s → Review extracted facts → Edit/delete as needed → Mark as reviewed → View organized fact list

2. **Amended Pleading Flow:**
   Upload new pleading → System prompts "Is this amendment of [existing]?" → Confirm → New version created → Compare versions to see changes → Re-extract facts → Review new/modified facts → Merge duplicates → Updated fact list

3. **Finding Documents for Fact Flow (Phase 2):**
   Browse fact list → Click interesting fact → View related documents → Filter documents by fact → Review document → Tag document as supporting/contradicting fact

4. **Trial Prep Flow (Phase 3):**
   Filter facts to "disputed" → For each disputed fact, view supporting evidence → Assess evidence strength → Identify gaps → Export trial bundle organized by fact

### Design Principles

1. **AI Transparency:** Always show confidence scores, source citations, and clear indicators of AI-assisted vs. manual content. Users must understand what's AI-generated and be able to verify it.

2. **Progressive Disclosure:** Show simple interface by default (fact list); reveal complexity only when needed (version comparison, duplicate review). Don't overwhelm users with every feature at once.

3. **Reversible Actions:** All significant actions (merge, delete) should be undoable. Build user confidence by making mistakes easily correctable.

4. **Immediate Feedback:** Provide instant visual feedback for all user actions. Async operations show progress indicators. Celebrate successes (fact extraction complete!).

5. **Consistent Patterns:** Reuse existing ListBot.ca design patterns (tables, modals, buttons, colors). Pleadings section should feel integrated, not bolted-on.

### Interaction Patterns

- **Tables:** Standard sortable, filterable tables with pagination and responsive design
- **Modals:** Detail views and confirmations in centered modals with backdrop
- **Loading States:** Skeleton screens or spinners for async operations
- **Empty States:** Helpful illustrations and clear CTAs (e.g., "Upload your first pleading to get started")
- **Notifications:** Toast messages (top-right) for successes, errors persist until dismissed
- **Keyboard Shortcuts:** Support common shortcuts (Esc to close, Cmd+K for search)

---

## 7. Release Planning

### Phase 1: MVP (Minimum Viable Product)
**Target Date:** 3 months from kickoff (Month 1-3)  
**Goal:** Launch core Pleadings feature that demonstrates clear value and competitive differentiation

**Included Epics:**
- **Epic 1: Pleading Document Management** - AI detection, dedicated section, list/detail views
- **Epic 2: Pleading Version Control** - Upload versions, view history, basic comparison
- **Epic 3: AI-Powered Fact Extraction** - Gemini-based extraction, review, manual entry, source linking
- **Epic 4: Fact List Management** - Table view, search/filter, editing, export
- **Epic 5: Semantic Fact Deduplication** - AI duplicate detection, review interface, merge capability

**Success Criteria:**
- 10-15 beta users successfully use feature for real cases
- AI fact extraction accuracy: 80%+ (validated by users)
- User feedback: 4.0+/5.0 satisfaction
- 70%+ of beta users continue using feature after week 1
- Zero critical bugs in production
- Measurable time savings reported by users

### Phase 2: Enhancement Phase
**Target Date:** 6-9 months from MVP launch (Month 9-12)  
**Goal:** Add party-fact position tracking and document linking to complete the pleading-centric workflow

**Included Epics:**
- **Epic 6: Party-Fact Position Matrix** - Track admit/dispute/neutral positions; visual matrix view
- **Epic 7: AI Document-Fact Linking** - Automatic evidence-to-fact connections with confidence scores
- **Epic 8: Advanced Search** - Natural language search; cross-feature search (pleadings + facts + documents)
- **Epic 9: Version Comparison Enhancements** - Visual diff improvements; change impact analysis

**Success Criteria:**
- 75%+ user adoption (users actively using Pleadings weekly)
- Document-fact linking accuracy: 80%+
- 50%+ of users using party-fact matrix
- Demonstrated time savings: 60%+ reduction in finding relevant documents

### Phase 3: Future Enhancements
**Target Date:** 12-18 months from MVP launch (Month 18-24)  
**Goal:** Build advanced analytics and trial preparation capabilities

**Included Epics:**
- **Epic 10: Evidence Strength Indicators** - Gap analysis; supporting/contradicting evidence strength
- **Epic 11: Legal Issue Mapping** - Connect facts to legal issues and remedies
- **Epic 12: Multi-Case Fact Library** - Reuse facts across similar cases; anonymized sharing
- **Epic 13: Advanced Analytics** - Timeline visualizations; strategic insights; client reporting
- **Epic 14: Trial Presentation Integration** - Link exhibits to facts; presentation mode

---

## 8. Assumptions & Dependencies

### Assumptions

**Critical Assumptions:**
1. Gemini API can achieve 85%+ accuracy on fact extraction from pleadings (Medium confidence - 60%)
   - **Validation:** Test with 50+ diverse pleadings before MVP development
   - **Risk if wrong:** Feature won't deliver value; user frustration; abandonment

2. Lawyers will trust AI suggestions with appropriate confidence scores and citations (Medium-High confidence - 70%)
   - **Validation:** Beta user interviews; track AI suggestion acceptance rate
   - **Risk if wrong:** Low adoption; reputational damage

3. Semantic deduplication provides value despite imperfect accuracy (Medium confidence - 65%)
   - **Validation:** User testing with multi-party cases; measure time saved vs. manual
   - **Risk if wrong:** Noise in fact list; user confusion

4. Users will adopt Pleadings feature without significant training (High confidence - 80%)
   - **Validation:** Usability testing; time-to-first-value measurement
   - **Risk if wrong:** Low adoption; high support burden

5. Phase 1 MVP provides sufficient value to justify Phase 2 investment (Medium-High confidence - 75%)
   - **Validation:** Usage metrics; user interviews; renewal rates
   - **Risk if wrong:** Feature doesn't gain traction; wasted development effort

6. Pleading formats across Canadian jurisdictions are similar enough for single AI approach (High confidence - 85%)
   - **Validation:** Analyze samples from BC, AB, ON, QC courts
   - **Risk if wrong:** Need jurisdiction-specific parsing

### External Dependencies

**Third-Party Services:**
- **Gemini API (Google):** 
  - **Purpose:** AI fact extraction and semantic deduplication
  - **Risk if unavailable:** Feature completely broken; no fallback except manual entry
  - **Mitigation:** Implement abstraction layer for AI provider; contractual SLA; monitor uptime
  - **Status:** Publicly available, stable API

- **Firebase Firestore & Cloud Functions:**
  - **Purpose:** Data storage, real-time sync, serverless processing
  - **Risk if unavailable:** Entire ListBot.ca platform down (not Pleadings-specific)
  - **Mitigation:** Firebase has 99.95% SLA; use status.firebase.google.com monitoring
  - **Status:** Production-ready, already in use by ListBot.ca

### Technical Dependencies

**Existing ListBot.ca Features:**
- Document upload feature (must support "Mark as Pleading")
- Document storage (Firebase Storage)
- User authentication and authorization
- Case/matter management system

**Libraries & Tools:**
- PDF.js for PDF text extraction and rendering
- Diff library (e.g., diff-match-patch) for version comparison
- SheetJS (xlsx) for Excel export
- Chart.js or D3.js for future analytics visualizations

**Infrastructure:**
- Google Cloud Platform account (for Gemini API access)
- Firebase project with Firestore, Cloud Functions, Storage enabled
- Domain and hosting for ListBot.ca

### Resource Dependencies

**Team:**
- 1-2 full-stack developers (Vue 3 + Firebase expertise) for 3 months
- 1 product manager (ongoing)
- 1 UX designer (part-time for mockups and user testing)
- 1 QA tester (part-time for testing, or contractor)

**Budget:**
- Development: Existing team (no incremental cost)
- Gemini API: ~$300/month initially; scales with usage (monitor and set alerts)
- Testing: 10-15 beta partners (free/discounted access during beta)

**External:**
- Beta testing partners: 10-15 Canadian litigation firms
- Legal domain expert (lawyer) for validation and feedback

---

## 9. Constraints & Risks

### Constraints

**Budget:**
- Gemini API costs must stay under $500/month during MVP phase
- No budget for external contractors (use existing team only)
- Must justify ROI within 12 months to continue development

**Timeline:**
- MVP must launch within 3 months to maintain competitive advantage
- Cannot delay other planned features indefinitely (parallel development may be needed)
- Beta period must be complete before full launch (min 4 weeks beta)

**Technical:**
- Firestore document size limit: 1MB (acceptable for fact lists)
- Gemini API rate limits: 1,500 requests/minute (sufficient for expected load)
- Firebase free tier: 1GB storage, 50K document reads/day (will need paid tier)
- Must support existing browsers: Chrome, Safari, Firefox, Edge (latest 2 versions)

**Regulatory:**
- PIPEDA compliance for Canadian data (attorney-client privilege considerations)
- Cannot store client data outside Canada without consent
- Must maintain defensible chain of custody for legal purposes

**Resource:**
- Limited developer availability (1-2 devs for 3 months)
- No ML/AI expertise in-house (relying on Gemini API vs. building models)
- Competing feature priorities (may need to defer other roadmap items)

### Risks

| Risk | Likelihood | Impact | Mitigation Strategy | Contingency Plan |
|------|------------|--------|-------------------|------------------|
| **AI accuracy below 85%** | Medium | High | Extensive testing with 50+ diverse pleadings; prompt engineering iteration; set user expectations ("AI-assisted not automated") | Provide manual fact entry fallback; partner with users to improve prompts; consider hybrid AI+template approach for common formats |
| **Gemini API costs exceed budget** | Medium | Medium | Aggressive caching of results; batch processing; monitor usage closely; use Flash vs. Pro where possible | Pass costs to users in pricing; reduce AI features to core only; explore alternative cheaper AI providers (OpenAI, Claude) |
| **Users don't trust AI suggestions** | Low-Medium | High | Transparency (show source text, confidence scores); citations for every fact; make all suggestions reviewable/editable | Pivot to "AI-assisted" vs. "automated"; emphasize time savings even with review; provide "expert mode" with more control |
| **Low user adoption (<50%)** | Medium | High | Beta program with friendly users; excellent onboarding/training; clear value demonstration; integration with existing workflows | Simplify feature to core value only; make it optional add-on; focus marketing on power users; iterate based on feedback |
| **Pleading format diversity breaks parsing** | Medium | Medium | Test with wide variety of jurisdictions; flexible parsing; allow manual corrections | Focus on most common formats initially; iteratively add format support; provide manual entry option; consider jurisdiction-specific prompts |
| **Version control complexity causes bugs** | Medium | Medium | Thorough testing of amendment scenarios; clear version comparison UI; preserve all historical data | Simplify to "latest version" only initially; add version history in Phase 2 if needed; ensure robust rollback capability |
| **Competitor copies feature quickly** | High | Medium | Fast to market (first-mover advantage); build network effects (shared fact libraries Phase 3); continuous improvement based on user feedback | Emphasize superior UX and integration; develop advanced features (Phase 2/3) quickly; patent unique aspects if possible |
| **Scalability issues with large pleadings** | Low | Medium | Test with very large pleadings (100+ pages); optimize Firestore queries; implement pagination/lazy loading | Add file size limits if necessary (e.g., 50-page max); chunked processing for large files; progressive loading of facts |
| **Beta partners unavailable** | Low | High | Start recruitment early (4 weeks before beta); leverage existing ListBot.ca relationships; offer incentives (free access, early adopter pricing) | Delay beta if needed; use internal testing; recruit from legal community networks; offer compelling value proposition |
| **Development timeline slips** | Medium | Medium | Agile methodology with 2-week sprints; regular progress reviews; cut scope if needed (feature flags for incremental release) | Reduce MVP scope (defer semantic deduplication to Phase 2); extend timeline by 4 weeks max; add temporary developer if critical |

---

## 10. Out of Scope

**What is explicitly NOT included in this product (any phase):**

### 1. Pleading Drafting/Generation
**Why excluded:** Separate feature domain; many competitors already exist (Clio Draft, Lawyaw); focus is on analysis not creation; different user need (creating pleadings vs. organizing existing pleadings)  
**Future consideration:** Could add in Phase 4+ if users request; would require different AI approach (generative vs. extractive)

### 2. Legal Research Integration
**Why excluded:** Different domain; already well-covered by Westlaw/LexisNexis; outside core competency; would require expensive data partnerships  
**Future consideration:** Could link to external research tools if API available (e.g., deep link to Westlaw for cases cited in pleadings)

### 3. Automatic Privilege Determination
**Why excluded:** Too complex for AI; high ethical risk; requires lawyer judgment; liability concerns; bar associations may prohibit  
**Future consideration:** May assist (flag potential privilege based on keywords) but won't automate decision; always requires lawyer review

### 4. Multi-Language Support (Beyond English)
**Why excluded:** Adds significant complexity; Canadian market primarily English (with some French); AI translation quality concerns for legal text  
**Future consideration:** Add French support in Phase 2/3 if demand exists (Quebec market); use Google Translate API for other languages

### 5. On-Premise Deployment
**Why excluded:** ListBot.ca is cloud-native (Firebase); on-premise would require complete rebuild; market trend favors cloud (65% preference)  
**Note:** Some government/enterprise clients may require on-premise; evaluate if demand warrants separate product line

### 6. Custom Pleading Templates
**Why excluded:** Not an analysis feature; already handled by practice management software (Clio, PracticePanther); focus is on organizing existing pleadings  
**Note:** May integrate with template libraries in future (import templates, extract facts from templates for case-type libraries)

### 7. E-Filing Integration
**Why excluded:** Separate workflow; requires integration with court systems; regulatory complexity; outside core value proposition  
**Future consideration:** May add if ListBot.ca expands into practice management features; low priority for e-discovery platform

### 8. Deposition/Discovery Management
**Why excluded:** Different EDRM stage (though related); focus on pleadings first; would require separate feature development  
**Future consideration:** Natural Phase 3/4 expansion; integrate depositions with pleading facts (link deposition testimony to facts)

### 9. Time Tracking/Billing
**Why excluded:** Already handled by practice management software; not differentiating for e-discovery platform; integration sufficient  
**Note:** Could integrate with Clio/PracticePanther for automated time entries based on pleading work

### 10. Collaboration Features (Beyond Basic)
**Why excluded from MVP:** Complex; requires real-time conflict resolution; chat/comments can wait for Phase 2  
**In scope for Phase 2:** Comments on facts; @mentions; shared annotations; activity feeds

---

## 11. Approval & Sign-off

### Stakeholders

- **Product Owner:** [Name] - [ ] Approved
- **Engineering Lead:** [Name] - [ ] Approved
- **Design Lead:** [Name] - [ ] Approved
- **Beta Partner Representatives:** [Names] - [ ] Approved

### Approval Checklist

- [ ] Product vision clearly articulated and compelling
- [ ] MVP scope realistic for 3-month timeline
- [ ] All epics have complete user stories with acceptance criteria
- [ ] Non-functional requirements are specific and measurable
- [ ] Success metrics defined with measurement methods
- [ ] Risks documented with mitigation strategies
- [ ] Budget approved (Gemini API costs + development time)
- [ ] Timeline approved (3 months to MVP launch)
- [ ] Beta partner recruitment plan approved
- [ ] Ready for technical architecture design
- [ ] Ready for UX design (mockups and prototypes)
- [ ] Ready for development sprint planning

### Next Steps After Approval

1. **Week 1-2: Validation**
   - [ ] Test Gemini API with 20+ sample pleadings (validate 80%+ accuracy)
   - [ ] Recruit 10-15 beta partners (Canadian litigation firms)
   - [ ] Finalize success metrics and KPI tracking setup

2. **Week 3-4: Design**
   - [ ] Create high-fidelity UI mockups for all epics (Figma)
   - [ ] Design Firestore data model schema
   - [ ] Write technical specification document
   - [ ] Conduct usability testing on mockups (3-5 users)

3. **Week 5: Sprint Planning**
   - [ ] Break epics into development tasks
   - [ ] Estimate effort for each task (story points)
   - [ ] Plan 2-week sprint schedule (6 sprints for 3-month MVP)
   - [ ] Set up development environment (Gemini API keys, Firebase config)

4. **Month 2-3: Development**
   - [ ] Develop Epic 1: Pleading Management (Sprint 1-2)
   - [ ] Develop Epic 2: Version Control (Sprint 2-3)
   - [ ] Develop Epic 3: Fact Extraction (Sprint 3-4)
   - [ ] Develop Epic 4: Fact Management (Sprint 4-5)
   - [ ] Develop Epic 5: Deduplication (Sprint 5-6)

5. **Month 3: Beta & Launch**
   - [ ] Beta testing with 10-15 partners (4 weeks)
   - [ ] Iterate based on feedback
   - [ ] Fix critical bugs
   - [ ] Prepare launch materials (docs, videos, blog posts)
   - [ ] Soft launch to existing users
   - [ ] Full public launch

---

## Appendices

### A. Glossary

- **Atomic Fact:** A single, indivisible factual assertion (e.g., "Contract signed on January 1, 2023")
- **Pleading:** Formal written statement filed with court (Statement of Claim, Defence, Counterclaim, Reply, etc.)
- **Admitted Fact:** Fact that opposing party agrees is true (no need to prove)
- **Disputed Fact:** Fact that opposing party denies (must be proven at trial)
- **Neutral/No Position:** Fact that party neither admits nor denies (often due to lack of knowledge)
- **EDRM:** Electronic Discovery Reference Model - industry standard framework for e-discovery
- **Gemini API:** Google's large language model API for text analysis and generation
- **Semantic Deduplication:** Identifying that two differently-worded statements express the same fact
- **Party-Fact Matrix:** Table showing which parties admit/dispute each fact
- **Confidence Score:** AI's self-assessment of accuracy (0-100%) for a suggestion
- **Inclusive Email:** Email containing all prior conversation content (vs. non-inclusive fragments)
- **TAR:** Technology Assisted Review (predictive coding for document review)
- **Firestore:** Google's NoSQL cloud database (part of Firebase platform)

### B. References

**Market Research:**
- ListBot.ca EDRM Implementation Strategy (2025-11-21-EDRM-Overview-research.md)
- Pleadings Feature Business Analysis (Pleadings-Feature-Business-Analysis.md)
- Pleadings Feature Executive Summary (Pleadings-Feature-Executive-Summary.md)
- Precedence Research: E-Discovery Market Analysis (2024)
- ABA Journal: AI in Legal Practice Survey (2024)

**Competitive Analysis:**
- CaseMap+ AI (LexisNexis): https://www.lexisnexis.com/en-us/products/casemap.page
- Casefleet: https://www.casefleet.com
- MasterFile: https://masterfile.biz
- Everlaw: https://www.everlaw.com
- DISCO: https://www.csdisco.com
- Relativity: https://www.relativity.com

**Technical Documentation:**
- Gemini API Documentation: https://ai.google.dev/docs
- Firebase Documentation: https://firebase.google.com/docs
- Vue 3 Documentation: https://vuejs.org/guide/
- PDF.js Documentation: https://mozilla.github.io/pdf.js/

**User Research:**
- Beta partner recruitment list (to be created)
- User interview notes (5 preliminary interviews with litigation lawyers)
- Pain point validation survey (to be conducted)

### C. Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Nov 21, 2025 | 1.0 | Initial PRD created from business analysis | Product Manager |
| | | | |
| | | | |

---

## Document Control

**Next Review Date:** 2 weeks from approval (after AI validation testing complete)  
**Distribution:** Engineering team, Design team, Beta partners, Executive stakeholders  
**Confidentiality:** Internal - Strategic Planning  
**Version Control:** Maintained in project repository (/mnt/project/)

---

**END OF DOCUMENT**

*This PRD is a living document. It will be updated as we learn from beta testing, user feedback, and development discoveries. All changes must be logged in the Change Log with clear rationale.*

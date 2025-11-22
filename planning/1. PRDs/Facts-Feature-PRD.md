# Product Requirements Document: Facts Feature

**Version:** 1.0  
**Date:** November 21, 2025  
**Author:** Product Team  
**Status:** Ready for Development  
**Classification:** Internal - Product Development

---

## Table of Contents

1. [Product Vision & Goals](#1-product-vision--goals)
2. [Target Users](#2-target-users)
3. [Feature Overview](#3-feature-overview)
4. [Epic Breakdown](#4-epic-breakdown)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [User Experience Requirements](#6-user-experience-requirements)
7. [Success Metrics](#7-success-metrics)
8. [Release Planning](#8-release-planning)
9. [Assumptions & Dependencies](#9-assumptions--dependencies)
10. [Constraints & Risks](#10-constraints--risks)
11. [Out of Scope](#11-out-of-scope)
12. [Approval & Sign-off](#12-approval--sign-off)

---

## 1. Product Vision & Goals

### 1.1 Vision Statement

Transform witness interview processing from a manual 40-120 hour per case burden into an AI-assisted 10-20 hour workflow, enabling litigation teams to extract, organize, and search facts from witness testimony with unprecedented speed and accuracy.

The Facts Feature will be the **first platform** to automatically extract atomic facts from witness interviews, track hearsay distinctions (source vs. witness), and enable semantic search across all case testimony—creating a complete case knowledge base when combined with our existing Pleadings feature.

### 1.2 Product Goals

1. **Reduce witness interview fact extraction time by 60-80%** (from 3-5 hours per interview to 30-60 minutes)
2. **Achieve 85%+ AI accuracy** in extracting atomic facts from interview transcripts
3. **Enable semantic search** across all witness testimony (find facts by meaning, not just keywords)
4. **Track hearsay automatically** (distinguish source who told lawyer vs. witness with direct knowledge)
5. **Create competitive moat** as first-to-market with AI-powered witness interview fact extraction
6. **Justify premium tier pricing** ($120-150/GB) by delivering clear ROI to litigation teams

### 1.3 Success Metrics

**Primary Metrics:**

| Metric | Target | Timeline |
|--------|--------|----------|
| **AI Accuracy** | ≥85% (vs. manual review) | Within 3 months of launch |
| **Time Savings** | ≥60% reduction in extraction time | Within 6 months |
| **User Adoption** | ≥70% of litigation users upload ≥1 interview/month | Within 6 months |

**Secondary Metrics:**

| Metric | Target | Timeline |
|--------|--------|----------|
| **User Satisfaction (NPS)** | ≥4.2/5.0 | Within 6 months |
| **AI Acceptance Rate** | ≥70% of facts accepted without modification | Ongoing |
| **Feature Stickiness** | Users perform ≥5 semantic searches per week | Within 3 months |
| **Hearsay Detection Accuracy** | ≥70% | Within 3 months |
| **Monthly Churn** | <10% | Within 6 months |

---

## 2. Target Users

### 2.1 Primary Persona: Sarah - Senior Litigation Associate

**Demographics:**
- **Age:** 34 years old
- **Role:** Senior Associate at mid-sized litigation firm (75 lawyers)
- **Experience:** 8 years in civil litigation (commercial disputes)
- **Tech Comfort:** High (proficient with CaseMap, Everlaw, Clio)
- **Caseload:** 4-6 active litigation files simultaneously (5-10 witnesses per case)

**Goals:**
- Reduce non-billable prep time (currently 15-20 hours/week on administrative work)
- Find facts faster during witness prep and cross-examination
- Track which facts are hearsay vs. direct knowledge (for admissibility planning)
- Avoid missing critical facts hidden in lengthy interview transcripts
- Onboard junior associates quickly to case facts

**Pain Points:**
- Spends 3-5 hours per interview manually reading transcripts, highlighting, and typing facts into Excel
- Cannot search across all witness statements (must manually re-read notes during cross-exam prep)
- No systematic hearsay tracking (keeps incomplete Word doc of "who said what about what")
- Facts buried in 50+ page transcripts (Ctrl+F misses synonyms and paraphrasing)
- Junior associates frequently miss key facts (requiring Sarah to re-review their work)

**Key Quote:**
> "I know there's gold buried in these interview transcripts, but I just don't have time to pan for it. If AI could give me a clean list of facts with sources, I'd pay for that in a heartbeat."

---

### 2.2 Secondary Persona: Marcus - Litigation Paralegal

**Demographics:**
- **Age:** 29 years old
- **Role:** Litigation Paralegal at small firm (15 lawyers)
- **Experience:** 5 years (personal injury, employment law)
- **Tech Comfort:** Medium (uses basic legal software, not early adopter)
- **Responsibilities:** Supports 3 lawyers across 12-15 active cases

**Goals:**
- Organize case facts quickly to prepare witness binders for trial
- Find specific facts instantly when lawyers ask "What did Witness X say about Y?"
- Identify contradictions between witnesses' statements
- Prepare for trial efficiently (lawyers need fact summaries fast)
- Make lawyers look good by having information ready instantly

**Pain Points:**
- Lawyers' handwritten notes are messy and disorganized (spends hours deciphering)
- Cannot find specific facts quickly (manually searches through all witness notes, 10-20 min per search)
- No way to compare witness statements systematically
- Lawyers ask for facts at last minute (scrambles to find them, often misses deadline)
- Hard to track hearsay (doesn't know which facts are admissible without asking lawyer)

**Key Quote:**
> "When a lawyer asks me 'What did the accountant say about the contract?' at 4:45 PM before trial, I need to find that fact in 30 seconds, not 30 minutes."

---

### 2.3 Decision Maker Persona: Patricia - Litigation Partner

**Demographics:**
- **Age:** 52 years old
- **Role:** Litigation Partner at mid-sized firm (90 lawyers)
- **Experience:** 25 years (complex commercial litigation)
- **Tech Comfort:** Low-Medium (uses email, Word, basic Clio; delegates tech)
- **Oversight:** 8-12 active litigation files (delegates day-to-day to associates)

**Goals:**
- Maximize billable hours (reduce non-billable administrative time)
- Win cases (better preparation = better outcomes)
- Develop associates (teach them to be thorough fact investigators)
- Control costs for clients (willing to spend on tools with clear ROI)
- Avoid malpractice risk (missing a key fact = disaster)

**Pain Points:**
- Associates miss key facts (wastes her time re-reviewing their work)
- Cannot trust juniors' fact summaries (must re-read transcripts herself, 3-5 hours per case)
- Facts scattered across case files (relies on senior associates to organize, inconsistent)
- Hard to assess case strength quickly (spends hours reading witness statements before settlement negotiations)
- Technology ROI unclear (hesitant to invest without proven value)

**Key Quote:**
> "I don't care about fancy AI features. I care about two things: Does it save my team time, and does it help us win cases? If the answer is yes to both, I'll pay for it."

---

## 3. Feature Overview

The Facts Feature is an AI-powered witness interview processing system that automatically extracts atomic facts from interview transcripts, tracks hearsay distinctions, and enables semantic search across all case testimony. It transforms the manual, time-intensive process of extracting and organizing witness facts into a streamlined, AI-assisted workflow.

When integrated with our existing Pleadings feature (which extracts facts from court documents), the Facts Feature creates a comprehensive case knowledge base—combining facts from legal pleadings with facts from witness testimony into a single, searchable repository.

### 3.1 Core Value Proposition

- **60-80% time savings:** Reduce fact extraction from 3-5 hours per interview to 30-60 minutes
- **Semantic search:** Find facts by meaning across all witnesses (not just keyword matching)
- **Hearsay tracking:** Automatically distinguish source (who told lawyer) from witness (who has direct knowledge)
- **Quality assurance:** AI-suggested facts with confidence scores that lawyers can verify and correct
- **Competitive differentiation:** First platform to offer AI-powered witness interview fact extraction

### 3.2 MVP Features (Phase 1)

The following features will be delivered in the 2-3 month MVP development cycle:

1. **Witness Interview Upload & Processing** - Upload transcripts (PDF/DOCX/TXT), extract text, capture metadata
2. **AI Atomic Fact Extraction** - Gemini API processes transcripts and extracts individual factual assertions with confidence scores
3. **Hearsay Tracking** - Distinguish source (who told lawyer) from witness (who has direct knowledge) with visual indicators
4. **Fact List View** - Comprehensive table view with sorting, filtering, and search capabilities
5. **Semantic Fact Search (RAG)** - Google File Search API enables natural language queries across all witness testimony
6. **Fact Verification & Audit Trail** - User verification system with complete edit history tracking
7. **Fact Export** - Professional export to PDF, CSV, and DOCX formats

### 3.3 Integration with Existing Features

The Facts Feature integrates seamlessly with ListBot.ca's existing platform:

- **Pleadings Feature:** Facts from court documents + Facts from witness interviews = Complete case knowledge base
- **Document Repository:** Link facts to supporting evidence documents (Phase 2)
- **User Management:** Role-based access control (partners, associates, paralegals)
- **Case Management:** Facts organized by case with cross-case search disabled for privilege protection

---

## 4. Epic Breakdown

This section details all user stories for the MVP, organized into 7 epics. Each story includes acceptance criteria, priority, dependencies, and estimated complexity.

---

## Epic 1: Witness Interview Upload & Processing

**Priority:** Must-have (MVP)  
**Business Value:** High - Foundation for all other features  
**Estimated Timeline:** 1-2 weeks

### Overview
This epic establishes the foundation for the Facts Feature by enabling users to upload witness interview transcripts and prepare them for AI processing. Without reliable upload and text extraction, no other features can function.

---

### Story 1.1: Upload Interview Transcript

**As a** litigation lawyer  
**I want to** upload a witness interview transcript to ListBot.ca  
**So that** I can have AI extract facts from the interview automatically

**Acceptance Criteria:**
- [ ] User can upload files via drag-and-drop or file browser
- [ ] System accepts PDF, DOCX, and TXT file formats
- [ ] File size limit is 50MB (sufficient for typical transcripts)
- [ ] Upload progress indicator shows percentage complete
- [ ] User receives confirmation message upon successful upload
- [ ] Uploaded file appears in interview list with status "Uploaded - Ready for Processing"
- [ ] Error messages are clear and actionable if upload fails (e.g., "File too large", "Unsupported format")
- [ ] User can cancel upload in progress

**Priority:** High | **Dependencies:** None | **Complexity:** Low

---

### Story 1.2: Extract Text from Uploaded File

**As a** litigation lawyer  
**I want to** have text automatically extracted from my uploaded transcript  
**So that** the AI can process the content regardless of file format

**Acceptance Criteria:**
- [ ] PDF text extraction achieves >99% accuracy for digital PDFs
- [ ] OCR processing handles scanned PDFs with >95% accuracy
- [ ] DOCX files preserve paragraph structure and formatting context
- [ ] TXT files are imported with proper line break handling
- [ ] Extraction completes within 30 seconds for typical 10,000-word transcript
- [ ] User can preview extracted text before proceeding to fact extraction
- [ ] System detects and alerts if OCR quality is below acceptable threshold
- [ ] Failed extractions show clear error message with remediation steps

**Priority:** High | **Dependencies:** Story 1.1 | **Complexity:** Medium

---

### Story 1.3: Capture Interview Metadata

**As a** litigation lawyer  
**I want to** enter metadata about the witness interview  
**So that** I can organize and find interviews easily later

**Acceptance Criteria:**
- [ ] User can enter witness name (required field)
- [ ] User can enter interview date (required field, date picker UI)
- [ ] User can enter interviewer name (optional field, defaults to current user)
- [ ] User can add optional notes about the interview
- [ ] Metadata form validates required fields before allowing proceeding
- [ ] User can edit metadata after initial entry
- [ ] Metadata displays in interview list view for easy reference
- [ ] System auto-fills interviewer name if user has conducted previous interviews

**Priority:** High | **Dependencies:** Story 1.1 | **Complexity:** Low

---

### Story 1.4: Preview Interview Before Processing

**As a** litigation lawyer  
**I want to** preview the extracted text and metadata before AI processing  
**So that** I can verify everything is correct before committing to fact extraction

**Acceptance Criteria:**
- [ ] Preview screen shows witness name, interview date, and interviewer
- [ ] Preview screen shows first 500 words of extracted text with option to view full text
- [ ] User can edit metadata from preview screen
- [ ] User can cancel and delete interview if preview reveals errors
- [ ] "Begin Fact Extraction" button is prominently displayed
- [ ] System estimates processing time based on transcript length
- [ ] User can navigate back to edit extracted text if OCR errors are detected

**Priority:** Medium | **Dependencies:** Story 1.2, Story 1.3 | **Complexity:** Low

---

### Technical Considerations
- Use Firebase Storage for file uploads (existing infrastructure)
- Consider using Google Cloud Vision API for OCR of scanned PDFs
- Implement file type validation on both client and server side
- Set up appropriate Firebase Storage rules for security
- Consider chunking large file uploads for better progress tracking

### UX Considerations
- Make upload interface prominent and intuitive (drag-and-drop area with clear visual cues)
- Provide clear feedback at each step (uploading → extracting → ready for processing)
- Include helpful tooltips for first-time users
- Mobile-responsive design for tablet use (paralegals often work on iPads)

---

## Epic 2: AI Atomic Fact Extraction

**Priority:** Must-have (MVP)  
**Business Value:** Critical - Core innovation and primary value driver  
**Estimated Timeline:** 3-4 weeks

### Overview
This epic represents the core innovation of the Facts Feature. The AI must accurately extract individual factual assertions from interview transcripts, distinguish facts from opinions, and provide confidence scores that enable lawyer verification.

---

### Story 2.1: AI Fact Extraction via Gemini API

**As a** litigation lawyer  
**I want to** have AI automatically extract factual assertions from the interview transcript  
**So that** I can review organized facts instead of reading 50+ pages of transcript

**Acceptance Criteria:**
- [ ] System sends transcript to Gemini API with carefully crafted prompts
- [ ] AI extracts 40-60 facts per 10,000-word interview on average
- [ ] Each fact is a single, atomic assertion (not compound statements)
- [ ] Facts exclude opinions, legal conclusions, and non-factual content
- [ ] Processing completes within 60 seconds for typical 10,000-word interview
- [ ] Progress indicator shows processing status to user
- [ ] System handles API errors gracefully with retry logic (up to 3 attempts)
- [ ] Failed extractions show clear error message with option to retry or contact support
- [ ] AI accuracy achieves ≥85% precision (measured against test set)

**Priority:** Critical | **Dependencies:** Epic 1 (Interview Upload) | **Complexity:** High

---

### Story 2.2: Confidence Score Assignment

**As a** litigation lawyer  
**I want to** see a confidence score for each AI-extracted fact  
**So that** I can prioritize reviewing high-confidence facts and be cautious with low-confidence ones

**Acceptance Criteria:**
- [ ] Each extracted fact has a confidence score from 0-100%
- [ ] Confidence score reflects AI's certainty that the statement is a fact (not opinion)
- [ ] 90-100% = High confidence (clearly stated fact)
- [ ] 70-89% = Medium confidence (fact but may need verification)
- [ ] 50-69% = Low confidence (ambiguous, borderline opinion)
- [ ] <50% = Very low confidence (likely opinion or legal conclusion)
- [ ] Confidence score is visually indicated in UI (color coding or icon)
- [ ] User can filter facts by confidence range
- [ ] User can override AI confidence score with manual verification

**Priority:** High | **Dependencies:** Story 2.1 | **Complexity:** Medium

---

### Story 2.3: Source Attribution (Who Told the Lawyer)

**As a** litigation lawyer  
**I want to** know who provided each fact during the interview  
**So that** I can cite the source when using the fact in my case preparation

**Acceptance Criteria:**
- [ ] Each fact includes "Source" field indicating who provided the information
- [ ] Source defaults to witness name from interview metadata
- [ ] AI detects when source differs from witness (e.g., "Client said accountant told him...")
- [ ] User can manually edit source attribution if AI misidentifies
- [ ] Source is clearly displayed in fact list view
- [ ] User can filter facts by source
- [ ] Source links to original paragraph reference in transcript

**Priority:** High | **Dependencies:** Story 2.1 | **Complexity:** Medium

---

### Story 2.4: Witness Identification (Who Has Direct Knowledge)

**As a** litigation lawyer  
**I want to** know who has direct knowledge of each fact  
**So that** I can distinguish firsthand testimony from hearsay

**Acceptance Criteria:**
- [ ] Each fact includes "Witness" field indicating who has direct knowledge
- [ ] AI distinguishes between source (who told lawyer) and witness (who saw/experienced it)
- [ ] Example: "Client said accountant told him payment was late" → Source: Client, Witness: Accountant
- [ ] User can manually edit witness identification if AI misidentifies
- [ ] Witness is clearly displayed in fact list view alongside source
- [ ] User can filter facts by witness
- [ ] System highlights when source ≠ witness (potential hearsay indicator)

**Priority:** High | **Dependencies:** Story 2.1, Story 2.3 | **Complexity:** High

---

### Story 2.5: Paragraph Reference and Citation

**As a** litigation lawyer  
**I want to** see the exact location in the transcript where each fact was mentioned  
**So that** I can verify context and cite the source accurately

**Acceptance Criteria:**
- [ ] Each fact includes paragraph or page reference from original transcript
- [ ] Reference format shows "Page X, Lines Y-Z" or "Paragraph N"
- [ ] Clicking reference opens transcript with relevant section highlighted
- [ ] Reference is clearly visible in fact list view
- [ ] System handles transcripts without page numbers gracefully
- [ ] Multi-paragraph facts show range (e.g., "Paragraphs 12-14")
- [ ] User can navigate back and forth between fact list and transcript

**Priority:** High | **Dependencies:** Story 2.1 | **Complexity:** Medium

---

### Story 2.6: Date Extraction and Tagging

**As a** litigation lawyer  
**I want to** have dates mentioned in facts automatically extracted  
**So that** I can build timelines and filter facts chronologically

**Acceptance Criteria:**
- [ ] AI extracts dates mentioned within facts (e.g., "Contract signed January 15, 2023")
- [ ] Dates are normalized to standard format (YYYY-MM-DD)
- [ ] Each fact can have 0, 1, or multiple associated dates
- [ ] Dates are clearly displayed in fact list view
- [ ] User can filter facts by date range
- [ ] User can manually add or edit dates if AI misses them
- [ ] System handles partial dates (e.g., "January 2023") appropriately

**Priority:** Medium | **Dependencies:** Story 2.1 | **Complexity:** Medium

---

### Story 2.7: Topic Tagging

**As a** litigation lawyer  
**I want to** have facts automatically tagged with relevant topics  
**So that** I can quickly find all facts related to specific issues

**Acceptance Criteria:**
- [ ] AI suggests topic tags for each fact (e.g., "contract", "payment", "breach")
- [ ] Each fact can have multiple topic tags
- [ ] User can accept, reject, or modify suggested tags
- [ ] User can add custom tags
- [ ] Tag suggestions improve over time based on user corrections
- [ ] User can filter facts by topic tags
- [ ] Common tags appear as suggestions for easy selection

**Priority:** Low (Nice-to-have for MVP) | **Dependencies:** Story 2.1 | **Complexity:** Medium

---

### Technical Considerations
- Implement robust prompt engineering to maximize AI accuracy
- Use Gemini 2.0 Flash Exp model for optimal balance of speed and accuracy
- Implement confidence calibration based on validation testing
- Store raw AI response alongside processed facts for debugging
- Implement batch processing if handling multiple interviews simultaneously
- Consider caching mechanisms to reduce API calls for re-processing

### UX Considerations
- Show clear processing progress with estimated time remaining
- Provide sample output during onboarding so users know what to expect
- Use visual indicators (icons, colors) to distinguish confidence levels
- Make source vs. witness distinction immediately obvious in UI
- Allow inline editing of AI-extracted facts without leaving list view

---

## Epic 3: Hearsay Tracking

**Priority:** Must-have (MVP)  
**Business Value:** High - Unique differentiator, critical legal requirement  
**Estimated Timeline:** 2 weeks

### Overview
This epic implements the hearsay tracking system that distinguishes between direct knowledge and secondhand information. This is a critical legal distinction that no competitor currently offers, making it a key differentiator for ListBot.ca.

---

### Story 3.1: Hearsay Flag Detection

**As a** litigation lawyer  
**I want to** have facts automatically flagged as potential hearsay  
**So that** I can identify which facts need corroboration from direct witnesses

**Acceptance Criteria:**
- [ ] System automatically flags facts as hearsay when source ≠ witness
- [ ] Hearsay flag is boolean (true/false) stored in database
- [ ] AI detects hearsay based on language patterns ("Client said X told him...")
- [ ] Hearsay detection achieves ≥70% accuracy on test set
- [ ] User can manually override hearsay flag
- [ ] Hearsay status is clearly visible in fact list view
- [ ] System explains why fact is flagged as hearsay (shows source vs. witness)

**Priority:** High | **Dependencies:** Story 2.3, Story 2.4 | **Complexity:** Medium

---

### Story 3.2: Hearsay Visual Indicators

**As a** litigation lawyer  
**I want to** immediately identify hearsay facts visually in the fact list  
**So that** I can quickly distinguish admissible testimony from hearsay

**Acceptance Criteria:**
- [ ] Hearsay facts have distinct visual indicator (icon, color, or badge)
- [ ] Visual design is professional and clear (e.g., orange icon for hearsay)
- [ ] Indicator appears in fact list view and fact detail view
- [ ] Tooltip explains "What is hearsay?" for first-time users
- [ ] Non-hearsay facts have different indicator (e.g., green checkmark for direct knowledge)
- [ ] Visual indicators are accessible (not color-dependent only)
- [ ] Mobile view maintains clear visual distinction

**Priority:** High | **Dependencies:** Story 3.1 | **Complexity:** Low

---

### Story 3.3: Filter by Hearsay Status

**As a** litigation lawyer  
**I want to** filter the fact list to show only hearsay or only direct knowledge  
**So that** I can focus on facts that need corroboration or facts that are admissible

**Acceptance Criteria:**
- [ ] Filter dropdown includes "All Facts", "Direct Knowledge Only", "Hearsay Only"
- [ ] Filter applies instantly (<500ms)
- [ ] Filter state persists during session
- [ ] Filtered count displays (e.g., "Showing 23 hearsay facts of 157 total")
- [ ] Filter can be combined with other filters (source, witness, confidence, date)
- [ ] Clear filter button resets to "All Facts"
- [ ] URL updates to reflect filter state (shareable filtered views)

**Priority:** High | **Dependencies:** Story 3.1 | **Complexity:** Low

---

### Story 3.4: Hearsay Chain Visualization

**As a** litigation lawyer  
**I want to** see the complete hearsay chain for complex facts  
**So that** I can understand multi-level hearsay (e.g., "Client said X told him that Y said...")

**Acceptance Criteria:**
- [ ] For multi-level hearsay, system shows chain: Lawyer ← Source ← Witness1 ← Witness2
- [ ] Visual representation (arrows or flowchart) shows information flow
- [ ] Each person in chain is clickable (filter to facts from that person)
- [ ] System detects up to 3 levels of hearsay
- [ ] Tooltip explains legal implications of multi-level hearsay
- [ ] User can collapse/expand chain visualization
- [ ] Export includes hearsay chain information

**Priority:** Low (Nice-to-have for MVP) | **Dependencies:** Story 3.1 | **Complexity:** High

---

### Story 3.5: Hearsay Education and Tooltips

**As a** junior litigation associate  
**I want to** understand what hearsay means and why it matters  
**So that** I can use the hearsay tracking feature effectively

**Acceptance Criteria:**
- [ ] Tooltip on hearsay icon explains definition in plain language
- [ ] Help documentation includes hearsay explanation with examples
- [ ] First-time user sees brief tutorial about hearsay tracking
- [ ] Link to legal resources about hearsay rules
- [ ] Example facts demonstrate difference between direct knowledge and hearsay
- [ ] Onboarding flow includes hearsay feature demonstration
- [ ] Partner-focused messaging explains ROI of hearsay tracking

**Priority:** Medium | **Dependencies:** Story 3.1 | **Complexity:** Low

---

### Technical Considerations
- Implement natural language processing patterns to detect hearsay language
- Store hearsay chain as structured data (not just boolean)
- Consider jurisdiction-specific hearsay rules (future enhancement)
- Ensure hearsay status exports correctly to all formats

### UX Considerations
- Make hearsay indicators intuitive even for users unfamiliar with legal concepts
- Provide clear educational content without being condescending
- Use consistent visual language across all hearsay-related features
- Consider colorblind-friendly design for hearsay indicators

---

## Epic 4: Fact List View

**Priority:** Must-have (MVP)  
**Business Value:** High - Primary interface for reviewing and managing facts  
**Estimated Timeline:** 2-3 weeks

### Overview
The Fact List View is the primary interface where users will spend most of their time reviewing, filtering, and managing extracted facts. It must be fast, intuitive, and provide all necessary information at a glance.

---

### Story 4.1: Comprehensive Fact Table Display

**As a** litigation lawyer  
**I want to** see all extracted facts in a clean table view  
**So that** I can review them efficiently without unnecessary clicking

**Acceptance Criteria:**
- [ ] Table displays columns: Fact | Source | Witness | Hearsay | Confidence | Interview | Date | Actions
- [ ] Each row shows complete fact text (truncated with "Show more" if >200 characters)
- [ ] Table is responsive and works on desktop and tablet
- [ ] Infinite scroll or pagination for >100 facts (performance optimization)
- [ ] Loading state with skeleton UI while facts are fetching
- [ ] Empty state with helpful message if no facts exist
- [ ] Table layout is clean and professional (proper spacing, clear typography)

**Priority:** Critical | **Dependencies:** Epic 2 (Fact Extraction) | **Complexity:** Medium

---

### Story 4.2: Sorting Facts

**As a** litigation lawyer  
**I want to** sort facts by different columns  
**So that** I can organize facts in the most useful way for my current task

**Acceptance Criteria:**
- [ ] User can sort by: Date (chronological), Confidence (high to low), Source, Interview, Witness
- [ ] Clicking column header toggles ascending/descending sort
- [ ] Visual indicator shows current sort column and direction (arrow icon)
- [ ] Sort state persists during session
- [ ] Default sort is by confidence (high to low)
- [ ] Sort applies instantly (<500ms for 500 facts)
- [ ] URL updates to reflect sort state

**Priority:** High | **Dependencies:** Story 4.1 | **Complexity:** Low

---

### Story 4.3: Filtering Facts

**As a** litigation lawyer  
**I want to** filter facts by multiple criteria simultaneously  
**So that** I can narrow down to exactly the facts I need

**Acceptance Criteria:**
- [ ] Filter by source (dropdown or autocomplete)
- [ ] Filter by witness (dropdown or autocomplete)
- [ ] Filter by hearsay status (All | Direct Knowledge | Hearsay)
- [ ] Filter by confidence range (slider: 0-100%)
- [ ] Filter by interview (dropdown)
- [ ] Filter by date range (date picker)
- [ ] Multiple filters can be applied simultaneously (AND logic)
- [ ] Filter state displays clearly with active filter badges
- [ ] "Clear all filters" button resets to unfiltered view
- [ ] Filtered count displays (e.g., "Showing 23 of 157 facts")

**Priority:** High | **Dependencies:** Story 4.1 | **Complexity:** Medium

---

### Story 4.4: Keyword Search

**As a** litigation lawyer  
**I want to** search for facts containing specific keywords  
**So that** I can quickly find facts about particular topics

**Acceptance Criteria:**
- [ ] Search box prominently displayed above fact table
- [ ] Search performs instant filtering as user types (debounced 300ms)
- [ ] Search matches against fact text, source, and witness names
- [ ] Matching text is highlighted in results
- [ ] Search is case-insensitive
- [ ] Search can be combined with filters
- [ ] Search history saved (last 5 searches) for quick re-use
- [ ] Clear search button (X icon) resets search

**Priority:** High | **Dependencies:** Story 4.1 | **Complexity:** Low

---

### Story 4.5: Fact Detail View (Expand/Collapse)

**As a** litigation lawyer  
**I want to** expand a fact to see full details without leaving the list  
**So that** I can quickly review context without excessive navigation

**Acceptance Criteria:**
- [ ] Clicking fact row expands to show full details
- [ ] Expanded view shows: Full fact text, Source, Witness, Hearsay status, Confidence, Paragraph reference, Date(s), Topic tags, Audit trail
- [ ] Expanded view includes "View in Transcript" button
- [ ] User can collapse fact by clicking again
- [ ] Only one fact expanded at a time (expanding new fact collapses previous)
- [ ] Expanded state indicated visually (background color change)
- [ ] Keyboard navigation supported (arrow keys to navigate, Enter to expand)

**Priority:** Medium | **Dependencies:** Story 4.1 | **Complexity:** Low

---

### Story 4.6: Inline Fact Editing

**As a** litigation lawyer  
**I want to** edit facts directly in the list view  
**So that** I can make quick corrections without complex workflows

**Acceptance Criteria:**
- [ ] Double-click fact text to enable inline editing
- [ ] User can edit: Fact text, Source, Witness, Hearsay flag, Confidence, Date(s), Tags
- [ ] Save button commits changes to database
- [ ] Cancel button reverts to original
- [ ] Validation prevents saving empty facts
- [ ] Edit mode indicated visually (border, background color)
- [ ] Changes save automatically after 3 seconds of inactivity (with visual indicator)
- [ ] User can edit multiple facts sequentially without closing list

**Priority:** High | **Dependencies:** Story 4.1 | **Complexity:** Medium

---

### Story 4.7: Bulk Selection and Actions

**As a** litigation lawyer  
**I want to** select multiple facts and perform actions on them  
**So that** I can efficiently manage large numbers of facts

**Acceptance Criteria:**
- [ ] Checkbox on each fact row enables selection
- [ ] "Select All" checkbox selects all visible facts (respects filters)
- [ ] Selected count displays (e.g., "23 facts selected")
- [ ] Bulk actions available: Delete, Export, Tag, Mark as Verified
- [ ] Confirmation dialog for destructive actions (Delete)
- [ ] Bulk actions complete with progress indicator
- [ ] Success/error messages for bulk operations
- [ ] Selection state clears after bulk action completes

**Priority:** Medium | **Dependencies:** Story 4.1 | **Complexity:** Medium

---

### Story 4.8: Fact Count and Statistics

**As a** litigation partner  
**I want to** see statistics about the facts in my case  
**So that** I can assess case coverage and identify gaps

**Acceptance Criteria:**
- [ ] Dashboard displays: Total facts, Facts by witness, Facts by interview, Hearsay count, Average confidence score
- [ ] Statistics update dynamically as filters are applied
- [ ] Visual charts (simple bar chart) show fact distribution
- [ ] Statistics are exportable to PDF/CSV
- [ ] Clicking statistic (e.g., "32 hearsay facts") applies relevant filter
- [ ] Statistics persist and are available in case overview

**Priority:** Low (Nice-to-have for MVP) | **Dependencies:** Story 4.1 | **Complexity:** Medium

---

### Technical Considerations
- Optimize query performance for large fact lists (500+ facts)
- Implement virtual scrolling for very large lists
- Use Firestore compound indexes for multi-field filtering
- Cache filter/sort state in session storage
- Consider implementing optimistic UI updates for better perceived performance

### UX Considerations
- Design for speed - users need to review many facts quickly
- Minimize clicks - inline editing and expand/collapse reduces navigation
- Clear visual hierarchy - most important info (fact text, hearsay) stands out
- Keyboard shortcuts for power users
- Mobile-friendly table layout (consider card view for mobile)

---

## Epic 5: Semantic Fact Search (RAG)

**Priority:** Must-have (MVP)  
**Business Value:** Critical - Key differentiator, enables cross-witness search  
**Estimated Timeline:** 2-3 weeks

### Overview
Semantic search powered by Google File Search API (RAG) enables lawyers to find facts by meaning rather than exact keywords. This is transformative for trial preparation, allowing queries like "Find all facts about the contract signing" that return relevant facts even if they use different wording.

---

### Story 5.1: Natural Language Query Interface

**As a** litigation lawyer  
**I want to** search for facts using natural language questions  
**So that** I can find relevant facts without knowing exact keywords

**Acceptance Criteria:**
- [ ] Prominent search box with placeholder "Ask a question about your case facts..."
- [ ] User can enter queries like "What did witnesses say about the contract signing date?"
- [ ] Search supports full sentences and questions
- [ ] Search examples provided for first-time users
- [ ] Search history saved (last 10 queries)
- [ ] Recent searches appear as suggestions
- [ ] Search submits on Enter key or clicking Search button
- [ ] Clear indication that this is semantic search (different from keyword search)

**Priority:** High | **Dependencies:** Epic 2 (Fact Extraction) | **Complexity:** Low

---

### Story 5.2: Google File Search Integration

**As a** litigation lawyer  
**I want to** have my facts semantically searchable via Google File Search  
**So that** I can find facts by meaning even when wording differs

**Acceptance Criteria:**
- [ ] All extracted facts are automatically indexed in Google File Search store
- [ ] Indexing occurs within 60 seconds of fact extraction completing
- [ ] Each case has its own File Search store (privilege protection)
- [ ] Indexing includes fact text, source, witness, and metadata
- [ ] Re-indexing occurs when facts are edited or added
- [ ] Failed indexing attempts are retried (up to 3 attempts)
- [ ] Indexing status visible in admin panel for debugging
- [ ] System handles File Search API rate limits gracefully

**Priority:** Critical | **Dependencies:** Epic 2 | **Complexity:** High

---

### Story 5.3: Semantic Search Results Display

**As a** litigation lawyer  
**I want to** see search results ranked by relevance with context  
**So that** I can quickly identify the most useful facts

**Acceptance Criteria:**
- [ ] Results display within 2 seconds of query submission
- [ ] Results show: Fact text, Source, Witness, Hearsay status, Relevance score (0-100%)
- [ ] Results ranked by relevance (highest first)
- [ ] Matching concepts highlighted in result snippets
- [ ] Each result includes "View in Transcript" link
- [ ] Results grouped by interview if multiple witnesses provide same fact
- [ ] "No results found" message includes suggestions for refining query
- [ ] Results are paginated (10 per page) with infinite scroll option

**Priority:** High | **Dependencies:** Story 5.2 | **Complexity:** Medium

---

### Story 5.4: Relevance Scoring and Citations

**As a** litigation lawyer  
**I want to** understand why each fact matched my query  
**So that** I can assess whether it's truly relevant to my needs

**Acceptance Criteria:**
- [ ] Each result shows relevance score (0-100%)
- [ ] High relevance (90-100%) clearly indicated (e.g., green badge)
- [ ] Medium relevance (70-89%) indicated differently (e.g., yellow badge)
- [ ] Low relevance (<70%) indicated (e.g., gray badge)
- [ ] Clicking "Why is this relevant?" shows matching concepts
- [ ] Citations link back to specific sentence/paragraph in fact
- [ ] User can provide feedback (thumbs up/down) on relevance
- [ ] Feedback used to improve future searches (learning system)

**Priority:** Medium | **Dependencies:** Story 5.3 | **Complexity:** Medium

---

### Story 5.5: Cross-Witness Search

**As a** litigation lawyer  
**I want to** search across all witnesses simultaneously  
**So that** I can find every fact related to a topic regardless of who said it

**Acceptance Criteria:**
- [ ] Default search scope is all interviews in the case
- [ ] Results clearly indicate which witness provided each fact
- [ ] User can filter results by specific witness(es) after searching
- [ ] Search across witnesses enabled by default (no extra clicks)
- [ ] Results show distribution across witnesses (e.g., "3 witnesses mentioned contract signing")
- [ ] User can toggle to search single interview if desired
- [ ] Cross-case search is disabled (privilege protection)

**Priority:** High | **Dependencies:** Story 5.3 | **Complexity:** Low

---

### Story 5.6: Search Result Actions

**As a** litigation lawyer  
**I want to** take action on search results directly  
**So that** I can efficiently work with facts I've found

**Acceptance Criteria:**
- [ ] Each result has "Add to Collection" button (Phase 2 feature)
- [ ] Each result has "Export" option
- [ ] User can select multiple results for bulk export
- [ ] "View All Results in List" button switches to filtered fact list view
- [ ] "Email Results" option formats results for sending to client/colleague
- [ ] "Copy Fact" button copies fact text to clipboard
- [ ] Each result can be edited inline (same as fact list view)

**Priority:** Medium | **Dependencies:** Story 5.3 | **Complexity:** Low

---

### Story 5.7: Search Performance and Error Handling

**As a** litigation lawyer  
**I want to** have searches complete quickly and reliably  
**So that** I can work efficiently without frustration

**Acceptance Criteria:**
- [ ] Search results return within 2 seconds for 95% of queries
- [ ] Loading state displayed during search
- [ ] Timeout after 10 seconds with helpful error message
- [ ] Failed searches automatically retry once
- [ ] Clear error messages if Google File Search is unavailable
- [ ] Fallback to keyword search if semantic search fails
- [ ] System logs slow queries for performance optimization
- [ ] Search works offline with locally cached results (degraded mode)

**Priority:** High | **Dependencies:** Story 5.2 | **Complexity:** Medium

---

### Story 5.8: Search Query Suggestions and Autocomplete

**As a** litigation lawyer  
**I want to** see suggested queries based on my case facts  
**So that** I can discover useful searches I might not have thought of

**Acceptance Criteria:**
- [ ] System suggests 3-5 relevant queries based on case content
- [ ] Suggestions include: "Facts about [key topic]", "Timeline of [key event]", "What did [witness] say about [topic]?"
- [ ] Autocomplete suggests queries as user types
- [ ] Suggestions based on: Topic tags, witness names, common legal terms
- [ ] User can click suggestion to immediately run that search
- [ ] Suggestions update as case content grows
- [ ] Suggestions are contextual (different for each case)

**Priority:** Low (Nice-to-have for MVP) | **Dependencies:** Story 5.1 | **Complexity:** Medium

---

### Technical Considerations
- Implement Google File Search API integration carefully (new technology)
- Consider chunking facts for optimal RAG performance
- Monitor API costs and implement caching where possible
- Ensure case-level data isolation (no cross-case contamination)
- Plan for API version updates and deprecation

### UX Considerations
- Make semantic search feel "magical" but explainable
- Provide clear feedback on why results were returned
- Design for both expert and novice users (tooltips, examples)
- Consider adding "Search Tips" help section
- Ensure search is fast enough to encourage exploration

---

## Epic 6: Fact Verification & Audit Trail

**Priority:** Must-have (MVP)  
**Business Value:** High - Critical for legal compliance and trust  
**Estimated Timeline:** 1-2 weeks

### Overview
Lawyers must be able to verify AI-extracted facts and maintain a complete audit trail of all changes. This is essential for legal compliance, malpractice prevention, and building user trust in the AI system.

---

### Story 6.1: Manual Fact Verification

**As a** litigation lawyer  
**I want to** mark facts as verified after I review them  
**So that** I know which facts I've personally confirmed are accurate

**Acceptance Criteria:**
- [ ] Each fact has "Verified" checkbox or button
- [ ] Clicking checkbox marks fact as verified (green checkmark appears)
- [ ] Verification status stored with timestamp and user ID
- [ ] Verified facts visually distinct in list view (e.g., green checkmark icon)
- [ ] User can filter to show "Verified Only" or "Unverified Only"
- [ ] Verification count displays (e.g., "45 of 127 facts verified")
- [ ] User can unmark verification if needed
- [ ] Verification status exports with fact data

**Priority:** High | **Dependencies:** Epic 4 (Fact List View) | **Complexity:** Low

---

### Story 6.2: Complete Audit Trail

**As a** litigation partner  
**I want to** see a complete history of all changes to each fact  
**So that** I can ensure accountability and track fact evolution

**Acceptance Criteria:**
- [ ] System logs all fact changes: Creation (AI or manual), Edits (what changed, who changed it, when), Verification, Deletion
- [ ] Audit trail accessible via "History" button on each fact
- [ ] History displays in chronological order (most recent first)
- [ ] Each entry shows: Timestamp, User, Action type, Changes made (before/after)
- [ ] Audit trail is immutable (cannot be edited or deleted)
- [ ] Export includes complete audit trail
- [ ] Partner-level users can view audit trail for all team members' facts
- [ ] Audit trail exportable as CSV for compliance purposes

**Priority:** High | **Dependencies:** Story 6.1 | **Complexity:** Medium

---

### Story 6.3: Confidence Score Override

**As a** litigation lawyer  
**I want to** override AI confidence scores based on my judgment  
**So that** I can correct cases where AI is overly confident or too cautious

**Acceptance Criteria:**
- [ ] User can manually adjust confidence score (0-100% slider)
- [ ] Override clearly indicated (e.g., "User Override" badge)
- [ ] Original AI confidence score preserved in audit trail
- [ ] Tooltip explains why user might override confidence
- [ ] Override recorded in audit trail with justification field (optional)
- [ ] User can revert to original AI confidence
- [ ] Override statistics tracked (helps improve AI over time)

**Priority:** Medium | **Dependencies:** Story 6.1 | **Complexity:** Low

---

### Story 6.4: Manual Fact Addition

**As a** litigation lawyer  
**I want to** manually add facts that AI missed  
**So that** I can ensure completeness even when AI isn't perfect

**Acceptance Criteria:**
- [ ] "Add Fact" button prominently displayed in fact list
- [ ] Form includes all required fields: Fact text, Source, Witness, Hearsay flag, Confidence, Interview reference, Date(s), Tags
- [ ] Manually added facts clearly labeled (e.g., "Manual Entry" badge)
- [ ] Manual facts included in all searches and filters
- [ ] Manual facts exported alongside AI facts
- [ ] User can reference specific paragraph/page if desired
- [ ] Validation ensures all required fields completed
- [ ] Manual facts contribute to fact count statistics

**Priority:** High | **Dependencies:** Epic 4 | **Complexity:** Low

---

### Story 6.5: Fact Deletion with Safeguards

**As a** litigation lawyer  
**I want to** delete incorrect or irrelevant facts  
**So that** I can maintain a clean, accurate fact repository

**Acceptance Criteria:**
- [ ] Delete button available on each fact (with confirmation dialog)
- [ ] Confirmation dialog explains fact will be permanently deleted
- [ ] Deleted facts removed from all views and searches
- [ ] Deletion recorded in audit trail (soft delete for recovery)
- [ ] Partner-level users can recover deleted facts within 30 days
- [ ] Bulk deletion requires additional confirmation
- [ ] Deletion statistics tracked (helps identify AI accuracy issues)
- [ ] User notified if deleting fact referenced elsewhere (Phase 2 concern)

**Priority:** High | **Dependencies:** Story 6.2 | **Complexity:** Medium

---

### Story 6.6: Fact Approval Workflow (Multi-User Cases)

**As a** senior litigation associate  
**I want to** route facts to partners for approval  
**So that** junior associates' work is reviewed before being relied upon

**Acceptance Criteria:**
- [ ] User can mark facts as "Pending Approval"
- [ ] Facts pending approval have distinct visual indicator
- [ ] Approval notifications sent to designated reviewer (partner/senior associate)
- [ ] Reviewer can approve or reject with comments
- [ ] Rejected facts include feedback for improvement
- [ ] Approval status tracked in audit trail
- [ ] Filter by approval status: All | Approved | Pending | Rejected
- [ ] Approval workflow is optional (can be disabled for solo practitioners)

**Priority:** Low (Nice-to-have for MVP, defer to Phase 2) | **Dependencies:** Story 6.1 | **Complexity:** High

---

### Story 6.7: AI Learning from User Corrections

**As a** product manager  
**I want to** track user corrections to AI-extracted facts  
**So that** we can improve AI accuracy over time

**Acceptance Criteria:**
- [ ] System logs all AI fact edits with before/after comparison
- [ ] Deleted AI facts logged with reason (if provided)
- [ ] Confidence overrides logged with user reasoning
- [ ] Aggregate data accessible to product team (anonymized)
- [ ] Common correction patterns identified for prompt improvement
- [ ] Feedback loop implemented to improve future AI extractions
- [ ] User corrections contribute to AI model fine-tuning (future enhancement)
- [ ] Users can opt out of contributing to AI improvements (privacy)

**Priority:** Medium | **Dependencies:** Story 6.2 | **Complexity:** Medium

---

### Technical Considerations
- Implement Firestore security rules to ensure audit trails are immutable
- Consider using Firestore subcollections for audit trail (scalability)
- Implement soft delete for fact recovery
- Track edit frequency to identify problematic AI extractions
- Consider implementing version control for complex facts

### UX Considerations
- Make verification quick and frictionless (single click)
- Design audit trail to be readable by non-technical users
- Provide clear visual feedback for all verification actions
- Consider keyboard shortcuts for power users (V for verify, E for edit)
- Balance transparency with information overload

---

## Epic 7: Fact Export

**Priority:** Must-have (MVP)  
**Business Value:** High - Essential for sharing facts with clients and trial preparation  
**Estimated Timeline:** 1-2 weeks

### Overview
Users must be able to export facts in multiple formats for different use cases: sharing with clients (PDF), analysis (CSV), and integration with other tools (DOCX). Export quality must be professional and suitable for client-facing materials.

---

### Story 7.1: Export to PDF

**As a** litigation lawyer  
**I want to** export facts to a professionally formatted PDF  
**So that** I can share fact summaries with clients and colleagues

**Acceptance Criteria:**
- [ ] "Export to PDF" button available in fact list view
- [ ] User can choose to export: All facts, Filtered facts, Selected facts
- [ ] PDF includes: Case name, Interview name(s), Export date, Fact table with all columns
- [ ] PDF formatted professionally with proper headers, page numbers, branding
- [ ] Hearsay facts visually indicated (icon or highlighting)
- [ ] Export completes within 5 seconds for 500 facts
- [ ] PDF is named clearly (e.g., "CaseName-Facts-2025-11-21.pdf")
- [ ] User can customize export options: Include/exclude hearsay column, Include/exclude confidence scores, Group by witness or chronologically

**Priority:** High | **Dependencies:** Epic 4 (Fact List View) | **Complexity:** Medium

---

### Story 7.2: Export to CSV

**As a** litigation lawyer  
**I want to** export facts to CSV format  
**So that** I can analyze facts in Excel or import into other tools

**Acceptance Criteria:**
- [ ] "Export to CSV" button available in fact list view
- [ ] CSV includes all fact data: Fact text, Source, Witness, Hearsay (Yes/No), Confidence, Interview, Date, Tags, Verified (Yes/No), Created by, Created date
- [ ] CSV opens correctly in Excel with proper column headers
- [ ] Special characters (quotes, commas) properly escaped
- [ ] Export respects current filters and selections
- [ ] CSV is UTF-8 encoded for international characters
- [ ] File named clearly (e.g., "CaseName-Facts-2025-11-21.csv")

**Priority:** High | **Dependencies:** Epic 4 | **Complexity:** Low

---

### Story 7.3: Export to DOCX

**As a** litigation lawyer  
**I want to** export facts to Word format  
**So that** I can edit and customize fact summaries for different purposes

**Acceptance Criteria:**
- [ ] "Export to DOCX" button available in fact list view
- [ ] Word document formatted professionally with styles
- [ ] Document includes: Title page with case info, Table of contents, Facts organized by witness or chronologically, Hearsay facts clearly marked
- [ ] Document is editable in Microsoft Word and Google Docs
- [ ] Formatting preserved (bold, italics, bullet points)
- [ ] Export completes within 10 seconds for 500 facts
- [ ] User can choose organization: By witness, By date, By topic, By hearsay status

**Priority:** Medium | **Dependencies:** Epic 4 | **Complexity:** Medium

---

### Story 7.4: Export Options and Customization

**As a** litigation lawyer  
**I want to** customize what gets exported  
**So that** I can create different reports for different audiences

**Acceptance Criteria:**
- [ ] Export dialog shows customization options before exporting
- [ ] Options include: Date range filter, Confidence threshold (only export facts >X% confidence), Include/exclude columns, Grouping/sorting options, Include/exclude metadata (audit trail, verification status)
- [ ] "Quick Export" button uses default options (all facts, all columns)
- [ ] Export settings remembered for next export
- [ ] Template export options for common use cases (e.g., "Client Report", "Internal Review", "Trial Prep")
- [ ] Preview before exporting (shows first 5 facts formatted)

**Priority:** Medium | **Dependencies:** Story 7.1, 7.2, 7.3 | **Complexity:** Medium

---

### Story 7.5: Scheduled Exports and Email Delivery

**As a** litigation partner  
**I want to** schedule regular fact exports to be emailed to me  
**So that** I can stay updated on case progress without manual work

**Acceptance Criteria:**
- [ ] User can set up scheduled exports (daily, weekly, monthly)
- [ ] Schedule configuration includes: Format (PDF/CSV/DOCX), Recipients (email addresses), Filter criteria, Grouping/sorting
- [ ] Exports sent as email attachments
- [ ] Email includes summary: Fact count, New facts since last export, Verification status
- [ ] User can pause or cancel scheduled exports
- [ ] Failed exports trigger notification with error details
- [ ] Scheduled exports respect user permissions (only their cases)

**Priority:** Low (Nice-to-have, defer to Phase 2) | **Dependencies:** Story 7.1, 7.2, 7.3 | **Complexity:** High

---

### Story 7.6: Export Audit Trail

**As a** litigation partner  
**I want to** track all fact exports  
**So that** I can ensure data security and compliance

**Acceptance Criteria:**
- [ ] System logs all exports: Who exported, When, Format, Filter criteria, Number of facts exported
- [ ] Export log accessible to partners and admins
- [ ] Export log exportable itself (for compliance audits)
- [ ] Notifications for unusual export activity (e.g., bulk exports, all-case exports)
- [ ] Export history visible in case overview
- [ ] Partner can restrict export permissions by user role

**Priority:** Low (Nice-to-have for MVP) | **Dependencies:** Story 7.1 | **Complexity:** Low

---

### Technical Considerations
- Use established libraries for PDF generation (e.g., PDFKit or similar)
- Use docx-js for Word document generation (consistent with Pleadings feature)
- Implement streaming for large exports (>1000 facts)
- Consider background processing for very large exports
- Ensure exports don't impact system performance

### UX Considerations
- Make default export fast and simple (one click)
- Provide advanced options for power users without overwhelming beginners
- Show clear progress indicator for large exports
- Auto-download file or provide clear download link
- Design export dialog to be intuitive and self-explanatory

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **AI Fact Extraction** | <60 seconds for 10,000-word interview | p95 latency |
| **Semantic Search** | <2 seconds for query response | p95 latency |
| **Fact List Load** | <1 second for 500 facts | p95 latency |
| **Export Generation** | <5 seconds for PDF (500 facts) | p95 latency |
| **Page Load Time** | <2 seconds (initial load) | p95 latency |
| **Concurrent Users** | Support 1,000 simultaneous users | Load testing |
| **Database Queries** | <200ms for filtered fact lists | p95 latency |

### 5.2 Security

**Authentication & Authorization:**
- Multi-factor authentication (MFA) required for all users
- Role-based access control (RBAC): Partner, Senior Associate, Associate, Paralegal
- Session timeout: 30 minutes of inactivity
- Failed login lockout: 5 attempts, 15-minute lockout

**Data Protection:**
- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- Attorney-client privileged data protected (no cross-case access)
- Google File Search configured to NOT train on customer data
- SOC 2 Type II compliance required

**Audit & Compliance:**
- Complete audit trail for all data access and modifications
- Export logs for compliance tracking
- Data deletion capabilities for litigation holds
- GDPR compliance (right to be forgotten, data portability)

### 5.3 Scalability

**Data Volume:**
- Support 10,000+ facts per case
- Support 100+ interviews per case
- Support 1,000+ active cases per organization
- Support 10,000+ users across all organizations

**Growth Handling:**
- Horizontal scaling for Firebase Functions
- Firestore auto-scaling (handles growth transparently)
- Google File Search auto-scaling (managed service)
- CDN for static assets (Firebase Hosting)

**Cost Management:**
- Google File Search cost: <$0.25/user/month
- Gemini API cost: <$0.05/user/month
- Firebase cost: <$0.20/user/month
- **Total target:** <$0.50/user/month in variable costs

### 5.4 Reliability

**Uptime & Availability:**
- Target uptime: 99.9% (excluding scheduled maintenance)
- Scheduled maintenance: Sundays 2-4 AM EST
- Graceful degradation if AI services unavailable (allow manual entry)
- Automatic retry logic for transient failures

**Error Handling:**
- All errors logged with context for debugging
- User-friendly error messages (no technical jargon)
- Automatic error reporting to development team
- Recovery procedures documented for all failure modes

**Backup & Recovery:**
- Firestore automated daily backups (Firebase default)
- Point-in-time recovery within 7 days
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours

### 5.5 Accessibility

**WCAG Compliance:**
- WCAG 2.1 Level AA compliance required
- Keyboard navigation for all features
- Screen reader compatibility (tested with NVDA, JAWS)
- Color contrast ratios meet AA standards (4.5:1 for normal text)
- Alt text for all images and icons
- Focus indicators clearly visible
- No time-based interactions (or provide alternatives)

**Responsive Design:**
- Mobile-responsive (works on tablets: iPad, Surface)
- Minimum supported resolution: 1024×768
- Touch-friendly interface (44×44px minimum touch targets)
- Orientation support (portrait and landscape)

### 5.6 Maintainability

**Code Quality:**
- ESLint and Prettier for code formatting
- Unit test coverage: >80% for critical paths
- Integration test coverage: All major user flows
- End-to-end tests: Critical scenarios (upload, extract, search)
- Code review required for all changes (no direct commits to main)

**Documentation:**
- Inline code comments for complex logic
- API documentation (all Firebase Functions)
- User documentation (Help Center articles)
- Runbook for common operational tasks
- Architecture decision records (ADRs) for major decisions

**Monitoring & Observability:**
- Application performance monitoring (Firebase Performance)
- Error tracking (Firebase Crashlytics or Sentry)
- Usage analytics (Firebase Analytics)
- Custom metrics: AI accuracy, fact extraction success rate, search quality
- Alerting for critical failures (PagerDuty or similar)

### 5.7 Localization (Future)

**MVP (Phase 1):**
- English only (US legal terminology)

**Future Phases:**
- French (Canadian legal system)
- Support for other Canadian provinces' legal systems
- Date/time formatting for different locales

---

## 6. User Experience Requirements

### 6.1 Key User Flows

**Flow 1: First-Time User - Upload and Extract Facts**

1. User navigates to Facts feature
2. System shows welcome modal explaining feature
3. User clicks "Upload Interview"
4. User drags PDF transcript or clicks to browse
5. System uploads file (progress bar shown)
6. System extracts text (progress indicator)
7. User reviews extracted text preview
8. User enters witness metadata (name, date, interviewer)
9. User clicks "Begin Fact Extraction"
10. System shows AI processing progress
11. Fact list appears with 40-60 extracted facts
12. User reviews facts, verifies high-confidence ones
13. User searches for specific topic using semantic search
14. User exports fact summary to PDF

**Expected Time:** 5-10 minutes (vs. 3-5 hours manually)

---

**Flow 2: Regular User - Quick Fact Lookup**

1. User navigates to Facts feature
2. User enters semantic search query "contract signing date"
3. System returns relevant facts within 2 seconds
4. User clicks fact to view full context
5. User clicks "View in Transcript" to verify
6. User marks fact as verified
7. User copies fact text for use in brief

**Expected Time:** 30-60 seconds

---

**Flow 3: Partner - Review Associate's Work**

1. Partner navigates to case facts
2. Partner filters by "Unverified Facts"
3. Partner reviews facts, checking hearsay status
4. Partner edits incorrect fact (inline editing)
5. Partner marks reviewed facts as verified
6. Partner exports verified facts to PDF for client
7. Partner emails PDF to client

**Expected Time:** 10-15 minutes (vs. 1-2 hours re-reading transcripts)

---

### 6.2 Design Principles

**Principle 1: Speed Over Perfection**
- AI doesn't need to be 100% accurate; it needs to be 60-80% faster than manual work
- Users expect to verify AI suggestions, not blindly trust them
- Optimize for quick review and correction, not perfect extraction

**Principle 2: Transparency and Control**
- Always show confidence scores so users know when to be cautious
- Make AI decision-making explainable (why is this hearsay? why this confidence?)
- Give users full control to override, edit, delete any AI suggestion

**Principle 3: Minimize Clicks**
- Inline editing (no navigation to separate edit page)
- Expand/collapse for details (no opening separate windows)
- Bulk actions for efficiency (select multiple, act once)

**Principle 4: Progressive Disclosure**
- Show most important info first (fact text, hearsay, confidence)
- Hide advanced features until needed (filters, exports, audit trails)
- Provide "Advanced" sections for power users

**Principle 5: Keyboard-Friendly**
- All actions accessible via keyboard
- Keyboard shortcuts for common actions (V=verify, E=edit, S=search)
- Tab navigation follows logical order

### 6.3 Visual Design Requirements

**Typography:**
- Primary font: Arial (clean, professional, universally supported)
- Headings: 16-20px, bold
- Body text: 14px, regular
- Fact text: 14px, line height 1.5 for readability

**Color Palette:**
- Primary: Blue (#2563EB) - actions, links
- Success: Green (#10B981) - verified facts, direct knowledge
- Warning: Orange (#F59E0B) - hearsay facts, medium confidence
- Error: Red (#EF4444) - low confidence, errors
- Neutral: Gray scale (#F3F4F6 to #111827) - backgrounds, text

**Icons:**
- Use consistent icon library (Heroicons or similar)
- Hearsay: Warning triangle or information icon
- Verified: Checkmark
- Direct knowledge: Person icon
- Confidence: Star or gauge icon

**Spacing:**
- Generous whitespace (24-32px between major sections)
- Consistent padding (16px standard, 8px compact)
- Clear visual separation between fact rows

**Responsive Breakpoints:**
- Desktop: >1280px (full table view)
- Tablet: 768-1279px (adapted table or card view)
- Mobile: <768px (card view, simplified)

---

## 7. Success Metrics

### 7.1 Product Metrics

**Adoption Metrics:**
- Weekly Active Users (WAU): # of users who use Facts feature ≥1x/week
- Interviews Uploaded: # of new interviews uploaded per week
- Facts Extracted: Total # of facts in system (growth rate)
- Searches Performed: # of semantic searches per week

**Engagement Metrics:**
- Facts per Interview: Average # of facts extracted (target: 40-60)
- Verification Rate: % of facts marked as "verified" by users
- Edit Rate: % of facts edited by users (lower = better AI accuracy)
- Delete Rate: % of facts deleted by users (lower = better AI accuracy)

**Outcome Metrics:**
- Time Saved: Self-reported time savings per interview (target: 60%+)
- NPS Score: Net Promoter Score (target: 50+)
- Churn Rate: % of users who stop using feature (target: <10% monthly)

### 7.2 Technical Metrics

**Performance:**
- AI extraction latency (p50, p95, p99)
- Semantic search latency (p50, p95, p99)
- Fact list load time (p50, p95, p99)
- Error rate (<1% of requests)

**AI Quality:**
- Fact extraction accuracy: ≥85% (manual review benchmark)
- Hearsay detection accuracy: ≥70%
- Confidence calibration: High-confidence facts should be 90%+ accurate
- User acceptance rate: ≥70% of AI facts accepted without modification

**System Health:**
- Uptime: 99.9%
- API success rate: 99%+
- Failed extraction rate: <5%
- User-reported bugs: <10 per week

### 7.3 Business Metrics

**Revenue:**
- Conversion Rate: % of free trial users who upgrade to paid (target: 25%)
- ARPU (Average Revenue Per User): Revenue per user per month
- Customer Acquisition Cost (CAC): Cost to acquire 1 user
- Lifetime Value (LTV): Total revenue per user over lifetime
- LTV:CAC Ratio: Target >3:1

**Market Position:**
- Market share: % of target market using ListBot.ca (target: 3-5% year 3)
- Feature differentiation: Facts Feature as reason for choosing ListBot (target: 40%+ cite this in surveys)
- Competitive wins: # of conversions from competitors citing Facts Feature

### 7.4 Measurement Methods

**User Surveys:**
- Post-feature launch survey (within 7 days of first use)
- Quarterly NPS surveys
- Exit surveys for churned users

**Product Analytics:**
- Firebase Analytics for user behavior tracking
- Custom events: fact_extracted, fact_verified, search_performed, export_generated
- Funnel analysis: Upload → Extract → Review → Export

**Manual Review:**
- Monthly manual review of 50 randomly selected interviews
- Compare AI extraction to human expert baseline
- Track accuracy trends over time

**Customer Interviews:**
- Quarterly interviews with 10-15 power users
- Ask about: Pain points, feature requests, workflow improvements
- Understand why users love it (or why they churned)

---

## 8. Release Planning

### 8.1 Phase 1: MVP (Months 1-3)

**Target Date:** February 28, 2026

**Included Epics:**
- Epic 1: Witness Interview Upload & Processing
- Epic 2: AI Atomic Fact Extraction
- Epic 3: Hearsay Tracking
- Epic 4: Fact List View
- Epic 5: Semantic Fact Search (RAG)
- Epic 6: Fact Verification & Audit Trail
- Epic 7: Fact Export

**Launch Criteria:**
- ✅ AI accuracy ≥85% on test set (50+ interviews)
- ✅ All 7 epics complete and tested
- ✅ 10-15 beta users successfully using feature for ≥2 weeks
- ✅ User documentation complete (Help Center articles)
- ✅ Performance targets met (search <2s, extraction <60s)
- ✅ Security review passed (SOC 2 compliance verified)

**Go-to-Market:**
- Beta program: 10-15 Canadian law firms (Month 3)
- Public launch: All Professional tier customers (Month 4)
- Marketing: Email campaign, webinar, case studies, legal tech blog posts
- Pricing: Facts Feature included in Professional tier ($120-150/GB)

---

### 8.2 Phase 2: Advanced Features (Months 4-9)

**Target Date:** August 31, 2026

**Features:**
1. **Fact-to-Document Linking** (Months 4-5)
   - Link facts to supporting evidence documents
   - AI suggests relevant documents for each fact
   - Visual indicator showing document support

2. **Fact-to-Pleading Linking** (Months 5-6)
   - Connect interview facts to pleading allegations
   - Show which witnesses support each pleading claim
   - Generate witness support matrix

3. **Contradiction Detection** (Months 6-7)
   - AI identifies conflicting facts between witnesses
   - Visual indicators for contradictions
   - Generate "contradiction report" for cross-examination prep

4. **Advanced Search** (Months 7-8)
   - Boolean queries (AND, OR, NOT)
   - Date range filters
   - Proximity search
   - Saved searches

5. **Cross-Examination Prep** (Months 8-9)
   - AI generates cross-examination questions based on contradictions
   - Organize facts by witness for trial prep
   - "Impeachment packet" generation

**Launch Criteria:**
- ✅ All Phase 2 features complete and tested
- ✅ MVP metrics achieved (adoption >70%, satisfaction >4.2, accuracy >85%)
- ✅ User feedback incorporated from Phase 1
- ✅ Performance remains strong with new features

---

### 8.3 Phase 3: Trial Prep & Analytics (Months 10-18)

**Target Date:** May 31, 2027

**Features:**
1. **Timeline Visualization** (Months 10-11)
   - Interactive timeline showing facts chronologically
   - Filter by witness, topic, hearsay status
   - Export timeline for trial presentation

2. **Fact Strength Indicators** (Months 12-13)
   - Weak/Medium/Strong ratings based on corroboration
   - Documentary evidence support tracking
   - Hearsay chain analysis

3. **Trial Prep Automation** (Months 14-16)
   - Generate opening statement outlines
   - Create witness prep sheets
   - Cross-examination question lists

4. **Analytics Dashboard** (Months 17-18)
   - Case strength scoring
   - Missing evidence gap analysis
   - Witness credibility scoring
   - Fact coverage metrics

**Launch Criteria:**
- ✅ Phase 2 metrics achieved
- ✅ Phase 3 features tested with trial lawyers
- ✅ Integration with existing features stable
- ✅ Ready for Enterprise tier upsell

---

## 9. Assumptions & Dependencies

### 9.1 Assumptions

**User Assumptions:**
1. Lawyers will have interview transcripts in digital format (PDF/DOCX/TXT)
2. Lawyers are willing to spend 30-60 minutes reviewing AI-extracted facts
3. Lawyers understand the concept of hearsay (or can learn from our UI)
4. Lawyers value time savings enough to pay premium pricing
5. Lawyers trust AI-assisted tools if they can verify and correct results
6. Lawyers conduct 5-10 witness interviews per case on average

**Technical Assumptions:**
1. Google File Search API will remain available and stable
2. Gemini API accuracy will be ≥85% with proper prompt engineering
3. Firebase infrastructure can scale to support 1,000+ concurrent users
4. Internet connectivity is reliable for cloud-based processing
5. Interview transcripts are generally well-formatted (not handwritten)
6. OCR technology can achieve >95% accuracy on scanned PDFs

**Business Assumptions:**
1. Canadian litigation market is large enough to support growth targets
2. Professional tier pricing ($120-150/GB) is acceptable to target market
3. Facts Feature will differentiate ListBot.ca from competitors
4. First-mover advantage will last 6-12 months before competitors catch up
5. Integration with Pleadings feature will drive bundle value
6. Users will upgrade from Basic to Professional tier for Facts Feature

**Legal/Compliance Assumptions:**
1. Google File Search meets data privacy requirements for legal work
2. Attorney-client privilege is maintained with cloud storage
3. SOC 2 compliance is sufficient for law firm requirements
4. Audit trail meets professional responsibility standards
5. No jurisdiction-specific regulations block AI fact extraction

### 9.2 Dependencies

**External Dependencies:**

| Dependency | Owner | Risk | Mitigation |
|------------|-------|------|------------|
| **Google File Search API** | Google Cloud | High | Monitor API updates; have fallback to OpenAI or Pinecone |
| **Gemini API** | Google Cloud | Medium | Test extensively pre-launch; have manual fact entry as fallback |
| **Firebase Services** | Google Cloud | Low | Firebase is mature and stable; standard for ListBot.ca |
| **PDF OCR Service** | Google Cloud Vision | Medium | Test with diverse PDFs; have manual text correction option |

**Internal Dependencies:**

| Dependency | Owner | Risk | Mitigation |
|------------|-------|------|------------|
| **Pleadings Feature Complete** | Engineering Team | Low | Pleadings MVP already launched |
| **User Management System** | Engineering Team | Low | Already exists in platform |
| **Case Management System** | Engineering Team | Low | Already exists in platform |
| **Design System & Components** | Design Team | Low | Existing Vue 3 component library |
| **Beta User Recruitment** | Product Team | Medium | Start outreach 6 weeks before beta launch |

**Data Dependencies:**

| Dependency | Owner | Risk | Mitigation |
|------------|-------|------|------------|
| **Test Interview Transcripts** | Product Team | Medium | Collect 50+ diverse samples from beta partners |
| **AI Accuracy Benchmark** | Product Team | Medium | Manual review by experienced litigation lawyers |
| **User Personas Validated** | Product Team | Low | Conducted interviews with 13 users |

---

## 10. Constraints & Risks

### 10.1 Constraints

**Budget Constraints:**
- Development budget: $67,000 (2 devs × 3 months)
- API costs must stay <$0.50/user/month
- No additional headcount approved (must use existing team)
- Marketing budget: $10,000 for launch campaign

**Timeline Constraints:**
- MVP must launch by end of Q1 2026 (February 28)
- Beta testing must start by Month 3 (January 31)
- Cannot delay Pleadings feature development
- Team has other ongoing maintenance commitments

**Technical Constraints:**
- Must use existing tech stack (Vue 3, Firebase, Google Cloud)
- Must integrate with existing authentication and case management
- Must maintain backward compatibility with Pleadings feature
- Mobile app not in scope (web only for MVP)

**Resource Constraints:**
- 2 full-stack developers (Vue 3 + Firebase expertise)
- 1 product manager (20% time)
- 1 UX designer (20% time)
- No dedicated QA engineer (devs handle testing)
- Limited legal expert access for validation

**Regulatory Constraints:**
- Must comply with SOC 2 Type II
- Must maintain attorney-client privilege
- Must meet professional responsibility standards
- Must comply with Canadian data privacy laws
- Cannot train AI models on customer data

### 10.2 Risks

| Risk | Likelihood | Impact | Mitigation Strategy | Owner |
|------|------------|--------|---------------------|-------|
| **AI accuracy <85%** | Medium (30%) | High | Extensive prompt engineering; 50+ test interviews; confidence scores; easy corrections; manual entry fallback | Engineering Lead |
| **Users don't trust AI** | Medium (40%) | High | Transparency (confidence scores); citations; user control (edit/delete); social proof (testimonials); gradual adoption | Product Manager |
| **Low adoption (<50%)** | Medium (35%) | High | Beta program; excellent onboarding; clear value demo; user interviews; iterate based on feedback | Product Manager |
| **Google File Search API changes** | Low (15%) | High | Monitor API updates; fallback plan (OpenAI, Pinecone); data portability; maintain migration scripts | Engineering Lead |
| **Hearsay detection accuracy <70%** | Medium (35%) | Medium | Clear prompting; user override; training examples; iterative improvement | Engineering Lead |
| **API costs exceed budget** | Low (10%) | Medium | Monitor usage; aggressive caching; rate limiting; batch processing | Engineering Lead |
| **Competitor copies feature** | High (70%) | Medium | Fast to market; continuous improvement; data moat; integration moat (Pleadings + Facts) | Product Manager |
| **Beta partners unavailable** | Medium (25%) | Medium | Start recruitment early (6 weeks before); offer incentives; leverage existing customer base | Product Manager |
| **Timeline slips >1 month** | Medium (30%) | Medium | Reduce scope if needed; prioritize ruthlessly; daily standups; weekly reviews | Engineering Lead |
| **Data privacy concerns** | Low (15%) | High | Legal review of Google TOS; SOC 2 audit; clear privacy policy; enterprise DPA if needed | Product Manager |

### 10.3 Risk Response Plans

**Critical Risk: AI Accuracy Below 85%**

**Response Plan:**
- **Week 1-2:** Test Gemini API with 20+ sample interviews from diverse cases
- **Week 3-4:** Iterate on prompts to improve accuracy; target 80%+ before MVP development
- **Month 1:** Continue testing with new samples during development
- **Month 3:** Final validation with 50+ test set before beta launch
- **Contingency:** If accuracy 80-85%, launch with "AI-assisted" messaging (not "automated")
- **Contingency:** If accuracy <80%, delay MVP and improve prompts OR reduce scope

**Critical Risk: Low User Adoption**

**Response Plan:**
- **Pre-launch:** Recruit 10-15 enthusiastic beta users who commit to testing
- **Week 1-2:** Daily check-ins with beta users; rapid iteration on feedback
- **Month 1-3:** Weekly user interviews; identify friction points; improve onboarding
- **Month 4-6:** If adoption <50%, conduct deep-dive research on "why not"
- **Contingency:** Pivot messaging; simplify UI; add requested features; offer 1-on-1 training

---

## 11. Out of Scope

The following features are **explicitly excluded** from the MVP (Phase 1) and deferred to future phases:

### 11.1 Deferred to Phase 2 (Months 4-9)

- ❌ **Fact-to-Document Linking:** Connecting facts to supporting evidence documents
- ❌ **Fact-to-Pleading Linking:** Connecting interview facts to pleading allegations
- ❌ **Contradiction Detection:** AI identifying conflicting facts between witnesses
- ❌ **Advanced Search:** Boolean queries, proximity search, date range filters beyond basic filtering
- ❌ **Fact Collections:** User-created collections of facts for specific purposes (e.g., "Opening Statement Facts")
- ❌ **Scheduled Exports:** Automated, recurring exports via email

### 11.2 Deferred to Phase 3 (Months 10-18)

- ❌ **Timeline Visualization:** Interactive timeline showing facts chronologically
- ❌ **Fact Strength Indicators:** Weak/Medium/Strong ratings based on corroboration
- ❌ **Trial Prep Automation:** Opening statement outlines, witness prep sheets, cross-examination questions
- ❌ **Analytics Dashboard:** Case strength scoring, evidence gap analysis, witness credibility metrics
- ❌ **Mobile App:** Native iOS/Android apps (web only for MVP)
- ❌ **Real-time Collaboration:** Multiple users editing facts simultaneously

### 11.3 Not Planned (Out of Scope Indefinitely)

- ❌ **Real-time Interview Transcription:** Live fact extraction during interviews (too complex; market unclear)
- ❌ **Video Interview Processing:** Extracting facts from video depositions (requires different tech stack)
- ❌ **Multilingual Support:** Languages other than English (Canadian market is English/French but start with English)
- ❌ **AI-Generated Legal Briefs:** Automatically writing legal arguments (too risky; liability concerns)
- ❌ **Expert Witness Matching:** Connecting facts to potential expert witnesses (different product)
- ❌ **Predictive Case Outcomes:** AI predicting trial outcomes based on facts (too speculative; ethical concerns)
- ❌ **Integration with Court E-Filing Systems:** Direct filing from ListBot.ca (regulatory complexity)
- ❌ **Blockchain-based Evidence Chain of Custody:** Immutable fact records on blockchain (unnecessary complexity)

### 11.4 Why These Are Out of Scope

**Phase 2 Deferrals:**
- Require MVP validation first (ensure core features work before adding complexity)
- Depend on user feedback to prioritize correctly
- Need more development time than available in 3-month MVP window

**Phase 3 Deferrals:**
- Require Phase 2 features as foundation
- More sophisticated AI/ML capabilities (beyond Gemini API prompts)
- Need larger user base for testing and validation

**Indefinite Deferrals:**
- Outside core value proposition (witness interview fact extraction)
- Too high technical/legal/regulatory complexity
- Unclear market demand or ROI
- Liability concerns for AI-generated legal work
- Require fundamentally different technology stack

---

## 12. Approval & Sign-off

### 12.1 Stakeholder Review

**Product Review:**
- [ ] Product vision and goals approved
- [ ] Target users and personas validated
- [ ] MVP scope defined and prioritized
- [ ] Success metrics agreed upon
- [ ] Timeline realistic and achievable

**Technical Review:**
- [ ] Technical feasibility confirmed
- [ ] Google File Search API integration validated
- [ ] Gemini API accuracy achievable (≥85%)
- [ ] Performance targets realistic
- [ ] Security and compliance requirements met

**Business Review:**
- [ ] Financial projections approved (ROI >250%)
- [ ] Pricing strategy validated ($120-150/GB Professional tier)
- [ ] Go-to-market plan approved
- [ ] Resource allocation confirmed (2 devs, 3 months)

**Legal/Compliance Review:**
- [ ] Data privacy requirements met
- [ ] Attorney-client privilege maintained
- [ ] Professional responsibility standards addressed
- [ ] SOC 2 compliance pathway clear

### 12.2 Final Approvals

**Approved by:**

- [ ] **Product Manager:** __________________ Date: __________
- [ ] **Engineering Lead:** __________________ Date: __________
- [ ] **UX Design Lead:** __________________ Date: __________
- [ ] **Executive Sponsor:** __________________ Date: __________

### 12.3 Next Steps

**Upon Approval:**
1. ✅ Schedule kickoff meeting with development team
2. ✅ Begin AI validation testing (20+ sample interviews)
3. ✅ Start beta partner recruitment (target: 10-15 firms)
4. ✅ Set up project tracking (Jira/Linear epics and stories)
5. ✅ Begin UI/UX design work (Figma mockups)
6. ✅ Review Google File Search API documentation
7. ✅ Schedule weekly demos with stakeholders

**Development Start Date:** December 1, 2025 (upon approval)

**First Beta Release:** January 31, 2026 (Month 3)

**Public Launch:** February 28, 2026 (Month 4)

---

## Appendix A: Glossary

**Atomic Fact:** A single, indivisible factual assertion that cannot be broken down further. Example: "Contract signed January 15, 2023" (not "Contract signed January 15, 2023 and payment terms were net 30 days").

**Confidence Score:** AI's certainty (0-100%) that a statement is a fact rather than opinion or legal conclusion.

**Hearsay:** Legal concept where the source of information (who told the lawyer) differs from the witness (who has direct knowledge). Example: "Client said accountant told him payment was late" = hearsay.

**RAG (Retrieval-Augmented Generation):** AI technique that combines semantic search with generative AI to find and rank relevant information.

**Semantic Search:** Finding information by meaning rather than exact keyword matching. Example: searching "contract signing" finds "parties entered into agreement."

**Source:** The person who provided information to the lawyer during the interview.

**Witness:** The person who has direct knowledge of a fact (may be the same as source, or different for hearsay).

---

## Appendix B: Technical Architecture

**High-Level System Architecture:**

```
User Browser (Vue 3)
    ↓
Firebase Hosting
    ↓
Firebase Functions (Node.js)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │
Firebase Storage  Gemini API       Google File Search
(Uploads)         (Fact Extract)   (Semantic Search)
│                 │                 │
└─────────────────┴─────────────────┘
                  ↓
            Firestore
         (Facts Database)
```

**Data Flow:**
1. User uploads interview → Firebase Storage
2. Firebase Function extracts text → Gemini API
3. Gemini returns facts (JSON) → Firestore
4. Firebase Function uploads to File Search Store (RAG indexing)
5. User searches → File Search returns relevant facts
6. User views/edits → Firestore updates

---

## Appendix C: User Story Summary

**Total Stories: 38**

**Epic 1 (Interview Upload):** 4 stories  
**Epic 2 (AI Fact Extraction):** 7 stories  
**Epic 3 (Hearsay Tracking):** 5 stories  
**Epic 4 (Fact List View):** 8 stories  
**Epic 5 (Semantic Search):** 8 stories  
**Epic 6 (Verification & Audit):** 7 stories  
**Epic 7 (Fact Export):** 6 stories

**Priority Breakdown:**
- Critical/High Priority: 28 stories (74%)
- Medium Priority: 7 stories (18%)
- Low Priority: 3 stories (8%)

**Estimated Timeline:**
- Epic 1: 1-2 weeks
- Epic 2: 3-4 weeks
- Epic 3: 2 weeks
- Epic 4: 2-3 weeks
- Epic 5: 2-3 weeks
- Epic 6: 1-2 weeks
- Epic 7: 1-2 weeks

**Total: 12-18 weeks (3-4.5 months)**  
**Target MVP: 3 months with focused scope**

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

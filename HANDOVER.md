# Handover: Email Threading PRD - Process Stage Revision

## Objective
Draft a revised **Process-stage-only** Email Threading PRD that removes Review/Production stage features and incorporates the best technical suggestions from the Opus review.

## Context: EDRM Boundary Problem
The original PRD conflates **Process stage** (automated thread construction, metadata extraction) with **Review stage** (human decision-making, reviewing threads, tagging). This violates EDRM architecture where Process should prepare data and Review should consume it.

## Critical Files (Read Priority Order)

1. **`planning/1. PRDs/Email-Threading-PRD.md`** - Original PRD to revise
   - Lines 1214-1345: User Stories (US-ET-1 through US-ET-7)
   - Lines 259-276: Workflow section (needs editing)
   - Lines 664-861: EmailThreadBuilder.vue (keep - Process stage)
   - Lines 863-1046: EmailThreadTable.vue (remove - Review stage)
   - Lines 1048-1210: EmailThreadViewer.vue (remove - Review stage)

2. **`planning/1. PRDs/Email-Threading-PRD-Review.md`** - Opus technical review
   - 23 suggestions categorized by priority
   - Lines 25-136: CRITICAL-1 through CRITICAL-3
   - Lines 340-537: CRITICAL-4 through HIGH-7
   - Lines 611-698: HIGH-9 (REJECT - Review stage tagging)
   - Lines 702-866: UX suggestions (mostly Review stage)

3. **`Research/2025-11-21-Process-EDRM-Features.md`** - Process stage definition
   - Defines what belongs in Process vs Review

## Files That Look Relevant But Aren't
None - all files reviewed are relevant for context.

## Analysis Already Completed

### User Stories to REMOVE (Review/Production Stage)
- **US-ET-2**: Review Email Thread → Review PRD
- **US-ET-3**: Review Most Inclusive Only → Review PRD
- **US-ET-4**: View Thread Timeline → Review PRD
- **US-ET-6**: Apply Tags to Entire Thread → Review PRD (tagging = decision)
- **US-ET-7**: Export Thread → Production PRD

### User Stories to KEEP (Process Stage)
- **US-ET-1**: Build Email Threads (modify workflow to remove "user reviews" steps)
- **US-ET-5**: Handle Broken Threads (data quality belongs in Process)

### UI Components Status
- **Keep**: EmailThreadBuilder.vue (`src/features/process/`) - triggers threading, shows progress
- **Remove**: EmailThreadTable.vue (`src/features/organizer/`) - Review stage UI
- **Remove**: EmailThreadViewer.vue (`src/features/organizer/`) - Review stage UI

### Opus Suggestions: ACCEPT (17 Process-Stage Improvements)

**CRITICAL (Must Fix)**:
1. **CRITICAL-1** (lines 27-68): Add MSG file support using `@pernodbuilders/msg-reader`
2. **CRITICAL-3** (lines 95-134): Move Web Worker to Phase 1 (not "future enhancement")
3. **CRITICAL-4** (lines 342-423): Enhanced JWZ-inspired threading algorithm using References header
4. **CRITICAL-5** (lines 425-480): Multi-factor scoring for most inclusive (not just chronology)
5. **CRITICAL-6** (lines 611-632): Include matterId in thread ID generation (prevent cross-matter leakage)
6. **CRITICAL-7** (lines 980-1002): Address PII exposure in participant lists

**HIGH (Should Fix)**:
7. **HIGH-1** (lines 138-193): Complete international subject normalization (German, Swedish, Turkish, etc.)
8. **HIGH-2** (lines 197-237): Use crypto.subtle.digest() instead of simple hash
9. **HIGH-3** (lines 240-260): Add BCC field handling
10. **HIGH-4** (lines 262-289): Parse References header as space-separated string
11. **HIGH-5** (lines 484-536): Subject-based fallback threading for missing headers
12. **HIGH-6** (lines 540-567): Specify re-threading/incremental threading behavior
13. **HIGH-7** (lines 569-592): Consistent UTC timezone handling
14. **HIGH-8** (lines 635-663): Add Firestore security rules
15. **HIGH-12** (lines 1006-1031): Rate limiting (max 5000 emails/batch, concurrent limits)

**MEDIUM**:
16. **MEDIUM-1** (lines 292-308): Track attachments at thread level
17. **MEDIUM-2** (lines 310-337): Explicit file type detection for isEmail
18. **MEDIUM-3** (lines 595-607): Handle conversation splits (subject changes)
19. **MEDIUM-8** (lines 872-888): Standardize time savings claims to "40-80%"
20. **MEDIUM-9** (lines 890-911): Add glossary of terms
21. **MEDIUM-10** (lines 913-935): Algorithm versioning strategy
22. **MEDIUM-11** (lines 1033-1063): Caching strategy for parsed headers

### Opus Suggestions: REJECT/MODIFY (6 Review-Stage Features)

**REJECT** - Move to separate Review PRD:
- **HIGH-9** (lines 665-698): Category system integration (Review-stage tagging)
- **MEDIUM-4** (lines 702-730): Export format specs (Production stage)
- **MEDIUM-5** (lines 733-755): Document viewer integration (Review stage)

**MODIFY** - Split between PRDs:
- **HIGH-10** (lines 760-778): Keyboard shortcuts (all are Review navigation, none for Process)
- **MEDIUM-6** (lines 815-838): Mobile responsiveness (mostly Review UI)
- **MEDIUM-7** (lines 842-866): Accessibility (mostly Review UI)

## Changes Required for Revised PRD

### 1. Executive Summary
- Update "Expected Impact" from "40-74% review time reduction" to clarify this is **downstream** Review efficiency
- Add EDRM clarification: "This PRD defines Process stage only. Review stage consumption is separate."

### 2. Solution Overview (lines 78-113)
- Remove: "Displays threaded emails in collapsible tree structure"
- Remove: "Enables reviewing entire thread with single decision"
- Remove: "Provides 'most inclusive only' filter for maximum efficiency"
- Keep focus on: Building threads, extracting metadata, storing structure

### 3. Processing Workflow (lines 257-300)
- Remove step 5: "ProcessTable displays threads"
- Remove step 6: "User reviews threads"
- End workflow at: "Updates Firestore with thread metadata"
- Add: "Thread metadata is now available for Review stage consumption"

### 4. User Stories Section
- Remove US-ET-2, 3, 4, 6, 7 entirely
- Keep US-ET-1 and US-ET-5
- Modify US-ET-1 workflow to remove review steps

### 5. UI Components Section
- Remove EmailThreadTable.vue section (lines 863-1046)
- Remove EmailThreadViewer.vue section (lines 1048-1210)
- Keep EmailThreadBuilder.vue (lines 664-861) with modifications:
  - Add Web Worker implementation from CRITICAL-3
  - Add error states
  - Add cancellation support
  - Update "View Email Threads" button to note that Review UI is in Organizer feature

### 6. Implementation Details
- **emailHeaderService.js**: Add MSG support (CRITICAL-1), BCC handling (HIGH-3), References parsing (HIGH-4)
- **emailThreadingService.js**:
  - Implement JWZ-inspired algorithm (CRITICAL-4)
  - Better most inclusive logic (CRITICAL-5)
  - Include matterId in thread ID (CRITICAL-6)
  - International subject normalization (HIGH-1)
  - Better hash function (HIGH-2)
  - Subject-based fallback (HIGH-5)
  - Timezone handling (HIGH-7)
- Add new **emailThreadWorker.js** for Web Worker (CRITICAL-3)
- Add rate limiting logic (HIGH-12)
- Add caching strategy (MEDIUM-11)

### 7. Data Model
- Add BCC field (HIGH-3)
- Add attachment fields (MEDIUM-1)
- Add conversation split tracking (MEDIUM-3)
- Add algorithm versioning (MEDIUM-10)
- Add PII considerations note (CRITICAL-7)
- Add Firestore security rules (HIGH-8)

### 8. Success Metrics
**Change focus from Review outcomes to Process outputs**:
- ✅ Threading completion rate (% of emails successfully threaded)
- ✅ Processing speed (emails/minute)
- ✅ Algorithm accuracy (% correct groupings)
- ✅ Most inclusive accuracy (% correct identification)
- ❌ Remove "Review time reduction" (that's Review stage metric)
- ❌ Remove "User satisfaction" (measured in Review stage)
- Add: "Downstream Review efficiency measured separately in Review PRD"

### 9. Technical Dependencies
- Add `@pernodbuilders/msg-reader` (CRITICAL-1)
- Add Web Worker API to required dependencies (CRITICAL-3)

### 10. New Sections to Add
- **Glossary** (MEDIUM-9): Define Thread, Most Inclusive, Root Message, Orphan, etc.
- **Algorithm Versioning** (MEDIUM-10): Version tracking strategy
- **Re-Threading Strategy** (HIGH-6): Incremental threading, rebuild behavior
- **EDRM Boundaries**: Explicit section clarifying what's Process vs Review

### 11. Phase Timeline Updates
- Move Web Worker from Phase 5 to Phase 1 (CRITICAL-3)
- Adjust effort estimates for new algorithm complexity
- Add MSG support to Phase 1
- Note that Review UI (Table/Viewer) is deferred to separate Review PRD

## Approaches Already Tried
None - this is greenfield drafting based on completed analysis.

## Output File
Create: **`planning/1. PRDs/Email-Threading-Process-PRD.md`**

Retain original structure (Executive Summary, Table of Contents, etc.) but with all modifications above applied. Target length: ~1200-1500 lines (vs original 1797 lines, removing ~400 lines of Review UI + user stories, adding ~200 lines of new technical details from Opus suggestions).

## Branch
**Current**: `claude/review-email-threading-prd-015n24BqF3o59k7JZ9wV22BJ`
**New session should create**: New branch per standard naming (claude/[task]-[session-id])

## Key Insight to Preserve
**The component architecture is correct** (EmailThreadBuilder in `/process/`, Table/Viewer in `/organizer/`), but the **PRD user stories violate the architecture** by mixing Process and Review concerns. The revision fixes the PRD to match the intended architecture.

## Next Steps
1. Create new branch
2. Draft `Email-Threading-Process-PRD.md` with all changes above
3. Commit with message: "PROCESS: Create Process-stage-only Email Threading PRD incorporating Opus technical improvements"
4. Push to new branch

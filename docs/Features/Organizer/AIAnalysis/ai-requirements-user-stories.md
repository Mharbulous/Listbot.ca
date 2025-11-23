# AI Metadata Extraction - User Stories

**Related Documentation**:
- `ai-requirements-functional.md` - Functional requirements
- `ai-requirements-ui-mockups.md` - UI mockups for these stories
- `ai-requirements-overview.md` - User personas

## User Stories

### Epic 1: Manual Analysis Trigger

#### US-1.1: Load Existing Results on Tab Open
**As a** document reviewer
**I want** the AI tab to load existing analysis results from Firestore when I open it
**So that** I can quickly see previously analyzed metadata without re-analysis

**Acceptance Criteria:**
- Given I open a document's metadata panel
- When I click on the "🤖 AI" tab
- Then the system loads existing DocumentDate and DocumentType tags from Firestore
- And if tags exist, they display immediately with confidence badges
- And if tags don't exist, I see an "Analyze Document" button

#### US-1.2: Manual Analysis Trigger
**As a** document reviewer
**I want** to manually trigger AI analysis via a button
**So that** I have control over when analysis happens and API costs are predictable

**Acceptance Criteria:**
- Given I open the AI tab and no analysis results exist
- When I see the "Analyze Document" button
- And I click the button
- Then AI analysis begins for both DocumentDate and DocumentType
- And I see a loading indicator showing "Analyzing..."
- And results are stored in Firestore after completion

### Epic 2: Document Date Extraction

#### US-2.1: Extract Document Date with High Confidence
**As a** document reviewer
**I want** the system to extract the document date from the content
**So that** I can quickly see when the document was created without reading it

**Acceptance Criteria:**
- Given a document with a clear date (e.g., letterhead date, signature date)
- When AI analysis completes
- Then Document Date field shows the extracted date (e.g., "March 15, 2024")
- And confidence badge shows percentage ≥95% (e.g., "97%") in green color
- And the tag is stored with `autoApproved: true`

#### US-2.2: Flag Low-Confidence Date for Review
**As a** document reviewer
**I want** to be notified when date extraction has low confidence
**So that** I can review it in the dedicated Review tab

**Acceptance Criteria:**
- Given a document with multiple dates or unclear date
- When AI analysis completes with confidence <95%
- Then Document Date field shows the primary suggestion (e.g., "March 15, 2024")
- And a yellow warning icon (⚠️) indicates review needed
- And the tag is stored with `reviewRequired: true`
- And Review tab badge count increases (e.g., "👤Review (1)")
- And AI tab shows prompt: "Some AI suggestions need your review. [Go to Review tab →]"

#### US-2.3: Handle Documents with No Clear Date
**As a** document reviewer
**I want** clear indication when no date can be extracted
**So that** I know I need to manually research or enter the date

**Acceptance Criteria:**
- Given a document with no discernible date
- When AI analysis completes
- Then Document Date field shows "No date found (AI confidence: 0%)"
- And a manual entry field is prominently displayed
- And the field is marked for required manual review

### Epic 3: Document Type Classification

#### US-3.1: Classify Document Type with High Confidence
**As a** document reviewer
**I want** the system to classify the document type automatically
**So that** documents are consistently categorized

**Acceptance Criteria:**
- Given a clearly formatted document (e.g., email with headers, invoice with line items)
- When AI analysis completes
- Then Document Type field shows the classification (e.g., "Invoice")
- And confidence badge shows percentage ≥95% (e.g., "98%") in green color
- And the tag is stored with `autoApproved: true`

#### US-3.2: Flag Low-Confidence Type for Review
**As a** document reviewer
**I want** to be notified when type classification has low confidence
**So that** I can review it in the dedicated Review tab

**Acceptance Criteria:**
- Given a document with characteristics of multiple types
- When AI analysis completes with confidence <95%
- Then Document Type field shows primary classification (e.g., "Memo")
- And a yellow warning icon (⚠️) indicates review needed
- And the tag is stored with `reviewRequired: true`
- And Review tab badge count increases (e.g., "👤Review (2)")
- And AI tab shows prompt: "Some AI suggestions need your review. [Go to Review tab →]"

#### US-3.3: Suggest New Document Types
**As a** document reviewer
**I want** AI to suggest new document types not in the predefined list
**So that** I can handle unusual or specialized documents

**Acceptance Criteria:**
- Given a document that doesn't fit predefined types (Email, Memo, Letter, Contract, Invoice, Report)
- When AI analysis completes
- Then Document Type field shows a suggested new type (e.g., "Affidavit")
- And confidence score is displayed
- And I can accept, reject, or modify the suggested type
- When I accept the new type
- Then it's added to the DocumentType category's tag options (Open List behavior)

### Epic 4: Tab Navigation and Badge Awareness

#### US-4.1: Review Tab Badge Count
**As a** document reviewer
**I want** to see a badge count on the Review tab
**So that** I know how many items need my attention without switching tabs

**Acceptance Criteria:**
- Given AI has extracted metadata with confidence <95%
- When I'm viewing any tab in the metadata panel
- Then the Review tab header shows badge count: "👤Review (2)"
- And the badge updates in real-time as I review items
- And the badge disappears when all items are reviewed

#### US-4.2: Navigate from AI Tab to Review Tab
**As a** document reviewer
**I want** to easily navigate from the AI tab to the Review tab
**So that** I can quickly review low-confidence suggestions

**Acceptance Criteria:**
- Given the AI tab shows items needing review
- When I see the prompt "Some AI suggestions need your review"
- And I click "[Go to Review tab →]"
- Then the metadata panel switches to the Review tab
- And I see the Review Queue with items needing attention

### Epic 5: Review Tab Workflow

#### US-5.1: View Review Queue
**As a** document reviewer
**I want** to see all items requiring review in one place
**So that** I can efficiently process low-confidence suggestions

**Acceptance Criteria:**
- Given I open the Review tab
- When there are items with `reviewRequired: true`
- Then I see a "Review Queue" section at the top
- And each item shows:
  - Field name and confidence %
  - AI suggestion with confidence score
  - Up to 2 alternatives with confidence scores
  - Context excerpt showing where info was found
  - Action buttons: [✓ Approve] [✗ Reject] [✎ Custom Entry]

#### US-5.2: View Extraction Context in Review
**As a** document reviewer
**I want** to see where in the document the AI found the information
**So that** I can verify accuracy before approving

**Acceptance Criteria:**
- Given an item in the Review Queue
- Then I see the `AIanalysis.contentMatch` field displayed
- Which shows the excerpt from the document (e.g., "Date: March 15, 2024 [from page 1, top right]")
- And this helps me understand why AI made its suggestion
- And I can make an informed decision to approve/reject/override

#### US-5.3: Approve AI Suggestion in Review Tab
**As a** document reviewer
**I want** to quickly approve correct AI suggestions
**So that** I can efficiently process items that look correct despite low confidence

**Acceptance Criteria:**
- Given an item in the Review Queue
- When I click the [✓ Approve] button
- Then the tag document is updated with `humanApproved: true`, `reviewedAt`, `reviewedBy`
- And the item moves from Review Queue to Approved Items section
- And the warning icon in AI tab changes to a checkmark
- And the Review tab badge count decreases by 1

#### US-5.4: Select Alternative Suggestion in Review Tab
**As a** document reviewer
**I want** to select from alternative suggestions
**So that** I can quickly correct minor errors without typing

**Acceptance Criteria:**
- Given an item in Review Queue with alternatives
- When I click on an alternative (e.g., "Alternative 1: March 1, 2024 (45%)")
- Then the `tagName` field updates to the selected alternative
- And the tag is marked with `humanApproved: true`, `reviewedAt`, `reviewedBy`
- And the item moves to Approved Items section
- And the AI tab shows the updated value
- And the Review tab badge count decreases by 1

#### US-5.5: Custom Entry in Review Tab
**As a** document reviewer
**I want** to manually enter or correct extracted values
**So that** I can fix incorrect AI extractions

**Acceptance Criteria:**
- Given an item in the Review Queue
- When I click [✎ Custom Entry] button
- Then an input field appears with the current value pre-filled
- When I enter a new value and save
- Then the tag document updates with my value
- And `source` changes to 'human'
- And `confidence` is set to 1.0 (100%)
- And `humanApproved` is set to true
- And the item moves to Approved Items section
- And the Review tab badge count decreases by 1

#### US-5.6: Reject Suggestion and Enter Custom Value
**As a** document reviewer
**I want** to reject an AI suggestion and provide my own value
**So that** I can correct completely wrong extractions

**Acceptance Criteria:**
- Given an item in the Review Queue
- When I click [✗ Reject] button
- Then the custom entry field immediately appears
- And I'm prompted to enter the correct value
- And I cannot dismiss without entering a value
- When I enter and save the correct value
- Then it's handled same as Custom Entry (source: 'human', confidence: 1.0)

#### US-5.7: View Approved Items
**As a** document reviewer
**I want** to see which items have been auto-approved or human-approved
**So that** I can review the complete picture of document metadata

**Acceptance Criteria:**
- Given I'm in the Review tab
- Then I see an "Approved Items" section below the Review Queue
- Which shows two subsections:
  - **Auto-Approved** (confidence ≥95%): collapsed by default, shows count
  - **Human-Approved**: shows full details with reviewer and timestamp
- And I can expand auto-approved to see details
- And I can re-open any item for re-review if needed

#### US-5.8: View Review History
**As a** document reviewer
**I want** to see a timeline of review actions
**So that** I can audit what changes were made

**Acceptance Criteria:**
- Given I'm in the Review tab
- Then I see a "Review History" section at the bottom
- Which shows a chronological timeline of actions:
  - Timestamp
  - Reviewer name
  - Action taken (Approved AI / Selected Alternative / Custom Entry)
  - Old value → New value
- And this provides an audit trail for quality control

### Epic 6: Error Handling and Edge Cases

#### US-6.1: Handle Analysis Failures Gracefully
**As a** document reviewer
**I want** clear error messages and recovery options when AI analysis fails
**So that** I can proceed with manual entry

**Acceptance Criteria:**
- Given AI analysis fails (network error, API error, timeout)
- When the failure occurs
- Then the AI tab shows "Analysis failed" with error reason
- And a "Retry" button is displayed
- And manual entry fields remain accessible
- And existing metadata (if any) is preserved

#### US-6.2: Handle Unsupported File Types
**As a** document reviewer
**I want** clear messaging when my document type isn't supported for AI analysis
**So that** I understand why analysis isn't available

**Acceptance Criteria:**
- Given a file type not supported for AI content analysis
- When I open the AI tab
- Then a message displays "AI analysis not available for this file type"
- And manual entry fields are shown
- And I can still manually enter Document Date and Document Type

#### US-6.3: Handle Large Files
**As a** document reviewer
**I want** clear messaging when my file is too large for AI analysis
**So that** I understand the limitation and can proceed manually

**Acceptance Criteria:**
- Given a file larger than the AI size limit (default 20MB)
- When I open the AI tab
- Then a message displays "File too large for AI analysis (25MB > 20MB limit)"
- And manual entry fields are shown
- And existing metadata features remain functional

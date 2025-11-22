# ListBot - Technical Overview

**Version**: 1.0
**Date**: November 22, 2025
**Purpose**: Technical feature and architecture reference

---

## What ListBot Does

**ListBot** is a litigation document management platform that implements the complete **EDRM (Electronic Discovery Reference Model)** workflow for legal e-discovery. It helps law firms manage documents from initial collection through trial presentation, with AI-powered features for organizing, analyzing, and producing legal evidence.

**Core Capabilities**:
- Upload and organize litigation documents with automatic deduplication
- Tag and categorize documents using flexible category systems
- Extract and manage facts from pleadings and witness interviews using AI
- Search documents semantically (by meaning, not just keywords)
- Track document versions, relationships, and metadata
- Generate production sets with Bates numbering and privilege logs
- Present documents in trial settings

---

## Tech Stack

### Frontend
- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **UI Libraries**:
  - Vuetify 3 (complex components like dialogs, data tables)
  - Tailwind CSS (layouts and custom styling)
- **Build Tool**: Vite
- **State Management**: Pinia (modular stores)
- **Routing**: Vue Router 4 (hash-based routing for static hosting)
- **Testing**: Vitest (unit and component tests)

### Backend
- **Authentication**: Firebase Auth (multi-app SSO architecture)
- **Database**: Firestore (NoSQL, real-time sync)
- **Storage**: Firebase Storage (with hash-based deduplication)
- **Serverless Functions**: Firebase Cloud Functions
- **AI/ML**: Google Gemini API + File Search API
- **Hosting**: Firebase Hosting

### Key Libraries & Tools
- **File Hashing**: BLAKE3 (via web workers)
- **Virtual Scrolling**: TanStack Virtual (for large document tables)
- **Charts/Visualizations**: Chart.js, D3.js (planned)
- **PDF Processing**: PDF.js (viewer integration)
- **OCR**: Cloud Vision API (planned)

---

## Architecture Patterns

### Solo Firm Architecture
All data is scoped by `firmId`. For solo practitioners, `firmId === userId` automatically. This provides:
- Consistent data model across solo and multi-user scenarios
- Easy upgrade path from solo to multi-user firm
- Simple query patterns with built-in data isolation

**Data Structure**:
```
/firms/{firmId}/
  matters/{matterId}/
    documents/{fileHash}/
      metadata/
      tags/{tagId}/
    categories/{categoryId}/
    custodians/{custodianId}/
```

### Authentication State Machine
Explicit state management prevents Firebase Auth race conditions:

**States**: `uninitialized` → `initializing` → `authenticated` | `unauthenticated` | `error`

**Usage Pattern**:
```javascript
// Always check initialization BEFORE authentication
if (authStore.isInitialized) {
  if (authStore.isAuthenticated) {
    // Proceed with authenticated actions
  }
}
```

The auth store is decomposed into focused modules:
- `authStore.js` - Core state, getters, actions
- `authFirmSetup.js` - Firm management (Solo Firm logic)
- `authStateHandlers.js` - State machine transitions
- `index.js` - Backward-compatible exports

### Hash-Based Deduplication
BLAKE3 hash serves as the Firestore document ID, providing automatic database-level deduplication:

**Process**:
1. User selects files for upload
2. Web worker calculates BLAKE3 hash (non-blocking)
3. Hash used as document ID in Firestore
4. If document exists, no upload occurs (automatic deduplication)
5. If new, file uploaded to Storage at path: `firms/{firmId}/uploads/{hash}.{ext}`

**File States**:
- **Duplicate**: Same hash + metadata, no informational value → Not uploaded, metadata not copied
- **Copy**: Same hash but different meaningful metadata → Not uploaded to Storage, but metadata recorded in Firestore
- **Primary/Best**: File with most meaningful metadata → Uploaded to Storage

**Two-Phase Cleanup**:
1. Current batch: Files marked as "duplicate"
2. Hash verification: Confirmed duplicates transition to "redundant"
3. Next batch: Redundant files removed in Stage 1 pre-filter

### Hybrid Tag Storage
Tags stored in BOTH locations for different purposes:

**Subcollection** (`/documents/{fileHash}/tags/{tagId}`):
- Full tag metadata
- Tag history and audit trail
- Relationship data

**Embedded Map** (in document):
```javascript
{
  tagMap: {
    'category1-tag1': { tagId, categoryId, value, timestamp },
    'category2-tag2': { tagId, categoryId, value, timestamp }
  }
}
```

**Benefits**:
- Subcollection: Full query capabilities
- Embedded map: Fast table rendering (no subcollection joins)
- Atomic batch writes maintain consistency

**Enforcement**: `tagCategoryId` used as document ID prevents duplicate tags per category (one tag per category rule).

### Web Worker Processing
CPU-intensive tasks run in web workers to avoid blocking the UI:

**File Hash Worker** (`src/features/upload/workers/fileHashWorker.js`):
- Calculates BLAKE3 hashes for files
- Processes files sequentially to manage memory
- Posts progress updates to main thread
- Returns hash results for deduplication logic

**Communication Pattern**:
```javascript
// Main thread
const worker = new Worker('./fileHashWorker.js');
worker.postMessage({ files: fileArray });
worker.onmessage = (event) => {
  const { hash, progress } = event.data;
  updateUI(progress);
};

// Worker thread
self.onmessage = async (event) => {
  const { files } = event.data;
  for (const file of files) {
    const hash = await calculateHash(file);
    self.postMessage({ hash, progress: calculateProgress() });
  }
};
```

---

## File Lifecycle & Terminology

### Lifecycle Stages

1. **Original** - Real-world evidence (physical or digital)
2. **Source** - Digital file on user's device before upload
3. **Upload** - File stored in Firebase Storage `../uploads/` (hash-deduplicated)
4. **Batesed** - PDF-converted, Bates-stamped files in `../Batesed/`
5. **Page** - Single-page PDFs in `../Pages/` for near-duplicate analysis
6. **Redacted** - Redacted files in `../Redacted/` for production preparation
7. **Production** - Final approved documents in `../Production/`
8. **Storage** - General term for all files in Firebase Storage (Upload + Batesed + Page + Redacted + Production)
9. **Document** - General term for all versions (Original → Storage)

### Upload Workflow Terms

**Important**: Distinguish between Upload **lifecycle stage** (files at rest) and upload **workflow actions** (process of moving files).

**Workflow Actions**:
- **Queue** (verb): Stage Source files locally for processing
- **Upload queue** (noun): Collection of staged Source files
- **Upload process** (noun): Operation transferring queued files to Storage
- **Uploading** (verb): Actively performing transfer

**Lifecycle Stage**:
- **Upload file**: File stored in Firebase Storage `../uploads/` folder
- **Upload stage**: Lifecycle stage where files exist in Storage

**Usage Examples**:
```javascript
// Workflow (process)
const uploadQueue = [];
function addToQueue(files) { /* stage files */ }
function startUploadProcess() { /* transfer to Storage */ }
const isUploading = ref(false);

// Lifecycle (file at rest)
const uploadFile = doc.data(); // File at Upload stage in Storage
const uploadFilePath = 'firms/123/uploads/abc123.pdf';
const uploadFileHash = 'abc123...';
```

---

## Core Features (Implemented)

### 1. Matter Management
**What it does**: Organizes all documents, categories, and metadata by case/matter.

**Implementation**:
- Firestore collection: `/firms/{firmId}/matters/{matterId}`
- CRUD operations via Pinia store
- Active matter context stored in localStorage
- Route guards ensure matter context for document operations

### 2. File Upload & Processing

**Upload Interface** (`src/features/upload/FileUpload.vue`):
- Drag-and-drop interface with folder support
- Virtual scrolling table for large file lists (TanStack Virtual)
- Real-time progress tracking
- 3-phase time estimation with directory complexity analysis

**Upload Pipeline**:
1. **File Selection** - User drops files or selects folder
2. **Folder Analysis** - Single-pass path parsing, directory statistics
3. **Time Estimation** - 3-phase calculation based on file count and directory depth
4. **Queue Management** - Files staged locally with metadata extraction
5. **Two-Stage Deduplication**:
   - Stage 1: Pre-filter removes redundant files from previous batches
   - Stage 2: Hash processing with size-based filtering (unique sizes skip hashing)
6. **Upload Process** - Transfer to Firebase Storage with metadata to Firestore

**Key Files**:
- `src/features/upload/FileUpload.vue` - Main view
- `src/features/upload/components/` - 27+ UI components
- `src/features/upload/composables/` - 53+ logic composables
- `src/features/upload/workers/fileHashWorker.js` - BLAKE3 hashing
- `src/features/upload/utils/fileAnalysis.js` - Time estimation

**Composables Architecture**:
- Core queue: `useFileQueue.js`, `useQueueState.js`, `useQueueCore.js`
- Deduplication: `useQueueDeduplication.js`, `useSequentialVerification.js`
- Workers: `useWebWorker.js`, `useWorkerManager.js`, `useSequentialHashWorker.js`
- Upload: `useUploadOrchestrator.js`, `useUploadProcessor.js`, `useUploadState.js`
- Analysis: `useFolderOptions.js`, `useFolderAnalysis.js`, `useFolderProgress.js`

### 3. Document Table

**What it does**: Displays all documents in a matter with filtering, sorting, and search.

**Implementation**:
- Firestore query: `/firms/{firmId}/matters/{matterId}/documents`
- Virtual scrolling for performance with large document sets
- Real-time updates via Firestore listeners
- Tag data from embedded `tagMap` (fast rendering)
- Click-through to document viewer

**Features**:
- Multi-column sorting
- Text search across document names
- Filter by document type, date range, tags
- Bulk operations (tag multiple documents)
- Export to CSV/PDF

### 4. Category System

**What it does**: Flexible tagging system with four category types.

**Category Types**:
1. **Date** - Single date value (e.g., Document Date)
2. **Fixed List** - Predefined options (e.g., Privilege: Yes/No/Pending)
3. **Open List** - User-created tags (e.g., Issues, Custodians)
4. **Text Area** - Free-form text (e.g., Description, Notes)

**System Categories**: Pre-defined categories copied to each matter:
- Document Date
- Privilege
- Description
- (Additional system categories defined in category manager)

**Implementation**:
- Categories: `/firms/{firmId}/matters/{matterId}/categories/{categoryId}`
- Tags: `/firms/{firmId}/matters/{matterId}/documents/{fileHash}/tags/{tagId}`
- Hybrid storage: Tags in subcollection + embedded `tagMap`
- Atomic batch writes ensure consistency
- One tag per category enforced (composite key: `tagCategoryId`)

**Category Manager** (`src/features/organizer/views/CategoryManager.vue`):
- CRUD operations for categories
- Drag-and-drop reordering
- Category templates
- Wizards for creation/editing

### 5. Document Viewer

**What it does**: Display documents with metadata and tagging interface.

**Implementation**:
- Route: `/matters/:matterId/documents/view/:fileHash`
- PDF.js integration for PDF rendering
- Image viewer for photos/scans
- Text viewer for plain text documents
- Native file download for unsupported types

**Features**:
- Navigation between documents
- Tag application from viewer
- Metadata display (file size, dates, hash)
- Download original file
- Print support

### 6. AI Analysis (Partial Implementation)

**Current Capabilities**:
- Document date detection from content (Gemini API)
- Document type classification (Gemini API)
- Confidence scores for AI suggestions

**Implementation**:
- Firebase Cloud Functions call Gemini API
- Results cached in Firestore to avoid repeated API calls
- User can accept/reject AI suggestions
- Audit trail tracks AI suggestions vs. manual entries

---

## Planned Features (Roadmap)

### EDRM Stage 1: Identify (Planned)

**Custodian Manager**:
- Track individuals controlling relevant data
- Document data sources per custodian (email, cloud storage, devices)
- Link custodians to documents (many-to-many relationship)

**Early Case Assessment (ECA) Dashboard**:
- Real-time statistics: document counts, file types, date ranges
- Chart.js visualizations
- Volume analysis before full processing

**AI-Powered Identification**:
- Gemini API predicts document relevance based on patterns
- Risk flagging for potentially sensitive documents
- Entity extraction (people, dates, amounts)

**Firestore Structure**:
```javascript
/firms/{firmId}/matters/{matterId}/custodians/{custodianId}
  name: string
  email: string
  title: string
  department: string
  data_sources: array
  document_count: number

  /data_sources/{sourceId}
    source_type: string
    location: string
    status: string (Not Started | In Progress | Complete)
    collection_date: timestamp
```

### EDRM Stage 4: Process Enhancements

**Email Threading** (High Priority - 40-74% time savings):
- Parse email headers (Subject, In-Reply-To, References)
- Build thread relationships
- Identify inclusive emails (contain all prior messages)
- Tree visualization with Vue 3 component
- "Review one, tag all" workflow for threads

**Implementation**:
```javascript
// Cloud Function
exports.buildEmailThreads = functions.firestore
  .document('firms/{firmId}/matters/{matterId}/documents/{docId}')
  .onCreate(async (snap, context) => {
    const doc = snap.data();
    if (doc.type !== 'email') return;

    const headers = extractEmailHeaders(doc);
    const threadId = calculateThreadId(headers);

    await snap.ref.update({ threadId, headers });
    await updateThreadRelationships(threadId, snap.ref);
  });
```

**Exact Hash Deduplication**:
- MD5/SHA256 hashing in addition to BLAKE3
- Group exact duplicates in UI
- "Review one, tag all" functionality

**Processing Analytics Dashboard**:
- Before/after document counts
- Deduplication statistics by type
- Processing time metrics
- Volume reduction achieved

### EDRM Stage 5: Review Enhancements

**Gemini Document Summarization**:
- Automatic 2-3 sentence summaries
- Key passage highlighting
- Entity extraction (people, dates, amounts)
- Document type classification
- Results cached in Firestore

**Tag Suggestions**:
- AI suggests relevant tags based on document content
- Confidence scores (0-100%)
- User can accept/reject/modify
- Learning from user corrections over time

**Email Threading Visualization**:
- Tree view showing conversation structure
- Inclusive/non-inclusive designation
- Jump to any message in thread
- Review entire thread with single tag application

**Review Progress Dashboard**:
- Documents reviewed per hour by reviewer
- Tag distribution statistics
- Estimated completion date
- Quality control sampling results

**Team Collaboration**:
- Shared notes and annotations
- Document-level comment threads with @mentions
- Real-time review assignments
- Reviewer productivity metrics

### EDRM Stage 6: Analyze

**Timeline Visualization**:
- Chronological event display using vis.js Timeline
- Filter by custodian, type, tags
- Zoom/pan controls
- Link documents to timeline events
- PDF export via html2canvas

**Gemini Concept Clustering**:
- Generate embeddings via Gemini API
- K-means clustering with ml.js
- D3.js sunburst visualization
- AI-generated cluster labels
- Cost: ~$8-10 per 1,000 documents

**Implementation**:
```javascript
// Cloud Function
exports.clusterDocuments = functions.https.onCall(async (data, context) => {
  const { matterId, numClusters = 10 } = data;

  // Get documents
  const docs = await getDocuments(matterId);

  // Generate embeddings
  const embeddings = await Promise.all(
    docs.map(doc => callGeminiEmbedding(doc.text))
  );

  // Cluster
  const clusters = kmeans(embeddings, numClusters);

  // Generate labels
  const labels = await generateClusterLabels(clusters, docs);

  // Store results
  await storeClusters(matterId, clusters, labels);

  return { clusters, labels };
});
```

**Communication Network Analysis**:
- Cytoscape.js graph visualization
- Show who communicated with whom and when
- Frequency heatmaps
- PageRank algorithms to identify key players
- Time-based evolution of communication patterns

**Semantic Search (Natural Language)**:
- Gemini API converts plain English queries to structured searches
- Google File Search RAG for semantic matching
- Find documents by meaning, not just keywords
- Returns relevant documents with citations

**Sentiment Analysis**:
- Gemini API for positive/negative/neutral classification
- Flag emotionally charged or problematic language
- Trend visualization over time
- Risk identification

### EDRM Stage 7: Produce Enhancements

**Bates Numbering Automation**:
- Configurable Bates format (prefix, padding, suffix)
- Sequential numbering across production set
- Bates stamp overlay on PDFs
- Track Bates ranges in Firestore

**Format Conversion**:
- Native → Searchable PDF
- Image → PDF with OCR
- Email → PDF (formatted)
- Maintain original + create production copy

**Privilege Log Generation**:
- Auto-generate privilege log from privileged documents
- Standard format: Bates, Date, Author, Recipient, Description, Privilege Type
- Export to Word/PDF/CSV
- Template customization

**Redaction Workflow**:
- Mark redaction areas on documents
- Apply redactions to create production copy
- Redaction review and approval workflow
- Track redaction reasons (privilege, privacy, confidential)

### EDRM Stage 8: Present

**Trial Presentation Mode**:
- Full-screen document viewer for courtroom
- Quick navigation between exhibits
- Zoom/pan controls
- Annotation tools (highlight, draw)
- Multi-monitor support

**Exhibit Management**:
- Organize documents as trial exhibits
- Sequential exhibit numbering
- Link exhibits to timeline events or facts
- Print exhibit labels

**Deposition Integration**:
- Upload deposition transcripts
- Link transcript lines to documents
- Search transcripts
- Export transcript excerpts with document citations

### Pleadings Feature (High Priority)

**What it does**: Treats legal pleadings (Statement of Claim, Defence, Reply) as the organizing framework for the case, not just documents.

**AI Fact Extraction**:
- Gemini API parses pleadings
- Extracts individual factual assertions (not opinions, not legal conclusions)
- Returns fact text, source paragraph, confidence score (0-100%)
- User can edit/delete/add facts manually

**Semantic Deduplication**:
- AI identifies when same fact stated differently
- Example: "Contract signed Jan 1, 2023" = "Parties entered agreement 01/01/23"
- User reviews merge suggestions
- Preserves both source citations

**Version Control**:
- Track amended pleadings (Statement of Claim #1, #2, #3)
- Toggle between "all versions" and "latest only"
- Visual diff showing what changed between versions

**Fact List View**:
- Table: Fact | Alleged By | Source Paragraph | Confidence | Actions
- Sorting, filtering, search
- Click source to view exact paragraph in pleading
- Export to CSV/PDF/Word

**Implementation**:
```javascript
// Firestore Structure
/firms/{firmId}/matters/{matterId}/pleadings/{pleadingId}
  title: string
  type: string (Claim | Defence | Reply | Amended Claim)
  version: number
  filed_date: timestamp
  party: string
  storage_path: string

  /facts/{factId}
    text: string
    source_paragraph: string
    confidence: number (0-100)
    verified: boolean
    created_by: string (AI | User)
    created_at: timestamp

// Cloud Function
exports.extractFactsFromPleading = functions.firestore
  .document('firms/{firmId}/matters/{matterId}/pleadings/{pleadingId}')
  .onCreate(async (snap, context) => {
    const pleading = snap.data();
    const text = await extractTextFromPDF(pleading.storage_path);

    const facts = await callGeminiFactExtraction(text, pleading.type);

    const batch = admin.firestore().batch();
    facts.forEach(fact => {
      const ref = snap.ref.collection('facts').doc();
      batch.set(ref, { ...fact, created_by: 'AI' });
    });
    await batch.commit();
  });
```

### Facts Feature (High Priority)

**What it does**: Extracts atomic facts from witness interview transcripts with hearsay tracking.

**AI Fact Extraction from Interviews**:
- Upload transcript (PDF, DOCX, TXT, or paste)
- Gemini API processes transcript
- Extracts individual factual assertions
- Returns: Fact text + Source + Witness + Confidence + Hearsay flag
- Processing time: <60 seconds per 10,000-word interview

**Hearsay Tracking** (Unique Feature):
- Distinguishes **Source** (who told the lawyer) vs. **Witness** (who has direct knowledge)
- Example: "Client says accountant told him payment was late"
  - Source: Client
  - Witness: Accountant (hearsay!)
- Visual indicators (icon, color coding)
- Filter: "Show only direct knowledge" or "Show only hearsay"

**Semantic Fact Search (RAG)**:
- Google File Search API for semantic matching
- Natural language queries: "Find facts about contract signing"
- Search across ALL witnesses simultaneously
- Returns relevant facts with citations
- Cost: ~$0.002 per interview (essentially free)

**Fact Verification**:
- User marks facts as "verified" (checkmark)
- Audit log: who created/edited/verified, when
- Override AI confidence scores
- Critical for legal compliance

**Fact Export**:
- Export to PDF, CSV, DOCX
- Options: All facts or filtered, include hearsay column, group by witness
- Professional formatting for client sharing

**Implementation**:
```javascript
// Firestore Structure
/firms/{firmId}/matters/{matterId}/interviews/{interviewId}
  witness_name: string
  interview_date: timestamp
  interviewer: string
  transcript_path: string
  word_count: number

  /facts/{factId}
    text: string
    source: string (who told the lawyer)
    witness: string (who has direct knowledge)
    is_hearsay: boolean
    confidence: number (0-100)
    source_paragraph: string
    verified: boolean
    created_by: string (AI | User)

// Cloud Function with Google File Search
exports.extractFactsFromInterview = functions.https.onCall(async (data, context) => {
  const { interviewId, matterId } = data;

  // Get transcript
  const interview = await getInterview(matterId, interviewId);
  const text = await extractText(interview.transcript_path);

  // Extract facts with Gemini
  const facts = await callGeminiFactExtraction(text);

  // Create File Search corpus for RAG
  const corpusId = await createFileSearchCorpus(matterId);
  await addDocumentToCorpus(corpusId, interviewId, text);

  // Store facts
  const batch = admin.firestore().batch();
  facts.forEach(fact => {
    const ref = firestore
      .collection(`firms/${firmId}/matters/${matterId}/interviews/${interviewId}/facts`)
      .doc();
    batch.set(ref, { ...fact, created_by: 'AI' });
  });
  await batch.commit();

  return { factCount: facts.length, corpusId };
});

// Semantic search
exports.searchFacts = functions.https.onCall(async (data, context) => {
  const { matterId, query } = data;

  // Get File Search corpus for this matter
  const corpusId = await getCorpusId(matterId);

  // Semantic search with Google File Search
  const results = await fileSearchAPI.search({
    corpus: corpusId,
    query: query,
    limit: 20
  });

  // Return facts with citations
  return results.map(r => ({
    fact: r.text,
    source: r.metadata.witness_name,
    interview: r.metadata.interview_id,
    relevance_score: r.score
  }));
});
```

---

## API Integration Details

### Google Gemini API

**Models Used**:
- **Gemini Flash**: Fast, low-cost for bulk processing ($0.075 per 1M tokens)
- **Gemini Pro**: Higher accuracy for complex analysis ($0.30 per 1M tokens)

**Use Cases**:
- Document summarization
- Fact extraction from pleadings/interviews
- Entity extraction (people, dates, amounts)
- Document type classification
- Sentiment analysis
- Concept clustering (embeddings)

**Cost Examples**:
- Fact extraction: $0.003 per 10,000-word document
- Document summary: $0.001 per document
- 1,000 documents processed: ~$3-10 total

### Google File Search API

**Features**:
- Semantic search across document corpus
- Natural language queries
- RAG (Retrieval-Augmented Generation) architecture
- Returns relevant passages with citations

**Pricing**:
- Storage: FREE
- Query-time embeddings: FREE
- Indexing: $0.15 per million tokens (one-time)
- Per-document indexing cost: ~$0.002

**Implementation**:
```javascript
// Create corpus
const corpus = await fileSearchAPI.createCorpus({
  name: `matter-${matterId}-facts`,
  displayName: "Witness Interview Facts"
});

// Add documents
await fileSearchAPI.addDocument({
  corpus: corpus.id,
  text: interviewText,
  metadata: {
    interview_id: interviewId,
    witness_name: witnessName,
    interview_date: date
  }
});

// Search
const results = await fileSearchAPI.search({
  corpus: corpus.id,
  query: "What did witnesses say about the contract signing?",
  limit: 20
});
```

### Firebase Cloud Functions

**Triggers**:
- **onCreate**: Process new documents, extract metadata
- **onUpdate**: Reprocess when metadata changes
- **onCall**: Callable functions for client requests (clustering, search)
- **onSchedule**: Periodic cleanup, analytics updates

**Example Functions**:
```javascript
// Document processing trigger
exports.processDocument = functions.firestore
  .document('firms/{firmId}/matters/{matterId}/documents/{docId}')
  .onCreate(async (snap, context) => {
    const doc = snap.data();

    // Extract text
    const text = await extractText(doc.storage_path);

    // Gemini analysis
    const analysis = await callGemini({
      prompt: "Analyze this legal document...",
      text: text
    });

    // Update document
    await snap.ref.update({
      text_extracted: true,
      document_date: analysis.date,
      document_type: analysis.type,
      confidence: analysis.confidence
    });
  });

// Callable function for on-demand processing
exports.clusterDocuments = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { matterId, numClusters } = data;

  // Process
  const result = await performClustering(matterId, numClusters);

  return result;
});
```

---

## Performance Optimizations

### Virtual Scrolling
- TanStack Virtual for document tables
- Renders only visible rows (e.g., 20 rows instead of 10,000)
- Smooth scrolling with minimal DOM nodes
- Significant memory savings for large datasets

### Firestore Query Optimization
- Composite indexes for common query patterns
- Paginated queries (limit + startAfter)
- Real-time listeners only for active views
- Detach listeners when components unmount

### Caching Strategy
- AI results cached in Firestore (avoid repeated API calls)
- Browser localStorage for UI state (active matter, filters)
- Service Worker caching for static assets (planned)

### Web Worker Offloading
- File hashing (BLAKE3) in web workers
- Large file processing doesn't block UI
- Progress updates via postMessage

### Lazy Loading
- Route-based code splitting (Vue Router lazy imports)
- Component lazy loading for modals/dialogs
- Image lazy loading for document thumbnails

---

## Security & Privacy

### Authentication
- Firebase Auth with email/password
- Multi-app SSO (shared auth across Intranet, Bookkeeping, Files apps)
- Session management with automatic timeout
- Secure token refresh

### Authorization
- Firestore Security Rules enforce data access
- Rules match query constraints (queries must filter by userId/firmId)
- Document-level permissions
- Matter-scoped access control

**Example Rules**:
```javascript
match /firms/{firmId}/matters/{matterId}/documents/{docId} {
  allow read, write: if request.auth != null
                     && request.auth.uid == firmId; // Solo firm
}

// Multi-user firm (future)
match /firms/{firmId}/matters/{matterId}/documents/{docId} {
  allow read: if request.auth != null
              && exists(/databases/$(database)/documents/firms/$(firmId)/users/$(request.auth.uid));
}
```

### Data Privacy
- All data stored in Canadian Firebase regions (when available)
- GDPR/PIPEDA compliance considerations
- Data deletion workflows
- Audit trails for all data access

### API Security
- Cloud Functions verify authentication
- Rate limiting on API calls
- Input validation and sanitization
- Error handling without information leakage

---

## Development Workflow

### Local Development
- **Standard**: `npm run dev` → http://localhost:5173
- **Multi-app SSO testing**:
  - `npm run dev:intranet` → intranet.localhost:3000
  - `npm run dev:bookkeeping` → bookkeeping.localhost:3001
  - `npm run dev:files` → files.localhost:3002

### Pre-Commit Checks (On Request Only)
1. `npm run lint` - ESLint + Prettier (or delegate to beautifier agent)
2. `npm run test:run` - Vitest tests
3. `npm run build` - Production build verification

### Testing
- **Unit Tests**: Vitest for business logic
- **Component Tests**: Vitest + Testing Library for Vue components
- **Test Location**: All tests in `/tests` folder (not alongside source)
- **Worker Tests**: Use `self.onmessage` (not bare `onmessage`) for @vitest/web-worker compatibility

### Git Workflow
- **Two-branch model**: `main` (all PRs/merges) and `production` (manual promotion)
- Never commit directly to `production`
- All PRs merge to `main`
- Promotion workflow documented in `docs/hosting/2025-11-16-Promotion.md`

---

## Configuration

### Environment Variables
```bash
# Firebase Config (shared across all apps for SSO)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Gemini API
VITE_GEMINI_API_KEY=...
```

### Tailwind Configuration
- **Directive Order** (critical):
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Import CSS **after** Vue in `main.js`
- Consider prefix (e.g., `tw-`) to avoid Vuetify conflicts

### Firebase Configuration
- **CRITICAL**: All apps in SSO architecture use **identical Firebase config**
- Never change Firebase config without coordinating across all apps
- Config shared in `src/config/firebase.js`

---

## Key Technical Decisions

### Why Vue 3 Composition API?
- Better TypeScript support
- More flexible code organization
- Easier logic reuse (composables)
- Better performance (reactivity system)

### Why Firestore over SQL?
- Real-time sync out of the box
- Offline support
- Automatic scaling
- JSON-like document structure matches use case
- No schema migrations (pre-alpha stage)

### Why Hash-Based Deduplication?
- Automatic at database level (hash = document ID)
- No duplicate detection logic needed
- Storage savings (only one copy of each unique file)
- Fast lookups (hash is indexed)

### Why Web Workers for Hashing?
- File hashing is CPU-intensive
- Blocks UI if run on main thread
- Web workers enable non-blocking processing
- Critical for good UX with large file uploads

### Why Hybrid Tag Storage?
- Subcollections: Full query capabilities, audit trails
- Embedded maps: Fast table rendering (no joins)
- Best of both worlds
- Atomic batch writes maintain consistency

### Why Gemini over OpenAI?
- Better pricing ($0.075 vs $0.50 per 1M tokens)
- Google File Search integration (free semantic search)
- Excellent performance on legal text
- SOC 2 compliant

---

## Documentation

### Structure
- **Feature-module organization**: Each feature folder has `CLAUDE.md` index
- **Progressive disclosure**: Overview → detailed docs within modules
- **Vertical slices**: All docs for a feature (UI, logic, state, data) grouped together

### Key Documentation Files
- `/CLAUDE.md` - Root directives and documentation index
- `/docs/TECHNICAL-OVERVIEW.md` - This file
- `/docs/System/CLAUDE.md` - System architecture and conventions
- `/docs/Features/{Feature}/CLAUDE.md` - Feature-specific documentation
- `/docs/Data/CLAUDE.md` - Firestore schema and security rules
- `/docs/Testing/CLAUDE.md` - Testing strategy and patterns

---

## Summary

**ListBot** is a modern, cloud-native litigation document management platform built with:
- **Vue 3 + Vuetify + Tailwind** for a powerful, intuitive UI
- **Firebase ecosystem** for scalable backend (Auth, Firestore, Storage, Functions)
- **Google Gemini AI** for intelligent document analysis and fact extraction
- **BLAKE3 hashing** for automatic deduplication
- **Web workers** for non-blocking processing
- **Hybrid storage patterns** for optimal performance

The platform implements the complete EDRM workflow with unique innovations in pleadings management and witness fact extraction that no competitor currently offers. The architecture is designed for solo practitioners with an easy upgrade path to multi-user firms, and the tech stack enables rapid feature development with AI capabilities at exceptionally low cost.

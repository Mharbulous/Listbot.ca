# Client-Side File Deduplication Research Brief

## Context

We are building a legal document management system where users upload large batches of files (typically discovery documents, contracts, correspondence, etc.) for processing. Before files are uploaded to cloud storage, we perform **Phase 1: Client-Side Queueing and Deduplication** in the browser.

## The Problem

Legal professionals frequently work with document sets that contain duplicates:
- The same contract saved in multiple folders
- Email attachments that appear in multiple mailbox exports
- Documents copied across different matter folders
- Identical files with slightly different names or paths

Our goal is to **identify and handle duplicates on the client side** before any files are uploaded, providing:
1. **User transparency**: Show users exactly what duplicates exist in their upload batch
2. **Upload efficiency**: Avoid uploading identical files multiple times
3. **Storage optimization**: Only store unique file content once
4. **Metadata preservation**: Retain information about all file instances when relevant

## Phase 1 Requirements

Phase 1 operates entirely in the browser during the file selection/queueing phase:
- Users drag-and-drop or select 1,000 to 10,000+ files
- The system must identify duplicate content quickly
- Results must be presented to users before upload begins
- Processing should not freeze the UI (responsiveness is critical)

**Important**: We can defer some final deduplication checks to Phase 2 (during upload), since network upload speeds will mask any processing overhead. However, Phase 1 should catch the majority of duplicates to provide early user feedback.

## Deduplication Classification

Our system distinguishes between different types of duplicate files:

### 1. True Duplicates
Files with identical content AND identical core metadata (filename, size, modified date) where folder path variations provide no informational value.

**Action**: Do not upload. Do not record metadata.

**Example**:
- `/ProjectA/contracts/NDA.pdf` (256KB, modified 2024-01-15)
- `/ProjectA/backup/contracts/NDA.pdf` (256KB, modified 2024-01-15)

### 2. Meaningful Copies
Files with identical content but different metadata that HAS informational value (different filenames, different modification dates, meaningful path differences).

**Action**: Do not upload content (storage). DO record metadata for reference.

**Example**:
- `/Drafts/Contract_v1.pdf` (256KB, modified 2024-01-10)
- `/Final/Executed_Contract.pdf` (256KB, modified 2024-03-15)
- Same content, but filename and date changes indicate version progression

### 3. Primary/Best File
For any group of files with identical content, one file is selected as the "primary" based on having the most meaningful metadata.

**Action**: Upload this file's content. Record this file's metadata.

## Six Test Scenarios

We need data structures and algorithms optimized for the following realistic scenarios:

### Scenario 1: Small Batch, Few Duplicates
- **Total files**: 1,000
- **Duplicate rate**: 1% (10 duplicate files, ~5 duplicate groups)
- **Use case**: Clean, well-organized document set
- **Expectation**: Processing overhead should be minimal; near-instant results

### Scenario 2: Small Batch, All Duplicates
- **Total files**: 1,000
- **Duplicate rate**: 100% (all files are copies of each other)
- **Use case**: Testing edge case, or user accidentally selected same folder multiple times
- **Expectation**: System quickly identifies the single unique file

### Scenario 3: Medium Batch, Few Duplicates
- **Total files**: 5,000
- **Duplicate rate**: 1% (50 duplicate files, ~20-25 duplicate groups)
- **Use case**: Standard discovery document upload
- **Expectation**: Results within 2-5 seconds; UI remains responsive

### Scenario 4: Medium Batch, All Duplicates
- **Total files**: 5,000
- **Duplicate rate**: 100% (all files identical)
- **Use case**: User error, or stress testing
- **Expectation**: System efficiently collapses to single unique file without processing all 5,000 unnecessarily

### Scenario 5: Large Batch, Few Duplicates
- **Total files**: 10,000
- **Duplicate rate**: 1% (100 duplicate files, ~40-50 duplicate groups)
- **Use case**: Large litigation document production
- **Expectation**: Results within 5-10 seconds; background processing with progress indicators

### Scenario 6: Large Batch, All Duplicates
- **Total files**: 10,000
- **Duplicate rate**: 100% (all files identical)
- **Use case**: Extreme edge case / system stress test
- **Expectation**: System gracefully handles without browser crash; early termination when pattern detected

## Real-World Distribution Patterns

In practice, duplicate rates typically follow these patterns:
- **Well-organized sets**: 1-5% duplicates
- **Email exports with attachments**: 15-30% duplicates
- **Multi-source collections**: 20-40% duplicates
- **Legacy archives**: 40-60% duplicates

The system should be optimized for the 1-30% duplicate range while gracefully handling edge cases.

## Performance Constraints

### Browser Environment
- Must run in modern web browsers (Chrome, Firefox, Safari, Edge)
- Limited to browser memory constraints (~2-4GB practical limit)
- Should use Web Workers for CPU-intensive operations to avoid blocking UI
- File content must be read/processed efficiently (FileReader API, streams)

### User Experience
- Initial feedback within 1-2 seconds
- Progress indicators for operations > 2 seconds
- Final results before upload phase begins
- Users must be able to review duplicate groups and override decisions if needed

## Data Characteristics

### File Sizes
Legal documents typically range from:
- **Small**: 10KB - 500KB (text documents, emails)
- **Medium**: 500KB - 5MB (PDF documents, presentations)
- **Large**: 5MB - 50MB (scanned discovery, video depositions)

### File Types
- PDF documents (70% of files)
- Microsoft Office documents (20%)
- Images, emails, misc (10%)

### Content Patterns
- High likelihood of exact duplicate PDFs (same contract, multiple folders)
- Same email with attachment appearing in multiple mailbox exports
- Scanned documents may have similar but not identical content (scanning artifacts)

## Research Questions

We need your expertise to identify:

1. **Optimal data structures** for tracking file content identity, metadata, and relationships at scale (1,000-10,000 files)

2. **Efficient algorithms** for:
   - Identifying files with identical content
   - Grouping duplicate files together
   - Selecting the "best" primary file from each group
   - Minimizing unnecessary file content reading/processing

3. **Performance optimization strategies** for:
   - Early termination when high duplicate rates detected
   - Progressive processing with UI updates
   - Memory-efficient handling of large file batches
   - Parallelization opportunities (Web Workers)

4. **Trade-offs** between:
   - Processing speed vs. accuracy
   - Memory usage vs. performance
   - Upfront cost (Phase 1) vs. deferred cost (Phase 2 during upload)

## Success Criteria

An optimal solution will:
- Process Scenario 3 (5,000 files, 1% duplicates) in < 5 seconds
- Remain responsive (no UI freeze) during all operations
- Use < 2GB memory for 10,000 file batch
- Accurately identify 99.9%+ of true duplicates
- Provide early results (show first duplicate groups within 1-2 seconds)
- Scale gracefully from 1,000 to 10,000+ files

## Out of Scope

Please focus on Phase 1 (client-side, pre-upload) deduplication only. The following are handled elsewhere:
- Server-side deduplication (Phase 2)
- Database storage strategies
- Network upload optimization
- File content analysis beyond identity checking

## Deliverable

Please recommend:
1. Specific data structures with justification
2. Algorithm approach with pseudocode or description
3. Performance analysis for the six scenarios
4. Implementation considerations for browser environment
5. Potential pitfalls and mitigation strategies

Thank you for your expertise in helping us build an efficient, user-friendly deduplication system for legal document management.

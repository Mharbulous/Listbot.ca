# File Deduplication

Client-side and server-side file deduplication logic, architecture rationale, and implementation guides.

## Available Documentation

@client-deduplication-logic.md - Architectural rationale and enhancement guide
- Two-phase deduplication approach
- Performance optimization strategies
- UX enhancement patterns
- Testing strategy

@client-deduplication-stories.md - User stories and implementation requirements
- Feature checklist
- UX requirements
- Implementation tasks

@deduplication-complexity-analysis.md - Complexity analysis of deduplication approaches

@2025-11-16-ClientDeDupeLogic.md - Historical deduplication logic documentation

@2025-11-16-MMD-ClientDeDupeLogic.md - Mermaid diagrams for deduplication flow

## Quick Reference

**For architecture rationale:** See @client-deduplication-logic.md
**For user stories:** See @client-deduplication-stories.md
**For terminology:** See @docs/Features/Upload/Processing/file-lifecycle.md

## Key Deduplication Concepts

**Two-Phase Approach**:
- Phase 1: Client-side (instant, group by size, hash only duplicates, no DB queries)
- Phase 2: Upload (hash during upload, query DB, smart hiding)

**Terminology** (from root CLAUDE.md):
- **duplicate**: Identical hash + metadata, not uploaded, metadata not copied
- **redundant**: Hash-verified duplicates awaiting removal
- **copy**: Same hash, different meaningful metadata, not uploaded but metadata recorded
- **best/primary**: File with most meaningful metadata, uploaded to storage

## Related Documentation

- File lifecycle: @docs/Features/Upload/Processing/file-lifecycle.md
- Upload system: @docs/Features/Upload/CLAUDE.md
- Testing: @docs/Testing/vitest-test-suites.md

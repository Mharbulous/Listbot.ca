# Handover Prompt for Next Session

## Task

Update documentation files to reflect new email extraction architecture. Email extraction design is complete (`docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`). Now need to integrate terminology and schema into existing docs.

## Context

**Project:** ListBot.ca - e-discovery file processing app
**Feature:** Email extraction (parse .msg files → extract messages + attachments)
**Stage:** Documentation integration (design complete, now updating related docs)
**Branch:** Create new `claude/email-docs-update-<session-id>`

## Key Design Decisions

1. **Native vs Quoted messages:** Native = reliable (from .msg metadata), Quoted = potentially edited (from email body text)
2. **Storage:** `/uploads` (files + attachments), `/emails` (parsed message bodies)
3. **Collections:** `uploads` (.msg files), `emails` (individual messages), `files` (attachments)
4. **IDs:** Email messages use auto-generated IDs (not hashes) to track duplicate quoted content across multiple .msg files

## Files to Update

### Critical (Do First)

**1. `docs/Features/Upload/Processing/file-lifecycle.md`**
- Add **Native** and **Quoted** to terminology section
- Include forensic value distinction (Native = admissible evidence, Quoted = can be edited)
- See `HANDOVER.md` section 1 for exact wording

**2. `docs/Data/25-11-18-data-structures.md`**
- Add `emails` collection to schema section
- Update collection paths list
- See `HANDOVER.md` section 2 for exact additions

**3. `docs/Features/Upload/Storage/firebase-storage-plan.md`**
- Add `/emails` storage path
- Clarify /uploads vs /emails purpose
- See `HANDOVER.md` section 3 for updated structure

### Quick Updates

**4. `docs/Features/Upload/CLAUDE.md`** - Add reference to Email-Extraction docs
**5. `docs/Features/Upload/Processing/CLAUDE.md`** - Add Native/Quoted to terminology list

## Reference

**Complete design:** `docs/Features/Upload/Email-Extraction/email-extraction-architecture.md`
**Detailed instructions:** `docs/Features/Upload/Email-Extraction/HANDOVER.md`

## What NOT to Do

- ❌ Don't update `evidence-schema.md` (email messages are separate collection, not part of evidence)
- ❌ Don't update deduplication docs (existing logic handles email attachments correctly)
- ❌ Don't create new files (only update existing files)

## Validation

- [ ] Native/Quoted defined in `file-lifecycle.md`
- [ ] `emails` collection in `data-structures.md`
- [ ] `/emails` path in `firebase-storage-plan.md`
- [ ] All @-imports resolve
- [ ] Terminology consistent across files

## Commit & Push

Commit after each file update. Push when complete.

---

**Start here:** Read `HANDOVER.md` for detailed per-file instructions.

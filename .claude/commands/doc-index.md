# Documentation Indexing

Generate or update CLAUDE.md index files throughout the `docs/` folder to maintain the feature-module documentation structure.

**CRITICAL**: CLAUDE.md files are **lightweight indexes**, not comprehensive documentation. They are navigation aids that help Claude find detailed documentation efficiently. See `@Research/2025-11-17-CLAUDEmdIndexing.md` for the research-backed approach and templates.

**Core Principles**:
- **Index, not information**: Point to content, don't duplicate it
- **Progressive disclosure**: Brief descriptions that help Claude decide which files to load
- **Keep it lean**: Root CLAUDE.md = 200-300 lines, folder indexes = 50-150 lines
- **Focus on navigation**: Every line should answer "where should Claude look for X?"

**Target folder**: $ARGUMENTS (optional - defaults to entire `docs/` folder)

---

## Step 1: Determine Target Scope

### If $ARGUMENTS is provided:
1. Validate that the path exists and is within the `docs/` folder
2. Set `targetPath` to the provided argument
3. If the path doesn't exist or isn't in `docs/`, display error and exit

### If $ARGUMENTS is empty:
1. Set `targetPath` to `docs/`
2. Process the entire documentation structure

---

## Step 2: Scan Folder Structure

Use the `Bash` tool with `find` to discover the folder structure:

```bash
find "$targetPath" -type d | sort
```

For each discovered folder:
1. List all `.md` files (excluding CLAUDE.md): `find "$folder" -maxdepth 1 -name "*.md" ! -name "CLAUDE.md"`
2. List immediate subfolders: `find "$folder" -mindepth 1 -maxdepth 1 -type d`
3. Check if CLAUDE.md exists: `test -f "$folder/CLAUDE.md"`

Store this information in a data structure for processing.

---

## Step 3: Determine Folder Type and Template

For each folder, determine which template to use:

### Top-Level Module Folders
**Pattern**: Direct children of `docs/` (e.g., `docs/System/`, `docs/Features/`, `docs/Data/`)
**Indicators**: Has subfolders with their own documentation
**Template**: Module template (see Step 4)

### Feature/Subfolder
**Pattern**: Nested folders (e.g., `docs/Features/Upload/`, `docs/System/Architecture/`)
**Indicators**: Contains .md files, may or may not have subfolders
**Template**: Feature template (see Step 5)

---

## Step 4: Generate/Update Top-Level Module CLAUDE.md

**Target length**: 200-300 lines maximum. Remember: this is a map, not a manual.

**Template structure** (based on `@Research/2025-11-17-CLAUDEmdIndexing.md`):

```markdown
# [Module Name]

[1-2 sentence description - what this module covers]

## Documentation Organization

[For each subfolder with documentation:]
### [Subfolder Name]
@docs/[relative path]/CLAUDE.md - [One-line description of what's in this subfolder]

## Quick Navigation
- [Common task 1]: See @docs/[path]/[file].md
- [Common task 2]: See @docs/[path]/[file].md
- [Common task 3]: See @docs/[path]/[file].md

## Documentation Files in This Folder
[Only if .md files exist directly in this folder:]
@filename.md - [One-line description - what question does this file answer?]

## Related Documentation
[Preserve if exists - cross-references to other modules]
```

### Auto-generation Rules:
1. **Module name**: Convert folder name to Title Case (e.g., "Features" → "Features", "System" → "System")
2. **Description**: Context-aware, concise (e.g., "System" → "System-wide architecture, conventions, and technical stack")
3. **Subfolder descriptions**: One line focusing on what questions it answers, not what it contains
4. **File descriptions**: Answer "what question does this file help with?" not "what topics are in this file?"
5. **Quick Navigation**: Extract 3-5 most common use cases from file content

### Preservation Rules:
- Preserve "Related Documentation" section if it exists
- Preserve any custom sections added manually
- **Replace** auto-generated sections (Organization, Quick Navigation, Files) with fresh content
- Keep custom content that provides navigational value

---

## Step 5: Generate/Update Feature/Subfolder CLAUDE.md

**Target length**: 50-150 lines maximum. Be ruthlessly concise.

**Template structure** (based on `@Research/2025-11-17-CLAUDEmdIndexing.md`):

```markdown
# [Feature Name]

[1-2 sentence description focusing on what problems this documentation helps solve]

## Available Documentation

[For each .md file, answer "what question does this answer?"]
@filename.md - [One-line description (max 80 characters)]
- [Optional: 2-3 sub-bullets for major sections, only if file is long]

[If has subfolders with documentation:]
### Subfolders
@docs/[subfolder path]/CLAUDE.md - [What's in this subfolder?]

## Quick Reference
[3-5 bullets answering: "What would someone commonly need from this area?"]
- [Most common use case]: See @[file].md [section reference if helpful]
- [Second common use case]: See @[file].md

## Related Documentation
[Preserve if exists - only cross-references that genuinely help navigation]
```

### Auto-generation Rules:
1. **Feature name**: Convert from folder name, add context (e.g., "Deduplication" → "File Deduplication")
2. **Description**: Focus on problems solved, not topics covered
3. **File descriptions**: Maximum 80 characters, focus on the question it answers
4. **Quick Reference**: Extract most common queries this area addresses (analyze file content for typical use cases)
5. **Cross-references**: Add only if genuinely helpful for navigation:
   - Features reference System/Architecture for patterns used
   - Upload subfolders reference parent Upload/CLAUDE.md for context
   - Any feature using Firestore references Data/CLAUDE.md

### Preservation Rules:
- Preserve "Related Documentation" if it exists and adds value
- Preserve any custom sections that help navigation
- **Replace** auto-generated sections (Available Documentation, Quick Reference)
- Remove sections that don't add navigational value

---

## Step 6: Generate File Descriptions

**Goal**: Create descriptions that help Claude decide "should I load this file for the current query?"

For each .md file that needs a description:

1. **Read the file** using the `Read` tool (first 50 lines only to minimize tokens)
2. **Identify the key question** this file answers:
   - Look at H1/H2 headings to understand scope
   - Read first paragraph for context
   - Identify the primary use case or problem being addressed
3. **Write description** following this formula:
   - **Format**: "[What question/problem] - [Key topics covered]"
   - **Length**: Maximum 80 characters (ruthlessly concise)
   - **Examples**:
     - ✅ "How authentication works - OAuth flow, token management, security"
     - ✅ "File upload process - Workers, deduplication, storage"
     - ❌ "This document describes the authentication system and provides..." (too verbose)
     - ❌ "Authentication" (too vague - doesn't help Claude decide)
4. **Cache** descriptions to avoid re-reading files on subsequent runs

---

## Step 7: Write/Update CLAUDE.md Files

For each folder in scope:

### If CLAUDE.md does NOT exist:
1. Generate complete CLAUDE.md from appropriate template
2. Use `Write` tool to create the file
3. Report: "✓ Created `[path]/CLAUDE.md`"

### If CLAUDE.md EXISTS:
1. Use `Read` tool to load existing content
2. Parse to identify preserved sections (Overview, Key Concepts, etc.)
3. Generate new content with preserved sections intact
4. Use `Edit` tool to update specific sections OR `Write` to replace entirely if structure changed significantly
5. Report: "✓ Updated `[path]/CLAUDE.md`"

---

## Step 8: Generate Summary Report

After processing all folders, display a summary:

```
Documentation Index Complete
============================

Processed: [N] folders
Created:   [N] new CLAUDE.md files
Updated:   [N] existing CLAUDE.md files

New Index Files:
- docs/System/CLAUDE.md
- docs/Features/Upload/CLAUDE.md
[...]

Updated Index Files:
- docs/Data/CLAUDE.md
[...]

Next Steps:
1. Review generated CLAUDE.md files for brevity (root: 200-300 lines, folders: 50-150 lines)
2. Verify descriptions focus on "what question does this answer?" not "what content is in this?"
3. Check that cross-references have navigational value (not just topical similarity)
4. Test with Claude: ask questions and observe which files get loaded
5. Run '/doc-index' again after adding new documentation

Remember: Index, not information. See @Research/2025-11-17-CLAUDEmdIndexing.md for principles.
```

---

## Important Constraints

**CRITICAL - Index, Not Information**:
CLAUDE.md files are navigation aids, not documentation. Every line must help Claude find information, not contain information itself. See `@Research/2025-11-17-CLAUDEmdIndexing.md` for the research backing this approach.

1. **Never overwrite custom content**: Preserve manually-written navigational content
2. **Only update auto-generated sections**: File lists, subfolder references, Quick Navigation
3. **Ruthless brevity**:
   - Root CLAUDE.md: 200-300 lines maximum
   - Folder CLAUDE.md: 50-150 lines maximum
   - File descriptions: 80 characters maximum
   - If you can't fit in these limits, you're including information instead of indexing it
4. **Follow conventions** (from research report):
   - Use `@docs/` notation for cross-references (enables progressive disclosure)
   - Focus descriptions on "what question does this answer?" not "what topics are in this?"
   - No content duplication - point to the single source of truth
   - Progressive disclosure: CLAUDE.md shows map → detailed files contain information
5. **Quality over quantity**:
   - Better to have 5 precise, helpful cross-references than 20 vague ones
   - Remove sections that don't add navigational value
   - Each description must help Claude make a loading decision
6. **Architectural alignment**:
   - Follow feature-module structure in `docs/System/Documentation/documentation-hierarchy.md`
   - Respect the hierarchical discovery pattern Claude Code uses

---

## Usage Examples

```bash
# Index entire documentation folder
/doc-index

# Index specific feature module
/doc-index docs/Features/Upload

# Index specific subfolder
/doc-index docs/System/Architecture

# Index top-level module and all subfolders
/doc-index docs/Features
```

---

## Error Handling

### Path doesn't exist:
```
Error: Path 'docs/InvalidFolder' does not exist
```

### Path not in docs/ folder:
```
Error: Path must be within the 'docs/' folder
Usage: /doc-index [path/to/docs/folder]
```

### No markdown files found:
```
Warning: No markdown files found in 'docs/EmptyFolder'
Skipping index generation for this folder.
```

### File read errors:
```
Warning: Could not read 'docs/folder/file.md' for description generation
Using filename as description instead.
```

---

## Implementation Notes

**Core Philosophy** (from `@Research/2025-11-17-CLAUDEmdIndexing.md`):
- "You're writing for Claude, not onboarding a junior dev"
- Each description must answer: "Should Claude load this file for the current query?"
- CLAUDE.md files that exceed target length (200-300 root, 50-150 folder) consistently show context confusion
- Token efficiency: Properly organized indexes reduce token usage 60-80% versus full documentation dumps

**File reading optimization**:
- Only read first 50 lines of each file for description extraction (minimize token usage)
- Cache descriptions to avoid re-reading on subsequent runs
- Process folders in parallel where possible

**Description writing pattern**:
❌ **Wrong**: "This document contains information about authentication including OAuth, tokens, and security"
✅ **Right**: "How authentication works - OAuth flow, token management, security"

The difference: helping Claude navigate vs. describing content. Focus on the question answered, not topics covered.

**Intelligent cross-referencing** (add only if genuinely helpful):
- Features/Upload references → System/Architecture (for patterns used), Data/CLAUDE.md (for Firestore schema)
- Features/Organizer references → Features/Upload (for file processing flow context)
- System/* references → Related system concerns only if there's genuine overlap
- Testing references → Relevant features being tested (helps Claude find implementation when reading tests)

**Custom section detection**:
When parsing existing CLAUDE.md files, preserve these sections if they exist:
- "## Related Documentation" (if it has navigational value)
- Any custom ## heading that helps navigation
- **Remove** sections that duplicate information from detailed docs (violates "index not information" principle)

**Template selection logic**:
```
if folder is direct child of docs/:
    use Module template (200-300 lines)
else if folder has subfolders with docs:
    use Module template (nested, 100-200 lines)
else:
    use Feature template (50-150 lines)
```

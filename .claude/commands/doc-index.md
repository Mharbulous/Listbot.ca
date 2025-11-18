# Documentation Indexing

Generate or update CLAUDE.md index files throughout the `docs/` folder to maintain the feature-module documentation structure.

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

**Template structure**:

```markdown
# [Module Name]

[Auto-generate 1-2 sentence description based on folder name and contents]

## Submodules

[For each subfolder with documentation:]
### [Subfolder Name]
[Auto-generate brief description]
- See `@docs/[relative path]/CLAUDE.md` for details

## Overview
[Preserve if exists, otherwise leave placeholder for manual editing]

## Documentation Files
[List any .md files directly in this folder:]
- `filename.md` - [Auto-generate brief description from first heading or leave for manual entry]

## Related Documentation
[Preserve if exists, otherwise leave placeholder for manual cross-references]
```

### Auto-generation Rules:
1. **Module name**: Convert folder name from PascalCase/kebab-case to Title Case
2. **Description**: Generate from folder name context (e.g., "System" → "System-wide architecture, conventions, and technical stack")
3. **Subfolder descriptions**: Generate from subfolder name
4. **File descriptions**: Read first heading or first paragraph, create 1-line summary

### Preservation Rules:
- If CLAUDE.md exists, preserve content in "Overview" and "Related Documentation" sections
- Only update "Submodules" and "Documentation Files" lists
- Preserve any custom sections not in the template

---

## Step 5: Generate/Update Feature/Subfolder CLAUDE.md

**Template structure**:

```markdown
# [Feature Name]

[Auto-generate 1-2 sentence description]

## Documentation in This Folder

[For each .md file:]
- `filename.md` - [Brief description]

[If has subfolders with documentation:]
### Subfolders
- `@docs/[subfolder path]/CLAUDE.md` - [Subfolder name]

## Key Concepts
[Preserve if exists, otherwise leave placeholder]

## Related Documentation
[Preserve if exists, otherwise add intelligent cross-references based on folder location]

## Implementation Notes
[Preserve if exists, otherwise omit section]
```

### Auto-generation Rules:
1. **Feature name**: Convert from folder name (e.g., "Deduplication" → "File Deduplication")
2. **Description**: Contextual based on parent folders
3. **File descriptions**: Read file and create 1-line summary from content
4. **Cross-references**: Intelligently suggest related docs:
   - Features reference System/Architecture
   - Upload subfolders reference parent Upload/CLAUDE.md
   - Organizer features reference Data/CLAUDE.md

### Preservation Rules:
- Preserve "Key Concepts", "Related Documentation", "Implementation Notes" sections if they exist
- Only update file lists and subfolder references
- Keep any custom sections

---

## Step 6: Generate File Descriptions

For each .md file that needs a description:

1. **Read the file** using the `Read` tool (first 50 lines only)
2. **Extract description** using this priority:
   - First H1 heading followed by first paragraph
   - First H2 heading if no H1
   - First paragraph if no headings
   - Filename as fallback
3. **Summarize** to 1 line (max 80 characters)
4. **Cache** descriptions to avoid re-reading files

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
1. Review generated CLAUDE.md files
2. Add custom content to "Overview" and "Key Concepts" sections
3. Verify cross-references are accurate
4. Run '/doc-index' again after adding new documentation
```

---

## Important Constraints

1. **Never overwrite custom content**: Preserve manually-written sections (Overview, Key Concepts, Implementation Notes, Related Documentation)
2. **Only update auto-generated sections**: File lists, subfolder references, and basic structure
3. **Follow conventions**:
   - Use `@docs/` notation for cross-references
   - Keep descriptions to 1-2 sentences max
   - Maintain progressive disclosure (index → details)
   - No content duplication (reference, don't copy)
4. **Respect single source of truth**: When docs overlap, reference the primary doc
5. **Lean by design**: Optimize for Sonnet 4.5 (omit obvious details)
6. **Feature-module alignment**: Follow the structure in `docs/System/Documentation/documentation-hierarchy.md`

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

**File reading optimization**:
- Only read first 50 lines of each file for description extraction
- Cache file descriptions to avoid re-reading
- Process folders in parallel where possible

**Intelligent cross-referencing**:
- Features/Upload references → System/Architecture, Data/CLAUDE.md
- Features/Organizer references → Features/Upload (for file processing flow)
- System/* references → Related system concerns
- Testing references → Relevant features being tested

**Custom section detection**:
When parsing existing CLAUDE.md files, detect these custom sections and preserve them:
- "## Overview" (any content after heading)
- "## Key Concepts" (any content)
- "## Implementation Notes" (any content)
- "## Related Documentation" (any content)
- Any ## heading not in the standard template

**Template selection logic**:
```
if folder is direct child of docs/:
    use Module template
else if folder has subfolders with docs:
    use Module template (nested)
else:
    use Feature template
```

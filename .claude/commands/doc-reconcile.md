# Documentation Reconciliation

**Purpose**: Reconcile documentation files that have drifted from the actual codebase by:
- Creating a **Key Files** section if missing
- Fixing **broken cross-references** to source code and other documentation
- Updating **terminology definitions** to match canonical sources

This command analyzes the target documentation file, compares it with the current state of the codebase, and generates a reconciliation report.

**Target file**: `$ARGUMENTS`

**Key Constraint**: This command modifies ONLY the target documentation file. No other files (source code, other documentation) will be changed.

---

## YOLO Mode

**Activation**: When `$ARGUMENTS` equals "YOLO" (case-insensitive), the command enters autonomous reconciliation mode.

**YOLO Mode Behavior**:
1. **Auto-select target file**: Automatically selects the first valid documentation file that needs reconciliation
2. **Make judgment calls**: Answers all questions automatically based on best practices and codebase patterns
3. **Skip user approval**: Proceeds directly to reconciliation without waiting for user confirmation
4. **Auto-reconcile**: Continues working until completion, technical block, or timeout

**CRITICAL CONSTRAINTS for YOLO Mode**:
- **ONE FILE ONLY**: YOLO mode can ONLY modify the single target documentation file selected
- **NO OTHER FILES**: MUST NOT modify any other files in the repository, including:
  - Source code files
  - Other documentation files
  - Configuration files
  - Test files
- **Time limit**: Stop if more than 20 minutes have passed since command started
- **Technical blocks**: Stop if unable to proceed (e.g., cannot determine correct terminology, missing critical source files)

**YOLO Mode Judgment Guidelines**:
- **Terminology conflicts**: Always defer to canonical definitions in `@docs/architecture/file-lifecycle.md`
- **Ambiguous cross-references**: Choose the most likely current file path based on git history
- **Missing Key Files section**: Create it with all files extensively discussed in the documentation
- **Decomposition decisions**: Apply the 50% rule strictly - if uncertain, err toward listing children
- **Code misalignments**: Update documentation to match current code (code is source of truth)
- **Broken references**: Fix to point to current file locations, or remove if file no longer exists

---

## Step 1: Validate Target Documentation File

**Check for YOLO Mode:**
- **If `$ARGUMENTS` equals "YOLO" (case-insensitive)**:
  - Set `yoloMode = true`
  - Record start time for 20-minute timeout tracking
  - Display: "🚀 YOLO MODE ACTIVATED - Autonomous reconciliation starting..."
  - Display: "⚠️ CONSTRAINT: Will modify ONLY ONE documentation file"
  - Proceed to auto-select target file (see "If $ARGUMENTS is empty" below)
- **Otherwise**:
  - Set `yoloMode = false`
  - Proceed with normal validation

**Documentation Naming Convention:**
- All documentation files MUST begin with a date in `YY-MM-DD` format (e.g., `25-11-18-feature-name.md`)
- Files without this date prefix are in need of reconciliation
- Files with today's date should NOT be reconciled (too recent, not enough time for drift)

**If $ARGUMENTS is provided (and not "YOLO"):**
- Verify the file path exists (use Read tool)
- Confirm it's a markdown documentation file (`.md` extension)
- **REJECT if filename is `CLAUDE.md`** - these are not valid targets for reconciliation
- **REJECT if filename starts with today's date (YY-MM-DD)** - too recent for reconciliation
- Store the file path as `targetDoc`
- Display: "Reconciling documentation: `$ARGUMENTS`"

**If $ARGUMENTS is empty or "YOLO":**
1. Search for markdown files in `docs/` directory that need reconciliation:
   ```bash
   # Find docs without YY-MM-DD date prefix
   find docs/ -type f -name "*.md" ! -name "CLAUDE.md" ! -name "[0-9][0-9]-[0-9][0-9]-[0-9][0-9]-*.md"
   ```
2. Also check for older dated files (not from today):
   ```bash
   git log --since="2 weeks ago" --name-only --pretty=format: -- docs/**/*.md | sort -u | head -10
   ```
3. Filter out:
   - Files named `CLAUDE.md`
   - Files with today's date prefix (YY-MM-DD)
4. **Automatically select the first valid candidate**:
   - Take the first file from the search results
   - If multiple candidates exist, prioritize files without date prefixes over older dated files
   - Store the selected file as `targetDoc`
   - Display: "Auto-selected for reconciliation: `[targetDoc]`"

**Validation checks:**
- File must exist and be readable
- File must be in the `docs/` directory
- File extension must be `.md`
- **File must NOT be named `CLAUDE.md`** (configuration files are not valid reconciliation targets)
- **File must NOT start with today's date** (too recent for meaningful reconciliation)

---

## Step 2: Extract Last Reconciliation Date and Key Files

Read the target documentation file and extract:

### 2.1 Last Reconciliation Date

- Look for "**Reconciled up to**: {date}" immediately under the title (within first 10 lines)
- If found, store the date as `lastReconciledDate`
- If NOT found, set `lastReconciledDate = null` (this is the first reconciliation)
- This date will limit how far back to search for code changes in Step 3

### 2.2 Key Files Section

- Look for a "## Key Files" section near the top of the document
- Extract all file paths listed in this section
- Store these as `keyFiles[]` array
- These represent the primary source files most relevant to this documentation
- If section doesn't exist, note that it needs to be created

### 2.3 Other Content Analysis

Extract for later validation:

1. **Technical terminology**:
   - Specialized terms (e.g., "Original", "Source", "Upload", "Batesed", "redundant", "duplicate", "copy")
   - Domain-specific concepts (e.g., "Solo Firm", "Auth State Machine", "H-Factor")

2. **Cross-references**:
   - All `@path/to/file` references to other documentation or source files
   - Inline code examples with file paths or component names
   - Links to related documentation sections

3. **Code references**:
   - Component names mentioned (e.g., `AppSwitcher.vue`, `DocumentTable`)
   - Store names (e.g., `authStore`, `teamStore`, `firmStore`)
   - Function/method names referenced
   - File paths to source code

4. **Version-sensitive content**:
   - Line number references
   - Specific code snippets
   - API signatures or interfaces

---

## Step 3: Check Recent Code Changes (Limited by Last Reconciled Date)

**Check timeout (YOLO Mode only):**
- If `yoloMode = true` and more than 20 minutes have elapsed since start:
  - Display: "⏱️ YOLO MODE TIMEOUT - Stopping at Step 3"
  - Display partial findings gathered so far
  - Exit command without modifying files

### 3.1 Determine Git Log Date Range

**If `lastReconciledDate` exists:**
- Search for commits ONLY since that date
- Use: `git log --since="YYYY-MM-DD" --name-only --oneline`

**If `lastReconciledDate` is null:**
- Search commits from the last 4 weeks
- Use: `git log --since="4 weeks ago" --name-only --oneline`

### 3.2 Identify Relevant Code Changes

1. **Run git log** with the appropriate date range:
   ```bash
   git log --since="[date]" --name-only --oneline -- src/**/*
   ```

2. **Filter for commits affecting Key Files**:
   - If "Key Files" section exists, prioritize changes to those files
   - Track commits that modified files mentioned in the documentation
   - Group by file path for easier analysis

3. **Stop after finding 5 relevant commits**:
   - Once you identify **5 commits that changed code in ways potentially inconsistent with documentation**, STOP searching
   - Record these 5 commits with their file changes
   - Do NOT continue examining older commits - move to holistic comparison instead

### 3.3 Map Documentation Topics to Source Files

For remaining reconciliation work:
- If doc mentions authentication → check `src/stores/authStore.js`, `src/router/index.js`
- If doc mentions file processing → check `src/stores/firmStore.js`, `src/workers/fileHashWorker.js`
- If doc mentions components → check `src/components/`, `src/views/`

---

## Step 4: Reconciliation Analysis

**Check timeout (YOLO Mode only):**
- If `yoloMode = true` and more than 20 minutes have elapsed since start:
  - Display: "⏱️ YOLO MODE TIMEOUT - Stopping at Step 4"
  - Display partial findings gathered so far
  - Exit command without modifying files

Perform four types of checks:

### 4.1 Holistic Code Comparison

**CRITICAL: Compare target documentation to CURRENT state of code:**

1. **Read the current versions** of all Key Files listed in the documentation
2. **Compare documented behavior** with actual implementation as it exists NOW
3. **Flag discrepancies** between what documentation says and what code does
4. **Focus on**:
   - Architectural patterns described vs. actual patterns used
   - Component relationships documented vs. current structure
   - State management flows described vs. actual implementation
   - API signatures in examples vs. current signatures

**This is the PRIMARY reconciliation method** - individual commits provide context, but the holistic comparison catches everything.

### 4.2 Key Files Section Validation and Update

**CRITICAL: Verify and update the Key Files section:**

1. **For each file listed in Key Files**:
   - Check if the file still exists (use Read tool)
   - Check if the file has been decomposed into multiple child files:
     - Use Glob to find files like `parentFile/*.js` or similar patterns
     - Count how many children exist

2. **Apply the 50% Rule**:
   - If a parent file has been decomposed into children:
     - Count how many children are relevant to this documentation
     - **If < 50% of children are relevant**: Remove parent, list only relevant children
     - **If ≥ 50% of children are relevant**: Keep parent reference, do NOT list children

3. **Check for missing Key Files**:
   - If the documentation extensively discusses a file not in Key Files, suggest adding it
   - If Key Files section doesn't exist, create it with all relevant files

**Example transformation**:
```markdown
## Key Files (Before)
- `src/stores/authStore.js`

## Key Files (After - if authStore decomposed into 5 children, only 2 relevant)
- `src/stores/auth/currentUser.js`
- `src/stores/auth/permissions.js`

## Key Files (After - if authStore decomposed into 4 children, 3 relevant)
- `src/stores/authStore/` (parent covers most children)
```

### 4.3 Terminology Consistency Check

**For file lifecycle terminology**:
- Compare terms in `targetDoc` with canonical definitions in `@docs/architecture/file-lifecycle.md`
- Flag any deviations from canonical terms:
  - "duplicate" vs "copy" vs "redundant"
  - "Original" vs "Source" vs "Upload" vs "Batesed"
  - "best" vs "primary"
  - "file metadata" usage

**For deduplication terminology**:
- Verify correct usage per CLAUDE.md section 4:
  - "duplicate" = identical hash + metadata, no informational value
  - "redundant" = hash-verified duplicates awaiting removal
  - "copy" = same hash but meaningful metadata differences
  - "best/primary" = file with most meaningful metadata

**For authentication terminology**:
- "Solo Firm" (firmId === userId)
- Auth state machine states: `uninitialized`, `initializing`, `authenticated`, `unauthenticated`, `error`

### 4.4 Cross-Reference Validation

**Validate all `@path` references**:
1. Extract all references like `@docs/architecture/overview.md` or `@src/stores/authStore.js`
2. Use Read tool to verify each file exists
3. Flag broken or outdated references
4. Suggest corrections for moved/renamed files

**Check inline code examples**:
1. Verify component names exist in codebase (use Glob)
2. Check store names match actual Pinia stores
3. Validate function/method names in code snippets

---

## Step 5: Generate Reconciliation Report

Create a structured summary with the following sections:

### Report Structure

```markdown
# Documentation Reconciliation Report
**File**: [targetDoc]
**Reconciliation Date**: [current date YYYY-MM-DD]
**Git commit**: [current HEAD]
**Last Reconciled**: [lastReconciledDate or "Never (first reconciliation)"]

---

## Key Files Status

### Current Key Files Section
[Show what's currently in the doc, or "Not present - needs to be created"]

### Recommended Key Files Updates
- **Add**: [files that should be added]
- **Remove**: [files that no longer exist or aren't relevant]
- **Decomposition updates**:
  - [Parent file X] decomposed → Replace with: [child files Y, Z]
  - [Parent file A] decomposed → Keep parent (covers 3/4 relevant children)

---

## Files Reviewed

### Source Files Examined (Holistic Check)
- [List all Key Files read for current state comparison]
- [Additional files checked based on documentation references]

### Git Commits Checked
- **Date range**: [lastReconciledDate] to [today]
- **Commits found**: [N total, stopped after 5 relevant]
- **Key commits**:
  1. [commit hash] - [summary] - affected: [files]
  2. [commit hash] - [summary] - affected: [files]
  ...up to 5

---

## Issues Found

### Key Files Section Issues ([count])
1. **Missing section**: Key Files section doesn't exist - needs to be created
2. **Decomposed file**: `src/stores/authStore.js` → Split into 5 children, only 2 relevant
   - Recommendation: Replace with `auth/currentUser.js`, `auth/permissions.js`
3. **Broken reference**: `src/utils/oldHelper.js` no longer exists

### Terminology Inconsistencies ([count])
1. [Line X]: Uses "[term]" but should use "[canonical term]" per file-lifecycle.md
2. [Line Y]: Incorrect usage of "[term]" - see definition in [reference doc]

### Broken Cross-References ([count])
1. [Line X]: `@path/to/old/file.js` → File moved to `new/path/file.js`
2. [Line Y]: `@src/components/Removed.vue` → Component no longer exists

### Code Misalignment ([count])
1. [Line X]: Code example shows old API signature
   - **Documented**: `function foo(arg1)`
   - **Actual**: `function foo(arg1, arg2)` (current implementation)
2. [Line Y]: Component name changed
   - **Documented**: `OldComponentName`
   - **Actual**: `NewComponentName`
3. [Section Z]: Describes pattern X, but code now uses pattern Y

---

## Suggested Updates

### High Priority
- [ ] Update "Reconciled up to" date to [current date]
- [ ] Fix Key Files section per recommendations above
- [ ] Update terminology on lines [X, Y, Z] to match canonical definitions
- [ ] Fix broken cross-reference on line [N]

### Medium Priority
- [ ] Update code example on line [M] to reflect current API
- [ ] Revise architectural description in section [S] to match current implementation

### Low Priority
- [ ] Consider adding cross-reference to new related documentation
- [ ] Update code example formatting for consistency

---

## Summary
- **Total issues**: [N]
- **Key Files section**: [N issues]
- **Terminology**: [N issues]
- **Cross-references**: [N issues]
- **Code alignment**: [N issues]

**Recommendation**: [Suggest immediate updates / No critical issues / etc.]
```

---

## Step 6: Present Findings and Await Approval (or Auto-Proceed in YOLO Mode)

**Check timeout (YOLO Mode only):**
- If `yoloMode = true` and more than 20 minutes have elapsed:
  - Display: "⏱️ YOLO MODE TIMEOUT - 20 minutes exceeded"
  - Display the reconciliation report
  - Stop without modifying files
  - Exit command

**Normal Mode (yoloMode = false):**
1. **Display the reconciliation report** to the user
2. **Do NOT modify any files** without explicit approval
3. **Offer to make updates**:
   - "I found [N] issues in [targetDoc]. Would you like me to update the documentation to fix these?"
4. Wait for user approval before proceeding

**YOLO Mode (yoloMode = true):**
1. **Display the reconciliation report** to the user
2. **Display YOLO mode decision**:
   - "🤖 YOLO MODE: Auto-proceeding with reconciliation"
   - "📝 Updating: [targetDoc]"
   - "🔒 ONE FILE CONSTRAINT: No other files will be modified"
3. **Automatically proceed** to Post-Reconciliation Workflow (no approval needed)

**If approved (Normal Mode) or YOLO Mode active, follow the Post-Reconciliation Workflow:**

### Post-Reconciliation Workflow

1. **Create new reconciled file with date prefix:**
   - Generate new filename: `YY-MM-DD-[original-name].md` (using today's date)
   - If original already has a date prefix, replace it with today's date
   - Example: `architecture.md` → `25-11-18-architecture.md`
   - Example: `24-10-15-auth.md` → `25-11-18-auth.md`

2. **Write the reconciled content to the new file:**
   - Use Write tool to create the new dated file
   - Include ALL updates from the reconciliation:
     - Updated "Reconciled up to: [date]" at top
     - Fixed Key Files section
     - Corrected terminology, cross-references, and code examples
     - Remove ONLY obsolete/inaccurate information
     - Preserve ALL accurate and important information

3. **Double-check preservation of important information:**
   - Read both the original file and the new reconciled file
   - Compare section by section to ensure:
     - ✅ All important concepts are preserved
     - ✅ All accurate technical details remain
     - ✅ All valid cross-references are maintained
     - ✅ Only outdated/incorrect information was removed
   - Create a comparison report:
     ```markdown
     ## Reconciliation Verification

     ### Content Preserved
     - [List key sections/concepts that were preserved]

     ### Content Removed
     - [List only obsolete/incorrect content that was removed]

     ### Content Updated
     - [List sections that were corrected/improved]

     ### Verification Status
     - ✅ All important information preserved
     - ✅ Only obsolete information removed
     - ✅ Safe to delete original file
     ```

4. **Delete original file only after verification:**
   - **CRITICAL**: Only proceed if verification confirms all important info is preserved
   - Use Bash to remove the original file:
     ```bash
     rm "path/to/original-file.md"
     ```
   - Confirm deletion: "Original file deleted. Reconciliation complete."

5. **If NOT approved:**
   - Save report for user review
   - Do not create new file or delete original

---

## Important Constraints

- **MODIFY TARGET FILE ONLY**: This command modifies ONLY the target documentation file. Source code files and other documentation files MUST NOT be modified during reconciliation.
  - **YOLO MODE**: This constraint is CRITICAL in YOLO mode - only ONE file may be modified
- **NO CLAUDE.md files**: Reject any attempt to reconcile files named `CLAUDE.md`
- **NO files dated today**: Reject files with today's date prefix (YY-MM-DD) - too recent for reconciliation
- **YOLO MODE TIME LIMIT**: YOLO mode has a strict 20-minute timeout from command start
- **YOLO MODE TECHNICAL BLOCKS**: YOLO mode stops if unable to make judgment calls (see Technical Blocks below)
- **Date-based naming convention**: All documentation files MUST begin with `YY-MM-DD` format
- **Files without dates need reconciliation**: Any file lacking the `YY-MM-DD` prefix requires reconciliation
- **Date-limited search**: Only look at commits since `lastReconciledDate`
- **5-commit limit**: Stop commit-by-commit analysis after finding 5 relevant changes
- **Holistic comparison**: Always compare documentation to CURRENT code state, not just recent commits
- **50% Key Files rule**: Apply parent vs. children logic when files are decomposed
- **READ-ONLY by default**: This command only analyzes and reports, does not modify files without approval
- **Create dated file on reconciliation**: After successful reconciliation, create new file with `YY-MM-DD` prefix
- **Verify before deletion**: MUST verify all important info is preserved before deleting original file
- **Preserve all accurate info**: Remove ONLY obsolete/incorrect information during reconciliation
- **Key Files section required**: MUST create Key Files section if it is missing from the target documentation
- **Fix all cross-references**: MUST validate and fix all `@path` references to ensure they point to existing files
- **Update all terminology**: MUST align all technical terms with canonical definitions from architecture documentation
- **Single source of truth**: When terminology conflicts, defer to `@docs/architecture/file-lifecycle.md`
- **Exact terminology**: MUST use canonical terms from architecture docs
- **Verify before suggesting**: Only flag issues that are confirmed by reading source code
- **No assumptions**: If uncertain about a term or reference, note it as "needs manual review"
- **Preserve formatting**: When suggesting updates, maintain original markdown formatting
- **Update reconciliation date**: Always update "Reconciled up to" date when making changes

---

## Technical Blocks (YOLO Mode)

**YOLO mode stops immediately if any of these occur:**

1. **Ambiguous terminology with no canonical source**:
   - Cannot find definition in `@docs/architecture/file-lifecycle.md` or other canonical docs
   - Multiple conflicting definitions exist without clear precedence
   - Action: Display error, show partial reconciliation report, exit

2. **Missing critical source files**:
   - Key Files reference files that no longer exist AND cannot determine replacement
   - No git history available to trace file moves/renames
   - Action: Display error, show partial reconciliation report, exit

3. **Circular or broken cross-references**:
   - Documentation references file A, which references file B, which references file A
   - Cannot resolve which version is correct
   - Action: Display error, show partial reconciliation report, exit

4. **Corrupted or unreadable target file**:
   - Target documentation file cannot be read or parsed
   - File encoding issues prevent reliable edits
   - Action: Display error, exit immediately

5. **Git operations fail**:
   - Cannot access git history when needed for reconciliation
   - Repository state prevents reliable analysis
   - Action: Continue with holistic comparison only, note limitation in report

**When technical block occurs:**
- Display: "🛑 YOLO MODE TECHNICAL BLOCK - Cannot proceed"
- Explain the specific block encountered
- Show all findings gathered up to the blocking point
- Exit without modifying any files

---

## Usage Examples

```bash
# Reconcile specific documentation file
/doc-reconcile docs/architecture/file-processing.md

# Reconcile authentication documentation
/doc-reconcile docs/architecture/authentication.md

# Auto-select a file that needs reconciliation (no user prompt)
# Will automatically choose the first valid candidate
/doc-reconcile

# YOLO MODE: Auto-select file and reconcile without approval
# Continues until complete, blocked, or 20 minutes elapsed
/doc-reconcile YOLO
```

---

## Error Handling

**If no candidates found when $ARGUMENTS is empty or "YOLO"**:
- Display: "No documentation files found that need reconciliation"
- Explain: "All markdown files in docs/ either:"
  - Have today's date prefix (too recent)"
  - Are named CLAUDE.md (configuration files, not reconcilable)"
  - Already have date prefixes from previous reconciliations"
- Suggest: "Specify a target file explicitly if you want to reconcile a specific dated file"
- **YOLO MODE**: Exit immediately if no candidates found

**If target file doesn't exist**:
- Display: "File not found: `$ARGUMENTS`"
- Suggest: "Did you mean: [similar filenames]?"

**If file is named CLAUDE.md**:
- Display: "Cannot reconcile CLAUDE.md files - these are configuration files, not documentation"
- Suggest: "Did you mean a file in the docs/ directory?"

**If file has today's date prefix**:
- Display: "Cannot reconcile `$ARGUMENTS` - file dated today (YY-MM-DD)"
- Explain: "Files with today's date are too recent for meaningful reconciliation"
- Suggest: "Wait at least one day after creation before reconciling"

**If not a markdown file**:
- Display: "Not a markdown file: `$ARGUMENTS`"
- Ask: "Did you want to reconcile documentation for this source file instead?"

**If verification fails during post-reconciliation**:
- Display: "⚠️ Verification failed - important information may be missing from reconciled file"
- Show comparison report highlighting missing content
- **Normal Mode**: Ask: "Do you want to manually review before deleting the original file?"
- **YOLO MODE**:
  - Display: "🛑 YOLO MODE SAFETY STOP - Verification failed"
  - Keep both files (original and reconciled)
  - Display: "Original file preserved due to verification failure"
  - Exit command
- **Do NOT delete original file** until verified safe (or user confirms in Normal Mode)

**If no Key Files section exists**:
- Note in report: "Key Files section missing - will suggest creation"
- Identify key files from documentation content
- Propose Key Files section in recommendations

**If no recent code changes found**:
- Display: "No commits found since [lastReconciledDate] affecting relevant files"
- Continue with holistic comparison, cross-reference, and terminology checks
- **YOLO MODE**: Continue to completion - this is not a blocking error

**If git is not available**:
- Skip Step 3 (recent changes check)
- Perform holistic comparison (Step 4.1) using current file state only
- Note in report: "Git history not checked - git not available"
- **YOLO MODE**: Continue to completion - this is not a blocking error

---

## YOLO Mode Completion Summary

**When YOLO mode completes successfully:**
1. Display: "✅ YOLO MODE COMPLETE"
2. Show reconciliation statistics:
   - Time elapsed: [X minutes]
   - Target file: [path to reconciled file with YY-MM-DD prefix]
   - Issues fixed: [count]
   - ONE FILE MODIFIED: ✅ (constraint satisfied)
3. Confirm: "Ready for commit and push to branch"

**When YOLO mode exits early:**
1. Display reason: Timeout / Technical Block / Verification Failure / No Candidates
2. Show all findings gathered up to exit point
3. Files modified: **NONE** (if exited before reconciliation) or **ONE** (if verification failed)
4. Next steps: Suggest manual intervention or normal mode retry

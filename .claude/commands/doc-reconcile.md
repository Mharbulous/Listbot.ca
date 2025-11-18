# Documentation Reconciliation

Sync documentation file with recent code changes, validate cross-references, and check terminology consistency.

**Target file**: `$ARGUMENTS`

---

## Step 1: Validate Target Documentation File

**If $ARGUMENTS is provided:**
- Verify the file path exists (use Read tool)
- Confirm it's a markdown documentation file (`.md` extension)
- **REJECT if filename is `CLAUDE.md`** - these are not valid targets for reconciliation
- Store the file path as `targetDoc`
- Display: "Reconciling documentation: `$ARGUMENTS`"

**If $ARGUMENTS is empty:**
1. Search for recently modified markdown files in `docs/` directory using Bash:
   ```bash
   git log --since="2 weeks ago" --name-only --pretty=format: -- docs/**/*.md | sort -u | head -10
   ```
2. Filter out any files named `CLAUDE.md`
3. Present the top 3-5 candidates to the user
4. Use AskUserQuestion to let user select which file to reconcile
5. Store selected file as `targetDoc`

**Validation checks:**
- File must exist and be readable
- File must be in the `docs/` directory
- File extension must be `.md`
- **File must NOT be named `CLAUDE.md`** (configuration files are not valid reconciliation targets)

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

## Step 6: Present Findings and Await Approval

1. **Display the reconciliation report** to the user
2. **Do NOT modify any files** without explicit approval
3. **Offer to make updates**:
   - "I found [N] issues in [targetDoc]. Would you like me to update the documentation to fix these?"
   - If approved, use Edit tool to make changes including:
     - Updating "Reconciled up to: [date]" at top of file
     - Fixing Key Files section
     - Correcting terminology, cross-references, and code examples
   - If not approved, save report for user review

---

## Important Constraints

- **NO CLAUDE.md files**: Reject any attempt to reconcile files named `CLAUDE.md`
- **Date-limited search**: Only look at commits since `lastReconciledDate`
- **5-commit limit**: Stop commit-by-commit analysis after finding 5 relevant changes
- **Holistic comparison**: Always compare documentation to CURRENT code state, not just recent commits
- **50% Key Files rule**: Apply parent vs. children logic when files are decomposed
- **READ-ONLY by default**: This command only analyzes and reports, does not modify files
- **Single source of truth**: When terminology conflicts, defer to `@docs/architecture/file-lifecycle.md`
- **Exact terminology**: MUST use canonical terms from architecture docs
- **Verify before suggesting**: Only flag issues that are confirmed by reading source code
- **No assumptions**: If uncertain about a term or reference, note it as "needs manual review"
- **Preserve formatting**: When suggesting updates, maintain original markdown formatting
- **Update reconciliation date**: Always update "Reconciled up to" date when making changes

---

## Usage Examples

```bash
# Reconcile specific documentation file
/doc-reconcile docs/architecture/file-processing.md

# Reconcile authentication documentation
/doc-reconcile docs/architecture/authentication.md

# Auto-select from recently modified docs
/doc-reconcile
```

---

## Error Handling

**If target file doesn't exist**:
- Display: "File not found: `$ARGUMENTS`"
- Suggest: "Did you mean: [similar filenames]?"

**If file is named CLAUDE.md**:
- Display: "Cannot reconcile CLAUDE.md files - these are configuration files, not documentation"
- Suggest: "Did you mean a file in the docs/ directory?"

**If not a markdown file**:
- Display: "Not a markdown file: `$ARGUMENTS`"
- Ask: "Did you want to reconcile documentation for this source file instead?"

**If no Key Files section exists**:
- Note in report: "Key Files section missing - will suggest creation"
- Identify key files from documentation content
- Propose Key Files section in recommendations

**If no recent code changes found**:
- Display: "No commits found since [lastReconciledDate] affecting relevant files"
- Continue with holistic comparison, cross-reference, and terminology checks

**If git is not available**:
- Skip Step 3 (recent changes check)
- Perform holistic comparison (Step 4.1) using current file state only
- Note in report: "Git history not checked - git not available"

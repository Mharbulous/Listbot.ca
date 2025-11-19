# Documentation Reconciliation

Sync documentation file with recent code changes, validate cross-references, and check terminology consistency.

**Target file**: `$ARGUMENTS`

---

## Step 1: Validate Target Documentation File

**If $ARGUMENTS is provided:**
- Verify the file path exists (use Read tool)
- Confirm it's a markdown documentation file (`.md` extension)
- Store the file path as `targetDoc`
- Display: "Reconciling documentation: `$ARGUMENTS`"

**If $ARGUMENTS is empty:**
1. Search for recently modified markdown files in `docs/` directory using Bash:
   ```bash
   git log --since="2 weeks ago" --name-only --pretty=format: -- docs/**/*.md | sort -u | head -10
   ```
2. Present the top 3-5 candidates to the user
3. Use AskUserQuestion to let user select which file to reconcile
4. Store selected file as `targetDoc`

**Validation checks:**
- File must exist and be readable
- File must be in the `docs/` directory
- File extension must be `.md`

---

## Step 2: Analyze Documentation Content

Read the target documentation file and extract:

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

## Step 3: Check Recent Code Changes

Identify code files related to the documentation topic:

1. **Run git log** to see recent commits affecting relevant files:
   ```bash
   git log -n 30 --name-only --oneline
   ```

2. **Map documentation topics to source files**:
   - If doc mentions authentication → check `src/stores/authStore.js`, `src/router/index.js`
   - If doc mentions file processing → check `src/stores/firmStore.js`, `src/workers/fileHashWorker.js`
   - If doc mentions components → check `src/components/`, `src/views/`

3. **Read relevant source files** to verify current implementation:
   - Use Read tool to examine source code
   - Focus on areas mentioned in documentation
   - Note any discrepancies

---

## Step 4: Reconciliation Analysis

Perform three types of checks:

### 4.1 Terminology Consistency Check

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

### 4.2 Cross-Reference Validation

**Validate all `@path` references**:
1. Extract all references like `@docs/architecture/overview.md` or `@src/stores/authStore.js`
2. Use Read tool to verify each file exists
3. Flag broken or outdated references
4. Suggest corrections for moved/renamed files

**Check inline code examples**:
1. Verify component names exist in codebase (use Glob)
2. Check store names match actual Pinia stores
3. Validate function/method names in code snippets

### 4.3 Code Alignment Check

**Compare documented behavior with actual implementation**:

1. **For code snippets**:
   - Read the actual source file
   - Compare snippet with current code
   - Flag if API signatures have changed
   - Check if line numbers are still accurate

2. **For architectural descriptions**:
   - Verify described patterns match current implementation
   - Check if component relationships are current
   - Validate state management flows

3. **For configuration/commands**:
   - Verify npm scripts exist in `package.json`
   - Check command syntax is current
   - Validate file paths in examples

---

## Step 5: Generate Reconciliation Report

Create a structured summary with the following sections:

### Report Structure

```markdown
# Documentation Reconciliation Report
**File**: [targetDoc]
**Date**: [current date]
**Git commit**: [current HEAD]

---

## Files Reviewed
- Source files examined: [list]
- Related documentation: [list]
- Git commits checked: [last N commits]

---

## Issues Found

### Terminology Inconsistencies ([count])
1. [Line X]: Uses "[term]" but should use "[canonical term]" per file-lifecycle.md
2. [Line Y]: Incorrect usage of "[term]" - see definition in [reference doc]

### Broken Cross-References ([count])
1. [Line X]: `@path/to/old/file.js` → File moved to `new/path/file.js`
2. [Line Y]: `@src/components/Removed.vue` → Component no longer exists

### Code Misalignment ([count])
1. [Line X]: Code example shows old API signature
   - **Documented**: `function foo(arg1)`
   - **Actual**: `function foo(arg1, arg2)` (as of commit abc123)
2. [Line Y]: Component name changed
   - **Documented**: `OldComponentName`
   - **Actual**: `NewComponentName`

---

## Suggested Updates

### High Priority
- [ ] Update terminology on lines [X, Y, Z] to match canonical definitions
- [ ] Fix broken cross-reference on line [N]

### Medium Priority
- [ ] Update code example on line [M] to reflect current API
- [ ] Verify architectural description still accurate

### Low Priority
- [ ] Consider adding cross-reference to new related documentation
- [ ] Update modification date

---

## Summary
- **Total issues**: [N]
- **Terminology**: [N]
- **Cross-references**: [N]
- **Code alignment**: [N]

**Recommendation**: [Suggest immediate updates / No critical issues / etc.]
```

---

## Step 6: Present Findings and Await Approval

1. **Display the reconciliation report** to the user
2. **Do NOT modify any files** without explicit approval
3. **Offer to make updates**:
   - "I found [N] issues. Would you like me to update the documentation to fix these?"
   - If approved, use Edit tool to make changes
   - If not approved, save report for user review

---

## Important Constraints

- **READ-ONLY by default**: This command only analyzes and reports, does not modify files
- **Single source of truth**: When terminology conflicts, defer to `@docs/architecture/file-lifecycle.md`
- **Exact terminology**: MUST use canonical terms from architecture docs
- **Verify before suggesting**: Only flag issues that are confirmed by reading source code
- **No assumptions**: If uncertain about a term or reference, note it as "needs manual review"
- **Preserve formatting**: When suggesting updates, maintain original markdown formatting
- **Context-aware**: Consider the documentation's purpose when flagging issues

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

**If not a markdown file**:
- Display: "Not a markdown file: `$ARGUMENTS`"
- Ask: "Did you want to reconcile documentation for this source file instead?"

**If no recent code changes found**:
- Display: "No recent commits found related to this documentation"
- Continue with cross-reference and terminology checks only

**If git is not available**:
- Skip Step 3 (recent changes check)
- Perform Steps 2, 4.1, and 4.2 only
- Note in report: "Git history not checked - git not available"

Review the file at path: `$ARGUMENTS`

## Exception List - Do NOT Decompose

The following files are **EXEMPT** from the 300-line limit and should **NEVER** be decomposed:

- `src/components/base/DocumentTable.vue` - Virtual scrolling implementation (tight coupling required)

**If the file is on the exception list:**
- Inform the user that this file is exempt from streamlining
- Explain why it's on the exception list
- Do NOT proceed with decomposition

## File Selection

If the user has not specified a specific file, then review the files in the documentation file, `docs\2025-11-15-Folder-Structure.md`, and identify candidate files that would benefit most from decomposition and refactoring.

**Line Count Validation (During Selection Phase):**
- When reading each file to evaluate it as a candidate, count the actual number of lines of code (excluding comments)
- Compare the actual line count with the documented line count in `docs\2025-11-15-Folder-Structure.md`
- If there is a mismatch, inform the user: "Found miscount in Folder-Structure.md - [file path] has [actual count] lines"
- Do NOT mention the incorrect documented count
- Track all miscounted files and their corrected line counts for later updating
- **Do NOT update Folder-Structure.md during the selection phase** - preserve context memory for intelligent streamlining

**Selection Strategy:**
- Identify the three best candidate files that would benefit most from decomposition and refactoring
- However, once you find a file that would obviously benefit, stop searching and select that file
- If you find no obvious candidate, choose one file from the three identified candidates based on which would benefit most from decomposition or refactoring


**Virtual Scrolling Detection:**
- Check if the file contains virtual scrolling implementation (e.g., `virtual-scroller`, `virtual-scroll`, Vuetify's `v-virtual-scroll`)
- Virtual scrolling requires tight coupling between template, logic, and state that CANNOT be safely decomposed
- If virtual scrolling logic is detected, **WARN the user** before proceeding

## Decomposition Decision

**If the file has MORE than 300 lines of code:**

1. **Create a Decomposition Plan**
   - Break the file down into smaller files, each with 200 lines of code or less
   - Decompose logically by area of concern to improve readability and maintainability
   - **Preserve design, appearance, behavior, and functionality EXACTLY** - no changes to how it works
   - Follow the DRY (Don't Repeat Yourself) principle UNLESS it would:
     - Add significant complexity
     - Make code less readable
     - Make code less maintainable
   - In such cases, the KISS (Keep It Simple, Stupid) principle takes priority over DRY

2. **Present Plan for Approval**
   - Show the user your decomposition plan
   - Explain the logical groupings and file structure
   - Wait for user comment and approval before proceeding

3. **Compact Conversation (After File Selection)**
   - Once the file is selected and approved, use the `/compact` command to compress conversation history
   - Use this exact format: `/compact Focus on information relating to the file [target file path] in preparation for decomposition, and preserve the filepaths and corrected line-counts of any mis-counted files from Folder-Structure.md`
   - This preserves context memory for intelligent decomposition

4. **Execute Decomposition (After Approval and Compact)**
   - Move the original file to `/deprecated` folder as a backup reference
   - Create new files according to the approved plan
   - Build each new file from scratch in the most elegant and simple way possible
   - Strictly preserve appearance, functionality, and behavior exactly as the original

5. **Update Documentation (After Completion)**
   - Update `docs\2025-11-15-Folder-Structure.md` with:
     - Corrected line counts for any miscounted files discovered during selection
     - New file structure reflecting the decomposition
     - Line counts for all newly created files
   - Remove or mark as deprecated the original file entry

6. **Provide Test Suggestions**
   - Upon completion, suggest specific tests for the user to try on the local server
   - Assume the local server is already running unless explicitly told otherwise

**If the file has 300 lines or LESS:**

1. **Rebuild the File**
   - Instead of decomposing the selected file, rebuild it from scratch in a more elegant way
   - Count the number of lines of code (excluding comments) of the rebuilt file

2. **Evaluate Results**
   - If the rebuilt file uses fewer lines of code (excluding comments), issue a PR
   - Otherwise, if the file has an equal or greater number of lines of code, report to the user that you were unable to streamline the file, and offer to lengthen the file instead

3. **Update Documentation (If Successful)**
   - Update `docs\2025-11-15-Folder-Structure.md` with:
     - Corrected line counts for any miscounted files discovered during selection
     - Updated line count for the streamlined file (if it was successfully reduced)

## Important Constraints

- **NO functional changes** - reproduce existing functionality exactly
- **NO design changes** - preserve visual appearance exactly
- **NO behavioral changes** - maintain all existing behavior
- Prioritize readability and maintainability
- Look for opportunities to apply the DRY principle unless doing so would compromise readability or maintainability.
- Follow the project's existing patterns and conventions
- Consult `@docs/architecture/overview.md` for project structure guidelines
- Delegate linting to the beautifier agent after file creation

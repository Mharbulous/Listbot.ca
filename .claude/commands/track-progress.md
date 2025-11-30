# /track-progress

Review and maintain planning files at path: `$ARGUMENTS`

## Progress Tracking Index Maintenance

**On every invocation**, check for the progress tracking index file:

1. Look for any file matching the pattern `planning/YYYY-MM-DD-progress-tracking.md`
2. Extract the date from the filename and compare to today's date

**If NO progress-tracking file exists OR the date is in the PAST:**

1. Scan all files in `/planning` and its subfolders
2. Create a new `planning/YYYY-MM-DD-progress-tracking.md` (using today's date)
3. For each planning file found, record:
   - File path
   - Brief description (first heading or summary)
   - Current status: `🔴 Abandoned` | `🟡 Active` | `🟢 Completed` | `⚪ Unknown`
   - Priority (for Active items): `P1-Critical` | `P2-High` | `P3-Medium` | `P4-Low` | `Unranked`
   - Last modified date
4. Move any previous outdated progress-tracking files to `/deprecated` folder
5. Report to the user: "Progress tracking index was outdated (or missing) and has been recreated. Please review the status assignments and priorities, then run /track-progress again to proceed with cleanup."
6. **STOP** - Do NOT proceed with cleanup in this session

**If the progress-tracking file date is CURRENT (today):**
- Proceed with the normal triage process below

## File Selection for Triage

**When no target file is specified (`$ARGUMENTS` is empty):**

Review `planning/YYYY-MM-DD-progress-tracking.md` and select a file for triage using this priority:

1. **PRIORITY 1**: Files with `⚪ Unknown` status (need initial triage)
2. **PRIORITY 2**: Files with `🟢 Completed` status (need documentation)
3. **PRIORITY 3**: Files with `🔴 Abandoned` status (need cleanup confirmation)
4. **PRIORITY 4**: Files with `🟡 Active` + `Unranked` priority (need prioritization)

**When a target file IS specified:**
- Skip file selection and proceed directly to triage for the specified file

## Triage Process

### For Files with `⚪ Unknown` Status

1. **Analyze the Planning File**
   - Read the file content thoroughly
   - Look for indicators of status:
     - **Completed**: References to merged PRs, "done", "implemented", "shipped", code references that exist
     - **Abandoned**: Old dates with no activity, superseded by other plans, marked as "won't do", "cancelled"
     - **Active**: Recent updates, clear next steps, ongoing relevance

2. **Present Assessment to User**
   - Summarize the plan's purpose
   - Explain your status recommendation with evidence
   - Ask for user confirmation or correction

3. **Update Index (After Confirmation)**
   - Update the status in `planning/YYYY-MM-DD-progress-tracking.md`
   - If marked Active, ask user to assign priority (P1-P4)

### For Files with `🟢 Completed` Status

1. **Review Implementation**
   - Identify what was implemented from the plan
   - Locate relevant code files, components, or features

2. **Check for Existing Documentation**
   - Search `/docs` and subfolders for documentation related to this feature
   - If documentation exists, proceed to step 3a
   - If no documentation exists, proceed to step 3b

3a. **Update Existing Documentation**
   - Compare the planning file against existing documentation
   - Identify any non-obvious information missing from the docs
   - "Non-obvious" = anything that would NOT be assumed without explicitly stating it
   - Draft updates to add only the missing non-obvious information
   - Present proposed updates to user for approval

3b. **Create New Documentation**
   - Draft documentation for the completed feature/implementation
   - Follow project documentation conventions
   - Place in appropriate `/docs` subfolder
   - Present documentation to user for approval

4. **Archive the Planning File (After Approval)**
   - Move the planning file to `/planning/archived/` folder
   - Update `planning/YYYY-MM-DD-progress-tracking.md` to reflect archival
   - Create or update the approved documentation

### For Files with `🔴 Abandoned` Status

1. **Confirm Abandonment**
   - Summarize why this plan appears abandoned
   - Ask user to confirm deletion or reclassify

2. **Clean Up (After Confirmation)**
   - Move file to `/planning/abandoned/` (or delete if user prefers)
   - Update `planning/YYYY-MM-DD-progress-tracking.md` to remove entry

### For Files with `🟡 Active` + `Unranked` Priority

1. **Summarize the Plan**
   - Provide a brief overview of the plan's goals and scope
   - Identify dependencies or blockers if mentioned

2. **Request Priority Assignment**
   - Present priority options:
     - `P1-Critical`: Blocking other work, urgent business need
     - `P2-High`: Important, should be done soon
     - `P3-Medium`: Valuable but not urgent
     - `P4-Low`: Nice to have, do when time permits
   - Ask user to assign priority

3. **Update Index**
   - Record the assigned priority in `planning/YYYY-MM-DD-progress-tracking.md`

## Progress Tracking File Format

```markdown
# Progress Tracking Index
Generated: YYYY-MM-DD

## Summary
- Total Plans: X
- 🟢 Completed (pending documentation): X
- 🟡 Active: X
- 🔴 Abandoned (pending cleanup): X
- ⚪ Unknown (pending triage): X

## Active Plans by Priority

### P1-Critical
| File | Description | Last Modified |
|------|-------------|---------------|

### P2-High
| File | Description | Last Modified |
|------|-------------|---------------|

### P3-Medium
| File | Description | Last Modified |
|------|-------------|---------------|

### P4-Low
| File | Description | Last Modified |
|------|-------------|---------------|

### Unranked
| File | Description | Last Modified |
|------|-------------|---------------|

## Completed (Pending Documentation)
| File | Description | Completed Approx |
|------|-------------|------------------|

## Abandoned (Pending Cleanup)
| File | Description | Reason |
|------|-------------|--------|

## Unknown (Pending Triage)
| File | Description | Last Modified |
|------|-------------|---------------|

## Archived
| Original File | Documentation Created | Archived Date |
|---------------|----------------------|---------------|
```

## Important Constraints

- **ONE file per session** - Triage one file at a time to maintain focus
- **User confirmation required** - Never change status, delete, or archive without explicit approval
- **Preserve planning content** - When archiving, move files rather than delete (unless user explicitly requests deletion)
- **Documentation quality** - Created documentation should follow project conventions and be comprehensive
- **Index accuracy** - Always update the progress-tracking index after any action
- **No assumptions** - When status is unclear, ask the user rather than guessing

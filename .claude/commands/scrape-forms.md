# Scrape Court Forms Command

**Target Directory**: `src/assets/precedents/CourtForms/`

## Step 1: Determine Target Jurisdiction

**If $ARGUMENTS is provided:**
- Parse the jurisdiction name from $ARGUMENTS
- Determine if it's a US State or Canadian Province
- Set `targetCountry` (USA or CAN) and `targetJurisdiction` accordingly

**If $ARGUMENTS is empty:**
1. Scan all existing subfolders in `src/assets/precedents/CourtForms/USA/` and `src/assets/precedents/CourtForms/CAN/`
2. Count the number of files in each jurisdiction subfolder
3. Create a list of jurisdictions with fewer than 3 documents
4. If multiple jurisdictions need documents, select ONE based on:
   - Priority to jurisdictions with 0 documents
   - Then jurisdictions with 1-2 documents
   - Prefer major jurisdictions (California, New York, Ontario, BC) if tied
5. If all jurisdictions have 3+ documents, select the one with the fewest documents
6. Report to user which jurisdiction was selected and why

## Step 2: Define Document Types to Search

Search for these types of court forms (prioritize in this order):
1. **Summons** - Document notifying defendant of lawsuit
2. **Complaint/Statement of Claim** - Initial filing outlining plaintiff's case
3. **Answer** - Defendant's response to complaint
4. **Motion for Summary Judgment** - Request for judgment without trial
5. **Subpoena** - Order to produce documents or testify

## Step 3: Web Search Strategy

For the target jurisdiction, perform web searches for:

**Search Query Pattern**:
```
"[jurisdiction] court forms" filetype:pdf [document type]
OR
"[jurisdiction] [document type] template" site:.gov
OR
"[jurisdiction] superior court [document type] sample"
```

**Example for California Summons**:
```
"California court forms" filetype:pdf summons site:.courts.ca.gov
```

**Search Guidelines**:
- Prioritize official government sources (.gov, .courts, official court websites)
- Look for actual completed examples, not blank templates
- Prefer recent documents (last 5 years)
- Aim to find 3-5 different examples for variety

## Step 4: Document Collection

For each document found:

1. **Use WebFetch** to retrieve the document content
2. **Verify** it's a legitimate example (not just a form, but a filled example)
3. **Extract key information**:
   - Document type (Summons, Complaint, etc.)
   - Court name
   - Case number (if visible)
   - Date (if visible)

## Step 5: Save Documents

**Folder Structure**:
```
src/assets/precedents/CourtForms/
├── USA/
│   ├── [State]/
│   │   ├── [DocumentType]-example-01.pdf
│   │   ├── [DocumentType]-example-02.pdf
│   │   └── ...
└── CAN/
    ├── [Province]/
    │   ├── [DocumentType]-example-01.pdf
    │   ├── [DocumentType]-example-02.pdf
    │   └── ...
```

**File Naming Convention**:
```
[DocumentType]-example-[number].pdf
```

Examples:
- `Summons-example-01.pdf`
- `Complaint-example-02.pdf`
- `Motion-Summary-Judgment-example-01.pdf`

**Save Process**:
1. Create jurisdiction subfolder if it doesn't exist
2. Save each document with descriptive filename
3. Use WebFetch to download the PDF content
4. Write the file using the Write tool

## Step 6: Create Index File

After collecting documents, create/update an `index.md` file in the jurisdiction folder:

**Format**:
```markdown
# [Jurisdiction] Court Forms

Last updated: [Date]

## Collected Documents

### Summons
- `Summons-example-01.pdf` - [Court Name], Case #[number] ([date])
- `Summons-example-02.pdf` - [Court Name], Case #[number] ([date])

### Complaint/Statement of Claim
- `Complaint-example-01.pdf` - [Court Name], Case #[number] ([date])

## Sources
- [URL 1] - Official court website
- [URL 2] - Court forms repository

## Notes
[Any relevant notes about jurisdiction-specific requirements]
```

## Step 7: Report Results

Provide a summary to the user:

```
✓ Collected court forms for: [Jurisdiction]
✓ Documents saved: [count]
✓ Document types: [list types collected]
✓ Location: src/assets/precedents/CourtForms/[Country]/[Jurisdiction]/

Files created:
- [filename 1]
- [filename 2]
- [filename 3]
- index.md

Next steps:
- Review documents for quality
- Consider collecting forms for: [suggest 2-3 other jurisdictions that need documents]
```

## Important Constraints

1. **Only collect 3-5 documents per command invocation** - Don't overwhelm the folder
2. **Verify source legitimacy** - Only use official court/government sources when possible
3. **Respect copyright** - These should be public domain court documents
4. **Check file size** - Warn if any PDF is over 5MB
5. **Avoid duplicates** - Check existing files before saving
6. **Privacy** - Ensure any example documents are from public court records

## Error Handling

- If web search fails, report which search queries were attempted
- If WebFetch fails, try alternative sources
- If fewer than 3 documents found, save what was found and report shortage
- If jurisdiction is ambiguous, ask user for clarification

## Jurisdiction Reference Lists

**US States** (abbreviations accepted):
CA/California, NY/New York, TX/Texas, FL/Florida, IL/Illinois, PA/Pennsylvania, OH/Ohio, GA/Georgia, NC/North Carolina, MI/Michigan, etc.

**Canadian Provinces** (abbreviations accepted):
ON/Ontario, QC/Quebec, BC/British Columbia, AB/Alberta, MB/Manitoba, SK/Saskatchewan, NS/Nova Scotia, NB/New Brunswick, NL/Newfoundland and Labrador, PE/Prince Edward Island

## Usage Examples

```bash
# Collect forms for specific jurisdiction
/scrape-forms California
/scrape-forms Ontario
/scrape-forms NY

# Auto-select jurisdiction that needs documents
/scrape-forms
```

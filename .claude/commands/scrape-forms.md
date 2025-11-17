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

Search for precedent of forms comparable to what in BC is known as a List of Documents, such as:
1. **Affidavit of Documents** 
2. **Affidavit of Records**
3. **List of Documents**
4. **Initial Disclosures**
5. **Response to Requests for Production of Documents**

## Step 3: Research Strategy

**Search Query Pattern**:
For information about the forms used in the selected jurisdiction start by reviewing this document:
`research\2025-11-16-LODanaloguesResearch.md`

**Use Research Agent**
Pass the actual research off to a specialized deep research agent.

**Search Guidelines**:
- Prioritize official government sources (.gov, .courts, official court websites)
- Look for a mix of completed examples and blank templates
- Prefer recent documents (last 5 years)
- Aim to find 3-5 different examples for variety

## Step 4: Document Collection

For each document found:

1. **Use WebFetch** to retrieve the document content
2. **Verify** it's a legitimate example
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
│   │   ├── [CountryCode][State/Prov][DocumentType]-example-01.pdf
│   │   ├── [CountryCode][State/Prov]-example-02.pdf
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
- `CANBC-List-of-Documents-04.pdf`
- `USACA-Initial-Disclosures-02.pdf`
- `CANFD-Affidavit-of-Documents-01.pdf`

**Save Process**:
1. Create jurisdiction subfolder if it doesn't exist
2. Save each document with descriptive filename
3. Use WebFetch to download the content
4. Write the file using the Write tool

## Step 6: Create Index File

After collecting documents, create/update an `index.md` file in the folder: src\assets\forms\Counter\StateProvince

# Court Forms of Document Discovery
Last updated: [Date]

## Collected Documents

- `Summons-example-01.pdf` - [CountryCode], [State/Prov], [Court Name], Case #[number] ([date])
- `Summons-example-02.pdf` - [CountryCode], [State/Prov], [Court Name], Case #[number] ([date])

## Notes
[Any relevant notes about jurisdiction-specific requirements]
```

## Important Constraints

1. **Only collect 3-5 documents per command invocation** - Don't overwhelm the folder
2. **Verify source legitimacy** - Only use official court/government sources when possible
3. **Check file size** - Warn if any PDF is over 10MB
4. **Avoid duplicates** - Check existing files before saving

## Error Handling

- If web search fails, report which search queries were attempted
- If WebFetch fails, try alternative sources
- If fewer than 3 documents found, save what was found and report shortage
- If jurisdiction is ambiguous, ask user for clarification

## Jurisdiction Reference Lists

**US States** (abbreviations accepted):
CA/California, NY/New York, TX/Texas, FL/Florida, IL/Illinois, PA/Pennsylvania, OH/Ohio, GA/Georgia, NC/North Carolina, MI/Michigan, FD/Federal

**Canadian Provinces** (abbreviations accepted):
ON/Ontario, QC/Quebec, BC/British Columbia, AB/Alberta, MB/Manitoba, SK/Saskatchewan, NS/Nova Scotia, NB/New Brunswick, NL/Newfoundland and Labrador, PE/Prince Edward Island, FD/Federal

## Usage Examples

```bash
# Collect forms for specific jurisdiction
/scrape-forms California
/scrape-forms Ontario
/scrape-forms NY
/scrape-forms US Federal

# Auto-select jurisdiction that needs documents
/scrape-forms 
```

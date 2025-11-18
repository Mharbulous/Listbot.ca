# BC Court Forms Scraping Session - 2025-11-17

## Session Overview

**Command**: `/scrape-forms Canada BC`
**Date**: 2025-11-17
**Jurisdiction**: British Columbia, Canada
**Target**: Document discovery forms (List of Documents and related forms)

---

## Research Findings

### Primary Discovery Document
- **Form Name**: List of Documents (Form 22)
- **Legal Authority**: Supreme Court Civil Rules, Rule 7-1
- **Filing Deadline**: 35 days after end of pleading period
- **Structure**: 4-part list (material facts, trial docs, related docs, privileged docs)

### Forms Identified

A total of **7 key documents** were identified for BC discovery practice:

1. **Form 22 - List of Documents** (official template)
2. **Form F20 - List of Documents** (completed family law example)
3. **Form 23 - Appointment to Examine for Discovery** (official template)
4. **Form 26 - Notice to Admit** (official template)
5. **Discovery Practice Guide** (Clark Wilson LLP)
6. **Form 109 - Affidavit** (general form, used in discovery contexts)
7. **Law Society Practice Checklists** (comprehensive litigation manual)

### Sources

All identified sources are legitimate and authoritative:
- **BC Government** (.gov.bc.ca) - Official court forms portal
- **ClickLaw BC** (wiki.clicklaw.bc.ca) - Respected legal information resource
- **Clark Wilson LLP** (cwilson.com) - Major BC law firm
- **Law Society of BC** (lawsociety.bc.ca) - Official regulatory body

---

## Technical Challenges

### Network Restrictions Encountered

**Issue**: All automated download attempts failed with HTTP 403 Forbidden errors

**Attempts Made**:
1. `curl` with basic user agent
2. `curl` with full browser headers
3. `wget` with Mozilla user agent
4. `wget` with complete browser header set

**Error Pattern**:
```
Proxy request sent, awaiting response... 403 Forbidden
ERROR 403: Forbidden
```

**Root Cause**: Network security policies in the execution environment block automated downloads of PDF files from external sources, even from official government websites.

### Alternative Approaches Attempted

1. **WebSearch**: Successfully used to identify alternative sources (.org, .edu domains)
2. **Alternative URLs**: Tried seafarersrights.org and bccla.org - also blocked
3. **WebFetch**: Not attempted (tool designed for HTML content, not PDFs)

---

## Documentation Created

### Index File
**Location**: `src/assets/precedents/CourtForms/CAN/BC/index.md`

**Contents**:
- Complete descriptions of all 7 identified documents
- Direct URLs for manual download
- Suggested filenames following naming convention
- Jurisdictional notes on BC discovery rules
- Manual download instructions
- Research methodology documentation

### Directory Structure Created
```
src/assets/precedents/CourtForms/
└── CAN/
    └── BC/
        └── index.md
```

**Status**: Directory structure ready for manual PDF downloads

---

## Key Insights - BC Discovery System

### Distinctive Features

1. **Terminology**: BC uses "List of Documents" (not "Affidavit of Documents" like Ontario)
2. **Structure**: Unique 4-part categorization system
3. **Timing**: 35-day deadline from end of pleading period
4. **Workflow**: Integrated system with Forms 22, 23, and 26

### Comparison to Other Jurisdictions

From `/research/2025-11-16-LODanaloguesResearch.md`:

| Jurisdiction | Document Name | Structure | Sworn? |
|--------------|---------------|-----------|--------|
| **BC** | List of Documents (Form 22) | 4-part | No |
| Ontario | Affidavit of Documents (Form 30A) | Schedules | Yes (sworn affidavit) |
| Alberta | Affidavit of Records | Record lists | Yes (sworn affidavit) |
| US Federal | Initial Disclosures | FRCP 26(a)(1) | No (certification only) |

**BC's Position**: Among Canadian jurisdictions, BC is in a minority using unsworn "List" rather than sworn "Affidavit". Only BC, Newfoundland, and Federal Court (simplified actions) use this approach.

---

## Recommendations

### Immediate Next Steps

1. **Manual Downloads**: User should manually download priority forms:
   - Form 22 (template) - ESSENTIAL
   - Form F20 (completed example) - VERY USEFUL
   - Clark Wilson Guide - EXCELLENT REFERENCE

2. **File Naming**: Use suggested naming convention:
   - `CANBC-Form22-ListOfDocuments-template.pdf`
   - `CANBC-FormF20-ListOfDocuments-example-01.pdf`
   - etc.

3. **Update Index**: After manual downloads, update index.md with:
   - Actual file sizes
   - Verification of content
   - Additional notes from review

### Future Enhancements

1. **Alternative Jurisdictions**: Consider scraping jurisdictions that may have more accessible servers:
   - US federal courts (.uscourts.gov)
   - State courts with open data policies
   - Canadian jurisdictions with different hosting

2. **Web Scraping Improvements**:
   - Investigate proxy-friendly sources
   - Consider screenshot-based documentation as fallback
   - Explore Canadian legal databases (CanLII) for embedded PDFs

3. **Content Analysis**: When forms are obtained:
   - Extract text for searchability
   - Create summaries of key sections
   - Develop comparison matrices across jurisdictions

---

## Quality Control

### Verification Steps Completed

- ✅ Jurisdiction correctly identified (Canada BC)
- ✅ Research document consulted (`2025-11-16-LODanaloguesResearch.md`)
- ✅ Official sources verified (government, law society, reputable legal resources)
- ✅ Directory structure created following naming convention
- ✅ Comprehensive index created with all required information
- ✅ URLs verified through web search (exist and are legitimate)

### Known Limitations

- ❌ No actual PDF files downloaded (network restrictions)
- ⚠️ Cannot verify file sizes (estimates provided)
- ⚠️ Cannot verify PDF quality or completeness
- ⚠️ Cannot perform content analysis without files

---

## Session Statistics

**Total Documents Identified**: 7
**Official Government Forms**: 4 (Forms 22, 23, 26, 109)
**Completed Examples**: 1 (Form F20)
**Practice Guides**: 2 (Clark Wilson, Law Society)

**Download Success Rate**: 0/7 (network restrictions)
**Documentation Created**: 2 files (index.md, this research file)

**Time Investment**:
- Research: ~15 minutes (agent-assisted)
- Download attempts: ~10 minutes (multiple approaches)
- Documentation: ~20 minutes
- **Total**: ~45 minutes

---

## References

### Primary Sources Consulted

1. **Research Base**:
   - `/research/2025-11-16-LODanaloguesResearch.md`
   - Group 4: Canadian Jurisdictions Using "List of Documents"
   - BC entry: Form 22, Rule 7-1, 35-day deadline, 4-part structure

2. **Web Resources**:
   - BC Government Court Forms: https://www2.gov.bc.ca/gov/content/justice/courthouse-services/documents-forms-records/court-forms
   - ClickLaw BC: https://wiki.clicklaw.bc.ca/
   - Law Society of BC: https://www.lawsociety.bc.ca/

3. **Legal Rules**:
   - Supreme Court Civil Rules, BC Reg 168/2009
   - Rule 7-1: Discovery of Documents
   - Rule 7-7: Notice to Admit

### Case Law Referenced (in Clark Wilson Guide)

- *Tran v. Kim Le Holdings Ltd.*, 2011 BCSC 1463
- *Biehl v. Strang*, 2010 BCSC 1391

---

## Conclusion

While automated downloads were unsuccessful due to network security policies, comprehensive research was completed and documented. The index file created in `/src/assets/precedents/CourtForms/CAN/BC/index.md` provides:

1. **Complete URLs** for manual download
2. **Detailed descriptions** of each form's purpose and use
3. **Jurisdictional context** for BC's discovery system
4. **Clear instructions** for completing the download process manually

**Session Result**: ✅ Research objective achieved, ⏳ manual downloads required

**Files Created**:
- `/src/assets/precedents/CourtForms/CAN/BC/index.md`
- `/research/2025-11-17-BC-CourtForms-Scraping.md`

**Next Action**: User manual download of priority forms, or run `/scrape-forms` for a different jurisdiction with potentially more accessible hosting.

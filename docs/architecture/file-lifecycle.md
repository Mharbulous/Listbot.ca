# Data Model & Naming Conventions

## File Lifecycle Terminology

The application distinguishes between related but distinct concepts in the file handling lifecycle. **Consistent use of this terminology is critical** throughout code, comments, UI text, and documentation.

### File Lifecycle

1. **Original** - The original real-world evidence

   - May be physical (paper receipt, printed invoice) or digital (email attachment, downloaded file)

2. **Source** - The digital file created or obtained by the user for upload to the application

   - Always digital: scanned PDF, smartphone photo, screenshot, downloaded file
   - This is what exists on the user's device/filesystem before upload

3. **Upload** - The digital file stored in Firebase Storage in the '../uploads' subfolder

   - Stored with hash-based deduplication (BLAKE3)
   - One **Upload** may be linked to multiple **Sources**

4. **Batesed** - **Upload** files that have been converted to PDF format, digitally bates stamped, and stored in Firebase Storage in the '../Batesed' subfolder

5. **Page** - **Batesed** files split into single page PDF files and stored in Firebase Storage in the '../Pages' subfolder for near duplicate analysis.

6. **Redacted** - **Batesed** files that have been redacted in preparation for production and saved in Firebase Storage in the '../Redacted' subfolder

7. **Production** - The final set of documents that have been approved for production and saved in Firebase storage in the '../Production' subfolder

   - Copied from a mix of **Batesed** files, **Redacted** files

8. **Storage** - Refers in general to all digital files saved in Firebase Storage, specifically: **Upload**, **Batesed**, **Page**, **Redacted**, and **Production**

   - Does not have its own subfolder.
   - Useful for describing functions, variables or constants that apply to all multiple file types; e.g. **Upload**, **Batesed**, **Page**, **Redacted**, and **Production**

9. **Document** - Refers in general to all versions of evidence, from **Original** to **Storage**, for situations where we are talking about all versions of the file. For example, 'Document Description' would be used to refer to text that is a description of the **Original** and of the **Source** and the **Storage** files in Firebase storage.

### Example Flow

```
Paper parking receipt (document, transaction date: Jan 15, 2025)
  ↓ User scans with phone
Scanned PDF on phone (source, file created: Jan 20, 2025)
  ↓ User uploads via app
PDF in Firebase Storage (file, uploaded: Jan 20, 2025, hash: abc123...)
```

### Usage Guidelines

**Variable Naming:**

```javascript
// Good - Clear and specific
const documentDate = receipt.transactionDate;
const sourceModifiedDate = fileObj.lastModified;
const fileUploadDate = metadata.uploadTimestamp;

// Avoid - Ambiguous
const date = ???; // Which date?
const fileDate = ???; // Source or upload date?
```

**UI/UX Text:**

- "Document date" or "Transaction date" for the business event date
- "Scanned on" or "Created on" for source file creation
- "Uploaded on" for when file entered system

**Database Fields:**

```javascript
{
  documentDate: '2025-01-15',      // Business transaction date
  sourceCreatedDate: '2025-01-20', // Source file timestamp
  uploadedAt: '2025-01-20T14:30:00Z' // Firebase upload time
}
```

**Code Comments:**

```javascript
// Extract document date from OCR text (not source file metadata)
const documentDate = extractDateFromContent(ocrText);

// Use source file's modified date as fallback
const fallbackDate = sourceFile.lastModifiedDate;
```

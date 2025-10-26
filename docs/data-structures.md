# Firestore Data Structure Design (KISS Edition)

Last Updated: 2025-08-31

## Overview

This document serves as the **central hub** for our Firestore data structure documentation. Following the KISS principle, we've designed a simple, scalable data structure for our multi-tenant firm-based architecture supporting Multi-App SSO.

**Key Design Decisions:**

- Firms typically have 3-10 members (max 100)
- All apps share the same role-based permissions
- No denormalization needed for queries
- No audit trails in MVP
- Flat structure for simplicity

## Documentation Organization

This data structure documentation is organized into focused, specialized documents:

### 📚 Core Documentation Components

#### Core Data Architecture Documentation

The Firestore collection schemas are documented in three specialized files:

**[Solo Firm Matters](./architecture/SoloFirmMatters.md)**
Core architecture including:

- Users and Firms collections
- Matters collection (client names stored directly, no separate Clients collection)
- Custom claims and query patterns
- Basic required Firestore indexes

**[File Metadata](./architecture/FileMetadata.md)**  
File management systems including:

- File metadata and folder path systems
- Upload event tracking and deduplication architecture
- File processing and storage optimization

**[Categories and Tags](./architecture/CategoryTags.md)**  
Document organization systems including:

- Categories collection with soft-delete patterns
- Tag management and color theming
- Robust query fallback strategies

#### [Firebase Storage Structure](./architecture/firebase-storage.md)

Firebase Storage organization and file management:

- File storage paths and deduplication
- Processing folders (OCR, split, merged files)
- Storage path examples and access control
- Deduplication examples and optimization features

#### [Security Rules and Access Control](./architecture/security-rules.md)

Comprehensive security implementation:

- Firestore and Firebase Storage security rules
- Custom claims structure and role-based access control
- Access control matrix and data isolation guarantees
- Security testing and monitoring guidelines

#### [Firm Workflows and User Management](./architecture/firm-workflows.md)

User and firm management processes:

- Solo user to firm workflow and new user registration
- Firm invitation process and data migration
- Firm management workflows (adding/removing members)
- Firm merger scenarios and invitation management

## Architecture Summary

### Solo User Design

- New users automatically get a firm where `firmId === userId`
- Creates a "firm of one" eliminating special cases
- Easy upgrade path to collaborative firms
- Perfect deduplication works consistently

### Firm-Based Multi-Tenancy

- All data scoped by firm ID for perfect isolation
- Embedded members (optimal for 3-10 users)
- Simple pending invitations system
- Consistent security model across all apps

### File Management

- Content-based deduplication using BLAKE3 hashes
- Multiple metadata records for same file content
- Smart folder path system with pattern recognition
- Future-ready processing workflow folders

### Security Model

- Firm-based access control with custom claims
- Simple, consistent security rules
- Solo users have `firmId === userId`
- Role-based permissions (admin/member)

## Quick Reference

### Key Collection Paths

```
/users/{userId}                                    // User preferences
/firms/{firmId}                                    // Firm info with embedded members
/firms/{firmId}/matters/{matterId}                 // Matter/case records (client names stored directly)
// File metadata collections are documented in data-structures/FileMetadata.md
```

### Storage Paths

```
/firms/{firmId}/matters/{matterId}/uploads/{fileHash}.{ext}  // Current uploads
/firms/{firmId}/matters/{matterId}/OCRed/                    // Future OCR files
/firms/{firmId}/matters/{matterId}/split/                    // Future split files
/firms/{firmId}/matters/{matterId}/merged/                   // Future merged files
```

### Security Pattern

```javascript
// All firm data follows this pattern
match /firms/{firmId}/{collection}/{document} {
  allow read: if request.auth != null &&
                 request.auth.token.firmId == firmId;
  allow write: if request.auth != null &&
                  request.auth.token.firmId == firmId;
}
```

## Implementation Notes

### Current Status

- ✅ Core collections implemented
- ✅ Solo user workflow active
- ✅ File deduplication working
- ✅ Basic security rules deployed
- 🔄 Firm invitations (in development)
- ⏳ Document processing workflows (planned)

### Future Considerations

**YAGNI Principle**: Don't add complexity until needed:

1. **If firms grow beyond 100 members**: Move members to subcollection
2. **If you need audit trails**: Add `history` array to documents
3. **If you need per-app permissions**: Extend custom claims
4. **If queries get complex**: Add specific denormalization

**Remember**: You can always add complexity later. Keep it simple and add complexity only when real usage patterns demand it.

## Getting Started

For detailed implementation guidance:

1. **Start with** → [Solo Firm Matters](./architecture/SoloFirmMatters.md) for core architecture
2. **Then review** → [Security Rules](./architecture/security-rules.md)
3. **For file handling** → [Firebase Storage Structure](./architecture/firebase-storage.md)
4. **For user management** → [Firm Workflows](./architecture/firm-workflows.md)

Each document is self-contained with complete implementation details while maintaining this hub document as the single navigation point and architectural overview.

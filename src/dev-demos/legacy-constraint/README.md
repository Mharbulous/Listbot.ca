# Legacy Constraint Files

This folder contains the original Uploadv2-style upload interface that was copied to the constraint folder.
These files are NOT used by the new constraint page (http://localhost:5173/#/constraint).

The constraint page uses Phase 1 XXH3-based deduplication with these files:
- useConstraintTable.js
- useConstraintAdapter.js  
- ConstraintTable.vue and its sub-components

This legacy code is preserved here in case it's needed for reference or if the old upload interface (/upload) still depends on these patterns.

## What's here:
- FileUpload.vue - Old Uploadv2-style upload interface
- Worker-based deduplication infrastructure (BLAKE3)
- Folder analysis and progress tracking
- Time-based warning system
- Legacy upload queue management


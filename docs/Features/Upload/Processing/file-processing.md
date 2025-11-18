# File Processing Implementation Details

## Hash Libraries Used

**CRITICAL**: The system uses specific hash libraries that must be imported correctly:

### File Content Hashing (BLAKE3)
- **Library**: `hash-wasm` (NOT `@noble/hashes`)
- **Algorithm**: BLAKE3 with 128-bit output (32 hex characters)
- **Usage**: File content deduplication, document IDs in Firestore
- **Import**: `import { blake3 } from 'hash-wasm';`
- **Implementation**: `src/features/upload/workers/fileHashWorker.js` and `src/features/upload/composables/useFileProcessor.js`

### Metadata Hashing (xxHash)
- **Library**: `xxhash-wasm`
- **Algorithm**: xxHash 64-bit (NOT xxHash3)
- **Output**: 16 hex characters
- **Usage**: Metadata combination deduplication (sourceFileName|sourceLastModified|fileHash)
- **Import**: `import xxhash from 'xxhash-wasm';`
- **Implementation**: `src/features/upload/composables/useFileMetadata.js`

**Why These Libraries:**
- **Performance**: Both are WebAssembly-based for maximum speed
- **Browser Compatibility**: Work in web workers without blocking UI
- **Reliability**: Battle-tested libraries with consistent output

## File Processing & Estimation System

**Hardware-Calibrated Prediction System:**
The system uses hardware-specific calibration to provide accurate time predictions:

1. **Phase 1: File Analysis** (Filtering)

   - Size-based copy detection and file categorization
   - Consistent ~60ms regardless of file count
   - Path parsing and directory structure analysis
   - Copy candidate identification

2. **Phase 2: Hash Processing** (Hardware-Calibrated)

   - BLAKE3 calculation for copy detection
   - Formula: `35 + (6.5 × candidates) + (0.8 × sizeMB)` × hardware calibration factor
   - Uses stored hardware performance factor (H-factor) from actual measurements
   - Accounts for both computational and I/O overhead

3. **Phase 3: UI Rendering** (Hardware & Complexity Calibrated)
   - DOM updates and progress visualization
   - Formula: `50 + (0.52 × files) + (45 × avgDepth)` × hardware calibration factor
   - Directory structure complexity impacts rendering performance

## Path Parsing Optimization

- Single preprocessing pass eliminates 80% of redundant path parsing
- Calculates all metrics simultaneously: directory count, depth statistics, folder detection
- Optimized from 5+ separate parsing operations to 1 consolidated operation

## File Deduplication Strategy

### Terminology
- **"duplicate"** or **"duplicates"**: Files with identical content (hash value) and core metadata (name, size, modified date) where folder path variations have no informational value. Duplicates are not uploaded and their metadata is not copied.
- **"redundant"**: Hash-verified duplicates awaiting removal. Files transition from "duplicate" status to "redundant" after hash verification confirms identical content. Redundant files are removed during Stage 1 pre-filter of the next batch, creating a two-phase cleanup lifecycle.
- **"copy"** or **"copies"**: Files with the same hash value but different file metadata that IS meaningful. Copies are not uploaded to storage, but their metadata is recorded for informational value.
- **"best"** or **"primary"**: The file with the most meaningful metadata that will be uploaded to storage their metadata recorded for informational value.
- **"file metadata"**: Filesystem metadata (name, size, modified date, path) that does not affect hash value

### Strategy
- **Sequential two-stage deduplication**: Implemented in `src/features/upload/composables/useSequentialPrefilter.js`
  - **Stage 1 (Pre-filter)**: Metadata-based comparison to identify potential duplicates/copies
    - Removes files with `status='redundant'` from previous runs
    - Sorts files by size, modified date, and name
    - Sequential comparison marks files as "Primary", "Copy", or "Duplicate"
  - **Stage 2 (Hash verification)**: BLAKE3 hashing to verify suspected duplicates/copies
    - Only hashes files marked "Copy" or "Duplicate" from Stage 1
    - Confirms true duplicates by comparing hash values
    - Marks hash-verified duplicates as "redundant" for removal in next batch
- **Two-phase cleanup lifecycle**: Duplicate → (hash match) → Redundant → (next batch Stage 1) → Removed
- **Firestore integration**: Hashes serve as document IDs for automatic database-level deduplication
- **Efficient processing**: Typically 60-80% of files skip expensive hash calculation

## Hardware Performance Calibration

The system automatically calibrates to hardware performance during folder analysis:

- **H-Factor Calculation**: Files processed per millisecond during folder analysis
- **Automatic Storage**: Performance measurements stored in localStorage
- **Continuous Improvement**: Uses recent measurements for better accuracy
- **Hardware-Specific**: Adapts to different CPU speeds and system performance

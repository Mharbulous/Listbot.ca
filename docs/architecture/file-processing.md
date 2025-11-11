# File Processing Implementation Details

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
- **duplicate** or **duplicates**: Files with the same hash value AND same modified date
- **copy** or **copies**: Files with the same hash value but different file metadata
- **file metadata**: Filesystem metadata (name, size, modified date, path) that does not affect hash value
- **one-and-the-same**: The exact same file (same hash, same metadata, same folder location)

### Strategy
- **Size-based pre-filtering**: Files with unique sizes skip hash calculation entirely
- **Hash-based verification**: Only files with matching sizes undergo BLAKE3 hashing
- **Firestore integration**: Hashes serve as document IDs for automatic database-level deduplication
- **Efficient processing**: Typically 60-80% of files skip expensive hash calculation

## Hardware Performance Calibration

The system automatically calibrates to hardware performance during folder analysis:

- **H-Factor Calculation**: Files processed per millisecond during folder analysis
- **Automatic Storage**: Performance measurements stored in localStorage
- **Continuous Improvement**: Uses recent measurements for better accuracy
- **Hardware-Specific**: Adapts to different CPU speeds and system performance

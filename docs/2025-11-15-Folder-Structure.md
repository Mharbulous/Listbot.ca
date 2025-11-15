# /testing Page Dependencies

**Date:** 2025-11-15
**Route:** `http://localhost:5173/#/testing`
**Main Component:** `src/views/Testing.vue`

## File Dependency Tree

```
📁 /testing Page Dependencies (35 files, 8,614 code lines)
│
├── 📁 src
│   ├── 📁 views
│   │   └── 📄 Testing.vue [363]
│   │
│   ├── 📁 features
│   │   ├── 📁 upload
│   │   │   ├── 📁 components
│   │   │   │   ├── 📄 QueueProgressIndicator.vue [222]
│   │   │   │   ├── 📄 UploadTable.vue [438]
│   │   │   │   ├── 📄 UploadTableVirtualizer.vue [376]
│   │   │   │   ├── 📄 UploadTableHeader.vue [187]
│   │   │   │   ├── 📄 UploadTableRow.vue [240]
│   │   │   │   ├── 📄 UploadTableDropzone.vue [117]
│   │   │   │   ├── 📄 UploadTableFooter.vue [492]
│   │   │   │   ├── 📄 SelectCell.vue [222]
│   │   │   │   ├── 📄 FileTypeIcon.vue [63]
│   │   │   │   └── 📄 FileNameCell.vue [110]
│   │   │   │
│   │   │   ├── 📁 composables
│   │   │   │   ├── 📄 useUploadTable.js [1068]
│   │   │   │   ├── 📄 useUploadAdapter.js [441]
│   │   │   │   ├── 📄 useTentativeVerification.js [439]
│   │   │   │   ├── 📄 useQueueCore.js [520]
│   │   │   │   ├── 📄 useFileDropHandler.js [263]
│   │   │   │   ├── 📄 useGroupStyling.js [122]
│   │   │   │   ├── 📄 useFileProcessor.js [373]
│   │   │   │   ├── 📄 useFileMetadata.js [267]
│   │   │   │   ├── 📄 useUploadOrchestration.js [129]
│   │   │   │   ├── 📄 useWebWorker.js [477]
│   │   │   │   └── 📄 useFileTypeIcons.js [146]
│   │   │   │
│   │   │   └── 📁 utils
│   │   │       ├── 📄 fileTypeChecker.js [47]
│   │   │       ├── 📄 filePathExtractor.js [121]
│   │   │       ├── 📄 networkUtils.js [191]
│   │   │       ├── 📄 uploadHelpers.js [133]
│   │   │       ├── 📄 folderPathUtils.js [219]
│   │   │       ├── 📄 hardwareCalibration.js [355]
│   │   │       └── 📄 processingTimer.js [44]
│   │   │
│   │   └── 📁 organizer
│   │       └── 📁 services
│   │           └── 📄 evidenceService.js [328]
│   │
│   ├── 📁 core
│   │   ├── 📁 stores
│   │   │   └── 📄 auth.js [344]
│   │   │
│   │   └── 📁 composables
│   │       └── 📄 useNotification.js [27]
│   │
│   ├── 📁 stores
│   │   └── 📄 matterView.js [136]
│   │
│   ├── 📁 services
│   │   └── 📄 firebase.js [53]
│   │
│   ├── 📁 composables
│   │   └── 📄 useAsyncRegistry.js [147]
│   │
│   ├── 📁 utils
│   │   └── 📄 errorMessages.js [394]
│   │
│   └── 📁 assets
│       └── 📁 icons
│           └── 📁 file_types
│               ├── 🎨 audio.svg
│               ├── 🎨 email.svg
│               ├── 🎨 excel.svg
│               ├── 🎨 movie.svg
│               ├── 🎨 pdf.svg
│               ├── 🎨 spreadsheet.svg
│               └── 🎨 word.svg
```

## Summary Statistics

- **Total Files:** 35
- **Total Code Lines:** 8,614 (excluding SVG assets)
- **Main View:** Testing.vue (363 lines)
- **Components:** 10 files (2,467 lines)
- **Composables:** 13 files (4,419 lines)
- **Utilities:** 8 files (1,504 lines)
- **Stores & Services:** 4 files (861 lines)
- **Assets (SVG Icons):** 7 files

## External Dependencies

### Vue & Framework
- `vue` (ref, computed, watch, onMounted, onUnmounted, nextTick)
- `vue-router`
- `pinia` (defineStore, state management)

### UI Framework
- `vuetify` (v-dialog, v-card, v-btn, v-icon, v-menu, v-list, v-snackbar, v-progress-linear, etc.)

### Firebase Services
- `firebase/app` (initializeApp)
- `firebase/auth` (onAuthStateChanged, setPersistence, getAuth)
- `firebase/firestore` (doc, getDoc, setDoc, updateDoc, Timestamp)
- `firebase/storage` (ref, uploadBytesResumable, getMetadata)
- `firebase/ai` (getAI)

### Cryptography
- `xxhash-wasm` (XXH128 hashing for file content and metadata)

## Key Data Flow Paths

1. **File Upload Pipeline**: Testing.vue → useUploadTable → useQueueCore → xxhash-wasm → firebase
2. **UI Rendering**: Testing.vue → UploadTable → UploadTableVirtualizer → UploadTableRow (with 9 sub-components)
3. **Background Verification**: useTentativeVerification → useQueueCore → xxhash-wasm
4. **State Management**: All composables → Pinia stores (auth, matterView) → Firebase SDK
5. **Network Operations**: useUploadAdapter → useFileProcessor → Firebase Storage + Firestore

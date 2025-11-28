<template>
  <StubPageLayout>
    <template #content>
      <div class="max-w-6xl mx-auto p-8">
      <!-- Header with Toggle -->
      <div class="mb-8">
        <div
          class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4"
        >
          EDRM Stage 4: Processing
        </div>
        <h1 class="text-4xl font-bold text-slate-900 mb-4">Process Workflow Dashboard</h1>
        <p class="text-xl text-slate-600 max-w-4xl mb-6">
          Technical implementation status and architecture for the Process stage: document volume reduction through hash-based deduplication,
          email threading, AI analysis, and metadata extraction.
          <span class="text-emerald-600 font-semibold">Green = Implemented</span>,
          <span class="text-amber-600 font-semibold">Amber = In Progress</span>,
          <span class="text-blue-600 font-semibold">Blue = Planned</span>
        </p>

        <!-- View Toggle -->
        <div class="flex gap-3 mb-6">
          <button
            @click="viewMode = 'dashboard'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              viewMode === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            📊 Dashboard View
          </button>
          <button
            @click="viewMode = 'blueprint'"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              viewMode === 'blueprint'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            📋 Blueprint View
          </button>
        </div>
      </div>

      <!-- Dashboard View -->
      <div v-if="viewMode === 'dashboard'" class="space-y-8">
        <!-- Implementation Progress Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white border-2 border-emerald-500 rounded-lg p-4">
            <div class="text-3xl font-bold text-emerald-600">5</div>
            <div class="text-sm text-slate-600">Components Implemented</div>
          </div>
          <div class="bg-white border-2 border-amber-500 rounded-lg p-4">
            <div class="text-3xl font-bold text-amber-600">1</div>
            <div class="text-sm text-slate-600">In Progress</div>
          </div>
          <div class="bg-white border-2 border-blue-500 rounded-lg p-4">
            <div class="text-3xl font-bold text-blue-600">6</div>
            <div class="text-sm text-slate-600">Planned Features</div>
          </div>
          <div class="bg-white border-2 border-slate-300 rounded-lg p-4">
            <div class="text-3xl font-bold text-slate-600">45%</div>
            <div class="text-sm text-slate-600">Overall Progress</div>
          </div>
        </div>

        <!-- Processing Pipeline Visualization -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 class="text-xl font-bold text-slate-900 mb-4">Processing Pipeline Status</h2>
          <div class="space-y-3">
            <!-- Upload Stage Header -->
            <div class="bg-gradient-to-r from-emerald-100 to-emerald-50 border-2 border-emerald-400 rounded-lg p-4 mb-2">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-bold text-emerald-900 mb-1">
                    🛡️ Preserve Stage (EDRM Stage 3)
                  </h3>
                  <p class="text-sm text-emerald-800">
                    Stages 1 & 2 are handled during the <strong>Preserve</strong> workflow at the Upload page
                  </p>
                </div>
                <router-link
                  to="/upload"
                  class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium whitespace-nowrap ml-4"
                >
                  → Go to Preserve
                </router-link>
              </div>
            </div>

            <!-- Stage 1: Upload & Hash -->
            <div class="flex items-center gap-4 ml-4">
              <div class="flex-shrink-0 w-24 text-sm font-semibold text-emerald-600">✅ LIVE</div>
              <div class="flex-1 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4">
                <div class="font-semibold text-slate-900">Stage 1: Upload & BLAKE3 Hashing</div>
                <div class="text-sm text-slate-600 mt-1">
                  Web Worker-based hashing with hardware calibration • Two-stage deduplication (size → hash)
                </div>
                <div class="text-xs text-slate-500 mt-2">
                  📁 <code>src/features/upload/workers/fileHashWorker.js</code> •
                  <code>composables/useFileProcessor.js</code>
                </div>
              </div>
            </div>

            <!-- Stage 2: Deduplication Logic -->
            <div class="flex items-center gap-4 ml-4">
              <div class="flex-shrink-0 w-24 text-sm font-semibold text-emerald-600">✅ LIVE</div>
              <div class="flex-1 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4">
                <div class="font-semibold text-slate-900">Stage 2: Exact Database-level Deduplication</div>
                <div class="text-sm text-slate-600 mt-1">
                  Hash-based document IDs provide database-level deduplication • Terminology: duplicate, copy, best, redundant
                </div>
                <div class="text-xs text-slate-500 mt-2">
                  📄 <code>docs/Features/Upload/Deduplication/</code> •
                  Firestore doc ID = BLAKE3 hash
                </div>
              </div>
            </div>

            <!-- Stage 3: Email Extraction (PLANNED) -->
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-24 text-sm font-semibold text-blue-600">📋 PLANNED</div>
              <div class="flex-1 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
                <div class="font-semibold text-blue-900">Stage 3: Email Extraction</div>
                <div class="text-sm text-blue-700 mt-1">
                  Parse .msg/.eml files to extract messages (native + quoted) and attachments • Recursive nested email support
                </div>
                <div class="text-xs text-blue-600 mt-2">
                  🔧 Libraries: @kenjiuno/msgreader, mailparser • Storage: /emails, /uploads • Priority: HIGH (Phase 1)
                </div>
                <div class="text-xs text-blue-600 mt-2">
                  📖 <code>docs/Features/Upload/Email-Extraction/email-extraction-architecture.md</code> •
                  <code>CLAUDE.md</code>
                </div>
              </div>
            </div>

            <!-- Stage 4: Email Threading (PLANNED) -->
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-24 text-sm font-semibold text-blue-600">📋 PLANNED</div>
              <div class="flex-1 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
                <div class="font-semibold text-blue-900">Stage 4: Email Threading</div>
                <div class="text-sm text-blue-700 mt-1">
                  Conversation reconstruction • Inclusive vs. non-inclusive detection • 40-74% review time reduction
                </div>
                <div class="text-xs text-blue-600 mt-2">
                  🔧 Builds on Stage 3 data • Priority: HIGH (Phase 1)
                </div>
              </div>
            </div>

            <!-- Stage 5: Categorization (LIVE - WIP) -->
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-24 text-sm font-semibold text-amber-600">🔴 LIVE WIP</div>
              <div class="flex-1 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4">
                <div class="font-semibold text-slate-900">Stage 5: Categorization</div>
                <div class="text-sm text-slate-600 mt-1">
                  Automated document classification • Content-based organization • Currently in Review, migrating to Process
                </div>
                <div class="text-xs text-slate-500 mt-2">
                  📁 Current: Organize → Categories • Future: Process feature
                </div>
              </div>
            </div>

            <!-- Stage 6: AI Fuzzy Dedup (PLANNED) -->
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0 w-24 text-sm font-semibold text-blue-600">📋 PLANNED</div>
              <div class="flex-1 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
                <div class="font-semibold text-blue-900">Stage 6: AI Fuzzy Deduplication</div>
                <div class="text-sm text-blue-700 mt-1">
                  Near-duplicate detection using embeddings • Similarity threshold analysis
                </div>
                <div class="text-xs text-blue-600 mt-2">
                  🔧 Approach: Document embeddings + cosine similarity • Priority: MEDIUM (Phase 2)
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Implementation Details -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column: Implemented Components -->
          <div class="space-y-4">
            <h2 class="text-xl font-bold text-slate-900">Implemented Components</h2>

            <!-- Web Worker Architecture -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">🔄</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 mb-1">Web Worker Processing</h3>
                  <p class="text-sm text-slate-600 mb-2">
                    CPU-intensive BLAKE3 hashing offloaded to background threads
                  </p>
                  <div class="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                    <div>📁 src/features/upload/workers/</div>
                    <div>  ├─ fileHashWorker.js</div>
                    <div>📁 src/features/upload/composables/</div>
                    <div>  ├─ useWebWorker.js</div>
                    <div>  ├─ useFileProcessor.js</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hardware Calibration -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">⚡</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 mb-1">Hardware-Calibrated Time Estimation</h3>
                  <p class="text-sm text-slate-600 mb-2">
                    3-phase estimation: File Analysis → Hash Processing → UI Rendering
                  </p>
                  <div class="text-xs space-y-1">
                    <div class="flex justify-between">
                      <span class="text-slate-600">Calibration:</span>
                      <span class="font-semibold">User-specific hardware benchmarking</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-600">Location:</span>
                      <span class="font-mono">utils/hardwareCalibration.js</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Two-Stage Deduplication -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">🔍</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 mb-1">Two-Stage Deduplication Strategy</h3>
                  <p class="text-sm text-slate-600 mb-2">
                    Optimization: Skip hashing for files with unique sizes
                  </p>
                  <div class="text-xs space-y-1">
                    <div class="bg-emerald-50 p-2 rounded border border-emerald-200">
                      <div class="font-semibold mb-1">Stage 1: Size Filter</div>
                      <div class="text-slate-600">Group files by size • Skip unique sizes (~60% of files)</div>
                    </div>
                    <div class="bg-emerald-50 p-2 rounded border border-emerald-200">
                      <div class="font-semibold mb-1">Stage 2: Hash Verification</div>
                      <div class="text-slate-600">BLAKE3 hash only size-matched files</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Deduplication Terminology -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">📚</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 mb-1">Deduplication Terminology (CRITICAL)</h3>
                  <div class="text-xs space-y-2 mt-2">
                    <div class="bg-slate-50 p-2 rounded">
                      <span class="font-semibold">duplicate:</span> Identical content + metadata (NOT uploaded)
                    </div>
                    <div class="bg-slate-50 p-2 rounded">
                      <span class="font-semibold">copy:</span> Same hash, different meaningful metadata (metadata recorded)
                    </div>
                    <div class="bg-slate-50 p-2 rounded">
                      <span class="font-semibold">best/primary:</span> Most meaningful metadata (uploaded to storage)
                    </div>
                    <div class="bg-slate-50 p-2 rounded">
                      <span class="font-semibold">redundant:</span> Hash-verified duplicates awaiting removal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Planned Features & Mockups -->
          <div class="space-y-4">
            <h2 class="text-xl font-bold text-blue-600">Planned Features (Blueprints)</h2>

            <!-- Email Threading Mockup -->
            <div class="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">📧</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-blue-900 mb-1">Email Threading</h3>
                  <div class="bg-white rounded border border-blue-300 p-3 mt-2 text-xs">
                    <div class="font-semibold text-blue-900 mb-2">Mockup: Thread Analysis Panel</div>
                    <div class="space-y-1 text-blue-700">
                      <div>📊 Thread: RE: Project Update (15 messages)</div>
                      <div class="ml-4">├─ ✅ Message #15 (Inclusive - REVIEW THIS)</div>
                      <div class="ml-4">├─ ⊘ Message #1-14 (Non-inclusive - SKIP)</div>
                      <div class="mt-2 text-blue-600">💡 Review Reduction: 93% (15 → 1 message)</div>
                    </div>
                  </div>
                  <div class="text-xs text-blue-600 mt-2 space-y-1">
                    <div><strong>Priority:</strong> HIGH - Phase 1 (Highest ROI)</div>
                    <div><strong>Impact:</strong> 40-74% review time reduction</div>
                    <div><strong>Technical:</strong> Parse email headers, reconstruct conversation tree</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Fuzzy Dedup Mockup -->
            <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">🤖</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-blue-900 mb-1">AI Fuzzy Deduplication</h3>
                  <div class="bg-white rounded border border-blue-300 p-3 mt-2 text-xs">
                    <div class="font-semibold text-blue-900 mb-2">Mockup: Near-Duplicate Detection</div>
                    <div class="space-y-1 text-blue-700">
                      <div>📄 Contract_v1.docx (100% - Primary)</div>
                      <div class="ml-4">├─ 📄 Contract_v2.docx (94% similar)</div>
                      <div class="ml-4">├─ 📄 Contract_final.docx (89% similar)</div>
                      <div class="mt-2 text-blue-600">💡 Review only primary + differences</div>
                    </div>
                  </div>
                  <div class="text-xs text-blue-600 mt-2 space-y-1">
                    <div><strong>Priority:</strong> MEDIUM - Phase 2</div>
                    <div><strong>Approach:</strong> Document embeddings + cosine similarity</div>
                    <div><strong>Threshold:</strong> Configurable similarity % (default: 85%)</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Processing Profiles -->
            <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <div class="text-2xl">⚙️</div>
                <div class="flex-1">
                  <h3 class="font-semibold text-blue-900 mb-1">Processing Profiles</h3>
                  <p class="text-xs text-blue-700 mb-2">
                    Reusable workflow settings for consistent processing across matters
                  </p>
                  <div class="text-xs text-blue-600 space-y-1">
                    <div><strong>Priority:</strong> MEDIUM - Phase 2</div>
                    <div><strong>Storage:</strong> Firestore collection per firm</div>
                    <div><strong>Settings:</strong> Dedup preferences, metadata fields, threading options</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Documentation Links -->
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-3">📚 Documentation References</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="bg-white rounded border border-slate-200 p-3">
              <div class="font-semibold text-slate-900 mb-1">File Lifecycle & Terminology</div>
              <code class="text-xs text-blue-600">docs/Features/Upload/Processing/file-lifecycle.md</code>
            </div>
            <div class="bg-white rounded border border-slate-200 p-3">
              <div class="font-semibold text-slate-900 mb-1">Deduplication Logic</div>
              <code class="text-xs text-blue-600">docs/Features/Upload/Deduplication/</code>
            </div>
            <div class="bg-white rounded border border-slate-200 p-3">
              <div class="font-semibold text-slate-900 mb-1">File Processing Details</div>
              <code class="text-xs text-blue-600">docs/Features/Upload/Processing/file-processing.md</code>
            </div>
            <div class="bg-white rounded border border-slate-200 p-3">
              <div class="font-semibold text-slate-900 mb-1">Email Extraction Architecture</div>
              <code class="text-xs text-blue-600">docs/Features/Upload/Email-Extraction/email-extraction-architecture.md</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Blueprint View -->
      <div v-else class="space-y-8">
        <!-- Key Impact Metric -->
        <div
          class="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500 p-6 rounded-lg"
        >
          <div class="flex items-start gap-4">
            <div class="text-3xl">📊</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 mb-2">Impact on Review Costs</h3>
              <p class="text-slate-700">
                Effective processing reduces review costs (which represent 80% of total e-discovery
                expenses) by
                <span class="font-bold text-emerald-700">50-75%</span> through comprehensive
                deduplication and intelligent filtering.
              </p>
            </div>
          </div>
        </div>

        <!-- Current Implementation Status -->
        <div>
          <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Status (Granular)</h2>

          <!-- Preserve Stage Notice -->
          <div class="bg-gradient-to-r from-emerald-100 to-emerald-50 border-l-4 border-emerald-500 p-4 mb-6 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-emerald-900 mb-1">
                  🛡️ Preserve Stage (EDRM Stage 3)
                </h3>
                <p class="text-sm text-emerald-800">
                  Stage 1 (Upload & BLAKE3 Hashing) and Stage 2 (Exact Deduplication) are both handled during the <strong>Preserve</strong> workflow at the Upload page.
                </p>
              </div>
              <router-link
                to="/upload"
                class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium whitespace-nowrap ml-4"
              >
                → Go to Preserve
              </router-link>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <!-- Exact Deduplication -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="text-2xl">✅</div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">BLAKE3 Hash Deduplication</h3>
                  <p class="text-sm text-emerald-600 font-medium">✓ Implemented (Preserve Stage)</p>
                </div>
              </div>
              <p class="text-slate-600 mb-3 text-sm">
                CPU-intensive BLAKE3 hashing runs in Web Worker to avoid UI blocking. Hash-based document IDs
                provide database-level deduplication.
              </p>
              <div class="text-xs text-slate-500 space-y-1">
                <div><strong>Location:</strong> <code>src/features/upload/workers/fileHashWorker.js</code></div>
                <div><strong>Library:</strong> hash-wasm (BLAKE3)</div>
                <div><strong>Terminology:</strong> duplicate, copy, best, redundant</div>
              </div>
            </div>

            <!-- Hardware Calibration -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="text-2xl">⚡</div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Hardware-Calibrated Estimation</h3>
                  <p class="text-sm text-emerald-600 font-medium">✓ Implemented</p>
                </div>
              </div>
              <p class="text-slate-600 mb-3 text-sm">
                3-phase time estimation: File Analysis, Hash Processing (calibrated to user's hardware), UI Rendering.
              </p>
              <div class="text-xs text-slate-500 space-y-1">
                <div><strong>Location:</strong> <code>src/features/upload/utils/hardwareCalibration.js</code></div>
                <div><strong>Phases:</strong> Analysis → Hashing → Rendering</div>
              </div>
            </div>

            <!-- Web Worker Architecture -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="text-2xl">🔄</div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Web Worker Processing</h3>
                  <p class="text-sm text-emerald-600 font-medium">✓ Implemented</p>
                </div>
              </div>
              <p class="text-slate-600 mb-3 text-sm">
                File hashing offloaded to background threads to prevent UI blocking during large batch processing.
              </p>
              <div class="text-xs text-slate-500 space-y-1">
                <div><strong>Composable:</strong> <code>useWebWorker.js</code></div>
                <div><strong>Worker:</strong> <code>fileHashWorker.js</code></div>
              </div>
            </div>

            <!-- Two-Stage Deduplication Strategy -->
            <div class="bg-white border-2 border-emerald-500 rounded-lg p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="text-2xl">🔍</div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Two-Stage Dedup Strategy</h3>
                  <p class="text-sm text-emerald-600 font-medium">✓ Implemented</p>
                </div>
              </div>
              <p class="text-slate-600 mb-3 text-sm">
                Stage 1: Size-based pre-filter skips unique files. Stage 2: BLAKE3 hashing only for size-matched files.
              </p>
              <div class="text-xs text-slate-500 space-y-1">
                <div><strong>Optimization:</strong> Skip hashing for unique file sizes</div>
                <div><strong>Efficiency:</strong> ~60% files skip expensive hashing</div>
              </div>
            </div>

            <!-- Categorization -->
            <div class="bg-white border-2 border-amber-500 rounded-lg p-6">
              <div class="flex items-start gap-3 mb-3">
                <div class="text-2xl">🗂️</div>
                <div>
                  <h3 class="text-lg font-semibold text-slate-900">Stage 5: Categorization</h3>
                  <p class="text-sm text-amber-600 font-medium">🔴 LIVE but Under Construction</p>
                </div>
              </div>
              <p class="text-slate-600 mb-3 text-sm">
                Automated document classification based on content analysis for efficient organization. Currently implemented as part of the Review feature, being migrated to Process feature.
              </p>
              <div class="text-xs text-slate-500 space-y-1">
                <div><strong>Current Location:</strong> Organize → Categories</div>
                <div><strong>Future Location:</strong> Process feature (migration planned)</div>
                <div><strong>Benefit:</strong> Streamlines document review</div>
              </div>
            </div>

          </div>
        </div>

        <!-- Planned Enhancements -->
        <div>
          <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Enhancements</h2>

          <!-- High Priority Features -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                HIGH PRIORITY
              </span>
              Quick Wins - Phase 1
            </h3>
            <div class="grid gap-4 md:grid-cols-2">
              <!-- Email Extraction & Threading -->
              <div class="bg-white border-2 border-blue-300 rounded-lg p-6">
                <div class="flex items-start gap-3 mb-3">
                  <div class="text-2xl">📧</div>
                  <div>
                    <h4 class="text-lg font-semibold text-blue-600">Email Extraction & Threading</h4>
                    <p class="text-sm text-blue-600 font-medium">📋 DESIGNED - Highest ROI Feature</p>
                  </div>
                </div>
                <p class="text-blue-700 mb-3 text-sm">
                  <strong>Stage 3 (Email Extraction):</strong> Parse .msg/.eml files to extract individual messages (native + quoted) and attachments.
                  Attachments are deduplicated across all emails before storage. Supports recursive processing of nested .msg files.<br><br>
                  <strong>Stage 4 (Email Threading):</strong> Automatically identifies and groups email conversations, marking inclusive emails
                  (containing all prior conversation content) vs. non-inclusive replies. Builds on extracted message data from Stage 3.
                </p>
                <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                  <div class="text-sm font-medium text-blue-900 mb-1">Expected Impact:</div>
                  <div class="text-2xl font-bold text-blue-700">40-74%</div>
                  <div class="text-sm text-blue-800">Review time reduction</div>
                </div>
                <div class="text-xs text-blue-600 space-y-1">
                  <div><strong>Libraries:</strong> @kenjiuno/msgreader, mailparser</div>
                  <div><strong>Storage:</strong> /emails (messages), /uploads (attachments)</div>
                  <div><strong>Terminology:</strong> Native (current message), Quoted (thread history)</div>
                  <div><strong>📖 Docs:</strong>
                    <code>docs/Features/Upload/Email-Extraction/email-extraction-architecture.md</code> •
                    <code>CLAUDE.md</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Medium Priority Features -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                MEDIUM PRIORITY
              </span>
              Advanced Processing - Phase 2
            </h3>
            <div class="grid gap-4 md:grid-cols-2">
              <!-- AI Fuzzy Deduplication -->
              <div class="bg-white border border-blue-200 rounded-lg p-6">
                <div class="flex items-start gap-3 mb-3">
                  <div class="text-2xl">🤖</div>
                  <div>
                    <h4 class="text-lg font-semibold text-blue-600">AI Fuzzy Deduplication</h4>
                    <p class="text-sm text-blue-600 font-medium">📋 PLANNED - Advanced AI</p>
                  </div>
                </div>
                <p class="text-blue-700 mb-3 text-sm">
                  Advanced AI-powered detection of near-duplicate documents that are substantially
                  similar but not identical, reducing review volume while preserving important
                  variations.
                </p>
                <div class="text-xs text-blue-600 space-y-1">
                  <div><strong>Benefit:</strong> Identifies docs that exact hash matching would miss</div>
                  <div><strong>Approach:</strong> Embeddings + similarity threshold</div>
                </div>
              </div>

              <!-- Processing Profiles -->
              <div class="bg-white border border-blue-200 rounded-lg p-6">
                <div class="flex items-start gap-3 mb-3">
                  <div class="text-2xl">⚙️</div>
                  <div>
                    <h4 class="text-lg font-semibold text-blue-600">Processing Profiles</h4>
                    <p class="text-sm text-blue-600 font-medium">📋 PLANNED - Workflow Efficiency</p>
                  </div>
                </div>
                <p class="text-blue-700 mb-3 text-sm">
                  Save and reuse preferred processing settings across similar matters, including
                  deduplication preferences and metadata field selections.
                </p>
                <div class="text-xs text-blue-600 space-y-1">
                  <div><strong>Benefit:</strong> Consistent processing standards, faster matter setup</div>
                  <div><strong>Storage:</strong> Firestore collection per firm</div>
                </div>
              </div>

              <!-- Exception Handling -->
              <div class="bg-white border border-blue-200 rounded-lg p-6">
                <div class="flex items-start gap-3 mb-3">
                  <div class="text-2xl">⚠️</div>
                  <div>
                    <h4 class="text-lg font-semibold text-blue-600">Exception Handling Workflows</h4>
                    <p class="text-sm text-blue-600 font-medium">📋 PLANNED - Quality Assurance</p>
                  </div>
                </div>
                <p class="text-blue-700 mb-3 text-sm">
                  Dedicated workflows for files that fail to process, with manual review queues and
                  retry mechanisms.
                </p>
                <div class="text-xs text-blue-600 space-y-1">
                  <div><strong>Benefit:</strong> Ensures no documents lost to processing errors</div>
                  <div><strong>Features:</strong> Error queue, manual review, retry logic</div>
                </div>
              </div>

              <!-- Metadata Field Mapping -->
              <div class="bg-white border border-blue-200 rounded-lg p-6">
                <div class="flex items-start gap-3 mb-3">
                  <div class="text-2xl">🗂️</div>
                  <div>
                    <h4 class="text-lg font-semibold text-blue-600">Metadata Field Mapping</h4>
                    <p class="text-sm text-blue-600 font-medium">📋 PLANNED - Customization</p>
                  </div>
                </div>
                <p class="text-blue-700 mb-3 text-sm">
                  Configure which metadata fields to extract and preserve during processing, supporting
                  600+ file types.
                </p>
                <div class="text-xs text-blue-600 space-y-1">
                  <div><strong>Benefit:</strong> Tailor metadata extraction to case requirements</div>
                  <div><strong>Scope:</strong> 600+ file types supported</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Workflow Steps -->
        <WorkflowSteps title="Processing Workflow" :steps="workflowSteps" />
      </div>
      </div>
    </template>

    <template #footer>
      <StubFooter
        message="The Process stage is foundational to efficient e-discovery, and ListBot.ca is committed to delivering enterprise-grade capabilities through modern technology."
        back-button-text="Back to Documents"
      />
    </template>
  </StubPageLayout>
</template>

<script setup>
import { ref } from 'vue';
import StubPageLayout from '@/components/stubs/StubPageLayout.vue';
import WorkflowSteps from '@/components/stubs/WorkflowSteps.vue';
import StubFooter from '@/components/stubs/StubFooter.vue';

const viewMode = ref('dashboard');

const workflowSteps = [
  {
    title: 'Preserve Stage (EDRM Stage 3)',
    description: 'The Preserve stage handles file upload, BLAKE3 hashing, and exact deduplication. This encompasses both Stage 1 and Stage 2 of the processing workflow.',
    status: 'Implemented - See Upload page',
  },
  {
    title: 'Stage 1: Upload & BLAKE3 Hashing',
    description:
      'Web Worker-based hashing with hardware calibration. Two-stage deduplication strategy: size-based pre-filter (Stage 1a) → hash verification for size-matched files (Stage 1b).',
    status: 'Part of Preserve workflow',
  },
  {
    title: 'Stage 2: Exact Database-level Deduplication',
    description:
      'Hash-based document IDs provide automatic database-level deduplication. Files are categorized as duplicate, copy, best, or redundant based on hash matching and metadata analysis.',
    status: 'Part of Preserve workflow',
  },
  {
    title: 'Stage 3: Email Extraction',
    description:
      'Email files (.msg, .eml) are parsed to extract individual messages (native + quoted) and attachments. Attachments are deduplicated across all emails before storage. Supports recursive processing of nested .msg files. Native messages have reliable metadata from .msg headers, while quoted messages are parsed from email body with variable metadata quality. See docs/Features/Upload/Email-Extraction/email-extraction-architecture.md',
    status: 'Planned - Architecture Designed',
  },
  {
    title: 'Stage 4: Email Threading',
    description:
      'Email conversations are reconstructed and analyzed to identify inclusive vs. non-inclusive messages. Builds on data from Stage 3 Email Extraction to create conversation threads and identify which messages contain complete thread history.',
    status: 'Planned - Depends on Stage 3',
  },
  {
    title: 'Stage 5: Categorization',
    description:
      'Automated document classification based on content analysis for efficient organization. Currently live as part of the Review feature (Organize → Categories), with plans to migrate to the Process feature for enhanced workflow integration.',
    status: 'Live but Under Construction',
  },
  {
    title: 'Stage 6: AI Fuzzy Deduplication',
    description:
      'Advanced AI analysis identifies near-duplicate documents with similar but not identical content, using embeddings and similarity thresholds to detect substantive duplicates that exact hash matching would miss.',
    status: 'Planned - Advanced AI',
  },
  {
    title: 'Review-Ready Corpus',
    description:
      'Processed documents are now optimized for review, with volume reduced by 50-75% through comprehensive deduplication, email threading, and intelligent categorization.',
  },
];
</script>

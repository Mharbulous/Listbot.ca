<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4"
      >
        EDRM Stage 2: Preservation
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Preserve Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Preserve stage ensures potentially relevant evidence is protected from alteration or
        deletion through secure cloud storage, hash-based deduplication, and comprehensive metadata
        preservation—establishing the foundation for defensible e-discovery.
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">🛡️</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Critical Legal Protection</h3>
          <p class="text-slate-700">
            Proper preservation with tamper-proof storage and cryptographic hashing prevents
            spoliation sanctions, which can
            <span class="font-bold text-purple-700">exceed $1M in penalties</span> and result in
            adverse inference instructions that can decide case outcomes.
          </p>
        </div>
      </div>
    </div>

    <!-- Current Implementation Status -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Current Implementation</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Implemented Feature 1 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Exact Hash-Based Deduplication</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            BLAKE3 cryptographic hashing identifies exact duplicate files during upload,
            automatically storing only unique files while preserving metadata for all copies.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Reduces storage costs by 30-50% while
            maintaining complete audit trail
          </div>
        </div>

        <!-- Implemented Feature 2 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Cloud Storage Security</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Firebase Cloud Storage provides tamper-proof preservation with automatic versioning,
            access controls, and geographic redundancy.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Ensures evidence integrity and defensibility
          </div>
        </div>

        <!-- Implemented Feature 3 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Metadata Preservation</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Complete filesystem metadata (filename, size, modified date, path) is captured and
            preserved for all files, including duplicates and copies.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Maintains chain of custody and provenance
          </div>
        </div>

        <!-- Implemented Feature 4 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Upload Progress Tracking</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Real-time monitoring of upload progress with detailed status tracking, error handling,
            and batch processing capabilities.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Transparent visibility into preservation
            process
          </div>
        </div>
      </div>
    </div>

    <!-- Planned Enhancements -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Enhancements</h2>

      <!-- High Priority Features -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
            HIGH PRIORITY
          </span>
          Enhanced Preservation - Phase 1
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Legal Hold Notifications -->
          <div class="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">⚖️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Legal Hold Notifications</h4>
                <p class="text-sm text-amber-600 font-medium">CRITICAL - Compliance Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automated legal hold notifications with acknowledgment tracking, ensuring custodians
              understand their preservation obligations.
            </p>
            <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
              <div class="text-sm font-medium text-amber-900 mb-1">Expected Impact:</div>
              <div class="text-sm text-amber-800">
                Reduces risk of spoliation and demonstrates good faith compliance
              </div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">How it works:</span> Automated email notifications with
              read receipts and acknowledgment tracking
            </div>
          </div>

          <!-- Chain of Custody Logging -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📋</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Chain of Custody Logging</h4>
                <p class="text-sm text-blue-600 font-medium">Quick Win</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Comprehensive audit trail logging every access, modification, and transfer of
              preserved evidence with timestamps and user attribution.
            </p>
            <div class="text-sm text-slate-500 mb-2">
              <span class="font-medium">Implementation:</span> Firestore audit logs with immutable
              timestamps
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Demonstrates evidence authenticity and
              integrity for court
            </div>
          </div>

          <!-- Preservation Dashboard -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📊</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Preservation Dashboard</h4>
                <p class="text-sm text-blue-600 font-medium">Quick Win</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Real-time visualization of preservation metrics including storage usage, deduplication
              ratios, file type breakdown, and custodian activity.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Metrics:</span> Storage savings from deduplication</div>
              <div><span class="font-medium">Breakdown:</span> By file type and custodian</div>
              <div><span class="font-medium">Tracking:</span> Upload progress and completion rates</div>
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
          Advanced Preservation - Phase 2
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Custodian Self-Service Portal -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">👤</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Custodian Self-Service Portal</h4>
                <p class="text-sm text-slate-600 font-medium">Workflow Efficiency</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Allow custodians to upload their own documents directly through a secure,
              user-friendly interface with guided instructions.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Reduces IT burden and speeds up collection
              process
            </div>
          </div>

          <!-- Automated File Format Validation -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔍</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">File Format Validation</h4>
                <p class="text-sm text-slate-600 font-medium">Quality Assurance</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automatically detect corrupted files, verify file type authenticity, and flag
              suspicious extensions during upload.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Prevents processing errors and ensures data
              quality
            </div>
          </div>

          <!-- Preservation Reports -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📄</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Preservation Reports</h4>
                <p class="text-sm text-slate-600 font-medium">Compliance Documentation</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Generate detailed preservation reports for opposing counsel or court showing what was
              preserved, when, and by whom.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Demonstrates compliance with preservation
              obligations
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preservation Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Preservation Workflow</h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="space-y-4">
          <!-- Step 1 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center"
            >
              1
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                File Selection <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                Users select files or folders for preservation through drag-and-drop or file
                browser.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center"
            >
              2
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                Hash Calculation & Deduplication <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                BLAKE3 hashes are calculated in a web worker to identify duplicates and copies
                without blocking the UI.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center"
            >
              3
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                Metadata Extraction <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                Filesystem metadata (name, size, modified date, path) is extracted and preserved
                for all files.
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center"
            >
              4
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                Upload to Cloud Storage <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                Unique files are uploaded to Firebase Cloud Storage with progress tracking and
                error handling.
              </p>
            </div>
          </div>

          <!-- Step 5 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              5
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Chain of Custody Logging</h4>
              <p class="text-slate-600">
                All preservation actions are logged with timestamps and user attribution for audit
                trail (planned).
              </p>
            </div>
          </div>

          <!-- Step 6 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              6
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Evidence Ready for Collection</h4>
              <p class="text-slate-600">
                Preserved files are now securely stored and ready for collection and processing
                stages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competitive Advantage -->
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Advantage</h2>
      <p class="text-slate-700 mb-4">
        ListBot.ca's preservation capabilities provide enterprise-grade security at an accessible
        price point:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Cryptographic hashing</span> ensures tamper-proof evidence
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Automatic deduplication</span> reduces storage costs by 30-50%
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Cloud redundancy</span> protects against data loss
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Modern web workers</span> provide non-blocking performance
          </div>
        </div>
      </div>
    </div>

    <!-- Implementation Timeline -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Timeline</h2>
      <div class="space-y-4">
        <!-- Phase 1 -->
        <div class="border-l-4 border-amber-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Enhanced Preservation</h3>
            <span class="text-sm text-slate-600">(1-2 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Legal hold notification system with acknowledgment tracking</li>
            <li>Chain of custody logging with Firestore audit trail</li>
            <li>Preservation dashboard with Chart.js visualizations</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-blue-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: Advanced Features</h3>
            <span class="text-sm text-slate-600">(3-6 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Custodian self-service portal for direct uploads</li>
            <li>Automated file format validation and corruption detection</li>
            <li>Preservation report generation for compliance documentation</li>
            <li>Enhanced metadata extraction and custom field mapping</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center pt-6 border-t border-slate-200">
      <p class="text-slate-600 mb-4">
        The Preserve stage is the foundation of defensible e-discovery, and ListBot.ca delivers
        enterprise-grade preservation through modern cloud technology.
      </p>
      <button
        @click="goBack"
        class="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
      >
        ← Back to Documents
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.go(-1);
};
</script>

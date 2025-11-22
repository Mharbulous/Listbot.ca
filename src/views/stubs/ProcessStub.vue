<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Developer Notice -->
    <div class="bg-amber-50 border-l-4 border-amber-500 p-6 mb-6 rounded-lg">
      <div class="flex items-start gap-3">
        <div class="text-2xl">🔧</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Developer Planning Page</h3>
          <p class="text-slate-700 mb-3">
            This is the <strong>planning and specification page</strong> for the Processing Dashboard.
            For the actual Processing Dashboard with implementation status and metrics, see:
          </p>
          <router-link
            to="/process"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            → View Processing Dashboard
          </router-link>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4"
      >
        EDRM Stage 4: Processing - Blueprint & Specifications
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Process Workflow Architecture</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        Technical blueprint for the Process stage: document volume reduction through hash-based deduplication,
        email threading, AI analysis, and metadata extraction. This page uses <span class="text-blue-600 font-semibold">blue text for planned features</span>
        and <span class="font-semibold">black text for implemented components</span>.
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500 p-6 mb-8 rounded-lg"
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
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Status (Granular)</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <!-- Exact Deduplication -->
        <div class="bg-white border-2 border-emerald-500 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">BLAKE3 Hash Deduplication</h3>
              <p class="text-sm text-emerald-600 font-medium">✓ Implemented (Upload Stage)</p>
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
        <div class="bg-white border-2 border-emerald-500 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🗂️</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Categorization System</h3>
              <p class="text-sm text-emerald-600 font-medium">✓ Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3 text-sm">
            Automated document classification based on content analysis for efficient organization.
          </p>
          <div class="text-xs text-slate-500 space-y-1">
            <div><strong>Feature:</strong> Organize → Categories</div>
            <div><strong>Benefit:</strong> Streamlines document review</div>
          </div>
        </div>

        <!-- Performance Monitoring -->
        <div class="bg-white border-2 border-amber-400 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">⚠️</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Performance Analysis</h3>
              <p class="text-sm text-amber-600 font-medium">⚙️ In Progress (Bottleneck Detected)</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3 text-sm">
            Known bottleneck: Tentative verification taking 88ms/file (expected: 3-14ms/file).
          </p>
          <div class="text-xs text-slate-500 space-y-1">
            <div><strong>Doc:</strong> <code>docs/Features/Upload/Processing/performance-analysis-summary.md</code></div>
            <div><strong>Status:</strong> Under investigation</div>
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
          Quick Wins - Phase 1
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Email Threading -->
          <div class="bg-white border-2 border-blue-300 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📧</div>
              <div>
                <h4 class="text-lg font-semibold text-blue-600">Email Threading</h4>
                <p class="text-sm text-blue-600 font-medium">📋 PLANNED - Highest ROI Feature</p>
              </div>
            </div>
            <p class="text-blue-700 mb-3 text-sm">
              Automatically identifies and groups email conversations, marking inclusive emails
              (containing all prior conversation content) vs. non-inclusive replies.
            </p>
            <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
              <div class="text-sm font-medium text-blue-900 mb-1">Expected Impact:</div>
              <div class="text-2xl font-bold text-blue-700">40-74%</div>
              <div class="text-sm text-blue-800">Review time reduction</div>
            </div>
            <div class="text-xs text-blue-600 space-y-1">
              <div><strong>Approach:</strong> Email header parsing + conversation reconstruction</div>
              <div><strong>Library:</strong> TBD (mailparser, email-reply-parser)</div>
              <div><strong>Implementation:</strong> Review only final inclusive emails</div>
            </div>
          </div>

          <!-- Processing Analytics Dashboard -->
          <div class="bg-white border-2 border-blue-300 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📈</div>
              <div>
                <h4 class="text-lg font-semibold text-blue-600">Processing Analytics Dashboard</h4>
                <p class="text-sm text-blue-600 font-medium">📋 PLANNED - Quick Win</p>
              </div>
            </div>
            <p class="text-blue-700 mb-3 text-sm">
              Real-time visualization showing processing progress, deduplication statistics, error
              rates, and volume reduction achieved.
            </p>
            <div class="text-xs text-blue-600 space-y-1">
              <div><strong>Metrics:</strong> Before/after document counts, deduplication breakdown</div>
              <div><strong>Tracking:</strong> Processing errors, bottlenecks, volume reduction</div>
              <div><strong>Visualization:</strong> Chart.js for progress tracking</div>
              <div><strong>Data Source:</strong> Firestore upload queue + processing status</div>
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

      <!-- Planned Enhancements -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Enhancements</h2>

        <!-- High Priority Features -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span
              class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
            >
              3
            </div>
            <div>
              <h4 class="font-semibold text-blue-600 mb-1">AI Fuzzy Deduplication <span class="text-xs">📋 PLANNED</span></h4>
              <p class="text-blue-700 text-sm">
                Advanced AI analysis identifies near-duplicate documents with similar but not
                identical content.
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              4
            </div>
            <div>
              <h4 class="font-semibold text-blue-600 mb-1">Email Threading <span class="text-xs">📋 PLANNED</span></h4>
              <p class="text-blue-700 text-sm">
                Email conversations are reconstructed and analyzed to identify inclusive vs.
                non-inclusive messages.
              </p>
            </div>
          </div>

          <!-- Step 5 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center"
            >
              5
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                Categorization <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                Documents are automatically categorized based on content analysis for efficient
                organization.
              </p>
            </div>
          </div>

          <!-- Step 6 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center"
            >
              6
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Review-Ready Corpus <span class="text-sm text-emerald-600">(Output)</span></h4>
              <p class="text-slate-600 text-sm">
                Processed documents optimized for review, with volume reduced by 50-75%
                and organized for efficient analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competitive Advantage -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Advantage</h2>
      <p class="text-slate-700 mb-4">
        ListBot.ca's processing capabilities will put it ahead of basic platforms while remaining more
        accessible than enterprise solutions:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">AI fuzzy deduplication</span> will surpass basic hash-only
            platforms
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Email threading</span> will deliver 40-74% review time reduction
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Processing analytics</span> will provide real-time insights
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Modern tech stack</span> (Vue 3, Firebase) ensures
            performance
          </div>
        </div>

        <!-- Medium Priority Features -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span
              class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              MEDIUM PRIORITY
            </span>
            Advanced Processing - Phase 2
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="🤖"
              title="AI Fuzzy Deduplication"
              badge="Advanced AI Analysis"
              description="Advanced AI-powered detection of near-duplicate documents that are substantially similar but not identical, reducing review volume while preserving important variations."
            />

            <FeatureCard
              icon="⚙️"
              title="Processing Profiles"
              badge="Workflow Efficiency"
              description="Save and reuse preferred processing settings across similar matters, including deduplication preferences and metadata field selections."
            />

            <FeatureCard
              icon="⚠️"
              title="Exception Handling Workflows"
              badge="Quality Assurance"
              description="Dedicated workflows for files that fail to process, with manual review queues and retry mechanisms."
            />

            <FeatureCard
              icon="🗂️"
              title="Metadata Field Mapping"
              badge="Customization"
              description="Configure which metadata fields to extract and preserve during processing, supporting 600+ file types."
            />
          </div>
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Processing Workflow" :steps="workflowSteps" />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="blue"
        description="ListBot.ca's processing capabilities will put it ahead of basic platforms while remaining more accessible than enterprise solutions:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
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
import StubPageLayout from '@/components/stubs/StubPageLayout.vue';
import PageHeader from '@/components/stubs/PageHeader.vue';
import KeyImpactBox from '@/components/stubs/KeyImpactBox.vue';
import FeatureCard from '@/components/stubs/FeatureCard.vue';
import WorkflowSteps from '@/components/stubs/WorkflowSteps.vue';
import CompetitiveAdvantageGrid from '@/components/stubs/CompetitiveAdvantageGrid.vue';
import ImplementationTimeline from '@/components/stubs/ImplementationTimeline.vue';
import StubFooter from '@/components/stubs/StubFooter.vue';

const workflowSteps = [
  {
    title: 'Collection & Upload',
    description: 'Documents are collected and uploaded to the platform with original metadata preserved.',
  },
  {
    title: 'Hash Calculation & Exact Deduplication',
    description:
      'BLAKE3 hashes are calculated during upload to identify and group exact duplicates, reducing storage and processing costs.',
    status: 'Implemented at Preserve stage',
  },
  {
    title: 'AI Fuzzy Deduplication',
    description:
      'Advanced AI analysis identifies near-duplicate documents with similar but not identical content (planned).',
  },
  {
    title: 'Email Threading',
    description:
      'Email conversations are reconstructed and analyzed to identify inclusive vs. non-inclusive messages (planned).',
  },
  {
    title: 'Categorization',
    description:
      'Documents are automatically categorized based on content analysis for efficient organization.',
    status: 'Implemented',
  },
  {
    title: 'Review-Ready Corpus',
    description:
      'Processed documents are now optimized for review, with volume reduced by 50-75% and organized for efficient analysis.',
  },
];

const competitiveAdvantages = [
  { label: 'AI fuzzy deduplication', text: 'will surpass basic hash-only platforms' },
  { label: 'Email threading', text: 'will deliver 40-74% review time reduction' },
  { label: 'Processing analytics', text: 'will provide real-time insights' },
  { label: 'Modern tech stack', text: '(Vue 3, Firebase) ensures performance' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Quick Wins',
    timeframe: '1-2 months',
    color: 'amber',
    items: [
      'Email threading with header parsing and conversation reconstruction',
      'Processing analytics dashboard with Chart.js visualizations',
    ],
  },
  {
    title: 'Phase 2: Advanced Features',
    timeframe: '3-6 months',
    color: 'blue',
    items: [
      'Processing profiles for workflow reuse',
      'Exception handling workflows and manual review queues',
      'Metadata field mapping and customization',
      'Enhanced email threading visualization',
    ],
  },
];
</script>

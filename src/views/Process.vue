<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4"
      >
        EDRM Stage 4: Processing
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Process Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Process stage reduces document volume and converts files to reviewable formats through
        intelligent deduplication, filtering, and metadata extraction—the most impactful
        cost-reduction stage in e-discovery.
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
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Current Implementation</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Implemented Feature 1 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Categorization</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Automated organization and classification of documents based on content analysis,
            enabling efficient document organization and retrieval.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Streamlines document review and discovery
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
          <div class="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📧</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Email Threading</h4>
                <p class="text-sm text-amber-600 font-medium">CRITICAL - Highest ROI Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automatically identifies and groups email conversations, marking inclusive emails
              (containing all prior conversation content) vs. non-inclusive replies.
            </p>
            <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
              <div class="text-sm font-medium text-amber-900 mb-1">Expected Impact:</div>
              <div class="text-2xl font-bold text-amber-700">40-74%</div>
              <div class="text-sm text-amber-800">Review time reduction</div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">How it works:</span> Review only the final inclusive email
              instead of every message in a thread
            </div>
          </div>

          <!-- Exact Hash Deduplication -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔍</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">
                  Exact Hash-Based Deduplication
                </h4>
                <p class="text-sm text-blue-600 font-medium">Quick Win</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              MD5/SHA256 hash matching to identify and remove exact duplicate files, complementing
              the existing AI fuzzy deduplication.
            </p>
            <div class="text-sm text-slate-500 mb-2">
              <span class="font-medium">Implementation:</span> Hash calculated during upload via
              Firebase Cloud Functions
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Eliminates true duplicates instantly,
              typically reducing corpus by 30-50%
            </div>
          </div>

          <!-- Processing Analytics Dashboard -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📈</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Processing Analytics Dashboard</h4>
                <p class="text-sm text-blue-600 font-medium">Quick Win</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Real-time visualization showing processing progress, deduplication statistics, error
              rates, and volume reduction achieved.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Metrics:</span> Before/after document counts</div>
              <div><span class="font-medium">Breakdown:</span> By deduplication type</div>
              <div><span class="font-medium">Tracking:</span> Processing errors and exceptions</div>
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
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🤖</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">AI Fuzzy Deduplication</h4>
                <p class="text-sm text-slate-600 font-medium">Advanced AI Analysis</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Advanced AI-powered detection of near-duplicate documents that are substantially
              similar but not identical, reducing review volume while preserving important
              variations.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Identifies documents that exact hash matching
              would miss
            </div>
          </div>

          <!-- Processing Profiles -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">⚙️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Processing Profiles</h4>
                <p class="text-sm text-slate-600 font-medium">Workflow Efficiency</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Save and reuse preferred processing settings across similar matters, including
              deduplication preferences and metadata field selections.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Consistent processing standards and faster
              matter setup
            </div>
          </div>

          <!-- Exception Handling -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">⚠️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Exception Handling Workflows</h4>
                <p class="text-sm text-slate-600 font-medium">Quality Assurance</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Dedicated workflows for files that fail to process, with manual review queues and
              retry mechanisms.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Ensures no documents are lost due to
              processing errors
            </div>
          </div>

          <!-- Metadata Field Mapping -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🗂️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Metadata Field Mapping</h4>
                <p class="text-sm text-slate-600 font-medium">Customization</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Configure which metadata fields to extract and preserve during processing, supporting
              600+ file types.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Tailor metadata extraction to specific case
              requirements
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Processing Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Processing Workflow</h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="space-y-4">
          <!-- Step 1 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              1
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Collection & Upload</h4>
              <p class="text-slate-600">
                Documents are collected and uploaded to the platform with original metadata
                preserved.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              2
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Hash Calculation & Exact Deduplication</h4>
              <p class="text-slate-600">
                MD5/SHA256 hashes are calculated to identify and group exact duplicates
                (planned).
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              3
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">AI Fuzzy Deduplication</h4>
              <p class="text-slate-600">
                Advanced AI analysis identifies near-duplicate documents with similar but not
                identical content (planned).
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
              <h4 class="font-semibold text-slate-900 mb-1">Email Threading</h4>
              <p class="text-slate-600">
                Email conversations are reconstructed and analyzed to identify inclusive vs.
                non-inclusive messages (planned).
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
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              6
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Review-Ready Corpus</h4>
              <p class="text-slate-600">
                Processed documents are now optimized for review, with volume reduced by 50-75%
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
      </div>
    </div>

    <!-- Implementation Timeline -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Timeline</h2>
      <div class="space-y-4">
        <!-- Phase 1 -->
        <div class="border-l-4 border-amber-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Quick Wins</h3>
            <span class="text-sm text-slate-600">(1-2 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Exact hash-based deduplication (MD5/SHA256)</li>
            <li>Basic email threading with header parsing</li>
            <li>Processing analytics dashboard with Chart.js</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-blue-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: Advanced Features</h3>
            <span class="text-sm text-slate-600">(3-6 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Processing profiles for workflow reuse</li>
            <li>Exception handling workflows and manual review queues</li>
            <li>Metadata field mapping and customization</li>
            <li>Enhanced email threading visualization</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center pt-6 border-t border-slate-200">
      <p class="text-slate-600 mb-4">
        The Process stage is foundational to efficient e-discovery, and ListBot.ca is committed to
        delivering enterprise-grade capabilities through modern technology.
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

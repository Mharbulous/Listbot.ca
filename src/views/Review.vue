<template>
  <div class="review-workflow-page max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-indigo-100 text-indigo-800 mb-4"
      >
        🧑‍💻 EDRM Stage 5: Review
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Review Workflow</h1>
      <p class="text-xl text-slate-600 mb-6">
        Evaluating electronically stored information (ESI) for relevance, privilege, and
        responsiveness to discovery requests. This is the most resource-intensive and expensive
        stage, requiring attorney judgment at scale.
      </p>
    </div>

    <!-- No Documents Warning (if applicable) -->
    <div
      v-if="!hasMatter"
      class="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start">
        <span class="text-3xl mr-4">⚠️</span>
        <div>
          <h3 class="text-lg font-semibold text-amber-900 mb-2">No Active Matter Selected</h3>
          <p class="text-amber-800 mb-3">
            To begin reviewing documents, you need to select or create a matter first.
          </p>
          <button
            @click="goToMatters"
            class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Go to Matters →
          </button>
        </div>
      </div>
    </div>

    <!-- Overview Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">What is the Review Stage?</h2>
      <p class="text-slate-700 mb-4">
        Review is the
        <strong>highest-cost stage</strong> in e-discovery, representing up to 80% of the total
        e-discovery budget. Platform quality and efficiency at this stage directly impact
        profitability and case outcomes.
      </p>
      <p class="text-slate-700 mb-4">
        During review, attorneys evaluate each document to determine if it's responsive to
        discovery requests, privileged, confidential, or otherwise relevant to the case. The review
        process involves tagging documents with issue codes, marking privilege assertions, and
        flagging key evidence.
      </p>
      <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mt-4">
        <p class="text-indigo-900">
          <strong>Current Status:</strong> ListBot.ca has implemented human review capabilities
          with document viewing, tagging, and basic collaboration features. Advanced AI-assisted
          review features are planned to dramatically reduce review time and costs.
        </p>
      </div>
    </div>

    <!-- Current Implementation -->
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-6 mb-8">
      <div class="flex items-center mb-4">
        <span class="text-2xl mr-3">✅</span>
        <h2 class="text-2xl font-semibold text-slate-900">Already Implemented</h2>
      </div>
      <div class="space-y-4">
        <div class="bg-white rounded-lg p-4">
          <h3 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
            <span class="mr-2">📄</span>
            Document Viewer
          </h3>
          <p class="text-slate-700 mb-2">
            View documents in multiple formats with smooth navigation and quick-access controls.
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>Native file viewing for common formats</li>
            <li>PDF rendering with zoom and pan controls</li>
            <li>Quick navigation between documents</li>
            <li>Metadata display panel</li>
          </ul>
        </div>

        <div class="bg-white rounded-lg p-4">
          <h3 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
            <span class="mr-2">🏷️</span>
            Document Tagging & Coding
          </h3>
          <p class="text-slate-700 mb-2">
            Apply tags and issue codes to organize documents and track review progress.
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>Custom category and tag creation</li>
            <li>Quick tagging with keyboard shortcuts</li>
            <li>Hierarchical coding structures</li>
            <li>Batch tagging operations</li>
          </ul>
        </div>

        <div class="bg-white rounded-lg p-4">
          <h3 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
            <span class="mr-2">🔍</span>
            Search & Filtering
          </h3>
          <p class="text-slate-700 mb-2">
            Find specific documents quickly using powerful search and filter capabilities.
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>Full-text search across all documents</li>
            <li>Filter by tags, categories, and metadata</li>
            <li>Saved search queries</li>
            <li>Advanced Boolean search operators</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Planned Enhancements -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-6">Planned Enhancements</h2>

      <!-- Quick Wins -->
      <div class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-3">⚡</span>
          <h3 class="text-xl font-semibold text-slate-900">High-Impact Features</h3>
        </div>

        <div class="space-y-4">
          <!-- Email Threading Visualization -->
          <div class="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                  <span class="mr-2">✉️</span>
                  Email Threading Visualization
                </h4>
                <p class="text-slate-700 mb-2">
                  <strong class="text-blue-600">CRITICAL FEATURE:</strong> Visual display of email
                  conversation threads with inclusive/non-inclusive designation. Research shows
                  this delivers 40-74% review time reduction - the highest ROI feature in
                  e-discovery.
                </p>
                <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
                  <li>Tree view of email conversation structure</li>
                  <li>Automatic identification of inclusive emails</li>
                  <li>One-click navigation through thread hierarchy</li>
                  <li>Review only inclusive emails, skip redundant replies</li>
                </ul>
              </div>
              <div class="ml-4 flex-shrink-0">
                <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  40-74% faster
                </div>
              </div>
            </div>
          </div>

          <!-- AI Document Summaries -->
          <div class="bg-white rounded-lg p-4 border-l-4 border-purple-500">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                  <span class="mr-2">🤖</span>
                  AI-Powered Document Summaries
                </h4>
                <p class="text-slate-700 mb-2">
                  Automatic 2-3 sentence summaries using Google Gemini AI, allowing quick content
                  understanding without reading entire documents.
                </p>
                <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
                  <li>One-click AI summarization using Gemini Flash</li>
                  <li>Key passage highlighting</li>
                  <li>Entity extraction (people, dates, amounts)</li>
                  <li>Document type identification</li>
                </ul>
              </div>
              <div class="ml-4 flex-shrink-0">
                <div class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                  AI-powered
                </div>
              </div>
            </div>
          </div>

          <!-- Review Progress Dashboard -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📊</span>
              Review Progress Dashboard
            </h4>
            <p class="text-slate-700 mb-2">
              Real-time visibility into review progress with productivity metrics and estimated
              completion dates.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Documents reviewed per hour by reviewer</li>
              <li>Coding distribution and tag statistics</li>
              <li>Estimated completion dates based on current pace</li>
              <li>Quality control metrics and disagreement tracking</li>
            </ul>
          </div>

          <!-- Review Batching System -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📦</span>
              Review Batching & Load Balancing
            </h4>
            <p class="text-slate-700 mb-2">
              Automatically distribute review work across team members with balanced workload
              allocation.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Create review batches by size or criteria</li>
              <li>Automatic load balancing across reviewers</li>
              <li>Track batch completion status</li>
              <li>Reassign batches as needed</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Advanced Features -->
      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-3">🚀</span>
          <h3 class="text-xl font-semibold text-slate-900">Advanced AI Features</h3>
        </div>

        <div class="space-y-4">
          <!-- Technology Assisted Review (TAR) -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">🎯</span>
              Technology Assisted Review (TAR)
            </h4>
            <p class="text-slate-700 mb-2">
              Predictive coding with Continuous Active Learning (CAL) that learns from reviewer
              decisions in real-time and promotes relevant documents to the top of review queues.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Active learning algorithms that improve with feedback</li>
              <li>Relevance ranking with confidence scores</li>
              <li>Defensibility metrics for court acceptance</li>
              <li>Model performance tracking and reporting</li>
            </ul>
          </div>

          <!-- AI Tag Suggestions -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">💡</span>
              AI Tag Suggestions
            </h4>
            <p class="text-slate-700 mb-2">
              Smart tagging recommendations with confidence scores based on document content and
              past coding decisions.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Suggest relevant tags based on content analysis</li>
              <li>Learn from reviewer decisions to improve accuracy</li>
              <li>Confidence scores for each suggestion</li>
              <li>One-click acceptance or rejection</li>
            </ul>
          </div>

          <!-- Privilege Prediction -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">⚖️</span>
              Privilege Prediction
            </h4>
            <p class="text-slate-700 mb-2">
              AI-powered identification of potentially privileged documents to prevent inadvertent
              disclosure.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Automatic detection of attorney-client communications</li>
              <li>Work product identification</li>
              <li>Flag potentially privileged content for review</li>
              <li>Privilege log assistance</li>
            </ul>
          </div>

          <!-- Similar Document Clustering -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">🔗</span>
              Similar Document Identification
            </h4>
            <p class="text-slate-700 mb-2">
              Find documents similar to the current one to maintain coding consistency and discover
              related evidence.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Content-based similarity detection</li>
              <li>Visual clustering of related documents</li>
              <li>Batch coding for similar documents</li>
              <li>Consistency checking across related docs</li>
            </ul>
          </div>

          <!-- Quality Control Sampling -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">✓</span>
              Quality Control Workflows
            </h4>
            <p class="text-slate-700 mb-2">
              Systematic sampling and second-pass review to ensure coding accuracy and
              defensibility.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Random sampling for secondary review</li>
              <li>Disagreement tracking and resolution</li>
              <li>Accuracy metrics by reviewer</li>
              <li>Escalation workflows for complex documents</li>
            </ul>
          </div>

          <!-- Real-Time Collaboration -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">👥</span>
              Enhanced Team Collaboration
            </h4>
            <p class="text-slate-700 mb-2">
              Real-time collaboration features enabling distributed review teams to work together
              seamlessly.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Shared notes and annotations visible to all team members</li>
              <li>Document-level comment threads with @mentions</li>
              <li>Real-time presence indicators</li>
              <li>Activity feeds showing team progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Standards -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Industry Performance Standards</h2>
      <p class="text-slate-700 mb-4">
        Leading e-discovery platforms set high standards for review interface performance:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-slate-50 rounded-lg p-4">
          <div class="text-3xl font-bold text-blue-600 mb-2">&lt;1 sec</div>
          <p class="text-sm text-slate-600">
            <strong>Industry Standard:</strong> Document-to-document navigation time
          </p>
        </div>
        <div class="bg-slate-50 rounded-lg p-4">
          <div class="text-3xl font-bold text-purple-600 mb-2">0.4 sec</div>
          <p class="text-sm text-slate-600">
            <strong>Relativity Aero:</strong> Best-in-class navigation speed
          </p>
        </div>
        <div class="bg-slate-50 rounded-lg p-4">
          <div class="text-3xl font-bold text-green-600 mb-2">80%</div>
          <p class="text-sm text-slate-600">
            <strong>Cost Impact:</strong> Review represents 80% of total e-discovery budget
          </p>
        </div>
      </div>
    </div>

    <!-- Key Benefits Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Key Benefits</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="flex items-start">
          <span class="text-2xl mr-3">💰</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Cost Efficiency</h3>
            <p class="text-slate-600">
              Email threading and AI assistance reduce review time by 40-74%, directly cutting the
              largest component of e-discovery costs.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">🎯</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Improved Accuracy</h3>
            <p class="text-slate-600">
              AI tag suggestions and privilege prediction help maintain coding consistency and
              prevent inadvertent disclosure.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">👥</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Team Collaboration</h3>
            <p class="text-slate-600">
              Real-time collaboration features enable distributed teams to work together
              seamlessly, sharing insights and maintaining consistency.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">⚖️</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Defensibility</h3>
            <p class="text-slate-600">
              Quality control workflows and TAR defensibility metrics ensure your review process
              meets court standards.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Integration -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">EDRM Workflow Integration</h2>
      <p class="text-slate-700 mb-4">
        The Review stage is where legal expertise meets technology. Processed documents flow into
        review, and reviewer decisions inform downstream stages:
      </p>
      <div class="space-y-3">
        <div class="flex items-center">
          <span class="text-xl mr-3">🤖</span>
          <span class="font-semibold text-slate-900 mr-2">Process</span>
          <span class="text-slate-600"
            >→ Deduplicated, organized documents ready for review</span
          >
        </div>
        <div class="flex items-center bg-indigo-50 px-3 py-2 rounded">
          <span class="text-xl mr-3">🧑‍💻</span>
          <span class="font-semibold text-indigo-900 mr-2">Review</span>
          <span class="text-indigo-700"
            >→ Attorneys evaluate relevance, privilege, and responsiveness</span
          >
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🧠</span>
          <span class="font-semibold text-slate-900 mr-2">Analyze</span>
          <span class="text-slate-600"
            >→ Coding decisions enable pattern detection and strategic insights</span
          >
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">📃</span>
          <span class="font-semibold text-slate-900 mr-2">Produce</span>
          <span class="text-slate-600"
            >→ Tagged responsive, non-privileged documents prepared for production</span
          >
        </div>
      </div>
    </div>

    <!-- Getting Started -->
    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
      <h2 class="text-3xl font-bold mb-4">Ready to Review?</h2>
      <p class="text-xl mb-4">
        Start reviewing documents by navigating to your matter's document collection.
      </p>
      <div class="flex gap-4 justify-center">
        <button
          @click="goToMatters"
          class="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
        >
          View Matters →
        </button>
        <button
          @click="goToDocuments"
          :disabled="!hasMatter"
          :class="[
            'inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors font-semibold',
            hasMatter
              ? 'bg-white/20 text-white hover:bg-white/30'
              : 'bg-white/10 text-white/50 cursor-not-allowed',
          ]"
        >
          View Documents →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMatterViewStore } from '@/features/matters/stores/matterView';

const router = useRouter();
const matterViewStore = useMatterViewStore();

const hasMatter = computed(() => !!matterViewStore.currentMatterId);

function goToMatters() {
  router.push('/matters');
}

function goToDocuments() {
  if (hasMatter.value) {
    router.push(`/matters/${matterViewStore.currentMatterId}/documents`);
  }
}
</script>

<style scoped>
.review-workflow-page {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

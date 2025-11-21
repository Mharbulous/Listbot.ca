<template>
  <div class="process-workflow-page max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-purple-100 text-purple-800 mb-4"
      >
        🤖 EDRM Stage 4: Process
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Process Workflow</h1>
      <p class="text-xl text-slate-600 mb-6">
        Reducing ESI volume and converting it to reviewable formats through deduplication, file
        filtering, metadata extraction, and format conversion. This is the critical data refinement
        stage.
      </p>
    </div>

    <!-- Overview Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">What is the Process Stage?</h2>
      <p class="text-slate-700 mb-4">
        The Process stage is the
        <strong>most impactful cost-reduction stage</strong> in e-discovery, with effective
        processing reducing review costs (which represent 80% of total e-discovery expenses) by
        50-75%.
      </p>
      <p class="text-slate-700 mb-4">
        This stage transforms raw collected data into organized, deduplicated, and reviewable
        documents. By eliminating redundant content and extracting critical metadata, processing
        dramatically reduces the volume of documents that require human review.
      </p>
      <div class="bg-purple-50 border-l-4 border-purple-500 p-4 mt-4">
        <p class="text-purple-900">
          <strong>Current Status:</strong> ListBot.ca has implemented AI-powered fuzzy
          deduplication and intelligent categorization, providing a strong foundation for this
          critical stage. Additional processing features are planned to further reduce review time
          and costs.
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
            <span class="mr-2">🔍</span>
            AI Fuzzy Deduplication
          </h3>
          <p class="text-slate-700 mb-2">
            Advanced similarity detection that identifies near-duplicate documents, not just exact
            copies. This intelligent approach catches variations of the same content that
            traditional hash-based methods would miss.
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>Identifies documents with similar content but minor differences</li>
            <li>Reduces review volume by consolidating near-duplicates</li>
            <li>AI-powered analysis for accurate similarity scoring</li>
            <li>Preserves original documents while flagging duplicates</li>
          </ul>
        </div>

        <div class="bg-white rounded-lg p-4">
          <h3 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
            <span class="mr-2">🏷️</span>
            Intelligent Categorization
          </h3>
          <p class="text-slate-700 mb-2">
            Automated document classification that organizes your collection into meaningful
            categories, making review faster and more efficient.
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
            <li>AI-powered content analysis and classification</li>
            <li>Custom category creation and management</li>
            <li>Automatic tagging based on document content</li>
            <li>Hierarchical category structures</li>
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
          <h3 class="text-xl font-semibold text-slate-900">Quick Wins (High Priority)</h3>
        </div>

        <div class="space-y-4">
          <!-- Exact Hash-Based Deduplication -->
          <div class="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                  <span class="mr-2">🔐</span>
                  Exact Hash-Based Deduplication
                </h4>
                <p class="text-slate-700 mb-2">
                  Lightning-fast identification of exact duplicate files using MD5/SHA256 hashing.
                  This catches identical files regardless of filename or location.
                </p>
                <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
                  <li>Instant duplicate detection via cryptographic hashing</li>
                  <li>Groups exact duplicates for efficient review</li>
                  <li>"Review one, tag all" functionality</li>
                  <li>Typically reduces document volume by 30-40%</li>
                </ul>
              </div>
              <div class="ml-4 flex-shrink-0">
                <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  30-40% reduction
                </div>
              </div>
            </div>
          </div>

          <!-- Email Threading -->
          <div class="bg-white rounded-lg p-4 border-l-4 border-amber-500">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                  <span class="mr-2">✉️</span>
                  Email Threading
                </h4>
                <p class="text-slate-700 mb-2">
                  <strong class="text-amber-600">CRITICAL FEATURE:</strong> Identifies email
                  conversation threads and marks inclusive emails (containing all prior messages).
                  Industry research shows this delivers 40-74% review time reduction - the highest
                  ROI feature in e-discovery.
                </p>
                <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
                  <li>Parse email headers to reconstruct conversation threads</li>
                  <li>Identify inclusive vs. non-inclusive emails</li>
                  <li>Visual thread hierarchy for easy navigation</li>
                  <li>Review only inclusive emails, skip redundant replies</li>
                </ul>
              </div>
              <div class="ml-4 flex-shrink-0">
                <div class="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                  40-74% reduction
                </div>
              </div>
            </div>
          </div>

          <!-- Processing Analytics Dashboard -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📊</span>
              Processing Analytics Dashboard
            </h4>
            <p class="text-slate-700 mb-2">
              Real-time visibility into processing progress and volume reduction achieved through
              various deduplication methods.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Before/after document counts with visual comparisons</li>
              <li>Breakdown by deduplication type (exact, near-duplicate, threading)</li>
              <li>Processing speed metrics and estimated completion time</li>
              <li>Error rates and exception handling statistics</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Advanced Features -->
      <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-3">🚀</span>
          <h3 class="text-xl font-semibold text-slate-900">
            Advanced Features (Future Enhancements)
          </h3>
        </div>

        <div class="space-y-4">
          <!-- Metadata Extraction -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📋</span>
              Advanced Metadata Extraction
            </h4>
            <p class="text-slate-700 mb-2">
              Automatically extract and preserve critical metadata fields from 600+ file types for
              downstream analysis and filtering.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Author, creation date, modification date extraction</li>
              <li>Email metadata (from, to, cc, bcc, subject, date sent)</li>
              <li>Custom metadata field mapping</li>
              <li>Original file path preservation</li>
            </ul>
          </div>

          <!-- Container Extraction -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📦</span>
              Container Extraction & Processing
            </h4>
            <p class="text-slate-700 mb-2">
              Automatically extract and process files from compressed archives and email containers
              like PST files.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>PST/OST email archive extraction</li>
              <li>ZIP, RAR, 7Z archive processing</li>
              <li>Email attachment separation and indexing</li>
              <li>Nested container handling</li>
            </ul>
          </div>

          <!-- OCR and Text Extraction -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📄</span>
              OCR and Text Extraction
            </h4>
            <p class="text-slate-700 mb-2">
              Make scanned documents and images fully searchable through optical character
              recognition.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>OCR for scanned PDFs and image files</li>
              <li>Multi-language OCR support</li>
              <li>Text extraction from native file formats</li>
              <li>Searchable text overlay creation</li>
            </ul>
          </div>

          <!-- Processing Profiles -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">⚙️</span>
              Reusable Processing Profiles
            </h4>
            <p class="text-slate-700 mb-2">
              Save and reuse preferred processing settings across similar matters for consistent,
              efficient processing.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Save deduplication preferences</li>
              <li>Define metadata field selections</li>
              <li>Configure file type filters</li>
              <li>Share profiles across team members</li>
            </ul>
          </div>

          <!-- Exception Handling -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">⚠️</span>
              Intelligent Exception Handling
            </h4>
            <p class="text-slate-700 mb-2">
              Systematic management of files that fail to process with manual review queues and
              retry mechanisms.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Automatic detection of processing failures</li>
              <li>Exception queue for manual review</li>
              <li>Detailed error reporting and logging</li>
              <li>Retry mechanisms for transient failures</li>
            </ul>
          </div>
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
            <h3 class="font-semibold text-slate-900 mb-1">Massive Cost Reduction</h3>
            <p class="text-slate-600">
              Effective processing reduces review costs by 50-75%. Since review represents 80% of
              e-discovery expenses, this is the highest-impact optimization stage.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">⚡</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Time Savings</h3>
            <p class="text-slate-600">
              Email threading alone reduces review time by 40-74%, letting attorneys focus only on
              the most complete, inclusive communications.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">🎯</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Improved Accuracy</h3>
            <p class="text-slate-600">
              By eliminating redundant content, reviewers can focus on unique documents, reducing
              fatigue and improving coding consistency.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">📊</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Early Case Assessment</h3>
            <p class="text-slate-600">
              Processing analytics provide immediate insights into document volume, types, and date
              ranges, informing case strategy before review begins.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Industry Benchmarks -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Industry Benchmarks</h2>
      <p class="text-slate-700 mb-4">
        Leading e-discovery platforms demonstrate the importance of high-performance processing:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg p-4">
          <div class="text-3xl font-bold text-blue-600 mb-2">900K-1M</div>
          <p class="text-sm text-slate-600">
            <strong>Everlaw:</strong> Documents processed per hour
          </p>
        </div>
        <div class="bg-white rounded-lg p-4">
          <div class="text-3xl font-bold text-purple-600 mb-2">20+ TB</div>
          <p class="text-sm text-slate-600">
            <strong>Casepoint:</strong> Data processed per day, 10x faster than competitors
          </p>
        </div>
        <div class="bg-white rounded-lg p-4">
          <div class="text-3xl font-bold text-green-600 mb-2">600+</div>
          <p class="text-sm text-slate-600">
            <strong>Standard:</strong> File types supported by enterprise platforms
          </p>
        </div>
      </div>
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
        <p class="text-blue-900">
          <strong>ListBot.ca's Advantage:</strong> Our AI fuzzy deduplication already puts us ahead
          of basic platforms. With email threading and exact hash-based deduplication, we'll
          deliver enterprise-level processing capabilities through a superior user experience.
        </p>
      </div>
    </div>

    <!-- Workflow Integration -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">EDRM Workflow Integration</h2>
      <p class="text-slate-700 mb-4">
        The Process stage receives collected data and prepares it for efficient review. It sits at
        the critical midpoint of the EDRM workflow:
      </p>
      <div class="space-y-3">
        <div class="flex items-center">
          <span class="text-xl mr-3">🗃️</span>
          <span class="font-semibold text-slate-900 mr-2">Collect</span>
          <span class="text-slate-600">→ Raw ESI gathered from various sources</span>
        </div>
        <div class="flex items-center bg-purple-50 px-3 py-2 rounded">
          <span class="text-xl mr-3">🤖</span>
          <span class="font-semibold text-purple-900 mr-2">Process</span>
          <span class="text-purple-700"
            >→ Deduplicate, extract metadata, prepare for review</span
          >
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🧑‍💻</span>
          <span class="font-semibold text-slate-900 mr-2">Review</span>
          <span class="text-slate-600"
            >→ Attorneys review only unique, relevant documents (50-75% fewer docs)</span
          >
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🧠</span>
          <span class="font-semibold text-slate-900 mr-2">Analyze</span>
          <span class="text-slate-600"
            >→ Clean data enables accurate pattern detection and insights</span
          >
        </div>
      </div>
    </div>

    <!-- Technical Foundation -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Technical Foundation</h2>
      <p class="text-slate-700 mb-4">
        ListBot.ca's processing features leverage our modern technology stack for superior
        performance:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Web Workers</h3>
          <p class="text-slate-600 text-sm">
            CPU-intensive hashing runs in background threads using BLAKE3 algorithm without
            blocking the UI
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Firebase Cloud Functions</h3>
          <p class="text-slate-600 text-sm">
            Serverless processing scales automatically to handle large document volumes without
            infrastructure management
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Gemini AI</h3>
          <p class="text-slate-600 text-sm">
            Advanced AI for fuzzy deduplication, content analysis, and intelligent categorization
            at cost-effective rates
          </p>
        </div>
      </div>
    </div>

    <!-- Priority Recommendation -->
    <div class="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg shadow-lg p-8 text-white mb-8">
      <div class="flex items-start">
        <span class="text-5xl mr-4">🎯</span>
        <div>
          <h2 class="text-3xl font-bold mb-3">Implementation Priority: Email Threading</h2>
          <p class="text-xl mb-3">
            Industry research consistently shows email threading delivers the highest ROI in
            e-discovery, with
            <strong>40-74% review time reduction</strong>.
          </p>
          <p class="text-lg opacity-90 mb-4">
            This single feature has the greatest impact on client costs and case efficiency.
            Combined with our existing fuzzy deduplication, ListBot.ca will offer best-in-class
            processing capabilities.
          </p>
          <div class="bg-white/20 rounded-lg p-4">
            <p class="text-sm">
              <strong>Next Steps:</strong> Email threading implementation is planned as a quick win
              feature (1-2 month development timeline) using email header parsing and Vue 3 tree
              component visualization.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Banner -->
    <div class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white text-center">
      <h2 class="text-3xl font-bold mb-4">Active Development</h2>
      <p class="text-xl mb-2">
        The Process stage is partially implemented with AI fuzzy deduplication and categorization
        already available.
      </p>
      <p class="text-lg opacity-90">
        Email threading, exact hash deduplication, and processing analytics are planned for the
        next development phase to deliver industry-leading volume reduction.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.process-workflow-page {
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

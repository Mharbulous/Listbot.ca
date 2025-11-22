<template>
  <div class="pleadings-page max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-purple-100 text-purple-800 mb-4"
      >
        ⚖️ EDRM Stage 6: Review - Pleadings
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Pleadings Feature</h1>
      <p class="text-xl text-slate-600 mb-6">
        The only e-discovery platform that understands pleadings as the organizational framework
        for litigation—automatically extracting facts, tracking party positions, and systematically
        connecting evidence to allegations.
      </p>
    </div>

    <!-- Vision Statement -->
    <div
      class="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">🎯</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Product Vision</h3>
          <p class="text-slate-700">
            Transform how litigation lawyers work by treating pleadings as the organizational
            framework for litigation—not just another document type. Work
            <span class="font-bold text-purple-700">60% faster</span> with AI-powered fact
            extraction, automated party position tracking, and systematic evidence-to-allegation
            connections.
          </p>
        </div>
      </div>
    </div>

    <!-- What Makes This Different -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">What Makes Pleadings Different?</h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <p class="text-slate-700 mb-4">
          Unlike traditional e-discovery platforms that treat pleadings as just another document,
          ListBot.ca recognizes that pleadings are the
          <span class="font-semibold">organizing principle for litigation</span>. They define the
          issues, frame the disputes, and guide every document review decision.
        </p>
        <div class="grid gap-4 md:grid-cols-2 mt-4">
          <div class="bg-red-50 border border-red-200 rounded p-4">
            <h4 class="font-semibold text-red-900 mb-2">❌ Traditional Platforms</h4>
            <ul class="text-red-800 text-sm space-y-1">
              <li>• Pleadings treated as regular documents</li>
              <li>• Manual fact tracking in spreadsheets</li>
              <li>• No connection between facts and evidence</li>
              <li>• Lawyers waste 15-20% of time re-reading pleadings</li>
            </ul>
          </div>
          <div class="bg-emerald-50 border border-emerald-200 rounded p-4">
            <h4 class="font-semibold text-emerald-900 mb-2">✓ ListBot.ca Pleadings</h4>
            <ul class="text-emerald-800 text-sm space-y-1">
              <li>• Dedicated pleadings section with version control</li>
              <li>• AI extracts atomic facts automatically</li>
              <li>• Evidence linked directly to specific allegations</li>
              <li>• Click a fact to instantly see related documents</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase 1: MVP Features (Month 1-3) -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Phase 1: MVP Features</h2>
      <div class="mb-2">
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800"
        >
          TARGET: 3 MONTHS FROM KICKOFF
        </span>
      </div>

      <div class="space-y-4 mt-4">
        <!-- Epic 1: Pleading Document Management -->
        <div class="bg-white border-2 border-purple-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">📁</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Pleading Document Management</h3>
              <p class="text-sm text-purple-600 font-medium">Foundation Layer</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Establish pleadings as a distinct document category with dedicated navigation,
            AI-powered detection, and organized list/detail views.
          </p>
          <div class="bg-purple-50 rounded p-3 mb-3">
            <div class="text-sm font-medium text-purple-900 mb-2">Key Capabilities:</div>
            <ul class="text-sm text-purple-800 space-y-1 ml-4">
              <li>
                • AI auto-detects pleadings (Statement of Claim, Defence, Counterclaim, Reply, etc.)
              </li>
              <li>• Manual classification with pleading type selection</li>
              <li>• Dedicated "Pleadings" navigation section</li>
              <li>• List view with filtering by type and party</li>
              <li>• Detail view with embedded PDF viewer</li>
            </ul>
          </div>
        </div>

        <!-- Epic 2: Pleading Version Control -->
        <div class="bg-white border-2 border-blue-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🔄</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Pleading Version Control</h3>
              <p class="text-sm text-blue-600 font-medium">Solve Amendment Chaos</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Track amended pleadings with full version history, side-by-side comparison, and impact
            analysis—eliminating the chaos when pleadings are amended.
          </p>
          <div class="bg-blue-50 rounded p-3 mb-3">
            <div class="text-sm font-medium text-blue-900 mb-2">Key Capabilities:</div>
            <ul class="text-sm text-blue-800 space-y-1 ml-4">
              <li>• Upload amended pleadings as new versions</li>
              <li>• Version history with chronological display</li>
              <li>• Side-by-side text comparison (visual diff)</li>
              <li>• Version rollback capability</li>
              <li>• Impact analysis showing what changed</li>
            </ul>
          </div>
        </div>

        <!-- Epic 3: AI-Powered Fact Extraction -->
        <div class="bg-white border-2 border-emerald-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🤖</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">AI-Powered Fact Extraction</h3>
              <p class="text-sm text-emerald-600 font-medium">
                CRITICAL - Core Innovation & Competitive Differentiator
              </p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Automatically extract atomic facts from pleadings using Gemini API, transforming
            unstructured pleading text into structured, searchable, linkable fact records.
          </p>
          <div class="bg-emerald-50 border border-emerald-200 rounded p-3 mb-3">
            <div class="text-sm font-medium text-emerald-900 mb-1">Expected Impact:</div>
            <div class="text-2xl font-bold text-emerald-700">85%+</div>
            <div class="text-sm text-emerald-800">AI accuracy on fact extraction</div>
          </div>
          <div class="bg-emerald-50 rounded p-3">
            <div class="text-sm font-medium text-emerald-900 mb-2">Key Capabilities:</div>
            <ul class="text-sm text-emerald-800 space-y-1 ml-4">
              <li>• One-click fact extraction from pleadings</li>
              <li>• AI parsing into atomic factual assertions</li>
              <li>• Review interface with confidence scores</li>
              <li>• Manual fact entry and editing</li>
              <li>• Click fact to view source paragraph in pleading</li>
            </ul>
          </div>
        </div>

        <!-- Epic 4: Fact List Management -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">📋</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Fact List Management</h3>
              <p class="text-sm text-slate-600 font-medium">Organization & Export</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Organized, searchable, filterable interface for viewing and managing all extracted
            facts across all pleadings with export capabilities.
          </p>
          <div class="text-sm text-slate-500 mb-2">
            <span class="font-medium">Capabilities:</span> Table view, search/filter by party,
            inline editing, bulk operations, export to Excel/CSV
          </div>
        </div>

        <!-- Epic 5: Semantic Fact Deduplication -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🔍</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Semantic Fact Deduplication</h3>
              <p class="text-sm text-slate-600 font-medium">Reduce Noise</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            AI identifies when the same fact is stated in different words across multiple
            pleadings, reducing noise and enabling accurate multi-party fact tracking.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Example:</span> "Contract signed January 1, 2023" vs.
            "Parties entered agreement on 01/01/23" → AI detects 92% similarity and suggests merge
          </div>
        </div>
      </div>
    </div>

    <!-- Phase 2: Enhancement Features (Month 9-12) -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Phase 2: Enhancements</h2>
      <div class="mb-2">
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
        >
          TARGET: 6-9 MONTHS POST-MVP
        </span>
      </div>

      <div class="grid gap-4 md:grid-cols-2 mt-4">
        <!-- Party-Fact Position Matrix -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">📊</div>
            <div>
              <h4 class="text-lg font-semibold text-slate-900">Party-Fact Position Matrix</h4>
              <p class="text-sm text-blue-600 font-medium">Visual Position Tracking</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Track which parties admit, dispute, or remain neutral on each fact with visual matrix
            view.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Instantly identify admitted facts (no need
            to prove) vs. disputed facts (focus review here)
          </div>
        </div>

        <!-- AI Document-Fact Linking -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🔗</div>
            <div>
              <h4 class="text-lg font-semibold text-slate-900">AI Document-Fact Linking</h4>
              <p class="text-sm text-blue-600 font-medium">Connect Evidence to Facts</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Automatically connect evidence documents to pleading facts with AI confidence scores.
          </p>
          <div class="bg-blue-50 border border-blue-200 rounded p-3">
            <div class="text-sm font-medium text-blue-900 mb-1">Expected Impact:</div>
            <div class="text-2xl font-bold text-blue-700">60%</div>
            <div class="text-sm text-blue-800">
              Time reduction in finding documents for specific facts (from 15-20 min to 2-3 min)
            </div>
          </div>
        </div>

        <!-- Advanced Search -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🔎</div>
            <div>
              <h4 class="text-lg font-semibold text-slate-900">Advanced Search</h4>
              <p class="text-sm text-slate-600 font-medium">Natural Language Search</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Natural language search across pleadings, facts, and documents simultaneously.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Example:</span> "documents about contract signing in January
            2023" → returns related facts and documents
          </div>
        </div>

        <!-- Version Comparison Enhancements -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">📝</div>
            <div>
              <h4 class="text-lg font-semibold text-slate-900">Enhanced Version Comparison</h4>
              <p class="text-sm text-slate-600 font-medium">Deeper Amendment Analysis</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Visual diff improvements and change impact analysis showing how amendments affect
            extracted facts.
          </p>
        </div>
      </div>
    </div>

    <!-- Phase 3: Future Enhancements (Month 18-24) -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Phase 3: Advanced Features</h2>
      <div class="mb-2">
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
        >
          TARGET: 12-18 MONTHS POST-MVP
        </span>
      </div>

      <div class="grid gap-4 md:grid-cols-3 mt-4">
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <h4 class="font-semibold text-slate-900 mb-2 flex items-center">
            <span class="text-xl mr-2">⚡</span>
            Evidence Strength
          </h4>
          <p class="text-slate-600 text-sm">
            Gap analysis showing supporting vs. contradicting evidence for each fact
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <h4 class="font-semibold text-slate-900 mb-2 flex items-center">
            <span class="text-xl mr-2">⚖️</span>
            Legal Issue Mapping
          </h4>
          <p class="text-slate-600 text-sm">
            Connect facts to legal issues and remedies for strategic analysis
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg p-4">
          <h4 class="font-semibold text-slate-900 mb-2 flex items-center">
            <span class="text-xl mr-2">📚</span>
            Multi-Case Library
          </h4>
          <p class="text-slate-600 text-sm">
            Reuse facts across similar cases with anonymized fact sharing
          </p>
        </div>
      </div>
    </div>

    <!-- Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Typical Workflow</h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="space-y-4">
          <!-- Step 1 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center"
            >
              1
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Upload Pleadings</h4>
              <p class="text-slate-600">
                System automatically detects pleadings and prompts for confirmation.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center"
            >
              2
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Extract Facts</h4>
              <p class="text-slate-600">
                Click "Extract Facts" and AI parses pleading into atomic factual assertions (30-60
                seconds).
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center"
            >
              3
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Review & Edit</h4>
              <p class="text-slate-600">
                Review extracted facts, edit as needed, delete incorrect extractions, add missed
                facts manually.
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center"
            >
              4
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Merge Duplicates</h4>
              <p class="text-slate-600">
                AI identifies semantically similar facts and suggests merges—you confirm or reject.
              </p>
            </div>
          </div>

          <!-- Step 5 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center"
            >
              5
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Use for Review</h4>
              <p class="text-slate-600">
                During document review, click a fact to see related documents—or click a document
                to see relevant facts.
              </p>
            </div>
          </div>

          <!-- Step 6 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center"
            >
              6
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                Track Positions <span class="text-sm text-indigo-600">(Phase 2)</span>
              </h4>
              <p class="text-slate-600">
                Mark which facts each party admits/disputes—visual matrix shows positions at a
                glance.
              </p>
            </div>
          </div>

          <!-- Step 7 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center"
            >
              7
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                Trial Prep <span class="text-sm text-indigo-600">(Phase 3)</span>
              </h4>
              <p class="text-slate-600">
                Filter to disputed facts, assess evidence strength, identify gaps, export trial
                bundle organized by fact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Metrics -->
    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-3">Target Success Metrics</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="bg-white rounded p-4">
          <div class="text-3xl font-bold text-emerald-700 mb-1">85%+</div>
          <div class="text-sm text-slate-700">AI fact extraction accuracy</div>
        </div>
        <div class="bg-white rounded p-4">
          <div class="text-3xl font-bold text-emerald-700 mb-1">60%</div>
          <div class="text-sm text-slate-700">
            Time reduction finding documents for specific facts
          </div>
        </div>
        <div class="bg-white rounded p-4">
          <div class="text-3xl font-bold text-emerald-700 mb-1">75%</div>
          <div class="text-sm text-slate-700">User adoption within 6 months</div>
        </div>
        <div class="bg-white rounded p-4">
          <div class="text-3xl font-bold text-emerald-700 mb-1">70%+</div>
          <div class="text-sm text-slate-700">AI suggestion acceptance rate</div>
        </div>
      </div>
    </div>

    <!-- Competitive Advantage -->
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-3">Market Differentiation</h2>
      <p class="text-slate-700 mb-4">
        The Pleadings feature will be ListBot.ca's
        <span class="font-bold">primary competitive differentiator</span>. No competing e-discovery
        platform (Relativity, DISCO, Everlaw, CaseMap, Casefleet) treats pleadings as an
        organizational framework with automated fact extraction and evidence linking.
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">First mover advantage</span> in pleading-centric e-discovery
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">AI-powered innovation</span> using Gemini for fact extraction
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Solves real pain</span> - 15-20% of review time wasted
            re-reading pleadings
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-purple-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Measurable ROI</span> - 60% faster document finding for
            specific facts
          </div>
        </div>
      </div>
    </div>

    <!-- Technical Foundation -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Technical Foundation</h2>
      <p class="text-slate-700 mb-4">
        The Pleadings feature leverages ListBot.ca's modern technology stack plus new AI
        capabilities:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Vue 3 Frontend</h3>
          <p class="text-slate-600 text-sm">
            Composition API for reactive fact lists, inline editing, and smooth version comparison
            UI
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Firebase Backend</h3>
          <p class="text-slate-600 text-sm">
            Firestore for fact storage and version control, Cloud Functions for background AI
            processing
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Gemini API</h3>
          <p class="text-slate-600 text-sm">
            AI-powered fact extraction (~$0.15-0.30 per pleading) and semantic deduplication via
            embeddings
          </p>
        </div>
      </div>
    </div>

    <!-- Coming Soon Banner -->
    <div
      class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white text-center"
    >
      <h2 class="text-3xl font-bold mb-4">Pleadings Feature Coming Soon</h2>
      <p class="text-xl mb-2">
        The Pleadings feature represents a fundamental shift in e-discovery workflow—treating
        pleadings as the organizing principle for litigation, not just another document type.
      </p>
      <p class="text-lg opacity-90">
        Phase 1 MVP development begins soon, targeting launch within 3 months with beta partner
        recruitment underway.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.pleadings-page {
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

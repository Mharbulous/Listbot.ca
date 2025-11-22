<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-4"
      >
        Case Management: Characters
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Characters (Cast) Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Cast module helps you track and organize all parties, witnesses, and key individuals
        involved in your case, creating a comprehensive directory with relationships, roles, and
        contact information.
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">🎭</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Critical Case Intelligence</h3>
          <p class="text-slate-700">
            Understanding the relationships and roles of case participants is essential for
            effective discovery and trial strategy.
            <span class="font-bold text-indigo-700">Organized witness management</span> prevents
            missed connections and strengthens case preparation.
          </p>
        </div>
      </div>
    </div>

    <!-- Current Implementation Status -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Features</h2>

      <!-- High Priority Features -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
          >
            HIGH PRIORITY
          </span>
          Core Character Management
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Character Profiles -->
          <div class="bg-white border-2 border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">👤</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Detailed Character Profiles</h4>
                <p class="text-sm text-indigo-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Create comprehensive profiles for parties, witnesses, experts, and other case
              participants with contact info, roles, and notes.
            </p>
            <div class="bg-indigo-50 border border-indigo-200 rounded p-3 mb-3">
              <div class="text-sm font-medium text-indigo-900 mb-1">Expected Impact:</div>
              <div class="text-sm text-indigo-800">
                Centralized directory prevents information gaps and communication errors
              </div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Fields:</span> Name, role, organization, contact info,
              notes
            </div>
          </div>

          <!-- Relationship Mapping -->
          <div class="bg-white border-2 border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🕸️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Relationship Visualization</h4>
                <p class="text-sm text-indigo-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Visual network diagram showing relationships between parties, witnesses, and
              organizations with customizable connection types.
            </p>
            <div class="text-sm text-slate-500 mb-2">
              <span class="font-medium">Connections:</span> Employment, family, business, witness
              relationships
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Instantly identify conflicts of interest
              and key relationships
            </div>
          </div>

          <!-- Document Associations -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📎</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Document Associations</h4>
                <p class="text-sm text-blue-600 font-medium">Integration Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Link characters to relevant documents they authored, received, or are mentioned in,
              creating automatic cross-references.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Find all documents related to a specific
              person instantly
            </div>
          </div>

          <!-- AI Character Extraction -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🤖</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">AI Name Extraction</h4>
                <p class="text-sm text-blue-600 font-medium">Advanced Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automatically extract names, organizations, and roles from documents, creating
              preliminary character entries for review.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Build your cast list from uploaded
              documents automatically
            </div>
          </div>
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
          Advanced Management
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Witness Interview Tracking -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📝</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Witness Interview Tracking</h4>
                <p class="text-sm text-slate-600 font-medium">Workflow Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Track interview status, notes, and key statements for each witness with date/time
              stamps and interviewer attribution.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Never lose track of witness preparation
              progress
            </div>
          </div>

          <!-- Deposition Management -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">⚖️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Deposition Links</h4>
                <p class="text-sm text-slate-600 font-medium">Discovery Integration</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Associate deposition transcripts, exhibits, and video with specific witnesses for easy
              reference during trial prep.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Centralized deposition materials per witness
            </div>
          </div>

          <!-- Custom Tags -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🏷️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Custom Categories</h4>
                <p class="text-sm text-slate-600 font-medium">Organization</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Tag characters by strategic categories like "fact witness," "expert," "hostile," or
              "friendly" for filtering and analysis.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Flexible organization tailored to case
              strategy
            </div>
          </div>

          <!-- Export Options -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📄</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Witness Lists & Reports</h4>
                <p class="text-sm text-slate-600 font-medium">Export & Reporting</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Generate witness lists, contact directories, and relationship diagrams for court
              filings, client updates, or trial books.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Professional work product with one click
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cast Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Character Management Workflow</h2>
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
              <h4 class="font-semibold text-slate-900 mb-1">Extract Names from Documents</h4>
              <p class="text-slate-600">
                AI scans uploaded documents to identify parties, witnesses, and other individuals,
                creating preliminary character entries.
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
              <h4 class="font-semibold text-slate-900 mb-1">Build Detailed Profiles</h4>
              <p class="text-slate-600">
                Review and enhance character profiles with contact information, roles,
                organizational affiliations, and strategic notes.
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
              <h4 class="font-semibold text-slate-900 mb-1">Map Relationships</h4>
              <p class="text-slate-600">
                Define connections between characters to create a visual relationship network,
                identifying potential conflicts and strategic advantages.
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
              <h4 class="font-semibold text-slate-900 mb-1">Link to Evidence</h4>
              <p class="text-slate-600">
                Associate characters with relevant documents, depositions, and facts to build a
                comprehensive evidence map.
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
              <h4 class="font-semibold text-slate-900 mb-1">Generate Witness Lists</h4>
              <p class="text-slate-600">
                Export professional witness lists, contact directories, and relationship diagrams
                for court filings or trial preparation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competitive Advantage -->
    <div
      class="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6 mb-8"
    >
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Advantage</h2>
      <p class="text-slate-700 mb-4">
        ListBot.ca's Cast module transforms traditional contact management into strategic
        intelligence, providing insights that give you an edge:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">AI-powered extraction</span> builds your cast list
            automatically
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Visual relationship maps</span> reveal hidden connections
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Document associations</span> link people to evidence
            seamlessly
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Deposition tracking</span> centralizes witness preparation
          </div>
        </div>
      </div>
    </div>

    <!-- Implementation Timeline -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Timeline</h2>
      <div class="space-y-4">
        <!-- Phase 1 -->
        <div class="border-l-4 border-indigo-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Core Functionality</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Character profile creation with contact information and roles</li>
            <li>Relationship mapping with visual network diagrams</li>
            <li>Document association and cross-referencing</li>
            <li>Basic export to witness lists and contact directories</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-blue-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: AI & Advanced Features</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>AI-powered name extraction from documents</li>
            <li>Witness interview tracking and notes management</li>
            <li>Deposition transcript linking and organization</li>
            <li>Custom tagging system with strategic categories</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center pt-6 border-t border-slate-200">
      <p class="text-slate-600 mb-4">
        The Cast module will provide strategic intelligence about case participants, helping you
        identify key relationships and manage witness preparation effectively.
      </p>
      <button
        @click="goBack"
        class="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
      >
        ← Back
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

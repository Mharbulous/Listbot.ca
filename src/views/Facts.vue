<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800 mb-4"
      >
        Case Management: Facts
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Facts Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Facts module helps you organize, track, and analyze key factual elements of your case,
        creating a structured timeline and enabling strategic connections between evidence,
        witnesses, and legal issues.
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">⚖️</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Foundation for Winning Cases</h3>
          <p class="text-slate-700">
            Organized fact management is critical for trial preparation and settlement negotiations.
            <span class="font-bold text-amber-700">Studies show that 70% of case outcomes</span>
            depend on effective fact presentation, not just legal argument.
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
          Core Fact Management
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Timeline Builder -->
          <div class="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📅</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Interactive Timeline</h4>
                <p class="text-sm text-amber-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Visual timeline view of case events with drag-and-drop organization, filtering by
              date range, parties, or categories.
            </p>
            <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
              <div class="text-sm font-medium text-amber-900 mb-1">Expected Impact:</div>
              <div class="text-sm text-amber-800">
                Instantly identify patterns, gaps, and inconsistencies in factual narratives
              </div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">How it works:</span> Visual timeline with automatic sorting
              and conflict detection
            </div>
          </div>

          <!-- Fact Cards -->
          <div class="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🗂️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Structured Fact Cards</h4>
                <p class="text-sm text-amber-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Create detailed fact entries with date, time, location, parties involved, supporting
              documents, and witness connections.
            </p>
            <div class="text-sm text-slate-500 mb-2">
              <span class="font-medium">Fields:</span> Date/time, location, parties, witnesses,
              documents
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Comprehensive fact database with rich
              metadata
            </div>
          </div>

          <!-- Document Linking -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔗</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Evidence Cross-Reference</h4>
                <p class="text-sm text-blue-600 font-medium">Integration Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Link facts directly to supporting documents in your evidence collection, creating
              automatic cross-references and citations.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Jump from fact to supporting evidence with
              one click
            </div>
          </div>

          <!-- AI Fact Extraction -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🤖</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">AI Fact Extraction</h4>
                <p class="text-sm text-blue-600 font-medium">Advanced Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automatically extract dates, parties, locations, and key events from documents using
              AI analysis, pre-populating fact cards.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Dramatically speeds up initial fact
              gathering
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
          Advanced Analysis
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Conflict Detection -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">⚠️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Fact Conflict Detection</h4>
                <p class="text-sm text-slate-600 font-medium">Quality Control</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automatically identify inconsistencies in dates, locations, or witness accounts across
              multiple fact entries.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Catch errors and identify areas needing
              clarification
            </div>
          </div>

          <!-- Custom Tags -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🏷️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Custom Fact Categories</h4>
                <p class="text-sm text-slate-600 font-medium">Organization</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Create custom tags and categories to organize facts by legal issue, party,
              chronological phase, or strategic importance.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Flexible organization tailored to your case
              theory
            </div>
          </div>

          <!-- Export Options -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📄</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Fact Chronologies</h4>
                <p class="text-sm text-slate-600 font-medium">Export & Reporting</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Generate professional chronologies and fact summaries for court submissions,
              settlement negotiations, or client updates.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Professional work product in minutes
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Facts Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Facts Management Workflow</h2>
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
              <h4 class="font-semibold text-slate-900 mb-1">Gather Facts from Documents</h4>
              <p class="text-slate-600">
                AI extracts key facts from uploaded documents, creating preliminary fact cards with
                dates, parties, and events.
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
              <h4 class="font-semibold text-slate-900 mb-1">Organize on Timeline</h4>
              <p class="text-slate-600">
                Review and refine fact cards, placing them on an interactive timeline to visualize
                the case narrative.
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
              <h4 class="font-semibold text-slate-900 mb-1">Link Supporting Evidence</h4>
              <p class="text-slate-600">
                Connect fact cards to relevant documents, witness statements, and legal issues to
                build a comprehensive evidence map.
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
              <h4 class="font-semibold text-slate-900 mb-1">Identify Gaps & Conflicts</h4>
              <p class="text-slate-600">
                Use automated conflict detection to find inconsistencies and identify missing
                information in your factual narrative.
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
              <h4 class="font-semibold text-slate-900 mb-1">Generate Chronologies</h4>
              <p class="text-slate-600">
                Export professional chronologies and fact summaries for pleadings, negotiations, or
                trial preparation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competitive Advantage -->
    <div
      class="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 mb-8"
    >
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Advantage</h2>
      <p class="text-slate-700 mb-4">
        ListBot.ca's Facts module transforms traditional chronology-building from a manual,
        time-consuming process into an intelligent, integrated workflow:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-amber-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">AI-powered extraction</span> pulls facts directly from
            documents
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-amber-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Visual timeline</span> reveals patterns and gaps instantly
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-amber-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Direct evidence linking</span> connects facts to supporting
            documents
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-amber-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Automated conflict detection</span> catches inconsistencies
            early
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
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Core Functionality</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Interactive timeline with date filtering and visual organization</li>
            <li>Structured fact cards with rich metadata fields</li>
            <li>Document cross-reference linking to evidence collection</li>
            <li>Basic export to chronology format</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-blue-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: AI & Advanced Features</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>AI-powered fact extraction from documents</li>
            <li>Automated conflict and inconsistency detection</li>
            <li>Custom tags and categorization system</li>
            <li>Professional chronology generation with formatting options</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center pt-6 border-t border-slate-200">
      <p class="text-slate-600 mb-4">
        The Facts module will transform how you organize and analyze case information, providing a
        strategic advantage in trial preparation and settlement negotiations.
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

<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-teal-100 text-teal-800 mb-4"
      >
        Case Management: Law
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Legal Research & Memos Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Law module helps you organize legal research, track relevant statutes and case law, and
        generate research memos—creating a comprehensive legal knowledge base integrated with your
        evidence and facts.
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">📚</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Foundation for Legal Strategy</h3>
          <p class="text-slate-700">
            Organized legal research is essential for persuasive arguments and strategic decisions.
            <span class="font-bold text-teal-700">Legal research efficiency</span> directly impacts
            case outcomes and client costs.
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
          Core Legal Research Management
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Case Law Database -->
          <div class="bg-white border-2 border-teal-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">⚖️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Case Law Library</h4>
                <p class="text-sm text-teal-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Organize relevant case law with citations, summaries, key quotes, and strategic notes
              for each case.
            </p>
            <div class="bg-teal-50 border border-teal-200 rounded p-3 mb-3">
              <div class="text-sm font-medium text-teal-900 mb-1">Expected Impact:</div>
              <div class="text-sm text-teal-800">
                Centralized research prevents duplication and enables quick citation retrieval
              </div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Fields:</span> Citation, court, year, holding, key quotes
            </div>
          </div>

          <!-- Statute Tracking -->
          <div class="bg-white border-2 border-teal-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📜</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Statute & Regulation Index</h4>
                <p class="text-sm text-teal-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Track relevant statutes, regulations, and rules with full text, amendments, and case
              law interpretations.
            </p>
            <div class="text-sm text-slate-500 mb-2">
              <span class="font-medium">Features:</span> Full text storage, amendment tracking,
              case references
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Never lose track of critical statutory
              authority
            </div>
          </div>

          <!-- Research Memos -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📝</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Research Memo Generator</h4>
                <p class="text-sm text-blue-600 font-medium">Workflow Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Create structured research memos with issue statements, analysis, authorities, and
              conclusions—all linked to your case law library.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Professional research memos with integrated
              citations
            </div>
          </div>

          <!-- AI Research Assistant -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🤖</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">AI Legal Research</h4>
                <p class="text-sm text-blue-600 font-medium">Advanced Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              AI-powered research assistant helps find relevant cases, statutes, and authorities
              based on your legal issues and facts.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Dramatically faster research with AI
              suggestions
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
          Advanced Research Tools
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Shepardizing -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔍</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Citation Validation</h4>
                <p class="text-sm text-slate-600 font-medium">Quality Control</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Automatically check if cited cases are still good law with warnings for overruled or
              distinguished cases.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Avoid embarrassing citations to bad law
            </div>
          </div>

          <!-- Issue Linking -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔗</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Issue-Based Organization</h4>
                <p class="text-sm text-slate-600 font-medium">Strategic Organization</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Tag and organize authorities by legal issue, making it easy to find all research
              related to specific arguments.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Issue-specific authority at your fingertips
            </div>
          </div>

          <!-- Fact-to-Law Linking -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🎯</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Fact-to-Law Connections</h4>
                <p class="text-sm text-slate-600 font-medium">Integration</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Link legal authorities to specific facts in your case, building the connection between
              evidence and legal arguments.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> See how law applies to your specific facts
            </div>
          </div>

          <!-- Export Options -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📄</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Authority Tables</h4>
                <p class="text-sm text-slate-600 font-medium">Export & Reporting</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Generate tables of authorities, research memos, and citation lists for briefs and
              motions with proper formatting.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Professional work product in standard legal
              formats
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Law Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Legal Research Workflow</h2>
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
              <h4 class="font-semibold text-slate-900 mb-1">Identify Legal Issues</h4>
              <p class="text-slate-600">
                Define the legal questions and issues that need research based on your case facts
                and strategy.
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
              <h4 class="font-semibold text-slate-900 mb-1">Gather Authorities</h4>
              <p class="text-slate-600">
                Use AI research assistant to find relevant cases, statutes, and regulations,
                organizing them in your case law library.
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
              <h4 class="font-semibold text-slate-900 mb-1">Organize by Issue</h4>
              <p class="text-slate-600">
                Tag authorities by legal issue and connect them to relevant facts in your case for
                strategic analysis.
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
              <h4 class="font-semibold text-slate-900 mb-1">Validate Citations</h4>
              <p class="text-slate-600">
                Automatically check that all authorities are still good law with warnings for
                overruled or questioned cases.
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
              <h4 class="font-semibold text-slate-900 mb-1">Generate Memos & Briefs</h4>
              <p class="text-slate-600">
                Create research memos, tables of authorities, and brief sections with integrated
                citations and analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competitive Advantage -->
    <div
      class="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-6 mb-8"
    >
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Advantage</h2>
      <p class="text-slate-700 mb-4">
        ListBot.ca's Law module integrates legal research with your case facts and evidence,
        transforming isolated research into strategic advantage:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-teal-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">AI research assistant</span> finds relevant authorities faster
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-teal-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Automated citation checking</span> prevents bad law citations
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-teal-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Fact-to-law linking</span> shows how authorities apply to
            your case
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-teal-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Issue-based organization</span> enables strategic argument
            building
          </div>
        </div>
      </div>
    </div>

    <!-- Implementation Timeline -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Timeline</h2>
      <div class="space-y-4">
        <!-- Phase 1 -->
        <div class="border-l-4 border-teal-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Core Functionality</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Case law library with citations, summaries, and key quotes</li>
            <li>Statute and regulation index with full text storage</li>
            <li>Research memo generator with structured templates</li>
            <li>Issue-based tagging and organization system</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-blue-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: AI & Advanced Features</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>AI-powered legal research assistant with smart suggestions</li>
            <li>Automated citation validation and shepardizing</li>
            <li>Fact-to-law connection mapping and visualization</li>
            <li>Table of authorities generation with standard legal formatting</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center pt-6 border-t border-slate-200">
      <p class="text-slate-600 mb-4">
        The Law module will integrate legal research with your case evidence, enabling strategic
        arguments that connect facts to legal authority seamlessly.
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

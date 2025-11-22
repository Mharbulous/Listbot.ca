<template>
  <div class="identify-workflow-page max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-blue-100 text-blue-800 mb-4"
      >
        🕵️ EDRM Stage 1: Identify
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Identify Workflow</h1>
      <p class="text-xl text-slate-600 mb-6">
        Locating potentially relevant electronically stored information (ESI) and determining the
        scope of data sources before preservation begins.
      </p>
    </div>

    <!-- Overview Section -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">What is the Identify Stage?</h2>
      <p class="text-slate-700 mb-4">
        The Identify stage answers the critical question:
        <strong>"What data exists and where is it?"</strong>
      </p>
      <p class="text-slate-700 mb-4">
        This stage involves conducting custodian interviews, mapping data sources, and performing
        Early Case Assessment (ECA) to understand the scope and volume of potentially relevant
        information across your organization.
      </p>
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
        <p class="text-blue-900">
          <strong>Why It Matters:</strong> Proper identification significantly reduces downstream
          costs and prevents spoliation risks by ensuring all relevant data sources are discovered
          and documented before preservation begins.
        </p>
      </div>
    </div>

    <!-- Planned Features Section -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-6">Planned Features</h2>

      <!-- Phase 1 Features -->
      <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-3">🚀</span>
          <h3 class="text-xl font-semibold text-slate-900">Phase 1: Quick Wins (1-2 months)</h3>
        </div>

        <div class="space-y-4">
          <!-- Custodian Manager -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">👤</span>
              Custodian Manager
            </h4>
            <p class="text-slate-700 mb-2">
              Track individuals who control relevant data with comprehensive profiles and document
              linking.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Create custodian profiles (name, email, title, department)</li>
              <li>Link custodians to relevant documents</li>
              <li>Filter and search by custodian</li>
              <li>Real-time activity dashboards</li>
            </ul>
          </div>

          <!-- Data Source Tracker -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">🗺️</span>
              Data Source Tracker
            </h4>
            <p class="text-slate-700 mb-2">
              Map and document where potentially relevant information resides across your
              organization.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Record data source types (email, cloud storage, mobile devices)</li>
              <li>Track collection status (Not Started, In Progress, Complete)</li>
              <li>Integration with Gmail, OneDrive, Slack, and Teams</li>
              <li>Visual data source mapping</li>
            </ul>
          </div>

          <!-- ECA Dashboard -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📊</span>
              Early Case Assessment (ECA) Dashboard
            </h4>
            <p class="text-slate-700 mb-2">
              Make informed decisions about scope and cost with real-time statistics and
              visualizations.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Document volume statistics by custodian</li>
              <li>File type distribution analysis</li>
              <li>Date range analysis and timeline views</li>
              <li>Cost estimation based on data volume</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Phase 2 Features -->
      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-3">🤖</span>
          <h3 class="text-xl font-semibold text-slate-900">
            Phase 2: AI-Powered Features (3-6 months)
          </h3>
        </div>

        <div class="space-y-4">
          <!-- Custodian Questionnaire System -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📝</span>
              Custodian Questionnaire System
            </h4>
            <p class="text-slate-700 mb-2">
              Systematically discover all relevant data sources through automated questionnaires.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Customizable questionnaire builder</li>
              <li>Automated email delivery and reminders</li>
              <li>Response tracking and follow-up management</li>
              <li>Public-facing response collection portal</li>
            </ul>
          </div>

          <!-- AI-Powered ECA -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">🧠</span>
              AI-Powered Early Case Assessment
            </h4>
            <p class="text-slate-700 mb-2">
              Leverage Google Gemini AI to predict relevance and identify high-risk documents early
              in the process.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Document relevance scoring using machine learning</li>
              <li>Automated entity extraction (people, dates, amounts)</li>
              <li>Risk flag identification for potentially problematic content</li>
              <li>Cross-matter learning from past cases</li>
            </ul>
          </div>

          <!-- Interactive Visualizations -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📈</span>
              Interactive Visualizations
            </h4>
            <p class="text-slate-700 mb-2">
              Understand communication patterns and custodian relationships at a glance.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Communication pattern previews</li>
              <li>Custodian relationship diagrams</li>
              <li>Data volume heatmaps by source and custodian</li>
              <li>Timeline visualizations of data creation</li>
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
            <h3 class="font-semibold text-slate-900 mb-1">Cost Reduction</h3>
            <p class="text-slate-600">
              Proper identification reduces collection and processing costs by focusing on truly
              relevant data sources.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">⚖️</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Defensibility</h3>
            <p class="text-slate-600">
              Comprehensive documentation of identification activities creates a defensible record
              for court proceedings.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">🎯</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Scope Clarity</h3>
            <p class="text-slate-600">
              Early case assessment provides clear understanding of data volume and complexity
              before committing resources.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">🛡️</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Risk Mitigation</h3>
            <p class="text-slate-600">
              AI-powered analysis identifies potentially problematic documents early, allowing
              proactive case strategy development.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflow Integration -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">EDRM Workflow Integration</h2>
      <p class="text-slate-700 mb-4">
        The Identify stage is the foundation of the entire e-discovery process. Information
        gathered here flows seamlessly into subsequent EDRM stages:
      </p>
      <div class="space-y-3">
        <div class="flex items-center">
          <span class="text-xl mr-3">🕵️</span>
          <span class="font-semibold text-slate-900 mr-2">Identify</span>
          <span class="text-slate-600">→ Discover custodians and data sources</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">☁️</span>
          <span class="font-semibold text-slate-900 mr-2">Preserve</span>
          <span class="text-slate-600">→ Legal holds based on identified custodians</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🗃️</span>
          <span class="font-semibold text-slate-900 mr-2">Collect</span>
          <span class="text-slate-600">→ Targeted collection from mapped data sources</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🤖</span>
          <span class="font-semibold text-slate-900 mr-2">Process</span>
          <span class="text-slate-600">→ Volume estimates inform processing decisions</span>
        </div>
      </div>
    </div>

    <!-- Technical Foundation -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Technical Foundation</h2>
      <p class="text-slate-700 mb-4">
        The Identify stage will be built on ListBot.ca's modern technology stack:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Vue 3 Frontend</h3>
          <p class="text-slate-600 text-sm">
            Responsive, interactive dashboards with real-time updates
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Firebase Backend</h3>
          <p class="text-slate-600 text-sm">
            Scalable Firestore database with real-time collaboration features
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Gemini AI</h3>
          <p class="text-slate-600 text-sm">
            Cutting-edge AI for relevance scoring and entity extraction
          </p>
        </div>
      </div>
    </div>

    <!-- Data Structure Preview -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Data Structure (Firestore)</h2>
      <p class="text-slate-700 mb-4">
        Custodians and data sources will be organized in a hierarchical structure for efficient
        querying and real-time updates:
      </p>
      <div class="bg-slate-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre>/cases/{caseId}/custodians/{custodianId}
  - name: string
  - email: string
  - title: string
  - department: string
  - document_count: number
  - created_at: timestamp
  - updated_at: timestamp

/cases/{caseId}/custodians/{custodianId}/data_sources/{sourceId}
  - source_type: string (email | cloud | mobile | collaboration)
  - location: string
  - status: string (not_started | in_progress | complete)
  - collection_date: timestamp
  - volume_estimate: number</pre>
      </div>
    </div>

    <!-- Coming Soon Banner -->
    <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
      <h2 class="text-3xl font-bold mb-4">Coming Soon</h2>
      <p class="text-xl mb-2">
        The Identify stage is currently under active development as part of our comprehensive EDRM
        implementation.
      </p>
      <p class="text-lg opacity-90">
        Check back soon for updates, or contact us to learn more about our development roadmap.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
.identify-workflow-page {
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

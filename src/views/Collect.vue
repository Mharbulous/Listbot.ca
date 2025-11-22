<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 mb-4"
      >
        EDRM Stage 3: Collection
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Collect Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Collect stage organizes and presents your preserved evidence in a searchable,
        filterable table view—providing powerful tools to manage, categorize, and analyze your
        document collection.
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">🗃️</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Efficient Document Management</h3>
          <p class="text-slate-700">
            Effective collection organization is critical for e-discovery success.
            <span class="font-bold text-emerald-700">Organized collections reduce review time by 40-60%</span>
            and enable faster, more accurate document retrieval.
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
              <h3 class="text-lg font-semibold text-slate-900">Interactive Document Table</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Comprehensive data table with sortable columns, filtering, search, and pagination for
            managing large document collections.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Professional document management interface
          </div>
        </div>

        <!-- Implemented Feature 2 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Category Management</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Create custom categories with color coding, icons, and descriptions to organize
            documents by legal issue, responsiveness, or privilege.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Flexible organization tailored to case needs
          </div>
        </div>

        <!-- Implemented Feature 3 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Metadata Display</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            Display comprehensive metadata including filename, file type, size, modified date, hash
            value, and category assignments.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Complete document information at a glance
          </div>
        </div>

        <!-- Implemented Feature 4 -->
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Quick Actions</h3>
              <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
            </div>
          </div>
          <p class="text-slate-600 mb-3">
            One-click access to document viewer, category assignment, and metadata details directly
            from the table.
          </p>
          <div class="text-sm text-slate-500">
            <span class="font-medium">Benefit:</span> Streamlined workflow reduces clicks
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
            HIGH PRIORITY
          </span>
          Advanced Collection Features
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Bulk Operations -->
          <div class="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">⚡</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Bulk Document Operations</h4>
                <p class="text-sm text-amber-600 font-medium">Efficiency Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Select multiple documents and perform bulk actions like category assignment,
              tagging, export, or deletion.
            </p>
            <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
              <div class="text-sm font-medium text-amber-900 mb-1">Expected Impact:</div>
              <div class="text-sm text-amber-800">
                Dramatically speeds up large-scale document organization
              </div>
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">How it works:</span> Multi-select with checkboxes and bulk
              action menu
            </div>
          </div>

          <!-- Advanced Filters -->
          <div class="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🔍</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Advanced Filter Builder</h4>
                <p class="text-sm text-amber-600 font-medium">Power User Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Build complex filter queries with multiple conditions, date ranges, file type
              filtering, and saved filter presets.
            </p>
            <div class="text-sm text-slate-500 mb-2">
              <span class="font-medium">Filters:</span> Date range, file type, size, category,
              custom fields
            </div>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Find exactly the documents you need quickly
            </div>
          </div>

          <!-- Custom Views -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📊</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Saved Views & Presets</h4>
                <p class="text-sm text-blue-600 font-medium">Workflow Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Save custom table configurations with specific columns, filters, and sort orders for
              different workflow needs.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Switch between review contexts instantly
            </div>
          </div>

          <!-- Export Options -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📤</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Enhanced Export</h4>
                <p class="text-sm text-blue-600 font-medium">Production Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Export document metadata to CSV, Excel, or load files with configurable field mapping
              and formatting options.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Standards-compliant production metadata
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
          Enhanced Organization
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Custom Fields -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🏷️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Custom Metadata Fields</h4>
                <p class="text-sm text-slate-600 font-medium">Flexibility</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Add custom metadata fields specific to your case needs like Bates range, custodian,
              confidentiality designation, or privilege status.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Tailored metadata for your workflow
            </div>
          </div>

          <!-- Collection Stats -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📈</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Collection Analytics</h4>
                <p class="text-sm text-slate-600 font-medium">Insights</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Visual analytics showing document counts by category, file type distribution, size
              metrics, and date ranges.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Understand collection composition at a
              glance
            </div>
          </div>

          <!-- Collaboration -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">👥</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Team Collaboration</h4>
                <p class="text-sm text-slate-600 font-medium">Multi-User</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Share saved views, assign documents to team members, and track review progress across
              collaborative review teams.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Coordinated team-based document review
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collection Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Collection Workflow</h2>
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
                View Preserved Documents <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                All preserved documents appear in the interactive table with comprehensive metadata
                and search capabilities.
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
                Organize with Categories <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                Create custom categories and assign documents individually or in bulk for
                organization.
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
              <h4 class="font-semibold text-slate-900 mb-1">Apply Advanced Filters</h4>
              <p class="text-slate-600">
                Use advanced filter builder to create complex queries based on metadata, dates, file
                types, and custom fields (planned).
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
              <h4 class="font-semibold text-slate-900 mb-1">Perform Bulk Operations</h4>
              <p class="text-slate-600">
                Multi-select documents to perform bulk category assignments, tagging, or export
                operations (planned).
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
              <h4 class="font-semibold text-slate-900 mb-1">Export for Production</h4>
              <p class="text-slate-600">
                Export filtered document sets with metadata to standard load file formats for
                production or further processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competitive Advantage -->
    <div
      class="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-6 mb-8"
    >
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Advantage</h2>
      <p class="text-slate-700 mb-4">
        ListBot.ca's Collection capabilities provide enterprise-grade document management at an
        accessible price:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-emerald-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Professional table interface</span> with sorting, filtering,
            and search
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-emerald-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Flexible categorization</span> tailored to case needs
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-emerald-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Bulk operations</span> for efficient large-scale management
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-emerald-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Standards-compliant export</span> for production workflows
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
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Enhanced Features</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Bulk document operations with multi-select and action menu</li>
            <li>Advanced filter builder with complex query support</li>
            <li>Saved views and custom table presets</li>
            <li>Enhanced export with configurable field mapping</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-blue-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: Advanced Capabilities</h3>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Custom metadata fields with flexible schema</li>
            <li>Collection analytics with visual charts and insights</li>
            <li>Team collaboration with document assignment and progress tracking</li>
            <li>Integration with external review platforms</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="text-center pt-6 border-t border-slate-200">
      <p class="text-slate-600 mb-4">
        The Collect stage provides the organizational foundation for efficient document review,
        enabling you to manage large collections with ease.
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

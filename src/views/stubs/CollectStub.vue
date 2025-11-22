<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="EDRM Stage 3: Collection"
        badge-color="emerald"
        title="Collect Workflow"
        description="The Collect stage organizes and presents your preserved evidence in a searchable, filterable table view—providing powerful tools to manage, categorize, and analyze your document collection."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="🗃️" title="Efficient Document Management" color="emerald">
        Effective collection organization is critical for e-discovery success.
        <span class="font-bold text-emerald-700"
          >Organized collections reduce review time by 40-60%</span
        >
        and enable faster, more accurate document retrieval.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Current Implementation -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Current Implementation</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="✅"
            title="Document Table View"
            badge="Currently Implemented"
            color="emerald"
            description="Comprehensive table displaying all preserved documents with sortable columns, advanced filtering, and real-time search."
          />
          <FeatureCard
            icon="✅"
            title="Document Viewer"
            badge="Currently Implemented"
            color="emerald"
            description="In-app document viewer supporting PDFs, images, and text files with side-by-side table and viewer layout."
          />
          <FeatureCard
            icon="✅"
            title="Categorization System"
            badge="Currently Implemented"
            color="emerald"
            description="Flexible document categorization with color-coded labels for organizing evidence by type, relevance, or custom criteria."
          />
          <FeatureCard
            icon="✅"
            title="Advanced Filtering"
            badge="Currently Implemented"
            color="emerald"
            description="Multi-criteria filtering by category, file type, date range, size, and search terms."
          />
        </div>
      </div>

      <!-- Planned Enhancements -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Enhancements</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🏷️"
            title="Bulk Tagging & Operations"
            badge="Efficiency Feature"
            color="blue"
            description="Select multiple documents for batch categorization, tagging, export, or deletion."
          />
          <FeatureCard
            icon="📊"
            title="Collection Analytics"
            badge="Insights Feature"
            color="blue"
            description="Visual analytics showing file type distribution, date patterns, size breakdowns, and category summaries."
          />
          <FeatureCard
            icon="💾"
            title="Saved Filters & Views"
            badge="Workflow Feature"
            color="blue"
            description="Save commonly-used filter combinations for quick access to specific document subsets."
          />
          <FeatureCard
            icon="📤"
            title="Export Options"
            badge="Reporting Feature"
            color="blue"
            description="Export filtered document sets with metadata to Excel, CSV, or load files for external review platforms."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Collection Workflow" :steps="workflowSteps" />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="emerald"
        description="ListBot.ca's collection features provide enterprise-grade document management:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        message="The Collect stage provides the foundation for efficient document review and analysis."
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
    title: 'Access Document Table',
    description: 'Navigate to the Document Table to view all preserved documents.',
    status: 'Implemented',
  },
  {
    title: 'Filter & Search',
    description:
      'Use advanced filters and search to narrow down the document set to relevant files.',
    status: 'Implemented',
  },
  {
    title: 'Categorize Documents',
    description: 'Apply category labels to organize documents by type, relevance, or custom criteria.',
    status: 'Implemented',
  },
  {
    title: 'Review in Viewer',
    description: 'Open documents in the integrated viewer for detailed examination.',
    status: 'Implemented',
  },
  {
    title: 'Bulk Operations',
    description:
      'Select multiple documents for batch operations like tagging or export (planned).',
  },
  {
    title: 'Analyze & Export',
    description:
      'Generate analytics and export filtered document sets for further review (planned).',
  },
];

const competitiveAdvantages = [
  { label: 'Advanced filtering', text: 'enables precise document selection' },
  { label: 'Integrated viewer', text: 'streamlines document review' },
  { label: 'Flexible categorization', text: 'supports custom workflows' },
  { label: 'Modern Vue 3 UI', text: 'provides responsive, fast interface' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Enhanced Collection',
    timeframe: '1-2 months',
    color: 'emerald',
    items: [
      'Bulk tagging and batch operations',
      'Collection analytics dashboard',
      'Saved filters and custom views',
      'Enhanced export options (Excel, CSV, load files)',
    ],
  },
  {
    title: 'Phase 2: Advanced Features',
    timeframe: '3-4 months',
    color: 'blue',
    items: [
      'Custom metadata fields',
      'Document comparison tools',
      'Collaboration features (notes, annotations)',
      'Integration with Review and Analysis stages',
    ],
  },
];
</script>

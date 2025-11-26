<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Case Management: Matter Import"
        badge-color="blue"
        title="Bulk Matter Import Workflow"
        description="Streamline matter creation by importing multiple matters at once from spreadsheets, CRM systems, or practice management software—eliminating repetitive data entry and ensuring consistent matter setup across your firm."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="⚡" title="Time Savings & Efficiency" color="blue">
        Bulk matter import can reduce matter setup time from
        <span class="font-bold text-blue-700">5-10 minutes per matter to seconds</span>, allowing
        firms to onboard dozens or hundreds of cases quickly while maintaining data consistency and
        reducing human error.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Vision Statement -->
      <div
        class="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-6 mb-8 rounded-lg"
      >
        <h3 class="text-lg font-semibold text-slate-900 mb-2">🎯 Workflow Acceleration</h3>
        <p class="text-slate-700">
          <span class="font-bold text-blue-700">Bulk matter import</span>
          transforms matter setup from a tedious manual process into a streamlined batch operation,
          perfect for firms migrating from other systems, handling mass tort cases, or onboarding
          multiple clients simultaneously.
        </p>
      </div>

      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="📊"
            title="CSV/Excel Import"
            badge="Foundation Feature"
            priority="high"
            color="blue"
            description="Upload spreadsheets containing matter information with automatic mapping of columns to matter fields (name, description, client info, dates, etc.)."
          />
          <FeatureCard
            icon="🔍"
            title="Data Validation & Preview"
            badge="Quality Assurance"
            priority="high"
            color="blue"
            description="Preview imported data before creation with validation checks for required fields, duplicate detection, and format verification to prevent errors."
          />
          <FeatureCard
            icon="✅"
            title="Batch Processing"
            badge="Core Workflow"
            priority="high"
            color="blue"
            description="Process multiple matters in a single operation with progress tracking, error handling, and automatic rollback if issues are detected."
          />
          <FeatureCard
            icon="🔄"
            title="Template Mapping"
            badge="Reusability"
            color="indigo"
            description="Save column mappings as templates for repeated imports from the same source system, making future imports even faster."
          />
          <FeatureCard
            icon="📋"
            title="Import History & Audit Trail"
            badge="Compliance"
            color="purple"
            description="Track all import operations with timestamps, user attribution, and detailed logs of what was imported and when."
          />
          <FeatureCard
            icon="🔗"
            title="CRM/PMS Integration"
            badge="Advanced Integration"
            color="emerald"
            description="Direct integration with popular legal practice management systems (Clio, MyCase, PracticePanther) for seamless matter synchronization."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Matter Import Workflow" :steps="workflowSteps" />
    </template>

    <template #footer>
      <StubFooter
        variant="coming-soon"
        color="blue"
        coming-soon-title="Bulk Matter Import Coming Soon"
        coming-soon-text="ListBot.ca will offer a robust bulk matter import system that makes onboarding multiple cases fast, accurate, and auditable."
        coming-soon-subtext="This feature will be particularly valuable for firms migrating from other systems, handling mass tort cases, or managing high-volume practices."
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
import StubFooter from '@/components/stubs/StubFooter.vue';

const workflowSteps = [
  {
    title: 'Prepare Import File',
    description:
      'Export matter data from existing system or create a spreadsheet with matter information (name, description, client, dates, etc.).',
  },
  {
    title: 'Upload & Map Columns',
    description:
      'Upload the CSV/Excel file and map spreadsheet columns to ListBot.ca matter fields using an intuitive mapping interface.',
  },
  {
    title: 'Validate & Preview',
    description:
      'Review imported data with validation checks for required fields, duplicates, and format issues. Make corrections before committing.',
  },
  {
    title: 'Process Import',
    description:
      'Execute the bulk import with progress tracking. System creates all matters in a single batch operation with automatic error handling.',
  },
  {
    title: 'Review Results',
    description:
      'View import summary showing successful creations, any errors encountered, and detailed audit log of the operation.',
  },
  {
    title: 'Save Mapping Template',
    description:
      'Optionally save the column mapping as a reusable template for future imports from the same source system.',
  },
];
</script>

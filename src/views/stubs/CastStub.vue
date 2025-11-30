<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Case Management: Characters"
        badge-color="indigo"
        title="Characters (Cast) Workflow"
        description="The Cast module helps you track and organize all parties, witnesses, and key individuals involved in your case, creating a comprehensive directory with relationships, roles, and contact information."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="👥" title="Essential Case Organization" color="indigo">
        A comprehensive cast list is critical for effective case management.
        <span class="font-bold text-indigo-700">Organized character tracking</span>
        ensures you never lose track of witnesses, parties, or key individuals across complex litigation.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Core Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="👤"
            title="Character Database"
            badge="Foundation Feature"
            priority="high"
            color="indigo"
            description="Comprehensive database of all case participants with contact information, roles, and custom fields."
          />
          <FeatureCard
            icon="📝"
            title="Role & Status Tracking"
            badge="Organization"
            color="indigo"
            description="Track each person's role (plaintiff, defendant, witness, expert) and current status (deposed, subpoenaed, etc.)."
          />
        </div>
      </div>

      <!-- Wishlist Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Wishlist Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🔗"
            title="Relationship Mapping"
            badge="Visualization"
            color="blue"
            description="Visual relationship diagrams showing connections between parties, witnesses, and organizations."
          />
          <FeatureCard
            icon="📅"
            title="Timeline Integration"
            badge="Cross-Reference"
            color="teal"
            description="Link characters to relevant dates and events in the case timeline."
          />
          <FeatureCard
            icon="📄"
            title="Document Connections"
            badge="Evidence Linking"
            color="emerald"
            description="Connect characters to relevant documents, depositions, and exhibits."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Cast Management Workflow" :steps="workflowSteps" />
    </template>

    <template #footer>
      <StubFooter
        message="The Cast module will ensure you never lose track of the people involved in your case."
        back-button-text="Back"
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
    title: 'Add Characters',
    description: 'Create character entries for all parties, witnesses, and key individuals.',
  },
  {
    title: 'Define Relationships',
    description: 'Map connections between characters (e.g., employer-employee, family, business partners).',
  },
  {
    title: 'Assign Roles & Status',
    description: 'Track each person\'s role in the case and current procedural status.',
  },
  {
    title: 'Link to Evidence',
    description: 'Connect characters to relevant documents, depositions, and exhibits.',
  },
  {
    title: 'Visualize Network',
    description: 'View relationship diagrams to understand key players and connections.',
  },
  {
    title: 'Generate Reports',
    description: 'Create witness lists, party summaries, and relationship reports.',
  },
];
</script>

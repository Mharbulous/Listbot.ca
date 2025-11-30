<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="EDRM Stage 6: Analysis"
        badge-color="purple"
        title="Analysis Workflow"
        description="The Analysis stage evaluates electronically stored information (ESI) for patterns, relationships, and strategic insights that inform case strategy—going beyond document-by-document review to uncover the 'story behind the data.'"
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="🎯" title="Largest Competitive Opportunity" color="purple">
        Advanced analytics differentiate premium platforms from basic review tools.
        <span class="font-bold text-purple-700">AI-powered analysis</span>
        is the frontier where ListBot.ca can deliver enterprise value at accessible pricing.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Core Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🔗"
            title="Relationship Mapping"
            badge="Foundation Feature"
            priority="high"
            color="purple"
            description="Visualize relationships between people, organizations, and documents to understand key players and communication patterns."
          />
          <FeatureCard
            icon="📊"
            title="Timeline Analysis"
            badge="Pattern Discovery"
            priority="high"
            color="purple"
            description="Interactive timeline views showing document creation patterns, communication spikes, and key event clustering."
          />
          <FeatureCard
            icon="🤖"
            title="AI Concept Clustering"
            badge="AI-Powered"
            color="blue"
            description="Machine learning groups conceptually similar documents even when exact keywords differ, uncovering hidden themes."
          />
        </div>
      </div>

      <!-- Wishlist Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Wishlist Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🔍"
            title="Anomaly Detection"
            badge="AI-Powered"
            color="blue"
            description="Identify unusual patterns like gaps in email threads, deleted documents, or inconsistent metadata that warrant investigation."
          />
          <FeatureCard
            icon="📈"
            title="Communication Network Analysis"
            badge="Strategic Insight"
            color="indigo"
            description="Map email and messaging networks to identify key influencers, information flow, and organizational hierarchies."
          />
          <FeatureCard
            icon="🎨"
            title="Visual Analytics Dashboard"
            badge="Reporting"
            color="emerald"
            description="Interactive dashboards with charts and graphs showing document distributions, trends, and key metrics."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Analysis Workflow" :steps="workflowSteps" />
    </template>

    <template #footer>
      <StubFooter
        message="The Analysis stage will differentiate ListBot.ca from basic platforms with AI-powered insights that reveal the story behind the data."
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
    title: 'Review Document Collection',
    description: 'Start with processed and reviewed document set from earlier EDRM stages.',
  },
  {
    title: 'Apply AI Clustering',
    description:
      'Use machine learning to group conceptually similar documents and identify themes (planned).',
  },
  {
    title: 'Map Relationships',
    description:
      'Visualize connections between people, organizations, and documents to understand key players (planned).',
  },
  {
    title: 'Analyze Timelines',
    description:
      'Examine document creation patterns and communication spikes to identify critical time periods (planned).',
  },
  {
    title: 'Detect Anomalies',
    description: 'Identify unusual patterns that warrant investigation (planned).',
  },
  {
    title: 'Generate Insights Report',
    description:
      'Create visual analytics dashboards and strategic insights for case team (planned).',
  },
];
</script>

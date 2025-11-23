<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="🕵️ EDRM Stage 1: Identify"
        badge-color="blue"
        title="Identify Workflow"
        description="Locating potentially relevant electronically stored information (ESI) and determining the scope of data sources before preservation begins."
      />
    </template>

    <template #content>
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
            <strong>Why It Matters:</strong> Proper identification prevents over-collection
            (wasting money) and under-collection (facing sanctions). This stage sets the scope and
            budget for the entire e-discovery process.
          </p>
        </div>
      </div>

      <!-- Key Impact -->
      <KeyImpactBox icon="💰" title="Critical Cost Control Point" color="emerald">
        Poor identification causes
        <span class="font-bold text-emerald-700">60-80% of discovery cost overruns</span>.
        Comprehensive identification prevents expensive over-collection while ensuring defensibility.
      </KeyImpactBox>

      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Core Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="👤"
            title="Custodian List"
            badge="Foundation Feature"
            color="blue"
            description="Database of data custodians with contact information, roles, and data source mapping."
          />
          <FeatureCard
            icon="📝"
            title="Preservation Reminders"
            badge="Workflow Automation"
            color="blue"
            description="Automated questionnaires to custodians with response tracking and follow-up reminders."
          />
        </div>
      </div>

      <!-- Wishlist Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Wishlist Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="💾"
            title="Data Source Inventory"
            badge="Foundation Feature"
            color="blue"
            description="Visual mapping of all potential ESI sources including email servers, file shares, cloud storage, and mobile devices."
          />
          <FeatureCard
            icon="📊"
            title="Data Volume Estimation"
            badge="Cost Control"
            color="emerald"
            description="Estimate data volumes before collection to scope costs and identify high-volume sources."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Identification Workflow" :steps="workflowSteps" />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="blue"
        description="ListBot.ca's identification tools will enable precise, defensible scoping:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        message="The Identify stage is critical for cost-effective e-discovery, and ListBot.ca will deliver comprehensive identification tools."
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
import CompetitiveAdvantageGrid from '@/components/stubs/CompetitiveAdvantageGrid.vue';
import ImplementationTimeline from '@/components/stubs/ImplementationTimeline.vue';
import StubFooter from '@/components/stubs/StubFooter.vue';

const workflowSteps = [
  {
    title: 'Define Legal Matter Scope',
    description: 'Understand the legal claims and relevant time periods to guide ESI identification.',
  },
  {
    title: 'Identify Key Custodians',
    description:
      'Determine individuals likely to possess relevant ESI based on roles and involvement.',
  },
  {
    title: 'Map Data Sources',
    description:
      'Inventory all potential ESI locations including email, file servers, cloud storage, and mobile devices.',
  },
  {
    title: 'Estimate Data Volumes',
    description: 'Assess data volumes at each source to plan collection scope and budget.',
  },
  {
    title: 'Issue Preservation Questionnaires',
    description: 'Send automated questionnaires to custodians to confirm data sources.',
  },
  {
    title: 'Refine Scope & Prioritize',
    description:
      'Based on responses and volume estimates, prioritize high-value sources and refine criteria.',
  },
];

const competitiveAdvantages = [
  { label: 'Custodian database', text: 'ensures comprehensive coverage' },
  { label: 'Volume estimation', text: 'enables accurate budgeting' },
  { label: 'Automated questionnaires', text: 'streamline custodian interviews' },
  { label: 'Visual data mapping', text: 'clarifies collection strategy' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Core Identification',
    timeframe: '2-3 months',
    color: 'blue',
    items: [
      'Custodian management database',
      'Data source inventory with categorization',
      'Volume estimation calculator',
      'Preservation questionnaire templates',
    ],
  },
  {
    title: 'Phase 2: Advanced Features',
    timeframe: '4-6 months',
    color: 'indigo',
    items: [
      'Visual data mapping with custodian-source relationships',
      'Date range analysis across sources',
      'Keyword scoping and hit count estimation',
      'Integration with Collection stage',
    ],
  },
];
</script>

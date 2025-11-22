<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="EDRM Stage 8: Presentation"
        badge-color="indigo"
        title="Present Workflow"
        description="The Presentation stage transforms organized evidence into compelling visual narratives for depositions, hearings, mediation, and trials—displaying evidence persuasively during legal proceedings."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="🎯" title="Persuasive Evidence Display" color="violet">
        Professional presentation capabilities differentiate sophisticated trial teams.
        <span class="font-bold text-violet-700">Effective visual presentation</span>
        significantly increases persuasiveness and comprehension during depositions and trials.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Planned Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🖥️"
            title="Trial Presentation Mode"
            badge="Core Feature"
            priority="high"
            color="indigo"
            description="Full-screen presentation mode with smooth document transitions and annotation tools for courtroom display."
          />
          <FeatureCard
            icon="📁"
            title="Exhibit Management"
            badge="Organization"
            priority="high"
            color="indigo"
            description="Create and organize exhibit lists with Bates numbers, descriptions, and presentation order."
          />
          <FeatureCard
            icon="✏️"
            title="Real-Time Annotation"
            badge="Interactive"
            color="blue"
            description="Highlight, circle, and annotate documents during depositions or trial with digital markup tools."
          />
          <FeatureCard
            icon="🔍"
            title="Zoom & Pan Controls"
            badge="Display Tools"
            color="blue"
            description="Intuitive zoom, pan, and rotation controls for focusing attention on specific document sections."
          />
          <FeatureCard
            icon="📊"
            title="Side-by-Side Comparison"
            badge="Strategic Tool"
            color="purple"
            description="Display multiple documents simultaneously for powerful visual comparisons and contradiction highlighting."
          />
          <FeatureCard
            icon="🎭"
            title="Deposition Mode"
            badge="Workflow"
            color="teal"
            description="Dedicated deposition interface with exhibit tracking, witness notes, and easy document retrieval."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Presentation Workflow" :steps="workflowSteps" />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="indigo"
        description="ListBot.ca's presentation features will provide professional trial capabilities:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        message="The Present stage will transform your evidence into persuasive visual narratives for depositions and trials."
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
    title: 'Create Exhibit List',
    description: 'Organize documents into exhibits with descriptions and presentation order.',
  },
  {
    title: 'Configure Presentation Settings',
    description:
      'Choose display options, annotation tools, and configure for deposition or trial mode.',
  },
  {
    title: 'Enter Presentation Mode',
    description: 'Launch full-screen presentation mode with document queue and quick access tools.',
  },
  {
    title: 'Display & Annotate',
    description:
      'Present documents with zoom, pan, and real-time annotation for highlighting key sections.',
  },
  {
    title: 'Compare Documents',
    description: 'Use side-by-side view to visually compare contradictory documents or versions.',
  },
  {
    title: 'Export Annotations',
    description:
      'Save annotated versions for record or share with trial team for strategic review.',
  },
];

const competitiveAdvantages = [
  { label: 'Full-screen mode', text: 'provides professional courtroom display' },
  { label: 'Real-time annotation', text: 'highlights evidence during proceedings' },
  { label: 'Side-by-side comparison', text: 'creates powerful visual arguments' },
  { label: 'Exhibit management', text: 'organizes presentation workflow' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Core Presentation',
    timeframe: '3-4 months',
    color: 'indigo',
    items: [
      'Full-screen presentation mode',
      'Exhibit list management',
      'Basic annotation tools (highlight, circle, text)',
      'Zoom and pan controls',
    ],
  },
  {
    title: 'Phase 2: Advanced Features',
    timeframe: '5-7 months',
    color: 'violet',
    items: [
      'Side-by-side document comparison',
      'Deposition mode with witness notes',
      'Advanced annotation tools (arrows, shapes, measurements)',
      'Integration with trial notebooks and outlines',
    ],
  },
];
</script>

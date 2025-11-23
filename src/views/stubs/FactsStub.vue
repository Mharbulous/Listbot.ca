<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Case Management: Facts"
        badge-color="amber"
        title="Facts Workflow"
        description="The Facts module helps you organize, track, and analyze key factual elements of your case, creating a structured timeline and enabling strategic connections between evidence, witnesses, and legal issues."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="⚖️" title="Foundation for Winning Cases" color="amber">
        Organized fact management is critical for trial preparation and settlement negotiations.
        <span class="font-bold text-amber-700">Studies show that 70% of case outcomes</span>
        depend on effective fact presentation, not just legal argument.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Core Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🤖"
            title="AI Fact Extraction"
            badge="Advanced Feature"
            color="blue"
            description="Automatically extract dates, parties, locations, and key events from documents using AI analysis, pre-populating fact cards."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Dramatically speeds up initial fact
                gathering
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="🔗"
            title="Evidence Cross-Reference"
            badge="Integration Feature"
            color="blue"
            description="Link facts directly to supporting documents in your evidence collection, creating automatic cross-references and citations."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Jump from fact to supporting evidence
                with one click
              </div>
            </template>
          </FeatureCard>
        </div>
      </div>

      <!-- Wishlist Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Wishlist Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="📅"
            title="Interactive Timeline"
            badge="Foundation Feature"
            color="amber"
            description="Visual timeline view of case events with drag-and-drop organization, filtering by date range, parties, or categories."
          >
            <template #extra-content>
              <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                <div class="text-sm font-medium text-amber-900 mb-1">Expected Impact:</div>
                <div class="text-sm text-amber-800">
                  Instantly identify patterns, gaps, and inconsistencies in factual narratives
                </div>
              </div>
              <div class="text-sm text-slate-500">
                <span class="font-medium">How it works:</span> Visual timeline with automatic
                sorting and conflict detection
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="🗂️"
            title="Structured Fact Cards"
            badge="Foundation Feature"
            color="amber"
            description="Create detailed fact entries with date, time, location, parties involved, supporting documents, and witness connections."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500 mb-2">
                <span class="font-medium">Fields:</span> Date/time, location, parties, witnesses,
                documents
              </div>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Comprehensive fact database with rich
                metadata
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="⚠️"
            title="Fact Conflict Detection"
            badge="Quality Control"
            description="Automatically identify inconsistencies in dates, locations, or witness accounts across multiple fact entries."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Catch errors and identify areas needing
                clarification
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="🏷️"
            title="Custom Fact Categories"
            badge="Organization"
            description="Create custom tags and categories to organize facts by legal issue, party, chronological phase, or strategic importance."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Flexible organization tailored to your
                case theory
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="📄"
            title="Fact Chronologies"
            badge="Export & Reporting"
            description="Generate professional chronologies and fact summaries for court submissions, settlement negotiations, or client updates."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Professional work product in minutes
              </div>
            </template>
          </FeatureCard>
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps
        title="Facts Management Workflow"
        color="blue"
        :steps="workflowSteps"
      />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="amber"
        description="ListBot.ca's Facts module transforms traditional chronology-building from a manual, time-consuming process into an intelligent, integrated workflow:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        message="The Facts module will transform how you organize and analyze case information, providing a strategic advantage in trial preparation and settlement negotiations."
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
    title: 'Gather Facts from Documents',
    description:
      'AI extracts key facts from uploaded documents, creating preliminary fact cards with dates, parties, and events.',
  },
  {
    title: 'Organize on Timeline',
    description:
      'Review and refine fact cards, placing them on an interactive timeline to visualize the case narrative.',
  },
  {
    title: 'Link Supporting Evidence',
    description:
      'Connect fact cards to relevant documents, witness statements, and legal issues to build a comprehensive evidence map.',
  },
  {
    title: 'Identify Gaps & Conflicts',
    description:
      'Use automated conflict detection to find inconsistencies and identify missing information in your factual narrative.',
  },
  {
    title: 'Generate Chronologies',
    description:
      'Export professional chronologies and fact summaries for pleadings, negotiations, or trial preparation.',
  },
];

const competitiveAdvantages = [
  { label: 'AI-powered extraction', text: 'pulls facts directly from documents' },
  { label: 'Visual timeline', text: 'reveals patterns and gaps instantly' },
  { label: 'Direct evidence linking', text: 'connects facts to supporting documents' },
  { label: 'Automated conflict detection', text: 'catches inconsistencies early' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Core Functionality',
    color: 'amber',
    items: [
      'Interactive timeline with date filtering and visual organization',
      'Structured fact cards with rich metadata fields',
      'Document cross-reference linking to evidence collection',
      'Basic export to chronology format',
    ],
  },
  {
    title: 'Phase 2: AI & Advanced Features',
    color: 'blue',
    items: [
      'AI-powered fact extraction from documents',
      'Automated conflict and inconsistency detection',
      'Custom tags and categorization system',
      'Professional chronology generation with formatting options',
    ],
  },
];
</script>

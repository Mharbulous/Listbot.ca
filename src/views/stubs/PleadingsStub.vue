<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Case Management: Pleadings"
        badge-color="purple"
        title="Pleadings Workflow"
        description="The only e-discovery platform that understands pleadings as the organizational framework for litigation—automatically extracting facts, tracking party positions, and systematically connecting evidence to allegations."
      />
    </template>

    <template #content>
      <!-- Vision Statement -->
      <div
        class="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-6 mb-8 rounded-lg"
      >
        <h3 class="text-lg font-semibold text-slate-900 mb-2">🎯 Revolutionary Differentiation</h3>
        <p class="text-slate-700">
          <span class="font-bold text-purple-700">No other e-discovery platform</span>
          treats pleadings as the structural backbone of case organization. ListBot.ca will be the
          first to extract allegations, link them to evidence, and organize the entire discovery
          process around the core legal narrative.
        </p>
      </div>

      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Core Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🔍"
            title="Document Identification & Classification"
            badge="Process Integration"
            priority="high"
            color="purple"
            description="Automated identification of pleadings documents during the Process step, enabling automatic routing to the Pleadings section for specialized handling."
          />
          <FeatureCard
            icon="⚖️"
            title="Proceeding Management"
            badge="Organization Core"
            priority="high"
            color="purple"
            description="Track multiple related proceedings by Jurisdiction, Venue, and Court File No., allowing pleadings to be sorted and grouped with other documents from the same court file."
          />
          <FeatureCard
            icon="📋"
            title="Version Control & Amendment Tracking"
            badge="Foundation Feature"
            priority="high"
            color="purple"
            description="Track amendments to pleadings with version history, recording which pleadings were amended and the dates of each amendment for complete litigation chronology."
          />
        </div>
      </div>

      <!-- Wishlist Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Wishlist Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="📄"
            title="Pleading Ingestion & Parsing"
            badge="Foundation Feature"
            color="purple"
            description="Upload pleadings (complaints, answers, counterclaims) with AI-powered extraction of allegations, denials, and affirmative defenses."
          />
          <FeatureCard
            icon="🔗"
            title="Allegation-Evidence Linking"
            badge="Core Workflow"
            color="purple"
            description="Connect specific allegations to supporting or contradicting evidence, creating a systematic proof map."
          />
          <FeatureCard
            icon="✅"
            title="Proof Status Tracking"
            badge="Strategic Tool"
            color="indigo"
            description="Track whether each allegation is proven, refuted, or uncertain based on available evidence."
          />
          <FeatureCard
            icon="📊"
            title="Burden Tracking Dashboard"
            badge="Visual Tool"
            color="blue"
            description="Visualize which party bears the burden of proof for each element and whether evidence exists to meet that burden."
          />
          <FeatureCard
            icon="🤖"
            title="AI Suggestion Engine"
            badge="AI-Powered"
            color="emerald"
            description="AI suggests relevant documents for each allegation based on content analysis and keyword matching."
          />
          <FeatureCard
            icon="📝"
            title="Response Generator"
            badge="Document Creation"
            color="teal"
            description="Generate draft responses to discovery requests organized by allegation and supported by linked evidence."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Pleadings Workflow" :steps="workflowSteps" />
    </template>

    <template #footer>
      <StubFooter
        variant="coming-soon"
        color="purple"
        coming-soon-title="Revolutionary Pleadings Integration Coming"
        coming-soon-text="ListBot.ca will be the first e-discovery platform to treat pleadings as the organizational framework for the entire case."
        coming-soon-subtext="This feature will transform how attorneys connect evidence to legal claims, providing a systematic approach to proving or refuting each allegation."
      />
    </template>
  </StubPageLayout>
</template>

<script setup>
import StubPageLayout from '@/components/stubs/StubPageLayout.vue';
import PageHeader from '@/components/stubs/PageHeader.vue';
import FeatureCard from '@/components/stubs/FeatureCard.vue';
import WorkflowSteps from '@/components/stubs/WorkflowSteps.vue';
import StubFooter from '@/components/stubs/StubFooter.vue';

const workflowSteps = [
  {
    title: 'Process Step: Identify Pleadings',
    description:
      'During the Process step, AI automatically identifies pleadings documents and routes them to the Pleadings section for specialized handling.',
  },
  {
    title: 'Assign to Proceeding',
    description:
      'Associate each pleading with a specific proceeding (Jurisdiction, Venue, Court File No.) to enable grouping and organization across related litigation.',
  },
  {
    title: 'Track Versions & Amendments',
    description:
      'Record amendment history with dates, maintaining a complete chronology of how pleadings evolved throughout the litigation.',
  },
  {
    title: 'Upload & Parse Pleadings',
    description:
      'Import complaint, answer, counterclaims, and amended pleadings with AI-powered extraction of allegations, denials, and affirmative defenses.',
    status: 'Wishlist',
  },
  {
    title: 'Link Evidence to Allegations',
    description:
      'Systematically connect documents to specific allegations they prove or refute, building a proof map organized by court file.',
    status: 'Wishlist',
  },
  {
    title: 'Track Proof Status',
    description:
      'Monitor which allegations are proven, refuted, or uncertain based on linked evidence across all versions.',
    status: 'Wishlist',
  },
  {
    title: 'Generate Reports & Responses',
    description:
      'Create status reports showing proof progress and draft discovery responses organized by allegation and proceeding.',
    status: 'Wishlist',
  },
];
</script>

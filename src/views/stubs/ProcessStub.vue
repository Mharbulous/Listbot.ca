<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="EDRM Stage 4: Processing"
        badge-color="blue"
        title="Process Workflow"
        description="The Process stage reduces document volume and converts files to reviewable formats through intelligent deduplication, filtering, and metadata extraction—the most impactful cost-reduction stage in e-discovery."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="📊" title="Impact on Review Costs" color="emerald">
        Effective processing reduces review costs (which represent 80% of total e-discovery expenses)
        by
        <span class="font-bold text-emerald-700">50-75%</span> through comprehensive deduplication and
        intelligent filtering.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Current Implementation -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Current Implementation</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="✅"
            title="Categorization"
            badge="Currently Implemented"
            color="emerald"
            description="Automated organization and classification of documents based on content analysis, enabling efficient document organization and retrieval."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Streamlines document review and discovery
              </div>
            </template>
          </FeatureCard>
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
            Quick Wins - Phase 1
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="📧"
              title="Email Threading"
              badge="CRITICAL - Highest ROI Feature"
              priority="high"
              color="amber"
              description="Automatically identifies and groups email conversations, marking inclusive emails (containing all prior conversation content) vs. non-inclusive replies."
            >
              <template #extra-content>
                <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                  <div class="text-sm font-medium text-amber-900 mb-1">Expected Impact:</div>
                  <div class="text-2xl font-bold text-amber-700">40-74%</div>
                  <div class="text-sm text-amber-800">Review time reduction</div>
                </div>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">How it works:</span> Review only the final inclusive email
                  instead of every message in a thread
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="📈"
              title="Processing Analytics Dashboard"
              badge="Quick Win"
              color="blue"
              description="Real-time visualization showing processing progress, deduplication statistics, error rates, and volume reduction achieved."
            />
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
            Advanced Processing - Phase 2
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="🤖"
              title="AI Fuzzy Deduplication"
              badge="Advanced AI Analysis"
              description="Advanced AI-powered detection of near-duplicate documents that are substantially similar but not identical, reducing review volume while preserving important variations."
            />

            <FeatureCard
              icon="⚙️"
              title="Processing Profiles"
              badge="Workflow Efficiency"
              description="Save and reuse preferred processing settings across similar matters, including deduplication preferences and metadata field selections."
            />

            <FeatureCard
              icon="⚠️"
              title="Exception Handling Workflows"
              badge="Quality Assurance"
              description="Dedicated workflows for files that fail to process, with manual review queues and retry mechanisms."
            />

            <FeatureCard
              icon="🗂️"
              title="Metadata Field Mapping"
              badge="Customization"
              description="Configure which metadata fields to extract and preserve during processing, supporting 600+ file types."
            />
          </div>
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Processing Workflow" :steps="workflowSteps" />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="blue"
        description="ListBot.ca's processing capabilities will put it ahead of basic platforms while remaining more accessible than enterprise solutions:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        message="The Process stage is foundational to efficient e-discovery, and ListBot.ca is committed to delivering enterprise-grade capabilities through modern technology."
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
    title: 'Collection & Upload',
    description: 'Documents are collected and uploaded to the platform with original metadata preserved.',
  },
  {
    title: 'Hash Calculation & Exact Deduplication',
    description:
      'BLAKE3 hashes are calculated during upload to identify and group exact duplicates, reducing storage and processing costs.',
    status: 'Implemented at Preserve stage',
  },
  {
    title: 'AI Fuzzy Deduplication',
    description:
      'Advanced AI analysis identifies near-duplicate documents with similar but not identical content (planned).',
  },
  {
    title: 'Email Threading',
    description:
      'Email conversations are reconstructed and analyzed to identify inclusive vs. non-inclusive messages (planned).',
  },
  {
    title: 'Categorization',
    description:
      'Documents are automatically categorized based on content analysis for efficient organization.',
    status: 'Implemented',
  },
  {
    title: 'Review-Ready Corpus',
    description:
      'Processed documents are now optimized for review, with volume reduced by 50-75% and organized for efficient analysis.',
  },
];

const competitiveAdvantages = [
  { label: 'AI fuzzy deduplication', text: 'will surpass basic hash-only platforms' },
  { label: 'Email threading', text: 'will deliver 40-74% review time reduction' },
  { label: 'Processing analytics', text: 'will provide real-time insights' },
  { label: 'Modern tech stack', text: '(Vue 3, Firebase) ensures performance' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Quick Wins',
    timeframe: '1-2 months',
    color: 'amber',
    items: [
      'Email threading with header parsing and conversation reconstruction',
      'Processing analytics dashboard with Chart.js visualizations',
    ],
  },
  {
    title: 'Phase 2: Advanced Features',
    timeframe: '3-6 months',
    color: 'blue',
    items: [
      'Processing profiles for workflow reuse',
      'Exception handling workflows and manual review queues',
      'Metadata field mapping and customization',
      'Enhanced email threading visualization',
    ],
  },
];
</script>

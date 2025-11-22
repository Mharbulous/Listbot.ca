<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Case Management: Law"
        badge-color="teal"
        title="Legal Research & Memos Workflow"
        description="The Law module helps you organize legal research, track relevant statutes and case law, and generate research memos—creating a comprehensive legal knowledge base integrated with your evidence and facts."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="⚖️" title="Integrated Legal Research" color="teal">
        Connecting legal research directly to your evidence creates a powerful case development tool.
        <span class="font-bold text-teal-700">Integrated research</span>
        ensures every legal argument is backed by both law and evidence.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Planned Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="📚"
            title="Legal Research Library"
            badge="Foundation Feature"
            priority="high"
            color="teal"
            description="Organize case law, statutes, regulations, and secondary sources with custom tagging and categorization."
          />
          <FeatureCard
            icon="🔗"
            title="Evidence Linking"
            badge="Integration"
            priority="high"
            color="teal"
            description="Link legal authorities directly to supporting facts and evidence, creating a unified legal and factual narrative."
          />
          <FeatureCard
            icon="📝"
            title="Research Memo Generator"
            badge="Document Creation"
            color="blue"
            description="Generate formatted research memos with proper citations, integrated with your research library."
          />
          <FeatureCard
            icon="🤖"
            title="AI Legal Research Assistant"
            badge="AI-Powered"
            color="indigo"
            description="AI-powered legal research suggestions based on your facts, similar cases, and legal issues."
          />
          <FeatureCard
            icon="📊"
            title="Citation Management"
            badge="Quality Control"
            color="emerald"
            description="Track citations, validate cite formats, and ensure consistent legal citation throughout documents."
          />
          <FeatureCard
            icon="🏷️"
            title="Issue Spotting"
            badge="Strategic Tool"
            color="purple"
            description="Tag research by legal issue, claim, or defense for organized access during brief writing."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Legal Research Workflow" :steps="workflowSteps" />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="teal"
        description="ListBot.ca's Law module will integrate legal research with evidence:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        message="The Law module will transform legal research from isolated work into an integrated component of your case strategy."
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
    title: 'Conduct Research',
    description: 'Research case law, statutes, and regulations using external legal databases.',
  },
  {
    title: 'Add to Library',
    description: 'Import and organize legal authorities into your research library with tags and notes.',
  },
  {
    title: 'Link to Evidence',
    description:
      'Connect legal authorities to supporting facts and documents to build integrated arguments.',
  },
  {
    title: 'Organize by Issue',
    description: 'Tag and categorize research by legal issue, claim, or defense for easy retrieval.',
  },
  {
    title: 'Generate Memos',
    description: 'Create research memos with proper citations and integrated analysis.',
  },
  {
    title: 'Brief Integration',
    description: 'Pull research and citations directly into briefs and pleadings.',
  },
];

const competitiveAdvantages = [
  { label: 'Evidence linking', text: 'connects law to facts seamlessly' },
  { label: 'Integrated citations', text: 'ensures consistent legal citations' },
  { label: 'Issue organization', text: 'enables strategic access to research' },
  { label: 'AI assistance', text: 'suggests relevant authorities' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Research Library',
    color: 'teal',
    items: [
      'Legal research library with custom tagging',
      'Evidence linking system',
      'Basic citation management',
      'Issue-based organization',
    ],
  },
  {
    title: 'Phase 2: Advanced Features',
    color: 'blue',
    items: [
      'AI legal research assistant',
      'Research memo generator',
      'Citation validation and formatting',
      'Integration with brief writing tools',
    ],
  },
];
</script>

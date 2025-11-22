<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Case Management: Theory"
        badge-color="purple"
        title="Case Theory Development"
        description="The Theory module helps you develop and articulate your case theory—the cohesive narrative that connects facts, law, and strategy into a compelling story that explains why your client should prevail."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="♙" title="The Foundation of Advocacy" color="purple">
        A strong case theory is the difference between winning and losing.
        <span class="font-bold text-purple-700">Clear, compelling theory</span> guides every decision
        from discovery to closing arguments and makes your case memorable to judges and juries.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Planned Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Features</h2>

        <!-- High Priority Features -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span
              class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
            >
              HIGH PRIORITY
            </span>
            Core Theory Development Tools
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="📝"
              title="Theory Statement Builder"
              badge="Foundation Feature"
              priority="high"
              color="purple"
              description="Craft your core case theory statement—a concise narrative that explains your legal theory, key facts, and why you should win—in one or two compelling sentences."
            >
              <template #extra-content>
                <div class="bg-purple-50 border border-purple-200 rounded p-3 mb-3">
                  <div class="text-sm font-medium text-purple-900 mb-1">Expected Impact:</div>
                  <div class="text-sm text-purple-800">
                    A clear theory statement guides all strategic decisions and advocacy
                  </div>
                </div>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Example:</span> "This is a breach of contract case where
                  the defendant failed to deliver..."
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="✅"
              title="Legal Elements Checklist"
              badge="Foundation Feature"
              priority="high"
              color="purple"
              description="Map each legal element of your claim or defense to supporting facts and evidence, ensuring you can prove every required element at trial."
            >
              <template #extra-content>
                <div class="text-sm text-slate-500 mb-2">
                  <span class="font-medium">Features:</span> Element-to-fact mapping, evidence
                  linking, gap identification
                </div>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Benefit:</span> Visual proof you can meet your burden on
                  every element
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="🎨"
              title="Theme & Narrative Builder"
              badge="Workflow Feature"
              color="blue"
              description="Develop the emotional themes and narrative arc that make your case memorable and persuasive—the human story behind the legal theory."
            >
              <template #extra-content>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Benefit:</span> Compelling themes resonate with judges and
                  juries
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="🛡️"
              title="Weakness Analysis"
              badge="Strategic Feature"
              color="blue"
              description="Identify vulnerabilities in your theory and develop responses to opposing arguments, preparing you to address weaknesses head-on."
            >
              <template #extra-content>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Benefit:</span> Proactive defense against opposing
                  arguments
                </div>
              </template>
            </FeatureCard>
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
            Advanced Theory Tools
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="🔀"
              title="Alternative Theory Analysis"
              badge="Strategic Planning"
              description="Develop and compare alternative legal theories for your case, evaluating strengths, weaknesses, and strategic implications of each approach."
            >
              <template #extra-content>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Benefit:</span> Choose the strongest theory with
                  confidence
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="⏱️"
              title="Timeline-Theory Integration"
              badge="Narrative Development"
              description="Link your theory to a visual timeline of events, creating a chronological narrative that makes complex facts easy to understand."
            >
              <template #extra-content>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Benefit:</span> Visual storytelling enhances persuasion
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="🤖"
              title="AI Theory Development"
              badge="AI-Powered Analysis"
              description="AI analyzes your facts and law to suggest potential theories, identify gaps in your proof, and recommend supporting evidence."
            >
              <template #extra-content>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Benefit:</span> AI insights uncover theories you might miss
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="🎭"
              title="Advocacy Templates"
              badge="Trial Preparation"
              description="Generate opening statement and closing argument outlines based on your theory, ensuring consistent messaging from start to finish."
            >
              <template #extra-content>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">Benefit:</span> Your theory flows through every phase of
                  trial
                </div>
              </template>
            </FeatureCard>
          </div>
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps
        title="Theory Development Workflow"
        color="purple"
        :steps="workflowSteps"
      />
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="purple"
        description="ListBot.ca's Theory module transforms abstract legal concepts into actionable case strategy:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        message="The Theory module will help you develop compelling case theories that integrate facts, law, and narrative into winning strategies."
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
    title: 'Identify Core Legal Claims',
    description:
      'Start with the legal basis for your case—the claims or defenses you\'ll pursue and the elements you must prove.',
  },
  {
    title: 'Map Facts to Elements',
    description:
      'Connect your evidence and facts to each legal element, identifying gaps and ensuring you can meet your burden of proof.',
  },
  {
    title: 'Craft Your Theory Statement',
    description:
      'Distill your case into a clear, memorable theory statement that explains why you should win in one or two compelling sentences.',
  },
  {
    title: 'Develop Themes & Narrative',
    description:
      'Build the emotional themes and story arc that make your legal theory resonate with human decision-makers.',
  },
  {
    title: 'Test & Refine',
    description:
      'Identify weaknesses in your theory, develop responses to opposing arguments, and refine your approach based on discovery and legal research.',
  },
];

const competitiveAdvantages = [
  { label: 'Element-to-evidence mapping', text: 'ensures you can prove every claim' },
  { label: 'AI-powered theory development', text: 'uncovers stronger approaches' },
  { label: 'Integrated fact-law narrative', text: 'creates compelling storytelling' },
  { label: 'Weakness analysis', text: 'prepares you for opposition arguments' },
];

const timelinePhases = [
  {
    title: 'Phase 1: Core Theory Tools',
    color: 'purple',
    items: [
      'Theory statement builder with templates and examples',
      'Legal elements checklist with fact-to-element mapping',
      'Theme and narrative development workspace',
      'Weakness analysis and response planning tool',
    ],
  },
  {
    title: 'Phase 2: AI & Advanced Features',
    color: 'blue',
    items: [
      'AI theory development assistant with smart suggestions',
      'Alternative theory comparison and evaluation tools',
      'Timeline-theory integration for visual storytelling',
      'Opening statement and closing argument generators',
    ],
  },
];
</script>

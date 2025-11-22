<template>
  <StubPageLayout>
    <template #header>
      <div class="mb-8">
        <div
          class="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-blue-100 text-blue-800 mb-4"
        >
          📃 EDRM Stage 7: Produce
        </div>
        <h1 class="text-4xl font-bold text-slate-900 mb-4">Produce Workflow</h1>
        <p class="text-xl text-slate-600 mb-6">
          Delivering responsive, non-privileged electronically stored information (ESI) to opposing
          parties in appropriate formats with proper metadata and Bates numbering—formalizing
          discovery responses with defensibility as paramount.
        </p>
      </div>
    </template>

    <template #content>
      <!-- Overview Section -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-semibold text-slate-900 mb-4">What is the Produce Stage?</h2>
        <p class="text-slate-700 mb-4">
          The Produce stage is where your careful work in review and analysis becomes formally
          documented and delivered to opposing counsel. This stage transforms reviewed documents
          into court-compliant productions with proper formatting, numbering, and metadata.
        </p>
        <p class="text-slate-700 mb-4">
          Production must adhere to ESI protocols negotiated at the Rule 26(f) conference, ensuring
          that all deliverables meet legal standards and maintain the integrity of the discovery
          process.
        </p>
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
          <p class="text-blue-900">
            <strong>Why It Matters:</strong> A defensible production process protects your client
            from sanctions and challenges, while proper organization and formatting ensure opposing
            counsel can efficiently review the materials you provide.
          </p>
        </div>
      </div>

      <!-- Current Implementation -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-slate-900 mb-4">Current Implementation</h2>
        <FeatureCard
          icon="✅"
          title="Create List Feature"
          badge="Currently Implemented"
          color="emerald"
          description="The Create List feature enables production set creation, allowing you to organize and prepare documents for delivery to opposing parties."
        >
          <template #extra-content>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Foundational capability for organizing
              responsive documents into production sets
            </div>
          </template>
        </FeatureCard>
      </div>

      <!-- Planned Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-slate-900 mb-6">Planned Features</h2>

        <!-- Phase 1 -->
        <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center mb-4">
            <span class="text-2xl mr-3">🚀</span>
            <h3 class="text-xl font-semibold text-slate-900">
              Phase 1: Essential Production Tools
            </h3>
          </div>

          <div class="space-y-4">
            <div class="bg-white rounded-lg p-4">
              <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                <span class="mr-2">🔢</span>
                Flexible Bates Numbering
              </h4>
              <p class="text-slate-700 mb-2">
                Customizable Bates stamping with support for multiple formatting options and
                placement control.
              </p>
            </div>

            <div class="bg-white rounded-lg p-4">
              <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                <span class="mr-2">📄</span>
                Multiple Production Formats
              </h4>
              <p class="text-slate-700 mb-2">
                Support for industry-standard production formats to meet various opposing counsel
                requirements.
              </p>
            </div>

            <div class="bg-white rounded-lg p-4">
              <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                <span class="mr-2">✓</span>
                Production Quality Control
              </h4>
              <p class="text-slate-700 mb-2">
                Automated checks to ensure production completeness and compliance before delivery.
              </p>
            </div>
          </div>
        </div>

        <!-- Phase 2 -->
        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6">
          <div class="flex items-center mb-4">
            <span class="text-2xl mr-3">⚡</span>
            <h3 class="text-xl font-semibold text-slate-900">
              Phase 2: Advanced Production Management
            </h3>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="🔒"
              title="Automated Privilege Log Generation"
              description="Auto-populate privilege logs from metadata captured during review."
            />
            <FeatureCard
              icon="📋"
              title="Rolling Production Management"
              description="Track multiple productions over time with version control."
            />
            <FeatureCard
              icon="🔐"
              title="Secure Delivery Mechanisms"
              description="Multiple secure delivery options with access logging."
            />
            <FeatureCard
              icon="⚙️"
              title="Production Profiles & Templates"
              description="Save preferred production settings for reuse across matters."
            />
          </div>
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Production Workflow" :steps="workflowSteps" />

      <!-- Key Benefits -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-semibold text-slate-900 mb-4">Key Benefits</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="flex items-start">
            <span class="text-2xl mr-3">⚖️</span>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Court Compliance</h3>
              <p class="text-slate-600">
                Productions meet ESI protocol requirements with proper formatting, numbering, and
                metadata—protecting against sanctions.
              </p>
            </div>
          </div>
          <div class="flex items-start">
            <span class="text-2xl mr-3">🛡️</span>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Defensibility</h3>
              <p class="text-slate-600">
                Comprehensive audit trails and quality control workflows create defensible
                production processes.
              </p>
            </div>
          </div>
          <div class="flex items-start">
            <span class="text-2xl mr-3">⚡</span>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Efficiency</h3>
              <p class="text-slate-600">
                Production profiles and automated privilege logs dramatically reduce manual work.
              </p>
            </div>
          </div>
          <div class="flex items-start">
            <span class="text-2xl mr-3">🔒</span>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Security & Control</h3>
              <p class="text-slate-600">
                Secure delivery mechanisms with access logging and version control.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Technical Foundation -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-semibold text-slate-900 mb-4">Technical Foundation</h2>
        <p class="text-slate-700 mb-4">
          The Produce stage leverages ListBot.ca's modern technology stack for efficient, reliable
          production generation:
        </p>
        <div class="grid md:grid-cols-3 gap-4">
          <div class="bg-slate-50 rounded p-4">
            <h3 class="font-semibold text-slate-900 mb-2">Vue 3 Frontend</h3>
            <p class="text-slate-600 text-sm">
              Intuitive production configuration interfaces with real-time validation and preview
            </p>
          </div>
          <div class="bg-slate-50 rounded p-4">
            <h3 class="font-semibold text-slate-900 mb-2">Firebase Backend</h3>
            <p class="text-slate-600 text-sm">
              Cloud Functions for Bates stamping and PDF generation with secure storage delivery
            </p>
          </div>
          <div class="bg-slate-50 rounded p-4">
            <h3 class="font-semibold text-slate-900 mb-2">PDF Processing</h3>
            <p class="text-slate-600 text-sm">
              jsPDF and PDF-lib for Bates stamping, image conversion, and searchable PDF generation
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #timeline>
      <ImplementationTimeline :phases="timelinePhases" />
    </template>

    <template #footer>
      <StubFooter
        variant="coming-soon"
        color="blue"
        coming-soon-title="Enhanced Production Features Coming Soon"
        coming-soon-text="The Produce stage is being enhanced with advanced features to deliver enterprise-level production capabilities with exceptional ease of use."
        coming-soon-subtext="The foundational Create List feature is available now. Advanced production tools including Bates numbering, privilege logs, and secure delivery are under active development."
      />
    </template>
  </StubPageLayout>
</template>

<script setup>
import StubPageLayout from '@/components/stubs/StubPageLayout.vue';
import FeatureCard from '@/components/stubs/FeatureCard.vue';
import WorkflowSteps from '@/components/stubs/WorkflowSteps.vue';
import ImplementationTimeline from '@/components/stubs/ImplementationTimeline.vue';
import StubFooter from '@/components/stubs/StubFooter.vue';

const workflowSteps = [
  {
    title: 'Review ESI Protocol',
    description: 'Confirm production format requirements from Rule 26(f) conference agreements.',
  },
  {
    title: 'Create Production Set',
    description:
      'Use the Create List feature to organize responsive, non-privileged documents into a production set.',
    status: 'Implemented',
  },
  {
    title: 'Quality Control Review',
    description:
      'Run automated checks for completion, privilege verification, and metadata validation (planned).',
  },
  {
    title: 'Apply Bates Numbering',
    description:
      'Configure and apply Bates stamps with customizable prefixes, formatting, and placement (planned).',
  },
  {
    title: 'Generate Privilege Log',
    description: 'Auto-populate privilege log from review metadata for withheld documents (planned).',
  },
  {
    title: 'Export & Package',
    description:
      'Generate production in required format (native, TIFF, searchable PDF) with load files (planned).',
  },
  {
    title: 'Secure Delivery',
    description:
      'Transmit production via secure methods (FTP, encrypted portal) with confirmation tracking (planned).',
  },
  {
    title: 'Document & Track',
    description: 'Generate production reports and maintain audit trail for defensibility (planned).',
  },
];

const timelinePhases = [
  {
    title: 'Phase 1: Essential Production Tools',
    timeframe: '1-2 months',
    color: 'emerald',
    items: [
      'Flexible Bates numbering with customizable prefixes and formatting',
      'Multiple production formats (native, TIFF, searchable PDF)',
      'Quality control workflows with automated validation checks',
    ],
  },
  {
    title: 'Phase 2: Advanced Production Management',
    timeframe: '3-6 months',
    color: 'purple',
    items: [
      'Automated privilege log generation from review metadata',
      'Rolling production tracking with version control',
      'Secure delivery mechanisms (FTP, cloud portal, encrypted transfer)',
      'Production profiles and templates for workflow efficiency',
      'Comprehensive production reports and documentation',
    ],
  },
];
</script>

<style scoped>
.produce-workflow-page {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

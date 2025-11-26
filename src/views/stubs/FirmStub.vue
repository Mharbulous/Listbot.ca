<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Organization Management"
        badge-color="blue"
        title="Firm Management"
        description="The Firm module helps you manage your law firm's organizational structure, settings, and administrative functions in one centralized location."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="🏢" title="Centralized Firm Management" color="blue">
        Streamline firm administration with a unified management interface.
        <span class="font-bold text-blue-700">Efficient firm management</span>
        saves time and reduces administrative overhead.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Core Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="⚙️"
            title="Firm Settings"
            badge="Foundation Feature"
            color="blue"
            description="Configure firm-wide settings, preferences, and default configurations for consistent operations across all matters."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Centralized control over firm operations
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="👥"
            title="Team Management"
            badge="Foundation Feature"
            color="blue"
            description="Manage team members, roles, and permissions to ensure proper access control and collaboration."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Secure and organized team collaboration
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
            icon="📊"
            title="Firm Analytics"
            badge="Advanced Feature"
            color="amber"
            description="View comprehensive analytics and reports on firm performance, matter progress, and resource utilization."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Data-driven insights for better decision making
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="🔐"
            title="Security & Compliance"
            badge="Advanced Feature"
            color="amber"
            description="Manage security policies, audit logs, and compliance requirements to maintain professional standards."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Enhanced security and regulatory compliance
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="📁"
            title="Document Templates"
            badge="Productivity Feature"
            description="Create and manage firm-wide document templates for consistent client communications and legal documents."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Faster document creation with firm standards
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="💼"
            title="Billing Configuration"
            badge="Business Feature"
            description="Configure billing rates, payment terms, and invoicing settings for streamlined financial management."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Efficient and consistent billing processes
              </div>
            </template>
          </FeatureCard>
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps
        title="Firm Management Workflow"
        color="blue"
        :steps="workflowSteps"
      />
    </template>

    <template #footer>
      <StubFooter
        message="The Firm module will provide comprehensive management tools to streamline your firm's administrative operations and enhance organizational efficiency."
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
    title: 'Configure Firm Settings',
    description:
      'Set up your firm profile, branding, and default preferences that will apply across all matters and team members.',
  },
  {
    title: 'Manage Team Members',
    description:
      'Add team members, assign roles, and configure permissions to ensure secure and efficient collaboration.',
  },
  {
    title: 'Set Up Templates',
    description:
      'Create standardized document templates and workflows to maintain consistency across all firm operations.',
  },
  {
    title: 'Monitor Analytics',
    description:
      'Review firm performance metrics, matter statistics, and resource utilization to optimize operations.',
  },
  {
    title: 'Maintain Compliance',
    description:
      'Configure security policies, review audit logs, and ensure adherence to professional and regulatory requirements.',
  },
];
</script>

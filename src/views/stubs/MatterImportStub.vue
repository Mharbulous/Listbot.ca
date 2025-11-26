<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="Case Management: Matter Import"
        badge-color="blue"
        title="AI-Powered Bulk Matter Import"
        description="Import matters from folder structures or practice management exports using frontier AI to intelligently discover patterns, extract data, and validate imports—adapting to your firm's unique naming conventions without custom configuration."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="🤖" title="AI-Powered Pattern Discovery" color="blue">
        AI-powered import eliminates the need for custom parsers and complex configuration by
        <span class="font-bold text-blue-700">automatically discovering your firm's unique naming patterns and data structure</span>.
        Import hundreds of matters from folder hierarchies or practice management exports in minutes,
        not hours—with intelligent validation and cross-referencing to ensure accuracy.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Vision Statement -->
      <div
        class="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-6 mb-8 rounded-lg"
      >
        <h3 class="text-lg font-semibold text-slate-900 mb-2">🎯 AI-First Import Philosophy</h3>
        <p class="text-slate-700 mb-3">
          Traditional bulk import tools require custom parsers for each practice management system—a
          brittle approach that becomes obsolete as systems evolve. ListBot takes a different approach:
          <span class="font-bold text-blue-700">let frontier AI discover your data patterns automatically</span>.
        </p>
        <p class="text-slate-700">
          Whether importing from folder structures organized by your firm's unique conventions, or from
          CSV/Excel/PDF exports from any practice management system, AI analyzes your data, discovers
          the schema, and presents it for human verification—adapting to your reality instead of
          forcing you into rigid templates.
        </p>
      </div>

      <!-- Core Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Core Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="📁"
            title="Folder Structure Import"
            badge="Path 1: Quick Setup"
            priority="high"
            color="blue"
            description="Select your client files root folder. AI scans the hierarchy, discovers your firm's naming patterns (client names, matter numbers, dates), and extracts structured data from folder names—no manual mapping required."
          />
          <FeatureCard
            icon="📄"
            title="Document Analysis Import"
            badge="Path 2: Detailed Data"
            priority="high"
            color="blue"
            description="Upload CSV/Excel/PDF exports from any practice management system. AI discovers the source schema, extracts matter data, and can validate/enrich existing matters imported from folders."
          />
          <FeatureCard
            icon="🔍"
            title="AI Pattern Discovery"
            badge="Zero Configuration"
            priority="high"
            color="cyan"
            description="AI automatically identifies your firm's unique naming conventions and data structure—whether it's client initials, matter numbers, compound IDs, or custom patterns. No templates or parsers to configure."
          />
          <FeatureCard
            icon="✅"
            title="Interactive Verification"
            badge="Human-in-the-Loop"
            priority="high"
            color="cyan"
            description="Review AI-generated tables with drag-drop column reordering, 3-state checkboxes (import/skip/uncertain), and confidence indicators. Approve page-by-page with full control before import."
          />
        </div>
      </div>

      <!-- Wishlist Features -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Wishlist Features</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🔗"
            title="Cross-Reference Validation"
            badge="Data Quality"
            color="indigo"
            description="When combining folder and document imports, AI cross-references data to detect duplicates, conflicts, and enrichment opportunities—flagging fuzzy matches for human review."
          />
          <FeatureCard
            icon="⚠️"
            title="Confidence-Based Flagging"
            badge="Smart Verification"
            color="indigo"
            description="AI highlights low-confidence extractions with warning icons, enabling focused review on uncertain data while batch-approving high-confidence items."
          />
          <FeatureCard
            icon="🗂️"
            title="Custom Field Mapping"
            badge="Flexibility"
            color="purple"
            description="Map discovered columns that don't match standard ListBot fields to custom metadata fields, preserving firm-specific data for future use."
          />
          <FeatureCard
            icon="🔄"
            title="Multi-Document Matter Building"
            badge="Advanced AI"
            color="purple"
            description="AI analyzes multiple related documents (retainer agreement, intake form, case notes) to build a comprehensive matter record from disparate sources."
          />
          <FeatureCard
            icon="📊"
            title="Data Transformation Layer"
            badge="Future Enhancement"
            color="slate"
            description="Advanced mapping with data transformations: date parsing, name concatenation, regex extraction, and formula-based field generation."
          />
          <FeatureCard
            icon="📋"
            title="Import History & Audit Trail"
            badge="Compliance"
            color="slate"
            description="Complete audit trail of all import operations with timestamps, user attribution, AI confidence scores, and rollback capability."
          />
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Matter Import Workflow" :steps="workflowSteps" />
    </template>

    <template #footer>
      <StubFooter
        variant="coming-soon"
        color="blue"
        coming-soon-title="AI-Powered Bulk Import Coming Soon"
        coming-soon-text="ListBot.ca will leverage frontier AI (Gemini) to intelligently import matters from any source—folder structures, CSV/Excel exports, or PDF reports—without requiring custom parsers or rigid templates."
        coming-soon-subtext="This AI-first approach adapts to your firm's unique conventions and handles new practice management systems automatically, making bulk import a one-time setup instead of an ongoing maintenance burden."
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
    title: 'Choose Import Path',
    description:
      'Select Folder Import (quick bulk setup from client file structure) or Document Import (detailed data from PM system exports). Paths can be combined for best results.',
  },
  {
    title: 'AI Pattern Discovery',
    description:
      'AI analyzes your data source (folder names or document structure), automatically discovers naming patterns and data components your firm uses—no manual configuration needed.',
  },
  {
    title: 'Review Dynamic Table',
    description:
      'AI presents extracted data in a table with discovered schema as headers. Drag-drop columns/cells to fix any errors. Use 3-state checkboxes to select matters: ✅ import, ☐ skip, ❓ uncertain.',
  },
  {
    title: 'Verify Low-Confidence Items',
    description:
      'AI flags uncertain extractions with ⚠️ icons. Review and correct these items while batch-approving high-confidence data. AI learns your firm\'s patterns.',
  },
  {
    title: 'Map to ListBot Fields',
    description:
      'Map discovered columns to ListBot fields (clientName, matterNumber, etc.). AI suggests mappings, you confirm. Unmapped columns can become custom fields.',
  },
  {
    title: 'Approve & Import Page',
    description:
      'Review one page (~20 matters) at a time. Click "Approve & Import All on Page" to process batch. Continue through pages with real-time progress tracking.',
  },
  {
    title: 'Cross-Reference & Enrich (Optional)',
    description:
      'If combining folder + document imports, AI cross-references to validate existing matters, detect duplicates, and enrich with additional data from documents.',
  },
];
</script>

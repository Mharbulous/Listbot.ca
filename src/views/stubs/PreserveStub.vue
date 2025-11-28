<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="EDRM Stage 2: Preservation"
        badge-color="purple"
        title="Preserve Workflow"
        description="The Preserve stage ensures potentially relevant evidence is protected from alteration or deletion through secure cloud storage, hash-based deduplication, and comprehensive metadata preservation—establishing the foundation for defensible e-discovery."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="🛡️" title="Critical Legal Protection" color="purple">
        Proper preservation with tamper-proof storage and cryptographic hashing prevents spoliation
        sanctions, which can
        <span class="font-bold text-purple-700">exceed $1M in penalties</span> and result in adverse
        inference instructions that can decide case outcomes.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- Current Implementation -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">Current Implementation</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <FeatureCard
            icon="✅"
            title="Exact Hash-Based Deduplication"
            badge="Currently Implemented"
            color="emerald"
            description="BLAKE3 cryptographic hashing identifies exact duplicate files during upload, automatically storing only unique files while preserving metadata for all copies."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Reduces storage costs by 30-50% while
                maintaining complete audit trail
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="✅"
            title="Cloud Storage Security"
            badge="Currently Implemented"
            color="emerald"
            description="Firebase Cloud Storage provides tamper-proof preservation with automatic versioning, access controls, and geographic redundancy."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Ensures evidence integrity and
                defensibility
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="✅"
            title="Metadata Preservation"
            badge="Currently Implemented"
            color="emerald"
            description="Complete filesystem metadata (filename, size, modified date, path) is captured and preserved for all files, including duplicates and copies."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Maintains chain of custody and provenance
              </div>
            </template>
          </FeatureCard>

          <FeatureCard
            icon="✅"
            title="Upload Progress Tracking"
            badge="Currently Implemented"
            color="emerald"
            description="Real-time monitoring of upload progress with detailed status tracking, error handling, and batch processing capabilities."
          >
            <template #extra-content>
              <div class="text-sm text-slate-500">
                <span class="font-medium">Benefit:</span> Transparent visibility into preservation
                process
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
            Enhanced Preservation - Phase 1
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="⚖️"
              title="Legal Hold Notifications"
              badge="CRITICAL - Compliance Feature"
              priority="high"
              color="amber"
              description="Automated legal hold notifications with acknowledgment tracking, ensuring custodians understand their preservation obligations."
            >
              <template #extra-content>
                <div class="bg-amber-50 border border-amber-200 rounded p-3 mb-3">
                  <div class="text-sm font-medium text-amber-900 mb-1">Expected Impact:</div>
                  <div class="text-sm text-amber-800">
                    Reduces risk of spoliation and demonstrates good faith compliance
                  </div>
                </div>
                <div class="text-sm text-slate-500">
                  <span class="font-medium">How it works:</span> Automated email notifications with
                  read receipts and acknowledgment tracking
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="📋"
              title="Chain of Custody Logging"
              badge="Quick Win"
              color="blue"
              description="Comprehensive audit trail logging every access, modification, and transfer of preserved evidence with timestamps and user attribution."
            />

            <FeatureCard
              icon="📊"
              title="Preservation Dashboard"
              badge="Quick Win"
              color="blue"
              description="Real-time visualization of preservation metrics including storage usage, deduplication ratios, file type breakdown, and custodian activity."
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
            Advanced Preservation - Phase 2
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="👤"
              title="Custodian Self-Service Portal"
              badge="Workflow Efficiency"
              description="Allow custodians to upload their own documents directly through a secure, user-friendly interface with guided instructions."
            />

            <FeatureCard
              icon="🔍"
              title="File Format Validation"
              badge="Quality Assurance"
              description="Automatically detect corrupted files, verify file type authenticity, and flag suspicious extensions during upload."
            />

            <FeatureCard
              icon="📄"
              title="Preservation Reports"
              badge="Compliance Documentation"
              description="Generate detailed preservation reports for opposing counsel or court showing what was preserved, when, and by whom."
            />
          </div>
        </div>
      </div>

      <!-- Workflow Steps -->
      <WorkflowSteps title="Preservation Workflow" :steps="workflowSteps" />
    </template>

    <template #footer>
      <StubFooter
        message="The Preserve stage is the foundation of defensible e-discovery, and ListBot.ca delivers enterprise-grade preservation through modern cloud technology."
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
import StubFooter from '@/components/stubs/StubFooter.vue';

const workflowSteps = [
  {
    title: 'File Selection',
    description:
      'Users select files or folders for preservation through drag-and-drop or file browser.',
    status: 'Implemented',
  },
  {
    title: 'Hash Calculation & Deduplication',
    description:
      'BLAKE3 hashes are calculated in a web worker to identify duplicates and copies without blocking the UI.',
    status: 'Implemented',
  },
  {
    title: 'Metadata Extraction',
    description:
      'Filesystem metadata (name, size, modified date, path) is extracted and preserved for all files.',
    status: 'Implemented',
  },
  {
    title: 'Upload to Cloud Storage',
    description:
      'Unique files are uploaded to Firebase Cloud Storage with progress tracking and error handling.',
    status: 'Implemented',
  },
  {
    title: 'Chain of Custody Logging',
    description:
      'All preservation actions are logged with timestamps and user attribution for audit trail (planned).',
  },
  {
    title: 'Evidence Ready for Collection',
    description: 'Preserved files are now securely stored and ready for collection and processing stages.',
  },
];
</script>

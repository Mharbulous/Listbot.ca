<template>
  <StubPageLayout>
    <template #header>
      <PageHeader
        badge-text="🚀 Development Roadmap"
        badge-color="indigo"
        title="ListBot.ca Development Plan"
        description="Strategic development roadmap prioritizing MVP features for the legal document list creation tool, followed by expansion into comprehensive case management and e-discovery platform."
      />
    </template>

    <template #key-impact>
      <KeyImpactBox icon="🎯" title="MVP Focus: Simple List Creation" color="indigo">
        The MVP delivers a focused tool for
        <span class="font-bold text-indigo-700"
          >dating, categorizing, and describing documents using Gemini AI</span
        >, then generating professional discovery lists in PDF format—solving an immediate pain
        point before expanding to full case management.
      </KeyImpactBox>
    </template>

    <template #content>
      <!-- MVP Overview -->
      <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold text-indigo-900 mb-4">🎯 MVP: Document List Creator</h2>
        <p class="text-lg text-slate-700 mb-4">
          The Minimum Viable Product focuses on the core workflow that delivers immediate value to
          lawyers managing discovery documents:
        </p>
        <div class="grid gap-4 md:grid-cols-2 mb-6">
          <div class="bg-white rounded-lg p-4 shadow">
            <div class="text-2xl mb-2">📤</div>
            <h3 class="font-bold text-slate-900 mb-1">1. Upload Documents</h3>
            <p class="text-sm text-slate-600">
              Bulk upload PDF, Word, Excel files with deduplication and hash-based storage
            </p>
          </div>
          <div class="bg-white rounded-lg p-4 shadow">
            <div class="text-2xl mb-2">🤖</div>
            <h3 class="font-bold text-slate-900 mb-1">2. AI Analysis</h3>
            <p class="text-sm text-slate-600">
              Gemini AI automatically dates, categorizes, and describes each document
            </p>
          </div>
          <div class="bg-white rounded-lg p-4 shadow">
            <div class="text-2xl mb-2">✏️</div>
            <h3 class="font-bold text-slate-900 mb-1">3. Review & Refine</h3>
            <p class="text-sm text-slate-600">
              Review AI-suggested metadata, make corrections, and organize documents
            </p>
          </div>
          <div class="bg-white rounded-lg p-4 shadow">
            <div class="text-2xl mb-2">📄</div>
            <h3 class="font-bold text-slate-900 mb-1">4. Generate PDF List</h3>
            <p class="text-sm text-slate-600">
              Export formatted list of discovery documents or court-ready schedule
            </p>
          </div>
        </div>
        <div class="bg-indigo-100 border-l-4 border-indigo-500 p-4 rounded">
          <p class="text-indigo-900">
            <strong>Why this MVP?</strong> Lawyers spend hours manually creating document lists
            for court filings and discovery responses. This MVP automates 90% of that work,
            delivering immediate ROI before expanding to comprehensive case management features.
          </p>
        </div>
      </div>

      <!-- Development Phases -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-slate-900 mb-6">Development Phases</h2>

        <!-- Phase 1: MVP Foundation -->
        <div class="mb-8 border-l-4 border-indigo-500 pl-6">
          <div class="flex items-center gap-3 mb-3">
            <div
              class="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg"
            >
              1
            </div>
            <h3 class="text-2xl font-bold text-indigo-900">
              Phase 1: MVP Foundation (Months 1-3)
            </h3>
          </div>
          <p class="text-slate-700 mb-4 italic">
            Priority: Build the core document upload → AI analysis → list generation workflow
          </p>

          <div class="grid gap-4 md:grid-cols-2 mb-4">
            <FeatureCard
              icon="📤"
              title="Document Upload (Preserve/Collect)"
              badge="Partially Complete"
              color="green"
              description="File upload with deduplication, hash-based storage, and batch processing"
            >
              <template #extra-content>
                <div class="text-sm text-slate-600 mt-2">
                  <strong>Current status:</strong> Core upload working, needs refinement for large
                  batches
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="🤖"
              title="AI Document Analysis"
              badge="Partially Complete"
              color="green"
              description="Gemini AI extracts dates, categories, and descriptions from documents"
            >
              <template #extra-content>
                <div class="text-sm text-slate-600 mt-2">
                  <strong>Current status:</strong> AI analysis exists, needs optimization for batch
                  processing
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="🗂️"
              title="Document Organizer (Review)"
              badge="Working"
              color="green"
              description="Table view with sorting, filtering, editing of document metadata"
            >
              <template #extra-content>
                <div class="text-sm text-slate-600 mt-2">
                  <strong>Current status:</strong> Core organizer complete with viewer integration
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="📄"
              title="List Generator (Produce)"
              badge="Critical - High Priority"
              priority="high"
              color="red"
              description="Generate formatted PDF discovery lists and court schedules"
            >
              <template #extra-content>
                <div class="text-sm text-red-600 mt-2">
                  <strong>Status:</strong> NOT STARTED - This is the missing piece for MVP
                </div>
              </template>
            </FeatureCard>
          </div>

          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <h4 class="font-bold text-indigo-900 mb-2">Phase 1 Completion Criteria:</h4>
            <ul class="list-disc list-inside text-slate-700 space-y-1">
              <li>Upload 100+ documents in single batch without errors</li>
              <li>AI analysis runs on all uploaded PDFs and extracts key metadata</li>
              <li>User can review, edit, and organize documents in table view</li>
              <li>
                Generate professional PDF list with: document name, date, category, description
              </li>
              <li>Export list formatted for Ontario court filing requirements</li>
            </ul>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <p class="text-amber-900">
              <strong>⚠️ MVP Blocker:</strong> The List Generator (Produce) feature is the ONLY
              missing piece to complete the MVP. Focus all development effort here until complete.
            </p>
          </div>
        </div>

        <!-- Phase 2: Case Management Basics -->
        <div class="mb-8 border-l-4 border-purple-500 pl-6">
          <div class="flex items-center gap-3 mb-3">
            <div
              class="bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg"
            >
              2
            </div>
            <h3 class="text-2xl font-bold text-purple-900">
              Phase 2: Case Management Basics (Months 4-6)
            </h3>
          </div>
          <p class="text-slate-700 mb-4 italic">
            Priority: Add fact management, legal research, and case theory tools
          </p>

          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="📅"
              title="Facts Module"
              badge="Foundation for Theory"
              color="amber"
              description="Timeline of key facts, evidence cross-referencing, AI fact extraction"
            >
              <template #extra-content>
                <div class="text-sm text-slate-600 mt-2">
                  <strong>Why now:</strong> Facts tie documents to case narrative, enhancing list
                  value
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="⚖️"
              title="Law Module"
              badge="Research Integration"
              color="teal"
              description="Legal research library, memo management, authority tracking"
            >
              <template #extra-content>
                <div class="text-sm text-slate-600 mt-2">
                  <strong>Why now:</strong> Connects legal issues to facts and documents
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="📝"
              title="Theory Module"
              badge="Strategic Planning"
              color="purple"
              description="Case theory builder, element-to-evidence mapping, narrative development"
            >
              <template #extra-content>
                <div class="text-sm text-slate-600 mt-2">
                  <strong>Why now:</strong> Ties facts and law together into coherent case strategy
                </div>
              </template>
            </FeatureCard>

            <FeatureCard
              icon="👥"
              title="Cast Module"
              badge="Relationship Tracking"
              color="indigo"
              description="Track parties, witnesses, experts with relationship mapping"
            >
              <template #extra-content>
                <div class="text-sm text-slate-600 mt-2">
                  <strong>Why now:</strong> Essential for organizing people across complex cases
                </div>
              </template>
            </FeatureCard>
          </div>
        </div>

        <!-- Phase 3: EDRM Completeness -->
        <div class="mb-8 border-l-4 border-blue-500 pl-6">
          <div class="flex items-center gap-3 mb-3">
            <div
              class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg"
            >
              3
            </div>
            <h3 class="text-2xl font-bold text-blue-900">
              Phase 3: EDRM Completeness (Months 7-9)
            </h3>
          </div>
          <p class="text-slate-700 mb-4 italic">
            Priority: Build out early EDRM stages for enterprise e-discovery workflows
          </p>

          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="🕵️"
              title="Identify Stage"
              badge="EDRM Stage 1"
              color="blue"
              description="Custodian management, data source mapping, preservation questionnaires"
            />
            <FeatureCard
              icon="🔐"
              title="Enhanced Preserve"
              badge="EDRM Stage 2"
              color="blue"
              description="Legal hold management, preservation tracking, compliance reporting"
            />
            <FeatureCard
              icon="📦"
              title="Enhanced Collect"
              badge="EDRM Stage 3"
              color="blue"
              description="Advanced collection methods, metadata preservation, chain of custody"
            />
            <FeatureCard
              icon="⚙️"
              title="Enhanced Process"
              badge="EDRM Stage 4"
              color="blue"
              description="Advanced processing, OCR, metadata extraction, file conversion"
            />
          </div>
        </div>

        <!-- Phase 4: Advanced Analytics -->
        <div class="mb-8 border-l-4 border-emerald-500 pl-6">
          <div class="flex items-center gap-3 mb-3">
            <div
              class="bg-emerald-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg"
            >
              4
            </div>
            <h3 class="text-2xl font-bold text-emerald-900">
              Phase 4: Advanced Analytics & Presentation (Months 10-12)
            </h3>
          </div>
          <p class="text-slate-700 mb-4 italic">
            Priority: Add AI-powered analysis, visualization, and trial presentation tools
          </p>

          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="🔍"
              title="Analysis Stage"
              badge="EDRM Stage 6"
              color="purple"
              description="AI concept clustering, relationship mapping, timeline analysis, anomaly detection"
            />
            <FeatureCard
              icon="📊"
              title="Present Stage"
              badge="EDRM Stage 8"
              color="indigo"
              description="Trial presentation, exhibit management, courtroom display tools"
            />
            <FeatureCard
              icon="📝"
              title="Pleadings Generator"
              badge="Document Automation"
              color="blue"
              description="AI-assisted pleading generation from facts, law, and theory"
            />
            <FeatureCard
              icon="🎯"
              title="Advanced Produce"
              badge="EDRM Stage 7"
              color="emerald"
              description="Multi-format exports, Bates stamping, redaction, load files"
            />
          </div>
        </div>

        <!-- Phase 5: Enterprise Features -->
        <div class="mb-8 border-l-4 border-slate-500 pl-6">
          <div class="flex items-center gap-3 mb-3">
            <div
              class="bg-slate-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg"
            >
              5
            </div>
            <h3 class="text-2xl font-bold text-slate-900">
              Phase 5: Enterprise & Collaboration (Months 13+)
            </h3>
          </div>
          <p class="text-slate-700 mb-4 italic">
            Priority: Multi-user collaboration, advanced integrations, enterprise features
          </p>

          <div class="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon="👥"
              title="Team Collaboration"
              badge="Enterprise"
              description="Multi-user access, role-based permissions, activity tracking"
            />
            <FeatureCard
              icon="🔌"
              title="Third-Party Integrations"
              badge="Ecosystem"
              description="Practice management, accounting, court filing system integrations"
            />
            <FeatureCard
              icon="📱"
              title="Mobile Apps"
              badge="Accessibility"
              description="iOS and Android apps for document review and case access"
            />
            <FeatureCard
              icon="🤖"
              title="Advanced AI Features"
              badge="Competitive Edge"
              description="Predictive coding, outcome prediction, advanced NLP"
            />
          </div>
        </div>
      </div>

      <!-- Current Status Summary -->
      <div class="bg-slate-100 rounded-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-4">📊 Current Implementation Status</h2>
        <div class="grid gap-4 md:grid-cols-3">
          <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div class="text-3xl font-bold text-green-700 mb-1">~75%</div>
            <div class="text-sm font-medium text-green-900">MVP Complete</div>
            <div class="text-xs text-green-700 mt-2">
              Upload, AI Analysis, and Review are working. Only List Generator needed for MVP.
            </div>
          </div>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <div class="text-3xl font-bold text-amber-700 mb-1">~15%</div>
            <div class="text-sm font-medium text-amber-900">Phase 2 Started</div>
            <div class="text-xs text-amber-700 mt-2">
              Some Facts and Cast implementation, but not production-ready.
            </div>
          </div>
          <div class="bg-slate-200 border-l-4 border-slate-500 p-4 rounded">
            <div class="text-3xl font-bold text-slate-700 mb-1">0%</div>
            <div class="text-sm font-medium text-slate-900">Phases 3-5</div>
            <div class="text-xs text-slate-700 mt-2">
              All other features are in planning stage with stub pages only.
            </div>
          </div>
        </div>
      </div>

      <!-- Decision Framework -->
      <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-purple-900 mb-4">🎯 Development Decision Framework</h2>
        <p class="text-slate-700 mb-4">Use these principles to prioritize feature development:</p>
        <div class="space-y-3">
          <div class="flex gap-3">
            <div class="text-2xl">1️⃣</div>
            <div>
              <strong class="text-purple-900">Does it complete the MVP?</strong>
              <span class="text-slate-700"
                >→ List Generator is the ONLY priority until MVP is done</span
              >
            </div>
          </div>
          <div class="flex gap-3">
            <div class="text-2xl">2️⃣</div>
            <div>
              <strong class="text-purple-900">Does it enhance document value?</strong>
              <span class="text-slate-700"
                >→ Features that make documents more useful (Facts, Theory, Law) come next</span
              >
            </div>
          </div>
          <div class="flex gap-3">
            <div class="text-2xl">3️⃣</div>
            <div>
              <strong class="text-purple-900">Does it unlock new markets?</strong>
              <span class="text-slate-700"
                >→ EDRM stages enable enterprise sales to larger firms and corporations</span
              >
            </div>
          </div>
          <div class="flex gap-3">
            <div class="text-2xl">4️⃣</div>
            <div>
              <strong class="text-purple-900">Does it improve retention?</strong>
              <span class="text-slate-700"
                >→ Collaboration and integration features reduce churn</span
              >
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #competitive-advantage>
      <CompetitiveAdvantageGrid
        color="indigo"
        description="ListBot.ca's phased development approach delivers value early while building toward comprehensive platform:"
        :advantages="competitiveAdvantages"
      />
    </template>

    <template #footer>
      <div class="mt-12 pt-8 border-t border-slate-200">
        <div class="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded">
          <h3 class="text-xl font-bold text-indigo-900 mb-2">🚀 Next Immediate Action</h3>
          <p class="text-indigo-900 mb-4">
            <strong>Complete the List Generator (Produce) feature</strong> to finish the MVP. This
            is the single most important development task right now.
          </p>
          <p class="text-indigo-800 text-sm">
            Once the List Generator is complete, ListBot.ca will have a working MVP that solves a
            real pain point for lawyers. Then we can gather user feedback before building Phase 2
            features.
          </p>
        </div>
      </div>
      <StubFooter
        message="This development plan ensures ListBot.ca delivers value early (MVP) while building a path to comprehensive case management and e-discovery platform."
        back-button-text="Back to Dev Tools"
      />
    </template>
  </StubPageLayout>
</template>

<script setup>
import StubPageLayout from '@/components/stubs/StubPageLayout.vue';
import PageHeader from '@/components/stubs/PageHeader.vue';
import KeyImpactBox from '@/components/stubs/KeyImpactBox.vue';
import FeatureCard from '@/components/stubs/FeatureCard.vue';
import CompetitiveAdvantageGrid from '@/components/stubs/CompetitiveAdvantageGrid.vue';
import StubFooter from '@/components/stubs/StubFooter.vue';

const competitiveAdvantages = [
  { label: 'Fast MVP delivery', text: 'provides immediate value with document list generation' },
  { label: 'Phased expansion', text: 'adds features systematically without overwhelming users' },
  { label: 'AI-first approach', text: 'automates tedious work at every stage' },
  { label: 'EDRM completeness', text: 'enables enterprise sales to larger organizations' },
];
</script>

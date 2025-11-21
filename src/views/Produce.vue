<template>
  <div class="produce-workflow-page max-w-6xl mx-auto p-8">
    <!-- Header -->
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
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="flex items-start gap-3 mb-3">
          <div class="text-2xl">✅</div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900">Create List Feature</h3>
            <p class="text-sm text-emerald-600 font-medium">Currently Implemented</p>
          </div>
        </div>
        <p class="text-slate-600 mb-3">
          The Create List feature enables production set creation, allowing you to organize and
          prepare documents for delivery to opposing parties.
        </p>
        <div class="text-sm text-slate-500">
          <span class="font-medium">Benefit:</span> Foundational capability for organizing
          responsive documents into production sets
        </div>
      </div>
    </div>

    <!-- Planned Features Section -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-6">Planned Features</h2>

      <!-- High Priority Features -->
      <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-3">🚀</span>
          <h3 class="text-xl font-semibold text-slate-900">Phase 1: Essential Production Tools</h3>
        </div>

        <div class="space-y-4">
          <!-- Bates Numbering -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">🔢</span>
              Flexible Bates Numbering
            </h4>
            <p class="text-slate-700 mb-2">
              Customizable Bates stamping with support for multiple formatting options and
              placement control.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Customizable prefixes (e.g., "ABC-001234" or "PROD_00001")</li>
              <li>Configurable starting numbers and digit formatting</li>
              <li>Control stamp placement on documents (top, bottom, corner)</li>
              <li>Support for color and font customization</li>
            </ul>
          </div>

          <!-- Production Formats -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📄</span>
              Multiple Production Formats
            </h4>
            <p class="text-slate-700 mb-2">
              Support for industry-standard production formats to meet various opposing counsel
              requirements.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Native files with load files (DAT/CSV format)</li>
              <li>Image productions (TIFF/PDF) with metadata</li>
              <li>Searchable PDFs with embedded Bates stamps</li>
              <li>Configurable metadata field inclusion</li>
            </ul>
          </div>

          <!-- Quality Control -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">✓</span>
              Production Quality Control
            </h4>
            <p class="text-slate-700 mb-2">
              Automated checks to ensure production completeness and compliance before delivery.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Required coding completion verification</li>
              <li>Privilege designation checks</li>
              <li>Metadata validation (no missing critical fields)</li>
              <li>Missing document detection and reporting</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Phase 2 Features -->
      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6">
        <div class="flex items-center mb-4">
          <span class="text-2xl mr-3">⚡</span>
          <h3 class="text-xl font-semibold text-slate-900">
            Phase 2: Advanced Production Management
          </h3>
        </div>

        <div class="space-y-4">
          <!-- Privilege Log Generation -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">🔒</span>
              Automated Privilege Log Generation
            </h4>
            <p class="text-slate-700 mb-2">
              Auto-populate privilege logs from metadata captured during review, saving hours of
              manual work.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Automatic population from review metadata (attorney names, dates, types)</li>
              <li>Support for work product and attorney-client privilege designations</li>
              <li>On-the-fly editing and manual entry for edge cases</li>
              <li>Export to Excel/PDF formats</li>
            </ul>
          </div>

          <!-- Production Tracking -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📋</span>
              Rolling Production Management
            </h4>
            <p class="text-slate-700 mb-2">
              Track multiple productions over time with version control to prevent duplicates and
              conflicts.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Track what was produced when (date, recipient, document count)</li>
              <li>Production version control preventing duplicate delivery</li>
              <li>Modification capabilities for clawback scenarios</li>
              <li>Comparison tools to identify differences between production sets</li>
            </ul>
          </div>

          <!-- Secure Delivery -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">🔐</span>
              Secure Delivery Mechanisms
            </h4>
            <p class="text-slate-700 mb-2">
              Multiple secure delivery options with access logging to ensure confidential
              materials remain protected.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Secure FTP upload capabilities</li>
              <li>Dedicated cloud portals with access logging</li>
              <li>Encrypted file transfer options</li>
              <li>Download confirmation and recipient tracking</li>
            </ul>
          </div>

          <!-- Production Profiles -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">⚙️</span>
              Production Profiles & Templates
            </h4>
            <p class="text-slate-700 mb-2">
              Save preferred production settings for reuse across matters and consistent
              formatting.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Saved production format preferences (Bates style, metadata fields)</li>
              <li>Matter-type specific templates</li>
              <li>Client-specific production standards</li>
              <li>Quick-apply profiles for efficient production setup</li>
            </ul>
          </div>

          <!-- Automated Reports -->
          <div class="bg-white rounded-lg p-4">
            <h4 class="text-lg font-semibold text-slate-900 mb-2 flex items-center">
              <span class="mr-2">📊</span>
              Production Reports & Documentation
            </h4>
            <p class="text-slate-700 mb-2">
              Comprehensive reporting documenting exactly what was produced for defensibility and
              court filings.
            </p>
            <ul class="list-disc list-inside text-slate-600 space-y-1 ml-4">
              <li>Detailed production reports (document counts, date ranges, custodians)</li>
              <li>Privilege withholding summaries</li>
              <li>Production certification letters</li>
              <li>Audit trail documentation for court submission</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Production Workflow Overview -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Production Workflow</h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="space-y-4">
          <!-- Step 1 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              1
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Review ESI Protocol</h4>
              <p class="text-slate-600">
                Confirm production format requirements from Rule 26(f) conference agreements.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center"
            >
              2
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">
                Create Production Set <span class="text-sm text-emerald-600">(Implemented)</span>
              </h4>
              <p class="text-slate-600">
                Use the Create List feature to organize responsive, non-privileged documents into
                a production set.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              3
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Quality Control Review</h4>
              <p class="text-slate-600">
                Run automated checks for completion, privilege verification, and metadata
                validation (planned).
              </p>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              4
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Apply Bates Numbering</h4>
              <p class="text-slate-600">
                Configure and apply Bates stamps with customizable prefixes, formatting, and
                placement (planned).
              </p>
            </div>
          </div>

          <!-- Step 5 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              5
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Generate Privilege Log</h4>
              <p class="text-slate-600">
                Auto-populate privilege log from review metadata for withheld documents (planned).
              </p>
            </div>
          </div>

          <!-- Step 6 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              6
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Export & Package</h4>
              <p class="text-slate-600">
                Generate production in required format (native, TIFF, searchable PDF) with load
                files (planned).
              </p>
            </div>
          </div>

          <!-- Step 7 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              7
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Secure Delivery</h4>
              <p class="text-slate-600">
                Transmit production via secure methods (FTP, encrypted portal, encrypted file
                transfer) with confirmation tracking (planned).
              </p>
            </div>
          </div>

          <!-- Step 8 -->
          <div class="flex gap-4">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center"
            >
              8
            </div>
            <div>
              <h4 class="font-semibold text-slate-900 mb-1">Document & Track</h4>
              <p class="text-slate-600">
                Generate production reports and maintain audit trail for defensibility (planned).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Benefits Section -->
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
              production processes for court scrutiny.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">⚡</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Efficiency</h3>
            <p class="text-slate-600">
              Production profiles and automated privilege logs dramatically reduce manual work and
              accelerate delivery timelines.
            </p>
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-2xl mr-3">🔒</span>
          <div>
            <h3 class="font-semibold text-slate-900 mb-1">Security & Control</h3>
            <p class="text-slate-600">
              Secure delivery mechanisms with access logging and version control prevent
              unauthorized access and delivery errors.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- EDRM Workflow Integration -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">EDRM Workflow Integration</h2>
      <p class="text-slate-700 mb-4">
        The Produce stage transforms reviewed and analyzed documents into formal, court-compliant
        deliverables. Information flows seamlessly from earlier EDRM stages:
      </p>
      <div class="space-y-3">
        <div class="flex items-center">
          <span class="text-xl mr-3">🧑‍💻</span>
          <span class="font-semibold text-slate-900 mr-2">Review</span>
          <span class="text-slate-600">→ Responsive and privilege designations inform production sets</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🧠</span>
          <span class="font-semibold text-slate-900 mr-2">Analyze</span>
          <span class="text-slate-600">→ Document relationships and patterns guide organization</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">📃</span>
          <span class="font-semibold text-slate-900 mr-2">Produce</span>
          <span class="text-slate-600">→ Formatted deliverables with Bates numbering and metadata</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🏛️</span>
          <span class="font-semibold text-slate-900 mr-2">Present</span>
          <span class="text-slate-600">→ Bates-numbered exhibits ready for trial presentation</span>
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

    <!-- Cross-Workflow Enhancements -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Cross-Workflow Enhancements</h2>
      <p class="text-slate-700 mb-4">
        The Produce stage integrates with other EDRM stages for a seamless production experience:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Production profiles</span> save preferred Bates styles and
            metadata selections for reuse
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Automated reports</span> document production details for
            court submission and records
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Production comparison</span> tools identify differences
            between sets to prevent duplicates
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Clawback tracking</span> flags previously clawed-back
            documents to prevent re-production
          </div>
        </div>
      </div>
    </div>

    <!-- Implementation Timeline -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Implementation Timeline</h2>
      <div class="space-y-4">
        <!-- Phase 1 -->
        <div class="border-l-4 border-emerald-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Essential Production Tools</h3>
            <span class="text-sm text-slate-600">(1-2 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Flexible Bates numbering with customizable prefixes and formatting</li>
            <li>Multiple production formats (native, TIFF, searchable PDF)</li>
            <li>Quality control workflows with automated validation checks</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-purple-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">
              Phase 2: Advanced Production Management
            </h3>
            <span class="text-sm text-slate-600">(3-6 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Automated privilege log generation from review metadata</li>
            <li>Rolling production tracking with version control</li>
            <li>Secure delivery mechanisms (FTP, cloud portal, encrypted transfer)</li>
            <li>Production profiles and templates for workflow efficiency</li>
            <li>Comprehensive production reports and documentation</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Coming Soon Banner -->
    <div
      class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center"
    >
      <h2 class="text-3xl font-bold mb-4">Enhanced Production Features Coming Soon</h2>
      <p class="text-xl mb-2">
        The Produce stage is being enhanced with advanced features to deliver enterprise-level
        production capabilities with exceptional ease of use.
      </p>
      <p class="text-lg opacity-90">
        The foundational Create List feature is available now. Advanced production tools including
        Bates numbering, privilege logs, and secure delivery are under active development.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
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

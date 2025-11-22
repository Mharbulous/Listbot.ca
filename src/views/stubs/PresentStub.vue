<template>
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="mb-8">
      <div
        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-4"
      >
        EDRM Stage 8: Presentation
      </div>
      <h1 class="text-4xl font-bold text-slate-900 mb-4">Present Workflow</h1>
      <p class="text-xl text-slate-600 max-w-4xl">
        The Presentation stage transforms organized evidence into compelling visual narratives for
        depositions, hearings, mediation, and trials—displaying evidence persuasively during legal
        proceedings.
      </p>
    </div>

    <!-- Key Impact Metric -->
    <div
      class="bg-gradient-to-r from-indigo-50 to-violet-50 border-l-4 border-indigo-500 p-6 mb-8 rounded-lg"
    >
      <div class="flex items-start gap-4">
        <div class="text-3xl">🎯</div>
        <div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">Trial-Focused Differentiator</h3>
          <p class="text-slate-700">
            Presentation capabilities distinguish ListBot.ca as a
            <span class="font-bold text-indigo-700">complete litigation platform</span>, not just a
            review tool. Trial-focused boutique firms particularly value integrated presentation
            features that eliminate the need for separate trial software.
          </p>
        </div>
      </div>
    </div>

    <!-- Current Implementation Status -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Current Implementation</h2>
      <div class="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="text-2xl">🚧</div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Under Development</h3>
            <p class="text-slate-700">
              The Presentation stage is planned as a valuable feature differentiator, especially for
              trial-focused boutique firms. Implementation follows a phased roadmap building from
              basic exhibit management to advanced AI-powered presentation tools.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Planned Features -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Planned Features</h2>

      <!-- Phase 1: Quick Wins -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800"
          >
            PHASE 1
          </span>
          Quick Wins (1-2 months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Exhibit Manager -->
          <div class="bg-white border-2 border-emerald-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📋</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Basic Exhibit Manager</h4>
                <p class="text-sm text-emerald-600 font-medium">Foundation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Systematic organization and tracking of trial exhibits with automated numbering and
              status management.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Features:</span> Assign exhibit numbers</div>
              <div><span class="font-medium">Tracking:</span> Marked/admitted/rejected status</div>
              <div><span class="font-medium">Export:</span> Generate exhibit lists (Excel/CSV)</div>
              <div><span class="font-medium">Stamping:</span> Apply Bates numbers with jsPDF</div>
            </div>
          </div>

          <!-- Document Bundling -->
          <div class="bg-white border border-emerald-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📚</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Document Bundling</h4>
                <p class="text-sm text-emerald-600 font-medium">Organization Tool</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Create organized document collections by witness or issue with automatic table of
              contents generation.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Creation:</span> Named bundles with drag-drop</div>
              <div><span class="font-medium">Organization:</span> Document reordering</div>
              <div><span class="font-medium">Output:</span> Auto-generate TOC</div>
              <div><span class="font-medium">Merge:</span> PDF combining with PDF-lib</div>
            </div>
          </div>

          <!-- Annotation Tools -->
          <div class="bg-white border border-emerald-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">✏️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Basic Annotation Tools</h4>
                <p class="text-sm text-emerald-600 font-medium">Quick Win</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Highlight key passages and add notes to documents without modifying original files.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Highlighting:</span> Text highlighting overlay</div>
              <div><span class="font-medium">Notes:</span> Sticky notes and comments</div>
              <div><span class="font-medium">Shapes:</span> Drawing tools (arrows, callouts)</div>
              <div>
                <span class="font-medium">Storage:</span> Non-destructive with Fabricjs/Konva.js
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2: Presentation Features -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            PHASE 2
          </span>
          Presentation Features (3-6 months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- Presentation Mode -->
          <div class="bg-white border-2 border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🖥️</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Presentation Mode</h4>
                <p class="text-sm text-indigo-600 font-medium">Courtroom Essential</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Full-screen document display optimized for courtroom presentation with smooth
              navigation and live annotation capabilities.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Display:</span> Full-screen document viewer</div>
              <div><span class="font-medium">Navigation:</span> Exhibit list with keyboard shortcuts</div>
              <div><span class="font-medium">Controls:</span> Zoom and pan tools</div>
              <div><span class="font-medium">Live:</span> Real-time annotation during presentation</div>
              <div><span class="font-medium">Compare:</span> Side-by-side document comparison</div>
            </div>
          </div>

          <!-- Timeline Presentation -->
          <div class="bg-white border border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">📊</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Timeline Presentation Builder</h4>
                <p class="text-sm text-indigo-600 font-medium">Strategic Tool</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Create compelling visual chronologies with attached supporting documents for opening
              statements and closing arguments.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Events:</span> Custom event creation with docs</div>
              <div><span class="font-medium">Styling:</span> Customizable visual themes</div>
              <div><span class="font-medium">Export:</span> PDF and HTML formats</div>
              <div><span class="font-medium">Animations:</span> Presentation-ready transitions</div>
            </div>
          </div>

          <!-- Deposition Integration -->
          <div class="bg-white border border-indigo-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🎥</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Deposition/Transcript Integration</h4>
                <p class="text-sm text-indigo-600 font-medium">Time Saver</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Sync video depositions with searchable transcripts, enabling instant navigation to
              specific testimony moments.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Video:</span> Video.js player integration</div>
              <div><span class="font-medium">Sync:</span> Transcript-to-video linking</div>
              <div><span class="font-medium">Navigation:</span> Click timestamp to jump to video</div>
              <div><span class="font-medium">Search:</span> Full-text transcript search</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 3: Advanced Features -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-100 text-violet-800"
          >
            PHASE 3
          </span>
          AI-Powered Tools (6+ months)
        </h3>
        <div class="grid gap-4 md:grid-cols-2">
          <!-- AI Presentation Tools -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">🤖</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">AI-Powered Presentation Tools</h4>
                <p class="text-sm text-slate-600 font-medium">Innovation Feature</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              Gemini AI identifies key passages, suggests document groupings, and auto-generates
              presentation slides with key quotes.
            </p>
            <div class="text-sm text-slate-500 space-y-1">
              <div><span class="font-medium">Detection:</span> Identify critical passages</div>
              <div><span class="font-medium">Suggestions:</span> Document grouping recommendations</div>
              <div><span class="font-medium">Generation:</span> Auto-create presentation slides</div>
            </div>
          </div>

          <!-- Smart Callouts -->
          <div class="bg-white border border-slate-200 rounded-lg p-6">
            <div class="flex items-start gap-3 mb-3">
              <div class="text-2xl">💡</div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">Smart Document Callouts</h4>
                <p class="text-sm text-slate-600 font-medium">Jury Communication</p>
              </div>
            </div>
            <p class="text-slate-600 mb-3">
              AI automatically highlights the most important text in lengthy documents for quick
              jury comprehension.
            </p>
            <div class="text-sm text-slate-500">
              <span class="font-medium">Benefit:</span> Direct jury attention to key evidence without
              manual highlighting
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- What Lawyers Expect -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">
        What Lawyers Expect from Presentation Tools
      </h2>
      <div class="bg-white border border-slate-200 rounded-lg p-6">
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Exhibit Management -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">📋</div>
              <div>
                <h3 class="font-semibold text-slate-900">Exhibit Management Systems</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Automated exhibit numbering, Bates stamp integration, organization by witness/issue,
              and status tracking (marked, admitted, rejected, not used).
            </p>
          </div>

          <!-- Document Binders -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">📚</div>
              <div>
                <h3 class="font-semibold text-slate-900">Document Binders</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Witness-specific organization, automatic table of contents generation, and easy
              navigation structure for trial preparation.
            </p>
          </div>

          <!-- Full-Screen Display -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🖥️</div>
              <div>
                <h3 class="font-semibold text-slate-900">Trial Presentation</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Full-screen document display, smooth navigation through exhibit lists, zoom and pan
              controls, and keyboard shortcuts for efficient courtroom use.
            </p>
          </div>

          <!-- Live Annotation -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">✏️</div>
              <div>
                <h3 class="font-semibold text-slate-900">Live Annotation</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Real-time highlighting, arrows, callouts during presentation with dual-screen support
              showing presenter controls on one screen and clean exhibit display on the audience
              screen.
            </p>
          </div>

          <!-- Timeline Presentations -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">📊</div>
              <div>
                <h3 class="font-semibold text-slate-900">Timeline Presentations</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Chronological event displays with supporting document attachments and customizable
              styling—highly valued for opening statements and closing arguments.
            </p>
          </div>

          <!-- Deposition Sync -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <div class="text-xl">🎥</div>
              <div>
                <h3 class="font-semibold text-slate-900">Deposition/Transcript Integration</h3>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Sync video depositions with searchable transcripts (click timestamp to jump to video
              moment)—saves significant trial prep time.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Benefits -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Key Benefits</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">⚖️</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Courtroom Confidence</h3>
              <p class="text-slate-600">
                Professional presentation tools inspire confidence in courtrooms with smooth
                navigation, live annotation, and reliable performance under pressure.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">💰</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Cost Savings</h3>
              <p class="text-slate-600">
                Eliminate separate trial presentation software ($99-$800 desktop versions, ongoing
                cloud subscriptions) with integrated presentation capabilities.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">⚡</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Streamlined Workflow</h3>
              <p class="text-slate-600">
                Seamlessly transition from review and analysis to trial presentation without
                exporting to separate tools or managing multiple platforms.
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-2xl">🌐</div>
            <div>
              <h3 class="font-semibold text-slate-900 mb-1">Cloud-Based Flexibility</h3>
              <p class="text-slate-600">
                Present from any device without installation, supporting remote proceedings
                increasingly common in modern litigation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EDRM Workflow Integration -->
    <div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">EDRM Workflow Integration</h2>
      <p class="text-slate-700 mb-4">
        The Presentation stage is the culmination of the entire e-discovery process, transforming
        reviewed and analyzed evidence into persuasive courtroom narratives:
      </p>
      <div class="space-y-3">
        <div class="flex items-center">
          <span class="text-xl mr-3">👁️</span>
          <span class="font-semibold text-slate-900 mr-2">Review</span>
          <span class="text-slate-600">→ Coded documents ready for exhibit designation</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🔍</span>
          <span class="font-semibold text-slate-900 mr-2">Analyze</span>
          <span class="text-slate-600">→ Timelines and visualizations prepared for trial</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">📋</span>
          <span class="font-semibold text-slate-900 mr-2">Produce</span>
          <span class="text-slate-600">→ Production sets with Bates numbers applied</span>
        </div>
        <div class="flex items-center">
          <span class="text-xl mr-3">🎯</span>
          <span class="font-semibold text-slate-900 mr-2">Present</span>
          <span class="text-slate-600">→ Compelling presentation ready for courtroom</span>
        </div>
      </div>
    </div>

    <!-- Technical Foundation -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Technical Foundation</h2>
      <p class="text-slate-700 mb-4">
        The Presentation stage will leverage ListBot.ca's modern technology stack for optimal
        courtroom performance:
      </p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Vue 3 + PDF Libraries</h3>
          <p class="text-slate-600 text-sm">
            Responsive full-screen viewer with jsPDF and PDF-lib for stamping and merging
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Fabricjs / Konva.js</h3>
          <p class="text-slate-600 text-sm">
            Non-destructive annotation overlays with real-time drawing capabilities
          </p>
        </div>
        <div class="bg-slate-50 rounded p-4">
          <h3 class="font-semibold text-slate-900 mb-2">Gemini AI (Phase 3)</h3>
          <p class="text-slate-600 text-sm">
            AI-powered key passage identification and smart document callouts
          </p>
        </div>
      </div>
    </div>

    <!-- Competitive Context -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 class="text-2xl font-semibold text-slate-900 mb-4">Competitive Context</h2>
      <p class="text-slate-700 mb-4">
        Leading trial presentation software ranges from $99-$800 for desktop versions
        (TrialDirector, OnCue, Sanction), but cloud-based presentation tools are increasingly
        preferred:
      </p>
      <div class="grid gap-3 md:grid-cols-2 mb-4">
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Everlaw Storybuilder</span> - Included free, narrative-building
            with timelines
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-blue-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Nextpoint Theater Mode</span> - Integrated presentation without
            separate software
          </div>
        </div>
      </div>
      <p class="text-sm text-slate-600">
        <span class="font-medium">ListBot.ca Advantage:</span> Cloud-based presentation tools enable
        presenting from any device without installation, supporting remote proceedings common in
        modern litigation while eliminating separate software costs.
      </p>
    </div>

    <!-- Implementation Timeline -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-4">Implementation Timeline</h2>
      <div class="space-y-4">
        <!-- Phase 1 -->
        <div class="border-l-4 border-emerald-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 1: Quick Wins</h3>
            <span class="text-sm text-slate-600">(1-2 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Basic Exhibit Manager with numbering and status tracking</li>
            <li>Document Bundling with drag-drop and TOC generation</li>
            <li>Basic Annotation Tools with highlighting and notes</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div class="border-l-4 border-indigo-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 2: Presentation Features</h3>
            <span class="text-sm text-slate-600">(3-6 months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>Presentation Mode with full-screen viewer and live annotation</li>
            <li>Timeline Presentation Builder with custom events and animations</li>
            <li>Deposition/Transcript Integration with video sync</li>
          </ul>
        </div>

        <!-- Phase 3 -->
        <div class="border-l-4 border-violet-500 pl-6 py-2">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-lg font-semibold text-slate-900">Phase 3: AI-Powered Tools</h3>
            <span class="text-sm text-slate-600">(6+ months)</span>
          </div>
          <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
            <li>AI-Powered Presentation Tools with Gemini key passage identification</li>
            <li>Smart Document Callouts for jury communication</li>
            <li>Automated slide generation with key quotes</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Competitive Positioning -->
    <div
      class="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-lg p-6 mb-8"
    >
      <h2 class="text-xl font-bold text-slate-900 mb-3">Competitive Positioning</h2>
      <p class="text-slate-700 mb-4">
        Presentation features will position ListBot.ca as a complete litigation platform for
        trial-focused firms:
      </p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Integrated workflow</span> - Review to presentation without
            separate tools
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Cloud-based flexibility</span> - Present from any device
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">AI enhancements</span> - Smart callouts and key passage
            detection
          </div>
        </div>
        <div class="flex items-start gap-2">
          <div class="text-indigo-600 mt-1">✓</div>
          <div class="text-slate-700">
            <span class="font-medium">Cost savings</span> - Eliminate separate trial software expenses
          </div>
        </div>
      </div>
    </div>

    <!-- Coming Soon Banner -->
    <div
      class="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg shadow-lg p-8 text-white text-center"
    >
      <h2 class="text-3xl font-bold mb-4">Coming Soon</h2>
      <p class="text-xl mb-2">
        The Presentation stage will transform ListBot.ca into a complete litigation platform,
        serving trial-focused firms from review through courtroom presentation.
      </p>
      <p class="text-lg opacity-90">
        Development follows a phased roadmap building from basic exhibit management to advanced
        AI-powered presentation tools.
      </p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style scoped>
/* Fade-in animation */
div {
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

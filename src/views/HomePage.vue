<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="max-w-6xl w-full">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Left Column: Mascot -->
        <div class="flex justify-center lg:justify-end">
          <div class="relative">
            <img
              src="@/assets/mascot/CuteDroid.webp"
              alt="ListBot Mascot"
              class="w-full max-w-md rounded-2xl shadow-2xl"
            />
          </div>
        </div>

        <!-- Right Column: Welcome Content -->
        <div class="flex flex-col justify-center space-y-6">
          <div>
            <h1 class="text-5xl font-bold text-slate-900 mb-4">
              Welcome to <span class="text-indigo-600">ListBot</span>
            </h1>
            <p class="text-xl text-slate-600 leading-relaxed">
              Your intelligent document management assistant for the entire EDRM workflow.
            </p>
          </div>

          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span class="text-indigo-600 text-lg">📁</span>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">Collect & Organize</h3>
                <p class="text-slate-600">Upload and manage your documents with intelligent deduplication</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span class="text-indigo-600 text-lg">🔍</span>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">Process & Review</h3>
                <p class="text-slate-600">Analyze documents with AI-powered categorization and insights</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span class="text-indigo-600 text-lg">📋</span>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900">Produce & Export</h3>
                <p class="text-slate-600">Generate privilege logs and export production-ready documents</p>
              </div>
            </div>
          </div>

          <div class="pt-4">
            <router-link
              to="/matters"
              class="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started
              <span class="text-xl">→</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Bottom Section: Quick Stats or Additional Info -->
      <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div class="text-3xl font-bold text-indigo-600 mb-2">Smart</div>
          <p class="text-slate-600">AI-powered document analysis and categorization</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div class="text-3xl font-bold text-indigo-600 mb-2">Secure</div>
          <p class="text-slate-600">Firm-scoped data with robust authentication</p>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div class="text-3xl font-bold text-indigo-600 mb-2">Efficient</div>
          <p class="text-slate-600">Automatic deduplication and hash-based storage</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'HomePage',
});
</script>

<style scoped>
/* HomePage component styles */
</style>

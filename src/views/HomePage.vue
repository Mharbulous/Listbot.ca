<template>
  <div class="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 to-indigo-50">
    <div class="max-w-7xl w-full">
      <!-- Hero Section: Text-Left / Visual-Right -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
        <!-- Left Column: Hero Content (Text First) -->
        <div class="flex flex-col justify-center space-y-8 lg:pr-8">
          <div class="space-y-6">
            <h1 class="text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Meet <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">ListBot</span>
            </h1>
            <p class="text-2xl text-slate-700 leading-relaxed font-light">
              Your intelligent assistant for the entire <span class="font-semibold text-slate-900">EDRM workflow</span>
            </p>
            <p class="text-lg text-slate-600 leading-relaxed max-w-xl">
              From document collection to production, ListBot streamlines legal document management with AI-powered insights and automated workflows.
            </p>
          </div>

          <div class="pt-2">
            <router-link
              to="/matters"
              class="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xl font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform"
            >
              Get Started
              <span class="text-2xl">→</span>
            </router-link>
          </div>
        </div>

        <!-- Right Column: Mascot Visual -->
        <div class="flex justify-center lg:justify-start order-first lg:order-none">
          <div class="relative mascot-container">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-3xl blur-2xl opacity-20 transform scale-95"></div>
            <img
              src="@/assets/mascot/CuteDroid.webp"
              alt="ListBot Mascot"
              class="relative w-full max-w-lg rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      <!-- Key Features Grid -->
      <div class="space-y-8">
        <div class="text-center space-y-3">
          <h2 class="text-4xl font-bold text-slate-900">Powerful Features</h2>
          <p class="text-xl text-slate-600 max-w-2xl mx-auto">Built for legal professionals who demand precision, security, and efficiency</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature Card 1 -->
          <div class="group bg-white rounded-2xl shadow-md hover:shadow-2xl border border-slate-200 p-8 transition-all duration-300 hover:-translate-y-2">
            <div class="flex flex-col items-center text-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">📁</span>
              </div>
              <h3 class="text-2xl font-bold text-slate-900">Collect & Organize</h3>
              <p class="text-slate-600 leading-relaxed">
                Upload and manage documents with intelligent hash-based deduplication that eliminates redundancy automatically
              </p>
            </div>
          </div>

          <!-- Feature Card 2 -->
          <div class="group bg-white rounded-2xl shadow-md hover:shadow-2xl border border-slate-200 p-8 transition-all duration-300 hover:-translate-y-2">
            <div class="flex flex-col items-center text-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">🔍</span>
              </div>
              <h3 class="text-2xl font-bold text-slate-900">Process & Review</h3>
              <p class="text-slate-600 leading-relaxed">
                Analyze documents with AI-powered categorization, automated tagging, and intelligent insights for faster review
              </p>
            </div>
          </div>

          <!-- Feature Card 3 -->
          <div class="group bg-white rounded-2xl shadow-md hover:shadow-2xl border border-slate-200 p-8 transition-all duration-300 hover:-translate-y-2">
            <div class="flex flex-col items-center text-center space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">📋</span>
              </div>
              <h3 class="text-2xl font-bold text-slate-900">Produce & Export</h3>
              <p class="text-slate-600 leading-relaxed">
                Generate privilege logs and export production-ready documents with Bates numbering and metadata control
              </p>
            </div>
          </div>
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

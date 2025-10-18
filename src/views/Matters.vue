<template>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-slate-800 mb-4">Matters</h1>
        <p class="text-xl text-slate-600">
          Manage and organize your legal matters, cases, and client work
        </p>
      </div>

      <!-- Layout Wireframe Mockup -->
      <div class="space-y-6">
        <!-- Active Matters Section -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-semibold text-slate-800">Active Matters</h2>
            <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Coming Soon
            </div>
          </div>
          <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
            <div class="text-slate-400 text-lg mb-2">📋 Matter List</div>
            <p class="text-slate-500 text-sm">
              View and manage all active matters with filtering and search capabilities
            </p>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Matter Details Section -->
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-slate-800">Matter Details</h2>
              <div class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Coming Soon
              </div>
            </div>
            <div class="space-y-3">
              <div class="bg-slate-50 border border-slate-200 rounded p-4">
                <div class="text-slate-400 text-sm mb-1">Client Information</div>
                <p class="text-slate-500 text-xs">Name, contact details, billing info</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded p-4">
                <div class="text-slate-400 text-sm mb-1">Case Details</div>
                <p class="text-slate-500 text-xs">Matter type, status, key dates</p>
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded p-4">
                <div class="text-slate-400 text-sm mb-1">Associated Documents</div>
                <p class="text-slate-500 text-xs">Linked files and correspondence</p>
              </div>
            </div>
          </div>

          <!-- Recent Activity Section -->
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-slate-800">Recent Activity</h2>
              <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Coming Soon
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="i in 5"
                :key="i"
                class="bg-slate-50 border border-slate-200 rounded p-3 flex items-center"
              >
                <div class="w-8 h-8 bg-slate-200 rounded-full mr-3"></div>
                <div class="flex-1">
                  <div class="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div class="h-2 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline & Tasks Section -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-semibold text-slate-800">Timeline & Tasks</h2>
            <div class="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
              Coming Soon
            </div>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <div class="text-slate-400 text-lg mb-2">📅 Calendar View</div>
              <p class="text-slate-500 text-sm">Important dates and deadlines</p>
            </div>
            <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <div class="text-slate-400 text-lg mb-2">✅ Task List</div>
              <p class="text-slate-500 text-sm">Action items and follow-ups</p>
            </div>
            <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <div class="text-slate-400 text-lg mb-2">⏰ Reminders</div>
              <p class="text-slate-500 text-sm">Upcoming deadlines and alerts</p>
            </div>
          </div>
        </div>

        <!-- Analytics & Reporting Section -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-semibold text-slate-800">Analytics & Reporting</h2>
            <div class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              Coming Soon
            </div>
          </div>
          <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-16 text-center">
            <div class="text-slate-400 text-lg mb-2">📊 Dashboard & Metrics</div>
            <p class="text-slate-500 text-sm">
              Matter statistics, time tracking, billing reports, and performance metrics
            </p>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p class="text-blue-800 text-sm">
          💡 <strong>Note:</strong> This page is currently under development. The sections above
          represent planned features for the Matters management system.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'MattersView',
});
</script>

<style scoped>
/* Matters component styles */
</style>

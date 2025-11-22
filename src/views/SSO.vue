<template>
  <div class="p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Welcome Section -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-slate-800 mb-4">Multi-App SSO Template</h1>
        <p class="text-xl text-slate-600 max-w-2xl mx-auto">
          A Vue 3 template with Multi-App Single Sign-On (SSO) capabilities. Create multiple
          independent applications that share seamless authentication and firm contexts.
        </p>
      </div>

      <!-- Setup Instructions with Tabs -->
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 mt-8">
        <!-- Tab Header - Button Style -->
        <div class="bg-slate-100 p-2 rounded-t-lg">
          <div class="flex flex-wrap gap-2">
            <button
              @click="activeTab = 'features'"
              :class="[
                'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer border-2',
                activeTab === 'features'
                  ? 'border-indigo-500 text-indigo-700 bg-white shadow-md'
                  : 'border-slate-300 text-slate-700 bg-white hover:border-indigo-400 hover:shadow-sm',
              ]"
            >
              <span class="flex items-center">
                <span class="mr-2 text-lg">✨</span>
                Features
              </span>
            </button>
            <button
              @click="activeTab = 'first-app'"
              :class="[
                'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer border-2',
                activeTab === 'first-app'
                  ? 'border-blue-500 text-blue-700 bg-white shadow-md'
                  : 'border-slate-300 text-slate-700 bg-white hover:border-blue-400 hover:shadow-sm',
              ]"
            >
              <span class="flex items-center">
                <span class="mr-2 text-lg">🆕</span>
                First SSO App
              </span>
            </button>
            <button
              @click="activeTab = 'add-app'"
              :class="[
                'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer border-2',
                activeTab === 'add-app'
                  ? 'border-green-500 text-green-700 bg-white shadow-md'
                  : 'border-slate-300 text-slate-700 bg-white hover:border-green-400 hover:shadow-sm',
              ]"
            >
              <span class="flex items-center">
                <span class="mr-2 text-lg">➕</span>
                Add to Network
              </span>
            </button>
            <button
              @click="activeTab = 'local-dev'"
              :class="[
                'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer border-2',
                activeTab === 'local-dev'
                  ? 'border-purple-500 text-purple-700 bg-white shadow-md'
                  : 'border-slate-300 text-slate-700 bg-white hover:border-purple-400 hover:shadow-sm',
              ]"
            >
              <span class="flex items-center">
                <span class="mr-2 text-lg">🛠️</span>
                Local Development
              </span>
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="p-8">
          <FeaturesTab v-if="activeTab === 'features'" />
          <FirstAppTab v-if="activeTab === 'first-app'" />
          <AddAppTab v-if="activeTab === 'add-app'" />
          <LocalDevTab v-if="activeTab === 'local-dev'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FeaturesTab from '../shared/components/home/FeaturesTab.vue';
import FirstAppTab from '../shared/components/home/FirstAppTab.vue';
import AddAppTab from '../shared/components/home/AddAppTab.vue';
import LocalDevTab from '../shared/components/home/LocalDevTab.vue';

// Component configuration
defineOptions({
  name: 'AboutUsView',
});

// Tab state management - default to features tab
const activeTab = ref('features');
</script>

<style scoped>
/* AboutUsView component styles */
</style>

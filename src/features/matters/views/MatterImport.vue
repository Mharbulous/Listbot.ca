<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <PageLayout>
      <TitleDrawer title="AI-Powered Matter Import">
        <button
          v-if="selectedPath"
          class="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          @click="resetPath"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Change Import Path
        </button>
      </TitleDrawer>

      <!-- Introduction Section -->
      <div v-if="!selectedPath" class="mx-6 mb-6 relative z-10">
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-6 rounded-lg shadow-sm">
          <div class="flex items-start gap-3 mb-3">
            <div class="text-3xl">🤖</div>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-slate-900 mb-2">AI-Powered Pattern Discovery</h2>
              <p class="text-slate-700 text-sm leading-relaxed">
                Import matters from folder structures or practice management exports using AI to intelligently
                discover patterns and extract data. <span class="font-semibold text-blue-700">Automatically discovers your firm's unique naming patterns</span>
                without custom configuration—import hundreds of matters in minutes, not hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Path Selection -->
      <div v-if="!selectedPath" class="mx-6 mb-6 relative z-10">
        <h2 class="text-xl font-bold text-slate-900 mb-4">Choose Your Import Path</h2>
        <p class="text-sm text-slate-600 mb-4">
          Select the import method that best fits your data source. Both paths use AI to automatically
          discover and extract matter information.
        </p>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Path 1: Folder Structure Import -->
          <div
            class="bg-white border-2 border-slate-200 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all duration-200"
            @click="selectPath('folder')"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="text-4xl">📁</div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">Folder Structure Import</h3>
                <span class="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Path 1: Quick Setup
                </span>
              </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">
              Select your client files root folder. AI scans the hierarchy, discovers your firm's naming
              patterns (client names, matter numbers, dates), and extracts structured data from folder
              names—no manual mapping required.
            </p>
          </div>

          <!-- Path 2: Document Analysis Import -->
          <div
            class="bg-white border-2 border-slate-200 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all duration-200"
            @click="selectPath('document')"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="text-4xl">📄</div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">Document Analysis Import</h3>
                <span class="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Path 2: Detailed Data
                </span>
              </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">
              Upload CSV/Excel/PDF exports from any practice management system. AI discovers the source
              schema, extracts matter data, and can validate/enrich existing matters imported from folders.
            </p>
          </div>
        </div>

        <!-- Pro Tip -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-slate-700">
            <span class="font-semibold text-blue-700">💡 Pro Tip:</span> For best results, combine both
            import paths—start with Folder Structure Import for quick bulk setup, then use Document Analysis
            Import to enrich matters with detailed data from your practice management system.
          </p>
        </div>
      </div>

      <!-- Folder Structure Import Interface -->
      <div v-if="selectedPath === 'folder'" class="mx-6 mb-6 relative z-10">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3 class="text-lg font-bold text-slate-900">Folder Structure Import</h3>
            </div>
          </div>

          <div class="p-6">
            <!-- Step 1: Folder Selection -->
            <div class="mb-6">
              <h4 class="text-base font-semibold text-slate-900 mb-2">Step 1: Select Client Files Folder</h4>
              <p class="text-sm text-slate-600 mb-4">
                Choose the root folder containing your client files. AI will scan the folder structure to
                discover your naming patterns.
              </p>

              <button
                class="w-full px-4 py-3 bg-white border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-slate-600 flex items-center justify-center gap-2"
                @click="mockFolderSelect"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                {{ folderSelected ? 'Client Files (Mock Folder)' : 'Click to Select Folder' }}
              </button>
              <p class="text-xs text-slate-500 mt-2">
                Note: This is a mockup. Actual implementation will use the File System Access API.
              </p>
            </div>

            <!-- Mock Preview of Discovered Structure -->
            <div v-if="folderSelected" class="mb-6">
              <h4 class="text-base font-semibold text-slate-900 mb-2">Step 2: AI Pattern Discovery</h4>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div class="flex items-center gap-3">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <p class="text-sm text-green-800">
                    AI is analyzing folder structure and discovering naming patterns...
                  </p>
                </div>
              </div>

              <!-- Discovered patterns -->
              <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p class="text-sm font-semibold text-slate-900 mb-2">🔍 Discovered Patterns:</p>
                <ul class="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                  <li>Found 47 client folders</li>
                  <li>Pattern detected: [ClientName] - [MatterNumber]</li>
                  <li>Date format: YYYY-MM-DD</li>
                  <li>Average confidence: 92%</li>
                </ul>
              </div>
            </div>

            <!-- Mock Data Table Preview -->
            <div v-if="folderSelected" class="mb-4">
              <h4 class="text-base font-semibold text-slate-900 mb-2">Step 3: Review Extracted Data</h4>
              <p class="text-sm text-slate-600 mb-4">
                Review AI-extracted data. Check/uncheck matters to import, edit any values that need correction.
              </p>

              <div class="border border-slate-200 rounded-lg overflow-hidden">
                <table class="w-full">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                        Import
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Matter Number
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Folder Path
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Confidence
                      </th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-slate-200">
                    <tr
                      v-for="item in mockFolderData"
                      :key="item.matterNumber"
                      class="hover:bg-slate-50 transition-colors"
                    >
                      <td class="px-4 py-3">
                        <input
                          v-model="item.import"
                          type="checkbox"
                          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.clientName }}</td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.matterNumber }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.folderPath }}</td>
                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="{
                            'bg-green-100 text-green-800': item.confidence >= 90,
                            'bg-yellow-100 text-yellow-800': item.confidence >= 70 && item.confidence < 90,
                            'bg-red-100 text-red-800': item.confidence < 70,
                          }"
                        >
                          {{ item.confidence }}%
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button class="text-slate-400 hover:text-slate-600 transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex justify-end gap-3 mt-4">
                <button
                  class="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  @click="resetPath"
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  @click="mockImport"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Import Selected Matters ({{ selectedFolderCount }})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Analysis Import Interface -->
      <div v-if="selectedPath === 'document'" class="mx-6 mb-6 relative z-10">
        <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 class="text-lg font-bold text-slate-900">Document Analysis Import</h3>
            </div>
          </div>

          <div class="p-6">
            <!-- Step 1: Document Upload -->
            <div class="mb-6">
              <h4 class="text-base font-semibold text-slate-900 mb-2">Step 1: Upload Practice Management Export</h4>
              <p class="text-sm text-slate-600 mb-4">
                Upload a CSV, Excel, or PDF export from your practice management system. AI will automatically
                discover the schema and extract matter data.
              </p>

              <div
                class="relative border-2 border-dashed rounded-lg p-8 text-center"
                :class="documentUploaded ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50'"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  class="hidden"
                  @change="handleDocumentUpload"
                />
                <button
                  class="w-full flex flex-col items-center gap-2"
                  @click="fileInputRef.click()"
                >
                  <svg
                    class="w-12 h-12"
                    :class="documentUploaded ? 'text-green-600' : 'text-slate-400'"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div v-if="!documentUploaded">
                    <p class="text-sm font-medium text-slate-900">Click to upload file</p>
                    <p class="text-xs text-slate-500 mt-1">CSV, Excel (.xlsx, .xls), or PDF</p>
                  </div>
                  <div v-else>
                    <p class="text-sm font-medium text-green-900">{{ uploadedFileName }}</p>
                    <p class="text-xs text-green-600 mt-1">Click to upload a different file</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- Mock Analysis Results -->
            <div v-if="documentUploaded" class="mb-6">
              <h4 class="text-base font-semibold text-slate-900 mb-2">Step 2: AI Schema Discovery</h4>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p class="text-sm font-semibold text-green-900">Document analyzed successfully!</p>
                    <p class="text-xs text-green-700">Detected {{ mockDocumentData.length }} potential matters</p>
                  </div>
                </div>
              </div>

              <!-- Discovered Schema -->
              <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <p class="text-sm font-semibold text-slate-900 mb-2">🔍 Discovered Schema:</p>
                <ul class="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                  <li>File type: {{ fileType.toUpperCase() }}</li>
                  <li>Columns detected: Client Name, Matter Number, Description, Status, Date Opened</li>
                  <li>Total rows: {{ mockDocumentData.length }}</li>
                  <li>Confidence: High</li>
                </ul>
              </div>
            </div>

            <!-- Mock Field Mapping -->
            <div v-if="documentUploaded" class="mb-6">
              <h4 class="text-base font-semibold text-slate-900 mb-2">Step 3: Map Fields to ListBot Schema</h4>
              <p class="text-sm text-slate-600 mb-4">
                AI has suggested field mappings. Verify or adjust as needed.
              </p>

              <div class="grid gap-4 md:grid-cols-2">
                <div
                  v-for="mapping in fieldMappings"
                  :key="mapping.source"
                  class="bg-slate-50 border border-slate-200 rounded-lg p-4"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex-1">
                      <p class="text-xs text-slate-500 mb-1">Source Field</p>
                      <p class="text-sm font-medium text-slate-900">{{ mapping.source }}</p>
                    </div>
                    <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                    <div class="flex-1">
                      <p class="text-xs text-slate-500 mb-1">ListBot Field</p>
                      <select
                        v-model="mapping.target"
                        class="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option v-for="field in listbotFields" :key="field" :value="field">
                          {{ field }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div v-if="mapping.confidence" class="mt-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      AI Confidence: {{ mapping.confidence }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mock Data Table Preview -->
            <div v-if="documentUploaded" class="mb-4">
              <h4 class="text-base font-semibold text-slate-900 mb-2">Step 4: Review and Import</h4>
              <p class="text-sm text-slate-600 mb-4">
                Review extracted data and select which matters to import.
              </p>

              <div class="border border-slate-200 rounded-lg overflow-hidden">
                <table class="w-full">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                        Import
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Matter Number
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Status
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Date Opened
                      </th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-slate-200">
                    <tr
                      v-for="item in mockDocumentData"
                      :key="item.matterNumber"
                      class="hover:bg-slate-50 transition-colors"
                    >
                      <td class="px-4 py-3">
                        <input
                          v-model="item.import"
                          type="checkbox"
                          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.clientName }}</td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.matterNumber }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.description }}</td>
                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getStatusClass(item.status)"
                        >
                          {{ item.status }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.dateOpened }}</td>
                      <td class="px-4 py-3 text-right">
                        <button class="text-slate-400 hover:text-slate-600 transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="flex justify-end gap-3 mt-4">
                <button
                  class="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  @click="resetPath"
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  @click="mockImport"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Import Selected Matters ({{ selectedDocumentCount }})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>

    <!-- Success Notification (Snackbar) -->
    <div
      v-if="showSuccessNotification"
      class="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span class="text-sm font-medium">Mock import successful! (This is a mockup - no data was actually imported)</span>
      <button class="ml-2 hover:text-green-100" @click="showSuccessNotification = false">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import PageLayout from '@/shared/components/layout/PageLayout.vue';
import TitleDrawer from '@/shared/components/layout/TitleDrawer.vue';

defineOptions({
  name: 'MatterImportView',
});

// Refs
const fileInputRef = ref(null);

// State
const selectedPath = ref(null);
const folderSelected = ref(false);
const documentUploaded = ref(false);
const uploadedFileName = ref('');
const fileType = ref('csv');
const showSuccessNotification = ref(false);

// Mock Data for Folder Import
const mockFolderData = ref([
  {
    import: true,
    clientName: 'Smith, John',
    matterNumber: 'M-2024-001',
    folderPath: '/Clients/Smith, John - M-2024-001',
    confidence: 95,
  },
  {
    import: true,
    clientName: 'Johnson Corp',
    matterNumber: 'M-2024-002',
    folderPath: '/Clients/Johnson Corp - M-2024-002',
    confidence: 92,
  },
  {
    import: true,
    clientName: 'Williams Estate',
    matterNumber: 'M-2024-003',
    folderPath: '/Clients/Williams Estate - M-2024-003',
    confidence: 88,
  },
]);

// Mock Data for Document Import
const mockDocumentData = ref([
  {
    import: true,
    clientName: 'Anderson, Sarah',
    matterNumber: 'M-2024-101',
    description: 'Real Estate Transaction',
    status: 'Active',
    dateOpened: '2024-01-15',
  },
  {
    import: true,
    clientName: 'Brown Industries',
    matterNumber: 'M-2024-102',
    description: 'Contract Review',
    status: 'Active',
    dateOpened: '2024-02-01',
  },
  {
    import: true,
    clientName: 'Davis Family Trust',
    matterNumber: 'M-2024-103',
    description: 'Estate Planning',
    status: 'Active',
    dateOpened: '2024-02-10',
  },
  {
    import: true,
    clientName: 'Miller & Associates',
    matterNumber: 'M-2024-104',
    description: 'Corporate Restructuring',
    status: 'Pending',
    dateOpened: '2024-03-05',
  },
  {
    import: true,
    clientName: 'Wilson, Robert',
    matterNumber: 'M-2024-105',
    description: 'Litigation Support',
    status: 'Closed',
    dateOpened: '2024-01-20',
  },
]);

// Field mapping for document import
const fieldMappings = ref([
  { source: 'Client Name', target: 'clientName', confidence: 98 },
  { source: 'Matter Number', target: 'matterNumber', confidence: 100 },
  { source: 'Description', target: 'description', confidence: 95 },
  { source: 'Status', target: 'status', confidence: 92 },
  { source: 'Date Opened', target: 'dateOpened', confidence: 97 },
]);

const listbotFields = [
  'clientName',
  'matterNumber',
  'description',
  'status',
  'dateOpened',
  'dateClosed',
  'matterType',
  'responsibleAttorney',
  'customField1',
  'customField2',
];

// Computed
const selectedFolderCount = computed(() => {
  return mockFolderData.value.filter(item => item.import).length;
});

const selectedDocumentCount = computed(() => {
  return mockDocumentData.value.filter(item => item.import).length;
});

// Methods
function selectPath(path) {
  selectedPath.value = path;
}

function resetPath() {
  selectedPath.value = null;
  folderSelected.value = false;
  documentUploaded.value = false;
  uploadedFileName.value = '';
}

function mockFolderSelect() {
  folderSelected.value = true;
}

function handleDocumentUpload(event) {
  const file = event.target.files[0];
  if (file) {
    documentUploaded.value = true;
    uploadedFileName.value = file.name;
    fileType.value = file.name.split('.').pop();
  }
}

function mockImport() {
  showSuccessNotification.value = true;
  setTimeout(() => {
    showSuccessNotification.value = false;
    resetPath();
  }, 3000);
}

function getStatusClass(status) {
  const classes = {
    Active: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Closed: 'bg-slate-100 text-slate-600',
  };
  return classes[status] || 'bg-slate-100 text-slate-600';
}
</script>

<style scoped>
.bg-viewport-bg {
  background-color: #faf8f3;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>

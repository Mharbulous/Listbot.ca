<template>
  <div class="matter-import">
    <!-- Page Header -->
    <div class="mb-6">
      <div class="d-flex align-center gap-2 mb-2">
        <v-chip color="blue" size="small" variant="flat">
          Case Management: Matter Import
        </v-chip>
      </div>
      <h1 class="text-h4 font-weight-bold mb-2">AI-Powered Bulk Matter Import</h1>
      <p class="text-body-1 text-medium-emphasis">
        Import matters from folder structures or practice management exports using AI to
        intelligently discover patterns and extract data.
      </p>
    </div>

    <!-- Key Impact Box -->
    <v-alert
      type="info"
      variant="tonal"
      color="blue"
      class="mb-6"
      border="start"
      border-color="blue"
    >
      <div class="d-flex align-start">
        <div class="text-h6 mr-2">🤖</div>
        <div>
          <div class="font-weight-bold mb-1">AI-Powered Pattern Discovery</div>
          <div class="text-body-2">
            AI-powered import eliminates the need for custom parsers and complex configuration
            by <strong>automatically discovering your firm's unique naming patterns and data
            structure</strong>. Import hundreds of matters in minutes, not hours.
          </div>
        </div>
      </div>
    </v-alert>

    <!-- Import Path Selection or Active Import View -->
    <v-card v-if="!selectedPath" variant="outlined">
      <v-card-title class="text-h6">Choose Your Import Path</v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Select the import method that best fits your data source. Both paths use AI to
          automatically discover and extract matter information.
        </p>

        <div class="d-flex flex-column flex-md-row gap-4">
          <!-- Path 1: Folder Structure Import -->
          <v-card
            variant="outlined"
            class="flex-grow-1 cursor-pointer import-path-card"
            hover
            @click="selectPath('folder')"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-3">
                <div class="text-h4 mr-3">📁</div>
                <div>
                  <div class="text-h6 font-weight-bold">Folder Structure Import</div>
                  <v-chip size="x-small" color="blue" variant="flat" class="mt-1">
                    Path 1: Quick Setup
                  </v-chip>
                </div>
              </div>
              <p class="text-body-2">
                Select your client files root folder. AI scans the hierarchy, discovers your
                firm's naming patterns (client names, matter numbers, dates), and extracts
                structured data from folder names—no manual mapping required.
              </p>
            </v-card-text>
          </v-card>

          <!-- Path 2: Document Analysis Import -->
          <v-card
            variant="outlined"
            class="flex-grow-1 cursor-pointer import-path-card"
            hover
            @click="selectPath('document')"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-3">
                <div class="text-h4 mr-3">📄</div>
                <div>
                  <div class="text-h6 font-weight-bold">Document Analysis Import</div>
                  <v-chip size="x-small" color="blue" variant="flat" class="mt-1">
                    Path 2: Detailed Data
                  </v-chip>
                </div>
              </div>
              <p class="text-body-2">
                Upload CSV/Excel/PDF exports from any practice management system. AI discovers
                the source schema, extracts matter data, and can validate/enrich existing
                matters imported from folders.
              </p>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>

    <!-- Folder Structure Import Interface -->
    <div v-if="selectedPath === 'folder'">
      <v-card variant="outlined">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-folder-open</v-icon>
          Folder Structure Import
          <v-spacer />
          <v-btn
            variant="text"
            size="small"
            @click="resetPath"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Change Path
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <!-- Step 1: Folder Selection -->
          <div class="mb-6">
            <h3 class="text-h6 mb-3">Step 1: Select Client Files Folder</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Choose the root folder containing your client files. AI will scan the folder
              structure to discover your naming patterns.
            </p>

            <v-file-input
              v-model="folderSelection"
              label="Select folder containing client files"
              prepend-icon="mdi-folder"
              variant="outlined"
              density="comfortable"
              hint="Note: This is a mockup. Actual implementation will use directory picker API."
              persistent-hint
              accept="*"
              chips
              @click="showFolderMockDialog = true"
            />
          </div>

          <!-- Mock Preview of Discovered Structure -->
          <div v-if="folderSelection.length > 0" class="mb-6">
            <h3 class="text-h6 mb-3">Step 2: AI Pattern Discovery</h3>
            <v-alert type="success" variant="tonal" class="mb-4">
              <div class="d-flex align-center">
                <v-progress-circular
                  indeterminate
                  size="20"
                  width="2"
                  class="mr-3"
                />
                <div>
                  AI is analyzing folder structure and discovering naming patterns...
                </div>
              </div>
            </v-alert>

            <!-- Mock discovered patterns -->
            <v-card variant="tonal" color="blue-grey-lighten-5">
              <v-card-text>
                <div class="text-subtitle-2 font-weight-bold mb-2">
                  🔍 Discovered Patterns (Mockup):
                </div>
                <ul class="text-body-2 ml-4">
                  <li>Found 47 client folders</li>
                  <li>Pattern detected: [ClientName] - [MatterNumber]</li>
                  <li>Date format: YYYY-MM-DD</li>
                  <li>Average confidence: 92%</li>
                </ul>
              </v-card-text>
            </v-card>
          </div>

          <!-- Mock Data Table Preview -->
          <div v-if="folderSelection.length > 0" class="mb-4">
            <h3 class="text-h6 mb-3">Step 3: Review Extracted Data</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Review AI-extracted data. Check/uncheck matters to import, edit any values that
              need correction.
            </p>

            <v-data-table
              :headers="folderTableHeaders"
              :items="mockFolderData"
              density="comfortable"
              class="border"
            >
              <template #item.import="{ item }">
                <v-checkbox
                  v-model="item.import"
                  hide-details
                  density="compact"
                />
              </template>
              <template #item.confidence="{ item }">
                <v-chip
                  :color="item.confidence >= 90 ? 'success' : item.confidence >= 70 ? 'warning' : 'error'"
                  size="small"
                  variant="flat"
                >
                  {{ item.confidence }}%
                </v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="x-small"
                  variant="text"
                  density="comfortable"
                />
              </template>
            </v-data-table>

            <div class="d-flex justify-end gap-2 mt-4">
              <v-btn variant="outlined" @click="resetPath">
                Cancel
              </v-btn>
              <v-btn color="primary" variant="flat" @click="mockImport">
                <v-icon start>mdi-upload</v-icon>
                Import Selected Matters (3)
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Document Analysis Import Interface -->
    <div v-if="selectedPath === 'document'">
      <v-card variant="outlined">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-file-document</v-icon>
          Document Analysis Import
          <v-spacer />
          <v-btn
            variant="text"
            size="small"
            @click="resetPath"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Change Path
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <!-- Step 1: Document Upload -->
          <div class="mb-6">
            <h3 class="text-h6 mb-3">Step 1: Upload Practice Management Export</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Upload a CSV, Excel, or PDF export from your practice management system.
              AI will automatically discover the schema and extract matter data.
            </p>

            <v-file-input
              v-model="documentFile"
              label="Upload CSV, Excel, or PDF file"
              prepend-icon="mdi-file-upload"
              variant="outlined"
              density="comfortable"
              accept=".csv,.xlsx,.xls,.pdf"
              show-size
              chips
              hint="Supported formats: CSV, Excel (.xlsx, .xls), PDF"
              persistent-hint
              @change="onDocumentUpload"
            />
          </div>

          <!-- Mock Analysis Results -->
          <div v-if="documentFile.length > 0" class="mb-6">
            <h3 class="text-h6 mb-3">Step 2: AI Schema Discovery</h3>
            <v-alert type="success" variant="tonal" class="mb-4">
              <div class="d-flex align-center">
                <v-icon class="mr-3">mdi-check-circle</v-icon>
                <div>
                  <div class="font-weight-bold">Document analyzed successfully!</div>
                  <div class="text-body-2">
                    Detected {{ mockDocumentData.length }} potential matters
                  </div>
                </div>
              </div>
            </v-alert>

            <!-- Discovered Schema -->
            <v-card variant="tonal" color="blue-grey-lighten-5" class="mb-4">
              <v-card-text>
                <div class="text-subtitle-2 font-weight-bold mb-2">
                  🔍 Discovered Schema (Mockup):
                </div>
                <ul class="text-body-2 ml-4">
                  <li>File type: {{ documentFile[0]?.name.split('.').pop().toUpperCase() }}</li>
                  <li>Columns detected: Client Name, Matter Number, Description, Status, Date Opened</li>
                  <li>Total rows: {{ mockDocumentData.length }}</li>
                  <li>Confidence: High</li>
                </ul>
              </v-card-text>
            </v-card>
          </div>

          <!-- Mock Field Mapping -->
          <div v-if="documentFile.length > 0" class="mb-6">
            <h3 class="text-h6 mb-3">Step 3: Map Fields to ListBot Schema</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              AI has suggested field mappings. Verify or adjust as needed.
            </p>

            <v-row>
              <v-col
                v-for="mapping in fieldMappings"
                :key="mapping.source"
                cols="12"
                md="6"
              >
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex align-center justify-space-between">
                    <div class="flex-grow-1">
                      <div class="text-caption text-medium-emphasis">Source Field</div>
                      <div class="font-weight-bold">{{ mapping.source }}</div>
                    </div>
                    <v-icon class="mx-3">mdi-arrow-right</v-icon>
                    <div class="flex-grow-1">
                      <div class="text-caption text-medium-emphasis">ListBot Field</div>
                      <v-select
                        v-model="mapping.target"
                        :items="listbotFields"
                        variant="outlined"
                        density="compact"
                        hide-details
                      />
                    </div>
                  </div>
                  <v-chip
                    v-if="mapping.confidence"
                    size="x-small"
                    color="success"
                    variant="flat"
                    class="mt-2"
                  >
                    AI Confidence: {{ mapping.confidence }}%
                  </v-chip>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Mock Data Table Preview -->
          <div v-if="documentFile.length > 0" class="mb-4">
            <h3 class="text-h6 mb-3">Step 4: Review and Import</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Review extracted data and select which matters to import.
            </p>

            <v-data-table
              :headers="documentTableHeaders"
              :items="mockDocumentData"
              density="comfortable"
              class="border"
            >
              <template #item.import="{ item }">
                <v-checkbox
                  v-model="item.import"
                  hide-details
                  density="compact"
                />
              </template>
              <template #item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                  variant="flat"
                >
                  {{ item.status }}
                </v-chip>
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  size="x-small"
                  variant="text"
                  density="comfortable"
                />
              </template>
            </v-data-table>

            <div class="d-flex justify-end gap-2 mt-4">
              <v-btn variant="outlined" @click="resetPath">
                Cancel
              </v-btn>
              <v-btn color="primary" variant="flat" @click="mockImport">
                <v-icon start>mdi-upload</v-icon>
                Import Selected Matters (5)
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Info Footer -->
    <v-alert
      v-if="!selectedPath"
      type="info"
      variant="tonal"
      color="blue"
      class="mt-6"
      border="start"
    >
      <div class="text-body-2">
        <strong>💡 Pro Tip:</strong> For best results, you can combine both import paths—start
        with Folder Structure Import for quick bulk setup, then use Document Analysis Import
        to enrich matters with detailed data from your practice management system.
      </div>
    </v-alert>

    <!-- Mock Dialog for Folder Selection -->
    <v-dialog v-model="showFolderMockDialog" max-width="500">
      <v-card>
        <v-card-title>Folder Selection (Mockup)</v-card-title>
        <v-card-text>
          <p class="mb-4">
            This mockup simulates folder selection. In the actual implementation, this would
            use the File System Access API to allow you to select a folder from your computer.
          </p>
          <p class="text-body-2 text-medium-emphasis">
            Click "Select Folder" below to simulate choosing a client files folder.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showFolderMockDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="mockFolderSelect"
          >
            Select Folder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccessSnackbar"
      color="success"
      timeout="3000"
    >
      <v-icon start>mdi-check-circle</v-icon>
      Mock import successful! (This is a mockup - no data was actually imported)
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({
  name: 'MatterImportView',
});

// State
const selectedPath = ref(null);
const folderSelection = ref([]);
const documentFile = ref([]);
const showFolderMockDialog = ref(false);
const showSuccessSnackbar = ref(false);

// Mock Data for Folder Import
const folderTableHeaders = [
  { title: 'Import', key: 'import', width: '80px', sortable: false },
  { title: 'Client Name', key: 'clientName', width: '200px' },
  { title: 'Matter Number', key: 'matterNumber', width: '150px' },
  { title: 'Folder Path', key: 'folderPath' },
  { title: 'Confidence', key: 'confidence', width: '120px' },
  { title: '', key: 'actions', width: '60px', sortable: false },
];

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
const documentTableHeaders = [
  { title: 'Import', key: 'import', width: '80px', sortable: false },
  { title: 'Client Name', key: 'clientName', width: '180px' },
  { title: 'Matter Number', key: 'matterNumber', width: '140px' },
  { title: 'Description', key: 'description' },
  { title: 'Status', key: 'status', width: '120px' },
  { title: 'Date Opened', key: 'dateOpened', width: '130px' },
  { title: '', key: 'actions', width: '60px', sortable: false },
];

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

// Methods
function selectPath(path) {
  selectedPath.value = path;
}

function resetPath() {
  selectedPath.value = null;
  folderSelection.value = [];
  documentFile.value = [];
}

function mockFolderSelect() {
  folderSelection.value = [{ name: 'Client Files (Mock)', size: 0 }];
  showFolderMockDialog.value = false;
}

function onDocumentUpload() {
  // Simulate document analysis
  if (documentFile.value.length > 0) {
    console.log('Document uploaded:', documentFile.value[0].name);
  }
}

function mockImport() {
  showSuccessSnackbar.value = true;
  setTimeout(() => {
    resetPath();
  }, 1500);
}

function getStatusColor(status) {
  const colors = {
    Active: 'success',
    Pending: 'warning',
    Closed: 'grey',
  };
  return colors[status] || 'default';
}
</script>

<style scoped>
.matter-import {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.import-path-card {
  transition: all 0.2s ease;
}

.import-path-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}
</style>

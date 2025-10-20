<template>
  <div class="pa-6">
    <h1 class="text-h4 font-weight-bold mb-6">Evidence Files</h1>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        class="elevation-1"
      >
        <!-- Empty template slots for future customization -->
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Define table headers
const headers = ref([
  { title: 'File Type', key: 'fileType', sortable: true },
  { title: 'File Name', key: 'fileName', sortable: true },
  { title: 'File Size', key: 'fileSize', sortable: true },
  { title: 'Document Date', key: 'documentDate', sortable: true },
  { title: 'Privilege', key: 'privilege', sortable: true },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Document Type', key: 'documentType', sortable: true },
  { title: 'Author', key: 'author', sortable: true },
  { title: 'Custodian', key: 'custodian', sortable: true },
]);

// Single blank row for mockup
const items = ref([
  {
    fileType: '',
    fileName: '',
    fileSize: '',
    documentDate: '',
    privilege: '',
    description: '',
    documentType: '',
    author: '',
    custodian: '',
  },
]);
</script>

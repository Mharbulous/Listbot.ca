import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure workers are bundled as separate chunks
        manualChunks: undefined,
      },
    },
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        // Keep workers as ES modules
        format: 'es',
        // Ensure proper file naming for workers
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/BDLC_Intranet/**', '**/Template/**'],
    css: false,
  },
})

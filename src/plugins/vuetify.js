// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Material Design Icons
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#0d9488', // teal-600
          'primary-darken-1': '#0f766e', // teal-700
          secondary: '#64748b', // slate-500
          accent: '#f1f5f9', // slate-100
          error: '#ef4444', // red-500
          warning: '#f59e0b', // amber-500
          info: '#0d9488', // teal-600
          success: '#10b981', // emerald-500
          surface: '#ffffff',
          'surface-variant': '#f8fafc', // slate-50
          'on-surface': '#1e293b', // slate-800
          'on-surface-variant': '#475569', // slate-600
        },
      },
      dark: {
        colors: {
          primary: '#0d9488', // teal-600
          'primary-darken-1': '#0f766e', // teal-700
          secondary: '#64748b', // slate-500
          accent: '#1e293b', // slate-800
          error: '#ef4444', // red-500
          warning: '#f59e0b', // amber-500
          info: '#0d9488', // teal-600
          success: '#10b981', // emerald-500
          surface: '#1e293b', // slate-800
          'surface-variant': '#334155', // slate-700
          'on-surface': '#f1f5f9', // slate-100
          'on-surface-variant': '#cbd5e1', // slate-300
        },
      },
    },
  },
});

export default vuetify;

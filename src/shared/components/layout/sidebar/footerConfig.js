/**
 * Footer Configuration
 * Defines user menu links, available apps, and URL generation
 */

// User menu links (Profile, Settings)
export const userLinks = [
  {
    to: '/profile',
    label: 'Profile',
    icon: '<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: '<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.205 1.251l-1.18 2.044a1 1 0 01-1.186.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.205-1.251l1.18-2.044a1 1 0 011.186-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>',
  },
];

// Available apps for app switcher
export const availableApps = [
  {
    name: 'Book Keeper',
    subdomain: 'bookkeeping',
    description: 'Bookkeeping and accounting',
    icon: '📚',
    port: '3001',
  },
  {
    name: 'Intranet',
    subdomain: 'intranet',
    description: 'Internal portal and resources',
    icon: '📇',
    port: '3000',
  },
];

// Get the base domain from environment
export const baseDomain = import.meta.env.VITE_APP_DOMAIN || 'localhost:3000';

/**
 * Generate URL for an app subdomain
 * @param {string} subdomain - The app subdomain (e.g., 'bookkeeping', 'intranet')
 * @returns {string} The full URL for the app
 */
export const getAppUrl = (subdomain) => {
  // Find the app configuration for the subdomain
  const app = availableApps.find((a) => a.subdomain === subdomain);

  // For local development - use specific ports
  if (baseDomain.includes('localhost')) {
    const port = app?.port || '5173';
    return `http://localhost:${port}`;
  }

  // For production
  return `https://${subdomain}.${baseDomain}`;
};

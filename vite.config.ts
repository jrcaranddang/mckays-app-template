import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'

// Manifest V3 definition
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: 'Tab Curator',
  description:
    'Auto-categorize, archive, and semantically search your tabs, archives, and history to end tab overload.',
  version: '0.1.0',
  minimum_chrome_version: '114',
  action: {
    default_title: 'Tab Curator',
    default_popup: 'popup.html',
  },
  options_ui: {
    page: 'options.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: [
    'tabs',
    'tabGroups',
    'storage',
    'history',
    'activeTab',
    'scripting',
    'offscreen',
    'alarms',
  ],
  host_permissions: ['<all_urls>'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/extract.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        'assets/*'
      ],
      matches: ['<all_urls>'],
    },
  ],
}

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        options: 'options.html',
        popup: 'popup.html',
        offscreen: 'offscreen.html',
      },
    },
  },
})
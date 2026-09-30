import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://uncached.app',
  output: 'static',
  // The shipped desktop app links Pro here, and a released binary cannot be
  // edited: the route has to exist for as long as those copies do.
  redirects: { '/pro': '/pricing' },
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap({
      // API endpoints are server-rendered; /pay and /thank-you are noindex, and a
      // noindex URL in the sitemap is a crawl instruction contradicting itself.
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/pay') &&
        !page.includes('/thank-you'),
      changefreq: 'weekly',
      priority: 1.0,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // The homepage demo renders desktop components copied into src/demo/app.
      alias: [
        { find: '@tauri-apps/api/core', replacement: fileURLToPath(new URL('./src/demo/stubs/core.ts', import.meta.url)) },
        { find: '@tauri-apps/api/event', replacement: fileURLToPath(new URL('./src/demo/stubs/event.ts', import.meta.url)) },
        { find: '@tauri-apps/plugin-dialog', replacement: fileURLToPath(new URL('./src/demo/stubs/plugin-dialog.ts', import.meta.url)) },
        { find: '@tauri-apps/plugin-opener', replacement: fileURLToPath(new URL('./src/demo/stubs/plugin-opener.ts', import.meta.url)) },
        // Exact match only: the stub itself imports the library from its dist path.
        { find: /^canvas-confetti$/, replacement: fileURLToPath(new URL('./src/demo/stubs/confetti.ts', import.meta.url)) },
      ],
    },
  },
});

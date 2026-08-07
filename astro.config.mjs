import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://uncached.app',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap({
      // API endpoints are server-rendered and must never appear in the sitemap.
      filter: (page) => !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 1.0,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

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
        !page.includes('/thank-you') &&
        (process.env.PUBLIC_DOWNLOADS_ENABLED === 'true' || !page.includes('/download')),
      changefreq: 'weekly',
      priority: 1.0,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

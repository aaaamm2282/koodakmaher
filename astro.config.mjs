// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// دامنه نهایی سایت را اینجا تنظیم کنید (برای canonical، sitemap و Open Graph لازم است)
const SITE_URL = process.env.SITE_URL || 'https://mahermana.com';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
});

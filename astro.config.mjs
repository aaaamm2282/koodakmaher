// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkSrcAssets from './src/lib/remark-src-assets.mjs';
import { redirects } from './src/data/redirects.mjs';
import fs from 'node:fs';

/** True when a collection folder has at least one entry that is not a draft (used to keep empty lists out of the sitemap). */
const hasPublished = (dir) =>
  fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.md') && !/^draft:\s*true\s*$/m.test(fs.readFileSync(`${dir}/${f}`, 'utf8').split(/^---$/m)[1] ?? ''));
const newsLive = hasPublished('./src/content/news');

// دامنه نهایی سایت را اینجا تنظیم کنید (برای canonical، sitemap و Open Graph لازم است)
const SITE_URL = process.env.SITE_URL || 'https://mahermana.com';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  redirects,
  integrations: [
    sitemap({
      // Pages that must not be indexed stay out of the sitemap too.
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.startsWith('/admin/') || path.startsWith('/review/') || path === '/404/') return false;
        if (path === '/news/' && !newsLive) return false; // the list says "no announcements yet" and is noindex
        return true;
      },
    }),
  ],
  markdown: { remarkPlugins: [remarkSrcAssets] },
  image: { layout: 'constrained', responsiveStyles: true },
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
});

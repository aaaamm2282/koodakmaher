// @ts-check
import './src/lib/load-env.mjs'; // .env settings, before anything reads process.env
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkSrcAssets from './src/lib/remark-src-assets.mjs';
import serverFiles from './src/integrations/server-files.mjs';
import { loadRedirects, toAstroRedirects } from './src/lib/redirects.mjs';
import { readEntries, isPublished, isoDay } from './src/lib/content-files.mjs';

// Articles and announcements on the site today (not drafts, date already come; the same rule as the pages)
const posts = readEntries('./src/content/blog').filter((e) => isPublished(e));
const news = readEntries('./src/content/news').filter((e) => isPublished(e));
const newsLive = news.length > 0;

// <lastmod> in the sitemap only where the content itself says when it changed: an article (its «updated»
// date, else its publish date), an announcement, and the two lists (their newest entry). Other pages get
// none: Google ignores a lastmod it finds unreliable, and a build date on every page would be one.
const newest = (list) => list.map((e) => e.updated ?? e.date).sort((a, b) => b - a)[0];
const lastmod = new Map([
  ...posts.filter((e) => e.slug).map((e) => [`/blog/${e.slug}/`, e.updated ?? e.date]),
  ...news.filter((e) => e.slug).map((e) => [`/news/${e.slug}/`, e.date]),
  ['/blog/', newest(posts)],
  ['/news/', newest(news)],
]);

// دامنه نهایی سایت را اینجا تنظیم کنید (برای canonical، sitemap و Open Graph لازم است)
const SITE_URL = process.env.SITE_URL || 'https://mahermana.com';

// Old-site addresses (src/content/settings/redirects.json) become real 301s in .htaccess and _redirects
// after every build (src/integrations/server-files.mjs). Only on a host that cannot redirect at all,
// build with STATIC_REDIRECT_PAGES=1 to also write an instant meta-refresh page at each old address.
const redirects = process.env.STATIC_REDIRECT_PAGES === '1' ? toAstroRedirects(loadRedirects({ site: SITE_URL })) : {};

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
      serialize(item) {
        const date = lastmod.get(new URL(item.url).pathname);
        if (date) item.lastmod = isoDay(date);
        return item;
      },
    }),
    serverFiles(),
    {
      // The CMS panel is a plain file (public/admin/index.html). A host opens a folder's index.html by itself;
      // the dev server does not, so /admin/ (docs/cms-setup.md) is pointed at the file here.
      name: 'koodakmaher:admin-dev',
      hooks: {
        'astro:server:setup': ({ server }) => {
          server.middlewares.use((req, _res, next) => {
            const [pathname, query] = (req.url ?? '').split('?');
            if (pathname === '/admin' || pathname === '/admin/') req.url = '/admin/index.html' + (query ? `?${query}` : '');
            next();
          });
        },
      },
    },
  ],
  // Unified (remark) keeps the plugin that points CMS image paths at the optimised copies
  markdown: { processor: unified({ remarkPlugins: [remarkSrcAssets] }) },
  // Whitespace between inline tags stays a space (Persian text is split across lines in the templates)
  compressHTML: true,
  image: { layout: 'constrained', responsiveStyles: true },
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
});

/**
 * After every build, writes the host files that carry the redirects from the old site:
 * dist/.htaccess (Apache, LiteSpeed) and dist/_redirects (Netlify, Cloudflare Pages).
 * The build stops if a redirect would hide a real page, points to a page that does not exist, or loops.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRedirects, checkRedirects, toHtaccess, toNetlify, toAstroRedirects, pathKey } from '../lib/redirects.mjs';

export default function serverFiles() {
  let site;
  return {
    name: 'koodakmaher:server-files',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
      },
      'astro:build:done': ({ dir, pages, logger }) => {
        const out = fileURLToPath(dir);
        const rules = loadRedirects({ site });
        // Meta-refresh pages written for STATIC_REDIRECT_PAGES=1 are redirects, not pages of the site.
        const metaRefresh = new Set(process.env.STATIC_REDIRECT_PAGES === '1' ? Object.keys(toAstroRedirects(rules)) : []);
        const built = new Set(pages.map((p) => `/${p.pathname}`).filter((p) => !metaRefresh.has(p)));
        const isPage = (p) => built.has(p);
        const exists = (p) => built.has(p) || built.has(`${pathKey(p)}/`) || fs.existsSync(path.join(out, p));

        const { rules: checked, errors, warnings } = checkRedirects(rules, { isPage, exists });
        for (const w of warnings) logger.warn(w);
        if (errors.length) throw new Error(`ریدایرکت‌های سایت قبلی (src/content/settings/redirects.json):\n- ${errors.join('\n- ')}`);

        fs.writeFileSync(path.join(out, '.htaccess'), toHtaccess(checked, { site }));
        fs.writeFileSync(path.join(out, '_redirects'), toNetlify(checked));
        const moved = checked.filter((r) => r.status === 301).length;
        logger.info(`${moved} ریدایرکت ۳۰۱ و ${checked.length - moved} نشانی حذف‌شده (۴۱۰) در .htaccess و _redirects`);
      },
    },
  };
}

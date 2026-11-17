/**
 * After every build, writes the host files that carry the redirects from the old site:
 * dist/.htaccess (Apache, LiteSpeed) and dist/_redirects (Netlify, Cloudflare Pages).
 * The build stops if a redirect would hide a real page, points to a page that does not exist, or loops.
 *
 * When the forms post to a PHP file on the site itself (PUBLIC_FORM_ENDPOINT=/api/form.php), the form
 * handler (server/form-handler.php) is copied to that address too, so every upload of dist carries it.
 * Its private settings never are: they stay in form-config.php above the web root (docs/forms-setup.md).
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

        const endpoint = (process.env.PUBLIC_FORM_ENDPOINT ?? '').trim();
        if (/^\/(?:[\w-]+\/)*[\w-]+\.php$/.test(endpoint)) {
          const target = path.join(out, endpoint);
          if (fs.existsSync(target)) throw new Error(`${endpoint} هم صفحه‌ای از سایت است و هم نشانی فرم‌ها؛ نشانی دیگری برای PUBLIC_FORM_ENDPOINT بگذارید.`);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.copyFileSync(fileURLToPath(new URL('../../server/form-handler.php', import.meta.url)), target);
          logger.info(`گیرنده فرم‌ها: ${endpoint}. تنظیمات خصوصی آن (form-config.php) را بیرون از پوشه سایت بگذارید (docs/forms-setup.md).`);
        }
      },
    },
  };
}

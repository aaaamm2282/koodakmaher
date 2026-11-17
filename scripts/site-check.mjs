/**
 * Checks every built page in a real browser, at phone and desktop width and with «reduce motion» on:
 *   - accessibility with axe-core: WCAG 2.2 levels A and AA plus axe's best practices. Blocks that fade in
 *     on scroll are shown first, so their colours are checked too, and every form is checked again after
 *     an empty send, with its error messages showing.
 *   - errors in the browser console, and files that fail to load
 *   - content wider than the screen (sideways scrolling on a phone)
 *   - links, images and #sections of this site that do not exist; canonical and Open Graph addresses that
 *     point nowhere; links that only work through a redirect of the old site
 *
 *   npm run build && npm run check:pages               all pages
 *   npm run check:pages -- /register/ /units/primary/   only these
 *
 * Needs Google Chrome (found on its own) or another Chromium: set CHROME_PATH to its program file.
 * Exits with 1 when something is wrong, so the GitHub check (.github/workflows/quality.yml) turns red.
 * Requests to other sites are blocked and listed, so the check runs the same with or without internet.
 */
import '../src/lib/load-env.mjs'; // .env settings, before anything reads process.env
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { loadRedirects, pathKey } from '../src/lib/redirects.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE = new URL(process.env.SITE_URL || 'https://mahermana.com');
const AXE_FILE = require.resolve('axe-core/axe.min.js');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const PASSES = [
  { name: 'موبایل', options: PHONE },
  { name: 'دسکتاپ', options: { viewport: { width: 1280, height: 800 } } },
  { name: 'موبایل با «کاهش حرکت»', options: { ...PHONE, reducedMotion: 'reduce' } },
];
const MISSING = '/km-page-that-does-not-exist/'; // shows the 404 page the way a visitor sees it

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('✗ dist/ پیدا نشد: اول `npm run build` را اجرا کنید.');
  process.exit(1);
}

/* ---------- the built site, served the way the host serves it ---------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm',
};
/** The file a path of the site comes from, like on the host: /about/ → dist/about/index.html. */
function fileFor(urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const file = path.join(dist, p.endsWith('/') ? `${p}index.html` : p);
  if (!file.startsWith(dist + path.sep)) return null;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}
const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const file = fileFor(pathname);
  if (file) {
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } else if (!pathname.endsWith('/') && fileFor(`${pathname}/`)) {
    res.writeHead(301, { Location: `${pathname}/` }).end();
  } else {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    fs.createReadStream(path.join(dist, '404.html')).pipe(res);
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

/* ---------- which pages ---------- */
const only = process.argv.slice(2).filter((a) => a.startsWith('/'));
const pages = [];
const redirectPages = []; // STATIC_REDIRECT_PAGES=1 builds: one-line pages that only forward
(function walk(dir, url) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) {
      if (f.name !== 'admin' && f.name !== '_astro') walk(path.join(dir, f.name), `${url}${f.name}/`);
    } else if (f.name === 'index.html') {
      const html = fs.readFileSync(path.join(dir, f.name), 'utf8');
      (/<meta http-equiv="refresh"/i.test(html) ? redirectPages : pages).push(url);
    }
  }
})(dist, '/');
pages.sort();
pages.push(MISSING);
const toCheck = only.length ? only : pages;

/* ---------- findings ---------- */
const found = new Map();
/** level: error (fails the check) | warn | info */
const note = (level, group, detail, where) => {
  const key = `${level}|${group}|${detail}`;
  if (!found.has(key)) found.set(key, { level, group, detail, where: new Set() });
  if (where) found.get(key).where.add(where);
};

/* ---------- what each page does in the browser ---------- */
const STILL = '*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;transition-delay:0s!important;transition-duration:0s!important}';

/** Shows the blocks that fade in on scroll and stops all motion, so every colour can be measured. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: STILL });
  await page.evaluate(() => document.querySelectorAll('[data-reveal],[data-stagger]').forEach((el) => el.classList.add('is-in')));
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
}

async function axe(page, include) {
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ path: AXE_FILE });
  return page.evaluate(
    ([tags, include]) =>
      window.axe.run(include ? { include: [include] } : document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] }),
    [AXE_TAGS, include],
  );
}

/** Wider than the screen: the page width, and the outermost elements that stick out (not clipped, not fixed). */
const overflow = () => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  if (sw <= vw + 1) return null;
  const out = [];
  const contained = (el) => {
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.position === 'fixed' || (a !== el && cs.overflowX !== 'visible')) return true;
    }
    return false;
  };
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (!r.width || (r.right <= vw + 1 && r.left >= -1) || out.some((o) => o.contains(el)) || contained(el)) continue;
    out.push(el);
    if (out.length === 3) break;
  }
  const name = (el) => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + [...el.classList].slice(0, 4).map((c) => `.${c}`).join('');
  return { sw, vw, culprits: out.map(name) };
};

/** Every address the page points to, and the ids that #links can land on. */
const addresses = () => {
  const abs = (u) => new URL(u, location.href).href;
  const srcset = (s) => s.split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean).map(abs);
  return {
    links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
    files: [
      ...[...document.querySelectorAll('img[src], video[src], video[poster], source[src]')].map((e) => abs(e.getAttribute('src') ?? e.getAttribute('poster'))),
      ...[...document.querySelectorAll('img[srcset], source[srcset]')].flatMap((e) => srcset(e.getAttribute('srcset'))),
      ...[...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"], link[rel="preload"]')].map((l) => l.href),
    ],
    meta: [
      ...[...document.querySelectorAll('link[rel="canonical"]')].map((l) => ['canonical', l.href]),
      ...[...document.querySelectorAll('meta[property="og:url"], meta[property="og:image"], meta[name="twitter:image"]')].map((m) => [m.getAttribute('property') ?? m.getAttribute('name'), m.content]),
    ],
    ids: [...document.querySelectorAll('[id], a[name]')].map((e) => e.id || e.getAttribute('name')),
  };
};

/* ---------- run ---------- */
let browser;
try {
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' });
} catch (e) {
  console.error('✗ مرورگر Chrome پیدا نشد. Google Chrome را نصب کنید، یا مسیر برنامه‌ی Chromium را در CHROME_PATH بدهید.');
  console.error(String(e.message ?? e).split('\n')[0]);
  server.close();
  process.exit(1);
}

const seen = new Map(); // page → { links, files, meta, ids }, from the first pass
const started = Date.now();
for (const pass of PASSES) {
  const context = await browser.newContext({ ...pass.options, locale: 'fa-IR', timezoneId: 'Asia/Tehran' });
  let current = '';
  await context.route((url) => url.origin !== base, (route) => {
    note('info', 'درخواست به سایت دیگر (مسدود شد)', new URL(route.request().url()).host, current);
    return route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // The 404 page itself arrives with status 404, which Chrome also logs as an error
    if (current === MISSING && m.location()?.url === base + MISSING) return;
    note('error', 'خطای مرورگر', m.text().slice(0, 300), `${current} (${pass.name})`);
  });
  page.on('pageerror', (e) => note('error', 'خطای اسکریپت', String(e.message).slice(0, 300), `${current} (${pass.name})`));
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.origin === base && r.status() >= 400 && !(r.request().isNavigationRequest() && current === MISSING)) {
      note('error', 'فایلی که بار نشد', `${r.status()} ${decodeURI(u.pathname)}`, current);
    }
  });
  page.on('requestfailed', (r) => {
    const u = new URL(r.url());
    if (u.origin === base) note('error', 'فایلی که بار نشد', `${r.failure()?.errorText ?? 'failed'} ${decodeURI(u.pathname)}`, current);
  });

  for (const p of toCheck) {
    current = p;
    const res = await page.goto(base + encodeURI(p), { waitUntil: 'networkidle' });
    if (p === MISSING ? res.status() !== 404 : res.status() !== 200) note('error', 'پاسخ صفحه', `کد ${res.status()}`, p);
    await settle(page);

    for (const v of (await axe(page)).violations) {
      for (const n of v.nodes.slice(0, 4)) {
        note('error', `دسترس‌پذیری: ${v.id} (${v.impact})`, v.help, `${p} (${pass.name}): ${n.target.join(' ')}${n.failureSummary ? ` — ${n.failureSummary.split('\n').slice(1).join(' ').trim()}` : ''}`);
      }
    }

    // Forms after an empty send: error messages, aria-invalid and focus must still be accessible
    const forms = await page.locator('form[data-form]').count();
    for (let i = 0; i < forms; i++) {
      const form = page.locator('form[data-form]').nth(i);
      try {
        await form.locator('[data-submit]').click({ timeout: 5000 });
      } catch {
        note('warn', 'فرمی که دکمه‌ی ارسالش در دسترس نبود', `فرم ${i + 1}`, `${p} (${pass.name})`);
        continue;
      }
      await page.waitForTimeout(50);
      const id = await form.getAttribute('id');
      for (const v of (await axe(page, id ? `form[id="${id}"]` : 'form[data-form]')).violations) {
        for (const n of v.nodes.slice(0, 4)) note('error', `دسترس‌پذیری فرم پس از ارسال خالی: ${v.id} (${v.impact})`, v.help, `${p} (${pass.name}): ${n.target.join(' ')}`);
      }
    }

    const wide = await page.evaluate(overflow);
    if (wide) note('error', 'بیرون‌زدگی از صفحه', `صفحه ${wide.sw}px در صفحه‌نمایش ${wide.vw}px`, `${p} (${pass.name}): ${wide.culprits.join('، ') || '?'}`);

    if (!seen.has(p)) seen.set(p, await page.evaluate(addresses));
  }
  await context.close();
}
await browser.close();
server.close();

/* ---------- links, files and #sections (from the pages as rendered) ---------- */
const redirects = new Map(loadRedirects({ site: SITE.href }).map((r) => [pathKey(r.from), r]));
const local = (href) => {
  const u = new URL(href);
  return u.origin === base ? u : null;
};
for (const [p, a] of seen) {
  for (const href of a.links) {
    const u = local(href);
    if (!u) continue;
    let pathname;
    try {
      pathname = decodeURIComponent(u.pathname);
    } catch {
      note('error', 'پیوند خراب', `نشانی نامعتبر ${u.pathname}`, p);
      continue;
    }
    const id = u.hash ? decodeURIComponent(u.hash.slice(1)) : '';
    if (pathname === p || fileFor(u.pathname)) {
      const target = pathname === p ? a : seen.get(pathname);
      if (id && id !== 'top' && target && !target.ids.includes(id)) note('error', 'پیوند به بخشی که نیست', `${pathname}#${id}`, p);
    } else if (fileFor(`${u.pathname}/`)) {
      note('warn', 'پیوند بدون / پایانی (یک ریدایرکت اضافه)', `${pathname} ← ${pathname}/`, p);
    } else if (redirects.has(pathKey(pathname))) {
      const r = redirects.get(pathKey(pathname));
      note('warn', 'پیوند به نشانی سایت قبلی', `${pathname} ← ${r.status === 301 ? r.to : 'حذف‌شده (۴۱۰)'}؛ مستقیم به مقصد پیوند بدهید`, p);
    } else {
      note('error', 'پیوند خراب', pathname, p);
    }
  }
  for (const href of a.files) {
    const u = local(href);
    if (u && !fileFor(u.pathname)) note('error', 'فایل یا تصویری که نیست', decodeURI(u.pathname), p);
  }
  for (const [kind, href] of a.meta) {
    let u;
    try {
      u = new URL(href);
    } catch {
      note('error', `نشانی ${kind} نامعتبر`, href, p);
      continue;
    }
    if (u.origin !== SITE.origin) note('error', `${kind} به دامنه‌ی دیگری اشاره می‌کند`, `${u.origin} به‌جای ${SITE.origin}`, p);
    else if (!fileFor(u.pathname)) note('error', `${kind} به صفحه یا فایلی که نیست`, decodeURI(u.pathname), p);
    else if (kind === 'canonical' && p !== MISSING && decodeURIComponent(u.pathname) !== p) note('warn', 'canonical به صفحه‌ی دیگری اشاره می‌کند', `${decodeURIComponent(u.pathname)}`, p);
  }
}

/* ---------- report ---------- */
const fa = (n) => n.toLocaleString('fa-IR');
const levels = { error: '✗', warn: '!', info: '·' };
const rows = [...found.values()].sort((x, y) => Object.keys(levels).indexOf(x.level) - Object.keys(levels).indexOf(y.level) || x.group.localeCompare(y.group));
console.log(`بررسی ${fa(toCheck.length)} صفحه در ${fa(PASSES.length)} حالت (${PASSES.map((x) => x.name).join('، ')}) در ${fa(Math.round((Date.now() - started) / 1000))} ثانیه`);
if (redirectPages.length) console.log(`(${fa(redirectPages.length)} صفحه‌ی ریدایرکت ایستا بررسی نشد)`);
for (const r of rows) {
  const where = [...r.where];
  console.log(`\n${levels[r.level]} ${r.group}: ${r.detail}${where.length ? ` (${fa(where.length)} مورد)` : ''}`);
  for (const w of where.slice(0, 8)) console.log(`    ${w.slice(0, 400)}`);
  if (where.length > 8) console.log(`    … و ${fa(where.length - 8)} مورد دیگر`);
}
const errors = rows.filter((r) => r.level === 'error').length;
const warns = rows.filter((r) => r.level === 'warn').length;
console.log(`\n${errors ? '✗' : '✓'} ${fa(errors)} ایراد، ${fa(warns)} هشدار`);
process.exit(errors ? 1 : 0);

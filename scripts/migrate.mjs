/**
 * Moving from the old WordPress site to this one without losing what Google already knows about it.
 *
 *   npm run migrate:import -- <files or addresses…>   gather every old address into docs/migration/old-urls.csv
 *   npm run migrate:apply                              copy the decided rows into src/content/settings/redirects.json
 *   npm run migrate:nginx                              print the same rules for an nginx server block
 *   npm run migrate:check -- https://mahermana.com     after launch: every old address, the sitemap, the 404 page
 *
 * What import reads (any mix, any number):
 *   - Search Console exports, CSV: Performance → Pages, Indexing → Pages, Links → Top linked pages
 *   - the old site's sitemaps: https://mahermana.com/sitemap_index.xml (live) or the saved .xml files
 *   - a WordPress export (Tools → Export, the WXR .xml file)
 *   - a text file with one address per line, optionally followed by the page's title
 *
 * The CSV is the working sheet a person reviews (status 301 / 410 / 404 / same, or empty = not decided).
 * redirects.json is what the site uses; it can also be edited in the CMS. Guide: docs/migration.md
 */
import '../src/lib/load-env.mjs'; // .env settings, before anything reads process.env
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePath, suggestPath } from '../src/data/url-hints.mjs';
import { REDIRECTS_FILE, loadRedirects, normalizeRule, checkRedirects, toNginx, pathKey } from '../src/lib/redirects.mjs';
import { parseCsv, csvCell, toLatinDigits } from './lib/csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const MAP_FILE = path.join(root, 'docs/migration/old-urls.csv');
const SITE = process.env.SITE_URL || 'https://mahermana.com';
const UA = 'Mozilla/5.0 (compatible; site-migration-check/1.0)';
const COLUMNS = ['old_path', 'old_title', 'new_path', 'status', 'guess', 'clicks', 'impressions', 'links', 'source', 'note'];

/* ---------- small helpers ---------- */
const args = process.argv.slice(2);
const command = args.shift();
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return null;
  const [value] = args.splice(i, 2).slice(1);
  return value ?? '';
};
const num = (s) => {
  const n = parseInt(toLatinDigits(s ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};
const xmlText = (s) =>
  String(s ?? '')
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .trim();
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

function readMap() {
  if (!fs.existsSync(MAP_FILE)) return [];
  const [head, ...rows] = parseCsv(fs.readFileSync(MAP_FILE, 'utf8'));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
function writeMap(rows) {
  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  const lines = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(','))];
  fs.writeFileSync(MAP_FILE, '﻿' + lines.join('\r\n') + '\r\n');
}

/* ---------- the built site: which paths are pages of the new site ---------- */
function builtPages() {
  if (!fs.existsSync(dist)) return null;
  const pages = new Set();
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(dir, e.name), `${rel}${e.name}/`);
      else if (e.name === 'index.html' && !fs.readFileSync(path.join(dir, e.name), 'utf8').includes('http-equiv="refresh"')) pages.add(rel);
    }
  };
  walk(dist, '/');
  return pages;
}
const fileExists = (p) => fs.existsSync(path.join(dist, p)) && fs.statSync(path.join(dist, p)).isFile();

/* ---------- reading the inputs ---------- */
async function readSource(src) {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`${src}: ${res.status}`);
    return res.text();
  }
  return fs.readFileSync(path.resolve(src), 'utf8');
}

/** Every old address in one input, with whatever the input knows about it (title, clicks…). */
async function entriesFrom(src, depth = 0) {
  const text = await readSource(src);
  const name = /^https?:/i.test(src) ? src : path.basename(src);
  const head = text.slice(0, 2000);

  if (/<sitemapindex/i.test(head)) {
    const children = [...text.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => xmlText(m[1]));
    const out = [];
    for (const child of children) {
      if (depth > 2) break;
      const local = !/^https?:/i.test(src) && path.join(path.dirname(src), path.basename(new URL(child).pathname));
      const from = local && fs.existsSync(local) ? local : child;
      try {
        out.push(...(await entriesFrom(from, depth + 1)));
      } catch (e) {
        console.warn(`  ⚠ ${path.basename(new URL(child).pathname)} خوانده نشد (${e.message}). اگر فایلش را ذخیره کرده‌اید، کنار همین فایل بگذارید.`);
      }
    }
    // The old sitemaps themselves are addresses too (Search Console may still have them).
    out.push({ url: /^https?:/i.test(src) ? src : `${SITE}/${path.basename(src)}`, source: name });
    return out;
  }
  if (/<urlset/i.test(head)) {
    return [...text.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({ url: xmlText(m[1].match(/<loc>([\s\S]*?)<\/loc>/)?.[1]), source: name }));
  }
  if (/<rss[\s\S]*xmlns:wp=/i.test(head)) {
    const skip = /^(attachment|nav_menu_item|revision|custom_css|customize_changeset|oembed_cache|user_request|wp_[a-z_]+|wpcf7_contact_form|elementor_library|acf-[a-z-]+|shop_order|shop_coupon)$/;
    const out = [];
    for (const [, item] of text.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const tag = (t) => xmlText(item.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`))?.[1]);
      if (tag('wp:status') !== 'publish' || skip.test(tag('wp:post_type'))) continue;
      out.push({ url: tag('link'), title: tag('title'), source: `${name} (${tag('wp:post_type')})` });
    }
    return out;
  }
  const rows = parseCsv(text);
  const headRow = rows[0] ?? [];
  // A CSV export has a real header row (no address in it); otherwise it is a plain list.
  if (rows.length > 1 && headRow.length > 1 && !headRow.some((h) => /^\s*https?:\/\//i.test(h))) {
    const body = rows.slice(1);
    const urlCol = headRow.findIndex((_h, i) => body.filter((r) => /^https?:\/\//i.test(r[i] ?? '')).length > body.length / 2);
    if (urlCol !== -1) {
      const col = (re) => headRow.findIndex((h, i) => i !== urlCol && re.test(h));
      const clicks = col(/click|کلیک/i);
      const impressions = col(/impression|نمایش/i);
      const incoming = col(/incoming|ورودی/i);
      const links = incoming !== -1 ? incoming : col(/link|پیوند|لینک/i);
      return body.map((r) => ({
        url: r[urlCol],
        clicks: clicks !== -1 ? num(r[clicks]) : 0,
        impressions: impressions !== -1 ? num(r[impressions]) : 0,
        links: links !== -1 ? num(r[links]) : 0,
        source: name,
      }));
    }
  }
  // Plain text: an address per line, the rest of the line is the title.
  return text.split(/\r?\n/).flatMap((line) => {
    const m = line.match(/(https?:\/\/\S+|^\s*\/\S*)/);
    if (!m) return [];
    const title = line.slice(m.index + m[0].length).replace(/^[\s|,\t–—-]+/, '').trim();
    return [{ url: m[1].trim(), title, source: name }];
  });
}

/* ---------- import ---------- */
const assetRe = /\.(?:jpe?g|png|gif|webp|avif|svg|ico|css|js|map|woff2?|ttf|eot|mp4|webm|mp3|zip|rar)$/i;
const docRe = /\.(?:pdf|docx?|xlsx?|pptx?)$/i;
const systemRe = /^\/(?:wp-admin|wp-includes|wp-json|wp-login\.php|xmlrpc\.php|wp-cron\.php|cgi-bin)(?:\/|$)/i;
const feedRe = /(?:^|\/)feed\/?$/i;
const shopRe = /^\/(?:shop|cart|checkout|my-account|product|product-category|product-tag)(?:\/|$)/i;

async function runImport() {
  const host = (flag('host') || new URL(SITE).host).replace(/^www\./, '');
  const sourceLabel = flag('source');
  if (!args.length) fail('فایل یا نشانی ورودی را بدهید. مثال: npm run migrate:import -- ~/Downloads/Pages.csv https://mahermana.com/sitemap_index.xml');

  const found = [];
  for (const src of args) {
    try {
      const entries = await entriesFrom(src);
      console.log(`• ${src}: ${entries.length} نشانی`);
      found.push(...entries.map((e) => ({ ...e, source: sourceLabel || e.source })));
    } catch (e) {
      console.warn(`  ⚠ ${src} خوانده نشد: ${e.message}`);
    }
  }

  const pages = builtPages();
  if (!pages) console.warn('  ⚠ پوشه dist نیست؛ برای تشخیص صفحه‌هایی که نشانی‌شان عوض نشده، اول npm run build را اجرا کنید.');
  const rules = new Map(loadRedirects({ site: SITE }).map((r) => [pathKey(r.from), r]));
  const rows = new Map(readMap().map((r) => [pathKey(r.old_path), r]));
  const skipped = { otherHost: 0, asset: 0, system: 0, query: 0 };
  let added = 0;

  for (const e of found) {
    if (!e.url) continue;
    let url;
    try {
      url = new URL(e.url, SITE);
    } catch {
      continue;
    }
    if (url.host.replace(/^www\./, '') !== host) {
      skipped.otherHost++;
      continue;
    }
    const p = decodePath(url.pathname);
    if (url.search && p === '/') {
      skipped.query++; // ?p=123, ?page_id=… : WordPress answered these with the address that is already in the list
      continue;
    }
    if (assetRe.test(p) || p.startsWith('/wp-content/')) {
      skipped.asset++;
      continue;
    }
    if (systemRe.test(p)) {
      skipped.system++;
      continue;
    }

    const key = pathKey(p);
    let row = rows.get(key);
    if (!row) {
      row = Object.fromEntries(COLUMNS.map((c) => [c, '']));
      row.old_path = p;
      const rule = rules.get(key);
      const guess = suggestPath(p);
      if (rule) {
        Object.assign(row, { new_path: rule.to, status: String(rule.status), guess: 'redirects.json', note: rule.note });
      } else if (p === '/' || pages?.has(`${key}/`) || (docRe.test(p) && fileExists(p))) {
        Object.assign(row, { new_path: p, status: 'same' });
      } else if (feedRe.test(p)) {
        Object.assign(row, { status: '410', note: 'خوراک RSS وردپرس' });
      } else if (docRe.test(p)) {
        Object.assign(row, { note: 'فایل؛ اگر هنوز لازم است در public/files/ بگذارید و نشانی تازه‌اش را بنویسید' });
      } else if (shopRe.test(p)) {
        Object.assign(row, { note: 'فروشگاه وردپرس؛ سایت جدید فروشگاه ندارد. تصمیم با مؤسسه' });
      } else if (guess) {
        Object.assign(row, { new_path: guess.to, status: guess.strong ? '301' : '', guess: guess.strong ? 'strong' : 'weak' });
      } else {
        row.guess = 'none';
      }
      rows.set(key, row);
      added++;
    }
    if (e.title && !row.old_title) row.old_title = e.title.replace(/\s+[-–|]\s+هلدینگ آموزشی.*$/, '').trim();
    for (const m of ['clicks', 'impressions', 'links']) if (e[m]) row[m] = String(Math.max(num(row[m]), e[m]));
    const sources = new Set(row.source ? row.source.split('; ') : []);
    if (e.source) sources.add(e.source);
    row.source = [...sources].join('; ');
  }

  const sorted = [...rows.values()].sort((a, b) => num(b.impressions) - num(a.impressions) || num(b.clicks) - num(a.clicks) || a.old_path.localeCompare(b.old_path, 'fa'));
  writeMap(sorted);

  const by = (s) => sorted.filter((r) => r.status === s).length;
  console.log(`\n${path.relative(root, MAP_FILE)}: ${sorted.length} نشانی (${added} تازه)`);
  console.log(`  ۳۰۱: ${by('301')}  ۴۱۰: ${by('410')}  ۴۰۴: ${by('404')}  بدون تغییر: ${by('same')}  تصمیم‌نشده: ${by('')}`);
  console.log(`  کنار گذاشته: ${skipped.otherHost} از دامنه دیگر، ${skipped.asset} فایل تصویر و…، ${skipped.system} نشانی سیستمی وردپرس، ${skipped.query} نشانی با ?`);
  const open = sorted.filter((r) => r.status === '');
  if (open.length) {
    console.log('\nتصمیم‌نشده‌ها (پربازدیدها اول):');
    for (const r of open.slice(0, 20)) console.log(`  ${r.old_path}  ${r.new_path ? `→ ${r.new_path}?` : ''}  ${r.impressions ? `(${r.impressions} نمایش)` : ''}`);
  }
  console.log('\nستون status را برای هر ردیف پر کنید (301، 410، 404 یا same) و بعد: npm run migrate:apply');
}

/* ---------- apply ---------- */
function runApply() {
  const rows = readMap();
  if (!rows.length) fail(`${path.relative(root, MAP_FILE)} خالی است یا وجود ندارد. اول npm run migrate:import`);
  const data = JSON.parse(fs.readFileSync(REDIRECTS_FILE, 'utf8'));
  const items = new Map((data.items ?? []).map((r) => [pathKey(normalizeRule(r)?.from ?? ''), r]));
  let set = 0;
  let removed = 0;
  for (const r of rows) {
    const key = pathKey(r.old_path);
    if (r.status === '301' || r.status === '410') {
      if (r.status === '301' && !r.new_path) {
        console.warn(`  ⚠ ${r.old_path}: وضعیت ۳۰۱ است ولی new_path خالی است؛ رد شد.`);
        continue;
      }
      const prev = items.get(key);
      const note = r.note || prev?.note || (r.old_title ? `«${r.old_title}» در سایت قبلی` : 'سایت قبلی');
      items.set(key, { from: prev?.from ?? r.old_path, to: r.status === '410' ? '' : r.new_path, status: r.status, note });
      set++;
    } else if (items.has(key) && ['404', 'same'].includes(r.status)) {
      items.delete(key);
      removed++;
    }
  }
  const list = [...items.values()];
  const pages = builtPages();
  const { errors, warnings } = checkRedirects(
    list.map((r) => normalizeRule(r, SITE)).filter(Boolean),
    pages ? { isPage: (p) => pages.has(p), exists: (p) => pages.has(p) || pages.has(`${pathKey(p)}/`) || fileExists(p) } : {},
  );
  warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  if (errors.length) fail(`چیزی ذخیره نشد:\n- ${errors.join('\n- ')}`);
  fs.writeFileSync(REDIRECTS_FILE, JSON.stringify({ ...data, items: list }, null, 2) + '\n');
  console.log(`${path.relative(root, fileURLToPath(REDIRECTS_FILE))}: ${set} ردیف ثبت شد، ${removed} ردیف برداشته شد؛ مجموع ${list.length}.`);
  if (!pages) console.log('برای بررسی مقصدها: npm run build (اگر مقصدی وجود نداشته باشد، build متوقف می‌شود).');
  const open = rows.filter((r) => r.status === '').length;
  if (open) console.log(`${open} نشانی هنوز تصمیم‌نشده است و فعلاً صفحه ۴۰۴ را نشان می‌دهد.`);
}

/* ---------- nginx ---------- */
function runNginx() {
  const { rules, errors } = checkRedirects(loadRedirects({ site: SITE }));
  if (errors.length) fail(errors.join('\n'));
  const out = flag('out');
  const text = toNginx(rules, { site: SITE });
  if (out) {
    fs.writeFileSync(out, text);
    console.log(`نوشته شد: ${out}`);
  } else process.stdout.write(text);
}

/* ---------- check (after launch, or against a staging address) ---------- */
async function get(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
    const type = res.headers.get('content-type') ?? '';
    const body = /html|xml|text/.test(type) ? await res.text() : '';
    return { status: res.status, location: res.headers.get('location'), robots: res.headers.get('x-robots-tag') ?? '', body };
  } catch (e) {
    return { status: 0, error: e.cause?.code ?? e.message, body: '' };
  }
}
const metaRobots = (html) => html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)/i)?.[1] ?? '';
const canonicalOf = (html) => html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)/i)?.[1] ?? null;
const metaRefresh = (html) => html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']*)/i)?.[1] ?? null;
const same = (a, b) => decodePath(a) === decodePath(b);

async function pool(items, size, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const n = i++;
        results[n] = await fn(items[n]);
      }
    }),
  );
  return results;
}

async function runCheck() {
  const base = args[0];
  if (!base || !/^https?:\/\//.test(base)) fail('نشانی سایت را بدهید. مثال: npm run migrate:check -- https://mahermana.com');
  const out = flag('out');
  const origin = new URL(base).origin;
  const live = new URL(SITE).origin; // the address pages declare as canonical
  const at = (p) => new URL(p, origin).href;
  const report = [];
  const add = (level, group, url, expected, got, detail = '') => report.push({ level, group, url, expected, got, detail });
  const shown = (s) => (s.status === 0 ? `خطا: ${s.error}` : String(s.status));

  // 1. The home page must be indexable: a review build (SHOW_DRAFTS / PREVIEW_PHOTOS) marks every page noindex.
  const home = await get(at('/'));
  if (home.status !== 200) add('error', 'صفحه اصلی', '/', '200', shown(home));
  else if (/noindex/i.test(metaRobots(home.body) + home.robots)) add('error', 'صفحه اصلی', '/', 'قابل ایندکس', 'noindex', 'سایت با SHOW_DRAFTS یا PREVIEW_PHOTOS ساخته شده؛ نسخه عادی را بسازید و دوباره بارگذاری کنید.');
  else add('ok', 'صفحه اصلی', '/', '200', '200');

  // 2. Old addresses: redirects.json, plus every row of the working sheet.
  const rules = checkRedirects(loadRedirects({ site: SITE })).rules;
  const ruleKeys = new Set(rules.map((r) => pathKey(r.from)));
  const extra = readMap().filter((r) => !ruleKeys.has(pathKey(r.old_path)));
  const targets = new Set();
  const cases = [
    ...rules.flatMap((r) => (r.status === 301 && !/\.[a-z0-9]{2,5}$/i.test(r.from) ? [r.from, pathKey(r.from)] : [r.from]).map((from) => ({ from, rule: r }))),
    ...extra.map((r) => ({ from: r.old_path, row: r })),
  ];
  await pool(cases, 4, async ({ from, rule, row }) => {
    // SMS short links (/r/kg/) live in the same redirects file but are not old addresses.
    const group = from.startsWith('/r/') ? 'لینک کوتاه' : 'نشانی قدیمی';
    const res = await get(at(encodeURI(from)));
    if (rule?.status === 301) {
      const want = new URL(rule.to, origin);
      const loc = res.location && new URL(res.location, at(encodeURI(from)));
      const refresh = res.status === 200 && metaRefresh(res.body);
      if ([301, 308].includes(res.status) && loc && same(loc.pathname + loc.search, want.pathname + want.search)) {
        add('ok', group, from, `301 → ${rule.to}`, `${res.status} → ${decodePath(loc.pathname + loc.search)}`);
        targets.add(want.href);
      } else if (refresh && same(new URL(refresh, origin).pathname, want.pathname)) {
        add('warn', group, from, `301 → ${rule.to}`, 'meta refresh', 'گوگل این را هم ریدایرکت دائمی حساب می‌کند، ولی ریدایرکت سرور بهتر است (docs/migration.md).');
        targets.add(want.href);
      } else if ([302, 303, 307].includes(res.status)) {
        add('error', group, from, `301 → ${rule.to}`, `${res.status} → ${res.location}`, 'ریدایرکت موقت است؛ باید ۳۰۱ باشد.');
      } else {
        add('error', group, from, `301 → ${rule.to}`, res.location ? `${shown(res)} → ${decodePath(res.location)}` : shown(res));
      }
    } else if (rule?.status === 410 || ['404', ''].includes(row?.status)) {
      const want = rule ? '410' : '404';
      if (res.status === 410 || res.status === 404) add(res.status === 404 && rule ? 'warn' : 'ok', group, from, want, String(res.status), res.status === 404 && rule ? 'به‌جای ۴۱۰، ۴۰۴ آمد؛ روی Netlify و Cloudflare طبیعی است و برای گوگل فرقی ندارد.' : row?.status === '' ? 'هنوز تصمیم‌نشده (docs/migration/old-urls.csv)' : '');
      else add('error', group, from, want, res.location ? `${shown(res)} → ${decodePath(res.location)}` : shown(res), res.status === 200 ? 'صفحه‌ای با کد ۲۰۰ جواب داد؛ شاید هنوز سایت قبلی روی این نشانی است.' : '');
    } else if (row?.status === 'same') {
      add(res.status === 200 ? 'ok' : 'error', group, from, '200', shown(res));
    } else if (row?.status === '301') {
      add('warn', group, from, `301 → ${row.new_path}`, shown(res), 'در old-urls.csv تصمیم گرفته شده ولی هنوز در redirects.json نیست: npm run migrate:apply');
    }
  });

  // 3. Each redirect target answers 200 and can be indexed. The review pages behind the SMS short links
  //    (/r/kg/ → /review/kindergarten/) are meant for parents only and stay noindex.
  const privateTarget = (pathname) => pathname.startsWith('/review/');
  for (const href of targets) {
    const res = await get(href);
    const robots = metaRobots(res.body) + res.robots;
    const { pathname, search } = new URL(href);
    const rel = pathname + search;
    const isPrivate = privateTarget(pathname);
    if (res.status !== 200) add('error', 'مقصد ریدایرکت', rel, '200', shown(res));
    else if (isPrivate) add(/noindex/i.test(robots) ? 'ok' : 'warn', 'مقصد ریدایرکت', rel, '200، noindex', /noindex/i.test(robots) ? '200، noindex' : '200، قابل ایندکس', /noindex/i.test(robots) ? '' : 'صفحه نظرخواهی باید از نتایج جست‌وجو بیرون بماند.');
    else if (/noindex/i.test(robots)) add('warn', 'مقصد ریدایرکت', rel, 'قابل ایندکس', 'noindex', 'این صفحه فعلاً عمداً noindex است (مثلاً «اخبار» تا اولین اطلاعیه)؛ وقتی محتوا گرفت خودکار ایندکس می‌شود.');
    else add('ok', 'مقصد ریدایرکت', rel, '200', '200');
  }

  // 4. robots.txt and every address in the new sitemap: 200, no redirect, canonical to itself, no noindex.
  const robots = await get(at('/robots.txt'));
  const sitemapLine = robots.body.match(/^sitemap:\s*(\S+)/im)?.[1];
  if (robots.status !== 200 || !sitemapLine) add('error', 'robots.txt', '/robots.txt', '200 با خط Sitemap', shown(robots));
  else add('ok', 'robots.txt', '/robots.txt', '200 با خط Sitemap', '200');
  if (/^user-agent:\s*\*\s*\n\s*disallow:\s*\/\s*$/im.test(robots.body)) add('error', 'robots.txt', '/robots.txt', 'اجازه خزیدن', 'Disallow: /', 'همه سایت برای گوگل بسته است.');
  const local = (u) => at(new URL(u).pathname); // sitemap addresses are on the live domain; fetch them from the checked host
  const index = await get(local(sitemapLine ?? `${live}/sitemap-index.xml`));
  const sitemaps = [...index.body.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => xmlText(m[1]));
  const urls = [];
  for (const s of sitemaps) {
    const res = await get(local(s));
    urls.push(...[...res.body.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => xmlText(m[1])));
  }
  if (!urls.length) add('error', 'نقشه سایت', '/sitemap-index.xml', 'فهرست صفحه‌ها', shown(index));
  await pool(urls, 4, async (u) => {
    const rel = new URL(u).pathname;
    const res = await get(local(u));
    const canonical = canonicalOf(res.body);
    if (res.status !== 200) add('error', 'نقشه سایت', rel, '200', res.location ? `${res.status} → ${res.location}` : shown(res));
    else if (/noindex/i.test(metaRobots(res.body) + res.robots)) add('error', 'نقشه سایت', rel, 'قابل ایندکس', 'noindex');
    else if (canonical && !same(new URL(canonical).pathname, rel)) add('error', 'نقشه سایت', rel, 'canonical به خودش', canonical);
    else add('ok', 'نقشه سایت', rel, '200', '200');
  });

  // 5. A missing page answers 404 (not 200) with the site's own 404 page.
  const missing = await get(at(`/km-check-${Date.now().toString(36)}/`));
  if (missing.status !== 404) add('error', 'صفحه ۴۰۴', '/km-check-…/', '404', shown(missing), missing.status === 200 ? 'صفحه نبود ولی ۲۰۰ آمد (soft 404).' : '');
  else if (!missing.body.includes('این صفحه پیدا نشد')) add('warn', 'صفحه ۴۰۴', '/km-check-…/', 'صفحه ۴۰۴ سایت', 'صفحه پیش‌فرض هاست', 'هاست صفحه ۴۰۴ خودش را نشان می‌دهد (docs/migration.md، بخش هاست).');
  else add('ok', 'صفحه ۴۰۴', '/km-check-…/', '404', '404');

  // 6. One address for the whole site: http → https, www ↔ bare domain. Only for a real domain.
  const { hostname, protocol } = new URL(origin);
  if (!/^(localhost|[\d.]+)$/.test(hostname) && protocol === 'https:') {
    const other = hostname.startsWith('www.') ? hostname.slice(4) : `www.${hostname}`;
    for (const [label, url] of [['http', `http://${hostname}/`], ['www', `https://${other}/`]]) {
      const res = await get(url);
      const ok = [301, 308].includes(res.status) && res.location && new URL(res.location, url).origin === origin;
      add(ok ? 'ok' : res.status === 0 ? 'warn' : 'error', 'یک نشانی برای کل سایت', url, `301 → ${origin}/`, res.location ? `${shown(res)} → ${res.location}` : shown(res), !ok && label === 'www' && res.status === 0 ? `دامنه ${other} تعریف نشده؛ اگر کسی با آن لینک نمی‌دهد، مشکلی نیست.` : '');
    }
  }

  // Report, in the order of the sections above
  const groups = ['صفحه اصلی', 'نشانی قدیمی', 'لینک کوتاه', 'مقصد ریدایرکت', 'robots.txt', 'نقشه سایت', 'صفحه ۴۰۴', 'یک نشانی برای کل سایت'];
  report.sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || a.url.localeCompare(b.url, 'fa'));
  const errors = report.filter((r) => r.level === 'error');
  const warns = report.filter((r) => r.level === 'warn');
  const date = new Date().toISOString().slice(0, 10);
  const table = (rows) => ['| بخش | نشانی | انتظار | نتیجه | توضیح |', '|---|---|---|---|---|', ...rows.map((r) => `| ${r.group} | \`${r.url}\` | ${r.expected} | ${r.got} | ${r.detail} |`)].join('\n');
  const md = [
    `# بررسی انتقال سایت: ${origin}`,
    '',
    `تاریخ: ${date}. ${report.length} مورد بررسی شد: ${report.length - errors.length - warns.length} درست، ${warns.length} هشدار، ${errors.length} خطا.`,
    '',
    ...(errors.length ? ['## خطاها', '', table(errors), ''] : []),
    ...(warns.length ? ['## هشدارها', '', table(warns), ''] : []),
    '## همه موارد',
    '',
    table(report),
    '',
  ].join('\n');
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, md);
  }
  console.log(`${origin}: ${report.length} مورد، ${errors.length} خطا، ${warns.length} هشدار${out ? ` (گزارش: ${out})` : ''}`);
  for (const r of [...errors, ...warns]) console.log(`  ${r.level === 'error' ? '✗' : '⚠'} [${r.group}] ${r.url}: انتظار ${r.expected}، نتیجه ${r.got}${r.detail ? `. ${r.detail}` : ''}`);
  process.exit(errors.length ? 1 : 0);
}

const commands = { import: runImport, apply: runApply, nginx: runNginx, check: runCheck };
if (!commands[command]) fail('دستور: import | apply | nginx | check (راهنما: docs/migration.md)');
await commands[command]();

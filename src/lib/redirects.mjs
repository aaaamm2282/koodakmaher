/**
 * Redirects from the old site's addresses (src/content/settings/redirects.json, editable in the CMS
 * under «تنظیمات عمومی ← ریدایرکت‌ها»).
 *
 * One list, several outputs, so every host gets the same rules:
 * - .htaccess   Apache / LiteSpeed (cPanel, DirectAdmin and most Iranian shared hosting)
 * - _redirects  Netlify and Cloudflare Pages
 * - nginx       a snippet for the server block (npm run migrate:nginx)
 * - Astro       instant meta-refresh pages, only for hosts that cannot redirect (STATIC_REDIRECT_PAGES=1)
 *
 * Old WordPress addresses are Persian and arrive percent-encoded (%D8%AF…). Apache and nginx match the
 * decoded path, Netlify needs the encoded one, so rules are kept decoded and each output encodes as needed.
 */
import fs from 'node:fs';
import { decodePath } from '../data/url-hints.mjs';

export const REDIRECTS_FILE = new URL('../content/settings/redirects.json', import.meta.url);

/** "/a/b/" and "/a/b" are the same old address. */
export const pathKey = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path);
const hasExtension = (path) => /\.[a-z0-9]{2,5}$/i.test(path);

/** Turns what a person typed (a full URL, an encoded path, no leading slash…) into a clean rule. */
export function normalizeRule(raw, site) {
  let from = String(raw?.from ?? '').trim();
  if (!from) return null;
  if (/^https?:\/\//i.test(from)) {
    try {
      from = new URL(from).pathname;
    } catch {
      /* keep as typed; validation reports it */
    }
  }
  from = decodePath(from.replace(/[?#].*$/, ''));
  if (!from.startsWith('/')) from = `/${from}`;

  const status = String(raw?.status ?? '301').trim() === '410' ? 410 : 301;
  let to = status === 410 ? '' : String(raw?.to ?? '').trim();
  if (to && site && /^https?:\/\//i.test(to)) {
    // A full address on our own domain becomes a path, so it works on preview domains too.
    const url = new URL(to);
    if (url.host === new URL(site).host) to = url.pathname + url.search + url.hash;
  }
  if (to && to.startsWith('/')) {
    // trailingSlash: 'always' — add the slash before any ?query, unless the target is a file.
    const [, path, rest] = to.match(/^([^?#]*)(.*)$/);
    if (!path.endsWith('/') && !hasExtension(path)) to = `${path}/${rest}`;
  } else if (to && !/^https?:\/\//i.test(to)) {
    to = `/${to}`;
  }
  return { from, to, status, note: String(raw?.note ?? '').trim() };
}

export function loadRedirects({ file = REDIRECTS_FILE, site } = {}) {
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (data.items ?? []).map((r) => normalizeRule(r, site)).filter(Boolean);
}

/**
 * Checks the list against the built site.
 * - isPage(path): a page of the new site exists at this path (an old address must never hide a real page)
 * - exists(path): a page or file exists (the target of a 301)
 * Chains (a → b, b → c) are collapsed to a → c so visitors and Google take one step; loops are errors.
 */
export function checkRedirects(rules, { isPage, exists } = {}) {
  const errors = [];
  const warnings = [];
  const byKey = new Map();
  for (const r of rules) {
    const key = pathKey(r.from);
    if (byKey.has(key)) errors.push(`«${r.from}» دو بار آمده است.`);
    byKey.set(key, r);
    if (r.from === '/' || (isPage && (isPage(r.from) || isPage(`${key}/`)))) errors.push(`«${r.from}» صفحه‌ای فعال در سایت جدید است و نباید ریدایرکت شود.`);
    if (r.status === 301 && !r.to) errors.push(`برای «${r.from}» نشانی تازه خالی است. اگر صفحه جایگزین ندارد، نوع را «۴۱۰» بگذارید.`);
  }

  // The rule (if any) whose old address is this target; targets may be typed encoded (%D8…) or not.
  const ruleAt = (to) => (to.startsWith('/') ? byKey.get(pathKey(decodePath(to.split(/[?#]/)[0]))) : undefined);
  const looped = new Set();
  const resolved = rules.map((r) => {
    if (r.status !== 301) return r;
    const steps = [r.to];
    const seen = new Set([pathKey(r.from)]);
    for (let next = ruleAt(r.to); next; next = ruleAt(steps.at(-1))) {
      if (seen.has(pathKey(next.from))) {
        errors.push(`ریدایرکت‌های «${r.from}» یک حلقه می‌سازند: ${[r.from, ...steps].map((s) => `«${s}»`).join(' ← ')}`);
        looped.add(r);
        return r;
      }
      seen.add(pathKey(next.from));
      if (next.status === 410) {
        warnings.push(`«${r.from}» به «${next.from}» می‌رسد که حذف‌شده (۴۱۰) است؛ «${r.from}» هم ۴۱۰ شد.`);
        return { ...r, status: 410, to: '' };
      }
      steps.push(next.to);
    }
    if (steps.length > 1) warnings.push(`${[r.from, ...steps].map((s) => `«${s}»`).join(' ← ')}: مستقیم به «${steps.at(-1)}» فرستاده شد.`);
    return { ...r, to: steps.at(-1) };
  });

  if (exists) {
    for (const r of resolved) {
      if (r.status !== 301 || !r.to.startsWith('/') || looped.has(r)) continue;
      const path = decodePath(r.to.split(/[?#]/)[0]);
      if (!exists(path)) errors.push(`مقصد «${r.to}» (برای «${r.from}») در سایت جدید وجود ندارد.`);
    }
  }
  return { rules: resolved, errors, warnings };
}

/** Both spellings of an old directory-like address: with and without the final slash. */
const variants = (from) => (hasExtension(from) || from === '/' ? [from] : [pathKey(from), `${pathKey(from)}/`]);
const encode = (path) => encodeURI(path);
const regexEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\x20');
const header = (comment, by = ['هنگام build', 'at build time']) =>
  [
    `${comment} ساخته‌شده خودکار از src/content/settings/redirects.json ${by[0]}؛ دستی ویرایش نکنید.`,
    `${comment} Generated from src/content/settings/redirects.json ${by[1]}. Do not edit by hand.`,
  ].join('\n');

/** Apache / LiteSpeed. Upload with the site; most cPanel hosts read it with no extra setup. */
export function toHtaccess(rules, { site } = {}) {
  const host = site ? new URL(site).host : null;
  const bare = host?.replace(/^www\./, '');
  const lines = [
    header('#'),
    '# Only directives that shared hosts allow wherever .htaccess redirects work (AllowOverride FileInfo);',
    '# «Options» or «Require» would turn the whole site into a 500 error on hosts that restrict them.',
    '',
    'AddDefaultCharset utf-8',
    'ErrorDocument 404 /404.html',
    'ErrorDocument 410 /404.html',
    '',
    '<IfModule mod_rewrite.c>',
    'RewriteEngine On',
    '',
    '# Host files are not pages',
    'RewriteRule ^(?:\\.htaccess|_redirects)$ - [R=404,L]',
    '',
  ];
  if (host) {
    const re = regexEscape(bare);
    lines.push(
      `# One address for the whole site: https://${host}`,
      host.startsWith('www.')
        ? `RewriteCond %{HTTP_HOST} ^${re}$ [NC]`
        : `RewriteCond %{HTTP_HOST} ^www\\.${re}$ [NC]`,
      `RewriteRule ^ https://${host}%{REQUEST_URI} [R=301,L]`,
      '# (X-Forwarded-Proto: behind a CDN that already speaks https, do not loop)',
      'RewriteCond %{HTTPS} !=on',
      'RewriteCond %{HTTP:X-Forwarded-Proto} !=https',
      `RewriteCond %{HTTP_HOST} ^${regexEscape(host)}$ [NC]`,
      `RewriteRule ^ https://${host}%{REQUEST_URI} [R=301,L]`,
      '',
    );
  }
  lines.push('# Old site addresses (R=301: moved, G: 410 gone)');
  for (const r of rules) {
    if (r.note) lines.push(`# ${r.note.replace(/\s+/g, ' ')}`);
    const key = pathKey(r.from).replace(/^\//, '');
    const pattern = `^${regexEscape(key)}${hasExtension(r.from) ? '' : '/?'}$`;
    lines.push(r.status === 410 ? `RewriteRule ${pattern} - [G]` : `RewriteRule ${pattern} ${r.to} [R=301,L]`);
  }
  lines.push('</IfModule>', '');
  return lines.join('\n');
}

/**
 * Netlify and Cloudflare Pages. Netlify matches the percent-encoded path; Cloudflare's matching of
 * non-ASCII paths is not documented, so both spellings are listed (the first match wins).
 * Cloudflare Pages only accepts 301/302/303/307/308 here, so 410 rules are left out: those
 * addresses simply get the 404 page, which Google treats the same way.
 */
export function toNetlify(rules) {
  const lines = [header('#'), ''];
  const gone = [];
  for (const r of rules) {
    if (r.status === 410) {
      gone.push(r.from);
      continue;
    }
    for (const v of variants(r.from)) {
      const forms = new Set([encode(v), v]);
      for (const f of forms) lines.push(`${f} ${r.to} 301`);
    }
  }
  if (gone.length) lines.push('', `# 410 (left to the 404 page on this host): ${gone.join(' ')}`);
  return lines.join('\n') + '\n';
}

/** nginx: paste inside the site's server { } block. */
export function toNginx(rules, { site } = {}) {
  const lines = [
    header('#', ['با npm run migrate:nginx', 'by npm run migrate:nginx']),
    '# Inside server { … } for the site. nginx matches the decoded path, so Persian addresses work as written.',
    '',
    'error_page 404 /404.html;',
    'error_page 410 /404.html;',
    '',
  ];
  for (const r of rules) {
    if (r.note) lines.push(`# ${r.note.replace(/\s+/g, ' ')}`);
    const target = r.to.includes('?') ? r.to : `${r.to}$is_args$args`;
    for (const v of variants(r.from)) {
      const loc = /[\s;{}"']/.test(v) ? `"${v.replace(/"/g, '\\"')}"` : v;
      lines.push(r.status === 410 ? `location = ${loc} { return 410; }` : `location = ${loc} { return 301 ${target}; }`);
    }
  }
  if (site) {
    const host = new URL(site).host;
    lines.push(
      '',
      `# Separate server blocks send http:// and the other host spelling to https://${host}, for example:`,
      `# server { listen 80; server_name ${host} ${host.startsWith('www.') ? host.slice(4) : `www.${host}`}; return 301 https://${host}$request_uri; }`,
    );
  }
  return lines.join('\n') + '\n';
}

/**
 * For hosts that cannot redirect at all: Astro then writes an instant meta-refresh page at each old
 * address, which Google treats as a permanent redirect. Files (sitemap_index.xml…) cannot be done this way.
 */
export function toAstroRedirects(rules) {
  return Object.fromEntries(
    rules.filter((r) => r.status === 301 && !hasExtension(r.from)).map((r) => [`${pathKey(r.from)}/`, r.to]),
  );
}

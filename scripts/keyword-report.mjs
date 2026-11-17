/**
 * Keyword map check and report.
 *
 *   npm run build && npm run seo:keywords
 *
 * Reads src/data/keyword-map.json and the built pages in dist/, checks that every page follows its
 * row of the map, and writes docs/keyword-map.md (Persian). Exits with 1 when a hard rule breaks,
 * so CI can stop a change that breaks the map:
 *   - the page's <title>, meta description and single H1 are the ones in the map
 *   - the main phrase appears in the title or H1, and in the page text
 *   - no two pages share a title, a description or a main phrase (keyword cannibalisation)
 * Softer signals (lengths, how many secondary phrases the page text covers) are reported only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/data/keyword-map.json'), 'utf8'));
const site = JSON.parse(fs.readFileSync(path.join(root, 'src/content/settings/site.json'), 'utf8'));
const city = typeof site.city === 'string' && site.city.trim() ? site.city.trim() : null;

if (!fs.existsSync(dist)) {
  console.error('dist/ not found: run `npm run build` first.');
  process.exit(1);
}

/* ---------- text helpers ---------- */
const withCity = (t) => t.replace(/\{([^{}]*)city\}/g, (_m, pre) => (city ? `${pre}${city}` : ''));
const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)));
const strip = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** For matching only: Arabic → Persian letters, Latin digits, no ZWNJ/spaces/punctuation, so «مهد کودک» = «مهدکودک». */
const norm = (s) => s
  .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[ۀة]/g, 'ه')
  .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  .replace(/[‌‏‎\s.,،؛:!?؟«»()\-–—|/]/g, '')
  .toLowerCase();
const has = (hay, needle) => norm(hay).includes(norm(needle));
const len = (s) => [...s].length;

/* ---------- read pages ---------- */
const read = (p) => {
  const file = path.join(dist, p, 'index.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  return {
    title: decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim(),
    description: decode(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? '').trim(),
    h1: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1])),
    h2: [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1])),
    text: strip(main),
    noindex: /<meta name="robots" content="[^"]*noindex/i.test(html),
  };
};

const rows = [];
const errors = [];
for (const entry of map.pages) {
  const page = read(entry.path);
  const expectTitle = city && entry.cityTitle ? withCity(entry.cityTitle) : entry.title;
  const expectDesc = withCity(entry.description).replace(/\s{2,}/g, ' ');
  const expectH1 = withCity(entry.h1);
  const row = { entry, page, problems: [], notes: [] };
  if (!page) {
    row.problems.push('صفحه ساخته نشده است');
  } else {
    if (page.title !== expectTitle) row.problems.push(`عنوان با نقشه یکی نیست: «${page.title}»`);
    if (page.description !== expectDesc) row.problems.push('توضیح متا با نقشه یکی نیست');
    if (page.h1.length !== 1) row.problems.push(`${page.h1.length} تیتر H1 دارد (باید یکی باشد)`);
    else if (norm(page.h1[0]) !== norm(expectH1)) row.problems.push(`H1 با نقشه یکی نیست: «${page.h1[0]}»`);
    if (!has(page.title, entry.primary) && !has(page.h1[0] ?? '', entry.primary)) row.problems.push(`عبارت اصلی «${entry.primary}» در عنوان یا H1 نیست`);
    if (!has(page.text, entry.primary)) row.problems.push(`عبارت اصلی «${entry.primary}» در متن صفحه نیست`);
    if (page.noindex) row.notes.push('این صفحه noindex است');
    if (len(page.title) > 60) row.notes.push(`عنوان ${len(page.title)} نویسه است؛ گوگل ممکن است آن را کوتاه کند`);
    if (len(page.description) < 70 || len(page.description) > 165) row.notes.push(`توضیح متا ${len(page.description)} نویسه است (بهتر: ۷۰ تا ۱۶۵)`);
  }
  // secondary phrases: which ones the page text covers (report only)
  row.secondary = (entry.secondary ?? []).map((k) => {
    if (/\{[^{}]*city\}/.test(k) && !city) return { k, state: 'city' };
    const phrase = withCity(k);
    return { k: phrase, state: page && (has(page.text, phrase) || has(page.title, phrase)) ? 'yes' : 'no' };
  });
  rows.push(row);
}

// cannibalisation and duplicates across pages
const dupes = (key, label) => {
  const seen = new Map();
  for (const r of rows) {
    const v = key(r);
    if (!v) continue;
    const n = norm(v);
    if (seen.has(n)) {
      r.problems.push(`${label} با ${seen.get(n)} یکی است`);
    } else seen.set(n, r.entry.path);
  }
};
dupes((r) => r.page?.title, 'عنوان');
dupes((r) => r.page?.description, 'توضیح متا');
dupes((r) => r.entry.primary, 'عبارت اصلی');
// a page's main phrase used as another page's secondary phrase = two pages competing
for (const r of rows) {
  for (const other of rows) {
    if (other === r) continue;
    if ((other.entry.secondary ?? []).some((k) => norm(withCity(k)) === norm(r.entry.primary))) r.problems.push(`عبارت اصلی این صفحه در فهرست فرعی ${other.entry.path} هم آمده است`);
  }
}
for (const r of rows) for (const p of r.problems) errors.push(`${r.entry.path}: ${p}`);

/* ---------- write docs/keyword-map.md ---------- */
const fa = (n) => n.toLocaleString('fa-IR');
const cell = (s) => String(s).replace(/\|/g, '\\|'); // a | inside a Markdown table cell
const mark = { yes: '✓', no: '—', city: '(پس از تأیید شهر)' };
const today = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long' }).format(new Date());
let md = `# نقشه کلمات کلیدی

> این فایل را دستی ویرایش نکنید؛ از روی \`src/data/keyword-map.json\` و صفحه‌های ساخته‌شده با \`npm run build && npm run seo:keywords\` ساخته می‌شود. آخرین ساخت: ${today}.

## قاعده‌ها

- هر عبارت فقط به **یک صفحه** تعلق دارد تا صفحه‌های سایت با هم رقابت نکنند.
- عنوان (title)، توضیح متا و تیتر اصلی (H1) هر صفحه از همین نقشه خوانده می‌شود و این بررسی اگر یکی با نقشه نخواند خطا می‌دهد.
- عبارت‌هایی که نام شهر دارند تا وقتی شهر در پنل («تنظیمات عمومی» → «اطلاعات مؤسسه» → «شهر») تأیید نشده، به کار نمی‌روند. بعد از تأیید، عنوان صفحه‌های مراکز خودبه‌خود نسخه شهردار می‌شود.
- در صفحه کودکستان، «مهدکودک» عبارت فرعی است و در عنوان آمده، چون خانواده‌ها بیشتر با همین واژه جست‌وجو می‌کنند؛ نام رسمی واحد همچنان «کودکستان» است.
- عنوان پیشنهادی محتوای مؤسسه (ستون «عنوان اولیه») حفظ شده و فقط برای جست‌وجو دقیق‌تر شده است.

## وضعیت

${errors.length ? `**${fa(errors.length)} مورد نیاز به اصلاح دارد:**\n\n${errors.map((e) => `- ${e}`).join('\n')}` : 'همه صفحه‌ها با نقشه می‌خوانند. ✓'}

${city ? `شهر: ${city}` : 'شهر هنوز تأیید نشده است؛ عنوان‌ها نسخه بدون شهر هستند.'}

## صفحه‌ها

| صفحه | عبارت اصلی | عنوان | نویسه | H1 |
|---|---|---|---|---|
${rows.map((r) => `| \`${r.entry.path}\` | ${cell(r.entry.primary)} | ${cell(r.page?.title ?? '—')} | ${r.page ? fa(len(r.page.title)) : '—'} | ${cell(r.page?.h1[0] ?? '—')} |`).join('\n')}

## جزئیات هر صفحه
`;
for (const r of rows) {
  md += `\n### ${r.entry.path}\n\n`;
  md += `- **نیت جست‌وجو:** ${r.entry.intent}\n`;
  md += `- **عبارت اصلی:** ${r.entry.primary}\n`;
  if (r.entry.brief) md += `- **عنوان اولیه (محتوای مؤسسه):** ${r.entry.brief}\n`;
  md += `- **عنوان:** ${r.page?.title ?? '—'}\n`;
  if (r.entry.cityTitle) md += `- **عنوان پس از تأیید شهر:** ${r.entry.cityTitle.replace(/\{([^{}]*)city\}/g, '$1[شهر]')}\n`;
  md += `- **توضیح متا (${r.page ? fa(len(r.page.description)) : '—'} نویسه):** ${r.page?.description ?? '—'}\n`;
  md += `- **H1:** ${r.page?.h1.join(' / ') || '—'}\n`;
  if (r.page?.h2.length) md += `- **H2ها:** ${r.page.h2.slice(0, 8).join('، ')}${r.page.h2.length > 8 ? '…' : ''}\n`;
  if (r.secondary.length) md += `- **عبارت‌های فرعی در متن صفحه:** ${r.secondary.map((s) => `${s.k} ${mark[s.state]}`).join('، ')}\n`;
  if (r.notes.length) md += `- **یادداشت:** ${r.notes.join('؛ ')}\n`;
  if (r.problems.length) md += `- **نیاز به اصلاح:** ${r.problems.join('؛ ')}\n`;
}
md += `\n## موضوع‌های مقاله (هر کدام یک مقاله)\n\n| عبارت | نیت | دسته | پیوند به |\n|---|---|---|---|\n`;
md += map.articles.map((a) => `| ${cell(a.keyword)} | ${cell(a.intent)} | ${cell(a.category)} | ${a.links.map((l) => `\`${l}\``).join('، ')} |`).join('\n');
md += `\n\nتقویم انتشار این موضوع‌ها: \`docs/content-calendar.md\`.\n`;
md += `\n## تغییر نقشه\n\n1. ردیف صفحه را در \`src/data/keyword-map.json\` عوض کنید (عبارت اصلی، فرعی‌ها، عنوان، توضیح، H1).\n2. اگر H1 یا متن صفحه باید عوض شود، همان را در فایل صفحه (\`src/pages/...\`) هم تغییر دهید.\n3. \`npm run build && npm run seo:keywords\` را اجرا کنید؛ اگر چیزی نخواند، فهرست ایرادها چاپ می‌شود و همین فایل به‌روز می‌شود.\n`;

fs.writeFileSync(path.join(root, 'docs/keyword-map.md'), md);
console.log(`${rows.length} pages checked, ${errors.length} problem(s). Report: docs/keyword-map.md`);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

/**
 * Monthly report: Google search (a Search Console export), the keyword map's target phrases, and the forms
 * (the CSV files the form handler keeps on the host). From the forms only counts are read into the report;
 * names, phone numbers and messages never are.
 *
 *   npm run report:monthly -- --gsc ~/Downloads/gsc --forms ~/Downloads/forms      last month
 *   npm run report:monthly -- --month 1405-08 --gsc … --forms …                  another month
 *
 * --gsc    the unzipped folder of a Search Console export: Performance → Search results → Date: the month
 *          (Custom) → Export → Download CSV. Its files (Queries, Pages, Dates, Devices…) are recognised by
 *          name or content, in English or Persian. Do not use «Compare» for the export.
 * --forms  a folder with register.csv, contact.csv, careers.csv and notify.csv, downloaded from the host's
 *          form folder (storage_dir in form-config.php).
 * Either may be left out; its part of the report then stays empty.
 *
 * Writes reports/<month>.md (Persian; maps reviews and site analytics are tables to fill in by hand) and
 * reports/<month>.json, which next month's report reads to show the change. reports/ stays on this
 * computer (.gitignore). Guide: docs/monthly-report.md
 */
import '../src/lib/load-env.mjs'; // .env settings, before anything reads process.env
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, toLatinDigits } from './lib/csv.mjs';
import { loadRedirects, pathKey } from '../src/lib/redirects.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'reports');
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : (args[i + 1] ?? '');
};
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
const home = (p) => (p ? p.replace(/^~(?=$|\/)/, process.env.HOME ?? '~') : p);

/* ---------- Persian calendar ---------- */
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const persianFmt = (timeZone) =>
  new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' });
const tehran = persianFmt('Asia/Tehran');
const utc = persianFmt('UTC');
/** Persian year, month and day of a moment (in Tehran), or of a calendar day given as YYYY-MM-DD */
const persian = (d) => {
  const parts = (typeof d === 'string' ? utc.formatToParts(new Date(`${d}T12:00:00Z`)) : tehran.formatToParts(d));
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
};
const key = ({ y, m }) => `${y}-${String(m).padStart(2, '0')}`;
const fa = (n, digits = 0) =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('fa-IR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const faPct = (n) => (n == null || Number.isNaN(n) ? '—' : `${fa(n * 100, 1)}٪`);

const monthArg = opt('month');
let month;
if (monthArg) {
  const m = toLatinDigits(monthArg).match(/^(\d{4})[-/](\d{1,2})$/);
  if (!m || +m[2] < 1 || +m[2] > 12) fail('ماه را به شکل ۱۴۰۵-۰۸ بدهید: --month 1405-08');
  month = { y: +m[1], m: +m[2] };
} else {
  const now = persian(new Date());
  month = now.m === 1 ? { y: now.y - 1, m: 12 } : { y: now.y, m: now.m - 1 };
}
const monthKey = key(month);
const monthName = `${MONTHS[month.m - 1]} ${fa(month.y).replace(/٬/g, '')}`;
const prevKey = key(month.m === 1 ? { y: month.y - 1, m: 12 } : { y: month.y, m: month.m - 1 });
// The Gregorian days of the month
const days = [];
for (let t = Date.UTC(month.y + 621, 1, 1); t < Date.UTC(month.y + 622, 3, 1); t += 864e5) {
  const iso = new Date(t).toISOString().slice(0, 10);
  if (key(persian(iso)) === monthKey) days.push(iso);
}
const [firstDay, lastDay] = [days[0], days.at(-1)];

/* ---------- numbers as Search Console writes them (English or Persian) ---------- */
const decimal = (s) => {
  const t = toLatinDigits(s ?? '').replace(/[٬,\s%٪]/g, '').replace('٫', '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
};

/* ---------- Persian text, compared loosely (ي/ی، ك/ک، half-space or space) ---------- */
const norm = (s) =>
  toLatinDigits(String(s ?? ''))
    .toLowerCase()
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/ۀ/g, 'ه').replace(/[ـً-ْ]/g, '')
    .replace(/[‌‍‎‏]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const words = (s) => norm(s).split(' ').filter(Boolean);

/* ---------- Search Console ---------- */
const warnings = [];
const gscDir = home(opt('gsc'));
const gsc = { files: [] };
if (gscDir) {
  if (!fs.existsSync(gscDir) || !fs.statSync(gscDir).isDirectory()) fail(`پوشه‌ی خروجی سرچ کنسول پیدا نشد: ${gscDir} (فایل ZIP را اول باز کنید)`);
  const NAMES = [
    ['queries', /quer|پرسمان|پرس.?و.?جو|جست.?و.?جو|عبارت/i],
    ['pages', /page|صفحه/i],
    ['countries', /countr|کشور/i],
    ['devices', /device|دستگاه/i],
    ['appearance', /appearance|ظاهر/i],
    ['dates', /date|تاریخ/i],
    ['filters', /filter|فیلتر|صافی/i],
  ];
  for (const f of fs.readdirSync(gscDir).filter((f) => /\.csv$/i.test(f))) {
    const rows = parseCsv(fs.readFileSync(path.join(gscDir, f), 'utf8'));
    if (!rows.length) continue;
    const [head, ...body] = rows;
    const col = (re) => head.findIndex((h) => re.test(h));
    const many = (re) => head.filter((h) => re.test(h)).length > 1;
    let kind = NAMES.find(([, re]) => re.test(f))?.[0];
    // Content wins over the name: addresses are pages, YYYY-MM-DD are dates
    const firsts = body.map((r) => toLatinDigits(r[0] ?? ''));
    if (firsts.length && firsts.every((v) => /^https?:\/\//.test(v))) kind = 'pages';
    else if (firsts.length && firsts.every((v) => /^\d{4}-\d{2}-\d{2}$/.test(v))) kind = 'dates';
    if (!kind) continue;
    gsc.files.push(`${f} (${kind})`);
    if (kind === 'filters') {
      gsc.filters = body.map((r) => r.filter(Boolean).join(': '));
      continue;
    }
    const iC = col(/click|کلیک/i);
    const iI = col(/impression|نمایش|بازدید/i);
    const iT = col(/ctr|نرخ/i);
    const iP = col(/position|موقعیت|جایگاه|رتبه/i);
    if (many(/click|کلیک/i)) fail(`«${f}» دو ستون کلیک دارد: خروجی را بدون «Compare» (مقایسه) بگیرید.`);
    if (iC === -1 || iI === -1) continue;
    gsc[kind] = body.map((r) => ({
      key: (r[0] ?? '').trim(),
      clicks: decimal(r[iC]),
      impressions: decimal(r[iI]),
      ctr: iT !== -1 ? decimal(r[iT]) / 100 : undefined,
      position: iP !== -1 ? decimal(r[iP]) : undefined,
    }));
  }
  if (!gsc.queries && !gsc.pages && !gsc.dates) fail(`در ${gscDir} فایل‌های خروجی سرچ کنسول (Queries، Pages، Dates) پیدا نشد.`);
  if (gsc.dates?.length) {
    const ds = gsc.dates.map((d) => toLatinDigits(d.key)).sort();
    gsc.range = [ds[0], ds.at(-1)];
    if (ds[0] !== firstDay || ds.at(-1) !== lastDay) {
      warnings.push(`بازه‌ی خروجی سرچ کنسول (${ds[0]} تا ${ds.at(-1)}) با ${monthName} (${firstDay} تا ${lastDay}) یکی نیست؛ در سرچ کنسول Date ← Custom را روی همین ماه بگذارید.`);
    }
  } else {
    warnings.push('فایل Dates در خروجی سرچ کنسول نبود؛ جمع‌ها از جدول پرسمان‌ها حساب شده و کمتر از واقعی است (گوگل پرسمان‌های کم‌تکرار را نشان نمی‌دهد).');
  }
}
/** Sums of a list of rows; position is the average weighted by impressions, as Search Console does */
const total = (rows) => {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const weighted = rows.filter((r) => r.position != null).reduce((s, r) => s + r.position * r.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : undefined, position: impressions ? weighted / impressions : undefined };
};
const totals = gsc.dates ? total(gsc.dates) : gsc.queries ? total(gsc.queries) : null;

/* ---------- keyword map phrases ---------- */
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/data/keyword-map.json'), 'utf8'));
const site = JSON.parse(fs.readFileSync(path.join(root, 'src/content/settings/site.json'), 'utf8'));
const city = typeof site.city === 'string' && site.city.trim() ? site.city.trim() : null;
const withCity = (t) => (t.includes('city}') ? (city ? t.replace(/\{([^{}]*)city\}/g, (_m, pre) => `${pre}${city}`) : null) : t);
const targets = [
  ...map.pages.flatMap((p) => [
    { page: p.path, phrase: withCity(p.primary), main: true },
    ...(p.secondary ?? []).map((s) => ({ page: p.path, phrase: withCity(s), main: false })),
  ]),
  ...(map.articles ?? []).map((a) => ({ page: 'مقاله', phrase: withCity(a.keyword), main: true })),
].filter((t) => t.phrase);
const isBrand = (q) => /ماهر|مانا/.test(q);
const phraseStats = (phrase) => {
  if (!gsc.queries) return null;
  const n = norm(phrase);
  const w = words(phrase);
  const exact = gsc.queries.find((q) => norm(q.key) === n);
  const related = gsc.queries.filter((q) => {
    const qw = new Set(words(q.key));
    return w.every((x) => qw.has(x));
  });
  return { exact: exact ?? null, related: related.length ? { ...total(related), count: related.length } : null };
};
const phrases = targets.map((t) => ({ ...t, stats: phraseStats(t.phrase) }));

/* ---------- forms (counts only) ---------- */
const formsDir = home(opt('forms'));
const FORM_FILES = { register: 'پیش‌ثبت‌نام', contact: 'پیام از فرم تماس', careers: 'درخواست همکاری', notify: '«خبرم کنید» متوسطه دوم' };
const forms = {};
const count = (map, k) => map.set(k, (map.get(k) ?? 0) + 1);
/** How a parent says they heard of the institute (a free answer) → a group, so no answer is ever copied as is */
// In order: the first group whose words appear wins (approximate on purpose; the answers are free text)
const HEARD = [
  ['دوستان، آشنایان و خانواده', /دوست|آشنا|فامیل|همسایه|خانواده|همکار|معرفی|والدین|اولیا/i],
  ['دانش‌آموز یا خواهر و برادر در مؤسسه', /خواهر|برادر|فرزند.*(قبل|دیگر)|قبلا|قبلاً|دانش.?آموز/i],
  ['اینستاگرام', /اینستا|insta|پیج/i],
  ['جست‌وجو در گوگل یا سایت', /گوگل|google|جست|جستجو|سرچ|search|سایت|اینترنت/i],
  ['پیام‌رسان (تلگرام، ایتا، بله، واتساپ، روبیکا)', /تلگرام|ایتا|واتس|روبیکا|پیام.?رسان|telegram|eitaa|whatsapp|rubika/i],
  ['نقشه (نشان، بلد، گوگل‌مپ)', /نشان|بلد|نقشه|map|مپ/i],
  ['تابلو، بنر و بروشور', /تابلو|بنر|بروشور|تراکت|پوستر|بیلبورد|رد شد|از جلو/i],
];
const heardGroup = (v) => (v.trim() ? (HEARD.find(([, re]) => re.test(v))?.[0] ?? 'سایر پاسخ‌ها') : 'بی‌پاسخ');
/** Where the visit came from: the UTM tags, else the referring site, else direct */
const visitSource = (get) => {
  const s = get('utm_source');
  if (s) return [s, get('utm_medium')].filter(Boolean).join(' / ');
  const ref = get('آمده از');
  if (!ref) return 'مستقیم یا نامشخص';
  let host = ref;
  try {
    host = new URL(ref).host;
  } catch {}
  host = host.replace(/^www\./, '');
  if (/google\./.test(host)) return 'جست‌وجوی گوگل';
  if (/bing\.|yahoo\.|duckduckgo\./.test(host)) return 'جست‌وجوی دیگر';
  if (/instagram\.|l\.instagram/.test(host)) return 'اینستاگرام';
  if (/neshan|balad/.test(host)) return 'نقشه (نشان یا بلد)';
  return host;
};
if (formsDir) {
  if (!fs.existsSync(formsDir) || !fs.statSync(formsDir).isDirectory()) fail(`پوشه‌ی فرم‌ها پیدا نشد: ${formsDir}`);
  let foundAny = false;
  for (const [kind, label] of Object.entries(FORM_FILES)) {
    const file = path.join(formsDir, `${kind}.csv`);
    if (!fs.existsSync(file)) continue;
    foundAny = true;
    const [head = [], ...body] = parseCsv(fs.readFileSync(file, 'utf8'));
    const iTime = head.indexOf('زمان');
    if (iTime === -1) {
      warnings.push(`ستون «زمان» در ${kind}.csv نیست؛ این فایل خوانده نشد.`);
      continue;
    }
    const f = { label, count: 0, byUnit: new Map(), heard: new Map(), sources: new Map(), byWeekday: new Map() };
    for (const r of body) {
      const ymd = toLatinDigits(r[iTime] ?? '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || key(persian(ymd)) !== monthKey) continue;
      const get = (h) => {
        const i = head.indexOf(h);
        return i === -1 ? '' : String(r[i] ?? '').replace(/^'/, '').trim();
      };
      f.count++;
      if (head.includes('واحد')) count(f.byUnit, get('واحد') || 'نامشخص');
      if (head.includes('آشنایی از')) count(f.heard, heardGroup(get('آشنایی از')));
      count(f.sources, visitSource(get));
    }
    forms[kind] = f;
  }
  if (!foundAny) warnings.push(`در ${formsDir} هیچ‌کدام از فایل‌های register.csv، contact.csv، careers.csv و notify.csv نبود.`);
}
const formTotals = Object.fromEntries(Object.entries(forms).map(([k, f]) => [k, f.count]));

/* ---------- last month, for the change ---------- */
const prevFile = path.join(outDir, `${prevKey}.json`);
const prev = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, 'utf8')) : null;
const delta = (now, before, { lowerIsBetter = false, digits = 0 } = {}) => {
  if (now == null || before == null) return '—';
  const d = now - before;
  if (Math.abs(d) < (digits ? 0.05 : 0.5)) return 'بدون تغییر';
  const better = lowerIsBetter ? d < 0 : d > 0;
  return `${better ? '▲' : '▼'} ${fa(Math.abs(d), digits)}`;
};

/* ---------- next month's tasks, from the numbers ---------- */
const tasks = [];
const redirects = new Map(loadRedirects({ site: process.env.SITE_URL || 'https://mahermana.com' }).map((r) => [pathKey(r.from), r]));
const isOldAddress = (u) => {
  try {
    return redirects.has(pathKey(decodeURIComponent(new URL(u).pathname)));
  } catch {
    return false;
  }
};
// Close to the top: on the first two result pages, with enough searches to matter (each phrase once)
const near = new Map();
for (const p of phrases) {
  const r = p.stats?.related;
  if (r && r.position > 3.5 && r.position <= 20 && r.impressions >= 20 && !near.has(p.phrase)) near.set(p.phrase, { ...p, r });
}
for (const { phrase, page, r } of [...near.values()].sort((a, b) => b.r.impressions - a.r.impressions)) {
  const where = page === 'مقاله' ? 'مقاله‌ی این موضوع' : `صفحه‌ی ${page}`;
  tasks.push(`«${phrase}»: جایگاه ${fa(r.position, 1)} (صفحه‌ی ${r.position <= 10 ? 'اول' : 'دوم'} نتایج) با ${fa(r.impressions)} نمایش. ${where} را درباره‌ی همین موضوع کامل‌تر کنید و از صفحه‌های مرتبط به آن پیوند بدهید.`);
}
for (const pg of gsc.pages ?? []) {
  if (!isOldAddress(pg.key) && pg.impressions >= 100 && pg.position != null && pg.position <= 10 && pg.ctr != null && pg.ctr < 0.015) {
    tasks.push(`${decodeURI(new URL(pg.key).pathname)}: ${fa(pg.impressions)} نمایش ولی نرخ کلیک ${faPct(pg.ctr)}؛ عنوان و توضیح صفحه را در نقشه کلمات کلیدی روشن‌تر و جذاب‌تر کنید.`);
  }
}
const covered = (q) => phrases.some((p) => words(p.phrase).every((w) => new Set(words(q)).has(w)));
const newTopics = (gsc.queries ?? []).filter((q) => q.impressions >= 30 && !isBrand(norm(q.key)) && !covered(q.key)).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
if (newTopics.length) tasks.push(`جست‌وجوهایی که هیچ صفحه‌ای برایشان هدف نگرفته (موضوع مقاله یا بخش تازه؛ پیش از نوشتن به نقشه کلمات کلیدی اضافه شود): ${newTopics.map((q) => `«${q.key}» (${fa(q.impressions)} نمایش)`).join('، ')}.`);
const oldPages = (gsc.pages ?? []).filter((pg) => isOldAddress(pg.key));
if (oldPages.length) tasks.push(`${fa(oldPages.length)} نشانی سایت قبلی هنوز در نتایج گوگل دیده می‌شود (طبیعی در ماه‌های اول؛ ریدایرکت‌ها را نگه دارید): ${oldPages.slice(0, 5).map((pg) => decodeURI(new URL(pg.key).pathname)).join('، ')}.`);

/* ---------- write ---------- */
const table = (head, rows) => (rows.length ? [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n') : '_داده‌ای نیست._');
const pathOf = (u) => {
  try {
    return decodeURI(new URL(u).pathname);
  } catch {
    return u;
  }
};
const sorted = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
const units = fs
  .readdirSync(path.join(root, 'src/content/units'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'src/content/units', f), 'utf8')))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const md = [];
md.push(`# گزارش ماهانه‌ی سایت، ${monthName}`, '');
md.push(`از ${fa(persian(firstDay).d)} تا ${fa(persian(lastDay).d)} ${MONTHS[month.m - 1]} (${firstDay} تا ${lastDay}). ساخته‌شده با \`npm run report:monthly\`؛ راهنما: docs/monthly-report.md.`, '');
md.push(`منبع‌ها: ${[gscDir ? `خروجی سرچ کنسول (${gsc.files.join('، ')})` : 'سرچ کنسول: داده داده نشد', formsDir ? 'فایل‌های فرم از هاست' : 'فرم‌ها: داده داده نشد', prev ? `مقایسه با گزارش ${prevKey}` : 'گزارش ماه قبل نبود؛ ستون تغییر خالی است'].join('؛ ')}.`, '');
if (gsc.filters?.length) md.push(`فیلترهای خروجی سرچ کنسول: ${gsc.filters.join('، ')}`, '');
if (warnings.length) md.push('**هشدار:**', '', ...warnings.map((w) => `- ${w}`), '');

md.push('## خلاصه', '');
md.push(table(['شاخص', monthName, 'تغییر از ماه قبل'], [
  ...(totals ? [
    ['کلیک از جست‌وجوی گوگل', fa(totals.clicks), delta(totals.clicks, prev?.totals?.clicks)],
    ['نمایش در جست‌وجوی گوگل', fa(totals.impressions), delta(totals.impressions, prev?.totals?.impressions)],
    ['نرخ کلیک', faPct(totals.ctr), totals.ctr != null && prev?.totals?.ctr != null ? delta(totals.ctr * 100, prev.totals.ctr * 100, { digits: 1 }) : '—'],
    ['میانگین جایگاه', fa(totals.position, 1), delta(totals.position, prev?.totals?.position, { lowerIsBetter: true, digits: 1 })],
  ] : []),
  ...Object.entries(forms).map(([k, f]) => [f.label, fa(f.count), delta(f.count, prev?.forms?.[k])]),
]), '');

if (gsc.queries || gsc.pages || gsc.devices) {
  md.push('## جست‌وجوی گوگل', '');
  if (gsc.queries) {
    md.push('### ۱۵ جست‌وجوی پرکلیک', '');
    const top = [...gsc.queries].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 15);
    md.push(table(['جست‌وجو', 'کلیک', 'نمایش', 'نرخ کلیک', 'جایگاه'], top.map((q) => [q.key, fa(q.clicks), fa(q.impressions), faPct(q.ctr), fa(q.position, 1)])), '');
  }
  if (gsc.pages) {
    md.push('### ۱۵ صفحه‌ی پرکلیک', '');
    const top = [...gsc.pages].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 15);
    md.push(table(['صفحه', 'کلیک', 'نمایش', 'نرخ کلیک', 'جایگاه'], top.map((pg) => [`\`${pathOf(pg.key)}\``, fa(pg.clicks), fa(pg.impressions), faPct(pg.ctr), fa(pg.position, 1)])), '');
  }
  const articles = (gsc.pages ?? []).filter((pg) => /^\/(blog|news)\/[^/]+\/$/.test(pathOf(pg.key)));
  if (gsc.pages) {
    md.push('### مقاله‌ها و اطلاعیه‌ها', '');
    md.push(articles.length ? table(['صفحه', 'کلیک', 'نمایش', 'نرخ کلیک', 'جایگاه'], articles.sort((a, b) => b.impressions - a.impressions).map((pg) => [`\`${pathOf(pg.key)}\``, fa(pg.clicks), fa(pg.impressions), faPct(pg.ctr), fa(pg.position, 1)])) : '_هیچ مقاله یا اطلاعیه‌ای در این ماه در نتایج گوگل دیده نشده است._', '');
  }
  if (gsc.devices) {
    md.push('### دستگاه', '');
    md.push(table(['دستگاه', 'کلیک', 'نمایش', 'جایگاه'], gsc.devices.map((d) => [d.key, fa(d.clicks), fa(d.impressions), fa(d.position, 1)])), '');
  }
}

md.push('## عبارت‌های هدف (نقشه کلمات کلیدی)', '');
if (!gsc.queries) md.push('_برای این بخش فایل Queries از خروجی سرچ کنسول لازم است._', '');
else {
  md.push('«دقیق» همان عبارت است؛ «همه» یعنی هر جست‌وجویی که همه‌ی کلمه‌های عبارت را دارد (مثل «کودکستان خوب در …»). جایگاه کمتر بهتر است. عبارت‌های دارای `{city}` تا تأیید شهر کنار گذاشته شده‌اند.', '');
  const head = ['صفحه', 'عبارت', 'جایگاه دقیق', 'نمایش دقیق', 'جایگاه همه', 'نمایش همه', 'کلیک همه', 'تغییر جایگاه'];
  const line = (p) => {
    const s = p.stats;
    const before = prev?.phrases?.[p.phrase]?.position;
    return [p.page === 'مقاله' ? 'مقاله' : `\`${p.page}\``, p.phrase, s.exact ? fa(s.exact.position, 1) : '—', s.exact ? fa(s.exact.impressions) : '۰', s.related ? fa(s.related.position, 1) : '—', s.related ? fa(s.related.impressions) : '۰', s.related ? fa(s.related.clicks) : '۰', delta(s.related?.position, before, { lowerIsBetter: true, digits: 1 })];
  };
  md.push('### عبارت اصلی هر صفحه', '', table(head, phrases.filter((p) => p.main && p.page !== 'مقاله').map(line)), '');
  const others = phrases.filter((p) => !(p.main && p.page !== 'مقاله'));
  const seenOthers = others.filter((p) => p.stats?.related);
  md.push('### عبارت‌های فرعی و موضوع مقاله‌ها که در جست‌وجو دیده شده‌اند', '', table(head, seenOthers.sort((a, b) => b.stats.related.impressions - a.stats.related.impressions).map(line)), '');
  md.push(`${fa(others.length - seenOthers.length)} عبارت فرعی یا موضوع مقاله‌ی دیگر هنوز در این ماه نمایشی نداشته است.`, '');
}

md.push('## فرم‌ها', '');
if (!formsDir) md.push('_پوشه‌ی فرم‌ها داده نشد (`--forms`)._', '');
for (const [kind, f] of Object.entries(forms)) {
  md.push(`### ${f.label}: ${fa(f.count)}`, '');
  if (!f.count) continue;
  if (f.byUnit.size) md.push('به تفکیک واحد:', '', table(['واحد', 'تعداد'], sorted(f.byUnit).map(([k, v]) => [k, fa(v)])), '');
  if (f.heard.size) md.push('پاسخ «چطور با ما آشنا شدید؟» (گروه‌بندی‌شده):', '', table(['گروه', 'تعداد'], sorted(f.heard).map(([k, v]) => [k, fa(v)])), '');
  if (kind === 'register' || kind === 'contact') md.push('منبع بازدیدی که به فرم رسید (UTM یا سایت ارجاع‌دهنده):', '', table(['منبع', 'تعداد'], sorted(f.sources).map(([k, v]) => [k, fa(v)])), '');
}

md.push('## نقشه‌ها و نظرها (دستی)', '');
md.push('از اپ نشان، بلد و گوگل‌مپ (یا پنل کسب‌وکار هر کدام) پر کنید. پاسخ به نظرهای تازه: docs/local-profiles.md.', '');
md.push(table(['واحد', 'گوگل‌مپ: امتیاز / نظرها', 'نشان: امتیاز / نظرها', 'بلد: امتیاز / نظرها', 'نظر تازه‌ی این ماه', 'بی‌پاسخ'], units.map((u) => [u.name, ' ', ' ', ' ', ' ', ' '])), '');

md.push('## آمار بازدید (دستی، از GA4 یا Umami)', '');
md.push(table(['شاخص', 'مقدار', 'کجا'], [
  ['بازدیدکننده', ' ', 'GA4: Reports ← Acquisition ← Overview؛ Umami: Visitors'],
  ['منبع‌های اصلی ورود', ' ', 'GA4: Traffic acquisition (Session source / medium)؛ Umami: Referrers'],
  ['فرم‌های فرستاده‌شده (`generate_lead`، به تفکیک `form` و `unit`)', ' ', 'GA4: Reports ← Engagement ← Events؛ Umami: Events'],
  ['کلیک روی تلفن و نقشه (`click_phone`، `click_map`)', ' ', 'همان‌جا'],
  ['صفحه‌های ۴۰۴ (`page_not_found`، پارامتر `path`)', ' ', 'نشانی‌های پرتکرار را در پنل ← ریدایرکت‌ها اضافه کنید'],
]), '');

md.push('## کارهای ماه بعد', '');
md.push(...(tasks.length ? tasks.map((t) => `- ${t}`) : ['- _پیشنهاد خودکاری از داده‌ها پیدا نشد._']), '- ', '');

fs.mkdirSync(outDir, { recursive: true });
const mdFile = path.join(outDir, `${monthKey}.md`);
fs.writeFileSync(mdFile, md.join('\n'));
fs.writeFileSync(
  path.join(outDir, `${monthKey}.json`),
  JSON.stringify({
    month: monthKey,
    range: [firstDay, lastDay],
    totals,
    forms: formTotals,
    phrases: Object.fromEntries(phrases.filter((p) => p.stats?.related).map((p) => [p.phrase, { position: p.stats.related.position, impressions: p.stats.related.impressions, clicks: p.stats.related.clicks }])),
  }, null, 2) + '\n',
);
console.log(`✓ ${path.relative(root, mdFile)} (${monthName})`);
for (const w of warnings) console.log(`! ${w}`);

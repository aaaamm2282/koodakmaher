/**
 * Which new page an address from the old site (WordPress, Persian slugs) most likely means.
 *
 * Used in two places:
 * - scripts/migrate.mjs: a first guess for every old URL found in a Search Console or WordPress export
 *   (a person reviews the guess before it becomes a redirect);
 * - the 404 page: «شاید دنبال این صفحه بودید» for an old address that has no redirect yet.
 *
 * Plain JavaScript on purpose, so Node scripts, astro.config and browser code can all import it.
 */

/**
 * Persian text reduced to letters for matching: Arabic yeh/kaf → Persian, alef forms → ا,
 * no diacritics, and no separators (space, ZWNJ, hyphen, underscore, slash, dot).
 * So «پیش-ثبت-نام»، «پیش‌ثبت‌نام» and «پیش ثبت نام» all become «پیشثبتنام».
 */
export function squash(text) {
  return String(text)
    .toLowerCase()
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/[آأإ]/g, 'ا')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[\s‌‍\-_/.+]+/g, '');
}

/** Decodes %D8… safely; a malformed sequence leaves the text as it was. */
export function decodePath(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

// Order matters: «پیش‌دبستان» must hit kindergarten before «دبستان» hits primary,
// and «متوسطه دوم» must hit the upper-secondary page before «متوسطه» hits middle school.
const unitRules = [
  ['kindergarten', ['کودکستان', 'مهدکودک', 'پیشدبستان', 'پیشدبستانی', 'kindergarten', 'preschool']],
  ['primary', ['دبستان', 'ابتدایی', 'primary', 'elementary']],
  ['high-school', ['متوسطهدوم', 'دبیرستاندوم', 'highschool']],
  ['middle-school', ['متوسطه', 'متوسطهاول', 'راهنمایی', 'دبیرستان', 'middleschool']],
  ['language', ['زبان', 'انگلیسی', 'language', 'english']],
  ['vocational', ['فنیوحرفه', 'فنیحرفه', 'اموزشگاهازاد', 'اموزشهایازاد', 'ازاد', 'vocational']],
];

const pageRules = [
  ['/register/', ['ثبتنام', 'پیشثبت', 'register', 'signup', 'admission']],
  ['/contact/', ['تماس', 'ارتباطباما', 'نشانی', 'ادرس', 'contact']],
  ['/about/', ['درباره', 'معرفی', 'about']],
  ['/careers/', ['همکاری', 'استخدام', 'career', 'jobs']],
  ['/news/', ['اخبار', 'خبر', 'رویداد', 'اطلاعیه', 'news', 'event']],
  ['/blog/', ['مقاله', 'وبلاگ', 'بلاگ', 'blog', 'article']],
  ['/workshops/', ['کارگاه', 'workshop']],
  ['/parents/', ['والدین', 'اولیا', 'parent']],
  ['/faq/', ['سوال', 'سؤال', 'پرسش', 'faq']],
  ['/method/', ['متد', 'method']],
  ['/path/', ['مسیررشد', 'path']],
  ['/privacy/', ['حریمخصوصی', 'privacy']],
  // An archive of the old site's sections; the closest new page is the list of units.
  ['/units/', ['دپارتمان', 'واحد', 'دوره', 'course', 'department', 'گالری', 'gallery']],
];

const prepared = (rules) => rules.map(([to, words]) => [to, words.map(squash)]);
const units = prepared(unitRules);
const pages = prepared(pageRules);
const find = (rules, text) => rules.find(([, words]) => words.some((w) => text.includes(w)))?.[0] ?? null;

/**
 * Best guess for an old path, e.g. «/پیش-ثبت-نام-کودکستان/» → «/register/?unit=kindergarten».
 * Returns null when nothing in the address points to a page.
 * `strong` is true when the address names a unit or a specific page, false for archive-like guesses.
 */
export function suggestPath(path) {
  const text = squash(decodePath(String(path)).replace(/\?.*$/, ''));
  if (!text) return null;
  const unit = find(units, text);
  const page = find(pages, text);
  if (page === '/register/') return { to: unit ? `/register/?unit=${unit}` : '/register/', strong: true };
  if (unit) return { to: `/units/${unit}/`, strong: true };
  if (page) return { to: page, strong: page !== '/units/' };
  return null;
}

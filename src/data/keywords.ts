/**
 * Keyword map (src/data/keyword-map.json): one target phrase per page, and the title and meta
 * description built from it. Report and checks: node scripts/keyword-report.mjs → docs/keyword-map.md
 */
import map from './keyword-map.json';
import { site } from './site';

type Page = { path: string; primary: string; secondary: string[]; title: string; cityTitle?: string; description: string; h1: string; intent: string; brief?: string };
const pages = new Map((map.pages as Page[]).map((p) => [p.path, p]));

/** "{ در city}" → " در مشهد" once the city is confirmed, otherwise removed. */
export const withCity = (text: string, city = site.city) => text.replace(/\{([^{}]*)city\}/g, (_m, pre: string) => (city ? `${pre}${city}` : ''));

export function pageSeo(path: string): { title: string; description: string; primary: string; h1: string } {
  const p = pages.get(path);
  if (!p) throw new Error(`No keyword-map entry for ${path}`);
  const title = site.city && p.cityTitle ? withCity(p.cityTitle) : p.title;
  return { title, description: withCity(p.description).replace(/\s{2,}/g, ' '), primary: p.primary, h1: withCity(p.h1) };
}

/** Internal links from an article to the pages its category supports. */
export const categoryLinks: Record<string, { href: string; label: string }[]> = {
  'شناخت کودک': [{ href: '/units/kindergarten/', label: 'کودکستان کودک ماهر' }, { href: '/method/', label: 'متد کودک ماهر' }],
  'مهارت‌های نرم': [{ href: '/workshops/', label: 'کارگاه‌های مهارتی' }, { href: '/units/primary/', label: 'دبستان مهارت‌محور' }],
  'انتخاب رشته و مسیر': [{ href: '/units/middle-school/', label: 'متوسطه اول پسرانه' }, { href: '/path/', label: 'مسیر رشد ۳ تا ۱۸ سال' }],
  'یادگیری در خانه': [{ href: '/parents/', label: 'برای والدین' }, { href: '/units/language/', label: 'آموزشگاه زبان' }],
  'از کلاس‌های ما': [{ href: '/workshops/', label: 'کارگاه‌ها' }, { href: '/method/', label: 'متد کودک ماهر' }],
};

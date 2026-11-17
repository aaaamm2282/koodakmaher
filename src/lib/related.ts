/**
 * Internal links at the end of each unit page: the stage before and after on the 3–18 path, and
 * the pages that explain how the unit works. Texts come from the units' own short lines
 * (src/content/units/*.json) or from the pages' own subtitles, so no new claim is introduced here.
 */
import { unitBySlug } from '../data/site';

type Link = { href: string; label: string; text: string };

const unitLink = (slug: string, prefix = ''): Link => {
  const u = unitBySlug(slug);
  return { href: `/units/${u.slug}/`, label: `${prefix}${u.name}${u.soon ? ' (به‌زودی)' : ''}`, text: u.short ?? u.ages ?? '' };
};

export const pages: Record<string, Link> = {
  method: { href: '/method/', label: 'متد کودک ماهر', text: 'روشی برای اینکه کودک خودش را با شاهد بشناسد، نه با حدس دیگران.' },
  path: { href: '/path/', label: 'مسیر رشد ۳ تا ۱۸ سال', text: 'چرخه پیش‌بینی، تجربه، بازبینی در همه سنین یکی است؛ فقط شکلش با سن کودک عوض می‌شود.' },
  workshops: { href: '/workshops/', label: 'کارگاه‌های مهارتی', text: 'کارگاه‌ها لایه «تجربه» در متد ما هستند: خلاقیت، کار با چوب، نقاشی خلاق، هوش مصنوعی و الکترونیک.' },
  parents: { href: '/parents/', label: 'برای والدین', text: 'پرونده رشد چیست، در خانه چه کنیم و چطور در جریان پیشرفت فرزندمان هستیم.' },
};

export const related: Record<string, Link[]> = {
  kindergarten: [unitLink('primary', 'مرحله بعد: '), pages.method, unitLink('language')],
  primary: [unitLink('kindergarten', 'مرحله قبل: '), unitLink('middle-school', 'مرحله بعد: '), pages.workshops],
  'middle-school': [unitLink('primary', 'مرحله قبل: '), unitLink('high-school', 'مرحله بعد: '), pages.path],
  language: [unitLink('kindergarten'), pages.method, pages.parents],
  vocational: [unitLink('middle-school'), pages.path, pages.workshops],
};

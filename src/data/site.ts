/**
 * اطلاعات پایه‌ی مؤسسه. منبع: docs/content-brief.md و پاسخ‌های مؤسسه (۱۴۰۵/۰۸/۲۴).
 *
 * داده‌های قابل‌ویرایش در پوشه‌ی src/content است و از پنل مدیریت (/admin/) هم
 * ویرایش می‌شود. این فایل فقط آن‌ها را می‌خواند، تمیز می‌کند و با نوع مشخص
 * در اختیار صفحه‌ها می‌گذارد.
 *
 * قاعده: هر مقداری که هنوز معلوم نیست `null` (یا خالی) است. در صفحه به‌جای آن
 * کادر «در حال تکمیل» نشان داده می‌شود و در داده‌ی ساختاریافته (JSON-LD) و
 * متاها اصلاً نمی‌آید. هیچ مقداری را حدسی پر نکنید.
 */
import siteJson from '../content/settings/site.json';
import workshopsJson from '../content/settings/workshops.json';
import registerJson from '../content/settings/register.json';
import faqsJson from '../content/settings/faqs.json';

/* ---------- helpers: the CMS may save "" or {} where we mean "unknown" ---------- */
type Maybe<T> = T | null | undefined;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
const list = <T>(v: Maybe<T[]>): T[] => (Array.isArray(v) ? v : []);

/* ---------- design preview only (npm run preview:photos) ----------
 * Labelled placeholders in every photo slot, to show the photo layout before real photos exist.
 * Inactive unless PREVIEW_PHOTOS=1 and the generated (git-ignored) folder src/assets/preview exists. */
type PreviewPhoto = { image: string; alt: string; caption?: string };
type PreviewManifest = { hero?: PreviewPhoto; units?: Record<string, PreviewPhoto[]>; workshops?: Record<string, PreviewPhoto> };
const previewFile = Object.values(import.meta.glob<PreviewManifest>('/src/assets/preview/manifest.json', { eager: true, import: 'default' }))[0];
const preview: PreviewManifest | null = process.env.PREVIEW_PHOTOS === '1' && previewFile ? previewFile : null;

/* ---------- site ---------- */
export type Social = { label: string; handle: string; href: string; note?: string };
type SiteJson = typeof siteJson & Record<string, unknown>;
const s = siteJson as SiteJson;

export const site = {
  name: str(s.name)!,
  brand: str(s.brand)!,
  slogan: str(s.slogan)!,
  slogan2: str(s.slogan2)!,
  mission: str(s.mission)!,
  founder: str(s.founder),
  founderMessage: str(s.founderMessage),
  founderPhoto: str(s.founderPhoto),
  city: str(s.city), // {{شهر}} — پیش‌شماره‌ها ۰۵۱ است ولی شهر هنوز تأیید نشده
  phone: str(s.phone), // {{تلفن اصلی}}
  address: str(s.address), // {{نشانی اصلی}}
  foundingYear: str(s.foundingYear),
  mapUrl: null as string | null, // نقشه‌ی هر واحد جداگانه در units آمده است
  privacyContact: str(s.privacyContact), // {{راه ارتباطی}}
  /** نشانی سایت قبلی (برای ارجاع در اسکیما) */
  oldSite: str(s.oldSite),
  licenses: list(s.licenses as Maybe<{ title: string; issuer?: string; number?: string; url?: string }[]>)
    .filter((l) => str(l?.title))
    .map((l) => ({ title: str(l.title)!, issuer: str(l.issuer), number: str(l.number), url: str(l.url) })),
  hero: preview?.hero
    ? { image: preview.hero.image, alt: preview.hero.alt, video: null as string | null, consent: true }
    : {
        image: str((s.hero as Record<string, unknown> | undefined)?.image),
        alt: str((s.hero as Record<string, unknown> | undefined)?.alt),
        video: str((s.hero as Record<string, unknown> | undefined)?.video),
        consent: Boolean((s.hero as Record<string, unknown> | undefined)?.consent),
      },
};

export const social: Social[] = list(s.social as Maybe<Social[]>)
  .filter((x) => str(x?.href) && str(x?.label))
  .map((x) => ({ label: str(x.label)!, handle: str(x.handle) ?? '', href: str(x.href)! }));

/* ---------- navigation (structure, not content: stays in code) ---------- */
export const nav = [
  { href: '/', label: 'خانه' },
  { href: '/method/', label: 'متد کودک ماهر' },
  { href: '/units/', label: 'واحدها', children: 'units' as const },
  { href: '/workshops/', label: 'کارگاه‌ها' },
  { href: '/parents/', label: 'برای والدین' },
  { href: '/blog/', label: 'مقاله‌ها' },
  { href: '/contact/', label: 'تماس' },
];

export const footerLinks = [
  { href: '/about/', label: 'درباره ما' },
  { href: '/method/', label: 'متد کودک ماهر' },
  { href: '/path/', label: 'مسیر رشد ۳ تا ۱۸ سال' },
  { href: '/register/', label: 'پیش‌ثبت‌نام' },
  { href: '/faq/', label: 'پرسش‌های پرتکرار' },
  { href: '/careers/', label: 'همکاری با ما' },
  { href: '/privacy/', label: 'حریم خصوصی' },
];

/* ---------- units ---------- */
export type Fact = { label: string; value: string | null; pending: string | null };
export type Faq = { q: string; a: string | null; pending: string | null };
export type GalleryItem = { image: string; alt: string; caption: string | null };
export type Review = { text: string; author: string; date: string | null; source: string | null };
export type Weekday = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
export type OpeningHours = { days: Weekday[]; opens: string; closes: string };

export type Unit = {
  slug: string;
  order: number;
  name: string;
  /** نام رسمی واحد، اگر با نام کوتاه فرق دارد */
  officialName: string | null;
  short: string | null; // جمله‌ی کوتاه کارت؛ null یعنی هنوز تکمیل نشده
  shortPending: string | null;
  ages: string | null;
  icon: string;
  soon: boolean;
  manager: string | null;
  address: string | null;
  phone: { display: string; tel: string; note: string | null } | null;
  hours: string | null;
  /** فقط وقتی روز و ساعت دقیق تأیید شده باشد؛ برای openingHoursSpecification */
  openingHours: OpeningHours[];
  mapUrl: string | null;
  geo: { lat: number; lng: number } | null;
  googleMapsUrl: string | null;
  baladUrl: string | null;
  reviewUrl: string | null;
  instagram: string | null;
  facts: Fact[];
  documents: { items: string[]; pending: string | null } | null;
  gallery: GalleryItem[];
  faqs: Faq[];
  reviews: Review[];
};

const WEEKDAYS: Weekday[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function toUnit(raw: Record<string, any>): Unit {
  const phone = raw.phone && str(raw.phone.display) && str(raw.phone.tel)
    ? { display: str(raw.phone.display)!, tel: String(raw.phone.tel).replace(/[^\d+]/g, ''), note: str(raw.phone.note) }
    : null;
  const lat = Number(raw.geo?.lat);
  const lng = Number(raw.geo?.lng);
  const docs = list<string>(raw.documents?.items).map(str).filter(Boolean) as string[];
  return {
    slug: str(raw.slug)!,
    order: Number(raw.order) || 0,
    name: str(raw.name)!,
    officialName: str(raw.officialName),
    short: str(raw.short),
    shortPending: str(raw.shortPending),
    ages: str(raw.ages),
    icon: str(raw.icon) ?? 'flag',
    soon: Boolean(raw.soon),
    manager: str(raw.manager),
    address: str(raw.address),
    phone,
    hours: str(raw.hours),
    openingHours: list<any>(raw.openingHours)
      .map((o) => ({ days: list<string>(o?.days).filter((d): d is Weekday => WEEKDAYS.includes(d as Weekday)), opens: String(o?.opens ?? ''), closes: String(o?.closes ?? '') }))
      .filter((o) => o.days.length && TIME.test(o.opens) && TIME.test(o.closes)),
    mapUrl: str(raw.mapUrl),
    geo: Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 ? { lat, lng } : null,
    googleMapsUrl: str(raw.googleMapsUrl),
    baladUrl: str(raw.baladUrl),
    reviewUrl: str(raw.reviewUrl),
    instagram: str(raw.instagram),
    facts: list<any>(raw.facts)
      .filter((f) => str(f?.label))
      .map((f) => ({ label: str(f.label)!, value: str(f.value), pending: str(f.pending) })),
    documents: docs.length || str(raw.documents?.pending) ? { items: docs, pending: str(raw.documents?.pending) } : null,
    // A photo is shown only when the institute confirms written consent for everyone in it.
    gallery: (preview?.units?.[raw.slug] ? preview.units[raw.slug].map((g) => ({ ...g, consent: true })) : list<any>(raw.gallery))
      .filter((g) => str(g?.image) && str(g?.alt) && g?.consent === true)
      .map((g) => ({ image: str(g.image)!, alt: str(g.alt)!, caption: str(g.caption) })),
    faqs: list<any>(raw.faqs)
      .filter((f) => str(f?.q))
      .map((f) => ({ q: str(f.q)!, a: str(f.a), pending: str(f.pending) })),
    // A parent review is shown only with the writer's permission.
    reviews: list<any>(raw.reviews)
      .filter((r) => str(r?.text) && str(r?.author) && r?.permission === true)
      .map((r) => ({ text: str(r.text)!, author: str(r.author)!, date: str(r.date), source: str(r.source) })),
  };
}

const unitFiles = import.meta.glob<Record<string, any>>('../content/units/*.json', { eager: true, import: 'default' });
export const units: Unit[] = Object.values(unitFiles).map(toUnit).sort((a, b) => a.order - b.order);
export const unitBySlug = (slug: string) => {
  const u = units.find((x) => x.slug === slug);
  if (!u) throw new Error(`Unknown unit: ${slug}`);
  return u;
};

/* ---------- method (brief-governed copy: stays in code) ---------- */
export const cycle = [
  { title: 'پیش‌بینی', text: 'قبل از هر تجربه، کودک حدس می‌زند چه پیش می‌آید و خودش در آن چطور خواهد بود.' },
  { title: 'تجربه', text: 'کار واقعی انجام می‌دهد: ساختن، پرسیدن، آزمودن، مسئولیت گرفتن.' },
  { title: 'بازبینی', text: 'حدسش را با آنچه واقعاً شد مقایسه می‌کند و از فاصله آن دو، خودش را بهتر می‌شناسد.' },
] as const;

/* ---------- the path from 3 to 18: each stop's age and name (home page: the hero's drawing and PathStops) ---------- */
export const stages = [
  { age: '۳', label: 'کودکستان' },
  { age: '۶', label: 'دبستان' },
  { age: '۱۲', label: 'متوسطه اول' },
  { age: '۱۵', label: 'انتخاب اول' },
  { age: '۱۸', label: 'انتخاب نهایی' },
] as const;

/* ---------- workshops, registration, FAQ (editable in the CMS) ---------- */
export type Workshop = { n: string; d: string; icon: string; age: string | null; photo: { image: string; alt: string } | null };
export const workshops: Workshop[] = list<any>(workshopsJson.items)
  .filter((w) => str(w?.title))
  .map((w) => ({
    n: str(w.title)!,
    d: str(w.text) ?? '',
    icon: str(w.icon) ?? 'bulb',
    age: str(w.age),
    // Same rule as the unit galleries: a photo appears only with written consent and a Persian description.
    photo: preview?.workshops?.[w.title]
      ?? (str(w.image) && str(w.alt) && w.consent === true ? { image: str(w.image)!, alt: str(w.alt)! } : null),
  }));

export const registerSteps = list<any>(registerJson.steps)
  .filter((x) => str(x?.title))
  .map((x) => ({ t: str(x.title)!, d: str(x.text) ?? '' }));

export const documents = units
  .filter((u) => u.documents)
  .map((u) => ({ unit: u.name, slug: u.slug, items: u.documents!.items, pending: u.documents!.pending ?? undefined }));

/** پرسش‌های پرتکرار. `pending` یعنی پاسخ (یا بخشی از آن) هنوز تکمیل نشده و در اسکیمای FAQ نمی‌آید. */
export const faqs: { q: string; a?: string; pending?: string }[] = list<any>(faqsJson.items)
  .filter((f) => str(f?.q))
  .map((f) => ({ q: str(f.q)!, a: str(f.a) ?? undefined, pending: str(f.pending) ?? undefined }));

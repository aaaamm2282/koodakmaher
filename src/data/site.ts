/**
 * اطلاعات پایه‌ی مؤسسه. منبع: docs/content-brief.md
 *
 * قاعده: هر مقداری که هنوز معلوم نیست `null` است. در صفحه به‌جای آن کادر
 * «در حال تکمیل» نشان داده می‌شود و در داده‌ی ساختاریافته (JSON-LD) و متاها
 * اصلاً نمی‌آید. هیچ مقداری را حدسی پر نکنید.
 */
export const site = {
  name: 'مؤسسه آموزشی کودک ماهر مانا',
  brand: 'کودک ماهر',
  slogan: 'یادگیری برای زندگی، نه برای امتحان',
  slogan2: 'مهارت برای زندگی؛ انتخاب برای آینده',
  mission:
    'ما به کودک و نوجوان کمک می‌کنیم خودش را بشناسد، با تجربه واقعی یاد بگیرد و در ۱۵ و ۱۸ سالگی مسیر تحصیل و کارش را آگاهانه انتخاب کند.',
  founder: 'مهدی ملکی',

  city: null as string | null, // {{شهر}}
  phone: null as string | null, // {{تلفن اصلی}}
  address: null as string | null, // {{نشانی اصلی}}
  foundingYear: null as string | null, // {{سال تأسیس}}
  social: [] as { label: string; href: string }[], // {{نشانی صفحه‌های رسمی}}
  mapUrl: null as string | null, // {{لینک موقعیت روی نقشه}}
  privacyContact: null as string | null, // {{راه ارتباطی}}

  /** نشانی سایت قبلی (برای ارجاع در اسکیما) */
  oldSite: 'https://mahermana.com/',
};

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
  { href: '/method/', label: 'متد کودک ماهر' },
  { href: '/units/', label: 'واحدها' },
  { href: '/register/', label: 'پیش‌ثبت‌نام' },
  { href: '/faq/', label: 'پرسش‌های پرتکرار' },
  { href: '/careers/', label: 'همکاری با ما' },
  { href: '/privacy/', label: 'حریم خصوصی' },
];

export type Unit = {
  slug: string;
  name: string;
  short: string | null; // جمله‌ی کوتاه کارت؛ null یعنی هنوز تکمیل نشده
  shortPending?: string;
  icon: string;
  color: 'sun' | 'sky' | 'mint' | 'coral' | 'grape';
  soon?: boolean;
};

export const units: Unit[] = [
  { slug: 'kindergarten', name: 'کودکستان', short: 'بازی، حدس زدن و امتحان کردن؛ اولین قدم‌های شناخت خود.', icon: 'blocks', color: 'sun' },
  { slug: 'primary', name: 'دبستان مهارت‌محور', short: 'درس‌های رسمی، همراه با جلسه روزانه مهارت‌های نرم و کارگاه.', icon: 'pencil', color: 'sky' },
  { slug: 'middle-school', name: 'متوسطه اول پسرانه', short: 'مسئله‌های واقعی و پرونده انتخاب برای تصمیم ۱۵ سالگی.', icon: 'compass', color: 'coral' },
  { slug: 'high-school', name: 'متوسطه دوم', short: 'در دست برنامه‌ریزی؛ برای واکاوی ۱۵ تا ۱۸ سالگی.', icon: 'flag', color: 'grape', soon: true },
  { slug: 'language', name: 'آموزشگاه زبان', short: null, shortPending: 'یک جمله درباره رویکرد و سطوح آموزشگاه زبان', icon: 'chat', color: 'mint' },
  { slug: 'vocational', name: 'آموزشگاه آزاد فنی‌وحرفه‌ای', short: null, shortPending: 'یک جمله درباره دوره‌ها و مخاطبان', icon: 'wrench', color: 'sun' },
];

export const cycle = [
  { title: 'پیش‌بینی', text: 'قبل از هر تجربه، کودک حدس می‌زند چه پیش می‌آید و خودش در آن چطور خواهد بود.', icon: 'sparkle', color: 'sun' },
  { title: 'تجربه', text: 'کار واقعی انجام می‌دهد: ساختن، پرسیدن، آزمودن، مسئولیت گرفتن.', icon: 'hand', color: 'coral' },
  { title: 'بازبینی', text: 'حدسش را با آنچه واقعاً شد مقایسه می‌کند و از فاصله آن دو، خودش را بهتر می‌شناسد.', icon: 'refresh', color: 'sky' },
] as const;

export const colorMap = {
  sun: { bg: 'bg-sun', soft: 'bg-sun-soft', text: 'text-ink' },
  sky: { bg: 'bg-sky', soft: 'bg-sky-soft', text: 'text-sky' },
  mint: { bg: 'bg-mint', soft: 'bg-mint-soft', text: 'text-mint' },
  coral: { bg: 'bg-coral', soft: 'bg-coral-soft', text: 'text-coral' },
  grape: { bg: 'bg-grape', soft: 'bg-grape-soft', text: 'text-grape' },
} as const;

/** پرسش‌های پرتکرار. `pending` یعنی پاسخ (یا بخشی از آن) هنوز تأیید یا تکمیل نشده و در اسکیمای FAQ نمی‌آید. */
export const faqs: { q: string; a?: string; pending?: string }[] = [
  { q: 'آیا برنامه درسی رسمی آموزش‌وپرورش اجرا می‌شود؟', a: 'بله. برنامه رسمی کامل اجرا می‌شود و جلسه‌های مهارت و کارگاه در کنار آن است.', pending: 'تأیید شود' },
  { q: 'متد کودک ماهر جای درس خواندن را نمی‌گیرد؟', a: 'نه. هدف ما این است که کودک هم درس را خوب یاد بگیرد و هم خودش را بشناسد. بسیاری از مهارت‌هایی که تمرین می‌شود، مثل برنامه‌ریزی و سنجیدن حدس، به درس خواندن هم کمک می‌کند.' },
  { q: 'آیا به بچه‌ها نمره مهارت یا اخلاق داده می‌شود؟', a: 'نه. مهارت‌ها با توصیف رفتار و شاهد ثبت می‌شوند و منش کودک را نمره نمی‌دهیم. بچه‌ها با هم مقایسه نمی‌شوند.' },
  { q: 'شما استعداد فرزندم را تشخیص می‌دهید؟', a: 'ما به کودک برچسب استعداد نمی‌زنیم. کمکش می‌کنیم کارهای مختلف را امتحان کند و خودش با شاهد بفهمد در چه کاری علاقه و توان بیشتری دارد.' },
  { q: 'اگر فرزندم از وسط سال یا از پایه بالاتر وارد شود چه؟', a: 'مسیر از هر سنی قابل شروع است.', pending: 'نحوه همراه کردن دانش‌آموز تازه‌وارد — تأیید شود' },
  { q: 'آیا تضمین می‌کنید فرزندم رشته درست را انتخاب کند؟', a: 'نه، و هیچ روشی نمی‌تواند چنین تضمینی بدهد. انتخاب رشته به عوامل زیادی مثل کنکور، قوانین هدایت تحصیلی و بازار کار هم وابسته است. آنچه ما انجام می‌دهیم این است که انتخاب فرزندتان بر پایه تجربه و شناخت واقعی باشد.' },
  { q: 'متد شما از کجا آمده؟', a: 'متد کودک ماهر بر پایه تجربه سال‌ها آموزش مهارتی و پژوهش‌های شناخته‌شده در آموزش تجربی ساخته شده و در حال اجرای آزمایشی و بهبود است. توضیح بیشتر در صفحه «متد کودک ماهر» آمده است.' },
  { q: 'شهریه چقدر است و امکان پرداخت اقساطی هست؟', pending: 'تکمیل شود' },
  { q: 'سرویس رفت‌وآمد دارید؟', pending: 'تکمیل شود' },
  { q: 'برنامه پذیرایی/ناهار؟', pending: 'تکمیل شود' },
];

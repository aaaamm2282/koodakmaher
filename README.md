# کودکستان کودک ماهر

وب‌سایت کودکستان کودک ماهر: Astro (HTML ایستا و سریع) + Tailwind CSS 4 + Motion.

## اجرا

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # خروجی در dist/
npm run offline  # نسخه‌ی آفلاین در offline/ (index.html را مستقیم در مرورگر باز کنید)
```

## تنظیمات

- `src/data/site.ts`: نام، تلفن، نشانی، آمار، دوره‌ها، سؤالات متداول و نظرات. موارد `TODO` را با اطلاعات واقعی جایگزین کنید.
- `src/data/posts.ts`: مقاله‌های «راهنمای والدین».
- متغیرهای محیطی:
  - `SITE_URL`: دامنه‌ی نهایی (پیش‌فرض `https://mahermana.com`)، برای canonical و sitemap.
  - `PUBLIC_FORM_ENDPOINT`: آدرس دریافت فرم ثبت‌نام (مثلاً Formspree). اگر خالی باشد فرم، پیامک آماده‌ی ارسال باز می‌کند.

## سئو و جئو

گزارش کامل در [docs/seo-geo-audit.md](docs/seo-geo-audit.md). خروجی‌های مرتبط: `/sitemap-index.xml`، `/robots.txt`، `/llms.txt` و JSON-LD در همه‌ی صفحه‌ها.

## استقرار

خروجی `dist/` ایستاست و روی هر هاست ساده، Cloudflare Pages، Netlify، Vercel یا لیارا قابل انتشار است.

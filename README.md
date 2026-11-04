# مؤسسه آموزشی کودک ماهر مانا

وب‌سایت مؤسسه آموزشی کودک ماهر مانا: Astro (HTML ایستا و سریع) + Tailwind CSS 4 + Motion.

## اجرا

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # خروجی در dist/
npm run offline  # نسخه‌ی آفلاین در offline/ (index.html را مستقیم در مرورگر باز کنید)
```

## تنظیمات

- محتوای سایت از `docs/content-brief.md` آمده است.
- `src/data/site.ts`: نام، شعار، تلفن، نشانی، واحدها و پرسش‌های پرتکرار. مقدارهای `null` یعنی هنوز تکمیل نشده؛ در صفحه کادر «در حال تکمیل» نشان داده می‌شود.
- صفحه‌ها در `src/pages/`؛ جاهای خالی با کامپوننت `Pending` مشخص شده‌اند (`grep -rn "Pending" src/pages`).
- فرم‌ها فعلاً فقط ظاهر دارند. وقتی مقصد ارسال معلوم شد، آن را به‌صورت `action` به `FormShell` بدهید.
- `SITE_URL`: دامنه‌ی نهایی (پیش‌فرض `https://mahermana.com`)، برای canonical و sitemap.

## سئو و جئو

گزارش کامل در [docs/seo-geo-audit.md](docs/seo-geo-audit.md). خروجی‌های مرتبط: `/sitemap-index.xml`، `/robots.txt`، `/llms.txt` و JSON-LD در همه‌ی صفحه‌ها.

## استقرار

خروجی `dist/` ایستاست و روی هر هاست ساده، Cloudflare Pages، Netlify، Vercel یا لیارا قابل انتشار است.

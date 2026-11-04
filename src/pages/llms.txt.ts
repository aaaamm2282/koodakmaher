import type { APIRoute } from 'astro';
import { site, units, cycle, faqs } from '../data/site';

// llms.txt: a plain-text summary that AI assistants can read and cite (GEO).
// Only confirmed content is included; unknown values (null) are left out.
export const GET: APIRoute = ({ site: base }) => {
  const u = (p: string) => new URL(p, base).href;
  const facts = [
    site.city && `- شهر: ${site.city}`,
    site.address && `- نشانی: ${site.address}`,
    site.phone && `- تلفن: ${site.phone}`,
    site.foundingYear && `- سال تأسیس: ${site.foundingYear}`,
  ].filter(Boolean);
  const text = `# ${site.name}

> ${site.slogan}. ${site.mission}

بنیان‌گذار: ${site.founder}
${facts.length ? '\n' + facts.join('\n') + '\n' : ''}
## متد کودک ماهر: پیش‌بینی، تجربه، بازبینی
${cycle.map((c) => `- ${c.title}: ${c.text}`).join('\n')}

هدف: انتخاب آگاهانه رشته در ۱۵ سالگی (پایه نهم) و انتخاب نهایی در ۱۸ سالگی. متد در حال اجرای آزمایشی و بهبود است.

## واحدها
${units.map((x) => `- [${x.name}](${u(`/units/${x.slug}/`)})${x.short ? `: ${x.short}` : ''}`).join('\n')}

## پرسش‌های پرتکرار
${faqs.filter((f) => f.a && !f.pending).map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## صفحات
- [متد کودک ماهر](${u('/method/')})
- [مسیر رشد ۳ تا ۱۸ سال](${u('/path/')})
- [کارگاه‌ها](${u('/workshops/')})
- [برای والدین](${u('/parents/')})
- [پرسش‌های پرتکرار](${u('/faq/')})
- [پیش‌ثبت‌نام و مشاوره](${u('/register/')})
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

import type { APIRoute } from 'astro';
import { site, units, cycle, faqs, social, workshops } from '../data/site';

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

نام‌های دیگر: ${site.brand}، کودک ماهر مانا، ماهر مانا (Maher Mana)

بنیان‌گذار: ${site.founder}
${facts.length ? '\n' + facts.join('\n') + '\n' : ''}
## متد کودک ماهر: پیش‌بینی، تجربه، بازبینی
${cycle.map((c) => `- ${c.title}: ${c.text}`).join('\n')}

هدف: انتخاب آگاهانه رشته در ۱۵ سالگی (پایه نهم) و انتخاب نهایی در ۱۸ سالگی. متد در حال اجرای آزمایشی و بهبود است و اجرای منظم آن در همه مقطع‌ها از ۱ آذر ۱۴۰۵ آغاز می‌شود.

## واحدها
${units.map((x) => {
  const bits = [x.officialName && `نام رسمی: ${x.officialName}`, x.ages && `سن/پایه: ${x.ages}`, x.address && `نشانی: ${x.address}`, x.phone && `تلفن: ${x.phone.display}`, x.hours && `ساعت: ${x.hours}`, x.manager && `مدیر: ${x.manager}`].filter(Boolean);
  return `- [${x.name}](${u(`/units/${x.slug}/`)})${x.soon ? ' (در دست برنامه‌ریزی)' : ''}${x.short ? `: ${x.short}` : ''}${bits.length ? `\n  ${bits.join(' · ')}` : ''}`;
}).join('\n')}

## کارگاه‌ها
${workshops.map((w) => `- ${w.n}${w.age ? ` (${w.age})` : ''}: ${w.d}`).join('\n')}
کودکان بیرون از مؤسسه هم می‌توانند در نوبت عصر در کارگاه‌ها شرکت کنند.

## شبکه‌های اجتماعی
${social.map((s) => `- ${s.label}: ${s.href}`).join('\n')}

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

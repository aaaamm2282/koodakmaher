import type { APIRoute } from 'astro';
import { site, programs, faqs } from '../data/site';
import { posts } from '../data/posts';

// llms.txt: a plain-text summary that AI assistants can read and cite (GEO).
export const GET: APIRoute = ({ site: base }) => {
  const u = (p: string) => new URL(p, base).href;
  const text = `# ${site.name}

> ${site.description}

${site.name} بخشی از ${site.parent} است و کودکان ${site.ageRange.min} تا ${site.ageRange.max} سال را در شهر ${site.address.city} می‌پذیرد.

- تلفن: ${site.phone}
- ساعت کاری: ${site.hours}
- نشانی: ${site.address.city}، ${site.address.street}

## دوره‌ها
${programs.map((p) => `- ${p.title} (${p.age}): ${p.text}`).join('\n')}

## سؤالات متداول
${faqs.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## راهنمای والدین
${posts.map((p) => `- [${p.title}](${u(`/blog/${p.slug}/`)}): ${p.description}`).join('\n')}

## صفحات
- [صفحه اصلی](${u('/')})
- [ثبت‌نام](${u('/#register')})
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

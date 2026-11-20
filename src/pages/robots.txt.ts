import type { APIRoute } from 'astro';

// AI crawlers are explicitly welcomed: being readable by them is the basis of GEO
// (appearing in answers from ChatGPT, Gemini, Perplexity, Claude, ...).
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];

// The CMS panel is not for search results. (/review/ stays crawlable so its noindex tag is seen.)
const privatePaths = ['/admin/'];

export const GET: APIRoute = ({ site }) => {
  // A named group replaces the * group for that bot, so every group repeats the private paths.
  const rules = ['Allow: /', ...privatePaths.map((p) => `Disallow: ${p}`), ''];
  const lines = [
    'User-agent: *',
    ...rules,
    ...aiBots.flatMap((b) => [`User-agent: ${b}`, ...rules]),
    `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

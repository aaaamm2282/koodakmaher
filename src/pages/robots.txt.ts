import type { APIRoute } from 'astro';

// AI crawlers are explicitly welcomed: being readable by them is the basis of GEO
// (appearing in answers from ChatGPT, Gemini, Perplexity, Claude, ...).
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];

export const GET: APIRoute = ({ site }) => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    ...aiBots.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    `Sitemap: ${new URL('sitemap-index.xml', site).href}`,
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

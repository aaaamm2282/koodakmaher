/**
 * GitHub sign-in for the Decap CMS panel (/admin/), as a Cloudflare Worker.
 * Setup steps: docs/cms-setup.md
 *
 * No secrets live in this file. Set them in the Worker's settings:
 *   GITHUB_CLIENT_ID      (variable)  from the GitHub OAuth App
 *   GITHUB_CLIENT_SECRET  (secret)    from the GitHub OAuth App
 *   ALLOWED_ORIGIN        (variable)  the site that hosts /admin/, e.g. https://mahermana.com
 */
const SCOPES = new Set(['repo', 'public_repo', 'repo,user', 'public_repo,user']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const scope = SCOPES.has(url.searchParams.get('scope') ?? '') ? url.searchParams.get('scope') : 'repo';
      const github = new URL('https://github.com/login/oauth/authorize');
      github.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      github.searchParams.set('redirect_uri', `${url.origin}/callback`);
      github.searchParams.set('scope', scope);
      github.searchParams.set('state', state);
      return new Response(null, {
        status: 302,
        headers: {
          Location: github.toString(),
          'Set-Cookie': `cms_oauth_state=${state}; Path=/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const saved = /(?:^|;\s*)cms_oauth_state=([^;]+)/.exec(request.headers.get('Cookie') ?? '')?.[1];
      if (!code || !state || state !== saved) return reply(env, 'error', { message: 'ورود نامعتبر بود؛ دوباره امتحان کنید.' });

      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'koodakmaher-cms-auth' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/callback` }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.access_token) return reply(env, 'error', { message: data.error_description || 'گیت‌هاب توکن نداد.' });
      return reply(env, 'success', { token: data.access_token, provider: 'github' });
    }

    return new Response('Not found', { status: 404 });
  },
};

/** Hands the result to the /admin/ window that opened this popup, and only to that site. */
function reply(env, status, content) {
  const origin = env.ALLOWED_ORIGIN;
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const html = `<!doctype html><meta charset="utf-8"><title>ورود</title><body><script>
(function () {
  var origin = ${js(origin)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(${js(message)}, origin);
    window.removeEventListener('message', receive, false);
    setTimeout(function () { window.close(); }, 300);
  }
  window.addEventListener('message', receive, false);
  window.opener && window.opener.postMessage('authorizing:github', origin);
})();
</script></body>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

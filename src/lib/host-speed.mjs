/**
 * Compression, caching and a few safe security headers, written next to the redirects after every build
 * (src/integrations/server-files.mjs):
 *   .htaccess (appended)   Apache and LiteSpeed: compression and headers, each only where the host has the module
 *   _astro/.htaccess       the files whose names carry a fingerprint of their content: kept for a year
 *   _headers               Netlify and Cloudflare Pages: the same, in their format
 * Only directives that shared hosts allow in .htaccess (AllowOverride FileInfo): no mod_expires, no <If>.
 */
const COMPRESSIBLE = 'text/html text/css text/plain text/xml text/javascript application/javascript application/json application/xml application/manifest+json image/svg+xml';

const SECURITY = [
  ['X-Content-Type-Options', 'nosniff'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['X-Frame-Options', 'SAMEORIGIN'],
];
const YEAR = 'public, max-age=31536000, immutable';

export const htaccessSpeed = [
  '',
  '# Speed: compressed text files (Brotli where the host has it, otherwise gzip)',
  '<IfModule mod_filter.c>',
  '  <IfModule mod_brotli.c>',
  `    AddOutputFilterByType BROTLI_COMPRESS ${COMPRESSIBLE}`,
  '  </IfModule>',
  '  <IfModule !mod_brotli.c>',
  '    <IfModule mod_deflate.c>',
  `      AddOutputFilterByType DEFLATE ${COMPRESSIBLE}`,
  '    </IfModule>',
  '  </IfModule>',
  '</IfModule>',
  '',
  '# Pages are checked with the server on every visit (a quick «not changed» when they are the same), so an',
  '# update shows at once. Files in /_astro/ are kept for a year by their own .htaccess.',
  '<IfModule mod_headers.c>',
  ...SECURITY.map(([k, v]) => `  Header always set ${k} "${v}"`),
  '  <FilesMatch "\\.(html|xml|txt|webmanifest)$">',
  '    Header set Cache-Control "no-cache"',
  '  </FilesMatch>',
  '</IfModule>',
  '',
].join('\n');

export const htaccessImmutable = [
  '# Every file here has a fingerprint of its content in its name, so a changed file gets a new name.',
  '<IfModule mod_headers.c>',
  `  Header set Cache-Control "${YEAR}"`,
  '</IfModule>',
  '',
].join('\n');

export const netlifyHeaders = [
  '# Netlify and Cloudflare Pages. Generated at build time (src/lib/host-speed.mjs). Do not edit by hand.',
  '/*',
  ...SECURITY.map(([k, v]) => `  ${k}: ${v}`),
  '',
  '/_astro/*',
  `  Cache-Control: ${YEAR}`,
  '',
].join('\n');

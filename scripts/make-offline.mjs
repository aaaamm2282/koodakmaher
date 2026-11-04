// Builds an offline copy of dist/ that opens straight from disk (file://):
// inlines CSS (with fonts as data URIs) and JS (bundled to IIFE), and rewrites absolute links to relative ones.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const out = path.resolve(process.argv[2] || 'offline');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(dist, out, { recursive: true });

const htmlFiles = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) htmlFiles.push(p);
  }
})(out);

const cssCache = new Map();
function inlineCss(href) {
  if (cssCache.has(href)) return cssCache.get(href);
  let css = fs.readFileSync(path.join(dist, href), 'utf8');
  css = css.replace(/url\((['"]?)(\/_astro\/[^)'"]+\.woff2)\1\)/g, (_, q, u) =>
    `url(data:font/woff2;base64,${fs.readFileSync(path.join(dist, u)).toString('base64')})`);
  cssCache.set(href, css);
  return css;
}

const jsCache = new Map();
async function inlineJs(src) {
  if (jsCache.has(src)) return jsCache.get(src);
  const r = await build({ entryPoints: [path.join(dist, src)], bundle: true, format: 'iife', minify: true, write: false });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  jsCache.set(src, js);
  return js;
}

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.dirname(file), out).split(path.sep).join('/');
  const prefix = rel ? rel + '/' : '';

  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, h) => `<style>${inlineCss(h)}</style>`);

  const scripts = [...html.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)];
  let tail = '';
  for (const m of scripts) {
    html = html.replace(m[0], () => '');
    tail += `<script>${await inlineJs(m[1])}</script>`;
  }
  // also bundle inline module scripts that import from /_astro
  html = html.replace('</body>', () => tail + '</body>');

  // absolute internal links -> relative file links
  html = html.replace(/(href|src)="\/(?!\/)([^"#?]*)([#?][^"]*)?"/g, (_, attr, p, rest = '') => {
    let target = p;
    if (target === '' || target.endsWith('/')) target += 'index.html';
    return `${attr}="${prefix}${target}${rest}"`;
  });
  fs.writeFileSync(file, html);
}
console.log(`offline copy written to ${out} (${htmlFiles.length} pages)`);

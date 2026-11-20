/**
 * Design preview with labelled photo placeholders: shows where real photos and the hero video will
 * sit, before any photo exists. Nothing here reaches the live site.
 *
 *   npm run preview:photos                 → screenshots in dist-preview/shots/
 *   npm run preview:photos -- --out <dir>  → screenshots in <dir>
 *
 * Steps: render one placeholder image per photo slot (Persian label, in Vazirmatn) with the
 * preinstalled Chromium → write src/assets/preview/ (git-ignored) → build into dist-preview with
 * PREVIEW_PHOTOS=1 → screenshot the pages that hold photos → remove src/assets/preview.
 * The slot list mirrors docs/photo-shot-list.md.
 */
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Playwright is a machine-level tool here (not a project dependency): `npm i -g playwright && npx playwright install chromium`
let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)('playwright'));
} catch {
  console.error('Playwright is needed for this preview: npm i -g playwright && npx playwright install chromium');
  process.exit(1);
}
const assets = path.join(root, 'src/assets/preview');
const outArg = process.argv.indexOf('--out');
const shotsDir = path.resolve(outArg > -1 ? process.argv[outArg + 1] : path.join(root, 'dist-preview/shots'));
const font = pathToFileURL(path.join(root, 'node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2')).href;

/** Photo slots: [file, label]. The first photo of each unit is also its page-top photo. */
const slots = {
  hero: [['hero', 'صفحه اول: نمای باز یک کارگاه یا کلاس در حال کار']],
  kindergarten: [
    ['kg-1', 'کلاس کودکستان با نور روز'],
    ['kg-2', 'دست‌ها و برج مکعبی؛ لحظه «امتحان کن»'],
    ['kg-3', 'گوشه نقاشی و کارهای بچه‌ها روی دیوار'],
    ['kg-4', 'حیاط یا فضای بازی'],
    ['kg-5', 'ورودی و تابلوی کودکستان'],
  ],
  primary: [
    ['pr-1', 'کلاس دبستان از ته کلاس'],
    ['pr-2', 'کارگاه چوب: دست‌ها و ابزار'],
    ['pr-3', 'کارگاه الکترونیک: مدار روی میز'],
    ['pr-4', 'جلسه مهارت نرم، از پشت سر'],
    ['pr-5', 'ورودی و تابلوی دبستان'],
  ],
  'middle-school': [
    ['ms-1', 'کار گروهی روی یک مسئله واقعی'],
    ['ms-2', 'پرونده انتخاب روی میز (بدون نام)'],
    ['ms-3', 'گفت‌وگو با یک فرد شاغل در کلاس'],
    ['ms-4', 'ورودی و تابلوی دبیرستان'],
  ],
  language: [
    ['la-1', 'کلاس زبان خردسالان، بازی با کارت‌ها'],
    ['la-2', 'کلاس مکالمه نوجوانان یا بزرگسالان'],
    ['la-3', 'کتاب‌ها و وسایل کلاس'],
  ],
  vocational: [
    ['vo-1', 'یک کلاس عملی آموزشگاه'],
    ['vo-2', 'ورودی و تابلوی آموزشگاه'],
  ],
};
const workshopSlots = {
  'خلاقیت': ['ws-creativity', 'کارگاه خلاقیت: ساختن یک ایده'],
  'کار با چوب': ['ws-wood', 'کار با چوب: دست‌ها، چوب و ابزار'],
  'نقاشی خلاق': ['ws-paint', 'نقاشی خلاق: رنگ و قلم‌مو روی کاغذ'],
  'هوش مصنوعی': ['ws-ai', 'هوش مصنوعی: صفحه نمایش و گفت‌وگوی گروهی'],
  'الکترونیک': ['ws-electronics', 'الکترونیک: مدار ساده و لامپ'],
  'مهارت‌های نرم': ['ws-soft', 'مهارت‌های نرم: حلقه گفت‌وگو'],
};

const page = (label, w, h) => `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><style>
@font-face { font-family: V; src: url(${font}) format('woff2'); font-weight: 100 900; }
html, body { margin: 0; }
body { width: ${w}px; height: ${h}px; display: grid; place-items: center; font-family: V, sans-serif; color: #17201c;
  background: radial-gradient(circle at 50% 45%, rgb(255 255 255 / 0.55), transparent 60%), repeating-linear-gradient(135deg, #f3efe7 0 ${w / 60}px, #ece5d8 ${w / 60}px ${w / 30}px); }
.box { width: 56%; text-align: center; }
svg { width: ${w / 18}px; height: ${w / 18}px; color: #01237a; }
.tag { display: inline-block; margin-top: ${w / 90}px; padding: 0.35em 0.9em; border-radius: 0.5em; background: #01237a; color: #fff; font-weight: 600; font-size: ${w / 48}px; }
.label { margin-top: 0.5em; font-weight: 700; font-size: ${w / 26}px; line-height: 1.55; }
.spec { margin-top: 0.4em; font-size: ${w / 54}px; color: #4b5550; }
</style></head><body><div class="box">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.6"/></svg>
<div><span class="tag">جای عکس</span></div><div class="label">${label}</div><div class="spec">افقی ۳ به ۲ — با رضایت‌نامه کتبی</div>
</div></body></html>`;

async function makePlaceholders(browser) {
  fs.rmSync(assets, { recursive: true, force: true });
  fs.mkdirSync(assets, { recursive: true });
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const render = async (file, label, w = 1800, h = 1200) => {
    await p.setViewportSize({ width: w, height: h });
    await p.setContent(page(label, w, h), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(assets, `${file}.jpg`), type: 'jpeg', quality: 82 });
    return { image: `/src/assets/preview/${file}.jpg`, alt: `جای عکس: ${label}` };
  };
  const manifest = { units: {}, workshops: {} };
  manifest.hero = await render(...slots.hero[0], 2400, 1600);
  for (const [unit, list] of Object.entries(slots)) {
    if (unit === 'hero') continue;
    manifest.units[unit] = [];
    for (const [file, label] of list) manifest.units[unit].push({ ...(await render(file, label)), caption: label });
  }
  for (const [title, [file, label]] of Object.entries(workshopSlots)) manifest.workshops[title] = await render(file, label, 1600, 1000);
  fs.writeFileSync(path.join(assets, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await ctx.close();
}

async function shoot(browser, base) {
  fs.mkdirSync(shotsDir, { recursive: true });
  const pages = [
    ['home', '/'],
    ['kindergarten', '/units/kindergarten/'],
    ['primary', '/units/primary/'],
    ['workshops', '/workshops/'],
  ];
  for (const vp of [{ n: 'desktop', width: 1440, height: 900, scale: 1 }, { n: 'mobile', width: 390, height: 844, scale: 2 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale });
    const p = await ctx.newPage();
    for (const [name, url] of pages) {
      await p.goto(base + url, { waitUntil: 'networkidle' });
      for (let y = 0; y < 14000; y += 500) { await p.mouse.wheel(0, 500); await p.waitForTimeout(30); }
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(900);
      await p.screenshot({ path: path.join(shotsDir, `${name}-${vp.n}.png`), fullPage: true });
      // the first screen on its own, as a visitor sees it
      await p.screenshot({ path: path.join(shotsDir, `${name}-${vp.n}-first-screen.png`) });
    }
    await ctx.close();
  }
}

const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
};

const browser = await chromium.launch();
let server;
try {
  await makePlaceholders(browser);
  run('npx', ['astro', 'build', '--outDir', 'dist-preview'], { PREVIEW_PHOTOS: '1' });
  server = spawn('npx', ['astro', 'preview', '--outDir', 'dist-preview', '--port', '4391'], { cwd: root, stdio: 'ignore' });
  const base = 'http://localhost:4391';
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(base + '/')).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  await shoot(browser, base);
  console.log(`Design preview screenshots: ${shotsDir}`);
} finally {
  server?.kill();
  await browser.close();
  fs.rmSync(assets, { recursive: true, force: true });
}

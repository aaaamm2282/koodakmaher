/**
 * For the daily run of .github/workflows/deploy.yml: has an article or announcement come out since the last
 * daily run (its publish date has just arrived)? Then the site is built and uploaded again; on other days the
 * daily run does nothing. Changes made in the CMS are uploaded right away by their own run, not by this one.
 *
 *   node scripts/due-today.mjs            prints due=true or due=false (for $GITHUB_OUTPUT) and the titles
 *
 * The window is two days, so a daily run that GitHub skips or delays is caught up by the next one; uploading
 * the same site twice does no harm.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEntries, isPublished, isoDay } from '../src/lib/content-files.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
const now = Date.now();

const due = ['blog', 'news'].flatMap((kind) =>
  readEntries(path.join(root, 'src/content', kind))
    .filter((e) => isPublished(e, now) && now - e.date.getTime() < WINDOW_MS)
    .map((e) => `${kind}/${e.slug ?? e.file} (${isoDay(e.date)})`),
);

console.log(`due=${due.length > 0}`);
for (const d of due) console.error(`  منتشر می‌شود: ${d}`);
if (!due.length) console.error('  امروز مطلبی به تاریخ انتشارش نرسیده است.');

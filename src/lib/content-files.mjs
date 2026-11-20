/**
 * The front matter of the Markdown entries in a content folder (src/content/blog, src/content/news), read
 * straight from the files. For the places that run outside Astro's content layer: the sitemap settings in
 * astro.config.mjs and the daily-publish check (scripts/due-today.mjs). Inside pages, use src/lib/content.ts.
 *
 * Only the simple `key: value` lines are read (slug, date, updated, draft), which is all the CMS writes for
 * those fields.
 */
import fs from 'node:fs';
import path from 'node:path';

/** @typedef {{ file: string, slug?: string, date?: Date, updated?: Date, draft: boolean }} Entry */

const field = (head, key) => {
  const m = head.match(new RegExp(`^${key}:[ \\t]*(.*?)[ \\t]*$`, 'm'));
  const v = m?.[1].replace(/^(['"])(.*)\1$/, '$2').trim();
  return v ? v : undefined;
};
const date = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** @returns {Entry[]} */
export function readEntries(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      const head = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      return {
        file: f,
        slug: field(head, 'slug'),
        date: date(field(head, 'date')),
        updated: date(field(head, 'updated')),
        draft: field(head, 'draft') === 'true',
      };
    });
}

/** The same rule as src/lib/content.ts: not a draft, and its date has come. */
export const isPublished = (/** @type {Entry} */ e, now = Date.now()) => !e.draft && !!e.date && e.date.getTime() <= now;

/** 2026-12-05 */
export const isoDay = (/** @type {Date} */ d) => d.toISOString().slice(0, 10);

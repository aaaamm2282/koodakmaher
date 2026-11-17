import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Drafts never reach the live site. For a review copy, build with SHOW_DRAFTS=1:
 * drafts are then rendered with a "پیش‌نویس" banner and `noindex`.
 */
export const showDrafts = process.env.SHOW_DRAFTS === '1';

const visible = (e: { data: { draft: boolean; date: Date } }) => showDrafts || (!e.data.draft && e.data.date.getTime() <= Date.now());

export async function getPosts(): Promise<CollectionEntry<'blog'>[]> {
  return (await getCollection('blog', visible)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getNews(): Promise<CollectionEntry<'news'>[]> {
  return (await getCollection('news', visible)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

const faDateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric' });
/** ۲۶ آبان ۱۴۰۵ */
export const faDate = (d: Date) => faDateFmt.format(d);
/** 2026-11-17 for <time datetime> */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Rough reading time for Persian prose (about 180 words a minute). */
export function readingMinutes(markdown: string): number {
  const words = markdown.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`\[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export const faNum = (n: number) => n.toLocaleString('fa-IR');

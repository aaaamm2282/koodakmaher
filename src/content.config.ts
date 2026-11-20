import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/** The CMS saves an empty field as "" — treat that as "not set". */
const blank = (v: unknown) => (v === '' || v === null ? undefined : v);
const optStr = z.preprocess(blank, z.string().trim().optional());
const optDate = z.preprocess(blank, z.coerce.date().optional());
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'نشانی فقط با حروف کوچک انگلیسی، رقم و خط تیره');

export const blogCategories = ['شناخت کودک', 'مهارت‌های نرم', 'انتخاب رشته و مسیر', 'یادگیری در خانه', 'از کلاس‌های ما'] as const;
export const unitSlugs = ['kindergarten', 'primary', 'middle-school', 'high-school', 'language', 'vocational'] as const;

/**
 * Articles. `draft: true` keeps a post out of the site (and the sitemap) even after it is merged.
 * Drafts written for the institute's approval stay `draft: true` until a person approves them.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().trim().min(5),
    slug,
    description: z.string().trim().min(50).max(170),
    date: z.coerce.date(),
    updated: optDate,
    author: optStr,
    authorRole: optStr,
    reviewer: optStr,
    category: z.enum(blogCategories),
    focus: optStr,
    cover: optStr,
    coverAlt: optStr,
    sources: z.preprocess(blank, z.array(z.object({ title: z.string(), url: z.url(), publisher: optStr })).default([])),
    instagram: optStr,
    draft: z.boolean().default(false),
  }),
});

/** Announcements: registration dates, events, news from a unit. */
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string().trim().min(5),
    slug,
    date: z.coerce.date(),
    summary: z.string().trim().min(20).max(200),
    units: z.preprocess(blank, z.array(z.enum(unitSlugs)).default([])),
    cover: optStr,
    coverAlt: optStr,
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, news };

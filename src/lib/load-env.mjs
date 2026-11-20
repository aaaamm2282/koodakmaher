/**
 * Settings from .env files for code that reads process.env (astro.config.mjs, the build's own pages and the
 * npm scripts). Astro already gives PUBLIC_* settings to components through import.meta.env; this makes
 * SITE_URL, SHOW_DRAFTS, PREVIEW_PHOTOS and STATIC_REDIRECT_PAGES work from the same files.
 *
 * Same files and order as Astro: .env, .env.local, .env.<mode>, .env.<mode>.local. A setting already in
 * the environment (the build host's settings panel, or typed before the command) always wins.
 * Import this module first, before anything that reads process.env when it loads.
 */
import { loadEnv } from 'vite';

const mode = process.env.NODE_ENV === 'development' || process.argv.includes('dev') ? 'development' : 'production';
for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
  if (process.env[key] === undefined) process.env[key] = value;
}

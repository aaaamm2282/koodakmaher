import type { ImageMetadata } from 'astro';

/**
 * Photos uploaded in the CMS are saved under src/assets/uploads and stored in the content as
 * "/src/assets/uploads/<file>". They are imported here so Astro can make AVIF/WebP sizes of them.
 */
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true });

export function resolveImage(path: string | null | undefined): ImageMetadata | null {
  if (!path) return null;
  const clean = path.trim();
  const key = clean.startsWith('/src/') ? clean : clean.startsWith('src/') ? `/${clean}` : `/src/assets/uploads/${clean.replace(/^\/+/, '')}`;
  const hit = files[key]?.default ?? null;
  if (!hit) console.warn(`[images] not found: ${path}`);
  return hit;
}

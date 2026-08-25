import { publicUrl } from './r2';
import type { ProjectImage } from './types';

/**
 * The `src` a `next/image` gets for a stored photo.
 *
 * Carries the largest variant that exists as an `@<width>` marker, because a `next/image`
 * loader is handed only `{ src, width }` and would otherwise have no way to know that this
 * particular photo stops at 1600 — and would advertise a 2000px URL that 404s. See
 * `src/lib/image-loader.ts`.
 *
 * Not for `<meta>` tags or JSON-LD: crawlers never run the loader, so those need a real
 * finished URL. Use `mediaVariantUrl` for them.
 */
export function buildMediaSrc(projectId: string, image: ProjectImage): string {
  const max = image.variants[image.variants.length - 1] ?? 400;
  return `${publicUrl(`media/projects/${projectId}/${image.id}`)}@${max}`;
}

/** A concrete, fetchable variant URL — for OG tags, JSON-LD and anything a crawler reads. */
export function mediaVariantUrl(projectId: string, imageId: string, width: number): string {
  return publicUrl(`media/projects/${projectId}/${imageId}-${width}.webp`);
}

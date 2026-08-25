/**
 * Custom `next/image` loader.
 *
 * Project photos are already optimised: `src/lib/images.ts` writes a WebP ladder to R2 at
 * upload time and Cloudflare serves it. Re-optimising them on Vercel would cost money to
 * produce a worse result, so this loader just snaps the width Next asks for to a variant
 * that actually exists.
 *
 * ── WHY THE `@` SUFFIX ──────────────────────────────────────────────────────
 * The ladder is capped at the source's own width — `processImage` never upscales, so a
 * photo 1600px wide has variants up to 1600 and no 2000. A loader that snapped against a
 * fixed list emitted `…-2000.webp` in the srcset for such a photo, and that URL 404s. It is
 * invisible in testing (the browser usually picks a smaller candidate) and breaks for real
 * on a high-DPR phone, which is precisely this site's audience.
 *
 * A `next/image` loader receives only `{ src, width, quality }` — it cannot see the image
 * record, so the ceiling has to travel inside the src. `buildMediaSrc` appends `@<max>`;
 * this strips it and clamps. Anything without the marker — the logo, a local asset — is
 * passed straight through untouched.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** Widths `src/lib/images.ts` can produce. Kept in sync with `VARIANT_WIDTHS` there. */
const VARIANTS = [400, 800, 1200, 1600, 2000];

/** Marker appended by `buildMediaSrc`: `…/<imageId>@1600`. */
const CEILING = /@(\d+)$/;

export default function loader({ src, width }: { src: string; width: number }): string {
  if (!src.includes('/media/projects/')) return src;

  const match = CEILING.exec(src);
  const base = match ? src.slice(0, -match[0].length) : src;
  // No marker means an older record written before the ceiling existed; fall back to the
  // full ladder, which is the previous behaviour rather than a hard failure.
  const max = match ? Number(match[1]) : VARIANTS[VARIANTS.length - 1];

  const available = VARIANTS.filter((w) => w <= max);
  const chosen =
    available.find((w) => w >= width) ?? available[available.length - 1] ?? VARIANTS[0];

  return `${base}-${chosen}.webp`;
}

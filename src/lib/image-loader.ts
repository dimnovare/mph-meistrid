/**
 * Custom `next/image` loader.
 *
 * Project photos are already optimised: `src/lib/images.ts` writes a WebP ladder to R2 at
 * upload time and Cloudflare serves it. Re-optimising them on Vercel would cost money to
 * produce a worse result, so this loader just snaps the width Next asks for to the nearest
 * variant that exists.
 *
 * `src` for an R2 photo is `<publicBase>/media/projects/<projectId>/<imageId>` with no
 * width and no extension. Anything else — the logo, an OG image, a local asset — is passed
 * straight through untouched.
 */

const VARIANTS = [400, 800, 1200, 1600, 2000];

export default function loader({ src, width }: { src: string; width: number }): string {
  if (!src.includes('/media/projects/')) return src;

  const chosen = VARIANTS.find((w) => w >= width) ?? VARIANTS[VARIANTS.length - 1];
  return `${src}-${chosen}.webp`;
}

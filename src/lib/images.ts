import 'server-only';

import sharp from 'sharp';

/**
 * Server-side half of the upload pipeline. The browser has already decoded and downscaled
 * the file (see `src/lib/client-image.ts`) — including turning an iPhone's HEIC
 * into a JPEG, which is why there is no libheif dependency here. This step normalises
 * orientation, strips metadata and produces the WebP ladder that gets served.
 */

/** Widths generated per image. Anything wider than the source is skipped. */
export const VARIANT_WIDTHS = [400, 800, 1200, 1600, 2000] as const;

/**
 * Hard ceiling on one uploaded file.
 *
 * Sized against Vercel's 4.5 MB serverless request-body limit, not against what sharp could
 * cope with: a larger file is rejected by the platform before this code runs, which would
 * surface as an opaque 413 instead of a readable Estonian message. The browser downscale in
 * `src/lib/client-image.ts` lands a modern phone photo at 400-900 KB, so this leaves
 * generous headroom.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * Cap per project. Not a technical limit — a gallery of 30 photos of one bathroom is already
 * past the point where a visitor keeps clicking, and an unbounded list is how the JSON file
 * and the admin screen quietly become unusable.
 */
export const MAX_PHOTOS_PER_PROJECT = 30;

/** Decompression-bomb guard: a 20k x 20k PNG is small on disk and fatal in memory. */
const MAX_PIXELS = 50_000_000;

const ACCEPTED = new Set(['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff']);

export class InvalidImageError extends Error {
  constructor(readonly reason: 'type' | 'size' | 'dimensions' | 'corrupt') {
    super(`Invalid image: ${reason}`);
    this.name = 'InvalidImageError';
  }
}

export type ProcessedVariant = {
  width: number;
  height: number;
  body: Uint8Array;
};

export type ProcessedImage = {
  width: number;
  height: number;
  variants: ProcessedVariant[];
  blurDataURL: string;
};

export async function processImage(input: Uint8Array): Promise<ProcessedImage> {
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new InvalidImageError('size');

  // `sharp` sniffs the actual container. Trusting the browser's Content-Type would let a
  // renamed file through; trusting the extension would be worse.
  const source = sharp(input, { failOn: 'error', limitInputPixels: MAX_PIXELS });

  let meta: sharp.Metadata;
  try {
    meta = await source.metadata();
  } catch (err) {
    throw new InvalidImageError(err instanceof Error && /pixel/i.test(err.message) ? 'dimensions' : 'corrupt');
  }

  if (!meta.format || !ACCEPTED.has(meta.format)) throw new InvalidImageError('type');
  if (!meta.width || !meta.height) throw new InvalidImageError('corrupt');
  if (meta.width * meta.height > MAX_PIXELS) throw new InvalidImageError('dimensions');

  // `.rotate()` with no argument bakes in EXIF orientation, so a photo shot sideways on a
  // phone is stored the right way up. Metadata is dropped by default, which also removes
  // the GPS coordinates of the client's home.
  const upright = sharp(input, { failOn: 'error', limitInputPixels: MAX_PIXELS }).rotate();
  // Read from the rotated pipeline: a 90-degree EXIF orientation swaps width and height,
  // so the raw metadata would pick the wrong variant ladder for a portrait photo.
  const uprightMeta = await upright.metadata();
  const srcWidth = uprightMeta.width ?? meta.width;

  const targets = VARIANT_WIDTHS.filter((w) => w <= srcWidth);
  // A photo smaller than the narrowest variant still needs one file at its own size.
  if (targets.length === 0) targets.push(VARIANT_WIDTHS[0]);

  const variants: ProcessedVariant[] = [];
  for (const width of targets) {
    const pipeline = sharp(input, { failOn: 'error', limitInputPixels: MAX_PIXELS })
      .rotate()
      .resize({ width: Math.min(width, srcWidth), withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    variants.push({ width: info.width, height: info.height, body: new Uint8Array(data) });
  }

  const blur = await sharp(input, { failOn: 'error', limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();

  const largest = variants[variants.length - 1];

  return {
    width: largest.width,
    height: largest.height,
    variants,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  };
}

/** `media/projects/{projectId}/{imageId}-{width}.webp` */
export function variantKey(projectId: string, imageId: string, width: number): string {
  return `media/projects/${projectId}/${imageId}-${width}.webp`;
}

export function projectMediaPrefix(projectId: string): string {
  return `media/projects/${projectId}/`;
}

/** Immutable: the key contains the image id, so a changed photo is a different key. */
export const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, immutable';

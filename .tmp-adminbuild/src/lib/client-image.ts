/**
 * Browser-side half of the upload pipeline. Runs before anything leaves the phone.
 *
 * Two reasons this exists rather than uploading the original file:
 *
 * 1. Bandwidth. The administrator uploads from a building site over mobile data. A modern
 *    phone photo is 4-8 MB; after this it is 300-600 KB, so eight photos finish in seconds
 *    instead of minutes and a dropped connection costs far less.
 * 2. HEIC. iPhones shoot HEIC. `createImageBitmap` uses the OS decoder, so Safari hands us
 *    pixels and we upload a JPEG — no libheif on the server, no fragile dependency.
 *    Browsers that cannot decode HEIC fall back to the original bytes and the server
 *    returns a plain-language error.
 */

export const MAX_EDGE = 2400;
const QUALITY = 0.82;

/**
 * Must stay at or below `MAX_UPLOAD_BYTES` in `src/lib/images.ts`, which is itself sized
 * against Vercel's 4.5 MB request-body limit. Checked here as well as on the server so an
 * undownscalable file fails instantly on the phone with a readable message, rather than
 * after a slow upload that the platform rejects with an opaque 413.
 */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type PreparedFile = {
  blob: Blob;
  filename: string;
  /** Object URL for the immediate preview. Caller must revoke it. */
  previewUrl: string;
};

/** The file could not be downscaled and is too big to send as-is. */
export class FileTooLargeError extends Error {
  constructor() {
    super('file too large');
    this.name = 'FileTooLargeError';
  }
}

export async function prepareForUpload(file: File): Promise<PreparedFile> {
  try {
    const blob = await downscale(file);
    return {
      blob,
      filename: replaceExtension(file.name, 'jpg'),
      previewUrl: URL.createObjectURL(blob),
    };
  } catch (err) {
    if (err instanceof FileTooLargeError) throw err;

    // Decoding failed — an unsupported HEIC on a non-Apple browser, or a corrupt file.
    // Send the original and let the server decide; it has a better error message than we do.
    // But only if it will actually fit, since an undownscaled phone photo usually will not.
    if (file.size > MAX_UPLOAD_BYTES) throw new FileTooLargeError();

    return {
      blob: file,
      filename: file.name,
      previewUrl: URL.createObjectURL(file),
    };
  }
}

async function downscale(file: File): Promise<Blob> {
  // `imageOrientation: 'from-image'` applies the EXIF rotation, so a photo taken sideways
  // is uploaded upright and the server does not have to guess.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d') as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) throw new Error('no 2d context');

    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await toBlob(canvas);

    // A 2400px JPEG at q0.82 lands well under the limit for any real photograph, but a
    // synthetic image with extreme detail could still exceed it.
    if (blob.size > MAX_UPLOAD_BYTES) throw new FileTooLargeError();
    return blob;
  } finally {
    bitmap.close();
  }
}

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/jpeg', quality: QUALITY });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/jpeg',
      QUALITY,
    );
  });
}

function replaceExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'foto';
  return `${base}.${ext}`;
}

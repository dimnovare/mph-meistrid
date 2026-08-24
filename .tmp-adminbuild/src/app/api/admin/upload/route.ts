import { NextResponse, type NextRequest } from 'next/server';

import { currentUser, sameOrigin } from '@/lib/auth';
import {
  InvalidImageError,
  MAX_PHOTOS_PER_PROJECT,
  MAX_UPLOAD_BYTES,
  MEDIA_CACHE_CONTROL,
  processImage,
  variantKey,
} from '@/lib/images';
import { adminText } from '@/content/admin-text';
import { newId } from '@/lib/ids';
import { putObject } from '@/lib/r2';
import { projectById, writeProjects } from '@/lib/store';
import type { ProjectImage } from '@/lib/types';

/**
 * One photo per request.
 *
 * Uploading photos one at a time rather than as a batch is what makes the admin usable on
 * a building site: each photo shows its own progress, a failure loses one photo instead of
 * all eight, and a dropped connection can be retried per photo.
 *
 * This is the only Route Handler in the project — everything else is a Server Action.
 * It exists because uploads need per-request progress, which Server Actions do not expose.
 */

// Runs sharp, which is a native module and cannot run on the edge runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type UploadError = { error: string; code: string };

export async function POST(request: NextRequest) {
  if (!(await currentUser())) {
    return json({ error: adminText.errors.sessionExpired, code: 'unauthorized' }, 401);
  }

  if (!sameOrigin(request)) {
    return json({ error: adminText.errors.requestRejected, code: 'origin' }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: adminText.errors.uploadInterrupted, code: 'form' }, 400);
  }

  const projectId = form.get('projectId');
  const file = form.get('file');

  if (typeof projectId !== 'string' || !projectId) {
    return json({ error: adminText.errors.saveWorkFirst, code: 'project' }, 400);
  }

  if (!(file instanceof File)) {
    return json({ error: adminText.errors.noFileChosen, code: 'file' }, 400);
  }

  if (file.size === 0) {
    return json({ error: adminText.errors.emptyFile, code: 'empty' }, 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return json(
      { error: adminText.errors.fileTooBig, code: 'too-large' },
      413,
    );
  }

  const project = await projectById(projectId);
  if (!project) {
    return json({ error: adminText.errors.workNotFound, code: 'not-found' }, 404);
  }

  // Checked before the expensive resize, not after, so hitting the cap costs nothing.
  if (project.images.length >= MAX_PHOTOS_PER_PROJECT) {
    return json(
      {
        error: adminText.errors.tooManyPhotos.replace(
          '{{MAX_PHOTOS_PER_WORK}}',
          String(MAX_PHOTOS_PER_PROJECT),
        ),
        code: 'too-many',
      },
      409,
    );
  }

  const imageId = newId();
  let processed;

  try {
    processed = await processImage(new Uint8Array(await file.arrayBuffer()));
  } catch (err) {
    if (err instanceof InvalidImageError) {
      return json({ error: messageFor(err.reason), code: err.reason }, 415);
    }
    console.error('[upload] processing failed', { projectId, imageId }, err);
    return json({ error: adminText.errors.photoProcessingFailed, code: 'process' }, 500);
  }

  try {
    // Written in parallel; R2 has no ordering requirement between variants.
    await Promise.all(
      processed.variants.map((variant) =>
        putObject(variantKey(projectId, imageId, variant.width), variant.body, {
          contentType: 'image/webp',
          cacheControl: MEDIA_CACHE_CONTROL,
        }),
      ),
    );
  } catch (err) {
    console.error('[upload] storage failed', { projectId, imageId }, err);
    return json({ error: adminText.errors.photoStorageFailed, code: 'storage' }, 502);
  }

  const image: ProjectImage = {
    id: imageId,
    width: processed.width,
    height: processed.height,
    variants: processed.variants.map((v) => v.width),
    blurDataURL: processed.blurDataURL,
  };

  try {
    await writeProjects((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id !== projectId
          ? p
          : {
              ...p,
              images: [...p.images, image],
              // First photo uploaded becomes the cover unless one is already chosen.
              coverImageId: p.coverImageId ?? imageId,
              updatedAt: new Date().toISOString(),
            },
      ),
    }));
  } catch (err) {
    console.error('[upload] metadata write failed', { projectId, imageId }, err);
    return json({ error: adminText.errors.photoStorageFailed, code: 'metadata' }, 500);
  }

  return NextResponse.json({ image }, { status: 201 });
}

function json(body: UploadError, status: number) {
  return NextResponse.json(body, { status });
}

function messageFor(reason: InvalidImageError['reason']): string {
  switch (reason) {
    case 'type':
      // The wider list is correct: sharp's allow-list also accepts WebP, AVIF, GIF and TIFF.
      return adminText.errors.unsupportedType;
    case 'size':
      return adminText.errors.fileTooBig;
    case 'dimensions':
      return adminText.errors.photoTooLarge;
    default:
      return adminText.errors.photoUnreadable;
  }
}

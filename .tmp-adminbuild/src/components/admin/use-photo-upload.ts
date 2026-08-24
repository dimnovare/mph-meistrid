'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FileTooLargeError, prepareForUpload } from '@/lib/client-image';
import { adminText } from '@/content/admin-text';
import type { ProjectImage } from '@/lib/types';

/**
 * Photo upload queue for the admin.
 *
 * Shaped entirely around the real use case: the administrator is standing in a finished
 * bathroom holding a phone with two bars of signal, and has just selected eight photos.
 *
 * - Photos upload **one at a time**, in order. Eight parallel uploads on a mobile connection
 *   are slower than eight sequential ones and make every individual progress bar lie.
 * - Each photo carries its own state, so one failure never loses the other seven, and the
 *   failed one can be retried on its own.
 * - The preview appears immediately from the downscaled local blob, so the screen responds
 *   before the network does.
 * - Progress comes from XMLHttpRequest, not fetch: `fetch` still cannot report upload
 *   progress, and a progress bar that jumps 0 → 100 is worse than none on a slow link.
 */

export type PendingPhoto = {
  /** Local id for this queue entry. Not the server's image id. */
  key: string;
  previewUrl: string;
  status: 'waiting' | 'uploading' | 'done' | 'error';
  /** 0–100, only meaningful while uploading. */
  progress: number;
  error?: string;
  /** Present once the server has stored it. */
  image?: ProjectImage;
  /** Kept so a failed photo can be retried without asking for the file again. */
  blob?: Blob;
  filename?: string;
};

type Options = {
  projectId: string;
  /** Fires after each successful upload so the parent can refresh its list. */
  onUploaded?: (image: ProjectImage) => void;
  /** Photos already on the project, so the cap is enforced before anything is sent. */
  existingCount: number;
  maxPhotos: number;
};

export function usePhotoUpload({ projectId, onUploaded, existingCount, maxPhotos }: Options) {
  const [queue, setQueue] = useState<PendingPhoto[]>([]);
  const [busy, setBusy] = useState(false);

  /*
   * The ref is authoritative and the state is a mirror of it, rather than the other way
   * round.
   *
   * The drain loop below is async and has to see photos that were added moments ago — but
   * `setQueue` does not update anything synchronously, so reading React state there would
   * miss them and the loop would exit believing there was nothing to upload. Writing the ref
   * during render would fix the timing and break concurrent rendering. Committing to both at
   * once, from event handlers only, is correct in both respects.
   */
  const queueRef = useRef<PendingPhoto[]>([]);

  const commit = useCallback((next: PendingPhoto[]) => {
    queueRef.current = next;
    setQueue(next);
  }, []);

  const runningRef = useRef(false);
  const abortRef = useRef<XMLHttpRequest | null>(null);

  // Object URLs are leaked memory until revoked, and a phone gallery session can create
  // dozens.
  useEffect(() => {
    return () => {
      for (const photo of queueRef.current) URL.revokeObjectURL(photo.previewUrl);
      abortRef.current?.abort();
    };
  }, []);

  const update = useCallback(
    (key: string, patch: Partial<PendingPhoto>) => {
      commit(queueRef.current.map((p) => (p.key === key ? { ...p, ...patch } : p)));
    },
    [commit],
  );

  const drain = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setBusy(true);

    try {
      for (;;) {
        const next = queueRef.current.find((p) => p.status === 'waiting');
        if (!next?.blob) break;

        update(next.key, { status: 'uploading', progress: 0, error: undefined });

        try {
          const image = await send(projectId, next.blob, next.filename ?? 'foto.jpg', {
            onProgress: (percent) => update(next.key, { progress: percent }),
            register: (xhr) => {
              abortRef.current = xhr;
            },
          });

          // The blob is dropped once the server has it — holding eight of them alive is how
          // an older phone runs out of memory mid-session.
          update(next.key, { status: 'done', progress: 100, image, blob: undefined });
          onUploaded?.(image);
        } catch (err) {
          update(next.key, { status: 'error', error: messageFor(err) });
        } finally {
          abortRef.current = null;
        }
      }
    } finally {
      runningRef.current = false;
      setBusy(false);
    }
  }, [projectId, onUploaded, update]);

  const add = useCallback(
    async (files: File[]) => {
      // Failed entries do not count: they hold no server-side slot and can be discarded.
      const pending = queueRef.current.filter((p) => p.status !== 'error').length;
      const room = maxPhotos - existingCount - pending;

      if (room <= 0) {
        return adminText.errors.tooManyPhotos.replace('{{MAX_PHOTOS_PER_WORK}}', String(maxPhotos));
      }

      const accepted = files.slice(0, room);
      const rejected = files.length - accepted.length;

      // Downscaling happens before anything is queued, so previews are already the bytes
      // that will be sent and the size check is honest.
      const prepared = await Promise.all(
        accepted.map(async (file, index) => {
          const key = `${Date.now()}-${index}-${file.name}`;
          try {
            const { blob, filename, previewUrl } = await prepareForUpload(file);
            return {
              key,
              previewUrl,
              status: 'waiting',
              progress: 0,
              blob,
              filename,
            } satisfies PendingPhoto;
          } catch (err) {
            return {
              key,
              previewUrl: '',
              status: 'error',
              progress: 0,
              error:
                err instanceof FileTooLargeError
                  ? adminText.errors.fileTooBig
                  : adminText.errors.photoUnreadable,
            } satisfies PendingPhoto;
          }
        }),
      );

      commit([...queueRef.current, ...prepared]);
      void drain();

      return rejected > 0
        ? adminText.errors.tooManyPhotos.replace('{{MAX_PHOTOS_PER_WORK}}', String(maxPhotos))
        : null;
    },
    [commit, drain, existingCount, maxPhotos],
  );

  const retry = useCallback(
    (key: string) => {
      const photo = queueRef.current.find((p) => p.key === key);
      if (!photo?.blob) return;
      update(key, { status: 'waiting', error: undefined, progress: 0 });
      void drain();
    },
    [drain, update],
  );

  /** Removes a queue entry. Only for entries that never reached the server. */
  const discard = useCallback(
    (key: string) => {
      const photo = queueRef.current.find((p) => p.key === key);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      commit(queueRef.current.filter((p) => p.key !== key));
    },
    [commit],
  );

  /** Clears finished entries once the parent has folded them into the saved project. */
  const clearCompleted = useCallback(() => {
    for (const photo of queueRef.current) {
      if (photo.status === 'done') URL.revokeObjectURL(photo.previewUrl);
    }
    commit(queueRef.current.filter((p) => p.status !== 'done'));
  }, [commit]);

  return { queue, busy, add, retry, discard, clearCompleted };
}

/* ------------------------------------------------------------------ transport */

class UploadError extends Error {
  constructor(readonly userMessage: string) {
    super(userMessage);
    this.name = 'UploadError';
  }
}

function send(
  projectId: string,
  blob: Blob,
  filename: string,
  hooks: { onProgress: (percent: number) => void; register: (xhr: XMLHttpRequest) => void },
): Promise<ProjectImage> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('projectId', projectId);
    body.append('file', blob, filename);

    const xhr = new XMLHttpRequest();
    hooks.register(xhr);

    xhr.open('POST', '/api/admin/upload');
    // Sent so the server's same-origin check has something to compare; the browser sets
    // Origin on the real request, this is only belt-and-braces for the fetch path.
    xhr.responseType = 'json';

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      // Capped at 99 until the response arrives: the bytes being sent is not the same as the
      // photo being stored, and a bar that sits at 100% while nothing happens reads as frozen.
      hooks.onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    });

    xhr.addEventListener('load', () => {
      const payload = xhr.response as { image?: ProjectImage; error?: string } | null;

      if (xhr.status >= 200 && xhr.status < 300 && payload?.image) {
        resolve(payload.image);
        return;
      }

      if (xhr.status === 401) {
        reject(new UploadError(adminText.errors.sessionExpired));
        return;
      }

      // The server writes its own Estonian message for every failure it knows about.
      reject(new UploadError(payload?.error ?? adminText.errors.uploadFailed));
    });

    xhr.addEventListener('error', () => reject(new UploadError(adminText.errors.networkLost)));
    xhr.addEventListener('abort', () =>
      reject(new UploadError(adminText.errors.uploadInterrupted)),
    );
    xhr.addEventListener('timeout', () =>
      reject(new UploadError(adminText.errors.uploadInterrupted)),
    );

    // Generous: a 4 MB photo over a weak mobile uplink is slow, and giving up early is worse
    // than waiting.
    xhr.timeout = 120_000;
    xhr.send(body);
  });
}

function messageFor(err: unknown): string {
  if (err instanceof UploadError) return err.userMessage;
  if (err instanceof FileTooLargeError) return adminText.errors.fileTooBig;
  return adminText.errors.uploadFailed;
}

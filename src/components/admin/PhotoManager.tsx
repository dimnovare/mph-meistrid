'use client';

import Image from 'next/image';
import { startTransition, useCallback, useEffect, useState } from 'react';

import { deleteImageAction, reorderImagesAction, setCoverAction } from '@/app/admin/actions';
import {
  AdminNotice,
  ConfirmDialog,
  adminControl,
  adminControlDanger,
} from '@/components/admin/ConfirmDialog';
import { usePhotoUpload } from '@/components/admin/use-photo-upload';
import { adminText } from '@/content/admin-text';
import type { ProjectImage } from '@/lib/types';

/**
 * Photos. The screen the whole admin exists for.
 *
 * Built on `use-photo-upload.ts`, which owns the queue, the one-at-a-time transport and the
 * per-photo retry. This file is the surface: a target big enough to hit without looking, a
 * preview the moment a file is chosen, and one row per photo with everything that can be
 * done to it spelled out in words.
 *
 * Three decisions that are not stylistic:
 *
 * - **The file input sets no `capture`.** With it, the phone opens the camera and the photo
 *   library becomes unreachable — and the library is the normal case: he shot the bathroom
 *   an hour ago and is standing in the van now.
 * - **Reordering is explicit ↑ / ↓ buttons, not dragging.** HTML5 drag-and-drop does not
 *   fire on touch at all, and a pointer-event drag is a lot of fragile code to reproduce
 *   something that two buttons do better with dusty hands. Desktop still gets drag-and-drop
 *   for *adding* files, where the browser does the work.
 * - **Saved photos and queued photos are two different lists.** A photo the server has
 *   stored can be reordered and made the cover; one that is still going up cannot, and
 *   pretending otherwise is how a tap silently does nothing.
 */

type PhotoManagerProps = {
  projectId: string;
  images: ProjectImage[];
  coverImageId: string | null;
  /** `https://<cdn>/media/projects/<id>/` — a client component cannot read the R2 config. */
  mediaBase: string;
  /** `MAX_PHOTOS_PER_PROJECT`, passed down because `@/lib/images` is server-only. */
  maxPhotos: number;
  /** Lets the form warn before the page is closed with photos still in flight. */
  onBusyChange?: (busy: boolean) => void;
};

/** Estonian has exactly two plural forms. */
function plural(forms: { one: string; other: string }, count: number): string {
  return (count === 1 ? forms.one : forms.other).replace('{count}', String(count));
}

export function PhotoManager({
  projectId,
  images,
  coverImageId,
  mediaBase,
  maxPhotos,
  onBusyChange,
}: PhotoManagerProps) {
  const [photos, setPhotos] = useState<ProjectImage[]>(images);
  const [coverId, setCoverId] = useState<string | null>(coverImageId);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<ProjectImage | null>(null);

  /**
   * The photos that were already on the job when this screen loaded. Anything added since is
   * counted by the upload queue instead, and a finished photo sits in both lists until the
   * batch ends — so counting `photos.length` towards the cap would charge twice for the same
   * photo and refuse the last few uploads. Held as state with a lazy initialiser so it is
   * computed once and stays put when the server re-renders the page above us.
   */
  const [originalIds] = useState(() => new Set(images.map((image) => image.id)));

  const handleUploaded = useCallback((image: ProjectImage) => {
    setPhotos((current) =>
      current.some((photo) => photo.id === image.id) ? current : [...current, image],
    );
    // The upload route promotes the first photo to cover; mirroring it here means the badge
    // is right immediately rather than after the next server render.
    setCoverId((current) => current ?? image.id);
  }, []);

  const { queue, busy, add, retry, discard, clearCompleted } = usePhotoUpload({
    projectId,
    onUploaded: handleUploaded,
    existingCount: photos.filter((photo) => originalIds.has(photo.id)).length,
    maxPhotos,
  });

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  // Finished entries are folded into `photos` by `handleUploaded` above, but they are only
  // handed back to the queue once the whole batch is done — otherwise the "3 / 8" line would
  // count down while he is reading it.
  useEffect(() => {
    if (busy || !queue.some((photo) => photo.status === 'done')) return;
    clearCompleted();
  }, [busy, queue, clearCompleted]);

  const pending = queue.filter((photo) => photo.status !== 'done');
  const uploaded = queue.length - pending.length;
  const inFlight = pending.filter((photo) => photo.status !== 'error').length;
  const full = photos.length + inFlight >= maxPhotos;

  async function accept(files: FileList | File[] | null) {
    setNotice(null);

    const chosen = Array.from(files ?? []);
    if (chosen.length === 0) {
      setNotice(adminText.errors.noFileChosen);
      return;
    }

    // An empty type is allowed through: some Android pickers report nothing at all for HEIC,
    // and the server sniffs the real container anyway.
    const pictures = chosen.filter((file) => file.type === '' || file.type.startsWith('image/'));
    if (pictures.length === 0) {
      setNotice(adminText.errors.unsupportedType);
      return;
    }

    const problem = await add(pictures);
    setNotice(
      problem ?? (pictures.length < chosen.length ? adminText.errors.unsupportedType : null),
    );
  }

  /**
   * Order is saved the moment it changes. A separate "save the order" button would be one
   * more thing to forget, and an order that was never stored is worth nothing.
   */
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;

    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next);

    startTransition(() => {
      void reorderImagesAction(
        projectId,
        next.map((photo) => photo.id),
      );
    });
  }

  function promote(imageId: string) {
    setCoverId(imageId);

    const body = new FormData();
    body.set('projectId', projectId);
    body.set('imageId', imageId);
    startTransition(() => {
      void setCoverAction(body);
    });
  }

  function removeConfirmed() {
    const image = pendingRemove;
    if (!image) return;

    setPendingRemove(null);

    const next = photos.filter((photo) => photo.id !== image.id);
    setPhotos(next);
    // Same promotion rule the server applies: removing the cover moves the badge to whatever
    // is now first, rather than leaving the job with no cover at all.
    if (coverId === image.id) setCoverId(next[0]?.id ?? null);

    const body = new FormData();
    body.set('projectId', projectId);
    body.set('imageId', image.id);
    startTransition(() => {
      void deleteImageAction(body);
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-[1.5rem] font-bold leading-tight">
          {adminText.photos.heading}
        </h2>
        {photos.length > 0 ? (
          <p className="mt-1 text-body text-fg-muted">
            {plural(adminText.photos.count, photos.length)}
          </p>
        ) : null}
      </div>

      {notice ? <AdminNotice tone="error">{notice}</AdminNotice> : null}

      {full ? (
        <p className="rounded-panel border-2 border-line-strong bg-page p-4 text-body text-fg-strong">
          {adminText.errors.tooManyPhotos.replace('{{MAX_PHOTOS_PER_WORK}}', String(maxPhotos))}
        </p>
      ) : (
        /*
          The whole zone is the label, so a tap anywhere opens the picker — no aiming at a
          small button one-handed. The drag handlers are a desktop nicety on top; they cost
          four lines and do nothing on touch, where the tap already works.
        */
        <label
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void accept(event.dataTransfer.files);
          }}
          className={`flex min-h-45 cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed p-6 text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
            dragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface'
          }`}
        >
          <span className="font-display text-[1.25rem] font-bold text-fg-strong">
            {adminText.photos.add}
          </span>
          <span className="text-body text-fg-strong">{adminText.photos.addHint}</span>
          <span className="text-body text-fg-muted">{adminText.photos.dropHint}</span>

          <input
            type="file"
            accept="image/*"
            multiple
            // Deliberately no `capture`: it would force the camera and take the photo
            // library away, and the library is where the photos of the finished job are.
            className="sr-only"
            onChange={(event) => {
              const files = event.target.files;
              // Cleared so choosing the same photo twice in a row still fires `change`.
              event.target.value = '';
              void accept(files);
            }}
          />
        </label>
      )}

      {busy ? (
        <div
          aria-live="polite"
          className="rounded-panel border-2 border-line-strong bg-page p-4"
        >
          <p className="text-body font-semibold text-fg-strong">
            {queue.length <= 1
              ? adminText.project.progress.uploadingOne
              : adminText.project.progress.uploading
                  .replace('{done}', String(uploaded))
                  .replace('{total}', String(queue.length))}
          </p>
          <p className="mt-1 text-body text-fg-muted">{adminText.project.progress.dontClose}</p>
        </div>
      ) : null}

      {photos.length === 0 && pending.length === 0 ? (
        <p className="text-body text-fg-strong">{adminText.photos.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="flex flex-wrap items-start gap-3 rounded-panel border-2 border-line-strong bg-page p-3"
            >
              <div className="h-18 w-24 shrink-0 overflow-hidden bg-surface-2 shadow-frame">
                <Image
                  src={`${mediaBase}${photo.id}`}
                  // Decorative here: the row's own controls carry the meaning, and a photo
                  // of a bathroom has no description we could honestly write for him.
                  alt=""
                  width={96}
                  height={72}
                  sizes="96px"
                  placeholder="blur"
                  blurDataURL={photo.blurDataURL}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {photo.id === coverId ? (
                  <span className="inline-flex w-fit items-center gap-2 rounded-chip bg-accent px-2 py-1 text-body font-semibold text-on-accent">
                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      fill="currentColor"
                      className="size-4 shrink-0"
                    >
                      <path d="m10 1.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 15l-5.2 2.7 1-5.8L1.5 7.8l5.9-.9L10 1.6Z" />
                    </svg>
                    {adminText.photos.isCover}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => promote(photo.id)}
                    className={`${adminControl} px-3`}
                  >
                    {adminText.photos.setCover}
                  </button>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={adminText.photos.moveUp}
                  title={adminText.photos.moveUp}
                  className={`${adminControl} w-12 px-0`}
                >
                  <Arrow />
                </button>

                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === photos.length - 1}
                  aria-label={adminText.photos.moveDown}
                  title={adminText.photos.moveDown}
                  className={`${adminControl} w-12 px-0`}
                >
                  <Arrow down />
                </button>
              </div>

              {/* Destructive control on its own line, never beside anything else (§9). */}
              <button
                type="button"
                onClick={() => setPendingRemove(photo)}
                className={`${adminControlDanger} w-full`}
              >
                {adminText.photos.remove}
              </button>
            </li>
          ))}

          {pending.map((photo) => (
            <li
              key={photo.key}
              className="flex flex-wrap items-start gap-3 rounded-panel border-2 border-line-strong bg-page p-3"
            >
              <div className="h-18 w-24 shrink-0 overflow-hidden bg-surface-2 shadow-frame">
                {photo.previewUrl ? (
                  /*
                    A local blob URL from the browser's own downscale. `next/image` has
                    nothing to add to it and the custom loader would hand it straight back,
                    so this is a plain <img> on purpose.
                  */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {photo.status === 'error' ? (
                  <span className="text-body text-danger">
                    {photo.error ?? adminText.errors.uploadFailed}
                  </span>
                ) : (
                  <>
                    <span className="text-body text-fg-strong">
                      {adminText.project.progress.uploadingOne}
                    </span>
                    <div
                      role="progressbar"
                      aria-label={adminText.project.progress.uploadingOne}
                      aria-valuenow={photo.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-1.5 w-full overflow-hidden rounded-chip bg-surface-2"
                    >
                      <div className="h-full bg-accent" style={{ width: `${photo.progress}%` }} />
                    </div>
                  </>
                )}
              </div>

              {photo.status === 'error' ? (
                <div className="flex w-full gap-2">
                  {/* Only offered when the file is still in memory to send again. */}
                  {photo.blob ? (
                    <button
                      type="button"
                      onClick={() => retry(photo.key)}
                      className={`${adminControl} flex-1 px-2`}
                    >
                      {adminText.errors.retry}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => discard(photo.key)}
                    className={`${adminControlDanger} flex-1 px-2`}
                  >
                    {adminText.photos.remove}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-body text-fg-muted">{adminText.photos.coverHint}</p>
      <p className="text-body text-fg-muted">{adminText.photos.reorderHint}</p>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={adminText.confirm.removePhoto.title}
        body={adminText.confirm.removePhoto.body}
        confirmLabel={adminText.confirm.removePhoto.confirm}
        cancelLabel={adminText.confirm.removePhoto.cancel}
        onCancel={() => setPendingRemove(null)}
        onConfirm={removeConfirmed}
      />
    </section>
  );
}

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="currentColor"
      className={`size-5 ${down ? 'rotate-180' : ''}`}
    >
      <path d="M10 3.6 18.4 14.4a1 1 0 0 1-.8 1.6H2.4a1 1 0 0 1-.8-1.6L10 3.6Z" />
    </svg>
  );
}

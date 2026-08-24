'use client';

import Image from 'next/image';
import { startTransition, useCallback, useEffect, useState } from 'react';

import { deleteImageAction, reorderImagesAction, setCoverAction } from '@/app/admin/actions';
import { AdminNotice, ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Arrow, CameraGlyph } from '@/components/admin/icons';
import {
  adminControl,
  adminControlDangerQuiet,
  adminDivider,
  adminH2,
  adminHint,
  adminMeta,
  adminNoticeQuiet,
  adminPanel,
  adminPanelQuiet,
  adminStripCell,
} from '@/components/admin/styles';
import { usePhotoUpload } from '@/components/admin/use-photo-upload';
import { adminText } from '@/content/admin-text';
import type { ProjectImage } from '@/lib/types';

/**
 * Photos. The screen the whole admin exists for.
 *
 * Built on `use-photo-upload.ts`, which owns the queue, the one-at-a-time transport and the
 * per-photo retry. This file is the surface: a target big enough to hit without looking, and
 * one row per stored photo with everything that can be done to it spelled out in words.
 *
 * Four decisions that are not stylistic:
 *
 * - **Two file inputs, and only one of them sets `capture`.** The dropzone's input has none,
 *   because `capture` forces the camera and takes the photo library away — and the library
 *   is the normal case: he shot the bathroom an hour ago and is standing in the van now.
 *   „Tee foto“ is a *second* control with `capture="environment"`, for the case where he is
 *   still standing in the room he just finished.
 * - **Progress is one aggregate block, not one bar per photo.** Under a poor signal this is
 *   the screen he stares at longest, and eight small bars at arm's length say less than one
 *   big count and one thick bar. The transport is unchanged — still one photo at a time,
 *   each with its own retry — but only the *failures* earn a row of their own, because a
 *   failure is the only per-photo fact he has to act on.
 * - **Reordering is explicit ↑ / ↓ buttons, not dragging.** HTML5 drag-and-drop does not
 *   fire on touch at all, and a pointer-event drag is a lot of fragile code to reproduce
 *   something that two buttons do better with dusty hands. Desktop still gets drag-and-drop
 *   for *adding* files, where the browser does the work.
 * - **The cover photo is first.** Not by sorting the display — that would make the arrows
 *   appear to do nothing — but because „Tee kaanepildiks“ moves the photo to the front and
 *   saves that order. So the question "which one is the cover" is answered by position as
 *   well as by the badge, and it stays true rather than being staged.
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
  const failed = pending.filter((photo) => photo.status === 'error');
  const uploaded = queue.length - pending.length;
  const inFlight = pending.length - failed.length;
  const full = photos.length + inFlight >= maxPhotos;

  /**
   * One number for the whole batch: the photos already stored, plus however far the one
   * currently on the wire has got. Anything finer than this is detail he cannot act on.
   */
  const activeProgress = pending.find((photo) => photo.status === 'uploading')?.progress ?? 0;
  const percent =
    queue.length === 0 ? 0 : Math.round(((uploaded + activeProgress / 100) / queue.length) * 100);

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

  /**
   * Making a photo the cover also moves it to the front. The Estonian hint has always said
   * the first photo is the cover, and this is what makes that true instead of nearly true —
   * and it is why the cover row can be recognised by its position, not only by its badge.
   */
  function promote(imageId: string) {
    setCoverId(imageId);

    const index = photos.findIndex((photo) => photo.id === imageId);
    const next = [...photos];
    if (index > 0) {
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      setPhotos(next);
    }

    const body = new FormData();
    body.set('projectId', projectId);
    body.set('imageId', imageId);

    startTransition(() => {
      void setCoverAction(body);
      if (index > 0) {
        void reorderImagesAction(
          projectId,
          next.map((photo) => photo.id),
        );
      }
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
      <div className="flex items-baseline justify-between gap-4">
        <h2 className={adminH2}>{adminText.photos.heading}</h2>
        {/* Numerals only: the cap is the fact he needs, and „5 / 30“ needs no translating. */}
        <p className={adminMeta}>
          {photos.length} / {maxPhotos}
        </p>
      </div>

      {notice ? <AdminNotice tone="error">{notice}</AdminNotice> : null}

      {full ? (
        <>
          <p className={adminNoticeQuiet}>
            {adminText.errors.tooManyPhotos.replace(
              '{{MAX_PHOTOS_PER_WORK}}',
              String(maxPhotos),
            )}
          </p>
          {/*
            The add control stays on screen and goes disabled rather than disappearing: a
            control that vanishes reads as a fault, one that is visibly off reads as a limit.
          */}
          <button type="button" disabled className={`${adminControl} w-full`}>
            {adminText.photos.add}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {/*
            The whole zone is the label, so a tap anywhere opens the picker — no aiming at a
            small button one-handed. The drag handlers are a desktop nicety on top; they cost
            four lines and do nothing on touch, where the tap already works.
          */}
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
            className={`flex min-h-45 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-panel border-2 border-dashed p-6 text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
              dragging ? 'border-fg-strong bg-surface-2' : 'border-fg bg-surface'
            }`}
          >
            <span className="text-[1.125rem] leading-none font-semibold text-fg-strong">
              {adminText.photos.add}
            </span>
            <span className="text-[1rem] leading-[1.45] text-fg-muted">
              {adminText.photos.addHint}
            </span>
            {/* Only where dragging is possible; on a phone it would be a line about nothing. */}
            <span className="hidden text-[1rem] leading-[1.45] text-fg-muted sm:block">
              {adminText.photos.dropHint}
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              // Deliberately no `capture`: it would force the camera and take the photo
              // library away, and the library is where the photos of the finished job are.
              // The camera lives on its own input below.
              className="sr-only"
              onChange={(event) => {
                const files = event.target.files;
                // Cleared so choosing the same photo twice in a row still fires `change`.
                event.target.value = '';
                void accept(files);
              }}
            />
          </label>

          {/*
            „Tee foto“ — the second input, and the only one that sets `capture`. Not
            `multiple`: a camera hands back one photo at a time.
          */}
          <label
            className={`${adminControl} w-full cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus`}
          >
            <CameraGlyph />
            {adminText.photos.takePhoto}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                const files = event.target.files;
                event.target.value = '';
                void accept(files);
              }}
            />
          </label>
        </div>
      )}

      {busy ? (
        /*
          One block, loud enough to read at arm's length: how many are done, how far along
          the batch is, and the one instruction that matters while it runs.
        */
        <div
          aria-live="polite"
          className="flex flex-col gap-3 rounded-panel border-2 border-fg-strong bg-surface p-4"
        >
          <p className="font-display text-[1.375rem] leading-none font-extrabold text-fg-strong">
            {queue.length <= 1
              ? adminText.project.progress.uploadingOne
              : adminText.project.progress.uploadingCount
                  .replace('{done}', String(uploaded))
                  .replace('{total}', String(queue.length))}
          </p>

          <div
            role="progressbar"
            aria-label={adminText.project.progress.uploadingOne}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2.5 w-full overflow-hidden rounded-chip bg-line"
          >
            <div
              className="h-full bg-ink transition-[width] duration-base"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="text-[1rem] leading-[1.3] font-semibold text-fg-strong">
            {adminText.project.progress.dontClose}
          </p>
        </div>
      ) : null}

      {/*
        A failed photo is the one per-photo fact he has to act on, so it is the one thing that
        still gets its own row. Retrying costs one photo, never the batch.
      */}
      {failed.map((photo) => (
        <div
          key={photo.key}
          className="flex flex-col gap-3 rounded-panel border-2 border-danger bg-danger-soft p-3"
        >
          <div className="flex items-center gap-3">
            <div className="aspect-cover w-16 shrink-0 overflow-hidden rounded-control bg-surface-2 shadow-frame">
              {photo.previewUrl ? (
                /*
                  A local blob URL from the browser's own downscale. `next/image` has nothing
                  to add to it and the custom loader would hand it straight back, so this is a
                  plain <img> on purpose.
                */
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>

            <p className="min-w-0 flex-1 text-[1rem] leading-[1.3] font-semibold text-danger">
              {photo.error ?? adminText.errors.uploadFailed}
            </p>
          </div>

          <div className="flex gap-2.5">
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
              className={`${adminControlDangerQuiet} flex-1`}
            >
              {adminText.photos.remove}
            </button>
          </div>
        </div>
      ))}

      {photos.length === 0 ? (
        pending.length === 0 ? (
          <p className={adminHint}>{adminText.photos.empty}</p>
        ) : null
      ) : (
        <ul className="flex flex-col gap-3">
          {photos.map((photo, index) => {
            const isCover = photo.id === coverId;

            return (
              <li key={photo.id} className={isCover ? adminPanel : adminPanelQuiet}>
                <div
                  className={`flex items-center gap-3 p-3 ${isCover ? 'bg-surface' : ''}`.trim()}
                >
                  <div className="aspect-cover w-28 shrink-0 overflow-hidden rounded-control bg-surface-2 shadow-frame sm:w-33">
                    <Image
                      src={`${mediaBase}${photo.id}`}
                      // Decorative here: the row's own controls carry the meaning, and a
                      // photo of a bathroom has no description we could honestly write.
                      alt=""
                      width={132}
                      height={99}
                      sizes="(min-width: 640px) 132px, 112px"
                      placeholder="blur"
                      blurDataURL={photo.blurDataURL}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {isCover ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="inline-flex w-fit items-center gap-[7px] rounded-control bg-ink px-3 py-2 text-[1rem] leading-none font-semibold text-white">
                        <span aria-hidden="true" className="size-2.5 rounded-chip bg-white" />
                        {adminText.photos.isCover}
                      </span>
                      <span className="text-[1rem] leading-[1.35] text-fg-muted">
                        {adminText.photos.coverRowHint}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => promote(photo.id)}
                      className={`${adminControl} min-w-0 flex-1 px-2 text-[1rem]`}
                    >
                      {adminText.photos.setCover}
                    </button>
                  )}
                </div>

                <div className={`flex border-t ${adminDivider}`}>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={adminText.photos.moveUp}
                    title={adminText.photos.moveUp}
                    className={`${adminStripCell} flex-1 border-r px-0 ${adminDivider}`}
                  >
                    <Arrow />
                  </button>

                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === photos.length - 1}
                    aria-label={adminText.photos.moveDown}
                    title={adminText.photos.moveDown}
                    className={`${adminStripCell} flex-1 border-r px-0 ${adminDivider}`}
                  >
                    <Arrow down />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingRemove(photo)}
                    className={`${adminControlDangerQuiet} flex-[1.4]`}
                  >
                    {adminText.photos.remove}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/*
        Only the reordering hint survives: „which one is the cover“ is now answered by the
        badge and by the row being first, so repeating it underneath was a third statement of
        the same fact on a screen where every line costs a scroll.
      */}
      {photos.length > 1 ? <p className={adminHint}>{adminText.photos.reorderHint}</p> : null}

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

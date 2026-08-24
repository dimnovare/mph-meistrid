'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteProjectAction,
  saveProjectAction,
  type FormState,
} from '@/app/admin/actions';
import {
  AdminNotice,
  ConfirmDialog,
  adminControlDanger,
  adminFields,
} from '@/components/admin/ConfirmDialog';
import { PhotoManager } from '@/components/admin/PhotoManager';
import { Button } from '@/components/ui/Button';
import { BilingualField } from '@/components/ui/Field';
import { adminText } from '@/content/admin-text';
import type { Project } from '@/lib/types';

/**
 * One job: what it is called, its photos, and whether it is on the site.
 *
 * The order on screen is the order he thinks in — name, then photos, then the two fields he
 * may well skip. Photos come second and not last because photographing the finished bathroom
 * is the reason he opened this screen at all.
 *
 * Both buttons submit this same form with a different `published` value; the labels change
 * with the current state, so the screen never asks him to work out what "publish" would do
 * to something that is already published.
 *
 * Deleting lives in its own `<form>` below the rule. That is partly the design system's
 * "physical separation" rule and partly plain HTML: a form cannot be nested inside a form,
 * and `deleteProjectAction` needs one of its own for `useActionState`.
 */

type ProjectFormProps = {
  project: Project;
  /** `https://<cdn>/media/projects/<id>/` — resolved on the server. */
  mediaBase: string;
  maxPhotos: number;
};

const initialState: FormState = {};

const secondaryButton =
  'inline-flex min-h-14 w-full items-center justify-center rounded-panel border-2 ' +
  'border-fg-strong bg-page px-5 py-2 text-body font-semibold text-fg-strong ' +
  'transition-colors hover:bg-surface-2 active:bg-surface-2';

const quietButton =
  'inline-flex min-h-14 w-full items-center justify-center rounded-panel px-5 py-2 ' +
  'text-body font-semibold text-fg-strong transition-colors hover:bg-surface-2';

const hintClass = 'text-body text-fg-muted';

export function ProjectForm({ project, mediaBase, maxPhotos }: ProjectFormProps) {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const secondaryRef = useRef<HTMLButtonElement>(null);

  const [saveState, saveFormAction, saving] = useActionState(saveProjectAction, initialState);
  const [deleteState, deleteFormAction, deleting] = useActionState(
    deleteProjectAction,
    initialState,
  );

  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [askUnpublish, setAskUnpublish] = useState(false);
  const [askLeave, setAskLeave] = useState(false);
  const [askDelete, setAskDelete] = useState(false);

  const onBusyChange = useCallback((busy: boolean) => setUploading(busy), []);

  /**
   * The browser's own "leave this page?" prompt. Its wording is not ours to set — every
   * browser ignores a custom message — so `preventDefault()` is the whole implementation.
   *
   * It is armed while there is unsaved text *or* a photo still going up: closing the tab
   * mid-upload is the one way to lose a photo that has already been chosen. Saving redirects
   * through the client router, which does not trigger this, so a successful save never
   * produces a prompt.
   */
  useEffect(() => {
    if (!dirty && !uploading) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, uploading]);

  const titleError =
    saveState.error === adminText.errors.titleRequired ? saveState.error : undefined;

  const primaryLabel = project.published
    ? adminText.project.saveChanges
    : adminText.project.publish;

  const primaryBusyLabel = project.published
    ? adminText.project.progress.saving
    : adminText.project.progress.publishing;

  const secondaryLabel = project.published
    ? adminText.project.unpublish
    : adminText.project.saveDraft;

  function leave() {
    setAskLeave(false);
    router.push('/admin');
  }

  return (
    <div className="flex flex-col gap-8">
      <form ref={formRef} action={saveFormAction} className="flex flex-col gap-8">
        <input type="hidden" name="id" value={project.id} readOnly />

        {/*
          A form submits with whichever submit button comes first in the markup, and the
          primary action is pinned to the bottom of the screen by design. Without this
          duplicate, pressing "Mine" on the phone keyboard would run the *secondary* button —
          saving as a draft, or opening the unpublish confirmation — while the button he is
          looking at says "Avalda töö". Hidden from sight, from the tab order and from
          assistive technology, because the real control is already on screen.
        */}
        <button
          type="submit"
          name="published"
          value="true"
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
        />

        {saveState.error ? <AdminNotice tone="error">{saveState.error}</AdminNotice> : null}

        <StateChip published={project.published} />

        {/* 1 — what the job is called. The only field the site cannot do without. */}
        <div className={`flex flex-col gap-3 ${adminFields}`} onInput={() => setDirty(true)}>
          <BilingualField
            id="title"
            name="title"
            required
            label={`${adminText.project.name.label} — ${adminText.project.lang.et}`}
            ruLabel={`${adminText.project.name.label} — ${adminText.project.lang.ru}`}
            ruHint={adminText.project.lang.ruOptional}
            defaultEt={project.title.et}
            defaultRu={project.title.ru ?? ''}
            error={titleError}
          />
          <p className={hintClass}>{adminText.project.name.hint}</p>
          <p className={hintClass}>{adminText.project.lang.explain}</p>
          <p className={hintClass}>{adminText.project.lang.ruHint}</p>
        </div>

        {/* 2 — photos, before the optional fields, because this is what he came to do. */}
        <PhotoManager
          projectId={project.id}
          images={project.images}
          coverImageId={project.coverImageId}
          mediaBase={mediaBase}
          maxPhotos={maxPhotos}
          onBusyChange={onBusyChange}
        />

        {/* 3 — the two he may well skip. Their own hints say so. */}
        <div className={`flex flex-col gap-3 ${adminFields}`} onInput={() => setDirty(true)}>
          <BilingualField
            id="location"
            name="location"
            label={`${adminText.project.location.label} — ${adminText.project.lang.et}`}
            ruLabel={`${adminText.project.location.label} — ${adminText.project.lang.ru}`}
            ruHint={adminText.project.lang.ruOptional}
            defaultEt={project.location?.et ?? ''}
            defaultRu={project.location?.ru ?? ''}
          />
          <p className={hintClass}>{adminText.project.location.hint}</p>
        </div>

        <div className={`flex flex-col gap-3 ${adminFields}`} onInput={() => setDirty(true)}>
          <BilingualField
            id="description"
            name="description"
            multiline
            label={`${adminText.project.description.label} — ${adminText.project.lang.et}`}
            ruLabel={`${adminText.project.description.label} — ${adminText.project.lang.ru}`}
            ruHint={adminText.project.lang.ruOptional}
            defaultEt={project.description?.et ?? ''}
            defaultRu={project.description?.ru ?? ''}
          />
          <p className={hintClass}>{adminText.project.description.hint}</p>
        </div>

        {/* 4 — the other way to save, plus the way out. */}
        <div className="flex flex-col gap-3">
          <button
            ref={secondaryRef}
            type="submit"
            name="published"
            value="false"
            onClick={(event) => {
              // Saving a draft as a draft changes nothing anyone can see, so it just runs.
              // Taking a live job off the site does change what customers see, so it asks.
              if (!project.published) return;
              event.preventDefault();
              setAskUnpublish(true);
            }}
            className={secondaryButton}
          >
            {secondaryLabel}
          </button>

          <p className={hintClass}>
            {project.published
              ? adminText.confirm.unpublish.body
              : adminText.project.saveDraftHint}
          </p>

          <button
            type="button"
            onClick={() => (dirty ? setAskLeave(true) : leave())}
            className={quietButton}
          >
            {adminText.project.cancel}
          </button>
        </div>

        {/*
          §9's sticky action bar: the one primary action, permanently inside the bottom third
          of the screen where a thumb can reach it one-handed. `sticky` rather than `fixed`
          so it stops covering the page once the form has been scrolled past.
        */}
        <div
          className="sticky bottom-0 z-10 -mx-gutter border-t border-ink-line bg-ink px-gutter pt-3 shadow-bar"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <Button
            type="submit"
            name="published"
            value="true"
            size="admin"
            disabled={saving}
            className="rounded-panel"
          >
            {saving ? primaryBusyLabel : primaryLabel}
          </Button>

          {/* Only says "this goes on the site" when that is what pressing it would do. */}
          {project.published ? null : (
            <p className="mt-2 text-body text-on-ink-muted">{adminText.project.publishHint}</p>
          )}
        </div>
      </form>

      {/* Deleting sits below a rule, well away from anything that saves (§9). */}
      <div className="border-t border-line pt-6">
        {deleteState.error ? <AdminNotice tone="error">{deleteState.error}</AdminNotice> : null}

        <form ref={deleteFormRef} action={deleteFormAction} className="mt-4">
          <input type="hidden" name="id" value={project.id} readOnly />
          <button
            type="button"
            onClick={() => setAskDelete(true)}
            className={`${adminControlDanger} w-full`}
          >
            {adminText.project.delete}
          </button>
        </form>
      </div>

      <ConfirmDialog
        open={askUnpublish}
        // Reversible — the job stays here and can go back up — so no red.
        tone="neutral"
        title={adminText.confirm.unpublish.title}
        body={adminText.confirm.unpublish.body}
        confirmLabel={adminText.confirm.unpublish.confirm}
        cancelLabel={adminText.confirm.unpublish.cancel}
        onCancel={() => setAskUnpublish(false)}
        onConfirm={() => {
          setAskUnpublish(false);
          // Submitting *through* the button carries its `published=false` into the POST,
          // which a bare `requestSubmit()` would not.
          formRef.current?.requestSubmit(secondaryRef.current ?? undefined);
        }}
      />

      <ConfirmDialog
        open={askLeave}
        tone="neutral"
        title={adminText.confirm.leave.title}
        body={adminText.confirm.leave.body}
        confirmLabel={adminText.confirm.leave.confirm}
        cancelLabel={adminText.confirm.leave.cancel}
        onCancel={() => setAskLeave(false)}
        onConfirm={leave}
      />

      <ConfirmDialog
        open={askDelete}
        busy={deleting}
        title={adminText.confirm.deleteWork.title.replace(
          '{name}',
          project.title.et.trim() || adminText.project.newHeading,
        )}
        body={
          project.images.length > 0
            ? (project.images.length === 1
                ? adminText.confirm.deleteWork.body.one
                : adminText.confirm.deleteWork.body.other
              ).replace('{count}', String(project.images.length))
            : adminText.confirm.deleteWork.bodyNoPhotos
        }
        // Never dropped: this is the line that stops him destroying a job when all he wanted
        // was to take it off the site.
        alternative={adminText.confirm.deleteWork.alternative}
        confirmLabel={adminText.confirm.deleteWork.confirm}
        cancelLabel={adminText.confirm.deleteWork.cancel}
        busyLabel={adminText.project.progress.deleting}
        onCancel={() => setAskDelete(false)}
        onConfirm={() => deleteFormRef.current?.requestSubmit()}
      />
    </div>
  );
}

/** Where this job stands right now, in words — never colour or a switch position alone. */
function StateChip({ published }: { published: boolean }) {
  return (
    <p
      className={`inline-flex w-fit items-center gap-2 rounded-chip px-2 py-1 text-body ${
        published ? 'bg-success-soft text-success' : 'bg-surface-2 text-fg-muted'
      }`}
    >
      <svg viewBox="0 0 10 10" aria-hidden="true" className="size-2.5 shrink-0">
        <circle
          cx="5"
          cy="5"
          r="3.5"
          fill={published ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      {published
        ? adminText.dashboard.works.statusPublished
        : adminText.dashboard.works.statusDraft}
    </p>
  );
}

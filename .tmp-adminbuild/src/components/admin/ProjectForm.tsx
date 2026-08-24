'use client';

import { useRouter } from 'next/navigation';
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { deleteProjectAction, saveProjectAction, type FormState } from '@/app/admin/actions';
import { AdminBilingualField } from '@/components/admin/AdminField';
import { AdminNotice, ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { PhotoManager } from '@/components/admin/PhotoManager';
import { BackArrow, Spinner, StatusDot } from '@/components/admin/icons';
import {
  adminBarPrimary,
  adminBarSecondary,
  adminBarStatus,
  adminControlDanger,
  adminDivider,
  adminH1,
  adminHint,
  adminStickyBar,
  adminStickyBarPadding,
  adminTextLink,
} from '@/components/admin/styles';
import { adminText } from '@/content/admin-text';
import type { Project } from '@/lib/types';

/**
 * One job: what it is called, its photos, and whether it is on the site.
 *
 * The order on screen is the order he thinks in — name, then photos, then the two fields he
 * may well skip. Photos come second and not last because photographing the finished bathroom
 * is the reason he opened this screen at all.
 *
 * Three pieces of furniture carry the state, and they say the same thing in three places on
 * purpose, because he arrives at this screen from three directions:
 *
 * - the **top bar**, opposite „← Tagasi“, in one word;
 * - the **sticky bar's status line**, in full, immediately above the buttons — so the bar
 *   names what the job *is* before it offers to change it, and „Avalda töö“ is never pressed
 *   in the belief that it does something else;
 * - the **buttons' own labels**, which change with the state, so the screen never asks him to
 *   work out what "publish" would do to something that is already published.
 *
 * Leaving with unsaved work is guarded once, on the back control, rather than twice — the
 * separate „Katkesta“ button that used to sit above the bar did the same job and cost a
 * screenful at 360px.
 */

type ProjectFormProps = {
  project: Project;
  /** `https://<cdn>/media/projects/<id>/` — resolved on the server. */
  mediaBase: string;
  maxPhotos: number;
};

const initialState: FormState = {};

/** Estonian has exactly two plural forms. */
function plural(forms: { one: string; other: string }, count: number): string {
  return (count === 1 ? forms.one : forms.other).replace('{count}', String(count));
}

const ruSuffix = `— ${adminText.project.lang.ru.toLocaleLowerCase('et-EE')}`;

export function ProjectForm({ project, mediaBase, maxPhotos }: ProjectFormProps) {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);
  const secondaryRef = useRef<HTMLButtonElement>(null);

  const [saveState, saveFormAction, saving] = useActionState(saveProjectAction, initialState);
  const [deleteState, deleteDispatch, deleting] = useActionState(
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

  const busy = saving || deleting;

  const primaryLabel = project.published
    ? adminText.project.saveChanges
    : adminText.project.publish;

  const primaryBusyLabel = project.published
    ? adminText.project.progress.saving
    : adminText.project.progress.publishing;

  const secondaryLabel = project.published
    ? adminText.project.unpublish
    : adminText.project.saveDraft;

  /** The full state, plus the photo count once there is one — the bar's whole job. */
  const barStatus = project.published
    ? project.images.length > 0
      ? `${adminText.dashboard.works.statusPublished} · ${plural(
          adminText.photos.count,
          project.images.length,
        )}`
      : adminText.dashboard.works.statusPublished
    : adminText.dashboard.works.statusDraft;

  function leave() {
    setAskLeave(false);
    router.push('/admin');
  }

  return (
    <div className="flex flex-col gap-6">
      <form ref={formRef} action={saveFormAction} className="flex flex-col gap-6">
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

        {/*
          The way back, and the state, on one line. The back control is a button rather than
          a link because it is the one place unsaved work can be walked away from, and it has
          to be able to stop and ask.
        */}
        <div
          className={`-mx-gutter flex items-center gap-3 border-b px-gutter pb-3 ${adminDivider}`}
        >
          <button
            type="button"
            onClick={() => (dirty ? setAskLeave(true) : leave())}
            className={`${adminTextLink} -ml-3 no-underline`}
          >
            <BackArrow />
            {adminText.project.back}
          </button>

          <span
            className={`ml-auto inline-flex items-center gap-[7px] text-[1rem] leading-none font-semibold ${
              project.published ? 'text-success' : 'text-fg-muted'
            }`}
          >
            <StatusDot published={project.published} />
            {project.published
              ? adminText.dashboard.works.statusPublished
              : adminText.dashboard.works.statusDraftShort}
          </span>
        </div>

        <h1 className={adminH1}>
          {project.title.et.trim().length > 0
            ? adminText.project.editHeading
            : adminText.project.newHeading}
        </h1>

        {saveState.error ? <AdminNotice tone="error">{saveState.error}</AdminNotice> : null}

        {/* 1 — what the job is called. The only field the site cannot do without. */}
        <div className="flex flex-col gap-2" onInput={() => setDirty(true)}>
          <AdminBilingualField
            id="title"
            name="title"
            required
            label={adminText.project.name.label}
            ruSuffix={ruSuffix}
            hint={adminText.project.lang.ruHint}
            defaultEt={project.title.et}
            defaultRu={project.title.ru ?? ''}
            error={titleError}
          />
          <p className={adminHint}>{adminText.project.name.hint}</p>
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
        <div className="flex flex-col gap-2" onInput={() => setDirty(true)}>
          <AdminBilingualField
            id="location"
            name="location"
            label={adminText.project.location.label}
            ruSuffix={ruSuffix}
            hint={adminText.project.lang.ruHint}
            defaultEt={project.location?.et ?? ''}
            defaultRu={project.location?.ru ?? ''}
          />
          <p className={adminHint}>{adminText.project.location.hint}</p>
        </div>

        <div className="flex flex-col gap-2" onInput={() => setDirty(true)}>
          <AdminBilingualField
            id="description"
            name="description"
            multiline
            label={adminText.project.description.label}
            ruSuffix={ruSuffix}
            hint={adminText.project.lang.ruHint}
            defaultEt={project.description?.et ?? ''}
            defaultRu={project.description?.ru ?? ''}
          />
          <p className={adminHint}>{adminText.project.description.hint}</p>
        </div>

        {/*
          Deleting: bottom of the page, below its own rule, well clear of anything that
          saves, and white-with-a-red-border at rest. Red only becomes a fill inside the
          dialog. It is a plain button rather than its own <form> because a form cannot nest
          inside a form and the dialog dispatches the action directly.
        */}
        <div className={`mt-4 flex flex-col gap-2.5 border-t-2 pt-6 ${adminDivider}`}>
          {deleteState.error ? (
            <AdminNotice tone="error">{deleteState.error}</AdminNotice>
          ) : null}

          <button
            type="button"
            onClick={() => setAskDelete(true)}
            disabled={busy}
            className={`${adminControlDanger} w-full`}
          >
            {adminText.project.delete}
          </button>

          <p className={adminHint}>{adminText.project.deleteHint}</p>
        </div>

        {/*
          The one primary action, permanently inside the bottom third of the screen where a
          thumb reaches one-handed, on the ink band. `sticky` rather than `fixed` so it stops
          covering the page once the form has been scrolled past.
        */}
        <div className={adminStickyBar} style={{ paddingBottom: adminStickyBarPadding }}>
          <div className="flex flex-col gap-2.5">
            <p className={adminBarStatus}>
              <StatusDot published={project.published} />
              {barStatus}
            </p>

            <button
              type="submit"
              name="published"
              value="true"
              disabled={busy}
              className={adminBarPrimary}
            >
              {saving ? <Spinner /> : null}
              {saving ? primaryBusyLabel : primaryLabel}
            </button>

            <button
              ref={secondaryRef}
              type="submit"
              name="published"
              value="false"
              disabled={busy}
              onClick={(event) => {
                // Saving a draft as a draft changes nothing anyone can see, so it just runs.
                // Taking a live job off the site does change what customers see, so it asks.
                if (!project.published) return;
                event.preventDefault();
                setAskUnpublish(true);
              }}
              className={adminBarSecondary}
            >
              {secondaryLabel}
            </button>
          </div>
        </div>
      </form>

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
            ? plural(adminText.confirm.deleteWork.body, project.images.length)
            : adminText.confirm.deleteWork.bodyNoPhotos
        }
        // Never dropped: this is the line that stops him destroying a job when all he wanted
        // was to take it off the site.
        alternative={adminText.confirm.deleteWork.alternative}
        confirmLabel={adminText.confirm.deleteWork.confirm}
        cancelLabel={adminText.confirm.deleteWork.cancel}
        busyLabel={adminText.project.progress.deleting}
        onCancel={() => setAskDelete(false)}
        onConfirm={() => {
          const body = new FormData();
          body.set('id', project.id);
          startTransition(() => deleteDispatch(body));
        }}
      />
    </div>
  );
}

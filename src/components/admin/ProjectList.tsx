'use client';

import Image from 'next/image';
import Link from 'next/link';
import { startTransition, useActionState, useRef, useState } from 'react';

import {
  deleteProjectAction,
  reorderProjectsAction,
  type FormState,
} from '@/app/admin/actions';
import {
  AdminNotice,
  ConfirmDialog,
  adminControl,
  adminControlDanger,
} from '@/components/admin/ConfirmDialog';
import { adminText } from '@/content/admin-text';

/**
 * The list of jobs on the dashboard.
 *
 * A client component for two reasons only: deleting a job has to be confirmed against a
 * dialog that names it, and the order has to be changeable without a page reload. Everything
 * else on the dashboard is server-rendered.
 *
 * Rows arrive pre-flattened from the server — the cover URL, the date and the counts are all
 * resolved there, so this file never has to know where photos live or how Estonian dates are
 * written.
 */

export type ProjectRow = {
  id: string;
  /** Estonian title, or an empty string for a draft the administrator has not named yet. */
  title: string;
  published: boolean;
  photoCount: number;
  /** Extensionless CDN base for the cover photo; null when the job has none yet. */
  coverSrc: string | null;
  coverBlur: string | null;
  updatedLabel: string;
};

const initialState: FormState = {};

/** Estonian has exactly two plural forms, so nothing cleverer than this is needed. */
function plural(forms: { one: string; other: string }, count: number): string {
  return (count === 1 ? forms.one : forms.other).replace('{count}', String(count));
}

export function ProjectList({ rows }: { rows: ProjectRow[] }) {
  const [order, setOrder] = useState<ProjectRow[]>(rows);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);

  const deleteFormRef = useRef<HTMLFormElement>(null);
  const [deleteState, deleteFormAction, deleting] = useActionState(
    deleteProjectAction,
    initialState,
  );

  /**
   * Moving a row saves immediately. The alternative — a separate "save the order" button —
   * is one more thing to forget, and the order is worth almost nothing until it is stored.
   */
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;

    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);

    startTransition(() => {
      void reorderProjectsAction(next.map((row) => row.id));
    });
  }

  if (order.length === 0) {
    return (
      <p className="rounded-panel border-2 border-line-strong bg-page p-5 text-body text-fg-strong">
        {adminText.dashboard.empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteState.error ? <AdminNotice tone="error">{deleteState.error}</AdminNotice> : null}

      <ul className="flex flex-col gap-3">
        {order.map((row, index) => (
          <li
            key={row.id}
            className="flex flex-wrap items-start gap-3 rounded-panel border-2 border-line-strong bg-page p-3"
          >
            <div className="h-18 w-24 shrink-0 overflow-hidden bg-surface-2 shadow-frame">
              {row.coverSrc ? (
                <Image
                  src={row.coverSrc}
                  // Decorative: the job's name is the next thing in the row, so announcing
                  // the photo again would only make the list longer to listen to.
                  alt=""
                  width={96}
                  height={72}
                  sizes="96px"
                  placeholder={row.coverBlur ? 'blur' : 'empty'}
                  blurDataURL={row.coverBlur ?? undefined}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="font-display text-[1.125rem] font-bold leading-snug break-words">
                {row.title || adminText.project.newHeading}
              </span>

              <StatusChip published={row.published} />

              <span className="text-body text-fg-muted">
                {row.photoCount === 0
                  ? adminText.dashboard.works.noPhoto
                  : plural(adminText.dashboard.works.photoCount, row.photoCount)}
                {' · '}
                {adminText.dashboard.works.updatedAt.replace('{date}', row.updatedLabel)}
              </span>
            </div>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={adminText.photos.moveUp}
                title={adminText.photos.moveUp}
                className={`${adminControl} w-12 shrink-0 px-0`}
              >
                <Arrow />
              </button>

              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                aria-label={adminText.photos.moveDown}
                title={adminText.photos.moveDown}
                className={`${adminControl} w-12 shrink-0 px-0`}
              >
                <Arrow down />
              </button>

              <Link href={`/admin/tood/${row.id}`} className={`${adminControl} flex-1 px-2`}>
                {adminText.dashboard.works.edit}
              </Link>

              <button
                type="button"
                onClick={() => setPendingDelete(row)}
                className={`${adminControlDanger} flex-1 px-2`}
              >
                {adminText.dashboard.works.delete}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/*
        One hidden form for the whole list rather than one per row: only ever one job is
        being deleted, and `useActionState` needs a form to hang off. It is a real form, so
        the id travels in the POST body and the action re-reads the job from R2 itself.
      */}
      <form ref={deleteFormRef} action={deleteFormAction} className="hidden">
        <input type="hidden" name="id" value={pendingDelete?.id ?? ''} readOnly />
      </form>

      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title={adminText.confirm.deleteWork.title.replace(
          '{name}',
          pendingDelete?.title || adminText.project.newHeading,
        )}
        body={
          pendingDelete && pendingDelete.photoCount > 0
            ? plural(adminText.confirm.deleteWork.body, pendingDelete.photoCount)
            : adminText.confirm.deleteWork.bodyNoPhotos
        }
        // The line that exists specifically to stop him destroying a job when all he wanted
        // was to take it off the site. It is never dropped from this dialog.
        alternative={adminText.confirm.deleteWork.alternative}
        confirmLabel={adminText.confirm.deleteWork.confirm}
        cancelLabel={adminText.confirm.deleteWork.cancel}
        busyLabel={adminText.project.progress.deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => deleteFormRef.current?.requestSubmit()}
      />
    </div>
  );
}

/**
 * Never colour alone (§9): the words say what the state is, the tint and the dot only make
 * it findable at a glance. Filled dot for live, hollow for a draft.
 */
function StatusChip({ published }: { published: boolean }) {
  return (
    <span
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
    </span>
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

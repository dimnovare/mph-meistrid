'use client';

import Image from 'next/image';
import Link from 'next/link';
import { startTransition, useState } from 'react';

import { reorderProjectsAction } from '@/app/admin/actions';
import { Arrow, BrickGlyph, StatusDot } from '@/components/admin/icons';
import {
  adminDivider,
  adminHint,
  adminPanel,
  adminPanelQuiet,
  adminStripCell,
} from '@/components/admin/styles';
import { adminText } from '@/content/admin-text';

/**
 * The list of jobs on the dashboard.
 *
 * A client component for one reason now: the order has to be changeable without a page
 * reload. Deleting has moved off the row entirely and lives on the edit screen, below a rule
 * — a job is destroyed from the screen that shows what it contains, never from a list where
 * the thumb is already travelling between four other controls.
 *
 * What he scans this list for is *which job* and *is it on the website*, so those two lead:
 * the title at 18px/600 and the status on the line under it. The photo count and the date
 * recede to `fg-muted` — he never has to read them to decide anything. The controls drop to
 * their own full-width strip beneath, which is what buys three targets that are all at least
 * 56px on a 360px screen.
 *
 * The panel's own border carries the state a second time: a published job gets the 2px
 * `fg-strong` edge, a draft the quieter `line-strong` one, so the answer to „mis on
 * kodulehel?“ survives being read at arm's length.
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

/** Estonian has exactly two plural forms, so nothing cleverer than this is needed. */
function plural(forms: { one: string; other: string }, count: number): string {
  return (count === 1 ? forms.one : forms.other).replace('{count}', String(count));
}

export function ProjectList({ rows }: { rows: ProjectRow[] }) {
  const [order, setOrder] = useState<ProjectRow[]>(rows);

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

  if (order.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {order.map((row, index) => (
          <li key={row.id} className={row.published ? adminPanel : adminPanelQuiet}>
            <div className="flex gap-3.5 p-3.5 pb-3">
              <div className="h-18 w-24 shrink-0 overflow-hidden rounded-control bg-surface-2 shadow-frame">
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
                ) : (
                  /*
                    No microtype in a 96px box — the meta line below already says „Fotot ei
                    ole“ in full. The brick course just marks the space as waiting for one.
                  */
                  <span className="flex h-full w-full items-center justify-center rounded-control border border-dashed border-line-strong bg-surface">
                    <BrickGlyph className="w-8 text-line-strong" />
                  </span>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
                <span className="text-[1.125rem] leading-[1.25] font-semibold break-words text-fg-strong">
                  {row.title || adminText.project.newHeading}
                </span>

                <StatusChip published={row.published} />

                <span className="text-[1rem] leading-[1.3] text-fg-muted">
                  {row.photoCount === 0
                    ? adminText.dashboard.works.noPhoto
                    : plural(adminText.dashboard.works.photoCount, row.photoCount)}
                  {' · '}
                  {adminText.dashboard.works.updatedAt.replace('{date}', row.updatedLabel)}
                </span>
              </div>
            </div>

            {/*
              One full-width strip of 56px targets, divided by hairlines rather than spaced —
              at 360px that is what makes „Muuda“ a wide, unmissable target instead of a
              quarter of a crowded row.
            */}
            <div className={`flex border-t ${adminDivider}`}>
              <Link
                href={`/admin/tood/${row.id}`}
                className={`${adminStripCell} flex-1 border-r ${adminDivider}`}
              >
                {adminText.dashboard.works.edit}
              </Link>

              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={adminText.photos.moveUp}
                title={adminText.photos.moveUp}
                className={`${adminStripCell} w-16 shrink-0 border-r px-0 ${adminDivider}`}
              >
                <Arrow />
              </button>

              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                aria-label={adminText.photos.moveDown}
                title={adminText.photos.moveDown}
                className={`${adminStripCell} w-16 shrink-0 px-0`}
              >
                <Arrow down />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className={adminHint}>{adminText.dashboard.works.reorderHint}</p>
    </div>
  );
}

/**
 * Never colour alone (§9): the words say what the state is, the dot only makes it findable
 * at a glance. Filled for live, hollow for a draft.
 *
 * The tinted pill it used to sit in is gone — with the row's border now carrying the same
 * state, a third treatment on the same fact was just noise on a 360px line.
 */
function StatusChip({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-[7px] text-[1rem] leading-[1.2] font-semibold ${
        published ? 'text-success' : 'text-fg-muted'
      }`}
    >
      <StatusDot published={published} />
      {published
        ? adminText.dashboard.works.statusPublished
        : adminText.dashboard.works.statusDraft}
    </span>
  );
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { CheckGlyph, Spinner, WarningGlyph } from '@/components/admin/icons';
import { adminBody, adminControl, adminH3 } from '@/components/admin/styles';

/**
 * The admin's one confirmation surface, plus the feedback block every screen with a
 * confirmation also needs.
 *
 * The skins themselves now live in `./styles.ts`, which has no `'use client'` and so can be
 * read by the server-rendered screens too; they are re-exported from here because five
 * components already import them from this module and a restyle is not the moment to move
 * every import.
 *
 * Native `<dialog>` opened with `showModal()` rather than a hand-rolled overlay: the browser
 * gives the focus trap, `Esc`, the top layer (so nothing on the page can render above it)
 * and `::backdrop` for free. That is roughly twenty lines instead of a dependency, which is
 * the whole argument.
 *
 * Three behaviours here are rules from §4 of the brief, not preference:
 *
 * - **Cancel is the safe default and takes focus.** It is therefore first in the DOM, which
 *   is also what `showModal()`'s own focusing algorithm picks; the explicit `.focus()` below
 *   covers the browsers that hand focus to the `<dialog>` element instead.
 * - **The red button is never the one under his thumb.** On a phone the two buttons stack
 *   with cancel on top, so a reflexive tap in the resting thumb position lands on "leave it
 *   alone". They only sit side by side from 640px, where there is a pointer.
 * - **Red is filled only in here.** Out on the page a destructive control is white with a
 *   `danger` border; inside this dialog, where attention is committed and there is nothing
 *   else to mis-tap, it becomes a fill.
 */

export {
  adminControl,
  adminControlDanger,
  adminControlDangerQuiet,
  adminStripCell,
} from '@/components/admin/styles';

const dialogButton = 'w-full text-[1.125rem] sm:w-auto';

/** Filled red — legal only in here (§4.3). */
const confirmFilledDanger =
  'inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-panel border-2 ' +
  'border-danger bg-danger px-5 py-2 text-[1.125rem] leading-tight font-semibold text-white ' +
  'transition-colors disabled:cursor-not-allowed sm:w-auto';

/**
 * Filled ink — for the reversible things. Logging out is not destructive, so it gets no red,
 * but it keeps the same inverted order: staying lands under the thumb.
 */
const confirmFilledNeutral =
  'inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-panel bg-ink ' +
  'px-5 py-2 text-[1.125rem] leading-tight font-semibold text-white transition-colors ' +
  'hover:bg-ink-raised active:bg-ink-raised disabled:cursor-not-allowed ' +
  'disabled:bg-fg-muted sm:w-auto';

/**
 * The feedback block. Cause and fix in plain Estonian on a tinted ground, plus a glyph —
 * colour is never the only carrier of meaning.
 *
 * The two tones are deliberately different shapes, not the same block in two colours: an
 * error carries the 3px `danger` rule down its left edge and interrupts (`role="alert"`); a
 * success is a plain tinted panel with a tick and does not (`aria-live="polite"`). One is a
 * problem to deal with, the other is a receipt.
 */
export function AdminNotice({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : undefined}
      aria-live={isError ? undefined : 'polite'}
      className={
        'flex items-start gap-3 p-4 text-[1rem] leading-[1.5] text-fg-strong ' +
        (isError
          ? 'rounded-r-panel border-l-[3px] border-danger bg-danger-soft'
          : 'rounded-panel bg-success-soft')
      }
    >
      {isError ? (
        <WarningGlyph className="mt-0.5 text-danger" />
      ) : (
        <CheckGlyph className="text-success" />
      )}

      <div className="min-w-0">{children}</div>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  /** Names the thing and states the consequence. Never a generic "are you sure". */
  body: string;
  /** The "you probably meant this instead" line, where admin-text.ts provides one. */
  alternative?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Replaces the confirm label while the action runs. */
  busyLabel?: string;
  busy?: boolean;
  /** `danger` fills the confirm button red. `neutral` is for reversible things like logout. */
  tone?: 'danger' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  alternative,
  confirmLabel,
  cancelLabel,
  busyLabel,
  busy = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // `showModal()` throws if the dialog is already open, and `close()` on a closed dialog
    // fires a stray `close` event that would call `onCancel` for no reason — hence both
    // guards.
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      // Esc, the browser's own dismiss paths and our `close()` all end up here, so the
      // parent's `open` state can never drift out of sync with what is on screen.
      onClose={onCancel}
      // Tailwind's preflight resets `margin` on every element, which breaks the UA's
      // `inset: 0; margin: auto` centring for a modal dialog — `m-auto` puts it back.
      // No border: the card is white on a darkened page and `shadow-overlay` is what lifts
      // it, so a 2px rule would only add a second edge.
      className={
        'm-auto w-[calc(100%-2rem)] max-w-form rounded-panel bg-page p-0 text-fg-strong ' +
        'shadow-overlay backdrop:bg-ink/70'
      }
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 className={adminH3}>{title}</h2>

        <p className={adminBody}>{body}</p>

        {alternative ? (
          // The line that stops a builder destroying a job when all he wanted was to hide
          // it. A quiet `surface` block rather than a second warning: it is advice, and the
          // dialog already has one alarming thing in it.
          <p className="rounded-panel bg-surface px-4 py-3.5 text-[1rem] leading-[1.5] text-fg-strong">
            {alternative}
          </p>
        ) : null}

        <div className="mt-1 flex flex-col gap-3 sm:flex-row">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`${adminControl} ${dialogButton}`}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === 'danger' ? confirmFilledDanger : confirmFilledNeutral}
          >
            {busy ? <Spinner /> : null}
            {busy && busyLabel ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * The admin's one confirmation surface — plus the handful of skins every screen that has a
 * confirmation also needs (control, destructive control, feedback block, form sizing).
 *
 * Those extras live here rather than in a module of their own because this deliverable is a
 * fixed set of files and this is the one that all five interactive screens already import.
 * Copying a feedback block into five components would be the worse trade.
 *
 * Native `<dialog>` opened with `showModal()` rather than a hand-rolled overlay: the browser
 * gives the focus trap, `Esc`, the top layer (so nothing on the page can render above it)
 * and `::backdrop` for free. That is roughly twenty lines instead of a dependency, which is
 * the whole argument.
 *
 * Two behaviours here are rules from docs/design-system.md §9, not preference:
 *
 * - **Cancel is the safe default and takes focus.** It is therefore first in the DOM, which
 *   is also what `showModal()`'s own focusing algorithm picks; the explicit `.focus()` below
 *   covers the browsers that hand focus to the `<dialog>` element instead.
 * - **The red button is never the one under his thumb.** On a phone the two buttons stack
 *   with cancel on top, so a reflexive tap in the resting thumb position lands on "leave it
 *   alone". They only sit side by side from 640px, where there is a pointer.
 */

// Height, radius and label size are the §9 admin minimums: 56px tall, 8px radius, 16px/600.
// `min-h` rather than `h` because "Jah, kustuta lõplikult" wraps to two lines at 360px and a
// fixed height would clip it.
const controlBase =
  'inline-flex min-h-14 items-center justify-center gap-2 rounded-panel px-5 py-2 ' +
  'text-body font-semibold transition-colors disabled:cursor-not-allowed';

/**
 * The neutral admin control. `Button size="admin"` is full-width below 640px, which is right
 * for a form's primary action and wrong for a button that sits inside a list row, so rows
 * use this instead.
 */
export const adminControl =
  `${controlBase} border-2 border-line-strong bg-page text-fg-strong ` +
  'hover:bg-surface-2 active:bg-surface-2 disabled:border-line disabled:text-fg-muted';

/**
 * A destructive action **at rest** (§9): white ground, 2px `danger` border, `danger` text
 * (6.57:1). Never a filled red button out on the page — red only becomes a fill inside the
 * dialog below, where the user has already committed attention and there is nothing else to
 * mis-tap.
 */
export const adminControlDanger =
  `${controlBase} border-2 border-danger bg-page text-danger ` +
  'hover:bg-danger-soft active:bg-danger-soft disabled:border-line disabled:text-fg-muted';

const confirmFilledDanger =
  `${controlBase} w-full border-2 border-danger bg-danger text-white sm:w-auto`;

const confirmFilledNeutral =
  `${controlBase} w-full border-2 border-accent bg-accent text-on-accent shadow-edge ` +
  'hover:bg-accent-hover active:bg-accent-press sm:w-auto';

/**
 * Raises the shared `Field` / `Input` / `BilingualField` primitives to the admin's hard
 * minimums (§9): 56px controls instead of 48, 16px sentence-case labels instead of the
 * public site's 13px uppercase eyebrow, `fg-strong` instead of `fg`, 2px borders that
 * survive sunlight, and the 8px panel radius.
 *
 * Done as descendant selectors on a wrapper rather than by editing those primitives,
 * because they are shared with the public quote form, where 48px and 13px are correct.
 * Each `.wrapper input` rule outranks the plain utility class on the input itself, so the
 * override is deterministic rather than a bet on class ordering.
 */
export const adminFields =
  '[&_label]:text-[1rem] [&_label]:font-semibold [&_label]:normal-case ' +
  '[&_label]:tracking-normal [&_label]:text-fg-strong ' +
  '[&_input]:h-14 [&_input]:rounded-panel [&_input]:border-2 ' +
  '[&_textarea]:min-h-36 [&_textarea]:rounded-panel [&_textarea]:border-2';

/**
 * The §9 feedback block. Cause and fix in plain Estonian on a tinted ground with a 3px left
 * rule, plus a glyph — colour is never the only carrier of meaning.
 *
 * Errors are `role="alert"` so they interrupt; confirmations are `aria-live="polite"` so
 * they do not.
 */
export function AdminNotice({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : undefined}
      aria-live={isError ? undefined : 'polite'}
      className={`flex items-start gap-3 rounded-panel border-l-[3px] p-4 text-body text-fg-strong ${
        isError ? 'border-danger bg-danger-soft' : 'border-success bg-success-soft'
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        fill="currentColor"
        className={`mt-0.5 size-5 shrink-0 ${isError ? 'text-danger' : 'text-success'}`}
      >
        {isError ? (
          <path d="M10 1.6 19.3 18H.7L10 1.6Zm0 5.4a1 1 0 0 0-1 1v3.6a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1Zm0 7.3a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z" />
        ) : (
          <path d="M10 .8a9.2 9.2 0 1 0 0 18.4A9.2 9.2 0 0 0 10 .8Zm4.5 6.6-5.4 6a1 1 0 0 1-1.5.03L5.4 11.1a1 1 0 1 1 1.5-1.32l1.45 1.65 4.66-5.18a1 1 0 0 1 1.49 1.34Z" />
        )}
      </svg>

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
      className={
        'm-auto w-[calc(100%-1.5rem)] max-w-form rounded-panel border-2 border-line-strong ' +
        'bg-page p-0 text-fg-strong shadow-overlay backdrop:bg-ink/70'
      }
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 className="font-display text-[1.5rem] font-bold leading-tight">{title}</h2>

        <p className="text-body text-fg-strong">{body}</p>

        {alternative ? (
          // The line that stops a builder destroying a project when all he wanted was to
          // hide it. Given the note-block treatment (§7.6) so it reads as advice, not as
          // more of the warning above it.
          <p className="rounded-control border-l-[3px] border-accent bg-accent-soft px-4 py-3 text-body text-fg">
            {alternative}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`${adminControl} w-full sm:w-auto`}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={tone === 'danger' ? confirmFilledDanger : confirmFilledNeutral}
          >
            {busy && busyLabel ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * The admin's glyphs.
 *
 * Every one is hand-inlined SVG on `currentColor` and `aria-hidden` — there is no icon
 * library on this project and there is not going to be one. None of these carries meaning on
 * its own: each sits beside words that say the same thing, which is the rule for status in
 * particular (colour and shape are the fast path, the words are the meaning).
 *
 * No `'use client'`: these are pure markup, so the server screens and the interactive ones
 * share them.
 */

/**
 * Running bond — the identity's brick course, at glyph size. Two courses with their joints
 * offset, which is the same figure the wordmark stands on.
 *
 * Used wherever a block is empty and waiting: the dashboard's first run, the price list with
 * no rows, a job with no cover photo yet.
 */
export function BrickGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 26"
      aria-hidden="true"
      fill="currentColor"
      className={className}
      focusable="false"
    >
      <rect x="0" y="0" width="14" height="12" />
      <rect x="16" y="0" width="28" height="12" />
      <rect x="0" y="14" width="28" height="12" />
      <rect x="30" y="14" width="14" height="12" />
    </svg>
  );
}

/** ↑ / ↓. The only reorder affordance in the admin — drag does not fire on touch. */
export function Arrow({ down = false, className = '' }: { down?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="currentColor"
      className={`size-5 ${down ? 'rotate-180' : ''} ${className}`.trim()}
      focusable="false"
    >
      <path d="M10 3.6 18.4 14.4a1 1 0 0 1-.8 1.6H2.4a1 1 0 0 1-.8-1.6L10 3.6Z" />
    </svg>
  );
}

/** ← Tagasi. */
export function BackArrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="currentColor"
      className={`size-5 ${className}`.trim()}
      focusable="false"
    >
      <path d="M12.7 3.3a1 1 0 0 1 0 1.4L7.4 10l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z" />
    </svg>
  );
}

/** „Tee foto“ — the camera that sits beside the library picker, never instead of it. */
export function CameraGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className={`size-6 ${className}`.trim()}
      focusable="false"
    >
      <path d="M8.5 4 10 1h4l1.5 3H21a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.5Z" />
      <circle cx="12" cy="11.5" r="3.8" />
    </svg>
  );
}

/**
 * The state of one job, as a shape: filled = on the website, hollow = a draft nobody can
 * see. It never travels without the words beside it.
 *
 * `onInk` is not a second colour — inside the sticky bar there is no green that clears
 * contrast against the band, so the dot inherits the band's own text colour and the fill vs
 * hollow distinction does the work on its own.
 */
export function StatusDot({
  published,
  className = '',
}: {
  published: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`size-3 shrink-0 ${className}`.trim()}
      focusable="false"
    >
      <circle
        cx="6"
        cy="6"
        r="4.5"
        fill={published ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  );
}

/** The warning glyph on an error notice. */
export function WarningGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="currentColor"
      className={`size-5 shrink-0 ${className}`.trim()}
      focusable="false"
    >
      <path d="M10 1.6 19.3 18H.7L10 1.6Zm0 5.4a1 1 0 0 0-1 1v3.6a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1Zm0 7.3a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z" />
    </svg>
  );
}

/** The filled disc and tick on a success notice — a receipt, not a warning. */
export function CheckGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 22 22"
      aria-hidden="true"
      className={`size-[1.375rem] shrink-0 ${className}`.trim()}
      focusable="false"
    >
      <circle cx="11" cy="11" r="11" fill="currentColor" />
      <path
        d="m6.2 11.2 3.3 3.3 6.3-6.6"
        fill="none"
        stroke="var(--color-white)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The spinner that rides in a button while something is saving, publishing or deleting. It
 * is always beside a present-tense verb — „Salvestan…“, „Avaldan…“ — because a bare spinner
 * says that something is happening but not what.
 *
 * `animate-spin` respects the reduced-motion rule in globals.css, which clamps animation
 * duration rather than removing it, so the element stays where it is either way.
 */
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        'size-4 shrink-0 animate-spin rounded-full border-[2.5px] border-current ' +
        `border-t-transparent opacity-80 ${className}`
      }
    />
  );
}

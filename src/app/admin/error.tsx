'use client';

import Link from 'next/link';

import { useEffect } from 'react';

import { adminText } from '@/content/admin-text';

/**
 * What he sees when something in the admin throws.
 *
 * One sentence in Estonian that says what to do next, and one button that tries again.
 * Never the message, never the digest, never a status code: none of them mean anything to
 * him, and a screen full of English is how someone decides the whole thing is broken and
 * stops using it. The real detail goes to the server log, where it is useful.
 *
 * Next 16 passes `retry`, not `reset`. They are not the same: `reset` only clears the error
 * boundary and re-renders, so it cannot recover from an error thrown on the server, which is
 * where an R2 hiccup would come from. `retry` refreshes the route first.
 */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('[admin]', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter py-12">
      <div className="flex items-start gap-3 rounded-panel border-l-[3px] border-danger bg-danger-soft p-4 text-body text-fg-strong">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          fill="currentColor"
          className="mt-0.5 size-5 shrink-0 text-danger"
        >
          <path d="M10 1.6 19.3 18H.7L10 1.6Zm0 5.4a1 1 0 0 0-1 1v3.6a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1Zm0 7.3a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z" />
        </svg>
        <p role="alert">{adminText.errors.generic}</p>
      </div>

      <button
        type="button"
        onClick={retry}
        className="inline-flex min-h-14 w-full items-center justify-center rounded-panel bg-accent px-6 py-2 font-display text-[1.125rem] font-bold text-on-accent shadow-edge transition-colors hover:bg-accent-hover active:bg-accent-press"
      >
        {adminText.errors.retry}
      </button>

      <Link
        href="/admin"
        className="inline-flex min-h-14 w-full items-center justify-center rounded-panel border-2 border-line-strong bg-page px-5 py-2 text-body font-semibold text-fg-strong transition-colors hover:bg-surface-2"
      >
        {adminText.errors.workNotFoundAction}
      </Link>
    </div>
  );
}

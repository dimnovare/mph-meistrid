'use client';

import Link from 'next/link';

import { useEffect } from 'react';

import {
  adminBareScreen,
  adminControlPrimary,
  adminScreenTitle,
  adminTextLink,
} from '@/components/admin/styles';
import { adminText } from '@/content/admin-text';

/**
 * What he sees when something in the admin throws.
 *
 * One sentence in Estonian that says what to do next, one button that tries again, and one
 * route home. Never the message, never the digest, never a status code: none of them mean
 * anything to him, and a screen full of English is how someone decides the whole thing is
 * broken and stops using it. The real detail goes to the server log, where it is useful.
 *
 * Deliberately bare — no notice block, no warning glyph, no red. A tinted alarm panel would
 * make a transient hiccup look like damage, and the sentence already says what to do and
 * that his work is still there.
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
    <div className={adminBareScreen}>
      {/*
        An error boundary swaps in place rather than navigating, so without a live region the
        screen can change under someone who is not looking at it.
      */}
      <div role="alert" className="flex flex-col items-start gap-4">
        <h1 className={adminScreenTitle}>{adminText.errors.genericTitle}</h1>
        <p className="text-[1.125rem] leading-[1.5] text-fg-strong">{adminText.errors.generic}</p>
      </div>

      <button type="button" onClick={retry} className={`${adminControlPrimary} mt-2 w-full`}>
        {adminText.errors.retry}
      </button>

      <Link href="/admin" className={`${adminTextLink} self-center`}>
        {adminText.errors.workNotFoundAction}
      </Link>
    </div>
  );
}

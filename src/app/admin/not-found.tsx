import Link from 'next/link';

import { adminText } from '@/content/admin-text';

/**
 * What he sees when `notFound()` fires inside the admin — most realistically after deleting
 * a job on his phone and then pressing Back, which reopens the edit screen for something
 * that no longer exists.
 *
 * Without this file the request falls through to Next's built-in 404, which is in English
 * and has no way back into the admin. For the one person who uses this area — a builder who
 * is not comfortable with computers — a sudden English error page is indistinguishable from
 * the site being broken, and the next thing that happens is a phone call.
 *
 * Deliberately plain: what happened, and one large control that leads somewhere useful.
 */
export default function AdminNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-form flex-col gap-6 px-gutter py-12">
      <div className="rounded-panel border-l-[3px] border-line-strong bg-surface p-4">
        <p className="text-body text-fg-strong">{adminText.errors.workNotFound}</p>
      </div>

      <Link
        href="/admin"
        className="inline-flex min-h-14 w-full items-center justify-center rounded-panel bg-accent px-6 py-2 font-display text-[1.125rem] font-bold text-on-accent shadow-edge transition-colors hover:bg-accent-hover active:bg-accent-press"
      >
        {adminText.errors.workNotFoundAction}
      </Link>
    </div>
  );
}

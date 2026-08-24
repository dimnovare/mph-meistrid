import Link from 'next/link';

import {
  adminBareScreen,
  adminControlPrimary,
  adminScreenTitle,
} from '@/components/admin/styles';
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
 * The same shape as the error screen: what happened, the likely reason, and one large
 * control that leads somewhere useful. No retry here, because retrying a page that does not
 * exist is not a thing that can work.
 */
export default function AdminNotFound() {
  return (
    <div className={adminBareScreen}>
      <h1 className={adminScreenTitle}>{adminText.errors.notFoundTitle}</h1>

      <p className="text-[1.125rem] leading-[1.5] text-fg-strong">
        {adminText.errors.notFoundBody}
      </p>

      <Link href="/admin" className={`${adminControlPrimary} mt-2 w-full`}>
        {adminText.errors.workNotFoundAction}
      </Link>
    </div>
  );
}

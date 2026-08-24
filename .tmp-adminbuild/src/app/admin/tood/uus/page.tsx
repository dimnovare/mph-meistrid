import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createDraftAction } from '@/app/admin/actions';
import { BackArrow } from '@/components/admin/icons';
import {
  adminColumn,
  adminDivider,
  adminH1,
  adminHeroPrimary,
  adminHint,
  adminTextLink,
} from '@/components/admin/styles';
import { adminText } from '@/content/admin-text';
import { currentUser } from '@/lib/auth';

/**
 * One button that creates the draft, rather than creating it while rendering.
 *
 * Calling `createDraftAction()` from the body of this page would make a GET request write to
 * R2, and a GET is not something we control the timing of: a `<Link>` prefetch, a browser's
 * speculative preload, a bookmark reopened, a back/forward restore or a crawler that ignores
 * `noindex` would each silently create a job. `prefetch={false}` closes exactly one of those
 * doors. There is no flag that closes the rest, so this route does not try — the mutation
 * lives behind a POST, which is where a mutation belongs.
 *
 * The one-tap path is not affected: the dashboard's own "+ Lisa uus töö" posts the same
 * action directly and lands on the edit screen. This page is what someone reaches by typing
 * or bookmarking the address.
 */
export default async function NewProjectPage() {
  if (!(await currentUser())) redirect('/admin/login');

  return (
    <div className={`${adminColumn} flex flex-col gap-6 py-7 sm:py-9`}>
      <div className={`-mx-gutter flex items-center border-b px-gutter pb-3 ${adminDivider}`}>
        <Link href="/admin" className={`${adminTextLink} -ml-3 no-underline`}>
          <BackArrow />
          {adminText.project.back}
        </Link>
      </div>

      <h1 className={adminH1}>{adminText.project.newHeading}</h1>

      <div className="flex flex-col gap-1.5">
        <form action={createDraftAction}>
          <button type="submit" className={adminHeroPrimary}>
            {adminText.dashboard.addWork}
          </button>
        </form>
        <p className={adminHint}>{adminText.dashboard.addWorkHint}</p>
      </div>
    </div>
  );
}

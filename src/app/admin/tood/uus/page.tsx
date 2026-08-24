import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createDraftAction } from '@/app/admin/actions';
import { Container } from '@/components/ui/Container';
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

const heroPrimary =
  'flex min-h-22 w-full items-center justify-center rounded-panel bg-accent px-6 ' +
  'text-center font-display text-[1.25rem] font-bold leading-snug text-on-accent ' +
  'shadow-edge transition-colors hover:bg-accent-hover active:bg-accent-press';

const backLink =
  'inline-flex min-h-14 items-center gap-2 self-start rounded-panel px-2 text-body ' +
  'font-semibold text-fg-strong transition-colors hover:bg-surface-2';

export default async function NewProjectPage() {
  if (!(await currentUser())) redirect('/admin/login');

  return (
    <Container width="form" className="flex flex-col gap-6 py-8">
      <Link href="/admin" className={backLink}>
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor" className="size-5">
          <path d="M12.7 3.3a1 1 0 0 1 0 1.4L7.4 10l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z" />
        </svg>
        {adminText.project.back}
      </Link>

      <h1 className="font-display text-[1.75rem] font-bold leading-tight">
        {adminText.project.newHeading}
      </h1>

      <form action={createDraftAction}>
        <button type="submit" className={heroPrimary}>
          {adminText.dashboard.addWork}
        </button>
      </form>

      <p className="text-body text-fg-muted">{adminText.dashboard.addWorkHint}</p>
    </Container>
  );
}

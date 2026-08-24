import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/LoginForm';
import { adminH1 } from '@/components/admin/styles';
import { Logo } from '@/components/brand/Logo';
import { adminText } from '@/content/admin-text';
import { currentUser } from '@/lib/auth';
import { site } from '@/content/site';

/**
 * The one admin route that renders without a session — see the note in `../layout.tsx` for
 * how the layout keeps its chrome off this screen.
 *
 * Someone who is already signed in has no business here, so they go straight to the
 * dashboard rather than being offered a second login.
 *
 * The mark at the top is the only flourish on the screen, and it is there to answer "am I in
 * the right place" before he starts typing, not to decorate. Everything below it is sized to
 * be typed into one-handed: no second column, no card, no illustration.
 */
export default async function LoginPage() {
  if (await currentUser()) redirect('/admin');

  return (
    // Narrower than the rest of the admin: this screen is two fields and a button, and a
    // 900px column would leave them stranded across the middle of a desktop window.
    <div className="mx-auto flex min-h-dvh w-full max-w-form flex-col justify-center gap-6 px-gutter py-10">
      <span className="flex items-center" aria-label={site.shortName} role="img">
        <Logo variant="horizontal" height={30} />
      </span>

      <div className="flex flex-col gap-3">
        <h1 className={adminH1}>{adminText.login.heading}</h1>
        <p className="text-[1.125rem] leading-[1.5] text-fg-strong">{adminText.login.intro}</p>
      </div>

      <LoginForm />
    </div>
  );
}

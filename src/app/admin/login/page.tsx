import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/LoginForm';
import { Container } from '@/components/ui/Container';
import { adminText } from '@/content/admin-text';
import { currentUser } from '@/lib/auth';

/**
 * The one admin route that renders without a session — see the note in `../layout.tsx` for
 * how the layout keeps its chrome off this screen.
 *
 * Someone who is already signed in has no business here, so they go straight to the
 * dashboard rather than being offered a second login.
 */
export default async function LoginPage() {
  if (await currentUser()) redirect('/admin');

  return (
    <Container width="form" className="flex min-h-dvh flex-col justify-center py-12">
      <h1 className="font-display text-[1.75rem] font-bold leading-tight">
        {adminText.login.heading}
      </h1>

      <p className="mt-3 mb-8 text-body text-fg-strong">{adminText.login.intro}</p>

      <LoginForm />
    </Container>
  );
}

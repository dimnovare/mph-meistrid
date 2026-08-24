'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Container';

/**
 * Error boundary for everything under `[locale]`.
 *
 * Must be a Client Component — React error boundaries are a client concept. It renders inside
 * `[locale]/layout.tsx` (an error boundary never wraps the layout of its own segment), so the
 * header, the footer and `NextIntlClientProvider` are all still mounted and `useTranslations`
 * works normally.
 *
 * **The recovery prop is `retry`, not `reset`.** Next 16.3 still passes `reset`, but it is
 * undocumented and only clears the boundary's own state — it re-renders the same failed tree
 * and cannot recover from a Server Component error, which on this site is the likely failure
 * (R2 unreachable while reading `data/projects.json`). `retry()` refreshes the route first,
 * so the server actually gets asked again.
 */
export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Development only. In production Next has already replaced a Server Component message
    // with a generic one plus a digest, and the digest belongs in the server log, not in a
    // console a visitor might open.
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);

  const t = useTranslations('common.error');

  return (
    <Section>
      <Container width="copy">
        {/*
          `error.message`, `error.digest` and the stack are all deliberately absent. Whatever
          the boundary caught, the visitor is a homeowner looking for a builder: the only
          useful information is "try again, or phone us", which the footer and the call bar
          already provide.
        */}
        <h1 className="text-h1">{t('title')}</h1>
        <p className="mt-6 text-lead text-fg-muted">{t('body')}</p>

        <div className="mt-block">
          <Button onClick={() => retry()} className="w-full sm:w-auto">
            {t('retry')}
          </Button>
        </div>
      </Container>
    </Section>
  );
}

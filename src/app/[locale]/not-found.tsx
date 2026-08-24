import { getLocale, getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Container';
import { getPathname } from '@/i18n/navigation';

/**
 * 404 inside the locale segment, so it arrives with the header, the footer and the visitor's
 * own language instead of as a bare unstyled page.
 *
 * `not-found.tsx` is handed no `params` by Next. It does not need any: it renders as a child
 * of `[locale]/layout.tsx`, which has already called `setRequestLocale`, so a bare
 * `getTranslations()` resolves against the right locale. The one route that could otherwise
 * reach a 404 without ever entering `[locale]` is handled by the catch-all in
 * `[locale]/[...rest]/page.tsx` — the comment there explains why that file has to exist.
 */
export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('common.notFound');

  return (
    <Section>
      <Container width="copy">
        <h1 className="text-h1">{t('title')}</h1>
        <p className="mt-6 text-lead text-fg-muted">{t('body')}</p>

        <div className="mt-block">
          {/*
            `getPathname` rather than a hand-written "/" — it is the same module as `Link` and
            the same routing config, so Estonian stays on the apex and Russian keeps its `/ru`
            prefix. A plain anchor is deliberate here: a 404 is a dead end, and a full
            navigation home is more robust than a client-side transition out of an error state.
          */}
          <Button as="a" href={getPathname({ locale, href: '/' })} className="w-full sm:w-auto">
            {t('backHome')}
          </Button>
        </div>
      </Container>
    </Section>
  );
}

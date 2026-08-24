import { getTranslations } from 'next-intl/server';

import { Container, Section } from '@/components/ui/Container';
import { isPlaceholder } from '@/content/site';
import type { Locale } from '@/i18n/routing';

/**
 * Meist.
 *
 * Four paragraphs at most, and every one of them comes from the catalogue. There are no
 * years of experience, no team size, no certifications and no completed-project count here,
 * because none of those have been supplied and inventing them on a construction site's
 * about page is the fastest way to make a real company look fake.
 */
export async function About({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'about' });

  // The fourth paragraph is explicitly optional (docs/CONTENT.md 1.3 — "may be left empty").
  // While it is still `{{ABOUT_EXTRA_ET}}` it is dropped rather than printed.
  const extra = t('extra');

  return (
    <Section id="meist" tone="page" labelledBy="meist-heading">
      <Container>
        <span aria-hidden="true" className="mb-5 block h-[3px] w-8 bg-accent" />
        <h2 id="meist-heading" className="text-h2">
          {t('heading')}
        </h2>

        <div className="mt-block max-w-copy space-y-5 text-body text-fg">
          <p>{t('p1')}</p>
          <p>{t('p2')}</p>
          <p>{t('p3')}</p>
          {isPlaceholder(extra) ? null : <p>{extra}</p>}
        </div>

        {/* The registry code is the one piece of hard evidence the company can show before
            there are any photos, so it is a labelled value block rather than a footnote. */}
        <dl className="mt-block grid max-w-copy grid-cols-1 gap-4 rounded-control border border-line bg-surface p-6 sm:grid-cols-2">
          <div>
            <dt className="text-label uppercase text-fg-muted">{t('companyLabel')}</dt>
            <dd className="mt-1 font-sans text-body font-semibold text-fg-strong">
              {t('companyName')}
            </dd>
          </div>
          <div>
            <dt className="text-label uppercase text-fg-muted">{t('regCodeLabel')}</dt>
            <dd className="mt-1 font-sans text-body font-semibold tabular-nums text-fg-strong">
              {t('regCode')}
            </dd>
          </div>
        </dl>
      </Container>
    </Section>
  );
}

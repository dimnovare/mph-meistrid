import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/Button';
import { Container, Section } from '@/components/ui/Container';
import { services } from '@/content/services';
import type { Locale } from '@/i18n/routing';
import { t as localized } from '@/lib/types';

/**
 * Services — design-system.md §7.3.
 *
 * The six services are developer-owned data (`src/content/services.ts`), not admin content,
 * so this section never touches R2 and never has an empty state.
 *
 * Cards are informational blocks, not links: there is no per-service page to send anyone to,
 * and a card that looks clickable but is not is worse than one that plainly is not. That is
 * also why none of the hover/active states from §7.3 are wired up here.
 */
export async function Services({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'services' });

  return (
    <Section id="teenused" tone="surface" labelledBy="teenused-heading">
      <Container>
        <div className="max-w-copy">
          {/* The 3px x 32px accent bar (§1) — the motif that replaces an icon set. */}
          <span aria-hidden="true" className="mb-5 block h-[3px] w-8 bg-accent" />
          <h2 id="teenused-heading" className="text-h2">
            {t('heading')}
          </h2>
          <p className="mt-5 text-lead text-fg-muted">{t('intro')}</p>
        </div>

        {/* 1 col / 2 from 640px / 3 from 1024px; 16px gap on mobile, 24px from there up. */}
        <ul className="mt-block grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {services.map((service) => (
            <li
              key={service.id}
              // A bordered block, not a floating card: `line` is decorative here, which is
              // allowed precisely because the block is not interactive (§3.1).
              className="rounded-control border border-line bg-page p-6 lg:p-8"
            >
              <span aria-hidden="true" className="block h-[3px] w-8 bg-accent" />
              {/* `text-h3` sets size/leading/tracking/weight but deliberately not the family
                  (§4.2), and this is not an h1-h4 element's default, so add it explicitly. */}
              <h3 className="mt-4 font-display text-h3">{localized(service.name, locale)}</h3>
              <p className="mt-2 text-small text-fg-muted">
                {localized(service.description, locale)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-block">
          <Button as="a" href="#kontakt" variant="secondary">
            {t('cta')}
          </Button>
        </div>
      </Container>
    </Section>
  );
}

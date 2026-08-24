import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { isPlaceholder, telHref } from '@/content/site';
import type { Locale } from '@/i18n/routing';

/**
 * Hero — design-system.md §7.2.
 *
 * ── NO HERO PHOTOGRAPH YET ──────────────────────────────────────────────────
 * The client has not supplied one and a stock photo of somebody else's building site is
 * worse than none: it is the first thing a visitor sees and the first thing that tells them
 * whether this is a real company. So the hero is built to work **both** ways.
 *
 * With `HERO_IMAGE = null` it renders as a solid `ink` slab. That is not a fallback, it is
 * the third ink band the system already owns (§2) — same scrim colour, same `.on-ink`
 * context, same type — so the page still opens on a hard, deliberate block rather than on a
 * grey box with a broken-image icon in it.
 *
 * To add the real photograph later: drop the file in `public/`, fill in the object below
 * with its real intrinsic pixel dimensions (wrong values cause layout shift), and nothing
 * else changes — the scrim, the LCP preload and the layout are already wired.
 * ────────────────────────────────────────────────────────────────────────────
 */
type HeroImage = {
  /** Path under `public/`, or an absolute CDN URL. */
  src: string;
  /** Intrinsic pixel size of the file. Used only for the ratio. */
  width: number;
  height: number;
  /** Optional tiny base64 placeholder. Omit rather than invent one. */
  blurDataURL?: string;
};

const HERO_IMAGE: HeroImage | null = null;

/**
 * §6.2. One gradient, applied over the photo rather than baked into it, so the same file
 * stays reusable. Effective α is ≥0.70 across the bottom 45% where the text sits, which is
 * ≥6.9:1 for white text even over a blown-out white wall — the realistic worst case for an
 * interior phone photo, and comfortably above the 0.62 floor computed in §3.4.
 */
const SCRIM =
  'linear-gradient(to top, rgb(22 19 15 / 0.88) 0%, rgb(22 19 15 / 0.70) 45%, ' +
  'rgb(22 19 15 / 0.34) 75%, rgb(22 19 15 / 0.18) 100%)';

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'hero' });
  const tc = await getTranslations({ locale, namespace: 'contact' });

  const tel = telHref();
  const region = tc('regionValue');

  // Company name, registry code and service region (§7.2). Composed from existing keys —
  // the region is dropped while it is still an unreplaced placeholder rather than printed
  // into the page's most prominent block.
  const trust = [
    tc('companyValue'),
    `${tc('regCodeLabel')} ${tc('regCodeValue')}`,
    isPlaceholder(region) ? null : region,
  ].filter((part): part is string => part !== null);

  return (
    <section
      aria-labelledby="hero-heading"
      // `svh` not `vh`: on a phone `vh` is measured against the *expanded* viewport, so the
      // browser chrome eats the bottom of the hero on first paint.
      className={
        'on-ink relative isolate flex min-h-[max(520px,78svh)] flex-col justify-end ' +
        'bg-ink pt-section-sm text-on-ink lg:min-h-[clamp(560px,72svh,760px)] ' +
        'lg:justify-center lg:py-section-sm ' +
        // The fixed mobile call bar sits over the bottom of the viewport, so the hero has to
        // reserve its height plus the home-indicator inset or the CTA lands underneath it.
        'pb-[calc(var(--spacing-callbar)+env(safe-area-inset-bottom,0px)+1.5rem)]'
      }
    >
      {HERO_IMAGE ? (
        <>
          <Image
            src={HERO_IMAGE.src}
            // Decorative: the h1 sitting on top of it carries the meaning, and describing a
            // photograph we have never seen would be inventing content.
            alt=""
            fill
            // Full-bleed at every breakpoint, so the viewport width is the answer.
            sizes="100vw"
            // The LCP element, and the only image on the page allowed to preload.
            preload
            fetchPriority="high"
            className="-z-20 object-cover [object-position:50%_45%]"
            {...(HERO_IMAGE.blurDataURL
              ? { placeholder: 'blur' as const, blurDataURL: HERO_IMAGE.blurDataURL }
              : {})}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{ backgroundImage: SCRIM }}
          />
        </>
      ) : null}

      <Container>
        <div className="max-w-copy">
          {/* The recurring 3px x 32px accent bar (§1). There is no eyebrow string in the
              catalogue, so the rule sits directly above the h1. */}
          <span aria-hidden="true" className="mb-6 block h-[3px] w-8 bg-accent" />

          <h1 id="hero-heading" className="text-h1 text-on-ink">
            {t('title')}
          </h1>

          <p className="mt-6 text-lead text-on-ink-muted">{t('subtitle')}</p>

          {/* Stacked and full width below 480px — a thumb-width target beats a tidy row. */}
          <div className="mt-8 flex flex-col gap-3 min-[480px]:flex-row">
            <Button
              as="a"
              href="#kontakt"
              variant="primary"
              className="w-full min-[480px]:w-auto"
            >
              {t('ctaPrimary')}
            </Button>

            {/* Rendered only once a real number exists: `telHref()` returns null while the
                value is still `{{PHONE_E164}}`, and a dead tel: link is worse than no
                button — it looks like the phone is broken, not like the site is unfinished. */}
            {tel ? (
              <Button
                as="a"
                href={tel}
                variant="secondary"
                aria-label={t('ctaSecondaryAria')}
                className="w-full min-[480px]:w-auto"
              >
                {t('ctaSecondary')}
              </Button>
            ) : null}
          </div>

          <p className="mt-8 text-small text-on-ink-muted">{trust.join(' · ')}</p>
        </div>
      </Container>
    </section>
  );
}

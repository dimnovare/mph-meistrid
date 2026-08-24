import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { QuoteForm } from '@/components/sections/QuoteForm';
import { Container, Section } from '@/components/ui/Container';
import { isPlaceholder, mailtoHref, telHref } from '@/content/site';
import type { Locale } from '@/i18n/routing';

/**
 * Kontakt — design-system.md §7.7.
 *
 * Phone and email are clickable **only** when they are real. `telHref()` and `mailtoHref()`
 * return null while the value is still `{{PHONE_E164}}` / `{{EMAIL}}`, and a `tel:` link
 * that dials nothing is a worse failure than an obviously unfinished page: the visitor
 * blames the company, not the build. While they are placeholders the raw token is printed
 * as plain text — unmistakably unfinished — and the quote form beside it is the working
 * path to a conversation.
 */
type DetailRow = {
  key: string;
  label: string;
  value: string;
  /** Null renders the value as plain text. */
  href: string | null;
  icon: ReactNode;
  valueClassName?: string;
};

export async function Contact({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'contact' });

  const phoneValue = t('phoneValue');
  const emailValue = t('emailValue');

  // Both halves have to be real: the href comes from `src/content/site.ts` and the visible
  // value from the message catalogue, and they are filled in separately.
  const tel = isPlaceholder(phoneValue) ? null : telHref();
  const mailto = isPlaceholder(emailValue) ? null : mailtoHref();

  const rows: DetailRow[] = [
    {
      key: 'phone',
      label: t('phoneLabel'),
      value: phoneValue,
      href: tel,
      icon: <PhoneIcon />,
      valueClassName: 'tabular-nums',
    },
    {
      key: 'email',
      label: t('emailLabel'),
      value: emailValue,
      href: mailto,
      icon: <MailIcon />,
      // A long address overflows the content box at 360px without this.
      valueClassName: '[overflow-wrap:anywhere]',
    },
    {
      key: 'company',
      label: t('companyLabel'),
      value: t('companyValue'),
      href: null,
      icon: <BuildingIcon />,
    },
    {
      key: 'regCode',
      label: t('regCodeLabel'),
      value: t('regCodeValue'),
      href: null,
      icon: <IdIcon />,
      valueClassName: 'tabular-nums',
    },
    {
      key: 'region',
      label: t('regionLabel'),
      value: t('regionValue'),
      href: null,
      icon: <PinIcon />,
    },
  ];

  return (
    <Section id="kontakt" tone="surface" labelledBy="kontakt-heading">
      <Container>
        <div className="max-w-copy">
          <span aria-hidden="true" className="mb-5 block h-[3px] w-8 bg-accent" />
          <h2 id="kontakt-heading" className="text-h2">
            {t('heading')}
          </h2>
          <p className="mt-5 text-lead text-fg-muted">{t('intro')}</p>
        </div>

        {/* 900px, not a stock breakpoint (§7.7): below it the form and the details would each
            be too narrow to read, above it they sit side by side. */}
        <div className="mt-block grid grid-cols-1 gap-block min-[900px]:grid-cols-2 min-[900px]:gap-12">
          <dl className="max-w-copy">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex min-h-tap items-center gap-4 border-b border-line py-3 last:border-b-0"
              >
                <span className="shrink-0 text-fg-muted">{row.icon}</span>
                <div className="min-w-0">
                  <dt className="text-label uppercase text-fg-muted">{row.label}</dt>
                  <dd
                    className={`mt-0.5 font-sans text-[1.125rem] font-semibold text-fg-strong ${
                      row.valueClassName ?? ''
                    }`.trim()}
                  >
                    {row.href ? (
                      // `line-strong` underline rather than the default: at 2px it is a
                      // deliberate rule, and it turns accent on hover instead of vanishing.
                      <a
                        href={row.href}
                        className="underline decoration-line-strong decoration-2 underline-offset-[3px] transition-colors hover:decoration-accent"
                      >
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="max-w-form">
            <QuoteForm />
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ glyphs */
/*
 * Five 20px glyphs, inlined. No icon library: this is the entire icon requirement of the
 * public site, and a package would cost more bytes than the whole section. All of them
 * inherit `currentColor` and are `aria-hidden` — the adjacent <dt> is the label.
 */

const glyph = 'h-5 w-5';
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: '1.75' } as const;

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={glyph} {...stroke}>
      <path d="M7 3h4l1.5 4.5-2.5 1.5a12 12 0 0 0 5 5l1.5-2.5L21 13v4a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={glyph} {...stroke}>
      <rect x="2.5" y="5" width="19" height="14" />
      <path d="m2.5 6.5 9.5 7 9.5-7" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={glyph} {...stroke}>
      <path d="M4 20V4h11v16" />
      <path d="M15 9h5v11" />
      <path d="M2.5 20h19" />
      <path d="M7.5 8h4M7.5 12h4M7.5 16h4" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={glyph} {...stroke}>
      <rect x="2.5" y="5" width="19" height="14" />
      <path d="M6.5 9.5h4v5h-4z" />
      <path d="M13.5 10h4M13.5 14h4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={glyph} {...stroke}>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

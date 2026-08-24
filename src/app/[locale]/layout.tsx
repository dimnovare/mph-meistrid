import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { CallBar } from '@/components/layout/CallBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { site } from '@/content/site';
import { routing, type Locale } from '@/i18n/routing';
import { fontVariables } from '@/lib/fonts';
import { businessJsonLd, jsonLdScript, websiteJsonLd } from '@/lib/jsonld';
import { buildMetadata } from '@/lib/seo';

import '../globals.css';

/**
 * Both locales are known at build time, so both pages are prerendered. `setRequestLocale`
 * below is what keeps them static — without it next-intl reads request state and the whole
 * subtree becomes dynamic, which would mean an R2 round-trip on every visit.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: site.themeColor,
  // The palette has no dark variant on purpose (docs/design-system.md §2). Declaring `light`
  // stops a phone in system dark mode from inverting native form controls inside our UI.
  colorScheme: 'light',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    ...buildMetadata({
      locale: locale as Locale,
      path: '/',
      title: t('title'),
      description: t('description'),
    }),
    // Every page's <title> falls back to the site title; project pages override the `%s`.
    title: { default: t('title'), template: `%s | ${site.shortName}` },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'a11y' });

  /*
   * Only the namespaces a client component actually reads.
   *
   * `NextIntlClientProvider` with no `messages` prop serialises the entire catalogue into
   * every page's payload — all twelve namespaces, keys included, on a site where eight of
   * them are only ever rendered on the server. Four client components need translations:
   * LangSwitch and MobileNav (`a11y`, `common`), QuoteForm (`quote`), Lightbox
   * (`work.gallery`), plus `common.error` for the error boundary.
   *
   * If a new client component calls `useTranslations` for a namespace that is not listed
   * here it will render the key path instead of the text, which is loud enough to catch in
   * review. Add the namespace here when that happens.
   */
  const messages = await getMessages();
  const clientMessages = {
    a11y: messages.a11y,
    common: messages.common,
    quote: messages.quote,
    work: { gallery: (messages.work as Record<string, unknown>).gallery },
  };

  return (
    <html lang={locale} className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={clientMessages}>
          {/* Keyboard users land here first; styled in globals.css. */}
          <a href="#sisu" className="skip-link">
            {t('skipToContent')}
          </a>

          <Header locale={locale as Locale} />

          <main id="sisu" className="flex-1">
            {children}
          </main>

          <Footer locale={locale as Locale} />

          {/* Mobile only; the body reserves its height so it never covers the footer. */}
          <CallBar />
        </NextIntlClientProvider>

        {/*
          Emitted once per page from the layout so both the landing page and every project
          page carry the business identity. Project pages add their own CreativeWork node.
          `jsonLdScript` escapes `<` so no value can close this element early.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([
              businessJsonLd(locale as Locale),
              websiteJsonLd(locale as Locale),
            ]),
          }}
        />
      </body>
    </html>
  );
}

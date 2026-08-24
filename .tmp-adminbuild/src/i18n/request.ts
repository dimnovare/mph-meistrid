import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { fallbackLocale, routing } from './routing';

type Messages = Record<string, unknown>;

async function load(locale: string): Promise<Messages> {
  return (await import(`./messages/${locale}.json`)).default as Messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // Merge over Estonian so an untranslated key shows Estonian rather than the raw key path.
  const messages =
    locale === fallbackLocale
      ? await load(fallbackLocale)
      : { ...(await load(fallbackLocale)), ...(await load(locale)) };

  return { locale, messages };
});

import type { MetadataRoute } from 'next';
import { routing } from '@/libs/I18nRouting';
import { getBaseUrl, getI18nPath } from '@/utils/Helpers';

/**
 * Hub pages only. Storefronts are share-only by design ("hub, bukan
 * direktori"): enumerating every store and product here would turn the
 * sitemap into the public directory the product promises not to be.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  const localized = (path: string) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales
          .filter(locale => locale !== routing.defaultLocale)
          .map(locale => [locale, `${baseUrl}${getI18nPath(path, locale)}`]),
      ),
    },
  });

  return [localized(''), localized('/terms'), localized('/privacy')];
}

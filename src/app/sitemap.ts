import type { MetadataRoute } from 'next';
import { and, eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { routing } from '@/libs/I18nRouting';
import { products, stores } from '@/models/Schema';
import { getBaseUrl, getI18nPath } from '@/utils/Helpers';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales
            .filter(locale => locale !== routing.defaultLocale)
            .map(locale => [locale, `${baseUrl}${getI18nPath('', locale)}`]),
        ),
      },
    },
  ];

  try {
    const activeStores = await db
      .select()
      .from(stores)
      .where(eq(stores.status, 'active'));

    for (const store of activeStores) {
      entries.push({
        url: `${baseUrl}/${store.slug}`,
        lastModified: store.updatedAt,
      });

      const activeProducts = await db
        .select()
        .from(products)
        .where(and(eq(products.storeId, store.id), eq(products.status, 'active')));

      for (const product of activeProducts) {
        entries.push({
          url: `${baseUrl}/${store.slug}/p/${product.slug}`,
          lastModified: product.updatedAt,
        });
      }
    }
  } catch {
    // Keep hub-only sitemap if DB is unavailable.
  }

  return entries;
}

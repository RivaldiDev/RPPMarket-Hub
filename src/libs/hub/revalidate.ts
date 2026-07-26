import { revalidatePath } from 'next/cache';
import { AllLocales, AppConfig } from '@/utils/AppConfig';

/**
 * Revalidate a public path under every locale variant.
 * With `localePrefix: 'as-needed'` the default locale lives at the bare
 * path and other locales under `/{locale}` — revalidating only the bare
 * path leaves e.g. `/en/{slug}` serving stale (possibly unpublished) content.
 */
export function revalidateLocalizedPath(path: string): void {
  revalidatePath(path);
  for (const locale of AllLocales) {
    if (locale !== AppConfig.i18n.defaultLocale) {
      revalidatePath(`/${locale}${path}`);
    }
  }
}

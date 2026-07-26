import type { MetadataRoute } from 'next';
import { AllLocales, AppConfig } from '@/utils/AppConfig';
import { getBaseUrl } from '@/utils/Helpers';

const PRIVATE_PATHS = [
  '/dashboard',
  '/api',
  '/payments/return',
  '/sign-in',
  '/sign-up',
  '/monitoring',
];

export default function robots(): MetadataRoute.Robots {
  // Non-default locales are served under /{locale}/… and need their own rules.
  const disallow = PRIVATE_PATHS.flatMap(path => [
    path,
    ...AllLocales.filter(locale => locale !== AppConfig.i18n.defaultLocale).map(
      locale => `/${locale}${path}`,
    ),
  ]);

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}

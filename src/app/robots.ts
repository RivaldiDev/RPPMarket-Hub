import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/utils/Helpers';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/api',
        '/payments/return',
        '/sign-in',
        '/sign-up',
        '/onboarding',
      ],
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}

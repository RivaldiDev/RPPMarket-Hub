import type { NextFetchEvent, NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware({
  ...routing,
  localeDetection: true,
});

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
]);

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/:locale/sign-in(.*)',
  '/sign-up(.*)',
  '/:locale/sign-up(.*)',
]);

/**
 * Hub MVP: personal seller accounts (no Clerk org lock).
 * Storefront + payment APIs remain public.
 */
export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (isAuthPage(request) || isProtectedRoute(request)) {
    return clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        const localeMatch = req.nextUrl.pathname.match(/^\/(id|en)(?=\/|$)/);
        const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
        const signInUrl = new URL(`${localePrefix}/sign-in`, req.url);

        await auth.protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      return handleI18nRouting(req);
    })(request, event);
  }

  return handleI18nRouting(request);
}

export const config = {
  // Keep payment callback outside i18n/auth rewrites.
  matcher: '/((?!_next|_vercel|monitoring|api/payments|.*\\..*).*)',
};

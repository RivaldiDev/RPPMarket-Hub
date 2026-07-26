import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/I18nRouting';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves the public base URL of the application.
 */
export const getBaseUrl = () => {
  if (Env.NEXT_PUBLIC_APP_URL) {
    return Env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
};

/**
 * Builds a locale-aware path by prefixing non-default locales.
 */
export const getI18nPath = (url: string, locale: string) => {
  if (locale === routing.defaultLocale) {
    return url;
  }

  return `/${locale}${url}`;
};

/**
 * Mock payments only in non-production, or when explicitly allowed.
 * Prevents free wallet credit in production if Duitku keys are missing.
 */
export function isMockPaymentsAllowed(): boolean {
  if (Env.ALLOW_MOCK_PAYMENTS === 'true') {
    return true;
  }
  return Env.NODE_ENV !== 'production';
}

/**
 * Allow only safe https (or http localhost) absolute URLs for seller-provided media.
 */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') {
      return true;
    }
    if (
      url.protocol === 'http:'
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate Duitku payment redirect targets (open-redirect guard).
 * Accepts:
 * - relative same-origin paths starting with /
 * - absolute https URLs on duitku.com hosts
 */
export function isSafePaymentRedirectUrl(value: string): boolean {
  if (!value || value.length > 2048) {
    return false;
  }

  // Relative app path only (no protocol-relative //evil.com)
  if (value.startsWith('/') && !value.startsWith('//')) {
    return !value.includes('\\') && !value.includes('\n') && !value.includes('\r');
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      return false;
    }
    const host = url.hostname.toLowerCase();
    return host === 'duitku.com' || host.endsWith('.duitku.com');
  } catch {
    return false;
  }
}

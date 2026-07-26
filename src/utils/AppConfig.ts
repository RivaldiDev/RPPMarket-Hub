import type { LocalizationResource } from '@clerk/shared/types';
import type { LocalePrefixMode } from 'next-intl/routing';
import type { AppLocale } from '@/types/I18n';
import { enUS, idID } from '@clerk/localizations';

/** Locale prefix strategy for next-intl routing. */
const localePrefix: LocalePrefixMode = 'as-needed';
const locales = [
  {
    id: 'id',
    name: 'Bahasa Indonesia',
  },
  {
    id: 'en',
    name: 'English',
  },
] satisfies AppLocale[];

/** Centralized application configuration */
export const AppConfig = {
  name: 'RPP Market',
  i18n: {
    locales,
    defaultLocale: 'id',
    localePrefix,
  },
  email: {
    support: 'support@rppmarket.com',
  },
} as const;

const supportedLocales: Record<string, LocalizationResource> = {
  id: idID,
  en: enUS,
};

export const ClerkLocalizations = {
  defaultLocale: idID,
  supportedLocales,
};

export const AllLocales = AppConfig.i18n.locales.map(locale => locale.id);

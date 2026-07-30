import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'ar', 'ku'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Arabic and Kurdish (Sorani) are written right-to-left. */
const RTL_LOCALES = new Set<Locale>(['ar', 'ku']);

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function directionOf(locale: string): 'rtl' | 'ltr' {
  return isLocale(locale) && RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

/** Human-readable label for each locale, in its own script. */
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
  ku: 'کوردی',
};

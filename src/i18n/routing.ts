import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'ar', 'ku'] as const;
export type Locale = (typeof locales)[number];

/**
 * Arabic. This is an Iraqi government services guide: Arabic is the language
 * most of its readers actually read, so it is what an unprefixed URL resolves
 * to and what any code needing "some locale" falls back on.
 */
export const defaultLocale: Locale = 'ar';

/** Arabic and Kurdish (Sorani) are written right-to-left. */
const RTL_LOCALES = new Set<Locale>(['ar', 'ku']);

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Do not let `Accept-Language` decide. A phone sold here often ships with an
  // English UI regardless of what its owner reads, so honouring the header
  // would send a large share of Arabic readers to the English site — the exact
  // thing making Arabic the default is meant to stop. A reader who picks a
  // language still keeps it: next-intl remembers the choice in a cookie, which
  // takes priority over this.
  localeDetection: false,
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

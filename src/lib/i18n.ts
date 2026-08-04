import type { ContentLocale } from '@/types/pb';
import { defaultLocale, isLocale, type Locale } from '@/i18n/routing';

export const contentLocales: readonly ContentLocale[] = ['en', 'ar', 'ku'];

/**
 * Anything carrying `_en` / `_ar` / `_ku` fields.
 *
 * Deliberately `object` rather than `Record<string, unknown>`: the generated
 * record interfaces in `types/pb.ts` have no index signature, so they are not
 * assignable to a Record and every call site would need a cast.
 */
type Translatable = object;

function readSuffixed(record: Translatable, field: string, locale: ContentLocale): string {
  const value = (record as Record<string, unknown>)[`${field}_${locale}`];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Resolve a translatable content field for the requested locale.
 *
 * Content is frequently only partially translated, so this walks a fallback
 * chain — requested locale, then English, then the first non-empty language —
 * rather than rendering a blank. Never hardcode `_en` / `_ar` / `_ku` suffixes
 * at a call site; go through here so the fallback stays consistent.
 */
export function localized(record: Translatable, field: string, locale: string): string {
  const requested: ContentLocale = isLocale(locale) ? locale : defaultLocale;

  const direct = readSuffixed(record, field, requested);
  if (direct) return direct;

  const english = readSuffixed(record, field, 'en');
  if (english) return english;

  for (const candidate of contentLocales) {
    const value = readSuffixed(record, field, candidate);
    if (value) return value;
  }
  return '';
}

/** Which languages are still missing for a field — drives the admin's translation badges. */
export function missingLocales(record: Translatable, field: string): ContentLocale[] {
  return contentLocales.filter((locale) => !readSuffixed(record, field, locale));
}

/**
 * Translation completeness across several fields at once, for the admin list views.
 * A locale counts as complete only when every field named has content in it.
 */
export function translationStatus(
  record: Translatable,
  fields: readonly string[],
): Record<ContentLocale, boolean> {
  return {
    en: fields.every((f) => readSuffixed(record, f, 'en')),
    ar: fields.every((f) => readSuffixed(record, f, 'ar')),
    ku: fields.every((f) => readSuffixed(record, f, 'ku')),
  };
}

export type { Locale };

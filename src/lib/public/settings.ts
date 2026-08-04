import type { SettingsRecord } from '@/types/pb';
import { localized } from '@/lib/i18n';

export type SettingsLookup = ReadonlyMap<string, SettingsRecord>;

/** Index the settings collection by `key` for O(1) lookup in a layout. */
export function settingsMap(records: readonly SettingsRecord[]): SettingsLookup {
  return new Map(records.map((record) => [record.key, record]));
}

/**
 * Resolve one setting for the active locale.
 *
 * `no_trans` marks values that are the same in every language — a phone number,
 * an email address, a social URL. Those are read from the English column
 * directly rather than through the translation fallback, because that column is
 * the canonical value, not an English rendering of it. Running them through the
 * fallback chain would work today but would silently pick up a stray Arabic
 * edit as if it were a translation.
 *
 * A missing key returns an empty string. Settings are staff-editable and a key
 * can legitimately be absent, so callers render nothing rather than break.
 */
export function settingValue(
  settings: SettingsLookup,
  key: string,
  locale: string,
): string {
  const record = settings.get(key);
  if (!record) return '';
  if (record.no_trans) return (record.value_en ?? '').trim();
  return localized(record, 'value', locale);
}

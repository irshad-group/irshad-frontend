import { describe, expect, it } from 'vitest';
import type { SettingsRecord } from '@/types/pb';
import { settingsMap, settingValue } from './settings';

function setting(overrides: Partial<SettingsRecord> & { key: string }): SettingsRecord {
  return {
    id: overrides.key,
    created: '',
    updated: '',
    collectionId: 'set',
    collectionName: 'settings',
    title: overrides.key,
    group: 'general',
    no_trans: false,
    value_en: '',
    value_ar: '',
    value_ku: '',
    ...overrides,
  } as SettingsRecord;
}

describe('settingsMap', () => {
  it('indexes records by key', () => {
    const map = settingsMap([setting({ key: 'a' }), setting({ key: 'b' })]);
    expect(map.size).toBe(2);
    expect(map.get('a')?.key).toBe('a');
  });

  it('handles an empty collection', () => {
    expect(settingsMap([]).size).toBe(0);
  });

  it('keeps the last record when a key appears twice', () => {
    const map = settingsMap([
      setting({ key: 'dup', value_en: 'first' }),
      setting({ key: 'dup', value_en: 'second' }),
    ]);
    expect(map.get('dup')?.value_en).toBe('second');
  });
});

describe('settingValue', () => {
  const settings = settingsMap([
    setting({ key: 'site_name', value_en: 'Irshad', value_ar: 'إرشاد', value_ku: 'ئیرشاد' }),
    setting({ key: 'tagline', value_en: 'Know before you go', value_ar: 'اعرف قبل أن تذهب' }),
    setting({ key: 'contact_email', no_trans: true, value_en: 'info@irshad.gov.iq' }),
    setting({ key: 'blank', value_en: '', value_ar: '', value_ku: '' }),
    setting({ key: 'padded', no_trans: true, value_en: '  +964 780 000 0000  ' }),
  ]);

  it('returns the value for the requested locale', () => {
    expect(settingValue(settings, 'site_name', 'ar')).toBe('إرشاد');
    expect(settingValue(settings, 'site_name', 'ku')).toBe('ئیرشاد');
    expect(settingValue(settings, 'site_name', 'en')).toBe('Irshad');
  });

  it('falls back to English when the requested language is empty', () => {
    expect(settingValue(settings, 'tagline', 'ku')).toBe('Know before you go');
  });

  it('reads an untranslated value from the English column whatever the locale', () => {
    expect(settingValue(settings, 'contact_email', 'ar')).toBe('info@irshad.gov.iq');
    expect(settingValue(settings, 'contact_email', 'ku')).toBe('info@irshad.gov.iq');
  });

  it('trims an untranslated value', () => {
    expect(settingValue(settings, 'padded', 'en')).toBe('+964 780 000 0000');
  });

  it('returns an empty string for a missing key rather than throwing', () => {
    expect(settingValue(settings, 'no_such_key', 'en')).toBe('');
  });

  it('returns an empty string when every language is empty', () => {
    expect(settingValue(settings, 'blank', 'ar')).toBe('');
  });

  it('handles an untranslated setting with no value at all', () => {
    const sparse = settingsMap([setting({ key: 'empty', no_trans: true, value_en: undefined })]);
    expect(settingValue(sparse, 'empty', 'en')).toBe('');
  });

  it('falls back to English for an unknown locale string', () => {
    expect(settingValue(settings, 'site_name', 'fr')).toBe('Irshad');
  });
});

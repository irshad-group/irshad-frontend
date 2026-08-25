import { describe, expect, it } from 'vitest';
import { contentLocales, localized, missingLocales, translationStatus } from './i18n';

const full = { title_en: 'Passport', title_ar: 'جواز', title_ku: 'پاسپۆرت' };

describe('localized', () => {
  it('returns the requested language when it has content', () => {
    expect(localized(full, 'title', 'en')).toBe('Passport');
    expect(localized(full, 'title', 'ar')).toBe('جواز');
    expect(localized(full, 'title', 'ku')).toBe('پاسپۆرت');
  });

  it('falls back to Arabic before English', () => {
    const record = { title_en: 'Passport', title_ar: 'جواز', title_ku: '' };
    expect(localized(record, 'title', 'ku')).toBe('جواز');
  });

  it('falls back to English when there is no Arabic', () => {
    const record = { title_en: 'Passport', title_ar: '', title_ku: '' };
    expect(localized(record, 'title', 'ku')).toBe('Passport');
  });

  it('falls back to whatever language has content', () => {
    const record = { title_en: '', title_ar: '', title_ku: 'پاسپۆرت' };
    expect(localized(record, 'title', 'en')).toBe('پاسپۆرت');
  });

  it('treats an unknown locale as the default one', () => {
    const record = { title_en: 'Passport', title_ar: 'جواز', title_ku: 'پاسپۆرت' };
    expect(localized(record, 'title', 'fr')).toBe('جواز');
  });

  // Staff paste text with stray whitespace; a field of spaces is not content.
  it('ignores whitespace-only and non-string values', () => {
    expect(localized({ title_en: '   ', title_ar: 'جواز' }, 'title', 'en')).toBe('جواز');
    expect(localized({ title_en: 42, title_ar: 'جواز' }, 'title', 'en')).toBe('جواز');
  });

  it('returns an empty string when no language has content', () => {
    expect(localized({ title_en: '', title_ar: '', title_ku: '' }, 'title', 'en')).toBe('');
    expect(localized({}, 'title', 'ar')).toBe('');
  });
});

describe('missingLocales', () => {
  it('names the languages a field is still missing', () => {
    expect(missingLocales(full, 'title')).toEqual([]);
    expect(missingLocales({ title_en: 'Passport' }, 'title')).toEqual(['ar', 'ku']);
  });
});

describe('translationStatus', () => {
  it('marks a language complete only when every field has content', () => {
    const record = { ...full, body_en: 'How to', body_ar: 'كيف', body_ku: '' };
    expect(translationStatus(record, ['title', 'body'])).toEqual({ en: true, ar: true, ku: false });
  });

  it('treats a record with no fields named as complete', () => {
    expect(translationStatus(full, [])).toEqual({ en: true, ar: true, ku: true });
  });
});

describe('contentLocales', () => {
  it('lists the three content languages', () => {
    expect([...contentLocales]).toEqual(['en', 'ar', 'ku']);
  });
});

import { describe, expect, it } from 'vitest';
import { attachedFile, formatFee, parseListParams } from './procedures';

describe('formatFee', () => {
  it('groups thousands', () => {
    expect(formatFee(100000, 'en')).toBe('100,000');
  });

  it('keeps Latin digits in Arabic and Kurdish', () => {
    // Iraqi government forms print fees in Latin digits; a citizen comparing
    // the screen with a printed schedule must see the same shapes.
    expect(formatFee(100000, 'ar')).toMatch(/^[\d,.  ]+$/);
    expect(formatFee(100000, 'ar')).not.toMatch(/[٠-٩]/);
    expect(formatFee(25000, 'ku')).not.toMatch(/[٠-٩]/);
  });

  it('drops fractions', () => {
    expect(formatFee(1500.75, 'en')).toBe('1,501');
  });

  it('returns null when there is no fee to show', () => {
    expect(formatFee(0, 'en')).toBeNull();
    expect(formatFee(undefined, 'en')).toBeNull();
    expect(formatFee(null, 'en')).toBeNull();
    expect(formatFee(-5, 'en')).toBeNull();
    expect(formatFee(Number.NaN, 'en')).toBeNull();
  });
});

describe('attachedFile', () => {
  it('prefers an uploaded document over an external link', () => {
    // Our own origin cannot rot or redirect somewhere unexpected.
    const result = attachedFile(
      { document: 'form.pdf', external_url: 'https://example.gov.iq/form' },
      'https://pb.test/api/files/c/r/form.pdf',
    );
    expect(result).toEqual({
      kind: 'download',
      href: 'https://pb.test/api/files/c/r/form.pdf',
      extension: 'PDF',
    });
  });

  it('upper-cases the extension', () => {
    expect(attachedFile({ document: 'sheet.XlSx' }, 'https://pb.test/f')?.extension).toBe('XLSX');
  });

  it('copes with a filename that has no extension', () => {
    expect(attachedFile({ document: 'scan' }, 'https://pb.test/f')?.extension).toBe('');
  });

  it('copes with a filename ending in a dot', () => {
    expect(attachedFile({ document: 'scan.' }, 'https://pb.test/f')?.extension).toBe('');
  });

  it('falls back to the external link when there is no upload', () => {
    expect(attachedFile({ external_url: 'https://example.gov.iq/form' }, null)).toEqual({
      kind: 'link',
      href: 'https://example.gov.iq/form',
      extension: '',
    });
  });

  it('treats a whitespace-only external url as absent', () => {
    expect(attachedFile({ external_url: '   ' }, null)).toBeNull();
  });

  it('returns null when the record points nowhere', () => {
    expect(attachedFile({}, null)).toBeNull();
    expect(attachedFile({ document: '', external_url: '' }, null)).toBeNull();
  });

  it('falls back to the link when a document is named but its URL could not be built', () => {
    expect(attachedFile({ document: 'form.pdf', external_url: 'https://x.test/f' }, null)).toEqual({
      kind: 'link',
      href: 'https://x.test/f',
      extension: '',
    });
  });

  it('returns null when a document is named but has no URL and no fallback', () => {
    expect(attachedFile({ document: 'form.pdf' }, null)).toBeNull();
  });
});

describe('parseListParams', () => {
  it('reads the values it is given', () => {
    expect(parseListParams({ q: 'passport', tag: 'travel', page: '3' })).toEqual({
      q: 'passport',
      tag: 'travel',
      page: 3,
    });
  });

  it('defaults an absent query string', () => {
    expect(parseListParams({})).toEqual({ q: '', tag: '', page: 1 });
  });

  it('trims whitespace', () => {
    expect(parseListParams({ q: '  passport  ' }).q).toBe('passport');
  });

  it('takes the first value when a parameter is repeated', () => {
    expect(parseListParams({ q: ['first', 'second'] }).q).toBe('first');
    expect(parseListParams({ page: ['2', '9'] }).page).toBe(2);
  });

  it('treats an empty repeated parameter as absent', () => {
    expect(parseListParams({ q: [] }).q).toBe('');
  });

  it('refuses a page below 1', () => {
    expect(parseListParams({ page: '0' }).page).toBe(1);
    expect(parseListParams({ page: '-4' }).page).toBe(1);
  });

  it('refuses a page that is not a number', () => {
    expect(parseListParams({ page: 'abc' }).page).toBe(1);
    expect(parseListParams({ page: '' }).page).toBe(1);
  });

  it('takes the leading integer of a mixed value', () => {
    // parseInt semantics: "2x" is 2. Safe, because the result is still clamped.
    expect(parseListParams({ page: '2x' }).page).toBe(2);
  });
});

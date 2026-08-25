import { describe, expect, it } from 'vitest';
import {
  highlightParts,
  PROCEDURE_SEARCH_FIELDS,
  searchFilter,
  shouldSuggest,
  SUGGEST_LIMIT,
  SUGGEST_MIN_CHARS,
} from './search';

describe('searchFilter', () => {
  it('is empty for an empty term, so callers can tell "no search" from "no results"', () => {
    expect(searchFilter('', PROCEDURE_SEARCH_FIELDS)).toBe('');
    expect(searchFilter('   ', PROCEDURE_SEARCH_FIELDS)).toBe('');
  });

  it('ORs a substring match across every field it is given', () => {
    expect(searchFilter('passport', ['title_en', 'title_ar'])).toBe(
      'title_en ~ "%passport%" || title_ar ~ "%passport%"',
    );
  });

  it('trims the term but keeps the wildcards outside it', () => {
    expect(searchFilter('  passport  ', ['title_en'])).toBe('title_en ~ "%passport%"');
  });

  it('escapes a quote so it cannot close the filter string', () => {
    expect(searchFilter('say "hi"', ['title_en'])).toBe('title_en ~ "%say \\"hi\\"%"');
  });

  it('escapes a backslash', () => {
    expect(searchFilter('a\\b', ['title_en'])).toBe('title_en ~ "%a\\\\b%"');
  });

  it('handles Arabic and Kurdish terms unchanged', () => {
    expect(searchFilter('جواز', ['title_ar'])).toBe('title_ar ~ "%جواز%"');
    expect(searchFilter('پاسپۆرت', ['title_ku'])).toBe('title_ku ~ "%پاسپۆرت%"');
  });

  it('is empty when there are no fields to match against', () => {
    expect(searchFilter('passport', [])).toBe('');
  });

  it('covers all three languages by default', () => {
    expect(PROCEDURE_SEARCH_FIELDS).toEqual([
      'title_en',
      'title_ar',
      'title_ku',
      'summary_en',
      'summary_ar',
      'summary_ku',
    ]);
  });
});

describe('shouldSuggest', () => {
  it('rejects anything below the minimum', () => {
    expect(shouldSuggest('')).toBe(false);
    expect(shouldSuggest('p')).toBe(false);
    expect(shouldSuggest('  p  ')).toBe(false);
  });

  it('accepts the minimum and above', () => {
    expect(shouldSuggest('pa')).toBe(true);
    expect(shouldSuggest('passport')).toBe(true);
  });

  it('accepts a two-letter Arabic term', () => {
    expect(shouldSuggest('جو')).toBe(true);
  });

  it('counts code points, not UTF-16 units', () => {
    // One astral code point is one character, not two.
    expect(shouldSuggest('𝕏')).toBe(false);
    expect(shouldSuggest('𝕏𝕏')).toBe(true);
  });

  it('agrees with the exported minimum', () => {
    expect(SUGGEST_MIN_CHARS).toBe(2);
    expect(SUGGEST_LIMIT).toBeGreaterThan(0);
  });
});

describe('highlightParts', () => {
  it('splits around the match', () => {
    expect(highlightParts('Renew an Iraqi Passport', 'Iraqi')).toEqual({
      before: 'Renew an ',
      match: 'Iraqi',
      after: ' Passport',
    });
  });

  it('matches case-insensitively but returns the original casing', () => {
    expect(highlightParts('Renew an Iraqi Passport', 'iraqi').match).toBe('Iraqi');
  });

  it('matches at the very start', () => {
    expect(highlightParts('Passport renewal', 'pass')).toEqual({
      before: '',
      match: 'Pass',
      after: 'port renewal',
    });
  });

  it('returns the whole string when the term is absent — the record matched another language', () => {
    expect(highlightParts('تجديد جواز السفر', 'passport')).toEqual({
      before: 'تجديد جواز السفر',
      match: '',
      after: '',
    });
  });

  it('returns the whole string for an empty or blank term', () => {
    expect(highlightParts('Passport', '')).toEqual({ before: 'Passport', match: '', after: '' });
    expect(highlightParts('Passport', '   ')).toEqual({ before: 'Passport', match: '', after: '' });
  });

  it('ignores surrounding whitespace on the term', () => {
    expect(highlightParts('Passport renewal', '  renewal  ').match).toBe('renewal');
  });

  it('highlights inside Arabic text', () => {
    expect(highlightParts('تجديد جواز السفر', 'جواز')).toEqual({
      before: 'تجديد ',
      match: 'جواز',
      after: ' السفر',
    });
  });

  it('handles an empty subject', () => {
    expect(highlightParts('', 'x')).toEqual({ before: '', match: '', after: '' });
  });
});

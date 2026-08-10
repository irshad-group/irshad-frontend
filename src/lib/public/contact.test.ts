import { describe, expect, it } from 'vitest';
import { looksAutomated, validateContact } from './contact';

const valid = {
  first_name: 'Zainab',
  last_name: 'Hassan',
  email: 'zainab@example.iq',
  phone: '+964 780 000 0000',
  message: 'I need to know which documents to bring for a passport renewal.',
};

describe('validateContact', () => {
  it('accepts a complete submission', () => {
    const result = validateContact(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe('zainab@example.iq');
  });

  it('accepts a submission with no phone number', () => {
    const { phone, ...rest } = valid;
    void phone;
    const result = validateContact(rest);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.phone).toBeUndefined();
  });

  it('normalises an empty phone away rather than storing a blank', () => {
    const result = validateContact({ ...valid, phone: '   ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.phone).toBeUndefined();
  });

  it('trims surrounding whitespace', () => {
    const result = validateContact({ ...valid, first_name: '  Zainab  ' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.first_name).toBe('Zainab');
  });

  it('accepts Arabic and Kurdish names', () => {
    expect(validateContact({ ...valid, first_name: 'زينب', last_name: 'حسن' }).ok).toBe(true);
    expect(validateContact({ ...valid, first_name: 'ژیان', last_name: 'ئەحمەد' }).ok).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = validateContact({ ...valid, first_name: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.first_name).toBe('tooShort');
  });

  it('rejects a whitespace-only name', () => {
    const result = validateContact({ ...valid, last_name: '     ' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.last_name).toBe('tooShort');
  });

  it('rejects a malformed email', () => {
    const result = validateContact({ ...valid, email: 'not-an-email' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBe('invalidEmail');
  });

  it('rejects a message that says nothing', () => {
    const result = validateContact({ ...valid, message: 'hi' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.message).toBe('tooShort');
  });

  it('rejects values longer than the PocketBase columns allow', () => {
    const long = validateContact({ ...valid, first_name: 'a'.repeat(65) });
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.errors.first_name).toBe('tooLong');

    const essay = validateContact({ ...valid, message: 'a'.repeat(4001) });
    expect(essay.ok).toBe(false);
    if (!essay.ok) expect(essay.errors.message).toBe('tooLong');

    const phone = validateContact({ ...valid, phone: '1'.repeat(33) });
    expect(phone.ok).toBe(false);
    if (!phone.ok) expect(phone.errors.phone).toBe('tooLong');
  });

  it('rejects a field of the wrong type without throwing', () => {
    const result = validateContact({ ...valid, first_name: 42 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.first_name).toBe('invalid');
  });

  it('reports every bad field at once, not one at a time', () => {
    const result = validateContact({ first_name: '', last_name: '', email: 'x', message: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        'email',
        'first_name',
        'last_name',
        'message',
      ]);
    }
  });

  it('keeps only the first error per field', () => {
    const result = validateContact({ ...valid, email: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(typeof result.errors.email).toBe('string');
  });

  it('rejects a filled honeypot through the schema too', () => {
    const result = validateContact({ ...valid, website: 'https://spam.example' });
    expect(result.ok).toBe(false);
  });

  it('accepts an empty honeypot', () => {
    expect(validateContact({ ...valid, website: '' }).ok).toBe(true);
  });
});

describe('looksAutomated', () => {
  it('flags a filled honeypot', () => {
    expect(looksAutomated({ website: 'https://spam.example' })).toBe(true);
  });

  it('ignores an empty or absent honeypot', () => {
    expect(looksAutomated({ website: '' })).toBe(false);
    expect(looksAutomated({ website: '   ' })).toBe(false);
    expect(looksAutomated({})).toBe(false);
  });

  it('ignores a non-string honeypot value', () => {
    expect(looksAutomated({ website: 42 })).toBe(false);
  });
});

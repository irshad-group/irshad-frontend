import { describe, expect, it } from 'vitest';
import {
  MAX_LINES,
  splitLines,
  submissionLooksAutomated,
  validateSubmission,
} from './submissions';

const VALID = {
  title: 'Renew a fishing licence',
  summary: 'How to renew the annual licence.',
  ministry: 'min000000000001',
  directorate: 'dir000000000001',
  steps: 'Go to the office\nPay the fee\n\nCollect the licence\n',
  documents: 'National ID\nOld licence',
  fee_iqd: '5000',
  processing_time: '3 days',
  notes: 'Mornings are quieter.',
};

describe('splitLines', () => {
  it('trims, drops blanks, and handles CRLF', () => {
    expect(splitLines(' a \r\n\r\n b\nc\n')).toEqual(['a', 'b', 'c']);
  });
});

describe('validateSubmission', () => {
  it('accepts a full submission and parses lines and fee', () => {
    const result = validateSubmission(VALID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.steps).toEqual(['Go to the office', 'Pay the fee', 'Collect the licence']);
    expect(result.data.documents).toEqual(['National ID', 'Old licence']);
    expect(result.data.fee_iqd).toBe(5000);
    expect(result.data.ministry).toBe('min000000000001');
  });

  it('accepts the minimal submission: title and one step', () => {
    const result = validateSubmission({ title: 'Valid title', steps: 'Only step' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      title: 'Valid title',
      summary: undefined,
      ministry: undefined,
      directorate: undefined,
      steps: ['Only step'],
      documents: [],
      fee_iqd: undefined,
      processing_time: undefined,
      notes: undefined,
    });
  });

  it('normalises empty optional strings away', () => {
    const result = validateSubmission({
      title: 'Valid title',
      steps: 'One step',
      summary: '',
      ministry: '',
      fee_iqd: '',
      processing_time: '',
      notes: '',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.summary).toBeUndefined();
    expect(result.data.ministry).toBeUndefined();
    expect(result.data.fee_iqd).toBeUndefined();
  });

  it('rejects a short or overlong title with codes', () => {
    const tooShort = validateSubmission({ title: 'abc', steps: 'One step' });
    expect(tooShort).toEqual({ ok: false, errors: { title: 'tooShort' } });
    const tooLong = validateSubmission({ title: 'x'.repeat(201), steps: 'One step' });
    expect(tooLong).toEqual({ ok: false, errors: { title: 'tooLong' } });
  });

  it('rejects a malformed relation id', () => {
    const result = validateSubmission({ title: 'Valid title', steps: 'x', ministry: 'DROP TABLE' });
    expect(result).toEqual({ ok: false, errors: { ministry: 'invalid' } });
  });

  it('requires at least one step line', () => {
    const result = validateSubmission({ title: 'Valid title', steps: '  \n \n' });
    expect(result).toEqual({ ok: false, errors: { steps: 'tooShort' } });
  });

  it('rejects too many or overlong lines', () => {
    const many = validateSubmission({
      title: 'Valid title',
      steps: Array.from({ length: MAX_LINES + 1 }, (_, i) => `step ${i}`).join('\n'),
    });
    expect(many).toEqual({ ok: false, errors: { steps: 'tooLong' } });

    const longLine = validateSubmission({
      title: 'Valid title',
      steps: 'ok',
      documents: 'y'.repeat(301),
    });
    expect(longLine).toEqual({ ok: false, errors: { documents: 'tooLong' } });
  });

  it('rejects a fee that is not a non-negative integer in range', () => {
    for (const fee of ['abc', '-5', '2.5', String(200_000_000)]) {
      expect(validateSubmission({ title: 'Valid title', steps: 'x', fee_iqd: fee })).toEqual({
        ok: false,
        errors: { fee_iqd: 'invalid' },
      });
    }
  });

  it('reports only the first code per field but all fields', () => {
    const result = validateSubmission({ title: 'abc', steps: '', fee_iqd: 'zz' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.title).toBe('tooShort');
    expect(result.errors.steps).toBe('tooShort');
    expect(result.errors.fee_iqd).toBe('invalid');
  });

  it('rejects non-string field types as invalid', () => {
    const result = validateSubmission({ title: 42, steps: 'One step' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.title).toBe('invalid');
  });

  it('reports missing steps as invalid, not a crash', () => {
    const result = validateSubmission({ title: 'Valid title' });
    expect(result).toEqual({ ok: false, errors: { steps: 'invalid' } });
  });

  it('keeps the schema-level code when a textarea also breaks the size cap', () => {
    const oversized = 'x'.repeat(MAX_LINES * 302 + 1);
    const steps = validateSubmission({ title: 'Valid title', steps: oversized });
    expect(steps).toEqual({ ok: false, errors: { steps: 'tooLong' } });
    const documents = validateSubmission({
      title: 'Valid title',
      steps: 'ok',
      documents: oversized,
    });
    expect(documents).toEqual({ ok: false, errors: { documents: 'tooLong' } });
  });
});

describe('submissionLooksAutomated', () => {
  it('flags a filled honeypot and ignores an empty one', () => {
    expect(submissionLooksAutomated({ website: 'https://spam.example' })).toBe(true);
    expect(submissionLooksAutomated({ website: '  ' })).toBe(false);
    expect(submissionLooksAutomated({})).toBe(false);
  });
});

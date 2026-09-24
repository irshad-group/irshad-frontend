import { describe, expect, it } from 'vitest';
import { groupSchedule, parseWorkingHours } from './hours';

const WEEK = [
  { day: 'SUN', from: '08:00', to: '14:00' },
  { day: 'MON', from: '08:00', to: '14:00' },
  { day: 'TUE', from: '08:00', to: '14:00' },
  { day: 'WED', from: '08:00', to: '14:00' },
  { day: 'THU', from: '08:00', to: '14:00' },
  { day: 'FRI', from: null, to: null },
  { day: 'SAT', from: null, to: null },
];

describe('parseWorkingHours', () => {
  it('parses a full week and keeps calendar order', () => {
    const parsed = parseWorkingHours([...WEEK].reverse())!;
    expect(parsed.map((d) => d.day)).toEqual(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
    expect(parsed[0]).toEqual({ day: 'SUN', from: '08:00', to: '14:00', note: null });
    expect(parsed[5]).toEqual({ day: 'FRI', from: null, to: null, note: null });
  });

  it('rejects values that are not arrays', () => {
    expect(parseWorkingHours('Sun-Thu 8-2')).toBeNull();
    expect(parseWorkingHours(null)).toBeNull();
    expect(parseWorkingHours({ day: 'SUN' })).toBeNull();
  });

  it('drops malformed entries and returns null when nothing survives', () => {
    expect(parseWorkingHours([null, 'x', { day: 'BLA' }, { from: '08:00' }])).toBeNull();
  });

  it('accepts lower-case day codes and trims notes', () => {
    const parsed = parseWorkingHours([{ day: 'sun', from: '09:00', to: '13:00', note: '  ramadan  ' }])!;
    expect(parsed[0]!.day).toBe('SUN');
    expect(parsed[0]!.note).toBe('ramadan');
  });

  it('treats bad or half-open time ranges as closed', () => {
    const parsed = parseWorkingHours([
      { day: 'SUN', from: '8am', to: '14:00' },
      { day: 'MON', from: '08:00', to: null },
      { day: 'TUE', from: '25:00', to: '99:99' },
    ])!;
    expect(parsed.every((d) => d.from === null && d.to === null)).toBe(true);
  });

  it('ignores duplicate days after the first and empty notes', () => {
    const parsed = parseWorkingHours([
      { day: 'SUN', from: '08:00', to: '14:00', note: '   ' },
      { day: 'SUN', from: '10:00', to: '12:00' },
    ])!;
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.from).toBe('08:00');
    expect(parsed[0]!.note).toBeNull();
  });

  it('ignores non-string notes', () => {
    const parsed = parseWorkingHours([{ day: 'SUN', from: '08:00', to: '14:00', note: 7 }])!;
    expect(parsed[0]!.note).toBeNull();
  });
});

describe('groupSchedule', () => {
  it('collapses a standard week into open and closed ranges', () => {
    const groups = groupSchedule(parseWorkingHours(WEEK)!);
    expect(groups).toEqual([
      { days: ['SUN', 'MON', 'TUE', 'WED', 'THU'], from: '08:00', to: '14:00', note: null },
      { days: ['FRI', 'SAT'], from: null, to: null, note: null },
    ]);
  });

  it('starts a new group when the note differs', () => {
    const groups = groupSchedule(
      parseWorkingHours([
        { day: 'SUN', from: '08:00', to: '14:00' },
        { day: 'MON', from: '08:00', to: '14:00', note: 'summer' },
      ])!,
    );
    expect(groups).toHaveLength(2);
  });

  it('returns nothing for an empty week', () => {
    expect(groupSchedule([])).toEqual([]);
  });
});

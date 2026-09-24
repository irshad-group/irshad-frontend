import { describe, expect, it } from 'vitest';
import { countByField, proceduresPerMinistry, stepDots } from './home';

describe('proceduresPerMinistry', () => {
  const directorates = [
    { id: 'd1', ministry: 'm1' },
    { id: 'd2', ministry: 'm1' },
    { id: 'd3', ministry: 'm2' },
    { id: 'd4' }, // ministry missing — staff data can be incomplete
  ];

  it('counts through the directorate relation', () => {
    const counts = proceduresPerMinistry(
      [
        { directorate: 'd1' },
        { directorate: 'd2' },
        { directorate: 'd3' },
        { directorate: 'd1' },
      ],
      directorates,
    );
    expect(counts.get('m1')).toBe(3);
    expect(counts.get('m2')).toBe(1);
  });

  it('skips procedures with no or unknown directorate, and directorates with no ministry', () => {
    const counts = proceduresPerMinistry(
      [{ directorate: undefined }, { directorate: 'ghost' }, { directorate: 'd4' }],
      directorates,
    );
    expect(counts.size).toBe(0);
  });
});

describe('countByField', () => {
  it('counts by the given relation field and ignores blanks', () => {
    const counts = countByField(
      [{ province: 'p1' }, { province: 'p1' }, { province: 'p2' }, { province: undefined }, {}],
      'province',
    );
    expect(counts.get('p1')).toBe(2);
    expect(counts.get('p2')).toBe(1);
    expect(counts.size).toBe(2);
  });
});

describe('stepDots', () => {
  it('fills the first n segments', () => {
    expect(stepDots(2, 5)).toEqual([true, true, false, false, false]);
  });

  it('caps at the segment count and floors fractions', () => {
    expect(stepDots(9, 4)).toEqual([true, true, true, true]);
    expect(stepDots(2.9, 4)).toEqual([true, true, false, false]);
  });

  it('never goes negative', () => {
    expect(stepDots(-3, 3)).toEqual([false, false, false]);
  });

  it('defaults to six segments', () => {
    expect(stepDots(6)).toHaveLength(6);
  });
});

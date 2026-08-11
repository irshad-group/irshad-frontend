import { describe, expect, it } from 'vitest';
import { IRAQ_MAP, projectPoint } from './geo';

describe('IRAQ_MAP', () => {
  it('describes a closed path inside its own canvas', () => {
    expect(IRAQ_MAP.path.startsWith('M')).toBe(true);
    expect(IRAQ_MAP.path.endsWith('Z')).toBe(true);
    const numbers = IRAQ_MAP.path.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(IRAQ_MAP.width);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(IRAQ_MAP.height);
  });
});

describe('projectPoint', () => {
  it('places Baghdad near the centre of the canvas', () => {
    const p = projectPoint(33.3152, 44.3661)!;
    expect(p.x).toBeCloseTo(337.1, 1);
    expect(p.y).toBeCloseTo(306.2, 1);
  });

  it('places Erbil north of Basra', () => {
    const erbil = projectPoint(36.1901, 44.0091)!;
    const basra = projectPoint(30.5085, 47.7804)!;
    expect(erbil.y).toBeLessThan(basra.y);
    expect(erbil.x).toBeLessThan(basra.x);
  });

  it('rejects missing coordinates', () => {
    expect(projectPoint(undefined, 44)).toBeNull();
    expect(projectPoint(33, null)).toBeNull();
  });

  it('rejects non-finite coordinates', () => {
    expect(projectPoint(Number.NaN, 44)).toBeNull();
    expect(projectPoint(33, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('rejects latitudes where Mercator degenerates', () => {
    expect(projectPoint(90, 44)).toBeNull();
    expect(projectPoint(-86, 44)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { TILE_SIZE, tileGrid, tileUrl } from './tiles';

const BAGHDAD = { lat: 33.3476248, lon: 44.3812781 };

describe('tileGrid', () => {
  it('centres the box on the coordinate', () => {
    const grid = tileGrid(BAGHDAD.lat, BAGHDAD.lon, { zoom: 16, width: 320, height: 176 })!;
    expect(grid.zoom).toBe(16);
    // The tile containing the point must cover the box centre.
    const centre = grid.tiles.find(
      (t) => t.left <= 160 && t.left + TILE_SIZE > 160 && t.top <= 88 && t.top + TILE_SIZE > 88,
    );
    expect(centre).toBeDefined();
    // …and that is the tile the standard slippy-map formula gives.
    expect(centre).toMatchObject({ x: 40847, y: 26322 });
  });

  it('covers the whole box with no gap', () => {
    const grid = tileGrid(BAGHDAD.lat, BAGHDAD.lon, { zoom: 16, width: 320, height: 176 })!;
    const corners: Array<[number, number]> = [[0, 0], [319, 0], [0, 175], [319, 175], [160, 88]];
    for (const [px, py] of corners) {
      const covering = grid.tiles.filter(
        (t) => t.left <= px && t.left + TILE_SIZE > px && t.top <= py && t.top + TILE_SIZE > py,
      );
      expect(covering).toHaveLength(1);
    }
  });

  it('wraps columns across the antimeridian instead of running out of map', () => {
    const grid = tileGrid(0.5, 179.999, { zoom: 2, width: 320, height: 176 })!;
    expect(grid.tiles.every((t) => t.x >= 0 && t.x < 4)).toBe(true);
    expect(grid.tiles.some((t) => t.x === 0)).toBe(true);
  });

  it('omits rows beyond the top and bottom of the world', () => {
    const grid = tileGrid(85, 0, { zoom: 1, width: 320, height: 176 })!;
    expect(grid.tiles.every((t) => t.y >= 0 && t.y < 2)).toBe(true);
    expect(grid.tiles.length).toBeGreaterThan(0);
  });

  it.each([
    ['no latitude', undefined, 44.38],
    ['no longitude', 33.34, undefined],
    ['null latitude', null, 44.38],
    ['latitude out of range', 91, 44.38],
    ['longitude out of range', 33.34, 181],
    ['not a number', Number.NaN, 44.38],
    ['a string', '33.34' as unknown as number, 44.38],
    ['Null Island, which means "not filled in"', 0, 0],
    ['past the north edge of Mercator', 86, 44.38],
    ['past the south edge of Mercator', -86, 44.38],
  ])('returns null for %s', (_label, lat, lon) => {
    expect(tileGrid(lat as number, lon as number)).toBeNull();
  });

  it.each([
    ['a zoom below the range', { zoom: -1 }],
    ['a zoom above the range', { zoom: 20 }],
    ['a zoom that is not a number', { zoom: Number.NaN }],
    ['zero width', { width: 0 }],
    ['negative height', { height: -10 }],
  ])('returns null for %s', (_label, opts) => {
    expect(tileGrid(BAGHDAD.lat, BAGHDAD.lon, opts)).toBeNull();
  });

  it('uses its defaults when given no options', () => {
    const grid = tileGrid(BAGHDAD.lat, BAGHDAD.lon)!;
    expect(grid).toMatchObject({ zoom: 16, width: 320, height: 176 });
    expect(grid.tiles.length).toBeGreaterThan(0);
  });
});

describe('tileUrl', () => {
  it('points at the tile it was given', () => {
    expect(tileUrl({ x: 40847, y: 26322, left: 0, top: 0 }, 16))
      .toMatch(/^https:\/\/[abc]\.basemaps\.cartocdn\.com\/light_all\/16\/40847\/26322\.png$/);
  });

  it('spreads tiles over the provider subdomains so they fetch in parallel', () => {
    const hosts = new Set(
      [0, 1, 2].map((i) => tileUrl({ x: i, y: 0, left: 0, top: 0 }, 16).split('.')[0]),
    );
    expect(hosts.size).toBe(3);
  });
});

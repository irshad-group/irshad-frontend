/**
 * Web-Mercator tile arithmetic for the small map shown beside an office.
 *
 * The map is a grid of ordinary `<img>` tiles rather than a canvas, so it needs
 * no JavaScript, no WebGL and no map library: the server works out which tiles
 * cover the box and where each one sits, and the browser loads nine images.
 * That matters twice over here — the portal has to stay usable with JavaScript
 * off, and a directorate page is already carrying up to sixty office cards
 * before any map is added.
 */

export const TILE_SIZE = 256;

export type MapTile = {
  /** Tile column, already wrapped into the valid range for the zoom. */
  x: number;
  /** Tile row. */
  y: number;
  /** Offset of this tile's top-left corner from the box's, in CSS pixels. */
  left: number;
  top: number;
};

export type TileGrid = {
  zoom: number;
  width: number;
  height: number;
  tiles: MapTile[];
};

const isFiniteIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/**
 * The tiles covering a `width`×`height` box centred on a coordinate.
 *
 * Returns `null` for anything that cannot be placed — a missing coordinate, one
 * outside its range, or the 0,0 that this dataset uses to mean "not filled in".
 * The caller then renders the plain address, which is the same rule `mapsLink`
 * follows: no map at all beats a map of the wrong place.
 */
export function tileGrid(
  lat: number | null | undefined,
  lon: number | null | undefined,
  { zoom = 16, width = 320, height = 176 } = {},
): TileGrid | null {
  if (!isFiniteIn(lat, -90, 90) || !isFiniteIn(lon, -180, 180)) return null;
  if (lat === 0 && lon === 0) return null;
  // Mercator is undefined at the poles; the projection below divides by cos(lat).
  if (lat > 85.05 || lat < -85.05) return null;
  if (!isFiniteIn(zoom, 0, 19) || width <= 0 || height <= 0) return null;

  const scale = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  const worldX = ((lon + 180) / 360) * scale * TILE_SIZE;
  const worldY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2)
    * scale * TILE_SIZE;

  const boxLeft = worldX - width / 2;
  const boxTop = worldY - height / 2;
  const firstX = Math.floor(boxLeft / TILE_SIZE);
  const firstY = Math.floor(boxTop / TILE_SIZE);
  const lastX = Math.floor((boxLeft + width) / TILE_SIZE);
  const lastY = Math.floor((boxTop + height) / TILE_SIZE);

  const tiles: MapTile[] = [];
  for (let ty = firstY; ty <= lastY; ty++) {
    // Rows above the north edge or below the south edge have no tile at all.
    if (ty < 0 || ty >= scale) continue;
    for (let tx = firstX; tx <= lastX; tx++) {
      tiles.push({
        // Columns wrap: a box straddling the antimeridian continues from the
        // other side of the world rather than running out of map.
        x: ((tx % scale) + scale) % scale,
        y: ty,
        left: tx * TILE_SIZE - boxLeft,
        top: ty * TILE_SIZE - boxTop,
      });
    }
  }
  return { zoom, width, height, tiles };
}

/** Where a tile's image lives, on the raster basemap the portal uses. */
export function tileUrl({ x, y }: MapTile, zoom: number): string {
  // Rotating over the provider's subdomains lets a browser fetch the nine tiles
  // in parallel instead of queueing them behind one host.
  const sub = ['a', 'b', 'c'][(x + y) % 3];
  return `https://${sub}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`;
}

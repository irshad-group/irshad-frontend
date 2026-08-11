/**
 * A fixed spherical-Mercator projection of Iraq, precomputed so the home page
 * can draw the country and place real offices on it as a static SVG — no
 * client-side JavaScript, no map library, no CDN fetch.
 *
 * The outline comes from world-atlas@2.0.2 (countries-110m), projected once at
 * build-authoring time; the constants below are that projection, so any
 * lat/lon in Iraq can be placed on the same canvas at runtime on the server.
 * 110m resolution is deliberately coarse: this is wayfinding decoration, not
 * cartography.
 */

/** Canvas the path and every projected point are expressed in. */
export const IRAQ_MAP = {
  width: 600,
  height: 609,
  path:
    'M57.9 380.3L36.1 302.0L155.7 234.4L176.1 154.6L171.0 105.9L200.6 89.3' +
    'L228.2 47.1L251.3 36.5L314.3 45.4L333.1 62.6L359.0 51.1L394.0 131.4' +
    'L429.4 151.3L433.5 190.0L406.4 212.7L393.8 263.8L431.3 325.4L497.4 360.6' +
    'L525.2 409.0L516.3 454.8L533.6 454.8L534.2 488.2L563.9 521.1L532.0 518.0' +
    'L495.7 512.9L456.0 572.5L355.7 567.5L203.3 441.9L123.0 397.5L57.9 380.3Z',
} as const;

/** Mercator scale/translate fitted to the canvas above. */
const SCALE = 3094.0312024013815;
const TRANSLATE_X = -2058.7238480943824;
const TRANSLATE_Y = 2216.1024062200877;

export type MapPoint = { x: number; y: number };

/**
 * Project a WGS84 coordinate onto the Iraq canvas.
 *
 * Returns `null` for coordinates that are missing or not finite — provinces
 * are staff-entered and a blank or garbled GPS field must drop the dot, not
 * draw it at NaN and blank the whole SVG.
 */
export function projectPoint(
  lat: number | undefined | null,
  lon: number | undefined | null,
): MapPoint | null {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  // Mercator is undefined at the poles; nothing in Iraq is near one, so any
  // latitude that close is bad data.
  if (Math.abs(lat) > 85) return null;

  const x = (lon * Math.PI) / 180;
  const y = -Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return {
    x: Math.round((SCALE * x + TRANSLATE_X) * 10) / 10,
    y: Math.round((SCALE * y + TRANSLATE_Y) * 10) / 10,
  };
}

// Rough governorate bounding boxes, shared by the Maps and OSM branch passes.
//
// Used two ways: to reject a Maps result the query placed in the wrong governorate,
// and to work out which governorate an OSM feature belongs to, since OSM carries a
// coordinate but not always an `addr:province`.
//
// The boxes overlap at the edges — governorate borders are not rectangles — so
// `provinceOf` returns the box whose centre is nearest, not merely the first match.
export const BOX = {
  'IQ-BG': [32.9, 33.7, 43.9, 44.9], 'IQ-BA': [29.9, 31.3, 46.9, 48.6],
  'IQ-NI': [35.2, 37.4, 41.2, 43.9], 'IQ-AR': [35.4, 37.4, 43.2, 45.4],
  'IQ-SU': [34.7, 36.4, 44.7, 46.3], 'IQ-DA': [36.4, 37.4, 42.2, 44.4],
  'IQ-HA': [34.9, 35.6, 45.5, 46.3], 'IQ-KI': [34.7, 36.0, 43.4, 45.2],
  'IQ-AN': [32.0, 34.5, 38.7, 44.0], 'IQ-BB': [32.0, 33.1, 43.9, 45.2],
  'IQ-KA': [31.7, 32.9, 43.0, 44.5], 'IQ-NA': [29.0, 32.4, 42.0, 45.0],
  'IQ-DI': [33.2, 35.2, 44.4, 46.0], 'IQ-DQ': [30.4, 31.9, 45.4, 47.0],
  'IQ-MA': [31.0, 32.6, 46.3, 47.9], 'IQ-MU': [29.0, 31.9, 44.2, 46.2],
  'IQ-QA': [31.4, 32.4, 44.4, 45.8], 'IQ-WA': [32.0, 33.4, 44.9, 46.5],
  'IQ-SD': [33.7, 35.6, 42.9, 45.0],
};

export const inBox = (code, lat, lon) => {
  const b = BOX[code];
  return b ? lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3] : true;
};

/** Which governorate a point falls in, or null if it falls in none. */
export function provinceOf(lat, lon) {
  let best = null;
  for (const [code, b] of Object.entries(BOX)) {
    if (!inBox(code, lat, lon)) continue;
    const dLat = (b[0] + b[1]) / 2 - lat;
    const dLon = (b[2] + b[3]) / 2 - lon;
    const d = dLat * dLat + dLon * dLon;
    if (!best || d < best.d) best = { code, d };
  }
  return best?.code ?? null;
}

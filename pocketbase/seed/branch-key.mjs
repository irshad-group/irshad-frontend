/**
 * The identity of a branch office, shared by the importer and the purge.
 *
 * Branches have no unique slug in the schema, so both scripts have to agree on what
 * makes two rows the same office. They did not: the importer keyed on the Google
 * place id and fell back to directorate + title, while the purge treated a missing
 * place id as "not in the dataset" outright. That was harmless while every branch
 * came from Google Maps, and became an 887-row deletion the moment OpenStreetMap
 * started contributing offices, which carry no place id at all.
 *
 * One function, imported by both, so the two can no longer disagree.
 *
 * The fallback carries the location as well as the name, because the names are not
 * distinctive: "دائرة الكهرباء" is nine different buildings in nine governorates, and
 * "دائرة التسجيل العقاري" four more. Keyed on the name alone they collapsed into one
 * record and eight offices silently vanished. Coordinates are rounded to four decimal
 * places — about eleven metres, close enough that a re-scrape of the same building
 * lands on the same key, far enough apart that two real offices never do.
 */
const round = (n) => (typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '?');

export function branchKey({ place_id: placeId, directorate, province, title_ar: titleAr, gps_lat: lat, gps_lon: lon }) {
  if (placeId) return `place:${placeId}`;
  return [
    'dir', directorate ?? '?', province ?? '?',
    String(titleAr || '').trim(), round(lat), round(lon),
  ].join('::');
}

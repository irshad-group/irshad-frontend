// Shared matcher: normalise Arabic/Kurdish, gate on distinctive keywords.
export const stripTashkeel = (s) => (s || '').replace(/[ً-ْٰـ]/g, '');

export const norm = (s) => stripTashkeel(s)
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي')
  .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ء/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

// Words that appear in nearly every entity name and so carry no signal.
// Normalised through norm() so they match what tokens() actually produces —
// e.g. norm('دائرة') is 'دايره', not 'دائره'.
const STOP = new Set([
  'وزارة', 'العراقية', 'العراقي', 'العراق', 'اقليم', 'كردستان', 'كوردستان',
  'بغداد', 'اربيل', 'الاتحادية', 'مقر', 'العامة', 'العام', 'دائرة', 'الدائرة',
  'مديرية', 'المديرية', 'هيئة', 'الهيئة', 'في', 'حكومة', 'شؤون', 'لشؤون',
  'ministry', 'of', 'the', 'iraq', 'iraqi', 'kurdistan', 'region', 'regional',
  'government', 'baghdad', 'erbil', 'and', 'general', 'directorate', 'department',
].map((w) => norm(w)));

export const tokens = (s) => norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w));

/**
 * Gate + score a Maps place against a target entity.
 * `must` — at least one of these normalised tokens has to appear in the place name.
 * `reject` — tokens that disqualify the place outright (another entity's name).
 */
export function scorePlace(place, { must = [], reject = [], krg = false, expectMinistry = false }) {
  const n = norm(place.name);
  if (reject.some((r) => n.includes(norm(r)))) return -1;
  if (must.length && !must.some((m) => n.includes(norm(m)))) return -1;
  // Hard gate, not a penalty: a Kurdistan Region body is never in Baghdad, and a
  // high-scoring name match would otherwise outweigh a soft geographic deduction.
  if (krg && place.lat != null && place.lat < 34.8) return -1;
  let s = 0;
  for (const m of must) if (n.includes(norm(m))) s += 3;
  if (expectMinistry && /وزاره|وەزارەتی|ministry/.test(n)) s += 4;
  if (expectMinistry && /مديريه|دائره|مكتب|فرع/.test(n)) s -= 2;
  if ((place.categories || []).some((c) => /حكوم|government|دائرة/i.test(c))) s += 2;
  if (place.phone) s += 2;
  if (place.website) s += 2;
  if (place.photo) s += 1;
  if (place.rating) s += 1;
  // Geography sanity: KRG bodies sit in the north, federal ones around Baghdad.
  if (place.lat != null) {
    if (krg) s += place.lat > 34.8 ? 4 : -6;
    else s += place.lat < 35.2 ? 2 : -1;
  }
  return s;
}

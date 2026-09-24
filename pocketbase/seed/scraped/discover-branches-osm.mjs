// Second branch pass, over OpenStreetMap.
//
// The Maps pass asks a question per governorate and takes what comes back. OSM is a
// different survey with different gaps: it has "تجنيد الكرخ" and three military
// pension offices that Maps never returned for any wording tried, and Maps has
// hundreds OSM lacks. Running both and merging is the only way to get either one's
// coverage without inheriting its blind spots.
//
// Appends to branches-discovered.json rather than replacing it, and drops anything
// already found within 200 m — the same office surveyed twice is one office.
//
// Data © OpenStreetMap contributors, ODbL.
import fs from 'node:fs';
import path from 'node:path';
import { load, metres, parseOpeningHours } from './osm.mjs';
import { norm } from './match.mjs';
import { provinceOf } from './province-box.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'branch-families.json'), 'utf8'));
const existing = JSON.parse(fs.readFileSync(path.join(HERE, 'branches-discovered.json'), 'utf8'));
const osm = load();

const provByCode = Object.fromEntries(cfg.provinces.map((p) => [p.code, p]));
const KRG = new Set(['IQ-AR', 'IQ-SU', 'IQ-DA', 'IQ-HA']);
// OSM packs alternatives into one tag with semicolons — "دائرة بلدية الشعله;بلدية".
// Keep the first; the rest are the same place under another name.
const clean = (s) => (s ? String(s).split(';')[0].replace(/\s+/g, ' ').trim() : null);

// Substring matching is too loose here. OSM names are free text, so `الري` matched
// inside `والرياضة` and gave the water family a youth-and-sports directorate; `توزيع`
// matched electricity distribution and filed it under fuel. Match whole words instead,
// allowing a multi-word term to match consecutive words.
const words = (s) => norm(s).split(' ').filter(Boolean);
function containsPhrase(nameWords, phrase) {
  const p = words(phrase);
  if (!p.length) return false;
  for (let i = 0; i + p.length <= nameWords.length; i++) {
    if (p.every((w, j) => nameWords[i + j] === w)) return true;
  }
  return false;
}

// The name also has to read like an office. OSM maps the buildings a ministry runs,
// not only its counters: without this the education family collected schools, and
// electricity collected power stations and substations.
const OFFICE = /مديري|بەڕێوەبەرایەتی|فەرمانگ|دائر|شعب|مكتب|مركز|هيئ|مؤسس|بلدي|شارەوانی|directorate|department|office|centre|center|municipal/i;
const NOT_AN_OFFICE = /مدرس|ثانوي|ابتدائي|متوسط|روض|جامع(ة|ه)|كلي(ة|ه)|معهد|مستشفى|مستوصف|عياد|صيدلي|محط(ة|ه)|معمل|مصنع|مخزن|برج|شبك(ة|ه)|خزان|سد |مزرع|سوق|مسجد|كنيس|قوسیخانە|قوتابخان|نەخۆشخان|school|hospital|clinic|pharmac|factory|plant|substation|tower|university|college|institute|mosque|church|market|warehouse/i;

const matchesFamily = (names, fam) => {
  if (!names.some((n) => OFFICE.test(n)) || names.some((n) => NOT_AN_OFFICE.test(n))) return false;
  return names.some((n) => {
    const nw = words(n);
    return fam.must.some((m) => containsPhrase(nw, m));
  });
};

const added = [];
const perFamily = new Map();

for (const fam of cfg.families) {
  for (const o of osm) {
    const names = [o.tags.name, o.tags['name:ar'], o.tags['name:en'], o.tags['name:ckb']]
      .filter(Boolean).flatMap((n) => n.split(';')).map((n) => n.trim()).filter(Boolean);
    if (!names.length || !matchesFamily(names, fam)) continue;

    const code = provinceOf(o.lat, o.lon);
    if (!code) continue;
    if (fam.scope === 'krg' && !KRG.has(code)) continue;

    // Already surveyed by the Maps pass?
    const dupe = existing.some((b) => b.family === fam.key
      && metres(b.gps_lat, b.gps_lon, o.lat, o.lon) < 200);
    if (dupe) continue;
    // …or by an earlier family in this same run.
    if (added.some((b) => b.family === fam.key && metres(b.gps_lat, b.gps_lon, o.lat, o.lon) < 200)) continue;

    const prov = provByCode[code];
    const t = o.tags;
    added.push({
      family: fam.key,
      ministry_slug: fam.ministry,
      directorate_hint: fam.directorate_hint,
      province_code: code,
      province_ar: prov.ar,
      province_en: prov.en,
      krg: prov.krg,
      // title_ar is required by the schema. Some OSM features carry only a Kurdish or
      // English name; use whatever the feature actually has, and fall back to the
      // family's own "<kind> in <governorate>" phrasing only if it has none.
      title_ar: clean(t['name:ar'] || t.name || t['name:ckb'] || t['name:en'])
        || fam.title_ar.replace('{P}', prov.ar),
      title_en: fam.title_en.replace('{PE}', prov.en),
      fallback_title_ar: fam.title_ar.replace('{P}', prov.ar),
      gps_lat: o.lat,
      gps_lon: o.lon,
      phone: clean(t.phone || t['contact:phone']),
      address_ar: null,
      photo: null,
      hours: null,
      working_hours: t.opening_hours ? parseOpeningHours(t.opening_hours) : null,
      website: /^https?:\/\//i.test(t.website || '') ? t.website : null,
      maps_url: null,
      maps_rating: null,
      maps_categories: [],
      score: 10,
      _source: 'openstreetmap',
      _osm_id: o.id,
    });
    perFamily.set(fam.key, (perFamily.get(fam.key) || 0) + 1);
  }
}

fs.writeFileSync(path.join(HERE, 'branches-discovered.json'),
  JSON.stringify([...existing, ...added], null, 2));

console.log(`OSM branch pass: +${added.length} offices Maps did not have`);
for (const [k, n] of [...perFamily].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(26)} +${n}`);
console.log(`\ntotal branches now: ${existing.length + added.length}`);

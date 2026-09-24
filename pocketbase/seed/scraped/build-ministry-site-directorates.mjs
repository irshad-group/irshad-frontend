#!/usr/bin/env node
/**
 * Bodies a ministry's own website names that the dataset does not have.
 *
 * Written for Defence. Its site publishes no provincial directory at all — no
 * addresses, no branch list, and nothing in 42 news articles naming a
 * recruitment or pensions office in any governorate, which was checked before
 * concluding it. Military estate is deliberately absent from public maps and
 * the ministry does not publish it either, so provincial offices for Defence
 * are not obtainable from this source, or any other one this project uses.
 *
 * What the site does have is the rest of the ministry: a defence university, a
 * naval academy, a special-forces school, research and training centres — real,
 * publicly known institutions the dataset was missing entirely. Several are on
 * Maps, so they arrive with a location, which is more than the nine directorates
 * already recorded had between them.
 *
 *   node build-ministry-site-directorates.mjs [--dry]
 *
 * Output: ministry-site-directorates.json
 */
import fs from 'node:fs';
import { search, pool } from './gmaps.mjs';
import { norm, scorePlace, tokens } from './match.mjs';
import { provinceOf } from './province-box.mjs';
import { slugFromArabic } from './slug.mjs';
import { largePhoto } from './photo-url.mjs';

const DRY = process.argv.includes('--dry');
const CANDIDATES = JSON.parse(fs.readFileSync('ministry-site-candidates.json', 'utf8'));
const DIR = JSON.parse(fs.readFileSync('iraq-government-directory.json', 'utf8'));

/** A body, rather than a sentence about one. Same trap as the directorate pass. */
const PROSE = /\s(يحصل|يحقق|يعلن|يفتتح|تفتتح|يبحث|يناقش|يستقبل|تستقبل|ينظم|تنظم|يشارك|تشارك|يزور|تزور|يتفقد|يواصل|تواصل|يشكل|تشكل|يوقع|توقع|ينفذ|تنفذ|يقيم|تقيم|يعقد|تعقد|تطيح|انجازات|إنجازات|اختتام|بمناسبة|بالتعاون)\s/;
/** The kinds of body worth recording; anything else on these pages is a page. */
const BODY = /^(مديرية|المديرية|دائرة|الدائرة|هيئة|الهيئة|جامعة|أكاديمية|اكاديمية|كلية|مدرسة|مركز|ادارة|إدارة)(?=\s)/;

// PocketBase `slug` fields accept `[a-z0-9-]` only, so the Arabic name has to be
// transliterated — the first version of this kept the Arabic letters and the
// import refused every record with "validation_invalid_format".
const slugify = (s) => slugFromArabic(s, 'body');

function isBody(name) {
  if (!BODY.test(name.trim())) return false;
  if (name.length > 55) return false;
  if (/[:؛]|&bull;|\d{4}/.test(name)) return false;
  if (PROSE.test(` ${name} `)) return false;
  return true;
}

const MINISTRIES = ['ministry-of-defence'];
const existing = new Set(
  DIR.directorates.filter((d) => MINISTRIES.includes(d.ministry_slug)).map((d) => norm(d.title_ar)),
);

const wanted = [];
for (const target of CANDIDATES) {
  if (!MINISTRIES.includes(target.ministry) || target.directorate) continue;
  const seen = new Set();
  for (const c of target.candidates) {
    const name = c.name.replace(/^[\s.،:*•-]+|[\s.،:*•-]+$/g, '').replace(/\s+/g, ' ');
    if (!isBody(name) || existing.has(norm(name)) || seen.has(norm(name))) continue;
    seen.add(norm(name));
    wanted.push({ ministry: target.ministry, name, source: c.source, page: c.page ?? null });
  }
}
console.log(`${wanted.length} bodies named by the site that the dataset does not have:`);
for (const w of wanted) console.log(`  ${w.name}`);

let located = [];
if (!DRY && wanted.length) {
  located = await pool(wanted, 4, async (item) => {
    const must = tokens(item.name).slice(0, 3);
    const results = await search(`${item.name} العراق`);
    let best = null;
    for (const place of results) {
      if (place.lat == null || !provinceOf(place.lat, place.lon)) continue;
      const score = scorePlace(place, { must });
      if (score < 0) continue;
      // Every distinctive word back, so "مدرسة القوات الخاصة" cannot settle for
      // some other school.
      const n = norm(place.name);
      if (!must.length || !must.every((m) => n.includes(norm(m)))) continue;
      if (!best || score > best.score) best = { place, score };
    }
    return best ? { ...item, ...best } : null;
  });
  console.log(`\n${located.filter(Boolean).length} of ${wanted.length} located on Maps.`);
}

const out = wanted.map((w, i) => {
  const hit = DRY ? null : located[i];
  const place = hit?.place;
  return {
    ministry_slug: w.ministry,
    slug: slugify(w.name),
    title_ar: w.name,
    title_en: null,
    title_ku: null,
    address_ar: place?.address ?? null,
    gps_lat: place?.lat ?? null,
    gps_lon: place?.lon ?? null,
    phone: place?.phone ?? null,
    website: w.page,
    photo_url: largePhoto(place?.photo),
    place_id: place?.ftid ?? null,
    maps_url: place?.maps_url ?? null,
    province_code: place ? provinceOf(place.lat, place.lon) : null,
    archived: false,
    _source: 'ministry-site',
    _source_url: w.source,
    _confidence: hit?.score ?? null,
  };
});

fs.writeFileSync('ministry-site-directorates.json', JSON.stringify(out, null, 1));
for (const d of out.filter((d) => d.gps_lat)) {
  console.log(`  ${d.province_code}  ${d.title_ar.padEnd(40)} ${String(d.address_ar || '').slice(0, 46)}`);
}

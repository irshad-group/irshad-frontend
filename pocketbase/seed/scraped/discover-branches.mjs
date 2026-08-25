// For each directorate that runs a provincial office network, search Maps once per
// province. Only offices Maps actually returns become branches — nothing is invented.
import fs from 'node:fs';
import path from 'node:path';
import { search, pool } from './gmaps.mjs';
import { scorePlace, norm } from './match.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'branch-families.json'), 'utf8'));

// Rough province bounding boxes, used to throw out results Maps placed in the wrong governorate.
const BOX = {
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
const inBox = (code, lat, lon) => {
  const b = BOX[code];
  return b ? lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3] : true;
};

const jobs = [];
for (const fam of cfg.families) for (const prov of cfg.provinces) jobs.push({ fam, prov });

let done = 0;
const nested = await pool(jobs, 6, async ({ fam, prov }) => {
  const q = fam.query.replace('{P}', prov.ar);
  const hits = await search(q, { lang: 'ar' });
  const kept = hits
    .map((p) => ({ p, s: scorePlace(p, { must: fam.must, krg: prov.krg }) }))
    .filter((r) => r.s > 0 && r.p.lat != null && inBox(prov.code, r.p.lat, r.p.lon))
    .sort((a, b) => b.s - a.s)
    .slice(0, 4);   // a province can genuinely run several offices of one kind
  done += 1;
  if (done % 25 === 0) console.log(`  ... ${done}/${jobs.length} queries`);
  return kept.map(({ p, s }) => ({
    family: fam.key,
    ministry_slug: fam.ministry,
    directorate_hint: fam.directorate_hint,
    province_code: prov.code,
    province_ar: prov.ar,
    province_en: prov.en,
    krg: prov.krg,
    title_ar: p.name,
    title_en: fam.title_en.replace('{PE}', prov.en),
    fallback_title_ar: fam.title_ar.replace('{P}', prov.ar),
    gps_lat: p.lat, gps_lon: p.lon,
    phone: p.phone ?? null,
    address_ar: p.address ?? null,
    photo: p.photo ?? null,
    hours: p.hours ?? null,
    website: p.website ?? null,
    maps_url: p.maps_url ?? null,
    maps_rating: p.rating ?? null,
    maps_categories: p.categories ?? [],
    score: s,
  }));
});

const seenPlace = new Set();
const out = [];
for (const grp of nested) for (const b of (grp || [])) {
  const k = b.maps_url || `${b.title_ar}@${b.gps_lat},${b.gps_lon}`;
  if (seenPlace.has(k)) continue;      // one office can answer two family queries
  seenPlace.add(k);
  out.push(b);
}
for (const fam of cfg.families) {
  console.log(`${fam.key.padEnd(26)} -> ${out.filter((b) => b.family === fam.key).length} branches`);
}

fs.writeFileSync(path.join(HERE, 'branches-discovered.json'), JSON.stringify(out, null, 2));
console.log(`\nTOTAL branches: ${out.length}`);
console.log(`  with phone: ${out.filter((b) => b.phone).length}`);
console.log(`  with photo: ${out.filter((b) => b.photo).length}`);
console.log(`  with hours: ${out.filter((b) => b.hours).length}`);

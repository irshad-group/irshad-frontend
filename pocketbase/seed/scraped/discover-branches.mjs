// For each directorate that runs a provincial office network, search Maps once per
// province. Only offices Maps actually returns become branches — nothing is invented.
import fs from 'node:fs';
import path from 'node:path';
import { search, pool } from './gmaps.mjs';
import { scorePlace, norm } from './match.mjs';
import { inBox } from './province-box.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'branch-families.json'), 'utf8'));

// A family is only searched where the body it names can actually exist. A Kurdistan
// Region directorate has no office in Basra, and querying for one returns a federal
// office with a similar name — noise dressed as coverage.
const KRG_PROVINCES = new Set(['IQ-AR', 'IQ-SU', 'IQ-DA', 'IQ-HA']);
const inScope = (fam, prov) => (fam.scope === 'krg' ? KRG_PROVINCES.has(prov.code) : true);

const jobs = [];
for (const fam of cfg.families) {
  for (const prov of cfg.provinces) if (inScope(fam, prov)) jobs.push({ fam, prov });
}
console.log(`${cfg.families.length} families over ${cfg.provinces.length} governorates -> ${jobs.length} queries`);

let done = 0;
const nested = await pool(jobs, 6, async ({ fam, prov }) => {
  const q = fam.query.replace('{P}', prov.ar);
  const hits = await search(q, { lang: 'ar' });
  const kept = hits
    .map((p) => ({ p, s: scorePlace(p, { must: fam.must, krg: fam.scope === 'krg' || prov.krg }) }))
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
